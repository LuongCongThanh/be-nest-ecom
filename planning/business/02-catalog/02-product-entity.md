# TASK-109: Đặc tả Product Entity

## 📋 Metadata

- **Task ID**: TASK-109
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Business Value)
- **Phụ thuộc**: TASK-108 (Category)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md) — section *Catalog Context*

---

## 🎯 Business Intent

Product là **đơn vị tạo doanh thu**. Mọi quyết định kiến trúc Product đều ảnh hưởng trực tiếp đến revenue.

- **SKU là identity thương mại** — duy nhất, format cố định, đồng bộ với WMS/kế toán.
- **Stock là số liệu kế toán** — mọi thay đổi phải có audit trail (TASK-205).
- **Pricing dual**: `price` (bán thực) + `comparePrice` (giá niêm yết để hiển thị giảm giá). `comparePrice ≥ price` luôn đúng.
- **Variants tách ra TASK-218**: Product entity này là "master product"; biến thể (size/color) thuộc TASK-218.

---

## 📄 Domain Specification

| Trường | Vai trò | Ràng buộc |
| :--- | :--- | :--- |
| `id` | Internal | UUID v4 |
| `sku` | Commercial ID | Unique toàn hệ thống, uppercase, regex `^[A-Z0-9\-]{3,32}$` |
| `name` | Hiển thị | Required, ≤ 200 chars |
| `slug` | URL | Unique, sinh tự động |
| `description` | Long description | Optional, ≤ 5000 chars, Markdown |
| `price` | Bán thực | Decimal(12,2) VND, > 0 |
| `comparePrice` | Giá niêm yết | Decimal(12,2), optional, must `≥ price` |
| `stockQuantity` | Tồn kho | Integer, default `0`, ≥ 0 (TASK-205 quản lý) |
| `lowStockThreshold` | Cảnh báo | Integer, default `5`; trigger alert TASK-226 |
| `isActive` | Visibility | Default `true` |
| `isFeatured` | Boost ranking | Default `false`; dùng ở TASK-204 search ranking |
| `categoryId` | FK Category | Nullable (SET NULL khi Category xóa) |
| `metadata` | Specs JSON | Optional JSONB (weight, dimensions…) |

### Product State (computed, không lưu)

```
ACTIVE          : isActive=true AND stockQuantity > 0
OUT_OF_STOCK    : isActive=true AND stockQuantity = 0
DRAFT/INACTIVE  : isActive=false
DELETED         : deletedAt IS NOT NULL
```

---

## ✅ Acceptance Criteria

**AC-1: SKU unique toàn hệ thống**
- **Given** đã tồn tại Product `IPHONE-15-PRO-BLK`
- **When** tạo Product khác cùng SKU
- **Then** response `409 SKU_ALREADY_EXISTS`

**AC-2: comparePrice không nhỏ hơn price**
- **Given** payload `price=120, comparePrice=100`
- **When** tạo/update Product
- **Then** response `422 INVALID_COMPARE_PRICE`

**AC-3: Auto switch OUT_OF_STOCK**
- **Given** Product có `stockQuantity = 1`, `isActive=true`
- **When** một Order PAID trừ về `stockQuantity = 0`
- **Then** Product trả về ở public list nhưng có flag `isOutOfStock = true`; cấm thêm vào Cart (TASK-207 AC-3)

**AC-4: Không hard-delete Product có Order history**
- **Given** Product đã có ít nhất 1 OrderItem
- **When** Admin DELETE Product
- **Then** response `409 PRODUCT_HAS_ORDER_HISTORY`; phải dùng soft-delete (`isActive=false` hoặc `deletedAt`)

**AC-5: SKU + slug normalize**
- **Given** input `sku = "iphone-15-pro-blk"`, `name = "iPhone 15 Pro Black"`
- **When** tạo Product
- **Then** DB lưu `sku = "IPHONE-15-PRO-BLK"` (uppercase), `slug = "iphone-15-pro-black"`

---

## 🚫 Out of Scope

- Variants (size, color) → TASK-218.
- Image management → TASK-206.
- Search / filtering → TASK-204.
- Stock movements (in/out/reserve) → TASK-205.
- Price history tracking → backlog (BRD §14 open question).
