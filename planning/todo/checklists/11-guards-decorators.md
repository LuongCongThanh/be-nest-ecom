# Checklist — Task 11: Guards & Decorators

**Branch:** ThanhLuongCong/feat/phase-b/11-guards-decorators
**Started:** 2026-05-30

## Steps

- [x] Step 1: Scaffold decorators and guards under `src/common/decorators/` and `src/common/guards/`
- [x] Step 2: Implement `@Public()`, `@Roles()`, and `@CurrentUser()`
- [x] Step 3: Implement `JwtAuthGuard` with `@Public()` bypass and custom auth error codes
- [x] Step 4: Implement `RolesGuard` with role-based authorization check
- [x] Step 5: Register `JwtAuthGuard` and `RolesGuard` globally in `AppModule`
- [x] Step 6: Mark health endpoints as public with `@Public()`
- [ ] Step 7: Run runtime verification for public and protected routes
- [x] Step 7: Run runtime verification for public and protected routes
- [x] Step 7: Run runtime verification for public and protected routes
- [ ] Step 8: Verify expired-token and role-mismatch behavior when auth endpoints are available
- [ ] Step 9: Verify `@CurrentUser()` / `@CurrentUser('id')` against a protected endpoint

## Acceptance criteria

- [x] AC-1: Public route does not require a token
- [x] AC-2: Protected route rejects requests without a token with `401 TOKEN_INVALID`
- [ ] AC-3: Expired token returns `401 TOKEN_EXPIRED`
- [ ] AC-4: Role mismatch returns `403 FORBIDDEN`
- [ ] AC-5: `@CurrentUser('id')` extracts `request.user.id`

## Ship

- [ ] git add + commit
- [ ] git push
- [ ] PR opened
