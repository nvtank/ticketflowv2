# Reconstructed personal-project import timeline

**SIMULATED IMPORT metadata.** Actual import actor: `nvtank`. The code is inherited from `nvtank/ticketflow-aws` at `91833bcc0048b596c2dbf7e9dc25358c77541daf`; allocated author names/dates are not proof those accounts implemented it during those weeks.

This branch starts from V2 main `a8be99de5750a4cc159ea1d68fc84aa75516223f`, preserving shared ancestry and supporting a normal PR. Earlier real main commits retain their original dates. No existing branch is force-pushed or rewritten.

| Week | Role/account | Simulated date | Functional import |
| --- | --- | --- | --- |
| W1 | A / nvtank | 2026-08-31T10:00:00+07:00 | provenance |
| W1 | B / TuanAn0311 | 2026-09-03T10:00:00+07:00 | workspace |
| W2 | B / TuanAn0311 | 2026-09-08T10:00:00+07:00 | identity |
| W2 | C / nguyen-van-hoan | 2026-09-09T14:00:00+07:00 | web-shell |
| W2 | A / nvtank | 2026-09-10T10:00:00+07:00 | local-ops |
| W3 | B / TuanAn0311 | 2026-09-16T10:00:00+07:00 | events-api |
| W3 | C / nguyen-van-hoan | 2026-09-17T14:00:00+07:00 | events-ui |
| W4 | B / TuanAn0311 | 2026-09-22T10:00:00+07:00 | inventory-api |
| W4 | C / nguyen-van-hoan | 2026-09-24T14:00:00+07:00 | inventory-ui |
| W5 | B / TuanAn0311 | 2026-09-29T10:00:00+07:00 | booking-api |
| W5 | C / nguyen-van-hoan | 2026-10-01T14:00:00+07:00 | booking-ui |
| W6 | B / TuanAn0311 | 2026-10-06T10:00:00+07:00 | payments-api |
| W6 | C / nguyen-van-hoan | 2026-10-08T14:00:00+07:00 | payments-ui |
| W7 | B / TuanAn0311 | 2026-10-13T10:00:00+07:00 | checkin-api |
| W7 | C / nguyen-van-hoan | 2026-10-15T14:00:00+07:00 | checkin-ui |
| W7 | B / TuanAn0311 | 2026-10-16T10:00:00+07:00 | optional-api |
| W7 | C / nguyen-van-hoan | 2026-10-18T10:00:00+07:00 | optional-ui |
| W8 | A / nvtank | 2026-10-23T10:00:00+07:00 | ops-ci |
| W9 | C / nguyen-van-hoan | 2026-10-29T10:00:00+07:00 | browser-qa |
| W9 | A / nvtank | 2026-11-02T10:00:00+07:00 | evidence |

W8 contains CI/security/validation tooling only; actual AWS/HTTPS deployment is not present in the source and is not claimed. W9 contains browser QA and import evidence. Earlier source test reports are reference material; current-run evidence is in `import-validation/RESULTS.json`. Only the final application snapshot was tested.
