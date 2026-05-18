# TASK-107: Đặc tả User Entity (Identity)

## 📋 Metadata

- **Task ID**: TASK-107
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Security Core)
- **Phụ thuộc**: TASK-106 (Schema Strategy)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../CONTEXT.md`](../CONTEXT.md)
> 🛠️ Base entity pattern: [`project-conventions.vi.md §11`](../../engineering/project-conventions.vi.md)

---

## 🎯 Business Intent

`User` là **aggregate root duy nhất** của bounded context Identity. Mọi tương tác trong hệ thống đều có một User đứng sau. Đặc tả này chốt **shape nghiệp vụ** của User, không phải triển khai schema.

- **Identity = email + role**; không có cơ chế multi-email hay multi-tenant trong Phase 1.
- **Role là enum 3 giá trị cố định**: `USER`, `STAFF`, `ADMIN` (xem `CONTEXT.md`). KHÔNG mở rộng thành permission-based RBAC ở Phase 1 — đẩy xuống Phase 3 (TASK-320).
- **Password là write-only** từ góc nhìn API: client gửi vào lúc đăng ký / change password, không bao giờ đọc ra.

---

## 📄 Domain Specification

### 1. Thuộc tính nghiệp vụ

| Trường | Vai trò nghiệp vụ | Ràng buộc |
| :--- | :--- | :--- |
| `id` | Identity confidential | UUID v4, KHÔNG dùng auto-increment |
| `email` | Identity contact + login key | Unique, lowercase normalized |
| `password` | Credential | Hashed (bcrypt/argon2), không bao giờ trả về |
| `firstName`, `lastName` | Hiển thị | Trim, ≤ 50 ký tự |
| `phone` | Optional contact | Định dạng `+84…` hoặc `0…` |
| `role` | Quyền truy cập | Enum: `USER`/`STAFF`/`ADMIN`, default `USER` |
| `isActive` | Kích hoạt vận hành | Default `true`; cho phép suspend không cần xóa |
| `emailVerified` | Niềm tin định danh | Default `false`, chuyển sang `true` qua TASK-124 |

### 2. Account Governance

- **Soft delete**: dùng cờ `deletedAt`; KHÔNG hard-delete (xem TASK-106).
- **Email immutable sau khi verified**: muốn đổi email phải qua flow re-verify (ngoài Phase 1).
- **Role escalation**: chỉ `ADMIN` được đổi role. Self-update bị ignore.

---

## ✅ Acceptance Criteria

**AC-1: Email là identity duy nhất**
- **Given** đã tồn tại User với `email = "alice@example.com"`
- **When** đăng ký với `email = "Alice@Example.COM"` (khác case)
- **Then** hệ thống trả về `409 EMAIL_ALREADY_EXISTS` (so sánh sau khi lowercase)

**AC-2: Password không bao giờ leak**
- **Given** User đã được tạo
- **When** gọi mọi endpoint trả về user data (`/me`, `/users/:id`, list)
- **Then** response JSON không chứa key `password` ở bất kỳ độ sâu nào

**AC-3: Identity confidential trong public API**
- **Given** danh sách 100 User trong DB
- **When** một attacker thử brute-force ID tuần tự (`/users/1`, `/users/2`…)
- **Then** không thể đoán được ID hợp lệ — mọi ID đều là UUID v4

**AC-4: Role enum đóng băng**
- **Given** request update profile với `role = "SUPER_ADMIN"`
- **When** xử lý request
- **Then** validation reject ngay với `422 VALIDATION_FAILED` (giá trị không nằm trong enum)

---

## 🚫 Out of Scope

- Permission/scope-based access (RBAC chi tiết) → Phase 3 TASK-320.
- Email change flow → backlog.
- Multi-factor authentication → Phase 3 TASK-319.
