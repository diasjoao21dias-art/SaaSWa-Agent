import { Injectable } from '@nestjs/common';
import { CustomersRepository } from './customers.repository';
import { CustomerNotFoundException, CustomerAlreadyExistsException } from './exceptions/customer.exceptions';
import type { CreateCustomerDto } from './dto/create-customer.dto';
import type { UpdateCustomerDto } from './dto/update-customer.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/types/paginated-result.type';

@Injectable()
export class CustomersService {
  constructor(private readonly repo: CustomersRepository) {}

  async create(tenantId: string, dto: CreateCustomerDto) {
    const existing = await this.repo.findByPhone(dto.phone, tenantId);
    if (existing) throw new CustomerAlreadyExistsException(dto.phone);
    return this.repo.create(tenantId, dto);
  }

  async findById(id: string, tenantId: string) {
    const customer = await this.repo.findById(id, tenantId);
    if (!customer) throw new CustomerNotFoundException(id);
    return customer;
  }

  async findAll(tenantId: string, pagination: PaginationDto, search?: string) {
    const { data, total } = await this.repo.findAll(tenantId, pagination.page, pagination.limit, search);
    return paginate(data, total, pagination.page, pagination.limit);
  }

  async update(id: string, tenantId: string, dto: UpdateCustomerDto) {
    await this.findById(id, tenantId);
    return this.repo.update(id, dto);
  }

  async block(id: string, tenantId: string, reason?: string) {
    await this.findById(id, tenantId);
    return this.repo.block(id, reason);
  }

  async unblock(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.repo.unblock(id);
  }

  async remove(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    await this.repo.softDelete(id);
  }
}
