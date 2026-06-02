# Learning Log

---

## Phương pháp học NestJS (áp dụng mọi task)

> Đúc kết sau Task 12 — áp dụng từ Task 13 trở đi.

- Tách việc học thành các lớp nhỏ: DTO trước, rồi Controller, rồi Service, rồi Module wiring. Đọc cả flow lớn một lúc rất dễ quá tải.
- Với mỗi file, luôn trả lời 3 câu: **nhận input gì → gọi sang đâu → trả output gì**.
- Tự viết pseudo-code trước, sau đó mới điền NestJS decorator/API cụ thể — thay vì nhìn full code rồi gõ lại theo trí nhớ.
- Sau khi đọc xong một file, đóng lại và tự nói lại bằng tiếng Việt: input, xử lý chính, output.
- Chỉ copy "khung rỗng" của class/hàm trước, không copy toàn bộ implementation ngay.
- Nếu bí, mở hint theo từng nấc: ý tưởng → decorator/API → khung code → cuối cùng mới xem full code.
- Khi hoàn thành một task, viết lại 3–5 dòng về vai trò của từng file — bước này biến kiến thức thụ động thành kiến thức của mình.

---

## Task 00 — Cài đặt Tools

**Date:** 2026-05-22
**Phase:** B — Foundation

### Task 00 — Kết quả verify

- Node.js v24.11.1 (yêu cầu v20+) ✅
- npm 11.13.0 ✅
- NestJS CLI 11.0.21 ✅
- Docker 29.1.3 + Compose v2.40.3 ✅
- Docker Desktop WSL2 backend, DBeaver, Postman — xác nhận thủ công ✅

### Task 00 — Ghi chú

- Tất cả tools đã cài sẵn trước khi bắt đầu Phase B — task này được verify nhanh, không cần cài mới.
- Node.js v24 (mới hơn v20 LTS) hoàn toàn tương thích với NestJS 11.

---

## Task 01 — Khởi tạo NestJS Project

**Date:** 2026-05-23
**Phase:** B — Foundation

### Task 01 — Kết quả verify

- `GET /health` → `200 { status: "ok", timestamp: "..." }` ✅
- `GET /api/v1/health` → `404` (prefix hoạt động đúng) ✅
- `npx tsc --noEmit` → 0 errors ✅
- Folder structure: `common/`, `config/`, `modules/`, `shared/`, `migrations/`, `health/` ✅

### Task 01 — Điều đã học

- `app.setGlobalPrefix('api/v1', { exclude: ['health'] })` — `/health` nằm ngoài prefix để load balancer và Docker healthcheck gọi được mà không cần auth.
- `noUnusedLocals` và `noUnusedParameters` tắt có chủ ý — NestJS DI inject qua constructor, TypeScript sẽ báo false positive nếu bật 2 flag này.
- URL phải có đầy đủ `http://` — thiếu chữ `h` sẽ báo "Invalid protocol: ttp".

### Task 01 — Ghi chú

- Phần lớn code đã có sẵn từ commit trước — task này chủ yếu là verify và hiểu lý do thiết kế.

---

## Task 03 — Docker + PostgreSQL Setup

**Date:** 2026-05-26
**Phase:** B — Foundation

### Task 03 — Kết quả verify

- `docker-compose.yml` tạo ở root với PostgreSQL 16 + Redis 7 ✅
- `.env` tạo từ `.env.example`, có đủ biến DB + Redis ✅
- Kết nối PostgreSQL local thành công — `npx prisma db pull` nhận diện đúng 3 models ✅
- `npx prisma migrate deploy` apply migration `20260525161724_init` thành công ✅
- Đang dùng **PostgreSQL local** (Homebrew) thay vì Docker container — Docker Compose chưa chạy

### Task 03 — Điều đã học

- **Docker Compose là gì**: file YAML mô tả các container cần chạy (`services`), cách data được lưu (`volumes`), và cách kiểm tra container sẵn sàng (`healthcheck`). Chạy 1 lệnh `docker compose up -d` là tất cả khởi động.
- **Tại sao cần healthcheck**: Prisma kết nối DB ngay khi app start. Nếu không có healthcheck, app có thể connect vào PostgreSQL đang khởi động và fail ngay từ đầu. Healthcheck đảm bảo Postgres báo `pg_isready` trước khi app kết nối.
- **Named volumes (`pgdata`, `redisdata`)**: data tồn tại qua `docker compose down/up`, chỉ mất khi `docker compose down -v`. Docker tự quản lý vị trí lưu trữ.
- **Cú pháp `${BIẾN:-mặc_định}`**: đọc từ `.env` nếu có, fallback về giá trị mặc định nếu không — tách config ra `.env` để không hardcode password trong code.
- **Format `host:container` trong ports**: `5432:5432` — cổng bên trái là cổng máy bạn (DBeaver kết nối), cổng bên phải là cổng trong container.
- **PostgreSQL Homebrew trên macOS**: superuser mặc định là username macOS (`thanh.luong`), không phải `postgres`. Không cần password khi kết nối local.

### Task 03 — Lỗi gặp phải

- **`Cannot find module 'dotenv/config'`** khi chạy `npx prisma db pull`: `prisma.config.ts` import `dotenv/config` nhưng package chưa cài. Fix: `npm install --save-dev dotenv`.
- **P1010 — User denied access**: `DATABASE_URL` dùng `postgres:root123` nhưng PostgreSQL local không có user `postgres`. Fix: dùng user macOS — `DATABASE_URL=postgresql://thanh.luong@localhost:5432/ecom_db`.
- **P4001 — Database empty**: `ecom_db` mới tạo nên chưa có table. Không phải lỗi kết nối — fix bằng `npx prisma migrate deploy`.

### Task 03 — Ghi chú

- Đang dùng local PostgreSQL Homebrew (port 5432) thay Docker. `docker-compose.yml` đã tạo sẵn để dùng khi cần môi trường chuẩn hoặc làm việc theo team.
- Redis chưa setup — sẽ cần khi đến Task 10 (JWT + Redis).
- Task 04 (Prisma Connect) đã được implement trong Task 07 (PrismaService, PrismaModule) — cần verify health endpoints trước khi mark Done.

---

## Task 04 — Kết nối Prisma với NestJS

**Date:** 2026-05-26
**Phase:** B — Foundation

### Task 04 — Kết quả verify

- `PrismaModule` import vào `AppModule` ✅
- `[PrismaService] Prisma connected` xuất hiện khi app start ✅
- App start thành công, không có lỗi ✅
- `/health/ready` với DB check — chưa implement (sẽ làm tiếp)

### Task 04 — Điều đã học

- **Prisma 7 breaking change — engine mặc định**: Prisma 7 đổi engine mặc định từ "library" (Rust binary) sang "client" (Wasm). Engine "client" KHÔNG đọc `DATABASE_URL` trực tiếp — bắt buộc phải có `adapter` hoặc `accelerateUrl`.
- **`@prisma/adapter-pg`**: driver adapter để kết nối PostgreSQL với Prisma 7 engine "client". Cách dùng: `new PrismaPg({ connectionString: process.env.DATABASE_URL })` rồi truyền vào `super({ adapter })`.
- **Prisma 7 breaking change — constructor**: `super()` (không có argument) bây giờ throw `PrismaClientInitializationError`. Phải truyền ít nhất `super({ adapter })`.
- **`prisma-client` vs `prisma-client-js`**: Prisma 7 có 2 generator. `prisma-client` (mới) sinh TypeScript source với `import.meta.url` — gây lỗi ESM/CJS. `prisma-client-js` sinh JavaScript compiled — tương thích NestJS CJS.
- **Custom output directory sinh conflict**: khi `output = "../generated/prisma"`, Prisma generate cả file `.ts` (generator cũ) lẫn `.js` (generator mới). TypeScript compile `.ts` → overwrite `.js` → lỗi. Fix: bỏ custom `output`, dùng default `node_modules/.prisma/client`.

### Task 04 — Lỗi gặp phải

- **`exports is not defined in ES module scope`**: generator `prisma-client` sinh `.ts` dùng `import.meta.url`. TypeScript `module: nodenext` để nguyên `import.meta.url` trong CJS output → Node.js v24 load file như ESM → `exports` không tồn tại. Fix: đổi sang `prisma-client-js` + bỏ custom output.
- **`engine: "classic"` không tồn tại trong `PrismaConfig`**: `prisma.config.ts` được generate với field `engine` không hợp lệ trong Prisma 7. Fix: xóa dòng `engine: "classic"`.
- **`Cannot find module '../../../generated/prisma/index.js'`**: TypeScript compile `.ts` của generator cũ → `dist/generated/prisma/client.js` bị overwrite bởi code lỗi. Fix: xóa toàn bộ `.ts` cũ trong `generated/prisma/` + clear `dist/generated/`.
- **`PrismaClientInitializationError: needs to be constructed with a non-empty, valid PrismaClientOptions`**: `super()` không có argument → Prisma 7 throw. Fix: `super({ adapter })`.
- **`PrismaClientConstructorValidationError: Using engine type "client" requires either "adapter" or "accelerateUrl"`**: Prisma 7 engine "client" không nhận `DATABASE_URL` trực tiếp. `engineType = "library"` trong schema bị ignore. Fix: cài `@prisma/adapter-pg`, tạo adapter từ connection string, truyền vào constructor.

### Task 04 — Ghi chú

- `@prisma/adapter-pg` là cách chuẩn để kết nối PostgreSQL với Prisma 7.
- Health endpoints `/health/live` và `/health/ready` cần implement thêm vào `HealthController` (việc tiếp theo).
- `prisma.config.ts` chỉ dùng cho Prisma CLI (migrate, generate, studio) — không ảnh hưởng đến PrismaClient runtime. Runtime chỉ đọc từ adapter được truyền vào constructor.

---

## Task 05 — Prisma Schema (User + Address + RefreshToken)

**Date:** 2026-05-25
**Phase:** B — Foundation

### Task 05 — Kết quả verify

- `npx prisma validate` → `The schema at prisma/schema.prisma is valid` ✅
- UUID dùng cho tất cả `id` field ✅
- `deletedAt DateTime?` soft delete trên User ✅
- `familyId`, `usedAt`, `revokedAt` trên RefreshToken đủ để detect replay attack ✅
- `@@index` trên mọi FK và query field ✅

### Task 05 — Điều đã học

- **UUID thay vì auto-increment**: tránh IDOR attack — attacker không thể enumerate `/users/1`, `/users/2`. Auto-increment còn leak quy mô business.
- **Soft delete (`deletedAt`)**: hard delete User có Order lịch sử sẽ tạo orphan records và vi phạm GDPR. Soft delete giữ nguyên data, chỉ filter `WHERE deletedAt IS NULL`.
- **`familyId` trên RefreshToken**: group token cùng phiên login để detect replay attack. Khi token cũ bị dùng lại sau khi đã revoke → kill toàn bộ family, buộc re-login.
- **`tokenHash @unique`**: không lưu raw refresh token — nếu DB bị leak thì hash không thể reverse. `@unique` tự tạo index, không cần `@@index` riêng.
- **PostgreSQL không tự tạo index cho FK**: phải khai báo `@@index` tường minh trên mọi FK và field hay dùng trong `WHERE`.

### Task 05 — Ghi chú

- `onDelete: Cascade` chỉ trigger khi hard delete, không trigger khi soft delete — thiết kế có chủ ý để giữ Address làm reference.
- Rule "1 địa chỉ mặc định per user" không enforce được ở schema level với Prisma — phải xử lý ở service layer.

---

## Task 06 — Generate & Chạy Migrations

**Date:** 2026-05-25
**Phase:** B — Foundation

### Task 06 — Kết quả verify

- `npx prisma migrate dev --name init` → migration apply thành công ✅
- 3 bảng `users`, `addresses`, `refresh_tokens` tồn tại trong DB ✅
- `npx prisma migrate dev` lần 2 → `Already in sync` ✅
- `npx prisma migrate reset` → re-apply thành công ✅
- Scripts `db:migrate`, `db:migrate:prod`, `db:studio`, `db:reset`, `db:generate` đã có trong `package.json` ✅

### Task 06 — Điều đã học

- **`prisma migrate dev` vs `prisma migrate deploy`**: `dev` tạo migration mới từ schema changes (chỉ dùng local), `deploy` chỉ apply migration đã có (dùng CI/CD production). Không bao giờ chạy `dev` trên production.
- **`prisma migrate reset` chỉ dùng local**: xóa toàn bộ data — chạy trên production là mất data user thật không lấy lại được.
- **Prisma không có built-in rollback**: cách đúng là tạo migration mới để undo thay đổi, không rollback ngược.

### Task 06 — Lỗi gặp phải

- **Prisma 7 breaking change**: `url = env("DATABASE_URL")` trong `datasource` block của `schema.prisma` không còn được hỗ trợ ở Prisma 7. Phải xóa dòng `url` khỏi `schema.prisma` — URL đã được config trong `prisma.config.ts` với `datasource: { url: env("DATABASE_URL") }`.

---

## Task 07 — Shared Contracts & Utilities

**Date:** 2026-05-26
**Phase:** B — Foundation

### Task 07 — Kết quả verify

- `PrismaService` extends generated `PrismaClient` với lifecycle hooks ✅
- `PrismaModule` global — inject được ở mọi module không cần import lại ✅
- `PaginatedResult<T>` và `PaginationOptions` shared contracts ✅
- `slugify`, `formatCurrency`, `generateOrderId` utils ✅
- `UserRepository` filter soft-delete tự động qua `deletedAt: null` ✅
- `@generated/*` alias thêm vào `tsconfig.json` ✅

### Task 07 — Điều đã học

- **Repository Pattern**: tách business query logic khỏi Service — rule `deletedAt: null` viết một lần trong repository, mọi nơi gọi đều tự động có, không sợ developer quên filter.
- **`@Global()` PrismaModule**: import 1 lần ở `AppModule`, các module con inject `PrismaService` trực tiếp mà không cần import `PrismaModule` lại — tránh tạo nhiều `PrismaClient` instance gây connection pool exhaustion.
- **Import alias vs relative path**: alias (`@common/*`, `@generated/*`) dễ đọc và không bị ảnh hưởng khi move file — relative path (`../../../`) dễ sai khi refactor.

### Task 07 — Lỗi gặp phải

- **Prettier indent conflict**: `.prettierrc` không khai báo `tabWidth` tường minh → VSCode editor dùng 4 spaces, Prettier dùng 2 spaces mặc định → conflict khi Format on Save. Fix: thêm `"tabWidth": 2` vào `.prettierrc` và tạo `.editorconfig` với `indent_size = 2`.
- **`prefer-string-replace-all` ESLint rule**: `String#replace()` với global regex bị flag — phải đổi sang `replaceAll()`. Với ký tự đơn như `đ` dùng `replaceAll('đ', 'd')` thay vì regex.
- **Prisma generated `PrismaClient` là `const` không phải class**: ESLint `@typescript-eslint/no-unsafe-call`, `no-unsafe-member-access`, `no-unsafe-return` báo lỗi khi gọi `this.$connect()`, `this.prisma.user.findFirst()` — fix bằng cách thêm override trong `eslint.config.mjs` để tắt 3 rules này cho `src/**/*.ts`.
- **Prettier `{ }` với space**: constructor body rỗng phải là `{}` không phải `{ }`.

---

## Task 08 — Seed Data

**Date:** 2026-05-28
**Phase:** B — Foundation

### Task 08 — Kết quả verify

- `npx prisma db seed` → output `Seeding done!` + credentials đúng ✅
- Seed idempotent — chạy lần 2 không lỗi duplicate key ✅
- Cột `password` trong DB bắt đầu bằng `$2b$12$...`, dài ≥ 60 ký tự (bcrypt hash) ✅
- Bảng `users` có 2 rows, `addresses` có 3 rows ✅

### Task 08 — Điều đã học

- **Tại sao xóa data cũ trước khi seed**: seed phải idempotent — chạy nhiều lần không bị lỗi duplicate key. Thứ tự xóa phải đúng FK: xóa child table (`RefreshToken`, `Address`) trước rồi mới xóa parent (`User`). Sai thứ tự sẽ bị lỗi foreign key constraint.
- **Tại sao hash bcrypt trong seed**: seed tạo user đúng như production — password đã hash. Không seed plaintext để test case sau này phản ánh đúng thực tế. Salt rounds = 12 là giá trị production-safe.
- **Seed config Prisma 6 vs Prisma 7**: Prisma 6 đặt seed trong `package.json` (`"prisma": { "seed": "ts-node prisma/seed.ts" }`). Prisma 7 đặt trong `prisma.config.ts` (`seed: { run: '...' }`). Nhầm chỗ sẽ báo TypeScript error.
- **Seed dùng driver adapter**: project dùng `@prisma/adapter-pg` (Prisma 7 driver adapter mode) → seed.ts cũng phải tạo adapter và truyền vào `PrismaClient({ adapter })`, không dùng `new PrismaClient()` không argument.

### Task 08 — Lỗi gặp phải

- **`The datasource property 'url' is no longer supported in schema files`**: session trước thêm nhầm `url = env("DATABASE_URL")` vào `datasource` block trong `schema.prisma`. Prisma 7 không cho phép `url` trong schema — URL phải nằm trong `prisma.config.ts` (`datasource: { url: env('DATABASE_URL') }`). Fix: xóa dòng `url` khỏi `schema.prisma`.
- **`Argument "url" is missing in data source block "db"`**: sau khi xóa `url` khỏi schema, Prisma CLI 6.19.3 báo lỗi vì Prisma 6 vẫn yêu cầu `url` trong schema. Root cause: **version mismatch** — `prisma` CLI là `6.19.3` nhưng `@prisma/client` là `7.8.0`. Hai package này phải cùng major version.
- **`Object literal may only specify known properties, and 'seed' does not exist in type 'PrismaConfig'`**: `seed: { run: '...' }` được thêm vào `prisma.config.ts` nhưng đây là Prisma 7 feature — CLI đang chạy là Prisma 6 nên không nhận property này. Fix: xóa `seed` khỏi `prisma.config.ts`, thêm vào `package.json` theo cú pháp Prisma 6.
- **Prisma Studio không chạy được với driver adapter**: `npx prisma studio` báo lỗi vì Prisma Studio không support driver adapter mode. Đây là limitation đã biết của Prisma — không có fix phía user. Dùng DBeaver thay thế để xem/query data.

### Task 08 — Ghi chú

- `prisma` CLI và `@prisma/client` phải luôn cùng major version. Khác major version gây ra các lỗi khó hiểu và contradictory (một bên yêu cầu `url`, bên kia cấm `url`).
- Seed credentials chỉ dùng cho local dev: `admin@ecom.dev / Admin@123456`, `user@ecom.dev / User@123456`. Không bao giờ reuse cho staging/production.
- AC-4 (login với seed credentials trả `accessToken`) sẽ verify sau Task 12 khi auth endpoints đã implement.

---

## Task 09 — Global Validation Pipe & Exception Filter

**Date:** 2026-05-28
**Phase:** B — Foundation

### Task 09 — Kết quả verify

- `GlobalExceptionFilter` đăng ký global — mọi exception đều đi qua filter ✅
- `ValidationPipe` với `whitelist: true` + `forbidNonWhitelisted: true` ✅
- AC-3: `GET /api/v1/nonexistent` trả JSON `{ success: false, statusCode: 404, code: "NOT_FOUND", ... }` — không phải HTML ✅
- AC-1, AC-2, AC-4, AC-5: defer đến Task 12 khi có auth endpoints ✅

### Task 09 — Thắc mắc & Giải đáp

- **ValidationPipe và ExceptionFilter là gì?** Hai "lớp bảo vệ" global của API. `ValidationPipe` đứng đầu vào — reject request sai DTO trước khi vào business logic. `ExceptionFilter` đứng đầu ra — bắt mọi exception và format thành JSON chuẩn. Không có hai thứ này thì mỗi chỗ báo lỗi theo kiểu riêng, FE phải handle nhiều format khác nhau.
- **Tại sao dùng `express` (Request/Response) trong NestJS?** NestJS chạy trên nền Express — không thay thế Express mà wrap thêm lớp decorator/DI lên trên. `Request` và `Response` là object HTTP thật của Express. Khi cần đọc `request.url` hay gọi `response.status().json()`, đó là Express API.
- **`success: false` là literal type, không phải `boolean` — tại sao?** Để TypeScript biết field này CHỈ có thể là `false`. Dùng trong discriminated union: `if (response.success === false)` → TypeScript tự narrow sang `ErrorResponse`. Nếu dùng `boolean` thì mất tính an toàn này.
- **`Unsafe assignment of an 'any' value`** — ESLint rule `@typescript-eslint/no-unsafe-assignment`. Fix: thêm `// eslint-disable-next-line` cho dòng dùng `any`. Vẫn dùng `any` vì `exceptionResponse` có shape bất định. Phase D sẽ refactor.
- **`@common` alias không resolve khi chạy** — TypeScript `paths` chỉ dùng lúc compile, không transform trong JS output. Node.js không biết `@common` là gì. Fix: thêm `"webpack": true` vào `nest-cli.json` — webpack dịch alias thành đường dẫn thật lúc bundle.
- **Lỗi `.js` extension với webpack** — `moduleResolution: "nodenext"` yêu cầu `.js` extension nhưng webpack không hiểu mapping `.js` → `.ts`. Fix: bỏ `.js` trong alias import (`@common/filters/...` thay vì `@common/filters/....js`).

### Task 09 — Ghi chú

- `nest-cli.json` đã thêm `"webpack": true` — alias `@common`, `@config`, `@modules`, `@shared` hoạt động toàn project từ giờ.
- Với alias import: không thêm `.js` extension.
- AC-1, AC-2, AC-4, AC-5 sẽ verify lại sau Task 12.

---

## Task 10 — JWT + Redis Setup

**Date:** 2026-05-29
**Phase:** B — Foundation

### Task 10 — Kết quả verify

- `RedisModule` + `RedisService` tạo tại `src/common/redis/` ✅
- `JwtStrategy` tạo tại `src/modules/identity/strategies/jwt.strategy.ts` ✅
- `TokenService` tạo tại `src/modules/identity/services/token.service.ts` ✅
- `RedisModule` và `JwtModule.registerAsync` đăng ký trong `AppModule` với `global: true` ✅
- AC-2, AC-3, AC-4: defer đến Task 11 khi Guards được setup — JwtStrategy chưa được gắn vào endpoint nào ✅

### Task 10 — Điều đã học

- **Tại sao access token TTL ngắn (30 phút)**: JWT không thể revoke trước khi hết hạn — nếu bị đánh cắp, attacker có cửa sổ tấn công đúng bằng TTL. Giải pháp: TTL ngắn + refresh token stateful trong DB (revoke được ngay).
- **`validate()` trong JwtStrategy check DB mỗi request**: Passport gọi `validate()` sau khi verify signature thành công. Check thêm `isActive = true` và `deletedAt IS NULL` để đảm bảo user bị suspend → 401 ngay, dù token còn hạn.
- **`@Global()` trên RedisModule**: giống PrismaModule — import 1 lần ở AppModule, mọi module inject `RedisService` trực tiếp mà không cần import lại.
- **`JwtModule.registerAsync` thay vì `register`**: đọc secret từ `ConfigService` (async) thay vì hardcode — bắt buộc khi dùng `.env`. `global: true` để không phải import `JwtModule` ở từng module.
- **Không lưu raw refresh token**: chỉ lưu `sha256(token)` vào DB. Nếu DB bị leak, attacker không dùng được hash — phải có raw token mới gọi được refresh endpoint.
- **`familyId` cho refresh token rotation**: group toàn bộ token của một phiên login. Khi detect replay (token cũ bị dùng lại), revoke toàn bộ family — buộc user re-login. Implement chi tiết ở Task 13.
- **HS256 vs RS256**: HS256 dùng 1 secret duy nhất — đủ cho single service Phase B, đơn giản hơn. RS256 dùng private/public key pair — cần khi nhiều service cần verify token mà không share secret. Quyết định migrate khi tách microservices.

### Task 10 — Thắc mắc & Giải đáp

- **JWT là gì, tại sao không lưu session trên server?** JWT (JSON Web Token) là chuỗi base64 gồm 3 phần: header, payload, signature. Server ký token bằng secret — client giữ token, gửi lên mỗi request. Server chỉ cần verify signature, không cần tra DB hay memory. Trade-off: không thể revoke trước TTL → giải quyết bằng TTL ngắn (30 phút) + refresh token stateful.
- **Tại sao cần 2 loại token (access + refresh)?** Access token TTL ngắn → ít risk nếu bị leak. Nhưng bắt user login lại mỗi 30 phút thì UX tệ. Refresh token TTL dài (7 ngày) lưu trong DB → có thể revoke ngay (logout, change password, admin suspend). Hai token phân tách vai trò: access token cho tốc độ, refresh token cho kiểm soát.
- **`PassportStrategy` là gì, NestJS dùng nó thế nào?** Passport là middleware auth cho Node.js — có hàng trăm "strategy" sẵn (JWT, Local, Google OAuth…). NestJS wrap Passport qua `@nestjs/passport`. `JwtStrategy extends PassportStrategy(Strategy)` — khi request đến, Passport extract token từ header, verify signature, rồi gọi `validate()`. Kết quả `validate()` được gắn vào `request.user`.
- **Tại sao `validate()` phải query DB thêm sau khi đã verify signature?** Signature hợp lệ chỉ chứng minh token chưa bị giả mạo — không chứng minh user còn active. User bị suspend sau khi token được phát → token vẫn valid về signature. Check `isActive = true` và `deletedAt IS NULL` trong DB đảm bảo state hiện tại của user được enforce mỗi request.
- **HS256 là gì, khi nào cần đổi sang RS256?** HS256 (HMAC SHA-256) dùng 1 secret duy nhất để vừa ký vừa verify — mọi service cần verify phải biết secret. Đủ cho Phase B single service. RS256 dùng private key để ký, public key để verify — service khác verify mà không cần biết private key, phù hợp kiến trúc microservices. Quyết định migrate khi tách service.
- **Tại sao payload JWT chỉ có `{ sub, email, role }`, không thêm thứ khác?** JWT có thể decode client-side không cần secret (chỉ base64). Nhét thêm `phone`, `address`, hay bất kỳ PII nào → data nhạy cảm phơi ra. Nguyên tắc: payload chỉ chứa những gì server cần để authorize request — không hơn.
- **Tại sao không lưu raw refresh token vào DB?** Nếu DB bị leak (SQL injection, backup bị lộ), attacker có raw token → gọi được refresh endpoint → lấy access token mới vô thời hạn. Lưu `sha256(token)` — hash không thể reverse. Attacker cần raw token mới có thể exploit.
- **`familyId` trên RefreshToken để làm gì?** Group toàn bộ token của một phiên login thành 1 "family". Khi implement refresh token rotation (Task 13): mỗi lần refresh → issue token mới, revoke token cũ. Nếu token cũ bị dùng lại (replay attack) → phát hiện → revoke toàn bộ family, buộc re-login.
- **`@Global()` trên RedisModule có nghĩa gì?** Module được đăng ký global — chỉ cần import 1 lần ở `AppModule`, các module con inject `RedisService` trực tiếp không cần import `RedisModule` lại. Tương tự cách `PrismaModule` đã làm ở Task 07. Tránh import lặp lại ở mọi module dùng Redis.
- **Redis được setup từ Task 10 nhưng chưa dùng — tại sao không để sau?** Redis là shared infrastructure — nhiều feature sau dùng: denylist access token (revocation), rate-limit, cache. Setup sớm để các Task sau chỉ inject `RedisService` mà dùng, không phải quay lại wiring. Cũng verify Redis connection ngay từ sớm — phát hiện config sai trước khi build feature trên đó.

### Task 10 — Ghi chú

- `clockTolerance: 30` (30s clock skew) có trong task spec nhưng chưa có trong implementation thực tế — sẽ thêm khi cần thiết.
- AC-2 (token expired → 401) và AC-3 (user suspended → 401 ACCOUNT_INACTIVE) sẽ verify sau Task 11 khi có `JwtAuthGuard` gắn vào endpoint.
- Redis hiện dùng cho infrastructure plumbing (connect, log) — chưa có business logic. Phase D/E sẽ dùng cho denylist và rate-limit.

---

## Task 11 — Ghi chú đang làm · 2026-05-30

**Branch:** ThanhLuongCong/feat/phase-b/11-guards-decorators

**Điểm vừa học được:**

- Trong NestJS, `@Controller()` chưa đủ để route hoạt động; controller còn phải được khai báo trong `controllers: [...]` của module.
- Nếu file controller tồn tại nhưng chưa được module đăng ký, request sẽ trả `404`, không phải `401`, vì route chưa được mount vào runtime.
- Muốn verify `JwtAuthGuard` theo nguyên tắc default-deny, cần một endpoint có thật và không có `@Public()`.

**Dấu mốc verify hiện tại:**

- AC-1 đã pass: `GET /health` trả `200` không cần token.
- AC-2 chưa verify xong vì `/api/v1` hiện `404`; nguyên nhân là `AppController` chưa được đăng ký trong `AppModule`.

**Bổ sung từ lúc verify lỗi `404`:**

- Khi gọi `GET /api/v1` mà ra `404 Not Found` thay vì `401 TOKEN_INVALID`, điều đó chưa chứng minh `JwtAuthGuard` sai; nó cho thấy route đó chưa tồn tại thật trong app runtime.
- Trong NestJS, `@Controller()` chỉ mới định nghĩa class có thể nhận request. Muốn route hoạt động thật, controller còn phải được module biết tới qua `controllers: [...]`.
- Nếu file controller tồn tại nhưng chưa được đăng ký trong module, request sẽ rơi vào `404`, không phải `401`, vì router chưa mount endpoint đó vào runtime.
- Với repo hiện tại, cần một protected endpoint có thật và không có `@Public()` thì mới verify được nguyên tắc `default-deny`.
- Mental model ngắn gọn: `controller` là quầy tiếp nhận request, còn `module` là danh sách quầy mà app mở thật. Có file controller nhưng chưa khai báo trong module thì giống như quầy chưa mở.

**Bổ sung sau verify AC-2:**

- `/health` trả `200` vì route có `@Public()`, nên `JwtAuthGuard` đọc được metadata `isPublic = true` và bypass bước kiểm tra JWT.
- `/api/v1` trả `401 TOKEN_INVALID` vì route không có `@Public()`, nên guard đi tiếp vào `AuthGuard('jwt')` và fail khi request không có Bearer token.
- Đây là bằng chứng runtime cho nguyên tắc `default-deny`: mọi route mặc định bị chặn, chỉ route được đánh dấu public mới đi qua không cần token.

**Task 11 — Thắc mắc & Giải đáp:**

- **Tại sao `src/app.controller.ts` có file mà gọi `/api/v1` vẫn ra `404`?** Vì trong NestJS, controller chỉ hoạt động khi được module đăng ký trong `controllers: [...]`. Có file controller nhưng chưa khai báo trong `AppModule` thì route chưa được mount vào runtime, nên router trả `404` trước khi auth guard chạy.
- **Tại sao thêm `AppController` vào `AppModule` lại bị lỗi `Nest can't resolve dependencies of the AppController (AppService)`?** Vì `AppController` lúc đó còn constructor inject `AppService`, nhưng `AppService` chưa được đăng ký như provider trong `AppModule`. Nest DI không tạo được controller nếu thiếu dependency.
- **Vì sao ở task 11 nên bỏ `AppService` ra khỏi `AppController` thay vì thêm provider mới?** Vì mục tiêu chỉ là tạo một protected endpoint tối thiểu để verify guard. Bỏ `AppService` giúp giảm nhiễu, không phải wiring thêm dependency không liên quan đến auth flow.
- **Tại sao `AuthGuard('jwt')` thôi vẫn chưa đủ?** `AuthGuard('jwt')` chỉ yêu cầu Passport dùng strategy tên `jwt`. Muốn nó hoạt động thật, `JwtStrategy` phải được đăng ký như một provider trong module để Passport có strategy thật để gọi ở runtime.
- **Vì sao lúc chưa đăng ký `JwtStrategy` lại ra `500` thay vì `401`?** Vì request đã đi vào protected route, nhưng Passport chưa có strategy `jwt` hoàn chỉnh để xử lý authentication. Đây là lỗi wiring/runtime của app, không phải lỗi "token không hợp lệ" từ client.
- **Vì sao `/health` trả `200` còn `/api/v1` trả `401` dù cả hai đều là `GET`?** Vì khác nhau ở metadata auth, không phải ở HTTP method. `/health` có `@Public()` nên bypass JWT check; `/api/v1` không có `@Public()` nên bị áp dụng default-deny và fail ở bước authentication khi không có token.

---

## Task 12 — Auth Feature: Kiến thức kỹ thuật · 2026-06-02

**Date:** 2026-06-02 · **Phase:** B — Foundation

### DTO

- DTO là class mô tả contract input của request body — chỉ khai báo shape dữ liệu và rule validate ở boundary, không chứa business logic.
- **Vì sao dùng class thay vì interface?** Validation pipe dùng decorator runtime (`@IsEmail()`, `@MinLength()`). Interface chỉ tồn tại ở compile time — không giữ được metadata khi app chạy.
- **`email!: string` — dấu `!` là gì?** `definite assignment assertion`: báo TypeScript field này sẽ được framework gán sau, không báo lỗi "Property has no initializer" trong strict mode. Khác `?`: dấu `!` là bắt buộc có giá trị, dấu `?` là có thể `undefined`.
- **Vì sao `LoginDto` không kiểm tra password mạnh như `RegisterDto`?** Login chỉ xác thực kiểu dữ liệu — rule độ mạnh password chỉ áp dụng lúc tạo mật khẩu mới.

### AuthService — flow & security

- `register()`: kiểm tra email trùng → hash password (bcrypt 12) → tạo user → issue token. Nếu issue token lỗi → rollback user (transaction) tránh orphan account.
- `login()`: tìm user → `bcrypt.compare` → kiểm tra `isActive` → issue token.
- **`DUMMY_PASSWORD_HASH` — chống timing attack**: dù email không tồn tại vẫn chạy `bcrypt.compare` với hash giả — response time tương đương, attacker không đo được email nào có trong hệ thống.
- **`INVALID_CREDENTIALS` cho cả email sai và password sai** — không tiết lộ email nào đã đăng ký (chống enumeration attack).
- **`sanitizeUser()` bỏ `password` khỏi response** — bcrypt hash vẫn là dữ liệu nhạy cảm; client không cần và không được biết.

### TokenService

- **Vì sao hash refresh token (SHA-256)?** Nếu DB bị lộ, attacker không dùng được hash để giả mạo phiên. SHA-256 là hàm một chiều — không thể khôi phục raw token từ hash.
- **`familyId`** gom các refresh token cùng "dòng". Khi rotation (Task 13): token cũ revoke, token mới cấp — cùng `familyId`. Nếu token cũ bị dùng lại → reuse detection → revoke cả family → chống session hijacking.
- **Transaction vs không transaction:**

| Caller | Truyền `tx` | Lý do |
| --- | --- | --- |
| `register()` | ✅ Có | Tạo user + issue token phải atomic — lỗi ở bước 2 thì rollback user, tránh orphan account |
| `login()` | ❌ Không | User đã tồn tại, không có write nào cần rollback nếu issue token lỗi |

> Công thức: transaction khi **nhiều write phải atomic**. Chỉ 1 write hoặc toàn read → không cần.

### Swagger decorators

- 3 lớp: `@ApiProperty` (DTO field) · `@ApiOperation`/`@ApiTags` (controller) · `@ApiResponse` (response schema).
- **Thêm ngay khi viết API**: `@ApiProperty` và `@ApiOperation`/`@ApiTags` — chi phí thấp, Swagger UI hiểu ngay.
- **`@ApiResponse` defer đến Phase D** — response shape còn thay đổi khi refactor `GlobalExceptionFilter`.
- **`example` phải nhất quán giữa các DTO cùng flow**: `RegisterDto` và `LoginDto` cùng dùng `"Abc@12345"` — developer copy từ bước này sang bước kia không bị lỗi misleading.
- **`example` phải pass được validate của chính DTO đó**: `"password123"` không có chữ hoa → sẽ bị `422` ngay khi submit từ Swagger UI.

---

## Task 12 — Debug 500 trên `/api/v1/auth/register` · 2026-06-02

**Branch/Context:** Auth Feature — Register & Login

### Triệu chứng

`POST /api/v1/auth/register` với body hợp lệ trả về:

```json
{
  "success": false,
  "statusCode": 500,
  "code": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred"
}
```

### Quá trình tìm nguyên nhân

**Bước 1 — Đọc code**: controller, service, DTO đều hợp lệ. `GlobalExceptionFilter` trả 500 với message "An unexpected error occurred" khi exception không phải `HttpException` và không phải `Prisma.PrismaClientKnownRequestError` code P2002/P2025.

**Bước 2 — Chạy `prisma migrate status`**: lệnh báo lỗi `P1012 — Argument "url" is missing in data source block "db"`. Đây là dấu hiệu Prisma CLI không chạy được bình thường.

**Bước 3 — Kiểm tra DB**: Tables `users`, `addresses`, `refresh_tokens`, `_prisma_migrations` tồn tại → migration ban đầu đã chạy, kết nối DB hoạt động.

**Bước 4 — Reproduce từng bước**: viết script Node.js chạy từng bước của `AuthService.register()` trực tiếp. Kết quả:

```text
findFirst OK
bcrypt hash OK
user.create OK
FAILED: The column `refresh_tokens.replacedByTokenId` does not exist — Code P2022
```

**Root cause xác định**: `prisma/migrations/20260525161724_init/migration.sql` không có cột `replacedByTokenId`. Schema Prisma đã được cập nhật thêm field này và relation `TokenRotation` sau khi migration ban đầu được apply, nhưng migration mới chưa bao giờ được tạo và chạy.

### Chuỗi lỗi hoàn chỉnh

```text
POST /api/v1/auth/register
  → AuthService.register()
    → prisma.user.create()               ← OK
    → tokenService.issueTokenPair()
      → prisma.refreshToken.create()     ← throw P2022 (column không tồn tại)
  → GlobalExceptionFilter catch P2022
    → P2022 không handle cụ thể (chỉ có P2002/P2025)
    → fallback: 500 INTERNAL_SERVER_ERROR
```

### Fix

Tạo migration mới `20260602012551_add_token_rotation_and_address_soft_delete` với nội dung:

```sql
ALTER TABLE "refresh_tokens" ADD COLUMN "replacedByTokenId" TEXT;
CREATE UNIQUE INDEX "refresh_tokens_replacedByTokenId_key" ON "refresh_tokens"("replacedByTokenId");
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replacedByTokenId_fkey"
  FOREIGN KEY ("replacedByTokenId") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "addresses" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "addresses_deletedAt_idx" ON "addresses"("deletedAt");
```

> `addresses.deletedAt` cũng bị thiếu — cùng lý do (schema cập nhật sau migration gốc). Fix cùng lúc.

Apply thủ công bằng `$executeRawUnsafe` + register vào `_prisma_migrations`. Sau fix, register trả đúng user + tokens.

### Nguyên nhân sâu hơn: Prisma CLI bị version mismatch

```text
prisma (CLI):   6.19.3
@prisma/client: 7.8.0
```

`prisma.config.ts` với `datasource: { url: env('DATABASE_URL') }` là tính năng của **Prisma 7**. CLI phiên bản 6 không hiểu cú pháp này → `prisma migrate status` luôn báo "url missing" dù config đã có URL.

Hậu quả: không thể dùng `npm run db:migrate` để tạo/apply migration mới → dev thay đổi schema rồi quên tạo migration → DB và schema bị lệch nhau.

**Fix đúng**: cập nhật `prisma` CLI trong `devDependencies` từ `^6.19.3` lên `^7.8.0`:

```powershell
npm install --save-dev prisma@^7.8.0
```

Sau khi fix version, các lệnh migration hoạt động bình thường.

### Cách chạy migration đúng (sau khi fix version)

| Lệnh | Khi nào dùng |
| --- | --- |
| `npm run db:migrate` | Sau mỗi lần thay đổi `schema.prisma` — tạo file SQL mới và apply vào DB local |
| `npm run db:migrate:prod` | Deploy lên môi trường mới — chỉ apply migration đã có, không tạo mới |
| `npx prisma migrate status` | Kiểm tra migration nào đã chạy, migration nào còn pending |

**Quy tắc vàng**: schema thay đổi → phải có migration tương ứng ngay. Nếu quên, code Prisma sẽ throw `P2022` (column not found) hoặc `P2021` (table not found) lúc runtime — không có warning gì khi app start.

### Điều đã học

- **`GlobalExceptionFilter` cần xử lý rộng hơn**: hiện tại chỉ handle P2002 và P2025. Các error code quan trọng khác như P2022 (column not found), P2021 (table not found) sẽ trả 500 thay vì thông báo có nghĩa hơn.
- **Schema drift là lỗi thầm lặng**: DB connect thành công, app start bình thường — không có warning nào cho đến khi query thật sự chạy. Cách phòng: sau mỗi thay đổi schema, kiểm tra `prisma migrate status` ngay.
- **Prisma CLI và `@prisma/client` phải cùng major version**: khác major version tạo ra contradiction — CLI 6.x yêu cầu `url` trong schema, nhưng Prisma 7.x cấm `url` trong schema. Luôn update cả hai package cùng lúc.
- **`prisma.config.ts` là Prisma 7 feature**: thay thế cho `url = env(...)` trong `datasource` block của `schema.prisma`. CLI 6.x không đọc được file này đúng cách.

---
