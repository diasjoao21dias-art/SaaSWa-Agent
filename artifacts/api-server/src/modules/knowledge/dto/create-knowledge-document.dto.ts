import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsUUID } from 'class-validator';

export class CreateKnowledgeDocumentDto {
  @ApiProperty({ example: 'Política de Devolução' })
  @IsString() @MinLength(2) @MaxLength(500)
  title!: string;

  @ApiProperty({ description: 'Document content or answer text' })
  @IsString() @MinLength(5)
  content!: string;

  @ApiPropertyOptional({ description: 'For FAQ type: the question text' })
  @IsOptional() @IsString() @MaxLength(1000)
  question?: string;

  @ApiPropertyOptional({ description: 'For FAQ type: the answer text' })
  @IsOptional() @IsString()
  answer?: string;

  @ApiPropertyOptional({ description: 'Source URL if content comes from a webpage' })
  @IsOptional() @IsString() @MaxLength(2000)
  sourceUrl?: string;
}
