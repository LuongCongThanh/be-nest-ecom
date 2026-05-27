# Task C-01 — Catalog Schema (Category + Product)

**Phase**: C — Core MVP  
**Ước lượng**: 2 giờ  
**Phụ thuộc**: Phase B hoàn thành  
**Spec gốc**: [README.md](../../business/02-catalog/README.md)

---

## Nhiệm vụ

Thêm `Category`, `Product`, `ProductVariant`, `ProductImage` models vào `prisma/schema.prisma`. Sau đó generate migration.

> Quy ước Phase C: catalog read là public, write là admin/staff; soft delete được dùng cho `Category` và `Product`. Inventory có thể nằm ở `Product.stock` hoặc `ProductVariant.stock`, nhưng các task sau phải dùng cùng một rule thống nhất.

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
