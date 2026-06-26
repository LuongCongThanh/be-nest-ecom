# Backend Self-Learning Roadmap

File này lưu một roadmap tự học Backend theo hướng thực chiến.

Mục tiêu của roadmap này không phải là học thuộc framework, mà là học theo thứ tự giúp bạn:

- hiểu backend đang giải quyết vấn đề gì
- biết cách xây API và dữ liệu cho đúng
- biết cách xử lý auth, business flow, và lỗi
- biết khi nào một backend đủ tin cậy để ship

---

## Nếu chỉ nhớ 1 dòng

Roadmap học Backend nên đi theo thứ tự:

`HTTP -> Database -> CRUD -> Auth -> Business Flow -> Testing/Logging/Deploy -> Architecture`

---

## Tổng quan roadmap

1. Nền tảng lập trình và HTTP
2. Database và data modeling
3. Xây API CRUD chuẩn
4. Auth và security cơ bản
5. Business flow thật
6. Testing, logging, deployment
7. Kiến trúc và tư duy backend nâng cao

---

## Backend có những kiểu hệ thống gì?

Khi học Backend, không nên chỉ chia theo `OOP` hay `không OOP`.

`OOP` chỉ là **một cách tổ chức code**. Nó không phải cách phân loại hệ thống backend quan trọng nhất.

Thực tế, backend thường được nhìn theo nhiều góc:

### 1. Chia theo loại bài toán hệ thống

- `CRUD system`: quản lý dữ liệu là chính, ví dụ admin, CMS, user management
- `workflow/business system`: có flow nghiệp vụ nhiều bước, ví dụ order, payment, booking
- `real-time system`: chat, live update, notification, websocket
- `data-processing system`: batch job, ETL, report, analytics
- `integration system`: làm cầu nối giữa nhiều service hoặc API khác nhau

Phần lớn project thật là sự pha trộn của nhiều loại, không chỉ một loại duy nhất.

### 2. Chia theo kiến trúc triển khai

- `monolith`: một backend chính, một codebase chính
- `modular monolith`: vẫn là một app nhưng chia module rõ
- `microservices`: chia thành nhiều service nhỏ
- `event-driven system`: giao tiếp qua event, queue, pub/sub nhiều
- `serverless backend`: chia logic theo function hoặc cloud runtime nhỏ

Nếu đang tự học, nên bắt đầu từ:

- `monolith` hoặc `modular monolith`

rồi mới học tiếp `microservices`.

### 3. Chia theo cách tổ chức code

- `procedural`: code theo hàm hoặc luồng xử lý đơn giản
- `OOP-oriented`: tổ chức theo class như controller, service, repository, entity
- `functional-leaning`: ưu tiên pure function, composition, immutable thinking
- `hybrid`: trộn nhiều cách, đây là kiểu phổ biến nhất trong project thực tế

NestJS thường thiên về:

- `OOP + Dependency Injection + module-based`

Nhưng backend tốt không bắt buộc phải thuần OOP. Điều quan trọng hơn là:

- boundary rõ
- dependency rõ
- business rule rõ

### 4. Chia theo độ phức tạp nghiệp vụ

- `simple CRUD backend`
- `domain-rich backend`
- `distributed backend`

Đây là cách chia rất hữu ích khi tự học, vì roadmap học cũng nên đi từ đơn giản đến phức tạp như vậy.

### 5. Chia theo style kiến trúc code

- `layered architecture`
- `clean architecture`
- `DDD-lite / domain-oriented`
- `hexagonal / ports-and-adapters`

Nếu học backend theo hướng thực chiến, nên đi theo thứ tự:

1. `layered architecture`
2. `modular monolith`
3. `DDD-lite` khi domain bắt đầu phức tạp
4. chỉ học sâu `microservices` hoặc `hexagonal` khi đã có nền đủ chắc

### Kết luận ngắn

Backend không được chia chủ yếu theo `OOP` hay không.

Nó thường được hiểu tốt hơn nếu nhìn theo:

- loại bài toán
- kiến trúc triển khai
- cách tổ chức code
- độ phức tạp nghiệp vụ

`OOP` chỉ là một công cụ tổ chức code trong số nhiều công cụ.

### Bảng nhìn nhanh

| Kiểu hệ thống                | Ví dụ thực tế                                            | Nên học khi nào                                               |
| ---------------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `CRUD system`                | user management, CMS, admin panel                        | học đầu tiên                                                  |
| `workflow/business system`   | order, payment, booking                                  | sau khi đã vững CRUD và DB                                    |
| `real-time system`           | chat, live notification, tracking                        | sau khi đã vững HTTP/backend cơ bản                           |
| `data-processing system`     | report job, ETL, analytics pipeline                      | khi đã hiểu DB, batch, queue cơ bản                           |
| `integration system`         | sync nhiều API, webhook hub, third-party bridge          | khi đã quen auth, retry, error handling                       |
| `monolith`                   | một app backend chính                                    | rất nên học đầu tiên                                          |
| `modular monolith`           | một app nhưng chia `users`, `auth`, `orders`, `payments` | nên học rất sớm, phù hợp nhất cho project thực chiến đầu tiên |
| `microservices`              | auth service, order service, payment service tách riêng  | chỉ nên học khi đã có nền monolith chắc                       |
| `event-driven system`        | xử lý qua queue, event bus, pub/sub                      | học sau khi đã hiểu transaction và side-effect                |
| `OOP-oriented backend`       | NestJS app với controller/service/provider rõ ràng       | phù hợp để học sớm nếu theo NestJS                            |
| `functional-leaning backend` | service logic nhiều pure function và composition         | học dần sau khi đã vững backend cơ bản                        |
| `DDD-lite backend`           | backend chia theo domain, bounded context, invariants    | học khi business flow bắt đầu phức tạp                        |

---

## Giai đoạn 1 - Nền tảng

### Mục tiêu

Hiểu backend đang phục vụ cái gì và request chạy như thế nào.

### Nên học

- HTTP
- REST
- request/response
- status code
- JSON
- header
- cookie
- token
- Node.js runtime
- async/await
- Promise
- TypeScript cơ bản nếu đi với NestJS
- cấu trúc app: route, controller, service

### Bạn cần làm được

- viết API `GET/POST/PUT/DELETE`
- đọc request body, query, params
- trả response đúng mã lỗi và đúng shape

### Dấu hiệu đã ổn

Bạn giải thích được request đi từ client vào backend như thế nào.

---

## Giai đoạn 2 - Database

### Mục tiêu

Hiểu dữ liệu là nền của backend, không phải phần phụ.

### Nên học

- SQL cơ bản: `select`, `insert`, `update`, `delete`, `join`
- quan hệ `1-1`, `1-n`, `n-n`
- primary key
- foreign key
- unique
- nullable
- index
- soft delete
- ORM như Prisma hoặc TypeORM

### Bạn cần làm được

- thiết kế schema cho `user`, `product`, `order`
- biết khi nào nên thêm index
- phân biệt entity nào mutable, entity nào nên snapshot

### Dấu hiệu đã ổn

Nhìn một bài toán business và phác ra được schema hợp lý.

---

## Giai đoạn 3 - CRUD chuẩn

### Mục tiêu

Luyện tay xây backend có contract rõ ràng, không chỉ lưu dữ liệu vào DB.

### Nên học

- DTO
- validation
- pagination
- filtering
- sorting
- error handling
- response contract
- Swagger/OpenAPI

### Bạn cần làm được

- một module CRUD hoàn chỉnh như `users`, `categories`, `products`
- input sai bị chặn đúng
- docs API đọc được

### Dấu hiệu đã ổn

Bạn không còn viết CRUD kiểu “save vào DB là xong”.

---

## Giai đoạn 4 - Auth và security

### Mục tiêu

Chuyển từ API demo sang backend thật có kiểm soát truy cập.

### Nên học

- authentication vs authorization
- JWT
- access token
- refresh token
- password hashing
- guards
- decorators
- roles
- rate limiting
- validation và sanitize input

### Bạn cần làm được

- login/register/profile
- protected route
- role-based access
- refresh token flow cơ bản

### Dấu hiệu đã ổn

Bạn hiểu auth là một flow trạng thái, không chỉ là cấp token.

---

## Giai đoạn 5 - Business flow thật

### Mục tiêu

Bắt đầu làm backend có logic nghiệp vụ thật, không chỉ CRUD.

### Nên học

- cart
- checkout
- order
- payment
- transaction
- idempotency
- state machine
- stock consistency
- snapshot dữ liệu

### Bạn cần làm được

- flow `cart -> order -> payment`
- tránh double-submit
- tránh read-then-write nguy hiểm
- giữ order/state đúng khi có lỗi giữa chừng

### Dấu hiệu đã ổn

Bạn bắt đầu hỏi: “invariant nào không được phá?”

---

## Giai đoạn 6 - Chất lượng và vận hành

### Mục tiêu

Hiểu rằng backend mạnh không chỉ là có feature.

### Nên học

- unit test
- integration test
- e2e test
- logging
- correlation id
- health check
- config/env discipline
- Docker
- CI cơ bản
- deploy cơ bản

### Bạn cần làm được

- test flow quan trọng
- log đủ để debug
- app có health endpoint
- chạy local bằng Docker
- biết verify trước khi ship

### Dấu hiệu đã ổn

Bạn không còn coi “chạy local được” là done.

---

## Giai đoạn 7 - Kiến trúc và tư duy backend nâng cao

### Mục tiêu

Nhìn backend như một hệ thống, không phải tập hợp endpoint rời rạc.

### Nên học

- module boundaries
- dependency injection
- repository pattern
- service vs domain logic
- clean architecture / DDD ở mức vừa đủ
- caching
- queue/job
- file upload
- email flow
- observability nâng cao

### Bạn cần làm được

- tách module rõ
- giảm coupling
- biết khi nào refactor
- biết chỗ nào cần queue hoặc cache

### Dấu hiệu đã ổn

Bạn nhìn backend như một hệ thống, không phải tập hợp endpoint.

---

## Thứ tự học khuyên dùng nếu theo NestJS

1. NestJS scaffold + module/controller/service
2. Config/env
3. Postgres + Prisma
4. CRUD + validation + Swagger
5. Auth + JWT + guards
6. Order/cart/payment flow
7. Logging + testing + ship
8. Refactor kiến trúc khi code đủ lớn

---

## Project tự học nên làm

Làm 3 project theo độ khó tăng dần:

1. `Task API`
2. `Blog API`
3. `E-commerce API`

### Trong `E-commerce API`, nên có

- auth
- product/category
- cart
- order
- payment mock
- logging
- testing cơ bản

---

## Nguyên tắc học nhanh nhưng chắc

- học ít nhưng build thật
- mỗi phase phải có project nhỏ
- luôn học song song `code + DB + verify`
- đọc lỗi nhiều
- sau mỗi feature tự hỏi:
  - input bẩn thì sao?
  - request lặp thì sao?
  - 2 user cùng bấm thì sao?
  - DB fail giữa chừng thì sao?

---

## Tóm tắt cuối

Backend quan trọng nhất không phải là framework.

Điều quan trọng nhất là:

- giữ dữ liệu đúng
- giữ business rule đúng
- biết hệ thống sẽ hỏng ở đâu nếu thiết kế sai
- biết verify trước khi tin là đã xong

Nếu học theo roadmap này một cách đều đặn, bạn sẽ đi từ mức:

- biết viết API

đến mức:

- biết xây một backend có dữ liệu, logic, auth, test, và khả năng ship tốt hơn
