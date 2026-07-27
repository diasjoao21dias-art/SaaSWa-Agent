export class CustomerEntity {
  id!: string;
  tenantId!: string;
  phone!: string;
  name?: string;
  email?: string;
  isBlocked!: boolean;
  customFields!: Record<string, unknown>;
  lastSeenAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}
