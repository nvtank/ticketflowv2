import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiGet, eventListSchema } from './api-client';

export const favoriteListResponseSchema = z.object({
  items: z.array(
    z.object({
      event: eventListSchema.shape.items.element,
      createdAt: z.iso.datetime(),
    }),
  ),
  pagination: eventListSchema.shape.pagination,
});

export const favoriteMutationResponseSchema = z.object({
  eventId: z.string(),
  isFavorite: z.boolean(),
});

export type FavoriteListItem = z.infer<typeof favoriteListResponseSchema>['items'][number];
export const favoriteIndexKey = (userId: string | undefined) =>
  ['favorites', 'index', userId] as const;

async function getAllFavoriteEvents(signal?: AbortSignal): Promise<FavoriteListItem[]> {
  const items = new Map<string, FavoriteListItem>();
  let page = 1;
  while (true) {
    const result = await apiGet(
      `/me/favorites?page=${page}&pageSize=50`,
      favoriteListResponseSchema,
      { signal },
    );
    for (const item of result.items) items.set(item.event.id, item);
    if (page >= result.pagination.totalPages) return [...items.values()];
    page++;
  }
}

export function useFavoriteIndex(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: favoriteIndexKey(userId),
    queryFn: ({ signal }) => getAllFavoriteEvents(signal),
    enabled: !!userId && enabled,
    staleTime: 30_000,
    retry: false,
  });
}
