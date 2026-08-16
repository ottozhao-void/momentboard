#!/usr/bin/env python3
"""Import extracted results into the Momentboard data file.

Reads the benchmark-extractor summary CSV (paper, benchmark, model, value)
and appends rows to the "imported" array in js/data.js. Imported rows appear
on the corresponding benchmark page tagged as pending manual review — the
numbers still need a human to confirm the metric and the paper.

Usage:
    python3 tools/import_from_extractor.py \
        --csv ../benchmark-extractor/output/summary.csv
    python3 tools/import_from_extractor.py --csv X.csv --metric "r1@0.5"
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "js" / "data.js"

# benchmark display name / extractor alias -> leaderboard benchmark id
BENCHMARK_ALIASES = {
    "qvhighlights": "qvhighlights",
    "charades-sta": "charades-sta", "charades": "charades-sta",
    "activitynet-captions": "activitynet-captions",
    "activitynet": "activitynet-captions", "anet": "activitynet-captions",
    "tacos": "tacos",
    "ego4d-nlq": "ego4d-nlq", "ego4d": "ego4d-nlq",
}

IMPORTED_RE = re.compile(r'(\n\s*"imported":\s*)\[[^\]]*\](\s*\n\s*\}\s*;\s*)$', re.S)


def load_imported() -> list[dict]:
    text = DATA_FILE.read_text()
    m = re.search(r'"imported":\s*\[([^\]]*)\]', text, re.S)
    if not m:
        return []
    inner = m.group(1).strip()
    return json.loads(f"[{inner}]") if inner else []


def dump_imported(rows: list[dict]) -> None:
    text = DATA_FILE.read_text()
    payload = json.dumps(rows, indent=2, ensure_ascii=False)
    new_text, n = IMPORTED_RE.subn(f'\\1{payload}\\2', text)
    if n != 1:
        sys.exit(f"[!] could not locate the imported array in {DATA_FILE}")
    DATA_FILE.write_text(new_text)
    print(f"[+] wrote {len(rows)} imported rows to {DATA_FILE}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--csv", required=True, help="path to summary.csv from the extractor")
    ap.add_argument("--metric", default=None, help="metric id override (default: benchmark primary metric)")
    args = ap.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        sys.exit(f"[!] {csv_path} not found")

    rows = load_imported()
    seen = {(r["benchmark"], r["method"], r.get("source_paper", "")) for r in rows}
    added = 0
    skipped: list[str] = []

    with open(csv_path, newline="") as f:
        for rec in csv.DictReader(f):
            bench = BENCHMARK_ALIASES.get((rec.get("benchmark") or "").strip().lower())
            if not bench:
                skipped.append(rec.get("benchmark", "?"))
                continue
            method = (rec.get("model") or "").strip()
            try:
                value = round(float(rec["value"]), 2)
            except (TypeError, ValueError):
                skipped.append(f"{method} (non-numeric value)")
                continue
            source = (rec.get("paper") or "").strip()
            key = (bench, method, source)
            if key in seen:
                continue
            rows.append({
                "benchmark": bench,
                "method": method,
                "metric": args.metric or None,
                "value": value,
                "source_paper": source,
                "date": date.today().isoformat(),
            })
            seen.add(key)
            added += 1

    if added:
        dump_imported(rows)
    else:
        print("[i] nothing new to import")
    if skipped:
        print(f"[i] skipped {len(skipped)} rows (unknown benchmark / bad value): {sorted(set(skipped))[:8]}")


if __name__ == "__main__":
    main()
