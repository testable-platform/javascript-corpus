# Mocha

Domain: net mending gauges

Keys on: files matching its spec glob, which it then executes

Shape: no source, because this tool executes files matching its spec glob. A minimal program would not change that, and shipping one would imply a verdict this folder cannot support.

Inert here because: A runner needs tests. No file here matches a spec glob and nothing
  describes a suite, so the run collects zero tests rather than passing
  them.

Expected: NOT TRIGGERED, no input discovered.
