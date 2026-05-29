# Task 11 Study Note — Controller Registration In NestJS

**Date:** 2026-05-30
**Related task:** [11-guards-decorators.md](./11-guards-decorators.md)

## Vấn đề vừa gặp

Khi gọi:

```powershell
curl -i http://localhost:3000/api/v1
```

kết quả trả về là `404 Not Found`, không phải `401 TOKEN_INVALID`.

Điều này chưa chứng minh `JwtAuthGuard` bị sai. Nó cho thấy route `/api/v1` hiện chưa tồn tại thật trong app runtime.

## Ý chính cần nhớ

Trong NestJS:

- `@Controller()` chỉ mới định nghĩa class có thể nhận request
- Muốn route hoạt động thật, controller phải được module biết tới qua `controllers: [...]`
- Nếu file controller tồn tại nhưng chưa được đăng ký trong module, request sẽ rơi vào `404`, không phải `401`

Mental model đơn giản:

- `controller` = quầy tiếp nhận request
- `module` = danh sách quầy mà app mở thật
- Có file controller nhưng chưa khai báo trong module = quầy chưa mở

## Áp vào repo hiện tại

- [`src/app.controller.ts`](../../../src/app.controller.ts) có `@Get()`
- Nhưng [`src/app.module.ts`](../../../src/app.module.ts) hiện chưa khai báo `controllers: [AppController]`
- Vì vậy route `/api/v1` chưa được mount vào app

Kết luận:

- `/health` pass vì route này có thật và được đánh dấu `@Public()`
- `/api/v1` đang `404` vì route chưa tồn tại trong module graph
- Muốn verify `default-deny`, cần một endpoint có thật nhưng không có `@Public()`

## Bước tiếp theo đúng

1. Import `AppController` vào `src/app.module.ts`
2. Thêm `controllers: [AppController]` vào `@Module(...)`
3. Chạy lại app
4. Gọi lại:

```powershell
curl -i http://localhost:3000/api/v1
```

Kỳ vọng lúc đó:

- không còn `404`
- chuyển thành `401`
- body có `code: "TOKEN_INVALID"`

## Vì sao bước này quan trọng

Task 11 cần chứng minh nguyên tắc **default-deny**:

- route có `@Public()` -> đi qua không cần token
- route không có `@Public()` nhưng có tồn tại thật -> bị `JwtAuthGuard` chặn

Nếu route không tồn tại thì bạn chỉ đang test router, chưa test guard.

## Câu hỏi tự kiểm tra

Nếu một controller file đã tồn tại nhưng chưa được đăng ký trong module, tại sao kết quả lại là `404` chứ không phải `401`?
