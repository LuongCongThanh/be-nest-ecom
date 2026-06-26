# Husky + Commitlint Setup

Chạy một lần khi clone repo về.

## Install

```bash
npm install --save-dev husky @commitlint/cli @commitlint/config-conventional

# Khởi tạo husky
npx husky init
```

## Tạo hook commit-msg

```bash
echo 'npx --no -- commitlint --edit $1' > .husky/commit-msg
```

## Tạo hook pre-commit (lint + format)

```bash
# Nếu dùng lint-staged
npm install --save-dev lint-staged

echo 'npx lint-staged' > .husky/pre-commit
```

Thêm vào `package.json`:

```json
{
  "lint-staged": {
    "src/**/*.ts": [
      "eslint --fix",
      "prettier --write"
    ]
  },
  "scripts": {
    "prepare": "husky"
  }
}
```

## Verify

```bash
# Test commit đúng format
git commit -m "feat(auth): add login endpoint"   ✅

# Test commit sai format — sẽ bị chặn
git commit -m "add login"   ❌ 
# Error: subject may not be empty [subject-empty]
# Error: type may not be empty [type-empty]
```

## Bypass (emergency only)

```bash
# Chỉ dùng khi thực sự cần thiết
git commit --no-verify -m "chore: emergency fix"
```
