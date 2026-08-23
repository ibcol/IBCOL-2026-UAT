#!/usr/bin/env python3
"""Inspect or preview homepage countdown targets from timeline.html.

The live site uses js/countdown.js, which reads timeline.html in the browser
and updates both the countdown label and timer automatically.
This script is optional — use it to list or verify which deadline is active.
"""

from __future__ import annotations

import argparse
import re
import sys
from datetime import datetime
from pathlib import Path

MONTHS = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
}

DEADLINE_ORDER = ("early-bird", "regular", "late-bird")

DEADLINE_PATTERN = re.compile(
    r"<li><strong>(\d{1,2})\s+(\w{3})</strong>\s*—\s*"
    r"(Early bird|Regular|Late bird)\s+registration deadline</li>",
    re.IGNORECASE,
)

YEAR_PATTERN = re.compile(r"\b(20\d{2})\b")

TARGET_SCRIPT_PATTERN = re.compile(
    r"<script src=\"js/countdown\.js\"></script>"
)


def infer_year(timeline_text: str) -> int:
    matches = YEAR_PATTERN.findall(timeline_text)
    if not matches:
        return datetime.now().year
    return int(max(matches, key=lambda y: matches.count(y)))


def parse_deadline(day: int, month_abbr: str, label: str, year: int) -> dict:
    month = MONTHS[month_abbr.lower()[:3]]
    key = label.lower().replace(" ", "-")
    date = datetime(year, month, day)
    title = f"{label.title()} Registration Deadline"
    return {
        "key": key,
        "label": label,
        "title": title,
        "date": date,
        "iso": date.strftime("%Y-%m-%d"),
    }


def load_deadlines(timeline_path: Path) -> list[dict]:
    text = timeline_path.read_text(encoding="utf-8")
    year = infer_year(text)
    deadlines = [
        parse_deadline(int(day), month, label, year)
        for day, month, label in DEADLINE_PATTERN.findall(text)
    ]
    if not deadlines:
        raise ValueError(f"No registration deadlines found in {timeline_path}")
    return sorted(deadlines, key=lambda item: item["date"])


def pick_deadline(deadlines: list[dict], forced: str | None, now: datetime | None = None) -> dict:
    if forced:
        forced_key = forced.lower()
        for item in deadlines:
            if item["key"] == forced_key:
                return item
        known = ", ".join(item["key"] for item in deadlines)
        raise ValueError(f"Unknown deadline {forced!r}. Expected one of: {known}")

    now = now or datetime.now()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    upcoming = [item for item in deadlines if item["date"] >= today]
    return upcoming[0] if upcoming else deadlines[-1]


def update_index(index_path: Path, deadline: dict, dry_run: bool = False) -> bool:
    text = index_path.read_text(encoding="utf-8")

    if not TARGET_SCRIPT_PATTERN.search(text):
        raise ValueError(
            f"{index_path} does not include js/countdown.js; "
            "countdown updates automatically in the browser."
        )

    print(f"Active deadline: {deadline['iso']} ({deadline['title']})")
    return False


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Preview active homepage countdown deadline from timeline.html.",
    )
    parser.add_argument(
        "repo",
        nargs="?",
        default=".",
        help="Path to site repo (default: current directory)",
    )
    parser.add_argument(
        "--deadline",
        choices=DEADLINE_ORDER,
        help="Force a specific registration window instead of the next upcoming one",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List deadlines found in timeline.html and exit",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the selected deadline without writing index.html",
    )
    args = parser.parse_args(argv)

    repo = Path(args.repo).resolve()
    timeline_path = repo / "timeline.html"
    index_path = repo / "index.html"

    if not timeline_path.is_file():
        parser.error(f"Missing timeline file: {timeline_path}")
    if not index_path.is_file():
        parser.error(f"Missing index file: {index_path}")

    deadlines = load_deadlines(timeline_path)

    if args.list:
        selected = pick_deadline(deadlines, args.deadline)
        for item in deadlines:
            marker = "  <- selected" if item["key"] == selected["key"] else ""
            print(f"{item['iso']}  {item['title']}{marker}")
        return 0

    selected = pick_deadline(deadlines, args.deadline)
    update_index(index_path, selected, dry_run=args.dry_run)
    if args.dry_run:
        print("Dry run — no files modified.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
