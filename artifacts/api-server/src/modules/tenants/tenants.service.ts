import { Injectable, Logger } from '@nestjs/common';
import { TenantsRepository } from './tenants.repository';
import { CacheService } from '../../cache/cache.service';
import { AuthService } from '../auth/auth.service';
import {
  TenantNotFoundException,
  TenantSlugTakenException,
} from './exceptions/tenant.exceptions';
import { CACHE_KEY_TENANT, CACHE_TTL_MEDIUM } from '../../common/constants';
import type { CreateTenantDto } from './dto/create-tenant.dto';
import type { UpdateTenantDto } from './dto/update-tenant.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/types/paginated-result.type';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly repo: TenantsRepository,
    private readonly cache: CacheService,
  ) {}

  async create(dto: CreateTenantDto) {
    const existing = await this.repo.findBySlug(dto.slug);
    if (existing) throw new TenantSlugTakenException(dto.slug);

    const passwordHash = await AuthService.hashPassword(dto.ownerPassword);
    const tenant = await this.repo.create(dto, passwordHash);

    this.logger.log(`Tenant created: ${tenant.slug} (${tenant.id})`);
    return tenant;
  }

  async findById(id: string) {
    const cacheKey = `${CACHE_KEY_TENANT}${id}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const tenant = await this.repo.findById(id);
    if (!tenant) throw new TenantNotFoundException(id);

    await this.cache.set(cacheKey, tenant, CACHE_TTL_MEDIUM);
    return tenant;
  }

  async findAll(pagination: PaginationDto) {
    const { data, total } = await this.repo.findAll(pagination.page, pagination.limit);
    return paginate(data, total, pagination.page, pagination.limit);
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findById(id); // validates existence
    const updated = await this.repo.update(id, dto);
    await this.cache.del(`${CACHE_KEY_TENANT}${id}`);
    return updated;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.repo.softDelete(id);
    await this.cache.del(`${CACHE_KEY_TENANT}${id}`);
  }
}
