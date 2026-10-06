# monocart-coverage-reports

Synthetic, clean-by-design JavaScript project for **monocart-coverage-reports**.

Domain: A warehouse shelf item-count tracker.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What a passing result looks like

The json-summary report's entry for src/shelfcount.js shows 100% lines, statements, functions, and branches.

## Command

```bash
mcr node node_modules/.bin/mocha 'test/**/*.test.js' -r v8,json-summary -o coverage-report
```

## Notes

monocart has no built-in fail-under threshold (its CLI never calls process.exit(1) on low coverage by design), so this folder's own check reads the generated coverage-summary.json and asserts 100% on its own source file directly, rather than trusting the command's exit code alone.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | CLEAN (installed and run for real under this family's own Node binary) |
| node24 | CLEAN (installed and run for real under this family's own Node binary) |
| node26 | CLEAN (installed and run for real under this family's own Node binary) |
