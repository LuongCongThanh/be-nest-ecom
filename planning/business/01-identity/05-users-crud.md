# TASK-118: Users CRUD (Admin Governance)

## 📋 Metadata

- **Task ID**: TASK-118
- **Độ ưu tiên**: 🟡 TRUNG BÌNH (Operations)
- **Phụ thuộc**: TASK-107 (User Entity), TASK-117 engineering (Guards)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../CONTEXT.md`](../../CONTEXT.md)

---

## 🎯 Business Intent

CRUD ở đây **không phải public CRUD** — là cổng vận hành dành cho `ADMIN`/`STAFF` để xử lý support ticket, vi phạm chính sách, audit. End-user dùng [`TASK-119 Profile`](./06-user-profile.md) cho thao tác cá nhân.

- **Mọi xóa là soft-delete** (TASK-106 AC-2/3).
- **Admin không tự nâng quyền cho chính mình** — bắt buộc một Admin khác phê duyệt (xem AC-3).
- **GDPR ready**: khi User yêu cầu xóa tài khoản, email được anonymize (`deleted_<uuid>@anonymized.local`) để không chiếm chỗ unique.

---

## 📄 Endpoints (Admin scope)

| Endpoint | Method | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `/admin/users` | GET | ADMIN | List có pagination + filter (role, isActive) |
| `/admin/users/:id` | GET | ADMIN, STAFF | Detail user (cho support) |
| `/admin/users/:id/suspend` | POST | ADMIN | Set `isActive = false` |
| `/admin/users/:id/reactivate` | POST | ADMIN | Set `isActive = true` |
| `/admin/users/:id/role` | PATCH | ADMIN | Đổi role |
| `/admin/users/:id` | DELETE | ADMIN | Soft delete + anonymize email + revoke all tokens |

---

## ✅ Acceptance Criteria

**AC-1: Non-admin không list được user**
- **Given** User role `USER` có token hợp lệ
- **When** gọi `GET /admin/users`
- **Then** response `403 FORBIDDEN`, không leak thông tin về số lượng user

**AC-2: Soft delete bảo toàn Order history**
- **Given** User có 5 Order trong DB
- **When** Admin gọi `DELETE /admin/users/:id`
- **Then** User được mark `deletedAt`, email được anonymize, nhưng 5 Order vẫn truy vấn được kèm `customerEmailSnapshot` gốc

**AC-3: Admin không tự nâng quyền cho chính mình**
- **Given** Admin A có token hợp lệ
- **When** Admin A gọi `PATCH /admin/users/<A_id>/role` với body `{ role: "ADMIN" }` (giữ nguyên) hoặc bất kỳ giá trị nào
- **Then** response `403 SELF_ROLE_CHANGE_FORBIDDEN`

**AC-4: Suspend revoke session ngay lập tức**
- **Given** User đang có 2 refresh token active
- **When** Admin suspend User
- **Then** trong vòng 5 giây, mọi request dùng access/refresh token của User đó đều bị reject

---

## 🚫 Out of Scope

- Self-service profile (user thao tác trên chính mình) → TASK-119.
- Self-service password change → TASK-120.
- Audit log cho admin actions → Phase 3 TASK-312 (Observability).
- Bulk operations (suspend nhiều user một lúc) → backlog.
