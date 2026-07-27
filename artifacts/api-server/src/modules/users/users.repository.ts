import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getPaginationParams } from '../../common/types/paginated-result.type';

const USER_SELECT = {
  id: true, tenantId: true, email: true, name: true, role: true,
  status: true, phone: true, lastLoginAt: true, createdAt: true, updatedAt: true,
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: {
    name: string; email: string; passwordHash: string;
    role?: string; phone?: string; status?: string;
  }) {
    return this.prisma.user.create({
      data: { ...data, tenantId, role: (data.role ?? 'AGENT') as 'OWNER' | 'ADMIN' | 'AGENT' | 'VIEWER', status: (data.status ?? 'ACTIVE') as 'ACTIVE' | 'INACTIVE' | 'INVITED' | 'BLOCKED' },
      select: USER_SELECT,
    });
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: USER_SELECT,
    });
  }

  async findByEmail(email: string, tenantId: string) {
    return this.prisma.user.findFirst({
      where: { email, tenantId, deletedAt: null },
      select: { ...USER_SELECT, passwordHash: true },
    });
  }

  async findAll(tenantId: string, page: number, limit: number) {
    const { skip, take } = getPaginationParams(page, limit);
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenantId, deletedAt: null },
        skip, take, orderBy: { createdAt: 'desc' },
        select: USER_SELECT,
      }),
      this.prisma.user.count({ where: { tenantId, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async countByTenant(tenantId: string) {
    return this.prisma.user.count({ where: { tenantId, deletedAt: null } });
  }

  async update(id: string, tenantId: string, data: Partial<{ name: string; role: string; phone: string; status: string }>) {
    return this.prisma.user.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
      select: USER_SELECT,
    });
  }

  async softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }
}
