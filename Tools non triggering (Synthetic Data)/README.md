# JavaScript tools non-triggering corpus

23 tool-named folders, one per tool, matching the folder names in
`Tool Clean (Synthetic Data)` and `Tool Invalid (Synthetic Data)` so the three
data sets line up name-for-name.

Clean makes each tool run and report nothing wrong. Invalid makes it run and
report something. This folder holds data with nothing in it for any tool to
catch -- and, where the tool cannot be given a program at all, nothing for it
to start on.

## Why the folder is split two ways

A hello world, one class with one function, a `main` file -- that answers the
question for a tool that reads source. It answers nothing for a tool that reads
a lockfile, a coverage report, or the commit history: a dependency scanner
handed a program has no dependency set, so it does not run and find nothing,
it simply does not run. Shipping it a `main.js` would state a verdict
this folder cannot support.

So each tool gets whichever shape is true for it.

### 11 tools get a minimal program

`node12` through `node26`, one program each, matching the family split in `Tool Clean`.
One class or one function, no branching, no duplication, no dependency, no
dead export, no magic number. No manifest, no tool config.

| Tool | Reads source because it |
| --- | --- |
| CodeQL | extracts source into a database and queries it |
| Dolos | compares parsed source files for similarity |
| ESLint | lints parsed source |
| Lizard | counts functions and complexity from its own tokeniser |
| OpenGrep | matches rule patterns against parsed source |
| cccc | parses C, C++ and Java - so its program here is C |
| debtmap | scores debt per function, which needs a parse |
| eslint-plugin-security | rules evaluated over parsed source by a host run |
| eslint-plugin-sonarjs | rules evaluated over parsed source by a host run |
| jscpd | tokenises files and compares token runs |
| oxlint | lints parsed source |

### 12 tools get an inert record instead

| Tool | No program would help because it |
| --- | --- |
| Git-Spark | analyses commit history for churn and ownership |
| Mocha | executes files matching its spec glob |
| StrykerJS | re-runs a test suite against each mutant |
| diff-cover | intersects a coverage report with a diff |
| gutcheck | decides PROVEN or HOLLOW by running the covering tests |
| knip | needs package.json entry and project globs to define a boundary |
| monocart-coverage-reports | formats a coverage object produced by a run |
| npm audit | resolves a dependency tree from a lockfile |
| npm ls | lists an installed node_modules tree |
| nyc | instruments a program and then runs it |
| pydriller | iterates the repository's commits |
| trivy | resolves package coordinates from a lockfile or manifest |

## What the code deliberately avoids, and why

The first draft gave `node12` deliberately old syntax -- `var`, a `function`
declaration, string concatenation -- on the assumption that an old runtime
wants old code. oxlint with style, suspicious and correctness enabled returned
**20 errors**: `prefer-template` x10 and `func-style` x10, then
`no-magic-numbers` x10 after the first fix.

The assumption was wrong on the facts. Node 12 supports `const`, arrow
functions and template literals perfectly well; only private class fields and
optional chaining need anything later. The families now differ **structurally**
-- an array join, an arrow, a getter class, a frozen object, a `#private` field
-- rather than by pretending older syntax is required.

### Measured

oxlint: 0 on defaults and 0 across all 201 rules. All 50 `.js` files parse
clean under `node --check`. lizard: 61 functions, average CCN 1.0, 0 warnings.
jscpd: 0 clones. semgrep with a security ruleset: 0 findings. detect-secrets:
0. gcc syntax-check on the cccc C program: clean.

### Roster caveat

This corpus has a known roster mismatch. Clean and Invalid carry the same 23
tool names, which this folder matches. `Tool Triggering (Synthetic Data)` was
built from a repaired list and carries `eslint-scope`, which has no folder in
Clean or Invalid. The corrected `JavaScript_All_Tools.xlsx` is the roster of
record and had not been reconciled across all four folders when this was
written; adding or renaming folders here is a one-line change once it is.

## Invariants

| # | Invariant |
| --- | --- |
| G2 | No manifest and no lockfile anywhere, so the folder adds no discovered project and no task. |
| G3 | No tool configuration file. |
| G4 | No coverage report, SBOM or other consumed artifact. |
| G5 | Pure ASCII. |
| G6 | No secret-shaped strings. |
| G7 | Zero duplicate blocks at 5 lines / 30 tokens, across both shapes. |

`verify.py` checks all of them. G1 of the earlier draft -- no source extension
anywhere -- is gone by design: the CODE folders now carry real source.

## Layout

```text
Tools non triggering (Synthetic Data)/
  README.md
  <Tool Name>/              CODE
    README.md
    <first family>/main.js  ...  <last family>/main.js
  <Tool Name>/              INERT
    README.md
    record.txt
```

## Verifying

```bash
python3 verify.py "<path to this folder>"
python3 measure.py "<path to this folder>" --bin <node_modules/.bin>
```
