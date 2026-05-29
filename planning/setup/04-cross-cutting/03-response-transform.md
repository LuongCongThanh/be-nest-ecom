# TASK-214: Tầng Nhất quán: Thống nhất Hợp đồng Phản hồi API (Consistency Layer: Unifying API Response Contracts)

> 🛠️ **Engineering Task** — đã tách khỏi Phase 2 business.
> **Intent:** Response envelope wrapper + pagination metadata.
> **Single Source of Truth:** ../CONVENTIONS.md (§4, §5)
> **Charter business liên quan:** [../../business/CHARTER-revenue.md](../../business/CHARTER-revenue.md)
>
> _File này giữ nguyên nội dung gốc để tham chiếu. Khi cập nhật, sửa **canonical doc** trước, file này có thể trở thành stub._

---

## 📋 Metadata

- **Task ID**: TASK-214
- **Độ ưu tiên**: 🔵 TRUNG BÌNH (Developer Experience)
- **Phụ thuộc**: TASK-213 (Logging)
- **Trạng thái**: ⏳ Not started

---

## 🎯 CHIẾN LƯỢC NHẤT QUÁN (Consistency Strategy)

### 💡 Tại sao Tầng Nhất quán quan trọng?

Một API tốt không chỉ chạy đúng mà còn phải dễ dự đoán (Predictable). Việc mỗi Endpoint trả về một kiểu dữ liệu khác nhau sẽ gây khó khăn cho đội ngũ Frontend và Mobile.

- **Interface Uniformity**: Mọi phản hồi thành công (HTTP 2xx) đều phải tuân thủ một khung xương duy nhất.
- **Predictable Consumption**: Giúp Client dễ dàng xây dựng các lớp xử lý chung (Generic handlers) cho dữ liệu và thông báo.
- **Standardized Metadata**: Tự động bổ sung các thông tin phụ trợ (Timestamp, Request ID) mà không cần lập trình viên phải viết code lặp lại.

---

## 📄 HỢP ĐỒNG PHẢN HỒI THÀNH CÔNG (Success Schema Design)

Hệ thống cam kết mọi API thành công sẽ có cấu trúc JSON như sau:

```json
{
  "success": true,
  "message": "Nội dung thông báo (đã được localization)",
  "data": {
    "id": "uuid",
    "...": "Dữ liệu thực tế của Entity"
  },
  "meta": {
    "timestamp": "2024-01-11T23:00:00Z",
    "requestId": "uuid-truy-vet"
  }
}
```

---

## 🏗️ QUY TẮC VẬN HÀNH (Operational Rules)

### 1. Tự động hóa (Global Inversion)

- Cơ chế chuyển đổi (Transformation) phải được áp dụng ở mức toàn cục (Global Interceptor).
- Lập trình viên chỉ cần `return entity;` trong Controller, hệ thống sẽ tự động bọc (wrap) vào cấu trúc chuẩn.

### 2. Tùy biến Thông báo (Message Customization)

- Hỗ trợ ghi đè (Override) thông báo thành công cho từng API cụ thể thông qua Decorator (Ví dụ: "Đăng ký thành công", "Đã cập nhật giỏ hàng").

---

## ✅ TIÊU CHUẨN THÀNH CÔNG (Definition of Success)

- [ ] **Zero Manual Wrapping**: Lập trình viên không phải viết tay cấu trúc `success: true` trong mỗi Controller.
- [ ] **Client-Ready Format**: Dữ liệu trả về sẵn sàng để Frontend map trực tiếp vào UI components mà không cần xử lý phức tạp.
- [ ] **Localization Friendly**: Trường `message` sẵn sàng cho việc hỗ trợ đa ngôn ngữ (TASK-325).

---

## 🧪 TDD PLANNING (Consistency Scenarios)

| Kịch bản                 | Mong đợi                                                                                         |
| :----------------------- | :----------------------------------------------------------------------------------------------- |
| **Simple Entity Return** | Trả về một Object -> Hệ thống tự động bọc vào field `data`.                                      |
| **Array Return**         | Trả về một danh sách -> Hệ thống tự bọc vào `data` và giữ nguyên tính chất mảng.                 |
| **Null Data**            | API thành công nhưng không có dữ liệu -> `data` trả về `null` hoặc `{}` nhưng vẫn đúng cấu trúc. |
