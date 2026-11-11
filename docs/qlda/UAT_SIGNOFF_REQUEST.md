# Stakeholder UAT sign-off request — DRAFT, UNSENT

Status: PENDING_HUMAN. This document is not sent to anyone by this change.
It exists so that when a real, consenting stakeholder is identified (see
[`UAT.md`](UAT.md) — pathway PENDING_HUMAN), the request is ready to send
without inventing scope, dates or claims on the spot.

## Who this would go to

Recipient / role / organization / consent on file: PENDING. The instructor
named in project source material is not presumed to have accepted this
project or agreed to act as UAT stakeholder; no one is contacted by this
document.

## What we are asking them to validate

The same eight end-to-end workflows tracked in [`UAT.md`](UAT.md), already
covered by passing automated regression
([evidence](evidence/uat-automated-coverage-2026-11-11.json)):

1. Organizer drafts an event with two ticket prices.
2. Admin rejects, then approves, the event.
3. A customer competes for and holds a seat.
4. An expired hold is retried without a duplicate order or extended TTL.
5. A payment is verified (and a forged return redirect is rejected) before any QR issues.
6. The customer opens their own ticket QR.
7. Staff verify a ticket twice; only the first verification admits.
8. The organizer views analytics scoped to their own event.

## Message draft (unsent)

> Subject: Request to validate TixFlow V2 — eight workflows, ~30–45 minutes
>
> We'd like to ask you to try eight short workflows on an approved test
> environment (organizer event creation through admin approval, booking,
> payment, ticket QR, staff check-in, and organizer analytics). Before we
> schedule anything: could you confirm (a) your role and consent to
> participate, (b) availability for a ~30–45 minute session, and (c) any
> acceptance criteria you'd want applied beyond what's listed above? We'll
> record your actual feedback, log any defects you find, retest fixes, and
> ask you for an explicit accepted / rejected / conditional decision
> afterward — nothing is marked accepted without that.

## What happens when they respond

- Record here: actual send date, recipient's actual reply, consent given/declined.
- Schedule the session; record actual date, environment URL, and the exact commit SHA under test.
- During the session, update the "Actual" column in [`UAT.md`](UAT.md) with their real pass/fail per scenario, any defect they report (with a reproduction and a link to the fix), and retest result.
- Record their decision (accepted / rejected / conditional) with the actual signature or email evidence — not a summary — linked from both this file and `UAT.md`.

Until all of the above actually happens, this gate stays PENDING_HUMAN
regardless of how much automated evidence exists elsewhere in this repo.
