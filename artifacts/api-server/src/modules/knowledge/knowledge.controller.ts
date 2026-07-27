import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { CreateKnowledgeDocumentDto } from './dto/create-knowledge-document.dto';
import { IngestUrlDto } from './dto/ingest-url.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants';
import {
  MAX_FILE_SIZE_BYTES,
  UPLOAD_DIR,
} from './constants/knowledge-rag.constants';
import type { TenantContext } from '../../common/types/authenticated-request.type';

@ApiTags('Knowledge')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller({ path: 'knowledge', version: '1' })
export class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}

  // ─── Knowledge Bases ───────────────────────────────────────────────────────

  @Post('bases')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar nova base de conhecimento' })
  createBase(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateKnowledgeBaseDto,
  ) {
    return this.service.createBase(tenant.id, dto);
  }

  @Get('bases')
  @ApiOperation({ summary: 'Listar bases de conhecimento do tenant' })
  findAllBases(
    @CurrentTenant() tenant: TenantContext,
    @Query() pagination: PaginationDto,
  ) {
    return this.service.findAllBases(tenant.id, pagination);
  }

  @Get('bases/:baseId')
  @ApiOperation({ summary: 'Obter uma base de conhecimento' })
  findBase(
    @CurrentTenant() tenant: TenantContext,
    @Param('baseId') baseId: string,
  ) {
    return this.service.findBaseById(baseId, tenant.id);
  }

  @Delete('bases/:baseId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar base de conhecimento' })
  async removeBase(
    @CurrentTenant() tenant: TenantContext,
    @Param('baseId') baseId: string,
  ): Promise<void> {
    await this.service.removeBase(baseId, tenant.id);
  }

  // ─── Documentos — Upload de arquivo ───────────────────────────────────────

  @Post('bases/:baseId/documents/upload')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Upload de arquivo para a base de conhecimento',
    description: 'Aceita: PDF, DOCX, DOC, XLSX, XLS, TXT, CSV. Processamento assíncrono.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const unique = uuidv4();
          const ext = extname(file.originalname);
          cb(null, `${unique}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/plain',
          'text/csv',
          'application/octet-stream',
        ];
        const ext = extname(file.originalname).toLowerCase();
        const allowedExts = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.txt', '.csv'];

        if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Formato não suportado: ${file.mimetype}`), false);
        }
      },
    }),
  )
  uploadFile(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: { id: string },
    @Param('baseId') baseId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    return this.service.ingestFile(baseId, tenant.id, user.id, file);
  }

  // ─── Documentos — Ingestão de URL ─────────────────────────────────────────

  @Post('bases/:baseId/documents/url')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Ingere conteúdo de uma URL/site',
    description: 'Faz scraping da URL, extrai texto limpo e gera embeddings. Processamento assíncrono.',
  })
  ingestUrl(
    @CurrentTenant() tenant: TenantContext,
    @Param('baseId') baseId: string,
    @Body() dto: IngestUrlDto,
  ) {
    return this.service.ingestUrl(baseId, tenant.id, dto);
  }

  // ─── Documentos — Texto direto ─────────────────────────────────────────────

  @Post('bases/:baseId/documents')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Adicionar documento de texto à base de conhecimento',
    description: 'Envia texto diretamente. O sistema divide em chunks e gera embeddings automaticamente.',
  })
  addDocument(
    @CurrentTenant() tenant: TenantContext,
    @Param('baseId') baseId: string,
    @Body() dto: CreateKnowledgeDocumentDto,
  ) {
    return this.service.ingestText(baseId, tenant.id, dto);
  }

  // ─── Documentos — Listagem ─────────────────────────────────────────────────

  @Get('bases/:baseId/documents')
  @ApiOperation({ summary: 'Listar documentos de uma base de conhecimento' })
  findDocuments(
    @CurrentTenant() tenant: TenantContext,
    @Param('baseId') baseId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.service.findDocuments(baseId, tenant.id, pagination);
  }

  @Delete('bases/:baseId/documents/:docId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar documento da base de conhecimento' })
  async removeDocument(
    @CurrentTenant() tenant: TenantContext,
    @Param('baseId') baseId: string,
    @Param('docId') docId: string,
  ): Promise<void> {
    await this.service.removeDocument(baseId, docId, tenant.id);
  }
}
