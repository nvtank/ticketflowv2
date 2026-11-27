import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bookingFixture } from './booking-fixture';

describe('Event favorites with real PostgreSQL', () => {
  const path = '/api/v1/me/favorites';
  let f: Awaited<ReturnType<typeof bookingFixture>>;

  beforeAll(async () => {
    f = await bookingFixture(2);
  });
  afterAll(async () => {
    await f?.close();
  });

  it('requires authentication on all favorites routes', async () => {
    const url = `${path}/${randomUUID()}`;
    await f.http().get(path).expect(401);
    await f.http().put(url).expect(401);
    await f.http().delete(url).expect(401);
  });

  it('adds and removes idempotently and keeps each user’s favorite state private', async () => {
    const event = await f.event(1);
    const favoriteUrl = `${path}/${event.id}`;
    const detailUrl = `/api/v1/events/${event.slug}`;
    const original = await f.http().get(detailUrl).set(f.headers()).expect(200);
    expect(original.body.isFavorite).toBe(false);
    const additions = await Promise.all(
      Array.from({ length: 5 }, () => f.http().put(favoriteUrl).set(f.headers()).expect(200)),
    );
    expect(additions.map(({ body }) => body)).toEqual(
      Array(5).fill({ eventId: event.id, isFavorite: true }),
    );
    expect(await f.db.favoriteEvent.count({ where: { eventId: event.id } })).toBe(1);
    const list = await f.http().get(path).set(f.headers()).expect(200);
    expect(list.body.items).toMatchObject([{ event: { id: event.id, slug: event.slug } }]);
    expect(list.body.pagination.total).toBe(1);
    const mine = await f.http().get(detailUrl).set(f.headers()).expect(200);
    expect(mine.body.isFavorite).toBe(true);
    expect(mine.headers['cache-control']).toBe('private, no-store');
    const theirs = await f.http().get(detailUrl).set(f.headers(1)).expect(200);
    expect(theirs.body.isFavorite).toBe(false);
    const anonymous = await f.http().get(detailUrl).expect(200);
    expect(anonymous.body).not.toHaveProperty('isFavorite');
    const expired = await f
      .http()
      .get(detailUrl)
      .set('Authorization', 'Bearer invalid')
      .expect(200);
    expect(expired.body).not.toHaveProperty('isFavorite');
    const otherList = await f.http().get(path).set(f.headers(1)).expect(200);
    expect(otherList.body.items).toEqual([]);
    await f.http().delete(favoriteUrl).set(f.headers(1)).expect(200);
    expect(await f.db.favoriteEvent.count({ where: { eventId: event.id } })).toBe(1);
    for (let attempt = 0; attempt < 2; attempt++)
      await f
        .http()
        .delete(favoriteUrl)
        .set(f.headers())
        .expect(200, { eventId: event.id, isFavorite: false });
    const empty = await f.http().get(path).set(f.headers()).expect(200);
    expect(empty.body.items).toEqual([]);
  });

  it('paginates published favorites and rejects adds for nonpublic events', async () => {
    const first = await f.event(1);
    const second = await f.event(1);
    const hidden = await f.event(1);
    const completed = await f.event(1);
    const add = (id: string) => f.http().put(`${path}/${id}`).set(f.headers());

    await add(first.id).expect(200);
    await add(second.id).expect(200);
    await add(hidden.id).expect(200);
    await f.db.event.update({ where: { id: hidden.id }, data: { status: 'CANCELLED' } });
    await f.db.event.update({ where: { id: completed.id }, data: { status: 'COMPLETED' } });
    await add(hidden.id).expect(404);
    await add(randomUUID()).expect(404);
    await add(completed.id).expect(200);
    const pages = await Promise.all(
      [1, 2, 3].map((page) =>
        f.http().get(`${path}?page=${page}&pageSize=1`).set(f.headers()).expect(200),
      ),
    );
    expect(
      pages
        .flatMap(({ body }) => body.items.map((item: { event: { id: string } }) => item.event.id))
        .sort(),
    ).toEqual([first.id, second.id].sort());
    expect(pages.map(({ body }) => body.pagination)).toEqual(
      [1, 2, 3].map((page) => ({ page, pageSize: 1, total: 2, totalPages: 2 })),
    );
    await f.http().delete(`${path}/${hidden.id}`).set(f.headers()).expect(200);
    expect(await f.db.favoriteEvent.count({ where: { eventId: hidden.id } })).toBe(0);
  });
});
