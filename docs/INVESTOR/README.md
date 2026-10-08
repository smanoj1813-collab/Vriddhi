# Vriddhi — Investor pack

Everything you need to raise money, in the order you will actually use it.

| # | Document | Use it when |
| --- | --- | --- |
| 0 | **This file** | Before any meeting — the 10 numbers and 5 assets you must be able to say out loud |
| 1 | [`01_PROJECT_OVERVIEW.md`](01_PROJECT_OVERVIEW.md) | "Show me what you have built" / technical due diligence / you need the facts sheet |
| 2 | [`02_DIFFERENTIATION.md`](02_DIFFERENTIATION.md) | "How are you different from Camu / MasterSoft / Fedena / an LMS?" |
| 3 | [`03_EXPANSION_AND_USE_OF_FUNDS.md`](03_EXPANSION_AND_USE_OF_FUNDS.md) | "What will you do with the money, and what's the plan?" |
| 4 | [`04_ELEARNING_INVESTOR_BRIEF.md`](04_ELEARNING_INVESTOR_BRIEF.md) | The person who is interested in **eLearning** — this one is written for them |
| 5 | [`05_INVESTOR_IMPRESSION_PLAYBOOK.md`](05_INVESTOR_IMPRESSION_PLAYBOOK.md) | Rehearsal, the demo, objections, follow-up emails, monthly updates |
| — | `../../marketing/Vriddhi_Investor_Deck.pptx` | The deck you present / send |
| — | `../../marketing/Vriddhi_Investor_Deck.pdf` | The same deck as a vector PDF (email, print, screen share) |
| — | `../../marketing/investor-deck.html` | Same deck in a browser (arrow keys to navigate, `Ctrl+P` → PDF) |
| — | `../../marketing/Vriddhi_Investor_Deck_Speaker_Notes.md` | Your script, slide by slide |

---

## The 10 numbers to memorise

Every one of these is verifiable in this repository — nothing is projected.

| # | Fact | Number |
| --- | --- | --- |
| 1 | Market: colleges in India | **48,246** registered colleges, 1,289 universities, **4.50 crore** students (AISHE) |
| 2 | What they already pay for this | **₹300–1,200 / student / year** for university ERP licences |
| 3 | Product scope | **7 role portals · ~160 routes · 144 callable + 6 HTTP + 10 scheduled functions** |
| 4 | Code written | **~257,000 lines** of TypeScript (frontend 182K / backend 75K) |
| 5 | Tests | **~1,540 unit tests + 382 render mounts**, all green; 1,827 lines of Firestore rules |
| 6 | Build cost already sunk | **₹30–40 L** lean / **₹1–1.2 Cr** replacement value |
| 7 | Infra cost at 5,000 students | **₹18,123 / year** (serverless, Mumbai region) |
| 8 | AI cost per student per year | **₹23** base (question papers, grading, study packs, chat) |
| 9 | Price | **₹449 / student / year** → ₹22.45 L for a 5,000-student college, **31–45 % gross margin** |
| 10 | Content already authored | **984 quiz items in 4 certificate programmes**, ~2,000 curated MCQs, PYQ corpus pipeline |

## The 5 assets an investor is actually buying

1. **A working platform, not a prototype.** The full loop — curriculum → question bank → AI paper →
   secure online exam → auto-grade → transcript → fees → analytics — is built, tested and deployed
   as one serverless product.
2. **AI-native assessment.** Multi-provider LLM layer (Gemini / OpenAI / DeepSeek) with a
   deterministic fallback that needs **no AI key at all**, human-in-the-loop approval, and
   per-feature cost guards.
3. **India-first depth nobody else ships.** Six languages with native-script AI output, Karnataka
   UUCMS integration, BCU/KUD/NEP scheme packs as configuration, exam-eligibility rules encoded.
4. **The eLearning engine, already built.** A course-pack format (4 certificate programmes, 32
   modules, 135 lessons, 984 items), a public shareable catalog, progress sync per college, coding
   lab, placement prep studio and an ATS resume builder — delivery infrastructure that most
   content sellers pay millions to build.
5. **Distribution-shaped economics.** Multi-tenant SaaS with per-college isolation, subscription
   billing, access products with expiry/renewal windows, and ₹18 K/year of infrastructure for a
   5,000-student campus — gross margins that improve with every college added.

## The 5 numbers YOU must fill in before the first meeting

Do not improvise these; write them down and carry them in the deck's appendix.

1. **How many colleges have signed a paid pilot or LOI** (names + student counts).
2. **Paying students / ARR today** (even if it is ₹0 — say "pre-revenue, 2 pilots signed").
3. **Pipeline** — colleges in conversation, expected close, average deal size.
4. **Team** — who is full-time, what they did before, whether they are paid.
5. **The round** — amount, instrument (CCPS / SAFE / convertible note), and use of funds. The
   scenarios in `03_EXPANSION_AND_USE_OF_FUNDS.md` §6 give you three ready-made versions.

> **Honesty rule.** Every claim in these documents is traceable to code, tests or a dated audit
> in `docs/`. If a feature is partial, the documents say so. Investors forgive gaps; they do not
> forgive discovering one in the room.
