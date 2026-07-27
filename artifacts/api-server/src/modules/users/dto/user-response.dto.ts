import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() email!: string;
  @ApiProperty() name!: string;
  @ApiProperty() role!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() lastLoginAt?: Date;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
