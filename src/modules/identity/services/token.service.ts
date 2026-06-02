import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService, // dùng để ký và tạo JWT access token
    private readonly config: ConfigService, // đọc JWT_EXPIRES_IN từ .env
    private readonly prisma: PrismaService, // DB mặc định khi không có transaction
  ) {}

  // Lưu hash thay vì raw token để nếu DB bị lộ, attacker không dùng được refresh token.
  // SHA-256 là hàm một chiều: từ hash không thể khôi phục lại raw token gốc.
  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // `db` có thể là PrismaService bình thường hoặc transaction client (Prisma.TransactionClient).
  // Khi register(), user + token phải được tạo trong cùng 1 transaction → truyền `tx` vào.
  // Khi login(), không cần transaction → dùng default `this.prisma`.
  async issueTokenPair(userId: string, email: string, role: string, db: Prisma.TransactionClient | PrismaService = this.prisma) {
    // sub (subject) là convention chuẩn của JWT spec để chứa user id.
    const payload = { sub: userId, email, role };

    // Access token ngắn hạn (30m mặc định): client dùng cái này gọi API.
    // Không lưu vào DB vì JWT tự xác minh được qua chữ ký — không cần tra DB mỗi request.
    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN') ?? '30m',
    });

    // familyId gom các refresh token cùng "dòng" lại với nhau.
    // Khi rotate token, token cũ bị revoke nhưng familyId giữ nguyên.
    // Nếu token cũ trong cùng family được dùng lại → phát hiện reuse → revoke cả family.
    const familyId = randomUUID();

    // refreshTokenValue là raw token gửi về client — client lưu và dùng khi access token hết hạn.
    const refreshTokenValue = randomUUID();

    // Chỉ lưu hash vào DB; khi client gửi lại raw token, server hash lại rồi so sánh với DB.
    const refreshTokenHash = this.hashRefreshToken(refreshTokenValue);

    // Refresh token sống 7 ngày: user không cần đăng nhập lại nếu vẫn active trong 7 ngày.
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Lưu bản ghi refresh token để có thể revoke sau (logout, đổi password, reuse detection).
    await db.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });

    // Trả raw token về caller → caller trả về client.
    // Client nhận refreshToken để dùng khi accessToken hết hạn (Task 13).
    return { accessToken, refreshToken: refreshTokenValue };
  }

  // Thu hồi toàn bộ refresh token còn hiệu lực của user.
  // Dùng khi: đổi password, logout-all-devices.
  // updateMany + set revokedAt thay vì delete để giữ audit trail.
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null }, // chỉ revoke token chưa bị thu hồi trước đó
      data: { revokedAt: new Date() },
    });
  }
}
