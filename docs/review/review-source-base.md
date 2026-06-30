# Architecture Review — NestJS E-Commerce Backend

> **Reviewer**: Backend Architect Agent  
> **Ngày review**: 2026-06-30  
> **Project**: `be-nest-ecom`  
> **Đánh giá tổng thể**: **B+ / Nền tảng tốt — cần fix 6 issues trước production**

---

## 1. Tổng quan kiến trúc

| Tiêu chí | Hiện trạng |
|----------|-----------|
| **Pattern** | Modular Monolith — phân tách domain rõ ràng |
| **Communication** | REST API + JWT stateless + refresh token rotation |
| **Data Pattern** | Relational (PostgreSQL via Prisma) + soft delete + audit trail |
| **Deployment** | Container-ready (NestJS + Prisma) |
| **Auth** | JWT access token + refresh token với family-based revocation |

### Điểm mạnh hiện tại

- Cấu trúc module rõ ràng: `identity`, `product`, `category`, `media` tách biệt tốt
- Auth security vững: token rotation, replay attack detection, bcrypt cost 12, timing-attack mitigation
- Transaction pattern đúng cho các thao tác multi-step
- Soft delete nhất quán với `deletedAt` trên toàn bộ entities
- DTO validation đầy đủ, response structure thống nhất
- Config management qua Joi validation + environment variables
- Image processing pipeline với multiple size variants

---

## 2. Đánh giá từng Module

### Identity Module (`src/modules/identity/`)
**Chức năng**: Authentication, authorization, user management, token lifecycle

| Hạng mục | Đánh giá |
|----------|----------|
| Token rotation với family-based revocation | ✅ Tốt |
| Refresh token lưu hash (SHA256), không lưu raw | ✅ Tốt — thực hành bảo mật quan trọng |
| Replay attack detection qua consumed token tracking | ✅ Tốt |
| Timing-attack mitigation với dummy password hash | ✅ Tốt |
| Password change invalidates tất cả sessions | ✅ Tốt |
| Rate limiting trên auth endpoints | ❌ Thiếu |

---

### Product Module (`src/modules/product/`)
**Chức năng**: Product catalog CRUD, inventory management, image handling

| Hạng mục | Đánh giá |
|----------|----------|
| Price validation (comparePrice >= price) | ✅ Tốt |
| Pagination với offset/limit (max 100) | ✅ Tốt |
| SKU/slug uniqueness enforcement | ✅ Tốt |
| Image position tracking | ❌ Bug — cả THUMB và MEDIUM cùng position |
| Stock concurrency control | ❌ Thiếu — không có atomic decrement |
| Metadata field JSON validation | ⚠️ Thiếu schema validation |

---

### Category Module (`src/modules/category/`)
**Chức năng**: Hierarchical category tree management

| Hạng mục | Đánh giá |
|----------|----------|
| Circular reference detection | ✅ Tốt |
| Depth constraint (MAX_DEPTH = 5) | ✅ Tốt |
| Cascading delete với tree rebuild | ✅ Tốt |
| `getDepth()` và `getSubtreeHeight()` queries | ❌ N+1 query — query DB mỗi level |
| Image URL extraction | ⚠️ Fragile — silent null return khi fail |

---

### Media Module (`src/modules/media/`)
**Chức năng**: Presigned URL generation cho direct-to-storage uploads

| Hạng mục | Đánh giá |
|----------|----------|
| Adapter pattern cho S3/R2 | ✅ Tốt |
| Presigned URL với 5 phút expiry | ✅ Tốt |
| File type validation qua MIME | ✅ Tốt |
| Max file size validation | ❌ Thiếu |
| Folder param sanitization | ❌ Thiếu — path traversal risk |

---

### Common Layers
| Hạng mục | Đánh giá |
|----------|----------|
| JWT Guard + Role-based access control | ✅ Tốt |
| Exception filter với Prisma error mapping | ✅ Tốt |
| `@CurrentUser`, `@Public`, `@Roles` decorators | ✅ Tốt |
| R2Adapter với S3Client signature v4 | ✅ Tốt |
| Redis service | ⚠️ Configured nhưng chưa được dùng ở đâu |
| CORS configuration | ❌ Thiếu dù có `CORS_ORIGINS` trong `.env.example` |
| Rate limiting | ❌ Thiếu hoàn toàn |
| Structured logging / Request ID | ❌ Thiếu |

---

## 3. Critical Issues 🔴

> Phải fix trước khi đưa lên production.

---

### Issue 1 — Bug image position bị trùng

**File**: `src/modules/product/product-image.service.ts:46`

**Vấn đề**:
```typescript
// Bug: cả 2 size đều được gán cùng nextPosition
position: img.size === 'MEDIUM' ? nextPosition : nextPosition,
```

**Rủi ro**: Sort ảnh vỡ, hiển thị sai thứ tự, data integrity bị hỏng.

**Fix đề xuất**:
```typescript
// Chỉ MEDIUM mới dùng nextPosition, THUMB dùng giá trị riêng
position: img.size === 'MEDIUM' ? nextPosition : -1,
```

**Effort**: 30 phút

---

### Issue 2 — Không có atomic stock decrement

**File**: `src/modules/product/product.service.ts` (thiếu method)

**Vấn đề**: Không có endpoint giảm `stockQuantity` với transaction. Hai order đồng thời có thể over-sell vì không có concurrency control.

**Rủi ro**: Tồn kho âm, overbooking, thất thoát doanh thu.

**Fix đề xuất**:
```typescript
async reserveStock(productId: string, quantity: number): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
    });
    if ((product.stockQuantity - quantity) < 0) {
      throw new BadRequestException('Insufficient stock');
    }
    await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: { decrement: quantity } },
    });
  });
}
```

**Effort**: 3 giờ

---

### Issue 3 — N+1 query trong Category tree

**File**: `src/modules/category/category.service.ts:307-331`

**Vấn đề**: `getDepth()` và `getSubtreeHeight()` query DB một lần mỗi level trong hierarchy:
```typescript
// Hiện tại: N queries cho 1 category depth-5
while (currentId) {
  const cat = await this.prisma.category.findUnique({ where: { id } }); // 1 DB call/level
  depth++;
}
```

**Rủi ro**: API timeout với hierarchy sâu, DB overload, UX chậm.

**Fix đề xuất** — dùng Postgres recursive CTE:
```typescript
private async getDepth(categoryId: string): Promise<number> {
  const result = await this.prisma.$queryRaw<[{ depth: number }]>`
    WITH RECURSIVE tree AS (
      SELECT id, "parentId", 1 as depth
      FROM categories WHERE id = ${categoryId}
      UNION ALL
      SELECT c.id, c."parentId", t.depth + 1
      FROM categories c
      JOIN tree t ON c.id = t."parentId"
    )
    SELECT MAX(depth) as depth FROM tree;
  `;
  return result[0]?.depth ?? 0;
}
```

**Effort**: 2 giờ

---

### Issue 4 — Guard ordering có thể bị bypass

**File**: `src/app.module.ts:50`

**Vấn đề**: `RolesGuard` chạy sau `JwtAuthGuard` nhưng không check `user === null`. Nếu JWT fail và route không có `@Roles()`, `RolesGuard` vẫn pass vì `!requiredRoles === true`.

**Rủi ro**: Unauthenticated request có thể vượt qua role check.

**Fix đề xuất**:
```typescript
// roles.guard.ts
canActivate(context: ExecutionContext): boolean {
  const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
  if (!requiredRoles || requiredRoles.length === 0) return true;

  const { user } = context.switchToHttp().getRequest();
  if (!user) throw new UnauthorizedException('Authentication required'); // Thêm dòng này

  if (!requiredRoles.includes(user.role)) throw new ForbiddenException('Insufficient permissions');
  return true;
}
```

**Effort**: 30 phút

---

### Issue 5 — Không có Rate Limiting

**File**: Global (missing)

**Vấn đề**: Không có throttle middleware trên bất kỳ endpoint nào, kể cả auth endpoints như `/auth/login`, `/auth/register`.

**Rủi ro**: Brute force attack, credential stuffing, resource exhaustion.

**Fix đề xuất**:
```bash
npm install @nestjs/throttler
```
```typescript
// app.module.ts
ThrottlerModule.forRoot([{
  ttl: 60000,   // 1 phút
  limit: 10,    // tối đa 10 requests
}]),
providers: [
  { provide: APP_GUARD, useClass: ThrottlerGuard },
  // ... các guard hiện có
]
```

**Effort**: 1 giờ

---

### Issue 6 — Path traversal trong presigned URL

**File**: `src/common/file-upload/file-upload.service.ts`

**Vấn đề**: Tham số `folder` từ user được dùng trực tiếp khi tạo S3 key:
```typescript
// Không an toàn: folder chưa được validate
const key = `${folder}/${randomUUID()}.${ext}`;
```

**Rủi ro**: Attacker truyền `../../admin-files/` để ghi đè file hệ thống.

**Fix đề xuất**:
```typescript
const ALLOWED_FOLDERS = ['products', 'categories', 'avatars'] as const;
type AllowedFolder = typeof ALLOWED_FOLDERS[number];

async createPresignedUrl(folder: string, contentType: string, expiresIn = 300) {
  const sanitized = folder.replace(/[^a-z0-9-]/g, '');
  if (!ALLOWED_FOLDERS.includes(sanitized as AllowedFolder)) {
    throw new BadRequestException(`Invalid folder. Allowed: ${ALLOWED_FOLDERS.join(', ')}`);
  }
  const key = `${sanitized}/${randomUUID()}.${ext}`;
  // ...
}
```

**Effort**: 30 phút

---

## 4. Important Improvements 🟡

> Nên làm trong vòng 2 tuần.

| # | Vấn đề | File | Fix | Effort |
|---|--------|------|-----|--------|
| 1 | Health check chỉ check DB, thiếu Redis + Storage | `health.controller.ts` | Thêm `checkRedis()`, `checkStorage()` | 1h |
| 2 | Redis configured nhưng không được dùng | `redis.service.ts` | Implement token blacklist cache | 1h |
| 3 | Thiếu CORS config dù có `CORS_ORIGINS` trong env | `main.ts` | Thêm `app.enableCors({ origin: ... })` | 30m |
| 4 | Không có request ID / structured logging | Global | Thêm Winston + request ID middleware | 2h |
| 5 | Image processing thiếu error handling | `image-processing.service.ts` | Wrap Sharp operations trong try/catch | 1h |
| 6 | Missing Swagger `@ApiResponse` examples | Tất cả controllers | Thêm response decorators vào DTOs | 2h |
| 7 | Không validate pending migrations trước khi start | `main.ts` | Thêm migration check trong bootstrap | 30m |

---

## 5. Nice-to-Have 🟢

> Backlog cho các sprint sau.

- **Cursor-based pagination** — offset/limit không scale tốt với dataset lớn (> 100k records)
- **Category tree caching** — cache trong Redis với TTL để giảm DB load
- **Prometheus metrics** — export metrics cho monitoring dashboard
- **`X-Request-ID` headers** — distributed tracing across services
- **Bulk product operations** — create/update nhiều products cùng lúc
- **Full-text search** — Elasticsearch hoặc Postgres `tsvector` cho product search
- **Webhook system** — notify external systems khi order/payment events xảy ra
- **Audit log table** — track ai thay đổi gì, khi nào

---

## 6. Action Plan

### Phase 1 — Security Hardening *(ưu tiên ngay, ~4 giờ)*

```
[ ] Fix image position bug           — 30m  (Issue 1)
[ ] Add @nestjs/throttler            — 1h   (Issue 5)
[ ] Fix RolesGuard null check        — 30m  (Issue 4)
[ ] Sanitize presigned URL folder    — 30m  (Issue 6)
[ ] Enable CORS từ env config        — 30m  (Improvement 3)
```

### Phase 2 — Data Integrity *(tuần 1-2, ~6 giờ)*

```
[ ] Atomic stock reservation         — 3h   (Issue 2)
[ ] Refactor N+1 → recursive CTE     — 2h   (Issue 3)
[ ] Extend health checks             — 1h   (Improvement 1)
```

### Phase 3 — Observability *(tuần 2, ~4 giờ)*

```
[ ] Winston logger + request ID      — 2h   (Improvement 4)
[ ] Redis token blacklist cache      — 1h   (Improvement 2)
[ ] Image processing error handling  — 1h   (Improvement 5)
```

### Phase 4 — Polish *(sprint tiếp theo)*

```
[ ] Swagger response examples        — 2h
[ ] Category tree Redis cache        — 2h
[ ] Cursor-based pagination          — 3h
[ ] Prometheus metrics               — 2h
```

---

## 7. Tổng kết

| Hạng mục | Số lượng |
|----------|---------|
| 🔴 Critical — phải fix trước production | 6 issues |
| 🟡 Important — nên làm trong 2 tuần | 7 issues |
| 🟢 Nice-to-have — backlog | 8 items |
| ✅ Đã làm tốt, duy trì | 8 areas |

**Tổng effort ước tính để production-ready**: ~10 giờ (Phase 1 + Phase 2)

---

> File này được tạo tự động bởi **Backend Architect Agent** — `2026-06-30`  
> Để re-review sau khi fix: *"Dùng agent Backend Architect để review lại kiến trúc sau khi fix Phase 1"*
