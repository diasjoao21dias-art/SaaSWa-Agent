import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional } from 'class-validator';

export class EvolutionWebhookDto {
  @ApiProperty({ description: 'Evolution API event type' })
  @IsString()
  event!: string;

  @ApiProperty({ description: 'WhatsApp instance name' })
  @IsString()
  instance!: string;

  @ApiProperty({ description: 'Event payload data' })
  @IsObject()
  data!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  sender?: string;
}
