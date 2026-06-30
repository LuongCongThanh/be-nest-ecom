-- DropIndex
DROP INDEX "categories_slug_key";

-- CreateIndex
CREATE INDEX "categories_parentId_deletedAt_sortOrder_idx" ON "categories"("parentId", "deletedAt", "sortOrder");

-- Partial unique index: slug must be unique only among non-deleted categories.
-- A soft-deleted category should not permanently reserve its slug.
CREATE UNIQUE INDEX "categories_slug_active_key" ON "categories"("slug") WHERE "deletedAt" IS NULL;
