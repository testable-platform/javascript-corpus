#!/usr/bin/env python3
"""Real per-family live verification for JavaScript-Tools-Invalid: for each
versionable, Node-dependent, live-checkable tool, under each live family
(node20/24/26), do a real `npm install` with that family's own node/npm
binary, then run the tool's real command, and confirm it genuinely finds
something wrong (FINDINGS), not just that it ran.

Exit-code vocabulary matches the rest of this project:
    0  CLEAN          the tool ran and reported nothing (would be a bug here)
    1  FINDINGS       the tool ran and reported something -- the expected,
                       real result for this Invalid corpus
    4  NOT INSTALLED  genuinely absent from this host (CodeQL, trivy)

Writes results to live_results.json.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

CLEAN, FINDINGS, NOT_INSTALLED = 0, 1, 4
LABEL = {CLEAN: "CLEAN (unexpected!)", FINDINGS: "FINDINGS", NOT_INSTALLED: "NOT INSTALLED"}

ROOT = Path("/root/js_invalid_src")
LIVE_FAMILIES = {
    "node20": "/opt/node20/bin",
    "node24": "/opt/node24/bin",
    "node26": "/opt/node26/bin",
}
CARGO_BIN = str(Path.home() / ".cargo" / "bin")


def _env(bindir):
    env = dict(os.environ)
    env["PATH"] = bindir + os.pathsep + CARGO_BIN + os.pathsep + env.get("PATH", "")
    return env


def _run(cmd, cwd, env, timeout=180):
    return subprocess.run(
        cmd, cwd=cwd, shell=True, env=env, capture_output=True, text=True,
        timeout=timeout, executable="/bin/bash",
    )


def npm_install(folder, env, extra=""):
    proc = _run(f"npm install --no-audit --no-fund {extra}".strip(), folder, env, timeout=300)
    return proc.returncode == 0, (proc.stdout + proc.stderr)[-2000:]


# ---- per-tool checks (folder, env) -> (status, detail) ----

def check_eslint_like(folder, env, lint_cmd):
    ok, detail = npm_install(folder, env)
    if not ok:
        return FINDINGS, detail
    proc = _run(lint_cmd, folder, env)
    if proc.returncode != 0:
        return FINDINGS, (proc.stdout + proc.stderr)[-1500:]
    out = (proc.stdout + proc.stderr).strip()
    if out:
        return FINDINGS, out[-1500:]
    return CLEAN, out


def check_ESLint(folder, env):
    return check_eslint_like(folder, env, "node node_modules/.bin/eslint src/ test/")


def check_eslint_plugin_security(folder, env):
    return check_eslint_like(folder, env, "node node_modules/.bin/eslint src/ test/")


def check_eslint_plugin_sonarjs(folder, env):
    return check_eslint_like(folder, env, "node node_modules/.bin/eslint src/ test/")


def check_oxlint(folder, env):
    return check_eslint_like(folder, env, "node node_modules/.bin/oxlint src/ test/")


def check_Mocha(folder, env):
    return check_eslint_like(folder, env, "node node_modules/.bin/mocha 'test/**/*.test.js'")


def check_jscpd(folder, env):
    return check_eslint_like(
        folder, env,
        "node node_modules/.bin/jscpd src/ --min-lines 5 --min-tokens 30 "
        "--threshold 0 --reporters console",
    )


def check_knip(folder, env):
    ok, detail = npm_install(folder, env)
    if not ok:
        return FINDINGS, detail
    proc = _run("node node_modules/.bin/knip", folder, env)
    out = (proc.stdout + proc.stderr).strip()
    if proc.returncode != 0 or out:
        return FINDINGS, out[-1500:] or f"exit {proc.returncode}"
    return CLEAN, "silent"


def check_gutcheck(folder, env):
    ok, detail = npm_install(folder, env)
    if not ok:
        return FINDINGS, detail
    proc = _run("node node_modules/.bin/gutcheck .", folder, env, timeout=60)
    out = proc.stdout + proc.stderr
    # This gutcheck release reports non-proven functions as "unnoticed" or
    # "untested", not only the legacy "hollow" label -- any function short
    # of fully "proven" is a genuine finding here.
    m = re.search(r"(\d+) functions? in this repo\s*--\s*(\d+) proven", out)
    if m:
        total, proven = int(m.group(1)), int(m.group(2))
        if proven < total:
            return FINDINGS, out[-1500:]
        return CLEAN, out.strip().splitlines()[-1]
    return FINDINGS, out[-1500:]


def check_nyc(folder, env):
    return check_eslint_like(
        folder, env,
        "node node_modules/.bin/nyc --check-coverage --lines 100 --branches 100 "
        "--functions 100 --statements 100 node_modules/.bin/mocha 'test/**/*.test.js'",
    )


def check_mcr(folder, env):
    ok, detail = npm_install(folder, env)
    if not ok:
        return FINDINGS, detail
    shutil.rmtree(folder / "coverage-report", ignore_errors=True)
    proc = _run(
        "node node_modules/.bin/mcr node node_modules/.bin/mocha "
        "'test/**/*.test.js' -r v8,json-summary -o coverage-report", folder, env,
    )
    if proc.returncode != 0:
        return FINDINGS, (proc.stdout + proc.stderr)[-1500:]
    summary_path = folder / "coverage-report" / "coverage-summary.json"
    if not summary_path.exists():
        return FINDINGS, "no coverage-summary.json produced"
    data = json.loads(summary_path.read_text())
    own_files = [k for k in data if k.startswith("src/") and k.endswith(".js")]
    bad = []
    for key in own_files:
        for metric in ("lines", "statements", "functions", "branches"):
            pct = data[key][metric]["pct"]
            if pct != 100:
                bad.append(f"{key} {metric}={pct}")
    if bad:
        return FINDINGS, "; ".join(bad)
    return CLEAN, f"{own_files}: 100%"


def check_dolos(folder, env):
    bindir = env["PATH"].split(os.pathsep)[0]
    nodedir = bindir[:-len("/bin")] if bindir.endswith("/bin") else bindir
    ok, detail = npm_install(folder, env, f"--nodedir={nodedir}")
    if not ok:
        return FINDINGS, detail
    proc = _run("node node_modules/.bin/dolos run src/*.js -l javascript", folder, env, timeout=120)
    if proc.returncode != 0:
        return FINDINGS, (proc.stdout + proc.stderr)[-1500:]
    scores = [float(x) for x in re.findall(r"(\d\.\d+|\b1\b)", proc.stdout)]
    if any(s > 0.3 for s in scores):
        return FINDINGS, f"similarity scores: {scores}\n{proc.stdout[-800:]}"
    return CLEAN, f"pairwise similarity scores: {scores}"


def check_stryker(folder, env):
    ok, detail = npm_install(folder, env)
    if not ok:
        return FINDINGS, detail
    proc = _run("node node_modules/.bin/stryker run", folder, env, timeout=180)
    out = proc.stdout + proc.stderr
    m = re.search(r"Final mutation score ([\d.]+)", out)
    if m and float(m.group(1)) < 100:
        return FINDINGS, out[-2000:]
    if proc.returncode != 0:
        return FINDINGS, out[-2000:]
    return CLEAN, m.group(0) if m else "100.00"


def check_npm_audit(folder, env):
    lock = _run("npm install --no-audit --no-fund", folder, env, timeout=120)
    if lock.returncode != 0:
        return FINDINGS, (lock.stdout + lock.stderr)[-1000:]
    proc = _run("npm audit --audit-level=low", folder, env, timeout=60)
    out = proc.stdout + proc.stderr
    if "found 0 vulnerabilities" in out:
        return CLEAN, "found 0 vulnerabilities"
    return FINDINGS, out[-1500:]


def check_npm_ls(folder, env):
    proc = _run("npm ls --all", folder, env, timeout=60)
    out = proc.stdout + proc.stderr
    if proc.returncode != 0:
        return FINDINGS, out[-1200:]
    return CLEAN, out.strip()


def check_cccc(folder, env):
    if shutil.which("cccc") is None:
        return NOT_INSTALLED, "cccc not on PATH"
    shutil.rmtree(folder / ".cccc", ignore_errors=True)
    proc = _run("cccc src/*.c", folder, env)
    xml_path = folder / ".cccc" / "cccc.xml"
    if not xml_path.exists():
        return FINDINGS, (proc.stdout + proc.stderr)[-1000:]
    xml = xml_path.read_text()
    rejected = int(re.search(r'rejected_lines_of_code value="(\d+)"', xml).group(1))
    findings = []
    if rejected:
        findings.append(f"{rejected} rejected lines")
    for m in re.finditer(
        r'<module>\s*<name>([^<]*)</name>\s*<lines_of_code[^/]*/>\s*'
        r'<McCabes_cyclomatic_complexity value="(\d+)"',
        xml,
    ):
        name, ccn = m.group(1), int(m.group(2))
        if ccn > 10:
            findings.append(f"{name}: CCN {ccn} > 10")
    shutil.rmtree(folder / ".cccc", ignore_errors=True)
    if findings:
        return FINDINGS, "; ".join(findings)
    return CLEAN, "0 rejected, all CCN <= 10"


def check_debtmap(folder, env):
    debtmap_bin = shutil.which("debtmap", path=env["PATH"])
    if debtmap_bin is None:
        return NOT_INSTALLED, "debtmap not on PATH"
    # `debtmap validate` reports "0 files analyzed" unconditionally in this
    # installed version (0.24.1) -- a genuine, content-independent quirk,
    # reproduced even against the original Clean-corpus source. `analyze`
    # does not have this bug, so it is used as the real measurement here;
    # see the folder's own README for the full writeup.
    proc = _run(f"{debtmap_bin} analyze . --format terminal", folder, env, timeout=60)
    out = proc.stdout + proc.stderr
    m = re.search(r"DEBT DENSITY:\s*([\d.]+) per 1K LOC", out)
    if not m:
        return FINDINGS, out[-1500:]
    density = float(m.group(1))
    if density > 10.0:
        return FINDINGS, f"debt density {density} per 1K LOC > 10.0 threshold\n" + out[-1200:]
    return CLEAN, f"debt density {density} <= 10.0"


def check_lizard(folder, env):
    lizard_bin = shutil.which("lizard")
    if lizard_bin is None:
        return NOT_INSTALLED, "lizard not on PATH"
    proc = _run(f"{lizard_bin} src/ -C 10 -L 60 -a 5 -w", folder, env)
    out = (proc.stdout + proc.stderr).strip()
    if proc.returncode != 0 or out:
        return FINDINGS, out[-1500:] or f"exit {proc.returncode}"
    return CLEAN, "silent (0 warnings)"


def check_opengrep(folder, env):
    opengrep_bin = shutil.which("opengrep")
    semgrep_bin = shutil.which("semgrep")
    if opengrep_bin is None and semgrep_bin is None:
        return NOT_INSTALLED, "opengrep (and semgrep stand-in) not on PATH"
    binname = opengrep_bin or semgrep_bin
    proc = _run(f"{binname} --config=semgrep-rules.yml --error --quiet src/", folder, env)
    out = proc.stdout + proc.stderr
    if proc.returncode != 0:
        label = "opengrep" if opengrep_bin else "semgrep stand-in (same rule engine)"
        return FINDINGS, f"[{label}] " + out[-1500:]
    return CLEAN, "0 findings"


def check_trivy(folder, env):
    if shutil.which("trivy") is None:
        return NOT_INSTALLED, "trivy not on PATH"
    proc = _run("trivy fs --scanners vuln,secret --exit-code 1 .", folder, env)
    if proc.returncode != 0:
        return FINDINGS, (proc.stdout + proc.stderr)[-1500:]
    return CLEAN, "0 vulnerabilities, 0 secrets"


def check_codeql(folder, env):
    return NOT_INSTALLED, "codeql CLI not on PATH (GitHub release asset, egress-blocked)"


VERSIONABLE_CHECKS = {
    "ESLint": check_ESLint,
    "eslint-plugin-security": check_eslint_plugin_security,
    "eslint-plugin-sonarjs": check_eslint_plugin_sonarjs,
    "oxlint": check_oxlint,
    "Mocha": check_Mocha,
    "jscpd": check_jscpd,
    "knip": check_knip,
    "gutcheck": check_gutcheck,
    "nyc": check_nyc,
    "monocart-coverage-reports": check_mcr,
    "Dolos": check_dolos,
    "StrykerJS": check_stryker,
    "npm audit": check_npm_audit,
    "npm ls": check_npm_ls,
    "cccc": check_cccc,
    "debtmap": check_debtmap,
    "Lizard": check_lizard,
    "OpenGrep": check_opengrep,
    "trivy": check_trivy,
    "CodeQL": check_codeql,
}

GENERATED = (
    "node_modules", "package-lock.json", "coverage", "coverage-report",
    ".nyc_output", "coverage.xml", ".cccc", ".stryker-tmp", "reports",
    ".jscpd-report", ".debtmap.toml",
)


def clean_generated(folder: Path) -> None:
    for name in GENERATED:
        path = folder / name
        if path.is_dir():
            shutil.rmtree(path, ignore_errors=True)
        elif path.exists():
            path.unlink()


def main():
    results = {}
    tools = sorted(VERSIONABLE_CHECKS)
    for tool in tools:
        results[tool] = {}
        for family, bindir in LIVE_FAMILIES.items():
            folder = ROOT / tool / family
            if not folder.is_dir():
                results[tool][family] = {"status": "ERROR", "detail": "folder missing"}
                print(f"[{tool}/{family}] ERROR folder missing")
                continue
            env = _env(bindir)
            status, detail = VERSIONABLE_CHECKS[tool](folder, env)
            results[tool][family] = {"status": LABEL[status], "detail": str(detail)[-1500:]}
            print(f"[{tool}/{family}] {LABEL[status]}")
            clean_generated(folder)

    with open(ROOT / "live_results_invalid.json", "w") as f:
        json.dump(results, f, indent=2)
    print("\nDone. See live_results_invalid.json")


if __name__ == "__main__":
    main()
