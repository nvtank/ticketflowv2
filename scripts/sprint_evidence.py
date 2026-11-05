#!/usr/bin/env python3
"""Export only observed auth/event results; reject missing, failed or skipped reports."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def vitest_cases(report, names):
    selected = []
    found = set()
    for suite in report.get('testResults', []):
        name = Path(suite['name']).name
        if name not in names:
            continue
        found.add(name)
        assertions = suite.get('assertionResults', [])
        if not assertions or suite.get('status') != 'passed':
            raise ValueError('Missing or failed suite: ' + name)
        for test in assertions:
            if test.get('status') != 'passed':
                raise ValueError('Unexecuted or failed test: ' + test.get('fullName', name))
            selected.append({'file': name, 'name': test['fullName'], 'status': 'passed'})
    if found != set(names):
        raise ValueError('Required suite missing: ' + ', '.join(sorted(set(names) - found)))
    return selected


def browser_count(report):
    stats = report.get('stats', {})
    if report.get('errors') or not stats.get('expected') or any(
        stats.get(name, 0) for name in ('unexpected', 'skipped', 'flaky')
    ):
        raise ValueError('Browser report is missing, failed, skipped or flaky')
    return stats['expected']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--unit', type=Path, default=ROOT / '.local/test-reports/unit.json')
    parser.add_argument('--integration', type=Path, default=ROOT / '.local/test-reports/integration.json')
    parser.add_argument('--browser-root', type=Path, default=ROOT / '.local/browser-json')
    parser.add_argument('--output', type=Path, default=ROOT / '.local/sprint-evidence/s1.json')
    args = parser.parse_args()
    sources = []

    def read(path):
        raw = path.read_bytes()
        report = json.loads(raw)
        sources.append({'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(raw).hexdigest(),
                        'started_at': report.get('startTime') or report.get('stats', {}).get('startTime')})
        return report

    unit = vitest_cases(read(args.unit.resolve()), {'auth-policy.test.ts', 'events-policy.test.ts'})
    integration = vitest_cases(read(args.integration.resolve()), {'auth.integration.test.ts', 'events.integration.test.ts'})
    browsers = []
    for suite in ('auth', 'events'):
        for project in ('desktop-chromium', 'mobile-chromium'):
            report = read((args.browser_root / suite / (project + '.json')).resolve())
            browsers.append({'suite': suite, 'project': project, 'passed': browser_count(report)})
    result = {'issue': 17, 'status': 'VERIFIED_AUTOMATED',
              'observed_at': datetime.now(timezone.utc).isoformat(),
              'collection_revision': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
              'counts': {'unit': len(unit), 'integration': len(integration), 'browser': sum(r['passed'] for r in browsers)},
              'unit': unit, 'integration': integration, 'browser': browsers, 'sources': sources,
              'limitations': ['Collection revision is metadata, not proof every report ran at that commit.',
                              'Original report timestamps and hashes identify the actual executions.',
                              'Automated tests are not a retrospective, UAT sign-off or a historical sprint meeting.'],
              'sprint_1_retrospective': 'PENDING_HUMAN'}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'status': result['status'], 'counts': result['counts'], 'output': str(args.output)}))


if __name__ == '__main__':
    main()
