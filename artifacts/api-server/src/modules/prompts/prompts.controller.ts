import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PromptsService } from './prompts.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants';
import type { TenantContext, JwtPayload } from '../../common/types/authenticated-request.type';

@ApiTags('Prompts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller({ path: 'prompts', version: '1' })
export class PromptsController {
  constructor(private readonly service: PromptsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new system prompt' })
  create(@CurrentTenant() tenant: TenantContext, @Body() dto: CreatePromptDto) {
    return this.service.create(tenant.id, dto);
  }

  @Get()
  findAll(@CurrentTenant() tenant: TenantContext, @Query() pagination: PaginationDto) {
    return this.service.findAll(tenant.id, pagination);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.service.findById(id, tenant.id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a prompt (creates a new version automatically)' })
  update(@CurrentTenant() tenant: TenantContext, @CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdatePromptDto) {
    return this.service.update(id, tenant.id, dto, user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentTenant() tenant: TenantContext, @Param('id') id: string): Promise<void> {
    await this.service.remove(id, tenant.id);
  }
}
