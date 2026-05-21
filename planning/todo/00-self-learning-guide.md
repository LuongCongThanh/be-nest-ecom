# Self-Learning Guide — Cách dùng `todo/` để tự code project này

File này dành cho trường hợp:

- bạn muốn **tự code**
- bạn muốn **tự luyện tay**
- bạn muốn AI đóng vai **người hướng dẫn**
- bạn không muốn AI tự động implement thay bạn

---

## 1. Vai trò của từng phần

- `planning/` = tài liệu nền, glossary, conventions, spec gốc
- `planning/todo/` = checklist thực thi theo đúng thứ tự
- bạn = người trực tiếp code
- AI = người giải thích task, chia nhỏ việc, kiểm tra hướng đi, review lỗi

**Nguyên tắc làm việc:**

1. Không nhảy task.
2. Mỗi lần chỉ làm **1 task hiện tại**.
3. Mỗi task luôn theo vòng lặp:
   - đọc task
   - hiểu mục tiêu
   - tự code
   - tự verify
   - tick done
   - chuyển task tiếp theo

---

## 2. AI sẽ giúp bạn như thế nào

AI **nên** làm:

- giải thích task
- nói rõ file nào cần đọc
- chia task thành bước nhỏ
- giải thích lỗi
- review code bạn đã viết
- nói tiếp theo bạn nên làm gì

AI **không nên** tự làm thay bạn, trừ khi bạn yêu cầu rất rõ:

- không tự patch code
- không tự implement feature
- không tự hoàn thành task thay bạn

Nếu bạn cần hỗ trợ trong lúc tự làm, hãy hỏi theo 1 trong các mẫu này:

- `giải thích Task 03 cho tôi`
- `tôi nên sửa file nào trước cho Task 04`
- `đây là lỗi của tôi, giải thích giúp`
- `review code tôi vừa viết cho Task 05`
- `tôi đã verify xong, task tiếp theo là gì`

---

## 3. Quy trình chuẩn cho mỗi task

Mỗi task trong `todo/` nên được làm theo đúng 6 bước này:

### Bước 1 — Mở task hiện tại

Ví dụ:

- `phase-b/01-nestjs-scaffold.md`
- `phase-b/02-env-config.md`

Đọc 4 phần sau trước:

1. `Mục tiêu`
2. `Ý nghĩa`
3. `Các bước thực hiện`
4. `Tiêu chí nghiệm thu`

### Bước 2 — Tự trả lời 3 câu hỏi

Trước khi code, bạn phải tự trả lời:

1. Task này muốn tạo ra cái gì?
2. Task này thay đổi file nào?
3. Verify xong thì kết quả đúng trông như thế nào?

Nếu chưa trả lời được 1 trong 3 câu đó, dừng code và hỏi AI giải thích.

### Bước 3 — Tự code

Chỉ code đúng phạm vi task hiện tại.

Không làm thêm feature của task sau.

### Bước 4 — Tự verify

Luôn chạy phần `Verify hoàn thành` ở cuối task.

Không verify -> không được tick done.

### Bước 5 — Ghi kết quả

Sau khi verify:

- nếu pass hoàn toàn -> đánh dấu task done
- nếu pass một phần -> ghi `In progress`
- nếu bị chặn bởi môi trường/lỗi ngoài phạm vi -> ghi `Blocked`

### Bước 6 — Mới chuyển task tiếp theo

Không được chuyển task mới khi task hiện tại chưa rõ trạng thái.

---

## 4. Trạng thái repo hiện tại và điểm bắt đầu khuyên dùng

### Repo snapshot hiện tại

Repo hiện đã có sẵn một phần foundation:

- NestJS scaffold
- `strict` TypeScript
- path aliases
- `.env.example`
- `/health`
- prefix `/api/v1`
- config validation
- Swagger bootstrap

Repo hiện **chưa có**:

- `docker-compose.yml`
- Prisma
- schema
- migrations
- auth flow
- `/health/ready`

### Điểm bắt đầu khuyên dùng

Không quay về làm lại từ `Task 00` như repo trống.

Hãy bắt đầu từ **trạng thái repo hiện tại**.

Thứ tự khuyên dùng:

1. chốt `Task 01`
2. chốt `Task 02`
3. chốt `Task 02b`
4. sang `Task 03`

---

## 5. Kế hoạch tự học ngắn hạn cho repo này

### Checkpoint A — Chốt Foundation đã có

#### Task 01 — `phase-b/01-nestjs-scaffold.md`

Mục tiêu:

- hiểu scaffold hiện tại
- hiểu vì sao `/health` nằm ngoài prefix
- tự verify các URL nền

Bạn cần tự làm:

1. chạy app
2. verify:
   - `/docs`
   - `/health`
   - `/api/v1/health`
3. xác nhận task pass

#### Task 02 — `phase-b/02-env-config.md`

Mục tiêu:

- hiểu fail-fast config
- hiểu vì sao không dùng `process.env` bừa ngoài `src/config/**`

Bạn cần tự làm:

1. tìm `process.env` trong `src/`
2. xác nhận chỉ còn trong `src/config/**`
3. chạy app với `.env` đúng
4. làm hỏng `JWT_SECRET` hoặc xóa tạm để thấy app crash ngay
5. khôi phục `.env`

#### Task 02b — `phase-b/02b-swagger.md`

Mục tiêu:

- hiểu Swagger UI là gì
- phân biệt `/docs` với API endpoint thật

Bạn cần tự làm:

1. mở `/docs`
2. xác nhận có Swagger UI
3. xác nhận có nút `Authorize`
4. hiểu `/docs#/...` chỉ là link trong UI, không phải endpoint backend thật

---

### Checkpoint B — Bắt đầu phần bạn thật sự phải tự code mới

#### Task 03 — `phase-b/03-docker-postgres.md`

Đây là task đầu tiên bạn sẽ phải **tự viết mới rõ ràng** nếu giữ repo hiện tại.

Bạn cần tự làm:

1. tạo `docker-compose.yml`
2. bổ sung biến Postgres/Redis vào `.env`
3. chạy `docker compose up -d`
4. verify container healthy

**Đây là task rất phù hợp để bắt đầu luyện tay thực sự**, vì:

- rõ ràng
- ít logic business
- dễ verify
- không quá dài

---

## 6. Hôm nay bạn nên làm gì?

Nếu bạn đang mở repo này và không biết làm gì tiếp:

### Lựa chọn khuyên dùng

1. mở `phase-b/02-env-config.md`
2. tự verify toàn bộ task đó
3. nếu pass -> tự đánh dấu done
4. mở `phase-b/02b-swagger.md`
5. verify
6. nếu pass -> tự đánh dấu done
7. bắt đầu tự code `phase-b/03-docker-postgres.md`

Nói ngắn:

**Hôm nay nên chốt Task 02 + 02b, rồi bắt đầu Task 03.**

---

## 7. Khi nào nên hỏi AI?

Bạn nên hỏi AI ngay nếu gặp 1 trong các trường hợp này:

- không hiểu task đang yêu cầu gì
- không biết sửa file nào trước
- có hơn 1 cách làm và không biết chọn cách nào
- verify ra kết quả khác kỳ vọng
- gặp lỗi terminal / runtime / TypeScript / Docker
- muốn review code sau khi tự viết xong

Không cần hỏi AI khi:

- task đã nói rất rõ bạn phải làm gì
- bạn chỉ chưa bắt tay vào làm

---

## 8. Mẫu làm việc nhanh với AI

Bạn có thể dùng nguyên văn các câu này:

### Khi bắt đầu task

`giải thích Task 03 cho tôi theo kiểu người tự học`

### Khi đã code được một phần

`tôi đã làm đến bước 2 của Task 03, tiếp theo tôi nên làm gì`

### Khi bị lỗi

`đây là lỗi khi tôi làm Task 03, giải thích nguyên nhân và hướng sửa, đừng code thay tôi`

### Khi muốn review

`review phần tôi vừa tự code cho Task 03, chỉ ra lỗi và rủi ro, không patch giúp tôi`

### Khi muốn chuyển task

`tôi đã verify xong Task 03, giờ task tiếp theo là gì`

---

## 9. Chốt lại

Bạn không cần AI làm thay.

Bạn cần 3 thứ:

1. biết task hiện tại là gì
2. biết verify thế nào
3. biết task tiếp theo là gì

File `todo/` này chính là để phục vụ đúng việc đó.

Nếu bị mù đường, quay lại file này trước.
