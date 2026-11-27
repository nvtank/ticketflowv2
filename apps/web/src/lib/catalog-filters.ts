import { EVENT_CATEGORIES, EVENT_SORT_OPTIONS, type EventSortOption } from '@tixflow/shared';

export interface CatalogFilterState {
  q: string;
  category: string;
  city: string;
  from: string;
  to: string;
  minPrice: string;
  maxPrice: string;
  sort: EventSortOption;
  page: number;
}

export type DatePresetKey = 'today' | 'weekend' | 'month';

export interface ActiveFilterChip {
  key: 'q' | 'category' | 'city' | 'date' | 'price' | 'sort';
  label: string;
}

export const sortLabel: Record<EventSortOption, string> = {
  soonest: 'Sắp diễn ra',
  latest: 'Diễn ra muộn nhất',
  price_asc: 'Giá tăng dần',
  price_desc: 'Giá giảm dần',
};

const VALID_CATEGORIES = new Set<string>(EVENT_CATEGORIES);
const VALID_SORTS = new Set<string>(EVENT_SORT_OPTIONS);

export function normalizeSortOption(raw: string | null | undefined): EventSortOption {
  if (!raw || raw === 'date') return 'soonest';
  return VALID_SORTS.has(raw) ? (raw as EventSortOption) : 'soonest';
}

export function parseCatalogSearchParams(params: URLSearchParams): CatalogFilterState {
  const rawCategory = (params.get('category') ?? '').trim();
  const rawPage = Number.parseInt(params.get('page') ?? '1', 10);
  return {
    q: (params.get('q') ?? '').trim(),
    category: VALID_CATEGORIES.has(rawCategory) ? rawCategory : '',
    city: (params.get('city') ?? '').trim(),
    from: (params.get('from') ?? '').trim(),
    to: (params.get('to') ?? '').trim(),
    minPrice: (params.get('minPrice') ?? '').trim(),
    maxPrice: (params.get('maxPrice') ?? '').trim(),
    sort: normalizeSortOption(params.get('sort')),
    page: Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1,
  };
}

export function buildCatalogSearchParams(
  current: CatalogFilterState,
  patch: Partial<CatalogFilterState>,
): URLSearchParams {
  const isPageOnly = Object.keys(patch).length === 1 && 'page' in patch;
  const next: CatalogFilterState = {
    ...current,
    ...patch,
    page: isPageOnly ? (patch.page ?? 1) : (patch.page ?? 1),
  };

  const out = new URLSearchParams();
  if (next.q.trim()) out.set('q', next.q.trim());
  if (next.category && VALID_CATEGORIES.has(next.category)) out.set('category', next.category);
  if (next.city.trim()) out.set('city', next.city.trim());
  if (next.from.trim()) out.set('from', next.from.trim());
  if (next.to.trim()) out.set('to', next.to.trim());
  if (next.minPrice.trim()) out.set('minPrice', next.minPrice.trim());
  if (next.maxPrice.trim()) out.set('maxPrice', next.maxPrice.trim());
  if (next.sort !== 'soonest') out.set('sort', next.sort);
  if (next.page > 1) out.set('page', String(next.page));
  return out;
}

export function validateCatalogRanges(state: CatalogFilterState): string | null {
  if (state.from && state.to && state.from > state.to) {
    return 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.';
  }
  if (state.minPrice !== '' && state.maxPrice !== '') {
    const min = Number(state.minPrice);
    const max = Number(state.maxPrice);
    if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
      return 'Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa.';
    }
  }
  return null;
}

export function buildCatalogApiQuery(state: CatalogFilterState, pageSize: number): URLSearchParams {
  const query = new URLSearchParams();
  query.set('page', String(state.page));
  query.set('pageSize', String(pageSize));
  if (state.q) query.set('q', state.q);
  if (state.category) query.set('category', state.category);
  if (state.city) query.set('city', state.city);

  if (state.from) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(state.from)) {
      const date = new Date(`${state.from}T00:00:00+07:00`);
      if (Number.isFinite(date.getTime())) query.set('from', date.toISOString());
    } else {
      query.set('from', state.from);
    }
  }

  if (state.to) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(state.to)) {
      const date = new Date(`${state.to}T23:59:59+07:00`);
      if (Number.isFinite(date.getTime())) query.set('to', date.toISOString());
    } else {
      query.set('to', state.to);
    }
  }

  if (state.minPrice !== '') {
    const min = Number(state.minPrice);
    if (Number.isInteger(min) && min >= 0) query.set('minPrice', String(min));
  }
  if (state.maxPrice !== '') {
    const max = Number(state.maxPrice);
    if (Number.isInteger(max) && max >= 0) query.set('maxPrice', String(max));
  }
  if (state.sort !== 'soonest') {
    query.set('sort', state.sort);
  }
  return query;
}

function formatVnDate(date: Date): string {
  const shifted = new Date(date.getTime() + 7 * 3600000);
  return shifted.toISOString().slice(0, 10);
}

export function getDatePresetRange(
  preset: DatePresetKey,
  now: Date = new Date(),
): { from: string; to: string } {
  const shifted = new Date(now.getTime() + 7 * 3600000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const dayOfMonth = shifted.getUTCDate();
  const dayOfWeek = shifted.getUTCDay(); // 0 = Sun, 6 = Sat

  if (preset === 'today') {
    const today = formatVnDate(now);
    return { from: today, to: today };
  }

  if (preset === 'weekend') {
    const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
    const saturday = new Date(Date.UTC(year, month, dayOfMonth + daysUntilSaturday));
    const sunday = new Date(Date.UTC(year, month, dayOfMonth + daysUntilSaturday + 1));
    return {
      from: saturday.toISOString().slice(0, 10),
      to: sunday.toISOString().slice(0, 10),
    };
  }

  const firstDay = new Date(Date.UTC(year, month, dayOfMonth));
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  return {
    from: firstDay.toISOString().slice(0, 10),
    to: lastDay.toISOString().slice(0, 10),
  };
}

export function getActiveFilterChips(
  state: CatalogFilterState,
  categoryLabels: Record<string, string>,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  if (state.q) {
    chips.push({ key: 'q', label: `Từ khóa: "${state.q}"` });
  }
  if (state.category) {
    chips.push({
      key: 'category',
      label: `Danh mục: ${categoryLabels[state.category] ?? state.category}`,
    });
  }
  if (state.city) {
    chips.push({ key: 'city', label: `Thành phố: ${state.city}` });
  }
  if (state.from || state.to) {
    const range =
      state.from && state.to
        ? `${state.from} → ${state.to}`
        : state.from
          ? `Từ ${state.from}`
          : `Đến ${state.to}`;
    chips.push({ key: 'date', label: `Ngày: ${range}` });
  }
  if (state.minPrice !== '' || state.maxPrice !== '') {
    const fmt = (raw: string) => `${Number(raw).toLocaleString('vi-VN')}đ`;
    const price =
      state.minPrice !== '' && state.maxPrice !== ''
        ? `${fmt(state.minPrice)} – ${fmt(state.maxPrice)}`
        : state.minPrice !== ''
          ? `Từ ${fmt(state.minPrice)}`
          : `Đến ${fmt(state.maxPrice)}`;
    chips.push({ key: 'price', label: `Giá: ${price}` });
  }
  if (state.sort !== 'soonest') {
    chips.push({ key: 'sort', label: `Sắp xếp: ${sortLabel[state.sort]}` });
  }
  return chips;
}
