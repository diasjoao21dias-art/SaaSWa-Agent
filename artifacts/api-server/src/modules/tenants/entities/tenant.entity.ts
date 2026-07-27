export class TenantEntity {
  id!: string;
  name!: string;
  slug!: string;
  document?: string;
  email!: string;
  phone?: string;
  website?: string;
  status!: string;
  timezone!: string;
  locale!: string;
  settings!: Record<string, unknown>;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;
}
