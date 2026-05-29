# TASK-117: Auth Guards & Decorators

> ⚠️ **STUB** — Convention canonical: [`../CONVENTIONS.md §12`](../CONVENTIONS.md) (Auth Middleware Stack)

---

## 🎯 Intent

Cơ chế **fail-by-default**: mọi route require JWT trừ khi đánh dấu `@Public()`. Cung cấp decorator chuẩn (`@Roles`, `@CurrentUser`) cho mọi feature module dùng — không cần tự re-implement.

Đây là **mechanism**, không phải feature Auth (Auth feature ở `business/01-identity/`).

---

## 🧠 Cách hoạt động

Đọc phần này trước khi code để hiểu guards/decorators đang giải quyết bài toán gì trong runtime.

### Request flow

Khi một HTTP request đi vào app, thứ tự ý tưởng là:

```text
request -> JwtAuthGuard -> RolesGuard -> controller handler
```

- `JwtAuthGuard` chạy trước vì nó là tầng **authentication**: request này có cần đăng nhập không, và token có hợp lệ không.
- `RolesGuard` chạy sau vì nó là tầng **authorization**: user đã đăng nhập rồi thì có đúng quyền để vào endpoint này không.
- Chỉ khi qua được cả 2 tầng thì controller mới chạy.

### `@Public()` thực chất làm gì

`@Public()` không tự mở route. Nó chỉ gắn metadata lên route.

Sau đó `JwtAuthGuard` dùng `Reflector` để đọc metadata đó:

- có `@Public()` -> bỏ qua JWT check
- không có `@Public()` -> bắt buộc phải có Bearer token hợp lệ

Vì vậy mental model nên là:

- `@Public()` = gắn nhãn "route này được phép không cần auth"
- `JwtAuthGuard` = đọc nhãn đó và quyết định có chặn request hay không

### `AuthGuard('jwt')` và `JwtStrategy` phối hợp thế nào

`JwtAuthGuard` kế thừa `AuthGuard('jwt')`, nên khi route không public:

- Nest đọc Bearer token từ header
- verify chữ ký và expiry
- nếu hợp lệ thì gọi `JwtStrategy.validate(payload)`

`JwtStrategy.validate()` không chỉ kiểm tra payload. Nó còn quyết định object nào sẽ được attach vào `request.user`.

Trong repo này, payload gốc có thể có:

```ts
{ sub, email, role }
```

nhưng sau `validate()`, `request.user` được chuẩn hóa thành:

```ts
{ id, email, role }
```

Đó là lý do `@CurrentUser('id')` là đúng với runtime thực tế của app.

### `@CurrentUser()` thực chất lấy gì

`@CurrentUser()` không đọc trực tiếp JWT payload raw. Nó đọc từ `request.user` sau khi JWT strategy đã xác thực và attach user vào request.

Vì vậy:

- `@CurrentUser()` -> lấy toàn bộ `request.user`
- `@CurrentUser('id')` -> lấy `request.user.id`
- nếu `request.user` sai shape, cần debug ở `JwtStrategy.validate()`, không phải ở decorator này

### Phân biệt `401` và `403`

- `401 Unauthorized` = request chưa qua được authentication
- `403 Forbidden` = đã xác thực xong nhưng không đủ quyền

Trong task này:

- token sai hoặc không có -> `401 TOKEN_INVALID`
- token hết hạn -> `401 TOKEN_EXPIRED`
- token hợp lệ nhưng role không đúng -> `403 FORBIDDEN`

---

## 🛠️ Thứ tự dùng CLI và sửa file

Nên làm theo đúng thứ tự này:

1. Chạy Nest CLI để scaffold decorator/guard trước.
2. Để CLI tạo đúng file và đúng cấu trúc thư mục.
3. Mở file vừa tạo và thay nội dung bằng implementation mong muốn.
4. Đăng ký `APP_GUARD` trong `AppModule`.
5. Đánh dấu các public endpoint bằng `@Public()`.
6. Chạy app và verify từng behavior.

Không nên viết file tay trước rồi mới chạy CLI, vì:

- dễ lệch cấu trúc thư mục mà repo đang dùng
- dễ tự đặt tên file/import path khác với pattern chung
- dễ bị CLI tạo thêm file khác, gây trùng logic hoặc nhiễu khi học

CLI ở đây chỉ tạo **khung**; phần quan trọng vẫn là bạn hiểu và thay nội dung bên trong.

---

## ❓ Vì sao phải code như vậy

Phần này giải thích lý do đằng sau các quyết định thiết kế, không chỉ mô tả code làm gì.

### Vì sao dùng global guard thay vì gắn từng route

Mục tiêu của task này là **fail-by-default**.

Nếu mỗi controller hoặc mỗi route tự gắn:

```ts
@UseGuards(JwtAuthGuard)
```

thì hệ thống phụ thuộc vào trí nhớ của developer. Chỉ cần quên một route là route đó bị public ngoài ý muốn.

Khi đăng ký `JwtAuthGuard` bằng `APP_GUARD`, toàn app mặc định bị bảo vệ. Lúc đó `@Public()` chỉ đóng vai trò đánh dấu ngoại lệ. Cách này an toàn hơn vì:

- mặc định chặn
- chỉ mở khi chủ động cho phép
- giảm rủi ro quên guard ở endpoint mới

### Vì sao `@Public()` dùng metadata

Không nên hardcode trong guard kiểu:

- path `/health` thì cho qua
- path `/auth/login` thì cho qua

vì như vậy guard bị dính chặt vào business routes.

`@Public()` dùng `SetMetadata(...)` để gắn một nhãn trừu tượng lên route. `JwtAuthGuard` chỉ đọc nhãn đó bằng `Reflector`. Cách làm này giúp:

- tách route declaration khỏi guard logic
- đổi URL mà không phải sửa auth rule
- controller tự mô tả rõ route nào public

### Vì sao `JwtAuthGuard` kế thừa `AuthGuard('jwt')`

NestJS + Passport đã có sẵn cơ chế chuẩn để:

- đọc Bearer token
- verify signature
- check expiry
- gọi strategy tương ứng

Nếu tự viết lại toàn bộ logic này trong guard thì vừa dài vừa dễ lỗi. Vì vậy pattern tốt hơn là kế thừa `AuthGuard('jwt')`, rồi chỉ custom ở các điểm business-specific:

- `canActivate()` để hỗ trợ `@Public()`
- `handleRequest()` để chuẩn hóa error response

### Vì sao phải custom `handleRequest()`

Nếu không custom, client thường chỉ nhận lỗi auth chung chung. Nhưng ở đây hệ thống cần phân biệt rõ:

- token hết hạn
- token sai
- user không hợp lệ

Việc trả `TOKEN_EXPIRED` thay vì gom hết vào `Unauthorized` giúp frontend và client logic phản ứng đúng hơn, ví dụ:

- refresh token
- yêu cầu login lại
- hiển thị message phù hợp

### Vì sao phải qua `JwtStrategy.validate()`

JWT payload không nên được xem là user object cuối cùng của app.

Payload chỉ là dữ liệu đã được ký. App vẫn cần quyết định:

- user đó còn tồn tại không
- tài khoản có active không
- object nào sẽ được attach vào `request.user`

Vì vậy `validate()` đóng vai trò chuyển từ "dữ liệu trong token" sang "user object mà app tin cậy ở runtime".

### Vì sao tách `JwtAuthGuard` và `RolesGuard`

Hai vấn đề này khác nhau:

- authentication: "Bạn là ai?"
- authorization: "Bạn được phép làm gì?"

Tách thành 2 guard giúp:

- dễ hiểu hơn khi đọc flow
- dễ test từng lớp
- dễ đổi rule phân quyền mà không đụng auth
- giữ single responsibility

### Vì sao `RolesGuard` dùng metadata từ `@Roles(...)`

Guard không nên tự biết route nào cần quyền gì. Quyền nên được khai báo ngay tại endpoint:

```ts
@Roles(Role.ADMIN)
```

Sau đó `RolesGuard` chỉ làm một việc: đọc metadata và so sánh với `request.user.role`.

Điều này giúp controller tự mô tả yêu cầu quyền một cách rõ ràng, còn guard vẫn generic.

### Vì sao cần `@CurrentUser()` thay vì đọc `@Req() req`

Nếu controller nào cũng đọc `req.user` trực tiếp thì:

- lặp code
- dính vào Express request shape
- khó type-safe
- controller phải biết nhiều chi tiết hạ tầng

`@CurrentUser()` giúp controller chỉ nhận đúng dữ liệu nó cần, ví dụ:

- `@CurrentUser()` -> cả user object
- `@CurrentUser('id')` -> chỉ user id

Đây là cách làm sạch controller và giảm coupling với HTTP layer.

### Vì sao `@CurrentUser('id')` dùng `id` thay vì `sub`

`sub` là ngôn ngữ của JWT payload. `id` là ngôn ngữ nội bộ mà app muốn dùng.

`JwtStrategy.validate()` là nơi map:

```text
payload.sub -> request.user.id
```

Nhờ vậy controller và service không phải rải khắp nơi kiến thức về JWT claim names.

---

## 🔎 Cách đọc implementation

Nếu bạn mở code thật và thấy khó theo dõi, đừng đọc từ trên xuống như văn bản. Hãy đọc theo từng khối, và với mỗi khối tự hỏi:

- khối này nhận input gì
- khối này quyết định gì
- khối này trả ra gì
- nếu bỏ khối này đi thì hệ thống hở ở đâu

### `public.decorator.ts`

- tạo metadata key `isPublic`
- `@Public()` chỉ gắn nhãn lên route
- decorator này không tự mở route, guard khác sẽ đọc nhãn đó

### `roles.decorator.ts`

- tạo metadata key `roles`
- `@Roles(...)` chỉ khai báo danh sách role được phép
- decorator này cũng không tự chặn request

### `current-user.decorator.ts`

- đọc `request.user`
- nếu truyền `'id'` thì trả `request.user.id`
- nếu không truyền key thì trả toàn bộ `request.user`
- decorator này không tạo user; nó chỉ đọc lại user mà strategy đã attach

### `JwtAuthGuard`

Nên đọc thành 2 khối:

- `canActivate()`:
  - route có `@Public()` không
  - nếu có thì cho qua
  - nếu không thì gọi JWT auth flow chuẩn của Passport
- `handleRequest()`:
  - expired token -> `TOKEN_EXPIRED`
  - lỗi khác hoặc không có user -> `TOKEN_INVALID`
  - không lỗi -> trả user

### `RolesGuard`

Nên đọc thành 3 khối:

- đọc metadata từ `@Roles(...)`
- nếu route không khai báo role thì cho authenticated user qua
- nếu có khai báo role thì so `request.user.role` với role yêu cầu

### `AppModule`

Khi thấy:

```ts
{ provide: APP_GUARD, useClass: JwtAuthGuard }
{ provide: APP_GUARD, useClass: RolesGuard }
```

hãy hiểu là:

- cả app có 2 người gác cổng global
- guard đầu kiểm tra đăng nhập
- guard sau kiểm tra quyền

---

## ✅ Acceptance Criteria

### Guards

- [ ] `JwtAuthGuard` đăng ký global ở `APP_GUARD` (trong `AppModule.providers`). KHÔNG khai báo từng controller.
- [ ] Guard đọc Bearer token, verify chữ ký + expiry, attach `user` vào `request.user`.
- [ ] `RolesGuard` đăng ký global sau `JwtAuthGuard`. Check `@Roles(...)` metadata.
- [ ] Token expired → `401` với code `TOKEN_EXPIRED`. Sai signature → `401` `TOKEN_INVALID`.

### Decorators (ở `src/common/decorators/`)

- [ ] `@Public()` — đánh dấu route không cần auth (set metadata `IS_PUBLIC: true`).
- [ ] `@Roles(...roles: Role[])` — yêu cầu role cụ thể.
- [ ] `@CurrentUser()` — param decorator inject `request.user` vào handler.

### Middleware order (theo CONVENTIONS §12)

```
1. Helmet → 2. CORS → 3. ValidationPipe → 4. JwtAuthGuard
→ 5. RolesGuard → 6. Controller → 7. ResponseInterceptor → 8. ExceptionFilter
```

### Tests

- [ ] `GET /health` có `@Public()` → không token vẫn `200`.
- [ ] `GET /me` không có `@Public()` → không token → `401`.
- [ ] Endpoint `@Roles(Role.ADMIN)` → user role USER → `403`.

---

## 🔗 Canonical references

- [`../CONVENTIONS.md §12`](../CONVENTIONS.md) — Full auth middleware stack.
- [`../../business/01-identity/02-jwt-auth.md`](../../business/01-identity/02-jwt-auth.md) — JWT strategy feature (dùng cơ chế này).
- [`./README.md`](./README.md) — Group DoD.
