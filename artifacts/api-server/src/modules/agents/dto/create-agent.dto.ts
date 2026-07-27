import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsNumber, IsBoolean, IsInt, Min, Max,
  MinLength, MaxLength, IsArray, IsUUID,
} from 'class-validator';

export class CreateAgentDto {
  @ApiProperty({ example: 'Assistente de Vendas' })
  @IsString() @MinLength(2) @MaxLength(255)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'UUID of the system prompt to use' })
  @IsOptional() @IsUUID()
  promptId?: string;

  @ApiPropertyOptional({ description: 'UUID of the knowledge base to attach' })
  @IsOptional() @IsUUID()
  knowledgeBaseId?: string;

  @ApiPropertyOptional({ default: 'gpt-4o-mini' })
  @IsOptional() @IsString() @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ default: 0.7, minimum: 0, maximum: 2 })
  @IsOptional() @IsNumber() @Min(0) @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ default: 1024 })
  @IsOptional() @IsInt() @Min(1) @Max(16384)
  maxTokens?: number;

  @ApiPropertyOptional({ default: 10, description: 'Number of previous messages to include as context' })
  @IsOptional() @IsInt() @Min(1) @Max(50)
  contextWindowSize?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(2000)
  welcomeMessage?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  fallbackMessage?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  humanHandoffEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Keywords that trigger handoff to human operator' })
  @IsOptional() @IsArray() @IsString({ each: true })
  handoffKeywords?: string[];

  @ApiPropertyOptional({ default: 60, description: 'Minutes of inactivity before closing conversation' })
  @IsOptional() @IsInt() @Min(5) @Max(1440)
  inactivityTimeout?: number;
}
