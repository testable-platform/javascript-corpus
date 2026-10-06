# knip

Synthetic, clean-by-design JavaScript project for **knip**.

Domain: A small seasonal flower catalog.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What a passing result looks like

knip reports zero unused files, exports, or dependencies, and zero configuration hints.

## Command

```bash
knip
```

## Notes

First pass was clean of real findings but printed a 'redundant entry pattern' configuration hint (index.js already matches knip's default entry glob, so declaring it again in knip.json was noise); removed the redundant declaration so the run is completely silent.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (source only -- knip has no resolvable release on this family) |
| node14 | CODE-ONLY (source only -- knip has no resolvable release on this family) |
| node20 | CLEAN (installed and run for real under this family's own Node binary) |
| node24 | CLEAN (installed and run for real under this family's own Node binary) |
| node26 | CLEAN (installed and run for real under this family's own Node binary) |
