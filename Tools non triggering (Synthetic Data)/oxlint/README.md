# oxlint

Domain: malt floor turnings

Keys on: files matching its extension list beneath the scanned path

Shape: real source, because this tool lints parsed source.

Nothing to report on it: Measured on the sibling TypeScript folder and the same shape here: the
  rule set loads in full and then finds nothing to object to, across all
  201 rules rather than just the defaults.

Contents: one minimal program per boundary family (node12, node14, node20, node24, node26). One class or one function, no branching, no duplication, no dependency, no dead export, no magic number. No manifest and no tool configuration, so nothing here is discovered as a project.

Expected: the tool runs and reports nothing.
