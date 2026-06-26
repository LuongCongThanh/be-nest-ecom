# Git Workflow

Mỗi task phải theo đúng quy trình sau. Xem chi tiết tại `docs/conventions/git-workflow.md`.

## Bắt đầu task mới

```powershell
git checkout main && git pull origin main
git checkout -b feat/<phase>/<task-slug>
```

## Commit template

```
<type>(<scope>): <short description>
```

> Không thêm `Co-Authored-By: Claude` vào commit message.

**Scope** phải là một trong: `auth | user | catalog | cart | order | payment | media | common | config | db`

Chọn scope theo **domain/folder** của file thay đổi, không dùng phase/task number.

Ví dụ:
- `feat(common): add global validation pipe and exception filter`
- `feat(auth): implement register and login endpoints`
- `feat(config): add jwt and redis configuration`

## Kết thúc task

```powershell
git add <files>
git commit -m "feat(<scope>): <description>"
git push -u origin feat/<phase>/<task-slug>
gh pr create --base main --title "feat(<scope>): <description>" --body "..."
# Chỉ merge khi user yêu cầu tường minh:
# gh pr merge --squash --delete-branch
```

---

# nestjs-mentor

- **nestjs-mentor** (`.claude/skills/nestjs-mentor/SKILL.md`) — hướng dẫn tự học NestJS theo từng task
- Trigger khi user nhắc đến: "task tiếp theo", "giải thích task", "bắt đầu task", "làm task", hoặc số task cụ thể (Task 03, Task 10...)
- Khi user nói `/nestjs-mentor`, gọi Skill tool với `skill: "nestjs-mentor"`

---

# Agent Skills

### Issue tracker

Issues live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
