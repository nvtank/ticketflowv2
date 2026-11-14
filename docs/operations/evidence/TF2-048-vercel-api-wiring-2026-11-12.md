# TF2-048 — Vercel web/API wiring evidence

**Status: BLOCKED / PENDING.** This note records only checks actually performed; it does not claim that the deployed application or its API integration passed.

**Observed:** 2026-11-12 14:56 UTC  
**Source revision inspected:** `f083c7892b1c82dcd4719cfb1a641d8f517e936f` (main, hosting-split CR merge)

## Deployment prerequisite

TF2-046 is GitHub issue [#67](https://github.com/nvtank/ticketflowv2/issues/67), “Vercel Node.js version config and apps/web-only deploy.” It was still **Open** at observation. Its description records that the first Vercel build failed because the project used Node 26.13.1 while the repository requires Node 24.x, and lists a successful web-only deployment URL/build log as pending acceptance evidence.

The hosting-split change [PR #70](https://github.com/nvtank/ticketflowv2/pull/70) is merged, but its [Vercel integration comment](https://github.com/nvtank/ticketflowv2/pull/70#issuecomment-6818149366) reports **Error** and has no preview URL. The repository's public GitHub Deployments API returned an empty list when checked. Therefore no successful Vercel deployment URL was available for this verification.

## API target reachability

- Local staging gateway check: `Test-NetConnection -ComputerName 127.0.0.1 -Port 3443 -InformationLevel Quiet` returned `False`; no local staging gateway was reachable on the documented port.
- Previously documented temporary Quick Tunnel: `https://achievement-rpg-camcorder-delicious.trycloudflare.com`. A read-only request to `/api/v1/health` failed at DNS resolution in this observation environment (`No such host is known`). This establishes that it was not reachable from this environment at the time; it does not establish global outage status.

## Configuration inspected

At the inspected source revision, `apps/web/next.config.ts` rewrites `/api/v1/:path*` to the origin in `API_INTERNAL_URL`, with a local-only default of `http://localhost:4100`. The API configures browser CORS from `CORS_ORIGINS`.

The actual Vercel build-time `API_INTERNAL_URL`, deployed API `CORS_ORIGINS`, and whether that CORS list contains a Vercel deployment origin were not available to inspect. No environment values or credentials were read, changed, or recorded.

## Verification not performed

Because neither a successful Vercel URL nor a reachable API target was available, this session did **not** run a Vercel page-load, catalog request, login, browser-console check, or deployed CORS preflight. No screenshot or runtime log is claimed as acceptance evidence.

No Vercel setting, API runtime setting, public DNS record, paid resource, or application data was changed.

## Unblock and finish

1. Complete TF2-046 (#67): set the Vercel Node.js Version to 24.x, deploy only `apps/web`, and record the successful URL and build log.
2. Make an approved API origin reachable from that deployment, and ensure the API CORS allowlist contains the exact Vercel origin.
3. From the deployed Vercel site, capture an actual page load plus a public catalog/API request and browser network/console result. Record the URL, observed status, timestamp, and sanitized evidence here. Do not record credentials, tokens, or personal data.
