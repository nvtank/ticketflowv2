# TF2-006 — Requirements, personas, user journeys and NFRs

**Status:** Proposed task artifact; implementation and acceptance evidence are not asserted here.  
**Scope:** TixFlow V2 local/test application described by the current source and API documentation.  
**Source of truth:** Current behavior is linked to `docs/api.md`, `docs/architecture.md` and `docs/security-test-matrix.md`. Historical `docs/qlda/` material is preserved input and is not treated as current stakeholder acceptance.

## 1. Product outcome

TixFlow V2 supports the organizer → approval → booking → verified settlement → QR ticket → check-in → analytics workflow. Customers discover published events and manage their own bookings. Organizers manage events belonging to their approved organizations. Administrators review event submissions and manage platform operations. Assigned staff validate tickets for their assigned events.

The application must give each role a clear next action, preserve server-side authorization and ownership boundaries, and explain loading, empty, validation, conflict and service-failure states without suggesting that an unconfirmed action succeeded.

## 2. Personas and access boundaries

| Persona       | Goal                                                                                                   | Allowed scope and key constraints                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Customer      | Find an event, reserve seats, pay through an enabled provider, retrieve a ticket and see order status. | Public event discovery; own holds, orders, payments, tickets and profile. Prices and payment results are authoritative on the server.                     |
| Organizer     | Create and publish events, configure inventory, assign event staff and understand sales/attendance.    | Must have active membership in an approved organization. May read/change only events in that organization and only through allowed lifecycle transitions. |
| Administrator | Review submitted events, manage users/organizations and monitor service health.                        | Admin-only review and management endpoints. Decisions must be validated and audited.                                                                      |
| Event staff   | Admit ticket holders at the event.                                                                     | Active assignment to the event is required. A valid ticket can be consumed only once; staff access does not grant organizer or admin powers.              |

Authentication is session-based. Roles are resolved from current database state; UI visibility is not an authorization control. See `docs/api.md` and `docs/security-test-matrix.md` for route-level details.

## 3. User journeys and required states

### 3.1 Customer: discover, book and attend

1. Browse the public catalog; apply supported filters and open an event detail page.
2. Choose available seats and request a hold. Show server-confirmed selection, expiry and total; do not treat a client-side selection or realtime message as ownership.
3. Create an order from the active hold and continue to the configured payment flow. Show pending/confirmed/expired/cancelled or manual-review status from the API.
4. Open the owned ticket and present its QR credential. On arrival, staff scans and confirms it; show the one-time result.

| State                         | Required user experience                                                                                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading                       | Keep the page structure stable; show a progress/skeleton state and prevent duplicate submissions while a mutation is pending.                                          |
| Empty catalog/search          | Say no matching events were found; offer to clear or change filters. Never imply a service error.                                                                      |
| No seats available            | Explain that inventory changed or is sold out; refresh authoritative inventory and provide a path back to event details.                                               |
| Hold/order conflict or expiry | Explain that the requested seats are no longer held or the hold expired; refresh server state and let the customer choose again. Do not display stale prices as final. |
| Payment pending/uncertain     | State that settlement is not yet confirmed and offer status refresh. Do not issue or show a valid ticket until the server confirms settlement.                         |
| No orders/tickets             | Provide a discovery link and distinguish an empty account from a failed request.                                                                                       |
| Unauthorized/expired session  | Offer sign-in or session recovery, preserving a safe return destination where supported.                                                                               |
| API/network failure           | Show a retry action and a concise message; preserve safe user input and avoid claiming a write succeeded.                                                              |
| Reused/invalid QR             | Show the server result (invalid, wrong event, expired or already used) without exposing another customer's data.                                                       |

### 3.2 Organizer: configure and submit an event

1. Open the organizer workspace and select an organization for which the user has an active membership.
2. Create or edit a draft with event details, schedule, venue, ticket policy and seat map.
3. Review validation feedback, then submit the complete draft for admin review.
4. Track pending, approved/published or rejected status and the recorded review history. For a published event, review available analytics and assigned staff.

| State                      | Required user experience                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| No organization/membership | Explain that an approved organization membership is needed; do not show another tenant's records.                                     |
| No events                  | Offer draft creation when the account has an eligible organization.                                                                   |
| Invalid draft              | Identify each invalid field and explain schedule, inventory or policy constraints next to the relevant control.                       |
| Save/submit conflict       | Preserve the draft where possible, explain that lifecycle/content changed, and reload authoritative data before retry.                |
| Pending review             | Clearly label the event as pending and explain that it is not yet publicly bookable.                                                  |
| Rejected                   | Show the review reason when available and allow correction/resubmission only through permitted lifecycle rules.                       |
| Empty analytics            | Explain that there is no qualifying activity for the selected period; do not fabricate zero-valued business events or sample revenue. |
| Load/write failure         | Keep current form values, report whether save outcome is known, and provide retry/reload as appropriate.                              |

### 3.3 Administrator: review and manage

1. Open the pending review queue and inspect an event, its organization, schedule, enabled inventory and history.
2. Approve or reject with a reason where required. Show the persisted outcome only after the server confirms it.
3. Use organization, user and monitoring tools within admin scope.

| State                             | Required user experience                                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Empty review queue                | State that there are no pending submissions.                                                                                            |
| Invalid/incomplete event          | Explain which review requirements are unmet; do not offer a successful approval state.                                                  |
| Concurrent decision               | Show that another action changed the event, then refresh its status and history.                                                        |
| Permission/session failure        | Deny access and provide a safe route to sign in; never render protected data as a fallback.                                             |
| Monitoring dependency unavailable | Identify the unavailable dependency at a user-safe level and retain the actual unhealthy status; do not show fabricated healthy values. |

### 3.4 Staff: check in an assigned event

1. Open the staff workspace and choose an event with an active assignment.
2. Scan or enter a ticket credential and inspect the server validation response.
3. Confirm a valid ticket once and show the resulting attendance status.

| State                                    | Required user experience                                                         |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| No assigned events                       | Explain that no event is currently assigned.                                     |
| Camera unavailable/permission denied     | Explain the permission issue and offer the supported manual fallback if present. |
| Invalid, wrong-event or non-valid ticket | Give a clear rejection without leaking ticket-owner information.                 |
| Already checked in/concurrent scan       | Show the authoritative consumed status; never count a second admission.          |
| Network/API failure                      | Do not show admission success; allow safe retry after connectivity returns.      |

## 4. Functional requirements

| ID    | Requirement                                                                                                                                                                       | Source/trace                                                      |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| FR-01 | Public users can browse only published events from approved organizations; list filtering and detail pages use API data.                                                          | `docs/api.md` — Event management                                  |
| FR-02 | A customer can hold eligible seats, create an order from their own hold, and retrieve only their own orders/tickets. Server state determines ownership, price and payment status. | `docs/api.md` — Reservations and checkout; Payment and ticketing  |
| FR-03 | An organizer can manage drafts and staff only within an approved organization they belong to.                                                                                     | `docs/api.md` — Event management; `docs/security-test-matrix.md`  |
| FR-04 | An administrator can approve or reject eligible submissions; decisions and lifecycle changes are audited.                                                                         | `docs/api.md` — Event management                                  |
| FR-05 | Assigned staff can validate a ticket only for an assigned event; check-in is atomic and one-time.                                                                                 | `docs/architecture.md` — Check-in; `docs/security-test-matrix.md` |
| FR-06 | Every data-backed screen distinguishes pending, empty, denied/invalid and failed states and offers recovery where safe.                                                           | This task; verify against journeys above                          |
| FR-07 | User-facing success is displayed only after authoritative API confirmation; retryable writes use the endpoint's idempotency/conflict semantics.                                   | `docs/api.md`; `docs/architecture.md`                             |

## 5. Non-functional requirements

| ID                                              | Requirement / acceptance target                                                                                                                                                                    | Verification evidence required                                                                                                                                                                                                |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-01 Tenant isolation                         | Every organizer read/write is scoped to active organization membership. Foreign-tenant identifiers must not reveal or mutate records. Admin bypass is explicit and limited to admin routes/policy. | Integration cases for own tenant, foreign tenant, removed membership and admin; record status codes and confirm no cross-tenant data in responses.                                                                            |
| NFR-02 Role and ownership enforcement           | API authorization is default-deny and checked server-side on each request. Customer orders/tickets and staff assignments are owner/event scoped.                                                   | Role × endpoint negative/positive matrix, including stale/revoked session and direct API requests that bypass the UI.                                                                                                         |
| NFR-03 Input validation                         | DTO schemas reject unknown fields and invalid values; server owns price, state transitions and identity. Errors are safe and actionable.                                                           | Boundary tests for missing, malformed, out-of-range and extra fields, plus attempts to inject role/owner/price/status.                                                                                                        |
| NFR-04 Responsive layout                        | Core customer, organizer, admin and staff journeys work at 320 px and 390 px CSS viewport widths without horizontal page overflow, clipped actions or inaccessible dialogs/forms.                  | Browser runs at exactly 320 px and 390 px; capture viewport, route, browser, result and any issue. Existing project configs are evidence candidates, not proof for every journey.                                             |
| NFR-05 Performance (target, not measured claim) | On representative mobile conditions, target p75 LCP ≤ 2.5 s, INP ≤ 200 ms and CLS ≤ 0.1 for key public/customer routes. Establish a repeatable baseline before claiming compliance.                | Record build/revision, routes, device/emulation, network/CPU profile, sample count, raw report and percentile. Use field data when available; label lab data as lab data. No performance result is asserted by this document. |
| NFR-06 Resilience and correctness               | A transient failure, stale response or duplicated request must not create duplicate reservations, payments, check-ins or misleading success feedback.                                              | Integration/browser scenarios for retry, stale inventory, timeout/unknown payment result, duplicate webhook and duplicate scan; report actual run output.                                                                     |
| NFR-07 Privacy and errors                       | Do not expose credentials, session tokens, private customer data or internal stack details in UI/logs.                                                                                             | Inspect API error payloads and representative logs; run secret/PII checks against generated evidence.                                                                                                                         |
| NFR-08 Accessibility and input                  | Journeys are operable by keyboard and touch; controls have labels, visible focus and accessible validation/status announcements. Respect reduced-motion preference.                                | Keyboard pass through each core journey, accessibility scan and reduced-motion browser check. Record tool/version and findings.                                                                                               |

## 6. Acceptance evidence record

This is a template for evidence produced by an actual run. Do not fill it with expected or reconstructed results.

| Check                                     | Revision/date | Environment and method                        | Result/artifact          |
| ----------------------------------------- | ------------- | --------------------------------------------- | ------------------------ |
| Tenant isolation and role matrix          | Pending       | Isolated local/test database; API integration | Pending actual execution |
| Validation boundaries                     | Pending       | API integration                               | Pending actual execution |
| Customer journey and failure/empty states | Pending       | Browser E2E, desktop + 320/390 px             | Pending actual execution |
| Organizer/admin/staff journeys            | Pending       | Browser E2E, desktop + 320/390 px             | Pending actual execution |
| Mobile performance baseline               | Pending       | Defined mobile profile and repeatable run     | Pending measurement      |
| Keyboard/reduced motion                   | Pending       | Browser manual/automated accessibility review | Pending actual execution |

Completion requires attaching real run artifacts/results and review by the responsible human reviewer. Issue estimate/priority/assignee are project-planning metadata and do not establish implementation or acceptance.

## 7. Traceability and limits

- Architecture and API constraints: [`../architecture.md`](../architecture.md), [`../api.md`](../api.md).
- Existing security matrix: [`../security-test-matrix.md`](../security-test-matrix.md). Its recorded statuses belong to that document's stated execution context and are not new evidence for this task.
- Responsive and journey suites are listed in the repository Playwright configs and `e2e/`; passing older suites does not prove these scenarios or NFR targets without matching artifacts.
- This document defines requirements and verification criteria. It does not claim this issue is complete, tests have passed, performance targets are met, or a human reviewer has accepted the work.
