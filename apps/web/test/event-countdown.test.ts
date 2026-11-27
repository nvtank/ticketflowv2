import { describe, expect, it } from 'vitest';
import { getEventCountdownState } from '../src/lib/event-countdown';

describe('getEventCountdownState', () => {
  const startsAt = '2026-12-01T19:00:00.000Z';
  const endsAt = '2026-12-01T22:00:00.000Z';

  it('computes days, hours, and minutes for future events', () => {
    const startMs = new Date(startsAt).getTime();
    const nowMs = startMs - ((2 * 24 + 5) * 60 + 34) * 60_000 - 45_000;

    const state = getEventCountdownState({ startsAt, endsAt, nowMs });

    expect(state).toEqual({
      phase: 'upcoming',
      label: 'Sắp diễn ra',
      days: 2,
      hours: 5,
      minutes: 34,
      totalMinutes: (2 * 24 + 5) * 60 + 34,
    });
  });

  it('handles less than one minute remaining before start without negative values', () => {
    const startMs = new Date(startsAt).getTime();
    const state = getEventCountdownState({
      startsAt,
      endsAt,
      nowMs: startMs - 20_000,
    });

    expect(state).toEqual({
      phase: 'upcoming',
      label: 'Sắp diễn ra',
      days: 0,
      hours: 0,
      minutes: 0,
      totalMinutes: 0,
    });
  });

  it('returns ongoing when current time is between startsAt and endsAt', () => {
    const startMs = new Date(startsAt).getTime();
    const state = getEventCountdownState({
      startsAt,
      endsAt,
      nowMs: startMs + 30 * 60_000,
    });

    expect(state.phase).toBe('ongoing');
    expect(state.label).toBe('Đang diễn ra');
  });

  it('returns ended once current time reaches or passes endsAt', () => {
    const endMs = new Date(endsAt).getTime();

    expect(getEventCountdownState({ startsAt, endsAt, nowMs: endMs }).phase).toBe('ended');
    expect(getEventCountdownState({ startsAt, endsAt, nowMs: endMs + 60_000 }).label).toBe(
      'Đã kết thúc',
    );
  });

  it('returns ended when endsAt is omitted and startsAt has passed', () => {
    const startMs = new Date(startsAt).getTime();
    const state = getEventCountdownState({
      startsAt,
      nowMs: startMs + 1_000,
    });

    expect(state.phase).toBe('ended');
    expect(state.label).toBe('Đã kết thúc');
  });

  it('respects explicit CANCELLED and COMPLETED statuses', () => {
    const startMs = new Date(startsAt).getTime();

    expect(
      getEventCountdownState({
        startsAt,
        endsAt,
        status: 'CANCELLED',
        nowMs: startMs - 86_400_000,
      }),
    ).toMatchObject({ phase: 'cancelled', label: 'Đã hủy' });

    expect(
      getEventCountdownState({
        startsAt,
        endsAt,
        status: 'COMPLETED',
        nowMs: startMs - 86_400_000,
      }),
    ).toMatchObject({ phase: 'ended', label: 'Đã kết thúc' });
  });
});
