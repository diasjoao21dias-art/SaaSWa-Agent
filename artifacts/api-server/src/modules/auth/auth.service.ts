import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from './auth.repository';
import { CacheService } from '../../cache/cache.service';
import {
  InvalidCredentialsException,
  AccountInactiveException,
  TokenRevokedException,
} from './exceptions/auth.exceptions';
import { CACHE_KEY_REFRESH_TOKEN } from '../../common/constants';
import type { JwtPayload, RefreshTokenPayload } from './interfaces/jwt-payload.interface';
import type { LoginDto } from './dto/login.dto';
import type { AuthResponseDto } from './dto/auth-response.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepo: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  // ─── Login ────────────────────────────────────────────────────────────────────
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    const user = await this.authRepo.findUserByEmail(dto.email);

    if (!user || !user.passwordHash) {
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`Failed login attempt for email: ${dto.email}`);
      throw new InvalidCredentialsException();
    }

    if (user.status !== 'ACTIVE') {
      throw new AccountInactiveException();
    }

    if (user.tenant.status === 'SUSPENDED') {
      throw new AccountInactiveException();
    }

    await this.authRepo.updateLastLogin(user.id, ipAddress);

    return this.generateTokenPair(
      { sub: user.id, tenantId: user.tenantId, email: user.email, role: user.role },
      ipAddress,
      userAgent,
    );
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────────
  async refresh(
    payload: RefreshTokenPayload & { rawToken: string },
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const { jti, sub, rawToken } = payload;

    // Check if token is in Redis (revoked check)
    const cacheKey = `${CACHE_KEY_REFRESH_TOKEN}${jti}`;
    const isRevoked = await this.cacheService.exists(`${cacheKey}:revoked`);
    if (isRevoked) {
      throw new TokenRevokedException();
    }

    // Verify token exists in DB
    const storedToken = await this.authRepo.findRefreshToken(jti);
    if (!storedToken) {
      throw new TokenRevokedException();
    }

    // Verify hash matches
    const hashMatch = AuthRepository.hashToken(rawToken) === storedToken.tokenHash;
    if (!hashMatch) {
      throw new TokenRevokedException();
    }

    // Rotate: revoke current token
    await this.authRepo.revokeRefreshToken(jti);
    await this.cacheService.set(`${cacheKey}:revoked`, true, 3600);

    // Get fresh user data
    const user = await this.authRepo.findUserById(sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new AccountInactiveException();
    }

    return this.generateTokenPair(
      { sub: user.id, tenantId: user.tenantId, email: user.email, role: user.role },
      ipAddress,
      userAgent,
    );
  }

  // ─── Logout ───────────────────────────────────────────────────────────────────
  async logout(jti: string): Promise<void> {
    await this.authRepo.revokeRefreshToken(jti);
    const cacheKey = `${CACHE_KEY_REFRESH_TOKEN}${jti}:revoked`;
    await this.cacheService.set(cacheKey, true, 3600);
  }

  // ─── Logout all devices ───────────────────────────────────────────────────────
  async logoutAll(userId: string): Promise<void> {
    await this.authRepo.revokeAllUserTokens(userId);
  }

  // ─── Change password ──────────────────────────────────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.authRepo.findUserById(userId);
    if (!user) throw new InvalidCredentialsException();

    const fullUser = await this.authRepo.findUserByEmail(user.email);
    if (!fullUser?.passwordHash) throw new InvalidCredentialsException();

    const isCurrentValid = await bcrypt.compare(dto.currentPassword, fullUser.passwordHash);
    if (!isCurrentValid) throw new InvalidCredentialsException();

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.authRepo.updatePassword(userId, newHash);

    // Invalidate all sessions
    await this.authRepo.revokeAllUserTokens(userId);
  }

  // ─── Hash password utility ────────────────────────────────────────────────────
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  // ─── Token generation ─────────────────────────────────────────────────────────
  private async generateTokenPair(
    claims: Omit<JwtPayload, 'jti'>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const jti = uuidv4();
    const accessExpiration = this.configService.get<string>('jwt.accessExpiration', '15m');
    const refreshExpiration = this.configService.get<string>('jwt.refreshExpiration', '7d');

    // Access token
    const accessPayload: JwtPayload = { ...claims, jti };
    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: accessExpiration,
    });

    // Refresh token
    const refreshJti = uuidv4();
    const refreshPayload: RefreshTokenPayload = {
      sub: claims.sub,
      tenantId: claims.tenantId,
      jti: refreshJti,
      type: 'refresh',
    };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: refreshExpiration,
    });

    // Parse expiry
    const expiresInSeconds = this.parseExpiry(accessExpiration);
    const refreshExpiresInSeconds = this.parseExpiry(refreshExpiration);
    const refreshExpiresAt = new Date(Date.now() + refreshExpiresInSeconds * 1000);

    // Store refresh token hash in DB
    const tokenHash = AuthRepository.hashToken(refreshToken);
    await this.authRepo.saveRefreshToken({
      userId: claims.sub,
      tenantId: claims.tenantId,
      jti: refreshJti,
      tokenHash,
      expiresAt: refreshExpiresAt,
      ipAddress,
      userAgent,
    });

    const user = await this.authRepo.findUserById(claims.sub);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
      user: {
        id: claims.sub,
        email: claims.email,
        name: user?.name ?? '',
        role: claims.role,
        tenantId: claims.tenantId,
      },
    };
  }

  private parseExpiry(expiry: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiry);
    if (!match) return 900;
    const [, value, unit] = match;
    const n = parseInt(value!, 10);
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return n * (multipliers[unit!] ?? 60);
  }
}
