# Database Setup & Configuration Guide

> [!NOTE]
> This document provides the authoritative guide for initializing, configuring, and managing the PostgreSQL database for the E-commerce API. It is intended for developers, DevOps engineers, and QA testers.

---

## Executive Summary

This project utilizes a containerized **PostgreSQL 16** database managed via **Prisma ORM**. The schema encompasses the core commerce entities (Users, Categories, Products, Carts, Orders, Payments, and auth-supporting tables) designed for high performance, scalability, and strict data integrity. This guide details the rapid setup process, migration flow, and seeding mechanisms.

---

## Design Decisions

- **Database Engine**: PostgreSQL 16 via Docker for guaranteed environment consistency.
- **ORM Framework**: Prisma provides a type-safe client, schema-first modeling, and explicit migration tracking.
- **UUIDs for Security**: The `users` table utilizes UUID primary keys to prevent enumeration attacks.
- **Immutable Ledger Pattern**: Orders and Carts snapshot prices and addresses at checkout, ensuring historical data integrity even if product schemas change.
- **Soft Deletes**: `deletedAt` columns are utilized heavily (especially for `products` and `users`) to preserve relational integrity and reporting metrics.

---

## Bite-Sized Setup Steps

### Step 1: Container Orchestration

Start the database infrastructure using Docker Compose. This spins up PostgreSQL and pgAdmin.

```bash
# Start Docker containers in detached mode
docker-compose up -d

# Verify containers are healthy
docker ps
```

> [!TIP]
> You can access the **pgAdmin** web interface at `http://localhost:5050` using the default credentials: `admin@admin.com` / `admin`. The PostgreSQL connection String is `postgresql://postgres:root123@localhost:5432/ecommerce_db`.

### Step 2: Schema Migration

Initialize the database schema by executing the pending Prisma migrations.

```bash
# Generate Prisma Client after dependency install or schema updates
npx prisma generate

# Apply migrations in development
npx prisma migrate dev

# Verify migration execution status
npx prisma migrate status
```

### Step 3: Initial Data Seeding

Populate the database with foundational catalogs, test users, and essential structural data.

```bash
# Execute the global seeder
npm run seed
```

> [!IMPORTANT]
> The seeder generates critical test accounts:
>
> - **Administrator**: `admin@example.com` / `Admin@123`
> - **Standard User**: `user@example.com` / `User@123`

---

## Verification & Workflow Commands

Verify the database state and use these commands during daily development:

| Command                                                                     | Purpose                                                              |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `npx prisma migrate dev --name <migration_name>`                            | Generate and apply a migration from Prisma schema changes.           |
| `npx prisma migrate deploy`                                                 | Apply committed migrations in staging/production style environments. |
| `npx prisma migrate reset`                                                  | Reset the development database and replay migrations.                |
| `npx prisma studio`                                                         | Open Prisma Studio for visual data inspection.                       |
| `docker exec -it ecommerce-api-postgres-1 psql -U postgres -d ecommerce_db` | Drop into the interactive `psql` interactive terminal.               |

---

## Security & Performance Notes

> [!WARNING]
> Production environments require strict obedience to the following rules:

### Security

1. **Never Push Schema Blindly In Production**: Rely on committed Prisma migrations for production-like environments. Do not use development shortcuts such as reset or ad hoc schema pushes against shared databases.
2. **Access Control**: The default `postgres` superuser should be disabled or heavily restricted. Create application-specific roles with limited privileges.

### Performance & Maintenance

1. **Connection Pooling**: Use a connection pooler like PgBouncer in production to handle high-concurrency API traffic.
2. **Backup Strategy**:

   ```bash
   # Development local backup command
   docker exec -t ecommerce-api-postgres-1 pg_dump -U postgres ecommerce_db > backup.sql
   ```

3. **Restoration**:

   ```bash
   # Development local restore command
   docker exec -i ecommerce-api-postgres-1 psql -U postgres -d ecommerce_db < backup.sql
   ```

---

## Troubleshooting

> [!CAUTION]
> **"Port 5432 already in use"**
> Ensure no local PostgreSQL instances are running. On Windows, use `netstat -ano | findstr :5432` and `taskkill /PID <PID> /F` to clear zombie processes.
> [!CAUTION]
> **"No changes in database schema were found"**
> This usually means the Prisma schema and the current database are already aligned, or the edited schema change does not alter the generated SQL. Re-check `prisma/schema.prisma`, then run `npx prisma migrate status` to confirm drift state.
