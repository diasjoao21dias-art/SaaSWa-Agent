import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { UserRole } from '../../common/constants';
import type { JwtPayload, TenantContext } from '../../common/types/authenticated-request.type';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user in the current tenant' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateUserDto,
  ) {
    return this.service.create(tenant.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all users in the current tenant' })
  @ApiPaginatedResponse(UserResponseDto)
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query() pagination: PaginationDto,
  ) {
    return this.service.findAll(tenant.id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    return this.service.findById(id, tenant.id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a user' })
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.service.update(id, tenant.id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a user from the tenant' })
  async remove(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<void> {
    await this.service.remove(id, tenant.id, currentUser.sub);
  }
}
