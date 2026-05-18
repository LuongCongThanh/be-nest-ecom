# TASK-120: Change Password Flow

## 📋 Metadata

- **Task ID**: TASK-120
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Security)
- **Phụ thuộc**: TASK-116 (Auth Flow)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../CONTEXT.md`](../CONTEXT.md)

---

## 🎯 Business Intent

Đổi mật khẩu là **không gian phòng thủ cuối cùng**: nếu attacker đã chiếm được access token, họ KHÔNG được phép đổi password để khóa chủ thật.

- **Current password verify** là barrier bắt buộc — không phụ thuộc duy nhất vào access token.
- **Đổi password = revoke mọi session** (kể cả session đang request) — buộc đăng nhập lại trên mọi thiết bị.
- **Không log password** ở bất kỳ tầng nào (kể cả error log).

> ⚠️ Phân biệt rõ với [`TASK-124 Password Recovery`](./TASK-124-Account-Verification-Password-Recovery.md): TASK-120 là **user đang login**; TASK-124 là **user quên mật khẩu**.

---

## 📄 Flow Specification — `POST /me/password`

| # | Bước | Kiểm tra | Lỗi |
| :- | :--- | :--- | :--- |
| 1 | Identity | User từ JWT (TASK-114) | `401` (đã chặn ở guard) |
| 2 | Current password verify | bcrypt.compare với hash hiện tại | `401 INVALID_CURRENT_PASSWORD` |
| 3 | New password policy | Cùng quy tắc TASK-115 (strength) | `422 WEAK_PASSWORD` |
| 4 | Confirm match | `newPassword === confirmPassword` | `422 CONFIRM_MISMATCH` |
| 5 | Reuse check | `newPassword !== currentPassword` (so sánh hash trước update) | `422 PASSWORD_REUSE` |
| 6 | Hash + persist | Cập nhật atomic | — |
| 7 | Session revocation | Vô hiệu hóa toàn bộ refresh token của user (xem TASK-123) | — |
| 8 | Event log | Ghi audit event `PASSWORD_CHANGED` với userId, IP, userAgent, timestamp | — |

### Request shape

```json
{ "currentPassword": "...", "newPassword": "...", "confirmPassword": "..." }
```

---

## ✅ Acceptance Criteria

**AC-1: Sai current password bị reject dù token hợp lệ**
- **Given** User có access token hợp lệ
- **When** POST /me/password với `currentPassword` sai
- **Then** response `401 INVALID_CURRENT_PASSWORD`, password trong DB KHÔNG đổi

**AC-2: Đổi password = logout mọi thiết bị**
- **Given** User đang login trên 3 thiết bị (3 refresh token active)
- **When** đổi password thành công ở thiết bị 1
- **Then** trong vòng 5 giây, refresh token ở thiết bị 2 và 3 đều bị reject. User phải login lại.

**AC-3: Không cho phép reuse password ngay lập tức**
- **Given** Current password `"OldPass@123"`
- **When** POST /me/password với `newPassword = "OldPass@123"`
- **Then** response `422 PASSWORD_REUSE`

**AC-4: Password không xuất hiện trong log**
- **Given** kích hoạt error case (network drop giữa request)
- **When** kiểm tra log file/stdout
- **Then** không tìm thấy chuỗi plaintext password ở bất kỳ log entry nào (kể cả request body dump)

**AC-5: Audit event được ghi**
- **Given** đổi password thành công
- **When** kiểm tra audit storage
- **Then** có 1 entry `PASSWORD_CHANGED` với userId, IP, userAgent, timestamp UTC

---

## 🚫 Out of Scope

- Password recovery (quên mật khẩu) → TASK-124.
- Password history (chống reuse N lần gần nhất) → backlog.
- Centralized audit log infrastructure → Phase 3 TASK-312.
