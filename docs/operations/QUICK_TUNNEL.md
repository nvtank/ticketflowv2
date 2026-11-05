# TF2-026 — approved temporary public HTTPS staging

User authorization was given in this session on 05 November 2026 for a free Cloudflare Quick Tunnel. No account, paid resource, custom domain or production DNS record was created.

Observed URL: **https://achievement-rpg-camcorder-delicious.trycloudflare.com**. Its actual verification is recorded in `evidence/public-staging-2026-11-05.json`. This address is temporary: it works only while the local computer, staging containers, tunnel and Internet remain available. It is not a durable production release or stakeholder acceptance.

## Commands

Start the verified local staging stack first, as described in STAGING.md. Publishing always requires an explicit flag:

```sh
python3 scripts/quick_tunnel.py start --allow-public
python3 scripts/check_public_staging.py
python3 scripts/quick_tunnel.py status
```

The helper uses a digest-pinned, non-root cloudflared container attached only to the staging network. The gateway still binds only to loopback on the host; the tunnel uses outbound connections. Cloudflare's public certificate is verified with system CA trust. The tunnel also verifies the private origin certificate against the copied local CA with SNI `localhost`; no TLS verification is disabled.

The generated HTTPS origin is added alongside the local origin in API CORS. Cookie-origin checks continue rejecting unrelated origins. Production cookies remain Secure/HttpOnly/SameSite, runtime payments stay disabled and the browser's Socket.IO connection uses the same public HTTPS origin. The public checker verifies actual authentication and authenticated WebSocket connection without recording passwords/tokens. Temporary test users use random `example.test` addresses in the isolated staging DB.

Docker hosts using journald require the helper's explicit json-file driver for its 5 MB × 2 log rotation. This incompatibility was observed and corrected during the actual startup; it was not an invented historical risk.

## Stop and restore local use

```sh
python3 scripts/quick_tunnel.py stop
```

This removes only the container carrying the helper's ownership label, restores the local browser origin and retains DB/Redis volumes. Name collisions with unowned containers are rejected. Do not run a broad Docker prune or remove volumes.

If the gateway is recreated, its ephemeral CA changes. Stop and start the tunnel to reload the current CA; then run the public checker. A restarted Quick Tunnel can receive a different hostname. Rerun the helper and checker to synchronize origins and retrieve the current URL; old URLs in reports are timestamped evidence, not permanent availability guarantees.

## Remaining human deliverable

TF2-026's technical public HTTPS/readiness/error-log work is verified. Its real Sprint 2 Review/Retro attendance, observations and decisions remain PENDING_HUMAN until the team provides genuine records. See `docs/qlda/SPRINT_2_REVIEW_RETRO_PENDING.md`. A green smoke test or PR approval alone does not constitute the meeting.

Configuration references: [Cloudflare private HTTPS origins](https://developers.cloudflare.com/tunnel/troubleshooting/https-origins/) and [origin parameters](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/origin-parameters/).
