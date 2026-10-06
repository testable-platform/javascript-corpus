#!/usr/bin/env python3
"""Explode each versionable JavaScript-Tools-Clean tool folder into
node12/node14/node20/node24/node26 subfolders, mirroring the Python
py3.X pattern. Copies src/test/config files unchanged (no ES2020+ syntax
in the domain code, confirmed), and rewrites package.json's
devDependencies to the per-family pinned versions from pin_table.py.

For the three eslint-family tools, also swaps the config file format:
flat eslint.config.js for eslint 9+/10+ families (node20/24/26), legacy
.eslintrc.json for eslint 8.x families (node12/14) -- matching the
convention already established in javascript-repos-build-contract.md.
"""
import json
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(__file__))
from pin_table import FAMILIES, CODE_ONLY, PINS, ESLINT_MAJOR, UNVERSIONED, NODE_INDEPENDENT, TOOL_OVERRIDES

ROOT = "/root/js_work"

ESLINT_TOOLS = {"ESLint", "eslint-plugin-security", "eslint-plugin-sonarjs"}

LEGACY_ESLINTRC = {
    "ESLint": {
        "env": {"node": True, "es2020": True},
        "parserOptions": {"ecmaVersion": 2020, "sourceType": "script"},
        "extends": ["eslint:recommended"],
        "rules": {},
    },
    "eslint-plugin-security": {
        "env": {"node": True, "es2020": True},
        "parserOptions": {"ecmaVersion": 2020, "sourceType": "script"},
        "plugins": ["security"],
        "extends": ["plugin:security/recommended-legacy"],
        "rules": {},
    },
    "eslint-plugin-sonarjs": {
        "env": {"node": True, "es2020": True},
        "parserOptions": {"ecmaVersion": 2020, "sourceType": "script"},
        "plugins": ["sonarjs"],
        "extends": ["plugin:sonarjs/recommended-legacy"],
        "rules": {},
    },
}


def rewrite_package_json(tool, family, pkg):
    """Return a new package.json dict with devDependencies pinned to this
    family's resolved versions. Returns None if a required package is
    genuinely unavailable on this family (gutcheck/knip on node12/14)."""
    pkg = json.loads(json.dumps(pkg))  # deep copy
    dd = pkg.get("devDependencies", {})
    unavailable = []
    for name in list(dd.keys()):
        if name in PINS:
            pin = PINS[name].get(family)
            if pin is None:
                # Genuinely unavailable on this family (e.g. gutcheck/knip on
                # node12/14, which predate the Node baseline those tools
                # require). Drop the devDependency entirely rather than
                # leaving a stale caret-range version that could never
                # resolve -- the .UNAVAILABLE marker plus the README are the
                # record of why, not a phantom package.json entry.
                unavailable.append(name)
                del dd[name]
            else:
                dd[name] = pin
        # mocha-runner tracks stryker core's own major/minor when present
        if name == "@stryker-mutator/mocha-runner" and "@stryker-mutator/core" in PINS:
            core_pin = PINS["@stryker-mutator/core"].get(family)
            if core_pin:
                dd[name] = core_pin

    # tool/family-specific overrides -- fixes for genuine incompatibilities
    # between individually-correct table pins (see TOOL_OVERRIDES in
    # pin_table.py for the full rationale on each one). Applied last so
    # they win over both the raw table pin and the mocha-runner tracking
    # above.
    for name, pin in TOOL_OVERRIDES.get(tool, {}).get(family, {}).items():
        if name in dd:
            dd[name] = pin

    pkg["devDependencies"] = dd
    return pkg, unavailable


def process_tool(tool):
    src_dir = os.path.join(ROOT, tool)
    for family in FAMILIES:
        dest_dir = os.path.join(src_dir, family)
        if os.path.isdir(dest_dir):
            shutil.rmtree(dest_dir)
        os.makedirs(dest_dir)

        # copy everything except package.json, README.md, and any
        # existing eslint config (handled specially below), and the
        # family subfolders themselves
        for entry in sorted(os.listdir(src_dir)):
            if entry in FAMILIES or entry in ("package.json", "README.md",
                                               "eslint.config.js", ".eslintrc.json"):
                continue
            s = os.path.join(src_dir, entry)
            d = os.path.join(dest_dir, entry)
            if os.path.isdir(s):
                shutil.copytree(s, d)
            else:
                shutil.copy2(s, d)

        # package.json
        pkg_path = os.path.join(src_dir, "package.json")
        unavailable = []
        if os.path.isfile(pkg_path):
            with open(pkg_path) as f:
                pkg = json.load(f)
            new_pkg, unavailable = rewrite_package_json(tool, family, pkg)
            with open(os.path.join(dest_dir, "package.json"), "w") as f:
                json.dump(new_pkg, f, indent=2)
                f.write("\n")

        # eslint config format per family
        if tool in ESLINT_TOOLS:
            major = ESLINT_MAJOR[family]
            if major >= 9:
                flat_src = os.path.join(src_dir, "eslint.config.js")
                if os.path.isfile(flat_src):
                    shutil.copy2(flat_src, os.path.join(dest_dir, "eslint.config.js"))
            else:
                with open(os.path.join(dest_dir, ".eslintrc.json"), "w") as f:
                    json.dump(LEGACY_ESLINTRC[tool], f, indent=2)
                    f.write("\n")

        # record what's unavailable on this family, for README generation later
        if unavailable:
            with open(os.path.join(dest_dir, ".UNAVAILABLE"), "w") as f:
                f.write("\n".join(unavailable) + "\n")

    return True


def main():
    all_tools = sorted(
        d for d in os.listdir(ROOT)
        if os.path.isdir(os.path.join(ROOT, d)) and not d.startswith("_")
    )
    versionable = [t for t in all_tools if t not in UNVERSIONED]
    print(f"{len(all_tools)} total tool folders, {len(UNVERSIONED)} unversioned, "
          f"{len(versionable)} to version")
    for t in versionable:
        process_tool(t)
        print(f"  done: {t}")


if __name__ == "__main__":
    main()
