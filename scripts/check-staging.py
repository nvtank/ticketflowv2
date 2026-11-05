#!/usr/bin/env python3
"""Exercise actual production containers, TLS, readiness and sanitized error logs."""
import argparse
from datetime import datetime, timezone
import json
import re
from pathlib import Path
import secrets
import ssl
import subprocess
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.local/staging'
COMPOSE = ['docker', 'compose', '--env-file', str(OUT / 'runtime.env'),
           '-f', str(ROOT / 'infrastructure/docker-compose.staging.yml')]


def command(args, **kwargs):
    return subprocess.run(args, cwd=ROOT, text=True, check=True, **kwargs)


def compose(*args, **kwargs):
    return command(COMPOSE + list(args), **kwargs)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build', action='store_true')
    parser.add_argument('--down', action='store_true', help='Stop this isolated stack afterwards, retain volumes')
    args = parser.parse_args()
    values = dict(line.split('=', 1) for line in (OUT / 'runtime.env').read_text().splitlines() if '=' in line)
    report = {'observed_at': datetime.now(timezone.utc).isoformat(), 'status': 'FAILED',
              'scope': 'isolated local staging only; not public HTTPS or stakeholder acceptance',
              'url': 'https://localhost:3443', 'payment_provider': 'disabled', 'checks': [], 'images': []}

    def check(name, passed):
        report['checks'].append({'name': name, 'passed': bool(passed)})
        if not passed:
            raise RuntimeError('Failed check: ' + name)
        print('PASS', name, flush=True)

    try:
        compose('config', '--quiet')
        if args.build:
            compose('build')
        compose('up', '-d', '--wait', '--wait-timeout', '180', 'api', 'web', 'gateway')
        # Compose considers the gateway started before its asynchronous CA exists.
        for attempt in range(30):
            probe = subprocess.run(COMPOSE + ['exec', '-T', 'gateway', 'test', '-f',
                                              '/data/caddy/pki/authorities/local/root.crt'],
                                   cwd=ROOT, capture_output=True)
            if probe.returncode == 0:
                break
            if attempt == 29:
                raise RuntimeError('Local TLS authority did not become ready')
            time.sleep(1)
        # docker cp's archive endpoint does not see this ephemeral tmpfs mount.
        certificate = compose('exec', '-T', 'gateway', 'cat',
                              '/data/caddy/pki/authorities/local/root.crt', capture_output=True).stdout
        (OUT / 'local-root.crt').write_text(certificate)
        context = ssl.create_default_context(cafile=str(OUT / 'local-root.crt'))

        def request(path, expected=200, data=None, headers=None):
            last = None
            for _ in range(30):
                try:
                    req = Request(report['url'] + path, data=data, headers=headers or {})
                    with urlopen(req, context=context, timeout=5) as response:
                        result = response.status, response.headers, response.read()
                except HTTPError as error:
                    result = error.code, error.headers, error.read()
                except (URLError, TimeoutError) as error:
                    last = error
                    time.sleep(1)
                    continue
                if result[0] == expected:
                    return result
                last = RuntimeError(f'Expected {expected}, got {result[0]} for {path}')
                time.sleep(1)
            raise RuntimeError('HTTPS check failed: ' + path) from last

        homepage = request('/')
        check('HTTPS certificate chain and hostname verified against isolated local CA', homepage[0] == 200)
        asset = re.search(r'(?:src|href)="(/_next/static/[^"?]+)', homepage[2].decode())
        check('Standalone build includes and serves browser assets', asset is not None and request(asset[1])[0] == 200)
        ready = json.loads(request('/api/v1/health')[2])
        check('Postgres and Redis readiness through HTTPS', ready['dependencies'] == {'postgres': 'up', 'redis': 'up'})
        check('Production Swagger is disabled', request('/api/docs', 404)[0] == 404)
        missing = request('/api/v1/nonexistent-staging-smoke', 404)
        error = json.loads(missing[2])
        check('Error response has request correlation and no stack trace', bool(error.get('requestId')) and 'stack' not in error)
        check('Error request ID header matches payload', missing[1].get('X-Request-ID') == error['requestId'])
        password = secrets.token_urlsafe(24)
        registration = request('/api/v1/auth/register', 201,
                               json.dumps({'name': 'Staging smoke', 'email': secrets.token_hex(8) + '@example.test',
                                           'password': password}).encode(),
                               {'Content-Type': 'application/json', 'Origin': report['url']})
        cookie = registration[1].get('Set-Cookie', '')
        check('Production refresh cookie is Secure, HttpOnly and SameSite',
              'Secure' in cookie and 'HttpOnly' in cookie and 'SameSite=Lax' in cookie)
        user = json.loads(registration[2])
        me = json.loads(request('/api/v1/auth/me', headers={'Authorization': 'Bearer ' + user['accessToken']})[2])
        check('Authentication works through HTTPS proxy', me['id'] == user['user']['id'])
        for service in ('api', 'web'):
            cid = compose('ps', '-q', service, capture_output=True).stdout.strip()
            info = json.loads(command(['docker', 'inspect', cid], capture_output=True).stdout)[0]
            check(service + ' runs non-root', info['Config']['User'] not in ('', '0', 'root', '0:0'))
            check(service + ' root filesystem is read-only', info['HostConfig']['ReadonlyRootfs'])
            check(service + ' has no host port published', not any(info['NetworkSettings']['Ports'].values()))
            check(service + ' Docker healthcheck passed', info['State']['Health']['Status'] == 'healthy')
            image = json.loads(command(['docker', 'image', 'inspect', info['Image']], capture_output=True).stdout)[0]
            check(service + ' excludes runtime secrets from image environment', not any(
                value in '\n'.join(image['Config'].get('Env') or []) for key, value in values.items() if key.startswith('STAGING_')))
            report['images'].append({'service': service, 'reference': info['Config']['Image'],
                                     'image_id': info['Image'], 'repo_digests': image.get('RepoDigests', []),
                                     'revision': image['Config'].get('Labels', {}).get('org.opencontainers.image.revision')})
        try:
            compose('stop', 'redis')
            degraded = json.loads(request('/api/v1/health', 503)[2])
            check('Redis outage yields 503 readiness', degraded['dependencies']['redis'] == 'down')
            check('Process liveness stays 200 during dependency outage', request('/api/v1/health/live')[0] == 200)
        finally:
            compose('start', 'redis')
        check('Readiness recovers after Redis restart', json.loads(request('/api/v1/health')[2])['status'] == 'ok')
        logs = compose('logs', '--no-color', 'api', capture_output=True).stdout
        check('API emits structured status and request ID logs', '"requestId"' in logs and '"statusCode":503' in logs)
        check('API logs exclude generated secrets', not any(value in logs for key, value in values.items() if key.startswith('STAGING_')))
        check('API logs exclude request password and bearer token', password not in logs and user['accessToken'] not in logs)
        (OUT / 'api.log').write_text(logs)
        report['source_revision'] = values['VCS_REF']
        report['tested_worktree_revision'] = command(['git', 'rev-parse', 'HEAD'], capture_output=True).stdout.strip()
        report['image_label_identifies_build_base'] = values['VCS_REF'] != report['tested_worktree_revision']
        report['working_tree_dirty'] = bool(command(['git', 'status', '--porcelain'], capture_output=True).stdout.strip())
        report['status'] = 'VERIFIED_LOCAL'
        (OUT / 'release.override.yml').write_text('services:\n' + ''.join(
            f'  {image["service"]}:\n    image: {image["image_id"]}\n    pull_policy: never\n'
            for image in report['images']))
    finally:
        (OUT / 'results.json').write_text(json.dumps(report, indent=2) + '\n')
        if args.down:
            compose('down', '--remove-orphans')
    print('Evidence: .local/staging/results.json and api.log; local CA is not a public certificate.', flush=True)


if __name__ == '__main__':
    main()
