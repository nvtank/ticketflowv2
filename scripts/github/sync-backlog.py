#!/usr/bin/env python3
"""Idempotent GitHub synchronization. Dry run by default. Never closes issues."""

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
REPO = "nvtank/ticketflowv2"
SPRINTS = {
    "Kickoff": ("2026-11-08", "2026-09-06"),
    "S1 Foundation & Events": ("2026-11-22", "2026-09-20"),
    "S2 Inventory & Booking": ("2026-12-06", "2026-10-04"),
    "S3 Payments & Check-in": ("2026-12-20", "2026-10-18"),
    "S4 Cloud & Acceptance": ("2027-01-03", "2026-11-02"),
}
LABELS = {
    **{f"type:{x}": "1d76db" for x in ("feature", "bug", "docs", "test", "devops")},
    **{f"area:{x}": "5319e7" for x in ("frontend", "backend", "cloudops", "qlda")},
    "priority:p0": "b60205", "priority:p1": "fbca04", "priority:p2": "c5def5",
    "status:blocked": "e4e669", "needs:human": "d93f0b", "security": "b60205",
    "estimate:proposed": "bfdadc",
}


def gh(*args, payload=None):
    command = ["gh", *args]
    if payload is not None:
        command += ["--input", "-"]
    result = subprocess.run(command, input=json.dumps(payload) if payload is not None else None,
                            text=True, capture_output=True, check=False)
    if result.returncode:
        raise RuntimeError((result.stderr.strip() + "\n" + result.stdout.strip()).strip())
    return json.loads(result.stdout) if result.stdout.strip() else None


def pages(endpoint):
    result = gh("api", "--paginate", "--slurp", endpoint)
    return [item for page in result for item in page]


def load_backlog():
    rows = json.loads((ROOT / "docs/qlda/backlog.json").read_text())
    expected = {f"TF2-{n:03}" for n in range(1, 46)}
    if len(rows) != 45 or {row["id"] for row in rows} != expected:
        raise ValueError("Exactly 45 unique stable IDs required")
    if len({row["wbs"] for row in rows}) != 45:
        raise ValueError("WBS leaves must be unique")
    for row in rows:
        if row["owner"] == row["reviewer"]:
            raise ValueError("Independent reviewer required")
        if set(row["dependencies"]) - expected:
            raise ValueError("Unknown dependency")
    visited, active = set(), set()

    def visit(ident):
        if ident in active:
            raise ValueError("Dependency cycle")
        if ident in visited:
            return
        active.add(ident)
        for dep in next(row for row in rows if row["id"] == ident)["dependencies"]:
            visit(dep)
        active.remove(ident)
        visited.add(ident)

    for ident in expected:
        visit(ident)
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    opts = parser.parse_args()
    rows = load_backlog()
    if not opts.apply:
        print(json.dumps({"dry_run": True, "repository": REPO, "issues": len(rows),
                          "labels": list(LABELS), "milestones": SPRINTS}, indent=2))
        return
    actor = gh("api", "user")["login"]
    repo = gh("api", f"repos/{REPO}")
    if not repo.get("permissions", {}).get("push"):
        raise RuntimeError("Write permission required")
    snapshot = {"observed_at": datetime.now(timezone.utc).isoformat(), "repository": REPO,
                "actor": actor, "issues": [], "milestones": [], "errors": []}
    output = ROOT / "docs/qlda/evidence/github-sync.json"

    def save():
        output.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n")

    try:
        assignable = {user["login"].lower() for user in pages(f"repos/{REPO}/assignees?per_page=100")}
        labels = {label["name"] for label in pages(f"repos/{REPO}/labels?per_page=100")}
        for name, color in LABELS.items():
            if name not in labels:
                gh("api", "--method", "POST", f"repos/{REPO}/labels", payload={"name": name, "color": color})
        milestones = {m["title"]: m for m in pages(f"repos/{REPO}/milestones?state=all&per_page=100")}
        for title, dates in SPRINTS.items():
            for label, due, description in (
                (title, dates[0], "PROPOSED continuation forecast from actual inception 2026-11-02; not an accepted team commitment."),
                (f"Baseline audit — {title}", dates[1], "Historical comparison only. No work or meeting is claimed on this date. Do not assign execution issues here."),
            ):
                if label not in milestones:
                    milestones[label] = gh("api", "--method", "POST", f"repos/{REPO}/milestones", payload={
                        "title": label, "due_on": due + "T16:59:59Z", "description": description})
                snapshot["milestones"].append({k: milestones[label][k] for k in ("number", "title", "html_url", "due_on")})
        all_issues = pages(f"repos/{REPO}/issues?state=all&per_page=100")
        existing = {}
        for issue in all_issues:
            if "pull_request" in issue:
                continue
            match = re.match(r"^(TF2-\d{3})(?:\b|:)", issue["title"])
            if match:
                if match[1] in existing:
                    raise RuntimeError(f"Duplicate stable ID {match[1]}; resolve before sync")
                existing[match[1]] = issue
        for row in rows:
            sprint_title = next(title for title in SPRINTS if title.startswith(row["sprint"]))
            data = {"title": f'{row["id"]}: {row["title"]}', "body": row["body"],
                    "assignees": [row["owner"]] if row["owner"].lower() in assignable else [],
                    "labels": row["labels"] + ["estimate:proposed"] + ([] if row["owner"].lower() in assignable else ["needs:human"]),
                    "milestone": milestones[sprint_title]["number"]}
            current = existing.get(row["id"])
            if current:
                # Preserve human body edits, labels, status and assignment on reruns.
                issue = current
                action = "reused"
            else:
                issue = gh("api", "--method", "POST", f"repos/{REPO}/issues", payload=data)
                action = "created"
                existing[row["id"]] = issue
            snapshot["issues"].append({"id": row["id"], "number": issue["number"],
                "url": issue["html_url"], "node_id": issue["node_id"], "action": action,
                "assignees": [a["login"] for a in issue.get("assignees", [])],
                "proposed_owner": row["owner"],
                "assignment_status": "ASSIGNED" if any(a["login"].lower() == row["owner"].lower() for a in issue.get("assignees", [])) else "PENDING_HUMAN_NOT_ASSIGNABLE",
                "milestone": issue.get("milestone", {}).get("title") if issue.get("milestone") else None})
            save()
            print(f'{action} {row["id"]}: {issue["html_url"]}', flush=True)
    except Exception as error:
        snapshot["errors"].append(str(error))
        save()
        raise
    save()


if __name__ == "__main__":
    main()
