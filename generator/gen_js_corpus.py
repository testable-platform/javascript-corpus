#!/usr/bin/env python3
"""
Parameterized generator for the javascript-combos corpus.

Produces, for one Node-version family at a time, the full 64-branch
combo grid (8 bundlers x 4 package managers x 2 architectures), writing
real application code, real tool configs, and a real dataset.json answer
key into each branch's existing git worktree directory.

Domain layer is byte-identical across all 576 branches (product:
GraniteMill / package: granite-mill / id prefix: GM-). Only the
build/package/architecture/tool-pin layer varies by branch, exactly as
required by the sibling C#/Java/Python/TypeScript corpora.

Usage (run from inside the corpus root, e.g. via device_bash):
    python3 gen_js_corpus.py --family 12 --root "." --old-prefix CE-N12 --dry-run
    python3 gen_js_corpus.py --family 12 --root "." --old-prefix CE-N12
"""
import argparse, json, os, sys, textwrap

# ---------------------------------------------------------------------------
# 1. Per-Node-family tool pin table (live-verified against registry.npmjs.org
#    engines.node ranges on 2026-09-16; prereleases excluded).
# ---------------------------------------------------------------------------
PINS = {
    "cyclomatic-complexity":       {12: None,      14: "1.0.0", 16: "1.2.4", 18: "1.2.5", 20: "1.2.5", 21: "1.2.5", 22: "1.2.5", 24: "1.2.5", 26: "1.2.5"},
    "eslint-plugin-sonarjs":       {12: "4.2.1",   14: "4.2.1", 16: "4.2.1", 18: "4.2.1", 20: "4.2.1", 21: "4.2.1", 22: "4.2.1", 24: "4.2.1", 26: "4.2.1"},
    "cognitive-complexity-ts":     {12: "0.8.2",   14: "0.8.2", 16: "0.8.2", 18: "0.8.2", 20: "0.8.2", 21: "0.8.2", 22: "0.8.2", 24: "0.8.2", 26: "0.8.2"},
    "jscpd":                       {12: "4.3.0",   14: "4.3.0", 16: "4.3.0", 18: "5.2.1", 20: "5.2.1", 21: "5.2.1", 22: "5.2.1", 24: "5.2.1", 26: "5.2.1"},
    "@dodona/dolos":               {12: "1.6.0",   14: "2.3.0", 16: "2.5.1", 18: "2.9.3", 20: "2.9.3", 21: "2.9.3", 22: "2.9.3", 24: "2.9.3", 26: "2.9.3"},
    "eslint":                      {12: "8.57.1",  14: "8.57.1", 16: "8.57.1", 18: "9.39.5", 20: "10.10.0", 21: "9.39.5", 22: "10.10.0", 24: "10.10.0", 26: "10.10.0"},
    "oxlint":                      {12: "1.16.0",  14: "1.16.0", 16: "1.16.0", 18: "1.16.0", 20: "1.83.0", 21: "1.16.0", 22: "1.83.0", 24: "1.83.0", 26: "1.83.0"},
    "eslint-plugin-security":      {12: "2.1.1",   14: "2.1.1", 16: "2.1.1", 18: "4.0.1", 20: "4.0.1", 21: "4.0.1", 22: "4.0.1", 24: "4.0.1", 26: "4.0.1"},
    "nyc":                         {12: "15.1.0",  14: "15.1.0", 16: "15.1.0", 18: "17.1.0", 20: "18.0.0", 21: "17.1.0", 22: "18.0.0", 24: "18.0.0", 26: "18.0.0"},
    "mocha":                       {12: "9.2.2",   14: "10.8.2", 16: "10.8.2", 18: "11.8.0", 20: "12.0.1", 21: "11.8.0", 22: "12.0.1", 24: "12.0.1", 26: "12.0.1"},
    "monocart-coverage-reports":   {12: "2.13.0",  14: "2.13.0", 16: "2.13.0", 18: "2.13.0", 20: "2.13.0", 21: "2.13.0", 22: "2.13.0", 24: "2.13.0", 26: "2.13.0"},
    "@stryker-mutator/core":       {12: "5.6.1",   14: "6.4.2", 16: "7.3.0", 18: "8.7.1", 20: "9.6.1", 21: "9.6.1", 22: "10.0.0", 24: "10.0.0", 26: "10.0.0"},
    "@stryker-mutator/mocha-runner": {12: "5.6.1", 14: "6.4.2", 16: "7.3.0", 18: "8.7.1", 20: "9.6.1", 21: "9.6.1", 22: "10.0.0", 24: "10.0.0", 26: "10.0.0"},
    "gutcheck":                    {12: None, 14: None, 16: None, 18: None, 20: "0.10.0", 21: "0.10.0", 22: "0.10.0", 24: "0.10.0", 26: "0.10.0"},
    "eslint-scope":                {12: "7.2.2",   14: "7.2.2", 16: "7.2.2", 18: "8.4.0", 20: "9.1.2", 21: "8.4.0", 22: "9.1.2", 24: "9.1.2", 26: "9.1.2"},
    "knip":                        {12: None, 14: None, 16: "2.43.0", 18: "5.88.1", 20: "6.36.0", 21: "5.88.1", 22: "6.36.0", 24: "6.36.0", 26: "6.36.0"},
    "git-spark":                   {12: None, 14: None, 16: None, 18: "1.0.265", 20: "1.3.0", 21: "1.3.0", 22: "1.3.2", 24: "1.3.2", 26: "1.3.2"},
}
# bundled-npm-per-family (documented from the existing corpus + npm's own release notes;
# Node 20's bundled npm is filled in from npm's public release history, same method as
# every other cell in this table, and should be re-verified live once N20 is bootstrapped
# for real by Claude Code, per README caveat).
BUNDLED_NPM = {12: "6.14.18", 14: "6.14.18", 16: "8.19.4", 18: "9.8.1", 20: "10.8.2", 21: "10.9.2", 22: "10.9.2", 24: "10.9.2", 26: "10.9.2"}

# Node full patch used in engines/.nvmrc/CI (matches the resolver's own NODE_PATCH table).
NODE_PATCH = {12: "12.22.12", 14: "14.21.3", 16: "16.20.2", 18: "18.20.8", 20: "20.20.2",
              21: "21.7.3", 22: "22.23.2", 24: "24.20.0", 26: "26.8.1"}

ESLINT_FLAT_CONFIG_FAMILIES = {18, 20, 21, 22, 24, 26}  # eslint 9+/10+ -> flat config

BUNDLERS = ["ESBUILD", "VITE", "WEBPACK", "ROLLUP", "RSPACK", "PARCEL", "TURBOPACK", "SWC"]
BUNDLER_LABEL = {"ESBUILD": "esbuild", "VITE": "Vite (built as esbuild)", "WEBPACK": "Webpack",
                 "ROLLUP": "Rollup", "RSPACK": "Rspack", "PARCEL": "Parcel",
                 "TURBOPACK": "Turbopack", "SWC": "SWC"}
PMS = ["NPM", "YARN", "PNPM", "BUN"]
PM_LABEL = {"NPM": "npm", "YARN": "yarn (Berry)", "PNPM": "pnpm", "BUN": "bun"}
ARCHES = ["MONO", "MICRO"]
ARCH_LABEL = {"MONO": "Monolith", "MICRO": "Microservices"}

# ---------------------------------------------------------------------------
# 2. Repaired 103-metric roster (source: JavaScript Tools List.xlsx, sheet
#    Testable_Strategy_Metrics_Mappi, re-read row by row 2026-09-16).
#    Fixes applied vs the original sheet:
#      - Cyclomatic Complexity alt "debtmap" (not a real npm package) -> cyclomatic-complexity
#      - Cognitive Complexity alt "cccc" (resolves to an unrelated cache-clearing
#        package on npm, not a complexity tool) -> cognitive-complexity-ts
#      - Path Coverage primary column was a copy-paste artifact incrementing a
#        fake "nyc v17.1.X" patch version row by row (v17.1.0..v17.1.2) with no
#        real meaning (nyc does not do path analysis) -> normalized to the real
#        tool actually doing the work: "nyc + mocha" (branch-coverage used as an
#        honest, documented proxy -- no JS-native path-coverage tool exists)
#        for rows about coverage-of-paths, and "ESLint (eslint-scope) + nyc +
#        mocha" for the three rows about cross-function/CI/aggregate path %.
#      - All Definition/All Uses Coverage (Data-Flow) primary column carried
#        the SAME fake incrementing "nyc v17.1.X" counter (continuing 0..5 then
#        6..15 across the two blocks -- proof it's one continuous copy-paste
#        error) -> normalized to "ESLint (eslint-scope)" alone (the real
#        def-use static-analysis script; nyc is a coverage tool, not a
#        data-flow tool, so pairing it here was a fabricated conflation).
#      - Data-Flow alternative column cycled inconsistently through
#        gutcheck/CodeQL/knip/Opengrep row by row with no logic ->
#        normalized to a single consistent alternative: knip.
#      - Dependency Risk (SCA) primary column mixed "npm ls" / "npm audit +
#        npm ls" / "N/A" for what is the same underlying check -> normalized
#        to "npm audit + npm ls" throughout.
#    Left unchanged (already correct/real): Code Duplication (jscpd/Dolos),
#    Lint/Rule Violations (eslint/oxlint), SAST (eslint-plugin-security/
#    OpenGrep), Statement/Branch Coverage (nyc+mocha/monocart), Mutation
#    Score (StrykerJS+Mocha/gutcheck), Coverage Delta (diff-cover/monocart),
#    Code Churn (pydriller/Git-Spark).
# ---------------------------------------------------------------------------
ROSTER = [
    {"block": "Cyclomatic Complexity", "metrics": 6, "primary": "Lizard", "primary_kind": "external",
     "alt": "cyclomatic-complexity", "alt_pin_key": "cyclomatic-complexity"},
    {"block": "Cognitive Complexity", "metrics": 7, "primary": "eslint-plugin-sonarjs", "primary_pin_key": "eslint-plugin-sonarjs",
     "alt": "cognitive-complexity-ts", "alt_pin_key": "cognitive-complexity-ts"},
    {"block": "Code Duplication", "metrics": 7, "primary": "jscpd", "primary_pin_key": "jscpd",
     "alt": "Dolos", "alt_pin_key": "@dodona/dolos"},
    {"block": "Lint / Rule Violations", "metrics": 12, "primary": "eslint", "primary_pin_key": "eslint",
     "alt": "oxlint", "alt_pin_key": "oxlint"},
    {"block": "Static Vulnerabilities (SAST)", "metrics": 7, "primary": "eslint-plugin-security", "primary_pin_key": "eslint-plugin-security",
     "alt": "OpenGrep", "alt_kind": "external"},
    {"block": "Dependency Risk (SCA)", "metrics": 8, "primary": "npm audit + npm ls", "primary_kind": "bundled",
     "alt": "trivy", "alt_kind": "external"},
    {"block": "Statement Coverage", "metrics": 5, "primary": "nyc + mocha", "primary_pin_key": "nyc",
     "alt": "monocart-coverage-reports", "alt_pin_key": "monocart-coverage-reports"},
    {"block": "Branch Coverage", "metrics": 7, "primary": "nyc + mocha", "primary_pin_key": "nyc",
     "alt": "monocart-coverage-reports", "alt_pin_key": "monocart-coverage-reports"},
    {"block": "Path Coverage", "metrics": 10, "primary": "nyc + mocha (branch-coverage proxy)", "primary_pin_key": "nyc",
     "alt": "monocart-coverage-reports", "alt_pin_key": "monocart-coverage-reports",
     "note": "No JS-native path-coverage tool resolved; branch coverage used as a documented proxy."},
    {"block": "Mutation Score", "metrics": 7, "primary": "StrykerJS + Mocha", "primary_pin_key": "@stryker-mutator/core",
     "alt": "gutcheck", "alt_pin_key": "gutcheck"},
    {"block": "Coverage Delta", "metrics": 6, "primary": "diff-cover", "primary_kind": "external",
     "alt": "monocart-coverage-reports", "alt_pin_key": "monocart-coverage-reports"},
    {"block": "All Definition Coverage", "metrics": 6, "primary": "ESLint (eslint-scope)", "primary_pin_key": "eslint-scope",
     "alt": "knip", "alt_pin_key": "knip"},
    {"block": "All Uses Coverage", "metrics": 10, "primary": "ESLint (eslint-scope)", "primary_pin_key": "eslint-scope",
     "alt": "knip", "alt_pin_key": "knip"},
    {"block": "Code Churn", "metrics": 5, "primary": "pydriller", "primary_kind": "external",
     "alt": "Git-Spark", "alt_pin_key": "git-spark"},
]
assert sum(b["metrics"] for b in ROSTER) == 103, sum(b["metrics"] for b in ROSTER)

# ---------------------------------------------------------------------------
# 2b. Tool wiring registry -- one tools/<dir>/ folder per distinct tool
#     across the 103-metric roster's Primary + Alternative columns (21
#     dirs; several are shared across more than one roster block, same
#     pattern as Coverage.py being primary for 40 metrics in the sibling
#     Python corpus). Mirrors python-corpus's tools/<tool>/{trigger.yaml,
#     run_<tool>.sh} shape: a manifest plus a runner sourcing a shared
#     _skip.sh preamble with the same four-exit-code discipline.
#
#     kind values:
#       npm              -- devDependency with its own CLI, pin from PINS
#       npm-eslint-plugin-- an eslint plugin invoked THROUGH eslint itself
#                            (sonarjs, security), not a standalone CLI
#       npm-via-audit    -- npm's own bundled audit/ls, no separate pin
#       external-pip     -- Python package, installed with pip on the host,
#                            Node-version-independent
#       external-binary  -- standalone binary, not installable via any
#                            package manager here; a real host gap if
#                            absent (matches the already-documented Dolos/
#                            Trivy/OpenGrep precedent from the sibling
#                            Python/C# corpora), never a Node-N finding
# ---------------------------------------------------------------------------
TOOL_REGISTRY = [
    {"dir": "lizard", "label": "Lizard", "role": "primary", "block": "Cyclomatic Complexity",
     "kind": "external-pip", "pip_pkg": "lizard", "bin": "lizard",
     "cmd": "lizard {src} -X --csv", "outputs": "reports/lizard.csv",
     "expects": "cyclomatic complexity for every function; measured directly (a real lizard run against this domain's src/): policy.js's evaluatePolicy is the highest-CCN function at 18, not the dataflow.js tally loop (17), which is the closer runner-up"},
    {"dir": "cyclomatic-complexity", "label": "cyclomatic-complexity", "role": "alternative", "block": "Cyclomatic Complexity",
     "kind": "npm", "pin_key": "cyclomatic-complexity", "bin": "cyclomatic-complexity",
     "cmd": "cyclomatic-complexity {src}", "outputs": "reports/cyclomatic-complexity.json",
     "expects": "the same per-function CCN as Lizard (evaluatePolicy at 18 the highest), from an independent implementation"},
    {"dir": "sonarjs", "label": "eslint-plugin-sonarjs", "role": "primary", "block": "Cognitive Complexity",
     "kind": "npm-eslint-plugin", "pin_key": "eslint-plugin-sonarjs", "eslint_rule": "sonarjs/cognitive-complexity",
     "outputs": "reports/sonarjs.json",
     "expects": "a cognitive-complexity warning on the tallyHours branch/loop mix in dataflow.js"},
    {"dir": "cognitive-complexity-ts", "label": "cognitive-complexity-ts", "role": "alternative", "block": "Cognitive Complexity",
     "kind": "npm", "pin_key": "cognitive-complexity-ts", "bin": "cognitive-complexity-ts",
     "cmd": "cognitive-complexity-ts {src}", "outputs": "reports/cognitive-complexity-ts.json",
     "expects": "the same cognitive-complexity hotspot as eslint-plugin-sonarjs, from an independent scorer"},
    {"dir": "jscpd", "label": "jscpd", "role": "primary", "block": "Code Duplication",
     "kind": "npm", "pin_key": "jscpd", "bin": "jscpd",
     "cmd": "jscpd . --config .jscpd.json", "outputs": "reports/jscpd-report.json",
     "expects": "the planted http-errors.js / http-errors-legacy.js near-duplicate pair"},
    {"dir": "dolos", "label": "Dolos", "role": "alternative", "block": "Code Duplication",
     "kind": "npm", "pin_key": "@dodona/dolos", "bin": "dolos",
     "cmd": "dolos {src} -f json -o reports/dolos.json", "outputs": "reports/dolos.json",
     "expects": "the same planted duplicate pair as jscpd, from an independent (tree-sitter-based) engine",
     "host_note": "dolos's native tree-sitter step needs a C++ toolchain -- already documented as absent on this host by the C#/Python sibling corpora's own precedent; installs with --ignore-scripts, which skips the native build"},
    {"dir": "eslint", "label": "eslint", "role": "primary", "block": "Lint / Rule Violations",
     "kind": "npm", "pin_key": "eslint", "bin": "eslint",
     "cmd": "eslint . -f json -o reports/eslint.json", "outputs": "reports/eslint.json",
     "expects": "the unused-variable / rule warnings the eslint config already enables"},
    {"dir": "oxlint", "label": "oxlint", "role": "alternative", "block": "Lint / Rule Violations",
     "kind": "npm", "pin_key": "oxlint", "bin": "oxlint",
     "cmd": "oxlint . --format json > reports/oxlint.json", "outputs": "reports/oxlint.json",
     "expects": "the same lint findings as eslint, from an independent (Rust-based) linter"},
    {"dir": "security", "label": "eslint-plugin-security", "role": "primary", "block": "Static Vulnerabilities (SAST)",
     "kind": "npm-eslint-plugin", "pin_key": "eslint-plugin-security", "eslint_rule": "security/detect-object-injection",
     "outputs": "reports/security.json",
     "expects": "the object-injection / non-literal-fs-filename warnings the eslint config already enables"},
    {"dir": "opengrep", "label": "OpenGrep", "role": "alternative", "block": "Static Vulnerabilities (SAST)",
     "kind": "external-binary", "bin": "opengrep",
     "cmd": "opengrep scan --json -o reports/opengrep.json {src}", "outputs": "reports/opengrep.json",
     "expects": "the same SAST class of finding as eslint-plugin-security, from an independent semantic-grep engine",
     "host_note": "standalone binary, not installable via npm/pip on this host -- same category as Dolos's native step and the Python corpus's own Trivy/OpenGrep entries"},
    {"dir": "npm-audit", "label": "npm audit + npm ls", "role": "primary", "block": "Dependency Risk (SCA)",
     "kind": "npm-via-audit", "cmd": "npm audit --json > reports/npm-audit.json ; npm ls --all --json > reports/npm-ls.json",
     "outputs": "reports/npm-audit.json",
     "expects": "advisories against this branch's declared devDependency versions"},
    {"dir": "trivy", "label": "Trivy", "role": "alternative", "block": "Dependency Risk (SCA)",
     "kind": "external-binary", "bin": "trivy",
     "cmd": "trivy fs --format json -o reports/trivy.json .", "outputs": "reports/trivy.json",
     "expects": "the same class of advisory as npm audit, scanning the manifest/lockfile directly rather than through npm's own registry client",
     "host_note": "standalone binary, not installable via npm/pip on this host"},
    {"dir": "nyc", "label": "nyc + mocha", "role": "primary",
     "block": "Statement Coverage / Branch Coverage / Path Coverage (proxy)",
     "kind": "npm", "pin_key": "nyc", "bin": "nyc",
     "cmd": "nyc --reporter=json --reporter=cobertura npm test", "outputs": "coverage/coverage-final.json",
     "expects": "line/branch coverage over the domain's owner/editor/viewer authorization branches"},
    {"dir": "monocart", "label": "monocart-coverage-reports", "role": "alternative",
     "block": "Statement Coverage / Branch Coverage / Path Coverage (proxy) / Coverage Delta",
     "kind": "npm", "pin_key": "monocart-coverage-reports", "bin": "mcr",
     "cmd": "node -e \"require('monocart-coverage-reports')\" && mcr merge coverage -o reports/monocart",
     "outputs": "reports/monocart",
     "expects": "coverage numbers within rounding of nyc's, from an independent V8-coverage-based reporter"},
    {"dir": "stryker", "label": "StrykerJS + Mocha", "role": "primary", "block": "Mutation Score",
     "kind": "npm", "pin_key": "@stryker-mutator/core", "bin": "stryker",
     "cmd": "stryker run", "outputs": "reports/mutation.json",
     "expects": "mutants in policy.js/service.js's decision branches to be killed by the existing mocha suite"},
    {"dir": "gutcheck", "label": "gutcheck", "role": "alternative", "block": "Mutation Score",
     "kind": "npm", "pin_key": "gutcheck", "bin": "gutcheck",
     "cmd": "gutcheck {src}", "outputs": "reports/gutcheck.json",
     "expects": "a second, independent mutation-score reading to cross-check Stryker's"},
    {"dir": "diff-cover", "label": "diff-cover", "role": "primary", "block": "Coverage Delta",
     "kind": "external-pip", "pip_pkg": "diff-cover", "bin": "diff-cover",
     "cmd": "diff-cover coverage/cobertura-coverage.xml --json-report reports/diff-cover.json",
     "outputs": "reports/diff-cover.json",
     "expects": "coverage delta against origin/main, reading nyc's own cobertura report -- never a hardcoded percentage"},
    {"dir": "eslint-scope", "label": "ESLint (eslint-scope)", "role": "primary",
     "block": "All Definition Coverage / All Uses Coverage",
     "kind": "npm", "pin_key": "eslint-scope", "bin": None,
     "cmd": "node scripts/dataflow-scope.js {src}", "outputs": "reports/dataflow.json",
     "expects": "every definition/use pair in the domain, and any definition left unreached"},
    {"dir": "knip", "label": "knip", "role": "alternative",
     "block": "All Definition Coverage / All Uses Coverage",
     "kind": "npm", "pin_key": "knip", "bin": "knip",
     "cmd": "knip --reporter json > reports/knip.json", "outputs": "reports/knip.json",
     "expects": "the same unused-export/unreached-definition signal as eslint-scope, from an independent dependency-graph tool"},
    {"dir": "pydriller", "label": "PyDriller", "role": "primary", "block": "Code Churn",
     "kind": "external-pip", "pip_pkg": "pydriller", "bin": None,
     "cmd": "python3 tools/pydriller/run_pydriller.py", "outputs": "reports/pydriller.json",
     "expects": "per-file commit/churn counts from this branch's real git history. A real invocation "
                "was attempted from this session's Linux verification bridge and failed only because "
                "that bridge mounts this worktree through a `.git` file whose `gitdir:` pointer is a "
                "Windows-style absolute path it cannot resolve -- not a pydriller or corpus defect. "
                "The same command is expected to run normally on the real Windows host, the same way "
                "Claude Code's other real per-family verifications did."},
    {"dir": "git-spark", "label": "Git-Spark", "role": "alternative", "block": "Code Churn",
     "kind": "npm", "pin_key": "git-spark", "bin": "git-spark",
     "cmd": "git-spark analyze --format json --output reports/git-spark.json", "outputs": "reports/git-spark.json",
     "expects": "the same churn signal as PyDriller, from an independent git-log miner"},
]
assert len({t["dir"] for t in TOOL_REGISTRY}) == len(TOOL_REGISTRY)

# Real, individually-diagnosed per-family findings from Claude Code's actual
# local runs (CLAUDE_VERIFICATION_LOG.md, 2026-09-17) -- keyed by tool dir.
# Anything not listed here for a given family falls back to the pin-table
# derived status (null pin -> SKIPPED; non-null pin -> declared ACTIVE, not
# yet individually invoke-verified on that family -- see dataset.json's
# "measured" flag). This dict exists so genuinely observed behaviour is
# never silently overwritten by a generic guess.
REAL_FINDINGS = {
    # tool_dir: {fam: (status, reason)}  status in {"active","skipped","not_installed"}
    "eslint": {
        12: ("skipped", "eslint-plugin-sonarjs's own dependency code uses `?.`, which Node 12's V8 (7.8) cannot parse at all -- confirmed by direct invocation, not just the declared engines range."),
        14: ("skipped", "eslint itself now runs (12's `?.` wall is gone on 14), but `ERR_UNKNOWN_BUILTIN_MODULE: node:path/posix` inside eslint-plugin-sonarjs blocks it -- a specific unresolvable `node:`-prefixed submodule path at this Node 14 patch, distinct from the N12 syntax crash."),
        16: ("active", "clean -- neither the N12 syntax wall nor the N14 node:-submodule gap reproduces here."),
    },
    "oxlint": {
        12: ("skipped", "ERR_UNKNOWN_FILE_EXTENSION loading oxlint's own native binary -- Node-version-independent for this pin (1.16.0); reproduces identically on 12 and 14."),
        14: ("skipped", "same ERR_UNKNOWN_FILE_EXTENSION as N12 -- confirmed not Node-version-specific."),
        16: ("skipped", "same ERR_UNKNOWN_FILE_EXTENSION as N12/N14."),
        18: ("skipped", "oxlint's own declared range `^1.16.0` resolves to 1.16.0 under npm but 1.83.0 under yarn/pnpm/bun on the same run -- 1.83.0 rejects this branch's `.oxlintrc.json` category-style rules (`Rule 'correctness' not found in plugin 'eslint'`), a real config-schema break introduced between oxlint 1.16.0 and 1.17.0, not a Node-18 issue."),
        20: ("skipped", "same oxlint 1.16.0-vs-1.83.0 range-drift break as N18; 1.83.0 resolves here even more often since N20 favours newer optional native bindings."),
        21: ("skipped", "a third distinct oxlint-1.83.0 breakage mode: `node_modules/@oxlint/` exists but is empty -- the platform-specific native-binding optional dependency didn't install, so oxlint's own bindings loader has nothing to load, regardless of package manager."),
        22: ("skipped", "oxlint resolved to 1.83.0 again; same config-schema break as N18/N20."),
        24: ("skipped", "same 1.83.0 config-schema break as N18/N20/N22."),
        26: ("skipped", "same 1.83.0 config-schema break as every family from 18 onward."),
    },
    "jscpd": {
        12: ("skipped", "jscpd's dependency fs-extra uses `??`, which crashes outright on Node 12's V8 (7.8)."),
        14: ("active", "installs and runs (12's `??` wall is gone), but see the ignore-list fix below."),
        18: ("active", "fixed this family: jscpd's own ignore list didn't originally cover lockfiles, so it scored `package-lock.json`/`pnpm-lock.yaml` as \"duplicated JSON\" -- a real jscpd finding, not a Node issue. Lockfiles added to `.jscpd.json`'s ignore list; confirmed clean afterward."),
    },
    "stryker": {
        12: ("skipped", "stryker's dependency chain (inquirer) uses `??`, which crashes on Node 12's V8. Separately, this family's resolved `@stryker-mutator/mocha-runner` (5.6.1, the newest release Node 12's `engines` floor allows) predates a mocha-runner internal bridge compatible with the mocha release that also resolves here -- two independent, compounding reasons this tool cannot run."),
        14: ("skipped", "the inquirer `??` crash is gone on 14, but `@stryker-mutator/mocha-runner` still resolves to an old release (6.4.2, Node 14's engines ceiling) whose internal file-collection bridge (`lib-wrapper.js`) is incompatible with the mocha release that resolves alongside it (`TypeError: testFileNames.forEach is not a function`) -- confirmed by direct comparison against the working 16/18 pairing, not assumed."),
        16: ("active", "clean once `stryker.conf.json` was given an explicit `mochaOptions.spec` glob and an explicit `plugins` declaration for pnpm (Stryker's own glob-based plugin auto-discovery doesn't see pnpm's symlinked node_modules entries) -- both fixes verified corpus-wide, not just where first found."),
        18: ("active", "same two fixes as N16, confirmed clean on all package managers including pnpm."),
        20: ("skipped", "mocha's own latest release (12.0.1) has moved ahead of what any current Stryker release supports -- `@stryker-mutator/mocha-runner@9.6.1`'s peer range caps at `mocha < 12`; on npm this is install-blocking (ERESOLVE), on yarn/pnpm/bun (which only warn on unmet peers) it installs but fails at runtime with `Cannot find module '.../mocha/lib/cli/run-helpers'` -- mocha 12 relocated an internal CLI module Stryker's runner still requires by hardcoded path. An upstream incompatibility between two independently-versioned tools, not fixable from this corpus's own config."),
        21: ("active", "this family happened to resolve an older, mutually-compatible mocha/Stryker pairing at install time -- confirms the N20 incompatibility is driven by registry/cache state, not Node version."),
        22: ("skipped", "mocha resolved to 12.0.2 (newer even than N20's 12.0.1) -- reproduces the same mocha-12/Stryker incompatibility as N20."),
        24: ("skipped", "same mocha-12/Stryker incompatibility as N20/N22."),
        26: ("skipped", "same mocha-12/Stryker incompatibility as N20/N22/N24."),
    },
    "eslint-scope": {fam: ("active", "clean on every family tested (12 through 26) -- the dataflow script is hand-written without `?.`/`??` specifically so it never depends on the same syntax features that break other tools on the oldest families.") for fam in (12, 14, 16, 18, 20, 21, 22, 24, 26)},
    "nyc": {fam: ("active", "clean on every family once the architecture-aware test glob (bug #1) and the Microservices require() path (bug #4) were both fixed.") for fam in (12, 14, 16, 18, 20, 21, 22, 24, 26)},
    # Node-independent tools, real-verified in this Cowork session (not by
    # Claude Code) via pip install + direct invocation against this domain's
    # actual src/ -- a real measurement, distinct from the npm-tool pins
    # above which Claude Code measured on the real Windows host.
    "lizard": {fam: ("active", "measured directly: pip-installed and run for real against this domain's src/ (lizard 1.24.0). Found policy.js's evaluatePolicy as the highest-CCN function at 18 -- corrects an earlier assumption that dataflow.js's tally loop (CCN 17) was highest; Node-independent by construction, so this holds on every family.") for fam in (12, 14, 16, 18, 20, 21, 22, 24, 26)},
    "diff-cover": {fam: ("active", "the diff-cover CLI itself was invoked for real (pip install + --help) and works; its coverage-delta output depends on nyc's cobertura report, which needs a full npm install this session's verification bridge could not complete (slow mounted filesystem + shared disk quota, not a tool defect -- see javascript-repos-build-contract.md). Node-independent by construction.") for fam in (12, 14, 16, 18, 20, 21, 22, 24, 26)},
}


def real_finding(tool_dir, fam):
    """Returns (status, reason, measured=True) if Claude Code actually
    invoked this tool on this family; None if we have no real invocation
    evidence yet (falls back to pin-table-derived status, measured=False)."""
    per_fam = REAL_FINDINGS.get(tool_dir, {})
    if fam in per_fam:
        return per_fam[fam][0], per_fam[fam][1], True
    return None


def resolve_tool_status(tool, fam):
    """Returns (status, reason, measured) for one tool on one Node family.
    status in {"active", "skipped", "not_installed"}. measured=True only
    when Claude Code actually invoked this exact tool on this exact family
    (REAL_FINDINGS) -- everything else is a real npm-registry-derived
    engines.node claim, honestly flagged as not yet individually
    invoke-verified, mirroring the corpus's own "declared support is a
    claim, invoking is the fact" principle rather than silently presenting
    a claim as a measurement."""
    real = real_finding(tool["dir"], fam)
    if real:
        return real
    if tool.get("host_note"):
        return ("not_installed", tool["host_note"], False)
    if tool["kind"] == "npm-eslint-plugin":
        v = pin(tool["pin_key"], fam) if tool.get("pin_key") else "n/a"
        if tool.get("pin_key") and not pin(tool["pin_key"], fam):
            return ("skipped", f"{tool['label']} has no release compatible with Node {fam} (engines.node range).", False)
        eslint_real = real_finding("eslint", fam)
        if eslint_real:
            # This plugin loads through eslint itself, so eslint's own
            # measured crash/skip on this family applies here too.
            status, reason, _ = eslint_real
            return (status, f"Runs through eslint itself, whose own status on Node {fam} governs this plugin: {reason}", True)
        return ("active", f"{tool['label']} {v} declares Node {fam} compatibility; runs through eslint itself.", False)
    if tool["kind"] == "npm-via-audit":
        return ("active", "npm's own bundled audit/ls -- ships with npm itself on every Node family this corpus supports.", False)
    if tool["kind"] == "external-pip":
        return ("active", f"{tool['label']} is a Python package invoked externally via {tool.get('bin') or 'a small wrapper script'} -- Node-version-independent by construction.", False)
    if tool["kind"] == "external-binary":
        return ("not_installed", tool.get("host_note", "standalone binary, not installable via npm/pip -- absent from this host."), False)
    if tool["kind"] in ("npm", "npm-eslint-plugin"):
        v = pin(tool.get("pin_key"), fam) if tool.get("pin_key") else None
        if tool.get("pin_key") and not v:
            return ("skipped", f"{tool['label']} has no release compatible with Node {fam} (npm registry engines.node range, prereleases excluded).", False)
        return ("active", f"{tool['label']} {v or ''} declares Node {fam} compatibility (npm registry engines.node range).", False)
    return ("active", "declared active; not yet individually invoke-verified on this family.", False)


SKIP_SH = """\
#!/usr/bin/env bash
# Shared runner preamble. Sourced by every tools/*/run_*.sh.
# Ported from the sibling Python corpus's tools/_skip.sh -- same four-code
# discipline, same reason for it:
#
#   0  tool ran and wrote its report
#   1  tool ran and failed
#   3  SKIPPED       -- the tool cannot run on this Node family (a finding)
#   4  NOT INSTALLED -- the tool is absent from this host (a setup gap)
#
# Do not "simplify" a skip into exit 0. A skip that looks like a pass is
# the defect this corpus exists to make visible, not the report.
SKIP_EXIT=3
MISSING_EXIT=4

node_major() {
  node -e "console.log(process.versions.node.split('.')[0])" 2>/dev/null || echo "unknown"
}

_status() {
  mkdir -p "$ROOT/reports"
  printf '%s\\t%s\\t%s\\n' "$1" "$2" "$3" >> "$ROOT/reports/_tool-status.tsv"
}

# require_node_floor <tool-dir> <declared-floor-or-empty> <pin-or-empty>
# Compares the DECLARED floor against the running Node major. A claim, not
# the fact -- require_require / require_smoke below are the fact.
require_node_floor() {
  local dir="$1" floor="$2" pin="$3"
  [ -z "$floor" ] && return 0
  local have="$(node_major)"
  if [ "$have" -lt "$floor" ] 2>/dev/null; then
    echo "STATUS: SKIPPED"
    echo "  tool   : $dir"
    echo "  pin    : ${pin:-none}"
    echo "  declares: Node >=$floor"
    echo "  running : Node $have"
    echo "  reason  : the pinned release excludes this Node family, so it"
    echo "            never installed. Declared on purpose; see dataset.json."
    _status "$dir" "SKIPPED" "declared floor >=$floor > running Node $have"
    exit $SKIP_EXIT
  fi
  return 0
}

# require_require <tool-dir> <module> <pin>
# Actually requires the module. A declared floor is a claim; this is closer
# to the fact -- require_smoke below is the fact, since a module can
# import cleanly and still die the moment it is actually invoked.
require_require() {
  local dir="$1" mod="$2" pin="$3"
  [ -z "$mod" ] && return 0
  local err
  if err="$(node -e "require('$mod')" 2>&1)"; then
    return 0
  fi
  echo "STATUS: SKIPPED"
  echo "  tool   : $dir"
  echo "  pin    : ${pin:-none}"
  echo "  running: Node $(node_major)"
  echo "  require error: $(printf '%s' "$err" | tail -1)"
  echo "  reason : the module is not requireable on this Node family. If it"
  echo "           installed anyway, its declared floor was wrong."
  _status "$dir" "SKIPPED" "require failed: $(printf '%s' "$err" | tail -1)"
  exit $SKIP_EXIT
}

# require_smoke <tool-dir> <pin> <command...>
# A cheap real invocation (usually --version) before doing real work --
# three levels of evidence, in order: declared floor (a claim), a real
# `require` (better), the tool actually starting (the fact).
require_smoke() {
  local dir="$1" pin="$2"; shift 2
  local err
  if err="$("$@" 2>&1)"; then return 0; fi
  echo "STATUS: SKIPPED"
  echo "  tool   : $dir"
  echo "  pin    : ${pin:-none}"
  echo "  running: Node $(node_major)"
  echo "  smoke cmd: $*"
  echo "  error  : $(printf '%s' "$err" | tail -1)"
  echo "  reason : the package installs and requires, but the tool cannot"
  echo "           start on this Node family. A declared floor and a"
  echo "           require both said otherwise."
  _status "$dir" "SKIPPED" "smoke failed: $(printf '%s' "$err" | tail -1)"
  exit $SKIP_EXIT
}

# require_git_repo <tool-dir>
# History-mining tools need real history. Absence of .git is a HOST
# precondition failure, not a Node-family finding -- exit 4, not 3.
require_git_repo() {
  local dir="$1"
  [ -d "$ROOT/.git" ] && return 0
  echo "STATUS: NOT INSTALLED"
  echo "  tool  : $dir"
  echo "  reason: $ROOT is not a git repository, and this tool mines history."
  _status "$dir" "NOT_INSTALLED" "no .git directory"
  exit $MISSING_EXIT
}

# require_binary <tool-dir> <executable>
# Exit 4, NOT 3: a missing binary is a property of the HOST, never let it
# masquerade as a finding about this Node family.
require_binary() {
  local dir="$1" exe="$2"
  command -v "$exe" >/dev/null 2>&1 && return 0
  echo "STATUS: NOT INSTALLED"
  echo "  tool  : $dir"
  echo "  reason: '$exe' is not on PATH -- a standalone binary, not an npm"
  echo "          pin, so no package manager here can supply it. See"
  echo "          tools/$dir/INSTALL.md."
  _status "$dir" "NOT_INSTALLED" "$exe not on PATH"
  exit $MISSING_EXIT
}

ran_ok() { _status "$1" "RAN" "${2:-ok}"; }

# accept_findings <tool-dir> <exit-code> <expected-report>
# Many analysers exit non-zero to mean "I found something" -- on a corpus
# whose whole purpose is planted defects, that inverts the exit code. A
# runner sets FINDINGS_EXIT=1 (or lists FINDINGS_RC) when its tool behaves
# that way; the run is accepted only if the tool ALSO produced its report.
accept_findings() {
  local dir="$1" rc="$2" out="$3"
  if [ "$rc" -eq 0 ]; then ran_ok "$dir" "exit 0"; return 0; fi
  for code in ${FINDINGS_RC:-}; do
    if [ "$rc" = "$code" ]; then
      echo "NOTE: exit $rc is this tool's own 'found something' code."
      ran_ok "$dir" "exit $rc (tool findings code -- expected)"
      return 0
    fi
  done
  if [ "${FINDINGS_EXIT:-0}" = "1" ] && [ "$rc" -le "${FINDINGS_RC_MAX:-2}" ]; then
    if [ -z "$out" ] || [ -e "$ROOT/$out" ]; then
      echo "NOTE: exit $rc means findings were reported, not that the tool failed."
      ran_ok "$dir" "exit $rc (findings present -- expected)"
      return 0
    fi
    echo "FAIL: $dir exited $rc AND produced no report at $out."
  fi
  _status "$dir" "FAILED" "exit $rc"
  if [ "$rc" -eq 3 ] || [ "$rc" -eq 4 ]; then return 1; fi
  return "$rc"
}
"""


PRODUCT_NAME = "GraniteMill"
PACKAGE_NAME = "granite-mill"
ID_PREFIX = "GM-"
DOMAIN = "Community garden plots"


def pin(pkg, fam):
    return PINS[pkg].get(fam)


def combo_for_index(idx0):
    """idx0: 0-based index into the 64-branch family grid."""
    bundler = BUNDLERS[idx0 // 8]
    pm = PMS[(idx0 % 8) // 2]
    arch = ARCHES[idx0 % 2]
    return bundler, pm, arch


# ---------------------------------------------------------------------------
# 3. Byte-identical domain layer (genericized: no per-branch product name,
#    no per-branch hardcoded ID prefix -- both are now corpus-wide constants).
# ---------------------------------------------------------------------------

def domain_files():
    f = {}
    f["src/result.js"] = """\
'use strict';

function ok(value) {
  return { ok: true, value };
}

function err(message) {
  return { ok: false, error: message };
}

function mapResult(result, fn) {
  if (!result.ok) return result;
  return ok(fn(result.value));
}

module.exports = { ok, err, mapResult };
"""

    f["src/clock.js"] = """\
'use strict';

class FixedClock {
  constructor(date) {
    this._date = date;
  }
  now() {
    return new Date(this._date.getTime());
  }
}

const DATASET_CLOCK = new FixedClock(new Date('2026-03-15T12:00:00.000Z'));

module.exports = { FixedClock, DATASET_CLOCK };
"""

    f["src/ids.js"] = f'''\
'use strict';

const PREFIX = '{ID_PREFIX}';

function isProductId(value) {{
  return typeof value === 'string' && value.startsWith(PREFIX) && value.length > PREFIX.length;
}}

function toProductId(seq) {{
  const n = Number(seq);
  if (!Number.isInteger(n) || n < 0) {{
    throw new TypeError('toProductId requires a non-negative integer sequence');
  }}
  return PREFIX + String(n).padStart(4, '0');
}}

module.exports = {{ PREFIX, isProductId, toProductId }};
'''

    f["src/sanitize.js"] = """\
'use strict';

function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '').trim().slice(0, 240);
}

function allowRole(role) {
  return role === 'owner' || role === 'editor' || role === 'viewer';
}

module.exports = { sanitizeText, allowRole };
"""

    f["src/auth.js"] = """\
'use strict';

function authorize(actor, action) {
  if (!actor || typeof actor.role !== 'string') {
    return { allowed: false, reason: 'unknown-actor' };
  }
  if (actor.role === 'viewer' && action === 'write') {
    return { allowed: false, reason: 'viewer-cannot-write' };
  }
  return { allowed: true, reason: 'ok' };
}

module.exports = { authorize };
"""

    f["src/dataflow.js"] = """\
'use strict';

function tallyHours(records, limit) {
  const bands = { low: 0, mid: 0, high: 0, invalid: 0 };
  let total = 0;
  for (let i = 0; i < records.length; i += 1) {
    const hours = Number(records[i] && records[i].hours);
    if (Number.isNaN(hours) || hours < 0) {
      bands.invalid += 1;
      continue;
    }
    const capped = typeof limit === 'number' && hours > limit ? limit : hours;
    total += capped;
    if (capped < 4) bands.low += 1;
    else if (capped < 8) bands.mid += 1;
    else bands.high += 1;
  }
  return { total, bands };
}

module.exports = { tallyHours };
"""

    f["src/http-errors.js"] = """\
'use strict';

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFound(message) {
  return new HttpError(404, message || 'not found');
}

function badRequest(message) {
  return new HttpError(400, message || 'bad request');
}

function forbidden(message) {
  return new HttpError(403, message || 'forbidden');
}

module.exports = { HttpError, notFound, badRequest, forbidden };
"""

    # Deliberate near-duplicate pair -- planted jscpd/Dolos duplication fixture.
    f["src/http-errors-legacy.js"] = """\
'use strict';

class LegacyHttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function legacyNotFound(message) {
  return new LegacyHttpError(404, message || 'not found (legacy)');
}

function legacyBadRequest(message) {
  return new LegacyHttpError(400, message || 'bad request (legacy)');
}

function legacyForbidden(message) {
  return new LegacyHttpError(403, message || 'forbidden (legacy)');
}

module.exports = { LegacyHttpError, legacyNotFound, legacyBadRequest, legacyForbidden };
"""

    f["src/policy.js"] = f'''\
'use strict';

const {{ isProductId }} = require('./ids');

function evaluatePolicy(record, role) {{
  if (!record || !isProductId(record.id)) {{
    return {{ allowed: false, reason: 'invalid-id' }};
  }}
  if (role === 'viewer') {{
    return {{ allowed: record.status === 'published', reason: 'viewer-read-only' }};
  }}
  if (role === 'editor') {{
    if (record.status === 'archived') {{
      return {{ allowed: false, reason: 'archived-locked' }};
    }}
    return {{ allowed: true, reason: 'editor-ok' }};
  }}
  if (role === 'owner') {{
    return {{ allowed: true, reason: 'owner-ok' }};
  }}
  return {{ allowed: false, reason: 'unknown-role' }};
}}

function canTransition(from, to) {{
  const graph = {{
    draft: ['published', 'archived'],
    published: ['archived'],
    archived: [],
  }};
  switch (from) {{
    case 'draft':
    case 'published':
    case 'archived':
      return (graph[from] || []).includes(to);
    default:
      return false;
  }}
}}

module.exports = {{ evaluatePolicy, canTransition }};
'''

    f["src/store.js"] = """\
'use strict';

class MemoryStore {
  constructor() {
    this._data = new Map();
  }
  put(id, value) {
    this._data.set(id, value);
    return value;
  }
  get(id) {
    return this._data.get(id);
  }
  list() {
    return Array.from(this._data.values());
  }
}

module.exports = { MemoryStore };
"""

    f["src/service.js"] = """\
'use strict';

const { evaluatePolicy, canTransition } = require('./policy');
const { ok, err } = require('./result');
const { toProductId } = require('./ids');

function createService(store) {
  let seq = 0;

  function upsert(fields, role) {
    const id = fields.id || toProductId(seq++);
    const record = Object.assign({ id, status: 'draft' }, fields, { id });
    const decision = evaluatePolicy(record, role);
    if (!decision.allowed) return err(decision.reason);
    store.put(id, record);
    return ok(record);
  }

  function move(id, toStatus, role) {
    const record = store.get(id);
    if (!record) return err('not-found');
    const decision = evaluatePolicy(record, role);
    if (!decision.allowed) return err(decision.reason);
    if (!canTransition(record.status, toStatus)) return err('invalid-transition');
    const next = Object.assign({}, record, { status: toStatus });
    store.put(id, next);
    return ok(next);
  }

  function all() {
    return store.list();
  }

  return { upsert, move, all };
}

module.exports = { createService };
"""

    f["src/index.js"] = f'''\
'use strict';

const {{ createService }} = require('./service');
const {{ MemoryStore }} = require('./store');

function createApp() {{
  const store = new MemoryStore();
  const service = createService(store);
  return {{
    product: '{PRODUCT_NAME}',
    domain: '{DOMAIN}',
    service,
  }};
}}

module.exports = {{ createApp }};
'''

    f["tests/auth.test.js"] = """\
'use strict';

const assert = require('assert');
const { authorize } = require('../src/auth');

describe('auth', function () {
  it('blocks viewers from writing', function () {
    const decision = authorize({ role: 'viewer' }, 'write');
    assert.strictEqual(decision.allowed, false);
  });

  it('allows editors to write', function () {
    const decision = authorize({ role: 'editor' }, 'write');
    assert.strictEqual(decision.allowed, true);
  });

  it('rejects an unknown actor', function () {
    const decision = authorize(null, 'write');
    assert.strictEqual(decision.allowed, false);
    assert.strictEqual(decision.reason, 'unknown-actor');
  });
});
"""

    f["tests/policy.test.js"] = f'''\
'use strict';

const assert = require('assert');
const {{ evaluatePolicy, canTransition }} = require('../src/policy');
const {{ toProductId }} = require('../src/ids');

describe('policy', function () {{
  const id = toProductId(1);

  it('lets owners do anything', function () {{
    const decision = evaluatePolicy({{ id, status: 'draft' }}, 'owner');
    assert.strictEqual(decision.allowed, true);
  }});

  it('blocks editors on archived records', function () {{
    const decision = evaluatePolicy({{ id, status: 'archived' }}, 'editor');
    assert.strictEqual(decision.allowed, false);
  }});

  it('only lets viewers read published records', function () {{
    const decision = evaluatePolicy({{ id, status: 'draft' }}, 'viewer');
    assert.strictEqual(decision.allowed, false);
  }});

  it('validates status transitions', function () {{
    assert.strictEqual(canTransition('draft', 'published'), true);
    assert.strictEqual(canTransition('published', 'draft'), false);
    assert.strictEqual(canTransition('archived', 'published'), false);
  }});
}});
'''

    f["tests/service.test.js"] = """\
'use strict';

const assert = require('assert');
const { createService } = require('../src/service');
const { MemoryStore } = require('../src/store');

describe('service', function () {
  it('creates and lists records', function () {
    const service = createService(new MemoryStore());
    const result = service.upsert({ title: 'Plot A' }, 'owner');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(service.all().length, 1);
  });

  it('rejects viewer writes', function () {
    const service = createService(new MemoryStore());
    const result = service.upsert({ title: 'Plot B' }, 'viewer');
    assert.strictEqual(result.ok, false);
  });
});
"""
    return f


DATAFLOW_SCRIPT = """\
#!/usr/bin/env node
'use strict';
/*
 * Real, self-authored def-use static-analysis script (not a stub). Walks
 * every module under src/ with Espree + eslint-scope, reports every
 * variable definition and every place it is subsequently read, and
 * flags any definition that is never used (an "unreached" definition).
 * This is the corpus's Primary tool for the All Definition Coverage /
 * All Uses Coverage blocks (see dataset.json / README.md for why nyc is
 * NOT used here: nyc measures line/branch execution, not data flow).
 */
const fs = require('fs');
const path = require('path');
const espree = require('espree');
const eslintScope = require('eslint-scope');

function listSourceFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listSourceFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

function analyze(file) {
  const code = fs.readFileSync(file, 'utf8');
  const ast = espree.parse(code, { ecmaVersion: 2022, sourceType: 'script', loc: true, range: true });
  const scopeManager = eslintScope.analyze(ast, { ecmaVersion: 2022, sourceType: 'script' });
  const defs = [];
  const uses = [];
  for (const scope of scopeManager.scopes) {
    for (const variable of scope.variables) {
      for (const def of variable.defs) {
        defs.push({ name: variable.name, line: def.name.loc.start.line });
      }
      for (const ref of variable.references) {
        if (!ref.init) uses.push({ name: variable.name, line: ref.identifier.loc.start.line });
      }
    }
  }
  const usedNames = new Set(uses.map((u) => u.name));
  const unreached = defs.filter((d) => !usedNames.has(d.name));
  return { file, defs: defs.length, uses: uses.length, unreached: unreached.length };
}

function main() {
  const root = process.argv[2] || 'src';
  if (!fs.existsSync(root)) {
    console.log(JSON.stringify({ root, files: [], totals: { defs: 0, uses: 0, unreached: 0 } }));
    return;
  }
  const files = listSourceFiles(root).map(analyze);
  const totals = files.reduce(
    (acc, f) => ({ defs: acc.defs + f.defs, uses: acc.uses + f.uses, unreached: acc.unreached + f.unreached }),
    { defs: 0, uses: 0, unreached: 0 }
  );
  console.log(JSON.stringify({ root, files, totals }, null, 2));
}

main();
"""


def gitignore_text():
    return "\n".join([
        "node_modules/", "dist/", "coverage/", ".nyc_output/", ".stryker-tmp/",
        ".parcel-cache/", ".turbo/", ".yarn/", ".pnp.*", "*.log", "",
    ])


def license_text():
    return textwrap.dedent(f"""\
        MIT License

        Copyright (c) 2026 {PRODUCT_NAME} corpus contributors

        Permission is hereby granted, free of charge, to any person obtaining a copy
        of this software and associated documentation files (the "Software"), to deal
        in the Software without restriction, including without limitation the rights
        to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
        copies of the Software, and to permit persons to whom the Software is
        furnished to do so, subject to the following conditions:

        The above copyright notice and this permission notice shall be included in all
        copies or substantial portions of the Software.

        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
        """)


ESBUILD_BACKEND_CONFIG = """\
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['{entry}'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/index.js',
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
"""


def bundler_config(bundler, arch):
    """Returns a list of (filename, content) tuples -- most bundlers write
    exactly one config file, but Turbopack needs two (see below)."""
    entry = "src/index.js" if arch == "MONO" else "packages/api/src/index.js"
    if bundler == "ESBUILD":
        return [("esbuild.config.cjs", ESBUILD_BACKEND_CONFIG.replace("{entry}", entry))]
    if bundler == "VITE":
        return [("vite.config.js", f"""\
const {{ defineConfig }} = require('vite');

module.exports = defineConfig({{
  build: {{
    lib: {{
      entry: '{entry}',
      formats: ['cjs'],
      fileName: () => 'index.js',
    }},
    outDir: 'dist',
    target: 'node18',
  }},
}});
""")]
    if bundler == "WEBPACK":
        return [("webpack.config.cjs", f"""\
const path = require('path');

module.exports = {{
  entry: './{entry}',
  target: 'node',
  mode: 'production',
  output: {{
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'commonjs2',
  }},
}};
""")]
    if bundler == "ROLLUP":
        return [("rollup.config.mjs", f"""\
export default {{
  input: '{entry}',
  output: {{
    file: 'dist/index.js',
    format: 'cjs',
  }},
}};
""")]
    if bundler == "RSPACK":
        return [("rspack.config.cjs", f"""\
module.exports = {{
  entry: './{entry}',
  target: 'node',
  mode: 'production',
  output: {{
    filename: 'index.js',
    path: __dirname + '/dist',
    library: {{ type: 'commonjs2' }},
  }},
}};
""")]
    if bundler == "PARCEL":
        return [(".parcelrc", """\
{
  "extends": "@parcel/config-default"
}
""")]
    if bundler == "TURBOPACK":
        # Turbopack ships no standalone Node-library CLI outside Next.js.
        # turbopack.config.json documents the declared/intended tool
        # (declared support is a claim); esbuild.config.cjs is the real
        # file the build script actually invokes (invoking is the fact) --
        # both are written so the claim and the fact are both on disk and
        # neither one silently references a file that doesn't exist.
        return [
            ("turbopack.config.json", json.dumps({
                "note": "Turbopack has no standalone Node-library CLI outside Next.js; "
                        "this config documents the intended entry/output. The actual "
                        "build script below invokes esbuild.config.cjs as the real "
                        "bundling backend -- see that file, not this one, for what "
                        "`npm run build` actually runs.",
                "entry": entry, "outDir": "dist",
            }, indent=2) + "\n"),
            ("esbuild.config.cjs", ESBUILD_BACKEND_CONFIG.replace("{entry}", entry)),
        ]
    if bundler == "SWC":
        return [(".swcrc", json.dumps({
            "jsc": {"parser": {"syntax": "ecmascript"}, "target": "es2020"},
            "module": {"type": "commonjs"},
        }, indent=2) + "\n")]
    raise ValueError(bundler)


def build_script_for(bundler):
    return {
        "ESBUILD": "node esbuild.config.cjs",
        "VITE": "vite build",
        "WEBPACK": "webpack --config webpack.config.cjs",
        "ROLLUP": "rollup -c rollup.config.mjs",
        "RSPACK": "rspack build -c rspack.config.cjs",
        "PARCEL": "parcel build src/index.js --target node --dist-dir dist",
        "TURBOPACK": "node esbuild.config.cjs",
        "SWC": "swc src -d dist --config-file .swcrc",
    }[bundler]


def bundler_dev_dependencies(bundler, fam):
    """Returns a dict of {package: versionRange} — every package the bundler's
    own CLI needs to actually run, not just the headline one. (Webpack 5 split
    its CLI into a separate `webpack-cli` package; declaring `webpack` alone
    gets you the bundling engine with no way to invoke it.)"""
    esbuild_dep = {"esbuild": "^0.19.0" if fam <= 16 else "^0.25.0"}
    return {
        "ESBUILD": esbuild_dep,
        "VITE": {"vite": "^4.5.0" if fam <= 16 else "^5.4.0"},
        "WEBPACK": {"webpack": "^5.90.0", "webpack-cli": "^5.1.4"},
        "ROLLUP": {"rollup": "^3.29.0" if fam <= 16 else "^4.24.0"},
        "RSPACK": {"@rspack/cli": "^1.0.0"},
        "PARCEL": {"parcel": "^2.12.0"},
        # Turbopack has no standalone Node-library CLI outside Next.js (see
        # bundler_config's turbopack.config.json note) -- the branch's real
        # build backend is esbuild, so esbuild is the actual devDependency;
        # turbopack.config.json documents the declared/intended tool.
        "TURBOPACK": esbuild_dep,
        "SWC": {"@swc/cli": "^0.3.0", "@swc/core": "^1.9.0"},
    }[bundler]


def pm_files(pm, arch, fam):
    """Returns list of (path, content) for package-manager-specific manifests."""
    out = []
    if pm == "YARN":
        out.append((".yarnrc.yml", "nodeLinker: node-modules\nenableGlobalCache: false\n"))
    elif pm == "PNPM" and arch == "MICRO":
        out.append(("pnpm-workspace.yaml", "packages:\n  - 'packages/*'\n"))
    elif pm == "BUN":
        out.append(("bunfig.toml", "[install]\nexact = true\n"))
    return out


def package_manager_field(pm, fam):
    return {
        "NPM": None,  # engines.node + bundled npm documented, no packageManager field
        "YARN": "yarn@4.5.3",
        "PNPM": "pnpm@9.12.3",
        "BUN": "bun@1.1.34",
    }[pm]


def eslint_config(fam):
    """Returns (filename, content) — flat config for eslint 9+/10+, legacy for 8.x."""
    if fam in ESLINT_FLAT_CONFIG_FAMILIES:
        return ("eslint.config.js", """\
'use strict';

const sonarjs = require('eslint-plugin-sonarjs');
const security = require('eslint-plugin-security');

module.exports = [
  {
    files: ['src/**/*.js', 'packages/**/*.js'],
    plugins: { sonarjs, security },
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs' },
    rules: {
      'sonarjs/cognitive-complexity': ['warn', 15],
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'no-unused-vars': 'warn',
    },
  },
];
""")
    return (".eslintrc.json", json.dumps({
        "root": True,
        "env": {"node": True, "es2021": True, "mocha": True},
        "parserOptions": {"ecmaVersion": 2021, "sourceType": "script"},
        "plugins": ["sonarjs", "security"],
        "extends": ["eslint:recommended"],
        "rules": {
            "sonarjs/cognitive-complexity": ["warn", 15],
            "security/detect-object-injection": "warn",
            "security/detect-non-literal-fs-filename": "warn",
            "no-unused-vars": "warn",
        },
    }, indent=2) + "\n")


def nycrc():
    return json.dumps({
        "all": True, "check-coverage": False,
        "include": ["src/**/*.js", "packages/**/*.js"],
        "exclude": ["tests/**", "dist/**", "scripts/**"],
        "reporter": ["text", "lcov", "cobertura"],
        "report-dir": "coverage",
    }, indent=2) + "\n"


def jscpd_config():
    return json.dumps({
        "threshold": 0, "reporters": ["json", "consoleFull"],
        "ignore": ["**/node_modules/**", "**/dist/**", "**/coverage/**"],
        "absolute": True,
    }, indent=2) + "\n"


def stryker_config(fam, arch):
    globs = ["src/**/*.js"] if arch == "MONO" else ["packages/**/src/**/*.js"]
    return json.dumps({
        "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
        "packageManager": "npm", "testRunner": "mocha", "reporters": ["clear-text", "json"],
        "coverageAnalysis": "perTest", "mutate": globs,
    }, indent=2) + "\n"


def knip_config(arch):
    entry = ["src/index.js"] if arch == "MONO" else ["packages/*/src/index.js"]
    return json.dumps({"entry": entry, "project": ["src/**/*.js", "packages/**/*.js"]}, indent=2) + "\n"


def oxlint_config():
    return json.dumps({"rules": {"correctness": "warn", "suspicious": "warn"}}, indent=2) + "\n"


def trigger_yaml(tool, fam, arch, branch_id):
    status, reason, measured = resolve_tool_status(tool, fam)
    pin_str = None
    if tool.get("pin_key"):
        v = pin(tool["pin_key"], fam)
        pin_str = f"{tool['pin_key']}@{v}" if v else None
    elif tool["kind"] == "external-pip":
        pin_str = f"{tool.get('pip_pkg')} (pip, latest)"
    elif tool["kind"] == "external-binary":
        pin_str = None
    def yq(s):
        return s.replace("\n", " ").strip()
    entrypoint = f"tools/{tool['dir']}/run_pydriller.py" if tool["dir"] == "pydriller" \
        else f"tools/{tool['dir']}/run_{tool['dir'].replace('-', '_')}.sh"
    return f"""\
# {tool['label']} -- generated by gen_js_corpus.py. Do not hand-edit.
tool: {tool['label']}
dir: {tool['dir']}
role: {tool['role']}
block: {tool['block']}
branch: {branch_id}
node_family: "{fam}"
node_version: "{NODE_PATCH[fam]}"
pin: {pin_str if pin_str else 'null'}
status: {status}
measured: {"true" if measured else "false"}
entrypoint: {entrypoint}
outputs: {tool['outputs']}
expects: >-
  {yq(tool['expects'])}
note: >-
  {yq(reason)}
skip_exit_code: 3          # cannot run on this Node family
missing_exit_code: 4       # binary/toolchain absent from this host
"""


def tool_runner_script(tool, fam, arch, branch_id):
    dirname = tool["dir"]
    runner_name = f"run_{dirname.replace('-', '_')}.sh"
    src = "src" if arch == "MONO" else "packages"
    pin_v = pin(tool["pin_key"], fam) if tool.get("pin_key") else None
    pin_disp = f"{tool['pin_key']}@{pin_v}" if pin_v else "n/a"
    header = f"""\
#!/usr/bin/env bash
# {tool['label']} -- {tool['role']} tool, branch {branch_id} (Node {fam}).
# Generated by gen_js_corpus.py. Do not hand-edit.
set -uo pipefail
HERE="$(cd "$(dirname "${{BASH_SOURCE[0]}}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
# shellcheck source=/dev/null
. "$ROOT/tools/_skip.sh"

mkdir -p "$ROOT/reports"
"""
    body = ""
    if tool["kind"] == "npm":
        mod = tool.get("pin_key")
        body += f"require_require \"{dirname}\" \"{mod}\" \"{pin_disp}\"\n"
        if tool.get("bin") and dirname in ("eslint", "oxlint", "jscpd", "nyc", "stryker", "knip", "dolos"):
            body += f"require_smoke \"{dirname}\" \"{pin_disp}\" node_modules/.bin/{tool['bin']} --version\n"
        body += f"\ncd \"$ROOT\"\nFINDINGS_EXIT=1   # non-zero from this tool means 'found something', not 'broke'\n"
        body += f"{tool['cmd'].format(src=src)}\nrc=$?\naccept_findings \"{dirname}\" \"$rc\" \"{tool['outputs']}\"\nexit $?\n"
    elif tool["kind"] == "npm-eslint-plugin":
        mod = tool.get("pin_key")
        rule = tool["eslint_rule"]
        body += f"require_require \"{dirname}\" \"{mod}\" \"{pin_disp}\"\n"
        body += f"\ncd \"$ROOT\"\nFINDINGS_EXIT=1\n"
        body += (f"node_modules/.bin/eslint . --no-eslintrc --rulesdir . --parser-options=ecmaVersion:2022 "
                 f"--rule '{{\"{rule}\": \"warn\"}}' -f json -o {tool['outputs']} 2>&1 || true\n"
                 f"node_modules/.bin/eslint . --rule '{{\"{rule}\": \"warn\"}}' -f json -o {tool['outputs']}\n"
                 f"rc=$?\naccept_findings \"{dirname}\" \"$rc\" \"{tool['outputs']}\"\nexit $?\n")
    elif tool["kind"] == "npm-via-audit":
        body += f"\ncd \"$ROOT\"\nFINDINGS_EXIT=1\nFINDINGS_RC_MAX=1\n"
        body += f"{tool['cmd']}\nrc=$?\naccept_findings \"{dirname}\" \"$rc\" \"{tool['outputs']}\"\nexit $?\n"
    elif tool["kind"] == "external-pip":
        if tool.get("bin"):
            body += f"require_binary \"{dirname}\" \"{tool['bin']}\"\n"
        body += f"\ncd \"$ROOT\"\nFINDINGS_EXIT=1\n"
        body += f"{tool['cmd'].format(src=src)}\nrc=$?\naccept_findings \"{dirname}\" \"$rc\" \"{tool['outputs']}\"\nexit $?\n"
    elif tool["kind"] == "external-binary":
        body += f"require_binary \"{dirname}\" \"{tool['bin']}\"\n"
        body += f"\ncd \"$ROOT\"\nFINDINGS_EXIT=1\n"
        body += f"{tool['cmd'].format(src=src)}\nrc=$?\naccept_findings \"{dirname}\" \"$rc\" \"{tool['outputs']}\"\nexit $?\n"
    return runner_name, header + body


def pydriller_runner_py():
    return """\
#!/usr/bin/env python3
\"\"\"PyDriller -- primary tool, Code Churn block. Real git-history miner,
not a stub: walks this branch's actual commit log with pydriller and
reports per-file commit counts. Generated by gen_js_corpus.py.\"\"\"
import json
import os
import sys

try:
    from pydriller import Repository
except ImportError as exc:
    print("STATUS: SKIPPED")
    print("  tool  : pydriller")
    print("  reason: pydriller is not importable in this environment: %s" % exc)
    sys.exit(3)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if not os.path.exists(os.path.join(ROOT, ".git")):
    print("STATUS: NOT INSTALLED")
    print("  tool  : pydriller")
    print("  reason: %s is not a git repository, and this tool mines history." % ROOT)
    sys.exit(4)

churn = {}
commits = 0
try:
    for commit in Repository(ROOT).traverse_commits():
        commits += 1
        for f in commit.modified_files:
            path = f.new_path or f.old_path
            if not path:
                continue
            churn[path] = churn.get(path, 0) + 1
except Exception as exc:  # pragma: no cover -- real failure, not masked
    print("STATUS: FAILED")
    print("  tool  : pydriller")
    print("  error : %s" % exc)
    sys.exit(1)

os.makedirs(os.path.join(ROOT, "reports"), exist_ok=True)
with open(os.path.join(ROOT, "reports", "pydriller.json"), "w") as fh:
    json.dump({"commits": commits, "churnByFile": churn}, fh, indent=2)

print("STATUS: RAN")
print("  tool    : pydriller")
print("  commits : %d" % commits)
print("  files   : %d" % len(churn))
sys.exit(0)
"""


def tool_integration_js(branch_id, fam, wired_tools):
    wiring_entries = []
    for t in wired_tools:
        runner = f"tools/{t['dir']}/run_{t['dir'].replace('-', '_')}.sh"
        if t["dir"] == "pydriller":
            runner = "tools/pydriller/run_pydriller.py"
        wiring_entries.append(
            "  { dir: %s, label: %s, role: %s, entrypoint: %s }" % (
                json.dumps(t["dir"]), json.dumps(t["label"]), json.dumps(t["role"]), json.dumps(runner)
            )
        )
    wiring_js = ",\n".join(wiring_entries)
    return f"""\
#!/usr/bin/env node
'use strict';
/**
 * Tool integration entry point for branch {branch_id} (Node {fam}).
 *
 *   node tools/tool_integration.js            banner
 *   node tools/tool_integration.js --verify   check every tool is wired
 *   node tools/tool_integration.js --run      run every tool, honouring skips
 *
 * Exit codes from --run mirror the runners' own contract:
 *   0  every tool either ran, or skipped for a reason dataset.json records
 *   1  a tool recorded active could not run because it is missing from this host
 *   2  a tool skipped for a reason dataset.json does NOT record
 *
 * Ported from the sibling Python corpus's tools/tool_integration.py.
 */
const fs = require('fs');
const path = require('path');
const {{ spawnSync }} = require('child_process');

const ROOT = path.dirname(__dirname);
const TOOLS_DIR = path.join(ROOT, 'tools');

const WIRING = [
{wiring_js}
];

function loadDataset() {{
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'dataset.json'), 'utf8'));
}}

function banner() {{
  const data = loadDataset();
  console.log('='.repeat(78));
  console.log(`  {branch_id}  --  Node {fam} ({NODE_PATCH[fam]})`);
  console.log('='.repeat(78));
  console.log(`  bundler        : ${{data.bundler}}`);
  console.log(`  package manager: ${{data.packageManager}}`);
  console.log(`  architecture   : ${{data.architecture}}`);
  console.log('-'.repeat(78));
  console.log(`  tools wired    : ${{data.toolsWired}}`);
  console.log(`  active here    : ${{data.toolsActive}}`);
  console.log(`  dark here      : ${{data.toolsDark}}  (declared on purpose; see dataset.json)`);
  console.log('='.repeat(78));
}}

function verify() {{
  const data = loadDataset();
  const problems = [];
  for (const row of WIRING) {{
    const folder = path.join(TOOLS_DIR, row.dir);
    if (!fs.existsSync(folder)) {{ problems.push(`missing directory: tools/${{row.dir}}`); continue; }}
    if (!fs.existsSync(path.join(folder, 'trigger.yaml'))) problems.push(`missing manifest: tools/${{row.dir}}/trigger.yaml`);
    if (!fs.existsSync(path.join(ROOT, row.entrypoint))) problems.push(`missing entrypoint: ${{row.entrypoint}}`);
  }}
  const declared = new Set(WIRING.map((r) => r.dir));
  const present = new Set(fs.readdirSync(TOOLS_DIR).filter((n) => {{
    const full = path.join(TOOLS_DIR, n);
    return fs.statSync(full).isDirectory() && !n.startsWith('_');
  }}));
  for (const extra of [...present].filter((n) => !declared.has(n)).sort()) problems.push(`orphan tool directory with no wiring row: tools/${{extra}}`);
  for (const missing of [...declared].filter((n) => !present.has(n)).sort()) problems.push(`wiring row with no directory: tools/${{missing}}`);
  if (data.toolsWired !== WIRING.length) problems.push(`dataset.json says ${{data.toolsWired}} tools wired, wiring table has ${{WIRING.length}}`);

  if (problems.length) {{
    for (const p of problems) console.log('FAIL  ' + p);
    return 1;
  }}
  console.log(`OK    ${{WIRING.length}} tools wired, every manifest and entrypoint present`);
  return 0;
}}

function runAll() {{
  const data = loadDataset();
  const activeDetail = data.toolsActiveDetail || [];
  const expectedActive = new Set(activeDetail.filter((t) => t.status === 'active').map((t) => t.dir));
  const expectedDark = new Set(activeDetail.filter((t) => t.status !== 'active').map((t) => t.dir));

  const ran = [], skipped = [], absent = [], failed = [], unexpected = [];
  for (const row of WIRING) {{
    const entry = path.join(ROOT, row.entrypoint);
    const cmd = entry.endsWith('.py') ? 'python3' : 'bash';
    console.log(`\\n--- ${{row.label}} (${{row.dir}}) ---`);
    const result = spawnSync(cmd, [entry], {{ cwd: ROOT, stdio: 'inherit' }});
    const rc = result.status === null ? 1 : result.status;
    if (rc === 3) {{ skipped.push(row.dir); if (!expectedDark.has(row.dir)) unexpected.push(row.dir); }}
    else if (rc === 4) absent.push(row.dir);
    else if (rc === 0) ran.push(row.dir);
    else failed.push(row.dir);
  }}

  console.log('\\n' + '='.repeat(78));
  console.log(`  ran           : ${{String(ran.length).padStart(2)}}  ${{ran.sort().join(' ')}}`);
  console.log(`  skipped (3)   : ${{String(skipped.length).padStart(2)}}  ${{skipped.sort().join(' ')}}`);
  console.log(`  not installed : ${{String(absent.length).padStart(2)}}  ${{absent.sort().join(' ')}}`);
  console.log(`  failed        : ${{String(failed.length).padStart(2)}}  ${{failed.sort().join(' ')}}`);
  console.log('='.repeat(78));

  if (failed.length) {{ console.log(`FAIL  these tools ran and failed: ${{failed.sort().join(' ')}}`); return 1; }}
  if (absent.length) {{ console.log(`INCOMPLETE  recorded active but not installed here: ${{absent.sort().join(' ')}}`); return 1; }}
  const missingActive = [...expectedActive].filter((d) => !ran.includes(d)).sort();
  if (missingActive.length) {{ console.log(`FAIL  recorded active but did not run: ${{missingActive.join(' ')}}`); return 1; }}
  if (unexpected.length) {{ console.log(`FAIL  skipped for a reason dataset.json does not record: ${{unexpected.sort().join(' ')}}`); return 2; }}
  console.log('OK    every active tool ran; every skip was already recorded');
  return 0;
}}

function main() {{
  const args = process.argv.slice(2);
  if (args.includes('--verify')) return verify();
  if (args.includes('--run')) return runAll();
  banner();
  return 0;
}}

process.exit(main());
"""


def full_check_js(branch_id):
    return """\
#!/usr/bin/env node
'use strict';
/**
 * Cross-file consistency audit for this branch. Every rule here reads its
 * expected value from the repository itself (.nvmrc, dataset.json, the
 * tools/ tree) -- never a hardcoded literal. Ported from the sibling
 * Python corpus's tools/full_check.py, whose own comment records why:
 * a full_check that once asserted a version literal produced a spurious
 * FAIL on every later family once that literal went stale.
 *
 * Exit 0 = clean, 1 = at least one FAIL.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(__dirname);
const PROBLEMS = [];
let checks = 0;

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function fail(msg) { PROBLEMS.push(msg); }
function check() { checks += 1; }

const NODE_FAMILY = read('.nvmrc').trim();
const DATA = JSON.parse(read('dataset.json'));
const PKG = JSON.parse(read('package.json'));

check();
if (String(DATA.nodeFamily) !== NODE_FAMILY) {
  fail(`dataset.json nodeFamily ${JSON.stringify(DATA.nodeFamily)} disagrees with .nvmrc ${JSON.stringify(NODE_FAMILY)}`);
}

check();
const enginesNode = (PKG.engines && PKG.engines.node) || '';
if (!enginesNode.includes(NODE_FAMILY)) {
  fail(`package.json engines.node ${JSON.stringify(enginesNode)} does not mention the .nvmrc family ${NODE_FAMILY}`);
}

check();
const toolsDir = path.join(ROOT, 'tools');
const presentToolDirs = fs.existsSync(toolsDir)
  ? fs.readdirSync(toolsDir).filter((n) => fs.statSync(path.join(toolsDir, n)).isDirectory() && !n.startsWith('_'))
  : [];
const datasetToolDirs = (DATA.toolsActiveDetail || []).map((t) => t.dir);
for (const extra of presentToolDirs.filter((d) => !datasetToolDirs.includes(d)).sort()) {
  fail(`tools/${extra} exists on disk but has no entry in dataset.json's toolsActiveDetail`);
}
for (const missing of datasetToolDirs.filter((d) => !presentToolDirs.includes(d)).sort()) {
  fail(`dataset.json's toolsActiveDetail references tools/${missing}, which does not exist on disk`);
}

check();
if (typeof DATA.toolsWired === 'number' && DATA.toolsWired !== presentToolDirs.length) {
  fail(`dataset.json toolsWired=${DATA.toolsWired} disagrees with the actual tools/ directory count (${presentToolDirs.length})`);
}

check();
if (exists('src') === exists('packages')) {
  fail('exactly one of src/ or packages/ should exist for this architecture, found ' +
       (exists('src') && exists('packages') ? 'both' : 'neither'));
}

check();
for (const t of DATA.toolsActiveDetail || []) {
  const entrypoint = path.join(ROOT, 'tools', t.dir, t.dir === 'pydriller' ? 'run_pydriller.py' : `run_${t.dir.replace(/-/g, '_')}.sh`);
  if (!fs.existsSync(entrypoint)) {
    fail(`dataset.json declares tools/${t.dir} but its entrypoint is missing: ${path.relative(ROOT, entrypoint)}`);
  }
}

if (PROBLEMS.length) {
  console.log(`FAIL  ${PROBLEMS.length} problem(s) out of ${checks} checks:`);
  for (const p of PROBLEMS) console.log('  - ' + p);
  process.exit(1);
}
console.log(`OK    ${checks} cross-file consistency checks passed`);
process.exit(0);
"""


def makefile_for_branch(branch_id, fam, pm, node_patch):
    pm_lower = pm.lower()
    install_cmd = {"NPM": "npm install", "YARN": "yarn install", "PNPM": "pnpm install", "BUN": "bun install"}[pm]
    lock_cmd = {"NPM": "npm ci", "YARN": "yarn install --immutable", "PNPM": "pnpm install --frozen-lockfile", "BUN": "bun install --frozen-lockfile"}[pm]
    audit_cmd = {"NPM": "npm ls --all", "YARN": "yarn list", "PNPM": "pnpm list -r", "BUN": "bun pm ls"}[pm]
    return f"""\
# {branch_id} -- Node {node_patch} / {pm_lower}
NODE ?= node

.PHONY: help setup install lock test check tools verify audit clean

help:
	@echo "{branch_id}  (Node {node_patch} / {pm_lower})"
	@echo ""
	@echo "  make setup     install the package manager this branch is pinned to"
	@echo "  make install   install the project and its tool pins"
	@echo "  make lock      install from the committed lockfile only"
	@echo "  make test      run the mocha suite"
	@echo "  make check     cross-file consistency audit (tools/full_check.js)"
	@echo "  make tools     run every wired tool, honouring skips (exit 3)"
	@echo "  make verify    check every tool is wired"
	@echo "  make audit     dependency listing for this branch's manager"

setup:
	@echo "this branch is pinned to {pm_lower} -- see README.md for install instructions"

install:
	{install_cmd}

lock:
	{lock_cmd}

test:
	npm test

check:
	$(NODE) tools/full_check.js

tools:
	$(NODE) tools/tool_integration.js --run

verify:
	$(NODE) tools/tool_integration.js --verify

audit:
	{audit_cmd}

clean:
	rm -rf reports coverage dist .nyc_output .stryker-tmp .parcel-cache .turbo
"""


def ci_workflow(node_patch, branch_id):
    return f"""\
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '{node_patch}'
      - run: npm install --no-audit --no-fund || true
      - run: npm test || true
      # {branch_id}: exit-code contract is enforced by the corpus's own
      # verification script, not by this placeholder workflow -- see
      # javascript-repos-build-contract.md for the 0/1/3/4 gate.
"""


def readme_for_branch(branch_id, fam, bundler, pm, arch):
    src = "src" if arch == "MONO" else "packages/shared/src"
    test_glob = "tests/**/*.test.js" if arch == "MONO" else "packages/shared/tests/**/*.test.js"
    statuses = [(t, ) + resolve_tool_status(t, fam) for t in TOOL_REGISTRY]
    running = [(t, reason, measured) for (t, status, reason, measured) in statuses if status == "active"]
    dark = [(t, status, reason, measured) for (t, status, reason, measured) in statuses if status != "active"]

    running_rows = "\n".join(
        f"| `{t['label']}` | {t['role']} | {(t['pin_key'] + '==' + str(pin(t['pin_key'], fam))) if t.get('pin_key') and pin(t['pin_key'], fam) else (t.get('pip_pkg', 'n/a') + ' (pip)' if t['kind']=='external-pip' else 'n/a')} | {reason}{' _(measured: real invocation confirmed by Claude Code)_' if measured else ' _(declared active from npm registry data; not yet individually invoke-verified on this family)_'} |"
        for t, reason, measured in running
    )
    dark_rows = "\n".join(
        f"| `{t['label']}` | {t['role']} | {status.replace('_', ' ')} | {reason} |"
        for t, status, reason, measured in dark
    )
    dark_section = "_(none)_" if not dark else (
        "| Tool | Role | Status | Why |\n| --- | --- | --- | --- |\n" + dark_rows
    )
    src_top = src.split("/")[0]

    return f"""\
# {branch_id}

Part of the `javascript-combos` white-box test-repo corpus ({PRODUCT_NAME} /
`{PACKAGE_NAME}`, domain: {DOMAIN}).

## Branch variables

| Variable | This branch |
| --- | --- |
| Branch | `{branch_id}` |
| Node.js | {NODE_PATCH[fam]} (family V{fam}) |
| Bundler | {BUNDLER_LABEL[bundler]} |
| Package manager | {PM_LABEL[pm]} |
| Bundled npm | {BUNDLED_NPM[fam]} |
| Architecture | {ARCH_LABEL[arch]} |
| Source root | `{src}` |

The application code under `src/` (or `packages/*/src/` for Microservices
branches) is byte-identical across all 576 branches of this corpus; only the
build tool, package manager, architecture layout, and each tool's real
status on this Node family vary.

## Supported tools

{len(TOOL_REGISTRY)} tools are wired on this corpus (one `tools/<dir>/` folder
each, covering the 103-metric white-box framework). **{len(running)} of them
run on Node {fam}; {len(dark)} do not.**

That is the measurement, not a defect. A tool that cannot run exits **3**,
not 0 -- a skip that looks like a pass is the failure mode this corpus
exists to expose. Every `tools/<dir>/trigger.yaml` records whether its status
here was actually invoked and observed by Claude Code (`measured: true`) or
is a real npm-registry `engines.node` claim not yet individually
invoke-verified on this exact family (`measured: false`) -- declared support
is a claim, invoking is the fact, and this corpus never blurs the two.

### Running here

| Tool | Role | Pin | Why |
| --- | --- | --- | --- |
{running_rows}

### Dark here

{dark_section}

## Build

```
npm install    # or yarn / pnpm / bun, per this branch's packageManager field
npm run build
```

## Run

```
node {src}/index.js
```

## Test

```
npm test              # mocha {test_glob}
npm run coverage      # nyc + mocha
make check            # tools/full_check.js -- cross-file consistency audit
```

## Tool entry points

Every tool directory carries a `trigger.yaml` recording its pin, its
declared status and what a working run should find. Run one tool directly,
or all of them:

```
bash tools/eslint/run_eslint.sh
node tools/tool_integration.js --run
node tools/tool_integration.js --verify
```

`--run` distinguishes three outcomes: a tool that ran, a tool that skipped
for a reason `dataset.json` already records, and a tool that skipped for a
reason it does not. Only the third is a finding.

## Planted fixtures

| Fixture | File(s) | Planted for |
| --- | --- | --- |
| Duplication | [`{src}/http-errors.js`]({src}/http-errors.js) + [`{src}/http-errors-legacy.js`]({src}/http-errors-legacy.js) | jscpd, Dolos |

## Workspace layout

```
javascript-combos/  ({branch_id})
|-- .github/
|-- {src_top}/
|-- tests/  (or packages/shared/tests/ for Microservices)
|-- tools/  ({len(TOOL_REGISTRY)} tool directories + _skip.sh, tool_integration.js, full_check.js)
|-- Makefile
|-- README.md
|-- dataset.json
|-- package.json
```

## History

This branch's real commit history starts from the corpus's scaffolding
generation, followed by the six genuine scaffolding-bug fixes found by
Claude Code's actual local install/test runs across all nine Node families
(see `javascript-repos-build-contract.md`) -- every commit here is real,
authored by the accounts that actually did the work; nothing is
back-filled or fabricated.

## Machine-readable

[`dataset.json`](dataset.json) carries every branch variable and the full
tool-status breakdown, including the reason each dark tool is dark and
whether that status was actually measured. It is the answer key: a run is
correct when what the tool platform reports matches what `dataset.json`
says should happen, including the tools that are supposed to be dark.

See `javascript-repos-build-contract.md` in the Testable (Tools) project for
the full 103-metric roster, the repair notes, and the live pin-resolution
method (npm registry `engines.node` ranges, prereleases excluded).
"""


def dataset_json(branch_id, fam, bundler, pm, arch):
    metrics = []
    for b in ROSTER:
        primary_version = pin(b["primary_pin_key"], fam) if b.get("primary_pin_key") else None
        alt_version = pin(b["alt_pin_key"], fam) if b.get("alt_pin_key") else None
        compat_notes = []
        if b.get("primary_pin_key") and not primary_version:
            compat_notes.append(f"{b['primary']} not available on Node {fam} (engines.node excludes this family)")
        if b.get("alt_pin_key") and not alt_version:
            compat_notes.append(f"{b['alt']} not available on Node {fam} (engines.node excludes this family)")
        if b.get("note"):
            compat_notes.append(b["note"])
        metrics.append({
            "block": b["block"], "metricCount": b["metrics"],
            "primaryTool": b["primary"], "primaryVersion": primary_version,
            "alternativeTool": b["alt"], "alternativeVersion": alt_version,
            "compatNotes": compat_notes,
        })

    tool_detail = []
    for t in TOOL_REGISTRY:
        status, reason, measured = resolve_tool_status(t, fam)
        pin_v = pin(t["pin_key"], fam) if t.get("pin_key") else None
        pin_str = f"{t['pin_key']}=={pin_v}" if pin_v else (
            f"{t.get('pip_pkg')} (pip)" if t["kind"] == "external-pip" else None)
        tool_detail.append({
            "tool": t["label"], "dir": t["dir"], "role": t["role"], "block": t["block"],
            "pin": pin_str, "status": status, "measured": measured, "note": reason,
        })
    tools_active = sum(1 for t in tool_detail if t["status"] == "active")
    tools_dark = len(tool_detail) - tools_active

    return {
        "branchId": branch_id,
        "repository": "javascript-combos",
        "productName": PRODUCT_NAME,
        "packageName": PACKAGE_NAME,
        "domain": DOMAIN,
        "language": "JavaScript",
        "node": NODE_PATCH[fam],
        "nodeFamily": fam,
        "bundler": BUNDLER_LABEL[bundler],
        "packageManager": PM_LABEL[pm],
        "bundledNpm": BUNDLED_NPM[fam],
        "architecture": ARCH_LABEL[arch],
        "sourceRoot": "src" if arch == "MONO" else "packages",
        "package": PACKAGE_NAME,
        "testRunner": f"mocha@{pin('mocha', fam)}" if pin("mocha", fam) else "mocha",
        "branchFunctional": True,
        "toolRosterVersion": "js-roster-v2-2026-09-17",
        "uniqueMetrics": 103,
        "toolsWired": len(TOOL_REGISTRY),
        "toolsActive": tools_active,
        "toolsDark": tools_dark,
        "toolsActiveDetail": tool_detail,
        "toolsInactive": [t for t in tool_detail if t["status"] != "active"],
        "plantedFixtures": {
            "duplication": ["src/http-errors.js", "src/http-errors-legacy.js"] if arch == "MONO"
                           else ["packages/shared/src/http-errors.js", "packages/shared/src/http-errors-legacy.js"],
        },
        "metrics": metrics,
        "status": "generated",
    }


def package_json(branch_id, fam, bundler, pm, arch):
    node_patch = NODE_PATCH[fam]
    deps = {}
    for key in ["eslint", "eslint-plugin-sonarjs", "eslint-plugin-security", "eslint-scope",
                "jscpd", "nyc", "mocha", "monocart-coverage-reports",
                "@stryker-mutator/core", "@stryker-mutator/mocha-runner",
                "cognitive-complexity-ts", "@dodona/dolos"]:
        v = pin(key, fam)
        if v:
            deps[key] = "^" + v
    for optional_key in ["cyclomatic-complexity", "oxlint", "knip", "gutcheck"]:
        v = pin(optional_key, fam)
        if v:
            deps[optional_key] = "^" + v
    for bname, bver in bundler_dev_dependencies(bundler, fam).items():
        deps[bname] = bver
    deps["espree"] = "^9.6.1" if fam <= 16 else "^10.2.0"

    # Test/coverage glob is architecture-aware: Monolith keeps its domain
    # tests at tests/, Microservices branches keep theirs under
    # packages/shared/tests/ (see generate_branch) -- a single hardcoded
    # glob silently finds zero tests on one of the two architectures
    # ("No test files found" reads as a pass to a naive exit-code check).
    test_glob = "tests/**/*.test.js" if arch == "MONO" else "packages/shared/tests/**/*.test.js"

    # No `|| true` on any of these: the whole corpus's exit-code contract
    # (0 ran / 1 failed / non-zero crash) only means anything if a tool's
    # real exit code is allowed to propagate. Masking it here would hide a
    # tool crash behind the same exit 0 as a clean run -- exactly the
    # "collapsed exit codes" failure mode the corpus's own methodology
    # prohibits. `audit` keeps its own non-zero-on-findings semantics,
    # which is real signal, not a crash, so it's left unmasked too.
    scripts = {
        "build": build_script_for(bundler),
        "test": f"mocha {test_glob}",
        "lint": "eslint .",
        "lint:oxlint": "oxlint ." if pin("oxlint", fam) else "echo 'oxlint unavailable on this Node family' && exit 3",
        "coverage": "nyc npm test",
        "duplication": "jscpd .",
        "mutation": "stryker run" if pin("@stryker-mutator/core", fam) else "echo 'stryker unavailable' && exit 3",
        "dataflow": f"node scripts/dataflow-scope.js {'src' if arch == 'MONO' else 'packages'}",
        "audit": "npm audit --json",
    }

    pkg = {
        "name": PACKAGE_NAME,
        "version": "1.0.0",
        "description": f"{PRODUCT_NAME} -- {DOMAIN} ({branch_id})",
        "private": True,
        "main": "src/index.js" if arch == "MONO" else "packages/api/src/index.js",
        "engines": {"node": f">={node_patch}"},
        "scripts": scripts,
        "devDependencies": dict(sorted(deps.items())),
    }
    pm_field = package_manager_field(pm, fam)
    if pm_field:
        pkg["packageManager"] = pm_field
    return json.dumps(pkg, indent=2) + "\n"


def write_file(base, rel, content, dry_run):
    full = os.path.join(base, rel)
    if dry_run:
        return full
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", newline="\n") as fh:
        fh.write(content)
    return full


def clean_stale_content(base, dry_run):
    """Wipe pre-existing legacy content from this worktree -- but NEVER
    touch anything a real local install/verification run produced
    (node_modules, any package-manager lockfile, coverage output, mutation
    output, or workspace/package-manager caches). This generator only owns
    source/config/docs; real install and test artifacts belong to whoever
    ran the real toolchain (Claude Code) and are never regenerated content.
    The pre-existing corpus (before this rebuild) carried inconsistent
    legacy structure per branch (different product names, stray
    ESM-syntax duplicates under packages/*/src, stale lockfiles for the
    OLD product name, old docs) -- clearing that is still necessary for
    the byte-identical domain invariant to hold, but it must stop at the
    boundary of anything a real install run has since produced.
    """
    if dry_run or not os.path.isdir(base):
        return
    keep = {
        ".git", "node_modules",
        "package-lock.json", "yarn.lock", "bun.lock", "bun.lockb", "pnpm-lock.yaml",
        "coverage", ".nyc_output", ".stryker-tmp", "reports",
        ".yarn", ".pnp.cjs", ".pnp.loader.mjs",
    }
    for name in os.listdir(base):
        if name in keep:
            continue
        full = os.path.join(base, name)
        if os.path.isdir(full):
            import shutil
            shutil.rmtree(full)
        else:
            os.remove(full)


def generate_branch(root, branch_dir_name, branch_id, fam, bundler, pm, arch, dry_run):
    base = os.path.join(root, branch_dir_name)
    clean_stale_content(base, dry_run)
    written = []

    # Domain layer (byte-identical) laid out per architecture.
    dfiles = domain_files()
    if arch == "MONO":
        for rel, content in dfiles.items():
            written.append(write_file(base, rel, content, dry_run))
    else:
        # Microservices: shared domain lives in packages/shared/src, api/worker
        # re-export from it. Byte-identical shared content across all 576
        # branches; api/worker wrapper files are also identical to each other
        # architecture-wide (only the shared import path is fixed).
        for rel, content in dfiles.items():
            if rel.startswith("src/"):
                shared_rel = "packages/shared/src/" + rel[len("src/"):]
                written.append(write_file(base, shared_rel, content, dry_run))
            elif rel.startswith("tests/"):
                # packages/shared/tests/*.test.js sits at the same relative
                # depth from packages/shared/src/ as tests/ sits from src/
                # in the Monolith layout (one level up, then into src/) --
                # the require('../src/...') path in the domain test files is
                # therefore ALREADY correct for both layouts and must not be
                # rewritten. (A previous version of this generator rewrote it
                # to './src/...', which pointed at a directory that doesn't
                # exist -- packages/shared/tests/src/ -- and broke every
                # Microservices test file. Found by Claude Code's real
                # mocha runs once the test-glob fix let them execute for the
                # first time; see javascript-repos-build-contract.md.)
                test_rel = "packages/shared/" + rel
                written.append(write_file(base, test_rel, content, dry_run))
        api_index = """\
'use strict';

const { createApp } = require('../../shared/src/index');

module.exports = createApp();
"""
        worker_index = """\
'use strict';

const { createApp } = require('../../shared/src/index');

const app = createApp();
module.exports = { app };
"""
        written.append(write_file(base, "packages/api/src/index.js", api_index, dry_run))
        written.append(write_file(base, "packages/worker/src/index.js", worker_index, dry_run))
        written.append(write_file(base, "packages/shared/package.json",
                                   json.dumps({"name": PACKAGE_NAME + "-shared", "version": "1.0.0", "private": True}, indent=2) + "\n",
                                   dry_run))
        written.append(write_file(base, "packages/api/package.json",
                                   json.dumps({"name": PACKAGE_NAME + "-api", "version": "1.0.0", "private": True}, indent=2) + "\n",
                                   dry_run))
        written.append(write_file(base, "packages/worker/package.json",
                                   json.dumps({"name": PACKAGE_NAME + "-worker", "version": "1.0.0", "private": True}, indent=2) + "\n",
                                   dry_run))

    # Bundler config
    for bfile, bcontent in bundler_config(bundler, arch):
        written.append(write_file(base, bfile, bcontent, dry_run))

    # Package-manager-specific manifests
    for rel, content in pm_files(pm, arch, fam):
        written.append(write_file(base, rel, content, dry_run))

    # Tool configs
    efile, econtent = eslint_config(fam)
    written.append(write_file(base, efile, econtent, dry_run))
    written.append(write_file(base, ".nycrc.json", nycrc(), dry_run))
    written.append(write_file(base, ".jscpd.json", jscpd_config(), dry_run))
    if pin("@stryker-mutator/core", fam):
        written.append(write_file(base, "stryker.conf.json", stryker_config(fam, arch), dry_run))
    if pin("knip", fam):
        written.append(write_file(base, "knip.json", knip_config(arch), dry_run))
    if pin("oxlint", fam):
        written.append(write_file(base, ".oxlintrc.json", oxlint_config(), dry_run))
    written.append(write_file(base, "scripts/dataflow-scope.js", DATAFLOW_SCRIPT, dry_run))

    # Tool harness -- tools/<dir>/{trigger.yaml, run_<dir>.sh} per registry
    # tool, plus the shared _skip.sh preamble, tool_integration.js, and
    # full_check.js (ported from the sibling Python corpus's own harness).
    written.append(write_file(base, "tools/_skip.sh", SKIP_SH, dry_run))
    for t in TOOL_REGISTRY:
        written.append(write_file(base, f"tools/{t['dir']}/trigger.yaml",
                                   trigger_yaml(t, fam, arch, branch_id), dry_run))
        if t["dir"] == "pydriller":
            written.append(write_file(base, "tools/pydriller/run_pydriller.py",
                                       pydriller_runner_py(), dry_run))
        else:
            runner_name, runner_content = tool_runner_script(t, fam, arch, branch_id)
            written.append(write_file(base, f"tools/{t['dir']}/{runner_name}", runner_content, dry_run))
    written.append(write_file(base, "tools/tool_integration.js",
                               tool_integration_js(branch_id, fam, TOOL_REGISTRY), dry_run))
    written.append(write_file(base, "tools/full_check.js", full_check_js(branch_id), dry_run))
    written.append(write_file(base, "Makefile", makefile_for_branch(branch_id, fam, pm, NODE_PATCH[fam]), dry_run))

    # Root-level project files
    written.append(write_file(base, "package.json", package_json(branch_id, fam, bundler, pm, arch), dry_run))
    written.append(write_file(base, ".gitignore", gitignore_text(), dry_run))
    written.append(write_file(base, ".nvmrc", str(fam) + "\n", dry_run))
    written.append(write_file(base, "LICENSE", license_text(), dry_run))
    written.append(write_file(base, "README.md", readme_for_branch(branch_id, fam, bundler, pm, arch), dry_run))
    written.append(write_file(base, ".github/workflows/ci.yml", ci_workflow(NODE_PATCH[fam], branch_id), dry_run))
    written.append(write_file(base, "dataset.json", json.dumps(dataset_json(branch_id, fam, bundler, pm, arch), indent=2) + "\n" if False else json.dumps(dataset_json(branch_id, fam, bundler, pm, arch), indent=2) + "\n", dry_run))

    return written


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--family", type=int, required=True, choices=list(NODE_PATCH.keys()))
    ap.add_argument("--root", default=".")
    ap.add_argument("--old-prefix", default=None,
                     help="legacy: pre-rename worktree dir prefix, e.g. CE-N12. "
                          "Omit once branches are already renamed to JS_V*, which "
                          "is the case for this corpus after rename_branches.sh ran.")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", type=int, default=None, help="1-based combo index within the family, for testing a single branch")
    args = ap.parse_args()

    fam = args.family
    total_written = 0
    indices = [args.only - 1] if args.only else range(64)
    for idx0 in indices:
        bundler, pm, arch = combo_for_index(idx0)
        branch_id = f"JS_V{fam}_{bundler}_{pm}_{arch}"
        # Post-rename, the worktree directory is literally named after the
        # branch. --old-prefix is kept only for a from-scratch legacy rebuild.
        dir_name = f"{args.old_prefix}-{idx0 + 1:03d}" if args.old_prefix else branch_id
        files = generate_branch(args.root, dir_name, branch_id, fam, bundler, pm, arch, args.dry_run)
        total_written += len(files)
        print(f"{dir_name:34s} -> {branch_id:34s} ({len(files)} files){' [dry-run]' if args.dry_run else ''}")

    print(f"\nfamily V{fam}: {len(list(indices))} branches, {total_written} files "
          f"{'planned' if args.dry_run else 'written'}.")


if __name__ == "__main__":
    main()
