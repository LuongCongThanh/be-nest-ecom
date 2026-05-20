# Task 05 — Prisma Schema (User + Address + RefreshToken)

**Phase**: B — Foundation
**Ước lượng**: 2 giờ
**Phụ thuộc**: Task 04
**Ưu tiên**: 🔴 CAO (Data model — sai ở đây phải migration phá cấu trúc sau)
**Trạng thái**: ⏳ Not started
**Spec gốc**: [planning/business/01-identity/01-user-entity.md](../../planning/business/01-identity/01-user-entity.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Định nghĩa data model cho 3 entities đầu tiên của hệ thống. Mỗi quyết định thiết kế ở đây có lý do bảo mật / business cụ thể:

- **UUID cho tất cả ID** (`@default(uuid())`): ID không thể enumerate — attacker không thể đoán `user/1`, `user/2`... để scan. Auto-increment int sẽ leak số lượng user.
- **Soft delete cho User** (`deletedAt DateTime?`): User đã xóa nhưng có Order lịch sử — nếu hard delete thì mất `userId` trong Order. Soft delete giữ nguyên lịch sử và satisfy yêu cầu GDPR (anonymize thay vì xóa).
- **`RefreshToken.familyId`**: group các token được sinh từ cùng một phiên login → khi phát hiện token cũ được dùng lại (replay attack), kill toàn bộ family, buộc re-login. Không có `familyId` thì không thể detect replay.
- **`@@index` trên mọi FK và query field**: tránh full table scan khi lookup `WHERE userId = ?` hay `WHERE tokenHash = ?`.

---

## 📋 Quy tắc data model

| Quy tắc | Lý do |
| :--- | :--- |
| Mọi `id` dùng `@default(uuid())` | Không thể enumerate, không leak business metrics |
| User có `deletedAt DateTime?` | Soft delete bảo tồn Order history, GDPR compliant |
| Address và RefreshToken có `onDelete: Cascade` | Khi User bị delete, cleanup tự động |
| Mọi FK và query field phải có `@@index` | Tránh full table scan |
| `tokenHash String @unique` trên RefreshToken | Không lưu raw refresh token trong DB |

---

## 🛠️ Các bước thực hiện

### 1. Tạo enum Role

Thêm vào `prisma/schema.prisma`:

```prisma
enum Role {
  GUEST
  USER
  STAFF
  ADMIN
}
```

### 2. Tạo User model

```prisma
model User {
  id             String    @id @default(uuid())
  email          String    @unique
  password       String
  firstName      String?
  lastName       String?
  phone          String?
  role           Role      @default(USER)
  isActive       Boolean   @default(true)
  emailVerified  Boolean   @default(false)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?

  addresses      Address[]
  refreshTokens  RefreshToken[]

  @@index([deletedAt])
  @@map("users")
}
```

### 3. Tạo Address model

```prisma
model Address {
  id           String   @id @default(uuid())
  userId       String
  label        String?
  recipientName String
  phone        String
  street       String
  ward         String?
  district     String
  city         String
  country      String   @default("VN")
  isDefault    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("addresses")
}
```

### 4. Tạo RefreshToken model (cần cho Task 13)

```prisma
model RefreshToken {
  id         String    @id @default(uuid())
  userId     String
  familyId   String
  tokenHash  String    @unique
  usedAt     DateTime?
  revokedAt  DateTime?
  expiresAt  DateTime
  createdAt  DateTime  @default(now())

  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([familyId])
  @@map("refresh_tokens")
}
```

> Quy tắc business "mỗi user chỉ có 1 địa chỉ mặc định" sẽ được enforce ở service layer; Prisma/PostgreSQL không hỗ trợ partial unique đơn giản ở mức schema như `isDefault = true`.

### 5. Quy tắc quan trọng cần nhớ

- **UUID**: mọi `id` dùng `@default(uuid())` — không dùng auto-increment
- **Soft delete**: User có `deletedAt` — không bao giờ hard delete User có lịch sử
- **Cascade**: Address và RefreshToken cascade delete theo User
- **Index**: mọi FK và field dùng để query phải có `@@index`

---

## ✅ Tiêu chí nghiệm thu

**AC-1: Schema hợp lệ theo Prisma**

- **Given** schema đã được viết vào `prisma/schema.prisma`
- **When** chạy `npx prisma validate`
- **Then** output: `The schema at prisma/schema.prisma is valid` — không có warning hay error

**AC-2: UUID được dùng cho tất cả ID**

- **Given** schema đã viết
- **When** kiểm tra tất cả model `id` field
- **Then** tất cả đều có `@default(uuid())`, không có `@default(autoincrement())`

**AC-3: RefreshToken có đủ field để detect replay**

- **Given** RefreshToken model
- **When** kiểm tra schema
- **Then** có cả 3 field: `familyId` (group session), `usedAt` (mark đã dùng), `revokedAt` (mark đã revoke) — thiếu 1 trong 3 thì replay detection ở Task 13 sẽ không hoạt động

**AC-4: Mọi foreign key và query field quan trọng đều có index hoặc unique constraint**

- **Given** schema đã viết
- **When** review tất cả `@@index` declarations
- **Then** `Address.userId`, `RefreshToken.userId`, `RefreshToken.familyId` đều có index; `User.email` và `RefreshToken.tokenHash` được bảo vệ bằng unique constraint; `User.deletedAt` có index

---

## Verify hoàn thành

Chạy:
```bash
npx prisma validate
# Phải output: The schema at prisma/schema.prisma is valid
```

---

## 🚫 Ngoài phạm vi

- Schema cho Catalog (Category, Product, Variant) → Phase C Task 01
- Schema cho Cart, Order, Payment → Phase C
- Full-text search index trên Product → Phase C
- DB partitioning / archiving strategy → production scale, ngoài scope
- Prisma soft-delete middleware (auto-filter `deletedAt`) → optional improvement, không block Phase B

---

## Xong thì làm gì?

→ Mở task tiếp theo: [06-migrations.md](./06-migrations.md)
