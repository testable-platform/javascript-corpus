# eslint-plugin-sonarjs

Synthetic, clean-by-design JavaScript project for **eslint-plugin-sonarjs**.

Domain: A train ticket queue with per-class fares.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What a passing result looks like

eslint with plugin:sonarjs/recommended reports 0 findings -- no duplicated branches, no collapsible conditionals, low cognitive complexity throughout.

## Command

```bash
eslint src/ test/
```

## Notes

Needs its own local `npm install`, not a shared node_modules: eslint-plugin-sonarjs pins its own typescript range internally (via ts-api-utils), and an unrelated newer typescript hoisted at a shared root will get deduped into its dependency tree and crash (confirmed: TypeScript 7.0.2 breaks ts-api-utils@2.5.0, which expects TypeScript 5.x/6.x's internal API). A folder-local install resolves this correctly.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | CLEAN (installed and run for real under this family's own Node binary) |
| node24 | CLEAN (installed and run for real under this family's own Node binary) |
| node26 | CLEAN (installed and run for real under this family's own Node binary) |
