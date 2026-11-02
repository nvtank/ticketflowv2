import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Event, Prisma } from '@prisma/client';
import type { z } from 'zod';
import type { eventInputSchema, eventReviewSchema } from '@tf2/shared';
import { Database } from '../database';
import { AuthService } from '../auth/auth.service';

type Actor = Awaited<ReturnType<AuthService['authenticate']>>['user'];
type Input = z.infer<typeof eventInputSchema>;

@Injectable()
export class EventsService {
  constructor(@Inject(Database) private readonly db: Database) {}

  async organizer(tx: Prisma.TransactionClient, user: Actor, organizationId: string) {
    const member = await tx.membership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId } },
    });
    if (user.role !== 'ORGANIZER' || member?.role !== 'ORGANIZER')
      throw new ForbiddenException('Organizer membership required');
  }

  admin(user: Actor) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Administrator required');
  }

  private data(input: Input) {
    if (new Date(input.startsAt) <= new Date())
      throw new ConflictException('Event must start in the future');
    return { ...input, startsAt: new Date(input.startsAt), endsAt: new Date(input.endsAt) };
  }

  async create(user: Actor, organizationId: string, input: Input) {
    const data = this.data(input);
    return this.db.$transaction(async (tx) => {
      await this.organizer(tx, user, organizationId);
      const event = await tx.event.create({
        data: { ...data, organizationId, createdById: user.id },
      });
      await tx.auditLog.create({
        data: { actorId: user.id, entityId: event.id, action: 'EVENT_CREATED' },
      });
      return event;
    });
  }

  async listOwn(user: Actor, organizationId: string) {
    return this.db.$transaction(async (tx) => {
      await this.organizer(tx, user, organizationId);
      return tx.event.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });
  }

  private async locked(tx: Prisma.TransactionClient, id: string, organizationId?: string) {
    await tx.$queryRaw`SELECT "id" FROM "Event" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const event = await tx.event.findFirst({
      where: { id, ...(organizationId ? { organizationId } : {}) },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(user: Actor, organizationId: string, id: string, input: Input) {
    const data = this.data(input);
    return this.db.$transaction(async (tx) => {
      await this.organizer(tx, user, organizationId);
      const event = await this.locked(tx, id, organizationId);
      if (!['DRAFT', 'REJECTED'].includes(event.status))
        throw new ConflictException('Event is not editable');
      const updated = await tx.event.update({ where: { id }, data });
      await tx.auditLog.create({
        data: { actorId: user.id, entityId: id, action: 'EVENT_UPDATED' },
      });
      return updated;
    });
  }

  async submit(user: Actor, organizationId: string, id: string) {
    return this.db.$transaction(async (tx) => {
      await this.organizer(tx, user, organizationId);
      const event = await this.locked(tx, id, organizationId);
      if (!['DRAFT', 'REJECTED'].includes(event.status) || event.startsAt <= new Date())
        throw new ConflictException('Event cannot be submitted');
      const updated = await tx.event.update({
        where: { id },
        data: { status: 'SUBMITTED', reviewReason: null },
      });
      await tx.auditLog.create({
        data: { actorId: user.id, entityId: id, action: 'EVENT_SUBMITTED' },
      });
      return updated;
    });
  }

  async remove(user: Actor, organizationId: string, id: string) {
    return this.db.$transaction(async (tx) => {
      await this.organizer(tx, user, organizationId);
      const event = await this.locked(tx, id, organizationId);
      if (!['DRAFT', 'REJECTED'].includes(event.status))
        throw new ConflictException('Event cannot be deleted');
      await tx.event.delete({ where: { id } });
      await tx.auditLog.create({
        data: { actorId: user.id, entityId: id, action: 'EVENT_DELETED' },
      });
      return { status: 'ok' };
    });
  }

  async pending(user: Actor) {
    this.admin(user);
    return this.db.event.findMany({
      where: { status: 'SUBMITTED' },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async review(user: Actor, id: string, input: z.infer<typeof eventReviewSchema>) {
    this.admin(user);
    return this.db.$transaction(async (tx) => {
      const event = await this.locked(tx, id);
      if (event.status !== 'SUBMITTED' || event.startsAt <= new Date())
        throw new ConflictException('Event is not awaiting review');
      const updated = await tx.event.update({
        where: { id },
        data: {
          status: input.decision === 'approve' ? 'PUBLISHED' : 'REJECTED',
          reviewReason: input.decision === 'reject' ? input.reason : null,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entityId: id,
          action: input.decision === 'approve' ? 'EVENT_APPROVED' : 'EVENT_REJECTED',
        },
      });
      return updated;
    });
  }

  private publicEvent(event: Event) {
    const { id, title, description, venue, startsAt, endsAt, organizationId } = event;
    return { id, title, description, venue, startsAt, endsAt, organizationId };
  }

  async catalog(query: string) {
    return (
      await this.db.event.findMany({
        where: {
          status: 'PUBLISHED',
          ...(query ? { title: { contains: query, mode: 'insensitive' as const } } : {}),
        },
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        take: 50,
      })
    ).map((event) => this.publicEvent(event));
  }

  async detail(id: string) {
    const event = await this.db.event.findFirst({ where: { id, status: 'PUBLISHED' } });
    if (!event) throw new NotFoundException('Event not found');
    return this.publicEvent(event);
  }
}
