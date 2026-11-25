CREATE TYPE "ContactTopic" AS ENUM ('GENERAL', 'ORGANIZER', 'TICKET', 'BUG');
CREATE TYPE "ContactMessageStatus" AS ENUM ('NEW', 'HANDLED');

CREATE TABLE "ContactMessage" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "topic" "ContactTopic" NOT NULL,
    "message" VARCHAR(5000) NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledAt" TIMESTAMPTZ(3),
    "handledById" UUID,
    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ContactMessage_handledById_fkey" FOREIGN KEY ("handledById")
        REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ContactMessage_status_createdAt_id_idx"
    ON "ContactMessage"("status", "createdAt", "id");
