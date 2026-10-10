# knip

Domain: cartwright axle sets

Keys on: knip.json plus the entry and project globs of package.json

Shape: no source, because this tool needs package.json entry and project globs to define a boundary. A minimal program would not change that, and shipping one would imply a verdict this folder cannot support.

Inert here because: Unused-export analysis needs a declared project boundary. Measured: knip
  reports it cannot find a package.json to read.

Expected: NOT TRIGGERED, no input discovered.
