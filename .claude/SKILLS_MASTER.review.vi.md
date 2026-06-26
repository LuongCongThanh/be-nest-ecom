# Review `SKILLS_MASTER.md`

> File được review: [`./SKILLS_MASTER.md`](./SKILLS_MASTER.md)
> Ngày review: 2026-05-23
> Mục tiêu: đánh giá tài liệu theo góc nhìn **có dùng được như source-of-truth trong repo hiện tại hay không**

---

## Kết luận nhanh

`SKILLS_MASTER.md` có giá trị tổng hợp tốt và nhiều link local là có thật, nhưng **chưa đủ an toàn để dùng như "master guide" vận hành** trong repo hiện tại.

Điểm mạnh:

- Gom được 3 nguồn rời rạc thành một tài liệu tra cứu duy nhất.
- Phần lớn link local trong nhóm `.claude/skills` và `.antigravity-awesome-skills` có tồn tại thật.
- Cấu trúc chia section theo mục đích dùng tương đối dễ đọc.

Vấn đề chính:

- Trộn giữa **skill đang có thể dùng trong repo** và **skill tham chiếu bên ngoài/chưa cài** nhưng không phân biệt đủ rõ.
- Có **drift giữa tên skill, tên command, và tên folder local**.
- Có dấu hiệu **Claude-centric** trong khi workspace hiện tại đang đồng thời có `.agents/skills`.

---

## Findings

### 1. GSD section gây hiểu nhầm là có thể dùng ngay

**Mức độ:** Cao

Phần `GSD Framework Skills` mô tả một hệ skill khá đầy đủ như thể người đọc có thể áp dụng trực tiếp:

- Luồng tổng quát dùng tên không prefix: `new-project -> spec-phase -> plan-phase -> execute-phase -> verify-work -> ship`
- Bảng skill lại dùng tên có prefix: `gsd-new-project`, `gsd-spec-phase`, `gsd-plan-phase`, ...
- Phần "Nguyên tắc chọn skill GSD" lại quay về tên không prefix ở nhiều dòng.

Hệ quả:

- Người đọc không biết **tên nào mới là tên gọi thực tế**.
- Repo hiện tại **không có** các skill GSD tương ứng trong `.claude/skills` hoặc `.agents/skills`, nên tài liệu rất dễ tạo kỳ vọng sai.

Khuyến nghị:

- Tách rõ GSD thành một trong hai loại:
  - `Reference only / external ecosystem`, hoặc
  - `Installed in this repo`
- Nếu chưa cài trong repo, nên gắn nhãn rõ: `Chưa có local skill tương ứng trong workspace này`.
- Thống nhất naming chỉ dùng **một chuẩn duy nhất** trong toàn section.

---

### 2. Tài liệu tự gọi là "master" nhưng khóa cứng vào `.claude/skills`

**Mức độ:** Cao

Section `Local Project Skills` mô tả rõ là tài liệu cho `.claude/skills`, đồng thời nhiều output/lưu ý cũng gắn chặt với workflow của Claude như:

- `.claude/hooks/...`
- `CLAUDE.md`
- cách trigger kiểu slash command

Trong khi workspace hiện tại có cả:

- `.claude/skills`
- `.agents/skills`

Và với Codex session hiện tại, cây `.agents/skills` mới là cây skill local đang active rõ ràng hơn.

Hệ quả:

- Người đọc có thể hiểu nhầm rằng `.claude/skills` là source-of-truth duy nhất.
- Tài liệu dễ drift khi một skill có mặt ở cả hai nơi nhưng chỉ được cập nhật một bên.

Khuyến nghị:

- Đổi tên section theo hướng trung tính hơn, ví dụ:
  - `Installed Local Skills`
  - `Claude-local Skills`
- Thêm một mục ngắn giải thích:
  - repo hiện có những cây skill nào,
  - cây nào là primary cho workflow nào,
  - quy tắc sync nếu cùng tồn tại `.claude` và `.agents`.

---

### 3. Alias mapping giữa "tên skill" và "folder local" chưa được giải thích đủ

**Mức độ:** Trung bình

Nhiều dòng trong section 1 đang dùng một tên để mô tả skill, nhưng folder local lại mang tên khác:

- `tutorial-builder` -> `tutorial-engineer`
- `clean-architecture` -> `clean-code` / `architecture`
- `bug-investigation` -> `bug-hunter`

Điều này không sai nếu mục tiêu là tổng hợp knowledge từ nhiều hệ sinh thái, nhưng tài liệu chưa nói rõ đây là:

- alias,
- nearest local equivalent,
- hay mapping 1-n.

Hệ quả:

- Khó dùng cho người muốn mở đúng folder local.
- Dễ gọi nhầm tên khi muốn trigger skill theo tên trong tài liệu.

Khuyến nghị:

- Đổi cột `Skill` thành rõ nghĩa hơn, ví dụ:
  - `Concept / Public Name`
  - `Local Equivalent`
- Hoặc thêm cột riêng:
  - `Canonical trigger name`
  - `Local folder`
  - `Mapping note`

---

### 4. Có lỗi naming nhỏ nhưng ảnh hưởng độ tin cậy

**Mức độ:** Trung bình

Ví dụ:

- Bảng ghi `ejentum-reasoning-harness`
- Sơ đồ học lại ghi `ejentum-reasoning`

Đây là lỗi nhỏ, nhưng trong một tài liệu về skills thì **tên chính xác là dữ liệu cốt lõi**.

Hệ quả:

- Người đọc khó tra cứu chính xác.
- Giảm niềm tin rằng các tên khác trong tài liệu đã được kiểm chứng kỹ.

Khuyến nghị:

- Soát lại toàn bộ tài liệu theo checklist:
  - tên hiển thị,
  - tên trigger,
  - tên folder local,
  - link GitHub,
  - trạng thái installed/reference-only.

---

### 5. Quick Reference hữu ích nhưng chưa đủ "operational"

**Mức độ:** Trung bình

Bảng `Quick Reference` giúp tra nhanh, nhưng hiện vẫn thiên về "catalog" hơn là "hướng dẫn dùng thật".

Thiếu các thông tin quan trọng như:

- skill đó có đang tồn tại local không,
- nằm ở `.claude` hay `.agents`,
- dành cho repo này hay chỉ là generic reference,
- khi nào không nên dùng.

Khuyến nghị:

- Bổ sung ít nhất 2 cột:
  - `Availability`
  - `Scope`

Ví dụ:

- `Installed (.agents)`
- `Installed (.claude)`
- `Reference only`
- `Repo-specific`
- `Generic`

---

## Đánh giá theo tiêu chí

| Tiêu chí | Đánh giá | Ghi chú |
| --- | --- | --- |
| Tính tổng hợp | Tốt | Gom được nhiều nguồn vào một chỗ |
| Tính chính xác về link local | Khá tốt | Nhiều path kiểm tra nhanh là có thật |
| Tính nhất quán tên gọi | Trung bình | Có drift giữa alias, trigger, folder |
| Tính vận hành trong repo hiện tại | Chưa tốt | Chưa phân biệt rõ skill có thật và skill tham chiếu |
| Tính làm source-of-truth | Chưa đạt | Cần xác định rõ primary skill tree và naming convention |

---

## Đề xuất chỉnh sửa ưu tiên

### Ưu tiên 1

Biến tài liệu này từ "catalog lớn" thành "catalog có trạng thái":

- Mỗi skill hoặc mỗi nhóm skill cần được gắn một trạng thái rõ ràng:
  - `Installed`
  - `Mapped`
  - `Reference only`
  - `Missing`

### Ưu tiên 2

Chuẩn hóa naming:

- Chỉ dùng một tên làm `canonical trigger name`.
- Nếu có alias hoặc local equivalent thì ghi riêng.

### Ưu tiên 3

Chốt source-of-truth cho local skills:

- nếu repo này ưu tiên `.agents/skills` cho Codex workflow, phải nói rõ;
- nếu `.claude/skills` vẫn là kho chính, cũng phải nói rõ;
- nếu song song, cần quy tắc sync.

### Ưu tiên 4

Rút gọn hoặc gắn cảnh báo cho phần GSD:

- Nếu không có local install, nên chuyển thành appendix hoặc section `External frameworks`.

---

## Đề xuất hướng rewrite

Nếu muốn tài liệu này dùng được thật trong repo này, mình đề xuất rewrite theo cấu trúc:

1. `Installed local skills`
2. `Repo-specific skills for be-nest-ecom`
3. `Mapped external skills`
4. `Reference-only ecosystems`
5. `Quick chooser by situation`

Cách này giúp người đọc trả lời được ngay 3 câu hỏi:

- Skill này có dùng được trong workspace hiện tại không?
- Nếu dùng được thì gọi tên nào?
- Nếu không dùng được thì đây là tham khảo hay là việc cần cài thêm?

---

## Kết luận

`SKILLS_MASTER.md` **đáng giữ** vì công sức tổng hợp là có giá trị. Tuy nhiên, ở trạng thái hiện tại, file này nên được xem là:

- **knowledge catalog khá tốt**
- nhưng **chưa nên xem là source-of-truth vận hành**

Muốn dùng như tài liệu chuẩn của repo, nên chỉnh tiếp theo hướng:

- gắn trạng thái installed/reference,
- thống nhất naming,
- và xác định rõ quan hệ giữa `.claude/skills` với `.agents/skills`.
