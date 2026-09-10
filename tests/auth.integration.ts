import { createHmac, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApplication, type INestApplication } from '../apps/api/src/app';
import { parseEnvironment } from '../apps/api/src/config';
import { Database } from '../apps/api/src/database';

let app: INestApplication;
let base: string;
let db: Database;
const prefix = randomUUID();
const email = `${prefix}@example.org`;
const password = 'private-password-at-least-twelve';
const users: string[] = [];
const organizations: string[] = [];
let accessToken: string;
let cookie: string;

async function request(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    access?: string;
    cookie?: string;
    origin?: string;
  } = {},
) {
  return fetch(`${base}/api/v1${path}`, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Origin: options.origin ?? 'http://localhost:3000',
      ...(options.access ? { Authorization: `Bearer ${options.access}` } : {}),
      ...(options.cookie ? { Cookie: options.cookie } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

const getCookie = (res: Response) => res.headers.get('set-cookie')!.split(';')[0]!;

beforeAll(async () => {
  const url =
    process.env.TEST_DATABASE_URL ??
    'postgresql://tf2_test:isolated_test_password@127.0.0.1:55442/tf2_test';
  const parsed = new URL(url);
  if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || !parsed.pathname.endsWith('_test'))
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
});

afterAll(async () => {
  if (db) {
    await db.organization.deleteMany({ where: { id: { in: organizations } } });
    await db.user.deleteMany({ where: { id: { in: users } } });
  }
  await app?.close();
});

describe('real auth/session/tenancy boundaries', () => {
  it('registers CUSTOMER only, hashes password and protects refresh cookie', async () => {
    expect(
      (
        await request('/auth/register', {
          method: 'POST',
          body: { email, name: 'Test', password, role: 'ADMIN' },
        })
      ).status,
    ).toBe(400);
    const res = await request('/auth/register', {
      method: 'POST',
      body: { email, name: 'Test', password },
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    users.push(body.user.id);
    expect(body.user.role).toBe('CUSTOMER');
    expect(body.user.passwordHash).toBeUndefined();
    expect(body.refreshToken).toBeUndefined();
    expect(res.headers.get('set-cookie')).toContain('HttpOnly');
    expect(res.headers.get('set-cookie')).toContain('SameSite=Strict');
    expect(res.headers.get('cache-control')).toBe('no-store');
    accessToken = body.accessToken;
    cookie = getCookie(res);
    const user = await db.user.findUniqueOrThrow({ where: { id: body.user.id } });
    expect(user.passwordHash).toMatch(/^scrypt:/);
    expect(user.passwordHash).not.toContain(password);
    const stored = await db.refreshToken.findFirstOrThrow({
      where: { session: { userId: user.id } },
    });
    expect(cookie).not.toContain(stored.tokenHash);
    expect(
      (
        await request('/auth/register', {
          method: 'POST',
          body: { email: email.toUpperCase(), name: 'Other', password },
        })
      ).status,
    ).toBe(409);
  });
  it('rejects forged JWT, wrong password, cross-origin session mutation and unscoped access', async () => {
    expect((await request('/auth/me', { access: 'forged.jwt.token' })).status).toBe(401);
    expect(
      (
        await request('/auth/login', {
          method: 'POST',
          body: { email, password: 'wrong-long-password' },
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await request('/auth/refresh', {
          method: 'POST',
          cookie,
          origin: 'https://attacker.example.org',
        })
      ).status,
    ).toBe(403);
    expect(
      (await request('/auth/refresh', { method: 'POST', cookie: 'tf2_refresh=unknown' })).status,
    ).toBe(401);
    expect((await request('/auth/me', { access: accessToken })).status).toBe(200);
    const original = JSON.parse(
      Buffer.from(accessToken.split('.')[1]!, 'base64url').toString(),
    ) as Record<string, unknown>;
    for (const payload of [
      { ...original, exp: 0 },
      { ...original, aud: 'other-app' },
      { ...original, iss: 'other-issuer' },
    ]) {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
        'base64url',
      );
      const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signature = createHmac('sha256', 'isolated_test_secret_for_local_runs_only')
        .update(`${header}.${encoded}`)
        .digest('base64url');
      expect(
        (await request('/auth/me', { access: `${header}.${encoded}.${signature}` })).status,
      ).toBe(401);
    }
    expect(
      (await request(`/organizations/${randomUUID()}/context`, { access: accessToken })).status,
    ).toBe(403);
  });
  it('rotates refresh, then commits session revocation on old-token replay', async () => {
    const rotated = await request('/auth/refresh', { method: 'POST', cookie });
    expect(rotated.status).toBe(201);
    const nextAccess = (await rotated.json()).accessToken;
    const nextCookie = getCookie(rotated);
    expect(nextCookie).not.toBe(cookie);
    expect((await request('/auth/refresh', { method: 'POST', cookie })).status).toBe(401);
    expect((await request('/auth/me', { access: nextAccess })).status).toBe(401);
    expect((await request('/auth/me', { access: accessToken })).status).toBe(401);
    expect((await request('/auth/refresh', { method: 'POST', cookie: nextCookie })).status).toBe(
      401,
    );
  });
  it('serializes concurrent refresh so replay cannot leave a live session', async () => {
    const login = await request('/auth/login', { method: 'POST', body: { email, password } });
    const refresh = getCookie(login);
    const results = await Promise.all([
      request('/auth/refresh', { method: 'POST', cookie: refresh }),
      request('/auth/refresh', { method: 'POST', cookie: refresh }),
    ]);
    expect(results.map((res) => res.status).sort()).toEqual([201, 401]);
    const winner = results.find((res) => res.status === 201)!;
    expect((await request('/auth/me', { access: (await winner.json()).accessToken })).status).toBe(
      401,
    );
  });
  it('checks current membership for ORGANIZER/STAFF and does not grant cross-tenant access', async () => {
    const org = await db.organization.create({ data: { name: 'Test organization' } });
    const other = await db.organization.create({ data: { name: 'Other organization' } });
    organizations.push(org.id, other.id);
    const userId = users[0]!;
    await db.user.update({ where: { id: userId }, data: { role: 'ORGANIZER' } });
    await db.membership.create({ data: { userId, organizationId: org.id, role: 'ORGANIZER' } });
    const login = await request('/auth/login', { method: 'POST', body: { email, password } });
    const access = (await login.json()).accessToken;
    expect((await request(`/organizations/${org.id}/context`, { access })).status).toBe(200);
    expect((await request(`/organizations/${other.id}/context`, { access })).status).toBe(403);
    await db.membership.update({
      where: { userId_organizationId: { userId, organizationId: org.id } },
      data: { role: 'STAFF' },
    });
    expect(
      (await (await request(`/organizations/${org.id}/context`, { access })).json()).role,
    ).toBe('STAFF');
    await db.membership.delete({
      where: { userId_organizationId: { userId, organizationId: org.id } },
    });
    expect((await request(`/organizations/${org.id}/context`, { access })).status).toBe(403);
    expect(
      (await request('/auth/logout', { method: 'POST', cookie: getCookie(login) })).status,
    ).toBe(201);
    expect((await request('/auth/me', { access })).status).toBe(401);
  });
  it('rejects expired session and disabled account; logout can revoke using bearer', async () => {
    const login = await request('/auth/login', { method: 'POST', body: { email, password } });
    const access = (await login.json()).accessToken;
    expect((await request('/auth/logout', { method: 'POST', access })).status).toBe(201);
    expect((await request('/auth/me', { access })).status).toBe(401);
    const next = await request('/auth/login', { method: 'POST', body: { email, password } });
    const token = (await next.json()).accessToken;
    await db.session.updateMany({ where: { userId: users[0]! }, data: { expiresAt: new Date(0) } });
    expect((await request('/auth/me', { access: token })).status).toBe(401);
    await db.user.update({ where: { id: users[0]! }, data: { active: false } });
    expect(
      (await request('/auth/login', { method: 'POST', body: { email, password } })).status,
    ).toBe(401);
  });
});
