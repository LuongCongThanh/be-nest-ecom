# 🗣️ CONTEXT.md — Ngôn ngữ Thống nhất (Ubiquitous Language)

> Glossary domain cho dự án **E-commerce API**. Mọi tài liệu phase/task **phải** dùng đúng thuật ngữ tại đây.
> File này **chỉ chứa định nghĩa thuật ngữ** — không chứa quyết định kỹ thuật (đặt ở `engineering/`) và không chứa quy trình (đặt ở phase docs).

---

## 🎭 Identity Context

| Thuật ngữ | Định nghĩa | KHÔNG dùng để chỉ |
| :--- | :--- | :--- |
| **User** | Mọi cá thể có thể đăng nhập hệ thống (khách hàng, nhân viên, quản trị viên). | Đừng dùng "Account" hoặc "Customer" thay thế. |
| **Role** | Vai trò của User — enum cố định: `USER`, `STAFF`, `ADMIN`. | Không phải "permission" hay "scope". |
| **Session** | Một chuỗi đăng nhập của User, đại diện bởi 1 cặp (accessToken, refreshToken) cùng `familyId`. | Không phải "JWT" — JWT chỉ là cách hiện thực Session. |
| **Refresh Token Family** | Tập hợp các refresh token kế tiếp sinh ra từ một lần login (qua rotation). Bị compromise → kill cả family. | Không phải "refresh token" lẻ. |
| **Account Verification** | Quá trình xác nhận email/SĐT thuộc về User thật. Output: `emailVerified = true`. | Không nhầm với "Authentication" (đăng nhập). |
| **Password Recovery** | Luồng reset mật khẩu khi User quên (cần email + token một lần). | Không nhầm với "Change Password" (User đang đăng nhập, biết current). |
| **Soft Delete** | Đánh dấu `deletedAt`, không xóa row vật lý. Truy vấn mặc định lọc `deletedAt IS NULL`. | Không phải "deactivate" — deactivate là set `isActive=false`. |

---

## 📚 Catalog Context

| Thuật ngữ | Định nghĩa | KHÔNG dùng để chỉ |
| :--- | :--- | :--- |
| **Category** | Nhóm phân loại sản phẩm, hỗ trợ tree tự tham chiếu (parent/child). | Không phải "Tag" — Tag là phẳng, Category là cây. |
| **Slug** | Chuỗi URL-friendly sinh từ `name` (e.g. `dien-thoai`), duy nhất trong Category & Product. | Không phải "ID" — slug có thể đổi, ID thì không. |
| **Product** | Đơn vị bán được (SKU level). Mỗi Product có duy nhất 1 SKU và 1 slug. | Không phải "SKU" — SKU là mã, Product là entity. |
| **SKU** (Stock Keeping Unit) | Mã định danh thương mại của Product (e.g. `IPHONE-15-PRO-BLK`), duy nhất toàn hệ thống. | Không phải `productId` — `productId` là UUID nội bộ. |
| **Stock Quantity** | Số lượng tồn kho hiện tại của 1 Product. Trừ khi Order chuyển `PAID`. | Không phải "available" — available có thể trừ thêm số đã reserve trong Cart (Phase 3). |
| **Price** | Giá bán hiện tại (Decimal 12,2, VND), luôn > 0. | Khác `priceSnapshot` (giá tại thời điểm mua) và `comparePrice` (giá niêm yết để hiển thị giảm giá). |
| **Compare Price** | Giá niêm yết / giá gốc, dùng để hiển thị `% giảm`. Phải ≥ `price`. | Không phải "MSRP" trong context Việt Nam. |
| **Variant** | Biến thể của Product (size, màu) — Phase 2 TASK-218. | Phase 1/2 chưa có; metadata JSONB là tạm. |

---

## 🛒 Commerce Context

| Thuật ngữ | Định nghĩa | KHÔNG dùng để chỉ |
| :--- | :--- | :--- |
| **Cart** | Trạng thái mua sắm bền vững của 1 User (hoặc Guest qua sessionId — Phase 2). 1 User active tại một thời điểm có ≤ 1 Cart. | Không phải "Wishlist" (Phase 2 TASK-220). |
| **CartItem** | Một dòng trong Cart: `productId + quantity + priceAtAdded`. | Không phải `OrderItem` — Cart mutable, Order immutable. |
| **Price At Added** | Giá Product tại thời điểm thêm vào Cart. Dùng để **thông báo thay đổi giá** trước checkout. | Không phải `priceSnapshot` (sống ở OrderItem, immutable sau checkout). |
| **Cart Merge** | Khi Guest login, các CartItem của Guest được gộp vào Cart của User (cùng productId → cộng quantity). | Không phải "replace" — không ghi đè. |
| **Abandoned Cart** | Cart có `lastActivity` cũ hơn ngưỡng (mặc định 7 ngày). Dùng cho marketing remind. | Không phải "expired" — Cart không tự xóa, chỉ flag. |
| **Order** | Tài liệu pháp lý của 1 giao dịch. **Immutable** sau khi tạo (mọi field "động" đều phải snapshot). | Không phải Cart đã checkout — Order độc lập, không tham chiếu Cart. |
| **Order Number** | Mã hiển thị của Order (e.g. `ORD-2026-000123`). Unique, dùng cho support & tra cứu. | Không phải `Order.id` (UUID nội bộ). |
| **Order Status** | State machine: `PENDING → PAID → SHIPPING → DELIVERED` (+ `CANCELLED`, `REFUNDED`). Transition phải tuân theo state diagram. | Không free-form text. Xem TASK-111. |
| **OrderItem** | Một dòng đã chốt trong Order. Chứa `productSnapshot` (JSONB) — KHÔNG join lại Product để render. | Không phải CartItem — OrderItem có snapshot, CartItem không. |
| **Snapshot** (Address / Product / Price) | Bản sao "đông cứng" tại thời điểm tạo Order. Thay đổi nguồn KHÔNG ảnh hưởng snapshot. | Không phải reference — snapshot là JSON inline, không phải FK. |
| **Checkout** | Quy trình chuyển Cart → Order: validate stock + tạo snapshots + trừ kho + xóa Cart, atomic. | Không phải "submit cart" — checkout có side-effect trừ kho. |
| **Order Lifecycle Event** | Event domain phát ra mỗi khi Order chuyển state (`order.paid`, `order.shipped`…). Dùng cho notification, audit, analytics. | Không phải HTTP webhook — đây là event nội bộ. Phase 2 TASK-222. |

### Order State Machine

```
            ┌──────────┐
   create ─→│ PENDING  │
            └────┬─────┘
                 │ pay
                 ▼
            ┌──────────┐    ship   ┌───────────┐  deliver  ┌────────────┐
            │   PAID   │──────────→│ SHIPPING  │──────────→│ DELIVERED  │
            └────┬─────┘           └─────┬─────┘           └────────────┘
                 │                       │
                 │ cancel (refund)       │ cancel (refund)
                 ▼                       ▼
            ┌──────────┐           ┌──────────┐
            │CANCELLED │           │ REFUNDED │
            └──────────┘           └──────────┘
```

**Bất biến**:
- Không quay ngược state (không có `DELIVERED → SHIPPING`).
- Mỗi transition là một event (TASK-222) và phải atomic với side-effect (trừ kho, hoàn tiền…).

---

## 🔗 Cross-context relationships

- **User → Cart**: 1-1 (active). Khi User soft-deleted → CASCADE Cart.
- **User → Order**: 1-N. Khi User soft-deleted → Order vẫn tồn tại (snapshot bảo toàn `customerEmailSnapshot`).
- **Category → Product**: 1-N. Khi Category xóa → Product `categoryId = NULL` (SET NULL — TASK-106).
- **Product → OrderItem**: 1-N. Xóa Product khi có OrderItem → **RESTRICT** (TASK-106).

---

## 📏 Quy tắc thêm thuật ngữ mới

1. Bất kỳ thuật ngữ nào xuất hiện ở **≥ 2 tài liệu** đều phải vào đây.
2. Phải có cột "**KHÔNG dùng để chỉ**" để chống lẫn lộn với thuật ngữ gần nghĩa.
3. Khi đổi tên thuật ngữ: cập nhật file này **trước**, sau đó refactor các tài liệu khác.
4. Khi thêm bounded context mới, tạo section riêng — KHÔNG trộn lẫn.
