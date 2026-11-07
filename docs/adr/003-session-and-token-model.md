# ADR-003: Session and token model

- Status: Accepted

## Context

The browser app needs short-lived API credentials, revocable sessions, role/tenant authorization that cannot go stale, and optional Google sign-in.

## Decision

- **Access token**: HS256 JWT (default 900 s) validated for algorithm, issuer, audience, expiry and `tokenUse`. Held **in memory only** in the browser (Zustand); never in local/session storage.
- **Refresh token**: random value, stored **hash-only** (`RefreshToken.tokenHash`, SHA-256), sent as the `tixflow_refresh` HttpOnly, SameSite=Lax cookie scoped to `/api/v1/auth` (Secure in production). Rotated transactionally; a **replayed** token revokes the session.
- **Session** (`UserSession`) has a hard maximum age (`SESSION_MAX_DAYS`), `revokedAt`, and is revoked on logout and password change.
- **Authorization data comes from the database on every request**: current role, `isActive` and session state are loaded from PostgreSQL, so old JWTs fail immediately after revocation or lock.
- **RBAC** roles: `CUSTOMER`, `ORGANIZER`, `STAFF`, `ADMIN`. Registration can only create `CUSTOMER`. Guards are default-deny; `@Public()` opts a route out.
- **Tenancy**: organizer access requires `OrganizationMember` in an `APPROVED` organization; `ADMIN` bypass is explicit. Staff check-in requires an `EventStaffAssignment`.
- **Google login** (`ExternalIdentity`, unique `(provider, subject)` and `(userId, provider)`) is optional and disabled without `GOOGLE_CLIENT_ID`.
- Passwords: bcrypt cost 12 hashed outside transactions; 12–72 byte policy.
- Cookie-mutating requests reject cross-site Fetch Metadata / unapproved Origin. Frontend refresh is single-flight per tab and uses Web Locks across tabs; without Web Locks it fails closed.

## Consequences

- **+** XSS cannot read a long-lived credential; leaked refresh tokens are detectable.
- − One DB lookup per authenticated request (accepted for correctness).
- − Throttling is per process; use a distributed limiter before multi-instance production.

## Alternatives rejected

- Long-lived JWT in localStorage; stateless role claims trusted until expiry.
