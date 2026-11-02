import { describe, expect, it } from 'vitest';
import { eventInputSchema, eventReviewSchema } from '../packages/shared/src';

describe('event contracts', () => {
  const draft = {
    title: 'Workshop',
    description: 'A real event description',
    venue: 'Main hall',
    startsAt: '2027-06-01T10:00:00Z',
    endsAt: '2027-06-01T12:00:00Z',
  };
  it('rejects reversed dates and client-controlled lifecycle/tenant fields', () => {
    expect(eventInputSchema.safeParse({ ...draft, endsAt: '2027-06-01T09:00:00Z' }).success).toBe(
      false,
    );
    expect(eventInputSchema.safeParse({ ...draft, status: 'PUBLISHED' }).success).toBe(false);
    expect(eventInputSchema.safeParse({ ...draft, organizationId: 'foreign' }).success).toBe(false);
    expect(eventInputSchema.parse(draft)).toEqual(draft);
  });
  it('requires a rejection reason and only accepts supported decisions', () => {
    expect(eventReviewSchema.safeParse({ decision: 'reject' }).success).toBe(false);
    expect(eventReviewSchema.safeParse({ decision: 'reject', reason: '  ' }).success).toBe(false);
    expect(eventReviewSchema.safeParse({ decision: 'publish' }).success).toBe(false);
    expect(eventReviewSchema.parse({ decision: 'approve' })).toEqual({ decision: 'approve' });
  });
});
