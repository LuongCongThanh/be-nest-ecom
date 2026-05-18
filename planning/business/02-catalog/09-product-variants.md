# TASK-218: Product Variants & Attributes

## 📋 Metadata

- **Task ID**: TASK-218
- **Độ ưu tiên**: 🔴 CAO (Business Core)
- **Phụ thuộc**: TASK-109 (Product Entity), TASK-203 (Products CRUD)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md)

---

## 🎯 Business Intent

Product master có nhiều **Variant** (kết hợp các attribute như size, color). Mỗi variant là **đơn vị bán** riêng — có SKU, price, stock độc lập.

- **Variant là đơn vị bán thực sự**: từ TASK-218 trở đi, Cart/Order **tham chiếu `variantId`** không phải `productId` (xem TASK-110 AC).
- **Product master = product card hiển thị**; Variant = "hộp lựa chọn" trong card.
- **Attribute là metadata reuse-được**: `Color`, `Size`, `Material`... dùng chung cho nhiều Product cùng category.

---

## 📄 Domain Model

### Attribute (global definitions)

| Trường | Ràng buộc |
| :--- | :--- |
| `id` | UUID |
| `name` | Unique (e.g. `"Color"`, `"Size"`) |
| `displayName` | Hiển thị (e.g. `"Màu sắc"`) |
| `type` | Enum: `STRING`, `COLOR_HEX`, `NUMERIC` |
| `scope` | Enum: `GLOBAL`, `CATEGORY` (gán theo Category) |

### AttributeValue

| Trường | Ràng buộc |
| :--- | :--- |
| `attributeId` | FK |
| `value` | e.g. `"Red"`, `"M"`, `"#FF0000"` |
| Unique | `(attributeId, value)` |

### Variant

| Trường | Ràng buộc |
| :--- | :--- |
| `id` | UUID |
| `productId` | FK Product (master) |
| `sku` | Unique toàn hệ thống |
| `price` | Override Product.price |
| `comparePrice` | Optional |
| `stockQuantity` | Độc lập với master |
| `attributes` | JSONB: `{ "Color": "Red", "Size": "M" }` — mapping `attribute.name → value` |
| `image` | Optional, override Product images cho variant card |
| `isActive` | Default `true` |

### Quan hệ ràng buộc
- **Variant combo unique**: với cùng `productId`, không được có 2 Variant cùng tập `attributes`.
- **All-or-none variants**: Product hoặc không có Variant nào (bán "as-is"), hoặc có ≥ 1 Variant (lúc đó Cart phải chọn variant).

---

## ✅ Acceptance Criteria

**AC-1: SKU unique toàn hệ thống**
- **Given** đã có Variant SKU `IPHONE-15-RED-128`
- **When** tạo Variant khác cùng SKU
- **Then** `409 SKU_ALREADY_EXISTS`

**AC-2: Variant combo unique trong cùng Product**
- **Given** Product P có Variant `{Color: Red, Size: M}`
- **When** tạo Variant khác trong P cũng có `{Color: Red, Size: M}`
- **Then** `409 DUPLICATE_VARIANT_COMBINATION`

**AC-3: Product có Variant → buộc chọn khi add to Cart**
- **Given** Product P có 3 Variant, User gọi `POST /cart` với `{ productId: P.id }` mà không có `variantId`
- **When** xử lý
- **Then** `422 VARIANT_REQUIRED`

**AC-4: Master Inactive → Variant tự ẩn ở public**
- **Given** Product master `isActive=false`, có 5 Variant `isActive=true`
- **When** GET `/products?...` (public)
- **Then** không thấy Product. 5 Variant cũng không add-to-cart được (force-check master state)

**AC-5: Variant price tách biệt với master**
- **Given** Product master `price=100`, Variant XL `price=120`
- **When** thêm Variant XL vào Cart
- **Then** `CartItem.priceAtAdded = 120` (lấy từ Variant, không phải master)

**AC-6: Out-of-stock per variant**
- **Given** Variant Red `stock=0`, Variant Blue `stock=10`
- **When** GET Product detail
- **Then** response chứa array variants với flag `isOutOfStock` từng cái; FE disable button Red

---

## 🚫 Out of Scope

- Bulk variant generation (Color × Size matrix) UI helper → backlog.
- Per-variant images gallery → simple `image` field đủ Phase 2.
- Variant search facets → một phần của TASK-204.
