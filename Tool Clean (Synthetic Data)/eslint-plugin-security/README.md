# eslint-plugin-security

Synthetic, clean-by-design JavaScript project for **eslint-plugin-security**.

Domain: A combination-lock simulator using crypto.randomInt and crypto.timingSafeEqual throughout.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What a passing result looks like

eslint with plugin:security/recommended reports 0 findings -- no eval, no unsafe regex, no non-literal require, no weak randomness for a security-relevant value, no non-constant-time comparison.

## Command

```bash
eslint src/ test/
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
