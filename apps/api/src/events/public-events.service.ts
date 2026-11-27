import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { EventFiltersResponse } from '@tixflow/shared';
import { Prisma } from '../generated/prisma/client';
import { DatabaseService } from '../database/database.service';
import type { EventQueryDto } from './events.dto';
import { eventInclude, eventView, pagination, publicEventStatuses } from './event-record';

@Injectable()
export class PublicEventsService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}
  async list(query: EventQueryDto) {
    if (
      (query.from && query.to && new Date(query.from) > new Date(query.to)) ||
      (query.minPrice !== undefined &&
        query.maxPrice !== undefined &&
        query.minPrice > query.maxPrice)
    )
      throw new BadRequestException('Khoảng ngày hoặc giá không hợp lệ.');
    const minPrice = Prisma.sql`COALESCE((SELECT MIN(t."priceVnd") FROM "TicketType" t WHERE t."eventId"=e."id"),0)`;
    const terms = [
      Prisma.sql`e."status"='PUBLISHED'`,
      Prisma.sql`e."startsAt">${new Date()}`,
      Prisma.sql`o."status"='APPROVED'`,
    ];
    if (query.q)
      terms.push(Prisma.sql`e."title" ILIKE ${'%' + query.q.replace(/[\\%_]/g, '\\$&') + '%'}`);
    if (query.category) terms.push(Prisma.sql`e."category"=${query.category}`);
    if (query.city) terms.push(Prisma.sql`LOWER(TRIM(v."city"))=LOWER(TRIM(${query.city}))`);
    if (query.from) terms.push(Prisma.sql`e."startsAt">=${new Date(query.from)}`);
    if (query.to) {
      const toDate =
        query.to.length === 10
          ? new Date(new Date(query.to).getTime() + 86400000 - 1)
          : new Date(query.to);
      terms.push(Prisma.sql`e."startsAt"<=${toDate}`);
    }
    if (query.minPrice !== undefined) terms.push(Prisma.sql`${minPrice}>=${query.minPrice}`);
    if (query.maxPrice !== undefined) terms.push(Prisma.sql`${minPrice}<=${query.maxPrice}`);
    const from = Prisma.sql`FROM "Event" e JOIN "Venue" v ON v."id"=e."venueId" JOIN "Organization" o ON o."id"=e."organizationId" WHERE ${Prisma.join(terms, ' AND ')}`;
    const sort =
      query.sort === 'price_asc'
        ? Prisma.sql`${minPrice} ASC`
        : query.sort === 'price_desc'
          ? Prisma.sql`${minPrice} DESC`
          : query.sort === 'latest'
            ? Prisma.sql`e."startsAt" DESC`
            : Prisma.sql`e."startsAt" ASC`;
    const [ids, counts] = await Promise.all([
      this.db.$queryRaw<{ id: string }[]>(
        Prisma.sql`SELECT e."id" ${from} ORDER BY ${sort},e."id" ASC LIMIT ${query.pageSize} OFFSET ${(query.page - 1) * query.pageSize}`,
      ),
      this.db.$queryRaw<{ total: number }[]>(Prisma.sql`SELECT COUNT(*)::int AS total ${from}`),
    ]);
    const events = await this.db.event.findMany({
      where: { id: { in: ids.map((i) => i.id) }, status: 'PUBLISHED' },
      include: eventInclude,
    });
    const byId = new Map(events.map((e) => [e.id, eventView(e)]));
    return {
      items: ids.flatMap((i) => {
        const event = byId.get(i.id);
        return event ? [event] : [];
      }),
      pagination: pagination(query.page, query.pageSize, counts[0]?.total ?? 0),
    };
  }
  async filters(): Promise<EventFiltersResponse> {
    const now = new Date();
    const [cityRows, priceRows] = await Promise.all([
      this.db.$queryRaw<{ city: string }[]>(Prisma.sql`
        SELECT DISTINCT TRIM(v."city") AS city
        FROM "Event" e
        JOIN "Venue" v ON v."id" = e."venueId"
        JOIN "Organization" o ON o."id" = e."organizationId"
        WHERE e."status" = 'PUBLISHED'
          AND e."startsAt" > ${now}
          AND o."status" = 'APPROVED'
          AND TRIM(v."city") <> ''
        ORDER BY city ASC
      `),
      this.db.$queryRaw<{ minPriceVnd: number; maxPriceVnd: number }[]>(Prisma.sql`
        SELECT
          COALESCE(MIN(t."priceVnd"), 0)::int AS "minPriceVnd",
          COALESCE(MAX(t."priceVnd"), 0)::int AS "maxPriceVnd"
        FROM "TicketType" t
        JOIN "Event" e ON e."id" = t."eventId"
        JOIN "Organization" o ON o."id" = e."organizationId"
        WHERE e."status" = 'PUBLISHED'
          AND e."startsAt" > ${now}
          AND o."status" = 'APPROVED'
      `),
    ]);
    return {
      cities: cityRows.map((row) => row.city),
      minPriceVnd: priceRows[0]?.minPriceVnd ?? 0,
      maxPriceVnd: priceRows[0]?.maxPriceVnd ?? 0,
    };
  }
  async resolve(key: string) {
    const event = await this.db.event.findFirst({
      where: {
        status: { in: publicEventStatuses },
        organization: { status: 'APPROVED' },
        ...(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key)
          ? { id: key }
          : { slug: key }),
      },
      include: eventInclude,
    });
    if (!event) throw new NotFoundException('Sự kiện chưa công bố hoặc không tồn tại.');
    return event;
  }
  async detail(key: string, userId?: string) {
    const event = eventView(await this.resolve(key));
    if (!userId) return event;
    const favorite = await this.db.favoriteEvent.findUnique({
      where: { userId_eventId: { userId, eventId: event.id } },
      select: { eventId: true },
    });
    return { ...event, isFavorite: Boolean(favorite) };
  }
  async seats(key: string) {
    return this.db.$transaction(
      async (tx) => {
        const found = await tx.event.findFirst({
          where: {
            status: 'PUBLISHED',
            organization: { status: 'APPROVED' },
            ...(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key)
              ? { id: key }
              : { slug: key }),
          },
        });
        if (!found) throw new NotFoundException('Sự kiện chưa công bố hoặc không tồn tại.');
        const now = new Date();
        const seats = await tx.seat.findMany({
          where: { eventId: found.id },
          orderBy: [{ rowLabel: 'asc' }, { columnNumber: 'asc' }],
          include: {
            hold: { select: { expiresAt: true, releasedAt: true } },
            section: { include: { ticketType: true } },
          },
        });
        return {
          eventId: found.id,
          revision: found.inventoryRevision,
          serverTime: now,
          seats: seats.map((s) => ({
            id: s.id,
            sectionId: s.sectionId,
            code: s.code,
            rowLabel: s.rowLabel,
            columnNumber: s.columnNumber,
            status:
              s.status === 'HELD' && s.hold && (s.hold.expiresAt <= now || s.hold.releasedAt)
                ? 'AVAILABLE'
                : s.status,
            priceVnd: s.section.ticketType.priceVnd,
          })),
        };
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }
  async inventory(key: string) {
    const event = eventView(await this.resolve(key));
    return {
      eventId: event.id,
      revision: event.inventoryRevision,
      serverTime: new Date(),
      availableSeats: event.availableSeats,
      sections: event.sections,
    };
  }
}
