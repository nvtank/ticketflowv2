import { describe, expect, it } from 'vitest';
import {
  buildCatalogApiQuery,
  buildCatalogSearchParams,
  getActiveFilterChips,
  getDatePresetRange,
  parseCatalogSearchParams,
  validateCatalogRanges,
} from '../src/lib/catalog-filters';

describe('catalog filter URL state helpers', () => {
  it('parses URL search params and normalizes legacy sort values', () => {
    const state = parseCatalogSearchParams(
      new URLSearchParams(
        'q=%20concert%20&category=MUSIC&city=Đà%20Nẵng&from=2026-12-01&to=2026-12-31&minPrice=100000&maxPrice=500000&sort=date&page=3',
      ),
    );
    expect(state).toEqual({
      q: 'concert',
      category: 'MUSIC',
      city: 'Đà Nẵng',
      from: '2026-12-01',
      to: '2026-12-31',
      minPrice: '100000',
      maxPrice: '500000',
      sort: 'soonest',
      page: 3,
    });
  });

  it('resets page to 1 when any filter changes and omits default values', () => {
    const initial = parseCatalogSearchParams(
      new URLSearchParams('city=Hà%20Nội&sort=price_asc&page=4'),
    );
    const updated = buildCatalogSearchParams(initial, { city: 'Đà Nẵng' });
    expect(updated.get('city')).toBe('Đà Nẵng');
    expect(updated.get('sort')).toBe('price_asc');
    expect(updated.has('page')).toBe(false);

    const resetSort = buildCatalogSearchParams(initial, { sort: 'soonest' });
    expect(resetSort.has('sort')).toBe(false);
    expect(resetSort.has('page')).toBe(false);
  });

  it('preserves target page when only page changes', () => {
    const initial = parseCatalogSearchParams(new URLSearchParams('city=Đà%20Nẵng&page=1'));
    const next = buildCatalogSearchParams(initial, { page: 2 });
    expect(next.toString()).toBe('city=%C4%90%C3%A0+N%E1%BA%B5ng&page=2');
  });

  it('builds API query parameters with Vietnam timezone boundaries', () => {
    const state = parseCatalogSearchParams(
      new URLSearchParams(
        'city=Đà%20Nẵng&from=2026-12-20&to=2026-12-20&minPrice=200000&sort=latest',
      ),
    );
    const apiQuery = buildCatalogApiQuery(state, 9);
    expect(apiQuery.get('pageSize')).toBe('9');
    expect(apiQuery.get('city')).toBe('Đà Nẵng');
    expect(apiQuery.get('from')).toBe('2026-12-19T17:00:00.000Z');
    expect(apiQuery.get('to')).toBe('2026-12-20T16:59:59.000Z');
    expect(apiQuery.get('minPrice')).toBe('200000');
    expect(apiQuery.get('sort')).toBe('latest');
  });

  it('validates inverted date and price ranges', () => {
    expect(
      validateCatalogRanges(
        parseCatalogSearchParams(new URLSearchParams('from=2026-12-10&to=2026-12-01')),
      ),
    ).toBeTruthy();
    expect(
      validateCatalogRanges(
        parseCatalogSearchParams(new URLSearchParams('minPrice=500000&maxPrice=100000')),
      ),
    ).toBeTruthy();
    expect(
      validateCatalogRanges(
        parseCatalogSearchParams(new URLSearchParams('minPrice=100000&maxPrice=500000')),
      ),
    ).toBeNull();
  });

  it('computes today, weekend, and month presets in Vietnam timezone', () => {
    const wed = new Date('2026-11-25T12:00:00.000Z');
    expect(getDatePresetRange('today', wed)).toEqual({ from: '2026-11-25', to: '2026-11-25' });
    expect(getDatePresetRange('weekend', wed)).toEqual({ from: '2026-11-28', to: '2026-11-29' });
    expect(getDatePresetRange('month', wed)).toEqual({ from: '2026-11-25', to: '2026-11-30' });
  });

  it('generates active filter chips for non-default filters', () => {
    const state = parseCatalogSearchParams(
      new URLSearchParams('q=Jazz&category=MUSIC&city=Hà%20Nội&sort=price_desc'),
    );
    const chips = getActiveFilterChips(state, { MUSIC: 'Âm nhạc' });
    expect(chips.map((c) => c.key)).toEqual(['q', 'category', 'city', 'sort']);
  });
});
