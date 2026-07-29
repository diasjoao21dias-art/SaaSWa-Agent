import {
  Controller, Get, Post, Delete, Body, Param,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { Public } from '../../common/decorators/public.decorator';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';

@ApiTags('Plans')
@ApiBearerAuth('access-token')
@Controller({ path: 'plans', version: '1' })
export class PlansController {
  constructor(private readonly service: PlansService) {}

  // ─── Public: list active plans visible to any visitor ────────────────────
  @Public()
  @Get()
  @ApiOperation({ summary: 'List all public plans (no authentication required)' })
  findPublic() {
    return this.service.findPublic();
  }

  // ─── SuperAdmin: list ALL plans including private/inactive ───────────────
  // Must be declared before @Get(':id') to prevent NestJS routing ':id' to 'all'.
  // Previously @Roles(OWNER) + @SkipTenantGuard() — any tenant OWNER could
  // list all plans. Fixed: platform superadmin only.
  @SuperAdmin()
  @Get('all')
  @ApiOperation({ summary: 'List all plans including private — platform superadmin only' })
  findAll() {
    return this.service.findAll();
  }

  // ─── Public: plan detail (pricing page, checkout) ─────────────────────────
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get plan details by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // ─── SuperAdmin: create / delete global plans ─────────────────────────────
  // Previously @Roles(OWNER) + @SkipTenantGuard() — any tenant OWNER could
  // create/delete global plans. Fixed: platform superadmin only.
  @SuperAdmin()
  @Post()
  @ApiOperation({ summary: 'Create a plan — platform superadmin only' })
  create(@Body() dto: CreatePlanDto) {
    return this.service.create(dto);
  }

  @SuperAdmin()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a plan — platform superadmin only' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
