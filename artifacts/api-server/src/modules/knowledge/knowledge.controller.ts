import { Controller, Get, Post, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { CreateKnowledgeDocumentDto } from './dto/create-knowledge-document.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '../../common/constants';
import type { TenantContext } from '../../common/types/authenticated-request.type';

@ApiTags('Knowledge')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller({ path: 'knowledge', version: '1' })
export class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}

  @Post('bases')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new knowledge base' })
  createBase(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateKnowledgeBaseDto) {
    return this.service.createBase(tenant.id, dto);
  }

  @Get('bases')
  findAllBases(@CurrentTenant() tenant: TenantContext, @Query() pagination: PaginationDto) {
    return this.service.findAllBases(tenant.id, pagination);
  }

  @Get('bases/:baseId')
  findBase(@CurrentTenant() tenant: TenantContext, @Param('baseId') baseId: string) {
    return this.service.findBaseById(baseId, tenant.id);
  }

  @Delete('bases/:baseId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBase(@CurrentTenant() tenant: TenantContext, @Param('baseId') baseId: string): Promise<void> {
    await this.service.removeBase(baseId, tenant.id);
  }

  @Post('bases/:baseId/documents')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a document to a knowledge base' })
  addDocument(@CurrentTenant() tenant: TenantContext, @Param('baseId') baseId: string, @Body() dto: CreateKnowledgeDocumentDto) {
    return this.service.addDocument(baseId, tenant.id, dto);
  }

  @Get('bases/:baseId/documents')
  findDocuments(@CurrentTenant() tenant: TenantContext, @Param('baseId') baseId: string, @Query() pagination: PaginationDto) {
    return this.service.findDocuments(baseId, tenant.id, pagination);
  }

  @Delete('bases/:baseId/documents/:docId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDocument(@CurrentTenant() tenant: TenantContext, @Param('baseId') baseId: string, @Param('docId') docId: string): Promise<void> {
    await this.service.removeDocument(baseId, docId, tenant.id);
  }
}
