# TASK-119: User Self-Service Profile

## 📋 Metadata

- **Task ID**: TASK-119
- **Độ ưu tiên**: 🔵 TRUNG BÌNH (User Experience)
- **Phụ thuộc**: TASK-118 (User Operations)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../CONTEXT.md`](../../CONTEXT.md)

---

## 🎯 Business Intent

End-user self-service: xem và cập nhật thông tin của **chính họ**. Tách hoàn toàn khỏi admin governance (TASK-118).

- **Identity Context** đến từ JWT — KHÔNG cho phép truy cập profile người khác qua endpoint cá nhân.
- **Field-level allowlist**: chỉ một số field cụ thể được phép update; mọi field khác bị silently ignore (không raise error → tránh leak field tồn tại).
- **Email và role là sacred**: muốn đổi email phải qua re-verify flow; role chỉ Admin (TASK-118).

---

## 📄 Endpoints

| Endpoint | Method | Mô tả | Field cho phép |
| :--- | :--- | :--- | :--- |
| `/me` | GET | Profile của chính user (từ JWT context) | — |
| `/me` | PATCH | Update profile | `firstName`, `lastName`, `phone` |

### Field classification

- **Mutable (self)**: `firstName`, `lastName`, `phone`.
- **Restricted (qua flow riêng)**: `email` (re-verify), `password` (TASK-120).
- **Admin-only**: `role`, `isActive`.

---

## ✅ Acceptance Criteria

**AC-1: GET /me trả về đúng user của token**
- **Given** User A login, có access token T_A
- **When** gọi `GET /me` với `Authorization: Bearer T_A`
- **Then** response chứa profile của A (id, email, name, role, emailVerified); không có field `password`

**AC-2: Không truy cập được profile user khác qua /me**
- **Given** không tồn tại endpoint nào dạng `GET /me/:id`
- **When** quét routes
- **Then** chỉ có `GET /me` (không tham số), forced lấy user từ JWT

**AC-3: Role escalation attempt bị ignore**
- **Given** User role `USER`, gửi `PATCH /me` với body `{ firstName: "Bob", role: "ADMIN" }`
- **When** response trả về
- **Then** `firstName` được update thành "Bob", nhưng `role` vẫn là `USER` trong DB (forbidNonWhitelisted reject hoặc service whitelist filter)

**AC-4: Email không thể đổi qua /me**
- **Given** User gửi `PATCH /me` với `{ email: "new@x.com" }`
- **When** xử lý
- **Then** email trong DB không đổi; response `422 VALIDATION_FAILED` HOẶC field bị silently ignore (chọn 1 — đề xuất reject để rõ ràng)

---

## 🚫 Out of Scope

- Avatar / file upload → Phase 2 TASK-223.
- Email change flow (re-verify) → backlog.
- Address book management → Phase 2 (gắn với Order).
- Password change → TASK-120.
