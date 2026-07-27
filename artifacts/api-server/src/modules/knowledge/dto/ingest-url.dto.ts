import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, MaxLength, MinLength, IsOptional } from 'class-validator';

export class IngestUrlDto {
  @ApiProperty({ example: 'https://docs.minha-empresa.com/politica-devolucao' })
  @IsUrl({}, { message: 'url deve ser uma URL válida' })
  @MaxLength(2000)
  url!: string;

  @ApiPropertyOptional({ example: 'Política de Devolução' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  title?: string;
}
