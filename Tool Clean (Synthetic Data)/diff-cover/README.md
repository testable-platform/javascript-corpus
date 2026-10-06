# diff-cover

Synthetic, clean-by-design JavaScript project for **diff-cover**.

Domain: A scoreboard tally tracker, with a real git history and a feature branch adding one new, fully-tested function.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What a passing result looks like

diff-cover reports 100% coverage on every line the feature branch adds relative to main.

## Command

```bash
nyc --reporter=cobertura mocha 'test/**/*.test.js' && diff-cover coverage/cobertura-coverage.xml --compare-branch=main --fail-under=100
```

## Notes

External tool (pip install diff-cover), same as the Python sibling corpus. The new function and its test land in the same feature-branch commit, since a diff containing new code with no covering test would report under 100%.
