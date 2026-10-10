# trivy

Domain: lime burning draws

Keys on: a lockfile, a manifest, a filesystem or an image, resolved into
  coordinates

Shape: no source, because this tool resolves package coordinates from a lockfile or manifest. A minimal program would not change that, and shipping one would imply a verdict this folder cannot support.

Inert here because: The dependency set it would scan is empty, and its filesystem mode finds
  no manifest to anchor on, so no advisory lookup follows.

Expected: NOT TRIGGERED, no input discovered.
