import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';

enum KnowledgeBaseType { FAQ = 'FAQ', DOCUMENT = 'DOCUMENT', URL = 'URL', MANUAL = 'MANUAL', DATABASE = 'DATABASE' }

export class CreateKnowledgeBaseDto {
  @ApiProperty({ example: 'FAQ Produtos 2025' })
  @IsString() @MinLength(2) @MaxLength(255)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: KnowledgeBaseType, default: KnowledgeBaseType.MANUAL })
  @IsOptional() @IsEnum(KnowledgeBaseType)
  type?: KnowledgeBaseType;
}
