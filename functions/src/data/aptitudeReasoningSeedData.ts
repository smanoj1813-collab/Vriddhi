// functions/src/data/aptitudeReasoningSeedData.ts
//
// Placement Aptitude — Logical Reasoning (shared by every UG & PG program).
//
// Syllabus map follows the standard placement outline (TCS NQT Reasoning
// Ability, Infosys / Wipro / Accenture / Capgemini logical sections). All
// explanations, briefs, tricks and questions are original Vriddhi content.
//
// Structure: 1 subject > 5 modules > 18 topics > 4-6 sub-topics each (with
// briefs) + 2 MCQs per topic.

import type { PrepSubject, PrepTopic, UniversalQuestion } from '../prepShared'
import { ALL_PROGRAMS, LR_SUBJECT_ID, mcq, subs, topic } from './aptitudeShared'

const S = LR_SUBJECT_ID

export const REASONING_SUBJECT: PrepSubject = {
  id: S,
  name: 'Logical Reasoning',
  stream: 'aptitude',
  track: 'aptitude',
  programs: ALL_PROGRAMS,
  universityRegion: 'national',
  syllabusRef: 'Placement Reasoning — TCS NQT / Infosys / Wipro / Accenture / Capgemini pattern',
  icon: 'Brain',
  order: 102,
  topicCount: 18,
  status: 'published',
  description:
    'Series and analogies, coding-decoding, blood relations, directions, ordering and seating arrangements, puzzles, syllogisms, statement-based reasoning, data sufficiency, cubes-dice and non-verbal reasoning — the complete logical section of campus placement tests, with methods, shortcuts and practice.',
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 — SERIES, ANALOGY & CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────

const M1 = 'Module 1: Series, Analogy & Classification'

const lrNumberSeries = topic({
  id: 'lr-number-series',
  subjectId: S,
  title: 'Number Series',
  moduleNumber: 1,
  moduleName: M1,
  order: 1,
  difficulty: 'basic',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-lr-ns-01', 'q-lr-ns-02'],
  subtopicDetails: subs('lr-number-series', [
    [
      'Difference-based series',
      'Take first differences; if they are constant it is an AP, if they form their own pattern (AP, squares, primes) it is a second-order series. 2, 5, 10, 17, 26 → differences 3, 5, 7, 9 → next 37.',
    ],
    [
      'Ratio and multiplication series',
      'Divide consecutive terms. Constant ratio → GP (3, 6, 12, 24). Changing multiplier → ×1 +1, ×2 +2, ×3 +3 chains, e.g. 2, 3, 8, 27, 112 → ×1+1, ×2+2, ×3+3, ×4+4.',
    ],
    [
      'Squares, cubes and prime series',
      'Look for n², n² ± 1, n³, n³ ± n, and primes. 1, 4, 9, 16 (squares); 2, 9, 28, 65 (n³ + 1); 2, 3, 5, 7, 11 (primes); 0, 6, 24, 60, 120 (n³ − n).',
    ],
    [
      'Alternating and mixed series',
      'Two series interleaved: 1, 10, 3, 20, 5, 30 → odd positions 1, 3, 5 and even positions 10, 20, 30. Split by position when one rule does not fit.',
    ],
    [
      'Wrong-term and missing-term questions',
      'For "find the wrong term", compute the pattern from the majority of terms and see which single term breaks it. For missing terms in the middle, work from both ends. Check the pattern holds for at least three consecutive gaps before committing.',
    ],
  ]),
  explanationMd: `# Number Series

### Approach: differences first, then ratios, then special numbers
Nine out of ten series yield to this order:
1. **First differences.** Constant → arithmetic. Growing by a constant → second-order (take differences again). Growing by squares/primes → note it.
2. **Ratios.** Roughly doubling or tripling → geometric or ×k ± c.
3. **Recognise the number.** 1, 8, 27, 64 are cubes; 2, 6, 12, 20, 30 are n(n+1); 1, 2, 6, 24, 120 are factorials; 1, 1, 2, 3, 5, 8 is Fibonacci.

### The common families
- **AP / second-order AP**: 5, 9, 13, 17 (+4); 3, 6, 11, 18, 27 (+3, +5, +7, +9).
- **GP / mixed multipliers**: 4, 12, 36, 108 (×3); 5, 11, 23, 47 (×2 + 1).
- **Squares & cubes**: 4, 9, 16, 25; 0, 7, 26, 63 (n³ − 1).
- **Primes**: 3, 5, 7, 11, 13, 17.
- **Alternating**: two independent series woven together — split odd and even positions.
- **Factorials & Fibonacci**: 1, 2, 6, 24; 2, 3, 5, 8, 13.

### Wrong-term questions
The pattern is defined by most of the terms; one term has been altered. Compute the differences, spot where the pattern breaks, and identify the culprit — usually the term where two consecutive differences are both "off".

### Letter series (the same logic)
Assign A = 1 ... Z = 26. Then AZ, BY, CX is (1, 26), (2, 25), (3, 24) — one series rising, one falling. Skip-letter patterns (A, C, F, J: +2, +3, +4) are just difference series on letter positions.

### Time management
Spend at most 45 seconds testing differences and ratios. If nothing fits, check the alternating split, then move on — one stubborn series is not worth three easy questions.`,
  formulas: [
    {
      id: 'f-lr-ns-1',
      label: 'Second-order series',
      formula: 'If first differences form an AP with difference d, the nth term is quadratic in n',
      exampleQ: 'Find the next term: 2, 5, 10, 17, 26, ?',
      exampleA: 'Differences 3, 5, 7, 9 → next difference 11 → 37 (the series is n² + 1).',
    },
    {
      id: 'f-lr-ns-2',
      label: '×k ± c chain',
      formula: 'T(n+1) = k × T(n) ± c, with k and c possibly growing each step',
      exampleQ: 'Find the next term: 3, 7, 15, 31, 63, ?',
      exampleA: 'Each term is ×2 + 1 → 127.',
    },
  ],
  tricks: [
    {
      id: 't-lr-ns-1',
      title: 'Memorise the special sequences',
      trick: 'Squares to 20², cubes to 10³, primes to 50, factorials to 6!, and Fibonacci to 89. Recognising a term instantly beats computing differences.',
      whenToUse: 'Whenever the terms grow faster than linearly.',
    },
    {
      id: 't-lr-ns-2',
      title: 'Odd–even split',
      trick: 'If differences look random, write the 1st, 3rd, 5th terms on one line and the 2nd, 4th, 6th on another. Two clean patterns usually appear.',
      whenToUse: 'Series with a zig-zag feel (up, down, up, down).',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-ns-1',
      step: 'Step 1: Write the first differences under the series',
      detail: 'Constant → AP; regular growth → second-order; huge growth → move to ratios.',
      questionType: 'Missing term',
    },
    {
      id: 'h-lr-ns-2',
      step: 'Step 2: If differences fail, test ratios and special numbers',
      detail: 'Divide consecutive terms; look for ×2, ×3, ×k ± c. Check squares, cubes, primes, factorials near each term.',
      questionType: 'Missing / wrong term',
    },
    {
      id: 'h-lr-ns-3',
      step: 'Step 3: Verify across at least three gaps before answering',
      detail: 'A rule that fits only two gaps is a coincidence. Confirm on a third gap, then extend to the required term.',
      questionType: 'All series',
    },
  ],
})

const lrLetterSeries = topic({
  id: 'lr-letter-alphanumeric-series',
  subjectId: S,
  title: 'Letter, Alphanumeric & Word Series',
  moduleNumber: 1,
  moduleName: M1,
  order: 2,
  difficulty: 'basic',
  examFrequency: 'high',
  featuredQuestionIds: ['q-lr-ls-01', 'q-lr-ls-02'],
  subtopicDetails: subs('lr-letter-alphanumeric-series', [
    [
      'Letter positions and the EJOTY anchor',
      'A = 1 ... Z = 26. Memorise anchors E = 5, J = 10, O = 15, T = 20, Y = 25 to locate any letter fast. Reverse positions: A = 26, Z = 1 (reverse of a letter = 27 − its position).',
    ],
    [
      'Skip patterns and opposite letters',
      'A, C, F, J, O → +2, +3, +4, +5. Opposite (mirror) letters sum to 27: A–Z, B–Y, C–X, D–W, E–V, F–U, G–T, H–S, I–R, J–Q, K–P, L–O, M–N.',
    ],
    [
      'Letter-group series',
      'Each element is a group of letters (e.g. AZ, BY, CX or ABD, BCE, CDF). Track each position separately: first letters form one series, second letters another.',
    ],
    [
      'Alphanumeric sequences (bank/IT pattern)',
      'A given string like 7 A $ 3 B 9 % C ... with questions: "how many digits are immediately followed by a symbol?", "which element is 4th to the left of the 9th from the right?" Use position arithmetic: nth to the left of mth from the right = (m + n)th from the right.',
    ],
    [
      'Word and dictionary-order questions',
      'Arrange words as in a dictionary (compare first letter, then second...). "How many meaningful words can be formed from the 2nd, 4th, 7th letters of ..." — list the letters, try permutations quickly.',
    ],
  ]),
  explanationMd: `# Letter, Alphanumeric & Word Series

### Convert letters to numbers
Every letter series is a number series in disguise. Use the **EJOTY** anchors (E 5, J 10, O 15, T 20, Y 25) to find a letter's position in a second, and remember that mirror letters add to 27 (A↔Z, B↔Y, M↔N).

### Letter series types
- **Single skip**: B, E, H, K (+3).
- **Growing skip**: A, B, D, G, K (+1, +2, +3, +4).
- **Mirror**: AZ, BY, CX — one letter forward, the other backward.
- **Group series**: ABD, BCE, CDF — each position advances independently.

Read groups vertically: first letters A, B, C; second letters B, C, D; third letters D, E, F.

### Alphanumeric strings
A long mixed sequence of letters, digits and symbols is followed by three to five questions. They test only position discipline:
- "n-th to the left of m-th from the right" = (m + n)-th from the right.
- "n-th to the right of m-th from the left" = (m + n)-th from the left.
- "How many X are immediately preceded by Y and followed by Z" — scan once, mark hits.

Write the string with indexes if the question set is long; it is faster than re-counting five times.

### Dictionary order
Compare letter by letter. Shorter word comes first when it is a prefix of a longer one (CAT before CATCH). The question usually asks for the third or fourth word after sorting — sort only as far as needed.

### Word formation
"Using the 1st, 3rd, 5th and 8th letters of DEVELOPMENT, how many meaningful words can be formed?" — extract the letters, look for vowels, try common patterns. If more than one word is possible, the answer is usually "more than one" or "X" as per options.`,
  formulas: [
    {
      id: 'f-lr-ls-1',
      label: 'Position arithmetic',
      formula: 'Reverse position = 27 − position;   n-th left of m-th from right = (m + n)-th from right',
      exampleQ: 'In the alphabet, which letter is 5th to the left of the 8th letter from the right?',
      exampleA: '8th from the right is S (position 19); 5 to the left is position 14 → N. Equivalently (8 + 5) = 13th from the right = N.',
    },
    {
      id: 'f-lr-ls-2',
      label: 'Mirror pairs',
      formula: 'Letter + mirror = 27:  A–Z, B–Y, C–X, ..., M–N',
      exampleQ: 'Which pair completes the series: AZ, CX, EV, ?',
      exampleA: 'First letters +2 (A, C, E, G), second letters mirror (Z, X, V, T) → GT.',
    },
  ],
  tricks: [
    {
      id: 't-lr-ls-1',
      title: 'EJOTY',
      trick: 'E = 5, J = 10, O = 15, T = 20, Y = 25. Any letter is within two steps of an anchor.',
      whenToUse: 'Converting letters to positions quickly.',
    },
    {
      id: 't-lr-ls-2',
      title: 'Letters between two letters',
      trick: 'Number of letters strictly between two letters = difference of positions − 1. Between D (4) and M (13): 8 letters.',
      whenToUse: '"How many letters are between..." and "as far from X as Y is from Z" questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-ls-1',
      step: 'Step 1: Write positions under each letter',
      detail: 'Use EJOTY to speed this up. For groups, write one row per letter position.',
      questionType: 'Letter series',
    },
    {
      id: 'h-lr-ls-2',
      step: 'Step 2: Solve each row as a number series',
      detail: 'Differences, mirrors (27 − x), or alternating rules. Then convert the answer back to letters.',
      questionType: 'Letter / group series',
    },
    {
      id: 'h-lr-ls-3',
      step: 'Step 3: For strings, index once and answer all questions from the index',
      detail: 'Number the elements 1..n and reuse for every sub-question; convert "from the right" positions to "from the left" via n + 1 − k.',
      questionType: 'Alphanumeric sequence sets',
    },
  ],
})

const lrAnalogy = topic({
  id: 'lr-analogy-classification',
  subjectId: S,
  title: 'Analogy & Odd One Out (Classification)',
  moduleNumber: 1,
  moduleName: M1,
  order: 3,
  difficulty: 'basic',
  examFrequency: 'high',
  featuredQuestionIds: ['q-lr-an-01', 'q-lr-an-02'],
  subtopicDetails: subs('lr-analogy-classification', [
    [
      'Word analogies and relationship types',
      'Identify the exact relation in the first pair and apply it: part–whole (wheel : car), worker–tool (writer : pen), cause–effect, synonym/antonym, unit–quantity (metre : length), animal–young, country–currency, study–field (ornithology : birds).',
    ],
    [
      'Number analogies',
      'Find the operation linking the first pair: 4 : 18 could be n² + 2 (16 + 2). Test the rule on the answer choices; prefer the rule that uses the fewest operations. 7 : 50 (n² + 1), 5 : 124 (n³ − 1), 12 : 144 (n²).',
    ],
    [
      'Letter analogies',
      'Convert to positions: ACE : BDF is +1 on each letter; CAT : DDY shifts letters by +1, +3, +5. Mirror analogies use 27 − position.',
    ],
    [
      'Odd one out: words and numbers',
      'Three items share a property the fourth lacks. Check category (all mammals except one), property (all primes except one), structure (all squares), or letter pattern (all vowels-first). Choose the odd item by the most specific shared property.',
    ],
    [
      'Elimination discipline',
      'In analogies, reject options that fit a weaker relation. In classification, if two items look odd, refine the property until only one remains. Never answer on vibe; state the rule in words first.',
    ],
  ]),
  explanationMd: `# Analogy & Odd One Out

### Analogy: state the relation in a sentence
"Doctor is to hospital as teacher is to ?" — the relation is *works in*. Write it down mentally as a full sentence, then apply the same sentence to the options. Answers that fit a looser relation (teacher : student) are distractors.

### The common relation families
- Part–whole, tool–worker, product–raw material
- Synonym, antonym, degree (warm : hot)
- Unit–quantity, instrument–measure (barometer : pressure)
- Study–subject, animal–home, animal–young, group nouns
- Country–capital/currency

### Number analogies
Given a : b, find the operation and apply it to c. Prefer simple rules:
- n² ± k, n³ ± k, n × k ± m, sum/product of digits
- 6 : 42 → n(n + 1); 9 : 80 → n² − 1; 8 : 512 → n³

If two rules fit the given pair, check which one gives an answer in the options.

### Letter analogies
Convert to numbers and look at the shift pattern for each position. ABC : ZYX is a mirror; HOME : IPNF is +1 on every letter; DOG : GRJ is +3 on every letter.

### Odd one out (classification)
Find the property shared by exactly three items. Work from specific to general:
1. Category (fruit vs vegetable, mammal vs bird)
2. Numeric property (prime, square, even, divisible by 3, digit sum)
3. Structural property (letter count, vowel positions, palindrome)

For numbers, test prime/square/cube first; for words, test category first, then letter patterns.

### Traps
- Two items may look odd; choose the one that violates the **most specific** rule shared by the other three.
- In word analogies keep the *direction* consistent (whole : part must map to whole : part, not part : whole).`,
  formulas: [
    {
      id: 'f-lr-an-1',
      label: 'Number analogy rules to test in order',
      formula: 'n², n² ± 1, n³, n³ ± 1, n(n + 1), n × k, sum of digits, reversal',
      exampleQ: '7 : 50 :: 9 : ?',
      exampleA: '7² + 1 = 50 → 9² + 1 = 82.',
    },
    {
      id: 'f-lr-an-2',
      label: 'Letter shift check',
      formula: 'Compare positions of each letter pair; a constant shift or a mirror (27 − x) is the rule',
      exampleQ: 'CAT : FDW :: DOG : ?',
      exampleA: 'Each letter +3 → GRJ.',
    },
  ],
  tricks: [
    {
      id: 't-lr-an-1',
      title: 'Say the relation aloud',
      trick: 'Frame "A is the ___ of B" before looking at options. If two options fit, make the sentence more specific.',
      whenToUse: 'Word analogies.',
    },
    {
      id: 't-lr-an-2',
      title: 'Prime–square–cube scan',
      trick: 'For number classification, first check which items are prime, perfect squares or cubes. The odd one usually fails one of these.',
      whenToUse: 'Odd-one-out with numbers.',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-an-1',
      step: 'Step 1: Define the exact relation from the given pair',
      detail: 'Words: a sentence. Numbers: an operation. Letters: a shift pattern.',
      questionType: 'Analogy',
    },
    {
      id: 'h-lr-an-2',
      step: 'Step 2: Apply the rule to each option and eliminate',
      detail: 'Reject options that need a different or weaker rule. If none fits, revisit the rule.',
      questionType: 'Analogy',
    },
    {
      id: 'h-lr-an-3',
      step: 'Step 3: For classification, find the property three share and one lacks',
      detail: 'Test category → numeric property → structure. Confirm the remaining item breaks that specific property.',
      questionType: 'Odd one out',
    },
  ],
})

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 — CODING, RELATIONS & DIRECTIONS
// ─────────────────────────────────────────────────────────────────────────────

const M2 = 'Module 2: Coding, Relations & Directions'

const lrCoding = topic({
  id: 'lr-coding-decoding',
  subjectId: S,
  title: 'Coding-Decoding',
  moduleNumber: 2,
  moduleName: M2,
  order: 4,
  difficulty: 'basic',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-lr-cd-01', 'q-lr-cd-02'],
  subtopicDetails: subs('lr-coding-decoding', [
    [
      'Letter shifting',
      'Each letter moves a fixed number of places (+1, −2), or the shift grows (+1, +2, +3). Compare the position of each letter in the word and its code to find the shift, then apply it to the new word.',
    ],
    [
      'Reversal and mirror coding',
      'The word is reversed (CAT → TAC), the letters are replaced by their mirror (27 − position), or both. If the code has the same letters in a different order, suspect rearrangement.',
    ],
    [
      'Number and symbol coding',
      'Letters are mapped to numbers (position, reverse position, sum of positions) or symbols. Check whether the code is per letter, a total, or based on the word\'s length or vowel count.',
    ],
    [
      'Substitution and sentence coding',
      'In "\'pit na tom\' means \'apple is red\'" sets, find the common word between two sentences and the common code; the remaining word maps to the remaining code. Build a table and eliminate.',
    ],
    [
      'Conditional and matrix coding',
      'Letters coded from a grid (row-column pairs) or under rules ("if the first and last letters are vowels, both are coded as *"). Apply rules in the order given; only one rule usually triggers per word.',
    ],
    [
      'Operator and word-meaning coding',
      '"+ means ×, × means −" type substitutions: replace symbols and evaluate with BODMAS. "If white is called blue, blue is called red... what is the colour of milk?" → follow the chain, not intuition.',
    ],
  ]),
  explanationMd: `# Coding-Decoding

### Find the rule from the example, then apply it
Every coding question gives you at least one word and its code. Write the letter positions of both, look at the differences, and the rule almost always appears within ten seconds.

### The common rules
- **Fixed shift**: every letter +k or −k (DELHI → EFMIJ is +1).
- **Growing shift**: +1, +2, +3, ... or alternating +1, −1.
- **Reverse**: the word written backwards, sometimes then shifted.
- **Mirror**: each letter replaced by 27 − position (A↔Z).
- **Pairwise swap**: adjacent letters exchanged.
- **Number code**: sum of positions, product, or each letter as its position.

### Sentence (substitution) coding
Two or three coded sentences share words. Line them up:
- "sky is blue" → "ka pa lo"
- "sea is deep" → "ta pa mo"
The common word *is* and common code *pa* pair up. Continue until the asked word is isolated. Sometimes the answer is "cannot be determined" when a word appears only once.

### Conditional coding
A grid or a list of rules maps letters to symbols. Read the rules once, check each word for the triggering condition (vowel at both ends, consonant first, etc.), and apply only the matching rule. Otherwise use the default mapping.

### Operator coding
"If + means ÷, − means ×, × means +, ÷ means −, then 8 + 4 − 2 × 6 ÷ 3 = ?" Substitute: 8 ÷ 4 × 2 + 6 − 3 = 2 × 2 + 6 − 3 = 7. BODMAS still applies after substitution.

### Traps
- Shifts can cross Z → wrap to A.
- In sentence coding the order of code words is scrambled; never assume position matches.
- Check whether the rule is applied to the whole word or to each half separately.`,
  formulas: [
    {
      id: 'f-lr-cd-1',
      label: 'Shift detection',
      formula: 'Shift = position(code letter) − position(word letter), for each letter',
      exampleQ: 'If COMPUTER is coded as DPNQVUFS, how is SCIENCE coded?',
      exampleA: 'Each letter +1 → TDJFODF.',
    },
    {
      id: 'f-lr-cd-2',
      label: 'Sentence coding elimination',
      formula: 'Common word ↔ common code; isolate the unique word–code pair',
      exampleQ: '"go home now" = "ma ka ta" and "home is far" = "pa ka lo". What is the code for "home"?',
      exampleA: '"home" is the common word and "ka" the common code → ka.',
    },
  ],
  tricks: [
    {
      id: 't-lr-cd-1',
      title: 'Check the letter multiset',
      trick: 'If the code contains exactly the same letters as the word, the rule is reversal or rearrangement — do not look for shifts.',
      whenToUse: 'Any code that looks like an anagram of the word.',
    },
    {
      id: 't-lr-cd-2',
      title: 'Reverse then shift',
      trick: 'When a fixed shift does not fit, reverse the word and test the shift again. Many "hard" codes are reversal + constant shift.',
      whenToUse: 'Codes where the first letter\'s shift matches the last letter\'s shift.',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-cd-1',
      step: 'Step 1: Write positions of word and code letters side by side',
      detail: 'Compute the shift for each position; look for constant, growing or alternating values.',
      questionType: 'Letter coding',
    },
    {
      id: 'h-lr-cd-2',
      step: 'Step 2: If shifts fail, test reversal, mirror and swaps',
      detail: 'Reverse the word, or replace each letter with 27 − position, then re-check shifts.',
      questionType: 'Letter coding',
    },
    {
      id: 'h-lr-cd-3',
      step: 'Step 3: Apply the rule carefully to the new word, wrapping at Z',
      detail: 'Write each output letter; do not do it in your head. Double-check the first and last letters.',
      questionType: 'All coding',
    },
  ],
})

const lrBloodRelations = topic({
  id: 'lr-blood-relations',
  subjectId: S,
  title: 'Blood Relations',
  moduleNumber: 2,
  moduleName: M2,
  order: 5,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-lr-br-01', 'q-lr-br-02'],
  subtopicDetails: subs('lr-blood-relations', [
    [
      'Relationship vocabulary',
      'Paternal/maternal uncle = father\'s/mother\'s brother; niece/nephew = sibling\'s daughter/son; cousin = uncle\'s or aunt\'s child; in-laws through marriage; grandparents two generations up. "Only son" or "only daughter" pins down gender and uniqueness.',
    ],
    [
      'Family tree notation',
      'Draw generations on horizontal levels. Use a vertical line for parent–child, a double line (=) for marriage, a dash for siblings; mark gender with +/− or a square/circle. Never solve a chain of more than two relations in your head.',
    ],
    [
      'Pointing / statement puzzles',
      '"Pointing to a photo, Ravi said: her mother is the only daughter of my father." Decode from the inside out: "only daughter of my father" = Ravi\'s sister; "her mother" = Ravi\'s sister → the person is Ravi\'s niece. Work from the last phrase backwards.',
    ],
    [
      'Coded relations',
      '"A + B means A is the father of B; A − B means A is the sister of B..." Expand the expression left to right into a tree, then read the asked relationship. Watch gender: "sister of" fixes A female, but "child of" does not fix gender.',
    ],
    [
      'Puzzle-style families (6-8 members)',
      'Multi-statement sets: "There are 7 members in three generations, two married couples..." Build the tree with all fixed facts first, then place uncertain members with case-work. Count generations and couples as consistency checks.',
    ],
  ]),
  explanationMd: `# Blood Relations

### Draw, do not imagine
Beyond two links, mental tracking fails. Use a fixed notation:
- Horizontal levels = generations.
- Vertical line = parent to child.
- "=" between two people = married.
- "—" on the same level = siblings.
- Mark gender (+ for male, − for female) the moment it is known.

### Two habits that prevent errors
1. **Decode from the end of the sentence.** In "She is the daughter of the only son of my grandfather", start with "my grandfather" → "his only son" (my father or my uncle — but *only* son, so my father) → "his daughter" → my sister.
2. **Record gender only when stated.** "Child of", "parent of", "sibling of" and "spouse of" do not reveal gender. Questions built on this ambiguity have the answer "cannot be determined".

### Coded relationships
Symbols stand for relations (A × B = A is the mother of B). Expand one symbol at a time into the diagram. The final question ("how is P related to S?") is read off the drawing — usually two levels apart, so think grandparent, uncle/aunt, cousin.

### Generation counting
Counting generations quickly resolves vocabulary: same level → sibling, cousin, spouse; one up → parent, uncle/aunt; two up → grandparent; one down → child, niece/nephew; two down → grandchild.

### Puzzle sets
Six to eight family members with statements in random order. Place the definite facts (married couples, "only child", "grandfather") first, then use elimination for the rest. Check: number of males/females, number of couples, and number of generations against the statements.

### Traps
- "Only son" ≠ "only child": the son may have sisters.
- A father-in-law is the *spouse's* father, not a parent's.
- In "A is the brother of B", A is male but B's gender is unknown.`,
  formulas: [
    {
      id: 'f-lr-br-1',
      label: 'Reading a relation chain',
      formula: 'Start from the last phrase and move backwards, resolving one relation at a time',
      exampleQ: 'Pointing to a man, Meena said, "His mother is the only daughter of my mother." How is the man related to Meena?',
      exampleA: '"Only daughter of my mother" = Meena herself. So Meena is his mother → the man is her son.',
    },
    {
      id: 'f-lr-br-2',
      label: 'Coded relation expansion',
      formula: 'Expand symbols left to right into a tree; read the answer from generations and gender',
      exampleQ: 'If A + B means A is the father of B and A − B means A is the sister of B, what is P in P + Q − R?',
      exampleA: 'P is the father of Q; Q is the sister of R → P is the father of R (R\'s gender unknown).',
    },
  ],
  tricks: [
    {
      id: 't-lr-br-1',
      title: '"My father\'s only son" is me (if I am male)',
      trick: 'Phrases like "the only son of my father" or "the only daughter of my mother" usually refer to the speaker. Check the speaker\'s gender from the name or context.',
      whenToUse: 'Pointing / photograph statements.',
    },
    {
      id: 't-lr-br-2',
      title: 'Count generations first',
      trick: 'Before naming the relation, count how many levels apart the two people are. This eliminates half the options immediately (uncle vs cousin vs grandfather).',
      whenToUse: 'Any question asking "how is X related to Y".',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-br-1',
      step: 'Step 1: Draw the tree as you read',
      detail: 'One glyph per person, generations on levels, gender marked when known. Do not proceed to the next sentence until the current one is drawn.',
      questionType: 'All blood-relation questions',
    },
    {
      id: 'h-lr-br-2',
      step: 'Step 2: Resolve statements from the innermost phrase outward',
      detail: 'Work backwards from the last relation word. Replace each resolved phrase with the person it names.',
      questionType: 'Statement / pointing puzzles',
    },
    {
      id: 'h-lr-br-3',
      step: 'Step 3: Read the answer off the tree and check gender',
      detail: 'If the answer depends on an unstated gender, choose "cannot be determined" when offered.',
      questionType: 'All',
    },
  ],
})

const lrDirections = topic({
  id: 'lr-direction-sense',
  subjectId: S,
  title: 'Direction Sense & Distance',
  moduleNumber: 2,
  moduleName: M2,
  order: 6,
  difficulty: 'basic',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-lr-ds-01', 'q-lr-ds-02'],
  subtopicDetails: subs('lr-direction-sense', [
    [
      'The compass and turns',
      'North up, East right, South down, West left. Right turn = 90° clockwise; left turn = 90° anticlockwise. Facing North, right → East; facing West, right → North. Turning "about" or "around" = 180°.',
    ],
    [
      'Plotting a path on a grid',
      'Start at the origin, draw each segment to scale-ish, label the endpoints. Net east–west and north–south displacements are just sums with signs (East +, West −; North +, South −).',
    ],
    [
      'Shortest distance (Pythagoras)',
      'Straight-line distance from start = √(net EW² + net NS²). Look for 3-4-5, 5-12-13, 6-8-10, 8-15-17 triangles to avoid roots.',
    ],
    [
      'Final direction from start',
      'After the walk, ask "where is the end point relative to the start?" Use the net displacements: +EW and +NS → North-East; −EW and +NS → North-West, and so on. "In which direction is he facing?" is a different question — track turns, not position.',
    ],
    [
      'Shadows, sunrise and sunset',
      'At sunrise the sun is in the East and shadows fall West; at sunset shadows fall East. At noon shadows point North (in India). "Her shadow was to her right at sunrise" → she was facing South.',
    ],
    [
      'Clock-based directions',
      'Rotations by clock angles: if 12 points North and the hands are rotated so that 3 points North, then 6 points East, etc. Treat it as a rotation of the whole compass.',
    ],
  ]),
  explanationMd: `# Direction Sense & Distance

### Draw a compass, then trace
Put a small compass rose on rough paper (N up, E right). Trace the path with arrows and write the length beside each arrow. Two things are asked repeatedly: **how far** from the start and **in which direction** from the start. A drawing answers both in seconds.

### Turns
- Right = 90° clockwise, left = 90° anticlockwise.
- Facing N: right → E, left → W. Facing S: right → W, left → E. Facing E: right → S. Facing W: right → N.
- "Turns around / turns back" = 180°. "Turns 45° right from North" → North-East.

### Net displacement
Add movements along the two axes with signs. East 6, North 4, West 3, South 8 → net East 3, net South 4 → distance 5 (a 3-4-5 triangle), direction South-East.

### Two different questions
1. "How far and in which direction is he **from the starting point**?" → use net displacement.
2. "Which direction is he **facing** now?" → track turns only; distances are irrelevant.

### Shadows
Morning sun in the East, shadows to the West; evening sun in the West, shadows to the East. A person facing North in the morning has their shadow to the left; facing South, to the right. Noon shadows are very short and point North.

### Relative positions
"A is to the North of B, C is to the East of A" — plot on the grid. Then "in which direction is C from B?" → North-East. For angular answers use the eight compass points only unless the question says otherwise.

### Traps
- "Turned to his right" depends on the direction currently faced, not on the page.
- Distances given in different units (m, km) — convert.
- "Shortest distance" means the straight line, not the path walked.`,
  formulas: [
    {
      id: 'f-lr-ds-1',
      label: 'Straight-line distance',
      formula: 'd = √[(net East–West)² + (net North–South)²]',
      exampleQ: 'A man walks 5 km North, then 12 km East. How far is he from the start?',
      exampleA: '√(12² + 5²) = 13 km, to the North-East.',
    },
    {
      id: 'f-lr-ds-2',
      label: 'Turn table',
      formula: 'Right turn: N→E→S→W→N;   Left turn: N→W→S→E→N',
      exampleQ: 'Facing West, a person turns right, then right again, then left. Which direction is she facing?',
      exampleA: 'West → North → East → North.',
    },
  ],
  tricks: [
    {
      id: 't-lr-ds-1',
      title: 'Pythagorean triples',
      trick: 'Net displacements in placement questions are chosen to form 3-4-5, 6-8-10, 5-12-13 or 8-15-17 triangles. If you see two of these numbers, the answer is the third.',
      whenToUse: 'Shortest-distance questions.',
    },
    {
      id: 't-lr-ds-2',
      title: 'Cancel opposite moves first',
      trick: 'Before drawing, cancel North against South and East against West. A ten-step path often reduces to two net moves.',
      whenToUse: 'Long paths with many segments.',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-ds-1',
      step: 'Step 1: Fix the initial facing direction and draw a compass',
      detail: 'If the starting direction is not given and only turns matter, assume North and check whether the answer depends on it.',
      questionType: 'All direction questions',
    },
    {
      id: 'h-lr-ds-2',
      step: 'Step 2: Trace each move; update facing on each turn',
      detail: 'Write the length beside each arrow. Keep a separate note of the current facing direction.',
      questionType: 'Path tracing',
    },
    {
      id: 'h-lr-ds-3',
      step: 'Step 3: Compute net displacement, then distance and direction',
      detail: 'Sum East–West and North–South separately, apply Pythagoras, and read the compass direction from the signs.',
      questionType: 'Distance / direction from start',
    },
  ],
})

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 — ARRANGEMENTS & PUZZLES
// ─────────────────────────────────────────────────────────────────────────────

const M3 = 'Module 3: Arrangements & Puzzles'

const lrOrdering = topic({
  id: 'lr-order-ranking',
  subjectId: S,
  title: 'Order & Ranking',
  moduleNumber: 3,
  moduleName: M3,
  order: 7,
  difficulty: 'basic',
  examFrequency: 'high',
  featuredQuestionIds: ['q-lr-or-01', 'q-lr-or-02'],
  subtopicDetails: subs('lr-order-ranking', [
    [
      'Rank from both ends',
      'Total = (rank from left) + (rank from right) − 1. If Ravi is 12th from the top and 20th from the bottom, there are 31 students. Given the total and one rank, the other rank = total − rank + 1.',
    ],
    [
      'Overlapping and gap questions',
      'If the two ranks add to more than total + 1, the person is counted twice (overlap); if less, there are unknown people in between. Number of people between two positions = |difference of positions| − 1.',
    ],
    [
      'Interchange of positions',
      '"A is 10th from the left, B is 8th from the right; they interchange and now A is 15th from the left" → B was 15th from the left, so total = 15 + 8 − 1 = 22. Track the swapped person\'s new position, not the original.',
    ],
    [
      'Comparison-based ordering (taller, heavier, older)',
      'Write inequalities: "A is taller than B but shorter than C" → C > A > B. Merge chains; if one relation cannot be placed, the answer to "who is tallest" may be "cannot be determined".',
    ],
    [
      'Minimum and maximum totals',
      'When ranks may overlap, the minimum number in the row = larger rank; the maximum = sum of ranks − 1. Questions phrase this as "what is the least number of students in the class?"',
    ],
  ]),
  explanationMd: `# Order & Ranking

### One formula, many questions
**Total = left rank + right rank − 1.** Everything else in this topic is a rearrangement of it:
- Right rank = total − left rank + 1
- People between two positions = |position difference| − 1
- When two people swap, the new position of one tells you the old position of the other

### Interchange questions
"P is 8th from the left and Q is 12th from the right. After swapping, P is 20th from the left." P now occupies Q's old seat, so Q was 20th from the left. Total = 20 + 12 − 1 = 31. Q's new position = P's old = 8th from the left = 24th from the right.

### Overlap and unknowns
If left rank + right rank exceeds total + 1, the same people are counted twice from both ends — the difference is the overlap. If it is less, there are people between the two counts. Minimum possible total (with overlap allowed) is the larger of the two ranks; maximum (no overlap) is left + right − 1 plus anyone outside both counts.

### Comparison chains
Translate each statement into an inequality and merge them into one chain where possible:
- "A is heavier than B, C is lighter than B, D is heavier than A" → D > A > B > C.
If a person cannot be placed relative to the others, questions about them are "cannot be determined". Questions like "who is second lightest?" are read straight off the chain.

### Traps
- "Between A and B" excludes A and B themselves.
- After an interchange, ranks from the *other* end also change for both people.
- "From the top" and "from the bottom" are the two ends in exam-rank questions; "from the left/right" in row questions — same arithmetic.`,
  formulas: [
    {
      id: 'f-lr-or-1',
      label: 'Total from two ranks',
      formula: 'Total = Left + Right − 1;   People between = |L1 − L2| − 1',
      exampleQ: 'In a row, Asha is 14th from the left and 9th from the right. How many people are in the row?',
      exampleA: '14 + 9 − 1 = 22.',
    },
    {
      id: 'f-lr-or-2',
      label: 'Interchange',
      formula: 'If A and B swap, new position of A = old position of B (and vice versa)',
      exampleQ: 'A is 10th from the left, B is 8th from the right. After interchanging, A is 15th from the left. How many people are in the row?',
      exampleA: 'B was 15th from the left and 8th from the right → 15 + 8 − 1 = 22.',
    },
  ],
  tricks: [
    {
      id: 't-lr-or-1',
      title: 'Both ends, subtract one',
      trick: 'Whenever two ranks of the same person are given, add and subtract one — no diagram needed.',
      whenToUse: 'Single-person rank questions.',
    },
    {
      id: 't-lr-or-2',
      title: 'Write inequalities, not sentences',
      trick: 'Convert every comparison to > or < immediately and merge into one line. Reading the answer takes two seconds.',
      whenToUse: 'Taller/heavier/older comparisons.',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-or-1',
      step: 'Step 1: Identify what is known — total, ranks, or swaps',
      detail: 'Write L, R and T explicitly. If only comparisons are given, switch to the inequality-chain method.',
      questionType: 'All ranking questions',
    },
    {
      id: 'h-lr-or-2',
      step: 'Step 2: Apply Total = L + R − 1 (or its rearrangement)',
      detail: 'For interchange questions, first find the swapped person\'s old position, then compute the total.',
      questionType: 'Rank / interchange',
    },
    {
      id: 'h-lr-or-3',
      step: 'Step 3: Answer the exact question and check for overlap or indeterminacy',
      detail: 'If the question asks "minimum" or "maximum", consider overlap. If a comparison cannot be placed, choose "cannot be determined".',
      questionType: 'All',
    },
  ],
})

const lrSeating = topic({
  id: 'lr-seating-arrangement',
  subjectId: S,
  title: 'Seating Arrangement: Linear & Circular',
  moduleNumber: 3,
  moduleName: M3,
  order: 8,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-lr-sa-01', 'q-lr-sa-02'],
  subtopicDetails: subs('lr-seating-arrangement', [
    [
      'Linear arrangements (single row)',
      'Draw n boxes. Place definite facts first ("A is at the left end"), then relative facts ("B is second to the right of A"). When everyone faces North, right and left match the page; when facing South, they flip.',
    ],
    [
      'Two-row and facing arrangements',
      'Row 1 faces South, Row 2 faces North (or vice versa). Left and right are opposite in the two rows. "A faces B" means they are in the same column. Keep a legend beside the diagram for each row\'s left/right.',
    ],
    [
      'Circular arrangements: facing centre',
      'Facing the centre, a person\'s right is anticlockwise and left is clockwise. "Second to the right of A" = two positions anticlockwise. Fix one person at the top of the circle to anchor the drawing.',
    ],
    [
      'Circular: facing outside and mixed facing',
      'Facing outward flips left/right (right = clockwise). Mixed-facing puzzles give each person a direction; note it beside each seat and apply the right rule per person.',
    ],
    [
      'Square and rectangular tables',
      'People at corners vs at middles of sides; corner-sitters may face the centre while side-sitters face outside. Treat as a circle for adjacency, but track corner/side and facing separately.',
    ],
    [
      'Negative information and case splitting',
      '"C is not adjacent to D", "E is not at an end". Use these last, to eliminate cases. When a clue offers two placements, draw two diagrams and continue both until one contradicts.',
    ],
  ]),
  explanationMd: `# Seating Arrangement

### The method that never fails
1. Draw the shape (row of boxes, circle with n ticks, two rows).
2. Read all clues once; mark the **definite** ones (fixed positions, "sits at the end", "opposite to").
3. Place **relative** clues that connect to already placed people.
4. Use **negative** clues ("not adjacent", "not at an end") to eliminate.
5. Split into two diagrams when a clue has two possibilities; kill the one that contradicts.

### Left and right — the single most important rule
- In a row facing **North**: right and left are as on the page.
- Facing **South**: swapped.
- In a circle facing the **centre**: **right = anticlockwise**, left = clockwise.
- Facing **outward**: right = clockwise.

Write the rule at the top of the diagram before placing anyone. Most wrong answers in this topic are left/right flips.

### Counting positions
"Second to the right of A" means skip one seat. "Immediately right" means adjacent. "Between B and C" means exactly one person if it says "one person sits between".

### Two-row puzzles
Row 1 faces South and Row 2 faces North, so their left/right are opposite. "A faces B" places them in the same column. Solve each row partially, then use the facing clues to link them.

### Circular with n = 8
Anchor one person at the top, then place others by counting seats anticlockwise for "right of" (when facing the centre). For "opposite", count n/2 seats away.

### Efficiency
The clue that mentions two already-placed people is the next one to use. Clues about an unplaced person can wait. Re-reading a clue three times is faster than drawing a wrong arrangement.

### Traps
- "Right of" vs "immediate right of".
- In circles with mixed facing, apply the rule per person.
- A clue like "A sits third to the left of B" in a circle of 8 also means B sits fifth to the left of A — sometimes the easier direction.`,
  formulas: [
    {
      id: 'f-lr-sa-1',
      label: 'Left/right rule',
      formula: 'Facing centre: right = anticlockwise;   facing outward: right = clockwise;   facing South in a row: right = page-left',
      exampleQ: 'Eight friends sit around a circle facing the centre. If B is second to the right of A, where is B?',
      exampleA: 'Two seats anticlockwise from A.',
    },
    {
      id: 'f-lr-sa-2',
      label: 'Opposite seat in a circle',
      formula: 'Opposite = n/2 seats away (even n)',
      exampleQ: 'In a circle of 8, who sits opposite the person at seat 3?',
      exampleA: 'Seat 3 + 4 = seat 7.',
    },
  ],
  tricks: [
    {
      id: 't-lr-sa-1',
      title: 'Definite → relative → negative',
      trick: 'Sort clues by strength before drawing. Fixed positions first, then chains anchored to placed people, negatives last for elimination.',
      whenToUse: 'Every arrangement puzzle.',
    },
    {
      id: 't-lr-sa-2',
      title: 'Two diagrams, not one guess',
      trick: 'When a clue allows two placements, draw both immediately and continue in parallel. Guessing one and backtracking wastes more time.',
      whenToUse: 'Puzzles with "either/or" clues.',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-sa-1',
      step: 'Step 1: Draw the layout and write the left/right rule on it',
      detail: 'Boxes for rows, a circle with numbered seats, two rows with facing directions. Note "R = anticlockwise" or similar.',
      questionType: 'All seating puzzles',
    },
    {
      id: 'h-lr-sa-2',
      step: 'Step 2: Place definite clues, then chain relative clues',
      detail: 'Pick clues that connect to someone already placed. Mark clues used so you do not re-read them.',
      questionType: 'All',
    },
    {
      id: 'h-lr-sa-3',
      step: 'Step 3: Eliminate with negative clues and answer all sub-questions from the final diagram',
      detail: 'Check the diagram against every clue once before answering. Then answer the 3-5 questions quickly from the picture.',
      questionType: 'Puzzle sets',
    },
  ],
})

const lrPuzzles = topic({
  id: 'lr-puzzles',
  subjectId: S,
  title: 'Puzzles: Floors, Scheduling, Boxes & Tabular',
  moduleNumber: 3,
  moduleName: M3,
  order: 9,
  difficulty: 'advanced',
  examFrequency: 'high',
  featuredQuestionIds: ['q-lr-pz-01', 'q-lr-pz-02'],
  subtopicDetails: subs('lr-puzzles', [
    [
      'Floor puzzles',
      'Eight people on eight floors (ground = 1). Draw a vertical column; "lives above" means a higher number. "Two people live between A and B" fixes a gap of 3. Start from the top/bottom-most clue.',
    ],
    [
      'Scheduling puzzles (days, months)',
      'Events across Monday–Sunday or months with 30/31 days. Draw a horizontal timeline. Clues like "exactly three events between X and Y" and "Y is not on a weekend" are placed after fixed dates.',
    ],
    [
      'Box and stack puzzles',
      'Boxes stacked vertically or labelled with colours/weights. Same as floors, but often with a second attribute (colour). Use a two-column table: position | box | colour.',
    ],
    [
      'Tabular (grid) puzzles',
      'People × attributes (city, profession, colour). Build a grid, mark ✓ and ✗ from each clue, and use "each row/column has exactly one ✓" to force placements. Cross-clues ("the doctor is from Pune") link two attributes.',
    ],
    [
      'Case splitting and contradiction',
      'When a clue has two or three placements, list them as cases. Carry each forward until a contradiction kills it. Keep cases in separate columns so you can drop one cleanly.',
    ],
    [
      'Reading clues efficiently',
      'Underline numbers ("two people between"), negatives ("not", "neither"), and absolutes ("only", "exactly"). Use absolute clues first, then numeric gaps, then negatives.',
    ],
  ]),
  explanationMd: `# Puzzles

### Recognise the layout, then draw it
- **Floors / stacks** → a vertical list numbered from the bottom.
- **Days / months / years** → a horizontal timeline.
- **People × attributes** → a grid with ✓ / ✗.
- **Boxes with colours** → a vertical list plus one extra column.

Draw first, read second. A puzzle attempted without a diagram takes twice as long and is usually wrong.

### Clue priority
1. **Absolutes**: "A lives on the top floor", "the meeting is on Wednesday".
2. **Numeric gaps**: "three people live between B and C" → positions differ by 4.
3. **Relative**: "D lives immediately below E".
4. **Negatives**: "F does not live on an even floor" — use to eliminate cases.

### Case handling
A clue like "two people sit between P and Q" with P unplaced gives several positions. Do not pick one; write the possible pairs (1-4, 2-5, 3-6, 4-7, 5-8) and cross out those that violate other clues. Usually only one or two survive, and the next clue decides.

### Grid puzzles
For five people, five cities and five professions, draw a 5 × 5 grid for people vs cities and another for people vs professions (or one combined table). Each clue gives a ✓ or ✗. Whenever a row has four ✗, the fifth cell is ✓; whenever a ✓ is placed, ✗ everything else in its row and column.

### Questions after the puzzle
Most sets have 3-5 questions. A fully solved diagram answers them in seconds. If the puzzle has two valid final arrangements, questions will be phrased so the answer is the same in both (or the answer is "cannot be determined").

### Time discipline
Budget 6-8 minutes per puzzle set in a placement test. If after 3 minutes you have fewer than half the placements, mark the set for later and move to shorter questions.

### Traps
- "Above" on floors means higher number, but "before" on a timeline means smaller day.
- "Between" excludes the two endpoints.
- Even/odd floor clues: ground floor is 1 (odd) unless the puzzle says ground = 0.`,
  formulas: [
    {
      id: 'f-lr-pz-1',
      label: 'Gap clue',
      formula: '"k people between A and B" ⇒ |pos(A) − pos(B)| = k + 1',
      exampleQ: 'Eight floors; three people live between A and B, and A lives on floor 2. Where is B?',
      exampleA: 'Gap 4 → floor 6 (floor −2 is impossible).',
    },
    {
      id: 'f-lr-pz-2',
      label: 'Grid elimination',
      formula: 'One ✓ per row and per column; four ✗ in a row force the fifth cell',
      exampleQ: 'Five people, five cities. Four clues rule out Delhi for A, B, C, D. Who is from Delhi?',
      exampleA: 'E — the only unmarked cell in the Delhi column.',
    },
  ],
  tricks: [
    {
      id: 't-lr-pz-1',
      title: 'Read all clues before placing anyone',
      trick: 'The best starting clue is rarely the first one. Scan all clues, pick the absolute ones, and note which clues mention the same people.',
      whenToUse: 'Start of every puzzle.',
    },
    {
      id: 't-lr-pz-2',
      title: 'Parity elimination',
      trick: 'Clues like "lives on an even floor" or "not on a prime-numbered floor" halve the possibilities; apply them to case lists early.',
      whenToUse: 'Floor and box puzzles with numeric constraints.',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-pz-1',
      step: 'Step 1: Draw the structure and list the entities',
      detail: 'Floors, days or a grid. Write all names/attributes beside it so you can tick them off as they are placed.',
      questionType: 'All puzzles',
    },
    {
      id: 'h-lr-pz-2',
      step: 'Step 2: Place absolutes, then chain numeric and relative clues',
      detail: 'After each placement, re-scan the clues for any that now mention a placed entity.',
      questionType: 'All puzzles',
    },
    {
      id: 'h-lr-pz-3',
      step: 'Step 3: Resolve remaining cases with negatives and verify once',
      detail: 'Cross out cases that violate any clue. Check the final diagram against every clue, then answer the sub-questions.',
      questionType: 'Puzzle sets',
    },
  ],
})

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4 — DEDUCTIVE & CRITICAL REASONING
// ─────────────────────────────────────────────────────────────────────────────

const M4 = 'Module 4: Deductive & Critical Reasoning'

const lrSyllogism = topic({
  id: 'lr-syllogism',
  subjectId: S,
  title: 'Syllogisms',
  moduleNumber: 4,
  moduleName: M4,
  order: 10,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-lr-sy-01', 'q-lr-sy-02'],
  subtopicDetails: subs('lr-syllogism', [
    [
      'The four statement types',
      'All A are B (universal positive), No A is B (universal negative), Some A are B (particular positive), Some A are not B (particular negative). Conclusions must follow with certainty from the premises, not merely be possible.',
    ],
    [
      'Venn-diagram method',
      'Draw the minimal diagram that satisfies all statements; then draw the alternative diagrams that also satisfy them. A conclusion is valid only if it is true in every possible diagram.',
    ],
    [
      'Conversions that are always valid',
      '"All A are B" → "Some B are A". "No A is B" → "No B is A". "Some A are B" → "Some B are A". "Some A are not B" does not convert. "All A are B" does NOT give "All B are A".',
    ],
    [
      'Either–or (complementary) pairs',
      'When neither conclusion follows individually but they cover all possibilities — "Some A are B" with "No A is B", or "All A are B" with "Some A are not B" — the answer is "either I or II follows". They must have the same subject and predicate.',
    ],
    [
      'Possibility questions',
      '"Some A being C is a possibility" is true if at least one valid diagram allows it. Possibility conclusions fail only when the premises make the situation impossible (e.g. No A is C definitely).',
    ],
    [
      'Reversed and coded syllogisms',
      'Statements may be given with "only", "only a few" (= some but not all), or with symbols. "Only A are B" means "All B are A". "Only a few A are B" gives both "Some A are B" and "Some A are not B".',
    ],
  ]),
  explanationMd: `# Syllogisms

### What counts as a valid conclusion
A conclusion follows only if it is true in **every** arrangement consistent with the statements. "Possible" is not "follows". Draw the standard diagram, then ask "can I redraw this so the conclusion becomes false while the statements stay true?" If yes, it does not follow.

### The four statements in Venn form
- **All A are B**: circle A inside circle B (A may equal B).
- **No A is B**: two separate circles.
- **Some A are B**: overlapping circles (this includes the case where all A are B).
- **Some A are not B**: part of A outside B (says nothing about the rest).

### Safe conversions
- All A are B ⇒ Some B are A. ✓
- No A is B ⇒ No B is A. ✓
- Some A are B ⇒ Some B are A. ✓
- All A are B ⇒ All B are A. ✗ (classic trap)
- Some A are not B ⇒ Some B are not A. ✗

### Chaining
All A are B + All B are C ⇒ All A are C. All A are B + No B is C ⇒ No A is C. Some A are B + All B are C ⇒ Some A are C. But Some A are B + Some B are C ⇒ nothing about A and C.

### Either–or
When two conclusions are individually invalid but exhaust the possibilities and share subject and predicate, mark "either I or II follows". The standard pairs: (Some, No) and (All, Some-not).

### Possibility
"Some C being A is a possibility" is true unless the premises forbid it. If the statements give "No A is C" definitely, the possibility fails.

### "Only" and "only a few"
- "Only A are B" = "All B are A".
- "Only a few A are B" = "Some A are B" and "Some A are not B" both definitely true.

### Traps
- Reversing "All".
- Treating "some" as "some but not all" — in logic, "some" includes "all".
- Forgetting to test the alternative diagram.`,
  formulas: [
    {
      id: 'f-lr-sy-1',
      label: 'Valid chains',
      formula: 'All A→B, All B→C ⇒ All A→C;   All A→B, No B–C ⇒ No A–C;   Some A–B, All B→C ⇒ Some A–C',
      exampleQ: 'All pens are books. No book is a chair. Conclusions: I. No pen is a chair. II. Some books are pens.',
      exampleA: 'I follows (All + No ⇒ No). II follows (conversion of All pens are books). Both follow.',
    },
    {
      id: 'f-lr-sy-2',
      label: 'Complementary pairs',
      formula: '(Some A are B, No A is B) and (All A are B, Some A are not B) form either–or when neither follows alone',
      exampleQ: 'Some cups are plates. All plates are bowls. Conclusions: I. Some cups are not bowls. II. All cups are bowls.',
      exampleA: 'Neither follows individually; they are complementary (All / Some-not) → either I or II follows.',
    },
  ],
  tricks: [
    {
      id: 't-lr-sy-1',
      title: 'Draw the "worst case" second diagram',
      trick: 'After the obvious diagram, draw the one that minimises overlap (or maximises it) and re-test each conclusion. A conclusion that survives both is valid.',
      whenToUse: 'Every syllogism question.',
    },
    {
      id: 't-lr-sy-2',
      title: 'No definite link through two "some"s',
      trick: 'Two particular statements (Some–Some) or two negatives (No–No) never yield a definite conclusion between the outer terms.',
      whenToUse: 'Rejecting conclusions instantly.',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-sy-1',
      step: 'Step 1: Draw the minimal Venn diagram for all statements',
      detail: 'Use circles inside circles for "All", separate for "No", overlapping for "Some".',
      questionType: 'All syllogisms',
    },
    {
      id: 'h-lr-sy-2',
      step: 'Step 2: Test each conclusion against the diagram and its alternatives',
      detail: 'Mark a conclusion valid only if no alternative diagram makes it false. For possibility conclusions, one supporting diagram is enough.',
      questionType: 'Definite / possibility',
    },
    {
      id: 'h-lr-sy-3',
      step: 'Step 3: Check for either–or before choosing "neither follows"',
      detail: 'If both fail, see whether they are complementary with the same subject and predicate.',
      questionType: 'Two-conclusion sets',
    },
  ],
})

const lrStatements = topic({
  id: 'lr-statement-reasoning',
  subjectId: S,
  title: 'Statements: Assumptions, Conclusions, Arguments & Courses of Action',
  moduleNumber: 4,
  moduleName: M4,
  order: 11,
  difficulty: 'core',
  examFrequency: 'high',
  featuredQuestionIds: ['q-lr-st-01', 'q-lr-st-02'],
  subtopicDetails: subs('lr-statement-reasoning', [
    [
      'Statement and assumption',
      'An assumption is something the speaker takes for granted for the statement to make sense. Test with negation: if denying the assumption makes the statement pointless, it is implicit. Advertisements assume people care about the feature; instructions assume they can be followed.',
    ],
    [
      'Statement and conclusion',
      'A conclusion must follow directly from the statement alone — no outside knowledge. Reject conclusions that generalise beyond the data, add causes not mentioned, or use "only", "all", "always" when the statement does not.',
    ],
    [
      'Statement and argument (strong vs weak)',
      'A strong argument is relevant, realistic and addresses the issue with a substantial reason. Weak arguments are vague ("it is good for the nation"), based on assumption, irrelevant, or about a minor side effect. Judge strength, not agreement.',
    ],
    [
      'Course of action',
      'A valid course of action is practical, addresses the root problem, and follows logically. Punitive or extreme responses, or actions that are already routine, are rejected. Ask: does it solve the problem, and is it feasible?',
    ],
    [
      'Cause and effect',
      'Two statements: decide whether one caused the other, both are effects of a common cause, or they are independent. Timing and plausibility matter; a policy announced after an event cannot be its cause.',
    ],
    [
      'Inference and degree of truth',
      'Classify an inference as definitely true, probably true, data inadequate, probably false or definitely false based strictly on the passage. "Definitely" needs direct support; "probably" needs reasonable but not conclusive support.',
    ],
  ]),
  explanationMd: `# Statement-Based Reasoning

### The one rule for every sub-type
**Use only what the statement says.** Outside knowledge, personal opinion and "common sense" beyond the text are the distractors. Most wrong answers come from bringing in facts the passage never mentions.

### Assumptions
An assumption is the unstated belief that makes the statement meaningful. The **negation test** works: negate the candidate; if the statement collapses, the assumption is implicit.
- Statement: "Use brand X toothpaste for whiter teeth." Assumption: people want whiter teeth. Negate: people do not want whiter teeth → the advertisement is pointless → implicit.
- Assumptions with "only", "all", "must" are usually too strong.

### Conclusions
A conclusion is what can be inferred **with certainty**. Reject anything that goes beyond the scope, introduces a cause, or predicts the future without basis. "Some" and "may" conclusions are safer than "all" and "will".

### Arguments
Judge whether an argument is **strong** (relevant, realistic, substantial) or **weak** (vague, emotional, assumes facts, addresses a side issue). Both a "yes" and a "no" argument can be strong. A strong argument usually cites a concrete consequence.

### Courses of action
Accept an action if it is feasible and tackles the problem described. Reject if it is extreme, unrelated, punitive without basis, or already standard practice. Two actions can both be valid.

### Cause and effect
Check timing (cause precedes effect) and plausibility. If both statements are consequences of a bigger event (e.g. heavy rain → floods and → crop damage), the answer is "both are effects of a common cause".

### Inference grading
- Definitely true: explicitly stated or arithmetically certain.
- Probably true: supported by the trend but not stated.
- Data inadequate: the passage says nothing relevant.
- Probably / definitely false: contradicts the trend / the text.

### Traps
- Agreeing with an argument is not the same as it being strong.
- "Only" in an assumption is almost always a give-away for "not implicit".
- Courses of action must be realistic for the authority in the statement.`,
  formulas: [
    {
      id: 'f-lr-st-1',
      label: 'Negation test for assumptions',
      formula: 'Negate the assumption; if the statement no longer makes sense, the assumption is implicit',
      exampleQ: 'Statement: "Register by Friday to attend the workshop." Assumption: Registration is required to attend.',
      exampleA: 'Negate: registration is not required → the instruction is pointless → implicit.',
    },
    {
      id: 'f-lr-st-2',
      label: 'Strong-argument checklist',
      formula: 'Relevant + realistic + substantial consequence ⇒ strong;   vague / emotional / assumes facts ⇒ weak',
      exampleQ: '"Should the college ban mobile phones in class?" Argument: "Yes, students get distracted and their grades suffer."',
      exampleA: 'Relevant, realistic, cites a substantial consequence → strong.',
    },
  ],
  tricks: [
    {
      id: 't-lr-st-1',
      title: 'Scope check',
      trick: 'Underline the exact subject of the statement. Any option that talks about a broader or different group is out of scope and wrong.',
      whenToUse: 'Conclusions and inferences.',
    },
    {
      id: 't-lr-st-2',
      title: 'Extreme words flag',
      trick: 'Options with "only", "all", "never", "must", "completely" are usually not implicit / do not follow. Options with "some", "may", "likely" are more often correct.',
      whenToUse: 'Assumptions and conclusions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-st-1',
      step: 'Step 1: Identify the sub-type and its test',
      detail: 'Assumption → negation test. Conclusion → certainty. Argument → strength checklist. Course of action → feasibility + relevance.',
      questionType: 'All statement questions',
    },
    {
      id: 'h-lr-st-2',
      step: 'Step 2: Evaluate each option against the statement only',
      detail: 'Cover the other options; judge one at a time. Ask "does the statement itself support this?"',
      questionType: 'All',
    },
    {
      id: 'h-lr-st-3',
      step: 'Step 3: Combine verdicts into the answer format',
      detail: '"Only I", "only II", "both", "neither", "either". Re-read the option pattern before marking.',
      questionType: 'Multi-option formats',
    },
  ],
})

const lrDataSufficiency = topic({
  id: 'lr-data-sufficiency',
  subjectId: S,
  title: 'Data Sufficiency',
  moduleNumber: 4,
  moduleName: M4,
  order: 12,
  difficulty: 'core',
  examFrequency: 'high',
  featuredQuestionIds: ['q-lr-dsf-01', 'q-lr-dsf-02'],
  subtopicDetails: subs('lr-data-sufficiency', [
    [
      'The five standard options',
      '(A) Statement I alone is sufficient; (B) II alone; (C) both together but neither alone; (D) each alone; (E) even together not sufficient. Memorise the option layout of the test you are taking — some use a 4-option version.',
    ],
    [
      'Do not solve, decide',
      'The goal is to know whether a unique answer can be found, not what it is. Stop as soon as you can tell the answer is determined (or not). Yes/No questions are sufficient if the answer is definitely yes or definitely no.',
    ],
    [
      'The AD / BCE tree',
      'Test I alone. Sufficient → answer is A or D; then test II alone (D if yes, A if no). Not sufficient → answer is B, C or E; test II alone (B if yes), else test together (C if yes, else E).',
    ],
    [
      'Arithmetic and algebra DS',
      'Two unknowns generally need two independent equations. Watch for hidden constraints (integers, positive numbers) that can make one statement sufficient. A statement giving a ratio is not sufficient for absolute values.',
    ],
    [
      'Reasoning DS (blood relations, directions, ranking)',
      'The same logic applied to puzzles: does the information fix the relationship or position uniquely? "P is the brother of Q" alone does not fix Q\'s gender; a rank from one end alone does not fix the total.',
    ],
    [
      'Common traps',
      'Using information from statement I while testing statement II; assuming "some" means a number; accepting an answer that is "almost always" unique. Also, a statement that merely repeats the question adds nothing.',
    ],
  ]),
  explanationMd: `# Data Sufficiency

### A different kind of question
You are not asked for the answer — only whether the information is **enough** to find a unique answer. Candidates lose time by solving fully; you should stop the moment sufficiency is decided.

### The option set
A: I alone. B: II alone. C: both together, neither alone. D: either alone. E: not even together.
Read the exact wording once at the start of the section; the letters differ across tests.

### The decision tree
1. Test **I alone** (forget II exists).
   - Sufficient → the answer is **A or D**. Test II alone: sufficient → D; not → A.
   - Not sufficient → the answer is **B, C or E**. Test II alone: sufficient → B. Not → test **both together**: sufficient → C; not → E.

Never test II while still holding information from I in your head; that is the main source of error.

### What "sufficient" means
- For a value question: exactly one value results.
- For a yes/no question: the answer is definitely yes *or* definitely no. "Sometimes yes, sometimes no" is insufficient.

### Typical patterns
- Two unknowns → usually need two equations; but integer or positivity constraints can make one statement enough.
- Ratios alone give no absolute values.
- Averages: knowing the average and count gives the sum, not individual values.
- Blood relations: gender must be stated; direction problems need a fixed reference.

### Traps
- A statement that restates the question is useless.
- "Combined sufficient" is C only if neither alone works; if I alone works, the answer is A or D even though both together also work.
- Do not assume numbers are integers unless told.`,
  formulas: [
    {
      id: 'f-lr-dsf-1',
      label: 'Decision tree',
      formula: 'I alone? yes → (II alone? D : A);  no → (II alone? B : (both? C : E))',
      exampleQ: 'What is x? I. 2x + 3 = 11. II. x is a positive integer less than 5.',
      exampleA: 'I alone gives x = 4 → sufficient. II alone gives 1, 2, 3 or 4 → not sufficient. Answer: A.',
    },
    {
      id: 'f-lr-dsf-2',
      label: 'Yes/No sufficiency',
      formula: 'Sufficient ⇔ answer is definitely yes or definitely no',
      exampleQ: 'Is n even? I. n + 1 is odd. II. n is divisible by 3.',
      exampleA: 'I: n + 1 odd → n even → definitely yes → sufficient. II: 3, 6, 9 → sometimes → insufficient. Answer: A.',
    },
  ],
  tricks: [
    {
      id: 't-lr-dsf-1',
      title: 'Count unknowns vs equations',
      trick: 'For algebra DS, count independent equations. Fewer equations than unknowns is insufficient unless a hidden constraint (integer, positive, digit) narrows it.',
      whenToUse: 'Numeric DS.',
    },
    {
      id: 't-lr-dsf-2',
      title: 'Try to break it',
      trick: 'To prove insufficiency, find two different scenarios consistent with the statement that give different answers. One counter-example is enough.',
      whenToUse: 'Any statement that "feels" sufficient.',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-dsf-1',
      step: 'Step 1: Restate what the question needs',
      detail: 'A value? A yes/no? A relationship? Write the unknown explicitly.',
      questionType: 'All DS questions',
    },
    {
      id: 'h-lr-dsf-2',
      step: 'Step 2: Test I alone, then II alone, with a hard reset between them',
      detail: 'Cover one statement while testing the other. Decide sufficient / not for each.',
      questionType: 'All',
    },
    {
      id: 'h-lr-dsf-3',
      step: 'Step 3: Only if both fail, combine; then map to the option letter',
      detail: 'Use the tree to pick A/B/C/D/E. Double-check the option wording of the specific test.',
      questionType: 'All',
    },
  ],
})

const lrInequalities = topic({
  id: 'lr-coded-inequalities',
  subjectId: S,
  title: 'Coded Inequalities & Mathematical Operations',
  moduleNumber: 4,
  moduleName: M4,
  order: 13,
  difficulty: 'core',
  examFrequency: 'moderate',
  featuredQuestionIds: ['q-lr-ci-01', 'q-lr-ci-02'],
  subtopicDetails: subs('lr-coded-inequalities', [
    [
      'Decoding symbol definitions',
      '"A @ B means A is not smaller than B" → A ≥ B. "A # B means A is neither greater than nor equal to B" → A < B. Translate every symbol into >, <, ≥, ≤ or = before reading the statements.',
    ],
    [
      'Combining inequalities',
      'Chains combine only through a common term and in the same direction: A > B and B ≥ C give A > C. A > B and C > B give no relation between A and C. Mixed directions (A > B < C) give nothing.',
    ],
    [
      'Priority of signs',
      'In a chain, the weaker sign wins for the derived relation: > with ≥ gives >; ≥ with ≥ gives ≥; = with any sign gives that sign. A definite > cannot be concluded from ≥ links alone.',
    ],
    [
      'Either–or in inequalities',
      'If A ≥ B, conclusions "A > B" and "A = B" are individually not definite but together exhaust the possibilities → "either I or II follows". Requires the same two variables in both conclusions.',
    ],
    [
      'Mathematical operations substitution',
      '"If + means −, − means ×, × means ÷, ÷ means +" → rewrite the expression with true operators and apply BODMAS. Also: interchange questions ("which two signs should be swapped to make 8 + 4 × 2 − 6 = 10 true?") — test each option.',
    ],
  ]),
  explanationMd: `# Coded Inequalities & Mathematical Operations

### Step 1 is always translation
Write the symbol table as real signs: @ → ≥, # → <, and so on. Then rewrite every statement. Only after that look at conclusions. Trying to reason with the raw symbols is where errors come from.

### Combining chains
- Same direction through a common variable: A > B, B > C ⇒ A > C.
- Include ≥ carefully: A ≥ B, B > C ⇒ A > C (the strict sign survives if it appears at least once and there is no equality-only path); A ≥ B, B ≥ C ⇒ A ≥ C only.
- Opposite directions: A > B, C > B ⇒ **no relation** between A and C.
- Equality is transparent: A = B, B > C ⇒ A > C.

### Deciding conclusions
For each conclusion, find a path between its two variables through the chain. If the path has consistent direction, read off the derived sign. If any link points the other way, the conclusion does not follow.

### Either–or
When the chain gives A ≥ B and the conclusions are "A > B" and "A = B", neither is definite but they cover all cases → either–or. This also applies to "A ≤ B" with conclusions "A < B" and "A = B".

### Mathematical operations
Substitute the true operators, then evaluate strictly by BODMAS. For "interchange two signs" questions, test options by substituting; usually only one produces a true equation. For "interchange two numbers" questions, the same.

### Traps
- "Not greater than" = ≤ (includes equal). "Neither smaller nor equal" = >.
- Do not derive a relation across a direction change.
- After substituting operators, division is still done before addition.`,
  formulas: [
    {
      id: 'f-lr-ci-1',
      label: 'Chain rules',
      formula: 'A > B ≥ C ⇒ A > C;   A ≥ B ≥ C ⇒ A ≥ C;   A > B < C ⇒ no relation A–C',
      exampleQ: 'Given P > Q ≥ R = S, does P > S follow?',
      exampleA: 'Path P > Q ≥ R = S is one-directional with a strict > → P > S follows.',
    },
    {
      id: 'f-lr-ci-2',
      label: 'Operator substitution',
      formula: 'Replace each symbol with its true meaning, then apply BODMAS',
      exampleQ: 'If + means ×, × means −, − means ÷, ÷ means +, find 6 + 4 × 8 − 2 ÷ 5.',
      exampleA: '6 × 4 − 8 ÷ 2 + 5 = 24 − 4 + 5 = 25.',
    },
  ],
  tricks: [
    {
      id: 't-lr-ci-1',
      title: 'Negation shortcut',
      trick: '"Not smaller than" = ≥, "not greater than" = ≤, "neither greater nor smaller" = =, "neither smaller nor equal" = >, "neither greater nor equal" = <.',
      whenToUse: 'Decoding symbol definitions quickly.',
    },
    {
      id: 't-lr-ci-2',
      title: 'Merge into one line',
      trick: 'Rewrite all statements as a single chain wherever they share variables (P > Q ≥ R = S < T). Conclusions become a glance.',
      whenToUse: 'Multi-statement inequality sets.',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-ci-1',
      step: 'Step 1: Translate every symbol into a standard sign',
      detail: 'Write the mapping at the top of your rough work; rewrite the statements.',
      questionType: 'Coded inequalities',
    },
    {
      id: 'h-lr-ci-2',
      step: 'Step 2: Build the chain and trace a path for each conclusion',
      detail: 'Consistent direction → derive the sign (strict if any link is strict). Direction change → does not follow.',
      questionType: 'Coded inequalities',
    },
    {
      id: 'h-lr-ci-3',
      step: 'Step 3: Check for either–or; for operations, substitute and use BODMAS',
      detail: 'Complementary pairs on the same variables → either–or. For operator questions, evaluate step by step.',
      questionType: 'All',
    },
  ],
})

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5 — VISUAL & SPATIAL REASONING
// ─────────────────────────────────────────────────────────────────────────────

const M5 = 'Module 5: Visual & Spatial Reasoning'

const lrCubesDice = topic({
  id: 'lr-cubes-dice',
  subjectId: S,
  title: 'Cubes & Dice',
  moduleNumber: 5,
  moduleName: M5,
  order: 14,
  difficulty: 'core',
  examFrequency: 'high',
  featuredQuestionIds: ['q-lr-cb-01', 'q-lr-cb-02'],
  subtopicDetails: subs('lr-cubes-dice', [
    [
      'Painted cube cut into smaller cubes',
      'A cube of side n painted on all faces and cut into n³ unit cubes: 8 corner cubes have 3 painted faces, 12(n − 2) edge cubes have 2, 6(n − 2)² face cubes have 1, and (n − 2)³ inner cubes have 0. Check: they sum to n³.',
    ],
    [
      'Partial painting and different colours',
      'When only some faces are painted (or faces have different colours), count per face and subtract overlaps along shared edges and corners. Draw the cube and label each face\'s colour before counting.',
    ],
    [
      'Standard vs ordinary dice',
      'On a standard die opposite faces sum to 7 (1–6, 2–5, 3–4). An "ordinary" die in puzzles does not obey this; you must deduce opposites from the given views.',
    ],
    [
      'Finding the opposite face from two views',
      'If two views share a common face, the two faces that differ (excluding the common one and the shared position) are opposite each other. If a number appears with four different neighbours across views, the remaining number is opposite it.',
    ],
    [
      'Open dice (nets)',
      'In a net of six squares, squares separated by exactly one square in a straight line are opposite. The two end squares of a row of four are opposite. Faces adjacent in the net are adjacent on the cube.',
    ],
    [
      'Cube counting in stacks',
      'Count layer by layer from the top view or given diagram; visible cubes plus hidden supporting cubes. For "minimum cubes needed for this view" questions, each column needs at least the height shown.',
    ],
  ]),
  explanationMd: `# Cubes & Dice

### Painted cube — four formulas
A cube of side n (in unit cubes), painted on all six faces, then cut:
- **3 faces painted**: 8 (the corners, always)
- **2 faces**: 12(n − 2) (the edges, minus corners)
- **1 face**: 6(n − 2)² (the face interiors)
- **0 faces**: (n − 2)³ (the hidden core)

For n = 4: 8, 24, 24, 8 → total 64. The check "does it sum to n³?" catches arithmetic slips.

Variants: "at least two faces" = 8 + 12(n − 2); "at most one face" = 6(n − 2)² + (n − 2)³. If the cube is a cuboid a × b × c, use the same logic per edge length.

### Different colours on different faces
Draw the cube, label opposite pairs (top/bottom red, front/back blue, left/right green). Count cubes with, say, red and green: those along the 4 edges where a red face meets a green face, each with (n − 2) non-corner cubes.

### Dice — deducing opposites
Two views of the same die:
1. Find a number common to both views.
2. The other two numbers in view 1 and the other two in view 2 — the ones in the same relative position — are opposite. In practice: rotate about the common face; the faces that disappear and appear are opposite.

If a number is seen adjacent to four different numbers across views, it is opposite the remaining one.

Standard die: opposite faces sum to 7. Only use this if the question says "standard".

### Nets
In an open (unfolded) cube, two squares are opposite when they lie in the same row or column with exactly one square between them. Adjacent squares in the net are adjacent on the cube (across an edge).

### Traps
- Corners are 8 regardless of n (for n ≥ 2).
- "Painted on two opposite faces only" — then no cube has 3 painted faces, and 2-painted cubes are 0.
- Do not assume the standard 7-rule for puzzle dice.`,
  formulas: [
    {
      id: 'f-lr-cb-1',
      label: 'Painted cube counts',
      formula: '3 faces: 8;   2 faces: 12(n − 2);   1 face: 6(n − 2)²;   0 faces: (n − 2)³',
      exampleQ: 'A 5 cm cube painted on all faces is cut into 1 cm cubes. How many have exactly two painted faces?',
      exampleA: '12 × (5 − 2) = 36.',
    },
    {
      id: 'f-lr-cb-2',
      label: 'Net opposites',
      formula: 'Squares with exactly one square between them in a straight line are opposite faces',
      exampleQ: 'In a net arranged as a row of four squares (1, 2, 3, 4) with 5 above 2 and 6 below 2, which face is opposite 1?',
      exampleA: '3 (one square, 2, between them). Likewise 2 is opposite 4, and 5 is opposite 6.',
    },
  ],
  tricks: [
    {
      id: 't-lr-cb-1',
      title: 'Sum check',
      trick: 'After computing the four painted-face counts, add them. If the sum is not n³, redo the arithmetic before answering.',
      whenToUse: 'Painted-cube questions.',
    },
    {
      id: 't-lr-cb-2',
      title: 'Four-neighbour rule for dice',
      trick: 'List the numbers seen next to a face across all views. Once four distinct neighbours are found, the sixth number is opposite.',
      whenToUse: 'Dice with two or three views given.',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-cb-1',
      step: 'Step 1: Sketch the cube or die and label what is given',
      detail: 'For painted cubes mark which faces are painted and with what colour. For dice write each view as (top, front, right).',
      questionType: 'All cube/dice questions',

    },
    {
      id: 'h-lr-cb-2',
      step: 'Step 2: Apply the formula or the common-face rotation',
      detail: 'Painted counts by position; dice opposites by the common face between two views or the four-neighbour rule.',
      questionType: 'Painted cubes / dice',
    },
    {
      id: 'h-lr-cb-3',
      step: 'Step 3: Verify with the sum check or the 7-rule (standard die only)',
      detail: 'Totals must equal n³; opposite pairs must not repeat a number.',
      questionType: 'All',
    },
  ],
})

const lrNonVerbal = topic({
  id: 'lr-non-verbal-reasoning',
  subjectId: S,
  title: 'Non-Verbal Reasoning: Figure Series, Mirror & Water Images, Paper Folding',
  moduleNumber: 5,
  moduleName: M5,
  order: 15,
  difficulty: 'core',
  examFrequency: 'high',
  featuredQuestionIds: ['q-lr-nv-01', 'q-lr-nv-02'],
  subtopicDetails: subs('lr-non-verbal-reasoning', [
    [
      'Figure series and figure analogy',
      'Track one element at a time: rotation (45°, 90°), movement of a shape around the frame, count of lines/dots, shading toggles, addition/removal of elements. Write the rule per element and apply to the last figure.',
    ],
    [
      'Mirror images',
      'A mirror on the right/left flips left–right; top and bottom stay. Letters that look the same in a mirror: A, H, I, M, O, T, U, V, W, X, Y. Numbers: 0, 8 (and 1 approximately). For words, reverse the order and flip each letter.',
    ],
    [
      'Water images',
      'A water image (mirror below) flips top–bottom; left and right stay. Letters unchanged in water: B, C, D, E, H, I, K, O, X. Digits: 0, 3, 8. Apply per letter, keep the letter order.',
    ],
    [
      'Paper folding and cutting',
      'Fold the paper as shown, then a cut/punch is made. Unfold step by step in reverse; each unfolding mirrors the holes across the fold line. Count holes: each fold doubles them.',
    ],
    [
      'Embedded figures and figure counting',
      'Find the given figure hidden inside a complex one — look for its distinctive angles. For counting triangles/squares, count by size (smallest first) and by orientation, and use formulas for grids: squares in n × n = n(n + 1)(2n + 1)/6.',
    ],
    [
      'Classification and completion of patterns',
      'Odd figure out: check number of sides, symmetry, rotation direction, shading rule. Pattern completion: the missing quadrant follows the symmetry (rotational or reflective) of the rest of the grid.',
    ],
  ]),
  explanationMd: `# Non-Verbal Reasoning

### Series and analogy — one element at a time
Complex figures change in several ways at once. Pick the most obvious element (the arrow, the shaded part), track only it across the figures, write its rule (rotates 90° clockwise, moves one corner anticlockwise, toggles shading). Then the next element. Combine the rules to predict the next figure. Eliminate options as soon as one element mismatches.

Typical rules: rotation by a constant angle, alternation between two states, increasing line count, shapes moving around the frame, elements swapping positions.

### Mirror images
Mirror on the side → **left–right flip**. Vertical strokes stay vertical, but anything pointing left now points right. For words: reverse the letter order *and* flip each letter. Letters symmetric about a vertical axis are unchanged: **A H I M O T U V W X Y**.

### Water images
Mirror below → **top–bottom flip**. Letter order stays; each letter is flipped vertically. Unchanged letters: **B C D E H I K O X**; unchanged digits: 0, 3, 8.

Quick tell: in a mirror image the word reads backwards; in a water image it reads forwards but upside down.

### Paper folding
Work backwards. Take the final punched shape, unfold the last fold — holes reflect across that fold line — then the previous fold, and so on. Every fold doubles the number of holes. Options with the wrong hole count are eliminated first.

### Counting figures
- Triangles in a figure: count by size, then check each vertex for triangles using it.
- Squares in an n × n grid: 1² + 2² + ... + n².
- Rectangles in an m × n grid: (m + 1)C2 × (n + 1)C2.

### Embedded figures
Find the most distinctive feature of the target (an acute angle, a specific curve) and search for it in the complex figure; then verify the rest.

### Traps
- Mirror vs water confusion — decide which flip first.
- In paper folding, the fold direction (over vs under) does not change the hole pattern after unfolding.
- Rotation direction: clockwise on the page, regardless of the figure's "front".`,
  formulas: [
    {
      id: 'f-lr-nv-1',
      label: 'Symmetric letters',
      formula: 'Mirror-invariant: A H I M O T U V W X Y;   Water-invariant: B C D E H I K O X',
      exampleQ: 'Which letters of the word "MATH" look the same in a mirror?',
      exampleA: 'M, A, T, H — all four (the word itself is read reversed: HTAM).',
    },
    {
      id: 'f-lr-nv-2',
      label: 'Counting formulas',
      formula: 'Squares in n×n grid = n(n + 1)(2n + 1)/6;   Rectangles in m×n grid = C(m+1, 2) × C(n+1, 2)',
      exampleQ: 'How many squares are there in a 4 × 4 chessboard section?',
      exampleA: '16 + 9 + 4 + 1 = 30.',
    },
  ],
  tricks: [
    {
      id: 't-lr-nv-1',
      title: 'Hole count first',
      trick: 'In paper-folding questions count folds: 2 folds → 4 holes per punch, 3 folds → 8. Eliminate any option with the wrong number of holes before checking positions.',
      whenToUse: 'Paper folding and cutting.',
    },
    {
      id: 't-lr-nv-2',
      title: 'Check the option that breaks the rule',
      trick: 'In figure series, find one element whose rule is certain; scan options and discard every one that violates it. Usually one option remains.',
      whenToUse: 'Figure series / analogy.',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-nv-1',
      step: 'Step 1: Identify the transformation type',
      detail: 'Series (rule per element), mirror (LR flip), water (TB flip), folding (reverse unfold), counting (by size).',
      questionType: 'All non-verbal questions',
    },
    {
      id: 'h-lr-nv-2',
      step: 'Step 2: Apply the rule to one element and eliminate options',
      detail: 'Do not construct the full answer figure; instead reject options that fail the first certain rule, then the second.',
      questionType: 'Series / analogy / images',
    },
    {
      id: 'h-lr-nv-3',
      step: 'Step 3: Verify the surviving option on all elements',
      detail: 'Check rotation direction, shading and count once more. For folding, confirm hole positions relative to each fold line.',
      questionType: 'All',
    },
  ],
})

const lrVennLogical = topic({
  id: 'lr-logical-venn-diagrams',
  subjectId: S,
  title: 'Logical Venn Diagrams & Set-Based Reasoning',
  moduleNumber: 5,
  moduleName: M5,
  order: 16,
  difficulty: 'basic',
  examFrequency: 'high',
  featuredQuestionIds: ['q-lr-vn-01', 'q-lr-vn-02'],
  subtopicDetails: subs('lr-logical-venn-diagrams', [
    [
      'Representing relationships between three classes',
      'Subset (all doctors are humans): one circle inside another. Disjoint (cats, dogs): separate circles. Overlapping (teachers, women, Indians): intersecting circles. Choose the diagram that shows the correct relation among all three items.',
    ],
    [
      'Region reading in a three-circle diagram',
      'Three overlapping circles create 7 regions. "Only A" is the part of A outside B and C; "A and B but not C" is the lens outside C; the centre is all three. Label regions with the numbers given before answering.',
    ],
    [
      'Two-set counting (inclusion–exclusion)',
      'n(A ∪ B) = n(A) + n(B) − n(A ∩ B). "Only A" = n(A) − n(A ∩ B). "Neither" = total − n(A ∪ B). Fill the overlap first, then the "only" parts.',
    ],
    [
      'Three-set counting',
      'n(A ∪ B ∪ C) = n(A) + n(B) + n(C) − n(A∩B) − n(B∩C) − n(C∩A) + n(A∩B∩C). Fill the centre first, then the pairwise-only regions, then the only-A/B/C regions.',
    ],
    [
      'Maximum and minimum overlap',
      'For two sets within a total T: minimum overlap = max(0, n(A) + n(B) − T); maximum overlap = min(n(A), n(B)). Questions like "at least how many like both tea and coffee?" use the minimum.',
    ],
  ]),
  explanationMd: `# Logical Venn Diagrams

### Two kinds of question
1. **Which diagram represents the relation?** (doctors, humans, men) — a picture-choice question about categories.
2. **How many are in region X?** — a counting question with numbers in the regions or in the text.

### Choosing the diagram
Ask, for each pair of classes: is one entirely inside the other, are they completely separate, or do they partially overlap?
- Humans ⊃ Doctors; Doctors and Men overlap; Men ⊂ Humans → a big circle with two overlapping circles inside.
- Cats, Dogs, Animals → two separate circles inside one big circle.
- Teachers, Women, Indians → three mutually overlapping circles.

### Reading regions
With three circles you have seven regions. Label them: only A, only B, only C, A∩B only, B∩C only, C∩A only, all three. A question like "how many are teachers and women but not Indian?" points at exactly one region.

### Counting with inclusion–exclusion
Two sets: |A ∪ B| = |A| + |B| − |A ∩ B|. Three sets: add the three singles, subtract the three pairs, add back the triple. **Fill from the inside out**: centre first, then pairwise-only regions (pair minus centre), then only-regions (single minus its two pairs plus centre).

### Min–max overlaps
Within a total of T, the overlap of A and B is at least |A| + |B| − T (if positive) and at most the smaller of |A| and |B|. "In a class of 50, 35 play cricket and 30 play football; at least how many play both?" → 35 + 30 − 50 = 15.

### Traps
- "Only A" is not the same as "A".
- Numbers given for A ∩ B usually include those in all three; subtract the centre to get "A and B only".
- Total may include people in none of the sets — do not assume everyone is somewhere.`,
  formulas: [
    {
      id: 'f-lr-vn-1',
      label: 'Inclusion–exclusion',
      formula: '|A ∪ B| = |A| + |B| − |A ∩ B|;   |A ∪ B ∪ C| = Σ singles − Σ pairs + triple',
      exampleQ: 'In a group of 60, 30 like tea, 25 like coffee and 10 like both. How many like neither?',
      exampleA: 'Either = 30 + 25 − 10 = 45; neither = 60 − 45 = 15.',
    },
    {
      id: 'f-lr-vn-2',
      label: 'Minimum overlap',
      formula: 'min |A ∩ B| = max(0, |A| + |B| − T)',
      exampleQ: 'Of 50 students, 35 play cricket and 30 play football. At least how many play both?',
      exampleA: '35 + 30 − 50 = 15.',
    },
  ],
  tricks: [
    {
      id: 't-lr-vn-1',
      title: 'Inside-out filling',
      trick: 'Always write the triple-intersection number first, then subtract it from each pairwise number, then compute the only-regions. Never start from the outside.',
      whenToUse: 'Three-set counting.',
    },
    {
      id: 't-lr-vn-2',
      title: 'Pairwise relation test',
      trick: 'For diagram-choice questions test each of the three pairs separately (subset / disjoint / overlap). The option must match all three.',
      whenToUse: 'Which-diagram questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-vn-1',
      step: 'Step 1: Draw the circles and label the seven regions',
      detail: 'Even for two-set problems, draw the picture; write given numbers directly into regions when possible.',
      questionType: 'Counting questions',
    },
    {
      id: 'h-lr-vn-2',
      step: 'Step 2: Fill from the centre outward',
      detail: 'Triple → pairwise-only → only regions → none. Keep a running total against T.',
      questionType: 'Counting questions',
    },
    {
      id: 'h-lr-vn-3',
      step: 'Step 3: Read the asked region exactly',
      detail: '"Only", "at least two", "exactly one", "neither" — each maps to a specific set of regions. Sum only those.',
      questionType: 'All',
    },
  ],
})

const lrInputOutput = topic({
  id: 'lr-input-output',
  subjectId: S,
  title: 'Input-Output (Machine) Reasoning',
  moduleNumber: 5,
  moduleName: M5,
  order: 17,
  difficulty: 'advanced',
  examFrequency: 'moderate',
  audience: ['pg', 'tech'],
  featuredQuestionIds: ['q-lr-io-01', 'q-lr-io-02'],
  subtopicDetails: subs('lr-input-output', [
    [
      'Identifying the rearrangement rule',
      'Compare the input with step I, then step I with step II. Common rules: one word/number moves to the left end each step (alphabetical or ascending), or to the right end (descending), or words and numbers alternate steps.',
    ],
    [
      'Shifting patterns',
      'The moved element is usually the smallest/largest remaining, or the alphabetically first/last. Sometimes both a word and a number move in one step (word to the left, number to the right). Note whether moved elements stay fixed afterwards.',
    ],
    [
      'Counting steps to the final output',
      'Once the rule is known, simulate: mark elements already in place and count how many still need moving. The last step is when the sequence is fully sorted per the rule.',
    ],
    [
      'Questions about a specific step or position',
      '"Which element is third from the left in step IV?" — simulate to step IV only. "How many steps to complete?" — simulate to the end. Write each step on a new line.',
    ],
    [
      'Backward questions',
      '"If step III is given, what was the input?" is usually "cannot be determined" because previous positions of moved elements are unknown. State this only after checking the rule.',
    ],
  ]),
  explanationMd: `# Input-Output Reasoning

### What is happening
A "machine" takes a line of words and/or numbers and rearranges it step by step according to a hidden rule. You are shown an example (input plus several steps) and must apply the same rule to a new input.

### Find the rule from the example
Compare consecutive lines:
- **What moved?** One word, one number, or both?
- **Where did it go?** Left end, right end, or a specific position?
- **Why that element?** Smallest / largest number, alphabetically first / last word, longest word, odd numbers first...

Common patterns:
1. Words arranged alphabetically from the left, one per step.
2. Numbers arranged ascending from the right (or descending from the left), one per step.
3. Alternating: step I moves a word left, step II moves a number right, and so on.
4. Both at once: a word to the left and a number to the right in each step.

### Apply to the new input
Write the input, then each step on its own line, marking the elements that have been placed (they do not move again). Stop when the requested step is reached or the arrangement is complete.

### Typical questions
- Number of steps to reach the final output.
- Element at a given position in a given step.
- Which step is a given arrangement.
- The input from a given step → almost always "cannot be determined".

### Speed tips
- Circle the already-sorted prefix/suffix so you only look at the unsorted part.
- If words are sorted alphabetically, write their first letters as positions (A = 1) to compare faster.

### Traps
- Ties: two equal numbers — check the example for tie-breaking order.
- Alternating rules can start with a word or a number; confirm from step I.
- Do not assume elements already at the correct end are counted as "moved".`,
  formulas: [
    {
      id: 'f-lr-io-1',
      label: 'Rule discovery',
      formula: 'Diff(Input, Step I) and Diff(Step I, Step II) reveal which element moves and to which end',
      exampleQ: 'Input: 51 pen 23 book 78 cat. Step I: 78 51 pen 23 book cat. Step II: 78 51 book pen 23 cat. What is the rule?',
      exampleA: 'Alternate steps: largest number moves to the left end (78), then alphabetically first word moves to the position after placed numbers (book). Continue: Step III: 78 51 book pen 23 cat → number 51 already placed? Here 51 is next largest → stays; Step III would move 23 after 51... (simulate per example).',
    },
    {
      id: 'f-lr-io-2',
      label: 'Steps to completion',
      formula: 'Steps = number of elements that are not already in their final position, counted per the rule',
      exampleQ: 'If the rule places one word alphabetically to the left each step and the input has five words of which the first is already correct, how many steps are needed?',
      exampleA: 'At most four; fewer if later words are already in order after earlier moves.',
    },
  ],
  tricks: [
    {
      id: 't-lr-io-1',
      title: 'Track the sorted zone',
      trick: 'After each step, draw a bracket around the part of the line that is finalised. Only the rest needs scanning for the next mover.',
      whenToUse: 'Every input-output simulation.',
    },
    {
      id: 't-lr-io-2',
      title: '"Input from a step" is usually undeterminable',
      trick: 'Because moved elements could have come from any earlier position, the original input cannot be reconstructed. Choose "cannot be determined" unless the question provides extra constraints.',
      whenToUse: 'Backward questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-io-1',
      step: 'Step 1: Derive the rule from the sample input and steps',
      detail: 'Identify the moving element, its destination and the selection criterion. Confirm it on at least two consecutive steps.',
      questionType: 'All input-output questions',
    },
    {
      id: 'h-lr-io-2',
      step: 'Step 2: Simulate the new input line by line',
      detail: 'Write each step, bracket the finished zone, and stop at the requested step or when complete.',
      questionType: 'Forward questions',
    },
    {
      id: 'h-lr-io-3',
      step: 'Step 3: Answer the position or count asked',
      detail: 'Count positions from the specified end. For "how many steps", count only the steps that actually changed the arrangement.',
      questionType: 'All',
    },
  ],
})

const lrCryptarithmetic = topic({
  id: 'lr-cryptarithmetic-decision-tables',
  subjectId: S,
  title: 'Cryptarithmetic & Decision Tables',
  moduleNumber: 5,
  moduleName: M5,
  order: 18,
  difficulty: 'advanced',
  examFrequency: 'moderate',
  audience: ['tech', 'pg'],
  featuredQuestionIds: ['q-lr-cr-01', 'q-lr-cr-02'],
  subtopicDetails: subs('lr-cryptarithmetic-decision-tables', [
    [
      'Cryptarithmetic basics',
      'Each letter stands for a unique digit 0-9; leading letters are non-zero. In SEND + MORE = MONEY, M must be 1 (a carry from adding two 4-digit numbers). Start from the leftmost column for carries and from columns with repeated letters for constraints.',
    ],
    [
      'Carry analysis',
      'In addition, each column produces a carry of 0 or 1. If the result has one more digit than the addends, the leading digit is 1. A column A + A = A (mod 10) forces A = 0 (no carry in) or a carry pattern; use such columns first.',
    ],
    [
      'Trial with constraints',
      'Limit trials by parity and range: if A + B = C with no carry and C is even, A and B have the same parity. Keep a digit-used table and backtrack cleanly when a duplicate appears.',
    ],
    [
      'Multiplication cryptarithms',
      'Partial products expose more constraints: a partial product ending in the multiplicand\'s last digit means the multiplier digit is 1 or the last digit is 0/5/6-type. Work from the units digit of each partial product.',
    ],
    [
      'Decision tables (eligibility rules)',
      'A set of conditions (age, marks, experience) decides an outcome; exceptions ("if not (ii) but ...") redirect to another rule. Build a table of conditions vs candidate, evaluate each condition, then read the row that matches.',
    ],
  ]),
  explanationMd: `# Cryptarithmetic & Decision Tables

### Cryptarithmetic
A letter-arithmetic puzzle where each letter is a distinct digit. These appear in Infosys, eLitmus and Capgemini-style papers and reward a **systematic** approach rather than guessing.

**Where to start**
1. **Leading digits**: if the sum has more digits than the addends, its first letter is 1.
2. **Repeated-letter columns**: A + B = A tells you B = 0 (with no carry) or B = 9 with a carry in.
3. **Carry chain**: work right to left recording carries as 0/1; then left to right using the leading-digit facts. The two directions meet in the middle and pin down most letters.
4. **Parity and range**: the units column limits which pairs are possible; a column with a carry-out of 1 needs a sum ≥ 10.

Keep a strip of digits 0-9 and cross off each as it is assigned. When a contradiction appears, undo to the last choice point.

**Multiplication puzzles** give extra help: each partial product is a separate mini-equation, and the units digit of each is determined by the units digits multiplied.

### Decision tables
A candidate is evaluated against numbered conditions with "if X but not Y, refer to Z" exceptions. Method:
1. List the conditions as columns; mark ✓/✗ for the candidate.
2. Follow the rule text top to bottom; the first rule whose pattern matches gives the outcome.
3. Exceptions replace one condition with an alternative — check the alternative only when the primary fails.
4. If data for a condition is missing, the answer is "data inadequate".

### Traps
- Cryptarithms: two letters cannot share a digit; a leading letter cannot be 0.
- Decision tables: "and" versus "or" in conditions; the exception applies only to the condition named.
- Read the outcome list exactly — "selected", "referred to GM", "rejected", "data inadequate" are distinct answers.`,
  formulas: [
    {
      id: 'f-lr-cr-1',
      label: 'Leading-digit rule',
      formula: 'In X + Y = Z where Z has one more digit than X and Y, the leading digit of Z is 1',
      exampleQ: 'In SEND + MORE = MONEY, what is M?',
      exampleA: 'M = 1 (the carry from the thousands column is at most 1).',
    },
    {
      id: 'f-lr-cr-2',
      label: 'Repeated-letter column',
      formula: 'A + B = A (units column) ⇒ B = 0;   with a carry-in of 1 ⇒ B = 9',
      exampleQ: 'In a column where D + E = D with no carry in, what is E?',
      exampleA: 'E = 0.',
    },
  ],
  tricks: [
    {
      id: 't-lr-cr-1',
      title: 'Digit strip',
      trick: 'Write 0 1 2 3 4 5 6 7 8 9 on rough paper and strike out digits as you assign them. It prevents duplicates and speeds backtracking.',
      whenToUse: 'Every cryptarithm.',
    },
    {
      id: 't-lr-cr-2',
      title: 'Check conditions in the written order',
      trick: 'In decision tables, evaluate rules top-down and stop at the first full match. Skipping ahead to an exception before the primary rule fails is the usual error.',
      whenToUse: 'Eligibility / decision-table sets.',
    },
  ],
  howToSolve: [
    {
      id: 'h-lr-cr-1',
      step: 'Step 1: Write the puzzle in columns and mark carries',
      detail: 'Align units under units. Put a small c0/c1 above each column as you deduce carries.',
      questionType: 'Cryptarithmetic',
    },
    {
      id: 'h-lr-cr-2',
      step: 'Step 2: Fix forced digits (leading 1, zeros, nines) and propagate',
      detail: 'Each forced digit constrains adjacent columns. Only then try small trials on the remaining letters.',
      questionType: 'Cryptarithmetic',
    },
    {
      id: 'h-lr-cr-3',
      step: 'Step 3: For decision tables, tabulate ✓/✗ per condition and read the matching rule',
      detail: 'Handle "data inadequate" when a needed value is missing; apply exceptions only where the primary condition fails.',
      questionType: 'Decision tables',
    },
  ],
})

export const REASONING_TOPICS: PrepTopic[] = [
  lrNumberSeries,
  lrLetterSeries,
  lrAnalogy,
  lrCoding,
  lrBloodRelations,
  lrDirections,
  lrOrdering,
  lrSeating,
  lrPuzzles,
  lrSyllogism,
  lrStatements,
  lrDataSufficiency,
  lrInequalities,
  lrCubesDice,
  lrNonVerbal,
  lrVennLogical,
  lrInputOutput,
  lrCryptarithmetic,
]

export const REASONING_QUESTIONS: UniversalQuestion[] = [
  mcq({ id: 'q-lr-ns-01', subjectId: S, topicId: 'lr-number-series', difficulty: 'basic',
    q: 'Find the next term: 2, 5, 10, 17, 26, ?',
    options: ['35', '36', '37', '38'], answer: 2,
    why: 'Differences are 3, 5, 7, 9 → next difference 11 → 37. (Series is n² + 1.)' }),
  mcq({ id: 'q-lr-ns-02', subjectId: S, topicId: 'lr-number-series',
    q: 'Find the wrong term: 3, 7, 15, 31, 64, 127',
    options: ['7', '15', '64', '127'], answer: 2,
    why: 'Each term is ×2 + 1: 3, 7, 15, 31, 63, 127. The 64 should be 63.' }),
  mcq({ id: 'q-lr-ls-01', subjectId: S, topicId: 'lr-letter-alphanumeric-series', difficulty: 'basic',
    q: 'Complete the series: AZ, CX, EV, ?',
    options: ['GT', 'FU', 'GU', 'HT'], answer: 0,
    why: 'First letters +2 (A, C, E, G); second letters are mirrors (Z, X, V, T) → GT.' }),
  mcq({ id: 'q-lr-ls-02', subjectId: S, topicId: 'lr-letter-alphanumeric-series',
    q: 'Which letter is 5th to the left of the 8th letter from the right end of the English alphabet?',
    options: ['M', 'N', 'O', 'L'], answer: 1,
    why: '8th from the right is S (19th). Five to the left is the 14th letter, N.' }),
  mcq({ id: 'q-lr-an-01', subjectId: S, topicId: 'lr-analogy-classification', difficulty: 'basic',
    q: '7 : 50 :: 9 : ?',
    options: ['80', '81', '82', '90'], answer: 2,
    why: '7² + 1 = 50, so 9² + 1 = 82.' }),
  mcq({ id: 'q-lr-an-02', subjectId: S, topicId: 'lr-analogy-classification', difficulty: 'basic',
    q: 'Find the odd one out: 17, 23, 29, 33, 41',
    options: ['17', '23', '33', '41'], answer: 2,
    why: 'All are prime except 33 (= 3 × 11).' }),
  mcq({ id: 'q-lr-cd-01', subjectId: S, topicId: 'lr-coding-decoding', difficulty: 'basic',
    q: 'If COMPUTER is written as DPNQVUFS, how is SCIENCE written in that code?',
    options: ['TDJFODF', 'TDJFOEF', 'RBHDMBD', 'TDIFODF'], answer: 0,
    why: 'Each letter is shifted +1: S→T, C→D, I→J, E→F, N→O, C→D, E→F.' }),
  mcq({ id: 'q-lr-cd-02', subjectId: S, topicId: 'lr-coding-decoding',
    q: 'In a code, "go home now" is "ma ka ta" and "home is far" is "pa ka lo". What is the code for "home"?',
    options: ['ma', 'ka', 'ta', 'pa'], answer: 1,
    why: '"home" is the only common word and "ka" the only common code.' }),
  mcq({ id: 'q-lr-br-01', subjectId: S, topicId: 'lr-blood-relations',
    q: 'Pointing to a man, Meena said, "His mother is the only daughter of my mother." How is the man related to Meena?',
    options: ['Brother', 'Son', 'Nephew', 'Cousin'], answer: 1,
    why: 'The only daughter of Meena\'s mother is Meena herself, so Meena is the man\'s mother.' }),
  mcq({ id: 'q-lr-br-02', subjectId: S, topicId: 'lr-blood-relations',
    q: 'A + B means A is the father of B; A − B means A is the sister of B; A × B means A is the mother of B. In P + Q − R, how is P related to R?',
    options: ['Father', 'Uncle', 'Brother', 'Grandfather'], answer: 0,
    why: 'P is the father of Q, and Q is the sister of R, so P is also R\'s father.' }),
  mcq({ id: 'q-lr-ds-01', subjectId: S, topicId: 'lr-direction-sense', difficulty: 'basic',
    q: 'A man walks 5 km North, then turns right and walks 12 km. How far is he from his starting point?',
    options: ['7 km', '13 km', '17 km', '12 km'], answer: 1,
    why: '√(5² + 12²) = 13 km (a 5-12-13 triangle).' }),
  mcq({ id: 'q-lr-ds-02', subjectId: S, topicId: 'lr-direction-sense',
    q: 'Facing West, Priya turns right, then right again, then left. Which direction is she facing now?',
    options: ['East', 'North', 'South', 'West'], answer: 1,
    why: 'West → (right) North → (right) East → (left) North.' }),
  mcq({ id: 'q-lr-or-01', subjectId: S, topicId: 'lr-order-ranking', difficulty: 'basic',
    q: 'In a row, Asha is 14th from the left and 9th from the right. How many people are in the row?',
    options: ['21', '22', '23', '24'], answer: 1,
    why: 'Total = left position + right position − 1 (Asha is counted twice) = 14 + 9 − 1 = 22.' }),
  mcq({ id: 'q-lr-or-02', subjectId: S, topicId: 'lr-order-ranking',
    q: 'A is 10th from the left and B is 8th from the right in a row. After they interchange, A becomes 15th from the left. How many people are in the row?',
    options: ['20', '22', '23', '25'], answer: 1,
    why: 'A now occupies B\'s old seat, so B was 15th from the left and 8th from the right: 15 + 8 − 1 = 22.' }),
  mcq({ id: 'q-lr-sa-01', subjectId: S, topicId: 'lr-seating-arrangement',
    q: 'Eight friends sit around a circular table facing the centre. B is second to the right of A. In which direction from A is B, going around the table?',
    options: ['Two seats clockwise', 'Two seats anticlockwise', 'Directly opposite', 'Adjacent'], answer: 1,
    why: 'Facing the centre, a person\'s right is anticlockwise, so "second to the right" is two seats anticlockwise.' }),
  mcq({ id: 'q-lr-sa-02', subjectId: S, topicId: 'lr-seating-arrangement',
    q: 'Five people P, Q, R, S, T sit in a row facing North. R is at the centre, Q is immediately to the right of R, P is at the left end, and T is not adjacent to P. Who sits at the right end?',
    options: ['Q', 'S', 'T', 'Cannot be determined'], answer: 2,
    why: 'Seats 1-5 left to right. R = 3, Q = 4 (facing North, right is page-right), P = 1. Seats 2 and 5 remain for S and T; T cannot be adjacent to P (seat 2), so T = 5 and S = 2.' }),
  mcq({ id: 'q-lr-pz-01', subjectId: S, topicId: 'lr-puzzles',
    q: 'In an 8-floor building (ground floor = 1), three people live between A and B. If A lives on floor 2, on which floor does B live?',
    options: ['5', '6', '7', '8'], answer: 1,
    why: 'Three people between means a gap of 4 floors: 2 + 4 = 6 (2 − 4 is impossible).' }),
  mcq({ id: 'q-lr-pz-02', subjectId: S, topicId: 'lr-puzzles',
    q: 'Five people A-E are from five different cities. Clues rule out Delhi for A, B, C and D. Who is from Delhi?',
    options: ['A', 'C', 'E', 'Cannot be determined'], answer: 2,
    why: 'Each city belongs to exactly one person; Delhi\'s only remaining candidate is E.' }),
  mcq({ id: 'q-lr-sy-01', subjectId: S, topicId: 'lr-syllogism',
    q: 'Statements: All pens are books. No book is a chair. Conclusions: I. No pen is a chair. II. Some books are pens.',
    options: ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'], answer: 2,
    why: 'All + No gives No pen is a chair (I). "All pens are books" converts to "Some books are pens" (II).' }),
  mcq({ id: 'q-lr-sy-02', subjectId: S, topicId: 'lr-syllogism',
    q: 'Statements: Some cups are plates. All plates are bowls. Conclusions: I. Some cups are not bowls. II. All cups are bowls.',
    options: ['Only I follows', 'Only II follows', 'Either I or II follows', 'Neither follows'], answer: 2,
    why: 'Neither is definite, but "All" and "Some not" on the same terms are complementary → either I or II.' }),
  mcq({ id: 'q-lr-st-01', subjectId: S, topicId: 'lr-statement-reasoning',
    q: 'Statement: "Register by Friday to attend the workshop." Which assumption is implicit? I. Registration is required to attend. II. Everyone wants to attend the workshop.',
    options: ['Only I', 'Only II', 'Both', 'Neither'], answer: 0,
    why: 'Negating I makes the instruction pointless, so I is implicit. II is too strong ("everyone").' }),
  mcq({ id: 'q-lr-st-02', subjectId: S, topicId: 'lr-statement-reasoning',
    q: 'Should the college ban mobile phones in classrooms? Argument I: Yes, students get distracted and their grades suffer. Argument II: No, phones are expensive.',
    options: ['Only I is strong', 'Only II is strong', 'Both are strong', 'Neither is strong'], answer: 0,
    why: 'I is relevant and cites a substantial consequence. II is irrelevant to the classroom issue.' }),
  mcq({ id: 'q-lr-dsf-01', subjectId: S, topicId: 'lr-data-sufficiency',
    q: 'What is the value of x? I. 2x + 3 = 11. II. x is a positive integer less than 5.',
    options: ['I alone is sufficient', 'II alone is sufficient', 'Both together are needed', 'Either alone is sufficient'], answer: 0,
    why: 'I gives x = 4 uniquely. II allows 1, 2, 3, 4.' }),
  mcq({ id: 'q-lr-dsf-02', subjectId: S, topicId: 'lr-data-sufficiency',
    q: 'Is n even? I. n + 1 is odd. II. n is divisible by 3.',
    options: ['I alone is sufficient', 'II alone is sufficient', 'Both together are needed', 'Neither is sufficient'], answer: 0,
    why: 'n + 1 odd means n is even — definite yes. II allows 3 (odd) or 6 (even).' }),
  mcq({ id: 'q-lr-ci-01', subjectId: S, topicId: 'lr-coded-inequalities',
    q: 'Given P > Q ≥ R = S, which conclusion definitely follows? I. P > S. II. Q > S.',
    options: ['Only I', 'Only II', 'Both', 'Neither'], answer: 0,
    why: 'P > Q ≥ R = S gives P > S. Q ≥ S only, so Q > S is not definite.' }),
  mcq({ id: 'q-lr-ci-02', subjectId: S, topicId: 'lr-coded-inequalities',
    q: 'If + means ×, × means −, − means ÷ and ÷ means +, the value of 6 + 4 × 8 − 2 ÷ 5 is:',
    options: ['15', '25', '27', '30'], answer: 1,
    why: '6 × 4 − 8 ÷ 2 + 5 = 24 − 4 + 5 = 25.' }),
  mcq({ id: 'q-lr-cb-01', subjectId: S, topicId: 'lr-cubes-dice',
    q: 'A 5 cm cube painted on all faces is cut into 1 cm cubes. How many small cubes have exactly two painted faces?',
    options: ['24', '36', '54', '27'], answer: 1,
    why: 'Two-face cubes lie along the 12 edges, excluding the corner cubes: 12 × (n − 2) = 12 × 3 = 36.' }),
  mcq({ id: 'q-lr-cb-02', subjectId: S, topicId: 'lr-cubes-dice',
    q: 'Two views of a die show: (top 1, front 2, right 3) and (top 1, front 3, right 5). Which number is opposite 2?',
    options: ['3', '4', '5', '6'], answer: 2,
    why: 'Rotating about the common top face 1, front goes 2 → 3 and right goes 3 → 5, so 2 and 5 are opposite.' }),
  mcq({ id: 'q-lr-nv-01', subjectId: S, topicId: 'lr-non-verbal-reasoning', difficulty: 'basic',
    q: 'A square sheet is folded in half twice and a single hole is punched. How many holes appear when it is unfolded?',
    options: ['2', '3', '4', '8'], answer: 2,
    why: 'Each fold doubles the holes: 1 → 2 → 4.' }),
  mcq({ id: 'q-lr-nv-02', subjectId: S, topicId: 'lr-non-verbal-reasoning',
    q: 'How many squares are there in a 4 × 4 grid of unit squares?',
    options: ['16', '25', '30', '36'], answer: 2,
    why: '4² + 3² + 2² + 1² = 16 + 9 + 4 + 1 = 30.' }),
  mcq({ id: 'q-lr-vn-01', subjectId: S, topicId: 'lr-logical-venn-diagrams', difficulty: 'basic',
    q: 'In a group of 60 people, 30 like tea, 25 like coffee and 10 like both. How many like neither?',
    options: ['5', '10', '15', '20'], answer: 2,
    why: 'Either = 30 + 25 − 10 = 45; neither = 60 − 45 = 15.' }),
  mcq({ id: 'q-lr-vn-02', subjectId: S, topicId: 'lr-logical-venn-diagrams',
    q: 'Which diagram best represents Doctors, Humans and Men?',
    options: ['Three separate circles', 'Two overlapping circles inside a larger circle', 'Three concentric circles', 'Three mutually overlapping circles'], answer: 1,
    why: 'Doctors and Men are both subsets of Humans and overlap with each other.' }),
  mcq({ id: 'q-lr-io-01', subjectId: S, topicId: 'lr-input-output', difficulty: 'advanced',
    q: 'A machine moves the alphabetically first remaining word to the left end in each step. Input: rose mango apple kite. In which step does "kite" reach its final position?',
    options: ['Step I', 'Step II', 'Step III', 'Step IV'], answer: 1,
    why: 'Step I: apple rose mango kite. Step II: apple kite rose mango — kite is now in position 2, its final place.' }),
  mcq({ id: 'q-lr-io-02', subjectId: S, topicId: 'lr-input-output', difficulty: 'advanced',
    q: 'If step III of an input-output machine is given, the original input can be:',
    options: ['Always determined', 'Determined only for numbers', 'Usually not determined', 'Determined by reversing the steps'], answer: 2,
    why: 'Moved elements could have come from any earlier position, so the input is generally not recoverable.' }),
  mcq({ id: 'q-lr-cr-01', subjectId: S, topicId: 'lr-cryptarithmetic-decision-tables', difficulty: 'advanced',
    q: 'In the cryptarithm SEND + MORE = MONEY, the value of M is:',
    options: ['0', '1', '2', '9'], answer: 1,
    why: 'The sum has one more digit than the addends, so its leading digit is the carry 1.' }),
  mcq({ id: 'q-lr-cr-02', subjectId: S, topicId: 'lr-cryptarithmetic-decision-tables', difficulty: 'advanced',
    q: 'In an addition cryptarithm, the units column reads D + E = D with no carry in. What is E?',
    options: ['0', '1', '5', '9'], answer: 0,
    why: 'Adding E leaves D unchanged only if E = 0 (9 would require a carry in).' }),
]
