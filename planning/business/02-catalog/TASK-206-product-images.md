# TASK-206: Product Images (Domain Layer)

## 📋 Metadata

- **Task ID**: TASK-206
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Visual Experience)
- **Phụ thuộc**: TASK-203 (Products CRUD), TASK-223 engineering (File Upload Service)
- **Trạng thái**: ⏳ Not started

> 📜 Charter: [`./CHARTER.md`](./CHARTER.md) · 🗣️ Glossary: [`../../CONTEXT.md`](../../CONTEXT.md)
> 🛠️ Storage adapter + image pipeline: [`setup/04-cross-cutting/TASK-223`](../../setup/04-cross-cutting/TASK-223-file-upload.md)

---

## 🎯 Business Intent

Domain-level rules cho image gắn vào Product. **Hạ tầng upload/CDN** thuộc TASK-223 (engineering). Task này chỉ quan tâm:

- **Số lượng & thứ tự**: tối đa 10 image/Product, image đầu tiên là thumbnail.
- **Required cho publish**: Product không có image không được publish (TASK-203 AC-1).
- **Cleanup on delete**: xóa Product → enqueue cleanup job xóa file trên storage (orphan asset cleanup).

---

## 📄 Domain Specification

### Product ↔ ProductImage (1-N)

| Trường | Ràng buộc |
| :--- | :--- |
| `id` | UUID |
| `productId` | FK |
| `url` | URL public (trả về từ Storage adapter) |
| `position` | Integer, 0-9, unique within product |
| `altText` | Optional, SEO |
| `width`, `height` | Auto-fill từ pipeline TASK-223 |

### Endpoints

| Endpoint | Method | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `/admin/products/:id/images` | POST | ADMIN, STAFF | Upload 1+ image (multipart) — qua TASK-223 |
| `/admin/products/:id/images/:imageId` | DELETE | ADMIN, STAFF | Xóa 1 image |
| `/admin/products/:id/images/reorder` | POST | ADMIN, STAFF | Update `position` cho list image |

---

## ✅ Acceptance Criteria

**AC-1: Max 10 images/product**
- **Given** Product đã có 10 image
- **When** POST upload thêm 1 image
- **Then** `409 IMAGE_LIMIT_EXCEEDED`

**AC-2: File type validation**
- **Given** Upload `.zip` đặt extension `.jpg`
- **When** xử lý (qua TASK-223 magic-byte check)
- **Then** `415 UNSUPPORTED_MEDIA_TYPE`; Product không có image mới

**AC-3: Size limit**
- **Given** file > 5MB
- **When** upload
- **Then** `413 PAYLOAD_TOO_LARGE`

**AC-4: Position auto-assign**
- **Given** Product hiện có 3 image (position 0, 1, 2)
- **When** upload thêm 1 image không gửi `position`
- **Then** image mới có `position=3`; thumbnail (position 0) không đổi

**AC-5: Delete Product → enqueue asset cleanup**
- **Given** Product có 5 image
- **When** Admin DELETE Product (soft) HOẶC hard-delete
- **Then** event `product.assets.cleanup` được emit; 5 file được mark cleanup; job worker (TASK-223) xóa khỏi storage trong < 24h

**AC-6: First image là thumbnail**
- **Given** Product có 5 image
- **When** GET Product (public, list view)
- **Then** chỉ trả `thumbnail` = image có `position=0`; full gallery chỉ ở detail view

---

## 🚫 Out of Scope

- Upload mechanism (multipart parser, storage SDK, image processing) → TASK-223.
- Lazy load / responsive image srcset → FE concern.
- AI auto-tagging / background removal → backlog.
