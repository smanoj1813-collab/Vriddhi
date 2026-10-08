#!/usr/bin/env python3
"""The Vriddhi investor deck, as content.

Single source of truth for `build_investor_deck.py` (PPTX + HTML + speaker notes)
and `build_investor_deck_pdf.py` (PDF). Every slide is a plain dict; every renderer
reads this list and nothing else.

    kind: title | stats | cards | flow | split | split2 | table | closing
    notes: the spoken script for that slide (written into the speaker notes)

Numbers are traceable to the repository — see docs/INVESTOR/. Placeholders that only
the founder can fill are written as <angle brackets>.
"""

SLIDES = [
    dict(
        kind="title",
        kicker="INVESTOR DECK · 2026",
        title="Vriddhi",
        sub="The AI-native academic operating system for Indian colleges",
        foot="Growth through knowledge  ·  Built in Karnataka  ·  <your name> · <email> · <phone>",
        notes=(
            "Open with the wedge, not the feature list: 'Vriddhi writes a college's question papers, runs "
            "the exam, grades it, and manages fees, attendance and results — in six Indian languages, for "
            "₹449 per student per year.' Then say the stage out loud in the first minute: product complete, "
            "pre-revenue, funding the first 25 colleges."
        ),
    ),
    dict(
        kind="stats",
        kicker="THE OPPORTUNITY",
        title="48,000 colleges are buying software this decade",
        sub="And they are already paying for far less than what we ship.",
        stats=[
            ("48,246", "colleges + 1,289 universities in India"),
            ("4.50 Cr", "students enrolled; GER 30 % and rising"),
            ("₹300–1,200", "already spent per student, per year, on ERP licences"),
            ("$4.48 B", "India online education in 2026 → $23.9 B by 2034"),
        ],
        bullets=[
            "NEP 2020 and NAAC turned digital evidence into a procurement requirement, not a preference.",
            "State portals (Karnataka's UUCMS) are mandatory for every student — and no mainstream ERP is built around them.",
            "Incumbent ERPs are 10–20 years old: no AI, English-only, 3–9 month deployments, per-student licences.",
        ],
        notes=(
            "Sources: AISHE 2026 (48,246 colleges, 4.50 crore students); university-ERP pricing benchmarks "
            "₹300–1,200/student/year; IMARC India online education 2026. Land the asymmetry: 'These colleges "
            "pay more per student for less software than most SaaS companies charge for an entire seat.'"
        ),
    ),
    dict(
        kind="cards",
        kicker="THE PROBLEM",
        title="A college runs on 9 disconnected tools — and one weekend-eating ritual",
        cards=[
            ("Fragmented records",
             "Attendance, fees, timetables and results live in separate spreadsheets. Every semester ends "
             "with manual re-entry and no single source of truth."),
            ("The exam-paper bottleneck",
             "Faculty hand-build a paper for every subject, every semester — then spend weekends marking "
             "scripts. Paper-making, not teaching, consumes the cycle."),
            ("Compliance by archaeology",
             "NAAC, the university and the state portal each demand evidence. Colleges reconstruct it from "
             "registers weeks after the fact."),
            ("Students get nothing back",
             "No app, no placements, no visibility. The institution's own data never reaches the learner "
             "who generated it."),
        ],
        notes=(
            "Tell one concrete story — the HOD who builds 14 papers in a fortnight — then name the cost: "
            "faculty hours, delayed results, and accreditation risk. Do not over-dwell: 90 seconds maximum."
        ),
    ),
    dict(
        kind="split",
        kicker="THE WEDGE",
        title="We get in through the exam paper, then own the semester",
        left_title="Why this door opens first",
        left=[
            "It is the most painful, most visible, most repeated task in the college — and nobody sells a complete answer to it.",
            "It produces an artefact the principal can hold: a print-ready paper in the university's format, with an approval trail.",
            "The question bank built here becomes the cold-start for attendance analytics, objective exams and grading.",
            "Faculty adopt it because the AI drafts and they decide — nothing is published without a human approval.",
        ],
        right_title="Land → expand → monetise",
        right=[
            ("Land", "Exam cycle: question bank, AI papers, online tests, auto-grading."),
            ("Expand", "Attendance, timetable, curriculum, fees, library, payroll, analytics."),
            ("Monetise", "Certificate programmes and placement prep sold to the same installed base."),
        ],
        notes=(
            "This is the slide that separates you from every 'we are an ERP' pitch. Say: 'Anyone can sell "
            "attendance. The exam paper is where the college feels pain every single week, and it is the "
            "only wedge that gives us their questions, their results and their learners in one move.'"
        ),
    ),
    dict(
        kind="stats",
        kicker="WHAT IS BUILT",
        title="Seven role portals. One product. Shipped.",
        sub="Not a prototype, not a mock-up — verified in the repository at commit 091c6d5.",
        stats=[
            ("7", "role portals: student, faculty, HOD, admin, office, superadmin, employee"),
            ("160", "backend functions (144 callable · 6 HTTP · 10 scheduled)"),
            ("257K", "lines of TypeScript · 1,827 lines of security rules"),
            ("1,540+", "automated tests green · 382 render-mount checks"),
        ],
        bullets=[
            "Academics: curriculum, syllabus parsing, auto faculty-mapping, clash-safe auto-timetable, attendance.",
            "Assessment: question bank, AI paper generation, secure online exams, AI + manual grading, transcripts.",
            "College operations: fees, challans, payments, library, inventory, procurement, payroll, no-dues.",
            "Learning: 4 certificate programmes, placement prep, coding lab, ATS resume builder.",
        ],
        notes=(
            "Say the number that matters to a technical partner: 'A team building this conventionally would "
            "have spent ₹75 lakh to ₹1 crore and 10–14 months. That is our sunk cost and our head start.' "
            "Then hand over the audit document if they want proof."
        ),
    ),
    dict(
        kind="flow",
        kicker="THE CORE",
        title="One assessment loop, closed — with a human on every decision",
        steps=[
            ("1 · Bank", "Curated + imported + AI-generated questions, tagged by topic and difficulty."),
            ("2 · Paper", "Blueprint by unit, marks and difficulty. AI drafts; faculty approve."),
            ("3 · Exam", "Online test with lockdown, section breaks, autosave and expiry recovery."),
            ("4 · Grade", "MCQ auto-grade; AI grading suggestions with confidence scores and rubrics."),
            ("5 · Record", "Grade records → transcripts; university result files imported back in."),
        ],
        bullets=[
            "No-AI fallback: a deterministic parser reads an uploaded DOCX/PDF paper with no API key at all.",
            "Multi-provider AI (Gemini / OpenAI / DeepSeek) behind one adapter, with tiers, daily caps, caching and per-college circuit breakers.",
            "Measured AI cost: ₹23 per student per year at base volume (₹46 budgeted with a 2× buffer).",
        ],
        notes=(
            "Pause after 'with a human on every decision' — it is the answer to the biggest AI objection "
            "from educators AND from investors. Have the ₹23/student AI cost ready to say unprompted; it "
            "proves you have engineering control over the biggest variable cost in the business."
        ),
    ),
    dict(
        kind="cards",
        kicker="INDIA-FIRST",
        title="Global software cannot be configured into an Indian college",
        cards=[
            ("Six languages, including AI output",
             "Kannada, Tamil, Telugu, Malayalam, Hindi, English — the interface AND generated questions, "
             "options and explanations in native Unicode script."),
            ("UUCMS integration",
             "Karnataka's mandatory state portal: candidate ID, USN capture, import matching, status sync "
             "and eligibility checks — the workflow every college performs by hand today."),
            ("Scheme packs as configuration",
             "BCU SEP-2024 and KUD NEP-CBAE presets plus per-college custom packs: marks split, internal "
             "assessment, attendance slabs, pass rules and grade tables drive the whole system."),
            ("Exam office, university-shaped",
             "Hall tickets with 75 % attendance blocking, room allotment, QR verification, result import "
             "for BCU-format files, marksheets and transcripts."),
        ],
        notes=(
            "Use the Kannada booklet in the room — a physical artefact in Kannada lands harder than any "
            "slice on a slide. Then state the rule: 'Compliance is data in our system, not code. A new "
            "university is a 2-day configuration, not a 2-month project.'"
        ),
    ),
    dict(
        kind="stats",
        kicker="THE ELEARNING ENGINE",
        title="The learning business is already built",
        sub="Institutions pay for software; learners pay for outcomes. We already have both in one product.",
        stats=[
            ("4", "certificate programmes: GenAI · Digital Marketing · Project Management · HR Analytics"),
            ("32/135", "modules / lessons authored to a validated, version-controlled format"),
            ("984", "quiz items + projects, capstones, rubrics and facilitator guides"),
            ("6", "Indian languages the same engine delivers in"),
        ],
        bullets=[
            "Public shareable catalog for lead generation; students enrol inside the app they already open for attendance and results.",
            "Also shipped: server-side coding lab, previous-year-paper corpus (English + Kannada), placement prep studio, ATS resume builder.",
            "Certificate issuance, progress sync per college, offline caching and quiz generation all reuse the assessment engine.",
        ],
        notes=(
            "This is the slide for the eLearning investor — see docs/INVESTOR/04_ELEARNING_INVESTOR_BRIEF.md. "
            "The line to say: 'Every edtech company in India is buying the distribution we already have. "
            "We are the only content seller whose learners are already logged in.'"
        ),
    ),
    dict(
        kind="table",
        kicker="WHY WE WIN",
        title="Where every other product stops",
        headers=["Capability", "Legacy ERP", "SIS + LMS", "AI paper tool", "Vriddhi"],
        widths=[5.55, 1.80, 1.80, 1.80, 1.75],
        rows=[
            ["AI question-paper generation with approval trail", "—", "—", "Yes", "Yes"],
            ["Reads an uploaded paper with no AI key (deterministic)", "—", "—", "Partial", "Yes"],
            ["Secure online exam: lockdown, autosave, auto-submit", "Partial", "Partial", "—", "Yes"],
            ["AI grading with confidence + rubric breakdown", "—", "—", "—", "Yes"],
            ["Grade records → transcripts + university result import", "Yes", "Yes", "—", "Yes"],
            ["Six Indian languages incl. native-script AI output", "—", "—", "Partial", "Yes"],
            ["State portal (UUCMS) + scheme packs as configuration", "—", "—", "—", "Yes"],
            ["Certificate programmes & placement prep included", "—", "Partial", "—", "Yes"],
            ["Price per student per year", "₹300–1,200", "₹300–1,200", "₹500/20 papers", "₹449 with content"],
        ],
        notes=(
            "Do not gloat. Read the table as a market observation: 'Legacy ERPs sell compliance paperwork; "
            "the AI tools sell a teacher a PDF with no campus data. Nobody joins the exam loop to the system "
            "of record. That junction is the company.'"
        ),
    ),
    dict(
        kind="cards",
        kicker="BUSINESS MODEL",
        title="Four revenue layers on one platform",
        cards=[
            ("L1 · Campus licence",
             "₹449 per student per year + ₹2.5 L onboarding. All modules, unlimited users, AI included. "
             "A 5,000-student college = ₹22.45 L per year."),
            ("L2 · Add-on packs",
             "₹40–120 per student per year each: Placement Pack (built), Coding Lab, Prep Studio, alerts, library "
             "automation, OBE/NAAC reporting."),
            ("L3 · Learning programmes",
             "₹999–2,999 per learner for certificate programmes, or ₹150–400 per student bundled through the "
             "college. Content cost is fixed; delivery is near-zero marginal cost."),
            ("L4 · Platform & services",
             "University dashboards, white-label delivery for content partners, corporate L&D and proctored "
             "hiring assessments: ₹5–25 L per year contracts."),
        ],
        notes=(
            "Make the layering explicit: 'Layer 1 gets us into the college. Layers 2 and 3 are sold to a "
            "buyer who already trusts us — our acquisition cost on expansion revenue is close to zero.' "
            "If asked why not per-student-only: because learning is priced per learner, not per enrolment."
        ),
    ),
    dict(
        kind="stats",
        kicker="UNIT ECONOMICS",
        title="A 5,000-student college costs ₹18,123 a year to run",
        sub="Fully serverless, Mumbai region, no idle servers. Cost model reproducible from the repository.",
        stats=[
            ("₹22.45 L", "revenue per 5,000-student college at ₹449/student/year"),
            ("₹18,123", "cloud infrastructure per year (₹27 K budgeted with buffer)"),
            ("₹1.16 L", "AI per year at base volume — ₹23 per student"),
            ("31–45 %", "gross margin with a shared team, and rising with every college added"),
        ],
        bullets=[
            "Margin is structural: colleges share one deployment and one fixed team cost; infrastructure is 0.08 % of revenue.",
            "Exam-day peaks are not a cost event: 1,000 simultaneous test starts ≈ ₹15 of usage, auto-scaled.",
            "Pricing floor measured, not guessed: ₹399 with a 3-year commitment, never below ₹349.",
        ],
        notes=(
            "This slide does the persuading for you. Let them do the mental maths out loud, then add the "
            "second-order point: 'Every new college improves gross margin, because the expensive part is "
            "already built and the marginal cloud cost rounds to zero.'"
        ),
    ),
    dict(
        kind="split2",
        kicker="TRACTION — STATED HONESTLY",
        title="What is proven today, and what this round proves next",
        left_title="Proven and verifiable now",
        left=[
            "Product complete end to end: ~1,540 tests green, tsc clean, 382 render checks, audited security rules.",
            "Content authored: 4 certificate programmes, ~2,000 curated MCQs, scheme packs, PYQ corpus, Kannada collateral.",
            "Cost model measured: ₹18 K/year infrastructure, ₹23/student/year AI, 31–45 % gross margin.",
            "Audits written and dated: health, costing, competitive analysis, demo playbook — the boring evidence of a profession.",
            "<colleges in pilot conversation> colleges in active conversation; <n> letters of intent signed.",
            "Raising ₹50 L to convert that interest into 5 paid pilots within 90 days.",
        ],
        right_title="Not yet — and this is the plan",
        right=[
            ("Paying colleges", "0 today → 5 paid pilots in 90 days → 25 colleges by month 18."),
            ("Learning revenue", "0 today → marketplace + certificates in 90 days → 1,000 paid learners."),
            ("Procurement gaps", "Live payment keys, WhatsApp/SMS alerts, parent portal, OBE/NAAC pack — Horizon 1."),
            ("Team", "<n> full-time today → +2 engineering, +2 sales/implementation, +1 content with this round."),
        ],
        notes=(
            "Say the gap first, without being asked: 'We have not yet collected a rupee. That is exactly "
            "what this round removes.' Investors forgive a stated gap; they never forgive discovering one. "
            "Fill the two <placeholders> in this slide before you present."
        ),
    ),
    dict(
        kind="cards",
        kicker="ROADMAP",
        title="Where the money goes, and what it buys",
        cards=[
            ("Horizon 1 · months 0–6 · funded by this round",
             "Fee collection live · WhatsApp/SMS alerts · parent portal · marksheets & transcripts · OBE/NAAC pack. "
             "Unlocks: every procurement checklist."),
            ("Horizon 2 · months 6–12 · started on this bridge",
             "Course marketplace · first Kannada programmes · corporate L&D · proctored assessment · placement "
             "pack v2. Unlocks: non-licence revenue at 85 %+ margin."),
            ("Horizon 3 · year 2–3 · seed round",
             "University deployments · second-state portal depth · verifiable credentials · proctoring · Gulf/SAARC. "
             "Unlocks: one signature, 30–100 colleges."),
        ],
        notes=(
            "Frame the ₹50 L against this: 'Horizon 1 is what the bridge pays for — it is the list of "
            "reasons a college says no today. Horizon 2 is not a new company: the delivery engine, the "
            "assessment engine and the distribution already exist, so the money buys content and a "
            "marketplace, not infrastructure.'"
        ),
    ),
    dict(
        kind="split",
        kicker="THE ELEARNING OPPORTUNITY",
        title="A second business, sitting inside the first",
        left_title="Why the learning layer compounds",
        left=[
            "India online education: $4.48 B in 2026 → $23.9 B by 2034 (23 % CAGR); higher education is the fastest-growing segment.",
            "India executive education and upskilling: $12.2 B with 22.7 M paid learners — and a 56.35 % employability rate demanding proof of skills.",
            "NEP 2020 lets colleges grant credit for external, outcome-mapped learning — a legislated reason to buy.",
            "Every edtech brand pays ₹1,500–4,000 to acquire a learner. Ours are already logged in, at zero media spend.",
        ],
        right_title="Three ways to monetise the same engine",
        right=[
            ("Campus bundles", "₹150–400 per student per programme — sold to a buyer already paying us."),
            ("Direct certification", "₹999–2,999 per learner, CAC target ₹400–900, 50,000 students reachable in 25 colleges."),
            ("Corporate & government", "₹1,500–6,000 per seat, or ₹5–25 L platform contracts, for proctored certification."),
        ],
        notes=(
            "For the eLearning investor, this IS the pitch: distribution + engine + content, with licence "
            "revenue paying the bills while the learning layer scales. Offer the two-way deal: their content "
            "library on our rails, or our certificates into their corporate base."
        ),
    ),
    dict(
        kind="cards",
        kicker="THE MOAT",
        title="Why this gets harder to displace every semester",
        cards=[
            ("Data gravity",
             "Questions, attendance, grade records and transcripts accumulate inside the platform. Switching "
             "means losing the audit trail accreditors ask for."),
            ("Content library",
             "4 programmes, ~2,000 curated MCQs, scheme packs and a PYQ corpus — 6–12 months of authored work "
             "that competitors must buy or build."),
            ("University configuration",
             "Every scheme pack and portal integration turns the next college under that university into a "
             "5-day onboarding, not a 5-week project."),
            ("AI cost engineering",
             "Caching, tiers, caps and a deterministic fallback keep AI at ₹23/student/year — a price war we "
             "win against anyone who bolted AI on."),
            ("Serverless economics",
             "₹18 K/year at 5,000 students, no on-premise, no idle servers — margin improves with every college."),
            ("Vernacular capability",
             "Six languages, authored in-script. Shipped as Kannada decks, booklets and question papers, not as "
             "a locale dropdown."),
        ],
        notes=(
            "Rank them out loud: 'Data gravity is the real one. Everything else shortens the sales cycle; "
            "data gravity is why a college that uses us for two semesters never leaves.'"
        ),
    ),
    dict(
        kind="split2",
        kicker="TEAM",
        title="Who is building this",
        left_title="Today",
        left=[
            "<Founder name> — <one line: what you did before, why you understand this problem>.",
            "<Co-founder / lead engineer> — <one line>.",
            "<Advisors: a principal, a university academic, a CA — anyone with standing>.",
            "Backed by an AI-assisted engineering process that produced 257 K lines with ~1,540 tests in <n> months.",
        ],
        right_title="Joining with this round",
        right=[
            ("Engineering", "2 full-stack engineers — Horizons 1 and 2 features."),
            ("Sales & implementation", "2 people to run the pilot machine and onboard colleges (target: 5 colleges per quarter)."),
            ("Content", "1 instructional designer + subject experts on contract for 10 more programmes."),
            ("Advisory", "A senior enterprise-SaaS mentor and a university-relations advisor."),
        ],
        notes=(
            "Investors bet on the person, not the product. Be specific about why YOU: your time inside a "
            "college, the years you spent watching this pain, and the fact that you built the thing alone. "
            "Never say 'we have no competition' or 'we just need funding to scale' in this section."
        ),
    ),
    dict(
        kind="cards",
        kicker="THE ASK",
        title="₹50 L for 8–10 % — and three specific introductions",
        cards=[
            ("Pilot colleges",
             "Warm introductions to principals and chairmen in Karnataka, then Maharashtra and Tamil Nadu. "
             "Three introductions are worth more than ₹10 L of marketing."),
            ("University relationships",
             "A conversation with a university's academic or examination wing to co-seed question banks and "
             "scheme packs — one win onboards 30–100 affiliated colleges."),
            ("Operating help",
             "A part-time enterprise-sales lead and a content partner for the certificate catalogue. "
             "Hiring is our real constraint, not capital."),
        ],
        bullets=[
            "Use of funds: 36 % engineering · 18 % implementation & pilots · 16 % content · 10 % sales · 8 % contingency · 6 % cloud/AI · 6 % legal.",
            "9-month milestones: 5 paid pilots by month 3 · 10 colleges live and ₹25–35 L ARR by month 9 · 8 certificate programmes · then the seed round.",
            "Governance we welcome: monthly metrics, a quarterly board review, and a named risk register reviewed every quarter.",
        ],
        notes=(
            "Ask for the specific things, not 'mentorship'. This is the ₹50 L bridge (Option A in "
            "docs/INVESTOR/03_EXPANSION_AND_USE_OF_FUNDS.md §6): 8–10 % on CCPS or a convertible note with a "
            "20 % discount and a valuation cap, 9 months of runway, and the milestones on this slide. Then stop "
            "talking and let them negotiate."
        ),
    ),
    dict(
        kind="stats",
        kicker="WHY NOW",
        title="Four windows are open at the same time",
        sub="This combination will not be open in 2028.",
        stats=[
            ("NEP + NAAC", "Outcome evidence is now a funding condition, not a nicety"),
            ("UUCMS", "Every Karnataka student is already inside a state portal — and no ERP connects to it"),
            ("AI economics", "Frontier-quality generation in Indic scripts at ₹23 per student per year"),
            ("ERP churn", "Colleges are replacing 10-year-old ERPs, not buying their first one"),
        ],
        bullets=[
            "The question is not whether Indian colleges will run on AI-native software — it is which vendor is already inside them when they decide.",
            "Our answer is distribution-first: land through the exam paper, expand to the campus, then sell the learning.",
        ],
        notes=(
            "Close the body of the pitch here. 'Why now' is the slide that turns a nice product into an "
            "investable moment: the policy push, the mandatory portal, and the collapse in AI cost all "
            "landed in the same 24 months."
        ),
    ),
    dict(
        kind="closing",
        kicker="",
        title="Let's grow together.",
        sub="Vriddhi (वृद्धि) — growth through knowledge.",
        lines=[
            "Pilot onboarding for the first cohort of colleges starts in 30 days.",
            "<your name> · <email> · <phone> · www.vriddhi.in",
        ],
        notes=(
            "End with a concrete next step and a date: 'I will send the pilot plan tonight and the first "
            "college's numbers in 30 days. If it works, I'd like you in the round.' Then ask for the "
            "introduction list before you leave the room — and put the follow-up meeting in the calendar."
        ),
    ),
]
