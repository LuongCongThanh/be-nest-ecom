# TASK-116: Register & Login Business Flow

## 📋 Metadata

- **Task ID**: TASK-116
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Core Business)
- **Phụ thuộc**: TASK-115 (Auth Contract)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md)

---

## 🎯 Business Intent

Đây là **2 luồng quan trọng nhất Phase 1**: chúng định nghĩa thế nào là "user hợp lệ" cho toàn hệ thống.

- **Password = one-way hash**, không bao giờ là plaintext sau khi rời tay client.
- **Login error message phải mơ hồ**: không tiết lộ email có tồn tại hay không — chống enumeration attack.
- **Atomic registration**: User được tạo + welcome email gửi (TASK-124) phải toàn-hoặc-không.

---

## 📄 Business Flows

### 1. Registration Flow

| # | Bước | Hành động | Lỗi có thể trả về |
| :- | :--- | :--- | :--- |
| 1 | Validate | Áp dụng DTO TASK-115 | `422 VALIDATION_FAILED` |
| 2 | Conflict check | Email đã tồn tại? | `409 EMAIL_ALREADY_EXISTS` |
| 3 | Hash | Bcrypt cost factor ≥ 12 hoặc Argon2id | — |
| 4 | Persist | Insert User với `emailVerified=false`, `isActive=true` | — |
| 5 | Side-effect | Dispatch verification email (xem TASK-124) | Side-effect không được block response |
| 6 | Issue tokens | Cấp access + refresh (TASK-114, 123) | — |

### 2. Login Flow

| # | Bước | Hành động | Lỗi có thể trả về |
| :- | :--- | :--- | :--- |
| 1 | Validate | DTO TASK-115 | `422` |
| 2 | Identity lookup | `findByEmail(lower(email))` | — |
| 3 | Secure compare | `bcrypt.compare` (time-constant) | Bước 2+3 fail → `401 INVALID_CREDENTIALS` (chung) |
| 4 | State check | `isActive`, `deletedAt IS NULL` | `401 ACCOUNT_INACTIVE` |
| 5 | Issue tokens | Như register | — |

---

## ✅ Acceptance Criteria

**AC-1: Password không bao giờ được lưu plaintext**
- **Given** User đăng ký với `password = "Strong@Pass123"`
- **When** kiểm tra row trong DB
- **Then** giá trị column `password` là hash bcrypt/argon (không bằng plaintext), độ dài ≥ 60 ký tự

**AC-2: Login error message không leak email existence**
- **Given** Request 1: email tồn tại + password sai. Request 2: email không tồn tại + password bất kỳ
- **When** so sánh hai response
- **Then** cả hai trả về cùng `401 INVALID_CREDENTIALS`, cùng response body, không khác biệt timing đáng kể (> 50ms threshold)

**AC-3: Duplicate email bị từ chối**
- **Given** đã tồn tại User với email `bob@x.com`
- **When** đăng ký lại với cùng email (kể cả khác case)
- **Then** response `409 EMAIL_ALREADY_EXISTS`, không có User mới được tạo

**AC-4: Welcome email side-effect không block response**
- **Given** SMTP server tạm thời down
- **When** User register
- **Then** response register vẫn `201 Created` trong < 500ms; email được retry async (queue/cron)

**AC-5: Atomic registration**
- **Given** lỗi DB xảy ra sau khi User được insert nhưng trước khi token được sinh
- **When** request register
- **Then** User vừa insert phải bị rollback — không có "orphan user" không thể login

---

## 🚫 Out of Scope

- Email verification token generation → TASK-124.
- Refresh token rotation → TASK-123.
- Rate limiting on auth endpoints → Phase 3 TASK-313.
- OAuth/social login → Phase 3 TASK-327.
