# 🗣️ CONTEXT.md — Ngôn ngữ Thống nhất (Ubiquitous Language)

> Glossary domain cho dự án **E-commerce API**. Mọi tài liệu phase/task **phải** dùng đúng thuật ngữ tại đây.
> File chứa **glossary domain + 28 design decisions đã lock**. Quy ước code chi tiết: [`../setup/CONVENTIONS.md`](../setup/CONVENTIONS.md). Cấu trúc thư mục: [`../setup/PROJECT_STRUCTURE.md`](../setup/PROJECT_STRUCTURE.md).

---

## 📤 File Upload (Images)

| Aspect | Quy chuẩn |
|--------|-----------|
| **Max size** | 5MB per file. Reject 413 nếu vượt. |
| **MIME whitelist** | `image/jpeg`, `image/png`, `image/webp`. Verify bằng **magic bytes** (lib `file-type`), không tin `Content-Type` từ client. |
| **Resize** | Sync trong request qua **`sharp`** (libvips, không block event loop). Generate **3 size**: `thumb` 200px, `medium` 800px, `original` (cap 2000px). |
| **Output format** | **Luôn `.webp`** dù input gì. Compress 30% tốt hơn JPEG, browser support 96%. |
| **Storage path** | `/products/{productId}/{uuid}_{size}.webp`. UUID phần → không guessable. Entity-scoped → delete Product = cleanup folder. |
| **Storage adapter** | Interface `IStorageAdapter`. Impl: `LocalDiskAdapter` (dev), `S3Adapter` (prod). Code không bind provider. |

⚠️ **CẤM**: nhận filename gốc từ client làm path (collision + diacritic break + path traversal). UUID-only.

---

## ✉️ Email Service

| Env | Provider | Mục đích |
|-----|----------|----------|
| **Dev local** | **Mailtrap inbox** (free 100/month) | Bắt email vào fake inbox, không gửi thật. Test template + flow. |
| **Staging/preview** | **Mailtrap relay** hoặc Resend test mode | Gửi thật tới whitelist email dev team. |
| **Production** | **Resend** (3000/month free) | Migrate sang SendGrid nếu vượt limit. |

- **Adapter pattern bắt buộc**: interface `IEmailSender { send(opts): Promise<{messageId}> }`. Implement `MailtrapSender`, `ResendSender`. `EmailModule` chọn impl theo `EMAIL_PROVIDER` env. Code service phụ thuộc interface, không phụ thuộc provider cụ thể.
- **Template MVP**: HTML string trong code (3–5 templates đầu). Upgrade MJML khi vượt 10 templates hoặc cần Outlook compat tốt.

---

## 🏪 System Assumption — Single Shop

Hệ thống là **1 cửa hàng duy nhất** (single-tenant, single-seller). KHÔNG phải marketplace.

- **Product không có `sellerId`** — mọi Product thuộc về shop.
- **Role `USER/STAFF/ADMIN`** — không có role `SELLER/VENDOR`.
- **Order chỉ có 1 phía** — payout = tiền vào tài khoản shop, không cần commission/split.

Hệ quả: code đơn giản hơn marketplace 2x. Migrate sang marketplace sau qua thêm `sellerId nullable` — không destructive.

---

## 🎭 Identity Context

| Thuật ngữ | Định nghĩa | KHÔNG dùng để chỉ |
| :--- | :--- | :--- |
| **User** | Mọi cá thể có thể đăng nhập hệ thống (khách hàng, nhân viên, quản trị viên). | Đừng dùng "Account" hoặc "Customer" thay thế. |
| **Role** | Vai trò của User — enum cố định: `USER`, `STAFF`, `ADMIN`. Guest (chưa đăng nhập) **không phải** một Role — guest được track qua `guestSessionId` cookie, không có row trong bảng `users`. | Không phải "permission" hay "scope". Không thêm `GUEST` vào Role enum — Guest không có account trong hệ thống. |
| **Session** | Một chuỗi đăng nhập của User, đại diện bởi 1 cặp (accessToken, refreshToken) cùng `familyId`. | Không phải "JWT" — JWT chỉ là cách hiện thực Session. |
| **Access Token TTL** | **30 phút**. JWT signed HS256/RS256. Lưu phía client (memory hoặc keychain mobile). | KHÔNG dùng > 1h (leak window dài). KHÔNG < 5 phút (UX flaky network). |
| **Refresh Token TTL** | **7 ngày** — không rolling. Lưu DB hash + client. Hết hạn → user phải login lại. | KHÔNG "remember me toggle" — VN e-commerce default always-on. KHÔNG > 90 ngày. |
| **Token Transport** | Cả access + refresh dùng header `Authorization: Bearer <token>`. Mobile-friendly, API-first. | KHÔNG cookie cho access (XSS argument không apply mạnh ở API-first; mobile native không có cookie). |
| **Refresh Token Family** | Tập hợp các refresh token kế tiếp sinh ra từ một lần login (qua rotation). Bị compromise → kill cả family. Triggers (MVP scope): **T1** reuse revoked token (sau window 5s) → kill family; **T2** change password → revoke all families của user; **T3** logout-all-devices → revoke all families; **T6** logout đơn → revoke chỉ family hiện tại. T4 (admin reset) + T5 (geo anomaly) hoãn sang giai đoạn scale sau. | Không phải "refresh token" lẻ. |
| **5s Tolerance Window** | Khi cùng refresh token được dùng trong vòng 5 giây sau khi đã rotate → coi là **retry hợp lệ** (mobile flaky network), KHÔNG kill family. Server tìm lại token mới qua `replacedByTokenId` (explicit pointer từ token cũ → token mới). Sau 5s = thật sự reuse = compromised → kill. | Không phải "grace period" cho expired token — token expired vẫn reject. KHÔNG dùng query theo `familyId` + thời gian để tìm token thay thế — dễ nhầm khi có nhiều device. |
| **Account Verification** | Quá trình xác nhận email/SĐT thuộc về User thật. Output: `emailVerified = true`. | Không nhầm với "Authentication" (đăng nhập). |
| **Password Recovery** | Luồng reset mật khẩu khi User quên (cần email + token một lần). | Không nhầm với "Change Password" (User đang đăng nhập, biết current). |
| **Soft Delete** | Đánh dấu `deletedAt`, không xóa row vật lý. Truy vấn mặc định lọc `deletedAt IS NULL`. | Không phải "deactivate" — deactivate là set `isActive=false`. |

---

## 📚 Catalog Context

| Thuật ngữ | Định nghĩa | KHÔNG dùng để chỉ |
| :--- | :--- | :--- |
| **Category** | Nhóm phân loại sản phẩm, hỗ trợ tree tự tham chiếu (parent/child). Có hai trạng thái độc lập: `isActive` (visibility) và `deletedAt` (soft-delete). **Max depth: 5 tầng** (root = tầng 1, max leaf = tầng 5). Validate khi create/update: vượt quá → `422 CATEGORY_MAX_DEPTH_EXCEEDED`. Field `image` đi qua `IStorageAdapter` pipeline (không nhận external URL) — resize **1 size duy nhất: `medium` 800px**, output `.webp`. **Sort order** quản lý qua bulk reorder endpoint `PATCH /categories/reorder` body `[{ id, sortOrder }]` — validate tất cả IDs cùng `parentId`, atomic update 1 transaction. Tie-break: `sortOrder ASC, createdAt ASC`. | Không phải "Tag" — Tag là phẳng, Category là cây. KHÔNG nhận external URL cho `image` — phải upload qua pipeline. KHÔNG sort bằng cách update từng record riêng lẻ. |
| **Category Active State** | `isActive = false` — Category bị **ẩn khỏi catalog public** nhưng vẫn tồn tại trong hệ thống. Admin vẫn thấy và có thể bật lại. Operation: `PATCH /categories/:id` body `{ isActive: false }`. **Inherited visibility**: public query chỉ hiển thị node khi toàn bộ path từ root đều `isActive=true` — ẩn parent = ẩn cả cây con. Enforce ở query layer (CTE recursive), không lưu trạng thái inherited vào DB. | Không phải "xóa" — category vẫn có thể bật lại. Không phải `deletedAt`. KHÔNG hiểu là mỗi node độc lập — parent ẩn thì con cũng ẩn với public. |
| **Category Soft Delete** | `deletedAt IS NOT NULL` — Category bị **xóa mềm**, biến mất khỏi mọi list kể cả admin UI. Giữ lại chỉ cho FK integrity và audit. Operation: `DELETE /categories/:id` → set `deletedAt = NOW()`. **RESTRICT**: từ chối `400 CATEGORY_HAS_CHILDREN` nếu còn children active — admin phải re-parent hoặc xóa children trước. Product gán vào → `categoryId = NULL` (SET NULL). **Có thể restore**: `PATCH /categories/:id/restore` (ADMIN only) — set `deletedAt = NULL`; validate slug không conflict; nếu parent đang bị soft-delete → `400 CATEGORY_PARENT_DELETED` (admin phải restore parent trước). | Không phải `isActive=false`. Không hard-delete (FK integrity). KHÔNG cascade xóa children. |
| **Slug** | Chuỗi URL-friendly sinh từ `name` (e.g. `dien-thoai`), duy nhất trong Category & Product. Sinh tự động từ `name` **chỉ lúc tạo mới**. Sau đó `name` và `slug` là hai field **hoàn toàn độc lập** — đổi `name` không tự thay `slug`. Admin phải include `slug` tường minh trong `PATCH` nếu muốn đổi. Khi conflict: server trả `422 SLUG_CONFLICT` kèm `suggestedSlug` (suffix `-2`, `-3`…) — admin tự quyết. KHÔNG auto-apply suffix im lặng. | Không phải "ID" — slug có thể đổi, ID thì không. KHÔNG auto-regenerate slug khi đổi tên — gây break URL đang index. |
| **Product** | Đơn vị bán được (SKU level). Mỗi Product có duy nhất 1 SKU và 1 slug. | Không phải "SKU" — SKU là mã, Product là entity. |
| **SKU** (Stock Keeping Unit) | Mã định danh thương mại của Product (e.g. `IPHONE-15-PRO-BLK`), duy nhất toàn hệ thống. | Không phải `productId` — `productId` là UUID nội bộ. |
| **Stock Quantity** | Số lượng tồn kho hiện tại của 1 Product. **Trừ ngay khi tạo Order (PENDING)** trong cùng transaction checkout. Nếu Order timeout/CANCELLED → hoàn kho lại. | Không phải "available" — available có thể trừ thêm số đã reserve trong Cart ở giai đoạn scale sau. |
| **Stock Deduction Timing** | **Eager**: trừ kho ngay tại `POST /orders` (state PENDING) qua `prisma.$transaction` + row-level lock. Lý do: chống oversell khi nhiều user checkout song song. | KHÔNG trừ ở PAID — đó là pattern "lazy" đã reject (refund spike khi hết hàng). |
| **PENDING Order Timeout** | Order PENDING quá ngưỡng (mặc định 15 phút) chưa PAID → cleanup job đặt CANCELLED + hoàn `stockQty`. Idempotent, chạy mỗi 5 phút. | Không phải "expired" — Order bị cancel tường minh, có state record. |
| **Idempotency Key** | UUID do client sinh khi mở trang checkout / review submit / payment init. Gửi qua header `Idempotency-Key`. Server lưu `(key → resultId)` TTL 24h trong **bảng Postgres `idempotency_keys`** (cron cleanup xóa row cũ > 24h). Cùng key 2 lần → trả result cũ. Khác body → `409 IDEMPOTENCY_KEY_REUSED`. | KHÔNG phải `requestId` (correlation log). KHÔNG phải `orderNumber` (mã hiển thị). KHÔNG dùng Redis chỉ để làm idempotency — over-engineering ở MVP; migrate sang Redis sau khi Redis được thêm vì lý do khác. |
| **Price** | Giá bán hiện tại (**`BigInt`, đơn vị "đồng VND"**), luôn > 0. Ví dụ: `100000` = `100,000₫`. | Khác `priceSnapshot` (giá tại thời điểm mua) và `comparePrice` (giá niêm yết). KHÔNG dùng `Decimal` / `Float`. |
| **Compare Price** | Giá niêm yết / giá gốc, dùng để hiển thị `% giảm`. Phải ≥ `price`. Cùng kiểu `BigInt` đơn vị đồng. | Không phải "MSRP" trong context Việt Nam. |
| **Money Type** | Mọi field tiền lưu **`BigInt` đơn vị nhỏ nhất của currency** (VND → đồng, không có cent). Math service-layer = integer thuần, không cần `Decimal.js`. Tại tầng serialization (NestJS response boundary) → convert BigInt → **string** qua global interceptor hoặc `@Transform` của `class-transformer`. Client nhận string và tự parse. Internal code không bao giờ dùng `number` cho tiền. | KHÔNG dùng `number` (JS float precision bug). KHÔNG dùng `Decimal(N,2)` (verbose). KHÔNG serialize BigInt trực tiếp — `JSON.stringify` throw TypeError. |
| **VAT (Tax)** | Schema có sẵn `vatRate` + `vatAmount` ở OrderItem và `vatTotal` ở Order. **MVP set = 0** (không tính VAT). Phase sau bật flag → tính `vatAmount = (afterDiscount * vatRate) / (10000 + vatRate)`. Mô hình **tax-inclusive** (giá Product đã gồm VAT khi bật). Tax-aware schema, tax-disabled logic. | KHÔNG bỏ field VAT khỏi schema — bật sau cần migration historical. KHÔNG dùng `float` cho `vatRate` — dùng `Int` đơn vị 1/10000 (vd `1000` = 10%). |
| **Order Math Formula** | Bắt buộc theo thứ tự: `lineTotal[i] = unitPrice[i] * quantity[i]` → `subtotal = sum(lineTotal)` → `afterDiscount = max(0, subtotal - discountAmount)` → `vatTotal = (afterDiscount * vatRate) / (10000 + vatRate)` → `grandTotal = afterDiscount + shippingFee`. **Discount trừ TRƯỚC VAT** (đúng luật thuế VN). `discountAmount` cap = `subtotal`, không cho âm. | KHÔNG tính VAT trước rồi mới trừ discount — sai luật + thay đổi mã thuế bị phạt. |
| **Variant** | Biến thể của Product (size, màu) — Phase 2 TASK-218. | Phase 1/2 chưa có; metadata JSONB là tạm. |

---

## 📍 Address Context

| Thuật ngữ | Định nghĩa | KHÔNG dùng để chỉ |
| :--- | :--- | :--- |
| **Address** | Địa chỉ giao hàng của User. Bảng `addresses` — 1 User có **N Address** (nhà, văn phòng, kho...). Field: `recipientName`, `phone`, `street`, `ward`, `district`, `city`, `postalCode?`, `label`, `isDefault`, `deletedAt`. Khi User bị soft-delete → app chạy `UPDATE addresses SET deletedAt = NOW() WHERE userId = :id` trong cùng transaction (không dựa vào DB cascade). | KHÔNG inline trong User profile (giới hạn 1). KHÔNG bỏ qua (buộc nhập mỗi checkout = chậm UX). KHÔNG dùng JOIN-through-User để filter thay cho `deletedAt` riêng — dễ bị bỏ sót ở admin query / background job. |
| **Default Address** | 1 Address của 1 User có `isDefault = true` (constraint: max 1 per user where `deletedAt IS NULL`). Khi User chọn address mới làm default → unset cờ cũ trong cùng transaction. Enforce bằng **partial unique index**: `UNIQUE (userId) WHERE isDefault = true AND deletedAt IS NULL`. | KHÔNG cho 2 default cùng lúc. KHÔNG chỉ dựa vào app-level logic — DB phải là safety net cuối cùng. |
| **Address Snapshot** | Khi tạo Order, address được chọn → đông cứng vào `Order.shippingAddressSnapshot` (JSONB). Sau đó sửa/xóa Address gốc KHÔNG ảnh hưởng Order. | KHÔNG dùng FK trong Order trỏ về Address — phải snapshot inline. |

**Cascade**: User soft-deleted → Address CASCADE soft-delete (đã nói ở Cross-context). Order vẫn giữ qua snapshot.

---

## 🛒 Commerce Context

| Thuật ngữ | Định nghĩa | KHÔNG dùng để chỉ |
| :--- | :--- | :--- |
| **Cart** | Trạng thái mua sắm bền vững của 1 User **HOẶC** 1 Guest. 1 User active có ≤ 1 Cart. 1 Guest active (theo `guestSessionId`) có ≤ 1 Cart. Bảng `carts` enforce CHECK: `userId XOR guestSessionId` — đúng 1 trong 2. | Không phải "Wishlist" (TASK-220). Không bao giờ có cart vô chủ (cả 2 NULL). |
| **Guest Session ID** | UUID lưu trong cookie `gsid` (HttpOnly, SameSite=Lax, Max-Age=2592000 = **30 ngày**). Set lần đầu khi non-auth client gọi `GET /cart`. Server tạo Cart row với `guestSessionId`. Khi request có Bearer token hợp lệ → server ưu tiên `userId`, **ignore `gsid`** dù cookie vẫn được gửi. | KHÔNG dùng device fingerprint (privacy). KHÔNG dùng IP (NAT/proxy gây trộn cart). KHÔNG lưu trong localStorage (mất khi clear cache → lý do dùng cookie). |
| **Guest Cart Lifecycle** | Cart guest có `expiresAt = createdAt + 30 ngày`. Cron daily `DELETE FROM carts WHERE userId IS NULL AND expiresAt < NOW()`. Khi User login → Cart Merge → guest cart bị xóa sau merge. | KHÔNG soft-delete guest cart — hard-delete vì không có audit value. Phân biệt với `User → Cart CASCADE soft-delete`. |
| **CartItem** | Một dòng trong Cart: `productId + quantity + priceAtAdded`. | Không phải `OrderItem` — Cart mutable, Order immutable. |
| **Price At Added** | Giá Product tại thời điểm thêm vào Cart. Dùng để **thông báo thay đổi giá** trước checkout. | Không phải `priceSnapshot` (sống ở OrderItem, immutable sau checkout). |
| **Cart Merge** | Khi Guest login, CartItem của Guest gộp vào Cart của User: cùng `productId` → cộng `quantity`. **Best-effort cap/overwrite** edge cases: (1) `quantity > stockQty` (kể cả sau khi cộng từ merge) → cap về `stockQty` + flag `CAPPED_QUANTITY`. (2) `priceAtAdded` khác giữa 2 cart → overwrite bằng `Product.price` hiện tại + flag `PRICE_CHANGED`. (3) Product đã `deletedAt` → skip item + flag `PRODUCT_DELETED`. Trả về `mergeWarnings[]` để FE toast. | Không phải "replace" — không ghi đè toàn cart. Không phải "strict reject" — không fail nếu có conflict. |
| **Abandoned Cart** | Cart có `lastActivity` cũ hơn ngưỡng (mặc định 7 ngày). Dùng cho marketing remind. `lastActivity` chỉ update khi có **write action** (thêm/xóa/sửa quantity CartItem) — không update khi GET. | Không phải "expired" — Cart không tự xóa, chỉ flag. KHÔNG tính GET là activity — user xem giỏ mà không mua vẫn phải được remind. |
| **Order** | Tài liệu pháp lý của 1 giao dịch. **Immutable** sau khi tạo (mọi field "động" đều phải snapshot). | Không phải Cart đã checkout — Order độc lập, không tham chiếu Cart. |
| **Order Number** | Mã hiển thị format **`ORD-{YYYY}-{6 digit padded}`** (vd `ORD-2026-000123`). Sinh qua **Postgres sequence `order_number_seq`** (atomic). Sequence rolling (không reset mỗi năm), prefix năm chỉ phục vụ filter UI. Unique. Nếu sequence vượt 999999 → để tự tràn thành 7+ chữ số (`ORD-2026-1000000`) — vẫn unique, không cần xử lý sớm. | Không phải `Order.id` (UUID nội bộ). KHÔNG random base36 (collision). KHÔNG reset sequence theo ngày (phức tạp). KHÔNG tăng padding trước — over-engineer. |
| **Order Status** | State machine: `PENDING → PAID → SHIPPING → DELIVERED` (+ `CANCELLED`, `REFUNDED`). Transition phải tuân theo state diagram. | Không free-form text. Xem TASK-111. |
| **OrderItem** | Một dòng đã chốt trong Order. Chứa `productSnapshot` (JSONB) — KHÔNG join lại Product để render. | Không phải CartItem — OrderItem có snapshot, CartItem không. |
| **Snapshot** (Address / Product / Price) | Bản sao "đông cứng" tại thời điểm tạo Order. Thay đổi nguồn KHÔNG ảnh hưởng snapshot. | Không phải reference — snapshot là JSON inline, không phải FK. |
| **Checkout** | Quy trình chuyển Cart → Order: validate stock + tạo snapshots + trừ kho + **clear CartItems** (xóa hết items, giữ Cart row), atomic. Cart row được giữ lại để tái sử dụng cho lần mua tiếp theo. | Không phải "submit cart" — checkout có side-effect trừ kho. KHÔNG hard-delete Cart row sau checkout — Cart của User là persistent entity. |
| **Order Lifecycle Event** | Event domain phát ra mỗi khi Order chuyển state (`order.paid`, `order.shipped`…). Dùng cho notification, audit, analytics. | Không phải HTTP webhook — đây là event nội bộ. Phase 2 TASK-222. |
| **Self-Cancel Window** | User được **tự cancel Order PAID trong 30 phút** sau checkout, **nhưng chỉ khi vẫn còn ở state PAID**. State machine thắng: nếu Order đã chuyển SHIPPING thì không cho tự cancel dù còn trong 30 phút. PENDING → tự cancel bất kỳ lúc nào. SHIPPING/DELIVERED → không cho tự cancel. | KHÔNG cho user cancel sau khi shop đã pack hàng. 30 phút là window trong state PAID — không phải window tính từ lúc đặt hàng bất kể state. |
| **Refund Flow (MVP)** | **Manual** — service chỉ set Order state = `REFUNDED` + hoàn stock + emit `order.refunded` + log note "Manual VNPay refund needed for txId XXX". Admin tự xử lý refund trên VNPay portal. Giai đoạn scale sau mới auto-call refund API. | KHÔNG auto-call provider trong MVP — chống bug refund-of-refund. KHÔNG silent (phải log + emit event cho audit). |
| **Refund Scope (MVP)** | **Full only** — cancel = refund toàn Order, không hỗ trợ partial per-item. Stock hoàn toàn bộ items về kho ngay khi state đổi. | Giai đoạn scale sau mới làm partial (mỗi OrderItem có state riêng). KHÔNG đợi shop nhận hàng về để hoàn stock — MVP đơn giản. |

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
- Không quay ngược state qua API thường (không có `DELIVERED → SHIPPING` qua `PATCH /orders/:id/status`).
- Mỗi transition là một event (TASK-222) và phải atomic với side-effect (trừ kho, hoàn tiền…).
- **Force Override**: ADMIN có endpoint riêng `PATCH /orders/:id/force-status` body `{ status, reason }` — bypass state machine validation, **bắt buộc reason text**, mọi force log vào `OrderStateChangeLog` (`isForceOverride=true`). Dùng khi support thực tế (khách báo đã nhận, COD reject, typo undo). KHÔNG bypass qua endpoint thường. KHÔNG cho USER/STAFF force.

---

## 🔗 Cross-context relationships

### Soft-delete cascade policy (User)

Khi User soft-deleted (`deletedAt` set), áp dụng **Hybrid policy** theo loại entity:

| Entity | Strategy | Lý do |
|--------|----------|-------|
| **Cart + CartItem** | CASCADE soft-delete | Throwaway, không có giá trị sau khi user xóa. |
| **Wishlist + WishlistItem** | CASCADE soft-delete | Personal preference, không public. |
| **RefreshTokenFamily** | CASCADE — revoke toàn bộ ngay | Security: chặn token cũ login. |
| **VerificationToken / ResetToken** | CASCADE hard-delete | Token một lần, không còn ý nghĩa. |
| **Address (profile)** | CASCADE soft-delete | Order đã có `shippingAddressSnapshot` riêng — không cần Address gốc. |
| **Order + OrderItem** | **GIỮ NGUYÊN** | Pháp lý/kiểm toán. `customerEmailSnapshot` + `shippingAddressSnapshot` đảm bảo info. |
| **Payment** | **GIỮ NGUYÊN** | Liên kết Order, cùng lý do pháp lý/audit. |
| **Review** | **ANONYMIZE** — set `userId = NULL`, `authorName = "Người dùng đã xóa"`, giữ content + rating | Public thread không break. |
| **Q&A (Question/Answer)** | **ANONYMIZE** — như Review | Public thread context giữ nguyên. |

### Foreign-key cascade (entity khác)

- **Category → Product**: 1-N. Xóa Category → Product `categoryId = NULL` (SET NULL — TASK-106).
- **Product → OrderItem**: 1-N. Xóa Product khi có OrderItem → **RESTRICT** (TASK-106). Vì OrderItem cần Product alive cho FK; nội dung đã ở `productSnapshot` nhưng FK vẫn cần.
- **Product → CartItem**: 1-N. Xóa Product (soft) → CartItem **giữ** + flag `productDeleted` khi GET cart (tránh hiển thị sai).
- **Product → WishlistItem**: 1-N. Xóa Product → CASCADE remove khỏi wishlist.
- **Product → Review**: 1-N. Xóa Product → Review giữ (history còn). Nhưng UI chỉ hiển thị khi Product active.

---

## 📏 Quy tắc thêm thuật ngữ mới

1. Bất kỳ thuật ngữ nào xuất hiện ở **≥ 2 tài liệu** đều phải vào đây.
2. Phải có cột "**KHÔNG dùng để chỉ**" để chống lẫn lộn với thuật ngữ gần nghĩa.
3. Khi đổi tên thuật ngữ: cập nhật file này **trước**, sau đó refactor các tài liệu khác.
4. Khi thêm bounded context mới, tạo section riêng — KHÔNG trộn lẫn.
