import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Plan UUID to subscribe to' })
  @IsUUID()
  planId!: string;

  @ApiPropertyOptional({ description: 'External payment gateway subscription ID' })
  @IsOptional() @IsString()
  externalId?: string;

  @ApiPropertyOptional({ description: 'External payment gateway customer ID' })
  @IsOptional() @IsString()
  externalCustomerId?: string;
}
