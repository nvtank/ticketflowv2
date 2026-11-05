# CR-20261105-002 — temporary public staging

Actual decision date: 05 November 2026. Request/decision authority: the user/PM operating as nvtank. Source: explicit session response, “Cho phép Quick Tunnel để có staging HTTPS công khai tạm thời”. This records that approval only; it does not claim CCB consensus, instructor approval or stakeholder sign-off.

## Observed problem and approved change

The user confirmed no host/domain was available. TF2-026 therefore had local TLS/readiness/error-log evidence but no externally reachable staging URL. The PM approved using a free, temporary Cloudflare Quick Tunnel around the isolated production-mode local stack. No paid AWS resource or production DNS change occurred. Payment processing remained disabled.

The helper restricted public publishing to an explicit flag and a generated HTTPS origin, kept API/DB/Redis private, and verified the local CA on its origin connection. The public checker observed eight successful checks: certificate trust/hostname, browser assets, API readiness, secure cookies, bearer authentication, foreign-origin rejection, authenticated WSS and correlated error responses.

## Actual issue and response

The first tunnel container creation failed because the Docker host used journald while the command supplied json-file rotation options. No tunnel container or public endpoint was created by that failed attempt. The command was corrected to explicitly select json-file, and startup then supplied a public HTTPS URL. Source: `scripts/quick_tunnel.py`, commit `5ad9cec`, and the actual public verification report.

## Impact and remaining gates

- Temporary staging was implemented without procuring a domain or claiming durable hosting. The URL depends on the local computer, tunnel and Internet and can change after restart.
- Stop/restart procedures retain data volumes and restore the local browser origin. No global Docker cleanup was used.
- Sprint 1/Sprint 2 retrospective attendance and decisions remain PENDING_HUMAN. Team acceptance of the scope/capacity change remains unconfirmed beyond the PM's explicit authorization.
- The original AWS/durable deployment goals remain separate and incomplete. This change does not manufacture historical execution dates, stakeholder acceptance or a course Authenticity Gate pass.

Evidence: `docs/operations/QUICK_TUNNEL.md`, `docs/operations/evidence/public-staging-2026-11-05.json`, and the implementation PR associated with TF2-017/026.
