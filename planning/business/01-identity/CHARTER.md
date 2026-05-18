# 📜 Phase 1 Charter — Foundation & Identity

> **Đây là tài liệu khung của Phase 1.** Mọi task trong phase đều phải gắn với mục tiêu, scope, và success criteria trong file này.

---

## 🎯 Mục tiêu Phase

Xây dựng **bounded context Identity** hoàn chỉnh: User → Authentication → Authorization → Account lifecycle.
Phase 1 KHÔNG bao gồm Catalog/Cart/Order — các entity đó được đặc tả tại Phase 2 (Revenue) ngay trước khi triển khai feature tương ứng.

### Lý do tồn tại của Phase

1. **Identity là gốc của mọi quyền truy cập** — không thể triển khai Catalog/Order trước khi xác định ai là người dùng.
2. **Schema-level decision lock-in** — các quyết định về User entity (UUID, role enum, soft-delete) ảnh hưởng đến mọi bảng FK sau này.
3. **Auth contract đóng băng sớm** — frontend & mobile phụ thuộc vào shape của login response để bắt đầu phát triển song song.

---

## 📦 Scope của Phase 1

### ✅ TRONG SCOPE

| Nhóm                 | Task               | Mô tả ngắn                                                    |
| :------------------- | :----------------- | :------------------------------------------------------------ |
| **Data Foundation**  | TASK-106           | Chiến lược schema chung (snapshot, FK rules, delete strategy) |
| **Identity Entity**  | TASK-107           | Đặc tả User entity                                            |
| **Authentication**   | TASK-114, 115, 116 | JWT strategy, Auth DTOs, Register/Login                       |
| **Account Mgmt**     | TASK-118, 119, 120 | Users CRUD, Profile, Change Password                          |
| **Session**          | TASK-123           | Refresh Token & Session lifecycle                             |
| **Account Recovery** | TASK-124           | Email verification, Password reset                            |

### ❌ NGOÀI SCOPE (đã chuyển đi)

| Nhóm cũ                                                                     | Đã chuyển đến                                    |
| :-------------------------------------------------------------------------- | :----------------------------------------------- |
| Setup project, env, DB, validation, migrations, base classes, seeds, README | `planning/setup/`       |
| Entity Category, Product, Cart, Order                                       | `planning/business/` |

---

## 🎯 Success Criteria (Phase Exit Gates)

Phase 1 chỉ được đóng khi **TẤT CẢ** điều kiện sau được đáp ứng:

1. ✅ User có thể đăng ký, đăng nhập, đổi mật khẩu, khôi phục mật khẩu, xác thực email.
2. ✅ Mọi API non-public đều bị chặn nếu không có JWT hợp lệ.
3. ✅ Refresh token rotation hoạt động; revoke session khi đổi mật khẩu.
4. ✅ Role enum (`USER`/`STAFF`/`ADMIN`) đã đóng băng và có decorator phân quyền dùng được.
5. ✅ Migration của các entity Identity đã chạy thành công trên staging.
6. ✅ Audit: không có endpoint nào trả về `password` hash trong response.

---

## 🔗 Phụ thuộc Outbound

Phase 1 phải hoàn tất các engineering foundation sau **trước khi** start (tham chiếu `planning/setup/`):

- TASK-101 → 105: project setup, env, DB connect, global validation.
- TASK-112, 113: migration tooling & strategy.
- TASK-117: guards & decorators mechanism.
- TASK-122: shared base classes (BaseEntity, BaseRepository).

---

## 🗣️ Ngôn ngữ thống nhất

Glossary domain xem [`../../CONTEXT.md`](../../CONTEXT.md). Khi viết task mới, **bắt buộc** dùng đúng thuật ngữ đã định nghĩa ở đó.
