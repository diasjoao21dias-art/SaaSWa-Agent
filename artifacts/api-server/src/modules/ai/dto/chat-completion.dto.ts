import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, IsUUID, Min, Max, MinLength } from 'class-validator';

export class ChatCompletionDto {
  @ApiProperty({ description: 'Agent UUID to use for the completion' })
  @IsUUID()
  agentId!: string;

  @ApiProperty({ description: 'User message' })
  @IsString() @MinLength(1)
  message!: string;

  @ApiPropertyOptional({ description: 'Previous messages for context' })
  @IsOptional() @IsArray()
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export class TestPromptDto {
  @ApiProperty({ description: 'System prompt to test' })
  @IsString() @MinLength(10)
  systemPrompt!: string;

  @ApiProperty({ description: 'Test user message' })
  @IsString() @MinLength(1)
  userMessage!: string;

  @ApiPropertyOptional({ default: 'gpt-4o-mini' })
  @IsOptional() @IsString()
  model?: string;

  @ApiPropertyOptional({ default: 0.7 })
  @IsOptional() @IsNumber() @Min(0) @Max(2)
  temperature?: number;
}
