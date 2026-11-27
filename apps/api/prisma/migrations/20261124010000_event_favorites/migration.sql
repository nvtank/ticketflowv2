CREATE TABLE "FavoriteEvent" (
    "userId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FavoriteEvent_pkey" PRIMARY KEY ("userId", "eventId"),
    CONSTRAINT "FavoriteEvent_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FavoriteEvent_eventId_fkey" FOREIGN KEY ("eventId")
        REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "FavoriteEvent_userId_createdAt_eventId_idx"
    ON "FavoriteEvent"("userId", "createdAt", "eventId");
CREATE INDEX "FavoriteEvent_eventId_idx" ON "FavoriteEvent"("eventId");
