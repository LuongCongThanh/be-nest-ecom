# NestJS Mentor — Reference

Detailed formats and examples referenced from SKILL.md.

---

## Comprehension question examples

Asked after the user confirms a step is done. One question at a time, targeting the _why_.

### Good questions — probe reasoning

| Step context                            | Question                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Just installed `@nestjs/config` + `joi` | "Why do we validate env vars at boot rather than when they're first read?"                          |
| Just set up Docker Compose              | "If we didn't run Postgres in Docker, what would change about how teammates onboard?"               |
| Just created a Prisma schema            | "Why define the schema in one file rather than splitting it per module?"                            |
| Just added a JWT Guard                  | "What's the difference between authentication and authorisation — which one does the Guard handle?" |
| Just ran a migration                    | "Why do we commit migration files to git instead of regenerating them each time?"                   |

### Bad questions — test mechanics, not understanding

| ❌ Bad                                             | Why it fails                    |
| -------------------------------------------------- | ------------------------------- |
| "What command do you run to generate a migration?" | Tests memory, not understanding |
| "What is the name of the guard we just created?"   | Trivial recall                  |
| "Which file did we edit?"                          | Already visible in the diff     |

### After the user answers

- **Correct:** "Exactly — [one sentence reinforcing the key insight]. Ready for the next step."
- **Partially correct:** "Close — the missing piece is [one sentence]. Does that make sense?"
- **Wrong:** "Not quite — [one sentence redirection, no lecture]. Want to try again or shall we move on?"

Never ask a follow-up to the comprehension question. One question, one answer, move on.

---

## Checklist format

Create `planning/todo/checklists/<phase>-<task-id>-checklist.md` at the start of each task.

```markdown
# Checklist — Task <ID>: <Task name>

**Branch:** <username>/feat/<phase>/<task-slug>
**Started:** <today's date>

## Steps

- [ ] Step 1: <description>
- [ ] Step 2: <description>
- [ ] Step N: <description>

## Acceptance criteria

- [ ] <criterion 1>
- [ ] <criterion 2>

## Ship

- [ ] git add + commit
- [ ] git push
- [ ] PR opened
```

Fill steps from `## 🛠️ Các bước thực hiện` and criteria from `## ✅ Tiêu chí nghiệm thu` in the task file.

Update checkboxes (`- [ ]` → `- [x]`) as the user reports each step done.

---

## Learning log format

File: `planning/todo/learning-log.md`

If the file does not exist, create it with this header:

```markdown
# Learning Log — NestJS Self-Study

> Notes captured after each completed task.
```

Append one entry per completed task:

```markdown
---

## Task <ID> — <Task name> · <date>

**Branch:** <username>/feat/<phase>/<task-slug>

**Learned:**

- <most important concept this task taught>
- <new NestJS pattern or technique>

**Difficulties:**

- <any error or blocker encountered, even if resolved>

**Personal notes:**

- <anything the user wants to remember>
```

---

## WHY explanation examples

### Good — teaches the reasoning

> Installing `@nestjs/config` and `joi` to validate environment variables.
>
> **Why this step matters:** Without it, if `.env` is missing `JWT_SECRET`, the app boots
> normally but crashes on the first request — very hard to trace. Validating at boot gives
> fail-fast behaviour: the app refuses to start if config is wrong.
>
> **Why `joi` over `zod`:** Both work, but `@nestjs/config` ships with built-in `joi`
> integration — less boilerplate in a NestJS context. Use `zod` if you prefer it and are
> willing to wire it manually.

### Bad — only tells what, not why

> ~~Install the config library. Run `npm install @nestjs/config`.~~

The bad version gives the user nothing to reason with. If they hit a problem, they have
no mental model to debug from.

---

## Error explanation format

When the user pastes an error, explain in 3 layers:

```
**What it is:** <translate the error message into plain language>

**Why it happens:** <root mechanism — not just "file missing" but why the system
behaves this way>

**How to fix:** <1–2 specific options, with a short reason why each one works>
```

### Example

Error: `Cannot find module '@common/utils'`

> **What it is:** TypeScript cannot resolve the `@common/utils` path alias.
>
> **Why it happens:** The alias is declared in `tsconfig.json`, which the TypeScript
> compiler reads. But Jest and Node runtime do not read `tsconfig.json` — they need
> their own mapping configuration.
>
> **How to fix:**
>
> 1. Add `moduleNameMapper` to `jest.config.ts` so Jest knows where `@common/*` points.
> 2. Alternatively, use `ts-jest` with `pathsToModuleNameMapper` to auto-derive the
>    mapping from `tsconfig.json` — less duplication.

---

## Commit conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>
```

| Type       | When to use                                |
| ---------- | ------------------------------------------ |
| `feat`     | New feature or capability                  |
| `chore`    | Setup, tooling, config (no business logic) |
| `fix`      | Bug fix                                    |
| `refactor` | Code change without behaviour change       |
| `test`     | Adding or updating tests                   |
| `docs`     | Documentation only                         |

Examples from this project:

```
feat(auth): implement JWT access token flow
feat(docker): add postgres and redis containers
chore(prisma): add initial schema and migrate
fix(guard): handle expired token without 500 error
test(auth): add e2e tests for login endpoint
```

---

## Task sequence

```
phase-b: 00 → 01 → 02 → 02b → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15
phase-c: 01 → 02 → 03 → 04 → 05 → 06
phase-d: 01 → 02 → 03 → 04
phase-e: 01 → 02
```

Phase B must be fully complete before starting Phase C.
