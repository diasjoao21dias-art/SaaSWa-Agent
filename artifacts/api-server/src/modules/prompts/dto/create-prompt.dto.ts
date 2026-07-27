import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MinLength, MaxLength, IsArray } from 'class-validator';

enum PromptType { SYSTEM = 'SYSTEM', USER = 'USER', FEW_SHOT = 'FEW_SHOT', INSTRUCTION = 'INSTRUCTION', CONTEXT = 'CONTEXT' }

export class CreatePromptDto {
  @ApiProperty({ example: 'Assistente de Vendas B2B' })
  @IsString() @MinLength(2) @MaxLength(255)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'The prompt text. Supports {{variable}} placeholders.' })
  @IsString() @MinLength(10)
  content!: string;

  @ApiPropertyOptional({ enum: PromptType, default: PromptType.SYSTEM })
  @IsOptional() @IsEnum(PromptType)
  type?: PromptType;

  @ApiPropertyOptional({ description: 'Available variables: ["customerName", "companyName"]' })
  @IsOptional() @IsArray() @IsString({ each: true })
  variables?: string[];
}
