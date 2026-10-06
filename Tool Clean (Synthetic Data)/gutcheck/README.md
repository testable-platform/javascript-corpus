# gutcheck

Synthetic, clean-by-design JavaScript project for **gutcheck**.

Domain: A tiered utility-meter billing calculator.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What a passing result looks like

gutcheck . (mocha auto-detected) reports every probeable function PROVEN, 0 HOLLOW, 0 untested.

## Command

```bash
gutcheck .
```

## Notes

First pass caught a real arithmetic mistake in this folder's own test (an expected value computed by hand was off by 100) -- gutcheck reported the test failing before any mutation even ran, exactly the class of bug it exists to surface. Fixed in the test, not worked around.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (source only -- gutcheck has no resolvable release on this family) |
| node14 | CODE-ONLY (source only -- gutcheck has no resolvable release on this family) |
| node20 | CLEAN (installed and run for real under this family's own Node binary) |
| node24 | CLEAN (installed and run for real under this family's own Node binary) |
| node26 | CLEAN (installed and run for real under this family's own Node binary) |
