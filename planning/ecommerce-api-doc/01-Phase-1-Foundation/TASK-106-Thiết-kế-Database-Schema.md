# TASK-106: Chiến lược Database Schema (Business-level)

## 📋 Metadata

- **Task ID**: TASK-106
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Foundational Architecture)
- **Phụ thuộc**: Engineering setup hoàn tất ([TASK-101..105](../../engineering/phase-1-foundation/README.md))
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../CONTEXT.md`](../CONTEXT.md)
> 🗂️ Chi tiết ERD canonical: [`../../engineering/DATABASE_SCHEMA.md`](../../engineering/DATABASE_SCHEMA.md)
> 🛠️ Migration tooling: [`../../engineering/COMMANDS.md`](../../engineering/COMMANDS.md) · Strategy: [`project-conventions.vi.md §13`](../../engineering/project-conventions.vi.md)

---

## 🎯 Business Intent

Tài liệu này quyết định **các nguyên tắc dữ liệu ở mức nghiệp vụ** — KHÔNG phải định nghĩa từng cột. ERD chi tiết sống ở `DATABASE_SCHEMA.md` (engineering). Phase 1 chỉ chốt các nguyên tắc bất biến mà mọi entity về sau phải tuân theo.

- **Snapshot là bất di bất dịch**: Đơn hàng KHÔNG được phụ thuộc dữ liệu nguồn động (giá Product, địa chỉ User). Mọi đơn hàng phải "đông cứng" bản ghi nghiệp vụ tại thời điểm tạo.
- **Soft retire mọi danh tính / sản phẩm có lịch sử giao dịch**: hard-delete cấm.
- **Identity bí mật**: PK của User dùng UUID v4. Không lộ tổng số người dùng / sản phẩm qua sequence.

---

## 📄 Nguyên tắc Dữ liệu (Business Rules)

### 1. Delete Strategy theo loại quan hệ

| Trường hợp | Quy tắc | Lý do nghiệp vụ |
| :--- | :--- | :--- |
| Product có OrderItem | **RESTRICT** | Bảo toàn lịch sử đơn hàng |
| User có Order | **SOFT DELETE** (`isActive=false`, `deletedAt`) | Tuân thủ GDPR + bảo toàn báo cáo |
| User → RefreshToken / Cart | **CASCADE** | Dữ liệu phái sinh, không có giá trị độc lập |
| Category bị xóa → Product | **SET NULL** (`categoryId=null`) | Product vẫn bán được trong khi catalog tái cấu trúc |

### 2. Snapshot Pattern (BẮT BUỘC)

- `OrderItem` **PHẢI** lưu: `priceSnapshot`, `productNameSnapshot`, `productSkuSnapshot`.
- `Order` **PHẢI** lưu: `shippingAddressSnapshot` (JSON), `customerEmailSnapshot`.
- Sau khi tạo Order, các snapshot field bất biến — kể cả khi nguồn gốc thay đổi.

### 3. Uniqueness & Index (mức nghiệp vụ)

- **Unique business identity**: `User.email`, `Product.slug`, `Order.orderNumber`.
- Mọi FK phải có index — nguyên tắc đã ghi tại [`project-conventions.vi.md §8`](../../engineering/project-conventions.vi.md).

---

## ✅ Acceptance Criteria

**AC-1: Snapshot bảo toàn lịch sử đơn hàng**
- **Given** một Order đã được tạo với `priceSnapshot = 100,000 VND` và `shippingAddressSnapshot = "123 Phố A"`
- **When** Admin cập nhật giá Product gốc thành `120,000` và User đổi địa chỉ
- **Then** truy vấn lại Order phải vẫn trả về `priceSnapshot = 100,000` và địa chỉ giao hàng `"123 Phố A"`

**AC-2: RESTRICT xóa Product có giao dịch**
- **Given** một Product đã xuất hiện trong ít nhất 1 OrderItem
- **When** Admin gọi API xóa Product
- **Then** hệ thống trả về lỗi `409 PRODUCT_HAS_ORDER_HISTORY`, Product vẫn tồn tại

**AC-3: CASCADE token khi User soft-deleted**
- **Given** User có 3 RefreshToken active
- **When** User bị soft-delete (`deletedAt = now`)
- **Then** tất cả RefreshToken của User đó phải bị xóa hoặc vô hiệu hóa trong cùng transaction

**AC-4: Identity confidentiality**
- **Given** một endpoint công khai trả về Product list
- **When** kiểm tra response
- **Then** không có ID dạng số tăng dần, mọi ID đều ở định dạng UUID v4

---

## 🚫 Out of Scope

- Định nghĩa cột chi tiết từng entity → ERD ở `DATABASE_SCHEMA.md`.
- Cấu hình PostgreSQL/Prisma → [`TASK-103/104`](../../engineering/phase-1-foundation/README.md).
- Câu lệnh migration cụ thể → [`COMMANDS.md`](../../engineering/COMMANDS.md).
