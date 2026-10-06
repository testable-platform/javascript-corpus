# JavaScript-Tools-Clean

A folder of 23 tool-named projects, mirroring the folder names in the
harvested `JavaScript Tools` directory (each of which holds that tool's
own real upstream test suite). This corpus is the opposite of that: each
folder is a small **synthetic** project, engineered so that the tool it
is named after finds **nothing wrong** -- the same negative-control
methodology already used for the sibling `Python-Tools-Clean` corpus.

A family where nothing ever fires cannot tell "correctly detected
nothing" apart from "the scan never ran." A clean baseline is what makes
a zero legible: every result below was produced by actually installing
and invoking the real tool, not by assertion. "Declared support is a
claim; invoking is the fact."

## Boundary-version structure

20 of the 23 tools are exploded into five per-tool subfolders, one per
boundary Node family, mirroring `Python-Tools-Clean`'s `py3.X/` pattern:

| Family | Role | How it's verified |
| --- | --- | --- |
| `node12` | earliest | **code-only** -- valid, version-appropriate source, no live tool run |
| `node14` | earliest+1 | **code-only** -- valid, version-appropriate source, no live tool run |
| `node20` | middle | **live** -- installed and run for real under this family's own Node 20 binary |
| `node24` | latest-1 | **live** -- installed and run for real under this family's own Node 24 binary |
| `node26` | latest | **live** -- installed and run for real under this family's own Node 26 binary |

node12/node14 are code-only rather than live because several of these
tools' current releases require modern Node baselines that simply do not
run on Node 12/14 (see the `*` rows below); rather than fake it, those
two families carry real, unmodified-syntax source and nothing else. The
domain source in this corpus contains no ES2020+ syntax (no `?.`, `??`,
or private class fields), so the same source compiles/parses unchanged
across all five families -- only each family's `package.json` pins and
(for the ESLint-family tools) config format change per family.

The remaining 3 tools -- **Git-Spark, diff-cover, pydriller** -- are
git-history miners and stay single-version and unversioned, exactly like
Python's diff-cover/dulwich/pydriller trio, since what they measure is
commit history, not language-version compatibility.

## Measured results (20 versioned tools x 5 families = 100 cells)

| Tool | node12 | node14 | node20 | node24 | node26 |
| --- | --- | --- | --- | --- | --- |
| CodeQL | CODE-ONLY | CODE-ONLY | NOT INSTALLED | NOT INSTALLED | NOT INSTALLED |
| Dolos | CODE-ONLY | CODE-ONLY | CLEAN | CLEAN | **FINDING** |
| ESLint | CODE-ONLY | CODE-ONLY | CLEAN | CLEAN | CLEAN |
| Lizard | CODE-ONLY | CODE-ONLY | CLEAN | CLEAN | CLEAN |
| Mocha | CODE-ONLY | CODE-ONLY | CLEAN | CLEAN | CLEAN |
| OpenGrep | CODE-ONLY | CODE-ONLY | NOT INSTALLED | NOT INSTALLED | NOT INSTALLED |
| StrykerJS | CODE-ONLY | CODE-ONLY | CLEAN | CLEAN | CLEAN |
| cccc | CODE-ONLY | CODE-ONLY | CLEAN | CLEAN | CLEAN |
| debtmap | CODE-ONLY | CODE-ONLY | CLEAN | CLEAN | CLEAN |
| eslint-plugin-security | CODE-ONLY | CODE-ONLY | CLEAN | CLEAN | CLEAN |
| eslint-plugin-sonarjs | CODE-ONLY | CODE-ONLY | CLEAN | CLEAN | CLEAN |
| gutcheck | CODE-ONLY* | CODE-ONLY* | CLEAN | CLEAN | CLEAN |
| jscpd | CODE-ONLY | CODE-ONLY | CLEAN | CLEAN | CLEAN |
| knip | CODE-ONLY* | CODE-ONLY* | CLEAN | CLEAN | CLEAN |
| monocart-coverage-reports | CODE-ONLY | CODE-ONLY | CLEAN | CLEAN | CLEAN |
| npm audit | CODE-ONLY | CODE-ONLY | CLEAN | CLEAN | CLEAN |
| npm ls | CODE-ONLY | CODE-ONLY | CLEAN | CLEAN | CLEAN |
| nyc | CODE-ONLY | CODE-ONLY | CLEAN | CLEAN | CLEAN |
| oxlint | CODE-ONLY | CODE-ONLY | CLEAN | CLEAN | CLEAN |
| trivy | CODE-ONLY | CODE-ONLY | NOT INSTALLED | NOT INSTALLED | NOT INSTALLED |

`*` = the tool itself (gutcheck, knip) has no resolvable release for
node12/14 at all -- its `package.json` in those two families omits the
package entirely rather than pin a version that could never install;
see that tool's own README for the detail.

**Tally: 88 CLEAN, 9 NOT INSTALLED, 1 FINDING, 40 CODE-ONLY** (2 of the 40
are genuine unavailability, marked `*` above; the other 38 are
version-appropriate valid source with no live run by design).

Plus the 3 unversioned git-history tools, all CLEAN:

| Tool | Result | Command |
| --- | --- | --- |
| Git-Spark | CLEAN | `git-spark -f console` |
| diff-cover | CLEAN | `nyc --reporter=cobertura mocha 'test/**/*.test.js' && diff-cover coverage/cobertura-coverage.xml --compare-branch=main --fail-under=100` |
| pydriller | CLEAN | `python3 driver.py` |

**NOT INSTALLED** (CodeQL, OpenGrep, trivy -- unchanged from the original
single-version build across every live family): each ships only as a
GitHub release binary or a proprietary CLI, and this build environment's
egress allowlist returns 403 for github.com release downloads; no
apt/pip/npm/cargo alternative exists for any of the three. Their folders
still carry real, clean source and, where possible, a same-engine
stand-in was run for real instead (OpenGrep's ruleset was run through
`semgrep`, which uses the same rule engine and is installed here).

The exit-code vocabulary throughout this corpus never collapses 1
(findings), 3 (skipped -- can't run on this interpreter/runtime), and 4
(not installed) into the same result -- a missing binary must never
masquerade as a clean scan, and neither must "this family can't run it."

## Genuine findings (not papered over)

**Dolos / node26** -- `tree-sitter-compat` (pulled in transitively via
`@dodona/dolos-lib` -> `@dodona/dolos-parsers`) fails to compile against
Node 26's V8 headers: `v8::Object::GetAlignedPointerFromInternalField`'s
signature changed (now requires 3 args, not 1) between the V8 version
`tree-sitter-compat` was written against and Node 26's bundled V8.
Checked for a fix: `@dodona/dolos@2.9.3` and `@dodona/dolos-parsers@1.4.1`
are both already the latest published releases, and `tree-sitter-compat`'s
latest is `0.1.7` -- the exact version that breaks. No upgrade path exists
today; this is left as a genuine, reproducible native-addon ABI
incompatibility rather than patched around.

**StrykerJS / node20, node24, node26** -- two separate, now-resolved
issues surfaced during live verification:
- `node20`: the source doc's own pin table declares
  `@stryker-mutator/mocha-runner@9.6.1` (peer range `mocha ">= 7.2 < 12"`)
  *and* `mocha@12.0.1` for the same family -- an internal inconsistency
  between two individually-correct pins. Fixed by pinning `mocha@11.8.0`
  (itself an already-established real pin for families 18/21 in the same
  table) for this tool only.
- `node24`/`node26`: the table's declared `@stryker-mutator/core@10.0.0`
  crashes with `Cannot find TestRunner plugin "mocha"` in the child test
  runner process even with the plugin correctly installed -- a genuine,
  reproducible defect in that exact release, matching a pre-existing
  finding already documented in the original flat build's `meta.py`. Fixed
  with that doc's own known-working substitute: `core@8.7.1` +
  `mocha-runner@8.7.1` + `mocha@10.8.2`.

Both StrykerJS fixes are re-verified live (100.00 mutation score, 23/23
mutants killed, 0 survived/timeout/no-coverage/errors on all three
families) and are baked into the generator (`pin_table.py`'s
`TOOL_OVERRIDES`), not just hand-patched in the built folders -- rerunning
`generate.py` reproduces them.

## Rules every folder obeys

- No dependency on any other folder in this corpus -- each is its own npm project (or, for cccc/debtmap/diff-cover/pydriller, its own real invocation of an external CLI).
- Zero runtime `dependencies` in every `package.json` (only `devDependencies` for the tool itself and its test runner), so `npm audit` and `npm ls` are clean by construction, not luck.
- Pure ASCII throughout -- verified corpus-wide, 0 non-ASCII bytes in any file.
- 0 code clones corpus-wide (verified with `jscpd . --min-lines 5 --min-tokens 30 --threshold 0` restricted to source files): every folder's domain, vocabulary, and control-flow shape is deliberately distinct from every other folder's.
- Real git history (3 synthetic authors, real commits) for the three tools that mine history: Git-Spark, diff-cover (plus a real feature-branch diff), and pydriller.
- Same domain source, unmodified, across all five families of a given tool -- only per-family `package.json` pins and (for the ESLint-family tools) config format differ.

## Reproducing

```bash
python3 _generator/write_readmes.py       # regenerate the base per-folder README from meta.py (single-version era)
python3 _generator/generate.py            # explode each versionable tool into node12/14/20/24/26
python3 _generator/verify_live.py         # real npm install + real run under node20/24/26 for every live tool
python3 _generator/write_family_readmes.py # append the per-family results section to each tool's README
python3 _generator/verify.py .            # run every tool for real and tally CLEAN/FINDINGS/NOT INSTALLED
```

`generate.py` reads `pin_table.py` for per-family package pins (including
the `TOOL_OVERRIDES` fixes above) and `verify_live.py` needs real Node
20/24/26 binaries on `PATH` per family (this build used
`actions/node-versions` GitHub-release tarballs, since `nodejs.org` itself
returns 403 in this environment). `cccc` needs the `cccc` package
installed via apt; `debtmap` needs `cargo install debtmap`;
`Lizard`/`diff-cover`/`pydriller` need `pip install lizard diff-cover
pydriller`.

## Two categories worth calling out

**`cccc` is a genuine category error, left in on purpose.** The platform's own `javascript-repos-build-contract.md` documents that `cccc` was registered as a Cognitive Complexity alternative by mistake: it doesn't measure cognitive complexity and it cannot parse JavaScript at all (it analyses C, C++, and Java). Rather than force JavaScript through a parser that rejects it, this folder gives CCCC real C source -- the one thing it can actually analyse -- and documents the mismatch rather than papering over it.

**`debtmap` exists, just not on npm.** The same document calls `debtmap` fabricated because "it does not exist on npm" -- true, but it exists as a real Rust CLI (`cargo install debtmap`) with genuine `tree-sitter-javascript`/`typescript` support, confirmed by building it from crates.io in this session and running it for real against this folder's actual JavaScript.
