import 'reflect-metadata';
import { randomUUID, createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import Redis from 'ioredis';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type * as App from '../src/app.module';
import type * as Bootstrap from '../src/bootstrap';
import type * as Env from '../src/config/environment';
import type * as DB from '../src/database/database.service';
import type * as Auth from '../src/auth/auth.service';
import type * as Passwords from '../src/auth/password.service';
import type * as Organizer from '../src/events/organizer-events.service';
import type * as Seats from '../src/events/seat-management.service';
import type * as Review from '../src/events/event-review.service';
const require = createRequire(import.meta.url);
const { AppModule } = require('../dist/app.module.js') as typeof App;
const { configureApplication } = require('../dist/bootstrap.js') as typeof Bootstrap;
const { parseEnvironment } = require('../dist/config/environment.js') as typeof Env;
const { DatabaseService } = require('../dist/database/database.service.js') as typeof DB;
const { AuthService } = require('../dist/auth/auth.service.js') as typeof Auth;
const { PasswordService } = require('../dist/auth/password.service.js') as typeof Passwords;
const { OrganizerEventsService } =
  require('../dist/events/organizer-events.service.js') as typeof Organizer;
const { SeatManagementService } =
  require('../dist/events/seat-management.service.js') as typeof Seats;
const { EventReviewService } = require('../dist/events/event-review.service.js') as typeof Review;
describe('Event management with real PostgreSQL and Redis', () => {
  let app: INestApplication,
    db: InstanceType<typeof DatabaseService>,
    events: InstanceType<typeof OrganizerEventsService>,
    seats: InstanceType<typeof SeatManagementService>,
    review: InstanceType<typeof EventReviewService>;
  const prefix = randomUUID(),
    users = new Map<string, string>(),
    tokens = new Map<string, string>(),
    orgs: string[] = [],
    password = 'Fixture-events-password!2026';
  let eventId = '',
    slug = '',
    disabledId = '',
    soldId = '';
  const body = () => ({
    organizationId: orgs[0]!,
    title: `${prefix} Main concert`,
    description: 'Một sự kiện âm nhạc dành cho kiểm thử tích hợp thực tế.',
    category: 'MUSIC',
    venue: { name: `${prefix} Venue test`, address: '123 Đường kiểm thử', city: 'Đà Nẵng' },
    startsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    endsAt: new Date(Date.now() + 31 * 86400000).toISOString(),
    salesStartAt: new Date(Date.now() - 86400000).toISOString(),
    salesEndAt: new Date(Date.now() + 29 * 86400000).toISOString(),
    coverUrl: null,
    galleryUrls: [],
    ticketPolicy: 'Vé không hoàn lại sau khi đã thanh toán.',
    maxTicketsPerOrder: 4,
  });
  const grid = {
    sections: [
      { name: 'VIP', ticketName: 'VIP', priceVnd: 1200000, rows: 2, columns: 20 },
      { name: 'Standard', ticketName: 'Standard', priceVnd: 499000, rows: 8, columns: 20 },
    ],
  };
  const bearer = (role = 'ORGANIZER') => `Bearer ${tokens.get(role)}`;
  const http = () => request(app.getHttpServer());
  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (
      !['localhost', '127.0.0.1'].includes(url.hostname) ||
      url.port !== '55443' ||
      url.pathname !== '/tixflow_test'
    )
      throw new Error('Requires dedicated local test database.');
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication({ logger: false });
    configureApplication(app, parseEnvironment(process.env));
    await app.listen(0, '127.0.0.1');
    db = app.get(DatabaseService);
    await db.$queryRaw`SELECT 1`;
    const redis = new Redis(process.env.REDIS_URL ?? '', {
      lazyConnect: true,
      retryStrategy: () => null,
    });
    redis.on('error', () => {});
    try {
      await redis.connect();
      expect(await redis.ping()).toBe('PONG');
    } finally {
      redis.disconnect();
    }
    const hash = await app.get(PasswordService).hash(password);
    for (const name of ['ORGANIZER', 'OTHER', 'ADMIN', 'CUSTOMER', 'STAFF']) {
      const role =
        name === 'OTHER' ? 'ORGANIZER' : (name as 'ORGANIZER' | 'ADMIN' | 'CUSTOMER' | 'STAFF');
      const user = await db.user.create({
        data: {
          email: `${prefix}-${name.toLowerCase()}@events.local`,
          name: `Event ${name}`,
          role,
          passwordHash: hash,
        },
      });
      users.set(name, user.id);
      const auth = await app.get(AuthService).login({ email: user.email, password });
      tokens.set(name, auth.accessToken);
    }
    for (const name of ['ORGANIZER', 'OTHER']) {
      const org = await db.organization.create({
        data: {
          name: `${prefix} ${name}`,
          slug: `${prefix}-${name.toLowerCase()}`,
          status: 'APPROVED',
          members: { create: { userId: users.get(name)! } },
        },
      });
      orgs.push(org.id);
    }
    events = app.get(OrganizerEventsService);
    seats = app.get(SeatManagementService);
    review = app.get(EventReviewService);
  });
  afterAll(async () => {
    if (db && orgs.length) {
      const eventIds = (
        await db.event.findMany({ where: { organizationId: { in: orgs } }, select: { id: true } })
      ).map((event) => event.id);
      const where = { eventId: { in: eventIds } };
      await db.checkIn.deleteMany({ where: { ticket: where } });
      await db.ticket.deleteMany({ where });
      await db.payment.deleteMany({ where: { order: where } });
      await db.orderItem.deleteMany({ where });
      await db.order.deleteMany({ where });
      await db.seat.updateMany({ where, data: { status: 'AVAILABLE', holdId: null } });
      await db.seatHold.deleteMany({ where });
      await db.seat.deleteMany({ where });
      await db.eventSection.deleteMany({ where });
      await db.ticketType.deleteMany({ where });
      await db.eventStaffAssignment.deleteMany({ where });
      const fixtureEvents = await db.event.findMany({
        where: { organizationId: { in: orgs } },
        select: { venueId: true },
      });
      await db.event.deleteMany({ where: { organizationId: { in: orgs } } });
      await db.venue.deleteMany({ where: { id: { in: fixtureEvents.map((e) => e.venueId) } } });
      await db.venue.deleteMany({ where: { name: { startsWith: prefix } } });
      await db.organizationMember.deleteMany({ where: { organizationId: { in: orgs } } });
      await db.organization.deleteMany({ where: { id: { in: orgs } } });
    }
    if (db && users.size) {
      await db.auditLog.deleteMany({ where: { actorId: { in: [...users.values()] } } });
      await db.user.deleteMany({ where: { id: { in: [...users.values()] } } });
    }
    await app?.close();
  });
  it('requires authentication, organizer role and organization membership', async () => {
    await http().post('/api/v1/organizer/events').send(body()).expect(401);
    await http()
      .post('/api/v1/organizer/events')
      .set('Authorization', bearer('CUSTOMER'))
      .send(body())
      .expect(403);
    await http()
      .post('/api/v1/organizer/events')
      .set('Authorization', bearer('OTHER'))
      .send(body())
      .expect(403);
  });
  it('creates a private draft and hides all public snapshots', async () => {
    const response = await http()
      .post('/api/v1/organizer/events')
      .set('Authorization', bearer())
      .send(body())
      .expect(201);
    eventId = response.body.id;
    slug = response.body.slug;
    expect(response.body.status).toBe('DRAFT');
    for (const suffix of ['', '/seats', '/inventory'])
      await http().get(`/api/v1/events/${slug}${suffix}`).expect(404);
  });
  it('validates DTOs, date windows and immutable ownership fields', async () => {
    await http()
      .post('/api/v1/organizer/events')
      .set('Authorization', bearer())
      .send({ ...body(), endsAt: body().salesStartAt })
      .expect(400);
    await http()
      .post('/api/v1/organizer/events')
      .set('Authorization', bearer())
      .send({ ...body(), venue: undefined })
      .expect(400);
    await http()
      .patch(`/api/v1/organizer/events/${eventId}`)
      .set('Authorization', bearer())
      .send({ ...body(), organizationId: orgs[1] })
      .expect(400);
  });
  it('rejects cross organization detail, writes, history and staff access', async () => {
    for (const suffix of ['', '/seats', '/history', '/staff'])
      await http()
        .get(`/api/v1/organizer/events/${eventId}${suffix}`)
        .set('Authorization', bearer('OTHER'))
        .expect(403);
    await http()
      .post(`/api/v1/organizer/events/${eventId}/seat-map`)
      .set('Authorization', bearer('OTHER'))
      .send(grid)
      .expect(403);
  });
  it('updates its draft and keeps venue edits isolated', async () => {
    const { organizationId: _, ...input } = body();
    void _;
    const old = await db.event.findUniqueOrThrow({ where: { id: eventId } });
    await http()
      .patch(`/api/v1/organizer/events/${eventId}`)
      .set('Authorization', bearer())
      .send({ ...input, venue: { ...input.venue, name: `${prefix} Updated venue` } })
      .expect(200);
    expect((await db.venue.findUniqueOrThrow({ where: { id: old.venueId } })).name).toBe(
      `${prefix} Venue test`,
    );
  });
  it('rejects submission without inventory', async () => {
    await http()
      .post(`/api/v1/organizer/events/${eventId}/submit`)
      .set('Authorization', bearer())
      .expect(400);
  });
  it('generates 200 unique seats with VIP and Standard prices', async () => {
    await http()
      .post(`/api/v1/organizer/events/${eventId}/seat-map`)
      .set('Authorization', bearer())
      .send(grid)
      .expect(200);
    const snapshot = await http()
      .get(`/api/v1/organizer/events/${eventId}/seats`)
      .set('Authorization', bearer())
      .expect(200);
    expect(snapshot.body.seats).toHaveLength(200);
    expect(new Set(snapshot.body.seats.map((s: { code: string }) => s.code)).size).toBe(200);
    expect(snapshot.body.seats.find((s: { code: string }) => s.code === 'A01').priceVnd).toBe(
      1200000,
    );
    expect(snapshot.body.seats.find((s: { code: string }) => s.code === 'C01').priceVnd).toBe(
      499000,
    );
    disabledId = snapshot.body.seats[0].id;
  });
  it('rolls back invalid grid replacement without losing inventory', async () => {
    await http()
      .post(`/api/v1/organizer/events/${eventId}/seat-map`)
      .set('Authorization', bearer())
      .send({ sections: [grid.sections[0], grid.sections[0]] })
      .expect(400);
    const original = await db.seat.findMany({
      where: { eventId },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    // Bypass the HTTP DTO deliberately: the second section violates a database CHECK
    // after deletion and the first section insertion, proving actual transaction rollback.
    await expect(
      seats.generate(eventId, users.get('ORGANIZER')!, {
        sections: [grid.sections[0]!, { ...grid.sections[1]!, rows: 0 }],
      }),
    ).rejects.toThrow();
    expect(
      await db.seat.findMany({ where: { eventId }, select: { id: true }, orderBy: { id: 'asc' } }),
    ).toEqual(original);
    expect(original).toHaveLength(200);
  });
  it('disables a seat and increments the inventory revision', async () => {
    const before = await db.event.findUniqueOrThrow({ where: { id: eventId } });
    await http()
      .patch(`/api/v1/organizer/events/${eventId}/seats/${disabledId}`)
      .set('Authorization', bearer())
      .send({ enabled: false })
      .expect(200);
    expect((await db.event.findUniqueOrThrow({ where: { id: eventId } })).inventoryRevision).toBe(
      before.inventoryRevision + 1,
    );
  });
  it('assigns only active STAFF and keeps assignment unique', async () => {
    const staff = await db.user.findUniqueOrThrow({ where: { id: users.get('STAFF')! } }),
      customer = await db.user.findUniqueOrThrow({ where: { id: users.get('CUSTOMER')! } });
    await http()
      .post(`/api/v1/organizer/events/${eventId}/staff`)
      .set('Authorization', bearer())
      .send({ email: customer.email })
      .expect(400);
    for (let i = 0; i < 2; i++)
      await http()
        .post(`/api/v1/organizer/events/${eventId}/staff`)
        .set('Authorization', bearer())
        .send({ email: staff.email })
        .expect(201);
    expect(await db.eventStaffAssignment.count({ where: { eventId } })).toBe(1);
    await http()
      .delete(`/api/v1/organizer/events/${eventId}/staff/${staff.id}`)
      .set('Authorization', bearer())
      .expect(204);
  });
  it('submits a complete event and freezes content and grid edits', async () => {
    await http()
      .post(`/api/v1/organizer/events/${eventId}/submit`)
      .set('Authorization', bearer())
      .expect(200);
    const { organizationId: _, ...input } = body();
    void _;
    await http()
      .patch(`/api/v1/organizer/events/${eventId}`)
      .set('Authorization', bearer())
      .send(input)
      .expect(409);
    await http()
      .post(`/api/v1/organizer/events/${eventId}/seat-map`)
      .set('Authorization', bearer())
      .send(grid)
      .expect(409);
    await http()
      .patch(`/api/v1/organizer/events/${eventId}/seats/${disabledId}`)
      .set('Authorization', bearer())
      .send({ enabled: true })
      .expect(409);
  });
  it('restricts review to admins and requires a rejection reason', async () => {
    await http()
      .patch(`/api/v1/admin/events/${eventId}/approve`)
      .set('Authorization', bearer())
      .expect(403);
    await http()
      .patch(`/api/v1/admin/events/${eventId}/reject`)
      .set('Authorization', bearer('ADMIN'))
      .send({ reason: '  ' })
      .expect(400);
  });
  it('records rejection and supports correction/resubmission', async () => {
    await http()
      .patch(`/api/v1/admin/events/${eventId}/reject`)
      .set('Authorization', bearer('ADMIN'))
      .send({ reason: 'Bổ sung chính sách vé rõ ràng.' })
      .expect(200);
    expect((await events.detail(eventId, users.get('ORGANIZER')!)).status).toBe('REJECTED');
    const { organizationId: _, ...input } = body();
    void _;
    await events.update(eventId, users.get('ORGANIZER')!, input);
    await review.submit(eventId, users.get('ORGANIZER')!);
  });
  it('serializes conflicting review decisions and preserves one winner', async () => {
    const results = await Promise.all([
      http().patch(`/api/v1/admin/events/${eventId}/approve`).set('Authorization', bearer('ADMIN')),
      http()
        .patch(`/api/v1/admin/events/${eventId}/reject`)
        .set('Authorization', bearer('ADMIN'))
        .send({ reason: 'Cần chỉnh sửa thêm thông tin.' }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    const event = await db.event.findUniqueOrThrow({ where: { id: eventId } });
    if (event.status === 'REJECTED') {
      await review.submit(eventId, users.get('ORGANIZER')!);
      await review.decide(eventId, users.get('ADMIN')!, true);
    }
    const history = await review.history(eventId);
    expect(history.some((log) => log.action === 'EVENT_APPROVED')).toBe(true);
  });
  it('lists only published events with city, date, price filters, sorting and /events/filters', async () => {
    const soonStart = new Date(Date.now() + 10 * 86400000).toISOString();
    const soonEnd = new Date(Date.now() + 11 * 86400000).toISOString();
    const cheap = await events.create(users.get('ORGANIZER')!, {
      ...body(),
      title: `${prefix} Cheaper concert`,
      venue: { name: `${prefix} HN Venue`, address: '45 Tràng Tiền', city: 'Hà Nội' },
      startsAt: soonStart,
      endsAt: soonEnd,
      salesEndAt: new Date(Date.now() + 9 * 86400000).toISOString(),
    });
    await seats.generate(cheap.id, users.get('ORGANIZER')!, {
      sections: [
        { name: 'Standard', ticketName: 'Standard', priceVnd: 100000, rows: 1, columns: 2 },
      ],
    });
    await review.submit(cheap.id, users.get('ORGANIZER')!);
    await review.decide(cheap.id, users.get('ADMIN')!, true);

    const draftHidden = await events.create(users.get('ORGANIZER')!, {
      ...body(),
      title: `${prefix} Draft hidden`,
      venue: { name: `${prefix} Secret Venue`, address: '99 Bí Mật', city: 'Cần Thơ' },
    });
    await seats.generate(draftHidden.id, users.get('ORGANIZER')!, {
      sections: [{ name: 'Draft', ticketName: 'Draft', priceVnd: 50000, rows: 1, columns: 1 }],
    });

    const filters = await http().get('/api/v1/events/filters').expect(200);
    expect(filters.body.cities).toEqual(expect.arrayContaining(['Đà Nẵng', 'Hà Nội']));
    expect(filters.body.cities).not.toContain('Cần Thơ');
    expect(filters.body.minPriceVnd).toBeLessThanOrEqual(100000);
    expect(filters.body.maxPriceVnd).toBeGreaterThanOrEqual(1200000);

    const byCity = await http()
      .get('/api/v1/events')
      .query({ q: prefix, city: 'hà nội' })
      .expect(200);
    expect(byCity.body.items.map((e: { id: string }) => e.id)).toEqual([cheap.id]);

    const byDateWindow = await http()
      .get('/api/v1/events')
      .query({
        q: prefix,
        from: new Date(Date.now() + 5 * 86400000).toISOString(),
        to: new Date(Date.now() + 20 * 86400000).toISOString(),
      })
      .expect(200);
    expect(byDateWindow.body.items.map((e: { id: string }) => e.id)).toEqual([cheap.id]);

    const soonest = await http()
      .get('/api/v1/events')
      .query({ q: prefix, sort: 'soonest' })
      .expect(200);
    expect(soonest.body.items.map((e: { id: string }) => e.id)).toEqual([cheap.id, eventId]);

    const latest = await http()
      .get('/api/v1/events')
      .query({ q: prefix, sort: 'latest' })
      .expect(200);
    expect(latest.body.items.map((e: { id: string }) => e.id)).toEqual([eventId, cheap.id]);

    const priceAsc = await http()
      .get('/api/v1/events')
      .query({ q: prefix, category: 'MUSIC', sort: 'price_asc', pageSize: 1 })
      .expect(200);
    expect(priceAsc.body.pagination.total).toBe(2);
    expect(priceAsc.body.items[0].id).toBe(cheap.id);

    const priceDesc = await http()
      .get('/api/v1/events')
      .query({ q: prefix, sort: 'price_desc' })
      .expect(200);
    expect(priceDesc.body.items.map((e: { id: string }) => e.id)).toEqual([eventId, cheap.id]);

    const combined = await http()
      .get('/api/v1/events')
      .query({ q: prefix, city: 'Đà Nẵng', minPrice: 400000, maxPrice: 600000 })
      .expect(200);
    expect(combined.body.items.map((e: { id: string }) => e.id)).toEqual([eventId]);

    await http().get('/api/v1/events').query({ minPrice: 20, maxPrice: 10 }).expect(400);
    await http()
      .get('/api/v1/events')
      .query({
        from: new Date(Date.now() + 20 * 86400000).toISOString(),
        to: new Date(Date.now() + 5 * 86400000).toISOString(),
      })
      .expect(400);
    await http().get('/api/v1/events').query({ sort: 'invalid_sort' }).expect(400);

    for (const q of ["%' OR TRUE --", `${prefix}%`, `${prefix}_`]) {
      const literal = await http().get('/api/v1/events').query({ q }).expect(200);
      expect(literal.body.items).toEqual([]);
    }
  });
  it('serves published details/inventory without user or hold identities', async () => {
    const detail = await http().get(`/api/v1/events/${slug}`).expect(200);
    expect(detail.body.availableSeats).toBe(199);
    const snapshot = await http().get(`/api/v1/events/${eventId}/seats`).expect(200);
    expect(snapshot.body.seats).toHaveLength(200);
    expect(JSON.stringify(snapshot.body)).not.toContain('userId');
    expect(JSON.stringify(snapshot.body)).not.toContain('holdId');
    await http().get(`/api/v1/events/${eventId}/inventory`).expect(200);
  });
  it('reports expired held seats as available without releasing sold seats', async () => {
    const seat = await db.seat.findFirstOrThrow({ where: { eventId, status: 'AVAILABLE' } });
    const hold = await db.seatHold.create({
      data: { eventId, userId: users.get('CUSTOMER')!, expiresAt: new Date(Date.now() - 1000) },
    });
    await db.seat.update({ where: { id: seat.id }, data: { status: 'HELD', holdId: hold.id } });
    const snapshot = await http().get(`/api/v1/events/${eventId}/seats`).expect(200);
    expect(snapshot.body.seats.find((s: { id: string }) => s.id === seat.id).status).toBe(
      'AVAILABLE',
    );
    await db.seat.update({ where: { id: seat.id }, data: { status: 'AVAILABLE', holdId: null } });
  });
  it('protects sold seats and historical orders even in a draft fixture', async () => {
    const seat = await db.seat.findFirstOrThrow({ where: { eventId, status: 'AVAILABLE' } });
    soldId = seat.id;
    const hold = await db.seatHold.create({
      data: { eventId, userId: users.get('CUSTOMER')!, expiresAt: new Date(Date.now() + 300000) },
    });
    const order = await db.order.create({
      data: {
        eventId,
        userId: users.get('CUSTOMER')!,
        holdId: hold.id,
        idempotencyKey: prefix,
        status: 'PAID',
        paidAt: new Date(),
        expiresAt: hold.expiresAt,
        totalVnd: 1200000,
      },
    });
    const item = await db.orderItem.create({
      data: { eventId, orderId: order.id, seatId: seat.id, priceVnd: 1200000 },
    });
    await db.ticket.create({
      data: {
        eventId,
        seatId: seat.id,
        orderItemId: item.id,
        code: prefix,
        qrTokenHash: createHash('sha256').update(prefix).digest('hex'),
      },
    });
    await db.seat.update({ where: { id: seat.id }, data: { status: 'SOLD' } });
    await db.event.update({ where: { id: eventId }, data: { status: 'DRAFT' } });
    await http()
      .post(`/api/v1/organizer/events/${eventId}/seat-map`)
      .set('Authorization', bearer())
      .send(grid)
      .expect(409);
    await http()
      .patch(`/api/v1/organizer/events/${eventId}/seats/${seat.id}`)
      .set('Authorization', bearer())
      .send({ enabled: false })
      .expect(409);
    await http()
      .delete(`/api/v1/organizer/events/${eventId}`)
      .set('Authorization', bearer())
      .expect(409);
    expect((await db.seat.findUniqueOrThrow({ where: { id: soldId } })).status).toBe('SOLD');
  });
  it('aggregates only the organizer own successful orders', async () => {
    const overview = await http()
      .get('/api/v1/organizer/dashboard')
      .set('Authorization', bearer())
      .expect(200);
    expect(overview.body.revenueVnd).toBe(1200000);
    expect(overview.body.soldSeats).toBe(1);
    const other = await http()
      .get('/api/v1/organizer/dashboard')
      .set('Authorization', bearer('OTHER'))
      .expect(200);
    expect(other.body.totalEvents).toBe(0);
    expect(other.body.revenueVnd).toBe(0);
  });
  it('deletes only unused drafts while retaining an audit tombstone', async () => {
    const event = await events.create(users.get('ORGANIZER')!, {
      ...body(),
      title: `${prefix} Disposable`,
    });
    await http()
      .delete(`/api/v1/organizer/events/${event.id}`)
      .set('Authorization', bearer())
      .expect(204);
    expect(await db.event.findUnique({ where: { id: event.id } })).toBeNull();
    expect(
      await db.auditLog.count({ where: { entityId: event.id, action: 'EVENT_DRAFT_DELETED' } }),
    ).toBe(1);
  });
  it('serializes grid generation with submission', async () => {
    const event = await events.create(users.get('ORGANIZER')!, {
      ...body(),
      title: `${prefix} Race`,
    });
    await seats.generate(event.id, users.get('ORGANIZER')!, grid);
    const results = await Promise.allSettled([
      seats.generate(event.id, users.get('ORGANIZER')!, {
        sections: [{ name: 'New', ticketName: 'New', priceVnd: 10000, rows: 2, columns: 3 }],
      }),
      review.submit(event.id, users.get('ORGANIZER')!),
    ]);
    expect(results[1]?.status).toBe('fulfilled');
    expect((await db.event.findUniqueOrThrow({ where: { id: event.id } })).status).toBe(
      'PENDING_APPROVAL',
    );
    expect(await db.seat.count({ where: { eventId: event.id } })).toBe(
      results[0]?.status === 'fulfilled' ? 6 : 200,
    );
  });
  it('persists a visual layout, enforces ownership/revision and sells seats at zone prices', async () => {
    const draft = await events.create(users.get('ORGANIZER')!, {
      ...body(),
      title: 'Visual venue fixture',
    });
    const path = `/api/v1/organizer/events/${draft.id}/seat-map/design`;
    const input = {
      version: 1,
      expectedRevision: 0,
      width: 2400,
      height: 1800,
      stage: { x: 900, y: 80, width: 600, height: 160 },
      zones: [
        { id: 'vip', name: 'VIP', priceVnd: 1200000, color: '#7c3aed' },
        { id: 'standard', name: 'Standard', priceVnd: 499000, color: '#0284c7' },
      ],
      blocks: [
        {
          id: 'left',
          zoneId: 'vip',
          x: 200,
          y: 400,
          rotation: 15,
          rows: 2,
          columns: 5,
          disabledSeats: [0],
        },
        {
          id: 'right',
          zoneId: 'standard',
          x: 1000,
          y: 500,
          rotation: -15,
          rows: 1,
          columns: 8,
          disabledSeats: [],
        },
      ],
    };
    await http().post(path).send(input).expect(401);
    await http().post(path).set('Authorization', bearer('CUSTOMER')).send(input).expect(403);
    await http().post(path).set('Authorization', bearer('OTHER')).send(input).expect(403);
    let saved = await http().post(path).set('Authorization', bearer()).send(input).expect(200);
    expect(saved.body.availableSeats).toBe(17);
    expect(saved.body.seatMapLayout.blocks[0].rowLabels).toEqual(['A', 'B']);
    expect(saved.body.seatMapLayout.blocks[1].rowLabels).toEqual(['C']);
    const sections = saved.body.sections as { id: string; name: string; availableSeats: number }[];
    expect(saved.body.seatMapLayout.zones.find((z: { name: string }) => z.name === 'VIP').id).toBe(
      sections.find((z) => z.name === 'VIP')!.id,
    );
    const read = await http()
      .get(`/api/v1/organizer/events/${draft.id}`)
      .set('Authorization', bearer())
      .expect(200);
    expect(read.body.seatMapLayout).toEqual(saved.body.seatMapLayout);
    let original = await db.seat.findMany({
      where: { eventId: draft.id },
      orderBy: { code: 'asc' },
    });
    expect(original).toHaveLength(18);
    expect(original.find((s) => s.code === 'A01')!.status).toBe('UNAVAILABLE');
    await http().post(path).set('Authorization', bearer()).send(input).expect(409);
    for (const invalid of [
      { ...input, blocks: [{ ...input.blocks[0], zoneId: 'missing' }, input.blocks[1]] },
      { ...input, blocks: [input.blocks[0], { ...input.blocks[1], x: 200, y: 400 }] },
      { ...input, blocks: [{ ...input.blocks[0], disabledSeats: [1000] }, input.blocks[1]] },
      { ...input, blocks: [{ ...input.blocks[0], rows: 0 }, input.blocks[1]] },
      { ...input, stage: { ...input.stage, width: 9000 } },
    ])
      await http()
        .post(path)
        .set('Authorization', bearer())
        .send({ ...invalid, expectedRevision: 1 })
        .expect(400);
    expect(
      await db.seat.findMany({ where: { eventId: draft.id }, orderBy: { code: 'asc' } }),
    ).toEqual(original);
    const competitors = await Promise.all(
      [0, 1].map(() =>
        http()
          .post(path)
          .set('Authorization', bearer())
          .send({ ...input, expectedRevision: 1 }),
      ),
    );
    expect(competitors.map((r) => r.status).sort()).toEqual([200, 409]);
    saved = competitors.find((r) => r.status === 200)!;
    original = await db.seat.findMany({ where: { eventId: draft.id }, orderBy: { code: 'asc' } });
    expect(original).toHaveLength(18);
    await review.submit(draft.id, users.get('ORGANIZER')!);
    await http()
      .post(path)
      .set('Authorization', bearer())
      .send({ ...input, expectedRevision: 1 })
      .expect(409);
    await review.decide(draft.id, users.get('ADMIN')!, true);
    const detail = await http().get(`/api/v1/events/${draft.slug}`).expect(200);
    expect(detail.body.seatMapLayout).toEqual(saved.body.seatMapLayout);
    const booking = await http()
      .get(`/api/v1/events/${draft.id}/booking-state`)
      .set('Authorization', bearer('CUSTOMER'))
      .expect(200);
    expect(booking.body.seats.find((s: { code: string }) => s.code === 'A02').priceVnd).toBe(
      1200000,
    );
    expect(booking.body.seats.find((s: { code: string }) => s.code === 'C01').priceVnd).toBe(
      499000,
    );
    await http()
      .post(`/api/v1/events/${draft.id}/holds`)
      .set('Authorization', bearer('CUSTOMER'))
      .send({ seatIds: [original.find((s) => s.code === 'A01')!.id], idempotencyKey: randomUUID() })
      .expect(409);
    const hold = await http()
      .post(`/api/v1/events/${draft.id}/holds`)
      .set('Authorization', bearer('CUSTOMER'))
      .send({
        seatIds: [
          original.find((s) => s.code === 'A02')!.id,
          original.find((s) => s.code === 'C01')!.id,
        ],
        idempotencyKey: randomUUID(),
      })
      .expect(201);
    const order = await http()
      .post('/api/v1/orders')
      .set('Authorization', bearer('CUSTOMER'))
      .send({ holdId: hold.body.id, idempotencyKey: randomUUID() })
      .expect(201);
    expect(order.body.totalVnd).toBe(1699000);
    await db.event.update({ where: { id: draft.id }, data: { status: 'DRAFT' } });
    const current = await db.event.findUniqueOrThrow({ where: { id: draft.id } });
    await http()
      .post(path)
      .set('Authorization', bearer())
      .send({ ...input, expectedRevision: current.inventoryRevision })
      .expect(409);
    expect(await db.seat.count({ where: { eventId: draft.id } })).toBe(18);
  });
  it('documents DTO fields and event paths in Swagger', async () => {
    const swagger = await http().get('/api/docs-json').expect(200);
    expect(swagger.body.paths['/api/v1/organizer/events']).toBeDefined();
    expect(swagger.body.paths['/api/v1/events/filters']).toBeDefined();
    expect(swagger.body.components.schemas.CreateEventDto.properties.organizationId).toBeDefined();
  });
  const duplicateDates = () => {
    const date = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();
    return { startsAt: date(60), endsAt: date(61), salesStartAt: date(40), salesEndAt: date(59) };
  };
  const duplicateEvent = (id: string, role = 'ORGANIZER') =>
    http().post(`/api/v1/organizer/events/${id}/duplicate`).set('Authorization', bearer(role));

  it('duplicates the saved layout and inventory into an independent unpublished draft', async () => {
    const organizer = users.get('ORGANIZER')!;
    const source = await events.create(organizer, body());
    await seats.saveDesign(source.id, organizer, {
      version: 1,
      expectedRevision: 0,
      width: 1200,
      height: 900,
      stage: { x: 300, y: 100, width: 600, height: 100 },
      zones: [{ id: 'vip', name: 'VIP', priceVnd: 850000, color: '#7c3aed' }],
      blocks: [
        {
          id: 'left',
          zoneId: 'vip',
          x: 200,
          y: 400,
          rotation: 15,
          rows: 1,
          columns: 3,
          disabledSeats: [0],
        },
      ],
    });
    await review.submit(source.id, organizer);
    await review.decide(source.id, users.get('ADMIN')!, true);
    await db.eventStaffAssignment.create({
      data: { eventId: source.id, userId: users.get('STAFF')! },
    });
    const reservableSeat = await db.seat.findUniqueOrThrow({
      where: { eventId_code: { eventId: source.id, code: 'A03' } },
    });
    const hold = await http()
      .post(`/api/v1/events/${source.id}/holds`)
      .set('Authorization', bearer('CUSTOMER'))
      .send({ seatIds: [reservableSeat.id], idempotencyKey: randomUUID() })
      .expect(201);
    await http()
      .post('/api/v1/orders')
      .set('Authorization', bearer('CUSTOMER'))
      .send({ holdId: hold.body.id, idempotencyKey: randomUUID() })
      .expect(201);
    await db.seat.updateMany({
      where: { eventId: source.id, code: 'A02' },
      data: { status: 'SOLD' },
    });
    const sourceSnapshot = () =>
      db.event.findUniqueOrThrow({
        where: { id: source.id },
        include: {
          seats: { orderBy: { code: 'asc' } },
          assignments: true,
          _count: { select: { orders: true, holds: true } },
        },
      });
    const before = await sourceSnapshot();
    const dates = duplicateDates();
    const { body: copied } = await duplicateEvent(source.id).send(dates).expect(201);
    expect(copied).toMatchObject({
      ...dates,
      title: `${source.title} (bản sao)`,
      slug: `${source.slug}-copy-1`,
      status: 'DRAFT',
      description: source.description,
      organization: source.organization,
      rejectionReason: null,
      inventoryRevision: 0,
      availableSeats: 3,
    });
    expect(copied.id).not.toBe(source.id);
    expect(copied.venue).toMatchObject({
      name: source.venue.name,
      address: source.venue.address,
      city: source.venue.city,
    });
    expect(copied.venue.id).not.toBe(source.venue.id);
    const [section] = copied.sections;
    expect(section).toMatchObject({
      name: 'VIP',
      ticketType: { name: 'VIP', priceVnd: 850000 },
      soldSeats: 0,
      availableSeats: 3,
    });
    expect(copied.seatMapLayout.zones[0]).toMatchObject({ id: section.id, name: 'VIP' });
    expect(copied.seatMapLayout.blocks[0]).toMatchObject({
      zoneId: section.id,
      rotation: 15,
      rowLabels: ['A'],
      disabledSeats: [],
    });
    const copySeats = await db.seat.findMany({
      where: { eventId: copied.id },
      orderBy: { code: 'asc' },
    });
    expect(copySeats.map((s) => s.code)).toEqual(before.seats.map((s) => s.code));
    for (const seat of copySeats) {
      expect(before.seats.some((s) => s.id === seat.id || s.sectionId === seat.sectionId)).toBe(
        false,
      );
      expect(seat).toMatchObject({ sectionId: section.id, status: 'AVAILABLE', holdId: null });
    }
    const copiedCounts = await db.event.findUniqueOrThrow({
      where: { id: copied.id },
      select: {
        _count: { select: { orders: true, holds: true, reviews: true, assignments: true } },
      },
    });
    expect(copiedCounts._count).toEqual({ orders: 0, holds: 0, reviews: 0, assignments: 0 });
    await http().get(`/api/v1/events/${copied.slug}`).expect(404);
    expect(await sourceSnapshot()).toEqual(before);
  });

  it('requires organization membership and a valid new schedule to duplicate an event', async () => {
    const source = await events.create(users.get('ORGANIZER')!, body());
    const dates = duplicateDates();
    await http().post(`/api/v1/organizer/events/${source.id}/duplicate`).send(dates).expect(401);
    await duplicateEvent(source.id, 'OTHER').send(dates).expect(403);
    await duplicateEvent(source.id, 'ADMIN').send(dates).expect(403);
    await duplicateEvent(source.id).send({}).expect(400);
    await duplicateEvent(source.id)
      .send({ ...dates, endsAt: dates.startsAt })
      .expect(400);
    expect(await db.event.count({ where: { slug: { startsWith: `${source.slug}-copy-` } } })).toBe(
      0,
    );
  });

  it('skips occupied slugs and allocates distinct slugs for concurrent copies', async () => {
    const source = await events.create(users.get('ORGANIZER')!, body());
    const other = await events.create(users.get('OTHER')!, { ...body(), organizationId: orgs[1]! });
    await db.event.update({ where: { id: other.id }, data: { slug: `${source.slug}-copy-1` } });
    const results = await Promise.all(
      [1, 2].map(() => duplicateEvent(source.id).send(duplicateDates()).expect(201)),
    );
    expect(results.map((r) => r.body.slug).sort()).toEqual([
      `${source.slug}-copy-2`,
      `${source.slug}-copy-3`,
    ]);
    expect(results.every((r) => r.body.status === 'DRAFT' && r.body.seatMapLayout === null)).toBe(
      true,
    );
  });
  it('streams only paid active tickets to event members and admins', async () => {
    const event = await events.create(users.get('ORGANIZER')!, body());
    await seats.generate(event.id, users.get('ORGANIZER')!, grid);
    const buyer = await db.user.create({
      data: { email: `${prefix}-buyer@events.local`, name: 'Nguyễn, "An"\nPhạm' },
    });
    users.set('CSV_BUYER', buyer.id);
    const eventSeats = await db.seat.findMany({
      where: { eventId: event.id, section: { name: 'VIP' } },
      orderBy: { code: 'asc' },
      take: 5,
    });
    const paidAt = new Date('2026-11-24T08:00:00Z');
    const checkedAt = new Date('2026-11-24T09:00:00Z');
    for (const [index, seat] of eventSeats.entries()) {
      const paid = index !== 2;
      const hold = await db.seatHold.create({
        data: { eventId: event.id, userId: buyer.id, expiresAt: paidAt },
      });
      const order = await db.order.create({
        data: {
          eventId: event.id,
          userId: buyer.id,
          holdId: hold.id,
          idempotencyKey: `${prefix}-csv-${index}`,
          status: paid ? 'PAID' : 'PENDING_PAYMENT',
          paidAt: paid ? paidAt : null,
          expiresAt: hold.expiresAt,
          totalVnd: 1200000,
        },
      });
      const item = await db.orderItem.create({
        data: { eventId: event.id, orderId: order.id, seatId: seat.id, priceVnd: 1200000 },
      });
      if (index === 4) continue;
      const code = `${prefix}-csv-${index}`;
      await db.ticket.create({
        data: {
          eventId: event.id,
          seatId: seat.id,
          orderItemId: item.id,
          code,
          qrTokenHash: createHash('sha256').update(code).digest('hex'),
          status: index === 0 ? 'USED' : index === 3 ? 'CANCELLED' : 'VALID',
          ...(index === 0
            ? { checkIn: { create: { staffId: users.get('STAFF')!, createdAt: checkedAt } } }
            : {}),
        },
      });
    }

    const path = `/api/v1/organizer/events/${event.id}/attendees.csv`;
    await http().get(path).expect(401);
    for (const role of ['OTHER', 'CUSTOMER', 'STAFF'])
      await http().get(path).set('Authorization', bearer(role)).expect(403);
    const owner = await http()
      .get(path)
      .set('Authorization', bearer())
      .expect(200)
      .expect('Content-Type', 'text/csv; charset=utf-8')
      .expect('Content-Disposition', `attachment; filename="${event.slug}-attendees.csv"`)
      .expect('Cache-Control', 'private, no-store');
    expect(owner.text.startsWith('\uFEFF"Ticket code","Ticket type"')).toBe(true);
    expect(owner.text).toContain(
      `"${prefix}-csv-0","VIP","VIP","${eventSeats[0]!.code}","Nguyễn, ""An""\nPhạm","${buyer.email}","${paidAt.toISOString()}","CHECKED_IN","${checkedAt.toISOString()}"`,
    );
    expect(owner.text).toContain(`"${prefix}-csv-1"`);
    expect(owner.text).toContain('"NOT_CHECKED_IN",""');
    for (const index of [2, 3, 4]) expect(owner.text).not.toContain(`${prefix}-csv-${index}`);
    expect(owner.text).not.toContain(createHash('sha256').update(`${prefix}-csv-0`).digest('hex'));
    const admin = await http().get(path).set('Authorization', bearer('ADMIN')).expect(200);
    expect(admin.text).toBe(owner.text);
  });
});
