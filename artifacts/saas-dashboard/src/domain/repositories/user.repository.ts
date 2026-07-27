import type { User, UserId, CreateUserInput, UpdateUserInput } from '../entities/user.entity';

export interface IUserRepository {
  list(): Promise<readonly User[]>;
  create(input: CreateUserInput): Promise<User>;
  update(id: UserId, input: UpdateUserInput): Promise<User>;
  remove(id: UserId): Promise<void>;
}
