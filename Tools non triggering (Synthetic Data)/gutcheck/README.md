# gutcheck

Domain: tin smelting charges

Keys on: functions it can probe, with a test runner to exercise them

Shape: no source, because this tool decides PROVEN or HOLLOW by running the covering tests. A minimal program would not change that, and shipping one would imply a verdict this folder cannot support.

Inert here because: It reports whether each probeable function is PROVEN or HOLLOW, which it
  decides by running the tests that cover it. With no suite present there
  is nothing to prove and nothing to call hollow.

Expected: NOT TRIGGERED, no input discovered.
