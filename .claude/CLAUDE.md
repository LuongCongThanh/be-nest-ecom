# nestjs-mentor
- **nestjs-mentor** (`.claude/skills/nestjs-mentor/SKILL.md`) — hướng dẫn tự học NestJS theo từng task
- Trigger khi user nhắc đến: "task tiếp theo", "giải thích task", "bắt đầu task", "làm task", "hướng dẫn tôi", "phase-b", "phase-c", "phase-d", "phase-e", hoặc số task (Task 03, Task 10...)
- Khi user nói `/nestjs-mentor`, gọi Skill tool với `skill: "nestjs-mentor"`

## Agent skills

### Issue tracker

Issues live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
