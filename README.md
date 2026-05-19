# be-nest-ecom

> **Status:** Phase B — Foundation Implementation (in progress)

A RESTful e-commerce API built with NestJS, Prisma ORM, and PostgreSQL. Covers user authentication, product catalog, shopping cart, order management, and VNPay payment integration.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [NestJS](https://nestjs.com/) v11 |
| ORM | [Prisma](https://www.prisma.io/) |
| Database | PostgreSQL 16 |
| Cache | Redis |
| Auth | JWT (access + refresh token rotation) |
| Payment | VNPay |
| API Docs | Swagger / OpenAPI |
| Testing | Jest (unit + e2e) |
| Container | Docker + Docker Compose |

---

## Architecture Overview

```
src/
├── common/          # Guards, pipes, interceptors, decorators
├── config/          # Environment configuration
├── shared/          # DTOs, types, constants shared across modules
├── modules/         # Business domains (auth, user, catalog, cart, order, payment)
├── infrastructure/  # Database, Redis, external services
└── jobs/            # Background jobs, scheduled tasks
```

Domain modules follow a layered structure: `controller → service → repository → entity`.
Each module is self-contained with its own DTOs, entities, and tests.

See [`planning/setup/PROJECT_STRUCTURE.md`](planning/setup/PROJECT_STRUCTURE.md) for the full layout spec.

---

## Roadmap

12-week self-paced build from zero to production-ready:

| Phase | Weeks | Scope |
|-------|-------|-------|
| **B — Foundation** | 1–4 | NestJS bootstrap, Postgres, Auth (JWT + refresh), User profile |
| **C — Core** | 5–9 | Catalog, Cart, Order checkout, VNPay payment 🎯 MVP |
| **D — Polish** | 10–11 | Error handling, Swagger, file upload, email verification |
| **E — Ship** | 12 | Unit + e2e tests, CI/CD, deploy 🚀 |

Full roadmap: [`planning/docs/ROADMAP.md`](planning/docs/ROADMAP.md)  
Current progress: [`planning/docs/STATUS.md`](planning/docs/STATUS.md)

---

## Prerequisites

Before setting up the project, ensure the following are installed:

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 20.x | Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) |
| npm | ≥ 10.x | Comes with Node |
| Docker Desktop | latest | Runs PostgreSQL + Redis locally |
| Git | ≥ 2.40 | |

Database setup guide: [`planning/setup/DATABASE_SETUP.md`](planning/setup/DATABASE_SETUP.md)

> **Note:** `npm install` and full setup instructions will be added here when Phase B implementation begins.

---

## Project Documentation

All planning and design docs live in [`planning/`](planning/):

| Document | Purpose |
|----------|---------|
| [`planning/docs/REQUIREMENTS.md`](planning/docs/REQUIREMENTS.md) | Business requirements |
| [`planning/docs/CONTEXT.md`](planning/docs/CONTEXT.md) | Domain glossary + 28 design decisions |
| [`planning/docs/ROADMAP.md`](planning/docs/ROADMAP.md) | 12-week implementation roadmap |
| [`planning/docs/STATUS.md`](planning/docs/STATUS.md) | Live progress tracker |
| [`planning/setup/PROJECT_STRUCTURE.md`](planning/setup/PROJECT_STRUCTURE.md) | `src/` folder layout spec |
| [`planning/setup/CONVENTIONS.md`](planning/setup/CONVENTIONS.md) | Coding conventions |
| [`planning/setup/DATABASE_SCHEMA.md`](planning/setup/DATABASE_SCHEMA.md) | ER diagram |

New to this repo? Start at [`planning/README.md`](planning/README.md) — it has a 6-step reading order (~90 min) that covers everything you need before writing code.

---

## Git Convention

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(auth): add JWT refresh token rotation
fix(cart): correct total price when applying discount
```

Branch naming: `feature/<description>` or `feature/<ticket-id>-<description>`

Full convention: [`docs/GIT_CONVENTION.md`](docs/GIT_CONVENTION.md)

---

## License

Private repository. All rights reserved.
