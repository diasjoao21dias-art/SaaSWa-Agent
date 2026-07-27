import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsUrl,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsPhoneNumber,
  Matches,
} from 'class-validator';

export enum OutboundMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
  LOCATION = 'location',
}

export class SendMessageDto {
  @ApiProperty({ description: 'Número do destinatário com DDI (ex: 5511999999999)', example: '5511999999999' })
  @IsString()
  @Matches(/^\d{10,15}$/, { message: 'recipientPhone deve conter apenas dígitos (10-15), com DDI incluído' })
  recipientPhone!: string;

  @ApiProperty({ enum: OutboundMessageType, description: 'Tipo da mensagem a enviar' })
  @IsEnum(OutboundMessageType)
  type!: OutboundMessageType;

  // ─── TEXT ─────────────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Texto da mensagem (obrigatório para type=text)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  text?: string;

  // ─── MEDIA (image, audio, video, document) ─────────────────────────────────────
  @ApiPropertyOptional({ description: 'URL pública do arquivo de mídia (imagem, áudio, vídeo, documento, PDF)' })
  @IsOptional()
  @IsUrl()
  mediaUrl?: string;

  @ApiPropertyOptional({ description: 'Legenda da mídia (para image, video, document)' })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  caption?: string;

  @ApiPropertyOptional({ description: 'Nome do arquivo exibido no WhatsApp (obrigatório para type=document)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  // ─── LOCATION ──────────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Latitude (obrigatório para type=location)', example: -23.5505 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude (obrigatório para type=location)', example: -46.6333 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Nome do local (opcional para type=location)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationName?: string;

  @ApiPropertyOptional({ description: 'Endereço do local (opcional para type=location)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  locationAddress?: string;
}
