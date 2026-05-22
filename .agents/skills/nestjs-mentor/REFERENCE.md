# NestJS Mentor - Reference

Detailed helper formats referenced by `SKILL.md`.

---

## Checklist format

Create:

`planning/todo/checklists/<phase>-<task-id>-checklist.md`

Template:

```md
# Checklist - Task <ID>: <Task name>

**Branch:** <username>/feat/<phase>/<task-slug>
**Started:** <YYYY-MM-DD>
**Status:** 🔵 In progress

## Summary

- Output: <what this task produces>
- Done means: <practical acceptance result>

## Steps

- [ ] Step 1: <description>
- [ ] Step 2: <description>
- [ ] Step N: <description>

## Acceptance criteria

- [ ] <criterion 1>
- [ ] <criterion 2>

## Verify

- [ ] <main verification command or check>

## Ship

- [ ] Optional commit created
- [ ] Optional push completed
```

Rules:

- Fill `Steps` from the task file.
- Fill `Acceptance criteria` from the task file.
- Update checkboxes only when the user reports completion or verification.
- Keep the checklist lightweight; it is a progress aid, not a second spec.

---

## Learning log format

File:

`planning/todo/learning-log.md`

If missing, create:

```md
# Learning Log - NestJS Self-Study

> Notes captured after each completed task.
```

Append one entry per completed task:

```md
---

## Task <ID> - <Task name> · <YYYY-MM-DD>

**Branch:** <username>/feat/<phase>/<task-slug>

**Learned:**

- <main concept learned>
- <repo-specific pattern or convention reinforced>

**Difficulties:**

- <error, blocker, or confusion point>

**Personal notes:**

- <user's own reminder, if any>
```

If the user has no personal note, synthesize one concise reminder from the session.

---

## Task evaluation format

Create:

`planning/todo/reviews/<phase>-<task-id>-review.md`

Create the `reviews/` folder if it does not exist.

Purpose:

- leave a durable evaluation artifact after each completed task
- make it easy to review quality without reopening the whole chat
- record both delivery status and learning status

Template:

```md
# Task Review - <Task ID>: <Task name>

**Date:** <YYYY-MM-DD>
**Branch:** <username>/feat/<phase>/<task-slug>
**Task file:** `planning/todo/<phase>/<task-file>.md`
**Status:** ✅ Done

## Acceptance criteria review

- [x] <criterion 1>
- [x] <criterion 2>

## What was completed

- <implemented or verified outcome 1>
- <implemented or verified outcome 2>

## Gaps found during review

- None

## Risks or follow-ups

- <small follow-up, if any>

## Verification evidence

- <command run>
- <observable result>

## Learning snapshot

- <main concept that clicked>
- <common mistake to avoid next time>

## Mentor verdict

<2-4 sentence evaluation of whether the task is truly complete and whether the user is ready for the next task>
```

Rules:

- Write this file only when the task is actually complete.
- If the task is not complete, do not create the review file yet.
- If there are no gaps, write `- None` explicitly.
- Keep the verdict concrete and repo-specific.
- This file is an evaluation note, not a replacement for the checklist or learning log.

---

## Step explanation template

Use this when mentoring an implementation step:

```md
#### Step N - <name>

**What:** <one-line description>

**Why this step matters:**
<practical consequence of skipping it>

**How:**
- Open: <file or folder>
- Change: <what to add/edit>
- Run: <command if needed>

**Expected result:**
<observable success condition>
```

Prefer concrete repo actions over generic tutorial language.

---

## Comprehension question examples

Ask after the user confirms the step is done. One question only.

### Good questions

| Step context | Question |
| --- | --- |
| Added env validation | "Why do we validate env vars at boot instead of waiting until the first request needs them?" |
| Added Docker Compose | "Why is a shared containerized Postgres setup better for onboarding than relying on everyone's local install?" |
| Added Prisma schema | "Why do we lock the schema shape before writing service logic on top of it?" |
| Added auth guard | "Why is a default-protected route model safer than manually protecting routes one by one?" |
| Added migration | "Why do we commit migration files instead of regenerating them on each machine?" |

### Bad questions

| Bad question | Why it is weak |
| --- | --- |
| "What command did you run?" | tests recall, not understanding |
| "Which file changed?" | the answer is already visible |
| "What is the decorator name?" | trivia instead of reasoning |

### Response patterns

- Correct: `Exactly - <one sentence reinforcing the principle>.`
- Partly correct: `Close - the missing piece is <one sentence>.`
- Wrong: `Not quite - <one sentence redirection>.`

Do not turn the comprehension check into a quiz session.

---

## Error explanation

Use this 3-layer format:

```md
**What it is:** <plain-language translation of the error>

**Why it happens:** <the underlying mechanism, not just the surface symptom>

**How to fix:**
1. <specific fix option>
2. <specific alternative, if helpful>
```

Example:

```md
**What it is:** TypeScript cannot resolve the `@common/utils` alias.

**Why it happens:** `tsconfig.json` teaches the TypeScript compiler about aliases, but Jest and Node do not automatically read that mapping at runtime.

**How to fix:**
1. Add the equivalent alias mapping to the test/runtime config.
2. Or derive the mapping from `tsconfig.json` to avoid duplicating it by hand.
```

---

## Review format

When the user asks for a review, present findings first.

Pattern:

```md
1. <severity> - <issue summary>
   Why it matters: <risk or regression>
   Next move: <what to change>
```

Then, if needed:

- assumptions or open questions
- short summary of what already looks aligned

Do not start with praise or a long overview.

---

## Task status updates

Update the task file's status line:

| Situation | Status |
| --- | --- |
| Acceptance criteria all pass | `✅ Done` |
| Some work remains but progress exists | `🔵 In progress` |
| Blocked by environment or external dependency | `🔴 Blocked` |

Accept either English or Vietnamese status labels already present in the file; preserve the file's existing style when editing.

---

## Close-out artifacts

For a completed task, the mentor should leave these files updated:

1. task file status updated in `planning/todo/...`
2. checklist updated in `planning/todo/checklists/...`
3. learning log appended in `planning/todo/learning-log.md`
4. review note created in `planning/todo/reviews/...`

If one of these is missing, the close-out is incomplete.

---

## Next-task rule

When the user asks `what's next`:

1. Keep the current phase order from `planning/todo/README.md`.
2. Do not skip unfinished prerequisites.
3. If the repo already contains partial implementation for an earlier task, still verify that earlier task before moving on.
4. Prefer the next smallest actionable task, not the most interesting one.

---

## Commit message hints

Use Conventional Commits:

```text
<type>(<scope>): <short description>
```

Examples:

```text
chore(docker): add postgres and redis compose services
chore(prisma): connect prisma to local postgres
feat(auth): implement JWT access token flow
test(users): cover create-user validation rules
docs(todo): mark task 03 as done after verification
```
