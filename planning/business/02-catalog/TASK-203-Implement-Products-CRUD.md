# TASK-203: Products CRUD (Admin Governance)

## 📋 Metadata

- **Task ID**: TASK-203
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Inventory Foundation)
- **Phụ thuộc**: TASK-109 (Product Entity), TASK-201 (Categories CRUD)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../CONTEXT.md`](../../CONTEXT.md)

---

## 🎯 Business Intent

Admin CRUD cho Product. Search/list public ở TASK-204; images ở TASK-206; stock movement ở TASK-205.

- **Activate guardrail**: Product chỉ chuyển sang `isActive=true` khi có ít nhất 1 image, có `price > 0`, và đã gán category — tránh listing dở dang trên storefront.
- **Slug bất biến sau publish**: một khi `isActive=true`, slug không tự đổi khi name đổi (tránh broken SEO links). Admin có thể force-change nhưng phải confirm.
- **Soft delete khi có Order**: TASK-109 AC-4.

---

## 📄 Endpoints

| Endpoint | Method | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `/admin/products` | POST | ADMIN, STAFF | Tạo Product (draft mặc định `isActive=false`) |
| `/admin/products/:id` | GET | ADMIN, STAFF | Detail (include inactive + soft-deleted) |
| `/admin/products/:id` | PATCH | ADMIN, STAFF | Update |
| `/admin/products/:id/publish` | POST | ADMIN, STAFF | Set `isActive=true` (sau khi pass guardrail) |
| `/admin/products/:id/unpublish` | POST | ADMIN, STAFF | Set `isActive=false` |
| `/admin/products/:id` | DELETE | ADMIN | Soft delete; reject nếu có Order |

---

## ✅ Acceptance Criteria

**AC-1: Cannot publish without image**
- **Given** Product `isActive=false`, không có image
- **When** POST `/admin/products/:id/publish`
- **Then** response `409 CANNOT_PUBLISH: missing image` (kèm checklist các điều kiện chưa pass)

**AC-2: Slug giữ nguyên sau publish dù name đổi**
- **Given** Product đã publish, `slug = "iphone-15"`, `name = "iPhone 15"`
- **When** Admin PATCH `{ name: "iPhone 15 Pro Max" }` mà KHÔNG gửi slug
- **Then** slug VẪN là `"iphone-15"`; response trả `slugLocked: true`, kèm gợi ý slug mới `"iphone-15-pro-max"` cho Admin override thủ công

**AC-3: Price âm bị reject**
- **Given** payload có `price = -10`
- **When** POST/PATCH
- **Then** `422 INVALID_PRICE`

**AC-4: Delete reject khi có Order**
- **Given** Product có 2 OrderItem
- **When** DELETE
- **Then** `409 PRODUCT_HAS_ORDER_HISTORY`; gợi ý dùng "Unpublish" thay vì delete

**AC-5: Category orphan handling**
- **Given** Product gán Category A; Admin xóa Category A (TASK-201 AC-5)
- **When** GET Product detail
- **Then** `categoryId = null`; response Admin UI có flag `isOrphaned: true`

---

## 🚫 Out of Scope

- Variants management → TASK-218.
- Stock adjustment → TASK-205.
- Images upload → TASK-206.
- Bulk import → backlog (CSV/Excel).
- Public Product detail page → một phần của TASK-204.
