import 'reflect-metadata';
import { createRequire } from 'node:module';
import { ValidationPipe } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type * as Dto from '../src/events/events.dto';

const require = createRequire(import.meta.url);
const { EventQueryDto } = require('../dist/events/events.dto.js') as typeof Dto;

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

describe('EventQueryDto validation', () => {
  it('accepts valid catalog filters and sort options', async () => {
    for (const sort of ['soonest', 'latest', 'price_asc', 'price_desc', 'date'] as const) {
      const parsed = (await pipe.transform(
        {
          city: '  Đà Nẵng  ',
          from: '2026-12-01T00:00:00Z',
          to: '2026-12-31T23:59:59Z',
          minPrice: '100000',
          maxPrice: '500000',
          sort,
        },
        { type: 'query', metatype: EventQueryDto },
      )) as InstanceType<typeof EventQueryDto>;

      expect(parsed.city).toBe('Đà Nẵng');
      expect(parsed.minPrice).toBe(100000);
      expect(parsed.maxPrice).toBe(500000);
      expect(parsed.sort).toBe(sort);
    }
  });

  it('rejects unknown sort values with 400 BadRequestException', async () => {
    await expect(
      pipe.transform({ sort: 'popular' }, { type: 'query', metatype: EventQueryDto }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects inverted date range (from > to) with 400 BadRequestException', async () => {
    await expect(
      pipe.transform(
        { from: '2026-12-15T00:00:00Z', to: '2026-12-01T00:00:00Z' },
        { type: 'query', metatype: EventQueryDto },
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects inverted price range (minPrice > maxPrice) with 400 BadRequestException', async () => {
    await expect(
      pipe.transform(
        { minPrice: '800000', maxPrice: '200000' },
        { type: 'query', metatype: EventQueryDto },
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
});
