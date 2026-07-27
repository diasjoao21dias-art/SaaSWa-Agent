import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipTenantGuard } from '../../common/decorators/skip-tenant-guard.decorator';
import { UserRole } from '../../common/constants';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';

@ApiTags('Tenants')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'tenants', version: '1' })
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new tenant (company) with its owner account' })
  async register(@Body() dto: CreateTenantDto) {
    return this.service.create(dto);
  }

  @SkipTenantGuard()
  @Roles(UserRole.OWNER)
  @Get()
  @ApiOperation({ summary: 'List all tenants (platform admin only)' })
  @ApiPaginatedResponse(TenantResponseDto)
  async findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update tenant configuration' })
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a tenant' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
