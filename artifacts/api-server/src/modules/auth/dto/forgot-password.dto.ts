import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'usuario@empresa.com.br',
    description: 'Email address associated with the account',
  })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email!: string;
}
