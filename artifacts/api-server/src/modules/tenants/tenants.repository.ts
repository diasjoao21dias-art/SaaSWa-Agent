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

  /**
   * Creates the three system roles (Administrador, Funcionário, Cliente) for a
   * newly created tenant and assigns permissions from the global permissions
   * seed table. Silently skips if the permissions table is empty (e.g. seed not
   * yet run) — the roles are created without assignments and can be configured later.
   *
   * Role → UserRole enum slug mapping:
   *   admin   → ADMIN  (Administrador)
   *   agent   → AGENT  (Funcionário)
   *   viewer  → VIEWER (Cliente)
   */
  async createSystemRoles(tenantId: string): Promise<void> {
    const permissions = await this.prisma.permission.findMany({
      where: { deletedAt: null },
      select: { id: true, key: true },
    });

    const permMap = new Map(permissions.map((p) => ({ key: p.key, id: p.id })).map(({ key, id }) => [key, id]));

    const adminPermIds = permissions
      .filter((p) => p.key !== 'plans:write')
      .map((p) => p.id);

    const agentPermKeys = [
      'conversations:read', 'conversations:write', 'conversations:close',
      'customers:read', 'customers:write',
      'knowledge:read',
      'whatsapp:read',
    ];

    const viewerPermKeys = [
      'conversations:read',
      'customers:read',
      'reports:read',
    ];

    const roleDefs = [
      {
        name: 'Administrador',
        slug: 'admin',
        description: 'Acesso completo — equivale ao papel ADMIN',
        permIds: adminPermIds,
      },
      {
        name: 'Funcionário',
        slug: 'agent',
        description: 'Acesso operacional — equivale ao papel AGENT',
        permIds: agentPermKeys.map((k) => permMap.get(k)).filter(Boolean) as string[],
      },
      {
        name: 'Cliente',
        slug: 'viewer',
        description: 'Acesso somente leitura — equivale ao papel VIEWER',
        permIds: viewerPermKeys.map((k) => permMap.get(k)).filter(Boolean) as string[],
      },
    ];

    for (const def of roleDefs) {
      const role = await this.prisma.role.create({
        data: {
          tenantId,
          name: def.name,
          slug: def.slug,
          description: def.description,
          isSystem: true,
        },
      });

      if (def.permIds.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: def.permIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }
    }
  }
}
