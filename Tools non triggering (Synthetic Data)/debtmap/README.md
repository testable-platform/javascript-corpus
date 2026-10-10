# debtmap

Domain: flax retting ponds

Keys on: source files in a supported language, scored for technical debt

Shape: real source, because this tool scores debt per function, which needs a parse.

Nothing to report on it: Debt is scored per function from a parse. One straight-line function
  scores zero debt items and zero density, well inside any budget.

Contents: one minimal program per boundary family (node12, node14, node20, node24, node26). One class or one function, no branching, no duplication, no dependency, no dead export, no magic number. No manifest and no tool configuration, so nothing here is discovered as a project.

Expected: the tool runs and reports nothing.
