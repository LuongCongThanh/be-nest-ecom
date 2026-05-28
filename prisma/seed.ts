import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

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
