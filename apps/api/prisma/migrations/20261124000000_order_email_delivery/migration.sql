CREATE TYPE "OrderEmailMode" AS ENUM ('STUB', 'RESEND');
CREATE TYPE "OrderEmailStatus" AS ENUM ('PENDING', 'STUBBED', 'ACCEPTED', 'DEAD_LETTER');

CREATE TABLE "OrderEmailDelivery" (
    "orderId" UUID NOT NULL,
    "mode" "OrderEmailMode" NOT NULL,
    "status" "OrderEmailStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ(3),
    "lastFailure" VARCHAR(40),
    CONSTRAINT "OrderEmailDelivery_pkey" PRIMARY KEY ("orderId"),
    CONSTRAINT "OrderEmailDelivery_orderId_fkey" FOREIGN KEY ("orderId")
        REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "OrderEmailDelivery_mode_status_availableAt_idx"
    ON "OrderEmailDelivery"("mode", "status", "availableAt");
