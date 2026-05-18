# TASK-114: Chính sách JWT Authentication

## 📋 Metadata

- **Task ID**: TASK-114
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Security)
- **Phụ thuộc**: TASK-107 (User Entity)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md)
> 🛠️ Middleware mechanism (Guards/Decorators) thuộc engineering: [`CONVENTIONS.md §12`](../../setup/CONVENTIONS.md) · [`TASK-117`](../../setup/03-conventions/04-guards-decorators.md)

---

## 🎯 Business Intent

Task này chốt **chính sách nghiệp vụ** cho cơ chế xác thực không trạng thái — KHÔNG mô tả cài đặt thư viện. Implementation chi tiết được điều phối qua engineering convention §12.

- **Stateless là quyết định kiến trúc cốt lõi**: cho phép horizontal scale không cần sticky session.
- **Access token ngắn hạn** giảm rủi ro lộ; **refresh token** giải quyết UX (xem TASK-123).
- **Payload tối thiểu**: token chỉ chứa định danh cần thiết — không nhét thông tin nhạy cảm hay payload nghiệp vụ thay đổi nhanh.

---

## 📄 Chính sách Vận hành

### 1. Issuance Policy

| Mục | Quyết định | Ghi chú |
| :--- | :--- | :--- |
| Thuật toán ký | **HS256** | Phase 1 đơn dịch vụ. Nếu sau này tách microservices, migrate sang RS256 |
| Access Token TTL | **30 phút** | |
| Refresh Token TTL | **7 ngày** | Chi tiết rotation: TASK-123 |
| Payload chuẩn | `{ sub, email, role, iat, exp }` | Cấm thêm bất kỳ field nào không nằm trong danh sách |
| Secret storage | `JWT_SECRET` env var | Validate khi boot (TASK-102) |

### 2. Validation Policy

- **Fail-fast** ở guard layer trước business logic.
- **Identity re-check**: sau khi decode, phải verify User vẫn `isActive = true` và `deletedAt IS NULL`. Token vẫn còn TTL nhưng User bị suspend → reject ngay.
- **Clock skew tolerance**: 30 giây.

---

## ✅ Acceptance Criteria

**AC-1: Expired token bị reject**
- **Given** access token đã hết hạn (`exp < now - 30s`)
- **When** request gọi endpoint bảo vệ
- **Then** response `401 TOKEN_EXPIRED`, không lộ User info

**AC-2: Tampered signature bị reject**
- **Given** một access token hợp lệ
- **When** client sửa 1 byte trong phần signature
- **Then** response `401 INVALID_SIGNATURE`

**AC-3: Suspended user không pass dù token còn hạn**
- **Given** User đã login, token còn 20 phút TTL; sau đó Admin set `isActive = false`
- **When** User gọi endpoint bảo vệ
- **Then** response `401 ACCOUNT_INACTIVE`

**AC-4: Payload không leak data nhạy cảm**
- **Given** token vừa được cấp
- **When** decode payload (không cần verify signature)
- **Then** payload chỉ chứa `{ sub, email, role, iat, exp }` — không có `password`, `phone`, `firstName`, etc.

---

## 🚫 Out of Scope

- Cấu hình guards/decorators concrete → [`engineering §12`](../../setup/CONVENTIONS.md) + TASK-117.
- Refresh token rotation logic → TASK-123.
- Social login / OAuth → Phase 3 TASK-327.
- 2FA → Phase 3 TASK-319.
