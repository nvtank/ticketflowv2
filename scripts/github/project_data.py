"""Read actual GitHub issue events; never infer activity from commit dates."""

import argparse
from concurrent.futures import ThreadPoolExecutor
import csv
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
REPO = 'nvtank/ticketflowv2'
OUT = ROOT / 'docs/project'
BASELINE = {
    'Kickoff': ('2026-08-31', '2026-09-06', 7),
    'S1': ('2026-09-07', '2026-09-20', 14),
    'S2': ('2026-09-21', '2026-10-04', 14),
    'S3': ('2026-10-05', '2026-10-18', 14),
    'S4': ('2026-10-19', '2026-11-02', 15),
}


def gh(*args, payload=None):
    cmd = ['gh', *args]
    if payload is not None:
        cmd += ['--input', '-']
    result = subprocess.run(cmd, input=json.dumps(payload) if payload is not None else None,
                            capture_output=True, text=True, check=False)
    if result.returncode:
        raise RuntimeError((result.stderr.strip() + '\n' + result.stdout.strip()).strip())
    return json.loads(result.stdout) if result.stdout.strip() else None


def pages(endpoint):
    return [item for page in gh('api', '--paginate', '--slurp', endpoint) for item in page]


def graphql(query, **variables):
    response = gh('api', 'graphql', payload={'query': query, 'variables': variables})
    if response.get('errors'):
        raise RuntimeError(json.dumps(response['errors']))
    return response['data']


def timestamp(value):
    return datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(timezone.utc)


def history_series(issues, observed_at):
    """Issue-count burndown, including real closes/reopens and an observed end point."""
    events = []
    for row in issues:
        events.append((row['created_at'], row['number'], -1, 'created'))
        lifecycle = [e for e in row['events'] if e['event'] in ('closed', 'reopened')]
        for index, event in enumerate(lifecycle):
            events.append((event['created_at'], row['number'], index, event['event']))
        if row.get('closed_at') and not any(e['event'] == 'closed' and e['created_at'] == row['closed_at'] for e in lifecycle):
            events.append((row['closed_at'], row['number'], len(lifecycle), 'closed'))
    events.sort(key=lambda e: (timestamp(e[0]), e[1], e[2]))
    created, opened = set(), set()
    points = []
    for date, number, _, kind in events:
        if timestamp(date) > timestamp(observed_at):
            continue
        if kind == 'created':
            created.add(number)
            opened.add(number)
        elif kind == 'closed':
            opened.discard(number)
        elif kind == 'reopened' and number in created:
            opened.add(number)
        points.append({'timestamp': date, 'scope_issues': len(created), 'remaining_issues': len(opened),
                       'issue': number, 'event': kind})
    expected = {row['number'] for row in issues if row['state'] == 'open'}
    if opened != expected:
        raise ValueError('Issue snapshot and event history disagree; recollect rather than invent a state')
    if points:
        points.append({'timestamp': observed_at, 'scope_issues': len(created), 'remaining_issues': len(opened),
                       'issue': '', 'event': 'observed_snapshot'})
    return points


def collect():
    backlog = {row['id']: row for row in json.loads((ROOT / 'docs/qlda/backlog.json').read_text())}
    assignments = json.loads((OUT / 'current-assignments.json').read_text())['issues']
    remote = pages(f'repos/{REPO}/issues?state=all&per_page=100')
    issues = []
    for issue in remote:
        match = re.match(r'^(TF2-\d{3})\b', issue['title'])
        if 'pull_request' in issue or not match or match[1] not in backlog:
            continue
        item = backlog[match[1]]
        assignment = assignments.get(str(issue['number']), {})
        issues.append({
            'id': item['id'], 'number': issue['number'], 'node_id': issue['node_id'],
            'title': issue['title'], 'url': issue['html_url'], 'state': issue['state'],
            'state_reason': issue.get('state_reason'), 'created_at': issue['created_at'],
            'updated_at': issue['updated_at'], 'closed_at': issue.get('closed_at'),
            'actual_assignees': [a['login'] for a in issue['assignees']],
            'proposed_dri': item['owner'], 'sprint': assignment.get('sprint', item['sprint']),
            'baseline_sprint': item['sprint'], 'target_date': assignment.get('target_date'), 'wbs': item['wbs'],
            'module': item['module'], 'priority': item['priority'], 'points': item['points'],
            'estimate_status': item['estimate_status'],
            'milestone': issue['milestone']['title'] if issue.get('milestone') else None,
        })
    if len(issues) != 45 or len({i['id'] for i in issues}) != 45:
        raise ValueError('Expected 45 unique real backlog issues')

    def read_events(row):
        raw = pages(f'repos/{REPO}/issues/{row["number"]}/events?per_page=100')
        row['events_url'] = f'https://api.github.com/repos/{REPO}/issues/{row["number"]}/events'
        row['events'] = [{k: e[k] for k in ('id', 'event', 'created_at') if k in e}
                         | {'actor': (e.get('actor') or {}).get('login')}
                         for e in raw if e.get('created_at')]
        return row

    with ThreadPoolExecutor(max_workers=4) as pool:
        issues = list(pool.map(read_events, issues))
    issues.sort(key=lambda i: i['number'])
    observed_at = datetime.now(timezone.utc).isoformat()
    pulls = pages(f'repos/{REPO}/pulls?state=all&per_page=100')
    pr_data = [{k:p.get(k) for k in ('number', 'title', 'html_url', 'state', 'created_at', 'updated_at', 'closed_at', 'merged_at', 'body')}
               for p in pulls]
    series = {sprint: history_series([i for i in issues if i['sprint'] == sprint], observed_at)
              for sprint in BASELINE}
    result = {'repository': REPO, 'observed_at': observed_at,
              'data_source': 'GitHub REST issue metadata and paginated actual issue events',
              'commit_dates_used': False, 'baseline_is_plan_only': True,
              'baseline': BASELINE, 'issues': issues, 'pull_requests': pr_data, 'burndown': series}
    OUT.mkdir(exist_ok=True, parents=True)
    (OUT / 'live-data.json').write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
    columns = ['id', 'number', 'sprint', 'state', 'state_reason', 'created_at', 'closed_at', 'proposed_dri', 'actual_assignees', 'url']
    with (OUT / 'issues.csv').open('w') as file:
        writer = csv.DictWriter(file, fieldnames=columns)
        writer.writeheader()
        for row in issues:
            writer.writerow({k: ','.join(row[k]) if isinstance(row[k], list) else row[k] for k in columns})
    for sprint in ['S1', 'S2']:
        with (OUT / f'burndown-{sprint.lower()}.csv').open('w') as file:
            writer = csv.DictWriter(file, fieldnames=['timestamp', 'scope_issues', 'remaining_issues', 'issue', 'event'])
            writer.writeheader()
            writer.writerows(series[sprint])
    with (OUT / 'issue-history.csv').open('w') as file:
        writer = csv.DictWriter(file, fieldnames=['issue', 'sprint', 'event', 'created_at', 'actor', 'source'])
        writer.writeheader()
        for issue in issues:
            writer.writerow({'issue':issue['number'], 'sprint':issue['sprint'], 'event':'created', 'created_at':issue['created_at'], 'source':issue['url']})
            for event in issue['events']:
                writer.writerow({'issue':issue['number'], 'sprint':issue['sprint'], 'event':event['event'], 'created_at':event['created_at'], 'actor':event['actor'], 'source':issue['events_url']})
    return result


if __name__ == '__main__':
    argparse.ArgumentParser(description=__doc__).parse_args()
    data = collect()
    print(json.dumps({'repository': REPO, 'issues': len(data['issues']), 'observed_at': data['observed_at'],
                      's1_points': len(data['burndown']['S1']), 's2_points': len(data['burndown']['S2'])}))
