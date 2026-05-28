# Git Workflow

Quy trình làm việc cho mỗi task trong dự án.

---

## Tổng quan

```
main
 └── checkout → ThanhLuongCong/feat/<phase>/<task-slug>
                      ↓ làm task
                      ↓ commit
                      ↓ push
                      ↓ tạo PR → main
                      ↓ squash merge
                 main (cập nhật)
```

---

## Bước 1 — Checkout branch mới

Mỗi task là một branch riêng. Checkout từ `main`:

```powershell
git checkout main
git pull origin main
git checkout -b ThanhLuongCong/feat/<phase>/<task-slug>
```

**Ví dụ:**

```powershell
git checkout -b ThanhLuongCong/feat/phase-b/09-validation-pipe
```

**Convention đặt tên branch:** `<username>/feat/<phase>/<task-slug>`

---

## Bước 2 — Làm task

Implement theo task file trong `planning/todo/<phase>/<task>.md`.

---

## Bước 3 — Commit

### Format commit message

```
<type>(<phase>/<task-number>): <short description>
```

**Ví dụ:**

```
feat(phase-b/09): add global validation pipe with class-validator
fix(phase-b/08): remove url from prisma datasource block
docs(phase-b/08): update learning log and mark task done
```

### Các type hợp lệ

| Type       | Dùng khi                           |
| ---------- | ---------------------------------- |
| `feat`     | Thêm tính năng mới                 |
| `fix`      | Sửa bug                            |
| `refactor` | Cải thiện code, không đổi behavior |
| `perf`     | Tối ưu performance                 |
| `test`     | Chỉ thêm/sửa test                  |
| `docs`     | Chỉ thêm/sửa documentation         |
| `chore`    | Config, tooling, CI/CD             |

### Lệnh commit

```powershell
git add <files>
git commit -m "feat(phase-b/09): add global validation pipe with class-validator"
```

---

## Bước 4 — Push

```powershell
git push -u origin ThanhLuongCong/feat/<phase>/<task-slug>
```

---

## Bước 5 — Tạo PR vào `main`

```powershell
gh pr create --base main --title "feat(phase-b/09): add global validation pipe"
```

Điền PR template: summary, type of change, changes made, pre-merge checklist.

---

## Bước 6 — Self-review và merge

1. Mở PR trên GitHub, xem diff một lần
2. Tick đủ Pre-Merge Checklist trong PR template
3. Merge bằng **Squash and merge** — toàn bộ commits gộp thành 1 commit trên `main`

```powershell
gh pr merge --squash --delete-branch
```

---

## Checklist nhanh

```
[ ] git checkout main && git pull
[ ] git checkout -b ThanhLuongCong/feat/<phase>/<task>
[ ] ... làm task ...
[ ] git add <files>
[ ] git commit -m "feat(<phase>/<task-number>): <description>"
[ ] git push -u origin <branch>
[ ] gh pr create --base main
[ ] self-review diff trên GitHub
[ ] squash merge → delete branch
```
