# Quality and test plan — PROPOSED

Test artifacts record actual date, command, exit code, environment, SHA and limitations. CI never marks unexecuted checks green. Independent review/merge remains required after local tests.

| Gate       | Scenarios                                                                                                    | Owner         |
| ---------- | ------------------------------------------------------------------------------------------------------------ | ------------- |
| Foundation | env rejects invalid secrets/origins/prod mock; readiness 503 on DB/Redis failure                             | A/B           |
| Auth       | hashed password, normalized duplicate email, CUSTOMER only, expiry/logout, refresh race/replay, RBAC/tenancy | B             |
| Events     | own-tenant edit, legal lifecycle, admin-only review, public approved-only                                    | B/C           |
| Booking    | 2/20/100 same-seat attempts, TTL/reclaim, atomic rollback, owner and server price, retry order               | B             |
| Payment    | forged redirect/signature, amount/currency/ref mismatch, duplicate/late webhook, once-only ticket            | B             |
| Check-in   | verify without consuming, assigned staff, forged ticket, concurrent once-only confirm                        | B             |
| Analytics  | settled revenue, no duplicate counts, tenant filters, zero data                                              | B/C           |
| Browser    | full four-role flow, API errors, keyboard, 320/390/desktop                                                   | C             |
| Operations | HTTPS, private data services, health rollback, encrypted backup/restore drill, no secrets                    | A             |
| UAT        | eight tasks observed by consenting stakeholder and authentic acceptance                                      | A/stakeholder |

DoR/DoD in CONTRIBUTING.md. Unit tests isolate pure policy. Integration tests use disposable real PostgreSQL/Redis and fail when dependencies unavailable. E2E uses the real application API and database. Mock provider is only for dev/test, clearly labelled. Concurrency counts are local contention scenarios and do not imply public capacity. Staging, security and UAT gates cannot be replaced by a document.
