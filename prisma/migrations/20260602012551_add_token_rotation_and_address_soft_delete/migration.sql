-- AlterTable: add token rotation support to refresh_tokens
ALTER TABLE "refresh_tokens" ADD COLUMN "replacedByTokenId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_replacedByTokenId_key" ON "refresh_tokens"("replacedByTokenId");

-- AddForeignKey: self-referential relation for token rotation chain
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replacedByTokenId_fkey" FOREIGN KEY ("replacedByTokenId") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: add soft delete to addresses
ALTER TABLE "addresses" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "addresses_deletedAt_idx" ON "addresses"("deletedAt");
