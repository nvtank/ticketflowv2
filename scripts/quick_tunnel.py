#!/usr/bin/env python3
"""Manage only the explicitly approved, temporary TixFlow public demo tunnel."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess
import time

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.local/staging'
NAME = 'ticketflowv2-staging-quick-tunnel'
LABEL = 'tixflow.component'
IMAGE = 'cloudflare/cloudflared@sha256:4955524aeaa379e154023d5a027c250f7b35041a2e7e950cf13f144bc9b9c5ba'
COMPOSE = ['docker', 'compose', '--env-file', str(OUT / 'runtime.env'), '-f', str(ROOT / 'infrastructure/docker-compose.staging.yml')]


def run(args, **kwargs):
    return subprocess.run(args, cwd=ROOT, text=True, check=True, **kwargs)


def owned_container():
    result = subprocess.run(['docker', 'inspect', NAME], capture_output=True, text=True)
    if result.returncode:
        # Distinguish no container from a broken Docker connection.
        run(['docker', 'info', '--format', '{{.ServerVersion}}'], capture_output=True)
        return None
    container = json.loads(result.stdout)[0]
    if container['Config'].get('Labels', {}).get(LABEL) != 'approved-quick-tunnel':
        raise RuntimeError('Refusing to modify an unowned container with the same name')
    return container


def set_origin(origin):
    if origin != 'https://localhost:3443' and not re.fullmatch(r'https://[a-z0-9-]+\.trycloudflare\.com', origin):
        raise ValueError('Only the isolated local or generated Quick Tunnel HTTPS origin is allowed')
    path = OUT / 'runtime.env'
    lines = [line for line in path.read_text().splitlines() if not line.startswith('STAGING_ORIGIN=')]
    path.write_text('\n'.join(lines) + '\nSTAGING_ORIGIN=' + origin + '\n')
    path.chmod(0o600)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['start', 'status', 'stop'])
    parser.add_argument('--allow-public', action='store_true', help='Explicit permission to publish this temporary staging application')
    args = parser.parse_args()
    if args.action == 'start' and not args.allow_public:
        parser.error('Public exposure requires --allow-public; no tunnel was created')
    container = owned_container()
    if args.action == 'status':
        state = json.loads((OUT / 'public-tunnel.json').read_text()) if (OUT / 'public-tunnel.json').exists() else {}
        print(json.dumps({'running': bool(container and container['State']['Running']), 'url': state.get('url')}))
        return
    if args.action == 'stop':
        if container:
            run(['docker', 'rm', '-f', NAME], capture_output=True)
        set_origin('https://localhost:3443')
        run(COMPOSE + ['up', '-d', '--wait', '--no-build', 'api', 'web', 'gateway'])
        print('Stopped the owned public tunnel; restored local-only browser origin. Data volumes retained.')
        return
    if not container:
        # Existing local staging must be healthy; this operation never builds images.
        run(COMPOSE + ['up', '-d', '--wait', '--no-build', 'api', 'web', 'gateway'])
        cert = run(COMPOSE + ['exec', '-T', 'gateway', 'cat', '/data/caddy/pki/authorities/local/root.crt'], capture_output=True).stdout
        (OUT / 'local-root.crt').write_text(cert)
        run(['docker', 'run', '-d', '--name', NAME, '--label', LABEL + '=approved-quick-tunnel',
             '--network', 'ticketflowv2-staging_default', '--restart', 'unless-stopped',
             '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges:true',
             '--log-opt', 'max-size=5m', '--log-opt', 'max-file=2',
             '--mount', f'type=bind,src={OUT / "local-root.crt"},dst=/certs/root.crt,readonly',
             IMAGE, 'tunnel', '--no-autoupdate', '--url', 'https://gateway:3443',
             '--http-host-header', 'localhost:3443', '--origin-server-name', 'localhost',
             '--origin-ca-pool', '/certs/root.crt', '--protocol', 'http2'], capture_output=True)
    elif not container['State']['Running']:
        raise RuntimeError('Owned tunnel is stopped; inspect its logs and use stop before retrying start')
    try:
        for attempt in range(90):
            logs = run(['docker', 'logs', NAME], capture_output=True)
            matches = re.findall(r'https://[a-z0-9-]+\.trycloudflare\.com', logs.stdout + logs.stderr)
            matches = [url for url in matches if url != 'https://api.trycloudflare.com']
            if matches:
                origin = matches[-1]
                break
            if attempt == 89:
                raise RuntimeError('Quick Tunnel did not provide a URL; public staging is not verified')
            time.sleep(1)
        set_origin(origin)
        run(COMPOSE + ['up', '-d', '--wait', '--no-build', 'api', 'web', 'gateway'])
        state = {'observed_at': datetime.now(timezone.utc).isoformat(), 'url': origin, 'container': NAME,
                 'image': IMAGE, 'origin_tls_verified': True, 'status': 'STARTED_NOT_VERIFIED',
                 'payment_provider': 'disabled', 'ephemeral': True,
                 'limitations': 'URL depends on the local machine, tunnel and Internet; not a durable production release.'}
        (OUT / 'public-tunnel.json').write_text(json.dumps(state, indent=2) + '\n')
        print(origin, flush=True)
    except Exception:
        # Fail closed: remove only our owned tunnel and restore safe env defaults.
        if owned_container():
            run(['docker', 'rm', '-f', NAME], capture_output=True)
        set_origin('https://localhost:3443')
        run(COMPOSE + ['up', '-d', '--wait', '--no-build', 'api', 'web', 'gateway'])
        raise


if __name__ == '__main__':
    main()
