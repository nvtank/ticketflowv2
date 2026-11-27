import type * as EnvironmentModule from '../src/config/environment';
import type * as EmailModule from '../src/notifications/order-email.transport';
import { createRequire } from 'node:module';
import { afterEach, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { parseEnvironment } = require('../dist/config/environment.js') as typeof EnvironmentModule;
const { OrderEmailTransport, orderEmailMode, orderEmailMessage } =
  require('../dist/notifications/order-email.transport.js') as typeof EmailModule;
const origin = 'https://tickets.example.test';
const orderId = '17c0aa01-efe0-4dcb-a1d3-4810caa26811';
const ticketIds = ['9a56fe25-e751-45cd-abff-2fbb6fe20dec', '55c613f8-6851-4694-a49b-8a9ad01ced00'];
const message = orderEmailMessage(
  origin,
  {
    id: orderId,
    totalVnd: 1_200_000,
    user: { email: 'buyer@example.test' },
    event: { title: 'Fixture event' },
  },
  ticketIds,
);
const production = {
  ...process.env,
  NODE_ENV: 'production',
  PAYMENT_PROVIDER: 'disabled',
  PAYMENT_RETURN_ORIGIN: origin,
  TICKET_SIGNING_KEY: 't'.repeat(48),
  RESEND_API_KEY: 'fixture-key',
  ORDER_EMAIL_FROM: 'sender@example.test',
};

afterEach(() => vi.unstubAllGlobals());

it.each(['development', 'test'])('uses the stub in %s even with live settings', async (mode) => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const env = parseEnvironment({ ...production, NODE_ENV: mode, ORDER_EMAIL_PROVIDER: 'resend' });
  expect(orderEmailMode(env)).toBe('STUB');
  expect(await new OrderEmailTransport(env).send(orderId, message)).toEqual({ status: 'STUBBED' });
  expect(fetch).not.toHaveBeenCalled();
});

it('requires production opt-in and validates the sender configuration', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const env = parseEnvironment({ ...production, ORDER_EMAIL_PROVIDER: undefined });
  expect(orderEmailMode(env)).toBeUndefined();
  expect(await new OrderEmailTransport(env).send(orderId, message)).toMatchObject({
    status: 'FAILED',
    code: 'CONFIGURATION',
  });
  expect(fetch).not.toHaveBeenCalled();
  expect(() =>
    parseEnvironment({ ...production, ORDER_EMAIL_PROVIDER: 'resend', RESEND_API_KEY: '' }),
  ).toThrow('RESEND_API_KEY');
  expect(() =>
    parseEnvironment({ ...production, ORDER_EMAIL_PROVIDER: 'resend', ORDER_EMAIL_FROM: '' }),
  ).toThrow('ORDER_EMAIL_FROM');
});

it('formats the paid receipt and links to every ticket through the authenticated route', () => {
  expect(message.subject).toContain('Xác nhận thanh toán');
  expect(message.text).toContain('1.200.000');
  expect(message.text).toContain(orderId);
  expect(message.text).toContain('Fixture event');
  expect(message.text.match(/https:\/\/[^\s]+/g)).toEqual(
    ticketIds.map((id) => `${origin}/my-tickets/${id}`),
  );
  expect(Object.keys(message).sort()).toEqual(['subject', 'text', 'to']);
});

it('uses a stable idempotency key and keeps provider response details out of its results', async () => {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockRejectedValueOnce(new Error('private network error'))
    .mockResolvedValueOnce(new Response('private provider response', { status: 429 }))
    .mockResolvedValueOnce(new Response('private provider response', { status: 403 }))
    .mockResolvedValueOnce(new Response(null, { status: 200 }));
  vi.stubGlobal('fetch', fetch);
  const env = parseEnvironment({ ...production, ORDER_EMAIL_PROVIDER: 'resend' });
  const transport = new OrderEmailTransport(env);
  expect(await transport.send(orderId, message)).toEqual({
    status: 'FAILED',
    code: 'NETWORK',
    retryable: true,
  });
  expect(await transport.send(orderId, message)).toEqual({
    status: 'FAILED',
    code: 'HTTP_429',
    retryable: true,
  });
  expect(await transport.send(orderId, message)).toEqual({
    status: 'FAILED',
    code: 'HTTP_403',
    retryable: false,
  });
  expect(await transport.send(orderId, message)).toEqual({ status: 'ACCEPTED' });
  for (const [url, request] of fetch.mock.calls) {
    expect(url).toBe('https://api.resend.com/emails');
    expect(request?.redirect).toBe('error');
    expect(new Headers(request?.headers).get('Idempotency-Key')).toBe(
      `order-confirmation/${orderId}`,
    );
  }
});
