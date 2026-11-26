import { randomUUID } from 'node:crypto';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { SavedSeatLayout } from '@tixflow/shared';
import { DatabaseService } from '../database/database.service';
import type { EventStatus } from '../generated/prisma/client';
import type {
  CreateEventDto,
  EventDatesDto,
  EventFieldsDto,
  OrganizerQueryDto,
} from './events.dto';
import { assertEditable, validateDates } from './event-policy';
import {
  auditEvent,
  eventInclude,
  eventView,
  lockEvent,
  pagination,
  requireMember,
} from './event-record';

function eventDates(input: EventDatesDto) {
  validateDates(input);
  return {
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
    salesStartAt: new Date(input.salesStartAt),
    salesEndAt: new Date(input.salesEndAt),
  };
}

@Injectable()
export class OrganizerEventsService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}
  private data(input: EventFieldsDto) {
    return {
      ...eventDates(input),
      title: input.title,
      description: input.description,
      category: input.category,
      coverUrl: input.coverUrl ?? null,
      galleryUrls: input.galleryUrls,
      ticketPolicy: input.ticketPolicy,
      maxTicketsPerOrder: input.maxTicketsPerOrder,
    };
  }
  async create(userId: string, input: CreateEventDto) {
    const data = this.data(input);
    return this.db.$transaction(async (tx) => {
      await requireMember(tx, input.organizationId, userId);
      const event = await tx.event.create({
        data: {
          ...data,
          organization: { connect: { id: input.organizationId } },
          slug: `event-${randomUUID()}`,
          venue: { create: input.venue },
        },
        include: eventInclude,
      });
      await auditEvent(tx, event.id, userId, 'EVENT_CREATED');
      return eventView(event);
    });
  }
  async duplicate(id: string, userId: string, dates: EventDatesDto) {
    const schedule = eventDates(dates);
    return this.db.$transaction(
      async (tx) => {
        const source = await lockEvent(tx, id);
        await requireMember(tx, source.organizationId, userId);
        const originalInventory = await tx.event.findUniqueOrThrow({
          where: { id },
          select: {
            ticketTypes: { select: { id: true, name: true, priceVnd: true } },
            seats: { select: { sectionId: true, code: true, rowLabel: true, columnNumber: true } },
          },
        });
        const eventId = randomUUID();
        const { name, address, city } = source.venue;
        const venue = await tx.venue.create({ data: { name, address, city } });
        const titleSuffix = ' (bản sao)';
        const title =
          Array.from(source.title)
            .slice(0, 180 - titleSuffix.length)
            .join('')
            .trimEnd() + titleSuffix;
        const slugBase = Array.from(source.slug);
        for (let sequence = 1; ; sequence++) {
          const suffix = `-copy-${sequence}`;
          const slug = slugBase.slice(0, 200 - suffix.length).join('') + suffix;
          // Let the unique index arbitrate collisions, including concurrent inserts.
          const inserted = await tx.event.createMany({
            skipDuplicates: true,
            data: {
              ...schedule,
              id: eventId,
              slug,
              title,
              status: 'DRAFT',
              organizationId: source.organizationId,
              venueId: venue.id,
              category: source.category,
              description: source.description,
              coverUrl: source.coverUrl,
              galleryUrls: source.galleryUrls,
              ticketPolicy: source.ticketPolicy,
              maxTicketsPerOrder: source.maxTicketsPerOrder,
            },
          });
          if (inserted.count === 1) break;
        }
        const typeIds = new Map(originalInventory.ticketTypes.map(({ id }) => [id, randomUUID()]));
        const sectionIds = new Map(source.sections.map(({ id }) => [id, randomUUID()]));
        if (typeIds.size)
          await tx.ticketType.createMany({
            data: originalInventory.ticketTypes.map(({ id, name, priceVnd }) => ({
              id: typeIds.get(id)!,
              eventId,
              name,
              priceVnd,
            })),
          });
        if (sectionIds.size)
          await tx.eventSection.createMany({
            data: source.sections.map(({ id, name, ticketTypeId, rowCount, columnCount }) => ({
              id: sectionIds.get(id)!,
              eventId,
              ticketTypeId: typeIds.get(ticketTypeId)!,
              name,
              rowCount,
              columnCount,
            })),
          });
        if (originalInventory.seats.length)
          await tx.seat.createMany({
            data: originalInventory.seats.map(({ sectionId, ...seat }) => ({
              ...seat,
              eventId,
              sectionId: sectionIds.get(sectionId)!,
              status: 'AVAILABLE',
            })),
          });
        const layout = source.seatMapLayout as unknown as SavedSeatLayout | null;
        if (layout)
          await tx.event.update({
            where: { id: eventId },
            data: {
              seatMapLayout: {
                ...layout,
                stage: { ...layout.stage },
                zones: layout.zones.map((zone) => ({ ...zone, id: sectionIds.get(zone.id)! })),
                blocks: layout.blocks.map((block) => ({
                  ...block,
                  zoneId: sectionIds.get(block.zoneId)!,
                  disabledSeats: [],
                })),
              },
            },
          });
        await auditEvent(tx, eventId, userId, 'EVENT_DUPLICATED', { sourceEventId: id });
        return eventView(
          await tx.event.findUniqueOrThrow({ where: { id: eventId }, include: eventInclude }),
        );
      },
      { timeout: 15_000 },
    );
  }
  async update(id: string, userId: string, input: EventFieldsDto) {
    const data = this.data(input);
    return this.db.$transaction(async (tx) => {
      const event = await lockEvent(tx, id);
      await requireMember(tx, event.organizationId, userId);
      assertEditable(event.status);
      if (await tx.order.count({ where: { eventId: id } }))
        throw new ConflictException('Không thể thay đổi thông tin khi sự kiện đã có đơn hàng.');
      // A new venue avoids editing a venue shared with another organization's event.
      const venue = await tx.venue.create({ data: input.venue });
      const updated = await tx.event.update({
        where: { id },
        data: { ...data, venueId: venue.id, status: 'DRAFT', rejectionReason: null },
        include: eventInclude,
      });
      await auditEvent(tx, id, userId, 'EVENT_EDITED');
      return eventView(updated);
    });
  }
  async remove(id: string, userId: string) {
    return this.db.$transaction(async (tx) => {
      const event = await lockEvent(tx, id);
      await requireMember(tx, event.organizationId, userId);
      assertEditable(event.status);
      if (
        (await tx.order.count({ where: { eventId: id } })) ||
        (await tx.seatHold.count({ where: { eventId: id } })) ||
        (await tx.waitingRoomSession.count({ where: { eventId: id } }))
      )
        throw new ConflictException('Không thể xóa sự kiện đã có giao dịch hoặc phiên tham gia.');
      await tx.seat.deleteMany({ where: { eventId: id } });
      await tx.eventSection.deleteMany({ where: { eventId: id } });
      await tx.ticketType.deleteMany({ where: { eventId: id } });
      await tx.eventStaffAssignment.deleteMany({ where: { eventId: id } });
      await auditEvent(tx, id, userId, 'EVENT_DRAFT_DELETED', { title: event.title });
      await tx.event.delete({ where: { id } });
    });
  }
  async list(userId: string, query: OrganizerQueryDto) {
    const where = {
      organization: { members: { some: { userId } } },
      ...(query.status ? { status: query.status as EventStatus } : {}),
    };
    const [items, total] = await this.db.$transaction([
      this.db.event.findMany({
        where,
        include: eventInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.db.event.count({ where }),
    ]);
    return {
      items: items.map(eventView),
      pagination: pagination(query.page, query.pageSize, total),
    };
  }
  async detail(id: string, userId: string) {
    const event = await this.db.event.findUnique({ where: { id }, include: eventInclude });
    if (!event) throw new NotFoundException('Không tìm thấy sự kiện.');
    await requireMember(this.db, event.organizationId, userId, false);
    return eventView(event);
  }
  async overview(userId: string) {
    const scope = { organization: { members: { some: { userId } } } };
    const [totalEvents, sellingEvents, orders, totalSeats, soldSeats] = await this.db.$transaction([
      this.db.event.count({ where: scope }),
      this.db.event.count({
        where: {
          ...scope,
          status: 'PUBLISHED',
          salesStartAt: { lte: new Date() },
          salesEndAt: { gt: new Date() },
        },
      }),
      this.db.order.aggregate({
        where: { event: scope, status: 'PAID' },
        _sum: { totalVnd: true },
      }),
      this.db.seat.count({ where: { event: scope, status: { not: 'UNAVAILABLE' } } }),
      this.db.seat.count({ where: { event: scope, status: 'SOLD' } }),
    ]);
    return {
      totalEvents,
      sellingEvents,
      soldSeats,
      totalSeats,
      revenueVnd: orders._sum.totalVnd ?? 0,
      occupancy: totalSeats ? soldSeats / totalSeats : 0,
    };
  }
}
