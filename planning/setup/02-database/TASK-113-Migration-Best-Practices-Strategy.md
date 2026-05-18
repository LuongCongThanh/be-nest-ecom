# TASK-113: Kiến trúc Tiến hóa & An toàn Production (Evolution Architecture & Production Safety)

> 🛠️ **Engineering Task** — đã tách khỏi Phase 1 business.
> **Intent:** Migration strategy & rollback rules.
> **Single Source of Truth:** ../project-conventions.vi.md (§13)
> **Charter business liên quan:** [../../ecommerce-api-doc/01-Phase-1-Foundation/CHARTER.md](../../ecommerce-api-doc/01-Phase-1-Foundation/CHARTER.md)
>
> _File này giữ nguyên nội dung gốc để tham chiếu. Khi cập nhật, sửa **canonical doc** trước, file này có thể trở thành stub._

---

## 📋 Metadata

- **Task ID**: TASK-113
- **Độ ưu tiên**: 🔴 CHÍ TRỌNG (Stability)
- **Phụ thuộc**: TASK-112 (Migration Governance)
- **Trạng thái**: ⏳ Not started

---

## 🎯 CHIẾN LƯỢC TIẾN HÓA (Evolutionary Strategy)

### 1. Nguyên tắc Không gián đoạn (Zero-Downtime Principles)

Mọi thay đổi Schema trên môi trường Production phải tuân thủ triết lý "Mở rộng trước, Thu hẹp sau":

- **Giai đoạn 1**: Thêm các cột hoặc bảng mới (Non-blocking changes). Code mới bắt đầu ghi song song vào cả cũ và mới nếu cần.
- **Giai đoạn 2**: Di chuyển dữ liệu cũ sang cấu trúc mới (Data Migration).
- **Giai đoạn 3**: Loại bỏ cấu trúc cũ (Cleanup) sau khi đã xác nhận code mới hoạt động ổn định 100%.

### 2. Quản trị Rủi ro (Risk Management)

- **Transactional Safety**: Mỗi file Migration phải chạy trong một Database Transaction duy nhất. Nếu một lệnh lỗi, toàn bộ thay đổi phải được hủy bỏ tự động (Auto-rollback).
- **Locking Awareness**: Tránh các lệnh gây khóa bảng (exclusive locks) lâu trên các bảng lớn (ví dụ: `Orders`). Ưu tiên các lệnh `ADD COLUMN` có giá trị mặc định là NULL.
- **Data Integrity Audits**: Luôn thực hiện kiểm chính dữ liệu (Verification queries) sau mỗi lần nạp migration để đảm bảo tính toàn vẹn.

---

## ✅ TIÊU CHUẨN ĐẦU RA (Definition of Success)

- [ ] **Safe-by-Design**: Các script migration được kiểm thử tự động khả năng Rollback.
- [ ] **Traceable**: Mỗi lần chạy migration đều được log lại thời gian bắt đầu, kết thúc và người thực hiện.
- [ ] **Atomic**: Không bao giờ để Database ở trạng thái "lửng lơ" (nửa cũ nửa mới) khi có lỗi.

---

## 🏗️ QUY TRÌNH KIỂM THỬ (Verification Pipeline)

| Bước               | Hoạt động                                           | Mục tiêu                                               |
| :----------------- | :-------------------------------------------------- | :----------------------------------------------------- |
| **Local Sandbox**  | Chạy trên dữ liệu giả lập.                          | Kiểm tra cú pháp SQL.                                  |
| **Staging Replay** | Chạy trên bản copy của DB Production.               | Ước lượng thời gian chạy và đo lường độ trễ (Latency). |
| **Rollback Drill** | Thực hiện Revert ngay sau khi nạp thành công.       | Đảm bảo đường lui luôn mở.                             |
| **Final Audit**    | Kiểm tra số lượng Record và Ràng buộc (FK, Unique). | Xác nhận dữ liệu không bị mất mát.                     |
