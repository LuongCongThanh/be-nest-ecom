# TASK-202: Category Tree (Public Discovery)

## 📋 Metadata

- **Task ID**: TASK-202
- **Độ ưu tiên**: 🔵 TRUNG BÌNH (Discovery)
- **Phụ thuộc**: TASK-201 (Categories CRUD)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md)

---

## 🎯 Business Intent

Public API cho mega-menu / sidebar / breadcrumb của storefront. **Read-heavy**, tần suất thay đổi thấp → ứng viên cache hàng đầu (Phase 3).

- **One-call tree**: 1 request lấy được toàn bộ cây — tránh waterfall N+1 ở FE.
- **Active-only mặc định**: public chỉ thấy `isActive=true`; admin có thể opt-in xem hết qua `?includeInactive=true`.
- **Stable shape**: response shape không đổi giữa các phiên bản tree (rỗng = `children: []`, không `null`).

---

## 📄 Endpoints

| Endpoint | Method | Public? | Mô tả |
| :--- | :--- | :--- | :--- |
| `/categories/tree` | GET | ✅ | Toàn bộ cây active, depth không giới hạn |
| `/categories/:slug` | GET | ✅ | Detail + direct children (depth 1) |
| `/categories/:slug/breadcrumb` | GET | ✅ | Path từ root đến node |

### Query params (`/categories/tree`)
- `depth` (optional, int 1-10): giới hạn độ sâu để giảm payload.
- `rootId` (optional UUID): trả về sub-tree từ node này.
- `includeInactive` (admin only).

---

## ✅ Acceptance Criteria

**AC-1: Empty branch không gây null**
- **Given** Category leaf không có con
- **When** GET `/categories/tree`
- **Then** node đó có `children: []` (mảng rỗng), không phải `null`

**AC-2: Active filter loại cả subtree**
- **Given** Category B có `isActive=false`, dưới B có 3 categories active
- **When** GET `/categories/tree` (không có `includeInactive`)
- **Then** cả B và 3 con bị loại hoàn toàn

**AC-3: Breadcrumb chính xác**
- **Given** Cây `Electronics > Phones > Smartphones`
- **When** GET `/categories/smartphones/breadcrumb`
- **Then** trả về array `[{slug:"electronics"}, {slug:"phones"}, {slug:"smartphones"}]` theo thứ tự

**AC-4: Slug lookup deep-link chính xác**
- **Given** Cây có 50 categories đa cấp
- **When** GET `/categories/<slug-bất-kỳ>`
- **Then** response gồm category info + danh sách children trực tiếp (không phải toàn bộ subtree)

**AC-5: Response lightweight**
- **Given** Category có `description` 500 ký tự và 5 metadata fields
- **When** GET `/categories/tree`
- **Then** mỗi node chỉ chứa `{ id, name, slug, image, sortOrder, children }` — KHÔNG có `description`, `metadata`, audit fields

---

## 🚫 Out of Scope

- Caching strategy → Phase 3 TASK-306.
- Per-category SEO metadata API → backlog.
- Search inside category → TASK-204.
