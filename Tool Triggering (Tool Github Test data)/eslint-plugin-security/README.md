# eslint-plugin-security

Synthetic, invalid-by-design JavaScript project for **eslint-plugin-security**.

Domain: A combination-lock simulator using eval(), a child_process.exec() built from string concatenation, and an unused variable.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

eslint with plugin:security/recommended reports detect-eval-with-expression and detect-child-process, plus a no-unused-vars error.

## Command

```bash
eslint src/ test/
```

## Notes

describeState() hands a string straight to eval(), and logAttempt() builds a shell command via string concatenation passed to child_process.exec() -- both are exactly the patterns plugin:security/recommended exists to catch, and both fire for real.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node24 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node26 | **FINDINGS** (installed and run for real under this family's own Node binary) |
