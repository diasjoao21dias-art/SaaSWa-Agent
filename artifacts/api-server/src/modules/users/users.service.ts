import { Injectable, Logger } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { AuthService } from '../auth/auth.service';
import {
  UserNotFoundException, UserEmailTakenException, CannotDeleteOwnerException,
} from './exceptions/user.exceptions';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/types/paginated-result.type';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly repo: UsersRepository) {}

  async create(tenantId: string, dto: CreateUserDto) {
    const existing = await this.repo.findByEmail(dto.email, tenantId);
    if (existing) throw new UserEmailTakenException(dto.email);

    const passwordHash = await AuthService.hashPassword(dto.password);
    const user = await this.repo.create(tenantId, {
      name: dto.name, email: dto.email, passwordHash,
      role: dto.role ?? 'AGENT', phone: dto.phone, status: 'ACTIVE',
    });
    this.logger.log(`User created: ${dto.email} in tenant ${tenantId}`);
    return user;
  }

  async findById(id: string, tenantId: string) {
    const user = await this.repo.findById(id, tenantId);
    if (!user) throw new UserNotFoundException(id);
    return user;
  }

  async findAll(tenantId: string, pagination: PaginationDto) {
    const { data, total } = await this.repo.findAll(tenantId, pagination.page, pagination.limit);
    return paginate(data, total, pagination.page, pagination.limit);
  }

  async update(id: string, tenantId: string, dto: UpdateUserDto) {
    await this.findById(id, tenantId);
    return this.repo.update(id, tenantId, {
      name: dto.name, role: dto.role, phone: dto.phone,
    });
  }

  async remove(id: string, tenantId: string, requestingUserId: string) {
    const user = await this.findById(id, tenantId);
    if (user.role === 'OWNER') throw new CannotDeleteOwnerException();
    if (id === requestingUserId) throw new CannotDeleteOwnerException();
    await this.repo.softDelete(id);
  }
}
