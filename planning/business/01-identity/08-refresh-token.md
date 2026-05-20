# TASK-123: Refresh Token & Session Lifecycle

## 📋 Metadata

- **Task ID**: TASK-123
- **Độ ưu tiên**: 🔴 CAO (Security & UX)
- **Phụ thuộc**: TASK-114 (JWT Policy), TASK-116 (Auth Flow)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md)

---

## 🎯 Business Intent

Cân bằng UX (không bắt user re-login mỗi 30 phút) và bảo mật (access token ngắn hạn).

- **Refresh token rotation**: mỗi lần refresh sinh cặp token mới + invalidate token cũ. Phát hiện replay → kill toàn bộ "token family".
- **Revocation phải instant**: logout, change password (TASK-120), admin suspend (TASK-118) đều phải vô hiệu hóa session trong < 5s.
- **Refresh token là stateful**: lưu trong DB để revoke được. Access token vẫn stateless.

---

## 📄 Lifecycle Specification

### 1. Lifespan

| Token         | TTL     | Storage                              |
| :------------ | :------ | :----------------------------------- |
| Access Token  | 30 phút | Stateless JWT                        |
| Refresh Token | 7 ngày  | Stateful — DB table `refresh_tokens` |

### 2. Rotation flow — `POST /auth/refresh`

| #   | Bước                         | Kết quả                                                                |
| :-- | :--------------------------- | :--------------------------------------------------------------------- |
| 1   | Verify RT signature + TTL    | Fail → `401 INVALID_REFRESH_TOKEN`                                     |
| 2   | Lookup RT trong DB           | Không có / revoked → kill toàn bộ family + `401 REFRESH_TOKEN_REVOKED` |
| 3   | Sinh cặp AT + RT mới         | RT mới link với cùng `familyId`                                        |
| 4   | Mark RT cũ là `usedAt = now` | Không xóa — giữ để detect replay                                       |
| 5   | Return cặp mới cho client    | —                                                                      |

### 3. Replay detection

- Nếu một RT đã có `usedAt != null` được dùng lại → **kill toàn bộ family** (revoke mọi RT cùng `familyId`).
- Coi như attacker đã chiếm RT — buộc user re-login.

### 4. Revocation triggers

| Trigger                                            | Phạm vi         |
| :------------------------------------------------- | :-------------- |
| User logout (`POST /auth/logout`)                  | Chỉ RT hiện tại |
| User "logout everywhere" (`POST /auth/logout-all`) | Mọi RT của user |
| Đổi password (TASK-120)                            | Mọi RT của user |
| Admin suspend (TASK-118)                           | Mọi RT của user |

---

## ✅ Acceptance Criteria

**AC-1: Rotation cấp cặp token mới**

- **Given** RT hợp lệ, chưa dùng
- **When** POST /auth/refresh
- **Then** response chứa cặp `(accessToken, refreshToken)` mới; RT cũ trong DB có `usedAt = now`

**AC-2: Replay attack kill toàn family**

- **Given** RT_1 đã được dùng để refresh ra RT_2
- **When** attacker thử dùng lại RT_1
- **Then** response `401 REFRESH_TOKEN_REPLAY_DETECTED`; cả RT_1 và RT_2 (và RT_3, RT_4… cùng family) đều bị revoke; user buộc re-login

**AC-3: Logout-all revoke toàn bộ RT**

- **Given** User đang có 3 RT active
- **When** gọi POST /auth/logout-all
- **Then** cả 3 RT trong DB đều có `revokedAt = now`; mọi refresh tiếp theo đều fail

**AC-4: Change password trigger revocation**

- **Given** User có 2 RT trên 2 thiết bị
- **When** đổi password thành công (TASK-120)
- **Then** cả 2 RT bị revoke ngay; refresh trên thiết bị thứ 2 fail với `401`

**AC-5: AT vẫn hợp lệ đến hết TTL khi RT bị revoke**

- **Given** RT đã bị revoke nhưng AT của chính phiên đó còn TTL 10 phút
- **When** gọi API bảo vệ bằng AT đó
- **Then** request vẫn pass (chấp nhận trade-off vì AT stateless). Sau khi AT hết hạn, không refresh được → user phải re-login.

> Ghi chú AC-5: nếu muốn revoke AT tức thì → cần introspection endpoint hoặc token blacklist Redis (giai đoạn scale sau — TASK-307).

---

## 🚫 Out of Scope

- Access token revocation tức thì (blacklist) → giai đoạn scale sau.
- Device fingerprinting / device list UI → backlog.
- Session sharing across multiple browser tabs (SSO) → ngoài phạm vi.
