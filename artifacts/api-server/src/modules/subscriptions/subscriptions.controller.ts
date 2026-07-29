import { Controller, Get, Post, Patch, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '../../common/constants';
import type { TenantContext } from '../../common/types/authenticated-request.type';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class CancelSubscriptionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

@ApiTags('Subscriptions')
@ApiBearerAuth('access-token')
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Post()
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new subscription for the current tenant' })
  create(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateSubscriptionDto) {
    return this.service.create(tenant.id, dto);
  }

  @Get('active')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get the current active subscription' })
  getActive(@CurrentTenant() tenant: TenantContext) {
    return this.service.getActive(tenant.id);
  }

  @Get('history')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get subscription history' })
  getHistory(@CurrentTenant() tenant: TenantContext) {
    return this.service.getHistory(tenant.id);
  }

  @Patch('cancel')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel the current subscription' })
  cancel(@CurrentTenant() tenant: TenantContext, @Body() dto: CancelSubscriptionDto) {
    return this.service.cancel(tenant.id, dto.reason);
  }
}
