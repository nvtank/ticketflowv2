import { describe, expect, it } from 'vitest';
import {
  buildEventIcs,
  buildGoogleCalendarUrl,
  escapeIcsText,
  formatIcsUtcDate,
} from '../src/lib/calendar';

describe('calendar helpers', () => {
  it('formats ISO timestamps into RFC 5545 UTC format', () => {
    expect(formatIcsUtcDate('2026-12-20T19:30:00+07:00')).toBe('20261220T123000Z');
    expect(formatIcsUtcDate(new Date('2026-01-05T03:04:05.000Z'))).toBe('20260105T030405Z');
  });

  it('escapes commas, semicolons, backslashes, and newlines per RFC 5545', () => {
    expect(escapeIcsText('Đêm nhạc, mùa thu; Hà Nội\\VN\nDòng 2\r\nDòng 3')).toBe(
      'Đêm nhạc\\, mùa thu\\; Hà Nội\\\\VN\\nDòng 2\\nDòng 3',
    );
  });

  it('builds a valid VCALENDAR payload with CRLF line endings and canonical URL', () => {
    const ics = buildEventIcs({
      id: 'evt-123',
      title: 'Live Concert, Acoustic; Night',
      description: 'Cổng mở lúc 18:00.\nVui lòng mang theo mã QR.',
      startsAt: '2026-12-20T19:00:00+07:00',
      endsAt: '2026-12-20T22:00:00+07:00',
      location: 'Nhà hát Lớn, Số 1 Tràng Tiền, Hà Nội',
      url: 'https://tixflow.vn/events/live-concert',
      now: new Date('2026-11-25T10:00:00.000Z'),
    });

    expect(ics.endsWith('\r\n')).toBe(true);
    const unfolded = ics.replace(/\r\n /g, '');
    const lines = unfolded.split('\r\n');

    expect(lines).toContain('BEGIN:VCALENDAR');
    expect(lines).toContain('VERSION:2.0');
    expect(lines).toContain('BEGIN:VEVENT');
    expect(lines).toContain('UID:evt-123@tixflow.vn');
    expect(lines).toContain('DTSTAMP:20261125T100000Z');
    expect(lines).toContain('DTSTART:20261220T120000Z');
    expect(lines).toContain('DTEND:20261220T150000Z');
    expect(lines).toContain('SUMMARY:Live Concert\\, Acoustic\\; Night');
    expect(lines).toContain(
      'DESCRIPTION:Cổng mở lúc 18:00.\\nVui lòng mang theo mã QR.\\n\\nChi tiết sự kiện: https://tixflow.vn/events/live-concert',
    );
    expect(lines).toContain('LOCATION:Nhà hát Lớn\\, Số 1 Tràng Tiền\\, Hà Nội');
    expect(lines).toContain('URL:https://tixflow.vn/events/live-concert');
    expect(lines).toContain('END:VEVENT');
    expect(lines).toContain('END:VCALENDAR');
  });

  it('builds a Google Calendar template URL with encoded parameters', () => {
    const url = new URL(
      buildGoogleCalendarUrl({
        id: 'evt-123',
        title: 'Workshop & Meetup',
        description: 'Gặp gỡ cộng đồng',
        startsAt: '2026-12-20T09:00:00+07:00',
        endsAt: '2026-12-20T11:30:00+07:00',
        location: 'Đà Nẵng',
        url: 'https://tixflow.vn/events/workshop',
      }),
    );

    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('Workshop & Meetup');
    expect(url.searchParams.get('dates')).toBe('20261220T020000Z/20261220T043000Z');
    expect(url.searchParams.get('location')).toBe('Đà Nẵng');
    expect(url.searchParams.get('details')).toContain('https://tixflow.vn/events/workshop');
  });
});
