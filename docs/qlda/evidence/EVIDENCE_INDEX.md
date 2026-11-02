# Evidence index

Execution started 2026-11-02; actor nvtank. Repository https://github.com/nvtank/ticketflowv2. Initial commit preserves supplied requirements; actual SHA/PR/run/test entries are appended after execution. No approval, meeting, UAT, cloud or live settlement is claimed.

| Evidence                        | Source                                             | Status                                   |
| ------------------------------- | -------------------------------------------------- | ---------------------------------------- |
| Original requirements           | ../../.. / MASTER_PROMPT.md and qlda/source        | VERIFIED read/preserved                  |
| Reference provenance/CI audit   | ../AUDIT.md                                        | VERIFIED observations                    |
| Charter/scope/WBS/risk/roles    | ../PROJECT_CHARTER_DRAFT.md and adjacent documents | DRAFT; human baseline acceptance pending |
| Backlog live mapping            | github-sync.json (written by sync script)          | PENDING execution                        |
| Project live mapping/permission | project-sync.json (written by sync script)         | PENDING execution                        |
| Runtime tests/CI/PR             | append actual records                              | PENDING                                  |

## Actual execution records

- Source bootstrap: `c33f3d0`, requirements only, 2026-11-02.
- Governance: `ecd74a2`, [PR #46](https://github.com/nvtank/ticketflowv2/pull/46), reviewer requested `TuanAn0311`; [CI passed](https://github.com/nvtank/ticketflowv2/actions/runs/41425584923). Human approval/merge PENDING_HUMAN.
- Live backlog: 45 Issues [#1–#45](https://github.com/nvtank/ticketflowv2/issues), 10 milestones. Verified rerun created zero duplicates. Eleven proposed `nguyen-van-hoan` assignments PENDING_HUMAN (not assignable).
- Main protection verified: one peer approval, `quality`, strict up-to-date checks, conversation resolution, admin enforcement, no force push/deletion.
- Foundation: see foundation-checks.json for exact checks and limitations. 7 unit + 2 real HTTP/DB/Redis integration tests passed. Migration applied to isolated test DB. No browser E2E or public HTTPS is claimed.
