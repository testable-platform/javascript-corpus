# JS_V24_WEBPACK_YARN_MICRO

Part of the `javascript-combos` white-box test-repo corpus (GraniteMill /
`granite-mill`, domain: Community garden plots).

## Branch variables

| Variable | This branch |
| --- | --- |
| Branch | `JS_V24_WEBPACK_YARN_MICRO` |
| Node.js | 24.20.0 (family V24) |
| Bundler | Webpack |
| Package manager | yarn (Berry) |
| Bundled npm | 10.9.2 |
| Architecture | Microservices |
| Source root | `packages/shared/src` |

The application code under `src/` (or `packages/*/src/` for Microservices
branches) is byte-identical across all 576 branches of this corpus; only the
build tool, package manager, architecture layout, and each tool's real
status on this Node family vary.

## Supported tools

21 tools are wired on this corpus (one `tools/<dir>/` folder
each, covering the 103-metric white-box framework). **16 of them
run on Node 24; 5 do not.**

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
| `Lizard` | primary | lizard (pip) | measured directly: pip-installed and run for real against this domain's src/ (lizard 1.24.0). Found policy.js's evaluatePolicy as the highest-CCN function at 18 -- corrects an earlier assumption that dataflow.js's tally loop (CCN 17) was highest; Node-independent by construction, so this holds on every family. _(measured: real invocation confirmed by Claude Code)_ |
| `cyclomatic-complexity` | alternative | cyclomatic-complexity==1.2.5 | cyclomatic-complexity 1.2.5 declares Node 24 compatibility (npm registry engines.node range). _(declared active from npm registry data; not yet individually invoke-verified on this family)_ |
| `eslint-plugin-sonarjs` | primary | eslint-plugin-sonarjs==4.2.1 | eslint-plugin-sonarjs 4.2.1 declares Node 24 compatibility; runs through eslint itself. _(declared active from npm registry data; not yet individually invoke-verified on this family)_ |
| `cognitive-complexity-ts` | alternative | cognitive-complexity-ts==0.8.2 | cognitive-complexity-ts 0.8.2 declares Node 24 compatibility (npm registry engines.node range). _(declared active from npm registry data; not yet individually invoke-verified on this family)_ |
| `jscpd` | primary | jscpd==5.2.1 | jscpd 5.2.1 declares Node 24 compatibility (npm registry engines.node range). _(declared active from npm registry data; not yet individually invoke-verified on this family)_ |
| `eslint` | primary | eslint==10.10.0 | eslint 10.10.0 declares Node 24 compatibility (npm registry engines.node range). _(declared active from npm registry data; not yet individually invoke-verified on this family)_ |
| `eslint-plugin-security` | primary | eslint-plugin-security==4.0.1 | eslint-plugin-security 4.0.1 declares Node 24 compatibility; runs through eslint itself. _(declared active from npm registry data; not yet individually invoke-verified on this family)_ |
| `npm audit + npm ls` | primary | n/a | npm's own bundled audit/ls -- ships with npm itself on every Node family this corpus supports. _(declared active from npm registry data; not yet individually invoke-verified on this family)_ |
| `nyc + mocha` | primary | nyc==18.0.0 | clean on every family once the architecture-aware test glob (bug #1) and the Microservices require() path (bug #4) were both fixed. _(measured: real invocation confirmed by Claude Code)_ |
| `monocart-coverage-reports` | alternative | monocart-coverage-reports==2.13.0 | monocart-coverage-reports 2.13.0 declares Node 24 compatibility (npm registry engines.node range). _(declared active from npm registry data; not yet individually invoke-verified on this family)_ |
| `gutcheck` | alternative | gutcheck==0.10.0 | gutcheck 0.10.0 declares Node 24 compatibility (npm registry engines.node range). _(declared active from npm registry data; not yet individually invoke-verified on this family)_ |
| `diff-cover` | primary | diff-cover (pip) | the diff-cover CLI itself was invoked for real (pip install + --help) and works; its coverage-delta output depends on nyc's cobertura report, which needs a full npm install this session's verification bridge could not complete (slow mounted filesystem + shared disk quota, not a tool defect -- see javascript-repos-build-contract.md). Node-independent by construction. _(measured: real invocation confirmed by Claude Code)_ |
| `ESLint (eslint-scope)` | primary | eslint-scope==9.1.2 | clean on every family tested (12 through 26) -- the dataflow script is hand-written without `?.`/`??` specifically so it never depends on the same syntax features that break other tools on the oldest families. _(measured: real invocation confirmed by Claude Code)_ |
| `knip` | alternative | knip==6.36.0 | knip 6.36.0 declares Node 24 compatibility (npm registry engines.node range). _(declared active from npm registry data; not yet individually invoke-verified on this family)_ |
| `PyDriller` | primary | pydriller (pip) | PyDriller is a Python package invoked externally via a small wrapper script -- Node-version-independent by construction. _(declared active from npm registry data; not yet individually invoke-verified on this family)_ |
| `Git-Spark` | alternative | git-spark==1.3.2 | Git-Spark 1.3.2 declares Node 24 compatibility (npm registry engines.node range). _(declared active from npm registry data; not yet individually invoke-verified on this family)_ |

### Dark here

| Tool | Role | Status | Why |
| --- | --- | --- | --- |
| `Dolos` | alternative | not installed | dolos's native tree-sitter step needs a C++ toolchain -- already documented as absent on this host by the C#/Python sibling corpora's own precedent; installs with --ignore-scripts, which skips the native build |
| `oxlint` | alternative | skipped | same 1.83.0 config-schema break as N18/N20/N22. |
| `OpenGrep` | alternative | not installed | standalone binary, not installable via npm/pip on this host -- same category as Dolos's native step and the Python corpus's own Trivy/OpenGrep entries |
| `Trivy` | alternative | not installed | standalone binary, not installable via npm/pip on this host |
| `StrykerJS + Mocha` | primary | skipped | same mocha-12/Stryker incompatibility as N20/N22. |

## Build

```
npm install    # or yarn / pnpm / bun, per this branch's packageManager field
npm run build
```

## Run

```
node packages/shared/src/index.js
```

## Test

```
npm test              # mocha packages/shared/tests/**/*.test.js
npm run coverage      # nyc + mocha
make check            # tools/full_check.js -- cross-file consistency audit
```


## Tool test-data folders

Three sibling folders sit at the repo root, alongside this branch's own
`tools/` (above).

### `Tool Triggering (Tool Github Test data)/`
Each of the 21 tool subfolders is that tool's own real upstream code and test
suite, pulled as-is from its actual GitHub (or PyPI) project -- not generated.
`ESLint/`, `StrykerJS/`, `jscpd/`, `pydriller/`, `nyc/` and the rest are each
that project's own real test suite. A correct run finds whatever that
upstream project's own tests genuinely contain. Unlike the TypeScript
corpus's `covgate`, no tool in this 21-tool roster ships a non-JS native
binary -- every subfolder here is a real npm or pip project in its own
right.

### `Tool Clean (Synthetic Data)/`
Each of the 21 tools carries 9 generated fixture packages, one per Node
family (12, 14, 16, 18, 20, 21, 22, 24, 26), engineered to be clean so the
tool should report zero findings: the **Tool Clean (100% pass)** condition.
`diff-cover` and `pydriller` operate on git history and a coverage report
rather than language syntax, so each carries one real git repository's
worth of history instead of 9 per-family copies.

### `Tool Invalid (Synthetic Data)/`
Same shape as Clean -- 21 tools, the same 9-Node-family pattern -- but
engineered so every fixture makes the tool flag or fail rather than pass:
the **Tool Invalid** condition. `diff-cover`'s and `pydriller`'s Invalid
fixtures are plain, git-free copies, same as their Clean counterparts.

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
| Duplication | [`packages/shared/src/http-errors.js`](packages/shared/src/http-errors.js) + [`packages/shared/src/http-errors-legacy.js`](packages/shared/src/http-errors-legacy.js) | jscpd, Dolos |

## Workspace layout

```
javascript-combos/  (JS_V24_WEBPACK_YARN_MICRO)
|-- .github/
|-- packages/
|-- tests/  (or packages/shared/tests/ for Microservices)
|-- tools/  (21 tool directories + _skip.sh, tool_integration.js, full_check.js)
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
