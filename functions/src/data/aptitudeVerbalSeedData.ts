// functions/src/data/aptitudeVerbalSeedData.ts
//
// Placement Aptitude — Verbal Ability & Reading Skills (shared by every UG &
// PG program). Covers the English / verbal section of TCS NQT, Infosys,
// Wipro, Accenture, Capgemini and similar papers, plus the written-
// communication items (email writing, essay) used by TCS and Infosys.
// All explanations, briefs, tricks and questions are original Vriddhi content.
//
// Structure: 1 subject > 4 modules > 14 topics > 4-6 sub-topics each (with
// briefs) + 2 MCQs per topic.

import type { PrepSubject, PrepTopic, UniversalQuestion } from '../prepShared'
import { ALL_PROGRAMS, VA_SUBJECT_ID, mcq, subs, topic } from './aptitudeShared'

const S = VA_SUBJECT_ID

export const VERBAL_SUBJECT: PrepSubject = {
  id: S,
  name: 'Verbal Ability & Reading Skills',
  stream: 'communication',
  track: 'aptitude',
  programs: ALL_PROGRAMS,
  universityRegion: 'national',
  syllabusRef: 'Placement English — TCS NQT Verbal / Infosys / Wipro / Accenture / Capgemini pattern',
  icon: 'BookOpen',
  order: 103,
  topicCount: 14,
  status: 'published',
  description:
    'Grammar essentials, error spotting, sentence correction and improvement, fill in the blanks, vocabulary (synonyms, antonyms, idioms, one-word substitutes), para-jumbles, sentence completion, reading comprehension, cloze tests and written communication — the full verbal section of campus placement tests.',
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 — GRAMMAR FOUNDATIONS
// ─────────────────────────────────────────────────────────────────────────────

const M1 = 'Module 1: Grammar Foundations'

const vaPartsOfSpeech = topic({
  id: 'va-parts-of-speech-articles-prepositions',
  subjectId: S,
  title: 'Parts of Speech, Articles & Prepositions',
  moduleNumber: 1,
  moduleName: M1,
  order: 1,
  difficulty: 'basic',
  examFrequency: 'high',
  featuredQuestionIds: ['q-va-pos-01', 'q-va-pos-02'],
  subtopicDetails: subs('va-parts-of-speech-articles-prepositions', [
    [
      'The eight parts of speech',
      'Noun (names), pronoun (replaces a noun), verb (action/state), adjective (describes a noun), adverb (modifies a verb/adjective/adverb), preposition (relation in space/time), conjunction (joins), interjection (exclamation). Identifying a word\'s role decides which grammar rule applies.',
    ],
    [
      'Articles: a, an, the',
      '"A/an" for singular countable nouns mentioned for the first time; "an" before a vowel sound (an hour, an MBA) not just a vowel letter (a university, a one-rupee coin). "The" for specific or previously mentioned nouns, superlatives, unique things (the sun), and rivers/oceans/mountain ranges. No article with most proper nouns, abstract nouns used generally, and meals.',
    ],
    [
      'Prepositions of time and place',
      'At (points: at 5 pm, at the door), on (surfaces and days: on Monday, on the table), in (enclosed spaces and periods: in March, in the room). Since (a point in time) vs for (a duration). Between (two) vs among (more than two). By (deadline) vs until (continuing up to).',
    ],
    [
      'Prepositions with verbs, adjectives and nouns',
      'Fixed collocations: agree with a person / to a proposal; angry with a person / at a thing; good at; capable of; consist of; depend on; interested in; married to; prefer X to Y; superior to; different from. Placement error-spotting questions rely on these pairs.',
    ],
    [
      'Common confusions',
      'Beside (next to) vs besides (in addition to); in (static) vs into (movement); comprise (no "of"); discuss (no "about"); enter (no "into" for a room); reach (no "to"). Memorise the verbs that take no preposition.',
    ],
  ]),
  explanationMd: `# Parts of Speech, Articles & Prepositions

### Why start here
Error-spotting and sentence-correction questions are mostly about articles, prepositions and agreement. Knowing what role each word plays tells you which rule to check.

### Articles
- **A / an**: a non-specific singular countable noun. Choose by **sound**: *an hour*, *an MBA*, *a European*, *a one-time offer*.
- **The**: something specific or already mentioned; superlatives (*the best*); ordinals (*the first*); unique objects (*the moon*); rivers, seas, mountain ranges, deserts, newspapers (*the Ganga*, *the Himalayas*, *the Hindu*).
- **No article**: languages, most countries, meals, abstract nouns in general (*Honesty is the best policy*), and plural nouns used generally (*Dogs are loyal*).

### Prepositions of time and place
| Word | Time | Place |
|---|---|---|
| at | at 6 o'clock, at noon | at the station, at home |
| on | on Monday, on 15 August | on the wall, on the table |
| in | in 2024, in the morning | in Bengaluru, in the box |

- **Since** + point (since 2019); **for** + duration (for five years).
- **Between** two; **among** three or more.
- **By** = not later than; **until** = up to that time, continuing.

### Verb + preposition pairs to memorise
agree **with** (person) / **to** (plan); angry **with** (person) / **at** (thing); good **at**; consist **of**; depend **on**; interested **in**; married **to**; prefer **X to Y**; senior/junior/superior/inferior **to**; different **from**; congratulate **on**; accused **of**; charged **with**.

### Verbs that take no preposition
*discuss* (not discuss about), *comprise* (not comprise of), *enter* a room (not enter into), *reach* a place (not reach to), *order* food (not order for), *attack*, *resemble*, *emphasise*.

### Traps
- "An university" ✗ (u sounds like "yu"). "A hour" ✗ (silent h).
- "Between you and I" ✗ — prepositions take the object form: *between you and me*.
- "Prefer X than Y" ✗ → *prefer X to Y*.`,
  formulas: [
    {
      id: 'f-va-pos-1',
      label: 'Article by sound',
      formula: 'Use "an" before a vowel SOUND, "a" before a consonant SOUND',
      exampleQ: 'Fill in: ___ honest man; ___ university; ___ MBA graduate.',
      exampleA: 'an honest man; a university; an MBA graduate.',
    },
    {
      id: 'f-va-pos-2',
      label: 'Since vs for',
      formula: 'since + point in time;   for + length of time',
      exampleQ: 'She has worked here ___ 2018 and ___ six years.',
      exampleA: 'since 2018; for six years.',
    },
  ],
  tricks: [
    {
      id: 't-va-pos-1',
      title: 'Drop-the-preposition list',
      trick: 'Discuss, comprise, enter, reach, order, resemble, attack, emphasise — if an option adds "about/of/into/to/for" after these, it is the error.',
      whenToUse: 'Error spotting.',
    },
    {
      id: 't-va-pos-2',
      title: 'Person vs thing',
      trick: 'Angry/annoyed/pleased WITH a person, AT a thing. Agree WITH a person, TO a proposal.',
      whenToUse: 'Preposition fill-in-the-blank.',
    },
  ],
  howToSolve: [
    {
      id: 'h-va-pos-1',
      step: 'Step 1: Identify the word class of the blank or underlined word',
      detail: 'Noun → check article; relation word → check preposition; describing word → adjective vs adverb.',
      questionType: 'Fill in the blank / error spotting',
    },
    {
      id: 'h-va-pos-2',
      step: 'Step 2: Apply the specific rule (sound, specificity, collocation)',
      detail: 'For articles ask "specific or general? vowel sound?". For prepositions recall the fixed pair with the verb/adjective.',
      questionType: 'All',
    },
    {
      id: 'h-va-pos-3',
      step: 'Step 3: Read the full sentence aloud in your head',
      detail: 'Most native-like collocations sound right; if two options sound plausible, fall back on the rule, not the feel.',
      questionType: 'All',
    },
  ],
})

const vaTenses = topic({
  id: 'va-tenses-verbs',
  subjectId: S,
  title: 'Tenses, Verb Forms & Modals',
  moduleNumber: 1,
  moduleName: M1,
  order: 2,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-va-tn-01', 'q-va-tn-02'],
  subtopicDetails: subs('va-tenses-verbs', [
    [
      'The twelve tenses at a glance',
      'Present / past / future × simple / continuous / perfect / perfect continuous. Simple for facts and habits, continuous for ongoing actions, perfect for completed actions with present relevance, perfect continuous for duration up to a point. Time markers (yesterday, since, by next year) decide the tense.',
    ],
    [
      'Sequence of tenses',
      'In a past main clause, the subordinate clause is normally past too: "He said that he was tired" (not "is"). Exceptions: universal truths ("He said that the earth revolves around the sun") and habitual facts. After "if" in conditionals, use present (type 1) or past (type 2), never "will".',
    ],
    [
      'Perfect tenses and time markers',
      '"Since/for/already/yet/just" go with present perfect; "yesterday/last year/ago" go with simple past. "Have you seen him yesterday?" is wrong; "Did you see him yesterday?" is right. Past perfect marks the earlier of two past actions ("The train had left when I reached").',
    ],
    [
      'Conditionals',
      'Type 1 (real future): If + present, will. Type 2 (unreal present): If + past, would. Type 3 (unreal past): If + past perfect, would have. "If I was" → "If I were" in formal English for type 2.',
    ],
    [
      'Modals and their nuances',
      'Can (ability/permission), could (past ability/polite), may (permission/possibility), might (weaker possibility), must (obligation/strong inference), should (advice), ought to, need not, used to (past habit). Modals take the base verb: "He must go", never "must goes/going".',
    ],
    [
      'Non-finite verbs: infinitive vs gerund',
      'Some verbs take the infinitive (want to, decide to, hope to), some the gerund (enjoy doing, avoid doing, mind doing, suggest doing), some either with a change in meaning (stop to smoke vs stop smoking). Prepositions are followed by gerunds (looking forward to meeting).',
    ],
  ]),
  explanationMd: `# Tenses, Verb Forms & Modals

### Let the time marker choose the tense
Placement questions almost always plant a clue word:
- *yesterday, last week, in 2010, ago* → **simple past**
- *since, for, already, yet, just, so far, ever* → **present perfect**
- *by the time, before, after, when* + another past action → **past perfect** for the earlier action
- *now, at the moment, look!* → **present continuous**
- *by next year, by 2030* → **future perfect**

### The perfect family
Present perfect connects past to now: *I have lived here since 2015.* Past perfect orders two past events: *She had finished before he arrived.* Future perfect looks back from a future point: *By June she will have graduated.*

### Sequence of tenses
A past reporting verb pulls the reported clause into the past: *He said he **was** busy.* Exception: universal truths keep the present (*The teacher said that water **boils** at 100 °C*).

### Conditionals — the three patterns
1. If + **present**, **will**: *If it rains, we will stay in.*
2. If + **past**, **would**: *If I had time, I would help.* (*If I were you...*)
3. If + **past perfect**, **would have**: *If she had studied, she would have passed.*
Never put *will/would* inside the *if*-clause.

### Modals
Modals are followed by the base form and do not take -s. *He can swim; she must leave; they should have called.* *Used to* expresses a past habit that has stopped; *be used to + -ing* means "accustomed to".

### Infinitive or gerund?
- **To-infinitive** after: want, hope, decide, plan, promise, refuse, agree, manage.
- **Gerund** after: enjoy, avoid, mind, finish, suggest, consider, admit, deny, practise, and after every preposition (*interested in learning*, *looking forward to meeting*).
- **Bare infinitive** after: let, make, had better, would rather (*She made him wait*).

### Traps
- *Have you gone to Delhi last year?* ✗ → *Did you go...*
- *If he will come, I will go.* ✗ → *If he comes...*
- *I am looking forward to meet you.* ✗ → *to meeting*
- *He is knowing the answer.* ✗ — stative verbs (know, believe, own, love) avoid continuous forms.`,
  formulas: [
    {
      id: 'f-va-tn-1',
      label: 'Conditionals',
      formula: 'Type 1: if + present → will;   Type 2: if + past → would;   Type 3: if + past perfect → would have + V3',
      exampleQ: 'Correct: "If she had known, she ___ (come) earlier."',
      exampleA: 'would have come (type 3).',
    },
    {
      id: 'f-va-tn-2',
      label: 'Marker → tense map',
      formula: 'ago / last / yesterday → simple past;   since / for / yet / already → present perfect;   by + future time → future perfect',
      exampleQ: 'Choose: "By 2030, the company ___ (open) fifty branches."',
      exampleA: 'will have opened.',
    },
  ],
  tricks: [
    {
      id: 't-va-tn-1',
      title: 'Never "will" after "if"',
      trick: 'Whenever an option has "if ... will" or "if ... would" in the same clause, it is the error (except polite requests like "if you will kindly...").',
      whenToUse: 'Conditional sentences.',
    },
    {
      id: 't-va-tn-2',
      title: 'Stative verbs stay simple',
      trick: 'know, believe, understand, own, belong, love, hate, seem, consist — do not use them in continuous tenses.',
      whenToUse: 'Error spotting with "-ing" forms.',
    },
  ],
  howToSolve: [
    {
      id: 'h-va-tn-1',
      step: 'Step 1: Find the time marker or the other verb in the sentence',
      detail: 'Underline words like since, ago, by, when, before, already. Note the tense of any other verb for sequence rules.',
      questionType: 'Tense questions',
    },
    {
      id: 'h-va-tn-2',
      step: 'Step 2: Map the marker to a tense and check the verb form',
      detail: 'Confirm the auxiliary (has/have/had/will have) and the participle (V3, not V2: "has written", not "has wrote").',
      questionType: 'All',
    },
    {
      id: 'h-va-tn-3',
      step: 'Step 3: Check modals and non-finite forms',
      detail: 'Base verb after modals; gerund after prepositions and gerund-verbs; infinitive after infinitive-verbs.',
      questionType: 'Error spotting / sentence correction',
    },
  ],
})

const vaAgreement = topic({
  id: 'va-subject-verb-agreement-pronouns',
  subjectId: S,
  title: 'Subject-Verb Agreement & Pronouns',
  moduleNumber: 1,
  moduleName: M1,
  order: 3,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-va-sva-01', 'q-va-sva-02'],
  subtopicDetails: subs('va-subject-verb-agreement-pronouns', [
    [
      'Basic agreement and intervening phrases',
      'Singular subject → singular verb. Ignore phrases between subject and verb: "The quality of the mangoes IS good", "The manager, along with his team, HAS arrived" (with/along with/as well as/together with do not make the subject plural).',
    ],
    [
      'Compound subjects: and, or, nor',
      'Joined by "and" → plural (unless they form one idea: "bread and butter is"). Joined by "or / nor / either...or / neither...nor" → verb agrees with the nearer subject: "Neither the teacher nor the students WERE present".',
    ],
    [
      'Indefinite pronouns and quantity words',
      'Each, every, everyone, someone, nobody, either, neither (as subjects) → singular. "A number of" → plural; "the number of" → singular. Fractions and percentages agree with the noun after "of": "Half of the cake IS", "Half of the students ARE".',
    ],
    [
      'Collective nouns and plural-looking singulars',
      'Team, committee, family, jury → singular when acting as a unit, plural when members act individually. News, mathematics, physics, economics, measles → singular. Scissors, trousers, spectacles → plural. "Police" and "cattle" → plural.',
    ],
    [
      'Pronoun case and agreement',
      'Subject pronouns (I, he, she, they, who) vs object pronouns (me, him, her, them, whom). "Between you and me"; "It is I who am..."; "He is taller than I (am)". A pronoun must agree in number and gender with its antecedent: "Everyone must bring HIS OR HER (or their) ID".',
    ],
    [
      'Relative pronouns and reflexives',
      'Who (people, subject), whom (people, object), which (things), that (people or things, defining clauses), whose (possession). Reflexives (myself, himself) only when the subject and object are the same; "Please contact myself" is wrong → "contact me".',
    ],
  ]),
  explanationMd: `# Subject-Verb Agreement & Pronouns

### Find the real subject
The most common trick is to put a plural noun between a singular subject and its verb: *The **list** of items **is** long.* Strike out prepositional phrases (*of items*) and interrupting phrases (*along with*, *as well as*, *together with*, *in addition to*) — they never change the number of the subject.

### Compound subjects
- **and** → plural: *Ravi and Sita are here.* Exception: one unit (*rice and curry is my lunch*).
- **or / nor / either…or / neither…nor** → agree with the **nearer** subject: *Neither the manager nor the clerks were informed.*

### Words that are always singular
each, every, either, neither, everyone, everybody, someone, anybody, nobody, no one, anything, *many a* (+ singular noun), *more than one* (+ singular noun).

### Quantity expressions
- *A number of* students **are** … / *The number of* students **is** …
- *Half / two-thirds / 40 % of* + noun → verb agrees with that noun.
- *None* can be singular or plural; prefer plural with plural nouns in modern usage.

### Collective nouns and tricky plurals
- *The committee **has** decided* (unit) / *The committee **are** divided* (members).
- Singular despite the -s: *news, physics, mathematics, economics, athletics, measles, billiards.*
- Plural without -s: *police, cattle, people.*
- Always plural: *scissors, trousers, jeans, spectacles, goods.*

### Pronouns
- **Case**: after prepositions and verbs use object forms — *between you and me*, *invite him and me*. After "than/as" in formal usage keep the subject form if a verb is implied — *taller than I (am)*.
- **Who vs whom**: substitute *he/him*. If *him* fits, use *whom* (*Whom did you meet? → I met him*).
- **Agreement**: a pronoun matches its antecedent in number — *Each student must submit **his or her** form* (or *their*, now widely accepted).
- **Reflexives** only when subject = object. *I hurt myself* ✓; *Send it to myself* ✗.

### Traps
- *Each of the boys have* ✗ → *has*.
- *One of the students who **is** late* — check what *who* refers to: *students* → *are*.
- *The Prime Minister, with his cabinet, are* ✗ → *is*.`,
  formulas: [
    {
      id: 'f-va-sva-1',
      label: 'Nearer-subject rule',
      formula: 'With or / nor / either…or / neither…nor, the verb agrees with the subject closest to it',
      exampleQ: 'Neither the teacher nor the students ___ (was/were) present.',
      exampleA: 'were (nearer subject "students").',
    },
    {
      id: 'f-va-sva-2',
      label: 'Who / whom test',
      formula: 'Replace with he → who;   replace with him → whom',
      exampleQ: '___ (Who/Whom) did the manager appoint?',
      exampleA: 'Whom (the manager appointed HIM).',
    },
  ],
  tricks: [
    {
      id: 't-va-sva-1',
      title: 'Cross out the interrupters',
      trick: 'Bracket every "of the ...", "along with ...", "as well as ..." phrase. What remains is the subject; match the verb to it.',
      whenToUse: 'Every agreement question.',
    },
    {
      id: 't-va-sva-2',
      title: '"The number" vs "a number"',
      trick: '"The number of" is singular (a single count). "A number of" means "several" and is plural.',
      whenToUse: 'Quantity-expression questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-va-sva-1',
      step: 'Step 1: Locate the verb and ask "who or what does this?"',
      detail: 'That is the subject. Ignore nouns inside prepositional or parenthetical phrases.',
      questionType: 'Agreement',
    },
    {
      id: 'h-va-sva-2',
      step: 'Step 2: Decide the subject\'s number using the special-case lists',
      detail: 'Indefinite pronouns → singular; and → plural; or/nor → nearer; collective → unit or members; quantity of → noun after of.',
      questionType: 'Agreement',
    },
    {
      id: 'h-va-sva-3',
      step: 'Step 3: For pronouns, check case and antecedent',
      detail: 'Object form after prepositions/verbs; who/whom by substitution; reflexive only if subject = object.',
      questionType: 'Pronoun questions',
    },
  ],
})

const vaSentenceStructure = topic({
  id: 'va-sentence-structure-voice-speech',
  subjectId: S,
  title: 'Sentence Structure, Active-Passive Voice & Reported Speech',
  moduleNumber: 1,
  moduleName: M1,
  order: 4,
  difficulty: 'core',
  examFrequency: 'high',
  featuredQuestionIds: ['q-va-ss-01', 'q-va-ss-02'],
  subtopicDetails: subs('va-sentence-structure-voice-speech', [
    [
      'Clauses, conjunctions and parallelism',
      'Independent clauses join with FANBOYS (for, and, nor, but, or, yet, so) or a semicolon; dependent clauses start with because, although, when, if, etc. Items in a list or comparison must be in the same grammatical form: "She likes reading, swimming and to cook" ✗ → "and cooking".',
    ],
    [
      'Correlative conjunctions',
      'Either...or, neither...nor, not only...but also, both...and, whether...or, hardly/scarcely...when, no sooner...than. The two parts must be followed by parallel structures, and the pair must be used correctly ("no sooner...than", never "no sooner...when").',
    ],
    [
      'Modifiers and their placement',
      'Place "only", "even", "almost", "just" next to the word they modify: "She only ate an apple" vs "She ate only an apple". Dangling modifiers: "Walking to school, the rain started" ✗ (the rain was not walking) → "Walking to school, I got caught in the rain".',
    ],
    [
      'Active to passive voice',
      'Object becomes subject; verb becomes be + past participle; the doer moves to a by-phrase or is dropped. Tense is preserved: "She is writing a letter" → "A letter is being written by her". Perfect continuous and future continuous tenses have no natural passive.',
    ],
    [
      'Passive in special cases',
      'Two objects: "He gave me a book" → "I was given a book" or "A book was given to me". Imperatives: "Shut the door" → "Let the door be shut" or "You are requested to shut the door". Questions: "Who wrote it?" → "By whom was it written?"',
    ],
    [
      'Direct to indirect (reported) speech',
      'Backshift tenses when the reporting verb is past (present → past, past → past perfect, will → would). Change pronouns and time words (now → then, today → that day, tomorrow → the next day, here → there, ago → before). Commands use "told/ordered/requested + to-infinitive"; questions use "asked if/whether" or the wh-word with statement order.',
    ],
  ]),
  explanationMd: `# Sentence Structure, Voice & Reported Speech

### Parallelism
Whatever grammatical shape the first item in a series has, the rest must match. *The job requires **planning**, **coordinating** and **to report**.* ✗ → *reporting.* This also applies across correlatives: *not only **in India** but also **abroad***.

### Correlatives — fixed pairs
either…or · neither…nor · both…and · not only…but also · whether…or · hardly/scarcely…**when** · no sooner…**than** · the same…as · such…as/that · so…that · as…as (positive) · so…as (negative).

### Modifier placement
Put limiting words (*only, even, just, almost, nearly*) right before what they limit. And make sure an opening participle phrase describes the subject that follows: *Having finished the report, **the manager** left* (not *the report was submitted*).

### Active ↔ passive
1. Object → subject.
2. Verb → **be** (in the same tense) + **past participle**.
3. Subject → *by* + object (or omitted if unimportant).

| Active | Passive |
|---|---|
| writes | is written |
| is writing | is being written |
| wrote | was written |
| has written | has been written |
| will write | will be written |
| can write | can be written |

Verbs with two objects give two passives; imperatives use *let … be* or *you are requested to*; questions keep the question form (*Was the letter written by him?*).

### Reported speech
When the reporting verb is in the past, **backshift**:
- am/is/are → was/were; was/were → had been
- present perfect → past perfect; simple past → past perfect
- will → would; can → could; may → might; must → had to
- **now → then, today → that day, yesterday → the previous day, tomorrow → the next day, here → there, this → that, ago → before**

Sentence types: statements → *said that*; yes/no questions → *asked if/whether* + statement order; wh-questions → *asked what/where* + statement order (no *do/did*); commands → *told/ordered … to*; requests → *requested … to*; exclamations → *exclaimed with joy/sorrow that*.

### Traps
- *No sooner had he left when* ✗ → *than*.
- *He asked me where was I going* ✗ → *where I was going*.
- Passive of *has been writing* does not exist in normal English; sentence-correction options that try it are wrong.`,
  formulas: [
    {
      id: 'f-va-ss-1',
      label: 'Passive transformation',
      formula: 'Object + be (same tense) + past participle + (by + subject)',
      exampleQ: 'Change to passive: "The committee will announce the results tomorrow."',
      exampleA: 'The results will be announced by the committee tomorrow.',
    },
    {
      id: 'f-va-ss-2',
      label: 'Reported speech backshift',
      formula: 'present → past;  past → past perfect;  will → would;  now → then;  tomorrow → the next day',
      exampleQ: 'Report: She said, "I will call you tomorrow."',
      exampleA: 'She said that she would call me the next day.',
    },
  ],
  tricks: [
    {
      id: 't-va-ss-1',
      title: 'Match the shape',
      trick: 'In lists and correlatives, read only the words after each connector. They must all be nouns, all -ing forms, or all clauses.',
      whenToUse: 'Parallelism questions.',
    },
    {
      id: 't-va-ss-2',
      title: 'No "do/did" in reported questions',
      trick: 'Reported questions use statement word order: "asked where she lived", never "asked where did she live".',
      whenToUse: 'Direct–indirect speech questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-va-ss-1',
      step: 'Step 1: Identify the transformation or the structure being tested',
      detail: 'Voice change, speech change, parallel list, correlative pair, or modifier placement.',
      questionType: 'All',
    },
    {
      id: 'h-va-ss-2',
      step: 'Step 2: Apply the mechanical rule and preserve tense and meaning',
      detail: 'Passive: same tense in "be". Reported: backshift and swap pronouns/time words. Parallel: same form throughout.',
      questionType: 'Transformation questions',
    },
    {
      id: 'h-va-ss-3',
      step: 'Step 3: Read the result for sense',
      detail: 'Check who is doing what, that the time reference is unchanged, and that no dangling modifier has appeared.',
      questionType: 'All',
    },
  ],
})

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 — SENTENCE-LEVEL QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────

const M2 = 'Module 2: Sentence-Level Questions'

const vaErrorSpotting = topic({
  id: 'va-error-spotting',
  subjectId: S,
  title: 'Error Spotting',
  moduleNumber: 2,
  moduleName: M2,
  order: 5,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-va-es-01', 'q-va-es-02'],
  subtopicDetails: subs('va-error-spotting', [
    [
      'Format and approach',
      'A sentence is split into 3-4 parts (A, B, C, D) plus "No error". Read the whole sentence first for meaning, then check each part against a fixed checklist. Roughly 10-15% of such questions have no error — do not force one.',
    ],
    [
      'The error checklist',
      'Subject-verb agreement → tense and time markers → pronoun case/agreement → articles → prepositions → adjective/adverb confusion → comparatives → parallelism → redundancy → word choice. Run it in this order; most errors are in the first four.',
    ],
    [
      'Comparatives and superlatives',
      'Comparative for two, superlative for three or more. No double comparatives ("more better"). "Than" with comparatives, "of/in" with superlatives. Absolute adjectives (unique, perfect, complete) take no degree. "Senior/junior/prior/superior" take "to", not "than".',
    ],
    [
      'Adjectives vs adverbs',
      'Adjectives describe nouns; adverbs describe verbs, adjectives or other adverbs. Linking verbs (be, seem, look, feel, taste, smell, sound) take adjectives: "The soup tastes good" (not "well"). "Hardly" (barely) is not the adverb of "hard".',
    ],
    [
      'Redundancy and wordiness',
      'Return back, repeat again, revert back, past history, free gift, final outcome, each and every (in formal writing), advance planning, ATM machine. One of the pair is enough; if a part contains such a phrase, it is the error.',
    ],
    [
      'Commonly confused words',
      'Affect/effect, accept/except, advice/advise, its/it\'s, their/there/they\'re, then/than, lose/loose, principal/principle, stationary/stationery, complement/compliment, fewer (countable)/less (uncountable), amount (uncountable)/number (countable).',
    ],
  ]),
  explanationMd: `# Error Spotting

### Method beats instinct
Reading a sentence and waiting for something to "sound wrong" works only for obvious errors. Placement questions plant subtle ones, so run a **checklist** on every part:

1. **Agreement** — find the subject, check the verb.
2. **Tense** — look for time markers and sequence.
3. **Pronouns** — case (I/me, who/whom) and number.
4. **Articles** — a/an/the present, missing or extra?
5. **Prepositions** — the fixed pair with the verb/adjective.
6. **Adjective/adverb** — after linking verbs, adjectives.
7. **Comparison** — two vs many, *than* vs *to*, no double comparatives.
8. **Parallelism** — lists and correlatives.
9. **Redundancy** — *return back*, *repeat again*.
10. **Word choice** — affect/effect, fewer/less, etc.

### Comparison rules in detail
- *Ravi is taller than **any other** boy in the class* (exclude himself).
- *Ravi is taller than **all other** boys*; superlative: *the tallest **of all** the boys*.
- *This is the **most unique** design* ✗ — unique has no degree.
- *Senior **to**, prefer **to**, superior **to*** — not *than*.
- *Elder/eldest* for family members and without *than*; *older* takes *than*.

### Adjective or adverb?
*She looks **beautiful*** (adjective after a linking verb) but *She sings **beautifully*** (adverb modifying the verb). *He works **hard*** (hard is both adjective and adverb); *He **hardly** works* means he barely works.

### Countable vs uncountable
*fewer / number / many* with countables (*fewer students*); *less / amount / much* with uncountables (*less time*). *Advice, information, furniture, luggage, news, equipment, homework* are uncountable — no plural -s, no *an*.

### "No error" discipline
Only choose "no error" after running the full checklist on every part. Conversely, if a part passes all ten checks, do not invent an error because it reads awkwardly.

### Traps
- *One of my friend* ✗ → *friends*.
- *The two first chapters* ✗ → *the first two chapters*.
- *Discuss about* ✗; *comprises of* ✗; *cope up with* ✗ → *cope with*.
- *He is one of the best player* ✗ → *players*.`,
  formulas: [
    {
      id: 'f-va-es-1',
      label: 'Comparison forms',
      formula: 'Two items → comparative + than;   three or more → the + superlative + of/in;   senior/junior/superior/prefer + to',
      exampleQ: 'Spot the error: "Of the two proposals, the second is the best."',
      exampleA: '"the best" → "the better" (only two proposals).',
    },
    {
      id: 'f-va-es-2',
      label: 'Countable / uncountable pairing',
      formula: 'fewer / many / number of + countable;   less / much / amount of + uncountable',
      exampleQ: 'Spot the error: "There were less students in class today."',
      exampleA: '"less students" → "fewer students".',
    },
  ],
  tricks: [
    {
      id: 't-va-es-1',
      title: 'Start with the verb',
      trick: 'In each part, find the verb first. Agreement and tense errors — the two most common — live there.',
      whenToUse: 'Every error-spotting question.',
    },
    {
      id: 't-va-es-2',
      title: 'Redundancy radar',
      trick: 'Scan for return back, revert back, repeat again, past history, free gift, ATM machine, PIN number, advance planning. If present, that part is the answer.',
      whenToUse: 'Quick first pass.',
    },
  ],
  howToSolve: [
    {
      id: 'h-va-es-1',
      step: 'Step 1: Read the entire sentence for meaning',
      detail: 'Know who did what, when. Many tense and pronoun errors only show when the whole sentence is understood.',
      questionType: 'Error spotting',
    },
    {
      id: 'h-va-es-2',
      step: 'Step 2: Run the ten-point checklist part by part',
      detail: 'Agreement → tense → pronoun → article → preposition → adj/adv → comparison → parallelism → redundancy → word choice.',
      questionType: 'Error spotting',
    },
    {
      id: 'h-va-es-3',
      step: 'Step 3: Confirm the fix',
      detail: 'Mentally correct the suspected part and re-read the sentence. If it now reads correctly and no other part fails, mark it. Otherwise choose "No error".',
      questionType: 'Error spotting',
    },
  ],
})

const vaSentenceCorrection = topic({
  id: 'va-sentence-correction-improvement',
  subjectId: S,
  title: 'Sentence Correction & Improvement',
  moduleNumber: 2,
  moduleName: M2,
  order: 6,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-va-sc-01', 'q-va-sc-02'],
  subtopicDetails: subs('va-sentence-correction-improvement', [
    [
      'Format and the "no improvement" option',
      'Part of the sentence is underlined; options replace it. One option often repeats the original ("No improvement / No correction required"). Compare options against each other — the differences between them show what is being tested.',
    ],
    [
      'Split the options by the difference',
      'If options differ in verb tense, the question tests tense; if in has/have, agreement; if in preposition, collocation. Eliminate by the tested rule first, then read the survivors for meaning and concision.',
    ],
    [
      'Concision and clarity',
      'Prefer the shortest option that is grammatically correct and keeps the meaning. Avoid options that add redundancy, passive voice without reason, or vague pronouns ("this", "which" with no clear antecedent).',
    ],
    [
      'Idiomatic usage',
      'Fixed expressions: "in spite of / despite" (no "of" after despite), "so ... that", "too ... to", "enough ... to", "not only ... but also", "would rather ... than", "had better + base verb", "used to + base verb".',
    ],
    [
      'Meaning preservation',
      'The correct option must keep the original intent. An option that is grammatical but changes who did what, the time, or the certainty (may vs will) is wrong.',
    ],
  ]),
  explanationMd: `# Sentence Correction & Improvement

### Options tell you what is tested
Do not stare at the sentence; **compare the options**. If they differ only in *has / have*, the question is about agreement. If in *since / for*, about prepositions of time. Once you know the rule, eliminate in one pass.

### Elimination order
1. **Grammar** — remove options with a clear error (agreement, tense, pronoun, idiom).
2. **Meaning** — remove options that change the intent or logic.
3. **Concision** — among the survivors prefer the shortest, most direct one.

### Idioms and fixed structures
- *despite* + noun (no *of*); *in spite of* + noun
- *so + adjective + that*; *too + adjective + to*; *adjective + enough + to*
- *would rather + base verb + than*; *had better + base verb*
- *used to + base verb* (past habit); *be used to + -ing* (accustomed)
- *not only … but also*; *hardly … when*; *no sooner … than*
- *as … as* (equal); *not so/as … as* (unequal)

### Concision
*In the event that* → *if*; *due to the fact that* → *because*; *at this point in time* → *now*; *has the ability to* → *can*. The shorter option is not always right, but a longer option needs a grammatical reason to exist.

### "No improvement"
Choose it when the original passes the checklist and every alternative introduces an error or changes meaning. Statistically it is correct about one time in five — neither ignore nor overuse it.

### Traps
- Options that fix one error but introduce another (right tense, wrong preposition).
- Pronoun ambiguity: *When Ravi met Arjun, he was late* — who was late?
- Changing *will* to *may* alters certainty; changing *because* to *although* reverses logic.`,
  formulas: [
    {
      id: 'f-va-sc-1',
      label: 'Elimination order',
      formula: 'Grammar → Meaning → Concision',
      exampleQ: 'Improve: "He is one of the student who has topped the exam." (a) students who have (b) students who has (c) student who have (d) no improvement',
      exampleA: '(a) — "one of the + plural noun", and "who" refers to "students" → "have".',
    },
    {
      id: 'f-va-sc-2',
      label: 'Fixed pairs',
      formula: 'too … to;  so … that;  enough … to;  would rather … than;  no sooner … than;  hardly … when',
      exampleQ: 'Improve: "He is too weak that he cannot walk."',
      exampleA: '"too weak to walk" or "so weak that he cannot walk".',
    },
  ],
  tricks: [
    {
      id: 't-va-sc-1',
      title: 'Read vertically',
      trick: 'Line up the options and read the first word of each, then the second. The point where they diverge is the tested rule.',
      whenToUse: 'Every sentence-correction question.',
    },
    {
      id: 't-va-sc-2',
      title: 'Plug the finalist back in',
      trick: 'Read the full sentence with your chosen option inserted. If it sounds off or changes meaning, revisit the next-best option.',
      whenToUse: 'Final check.',
    },
  ],
  howToSolve: [
    {
      id: 'h-va-sc-1',
      step: 'Step 1: Compare options to find the tested rule',
      detail: 'Spot the differing words (tense, number, preposition, idiom). Write the rule in two words.',
      questionType: 'Sentence correction',
    },
    {
      id: 'h-va-sc-2',
      step: 'Step 2: Eliminate by grammar, then by meaning',
      detail: 'Cross out options that break the rule. Then cross out ones that change who/what/when or the logical connector.',
      questionType: 'Sentence correction',
    },
    {
      id: 'h-va-sc-3',
      step: 'Step 3: Choose the most concise survivor and re-read',
      detail: 'If the original survives all checks and alternatives are worse, choose "No improvement".',
      questionType: 'Sentence correction',
    },
  ],
})

const vaFillBlanks = topic({
  id: 'va-fill-in-the-blanks-cloze',
  subjectId: S,
  title: 'Fill in the Blanks & Cloze Test',
  moduleNumber: 2,
  moduleName: M2,
  order: 7,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-va-fb-01', 'q-va-fb-02'],
  subtopicDetails: subs('va-fill-in-the-blanks-cloze', [
    [
      'Grammar-based blanks',
      'The blank tests a preposition, article, verb form, conjunction or pronoun. Identify the word class needed from the words around the blank, then apply the rule (collocation, tense marker, agreement).',
    ],
    [
      'Vocabulary-based blanks',
      'The blank needs a word with the right meaning and tone. Read the whole sentence, predict a word before looking at options, then find the closest match. Watch for connotation (thrifty vs stingy) and register (formal vs casual).',
    ],
    [
      'Double blanks',
      'Two blanks with paired options. Solve the blank you are surer of first and eliminate pairs that fail it; then test the remaining pairs on the second blank. The two words must fit together logically.',
    ],
    [
      'Connectors and logic words',
      'Contrast: but, however, although, whereas, nevertheless. Cause/effect: because, therefore, consequently, hence. Addition: moreover, furthermore, also. Sequence: first, then, finally. The connector must match the relationship between the two ideas.',
    ],
    [
      'Cloze test strategy',
      'A passage with 5-10 blanks. Read the whole passage once (skipping blanks) to get the theme and tone, then fill the easy blanks, then use context from filled blanks to resolve the harder ones. Each blank should agree with the sentence grammatically and with the passage in meaning.',
    ],
    [
      'Elimination cues',
      'Reject options that break grammar (wrong part of speech, wrong number), clash with the tone, or contradict the passage. Prefer the option that fits both the immediate sentence and the paragraph\'s direction.',
    ],
  ]),
  explanationMd: `# Fill in the Blanks & Cloze Test

### Predict before you peek
Read the sentence with the blank as a hum. Decide **what kind of word** is missing (verb? preposition? adjective?) and roughly **what it should mean** (positive? negative? cause? contrast?). Only then look at the options. This stops attractive-but-wrong options from anchoring you.

### Grammar blanks
The neighbours tell you the class:
- after *the/an* → noun or adjective + noun
- after a preposition → noun or -ing form
- before a noun → adjective or article
- after a subject → verb (check tense markers)
- between two clauses → conjunction / connector

### Vocabulary blanks
Use **context clues**:
- Definition or restatement nearby (*the ___, or lack of interest, was obvious*).
- Contrast markers (*although, but, unlike*) → the blank is the opposite of the other idea.
- Cause markers (*because, so, therefore*) → the blank agrees with the cause.
- Tone words elsewhere in the sentence (*praised, criticised*) → match the polarity.

### Connectors
| Relationship | Words |
|---|---|
| contrast | but, however, whereas, although, nevertheless, on the other hand |
| cause / result | because, since, as, therefore, hence, consequently, thus |
| addition | moreover, furthermore, in addition, also, besides |
| example | for instance, for example, such as |
| condition | if, unless, provided that |
| sequence | first, next, then, finally, subsequently |

Check the relationship between the ideas, then choose the connector class, then the exact word that fits the grammar (*although* + clause; *despite* + noun).

### Double blanks
Fix the surer blank first, cut the pairs that fail it, then test the remainder on the second blank. Both words must also make sense **together** — a pair that fits each blank separately can still be illogical as a whole.

### Cloze test
1. Skim the whole passage; note the topic and the author's attitude.
2. Fill the blanks you are certain of.
3. Return to the hard ones, now with more context.
4. Re-read the finished paragraph once for flow.

### Traps
- The option that is grammatically possible but tonally wrong (formal passage, casual word).
- Options that are near-synonyms — pick by collocation (*heavy rain*, not *strong rain*; *make a decision*, not *do a decision*).
- Connectors: *despite of* ✗, *although … but* ✗ (use one).`,
  formulas: [
    {
      id: 'f-va-fb-1',
      label: 'Context-clue map',
      formula: 'contrast marker → opposite meaning;   cause marker → same-direction meaning;   restatement → synonym',
      exampleQ: 'Although the plot was ___, the acting was superb.',
      exampleA: 'A negative word (weak / predictable / dull) — "although" signals contrast with "superb".',
    },
    {
      id: 'f-va-fb-2',
      label: 'Connector grammar',
      formula: 'although / because / whereas + clause;   despite / in spite of / because of + noun or -ing',
      exampleQ: '___ the heavy rain, the match continued.',
      exampleA: 'Despite / In spite of (followed by a noun phrase).',
    },
  ],
  tricks: [
    {
      id: 't-va-fb-1',
      title: 'Polarity first',
      trick: 'Decide whether the blank needs a positive or negative word before considering exact meaning. This alone removes half the options.',
      whenToUse: 'Vocabulary blanks.',
    },
    {
      id: 't-va-fb-2',
      title: 'Cloze: theme sentence',
      trick: 'The first and last sentences of a cloze passage usually state the theme. Read them carefully; every blank must agree with that theme.',
      whenToUse: 'Cloze tests.',
    },
  ],
  howToSolve: [
    {
      id: 'h-va-fb-1',
      step: 'Step 1: Read the whole sentence (or passage) and predict the blank',
      detail: 'Decide word class and polarity. Note any connector that signals contrast or cause.',
      questionType: 'All blanks',
    },
    {
      id: 'h-va-fb-2',
      step: 'Step 2: Eliminate options by grammar, then by meaning and tone',
      detail: 'Wrong part of speech or number goes first; then wrong polarity; then wrong collocation or register.',
      questionType: 'All blanks',
    },
    {
      id: 'h-va-fb-3',
      step: 'Step 3: Insert and read the full sentence',
      detail: 'For double blanks, read with both words in place. For cloze, re-read the paragraph once at the end.',
      questionType: 'All blanks',
    },
  ],
})

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 — VOCABULARY
// ─────────────────────────────────────────────────────────────────────────────

const M3 = 'Module 3: Vocabulary'

const vaSynAnt = topic({
  id: 'va-synonyms-antonyms',
  subjectId: S,
  title: 'Synonyms & Antonyms',
  moduleNumber: 3,
  moduleName: M3,
  order: 8,
  difficulty: 'basic',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-va-sa-01', 'q-va-sa-02'],
  subtopicDetails: subs('va-synonyms-antonyms', [
    [
      'Roots, prefixes and suffixes',
      'Latin/Greek roots decode unfamiliar words: bene (good: benevolent), mal (bad: malicious), chron (time: chronic), bio (life), phil (love: philanthropy), mis (hate: misanthrope), ver (truth: verify), cred (believe: incredulous). Prefixes flip meaning: un-, in-, im-, dis-, a-, anti-, counter-.',
    ],
    [
      'Polarity and degree',
      'First decide whether the word is positive, negative or neutral; then its intensity. "Furious" is stronger than "annoyed"; "elated" is stronger than "pleased". For antonyms choose the opposite polarity at a similar strength.',
    ],
    [
      'Context-based synonym questions',
      'When a word is given in a sentence, the required synonym must fit that sentence, not the word\'s commonest meaning. "The bank of the river" — "bank" here means "shore", not a financial institution.',
    ],
    [
      'High-frequency placement words',
      'Abundant, adverse, alleviate, ambiguous, apathy, benevolent, candid, coherent, concise, credible, deteriorate, diligent, eloquent, feasible, frugal, hostile, indifferent, lucid, meticulous, mitigate, obsolete, pragmatic, prudent, redundant, resilient, scrutinise, tedious, trivial, verbose, vigilant.',
    ],
    [
      'Elimination technique',
      'Reject options with the wrong part of speech (a noun offered for a verb), the wrong polarity, or a meaning that is related but not equivalent (cause vs effect, part vs whole). If two options remain, choose the closer in degree.',
    ],
  ]),
  explanationMd: `# Synonyms & Antonyms

### Two habits that outperform memorising lists
1. **Polarity + degree first.** Decide if the word is good, bad or neutral, and how strong. *Meticulous* is positive-strong (very careful); *negligent* is negative. For an antonym, flip polarity but keep roughly the same strength.
2. **Break the word.** Prefix + root + suffix. *In-cred-ulous* = not + believe + full of → "unwilling to believe" → antonym *gullible*.

### Roots that pay off
| Root | Meaning | Examples |
|---|---|---|
| bene / bon | good | benevolent, benefit, bonus |
| mal | bad | malicious, malfunction |
| cred | believe | credible, incredulous |
| ver | true | verify, veracity |
| phil | love | philanthropy, bibliophile |
| mis | hate | misanthrope, misogyny |
| chron | time | chronic, chronology |
| dict | say | dictate, contradict |
| spec / spic | look | inspect, conspicuous |
| voc / vok | call | vocal, provoke |

Prefixes: **un-, in-/im-/il-/ir-, dis-, non-, a-** (negation); **anti-, contra-, counter-** (against); **pro-** (for); **hyper-** (over); **hypo-** (under).

### Context first
If the word appears in a sentence, the sentence overrides the dictionary. *Grave* can mean a burial place or *serious*; *novel* can be a book or *new*. Read the sentence, decide the sense, then match.

### Frequently tested pairs
abundant–scarce · candid–evasive · concise–verbose · diligent–lazy · feasible–impractical · frugal–extravagant · hostile–friendly · lucid–obscure · obsolete–modern · pragmatic–idealistic · prudent–reckless · resilient–fragile · tedious–exciting · trivial–significant · vigilant–careless · benevolent–malevolent · apathy–enthusiasm · alleviate–aggravate · mitigate–intensify · deteriorate–improve

### Traps
- Options that are **related** but not synonyms (*doctor* for *hospital*).
- The **wrong part of speech** (*bravery* offered for the adjective *brave*).
- Antonym questions where one option is a synonym — read the instruction twice.
- "Same-degree" rule: the antonym of *ecstatic* is *miserable*, not *sad*.`,
  formulas: [
    {
      id: 'f-va-sa-1',
      label: 'Word-building',
      formula: 'Prefix (negation / direction) + Root (core meaning) + Suffix (part of speech)',
      exampleQ: 'Guess the meaning of "malevolent".',
      exampleA: 'mal (bad) + vol (wish) + -ent (adjective) → wishing harm → synonym: spiteful; antonym: benevolent.',
    },
    {
      id: 'f-va-sa-2',
      label: 'Antonym selection',
      formula: 'Opposite polarity + similar intensity + same part of speech',
      exampleQ: 'Antonym of "frugal": (a) careful (b) extravagant (c) poor (d) generous',
      exampleA: '(b) extravagant — frugal means economical; the direct opposite is spending freely.',
    },
  ],
  tricks: [
    {
      id: 't-va-sa-1',
      title: 'Polarity strike-out',
      trick: 'Mark each option + / − / 0. For a synonym keep the same sign; for an antonym keep the opposite. Usually only one or two options remain.',
      whenToUse: 'Every synonym / antonym question.',
    },
    {
      id: 't-va-sa-2',
      title: 'Use the word in a sentence',
      trick: 'If you half-know the word, put it in a sentence you have heard ("a frugal meal", "a candid interview"). The sentence recalls the meaning better than the isolated word.',
      whenToUse: 'Half-familiar words.',
    },
  ],
  howToSolve: [
    {
      id: 'h-va-sa-1',
      step: 'Step 1: Fix the sense of the word (context if given, roots if not)',
      detail: 'Decide polarity and degree; identify the part of speech.',
      questionType: 'Synonym / antonym',
    },
    {
      id: 'h-va-sa-2',
      step: 'Step 2: Eliminate by part of speech and polarity',
      detail: 'Cross out options that are the wrong class or the wrong sign for the question type.',
      questionType: 'Synonym / antonym',
    },
    {
      id: 'h-va-sa-3',
      step: 'Step 3: Choose by closeness in degree and collocation',
      detail: 'Between two remaining options, pick the one that would replace the word in a natural sentence without changing intensity.',
      questionType: 'Synonym / antonym',
    },
  ],
})

const vaIdioms = topic({
  id: 'va-idioms-phrases-one-word',
  subjectId: S,
  title: 'Idioms, Phrasal Verbs & One-Word Substitutes',
  moduleNumber: 3,
  moduleName: M3,
  order: 9,
  difficulty: 'core',
  examFrequency: 'high',
  featuredQuestionIds: ['q-va-id-01', 'q-va-id-02'],
  subtopicDetails: subs('va-idioms-phrases-one-word', [
    [
      'High-frequency idioms',
      'A blessing in disguise (a hidden benefit), beat around the bush (avoid the point), bite the bullet (face something unpleasant), break the ice (start a conversation), burn the midnight oil (work late), cut corners (do cheaply), hit the nail on the head (be exactly right), once in a blue moon (rarely), the ball is in your court (your decision), under the weather (unwell).',
    ],
    [
      'Idioms with body parts and colours',
      'Cold feet (nervousness), keep an eye on (watch), pull someone\'s leg (tease), give a hand (help), by heart (memorised); red tape (bureaucracy), white elephant (costly and useless), black sheep (disgrace to a group), green with envy, out of the blue (unexpectedly).',
    ],
    [
      'Phrasal verbs',
      'Verb + particle with a new meaning: call off (cancel), carry on (continue), come across (find by chance), give up (quit), look after (care for), look into (investigate), put off (postpone), put up with (tolerate), run out of (exhaust), turn down (reject), bring up (raise a topic / a child), break down (stop working / collapse).',
    ],
    [
      'One-word substitutes: people',
      'Omnivore (eats everything), optimist/pessimist, philanthropist (helps humanity), misanthrope (hates people), misogynist, teetotaller (never drinks alcohol), pedestrian (walks), spendthrift (wastes money), miser, connoisseur (expert judge of art/food), novice (beginner), veteran (long experience), polyglot (many languages), ambidextrous (both hands).',
    ],
    [
      'One-word substitutes: things, places, fields',
      'Anonymous (name unknown), posthumous (after death), incorrigible (cannot be corrected), inevitable (cannot be avoided), illegible (cannot be read), inaudible, invincible, aquarium, aviary (birds), apiary (bees), orphanage, sanatorium, ornithology (birds), entomology (insects), etymology (word origins), philately (stamps), numismatics (coins).',
    ],
    [
      'Approach to meaning questions',
      'Idioms are not literal — do not translate word by word. For unfamiliar idioms use the sentence context and the polarity of the outcome. For one-word substitutes, decode roots (omni = all, phil = love, -cide = kill, -logy = study).',
    ],
  ]),
  explanationMd: `# Idioms, Phrasal Verbs & One-Word Substitutes

### Idioms: meaning, not words
An idiom's meaning is conventional. *Kick the bucket* has nothing to do with buckets. Learn them as complete units with a short gloss, and when one is unfamiliar in the exam, lean on the sentence: is the outcome good or bad? Is the speaker praising or complaining?

**Must-know set (with glosses)**
- a blessing in disguise — a hidden benefit
- beat around the bush — avoid the main point
- bite the bullet — face something unpleasant bravely
- break the ice — ease initial awkwardness
- burn the midnight oil — work very late
- cut corners — do something cheaply or carelessly
- hit the nail on the head — be exactly right
- in hot water — in trouble
- let the cat out of the bag — reveal a secret
- once in a blue moon — very rarely
- pull someone's leg — tease
- the ball is in your court — it is your decision
- turn a blind eye — deliberately ignore
- under the weather — unwell
- a piece of cake — very easy
- red tape — bureaucratic delay
- white elephant — expensive and useless possession
- black sheep — the disreputable member of a group
- out of the blue — unexpectedly
- at the eleventh hour — at the last moment

### Phrasal verbs
Verb + particle, often with several meanings. Learn the common ones in context:
*call off* (cancel), *carry out* (perform), *come across* (find), *give in* (surrender), *give up* (quit), *look after* (care for), *look into* (investigate), *look up to* (respect), *put off* (postpone), *put up with* (tolerate), *run out of* (exhaust), *set up* (establish), *take after* (resemble), *turn down* (reject), *turn up* (arrive), *bring about* (cause), *break out* (start suddenly), *fall through* (fail to happen).

### One-word substitutes: decode the root
- **omni-** all: omniscient (knows all), omnipotent (all-powerful), omnivore
- **phil-** love / **mis-** hate: philanthropist, misanthrope
- **-cide** kill: homicide, suicide, regicide (king), fratricide (brother), infanticide
- **-logy** study of: ornithology (birds), entomology (insects), etymology (words), anthropology (humans)
- **-phobia** fear: claustrophobia (enclosed spaces), acrophobia (heights), xenophobia (foreigners)
- **in-/im-/il-** not + -ible/-able: inaudible, illegible, incorrigible, inevitable, invincible

People: *teetotaller, spendthrift, miser, connoisseur, novice, veteran, polyglot, ambidextrous, optimist, pessimist, pedestrian, cynic (doubts human goodness), sceptic (doubts claims), stoic (unmoved by pain or pleasure), altruist (selfless)*.

Places: *aviary, apiary, aquarium, orphanage, sanatorium, archive, granary, hangar, kennel, stable, monastery, mint (coins)*.

### Traps
- Phrasal verbs with opposite meanings: *put off* (postpone) vs *put on* (wear); *look up* (search) vs *look down on* (despise).
- Near-idioms in options that change one word (*hit the nail on the thumb*).
- One-word substitutes with the same root but different suffix (*misanthrope* – person; *misanthropy* – attitude).`,
  formulas: [
    {
      id: 'f-va-id-1',
      label: 'Root decoding for one-word substitutes',
      formula: 'omni = all; phil = love; mis = hate; -cide = kill; -logy = study; -phobia = fear; -ist = person',
      exampleQ: 'One word for "a person who loves mankind".',
      exampleA: 'Philanthropist (phil = love, anthrop = human).',
    },
    {
      id: 'f-va-id-2',
      label: 'Idiom by context polarity',
      formula: 'Determine whether the sentence outcome is positive or negative; choose the gloss with the same polarity',
      exampleQ: '"Losing that job turned out to be a blessing in disguise." What does the idiom mean?',
      exampleA: 'A misfortune that later proved beneficial (positive outcome).',
    },
  ],
  tricks: [
    {
      id: 't-va-id-1',
      title: 'Verb + particle table',
      trick: 'Group phrasal verbs by particle: OFF (call off, put off, set off, take off), UP (give up, put up with, look up, turn up), INTO (look into, run into, turn into). The particle often hints at the meaning (off = cancel/leave; up = complete/appear).',
      whenToUse: 'Revising phrasal verbs.',
    },
    {
      id: 't-va-id-2',
      title: 'Eliminate the literal reading',
      trick: 'In idiom MCQs, one option is usually the literal meaning. It is almost never correct.',
      whenToUse: 'Idiom meaning questions.',
    },
  ],
  howToSolve: [
    {
      id: 'h-va-id-1',
      step: 'Step 1: Identify the type — idiom, phrasal verb or substitute',
      detail: 'Idioms: whole-phrase meaning. Phrasal verbs: verb + particle. Substitutes: decode the definition into roots.',
      questionType: 'All',
    },
    {
      id: 'h-va-id-2',
      step: 'Step 2: Use context polarity or root meaning to shortlist',
      detail: 'Match positive/negative outcome; match root + suffix for the part of speech asked (person vs quality vs place).',
      questionType: 'All',
    },
    {
      id: 'h-va-id-3',
      step: 'Step 3: Test the shortlisted option in the sentence',
      detail: 'Replace the idiom/phrasal verb with the gloss and read. It should keep the sentence natural and logical.',
      questionType: 'All',
    },
  ],
})

const vaSpellingConfusables = topic({
  id: 'va-spelling-confusables-collocations',
  subjectId: S,
  title: 'Spelling, Confusable Words & Collocations',
  moduleNumber: 3,
  moduleName: M3,
  order: 10,
  difficulty: 'basic',
  examFrequency: 'moderate',
  featuredQuestionIds: ['q-va-sp-01', 'q-va-sp-02'],
  subtopicDetails: subs('va-spelling-confusables-collocations', [
    [
      'Frequently misspelt words',
      'Accommodate, achieve, acquire, beginning, believe, calendar, committee, conscience, definitely, embarrass, environment, exaggerate, existence, government, harass, independent, liaison, maintenance, millennium, necessary, occasion, occurrence, parallel, privilege, receive, recommend, separate, successful, tomorrow, until.',
    ],
    [
      'Spelling rules and exceptions',
      '"i before e except after c" (believe, receive) with exceptions (weird, seize, neither, height). Doubling the final consonant before -ing/-ed when the syllable is stressed (begin → beginning; but open → opening). Drop silent e before a vowel suffix (hope → hoping) but keep it before a consonant suffix (hopeful). -ful has one l.',
    ],
    [
      'Homophones and near-homophones',
      'Their/there/they\'re; its/it\'s; your/you\'re; whose/who\'s; to/too/two; affect/effect; accept/except; advice/advise; practice (noun, BrE)/practise (verb); principal/principle; stationary/stationery; complement/compliment; desert/dessert; lose/loose; cite/site/sight; weather/whether.',
    ],
    [
      'Commonly confused pairs',
      'Fewer/less, amount/number, farther (distance)/further (degree), between/among, imply (speaker)/infer (listener), lie (recline)/lay (place), rise/raise, sit/set, historic (important)/historical (about history), economic (economy)/economical (thrifty), uninterested (not interested)/disinterested (impartial).',
    ],
    [
      'Collocations',
      'Words that naturally pair: make a decision/mistake/effort; do homework/business/a favour; take a photo/a break/responsibility; heavy rain/traffic/smoker; strong coffee/argument; fast food/car; quick meal/look; pay attention; catch a cold; commit a crime; keep a promise; break a record.',
    ],
  ]),
  explanationMd: `# Spelling, Confusable Words & Collocations

### Spelling: patterns, not memorising letters
- **i before e except after c** — *believe, achieve, receive, deceive*. Exceptions to know: *weird, seize, either, neither, height, foreign, leisure*.
- **Double the consonant** when the last syllable is stressed and ends consonant-vowel-consonant: *begin → beginning, occur → occurred, refer → referred*; but *open → opening, offer → offered* (stress on the first syllable).
- **Silent e**: drop before a vowel suffix (*hope → hoping, write → writing*), keep before a consonant suffix (*hope → hopeful, care → careful*). Keep after c/g before a/o (*noticeable, courageous*).
- **-ful** always one *l*; **-fully** two (*careful, carefully*).
- **-able vs -ible**: more words take *-able*; *-ible* mostly after Latin roots (*visible, possible, responsible, legible, terrible*).

### The twenty most-misspelt words in placement papers
accommodate · achieve · believe · calendar · committee · conscience · definitely · embarrass · environment · exaggerate · government · harass · independent · maintenance · necessary · occasion · privilege · receive · recommend · separate

### Confusables — the meaning test
| Pair | Difference |
|---|---|
| affect / effect | verb (to influence) / noun (result) |
| accept / except | to receive / excluding |
| advice / advise | noun / verb |
| principal / principle | chief, head / rule |
| stationary / stationery | not moving / paper goods |
| complement / compliment | completes / praise |
| imply / infer | speaker hints / listener concludes |
| farther / further | physical distance / degree |
| fewer / less | countable / uncountable |
| historic / historical | important / relating to history |
| economic / economical | of the economy / thrifty |
| uninterested / disinterested | bored / impartial |
| lie / lay | recline (no object) / place (takes an object) |

### Collocations
Native-sounding English depends on habitual pairings. *Make* a decision, *do* homework, *take* a photo, *heavy* rain, *strong* tea, *fast* food, *quick* look, *pay* attention, *catch* a cold, *commit* a crime, *keep* a promise, *break* a record, *run* a business, *raise* a question. Sentence-improvement options often swap one verb of a collocation for a near-synonym that does not collocate.

### Traps
- *Its* (possessive) vs *it's* (it is) — the apostrophe is the contraction.
- *Loose* (not tight) vs *lose* (misplace).
- *Alot* is not a word; *a lot* is.
- *Then* (time) vs *than* (comparison).`,
  formulas: [
    {
      id: 'f-va-sp-1',
      label: 'Consonant doubling',
      formula: 'Double the final consonant before -ing/-ed if the word ends CVC and the last syllable is stressed',
      exampleQ: 'Spell: begin + -ing; open + -ing; occur + -ed.',
      exampleA: 'beginning; opening; occurred.',
    },
    {
      id: 'f-va-sp-2',
      label: 'Affect / effect',
      formula: 'affect = verb (to influence);   effect = noun (a result)  [rare: effect as verb = bring about]',
      exampleQ: 'The new policy will ___ (affect/effect) everyone; its ___ (affect/effect) will be felt soon.',
      exampleA: 'affect; effect.',
    },
  ],
  tricks: [
    {
      id: 't-va-sp-1',
      title: 'Contraction test',
      trick: 'If you can expand it to "it is / you are / they are / who is", write it\'s / you\'re / they\'re / who\'s. Otherwise use its / your / their / whose.',
      whenToUse: 'Apostrophe confusables.',
    },
    {
      id: 't-va-sp-2',
      title: 'Verb–noun collocation grid',
      trick: 'MAKE: decision, mistake, effort, progress, noise. DO: homework, business, harm, a favour, research. TAKE: photo, break, exam, responsibility. Learn as sets, not single pairs.',
      whenToUse: 'Sentence-improvement options that swap make/do/take.',
    },
  ],
  howToSolve: [
    {
      id: 'h-va-sp-1',
      step: 'Step 1: Decide whether the question is spelling, meaning or pairing',
      detail: 'Spelling → apply the rule (ie/ei, doubling, silent e). Meaning → part of speech and definition. Pairing → recall the collocation set.',
      questionType: 'All',
    },
    {
      id: 'h-va-sp-2',
      step: 'Step 2: Eliminate by rule, then by sound',
      detail: 'For spelling, syllable-by-syllable pronunciation catches missing letters (en-vi-ron-ment). For confusables, substitute the definition into the sentence.',
      questionType: 'All',
    },
    {
      id: 'h-va-sp-3',
      step: 'Step 3: Read the final sentence for naturalness',
      detail: 'If the collocation sounds unusual (a strong rain), it is probably wrong even if grammatical.',
      questionType: 'Collocation / improvement',
    },
  ],
})

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4 — PARAGRAPH & PASSAGE SKILLS
// ─────────────────────────────────────────────────────────────────────────────

const M4 = 'Module 4: Paragraph & Passage Skills'

const vaParaJumbles = topic({
  id: 'va-para-jumbles',
  subjectId: S,
  title: 'Para-Jumbles (Sentence Rearrangement)',
  moduleNumber: 4,
  moduleName: M4,
  order: 11,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-va-pj-01', 'q-va-pj-02'],
  subtopicDetails: subs('va-para-jumbles', [
    [
      'Finding the opening sentence',
      'The opener introduces the topic with a full noun (not a pronoun), usually a general statement, definition or time-setting sentence. It rarely starts with a connector (however, but, therefore), a pronoun (he, this, they), or a definite reference (the above).',
    ],
    [
      'Mandatory pairs via pronouns and connectors',
      'A sentence with "he/she/it/they/this/these/such" must follow the sentence that names the antecedent. "However/but" follows a sentence it contrasts; "therefore/thus" follows a cause; "for example" follows a general claim.',
    ],
    [
      'Chronology and cause-effect ordering',
      'Time markers (first, then, later, in 1990, finally) and logical markers (because, as a result) fix relative order. Process descriptions run in sequence; arguments run claim → support → conclusion.',
    ],
    [
      'Article and noun-phrase clues',
      '"A company" introduces; "the company" refers back. A full name (Ratan Tata) precedes a shortened one (Tata). A general term (a technology) precedes a specific one (this software).',
    ],
    [
      'Working with the options',
      'Identify one sure pair (or the opener), then eliminate options that violate it. Usually one or two options remain; check the closing sentence — it often summarises, concludes or looks ahead.',
    ],
  ]),
  explanationMd: `# Para-Jumbles

### Do not try to order all sentences at once
Find **one certain link** and use it against the options. Most questions collapse after a single mandatory pair.

### Spotting the opener
Look for the sentence that:
- introduces the topic with a **full noun phrase** (*The Indian IT industry…*), not a pronoun
- makes a **general** statement or gives a definition or setting
- does **not** begin with *however, but, therefore, also, this, these, he, they, such*

### Mandatory pairs
- **Pronoun → antecedent**: *It was founded in 1968* must follow a sentence naming the company.
- **Connector logic**: *However* follows a contrasting idea; *therefore* follows a cause; *for instance* follows a claim; *moreover* follows a point it adds to.
- **Article shift**: *a* introduces, *the* refers back.
- **Full name → short name**: *Dr. A. P. J. Abdul Kalam* precedes *Kalam*.
- **General → specific**: *a device* before *the smartphone*.

### Time and logic order
Dates and sequence words (*initially, later, eventually*) fix order. Arguments go claim → evidence → conclusion; narratives go setting → event → outcome.

### The closer
Often a summary (*Thus…*, *In short…*), a consequence, or a forward-looking remark. If two options share the same first four sentences and differ only in the last, check which sentence sounds like an ending.

### Using options
1. Decide the opener (or a mandatory pair).
2. Strike out every option that contradicts it.
3. For the survivors, test the next link.
4. Read the winning order once, quickly, for flow.

### Traps
- A sentence starting with *The* can still be the opener if *the* refers to something universal (*The sun…*).
- Two sentences may both look like openers; the more general one wins.
- Do not spend more than 90 seconds; the options make the answer, not a full reconstruction.`,
  formulas: [
    {
      id: 'f-va-pj-1',
      label: 'Link rules',
      formula: 'Pronoun follows its noun;   a → the;   general → specific;   full name → short name;   claim → example → conclusion',
      exampleQ: 'Sentences: (P) It employs over 300,000 people. (Q) Infosys was founded in 1981. (R) Today it is a global brand. Order?',
      exampleA: 'Q (names the company) → P (it) → R (today, concluding).',
    },
    {
      id: 'f-va-pj-2',
      label: 'Connector direction',
      formula: 'however / but ← contrast;   therefore / thus ← cause;   for example ← general claim;   moreover ← prior point',
      exampleQ: 'Which sentence cannot be the opener: (A) "However, the plan failed." (B) "The government announced a new plan."',
      exampleA: '(A) — "However" needs something to contrast with.',
    },
  ],
  tricks: [
    {
      id: 't-va-pj-1',
      title: 'Option elimination beats reconstruction',
      trick: 'With four options, one sure pair (e.g. "Q must precede P") typically kills two or three of them. Find the pair, then read the survivors.',
      whenToUse: 'Every para-jumble.',
    },
    {
      id: 't-va-pj-2',
      title: 'Last-sentence check',
      trick: 'If options agree on the start but differ at the end, pick the closer that concludes or generalises rather than the one that introduces a new detail.',
      whenToUse: 'Options differing only in the final position.',
    },
  ],
  howToSolve: [
    {
      id: 'h-va-pj-1',
      step: 'Step 1: Read all sentences once; mark pronouns, connectors and time words',
      detail: 'Circle he/it/this/these/however/therefore/first/later. These are the links.',
      questionType: 'Para-jumble',
    },
    {
      id: 'h-va-pj-2',
      step: 'Step 2: Fix the opener or one mandatory pair and eliminate options',
      detail: 'Cross out options that break the pair or start with a non-opener.',
      questionType: 'Para-jumble',
    },
    {
      id: 'h-va-pj-3',
      step: 'Step 3: Test the remaining options on the next link and read the winner',
      detail: 'A final quick read should feel like a coherent paragraph; if not, recheck the pair you relied on.',
      questionType: 'Para-jumble',
    },
  ],
})

const vaSentenceCompletion = topic({
  id: 'va-sentence-completion-para-completion',
  subjectId: S,
  title: 'Sentence Completion & Paragraph Completion',
  moduleNumber: 4,
  moduleName: M4,
  order: 12,
  difficulty: 'core',
  examFrequency: 'high',
  featuredQuestionIds: ['q-va-scp-01', 'q-va-scp-02'],
  subtopicDetails: subs('va-sentence-completion-para-completion', [
    [
      'Sentence completion',
      'A sentence with a missing clause or phrase; options complete it. The completion must match the grammar (tense, structure) and the logic (cause, contrast, purpose) set up by the given part. Connectors in the stem dictate the direction.',
    ],
    [
      'Paragraph completion (missing sentence)',
      'A paragraph with a blank at the beginning, middle or end. The missing sentence must connect the idea before and after the gap. At the end, it should conclude; at the start, introduce; in the middle, bridge.',
    ],
    [
      'Scope and tone consistency',
      'The correct option stays within the paragraph\'s subject and keeps its tone (formal/informal, positive/critical). Options that introduce an unrelated idea, a new example not developed later, or a contradictory view are wrong.',
    ],
    [
      'Grammatical fit',
      'Check that the option continues the sentence correctly: parallel structure after "not only ... but also", correct tense after "if", a clause after "although", a noun after "despite".',
    ],
    [
      'Elimination by extremity',
      'Options with absolutes ("always", "never", "all") or a sharper claim than the passage supports are usually wrong. Prefer the option whose strength matches the surrounding sentences.',
    ],
  ]),
  explanationMd: `# Sentence & Paragraph Completion

### Sentence completion
The stem hands you two things: **grammar** (what structure must follow) and **logic** (which direction the thought goes). Read the stem, predict the shape of the ending, then compare options.

- *Although the results were promising, …* → expect a reservation (*the sample was too small*).
- *Because the roads were flooded, …* → expect a consequence (*the match was postponed*).
- *Not only did she win the debate, …* → expect *but she also…*
- *Unless we act now, …* → expect a negative outcome.

Eliminate options that (a) break grammar, (b) go the wrong logical direction, (c) shift the topic.

### Paragraph completion
Locate the blank:
- **Start**: needs a topic sentence that the rest elaborates. It should be general and introduce the key noun.
- **Middle**: needs a bridge that refers back to the sentence before and sets up the one after. Look for a pronoun or connector that fits both sides.
- **End**: needs a conclusion, consequence or forward look. It should not introduce brand-new information.

### Consistency checks
1. **Scope** — same subject as the paragraph; no new characters or themes.
2. **Tone** — a critical paragraph does not end with unearned praise.
3. **Strength** — the claim should be as strong as the evidence given, no stronger.
4. **Grammar** — pronouns must have antecedents; tense should match.

### Traps
- The option that repeats a phrase from the paragraph is attractive but often merely restates; check whether it *advances* the paragraph.
- Extreme words (*always, completely, never*) rarely appear in the correct option.
- For end-blanks, an option that opens a new question ("But what about…?") is usually wrong unless the paragraph is clearly leading there.`,
  formulas: [
    {
      id: 'f-va-scp-1',
      label: 'Connector direction',
      formula: 'although / despite → reservation;   because / since → consequence;   unless → negative outcome;   not only … → but also …',
      exampleQ: 'Complete: "Although the product was priced higher than its rivals, ___."',
      exampleA: 'A contrasting positive: "it outsold them within a year."',
    },
    {
      id: 'f-va-scp-2',
      label: 'Blank-position role',
      formula: 'Start → introduce;   middle → bridge (refer back + set up);   end → conclude / consequence',
      exampleQ: 'A paragraph about rising fuel prices ends with a blank. Which fits: (a) "Consequently, commuters are shifting to public transport." (b) "Fuel is extracted from crude oil."',
      exampleA: '(a) — a consequence that closes the idea; (b) is background information.',
    },
  ],
  tricks: [
    {
      id: 't-va-scp-1',
      title: 'Predict, then match',
      trick: 'Say the missing idea in your own words before reading options. The option closest to your prediction is usually right; ones that surprise you deserve suspicion.',
      whenToUse: 'Both sentence and paragraph completion.',
    },
    {
      id: 't-va-scp-2',
      title: 'Two-sided fit for middle blanks',
      trick: 'Read the sentence before and after the blank together with each option. The right one makes all three read as one flow.',
      whenToUse: 'Mid-paragraph blanks.',
    },
  ],
  howToSolve: [
    {
      id: 'h-va-scp-1',
      step: 'Step 1: Read the stem or paragraph and mark the logical direction',
      detail: 'Underline connectors and the main claim. Decide whether the blank continues, contrasts, causes or concludes.',
      questionType: 'All completion questions',
    },
    {
      id: 'h-va-scp-2',
      step: 'Step 2: Eliminate by grammar, direction and scope',
      detail: 'Cross out options that do not fit the structure, go the wrong way, or introduce new topics.',
      questionType: 'All',
    },
    {
      id: 'h-va-scp-3',
      step: 'Step 3: Insert the finalist and read for flow and strength',
      detail: 'The claim strength must match the passage. Prefer moderate, specific options over sweeping ones.',
      questionType: 'All',
    },
  ],
})

const vaReadingComprehension = topic({
  id: 'va-reading-comprehension',
  subjectId: S,
  title: 'Reading Comprehension',
  moduleNumber: 4,
  moduleName: M4,
  order: 13,
  difficulty: 'core',
  examFrequency: 'very_high',
  featuredQuestionIds: ['q-va-rc-01', 'q-va-rc-02'],
  subtopicDetails: subs('va-reading-comprehension', [
    [
      'Reading strategy: skim, map, then answer',
      'Read the first and last sentence of each paragraph to build a map of the passage (topic → argument → conclusion). Then read questions and return to the relevant paragraph for detail. Do not memorise the passage; know where things are.',
    ],
    [
      'Main idea and title questions',
      'The main idea is what the whole passage is about, stated at the level of the entire text — not a detail from one paragraph. Options that are too narrow (one example) or too broad (the whole field) are wrong. Titles must capture the central point and tone.',
    ],
    [
      'Detail and fact questions',
      'Locate the exact line. The correct option paraphrases the text; wrong options twist a detail, swap cause and effect, or use words from the passage in a different meaning. Beware of options that are true in general but not stated.',
    ],
    [
      'Inference questions',
      'An inference is a conclusion the author would agree with, supported by the text but not stated. Stay close to the passage; the correct inference is usually modest. Extreme or far-reaching options are traps.',
    ],
    [
      'Vocabulary in context and tone',
      'For "the word X most nearly means", substitute each option into the sentence — the passage decides, not the dictionary. Tone words: objective, critical, optimistic, sceptical, nostalgic, ironic, analytical. Identify tone from adjectives and evaluative verbs the author uses.',
    ],
    [
      'Author\'s purpose and structure',
      'Why did the author write this — to inform, argue, compare, refute, describe? How is it organised — problem/solution, chronological, cause/effect, comparison? Questions about "the function of paragraph 3" ask what the paragraph does for the argument, not what it says.',
    ],
  ]),
  explanationMd: `# Reading Comprehension

### Read for structure, not for memory
Placement passages are 300-600 words with 4-6 questions. The efficient method:
1. **Skim** the first sentence of every paragraph and the last sentence of the passage. You now know the topic, the stance, and where each sub-point lives.
2. **Read the questions.** Note which are main-idea, which are detail, which are inference.
3. **Return** to the passage for each detail question; answer main-idea and tone questions from your map plus one quick full read if needed.

### Question types and how to beat them
**Main idea / title** — must cover the whole passage. Reject options that describe only one paragraph (too narrow) or the entire subject area (too broad). The title should reflect both topic and attitude.

**Detail** — find the line; the right option is a **paraphrase**. Wrong options reuse the passage's words with a twist: a reversed cause, a changed quantity, an added "only" or "always".

**Inference** — what must be true given the text. Correct inferences are small steps; if an option requires a leap or outside knowledge, drop it.

**Vocabulary in context** — plug each option into the sentence. A common word may be used in an uncommon sense (*sanction* as approval vs penalty).

**Tone / attitude** — look at the author's evaluative language: *unfortunately, remarkably, merely, so-called* signal attitude. Common answers: analytical, critical, sceptical, appreciative, neutral/objective, cautionary.

**Purpose / function** — *why* a paragraph exists: to give an example, to counter an objection, to define a term, to transition. Answer in terms of the argument's needs.

### Elimination habits
- Cross out options with **extreme** words unless the passage is equally extreme.
- Cross out options that are **true but not in the passage**.
- Cross out options that answer a **different question** (e.g. give a cause when an effect is asked).

### Time
Budget about 1.5 minutes per question including reading. If a passage is dense, answer the detail questions (fast, locatable) before the inference ones.

### Traps
- "According to the passage" means *stated*; "it can be inferred" means *implied*. Do not mix them.
- The first option that "sounds right" is often the too-narrow one.
- Negative questions (*Which of the following is NOT mentioned?*) — verify three options are present, the fourth is the answer.`,
  formulas: [
    {
      id: 'f-va-rc-1',
      label: 'Main-idea test',
      formula: 'Correct option = covers every paragraph, matches the author\'s stance, not just one example',
      exampleQ: 'A passage discusses three reasons why remote work increases productivity and one caveat. Which is the best main idea: (a) Remote work has one drawback. (b) Remote work largely boosts productivity despite a limitation. (c) Technology has changed offices.',
      exampleA: '(b) — covers the reasons and the caveat; (a) is too narrow, (c) too broad.',
    },
    {
      id: 'f-va-rc-2',
      label: 'Inference boundary',
      formula: 'Valid inference = follows necessarily from stated facts; needs no outside knowledge; modest in strength',
      exampleQ: 'Passage: "Sales fell in every quarter after the price rise." Which can be inferred: (a) The price rise caused the fall. (b) Sales did not increase after the price rise.',
      exampleA: '(b) — directly supported. (a) assumes causation the passage does not state.',
    },
  ],
  tricks: [
    {
      id: 't-va-rc-1',
      title: 'Paraphrase, not echo',
      trick: 'The correct detail option usually rephrases the passage. An option that copies a distinctive phrase word-for-word is often a trap with one altered element.',
      whenToUse: 'Detail questions.',
    },
    {
      id: 't-va-rc-2',
      title: 'Answer detail questions first',
      trick: 'They are quick and locatable; doing them first also deepens your understanding for the main-idea and tone questions.',
      whenToUse: 'Passages with mixed question types.',
    },
  ],
  howToSolve: [
    {
      id: 'h-va-rc-1',
      step: 'Step 1: Skim for the passage map',
      detail: 'First sentence of each paragraph + last sentence overall. Write a 3-word label per paragraph in the margin.',
      questionType: 'All RC',
    },
    {
      id: 'h-va-rc-2',
      step: 'Step 2: Classify each question and locate its source',
      detail: 'Detail → go to the line. Inference → the surrounding two sentences. Main idea / tone → the map plus the conclusion.',
      questionType: 'All RC',
    },
    {
      id: 'h-va-rc-3',
      step: 'Step 3: Eliminate extremes, out-of-scope and word-twist options',
      detail: 'Keep the option that is supported, moderate and answers the question actually asked.',
      questionType: 'All RC',
    },
  ],
})

const vaWrittenCommunication = topic({
  id: 'va-email-essay-writing',
  subjectId: S,
  title: 'Email Writing & Essay / Situational Writing',
  moduleNumber: 4,
  moduleName: M4,
  order: 14,
  difficulty: 'core',
  examFrequency: 'high',
  featuredQuestionIds: ['q-va-ew-01', 'q-va-ew-02'],
  subtopicDetails: subs('va-email-essay-writing', [
    [
      'Email format for placement tests',
      'Salutation (Dear Sir/Madam or Dear Mr Sharma) → purpose in the first line → 2-3 short body paragraphs → clear request or next step → closing (Regards / Sincerely) → name. Use all the given keywords/phrases in the order they appear when the test requires it (TCS format).',
    ],
    [
      'Tone and register',
      'Formal, polite, direct. No slang, no contractions (write "do not", not "don\'t") in formal tests, no emotional language. Use "would/could/kindly/please" for requests; avoid "ASAP", "u", emojis.',
    ],
    [
      'Common email scenarios',
      'Requesting leave, apologising for a delay, reporting a problem to a manager, following up on an application, thanking an interviewer, informing a client of a schedule change, asking for information. Each has a fixed opening line pattern.',
    ],
    [
      'Essay structure (Infosys / Wipro / AMCAT WriteX style)',
      'Introduction (state the topic and your position in 2-3 lines) → 2-3 body paragraphs (one idea each, with an example) → conclusion (restate position, suggest a way forward). 150-250 words; aim for clarity over vocabulary display.',
    ],
    [
      'Grammar and mechanics under time pressure',
      'Short sentences beat long ones. Check subject-verb agreement, tense consistency, capitalisation (I, proper nouns, sentence starts), and spelling of the keywords given. Leave one minute to proofread.',
    ],
    [
      'Automated scoring cues',
      'Tools score on word count within range, use of all keywords, sentence variety, absence of grammar/spelling errors, and coherence (connectors). Do not pad; do not repeat the prompt verbatim; do not exceed the limit.',
    ],
  ]),
  explanationMd: `# Email Writing & Essay Writing

### Why this matters
TCS NQT includes an email-writing task; Infosys, Wipro and AMCAT include a short essay. Both are usually machine-scored on structure, keyword use, grammar and length — which means a disciplined template scores well.

### Formal email template
\`\`\`
Dear <Sir/Madam | Mr/Ms Surname>,

<Purpose in one sentence — why you are writing.>

<Context or details in 2-3 sentences. Use the given phrases in order.>

<Request / next step / offer of help in 1-2 sentences.>

Thank you for your time and consideration.

Regards,
<Your name>
\`\`\`

Rules:
- **Subject line** if asked (*Request for Leave – 12 to 14 March*).
- **First sentence states the purpose**: *I am writing to inform you that…* / *I would like to request…* / *Please accept my apologies for…*
- **One idea per paragraph**, 2-3 sentences each.
- **Polite verbs**: *would, could, kindly, please, appreciate*.
- **No contractions or slang** in formal tests.
- **Close with a clear action** (*Kindly confirm by Friday.*).
- Use **all mandatory keywords** exactly as given, in the sequence provided.

### Openers by scenario
- Leave: *I am writing to request leave from … to … on account of …*
- Apology: *Please accept my sincere apologies for the delay in …*
- Follow-up: *I am writing to follow up on my application for … submitted on …*
- Problem report: *I would like to bring to your attention an issue with …*
- Thanks: *Thank you for taking the time to interview me for the … role on …*

### Essay template (150-250 words)
1. **Introduction** (2-3 lines): define the topic, state your stand.
2. **Body 1**: first reason + example.
3. **Body 2**: second reason + example (or the counter-view and why it is weaker).
4. **Conclusion** (2-3 lines): restate the stand, suggest a way forward.

Connectors to show coherence: *firstly, secondly, moreover, however, for instance, as a result, in conclusion*.

### Mechanics checklist (last 60 seconds)
- Every sentence has a subject and a verb and ends with a full stop.
- Tense is consistent (present for general essays, past for narratives).
- Capital *I*; capitalised names and sentence starts.
- Keywords spelled exactly as in the prompt.
- Word count within range.

### Traps
- Writing the whole email as one paragraph.
- Skipping the salutation or sign-off (automated checkers penalise this).
- Using *Respected Sir* with *Yours faithfully* mismatches — *Dear Sir/Madam* pairs with *Yours faithfully*; *Dear Mr Sharma* pairs with *Yours sincerely*; *Regards* works for both in most tests.`,
  formulas: [
    {
      id: 'f-va-ew-1',
      label: 'Email skeleton',
      formula: 'Salutation → Purpose (1 line) → Details (2-3 lines) → Request/next step → Thanks → Sign-off + name',
      exampleQ: 'Write the opening two lines of an email to your manager requesting two days\' leave for a family function.',
      exampleA: '"Dear Ms Rao, I am writing to request leave on 21 and 22 March to attend a family function in Mysuru."',
    },
    {
      id: 'f-va-ew-2',
      label: 'Essay skeleton',
      formula: 'Intro (stand) → Body 1 (reason + example) → Body 2 (reason/counter + example) → Conclusion (restate + way forward)',
      exampleQ: 'Topic: "Should attendance be compulsory in college?" Give a one-line thesis.',
      exampleA: '"Attendance should be encouraged through engaging teaching rather than enforced, because compulsion secures presence but not learning."',
    },
  ],
  tricks: [
    {
      id: 't-va-ew-1',
      title: 'Keywords as a checklist',
      trick: 'Before writing, number the given keywords/phrases. Tick each as you use it. A missing keyword can cost more than a grammar slip.',
      whenToUse: 'TCS-style email tasks with mandatory phrases.',
    },
    {
      id: 't-va-ew-2',
      title: 'Short sentences, zero risk',
      trick: 'Under time pressure, write 10-15-word sentences. Fewer clauses mean fewer agreement and punctuation errors for the scorer to find.',
      whenToUse: 'All timed writing.',
    },
  ],
  howToSolve: [
    {
      id: 'h-va-ew-1',
      step: 'Step 1: Read the prompt twice; list the scenario, recipient, keywords and word limit',
      detail: 'Decide the salutation and sign-off pair, and the purpose sentence, before typing anything.',
      questionType: 'Email / essay',
    },
    {
      id: 'h-va-ew-2',
      step: 'Step 2: Write to the template, one idea per paragraph',
      detail: 'Insert keywords in order. Keep sentences short and formal. Stay within the word range.',
      questionType: 'Email / essay',
    },
    {
      id: 'h-va-ew-3',
      step: 'Step 3: Proofread for the mechanics checklist',
      detail: 'Agreement, tense, capitals, spelling of keywords, salutation/sign-off present. Fix, then submit.',
      questionType: 'Email / essay',
    },
  ],
})

export const VERBAL_TOPICS: PrepTopic[] = [
  vaPartsOfSpeech,
  vaTenses,
  vaAgreement,
  vaSentenceStructure,
  vaErrorSpotting,
  vaSentenceCorrection,
  vaFillBlanks,
  vaSynAnt,
  vaIdioms,
  vaSpellingConfusables,
  vaParaJumbles,
  vaSentenceCompletion,
  vaReadingComprehension,
  vaWrittenCommunication,
]

export const VERBAL_QUESTIONS: UniversalQuestion[] = [
  mcq({ id: 'q-va-pos-01', subjectId: S, topicId: 'va-parts-of-speech-articles-prepositions', difficulty: 'basic',
    q: 'Choose the correct article: "She is ___ MBA graduate from ___ university in Bengaluru."',
    options: ['a, a', 'an, a', 'an, an', 'a, an'], answer: 1,
    why: '"MBA" starts with a vowel sound (em), so "an"; "university" starts with a consonant sound (yu), so "a".' }),
  mcq({ id: 'q-va-pos-02', subjectId: S, topicId: 'va-parts-of-speech-articles-prepositions', difficulty: 'basic',
    q: 'Fill in: "He has been working here ___ 2019, ___ almost six years."',
    options: ['for, since', 'since, for', 'from, since', 'since, from'], answer: 1,
    why: '"Since" takes a point in time (2019); "for" takes a duration (six years).' }),
  mcq({ id: 'q-va-tn-01', subjectId: S, topicId: 'va-tenses-verbs',
    q: 'Choose the correct sentence.',
    options: ['If it will rain, we will cancel the match.', 'If it rains, we will cancel the match.', 'If it rained, we will cancel the match.', 'If it rains, we would cancel the match.'], answer: 1,
    why: 'Type-1 conditional: if + present simple, main clause with "will".' }),
  mcq({ id: 'q-va-tn-02', subjectId: S, topicId: 'va-tenses-verbs',
    q: 'Select the correct verb form: "By the time we reached the station, the train ___."',
    options: ['left', 'has left', 'had left', 'was leaving'], answer: 2,
    why: 'Two past actions; the earlier one (train leaving) takes the past perfect.' }),
  mcq({ id: 'q-va-sva-01', subjectId: S, topicId: 'va-subject-verb-agreement-pronouns', difficulty: 'basic',
    q: 'Choose the correct verb: "The quality of these mangoes ___ excellent."',
    options: ['are', 'is', 'were', 'have been'], answer: 1,
    why: 'The subject is "quality" (singular); "of these mangoes" is an intervening phrase.' }),
  mcq({ id: 'q-va-sva-02', subjectId: S, topicId: 'va-subject-verb-agreement-pronouns',
    q: 'Choose the correct sentence.',
    options: ['Neither the teacher nor the students was present.', 'Neither the teacher nor the students were present.', 'Neither the teachers nor the student were present.', 'Neither the teacher or the students were present.'], answer: 1,
    why: 'With "neither…nor", the verb agrees with the nearer subject ("students" → were).' }),
  mcq({ id: 'q-va-ss-01', subjectId: S, topicId: 'va-sentence-structure-voice-speech',
    q: 'Change to passive voice: "The committee will announce the results tomorrow."',
    options: ['The results will announce by the committee tomorrow.', 'The results will be announced by the committee tomorrow.', 'The results are announced by the committee tomorrow.', 'The results would be announced by the committee tomorrow.'], answer: 1,
    why: 'Future simple passive: will + be + past participle.' }),
  mcq({ id: 'q-va-ss-02', subjectId: S, topicId: 'va-sentence-structure-voice-speech',
    q: 'Report the speech: She said, "I will call you tomorrow."',
    options: ['She said that she will call me tomorrow.', 'She said that she would call me the next day.', 'She said that she would call you tomorrow.', 'She told that she will call me the next day.'], answer: 1,
    why: 'Backshift "will" → "would", "you" → "me", "tomorrow" → "the next day".' }),
  mcq({ id: 'q-va-es-01', subjectId: S, topicId: 'va-error-spotting',
    q: 'Spot the error: "Of the two proposals (A) / submitted last week, (B) / the second is the best. (C) / No error (D)"',
    options: ['A', 'B', 'C', 'D'], answer: 2,
    why: 'Only two items are compared, so the comparative "better" is required, not "best".' }),
  mcq({ id: 'q-va-es-02', subjectId: S, topicId: 'va-error-spotting',
    q: 'Spot the error: "There were less students (A) / in the classroom today (B) / than yesterday. (C) / No error (D)"',
    options: ['A', 'B', 'C', 'D'], answer: 0,
    why: '"Students" is countable, so "fewer" is correct, not "less".' }),
  mcq({ id: 'q-va-sc-01', subjectId: S, topicId: 'va-sentence-correction-improvement',
    q: 'Improve the underlined part: "He is one of the student who has topped the exam."',
    options: ['students who have', 'students who has', 'student who have', 'No improvement'], answer: 0,
    why: '"One of the" takes a plural noun, and "who" refers to "students", so the verb is "have".' }),
  mcq({ id: 'q-va-sc-02', subjectId: S, topicId: 'va-sentence-correction-improvement',
    q: 'Improve: "No sooner had the bell rung when the students rushed out."',
    options: ['than the students rushed out', 'then the students rushed out', 'that the students rushed out', 'No improvement'], answer: 0,
    why: '"No sooner" pairs with "than".' }),
  mcq({ id: 'q-va-fb-01', subjectId: S, topicId: 'va-fill-in-the-blanks-cloze',
    q: 'Fill in: "___ the heavy rain, the match continued without interruption."',
    options: ['Although', 'Despite', 'Because of', 'Even'], answer: 1,
    why: 'A contrast is needed before a noun phrase: "Despite" + noun. "Although" needs a clause.' }),
  mcq({ id: 'q-va-fb-02', subjectId: S, topicId: 'va-fill-in-the-blanks-cloze',
    q: 'Fill in both blanks: "Although the plot was ___, the acting was ___."',
    options: ['gripping, superb', 'predictable, superb', 'predictable, dull', 'original, weak'], answer: 1,
    why: '"Although" signals contrast: a negative word for the plot and a positive word for the acting.' }),
  mcq({ id: 'q-va-sa-01', subjectId: S, topicId: 'va-synonyms-antonyms', difficulty: 'basic',
    q: 'Choose the word closest in meaning to METICULOUS.',
    options: ['careless', 'thorough', 'hasty', 'generous'], answer: 1,
    why: 'Meticulous means showing great attention to detail — thorough.' }),
  mcq({ id: 'q-va-sa-02', subjectId: S, topicId: 'va-synonyms-antonyms', difficulty: 'basic',
    q: 'Choose the antonym of FRUGAL.',
    options: ['careful', 'extravagant', 'poor', 'modest'], answer: 1,
    why: 'Frugal means economical; extravagant is its opposite.' }),
  mcq({ id: 'q-va-id-01', subjectId: S, topicId: 'va-idioms-phrases-one-word',
    q: 'What does the idiom "a blessing in disguise" mean?',
    options: ['A hidden danger', 'A misfortune that turns out to be beneficial', 'A gift that is not wanted', 'A secret plan'], answer: 1,
    why: 'Something that seemed bad at first but proved to be good.' }),
  mcq({ id: 'q-va-id-02', subjectId: S, topicId: 'va-idioms-phrases-one-word',
    q: 'One word for "a person who can use both hands equally well":',
    options: ['Ambivalent', 'Ambidextrous', 'Amphibious', 'Ambiguous'], answer: 1,
    why: 'Ambi (both) + dexter (right hand / skilful) → ambidextrous.' }),
  mcq({ id: 'q-va-sp-01', subjectId: S, topicId: 'va-spelling-confusables-collocations', difficulty: 'basic',
    q: 'Choose the correctly spelt word.',
    options: ['Accomodate', 'Acommodate', 'Accommodate', 'Accomoddate'], answer: 2,
    why: 'Double c and double m: accommodate.' }),
  mcq({ id: 'q-va-sp-02', subjectId: S, topicId: 'va-spelling-confusables-collocations', difficulty: 'basic',
    q: 'Fill in: "The new policy will ___ everyone, and its ___ will be felt soon."',
    options: ['effect, affect', 'affect, effect', 'affect, affect', 'effect, effect'], answer: 1,
    why: '"Affect" is the verb (to influence); "effect" is the noun (result).' }),
  mcq({ id: 'q-va-pj-01', subjectId: S, topicId: 'va-para-jumbles',
    q: 'Arrange: (P) It employs over 300,000 people worldwide. (Q) Infosys was founded in 1981 by seven engineers. (R) Today it is one of India\'s best-known global brands.',
    options: ['PQR', 'QPR', 'RQP', 'QRP'], answer: 1,
    why: 'Q names the company (opener), P uses "it" (follows Q), R concludes with "today".' }),
  mcq({ id: 'q-va-pj-02', subjectId: S, topicId: 'va-para-jumbles',
    q: 'Which sentence is least likely to be the opening sentence of a paragraph?',
    options: ['The Indian IT industry grew rapidly in the 1990s.', 'However, this growth was uneven across states.', 'Bengaluru became a major technology hub.', 'Software exports are a key part of India\'s economy.'], answer: 1,
    why: '"However" needs a preceding idea to contrast with, so it cannot open the paragraph.' }),
  mcq({ id: 'q-va-scp-01', subjectId: S, topicId: 'va-sentence-completion-para-completion',
    q: 'Complete: "Although the product was priced higher than its rivals, ___."',
    options: ['it failed to attract buyers', 'it outsold them within a year', 'it was cheaper to manufacture', 'the company reduced its price'], answer: 1,
    why: '"Although" sets up a contrast with the high price — an unexpectedly positive outcome.' }),
  mcq({ id: 'q-va-scp-02', subjectId: S, topicId: 'va-sentence-completion-para-completion',
    q: 'A paragraph describes rising fuel prices and ends with a blank. Which sentence best completes it?',
    options: ['Fuel is extracted from crude oil.', 'Consequently, many commuters are shifting to public transport.', 'The first petrol pump opened in 1905.', 'Cars come in many colours.'], answer: 1,
    why: 'An ending should give a consequence or conclusion that follows from the paragraph\'s idea.' }),
  mcq({ id: 'q-va-rc-01', subjectId: S, topicId: 'va-reading-comprehension',
    q: 'A passage gives three reasons remote work raises productivity and notes one drawback. The best statement of its main idea is:',
    options: ['Remote work has one drawback.', 'Remote work largely boosts productivity despite a limitation.', 'Technology has changed offices.', 'Employees prefer working from home.'], answer: 1,
    why: 'It covers all the reasons and the caveat; the others are too narrow, too broad or unstated.' }),
  mcq({ id: 'q-va-rc-02', subjectId: S, topicId: 'va-reading-comprehension',
    q: 'Passage: "Sales fell in every quarter after the price rise." Which can be inferred?',
    options: ['The price rise caused the fall in sales.', 'Sales did not rise in any quarter after the price rise.', 'The company will reduce prices.', 'Competitors gained market share.'], answer: 1,
    why: 'Only (b) follows necessarily; (a) assumes causation, (c) and (d) are not supported.' }),
  mcq({ id: 'q-va-ew-01', subjectId: S, topicId: 'va-email-essay-writing',
    q: 'Which is the most appropriate opening line for a formal email requesting leave?',
    options: ['Hey, I need a couple of days off next week.', 'I am writing to request leave on 21 and 22 March to attend a family function.', 'Gimme leave on 21st and 22nd pls.', 'As you know I never take leave, so I want two days now.'], answer: 1,
    why: 'Formal, states the purpose in the first line, specific dates, no slang or contractions.' }),
  mcq({ id: 'q-va-ew-02', subjectId: S, topicId: 'va-email-essay-writing',
    q: 'Which salutation and sign-off pair is conventionally correct in a formal letter?',
    options: ['Dear Sir/Madam … Yours sincerely', 'Dear Mr Sharma … Yours faithfully', 'Dear Sir/Madam … Yours faithfully', 'Hi Sharma … Regards'], answer: 2,
    why: 'Unknown recipient ("Dear Sir/Madam") pairs with "Yours faithfully"; a named recipient pairs with "Yours sincerely".' }),
]
