import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

enum ConversationStatus { BOT = 'BOT', HUMAN = 'HUMAN', WAITING = 'WAITING', CLOSED = 'CLOSED', ARCHIVED = 'ARCHIVED' }

export class ConversationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ConversationStatus })
  @IsOptional() @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  agentId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  humanOperatorId?: string;

  @ApiPropertyOptional({ description: 'Search by customer phone or name' })
  @IsOptional() @IsString()
  search?: string;
}
