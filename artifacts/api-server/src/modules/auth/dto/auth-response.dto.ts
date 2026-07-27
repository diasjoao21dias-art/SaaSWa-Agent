import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() name!: string;
  @ApiProperty() role!: string;
  @ApiProperty() tenantId!: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Short-lived JWT access token (15 minutes)' })
  accessToken!: string;

  @ApiProperty({ description: 'Long-lived refresh token (7 days)' })
  refreshToken!: string;

  @ApiProperty({ description: 'Access token expiration in seconds', example: 900 })
  expiresIn!: number;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
