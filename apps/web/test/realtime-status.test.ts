import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RealtimeStatus } from '../src/components/realtime/realtime-status';
import { initialRealtimeConnectionStatus, resolveRealtimeOrigin } from '../src/lib/realtime';

describe('realtime connection configuration', () => {
  it('keeps the localhost convenience in development', () => {
    expect(
      resolveRealtimeOrigin(undefined, true, { protocol: 'http:', hostname: 'localhost' }),
    ).toBe('http://localhost:4100');
  });

  it('does not guess an API origin in deployed environments', () => {
    expect(
      resolveRealtimeOrigin(undefined, false, { protocol: 'https:', hostname: 'app.vercel.app' }),
    ).toBe(null);
  });

  it('uses an explicitly configured realtime origin', () => {
    expect(
      resolveRealtimeOrigin('https://api.example.test', false, {
        protocol: 'https:',
        hostname: 'app.vercel.app',
      }),
    ).toBe('https://api.example.test');
  });

  it('starts as unavailable when production has no realtime URL', () => {
    expect(initialRealtimeConnectionStatus(undefined, false)).toBe('unavailable');
  });
});

describe('realtime degraded status', () => {
  it.each([
    ['booking', 'Mất kết nối cập nhật trực tiếp', 'trạng thái ghế'],
    ['attendance', 'Mất kết nối cập nhật trực tiếp', 'Số liệu check-in'],
  ] as const)(
    'shows a visible warning for %s when its socket reconnects',
    (feature, warning, dataLabel) => {
      const html = renderToStaticMarkup(
        createElement(RealtimeStatus, { status: 'reconnecting', feature }),
      );
      expect(html).toContain('role="alert"');
      expect(html).toContain(warning);
      expect(html.toLowerCase()).toContain(dataLabel.toLowerCase());
    },
  );

  it.each(['booking', 'attendance'] as const)(
    'shows a visible warning for %s when realtime configuration is missing',
    (feature) => {
      const html = renderToStaticMarkup(
        createElement(RealtimeStatus, { status: 'unavailable', feature }),
      );
      expect(html).toContain('role="alert"');
      expect(html).toContain('chưa được cấu hình');
    },
  );
});
