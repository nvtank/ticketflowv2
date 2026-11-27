# TF2-062 order confirmation email

On 2026-11-24 we selected Resend's transactional HTTP API on the Free plan. It
allows 3,000 emails per month and 100 per day for $0. One confirmation per
paid order covers the receipt and all issued tickets, so an order with
multiple tickets consumes one send. The plan fits the project's $0 operating
constraint in [CR-20261112-003](qlda/changes/CR-20261112-003-vercel-hosting-split.md).
[Resend pricing](https://resend.com/pricing)

Production activation is **PENDING_HUMAN**. Proposed account owner
`@nvtank` (PM/CloudOps) must confirm access to an existing sender domain,
approve domain verification, and provision a sending API key. The expected
provider cost is $0 and no payer is assigned or authorized for domain
purchases, upgrades, or overages. If a verified sender cannot be obtained at
zero incremental cost, keep production on the in-app inbox.
[Resend verified domains](https://resend.com/docs/dashboard/domains/introduction)

## Message and ticket access

The Vietnamese plain-text confirmation includes the order reference, event,
total paid in VND, and an HTTPS link to each ticket. The ticket page requires
sign-in, and the ticket API checks ownership before returning the signed QR.
Anyone who obtains the signed QR could present it at check-in, so keeping it
behind the ownership check protects it when emails are forwarded or mailboxes
are compromised. The message contains no signed QR, scan code, or token.

Reminders are deferred. They would consume the same daily quota and require
handling rescheduled and cancelled events as well as timed delivery.

## Delivery and operations

- Successful settlement creates the tickets, in-app notification and one
  outbox row in the same database commit when email is enabled. The order ID
  is the outbox primary key. Duplicate callbacks, unsettled orders, and old
  paid orders produce no additional email. Production with email disabled
  creates only the in-app notification.
- The API worker polls every five seconds and claims a row with a one-minute
  lease. Its HTTP request runs after the database releases the claim locks and
  has a five-second timeout. Multiple API instances can share the queue.
- Network failures, 408, 409, 429 and 5xx responses retry after 1 minute,
  10 minutes, 1 hour and 6 hours, with a maximum job age of 12 hours and
  five claimed attempts. A lost worker releases its claim at lease expiry.
  Nonretryable and exhausted jobs move to `DEAD_LETTER`. The receipt and
  tickets remain available in-app throughout.
- Retries reuse the same order idempotency key, within Resend's 24-hour
  deduplication window. Resend can reject a retry if its payload changes
  after an earlier request with that key. A provider acceptance is recorded
  as `ACCEPTED`. Inbox delivery and subsequent bounces are available through
  the provider dashboard after activation.
  [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys)
- Operators can inspect queue state using the query below. Logs contain the
  order ID, attempt, and fixed failure code or HTTP status. They omit provider
  response bodies, email text, addresses, API keys and QR credentials. A
  dead-letter entry is retained for investigation. Replaying an ambiguous
  submission outside the provider's deduplication window can send duplicates.
- Development uses a network-free stub. Automated tests and the Playwright
  API also resolve to the stub even when live settings are inherited. Test
  suites drive the worker explicitly. Stub rows cannot be claimed by the live
  worker.

```sql
SELECT "orderId", "mode", "status", "attempts", "lastFailure", "availableAt", "finishedAt"
FROM "OrderEmailDelivery"
WHERE "status" IN ('PENDING', 'DEAD_LETTER')
ORDER BY "availableAt";
```

Once activation is approved, apply the migration, configure the existing HTTPS
`PAYMENT_RETURN_ORIGIN` with the public frontend origin, and set
`ORDER_EMAIL_PROVIDER=resend`, `ORDER_EMAIL_FROM`, and `RESEND_API_KEY` in
the API's production environment. Store the key in the deployment's secret
store. Leave transactional overages and email tracking disabled. The deployment
defaults to in-app only pending the human decisions above.
