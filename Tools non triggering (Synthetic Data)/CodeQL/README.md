# CodeQL

Domain: saltworks evaporation pans

Keys on: a database built by extracting source, then queried by a query pack

Shape: real source, because this tool extracts source into a database and queries it.

Nothing to report on it: A default JS query pack looks for eval, unsanitised input reaching a sink,
  prototype-pollution-shaped merges and hardcoded secrets. This program
  formats one number and calls nothing.

Contents: one minimal program per boundary family (node12, node14, node20, node24, node26). One class or one function, no branching, no duplication, no dependency, no dead export, no magic number. No manifest and no tool configuration, so nothing here is discovered as a project.

Expected: the tool runs and reports nothing.
