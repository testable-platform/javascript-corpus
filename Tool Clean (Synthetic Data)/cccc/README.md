# cccc

CCCC (C and C++ Code Counter) analyses C, C++, and Java source, not
JavaScript. The Testable platform's own build-contract notes flag this
folder's registration as a category error: it was pulled in as a
"Cognitive Complexity" alternative for the JavaScript roster, but CCCC
does not measure cognitive complexity and cannot parse JavaScript at
all (see `claude/javascript-repos-build-contract.md`'s "Roster repair"
section). Rather than force-feed it JavaScript it cannot read, this
folder gives CCCC genuine, small C source of its own -- the one thing
it can actually analyse cleanly.

## Per-Node-family results

Boundary-version methodology: 2 earliest + 1 middle + 2 latest supported Node majors. node12/node14 are **code-only** (valid, version-appropriate source with no live tool invocation, since these tools' modern releases do not run on pre-ES2020 Node baselines); node20/node24/node26 are **live-verified** -- actually installed and run under that family's own real Node binary.

| Family | Status |
| --- | --- |
| node12 | CODE-ONLY (valid source, no live tool run) |
| node14 | CODE-ONLY (valid source, no live tool run) |
| node20 | CLEAN (non-Node tool; content identical across families) |
| node24 | CLEAN (non-Node tool; content identical across families) |
| node26 | CLEAN (non-Node tool; content identical across families) |
