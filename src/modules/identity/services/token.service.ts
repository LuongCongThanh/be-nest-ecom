import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // One-way hash: a leaked DB dump cannot be used to forge refresh tokens
  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // `db` accepts a transaction client so callers can include token creation in a broader transaction
  async issueTokenPair(userId: string, email: string, role: string, db: Prisma.TransactionClient | PrismaService = this.prisma) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN') ?? '30m',
    });

    // familyId groups all tokens rotated from the same login session.
    // Reusing a consumed token triggers revocation of the entire family.
    const familyId = randomUUID();
    const refreshTokenValue = randomUUID();
    const refreshTokenHash = this.hashRefreshToken(refreshTokenValue);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.refreshToken.create({
      data: { userId, familyId, tokenHash: refreshTokenHash, expiresAt },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  async refresh(refreshTokenValue: string) {
    const tokenHash = this.hashRefreshToken(refreshTokenValue);

    return this.prisma.$transaction(async (tx) => {
      const tokenRecord = await tx.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException({
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token not found',
        });
      }

      if (tokenRecord.usedAt !== null) {
        // Token already consumed: both user and attacker may hold it — kill entire family
        await tx.refreshToken.updateMany({
          where: { familyId: tokenRecord.familyId },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException({
          code: 'REFRESH_TOKEN_REPLAY_DETECTED',
          message: 'Token reuse detected. All sessions revoked.',
        });
      }

      if (tokenRecord.revokedAt !== null) {
        throw new UnauthorizedException({
          code: 'REFRESH_TOKEN_REVOKED',
          message: 'Refresh token has been revoked',
        });
      }

      if (tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException({
          code: 'REFRESH_TOKEN_EXPIRED',
          message: 'Refresh token has expired',
        });
      }

      await tx.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      });

      const { user } = tokenRecord;
      const newRefreshTokenValue = randomUUID();
      const newRefreshTokenHash = this.hashRefreshToken(newRefreshTokenValue);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          familyId: tokenRecord.familyId,
          tokenHash: newRefreshTokenHash,
          expiresAt,
        },
      });

      const accessToken = this.jwt.sign({ sub: user.id, email: user.email, role: user.role }, { expiresIn: this.config.get('JWT_EXPIRES_IN') ?? '30m' });

      return { accessToken, refreshToken: newRefreshTokenValue };
    });
  }

  async logout(userId: string, refreshTokenValue: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(refreshTokenValue);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, userId },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.revokeAllUserTokens(userId);
  }

  // updateMany + revokedAt instead of delete to preserve audit trail
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
