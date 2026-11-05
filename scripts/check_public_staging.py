#!/usr/bin/env python3
"""Verify an already-authorized public Quick Tunnel without recording credentials."""
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import secrets
import ssl
import subprocess
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.local/staging'


def main():
    state = json.loads((OUT / 'public-tunnel.json').read_text())
    origin = state['url']
    if not re.fullmatch(r'https://[a-z0-9-]+\.trycloudflare\.com', origin):
        raise ValueError('Expected generated Quick Tunnel HTTPS origin')
    context = ssl.create_default_context()
    report = {'observed_at': datetime.now(timezone.utc).isoformat(), 'url': origin, 'status': 'FAILED',
              'payment_provider': 'disabled', 'ephemeral': True, 'checks': [],
              'limitations': ['Temporary demonstration URL; availability requires the local machine and tunnel.',
                              'Automated verification is not stakeholder UAT or a human Sprint meeting.']}

    def check(name, passed):
        report['checks'].append({'name': name, 'passed': bool(passed)})
        if not passed:
            raise RuntimeError('Failed check: ' + name)
        print('PASS', name, flush=True)

    def request(path, expected=200, data=None, headers=None):
        last = None
        for _ in range(40):
            try:
                req = Request(origin + path, data=data, headers=headers or {})
                with urlopen(req, context=context, timeout=10) as response:
                    result = response.status, response.headers, response.read()
            except HTTPError as error:
                result = error.code, error.headers, error.read()
            except (URLError, TimeoutError) as error:
                last = error
                time.sleep(2)
                continue
            if result[0] == expected:
                return result
            last = RuntimeError(f'Expected {expected}, got {result[0]} for {path}')
            time.sleep(2)
        raise RuntimeError('Public request failed: ' + path) from last

    try:
        homepage = request('/')
        check('Public HTTPS certificate and hostname verified with system CA trust', homepage[0] == 200)
        asset = re.search(r'(?:src|href)="(/_next/static/[^"?]+)', homepage[2].decode())
        check('Public browser assets are served', bool(asset) and request(asset[1])[0] == 200)
        check('Public API reports real PostgreSQL and Redis readiness', json.loads(request('/api/v1/health')[2])['status'] == 'ok')
        password = secrets.token_urlsafe(24)
        response = request('/api/v1/auth/register', 201, json.dumps({
            'name': 'Public staging smoke', 'email': secrets.token_hex(8) + '@example.test', 'password': password,
        }).encode(), {'Content-Type': 'application/json', 'Origin': origin})
        user = json.loads(response[2])
        cookie = response[1].get('Set-Cookie', '')
        check('Public authentication issues Secure HttpOnly SameSite cookies',
              'Secure' in cookie and 'HttpOnly' in cookie and 'SameSite=Lax' in cookie)
        me = json.loads(request('/api/v1/auth/me', headers={'Authorization': 'Bearer ' + user['accessToken']})[2])
        check('Public bearer authentication resolves the actual registered user', me['id'] == user['user']['id'])
        rejected = request('/api/v1/auth/login', 403, b'{}', {'Content-Type': 'application/json', 'Origin': 'https://untrusted.example'})
        check('Cross-origin write requests are rejected', rejected[0] == 403)
        result = subprocess.run(['node', 'scripts/check-public-realtime.mjs'], cwd=ROOT,
                                input=json.dumps({'url': origin, 'token': user['accessToken']}),
                                capture_output=True, text=True, check=True, timeout=25)
        realtime = json.loads(result.stdout)
        check('Authenticated realtime connects through public WSS proxy', realtime == {'status': 'passed', 'transport': 'websocket'})
        missing = request('/api/v1/nonexistent-public-smoke', 404)
        error = json.loads(missing[2])
        check('Public error responses retain request correlation without stack traces',
              bool(error.get('requestId')) and missing[1].get('X-Request-ID') == error['requestId'] and 'stack' not in error)
        report['status'] = 'VERIFIED_PUBLIC_TEMPORARY'
        state['status'] = report['status']
        state['verified_at'] = datetime.now(timezone.utc).isoformat()
        (OUT / 'public-tunnel.json').write_text(json.dumps(state, indent=2) + '\n')
    finally:
        (OUT / 'public-results.json').write_text(json.dumps(report, indent=2) + '\n')
    print(origin, flush=True)


if __name__ == '__main__':
    main()
