# Phase B Learning Map - NestJS Backend

File này lưu lại roadmap học NestJS backend theo **Phase B** của repo này, để có thể đọc lại nhanh mà không cần mở lại toàn bộ chat.

Nó không thay thế cho:

- `planning/todo/README.md`
- các file task trong `planning/todo/phase-b/`
- checklist từng task
- review file sau khi hoàn thành task

Nó là một **bản đồ học tập**: học gì, đọc gì trước, verify ra sao, và tự kiểm tra mức hiểu bài thế nào.

---

## Mục tiêu của Phase B

Phase B giúp xây nền backend bằng NestJS theo hướng làm việc thực tế:

- hiểu cấu trúc app NestJS
- biết quản lý config/env đúng cách
- biết làm việc với Docker, Postgres, Prisma
- biết validation, auth, guards, decorators
- biết verify trước khi coi một task là done

Nếu đi hết Phase B tốt, mục tiêu không chỉ là "biết NestJS", mà là có nền của một junior backend developer làm việc có quy trình.

---

## Phase B theo từng task

| Task                   | Học skill gì                                                                       | Sai lầm hay gặp                                                         | Dấu hiệu đã hiểu thật                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `00-tools-setup`       | Chuẩn bị môi trường backend ổn định, biết lệnh nào dùng để chạy và verify repo     | Cài tool xong nhưng không biết tool nào là source of truth để verify    | Phân biệt được lỗi môi trường với lỗi code, và biết lệnh verify tối thiểu              |
| `01-nestjs-scaffold`   | Hiểu bootstrap NestJS, module, controller, service, route prefix, health endpoint  | Chỉ biết generate file nhưng không hiểu request đi qua đâu              | Giải thích được app start từ `main.ts` thế nào và `/health` khác business route ra sao |
| `02-env-config`        | Quản lý config kiểu backend thật: fail-fast, validate env, không đọc env lung tung | Dùng `process.env` trực tiếp khắp nơi, chỉ phát hiện lỗi khi runtime    | Giải thích được vì sao config phải fail lúc boot nếu thiếu biến quan trọng             |
| `02b-swagger`          | Hiểu API contract, tài liệu hóa endpoint, phân biệt docs với endpoint thật         | Tưởng `/docs` là có Swagger là xong, không hiểu contract value          | Phân biệt được Swagger UI, OpenAPI contract, và API runtime                            |
| `03-docker-postgres`   | Dựng local infrastructure bằng container, phối hợp app với DB service              | Chạy container theo copy-paste nhưng không hiểu port, volume, health    | Tự đọc `docker-compose.yml` và biết app cần gì để kết nối DB                           |
| `04-prisma-connect`    | Kết nối app với DB đúng cách, hiểu ORM integration trong boot/runtime              | Chỉ sửa connection string đến khi chạy được mà không hiểu luồng         | Biết Prisma được khởi tạo ở đâu và lỗi kết nối sẽ lộ ra ở giai đoạn nào                |
| `05-prisma-schema`     | Data modeling: entity, relation, naming, constraint cơ bản                         | Thiết kế schema theo UI thay vì theo domain                             | Nhìn một business concept và phác được bảng/quan hệ hợp lý                             |
| `06-migrations`        | Quản lý thay đổi schema có lịch sử và có thể review                                | Sửa schema rồi coi DB tự cập nhật là đủ                                 | Hiểu vì sao migration phải commit và không được sửa lịch sử đã merge                   |
| `07-base-classes`      | Chuẩn hóa cấu trúc chung của entity/model, giảm lặp                                | Trừu tượng hóa quá sớm hoặc tạo base class vô nghĩa                     | Biết cái gì nên shared và cái gì nên để per-module                                     |
| `08-seed-data`         | Tạo dữ liệu mẫu để test/dev/review nhanh                                           | Seed dữ liệu cứng, khó rerun, không rõ mục đích                         | Biết seed để phục vụ verify flow chứ không chỉ đổ dữ liệu cho có                       |
| `09-validation-pipe`   | Validation ở boundary của API, bảo vệ input toàn cục                               | Validate rải rác trong controller/service, bỏ sót whitelist hoặc forbid | Hiểu vì sao input xấu phải bị chặn trước khi chạm business logic                       |
| `10-jwt-redis`         | Nền auth/session: access token, state hỗ trợ, cache/session thinking               | Học JWT theo kiểu chỉ biết sign và verify token                         | Giải thích được phần nào stateless, phần nào vẫn cần state                             |
| `11-guards-decorators` | Cross-cutting auth/authorization trong NestJS                                      | Gắn auth từng route thủ công, không hiểu guard pipeline                 | Biết guard giải quyết vấn đề gì tốt hơn check role trong handler                       |
| `12-auth-feature`      | Ghép thành flow auth hoàn chỉnh ở backend                                          | Làm endpoint rời rạc, không nhất quán contract và validation            | Nhìn auth như một feature có luồng, không phải vài API lẻ                              |
| `13-refresh-token`     | Session lifecycle, rotation, revoke, edge case bảo mật                             | Nghĩ refresh token chỉ là token sống lâu hơn                            | Hiểu vì sao refresh flow là vấn đề session security chứ không chỉ là UX                |
| `14-users-crud`        | CRUD backend chuẩn: input, output, persistence, permission thinking                | Làm CRUD chỉ để ghi và xóa DB, thiếu validation hoặc contract rõ        | Biết một CRUD đủ chuẩn backend cần những lớp nào                                       |
| `15-phase-b-exit-gate` | Tự đánh giá nền tảng đã đủ chắc để sang business phase chưa                        | Tick done theo cảm giác, không verify theo criteria                     | Biết dùng acceptance criteria để chứng minh nền đã ổn                                  |

---

## Phase B practical map

| Task                   | Nên đọc file nào trước                                                                                           | Nên verify bằng gì                                                      | 1 câu hỏi tự kiểm tra hiểu bài                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `00-tools-setup`       | `planning/todo/phase-b/00-tools-setup.md`, `planning/todo/README.md`                                             | Chạy các lệnh tool/version trong task, bảo đảm repo command chạy được   | "Lỗi hiện tại là do môi trường hay do code?"                             |
| `01-nestjs-scaffold`   | `planning/todo/phase-b/01-nestjs-scaffold.md`, `src/main.ts`, `src/app.module.ts`                                | Chạy app, check `/health`, `/docs`, `/api/v1/...` theo task             | "Request đi từ đâu đến đâu khi app NestJS khởi động?"                    |
| `02-env-config`        | `planning/todo/phase-b/02-env-config.md`, `src/config/**`, `.env.example`, `planning/setup/CONVENTIONS.md`       | Chạy app với env đúng, thử làm hỏng 1 biến quan trọng để thấy fail-fast | "Vì sao backend nên fail lúc boot thay vì đợi lỗi ở request đầu tiên?"   |
| `02b-swagger`          | `planning/todo/phase-b/02b-swagger.md`, `src/main.ts`, chỗ setup Swagger                                         | Mở `/docs`, xem schema và authorize theo task                           | "Swagger UI khác endpoint backend thật ở điểm nào?"                      |
| `03-docker-postgres`   | `planning/todo/phase-b/03-docker-postgres.md`, `.env.example`                                                    | `docker compose up -d`, kiểm tra container, status, log cơ bản          | "Vì sao team backend thích Docker hơn cài DB tay trên từng máy?"         |
| `04-prisma-connect`    | `planning/todo/phase-b/04-prisma-connect.md`, file Prisma config/module, `.env`                                  | Chạy lệnh Prisma connect/check trong task, khởi động app                | "App đang kết nối DB qua lớp nào, và lỗi sẽ lộ ra ở đâu?"                |
| `05-prisma-schema`     | `planning/todo/phase-b/05-prisma-schema.md`, `planning/docs/CONTEXT.md`, `prisma/schema.prisma`                  | Validate schema, format, generate nếu task yêu cầu                      | "Schema này đang phản ánh domain hay chỉ phản ánh UI tạm thời?"          |
| `06-migrations`        | `planning/todo/phase-b/06-migrations.md`, `prisma/schema.prisma`, phần migration strategy trong `CONVENTIONS.md` | Tạo và chạy migration, kiểm tra trạng thái migration                    | "Vì sao migration phải được commit thay vì mỗi máy tự regenerate?"       |
| `07-base-classes`      | `planning/todo/phase-b/07-base-classes.md`, `planning/setup/CONVENTIONS.md`, file base class liên quan           | Type-check hoặc test nhẹ cho các class dùng chung                       | "Cái gì nên đưa vào base class, cái gì không nên?"                       |
| `08-seed-data`         | `planning/todo/phase-b/08-seed-data.md`, file seed/script seed                                                   | Chạy seed và kiểm tra dữ liệu được tạo đúng                             | "Seed này giúp verify flow nào, hay chỉ đang đổ dữ liệu cho có?"         |
| `09-validation-pipe`   | `planning/todo/phase-b/09-validation-pipe.md`, `src/main.ts`, DTO liên quan, `CONVENTIONS.md` phần validation    | Gọi thử input sai hoặc field thừa để xem response validation            | "Vì sao nên chặn dữ liệu bẩn ở boundary thay vì trong service?"          |
| `10-jwt-redis`         | `planning/todo/phase-b/10-jwt-redis.md`, auth config, Redis config/module, `CONTEXT.md`                          | Login flow cơ bản, kiểm tra token/Redis behavior theo task              | "Phần nào của auth là stateless, phần nào vẫn cần state?"                |
| `11-guards-decorators` | `planning/todo/phase-b/11-guards-decorators.md`, guard, decorator, `main.ts` hoặc app providers                  | Gọi route public và protected để xem guard hoạt động                    | "Vì sao dùng guard tốt hơn tự check auth trong từng handler?"            |
| `12-auth-feature`      | `planning/todo/phase-b/12-auth-feature.md`, module/controller/service auth, DTO, `CONTEXT.md`                    | Test register/login/profile hoặc flow tương đương                       | "Auth feature này là một flow hoàn chỉnh hay chỉ là vài endpoint rời?"   |
| `13-refresh-token`     | `planning/todo/phase-b/13-refresh-token.md`, auth/session files, `CONTEXT.md`                                    | Test refresh, rotate, invalid/reuse cases theo task                     | "Refresh token giải quyết UX, security, hay cả hai?"                     |
| `14-users-crud`        | `planning/todo/phase-b/14-users-crud.md`, users module/controller/service/DTO                                    | Test CRUD path chính, validation, auth/role nếu có                      | "Một CRUD backend đủ chuẩn cần những lớp bảo vệ nào ngoài save/read DB?" |
| `15-phase-b-exit-gate` | `planning/todo/phase-b/15-phase-b-exit-gate.md`, toàn bộ artifact Phase B                                        | Chạy lại các verify chính, đối chiếu acceptance criteria                | "Nếu sang Phase C ngay bây giờ, nền nào còn yếu nhất?"                   |

---

## Cách dùng file này với nestjs-mentor

Trước mỗi task:

1. đọc hàng tương ứng trong file này
2. mở task file thật trong `planning/todo/phase-b/`
3. đọc các file anchor được gợi ý

Khi làm xong task:

1. chạy phần verify đã gợi ý ở đây và trong task file
2. tự trả lời câu hỏi kiểm tra hiểu bài
3. sau đó mới dùng mentor để close-out task

---

## 3 dấu hiệu bạn đang học đúng

- bạn giải thích được **vì sao** một bước tồn tại, không chỉ nhớ lệnh
- bạn biết task hiện tại chạm vào layer nào của backend: config, transport, auth, persistence, domain
- bạn tự verify được "xong thật", không kết luận chỉ vì app chạy

---

## Kết luận ngắn

Nếu bạn đi tốt hết Phase B với cách học này, bạn sẽ vượt khỏi mức "học tutorial NestJS" và tiến lên mức:

- có nền NestJS đúng hướng
- có tư duy backend có quy trình
- đủ sẵn sàng bước sang Phase C để làm business module thật
