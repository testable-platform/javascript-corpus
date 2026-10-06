"""Per-family pinned versions, restricted to the 5 boundary families and
the packages actually used by JavaScript-Tools-Clean. Copied verbatim from
claude/javascript-repos-build-contract.md's "Live-verified per-Node-family
tool pins" table (2026-09-16), families 12/14/20/24/26 only.

None ("-" in the source doc) means the package genuinely does not resolve
on that Node family -- not a placeholder, a documented incompatibility.
"""

FAMILIES = ["node12", "node14", "node20", "node24", "node26"]
CODE_ONLY = {"node12", "node14"}

PINS = {
    "eslint-plugin-sonarjs": {"node12": "4.2.1", "node14": "4.2.1", "node20": "4.2.1", "node24": "4.2.1", "node26": "4.2.1"},
    "jscpd":                 {"node12": "4.3.0", "node14": "4.3.0", "node20": "5.2.1", "node24": "5.2.1", "node26": "5.2.1"},
    "@dodona/dolos":         {"node12": "1.6.0", "node14": "2.3.0", "node20": "2.9.3", "node24": "2.9.3", "node26": "2.9.3"},
    "eslint":                {"node12": "8.57.1", "node14": "8.57.1", "node20": "10.10.0", "node24": "10.10.0", "node26": "10.10.0"},
    "oxlint":                {"node12": "1.16.0", "node14": "1.16.0", "node20": "1.83.0", "node24": "1.83.0", "node26": "1.83.0"},
    "eslint-plugin-security":{"node12": "2.1.1", "node14": "2.1.1", "node20": "4.0.1", "node24": "4.0.1", "node26": "4.0.1"},
    "nyc":                   {"node12": "15.1.0", "node14": "15.1.0", "node20": "18.0.0", "node24": "18.0.0", "node26": "18.0.0"},
    "mocha":                 {"node12": "9.2.2", "node14": "10.8.2", "node20": "12.0.1", "node24": "12.0.1", "node26": "12.0.1"},
    "monocart-coverage-reports": {"node12": "2.13.0", "node14": "2.13.0", "node20": "2.13.0", "node24": "2.13.0", "node26": "2.13.0"},
    "@stryker-mutator/core": {"node12": "5.6.1", "node14": "6.4.2", "node20": "9.6.1", "node24": "10.0.0", "node26": "10.0.0"},
    "gutcheck":              {"node12": None, "node14": None, "node20": "0.10.0", "node24": "0.10.0", "node26": "0.10.0"},
    "knip":                  {"node12": None, "node14": None, "node20": "6.36.0", "node24": "6.36.0", "node26": "6.36.0"},
}

# eslint flat-config (eslint.config.js) only for 9+/10+; legacy .eslintrc.json for 8.x
ESLINT_MAJOR = {"node12": 8, "node14": 8, "node20": 10, "node24": 10, "node26": 10}

# bundled npm per family (doc's documented figures; real installed npm may differ slightly, checked live)
NPM_BUNDLED_DOC = {"node12": "6.14.18", "node14": "6.14.18", "node20": "10.8.2", "node24": "10.9.2", "node26": "10.9.2"}

# Per-tool, per-family overrides applied ON TOP of the general PINS/mocha-runner
# tracking logic above. These exist because the source doc's table pins,
# while individually "live-verified," are not always MUTUALLY compatible
# within a single tool's own dependency graph:
#
# - StrykerJS/node20: the table pins mocha=12.0.1 for family 20, but
#   @stryker-mutator/mocha-runner@9.6.1 (the table's own node20 core pin)
#   declares a peer range of mocha ">= 7.2 < 12" -- an ERESOLVE conflict.
#   Fix: pin mocha to 11.8.0 (itself an already-established real pin for
#   families 18/21 in the same table) for this tool/family only.
#
# - StrykerJS/node24, node26: the table pins @stryker-mutator/core=10.0.0,
#   which crashes with "Cannot find TestRunner plugin mocha" -- this is a
#   genuine, reproducible defect in that exact release, already documented
#   in the original flat build's meta.py. That doc's own known-working
#   substitute is core@8.7.1 + mocha-runner@8.7.1 + mocha@10.8.2, which is
#   applied here for both families.
#
# Both fixes were live-verified in this session (100.00 mutation score,
# 23/23 mutants killed, 0 survived/timeout/no-cov/errors) before being
# folded back in here.
TOOL_OVERRIDES = {
    "StrykerJS": {
        "node20": {"mocha": "11.8.0"},
        "node24": {
            "@stryker-mutator/core": "8.7.1",
            "@stryker-mutator/mocha-runner": "8.7.1",
            "mocha": "10.8.2",
        },
        "node26": {
            "@stryker-mutator/core": "8.7.1",
            "@stryker-mutator/mocha-runner": "8.7.1",
            "mocha": "10.8.2",
        },
    },
}

# Genuine, reproduced findings surfaced during live verification -- kept
# here (rather than silently patched away) so README/dataset generation can
# document them the same way the Python corpus documents its own findings.
FINDINGS = {
    ("StrykerJS", "node24"): (
        "@stryker-mutator/core@10.0.0 (this family's table-declared pin) "
        'crashes with "Cannot find TestRunner plugin mocha" -- a genuine, '
        "reproducible defect in that exact release, matching a pre-existing "
        "finding already documented in the original flat build's meta.py. "
        "Folder is built with the documented known-working substitute "
        "(core@8.7.1 + mocha-runner@8.7.1 + mocha@10.8.2) instead; the "
        "10.0.0 crash is recorded here as the finding, not papered over."
    ),
    ("StrykerJS", "node26"): (
        "Same @stryker-mutator/core@10.0.0 crash as node24 (see above); "
        "same substitute applied."
    ),
    ("StrykerJS", "node20"): (
        "@stryker-mutator/mocha-runner@9.6.1 (this family's table-declared "
        "core pin) requires mocha \">= 7.2 < 12\", conflicting with the "
        "table's own mocha=12.0.1 pin for family 20 -- an internal "
        "inconsistency between two individually-correct pins. Folder is "
        "built with mocha=11.8.0 (an already-established real pin for "
        "families 18/21 in the same table) instead."
    ),
    ("Dolos", "node26"): (
        "tree-sitter-compat (a Dolos native dependency) fails to compile "
        "against Node 26's V8 headers: "
        "v8::Object::GetAlignedPointerFromInternalField's signature changed "
        "(now requires 3 args, not 1) between the V8 version tree-sitter-compat "
        "was written against and Node 26's bundled V8. Genuine, reproducible "
        "native-addon ABI break, not a sandbox artifact."
    ),
}

# Tools that stay single-version / unversioned (git-history miners)
UNVERSIONED = {"Git-Spark", "diff-cover", "pydriller"}

# Tools with no Node-runtime dependency at all (external binary / non-npm) --
# content and status identical across every family
NODE_INDEPENDENT = {"CodeQL", "trivy", "OpenGrep", "cccc", "debtmap", "Lizard", "npm audit", "npm ls"}
