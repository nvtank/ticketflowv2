'use client';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EVENT_CATEGORIES, EVENT_SORT_OPTIONS, type EventSortOption } from '@tixflow/shared';
import { z } from 'zod';
import { apiGet, eventListSchema } from '@/lib/api-client';
import {
  buildCatalogApiQuery,
  buildCatalogSearchParams,
  getActiveFilterChips,
  getDatePresetRange,
  parseCatalogSearchParams,
  sortLabel,
  validateCatalogRanges,
  type ActiveFilterChip,
  type CatalogFilterState,
  type DatePresetKey,
} from '@/lib/catalog-filters';
import { categoryLabel } from '@/lib/events';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { EventGrid } from './event-card';
import { QueryNotice } from './event-detail';

const control = 'h-11 w-full rounded-xl border bg-card px-3 text-sm';

const eventFiltersSchema = z.object({
  cities: z.array(z.string()),
  minPriceVnd: z.number().int().nonnegative(),
  maxPriceVnd: z.number().int().nonnegative(),
});

const datePresets: { key: DatePresetKey; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'weekend', label: 'Cuối tuần này' },
  { key: 'month', label: 'Tháng này' },
];

const pricePresets: { label: string; minPrice: string; maxPrice: string }[] = [
  { label: 'Miễn phí', minPrice: '0', maxPrice: '0' },
  { label: 'Dưới 500k', minPrice: '', maxPrice: '500000' },
  { label: '500k – 1.5tr', minPrice: '500000', maxPrice: '1500000' },
  { label: 'Trên 1.5tr', minPrice: '1500000', maxPrice: '' },
];

export function EventCatalog({ searchable = false }: { searchable?: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const paramsKey = params.toString();

  const urlState = useMemo(
    () => parseCatalogSearchParams(new URLSearchParams(paramsKey)),
    [paramsKey],
  );

  const [prevUrlSync, setPrevUrlSync] = useState({
    q: urlState.q,
    minPrice: urlState.minPrice,
    maxPrice: urlState.maxPrice,
  });
  const [keywordDraft, setKeywordDraft] = useState(urlState.q);
  const [minPriceDraft, setMinPriceDraft] = useState(urlState.minPrice);
  const [maxPriceDraft, setMaxPriceDraft] = useState(urlState.maxPrice);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  if (
    prevUrlSync.q !== urlState.q ||
    prevUrlSync.minPrice !== urlState.minPrice ||
    prevUrlSync.maxPrice !== urlState.maxPrice
  ) {
    setPrevUrlSync({
      q: urlState.q,
      minPrice: urlState.minPrice,
      maxPrice: urlState.maxPrice,
    });
    if (prevUrlSync.q !== urlState.q) setKeywordDraft(urlState.q);
    if (prevUrlSync.minPrice !== urlState.minPrice) setMinPriceDraft(urlState.minPrice);
    if (prevUrlSync.maxPrice !== urlState.maxPrice) setMaxPriceDraft(urlState.maxPrice);
  }

  const syncUrl = (patch: Partial<CatalogFilterState>) => {
    const nextParams = buildCatalogSearchParams(urlState, patch);
    const nextString = nextParams.toString();
    if (nextString === paramsKey) return;
    router.push(nextString ? `/events?${nextString}` : '/events', { scroll: false });
  };

  useEffect(() => {
    if (!searchable) return;
    const trimmed = keywordDraft.trim();
    if (trimmed === urlState.q) return;
    const timer = window.setTimeout(() => {
      syncUrl({ q: trimmed });
    }, 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordDraft, searchable, urlState.q]);

  useEffect(() => {
    if (!searchable) return;
    const minTrimmed = minPriceDraft.trim();
    const maxTrimmed = maxPriceDraft.trim();
    if (minTrimmed === urlState.minPrice && maxTrimmed === urlState.maxPrice) return;
    const timer = window.setTimeout(() => {
      syncUrl({ minPrice: minTrimmed, maxPrice: maxTrimmed });
    }, 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPriceDraft, maxPriceDraft, searchable, urlState.minPrice, urlState.maxPrice]);

  const filterMetadata = useQuery({
    queryKey: ['events', 'filters'],
    queryFn: ({ signal }) =>
      apiGet('/events/filters', eventFiltersSchema, { signal, anonymous: true }),
    enabled: searchable,
    staleTime: 60_000,
    retry: false,
  });

  const cityOptions = useMemo(() => {
    const set = new Set<string>(filterMetadata.data?.cities ?? []);
    if (urlState.city) set.add(urlState.city);
    return Array.from(set);
  }, [filterMetadata.data?.cities, urlState.city]);

  const rangeError = useMemo(() => validateCatalogRanges(urlState), [urlState]);

  const apiQuery = useMemo(
    () => buildCatalogApiQuery(urlState, searchable ? 9 : 6),
    [urlState, searchable],
  );

  const events = useQuery({
    queryKey: ['events', 'catalog', apiQuery.toString()],
    queryFn: ({ signal }) =>
      apiGet(`/events?${apiQuery}`, eventListSchema, { signal, anonymous: true }),
    enabled: !rangeError,
    retry: false,
  });

  const activeChips = useMemo(() => getActiveFilterChips(urlState, categoryLabel), [urlState]);

  const removeChip = (chip: ActiveFilterChip) => {
    switch (chip.key) {
      case 'q':
        setKeywordDraft('');
        syncUrl({ q: '' });
        break;
      case 'category':
        syncUrl({ category: '' });
        break;
      case 'city':
        syncUrl({ city: '' });
        break;
      case 'date':
        syncUrl({ from: '', to: '' });
        break;
      case 'price':
        setMinPriceDraft('');
        setMaxPriceDraft('');
        syncUrl({ minPrice: '', maxPrice: '' });
        break;
      case 'sort':
        syncUrl({ sort: 'soonest' });
        break;
    }
  };

  const resetAllFilters = () => {
    setKeywordDraft('');
    setMinPriceDraft('');
    setMaxPriceDraft('');
    router.replace('/events', { scroll: false });
  };

  const goPage = (page: number) => {
    const next = buildCatalogSearchParams(urlState, { page });
    const nextString = next.toString();
    router.push(nextString ? `/events?${nextString}` : '/events');
  };
  return (
    <div>
      {searchable && (
        <form
          id="search"
          aria-label="Bộ lọc tìm kiếm sự kiện"
          className="mb-9 scroll-mt-32 rounded-2xl border bg-card p-5 shadow-sm md:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            syncUrl({
              q: keywordDraft.trim(),
              minPrice: minPriceDraft.trim(),
              maxPrice: maxPriceDraft.trim(),
            });
          }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <SlidersHorizontal className="size-4 text-primary" />
              Tìm đúng trải nghiệm dành cho bạn
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="md:hidden"
              aria-expanded={mobileFiltersOpen}
              aria-controls="catalog-filter-controls"
              onClick={() => setMobileFiltersOpen((open) => !open)}
            >
              <SlidersHorizontal className="size-3.5" />
              Bộ lọc{activeChips.length > 0 ? ` (${activeChips.length})` : ''}
            </Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="event-search">
              Tìm sự kiện theo tên
            </label>
            <Input
              id="event-search"
              name="q"
              placeholder="Bạn muốn trải nghiệm điều gì?"
              value={keywordDraft}
              onChange={(event) => setKeywordDraft(event.target.value)}
              maxLength={120}
            />
            <Button type="submit">
              <Search />
              Tìm kiếm
            </Button>
          </div>

          <div
            id="catalog-filter-controls"
            data-open={mobileFiltersOpen}
            className="mt-4 hidden gap-3 data-[open=true]:grid sm:grid-cols-2 lg:grid-cols-4 md:grid"
          >
            <label className="text-xs font-medium text-muted-foreground">
              Thành phố
              <select
                className={control + ' mt-1'}
                name="city"
                aria-label="Thành phố"
                value={urlState.city}
                onChange={(event) => syncUrl({ city: event.target.value })}
              >
                <option value="">Tất cả thành phố</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-muted-foreground">
              Danh mục
              <select
                className={control + ' mt-1'}
                name="category"
                aria-label="Danh mục"
                value={urlState.category}
                onChange={(event) => syncUrl({ category: event.target.value })}
              >
                <option value="">Tất cả danh mục</option>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabel[c]}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-muted-foreground">
              Từ ngày
              <Input
                className="mt-1"
                type="date"
                name="from"
                aria-label="Từ ngày"
                value={urlState.from}
                onChange={(event) => syncUrl({ from: event.target.value })}
              />
            </label>

            <label className="text-xs font-medium text-muted-foreground">
              Đến ngày
              <Input
                className="mt-1"
                type="date"
                name="to"
                aria-label="Đến ngày"
                value={urlState.to}
                onChange={(event) => syncUrl({ to: event.target.value })}
              />
            </label>

            <label className="text-xs font-medium text-muted-foreground">
              Giá từ (VND)
              <Input
                className="mt-1"
                type="number"
                name="minPrice"
                aria-label="Giá từ (VND)"
                placeholder={
                  filterMetadata.data ? formatCurrency(filterMetadata.data.minPriceVnd) : '0'
                }
                min={0}
                max={2147483647}
                value={minPriceDraft}
                onChange={(event) => setMinPriceDraft(event.target.value)}
              />
            </label>

            <label className="text-xs font-medium text-muted-foreground">
              Giá đến (VND)
              <Input
                className="mt-1"
                type="number"
                name="maxPrice"
                aria-label="Giá đến (VND)"
                placeholder={
                  filterMetadata.data && filterMetadata.data.maxPriceVnd > 0
                    ? formatCurrency(filterMetadata.data.maxPriceVnd)
                    : 'Không giới hạn'
                }
                min={0}
                max={2147483647}
                value={maxPriceDraft}
                onChange={(event) => setMaxPriceDraft(event.target.value)}
              />
            </label>

            <label className="text-xs font-medium text-muted-foreground">
              Sắp xếp
              <select
                className={control + ' mt-1'}
                name="sort"
                aria-label="Sắp xếp"
                value={urlState.sort}
                onChange={(event) => syncUrl({ sort: event.target.value as EventSortOption })}
              >
                {EVENT_SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {sortLabel[option]}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={activeChips.length === 0}
                onClick={resetAllFilters}
              >
                <RotateCcw className="size-4" />
                Xóa bộ lọc
              </Button>
            </div>
          </div>

          <div
            data-open={mobileFiltersOpen}
            className="mt-4 hidden flex-wrap items-center gap-2 border-t pt-4 data-[open=true]:flex md:flex"
          >
            <span className="text-[11px] font-medium text-muted-foreground">Thời gian:</span>
            {datePresets.map((preset) => {
              const range = getDatePresetRange(preset.key);
              const active = urlState.from === range.from && urlState.to === range.to;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() =>
                    syncUrl(active ? { from: '', to: '' } : { from: range.from, to: range.to })
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
            <span className="ml-0 text-[11px] font-medium text-muted-foreground sm:ml-2">
              Mức giá:
            </span>
            {pricePresets.map((preset) => {
              const active =
                urlState.minPrice === preset.minPrice && urlState.maxPrice === preset.maxPrice;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    const nextMin = active ? '' : preset.minPrice;
                    const nextMax = active ? '' : preset.maxPrice;
                    setMinPriceDraft(nextMin);
                    setMaxPriceDraft(nextMax);
                    syncUrl({ minPrice: nextMin, maxPrice: nextMax });
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {activeChips.length > 0 && (
            <div
              aria-label="Bộ lọc đang áp dụng"
              className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3"
            >
              {activeChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {chip.label}
                  <button
                    type="button"
                    aria-label={`Xóa ${chip.label}`}
                    onClick={() => removeChip(chip)}
                    className="rounded-full p-0.5 hover:bg-primary/20"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {rangeError && (
            <p role="alert" className="mt-3 text-xs font-medium text-destructive">
              {rangeError}
            </p>
          )}
        </form>
      )}

      {rangeError ? (
        <EmptyState
          title="Khoảng lọc chưa hợp lệ"
          description={rangeError}
          action={
            <Button type="button" variant="outline" onClick={resetAllFilters}>
              Đặt lại bộ lọc
            </Button>
          }
        />
      ) : events.isPending || events.isError ? (
        <QueryNotice
          pending={events.isPending}
          error={events.error}
          retry={() => void events.refetch()}
        />
      ) : events.data.items.length === 0 ? (
        <EmptyState
          title="Chưa có sự kiện phù hợp"
          description="Thử một từ khóa, ngày hoặc danh mục khác."
          action={
            searchable && activeChips.length > 0 ? (
              <Button type="button" variant="outline" onClick={resetAllFilters}>
                Xóa bộ lọc
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <EventGrid events={events.data.items} />
          {searchable && (
            <nav
              aria-label="Phân trang sự kiện"
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
            >
              <Button
                variant="outline"
                disabled={events.data.pagination.page <= 1}
                onClick={() => goPage(events.data.pagination.page - 1)}
              >
                Trang trước
              </Button>
              <p className="text-sm">
                {events.data.pagination.page}/{Math.max(1, events.data.pagination.totalPages)} ·{' '}
                {events.data.pagination.total} sự kiện
              </p>
              <Button
                variant="outline"
                disabled={events.data.pagination.page >= events.data.pagination.totalPages}
                onClick={() => goPage(events.data.pagination.page + 1)}
              >
                Trang sau
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
