import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AgentsRepository } from '../agents/agents.repository';
import { NotFoundException } from '../../common/exceptions/not-found.exception';
import type { ChatCompletionDto, TestPromptDto } from './dto/chat-completion.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly agentsRepo: AgentsRepository,
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('openai.apiKey'),
      organization: this.configService.get<string | undefined>('openai.organization'),
      timeout: this.configService.get<number>('openai.timeoutMs', 30000),
    });
  }

  async listAvailableModels() {
    return [
      { id: 'gpt-4o', name: 'GPT-4o', maxTokens: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 128000 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 128000 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 16385 },
    ];
  }

  async chatCompletion(tenantId: string, dto: ChatCompletionDto) {
    const agent = await this.agentsRepo.findById(dto.agentId, tenantId);
    if (!agent) throw new NotFoundException('Agent', dto.agentId);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (agent.prompt?.content) {
      messages.push({ role: 'system', content: agent.prompt.content });
    }

    if (dto.history) {
      for (const h of dto.history) {
        messages.push({ role: h.role, content: h.content });
      }
    }

    messages.push({ role: 'user', content: dto.message });

    const start = Date.now();
    const completion = await this.openai.chat.completions.create({
      model: agent.model,
      messages,
      temperature: agent.temperature,
      max_tokens: agent.maxTokens,
    });

    return {
      reply: completion.choices[0]?.message?.content ?? '',
      model: agent.model,
      tokensInput: completion.usage?.prompt_tokens ?? 0,
      tokensOutput: completion.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - start,
    };
  }

  async testPrompt(dto: TestPromptDto) {
    const start = Date.now();
    const completion = await this.openai.chat.completions.create({
      model: dto.model ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: dto.systemPrompt },
        { role: 'user', content: dto.userMessage },
      ],
      temperature: dto.temperature ?? 0.7,
      max_tokens: 512,
    });

    return {
      reply: completion.choices[0]?.message?.content ?? '',
      model: dto.model ?? 'gpt-4o-mini',
      tokensInput: completion.usage?.prompt_tokens ?? 0,
      tokensOutput: completion.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - start,
    };
  }
}
