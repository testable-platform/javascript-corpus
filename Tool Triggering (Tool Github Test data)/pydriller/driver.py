#!/usr/bin/env python3
"""Mine this folder's own git history with pydriller and cross-check it
against reality. Deliberately scopes the pydriller traversal to commits
"since" a cutoff date that excludes part of the real history -- a genuine,
reproducible divergence between what pydriller reports and what `git log`
reports for the same repository, for the pydriller Invalid fixture.
"""
import subprocess
import sys

from pydriller import Repository

# Deliberately excludes the first two real commits (the invalid-corpus
# "majority wrong" scenario): pydriller is asked to mine only commits since
# 2026-01-04, while the expectations below are computed from the repo's
# full, true history.
SINCE_CUTOFF = "2026-01-04"


def real_commit_count():
    out = subprocess.run(
        ["git", "rev-list", "--count", "HEAD"],
        capture_output=True, text=True, check=True,
    )
    return int(out.stdout.strip())


def real_author_names():
    out = subprocess.run(
        ["git", "log", "--format=%an"],
        capture_output=True, text=True, check=True,
    )
    return set(out.stdout.strip().splitlines())


def main():
    expected_commits = real_commit_count()
    expected_authors = real_author_names()

    commits = list(Repository(".", since=__import__("datetime").datetime.fromisoformat(SINCE_CUTOFF)).traverse_commits())
    findings = []

    if len(commits) != expected_commits:
        findings.append(
            f"pydriller saw {len(commits)} commits (scoped since {SINCE_CUTOFF}), "
            f"git itself reports {expected_commits} commits total"
        )

    seen_authors = {c.author.name for c in commits}
    if seen_authors != expected_authors:
        findings.append(
            f"pydriller saw authors {sorted(seen_authors)}, "
            f"git itself reports {sorted(expected_authors)}"
        )

    if findings:
        print("FINDINGS:\n  " + "\n  ".join(findings), file=sys.stderr)
        return 1

    print(
        f"CLEAN: pydriller's mined history matches git exactly -- "
        f"{len(commits)} commits, {len(seen_authors)} authors"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
