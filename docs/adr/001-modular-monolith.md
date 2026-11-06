# ADR-001: Modular monolith

- Status: Accepted
- Scope: backend (`apps/api`), frontend (`apps/web`), shared contracts (`packages/shared`)

## Context

TixFlow sells scarce, numbered seats. Reservation, payment settlement, ticket issuance and check-in must be consistent with each other. The team is small and the delivery window is short; no paid cloud resources are authorized.

## Decision

Use **one NestJS process** (`apps/api`) split into feature modules, plus a Next.js App Router web app that proxies `/api/v1` same-origin to the API. Do not split into microservices.

## Module boundaries

| Module                                      | Owns                                                           | Writes transactionally to                          |
| ------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------- |
| `auth`, `users`                             | credentials, sessions, refresh tokens, Google identity         | User, UserSession, RefreshToken, ExternalIdentity  |
| `organizations`                             | tenancy and membership                                         | Organization, OrganizationMember                   |
| `events`, `discovery`                       | event lifecycle, seat grid, review/approval, catalog, reviews  | Event, TicketType, EventSection, Seat, EventReview |
| `booking`, `orders`                         | holds, hold expiry/reconciliation, orders                      | SeatHold, Seat(HELD), Order, OrderItem             |
| `payments`                                  | provider adapters, payment sessions, settlement, reconciliation | Payment, WebhookEvent, Order(PAID), Seat(SOLD)     |
| `tickets`                                   | signed QR credential issuance/read                             | Ticket                                             |
| `check-in`                                  | staff verify/confirm                                           | CheckIn, Ticket(USED)                              |
| `analytics`, `admin`, `monitoring`, `health` | read-side aggregates, admin actions, metrics, readiness        | AuditLog (admin actions)                           |
| `realtime`, `waiting-room`, `notifications` | Socket.IO hints, Redis admission lease, persisted receipts     | WaitingRoomSession, Notification                   |

## Transaction ownership rules

1. **Services own transactions; controllers only handle DTO/HTTP.**
2. A business invariant that spans entities (hold → order → payment → ticket → check-in) is committed in **one PostgreSQL transaction** in a single service.
3. **No network I/O inside a DB transaction** (PayOS SDK, Redis, Socket.IO). External calls happen before preparation commit or after commit.
4. **Commit, then publish**: Socket.IO events are emitted by `InventoryPublisher` after commit; a delivery failure never undoes ownership.
5. Audit entries are written inside the same transaction as the change.
6. Cross-module access goes through the owning module's service/exports, never by another module's controller.

## Consequences

- **+** Strong consistency and simple local/CI testing against real PostgreSQL/Redis.
- **+** No distributed-transaction or saga complexity.
- − One deployable scales as a unit; per-process throttling is not a distributed limiter (see `docs/api.md`).
- − Background work (hold/payment reconciliation) runs in the API process; a durable outbox/worker is future work (`docs/architecture.md`).

## Alternatives rejected

- Microservices: would require distributed settlement for a single sale and more operational cost.
- Serverless functions per route: harder transaction/lock handling and local reproducibility.
