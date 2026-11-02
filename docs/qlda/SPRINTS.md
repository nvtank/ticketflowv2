# Sprint forecast — PROPOSED from actual inception

| Milestone              | Forecast              | Gate                                                       |
| ---------------------- | --------------------- | ---------------------------------------------------------- |
| Kickoff                | 2026-11-02–11-08      | source audit, stakeholder, baseline, architecture, backlog |
| S1 Foundation & Events | 2026-11-09–11-22      | foundation, four-role auth, draft/review/catalog           |
| S2 Inventory & Booking | 2026-11-23–12-06      | seats, atomic holds, server-priced orders                  |
| S3 Payments & Check-in | 2026-12-07–12-20      | settlement, QR, check-in, analytics                        |
| S4 Cloud & Acceptance  | 2026-12-21–2027-01-03 | approved HTTPS, regression, UAT, evidence                  |

Milestones prefixed `Baseline audit —` preserve original due dates without claiming completed work. Execution issues are assigned forecast milestones only. Capacity, Planning Poker, sprint commitments and schedule sign-off: PENDING_HUMAN. No actual velocity yet; do not interpret proposed SP as capacity.

Critical dependency forecast: TF2-007 → 008/009/011 → 012/014/018 → 020/022 → 027/028/030 → 032/034 → 041/042 → 044/045. Parallel cloud and UI work depends on stable contracts. CPM durations/float require team effort estimates; path is a dependency forecast, not measured critical duration.

Checkpoints: W1 baseline, W3 S1, W5 S2, W7 S3, W9 S4. Each checks dependencies, defects, risks, stakeholder and evidence. Burn/velocity use actual GitHub close events and issue estimates after team acceptance; absence of close events means no completed work, not a fabricated ideal line.

Meeting template: actual date/time/timezone; attendees; issue/PR evidence; planned vs accepted SP; demo results; blockers; decisions; actions/DRI/due; approval source. Planning 45m, review 30m, retrospective 30m (4Ls: Liked/Learned/Lacked/Longed For or Sailboat). All meeting instances: PENDING_HUMAN.
