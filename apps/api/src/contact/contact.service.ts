import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { pagination } from '../events/event-record';
import type { ContactMessageQueryDto, CreateContactMessageDto } from './contact.dto';

@Injectable()
export class ContactService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  async create(input: CreateContactMessageDto) {
    const { website, ...message } = input;
    // Return the normal acknowledgement for bots while leaving no stored record.
    if (website) return { accepted: true };
    await this.db.contactMessage.create({ data: message });
    return { accepted: true };
  }

  async list({ page, pageSize, status }: ContactMessageQueryDto) {
    const where = status ? { status } : {};
    const [items, total] = await this.db.$transaction([
      this.db.contactMessage.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          topic: true,
          message: true,
          status: true,
          createdAt: true,
          handledAt: true,
          handledById: true,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.db.contactMessage.count({ where }),
    ]);
    return { items, pagination: pagination(page, pageSize, total) };
  }

  async markHandled(id: string, actorId: string) {
    return this.db.$transaction(async (tx) => {
      const changed = await tx.contactMessage.updateMany({
        where: { id, status: 'NEW' },
        data: { status: 'HANDLED', handledAt: new Date(), handledById: actorId },
      });
      if (!changed.count) {
        const existing = await tx.contactMessage.findUnique({
          where: { id },
          select: { id: true, status: true, handledAt: true, handledById: true },
        });
        if (!existing) throw new NotFoundException('Contact message not found.');
        return existing;
      }
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'CONTACT_MESSAGE_HANDLED',
          entityType: 'ContactMessage',
          entityId: id,
        },
      });
      return tx.contactMessage.findUniqueOrThrow({
        where: { id },
        select: { id: true, status: true, handledAt: true, handledById: true },
      });
    });
  }
}
