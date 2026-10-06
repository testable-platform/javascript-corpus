#!/usr/bin/env python3
"""Mine this folder's own git history with pydriller and check it against
reality, rather than asserting a fixed number that could drift out of sync
with the repo. Exits 1 (FINDINGS) if anything measured disagrees with what
the repo itself says.
"""
import subprocess
import sys

from pydriller import Repository


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

    commits = list(Repository(".").traverse_commits())
    findings = []

    if len(commits) != expected_commits:
        findings.append(
            f"pydriller saw {len(commits)} commits, "
            f"git itself reports {expected_commits}"
        )

    seen_authors = {c.author.name for c in commits}
    if seen_authors != expected_authors:
        findings.append(
            f"pydriller saw authors {sorted(seen_authors)}, "
            f"git itself reports {sorted(expected_authors)}"
        )

    touched_files = set()
    for commit in commits:
        for f in commit.modified_files:
            path = f.new_path or f.old_path
            if path:
                touched_files.add(path)

    expected_files = {"package.json", "README.md", "src/chronicle.js", "test/chronicle.test.js"}
    if touched_files != expected_files:
        findings.append(
            f"pydriller saw files {sorted(touched_files)}, "
            f"expected {sorted(expected_files)}"
        )

    if findings:
        print("FINDINGS:\n  " + "\n  ".join(findings), file=sys.stderr)
        return 1

    print(
        f"CLEAN: pydriller's mined history matches git exactly -- "
        f"{len(commits)} commits, {len(seen_authors)} authors, "
        f"{len(touched_files)} files touched"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
