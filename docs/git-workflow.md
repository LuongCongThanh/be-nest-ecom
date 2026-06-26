# Git Workflow

Quy trình làm việc cho mỗi task trong dự án.

---

## Tổng quan

```
main
 └── checkout → feat/<phase>/<task-slug>
                      ↓ làm task
                      ↓ commit
                      ↓ push
                      ↓ tạo PR → main
                      ↓ merge commit (khi được yêu cầu)
                 main (cập nhật)
```

---

## Bước 1 — Checkout branch mới

Mỗi task là một branch riêng. Checkout từ `main`:

```powershell
git checkout main
git pull --rebase origin main
git checkout -b feat/<phase>/<task-slug>
```

**Ví dụ:**

```powershell
git checkout -b feat/phase-c/01-catalog-schema
```

**Convention đặt tên branch:** `feat/<phase>/<task-slug>`

---

## Bước 2 — Làm task

Implement theo task file trong `planning/todo/<phase>/<task>.md`.

---

## Bước 3 — Commit

### Format commit message

```
<type>(<scope>): <short description>
```

**Scope** phải là domain của file thay đổi, chọn một trong:

```
auth | user | catalog | cart | order | payment | media | common | config | db
```

**Ví dụ:**

```
feat(catalog): add product and category prisma schema
fix(db): add DATABASE_URL to prisma datasource config
docs(common): sync phase-c todo status to done
refactor(auth): extract shared types to auth.types.ts
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
git commit -m "feat(catalog): add product and category prisma schema"
```

> ⚠️ Không thêm `Co-Authored-By: Claude` vào commit message.

---

## Bước 4 — Push

```powershell
git push -u origin feat/<phase>/<task-slug>
```

---

## Bước 5 — Tạo PR vào `main`

```powershell
gh pr create --base main --title "feat(catalog): add product and category schema"
```

Điền PR template: summary, type of change, changes made, pre-merge checklist.

> ⚠️ Chờ review và yêu cầu merge tường minh — KHÔNG tự merge.

---

## Bước 6 — Merge (khi được yêu cầu)

1. Mở PR trên GitHub, xem diff một lần
2. Tick đủ Pre-Merge Checklist trong PR template
3. Merge bằng **merge commit** bình thường

```powershell
gh pr merge --merge --delete-branch
```

---

## Bước 7 — Cleanup local

Sau khi merge:

```powershell
git checkout main
git pull --rebase origin main
git branch -d feat/<phase>/<task-slug>
```

---

## Checklist nhanh

```
[ ] git checkout main
[ ] git pull --rebase origin main
[ ] git checkout -b feat/<phase>/<task-slug>
[ ] ... làm task ...
[ ] git add <files>
[ ] git commit -m "<type>(<scope>): <description>"
[ ] git push -u origin feat/<phase>/<task-slug>
[ ] gh pr create --base main --title "..."
[ ] chờ review + yêu cầu merge
[ ] gh pr merge --merge --delete-branch
[ ] git checkout main && git pull --rebase origin main
[ ] git branch -d feat/<phase>/<task-slug>
```
