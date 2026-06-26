# E-Commerce API Commands Reference

> [!NOTE]
> This document acts as the central command registry for managing the E-commerce API project lifecycle, including building, testing, database management, and orchestration. All NPM commands should be executed from the `ecommerce-api/` root directory.

---

## Executive Summary

A streamlined developer experience requires predictable, standardized tooling. This repository leverages `npm scripts` combined with Docker to encapsulate complex build processes, testing suites, and database migration lifecycles, ensuring consistency from local development to CI/CD pipelines.

---

## Application Lifecycle Commands

Control the core NestJS application process.

| Command               | Environment | Purpose                                                                  |
| --------------------- | ----------- | ------------------------------------------------------------------------ |
| `npm run start`       | Local       | Start the application normally without watch mode.                       |
| `npm run start:dev`   | Development | Start the app in watch mode with hot-reloading.                          |
| `npm run start:debug` | Development | Start the app with the Node Inspector enabled for attaching debuggers.   |
| `npm run start:prod`  | Production  | Execute the compiled JavaScript bundle from the `dist/` directory.       |
| `npm run build`       | Pipeline    | Compile the TypeScript source code into optimized JavaScript in `dist/`. |

---

## Code Quality & Testing

Guarantee code integrity before commits and deployments.

| Command              | Scope  | Purpose                                                                   |
| -------------------- | ------ | ------------------------------------------------------------------------- |
| `npm run format`     | Global | Reformat the entire `src/` and `test/` tree using Prettier rules.         |
| `npm run lint`       | Global | Scan for ESLint violations and automatically fix solvable issues.         |
| `npm run test`       | Unit   | Execute the Jest unit testing suite.                                      |
| `npm run test:watch` | Unit   | Run Jest in interactive watch mode (ideal for TDD).                       |
| `npm run test:cov`   | Unit   | Run Jest and generate a comprehensive Istanbul test coverage HTML report. |
| `npm run test:e2e`   | E2E    | Run the End-to-End integration test suite against the application shell.  |

---

## Database & Prisma Migrations

> [!IMPORTANT]
> The database schema is strictly controlled via Prisma migrations. Never modify the production database directly without a migration file.

| Command                                          | Action             | Purpose                                                                        |
| ------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------ |
| `npx prisma migrate dev --name <migration_name>` | Generate + Execute | Create a new migration from Prisma schema changes and apply it in development. |
| `npx prisma migrate deploy`                      | Execute            | Apply committed migrations in non-development environments.                    |
| `npx prisma migrate status`                      | Audit              | Display the status of local migrations versus the target database.             |
| `npx prisma migrate reset`                       | Reset              | Drop and recreate the development database, then re-apply migrations.          |
| `npx prisma generate`                            | Generate Client    | Regenerate Prisma Client after schema changes.                                 |
| `npx prisma studio`                              | Inspect            | Open a visual database explorer for development inspection.                    |
| `npm run seed`                                   | Populate           | Inject default roles, catalog metadata, and test accounts.                     |

---

## Infrastructure Orchestration (Docker)

> [!TIP]
> Ensure the Docker daemon is actively running before executing these container commands.

Control the underlying PostgreSQL and pgAdmin infrastructure.

```bash
# Spin up the background database services
docker-compose up -d

# Tail the realtime output logs of the database engine
docker-compose logs -f postgres

# Completely spin down and remove the service network
docker-compose down
```

### Low-Level Container Access

```bash
# Attach an interactive PSQL session directly inside the container
docker exec -it ecommerce-api-postgres-1 psql -U postgres -d ecommerce_db

# Perform a raw SQL dump backing up the database
docker exec -t ecommerce-api-postgres-1 pg_dump -U postgres ecommerce_db > backup.sql

# Restore a raw SQL dump into the active container
docker exec -i ecommerce-api-postgres-1 psql -U postgres -d ecommerce_db < backup.sql
```

---

## Security & Performance Notes

- **Security**: Never commit `backup.sql` files or database dumps to version control, as they may contain sensitive customer data or password hashes.
- **Performance**: Use `npm run start:dev` exclusively for local development. In production Dockerfiles, always use `npm run build` followed by `node dist/main` for optimal V8 engine memory performance.
