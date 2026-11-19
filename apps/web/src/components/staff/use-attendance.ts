'use client';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import type { RealtimeClientEvents, RealtimeServerEvents } from '@tixflow/shared';
import { z } from 'zod';
import { useAuthState } from '@/stores/auth';
import { refreshSession } from '@/lib/auth-session';
import {
  initialRealtimeConnectionStatus,
  resolveRealtimeOrigin,
  type RealtimeConnectionStatus,
} from '@/lib/realtime';
export function useAttendance(eventId: string) {
  const cache = useQueryClient(),
    [connection, setConnection] = useState<RealtimeConnectionStatus>(() =>
      initialRealtimeConnectionStatus(
        process.env.NEXT_PUBLIC_REALTIME_URL,
        process.env.NODE_ENV === 'development',
      ),
    );
  useEffect(() => {
    let disposed = false,
      refreshing = false;
    const origin = resolveRealtimeOrigin(
      process.env.NEXT_PUBLIC_REALTIME_URL,
      process.env.NODE_ENV === 'development',
      window.location,
    );
    if (!origin) return;
    const socket: Socket<RealtimeServerEvents, RealtimeClientEvents> = io(origin, {
      transports: ['websocket'],
      auth: (cb) => cb({ token: useAuthState.getState().accessToken }),
    });
    const connectionTimeout = setTimeout(() => {
      if (!disposed) setConnection('reconnecting');
    }, 5000);
    const resync = () => {
      void cache.invalidateQueries({ queryKey: ['staff'] });
    };
    socket.on('connect', () => {
      socket.timeout(5000).emit('staff:event:join', { eventId }, (error, result) => {
        if (disposed) return;
        clearTimeout(connectionTimeout);
        setConnection(!error && result?.ok ? 'connected' : 'reconnecting');
        resync();
      });
    });
    socket.on('disconnect', () => setConnection('reconnecting'));
    socket.on('checkin:updated', (raw) => {
      const hint = z.object({ eventId: z.uuid(), revision: z.number().int() }).safeParse(raw);
      if (hint.success && hint.data.eventId === eventId) resync();
    });
    socket.on('connect_error', (error) => {
      clearTimeout(connectionTimeout);
      setConnection('reconnecting');
      const data: unknown = 'data' in error ? error.data : null;
      if (
        typeof data === 'object' &&
        data !== null &&
        'code' in data &&
        data.code === 'UNAUTHENTICATED' &&
        !refreshing
      ) {
        refreshing = true;
        void refreshSession()
          .then(() => {
            if (!disposed) socket.connect();
          })
          .catch(() => {})
          .finally(() => {
            refreshing = false;
          });
      }
    });
    return () => {
      disposed = true;
      clearTimeout(connectionTimeout);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [eventId, cache]);
  return connection;
}
