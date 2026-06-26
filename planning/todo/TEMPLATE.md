# Task XX — [Tên task]

**Phase**: [B / C / D / E] — [Foundation / Core MVP / Polish / Ship]
**Ước lượng**: X giờ
**Phụ thuộc**: Task XX
**Ưu tiên**: [🔴 BLOCKING / 🟡 SHOULD / 🔵 BACKLOG] ([Lý do ngắn gọn])
**Trạng thái**: [⏳ Not started / 🔄 In progress / ✅ Done]
**Spec gốc**: [link tới file spec trong planning/setup hoặc planning/business]

---

## 🎯 Mục tiêu & Ý nghĩa

[1-2 đoạn giải thích TẠI SAO task này tồn tại. Không mô tả WHAT (spec đã làm rồi), mà mô tả WHY — nếu bỏ task này thì hệ thống bị thiếu gì, developer sẽ gặp vấn đề gì.]

- **[Lý do 1]**: [Giải thích]
- **[Lý do 2]**: [Giải thích]

---

## 🛠️ Các bước thực hiện

### 1. [Bước 1]

[Mô tả ngắn]

```typescript
// Code example (nếu có)
// Phải compile được với version đang dùng
```

### 2. [Bước 2]

[Mô tả ngắn]

```typescript
// Code example
```

### 3. [Đăng ký / wire up (nếu cần)]

```typescript
// Ví dụ: đăng ký trong module hoặc main.ts
```

---

## ✅ Tiêu chí nghiệm thu

**AC-1: [Mô tả hành vi chính]**

- **Given** [trạng thái ban đầu]
- **When** [hành động]
- **Then** [kết quả mong đợi — cụ thể, đo được]

**AC-2: [Edge case hoặc hành vi phụ]**

- **Given** [trạng thái ban đầu]
- **When** [hành động]
- **Then** [kết quả mong đợi]

**AC-3: [Security / error case nếu có]**

- **Given** [...]
- **When** [...]
- **Then** [...]

---

## Verify hoàn thành

```bash
# Lệnh cụ thể để verify — chạy được ngay, không cần suy nghĩ
npm run test -- [tên file test]
# hoặc: curl / Postman request cụ thể
# hoặc: SQL query để verify DB state
```

[Mô tả kết quả mong đợi khi chạy lệnh trên]

---

## 🚫 Ngoài phạm vi

- [Item 1] — [lý do hoãn / phase nào làm]
- [Item 2] — [lý do hoãn / phase nào làm]

---

## Xong thì làm gì?

→ Mở task tiếp theo: [XX-tên-task.md](./XX-tên-task.md)

---

## 📋 Quy ước scope labels

| Label | Ý nghĩa |
|-------|---------|
| 🔴 BLOCKING | Phải làm xong mới tiếp được — blocker cho task tiếp theo |
| 🟡 SHOULD | Nên làm trong phase này — không block ngay nhưng cần trước exit gate |
| 🔵 BACKLOG | Có thể skip — làm sau MVP hoặc khi có nhu cầu cụ thể |
