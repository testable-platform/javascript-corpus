# Prompt for Claude Code — finish the `javascript-combos` corpus

Paste everything in the fenced block below into Claude Code, run from the
`javascript corpus/main` directory (or point `--add-dir` at the corpus root
so it can see all 576 worktree directories next to `main/`).

```
You are finishing a JavaScript white-box test-repo corpus. The scaffolding
(real application code, real tool configs, dataset.json answer keys) has
already been generated for all 576 branches by
main/generator/gen_js_corpus.py — 9 Node.js version families (12, 14, 16,
18, 20, 21, 22, 24, 26) x 8 bundlers x 4 package managers x 2 architectures
= 576 branches, each its own git worktree directory next to this one
(still under their old CE-N{version}-{id} names; branch_rename_map.csv +
rename_branches.sh in this directory rename them to the final
JS_V{version}_{BUNDLER}_{PM}_{ARCH} scheme once you're done verifying —
do not run that rename until the last step below).

Your job is everything the scaffolding step could not do without a real
machine: install pnpm and bun (only npm/yarn are currently available),
then do real package-manager installs, real per-Node-version test runs,
and live verification of the resolved tool-pin table, for every branch.

Work family by family (start with Node 12, the floor family, then work
up), and report after each family rather than pushing through all nine
silently. Report honestly — if something doesn't install, doesn't run,
or a pin was wrong once actually tried, say so plainly. This corpus is a
test fixture whose entire value is that its claims about tool support are
verified, not asserted, so a real, diagnosed failure is a more valuable
outcome than a false "it works."

Step 0 (once, before any family): install pnpm and bun so all 4 package
managers are available (npm and yarn already are).

For EACH Node family:

1. Install and switch to that exact Node version via nvm/fnm (the exact
   patch is in that family's .nvmrc). Confirm with `node -v`.

2. Full sweep, all 64 branches, no shortcuts — this is where real
   per-branch variance lives (different lockfiles, different
   bundler/package-manager/architecture interactions):
   - cd into each branch's worktree directory (still CE-N{version}-001
     through -064; branch_rename_map.csv maps each to its real combo).
   - Real install with that branch's actual package manager (check
     package.json's `packageManager` field; no field means npm). Let it
     produce a real lockfile. Record any install failure verbatim —
     don't skip it — since an npm-registry-resolvable version that
     fails to actually install is itself a real finding.
   - Run the test script and the build script. Record pass/fail for
     each, with the actual error on failure.

3. For lint / lint:oxlint / coverage / duplication / dataflow / mutation:
   these check whether a *tool* runs on a given Node+tool-version
   combination, which in principle shouldn't depend on architecture
   (Monolith vs Microservices) — but don't assume that, verify it once:
   - On Node 12 ONLY: run all six checks on all 64 branches, then compare
     each Monolith/Microservices pair for the same bundler+package-manager
     combo. If every pair agrees (same pass/fail, same tools invoke
     cleanly), architecture is confirmed inert for these six checks —
     report this clearly as a finding, citing the pairs you compared.
   - If N12 confirms parity: for Node 14 onward, run these six checks on
     only one architecture per bundler+package-manager combo (32 runs
     instead of 64 per family) — but still run install+test+build on all
     64 as in step 2. Say explicitly in your per-family report that you
     are relying on the N12 parity finding, so it's a stated assumption,
     not a silent shortcut.
   - If N12 finds even one pair that disagrees: architecture is NOT
     inert — run all six checks on all 64 branches for every remaining
     family, and report which architecture-specific interaction caused
     the disagreement.

4. While doing this, verify and report:
   - The bundled npm version for this family (`npm -v` right after
     `nvm use`) — cross-check against the "Bundled npm per family" table
     in javascript-repos-build-contract.md (in the Testable (Tools)
     Claude Project). Node 20's value there was never live-verified
     before (the family had no real install until this rebuild) —
     confirm or correct it.
   - Whether every non-null pin in that family's tool-pin table actually
     installs cleanly at the recorded version. Flag any mismatch (npm
     registry says it's engines.node-compatible but it doesn't actually
     install, or a peer-dependency conflict silently forces a different
     version than the one pinned in package.json).
   - Any tool that's wired into package.json but fails to even invoke on
     this Node version — that's a real finding, not something to paper
     over. Diagnose it (root cause, not just "it failed") before moving
     on, the same way you'd diagnose any other real bug.

5. After finishing a family: tell me how many of the 64 branches
   installed clean, how many tests/builds passed and why any didn't, the
   result of the architecture-parity check (N12) or which shortcut you
   applied because of it (N14+), and any pin that turned out wrong once
   actually tried. Then move to the next family without waiting for me
   to say "go," unless you hit something needing a real judgment call
   (e.g. a pin that's simply uninstallable and needs a real replacement).

6. Node 20 had ZERO real content before this rebuild (it was empty
   placeholders) — treat it with extra scrutiny, don't assume it behaves
   like the other eight families just because the generator produced
   files for it the same way.

7. Only after all 9 families are verified: run
   `./rename_branches.sh branch_rename_map.csv` (dry-run, no --apply)
   from inside main/, review the printed plan, then re-run with --apply.
   This renames each branch, moves its worktree directory, and
   pushes-new/deletes-old on origin. Verify with:
     git branch -a | grep -c '^..JS_V'   # expect 576
     git branch -a | grep '^..CE-N'      # expect nothing left

8. Finally, from the main worktree: commit the generator and its
   supporting files (COMBOS.csv, branch_rename_map.csv, README.md), push
   main, and confirm the remote has exactly 576 JS_V* branches. Report
   the final branch count and repo URL back to me.
```
