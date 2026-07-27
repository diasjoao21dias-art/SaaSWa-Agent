import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsNumber, IsBoolean, IsInt, IsArray, Min,
  MinLength, MaxLength, Matches, IsEnum,
} from 'class-validator';

enum BillingInterval { MONTHLY = 'MONTHLY', YEARLY = 'YEARLY', ONE_TIME = 'ONE_TIME' }

export class CreatePlanDto {
  @ApiProperty({ example: 'Profissional' })
  @IsString() @MinLength(2) @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'profissional' })
  @IsString() @Matches(/^[a-z0-9-]+$/) @MaxLength(50)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 297.00 })
  @IsNumber() @Min(0)
  priceMonthly!: number;

  @ApiProperty({ example: 2970.00 })
  @IsNumber() @Min(0)
  priceYearly!: number;

  @ApiPropertyOptional({ default: 14 })
  @IsOptional() @IsInt() @Min(0)
  trialDays?: number;

  @ApiPropertyOptional({ enum: BillingInterval, default: BillingInterval.MONTHLY })
  @IsOptional() @IsEnum(BillingInterval)
  billingInterval?: BillingInterval;

  @ApiPropertyOptional({ default: 3 }) @IsOptional() @IsInt() @Min(1) maxWhatsappNums?: number;
  @ApiPropertyOptional({ default: 3 }) @IsOptional() @IsInt() @Min(1) maxAgents?: number;
  @ApiPropertyOptional({ default: 10 }) @IsOptional() @IsInt() @Min(1) maxUsers?: number;
  @ApiPropertyOptional({ default: 2000 }) @IsOptional() @IsInt() @Min(1) maxConvMonth?: number;
  @ApiPropertyOptional({ default: 5000 }) @IsOptional() @IsInt() @Min(1) maxMsgDay?: number;
  @ApiPropertyOptional({ default: 500 }) @IsOptional() @IsInt() @Min(1) maxKnowledgeDocs?: number;
  @ApiPropertyOptional({ default: 5 }) @IsOptional() @IsInt() @Min(1) maxStorageGb?: number;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) aiModelsAllowed?: string[];
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isPublic?: boolean;
}
