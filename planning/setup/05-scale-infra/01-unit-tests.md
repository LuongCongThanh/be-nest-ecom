# TASK-301: Đảm bảo Đơn vị: Logic Dịch vụ & Trường hợp Biên (Unit Assurance: Service Logic & Edge Cases)

## 📋 Metadata

- **Task ID**: TASK-301
- **Độ ưu tiên**: 🔵 TRUNG BÌNH (Quality)
- **Phụ thuộc**: Phase 1 + Phase 2 Core Logic
- **Trạng thái**: ⏳ Not started

---

## 🎯 CHIẾN LƯỢC KIỂM THỬ ĐƠN VỊ (Unit Testing Strategy)

### 💡 Tại sao Kiểm thử Đơn vị quan trọng?

Unit Test là "tuyến phòng thủ đầu tiên". Nó giúp lập trình viên tự tin thay đổi code (Refactor) mà không sợ làm hỏng logic cũ.

- **Isolated Logic Validation**: Tập trung kiểm tra logic nghiệp vụ sâu bên trong các Service, tách biệt hoàn toàn khỏi Database và Network.
- **Mocking Strategy & Purity**: Sử dụng Mocking để giả lập các phụ thuộc (Dependencies), đảm bảo bài test chạy nhanh (vài mili giây) và ổn định.
- **Edge Case Exhaustion**: Tìm kiếm và kiểm tra các trường hợp "biên" (ví dụ: giỏ hàng trống, giá bằng 0, mật khẩu quá ngắn).

---

## 📊 MỤC TIÊU KIỂM THỬ (Testing Targets)

| Phân vùng (Module)  | Trọng tâm Kiểm thử                                 | Chỉ số Coverage Kỳ vọng |
| :------------------ | :------------------------------------------------- | :---------------------- |
| **Auth Service**    | Logic băm mật khẩu, tạo Token, kiểm tra quyền.     | > 90%                   |
| **Product Service** | Thuật toán phân trang, lọc dữ liệu, tính toán giá. | > 85%                   |
| **Order Service**   | Logic tính tổng tiền, giảm kho, máy trạng thái.    | > 95%                   |
| **Common Utils**    | Các hàm xử lý chuỗi, ngày tháng, tiền tệ.          | 100%                    |

---

## 📄 QUY TẮC VẬN HÀNH (Operational Rules)

### 1. Tính Độc lập (Independence)

- Các bài test không được phụ thuộc lẫn nhau. Thứ tự chạy test không được làm thay đổi kết quả.

### 2. Định dạng Tên (Naming Convention)

- Tên bài test phải mô tả rõ ràng: `Nên [Kết quả] khi [Điều kiện]` (Ví dụ: `Nên trả về lỗi 409 khi đăng ký email đã tồn tại`).

---

## ✅ TIÊU CHUẨN THÀNH CÔNG (Definition of Success)

- [ ] **Fast Feedback Loop**: Toàn bộ Unit Test Suite phải hoàn thành trong dưới 30 giây.
- [ ] **Zero Flaky Tests**: Không chấp nhận các bài test lúc pass lúc fail không rõ nguyên nhân.
- [ ] **CI/CD Integration**: Hệ thống tự động chặn (Block) việc Merge code nều Unit Test không vượt qua 100%.

---

## 🧪 TDD PLANNING (Unit Scenarios)

| Kịch bản                | Mong đợi                                                                              |
| :---------------------- | :------------------------------------------------------------------------------------ |
| **Empty Cart Checkout** | Gọi hàm tạo đơn hàng với giỏ hàng rỗng -> Service phải ném lỗi `BadRequestException`. |
| **Stock Lock Race**     | Giả lập 2 hàm trừ kho chạy song song -> Chỉ 1 hàm thành công nếu số lượng = 1.        |
| **Expired Token**       | Hàm giải mã Token nhận vào chuỗi đã hết hạn -> Trả về kết quả không hợp lệ.           |
