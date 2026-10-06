# knip

Synthetic, invalid-by-design JavaScript project for **knip**.

Domain: A seasonal flower catalog with an entirely unused file (legacyReport.js), an unused devDependency (left-pad), and an unused export (catalog.js's unusedHelper).

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

knip reports 1 unused file, 1 unused devDependency, and 1 unused export -- 3 real findings across all 3 of knip's own categories.

## Command

```bash
knip
```

## Notes

Every category knip checks (files, dependencies, exports) has at least one genuine, real hit -- not a single-category edge case.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node24 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node26 | **FINDINGS** (installed and run for real under this family's own Node binary) |
