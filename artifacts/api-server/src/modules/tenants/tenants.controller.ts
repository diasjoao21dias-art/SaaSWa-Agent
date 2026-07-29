import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, HttpCode, HttpStatus, ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Public } from '../../common/decorators/public.decorator';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { UserRole } from '../../common/constants';
import type { TenantContext } from '../../common/types/authenticated-request.type';

@ApiTags('Tenants')
@ApiBearerAuth('access-token')
@Controller({ path: 'tenants', version: '1' })
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  // ─── Public: tenant self-registration ─────────────────────────────────────
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new tenant (company) with its owner account' })
  async register(@Body() dto: CreateTenantDto) {
    return this.service.create(dto);
  }

  // ─── SuperAdmin only: list ALL tenants across the platform ────────────────
  // Previously @Roles(OWNER) + @SkipTenantGuard() — any tenant OWNER could
  // enumerate all tenants. Fixed: only the platform superadmin may list tenants.
  @SuperAdmin()
  @Get()
  @ApiOperation({ summary: 'List all tenants — platform superadmin only' })
  @ApiPaginatedResponse(TenantResponseDto)
  async findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  // ─── Own-tenant only: authenticated users read their own tenant ───────────
  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID — scoped to own tenant' })
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    // Cross-tenant reads require SuperAdmin; regular users can only see their own.
    if (id !== tenant.id) {
      throw new ForbiddenException(
        'You can only access your own tenant data.',
      );
    }
    return this.service.findById(id);
  }

  // ─── Own-tenant only: OWNER/ADMIN may update their own tenant ────────────
  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update tenant configuration — scoped to own tenant' })
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    if (id !== tenant.id) {
      throw new ForbiddenException(
        'You can only update your own tenant.',
      );
    }
    return this.service.update(id, dto);
  }

  // ─── SuperAdmin only: deleting a tenant is a platform-level operation ─────
  // Previously @Roles(OWNER) — any tenant OWNER could delete any other tenant.
  // Fixed: only the platform superadmin may delete tenants.
  @SuperAdmin()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a tenant — platform superadmin only' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
