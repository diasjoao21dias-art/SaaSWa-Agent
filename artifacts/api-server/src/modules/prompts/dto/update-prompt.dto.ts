import { PartialType } from '@nestjs/swagger';
import { CreatePromptDto } from './create-prompt.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePromptDto extends PartialType(CreatePromptDto) {
  @ApiPropertyOptional({ description: 'Note about what changed in this version' })
  @IsOptional() @IsString() @MaxLength(500)
  changeNote?: string;
}
