import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class IdParamDto {
  @ApiProperty({ description: 'Resource UUID', format: 'uuid' })
  @IsUUID('4')
  id!: string;
}
