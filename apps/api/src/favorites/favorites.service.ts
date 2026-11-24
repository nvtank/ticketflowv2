import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { FavoriteEventResponse, FavoriteEventsResponse } from '@tixflow/shared';
import { Prisma } from '../generated/prisma/client';
import { DatabaseService } from '../database/database.service';
import { eventInclude, eventView, pagination, publicEventStatuses } from '../events/event-record';
import type { PageDto } from '../events/events.dto';

@Injectable()
export class FavoritesService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  list(userId: string, { page, pageSize }: PageDto): Promise<FavoriteEventsResponse> {
    return this.db.$transaction(
      async (tx) => {
        const where = {
          userId,
          event: { status: 'PUBLISHED', organization: { status: 'APPROVED' } },
        } satisfies Prisma.FavoriteEventWhereInput;
        const total = await tx.favoriteEvent.count({ where });
        const skip = (page - 1) * pageSize;
        const rows =
          skip < total
            ? await tx.favoriteEvent.findMany({
                where,
                orderBy: [{ createdAt: 'desc' }, { eventId: 'desc' }],
                skip,
                take: pageSize,
                include: { event: { include: eventInclude } },
              })
            : [];
        return {
          items: rows.map(({ event, createdAt }) => {
            const {
              id,
              slug,
              title,
              category,
              city,
              venueName,
              startsAt,
              coverUrl,
              minPriceVnd,
              availableSeats,
            } = eventView(event);
            return {
              event: {
                id,
                slug,
                title,
                category,
                city,
                venueName,
                startsAt: startsAt.toISOString(),
                coverUrl,
                minPriceVnd,
                availableSeats,
              },
              createdAt: createdAt.toISOString(),
            };
          }),
          pagination: pagination(page, pageSize, total),
        };
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }

  async add(userId: string, eventId: string): Promise<FavoriteEventResponse> {
    const statuses = publicEventStatuses.map((status) => Prisma.sql`${status}::"EventStatus"`);
    // Lock visibility through the insert, and distinguish a duplicate from a nonpublic event.
    const [result] = await this.db.$queryRaw<{ visible: boolean }[]>`
      WITH target AS (
        SELECT e."id" FROM "Event" e JOIN "Organization" o ON o."id" = e."organizationId"
        WHERE e."id" = ${eventId}::uuid AND e."status" IN (${Prisma.join(statuses)})
          AND o."status" = 'APPROVED'
        FOR SHARE OF e, o
      ), added AS (
        INSERT INTO "FavoriteEvent" ("userId", "eventId")
        SELECT ${userId}::uuid, "id" FROM target
        ON CONFLICT ("userId", "eventId") DO NOTHING
      )
      SELECT EXISTS (SELECT 1 FROM target) AS visible`;
    if (!result?.visible) throw new NotFoundException('Sự kiện chưa công bố hoặc không tồn tại.');
    return { eventId, isFavorite: true };
  }

  async remove(userId: string, eventId: string): Promise<FavoriteEventResponse> {
    await this.db.favoriteEvent.deleteMany({ where: { userId, eventId } });
    return { eventId, isFavorite: false };
  }
}
