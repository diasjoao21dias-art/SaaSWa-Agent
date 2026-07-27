import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional() document?: string;
  @ApiProperty() email!: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() website?: string;
  @ApiProperty() status!: string;
  @ApiProperty() timezone!: string;
  @ApiProperty() locale!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
