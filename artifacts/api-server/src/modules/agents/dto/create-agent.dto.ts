import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsNumber, IsBoolean, IsInt, Min, Max,
  MinLength, MaxLength, IsArray, IsUUID,
} from 'class-validator';

export class CreateAgentDto {
  @ApiProperty({
    example: 'Assistente de Vendas',
    description: 'Nome do agente. Exibido para o cliente e usado na seção de identidade do prompt.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    example: 'Sou especialista em planos de saúde empresariais. Falo de forma clara e empática, evito jargões técnicos e sempre ofereço exemplos práticos. Meu objetivo é ajudar o cliente a encontrar o plano ideal para sua equipe.',
    description: [
      'Personalidade do agente — define o caráter, tom e modo de falar.',
      '',
      'Este campo alimenta diretamente a seção "# Personalidade" do system prompt montado automaticamente.',
      '',
      'Dicas de preenchimento:',
      '  • Descreva o especialidade e o perfil do atendente (ex: "especialista em..."),',
      '  • Defina o tom de comunicação (ex: "falo de forma direta, sem rodeios"),',
      '  • Adicione restrições de comportamento (ex: "nunca menciono concorrentes"),',
      '  • Informe o objetivo principal (ex: "meu objetivo é gerar leads qualificados").',
    ].join('\n'),
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ description: 'UUID do Prompt vinculado (instruções principais do sistema)' })
  @IsOptional()
  @IsUUID()
  promptId?: string;

  @ApiPropertyOptional({ description: 'UUID da base de conhecimento a conectar' })
  @IsOptional()
  @IsUUID()
  knowledgeBaseId?: string;

  @ApiPropertyOptional({
    default: 'gpt-4o-mini',
    description: 'Modelo OpenAI a usar. Deve ser compatível com a Responses API.',
    enum: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'o4-mini'],
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({
    default: 0.7,
    minimum: 0,
    maximum: 2,
    description: [
      'Temperatura de amostragem (0–2).',
      '',
      'Além de controlar a aleatoriedade do modelo, a temperatura também determina',
      'o estilo de comunicação injetado automaticamente no prompt:',
      '  0.0–0.3 → Formal e técnico',
      '  0.4–0.6 → Profissional e objetivo',
      '  0.7–0.9 → Amigável e natural (recomendado para atendimento ao cliente)',
      '  1.0–1.3 → Descontraído e expressivo',
      '  1.4–2.0 → Criativo e variado',
    ].join('\n'),
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({
    default: 1024,
    description: 'Limite máximo de tokens na resposta gerada (max_output_tokens na Responses API).',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(16_384)
  maxTokens?: number;

  @ApiPropertyOptional({
    default: 10,
    description: 'Número de mensagens anteriores incluídas no contexto enviado para a IA.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  contextWindowSize?: number;

  @ApiPropertyOptional({
    example: 'Olá! 😊 Sou a Ana, assistente virtual da Acme. Como posso te ajudar hoje?',
    description: 'Mensagem enviada automaticamente quando uma nova conversa é iniciada.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  welcomeMessage?: string;

  @ApiPropertyOptional({
    example: 'Desculpe, não consegui entender sua solicitação. Pode reformular ou digitar "humano" para falar com um atendente?',
    description: 'Mensagem enviada quando a IA não consegue gerar uma resposta adequada.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fallbackMessage?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Habilita a transferência automática para atendente humano quando palavras-chave são detectadas.',
  })
  @IsOptional()
  @IsBoolean()
  humanHandoffEnabled?: boolean;

  @ApiPropertyOptional({
    example: ['humano', 'atendente', 'falar com pessoa', 'quero suporte'],
    description: 'Palavras ou frases que disparam a transferência para humano.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  handoffKeywords?: string[];

  @ApiPropertyOptional({
    default: 60,
    description: 'Minutos sem resposta do cliente antes de encerrar a conversa automaticamente.',
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  inactivityTimeout?: number;
}
