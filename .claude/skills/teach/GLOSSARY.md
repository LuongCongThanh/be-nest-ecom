# Back-end (NestJS) Glossary

Thuật ngữ Back-end dùng trong project `be-nest-ecom`. Chỉ thêm term khi user đã thực sự hiểu và có thể dùng đúng.

## Terms

**Module**:
Đơn vị tổ chức code trong NestJS — gom các Provider liên quan lại và khai báo dependency giữa chúng.
_Avoid_: package, component (Angular), folder

**Provider**:
Bất kỳ class nào được NestJS inject vào nơi khác qua DI — thường là Service, Repository, Guard, Pipe.
_Avoid_: helper, util class

**Decorator**:
Hàm bắt đầu bằng `@` dùng để gắn metadata lên class, method, hay parameter — nền tảng của mọi magic trong NestJS.
_Avoid_: annotation (Java term), attribute (C# term)

**Dependency Injection (DI)**:
Cơ chế NestJS tự tạo và truyền instance vào class — thay vì class tự `new` dependency của mình.
_Avoid_: IoC container, autowire

**Guard**:
Provider quyết định request có được phép tiếp tục hay không — chạy trước khi vào handler.
_Avoid_: middleware (khác nhau về lifecycle), auth check

**JWT (JSON Web Token)**:
Token tự chứa claims, được ký bằng secret — server không cần lưu session, chỉ cần verify chữ ký.
_Avoid_: auth token (quá chung), session token

**Refresh Token**:
Token thứ hai tồn tại lâu hơn Access Token — dùng để lấy Access Token mới mà không cần đăng nhập lại.
_Avoid_: long-lived token, renew token
