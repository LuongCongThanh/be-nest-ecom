# TypeScript Backend Learning Definitions

File này là bản mở rộng chi tiết cho 10 nhóm kiến thức cốt lõi khi học `TypeScript` để viết Backend.

Mục tiêu của tài liệu này không phải để bạn học thuộc lòng tất cả thuật ngữ, mà để:

- hiểu mỗi khái niệm thực sự đang giải quyết vấn đề gì
- biết khái niệm đó nằm ở tầng nào của backend
- phân biệt cái gì là nền tảng bắt buộc, cái gì là nâng cao
- tránh học TypeScript backend theo kiểu chỉ nhớ syntax nhưng không hiểu hệ thống

---

## Cách đọc tài liệu này

Mỗi mục sẽ đi theo cùng một cấu trúc:

- `Định nghĩa`: khái niệm đó là gì
- `Vì sao quan trọng`: tại sao backend cần nó
- `Bạn cần hiểu`: các ý cốt lõi phải nắm
- `Ví dụ trong backend`: nó xuất hiện ở đâu trong project thật
- `Sai lầm thường gặp`: lỗi tư duy hay gặp khi mới học
- `Khi nào coi như đã ổn`: dấu hiệu cho thấy bạn đã hiểu đủ để đi tiếp

---

## 1. Nền tảng ngôn ngữ TypeScript

### Định nghĩa

`TypeScript` là một ngôn ngữ mở rộng từ `JavaScript`, bổ sung hệ thống kiểu tĩnh (`static typing`) và các công cụ giúp code dễ kiểm soát hơn khi project lớn dần.

Nói ngắn gọn:

- `JavaScript` là thứ chạy thật ở runtime
- `TypeScript` giúp kiểm tra cấu trúc code trước khi chạy

TypeScript không thay thế JavaScript. Nó chỉ giúp bạn viết JavaScript có kiểm soát hơn.

### Vì sao quan trọng

Backend không chỉ là "viết API chạy được". Backend thường có:

- nhiều model dữ liệu
- nhiều module
- nhiều luồng nghiệp vụ
- nhiều điểm truyền dữ liệu giữa controller, service, repository, database

Khi project lớn lên, lỗi thường không đến từ chỗ "không biết syntax", mà đến từ:

- truyền sai shape dữ liệu
- dùng nhầm field
- trả response sai contract
- gọi function với input không đúng kiểu

TypeScript giảm bớt các lỗi này từ sớm.

### Bạn cần hiểu

#### Kiểu dữ liệu cơ bản

- `string`
- `number`
- `boolean`
- `null`
- `undefined`
- `array`
- `object`
- `tuple`
- `enum` hoặc các cách thay thế enum bằng literal union

Bạn cần hiểu:

- kiểu dữ liệu dùng để mô tả giá trị gì
- cùng một dữ liệu có thể được biểu diễn bằng nhiều cách
- chọn type sai sẽ dẫn đến khó kiểm soát logic phía sau

#### Biến, hàm, scope

- `let`, `const`
- function declaration
- arrow function
- parameter
- return type
- scope của biến

Trong backend, phần lớn logic là đọc input, gọi hàm, trả output. Nếu chưa chắc về hàm và scope, bạn sẽ rất khó đọc service logic.

#### `interface` và `type`

Hai công cụ này dùng để mô tả hình dạng dữ liệu.

Ví dụ:

- request DTO có field gì
- entity trả về có shape gì
- config object cần các key nào

Bạn không chỉ cần biết "viết được", mà cần hiểu:

- khi nào dùng `interface`
- khi nào dùng `type`
- khi nào cần union
- khi nào cần intersection

#### `union`, `intersection`, `literal type`

Đây là phần rất quan trọng trong backend TypeScript.

Ví dụ:

- status của order chỉ có thể là `PENDING | CONFIRMED | CANCELLED`
- role chỉ có thể là `ADMIN | USER`

Đây là cách đưa business rule vào type-level ở mức cơ bản.

#### `optional`, `readonly`

Bạn cần hiểu:

- field nào có thể thiếu
- field nào bắt buộc
- field nào chỉ đọc

Nếu không hiểu kỹ phần này, bạn sẽ rất dễ thiết kế DTO hoặc domain model mơ hồ.

#### Generic

Generic là cách viết code tổng quát mà vẫn giữ được type safety.

Ví dụ:

- response wrapper
- pagination result
- repository base method

Nếu học backend TypeScript nghiêm túc, generic là thứ bạn sớm muộn cũng phải hiểu.

#### Class cơ bản

Nếu đi theo `NestJS`, bạn cần hiểu:

- class là gì
- constructor là gì
- property là gì
- method là gì
- access modifier như `public`, `private`, `protected`

Bạn không cần thần thánh hóa `OOP`, nhưng bạn cần đọc được code class-based.

#### Module system

Bạn cần biết:

- `import`
- `export`
- default export
- named export
- dependency giữa các file

Đây là nền của việc tổ chức code backend.

### Ví dụ trong backend

- `CreateUserDto` định nghĩa input tạo user
- `UserResponse` định nghĩa output trả về
- `OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'`
- `PaginatedResult<T>` dùng cho danh sách có phân trang

### Sai lầm thường gặp

- nghĩ TypeScript là chỉ cần nhớ syntax
- lạm dụng `any`
- dùng type quá lỏng khiến TypeScript mất giá trị
- nhầm rằng "compile không lỗi" nghĩa là logic đúng
- học class quá sớm nhưng không hiểu function, object, data shape

### Khi nào coi như đã ổn

Bạn có thể:

- tự định nghĩa kiểu dữ liệu cho input/output
- đọc một file DTO hoặc service đơn giản mà không bị lạc
- giải thích được `type` đang bảo vệ điều gì và không bảo vệ điều gì

---

## 2. JavaScript runtime và môi trường Node.js

### Định nghĩa

`Node.js` là môi trường runtime cho phép JavaScript chạy ngoài trình duyệt, đặc biệt phù hợp với backend, script, tooling, và server-side applications.

TypeScript không chạy trực tiếp. Cuối cùng code TypeScript sẽ được chuyển thành JavaScript để chạy trên Node.js.

### Vì sao quan trọng

Nhiều người mới học backend TypeScript bị nhầm:

- họ nghĩ TypeScript là backend runtime
- họ nghĩ viết đúng type là đủ

Thực tế:

- runtime mới là nơi code thực thi
- mọi I/O, network, DB, file, timer, process đều diễn ra ở runtime

Nếu không hiểu Node.js, bạn sẽ không hiểu backend thực sự vận hành thế nào.

### Bạn cần hiểu

#### Event loop

Event loop là cơ chế giúp Node.js xử lý các tác vụ bất đồng bộ mà không cần block toàn bộ chương trình.

Bạn không cần đi quá sâu vào engine ngay từ đầu, nhưng cần nắm:

- vì sao `async` không làm mọi thứ chạy song song một cách thần kỳ
- vì sao query DB, gọi API, đọc file là async
- vì sao block CPU lâu sẽ làm server phản hồi chậm

#### `Promise` và `async/await`

Đây là nền của backend Node.js hiện đại.

Bạn cần hiểu:

- `Promise` biểu diễn kết quả sẽ có trong tương lai
- `await` chờ promise resolve hoặc reject
- lỗi async cần được bắt bằng `try/catch` hoặc handled chain

#### Xử lý lỗi async

Rất nhiều bug backend đến từ:

- quên `await`
- promise reject không được handle
- bắt lỗi không đúng tầng

Bạn cần hiểu:

- chỗ nào nên throw
- chỗ nào nên catch
- chỗ nào nên để global exception layer xử lý

#### Process và environment

Backend thường chạy khác nhau theo môi trường:

- local
- test
- staging
- production

Bạn cần hiểu:

- `process.env`
- config theo môi trường
- tại sao secret không được hard-code
- port, database URL, token secret được inject thế nào

#### Package manager và dependency

Bạn cần hiểu:

- `package.json`
- dependency vs devDependency
- script dùng để làm gì
- lock file có vai trò gì

### Ví dụ trong backend

- `await userRepository.findByEmail(email)`
- `process.env.JWT_SECRET`
- app khởi động bằng `main.ts`
- script `build`, `start:dev`, `test`

### Sai lầm thường gặp

- dùng `await` nhưng không hiểu promise chain
- nghĩ code chạy theo thứ tự viết ra trong mọi tình huống
- không phân biệt compile-time với runtime
- để business logic nặng CPU trong request cycle

### Khi nào coi như đã ổn

Bạn giải thích được:

- request vào backend sẽ chạm Node.js runtime ở đâu
- vì sao một thao tác DB là async
- vì sao TypeScript không thay thế việc hiểu runtime

---

## 3. TypeScript dùng trong backend thực tế

### Định nghĩa

Đây là tầng chuyển từ "biết ngôn ngữ" sang "biết dùng ngôn ngữ để mô tả contract backend".

Nó bao gồm việc dùng TypeScript để:

- mô tả input
- mô tả output
- mô tả dependency
- mô tả state
- hạn chế những kiểu sai sót phổ biến trong luồng dữ liệu backend

### Vì sao quan trọng

Backend luôn có nhiều điểm chuyển đổi dữ liệu:

- request body vào DTO
- DTO sang service input
- entity sang response
- config raw sang typed config

Nếu không kiểm soát chặt shape dữ liệu, backend sẽ sớm khó bảo trì.

### Bạn cần hiểu

#### DTO

`DTO` là Data Transfer Object.

Nó là object dùng để truyền dữ liệu giữa các tầng hoặc qua boundary.

Trong backend, DTO thường dùng cho:

- request input
- response output
- command/query internal

Điều quan trọng là:

- DTO không nhất thiết là entity DB
- DTO tồn tại để làm contract rõ ràng

#### Validation và runtime contract

TypeScript chỉ kiểm tra khi compile.

Nhưng dữ liệu từ client đi vào backend là dữ liệu runtime, không đáng tin.

Vì vậy bạn cần hiểu:

- type safety không thay thế validation
- request body phải được validate ở runtime
- field có type `string` trong code không có nghĩa client chắc chắn gửi string thật

#### Mapping

Mapping là bước chuyển từ một shape dữ liệu sang shape khác.

Ví dụ:

- request DTO -> domain input
- database row -> response DTO
- config env raw string -> typed config

Nếu bỏ qua bước mapping, code sẽ dễ bị dính chặt giữa các tầng.

#### Service typing và repository typing

Bạn cần biết cách dùng type để làm rõ:

- service nhận gì
- service trả gì
- repository query gì
- nullability ra sao

### Ví dụ trong backend

- `CreateProductDto`
- `UpdateOrderStatusDto`
- `UserProfileResponseDto`
- `AuthenticatedRequestUser`

### Sai lầm thường gặp

- dùng entity làm request DTO
- tin hoàn toàn vào TypeScript mà quên runtime validation
- để input raw đi thẳng vào business logic
- trả response lẫn cả field nhạy cảm như password hash

### Khi nào coi như đã ổn

Bạn phân biệt được rõ:

- entity
- DTO
- domain object
- response contract

và biết vì sao không nên trộn tất cả chúng vào một object duy nhất.

---

## 4. HTTP và API

### Định nghĩa

`HTTP` là giao thức giao tiếp phổ biến nhất giữa client và backend.

`API` là giao diện mà backend cung cấp để client hoặc system khác gọi vào.

Nếu frontend là nơi hiển thị và tương tác, thì backend qua HTTP/API là nơi nhận yêu cầu, xử lý logic, và trả kết quả.

### Vì sao quan trọng

Không hiểu HTTP thì rất dễ rơi vào kiểu:

- viết API nhưng không biết request đang đến từ đâu
- dùng sai method
- trả status code lộn xộn
- thiết kế endpoint khó dùng

Backend tốt luôn bắt đầu từ việc hiểu rõ boundary giao tiếp.

### Bạn cần hiểu

#### Request và response

Request thường gồm:

- method
- URL
- header
- query
- params
- body

Response thường gồm:

- status code
- header
- body

Bạn cần hiểu mỗi phần có vai trò gì.

#### HTTP methods

- `GET`: lấy dữ liệu
- `POST`: tạo mới hoặc trigger action
- `PUT`: thay thế toàn bộ tài nguyên
- `PATCH`: cập nhật một phần
- `DELETE`: xóa

Điều quan trọng không chỉ là nhớ tên method, mà là hiểu ngữ nghĩa.

#### Status code

- `200 OK`
- `201 Created`
- `204 No Content`
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict`
- `422 Unprocessable Entity`
- `500 Internal Server Error`

Status code là cách backend giao tiếp ngắn gọn về kết quả xử lý.

#### REST

REST không chỉ là "URL đẹp".

Nó là cách thiết kế resource-oriented API tương đối nhất quán.

Ví dụ:

- `/users`
- `/users/:id`
- `/orders/:id/items`

#### API contract

API contract là thỏa thuận giữa backend và client:

- field nào có
- type ra sao
- status code nào có thể trả về
- khi lỗi thì response shape thế nào

### Ví dụ trong backend

- `GET /products?page=1&limit=20`
- `POST /auth/login`
- `PATCH /orders/:id/status`

### Sai lầm thường gặp

- dùng `POST` cho mọi thứ
- status code không phản ánh đúng lỗi
- response lúc thì object, lúc thì string tự do
- endpoint name theo hành động nội bộ thay vì theo resource hoặc use case rõ ràng

### Khi nào coi như đã ổn

Bạn có thể:

- tự thiết kế một module CRUD API khá rõ ràng
- giải thích vì sao endpoint này dùng method này
- định nghĩa response success và error có cấu trúc

---

## 5. Database và data modeling

### Định nghĩa

Database là nơi backend lưu và truy xuất dữ liệu bền vững.

Data modeling là quá trình thiết kế cấu trúc dữ liệu sao cho:

- phản ánh đúng nghiệp vụ
- tránh dư thừa vô nghĩa
- hỗ trợ query tốt
- hỗ trợ thay đổi về sau

### Vì sao quan trọng

Nhiều backend hỏng không phải vì framework yếu, mà vì model dữ liệu sai từ đầu.

Một schema tệ sẽ dẫn đến:

- query rối
- business rule khó enforce
- hiệu năng kém
- bug dữ liệu khó sửa

### Bạn cần hiểu

#### SQL cơ bản

- `SELECT`
- `INSERT`
- `UPDATE`
- `DELETE`
- `JOIN`
- `WHERE`
- `ORDER BY`
- `GROUP BY`

Bạn không cần thành DBA ngay, nhưng phải đọc được query cơ bản.

#### Quan hệ dữ liệu

- `1-1`
- `1-n`
- `n-n`

Bạn cần hiểu:

- quan hệ nào nên tách bảng
- khi nào dùng bảng trung gian
- khi nào dữ liệu nên embed dưới dạng snapshot

#### Constraint

- primary key
- foreign key
- unique
- nullable
- default

Constraint là một phần business rule được ép xuống tầng dữ liệu.

#### Index

Index giúp truy vấn nhanh hơn, nhưng không miễn phí.

Bạn cần hiểu:

- khi nào thêm index
- thêm sai có thể làm write chậm hơn
- index nên bám vào pattern query thật

#### Transaction

Transaction giúp đảm bảo nhiều thao tác DB được xử lý như một đơn vị logic thống nhất.

Rất quan trọng trong:

- tạo order và trừ tồn kho
- chuyển trạng thái và ghi audit
- nhiều bước cần all-or-nothing

#### ORM

ORM như `Prisma` hoặc `TypeORM` giúp lập trình viên thao tác DB qua code dễ hơn.

Tuy nhiên bạn cần hiểu:

- ORM không thay thế việc hiểu SQL
- ORM abstraction có giới hạn
- query generated bởi ORM vẫn ảnh hưởng hiệu năng thật

### Ví dụ trong backend

- bảng `users`
- bảng `products`
- bảng `orders`
- bảng `order_items`
- unique email
- foreign key từ `order_items.order_id` sang `orders.id`

### Sai lầm thường gặp

- thiết kế bảng theo UI thay vì theo domain
- field nào cũng nullable
- không hiểu uniqueness là business rule chứ không chỉ là DB rule
- phụ thuộc hoàn toàn vào ORM mà không đọc query

### Khi nào coi như đã ổn

Bạn có thể nhìn một bài toán như:

- user đặt hàng
- order có nhiều item
- mỗi item tham chiếu product

và phác ra schema tương đối hợp lý.

---

## 6. Auth và security

### Định nghĩa

`Authentication` là xác thực danh tính: bạn là ai.

`Authorization` là phân quyền: bạn được làm gì.

Security trong backend là tập hợp các biện pháp bảo vệ hệ thống, dữ liệu, và luồng xử lý khỏi truy cập sai, input xấu, lạm dụng, và rò rỉ.

### Vì sao quan trọng

API chạy được nhưng không bảo vệ được dữ liệu thì chưa phải backend sẵn sàng cho thực tế.

Auth và security là ranh giới giữa:

- demo app
- backend có thể phục vụ người dùng thật

### Bạn cần hiểu

#### Password hashing

Mật khẩu không được lưu plain text.

Bạn cần hiểu:

- hash khác encrypt
- hash một chiều
- nên dùng thuật toán phù hợp như `bcrypt` hoặc tương đương phù hợp hệ sinh thái

#### JWT

JWT là một cách đóng gói thông tin xác thực thành token.

Bạn cần hiểu:

- token chứa claim gì
- token có hạn dùng
- token không phải session thần kỳ
- token bị lộ là rủi ro thật

#### Access token và refresh token

Mô hình phổ biến:

- access token sống ngắn
- refresh token dùng để cấp lại access token

Bạn cần hiểu flow chứ không chỉ hiểu khái niệm.

#### Guard, role, permission

Backend cần chặn truy cập ở boundary:

- user chưa login
- user không đủ quyền
- action không phù hợp với trạng thái hiện tại

Role-based access control là bước đầu, nhưng project lớn có thể cần permission tinh hơn.

#### Validation và sanitize

Input từ client luôn phải bị nghi ngờ.

Bạn cần hiểu:

- validate shape
- validate domain rule
- sanitize khi cần
- không tin dữ liệu chỉ vì frontend "đã kiểm rồi"

#### Rate limiting và abuse protection

Backend phải có cách hạn chế lạm dụng:

- spam login
- brute force
- spam endpoint nặng

### Ví dụ trong backend

- `POST /auth/register`
- `POST /auth/login`
- `GET /me`
- `PATCH /users/:id/role` chỉ admin mới được gọi

### Sai lầm thường gặp

- lưu password raw hoặc log password
- trả token nhưng không có chiến lược hết hạn
- chỉ check auth ở frontend
- nhầm `401` với `403`
- nghĩ security là việc "để sau"

### Khi nào coi như đã ổn

Bạn hiểu được trọn vẹn một flow:

- user đăng ký
- user đăng nhập
- backend cấp token
- user gọi route protected
- backend kiểm tra identity và quyền

---

## 7. Business logic và workflow thật

### Định nghĩa

Business logic là tập hợp quy tắc nghiệp vụ mà hệ thống phải tuân theo.

Workflow là chuỗi các bước hoặc trạng thái mà một thực thể đi qua trong đời sống nghiệp vụ.

Ví dụ:

- order được tạo
- order được xác nhận
- order được giao
- order bị hủy

### Vì sao quan trọng

CRUD chỉ là phần đầu.

Backend thật thường khó ở chỗ:

- không phải dữ liệu nào cũng sửa tự do
- trạng thái có quy luật chuyển đổi
- side effect phải đúng thứ tự
- nhiều bước phải đồng bộ với nhau

Đây là nơi "học framework" không còn đủ nữa.

### Bạn cần hiểu

#### State transition

Không phải mọi trạng thái đều chuyển sang nhau được.

Ví dụ:

- `PENDING -> CONFIRMED` có thể hợp lệ
- `CANCELLED -> SHIPPED` thường không hợp lệ

Đây là logic nghiệp vụ, không phải chỉ là cập nhật một field string.

#### Invariant

Invariant là điều kiện luôn phải đúng để domain còn hợp lệ.

Ví dụ:

- tồn kho không được âm
- order đã giao thì không được hủy kiểu thông thường
- email user là duy nhất

#### Idempotency

Idempotency nghĩa là gọi lại cùng một action nhiều lần mà không làm hệ thống hỏng hoặc nhân đôi kết quả ngoài ý muốn.

Rất quan trọng với:

- payment callback
- retry request
- webhook

#### Side effect

Side effect là các tác động phụ ngoài giá trị trả về:

- ghi DB
- gửi email
- đẩy event
- gọi service khác

Bạn cần học cách kiểm soát side effect để workflow không rối.

#### Transaction boundary

Một workflow nhiều bước cần xác định:

- bước nào phải cùng transaction
- bước nào có thể eventual consistency
- bước nào thất bại thì rollback

### Ví dụ trong backend

- confirm order thì trừ stock
- cancel confirmed order thì hoàn stock
- payment success thì update trạng thái order

### Sai lầm thường gặp

- coi business flow chỉ là vài endpoint CRUD
- update state tự do không có rule
- side effect nằm rải rác ở controller
- không nghĩ đến retry và double-submit

### Khi nào coi như đã ổn

Bạn có thể mô tả rõ:

- entity nào có lifecycle gì
- trạng thái nào chuyển được sang đâu
- rule nào cần enforce ở service/domain layer

---

## 8. Testing, logging, deployment, và vận hành cơ bản

### Định nghĩa

Đây là nhóm kiến thức giúp backend không chỉ "viết xong", mà còn:

- kiểm chứng được
- quan sát được
- chạy được ở môi trường thật

### Vì sao quan trọng

Code không có test và không có quan sát thì rất khó tin cậy.

Bạn có thể có một backend chạy local tốt, nhưng vẫn rất yếu nếu:

- không biết test gì
- không biết log gì
- không biết deploy ra sao
- không biết lỗi đang xảy ra ở đâu

### Bạn cần hiểu

#### Unit test

Kiểm tra một đơn vị logic nhỏ, thường là function hoặc service, trong điều kiện được kiểm soát.

Mục tiêu:

- xác minh business rule
- bắt regression sớm

#### Integration test

Kiểm tra nhiều thành phần ghép với nhau:

- service + repository
- API + DB
- auth flow với dependency thật hoặc gần thật

#### E2E test

Kiểm tra luồng gần với cách người dùng hoặc client thực gọi hệ thống.

Ví dụ:

- gọi endpoint register
- login
- lấy profile protected

#### Logging

Log là cách backend kể lại chuyện gì đã xảy ra.

Bạn cần hiểu:

- log thông tin gì
- log ở mức nào
- không log dữ liệu nhạy cảm
- log phải giúp điều tra sự cố, không chỉ "cho có"

#### Error handling

Bạn cần có chiến lược:

- lỗi validation trả gì
- lỗi domain trả gì
- lỗi hạ tầng trả gì
- lỗi không mong đợi được bắt ở đâu

#### Deployment

Bạn không cần thành DevOps ngay, nhưng cần hiểu:

- backend được build thế nào
- chạy bằng process nào
- biến môi trường được inject ra sao
- migration DB đi cùng deploy như thế nào

### Ví dụ trong backend

- unit test cho service confirm order
- integration test cho auth module
- log request id khi có lỗi
- deploy app lên server/container

### Sai lầm thường gặp

- chỉ test happy path
- log quá ít hoặc log quá ồn
- log secret
- đợi production lỗi rồi mới nghĩ đến observability
- tưởng deploy chỉ là `npm run start`

### Khi nào coi như đã ổn

Bạn biết tự hỏi:

- logic này nên test ở mức nào
- lỗi này user nên thấy gì
- khi production lỗi thì mình xem log ở đâu

---

## 9. TypeScript nâng cao cho backend

### Định nghĩa

Đây là nhóm kiến thức giúp bạn dùng TypeScript như một công cụ thiết kế tốt hơn, không chỉ là công cụ gắn type đơn giản.

Nó đặc biệt hữu ích khi:

- project nhiều module
- domain nhiều trạng thái
- utility nhiều
- contract nhiều biến thể

### Vì sao quan trọng

Nếu học đến mức backend có quy mô vừa trở lên, TypeScript cơ bản sẽ chưa đủ.

Bạn sẽ cần:

- type chặt hơn
- biểu diễn state rõ hơn
- tái sử dụng type an toàn hơn
- giảm duplication trong contract

### Bạn cần hiểu

#### Utility types

Ví dụ:

- `Partial<T>`
- `Pick<T, K>`
- `Omit<T, K>`
- `Record<K, V>`
- `ReturnType<T>`

Đây là công cụ cực hay để biến đổi type thay vì viết lại bằng tay.

#### Type narrowing

TypeScript có thể suy luận hẹp kiểu sau khi bạn check điều kiện.

Điều này quan trọng khi xử lý:

- union type
- nullable result
- error branch

#### Custom type guard

Đây là kỹ thuật giúp bạn dạy TypeScript hiểu rõ hơn một giá trị runtime đang thuộc loại nào.

Rất hữu ích trong:

- parsing
- config validation
- discriminated logic

#### Discriminated union

Đây là một cách mạnh để biểu diễn nhiều trạng thái hợp lệ của dữ liệu.

Ví dụ:

- command result thành công hay thất bại
- job status
- payment method variants

#### Decorator và metadata

Nếu đi theo NestJS, bạn cần hiểu ở mức thực dụng:

- decorator làm gì
- metadata được framework dùng ra sao
- vì sao code trông "magic" nhưng thực ra vẫn có cơ chế phía sau

#### Giới hạn của TypeScript

Phần quan trọng nhất của nâng cao là biết giới hạn:

- type bị xóa ở runtime
- backend vẫn cần validation thật
- code quá phức tạp vì type-level trick có thể làm team khó đọc

### Ví dụ trong backend

- `UpdateUserDto = Partial<CreateUserDto>`
- union cho kết quả xử lý payment
- typed config factory

### Sai lầm thường gặp

- cố gắng giải mọi vấn đề bằng type trick
- viết type quá phức tạp hơn cả business problem
- tưởng advanced TypeScript đồng nghĩa với clean architecture

### Khi nào coi như đã ổn

Bạn biết:

- dùng utility type đúng chỗ
- giữ type đủ chặt nhưng không cực đoan
- ưu tiên readability và boundary rõ ràng

---

## 10. Tư duy kiến trúc backend

### Định nghĩa

Kiến trúc backend là cách tổ chức hệ thống để code không chỉ chạy được hôm nay, mà còn:

- dễ hiểu
- dễ thay đổi
- dễ kiểm soát dependency
- dễ mở rộng khi business phức tạp hơn

### Vì sao quan trọng

Khi project còn nhỏ, nhiều quyết định kiến trúc chưa lộ vấn đề.

Nhưng khi hệ thống có:

- nhiều module
- nhiều người cùng làm
- nhiều use case
- nhiều side effect

thì cách chia tầng và dependency bắt đầu quyết định chất lượng hệ thống.

### Bạn cần hiểu

#### Layered architecture

Đây là kiểu phổ biến nhất để bắt đầu:

- controller
- service
- repository
- database

Mục tiêu:

- mỗi tầng có trách nhiệm tương đối rõ
- boundary dễ đọc

#### Modular monolith

Một app duy nhất nhưng chia module rõ theo domain hoặc feature:

- users
- auth
- orders
- inventory

Đây là mô hình rất phù hợp để học backend nghiêm túc.

#### Separation of concerns

Mỗi phần nên gánh đúng trách nhiệm của nó.

Ví dụ:

- controller nhận request và trả response
- service giữ business rule
- repository xử lý persistence

Nếu mọi thứ dồn vào controller, hệ thống sẽ nhanh chóng khó bảo trì.

#### Dependency direction

Bạn cần hiểu:

- tầng trên gọi tầng dưới
- business rule không nên phụ thuộc lung tung vào chi tiết ngoài biên
- dependency càng rối thì test và refactor càng đau

#### DDD-lite và domain thinking

Khi business phức tạp hơn CRUD, bạn cần bắt đầu nghĩ theo domain:

- entity nào là trung tâm
- rule nào là invariant
- use case nào thay đổi state
- boundary module nào nên tách

Bạn chưa cần học DDD cực sâu từ đầu, nhưng cần học cách nhìn hệ thống theo nghiệp vụ chứ không chỉ theo bảng DB.

#### Khi nào học microservices

Microservices không phải level-up bắt buộc sớm.

Bạn chỉ nên học sâu khi:

- đã hiểu modular monolith
- đã đau thật với boundary và scale problem
- đã hiểu transaction, event, observability, deployment complexity

### Ví dụ trong backend

- module `auth` không tự ý nhét logic order vào trong
- `orders` service điều phối workflow order
- `inventory` giữ rule tồn kho

### Sai lầm thường gặp

- học từ khóa kiến trúc trước khi làm vững CRUD và DB
- chia microservice quá sớm
- coi folder structure là toàn bộ kiến trúc
- nghĩ dùng NestJS là mặc định có kiến trúc tốt

### Khi nào coi như đã ổn

Bạn có thể:

- giải thích vì sao code nên chia tầng
- chỉ ra business rule nên nằm ở đâu
- nhận ra khi nào một module đang phụ thuộc sai hướng

---

## Kết nối 10 mục này với nhau

10 mục trên không phải 10 khối tách rời.

Chúng liên kết theo logic học như sau:

1. `Nền tảng TypeScript`
2. `Node.js runtime`
3. `TypeScript áp dụng vào backend contract`
4. `HTTP/API`
5. `Database/data modeling`
6. `Auth/security`
7. `Business workflow`
8. `Testing/logging/deploy`
9. `TypeScript nâng cao`
10. `Architecture`

Nếu học ngược thứ tự, bạn sẽ rất dễ:

- nói được từ khóa nâng cao nhưng không làm được bài toán cơ bản
- biết framework nhưng không hiểu hệ thống
- biết syntax nhưng không biết đặt business rule ở đâu

---

## Cách tự kiểm tra mình đang thiếu gì

Nếu bạn đang học backend TypeScript, hãy tự hỏi:

### Nếu yếu mục 1

Bạn sẽ thấy:

- đọc type chậm
- hay dùng `any`
- khó viết DTO rõ ràng

### Nếu yếu mục 2

Bạn sẽ thấy:

- không hiểu async bug
- khó debug promise
- không hiểu config runtime

### Nếu yếu mục 3

Bạn sẽ thấy:

- trộn entity, DTO, response
- boundary dữ liệu lộn xộn

### Nếu yếu mục 4

Bạn sẽ thấy:

- API design thiếu nhất quán
- status code dùng tùy hứng

### Nếu yếu mục 5

Bạn sẽ thấy:

- schema dễ sai nghiệp vụ
- query khó cứu

### Nếu yếu mục 6

Bạn sẽ thấy:

- auth làm xong nhưng không an toàn
- route protected thiếu tin cậy

### Nếu yếu mục 7

Bạn sẽ thấy:

- backend chỉ dừng ở CRUD
- flow thật dễ bug

### Nếu yếu mục 8

Bạn sẽ thấy:

- không biết chứng minh code đúng
- không biết điều tra lỗi

### Nếu yếu mục 9

Bạn sẽ thấy:

- type lặp lại nhiều
- khó biểu diễn state phức tạp

### Nếu yếu mục 10

Bạn sẽ thấy:

- code lớn lên rất nhanh nhưng rất khó sửa
- module phụ thuộc chéo

---

## Kết luận ngắn

Muốn học `TypeScript` để viết backend tốt, bạn không chỉ học một ngôn ngữ.

Bạn đang học đồng thời:

- một ngôn ngữ có type system
- một runtime server-side
- một cách thiết kế API
- một cách mô hình hóa dữ liệu
- một cách bảo vệ hệ thống
- một cách tổ chức business rule
- một cách xây phần mềm có thể sống lâu

Nói gọn lại:

`TypeScript là công cụ. Backend là hệ thống.`

Bạn cần học cả hai cùng nhau, nhưng theo thứ tự đúng.

---

## Thứ tự học khuyên dùng

Nếu bạn muốn đi thực chiến, thứ tự học tốt là:

1. JavaScript cơ bản đủ chắc
2. TypeScript nền tảng
3. Node.js async/runtime
4. HTTP và REST API
5. SQL và data modeling
6. CRUD module hoàn chỉnh
7. Auth cơ bản
8. Business flow thực tế
9. Test, log, deploy
10. Advanced TypeScript và architecture

---

## Dùng tài liệu này như thế nào

Bạn có thể dùng file này theo 3 cách:

1. Đọc toàn bộ để có bản đồ tổng thể trước khi học
2. Mỗi tuần chọn 1 mục để đào sâu và làm mini project tương ứng
3. Khi bị kẹt trong một task backend, quay lại tìm xem bạn đang thiếu kiến thức ở mục nào

Nếu dùng đúng cách, file này không chỉ là glossary mở rộng, mà là bản đồ để bạn biết mình đang đứng ở đâu trên hành trình học backend bằng TypeScript.
