'use client';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import type { RealtimeClientEvents, RealtimeServerEvents } from '@tixflow/shared';
import { useAuthState } from '@/stores/auth';
import { refreshSession } from '@/lib/auth-session';
import { bookingSchema, inventoryHintSchema } from '@/lib/booking';
import {
  initialRealtimeConnectionStatus,
  resolveRealtimeOrigin,
  type RealtimeConnectionStatus,
} from '@/lib/realtime';
export function useBookingRealtime(eventId: string) {
  const cache = useQueryClient(),
    userId = useAuthState((s) => s.user?.id),
    [connection, setConnection] = useState<RealtimeConnectionStatus>(() =>
      initialRealtimeConnectionStatus(
        process.env.NEXT_PUBLIC_REALTIME_URL,
        process.env.NODE_ENV === 'development',
      ),
    );
  useEffect(() => {
    if (!userId) return;
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
      auth: (callback) => callback({ token: useAuthState.getState().accessToken }),
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });
    const connectionTimeout = setTimeout(() => {
      if (!disposed) setConnection('reconnecting');
    }, 5000);
    const resync = () => {
      void cache.invalidateQueries({ queryKey: ['booking', eventId] });
    };
    socket.on('connect', () => {
      socket.timeout(5000).emit('event:join', { eventId }, (error, result) => {
        if (disposed) return;
        clearTimeout(connectionTimeout);
        setConnection(!error && result?.ok ? 'connected' : 'reconnecting');
        resync();
      });
    });
    socket.on('disconnect', () => setConnection('reconnecting'));
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
    const hint = (raw: unknown) => {
      const update = inventoryHintSchema.safeParse(raw);
      if (!update.success || update.data.eventId !== eventId) return;
      const current = bookingSchema.safeParse(cache.getQueryData(['booking', eventId]));
      if (!current.success || update.data.revision > current.data.revision) resync();
    };
    socket.on('inventory:updated', hint);
    return () => {
      disposed = true;
      clearTimeout(connectionTimeout);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [eventId, userId, cache]);
  return connection;
}
