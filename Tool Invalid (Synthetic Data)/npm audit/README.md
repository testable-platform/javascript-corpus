# npm audit

Synthetic, invalid-by-design JavaScript project for **npm audit**.

Domain: A shipping-crate manifest that depends on minimist@0.0.8, a real, old, vulnerable runtime dependency.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

npm audit reports 1 critical-severity prototype-pollution vulnerability (GHSA-vh95-rmgr-6w4m / GHSA-xvch-5gv4-984h) -- the folder's single runtime dependency (1 of 1, 100%) is vulnerable.

## Command

```bash
npm audit --audit-level=low
```

## Notes

minimist@0.0.8 is a real package version with a real, published, critical CVE -- not a synthetic or hypothetical vulnerability.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | FINDINGS (non-Node tool; content identical across families) |
| node24 | FINDINGS (non-Node tool; content identical across families) |
| node26 | FINDINGS (non-Node tool; content identical across families) |
