#!/usr/bin/env python3
"""Generates import-ready question-bank CSVs for the Vriddhi bulk import.

Usage:
    /home/user/.venv/bin/python data/question-bank/generate_seed.py
    /home/user/.venv/bin/python data/question-bank/generate_seed.py --tree

Outputs (in this directory):
    BCom_QuestionBank.csv   (262 questions)
    BA_QuestionBank.csv     (238 questions)
    BSc_QuestionBank.csv    (259 questions)
    All_QuestionBank.csv    (759 questions)

Each branch file carries two generations of questions:

  1. the original topic-level bank (bcom_questions.py / ba_questions.py /
     bsc_questions.py) — its rows get a sub-topic *backfilled* by matching the
     question text against the keywords declared in structure.py. A legacy row
     whose wording the sub-topic bank repeats is dropped (see
     rows_from_legacy) so the same question is never seeded twice;
  2. the sub-topic bank (subtopic_questions.py) — authored directly against the
     hierarchy in structure.py.

The CSV format matches the app's parsers (header driven in
questionFileParser.ts):
    text,subject,type,difficulty,unit,subtopic,marks,options,correctAnswer,explanation,tags,batch,branch,isPYQ,examYear,examName

IMPORTANT — the app's parsers split every line on a raw comma, so the data
modules must keep these invariants (validated below before writing):
    * no field may contain a comma or a double quote
    * MCQ text and options must not contain the pipe character
    * MCQ rows need 4 options and a correct letter A-D
    * one line per question (no embedded newlines)
    * every sub-topic must be declared in structure.py
"""
import hashlib
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from bcom_questions import B_COM  # noqa: E402
from ba_questions import BA  # noqa: E402
from bsc_questions import B_SC  # noqa: E402
from subtopic_questions import (  # noqa: E402
    B_COM_SUBTOPIC_QUESTIONS,
    BA_SUBTOPIC_QUESTIONS,
    B_SC_SUBTOPIC_QUESTIONS,
    PER_TOPIC,
)
import structure  # noqa: E402

BATCH = "2026-27"
HEADERS = [
    "text", "subject", "type", "difficulty", "unit", "subtopic", "marks",
    "options", "correctAnswer", "explanation", "tags", "batch", "branch",
    "isPYQ", "examYear", "examName",
]
VALID_TYPES = {
    "mcq", "true_false", "fill_in_blank", "short_answer", "long_answer",
    "matching", "assertion_reason", "case_based", "short", "long", "numerical",
}
VALID_DIFFICULTY = {"easy", "medium", "hard"}
LETTERS = "ABCD"


def tag_for(question):
    """Single word tag (no commas allowed by the naive CSV parser)."""
    return question["subject"].split()[0].lower().replace(" ", "")


# ─────────────────────────────────────────────────────────────────────────────
# Sub-topic backfill for the pre-sub-topic questions
# ─────────────────────────────────────────────────────────────────────────────

def backfill_subtopic(branch, question, problems, label):
    """Assign a declared sub-topic to a legacy question by keyword match.

    structure.py keeps a keyword list per sub-topic; the first sub-topic whose
    keywords appear in the question text wins. Keywords that never match are
    reported so the hierarchy cannot silently drift away from the data.
    """
    subject = question["subject"]
    topic = question["unit"]
    text = question["text"].lower()
    if subject not in structure.STRUCTURES[branch]:
        problems.append(f"{label}: subject {subject!r} not declared in structure.py")
        return ""
    if topic not in structure.STRUCTURES[branch][subject]:
        problems.append(f"{label}: topic {topic!r} not declared for {subject}")
        return ""

    best, best_hits = "", 0
    for name, keywords in structure.STRUCTURES[branch][subject][topic]:
        hits = sum(1 for kw in keywords if kw.lower() in text)
        if hits > best_hits:
            best, best_hits = name, hits
    if not best:
        problems.append(
            f"{label}: no sub-topic keyword matched {question['text'][:60]!r} "
            f"({subject} / {topic})"
        )
        return ""
    return best


# ─────────────────────────────────────────────────────────────────────────────
# MCQ option order
# ─────────────────────────────────────────────────────────────────────────────

def spread_mcq_key(question):
    """Rotate the MCQ options so correct answers are spread across A-D.

    The sub-topic bank was authored with every key in position A; a real paper
    never looks like that. The rotation is derived from a hash of the question
    text, so the CSVs are byte-identical between runs and the correct option
    always travels with the question.
    """
    options = list(question.get("options") or [])
    correct = question.get("correct")
    if question.get("type") != "mcq" or len(options) != 4 or correct not in LETTERS:
        return options, correct

    digest = hashlib.sha256(question["text"].encode("utf-8")).hexdigest()
    shift = int(digest[:8], 16) % 4
    if shift == 0:
        return options, correct

    index = LETTERS.index(correct)
    rotated = options[shift:] + options[:shift]
    new_index = (index - shift) % 4
    return rotated, LETTERS[new_index]


def to_row(question, branch, subtopic):
    options, correct = spread_mcq_key(question)
    row = {
        "text": question["text"],
        "subject": question["subject"],
        "type": question["type"],
        "difficulty": question["difficulty"],
        "unit": question["unit"],
        "subtopic": subtopic,
        "marks": str(question["marks"]),
        "options": "|".join(options),
        "correctAnswer": correct,
        "explanation": question.get("explanation", ""),
        "tags": tag_for(question),
        "batch": BATCH,
        "branch": branch,
        "isPYQ": "false",
        "examYear": "",
        "examName": "",
    }
    return row


def rows_from_legacy(branch, questions, problems, superseded):
    """The original topic-level bank with a backfilled sub-topic.

    `superseded` is the set of question texts that the sub-topic bank also
    carries. Those legacy rows are dropped: same wording, same subject and same
    topic means the same fingerprint in the seeder, so keeping both would either
    seed one question twice or silently discard a row. The sub-topic version
    wins because it additionally names the third tier of the hierarchy.
    """
    rows = []
    dropped = 0
    for i, question in enumerate(questions, 1):
        if question["text"].strip().lower() in superseded:
            dropped += 1
            continue
        subtopic = backfill_subtopic(branch, question, problems, f"{branch} legacy {i}")
        rows.append(to_row(question, branch, subtopic))
    if dropped:
        print(f"  legacy rows superseded by the sub-topic bank: {dropped}")
    return rows


def rows_from_subtopics(branch, tree, problems):
    """The sub-topic bank: subject → topic → sub-topic → questions."""
    rows = []
    counts = {}
    for subject, topics in tree.items():
        for topic, subtopics in topics.items():
            declared = structure.subtopics_for(branch, subject, topic) \
                if subject in structure.STRUCTURES[branch] \
                and topic in structure.STRUCTURES[branch][subject] else []
            if not declared:
                problems.append(f"{branch}: {subject} / {topic} not declared in structure.py")
                continue
            for subtopic, questions in subtopics.items():
                if subtopic not in declared:
                    problems.append(
                        f"{branch}: sub-topic {subtopic!r} not declared for {subject} / {topic} "
                        f"(declared: {declared})"
                    )
                    continue
                counts[(subject, topic)] = counts.get((subject, topic), 0) + len(questions)
                for question in questions:
                    enriched = dict(question)
                    enriched["subject"] = subject
                    enriched["unit"] = topic
                    rows.append(to_row(enriched, branch, subtopic))

    # Every declared sub-topic must receive questions, and every topic should
    # carry the agreed quota — otherwise a filter chip would open on an empty
    # drill-down.
    for subject, topic, subtopic in structure.all_subtopics(branch):
        covered = any(
            r["subject"] == subject and r["unit"] == topic and r["subtopic"] == subtopic
            for r in rows
        )
        if not covered:
            problems.append(f"{branch}: no new questions for sub-topic {subject} / {topic} / {subtopic}")
    for (subject, topic), total in counts.items():
        if total != PER_TOPIC:
            problems.append(
                f"{branch}: {subject} / {topic} has {total} new questions but PER_TOPIC is {PER_TOPIC}"
            )
    return rows


def validate(rows, label, check_duplicates=True):
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
        if not row["subtopic"].strip():
            problems.append(f"{label} row {i}: empty subtopic")
        if row["type"] == "mcq":
            opts = row["options"].split("|")
            if len(opts) != 4:
                problems.append(f"{label} row {i}: MCQ needs 4 options, has {len(opts)}")
            if row["correctAnswer"] not in LETTERS:
                problems.append(f"{label} row {i}: MCQ correctAnswer must be A-D")
        if row["type"] in ("short_answer", "long_answer") and not row["correctAnswer"].strip():
            problems.append(f"{label} row {i}: answer text required for {row['type']}")
        # true_false keys must be literal True/False — the app renders them as a
        # two-option choice and auto-grades on that key. A free-text key (e.g. a
        # sentence copied out of the options) can never be graded.
        if row["type"] == "true_false" and row["correctAnswer"].strip().lower() not in ("true", "false"):
            problems.append(
                f"{label} row {i}: true_false correctAnswer must be True or False, "
                f"got {row['correctAnswer'][:40]!r}"
            )
        if row["type"] == "numerical":
            try:
                float(str(row["correctAnswer"]).strip())
            except ValueError:
                problems.append(f"{label} row {i}: numerical correctAnswer must be a number")
    # Duplicate question text inside one branch would seed two identical rows.
    # Skipped for the combined file: the same wording taught in two branches
    # (B.Sc Physics and B.Sc Chemistry both need the first law) is intentional,
    # and the seeder fingerprints per branch anyway.
    if check_duplicates:
        seen = {}
        for i, row in enumerate(rows, 1):
            key = row["text"].strip().lower()
            if key in seen:
                problems.append(f"{label} row {i}: duplicate text (first at row {seen[key]}): {key[:60]}")
            else:
                seen[key] = i
    return problems


def write_csv(path, rows):
    lines = [",".join(HEADERS)]
    for row in rows:
        lines.append(",".join(row[h] for h in HEADERS))
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def print_tree(rows_by_branch):
    """Prints the subject -> topic -> sub-topic tree with question counts."""
    for branch, rows in rows_by_branch:
        print(f"\n{branch}")
        by_subject = {}
        for r in rows:
            by_subject.setdefault(r["subject"], {}).setdefault(r["unit"], {}).setdefault(
                r["subtopic"], []
            ).append(r)
        for subject in sorted(by_subject):
            topics = by_subject[subject]
            n = sum(len(q) for t in topics.values() for q in t.values())
            print(f"  {subject} ({n})")
            for topic in sorted(topics):
                subs = topics[topic]
                tn = sum(len(q) for q in subs.values())
                print(f"    {topic} ({tn})")
                for sub in sorted(subs):
                    qs = subs[sub]
                    kinds = {}
                    for q in qs:
                        kinds[q["type"]] = kinds.get(q["type"], 0) + 1
                    mix = " ".join(f"{k}={v}" for k, v in sorted(kinds.items()))
                    print(f"      - {sub} ({len(qs)}: {mix})")


def summarize(rows, label):
    subjects, units, subs, types = {}, {}, {}, {}
    for r in rows:
        subjects[r["subject"]] = subjects.get(r["subject"], 0) + 1
        units[r["unit"]] = units.get(r["unit"], 0) + 1
        subs[(r["subject"], r["unit"], r["subtopic"])] = \
            subs.get((r["subject"], r["unit"], r["subtopic"]), 0) + 1
        types[r["type"]] = types.get(r["type"], 0) + 1
    print(f"\n== {label}: {len(rows)} questions ==")
    for s, n in subjects.items():
        print(f"  {s}: {n}")
    print(f"  topics: {len(units)} | sub-topics: {len(subs)} | types: "
          + ", ".join(f"{k}={v}" for k, v in sorted(types.items())))


def main():
    tree_only = "--tree" in sys.argv[1:]
    all_problems = []
    sets = [
        ("B.Com", B_COM, B_COM_SUBTOPIC_QUESTIONS, "BCom_QuestionBank.csv"),
        ("BA", BA, BA_SUBTOPIC_QUESTIONS, "BA_QuestionBank.csv"),
        ("B.Sc", B_SC, B_SC_SUBTOPIC_QUESTIONS, "BSc_QuestionBank.csv"),
    ]
    all_rows = []
    branch_rows = []
    for branch, legacy, subtopic_tree, filename in sets:
        stats = structure.structure_stats(branch)
        problems = []
        print(f"\n{branch} structure: {stats['subjects']} subjects | {stats['topics']} topics "
              f"| {stats['subtopics']} sub-topics")
        sub_rows = rows_from_subtopics(branch, subtopic_tree, problems)
        superseded = {r["text"].strip().lower() for r in sub_rows}
        legacy_rows = rows_from_legacy(branch, legacy, problems, superseded)
        rows = legacy_rows + sub_rows
        all_problems += problems
        all_rows.extend(rows)
        summarize(rows, branch)
        branch_rows.append((branch, rows))
        all_problems += validate(rows, branch)
        write_csv(os.path.join(HERE, filename), rows)
        print(f"  wrote {filename} ({len(legacy_rows)} legacy + {len(sub_rows)} sub-topic)")

    all_problems += validate(all_rows, "All", check_duplicates=False)
    write_csv(os.path.join(HERE, "All_QuestionBank.csv"), all_rows)
    print(f"  wrote All_QuestionBank.csv ({len(all_rows)} questions)")

    if tree_only:
        print_tree(branch_rows)

    keys = {}
    for r in all_rows:
        if r["type"] == "mcq":
            keys[r["correctAnswer"]] = keys.get(r["correctAnswer"], 0) + 1
    print(f"\nMCQ answer keys across the bank: " + ", ".join(f"{k}={keys.get(k, 0)}" for k in LETTERS))

    if all_problems:
        print("\nVALIDATION FAILED:")
        for p in all_problems:
            print("  -", p)
        sys.exit(1)
    print("\nValidation OK: every row has a declared sub-topic, no commas or quotes, "
          "all MCQs have 4 options + A-D key, types/difficulties valid, no duplicates.")


if __name__ == "__main__":
    main()
