#!/usr/bin/env python3
"""Write COMBOS.csv with unified javascript-combos branch URLs."""

from __future__ import annotations

from pathlib import Path

BUNDLERS = [
    "esbuild",
    "Vite (built as esbuild)",
    "Webpack",
    "Rollup",
    "Rspack",
    "Parcel",
    "Turbopack",
    "SWC",
]
PMS = ["npm", "yarn (Berry)", "pnpm", "bun"]
VERSIONS = [12, 14, 16, 18, 20, 21, 22, 24, 26]
REPO = "https://github.com/BENNYameen/javascript-combos"

# Status / SharePoint from the N20 tracker (others blank).
N20_STATUS = {
    2: ("completed", "CE-003"),
    4: ("completed", "CE-008"),
    6: ("completed", "CE-013"),
    7: ("completed", "CE-016"),
    8: ("completed", "CE-018"),
    9: ("completed", "CE-021"),
    11: ("completed", "CE-026"),
    12: ("in progress", ""),
}


def combo(combo_id: int) -> tuple[str, str, str]:
    idx = combo_id - 1
    bundler = BUNDLERS[idx // 8]
    pm = PMS[(idx % 8) // 2]
    arch = "Monolith" if idx % 2 == 0 else "Microservices"
    return bundler, pm, arch


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    rows = [
        "Branch ID,Node.js Version,Bundler,Package Manager,Architecture,Status,SharePoint Link,GitHub Link"
    ]
    for ver in VERSIONS:
        for combo_id in range(1, 65):
            branch = f"CE-N{ver}-{combo_id:03d}"
            bundler, pm, arch = combo(combo_id)
            status, sharepoint = ("", "")
            if ver == 20:
                status, sharepoint = N20_STATUS.get(combo_id, ("", ""))
            url = f"{REPO}/tree/{branch}"
            rows.append(
                ",".join(
                    [
                        branch,
                        str(ver),
                        f'"{bundler}"' if "," in bundler else bundler,
                        f'"{pm}"' if "," in pm or " " in pm else pm,
                        arch,
                        status,
                        sharepoint,
                        url,
                    ]
                )
            )
    out = root / "COMBOS.csv"
    out.write_text("\n".join(rows) + "\n", encoding="utf-8")
    print(f"wrote {out} ({len(rows) - 1} combos)")


if __name__ == "__main__":
    main()
