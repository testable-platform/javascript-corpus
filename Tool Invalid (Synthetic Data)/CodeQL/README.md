# CodeQL

Synthetic, invalid-by-design JavaScript project for **CodeQL**.

Domain: A lighthouse beacon flash scheduler with eval(), a shell command built from string concatenation, and a weak PRNG for a security-relevant id.

**Not installed here**: see Notes for why, and what was checked instead.

## What makes this folder invalid (majority wrong, measured)

A default CodeQL JS/TS query pack would flag the eval(), the child_process concatenation, and the weak randomness -- all three are present and real, but CodeQL itself cannot be measured here (see notes).

## Command

```bash
codeql database create ... && codeql database analyze ...  (not runnable here -- see notes)
```

## Notes

Same egress constraint as the Clean sibling: the CodeQL CLI and query packs ship as GitHub release assets, and this sandbox's allowlist returns 403 for github.com release downloads. Source only, genuinely insecure by inspection, not measured in this environment.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation -- same source as the Clean sibling's families, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary, and confirmed to produce a genuine finding, not asserted.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | NOT INSTALLED (same as documented at corpus level -- unchanged across families) |
| node24 | NOT INSTALLED (same as documented at corpus level -- unchanged across families) |
| node26 | NOT INSTALLED (same as documented at corpus level -- unchanged across families) |
