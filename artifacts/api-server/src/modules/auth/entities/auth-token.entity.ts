export class AuthTokenEntity {
  id!: string;
  userId!: string;
  tenantId!: string;
  tokenHash!: string;
  jti!: string;
  expiresAt!: Date;
  revokedAt?: Date;
  createdAt!: Date;
}
