# Phase D Learning Map - NestJS Backend

File này lưu roadmap học NestJS backend theo **Phase D** của repo này.

Nếu:

- Phase B = dựng nền kỹ thuật
- Phase C = xây business flow

thì:

- **Phase D = hardening, quality, vận hành, và độ tin cậy**

Đây là phase giúp bạn học cách đưa backend từ mức "đã có feature" sang mức "đủ rõ, đủ an toàn, đủ dễ vận hành hơn".

---

## Mục tiêu của Phase D

Phase D giúp bạn học các năng lực backend thường bị bỏ qua khi chỉ học tutorial:

- error handling có hệ thống
- logging và observability
- account recovery flow
- API documentation hoàn chỉnh hơn
- đánh giá chất lượng hệ thống sau khi đã có business flow

Mục tiêu ở đây không còn chỉ là "làm cho endpoint chạy", mà là:

- lỗi phải rõ
- log phải hữu ích
- flow nhạy cảm phải an toàn
- tài liệu API phải hỗ trợ dev và client team

Nếu đi hết Phase D tốt, bạn sẽ hiểu rõ hơn thế nào là một backend có thể maintain và support được.

---

## Phase D theo từng task

| Task | Học skill gì | Sai lầm hay gặp | Dấu hiệu đã hiểu thật |
| --- | --- | --- | --- |
| `01-error-logging` | Thiết kế error boundary, exception handling, structured logging, correlation thinking | Chỉ `throw` lỗi hoặc `console.log` rồi coi như xong | Biết lỗi nên được format, log, và truy vết thế nào để support/debug được |
| `02-swagger` | Nâng độ đầy đủ và rõ ràng của API contract, DTO docs, response docs | Có endpoint nhưng docs sơ sài, không phản ánh thật input/output/error cases | Biết Swagger là một phần của chất lượng backend chứ không chỉ là màn hình đẹp |
| `03-account-recovery` | Xây flow recovery nhạy cảm về security: reset password, token, expiry, invalidation | Làm recovery như một CRUD feature bình thường, bỏ qua expiry/reuse/revoke | Biết recovery là security flow, không chỉ là gửi email và đổi password |
| `04-phase-d-exit-gate` | Đánh giá backend ở góc độ readiness, maintainability, và quality | Tưởng có feature là đủ mà không nhìn vào vận hành và support | Biết dùng acceptance criteria để đánh giá độ trưởng thành của backend |

---

## Phase D practical map

| Task | Nên đọc file nào trước | Nên verify bằng gì | 1 câu hỏi tự kiểm tra hiểu bài |
| --- | --- | --- | --- |
| `01-error-logging` | `planning/todo/phase-d/01-error-logging.md`, `planning/setup/CONVENTIONS.md` phần error/logging, `planning/docs/CONTEXT.md`, các filter/logger/config files liên quan | Gây thử error path, xem response shape, log output, request correlation nếu có | "Backend cần log để hỗ trợ ai, và log nào mới thật sự hữu ích khi có sự cố?" |
| `02-swagger` | `planning/todo/phase-d/02-swagger.md`, controller/DTO files, Swagger decorators hiện có, conventions về API docs | Mở `/docs`, kiểm tra tag, request body, response, auth docs, error docs | "Docs hiện tại có đủ để một người khác dùng API mà không cần đoán không?" |
| `03-account-recovery` | `planning/todo/phase-d/03-account-recovery.md`, `CONTEXT.md` phần identity/recovery, auth module files, token/email related files | Test forgot/reset flow, invalid token, expired token, reused token, password change effect | "Vì sao password recovery phải được xem là một security boundary chứ không chỉ là một tiện ích người dùng?" |
| `04-phase-d-exit-gate` | `planning/todo/phase-d/04-phase-d-exit-gate.md`, toàn bộ artifact Phase D, review files của các task trước | Chạy lại verify chính cho logging, Swagger, recovery, rồi check acceptance criteria | "Nếu có incident production nhỏ xảy ra hôm nay, backend hiện tại có đủ rõ để debug và support không?" |

---

## Các backend concept bạn sẽ học sâu ở Phase D

### 1. Error handling as a system

Bạn sẽ học cách nhìn lỗi theo cấp hệ thống:

- lỗi validation
- lỗi business
- lỗi infra
- lỗi unexpected

Điểm quan trọng là:

- client nhận response có cấu trúc
- dev/support có log để tra
- lỗi không bị "nuốt" hoặc trả về mơ hồ

### 2. Logging and observability

Phase này giúp bạn hiểu:

- log để làm gì
- log ở đâu là đủ
- field nào nên có trong log
- vì sao correlation/request id quan trọng
- vì sao log đẹp chưa chắc log hữu ích

Đây là một trong những phần làm backend trưởng thành hơn rất nhiều.

### 3. Security-sensitive user flows

Account recovery dạy bạn cách nghĩ về:

- expiry
- one-time token
- replay/reuse risk
- revoke behavior
- side-effect sau khi đổi mật khẩu

Nếu bạn học kỹ phần này, tư duy security backend của bạn sẽ tiến bộ rõ rệt.

### 4. Documentation as backend quality

Swagger ở Phase D không còn là "có docs là đủ", mà là:

- docs có khớp implementation không
- error schema có rõ không
- auth flow có được mô tả đủ không
- người dùng API có thể dựa vào docs để tích hợp không

---

## Cách dùng file này với nestjs-mentor

Trước mỗi task Phase D:

1. đọc hàng tương ứng trong file này
2. mở file task thật trong `planning/todo/phase-d/`
3. đọc thêm `CONVENTIONS.md` và `CONTEXT.md` nếu task liên quan tới security, logging, hoặc contract

Khi làm xong task:

1. chạy verify của task
2. kiểm tra thêm theo cột verify trong file này
3. tự trả lời câu hỏi kiểm tra hiểu bài
4. sau đó mới close-out với mentor

---

## 3 dấu hiệu bạn đang học đúng ở Phase D

- bạn bắt đầu nghĩ tới người vận hành và người debug backend, không chỉ người viết code
- bạn nhìn security flow như một stateful process có rủi ro, không chỉ là endpoint
- bạn hiểu docs, logs, và error shape cũng là một phần của sản phẩm backend

---

## Kết luận ngắn

Nếu đi tốt hết Phase D, bạn sẽ tiến từ mức:

- backend có feature và business flow

lên gần mức:

- backend có chất lượng tốt hơn, dễ debug hơn, và đáng tin hơn khi vận hành

Đây là phase giúp bạn bớt giống người "viết API chạy được" và gần hơn với một backend engineer biết nghĩ về reliability.
