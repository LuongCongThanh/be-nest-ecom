# 📜 Identity Charter — Foundation & Identity

> Đây là tài liệu khung của bounded context **Identity**. Mọi task trong context này đều phải gắn với mục tiêu, scope, và success criteria trong file này.

---

## 🎯 Mục tiêu Context

Xây dựng **bounded context Identity** hoàn chỉnh: User → Authentication → Authorization → Account lifecycle.
Identity KHÔNG bao gồm Catalog/Cart/Order — các entity đó được đặc tả ở các context commerce tương ứng và được triển khai theo execution path trong `../../todo/`.

### Lý do tồn tại của Context

1. **Identity là gốc của mọi quyền truy cập** — không thể triển khai Catalog/Order trước khi xác định ai là người dùng.
2. **Schema-level decision lock-in** — các quyết định về User entity (UUID, role enum, soft-delete) ảnh hưởng đến mọi bảng FK sau này.
3. **Auth contract đóng băng sớm** — frontend & mobile phụ thuộc vào shape của login response để bắt đầu phát triển song song.

---

## 📦 Scope của Identity

### ✅ TRONG SCOPE

| Nhóm                 | Task               | Mô tả ngắn                                                                 |
| :------------------- | :----------------- | :------------------------------------------------------------------------- |
| **Data Foundation**  | TASK-106           | Chiến lược schema chung (snapshot, FK rules, delete strategy)              |
| **Identity Entity**  | TASK-107           | User entity + Address entity (N per User + `isDefault`)                    |
| **Authentication**   | TASK-114, 115, 116 | JWT strategy (15m access + 30d refresh rolling), Auth DTOs, Register/Login |
| **Account Mgmt**     | TASK-118, 119, 120 | Users CRUD, Profile, Change Password (revoke all token families on change) |
| **Session**          | TASK-123           | Refresh Token family + rotation + 5s tolerance window                      |
| **Account Recovery** | TASK-124           | Email verification, Password reset                                         |

### ❌ NGOÀI SCOPE (đã chuyển đi)

| Nhóm cũ                                                                     | Đã chuyển đến        |
| :-------------------------------------------------------------------------- | :------------------- |
| Setup project, env, DB, validation, migrations, base classes, seeds, README | `planning/setup/`    |
| Entity Category, Product, Cart, Order                                       | `planning/business/` |

---

## 🎯 Success Criteria (Context Exit Gates)

Identity chỉ được xem là đạt baseline khi **TẤT CẢ** điều kiện sau được đáp ứng:

1. ✅ User có thể đăng ký, đăng nhập, đổi mật khẩu, khôi phục mật khẩu, xác thực email.
2. ✅ Mọi API non-public đều bị chặn nếu không có JWT hợp lệ.
3. ✅ Token TTL: access **15 phút**, refresh **30 ngày rolling** (mỗi `/refresh` extend). Transport header `Authorization: Bearer`.
4. ✅ Refresh token family rotation hoạt động. Triggers revoke: T1 reuse revoked (sau 5s tolerance), T2 change password (revoke all), T3 logout-all-devices, T6 logout đơn.
5. ✅ Password rule (NIST 2024): ≥8 ký tự + không trong top 100 common + check HaveIBeenPwned breach (k-anonymity). KHÔNG bắt complexity (hoa/số/đặc biệt).
6. ✅ Role enum (`USER`/`STAFF`/`ADMIN`) đã đóng băng và có decorator phân quyền dùng được.
7. ✅ Address: User có N Address với `isDefault` (max 1). User soft-delete → Address CASCADE soft-delete.
8. ✅ Soft-delete cascade theo Hybrid policy (xem [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md) — Cross-context).
9. ✅ Migration của các entity Identity đã chạy thành công trên staging.
10. ✅ Audit: không có endpoint nào trả về `password` hash trong response. `class-transformer @Exclude()` enforce.

---

## 🔗 Phụ thuộc Outbound

Identity cần các engineering foundation sau **trước khi** đi sâu vào feature (tham chiếu `planning/setup/`):

- TASK-101 → 105: project setup, env, DB connect, global validation.
- TASK-112, 113: migration tooling & strategy.
- TASK-117: guards & decorators mechanism.
- TASK-122: shared utilities/base patterns ở mức vừa đủ, không bắt buộc generic `BaseRepository`.

---

## 🗣️ Ngôn ngữ thống nhất

Glossary domain xem [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md). Khi viết task mới, **bắt buộc** dùng đúng thuật ngữ đã định nghĩa ở đó.
