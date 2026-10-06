# nyc

Synthetic, clean-by-design JavaScript project for **nyc**.

Domain: A payroll calculator with an overtime multiplier.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What a passing result looks like

nyc --check-coverage reports 100% statements, branches, functions, and lines.

## Command

```bash
nyc --check-coverage --lines 100 --branches 100 --functions 100 --statements 100 mocha 'test/**/*.test.js'
```

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | CLEAN (installed and run for real under this family's own Node binary) |
| node24 | CLEAN (installed and run for real under this family's own Node binary) |
| node26 | CLEAN (installed and run for real under this family's own Node binary) |
