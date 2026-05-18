# TASK-212: Chống chịu Lỗi: Quản trị Ngoại lệ & Tính phục hồi (Fault Tolerance: Global Error Handling & Resilience)

> 🛠️ **Engineering Task** — đã tách khỏi Phase 2 business.
> **Intent:** Global exception filter + standardized error schema.
> **Single Source of Truth:** ../CONVENTIONS.md (§5, §14)
> **Charter business liên quan:** [../../business/CHARTER-revenue.md](../../business/CHARTER-revenue.md)
>
> _File này giữ nguyên nội dung gốc để tham chiếu. Khi cập nhật, sửa **canonical doc** trước, file này có thể trở thành stub._

---

## 📋 Metadata

- **Task ID**: TASK-212
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (System Stability)
- **Phụ thuộc**: TASK-105 (Initial Error Handling)
- **Trạng thái**: ⏳ Not started

---

## 🎯 CHIẾN LƯỢC CHỐNG CHỊU LỖI (Resilience Strategy)

### 💡 Tại sao Quản trị Lỗi quan trọng?

Trong một hệ thống phức tạp, lỗi là điều không thể tránh khỏi. Cách hệ thống phản ứng với lỗi quyết định tính chuyên nghiệp và độ tin cậy.

- **Unified Catch-all**: Mọi lỗi không được bắt (unhandled exceptions) phải được gom về một mối để xử lý tập trung, tránh rò rỉ thông tin kỹ thuật (Stack trace) ra ngoài.
- **Fail-Fast Principles**: Phát hiện lỗi ngay tại "cửa ngõ" và trả về thông tin phản hồi rõ ràng để Frontend/Client có thể xử lý.
- **Data Safety**: Đảm bảo lỗi xảy ra không làm hỏng dữ liệu hoặc làm treo hệ thống.

---

## 📄 PHÂN LOẠI & ĐỊNH DẠNG LỖI (Standardized Error Schema)

### 1. Danh mục Ngoại lệ (Exceptions Categories)

| Loại Lỗi                | Ý nghĩa Vận hành                              | Mã Trạng thái (HTTP) |
| :---------------------- | :-------------------------------------------- | :------------------- |
| **Validation Error**    | Dữ liệu đầu vào không hợp lệ.                 | 400 Bad Request      |
| **Authentication Flow** | Sai thông tin định danh.                      | 401 Unauthorized     |
| **Domain Logic**        | Vi phạm quy tắc kinh doanh (ví dụ: Hết hàng). | 409 Conflict         |
| **Internal Failure**    | Sự cố hệ thống hoặc cơ sở dữ liệu.            | 500 Server Error     |

### 2. Cấu trúc Phản hồi Lỗi (Error Response Format)

Hệ thống cam kết trả về một cấu trúc duy nhất cho mọi lỗi:

- `statusCode`: Mã HTTP phù hợp.
- `message`: Thông báo mô tả lỗi (thân thiện với con người).
- `error`: Tên kỹ thuật của loại lỗi.
- `path`: URL nơi xảy ra lỗi (hỗ trợ Debug).

---

## ✅ TIÊU CHUẨN THÀNH CÔNG (Definition of Success)

- [ ] **Information Masking**: 100% lỗi 500 không được chứa chi tiết về bảng DB hoặc cấu trúc code trong môi trường Production.
- [ ] **Global Enforcement**: Mọi Controller mới được thêm vào sau này đều tự động được áp dụng cơ chế xử lý lỗi này.
- [ ] **Log Correlation**: Mỗi lỗi phát sinh phải đi kèm với một `Request ID` để dễ dàng tra cứu trong hệ thống Log (TASK-213).

---

## 🧪 TDD PLANNING (Resilience Scenarios)

| Kịch bản            | Mong đợi                                                                               |
| :------------------ | :------------------------------------------------------------------------------------- |
| **Database Down**   | DB ngắt kết nối đột ngột -> Hệ thống trả về lỗi 500 chuẩn, không treo luồng HTTP.      |
| **Malformed JSON**  | Gửi Request với JSON sai cú pháp -> Trả về lỗi 400 rõ ràng.                            |
| **Edge Case Throw** | Tự tay Throw một exception lạ trong code -> Filter phải bắt được và format đúng chuẩn. |
