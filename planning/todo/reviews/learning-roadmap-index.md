# Learning Roadmap Index - NestJS Backend

File này là entrypoint để đọc lại toàn bộ roadmap học backend NestJS trong repo này.

Nếu bạn muốn xem nhanh:

- đang học phase nào
- phase đó rèn backend skill gì
- cần mở file roadmap nào trước

thì bắt đầu từ file này.

---

## Cách đọc bộ roadmap

Thứ tự khuyên dùng:

1. đọc phase hiện tại của bạn
2. chỉ nhìn sang phase tiếp theo khi phase hiện tại đã tương đối chắc
3. dùng roadmap như bản đồ học, không thay thế task file thật

Mỗi phase roadmap đều giúp bạn trả lời 4 câu hỏi:

1. phase này đang dạy mình năng lực backend gì?
2. từng task đang rèn skill gì?
3. nên đọc gì trước khi làm task?
4. nên verify và tự kiểm tra hiểu bài thế nào?

---

## Bộ roadmap hiện có

### Glossary and Concepts

File:

- [nestjs-and-backend-glossary-learning-map.md](./nestjs-and-backend-glossary-learning-map.md)

Bạn sẽ học:

- các thuật ngữ NestJS cốt lõi
- các khái niệm API/contract
- auth/security concepts
- database/persistence concepts
- business backend concepts
- reliability/operations concepts

Đây là file nên mở khi bạn gặp một từ hoặc khái niệm chưa hiểu rõ và muốn biết nó là gì, dùng để làm gì, và thường xuất hiện ở phase/task nào.

### Backend Self-Learning Roadmap

File:

- [backend-self-learning-roadmap.md](./backend-self-learning-roadmap.md)

Bạn sẽ học:

- thứ tự tự học backend từ nền tảng tới mức ship được
- từng giai đoạn nên học gì
- từng giai đoạn cần làm được gì
- dấu hiệu nào cho thấy bạn đã hiểu ổn

Đây là file nên mở khi bạn muốn nhìn bức tranh tự học backend rộng hơn repo hiện tại, rồi mới nối nó lại với roadmap theo phase của `be-nest-ecom`.

### Phase B - Foundation

File:

- [phase-b-learning-map.md](./phase-b-learning-map.md)

Bạn sẽ học:

- NestJS scaffold
- config/env validation
- Docker + Postgres
- Prisma schema + migrations
- validation pipe
- JWT, guards, decorators, auth flow
- users CRUD

Đây là phase dựng nền kỹ thuật và quy trình làm backend.

### Phase C - Business Backend

File:

- [phase-c-learning-map.md](./phase-c-learning-map.md)

Bạn sẽ học:

- catalog
- cart
- order
- payment
- domain modeling
- transaction thinking
- state transition
- idempotency

Đây là phase chuyển từ "biết framework" sang "biết làm business backend".

### Phase D - Quality and Reliability

File:

- [phase-d-learning-map.md](./phase-d-learning-map.md)

Bạn sẽ học:

- error handling
- logging/observability
- account recovery
- Swagger hoàn chỉnh hơn
- maintainability và support readiness

Đây là phase giúp backend đáng tin hơn và dễ vận hành hơn.

### Phase E - Testing and Ship

File:

- [phase-e-learning-map.md](./phase-e-learning-map.md)

Bạn sẽ học:

- testing by risk
- unit/integration/e2e mindset
- release readiness
- final verification
- ship mindset

Đây là phase giúp bạn biết khi nào backend thật sự đủ sẵn sàng để phát hành.

---

## Nên dùng bộ roadmap này như thế nào với nestjs-mentor

Trước khi bắt đầu một task:

1. mở file roadmap của phase tương ứng
2. đọc dòng task tương ứng
3. mở task file thật trong `planning/todo/<phase>/`
4. sau đó mới dùng `nestjs-mentor` để được hướng dẫn chi tiết

Sau khi hoàn thành một task:

1. verify theo task file
2. đối chiếu với learning map
3. dùng `nestjs-mentor` để close-out
4. để lại đủ artifact: task status, checklist, learning log, review note

---

## Nếu chỉ nhớ 1 điều

Roadmap file giúp bạn hiểu **vì sao** đang học task đó.

Task file giúp bạn biết **phải làm gì**.

Mentor skill giúp bạn biết **làm thế nào cho đúng và tự học được**.
