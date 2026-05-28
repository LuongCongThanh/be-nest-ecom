# Task C-01 — Catalog Schema (Category + Product)

**Phase**: C — Core MVP
**Ước lượng**: 2 giờ
**Phụ thuộc**: Phase B hoàn thành
**Ưu tiên**: 🔴 BLOCKING (foundation schema — mọi task C sau đều phụ thuộc vào migration này)
**Trạng thái**: ⏳ Not started
**Spec gốc**: [README.md](../../business/02-catalog/README.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Thêm `Category`, `Product`, `ProductVariant`, `ProductImage` models vào `prisma/schema.prisma` và generate migration.

- **Schema là foundation của cả Phase C**: không có bảng thì không có CRUD, không có CRUD thì không có cart, không có cart thì không có order. Làm đúng schema lần đầu tiết kiệm nhiều migration fixup sau.
- **Soft delete bắt buộc cho Category và Product**: xóa category không xóa sản phẩm cũ trong order history — đây là invariant domain quan trọng.
- **Inventory rule phải nhất quán ngay từ schema**: Phase C dùng `Product.stock` (integer trực tiếp) cho MVP. Variants dùng `ProductVariant.stock` — nhưng nếu product không có variant thì stock nằm ở Product. Ghi rõ convention này để task C-02 và C-04 không bị drift.

> **Quy ước Phase C**: catalog read là public, write là admin/staff. Inventory nằm ở `Product.stock` cho trường hợp không có variant. Nếu product có variant thì `Product.stock` = sum của tất cả variant stock (denormalized, update khi variant stock thay đổi).

---

## Các bước thực hiện

### 1. Thêm Category model

```prisma
model Category {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  imageUrl    String?
  parentId    String?
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  parent      Category?   @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[]  @relation("CategoryTree")
  products    Product[]

  @@index([parentId])
  @@map("categories")
}
```

### 2. Thêm Product model

```prisma
model Product {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  categoryId  String?
  basePrice   BigInt
  stock       Int       @default(0)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  category    Category?        @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  variants    ProductVariant[]
  images      ProductImage[]

  @@index([categoryId])
  @@index([deletedAt])
  @@map("products")
}
```

### 3. Thêm ProductVariant model

```prisma
model ProductVariant {
  id         String   @id @default(uuid())
  productId  String
  name       String
  sku        String   @unique
  price      BigInt
  stock      Int      @default(0)
  attributes Json     @default("{}")
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([sku])
  @@map("product_variants")
}
```

### 4. Thêm ProductImage model

```prisma
model ProductImage {
  id        String   @id @default(uuid())
  productId String
  url       String
  altText   String?
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@map("product_images")
}
```

### 5. Generate migration

```bash
npx prisma migrate dev --name add-catalog
npx prisma generate
```

> `slug` và `sku` đã là unique constraint, nên không cần thêm `@@index` lặp lại cho chính các field này.

---

## Verify hoàn thành

```bash
npx prisma migrate status
# All migrations applied

npx prisma studio
# Kiểm tra tables: categories, products, product_variants, product_images
```

---

## Xong thì làm gì?

→ [02-catalog-crud.md](./02-catalog-crud.md)
