import { Injectable } from '@nestjs/common';
import { PlansRepository } from './plans.repository';
import { NotFoundException } from '../../common/exceptions/not-found.exception';
import { ConflictException } from '../../common/exceptions/conflict.exception';
import type { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlansService {
  constructor(private readonly repo: PlansRepository) {}

  async create(dto: CreatePlanDto) {
    const existing = await this.repo.findBySlug(dto.slug);
    if (existing) throw new ConflictException('Plan', 'slug', dto.slug);
    return this.repo.create({ ...dto, isActive: true, sortOrder: 0 });
  }

  async findPublic() {
    return this.repo.findAllPublic();
  }

  async findAll() {
    return this.repo.findAll();
  }

  async findById(id: string) {
    const plan = await this.repo.findById(id);
    if (!plan) throw new NotFoundException('Plan', id);
    return plan;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.repo.softDelete(id);
  }
}
