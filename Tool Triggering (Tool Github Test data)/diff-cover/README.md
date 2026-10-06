# diff-cover

Synthetic, invalid-by-design JavaScript project for **diff-cover**.

Domain: A scoreboard tally tracker, with a real git history and a feature branch adding allTied/marginOfVictory/rankPlayers, almost entirely untested.

**Measured**: installed and actually invoked in the build environment; the result below is real, not asserted.

## What makes this folder invalid (majority wrong, measured)

diff-cover reports 41.7% coverage on the feature branch's diff against main -- 58.3% of the new lines are uncovered.

## Command

```bash
nyc --reporter=cobertura mocha 'test/**/*.test.js' && diff-cover coverage/cobertura-coverage.xml --compare-branch=main --fail-under=100
```

## Notes

Only allTied() is tested; marginOfVictory() and rankPlayers() are added in the same commit with no covering test at all, so the majority of the diff's new lines (7 of 12) are genuinely uncovered.
