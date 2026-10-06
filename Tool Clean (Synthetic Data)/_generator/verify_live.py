#!/usr/bin/env python3
"""Real per-family live verification: for each versionable, Node-dependent
tool, under each live family (node20/24/26), do a real `npm install` with
that family's own node/npm binary, then run the tool's real command, and
record the outcome. Writes results to live_results.json.
"""
import json
import os
import subprocess
import sys

ROOT = "/root/js_work"
LIVE_FAMILIES = {
    "node20": "/opt/node20/bin",
    "node24": "/opt/node24/bin",
    "node26": "/opt/node26/bin",
}

# tool -> command to run after npm install (relative to the family folder)
COMMANDS = {
    "ESLint": "npm run lint && npm test",
    "eslint-plugin-security": "npm run lint && npm test",
    "eslint-plugin-sonarjs": "npm run lint && npm test",
    "Mocha": "npm test",
    "Dolos": "npx dolos run src/*.js -l javascript",
    "jscpd": "npm run duplication",
    "knip": "npm run knip",
    "gutcheck": "npx gutcheck .",
    "monocart-coverage-reports": "npm run coverage",
    "nyc": "npm run coverage",
    "oxlint": "npm run lint && npm test",
    "StrykerJS": "npx stryker run",
    "npm audit": "npm audit --audit-level=low",
    "npm ls": "npm ls --all",
}

results = {}

for tool, cmd in COMMANDS.items():
    results[tool] = {}
    for family, bindir in LIVE_FAMILIES.items():
        folder = os.path.join(ROOT, tool, family)
        if not os.path.isdir(folder):
            results[tool][family] = {"error": "folder missing"}
            continue
        env = dict(os.environ)
        env["PATH"] = bindir + ":" + env["PATH"]
        entry = {}
        # npm install (skip for npm audit/npm ls which have no devDependencies
        # but still need a real install pass to generate a lockfile state)
        install_cmd = ["npm", "install", "--no-audit", "--no-fund"]
        if tool == "Dolos":
            install_cmd += [f"--nodedir={bindir[:-len('/bin')]}"]
        install = subprocess.run(
            install_cmd,
            cwd=folder, env=env, capture_output=True, text=True, timeout=180,
        )
        entry["install_rc"] = install.returncode
        if install.returncode != 0:
            entry["install_tail"] = install.stdout[-1500:] + install.stderr[-1500:]
            results[tool][family] = entry
            print(f"[{tool}/{family}] INSTALL FAILED rc={install.returncode}")
            continue
        run = subprocess.run(
            cmd, cwd=folder, env=env, capture_output=True, text=True,
            timeout=180, shell=True, executable="/bin/bash",
        )
        entry["run_rc"] = run.returncode
        entry["run_tail"] = (run.stdout[-2000:] + run.stderr[-2000:])
        results[tool][family] = entry
        status = "OK" if run.returncode == 0 else f"FAIL rc={run.returncode}"
        print(f"[{tool}/{family}] {status}")

with open(os.path.join(ROOT, "live_results.json"), "w") as f:
    json.dump(results, f, indent=2)

print("\nDone. See live_results.json")
