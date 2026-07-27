import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsArray, MinLength, MaxLength } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({ example: 'CRM Webhook' })
  @IsString() @MinLength(2) @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'https://mycrm.com/webhooks/whatsapp' })
  @IsUrl() @MaxLength(2000)
  url!: string;

  @ApiPropertyOptional({ description: 'HMAC secret for signature verification' })
  @IsOptional() @IsString() @MaxLength(255)
  secret?: string;

  @ApiProperty({ description: 'Events to subscribe', example: ['message.received', 'conversation.closed'] })
  @IsArray() @IsString({ each: true })
  events!: string[];
}
