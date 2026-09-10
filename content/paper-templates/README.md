# The Vriddhi Word template — papers that parse first time, without AI

`vriddhi-question-paper-template.docx` is a fill-in template whose layout the
**deterministic parser** (`functions/src/paperParsing.ts` → `deterministicParse`)
reads with no Gemini key, no cost and no cloud dependency. Follow the rules
below and a paper transcribes itself end-to-end: *upload → Parse file → add
questions → review → confirm*. Deviate and you fall back to AI (or manual
typing) — nothing breaks, you just lose the free ride.

The template ships as a tiny complete 4-question paper. Overwrite its lines
with your own; **keep the shapes**.

## The 10 rules (these are what "90% accuracy" means here)

1. **One question = one line**, starting with its number:
   `1. Which of the following is a current asset?`
2. **Marks in square brackets at the end** of the question line: `[1]`, `[10]`
   (also understood: `(2)`, `[4 marks]`, or a bare `[2]` on the next line).
3. **One option per line**, uppercase letters in order, starting at A:
   `A. Land` / `B. Inventory` / `C. Goodwill` / `D. Building`
   — two or more options ⇒ the question becomes an MCQ with exactly those
   options. Never put the correct answer or an answer key in the file (and
   never upload an answer-key page; the parser transcribes every numbered
   question it sees).
4. **Sections** start with a line like `SECTION B — Short Answer Questions [20 marks]`
   and may be followed by one instructions line. `PART C` also works.
5. **Shared marks** can be declared once per section instead of per question:
   `Answer ANY TWO questions. Each question carries 10 marks.`
6. **Header lines** are read into the paper meta:
   `Subject: Financial Accounting`, `Time: 60 Minutes` (or `Time: 3 Hours`),
   `Max. Marks: 50`. A line containing *pre-assessment / examination / test*
   becomes the title.
7. **Do NOT use Word's automatic numbered lists** (the "1." you see in a list
   style is not text in the file — the parser would see no question numbers).
   Turn off *File → Options → Proofing → AutoCorrect Options → AutoFormat As
   You Type → Automatic numbered list*, or press Ctrl+Z right after Word
   "helpfully" converts the line, or keep the typed "1." from the template.
8. **Do NOT put questions in tables or text boxes** — keep plain paragraphs
   (this is exactly why papers printed from fancy HTML layouts used to parse
   to 0 questions: cell order scrambled the lines).
9. **Images and equations do not survive** (no OCR — scanned images are Slice 2).
   Write maths as text: `Evaluate lim x→2 (x^2 - 4)/(x - 2).`
10. **Sub-parts stay on the question line**: `3. Write notes on: (a) GST (b) Depreciation. [4]`
    — `(a)`-style parts are deliberately *not* treated as MCQ options.

## Check before you upload (the accuracy guarantee)

Run the same parser the server uses — from the `functions/` folder:

```bash
npx tsx scripts/check-paper-layout.mjs ../path/to/your-paper.docx
```

`PASS` (with your expected question count) means *Parse file → add questions*
will work with no AI key. If it warns that numbered lines were not understood,
fix those lines (it counts them for you) and re-run. Exit codes: 0 pass,
1 would need AI/manual, 2 usage.

## Why this template, when the Question Bank already has an Excel import?

| | Question Bank Excel import | This Papers DOCX template |
| --- | --- | --- |
| What you get | standalone bank questions, tagged by topic | a **paper**: the print artefact (the file itself) + its sections/marks, plus bank docs on Confirm |
| Good for | building a reusable pool, then composing papers | "I already have this exact paper in Word — get it online in one pass" |
| Format | fixed columns per subject rows | fixed line layout, checked by the script above |

Both paths end in the same place: **nothing is published until you review and
Confirm**, and Confirm is the source of truth.
