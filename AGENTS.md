# Current project instructions

This is the user's personal TixFlow V2 project. The user explicitly authorized importing their `nvtank/ticketflow-aws` code and organizing import commits by the supplied roles and W1–W9 dates. Earlier QLDA documents are preserved historical inputs; do not present them as current academic acceptance or verified semester evidence.

- Source import is pinned to a real Git SHA and documented in `docs/reference/SOURCE_IMPORT_MANIFEST.json`. Do not copy ignored credentials or unrelated uncommitted changes from the source workspace.
- Role/date metadata allocated for the personal timeline must be clearly identified as reconstructed/SIMULATED IMPORT. It is not proof that the named accounts actually performed or authenticated the work. Record the real session actor separately.
- Role allocation: `nvtank` / `tuannguyen.120910@gmail.com` = PM/Scrum/CloudOps; `TuanAn0311` / `dqta74@gmail.com` = architecture/backend; `nguyen-van-hoan` / `nguyenvanh842k5@gmail.com` = frontend/API integration/browser E2E. See the timeline map for dates and functional groups.
- Keep shared `main` ancestry for ordinary PRs. Preserve original history and the earlier orphan simulation branch. No force-push is authorized.
- All changes to main require a PR, passing strict quality CI, resolved conversations and at least one real approval from another eligible reviewer. The latest user instruction revokes the temporary zero-approval exception. Dismiss stale approvals and require approval of the most recent push by someone other than that pusher. Never bypass protection, push directly to main or fabricate a review.
- Run appropriate lint/typecheck/format/build/unit/integration/browser checks and report actual results. Imported source functionality is inherited, not newly authored work.
- Project/Sprint status and burndown must use real GitHub Issue/PR timestamps and event history. Reconstructed commit dates must never become fabricated actual completion dates or older board transitions. Baseline dates are plan fields only.
- Use V2's isolated local/test ports and database guards. Do not alter other running projects or databases.
- No paid AWS provisioning, production/DNS changes, real payment or destructive data operation is authorized.
- Read `apps/web/AGENTS.md` and installed Next.js documentation before changing web code.
