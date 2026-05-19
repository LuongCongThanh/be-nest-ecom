## Summary

<!-- What does this PR do and why? One paragraph max. -->

Closes <!-- ticket, e.g. AUTH-08 -->

---

## Type of Change

- [ ] `feat` — New feature
- [ ] `fix` — Bug fix
- [ ] `refactor` — Code improvement (no behavior change)
- [ ] `perf` — Performance improvement
- [ ] `test` — Tests only
- [ ] `docs` — Documentation only
- [ ] `chore` — Config, tooling, CI/CD
- [ ] `breaking change` — Breaking change (mark `!` in commit)

---

## Changes Made

<!--
List the key changes. Be specific.
- Added RefreshTokenEntity with TTL field
- Implemented token rotation in AuthService.refresh()
- Added unit tests covering replay attack scenario
-->

-
-
-

---

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manually tested on local

**Scenarios covered:**

```
Happy path:  ...
Edge case:   ...
Error case:  ...
```

---

## Breaking Changes

<!-- Remove this section if no breaking changes -->

**What changed:**

**Migration required:**

---

## Pre-Merge Checklist

- [ ] Self-reviewed the diff before requesting review
- [ ] No leftover `console.log` or debug code
- [ ] No secrets or credentials in code
- [ ] Swagger/API docs updated (if API changed)
- [ ] `.env.example` updated (if new env vars added)
- [ ] DB migration file created and rollback tested (if schema changed)
- [ ] Commit messages follow Conventional Commits
