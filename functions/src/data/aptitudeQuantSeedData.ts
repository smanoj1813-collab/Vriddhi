// functions/src/data/aptitudeQuantSeedData.ts
//
// Placement Aptitude — Quantitative Aptitude (shared by every UG & PG program).
//
// Syllabus map follows the standard Indian placement-prep outline (the same
// topic list PrepInsta, IndiaBix and company papers such as TCS NQT, Infosys,
// Wipro, Accenture and Capgemini use). All explanations, briefs, tricks and
// questions here are original Vriddhi content.
//
// Structure: 1 subject > 6 modules > 24 topics > 4-6 sub-topics each (with
// briefs) + 2 MCQs per topic. Same content contract as the academic seeds.

import type { PrepSubject, PrepTopic, UniversalQuestion } from '../prepShared'
import { ALL_PROGRAMS, QA_SUBJECT_ID, mcq, subs, topic } from './aptitudeShared'
import { QUANT_QUESTIONS_PART2, QUANT_TOPICS_PART2 } from './aptitudeQuantSeedData2'

const S = QA_SUBJECT_ID

export const QUANT_SUBJECT: PrepSubject = {
  id: S,
  name: 'Quantitative Aptitude',
  stream: 'aptitude',
  track: 'aptitude',
  programs: ALL_PROGRAMS,
  universityRegion: 'national',
  syllabusRef: 'Placement Aptitude — TCS NQT / Infosys / Wipro / Accenture / Capgemini pattern',
  icon: 'Calculator',
  order: 101,
  topicCount: 24,
  status: 'published',
  description:
    'Numbers, percentages and commercial arithmetic, time-speed-work, algebra and progressions, counting and probability, geometry, clocks-calendars and data interpretation — every quant area that appears in campus placement papers, with formulas, shortcuts and step-by-step methods.',
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 — NUMBER SYSTEMS
// ─────────────────────────────────────────────────────────────────────────────

const M1 = 'Module 1: Number Systems'

const qaNumberSystem = topic({
  id: 'qa-number-system',
  subjectId: S,
  title: 'Number System, Divisibility & Remainders',
  moduleNumber: 1,
  moduleName: M1,
  order: 1,
  difficulty: 'basic',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-qa-ns-01', 'q-qa-ns-02'],
  subtopicDetails: subs('qa-number-system', [
    [
      'Classification of numbers',
      'Natural (1, 2, 3, ...), whole (0 onwards), integers (negatives included), rational (p/q form, terminating or recurring decimals) and irrational (√2, π). Primes have exactly two factors; 1 is neither prime nor composite and 2 is the only even prime. Placement papers test these definitions through "which of the following is..." MCQs.',
    ],
    [
      'Divisibility rules 2 to 11',
      'By 2/5/10: look at the last digit. By 4/25: last two digits. By 8/125: last three digits. By 3/9: digit sum divisible by 3/9. By 6: divisible by both 2 and 3. By 11: (sum of digits at odd places) minus (sum at even places) is 0 or a multiple of 11. By 7: double the last digit and subtract from the rest, repeat.',
    ],
    [
      'Unit digit of large powers (cyclicity)',
      'Unit digits repeat in cycles. 0, 1, 5, 6 never change. 4 and 9 have cycle 2 (4,6 / 9,1). 2, 3, 7, 8 have cycle 4. Divide the power by the cycle length; the remainder tells which position in the cycle to pick (remainder 0 means the last position).',
    ],
    [
      'Remainders and the remainder theorem',
      'Dividend = Divisor × Quotient + Remainder. Remainders can be multiplied and added: rem(a × b) = rem(rem a × rem b). For large powers write the base as (multiple of divisor ± 1) so that the power collapses, e.g. 7^100 mod 8: 7 = 8 − 1, so remainder = (−1)^100 = 1.',
    ],
    [
      'Number of factors and sum of factors',
      'Prime-factorise N = a^p × b^q × c^r. Number of factors = (p+1)(q+1)(r+1). Sum of factors = (a^(p+1) − 1)/(a − 1) × (b^(q+1) − 1)/(b − 1) × ... Perfect squares always have an odd number of factors — a favourite trick question.',
    ],
  ]),
  explanationMd: `# Number System, Divisibility & Remainders

### Why it matters
Roughly one in five quant questions in TCS NQT, Infosys and Wipro papers is a pure number-system question, and many other topics (HCF-LCM, simplification, P&C) quietly depend on it. The good news: almost every question reduces to a handful of rules you can apply in under 30 seconds.

### The number family
- **Natural** numbers start at 1; **whole** numbers add 0; **integers** add the negatives.
- **Rational** numbers can be written as p/q (q ≠ 0) — every terminating or recurring decimal is rational. **Irrational** numbers (√2, √3, π, e) never terminate or repeat.
- **Prime** numbers have exactly two factors. There are 25 primes below 100; memorise them. **Co-prime** numbers share no factor except 1 (e.g. 8 and 15).

### Three power tools
1. **Divisibility rules** let you reject options instantly. The 3/9 rule (digit sum) and the 11 rule (alternate-sum difference) are the most tested.
2. **Cyclicity** turns "unit digit of 3^47" into a 10-second job: 3 cycles as 3, 9, 7, 1; 47 ÷ 4 leaves remainder 3, so the answer is the 3rd entry, 7.
3. **Remainder algebra**: break a big number into pieces, take each remainder, then combine. Whenever the base is one more or one less than the divisor, powers collapse to 1 or ±1.

### Factor counting
Write the number in prime-power form and add one to each exponent. 72 = 2³ × 3² gives (3+1)(2+1) = 12 factors. If the question asks for *even* factors, drop the 2⁰ option: 3 × 3 = 9 even factors and therefore 3 odd ones.

### Common traps
- 1 is not prime; 2 is prime and even.
- "Divisible by 6" needs both 2 and 3 — checking just one is the classic wrong answer.
- Remainder 0 in a cyclicity problem means "last position in the cycle", not "first".`,
  formulas: [
    {
      id: 'f-qa-ns-1',
      label: 'Number of factors',
      formula: 'If N = a^p × b^q × c^r (a, b, c prime), factors of N = (p + 1)(q + 1)(r + 1)',
      exampleQ: 'How many factors does 360 have?',
      exampleA: '360 = 2³ × 3² × 5¹, so factors = (3+1)(2+1)(1+1) = 4 × 3 × 2 = 24.',
    },
    {
      id: 'f-qa-ns-2',
      label: 'Sum of first n natural numbers, squares and cubes',
      formula: 'Σn = n(n+1)/2;  Σn² = n(n+1)(2n+1)/6;  Σn³ = [n(n+1)/2]²',
      exampleQ: 'Find 1² + 2² + ... + 10².',
      exampleA: '10 × 11 × 21 / 6 = 2310 / 6 = 385.',
    },
    {
      id: 'f-qa-ns-3',
      label: 'Division algorithm',
      formula: 'Dividend = Divisor × Quotient + Remainder  (0 ≤ Remainder < Divisor)',
      exampleQ: 'A number divided by 13 gives quotient 7 and remainder 5. Find the number.',
      exampleA: '13 × 7 + 5 = 91 + 5 = 96.',
    },
  ],
  tricks: [
    {
      id: 't-qa-ns-1',
      title: 'Cyclicity cheat-sheet',
      trick: 'Unit digits: 0,1,5,6 stay the same. 4 → 4,6 and 9 → 9,1 (cycle 2). 2 → 2,4,8,6; 3 → 3,9,7,1; 7 → 7,9,3,1; 8 → 8,4,2,6 (cycle 4). Divide the exponent by the cycle length and read off the remainder position.',
      whenToUse: 'Any "unit digit of a^b" or "last digit of a product of powers" question.',
    },
    {
      id: 't-qa-ns-2',
      title: 'Plus-one / minus-one remainder collapse',
      trick: 'Rewrite the base as (divisor × k ± 1). Then a^n leaves remainder 1 if the sign is + or if n is even; it leaves (divisor − 1) if the sign is − and n is odd.',
      whenToUse: 'Remainder of a huge power such as 9^2024 ÷ 8 or 6^51 ÷ 7.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-ns-1',
      step: 'Step 1: Identify the question type',
      detail: 'Classify it as (a) divisibility/option elimination, (b) unit digit, (c) remainder, or (d) factor counting. Each has a fixed 2-3 step recipe — do not start with brute-force multiplication.',
      questionType: 'All number-system MCQs',
    },
    {
      id: 'h-qa-ns-2',
      step: 'Step 2: Prime-factorise or reduce the base',
      detail: 'Write the number as prime powers (for factors) or as a multiple of the divisor ± small number (for remainders). Most of the arithmetic disappears at this step.',
      questionType: 'Factor count / remainder',
    },
    {
      id: 'h-qa-ns-3',
      step: 'Step 3: Sanity-check with a small case',
      detail: 'Before marking, test the pattern with a tiny exponent or number (e.g. check the cycle with 3^1 to 3^4). This catches off-by-one mistakes in cyclicity and remainder positions.',
      questionType: 'Unit digit / remainder',
    },
  ],
})

const qaHcfLcm = topic({
  id: 'qa-hcf-lcm',
  subjectId: S,
  title: 'HCF and LCM',
  moduleNumber: 1,
  moduleName: M1,
  order: 2,
  difficulty: 'basic',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-qa-hl-01', 'q-qa-hl-02'],
  subtopicDetails: subs('qa-hcf-lcm', [
    [
      'HCF and LCM by prime factorisation',
      'HCF = product of the lowest powers of common primes; LCM = product of the highest powers of all primes present. For 12 = 2² × 3 and 18 = 2 × 3²: HCF = 2 × 3 = 6, LCM = 2² × 3² = 36.',
    ],
    [
      'Division (Euclidean) method',
      'Divide the larger by the smaller, then the divisor by the remainder, until the remainder is 0; the last divisor is the HCF. Fast for large or awkward numbers where factorising is slow.',
    ],
    [
      'HCF and LCM of fractions and decimals',
      'HCF of fractions = HCF of numerators / LCM of denominators. LCM of fractions = LCM of numerators / HCF of denominators. For decimals, equalise decimal places, work with integers, then restore the decimal point.',
    ],
    [
      'Word problems: bells, lights, tiles and ropes',
      '"Together again" / "same time" / "smallest number divisible by" → LCM. "Largest tile / longest rope / maximum equal groups" → HCF. Spotting the keyword decides 90% of the question.',
    ],
    [
      'Remainder-type HCF/LCM problems',
      'Largest number dividing a, b, c leaving remainders r1, r2, r3 = HCF(a − r1, b − r2, c − r3). Smallest number leaving remainder r with each of a, b, c = LCM(a, b, c) + r. If remainders differ by the same gap (a − r constant), use LCM − gap.',
    ],
  ]),
  explanationMd: `# HCF and LCM

### The two ideas
- **HCF (GCD)** is the largest number that divides every number in the set — think "biggest common measuring stick".
- **LCM** is the smallest number every number in the set divides into — think "first moment everything lines up again".

Every word problem is a disguise for one of these. Traffic lights blinking together, bells ringing together, runners meeting at the start line, the smallest number divisible by 8, 12 and 15 — all **LCM**. Largest square tile for a floor, longest rod to measure three lengths exactly, maximum students per equal row — all **HCF**.

### Methods
1. **Prime factorisation** — most reliable for numbers under 1000.
2. **Division method** — repeated division; ideal when factorising is slow (e.g. 1001 and 385).
3. **Product rule** — for two numbers, HCF × LCM = product of the numbers. Use it to find the missing partner in one line.

### Fractions
Placement papers love this one because students invert it: HCF of fractions uses HCF of numerators **over LCM of denominators**; LCM does the opposite.

### Remainder variants
- "Greatest number that divides 62, 132 and 237 leaving remainder 2 in each case" → HCF(60, 130, 235) = 5.
- "Least number which when divided by 6, 8, 12 leaves remainder 3" → LCM(6, 8, 12) + 3 = 27.
- "Least number which when divided by 5, 6, 7 leaves remainders 3, 4, 5" → each remainder is 2 less than the divisor, so LCM(5, 6, 7) − 2 = 208.

### Traps
- HCF can never exceed the smallest number; LCM can never be smaller than the largest number. Use this to eliminate options instantly.
- The product rule (HCF × LCM = product) works for exactly **two** numbers, not three.`,
  formulas: [
    {
      id: 'f-qa-hl-1',
      label: 'Product rule (two numbers)',
      formula: 'HCF × LCM = a × b',
      exampleQ: 'The HCF and LCM of two numbers are 12 and 72. One number is 24. Find the other.',
      exampleA: 'Other = (12 × 72) / 24 = 864 / 24 = 36.',
    },
    {
      id: 'f-qa-hl-2',
      label: 'HCF and LCM of fractions',
      formula: 'HCF = HCF(numerators) / LCM(denominators);  LCM = LCM(numerators) / HCF(denominators)',
      exampleQ: 'Find the LCM of 2/3, 4/9 and 8/15.',
      exampleA: 'LCM(2, 4, 8) = 8; HCF(3, 9, 15) = 3. LCM = 8/3.',
    },
    {
      id: 'f-qa-hl-3',
      label: 'Remainder-type shortcuts',
      formula: 'Greatest divisor with remainders r1, r2 = HCF(a − r1, b − r2);  Least number with common remainder r = LCM(a, b, c) + r',
      exampleQ: 'Find the least number which leaves remainder 5 when divided by 12, 15 and 20.',
      exampleA: 'LCM(12, 15, 20) = 60, so the number is 60 + 5 = 65.',
    },
  ],
  tricks: [
    {
      id: 't-qa-hl-1',
      title: 'Keyword → operation',
      trick: '"Together / simultaneously / smallest / minimum number divisible" → LCM. "Largest / maximum / greatest length / exactly measures" → HCF.',
      whenToUse: 'Any word problem — decide LCM vs HCF before touching the numbers.',
    },
    {
      id: 't-qa-hl-2',
      title: 'Option bounds',
      trick: 'HCF ≤ smallest number and LCM ≥ largest number. Any option that breaks this is wrong without calculation.',
      whenToUse: 'Eliminating options in a hurry.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-hl-1',
      step: 'Step 1: Translate the story into HCF or LCM',
      detail: 'Underline the keyword ("together", "largest", "exactly divisible", "leaves remainder"). Write "LCM of ..." or "HCF of ..." explicitly before computing.',
      questionType: 'Word problem',
    },
    {
      id: 'h-qa-hl-2',
      step: 'Step 2: Adjust for remainders',
      detail: 'Subtract remainders before an HCF, add the common remainder after an LCM, or subtract the common gap if (divisor − remainder) is constant.',
      questionType: 'Remainder variant',
    },
    {
      id: 'h-qa-hl-3',
      step: 'Step 3: Compute with prime factors and convert units',
      detail: 'Factorise, take lowest (HCF) or highest (LCM) powers, then convert back to the unit asked (seconds → minutes, cm → m) — unit slips are the usual last-step error.',
      questionType: 'All',
    },
  ],
})

const qaSimplification = topic({
  id: 'qa-simplification',
  subjectId: S,
  title: 'Simplification, Decimals & Fractions',
  moduleNumber: 1,
  moduleName: M1,
  order: 3,
  difficulty: 'basic',
  examFrequency: 'high',
  featuredQuestionIds: ['q-qa-sim-01', 'q-qa-sim-02'],
  subtopicDetails: subs('qa-simplification', [
    [
      'BODMAS / order of operations',
      'Brackets → Orders (powers, roots) → Division and Multiplication (left to right) → Addition and Subtraction (left to right). Division and multiplication have equal priority, so 8 ÷ 2 × 4 = 16, not 1. Work brackets from the innermost outwards.',
    ],
    [
      'Fraction arithmetic and comparison',
      'Add or subtract with the LCM of denominators; multiply straight across; divide by inverting the second fraction. To compare two fractions cross-multiply: a/b > c/d if ad > bc. For several fractions convert to decimals or percentages.',
    ],
    [
      'Recurring decimals to fractions',
      'Pure recurring: write the repeating block over as many 9s as it has digits (0.272727... = 27/99 = 3/11). Mixed recurring: (whole number formed by all digits − non-repeating digits) over 9s for repeating digits followed by 0s for non-repeating ones (0.2333... = (23 − 2)/90 = 21/90 = 7/30).',
    ],
    [
      'Percentage-fraction equivalents and approximation',
      'Memorise 1/2 = 50%, 1/3 = 33.3%, 1/4 = 25%, 1/5 = 20%, 1/6 = 16.7%, 1/7 = 14.3%, 1/8 = 12.5%, 1/9 = 11.1%, 1/11 = 9.09%, 1/12 = 8.33%. Approximation questions ("?" ≈) are solved by rounding each term to a friendly number and choosing the nearest option.',
    ],
    [
      'Squares, cubes and roots',
      'Know squares to 30 and cubes to 15. Square roots of 5-6 digit perfect squares: the last digit fixes the unit digit of the root (1↔1/9, 4↔2/8, 5↔5, 6↔4/6, 9↔3/7, 0↔0), and the leading digits fix the tens digit.',
    ],
  ]),
  explanationMd: `# Simplification, Decimals & Fractions

### What examiners are really testing
Speed and discipline. Simplification questions are rarely hard; they are there to see whether you can do 30 seconds of arithmetic without slipping. Most mistakes come from (a) breaking the order of operations and (b) careless decimal placement.

### Order of operations
Work **B**rackets first, then **O**rders (indices and roots), then **D**ivision/**M**ultiplication left to right, then **A**ddition/**S**ubtraction left to right. The "left to right" part matters: 20 ÷ 5 × 2 = 8, and 10 − 4 + 2 = 8.

### Fractions without fear
- Same-denominator sums are trivial; otherwise take the LCM once and add numerators.
- Comparing fractions: cross-multiply, or convert to percentages using the equivalents table.
- Mixed numbers: convert to improper before multiplying or dividing.

### Recurring decimals
Any decimal that repeats is rational, and the conversion is mechanical: the repeating block sits over 9s. A single non-repeating digit before the block adds a 0 to the denominator. Placement papers ask this directly ("express 0.4545... as a fraction") and indirectly ("which of these is irrational?").

### Approximation questions
Bank and IT papers give expressions like 24.98% of 1199 + √627 ≈ ? Round: 25% of 1200 = 300, √625 = 25, total ≈ 325. Choose the closest option — do not compute exactly.

### Algebraic identities you will use constantly
(a + b)² = a² + 2ab + b², (a − b)² = a² − 2ab + b², a² − b² = (a + b)(a − b), a³ ± b³ = (a ± b)(a² ∓ ab + b²). They turn 102² or 48 × 52 into mental arithmetic.`,
  formulas: [
    {
      id: 'f-qa-sim-1',
      label: 'Recurring decimal to fraction',
      formula: '0.ab ab ab... = ab/99;  0.a bc bc... = (abc − a)/990',
      exampleQ: 'Express 0.1666... as a fraction.',
      exampleA: '0.1(6 recurring) = (16 − 1)/90 = 15/90 = 1/6.',
    },
    {
      id: 'f-qa-sim-2',
      label: 'Difference of squares',
      formula: 'a² − b² = (a + b)(a − b)',
      exampleQ: 'Evaluate 57 × 63 quickly.',
      exampleA: '57 × 63 = (60 − 3)(60 + 3) = 3600 − 9 = 3591.',
    },
    {
      id: 'f-qa-sim-3',
      label: 'Comparing fractions',
      formula: 'a/b > c/d  ⇔  a × d > b × c  (for positive denominators)',
      exampleQ: 'Which is larger: 7/9 or 11/14?',
      exampleA: '7 × 14 = 98 and 9 × 11 = 99, so 11/14 is larger.',
    },
  ],
  tricks: [
    {
      id: 't-qa-sim-1',
      title: 'Percentages instead of fractions',
      trick: 'To compare or add several fractions, convert each to a percentage using the 1/n table (1/8 = 12.5%, 3/8 = 37.5%, 5/8 = 62.5% ...). Decimals compare instantly.',
      whenToUse: 'Ordering fractions or checking which option is closest.',
    },
    {
      id: 't-qa-sim-2',
      title: 'Round, then correct',
      trick: 'For 19 × 47, compute 20 × 47 = 940 and subtract one 47: 893. For 4.98 × 6, do 5 × 6 = 30 minus 0.02 × 6 = 0.12 → 29.88.',
      whenToUse: 'Any multiplication near a round number; approximation questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-sim-1',
      step: 'Step 1: Rewrite the expression clearly',
      detail: 'Copy it in one line, convert mixed numbers to improper fractions and decimals like 0.25 to 1/4 where helpful. Half of all errors happen before any arithmetic starts.',
      questionType: 'Simplify / find the value of ?',
    },
    {
      id: 'h-qa-sim-2',
      step: 'Step 2: Apply BODMAS strictly, left to right within a level',
      detail: 'Resolve innermost brackets, then powers and roots, then ÷ and × as they appear, finally + and − as they appear. Write intermediate results; do not hold three numbers in your head.',
      questionType: 'Simplify',
    },
    {
      id: 'h-qa-sim-3',
      step: 'Step 3: Check the magnitude against the options',
      detail: 'Estimate the answer to one significant figure. If your exact answer is not in the same neighbourhood as the estimate, a decimal point or sign slipped.',
      questionType: 'Simplify / approximation',
    },
  ],
})

const qaSurdsIndicesLogs = topic({
  id: 'qa-surds-indices-logs',
  subjectId: S,
  title: 'Surds, Indices & Logarithms',
  moduleNumber: 1,
  moduleName: M1,
  order: 4,
  difficulty: 'core',
  examFrequency: 'high',
  audience: ['ug', 'pg', 'tech'],
  featuredQuestionIds: ['q-qa-sil-01', 'q-qa-sil-02'],
  subtopicDetails: subs('qa-surds-indices-logs', [
    [
      'Laws of indices',
      'a^m × a^n = a^(m+n); a^m ÷ a^n = a^(m−n); (a^m)^n = a^(mn); (ab)^n = a^n b^n; a^0 = 1; a^(−n) = 1/a^n; a^(p/q) = q-th root of a^p. Questions give an equation like 4^(x+1) = 64 and expect you to equalise bases.',
    ],
    [
      'Surds: simplifying and rationalising',
      'A surd is an irrational root such as √12 = 2√3. Rationalise a denominator by multiplying by its conjugate: 1/(√5 − 2) × (√5 + 2)/(√5 + 2) = √5 + 2. Conjugate pairs multiply to a rational number via a² − b².',
    ],
    [
      'Comparing surds',
      'To compare ∛2 and √3, raise both to the LCM of the root orders (6): 2² = 4 versus 3³ = 27, so √3 is larger. Alternatively square both when both are square roots.',
    ],
    [
      'Laws of logarithms',
      'log(mn) = log m + log n; log(m/n) = log m − log n; log m^n = n log m; log_b a = log a / log b (base change); log_a a = 1; log 1 = 0; a^(log_a x) = x. Default base in placement papers is 10 unless written "ln".',
    ],
    [
      'Characteristic, mantissa and number of digits',
      'For N > 1, the number of digits in N = floor(log10 N) + 1. Given log 2 = 0.3010 and log 3 = 0.4771, you can compute the logs of 4, 5 (= 1 − log 2), 6, 8, 9, 12 and so on. "How many digits are in 2^50?" → 50 × 0.3010 = 15.05 → 16 digits.',
    ],
  ]),
  explanationMd: `# Surds, Indices & Logarithms

### Indices
Every index question is solved by **making the bases equal**. 8^x = 32 becomes 2^(3x) = 2^5, so x = 5/3. When bases cannot be equalised, take logs. Watch the difference between (a^m)^n = a^(mn) and a^(m^n), which is a tower.

Fractional and negative powers: a^(1/2) is the square root, a^(−1) is the reciprocal. 16^(−3/4) = 1 / (16^(1/4))³ = 1/8.

### Surds
A surd is a root that stays irrational. Simplify by pulling out square factors (√72 = 6√2). To remove a surd from a denominator, multiply numerator and denominator by the **conjugate** — the same expression with the middle sign flipped. Placement questions often chain this: "find the value of 1/(√2 + 1) + 1/(√3 + √2) + ..." and every term telescopes.

To compare surds of different orders, raise them to the LCM of the orders and compare the results.

### Logarithms
A logarithm is just an exponent asked backwards: log_2 8 = 3 because 2³ = 8. Three laws (product, quotient, power) plus base change cover all MCQs. Two standard values — log 2 ≈ 0.3010, log 3 ≈ 0.4771 — generate almost every other value you need (log 5 = 1 − log 2, log 6 = log 2 + log 3).

The **number of digits** trick is a placement staple: digits in N = floor(log10 N) + 1.

### Traps
- log(a + b) is **not** log a + log b.
- log of a negative number or of zero does not exist; the base must be positive and not 1.
- a^0 = 1 for any non-zero a, but 0^0 is undefined.`,
  formulas: [
    {
      id: 'f-qa-sil-1',
      label: 'Index laws',
      formula: 'a^m × a^n = a^(m+n);  (a^m)^n = a^(mn);  a^(−n) = 1/a^n;  a^(p/q) = (q-th root of a)^p',
      exampleQ: 'Evaluate (256)^0.16 × (256)^0.09.',
      exampleA: '256^(0.16 + 0.09) = 256^0.25 = (4^4)^(1/4) = 4.',
    },
    {
      id: 'f-qa-sil-2',
      label: 'Rationalisation',
      formula: '1/(√a + √b) = (√a − √b)/(a − b)',
      exampleQ: 'Simplify 1/(√7 − √5).',
      exampleA: 'Multiply by (√7 + √5)/(√7 + √5): (√7 + √5)/(7 − 5) = (√7 + √5)/2.',
    },
    {
      id: 'f-qa-sil-3',
      label: 'Log laws and digit count',
      formula: 'log(mn) = log m + log n;  log m^n = n log m;  digits in N = floor(log10 N) + 1',
      exampleQ: 'Given log 2 = 0.301, how many digits does 2^64 have?',
      exampleA: 'log(2^64) = 64 × 0.301 = 19.26, so 2^64 has 19 + 1 = 20 digits.',
    },
  ],
  tricks: [
    {
      id: 't-qa-sil-1',
      title: 'Equalise the base first',
      trick: 'Express 4, 8, 16, 32, 64 as powers of 2; 9, 27, 81 as powers of 3; 25, 125 as powers of 5. Then compare exponents directly.',
      whenToUse: 'Solving exponential equations like 9^(x−1) = 27^(x−3).',
    },
    {
      id: 't-qa-sil-2',
      title: 'Build every log from log 2 and log 3',
      trick: 'log 4 = 2 log 2, log 5 = 1 − log 2, log 6 = log 2 + log 3, log 8 = 3 log 2, log 9 = 2 log 3, log 12 = 2 log 2 + log 3, log 15 = log 3 + 1 − log 2.',
      whenToUse: 'Any "given log 2 and log 3, find log ..." question.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-sil-1',
      step: 'Step 1: Convert everything to the same form',
      detail: 'Same base for indices, same root order for surds, same log base for logs. Do this before any simplification.',
      questionType: 'Index / surd / log equation',
    },
    {
      id: 'h-qa-sil-2',
      step: 'Step 2: Apply exactly one law per line',
      detail: 'Product, quotient or power rule — one at a time, writing each step. Combining two rules mentally is where sign and exponent errors creep in.',
      questionType: 'Simplification',
    },
    {
      id: 'h-qa-sil-3',
      step: 'Step 3: Verify by substituting back',
      detail: 'Plug your x into the original equation, or square your simplified surd to confirm it equals the original. Takes 10 seconds and catches most slips.',
      questionType: 'Equation solving',
    },
  ],
})

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 — PERCENTAGES & COMMERCIAL ARITHMETIC
// ─────────────────────────────────────────────────────────────────────────────

const M2 = 'Module 2: Percentages & Commercial Arithmetic'

const qaPercentages = topic({
  id: 'qa-percentages',
  subjectId: S,
  title: 'Percentages',
  moduleNumber: 2,
  moduleName: M2,
  order: 5,
  difficulty: 'basic',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-qa-pct-01', 'q-qa-pct-02'],
  subtopicDetails: subs('qa-percentages', [
    [
      'Fraction ↔ percentage conversions',
      'Percent means "per hundred". x% of N = (x/100) × N. Memorise the reciprocal table (1/6 = 16.67%, 1/7 = 14.28%, 1/8 = 12.5%, 1/9 = 11.11%, 1/11 = 9.09%, 1/12 = 8.33%, 1/16 = 6.25%) so that 37.5% of 640 becomes 3/8 × 640 = 240 mentally.',
    ],
    [
      'Percentage change and successive change',
      '% change = (new − old)/old × 100 — always divide by the original. Two successive changes of a% and b% combine to a + b + ab/100 (use negative signs for decreases). A 20% rise followed by a 20% fall is a net 4% fall, never zero.',
    ],
    [
      'Growth, depreciation and population',
      'Value after n periods at r% per period = P × (1 + r/100)^n for growth and P × (1 − r/100)^n for depreciation. Two years back from the present: divide by (1 + r/100)² rather than subtracting twice.',
    ],
    [
      'Comparing two quantities (A vs B)',
      'If A is x% more than B, then B is x/(100 + x) × 100 % less than A. If A is x% less than B, then B is x/(100 − x) × 100 % more than A. Example: A is 25% more than B → B is 20% less than A.',
    ],
    [
      'Price–consumption–expenditure',
      'Expenditure = price × consumption. If price rises x% and expenditure must stay constant, cut consumption by x/(100 + x) × 100 %. If price falls x%, consumption can rise by x/(100 − x) × 100 %.',
    ],
    [
      'Exam and election questions',
      '"A candidate got 40% votes and lost by 3000" → margin = 20% of total. "Student scored 30%, failed by 15; another scored 45%, passed by 30" → 15% of total = 45, total = 300, pass mark = 105. Set up the difference equation directly.',
    ],
  ]),
  explanationMd: `# Percentages

### The single most reusable topic
Percentages feed profit & loss, interest, data interpretation, mixtures and growth problems. Master this and a third of quant becomes arithmetic you already know.

### Think in fractions
37.5% is 3/8, 62.5% is 5/8, 83.33% is 5/6, 14.28% is 1/7. A question like "16.67% of 1080" becomes 1080/6 = 180. Placement papers pick these numbers deliberately.

### Percentage change
Always divide by the **original** value. A rise from 80 to 100 is +25%; the fall from 100 to 80 is −20%. This asymmetry is the source of the "A is 25% more than B, so B is 20% less than A" family.

### Successive changes — one formula
Two changes of a% then b% give a net change of **a + b + ab/100**. Use signs: +20 then −20 gives 20 − 20 − 4 = −4%. Three changes: apply it twice. The same formula gives the area change of a rectangle when length and breadth change, and the equivalent single discount for successive discounts.

### Expenditure problems
When price rises by x% and you want to spend the same amount, reduce consumption by x/(100 + x). Sugar up 25% → cut consumption by 25/125 = 20%. Notice this is the same "reverse percentage" idea as A vs B comparisons.

### Multiplying factor habit
Write "increase by 15%" as × 1.15 and "decrease by 30%" as × 0.70. Chains of changes become one multiplication, and reversing a change becomes a division.

### Traps
- Percentage **points** versus percent: moving from 10% to 15% is a 5-point rise but a 50% increase.
- Averages of percentages are only valid when the bases are equal.
- "Increased **to** 150%" is different from "increased **by** 150%".`,
  formulas: [
    {
      id: 'f-qa-pct-1',
      label: 'Successive percentage change',
      formula: 'Net % = a + b + (a × b)/100   (use negative values for decreases)',
      exampleQ: 'A salary rises 10% and then falls 10%. Net change?',
      exampleA: '10 − 10 + (10 × −10)/100 = −1%. A 1% decrease.',
    },
    {
      id: 'f-qa-pct-2',
      label: 'Reverse comparison',
      formula: 'If A is x% more than B, B is [x/(100 + x)] × 100 % less than A',
      exampleQ: 'Ravi earns 25% more than Sita. By what percent does Sita earn less than Ravi?',
      exampleA: '25/(100 + 25) × 100 = 25/125 × 100 = 20%.',
    },
    {
      id: 'f-qa-pct-3',
      label: 'Compound growth / depreciation',
      formula: 'Final = Initial × (1 ± r/100)^n',
      exampleQ: 'A town of 50,000 grows 4% a year. Population after 2 years?',
      exampleA: '50,000 × 1.04 × 1.04 = 50,000 × 1.0816 = 54,080.',
    },
  ],
  tricks: [
    {
      id: 't-qa-pct-1',
      title: 'Swap the percent and the number',
      trick: 'x% of y = y% of x. So 8% of 25 = 25% of 8 = 2, and 36% of 50 = 50% of 36 = 18.',
      whenToUse: 'Whenever one of the two numbers is a "nice" percentage like 25, 50 or 12.5.',
    },
    {
      id: 't-qa-pct-2',
      title: 'Multiplying factors for chains',
      trick: 'Turn each change into a factor (×1.2, ×0.85) and multiply once. To undo a 20% rise, divide by 1.2 — do not subtract 20%.',
      whenToUse: 'Population, price and salary chains; "find the original value" questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-pct-1',
      step: 'Step 1: Fix the base',
      detail: 'Ask "percent of what?". Write the base quantity explicitly. Nearly every wrong answer in percentages comes from dividing by the new value instead of the original.',
      questionType: 'All percentage MCQs',
    },
    {
      id: 'h-qa-pct-2',
      step: 'Step 2: Convert to a fraction or a multiplying factor',
      detail: 'Use the 1/n table for the calculation or write the change as ×(1 ± r/100). Chain factors if there are multiple changes.',
      questionType: 'Percentage of / successive change',
    },
    {
      id: 'h-qa-pct-3',
      step: 'Step 3: Assume 100 when no value is given',
      detail: 'If the question only talks in percentages, let the starting quantity be 100 (or 1000 if fractions appear). The answer will be a percentage of that, directly readable.',
      questionType: 'Comparison / expenditure',
    },
  ],
})

const qaProfitLoss = topic({
  id: 'qa-profit-loss-discount',
  subjectId: S,
  title: 'Profit, Loss & Discount',
  moduleNumber: 2,
  moduleName: M2,
  order: 6,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-qa-pl-01', 'q-qa-pl-02'],
  subtopicDetails: subs('qa-profit-loss-discount', [
    [
      'Cost price, selling price and profit percent',
      'Profit = SP − CP; Profit % = Profit/CP × 100 — always on cost price unless the question says otherwise. SP = CP × (100 + P%)/100 for profit and CP × (100 − L%)/100 for loss. To find CP from SP, divide by the same factor.',
    ],
    [
      'Marked price and discount',
      'Discount is always on the marked (list) price: SP = MP × (100 − D%)/100. Shopkeepers mark up above CP and then discount, so combine: SP = CP × (1 + markup) × (1 − discount). "Marks 40% above cost and gives 20% discount" → 1.4 × 0.8 = 1.12 → 12% profit.',
    ],
    [
      'Successive discounts',
      'Two discounts of a% and b% equal a single discount of a + b − ab/100. Three discounts: apply twice. A "buy 3 get 1 free" offer is a 25% discount (1 free out of 4), not 33%.',
    ],
    [
      'Same SP, equal % gain and loss',
      'Selling two items at the same price, one at x% profit and the other at x% loss, always gives an overall loss of (x/10)² %. With 20% each way the net loss is 4%. This is a guaranteed placement question.',
    ],
    [
      'Dishonest dealer and false weights',
      'A trader who claims to sell at cost but uses a 900 g weight for 1 kg gains error/(true − error) × 100 = 100/900 × 100 = 11.11%. If he also marks up, multiply the factors.',
    ],
    [
      'Selling to gain a target percent',
      '"By selling 20 pens a trader gains the SP of 5 pens" → profit = 5 SP, cost = 15 SP, profit % = 5/15 = 33.33%. "CP of 12 articles = SP of 10" → profit % = (12 − 10)/10 = 20%. Work with the counts, not with rupees.',
    ],
  ]),
  explanationMd: `# Profit, Loss & Discount

### Three prices to keep separate
- **Cost price (CP)** — what the seller paid.
- **Marked price (MP)** — the label price.
- **Selling price (SP)** — what the buyer finally pays.

Profit or loss is measured against **CP**; discount is measured against **MP**. Mixing these two bases is the most common error in the topic.

### Multiplying factors again
Write every step as a factor: 25% profit → × 1.25, 10% discount → × 0.9. A dealer who marks up 50% and offers 20% off sells at CP × 1.5 × 0.8 = CP × 1.2, a 20% profit. To reverse (find CP from SP), divide.

### The classic patterns
1. **Equal gain and loss percentage at the same SP** — always a loss of (x/10)² %. Two items sold at Rs 1200 each, 20% gain and 20% loss → net 4% loss.
2. **Successive discounts** — combine with a + b − ab/100. 20% and 10% → 28%, never 30%.
3. **"CP of m articles = SP of n articles"** — profit % = (m − n)/n × 100.
4. **False weights** — gain % = error/(true weight − error) × 100.
5. **Percent on SP** — if profit is given as a percentage of SP, convert: profit 20% of SP means SP = CP × 1.25 (profit is 25% of CP).

### Reading the question
"Gains 20% on selling price" and "gains 20%" are different questions. "Marked 30% above cost" and "sold at 30% profit" are different prices. Underline which price each percentage refers to before writing anything.

### Quick estimate check
If a shopkeeper discounts more than he marked up, he must be in loss; if the discount is smaller than the markup the profit is *less* than the difference (because of the −ab/100 term). Use this to sanity-check options.`,
  formulas: [
    {
      id: 'f-qa-pl-1',
      label: 'Profit / loss percent',
      formula: 'Profit % = (SP − CP)/CP × 100;   SP = CP × (100 ± P%)/100',
      exampleQ: 'A chair bought for Rs 800 is sold at 15% profit. Find the SP.',
      exampleA: 'SP = 800 × 115/100 = Rs 920.',
    },
    {
      id: 'f-qa-pl-2',
      label: 'Successive discounts / markup then discount',
      formula: 'Single equivalent = a + b − ab/100;   SP = CP × (1 + m/100) × (1 − d/100)',
      exampleQ: 'An item is marked 60% above cost and sold at a 25% discount. Profit %?',
      exampleA: '1.6 × 0.75 = 1.2, so profit is 20%.',
    },
    {
      id: 'f-qa-pl-3',
      label: 'Equal % gain and loss at same SP',
      formula: 'Net result = loss of (x/10)² %',
      exampleQ: 'Two watches sold at Rs 1980 each, one at 10% profit, one at 10% loss. Net?',
      exampleA: 'Loss of (10/10)² = 1% on the total cost.',
    },
  ],
  tricks: [
    {
      id: 't-qa-pl-1',
      title: 'Percent of SP → percent of CP',
      trick: 'Profit of p% on SP equals profit of p/(100 − p) × 100 % on CP. Loss of l% on SP equals l/(100 + l) × 100 % on CP.',
      whenToUse: 'Questions that state the gain or loss "on the selling price".',
    },
    {
      id: 't-qa-pl-2',
      title: 'Free-item offers as discounts',
      trick: '"Buy n get k free" is a discount of k/(n + k) × 100 %. Buy 2 get 1 free = 33.3%; buy 4 get 1 free = 20%.',
      whenToUse: 'Offer comparison questions in retail-style DI sets.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-pl-1',
      step: 'Step 1: Label each price and each percentage base',
      detail: 'Write CP, MP, SP on separate lines. Next to each percentage note whether it is "of CP", "of MP" or "of SP".',
      questionType: 'All profit-loss MCQs',
    },
    {
      id: 'h-qa-pl-2',
      step: 'Step 2: Chain multiplying factors from CP to SP',
      detail: 'SP = CP × (markup factor) × (discount factor). If the question gives SP and asks CP, divide by the same factors in reverse.',
      questionType: 'Markup / discount / find CP',
    },
    {
      id: 'h-qa-pl-3',
      step: 'Step 3: Assume CP = 100 when no rupee value is given',
      detail: 'Pure-percentage questions become trivial with CP = 100 (or 100 per article). The final SP minus 100 is the profit percent directly.',
      questionType: 'Percent-only questions',
    },
  ],
})

const qaInterest = topic({
  id: 'qa-simple-compound-interest',
  subjectId: S,
  title: 'Simple & Compound Interest',
  moduleNumber: 2,
  moduleName: M2,
  order: 7,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-qa-int-01', 'q-qa-int-02'],
  subtopicDetails: subs('qa-simple-compound-interest', [
    [
      'Simple interest and amount',
      'SI = P × R × T / 100 and Amount = P + SI. Interest is linear in time, so money doubles in 100/R years and triples in 200/R years at simple interest. If the amount is given at two different times, the difference is pure interest for the gap.',
    ],
    [
      'Compound interest: annual compounding',
      'A = P(1 + R/100)^n and CI = A − P. Each year interest is earned on the previous amount. The first-year CI equals the SI; the difference starts in year two.',
    ],
    [
      'Half-yearly, quarterly and mixed rates',
      'Compounded half-yearly: rate becomes R/2 and periods 2n. Quarterly: R/4 and 4n. Different rates in different years: multiply the factors (1 + r1/100)(1 + r2/100)... Fractional years at CI: compound for whole years, then apply simple interest for the fraction.',
    ],
    [
      'Difference between CI and SI',
      'For 2 years: CI − SI = P(R/100)². For 3 years: P(R/100)² × (3 + R/100). These two formulas answer a whole family of "find the principal / find the rate" questions in one line.',
    ],
    [
      'Instalments and depreciation',
      'Equal annual instalment X that clears a loan P in n years at CI: P = X/(1 + r) + X/(1 + r)² + ... For depreciation use A = P(1 − R/100)^n. "Rule of 72": years to double at CI ≈ 72/R.',
    ],
  ]),
  explanationMd: `# Simple & Compound Interest

### The difference in one sentence
Simple interest is earned only on the original principal; compound interest is earned on the principal **plus** all interest accumulated so far. In year one they are identical; from year two compound pulls ahead.

### Simple interest
SI = PRT/100. Because it is linear, ratios work directly: if SI for 3 years is 900, SI for 5 years is 1500. "Sum becomes 3 times in 10 years" means interest = 2P in 10 years, so R = 20%.

### Compound interest
A = P(1 + R/100)^n. Memorise the factors: 1.1² = 1.21, 1.1³ = 1.331, 1.2² = 1.44, 1.05² = 1.1025, 1.25² = 1.5625. A question like "CI on 8000 at 10% for 3 years" is 8000 × 0.331 = 2648 without a calculator.

**Compounding frequency**: halve the rate and double the periods for half-yearly; quarter the rate and quadruple the periods for quarterly. More frequent compounding means slightly more interest.

### CI − SI shortcuts
- 2 years: P(R/100)²
- 3 years: P(R/100)²(3 + R/100)

These let you back out the principal or rate instantly. "Difference between CI and SI for 2 years at 5% is Rs 25" → P × 0.0025 = 25 → P = 10,000.

### Successive-percentage view
CI is just successive percentage increase. Two years at 10% = 10 + 10 + 1 = 21% total, which is exactly the a + b + ab/100 formula from percentages. Seeing the connection saves memorising anything new.

### Traps
- "Per annum compounded half-yearly" — the rate given is annual; halve it.
- CI questions asking for **interest** versus **amount** — subtract P when they ask for interest.
- Depreciation uses (1 − R/100); do not simply subtract R% × n.`,
  formulas: [
    {
      id: 'f-qa-int-1',
      label: 'Simple interest',
      formula: 'SI = P × R × T / 100;   Amount = P + SI',
      exampleQ: 'Find the SI on Rs 6000 at 8% per annum for 2.5 years.',
      exampleA: '6000 × 8 × 2.5 / 100 = Rs 1200.',
    },
    {
      id: 'f-qa-int-2',
      label: 'Compound amount',
      formula: 'A = P (1 + R/100)^n;   half-yearly: R → R/2, n → 2n',
      exampleQ: 'Find the CI on Rs 10,000 at 10% per annum for 2 years.',
      exampleA: 'A = 10,000 × 1.1² = 12,100; CI = 12,100 − 10,000 = Rs 2100.',
    },
    {
      id: 'f-qa-int-3',
      label: 'CI − SI difference',
      formula: '2 years: P (R/100)²;   3 years: P (R/100)² (3 + R/100)',
      exampleQ: 'The difference between CI and SI on a sum for 2 years at 4% is Rs 32. Find the sum.',
      exampleA: 'P × (0.04)² = 32 → P × 0.0016 = 32 → P = Rs 20,000.',
    },
  ],
  tricks: [
    {
      id: 't-qa-int-1',
      title: 'Effective rate table',
      trick: '2 years at R% compound = 2R + R²/100 % overall. 10% → 21%, 20% → 44%, 5% → 10.25%, 8% → 16.64%. 3 years at 10% → 33.1%.',
      whenToUse: 'Any 2- or 3-year CI question at a standard rate.',
    },
    {
      id: 't-qa-int-2',
      title: 'Doubling time',
      trick: 'Simple interest doubles in 100/R years. Compound interest doubles in about 72/R years (Rule of 72). If a sum doubles in n years at CI, it becomes 4× in 2n years and 8× in 3n years.',
      whenToUse: '"In how many years will the money become 4 times / 8 times" questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-int-1',
      step: 'Step 1: Extract P, R, T and the compounding frequency',
      detail: 'Write them on one line. Convert months to years (SI) and adjust R and n for half-yearly or quarterly compounding (CI) before anything else.',
      questionType: 'All interest questions',
    },
    {
      id: 'h-qa-int-2',
      step: 'Step 2: Decide whether the question wants interest or amount',
      detail: 'Underline "interest" or "amount". For CI compute the amount with the factor table, then subtract P only if interest is asked.',
      questionType: 'CI / SI computation',
    },
    {
      id: 'h-qa-int-3',
      step: 'Step 3: For unknown P or R, use the difference formula or ratios',
      detail: 'CI − SI differences give P or R directly. For SI, use proportion: interest scales linearly with both time and rate.',
      questionType: 'Reverse questions',
    },
  ],
})

const qaRatio = topic({
  id: 'qa-ratio-proportion-partnership',
  subjectId: S,
  title: 'Ratio, Proportion & Partnership',
  moduleNumber: 2,
  moduleName: M2,
  order: 8,
  difficulty: 'basic',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-qa-rp-01', 'q-qa-rp-02'],
  subtopicDetails: subs('qa-ratio-proportion-partnership', [
    [
      'Ratio basics and the k-method',
      'A ratio a : b compares two quantities of the same unit. Write actual values as ak and bk, then solve for k from any absolute information. Ratios can be scaled but never added across different totals without a common base.',
    ],
    [
      'Combining ratios',
      'If A : B = 2 : 3 and B : C = 4 : 5, make B equal (12) → A : B : C = 8 : 12 : 15. Compound ratio of a : b and c : d is ac : bd. Duplicate ratio is a² : b²; sub-duplicate is √a : √b.',
    ],
    [
      'Proportion: mean, third and fourth proportional',
      'a : b :: c : d means ad = bc. Mean proportional between a and b is √(ab). Third proportional to a, b is b²/a. Fourth proportional to a, b, c is bc/a. Componendo-dividendo: if a/b = c/d then (a + b)/(a − b) = (c + d)/(c − d).',
    ],
    [
      'Direct and inverse variation',
      'Direct: y = kx (more workers, more output). Inverse: xy = k (more speed, less time). Joint variation questions (men-days-hours) reduce to the chain rule M1 D1 H1 / W1 = M2 D2 H2 / W2.',
    ],
    [
      'Partnership: capital × time',
      'Profit is shared in the ratio of (capital × months invested). If capitals change midway, split each partner into segments and add. A working partner may take a salary or commission first; share the remainder.',
    ],
    [
      'Coins and mixtures by ratio',
      '"A bag has 1-rupee, 50-paise and 25-paise coins in ratio 3 : 4 : 5 totalling Rs 150" → value ratio = 3 : 2 : 1.25 → multiply by 4 → 12 : 8 : 5 (units of 25 paise) and solve for k. Convert coin counts to value before equating to the total.',
    ],
  ]),
  explanationMd: `# Ratio, Proportion & Partnership

### Ratio is a comparison, not a quantity
"Boys : girls = 3 : 5" tells you the shape of the split, not the numbers. The moment you write boys = 3k and girls = 5k, every sentence in the question becomes an equation in k. This **k-method** is the single technique that solves most ratio questions.

### Chaining ratios
When two ratios share a term, scale both so the shared term matches. A : B = 3 : 4 and B : C = 6 : 7 → make B = 12 → A : B : C = 9 : 12 : 14. Multiply through, never add.

### Proportion
Four numbers are in proportion when the product of extremes equals the product of means (ad = bc). The special cases — mean proportional √(ab), third proportional b²/a — appear as one-liners in Infosys and Accenture papers.

**Componendo-dividendo** is a time saver: from (x + y)/(x − y) = 7/3 you can jump straight to x/y = (7 + 3)/(7 − 3) = 5/2.

### Variation
Direct variation keeps the ratio constant; inverse variation keeps the product constant. Most work-and-time and speed questions are variation in disguise.

### Partnership
Each partner's share is proportional to **capital × time**. A invests 20,000 for 12 months and B invests 30,000 for 8 months → 240,000 : 240,000 → equal shares. When a partner joins late or withdraws early, only the months actually invested count.

### Traps
- Ratios have no units; make sure both quantities are in the same unit before comparing (km vs m, rupees vs paise).
- "Increased in the ratio 4 : 5" means multiply by 5/4.
- In partnership, a sleeping partner gets no salary but still shares profit by capital-time.`,
  formulas: [
    {
      id: 'f-qa-rp-1',
      label: 'Proportion and mean proportional',
      formula: 'a : b :: c : d  ⇔  a × d = b × c;   mean proportional of a, b = √(a × b)',
      exampleQ: 'Find the mean proportional between 9 and 16.',
      exampleA: '√(9 × 16) = √144 = 12.',
    },
    {
      id: 'f-qa-rp-2',
      label: 'Partnership profit share',
      formula: 'Share of A : Share of B = (C_A × T_A) : (C_B × T_B)',
      exampleQ: 'A puts in Rs 40,000 for a year; B puts in Rs 60,000 for 6 months. Divide a profit of Rs 21,000.',
      exampleA: '40 × 12 : 60 × 6 = 480 : 360 = 4 : 3. A gets 12,000 and B gets 9,000.',
    },
    {
      id: 'f-qa-rp-3',
      label: 'Componendo-dividendo',
      formula: 'If a/b = c/d then (a + b)/(a − b) = (c + d)/(c − d)',
      exampleQ: 'If (3x + 2y)/(3x − 2y) = 5/1, find x : y.',
      exampleA: '3x/2y = (5 + 1)/(5 − 1) = 6/4 = 3/2, so x/y = 1 → x : y = 1 : 1.',
    },
  ],
  tricks: [
    {
      id: 't-qa-rp-1',
      title: 'Make the middle term equal',
      trick: 'To merge A : B and B : C, multiply the first ratio by C-side value of B and the second by A-side value of B (i.e. cross-scale to the LCM of the two B values).',
      whenToUse: 'Three-quantity ratio questions and "find A : C".',
    },
    {
      id: 't-qa-rp-2',
      title: 'Total must be a multiple of the ratio sum',
      trick: 'If amounts are split 2 : 3 : 4, the total is a multiple of 9. Any option that fails this divisibility check is wrong.',
      whenToUse: 'Eliminating options in distribution questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-rp-1',
      step: 'Step 1: Write quantities as multiples of k',
      detail: 'Assign 3k, 5k, etc. Convert any absolute statement ("girls are 20 more than boys", "total is 480") into an equation and solve for k.',
      questionType: 'Ratio word problem',
    },
    {
      id: 'h-qa-rp-2',
      step: 'Step 2: Match units and time periods',
      detail: 'In partnership convert everything to months; in coin problems convert counts to value; in mixtures convert to the same unit before forming the ratio.',
      questionType: 'Partnership / coins',
    },
    {
      id: 'h-qa-rp-3',
      step: 'Step 3: Re-form the ratio in lowest terms and answer the exact question',
      detail: 'Questions often ask for one share, the difference between two shares, or the new ratio after a change. Read the last line again before marking.',
      questionType: 'All',
    },
  ],
})

const qaAverages = topic({
  id: 'qa-averages',
  subjectId: S,
  title: 'Averages',
  moduleNumber: 2,
  moduleName: M2,
  order: 9,
  difficulty: 'basic',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-qa-avg-01', 'q-qa-avg-02'],
  subtopicDetails: subs('qa-averages', [
    [
      'Average as an equaliser',
      'Average = sum / count, and therefore sum = average × count. Most questions are really about the sum: find the total, adjust it, divide again. Averages of averages are only valid when group sizes are equal.',
    ],
    [
      'Averages of sequences',
      'For an AP (consecutive numbers, evens, odds) the average equals the middle term, or the mean of first and last. Average of first n natural numbers = (n + 1)/2; of first n even numbers = n + 1; of first n odd numbers = n.',
    ],
    [
      'Adding, removing or replacing a member',
      'If a new person raises the average of n people by d, the newcomer weighs (old average + (n + 1) × d). If a replacement changes the average of n by d, new person = old person ± n × d. Work with the change in total, not the whole sum.',
    ],
    [
      'Weighted average',
      'When groups of different sizes are combined, weight each average by its size: (n1 a1 + n2 a2)/(n1 + n2). The combined average always lies between the two and closer to the larger group — the alligation cross gives the ratio.',
    ],
    [
      'Average speed',
      'Average speed = total distance / total time — never the mean of speeds. For equal distances at speeds x and y it is 2xy/(x + y); for equal times it is (x + y)/2.',
    ],
    [
      'Cricket, age and misread-value problems',
      '"Batsman scores 87 in the 17th innings and raises average by 3" → new average = 87 − 16 × 3 = 39. "A number was misread as 28 instead of 82" → correct sum = wrong sum + 54. Both are total-adjustment questions.',
    ],
  ]),
  explanationMd: `# Averages

### Think in totals
The average is just the total shared out equally. Every average question is faster when you switch to the **total**: find it, adjust it for whatever changed, and divide again. Writing "sum = n × average" as the first line solves half the topic.

### Sequences
Numbers in arithmetic progression have their average at the exact middle. So the average of 11 consecutive integers starting at 30 is the 6th one, 35 — no addition needed. Average of first n natural numbers is (n + 1)/2, first n evens is n + 1, first n odds is n.

### The "change in total" method
When someone joins, leaves or is replaced, only the change matters:
- New member raises average of n by d → the new member is (old average) + (n + 1) d.
- Replacement raises average of n by d → new person = person replaced + n × d.

Example: replacing a 65 kg student in a class of 30 raises the average by 0.5 kg → newcomer = 65 + 30 × 0.5 = 80 kg.

### Weighted averages
Combining groups of unequal size needs weights. The combined mean sits closer to the bigger group. The alligation cross (see Mixtures) gives the ratio of group sizes from the three averages.

### Average speed
The famous trap. Going at 60 km/h and returning at 40 km/h is **not** 50 km/h; it is 2 × 60 × 40 / 100 = 48 km/h, because more time is spent at the slower speed. Only when *times* are equal is the plain mean correct.

### Traps
- "Average of the remaining" after removing members — subtract the removed sum and the removed count.
- Ages: everyone's age increases by the same amount over time, so the average rises by exactly that amount.
- Misread-value questions only need the difference between the wrong and right value.`,
  formulas: [
    {
      id: 'f-qa-avg-1',
      label: 'Basic and weighted average',
      formula: 'Average = Sum / n;   Weighted average = (n1 a1 + n2 a2) / (n1 + n2)',
      exampleQ: '30 students average 60 marks and 20 students average 75. Class average?',
      exampleA: '(30 × 60 + 20 × 75)/50 = (1800 + 1500)/50 = 66.',
    },
    {
      id: 'f-qa-avg-2',
      label: 'Replacement change',
      formula: 'New member = Replaced member ± n × (change in average)',
      exampleQ: 'Replacing a 56 kg person in a group of 8 raises the average by 2.5 kg. Weight of the new person?',
      exampleA: '56 + 8 × 2.5 = 56 + 20 = 76 kg.',
    },
    {
      id: 'f-qa-avg-3',
      label: 'Average speed for equal distances',
      formula: 'Average speed = 2xy / (x + y)',
      exampleQ: 'A car goes to a town at 60 km/h and returns at 40 km/h. Average speed?',
      exampleA: '2 × 60 × 40 / (60 + 40) = 4800/100 = 48 km/h.',
    },
  ],
  tricks: [
    {
      id: 't-qa-avg-1',
      title: 'Assumed-mean deviation',
      trick: 'To average 87, 92, 78, 95, 83: assume 85, deviations +2, +7, −7, +10, −2 sum to +10 over 5 numbers → 85 + 2 = 87. Far faster than adding five 2-digit numbers.',
      whenToUse: 'Averaging a list of similar-sized numbers under time pressure.',
    },
    {
      id: 't-qa-avg-2',
      title: 'Innings shortcut',
      trick: 'Score in nth innings that raises the average by d → new average = score − (n − 1) d. If the average falls by d → new average = score + (n − 1) d.',
      whenToUse: 'Cricket-average questions (very common in TCS and Wipro).',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-avg-1',
      step: 'Step 1: Convert every average to a total',
      detail: 'Write sum = average × count for each group or time point mentioned. Do not manipulate averages directly.',
      questionType: 'All average questions',
    },
    {
      id: 'h-qa-avg-2',
      step: 'Step 2: Apply the change to the total',
      detail: 'Add the newcomer, subtract the leaver, or add (correct − wrong) for a misread value. Update the count as well.',
      questionType: 'Join / leave / replace / correction',
    },
    {
      id: 'h-qa-avg-3',
      step: 'Step 3: Divide by the new count and sanity-check the direction',
      detail: 'If a heavier person joined, the average must rise. If your answer moves the wrong way, a sign slipped.',
      questionType: 'All',
    },
  ],
})

const qaMixtures = topic({
  id: 'qa-mixtures-alligation',
  subjectId: S,
  title: 'Mixtures & Alligation',
  moduleNumber: 2,
  moduleName: M2,
  order: 10,
  difficulty: 'core',
  examFrequency: 'high',
  featuredQuestionIds: ['q-qa-mix-01', 'q-qa-mix-02'],
  subtopicDetails: subs('qa-mixtures-alligation', [
    [
      'The alligation cross',
      'When two ingredients priced C (cheaper) and D (dearer) are mixed to obtain mean price M, quantity of cheaper : quantity of dearer = (D − M) : (M − C). Draw the cross: cheaper and dearer on the left, mean in the centre, differences diagonally.',
    ],
    [
      'Mixing two solutions of different strength',
      'Concentrations behave like prices. 20% and 50% acid mixed to get 30% → ratio (50 − 30) : (30 − 20) = 2 : 1. Always allegate on the same ingredient (both "acid %" or both "water %").',
    ],
    [
      'Weighted average in reverse',
      'Alligation is the reverse of a weighted average: given the group averages and the combined average, it returns the size ratio. Use it for classes, salaries, marks, speeds — anything with two groups and a combined mean.',
    ],
    [
      'Removal and replacement',
      'From a container with V litres of pure liquid, x litres are drawn and replaced with water n times. Pure liquid left = V × (1 − x/V)^n. The ratio of pure to total after n operations is (1 − x/V)^n.',
    ],
    [
      'Mixing to earn a profit',
      '"Mix rice at 24/kg and 30/kg to sell at 30/kg with 25% profit" → required cost price = 30/1.25 = 24/kg... then allegate at that CP. Always convert the selling price back to a cost price before using the cross.',
    ],
  ]),
  explanationMd: `# Mixtures & Alligation

### One picture solves the topic
Alligation is weighted averages drawn as a cross. Put the cheaper value top-left, the dearer top-right, the mean in the middle; subtract along the diagonals. The two results, read horizontally, give the ratio of quantities:

quantity of cheaper : quantity of dearer = (dearer − mean) : (mean − cheaper)

The intuition: the mean sits closer to whichever ingredient there is more of, so the *far* difference belongs to the *larger* quantity.

### Where it applies
Prices, concentrations, average marks of two sections, average speed across two legs, profit percentages of two batches, even the ratio of boys to girls from three averages. Whenever a question says "in what ratio should ... be mixed" or gives a combined average, reach for the cross.

### Rules for using the cross
1. All three values must refer to the **same** quantity (all costs per kg, all percentage of milk).
2. The mean must lie between the two extremes; if it does not, you have used inconsistent measures (e.g. milk % against water %).
3. If the selling price is given with a profit, convert to cost price first.

### Removal and replacement
Drawing x litres from V and topping up with water, n times, leaves V(1 − x/V)^n of the original liquid. With 40 L of milk, 4 L replaced twice → 40 × 0.9² = 32.4 L of milk. When the amount removed differs each time, multiply the individual fractions.

### Traps
- Mixing a liquid with pure water: water's concentration is 0%; with pure liquid it is 100%.
- Do not allegate quantities directly when the question gives *total* amounts; allegate the rates, then scale to the total.
- In replacement questions the total volume stays constant; only composition changes.`,
  formulas: [
    {
      id: 'f-qa-mix-1',
      label: 'Alligation rule',
      formula: 'Cheaper : Dearer = (D − M) : (M − C)',
      exampleQ: 'In what ratio should tea at Rs 200/kg be mixed with tea at Rs 260/kg to sell the blend at Rs 240/kg without profit?',
      exampleA: '(260 − 240) : (240 − 200) = 20 : 40 = 1 : 2.',
    },
    {
      id: 'f-qa-mix-2',
      label: 'Removal and replacement',
      formula: 'Quantity of original liquid left = V × (1 − x/V)^n',
      exampleQ: 'From 50 L of milk, 5 L is removed and replaced with water; this is done 3 times. How much milk remains?',
      exampleA: '50 × (1 − 0.1)³ = 50 × 0.729 = 36.45 L.',
    },
  ],
  tricks: [
    {
      id: 't-qa-mix-1',
      title: 'Allegate the profit, not just the price',
      trick: 'If two lots bought at different prices are sold at one price with an overall profit, you can allegate the two individual profit percentages against the overall profit percentage to get the quantity ratio.',
      whenToUse: 'Two-batch profit questions in Capgemini / Cognizant papers.',
    },
    {
      id: 't-qa-mix-2',
      title: 'Water as 0%',
      trick: 'Diluting with pure water is alligation between the solution strength and 0. Adding pure ingredient is alligation with 100.',
      whenToUse: '"How much water should be added to ..." questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-mix-1',
      step: 'Step 1: Pick one ingredient to measure and get all three values',
      detail: 'Choose "price per kg" or "percentage of milk" and express the cheaper, dearer and mean in that measure. Convert SP to CP if profit is mentioned.',
      questionType: 'Ratio of mixing',
    },
    {
      id: 'h-qa-mix-2',
      step: 'Step 2: Draw the cross and subtract diagonally',
      detail: 'Cheaper and dearer above, mean in the centre; write (dearer − mean) under the cheaper side and (mean − cheaper) under the dearer side.',
      questionType: 'Ratio of mixing',
    },
    {
      id: 'h-qa-mix-3',
      step: 'Step 3: Scale the ratio to the actual quantities asked',
      detail: 'If the total is 60 kg and the ratio is 1 : 2, the amounts are 20 kg and 40 kg. For replacement problems, apply the (1 − x/V)^n factor instead.',
      questionType: 'All',
    },
  ],
})

const qaAges = topic({
  id: 'qa-ages',
  subjectId: S,
  title: 'Problems on Ages',
  moduleNumber: 2,
  moduleName: M2,
  order: 11,
  difficulty: 'basic',
  examFrequency: 'high',
  featuredQuestionIds: ['q-qa-age-01', 'q-qa-age-02'],
  subtopicDetails: subs('qa-ages', [
    [
      'Translating sentences into equations',
      'Let the present age be x. "5 years ago" → x − 5; "after 8 years" → x + 8; "twice as old" → 2x; "half the age" → x/2. Write one equation per sentence; two unknowns need two sentences.',
    ],
    [
      'The age difference is constant',
      'The gap between two people never changes. If the father is 30 years older today, he was 30 years older ten years ago and will be 30 years older in twenty years. This converts many two-variable problems into one-variable problems.',
    ],
    [
      'Ratio at two points in time',
      '"Ages are in ratio 4 : 5; six years hence 5 : 6" → (4k + 6)/(5k + 6) = 5/6. Cross-multiply and solve for k. Always add or subtract the same number of years to both ages.',
    ],
    [
      'Sum of ages of a group',
      'Every member ages one year per year, so the total of n ages rises by n each year. "Average age of a family of 5 was 25 five years ago" → present total = 125 + 25 = 150. Births or deaths change n; handle them separately.',
    ],
    [
      'Classic patterns',
      'Father–son ("I was as old as you are now when you were born" → father = 2 × son), grandfather–grandson ratios, and "years ago vs years hence" symmetry. Recognising the pattern lets you plug in options rather than solve.',
    ],
  ]),
  explanationMd: `# Problems on Ages

### Simple algebra, dressed up
Age problems are linear equations disguised as stories. The only skill is careful translation: choose a variable for the **present** age and shift it for the past or future.

### The one fact that unlocks most questions
**The difference between two people's ages never changes.** A father 24 years older than his son stays 24 years older forever. So "father is 3 times the son now and will be twice in 12 years" gives: 3s − s = 2(s + 12) − (s + 12) → 2s = s + 12 → s = 12.

### Ratios at two times
Set the present ages as 4k and 5k (say). Move both by the same number of years, form the new ratio, cross-multiply. Never apply the years to only one person.

### Group averages
When an average age is given for a group at a past time, the present total is the old total plus (number of people × years elapsed). If a baby was born in between, add the baby as a new member with age = years since birth.

### Option testing
Because ages are small whole numbers, plugging in the options is often faster than algebra. Start with the middle option and check both conditions; adjust up or down.

### Traps
- "Twice as old as he was 10 years ago" means x = 2(x − 10), not 2x − 10.
- "After 5 years the father's age will be ..." — remember the son also ages 5 years.
- Do not confuse "the ratio of their ages **was**" with "**will be**".`,
  formulas: [
    {
      id: 'f-qa-age-1',
      label: 'Constant difference',
      formula: 'Age_A − Age_B = constant at every point in time',
      exampleQ: 'A father is 3 times as old as his son. In 12 years he will be twice as old. Find the father\'s present age.',
      exampleA: 'Let son = s, father = 3s. 3s + 12 = 2(s + 12) → s = 12, father = 36.',
    },
    {
      id: 'f-qa-age-2',
      label: 'Ratio shift',
      formula: 'If ages are a k and b k now, after n years: (a k + n)/(b k + n) = new ratio',
      exampleQ: 'Ages of A and B are in ratio 4 : 5. After 6 years the ratio becomes 5 : 6. Find A\'s age.',
      exampleA: '(4k + 6)/(5k + 6) = 5/6 → 24k + 36 = 25k + 30 → k = 6 → A = 24.',
    },
  ],
  tricks: [
    {
      id: 't-qa-age-1',
      title: 'Difference must divide evenly',
      trick: 'If ages are in ratio a : b and the difference is D, then k = D/(b − a) must be a whole number. Use this to eliminate options fast.',
      whenToUse: 'Ratio-plus-difference questions.',
    },
    {
      id: 't-qa-age-2',
      title: 'Back-substitute the options',
      trick: 'Take an option for the son\'s age, compute the father\'s from one condition, and test the second condition. Two checks, no algebra.',
      whenToUse: 'When the algebra looks messy or under time pressure.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-age-1',
      step: 'Step 1: Set present ages as variables (or k-multiples)',
      detail: 'Use x for one person and express the other via the given relation or ratio. Avoid introducing more variables than sentences.',
      questionType: 'All age problems',
    },
    {
      id: 'h-qa-age-2',
      step: 'Step 2: Shift both ages for each time reference',
      detail: 'For "n years ago" subtract n from every person; for "n years hence" add n to every person. Then form the equation the sentence describes.',
      questionType: 'Past / future statements',
    },
    {
      id: 'h-qa-age-3',
      step: 'Step 3: Solve and answer the exact person and time asked',
      detail: 'Questions often ask for the age five years from now, or the other person\'s age. Re-read the last line before marking.',
      questionType: 'All',
    },
  ],
})

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 — TIME, SPEED & WORK
// ─────────────────────────────────────────────────────────────────────────────

const M3 = 'Module 3: Time, Speed & Work'

const qaSpeedTimeDistance = topic({
  id: 'qa-speed-time-distance',
  subjectId: S,
  title: 'Speed, Time & Distance (incl. Trains)',
  moduleNumber: 3,
  moduleName: M3,
  order: 12,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-qa-std-01', 'q-qa-std-02'],
  subtopicDetails: subs('qa-speed-time-distance', [
    [
      'The core relation and unit conversion',
      'Distance = Speed × Time. km/h to m/s: multiply by 5/18; m/s to km/h: multiply by 18/5. 36 km/h = 10 m/s, 54 km/h = 15 m/s, 72 km/h = 20 m/s, 90 km/h = 25 m/s — memorise these four.',
    ],
    [
      'Proportionality shortcuts',
      'For fixed distance, speed and time are inversely proportional: speed ratio 3 : 4 means time ratio 4 : 3. "If speed increases by 25% time reduces by 20%" comes straight from percentages. Fixed time: distance ∝ speed.',
    ],
    [
      'Relative speed',
      'Same direction: subtract speeds. Opposite direction: add speeds. Time to meet or overtake = gap / relative speed. Two people walking towards each other from 60 km apart at 4 and 6 km/h meet in 6 hours.',
    ],
    [
      'Trains crossing objects',
      'Crossing a pole or a person: distance = train length. Crossing a platform or bridge: distance = train length + platform length. Crossing another train: distance = sum of lengths, speed = relative speed.',
    ],
    [
      'Average speed and early/late problems',
      'Average speed = total distance / total time; equal distances → 2xy/(x + y). "At 10 km/h he is 6 min late; at 15 km/h he is 4 min early" → distance = (10 × 15)/(15 − 10) × (10/60) = 5 km.',
    ],
    [
      'Circular tracks and meeting points',
      'Two runners on a circular track of length L: first meeting time = L / relative speed; meeting at the start again = LCM of individual lap times. Number of distinct meeting points = difference of speeds in lowest ratio (same direction) or sum (opposite).',
    ],
  ]),
  explanationMd: `# Speed, Time & Distance

### The whole topic in one line
Distance = Speed × Time. Every question either gives two of these and asks for the third, or compares two journeys where one quantity is fixed.

### Units first
Placement papers mix km/h with metres and seconds on purpose. Convert before anything else: × 5/18 for km/h → m/s. The four anchors (36 → 10, 54 → 15, 72 → 20, 90 → 25) cover most train questions.

### Fixed distance ⇒ inverse proportion
If the distance is the same, a faster speed means proportionally less time. Speeds 4 : 5 mean times 5 : 4. This turns "late by 6 minutes vs early by 4 minutes" questions into a 10-minute time difference across a known speed ratio.

### Relative speed
Two objects moving towards each other close the gap at the **sum** of their speeds; in the same direction at the **difference**. Overtaking time = length to be covered / relative speed.

### Trains
The distance a train must cover to "cross" something is:
- a pole, a signal, a standing man → its own length
- a platform, a bridge, a tunnel → its length + the object's length
- another train → sum of both lengths, at relative speed

A 150 m train at 54 km/h (15 m/s) crossing a 250 m platform covers 400 m in 400/15 ≈ 26.7 s.

### Average speed
Total distance over total time — never the mean of two speeds. For equal legs use 2xy/(x + y).

### Traps
- Time given in minutes with speed in km/h — convert minutes to hours.
- "Crosses a man walking" — the man's speed matters (relative speed).
- Circular-track meetings: the first meeting is at relative-speed time, but returning to the start together needs the LCM of lap times.`,
  formulas: [
    {
      id: 'f-qa-std-1',
      label: 'Basic relation and conversion',
      formula: 'D = S × T;   km/h × 5/18 = m/s',
      exampleQ: 'How long does a 150 m train at 54 km/h take to cross a 250 m platform?',
      exampleA: 'Speed = 54 × 5/18 = 15 m/s. Distance = 150 + 250 = 400 m. Time = 400/15 = 26.67 s.',
    },
    {
      id: 'f-qa-std-2',
      label: 'Relative speed',
      formula: 'Opposite directions: S1 + S2;   Same direction: |S1 − S2|;   Time = gap / relative speed',
      exampleQ: 'Two trains 100 m and 200 m long run towards each other at 36 km/h and 72 km/h. Time to cross?',
      exampleA: 'Relative = 108 km/h = 30 m/s. Distance = 300 m. Time = 10 s.',
    },
    {
      id: 'f-qa-std-3',
      label: 'Early / late distance',
      formula: 'Distance = (S1 × S2) / (S2 − S1) × (t_late + t_early)   [time in hours]',
      exampleQ: 'Walking at 4 km/h a student is 5 min late; at 6 km/h he is 5 min early. Distance to school?',
      exampleA: '(4 × 6)/(6 − 4) × (10/60) = 12 × 1/6 = 2 km.',
    },
  ],
  tricks: [
    {
      id: 't-qa-std-1',
      title: 'Ratio flip',
      trick: 'Same distance: time ratio is the reverse of speed ratio. If speed goes from 5 to 6 (×6/5), time goes ×5/6 — a 1/6 saving. Convert the saving to the minutes given and scale up.',
      whenToUse: '"Increasing speed by x saves y minutes" questions.',
    },
    {
      id: 't-qa-std-2',
      title: 'Meeting-point distance ratio',
      trick: 'When two people start together towards each other, the distances they cover until meeting are in the ratio of their speeds. No time calculation needed for "how far from A do they meet?".',
      whenToUse: 'Two-traveller meeting questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-std-1',
      step: 'Step 1: Convert all units to one system',
      detail: 'Pick m/s with metres and seconds for trains, km/h with km and hours for journeys. Do this before writing any equation.',
      questionType: 'All STD questions',
    },
    {
      id: 'h-qa-std-2',
      step: 'Step 2: Identify what is fixed — distance, speed or time',
      detail: 'Fixed distance → inverse proportion; fixed time → direct proportion. For two movers, compute relative speed and the total gap to be closed.',
      questionType: 'Comparison / relative motion',
    },
    {
      id: 'h-qa-std-3',
      step: 'Step 3: Apply D = S × T and check the magnitude',
      detail: 'A train crossing a platform in under 5 seconds or a walker covering 40 km in an hour signals a unit error. Re-check the conversion factor.',
      questionType: 'All',
    },
  ],
})

const qaTimeWork = topic({
  id: 'qa-time-work',
  subjectId: S,
  title: 'Time & Work',
  moduleNumber: 3,
  moduleName: M3,
  order: 13,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-qa-tw-01', 'q-qa-tw-02'],
  subtopicDetails: subs('qa-time-work', [
    [
      'Unitary method and the LCM method',
      'If A finishes in n days, A does 1/n of the work per day. Faster: let total work = LCM of all the "days" values, so each person\'s daily output is a whole number. A in 12 days, B in 18 days → work = 36 units, A = 3/day, B = 2/day, together 5/day → 7.2 days.',
    ],
    [
      'Combined work and leaving midway',
      'Add daily rates for people working together. If someone leaves after k days, compute the work done till then, subtract from the total, and let the rest finish it. Track units of work, not fractions of days.',
    ],
    [
      'Efficiency and ratio of times',
      '"A is twice as efficient as B" → A takes half the time. Efficiency ratio a : b means time ratio b : a. If A is 50% more efficient, time ratio is 2 : 3.',
    ],
    [
      'Men, days, hours (chain rule)',
      'M1 × D1 × H1 / W1 = M2 × D2 × H2 / W2. Work is proportional to men × days × hours. "12 men in 20 days" → 240 man-days; 8 men need 30 days.',
    ],
    [
      'Wages and alternate-day work',
      'Wages are split in the ratio of work done, i.e. in the ratio of efficiencies when working the same days. For alternate days, compute the work done per 2-day cycle, count full cycles, then handle the remainder day by day.',
    ],
  ]),
  explanationMd: `# Time & Work

### Choose units that make the arithmetic vanish
Instead of fractions like 1/12 + 1/18, set the **total work = LCM** of the individual times. With A in 12 days and B in 18 days, total work = 36 units, A does 3 per day, B does 2 per day, together 5 per day → 36/5 = 7.2 days. Every question in this topic becomes integer bookkeeping.

### Rates add, times do not
Two people working together add their **daily outputs**. Never average their days. Together time for two people = ab/(a + b); for three, use the LCM method.

### Efficiency
Efficiency is work per day. "A is 25% more efficient than B" → efficiencies 5 : 4 → times 4 : 5. Once you have the efficiency ratio, wages, shares and completion times all follow from it.

### People leaving or joining
Compute work done in each phase separately. "A and B start together; A leaves after 4 days" → phase 1: (A + B) × 4 units; phase 2: remaining units / B's rate.

### Chain rule (men-days-hours)
Total work in man-hours stays constant: M1 D1 H1 = M2 D2 H2 (scale by W if the work amount changes). More men → fewer days (inverse); more work → more days (direct).

### Alternate days
If A and B work on alternate days starting with A, one cycle of 2 days produces (A + B) units. Count whole cycles, then finish the leftover with A first, then B if needed — watch for the work finishing in the middle of a day.

### Traps
- "A can do the work in 10 days, B in 15 days; both work but A rests every third day" — build a 3-day cycle.
- Negative work (a leak, a person destroying) is subtracted from the rate, exactly like an outlet pipe.
- Wages are paid for work done, not for days present, when efficiencies differ.`,
  formulas: [
    {
      id: 'f-qa-tw-1',
      label: 'Together time (two workers)',
      formula: 'T = ab / (a + b)',
      exampleQ: 'A does a job in 12 days, B in 18 days. Working together?',
      exampleA: '12 × 18 / 30 = 216/30 = 7.2 days.',
    },
    {
      id: 'f-qa-tw-2',
      label: 'Chain rule',
      formula: 'M1 × D1 × H1 / W1 = M2 × D2 × H2 / W2',
      exampleQ: '12 men working 8 hours a day finish in 20 days. How many days will 8 men working 10 hours a day take?',
      exampleA: '12 × 8 × 20 = 8 × 10 × D → D = 1920/80 = 24 days.',
    },
    {
      id: 'f-qa-tw-3',
      label: 'Efficiency ↔ time',
      formula: 'Efficiency ratio a : b  ⇔  Time ratio b : a;   Wages ∝ work done',
      exampleQ: 'A is twice as efficient as B and together they finish in 10 days. How long does B alone take?',
      exampleA: 'Efficiencies 2 : 1, together 3 units/day for 10 days = 30 units. B alone: 30/1 = 30 days.',
    },
  ],
  tricks: [
    {
      id: 't-qa-tw-1',
      title: 'LCM as total work',
      trick: 'Take total work = LCM of all times given. Daily outputs become integers and "how much is left" is a subtraction, not a fraction sum.',
      whenToUse: 'Every time-and-work question with two or more people.',
    },
    {
      id: 't-qa-tw-2',
      title: 'Third person from pair data',
      trick: 'Given A+B, B+C and C+A times, add all three rates and halve to get A+B+C. Subtract a pair rate to get the third person alone.',
      whenToUse: 'Pairwise "together" questions (Infosys favourite).',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-tw-1',
      step: 'Step 1: Fix total work as the LCM and write each rate',
      detail: 'List every worker with units per day. Treat destructive agents (leaks, eaters) as negative rates.',
      questionType: 'All time-work questions',
    },
    {
      id: 'h-qa-tw-2',
      step: 'Step 2: Split the timeline into phases',
      detail: 'For every "leaves after", "joins after", "alternate days", create a phase with its own combined rate and duration. Subtract completed units from the total as you go.',
      questionType: 'Leaving / joining / alternate',
    },
    {
      id: 'h-qa-tw-3',
      step: 'Step 3: Divide remaining units by the active rate and add phase times',
      detail: 'Watch for fractional final days; the answer might be "4 days and a half". Convert to the form the options use.',
      questionType: 'All',
    },
  ],
})

const qaPipes = topic({
  id: 'qa-pipes-cisterns',
  subjectId: S,
  title: 'Pipes & Cisterns',
  moduleNumber: 3,
  moduleName: M3,
  order: 14,
  difficulty: 'basic',
  examFrequency: 'high',
  featuredQuestionIds: ['q-qa-pc-01', 'q-qa-pc-02'],
  subtopicDetails: subs('qa-pipes-cisterns', [
    [
      'Inlets as positive work, outlets as negative',
      'A filling pipe that fills in a hours contributes +1/a per hour; an emptying pipe or leak that drains in b hours contributes −1/b. Net rate = sum of all rates; time to fill = 1 / net rate. Use the LCM trick from Time & Work.',
    ],
    [
      'Leak problems',
      '"A tap fills in 6 h; with a leak it takes 8 h" → leak rate = 1/6 − 1/8 = 1/24, so the leak alone empties a full tank in 24 h. The leak\'s time is always more than the tap\'s time.',
    ],
    [
      'Pipes opened or closed midway',
      'Break into phases exactly like workers leaving. Compute the fraction filled in each phase and let the remaining pipes finish the rest. A common variant: "after how many hours should pipe B be closed so the tank fills in 18 h?" — set up units filled by A for 18 h plus B for t h = total.',
    ],
    [
      'Capacity from rate difference',
      'If an outlet drains x litres per minute and the tank fills in T minutes without it and T\' with it, capacity = x × (T × T\')/(T\' − T). Work in units first, then convert one unit to litres.',
    ],
    [
      'Alternate operation and partial fills',
      'Pipes opened alternately for one hour each form a cycle; count full cycles, then handle the remainder. A tank already 1/3 full needs only 2/3 of the total units.',
    ],
  ]),
  explanationMd: `# Pipes & Cisterns

### It is Time & Work with a sign
A pipe that fills the tank is a worker doing positive work; a pipe that drains it is a worker doing negative work. Everything else — LCM units, phases, rates — carries over unchanged.

### Standard setup
Let capacity = LCM of the times given. A fills in 10 h (12 units/h with capacity 120), B fills in 15 h (8 units/h), C empties in 30 h (−4 units/h). All three open: 12 + 8 − 4 = 16 units/h → 120/16 = 7.5 h.

### Leaks
A leak is an outlet whose time you do not know. Compare the fill time with and without it: leak rate = (rate without leak) − (rate with leak). The leak then empties a full tank in 1/(leak rate) hours.

### Phases
"A and B opened together; B closed after 3 hours" — phase 1 fills (A + B) × 3 units; A finishes the remainder alone. "After how long should B be shut so the tank is full in T hours?" — let B run t hours: A × T + B × t = capacity, solve for t.

### Capacity in litres
When a rate in litres per minute is given for one pipe, first solve for that pipe's rate in units, then equate: (units per minute) ↔ (litres per minute). One proportion gives the capacity.

### Traps
- Net rate negative means the tank empties, not fills — the question might ask "how long to empty a full tank".
- "Both pipes opened, then after 2 hours the outlet is shut" — the outlet was working *against* the fill for those 2 hours.
- Check whether the tank starts empty, full, or partially filled.`,
  formulas: [
    {
      id: 'f-qa-pc-1',
      label: 'Net rate',
      formula: 'Net rate = Σ(1/inlet time) − Σ(1/outlet time);   Time to fill = 1 / net rate',
      exampleQ: 'A fills in 10 h, B in 15 h, C empties in 30 h. All open together — time to fill?',
      exampleA: '1/10 + 1/15 − 1/30 = (3 + 2 − 1)/30 = 4/30 → 30/4 = 7.5 h.',
    },
    {
      id: 'f-qa-pc-2',
      label: 'Leak time',
      formula: '1/Leak = 1/T_without − 1/T_with',
      exampleQ: 'A tap fills a tank in 6 h but with a leak it takes 8 h. How long will the leak take to empty the full tank?',
      exampleA: '1/6 − 1/8 = (4 − 3)/24 = 1/24 → 24 hours.',
    },
  ],
  tricks: [
    {
      id: 't-qa-pc-1',
      title: 'LCM capacity',
      trick: 'Set capacity = LCM of all times. Each pipe\'s rate is a whole number and the arithmetic is addition and subtraction only.',
      whenToUse: 'Every pipes question.',
    },
    {
      id: 't-qa-pc-2',
      title: 'Outlet slower than inlet ⇒ tank fills',
      trick: 'If the emptying time is longer than the filling time the net rate is positive and the tank fills; otherwise it drains. Decide the direction before computing so you answer "fill" or "empty" correctly.',
      whenToUse: 'Mixed inlet/outlet questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-pc-1',
      step: 'Step 1: List each pipe with a signed rate in LCM units',
      detail: 'Inlets positive, outlets and leaks negative. Note the starting level of the tank.',
      questionType: 'All pipes questions',
    },
    {
      id: 'h-qa-pc-2',
      step: 'Step 2: Build phases where the set of open pipes changes',
      detail: 'For each phase, net rate × duration = units moved. Keep a running total against the capacity.',
      questionType: 'Opened / closed midway',
    },
    {
      id: 'h-qa-pc-3',
      step: 'Step 3: Solve for the unknown and convert units',
      detail: 'Remaining units / active rate gives the final time. If litres are involved, convert one unit to litres at the end.',
      questionType: 'All',
    },
  ],
})

const qaBoats = topic({
  id: 'qa-boats-streams',
  subjectId: S,
  title: 'Boats & Streams',
  moduleNumber: 3,
  moduleName: M3,
  order: 15,
  difficulty: 'basic',
  examFrequency: 'high',
  featuredQuestionIds: ['q-qa-bs-01', 'q-qa-bs-02'],
  subtopicDetails: subs('qa-boats-streams', [
    [
      'Downstream and upstream speeds',
      'With boat speed b (still water) and stream speed s: downstream = b + s, upstream = b − s. Downstream is always the faster leg. Rowing "with the current" is downstream; "against" is upstream.',
    ],
    [
      'Recovering b and s',
      'b = (downstream + upstream)/2 and s = (downstream − upstream)/2. Given the two leg speeds, the boat and stream speeds are one line each.',
    ],
    [
      'Round trips and total time',
      'Same distance d each way: total time = d/(b + s) + d/(b − s). Given total time and the speeds, solve for d; given d and total time, form a quadratic in b or s.',
    ],
    [
      'Time ratio for the same distance',
      'If upstream time is k times downstream time, then (b + s)/(b − s) = k, so b : s = (k + 1) : (k − 1). "Takes twice as long upstream" → b : s = 3 : 1.',
    ],
    [
      'Escalators and moving walkways',
      'Same algebra: a person walking on a moving escalator has speed (person ± escalator). "Takes 60 steps going up a moving escalator and 90 going down" type questions use the identical downstream/upstream model.',
    ],
  ]),
  explanationMd: `# Boats & Streams

### Two speeds, two formulas
The current either helps or hinders:
- **Downstream** (with the current): b + s
- **Upstream** (against the current): b − s

where b is the boat's speed in still water and s is the stream's speed. Everything else is Speed-Time-Distance.

### Recovering b and s
Add and halve for the boat, subtract and halve for the stream. Downstream 12 km/h and upstream 8 km/h → b = 10, s = 2.

### Round trips
A trip out and back over distance d takes d/(b + s) + d/(b − s). At b = 10, s = 2, d = 24: 24/12 + 24/8 = 2 + 3 = 5 hours. The average speed of the round trip is (b² − s²)/b, which is always **less** than b — another instance of the average-speed trap.

### Ratios
If going upstream takes k times as long as coming downstream over the same distance, then b : s = (k + 1) : (k − 1). This lets you skip the algebra in "twice as long" or "three times as long" questions.

### Same idea, other costumes
Aeroplanes with tailwind/headwind, cyclists with wind, and people on escalators all use b ± s. Recognise the pattern and reuse the formulas.

### Traps
- "Speed of the boat" without qualification means still-water speed.
- A question giving the *time* for each leg and the *distance* wants you to find speeds first, then b and s.
- If the stream speed equals or exceeds the boat speed, upstream travel is impossible — check that options make physical sense.`,
  formulas: [
    {
      id: 'f-qa-bs-1',
      label: 'Downstream / upstream',
      formula: 'Down = b + s;   Up = b − s;   b = (Down + Up)/2;   s = (Down − Up)/2',
      exampleQ: 'A boat goes 12 km/h downstream and 8 km/h upstream. Speed of the stream?',
      exampleA: 's = (12 − 8)/2 = 2 km/h (and b = 10 km/h).',
    },
    {
      id: 'f-qa-bs-2',
      label: 'Round-trip time',
      formula: 'T = d/(b + s) + d/(b − s)',
      exampleQ: 'Boat speed 10 km/h, stream 2 km/h. Time to go 24 km downstream and return?',
      exampleA: '24/12 + 24/8 = 2 + 3 = 5 hours.',
    },
    {
      id: 'f-qa-bs-3',
      label: 'Time-ratio shortcut',
      formula: 'If Up time = k × Down time (same distance): b : s = (k + 1) : (k − 1)',
      exampleQ: 'A man rows upstream in 3 times the time he takes downstream. Ratio of boat speed to stream speed?',
      exampleA: '(3 + 1) : (3 − 1) = 4 : 2 = 2 : 1.',
    },
  ],
  tricks: [
    {
      id: 't-qa-bs-1',
      title: 'Speeds from times over equal distances',
      trick: 'Over equal distances, the ratio of speeds is the inverse of the ratio of times. Convert the time ratio to a speed ratio, then use b = (Down + Up)/2.',
      whenToUse: 'Questions that give travel times rather than speeds.',
    },
    {
      id: 't-qa-bs-2',
      title: 'Round-trip average is below still-water speed',
      trick: 'Average speed for a round trip = (b² − s²)/b < b. Any option equal to or above b is wrong.',
      whenToUse: 'Sanity-checking average-speed options.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-bs-1',
      step: 'Step 1: Write down b, s, Down and Up — fill in what is known',
      detail: 'Two of the four determine the other two. Convert any time in minutes to hours first.',
      questionType: 'All boats questions',
    },
    {
      id: 'h-qa-bs-2',
      step: 'Step 2: Set up D = S × T for each leg',
      detail: 'Use (b + s) for downstream legs and (b − s) for upstream legs. For round trips add the two times.',
      questionType: 'Round trip / find distance',
    },
    {
      id: 'h-qa-bs-3',
      step: 'Step 3: Solve; if a quadratic appears, test the options instead',
      detail: 'Speeds are usually small integers; plugging options into the round-trip equation is quicker than the quadratic formula.',
      questionType: 'Find b or s',
    },
  ],
})

export const QUANT_TOPICS_PART1: PrepTopic[] = [
  qaNumberSystem,
  qaHcfLcm,
  qaSimplification,
  qaSurdsIndicesLogs,
  qaPercentages,
  qaProfitLoss,
  qaInterest,
  qaRatio,
  qaAverages,
  qaMixtures,
  qaAges,
  qaSpeedTimeDistance,
  qaTimeWork,
  qaPipes,
  qaBoats,
]

export const QUANT_QUESTIONS_PART1: UniversalQuestion[] = [
  // Number system
  mcq({ id: 'q-qa-ns-01', subjectId: S, topicId: 'qa-number-system', difficulty: 'basic',
    q: 'What is the unit digit of 7^95?',
    options: ['1', '3', '7', '9'], answer: 1,
    why: '7 cycles as 7, 9, 3, 1 (length 4). 95 ÷ 4 leaves remainder 3, so pick the 3rd entry: 3.' }),
  mcq({ id: 'q-qa-ns-02', subjectId: S, topicId: 'qa-number-system',
    q: 'How many positive factors does 360 have?',
    options: ['20', '22', '24', '30'], answer: 2,
    why: '360 = 2³ × 3² × 5. Number of factors = (3 + 1)(2 + 1)(1 + 1) = 24.' }),
  // HCF LCM
  mcq({ id: 'q-qa-hl-01', subjectId: S, topicId: 'qa-hcf-lcm', difficulty: 'basic',
    q: 'Three bells ring at intervals of 6, 8 and 12 seconds. If they ring together at 9:00:00 AM, when will they next ring together?',
    options: ['9:00:12 AM', '9:00:24 AM', '9:00:36 AM', '9:00:48 AM'], answer: 1,
    why: '"Together again" means LCM. LCM(6, 8, 12) = 24 seconds → 9:00:24 AM.' }),
  mcq({ id: 'q-qa-hl-02', subjectId: S, topicId: 'qa-hcf-lcm',
    q: 'The HCF and LCM of two numbers are 12 and 72. If one number is 24, the other is:',
    options: ['30', '36', '48', '60'], answer: 1,
    why: 'Product of two numbers = HCF × LCM = 864. Other number = 864 / 24 = 36.' }),
  // Simplification
  mcq({ id: 'q-qa-sim-01', subjectId: S, topicId: 'qa-simplification', difficulty: 'basic',
    q: 'Express 0.363636... as a fraction in lowest terms.',
    options: ['4/11', '9/25', '36/100', '11/30'], answer: 0,
    why: 'A two-digit repeating block sits over 99: 36/99 = 4/11.' }),
  mcq({ id: 'q-qa-sim-02', subjectId: S, topicId: 'qa-simplification', difficulty: 'basic',
    q: 'Evaluate 8 ÷ 2 × (2 + 2).',
    options: ['1', '4', '16', '8'], answer: 2,
    why: 'Brackets first: 8 ÷ 2 × 4. Division and multiplication have equal priority, left to right: 4 × 4 = 16.' }),
  // Surds indices logs
  mcq({ id: 'q-qa-sil-01', subjectId: S, topicId: 'qa-surds-indices-logs',
    q: 'The value of (256)^0.16 × (256)^0.09 is:',
    options: ['2', '4', '8', '16'], answer: 1,
    why: 'Add the exponents: 256^0.25 = fourth root of 256 = 4.' }),
  mcq({ id: 'q-qa-sil-02', subjectId: S, topicId: 'qa-surds-indices-logs',
    q: 'If log10 2 = 0.301, then log10 8 equals:',
    options: ['0.602', '0.903', '1.204', '0.699'], answer: 1,
    why: 'log 8 = log 2³ = 3 × 0.301 = 0.903.' }),
  // Percentages
  mcq({ id: 'q-qa-pct-01', subjectId: S, topicId: 'qa-percentages',
    q: 'The price of sugar rises by 25%. By what percent must a family cut its consumption to keep expenditure unchanged?',
    options: ['20%', '25%', '30%', '15%'], answer: 0,
    why: 'Reduction = 25/(100 + 25) × 100 = 20%.' }),
  mcq({ id: 'q-qa-pct-02', subjectId: S, topicId: 'qa-percentages', difficulty: 'basic',
    q: 'A town\'s population of 20,000 increases by 10% in the first year and decreases by 10% in the second. Population at the end of two years?',
    options: ['20,000', '19,800', '20,200', '19,600'], answer: 1,
    why: '20,000 × 1.1 × 0.9 = 19,800. Net change is −1% (10 − 10 − 1).' }),
  // Profit loss
  mcq({ id: 'q-qa-pl-01', subjectId: S, topicId: 'qa-profit-loss-discount', difficulty: 'basic',
    q: 'Successive discounts of 20% and 10% are equivalent to a single discount of:',
    options: ['30%', '28%', '25%', '32%'], answer: 1,
    why: 'a + b − ab/100 = 20 + 10 − 2 = 28%.' }),
  mcq({ id: 'q-qa-pl-02', subjectId: S, topicId: 'qa-profit-loss-discount',
    q: 'Two articles are sold at Rs 1200 each, one at 20% profit and the other at 20% loss. Overall result?',
    options: ['No profit, no loss', '4% profit', '4% loss', '2% loss'], answer: 2,
    why: 'Equal percent gain and loss at the same SP always gives a loss of (x/10)² % = 4%.' }),
  // Interest
  mcq({ id: 'q-qa-int-01', subjectId: S, topicId: 'qa-simple-compound-interest', difficulty: 'basic',
    q: 'Compound interest on Rs 10,000 at 10% per annum for 2 years is:',
    options: ['Rs 2000', 'Rs 2100', 'Rs 2200', 'Rs 2050'], answer: 1,
    why: 'Amount = 10,000 × 1.21 = 12,100. CI = 2100.' }),
  mcq({ id: 'q-qa-int-02', subjectId: S, topicId: 'qa-simple-compound-interest',
    q: 'The difference between compound and simple interest on a sum for 2 years at 5% per annum is Rs 25. The sum is:',
    options: ['Rs 5000', 'Rs 8000', 'Rs 10,000', 'Rs 12,000'], answer: 2,
    why: 'CI − SI (2 years) = P (R/100)² → P × 0.0025 = 25 → P = 10,000.' }),
  // Ratio
  mcq({ id: 'q-qa-rp-01', subjectId: S, topicId: 'qa-ratio-proportion-partnership',
    q: 'A invests Rs 20,000 for 12 months and B invests Rs 30,000 for 8 months. From a profit of Rs 9000, A\'s share is:',
    options: ['Rs 4500', 'Rs 5000', 'Rs 6000', 'Rs 3600'], answer: 0,
    why: 'Capital × time: 240,000 : 240,000 = 1 : 1. A gets half, Rs 4500.' }),
  mcq({ id: 'q-qa-rp-02', subjectId: S, topicId: 'qa-ratio-proportion-partnership', difficulty: 'basic',
    q: 'The mean proportional between 4 and 25 is:',
    options: ['10', '14.5', '12', '20'], answer: 0,
    why: 'Mean proportional between a and b is √(ab): √(4 × 25) = √100 = 10.' }),
  // Averages
  mcq({ id: 'q-qa-avg-01', subjectId: S, topicId: 'qa-averages', difficulty: 'basic',
    q: 'The average of 5 numbers is 20. When a sixth number is added the average becomes 22. The sixth number is:',
    options: ['30', '32', '34', '28'], answer: 1,
    why: 'New total 6 × 22 = 132; old total 5 × 20 = 100; sixth = 32.' }),
  mcq({ id: 'q-qa-avg-02', subjectId: S, topicId: 'qa-averages',
    q: 'A man drives to a town at 60 km/h and returns by the same road at 40 km/h. His average speed for the whole journey is:',
    options: ['50 km/h', '48 km/h', '45 km/h', '52 km/h'], answer: 1,
    why: 'Equal distances: 2 × 60 × 40 / (60 + 40) = 48 km/h.' }),
  // Mixtures
  mcq({ id: 'q-qa-mix-01', subjectId: S, topicId: 'qa-mixtures-alligation',
    q: 'In what ratio must rice at Rs 20/kg be mixed with rice at Rs 30/kg so that the mixture costs Rs 24/kg?',
    options: ['3 : 2', '2 : 3', '1 : 2', '4 : 3'], answer: 0,
    why: 'Cheaper : dearer = (30 − 24) : (24 − 20) = 6 : 4 = 3 : 2.' }),
  mcq({ id: 'q-qa-mix-02', subjectId: S, topicId: 'qa-mixtures-alligation',
    q: 'A vessel holds 40 L of milk. 4 L is drawn out and replaced with water, and this is done twice. Milk remaining?',
    options: ['32 L', '32.4 L', '33 L', '36 L'], answer: 1,
    why: '40 × (1 − 4/40)² = 40 × 0.81 = 32.4 L.' }),
  // Ages
  mcq({ id: 'q-qa-age-01', subjectId: S, topicId: 'qa-ages', difficulty: 'basic',
    q: 'A father is three times as old as his son. In 12 years he will be twice as old. The father\'s present age is:',
    options: ['30', '36', '40', '42'], answer: 1,
    why: '3s + 12 = 2(s + 12) → s = 12 → father = 36.' }),
  mcq({ id: 'q-qa-age-02', subjectId: S, topicId: 'qa-ages',
    q: 'The ages of A and B are in the ratio 4 : 5. Six years from now the ratio will be 5 : 6. A\'s present age is:',
    options: ['20', '24', '30', '28'], answer: 1,
    why: '(4k + 6)/(5k + 6) = 5/6 → 24k + 36 = 25k + 30 → k = 6 → A = 24.' }),
  // Speed time distance
  mcq({ id: 'q-qa-std-01', subjectId: S, topicId: 'qa-speed-time-distance',
    q: 'A 150 m long train running at 54 km/h crosses a 250 m platform in approximately:',
    options: ['20 s', '24 s', '26.7 s', '30 s'], answer: 2,
    why: '54 km/h = 15 m/s. Distance = 400 m. Time = 400/15 ≈ 26.7 s.' }),
  mcq({ id: 'q-qa-std-02', subjectId: S, topicId: 'qa-speed-time-distance',
    q: 'Two trains of lengths 100 m and 200 m run towards each other at 36 km/h and 72 km/h. Time taken to cross each other?',
    options: ['8 s', '10 s', '12 s', '15 s'], answer: 1,
    why: 'Relative speed = 108 km/h = 30 m/s. Total length 300 m → 10 s.' }),
  // Time work
  mcq({ id: 'q-qa-tw-01', subjectId: S, topicId: 'qa-time-work', difficulty: 'basic',
    q: 'A can do a piece of work in 12 days and B in 18 days. Working together they finish it in:',
    options: ['6 days', '7.2 days', '8 days', '9 days'], answer: 1,
    why: 'Work = 36 units; A = 3/day, B = 2/day; together 5/day → 36/5 = 7.2 days.' }),
  mcq({ id: 'q-qa-tw-02', subjectId: S, topicId: 'qa-time-work', difficulty: 'basic',
    q: '12 men complete a job in 20 days. How many days will 8 men take?',
    options: ['25', '28', '30', '32'], answer: 2,
    why: 'Man-days constant: 12 × 20 = 8 × D → D = 30.' }),
  // Pipes
  mcq({ id: 'q-qa-pc-01', subjectId: S, topicId: 'qa-pipes-cisterns',
    q: 'Pipe A fills a tank in 10 h, pipe B in 15 h, and pipe C empties it in 30 h. With all three open, the empty tank fills in:',
    options: ['6 h', '7.5 h', '8 h', '9 h'], answer: 1,
    why: '1/10 + 1/15 − 1/30 = 4/30 per hour → 7.5 hours.' }),
  mcq({ id: 'q-qa-pc-02', subjectId: S, topicId: 'qa-pipes-cisterns',
    q: 'A tap can fill a tank in 6 hours. Because of a leak it takes 8 hours. The leak alone would empty the full tank in:',
    options: ['18 h', '20 h', '24 h', '30 h'], answer: 2,
    why: 'Leak rate = 1/6 − 1/8 = 1/24 → 24 hours.' }),
  // Boats
  mcq({ id: 'q-qa-bs-01', subjectId: S, topicId: 'qa-boats-streams', difficulty: 'basic',
    q: 'A boat travels at 12 km/h downstream and 8 km/h upstream. The speed of the stream is:',
    options: ['2 km/h', '4 km/h', '10 km/h', '6 km/h'], answer: 0,
    why: 'Stream speed = (downstream − upstream)/2 = (12 − 8)/2 = 2 km/h; boat speed = (12 + 8)/2 = 10 km/h.' }),
  mcq({ id: 'q-qa-bs-02', subjectId: S, topicId: 'qa-boats-streams',
    q: 'A boat\'s speed in still water is 10 km/h and the stream flows at 2 km/h. Time to go 24 km downstream and return?',
    options: ['4 h', '4.8 h', '5 h', '6 h'], answer: 2,
    why: '24/12 + 24/8 = 2 + 3 = 5 hours.' }),
]

// ─────────────────────────────────────────────────────────────────────────────
// Bundle (part 1 + part 2)
// ─────────────────────────────────────────────────────────────────────────────

export const QUANT_TOPICS: PrepTopic[] = [...QUANT_TOPICS_PART1, ...QUANT_TOPICS_PART2]
export const QUANT_QUESTIONS: UniversalQuestion[] = [...QUANT_QUESTIONS_PART1, ...QUANT_QUESTIONS_PART2]
