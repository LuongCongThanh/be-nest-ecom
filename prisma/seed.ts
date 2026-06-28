import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Xóa data cũ (order quan trọng vì có FK)
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
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

  // ─── Categories ───────────────────────────────────────────────────────────
  console.log('Seeding categories...');

  const catDienTu = await prisma.category.create({
    data: { name: 'Điện Tử', slug: 'dien-tu', description: 'Thiết bị điện tử, công nghệ', sortOrder: 1 },
  });
  const catThoiTrang = await prisma.category.create({
    data: { name: 'Thời Trang', slug: 'thoi-trang', description: 'Quần áo, phụ kiện thời trang', sortOrder: 2 },
  });
  const catGiaDung = await prisma.category.create({
    data: { name: 'Gia Dụng', slug: 'gia-dung', description: 'Đồ dùng gia đình', sortOrder: 3 },
  });

  // Sub-categories cấp 2
  const catDienThoai = await prisma.category.create({
    data: { name: 'Điện Thoại', slug: 'dien-thoai', parentId: catDienTu.id, sortOrder: 1 },
  });
  const catLaptop = await prisma.category.create({
    data: { name: 'Laptop & Máy Tính Bảng', slug: 'laptop-may-tinh-bang', parentId: catDienTu.id, sortOrder: 2 },
  });
  const catAoNam = await prisma.category.create({
    data: { name: 'Áo & Quần Nam', slug: 'ao-quan-nam', parentId: catThoiTrang.id, sortOrder: 1 },
  });
  const catAoNu = await prisma.category.create({
    data: { name: 'Áo & Quần Nữ', slug: 'ao-quan-nu', parentId: catThoiTrang.id, sortOrder: 2 },
  });

  // ─── Products ─────────────────────────────────────────────────────────────
  console.log('Seeding products...');

  await prisma.product.createMany({
    data: [
      {
        sku: 'PHONE-IPHONE15-128',
        name: 'iPhone 15 128GB',
        slug: 'iphone-15-128gb',
        description: 'iPhone 15 mới nhất với chip A16 Bionic, camera 48MP.',
        price: BigInt(22_990_000),
        comparePrice: BigInt(24_990_000),
        stockQuantity: 50,
        lowStockThreshold: 5,
        isActive: true,
        isFeatured: true,
        categoryId: catDienThoai.id,
      },
      {
        sku: 'PHONE-SAMSUNG-S24',
        name: 'Samsung Galaxy S24 256GB',
        slug: 'samsung-galaxy-s24-256gb',
        description: 'Galaxy S24 với AI tích hợp, màn hình Dynamic AMOLED 2X.',
        price: BigInt(19_990_000),
        comparePrice: BigInt(21_990_000),
        stockQuantity: 30,
        lowStockThreshold: 5,
        isActive: true,
        isFeatured: true,
        categoryId: catDienThoai.id,
      },
      {
        sku: 'LAPTOP-MACBOOK-AIR-M2',
        name: 'MacBook Air M2 8GB/256GB',
        slug: 'macbook-air-m2-8gb-256gb',
        description: 'MacBook Air với chip M2, thiết kế mỏng nhẹ, pin 18 giờ.',
        price: BigInt(28_990_000),
        comparePrice: BigInt(32_990_000),
        stockQuantity: 20,
        lowStockThreshold: 3,
        isActive: true,
        isFeatured: true,
        categoryId: catLaptop.id,
      },
      {
        sku: 'SHIRT-POLO-NAVY-M',
        name: 'Áo Polo Nam Basic Navy Size M',
        slug: 'ao-polo-nam-basic-navy-m',
        description: 'Áo polo cotton 100%, form regular, thoáng mát.',
        price: BigInt(299_000),
        comparePrice: BigInt(399_000),
        stockQuantity: 200,
        lowStockThreshold: 20,
        isActive: true,
        isFeatured: false,
        categoryId: catAoNam.id,
      },
      {
        sku: 'DRESS-FLORAL-RED-S',
        name: 'Đầm Hoa Nhí Đỏ Size S',
        slug: 'dam-hoa-nhi-do-size-s',
        description: 'Đầm maxi họa tiết hoa nhí, chất liệu voan mềm mại.',
        price: BigInt(459_000),
        comparePrice: BigInt(590_000),
        stockQuantity: 80,
        lowStockThreshold: 10,
        isActive: true,
        isFeatured: false,
        categoryId: catAoNu.id,
      },
      {
        sku: 'PHONE-OPPO-A78-128',
        name: 'OPPO A78 128GB',
        slug: 'oppo-a78-128gb',
        description: 'OPPO A78 pin 5000mAh, sạc nhanh 67W.',
        price: BigInt(6_990_000),
        stockQuantity: 0,
        lowStockThreshold: 5,
        isActive: true,
        isFeatured: false,
        categoryId: catDienThoai.id,
      },
      {
        sku: 'GADGET-INACTIVE-001',
        name: 'Sản phẩm tạm ẩn',
        slug: 'san-pham-tam-an',
        description: 'Sản phẩm đang được cập nhật.',
        price: BigInt(999_000),
        stockQuantity: 10,
        isActive: false,
        isFeatured: false,
        categoryId: catGiaDung.id,
      },
    ],
  });

  // ─── 100 extra products ───────────────────────────────────────────────────
  console.log('Seeding 100 extra products...');

  await prisma.product.createMany({
    data: [
      // ── Điện Thoại (25) ────────────────────────────────────────────────
      { sku: 'PHONE-IP15PM-256',   name: 'iPhone 15 Pro Max 256GB',          slug: 'iphone-15-pro-max-256gb',          price: 34990000n, comparePrice: 37990000n, stockQuantity: 40,  lowStockThreshold: 5, isActive: true, isFeatured: true,  categoryId: catDienThoai.id },
      { sku: 'PHONE-IP15PM-512',   name: 'iPhone 15 Pro Max 512GB',          slug: 'iphone-15-pro-max-512gb',          price: 39990000n, comparePrice: 43990000n, stockQuantity: 20,  lowStockThreshold: 5, isActive: true, isFeatured: true,  categoryId: catDienThoai.id },
      { sku: 'PHONE-IP14-128',     name: 'iPhone 14 128GB',                  slug: 'iphone-14-128gb',                  price: 18990000n, comparePrice: 22990000n, stockQuantity: 60,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-IP13-128',     name: 'iPhone 13 128GB',                  slug: 'iphone-13-128gb',                  price: 14490000n, comparePrice: 17990000n, stockQuantity: 80,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-IPSE2-64',     name: 'iPhone SE 2022 64GB',              slug: 'iphone-se-2022-64gb',              price: 10990000n, comparePrice: 12990000n, stockQuantity: 35,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-SS-S24U-256',  name: 'Samsung Galaxy S24 Ultra 256GB',   slug: 'samsung-galaxy-s24-ultra-256gb',   price: 31990000n, comparePrice: 34990000n, stockQuantity: 25,  lowStockThreshold: 5, isActive: true, isFeatured: true,  categoryId: catDienThoai.id },
      { sku: 'PHONE-SS-S23-128',   name: 'Samsung Galaxy S23 128GB',         slug: 'samsung-galaxy-s23-128gb',         price: 15990000n, comparePrice: 19990000n, stockQuantity: 45,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-SS-A55-128',   name: 'Samsung Galaxy A55 128GB',         slug: 'samsung-galaxy-a55-128gb',         price: 8990000n,  comparePrice: 10490000n, stockQuantity: 70,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-SS-A35-128',   name: 'Samsung Galaxy A35 128GB',         slug: 'samsung-galaxy-a35-128gb',         price: 6490000n,  comparePrice: 7490000n,  stockQuantity: 90,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-SS-A15-128',   name: 'Samsung Galaxy A15 128GB',         slug: 'samsung-galaxy-a15-128gb',         price: 3990000n,  comparePrice: 4490000n,  stockQuantity: 120, lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-XMI-14-256',   name: 'Xiaomi 14 256GB',                  slug: 'xiaomi-14-256gb',                  price: 17990000n, comparePrice: 19990000n, stockQuantity: 30,  lowStockThreshold: 5, isActive: true, isFeatured: true,  categoryId: catDienThoai.id },
      { sku: 'PHONE-XMI-13T-256',  name: 'Xiaomi 13T 256GB',                 slug: 'xiaomi-13t-256gb',                 price: 11990000n, comparePrice: 13990000n, stockQuantity: 55,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-XMI-RN12-128', name: 'Xiaomi Redmi Note 12 128GB',       slug: 'xiaomi-redmi-note-12-128gb',       price: 4990000n,  comparePrice: 5990000n,  stockQuantity: 150, lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-XMI-RN13-256', name: 'Xiaomi Redmi Note 13 Pro 256GB',   slug: 'xiaomi-redmi-note-13-pro-256gb',   price: 7490000n,  comparePrice: 8990000n,  stockQuantity: 85,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-OPP-RN11-128', name: 'OPPO Reno 11 128GB',               slug: 'oppo-reno-11-128gb',               price: 8490000n,  comparePrice: 9990000n,  stockQuantity: 65,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-OPP-F25-256',  name: 'OPPO F25 Pro 256GB',               slug: 'oppo-f25-pro-256gb',               price: 7990000n,  comparePrice: 9490000n,  stockQuantity: 40,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-VIV-V30-256',  name: 'Vivo V30 256GB',                   slug: 'vivo-v30-256gb',                   price: 8990000n,  comparePrice: 10490000n, stockQuantity: 50,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-VIV-Y36-128',  name: 'Vivo Y36 128GB',                   slug: 'vivo-y36-128gb',                   price: 4490000n,  comparePrice: 5490000n,  stockQuantity: 100, lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-REA-GT6-256',  name: 'Realme GT 6 256GB',                slug: 'realme-gt-6-256gb',                price: 9990000n,  comparePrice: 11990000n, stockQuantity: 35,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-NOK-G42-128',  name: 'Nokia G42 128GB',                  slug: 'nokia-g42-128gb',                  price: 3490000n,  comparePrice: 4190000n,  stockQuantity: 45,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-PIX-8A-128',   name: 'Google Pixel 8a 128GB',            slug: 'google-pixel-8a-128gb',            price: 13990000n, comparePrice: 15990000n, stockQuantity: 20,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-HUA-P60-256',  name: 'Huawei P60 Pro 256GB',             slug: 'huawei-p60-pro-256gb',             price: 19990000n, comparePrice: 22990000n, stockQuantity: 15,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-SON-XZ5-128',  name: 'Sony Xperia 5 V 128GB',            slug: 'sony-xperia-5-v-128gb',            price: 16990000n, comparePrice: 19990000n, stockQuantity: 12,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-ASUS-ZF10-256',name: 'ASUS Zenfone 10 256GB',            slug: 'asus-zenfone-10-256gb',            price: 14990000n, comparePrice: 17490000n, stockQuantity: 18,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },
      { sku: 'PHONE-MOTO-G54-256', name: 'Motorola Moto G54 256GB',          slug: 'motorola-moto-g54-256gb',          price: 3990000n,  comparePrice: 4990000n,  stockQuantity: 60,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catDienThoai.id },

      // ── Laptop & Máy Tính Bảng (20) ──────────────────────────────────
      { sku: 'LAP-MBPRO-M3-14',    name: 'MacBook Pro M3 14 inch 8GB 512GB', slug: 'macbook-pro-m3-14-8gb-512gb',     price: 44990000n, comparePrice: 48990000n, stockQuantity: 15,  lowStockThreshold: 3, isActive: true, isFeatured: true,  categoryId: catLaptop.id },
      { sku: 'LAP-MBAIR-M3-13',    name: 'MacBook Air M3 13 inch 8GB 256GB', slug: 'macbook-air-m3-13-8gb-256gb',     price: 30990000n, comparePrice: 33990000n, stockQuantity: 20,  lowStockThreshold: 3, isActive: true, isFeatured: true,  categoryId: catLaptop.id },
      { sku: 'LAP-DELL-XPS13-512', name: 'Dell XPS 13 i7 16GB 512GB',        slug: 'dell-xps-13-i7-16gb-512gb',       price: 35990000n, comparePrice: 39990000n, stockQuantity: 10,  lowStockThreshold: 3, isActive: true, isFeatured: true,  categoryId: catLaptop.id },
      { sku: 'LAP-DELL-INS15-256', name: 'Dell Inspiron 15 i5 8GB 256GB',    slug: 'dell-inspiron-15-i5-8gb-256gb',   price: 16990000n, comparePrice: 19490000n, stockQuantity: 30,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catLaptop.id },
      { sku: 'LAP-HP-ENV14-512',   name: 'HP Envy 14 i7 16GB 512GB',         slug: 'hp-envy-14-i7-16gb-512gb',        price: 28990000n, comparePrice: 31990000n, stockQuantity: 12,  lowStockThreshold: 3, isActive: true, isFeatured: false, categoryId: catLaptop.id },
      { sku: 'LAP-HP-PAV15-256',   name: 'HP Pavilion 15 i5 8GB 256GB',      slug: 'hp-pavilion-15-i5-8gb-256gb',     price: 14990000n, comparePrice: 17490000n, stockQuantity: 35,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catLaptop.id },
      { sku: 'LAP-ASUS-ZB14-512',  name: 'ASUS ZenBook 14 OLED i7 16GB',     slug: 'asus-zenbook-14-oled-i7-16gb',    price: 24990000n, comparePrice: 27990000n, stockQuantity: 18,  lowStockThreshold: 3, isActive: true, isFeatured: true,  categoryId: catLaptop.id },
      { sku: 'LAP-ASUS-VB16-512',  name: 'ASUS VivoBook 16 i5 8GB 512GB',    slug: 'asus-vivobook-16-i5-8gb-512gb',   price: 15990000n, comparePrice: 17990000n, stockQuantity: 40,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catLaptop.id },
      { sku: 'LAP-ASUS-ROG-RTX',   name: 'ASUS ROG Strix G16 RTX 4070',      slug: 'asus-rog-strix-g16-rtx-4070',     price: 42990000n, comparePrice: 46990000n, stockQuantity: 8,   lowStockThreshold: 2, isActive: true, isFeatured: true,  categoryId: catLaptop.id },
      { sku: 'LAP-LEN-T14-512',    name: 'Lenovo ThinkPad T14 i7 16GB',       slug: 'lenovo-thinkpad-t14-i7-16gb',     price: 27990000n, comparePrice: 31990000n, stockQuantity: 15,  lowStockThreshold: 3, isActive: true, isFeatured: false, categoryId: catLaptop.id },
      { sku: 'LAP-LEN-LOQ15-512',  name: 'Lenovo LOQ 15 RTX 4060',           slug: 'lenovo-loq-15-rtx-4060',          price: 27490000n, comparePrice: 30990000n, stockQuantity: 20,  lowStockThreshold: 3, isActive: true, isFeatured: false, categoryId: catLaptop.id },
      { sku: 'LAP-MSI-MOD15-1TB',  name: 'MSI Modern 15 i7 32GB 1TB',        slug: 'msi-modern-15-i7-32gb-1tb',       price: 22990000n, comparePrice: 25990000n, stockQuantity: 10,  lowStockThreshold: 3, isActive: true, isFeatured: false, categoryId: catLaptop.id },
      { sku: 'TAB-IPAD-AIR6-256',  name: 'iPad Air 6 M2 256GB WiFi',          slug: 'ipad-air-6-m2-256gb-wifi',        price: 18990000n, comparePrice: 20990000n, stockQuantity: 25,  lowStockThreshold: 5, isActive: true, isFeatured: true,  categoryId: catLaptop.id },
      { sku: 'TAB-IPAD-P13-256',   name: 'iPad Pro 13 M4 256GB WiFi',         slug: 'ipad-pro-13-m4-256gb-wifi',       price: 33990000n, comparePrice: 36990000n, stockQuantity: 12,  lowStockThreshold: 3, isActive: true, isFeatured: true,  categoryId: catLaptop.id },
      { sku: 'TAB-SS-TAB9-256',    name: 'Samsung Galaxy Tab S9 256GB',       slug: 'samsung-galaxy-tab-s9-256gb',     price: 18490000n, comparePrice: 21490000n, stockQuantity: 20,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catLaptop.id },
      { sku: 'TAB-SS-TABA9P-128',  name: 'Samsung Galaxy Tab A9 Plus 128GB',  slug: 'samsung-galaxy-tab-a9-plus-128gb',price: 7490000n,  comparePrice: 8990000n,  stockQuantity: 40,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catLaptop.id },
      { sku: 'TAB-XMI-PAD6-256',   name: 'Xiaomi Pad 6 256GB',                slug: 'xiaomi-pad-6-256gb',              price: 8990000n,  comparePrice: 10490000n, stockQuantity: 30,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catLaptop.id },
      { sku: 'LAP-ACR-A514-512',   name: 'Acer Aspire 5 i5 8GB 512GB',        slug: 'acer-aspire-5-i5-8gb-512gb',      price: 13990000n, comparePrice: 15990000n, stockQuantity: 30,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catLaptop.id },
      { sku: 'LAP-ACR-NIT5-RTX',   name: 'Acer Nitro 5 RTX 4060',             slug: 'acer-nitro-5-rtx-4060',           price: 24490000n, comparePrice: 27490000n, stockQuantity: 15,  lowStockThreshold: 3, isActive: true, isFeatured: false, categoryId: catLaptop.id },
      { sku: 'LAP-LGR-14Z90-512',  name: 'LG Gram 14 i7 16GB 512GB',          slug: 'lg-gram-14-i7-16gb-512gb',        price: 31990000n, comparePrice: 34990000n, stockQuantity: 8,   lowStockThreshold: 2, isActive: true, isFeatured: false, categoryId: catLaptop.id },

      // ── Áo & Quần Nam (20) ───────────────────────────────────────────
      { sku: 'MENS-TSHIRT-WHITE-M', name: 'Áo Thun Nam Trơn Trắng Size M',       slug: 'ao-thun-nam-tron-trang-m',      price: 199000n, comparePrice: 259000n, stockQuantity: 300, lowStockThreshold: 20, isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-TSHIRT-BLACK-L', name: 'Áo Thun Nam Trơn Đen Size L',         slug: 'ao-thun-nam-tron-den-l',        price: 199000n, comparePrice: 259000n, stockQuantity: 280, lowStockThreshold: 20, isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-TSHIRT-GREY-XL', name: 'Áo Thun Nam Oversize Xám Size XL',    slug: 'ao-thun-nam-oversize-xam-xl',   price: 249000n, comparePrice: 329000n, stockQuantity: 200, lowStockThreshold: 20, isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-POLO-BLUE-M',    name: 'Áo Polo Nam Xanh Navy Size M',        slug: 'ao-polo-nam-xanh-navy-m',       price: 349000n, comparePrice: 449000n, stockQuantity: 150, lowStockThreshold: 15, isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-POLO-WHITE-L',   name: 'Áo Polo Nam Trắng Size L',            slug: 'ao-polo-nam-trang-l',           price: 349000n, comparePrice: 449000n, stockQuantity: 140, lowStockThreshold: 15, isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-SHIRT-STRIPE-M', name: 'Áo Sơ Mi Nam Kẻ Sọc Size M',         slug: 'ao-so-mi-nam-ke-soc-m',         price: 429000n, comparePrice: 559000n, stockQuantity: 120, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-SHIRT-WHITE-L',  name: 'Áo Sơ Mi Nam Trắng Slimfit Size L',  slug: 'ao-so-mi-nam-trang-slimfit-l',  price: 399000n, comparePrice: 519000n, stockQuantity: 130, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-JEANS-BLUE-32',  name: 'Quần Jeans Nam Xanh Nhạt Waist 32',  slug: 'quan-jeans-nam-xanh-nhat-32',   price: 599000n, comparePrice: 799000n, stockQuantity: 100, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-JEANS-DARK-34',  name: 'Quần Jeans Nam Màu Tối Waist 34',    slug: 'quan-jeans-nam-mau-toi-34',     price: 629000n, comparePrice: 829000n, stockQuantity: 90,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-CHINO-BEIGE-32', name: 'Quần Kaki Nam Beige Waist 32',        slug: 'quan-kaki-nam-beige-32',        price: 499000n, comparePrice: 649000n, stockQuantity: 110, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-SHORT-GREY-M',   name: 'Quần Short Nam Xám Đậm Size M',       slug: 'quan-short-nam-xam-dam-m',      price: 299000n, comparePrice: 399000n, stockQuantity: 200, lowStockThreshold: 20, isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-HOODIE-BLACK-L', name: 'Áo Hoodie Nam Đen Size L',            slug: 'ao-hoodie-nam-den-l',           price: 549000n, comparePrice: 699000n, stockQuantity: 90,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-JACKET-NAVY-M',  name: 'Áo Khoác Nam Xanh Navy Size M',       slug: 'ao-khoac-nam-xanh-navy-m',     price: 799000n, comparePrice: 999000n, stockQuantity: 60,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-JACKET-WIND-L',  name: 'Áo Khoác Gió Nam Nhẹ Size L',         slug: 'ao-khoac-gio-nam-nhe-l',       price: 699000n, comparePrice: 899000n, stockQuantity: 70,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-SUIT-BLACK-50',  name: 'Bộ Vest Nam Đen Size 50',             slug: 'bo-vest-nam-den-size-50',       price: 2499000n,comparePrice: 2999000n,stockQuantity: 25,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-SWIM-BLUE-M',    name: 'Quần Bơi Nam Xanh Dương Size M',      slug: 'quan-boi-nam-xanh-duong-m',    price: 249000n, comparePrice: 329000n, stockQuantity: 150, lowStockThreshold: 15, isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-SPORT-SET-L',    name: 'Bộ Thể Thao Nam Polyester Size L',    slug: 'bo-the-thao-nam-polyester-l',  price: 599000n, comparePrice: 749000n, stockQuantity: 80,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-INNER-WHITE-L',  name: 'Áo Ba Lỗ Nam Trắng Size L',           slug: 'ao-ba-lo-nam-trang-l',         price: 99000n,  comparePrice: 139000n, stockQuantity: 400, lowStockThreshold: 30, isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-SOCK-PACK5',     name: 'Tất Vớ Nam Cổ Ngắn 5 Đôi',           slug: 'tat-vo-nam-co-ngan-5-doi',     price: 149000n, comparePrice: 199000n, stockQuantity: 500, lowStockThreshold: 50, isActive: true, isFeatured: false, categoryId: catAoNam.id },
      { sku: 'MENS-BELT-LEATHER-M', name: 'Thắt Lưng Da Nam Nâu Size M',         slug: 'that-lung-da-nam-nau-m',       price: 399000n, comparePrice: 549000n, stockQuantity: 80,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNam.id },

      // ── Áo & Quần Nữ (20) ───────────────────────────────────────────
      { sku: 'WOMS-DRESS-FLORAL-M',  name: 'Đầm Maxi Hoa Nhí Size M',              slug: 'dam-maxi-hoa-nhi-size-m',         price: 499000n,  comparePrice: 649000n,  stockQuantity: 80,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-DRESS-WRAP-S',    name: 'Đầm Wrap Kín Đáo Màu Đỏ Size S',      slug: 'dam-wrap-kin-dao-mau-do-s',       price: 549000n,  comparePrice: 699000n,  stockQuantity: 60,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-BLOUSE-WHITE-M',  name: 'Áo Blouse Nữ Trắng Babydoll Size M',   slug: 'ao-blouse-nu-trang-babydoll-m',   price: 299000n,  comparePrice: 399000n,  stockQuantity: 120, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-BLOUSE-PINK-S',   name: 'Áo Blouse Nữ Hồng Phấn Size S',        slug: 'ao-blouse-nu-hong-phan-s',        price: 299000n,  comparePrice: 389000n,  stockQuantity: 110, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-TSHIRT-WHITE-M',  name: 'Áo Thun Nữ Croptop Trắng Size M',      slug: 'ao-thun-nu-croptop-trang-m',      price: 199000n,  comparePrice: 259000n,  stockQuantity: 200, lowStockThreshold: 20, isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-TSHIRT-STRIPE-L', name: 'Áo Thun Nữ Kẻ Sọc Ngang Size L',       slug: 'ao-thun-nu-ke-soc-ngang-l',       price: 229000n,  comparePrice: 299000n,  stockQuantity: 180, lowStockThreshold: 20, isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-JEANS-BLUE-27',   name: 'Quần Jeans Nữ Ống Rộng Waist 27',      slug: 'quan-jeans-nu-ong-rong-27',       price: 629000n,  comparePrice: 829000n,  stockQuantity: 90,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-PANTS-SUIT-M',    name: 'Quần Âu Nữ Kẻ Caro Size M',            slug: 'quan-au-nu-ke-caro-m',            price: 549000n,  comparePrice: 699000n,  stockQuantity: 70,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-SKIRT-MINI-S',    name: 'Chân Váy Mini Xếp Ly Xanh Size S',     slug: 'chan-vay-mini-xep-ly-xanh-s',     price: 349000n,  comparePrice: 449000n,  stockQuantity: 100, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-SKIRT-MIDI-M',    name: 'Chân Váy Midi Hoa Nhí Size M',          slug: 'chan-vay-midi-hoa-nhi-m',         price: 429000n,  comparePrice: 549000n,  stockQuantity: 85,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-HOODIE-PINK-M',   name: 'Áo Hoodie Nữ Hồng Size M',              slug: 'ao-hoodie-nu-hong-m',             price: 499000n,  comparePrice: 649000n,  stockQuantity: 75,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-JACKET-DENIM-S',  name: 'Áo Khoác Denim Nữ Size S',              slug: 'ao-khoac-denim-nu-s',             price: 799000n,  comparePrice: 999000n,  stockQuantity: 50,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-JACKET-WIND-M',   name: 'Áo Khoác Gió Nữ Nhẹ Size M',           slug: 'ao-khoac-gio-nu-nhe-m',           price: 649000n,  comparePrice: 849000n,  stockQuantity: 65,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-SUIT-PINK-S',     name: 'Bộ Suit Nữ Hồng Phấn Size S',           slug: 'bo-suit-nu-hong-phan-s',          price: 1899000n, comparePrice: 2299000n, stockQuantity: 30,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-SWIM-BIKINI-M',   name: 'Bikini Nữ Hai Mảnh Màu Đen Size M',    slug: 'bikini-nu-hai-manh-mau-den-m',    price: 399000n,  comparePrice: 499000n,  stockQuantity: 80,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-SPORT-SET-M',     name: 'Bộ Tập Gym Nữ Co Giãn Size M',          slug: 'bo-tap-gym-nu-co-gian-m',         price: 549000n,  comparePrice: 699000n,  stockQuantity: 90,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-BRALETTE-M',      name: 'Áo Bralette Nữ Không Gọng Size M',      slug: 'ao-bralette-nu-khong-gong-m',     price: 229000n,  comparePrice: 299000n,  stockQuantity: 150, lowStockThreshold: 15, isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-SOCK-PACK5',      name: 'Tất Vớ Nữ Cổ Lửng 5 Đôi',              slug: 'tat-vo-nu-co-lung-5-doi',         price: 129000n,  comparePrice: 169000n,  stockQuantity: 400, lowStockThreshold: 30, isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-BAG-TOTE-BEIGE',  name: 'Túi Tote Nữ Da PU Màu Kem',             slug: 'tui-tote-nu-da-pu-mau-kem',       price: 699000n,  comparePrice: 899000n,  stockQuantity: 60,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catAoNu.id },
      { sku: 'WOMS-SCARF-SILK-BLUE', name: 'Khăn Lụa Nữ Họa Tiết Xanh',             slug: 'khan-lua-nu-hoa-tiet-xanh',       price: 349000n,  comparePrice: 449000n,  stockQuantity: 100, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catAoNu.id },

      // ── Gia Dụng (15) ────────────────────────────────────────────────
      { sku: 'HOME-AIRFRYER-5L',      name: 'Nồi Chiên Không Dầu 5L Philips',       slug: 'noi-chien-khong-dau-5l-philips',   price: 2490000n, comparePrice: 2990000n, stockQuantity: 40,  lowStockThreshold: 5, isActive: true, isFeatured: true,  categoryId: catGiaDung.id },
      { sku: 'HOME-BLENDER-600W',     name: 'Máy Xay Sinh Tố 600W Panasonic',       slug: 'may-xay-sinh-to-600w-panasonic',   price: 1290000n, comparePrice: 1590000n, stockQuantity: 60,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catGiaDung.id },
      { sku: 'HOME-RICECOOK-1L8',     name: 'Nồi Cơm Điện Tử 1.8L Tiger',          slug: 'noi-com-dien-tu-1-8l-tiger',       price: 2190000n, comparePrice: 2590000n, stockQuantity: 50,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catGiaDung.id },
      { sku: 'HOME-MICROWAVE-20L',    name: 'Lò Vi Sóng 20L Samsung',               slug: 'lo-vi-song-20l-samsung',           price: 1990000n, comparePrice: 2390000n, stockQuantity: 30,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catGiaDung.id },
      { sku: 'HOME-KETTLE-1L7',       name: 'Ấm Siêu Tốc 1.7L Philips',            slug: 'am-sieu-toc-1-7l-philips',         price: 499000n,  comparePrice: 649000n,  stockQuantity: 100, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catGiaDung.id },
      { sku: 'HOME-VACUUM-CORDED',    name: 'Máy Hút Bụi Có Dây Electrolux',        slug: 'may-hut-bui-co-day-electrolux',    price: 2990000n, comparePrice: 3490000n, stockQuantity: 20,  lowStockThreshold: 3, isActive: true, isFeatured: false, categoryId: catGiaDung.id },
      { sku: 'HOME-VACUUM-ROBOT',     name: 'Robot Hút Bụi Lau Nhà Xiaomi S10',     slug: 'robot-hut-bui-lau-nha-xiaomi-s10', price: 5490000n, comparePrice: 6990000n, stockQuantity: 15,  lowStockThreshold: 3, isActive: true, isFeatured: true,  categoryId: catGiaDung.id },
      { sku: 'HOME-FAN-STAND-45CM',   name: 'Quạt Đứng Panasonic 45cm',             slug: 'quat-dung-panasonic-45cm',         price: 1290000n, comparePrice: 1590000n, stockQuantity: 45,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catGiaDung.id },
      { sku: 'HOME-IRON-STEAM-2KW',   name: 'Bàn Là Hơi Nước Philips 2000W',        slug: 'ban-la-hoi-nuoc-philips-2000w',    price: 899000n,  comparePrice: 1190000n, stockQuantity: 55,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catGiaDung.id },
      { sku: 'HOME-TOWEL-SET-3PC',    name: 'Bộ Khăn Tắm Cotton 3 Chiếc',           slug: 'bo-khan-tam-cotton-3-chiec',       price: 399000n,  comparePrice: 499000n,  stockQuantity: 200, lowStockThreshold: 20, isActive: true, isFeatured: false, categoryId: catGiaDung.id },
      { sku: 'HOME-BEDSHEET-KING',    name: 'Bộ Ga Giường King Cotton Kẻ Sọc',      slug: 'bo-ga-giuong-king-cotton-ke-soc',  price: 1199000n, comparePrice: 1499000n, stockQuantity: 35,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catGiaDung.id },
      { sku: 'HOME-PILLOW-FOAM',      name: 'Gối Nằm Memory Foam Cao Cấp',           slug: 'goi-nam-memory-foam-cao-cap',      price: 799000n,  comparePrice: 999000n,  stockQuantity: 80,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catGiaDung.id },
      { sku: 'HOME-CURTAIN-GREY-2M',  name: 'Rèm Cửa Chống Nắng Xám 2m x 2m',      slug: 'rem-cua-chong-nang-xam-2mx2m',    price: 899000n,  comparePrice: 1190000n, stockQuantity: 40,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catGiaDung.id },
      { sku: 'HOME-RACK-KITCHEN-3T',  name: 'Kệ Bếp 3 Tầng Inox 304',              slug: 'ke-bep-3-tang-inox-304',           price: 1290000n, comparePrice: 1590000n, stockQuantity: 30,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catGiaDung.id },
      { sku: 'HOME-DUSTBIN-30L',      name: 'Thùng Rác Cảm Ứng 30L Có Nắp',        slug: 'thung-rac-cam-ung-30l-co-nap',     price: 699000n,  comparePrice: 899000n,  stockQuantity: 55,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catGiaDung.id },
    ],
  });

  console.log('Seeding done!');
  console.log('Admin: admin@ecom.dev / Admin@123456');
  console.log('User:  user@ecom.dev  / User@123456');
  console.log(`Categories: ${await prisma.category.count()} created`);
  console.log(`Products:   ${await prisma.product.count()} created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
