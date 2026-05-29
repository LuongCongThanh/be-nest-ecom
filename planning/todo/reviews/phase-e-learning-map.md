# Phase E Learning Map - NestJS Backend

File này lưu roadmap học NestJS backend theo **Phase E** của repo này.

Nếu:

- Phase B = nền kỹ thuật
- Phase C = business flow
- Phase D = quality, reliability, observability

thì:

- **Phase E = testing, final verification, và ship mindset**

Đây là phase giúp bạn học cách kết thúc một backend feature set cho tử tế, thay vì dừng lại ở mức "đã code xong".

---

## Mục tiêu của Phase E

Phase E giúp bạn học các năng lực rất quan trọng khi làm backend thật:

- kiểm thử có chủ đích
- verify toàn hệ thống trước khi ship
- nhìn backend như một sản phẩm cần chứng minh độ tin cậy
- biết thế nào là "done thật"

Mục tiêu của phase này không chỉ là có test, mà là:

- biết test cái gì
- biết vì sao test đó đáng có
- biết dùng verify để giảm rủi ro ship
- biết đánh giá mức sẵn sàng của backend

---

## Phase E theo từng task

| Task | Học skill gì | Sai lầm hay gặp | Dấu hiệu đã hiểu thật |
| --- | --- | --- | --- |
| `01-testing` | Tư duy test backend: unit, integration, e2e, phạm vi test, ưu tiên test theo risk | Viết test theo implementation detail, hoặc cố test mọi thứ nhưng không rõ mục tiêu | Biết chọn đúng loại test cho đúng rủi ro và đúng layer của backend |
| `02-ship` | Release readiness, final verification, quality gate thinking | Thấy app chạy local là kết luận có thể ship | Biết ship là quyết định dựa trên bằng chứng verify, không dựa trên cảm giác |

---

## Phase E practical map

| Task | Nên đọc file nào trước | Nên verify bằng gì | 1 câu hỏi tự kiểm tra hiểu bài |
| --- | --- | --- | --- |
| `01-testing` | `planning/todo/phase-e/01-testing.md`, `planning/setup/CONVENTIONS.md` phần testing, test files hiện có, package scripts | Chạy test commands theo task, kiểm tra pass/fail, xem độ bao phủ của flow quan trọng | "Flow nào đáng test nhất vì nếu hỏng sẽ gây hậu quả lớn nhất?" |
| `02-ship` | `planning/todo/phase-e/02-ship.md`, toàn bộ artifact phase trước, review files, scripts verify chính | Chạy lại quality gates, type-check, test chính, verify docs/runtime endpoints quan trọng | "Nếu phải giải thích lý do backend này sẵn sàng ship, mình sẽ đưa ra bằng chứng nào?" |

---

## Các backend concept bạn sẽ học sâu ở Phase E

### 1. Testing by risk, not by vanity

Bạn sẽ học rằng test tốt không phải là:

- test nhiều nhất
- test dài nhất
- coverage cao nhất bằng mọi giá

Mà là:

- test đúng flow quan trọng
- test đúng boundary dễ hỏng
- test đúng nơi bug sẽ gây thiệt hại lớn

Đây là bước chuyển rất quan trọng từ "biết viết test" sang "biết dùng test để bảo vệ backend".

### 2. Layered testing mindset

Phase này giúp bạn hiểu rõ hơn:

- unit test bảo vệ logic nhỏ
- integration test bảo vệ kết nối giữa các phần
- e2e test bảo vệ flow người dùng hoặc flow hệ thống

Bạn không cần test mọi thứ ở mọi layer. Bạn cần biết đặt test đúng chỗ.

### 3. Evidence-based shipping

Một backend chỉ nên được xem là sẵn sàng ship khi có bằng chứng:

- type-check pass
- test pass
- acceptance criteria pass
- docs đủ rõ
- runtime verify ổn

Phase E giúp bạn quen với việc ra quyết định từ evidence thay vì cảm giác.

### 4. Final review discipline

Đây là phase giúp bạn luyện một kỹ năng rất quan trọng:

- nhìn lại toàn bộ hệ thống
- xem phần nào còn yếu
- biết phần nào chấp nhận được cho MVP
- biết phần nào không nên bỏ qua trước khi release

---

## Cách dùng file này với nestjs-mentor

Trước mỗi task Phase E:

1. đọc hàng tương ứng trong file này
2. mở file task thật trong `planning/todo/phase-e/`
3. đọc thêm conventions và artifact từ các phase trước nếu task yêu cầu tổng hợp

Khi làm xong task:

1. chạy verify của task
2. đối chiếu thêm theo cột verify trong file này
3. tự trả lời câu hỏi kiểm tra hiểu bài
4. sau đó mới close-out với mentor

---

## 3 dấu hiệu bạn đang học đúng ở Phase E

- bạn bắt đầu hỏi "bug nào đáng sợ nhất nếu lọt ra production?"
- bạn chọn test theo risk, không test theo cảm hứng
- bạn coi ship là một quyết định có điều kiện, không phải bước cuối mang tính hình thức

---

## Kết luận ngắn

Nếu đi tốt hết Phase E, bạn sẽ tiến từ mức:

- backend có feature và có quality khá ổn

lên gần mức:

- backend có thể được đánh giá, kiểm chứng, và ship một cách có trách nhiệm

Đây là phase giúp hoàn tất vòng học rất quan trọng: không chỉ biết xây backend, mà còn biết khi nào backend đủ sẵn sàng để phát hành.
