import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: object) {
    return this.prisma.plan.create({ data: data as Parameters<typeof this.prisma.plan.create>[0]['data'] });
  }

  async findById(id: string) {
    return this.prisma.plan.findFirst({ where: { id, deletedAt: null } });
  }

  async findBySlug(slug: string) {
    return this.prisma.plan.findFirst({ where: { slug, deletedAt: null } });
  }

  async findAllPublic() {
    return this.prisma.plan.findMany({
      where: { isActive: true, isPublic: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findAll() {
    return this.prisma.plan.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } });
  }

  async update(id: string, data: object) {
    return this.prisma.plan.update({ where: { id }, data: { ...(data as Record<string, unknown>), updatedAt: new Date() } });
  }

  async softDelete(id: string) {
    return this.prisma.plan.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }
}
