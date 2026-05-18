# 🛒 Business — Domain & Feature

Mọi task **về nghiệp vụ** chia theo bounded context. Mỗi thư mục = 1 domain độc lập.

> 📜 Glossary domain bắt buộc: [`../docs/CONTEXT.md`](../docs/CONTEXT.md)
> 📋 Yêu cầu nghiệp vụ tổng: [`../docs/REQUIREMENTS.md`](../docs/REQUIREMENTS.md)

---

## 📂 Bounded Contexts

### 01-identity — Người dùng + Auth + Address
> 📜 Charter: [`./01-identity/CHARTER.md`](./01-identity/CHARTER.md)
> Bao gồm 3 sub-domain: **User entity / Authentication (JWT + Refresh family) / Address profile (N per user)**.

| Task | Mô tả |
| :--- | :--- |
| TASK-107 | User Entity (+ Address entity N per User, `isDefault`) |
| TASK-114 | JWT Authentication (access 15m, refresh 30d rolling, Bearer header) |
| TASK-115 | Auth DTOs (class-validator) |
| TASK-116 | Register & Login |
| TASK-118 | Users CRUD |
| TASK-119 | User Profile |
| TASK-120 | Change Password (revoke all token families) |
| TASK-123 | Refresh Token Family (rotation + 5s tolerance + reuse detection) |
| TASK-124 | Email Verification & Password Recovery |

### 02-catalog — Sản phẩm & danh mục
| Task | Mô tả |
| :--- | :--- |
| TASK-108 | Tạo Category Entity |
| TASK-109 | Tạo Product Entity |
| TASK-201 | Implement Categories CRUD |
| TASK-202 | Category Tree & Filtering |
| TASK-203 | Implement Products CRUD |
| TASK-204 | Product Filtering & Search |
| TASK-205 | Product Stock Management |
| TASK-206 | Product Images & File Upload |
| TASK-218 | Product Variants & Attributes |

### 03-cart — Giỏ hàng
| Task | Mô tả |
| :--- | :--- |
| TASK-110 | Tạo Cart & CartItem Entities |
| TASK-207 | Implement Shopping Cart |
| TASK-208 | Cart Calculations |

### 04-order — Đơn hàng
| Task | Mô tả |
| :--- | :--- |
| TASK-111 | Tạo Order & OrderItem Entities |
| TASK-209 | Implement Order Creation |
| TASK-210 | Order Management |
| TASK-211 | Order Statistics |
| TASK-222 | Order Lifecycle Event Handling |

### 05-payment — Thanh toán
| Task | Mô tả |
| :--- | :--- |
| TASK-221 | Payment Integration Advanced (VNPay…) |

### 06-engagement — Tương tác khách hàng
| Task | Mô tả |
| :--- | :--- |
| TASK-217 | Q&A System |
| TASK-219 | Reviews & Ratings |
| TASK-220 | Wishlist & Favorites |
| TASK-224 | Discount & Coupon System |
| TASK-225 | Multiple Shipping Methods |
| TASK-226 | Inventory Alerts & Notifications |
| ~~TASK-216~~ | ⚠️ **DEPRECATED** — đã merge vào TASK-219 |

### 07-future — Sau MVP (cân nhắc kỹ trước khi làm)
| Task | Mô tả | Ghi chú |
| :--- | :--- | :--- |
| TASK-303 | Loyalty/Membership System | Feature nâng cao |
| TASK-305 | AI Recommendation Engine | Cần ML pipeline |
| TASK-317 | Admin Dashboard Statistics | Frontend-heavy |
| TASK-318 | Real-time Notifications (WebSocket) | Cần infra mới |
| TASK-319 | Two-Factor Authentication (2FA) | Security nâng cao |
| TASK-322 | GraphQL API | Alt cho REST, đừng làm cả 2 |
| TASK-323 | Microservices Architecture | Premature đối với học BE |
| TASK-324 | Message Queue (RabbitMQ/Kafka) | Khi cần async scale |
| TASK-325 | Multi-language (i18n) | Business decision |
| TASK-326 | Multi-currency | Business decision |
| TASK-327 | OAuth Social Login | Khi có FE đầy đủ |
| TASK-328 | Product Recommendations (ML) | Cần data + ML |
| TASK-329 | Analytics Dashboard | Frontend job |

> ⚠️ Track self-learn (`../docs/ROADMAP.md`) **bỏ qua** phần lớn `07-future`. Chỉ chọn 1–2 chủ đề tò mò nhất sau khi MVP xong.

---

## 🧭 Quy tắc dùng

1. Mọi task trong `business/` **bắt buộc** dùng đúng thuật ngữ từ `../docs/CONTEXT.md`.
2. Khi viết feature mới đụng thuật ngữ chưa có → cập nhật `CONTEXT.md` trước, code sau.
3. Khi feature đụng schema → cập nhật `../setup/DATABASE_SCHEMA.md` trước, code migration sau.
4. Khi feature đụng convention (validation rule mới, error code mới) → cập nhật `../setup/CONVENTIONS.md` trước.
