import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail, IsString, IsOptional, MinLength, MaxLength,
  Matches, IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'acme-corp', description: 'Unique URL-friendly identifier' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase alphanumeric with hyphens only.' })
  @MinLength(3)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  slug!: string;

  @ApiProperty({ example: 'contact@acme.com' })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email!: string;

  @ApiPropertyOptional({ example: '04.252.011/0001-10' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  document?: string;

  @ApiPropertyOptional({ example: '+55 11 99999-9999' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'https://acme.com' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional({ example: 'America/Sao_Paulo' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  timezone?: string;

  @ApiPropertyOptional({ example: 'pt-BR' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;

  // Owner user details
  @ApiProperty({ example: 'João Silva', description: 'Name of the account owner' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  ownerName!: string;

  @ApiProperty({ example: 'joao@acme.com', description: 'Email of the account owner' })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  ownerEmail!: string;

  @ApiProperty({ example: 'S3nh@Forte123', description: 'Password for the owner account' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  ownerPassword!: string;
}
