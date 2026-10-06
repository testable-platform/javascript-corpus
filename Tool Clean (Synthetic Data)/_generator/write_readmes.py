#!/usr/bin/env python3
"""Write each tool folder's README.md from meta.py. Never touches
folders that need bespoke, hand-written READMEs (Git-Spark and
pydriller already have real narrative READMEs about their own git
history; cccc's explains the category-error framing) -- this only
fills in folders that don't have one yet, or regenerates the standard
ones so they stay in sync with meta.py.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from meta import TOOLS  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent / "out"

HAND_WRITTEN = {"Git-Spark", "pydriller", "cccc"}


def render(entry: dict) -> str:
    status_line = (
        "**Measured**: installed and actually invoked in the build "
        "environment; the result below is real, not asserted."
        if entry["status"] == "measured"
        else "**Not installed here**: see Notes for why, and what was "
        "checked instead."
    )
    lines = [
        f"# {entry['tool']}",
        "",
        f"Synthetic, clean-by-design JavaScript project for **{entry['tool']}**.",
        "",
        f"Domain: {entry['domain']}",
        "",
        status_line,
        "",
        "## What a passing result looks like",
        "",
        entry["clean_means"],
        "",
        "## Command",
        "",
        "```bash",
        entry["command"],
        "```",
    ]
    if entry["notes"]:
        lines += ["", "## Notes", "", entry["notes"]]
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    written = 0
    for entry in TOOLS:
        if entry["tool"] in HAND_WRITTEN:
            continue
        folder = ROOT / entry["tool"]
        if not folder.is_dir():
            print(f"missing folder: {entry['tool']}", file=sys.stderr)
            return 1
        (folder / "README.md").write_text(render(entry), encoding="utf-8")
        written += 1
    print(f"wrote {written} READMEs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
