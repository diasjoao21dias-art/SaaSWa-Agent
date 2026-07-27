import { Injectable } from '@nestjs/common';
import { PromptsRepository } from './prompts.repository';
import { NotFoundException } from '../../common/exceptions/not-found.exception';
import type { CreatePromptDto } from './dto/create-prompt.dto';
import type { UpdatePromptDto } from './dto/update-prompt.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/types/paginated-result.type';

@Injectable()
export class PromptsService {
  constructor(private readonly repo: PromptsRepository) {}

  async create(tenantId: string, dto: CreatePromptDto) {
    return this.repo.create(tenantId, { ...dto, isActive: true, version: 1 });
  }

  async findById(id: string, tenantId: string) {
    const prompt = await this.repo.findById(id, tenantId);
    if (!prompt) throw new NotFoundException('Prompt', id);
    return prompt;
  }

  async findAll(tenantId: string, pagination: PaginationDto) {
    const { data, total } = await this.repo.findAll(tenantId, pagination.page, pagination.limit);
    return paginate(data, total, pagination.page, pagination.limit);
  }

  async update(id: string, tenantId: string, dto: UpdatePromptDto, userId: string) {
    const existing = await this.findById(id, tenantId);
    return this.repo.update(id, { title: dto.title, content: dto.content, description: dto.description, type: dto.type, variables: dto.variables }, existing.content, userId, dto.changeNote);
  }

  async remove(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    await this.repo.softDelete(id);
  }
}
