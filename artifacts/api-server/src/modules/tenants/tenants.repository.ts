import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { CreateTenantDto } from './dto/create-tenant.dto';
import type { UpdateTenantDto } from './dto/update-tenant.dto';
import { getPaginationParams } from '../../common/types/paginated-result.type';

@Injectable()
export class TenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto, passwordHash: string) {
    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        email: dto.email,
        document: dto.document,
        phone: dto.phone,
        website: dto.website,
        timezone: dto.timezone ?? 'America/Sao_Paulo',
        locale: dto.locale ?? 'pt-BR',
        status: 'TRIAL',
        users: {
          create: {
            name: dto.ownerName,
            email: dto.ownerEmail,
            passwordHash,
            role: 'OWNER',
            status: 'ACTIVE',
            emailVerifiedAt: new Date(),
          },
        },
      },
      include: { users: { where: { role: 'OWNER' }, select: { id: true, email: true } } },
    });
  }

  async findById(id: string) {
    return this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.tenant.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  async findAll(page: number, limit: number) {
    const { skip, take } = getPaginationParams(page, limit);
    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where: { deletedAt: null },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where: { deletedAt: null } }),
    ]);
    return { data, total };
  }

  async update(id: string, dto: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
    });
  }

  async softDelete(id: string) {
    return this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELED' },
    });
  }
}
