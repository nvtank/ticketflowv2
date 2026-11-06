# Architecture Decision Records (TF2-007)

ADRs record decisions that are **already implemented** in the imported source (`nvtank/ticketflow-aws`, see `docs/reference/SOURCE_IMPORT_MANIFEST.json`). They were reconciled against the code on the TF2-007 branch; they are design documentation, not new behavior and not proof of semester evidence.

| ADR                                         | Decision                                                  | Status   |
| ------------------------------------------- | --------------------------------------------------------- | -------- |
| [001](001-modular-monolith.md)              | NestJS modular monolith with per-module boundaries        | Accepted |
| [002](002-postgresql-seat-reservation.md)   | PostgreSQL (not Redis) owns seat reservation and sale     | Accepted |
| [003](003-session-and-token-model.md)       | Memory access JWT + HttpOnly rotating refresh session     | Accepted |
| [004](004-payos-webhook-idempotency.md)     | Verified, idempotent PayOS settlement with reconciliation | Accepted |

Companion documents: [C4 diagrams](../c4.md), [ERD](../erd.md), [database notes](../database.md), [API contracts](../api.md), [architecture notes](../architecture.md).

Status values: _Accepted_ = matches current code; _Proposed_ = future work. Reviewer approval is recorded on the PR, not here.

