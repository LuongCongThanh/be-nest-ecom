# Task Reviews

Folder này lưu các file đánh giá sau khi **một task đã hoàn thành thật sự**.

Mỗi file review là một artifact ngắn gọn để nhìn lại:

- task đã đạt acceptance criteria chưa
- đã verify bằng gì
- còn gap hoặc follow-up nào không
- người học đã hiểu được điểm gì quan trọng

## Mục đích

`reviews/` không thay thế cho:

- file task gốc trong `planning/todo/...`
- checklist trong `planning/todo/checklists/...`
- learning log trong `planning/todo/learning-log.md`

Nó là lớp **đánh giá sau hoàn thành**.

Nói ngắn gọn:

- task file = yêu cầu công việc
- checklist = tiến độ và verify từng bước
- learning log = ghi nhớ học tập theo dòng thời gian
- review file = kết luận chất lượng của từng task

## Quy tắc tạo file

Chỉ tạo review file khi:

1. task đã được verify
2. acceptance criteria đã được check lại
3. task status đã có thể đánh dấu `✅ Done`

Không tạo review file cho task đang:

- `🔵 In progress`
- `🔴 Blocked`

## Naming convention

Format:

`<phase>-<task-id>-review.md`

Ví dụ:

- `phase-b-03-review.md`
- `phase-b-05-review.md`
- `phase-c-02-review.md`

## Nội dung tối thiểu của một review

Mỗi file nên trả lời được 6 câu hỏi:

1. Task này là task nào?
2. Acceptance criteria nào đã pass?
3. Cụ thể đã hoàn thành những gì?
4. Còn gap hay risk nhỏ nào không?
5. Verify bằng lệnh/kết quả nào?
6. Người học đã rút ra bài học gì?

## Khi đọc lại folder này

Nếu bạn muốn biết:

- task nào đã thật sự xong
- task nào chỉ "có vẻ xong" nhưng còn risk
- vì sao một task được đánh giá là pass

thì đọc `reviews/` trước khi đọc lại toàn bộ chat hoặc diff.

## Liên kết workflow

Khi một task hoàn thành, close-out chuẩn nên để lại đủ 4 artifact:

1. status cập nhật trong file task
2. checklist cập nhật
3. learning log append
4. review file trong folder này

Nếu thiếu 1 trong 4, close-out chưa hoàn chỉnh.
