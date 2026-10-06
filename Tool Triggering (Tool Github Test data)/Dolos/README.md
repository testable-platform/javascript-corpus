# Dolos

Synthetic, invalid-by-design JavaScript project for **Dolos**.

Domain: An aquarium kelp-growth and water-chemistry tracker split across three files; growth.js is a near-verbatim structural clone of feeding.js (renamed identifiers only).

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

Dolos reports a pairwise similarity score of 1.0 (the maximum) between feeding.js and growth.js, far over the 0.3 FINDINGS threshold.

## Command

```bash
dolos run src/*.js -l javascript
```

## Notes

feeding.js (FeedingLog) and growth.js (GrowthLog) have identical structure, identical control flow, and identical method shapes -- only identifiers differ. Dolos's own fragment matcher reports the maximum similarity score of 1.0.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node24 | **FINDINGS** (installed and run for real under this family's own Node binary) |
| node26 | **FINDINGS** (installed and run for real under this family's own Node binary) |
