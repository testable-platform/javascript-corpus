# JavaScript-Tools-Invalid

A folder of 23 tool-named projects, the deliberate structural inverse of
the sibling `JavaScript-Tools-Clean` corpus: same tool roster, same
boundary-version Node families, same folder layout -- but every
live-checkable tool is engineered, and empirically verified, to find a
genuine, majority-wrong result. This is the "negative control of the
negative control": a corpus where a scan that reports nothing wrong is
itself the bug.

A family where nothing ever fires cannot tell "correctly detected
nothing" apart from "the scan never ran." This corpus is what makes a
non-zero legible: every result below was produced by actually installing
and invoking the real tool against real, deliberately broken fixtures, not
by assertion. "Declared support is a claim; invoking is the fact" applies
here exactly as it does to the Clean sibling -- the only difference is
what the fixture is engineered to contain.

## Boundary-version structure

20 of the 23 tools are exploded into five per-tool subfolders, one per
boundary Node family, mirroring `JavaScript-Tools-Clean`'s own
`node12/14/20/24/26` pattern:

| Family | Role | How it's verified |
| --- | --- | --- |
| `node12` | earliest | **code-only** -- valid, version-appropriate (deliberately broken) source, no live tool run |
| `node14` | earliest+1 | **code-only** -- valid, version-appropriate (deliberately broken) source, no live tool run |
| `node20` | middle | **live** -- installed and run for real under this family's own Node 20 binary |
| `node24` | latest-1 | **live** -- installed and run for real under this family's own Node 24 binary |
| `node26` | latest | **live** -- installed and run for real under this family's own Node 26 binary |

Exactly as in the Clean sibling, node12/node14 carry code-only, unmodified
source (the same deliberately-wrong domain code, just not live-run),
because several of these tools' current releases require modern Node
baselines that do not run on Node 12/14. The remaining 3 tools --
**Git-Spark, diff-cover, pydriller** -- are git-history miners and stay
single-version and unversioned, since what they measure is commit history,
not language-version compatibility.

## Measured results (20 versioned tools x 5 families = 100 cells)

| Tool | node12 | node14 | node20 | node24 | node26 |
| --- | --- | --- | --- | --- | --- |
| CodeQL | CODE-ONLY | CODE-ONLY | NOT INSTALLED | NOT INSTALLED | NOT INSTALLED |
| Dolos | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| ESLint | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| Lizard | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| Mocha | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| OpenGrep | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| StrykerJS | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| cccc | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| debtmap | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| eslint-plugin-security | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| eslint-plugin-sonarjs | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| gutcheck | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| jscpd | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| knip | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| monocart-coverage-reports | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| npm audit | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| npm ls | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| nyc | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| oxlint | CODE-ONLY | CODE-ONLY | **FINDINGS** | **FINDINGS** | **FINDINGS** |
| trivy | CODE-ONLY | CODE-ONLY | NOT INSTALLED | NOT INSTALLED | NOT INSTALLED |

**Tally: 54 FINDINGS, 6 NOT INSTALLED, 0 CLEAN, 40 CODE-ONLY.** Every one
of the 18 live-checkable tools fired on all 3 live families (54/54) -- no
tool accidentally came back clean. The only non-FINDINGS live cells are
CodeQL and trivy, genuinely unreachable in this sandbox (see below),
exactly mirroring the Clean sibling's own unreachable set minus OpenGrep,
whose same-engine semgrep stand-in *does* genuinely fire against this
corpus's insecure fixture (see its own folder).

Plus the 3 unversioned git-history tools, all FINDINGS:

| Tool | Result | Command |
| --- | --- | --- |
| Git-Spark | **FINDINGS** (Overall Risk Level: MEDIUM) | `git-spark -f console` |
| diff-cover | **FINDINGS** (41.7% diff coverage) | `nyc --reporter=cobertura mocha 'test/**/*.test.js' && diff-cover coverage/cobertura-coverage.xml --compare-branch=main --fail-under=100` |
| pydriller | **FINDINGS** (commit/author mismatch) | `python3 driver.py` |

**NOT INSTALLED** (CodeQL, trivy -- unchanged from the Clean sibling,
across every live family): each ships only as a GitHub release binary,
and this build environment's egress allowlist returns 403 for github.com
release downloads; no apt/pip/npm/cargo alternative exists for either.
Their folders still carry real, genuinely-insecure source (eval, shell
command concatenation, weak randomness, a hardcoded secret-shaped string,
a real vulnerable dependency) documented in each folder's own README, even
though the tool itself cannot be measured here.

**OpenGrep** differs from CodeQL/trivy: its own binary is equally
egress-blocked, but its same-engine semgrep stand-in (installed from
PyPI, exactly as in the Clean sibling) genuinely fires against this
corpus's insecure fixture -- 2 of the folder's own 3 ruleset findings
(67%) -- so its status here is a real, measured **FINDINGS**, not
NOT INSTALLED.

The exit-code vocabulary throughout this corpus never collapses 1
(findings), 3 (skipped), and 4 (not installed) into the same result -- a
missing binary must never masquerade as a clean scan, and a genuine
finding must never be asserted without actually running the tool.

## Genuine tool quirks surfaced while building this corpus

**debtmap's `validate` subcommand reports "0 files analyzed" unconditionally**
in this installed version (0.24.1) -- reproduced even against the
original, unmodified Clean-corpus source, so it is not something this
fixture caused. `debtmap analyze` does not have this bug and is used as
the real measurement instead (debt density 472.4 per 1K LOC vs. the 10.0
threshold); see `debtmap/README.md` for the full writeup.

**gutcheck's non-proven-function label in this release (0.10.0) is
"unnoticed", not the older "hollow"**. The substance is identical (a test
executes a function but never pins its return value, so corrupting the
function would not fail the test) -- see `gutcheck/README.md`.

**oxlint's default rule severities are "warn"**, which does not by itself
flip the process exit code -- the same any-output-is-a-finding convention
already established for Lizard/knip in the Clean sibling's own
`verify.py` is used here too, rather than trusting exit code alone; see
`oxlint/README.md`.

## Rules every folder obeys

- No dependency on any other folder in this corpus -- each is its own npm project (or, for cccc/debtmap/diff-cover/pydriller, its own real invocation of an external CLI).
- Pure ASCII throughout -- verified corpus-wide, 0 non-ASCII bytes in any file.
- 0 *unintended* code clones corpus-wide (verified with `jscpd . --min-lines 5 --min-tokens 30 --threshold 0` across one representative copy of every tool's domain source): the only clones jscpd finds are the deliberate ones each fixture is designed around (Dolos's feeding.js/growth.js, debtmap's arrive()/depart(), jscpd's own inventory.js/shelfplan.js) -- nothing leaks across unrelated tool folders.
- Real git history (8 synthetic authors, 91 real commits across 3 files) for Git-Spark; a real main + feature-branch history for diff-cover; a real 4-commit, 3-author history for pydriller.
- Same domain source, unmodified, across all five families of a given tool -- only per-family `package.json` pins and (for the ESLint-family tools) config format differ, exactly as in the Clean sibling.
- Same per-family package-version pin table as the Clean sibling (`pin_table.py`, copied verbatim): package availability doesn't depend on whether the domain content is clean or broken, so the pins don't change.

## Reproducing

```bash
python3 _generator/generate.py            # explode each versionable tool into node12/14/20/24/26
python3 _generator/verify_live.py         # real npm install + real run under node20/24/26 for every live tool, confirming genuine FINDINGS
python3 _generator/write_readmes.py       # regenerate every folder's README from meta.py + live_results_invalid.json
```

`generate.py` reads `pin_table.py` for per-family package pins (identical
to the Clean sibling's own table) and `verify_live.py` needs real Node
20/24/26 binaries on `PATH` per family. `cccc` needs the `cccc` package
installed via apt; `debtmap` needs `cargo install debtmap`;
`Lizard`/`diff-cover`/`pydriller` need `pip install lizard diff-cover
pydriller`; `OpenGrep`'s stand-in needs `pip install semgrep`.

## Two categories worth calling out (same as the Clean sibling)

**`cccc` is a genuine category error, left in on purpose.** The
platform's own `javascript-repos-build-contract.md` documents that `cccc`
was registered as a Cognitive Complexity alternative by mistake: it
doesn't measure cognitive complexity and it cannot parse JavaScript at
all (it analyses C, C++, and Java). This folder gives CCCC real,
deliberately tangled C source -- the one thing it can actually analyse --
and its own XML report genuinely flags it (CCN 33 vs. threshold 10).

**`debtmap` exists, just not on npm.** It is a real Rust CLI (`cargo
install debtmap`) with genuine `tree-sitter-javascript`/`typescript`
support, confirmed by running it for real against this folder's
deliberately tangled JavaScript (debt density 472.4 per 1K LOC).
