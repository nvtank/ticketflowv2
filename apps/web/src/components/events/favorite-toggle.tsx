'use client';

import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { EventSummary } from '@tixflow/shared';
import { apiRequest } from '@/lib/api-client';
import type { EventDetail } from '@/lib/events';
import {
  favoriteIndexKey,
  favoriteMutationResponseSchema,
  useFavoriteIndex,
  type FavoriteListItem,
} from '@/lib/favorites';
import { useAuthState } from '@/stores/auth';

export function FavoriteToggle({
  event,
  listed = true,
  detailFavorite,
  className = '',
}: {
  event: EventSummary;
  listed?: boolean;
  detailFavorite?: boolean;
  className?: string;
}) {
  const status = useAuthState((state) => state.status);
  const userId = useAuthState((state) => state.user?.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const indexKey = favoriteIndexKey(userId);
  const detailKey = ['events', 'public-detail', event.slug, userId] as const;
  const mutationGroup = ['favorites', 'write', userId] as const;
  const mutationKey = [...mutationGroup, event.id] as const;
  const pending = useIsMutating({ mutationKey, exact: true }) > 0;
  const index = useFavoriteIndex(userId, listed);
  const mutation = useMutation({
    mutationKey,
    mutationFn: (isFavorite: boolean) => {
      if (useAuthState.getState().user?.id !== userId)
        throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng thử lại.');
      return apiRequest(
        isFavorite ? 'PUT' : 'DELETE',
        `/me/favorites/${event.id}`,
        favoriteMutationResponseSchema,
      );
    },
    onMutate: async (nextValue) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: indexKey, exact: true }),
        queryClient.cancelQueries({ queryKey: detailKey, exact: true }),
      ]);
      if (useAuthState.getState().user?.id !== userId) return;
      const previousItem = queryClient
        .getQueryData<FavoriteListItem[]>(indexKey)
        ?.find((item) => item.event.id === event.id);
      if (listed)
        queryClient.setQueryData<FavoriteListItem[]>(indexKey, (items) => {
          if (!items) return items;
          if (!nextValue) return items.filter((item) => item.event.id !== event.id);
          if (previousItem) return items;
          return [{ event, createdAt: new Date().toISOString() }, ...items];
        });
      const previousDetail = queryClient.getQueryData<EventDetail>(detailKey);
      queryClient.setQueryData<EventDetail>(detailKey, (detail) =>
        detail ? { ...detail, isFavorite: nextValue } : detail,
      );
      return { previousItem, previousDetail };
    },
    onError: (error, _nextValue, context) => {
      if (context && useAuthState.getState().user?.id === userId) {
        const { previousItem, previousDetail } = context;
        // Roll back this event only so a separate favorite change can complete independently.
        if (listed)
          queryClient.setQueryData<FavoriteListItem[]>(indexKey, (items) => {
            if (!items) return items;
            const remaining = items.filter((item) => item.event.id !== event.id);
            return previousItem
              ? [previousItem, ...remaining].sort(
                  (a, b) =>
                    b.createdAt.localeCompare(a.createdAt) || b.event.id.localeCompare(a.event.id),
                )
              : remaining;
          });
        if (previousDetail)
          queryClient.setQueryData<EventDetail>(detailKey, (detail) =>
            detail ? { ...detail, isFavorite: previousDetail.isFavorite } : detail,
          );
      }
      toast.error(error.message);
    },
    onSettled: async () => {
      if (useAuthState.getState().user?.id !== userId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: detailKey, exact: true }),
        // Avoid refetching over a different event's optimistic change.
        queryClient.isMutating({ mutationKey: mutationGroup }) === 1
          ? queryClient.invalidateQueries({ queryKey: indexKey, exact: true })
          : undefined,
      ]);
    },
  });

  const isFavorite =
    status === 'authenticated' &&
    (listed && index.data
      ? index.data.some((item) => item.event.id === event.id)
      : (detailFavorite ?? false));
  const waiting = status === 'loading' || (status === 'authenticated' && listed && index.isPending);
  const unavailable = status === 'error' || (status === 'authenticated' && listed && !index.data);

  const toggle = () => {
    if (status === 'anonymous') {
      const { pathname, search, hash } = window.location;
      const returnTo = `${pathname}${search}${hash}`;
      router.push(`/login?next=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (status !== 'authenticated' || unavailable || pending) return;
    mutation.mutate(!isFavorite);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={unavailable || waiting || pending}
      aria-label={`Yêu thích ${event.title}`}
      aria-pressed={isFavorite}
      title={
        unavailable && !waiting
          ? 'Chưa tải được trạng thái yêu thích. Hãy tải lại trang.'
          : isFavorite
            ? 'Bỏ khỏi sự kiện yêu thích'
            : 'Lưu sự kiện yêu thích'
      }
      className={`inline-flex size-11 items-center justify-center rounded-full border border-white/50 bg-card/95 text-foreground shadow-md transition hover:scale-105 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60 ${className}`}
    >
      <Heart
        aria-hidden="true"
        className={`size-5 transition-colors ${isFavorite ? 'fill-rose-600 text-rose-600' : ''}`}
      />
    </button>
  );
}
