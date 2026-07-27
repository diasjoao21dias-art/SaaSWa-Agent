import { Controller, Get, Post, Delete, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTenantGuard } from '../../common/decorators/skip-tenant-guard.decorator';
import { UserRole } from '../../common/constants';

@ApiTags('Plans')
@Controller({ path: 'plans', version: '1' })
export class PlansController {
  constructor(private readonly service: PlansService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all public plans (no authentication required)' })
  findPublic() {
    return this.service.findPublic();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SkipTenantGuard()
  @Roles(UserRole.OWNER)
  @Post()
  @ApiOperation({ summary: 'Create a plan (platform admin only)' })
  create(@Body() dto: CreatePlanDto) {
    return this.service.create(dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SkipTenantGuard()
  @Roles(UserRole.OWNER)
  @Get('all')
  @ApiOperation({ summary: 'List all plans including private (platform admin only)' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan details by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SkipTenantGuard()
  @Roles(UserRole.OWNER)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
