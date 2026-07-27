export class UserEntity {
  id!: string;
  tenantId!: string;
  email!: string;
  name!: string;
  role!: string;
  status!: string;
  phone?: string;
  lastLoginAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}
