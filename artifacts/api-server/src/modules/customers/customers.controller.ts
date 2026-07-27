import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import type { TenantContext } from '../../common/types/authenticated-request.type';
import { IsOptional, IsString } from 'class-validator';

class CustomerQueryDto extends PaginationDto {
  @IsOptional() @IsString() search?: string;
}

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'customers', version: '1' })
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Post()
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
  update(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.service.update(id, tenant.id, dto);
  }

  @Patch(':id/block')
  @ApiOperation({ summary: 'Block a customer from receiving AI responses' })
  block(@CurrentTenant() tenant: TenantContext, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.service.block(id, tenant.id, reason);
  }

  @Patch(':id/unblock')
  unblock(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.service.unblock(id, tenant.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentTenant() tenant: TenantContext, @Param('id') id: string): Promise<void> {
    await this.service.remove(id, tenant.id);
  }
}
