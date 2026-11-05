#!/usr/bin/env python3
"""Generate private, isolated local staging credentials without displaying them."""
from datetime import datetime, timezone
from pathlib import Path
import secrets
import subprocess

root = Path(__file__).resolve().parents[1]
directory = root / '.local/staging'
directory.mkdir(parents=True, exist_ok=True, mode=0o700)
target = directory / 'runtime.env'
if target.exists():
    raise SystemExit('Staging environment already exists; retained existing keys and data.')
revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
release = revision[:12] + '-' + datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')
values = {'RELEASE_TAG': release, 'VCS_REF': revision}
for key in ('DB_PASSWORD', 'REDIS_PASSWORD', 'JWT_SECRET', 'TICKET_KEY'):
    values['STAGING_' + key] = secrets.token_hex(32)
with target.open('x') as file:
    target.chmod(0o600)
    file.write(''.join(f'{key}={value}\n' for key, value in values.items()))
print('Created .local/staging/runtime.env (0600); secrets not displayed. Payment provider disabled.')
