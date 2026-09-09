import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '../apps/api/src/app';
import { createApplication } from '../apps/api/src/app';
import { Database } from '../apps/api/src/database';
import { Cache } from '../apps/api/src/health';
import { parseEnvironment } from '../apps/api/src/config';

let app: INestApplication;
let base: string;

beforeAll(async () => {
  const environment = parseEnvironment({
    NODE_ENV: 'test',
    DATABASE_URL:
      process.env.TEST_DATABASE_URL ??
      'postgresql://tf2_test:isolated_test_password@127.0.0.1:55442/tf2_test',
    REDIS_URL: 'redis://127.0.0.1:56392',
    WEB_ORIGIN: 'http://localhost:3000',
    JWT_SECRET: 'isolated_test_secret_for_local_runs_only',
  });
  app = await createApplication(environment);
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
});

afterAll(async () => {
  await app?.close();
});

describe('actual HTTP and dependency readiness', () => {
  it('serves liveness and private-database readiness with security headers', async () => {
    const live = await fetch(`${base}/api/v1/health/live`);
    expect(live.status).toBe(200);
    expect(live.headers.get('x-content-type-options')).toBe('nosniff');
    expect(await live.json()).toEqual({ status: 'ok' });
    expect((await fetch(`${base}/api/v1/health/ready`)).status).toBe(200);
    expect(await app.get(Database).$queryRaw`SELECT 1 AS value`).toEqual([{ value: 1 }]);
  });
  it('returns 503 when a dependency is unavailable while liveness stays healthy', async () => {
    app.get(Cache).client.disconnect();
    expect((await fetch(`${base}/api/v1/health/ready`)).status).toBe(503);
    expect((await fetch(`${base}/api/v1/health/live`)).status).toBe(200);
  });
});
