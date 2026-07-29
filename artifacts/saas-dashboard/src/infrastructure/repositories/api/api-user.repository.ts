import type { IUserRepository, CreateUserInput, UpdateUserInput } from '@/domain/repositories/user.repository';
import type { User, UserId } from '@/domain/entities/user.entity';
import { listUsers, createUser, updateUser, deleteUser } from '@workspace/api-client-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any): User {
  return {
    id: r.id as UserId,
    name: r.name,
    email: r.email,
    role: r.role ?? 'agent',
    status: r.status ?? 'active',
    lastLogin: r.lastLogin ? new Date(r.lastLogin) : null,
  };
}

export class ApiUserRepository implements IUserRepository {
  async list(): Promise<readonly User[]> {
    const rows = await listUsers();
    return rows.map(mapRow);
  }

  async create(input: CreateUserInput): Promise<User> {
    const row = await createUser(input as Parameters<typeof createUser>[0]);
    return mapRow(row);
  }

  async update(id: UserId, input: UpdateUserInput): Promise<User> {
    const row = await updateUser(id, input as Parameters<typeof updateUser>[1]);
    return mapRow(row);
  }

  async remove(id: UserId): Promise<void> {
    await deleteUser(id);
  }
}
