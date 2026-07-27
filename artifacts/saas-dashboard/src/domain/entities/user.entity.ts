export type UserId = string & { readonly _brand: 'UserId' };
export type UserRole = 'admin' | 'member' | 'viewer';
export type UserStatus = 'active' | 'inactive';

export interface User {
  readonly id: UserId;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly lastLogin: Date;
}

export interface CreateUserInput {
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
  readonly status?: UserStatus;
}

export interface UpdateUserInput extends Partial<CreateUserInput> {}
