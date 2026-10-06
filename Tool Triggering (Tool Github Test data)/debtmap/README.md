# debtmap

Synthetic, invalid-by-design JavaScript project for **debtmap**.

Domain: A harbor berth-assignment log with copy-pasted, deeply-nested arrive()/depart() methods and a dead unusedLegacyReport() method.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

debtmap analyze reports a debt density of 472.4 per 1K LOC against a 10.0 threshold -- more than 47x over.

## Command

```bash
debtmap analyze . --format terminal
```

## Notes

debtmap validate reports '0 files analyzed' unconditionally in this installed version (0.24.1) -- a genuine, content-independent quirk reproduced even against the original Clean-corpus source, not something this fixture caused. debtmap analyze does not have this bug, so it is used as the real measurement: 3 CRITICAL/HIGH findings (arrive, depart, unusedLegacyReport), debt density 472.4 per 1K LOC vs. the 10.0 threshold.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | FINDINGS (non-Node tool; content identical across families) |
| node24 | FINDINGS (non-Node tool; content identical across families) |
| node26 | FINDINGS (non-Node tool; content identical across families) |
