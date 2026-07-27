import type { Client, ClientId, CreateClientInput, UpdateClientInput } from '../entities/client.entity';

export interface IClientRepository {
  list(): Promise<readonly Client[]>;
  create(input: CreateClientInput): Promise<Client>;
  update(id: ClientId, input: UpdateClientInput): Promise<Client>;
  remove(id: ClientId): Promise<void>;
}
