# CodeQL

Synthetic, clean-by-design JavaScript project for **CodeQL**.

Domain: A lighthouse beacon flash scheduler.

**Not installed here**: see Notes for why, and what was checked instead.

## What a passing result looks like

No unsafe patterns a default CodeQL JS/TS query pack would flag (no eval, no unsanitized regex-from-input, no prototype-pollution-shaped merges, no hardcoded secrets).

## Command

```bash
codeql database create ... && codeql database analyze ...  (not runnable here -- see notes)
```

## Notes

The CodeQL CLI and query packs ship as GitHub release assets; this sandbox's egress allowlist returns 403 for github.com release downloads (confirmed directly, same constraint already documented for Trivy/Opengrep in the sibling Python-Tools-Clean corpus). No apt/pip/npm package provides the CLI either. Source only, clean by inspection, not measured in this environment.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | NOT INSTALLED (same as documented at corpus level -- unchanged across families) |
| node24 | NOT INSTALLED (same as documented at corpus level -- unchanged across families) |
| node26 | NOT INSTALLED (same as documented at corpus level -- unchanged across families) |
