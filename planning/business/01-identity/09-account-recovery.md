# TASK-124: Account Verification & Password Recovery

## 📋 Metadata

- **Task ID**: TASK-124
- **Độ ưu tiên**: 🔴 CAO (Security & Integrity)
- **Phụ thuộc**: TASK-116 (Register/Login)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md)
> 🛠️ SMTP config: [`engineering §6`](../../setup/CONVENTIONS.md) ([`TASK-102`](../../setup/01-project/02-env-config.md))

---

## 🎯 Business Intent

Hai luồng nghiệp vụ tách biệt nhưng dùng chung **hạ tầng token một lần** (one-time tokens):

1. **Account Verification** — khẳng định email là thật, người đăng ký có quyền nhận mail.
2. **Password Recovery** — cho phép user tự lấy lại quyền truy cập mà không cần support.

Nguyên tắc bất biến:

- **Token một lần dùng**: dùng xong → invalidate.
- **TTL ngắn**: 24h cho verification, 1h cho password reset.
- **Không lộ tồn tại tài khoản**: response của "forgot password" KHÔNG được khác nhau giữa "email tồn tại" và "email không tồn tại".
- **Không bao giờ gửi password (cũ hay mới) qua email** — chỉ link chứa token.

---

## 📄 Flow Specifications

### 1. Email Verification

| #   | Bước       | Trigger                    | Hành động                                                                                                 |
| :-- | :--------- | :------------------------- | :-------------------------------------------------------------------------------------------------------- |
| 1   | Sinh token | Sau register (TASK-116)    | Sinh `verificationToken` (UUID + signed), lưu DB với `expiresAt = now + 24h`                              |
| 2   | Gửi email  | Async (queue)              | Email chứa link `https://app/verify?token=<TOKEN>`                                                        |
| 3   | User click | —                          | `GET /auth/verify?token=...`                                                                              |
| 4   | Verify     | —                          | Check token tồn tại, chưa dùng, chưa hết hạn → set `user.emailVerified = true`, mark token `usedAt = now` |
| 5   | Resend     | `POST /auth/verify/resend` | Throttle 1 request / 60s / user. Sinh token mới, invalidate token cũ                                      |

### 2. Password Recovery — `POST /auth/forgot-password`

| #   | Bước                                                                       | Hành động                                                                 |
| :-- | :------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| 1   | Receive email                                                              | Validate format                                                           |
| 2   | Lookup user                                                                | Không tìm thấy → **vẫn return 200 OK** (chống enumeration)                |
| 3   | Sinh `resetToken`                                                          | UUID + signed, TTL 1h, lưu DB                                             |
| 4   | Gửi email reset link                                                       | Async                                                                     |
| 5   | User click → form đặt password mới                                         | `POST /auth/reset-password` với `{ token, newPassword, confirmPassword }` |
| 6   | Validate token + apply password policy (TASK-115)                          | —                                                                         |
| 7   | Update password (hash) + invalidate token + revoke mọi RT (giống TASK-120) | —                                                                         |

---

## ✅ Acceptance Criteria

**AC-1: Verification token hết hạn không dùng được**

- **Given** verification token cấp lúc T, có TTL 24h
- **When** user click link tại T + 25h
- **Then** response `400 TOKEN_EXPIRED`, `emailVerified` vẫn `false`, hệ thống đề xuất resend

**AC-2: Forgot password không leak email existence**

- **Given** request 1: email tồn tại. Request 2: email không tồn tại.
- **When** so sánh response
- **Then** cả hai trả về `200 OK` với cùng message generic "Nếu email tồn tại, một link reset đã được gửi"; timing khác biệt < 100ms

**AC-3: Token một lần dùng**

- **Given** reset token đã được dùng để đặt password mới
- **When** attacker thử dùng lại token đó
- **Then** response `400 TOKEN_ALREADY_USED`

**AC-4: Reset password revoke mọi session**

- **Given** User có 2 RT active
- **When** reset password thành công
- **Then** cả 2 RT bị revoke (giống TASK-120 AC-2)

**AC-5: Resend throttle**

- **Given** User vừa request resend verification email
- **When** request lại trong vòng 60s
- **Then** response `429 TOO_MANY_REQUESTS` với `Retry-After: <seconds>`

**AC-6: Email không chứa password**

- **Given** kích hoạt mọi loại email (verify, reset)
- **When** kiểm tra HTML body
- **Then** không có chuỗi nào là password (plaintext hoặc hash)

---

## 🚫 Out of Scope

- Email template design / branding → backlog / marketing.
- SMS-based recovery → Phase 3 TASK-319 (2FA).
- Centralized email service (queue + retry infrastructure) → Phase 2 TASK-226 (Notifications).
- Captcha trên forgot-password → Phase 3 TASK-313.
