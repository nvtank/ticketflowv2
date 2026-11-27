import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bookingFixture } from './booking-fixture';

describe('Contact messages with real PostgreSQL', () => {
  const path = '/api/v1/contact';
  let f: Awaited<ReturnType<typeof bookingFixture>>;
  let adminId: string;
  let emailPrefix: string;

  beforeAll(async () => {
    f = await bookingFixture(2);
    adminId = f.ids[0]!;
    emailPrefix = `contact-${adminId}`;
    await f.db.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } });
  });

  afterAll(async () => {
    if (f) {
      await f.db.contactMessage.deleteMany({ where: { email: { startsWith: emailPrefix } } });
      await f.close();
    }
  });

  it('stores valid submissions and silently discards honeypot submissions', async () => {
    const body = {
      name: 'Nguyễn Văn An',
      email: `${emailPrefix}@example.test`,
      topic: 'GENERAL',
      message: 'Tôi muốn hỏi về một sự kiện sắp tới.',
    };
    await f.http().post(path).send(body).expect(201, { accepted: true });
    await f
      .http()
      .post(path)
      .send({ ...body, email: `${emailPrefix}-bot@example.test`, website: 'https://spam.test' })
      .expect(201, { accepted: true });
    expect(await f.db.contactMessage.count({ where: { email: { startsWith: emailPrefix } } })).toBe(
      1,
    );
  });

  it('validates public submissions and rejects invalid input with 400', async () => {
    await f
      .http()
      .post(path)
      .send({ name: 'A', email: 'not-an-email', topic: 'OTHER', message: 'short' })
      .expect(400);
  });

  it('limits public submissions to five per IP per minute', async () => {
    const throttleFixture = await bookingFixture(0);
    try {
      const payload = {
        name: 'Test User',
        email: 'throttle@example.test',
        topic: 'BUG',
        message: 'A sufficiently long test message.',
      };
      const results = await Promise.all(
        Array.from({ length: 6 }, () => throttleFixture.http().post(path).send(payload)),
      );
      expect(results.map(({ status }) => status).sort()).toEqual([201, 201, 201, 201, 201, 429]);
      await throttleFixture.db.contactMessage.deleteMany({ where: { email: payload.email } });
    } finally {
      await throttleFixture.close();
    }
  });

  it('restricts administration, paginates records, marks handled and audits the change', async () => {
    const body = {
      name: 'Nguyễn Văn Bình',
      email: `${emailPrefix}-handled@example.test`,
      topic: 'TICKET',
      message: 'Vui lòng hỗ trợ tôi về vé đã mua.',
    };
    await f.http().post(path).send(body).expect(201);
    const message = await f.db.contactMessage.findFirstOrThrow({ where: { email: body.email } });
    const listPath = '/api/v1/admin/contact-messages?status=NEW&page=1&pageSize=10';

    await f.http().get(listPath).expect(401);
    await f.http().get(listPath).set(f.headers(1)).expect(403);
    const listed = await f.http().get(listPath).set(f.headers(0)).expect(200);
    expect(listed.body.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: message.id, status: 'NEW' })]),
    );
    expect(listed.body.pagination).toMatchObject({ page: 1, pageSize: 10 });

    const patchPath = `/api/v1/admin/contact-messages/${message.id}`;
    await f.http().patch(patchPath).expect(401);
    await f.http().patch(patchPath).set(f.headers(1)).expect(403);
    const handled = await f.http().patch(patchPath).set(f.headers(0)).expect(200);
    expect(handled.body).toMatchObject({ id: message.id, status: 'HANDLED', handledById: adminId });
    expect(handled.body.handledAt).toBeTruthy();
    expect(
      await f.db.auditLog.count({
        where: { actorId: adminId, action: 'CONTACT_MESSAGE_HANDLED', entityId: message.id },
      }),
    ).toBe(1);
    await f
      .http()
      .get('/api/v1/admin/contact-messages?status=HANDLED')
      .set(f.headers(0))
      .expect(200);
  });
});
