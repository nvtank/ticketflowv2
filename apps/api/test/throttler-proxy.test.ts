import 'reflect-metadata';
import { createRequire } from 'node:module';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type * as ApplicationModule from '../src/app.module';
import type * as BootstrapModule from '../src/bootstrap';
import type * as EnvironmentModule from '../src/config/environment';

const require = createRequire(import.meta.url);
const { AppModule } = require('../dist/app.module.js') as typeof ApplicationModule;
const { configureApplication } = require('../dist/bootstrap.js') as typeof BootstrapModule;
const { parseEnvironment } = require('../dist/config/environment.js') as typeof EnvironmentModule;

describe('Trusted proxy rate limiting & anti-spoofing (TF2-059)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication({ logger: false });
    configureApplication(app, parseEnvironment(process.env));
    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('allocates independent throttle budgets to distinct client IPs behind trusted proxy', async () => {
    const clientA = '198.51.100.10';
    const clientB = '198.51.100.20';

    // Client A sends 120 requests to fill its budget
    for (let i = 0; i < 120; i++) {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health/live')
        .set('X-Forwarded-For', clientA);
      expect(res.status).toBe(200);
    }

    // 121st request from Client A is throttled with HTTP 429
    const limitedA = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .set('X-Forwarded-For', clientA);
    expect(limitedA.status).toBe(429);
    expect(limitedA.body.code).toBe('HTTP_429');

    // Client B has NOT exhausted its budget and still receives HTTP 200
    const resB = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .set('X-Forwarded-For', clientB);
    expect(resB.status).toBe(200);
  });

  it('prevents rate-limit evasion via prepended spoofed IPs in X-Forwarded-For chain', async () => {
    const realClientIp = '198.51.100.99';

    // Send 120 requests where the attacker tries prepending random fake IPs
    // In a real proxy setup (Caddy/Vercel), the proxy appends the real remote IP at the end
    for (let i = 0; i < 120; i++) {
      const spoofedChain = `1.2.3.${i}, 10.0.0.1, ${realClientIp}`;
      const res = await request(app.getHttpServer())
        .get('/api/v1/health/live')
        .set('X-Forwarded-For', spoofedChain);
      expect(res.status).toBe(200);
    }

    // 121st attempt: Attacker tries changing the prepended IP to '8.8.8.8'
    // Express stops at the rightmost untrusted IP (realClientIp) and must throttle it
    const evasionAttempt = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .set('X-Forwarded-For', `8.8.8.8, ${realClientIp}`);

    expect(evasionAttempt.status).toBe(429);
    expect(evasionAttempt.body.code).toBe('HTTP_429');
  });

  it('respects Cloudflare CF-Connecting-IP header when connection is from trusted loopback hop', async () => {
    const cfClient = '203.0.113.77';

    // Send requests with CF-Connecting-IP
    for (let i = 0; i < 120; i++) {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health/live')
        .set('CF-Connecting-IP', cfClient);
      expect(res.status).toBe(200);
    }

    const limitedCf = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .set('CF-Connecting-IP', cfClient);

    expect(limitedCf.status).toBe(429);
  });

  it('enforces tight rate limits on authentication endpoints (5/min on login)', async () => {
    const authClient = '198.51.100.88';

    // Login limit is 5 per minute
    for (let i = 0; i < 5; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', authClient)
        .send({ email: 'nonexistent@example.com', password: 'WrongPassword123!' });
      // Can be 401 Unauthorized or 400 Bad Request, but NOT 429
      expect(res.status).not.toBe(429);
    }

    // 6th attempt from the same client IP must be throttled with 429
    const limitedAuth = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', authClient)
      .send({ email: 'nonexistent@example.com', password: 'WrongPassword123!' });

    expect(limitedAuth.status).toBe(429);
    expect(limitedAuth.body.code).toBe('HTTP_429');
  });
});
