import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, MaxLength, Matches } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: '+5511999998888' })
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Invalid phone number format.' })
  phone!: string;

  @ApiPropertyOptional({ example: 'João Cliente' })
  @IsOptional() @IsString() @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Custom CRM fields as JSON object' })
  @IsOptional()
  customFields?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Internal notes about this customer' })
  @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;
}
