# Task 05 — Prisma Schema (User + Address + RefreshToken)

**Phase**: B — Foundation
**Ước lượng**: 2 giờ
**Phụ thuộc**: Task 04
**Ưu tiên**: 🔴 CAO (Data model — sai ở đây phải migration phá cấu trúc sau)
**Trạng thái**: ⏳ Not started
**Spec gốc**: [01-user-entity.md](../../business/01-identity/01-user-entity.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Định nghĩa data model cho 3 entities đầu tiên của hệ thống. Mỗi quyết định thiết kế ở đây có lý do bảo mật / business cụ thể:

- **UUID cho tất cả ID** (`@default(uuid())`): ID không thể enumerate — attacker không thể đoán `user/1`, `user/2`... để scan. Auto-increment int sẽ leak số lượng user.
- **Soft delete cho User** (`deletedAt DateTime?`): User đã xóa nhưng có Order lịch sử — nếu hard delete thì mất `userId` trong Order. Soft delete giữ nguyên lịch sử và satisfy yêu cầu GDPR (anonymize thay vì xóa).
- **`RefreshToken.familyId`**: group các token được sinh từ cùng một phiên login → khi phát hiện token cũ được dùng lại (replay attack), kill toàn bộ family, buộc re-login. Không có `familyId` thì không thể detect replay.
- **`@@index` trên mọi FK và query field**: tránh full table scan khi lookup `WHERE userId = ?` hay `WHERE tokenHash = ?`.

---

## 📋 Quy tắc data model

| Quy tắc                                        | Lý do                                             |
| :--------------------------------------------- | :------------------------------------------------ |
| Mọi `id` dùng `@default(uuid())`               | Không thể enumerate, không leak business metrics  |
| User có `deletedAt DateTime?`                  | Soft delete bảo tồn Order history, GDPR compliant |
| Address và RefreshToken có `onDelete: Cascade` | Khi User bị delete, cleanup tự động               |
| Mọi FK và query field phải có `@@index`        | Tránh full table scan                             |
| `tokenHash String @unique` trên RefreshToken   | Không lưu raw refresh token trong DB              |

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

> **Tại sao dùng enum thay vì String?** Enum được validate ở tầng database — nếu code vô tình gán `role = "SUPERUSER"` thì PostgreSQL sẽ từ chối ngay, không cần viết validation thủ công. String thì database chấp nhận bất kỳ giá trị nào.

---

### 2. Tạo User model

```prisma
model User {
  id             String    @id @default(uuid())   // (1) UUID — không thể enumerate
  email          String    @unique                // unique tự tạo index
  password       String                           // lưu hash (bcrypt), không bao giờ lưu plaintext
  firstName      String?
  lastName       String?
  phone          String?
  role           Role      @default(USER)
  isActive       Boolean   @default(true)
  emailVerified  Boolean   @default(false)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?                        // (2) Soft delete

  addresses      Address[]
  refreshTokens  RefreshToken[]

  @@index([deletedAt])                            // (3) Cần index để filter nhanh
  @@map("users")                                  // tên bảng thực tế trong DB
}
```

**Giải thích từng quyết định:**

**(1) `@id @default(uuid())` — Tại sao không dùng auto-increment int?**

Auto-increment (`1, 2, 3...`) bị tấn công theo kiểu **IDOR (Insecure Direct Object Reference)**:

```text
GET /users/1  → có
GET /users/2  → có
GET /users/3  → scan toàn bộ user trong hệ thống
```

Ngoài ra, client thấy `orderId: 5` biết ngay bạn chỉ có 5 đơn hàng → lộ quy mô kinh doanh.

UUID (`550e8400-e29b-41d4-a716-446655440000`) không thể đoán, không thể enumerate → an toàn hơn.

**(2) `deletedAt DateTime?` — Tại sao soft delete thay vì xóa thẳng?**

Nếu hard delete một User đang có Order lịch sử:

- Bảng `Order` vẫn còn `userId` trỏ vào user không tồn tại → **orphan records**, mất lịch sử mua hàng
- Vi phạm GDPR: GDPR yêu cầu **anonymize** (ẩn danh hóa), không phải xóa vật lý — vì xóa user nhưng còn Order thì vẫn leak thông tin cá nhân

Soft delete chỉ set `deletedAt = now()`. Query thêm `WHERE deletedAt IS NULL` để lọc. User bị "xóa" nhưng Order history vẫn toàn vẹn.

**(3) `@@index([deletedAt])` — Tại sao cần index trên deletedAt?**

Query phổ biến nhất: `SELECT * FROM users WHERE deletedAt IS NULL` (lấy user đang active). Nếu không có index, PostgreSQL phải đọc toàn bộ bảng để tìm các dòng có `deletedAt = null` → **full table scan** — chậm khi có hàng triệu user.

---

### 3. Tạo Address model

```prisma
model Address {
  id            String   @id @default(uuid())
  userId        String                          // FK trỏ về User
  label         String?                         // ví dụ: "Nhà", "Văn phòng"
  recipientName String
  phone         String
  street        String
  ward          String?
  district      String
  city          String
  country       String   @default("VN")
  isDefault     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)  // (4)

  @@index([userId])    // (5) Index FK để tìm địa chỉ theo user nhanh
  @@map("addresses")
}
```

**Giải thích từng quyết định:**

**(4) `onDelete: Cascade` — Tại sao cần cascade?**

Khi User bị xóa (hard delete trong môi trường dev, hoặc tương lai hỗ trợ xóa tài khoản hoàn toàn):

- **Không có Cascade**: Address còn `userId` trỏ vào user không tồn tại → orphan records, chiếm storage, gây lỗi khi join
- **Có Cascade**: PostgreSQL tự động xóa toàn bộ Address liên quan → DB luôn nhất quán, không cần code cleanup thủ công

> Lưu ý: Cascade chỉ kích hoạt khi **hard delete**. Soft delete (`deletedAt`) không trigger Cascade — đây là thiết kế có chủ ý (giữ address để reference).

**(5) `@@index([userId])` — Tại sao cần index trên FK?**

PostgreSQL **không tự tạo index cho foreign key**. Không có index:

```sql
SELECT * FROM addresses WHERE userId = 'abc-123';
-- Full table scan: đọc toàn bộ bảng dù chỉ cần 1-2 dòng
```

Với index, query này O(log n) thay vì O(n).

> **Quy tắc nhớ:** Mọi FK đều cần `@@index`. Ngoại lệ duy nhất: field đã có `@unique` (tự có index).

---

### 4. Tạo RefreshToken model (cần cho Task 13)

```prisma
model RefreshToken {
  id         String    @id @default(uuid())
  userId     String                          // FK trỏ về User
  familyId   String                          // (6) Group token cùng phiên login
  tokenHash  String    @unique               // (7) Không lưu raw token
  usedAt     DateTime?                       // (8) Đánh dấu đã dùng
  revokedAt  DateTime?                       // (8) Đánh dấu đã revoke
  expiresAt  DateTime
  createdAt  DateTime  @default(now())

  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])    // Tìm token theo user
  @@index([familyId])  // (9) Kill cả family khi phát hiện replay
  @@map("refresh_tokens")
}
```

**Giải thích từng quyết định:**

**(6) `familyId String` — Tại sao cần group token?**

Để phát hiện **Refresh Token Replay Attack** — kịch bản:

1. Attacker đánh cắp refresh token của user A (token_1)
2. Attacker dùng token_1 → nhận được token mới (token_2), server revoke token_1
3. User A (chủ nhân thật) cũng dùng token_1 → server thấy token_1 đã được dùng sau khi revoke → **đây là replay attack**

`familyId` group tất cả token sinh từ cùng một phiên login:

```text
login → familyId: "session-abc"
  → token_1 (dùng xong → revoke)
  → token_2 (dùng xong → revoke)
  → token_3 (đang dùng)
```

Khi phát hiện replay: **revoke toàn bộ family "session-abc"** → cả attacker và user đều bị đăng xuất → user nhận cảnh báo tài khoản bị xâm phạm. Không có `familyId`: chỉ revoke được token lẻ, không thể kill cả phiên.

**(7) `tokenHash String @unique` — Tại sao không lưu raw token?**

Nếu database bị leak (SQL injection, backup bị đánh cắp), kẻ tấn công có raw token là có thể dùng ngay. Lưu **hash của token** (SHA-256):

- Verify: `hash(tokenFromCookie) === tokenHash trong DB` → so khớp được
- Nếu DB bị leak: chỉ có hash, không thể reverse ra token gốc

`@unique` vừa đảm bảo không trùng, vừa tự tạo index — không cần `@@index` riêng.

**(8) `usedAt` và `revokedAt` — Tại sao cần cả hai?**

- `usedAt`: ghi lại thời điểm token được dùng để đổi access token mới → nếu cùng token có `usedAt != null` mà còn được gọi lại → **replay detected**
- `revokedAt`: ghi lại thời điểm token bị vô hiệu hóa chủ động (logout, đổi password, phát hiện tấn công)

Thiếu `usedAt` → không biết token đã được dùng chưa → không detect replay.
Thiếu `revokedAt` → không có cách đánh dấu token invalid mà không xóa record (cần giữ để audit).

**(9) `@@index([familyId])` — Tại sao cần index trên familyId?**

Khi phát hiện replay attack, cần revoke toàn bộ family:

```sql
UPDATE refresh_tokens SET revokedAt = NOW() WHERE familyId = 'session-abc';
```

Không có index → full table scan trên toàn bộ bảng refresh_tokens. Với hệ thống nhiều user, bảng này lớn nhanh → index là bắt buộc.

---

> **Quy tắc "1 địa chỉ mặc định":** Rule "mỗi user chỉ có 1 `isDefault = true`" sẽ được enforce ở service layer, không phải schema. PostgreSQL hỗ trợ partial unique index (`UNIQUE WHERE isDefault = true`) nhưng Prisma schema chưa hỗ trợ cú pháp này trực tiếp — cần raw SQL migration nếu muốn enforce ở DB level.

### 5. Quy tắc quan trọng cần nhớ

- **UUID**: mọi `id` dùng `@default(uuid())` — không dùng auto-increment
- **Soft delete**: User có `deletedAt` — không bao giờ hard delete User có lịch sử
- **Cascade**: Address và RefreshToken cascade delete theo User
- **Index**: mọi FK và field dùng để query phải có `@@index`

---

## ✅ Tiêu chí nghiệm thu

### AC-1: Schema hợp lệ theo Prisma

- **Given** schema đã được viết vào `prisma/schema.prisma`
- **When** chạy `npx prisma validate`
- **Then** output: `The schema at prisma/schema.prisma is valid` — không có warning hay error

### AC-2: UUID được dùng cho tất cả ID

- **Given** schema đã viết
- **When** kiểm tra tất cả model `id` field
- **Then** tất cả đều có `@default(uuid())`, không có `@default(autoincrement())`

### AC-3: RefreshToken có đủ field để detect replay

- **Given** RefreshToken model
- **When** kiểm tra schema
- **Then** có cả 3 field: `familyId` (group session), `usedAt` (mark đã dùng), `revokedAt` (mark đã revoke) — thiếu 1 trong 3 thì replay detection ở Task 13 sẽ không hoạt động

### AC-4: Mọi foreign key và query field quan trọng đều có index hoặc unique constraint

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
