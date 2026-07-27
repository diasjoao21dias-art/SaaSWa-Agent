import { PartialType } from '@nestjs/swagger';
import { CreateAgentDto } from './create-agent.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';

enum AgentStatus { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', DRAFT = 'DRAFT' }

export class UpdateAgentDto extends PartialType(CreateAgentDto) {
  @ApiPropertyOptional({ enum: AgentStatus })
  @IsOptional() @IsEnum(AgentStatus)
  status?: AgentStatus;
}
