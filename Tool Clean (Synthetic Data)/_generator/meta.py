"""Metadata table for the JavaScript-Tools-Clean corpus: one entry per
tool folder, used to generate each folder's README.md and to drive the
verifier. Mirrors the Python-Tools-Clean corpus's own build.py/verify.py
split, adapted for a heterogeneous JS/TS/Rust/C toolset where no single
manifest format or command shape fits every tool.
"""

# status: "measured" (installed and actually invoked in this environment,
#         a real pass/fail result) or "not_installed" (binary or CLI is
#         genuinely absent here -- github-release/registry host blocked by
#         this sandbox's egress allowlist, no apt/pip/cargo alternative --
#         source is still provided and clean by inspection, but the claim
#         is honestly labeled unmeasured here).
TOOLS = [
    {
        "tool": "cccc",
        "package": "ledger",
        "status": "measured",
        "domain": "A fixed-point cash ledger written in C -- CCCC parses "
                   "C/C++/Java, not JavaScript.",
        "clean_means": "cccc's own cccc.xml reports 0 rejected "
                        "(unparseable) lines and every module's McCabe "
                        "cyclomatic complexity at or under 10.",
        "command": "cccc src/ledger.c && python3 check_cccc.py",
        "notes": "This folder is a documented category error, not a "
                  "JavaScript tool: the platform's own "
                  "javascript-repos-build-contract.md flags 'cccc' as a "
                  "roster mistake (it was registered as a Cognitive "
                  "Complexity alternative, a metric CCCC does not even "
                  "compute, and it cannot parse JavaScript at all). Rather "
                  "than force JavaScript through a parser that rejects it, "
                  "this folder gives CCCC the one thing it can actually "
                  "analyse cleanly: a small C program.",
    },
    {
        "tool": "CodeQL",
        "package": "beacon",
        "status": "not_installed",
        "domain": "A lighthouse beacon flash scheduler.",
        "clean_means": "No unsafe patterns a default CodeQL JS/TS query "
                        "pack would flag (no eval, no unsanitized "
                        "regex-from-input, no prototype-pollution-shaped "
                        "merges, no hardcoded secrets).",
        "command": "codeql database create ... && codeql database "
                    "analyze ...  (not runnable here -- see notes)",
        "notes": "The CodeQL CLI and query packs ship as GitHub release "
                  "assets; this sandbox's egress allowlist returns 403 for "
                  "github.com release downloads (confirmed directly, same "
                  "constraint already documented for Trivy/Opengrep in the "
                  "sibling Python-Tools-Clean corpus). No apt/pip/npm "
                  "package provides the CLI either. Source only, clean by "
                  "inspection, not measured in this environment.",
    },
    {
        "tool": "debtmap",
        "package": "harborlog",
        "status": "measured",
        "domain": "A small harbor berth-assignment log.",
        "clean_means": "debtmap validate reports 0 debt items, 0.0 debt "
                        "density, and 'Validation PASSED' against a "
                        "max-debt-density of 10 per 1K LOC.",
        "command": "debtmap validate . --max-debt-density 10 --format terminal",
        "notes": "The build contract's own roster-repair notes call "
                  "'debtmap' fabricated because it 'does not exist on "
                  "npm' -- true, but beside the point: debtmap is a real "
                  "Rust CLI (cargo install debtmap) with genuine "
                  "tree-sitter-javascript/typescript support, confirmed by "
                  "building it from crates.io in this session and running "
                  "it against this folder's actual JavaScript.",
    },
    {
        "tool": "diff-cover",
        "package": "tallyframe",
        "status": "measured",
        "domain": "A scoreboard tally tracker, with a real git history "
                   "and a feature branch adding one new, fully-tested "
                   "function.",
        "clean_means": "diff-cover reports 100% coverage on every line "
                        "the feature branch adds relative to main.",
        "command": "nyc --reporter=cobertura mocha 'test/**/*.test.js' && "
                    "diff-cover coverage/cobertura-coverage.xml "
                    "--compare-branch=main --fail-under=100",
        "notes": "External tool (pip install diff-cover), same as the "
                  "Python sibling corpus. The new function and its test "
                  "land in the same feature-branch commit, since a diff "
                  "containing new code with no covering test would report "
                  "under 100%.",
    },
    {
        "tool": "Dolos",
        "package": "kelpfield",
        "status": "measured",
        "domain": "An aquarium kelp-growth and water-chemistry tracker "
                   "split across three files with deliberately distinct "
                   "vocabulary and logic.",
        "clean_means": "Every pairwise similarity score Dolos reports "
                        "across the three source files stays low (all "
                        "under 0.2 here) -- no real code-clone signal.",
        "command": "dolos run src/*.js -l javascript",
        "notes": "Needed a native rebuild (node-gyp) at install time; the "
                  "default install failed because node-gyp tries to fetch "
                  "Node headers from nodejs.org, which this sandbox blocks. "
                  "Fixed with `npm install --nodedir=<local node include "
                  "dir>`, pointing node-gyp at headers already on disk "
                  "instead of downloading them.",
    },
    {
        "tool": "ESLint",
        "package": "orderdesk",
        "status": "measured",
        "domain": "A cafe order queue with running-total pricing.",
        "clean_means": "eslint reports 0 errors and 0 warnings against a "
                        "flat config (eslint.config.js) covering src/ and "
                        "test/.",
        "command": "eslint src/ test/",
        "notes": "",
    },
    {
        "tool": "eslint-plugin-security",
        "package": "latchbox",
        "status": "measured",
        "domain": "A combination-lock simulator using crypto.randomInt "
                   "and crypto.timingSafeEqual throughout.",
        "clean_means": "eslint with plugin:security/recommended reports "
                        "0 findings -- no eval, no unsafe regex, no "
                        "non-literal require, no weak randomness for a "
                        "security-relevant value, no non-constant-time "
                        "comparison.",
        "command": "eslint src/ test/",
        "notes": "",
    },
    {
        "tool": "eslint-plugin-sonarjs",
        "package": "ticketrail",
        "status": "measured",
        "domain": "A train ticket queue with per-class fares.",
        "clean_means": "eslint with plugin:sonarjs/recommended reports 0 "
                        "findings -- no duplicated branches, no "
                        "collapsible conditionals, low cognitive "
                        "complexity throughout.",
        "command": "eslint src/ test/",
        "notes": "Needs its own local `npm install`, not a shared "
                  "node_modules: eslint-plugin-sonarjs pins its own "
                  "typescript range internally (via ts-api-utils), and an "
                  "unrelated newer typescript hoisted at a shared root "
                  "will get deduped into its dependency tree and crash "
                  "(confirmed: TypeScript 7.0.2 breaks ts-api-utils@2.5.0, "
                  "which expects TypeScript 5.x/6.x's internal API). A "
                  "folder-local install resolves this correctly.",
    },
    {
        "tool": "Git-Spark",
        "package": "timberyard",
        "status": "measured",
        "domain": "A lumber yard shift log, with a real 3-commit, "
                   "3-author git history.",
        "clean_means": "git-spark's console report shows Overall Risk "
                        "Level: LOW, with 0 high-churn files and 0 "
                        "files touched by many authors.",
        "command": "git-spark -f console",
        "notes": "",
    },
    {
        "tool": "gutcheck",
        "package": "meterhouse",
        "status": "measured",
        "domain": "A tiered utility-meter billing calculator.",
        "clean_means": "gutcheck . (mocha auto-detected) reports every "
                        "probeable function PROVEN, 0 HOLLOW, 0 untested.",
        "command": "gutcheck .",
        "notes": "First pass caught a real arithmetic mistake in this "
                  "folder's own test (an expected value computed by hand "
                  "was off by 100) -- gutcheck reported the test failing "
                  "before any mutation even ran, exactly the class of bug "
                  "it exists to surface. Fixed in the test, not worked "
                  "around.",
    },
    {
        "tool": "jscpd",
        "package": "spicecrate",
        "status": "measured",
        "domain": "A spice-inventory crate and a shelf-placement planner, "
                   "two structurally distinct files.",
        "clean_means": "jscpd reports 0 clones at --min-lines 5 "
                        "--min-tokens 30 --threshold 0.",
        "command": "jscpd src/ --min-lines 5 --min-tokens 30 --threshold 0 --reporters console",
        "notes": "",
    },
    {
        "tool": "knip",
        "package": "petalbook",
        "status": "measured",
        "domain": "A small seasonal flower catalog.",
        "clean_means": "knip reports zero unused files, exports, or "
                        "dependencies, and zero configuration hints.",
        "command": "knip",
        "notes": "First pass was clean of real findings but printed a "
                  "'redundant entry pattern' configuration hint (index.js "
                  "already matches knip's default entry glob, so declaring "
                  "it again in knip.json was noise); removed the redundant "
                  "declaration so the run is completely silent.",
    },
    {
        "tool": "Lizard",
        "package": "windmill",
        "status": "measured",
        "domain": "A windmill power-output estimator.",
        "clean_means": "lizard -C 10 -L 60 -a 5 -w prints no warnings -- "
                        "every function's CCN, length, and parameter "
                        "count stays under threshold.",
        "command": "lizard src/ -C 10 -L 60 -a 5 -w",
        "notes": "External tool (pip install lizard), same as the Python "
                  "sibling corpus; lizard parses JavaScript natively.",
    },
    {
        "tool": "Mocha",
        "package": "librastack",
        "status": "measured",
        "domain": "A library call-number shelving system.",
        "clean_means": "Every test passes: mocha exits 0.",
        "command": "mocha 'test/**/*.test.js'",
        "notes": "",
    },
    {
        "tool": "monocart-coverage-reports",
        "package": "shelfcount",
        "status": "measured",
        "domain": "A warehouse shelf item-count tracker.",
        "clean_means": "The json-summary report's entry for "
                        "src/shelfcount.js shows 100% lines, statements, "
                        "functions, and branches.",
        "command": "mcr node node_modules/.bin/mocha 'test/**/*.test.js' "
                    "-r v8,json-summary -o coverage-report",
        "notes": "monocart has no built-in fail-under threshold (its CLI "
                  "never calls process.exit(1) on low coverage by "
                  "design), so this folder's own check reads the "
                  "generated coverage-summary.json and asserts 100% on "
                  "its own source file directly, rather than trusting the "
                  "command's exit code alone.",
    },
    {
        "tool": "npm audit",
        "package": "cratebox",
        "status": "measured",
        "domain": "A shipping-crate item manifest.",
        "clean_means": "npm audit reports 'found 0 vulnerabilities' -- "
                        "zero runtime dependencies, so there is nothing "
                        "to have a CVE.",
        "command": "npm audit --audit-level=low",
        "notes": "",
    },
    {
        "tool": "npm ls",
        "package": "satchel",
        "status": "measured",
        "domain": "A courier's parcel-satchel route tracker.",
        "clean_means": "npm ls --all exits 0 with no missing, invalid, or "
                        "extraneous entries.",
        "command": "npm ls --all",
        "notes": "",
    },
    {
        "tool": "nyc",
        "package": "paypocket",
        "status": "measured",
        "domain": "A payroll calculator with an overtime multiplier.",
        "clean_means": "nyc --check-coverage reports 100% statements, "
                        "branches, functions, and lines.",
        "command": "nyc --check-coverage --lines 100 --branches 100 "
                    "--functions 100 --statements 100 mocha 'test/**/*.test.js'",
        "notes": "",
    },
    {
        "tool": "OpenGrep",
        "package": "gatewatch",
        "status": "not_installed",
        "domain": "A gate-access badge controller with a cryptographically "
                   "random visitor-code generator.",
        "clean_means": "0 findings against the folder's own committed "
                        "semgrep-rules.yml (no eval, no shell-command "
                        "concatenation, no Math.random() for a "
                        "security-sensitive value).",
        "command": "opengrep --config=semgrep-rules.yml --error src/",
        "notes": "The opengrep binary is a GitHub release asset; this "
                  "sandbox's egress allowlist returns 403 for it (same "
                  "constraint as the Python sibling corpus). As a "
                  "same-engine stand-in, `semgrep --config=semgrep-rules.yml` "
                  "(installed from PyPI) was run for real against this "
                  "exact ruleset and source, and reported 0 findings.",
    },
    {
        "tool": "oxlint",
        "package": "tidewatch",
        "status": "measured",
        "domain": "A tide-station reading log.",
        "clean_means": "oxlint reports 0 errors and 0 warnings.",
        "command": "oxlint src/ test/",
        "notes": "",
    },
    {
        "tool": "pydriller",
        "package": "chronicle",
        "status": "measured",
        "domain": "A diary/journal entry log, with a real 4-commit, "
                   "3-author git history.",
        "clean_means": "The folder's driver.py mines this repo's history "
                        "with pydriller and cross-checks the result "
                        "against `git log` directly -- commit count, "
                        "author set, and touched-file set all match "
                        "exactly.",
        "command": "python3 driver.py",
        "notes": "External tool (pip install pydriller), same pattern as "
                  "the Python sibling corpus's own pydriller folder.",
    },
    {
        "tool": "StrykerJS",
        "package": "signalbox",
        "status": "measured",
        "domain": "A three-phase traffic signal controller.",
        "clean_means": "Stryker reports a 100.00 mutation score against a "
                        "break threshold of 100 -- every mutant killed, "
                        "none survived.",
        "command": "stryker run",
        "notes": "@stryker-mutator/core@10.0.0 (the version this "
                  "session's npm registry resolves to by default) failed "
                  "in the CHILD test-runner process specifically -- 'Cannot "
                  "find TestRunner plugin \"mocha\"' -- even though the "
                  "plugin was correctly installed and loaded in the main "
                  "process; this reproduced with a clean, isolated local "
                  "install, so it is not an artifact of this sandbox's "
                  "shared workspace. Pinning "
                  "@stryker-mutator/core@8.7.1 + "
                  "@stryker-mutator/mocha-runner@8.7.1 + mocha@10.8.2 "
                  "resolved it and ran cleanly end to end.",
    },
    {
        "tool": "trivy",
        "package": "cargodrop",
        "status": "not_installed",
        "domain": "A cargo-yard loading-dock drop-off scheduler.",
        "clean_means": "0 vulnerabilities, 0 secrets -- zero runtime "
                        "dependencies and no credential-shaped strings "
                        "anywhere in source.",
        "command": "trivy fs --scanners vuln,secret --exit-code 1 .",
        "notes": "The trivy binary is a GitHub release asset; this "
                  "sandbox's egress allowlist returns 403 for it (same "
                  "constraint as the Python sibling corpus).",
    },
]
