import type { Client, ClientId } from '@/domain/entities/client.entity';
import type { ClientDTO } from '../dtos/client.dto';

export function mapClientDTO(dto: ClientDTO): Client {
  return {
    id: dto.id as ClientId,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    company: dto.company,
    status: dto.status,
    totalConversations: dto.totalConversations,
    createdAt: new Date(dto.createdAt),
  };
}
