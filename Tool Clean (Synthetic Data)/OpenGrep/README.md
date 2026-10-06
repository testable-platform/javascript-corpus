# OpenGrep

Synthetic, clean-by-design JavaScript project for **OpenGrep**.

Domain: A gate-access badge controller with a cryptographically random visitor-code generator.

**Not installed here**: see Notes for why, and what was checked instead.

## What a passing result looks like

0 findings against the folder's own committed semgrep-rules.yml (no eval, no shell-command concatenation, no Math.random() for a security-sensitive value).

## Command

```bash
opengrep --config=semgrep-rules.yml --error src/
```

## Notes

The opengrep binary is a GitHub release asset; this sandbox's egress allowlist returns 403 for it (same constraint as the Python sibling corpus). As a same-engine stand-in, `semgrep --config=semgrep-rules.yml` (installed from PyPI) was run for real against this exact ruleset and source, and reported 0 findings.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | NOT INSTALLED (same as documented at corpus level -- unchanged across families) |
| node24 | NOT INSTALLED (same as documented at corpus level -- unchanged across families) |
| node26 | NOT INSTALLED (same as documented at corpus level -- unchanged across families) |
