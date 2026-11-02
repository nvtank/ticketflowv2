import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApplication, type INestApplication } from '../apps/api/src/app';
import { parseEnvironment } from '../apps/api/src/config';
import { Database } from '../apps/api/src/database';

let app: INestApplication;
let base: string;
let db: Database;
const actors: Record<string, { id: string; token: string }> = {};
const orgs: string[] = [];
const eventIds: string[] = [];
const prefix = randomUUID();
let eventId: string;
const draft = {
  title: `Workshop ${prefix}`,
  description: 'Synthetic integration test event, no real stakeholder claim.',
  venue: 'Synthetic hall',
  startsAt: new Date(Date.now() + 86400000).toISOString(),
  endsAt: new Date(Date.now() + 90000000).toISOString(),
};

async function request(path: string, method = 'GET', actor?: string, body?: unknown) {
  return fetch(`${base}/api/v1${path}`, {
    method,
    headers: {
      Origin: 'http://localhost:3000',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(actor ? { Authorization: `Bearer ${actors[actor]!.token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

beforeAll(async () => {
  const url =
    process.env.TEST_DATABASE_URL ??
    'postgresql://tf2_test:isolated_test_password@127.0.0.1:55442/tf2_test';
  const parsed = new URL(url);
  if (!['127.0.0.1', 'localhost'].includes(parsed.hostname) || !parsed.pathname.endsWith('_test'))
    throw new Error('Refusing writes outside isolated test database');
  app = await createApplication(
    parseEnvironment({
      NODE_ENV: 'test',
      DATABASE_URL: url,
      REDIS_URL: 'redis://127.0.0.1:56392',
      WEB_ORIGIN: 'http://localhost:3000',
      JWT_SECRET: 'isolated_test_secret_for_local_runs_only',
    }),
  );
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
  db = app.get(Database);
  for (const [key, role] of [
    ['organizer', 'ORGANIZER'],
    ['other', 'ORGANIZER'],
    ['admin', 'ADMIN'],
    ['customer', 'CUSTOMER'],
    ['staff', 'STAFF'],
  ] as const) {
    const response = await request('/auth/register', 'POST', undefined, {
      email: `${prefix}-${key}@example.invalid`,
      name: `Synthetic ${key}`,
      password: 'isolated-password-for-testing',
    });
    expect(response.status).toBe(201);
    const body = await response.json();
    actors[key] = { id: body.user.id, token: body.accessToken };
    await db.user.update({ where: { id: body.user.id }, data: { role } });
  }
  for (const key of ['organizer', 'other']) {
    const organization = await db.organization.create({
      data: {
        name: `Synthetic ${key}`,
        memberships: { create: { userId: actors[key]!.id, role: 'ORGANIZER' } },
      },
    });
    orgs.push(organization.id);
  }
});

afterAll(async () => {
  if (db) {
    await db.auditLog.deleteMany({ where: { entityId: { in: eventIds } } });
    await db.organization.deleteMany({ where: { id: { in: orgs } } });
    await db.user.deleteMany({
      where: { id: { in: Object.values(actors).map((actor) => actor.id) } },
    });
  }
  await app?.close();
});

describe('event lifecycle on actual HTTP and PostgreSQL', () => {
  it('requires organizer role and own membership, rejects client publication', async () => {
    const path = `/organizations/${orgs[0]}/events`;
    expect((await request(path, 'POST', undefined, draft)).status).toBe(401);
    for (const actor of ['customer', 'staff', 'admin', 'other'])
      expect((await request(path, 'POST', actor, draft)).status).toBe(403);
    expect(
      (await request(path, 'POST', 'organizer', { ...draft, status: 'PUBLISHED' })).status,
    ).toBe(400);
    const response = await request(path, 'POST', 'organizer', draft);
    expect(response.status).toBe(201);
    const event = await response.json();
    eventId = event.id;
    eventIds.push(eventId);
    expect(event.status).toBe('DRAFT');
    expect((await request(`/events/${eventId}`)).status).toBe(404);
    expect(await (await request(`/events?q=${prefix}`)).json()).toEqual([]);
    expect(
      (await request(`/organizations/${orgs[1]}/events/${eventId}`, 'PATCH', 'other', draft))
        .status,
    ).toBe(404);
  });
  it('locks submitted events and requires ADMIN review', async () => {
    const path = `/organizations/${orgs[0]}/events/${eventId}`;
    expect(
      (await request(path, 'PATCH', 'organizer', { ...draft, venue: 'Updated synthetic hall' }))
        .status,
    ).toBe(200);
    expect((await request(`${path}/submit`, 'POST', 'organizer')).status).toBe(201);
    expect((await request(`${path}/submit`, 'POST', 'organizer')).status).toBe(409);
    expect((await request(path, 'PATCH', 'organizer', draft)).status).toBe(409);
    expect((await request(path, 'DELETE', 'organizer')).status).toBe(409);
    for (const actor of ['organizer', 'customer', 'staff'])
      expect(
        (await request(`/admin/events/${eventId}/review`, 'POST', actor, { decision: 'approve' }))
          .status,
      ).toBe(403);
    expect((await request('/admin/events', 'GET', 'organizer')).status).toBe(403);
    const queue = await (await request('/admin/events', 'GET', 'admin')).json();
    expect(queue.some((event: { id: string }) => event.id === eventId)).toBe(true);
    expect((await request(`/events/${eventId}`)).status).toBe(404);
  });
  it('supports rejection, editing and resubmission; competing reviews have one winner', async () => {
    const review = `/admin/events/${eventId}/review`;
    expect((await request(review, 'POST', 'admin', { decision: 'reject' })).status).toBe(400);
    expect(
      (await request(review, 'POST', 'admin', { decision: 'reject', reason: 'Clarify venue' }))
        .status,
    ).toBe(201);
    const path = `/organizations/${orgs[0]}/events/${eventId}`;
    expect((await request(path, 'PATCH', 'organizer', draft)).status).toBe(200);
    expect((await request(`${path}/submit`, 'POST', 'organizer')).status).toBe(201);
    const results = await Promise.all([
      request(review, 'POST', 'admin', { decision: 'approve' }),
      request(review, 'POST', 'admin', { decision: 'approve' }),
    ]);
    expect(results.map((res) => res.status).sort()).toEqual([201, 409]);
    const actions = await db.auditLog.findMany({
      where: { entityId: eventId },
      orderBy: { createdAt: 'asc' },
    });
    expect(actions.filter((entry) => entry.action === 'EVENT_APPROVED')).toHaveLength(1);
    expect(actions.some((entry) => entry.action === 'EVENT_REJECTED')).toBe(true);
  });
  it('exposes only published public fields and prevents edits/deletion after publication', async () => {
    const response = await request(`/events/${eventId}`);
    expect(response.status).toBe(200);
    const event = await response.json();
    expect(event.createdById).toBeUndefined();
    expect(event.reviewReason).toBeUndefined();
    const list = await (await request(`/events?q=${prefix}`)).json();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(eventId);
    expect((await request('/events/not-a-uuid')).status).toBe(400);
    const path = `/organizations/${orgs[0]}/events/${eventId}`;
    expect((await request(path, 'PATCH', 'organizer', draft)).status).toBe(409);
    expect((await request(path, 'DELETE', 'organizer')).status).toBe(409);
    const own = await (
      await request(`/organizations/${orgs[0]}/events`, 'GET', 'organizer')
    ).json();
    expect(own.some((row: { id: string }) => row.id === eventId)).toBe(true);
  });
  it('deletes only editable own drafts with an audit record', async () => {
    const response = await request(`/organizations/${orgs[0]}/events`, 'POST', 'organizer', draft);
    const event = await response.json();
    eventIds.push(event.id);
    expect(
      (await request(`/organizations/${orgs[0]}/events/${event.id}`, 'DELETE', 'organizer')).status,
    ).toBe(200);
    expect(await db.event.findUnique({ where: { id: event.id } })).toBeNull();
    expect(
      await db.auditLog.count({ where: { entityId: event.id, action: 'EVENT_DELETED' } }),
    ).toBe(1);
  });
});
