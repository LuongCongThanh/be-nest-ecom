# TASK-204: Product Search & Filtering (Public Discovery)

## 📋 Metadata

- **Task ID**: TASK-204
- **Độ ưu tiên**: 🔵 TRUNG BÌNH (User Experience)
- **Phụ thuộc**: TASK-203 (Products CRUD)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../CONTEXT.md`](../../CONTEXT.md)

---

## 🎯 Business Intent

API public để storefront query Product theo nhiều tiêu chí. Mục tiêu < 500ms response cho search cơ bản trên 10K Product.

- **Phase 2 dùng PostgreSQL full-text** (tsvector + GIN index). Elasticsearch là Phase 3 (TASK-316).
- **Category filter include descendants**: search "Electronics" trả về cả Product trong "Phones", "Laptops" (sub-categories).
- **Faceted facets count**: cho mỗi filter group, trả về số lượng Product khớp — UI hiển thị `(123)` cạnh option.

---

## 📄 Endpoint

`GET /products`

### Query parameters

| Param | Type | Mô tả |
| :--- | :--- | :--- |
| `q` | string | Full-text trên `name + description + sku` |
| `categorySlug` | string | Filter theo slug (include descendants) |
| `minPrice`, `maxPrice` | number | Khoảng giá |
| `inStock` | boolean | Chỉ Product có `stockQuantity > 0` |
| `featured` | boolean | Chỉ `isFeatured=true` |
| `sort` | enum | `featured` (default), `priceAsc`, `priceDesc`, `newest`, `bestseller` |
| `page`, `limit` | int | Pagination (limit default 20, max 100) |

### Response shape

```json
{
  "data": [/* products */],
  "pagination": { "page": 1, "limit": 20, "total": 234, "totalPages": 12 },
  "facets": {
    "categories": [{"slug": "phones", "count": 45}],
    "priceRanges": [{"range": "0-1M", "count": 23}, ...],
    "inStock": { "true": 200, "false": 34 }
  }
}
```

### Ranking strategy (default `featured`)

1. `isFeatured=true` đầu
2. Bestseller (số OrderItem 30 ngày gần nhất — denormalized counter)
3. `createdAt DESC`

---

## ✅ Acceptance Criteria

**AC-1: Public chỉ thấy Product active + có stock OR `inStock=false`**
- **Given** 100 Product, 70 active có stock, 20 active out-of-stock, 10 inactive
- **When** GET `/products` (default)
- **Then** trả về 70 (active có stock). Với `?inStock=false` trả về 90. Inactive luôn ẩn.

**AC-2: Category filter include descendants**
- **Given** Cây `Electronics > Phones > Smartphones`, 30 Product gán Smartphones
- **When** GET `/products?categorySlug=electronics`
- **Then** 30 Product Smartphones xuất hiện trong kết quả

**AC-3: Price range invalid không crash**
- **Given** `minPrice=200`, `maxPrice=100` (đảo ngược)
- **When** GET
- **Then** không trả `500`; trả `data: []` với `pagination.total=0`, không throw error

**AC-4: SQL injection bị chặn**
- **Given** `q = "'; DROP TABLE products; --"`
- **When** GET
- **Then** không có lỗi DB; trả về `data: []` hoặc Product có name khớp literal string

**AC-5: Pagination limit cap**
- **Given** `limit=10000`
- **When** GET
- **Then** response `limit=100` (server-side cap), không trả về 10K rows

**AC-6: Facets phản ánh dataset đã filter**
- **Given** 100 Product, filter `categorySlug=phones` → còn 30 match
- **When** GET
- **Then** `facets.priceRanges` phản ánh 30 phones (không phải 100 toàn bộ)

---

## 🚫 Out of Scope

- Elasticsearch / advanced relevance scoring → Phase 3 TASK-316.
- Recommendation / "Similar products" → Phase 3 TASK-305, 328.
- Search analytics (zero-result tracking) → Phase 3 TASK-329.
- Multi-language search → Phase 3 TASK-325.
