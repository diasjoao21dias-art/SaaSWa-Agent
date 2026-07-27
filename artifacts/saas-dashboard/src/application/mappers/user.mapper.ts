import type { User, UserId } from '@/domain/entities/user.entity';
import type { UserDTO } from '../dtos/user.dto';

export function mapUserDTO(dto: UserDTO): User {
  return {
    id: dto.id as UserId,
    name: dto.name,
    email: dto.email,
    role: dto.role,
    status: dto.status,
    lastLogin: new Date(dto.lastLogin),
  };
}
