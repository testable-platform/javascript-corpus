# eslint-plugin-security

Domain: dye vat batches

Keys on: an ESLint run that has loaded it - it is a rule set, not a command

Shape: real source, because this tool rules evaluated over parsed source by a host run.

Nothing to report on it: A rule set cannot fire on its own. ESLint does not start here, so these
  rules are never loaded, let alone evaluated.

Contents: one minimal program per boundary family (node12, node14, node20, node24, node26). One class or one function, no branching, no duplication, no dependency, no dead export, no magic number. No manifest and no tool configuration, so nothing here is discovered as a project.

Expected: the tool runs and reports nothing.
