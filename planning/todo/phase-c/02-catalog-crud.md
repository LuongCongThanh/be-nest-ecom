# Task C-02 — Categories & Products CRUD

**Phase**: C — Core MVP  
**Ước lượng**: 5 giờ  
**Phụ thuộc**: Task C-01  
**Spec gốc**: [03-categories-crud.md](../../business/02-catalog/03-categories-crud.md)

---

## Nhiệm vụ

Implement đầy đủ CRUD cho Categories và Products, bao gồm: category tree, text search, stock management, product variants.

> Phase C dùng text search `contains + insensitive` qua Prisma. Nếu sau này cần full-text search thật sự của PostgreSQL, đó là một task Phase D/E riêng.

---

## Các bước thực hiện

### 1. Tạo CatalogModule

```bash
mkdir -p src/modules/catalog/controllers
mkdir -p src/modules/catalog/services
mkdir -p src/modules/catalog/dto
```

### 2. Category DTOs

Tạo `src/modules/catalog/dto/create-category.dto.ts`:

```typescript
import { IsString, IsOptional, IsUUID, IsInt, Min, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
```

### 3. CategoriesService

Tạo `src/modules/catalog/services/categories.service.ts`:

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { slugify } from '../../../shared/utils';
import { CreateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const slug = slugify(dto.name);
    const exists = await this.prisma.category.findUnique({ where: { slug } });
    if (exists) {
      throw new ConflictException({ code: 'CATEGORY_SLUG_EXISTS', message: 'Category slug already exists' });
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, deletedAt: null, isActive: true },
      });
      if (!parent) {
        throw new NotFoundException({ code: 'CATEGORY_PARENT_NOT_FOUND', message: 'Parent category not found' });
      }
    }

    return this.prisma.category.create({
      data: { ...dto, slug },
    });
  }

  async findTree() {
    // Lấy tất cả categories, build tree trong memory
    const all = await this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const map = new Map(all.map(c => [c.id, { ...c, children: [] as any[] }]));
    const roots: any[] = [];

    for (const cat of map.values()) {
      if (cat.parentId) {
        map.get(cat.parentId)?.children.push(cat);
      } else {
        roots.push(cat);
      }
    }

    return roots;
  }

  async findAll() {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async update(id: string, dto: Partial<CreateCategoryDto>) {
    const category = await this.prisma.category.findFirst({ where: { id, deletedAt: null } });
    if (!category) throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found' });

    const data: any = { ...dto };
    if (dto.parentId === id) {
      throw new ConflictException({ code: 'CATEGORY_PARENT_INVALID', message: 'Category cannot be its own parent' });
    }
    if (dto.name) {
      data.slug = slugify(dto.name);
      const slugExists = await this.prisma.category.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (slugExists) {
        throw new ConflictException({ code: 'CATEGORY_SLUG_EXISTS', message: 'Category slug already exists' });
      }
    }

    return this.prisma.category.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    const hasChildren = await this.prisma.category.count({
      where: { parentId: id, deletedAt: null },
    });
    if (hasChildren > 0) {
      throw new ConflictException({
        code: 'CATEGORY_HAS_CHILDREN',
        message: 'Cannot delete category with active child categories',
      });
    }

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

### 4. Product DTOs

Tạo `src/modules/catalog/dto/create-product.dto.ts`:

```typescript
import { IsString, IsNumberString, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  // Client gửi string hoặc number → server parse sang BigInt (đơn vị đồng VND)
  @Transform(({ value }) => BigInt(value))
  @IsNumberString()
  basePrice: bigint;

  @IsOptional()
  @Transform(({ value }) => BigInt(value))
  @IsNumberString()
  comparePrice?: bigint;

  @Transform(({ value }) => Number(value))
  stock: number;
}
```

Tạo `src/modules/catalog/dto/query-products.dto.ts`:

```typescript
import { IsOptional, IsString, IsNumber, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
```

### 5. ProductsService

Tạo `src/modules/catalog/services/products.service.ts`:

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { slugify } from '../../../shared/utils';
import { CreateProductDto } from '../dto/create-product.dto';
import { QueryProductsDto } from '../dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const slug = slugify(dto.name);
    const exists = await this.prisma.product.findUnique({ where: { slug } });
    if (exists) throw new ConflictException({ code: 'PRODUCT_SLUG_EXISTS', message: 'Product slug already exists' });

    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, deletedAt: null, isActive: true },
      });
      if (!category) {
        throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
      }
    }

    return this.prisma.product.create({ data: { ...dto, slug } });
  }

  async findAll(query: QueryProductsDto) {
    const { search, categoryId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null, isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { category: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, variants: true, images: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!product) throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
    return product;
  }

  async update(id: string, dto: Partial<CreateProductDto>) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.name) {
      data.slug = slugify(dto.name);
      const slugExists = await this.prisma.product.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (slugExists) {
        throw new ConflictException({ code: 'PRODUCT_SLUG_EXISTS', message: 'Product slug already exists' });
      }
    }
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, deletedAt: null, isActive: true },
      });
      if (!category) {
        throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
      }
    }
    return this.prisma.product.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    // Kiểm tra có OrderItem không — nếu có thì RESTRICT
    const orderItemCount = await this.prisma.orderItem.count({
      where: { productId: id },
    });
    if (orderItemCount > 0) {
      throw new ConflictException({
        code: 'PRODUCT_HAS_ORDER_HISTORY',
        message: 'Cannot delete product with order history',
      });
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async adjustStock(id: string, delta: number) {
    return this.prisma.product.update({
      where: { id },
      data: { stock: { increment: delta } },
    });
  }
}
```

### 6. Controllers

Tạo `src/modules/catalog/controllers/categories.controller.ts` và `products.controller.ts` với đầy đủ CRUD endpoints. Admin/staff required cho write operations, public cho read.

Ví dụ categories controller:

```typescript
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Public()
  @Get()
  findAll() { return this.service.findAll(); }

  @Public()
  @Get('tree')
  findTree() { return this.service.findTree(); }

  @Roles(Role.ADMIN, Role.STAFF)
  @Post()
  create(@Body() dto: CreateCategoryDto) { return this.service.create(dto); }

  @Roles(Role.ADMIN, Role.STAFF)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CreateCategoryDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.service.softDelete(id); }
}
```

---

## Verify hoàn thành

```http
### Tạo category (admin)
POST http://localhost:3000/api/v1/categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{ "name": "Điện Thoại", "description": "Điện thoại di động" }

### Xem category tree (public)
GET http://localhost:3000/api/v1/categories/tree

### Tạo product (admin)
POST http://localhost:3000/api/v1/products
Authorization: Bearer <admin_token>
Content-Type: application/json

{ "name": "iPhone 15 Pro", "basePrice": "29990000", "stock": 100 }
// basePrice gửi dưới dạng string — server parse sang BigInt. Response trả về string.

### Tìm kiếm product (public)
GET http://localhost:3000/api/v1/products?search=iphone&page=1&limit=10
```

---

## Xong thì làm gì?

→ [03-cart.md](./03-cart.md)
