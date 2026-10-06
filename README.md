# javascript-combos

Single GitHub repo for the JavaScript white-box combo corpus. All 576 combos live as branches in this one repo.

Two naming schemes have existed before this one: split across four repos per Node version (`javascript-n12-001-016`, `017-032`, …), then briefly consolidated under `CE-N{version}-{id}` (version embedded, id resetting every family). Both are retired.

## Branch naming

`JS_V{version}_{BUNDLER}_{PACKAGE_MANAGER}_{ARCHITECTURE}`

Matches the convention already in use on the Python corpus (`PY_V313_POETRY_PIP_MONO`, `PY_V313_SETUPTOOLS_CONDA_MICRO`, …): language prefix, version, build/bundle tool, package manager, architecture, all upper-case and underscore-separated — everything that varies is readable straight out of the branch name, nothing needs a lookup table to decode.

- **version:** `V12`, `V14`, `V16`, `V18`, `V20`, `V21`, `V22`, `V24`, `V26`
- **bundler:** `ESBUILD`, `VITE` (Vite, built as esbuild), `WEBPACK`, `ROLLUP`, `RSPACK`, `PARCEL`, `TURBOPACK`, `SWC`
- **package manager:** `NPM`, `YARN` (Berry), `PNPM`, `BUN`
- **architecture:** `MONO` (Monolith), `MICRO` (Microservices)

Example:

```bash
git clone https://github.com/BENNYameen/javascript-combos.git
cd javascript-combos
git checkout JS_V12_ESBUILD_NPM_MONO
```

Direct URL: `https://github.com/BENNYameen/javascript-combos/tree/JS_V12_ESBUILD_NPM_MONO`

### Migrating from the old `CE-N{version}-{id}` names

`branch_rename_map.csv` carries the full old→new mapping, and `rename_branches.sh`
applies it (local branch rename, worktree move, push new / delete old on
origin). Both assume the one-branch-per-directory worktree layout already in
use here. Run with no arguments first for a dry-run printout before passing
`--apply`.

## Combo grid (64 per Node version, 9 families, 576 branches total)

For each Node version: 8 bundlers × 4 package managers × 2 architectures = 64 branches, e.g. for V12:

| Branch | Bundler | Package manager | Architecture |
| --- | --- | --- | --- |
| JS_V12_ESBUILD_NPM_MONO | esbuild | npm | Monolith |
| JS_V12_ESBUILD_NPM_MICRO | esbuild | npm | Microservices |
| JS_V12_ESBUILD_YARN_MONO | esbuild | yarn (Berry) | Monolith |
| JS_V12_ESBUILD_YARN_MICRO | esbuild | yarn (Berry) | Microservices |
| JS_V12_ESBUILD_PNPM_MONO | esbuild | pnpm | Monolith |
| JS_V12_ESBUILD_PNPM_MICRO | esbuild | pnpm | Microservices |
| JS_V12_ESBUILD_BUN_MONO | esbuild | bun | Monolith |
| JS_V12_ESBUILD_BUN_MICRO | esbuild | bun | Microservices |
| … | VITE, WEBPACK, ROLLUP, RSPACK, PARCEL, TURBOPACK, SWC | same 4 | same 2 |

...and the same 64-branch pattern repeats for V14, V16, V18, V20, V21, V22, V24, V26.

Full index: [COMBOS.csv](COMBOS.csv) (576 rows, includes each branch's retired `CE-N...` name under `Legacy Branch ID`).

## Rebuild (2026-09-16)

All 576 branches were regenerated from scratch by `generator/gen_js_corpus.py`
to fix a broken prior state: an empty Node 20 family, incoherent per-family
tool wiring, a domain layer that wasn't byte-identical across branches
(different fictional product names, a hardcoded per-branch ID prefix), stale
ES-module-syntax duplicate source under Microservices branches, and a
103-metric tool roster with two fabricated tools and a fake copy-paste
version drag on the Path Coverage / Data-Flow blocks. Full detail —
the repaired roster, the live npm-registry-verified per-family tool-pin
table, the domain-invariant decision, and what was verified vs. what's
deferred to real local installs — is in `javascript-repos-build-contract.md`
in the Testable (Tools) Claude Project.

Domain: **GraniteMill** (`granite-mill`, "Community garden plots"),
ID prefix `GM-`, byte-identical across all 576 branches (verified by
SHA-256 across every branch's domain source).

`CLAUDE_CODE_PROMPT.md` in this directory has the exact instructions for
finishing the corpus locally: real per-branch package-manager installs,
real per-Node-version test runs, live pin re-verification, then running
the branch rename above and pushing.

## Notes

- Node **20** now has full generated content, same as every other family —
  it previously had none (bare placeholders copied from `main`).
- Other versions' worktrees were regenerated in place (old content wiped,
  not merely added to) — see the build contract for exactly what was
  removed and why.
