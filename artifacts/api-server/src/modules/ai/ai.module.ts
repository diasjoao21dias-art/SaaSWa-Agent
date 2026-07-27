import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PromptBuilderService } from './prompt-builder.service';
import { AgentsModule } from '../agents/agents.module';
import { OpenAiModule } from '../../openai/openai.module';

/**
 * AiModule — Módulo de Inteligência Artificial
 *
 * Providers:
 *   - AiService          — regras de negócio de geração de IA
 *   - PromptBuilderService — montagem automática do system prompt
 *
 * Imports:
 *   - AgentsModule       — acesso ao repositório de agentes
 *   - OpenAiModule       — cliente da OpenAI Responses API
 *
 * CacheService e PrismaService são @Global() — não precisam ser importados.
 */
@Module({
  imports: [
    AgentsModule,   // AgentsRepository (carrega configuração do agente)
    OpenAiModule,   // OpenAiResponsesService (chamadas HTTP para OpenAI)
  ],
  controllers: [AiController],
  providers: [
    AiService,
    PromptBuilderService,
  ],
  exports: [
    AiService,
    PromptBuilderService,
  ],
})
export class AiModule {}
