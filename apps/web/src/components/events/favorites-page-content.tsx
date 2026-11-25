'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AccountNavigation } from '@/components/layout/account-navigation';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { QueryNotice } from '@/components/ui/query-notice';
import { useFavoriteIndex } from '@/lib/favorites';
import { useAuthState } from '@/stores/auth';
import { EventGrid } from './event-card';

export function FavoritesPageContent() {
  const userId = useAuthState((state) => state.user?.id);
  const query = useFavoriteIndex(userId);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const pageCount = Math.ceil((query.data?.length ?? 0) / pageSize);
  const currentPage = Math.min(page, Math.max(pageCount, 1));
  const items = query.data?.slice((currentPage - 1) * pageSize, currentPage * pageSize) ?? [];

  return (
    <section className="container py-10 md:py-14">
      <AccountNavigation />
      <h1 className="mb-8 text-3xl font-bold">Sự kiện yêu thích</h1>
      {!query.data ? (
        <QueryNotice
          pending={query.isPending}
          error={query.error}
          retry={() => void query.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Bạn chưa lưu sự kiện nào"
          description="Dùng nút trái tim để lưu sự kiện bạn muốn xem lại."
          action={
            <Button asChild>
              <Link href="/events">Xem tất cả sự kiện</Link>
            </Button>
          }
        />
      ) : (
        <>
          <EventGrid events={items.map(({ event }) => event)} />
          {pageCount > 1 && (
            <nav
              aria-label="Phân trang sự kiện yêu thích"
              className="mt-8 flex justify-center gap-4"
            >
              <Button
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Trang trước
              </Button>
              <span className="py-2 text-sm" aria-live="polite">
                Trang {currentPage} / {pageCount}
              </span>
              <Button
                variant="outline"
                disabled={currentPage >= pageCount}
                onClick={() => setPage(currentPage + 1)}
              >
                Trang sau
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
