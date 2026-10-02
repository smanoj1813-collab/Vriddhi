# Universal student-first Prep supplement

`functions/src/data/universalAcademicSupplement.ts` is a concept-first learning layer that supplements students' own course material. It is deliberately not mapped to a semester, university, examination scheme, or local syllabus.

## Included content

- **5 PrepStudio subjects, 14 worked topics, 14 practice MCQs**.
- A shared study toolkit for every Prep program: decode a prompt, write a complete answer, select a method, verify work, practise retrieval, and diagnose mistakes.
- Applied examples for Commerce, Management, Science/technology, and Arts/social inquiry.
- Every topic includes an intuitive explanation, a worked example, formulas or structured methods, a practical trick with its use case, and a step-by-step solving guide.
- Content is published in the free tier and uses stable `uac-*` identifiers.

The subject tags determine which program catalogs show the content; they do **not** claim that a university requires a particular topic. `universityRegion`, `syllabusRef`, semester, and year-group fields are intentionally absent.

## Seeding

The pack is included when seeding B.Com, BBA, B.Sc, BA, or M.Com. Superadmins can also select **Universal Student Learning (all programs)** to seed the complete cross-program pack directly. Use Prep Content Studio's seed controls; code changes alone do not write content into Firestore. Do not run a cloud seed until content review and release approval are complete.

## Editorial standard for future additions

1. Start with the idea in plain language, then introduce formal terms and advanced nuance.
2. Show a fully worked example and explain *why* each step is chosen.
3. Make tricks conditional: name when they work and where they fail.
4. Give a repeatable method students can apply to a changed question.
5. Ask a concept-check question with an explanation, not just an answer key.
6. Avoid fabricated university alignment, PYQ labels, guaranteed marks, or claims that one method fits every subject.
