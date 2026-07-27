import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsNumber, IsArray,
  IsUUID, Min, Max, MinLength, MaxLength,
} from 'class-validator';

export class ChatCompletionDto {
  @ApiProperty({ description: 'UUID do agente a usar' })
  @IsUUID()
  agentId!: string;

  @ApiProperty({ description: 'Mensagem do usuário' })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  message!: string;

  @ApiPropertyOptional({
    description: 'Histórico de mensagens anteriores para manter contexto',
    type: 'array',
    items: { type: 'object', properties: { role: { type: 'string' }, content: { type: 'string' } } },
  })
  @IsOptional()
  @IsArray()
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export class TestPromptDto {
  @ApiProperty({
    description: 'System prompt a testar (será enviado como `instructions` para a Responses API)',
    example: 'Você é um especialista em seguros. Responda de forma técnica mas acessível.',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(10_000)
  systemPrompt!: string;

  @ApiProperty({
    description: 'Mensagem do usuário para testar',
    example: 'Qual a diferença entre seguro de vida e seguro de vida resgatável?',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  userMessage!: string;

  @ApiPropertyOptional({
    default: 'gpt-4o-mini',
    description: 'Modelo OpenAI a usar. Deve ser compatível com a Responses API.',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    default: 0.7,
    minimum: 0,
    maximum: 2,
    description: 'Temperatura. Afeta tanto a aleatoriedade quanto o estilo inferido pelo PromptBuilderService.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;
}
