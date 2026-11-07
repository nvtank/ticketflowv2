# ADR-002: PostgreSQL owns seat reservation and sale

- Status: Accepted

## Context

Many customers may try to hold the same seat at once. Overselling is the primary business risk. Redis is available but is a cache-class dependency that can lose data or lag.

## Decision

- **PostgreSQL is the only authority** for `Seat.status` (`AVAILABLE`, `HELD`, `SOLD`, `UNAVAILABLE`), `SeatHold` and `Order`.
- A hold is a group reservation made with conditional updates and row locks over **sorted seat IDs** (deterministic lock order avoids deadlocks). Failure rolls back the whole group.
- Hold TTL is `min(PostgreSQL clock + 300 s, salesEndAt)`, using the database clock, not client or app time.
- Retries are idempotent: `SeatHold` has `@@unique([userId, idempotencyKey])`, `Order` has `@@unique([userId, idempotencyKey])`, and `Order.holdId` is unique (one order per hold).
- Expired holds are treated as available on read (projection) and reclaimed by an idempotent reconciliation scan; reclaim never depends on cleanup and never clears `SOLD`.
- Schema constraints back the rules: composite FKs keep seat/section/event consistent, `HELD` requires a non-null `holdId`, and a partial unique index allows only one `VALID`/`USED` ticket per seat (see `docs/database.md`).
- **Redis never authorizes a purchase.** It is used for the optional Socket.IO adapter and the waiting-room admission lease only; gate I/O happens before the booking transaction and the DB deadline is rechecked inside it.
- Frontend seat selection is transient UI state; only the server hold counts.

## Consequences

- **+** No oversell even if Redis is down or stale.
- **+** Realtime is a hint: clients refetch REST snapshots and compare `inventoryRevision`.
- − Hot events concentrate contention in PostgreSQL; the waiting room throttles admission. Capacity numbers are local contention tests only and imply no public capacity.

## Alternatives rejected

- Redis lock/lease as the seat owner: loses the single source of truth on failure.
- Optimistic overselling with later cancellation: unacceptable customer outcome.
