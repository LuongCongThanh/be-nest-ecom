# Phase C Learning Map - NestJS Backend

File này lưu roadmap học NestJS backend theo **Phase C** của repo này.

Nếu Phase B là phần dựng nền kỹ thuật, thì Phase C là phần dùng nền đó để xây **business backend thật**:

- catalog
- cart
- order
- payment

Mục tiêu của file này là giúp bạn thấy rõ:

- mỗi task đang rèn backend skill gì
- nên đọc gì trước
- nên verify bằng gì
- dấu hiệu nào cho thấy bạn đã hiểu thật

---

## Mục tiêu của Phase C

Phase C giúp bạn chuyển từ mức:

- biết NestJS, Prisma, auth, validation

sang mức:

- biết dùng những thứ đó để xây flow nghiệp vụ có trạng thái, ràng buộc, và side-effect

Đây là phase giúp bạn học các năng lực backend rất quan trọng:

- domain modeling
- transaction thinking
- state transition
- snapshot data
- stock consistency
- checkout flow
- payment integration thinking

Nếu đi hết Phase C tốt, bạn sẽ tiến gần hơn tới mức:

- không chỉ làm được API CRUD
- mà còn làm được business backend có logic thực sự

---

## Phase C theo từng task

| Task | Học skill gì | Sai lầm hay gặp | Dấu hiệu đã hiểu thật |
| --- | --- | --- | --- |
| `01-catalog-schema` | Model domain catalog theo business thay vì chỉ theo UI | Chia bảng theo màn hình hiển thị hoặc theo cảm tính | Nhìn catalog và tách được entity, relation, invariant hợp lý |
| `02-catalog-crud` | Xây module CRUD có contract, validation, filter, pagination đúng kiểu backend | Tập trung vào create/read mà quên update/delete rules, response shape, validation consistency | Biết catalog API không chỉ là ghi DB mà còn là giữ contract ổn định |
| `03-cart` | Tư duy cart như một domain mutable có lifecycle và edge cases | Xem cart như list item đơn giản, bỏ qua merge/quantity/price drift | Giải thích được vì sao cart cần rule riêng, không thể xem như order tạm |
| `04-order` | Checkout, snapshot, stock deduction, transaction boundary, state machine cơ bản | Làm order theo kiểu read-then-write rời rạc, thiếu atomicity | Biết order creation là business transaction, không phải CRUD đơn thuần |
| `05-payment` | Payment flow thinking: init payment, callback/webhook, state sync, idempotency | Gắn payment trực tiếp vào order mà không nghĩ tới retry, duplicate callback, mismatch state | Biết payment là integration boundary và cần thiết kế idempotent |
| `06-phase-c-exit-gate` | Tự đánh giá business foundation đã đủ chắc để sang polish phase chưa | Thấy endpoint chạy được là kết luận xong | Dùng acceptance criteria để chứng minh business flow đã đúng, không chỉ “chạy” |

---

## Phase C practical map

| Task | Nên đọc file nào trước | Nên verify bằng gì | 1 câu hỏi tự kiểm tra hiểu bài |
| --- | --- | --- | --- |
| `01-catalog-schema` | `planning/todo/phase-c/01-catalog-schema.md`, `planning/docs/CONTEXT.md`, `planning/setup/CONVENTIONS.md`, `prisma/schema.prisma` | Validate schema, review relation/index/naming, generate nếu task yêu cầu | "Schema này đang bảo vệ business rule nào của catalog?" |
| `02-catalog-crud` | `planning/todo/phase-c/02-catalog-crud.md`, catalog module files, DTO, controller/service, shared pagination conventions | Gọi thử create/list/detail/update paths, check validation, pagination, response shape | "Catalog CRUD này đang giữ contract backend nào ổn định cho client?" |
| `03-cart` | `planning/todo/phase-c/03-cart.md`, `CONTEXT.md` phần Cart/Guest Cart/Cart Merge, module cart liên quan | Test add item, update quantity, remove item, merge behavior, invalid stock cases | "Vì sao cart phải được xem là domain riêng chứ không chỉ là mảng item?" |
| `04-order` | `planning/todo/phase-c/04-order.md`, `CONTEXT.md` phần Order/OrderItem/Stock/Order Math Formula, service transaction files | Test checkout, stock deduction, snapshot creation, invalid quantity, order state ban đầu | "Vì sao create order phải atomic thay vì tách thành nhiều bước rời?" |
| `05-payment` | `planning/todo/phase-c/05-payment.md`, `CONTEXT.md` phần payment/order lifecycle, module payment/order liên quan | Test payment init, callback/webhook path, duplicate request handling, order state update | "Vì sao payment callback phải được xử lý theo kiểu idempotent?" |
| `06-phase-c-exit-gate` | `planning/todo/phase-c/06-phase-c-exit-gate.md`, tất cả artifact Phase C, review files trước đó | Chạy lại verify chính của catalog/cart/order/payment và check acceptance criteria | "Nếu ship MVP commerce lúc này, flow nghiệp vụ nào còn rủi ro nhất?" |

---

## Các backend concept bạn sẽ học sâu ở Phase C

### 1. Domain modeling

Bạn sẽ học cách mô hình hóa:

- Product
- Category
- Cart
- CartItem
- Order
- OrderItem
- Payment

Điểm quan trọng không phải là tạo bảng cho đủ, mà là hiểu:

- entity nào mutable
- entity nào immutable sau một mốc nào đó
- dữ liệu nào nên snapshot
- dữ liệu nào nên tham chiếu

### 2. Transaction thinking

Phase C bắt đầu buộc bạn nghĩ như backend developer thật:

- khi nào phải dùng transaction
- bước nào phải atomic
- vì sao read-then-write rời rạc có thể gây bug
- vì sao stock/order/payment thường là vùng nhạy cảm nhất

### 3. State and lifecycle

Bạn sẽ đụng nhiều hơn tới khái niệm state machine:

- cart có lifecycle riêng
- order có status transition
- payment có callback/update lifecycle

Đây là chỗ rất nhiều người học NestJS bỏ qua vì họ chỉ học controller/service syntax.

### 4. Idempotency and retry safety

Từ Phase C trở đi, backend bắt đầu cần chịu được:

- request gửi lại
- callback trùng
- race condition cơ bản

Nếu bạn hiểu tốt phần này, tư duy backend của bạn sẽ lên rất nhanh.

---

## Cách dùng file này với nestjs-mentor

Trước mỗi task Phase C:

1. đọc hàng tương ứng trong file này
2. mở file task thật trong `planning/todo/phase-c/`
3. đọc glossary/rules liên quan trong `CONTEXT.md` và `CONVENTIONS.md`

Khi làm xong task:

1. chạy verify của task
2. đối chiếu với cột verify trong file này
3. tự trả lời câu hỏi kiểm tra hiểu bài
4. sau đó mới dùng mentor để close-out task

---

## 3 dấu hiệu bạn đang học đúng ở Phase C

- bạn không còn xem backend chỉ là CRUD, mà bắt đầu nhìn thấy flow và invariant
- bạn tự hỏi "đoạn nào cần atomic, đoạn nào có thể tách"
- bạn biết business bug nguy hiểm thường nằm ở state, stock, payment, không chỉ ở syntax

---

## Kết luận ngắn

Nếu đi tốt hết Phase C, bạn sẽ nâng level từ:

- người có nền NestJS backend

lên gần mức:

- người có thể xây business module backend có logic, rule, và transaction thinking

Đây là phase rất quan trọng để chuyển từ "biết framework" sang "biết làm backend sản phẩm thật".
