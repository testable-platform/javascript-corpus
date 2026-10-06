#!/usr/bin/env python3
"""Verify cccc's own XML report says this C source is clean.

Run after `cccc src/*.c` has produced `.cccc/cccc.xml`. Exits 1 (FINDINGS)
if any line was rejected (unparseable) or a module's McCabe cyclomatic
complexity exceeds the threshold below -- the same "measured, not
asserted" contract the rest of this corpus uses.
"""
import re
import sys

CCN_THRESHOLD = 10

def main():
    try:
        xml = open(".cccc/cccc.xml", encoding="utf-8").read()
    except FileNotFoundError:
        print("no .cccc/cccc.xml -- run cccc first", file=sys.stderr)
        return 1

    rejected = int(re.search(r'rejected_lines_of_code value="(\d+)"', xml).group(1))
    if rejected != 0:
        print(f"FINDINGS: {rejected} rejected (unparseable) line(s)", file=sys.stderr)
        return 1

    findings = []
    for m in re.finditer(
        r'<module>\s*<name>([^<]*)</name>\s*<lines_of_code[^/]*/>\s*'
        r'<McCabes_cyclomatic_complexity value="(\d+)"',
        xml,
    ):
        name, ccn = m.group(1), int(m.group(2))
        if ccn > CCN_THRESHOLD:
            findings.append(f"{name}: CCN {ccn} > {CCN_THRESHOLD}")

    if findings:
        print("FINDINGS:\n  " + "\n  ".join(findings), file=sys.stderr)
        return 1

    print("CLEAN: 0 rejected lines, every module's CCN <= "
          f"{CCN_THRESHOLD}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
