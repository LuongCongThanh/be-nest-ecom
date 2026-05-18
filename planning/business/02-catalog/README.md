# 📦 Catalog — Sản phẩm & Danh mục

> Bounded context **Catalog**. Glossary: [`../../CONTEXT.md`](../../CONTEXT.md) — section *Catalog Context*.

---

## 🎯 Mục đích

Quản lý kho **thông tin sản phẩm**: danh mục cây, sản phẩm SKU-level, biến thể (variant), tồn kho, ảnh, search/filter.

Catalog là **read-heavy**: API list/search được gọi nhiều nhất hệ thống, write chỉ admin.

---

## 📦 Key Entities

| Entity   | Định nghĩa                                                                                  |
| :------- | :------------------------------------------------------------------------------------------ |
| Category | Nhóm phân loại sản phẩm, hỗ trợ tree self-reference (`parentId`).                           |
| Product  | Đơn vị bán được (SKU level). 1 Product = 1 SKU + 1 slug + giá hiện hành.                    |
| Variant  | Biến thể của Product (size, màu). Mỗi variant có SKU riêng. (Phase nâng cao — TASK-218.)    |
| Stock    | Tồn kho thực, trừ khi Order chuyển `PAID`. Không phản ánh số đang reserve trong Cart.       |

---

## 🔌 Public API (high-level)

| Endpoint                          | Vai trò                              |
| :-------------------------------- | :----------------------------------- |
| `GET    /categories`              | Tree danh mục (public)               |
| `GET    /products`                | List + filter + search (public)      |
| `GET    /products/:slug`          | Detail product theo slug (public)    |
| `POST   /products` (admin)        | Tạo product                          |
| `PATCH  /products/:id` (admin)    | Cập nhật                             |
| `DELETE /products/:id` (admin)    | Soft-delete                          |
| `PATCH  /products/:id/stock`      | Điều chỉnh tồn kho (admin)           |
| `POST   /products/:id/images`     | Upload ảnh (admin, dùng TASK-223)    |

---

## ⚖️ Key Invariants

1. `slug` của Product **duy nhất toàn hệ thống**, sinh từ `name` qua `slugify()`.
2. `SKU` duy nhất toàn hệ thống. Đổi SKU → tạo Product mới, không sửa.
3. `price > 0` luôn luôn. `comparePrice` (nếu có) phải `≥ price`.
4. `stockQuantity ≥ 0`. Trừ kho chỉ qua transaction (xem `04-order/`).
5. Xóa Category đang chứa Product → set `categoryId = NULL` (SET NULL theo TASK-106).
6. Xóa Product có OrderItem → **RESTRICT** (không cho phép xóa).
7. Search dùng **Postgres FTS** (`tsvector` generated column + GIN index + `unaccent` extension) — không ILIKE, không Elasticsearch. Query qua `plainto_tsquery('simple', unaccent(:q))` để diacritic-insensitive (`dien thoai` match `Điện Thoại`). SQL injection: parameter binding qua Prisma `$queryRaw`, không string concat.

---

## 📋 Tasks

| ID       | Topic                       | File                                                            |
| :------- | :-------------------------- | :-------------------------------------------------------------- |
| TASK-108 | Category entity             | [link](./01-category-entity.md)                           |
| TASK-109 | Product entity              | [link](./02-product-entity.md)                            |
| TASK-201 | Categories CRUD             | [link](./03-categories-crud.md)                 |
| TASK-202 | Category tree & filtering   | [link](./05-category-tree.md)                   |
| TASK-203 | Products CRUD               | [link](./04-products-crud.md)                   |
| TASK-204 | Product filter & search     | [link](./06-products-search.md)                  |
| TASK-205 | Stock management            | [link](./07-stock-management.md)                  |
| TASK-206 | Product images              | [link](./08-product-images.md)                |
| TASK-218 | Product variants            | [link](./09-product-variants.md)               |
