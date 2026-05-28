# Task 08 — Seed Data

**Phase**: B — Foundation
**Ước lượng**: 1 giờ
**Phụ thuộc**: Task 07
**Ưu tiên**: 🟡 SHOULD (Developer experience — không block build ngay, nhưng thiếu thì verify Task 12+ rất chậm)
**Trạng thái**: ✅ Done
**Spec gốc**: [02-seed-data.md](../../setup/03-conventions/02-seed-data.md)

---

## 🎯 Mục tiêu & Ý nghĩa

Tạo seed script để populate dữ liệu demo vào DB. Mỗi lần reset DB chỉ cần chạy 1 lệnh là có data để test.

- **Tốc độ phát triển**: Không có seed thì mỗi developer phải tự tạo account admin, tạo category, tạo product thủ công mỗi lần reset DB — mất 15-30 phút. Với seed thì 1 lệnh, 5 giây.
- **Credentials cố định** (`admin@ecom.dev / Admin@123456`): mọi developer dùng cùng account để test — không bị "tôi không nhớ password tôi đã tạo".
- **Chỉ dùng cho local dev**: credentials trong seed là dữ liệu tiện lợi cho môi trường local. Không bao giờ reuse cho shared/staging/production.
- **Hash bcrypt trong seed**: seed tạo user với password đã hash — giống production, test case đúng hơn. Không bao giờ seed plaintext password.
- **Xóa data cũ trước khi seed** (`deleteMany` theo thứ tự FK): seed có thể chạy nhiều lần mà không bị lỗi duplicate key. Thứ tự xóa quan trọng: phải xóa child table (RefreshToken, Address) trước parent (User).

---

## 🛠️ Các bước thực hiện

### 1. Cài bcrypt

```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

### 2. Tạo seed file

Tạo `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Xóa data cũ (order quan trọng vì có FK)
  await prisma.refreshToken.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // Tạo admin user
  const hashedPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@ecom.dev',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });

  // Tạo 3 địa chỉ demo cho admin
  await prisma.address.createMany({
    data: [
      {
        userId: admin.id,
        label: 'Nhà',
        recipientName: 'Admin User',
        phone: '0901234567',
        street: '123 Đường Lê Lợi',
        district: 'Quận 1',
        city: 'Hồ Chí Minh',
        isDefault: true,
      },
      {
        userId: admin.id,
        label: 'Công ty',
        recipientName: 'Admin User',
        phone: '0901234567',
        street: '456 Đường Nguyễn Huệ',
        district: 'Quận 1',
        city: 'Hồ Chí Minh',
        isDefault: false,
      },
      {
        userId: admin.id,
        label: 'Khác',
        recipientName: 'Admin User',
        phone: '0901234567',
        street: '789 Đường Trần Hưng Đạo',
        district: 'Quận 5',
        city: 'Hồ Chí Minh',
        isDefault: false,
      },
    ],
  });

  // Tạo demo user thường
  const userPassword = await bcrypt.hash('User@123456', 12);
  await prisma.user.create({
    data: {
      email: 'user@ecom.dev',
      password: userPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: 'USER',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('Seeding done!');
  console.log('Admin: admin@ecom.dev / Admin@123456');
  console.log('User:  user@ecom.dev  / User@123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

### 3. Cấu hình seed trong package.json

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### 4. Cài ts-node nếu chưa có

```bash
npm install --save-dev ts-node
```

---

## ✅ Tiêu chí nghiệm thu

**AC-1: Seed chạy thành công lần đầu**

- **Given** DB sau khi `prisma migrate dev` (empty, chưa có data)
- **When** chạy `npx prisma db seed`
- **Then** output hiện `Seeding done!` và credentials; DBeaver bảng `users` có 2 rows, `addresses` có 3 rows

**AC-2: Seed idempotent — chạy nhiều lần không lỗi**

- **Given** đã chạy seed lần đầu (có 2 users trong DB)
- **When** chạy `npx prisma db seed` lần nữa
- **Then** không có lỗi duplicate key; DB vẫn có đúng 2 users, 3 addresses (data cũ bị xóa và tạo lại)

**AC-3: Password được hash, không phải plaintext**

- **Given** seed đã chạy
- **When** query `SELECT password FROM users WHERE email = 'admin@ecom.dev'` trong DBeaver
- **Then** giá trị là bcrypt hash (bắt đầu bằng `$2b$12$...`), độ dài ≥ 60 ký tự — không phải `Admin@123456`

**AC-4: Login với seed credentials hoạt động (sau Task 12)**

- **Given** seed đã chạy, auth endpoints đã implement (Task 12)
- **When** gọi `POST /api/v1/auth/login` với `admin@ecom.dev / Admin@123456`
- **Then** response `200` với `accessToken` — xác nhận seed tạo user với hash đúng

---

## Verify hoàn thành

```bash
npx prisma db seed
# Phải output:
# Seeding done!
# Admin: admin@ecom.dev / Admin@123456
# User:  user@ecom.dev  / User@123456
```

Mở DBeaver → bảng `users` phải có 2 rows, bảng `addresses` phải có 3 rows.

---

## 🚫 Ngoài phạm vi

- Seed dữ liệu cho Catalog (categories, products) → Phase C
- Seed dữ liệu cho testing (fixtures) → Phase E khi setup e2e tests
- Faker.js để generate realistic fake data → có thể thêm sau khi cần volume testing
- Seed script riêng cho từng environment (dev/staging) → DevOps setup
- Staff user seed → thêm khi cần test STAFF role features

---

## Xong thì làm gì?

→ Mở task tiếp theo: [09-validation-pipe.md](./09-validation-pipe.md)
