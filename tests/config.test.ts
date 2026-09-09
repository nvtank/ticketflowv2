import { describe, expect, it } from 'vitest';
import { parseEnvironment } from '../apps/api/src/config';
import { registerSchema } from '../packages/shared/src';

const valid = {
  DATABASE_URL: 'postgresql://user:private-password@localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  WEB_ORIGIN: 'http://localhost:3000',
  JWT_SECRET: 'development_only_very_long_random_secret',
};

describe('environment safety', () => {
  it('rejects production mock, insecure origin and development secret without leaking values', () => {
    expect(() =>
      parseEnvironment({ ...valid, NODE_ENV: 'production', PAYMENT_PROVIDER: 'mock' }),
    ).toThrow('Invalid environment fields: WEB_ORIGIN, PAYMENT_PROVIDER, JWT_SECRET');
  });
  it('does not print sensitive connection strings in errors', () => {
    expect(() =>
      parseEnvironment({ ...valid, DATABASE_URL: 'https://user:private-password@host' }),
    ).toThrow('Invalid environment fields: DATABASE_URL');
  });
  it.each(['http://localhost:3000/path', 'http://localhost:3000/', 'file:///tmp/demo'])(
    'rejects non-origin %s',
    (WEB_ORIGIN) => {
      expect(() => parseEnvironment({ ...valid, WEB_ORIGIN })).toThrow('WEB_ORIGIN');
    },
  );
  it('accepts secure production settings with payment disabled', () => {
    expect(
      parseEnvironment({
        ...valid,
        NODE_ENV: 'production',
        WEB_ORIGIN: 'https://demo.example.org',
        JWT_SECRET: 'd3ae'.repeat(16),
      }).PAYMENT_PROVIDER,
    ).toBe('disabled');
  });
  it('rejects client-selected elevated role during registration', () => {
    expect(
      registerSchema.safeParse({
        email: 'demo@example.org',
        name: 'Demo',
        password: 'a-long-password',
        role: 'ADMIN',
      }).success,
    ).toBe(false);
  });
});
