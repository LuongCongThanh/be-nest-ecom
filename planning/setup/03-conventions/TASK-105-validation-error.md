# TASK-105: Quản trị Chất lượng & Kiến trúc Phòng thủ (Global Quality & Defensive Governance)

> 🛠️ **Engineering Task** — đã tách khỏi Phase 1 business.
> **Intent:** Global ValidationPipe và Error schema.
> **Single Source of Truth:** ../CONVENTIONS.md (§3, §5, §14)
> **Charter business liên quan:** [../../business/01-identity/CHARTER.md](../../business/01-identity/CHARTER.md)
>
> _File này giữ nguyên nội dung gốc để tham chiếu. Khi cập nhật, sửa **canonical doc** trước, file này có thể trở thành stub._

---

## 📋 Metadata

- **Task ID**: TASK-105
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Quality Core)
- **Phụ thuộc**: TASK-102, TASK-104
- **Trạng thái**: ⏳ Not started

---

## 🎯 CHIẾN LƯỢC PHÒNG THỦ (Defensive Coding Strategy)

### 💡 Tại sao Task này quan trọng?

Validation và Error Handling là "hàng rào bảo vệ" đầu tiên, ngăn chặn dữ liệu rác và các cuộc tấn công injection từ vòng ngoài.

- **Data Integrity (Whitelist)**: Áp dụng chính sách "Chỉ chấp nhận dữ liệu đã đăng ký". Mọi thuộc tính dư thừa trong request sẽ bị loại bỏ tự động, ngăn chặn các cuộc tấn công Mass Assignment.
- **Zero-Trust Validation**: Mọi dữ liệu đi vào (Input) từ Client phải được kiểm tra kiểu dữ liệu và ràng buộc logic (Regex, Range, Enum) trước khi chạm tới Business Logic.
- **Consistent DX (Developer Experience)**: Cung cấp một cấu trúc phản hồi lỗi (Error Schema) đồng nhất cho toàn bộ API, giúp đội ngũ Frontend xử lý exception một cách tự động và chính xác.

---

## 🏗️ TIÊU CHUẨN CHẤT LƯỢNG (Quality Standards)

### 1. Chính sách Xác thực Dữ liệu (Validation Policy)

- **Automatic Transformation**: Dữ liệu từ URL (String) phải được tự động chuyển đổi sang đúng kiểu dữ liệu nghiệp vụ (Number, Date, ID) để đảm bảo tính nhất quán.
- **Whitelist Enforcement**: Hệ thống từ chối mọi thuộc tính không được định nghĩa trong mô hình dữ liệu (DTO).
- **Custom Guardrails**: Xây dựng các bộ quy tắc riêng cho thông tin nhạy cảm:
  - **Strong Password**: Ràng buộc về độ dài, ký tự đặc biệt và độ phức tạp.
  - **Identity Formats**: Ràng buộc cho số điện thoại, Email, và Slugs (SEO-friendly).

### 2. Quản trị Ngoại lệ (Exception Governance)

- **Unified Error Schema**: Mọi lỗi (404, 401, 500) phải trả về cùng một format JSON bao gồm: `statusCode`, `message`, `error` (type), và `timestamp`.
- **Sensitive Shielding**: Trong môi trường Production, các thông tin chi tiết về lỗi hệ thống (Stack-trace) phải được ẩn đi để không tiết lộ cấu trúc hạ tầng.
- **Audit Logging**: Mọi Exception phải được ghi nhật ký (Internal Log) kèm theo Path và Method để phục vụ truy vết.

---

## ✅ ĐÁNH GIÁ KẾT QUẢ (Definition of Done)

- [ ] **Defensive**: Hệ thống tự động từ chối request nếu chứa field lạ.
- [ ] **Consistent**: Response lỗi của hệ thống đồng nhất trên toàn bộ các Endpoint.
- [ ] **Secure**: Các quy tắc cho mật khẩu mạnh và định dạng dữ liệu đã được áp dụng.
- [ ] **Clean**: Class-transformer được tích hợp để xử lý chuyển đổi kiểu dữ liệu tự động.

---

## 🧪 TDD Planning (Validation Logic)

| Kịch bản                   | Mong đợi                                                                                |
| :------------------------- | :-------------------------------------------------------------------------------------- |
| **Field Injection Attack** | Gửi kèm field `isAdmin: true` trong request đăng ký -> Hệ thống phải loại bỏ field này. |
| **Logic Validation**       | Nhập mật khẩu là `123456` -> Hệ thống trả lỗi "Password too weak" (400).                |
| **Structural Integrity**   | Truy cập link không tồn tại -> Trả về JSON chuẩn (không phải HTML error của Server).    |
| **Type Resilience**        | Gửi `page="abc"` thay vì số -> Trả lỗi 400 kèm thông báo kiểu dữ liệu không hợp lệ.     |
