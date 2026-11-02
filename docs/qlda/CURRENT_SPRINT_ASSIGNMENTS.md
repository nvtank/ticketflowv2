# Team delivery sprint: 02–08 November 2026

Assigned by the project lead's instruction on 02 November. All deadlines below are 17:00 Asia/Ho_Chi_Minh (UTC+7). This is a new execution timebox; older baseline Sprint fields and earlier forecasts are not actual work dates. Estimates, member acceptance and meeting attendance remain unconfirmed until the team responds.

| Issue | Responsible member                              | Deliverable and acceptance                                                                                                                                                                                                        | Depends on                      | Deadline   | Reviewer        |
| ----- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------- | --------------- |
| #6    | nguyen-van-hoan                                 | Requirements and organizer/customer/staff journeys; role/page/API matrix; measurable responsive/accessibility requirements; unknown stakeholder facts explicitly pending                                                          | Existing product                | 03/11/2026 | TuanAn0311      |
| #7    | TuanAn0311                                      | Reconcile C4/context/container diagrams, ERD and API/auth contracts with imported code; document decisions and environment boundaries                                                                                             | Existing product, coordinate #6 | 04/11/2026 | nvtank          |
| #37   | nvtank                                          | Production Dockerfiles for web/API; reproducible images, no embedded secrets, non-root runtime where supported, healthchecks and isolated compose smoke evidence                                                                  | #7 contract review              | 05/11/2026 | TuanAn0311      |
| #41   | TuanAn0311                                      | Security/regression matrix for RBAC, ownership, booking races, signed webhook replay, QR/check-in; triage dependency findings and attach actual test evidence                                                                     | Existing tests; #7              | 06/11/2026 | nguyen-van-hoan |
| #42   | nguyen-van-hoan; nvtank coordinates stakeholder | Prepare and execute available browser/mobile UAT cases for the full workflow; attach reproducible defects/evidence. Real stakeholder feedback/sign-off is a separate pending gate, not claimed by this deadline                   | #6; #37 for deployable build    | 07/11/2026 | TuanAn0311      |
| #26   | nvtank                                          | Staging configuration and error-log evidence; publish HTTPS only on an authorized host; coordinate actual Sprint review/retro and record attendees/actions. If hosting or attendance is unavailable, leave the unmet gate pending | #37; findings from #41/#42      | 08/11/2026 | nguyen-van-hoan |

## Team checkpoints

- 03/11 at 17:00: members confirm scope, capacity and blockers on their Issues; this is a requested response, not claimed attendance.
- 05/11 at 17:00: Docker/architecture checkpoint and demo of the locally runnable workflow.
- 08/11 at 17:00: target review/retro; record the actual time and attendance when held.
- 08/11 at 17:00: timebox closes; carry incomplete work forward explicitly without changing historic completion timestamps.

## Delivery rules

Create a feature branch from current main and link the relevant Issue in a PR. Include acceptance results, tests, limitations and screenshots where useful. Request the reviewer listed above; that reviewer must be an eligible repository collaborator. If unavailable or the PR author/pusher is that reviewer, select another eligible team member. No shared credentials or impersonated Git authorship.

Main is protected for administrators too: at least one independent approval, dismissal after new commits, approval of the last push by another person, strict `quality` CI, resolved discussions, no force push/deletion. A passing CI run alone is insufficient to merge. PRs created by the assistant remain open pending a genuine review.

The six Issues are reused, not duplicated. Milestone: `Delivery Sprint — 02–08 Nov 2026`; Project `Target date` records each task's new due date. Baseline Sprint membership stays unchanged. #42 keeps nvtank as coordinator and adds Hoan as delivery owner; stakeholder acceptance remains pending. #28 payment-provider verification and #38–#40 cloud/CD/backup remain outside this sprint unless capacity and necessary access are confirmed. No paid resources, production/DNS changes or live payment are authorized by this assignment.
