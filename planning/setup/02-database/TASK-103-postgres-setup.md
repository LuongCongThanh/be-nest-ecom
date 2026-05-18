# TASK-103: Quản trị Hạ tầng Dữ liệu (Database Infrastructure & Governance)

> 🛠️ **Engineering Task** — đã tách khỏi Phase 1 business.
> **Intent:** Cài đặt PostgreSQL qua Docker Compose.
> **Single Source of Truth:** ../DATABASE_SETUP.md (Step 1)
> **Charter business liên quan:** [../../business/01-identity/CHARTER.md](../../business/01-identity/CHARTER.md)
>
> _File này giữ nguyên nội dung gốc để tham chiếu. Khi cập nhật, sửa **canonical doc** trước, file này có thể trở thành stub._

---

## 📋 Metadata

- **Task ID**: TASK-103
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Persistence Foundation)
- **Phụ thuộc**: TASK-102
- **Trạng thái**: ⏳ Not started

---

## 🎯 CHIẾN LƯỢC DỮ LIỆU (Data Persistence Strategy)

### 💡 Tại sao Task này quan trọng?

Hệ thống E-commerce yêu cầu tính toàn vẹn dữ liệu cực cao và khả năng truy vấn phức tạp. Lựa chọn hạ tầng đúng đắn giúp ngăn chặn lỗi "It works on my machine" và đảm bảo hiệu năng khi mở rộng.

- **Reproducibility**: Sử dụng mô hình Docker hóa để đảm bảo mọi môi trường (Dev, Staging, Prod) chạy cùng phiên bản PostgreSQL 16.
- **Advanced Capabilities**: Kích hoạt các Extensions hệ thống ngay từ khi khởi tạo để hỗ trợ các nghiệp vụ hiện đại (UUID v4, Fuzzy Search).
- **Persistence First**: Dữ liệu phải được lưu trữ trong các volumes độc lập, đảm bảo an toàn ngay cả khi container gặp sự cố.

---

## 🏗️ TIÊU CHUẨN HẠ TẦNG (Infrastructure Standards)

### 1. Database Engine Engine: PostgreSQL 16 (Alpine)

Lý do chọn: Ổn định, hỗ trợ JSONB mạnh mẽ, và cộng đồng hỗ trợ e-commerce rộng lớn. Phiên bản Alpine được ưu tiên để tối ưu hóa dung lượng image và bảo mật.

### 2. Chính sách Tiện ích mở rộng (Extensions Policy)

Mọi instance Database trong hệ thống phải được cài đặt các extensions sau:

- **uuid-ossp**: Hỗ trợ generate UUID v4 trực tiếp tại tầng DB.
- **pg_trgm**: Hỗ trợ thuật toán Trigram cho tìm kiếm sản phẩm (Fuzzy Search).
- **pgcrypto**: Hỗ trợ các hàm mã hóa dữ liệu nhạy cảm nếu cần.

### 3. Công cụ Quản trị (Management Layer)

- **GUI Management**: Khuyến khích sử dụng pgAdmin hoặc các công cụ trực quan (DBeaver) để giám sát cấu trúc và dữ liệu.
- **Health Check Boundary**: Database phải có cơ chế phản hồi trạng thái sức khỏe (`pg_isready`) để hạ tầng (Orchestrator) có thể theo dõi.

---

## ✅ ĐÁNH GIÁ KẾT QUẢ (Definition of Done)

- [ ] **IaC**: Toàn bộ hạ tầng database được định nghĩa dưới dạng Code (Docker Compose).
- [ ] **Extensions**: Các tiện ích `uuid-ossp` và `pg_trgm` sẵn sàng hoạt động.
- [ ] **Network**: Database được cô lập trong mạng nội bộ, chỉ expose các cổng cần thiết.
- [ ] **Dual-Environment**: Có database riêng cho Production/Dev và E2E Testing.

---

## 🧪 TDD Planning (Persistence Infrastructure)

| Kịch bản              | Mong đợi                                                                              |
| :-------------------- | :------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| **Persistence Check** | Restart container -> Toàn bộ dữ liệu cũ phải được giữ nguyên (Volume Binding).        |
| **Extension Check**   | Query danh sách extension -> Phải thấy `uuid-ossp` và `pg_trgm`.                      |
| **Network Isolation** | Kiểm tra kết nối từ bên ngoài -> Chỉ cổng 5432 (hoặc cổng custom) được phép truy cập. |
| **Multi-DB Setup**    | Hệ thống phải có khả năng khởi tạo đồng thời DB chính và DB Test.                     |
| y `pg_extension`      | Trả về `uuid-ossp`, `pg_trgm`, `pgcrypto`.                                            |
| **Test DB**           | Check existing DBs                                                                    | `ecommerce_test` phải tồn tại (dùng cho E2E Testing). |
| **Persistence**       | Restart container                                                                     | Dữ liệu trong volume `postgres_data` vẫn còn nguyên.  |

---

\*\*🎉 Task hoàn thành khi PostgreSQL container running healthy
