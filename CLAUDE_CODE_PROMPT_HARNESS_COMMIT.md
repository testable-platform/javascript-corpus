# Prompt for Claude Code — commit and push the `tools/` harness rebuild

Paste everything in the fenced block below into Claude Code, run from the
`javascript corpus` root directory (the folder containing `main/` and all
576 `JS_V*` branch worktree directories side by side).

```
A Cowork session has rebuilt this corpus's tool-triggering harness so it
matches the quality of the sibling Python/C#/Java/TypeScript corpora —
every one of the 576 JS_V* branches now has a full tools/ directory (21
per-tool subfolders with trigger.yaml + a real runner script), a
Makefile, tools/tool_integration.js, tools/full_check.js, a richer
dataset.json, and a much richer README. main/generator/gen_js_corpus.py
was rewritten to produce all of this, and
main/javascript-repos-build-contract.md was updated with the full
rationale, what changed, and what's still open. None of this has been
committed or pushed yet — that's your job.

This session's own device bridge could not run any git commands against
these worktrees at all (each branch's .git file points at the real bare
repo via a Windows-style absolute path the bridge's Linux VM can't
resolve), so everything below needs to happen from you, with real git
access on this machine.

Do this in order:

1. From the main worktree, commit the generator and doc changes:
     cd "main"
     git add generator/gen_js_corpus.py javascript-repos-build-contract.md
     git status   # confirm nothing else is staged that shouldn't be
     git commit -m "Rebuild tools/ harness generator to match sibling corpora"
     cd ..

2. For every one of the 576 JS_V* branch worktree directories, commit the
   newly generated tools/ harness, Makefile, and updated dataset.json/
   README/package.json. A loop like this (adjust for your actual shell):

     for d in JS_V*/ ; do
       b="${d%/}"
       (cd "$b" && git add -A && git status --porcelain | grep -q . && \
        git commit -m "Add tools/ harness (trigger.yaml + runners + tool_integration.js + full_check.js + Makefile), richer dataset.json/README" || echo "no changes: $b")
     done

   Before committing each branch, sanity-check it (this has already been
   verified once from the Cowork session, but re-verify since you have
   real git/node access this session's bridge didn't):
     node tools/tool_integration.js --verify   # expect: 21 tools wired, every manifest and entrypoint present
     node tools/full_check.js                  # expect: 6 cross-file consistency checks passed
   If either fails on any branch, stop and report which branch and what
   failed rather than committing broken state.

3. Push everything:
     git push origin main
     # then push every JS_V* branch — batch this however is fastest for
     # your shell/git version, e.g.:
     for d in JS_V*/ ; do
       b="${d%/}"
       (cd "$b" && git push origin "$b")
     done

4. Verify the remote:
     git branch -a | grep -c '^..JS_V'   # expect 576
   Spot-check 2-3 branches on GitHub directly (open the repo, pick a
   branch, confirm the tools/ folder with ~21 subfolders is now visible,
   the README renders with the new "Supported tools" tables, and a
   Makefile is present at the root).

5. Report back: how many branches committed cleanly, how many had
   nothing to commit (shouldn't be any, but say so if so), whether any
   --verify/full_check failed and on which branch, and the final pushed
   branch count.

One thing NOT to do as part of this: don't attempt to "fix" the
`measured: false` tools' status yourself by guessing — those are
honestly labeled as not-yet-individually-invoke-verified on purpose (see
javascript-repos-build-contract.md's "Tool harness rebuild" section for
the full reasoning). If you want to extend real per-family verification
of the newly wired tools the way you did for eslint/oxlint/jscpd/stryker/
eslint-scope/nyc, that's valuable follow-up work, but it's separate from
this commit-and-push task and should be reported separately, family by
family, the same way your original nine-family sweep was.
```
