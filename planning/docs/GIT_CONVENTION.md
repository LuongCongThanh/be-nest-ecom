# Git Convention — be-nest-ecom

> Áp dụng cho team 2–5 người. Commit tiếng Anh. Enforce bằng Commitlint + Husky.

---

## 1. Repo Naming

Format: `<role>-<stack>-<domain>`

| Segment | Giá trị |
|---------|---------|
| `role` | `be` (backend), `fe` (frontend), `infra`, `shared` |
| `stack` | `nest`, `next`, `react`, `go`, `python` |
| `domain` | tên domain ngắn gọn |

**Ví dụ:**
```
be-nest-ecom          ← backend NestJS, e-commerce
fe-next-ecom          ← frontend Next.js, e-commerce
be-nest-notification  ← backend NestJS, notification service
infra-terraform-ecom  ← infra Terraform, e-commerce
```

---

## 2. Branch Naming

Format:
```
<type>/<description>                    ← không có ticket
<type>/<ticket-id>-<description>        ← có ticket
```

| Type | Dùng khi | Ví dụ |
|------|----------|-------|
| `feature` | Tính năng mới | `feature/refresh-token` |
| `bugfix` | Sửa bug ở dev/staging | `bugfix/AUTH-08-refresh-token-expired` |
| `hotfix` | Sửa bug khẩn trên production | `hotfix/ORDER-12-payment-crash` |
| `refactor` | Cải thiện code, không đổi behavior | `refactor/extract-password-service` |
| `docs` | Tài liệu | `docs/CATALOG-02-swagger` |
| `chore` | Config, tooling, CI/CD | `chore/add-commitlint` |
| `test` | Thêm/sửa test | `test/AUTH-01-unit-auth-service` |
| `release` | Branch chuẩn bị release | `release/v1.2.0` |

**Rules:**
- Chữ thường, dùng `-` thay space
- Nếu có ticket ID thì **bắt buộc** thêm vào
- Description tối đa 5 từ, đủ hiểu không cần mở ticket

---

## 3. Commit Message — Conventional Commits

```
<type>(<scope>): <subject>

[body]

[footer]
```

### 3.1. Types

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

### 3.2. Scopes (module-based)

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

### 3.3. Subject rules

- **Imperative mood**: `add`, `fix`, `update` — không phải `added`, `fixes`
- Không viết hoa chữ đầu
- Không có dấu `.` cuối
- Tối đa **72 ký tự**

### 3.4. Body (optional)

- Giải thích **WHY** (không phải WHAT — WHAT đã thể hiện qua code)
- Cách tiếp cận được chọn và lý do
- Blank line ngăn cách với subject

### 3.5. Footer (optional)

```
Closes AUTH-08
BREAKING CHANGE: <mô tả thay đổi breaking>
Co-authored-by: Name <email>
```

### 3.6. Ví dụ

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

Fixes CART-03
```

```
feat(catalog)!: change product identifier from id to uuid

BREAKING CHANGE: product URL changed from /products/:id to /products/:uuid.
All API clients must update their calls.

Closes CATALOG-04
```

```
chore(deps): upgrade NestJS to v11.x
```

---

## 4. Pull Request

### 4.1. Tiêu đề PR

Giống commit message — Conventional Commits format:
```
feat(auth): add JWT refresh token rotation
```

### 4.2. Merge strategy

| Branch type | Strategy | Lý do |
|-------------|----------|-------|
| `feature/*` → `main` | **Squash merge** | 1 commit sạch trên main |
| `bugfix/*` → `main` | **Squash merge** | 1 commit sạch trên main |
| `hotfix/*` → `main` | **Merge commit** | Giữ history cho audit |
| `release/*` → `main` | **Merge commit** | Giữ full history |

### 4.3. Rules

- **1 PR = 1 mục đích** (không gộp nhiều feature)
- Tối đa **400 lines changed** (khuyến nghị)
- Ít nhất **1 reviewer** approve trước khi merge
- Sync với main trước khi tạo PR: `git rebase origin/main`

---

## 5. Workflow

```
main (production-ready)
  ├── release/v1.x.x     ← staging / release prep
  ├── feature/xxx        ← tính năng mới
  ├── bugfix/xxx         ← sửa bug
  └── hotfix/xxx         ← fix khẩn từ main
```

### Feature flow

```bash
# 1. Tạo branch từ main
git checkout main && git pull
git checkout -b feature/AUTH-08-refresh-token

# 2. Commit thường xuyên, atomic
git add src/auth/
git commit -m "feat(auth): implement refresh token entity"
git commit -m "test(auth): add unit tests for token rotation"

# 3. Sync trước khi tạo PR
git fetch origin
git rebase origin/main

# 4. Push và tạo PR
git push -u origin feature/AUTH-08-refresh-token
```

### Hotfix flow

```bash
git checkout main
git checkout -b hotfix/ORDER-12-payment-crash
# fix...
git commit -m "fix(payment): handle null response from payment gateway"
# tạo PR về main với merge commit
```

---

## 6. Versioning — SemVer

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

> Automation (semantic-release / standard-version) sẽ setup sau khi CI/CD pipeline ổn định.

---

## 7. Enforcement

Commitlint + Husky chặn commit sai format ngay trên local.

Setup: xem [`commitlint.config.js`](../commitlint.config.js) và [`.husky/`](../.husky/).
