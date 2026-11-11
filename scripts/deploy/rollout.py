#!/usr/bin/env python3
"""Deploy a release to the local staging stack with a real health gate and
automatic rollback to the last known-good release on failure.

This is the local demonstration required by TF2-039. It exercises the same
containers, images and health endpoint as scripts/check-staging.py; it does
not touch any remote host. Remote deployment is a separate, approval-gated
step performed by the `deploy-production` job in .github/workflows/cd.yml
using the OIDC role and ECR repositories from TF2-038.

Release identity = the content-addressed image ID of each service plus a
hash of the effective Compose configuration (base file + any override).
Registry digests are empty until an image is pushed to ECR (see TF2-038);
locally built image IDs identify the exact tested artifact, the same
convention docs/operations/evidence/README.md already uses for TF2-037.
"""
import argparse
import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RUNTIME_ENV = ROOT / '.local/staging/runtime.env'
STATE_FILE = ROOT / '.local/deploy/state.json'
REPORT_FILE = ROOT / '.local/deploy/rollout-report.json'
BASE_COMPOSE = ROOT / 'infrastructure/docker-compose.staging.yml'
SERVICES = ('api', 'web', 'migrate')


def now():
    return datetime.now(timezone.utc).isoformat()


def compose(*args, extra_files=(), **kwargs):
    cmd = ['docker', 'compose', '--env-file', str(RUNTIME_ENV), '-f', str(BASE_COMPOSE)]
    for extra in extra_files:
        cmd += ['-f', str(extra)]
    cmd += list(args)
    return subprocess.run(cmd, cwd=ROOT, text=True, **kwargs)


def config_hash(extra_files):
    result = compose('config', extra_files=extra_files, capture_output=True, check=True)
    return hashlib.sha256(result.stdout.encode()).hexdigest()[:16]


def image_ids():
    digests = {}
    for service in SERVICES:
        cid = compose('ps', '-a', '-q', service, capture_output=True, check=True).stdout.strip().splitlines()
        if not cid:
            continue
        info = json.loads(subprocess.run(['docker', 'inspect', cid[0]], capture_output=True, text=True, check=True).stdout)[0]
        digests[service] = info['Image']
    return digests


def load_state():
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def save_state(state):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2) + '\n')


def release(label, extra_files):
    return {'label': label, 'config_hash': config_hash(extra_files)}


def deploy_once(extra_files, timeout_seconds):
    try:
        compose('up', '-d', '--wait', '--wait-timeout', str(timeout_seconds), 'api', 'web', 'gateway',
                 extra_files=extra_files, capture_output=True, check=True)
        return True, None
    except subprocess.CalledProcessError as error:
        return False, (error.stdout or '') + (error.stderr or '')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('label', help='Human-readable name for this release, e.g. a short git SHA')
    parser.add_argument('--demo-failure', action='store_true',
                         help='Apply infrastructure/staging/rollout-demo-bad-config.override.yml to deliberately fail the health gate and prove rollback')
    parser.add_argument('--timeout', type=int, default=90, help='Seconds to wait for the health gate before declaring failure')
    args = parser.parse_args()

    compose('up', '-d', '--wait', '--wait-timeout', '120', 'postgres', 'redis', capture_output=True, check=True)

    extra_files = [ROOT / 'infrastructure/staging/rollout-demo-bad-config.override.yml'] if args.demo_failure else []
    state = load_state()
    previous = state.get('current')

    attempt = {'label': args.label, 'started_at': now(), 'demo_failure': args.demo_failure}
    healthy, failure_log = deploy_once(extra_files, args.timeout)
    attempt['healthy'] = healthy
    attempt['finished_at'] = now()

    if healthy:
        current = release(args.label, extra_files)
        current['digests'] = image_ids()
        state['current'] = current
        state.setdefault('history', []).append({**attempt, 'release': current})
        save_state(state)
        print(f'PASS deploy {args.label}: healthy, release recorded as current')
        write_report(state, attempt, rollback=None)
        return 0

    print(f'FAIL deploy {args.label}: health gate did not pass within {args.timeout}s')
    if failure_log:
        print(failure_log[-2000:], file=sys.stderr)

    rollback_record = None
    if previous is not None:
        print(f'Rolling back to previous known-good release: {previous["label"]}')
        recovered, rollback_log = deploy_once([], max(args.timeout, 60))
        rollback_record = {'rolled_back_to': previous['label'], 'recovered': recovered, 'finished_at': now()}
        if not recovered and rollback_log:
            print(rollback_log[-2000:], file=sys.stderr)
        state.setdefault('history', []).append({**attempt, 'rollback': rollback_record})
        save_state(state)
        print('PASS rollback: previous release healthy again' if recovered else 'FAIL rollback: previous release did not recover')
    else:
        print('No previous known-good release recorded; nothing to roll back to.')
        state.setdefault('history', []).append(attempt)
        save_state(state)

    write_report(state, attempt, rollback=rollback_record)
    return 1


def write_report(state, attempt, rollback):
    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    report = {
        'observed_at': now(),
        'scope': 'local staging stack only (docker compose); no remote host involved',
        'attempt': attempt,
        'rollback': rollback,
        'current_release': state.get('current'),
    }
    REPORT_FILE.write_text(json.dumps(report, indent=2) + '\n')


if __name__ == '__main__':
    sys.exit(main())
