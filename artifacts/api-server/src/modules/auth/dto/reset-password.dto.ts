import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'One-time reset token received via email',
    example: 'a1b2c3d4-...',
  })
  @IsString()
  token!: string;

  @ApiProperty({
    description:
      'New password — min 8 chars, must contain uppercase, lowercase, number and special char',
    example: 'NovaS3nh@Forte',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain uppercase, lowercase, number and special character.',
  })
  newPassword!: string;
}
