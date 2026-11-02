# Contribution policy

Temporary owner instruction, 2026-11-02: GitHub requires PRs and passing `quality`, with required approval count set to **0** while the team bootstraps. Review requests are optional during this exception. This changes the merge gate only; it does not create peer-review evidence or satisfy the course peer-approval criterion. Restore one approval before formal QLDA acceptance. Earlier review/DoD requirements below describe the target course policy.

Read MASTER_PROMPT.md and the QLDA source first. Use one accountable DRI and a different reviewer per issue. Current identity must be authenticated; do not set author/date to imitate another member.

DoR: user value, bounded scope, testable AC, dependencies, DRI, proposed estimate, environment and security notes; PM confirms sprint selection. DoD: implemented AC, meaningful tests, lint/format/typecheck/build/security checks, independent human approval, green required CI, merged PR, docs and evidence updated. Governance meetings require actual attendance/decisions.

Create `feature/TF2-xxx-description`, `fix/...` or `docs/...`; use Conventional Commits. PRs explain outcome, Issue/WBS, test commands/results and risk/migration implications. Do not push implementation directly to main. Empty repository bootstrap contains supplied requirements only; subsequent code enters main through reviewed PRs. Stacked draft PRs may be used while reviews are pending; document their base dependency. Never merge before real peer approval and passing CI.

Statuses: Backlog → Ready (DoR) → In Progress → In Review (PR) → Done (merged/DoD). Blocked is a label, not a fabricated completion. Estimates, capacity, velocity and burndown require real sources.
