# TASK-204: Product Search & Filtering (Public Discovery)

## 📋 Metadata

- **Task ID**: TASK-204
- **Độ ưu tiên**: 🔵 TRUNG BÌNH (User Experience)
- **Phụ thuộc**: TASK-203 (Products CRUD)
- **Trạng thái**: ✅ Done

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../docs/CONTEXT.md`](../../docs/CONTEXT.md)

---

## 🎯 Business Intent

API public để storefront query Product theo nhiều tiêu chí. Mục tiêu < 500ms response cho search cơ bản trên 10K Product.

- **MVP bắt đầu bằng filter + text search đơn giản**. Khi đã chạm nhu cầu rõ ràng về relevance/không dấu/performance, nâng lên PostgreSQL full-text (`tsvector` + GIN + `unaccent`). Elasticsearch để sau (TASK-316).
- **Category filter include descendants**: search "Electronics" trả về cả Product trong "Phones", "Laptops" (sub-categories).
- **Faceted facets count**: cho mỗi filter group, trả về số lượng Product khớp — UI hiển thị `(123)` cạnh option.

---

## 📄 Endpoint

`GET /products`

### Query parameters

| Param                  | Type    | Mô tả                                                                 |
| :--------------------- | :------ | :-------------------------------------------------------------------- |
| `search`               | string  | Field tên thật là `search` (không phải `q`). Postgres full-text search trên `name` (weight A) + `description` (B) + `sku` (C). Diacritic-insensitive (`unaccent`), OR-match giữa các từ (khớp thiếu 1 từ vẫn ra kết quả), rank theo `ts_rank` — khớp càng nhiều từ càng lên đầu. |
| `categorySlug`         | string  | Filter theo slug (include descendants)                                |
| `minPrice`, `maxPrice` | number  | Khoảng giá                                                            |
| `inStock`              | boolean | Chỉ Product có `stockQuantity > 0`                                    |
| `isFeatured`           | boolean | Field tên thật là `isFeatured` (không phải `featured`). Chỉ `isFeatured=true` |
| `sort`                 | enum    | `priceAsc`, `priceDesc`, `newest`, `bestseller`, `featured`. Mặc định: `relevance` khi có `search` mà không truyền `sort`; `featured` khi không search. Truyền `sort` tường minh luôn thắng. |
| `page`, `limit`        | int     | Pagination (limit default 20, max 100)                                |

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

### Ranking strategy

**Khi có `search` (mặc định, chưa truyền `sort`)**: rank theo `ts_rank` (độ khớp full-text) — sản phẩm khớp nhiều từ tìm kiếm hơn lên đầu. Truyền `sort` tường minh sẽ override, dùng đúng nghĩa `sort` đó (giá, mới nhất...) thay vì relevance.

**Khi không có `search` (mặc định `featured`)**:
1. `isFeatured=true` đầu
2. `createdAt DESC`

`bestseller` hiện tại **fallback về `newest`** — chưa có denormalized counter đơn hàng thật, đây là việc để làm sau (không thuộc phạm vi TASK-204/nâng cấp full-text search này).

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

- Elasticsearch / advanced relevance scoring → giai đoạn scale sau, TASK-316.
- Recommendation / "Similar products" → giai đoạn scale sau, TASK-305, 328.
- Search analytics (zero-result tracking) → giai đoạn scale sau, TASK-329.
- Multi-language search → giai đoạn scale sau, TASK-325.
