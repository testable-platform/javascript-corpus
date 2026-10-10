# StrykerJS

Domain: eel trap placements

Keys on: stryker.conf.* plus a test runner and mutable source

Shape: no source, because this tool re-runs a test suite against each mutant. A minimal program would not change that, and shipping one would imply a verdict this folder cannot support.

Inert here because: Mutation testing needs a suite that can tell a mutant from the original.
  There is no test here, so the initial run that must precede mutation
  never starts.

Expected: NOT TRIGGERED, no input discovered.
