import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getPaginationParams } from '../../common/types/paginated-result.type';

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: { phone: string; name?: string; email?: string; customFields?: Record<string, unknown>; notes?: string }) {
    return this.prisma.customer.create({ data: { ...data, tenantId } });
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.customer.findFirst({ where: { id, tenantId, deletedAt: null } });
  }

  async findByPhone(phone: string, tenantId: string) {
    return this.prisma.customer.findFirst({ where: { phone, tenantId, deletedAt: null } });
  }

  async findAll(tenantId: string, page: number, limit: number, search?: string) {
    const { skip, take } = getPaginationParams(page, limit);
    const where = {
      tenantId, deletedAt: null,
      ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { phone: { contains: search } }, { email: { contains: search, mode: 'insensitive' as const } }] } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({ where, skip, take, orderBy: { lastSeenAt: 'desc' } }),
      this.prisma.customer.count({ where }),
    ]);
    return { data, total };
  }

  async update(id: string, data: object) {
    return this.prisma.customer.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
  }

  async block(id: string, reason?: string) {
    return this.prisma.customer.update({ where: { id }, data: { isBlocked: true, blockedAt: new Date(), blockedReason: reason } });
  }

  async unblock(id: string) {
    return this.prisma.customer.update({ where: { id }, data: { isBlocked: false, blockedAt: null, blockedReason: null } });
  }

  async softDelete(id: string) {
    return this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
