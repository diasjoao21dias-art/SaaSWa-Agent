import type { IClientRepository } from '@/domain/repositories/client.repository';
import type { Client, ClientId, CreateClientInput, UpdateClientInput } from '@/domain/entities/client.entity';
import { ClientDTOSchema } from '@/application/dtos/client.dto';
import { mapClientDTO } from '@/application/mappers/client.mapper';
import { MOCK_CLIENTS } from '@/lib/mock-data';

let store: Client[] = MOCK_CLIENTS.map((raw) => mapClientDTO(ClientDTOSchema.parse(raw)));

export class MockClientRepository implements IClientRepository {
  async list(): Promise<readonly Client[]> {
    return store;
  }

  async create(input: CreateClientInput): Promise<Client> {
    const client: Client = {
      id: `cl${Date.now()}` as ClientId,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      company: input.company ?? null,
      status: input.status ?? 'active',
      totalConversations: 0,
      createdAt: new Date(),
    };
    store = [...store, client];
    return client;
  }

  async update(id: ClientId, input: UpdateClientInput): Promise<Client> {
    store = store.map((c) => (c.id === id ? { ...c, ...input } : c));
    const updated = store.find((c) => c.id === id);
    if (!updated) throw new Error(`Client ${id} not found`);
    return updated;
  }

  async remove(id: ClientId): Promise<void> {
    store = store.filter((c) => c.id !== id);
  }
}
