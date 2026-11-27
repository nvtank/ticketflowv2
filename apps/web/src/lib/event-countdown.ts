export type EventCountdownPhase = 'upcoming' | 'ongoing' | 'ended' | 'cancelled';

export interface EventCountdownState {
  phase: EventCountdownPhase;
  label: string;
  days: number;
  hours: number;
  minutes: number;
  totalMinutes: number;
}

export function getEventCountdownState(input: {
  startsAt: string | Date;
  endsAt?: string | Date | null;
  status?: string | null;
  nowMs?: number;
}): EventCountdownState {
  const nowMs = input.nowMs ?? Date.now();
  const startMs =
    input.startsAt instanceof Date ? input.startsAt.getTime() : new Date(input.startsAt).getTime();
  const endMs =
    input.endsAt == null
      ? Number.NaN
      : input.endsAt instanceof Date
        ? input.endsAt.getTime()
        : new Date(input.endsAt).getTime();

  if (input.status === 'CANCELLED') {
    return {
      phase: 'cancelled',
      label: 'Đã hủy',
      days: 0,
      hours: 0,
      minutes: 0,
      totalMinutes: 0,
    };
  }

  if (input.status === 'COMPLETED') {
    return {
      phase: 'ended',
      label: 'Đã kết thúc',
      days: 0,
      hours: 0,
      minutes: 0,
      totalMinutes: 0,
    };
  }

  if (!Number.isFinite(startMs)) {
    return {
      phase: 'ended',
      label: 'Đã kết thúc',
      days: 0,
      hours: 0,
      minutes: 0,
      totalMinutes: 0,
    };
  }

  if (nowMs < startMs) {
    const diffMs = startMs - nowMs;
    const totalMinutes = Math.max(0, Math.floor(diffMs / 60_000));
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    return {
      phase: 'upcoming',
      label: 'Sắp diễn ra',
      days,
      hours,
      minutes,
      totalMinutes,
    };
  }

  if (Number.isFinite(endMs) && nowMs < endMs) {
    return {
      phase: 'ongoing',
      label: 'Đang diễn ra',
      days: 0,
      hours: 0,
      minutes: 0,
      totalMinutes: 0,
    };
  }

  return {
    phase: 'ended',
    label: 'Đã kết thúc',
    days: 0,
    hours: 0,
    minutes: 0,
    totalMinutes: 0,
  };
}
