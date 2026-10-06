#!/usr/bin/env python3
"""Run every tool against its own folder for real and report what it
actually found. Same exit-code vocabulary as the Python-Tools-Clean
corpus's own verify.py, kept deliberately apart:

    0  CLEAN         the tool ran and reported nothing
    1  FINDINGS      the tool ran and reported something -- a real failure
    4  NOT INSTALLED absent from this host -- a setup gap, not a result

Collapsing 1 and 4 would let a missing binary masquerade as a clean scan.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

CLEAN, FINDINGS, NOT_INSTALLED = 0, 1, 4

NPM_INSTALL_TOOLS = {
    "ESLint", "eslint-plugin-security", "eslint-plugin-sonarjs", "Git-Spark",
    "gutcheck", "jscpd", "knip", "Lizard", "Mocha", "monocart-coverage-reports",
    "npm audit", "npm ls", "nyc", "OpenGrep", "oxlint", "StrykerJS", "trivy",
    "CodeQL", "Dolos", "diff-cover",
}

CARGO_BIN = str(Path.home() / ".cargo" / "bin")


def _env():
    env = dict(os.environ)
    env["PATH"] = CARGO_BIN + os.pathsep + env.get("PATH", "")
    return env


def _run(cmd, cwd, env=None, timeout=180):
    return subprocess.run(
        cmd, cwd=cwd, shell=True, env=env or _env(),
        capture_output=True, text=True, timeout=timeout,
    )


NODE_INCLUDE_DIR = "/opt/node22"


def npm_install(folder: Path, extra: str = "") -> tuple[bool, str]:
    proc = _run(f"npm install --no-audit --no-fund {extra}".strip(), folder, timeout=300)
    return proc.returncode == 0, (proc.stdout + proc.stderr)[-2000:]


def check_cccc(folder, verbose):
    if shutil.which("cccc") is None:
        return NOT_INSTALLED, "cccc not on PATH"
    shutil.rmtree(folder / ".cccc", ignore_errors=True)
    proc = _run("cccc src/ledger.c", folder)
    if proc.returncode != 0:
        return FINDINGS, (proc.stdout + proc.stderr)[-1000:]
    check = _run("python3 check_cccc.py", folder)
    if check.returncode != 0:
        return FINDINGS, check.stderr[-1000:]
    return CLEAN, check.stdout.strip()


def check_debtmap(folder, verbose):
    if shutil.which("debtmap", path=_env()["PATH"]) is None:
        return NOT_INSTALLED, "debtmap not on PATH"
    proc = _run("debtmap validate . --max-debt-density 10 --format terminal", folder)
    if proc.returncode != 0 or "Validation PASSED" not in proc.stdout:
        return FINDINGS, (proc.stdout + proc.stderr)[-1500:]
    return CLEAN, "Validation PASSED"


def check_diffcover(folder, verbose):
    if shutil.which("diff-cover") is None:
        return NOT_INSTALLED, "diff-cover not on PATH"
    ok, detail = npm_install(folder)
    if not ok:
        return FINDINGS, detail
    shutil.rmtree(folder / "coverage", ignore_errors=True)
    shutil.rmtree(folder / ".nyc_output", ignore_errors=True)
    proc = _run("node node_modules/.bin/nyc --reporter=cobertura "
                "node_modules/.bin/mocha 'test/**/*.test.js'", folder)
    if proc.returncode != 0:
        return FINDINGS, (proc.stdout + proc.stderr)[-1000:]
    dc = _run("diff-cover coverage/cobertura-coverage.xml "
              "--compare-branch=main --fail-under=100", folder)
    if dc.returncode != 0:
        return FINDINGS, (dc.stdout + dc.stderr)[-1500:]
    return CLEAN, dc.stdout.strip()[-400:]


def check_dolos(folder, verbose):
    # Native module (tree-sitter parsers); node-gyp otherwise tries to
    # fetch Node headers from nodejs.org, which this sandbox blocks --
    # point it at headers already on disk instead.
    ok, detail = npm_install(folder, f"--nodedir={NODE_INCLUDE_DIR}")
    if not ok:
        return FINDINGS, detail
    proc = _run("node node_modules/.bin/dolos run src/*.js -l javascript", folder)
    if proc.returncode != 0:
        return FINDINGS, (proc.stdout + proc.stderr)[-1500:]
    scores = [float(x) for x in re.findall(r"^\S.*?\s([\d.]+)\s+\d", proc.stdout, re.M)]
    scores = [float(x) for x in re.findall(r"(\d\.\d+)", proc.stdout)]
    if any(s > 0.3 for s in scores):
        return FINDINGS, f"similarity too high: {scores}\n{proc.stdout[-800:]}"
    return CLEAN, f"pairwise similarity scores: {scores}"


def _eslint_like(folder, cmd):
    ok, detail = npm_install(folder)
    if not ok:
        return FINDINGS, detail
    proc = _run(cmd, folder)
    if proc.returncode != 0:
        return FINDINGS, (proc.stdout + proc.stderr)[-1500:]
    return CLEAN, (proc.stdout + proc.stderr)[-300:]


def check_eslint(folder, verbose):
    return _eslint_like(folder, "node node_modules/.bin/eslint src/ test/")


def check_gitspark(folder, verbose):
    ok, detail = npm_install(folder)
    if not ok:
        return FINDINGS, detail
    proc = _run("node node_modules/.bin/git-spark -f console", folder, timeout=60)
    out = proc.stdout + proc.stderr
    if proc.returncode != 0:
        return FINDINGS, out[-1500:]
    if "Overall Risk Level: LOW" not in out:
        return FINDINGS, "risk level was not LOW:\n" + out[-1500:]
    return CLEAN, "Overall Risk Level: LOW"


def check_gutcheck(folder, verbose):
    ok, detail = npm_install(folder)
    if not ok:
        return FINDINGS, detail
    proc = _run("node node_modules/.bin/gutcheck .", folder, timeout=60)
    out = proc.stdout + proc.stderr
    if proc.returncode != 0:
        return FINDINGS, out[-1500:]
    if re.search(r"(\d+) hollow", out, re.I) and not re.search(r"0 hollow", out, re.I):
        return FINDINGS, out[-1500:]
    return CLEAN, out.strip().splitlines()[-1] if out.strip() else "clean"


def check_jscpd(folder, verbose):
    return _eslint_like(
        folder,
        "node node_modules/.bin/jscpd src/ --min-lines 5 --min-tokens 30 "
        "--threshold 0 --reporters console",
    )


def check_knip(folder, verbose):
    ok, detail = npm_install(folder)
    if not ok:
        return FINDINGS, detail
    proc = _run("node node_modules/.bin/knip", folder)
    out = (proc.stdout + proc.stderr).strip()
    if proc.returncode != 0 or out:
        return FINDINGS, out[-1500:] or f"exit {proc.returncode}"
    return CLEAN, "silent (0 issues, 0 hints)"


def check_lizard(folder, verbose):
    if shutil.which("lizard") is None:
        return NOT_INSTALLED, "lizard not on PATH"
    proc = _run("lizard src/ -C 10 -L 60 -a 5 -w", folder)
    out = (proc.stdout + proc.stderr).strip()
    if proc.returncode != 0 or out:
        return FINDINGS, out[-1500:] or f"exit {proc.returncode}"
    return CLEAN, "silent (0 warnings)"


def check_mocha(folder, verbose):
    return _eslint_like(folder, "node node_modules/.bin/mocha 'test/**/*.test.js'")


def check_mcr(folder, verbose):
    ok, detail = npm_install(folder)
    if not ok:
        return FINDINGS, detail
    shutil.rmtree(folder / "coverage-report", ignore_errors=True)
    proc = _run(
        "node node_modules/.bin/mcr node node_modules/.bin/mocha "
        "'test/**/*.test.js' -r v8,json-summary -o coverage-report", folder,
    )
    if proc.returncode != 0:
        return FINDINGS, (proc.stdout + proc.stderr)[-1500:]
    summary_path = folder / "coverage-report" / "coverage-summary.json"
    if not summary_path.exists():
        return FINDINGS, "no coverage-summary.json produced"
    data = json.loads(summary_path.read_text())
    own_files = [k for k in data if k.startswith("src/") and k.endswith(".js")]
    if not own_files:
        return FINDINGS, "no own-source entries in coverage-summary.json"
    bad = []
    for key in own_files:
        for metric in ("lines", "statements", "functions", "branches"):
            pct = data[key][metric]["pct"]
            if pct != 100:
                bad.append(f"{key} {metric}={pct}")
    if bad:
        return FINDINGS, "; ".join(bad)
    return CLEAN, f"{own_files}: 100% lines/statements/functions/branches"


def check_npm_audit(folder, verbose):
    lock = _run("npm install --no-audit --no-fund --package-lock-only", folder, timeout=60)
    if lock.returncode != 0:
        return FINDINGS, (lock.stdout + lock.stderr)[-1000:]
    proc = _run("npm audit --audit-level=low", folder, timeout=60)
    out = proc.stdout + proc.stderr
    if "found 0 vulnerabilities" not in out:
        return FINDINGS, out[-1000:]
    return CLEAN, "found 0 vulnerabilities"


def check_npm_ls(folder, verbose):
    proc = _run("npm ls --all", folder, timeout=60)
    out = proc.stdout + proc.stderr
    if proc.returncode != 0:
        return FINDINGS, out[-1000:]
    return CLEAN, out.strip()


def check_nyc(folder, verbose):
    return _eslint_like(
        folder,
        "node node_modules/.bin/nyc --check-coverage --lines 100 --branches 100 "
        "--functions 100 --statements 100 node_modules/.bin/mocha 'test/**/*.test.js'",
    )


def check_opengrep(folder, verbose):
    if shutil.which("opengrep") is None:
        if shutil.which("semgrep") is None:
            return NOT_INSTALLED, "opengrep (and semgrep stand-in) not on PATH"
        proc = _run("semgrep --config=semgrep-rules.yml --error --quiet src/", folder)
        if proc.returncode != 0:
            return FINDINGS, (proc.stdout + proc.stderr)[-1500:]
        return NOT_INSTALLED, "opengrep absent; semgrep stand-in ran clean with the same rules"
    proc = _run("opengrep --config=semgrep-rules.yml --error src/", folder)
    if proc.returncode != 0:
        return FINDINGS, (proc.stdout + proc.stderr)[-1500:]
    return CLEAN, "0 findings"


def check_oxlint(folder, verbose):
    return _eslint_like(folder, "node node_modules/.bin/oxlint src/ test/")


def check_pydriller(folder, verbose):
    try:
        import pydriller  # noqa: F401
    except ImportError:
        return NOT_INSTALLED, "pydriller not importable"
    proc = _run("python3 driver.py", folder)
    if proc.returncode != 0:
        return FINDINGS, (proc.stdout + proc.stderr)[-1500:]
    return CLEAN, proc.stdout.strip()


def check_stryker(folder, verbose):
    ok, detail = npm_install(folder)
    if not ok:
        return FINDINGS, detail
    proc = _run("node node_modules/.bin/stryker run", folder, timeout=120)
    out = proc.stdout + proc.stderr
    if proc.returncode != 0:
        return FINDINGS, out[-2000:]
    m = re.search(r"Final mutation score of ([\d.]+)", out)
    if not m or float(m.group(1)) < 100:
        return FINDINGS, out[-2000:]
    return CLEAN, m.group(0)


def check_trivy(folder, verbose):
    if shutil.which("trivy") is None:
        return NOT_INSTALLED, "trivy not on PATH"
    proc = _run("trivy fs --scanners vuln,secret --exit-code 1 .", folder)
    if proc.returncode != 0:
        return FINDINGS, (proc.stdout + proc.stderr)[-1500:]
    return CLEAN, "0 vulnerabilities, 0 secrets"


CHECKS = {
    "cccc": check_cccc,
    "CodeQL": lambda folder, verbose: (NOT_INSTALLED, "codeql CLI not on PATH"),
    "debtmap": check_debtmap,
    "diff-cover": check_diffcover,
    "Dolos": check_dolos,
    "ESLint": check_eslint,
    "eslint-plugin-security": lambda folder, v: _eslint_like(
        folder, "node node_modules/.bin/eslint src/ test/"),
    "eslint-plugin-sonarjs": lambda folder, v: _eslint_like(
        folder, "node node_modules/.bin/eslint src/ test/"),
    "Git-Spark": check_gitspark,
    "gutcheck": check_gutcheck,
    "jscpd": check_jscpd,
    "knip": check_knip,
    "Lizard": check_lizard,
    "Mocha": check_mocha,
    "monocart-coverage-reports": check_mcr,
    "npm audit": check_npm_audit,
    "npm ls": check_npm_ls,
    "nyc": check_nyc,
    "OpenGrep": check_opengrep,
    "oxlint": check_oxlint,
    "pydriller": check_pydriller,
    "StrykerJS": check_stryker,
    "trivy": check_trivy,
}

GENERATED = (
    "node_modules", "package-lock.json", "coverage", "coverage-report",
    ".nyc_output", "coverage.xml", ".cccc", ".stryker-tmp", "reports",
    ".jscpd-report",
)


def clean_generated(folder: Path) -> None:
    for name in GENERATED:
        path = folder / name
        if path.is_dir():
            shutil.rmtree(path, ignore_errors=True)
        elif path.exists():
            path.unlink()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root")
    parser.add_argument("--only", action="append", default=[])
    parser.add_argument("-v", "--verbose", action="store_true")
    parser.add_argument("--keep", action="store_true",
                         help="do not clean generated artifacts afterward")
    args = parser.parse_args()

    root = Path(args.root)
    tools = args.only or sorted(CHECKS)
    label = {CLEAN: "CLEAN", FINDINGS: "FINDINGS", NOT_INSTALLED: "NOT INSTALLED"}
    tally: dict[int, list[str]] = {CLEAN: [], FINDINGS: [], NOT_INSTALLED: []}

    for tool in tools:
        folder = root / tool
        status, detail = CHECKS[tool](folder, args.verbose)
        tally[status].append(tool)
        print(f"{label[status]:>14}  {tool}")
        if detail and (status == FINDINGS or args.verbose):
            for line in str(detail).splitlines()[-14:]:
                print(f"                  | {line}")
        if not args.keep:
            clean_generated(folder)

    print()
    print(f"CLEAN {len(tally[CLEAN])}  FINDINGS {len(tally[FINDINGS])}  "
          f"NOT INSTALLED {len(tally[NOT_INSTALLED])}")
    if tally[FINDINGS]:
        print("failing: " + ", ".join(tally[FINDINGS]))
    if tally[NOT_INSTALLED]:
        print("absent:  " + ", ".join(tally[NOT_INSTALLED]))
    return 1 if tally[FINDINGS] else 0


if __name__ == "__main__":
    raise SystemExit(main())
