import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '../../common/constants';
import type { TenantContext } from '../../common/types/authenticated-request.type';

@ApiTags('Agents')
@ApiBearerAuth('access-token')
@Controller({ path: 'agents', version: '1' })
export class AgentsController {
  constructor(private readonly service: AgentsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new AI agent' })
  create(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateAgentDto) {
    return this.service.create(tenant.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all AI agents' })
  findAll(@CurrentTenant() tenant: TenantContext, @Query() pagination: PaginationDto) {
    return this.service.findAll(tenant.id, pagination);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.service.findById(id, tenant.id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  update(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.service.update(id, tenant.id, dto);
  }

  @Patch(':id/activate')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate an agent so it starts responding' })
  activate(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.service.activate(id, tenant.id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  deactivate(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.service.deactivate(id, tenant.id);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentTenant() tenant: TenantContext, @Param('id') id: string): Promise<void> {
    await this.service.remove(id, tenant.id);
  }
}
