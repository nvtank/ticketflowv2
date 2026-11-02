# Audit — 2026-11-02

VERIFIED: all 340 lines of MASTER_PROMPT.md, 175 lines of QLDA_PROJECT_GUIDELINES.md and 342 lines of OLD_15_WEEK_PLAN_REFERENCE.md were read. They were supplied in TixFlow_V2_Codex_9_Week_Pack and preserved unmodified at canonical paths. Canonical Master Prompt equals the initial standalone prompt.

Workspace initially contained only supplied documents and no real .git; sandbox showed reserved read-only directory stubs, so Git resolved to an unrelated uncommitted parent repository. An explicit repository was initialized at this workspace through authorized Git tooling. Origin: https://github.com/nvtank/ticketflowv2.git. Initial GitHub V2 repository was empty; authenticated account nvtank has ADMIN permission. Git identity already matched authenticated profile. No identity/date was changed.

GitHub CLI fails network calls in the sandbox and works with approved network escalation. Its token scopes are repo/workflow/read:org/gist, missing read:project/project. Connector supports issues/files/PRs but no Projects or milestone creation. GitHub Projects cannot currently be verified or created with this token. Sync scripts capture the actual failure.

Reference repository nvtank/ticketflow-aws: main observed locally at 91833bcc0048b596c2dbf7e9dc25358c77541daf. Many tracked and untracked local changes were present and left untouched. pnpm/Next/Nest/Prisma, broad auth/events/booking/payments/check-in modules and tests exist; existence does not prove test passage. Tracked LICENSE search returned none. No source code was copied. docs/commit-timeline.md explicitly describes reconstructed author/committer dates and archived original branches: reconstructed dates cannot prove continuous semester activity. Latest observed remote main workflow run 40660263105 concluded failure (https://github.com/nvtank/ticketflow-aws/actions/runs/40660263105).

Runtime initially: Node 20.20.2, pnpm 10.28.0; target runtime will be provisioned explicitly. Docker socket is denied in sandbox; local container commands require approved access. No AWS resource or payment was created.

## Source differences

| Conflict                                                      | Resolution                                                             |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 9-week audit vs 15-week course evidence                       | Course requirement remains; no retroactive evidence                    |
| Old TF-001 IDs and 6 Sprints vs Master TF2-001 IDs/4 Sprints  | Master backlog used; old plan reference only                           |
| Old realtime baseline vs Master P1 realtime                   | TF2-024 P1; cannot block core booking                                  |
| Report text mentions five members vs permitted 3–5            | Three named members cover five roles; instructor clarification pending |
| Official Charter template linked but unavailable in web fetch | Draft includes 13 explicit sections; exact template comparison pending |

Architecture/quality gaps at inception: no V2 application, migrations, CI or release. Stakeholder, capacity, signed charter, budget, planning poker and UAT unknown. Authenticity Gate not passed. Later progress must cite actual logs/PRs.
