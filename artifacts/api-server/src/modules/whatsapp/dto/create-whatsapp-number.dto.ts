import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CreateWhatsappNumberDto {
  @ApiProperty({ example: 'acme-support-01', description: 'Unique instance name in Evolution API' })
  @IsString() @MinLength(3) @MaxLength(255)
  instanceName!: string;

  @ApiPropertyOptional({ example: 'Suporte ao Cliente' })
  @IsOptional() @IsString() @MaxLength(255)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Agent UUID to assign to this number' })
  @IsOptional() @IsUUID()
  agentId?: string;
}
