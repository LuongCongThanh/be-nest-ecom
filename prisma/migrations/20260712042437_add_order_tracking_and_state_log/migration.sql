-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "trackingNumber" TEXT;

-- CreateTable
CREATE TABLE "order_state_change_logs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromState" "OrderStatus" NOT NULL,
    "toState" "OrderStatus" NOT NULL,
    "changedBy" TEXT,
    "reason" TEXT,
    "isForceOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_state_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_state_change_logs_orderId_idx" ON "order_state_change_logs"("orderId");

-- AddForeignKey
ALTER TABLE "order_state_change_logs" ADD CONSTRAINT "order_state_change_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
