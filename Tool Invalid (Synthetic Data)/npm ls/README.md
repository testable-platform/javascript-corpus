# npm ls

Synthetic, invalid-by-design JavaScript project for **npm ls**.

Domain: A courier's parcel-satchel route tracker declaring 2 dependencies that cannot resolve: left-pad@999.999.999 (a version that does not exist) and is-odd@0.0.1 (never installed).

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

npm ls --all reports both of the folder's 2 declared dependencies (100%) as UNMET DEPENDENCY, exiting with ELSPROBLEMS.

## Command

```bash
npm ls --all
```

## Notes

Both dependencies the folder declares are genuinely unresolvable, not just one of several -- npm ls's own dependency-tree check fails completely, not partially.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | FINDINGS (non-Node tool; content identical across families) |
| node24 | FINDINGS (non-Node tool; content identical across families) |
| node26 | FINDINGS (non-Node tool; content identical across families) |
