# Mocha

Synthetic, invalid-by-design JavaScript project for **Mocha**.

Domain: A library call-number shelving system with 4 deliberate logic bugs (silent overwrite instead of rejection, wrong missing-entry value, off-by-one count, no-op delete).

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

4 of the 5 real tests (80%) fail against the real, deliberately buggy implementation.

## Command

```bash
mocha 'test/**/*.test.js'
```

## Notes

Every bug is a genuine behavioral defect (not a test-writing mistake), and the test suite correctly catches 4 of them when actually run.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node24 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node26 | **FINDINGS** (installed and run for real under this family's own Node binary) |
