# monocart-coverage-reports

Synthetic, invalid-by-design JavaScript project for **monocart-coverage-reports**.

Domain: A warehouse shelf item-count tracker with a single, minimal test that only exercises addTo()'s own return value.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

The json-summary report's entry for src/shelfcount.js shows 47.05% line coverage, 40% function coverage, 50% branch coverage -- all majority-uncovered.

## Command

```bash
mcr node node_modules/.bin/mocha 'test/**/*.test.js' -r v8,json-summary -o coverage-report
```

## Notes

countOn, grandTotal, and isOverCapacity are never directly tested; only 2 of the file's 5 functions ever run under test.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node24 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node26 | **FINDINGS** (installed and run for real under this family's own Node binary) |
