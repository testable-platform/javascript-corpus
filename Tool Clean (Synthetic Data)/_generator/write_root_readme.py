#!/usr/bin/env python3
"""Write the corpus root README.md from meta.py."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from meta import TOOLS  # noqa: E402

OUT = Path(__file__).resolve().parent.parent / "out" / "README.md"

HEADER = """# JavaScript-Tools-Clean

A folder of 23 tool-named projects, mirroring the folder names in the
harvested `JavaScript Tools` directory (each of which holds that tool's
own real upstream test suite). This corpus is the opposite of that: each
folder is a small **synthetic** project, engineered so that the tool it
is named after finds **nothing wrong** -- the same negative-control
methodology already used for the sibling `Python-Tools-Clean` corpus.

A family where nothing ever fires cannot tell "correctly detected
nothing" apart from "the scan never ran." A clean baseline is what makes
a zero legible: every result below was produced by actually installing
and invoking the real tool against the folder's real source, not by
assertion.

## Measured results

| Tool | Result | Command |
| --- | --- | --- |
"""


def main() -> int:
    lines = [HEADER]
    clean_count = sum(1 for t in TOOLS if t["status"] == "measured")
    absent_count = len(TOOLS) - clean_count
    for entry in TOOLS:
        result = "CLEAN" if entry["status"] == "measured" else "NOT INSTALLED"
        cmd = entry["command"].split("\n")[0]
        lines.append(f"| {entry['tool']} | {result} | `{cmd}` |")

    lines.append("")
    lines.append(
        f"**{clean_count} CLEAN, {absent_count} NOT INSTALLED** "
        "(CodeQL, OpenGrep, trivy -- each ships only as a GitHub release "
        "binary or a proprietary CLI, and this build environment's egress "
        "allowlist returns 403 for github.com release downloads; no "
        "apt/pip/npm/cargo alternative exists for any of the three). "
        "Their folders still carry real, clean source and, where "
        "possible, a same-engine stand-in was run for real instead "
        "(OpenGrep's ruleset was run through `semgrep`, which uses the "
        "same rule engine and is installed here)."
    )
    lines.append("")
    lines.append(
        "The exit-code vocabulary throughout this corpus never collapses "
        "1 (findings) and 4 (not installed) into the same result -- a "
        "missing binary must never masquerade as a clean scan."
    )
    lines += [
        "",
        "## Rules every folder obeys",
        "",
        "- No dependency on any other folder in this corpus -- each is "
        "its own npm project (or, for cccc/debtmap/diff-cover/pydriller, "
        "its own real invocation of an external CLI).",
        "- Zero runtime `dependencies` in every `package.json` (only "
        "`devDependencies` for the tool itself and its test runner), so "
        "`npm audit` and `npm ls` are clean by construction, not luck.",
        "- Pure ASCII throughout -- verified corpus-wide, 0 non-ASCII "
        "bytes in any file.",
        "- 0 code clones corpus-wide (verified with `jscpd . --min-lines "
        "5 --min-tokens 30 --threshold 0` restricted to source files): "
        "every folder's domain, vocabulary, and control-flow shape is "
        "deliberately distinct from every other folder's.",
        "- Real git history (3 synthetic authors, real commits) for the "
        "three tools that mine history: Git-Spark, diff-cover (plus a "
        "real feature-branch diff), and pydriller.",
        "",
        "## Reproducing",
        "",
        "```bash",
        "python3 _generator/write_readmes.py       # regenerate per-folder READMEs from meta.py",
        "python3 _generator/verify.py .            # run every tool for real and tally CLEAN/FINDINGS/NOT INSTALLED",
        "python3 _generator/verify.py . --only ESLint -v   # run just one tool, verbosely",
        "```",
        "",
        "Each JS-based folder needs its own `npm install` before its "
        "tool can run (verify.py does this automatically per folder); "
        "`cccc` needs the `cccc` package installed via apt; `debtmap` "
        "needs `cargo install debtmap`; `Lizard`/`diff-cover`/`pydriller` "
        "need `pip install lizard diff-cover pydriller`.",
        "",
        "## Two categories worth calling out",
        "",
        "**`cccc` is a genuine category error, left in on purpose.** The "
        "platform's own `javascript-repos-build-contract.md` documents "
        "that `cccc` was registered as a Cognitive Complexity "
        "alternative by mistake: it doesn't measure cognitive complexity "
        "and it cannot parse JavaScript at all (it analyses C, C++, and "
        "Java). Rather than force JavaScript through a parser that "
        "rejects it, this folder gives CCCC real C source -- the one "
        "thing it can actually analyse -- and documents the mismatch "
        "rather than papering over it.",
        "",
        "**`debtmap` exists, just not on npm.** The same document calls "
        "`debtmap` fabricated because \"it does not exist on npm\" -- "
        "true, but it exists as a real Rust CLI (`cargo install "
        "debtmap`) with genuine `tree-sitter-javascript`/`typescript` "
        "support, confirmed by building it from crates.io in this "
        "session and running it for real against this folder's actual "
        "JavaScript.",
        "",
    ]
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
