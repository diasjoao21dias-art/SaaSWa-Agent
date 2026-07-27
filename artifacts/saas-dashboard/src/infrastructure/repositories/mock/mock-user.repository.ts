import type { IUserRepository } from '@/domain/repositories/user.repository';
import type { User, UserId, CreateUserInput, UpdateUserInput } from '@/domain/entities/user.entity';
import { UserDTOSchema } from '@/application/dtos/user.dto';
import { mapUserDTO } from '@/application/mappers/user.mapper';
import { MOCK_USERS } from '@/lib/mock-data';

let store: User[] = MOCK_USERS.map((raw) => mapUserDTO(UserDTOSchema.parse(raw)));

export class MockUserRepository implements IUserRepository {
  async list(): Promise<readonly User[]> {
    return store;
  }

  async create(input: CreateUserInput): Promise<User> {
    const user: User = {
      id: `u${Date.now()}` as UserId,
      name: input.name,
      email: input.email,
      role: input.role,
      status: input.status ?? 'active',
      lastLogin: new Date(),
    };
    store = [...store, user];
    return user;
  }

  async update(id: UserId, input: UpdateUserInput): Promise<User> {
    store = store.map((u) => (u.id === id ? { ...u, ...input } : u));
    const updated = store.find((u) => u.id === id);
    if (!updated) throw new Error(`User ${id} not found`);
    return updated;
  }

  async remove(id: UserId): Promise<void> {
    store = store.filter((u) => u.id !== id);
  }
}
