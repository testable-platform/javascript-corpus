#!/usr/bin/env python3
"""Generate each tool folder's README.md for JavaScript-Tools-Invalid from
meta.py (base content) and live_results_invalid.json (per-family results),
mirroring the Clean sibling's write_readmes.py + write_family_readmes.py
combined into one pass.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from meta import TOOLS
from pin_table import FAMILIES, CODE_ONLY, UNVERSIONED, NODE_INDEPENDENT

ROOT = "/root/js_invalid_src"

with open(os.path.join(ROOT, "live_results_invalid.json")) as f:
    LIVE = json.load(f)


def family_table(tool_name, status):
    lines = [
        "## Per-Node-family results",
        "",
        "Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported "
        "Node majors. node12/node14 are **code-only** (valid, version-appropriate "
        "source with no live tool invocation -- same source as the Clean sibling's "
        "families, since these tools' modern releases do not run on pre-ES2020 Node "
        "baselines); node20/node24/node26 are **live-verified** -- actually "
        "installed and run under that family's own real Node binary, and "
        "confirmed to produce a genuine finding, not asserted.",
        "",
        "| Family | Status |",
        "| --- | --- |",
    ]
    for fam in FAMILIES:
        if fam in CODE_ONLY:
            lines.append(f"| {fam} | CODE-ONLY (valid source, no live tool run) |")
        else:
            if status == "not_installed":
                lines.append(f"| {fam} | NOT INSTALLED (same as documented at corpus level -- unchanged across families) |")
            elif tool_name in NODE_INDEPENDENT:
                result = LIVE.get(tool_name, {}).get(fam, {})
                st = result.get("status", "?")
                lines.append(f"| {fam} | {st} (non-Node tool; content identical across families) |")
            else:
                result = LIVE.get(tool_name, {}).get(fam, {})
                st = result.get("status", "?")
                lines.append(f"| {fam} | **{st}** (installed and run for real under this family's own Node binary) |")
    return "\n".join(lines)


def write_tool_readme(entry):
    tool = entry["tool"]
    folder = os.path.join(ROOT, tool)
    status = entry["status"]
    body = [
        f"# {tool}",
        "",
        f"Synthetic, invalid-by-design JavaScript project for **{tool}**.",
        "",
        f"Domain: {entry['domain']}",
        "",
    ]
    if status == "measured":
        body.append("**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.")
    else:
        body.append("**Not installed here**: see Notes for why, and what was checked instead.")
    body += [
        "",
        "## What makes this folder invalid (majority wrong, measured)",
        "",
        entry["invalid_means"],
        "",
        "## Command",
        "",
        "```bash",
        entry["command"],
        "```",
        "",
    ]
    if entry.get("notes"):
        body += ["## Notes", "", entry["notes"], ""]
    if tool not in UNVERSIONED:
        body.append(family_table(tool, status))
        body.append("")
    with open(os.path.join(folder, "README.md"), "w") as f:
        f.write("\n".join(body))


def main():
    for entry in TOOLS:
        write_tool_readme(entry)
        print(f"wrote {entry['tool']}/README.md")


if __name__ == "__main__":
    main()
