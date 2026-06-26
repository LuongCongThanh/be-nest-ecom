# NestJS and Backend Glossary Learning Map

File này gom các thuật ngữ NestJS và backend quan trọng để học cùng `nestjs-mentor`.

Mục tiêu của file này không phải thay thế:

- `planning/docs/CONTEXT.md`
- `planning/setup/CONVENTIONS.md`
- các task file trong `planning/todo/`

Nó là một **learning map** để giúp bạn đọc hiểu:

- thuật ngữ là gì
- vì sao nó quan trọng
- thường gặp ở phase/task nào
- dấu hiệu nào cho thấy bạn đã hiểu thật

---

## Cách dùng file này

Khi gặp một thuật ngữ lạ:

1. tra nhanh trong file này để lấy nghĩa ngắn
2. đọc tiếp glossary/spec gốc được liên kết trong task
3. dùng `nestjs-mentor` để hỏi theo ngữ cảnh task hiện tại
4. nếu vẫn mơ hồ về bức tranh lớn, dùng `zoom-out`

---

## Nhóm 1 - NestJS core concepts

| Thuật ngữ                   | Định nghĩa ngắn                                                              | Vì sao cần                                                           | Thường gặp ở phase/task                   | Dấu hiệu đã hiểu thật                                                                    |
| --------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Module`                    | Đơn vị tổ chức tính năng trong NestJS, gom provider/controller/import/export | Giúp app chia theo feature và quản lý dependency rõ ràng             | Phase B Task 01, gần như mọi task sau đó  | Bạn giải thích được vì sao `UsersModule` tồn tại thay vì nhét mọi thứ vào `AppModule`    |
| `Controller`                | Lớp nhận HTTP request và trả response                                        | Tách HTTP layer khỏi business logic                                  | Phase B Task 01, Task 12, Task 14         | Bạn biết controller nên mỏng và không gánh business logic nặng                           |
| `Service`                   | Lớp chứa business logic hoặc orchestration logic                             | Giữ controller sạch và giúp code test được hơn                       | Phase B Task 01 trở đi                    | Bạn biết khi nào logic nên ở service thay vì controller                                  |
| `Provider`                  | Thành phần có thể được NestJS inject, thường là service/repository/helper    | Là nền của Dependency Injection                                      | Phase B Task 01, Task 04, Task 10+        | Bạn hiểu `@Injectable()` không chỉ là syntax mà là để DI container quản lý instance      |
| `Dependency Injection (DI)` | Cách NestJS cấp dependency cho class thay vì class tự tạo dependency         | Giảm coupling, dễ test, dễ thay thế implementation                   | Phase B Task 01, `CONVENTIONS.md` phần DI | Bạn giải thích được vì sao inject `ConfigService` tốt hơn tự new một config helper       |
| `Decorator`                 | Annotation metadata như `@Controller()`, `@Injectable()`, `@Get()`           | Giúp NestJS biết class/method đóng vai trò gì                        | Phase B Task 01, Task 11                  | Bạn biết decorator đang mô tả hành vi/framework contract, không phải “ma thuật” vô nghĩa |
| `Guard`                     | Lớp chặn hoặc cho request đi tiếp dựa trên điều kiện auth/role/public        | Bảo vệ route theo kiểu cross-cutting                                 | Phase B Task 11, Task 12, Task 13         | Bạn biết guard tốt hơn check auth rải rác trong từng handler                             |
| `Pipe`                      | Cơ chế biến đổi hoặc validate dữ liệu đầu vào trước khi vào handler          | Chặn dữ liệu xấu ở boundary                                          | Phase B Task 09                           | Bạn hiểu pipe giúp bảo vệ input toàn cục, không chỉ “check field”                        |
| `Exception Filter`          | Lớp bắt lỗi và chuẩn hóa response lỗi                                        | Làm error handling có hệ thống                                       | Phase D Task 01                           | Bạn giải thích được vì sao backend cần response lỗi nhất quán                            |
| `Interceptor`               | Lớp bao quanh request/response để thêm xử lý chung                           | Dùng cho logging, transform response, timing, cross-cutting concerns | Thường gặp từ Phase D trở đi              | Bạn biết interceptor khác guard và pipe ở chỗ nào                                        |
| `Middleware`                | Lớp xử lý request sớm trong pipeline trước guard/controller                  | Dùng cho logging, header, context setup                              | Phase B Task 01, Phase D Task 01          | Bạn hiểu middleware phù hợp cho concern nào hơn guard                                    |
| `DTO`                       | Data Transfer Object, class mô tả shape dữ liệu input/output                 | Giúp validation, docs, type-safety, contract rõ                      | Phase B Task 09, Task 12, Task 14         | Bạn biết DTO là contract boundary, không phải chỉ là “type cho đẹp”                      |
| `ConfigService`             | Service đọc config tập trung thay vì dùng `process.env` bừa bãi              | Giúp fail-fast và giữ config discipline                              | Phase B Task 02                           | Bạn giải thích được vì sao config phải tập trung                                         |
| `Global Prefix`             | Prefix chung cho business API, ví dụ `/api/v1`                               | Giữ versioning và API structure rõ ràng                              | Phase B Task 01, `CONVENTIONS.md`         | Bạn biết vì sao `/health` có thể nằm ngoài prefix còn business endpoint thì không        |

---

## Nhóm 2 - API and contract concepts

| Thuật ngữ                    | Định nghĩa ngắn                                                   | Vì sao cần                                       | Thường gặp ở phase/task            | Dấu hiệu đã hiểu thật                                                   |
| ---------------------------- | ----------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------- | ----------------------------------------------------------------------- |
| `Swagger / OpenAPI`          | Tài liệu máy đọc được cho API, thường hiển thị qua Swagger UI     | Giúp client/dev hiểu và tích hợp API             | Phase B Task 02b, Phase D Task 02  | Bạn phân biệt được docs với endpoint runtime thật                       |
| `Validation`                 | Kiểm tra dữ liệu request có hợp lệ không                          | Chặn input xấu và giảm bug xuống business layer  | Phase B Task 09                    | Bạn hiểu validation là trách nhiệm boundary, không phải vá lỗi sau      |
| `Whitelist`                  | Chỉ cho phép field được khai báo đi qua                           | Chống field thừa và mass assignment              | Phase B Task 09, `CONVENTIONS.md`  | Bạn biết vì sao input “dư field” vẫn nguy hiểm dù app có thể bỏ qua     |
| `Forbidden non-whitelisted`  | Báo lỗi khi client gửi field không được phép                      | Làm contract chặt hơn, fail sớm hơn              | Phase B Task 09                    | Bạn hiểu vì sao reject tốt hơn silently ignore trong nhiều case backend |
| `Pagination`                 | Chia list response thành page/limit/meta                          | Tránh trả dữ liệu vô hạn và giữ contract ổn định | Phase C Task 02                    | Bạn biết pagination là contract API chứ không chỉ query DB              |
| `Idempotency Key`            | Key để request retry mà không tạo side-effect lặp                 | Chống double-submit ở checkout/payment           | Phase C Task 04-05, `CONTEXT.md`   | Bạn giải thích được vì sao payment/checkout cần idempotent              |
| `HTTP 422 Validation Failed` | Mã lỗi chuẩn cho input hợp lệ về format request nhưng sai dữ liệu | Giữ error schema rõ cho frontend                 | `CONVENTIONS.md` phần error schema | Bạn biết khi nào nên trả 422 thay vì 500 hoặc 400 mơ hồ                 |

---

## Nhóm 3 - Authentication and security concepts

| Thuật ngữ              | Định nghĩa ngắn                                        | Vì sao cần                                              | Thường gặp ở phase/task                     | Dấu hiệu đã hiểu thật                                                    |
| ---------------------- | ------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `Authentication`       | Xác minh người dùng là ai                              | Là bước đầu để bảo vệ hệ thống                          | Phase B Task 10-13                          | Bạn phân biệt được authentication với authorization                      |
| `Authorization`        | Quyết định người dùng được làm gì                      | Bảo vệ hành động theo role/quyền                        | Phase B Task 11-14                          | Bạn biết login thành công chưa có nghĩa là được làm mọi thứ              |
| `JWT`                  | Token chứa claims đã ký để xác minh request            | Giúp auth API-first hoạt động hiệu quả                  | Phase B Task 10-13                          | Bạn hiểu JWT là cách hiện thực auth/session chứ không phải mục tiêu cuối |
| `Access Token`         | Token sống ngắn dùng cho request bình thường           | Giảm blast radius nếu token bị lộ                       | `CONTEXT.md`, Phase B Task 10-13            | Bạn biết vì sao access token không nên sống quá lâu                      |
| `Refresh Token`        | Token sống dài hơn để xin access token mới             | Cân bằng giữa security và UX                            | Phase B Task 13                             | Bạn biết refresh token không chỉ là “token dài hạn” mà là một flow riêng |
| `Refresh Token Family` | Chuỗi refresh token được rotate từ một phiên đăng nhập | Giúp revoke theo family khi phát hiện compromise        | `CONTEXT.md`, Phase B Task 13               | Bạn giải thích được vì sao phải kill cả family khi reuse thật sự         |
| `Rotation`             | Đổi refresh token cũ lấy token mới mỗi lần refresh     | Giảm nguy cơ reuse/token leak                           | Phase B Task 13                             | Bạn hiểu vì sao refresh cũ không nên dùng mãi                            |
| `Public Route`         | Route không yêu cầu JWT                                | Cho phép login/register/docs/health hoạt động công khai | Phase B Task 11-12                          | Bạn biết vì sao mô hình “protected by default” an toàn hơn               |
| `Roles`                | Vai trò như `USER`, `STAFF`, `ADMIN`                   | Kiểm soát access theo domain responsibility             | `CONTEXT.md`, Phase B Task 11, 14           | Bạn biết role khác permission string tự phát thế nào                     |
| `Password Recovery`    | Flow reset mật khẩu bằng token một lần                 | Bảo vệ người dùng khi quên mật khẩu                     | Phase D Task 03                             | Bạn biết đây là security flow, không phải tiện ích CRUD                  |
| `Rate Limiting`        | Giới hạn số request theo IP/user                       | Giảm abuse và brute-force                               | `CONVENTIONS.md` phần throttling, Phase D/E | Bạn biết auth/payment endpoint cần limit chặt hơn endpoint thường        |

---

## Nhóm 4 - Database and persistence concepts

| Thuật ngữ        | Định nghĩa ngắn                                            | Vì sao cần                                         | Thường gặp ở phase/task                     | Dấu hiệu đã hiểu thật                                                           |
| ---------------- | ---------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------- |
| `Prisma`         | ORM/client để làm việc với database trong TypeScript       | Tăng type-safety và giảm boilerplate query         | Phase B Task 04-06                          | Bạn biết Prisma là bridge giữa code và DB, không phải DB thay thế               |
| `Schema`         | Mô tả model, field, relation, constraint trong Prisma      | Là bản thiết kế dữ liệu của hệ thống               | Phase B Task 05                             | Bạn biết schema phản ánh domain chứ không chỉ phản ánh form UI                  |
| `Migration`      | Lịch sử thay đổi schema DB theo từng bước                  | Giúp thay đổi DB có kiểm soát và review được       | Phase B Task 06                             | Bạn biết vì sao migration phải commit                                           |
| `Seed Data`      | Dữ liệu khởi tạo phục vụ dev/test/demo                     | Giúp verify flow nhanh hơn                         | Phase B Task 08                             | Bạn biết seed để phục vụ flow nào, không seed vô tội vạ                         |
| `Repository`     | Lớp gom data access logic đủ phức tạp cho module           | Tách query logic khỏi service khi cần              | `CONVENTIONS.md` phần repository, Phase B/C | Bạn biết khi nào nên có repository, khi nào service dùng Prisma trực tiếp là đủ |
| `Transaction`    | Nhóm nhiều thay đổi DB thành một đơn vị atomic             | Tránh trạng thái nửa chừng khi flow lỗi giữa chừng | Phase C Task 04-05                          | Bạn biết checkout/order/payment là vùng cần transaction                         |
| `Atomicity`      | Hoặc mọi bước cùng thành công, hoặc cùng rollback          | Bảo vệ consistency                                 | Phase C Task 04                             | Bạn biết vì sao create order không nên tách thành nhiều save rời rạc            |
| `Row-level Lock` | Khóa mức dòng khi cập nhật tài nguyên cạnh tranh như stock | Giảm oversell/race condition                       | `CONVENTIONS.md`, Phase C Task 04           | Bạn biết stock là vùng nhạy cảm với concurrent requests                         |
| `Soft Delete`    | Đánh dấu xóa bằng `deletedAt` thay vì xóa vật lý ngay      | Giữ audit/history và tránh mất dữ liệu quan trọng  | `CONTEXT.md`, `CONVENTIONS.md`, nhiều task  | Bạn biết soft delete khác deactivate và khác hard delete                        |

---

## Nhóm 5 - Business backend concepts

| Thuật ngữ                     | Định nghĩa ngắn                                            | Vì sao cần                                        | Thường gặp ở phase/task          | Dấu hiệu đã hiểu thật                                                |
| ----------------------------- | ---------------------------------------------------------- | ------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------- |
| `Domain`                      | Vùng nghiệp vụ mà backend đang giải quyết                  | Giúp code bám business thay vì chỉ bám endpoint   | Phase C trở đi                   | Bạn nhìn feature theo business language, không chỉ theo route        |
| `Invariant`                   | Điều luôn phải đúng trong hệ thống                         | Giữ backend không rơi vào trạng thái sai âm thầm  | `CONTEXT.md`, nhiều task         | Bạn bắt đầu hỏi “điều gì không được phép sai ở đây?”                 |
| `Cart`                        | Trạng thái mua sắm mutable trước checkout                  | Có rule riêng, không thể xem như order tạm        | Phase C Task 03                  | Bạn biết cart merge/stock drift làm nó phức tạp hơn list item thường |
| `Order`                       | Bản ghi giao dịch đã chốt, có lifecycle và giá trị pháp lý | Là business entity trung tâm của commerce backend | Phase C Task 04                  | Bạn biết order không phải CRUD thuần                                 |
| `Order Status`                | Trạng thái lifecycle của order như `PENDING`, `PAID`       | Kiểm soát business transition đúng luật           | `CONTEXT.md`, Phase C Task 04-05 | Bạn biết vì sao status không thể là string tự do                     |
| `Snapshot`                    | Bản sao đóng băng dữ liệu tại thời điểm nghiệp vụ xảy ra   | Giữ historical truth khi dữ liệu nguồn thay đổi   | `CONTEXT.md`, Phase C Task 04    | Bạn giải thích được vì sao order cần snapshot address/product        |
| `Stock Deduction`             | Trừ tồn kho khi checkout theo quy tắc đã chốt              | Bảo vệ consistency hàng tồn                       | `CONTEXT.md`, Phase C Task 04    | Bạn biết trừ kho lúc nào là một quyết định nghiệp vụ quan trọng      |
| `Payment Callback/Webhook`    | Tín hiệu từ cổng thanh toán quay lại hệ thống              | Đồng bộ trạng thái thanh toán với backend         | Phase C Task 05                  | Bạn hiểu callback trùng hoặc đến muộn vẫn phải xử lý an toàn         |
| `Idempotent Payment Handling` | Xử lý callback/retry mà không nhân đôi side-effect         | Tránh double-paid/double-order/double-update      | Phase C Task 05                  | Bạn biết vì sao payment integration luôn phải nghĩ tới retry         |
| `Account Recovery`            | Luồng khôi phục quyền truy cập tài khoản                   | Là điểm nhạy cảm về security và trust             | Phase D Task 03                  | Bạn biết recovery phải có expiry, invalidation, one-time token       |

---

## Nhóm 6 - Reliability and operations concepts

| Thuật ngữ                     | Định nghĩa ngắn                                                     | Vì sao cần                                      | Thường gặp ở phase/task           | Dấu hiệu đã hiểu thật                                                   |
| ----------------------------- | ------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------- |
| `Structured Logging`          | Log có field rõ ràng thay vì text rời rạc                           | Dễ search, debug, và phân tích hơn              | `CONVENTIONS.md`, Phase D Task 01 | Bạn biết log hữu ích cần field gì chứ không chỉ cần “nhiều log”         |
| `Correlation ID / Request ID` | ID gắn xuyên suốt một request                                       | Giúp trace flow qua log                         | `CONVENTIONS.md`, Phase D Task 01 | Bạn hiểu vì sao request lỗi cần được nối thành một trace                |
| `Observability`               | Khả năng nhìn thấy và hiểu hành vi hệ thống qua logs/metrics/traces | Giúp debug và vận hành backend                  | Phase D Task 01                   | Bạn biết backend chạy được vẫn có thể “mù” nếu thiếu observability      |
| `Health Check`                | Endpoint báo app có sống và sẵn sàng không                          | Hỗ trợ deploy/orchestration/monitoring          | `CONVENTIONS.md`, Phase B/D/E     | Bạn biết `live` khác `ready` ở mục đích gì                              |
| `Readiness`                   | App đủ điều kiện nhận traffic                                       | Tránh nhận request khi dependency chưa sẵn sàng | `CONVENTIONS.md` phần health      | Bạn biết readiness không giống “process còn chạy”                       |
| `Quality Gate`                | Tập hợp điều kiện phải pass trước khi merge/ship                    | Giảm rủi ro phát hành                           | `CONVENTIONS.md`, Phase E         | Bạn biết lint/build/test có vai trò gì trong quyết định ship            |
| `E2E Test`                    | Test đi qua luồng gần với thực tế nhất                              | Bảo vệ flow nghiệp vụ quan trọng                | `CONVENTIONS.md`, Phase E Task 01 | Bạn biết không phải mọi thứ đều cần e2e, nhưng luồng quan trọng thì cần |
| `Release Readiness`           | Mức sẵn sàng để ship dựa trên bằng chứng verify                     | Biến việc ship thành quyết định có cơ sở        | Phase E Task 02                   | Bạn biết “chạy local được” chưa đủ để gọi là sẵn sàng ship              |

---

## Khi nào nên dùng zoom-out cùng nestjs-mentor

Nên dùng `zoom-out` khi bạn hiểu nghĩa của từ rồi nhưng chưa hiểu nó nằm ở đâu trong hệ thống.

Ví dụ:

- hiểu `Guard` là gì nhưng chưa biết guard nào đang bảo vệ module nào
- hiểu `Order` là gì nhưng chưa thấy quan hệ giữa cart, order, payment
- hiểu `ConfigService` là gì nhưng chưa biết config chảy từ đâu tới đâu

Nói ngắn:

- `nestjs-mentor` giúp bạn hiểu để làm task
- `zoom-out` giúp bạn hiểu thuật ngữ đó trong bản đồ hệ thống lớn hơn

---

## Nếu chỉ nhớ 1 điều

Một thuật ngữ backend chỉ được xem là "hiểu thật" khi bạn trả lời được 3 câu:

1. nó là gì?
2. nó dùng để làm gì?
3. nếu bỏ nó đi hoặc làm sai nó, hệ thống sẽ hỏng ở đâu?
