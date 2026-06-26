# 📦 Catalog — Sản phẩm & Danh mục

> Bounded context **Catalog**. Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md) — section _Catalog Context_.

---

## 🎯 Mục đích

Quản lý kho **thông tin sản phẩm**: danh mục cây, sản phẩm SKU-level, biến thể (variant), tồn kho, ảnh, search/filter.

Catalog là **read-heavy**: API list/search được gọi nhiều nhất hệ thống, write chỉ admin.

---

## 📦 Key Entities

| Entity   | Định nghĩa                                                                                                                                                                                                                       |
| :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Category | Nhóm phân loại sản phẩm, hỗ trợ tree self-reference (`parentId`).                                                                                                                                                                |
| Product  | Đơn vị bán được (SKU level). 1 Product = 1 SKU + 1 slug + `price` (`BigInt` đồng VND) + `comparePrice` (BigInt).                                                                                                                 |
| Variant  | Biến thể của Product (size, màu). Mỗi variant có SKU riêng. (TASK-218, post-MVP.)                                                                                                                                                |
| Stock    | Tồn kho thực. **Trừ EAGER tại `POST /orders` (PENDING)** trong cùng transaction — xem [`../04-order/`](../04-order/README.md). Order PENDING timeout 15 phút → hoàn stock.                                                       |
| Image    | Lưu qua `IStorageAdapter` (local disk dev, S3 prod). 3 size (`thumb 200px / medium 800px / original`), output `.webp`. Path `/products/{productId}/{uuid}_{size}.webp`. Xem [`CONTEXT.md`](../../docs/CONTEXT.md) — File Upload. |

---

## 🔌 Public API (high-level)

| Endpoint                       | Vai trò                           |
| :----------------------------- | :-------------------------------- |
| `GET    /categories`           | Tree danh mục (public)            |
| `GET    /products`             | List + filter + search (public)   |
| `GET    /products/:slug`       | Detail product theo slug (public) |
| `POST   /products` (admin)     | Tạo product                       |
| `PATCH  /products/:id` (admin) | Cập nhật                          |
| `DELETE /products/:id` (admin) | Soft-delete                       |
| `PATCH  /products/:id/stock`   | Điều chỉnh tồn kho (admin)        |
| `POST   /products/:id/images`  | Upload ảnh (admin, dùng TASK-223) |

---

## ⚖️ Key Invariants

1. `slug` của Product **duy nhất toàn hệ thống**, sinh từ `name` qua `slugify()`.
2. `SKU` duy nhất toàn hệ thống. Đổi SKU → tạo Product mới, không sửa.
3. `price > 0` luôn luôn. `comparePrice` (nếu có) phải `≥ price`. **Cả 2 là `BigInt` đơn vị đồng VND**, không float, không Decimal.
4. `stockQuantity ≥ 0`. Trừ kho qua `prisma.$transaction` + **row-level lock** (`update where stockQty >= qty` hoặc `SELECT FOR UPDATE`). Chống oversell ở checkout song song.
5. Xóa Category đang chứa Product → set `categoryId = NULL` (SET NULL theo TASK-106).
6. Xóa Product có OrderItem → **RESTRICT** (không cho phép xóa).
7. Search ở **MVP** có thể bắt đầu bằng filter + text search đơn giản miễn hành vi đúng và dễ bảo trì. **Postgres FTS** (`tsvector` + GIN + `unaccent`) là hướng nâng cấp tốt khi cần relevance/không dấu/performance rõ ràng. Không nhảy lên Elasticsearch ở giai đoạn đầu.
8. **Pagination**: `GET /products` dùng `PaginationDto { page, limit }` (offset) — xem `CONVENTIONS.md §8.6`. Default `limit=20`, max `100`.
9. **Image upload**: 5MB max, MIME whitelist `jpeg/png/webp`, magic byte verify. Resize qua `sharp` sync, output 3 size webp. CẤM nhận filename gốc từ client.

---

## 📋 Tasks

| ID       | Topic                     | File                             |
| :------- | :------------------------ | :------------------------------- |
| TASK-108 | Category entity           | [link](./01-category-entity.md)  |
| TASK-109 | Product entity            | [link](./02-product-entity.md)   |
| TASK-201 | Categories CRUD           | [link](./03-categories-crud.md)  |
| TASK-202 | Category tree & filtering | [link](./05-category-tree.md)    |
| TASK-203 | Products CRUD             | [link](./04-products-crud.md)    |
| TASK-204 | Product filter & search   | [link](./06-products-search.md)  |
| TASK-205 | Stock management          | [link](./07-stock-management.md) |
| TASK-206 | Product images            | [link](./08-product-images.md)   |
| TASK-218 | Product variants          | [link](./09-product-variants.md) |
