# ESLint

Domain: kiln drying schedules

Keys on: eslint.config.* or .eslintrc*, then files matching its extension globs

Shape: real source, because this tool lints parsed source.

Nothing to report on it: Measured: ESLint exits reporting it could not find a configuration file,
  before any source is read. Given one, the code clears its recommended
  set outright.

Contents: one minimal program per boundary family (node12, node14, node20, node24, node26). One class or one function, no branching, no duplication, no dependency, no dead export, no magic number. No manifest and no tool configuration, so nothing here is discovered as a project.

Expected: the tool runs and reports nothing.
