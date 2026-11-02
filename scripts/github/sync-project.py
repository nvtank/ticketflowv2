#!/usr/bin/env python3
"""Idempotent Project fields/status/items setup; dry run unless --apply."""

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
OWNER = "nvtank"
TITLE = "TixFlow V2 Delivery"
STATUSES = ["Backlog", "Ready", "In Progress", "In Review", "Done"]
FIELDS = {"Sprint": "SINGLE_SELECT", "Priority": "SINGLE_SELECT", "Story Points": "NUMBER",
          "WBS": "TEXT", "Module": "TEXT", "DRI": "TEXT", "Target Week": "TEXT",
          "Actual Start": "DATE", "Actual Done": "DATE", "Evidence URL": "TEXT"}
COLORS = ["GRAY", "BLUE", "YELLOW", "PURPLE", "GREEN"]


def gh(*args):
    result = subprocess.run(["gh", *args], capture_output=True, text=True, check=False)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    return json.loads(result.stdout) if result.stdout.strip() else None


def gql(query, **variables):
    args = ["api", "graphql", "-f", f"query={query}"]
    for key, value in variables.items():
        args += ["-f", f"{key}={value}"]
    response = gh(*args)
    if response.get("errors"):
        raise RuntimeError(json.dumps(response["errors"]))
    return response["data"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    opts = parser.parse_args()
    if not opts.apply:
        print(json.dumps({"dry_run": True, "title": TITLE, "owner": OWNER,
                          "statuses": STATUSES, "fields": FIELDS}, indent=2))
        return 0
    result = {"observed_at": datetime.now(timezone.utc).isoformat(), "status": "BLOCKED", "url": None}
    try:
        projects = gh("project", "list", "--owner", OWNER, "--limit", "1000", "--format", "json")
        matches = [p for p in projects["projects"] if p["title"] == TITLE]
        if len(matches) > 1:
            raise RuntimeError("Duplicate Project title; resolve manually before sync")
        project = matches[0] if matches else gh("project", "create", "--owner", OWNER, "--title", TITLE, "--format", "json")
        number, ident = str(project["number"]), project["id"]
        result.update(url=project["url"], id=ident, number=int(number))
        gh("project", "link", number, "--owner", OWNER, "--repo", "nvtank/ticketflowv2")
        fields = gh("project", "field-list", number, "--owner", OWNER, "--limit", "100", "--format", "json")["fields"]
        status = next(f for f in fields if f["name"] == "Status")
        options = [{"id": next((o["id"] for o in status.get("options", []) if o["name"] == name), None),
                    "name": name, "color": color, "description": name} for name, color in zip(STATUSES, COLORS)]
        options = [{k:v for k,v in o.items() if v is not None} for o in options]
        # Do not replace user-defined options when all required statuses already exist.
        if not set(STATUSES).issubset({o["name"] for o in status.get("options", [])}):
            query = '''mutation($id:ID!){updateProjectV2Field(input:{fieldId:$id,singleSelectOptions:OPTIONS}){projectV2Field{... on ProjectV2SingleSelectField{id}}}}'''
            gql(query.replace("OPTIONS", "[" + ",".join("{" + ",".join(k+":"+(v if k=="color" else json.dumps(v)) for k,v in o.items()) + "}" for o in options) + "]"), id=status["id"])
        names = {f["name"] for f in fields}
        for name, kind in FIELDS.items():
            if name in names:
                continue
            args = ["project", "field-create", number, "--owner", OWNER, "--name", name, "--data-type", kind, "--format", "json"]
            if kind == "SINGLE_SELECT":
                args += ["--single-select-options", "Kickoff,S1,S2,S3,S4" if name == "Sprint" else "P0,P1,P2"]
            gh(*args)
        mapping = json.loads((ROOT / "docs/qlda/evidence/github-sync.json").read_text())
        for issue in mapping["issues"]:
            # addProjectV2ItemById is idempotent for content already in the project.
            gh("project", "item-add", number, "--owner", OWNER, "--url", issue["url"], "--format", "json")
        result["status"] = "VERIFIED_FIELDS_AND_ITEMS"
        result["remaining"] = "Populate custom field values/status from accepted sprint plan; configure Board/Table and filtered views in GitHub UI; never overwrite human status on rerun."
    except Exception as error:
        result["error"] = str(error)
        result["remediation"] = "Authorized account: gh auth refresh -h github.com -s project; then rerun this script --apply."
    (ROOT / "docs/qlda/evidence/project-sync.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))
    return 0 if result["status"].startswith("VERIFIED") else 2


if __name__ == "__main__":
    sys.exit(main())
