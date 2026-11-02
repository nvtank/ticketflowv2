# Defense draft — 16 minutes

6m presentation, 5m live demo, 5m Q&A. Do not present unimplemented steps as working; disclose mock provider and absent cloud/UAT evidence.

| Slide | Topic                                                        | Seconds |
| ----- | ------------------------------------------------------------ | ------- |
| 1     | project, three members/five roles, sourcing status           | 30      |
| 2     | business case and acceptance workflow                        | 40      |
| 3     | modular monolith and transaction boundaries                  | 45      |
| 4     | WBS and dependencies                                         | 35      |
| 5     | actual Issues/PR/CI; velocity unavailable until real sprints | 45      |
| 6     | observed risk/blocker and authentic decision status          | 45      |
| 7     | test evidence and limits                                     | 45      |
| 8     | stakeholder/UAT and historical gap status                    | 45      |
| 9     | lessons and pending release gates                            | 30      |

Live demo (300s): organizer draft 45s → admin approval 30s → customer seat hold/order 75s → verified dev/test settlement and QR 60s → staff verify/confirm/repeat denial 60s → DB analytics 30s. This is a planned script until full flow is implemented and rehearsed. Clearly label local Docker/video fallback; no fallback video currently recorded.

Q&A (300s): explain row-lock/TTL/idempotency; why redirect is untrusted; refresh replay; organization scoping; single-node limitations and backup/restore; audit date gap; actual team contributions. Cite code/PR/logs instead of invented KPIs.
