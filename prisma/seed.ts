import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Delete old data (order matters due to FK constraints)
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
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

  // Create 3 demo addresses for admin
  await prisma.address.createMany({
    data: [
      {
        userId: admin.id,
        label: 'Home',
        recipientName: 'Admin User',
        phone: '0901234567',
        street: '123 Main Street',
        district: 'District 1',
        city: 'Ho Chi Minh City',
        isDefault: true,
      },
      {
        userId: admin.id,
        label: 'Office',
        recipientName: 'Admin User',
        phone: '0901234567',
        street: '456 Central Avenue',
        district: 'District 1',
        city: 'Ho Chi Minh City',
        isDefault: false,
      },
      {
        userId: admin.id,
        label: 'Other',
        recipientName: 'Admin User',
        phone: '0901234567',
        street: '789 Park Boulevard',
        district: 'District 5',
        city: 'Ho Chi Minh City',
        isDefault: false,
      },
    ],
  });

  // Create demo regular user
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
  // image is intentionally null — the IStorageAdapter pipeline (resize + webp) only
  // runs through POST /categories/:id/image, raw URLs are never accepted (see CONTEXT.md).
  console.log('Seeding categories...');

  const catElectronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and technology products',
      image: null,
      parentId: null,
      isActive: true,
      sortOrder: 1,
    },
  });
  const catFashion = await prisma.category.create({
    data: {
      name: 'Fashion',
      slug: 'fashion',
      description: 'Clothing and fashion accessories',
      image: null,
      parentId: null,
      isActive: true,
      sortOrder: 2,
    },
  });
  const catHomeAppliances = await prisma.category.create({
    data: {
      name: 'Home Appliances',
      slug: 'home-appliances',
      description: 'Household appliances and home goods',
      image: null,
      parentId: null,
      isActive: true,
      sortOrder: 3,
    },
  });

  // Level-2 sub-categories
  const catPhones = await prisma.category.create({
    data: {
      name: 'Phones',
      slug: 'phones',
      description: 'Smartphones and mobile phones',
      image: null,
      parentId: catElectronics.id,
      isActive: true,
      sortOrder: 1,
    },
  });
  const catLaptops = await prisma.category.create({
    data: {
      name: 'Laptops & Tablets',
      slug: 'laptops-tablets',
      description: 'Laptops, tablets, and computing devices',
      image: null,
      parentId: catElectronics.id,
      isActive: true,
      sortOrder: 2,
    },
  });
  const catMensClothing = await prisma.category.create({
    data: {
      name: "Men's Clothing",
      slug: 'mens-clothing',
      description: 'Clothing and accessories for men',
      image: null,
      parentId: catFashion.id,
      isActive: true,
      sortOrder: 1,
    },
  });
  const catWomensClothing = await prisma.category.create({
    data: {
      name: "Women's Clothing",
      slug: 'womens-clothing',
      description: 'Clothing and accessories for women',
      image: null,
      parentId: catFashion.id,
      isActive: true,
      sortOrder: 2,
    },
  });

  // ─── Products ─────────────────────────────────────────────────────────────
  console.log('Seeding products...');

  await prisma.product.createMany({
    data: [
      {
        sku: 'PHONE-IPHONE15-128',
        name: 'iPhone 15 128GB',
        slug: 'iphone-15-128gb',
        description: 'The latest iPhone 15 featuring the A16 Bionic chip and a 48MP camera.',
        price: BigInt(22_990_000),
        comparePrice: BigInt(24_990_000),
        stockQuantity: 50,
        lowStockThreshold: 5,
        isActive: true,
        isFeatured: true,
        categoryId: catPhones.id,
      },
      {
        sku: 'PHONE-SAMSUNG-S24',
        name: 'Samsung Galaxy S24 256GB',
        slug: 'samsung-galaxy-s24-256gb',
        description: 'Galaxy S24 with built-in AI features and a Dynamic AMOLED 2X display.',
        price: BigInt(19_990_000),
        comparePrice: BigInt(21_990_000),
        stockQuantity: 30,
        lowStockThreshold: 5,
        isActive: true,
        isFeatured: true,
        categoryId: catPhones.id,
      },
      {
        sku: 'LAPTOP-MACBOOK-AIR-M2',
        name: 'MacBook Air M2 8GB/256GB',
        slug: 'macbook-air-m2-8gb-256gb',
        description: 'MacBook Air with the M2 chip, ultra-thin design, and up to 18-hour battery life.',
        price: BigInt(28_990_000),
        comparePrice: BigInt(32_990_000),
        stockQuantity: 20,
        lowStockThreshold: 3,
        isActive: true,
        isFeatured: true,
        categoryId: catLaptops.id,
      },
      {
        sku: 'SHIRT-POLO-NAVY-M',
        name: "Men's Basic Navy Polo Shirt Size M",
        slug: 'mens-basic-navy-polo-shirt-m',
        description: '100% cotton polo shirt in a regular fit, lightweight and breathable.',
        price: BigInt(299_000),
        comparePrice: BigInt(399_000),
        stockQuantity: 200,
        lowStockThreshold: 20,
        isActive: true,
        isFeatured: false,
        categoryId: catMensClothing.id,
      },
      {
        sku: 'DRESS-FLORAL-RED-S',
        name: "Women's Red Floral Maxi Dress Size S",
        slug: 'womens-red-floral-maxi-dress-s',
        description: 'Flowing maxi dress with a delicate floral print in soft chiffon fabric.',
        price: BigInt(459_000),
        comparePrice: BigInt(590_000),
        stockQuantity: 80,
        lowStockThreshold: 10,
        isActive: true,
        isFeatured: false,
        categoryId: catWomensClothing.id,
      },
      {
        sku: 'PHONE-OPPO-A78-128',
        name: 'OPPO A78 128GB',
        slug: 'oppo-a78-128gb',
        description: 'OPPO A78 with a 5000mAh battery and 67W fast charging support.',
        price: BigInt(6_990_000),
        stockQuantity: 0,
        lowStockThreshold: 5,
        isActive: true,
        isFeatured: false,
        categoryId: catPhones.id,
      },
      {
        sku: 'GADGET-INACTIVE-001',
        name: 'Temporarily Unavailable Product',
        slug: 'temporarily-unavailable-product',
        description: 'This product is currently being updated and will be available soon.',
        price: BigInt(999_000),
        stockQuantity: 10,
        isActive: false,
        isFeatured: false,
        categoryId: catHomeAppliances.id,
      },
    ],
  });

  // ─── 100 extra products ───────────────────────────────────────────────────
  console.log('Seeding 100 extra products...');

  await prisma.product.createMany({
    data: [
      // ── Phones (25) ────────────────────────────────────────────────────
      { sku: 'PHONE-IP15PM-256',    name: 'iPhone 15 Pro Max 256GB',              slug: 'iphone-15-pro-max-256gb',               price: 34990000n, comparePrice: 37990000n, stockQuantity: 40,  lowStockThreshold: 5, isActive: true, isFeatured: true,  categoryId: catPhones.id },
      { sku: 'PHONE-IP15PM-512',    name: 'iPhone 15 Pro Max 512GB',              slug: 'iphone-15-pro-max-512gb',               price: 39990000n, comparePrice: 43990000n, stockQuantity: 20,  lowStockThreshold: 5, isActive: true, isFeatured: true,  categoryId: catPhones.id },
      { sku: 'PHONE-IP14-128',      name: 'iPhone 14 128GB',                      slug: 'iphone-14-128gb',                       price: 18990000n, comparePrice: 22990000n, stockQuantity: 60,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-IP13-128',      name: 'iPhone 13 128GB',                      slug: 'iphone-13-128gb',                       price: 14490000n, comparePrice: 17990000n, stockQuantity: 80,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-IPSE2-64',      name: 'iPhone SE 2022 64GB',                  slug: 'iphone-se-2022-64gb',                   price: 10990000n, comparePrice: 12990000n, stockQuantity: 35,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-SS-S24U-256',   name: 'Samsung Galaxy S24 Ultra 256GB',       slug: 'samsung-galaxy-s24-ultra-256gb',        price: 31990000n, comparePrice: 34990000n, stockQuantity: 25,  lowStockThreshold: 5, isActive: true, isFeatured: true,  categoryId: catPhones.id },
      { sku: 'PHONE-SS-S23-128',    name: 'Samsung Galaxy S23 128GB',             slug: 'samsung-galaxy-s23-128gb',              price: 15990000n, comparePrice: 19990000n, stockQuantity: 45,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-SS-A55-128',    name: 'Samsung Galaxy A55 128GB',             slug: 'samsung-galaxy-a55-128gb',              price: 8990000n,  comparePrice: 10490000n, stockQuantity: 70,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-SS-A35-128',    name: 'Samsung Galaxy A35 128GB',             slug: 'samsung-galaxy-a35-128gb',              price: 6490000n,  comparePrice: 7490000n,  stockQuantity: 90,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-SS-A15-128',    name: 'Samsung Galaxy A15 128GB',             slug: 'samsung-galaxy-a15-128gb',              price: 3990000n,  comparePrice: 4490000n,  stockQuantity: 120, lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-XMI-14-256',    name: 'Xiaomi 14 256GB',                      slug: 'xiaomi-14-256gb',                       price: 17990000n, comparePrice: 19990000n, stockQuantity: 30,  lowStockThreshold: 5, isActive: true, isFeatured: true,  categoryId: catPhones.id },
      { sku: 'PHONE-XMI-13T-256',   name: 'Xiaomi 13T 256GB',                     slug: 'xiaomi-13t-256gb',                      price: 11990000n, comparePrice: 13990000n, stockQuantity: 55,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-XMI-RN12-128',  name: 'Xiaomi Redmi Note 12 128GB',           slug: 'xiaomi-redmi-note-12-128gb',            price: 4990000n,  comparePrice: 5990000n,  stockQuantity: 150, lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-XMI-RN13-256',  name: 'Xiaomi Redmi Note 13 Pro 256GB',       slug: 'xiaomi-redmi-note-13-pro-256gb',        price: 7490000n,  comparePrice: 8990000n,  stockQuantity: 85,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-OPP-RN11-128',  name: 'OPPO Reno 11 128GB',                   slug: 'oppo-reno-11-128gb',                    price: 8490000n,  comparePrice: 9990000n,  stockQuantity: 65,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-OPP-F25-256',   name: 'OPPO F25 Pro 256GB',                   slug: 'oppo-f25-pro-256gb',                    price: 7990000n,  comparePrice: 9490000n,  stockQuantity: 40,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-VIV-V30-256',   name: 'Vivo V30 256GB',                       slug: 'vivo-v30-256gb',                        price: 8990000n,  comparePrice: 10490000n, stockQuantity: 50,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-VIV-Y36-128',   name: 'Vivo Y36 128GB',                       slug: 'vivo-y36-128gb',                        price: 4490000n,  comparePrice: 5490000n,  stockQuantity: 100, lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-REA-GT6-256',   name: 'Realme GT 6 256GB',                    slug: 'realme-gt-6-256gb',                     price: 9990000n,  comparePrice: 11990000n, stockQuantity: 35,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-NOK-G42-128',   name: 'Nokia G42 128GB',                      slug: 'nokia-g42-128gb',                       price: 3490000n,  comparePrice: 4190000n,  stockQuantity: 45,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-PIX-8A-128',    name: 'Google Pixel 8a 128GB',                slug: 'google-pixel-8a-128gb',                 price: 13990000n, comparePrice: 15990000n, stockQuantity: 20,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-HUA-P60-256',   name: 'Huawei P60 Pro 256GB',                 slug: 'huawei-p60-pro-256gb',                  price: 19990000n, comparePrice: 22990000n, stockQuantity: 15,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-SON-XZ5-128',   name: 'Sony Xperia 5 V 128GB',               slug: 'sony-xperia-5-v-128gb',                 price: 16990000n, comparePrice: 19990000n, stockQuantity: 12,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-ASUS-ZF10-256', name: 'ASUS Zenfone 10 256GB',               slug: 'asus-zenfone-10-256gb',                 price: 14990000n, comparePrice: 17490000n, stockQuantity: 18,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },
      { sku: 'PHONE-MOTO-G54-256',  name: 'Motorola Moto G54 256GB',             slug: 'motorola-moto-g54-256gb',               price: 3990000n,  comparePrice: 4990000n,  stockQuantity: 60,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catPhones.id },

      // ── Laptops & Tablets (20) ──────────────────────────────────────────
      { sku: 'LAP-MBPRO-M3-14',    name: 'MacBook Pro M3 14-inch 8GB/512GB',     slug: 'macbook-pro-m3-14-8gb-512gb',           price: 44990000n, comparePrice: 48990000n, stockQuantity: 15,  lowStockThreshold: 3, isActive: true, isFeatured: true,  categoryId: catLaptops.id },
      { sku: 'LAP-MBAIR-M3-13',    name: 'MacBook Air M3 13-inch 8GB/256GB',     slug: 'macbook-air-m3-13-8gb-256gb',           price: 30990000n, comparePrice: 33990000n, stockQuantity: 20,  lowStockThreshold: 3, isActive: true, isFeatured: true,  categoryId: catLaptops.id },
      { sku: 'LAP-DELL-XPS13-512', name: 'Dell XPS 13 i7 16GB/512GB',            slug: 'dell-xps-13-i7-16gb-512gb',             price: 35990000n, comparePrice: 39990000n, stockQuantity: 10,  lowStockThreshold: 3, isActive: true, isFeatured: true,  categoryId: catLaptops.id },
      { sku: 'LAP-DELL-INS15-256', name: 'Dell Inspiron 15 i5 8GB/256GB',        slug: 'dell-inspiron-15-i5-8gb-256gb',         price: 16990000n, comparePrice: 19490000n, stockQuantity: 30,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catLaptops.id },
      { sku: 'LAP-HP-ENV14-512',   name: 'HP Envy 14 i7 16GB/512GB',             slug: 'hp-envy-14-i7-16gb-512gb',              price: 28990000n, comparePrice: 31990000n, stockQuantity: 12,  lowStockThreshold: 3, isActive: true, isFeatured: false, categoryId: catLaptops.id },
      { sku: 'LAP-HP-PAV15-256',   name: 'HP Pavilion 15 i5 8GB/256GB',          slug: 'hp-pavilion-15-i5-8gb-256gb',           price: 14990000n, comparePrice: 17490000n, stockQuantity: 35,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catLaptops.id },
      { sku: 'LAP-ASUS-ZB14-512',  name: 'ASUS ZenBook 14 OLED i7 16GB',         slug: 'asus-zenbook-14-oled-i7-16gb',          price: 24990000n, comparePrice: 27990000n, stockQuantity: 18,  lowStockThreshold: 3, isActive: true, isFeatured: true,  categoryId: catLaptops.id },
      { sku: 'LAP-ASUS-VB16-512',  name: 'ASUS VivoBook 16 i5 8GB/512GB',        slug: 'asus-vivobook-16-i5-8gb-512gb',         price: 15990000n, comparePrice: 17990000n, stockQuantity: 40,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catLaptops.id },
      { sku: 'LAP-ASUS-ROG-RTX',   name: 'ASUS ROG Strix G16 RTX 4070',          slug: 'asus-rog-strix-g16-rtx-4070',           price: 42990000n, comparePrice: 46990000n, stockQuantity: 8,   lowStockThreshold: 2, isActive: true, isFeatured: true,  categoryId: catLaptops.id },
      { sku: 'LAP-LEN-T14-512',    name: 'Lenovo ThinkPad T14 i7 16GB',           slug: 'lenovo-thinkpad-t14-i7-16gb',           price: 27990000n, comparePrice: 31990000n, stockQuantity: 15,  lowStockThreshold: 3, isActive: true, isFeatured: false, categoryId: catLaptops.id },
      { sku: 'LAP-LEN-LOQ15-512',  name: 'Lenovo LOQ 15 RTX 4060',               slug: 'lenovo-loq-15-rtx-4060',                price: 27490000n, comparePrice: 30990000n, stockQuantity: 20,  lowStockThreshold: 3, isActive: true, isFeatured: false, categoryId: catLaptops.id },
      { sku: 'LAP-MSI-MOD15-1TB',  name: 'MSI Modern 15 i7 32GB/1TB',            slug: 'msi-modern-15-i7-32gb-1tb',             price: 22990000n, comparePrice: 25990000n, stockQuantity: 10,  lowStockThreshold: 3, isActive: true, isFeatured: false, categoryId: catLaptops.id },
      { sku: 'TAB-IPAD-AIR6-256',  name: 'iPad Air 6 M2 256GB Wi-Fi',            slug: 'ipad-air-6-m2-256gb-wifi',              price: 18990000n, comparePrice: 20990000n, stockQuantity: 25,  lowStockThreshold: 5, isActive: true, isFeatured: true,  categoryId: catLaptops.id },
      { sku: 'TAB-IPAD-P13-256',   name: 'iPad Pro 13 M4 256GB Wi-Fi',           slug: 'ipad-pro-13-m4-256gb-wifi',             price: 33990000n, comparePrice: 36990000n, stockQuantity: 12,  lowStockThreshold: 3, isActive: true, isFeatured: true,  categoryId: catLaptops.id },
      { sku: 'TAB-SS-TAB9-256',    name: 'Samsung Galaxy Tab S9 256GB',           slug: 'samsung-galaxy-tab-s9-256gb',           price: 18490000n, comparePrice: 21490000n, stockQuantity: 20,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catLaptops.id },
      { sku: 'TAB-SS-TABA9P-128',  name: 'Samsung Galaxy Tab A9 Plus 128GB',     slug: 'samsung-galaxy-tab-a9-plus-128gb',      price: 7490000n,  comparePrice: 8990000n,  stockQuantity: 40,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catLaptops.id },
      { sku: 'TAB-XMI-PAD6-256',   name: 'Xiaomi Pad 6 256GB',                   slug: 'xiaomi-pad-6-256gb',                    price: 8990000n,  comparePrice: 10490000n, stockQuantity: 30,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catLaptops.id },
      { sku: 'LAP-ACR-A514-512',   name: 'Acer Aspire 5 i5 8GB/512GB',           slug: 'acer-aspire-5-i5-8gb-512gb',            price: 13990000n, comparePrice: 15990000n, stockQuantity: 30,  lowStockThreshold: 5, isActive: true, isFeatured: false, categoryId: catLaptops.id },
      { sku: 'LAP-ACR-NIT5-RTX',   name: 'Acer Nitro 5 RTX 4060',                slug: 'acer-nitro-5-rtx-4060',                 price: 24490000n, comparePrice: 27490000n, stockQuantity: 15,  lowStockThreshold: 3, isActive: true, isFeatured: false, categoryId: catLaptops.id },
      { sku: 'LAP-LGR-14Z90-512',  name: 'LG Gram 14 i7 16GB/512GB',             slug: 'lg-gram-14-i7-16gb-512gb',              price: 31990000n, comparePrice: 34990000n, stockQuantity: 8,   lowStockThreshold: 2, isActive: true, isFeatured: false, categoryId: catLaptops.id },

      // ── Men's Clothing (20) ─────────────────────────────────────────────
      { sku: 'MENS-TSHIRT-WHITE-M', name: "Men's Basic White T-Shirt Size M",      slug: 'mens-basic-white-tshirt-m',             price: 199000n,  comparePrice: 259000n,  stockQuantity: 300, lowStockThreshold: 20, isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-TSHIRT-BLACK-L', name: "Men's Basic Black T-Shirt Size L",      slug: 'mens-basic-black-tshirt-l',             price: 199000n,  comparePrice: 259000n,  stockQuantity: 280, lowStockThreshold: 20, isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-TSHIRT-GREY-XL', name: "Men's Oversize Grey T-Shirt Size XL",   slug: 'mens-oversize-grey-tshirt-xl',          price: 249000n,  comparePrice: 329000n,  stockQuantity: 200, lowStockThreshold: 20, isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-POLO-BLUE-M',    name: "Men's Navy Polo Shirt Size M",           slug: 'mens-navy-polo-shirt-m',                price: 349000n,  comparePrice: 449000n,  stockQuantity: 150, lowStockThreshold: 15, isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-POLO-WHITE-L',   name: "Men's White Polo Shirt Size L",          slug: 'mens-white-polo-shirt-l',               price: 349000n,  comparePrice: 449000n,  stockQuantity: 140, lowStockThreshold: 15, isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-SHIRT-STRIPE-M', name: "Men's Striped Dress Shirt Size M",       slug: 'mens-striped-dress-shirt-m',            price: 429000n,  comparePrice: 559000n,  stockQuantity: 120, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-SHIRT-WHITE-L',  name: "Men's White Slim Fit Dress Shirt Size L",slug: 'mens-white-slim-fit-shirt-l',           price: 399000n,  comparePrice: 519000n,  stockQuantity: 130, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-JEANS-BLUE-32',  name: "Men's Light Wash Jeans Waist 32",        slug: 'mens-light-wash-jeans-w32',             price: 599000n,  comparePrice: 799000n,  stockQuantity: 100, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-JEANS-DARK-34',  name: "Men's Dark Wash Jeans Waist 34",         slug: 'mens-dark-wash-jeans-w34',              price: 629000n,  comparePrice: 829000n,  stockQuantity: 90,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-CHINO-BEIGE-32', name: "Men's Beige Chino Pants Waist 32",       slug: 'mens-beige-chino-pants-w32',            price: 499000n,  comparePrice: 649000n,  stockQuantity: 110, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-SHORT-GREY-M',   name: "Men's Dark Grey Shorts Size M",          slug: 'mens-dark-grey-shorts-m',               price: 299000n,  comparePrice: 399000n,  stockQuantity: 200, lowStockThreshold: 20, isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-HOODIE-BLACK-L', name: "Men's Black Hoodie Size L",              slug: 'mens-black-hoodie-l',                   price: 549000n,  comparePrice: 699000n,  stockQuantity: 90,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-JACKET-NAVY-M',  name: "Men's Navy Jacket Size M",               slug: 'mens-navy-jacket-m',                    price: 799000n,  comparePrice: 999000n,  stockQuantity: 60,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-JACKET-WIND-L',  name: "Men's Lightweight Windbreaker Size L",   slug: 'mens-lightweight-windbreaker-l',        price: 699000n,  comparePrice: 899000n,  stockQuantity: 70,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-SUIT-BLACK-50',  name: "Men's Black Suit Set Size 50",           slug: 'mens-black-suit-set-50',                price: 2499000n, comparePrice: 2999000n, stockQuantity: 25,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-SWIM-BLUE-M',    name: "Men's Blue Swim Shorts Size M",          slug: 'mens-blue-swim-shorts-m',               price: 249000n,  comparePrice: 329000n,  stockQuantity: 150, lowStockThreshold: 15, isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-SPORT-SET-L',    name: "Men's Polyester Sports Set Size L",      slug: 'mens-polyester-sports-set-l',           price: 599000n,  comparePrice: 749000n,  stockQuantity: 80,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-INNER-WHITE-L',  name: "Men's White Tank Top Size L",            slug: 'mens-white-tank-top-l',                 price: 99000n,   comparePrice: 139000n,  stockQuantity: 400, lowStockThreshold: 30, isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-SOCK-PACK5',     name: "Men's Low-Cut Ankle Socks 5 Pairs",      slug: 'mens-low-cut-ankle-socks-5-pairs',      price: 149000n,  comparePrice: 199000n,  stockQuantity: 500, lowStockThreshold: 50, isActive: true, isFeatured: false, categoryId: catMensClothing.id },
      { sku: 'MENS-BELT-LEATHER-M', name: "Men's Brown Leather Belt Size M",        slug: 'mens-brown-leather-belt-m',             price: 399000n,  comparePrice: 549000n,  stockQuantity: 80,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catMensClothing.id },

      // ── Women's Clothing (20) ───────────────────────────────────────────
      { sku: 'WOMS-DRESS-FLORAL-M',  name: "Women's Floral Maxi Dress Size M",          slug: 'womens-floral-maxi-dress-m',            price: 499000n,  comparePrice: 649000n,  stockQuantity: 80,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-DRESS-WRAP-S',    name: "Women's Red Wrap Dress Size S",             slug: 'womens-red-wrap-dress-s',               price: 549000n,  comparePrice: 699000n,  stockQuantity: 60,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-BLOUSE-WHITE-M',  name: "Women's White Babydoll Blouse Size M",      slug: 'womens-white-babydoll-blouse-m',        price: 299000n,  comparePrice: 399000n,  stockQuantity: 120, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-BLOUSE-PINK-S',   name: "Women's Blush Pink Blouse Size S",          slug: 'womens-blush-pink-blouse-s',            price: 299000n,  comparePrice: 389000n,  stockQuantity: 110, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-TSHIRT-WHITE-M',  name: "Women's White Crop Top Size M",             slug: 'womens-white-crop-top-m',               price: 199000n,  comparePrice: 259000n,  stockQuantity: 200, lowStockThreshold: 20, isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-TSHIRT-STRIPE-L', name: "Women's Horizontal Stripe T-Shirt Size L",  slug: 'womens-horizontal-stripe-tshirt-l',     price: 229000n,  comparePrice: 299000n,  stockQuantity: 180, lowStockThreshold: 20, isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-JEANS-BLUE-27',   name: "Women's Wide-Leg Blue Jeans Waist 27",      slug: 'womens-wide-leg-blue-jeans-w27',        price: 629000n,  comparePrice: 829000n,  stockQuantity: 90,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-PANTS-SUIT-M',    name: "Women's Plaid Dress Pants Size M",          slug: 'womens-plaid-dress-pants-m',            price: 549000n,  comparePrice: 699000n,  stockQuantity: 70,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-SKIRT-MINI-S',    name: "Women's Blue Pleated Mini Skirt Size S",    slug: 'womens-blue-pleated-mini-skirt-s',      price: 349000n,  comparePrice: 449000n,  stockQuantity: 100, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-SKIRT-MIDI-M',    name: "Women's Floral Midi Skirt Size M",          slug: 'womens-floral-midi-skirt-m',            price: 429000n,  comparePrice: 549000n,  stockQuantity: 85,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-HOODIE-PINK-M',   name: "Women's Pink Hoodie Size M",                slug: 'womens-pink-hoodie-m',                  price: 499000n,  comparePrice: 649000n,  stockQuantity: 75,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-JACKET-DENIM-S',  name: "Women's Denim Jacket Size S",               slug: 'womens-denim-jacket-s',                 price: 799000n,  comparePrice: 999000n,  stockQuantity: 50,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-JACKET-WIND-M',   name: "Women's Lightweight Windbreaker Size M",    slug: 'womens-lightweight-windbreaker-m',      price: 649000n,  comparePrice: 849000n,  stockQuantity: 65,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-SUIT-PINK-S',     name: "Women's Blush Pink Suit Set Size S",        slug: 'womens-blush-pink-suit-set-s',          price: 1899000n, comparePrice: 2299000n, stockQuantity: 30,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-SWIM-BIKINI-M',   name: "Women's Black Bikini Set Size M",           slug: 'womens-black-bikini-set-m',             price: 399000n,  comparePrice: 499000n,  stockQuantity: 80,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-SPORT-SET-M',     name: "Women's Stretch Gym Set Size M",            slug: 'womens-stretch-gym-set-m',              price: 549000n,  comparePrice: 699000n,  stockQuantity: 90,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-BRALETTE-M',      name: "Women's Wire-Free Bralette Size M",         slug: 'womens-wire-free-bralette-m',           price: 229000n,  comparePrice: 299000n,  stockQuantity: 150, lowStockThreshold: 15, isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-SOCK-PACK5',      name: "Women's Mid-Cut Socks 5 Pairs",             slug: 'womens-mid-cut-socks-5-pairs',          price: 129000n,  comparePrice: 169000n,  stockQuantity: 400, lowStockThreshold: 30, isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-BAG-TOTE-BEIGE',  name: "Women's Beige PU Leather Tote Bag",         slug: 'womens-beige-pu-leather-tote-bag',      price: 699000n,  comparePrice: 899000n,  stockQuantity: 60,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catWomensClothing.id },
      { sku: 'WOMS-SCARF-SILK-BLUE', name: "Women's Blue Patterned Silk Scarf",         slug: 'womens-blue-patterned-silk-scarf',      price: 349000n,  comparePrice: 449000n,  stockQuantity: 100, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catWomensClothing.id },

      // ── Home Appliances (15) ────────────────────────────────────────────
      { sku: 'HOME-AIRFRYER-5L',     name: 'Philips 5L Air Fryer',                      slug: 'philips-5l-air-fryer',                  price: 2490000n, comparePrice: 2990000n, stockQuantity: 40,  lowStockThreshold: 5,  isActive: true, isFeatured: true,  categoryId: catHomeAppliances.id },
      { sku: 'HOME-BLENDER-600W',    name: 'Panasonic 600W Blender',                    slug: 'panasonic-600w-blender',                price: 1290000n, comparePrice: 1590000n, stockQuantity: 60,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catHomeAppliances.id },
      { sku: 'HOME-RICECOOK-1L8',    name: 'Tiger 1.8L Electric Rice Cooker',           slug: 'tiger-1-8l-electric-rice-cooker',       price: 2190000n, comparePrice: 2590000n, stockQuantity: 50,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catHomeAppliances.id },
      { sku: 'HOME-MICROWAVE-20L',   name: 'Samsung 20L Microwave Oven',                slug: 'samsung-20l-microwave-oven',            price: 1990000n, comparePrice: 2390000n, stockQuantity: 30,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catHomeAppliances.id },
      { sku: 'HOME-KETTLE-1L7',      name: 'Philips 1.7L Electric Kettle',              slug: 'philips-1-7l-electric-kettle',          price: 499000n,  comparePrice: 649000n,  stockQuantity: 100, lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catHomeAppliances.id },
      { sku: 'HOME-VACUUM-CORDED',   name: 'Electrolux Corded Vacuum Cleaner',          slug: 'electrolux-corded-vacuum-cleaner',      price: 2990000n, comparePrice: 3490000n, stockQuantity: 20,  lowStockThreshold: 3,  isActive: true, isFeatured: false, categoryId: catHomeAppliances.id },
      { sku: 'HOME-VACUUM-ROBOT',    name: 'Xiaomi S10 Robot Vacuum and Mop',           slug: 'xiaomi-s10-robot-vacuum-mop',           price: 5490000n, comparePrice: 6990000n, stockQuantity: 15,  lowStockThreshold: 3,  isActive: true, isFeatured: true,  categoryId: catHomeAppliances.id },
      { sku: 'HOME-FAN-STAND-45CM',  name: 'Panasonic 45cm Standing Fan',               slug: 'panasonic-45cm-standing-fan',           price: 1290000n, comparePrice: 1590000n, stockQuantity: 45,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catHomeAppliances.id },
      { sku: 'HOME-IRON-STEAM-2KW',  name: 'Philips 2000W Steam Iron',                  slug: 'philips-2000w-steam-iron',              price: 899000n,  comparePrice: 1190000n, stockQuantity: 55,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catHomeAppliances.id },
      { sku: 'HOME-TOWEL-SET-3PC',   name: '3-Piece Cotton Bath Towel Set',             slug: '3-piece-cotton-bath-towel-set',         price: 399000n,  comparePrice: 499000n,  stockQuantity: 200, lowStockThreshold: 20, isActive: true, isFeatured: false, categoryId: catHomeAppliances.id },
      { sku: 'HOME-BEDSHEET-KING',   name: 'King Size Striped Cotton Bed Sheet Set',    slug: 'king-size-striped-cotton-bed-sheet-set',price: 1199000n, comparePrice: 1499000n, stockQuantity: 35,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catHomeAppliances.id },
      { sku: 'HOME-PILLOW-FOAM',     name: 'Premium Memory Foam Pillow',                slug: 'premium-memory-foam-pillow',            price: 799000n,  comparePrice: 999000n,  stockQuantity: 80,  lowStockThreshold: 10, isActive: true, isFeatured: false, categoryId: catHomeAppliances.id },
      { sku: 'HOME-CURTAIN-GREY-2M', name: 'Grey Blackout Curtain 2m x 2m',            slug: 'grey-blackout-curtain-2m-x-2m',        price: 899000n,  comparePrice: 1190000n, stockQuantity: 40,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catHomeAppliances.id },
      { sku: 'HOME-RACK-KITCHEN-3T', name: '3-Tier Stainless Steel Kitchen Rack',       slug: '3-tier-stainless-steel-kitchen-rack',   price: 1290000n, comparePrice: 1590000n, stockQuantity: 30,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catHomeAppliances.id },
      { sku: 'HOME-DUSTBIN-30L',     name: '30L Touchless Sensor Trash Can with Lid',  slug: '30l-touchless-sensor-trash-can',        price: 699000n,  comparePrice: 899000n,  stockQuantity: 55,  lowStockThreshold: 5,  isActive: true, isFeatured: false, categoryId: catHomeAppliances.id },
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
