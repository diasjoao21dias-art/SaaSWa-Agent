import type { IClientRepository } from '@/domain/repositories/client.repository';
import type { Client, ClientId } from '@/domain/entities/client.entity';
import type { CreateClientInput, UpdateClientInput } from '@/domain/repositories/client.repository';
import { listClients, createClient, updateClient, deleteClient } from '@workspace/api-client-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any): Client {
  return {
    id: r.id as ClientId,
    name: r.name,
    email: r.email ?? null,
    phone: r.phone ?? null,
    company: r.company ?? null,
    status: r.status ?? 'active',
    totalConversations: r.totalConversations ?? 0,
    createdAt: new Date(r.createdAt),
  };
}

export class ApiClientRepository implements IClientRepository {
  async list(): Promise<readonly Client[]> {
    const rows = await listClients();
    return rows.map(mapRow);
  }

  async create(input: CreateClientInput): Promise<Client> {
    const row = await createClient(input as Parameters<typeof createClient>[0]);
    return mapRow(row);
  }

  async update(id: ClientId, input: UpdateClientInput): Promise<Client> {
    const row = await updateClient(id, input as Parameters<typeof updateClient>[1]);
    return mapRow(row);
  }

  async remove(id: ClientId): Promise<void> {
    await deleteClient(id);
  }
}
