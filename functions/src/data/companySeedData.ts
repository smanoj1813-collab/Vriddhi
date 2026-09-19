// functions/src/data/companySeedData.ts
//
// Company-specific placement prep. Each record describes one recruiter's
// fresher assessment and maps every section onto the shared aptitude topics
// (qa-* / lr-* / va-*) so the company page is a lens over content that already
// exists rather than a second copy of it.
//
// Patterns change every season. Every record carries `patternVerifiedOn` and
// public `sources`; the UI shows the date so learners know how fresh it is.
// Numbers are the commonly reported 2026-season pattern, phrased as "typical",
// never as a guarantee. All prose is original Vriddhi content.

import type { PrepCompany } from '../prepShared'

const VERIFIED = '2026-09-19'

// ── Reusable topic groups (most-frequent first) ─────────────────────────────

const QA_CORE = [
  'qa-percentages',
  'qa-profit-loss-discount',
  'qa-ratio-proportion-partnership',
  'qa-averages',
  'qa-time-work',
  'qa-speed-time-distance',
  'qa-simple-compound-interest',
  'qa-number-system',
  'qa-hcf-lcm',
  'qa-mixtures-alligation',
  'qa-ages',
  'qa-data-interpretation',
]
const QA_EXTENDED = [
  ...QA_CORE,
  'qa-permutations-combinations',
  'qa-probability',
  'qa-mensuration',
  'qa-geometry-trigonometry',
  'qa-linear-quadratic-equations',
  'qa-progressions',
  'qa-simplification',
  'qa-surds-indices-logs',
  'qa-pipes-cisterns',
  'qa-boats-streams',
  'qa-clocks',
  'qa-calendars',
]
const LR_CORE = [
  'lr-number-series',
  'lr-letter-alphanumeric-series',
  'lr-coding-decoding',
  'lr-blood-relations',
  'lr-direction-sense',
  'lr-seating-arrangement',
  'lr-syllogism',
  'lr-statement-reasoning',
  'lr-data-sufficiency',
  'lr-order-ranking',
  'lr-analogy-classification',
  'lr-logical-venn-diagrams',
]
const LR_EXTENDED = [
  ...LR_CORE,
  'lr-puzzles',
  'lr-cubes-dice',
  'lr-non-verbal-reasoning',
  'lr-coded-inequalities',
  'lr-input-output',
  'lr-cryptarithmetic-decision-tables',
]
const VA_CORE = [
  'va-reading-comprehension',
  'va-fill-in-the-blanks-cloze',
  'va-sentence-correction-improvement',
  'va-error-spotting',
  'va-synonyms-antonyms',
  'va-para-jumbles',
  'va-sentence-completion-para-completion',
  'va-tenses-verbs',
  'va-subject-verb-agreement-pronouns',
  'va-parts-of-speech-articles-prepositions',
]
const VA_EXTENDED = [
  ...VA_CORE,
  'va-idioms-phrases-one-word',
  'va-spelling-confusables-collocations',
  'va-sentence-structure-voice-speech',
]

// ─────────────────────────────────────────────────────────────────────────────
// 1. TCS NQT (incl. Smart Hiring / B.Sc Ignite for BCA & B.Sc)
// ─────────────────────────────────────────────────────────────────────────────

const tcsNqt: PrepCompany = {
  code: 'tcs-nqt',
  name: 'TCS',
  testName: 'TCS National Qualifier Test (NQT) — Ninja / Digital / Prime & Smart Hiring',
  tagline: 'India\'s largest fresher gateway. One integrated test; Foundation decides Ninja, Advanced + coding decides Digital and Prime.',
  audience: ['ug', 'pg', 'tech'],
  tier: 'mass',
  platform: 'TCS iON (proctored, centre-based or remote)',
  totalMinutes: 190,
  totalQuestions: 83,
  negativeMarking: false,
  sectionalCutoff: true,
  eligibility: {
    programs: ['bca', 'bsc', 'mca', 'bba', 'bcom', 'ba', 'mba', 'mcom'],
    degrees:
      'Mainstream NQT: B.E/B.Tech/M.E/M.Tech/MCA/M.Sc. Smart Hiring & B.Sc Ignite track: BCA, B.Sc (CS/IT/Maths/Stats/Physics/Chemistry/Electronics/Data Science), B.Voc (CS/IT). Non-IT streams (BBA/B.Com/BA/MBA/M.Com) appear through TCS BPS / Non-Tech NQT drives, which use the same Foundation sections.',
    minPercentage: '60 % (50 % for Smart Hiring / B.Sc Ignite) in 10th, 12th and graduation',
    backlogs: 'Typically none at the time of the process; some seasons allow 1 active backlog to be cleared before joining',
    gap: 'Overall academic gap not more than 24 months, with proof',
    age: '18–28 years',
    note: 'Check the current season\'s notification on nextstep.tcs.com — thresholds move slightly year to year.',
  },
  sections: [
    {
      id: 'numerical',
      name: 'Foundation — Numerical Ability',
      questions: 20,
      minutes: 25,
      topicIds: [
        'qa-number-system',
        'qa-percentages',
        'qa-ratio-proportion-partnership',
        'qa-profit-loss-discount',
        'qa-averages',
        'qa-time-work',
        'qa-speed-time-distance',
        'qa-simple-compound-interest',
        'qa-hcf-lcm',
        'qa-mixtures-alligation',
        'qa-data-interpretation',
        'qa-permutations-combinations',
        'qa-probability',
        'qa-mensuration',
        'qa-geometry-trigonometry',
        'qa-linear-quadratic-equations',
        'qa-progressions',
        'qa-ages',
        'qa-clocks',
        'qa-calendars',
      ],
      coverage: 'catalogue',
    },
    {
      id: 'verbal',
      name: 'Foundation — Verbal Ability',
      questions: 25,
      minutes: 25,
      topicIds: [
        'va-fill-in-the-blanks-cloze',
        'va-reading-comprehension',
        'va-synonyms-antonyms',
        'va-sentence-correction-improvement',
        'va-error-spotting',
        'va-para-jumbles',
        'va-sentence-completion-para-completion',
        'va-idioms-phrases-one-word',
        'va-tenses-verbs',
        'va-subject-verb-agreement-pronouns',
        'va-parts-of-speech-articles-prepositions',
        'va-email-essay-writing',
      ],
      coverage: 'catalogue',
      note: 'Double fill-in-the-blanks, word choice in context and 2–3 RC passages dominate.',
    },
    {
      id: 'reasoning',
      name: 'Foundation — Reasoning Ability',
      questions: 20,
      minutes: 25,
      topicIds: [
        'lr-number-series',
        'lr-letter-alphanumeric-series',
        'lr-seating-arrangement',
        'lr-coding-decoding',
        'lr-blood-relations',
        'lr-direction-sense',
        'lr-syllogism',
        'lr-statement-reasoning',
        'lr-data-sufficiency',
        'lr-cubes-dice',
        'lr-non-verbal-reasoning',
        'lr-logical-venn-diagrams',
        'lr-analogy-classification',
        'lr-puzzles',
        'lr-order-ranking',
      ],
      coverage: 'catalogue',
    },
    {
      id: 'advanced-apt',
      name: 'Advanced — Quantitative & Reasoning',
      questions: 15,
      minutes: 25,
      note: 'Shared timer. Same topics as Foundation at higher difficulty; multi-step DI and arrangement puzzles.',
      topicIds: [
        'qa-data-interpretation',
        'qa-permutations-combinations',
        'qa-probability',
        'qa-time-work',
        'qa-speed-time-distance',
        'qa-mixtures-alligation',
        'qa-mensuration',
        'qa-number-system',
        'lr-puzzles',
        'lr-seating-arrangement',
        'lr-data-sufficiency',
        'lr-input-output',
        'lr-coded-inequalities',
        'lr-cryptarithmetic-decision-tables',
      ],
      coverage: 'catalogue',
    },
    {
      id: 'coding',
      name: 'Advanced — Coding',
      questions: 3,
      minutes: 90,
      topicIds: [],
      coverage: 'external',
      coverageNote:
        'Programming problems in C / C++ / Java / Python on the TCS iON compiler (arrays, strings, hashing, basic recursion, simple DP). Optional for Smart Hiring (1 problem). Practise on a plain editor without autocomplete; read input exactly as specified. A coding track is planned separately in Vriddhi Prep.',
    },
  ],
  rounds: [
    { id: 'nqt', name: 'Online NQT', detail: 'Foundation (75 min) + Advanced (115 min). Foundation score gates Ninja; strong Foundation + Advanced + at least one full coding solve gates Digital / Prime interviews.', eliminator: true },
    { id: 'tech', name: 'Technical interview', detail: 'Project walkthrough, basics of your degree subjects (for BCA/MCA: OOP, DBMS/SQL, one language), puzzles, and questions from your resume.', eliminator: true },
    { id: 'mr', name: 'Managerial interview', detail: 'Situational and behavioural questions, relocation and shift flexibility, why TCS, willingness to learn new tech. Often merged with the technical round.' },
    { id: 'hr', name: 'HR interview', detail: 'Background verification, documents, gap explanation, service agreement, location preference.' },
  ],
  strategyMd: `# How to prepare for TCS NQT

### Understand what your target band needs
- **Ninja / Smart Hiring** is decided almost entirely by the **Foundation** part: 65 MCQs across Numerical, Verbal and Reasoning, 25 minutes each. There is **no negative marking**, so every question must be attempted.
- **Digital / Prime** need Foundation *plus* the Advanced section and at least one fully solved coding problem. If coding is not your strength (most BBA / B.Com / BA candidates), aim to maximise Foundation and Advanced aptitude and treat coding as a bonus.

### Foundation strategy — the 25-minute rule
Each section has its own timer, so you cannot borrow time. Target **1 minute per question with 5 minutes buffer**:
1. First pass: answer everything you can do in under 60 seconds. Mark the rest.
2. Second pass: the marked ones, longest last.
3. Last 60 seconds: fill every unanswered bubble — a blank and a wrong answer cost the same.

### Numerical Ability (20 Q)
Roughly half the paper comes from **percentages, ratio, averages, profit & loss, SI/CI, time-work and speed-distance**. The remaining questions rotate through **number system / HCF-LCM, P&C, probability, mensuration, geometry and one DI set**. Learn the fraction-percentage table, the successive-change formula and the LCM method for work problems — they alone close a third of the section quickly.

### Verbal Ability (25 Q — the biggest section)
TCS verbal is vocabulary-in-context heavy: **double fill-in-the-blanks**, **word-choice questions** and **2–3 reading passages**. Do the passages last; they eat time. Build a 300-word high-frequency list (see Synonyms & Antonyms) and drill connector logic (although / because / however) for the blanks. Some drives add a short **email-writing** task — use the template in Email Writing.

### Reasoning Ability (20 Q)
The reliable scorers are **series, coding-decoding, blood relations, directions and syllogisms** — practise them until they take 40 seconds. The time-sinks are **seating arrangements and puzzles**: attempt them only after the quick ones. TCS also likes **cube folding / paper cutting and mirror-image** items, so do not skip Non-Verbal Reasoning.

### Advanced aptitude (15 Q, shared 25 min)
Same syllabus, harder numbers, more steps. Expect a 3–4 question **DI caselet**, **P&C / probability with conditions**, and **input-output or coded-inequality** reasoning. Sectional cut-offs are lower here; getting 8–9 right is a good outcome.

### Coding (3 problems, 90 min)
Do the simplest problem first and get it fully accepted. Partial marks exist but a clean solve matters more. Practise reading from standard input and printing exactly the required format.

### The two weeks before the test
- Week 1: one Foundation-length mock every alternate day (75 min, strict timers). Review every wrong answer against the topic's *How to Solve* steps.
- Week 2: two full-length mocks (190 min) plus targeted revision of your three weakest topics.
- Sleep before the test; TCS iON slots often start early morning.

### What trips candidates up
- Leaving questions blank (no negative marking!).
- Spending 6 minutes on one seating puzzle.
- Ignoring verbal because "it is just English" — it is 25 of the 65 Foundation marks.
- Not carrying the exact documents listed in the hall ticket to centre-based tests.`,
  quickTips: [
    'No negative marking — attempt all 65 Foundation questions.',
    'Each Foundation section has its own 25-minute timer; you cannot carry time over.',
    'Verbal is the largest section (25 Q): vocabulary in context + RC.',
    'Do seating / puzzles last in Reasoning.',
    'For Digital / Prime, solve at least one coding problem completely.',
    'Smart Hiring (BCA / B.Sc) = Foundation + 1 optional coding problem.',
  ],
  rolesMd: `Commonly reported bands: **Ninja** (Assistant System Engineer, ~₹3.36–3.6 LPA), **Digital** (~₹7 LPA) and **Prime** (~₹9–11 LPA). Smart Hiring / B.Sc Ignite trainees start around the Ninja band after a training period. Figures are as reported by candidates and vary by season and location.`,
  patternVerifiedOn: VERIFIED,
  sources: [
    'https://faceprep.in/article/tcs-exam-pattern/',
    'https://bharatnqt.com/tcs-nqt-exam-pattern-2026/',
    'https://prepinsta.com/tcs-smart-hiring/hiring-process/',
    'https://prepinsta.com/tcs-nqt/verbal-ability/',
  ],
  status: 'published',
  order: 1,
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Infosys (SE / DSE / SP via Infosys online test & InfyTQ)
// ─────────────────────────────────────────────────────────────────────────────

const infosys: PrepCompany = {
  code: 'infosys',
  name: 'Infosys',
  testName: 'Infosys Online Test (Systems Engineer / Digital SE / Specialist Programmer) & InfyTQ',
  tagline: 'Sectional cut-offs on five short, separately timed sections — reasoning, quant, verbal, pseudocode and puzzles.',
  audience: ['tech', 'ug', 'pg'],
  tier: 'mass',
  platform: 'Infosys / HackerRank-hosted, remote proctored',
  totalMinutes: 100,
  totalQuestions: 54,
  negativeMarking: false,
  sectionalCutoff: true,
  eligibility: {
    programs: ['bca', 'mca', 'bsc', 'bba', 'bcom', 'ba', 'mba', 'mcom'],
    degrees:
      'SE / DSE / SP: B.E/B.Tech/M.E/M.Tech/MCA/M.Sc. BCA and B.Sc appear in selected Infosys drives and in Infosys BPM / operations hiring, which uses the same reasoning-quant-verbal core without pseudocode. Non-IT graduates (BBA/B.Com/BA/MBA/M.Com) are hired by Infosys BPM through an aptitude + communication assessment.',
    minPercentage: '60 % or 6.0 CGPA in 10th, 12th and graduation',
    backlogs: 'No active backlogs at the time of selection',
    gap: 'Usually not more than 2 years',
    note: 'InfyTQ certification (65 %+) is the main route into the Specialist Programmer / Power Programmer shortlists.',
  },
  sections: [
    {
      id: 'reasoning',
      name: 'Reasoning Ability',
      questions: 15,
      minutes: 25,
      topicIds: [
        'lr-syllogism',
        'lr-seating-arrangement',
        'lr-data-sufficiency',
        'lr-blood-relations',
        'lr-coding-decoding',
        'lr-number-series',
        'lr-direction-sense',
        'lr-statement-reasoning',
        'lr-logical-venn-diagrams',
        'lr-analogy-classification',
        'lr-order-ranking',
        'lr-cubes-dice',
      ],
      coverage: 'catalogue',
    },
    {
      id: 'quant',
      name: 'Mathematical Ability',
      questions: 10,
      minutes: 35,
      note: 'Fewest questions, most time — the questions are multi-step (DI sets, P&C, mixtures).',
      topicIds: [
        'qa-data-interpretation',
        'qa-percentages',
        'qa-profit-loss-discount',
        'qa-permutations-combinations',
        'qa-probability',
        'qa-speed-time-distance',
        'qa-time-work',
        'qa-mixtures-alligation',
        'qa-ratio-proportion-partnership',
        'qa-averages',
        'qa-number-system',
        'qa-mensuration',
        'qa-simple-compound-interest',
        'qa-progressions',
        'qa-linear-quadratic-equations',
      ],
      coverage: 'catalogue',
    },
    {
      id: 'verbal',
      name: 'Verbal Ability',
      questions: 20,
      minutes: 20,
      topicIds: [
        'va-reading-comprehension',
        'va-sentence-correction-improvement',
        'va-para-jumbles',
        'va-fill-in-the-blanks-cloze',
        'va-error-spotting',
        'va-sentence-completion-para-completion',
        'va-synonyms-antonyms',
        'va-tenses-verbs',
        'va-subject-verb-agreement-pronouns',
        'va-parts-of-speech-articles-prepositions',
        'va-idioms-phrases-one-word',
      ],
      coverage: 'catalogue',
      note: 'One minute per question — RC passages are short; para-jumbles and sentence correction are the differentiators.',
    },
    {
      id: 'pseudocode',
      name: 'Pseudocode',
      questions: 5,
      minutes: 10,
      topicIds: [],
      coverage: 'external',
      coverageNote:
        'Predict the output of C-style pseudocode: loop tracing, nested conditions, integer division and modulus, simple recursion, array indexing, operator precedence. Non-tech (BPM) drives usually omit this section. Practise dry-running code on paper with a variable table; a pseudocode module is planned in Vriddhi Prep.',
    },
    {
      id: 'puzzles',
      name: 'Puzzle Solving',
      questions: 4,
      minutes: 10,
      topicIds: ['lr-puzzles', 'lr-seating-arrangement', 'lr-cryptarithmetic-decision-tables', 'lr-order-ranking'],
      coverage: 'catalogue',
      note: 'Constraint puzzles (floors / boxes / schedules) and grid arrangements; 2.5 minutes each.',
    },
  ],
  rounds: [
    { id: 'test', name: 'Online assessment', detail: 'Five separately timed sections with sectional and overall cut-offs (commonly reported around 60–65 %). For SP / DSE drives two coding problems are added.', eliminator: true },
    { id: 'tech', name: 'Technical interview', detail: 'For SE/DSE: one programming language, OOP, DBMS/SQL basics, project. For BPM / non-tech: domain basics (accounting for B.Com, business concepts for BBA), Excel awareness, situational questions.', eliminator: true },
    { id: 'hr', name: 'HR interview', detail: 'Communication, flexibility on location and shifts, career goals, document verification.' },
  ],
  strategyMd: `# How to prepare for Infosys

### The pattern in one line
Five short sections, **each with its own timer and its own cut-off**. You cannot compensate a weak section with a strong one, so preparation must be balanced — the candidate who scores 70 % everywhere beats the one who scores 95 % in quant and 40 % in verbal.

### Reasoning (15 Q / 25 min)
The most generous time allocation. Infosys leans on **syllogisms, seating arrangements, data sufficiency, blood relations and coding-decoding**. Data sufficiency is the differentiator: remember you decide *whether* it can be answered, not *what* the answer is. Use the Venn method for syllogisms and the two-row diagram for blood relations.

### Mathematical Ability (10 Q / 35 min)
Only ten questions but 3.5 minutes each — they are **multi-step**. Expect a **DI set of 3–4 questions**, one **P&C / probability**, one **mixtures or ratio**, one **speed-time or work** and one **profit & loss / percentage**. Practise DI with approximation; most options are far enough apart that exact arithmetic is unnecessary.

### Verbal (20 Q / 20 min)
Sixty seconds per question. The passages are short (150–200 words) so do them, but do **sentence correction, para-jumbles and fill-in-the-blanks first**. The grammar tested is mainstream: tenses, agreement, prepositions, articles, parallelism.

### Pseudocode (5 Q / 10 min) — tech drives
Two minutes per question. Trace with a **variable table** on rough paper: write each variable as a column and update row by row. Watch integer division, the difference between \`i++\` in the condition versus the body, and off-by-one loop bounds. If you are from BBA / B.Com and your drive includes this section, learn only the basics — loops, if-else, modulus — and bank the easy ones.

### Puzzles (4 Q / 10 min)
Small constraint puzzles. Read all clues before placing anything; start from the most restrictive clue ("C is immediately above the empty floor"). If a puzzle is not cracking in 3 minutes, pick the most likely option and move on — the sectional cut-off is usually 2 of 4.

### InfyTQ route (for SP / PP)
If you are from BCA / MCA and aiming at the higher tracks, register for InfyTQ early: the certification round tests programming fundamentals, DBMS and two hands-on problems; 65 %+ opens the Specialist Programmer shortlist.

### A four-week plan
- Weeks 1–2: one topic per day from the mapped list, 30 questions each, timed.
- Week 3: sectional mocks — five per section, always timed exactly like the test.
- Week 4: three full mocks; after each, list the two sections nearest the cut-off and revise only those.

### What trips candidates up
- Failing one section's cut-off while scoring high overall.
- Spending too long on the first DI question and losing the whole quant section.
- Treating verbal as easy and running out of time on para-jumbles.
- For BPM drives: neglecting the communication / typing assessment that follows the aptitude test.`,
  quickTips: [
    'Every section has its own cut-off — be balanced, not brilliant in one area.',
    'Quant has only 10 questions but 35 minutes: expect multi-step DI.',
    'Do para-jumbles and sentence correction before RC in verbal.',
    'Pseudocode: trace with a variable table; watch integer division.',
    'Puzzles: start with the most restrictive clue; cap 3 minutes each.',
    'BCA / MCA: InfyTQ 65 %+ unlocks the Specialist Programmer track.',
  ],
  rolesMd: `Commonly reported tracks: **Systems Engineer** (~₹3.6 LPA), **Digital Specialist Engineer** (~₹6.25–6.5 LPA), **Specialist Programmer** (~₹9–9.5 LPA). Infosys BPM process roles for non-IT graduates are typically ₹2.5–3.5 LPA. Reported figures; vary by season.`,
  patternVerifiedOn: VERIFIED,
  sources: [
    'https://faceprep.in/article/infosys-test-pattern-and-infosys-questions-of-16th-june-2018-drive/',
    'https://placementpapers.app/infosys/',
    'https://jobhuntdaily.com/exams/infosys-infytq',
  ],
  status: 'published',
  order: 2,
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Wipro NLTH / Elite (and WILP for BCA / B.Sc)
// ─────────────────────────────────────────────────────────────────────────────

const wipro: PrepCompany = {
  code: 'wipro-nlth',
  name: 'Wipro',
  testName: 'Wipro National Level Talent Hunt (NLTH / Elite) & WILP',
  tagline: 'A compact AMCAT-run aptitude test plus an essay; tech-track drives add two coding problems.',
  audience: ['tech', 'ug'],
  tier: 'mass',
  platform: 'AMCAT / SHL India, remote proctored',
  totalMinutes: 128,
  totalQuestions: 63,
  negativeMarking: false,
  sectionalCutoff: true,
  eligibility: {
    programs: ['bca', 'bsc', 'mca', 'bba', 'bcom', 'ba'],
    degrees:
      'NLTH / Elite: B.E/B.Tech/M.E/M.Tech (all branches) and MCA / M.Sc in selected drives. WILP (Work Integrated Learning Program): BCA and B.Sc (CS/IT/Maths/Stats/Physics/Electronics) — work at Wipro while completing an M.Tech from BITS Pilani / VIT. Non-IT graduates are hired into Wipro\'s BPS / operations roles via a shorter aptitude + communication test.',
    minPercentage: '60 % in 10th, 12th and graduation — each level independently (Wipro computes percentage, not CGPA)',
    backlogs: 'No active backlogs',
    gap: 'Up to 3 years total gap in education commonly accepted, with documentation',
    note: 'The 60 % rule applies to each level separately: 72 / 57 / 80 does not qualify.',
  },
  sections: [
    {
      id: 'quant',
      name: 'Quantitative Ability',
      questions: 16,
      minutes: 16,
      topicIds: [
        'qa-percentages',
        'qa-profit-loss-discount',
        'qa-time-work',
        'qa-speed-time-distance',
        'qa-ratio-proportion-partnership',
        'qa-averages',
        'qa-number-system',
        'qa-hcf-lcm',
        'qa-simple-compound-interest',
        'qa-permutations-combinations',
        'qa-probability',
        'qa-data-interpretation',
        'qa-mixtures-alligation',
        'qa-ages',
        'qa-progressions',
        'qa-linear-quadratic-equations',
      ],
      coverage: 'catalogue',
      note: 'Sixty seconds per question — pure speed arithmetic.',
    },
    {
      id: 'logical',
      name: 'Logical Ability',
      questions: 14,
      minutes: 14,
      topicIds: [
        'lr-number-series',
        'lr-letter-alphanumeric-series',
        'lr-coding-decoding',
        'lr-blood-relations',
        'lr-direction-sense',
        'lr-seating-arrangement',
        'lr-syllogism',
        'lr-data-sufficiency',
        'lr-statement-reasoning',
        'lr-analogy-classification',
        'lr-logical-venn-diagrams',
        'lr-order-ranking',
        'lr-coded-inequalities',
      ],
      coverage: 'catalogue',
    },
    {
      id: 'verbal',
      name: 'Verbal Ability',
      questions: 22,
      minutes: 18,
      topicIds: [
        'va-reading-comprehension',
        'va-sentence-correction-improvement',
        'va-fill-in-the-blanks-cloze',
        'va-error-spotting',
        'va-synonyms-antonyms',
        'va-para-jumbles',
        'va-idioms-phrases-one-word',
        'va-tenses-verbs',
        'va-subject-verb-agreement-pronouns',
        'va-parts-of-speech-articles-prepositions',
        'va-spelling-confusables-collocations',
      ],
      coverage: 'catalogue',
      note: 'The largest and fastest section: under 50 seconds per question.',
    },
    {
      id: 'essay',
      name: 'Written Communication (Essay)',
      questions: 1,
      minutes: 20,
      topicIds: ['va-email-essay-writing', 'va-sentence-structure-voice-speech', 'va-subject-verb-agreement-pronouns'],
      coverage: 'catalogue',
      note: '200–400 words on a general topic, machine-scored for structure, grammar and coherence.',
    },
    {
      id: 'coding',
      name: 'Coding (tech track)',
      questions: 2,
      minutes: 60,
      topicIds: [],
      coverage: 'external',
      coverageNote:
        'Two problems (easy + medium) in C / C++ / Java / Python: strings, arrays, sorting, simple math. Omitted in BPS / non-tech drives and optional in some WILP drives. Get one problem fully accepted before touching the second. A coding module is planned in Vriddhi Prep.',
    },
  ],
  rounds: [
    { id: 'test', name: 'Online assessment (AMCAT)', detail: 'Aptitude (quant + logical + verbal) → essay → coding (tech track). Fixed section order; no going back. Sectional cut-offs apply.', eliminator: true },
    { id: 'tech', name: 'Business discussion / technical interview', detail: 'Project, one language, OOP and SQL basics for tech roles; for WILP and BPS, degree subjects, logical questions and communication.', eliminator: true },
    { id: 'hr', name: 'HR interview', detail: 'Flexibility on location and shifts, service agreement (WILP has a bond), documents.' },
  ],
  strategyMd: `# How to prepare for Wipro NLTH / Elite / WILP

### The pattern in one line
A fast **AMCAT** aptitude test — about **one question per minute** in each section — followed by an **essay**, and for tech tracks **two coding problems**. Sections are locked in order; you cannot return.

### Quant (16 Q / 16 min)
Speed arithmetic. Wipro's quant is closer to school-level than TCS Advanced, but you get only 60 seconds. Drill **percentages, profit & loss, ratio, averages, time-work, speed-distance and SI/CI** until the standard forms are reflex. Number system and HCF/LCM questions are short — bank them first. Skip any question that needs more than two steps on the first pass.

### Logical (14 Q / 14 min)
Series, coding-decoding, blood relations and directions carry the section. There is usually one **seating arrangement set** — if it is a 3–4 question set, it can be worth doing even at 3 minutes; if it is a single question, skip it until the end. Syllogisms and data sufficiency appear regularly.

### Verbal (22 Q / 18 min)
The largest section and the fastest. Expect **1–2 short RC passages, sentence correction, fill-in-the-blanks, error spotting and vocabulary**. Answer the grammar and vocabulary items first, RC last. AMCAT verbal is adaptive in some drives — the next question gets harder when you answer correctly, so do not panic when difficulty rises.

### Essay (20 min)
A general topic: technology, education, environment, work-from-home, social media. Machine-scored on structure, grammar, coherence and length. Use the four-paragraph skeleton from *Email & Essay Writing*: position → reason + example → reason / counter + example → conclusion. Keep sentences short; avoid contractions and slang; stay within 200–400 words. This section matters more than candidates think — it decides the Elite vs. Turbo shortlist in several seasons.

### Coding (tech track, 2 problems / 60 min)
One easy (string / array manipulation) and one medium (sorting, simple math, hash map). Solve the easy one completely first. Handle edge cases (empty input, single element). Wipro's compiler is standard; read from stdin, write to stdout.

### WILP (BCA / B.Sc)
Same aptitude + essay core; coding is usually a single simple problem or omitted. The interview focuses on your degree subjects and willingness to study alongside work. Understand the programme structure and bond before accepting.

### Three-week plan
- Week 1: quant + logical topic drills, always timed at 60 seconds per question.
- Week 2: verbal drills and two essays per day (time them at 20 minutes, proofread in the last 2).
- Week 3: full AMCAT-style mocks on alternate days; coding practice on the other days for tech track.

### What trips candidates up
- The independent 60 % rule at each academic level.
- Treating the essay as a formality.
- Getting stuck on the seating set in the 14-minute logical section.
- Not reading the input format in coding problems.`,
  quickTips: [
    'About 1 question per minute — speed arithmetic and grammar reflexes.',
    'Sections are locked in order; no going back.',
    'Verbal is the largest section (22 Q in 18 min).',
    'The essay is scored — use the 4-paragraph skeleton, 200–400 words.',
    '60 % applies to 10th, 12th and degree independently.',
    'Tech track: get one coding problem fully accepted first.',
  ],
  rolesMd: `Commonly reported: **Project Engineer** (~₹3.5 LPA), **Elite / Turbo** (~₹3.5–6.5 LPA depending on season and performance). **WILP** trainees receive a stipend during the programme with a full-time role on completion. Reported figures; vary by season.`,
  patternVerifiedOn: VERIFIED,
  sources: [
    'https://faceprep.in/article/wipro-nlth-pattern-eligibility-and-syllabus-face-prep/',
    'https://www.ccbp.in/blog/articles/how-to-prepare-for-infosys-wipro-and-tcs-placements',
  ],
  status: 'published',
  order: 3,
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Accenture (Cognitive + Technical + Coding + Communication)
// ─────────────────────────────────────────────────────────────────────────────

const accenture: PrepCompany = {
  code: 'accenture',
  name: 'Accenture',
  testName: 'Accenture Fresher Assessment (Cognitive & Technical, Coding, Communication)',
  tagline: 'A cognitive assessment on aptitude and English, a technical MCQ block, two coding problems and an AI-scored communication test.',
  audience: ['tech', 'ug', 'pg'],
  tier: 'mass',
  platform: 'Accenture assessment portal (Aon-style cognitive + coding), remote proctored',
  totalMinutes: 120,
  totalQuestions: 62,
  negativeMarking: false,
  sectionalCutoff: true,
  eligibility: {
    programs: ['bca', 'mca', 'bsc', 'bba', 'bcom', 'ba', 'mba', 'mcom'],
    degrees:
      'Associate Software Engineer: B.E/B.Tech/M.E/M.Tech/MCA/M.Sc, and BCA / B.Sc (CS/IT) in many campus drives. Accenture Operations / Strategy & Consulting analyst roles hire BBA, B.Com, BA, MBA and M.Com graduates through the same cognitive and communication assessments without the coding block.',
    minPercentage: '60 % or 6.0 CGPA in graduation (some drives: 65 %)',
    backlogs: 'No active backlogs at the time of the process',
    gap: 'Not more than 1–2 years, depending on the drive',
    note: 'Accenture sometimes runs the cognitive assessment first and only invites those who clear it to the coding round.',
  },
  sections: [
    {
      id: 'english',
      name: 'Cognitive — English Ability',
      questions: 17,
      minutes: 15,
      topicIds: [
        'va-fill-in-the-blanks-cloze',
        'va-sentence-correction-improvement',
        'va-error-spotting',
        'va-reading-comprehension',
        'va-synonyms-antonyms',
        'va-para-jumbles',
        'va-parts-of-speech-articles-prepositions',
        'va-tenses-verbs',
        'va-subject-verb-agreement-pronouns',
        'va-idioms-phrases-one-word',
      ],
      coverage: 'catalogue',
    },
    {
      id: 'critical',
      name: 'Cognitive — Critical Reasoning & Problem Solving',
      questions: 18,
      minutes: 20,
      topicIds: [
        'lr-statement-reasoning',
        'lr-syllogism',
        'lr-data-sufficiency',
        'lr-seating-arrangement',
        'lr-puzzles',
        'lr-number-series',
        'lr-coding-decoding',
        'lr-blood-relations',
        'lr-direction-sense',
        'lr-logical-venn-diagrams',
        'lr-analogy-classification',
        'lr-non-verbal-reasoning',
        'lr-cubes-dice',
      ],
      coverage: 'catalogue',
      note: 'Heavier on statement-based critical reasoning (assumptions, inferences, courses of action) than other IT tests.',
    },
    {
      id: 'abstract',
      name: 'Cognitive — Abstract Reasoning',
      questions: 15,
      minutes: 15,
      topicIds: ['lr-non-verbal-reasoning', 'lr-letter-alphanumeric-series', 'lr-number-series', 'lr-analogy-classification', 'lr-cubes-dice'],
      coverage: 'partial',
      coverageNote:
        'Figure series, odd-figure-out and matrix completion. Non-Verbal Reasoning covers the logic; practise with figure-based question sets as well since the shared catalogue is text-first.',
    },
    {
      id: 'numerical',
      name: 'Cognitive — Numerical Ability (where included)',
      questions: 10,
      minutes: 10,
      topicIds: [
        'qa-percentages',
        'qa-data-interpretation',
        'qa-ratio-proportion-partnership',
        'qa-averages',
        'qa-profit-loss-discount',
        'qa-time-work',
        'qa-speed-time-distance',
        'qa-number-system',
        'qa-simple-compound-interest',
        'qa-probability',
      ],
      coverage: 'catalogue',
      note: 'Some seasons fold numerical items into the problem-solving block; DI and percentages dominate either way.',
    },
    {
      id: 'technical',
      name: 'Technical Assessment (tech roles)',
      questions: 20,
      minutes: 20,
      topicIds: [],
      coverage: 'external',
      coverageNote:
        'Pseudocode output prediction, common application / MS Office fundamentals, networking and security basics, cloud basics. Non-tech (Operations / Consulting) drives replace this with a situational-judgement or Excel-awareness block. Pseudocode and fundamentals modules are planned in Vriddhi Prep.',
    },
    {
      id: 'coding',
      name: 'Coding (tech roles)',
      questions: 2,
      minutes: 45,
      topicIds: [],
      coverage: 'external',
      coverageNote: 'Two problems: arrays / strings / simple math in C, C++, Java, Python or .NET. Solve one fully; partial credit exists. Omitted for non-tech roles.',
    },
    {
      id: 'communication',
      name: 'Communication Assessment',
      questions: 8,
      minutes: 20,
      topicIds: ['va-reading-comprehension', 'va-email-essay-writing', 'va-sentence-structure-voice-speech', 'va-spelling-confusables-collocations'],
      coverage: 'partial',
      coverageNote:
        'AI-scored speaking (read aloud, repeat sentences, describe an image, answer a question) plus a short listening / typing component. The catalogue covers grammar and structure; practise speaking aloud at a steady pace with clear pronunciation, and typing at 30+ wpm.',
    },
  ],
  rounds: [
    { id: 'cognitive', name: 'Cognitive & technical assessment', detail: 'English, critical reasoning, abstract reasoning (and numerical), plus the technical MCQ block for tech roles. Clearing this unlocks the coding round.', eliminator: true },
    { id: 'coding', name: 'Coding assessment', detail: 'Two problems in 45 minutes (tech roles only).', eliminator: true },
    { id: 'communication', name: 'Communication assessment', detail: 'AI-scored spoken and written English. Not usually an eliminator on its own but influences role mapping.' },
    { id: 'interview', name: 'Interview (technical + HR combined)', detail: 'Resume, project, basic programming or domain questions, situational questions, flexibility on location and shifts. Often a single 20–30 minute round.' },
  ],
  strategyMd: `# How to prepare for Accenture

### The pattern in one line
Accenture tests **thinking and communication** more than heavy arithmetic. The cognitive assessment has short sections on **English, critical reasoning / problem solving, abstract reasoning** and (in most seasons) **numerical ability**; tech roles then face a **technical MCQ block** and **two coding problems**; everyone does an **AI-scored communication test**.

### English (about 17 Q / 15 min)
Fill-in-the-blanks (grammar and vocabulary), sentence correction, error spotting, one short passage. Difficulty is easy-to-medium; the challenge is pace. Revise articles, prepositions, tenses and agreement — Accenture's English questions are almost all mainstream grammar.

### Critical reasoning & problem solving (about 18 Q / 20 min)
This is where Accenture differs from TCS and Wipro. Expect **statement-based questions**: which assumption is implicit, which conclusion follows, which course of action is appropriate, strong vs. weak arguments. Learn the rules in *Statements: Assumptions, Conclusions, Arguments & Courses of Action* — especially "stay within the statement, no outside knowledge". The block also carries **syllogisms, data sufficiency and one arrangement set**.

### Abstract reasoning (about 15 Q / 15 min)
Figure series, matrices and odd-one-out. Look for **one change at a time**: rotation, count, shading, position. If two attributes change together, track them separately. The logic is covered in Non-Verbal Reasoning, but do practise on picture-based sets — speed on figures comes only from exposure.

### Numerical (about 10 Q / 10 min)
Percentages, ratio, averages, and a **DI table or chart**. Approximate aggressively; options are spaced out.

### Technical MCQs (tech roles, ~20 Q)
Pseudocode output questions, MS Office / common application basics, networking terms, security basics, cloud concepts. Breadth matters more than depth. For BCA / MCA candidates this is the easiest block to score in with a week of revision.

### Coding (tech roles, 2 problems / 45 min)
One easy, one medium: strings, arrays, simple math. Solve the easy one completely and cleanly. Accenture gives partial credit for passing test cases, so submit whatever runs.

### Communication assessment (~20 min)
Read sentences aloud, repeat sentences, describe a picture, answer short spoken questions, and type a response. Speak at a **steady, moderate pace**; do not rush or mumble. The scoring cares about fluency and grammar more than accent. Practise by reading a newspaper paragraph aloud daily and recording yourself.

### For BBA / B.Com / BA / MBA / M.Com candidates
Accenture Operations and Strategy & Consulting drives use the **same cognitive and communication assessments** but drop the coding block, sometimes replacing the technical MCQs with a situational-judgement test. Focus on critical reasoning, English and communication; brush up basic Excel and domain vocabulary for the interview.

### Three-week plan
- Week 1: statement reasoning + syllogisms + data sufficiency (the Accenture differentiators), 25 questions a day.
- Week 2: English grammar drills and abstract-reasoning figure sets; daily 5-minute read-aloud practice.
- Week 3: full cognitive mocks; tech candidates alternate with pseudocode and two coding problems a day.

### What trips candidates up
- Using outside knowledge in assumption / conclusion questions.
- Underestimating abstract reasoning — figures are slow if you have never practised them.
- Rushing the spoken test; the scorer penalises unclear speech more than a slower pace.
- Ignoring the communication test because "it is not eliminatory" — it affects role mapping.`,
  quickTips: [
    'Critical reasoning (assumptions / conclusions / courses of action) is the differentiator.',
    'Abstract reasoning: track one attribute at a time — rotation, count, shading.',
    'English is mainstream grammar at speed: articles, prepositions, tenses.',
    'Communication test: steady pace, clear speech; fluency beats accent.',
    'Tech roles: pseudocode + fundamentals MCQs, then two coding problems (partial credit).',
    'Non-tech roles do the same cognitive test without coding.',
  ],
  rolesMd: `Commonly reported: **Associate Software Engineer** (~₹4.5 LPA), **Advanced ASE** (~₹6.5 LPA after a higher coding score). Operations / Consulting analyst roles for non-IT graduates are typically ₹3–4.5 LPA. Reported figures; vary by season.`,
  patternVerifiedOn: VERIFIED,
  sources: [
    'https://placementpapers.app/accenture/2026/',
  ],
  status: 'published',
  order: 4,
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Capgemini Exceller (game-based aptitude + pseudocode + English)
// ─────────────────────────────────────────────────────────────────────────────

const capgemini: PrepCompany = {
  code: 'capgemini',
  name: 'Capgemini',
  testName: 'Capgemini Exceller — Analyst / Senior Analyst',
  tagline: 'Game-based cognitive aptitude, a pseudocode-heavy technical MCQ block and an automated English test; coding only for the higher package.',
  audience: ['tech', 'pg'],
  tier: 'mass',
  platform: 'Capgemini assessment portal (game-based cognitive + MCQs), remote proctored',
  totalMinutes: 130,
  totalQuestions: 62,
  negativeMarking: false,
  sectionalCutoff: true,
  eligibility: {
    programs: ['mca', 'bca', 'bsc'],
    degrees:
      'B.E/B.Tech/M.E/M.Tech (all branches), MCA, and M.Sc (CS/IT). BCA and B.Sc (CS/IT) are accepted in selected off-campus and partner-college drives; check the notification. Capgemini does not commonly run a separate non-IT fresher aptitude drive for BBA / B.Com.',
    minPercentage: '60 % or 6.0 CGPA in 10th, 12th and graduation / post-graduation',
    backlogs: 'None at the time of the process (some drives allow 1 to be cleared before joining)',
    gap: 'Not more than 2 years',
    note: 'Most stages are eliminators — failing any single gate ends the process regardless of other scores. Re-application usually needs a 6-month wait.',
  },
  sections: [
    {
      id: 'pseudocode',
      name: 'Technical MCQs & Pseudocode',
      questions: 30,
      minutes: 30,
      topicIds: [],
      coverage: 'external',
      coverageNote:
        'The primary eliminator. Trace pseudocode (loops, nested conditions, recursion, bitwise & | ^, time complexity), plus data-structure, OS, DBMS/SQL and networking fundamentals; recent drives add an "AI literacy" block. Practise dry-running code with a variable table. A pseudocode / CS-fundamentals module is planned in Vriddhi Prep.',
    },
    {
      id: 'english',
      name: 'English Communication (written)',
      questions: 30,
      minutes: 30,
      topicIds: [
        'va-sentence-correction-improvement',
        'va-error-spotting',
        'va-parts-of-speech-articles-prepositions',
        'va-reading-comprehension',
        'va-synonyms-antonyms',
        'va-fill-in-the-blanks-cloze',
        'va-para-jumbles',
        'va-tenses-verbs',
        'va-subject-verb-agreement-pronouns',
        'va-idioms-phrases-one-word',
        'va-email-essay-writing',
      ],
      coverage: 'catalogue',
      note: 'Grammar, prepositions, sentence correction, RC and vocabulary; some drives add a short business-writing task.',
    },
    {
      id: 'games',
      name: 'Game-based Cognitive Aptitude',
      questions: 4,
      minutes: 24,
      topicIds: [
        'lr-non-verbal-reasoning',
        'lr-coding-decoding',
        'lr-number-series',
        'lr-letter-alphanumeric-series',
        'qa-simplification',
        'lr-cubes-dice',
        'lr-puzzles',
      ],
      coverage: 'partial',
      coverageNote:
        'Four games drawn from a pool (Switch Challenge — decode shape re-ordering; GeoStudio — deductive symbol grids; Digit Challenge — place digits to balance an equation; Motion Challenge — shortest path around obstacles; Grid Challenge — remember positions while comparing figures; Inductive/Spacio — find the pair following the same rule). The mapped topics train the underlying logic (pattern induction, coding rules, mental arithmetic, spatial reasoning); familiarity with the game formats themselves comes from timed practice on similar puzzle apps.',
    },
    {
      id: 'behavioural',
      name: 'Behavioural Competency Profiling',
      questions: 100,
      topicIds: [],
      coverage: 'external',
      coverageNote: 'Non-eliminatory personality questionnaire (agree/disagree statements). Answer consistently and honestly; contradictory answers are flagged.',
    },
    {
      id: 'coding',
      name: 'Coding (Senior Analyst track)',
      questions: 2,
      minutes: 45,
      topicIds: [],
      coverage: 'external',
      coverageNote: 'Two problems in C / C++ / Java / Python: arrays, strings, hash maps, two pointers, simple DP. Required only for the higher package; one full solve plus one partial is the commonly reported bar.',
    },
    {
      id: 'spoken',
      name: 'Spoken English Assessment',
      topicIds: ['va-sentence-structure-voice-speech', 'va-tenses-verbs', 'va-reading-comprehension'],
      coverage: 'partial',
      coverageNote: 'AI-scored speaking (read aloud, repeat, describe, respond). Steady pace, complete sentences, no filler words. Grammar topics from the catalogue apply; speaking fluency needs daily read-aloud practice.',
    },
  ],
  rounds: [
    { id: 'technical', name: 'Technical MCQ + pseudocode', detail: 'Strict eliminator with a high cut-off (commonly reported near 70–75 %). The test terminates if you miss it.', eliminator: true },
    { id: 'english', name: 'Written English test', detail: '30 questions in 30 minutes; grammar, vocabulary, comprehension.', eliminator: true },
    { id: 'games', name: 'Game-based cognitive assessment', detail: 'Four ~6-minute games; percentile-scored.', eliminator: true },
    { id: 'coding', name: 'Coding (Senior Analyst)', detail: 'Two problems in 45 minutes; decides the higher package.' },
    { id: 'spoken', name: 'Spoken English assessment', detail: 'Virtual, AI-scored.', eliminator: true },
    { id: 'interview', name: 'Technical + HR interview', detail: 'Programming fundamentals, DBMS/SQL, OS, project; then HR on relocation, shifts and documents.' },
  ],
  strategyMd: `# How to prepare for Capgemini Exceller

### The pattern in one line
Capgemini replaced the classic quant / reasoning paper with **four cognitive games**, made **pseudocode the first and strictest eliminator**, and added an **automated English test** (written, then spoken). Coding is required only for the **Senior Analyst** package. Almost every stage is a gate — you must clear each one.

### Technical MCQs & pseudocode (30 Q / 30 min) — the gate
Sixty seconds per question and a high cut-off. The pseudocode items test whether you can trace logic: loops with changing bounds, nested if-else, integer division and modulus, recursion depth, string index arithmetic, **bitwise operators** (&, |, ^, shifts) and basic **time complexity** of loops. Fundamentals items cover arrays / stacks / queues / trees, OS (process vs thread, scheduling, deadlock), DBMS (keys, normal forms, joins), networking (OSI layers, TCP vs UDP, IP basics) and, in recent drives, **AI literacy** (what an LLM is, prompt basics, bias). Prepare with a variable-table dry-run habit and a one-page revision sheet per fundamentals area. BCA / MCA candidates: this block is where your degree pays off — aim for 80 %+.

### Written English (30 Q / 30 min)
Grammar-heavy: **prepositions, articles, sentence correction, error spotting**, plus RC and synonyms / antonyms. The catalogue's Module 1 (Grammar Foundations) and Error Spotting cover it directly. Some drives include a short business email — use the template in Email Writing.

### Game-based cognitive (4 games, ~6 min each)
You will get four from a larger pool. The frequently reported ones:
- **Switch Challenge** — a code re-orders shapes; deduce the code. Same logic as coding-decoding with positions.
- **GeoStudio / Deductive grid** — a symbol Sudoku; each row and column holds each symbol once.
- **Digit Challenge** — place given digits so an equation balances. Mental arithmetic and factor sense.
- **Motion Challenge** — move a piece to a target in the fewest moves around blockers. Plan the route before touching anything.
- **Grid Challenge** — remember highlighted cells while answering whether two figures are identical. Split attention; rehearse the positions silently.
- **Inductive (Spacio)** — find which pair follows the same transformation as the reference pair.
Scores are **percentile-based and adaptive**: accuracy matters more than raw speed. Play slowly and correctly for the first few items; the game raises difficulty as you get them right.

### Coding (Senior Analyst, 2 problems / 45 min)
Arrays, strings, hash maps, two pointers, occasionally simple DP. Solve one fully; a partial second raises your package band.

### Spoken English
Read aloud, repeat sentences, describe a scene, answer a question. Speak in complete sentences at a moderate pace; avoid fillers ("um", "like"). Record yourself daily for a week before the test.

### Three-week plan
- Week 1: pseudocode dry-runs (20 a day) + one fundamentals area per day (DS, OS, DBMS, CN, AI basics).
- Week 2: English grammar drills (Error Spotting, Sentence Correction, Prepositions) + 10 minutes of cognitive-game-style puzzles daily.
- Week 3: full-sequence mocks; coding practice on alternate days if aiming for Senior Analyst; read-aloud practice every day.

### What trips candidates up
- Under-preparing pseudocode because "aptitude" was the old focus — it is now the first gate.
- Rushing the games; accuracy drives the percentile.
- Prepositions and articles — small grammar points, large share of the English block.
- Inconsistent answers on the behavioural questionnaire.`,
  quickTips: [
    'Pseudocode + fundamentals is the first eliminator — dry-run with a variable table.',
    'Four cognitive games, ~6 min each; accuracy drives the percentile.',
    'Written English is grammar-first: prepositions, articles, sentence correction.',
    'Coding only decides the Senior Analyst package.',
    'Spoken English: steady pace, full sentences, no fillers.',
    'Every stage is a gate — clear each one; no cross-compensation.',
  ],
  rolesMd: `Commonly reported: **Analyst** (~₹4–4.5 LPA) and **Senior Analyst** (~₹6.5–7.5 LPA, requires the coding round and higher cut-offs across stages). Reported figures; vary by season.`,
  patternVerifiedOn: VERIFIED,
  sources: [
    'https://faceprep.in/article/capegemini-exam-pattern/',
    'https://faceprep.in/article/capgemini-exceller-assessment-framework-2026-complete-guide/',
    'https://jobsnet.in/capgemini-campus-recruitment-interview-questions/',
  ],
  status: 'published',
  order: 5,
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Cognizant GenC / GenC Next (and GenC Pro / non-tech operations)
// ─────────────────────────────────────────────────────────────────────────────

const cognizant: PrepCompany = {
  code: 'cognizant-genc',
  name: 'Cognizant',
  testName: 'Cognizant GenC / GenC Next (AMCAT-based)',
  tagline: 'Communication assessment first, then a long aptitude paper (numerical, logical, verbal); GenC Next adds a technical cluster.',
  audience: ['tech', 'ug', 'pg'],
  tier: 'mass',
  platform: 'AMCAT / SHL India (aptitude & communication); Cognizant portal for technical clusters',
  totalMinutes: 158,
  totalQuestions: 140,
  negativeMarking: false,
  sectionalCutoff: true,
  eligibility: {
    programs: ['bca', 'mca', 'bsc', 'bba', 'bcom', 'ba', 'mba', 'mcom'],
    degrees:
      'GenC / GenC Next: B.E/B.Tech/M.E/M.Tech/MCA/M.Sc, with BCA and B.Sc (CS/IT) in selected drives. Cognizant\'s BPS / operations hiring for BBA, B.Com, BA, MBA and M.Com uses the same AMCAT communication and aptitude assessments without the technical cluster.',
    minPercentage: '60 % or 6.0 CGPA in 10th, 12th and graduation (some drives: 65 %)',
    backlogs: 'No active backlogs at the time of the process',
    gap: 'Not more than 2 years',
    note: 'The communication assessment is the first round — you need to clear it to reach the aptitude paper.',
  },
  sections: [
    {
      id: 'communication',
      name: 'Communication Assessment (SVAR / AMCAT)',
      questions: 60,
      minutes: 58,
      topicIds: ['va-reading-comprehension', 'va-sentence-structure-voice-speech', 'va-para-jumbles', 'va-tenses-verbs', 'va-subject-verb-agreement-pronouns'],
      coverage: 'partial',
      coverageNote:
        'Reading sentences aloud, repeating sentences, jumbled sentences, spoken question-and-answer, and a short story retelling — AI-scored for fluency, pronunciation and grammar. Para-jumbles and grammar topics cover the written logic; speaking fluency needs daily read-aloud practice in a quiet room with a good microphone.',
    },
    {
      id: 'numerical',
      name: 'Aptitude — Numerical Ability',
      questions: 25,
      minutes: 35,
      topicIds: [
        'qa-number-system',
        'qa-hcf-lcm',
        'qa-percentages',
        'qa-profit-loss-discount',
        'qa-speed-time-distance',
        'qa-time-work',
        'qa-ratio-proportion-partnership',
        'qa-averages',
        'qa-mixtures-alligation',
        'qa-simple-compound-interest',
        'qa-probability',
        'qa-permutations-combinations',
        'qa-data-interpretation',
        'qa-progressions',
        'qa-linear-quadratic-equations',
        'qa-mensuration',
        'qa-ages',
        'qa-surds-indices-logs',
      ],
      coverage: 'catalogue',
    },
    {
      id: 'logical',
      name: 'Aptitude — Logical Reasoning',
      questions: 35,
      minutes: 45,
      topicIds: [
        'lr-number-series',
        'lr-letter-alphanumeric-series',
        'lr-seating-arrangement',
        'lr-blood-relations',
        'lr-direction-sense',
        'lr-coding-decoding',
        'lr-syllogism',
        'lr-statement-reasoning',
        'lr-data-sufficiency',
        'lr-logical-venn-diagrams',
        'lr-cubes-dice',
        'lr-non-verbal-reasoning',
        'lr-analogy-classification',
        'lr-puzzles',
        'lr-order-ranking',
        'lr-coded-inequalities',
      ],
      coverage: 'catalogue',
      note: 'The largest block. Number series here is reported as the hardest item type; seating and blood relations are medium.',
    },
    {
      id: 'verbal',
      name: 'Aptitude — Verbal Ability',
      questions: 20,
      minutes: 20,
      topicIds: [
        'va-reading-comprehension',
        'va-sentence-correction-improvement',
        'va-error-spotting',
        'va-fill-in-the-blanks-cloze',
        'va-synonyms-antonyms',
        'va-para-jumbles',
        'va-idioms-phrases-one-word',
        'va-tenses-verbs',
        'va-subject-verb-agreement-pronouns',
        'va-parts-of-speech-articles-prepositions',
      ],
      coverage: 'catalogue',
    },
    {
      id: 'technical',
      name: 'Technical Assessment — cluster (GenC Next)',
      questions: 3,
      minutes: 120,
      topicIds: [],
      coverage: 'external',
      coverageNote:
        'Choose a cluster: (1) Java coding + SQL + Web UI (HTML/CSS/JS), or (2) Python coding + SQL + cloud-fundamentals MCQs. Three tasks in 105–120 minutes. GenC (non-Next) and BPS drives omit this. A coding / SQL track is planned in Vriddhi Prep.',
    },
  ],
  rounds: [
    { id: 'communication', name: 'Communication assessment', detail: 'About 60 AI-scored speaking and listening items in ~58 minutes. First gate for every track.', eliminator: true },
    { id: 'aptitude', name: 'Aptitude assessment', detail: 'Numerical (25) + Logical (35) + Verbal (20) in 100 minutes, sectional cut-offs.', eliminator: true },
    { id: 'technical', name: 'Technical cluster (GenC Next)', detail: 'Three hands-on tasks in the chosen cluster (Java or Python + SQL + Web UI / Cloud).', eliminator: true },
    { id: 'interview', name: 'Technical + HR interview', detail: 'Programming and SQL basics for tech tracks; domain basics and communication for BPS; then HR on flexibility, shifts and documents.' },
  ],
  strategyMd: `# How to prepare for Cognizant GenC

### The pattern in one line
Cognizant puts the **communication assessment first** — clear it or you never see the aptitude paper. The aptitude paper is **long** (80 questions in 100 minutes) with a heavy **logical reasoning** block, and GenC Next adds a hands-on **technical cluster**.

### Communication assessment (~60 items / ~58 min) — the first gate
AI-scored speaking and listening: read sentences aloud, repeat what you hear, rearrange jumbled sentences, answer short spoken questions, retell a short story. Scoring rewards **clear pronunciation, steady pace, complete grammatical sentences**. Practise for two weeks: read a newspaper paragraph aloud daily, record yourself, and listen for mumbling, dropped word endings and fillers. Use headphones with a mic in a quiet room on test day. Para-jumbles practice helps the jumbled-sentence items.

### Numerical Ability (25 Q / 35 min)
Roughly 85 seconds per question. The reported mix: **number system and HCF/LCM, percentages, profit & loss, speed-time, time-work, ratio, averages, mixtures, SI/CI, probability and P&C**, plus a small DI set. AMCAT numerical is adaptive in most drives — early accuracy raises the difficulty and your score band, so do not race the first five questions.

### Logical Reasoning (35 Q / 45 min) — the biggest block
The largest single section in any mass-recruiter test. **Number series is reported as the hardest item type** (multi-rule and alternating series); **seating arrangements and blood relations are medium**; **coding-decoding, directions, syllogisms, statement-conclusion, data sufficiency and Venn DI** are the quick scorers. Cube-folding / paper-cutting and visual reasoning also appear. Plan for 75 seconds per question: bank the quick types first, arrangements second, difficult series last.

### Verbal Ability (20 Q / 20 min)
RC, sentence correction, error spotting, fill-in-the-blanks and vocabulary. One minute each; the passages are short.

### Technical cluster (GenC Next, 3 tasks / 105–120 min)
Pick the cluster you actually know: **Java + SQL + Web UI** or **Python + SQL + Cloud MCQs**. SQL is common to both — joins, group by, sub-queries, constraints. For BCA / MCA candidates this is a natural fit; prepare one language thoroughly rather than two superficially.

### For BBA / B.Com / BA / MBA / M.Com candidates
Cognizant BPS / operations drives use the **same communication and aptitude assessments** without the technical cluster. Communication is weighted heavily for these roles — treat it as the main event. In the interview expect domain basics (accounting for B.Com, business concepts for BBA / MBA), typing speed and shift flexibility.

### Four-week plan
- Weeks 1–2: logical reasoning topic drills (this block is 35 of 80 aptitude marks) + daily 10-minute read-aloud practice.
- Week 3: numerical and verbal drills, one AMCAT-style sectional mock per day.
- Week 4: two full sequences (communication → aptitude); GenC Next candidates add one SQL and one coding task per day.

### What trips candidates up
- Treating the communication test as a formality and failing the first gate.
- Rushing the adaptive early questions and locking into a low difficulty band.
- Running out of time in the 35-question logical block by starting with hard series.
- Choosing the technical cluster by package rather than by what you know.`,
  quickTips: [
    'Communication assessment is the FIRST gate — practise read-aloud daily for two weeks.',
    'Logical reasoning is 35 of 80 aptitude questions; bank the quick types first.',
    'AMCAT is adaptive: early accuracy matters more than early speed.',
    'Number series is reported as the hardest item type — save it for last.',
    'GenC Next: choose the technical cluster you already know; SQL is in both.',
    'Non-tech candidates take the same communication + aptitude tests without the cluster.',
  ],
  rolesMd: `Commonly reported: **GenC** (Programmer Analyst Trainee, ~₹4–4.5 LPA), **GenC Next** (~₹6.75 LPA), **GenC Pro / Elevate** (higher, with additional rounds). BPS / operations roles for non-IT graduates are typically ₹2.5–3.5 LPA. Reported figures; vary by season.`,
  patternVerifiedOn: VERIFIED,
  sources: [
    'https://www.placementpreparation.io/cognizant-genc-next/syllabus-and-test-pattern/',
    'https://unstop.com/blog/cognizant-genc-exam-pattern',
    'https://beincareer.com/cognizant-genc-2026/',
  ],
  status: 'published',
  order: 6,
}

export const SEEDED_COMPANIES: PrepCompany[] = [tcsNqt, infosys, wipro, accenture, capgemini, cognizant]

// Re-exported so tests and the seeder can assert the standard groups stay in
// sync with the aptitude catalogue.
export const COMPANY_TOPIC_GROUPS = { QA_CORE, QA_EXTENDED, LR_CORE, LR_EXTENDED, VA_CORE, VA_EXTENDED }
