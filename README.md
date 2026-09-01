# TixFlow V2

Independent implementation of an event ticketing modular monolith. Source of truth: https://github.com/nvtank/ticketflowv2.

Execution began on **2026-11-02**. Historical 9-week windows are audit references, not completed sprints. Original QLDA requirements cover 15 weeks; see [the gap](docs/qlda/15_WEEK_REQUIREMENT_GAP.md).

Team: `nvtank` PM/CloudOps; `TuanAn0311` Tech Lead/Backend; `nguyen-van-hoan` Full-stack/Frontend. Assignment does not imply commit authorship. Work in this session uses authenticated `nvtank` only.

See [Master Prompt](MASTER_PROMPT.md), [Charter draft](docs/qlda/PROJECT_CHARTER_DRAFT.md), [backlog](docs/qlda/PRODUCT_BACKLOG.md), [audit](docs/qlda/AUDIT.md), [evidence](docs/qlda/evidence/EVIDENCE_INDEX.md), and [contribution policy](CONTRIBUTING.md).

## Governance synchronization

`python3 scripts/github/sync-backlog.py --apply` synchronizes labels, milestones and 45 stable issue IDs. Without `--apply` it only validates/prints the proposed actions. `python3 scripts/github/sync-project.py --apply` requires GitHub token scope `project`. Source estimates are PROPOSED. No sprint is marked completed without real evidence.

Paid AWS resources, production/DNS changes and live payments are not authorized. Peer approvals, stakeholder confirmation, signatures and UAT remain PENDING_HUMAN.
