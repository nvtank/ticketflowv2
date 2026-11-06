# Entity relationship diagram (TF2-007)

Source of truth: `apps/api/prisma/schema.prisma` (25 models, 10 migrations under `apps/api/prisma/migrations`). Only key columns are shown; see the schema for all fields, indexes and the SQL CHECK constraints added in migrations.

> `docs/database.md` historically says "21 models"; the schema currently contains **25**.

## Identity and tenancy

```mermaid
erDiagram
  User ||--o{ UserSession : has
  UserSession ||--o{ RefreshToken : rotates
  User ||--o{ ExternalIdentity : links
  User ||--o{ OrganizationMember : joins
  Organization ||--o{ OrganizationMember : has
  Organization ||--o{ Event : owns
  User ||--o{ AuditLog : acts

  User {
    uuid id PK
    string email UK
    enum role "CUSTOMER ORGANIZER STAFF ADMIN"
    bool isActive
  }
  UserSession {
    uuid id PK
    uuid userId FK
    ts expiresAt
    ts revokedAt
  }
  RefreshToken {
    uuid id PK
    uuid sessionId FK
    char64 tokenHash UK
    ts consumedAt
  }
  ExternalIdentity {
    uuid id PK
    string provider
    string subject "UK with provider"
  }
  Organization {
    uuid id PK
    string slug UK
    enum status "PENDING APPROVED REJECTED"
  }
  OrganizationMember {
    uuid id PK
    uuid organizationId FK "UK with userId"
    uuid userId FK
  }
  AuditLog {
    uuid id PK
    uuid actorId FK
    string action
    string entityType
    string entityId
  }
```

## Catalog, seats and holds

```mermaid
erDiagram
  Venue ||--o{ Event : hosts
  Event ||--o{ TicketType : prices
  Event ||--o{ EventSection : has
  TicketType ||--o{ EventSection : applies
  EventSection ||--o{ Seat : contains
  Event ||--o{ Seat : has
  Event ||--o{ SeatHold : has
  User ||--o{ SeatHold : holds
  SeatHold ||--o{ Seat : reserves
  Event ||--o{ EventStaffAssignment : assigns
  User ||--o{ EventStaffAssignment : staffs
  Event ||--o{ WaitingRoomSession : queues
  User ||--o{ WaitingRoomSession : waits
  Artist ||--o{ EventArtist : performs
  Event ||--o{ EventArtist : features

  Event {
    uuid id PK
    uuid organizationId FK
    uuid venueId FK
    string slug UK
    enum status "DRAFT PENDING_APPROVAL PUBLISHED REJECTED CANCELLED COMPLETED"
    int inventoryRevision
    int maxTicketsPerOrder
  }
  TicketType {
    uuid id PK
    uuid eventId FK
    int priceVnd
  }
  EventSection {
    uuid id PK
    uuid eventId FK
    uuid ticketTypeId FK
  }
  Seat {
    uuid id PK
    uuid eventId FK
    uuid sectionId FK
    string code "UK with eventId"
    enum status "AVAILABLE HELD SOLD UNAVAILABLE"
    uuid holdId FK
  }
  SeatHold {
    uuid id PK
    uuid eventId FK
    uuid userId FK
    string idempotencyKey "UK with userId"
    ts expiresAt
    ts releasedAt
  }
  EventStaffAssignment {
    uuid id PK
    uuid eventId FK "UK with userId"
    uuid userId FK
  }
  WaitingRoomSession {
    uuid id PK
    uuid eventId FK "UK with userId"
    uuid userId FK
    ts admittedAt
  }
```

## Orders, settlement, tickets and check-in

```mermaid
erDiagram
  User ||--o{ Order : places
  Event ||--o{ Order : sells
  SeatHold ||--o| Order : becomes
  Order ||--o{ OrderItem : contains
  Seat ||--o{ OrderItem : sold_as
  Order ||--o{ Payment : paid_by
  Payment ||--o{ WebhookEvent : confirmed_by
  OrderItem ||--o| Ticket : issues
  Ticket ||--o| CheckIn : consumed_by
  User ||--o{ CheckIn : scans
  User ||--o{ Notification : receives
  Ticket ||--o{ EventReview : qualifies
  User ||--o{ EventReview : writes
  Event ||--o{ EventReview : receives

  Order {
    uuid id PK
    uuid userId FK
    uuid eventId FK
    uuid holdId FK "unique"
    string idempotencyKey "UK with userId"
    enum status "PENDING_PAYMENT PAID EXPIRED CANCELLED PAYMENT_FAILED REFUND_REQUIRED"
    int totalVnd
    ts expiresAt
    ts paidAt
  }
  OrderItem {
    uuid id PK
    uuid orderId FK
    uuid seatId FK "UK with orderId"
    int priceVnd
  }
  Payment {
    uuid id PK
    uuid orderId FK "UK with provider"
    string provider
    string providerReference UK
    bigint providerOrderCode UK
    uuid idempotencyKey UK
    enum status "PENDING SUCCEEDED FAILED CANCELLED REFUND_REQUIRED"
    int amountVnd
    string_array settledReferences
  }
  WebhookEvent {
    uuid id PK
    string provider "UK with providerEventId"
    string providerEventId
    char64 payloadHash
    uuid paymentId
    string outcome
  }
  Ticket {
    uuid id PK
    uuid orderItemId FK "unique"
    uuid seatId FK
    string code UK
    char64 qrTokenHash UK
    int qrVersion
    enum status "VALID USED CANCELLED"
  }
  CheckIn {
    uuid id PK
    uuid ticketId FK "unique"
    uuid staffId FK
    ts createdAt
  }
  Notification {
    uuid id PK
    uuid userId FK
    ts readAt
  }
  EventReview {
    uuid id PK
    uuid eventId FK "UK with authorId"
    uuid authorId FK
    uuid ticketId FK
    int rating
  }
```

`WebhookEvent.paymentId` is a plain column in the schema (no Prisma relation); the line above is a logical relationship.

## Design rules encoded in the schema

| Rule                                     | Mechanism                                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| Seat, section and event stay consistent  | composite FKs `(id, eventId)` on Seat, EventSection, SeatHold, Order, OrderItem   |
| One order per hold, retries idempotent   | `Order.holdId` unique; `(userId, idempotencyKey)` unique on SeatHold and Order    |
| One payment attempt per order/provider   | `Payment @@unique([orderId, provider])`, unique `providerOrderCode`/`idempotencyKey` |
| Duplicate webhook events are detected    | `WebhookEvent @@unique([provider, providerEventId])` plus `payloadHash`           |
| One ticket per order item                | `Ticket.orderItemId` unique                                                       |
| Check-in is once-only                    | `CheckIn.ticketId` unique, plus conditional `VALID → USED`                        |
| Tenant scoping                           | `OrganizationMember` unique `(organizationId, userId)`; service-level checks      |
| Money is integer VND, time is UTC        | `Int` columns, `Timestamptz(3)`                                                   |

Raw-SQL CHECK constraints and partial unique indexes live in the migration SQL (for example one active `VALID`/`USED` ticket per seat) and are described in `docs/database.md`.

