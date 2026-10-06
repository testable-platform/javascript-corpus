# StrykerJS

Synthetic, clean-by-design JavaScript project for **StrykerJS**.

Domain: A three-phase traffic signal controller.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What a passing result looks like

Stryker reports a 100.00 mutation score against a break threshold of 100 -- every mutant killed, none survived.

## Command

```bash
stryker run
```

## Notes

@stryker-mutator/core@10.0.0 (the version this session's npm registry resolves to by default) failed in the CHILD test-runner process specifically -- 'Cannot find TestRunner plugin "mocha"' -- even though the plugin was correctly installed and loaded in the main process; this reproduced with a clean, isolated local install, so it is not an artifact of this sandbox's shared workspace. Pinning @stryker-mutator/core@8.7.1 + @stryker-mutator/mocha-runner@8.7.1 + mocha@10.8.2 resolved it and ran cleanly end to end.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | CLEAN (installed and run for real under this family's own Node binary) |
| node24 | CLEAN (installed and run for real under this family's own Node binary) |
| node26 | CLEAN (installed and run for real under this family's own Node binary) |
