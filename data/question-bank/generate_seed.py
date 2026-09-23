#!/usr/bin/env python3
"""Generates import-ready question-bank CSVs for the Vriddhi bulk import.

Usage:
    /home/user/.venv/bin/python data/question-bank/generate_seed.py

Outputs (in this directory):
    BCom_QuestionBank.csv   (80 questions)
    BA_QuestionBank.csv     (80 questions)
    BSc_QuestionBank.csv    (80 questions)
    All_QuestionBank.csv    (240 questions)

The CSV format matches the app's BulkImportModal parser exactly:
    text,subject,type,difficulty,unit,marks,options,correctAnswer,explanation,tags,batch,branch,isPYQ,examYear,examName

IMPORTANT — the app's parser splits every line on a raw comma, so the data
modules must keep these invariants (validated below before writing):
    * no field may contain a comma or a double quote
    * MCQ text and options must not contain the pipe character
    * MCQ rows need 4 options and a correct letter A-D
    * one line per question (no embedded newlines)
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from bcom_questions import B_COM  # noqa: E402
from ba_questions import BA  # noqa: E402
from bsc_questions import B_SC  # noqa: E402

BATCH = "2026-27"
HEADERS = [
    "text", "subject", "type", "difficulty", "unit", "marks", "options",
    "correctAnswer", "explanation", "tags", "batch", "branch", "isPYQ",
    "examYear", "examName",
]
VALID_TYPES = {
    "mcq", "true_false", "fill_in_blank", "short_answer", "long_answer",
    "matching", "assertion_reason", "case_based", "short", "long", "numerical",
}
VALID_DIFFICULTY = {"easy", "medium", "hard"}


def tag_for(question):
    """Single word tag (no commas allowed by the naive CSV parser)."""
    return question["subject"].split()[0].lower().replace(" ", "")


def to_row(question, branch):
    options = question.get("options") or []
    row = {
        "text": question["text"],
        "subject": question["subject"],
        "type": question["type"],
        "difficulty": question["difficulty"],
        "unit": question["unit"],
        "marks": str(question["marks"]),
        "options": "|".join(options),
        "correctAnswer": question["correct"],
        "explanation": question.get("explanation", ""),
        "tags": tag_for(question),
        "batch": BATCH,
        "branch": branch,
        "isPYQ": "false",
        "examYear": "",
        "examName": "",
    }
    return row


def validate(rows, label):
    problems = []
    for i, row in enumerate(rows, 1):
        for field in HEADERS:
            val = str(row.get(field, ""))
            if field == "options":
                if "," in val or '"' in val:
                    problems.append(f"{label} row {i}: comma/quote in options")
                for opt in val.split("|"):
                    if '"' in opt:
                        problems.append(f"{label} row {i}: quote in an option")
            else:
                if "," in val:
                    problems.append(f"{label} row {i}: comma in {field!r}: {val[:60]}")
                if '"' in val:
                    problems.append(f"{label} row {i}: double quote in {field!r}")
                if "\n" in val:
                    problems.append(f"{label} row {i}: newline in {field!r}")
        if row["type"] not in VALID_TYPES:
            problems.append(f"{label} row {i}: invalid type {row['type']}")
        if row["difficulty"] not in VALID_DIFFICULTY:
            problems.append(f"{label} row {i}: invalid difficulty {row['difficulty']}")
        if not row["text"].strip():
            problems.append(f"{label} row {i}: empty question text")
        if not row["subject"].strip():
            problems.append(f"{label} row {i}: empty subject")
        if row["type"] == "mcq":
            opts = row["options"].split("|")
            if len(opts) != 4:
                problems.append(f"{label} row {i}: MCQ needs 4 options, has {len(opts)}")
            if row["correctAnswer"] not in ("A", "B", "C", "D"):
                problems.append(f"{label} row {i}: MCQ correctAnswer must be A-D")
            if not row["correctAnswer"]:
                problems.append(f"{label} row {i}: MCQ missing correctAnswer")
        if row["type"] in ("short_answer", "long_answer") and not row["correctAnswer"].strip():
            problems.append(f"{label} row {i}: answer text required for {row['type']}")
    return problems


def write_csv(path, rows):
    lines = [",".join(HEADERS)]
    for row in rows:
        lines.append(",".join(row[h] for h in HEADERS))
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def summarize(rows, label):
    subjects, units = {}, {}
    types = {}
    for r in rows:
        subjects[r["subject"]] = subjects.get(r["subject"], 0) + 1
        units[r["unit"]] = units.get(r["unit"], 0) + 1
        types[r["type"]] = types.get(r["type"], 0) + 1
    print(f"\n== {label}: {len(rows)} questions ==")
    for s, n in subjects.items():
        print(f"  {s}: {n}")
    print(f"  topics: {len(units)} | types: " + ", ".join(f"{k}={v}" for k, v in sorted(types.items())))


def main():
    all_problems = []
    sets = [
        ("B.Com", B_COM, "BCom_QuestionBank.csv"),
        ("BA", BA, "BA_QuestionBank.csv"),
        ("B.Sc", B_SC, "BSc_QuestionBank.csv"),
    ]
    all_rows = []
    for branch, questions, filename in sets:
        rows = [to_row(q, branch) for q in questions]
        all_rows.extend(rows)
        summarize(rows, branch)
        all_problems += validate(rows, branch)
        write_csv(os.path.join(HERE, filename), rows)
        print(f"  wrote {filename}")

    all_problems += validate(all_rows, "All")
    write_csv(os.path.join(HERE, "All_QuestionBank.csv"), all_rows)
    print(f"  wrote All_QuestionBank.csv")

    if all_problems:
        print("\nVALIDATION FAILED:")
        for p in all_problems:
            print("  -", p)
        sys.exit(1)
    print("\nValidation OK: no commas, no quotes, all MCQs have 4 options + A-D key, types/difficulties valid.")


if __name__ == "__main__":
    main()
