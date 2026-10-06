# Cleanup script for JavaScript-Tools-Clean: removes stale flat-layout
# leftovers (the pre-family-split package.json/src/test/etc at each
# tool's own root) now that content lives in node12/14/20/24/26
# subfolders. Mirrors the same cleanup already run for Python-Tools-Clean.
#
# Run this from PowerShell on the machine holding the corpus.
# A -WhatIf dry run is included first -- inspect its output before
# uncommenting the real deletion loop below it.

$root = "C:\Users\Prajith K\Desktop\JavaScript Tools\JavaScript-Tools-Clean"

$tools = @(
    "CodeQL", "Dolos", "ESLint", "Lizard", "Mocha", "OpenGrep", "StrykerJS",
    "cccc", "debtmap", "eslint-plugin-security", "eslint-plugin-sonarjs",
    "gutcheck", "jscpd", "knip", "monocart-coverage-reports", "npm audit",
    "npm ls", "nyc", "oxlint", "trivy"
)

$keep = @("node12", "node14", "node20", "node24", "node26", "README.md")

# --- DRY RUN (safe to run as-is) ---
foreach ($t in $tools) {
    $toolPath = Join-Path $root $t
    Get-ChildItem -Path $toolPath -Force |
        Where-Object { $keep -notcontains $_.Name } |
        Remove-Item -Recurse -Force -WhatIf
}

# --- REAL DELETION (uncomment after checking the dry-run output above) ---
# foreach ($t in $tools) {
#     $toolPath = Join-Path $root $t
#     Get-ChildItem -Path $toolPath -Force |
#         Where-Object { $keep -notcontains $_.Name } |
#         Remove-Item -Recurse -Force
# }
