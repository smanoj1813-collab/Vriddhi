// functions/src/data/aptitudeQuantSeedData2.ts
//
// Quantitative Aptitude — Modules 4 to 6 (algebra & progressions, counting &
// probability, geometry, clocks-calendars and data interpretation). Continues
// aptitudeQuantSeedData.ts; both halves are merged there into the exported
// bundle so the seeder sees one subject.

import type { PrepTopic, UniversalQuestion } from '../prepShared'
import { QA_SUBJECT_ID as S, mcq, subs, topic } from './aptitudeShared'

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4 — ALGEBRA & PROGRESSIONS
// ─────────────────────────────────────────────────────────────────────────────

const M4 = 'Module 4: Algebra & Progressions'

const qaEquations = topic({
  id: 'qa-linear-quadratic-equations',
  subjectId: S,
  title: 'Linear & Quadratic Equations',
  moduleNumber: 4,
  moduleName: M4,
  order: 16,
  difficulty: 'core',
  examFrequency: 'high',
  featuredQuestionIds: ['q-qa-eq-01', 'q-qa-eq-02'],
  subtopicDetails: subs('qa-linear-quadratic-equations', [
    [
      'Linear equations in one and two variables',
      'One variable: isolate x. Two variables: elimination (scale and subtract) or substitution. A system has a unique solution when a1/a2 ≠ b1/b2, no solution when a1/a2 = b1/b2 ≠ c1/c2, and infinite solutions when all three ratios match.',
    ],
    [
      'Word problems → equations',
      'Digits of a two-digit number: 10a + b; reversing gives 10b + a; the difference is always 9(a − b). Coins, tickets, chairs-and-tables, and "sum and difference" problems all reduce to two linear equations.',
    ],
    [
      'Solving quadratics',
      'ax² + bx + c = 0: factorise if the roots are rational (find two numbers with product ac and sum b); otherwise use x = [−b ± √(b² − 4ac)]/2a. Complete the square for "minimum value" questions.',
    ],
    [
      'Sum and product of roots',
      'For ax² + bx + c = 0: α + β = −b/a, αβ = c/a. Form the equation from roots: x² − (sum)x + (product) = 0. Symmetric expressions like α² + β² = (α + β)² − 2αβ and 1/α + 1/β = (α + β)/αβ are asked without solving.',
    ],
    [
      'Nature of roots and the discriminant',
      'D = b² − 4ac. D > 0: two distinct real roots (rational if D is a perfect square). D = 0: equal real roots. D < 0: no real roots. "Find k so the roots are equal" → set D = 0.',
    ],
    [
      'Inequalities and quadratic inequalities (bank pattern)',
      'Compare two quantities x and y from two quadratics: solve both, then compare all root pairs. If every x-root ≥ every y-root, x ≥ y; if they interleave, the relationship cannot be established.',
    ],
  ]),
  explanationMd: `# Linear & Quadratic Equations

### Linear equations
The mechanics are school-level; the placement skill is fast **translation**. "A number is 5 more than twice another and their sum is 26" → x = 2y + 5, x + y = 26. Two sentences, two equations, done. For two-variable systems, elimination (scale one equation and subtract) is faster than substitution under time pressure.

**Consistency check**: compare the coefficient ratios. Equal a- and b-ratios but a different c-ratio means parallel lines — no solution.

### Quadratics — three ways in
1. **Factorise** when the roots are rational. Split the middle term: find two numbers whose product is a × c and whose sum is b.
2. **Formula** when factorising stalls: x = [−b ± √(b² − 4ac)]/2a.
3. **Vieta's relations** when the question asks about the roots without needing them: α + β = −b/a, αβ = c/a.

### Vieta is the placement favourite
"If α and β are roots of x² − 5x + 6 = 0, find α² + β²" → (α + β)² − 2αβ = 25 − 12 = 13. No solving needed. Likewise "form the quadratic whose roots are 2 more than those of..." → new sum = old sum + 4, new product = old product + 2 × old sum + 4.

### The discriminant
D = b² − 4ac decides the nature of the roots. "For what value of k does kx² + 4x + 1 = 0 have equal roots?" → 16 − 4k = 0 → k = 4.

### Max/min of a quadratic
ax² + bx + c has its extreme value at x = −b/2a, equal to c − b²/4a. Minimum if a > 0, maximum if a < 0. This appears as "the minimum value of x² − 6x + 13 is ..." → at x = 3, value = 4.

### Traps
- Forgetting the ± when taking a square root.
- Roots can be negative; check whether the context (length, age, count) rules one out.
- In the bank-style "compare x and y" questions, "x = y or cannot be determined" is a legitimate answer when roots interleave.`,
  formulas: [
    {
      id: 'f-qa-eq-1',
      label: 'Quadratic formula and discriminant',
      formula: 'x = [−b ± √(b² − 4ac)] / 2a;   D = b² − 4ac',
      exampleQ: 'Solve 2x² − 7x + 3 = 0.',
      exampleA: 'D = 49 − 24 = 25. x = (7 ± 5)/4 → x = 3 or x = 1/2.',
    },
    {
      id: 'f-qa-eq-2',
      label: 'Sum and product of roots',
      formula: 'α + β = −b/a;   αβ = c/a;   α² + β² = (α + β)² − 2αβ',
      exampleQ: 'α, β are roots of x² − 5x + 6 = 0. Find α² + β².',
      exampleA: '(5)² − 2(6) = 25 − 12 = 13.',
    },
    {
      id: 'f-qa-eq-3',
      label: 'Extreme value of a quadratic',
      formula: 'Vertex at x = −b/2a;   extreme value = c − b²/4a',
      exampleQ: 'Minimum value of x² − 6x + 13?',
      exampleA: 'At x = 3: 9 − 18 + 13 = 4.',
    },
  ],
  tricks: [
    {
      id: 't-qa-eq-1',
      title: 'Test the options in the equation',
      trick: 'If the question gives numeric options for x, substitute them rather than solving. Start with the middle value.',
      whenToUse: 'Word problems with integer answer choices.',
    },
    {
      id: 't-qa-eq-2',
      title: 'Digit-reversal difference is a multiple of 9',
      trick: '(10a + b) − (10b + a) = 9(a − b). If a two-digit number and its reverse differ by 27, the digits differ by 3.',
      whenToUse: 'Two-digit number puzzles.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-eq-1',
      step: 'Step 1: Define variables and write one equation per fact',
      detail: 'Name the unknowns clearly (tens digit t, units digit u). Each sentence of the problem should become exactly one equation.',
      questionType: 'Word problems',
    },
    {
      id: 'h-qa-eq-2',
      step: 'Step 2: Pick the cheapest method',
      detail: 'Linear: eliminate. Quadratic with rational roots: factorise. Question about roots only: Vieta. Equal-roots condition: D = 0.',
      questionType: 'All equation questions',
    },
    {
      id: 'h-qa-eq-3',
      step: 'Step 3: Reject impossible roots and answer the asked quantity',
      detail: 'Discard negative lengths or ages. The question may ask for x + y or the larger root, not x itself.',
      questionType: 'All',
    },
  ],
})

const qaProgressions = topic({
  id: 'qa-progressions',
  subjectId: S,
  title: 'Progressions: AP, GP & HP',
  moduleNumber: 4,
  moduleName: M4,
  order: 17,
  difficulty: 'core',
  examFrequency: 'high',
  featuredQuestionIds: ['q-qa-prog-01', 'q-qa-prog-02'],
  subtopicDetails: subs('qa-progressions', [
    [
      'Arithmetic progression: nth term and sum',
      'Constant difference d. T_n = a + (n − 1)d. S_n = n/2 [2a + (n − 1)d] = n/2 (first + last). The average of an AP is the middle term, so S_n = n × (middle term) for odd n.',
    ],
    [
      'Geometric progression: nth term and sum',
      'Constant ratio r. T_n = a r^(n−1). S_n = a(r^n − 1)/(r − 1) for r ≠ 1. Infinite sum S_∞ = a/(1 − r) when |r| < 1. Powers of 2 (1, 2, 4, 8, ...) sum to 2^n − 1.',
    ],
    [
      'Harmonic progression',
      'Reciprocals form an AP. There is no closed sum; questions ask for a specific term or use the HM: harmonic mean of a, b = 2ab/(a + b), which is also the average speed for equal distances.',
    ],
    [
      'Means: AM, GM, HM',
      'AM = (a + b)/2, GM = √(ab), HM = 2ab/(a + b). AM ≥ GM ≥ HM, with equality only when a = b, and GM² = AM × HM. Inserting n means between two numbers is an AP/GP with n + 2 terms.',
    ],
    [
      'Counting terms and special sums',
      'Number of multiples of k between A and B, terms of an AP with given first and last, and sums like 1 + 3 + 5 + ... (= n²), 2 + 4 + ... (= n(n + 1)). Interest-type stories: SI amounts form an AP, CI amounts form a GP.',
    ],
  ]),
  explanationMd: `# Progressions: AP, GP & HP

### Arithmetic progression
Each term differs from the previous by a fixed d. Two formulas do all the work:
- T_n = a + (n − 1)d
- S_n = n/2 × (first term + last term)

The **middle-term trick**: the average of an AP is its middle term, so the sum of 15 terms whose 8th term is 20 is 15 × 20 = 300, without knowing a or d.

Common questions: "how many terms are there between 100 and 500 divisible by 7?" (first 105, last 497, n = (497 − 105)/7 + 1 = 57); "the 5th term is 11 and the 9th is 19, find the 20th" (d = 2, a = 3, T_20 = 41).

### Geometric progression
Each term is the previous times a fixed r. T_n = a r^(n−1). Sums grow fast: 1 + 2 + 4 + ... + 2^(n−1) = 2^n − 1. When |r| < 1 the infinite series converges to a/(1 − r), which is how 0.999... = 1 and how "a ball rebounds to half its height" problems are summed.

Compound interest is a GP (ratio 1 + R/100); simple interest is an AP (difference PR/100). Population growth, depreciation and bacterial doubling are GPs.

### Harmonic progression
Take reciprocals and you get an AP. Almost every HP question is "find the nth term" — convert, solve the AP, convert back. The harmonic mean 2ab/(a + b) is the average speed for equal distances, linking HP to Speed-Time-Distance.

### The three means
AM ≥ GM ≥ HM for positive numbers, with equality only when the numbers are equal, and GM² = AM × HM. "If the AM of two numbers is 10 and the GM is 8, find the HM" → 64/10 = 6.4, and the numbers themselves are 16 and 4.

### Traps
- n counts terms, not gaps: from the 3rd to the 10th term there are 8 terms, 7 gaps.
- In a GP with negative r the signs alternate; the sum formula still works.
- The sum of an infinite GP exists only when |r| < 1.`,
  formulas: [
    {
      id: 'f-qa-prog-1',
      label: 'AP term and sum',
      formula: 'T_n = a + (n − 1)d;   S_n = n/2 [2a + (n − 1)d] = n/2 (a + l)',
      exampleQ: 'Find the sum of the first 20 terms of 3, 7, 11, ...',
      exampleA: 'S = 20/2 × [6 + 19 × 4] = 10 × 82 = 820.',
    },
    {
      id: 'f-qa-prog-2',
      label: 'GP term and sums',
      formula: 'T_n = a r^(n−1);   S_n = a(r^n − 1)/(r − 1);   S_∞ = a/(1 − r), |r| < 1',
      exampleQ: 'Sum of 1 + 1/2 + 1/4 + ... to infinity?',
      exampleA: 'a = 1, r = 1/2 → 1/(1 − 1/2) = 2.',
    },
    {
      id: 'f-qa-prog-3',
      label: 'Means',
      formula: 'AM = (a + b)/2;   GM = √(ab);   HM = 2ab/(a + b);   GM² = AM × HM',
      exampleQ: 'AM of two numbers is 10 and GM is 8. Find the HM.',
      exampleA: 'HM = GM²/AM = 64/10 = 6.4.',
    },
  ],
  tricks: [
    {
      id: 't-qa-prog-1',
      title: 'Sum = n × middle term',
      trick: 'For an odd number of AP terms, sum = n × middle term. For an even number, sum = n × average of the two middle terms. Skip a and d completely.',
      whenToUse: 'Sum questions where a middle term is given or easy to find.',
    },
    {
      id: 't-qa-prog-2',
      title: 'Symmetric terms',
      trick: 'In an AP, T_p + T_q = T_r + T_s whenever p + q = r + s. So T_3 + T_17 = 2 T_10. Three unknown terms in AP: take them as a − d, a, a + d so their sum is 3a.',
      whenToUse: '"Three numbers in AP whose sum is ... and product is ..." questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-prog-1',
      step: 'Step 1: Identify the type by checking differences or ratios',
      detail: 'Constant difference → AP. Constant ratio → GP. Reciprocals with constant difference → HP.',
      questionType: 'All progression questions',
    },
    {
      id: 'h-qa-prog-2',
      step: 'Step 2: Extract a, d or r, and n from the story',
      detail: 'Count terms carefully with n = (last − first)/d + 1. For real-life stories (salary increments, bouncing balls) write the first three terms explicitly.',
      questionType: 'Word problems',
    },
    {
      id: 'h-qa-prog-3',
      step: 'Step 3: Apply the single formula that answers the question',
      detail: 'Term → T_n; total → S_n; average → middle term; infinite → a/(1 − r). Sanity-check the size against the options.',
      questionType: 'All',
    },
  ],
})

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5 — COUNTING & PROBABILITY
// ─────────────────────────────────────────────────────────────────────────────

const M5 = 'Module 5: Counting & Probability'

const qaPnC = topic({
  id: 'qa-permutations-combinations',
  subjectId: S,
  title: 'Permutations & Combinations',
  moduleNumber: 5,
  moduleName: M5,
  order: 18,
  difficulty: 'advanced',
  examFrequency: 'high',
  audience: ['pg', 'tech'],
  featuredQuestionIds: ['q-qa-pnc-01', 'q-qa-pnc-02'],
  subtopicDetails: subs('qa-permutations-combinations', [
    [
      'Fundamental principle of counting',
      'If one task can be done in m ways and a second in n ways, both together can be done in m × n ways (AND → multiply). Mutually exclusive alternatives add (OR → add). Every P&C question is built from these two rules.',
    ],
    [
      'Permutations: order matters',
      'nPr = n!/(n − r)! counts ordered arrangements of r items from n. Arranging all n items: n!. Arrangements with repetition allowed: n^r. Words with repeated letters: n!/(p! q! ...).',
    ],
    [
      'Combinations: order does not matter',
      'nCr = n!/[r!(n − r)!] counts selections. nCr = nC(n−r), nC0 = nCn = 1, and nCr + nC(r−1) = (n+1)Cr. Committees, handshakes, teams and "choose k from n" all use nCr.',
    ],
    [
      'Restrictions: together, never together, fixed positions',
      'Items that must be together: tie them into one block (multiply by the block\'s internal arrangements). Never together: total − together. Vowels in even places: fill the restricted positions first, then the rest.',
    ],
    [
      'Circular arrangements',
      'n distinct objects around a circle: (n − 1)!. If clockwise and anticlockwise are the same (necklace, garland): (n − 1)!/2. Two specific people together in a circle: (n − 2)! × 2.',
    ],
    [
      'Distribution and selection with identical items',
      'Distributing n identical items into r groups (empty allowed): (n + r − 1)C(r − 1). Number of diagonals of an n-gon: nC2 − n. Number of triangles from n non-collinear points: nC3. Lines from n points: nC2.',
    ],
  ]),
  explanationMd: `# Permutations & Combinations

### Ask one question first: does order matter?
- Arranging people in a row, forming numbers, making words → **order matters → permutation**.
- Choosing a committee, a team, a hand of cards → **order does not matter → combination**.

A selection followed by an arrangement is nCr × r! = nPr, which is why the two formulas differ only by the r!.

### The two principles
**Multiply** for "and" (each stage independently chosen), **add** for "or" (mutually exclusive cases). Almost every hard question is solved by splitting into cases you can add, and within each case multiplying stage counts.

### Arrangement templates
- All n distinct: n!
- With repeated letters (e.g. BANANA): 6!/(3! 2!) = 60
- Keep certain items together: bundle them → (n − k + 1)! × k!
- Keep certain items apart: total − together
- Fill restricted positions first (vowels at even places, no zero at the front)
- Circle: (n − 1)!; necklace: (n − 1)!/2

### Selection templates
- Committee of 3 men and 2 women from 6 men and 5 women: 6C3 × 5C2 = 20 × 10 = 200.
- "At least one" → total − none.
- Handshakes among n people: nC2.
- Diagonals of a polygon: nC2 − n.
- Non-negative integer solutions of x1 + x2 + ... + xr = n: (n + r − 1)C(r − 1).

### Number formation
Count digits by position with restrictions handled first. Five-digit numbers from 0-9 without repetition: 9 × 9 × 8 × 7 × 6 (first digit cannot be 0). Divisible by 5: last digit must be 0 or 5 — handle 0 and 5 as separate cases because 0 also affects the first position.

### Traps
- nPr counts ordered picks; using it for a committee overcounts by r!.
- "At least" almost always wants the complement.
- In circular arrangements, fix one person to remove rotational duplicates.`,
  formulas: [
    {
      id: 'f-qa-pnc-1',
      label: 'Permutations and combinations',
      formula: 'nPr = n!/(n − r)!;   nCr = n!/[r!(n − r)!];   nCr = nC(n−r)',
      exampleQ: 'How many committees of 3 can be formed from 8 people?',
      exampleA: '8C3 = 8 × 7 × 6 / 6 = 56.',
    },
    {
      id: 'f-qa-pnc-2',
      label: 'Arrangements with repeats and circles',
      formula: 'Word with repeats: n!/(p! q! ...);   Circle: (n − 1)!;   Necklace: (n − 1)!/2',
      exampleQ: 'In how many ways can the letters of BANANA be arranged?',
      exampleA: '6!/(3! × 2!) = 720/12 = 60.',
    },
    {
      id: 'f-qa-pnc-3',
      label: 'Together / never together',
      formula: 'Together = (n − k + 1)! × k!;   Never together = n! − together',
      exampleQ: 'In how many ways can 5 boys and 2 girls sit in a row if the girls are never together?',
      exampleA: 'Total 7! = 5040; together = 6! × 2! = 1440; never together = 3600.',
    },
  ],
  tricks: [
    {
      id: 't-qa-pnc-1',
      title: 'Complement for "at least one"',
      trick: '"At least one woman" = all committees − committees with no women. One subtraction instead of three or four cases.',
      whenToUse: 'Any "at least" or "not all" selection question.',
    },
    {
      id: 't-qa-pnc-2',
      title: 'Rank of a word in dictionary order',
      trick: 'For each letter from the left, count letters smaller than it that remain unused, multiply by the factorial of the remaining positions, add up, then add 1.',
      whenToUse: '"What is the rank of the word MOTHER when all arrangements are listed alphabetically?"',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-pnc-1',
      step: 'Step 1: Decide permutation or combination',
      detail: 'If swapping two chosen items produces a different outcome, it is a permutation. If not, a combination.',
      questionType: 'All P&C questions',
    },
    {
      id: 'h-qa-pnc-2',
      step: 'Step 2: Handle restrictions first, then fill the rest',
      detail: 'Place the constrained items or positions (together, apart, first digit, vowel positions) before counting free positions. Split into additive cases when a restriction has alternatives.',
      questionType: 'Restricted arrangements',
    },
    {
      id: 'h-qa-pnc-3',
      step: 'Step 3: Multiply within a case, add across cases, check for overcount',
      detail: 'Ask whether any arrangement has been counted twice (rotations in a circle, identical letters). Divide out the duplication if so.',
      questionType: 'All',
    },
  ],
})

const qaProbability = topic({
  id: 'qa-probability',
  subjectId: S,
  title: 'Probability',
  moduleNumber: 5,
  moduleName: M5,
  order: 19,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-qa-prob-01', 'q-qa-prob-02'],
  subtopicDetails: subs('qa-probability', [
    [
      'Classical probability and sample spaces',
      'P(E) = favourable outcomes / total outcomes, when all outcomes are equally likely. Know the standard sample spaces: one die 6, two dice 36, one coin 2, three coins 8, a deck 52 (4 suits × 13, 26 red, 12 face cards, 4 aces).',
    ],
    [
      'Complement, union and mutually exclusive events',
      'P(not E) = 1 − P(E). P(A or B) = P(A) + P(B) − P(A and B); for mutually exclusive events the overlap is 0. "At least one" is 1 − P(none).',
    ],
    [
      'Independent events and multiplication',
      'For independent events P(A and B) = P(A) × P(B). Repeated coin tosses, dice throws and draws with replacement are independent. Draws without replacement are not — update the denominator each draw.',
    ],
    [
      'Conditional probability',
      'P(A | B) = P(A and B)/P(B). "Given that the first card is an ace" restricts the sample space to 51 cards. Bayes-type questions in PG papers use tree diagrams.',
    ],
    [
      'Dice, cards and balls — the standard sets',
      'Two dice: sums 2 to 12 with frequencies 1,2,3,4,5,6,5,4,3,2,1; P(sum 7) = 6/36. Cards: P(king or heart) = (4 + 13 − 1)/52. Balls from a bag: use combinations, e.g. 2 red from 5 red and 3 blue = 5C2/8C2.',
    ],
    [
      'Odds and expected value',
      'Odds in favour a : b means P = a/(a + b). Expected value = Σ(outcome × probability); used in game and payoff questions in MBA-pattern tests.',
    ],
  ]),
  explanationMd: `# Probability

### One definition, many costumes
P(event) = (ways the event can happen) / (ways anything can happen), provided every outcome is equally likely. Counting the two numbers is where P&C comes in.

### Memorise the standard spaces
- One die: 6 outcomes. Two dice: 36. Sum of 7 is the most likely (6 ways); sums 2 and 12 are rarest (1 way each).
- Coins: 2^n outcomes for n coins. Exactly k heads in n tosses: nCk / 2^n.
- Cards: 52 = 4 suits × 13 ranks; 26 red, 26 black; 12 face cards (J, Q, K); 4 of each rank.

### The three rules
1. **Complement**: P(not E) = 1 − P(E). Use for "at least one".
2. **Addition**: P(A or B) = P(A) + P(B) − P(both). Subtract the overlap; for exclusive events it is zero.
3. **Multiplication**: P(A and B) = P(A) × P(B | A). For independent events P(B | A) = P(B).

### With and without replacement
Drawing two balls *with* replacement keeps the denominator fixed; *without* replacement it shrinks by one each time and the numerator adjusts. Combinations handle the "without" case in one step: P(2 red from 5R, 3B) = 5C2 / 8C2 = 10/28.

### Conditional probability
"Given that ..." shrinks the universe. P(second card is an ace | first was an ace) = 3/51. Set up a tree when there are two stages with different branches (e.g. two factories with different defect rates).

### Typical question families
- Leap year has 53 Sundays: 2/7 (the 2 extra days).
- At least one head in 3 tosses: 1 − 1/8 = 7/8.
- Two people speak truth 75% and 80% of the time; they contradict each other with probability 0.75 × 0.2 + 0.25 × 0.8 = 0.35.

### Traps
- Probability is never greater than 1 or negative — any such option is wrong.
- "Or" with overlapping events needs the subtraction.
- "Exactly one" of A and B is P(A)(1 − P(B)) + (1 − P(A))P(B), not P(A) + P(B).`,
  formulas: [
    {
      id: 'f-qa-prob-1',
      label: 'Basic, complement, addition',
      formula: 'P = favourable/total;   P(not E) = 1 − P(E);   P(A ∪ B) = P(A) + P(B) − P(A ∩ B)',
      exampleQ: 'A card is drawn from a pack. Probability it is a king or a heart?',
      exampleA: '(4 + 13 − 1)/52 = 16/52 = 4/13.',
    },
    {
      id: 'f-qa-prob-2',
      label: 'Multiplication (independent) and conditional',
      formula: 'P(A ∩ B) = P(A) × P(B | A);   independent ⇒ P(A) × P(B)',
      exampleQ: 'Two dice are thrown. Probability that both show 6?',
      exampleA: '1/6 × 1/6 = 1/36.',
    },
    {
      id: 'f-qa-prob-3',
      label: 'Binomial-style count',
      formula: 'P(exactly k successes in n independent trials) = nCk p^k (1 − p)^(n−k)',
      exampleQ: 'Probability of exactly 2 heads in 4 tosses of a fair coin?',
      exampleA: '4C2 × (1/2)^4 = 6/16 = 3/8.',
    },
  ],
  tricks: [
    {
      id: 't-qa-prob-1',
      title: 'Two-dice sum table',
      trick: 'Ways to get a sum s with two dice: s − 1 for s ≤ 7, and 13 − s for s ≥ 7. Sum 4 → 3 ways, sum 10 → 3 ways, sum 7 → 6 ways.',
      whenToUse: 'Any two-dice sum question.',
    },
    {
      id: 't-qa-prob-2',
      title: 'Extra days in a year',
      trick: 'An ordinary year has 1 extra day (52 weeks + 1); a leap year has 2. P(53 Sundays) = 1/7 for an ordinary year and 2/7 for a leap year.',
      whenToUse: '"Probability that a leap year has 53 Mondays" type questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-prob-1',
      step: 'Step 1: Write the sample space size',
      detail: 'Before reading the event, fix the total number of equally likely outcomes (36 for two dice, 52C2 for two cards, 8C2 for two balls from 8).',
      questionType: 'All probability questions',
    },
    {
      id: 'h-qa-prob-2',
      step: 'Step 2: Count favourable outcomes with P&C, or use the complement',
      detail: 'For "at least", count the complement and subtract from 1. For "or", add and remove the overlap. For sequential draws, decide with/without replacement.',
      questionType: 'Counting favourable cases',
    },
    {
      id: 'h-qa-prob-3',
      step: 'Step 3: Reduce the fraction and check it lies in [0, 1]',
      detail: 'Options are given in lowest terms; reduce yours. A probability above 1 or an "or" probability smaller than either part signals an error.',
      questionType: 'All',
    },
  ],
})

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 6 — GEOMETRY, MENSURATION, CLOCKS & DATA
// ─────────────────────────────────────────────────────────────────────────────

const M6 = 'Module 6: Geometry, Mensuration & Data Interpretation'

const qaMensuration = topic({
  id: 'qa-mensuration',
  subjectId: S,
  title: 'Mensuration: Area, Perimeter & Volume',
  moduleNumber: 6,
  moduleName: M6,
  order: 20,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-qa-men-01', 'q-qa-men-02'],
  subtopicDetails: subs('qa-mensuration', [
    [
      '2-D figures: rectangle, square, triangle, parallelogram, trapezium',
      'Rectangle: A = lb, P = 2(l + b), diagonal = √(l² + b²). Square: A = s², diagonal = s√2. Triangle: ½ × base × height, or Heron\'s √[s(s − a)(s − b)(s − c)]; equilateral (√3/4) a². Trapezium: ½ (sum of parallel sides) × height. Parallelogram: base × height.',
    ],
    [
      'Circles, sectors and rings',
      'Area πr², circumference 2πr. Sector of angle θ: area (θ/360) πr², arc (θ/360) 2πr. Ring between radii R and r: π(R² − r²). Use π = 22/7 when radii are multiples of 7.',
    ],
    [
      '3-D solids: cuboid, cube, cylinder',
      'Cuboid: V = lbh, TSA = 2(lb + bh + hl), diagonal √(l² + b² + h²). Cube: V = a³, TSA = 6a², diagonal a√3. Cylinder: V = πr²h, CSA = 2πrh, TSA = 2πr(r + h).',
    ],
    [
      'Cone, sphere and hemisphere',
      'Cone: V = ⅓ πr²h, slant l = √(r² + h²), CSA = πrl, TSA = πr(l + r). Sphere: V = 4/3 πr³, SA = 4πr². Hemisphere: V = 2/3 πr³, CSA = 2πr², TSA = 3πr².',
    ],
    [
      'Percentage change in dimensions',
      'If every length scales by k, area scales by k² and volume by k³. Length +20% and breadth −20% → area × 1.2 × 0.8 = 0.96 (−4%). Radius doubled → sphere volume × 8.',
    ],
    [
      'Melting, recasting and paths',
      'Volume is conserved when a solid is melted and recast: equate volumes. Paths around/inside a rectangle: area of outer rectangle − inner rectangle. Wire bent into different shapes: perimeter is constant.',
    ],
  ]),
  explanationMd: `# Mensuration

### Formula sheet in your head
There is no way around memorising the standard areas and volumes, but there are fewer than twenty and they group naturally:

**Flat shapes**: rectangle lb, square s², triangle ½bh, circle πr², trapezium ½(a + b)h, parallelogram bh, rhombus ½ d1 d2.

**Solids**: prisms and cylinders are "base area × height"; cones and pyramids are one-third of that; a sphere is 4/3 πr³ and its surface is 4πr² (exactly four great circles).

### Scaling is the placement shortcut
If all lengths multiply by k, areas multiply by k² and volumes by k³. This answers a whole family of questions without a single area formula: "the radius of a sphere is increased by 50%, by what percent does the volume increase?" → 1.5³ = 3.375 → 237.5%.

For two dimensions changing differently, multiply the factors: length +10%, breadth +20% → area × 1.1 × 1.2 = 1.32 → +32%. This is exactly the successive-percentage formula.

### Conserved quantities
- **Melting/recasting**: volume before = volume after. A sphere of radius 6 recast into small spheres of radius 2 gives (6/2)³ = 27 spheres.
- **Wire reshaping**: perimeter is constant. A wire forming a square of side 22 reshaped into a circle has circumference 88 → r = 14.
- **Water rising in a tank**: volume of the immersed object = rise × base area.

### Paths and borders
A path of width w outside a rectangle l × b has area (l + 2w)(b + 2w) − lb. Inside: lb − (l − 2w)(b − 2w). Do the subtraction; do not try to add strips.

### Triangles worth knowing
Equilateral area (√3/4)a², height (√3/2)a. Right triangle: legs 3-4-5, 5-12-13, 8-15-17, 7-24-25. Heron's formula for three sides.

### Traps
- CSA vs TSA — "painted from outside" usually means TSA; "label around a can" means CSA.
- Cone slant height l ≠ height h; compute l = √(r² + h²).
- Units: cm³ to litres divide by 1000; m² to cm² multiply by 10,000.`,
  formulas: [
    {
      id: 'f-qa-men-1',
      label: 'Key 2-D formulas',
      formula: 'Circle: A = πr², C = 2πr;   Triangle: ½bh or √[s(s−a)(s−b)(s−c)];   Trapezium: ½(a + b)h',
      exampleQ: 'Find the area of a triangle with sides 13, 14, 15.',
      exampleA: 's = 21. Area = √(21 × 8 × 7 × 6) = √7056 = 84.',
    },
    {
      id: 'f-qa-men-2',
      label: 'Key 3-D formulas',
      formula: 'Cylinder V = πr²h, CSA = 2πrh;   Cone V = ⅓πr²h, CSA = πrl;   Sphere V = 4/3πr³, SA = 4πr²',
      exampleQ: 'A cylinder has radius 7 cm and height 10 cm. Find its curved surface area.',
      exampleA: '2 × 22/7 × 7 × 10 = 440 cm².',
    },
    {
      id: 'f-qa-men-3',
      label: 'Scaling',
      formula: 'Length × k ⇒ Area × k², Volume × k³',
      exampleQ: 'Each edge of a cube is increased by 20%. By what percent does the surface area increase?',
      exampleA: '1.2² = 1.44 → 44% increase.',
    },
  ],
  tricks: [
    {
      id: 't-qa-men-1',
      title: 'Percent change via multiplying factors',
      trick: 'Area change for length +a% and breadth +b% is a + b + ab/100 %. For volume with three dimensions apply the formula twice.',
      whenToUse: 'Any "dimensions are changed by x%" question.',
    },
    {
      id: 't-qa-men-2',
      title: 'Recasting count = ratio of cubes',
      trick: 'Number of small spheres (or cubes) from a big one = (big radius / small radius)³. No π, no 4/3.',
      whenToUse: 'Melting and recasting into similar shapes.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-men-1',
      step: 'Step 1: Sketch and label the figure',
      detail: 'A five-second sketch with dimensions marked prevents mixing radius with diameter and height with slant height.',
      questionType: 'All mensuration questions',
    },
    {
      id: 'h-qa-men-2',
      step: 'Step 2: Choose between a formula and a scaling argument',
      detail: 'If the question is about a percentage change or a ratio, scale with k² or k³ and skip the formula. If a numeric area or volume is asked, use the formula.',
      questionType: 'Percent change / ratios',
    },
    {
      id: 'h-qa-men-3',
      step: 'Step 3: Compute with π = 22/7 or 3.14 as the numbers suggest, and fix units',
      detail: 'Radii that are multiples of 7 want 22/7. Convert cm³ to litres or m² to hectares as the options require.',
      questionType: 'Numeric answers',
    },
  ],
})

const qaGeometry = topic({
  id: 'qa-geometry-trigonometry',
  subjectId: S,
  title: 'Geometry, Coordinate Geometry & Heights-Distances',
  moduleNumber: 6,
  moduleName: M6,
  order: 21,
  difficulty: 'advanced',
  examFrequency: 'moderate',
  audience: ['pg', 'tech'],
  featuredQuestionIds: ['q-qa-geo-01', 'q-qa-geo-02'],
  subtopicDetails: subs('qa-geometry-trigonometry', [
    [
      'Lines and angles',
      'Angles on a straight line sum to 180°, around a point to 360°. With parallel lines: alternate angles equal, corresponding angles equal, co-interior angles supplementary. Sum of interior angles of an n-gon = (n − 2) × 180°; each exterior angle of a regular n-gon = 360°/n.',
    ],
    [
      'Triangles: properties and similarity',
      'Angle sum 180°; exterior angle = sum of opposite interior angles. Similar triangles have proportional sides and the ratio of areas equals the square of the ratio of sides. Pythagoras for right triangles; the 30-60-90 triangle has sides 1 : √3 : 2 and the 45-45-90 has 1 : 1 : √2.',
    ],
    [
      'Circles: chords, tangents and angles',
      'Angle in a semicircle is 90°; angle at the centre is twice the angle at the circumference; angles in the same segment are equal; opposite angles of a cyclic quadrilateral sum to 180°. A tangent is perpendicular to the radius; two tangents from an external point are equal.',
    ],
    [
      'Coordinate geometry essentials',
      'Distance √[(x2 − x1)² + (y2 − y1)²]; midpoint ((x1 + x2)/2, (y1 + y2)/2); slope (y2 − y1)/(x2 − x1). Parallel lines have equal slopes, perpendicular lines have slopes multiplying to −1. Area of a triangle from coordinates: ½|x1(y2 − y3) + x2(y3 − y1) + x3(y1 − y2)|.',
    ],
    [
      'Trigonometric ratios and standard values',
      'sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent. Values at 0°, 30°, 45°, 60°, 90°: sin = 0, 1/2, 1/√2, √3/2, 1; cos runs the same list backwards; tan = 0, 1/√3, 1, √3, undefined. sin²θ + cos²θ = 1.',
    ],
    [
      'Heights and distances',
      'Angle of elevation is measured upward from the horizontal, depression downward. Draw the right triangle, label the known side, and use tan (for horizontal-vertical pairs). Two-observation problems: write tan for each angle and subtract the equations.',
    ],
  ]),
  explanationMd: `# Geometry, Coordinate Geometry & Heights-Distances

### Where it appears
Engineering-pattern papers (TCS Advanced, Capgemini, Cognizant GenC) and MBA-style tests ask 2-4 geometry questions; non-tech UG papers rarely do. If you are in the tech or PG audience, this module is worth the time.

### Angles and polygons
Angle sum of an n-sided polygon is (n − 2) × 180°. Each exterior angle of a regular polygon is 360°/n — so a regular polygon with exterior angle 40° has 9 sides. Parallel lines with a transversal give equal alternate and corresponding angles.

### Triangles
- Similarity is the workhorse: sides in proportion, **areas in the square of the ratio**.
- Pythagorean triples (3-4-5, 5-12-13, 8-15-17, 7-24-25) save square roots.
- 30-60-90 sides are 1 : √3 : 2; 45-45-90 sides are 1 : 1 : √2.
- The centroid divides each median 2 : 1; the inradius of a right triangle is (a + b − c)/2.

### Circles
Angle at the centre is double the angle at the circumference on the same arc; the angle in a semicircle is a right angle; opposite angles of a cyclic quadrilateral add to 180°. Tangent–radius is 90°, and two tangents from one external point are equal.

### Coordinate geometry
Four formulas — distance, midpoint, slope, section formula — cover most MCQs. Parallel: equal slopes. Perpendicular: product of slopes −1. Collinear points: equal slopes between pairs (or zero triangle area).

### Trigonometry for heights and distances
Every problem is a right triangle with the vertical object as one leg. Elevation looks up, depression looks down (and equals the elevation from the other end, by alternate angles). Use tan when you know or want the horizontal distance and the height.

Two angles from two points on the same line: write h = d1 tan θ1 and h = d2 tan θ2, and subtract or divide. Standard values make the arithmetic clean: tan 30° = 1/√3, tan 45° = 1, tan 60° = √3.

### Traps
- Angle of depression from the top is measured from the horizontal at the top, not from the vertical.
- Similar triangles: match corresponding vertices before writing ratios.
- Perpendicular slopes: a horizontal line (slope 0) is perpendicular to a vertical line (undefined slope) — the product rule does not apply there.`,
  formulas: [
    {
      id: 'f-qa-geo-1',
      label: 'Polygon angles',
      formula: 'Interior sum = (n − 2) × 180°;   each exterior of regular n-gon = 360°/n',
      exampleQ: 'A regular polygon has an interior angle of 150°. How many sides?',
      exampleA: 'Exterior = 30°, n = 360/30 = 12.',
    },
    {
      id: 'f-qa-geo-2',
      label: 'Coordinate geometry',
      formula: 'd = √[(Δx)² + (Δy)²];   slope m = Δy/Δx;   perpendicular ⇒ m1 × m2 = −1',
      exampleQ: 'Find the distance between (1, 2) and (4, 6).',
      exampleA: '√(3² + 4²) = √25 = 5.',
    },
    {
      id: 'f-qa-geo-3',
      label: 'Heights and distances',
      formula: 'tan θ = height / horizontal distance;   tan 30° = 1/√3, tan 45° = 1, tan 60° = √3',
      exampleQ: 'From a point 30 m from the foot of a tower, the angle of elevation of the top is 60°. Height?',
      exampleA: 'h = 30 × tan 60° = 30√3 ≈ 51.96 m.',
    },
  ],
  tricks: [
    {
      id: 't-qa-geo-1',
      title: 'Shadow lengths from tan',
      trick: 'When the sun\'s elevation is 45°, shadow = height. At 30°, shadow = height × √3. At 60°, shadow = height / √3. "Shadow becomes √3 times longer" means the angle went from 60° to 30°.',
      whenToUse: 'Shadow and moving-observer questions.',
    },
    {
      id: 't-qa-geo-2',
      title: 'Area ratio = side ratio squared',
      trick: 'For similar triangles or any similar figures, areas scale with the square of any corresponding length (side, height, median, perimeter).',
      whenToUse: 'Similar triangle area questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-geo-1',
      step: 'Step 1: Draw the figure and mark every given angle and length',
      detail: 'For heights and distances, draw the vertical object, the ground and the line of sight; mark the angle at the observer.',
      questionType: 'All geometry questions',
    },
    {
      id: 'h-qa-geo-2',
      step: 'Step 2: Identify the theorem or ratio that links the known to the unknown',
      detail: 'Parallel lines → angle equalities; right triangle → Pythagoras or a trig ratio; circle → centre/circumference angle rule; coordinates → distance/slope formula.',
      questionType: 'All',
    },
    {
      id: 'h-qa-geo-3',
      step: 'Step 3: Use standard values and simplify surds at the end',
      detail: 'Keep √3 symbolic until the last step; then use √3 ≈ 1.732 only if the options are decimals.',
      questionType: 'Trigonometric answers',
    },
  ],
})

const qaClocks = topic({
  id: 'qa-clocks',
  subjectId: S,
  title: 'Clocks',
  moduleNumber: 6,
  moduleName: M6,
  order: 22,
  difficulty: 'core',
  examFrequency: 'high',
  featuredQuestionIds: ['q-qa-clk-01', 'q-qa-clk-02'],
  subtopicDetails: subs('qa-clocks', [
    [
      'Speeds of the hands',
      'The minute hand moves 6° per minute; the hour hand 0.5° per minute. The minute hand gains 5.5° per minute on the hour hand. In 12 hours the minute hand completes 12 revolutions and the hour hand 1.',
    ],
    [
      'Angle between the hands',
      'At H hours M minutes, angle = |30H − 5.5M|. If the result exceeds 180°, subtract from 360°. At 3:40: |90 − 220| = 130°.',
    ],
    [
      'Coincidence, opposition and right angles',
      'Hands coincide 11 times in 12 hours (every 65 5/11 minutes), are opposite 11 times, and are at right angles 22 times. Between H and H+1 o\'clock, the hands coincide at 60H/11 minutes past H.',
    ],
    [
      'Finding the time from a required angle',
      'Set |30H − 5.5M| = required angle and solve for M, considering both signs. "At what time between 4 and 5 are the hands at 90°?" → 5.5M = 120 ± 90 → M = 60/11 or 420/11 minutes past 4.',
    ],
    [
      'Gaining and losing clocks',
      'If a clock shows a coincidence every 64 minutes instead of 65 5/11, it gains (65 5/11 − 64) per 64 minutes; scale to a day. A clock that gains uniformly is compared through the ratio of its elapsed time to true elapsed time.',
    ],
    [
      'Mirror images and reflections',
      'Mirror image time = 11:60 − given time (or 23:60). Actual 4:20 appears as 7:40 in a mirror. Water-image (upside down) is 18:30 − given time.',
    ],
  ]),
  explanationMd: `# Clocks

### It is relative speed on a circle
The minute hand moves at 6°/min, the hour hand at 0.5°/min, so the minute hand gains **5.5° per minute**. Every clock puzzle is "how long until the gap between the hands equals some angle", which is gap ÷ 5.5.

### The angle formula
At H hours and M minutes, the angle between the hands is |30H − 5.5M|; if that is more than 180°, use 360° minus it. Check: 3:00 → 90°; 6:00 → 180°; 3:30 → |90 − 165| = 75°.

### Standard counts in 12 hours
- Coincide: 11 times (not 12 — the 12 o'clock coincidence is shared). Interval: 65 5/11 minutes.
- Opposite (180°): 11 times.
- Right angles: 22 times.
- In 24 hours double all of these.

Between H and H + 1 o'clock the hands overlap at 60H/11 minutes past H: between 4 and 5 that is 240/11 = 21 9/11 minutes past 4.

### Solving for time
Set up 30H − 5.5M = ±angle and solve for M — the ± gives the two moments within the hour (before and after the minute hand passes the hour hand). Discard any M outside 0-60.

### Faulty clocks
A clock whose hands meet every 64 minutes is running fast: true interval is 65 5/11, so it gains 1 5/11 minutes every 64 minutes. In 24 hours (1440 minutes) it gains (16/11) × (1440/64) = 32 8/11 minutes. Turn everything into a proportion of true time to clock time.

### Mirror and water images
Mirror: subtract from 11:60 (if the given time is under 11:00) or 23:60. Water image (clock lying flat, seen from below): subtract from 18:30.

### Traps
- Angle over 180° must be replaced by its reflex complement.
- "Between 5 and 6, hands coincide" happens once, not twice.
- Convert 5/11-type fractions correctly: 65 5/11 minutes is 65 min 27 3/11 s.`,
  formulas: [
    {
      id: 'f-qa-clk-1',
      label: 'Angle between the hands',
      formula: 'θ = |30H − 5.5M|   (take 360 − θ if θ > 180)',
      exampleQ: 'Find the angle between the hands at 3:40.',
      exampleA: '|90 − 220| = 130°.',
    },
    {
      id: 'f-qa-clk-2',
      label: 'Coincidence time',
      formula: 'Hands overlap at 60H/11 minutes past H o\'clock',
      exampleQ: 'At what time between 4 and 5 do the hands coincide?',
      exampleA: '240/11 = 21 9/11 minutes past 4.',
    },
    {
      id: 'f-qa-clk-3',
      label: 'Mirror image',
      formula: 'Mirror time = 11:60 − actual time',
      exampleQ: 'A clock shows 4:20. What time does its mirror image show?',
      exampleA: '11:60 − 4:20 = 7:40.',
    },
  ],
  tricks: [
    {
      id: 't-qa-clk-1',
      title: 'Gap ÷ 5.5',
      trick: 'Whatever the target configuration, compute the current angular gap at the hour mark (30H) and the gap you want; minutes needed = difference ÷ 5.5.',
      whenToUse: 'Any "at what time between..." question.',
    },
    {
      id: 't-qa-clk-2',
      title: '11 not 12',
      trick: 'In 12 hours hands coincide and are opposite 11 times each, and are perpendicular 22 times. Between 11 and 1 there is only one coincidence (at 12).',
      whenToUse: 'Count-based clock questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-clk-1',
      step: 'Step 1: Fix the hour and the target angle',
      detail: 'Identify H (the hour just passed) and what is asked: coincidence (0°), opposition (180°), right angle (90°) or a specific angle.',
      questionType: 'Find the time',
    },
    {
      id: 'h-qa-clk-2',
      step: 'Step 2: Solve 30H − 5.5M = ± target',
      detail: 'Solve both signs; keep answers with 0 ≤ M < 60. Express M as a mixed fraction over 11.',
      questionType: 'Find the time',
    },
    {
      id: 'h-qa-clk-3',
      step: 'Step 3: For faulty clocks, build the true-time : clock-time ratio',
      detail: 'Compare the actual interval (65 5/11) with the observed one and scale to the period asked (a day, a week).',
      questionType: 'Gaining / losing clocks',
    },
  ],
})

const qaCalendars = topic({
  id: 'qa-calendars',
  subjectId: S,
  title: 'Calendars',
  moduleNumber: 6,
  moduleName: M6,
  order: 23,
  difficulty: 'core',
  examFrequency: 'high',
  featuredQuestionIds: ['q-qa-cal-01', 'q-qa-cal-02'],
  subtopicDetails: subs('qa-calendars', [
    [
      'Odd days',
      'Odd days = remainder when a number of days is divided by 7. An ordinary year has 365 = 52 × 7 + 1 → 1 odd day; a leap year has 2. So the same date moves forward one weekday in an ordinary year and two after a leap year.',
    ],
    [
      'Leap year rule',
      'Divisible by 4 → leap, except century years, which must be divisible by 400. 1900 was not a leap year; 2000 was. 2100 will not be.',
    ],
    [
      'Odd days in centuries',
      '100 years → 5 odd days; 200 → 3; 300 → 1; 400 → 0. The 400-year cycle repeats exactly, so 1 January 0001, 0401, 0801, ..., 2001 were all Mondays.',
    ],
    [
      'Month codes',
      'Odd days per month: Jan 3, Feb 0 (1 in a leap year), Mar 3, Apr 2, May 3, Jun 2, Jul 3, Aug 3, Sep 2, Oct 3, Nov 2, Dec 3. Adding these gives the weekday shift from the 1st of January.',
    ],
    [
      'Finding the day for any date',
      'Odd days = (completed centuries) + (completed years in the century: count + leap years) + (completed months) + (days in the current month), all mod 7. 0 = Sunday, 1 = Monday, ..., 6 = Saturday.',
    ],
    [
      'Same-calendar years and repeated days',
      'A year repeats its calendar when the cumulative odd days since it return to 0. Ordinary years usually repeat after 6 or 11 years; leap years after 28. Dates that fall on the same weekday within a year: 1 Jan & 1 Oct (ordinary), 1 Feb & 1 Mar (ordinary), 4/4, 6/6, 8/8, 10/10, 12/12 always.',
    ],
  ]),
  explanationMd: `# Calendars

### The idea: count leftover days
Weekdays repeat every 7 days, so all that matters about a stretch of time is its remainder mod 7 — the **odd days**. An ordinary year has 1 odd day, a leap year 2. That single fact answers "if 15 August 2023 was a Tuesday, what day was 15 August 2024?" → 2024 is a leap year and 29 Feb lies between the dates, so +2 → Thursday.

### Leap years
Every 4th year, except century years, which need divisibility by 400. 2000 yes, 1900 no, 2100 no. When counting leap years in a span, count multiples of 4 and remove the non-400 centuries.

### The 400-year cycle
400 years contain exactly 0 odd days (5 + 5 + 5 + 6 = 21 ≡ 0), so the calendar repeats every 400 years. Memorise: 100 years → 5 odd days, 200 → 3, 300 → 1, 400 → 0. The reference is that the calendar era begins on a Monday (day code 1).

### Day of any date — the recipe
1. Odd days from completed centuries (0, 5, 3, 1 pattern).
2. Odd days from completed years in the current century: (ordinary years × 1 + leap years × 2) mod 7.
3. Odd days from completed months (month codes).
4. Days elapsed in the current month.

Add, take mod 7, and read off: 0 Sun, 1 Mon, 2 Tue, 3 Wed, 4 Thu, 5 Fri, 6 Sat.

### Faster patterns
- Same weekday pairs in any year: 4 Apr, 6 Jun, 8 Aug, 10 Oct, 12 Dec, and 9 May, 5 Sep, 7 Nov, 11 Jul ("Doomsday" dates).
- A given date advances 1 weekday per ordinary year and 2 per leap year.
- Calendar of an ordinary year repeats after 6 or 11 years (whichever brings the odd-day total to 7); a leap year's repeats after 28 years.

### Traps
- 29 February must lie *between* your two dates for the +2 to apply.
- Century years are the usual leap-year error.
- Odd days for "first 100 years" is 5, not 0 — only 400 gives 0.`,
  formulas: [
    {
      id: 'f-qa-cal-1',
      label: 'Odd days',
      formula: 'Ordinary year: 1;  Leap year: 2;  100 yrs: 5;  200 yrs: 3;  300 yrs: 1;  400 yrs: 0',
      exampleQ: 'How many odd days are there in 300 years?',
      exampleA: '1 odd day (300 = 3 × 100 → 15 ≡ 1 mod 7).',
    },
    {
      id: 'f-qa-cal-2',
      label: 'Day shift between the same dates',
      formula: 'Shift = (number of ordinary years) × 1 + (number of leap years crossed) × 2, mod 7',
      exampleQ: '26 January 2023 was a Thursday. What day was 26 January 2025?',
      exampleA: 'Two years, one of them (2024) leap: 1 + 2 = 3 → Thursday + 3 = Sunday.',
    },
    {
      id: 'f-qa-cal-3',
      label: 'Day code',
      formula: 'Total odd days mod 7: 0 Sun, 1 Mon, 2 Tue, 3 Wed, 4 Thu, 5 Fri, 6 Sat',
      exampleQ: 'Find the day on 15 August 1947.',
      exampleA: '1600 yrs: 0; 300 yrs: 1; 46 yrs (11 leap + 35 ordinary): 22 + 35 = 57 ≡ 1; Jan–Jul 1947: 3+0+3+2+3+2+3 = 16 ≡ 2; 15 days: 1. Total 0+1+1+2+1 = 5 → Friday.',
    },
  ],
  tricks: [
    {
      id: 't-qa-cal-1',
      title: 'Doomsday anchors',
      trick: '4/4, 6/6, 8/8, 10/10, 12/12, 9/5, 5/9, 7/11, 11/7 and the last day of February all fall on the same weekday every year. Find that weekday once and count from the nearest anchor.',
      whenToUse: 'Day-of-date questions within a known year.',
    },
    {
      id: 't-qa-cal-2',
      title: 'Same-calendar jumps',
      trick: 'From an ordinary year, the calendar repeats after 6 years if a leap year comes early in the gap, else 11. From a leap year it repeats after 28 years (or 6/12/40 near century boundaries).',
      whenToUse: '"Which year will have the same calendar as 2025?"',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-cal-1',
      step: 'Step 1: Decide whether you are shifting from a known date or computing from scratch',
      detail: 'If a reference date is given, count odd days between the two dates. If not, use the century-year-month-day recipe.',
      questionType: 'All calendar questions',
    },
    {
      id: 'h-qa-cal-2',
      step: 'Step 2: Count leap years carefully',
      detail: 'Multiples of 4 in the range, minus century years not divisible by 400. Check whether 29 February actually lies between your dates.',
      questionType: 'Shift between dates',
    },
    {
      id: 'h-qa-cal-3',
      step: 'Step 3: Reduce mod 7 and move the weekday forward',
      detail: 'Add odd days to the known weekday, wrapping after Saturday. Double-check direction if the target date is earlier than the reference (move backward).',
      questionType: 'All',
    },
  ],
})

const qaDI = topic({
  id: 'qa-data-interpretation',
  subjectId: S,
  title: 'Data Interpretation: Tables, Bar, Line, Pie & Caselets',
  moduleNumber: 6,
  moduleName: M6,
  order: 24,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-qa-di-01', 'q-qa-di-02'],
  subtopicDetails: subs('qa-data-interpretation', [
    [
      'Reading tables and bar charts',
      'Scan headers and units first (thousands? percentages? per year?). Bar charts compare categories; stacked bars need subtraction to isolate a segment. Most questions are totals, differences, ratios or percentage changes between two cells.',
    ],
    [
      'Line graphs and trends',
      'Line graphs show change over time. "Maximum percentage increase" is found by comparing ratios, not absolute gaps — a rise from 20 to 30 (50%) beats a rise from 100 to 120 (20%). Steepest slope ≠ largest percentage change.',
    ],
    [
      'Pie charts and degree–percent conversion',
      'Full circle = 360° = 100%, so 1% = 3.6° and 36° = 10%. With a total given, a sector\'s value = (angle/360) × total. Two pie charts with different totals cannot be compared by angles alone — convert to values first.',
    ],
    [
      'Caselets and mixed sets',
      'A caselet is a paragraph of data. Convert it into a table before answering anything; two minutes of tabulation saves five minutes of re-reading. Venn-diagram caselets ("students who like tea, coffee, both") use n(A ∪ B) = n(A) + n(B) − n(A ∩ B).',
    ],
    [
      'Approximation and option elimination',
      'Options in DI are usually spaced 3-5% apart. Round to two significant figures, compute, and pick the nearest. For ratio questions compare cross-products rather than dividing.',
    ],
    [
      'Percentage and ratio reasoning across sets',
      'Percent of total, percent change year-on-year, share of a component, ratio of two components, and "how many times" — five question types cover almost all DI. Averages across years need the sum, not the average of averages.',
    ],
  ]),
  explanationMd: `# Data Interpretation

### What DI really tests
Not maths — **reading discipline and approximation**. The arithmetic is percentages, ratios and averages you already know. Marks are lost by misreading a unit, picking the wrong row, or computing exactly when an estimate would do.

### First 30 seconds on any set
1. Read the title and every axis label / column header.
2. Note the **units** (lakh, thousand, %, per capita).
3. Note whether values are absolutes or percentages of some total — and whether that total is given.
4. Glance at the questions to see which rows or years matter; ignore the rest.

### By chart type
- **Table**: the most direct. Watch for totals rows and footnotes.
- **Bar**: compare heights; for stacked bars subtract to get segments.
- **Line**: trends over time. Percentage change uses the earlier value as base.
- **Pie**: 1% = 3.6°. Convert angles to values using the given total before comparing two pies.
- **Caselet**: tabulate the paragraph first. Venn caselets use inclusion–exclusion.

### Question types you will meet
1. Value of a cell or a sector.
2. Difference or sum across cells.
3. Ratio of two values (compare cross-products).
4. Percentage change between years (divide by the earlier value).
5. Average over a range (sum first).
6. "How many years / categories satisfy ..." (count carefully, include boundaries as stated).

### Approximation
When options are far apart, round aggressively: 4,873 ÷ 1,212 ≈ 4,900 ÷ 1,200 ≈ 4.08. When two options are close, compute one more digit only for those two.

### Traps
- Percentage **share** vs percentage **change** — different questions, different bases.
- Percentages from two different totals cannot be added or compared directly.
- "Increase from 2022 to 2023" uses 2022 as the base; "decrease from 2023 to 2022" is a different number.
- Reading the wrong year column is the single most common DI error; use a finger or a ruler.`,
  formulas: [
    {
      id: 'f-qa-di-1',
      label: 'Percentage change and share',
      formula: '% change = (new − old)/old × 100;   share % = part/total × 100',
      exampleQ: 'Sales rose from 240 to 300 units. Percentage increase?',
      exampleA: '(300 − 240)/240 × 100 = 25%.',
    },
    {
      id: 'f-qa-di-2',
      label: 'Pie chart conversion',
      formula: 'Value = (angle / 360) × total;   1% = 3.6°',
      exampleQ: 'A sector of 54° in a pie chart of total Rs 2,40,000 represents:',
      exampleA: '54/360 × 2,40,000 = 0.15 × 2,40,000 = Rs 36,000.',
    },
    {
      id: 'f-qa-di-3',
      label: 'Inclusion–exclusion (Venn caselets)',
      formula: 'n(A ∪ B) = n(A) + n(B) − n(A ∩ B);   neither = total − n(A ∪ B)',
      exampleQ: 'Of 100 students, 60 like tea, 50 like coffee and 20 like both. How many like neither?',
      exampleA: 'Either = 60 + 50 − 20 = 90; neither = 10.',
    },
  ],
  tricks: [
    {
      id: 't-qa-di-1',
      title: 'Cross-multiply to compare ratios',
      trick: 'To decide whether 347/512 is bigger than 289/431, compare 347 × 431 with 289 × 512 — or just compare rough percentages (67.8% vs 67.1%). Never do long division.',
      whenToUse: '"Which year had the highest ratio of X to Y?" questions.',
    },
    {
      id: 't-qa-di-2',
      title: 'Percent change by fraction',
      trick: 'Turn the change into a fraction of the base and use the 1/n table: a rise of 45 on 360 is 1/8 = 12.5%. Faster than multiplying by 100.',
      whenToUse: 'Percentage-change questions on charts.',
    },
  ],
  howToSolve: [
    {
      id: 'h-qa-di-1',
      step: 'Step 1: Decode the chart before the questions',
      detail: 'Units, totals, whether values are percentages, and the time axis. Write the total beside a pie chart. Tabulate a caselet.',
      questionType: 'All DI sets',
    },
    {
      id: 'h-qa-di-2',
      step: 'Step 2: Locate the exact cells and write them down',
      detail: 'Copy the two or three numbers you need onto rough paper with labels. This prevents wrong-row errors and lets you reuse the values for the next question.',
      questionType: 'All',
    },
    {
      id: 'h-qa-di-3',
      step: 'Step 3: Estimate, compare with options, refine only if needed',
      detail: 'Round to two significant figures. If two options are within 2% of your estimate, redo those two with one more digit. Otherwise mark and move on.',
      questionType: 'Calculation questions',
    },
  ],
})

export const QUANT_TOPICS_PART2: PrepTopic[] = [
  qaEquations,
  qaProgressions,
  qaPnC,
  qaProbability,
  qaMensuration,
  qaGeometry,
  qaClocks,
  qaCalendars,
  qaDI,
]

export const QUANT_QUESTIONS_PART2: UniversalQuestion[] = [
  // Equations
  mcq({ id: 'q-qa-eq-01', subjectId: S, topicId: 'qa-linear-quadratic-equations',
    q: 'If α and β are the roots of x² − 5x + 6 = 0, the value of α² + β² is:',
    options: ['11', '13', '25', '37'], answer: 1,
    why: 'α + β = 5, αβ = 6. α² + β² = 25 − 12 = 13.' }),
  mcq({ id: 'q-qa-eq-02', subjectId: S, topicId: 'qa-linear-quadratic-equations',
    q: 'For what value of k does kx² + 4x + 1 = 0 have equal roots?',
    options: ['2', '4', '8', '16'], answer: 1,
    why: 'D = 16 − 4k = 0 → k = 4.' }),
  // Progressions
  mcq({ id: 'q-qa-prog-01', subjectId: S, topicId: 'qa-progressions', difficulty: 'basic',
    q: 'The sum of the first 20 terms of the AP 3, 7, 11, ... is:',
    options: ['780', '800', '820', '840'], answer: 2,
    why: 'S = 20/2 × [2 × 3 + 19 × 4] = 10 × 82 = 820.' }),
  mcq({ id: 'q-qa-prog-02', subjectId: S, topicId: 'qa-progressions',
    q: 'The sum to infinity of 1 + 1/3 + 1/9 + 1/27 + ... is:',
    options: ['1.5', '2', '3', '2.5'], answer: 0,
    why: 'a/(1 − r) = 1/(1 − 1/3) = 3/2.' }),
  // P&C
  mcq({ id: 'q-qa-pnc-01', subjectId: S, topicId: 'qa-permutations-combinations',
    q: 'In how many ways can the letters of the word BANANA be arranged?',
    options: ['720', '120', '60', '360'], answer: 2,
    why: '6!/(3! × 2!) = 720/12 = 60 (three A\'s and two N\'s).' }),
  mcq({ id: 'q-qa-pnc-02', subjectId: S, topicId: 'qa-permutations-combinations', difficulty: 'advanced',
    q: 'A committee of 3 men and 2 women is to be formed from 6 men and 5 women. Number of ways?',
    options: ['100', '150', '200', '250'], answer: 2,
    why: '6C3 × 5C2 = 20 × 10 = 200.' }),
  // Probability
  mcq({ id: 'q-qa-prob-01', subjectId: S, topicId: 'qa-probability', difficulty: 'basic',
    q: 'Two dice are thrown. The probability that the sum is 7 is:',
    options: ['1/6', '1/9', '5/36', '7/36'], answer: 0,
    why: 'Six pairs (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) out of 36 → 1/6.' }),
  mcq({ id: 'q-qa-prob-02', subjectId: S, topicId: 'qa-probability',
    q: 'A bag has 5 red and 3 blue balls. Two are drawn at random. Probability both are red?',
    options: ['5/14', '10/56', '5/8', '15/56'], answer: 0,
    why: 'Favourable pairs 5C2 = 10; total pairs 8C2 = 28; probability = 10/28 = 5/14.' }),
  // Mensuration
  mcq({ id: 'q-qa-men-01', subjectId: S, topicId: 'qa-mensuration', difficulty: 'basic',
    q: 'The length of a rectangle is increased by 20% and the breadth decreased by 20%. The area:',
    options: ['stays the same', 'increases by 4%', 'decreases by 4%', 'decreases by 2%'], answer: 2,
    why: '1.2 × 0.8 = 0.96 → 4% decrease.' }),
  mcq({ id: 'q-qa-men-02', subjectId: S, topicId: 'qa-mensuration',
    q: 'A solid sphere of radius 6 cm is melted and recast into spheres of radius 2 cm. How many are formed?',
    options: ['9', '18', '27', '36'], answer: 2,
    why: 'Volume ratio = (6/2)³ = 27.' }),
  // Geometry
  mcq({ id: 'q-qa-geo-01', subjectId: S, topicId: 'qa-geometry-trigonometry',
    q: 'From a point 30 m from the foot of a tower, the angle of elevation of the top is 60°. The height of the tower is:',
    options: ['30 m', '30√3 m', '10√3 m', '60 m'], answer: 1,
    why: 'h = 30 × tan 60° = 30√3 m.' }),
  mcq({ id: 'q-qa-geo-02', subjectId: S, topicId: 'qa-geometry-trigonometry',
    q: 'Each interior angle of a regular polygon is 150°. The number of sides is:',
    options: ['10', '12', '15', '18'], answer: 1,
    why: 'Exterior angle = 30°; n = 360/30 = 12.' }),
  // Clocks
  mcq({ id: 'q-qa-clk-01', subjectId: S, topicId: 'qa-clocks',
    q: 'The angle between the hands of a clock at 3:40 is:',
    options: ['120°', '130°', '140°', '150°'], answer: 1,
    why: '|30 × 3 − 5.5 × 40| = |90 − 220| = 130°.' }),
  mcq({ id: 'q-qa-clk-02', subjectId: S, topicId: 'qa-clocks',
    q: 'How many times do the hands of a clock coincide in 24 hours?',
    options: ['24', '22', '23', '21'], answer: 1,
    why: '11 times in 12 hours, so 22 in a day.' }),
  // Calendars
  mcq({ id: 'q-qa-cal-01', subjectId: S, topicId: 'qa-calendars', difficulty: 'basic',
    q: 'If 26 January 2023 was a Thursday, what day was 26 January 2025?',
    options: ['Saturday', 'Sunday', 'Monday', 'Friday'], answer: 1,
    why: '2023→2024: +1; 2024→2025: +2 (2024 is leap). Thursday + 3 = Sunday.' }),
  mcq({ id: 'q-qa-cal-02', subjectId: S, topicId: 'qa-calendars',
    q: 'The number of odd days in 300 years is:',
    options: ['0', '1', '3', '5'], answer: 1,
    why: '100 years → 5 odd days; 300 → 15 ≡ 1 (mod 7).' }),
  // DI
  mcq({ id: 'q-qa-di-01', subjectId: S, topicId: 'qa-data-interpretation', difficulty: 'basic',
    q: 'In a pie chart representing a total budget of Rs 2,40,000, the sector for "Rent" measures 54°. The amount spent on rent is:',
    options: ['Rs 30,000', 'Rs 36,000', 'Rs 40,000', 'Rs 45,000'], answer: 1,
    why: '54/360 = 15%; 15% of 2,40,000 = 36,000.' }),
  mcq({ id: 'q-qa-di-02', subjectId: S, topicId: 'qa-data-interpretation',
    q: 'A company\'s revenue was Rs 240 crore in 2023 and Rs 300 crore in 2024. The percentage growth is:',
    options: ['20%', '25%', '30%', '60%'], answer: 1,
    why: '(300 − 240)/240 × 100 = 25%. The base is the earlier year.' }),
]
