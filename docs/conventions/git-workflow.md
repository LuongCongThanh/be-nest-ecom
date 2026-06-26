# Git Workflow & Convention — be-nest-ecom

Quy trình git và quy ước commit cho dự án. Đây là **nguồn sự thật duy nhất** — CLAUDE.md trỏ về file này.

---

## Tổng quan

```
main
 └── checkout → feat/<phase>/<task-slug>
                      ↓ làm task
                      ↓ commit (Conventional Commits)
                      ↓ push
                      ↓ tạo PR → main
                      ↓ merge commit (khi được yêu cầu)
                 main (cập nhật)
```

---

## 1. Branch Naming

### 1.1. Convention của dự án này

```
feat/<phase>/<task-slug>
```

**Ví dụ:**

```
feat/phase-c/01-catalog-schema
feat/phase-b/02-jwt-auth
docs/common/merge-planning-docs
```

### 1.2. Convention chung (team)

| Type | Dùng khi | Ví dụ |
|------|----------|-------|
| `feat` | Tính năng mới | `feat/phase-c/catalog-schema` |
| `bugfix` | Sửa bug ở dev/staging | `bugfix/AUTH-08-refresh-token-expired` |
| `hotfix` | Sửa bug khẩn trên production | `hotfix/ORDER-12-payment-crash` |
| `refactor` | Cải thiện code, không đổi behavior | `refactor/extract-password-service` |
| `docs` | Tài liệu | `docs/common/update-readme` |
| `chore` | Config, tooling, CI/CD | `chore/add-commitlint` |
| `test` | Thêm/sửa test | `test/AUTH-01-unit-auth-service` |

**Rules:** chữ thường, dùng `-` thay space, description tối đa 5 từ.

---

## 2. Commit Message — Conventional Commits

```
<type>(<scope>): <subject>

[body]

[footer]
```

### 2.1. Types

| Type | Dùng khi |
|------|---------|
| `feat` | Tính năng mới |
| `fix` | Sửa bug |
| `refactor` | Cải thiện code (không feat, không fix) |
| `perf` | Cải thiện performance |
| `test` | Thêm/sửa test |
| `docs` | Tài liệu |
| `style` | Format code, không đổi logic |
| `chore` | Build, config, dependencies |
| `ci` | CI/CD pipeline |
| `revert` | Revert commit trước |

### 2.2. Scopes (domain-based)

**Chọn scope theo domain/folder của file thay đổi, không dùng phase/task number.**

| Scope | Module |
|-------|--------|
| `auth` | Authentication, JWT, session |
| `user` | User entity, profile |
| `catalog` | Category, product |
| `cart` | Shopping cart |
| `order` | Order management |
| `payment` | Payment integration |
| `media` | Upload, images |
| `common` | Guards, pipes, interceptors dùng chung |
| `config` | App configuration |
| `db` | Database, migrations |

### 2.3. Subject rules

- **Imperative mood**: `add`, `fix`, `update` — không phải `added`, `fixes`
- Không viết hoa chữ đầu
- Không có dấu `.` cuối
- Tối đa **72 ký tự**

### 2.4. Body (optional)

- Giải thích **WHY** (không phải WHAT — WHAT đã thể hiện qua code)
- Blank line ngăn cách với subject

### 2.5. Footer (optional)

```
Closes AUTH-08
BREAKING CHANGE: <mô tả thay đổi breaking>
```

> ⚠️ Không thêm `Co-Authored-By: Claude` vào commit message.

### 2.6. Ví dụ

```
feat(auth): add JWT refresh token rotation

Implement sliding session with refresh token rotation.
Old refresh token is invalidated upon use to prevent replay attacks.

Closes AUTH-08
```

```
fix(cart): correct total price when applying discount code

Discount was applied twice: once in service, once in event subscriber.
Fix by removing duplicate call in CartUpdatedSubscriber.
```

```
feat(catalog)!: change product identifier from id to uuid

BREAKING CHANGE: product URL changed from /products/:id to /products/:uuid.
```

```
chore(deps): upgrade NestJS to v11.x
```

---

## 3. Workflow từng bước

### Bước 1 — Checkout branch mới

```powershell
git checkout main
git pull --rebase origin main
git checkout -b feat/<phase>/<task-slug>
```

### Bước 2 — Làm task

Implement theo task file trong `docs/tasks/<setup|business>/<context>/<task>.md`.

### Bước 3 — Commit

```powershell
git add <files>
git commit -m "feat(catalog): add product and category prisma schema"
```

### Bước 4 — Push

```powershell
git push -u origin feat/<phase>/<task-slug>
```

### Bước 5 — Tạo PR vào `main`

```powershell
gh pr create --base main --title "feat(catalog): ..." --body "..."
```

Claude tự điền body theo `.github/pull_request_template.md`: summary, type of change, changes made, testing scenarios, screenshots/demo, pre-merge checklist.

> ⚠️ Chờ review và yêu cầu merge tường minh — KHÔNG tự merge.

### Bước 6 — Merge (khi được yêu cầu)

```powershell
gh pr merge --merge --delete-branch
```

Dùng **merge commit** bình thường (giữ history).

### Bước 7 — Cleanup local

```powershell
git checkout main
git pull --rebase origin main
git branch -d feat/<phase>/<task-slug>
```

---

## 4. Pull Request

- **1 PR = 1 mục đích** (không gộp nhiều feature)
- Khuyến nghị tối đa **400 lines changed**
- Ít nhất **1 reviewer** approve trước khi merge
- Sync với main trước khi tạo PR: `git rebase origin/main`

---

## 5. Versioning — SemVer

```
MAJOR.MINOR.PATCH
  │      │     └── Bug fix (fix commit)
  │      └──────── Tính năng mới (feat commit)
  └─────────────── Breaking change (feat! / fix!)
```

**Tag format:** `v1.2.3`

```bash
git tag -a v1.0.0 -m "release: v1.0.0"
git push origin v1.0.0
```

---

## 6. Enforcement

Commitlint + Husky chặn commit sai format ngay trên local.

Setup chi tiết: xem [`husky-setup.md`](./husky-setup.md).

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
