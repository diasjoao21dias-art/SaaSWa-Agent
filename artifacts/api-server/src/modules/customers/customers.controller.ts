import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '../../common/constants';
import type { TenantContext } from '../../common/types/authenticated-request.type';
import { IsOptional, IsString } from 'class-validator';

class CustomerQueryDto extends PaginationDto {
  @IsOptional() @IsString() search?: string;
}

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@Controller({ path: 'customers', version: '1' })
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Create a new customer contact' })
  create(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateCustomerDto) {
    return this.service.create(tenant.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List customers with optional search' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@CurrentTenant() tenant: TenantContext, @Query() query: CustomerQueryDto) {
    return this.service.findAll(tenant.id, query, query.search);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.service.findById(id, tenant.id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.AGENT)
  update(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.service.update(id, tenant.id, dto);
  }

  @Patch(':id/block')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Block a customer from receiving AI responses' })
  block(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.service.block(id, tenant.id, reason);
  }

  @Patch(':id/unblock')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  unblock(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.service.unblock(id, tenant.id);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentTenant() tenant: TenantContext, @Param('id') id: string): Promise<void> {
    await this.service.remove(id, tenant.id);
  }
}
