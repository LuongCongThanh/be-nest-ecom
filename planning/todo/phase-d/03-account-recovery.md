# Task D-03 — Account Recovery (Email Verification + Forgot Password)

**Phase**: D — Polish  
**Ước lượng**: 5 giờ  
**Phụ thuộc**: Task D-02  
**Spec gốc**: [09-account-recovery.md](../../business/01-identity/09-account-recovery.md)

---

## Nhiệm vụ

Implement email verification flow và forgot password flow với one-time token. `PASSWORD_RESET` hết hạn sau 1 giờ; `EMAIL_VERIFICATION` nên dài hơn, ví dụ 24 giờ.

---

## Các bước thực hiện

### 1. Cài Nodemailer (email)

```bash
npm install nodemailer @nestjs-modules/mailer
npm install --save-dev @types/nodemailer
```

### 2. Thêm EmailToken model vào schema.prisma

```prisma
enum TokenType {
  EMAIL_VERIFICATION
  PASSWORD_RESET
}

model EmailToken {
  id        String    @id @default(uuid())
  userId    String
  tokenHash String    @unique
  type      TokenType
  usedAt    DateTime?
  expiresAt DateTime
  createdAt DateTime  @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@map("email_tokens")
}
```

```bash
npx prisma migrate dev --name add-email-tokens
```

### 3. Thêm biến env

```
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
SMTP_FROM=noreply@ecom.dev
APP_URL=http://localhost:3000
```

Dùng Mailtrap (https://mailtrap.io) để nhận email trong dev — miễn phí.

> Giống refresh token ở Phase B, không lưu raw email token trong DB. Chỉ lưu hash của token; raw token chỉ đi qua email link gửi cho user.

### 4. Tạo MailService

Tạo `src/common/mail/mail.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST'),
      port: config.get<number>('SMTP_PORT'),
      auth: {
        user: config.get('SMTP_USER'),
        pass: config.get('SMTP_PASS'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = `${this.config.get('APP_URL')}/api/v1/auth/verify-email?token=${token}`;
    try {
      await this.transporter.sendMail({
        from: this.config.get('SMTP_FROM'),
        to: email,
        subject: 'Verify your email',
        html: `<p>Click <a href="${url}">here</a> to verify your email. Link expires in 24 hours.</p>`,
      });
    } catch (e) {
      this.logger.error('Failed to send verification email', e);
      // Không throw — email failure không block register
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const url = `${this.config.get('APP_URL')}/api/v1/auth/reset-password?token=${token}`;
    try {
      await this.transporter.sendMail({
        from: this.config.get('SMTP_FROM'),
        to: email,
        subject: 'Reset your password',
        html: `<p>Click <a href="${url}">here</a> to reset your password. Link expires in 1 hour.</p>`,
      });
    } catch (e) {
      this.logger.error('Failed to send password reset email', e);
    }
  }
}
```

### 5. Thêm endpoints vào AuthController

```typescript
// Verify email
@Public()
@Get('verify-email')
async verifyEmail(@Query('token') token: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const record = await this.prisma.emailToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date() || record.type !== 'EMAIL_VERIFICATION') {
    throw new BadRequestException({ code: 'INVALID_VERIFICATION_TOKEN', message: 'Invalid or expired token' });
  }

  await this.prisma.$transaction([
    this.prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    this.prisma.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return { message: 'Email verified successfully' };
}

// Forgot password
@Public()
@Post('forgot-password')
async forgotPassword(@Body() body: { email: string }) {
  const user = await this.prisma.user.findFirst({
    where: { email: body.email.toLowerCase(), deletedAt: null }
  });

  // Không leak email existence — luôn trả 200
  if (user) {
    const token = randomUUID();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ

    await this.prisma.emailToken.create({
      data: { userId: user.id, tokenHash, type: 'PASSWORD_RESET', expiresAt }
    });

    // Fire-and-forget
    this.mailService.sendPasswordResetEmail(user.email, token);
  }

  return { message: 'If the email exists, a reset link has been sent.' };
}

// Reset password
@Public()
@Post('reset-password')
async resetPassword(@Body() body: { token: string; newPassword: string }) {
  const tokenHash = createHash('sha256').update(body.token).digest('hex');
  const record = await this.prisma.emailToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date() || record.type !== 'PASSWORD_RESET') {
    throw new BadRequestException({ code: 'INVALID_RESET_TOKEN', message: 'Invalid or expired token' });
  }

  const hashedPassword = await bcrypt.hash(body.newPassword, 12);

  await this.prisma.$transaction([
    this.prisma.user.update({ where: { id: record.userId }, data: { password: hashedPassword } }),
    this.prisma.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    this.prisma.refreshToken.updateMany({ where: { userId: record.userId }, data: { revokedAt: new Date() } }),
  ]);

  return { message: 'Password reset successfully' };
}
```

> Register flow ở Phase B chưa gửi verification mail. Hãy bổ sung bước tạo `EMAIL_VERIFICATION` token sau khi register thành công, rồi gọi `mailService.sendVerificationEmail(...)`.

---

## Verify hoàn thành

1. Đăng ký → check Mailtrap → nhận email verify
2. Click link verify hoặc gọi `GET /auth/verify-email?token=...` → `emailVerified = true`
3. Gọi `POST /auth/forgot-password` với email hợp lệ → Mailtrap nhận email reset
4. Lấy token từ email → `POST /auth/reset-password` → đăng nhập với password mới thành công
5. Dùng token đã used → `400 INVALID_RESET_TOKEN`

---

## Xong thì làm gì?

→ [04-phase-d-exit-gate.md](./04-phase-d-exit-gate.md)
