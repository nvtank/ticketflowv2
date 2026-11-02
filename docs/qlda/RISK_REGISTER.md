# Risk Register v1 — 2026-11-02

Scores PROPOSED, P/I 1–5. No invented reduction or Sprint history. Review at every Sprint checkpoint.

| ID  | Risk                    | P   | I   | Score | Owner      | Trigger                            | Mitigation                         | Contingency                              | Status   | Review     |
| --- | ----------------------- | --- | --- | ----- | ---------- | ---------------------------------- | ---------------------------------- | ---------------------------------------- | -------- | ---------- |
| R01 | backend bottleneck      | 4   | 5   | 20    | TuanAn0311 | dependency carries over            | split slices, prioritize P0        | PM renegotiates scope                    | OPEN     | 2026-11-02 |
| R02 | double booking          | 3   | 5   | 15    | TuanAn0311 | two active holds                   | row locks, constraints, race tests | block checkout and investigate           | OPEN     | 2026-11-02 |
| R03 | payment verification    | 3   | 5   | 15    | TuanAn0311 | signature/amount mismatch          | verified server settlement only    | disable provider                         | OPEN     | 2026-11-02 |
| R04 | AWS cost                | 3   | 4   | 12    | nvtank     | forecast exceeds approved cap      | no paid apply without approval     | defer paid deployment                    | OPEN     | 2026-11-02 |
| R05 | secret/tenant exposure  | 3   | 5   | 15    | TuanAn0311 | scan or access test fails          | OIDC, validation, scoped queries   | revoke/rotate with owner                 | OPEN     | 2026-11-02 |
| R06 | CI failure              | 4   | 4   | 16    | nvtank     | required job red                   | reproduce exact job locally        | block merge                              | OPEN     | 2026-11-02 |
| R07 | stakeholder absent      | 4   | 5   | 20    | nvtank     | no consenting stakeholder          | PM confirms sourcing pathway       | request course guidance                  | OPEN     | 2026-11-02 |
| R08 | historical evidence gap | 5   | 5   | 25    | nvtank     | empty V2 / rewritten old dates     | honest audit and new activity      | instructor schedule decision             | OBSERVED | 2026-11-02 |
| R09 | license/provenance      | 4   | 4   | 16    | nvtank     | no tracked LICENSE                 | independent implementation         | obtain rights before reuse               | OBSERVED | 2026-11-02 |
| R10 | member availability     | 4   | 4   | 16    | nvtank     | review or tasks delayed            | confirm capacity, bounded PRs      | reschedule with team                     | OPEN     | 2026-11-02 |
| R11 | demo outage             | 3   | 5   | 15    | nvtank     | HTTPS or DB unavailable            | health, backup/restore, fallback   | use labelled local demo                  | OPEN     | 2026-11-02 |
| R12 | Projects permission     | 5   | 3   | 15    | nvtank     | missing read:project/project scope | JSON/CSV and idempotent script     | authorized user reruns after scope grant | OBSERVED | 2026-11-02 |

Evolution: baseline observed on 2026-11-02; Sprint 1/Sprint 2 reviews PENDING_HUMAN. Append actual dated changes, action and evidence; never invent improvements.
