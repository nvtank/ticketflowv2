# ADR-004: Verified, idempotent PayOS settlement

- Status: Accepted (design reconciled with code; real bank settlement and public webhook registration are **not** verified — see `docs/payments.md`)

## Context

Payment confirmation arrives asynchronously through a webhook, through owner status polling and through a periodic reconciliation loop, and may be duplicated, late or forged. A browser redirect is attacker-controlled.

## Decision

- `PaymentProvider` is an adapter with `payos` (official `@payos/node`), `mock` (dev/test only, forbidden in production) and `disabled` implementations.
- **Only server-verified provider evidence settles an order.** Webhook payload signature is verified; status polling and reconciliation use the signed SDK. Return-URL parameters (`code`, `status`, `cancel`) are ignored for settlement.
- `POST /payments/webhook` is public but requires a valid signature; malformed/bad signature → 400. A signed sample for an unknown `orderCode` is acknowledged (`ignored`) without a sale.
- **Create flow**: lock reservation context, persist one stable `Payment` per order with a random safe-integer `providerOrderCode`, **commit, then** call PayOS. Retries reuse the same code/idempotency key; a key bound to another order or provider switch → 409.
- **Finalize** (`PaymentFinalizationService.finalize`) in one transaction:
  1. `pg_advisory_xact_lock` on `provider:eventId` (serialize duplicates, also across orders).
  2. Lock order/hold/event, then `Payment ... FOR UPDATE`.
  3. Idempotency: `WebhookEvent` unique `(provider, providerEventId)` with `payloadHash`; same hash → no-op, different hash → 409.
  4. Eligibility: exact server amount, currency `VND`, order `PENDING_PAYMENT`, order and hold not expired/released, event `PUBLISHED`, organization `APPROVED`, every seat still `HELD` by this hold.
  5. Eligible → seats `SOLD`, one signed-QR `Ticket` per `OrderItem`, order `PAID`, payment `SUCCEEDED`, `inventoryRevision` + 1, audit + notification.
  6. Ineligible (late, mismatch, reclaimed seats) → `REFUND_REQUIRED`, **no seat or ticket**, audit entry. `REFUND_REQUIRED` means manual financial review, not a completed refund.
  7. An extra distinct transfer after `PAID` marks the payment for review but never revokes or adds tickets.
- After commit: publish `seat:sold`/`order:updated`; failed/cancelled results release the hold, and expiry reconciles any release failure.
- Reconciliation: owner `GET /payments/:id/status` and a periodic loop (`PAYMENT_RECONCILE_INTERVAL_MS`) query PayOS and call the same finalization service.
- Ticket QR credentials are signed with `TICKET_SIGNING_KEY` (persistent, ≥ 48 chars in production); only a hash is stored.

## Consequences

- **+** Duplicate, concurrent, late and forged inputs cannot over-issue tickets.
- − Partial transfers and refunds remain manual.
- − Single advisory-lock keyspace per provider event; acceptable at current scale.
