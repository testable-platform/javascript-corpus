# ESLint

Synthetic, invalid-by-design JavaScript project for **ESLint**.

Domain: A cafe order queue with running-total pricing, deliberately riddled with var usage, loose equality, an undefined global reference, and an unused variable.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

eslint reports 8 real errors across all 5 configured rules (no-var, no-unused-vars, eqeqeq x2, no-undef x2, prefer-const).

## Command

```bash
eslint src/ test/
```

## Notes

Every one of the folder's own 5 configured rules fires at least once -- not a single marginal violation but a genuinely bad file by its own config's standard.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node24 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node26 | **FINDINGS** (installed and run for real under this family's own Node binary) |
