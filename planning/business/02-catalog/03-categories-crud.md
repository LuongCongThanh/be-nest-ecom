# TASK-201: Categories CRUD (Admin Governance)

## 📋 Metadata

- **Task ID**: TASK-201
- **Độ ưu tiên**: 🔵 TRUNG BÌNH (Catalog Management)
- **Phụ thuộc**: TASK-108 (Category Entity)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md)

---

## 🎯 Business Intent

CRUD nội bộ cho `ADMIN`/`STAFF` để vận hành catalog. Public API list/discovery thuộc TASK-202.

- **Write quyền chỉ Admin** — tránh nội dung sai lệch ảnh hưởng SEO + UX.
- **Slug auto-regenerate khi đổi name**: nhưng phải cảnh báo Admin (slug đổi → URL cũ mất). UI hiển thị "slug sẽ đổi từ X sang Y".
- **Re-parenting validation**: không cho phép cycle (xem TASK-108 AC-3, AC-4).

---

## 📄 Endpoints

| Endpoint | Method | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `/admin/categories` | POST | ADMIN | Tạo category |
| `/admin/categories/:id` | GET | ADMIN, STAFF | Detail |
| `/admin/categories/:id` | PATCH | ADMIN | Update (name, slug, parent, active) |
| `/admin/categories/:id` | DELETE | ADMIN | Soft retire (`isActive=false`), Product được SET NULL `categoryId` |
| `/admin/categories/:id/reorder` | POST | ADMIN | Đổi `sortOrder` |

---

## ✅ Acceptance Criteria

**AC-1: Non-admin không tạo/update được**
- **Given** User role `USER`
- **When** POST `/admin/categories`
- **Then** response `403 FORBIDDEN`

**AC-2: Slug regenerate khi name đổi**
- **Given** Category `{ name: "Điện thoại", slug: "dien-thoai" }`
- **When** PATCH với `{ name: "Điện thoại di động" }`, KHÔNG gửi slug
- **Then** slug được auto-update thành `"dien-thoai-di-dong"`; response trả cờ `slugChanged: true` để FE cảnh báo

**AC-3: Slug manual override hợp lệ**
- **Given** Admin gửi `{ slug: "smartphone" }` (override thủ công)
- **When** PATCH category
- **Then** slug lưu `"smartphone"` (đã validate kebab-case)

**AC-4: Re-parent ngăn cycle**
- **Given** Cây A → B → C
- **When** Admin update `A.parentId = C.id`
- **Then** response `422 CIRCULAR_PARENT_REFERENCE`

**AC-5: Soft retire không xóa Product**
- **Given** Category có 5 Product
- **When** DELETE category
- **Then** Category có `isActive=false`; 5 Product có `categoryId = NULL`; vẫn search được trong "Uncategorized" filter

---

## 🚫 Out of Scope

- Public catalog list / tree → TASK-202.
- Bulk import categories (CSV) → backlog.
- Audit log admin actions → Phase 3 TASK-312.
