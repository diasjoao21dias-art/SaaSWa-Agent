import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string, tenantId?: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
        ...(tenantId ? { tenantId } : {}),
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        tenant: { select: { status: true } },
      },
    });
  }

  async findUserById(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        role: true,
        status: true,
        tenant: { select: { status: true } },
      },
    });
  }

  async saveRefreshToken(data: {
    userId: string;
    tenantId: string;
    jti: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.token.create({
      data: {
        ...data,
        type: 'REFRESH',
        scopes: [],
      },
    });
  }

  async findRefreshToken(jti: string) {
    return this.prisma.token.findFirst({
      where: { jti, type: 'REFRESH', revokedAt: null, deletedAt: null },
    });
  }

  async revokeRefreshToken(jti: string) {
    return this.prisma.token.updateMany({
      where: { jti, type: 'REFRESH' },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string) {
    return this.prisma.token.updateMany({
      where: { userId, type: 'REFRESH', revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async updateLastLogin(userId: string, ipAddress?: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
