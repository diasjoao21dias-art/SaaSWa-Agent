import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';

enum MessageType { TEXT = 'TEXT', IMAGE = 'IMAGE', AUDIO = 'AUDIO', VIDEO = 'VIDEO', DOCUMENT = 'DOCUMENT' }

export class SendMessageDto {
  @ApiProperty({ description: 'Message text content' })
  @IsString() @MinLength(1) @MaxLength(4096)
  content!: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.TEXT })
  @IsOptional() @IsEnum(MessageType)
  type?: MessageType;
}
