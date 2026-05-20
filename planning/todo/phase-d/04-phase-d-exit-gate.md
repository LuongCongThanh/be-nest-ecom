# Task D-04 — Phase D Exit Gate

**Phase**: D — Polish  
**Ước lượng**: 1 giờ  

---

## Checklist Exit Gate

- [ ] Mọi exception trả response đúng schema `{ success, statusCode, code, message, errors, timestamp, path, requestId }`
- [ ] Request log có correlation ID + duration: `GET /api/v1/health 200 5ms [uuid]`
- [ ] Swagger UI tại `/docs` hiển thị mọi endpoint + DTO
- [ ] JSON success responses trả đúng envelope `{ success, data, timestamp }`
- [ ] `204 No Content` routes không bị response-transform wrap sai format
- [ ] Email verification flow hoạt động, `emailVerified` được cập nhật đúng
- [ ] Forgot password flow hoạt động (Mailtrap nhận email)
- [ ] Reset password với token hết hạn → `400 INVALID_RESET_TOKEN`
- [ ] DB chỉ lưu `tokenHash` cho account recovery tokens, không lưu raw token
- [ ] `npm run lint` — 0 errors
- [ ] `npm run build` — thành công

---

## Ghi audit log

```
[YYYY-MM-DD HH:MM] [Phase D] [EXIT GATE]
- ✅ Error format chuẩn với requestId + timestamp + path
- ✅ Request logging với correlation ID
- ✅ Swagger UI hoạt động tại /docs
- ✅ Account recovery: verify email + forgot/reset password flow
Signed-off: self · Next: Phase E open.
```

---

## Xong thì làm gì?

→ [../phase-e/01-testing.md](../phase-e/01-testing.md)
