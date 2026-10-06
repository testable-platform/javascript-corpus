# trivy

Synthetic, invalid-by-design JavaScript project for **trivy**.

Domain: A cargo-yard loading-dock scheduler carrying a hardcoded API-token-shaped string and a real vulnerable runtime dependency (minimist@0.0.8).

**Not installed here**: see Notes for why, and what was checked instead.

## What makes this folder invalid (majority wrong, measured)

A real trivy scan would flag the hardcoded secret-shaped string and the known-vulnerable minimist@0.0.8 dependency -- both are present and real, but trivy itself cannot be measured here (see notes).

## Command

```bash
trivy fs --scanners vuln,secret --exit-code 1 .
```

## Notes

Same egress constraint as the Clean sibling: the trivy binary is a GitHub release asset, blocked by this sandbox's allowlist. Source only, genuinely vulnerable by inspection (confirmed separately via npm audit against the identical minimist@0.0.8 dependency in the npm-audit folder), not measured in this environment.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | NOT INSTALLED (same as documented at corpus level -- unchanged across families) |
| node24 | NOT INSTALLED (same as documented at corpus level -- unchanged across families) |
| node26 | NOT INSTALLED (same as documented at corpus level -- unchanged across families) |
