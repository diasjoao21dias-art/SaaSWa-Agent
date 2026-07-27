import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail, IsString, IsOptional, MinLength, MaxLength,
  IsEnum, Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../../common/constants';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria Santos' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'maria@empresa.com' })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({ example: 'Senha@2025', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase and number.',
  })
  password!: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.AGENT })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: '+55 11 98765-4321' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
