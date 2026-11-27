import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@tixflow/shared';
import type { Principal } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';
import { csvRow } from './attendee-csv';
import { requireMember } from './event-record';

const pageSize = 250;
const header = [
  'Ticket code',
  'Ticket type',
  'Section',
  'Seat',
  'Buyer name',
  'Buyer email',
  'Order paid time (UTC)',
  'Check-in status',
  'Check-in time (UTC)',
];

@Injectable()
export class AttendeesService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  async export(eventId: string, principal: Principal) {
    const event = await this.db.event.findUnique({
      where: { id: eventId },
      select: { slug: true, organizationId: true },
    });
    if (!event) throw new NotFoundException('Không tìm thấy sự kiện.');
    if (principal.user.role !== UserRole.ADMIN)
      await requireMember(this.db, event.organizationId, principal.user.id, false);

    const slug = event.slug.replace(/[^a-zA-Z0-9_-]/g, '-') || eventId;
    return { filename: `${slug}-attendees.csv`, rows: this.rows(eventId) };
  }

  private async *rows(eventId: string): AsyncGenerator<string> {
    yield '\uFEFF' + csvRow(header);
    let after: string | undefined;
    for (;;) {
      const page = await this.db.ticket.findMany({
        where: {
          eventId,
          status: { in: ['VALID', 'USED'] },
          orderItem: { order: { status: 'PAID' } },
          ...(after === undefined ? {} : { code: { gt: after } }),
        },
        orderBy: { code: 'asc' },
        take: pageSize,
        select: {
          code: true,
          seat: {
            select: {
              code: true,
              section: { select: { name: true, ticketType: { select: { name: true } } } },
            },
          },
          orderItem: {
            select: {
              order: { select: { paidAt: true, user: { select: { name: true, email: true } } } },
            },
          },
          checkIn: { select: { createdAt: true } },
        },
      });
      for (const {
        code,
        seat,
        orderItem: { order },
        checkIn,
      } of page) {
        yield csvRow([
          code,
          seat.section.ticketType.name,
          seat.section.name,
          seat.code,
          order.user.name,
          order.user.email,
          order.paidAt?.toISOString() ?? '',
          checkIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
          checkIn?.createdAt.toISOString() ?? '',
        ]);
      }
      if (page.length < pageSize) return;
      after = page.at(-1)?.code;
    }
  }
}
