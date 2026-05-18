# TASK-108: Đặc tả Category Entity

## 📋 Metadata

- **Task ID**: TASK-108
- **Độ ưu tiên**: 🟡 TRUNG BÌNH (Catalog Foundation)
- **Phụ thuộc**: TASK-106 (Schema Strategy)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md) — section *Catalog Context*

---

## 🎯 Business Intent

Category là **xương sống điều hướng** của Catalog. Quyết định cách khách hàng tìm thấy Product.

- **Hierarchy không giới hạn**: cây tự tham chiếu (parent/child) — không cap số tầng.
- **Slug là URL public**: phải SEO-friendly, unique, có thể đổi nhưng phải redirect cũ (backlog).
- **Soft retire**: không hard-delete; xóa = `isActive=false` HOẶC re-parent children trước.

---

## 📄 Domain Specification

| Trường | Vai trò nghiệp vụ | Ràng buộc |
| :--- | :--- | :--- |
| `id` | Internal ID | UUID v4 |
| `name` | Hiển thị | Required, unique trong cùng `parentId`, ≤ 100 chars |
| `slug` | URL identity | Unique toàn hệ thống, lowercase + kebab-case, sinh tự động từ `name` (Vietnamese → ASCII) |
| `description` | SEO description | Optional, ≤ 500 chars |
| `image` | Banner | Optional URL |
| `parentId` | Self-FK | Nullable (root level) |
| `isActive` | Visibility | Default `true`; ẩn ở public catalog nếu `false` |
| `sortOrder` | Display order | Integer, default `0` |

### Quan hệ
- **N-1 self**: Category → parent Category.
- **1-N**: Category → many Products.
- **Soft link với Product**: xóa Category → `Product.categoryId = NULL` (SET NULL — TASK-106).

---

## ✅ Acceptance Criteria

**AC-1: Slug sinh tự động từ tên tiếng Việt**
- **Given** `name = "Đồ Gia Dụng"`
- **When** tạo Category
- **Then** `slug = "do-gia-dung"`, không có ký tự dấu

**AC-2: Slug unique toàn hệ thống**
- **Given** đã tồn tại Category với slug `"ao-thun"`
- **When** tạo Category mới cùng tên ở parent khác
- **Then** slug mới phải được suffix (e.g., `"ao-thun-2"`), không conflict

**AC-3: Không tự làm parent của chính mình**
- **Given** Category A đã tồn tại
- **When** update `A.parentId = A.id`
- **Then** response `422 CIRCULAR_PARENT_REFERENCE`

**AC-4: Không tạo cycle nhiều cấp**
- **Given** A → B → C (C là con của B, B là con của A)
- **When** update `A.parentId = C.id`
- **Then** response `422 CIRCULAR_PARENT_REFERENCE`

**AC-5: Xóa Category không "mồ côi" Product**
- **Given** Category có 10 Product gán vào
- **When** Admin xóa Category
- **Then** 10 Product có `categoryId = NULL`, vẫn list được ở "Uncategorized"

---

## 🚫 Out of Scope

- Slug redirect history (đổi slug cũ → mới) → backlog.
- Multi-language category name → Phase 3 TASK-325.
- Auto-suggest category cho Product → Phase 3 (ML).
