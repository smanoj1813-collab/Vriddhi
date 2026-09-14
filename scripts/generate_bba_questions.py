#!/usr/bin/env python3
"""Generate Vriddhi question-bank CSV from a subject's questions.json.

Usage:
    python3 scripts/generate_bba_questions.py <subject-folder>

Reads content/question-banks/bba/<subject>/questions.json and writes
questions.csv in the same folder using RFC-4180 quoting. All content is
kept comma-free so it also survives the app's naive "Paste CSV" parser.
"""
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BANK = ROOT / "content" / "question-banks" / "bba"

CSV_COLUMNS = [
    "text", "subject", "type", "difficulty", "unit", "marks", "options",
    "correctAnswer", "explanation", "tags", "batch", "branch",
    "isPYQ", "examYear", "examName",
]

# Types the app's file parser normalizes to QuestionType.
ALLOWED_TYPES = {
    "mcq", "true_false", "fill_in_blank", "short_answer",
    "long_answer", "numerical", "case_based",
}
ALLOWED_DIFF = {"easy", "medium", "hard"}

# Platform content is free and shared with all colleges. These ownership/access
# tags ride in the CSV `tags` column (the only tag carrier the bulk importer
# supports) so Vriddhi-authored questions stay distinguishable from
# college-authored ones. See docs/universal-question-bank-design.md §6.
PLATFORM_TAGS = ["vriddhi-curated", "free"]
PLATFORM_SOURCE = "platform"


def validate(q: dict, idx: int) -> list[str]:
    errs = []
    if not q.get("text"):
        errs.append(f"q{idx}: missing text")
    if q.get("type") not in ALLOWED_TYPES:
        errs.append(f"q{idx}: bad type {q.get('type')}")
    if q.get("difficulty") not in ALLOWED_DIFF:
        errs.append(f"q{idx}: bad difficulty {q.get('difficulty')}")
    t = q.get("type")
    opts = q.get("options") or []
    ans = q.get("correctAnswer") or ""
    if t in ("mcq", "true_false") and (len(opts) < 2 or not ans):
        errs.append(f"q{idx}: {t} needs options + correctAnswer")
    return errs


def to_row(q: dict) -> dict:
    opts = q.get("options") or []
    tags = list(q.get("tags") or [])
    for t in PLATFORM_TAGS:  # ensure origin/access tags are always present
        if t not in tags:
            tags.append(t)
    return {
        "text": q["text"],
        "subject": q.get("subject", ""),
        "type": q.get("type", "mcq"),
        "difficulty": q.get("difficulty", "medium"),
        "unit": str(q.get("unit", "")),
        "marks": str(q.get("marks", 1)),
        "options": "|".join(opts),
        "correctAnswer": q.get("correctAnswer", ""),
        "explanation": q.get("explanation", ""),
        # Pipe-separated tags: comma-free so the naive "Paste CSV" parser never
        # splits a row mid-field, while the file-upload parser (parseQuestionFile)
        # splits tags on | ; or , — so both paths stay intact.
        "tags": "|".join(tags),
        "batch": q.get("batch", "2026-27"),
        "branch": q.get("branch", "BBA"),
        "isPYQ": "true" if q.get("isPYQ") else "false",
        "examYear": q.get("examYear", ""),
        "examName": q.get("examName", ""),
    }


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: generate_bba_questions.py <subject-folder>", file=sys.stderr)
        return 2
    folder = BANK / sys.argv[1]
    src = folder / "questions.json"
    if not src.exists():
        print(f"missing {src}", file=sys.stderr)
        return 1

    data = json.loads(src.read_text(encoding="utf-8"))
    questions = data.get("questions", data if isinstance(data, list) else [])

    failures = []
    for i, q in enumerate(questions):
        failures += validate(q, i)
    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1

    out = folder / "questions.csv"
    with out.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        w.writeheader()
        for q in questions:
            w.writerow(to_row(q))

    print(f"wrote {out} ({len(questions)} questions)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
