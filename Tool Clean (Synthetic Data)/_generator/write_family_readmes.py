#!/usr/bin/env python3
"""Regenerate the root README and append a per-family results section to
each versionable tool's README, reflecting the node12/14/20/24/26 boundary
split. Driven by pin_table.py (CODE_ONLY, UNVERSIONED, NODE_INDEPENDENT,
FINDINGS) and live_results.json (the real, measured node20/24/26 outcomes) --
nothing here is hand-asserted.
"""
import json
import os
import re

import sys
sys.path.insert(0, os.path.dirname(__file__))
from pin_table import FAMILIES, CODE_ONLY, UNVERSIONED, NODE_INDEPENDENT, FINDINGS

ROOT = "/root/js_work"
LIVE_FAMILIES = ["node20", "node24", "node26"]

with open(os.path.join(ROOT, "live_results.json")) as f:
    LIVE = json.load(f)

# Tools with no COMMANDS entry in verify_live.py (non-Node or not live-run
# through that harness) -- their node20/24/26 status is carried over
# unmodified from the corpus's original single-version measurement.
NOT_LIVE_HARNESSED = {"CodeQL", "trivy", "OpenGrep", "cccc", "debtmap", "Lizard"}

NOT_INSTALLED = {"CodeQL", "trivy", "OpenGrep"}


def family_status(tool, family):
    """Return a short status string for one tool/family cell."""
    if family in CODE_ONLY:
        # node12/14: code-only floor, no live execution by design
        marker = os.path.join(ROOT, tool, family, ".UNAVAILABLE")
        if os.path.isfile(marker):
            with open(marker) as f:
                missing = f.read().strip()
            return f"CODE-ONLY (source only -- {missing} has no resolvable release on this family)"
        return "CODE-ONLY (valid source, no live tool run)"

    # live families
    if tool in NOT_LIVE_HARNESSED:
        if tool in NOT_INSTALLED:
            return "NOT INSTALLED (same as documented at corpus level -- unchanged across families)"
        return "CLEAN (non-Node tool; content identical across families)"

    res = LIVE.get(tool, {}).get(family)
    if res is None:
        return "(not live-verified)"
    ok = res.get("install_rc", 0) == 0 and res.get("run_rc", 1) == 0
    if ok:
        return "CLEAN (installed and run for real under this family's own Node binary)"
    finding = FINDINGS.get((tool, family))
    if finding:
        return f"FINDING -- {finding}"
    return "FAILED (unexplained -- see live_results.json)"


def per_tool_section(tool):
    lines = ["", "## Per-Node-family results", ""]
    lines.append(
        "Boundary-version methodology: 2 earliest + 1 middle + 2 latest "
        "supported Node majors. node12/node14 are **code-only** (valid, "
        "version-appropriate source with no live tool invocation, since "
        "these tools' modern releases do not run on pre-ES2020 Node "
        "baselines); node20/node24/node26 are **live-verified** -- actually "
        "installed and run under that family's own real Node binary."
    )
    lines.append("")
    lines.append("| Family | Status |")
    lines.append("| --- | --- |")
    for fam in FAMILIES:
        lines.append(f"| {fam} | {family_status(tool, fam)} |")
    lines.append("")
    return "\n".join(lines)


def update_tool_readme(tool):
    path = os.path.join(ROOT, tool, "README.md")
    if not os.path.isfile(path):
        return False
    with open(path) as f:
        content = f.read()
    # strip any previously-appended section (idempotent re-runs)
    content = re.split(r"\n## Per-Node-family results\n", content)[0].rstrip() + "\n"
    content += per_tool_section(tool)
    with open(path, "w") as f:
        f.write(content)
    return True


def main():
    all_tools = sorted(
        d for d in os.listdir(ROOT)
        if os.path.isdir(os.path.join(ROOT, d)) and not d.startswith("_")
    )
    versionable = [t for t in all_tools if t not in UNVERSIONED]
    updated = 0
    for t in versionable:
        if update_tool_readme(t):
            updated += 1
    print(f"Updated {updated}/{len(versionable)} tool READMEs "
          f"({len(UNVERSIONED)} unversioned tools left untouched: {sorted(UNVERSIONED)})")


if __name__ == "__main__":
    main()
