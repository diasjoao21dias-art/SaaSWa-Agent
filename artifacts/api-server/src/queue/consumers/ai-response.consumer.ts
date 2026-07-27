import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WhatsappOutboundProducer } from '../producers/whatsapp-outbound.producer';
import {
  QUEUE_AI_RESPONSE,
  JOB_SEND_AI_RESPONSE,
} from '../queue.constants';
import type { AiResponseJobData } from '../producers/ai-response.producer';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

const CONTEXT_WINDOW_SIZE = 10;

@Processor(QUEUE_AI_RESPONSE, { concurrency: 5 })
export class AiResponseConsumer extends WorkerHost {
  private readonly logger = new Logger(AiResponseConsumer.name);
  private readonly openai: OpenAI;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(WhatsappOutboundProducer)
    private readonly outboundProducer: WhatsappOutboundProducer,
    private readonly configService: ConfigService,
  ) {
    super();
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('openai.apiKey'),
      organization: this.configService.get<string | undefined>('openai.organization'),
      timeout: this.configService.get<number>('openai.timeoutMs', 30000),
    });
  }

  async process(job: Job<AiResponseJobData>): Promise<void> {
    if (job.name !== JOB_SEND_AI_RESPONSE) return;

    const { conversationId, agentId, whatsappNumberInstanceName, messageId } = job.data;

    // Load agent config
    const agent = await this.prisma.aiAgent.findUnique({
      where: { id: agentId, deletedAt: null },
      include: { prompt: true },
    });

    if (!agent || agent.status !== 'ACTIVE') {
      this.logger.warn(`Agent ${agentId} not found or inactive. Skipping.`);
      return;
    }

    // Load recent conversation history
    const recentMessages = await this.prisma.message.findMany({
      where: { conversationId, deletedAt: null, role: { in: ['USER', 'ASSISTANT'] } },
      orderBy: { createdAt: 'desc' },
      take: CONTEXT_WINDOW_SIZE,
      select: { role: true, content: true },
    });

    // Reverse to chronological order
    const history = recentMessages.reverse();

    // Build OpenAI messages array
    const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (agent.prompt?.content) {
      openAiMessages.push({ role: 'system', content: agent.prompt.content });
    }

    for (const msg of history) {
      openAiMessages.push({
        role: msg.role === 'USER' ? 'user' : 'assistant',
        content: msg.content ?? '',
      });
    }

    const startTime = Date.now();

    // Call OpenAI
    const completion = await this.openai.chat.completions.create({
      model: agent.model,
      messages: openAiMessages,
      temperature: agent.temperature,
      max_tokens: agent.maxTokens,
      top_p: agent.topP,
      presence_penalty: agent.presencePenalty,
      frequency_penalty: agent.frequencyPenalty,
    });

    const processingTimeMs = Date.now() - startTime;
    const choice = completion.choices[0];
    const responseText = choice?.message?.content ?? agent.fallbackMessage ?? 'Desculpe, não consegui processar sua mensagem.';
    const tokensInput = completion.usage?.prompt_tokens ?? 0;
    const tokensOutput = completion.usage?.completion_tokens ?? 0;

    // Save assistant response
    const savedResponse = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        type: 'TEXT',
        content: responseText,
        status: 'SENT',
        tokensInput,
        tokensOutput,
        processingTimeMs,
        aiModel: agent.model,
        sentAt: new Date(),
      },
    });

    // Update conversation lastMessageAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Enqueue outbound message
    await this.outboundProducer.enqueue({
      tenantId: job.data.tenantId,
      conversationId,
      messageId: savedResponse.id,
      instanceName: whatsappNumberInstanceName,
      recipientPhone: job.data.customerPhone,
      content: responseText,
      messageType: 'text',
    });

    this.logger.debug(
      `AI response generated for conversation ${conversationId} — ${processingTimeMs}ms, ${tokensInput}in/${tokensOutput}out tokens`,
    );

    // Mark original message as processed (update reference)
    await this.prisma.message.update({
      where: { id: messageId },
      data: { metadata: { processed: true, processingMs: processingTimeMs } },
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`AI job ${job.id} failed: ${error.message}`, error.stack);
  }
}
