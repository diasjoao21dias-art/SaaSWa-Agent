export type ClientId = string & { readonly _brand: 'ClientId' };
export type ClientStatus = 'active' | 'inactive';

export interface Client {
  readonly id: ClientId;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly company: string | null;
  readonly status: ClientStatus;
  readonly totalConversations: number;
  readonly createdAt: Date;
}

export interface CreateClientInput {
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly company?: string;
  readonly status?: ClientStatus;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {}
