# TASK-108: Đặc tả Category Entity

## 📋 Metadata

- **Task ID**: TASK-108
- **Độ ưu tiên**: 🟡 TRUNG BÌNH (Catalog Foundation)
- **Phụ thuộc**: TASK-106 (Schema Strategy)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md) — section _Catalog Context_

---

## 🎯 Business Intent

Category là **xương sống điều hướng** của Catalog. Quyết định cách khách hàng tìm thấy Product.

- **Hierarchy tối đa 5 tầng**: cây tự tham chiếu (parent/child), root = tầng 1, max leaf = tầng 5.
- **Slug là URL public**: SEO-friendly, unique toàn hệ thống. Sinh tự động từ `name` lúc tạo, sau đó độc lập — đổi `name` không tự đổi `slug`.
- **Hai trạng thái riêng biệt**: `isActive` (visibility — có thể bật/tắt) và `deletedAt` (soft-delete — xoá mềm có thể restore). Không nhầm lẫn hai trạng thái này.

---

## 📄 Domain Specification

| Trường        | Vai trò nghiệp vụ | Ràng buộc |
|:--------------|:------------------|:----------|
| `id`          | Internal ID       | UUID v4 |
| `name`        | Hiển thị          | Required, ≤ 100 chars, unique trong cùng `parentId`. Enforce DB-level: `@@unique([parentId, name])` cho non-root; partial unique index `WHERE parentId IS NULL AND deletedAt IS NULL` cho root |
| `slug`        | URL identity      | Unique toàn hệ thống, lowercase kebab-case, sinh tự động từ `name` (Vietnamese → ASCII) **chỉ lúc tạo mới**. Sau đó độc lập với `name` — phải set tường minh trong `PATCH` nếu muốn đổi |
| `description` | SEO description   | Optional, plain text, ≤ 500 chars |
| `image`       | Banner            | Optional. Phải upload qua `IStorageAdapter` pipeline — resize 1 size `medium` 800px, output `.webp`. KHÔNG nhận external URL |
| `parentId`    | Self-FK           | Nullable (root level). Max depth 5 tầng tính từ root |
| `isActive`    | Visibility toggle | Default `true`. `false` = ẩn khỏi public catalog (inherited: parent ẩn → cả cây ẩn). Admin vẫn thấy và có thể bật lại |
| `sortOrder`   | Display order     | Integer, default `0`. Quản lý qua bulk reorder endpoint. Tie-break: `sortOrder ASC, createdAt ASC` |
| `createdAt`   | Audit             | Auto, set by DB |
| `updatedAt`   | Audit             | Auto, set by DB |
| `deletedAt`   | Soft-delete       | Nullable. `NOT NULL` = bị xoá mềm, ẩn khỏi mọi list kể cả admin. Có thể restore (ADMIN only) |

### Quan hệ

- **N-1 self**: Category → parent Category.
- **1-N**: Category → many Products. Xoá Category → `Product.categoryId = NULL` (SET NULL).
- **Delete constraint**: RESTRICT — từ chối xoá nếu còn children active (`deletedAt IS NULL`). Admin phải re-parent hoặc xoá children trước.

---

## ✅ Acceptance Criteria

**AC-1: Slug sinh tự động từ tên tiếng Việt khi tạo mới**

- **Given** `name = "Đồ Gia Dụng"`
- **When** tạo Category
- **Then** `slug = "do-gia-dung"`, không có ký tự dấu

**AC-2: Slug conflict trả lỗi + suggest**

- **Given** đã tồn tại Category với slug `"ao-thun"`
- **When** tạo Category mới sinh ra slug trùng (dù ở parent khác)
- **Then** response `422 SLUG_CONFLICT` body `{ suggestedSlug: "ao-thun-2" }` — admin tự quyết dùng suggested hay đổi tên

**AC-3: Đổi name không tự đổi slug**

- **Given** Category với `name = "Áo Thun"`, `slug = "ao-thun"`
- **When** Admin `PATCH` với `{ name: "Áo Thun Nam" }` (không kèm `slug`)
- **Then** `slug` vẫn là `"ao-thun"`, không thay đổi

**AC-4: Không tự làm parent của chính mình**

- **Given** Category A đã tồn tại
- **When** update `A.parentId = A.id`
- **Then** response `422 CIRCULAR_PARENT_REFERENCE`

**AC-5: Không tạo cycle nhiều cấp**

- **Given** A → B → C (C là con của B, B là con của A)
- **When** update `A.parentId = C.id`
- **Then** response `422 CIRCULAR_PARENT_REFERENCE`

**AC-6: Tạo/update Category không vượt max depth**

- **Given** Parent Category đang ở depth 5
- **When** Admin tạo child Category bên dưới
- **Then** response `422 CATEGORY_MAX_DEPTH_EXCEEDED`

**AC-7: Move Category kiểm tra depth của toàn subtree**

- **Given** Category B có subtree 3 tầng bên dưới, đang ở depth 2
- **When** Admin move B vào parent ở depth 3 (khiến leaf của B vượt depth 5)
- **Then** response `422 CATEGORY_MAX_DEPTH_EXCEEDED`, toàn bộ move bị reject

**AC-8: isActive kế thừa từ parent**

- **Given** Parent "Điện Tử" có `isActive = false`, con "Điện Thoại" có `isActive = true`
- **When** public client gọi `GET /categories/tree`
- **Then** "Điện Thoại" không xuất hiện trong response (parent ẩn → cả cây ẩn)

**AC-9: Xoá Category bị chặn nếu còn children**

- **Given** Category có ít nhất 1 children chưa bị xoá (`deletedAt IS NULL`)
- **When** Admin gọi `DELETE /categories/:id`
- **Then** response `400 CATEGORY_HAS_CHILDREN` — admin phải re-parent hoặc xoá children trước

**AC-10: Xoá Category không "mồ côi" Product**

- **Given** Category có 10 Product gán vào
- **When** Admin xoá Category
- **Then** 10 Product có `categoryId = NULL`, vẫn list được ở "Uncategorized"

**AC-11: Restore Category bị chặn nếu parent đang deleted**

- **Given** Category B đã bị soft-delete, parent A của B cũng đang soft-delete
- **When** Admin restore B
- **Then** response `400 CATEGORY_PARENT_DELETED` — admin phải restore A trước

**AC-12: Restore Category validate slug conflict**

- **Given** Category B (`slug = "ao-thun"`) đã bị soft-delete; trong thời gian đó Category C được tạo với `slug = "ao-thun"`
- **When** Admin restore B
- **Then** response `422 SLUG_CONFLICT` body `{ suggestedSlug: "ao-thun-2" }`

**AC-13: Bulk reorder validate cùng parent**

- **Given** Admin gửi `PATCH /categories/reorder` với array chứa IDs từ các parent khác nhau
- **Then** response `422 REORDER_MIXED_PARENTS`

**AC-14: Phân quyền CRUD Category**

- **Given** User có role `USER` gọi bất kỳ write endpoint nào
- **Then** response `403 FORBIDDEN`
- **Given** User có role `STAFF` gọi `DELETE /categories/:id` hoặc `PATCH /categories/:id/restore`
- **Then** response `403 FORBIDDEN`
- **Given** User có role `STAFF` gọi `POST /categories`, `PATCH /categories/:id`, hoặc `PATCH /categories/reorder`
- **Then** được phép thực hiện

---

## 🔌 API Endpoints

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `GET` | `/categories` | Public | Flat list. Filter: `?parentId`, `?search` (tìm theo name), `?isActive` (STAFF/ADMIN only), `?includeInactive=true` (STAFF/ADMIN only). Paginate: `?page` + `?limit` (max 100). Anonymous luôn nhận active-only |
| `GET` | `/categories/tree` | Public | Nested tree. Active-only mặc định. STAFF/ADMIN thêm `?includeInactive=true` để xem full tree. Anonymous gửi param này → ignore |
| `POST` | `/categories` | STAFF / ADMIN | Tạo Category. Slug tự sinh từ name, reject nếu conflict |
| `PATCH` | `/categories/:id` | STAFF / ADMIN | Cập nhật Category. `name` và `slug` là 2 field độc lập |
| `DELETE` | `/categories/:id` | ADMIN | Soft-delete. RESTRICT nếu còn children. SET NULL cho Products |
| `PATCH` | `/categories/:id/restore` | ADMIN | Restore soft-deleted. Validate slug conflict + parent not deleted |
| `PATCH` | `/categories/reorder` | STAFF / ADMIN | Bulk reorder. Tất cả IDs phải cùng `parentId`. Atomic |
| `POST` | `/categories/:id/image` | STAFF / ADMIN | Upload ảnh qua `IStorageAdapter` pipeline (medium 800px, webp) |
| `DELETE` | `/categories/:id/image` | STAFF / ADMIN | Xoá ảnh: set `image = NULL` trong DB. File trên storage cleanup bằng cron |

---

## 🚫 Out of Scope

- Slug redirect history (đổi slug cũ → mới) → backlog.
- Multi-language category name → giai đoạn scale sau, TASK-325.
- Auto-suggest category cho Product → giai đoạn scale sau (ML).
- Partial restore (restore chỉ một phần cây) → không cần, restore từng node tường minh.
