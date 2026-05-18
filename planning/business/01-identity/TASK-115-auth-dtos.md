# TASK-115: Auth API Contracts (Register / Login DTO)

## 📋 Metadata

- **Task ID**: TASK-115
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Frontend Contract)
- **Phụ thuộc**: TASK-114 (JWT Policy)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../CONTEXT.md`](../../CONTEXT.md)
> 🛠️ Validation pipeline & error schema: [`CONVENTIONS.md §3, §14`](../../setup/CONVENTIONS.md)

---

## 🎯 Business Intent

Đóng băng **shape API auth** trước khi frontend/mobile bắt đầu develop song song. Khi DTO đã merge main, **mọi thay đổi phải qua versioning hoặc cộng-thêm-field** (additive only).

- **Single contract source**: file DTO trong code là canonical, không có Postman collection / docs nào "song song".
- **Validation tại biên**: reject sớm, không cho dữ liệu rác chạm tới service layer.

---

## 📄 Contract Specification

### 1. Register Contract — `POST /auth/register`

| Field | Type | Rule | Mã lỗi `code` khi fail |
| :--- | :--- | :--- | :--- |
| `email` | string | Valid email, lowercase normalize, unique | `INVALID_EMAIL`, `EMAIL_ALREADY_EXISTS` |
| `password` | string | ≥ 8 ký tự, có chữ hoa + số + ký tự đặc biệt | `WEAK_PASSWORD` |
| `firstName` | string | Trim, 1-50 ký tự, không empty sau trim | `INVALID_NAME` |
| `lastName` | string | Trim, 1-50 ký tự | `INVALID_NAME` |
| `phone` | string? | Optional, regex `^(?:\+84|0)[0-9]{9,10}$` | `INVALID_PHONE` |

### 2. Login Contract — `POST /auth/login`

| Field | Type | Rule | Mã lỗi |
| :--- | :--- | :--- | :--- |
| `email` | string | Valid email format | `INVALID_EMAIL` |
| `password` | string | Non-empty | `MISSING_PASSWORD` |

> ⚠️ Login KHÔNG validate độ phức tạp password — tránh side-channel leak (xem TASK-116 AC-2).

### 3. Response Shape — `200 OK` cho login/register

```json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "USER|STAFF|ADMIN",
    "emailVerified": false
  },
  "accessToken": "jwt-string",
  "refreshToken": "jwt-string",
  "expiresIn": 1800
}
```

---

## ✅ Acceptance Criteria

**AC-1: Weak password bị reject**
- **Given** payload register có `password = "12345678"` (8 chars nhưng chỉ số)
- **When** POST /auth/register
- **Then** response `422` với `errors: [{ field: "password", code: "WEAK_PASSWORD" }]`

**AC-2: Mass-assignment bị chặn**
- **Given** payload register có thêm field `role: "ADMIN"`
- **When** POST /auth/register
- **Then** response `422 VALIDATION_FAILED` (do `forbidNonWhitelisted`), user KHÔNG được tạo

**AC-3: Email được normalize**
- **Given** payload register có `email = "  Alice@Example.COM  "`
- **When** POST /auth/register thành công
- **Then** DB lưu `email = "alice@example.com"` (trimmed + lowercased)

**AC-4: Response không leak password hash**
- **Given** register/login thành công
- **When** kiểm tra response body
- **Then** không có field `password` ở bất kỳ độ sâu nào của JSON

---

## 🚫 Out of Scope

- Custom validator implementation → [`engineering §14`](../../setup/CONVENTIONS.md).
- Global error filter wiring → [`TASK-105`](../../setup/03-conventions/TASK-105-validation-error.md).
- Swagger generation → [`TASK-215`](../../setup/04-cross-cutting/TASK-215-swagger.md).
