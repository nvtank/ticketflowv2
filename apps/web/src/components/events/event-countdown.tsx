'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { getEventCountdownState } from '@/lib/event-countdown';

function padTwo(value: number) {
  return String(value).padStart(2, '0');
}

export function EventCountdown({
  startsAt,
  endsAt,
  status,
}: {
  startsAt: string;
  endsAt?: string | null;
  status?: string | null;
}) {
  // Keep null during SSR and initial client render to avoid hydration mismatch.
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    let intervalId: number | undefined;

    const syncNow = () => {
      setNowMs(Date.now());
    };

    syncNow();

    const msUntilNextMinute = 60_000 - (Date.now() % 60_000);
    const alignTimeoutId = window.setTimeout(() => {
      syncNow();
      intervalId = window.setInterval(syncNow, 60_000);
    }, msUntilNextMinute);

    return () => {
      window.clearTimeout(alignTimeoutId);
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, [startsAt, endsAt, status]);

  if (nowMs === null) {
    return (
      <div
        aria-live="polite"
        className="rounded-2xl border bg-muted/40 p-4"
        data-testid="event-countdown"
      >
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
          <Clock className="size-3.5" aria-hidden />
          Đếm ngược sự kiện
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border bg-background/80 px-2 py-2.5">
            <span className="block font-mono text-xl font-bold">--</span>
            <span className="text-[11px] text-muted-foreground">Ngày</span>
          </div>
          <div className="rounded-xl border bg-background/80 px-2 py-2.5">
            <span className="block font-mono text-xl font-bold">--</span>
            <span className="text-[11px] text-muted-foreground">Giờ</span>
          </div>
          <div className="rounded-xl border bg-background/80 px-2 py-2.5">
            <span className="block font-mono text-xl font-bold">--</span>
            <span className="text-[11px] text-muted-foreground">Phút</span>
          </div>
        </div>
      </div>
    );
  }

  const state = getEventCountdownState({ startsAt, endsAt, status, nowMs });

  if (state.phase === 'upcoming') {
    return (
      <div
        aria-live="polite"
        className="rounded-2xl border border-primary/30 bg-primary/5 p-4"
        data-testid="event-countdown"
      >
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
          <Clock className="size-3.5" aria-hidden />
          Bắt đầu sau
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border bg-background/90 px-2 py-2.5">
            <span className="block font-mono text-xl font-bold text-foreground">
              {padTwo(state.days)}
            </span>
            <span className="text-[11px] text-muted-foreground">Ngày</span>
          </div>
          <div className="rounded-xl border bg-background/90 px-2 py-2.5">
            <span className="block font-mono text-xl font-bold text-foreground">
              {padTwo(state.hours)}
            </span>
            <span className="text-[11px] text-muted-foreground">Giờ</span>
          </div>
          <div className="rounded-xl border bg-background/90 px-2 py-2.5">
            <span className="block font-mono text-xl font-bold text-foreground">
              {padTwo(state.minutes)}
            </span>
            <span className="text-[11px] text-muted-foreground">Phút</span>
          </div>
        </div>
      </div>
    );
  }

  const badgeTone =
    state.phase === 'ongoing'
      ? 'border-success/40 bg-success/10 text-success'
      : 'border-border bg-muted/50 text-muted-foreground';

  return (
    <div
      aria-live="polite"
      className={`rounded-2xl border p-4 ${badgeTone}`}
      data-testid="event-countdown"
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Clock className="size-4 shrink-0" aria-hidden />
        <span>{state.label}</span>
      </p>
    </div>
  );
}
