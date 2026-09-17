// functions/src/data/baSeedData.ts
//
// Complete BA Curriculum (Undergraduate — Semesters 1 to 4, Karnataka Region)
// Majors covered: Economics and Business Communication / Media Studies under the
// Karnataka State Higher Education Council (KSHEC) NEP 2020 / CBCS four-year
// honours model adopted by Bangalore University (BU), Bengaluru City University
// (BCU), Bengaluru North University (BNU), Mysore University (UOM), Mangalore
// University, Karnatak University Dharwad (KUD), Tumkur and Kuvempu Universities.
//
// Structure:
// 8 Core Subjects across Semesters 1 through 4 (2 subjects per semester)
// Subject > 5 Modules / Topics > Granular Subtopics
//
// Shares the exact PrepInsta content contract used by bbaSeedData.ts:
//   PrepSubject[]  +  Record<subjectId, PrepTopic[]>  +  UniversalQuestion[]

import { PrepSubject, PrepTopic, UniversalQuestion } from '../prepShared'

const PUBLISHED_AT = '2026-09-17T12:00:00.000Z'
const SYLLABUS = (sem: number) => `KSHEC NEP BA Sem-${sem} / BU, BCU, BNU, UOM, Mangalore, KUD`

export const BA_SUBJECTS: PrepSubject[] = [
  // ══════════════════════════════════════════════════════════════════════
  // SEMESTER 1 (FOUNDATIONS — MICROECONOMICS & COMMUNICATION)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'ba-karnataka-microeconomics',
    name: 'Microeconomics',
    stream: 'economics',
    programs: ['ba', 'bcom', 'bba'],
    degreeLevel: 'undergraduate',
    yearGroup: '1st-year',
    semester: 1,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(1),
    icon: 'TrendingUp',
    order: 1,
    topicCount: 5,
    status: 'published',
    description:
      'Demand, supply and elasticity, consumer behaviour with indifference analysis, production and cost theory, market structures from perfect competition to monopoly, and factor pricing with welfare economics.',
  },
  {
    id: 'ba-karnataka-business-communication',
    name: 'Business Communication',
    stream: 'communication',
    programs: ['ba', 'bba', 'bcom'],
    degreeLevel: 'undergraduate',
    yearGroup: '1st-year',
    semester: 1,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(1),
    icon: 'MessageSquare',
    order: 2,
    topicCount: 5,
    status: 'published',
    description:
      'The communication process and barriers, written business correspondence, report and proposal writing, oral communication and presentations, and cross-cultural, digital and non-verbal communication.',
  },

  // ══════════════════════════════════════════════════════════════════════
  // SEMESTER 2 (AGGREGATES & MEDIA)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'ba-karnataka-macroeconomics',
    name: 'Macroeconomics',
    stream: 'economics',
    programs: ['ba', 'bcom'],
    degreeLevel: 'undergraduate',
    yearGroup: '1st-year',
    semester: 2,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(2),
    icon: 'LineChart',
    order: 3,
    topicCount: 5,
    status: 'published',
    description:
      'National income accounting, consumption saving and the multiplier, money banking and monetary policy, the IS-LM and AD-AS models, and inflation, unemployment and the Phillips curve.',
  },
  {
    id: 'ba-karnataka-media-studies',
    name: 'Media Studies & Mass Communication',
    stream: 'communication',
    programs: ['ba'],
    degreeLevel: 'undergraduate',
    yearGroup: '1st-year',
    semester: 2,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(2),
    icon: 'Radio',
    order: 4,
    topicCount: 5,
    status: 'published',
    description:
      'Mass communication theories, print broadcast and digital media in India, media law ethics and regulators, advertising public relations and media planning, and new media with misinformation and platform analytics.',
  },

  // ══════════════════════════════════════════════════════════════════════
  // SEMESTER 3 (PUBLIC SECTOR & GLOBAL ECONOMY)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'ba-karnataka-public-finance',
    name: 'Public Finance',
    stream: 'economics',
    programs: ['ba', 'bcom'],
    degreeLevel: 'undergraduate',
    yearGroup: '2nd-year',
    semester: 3,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(3),
    icon: 'Landmark',
    order: 5,
    topicCount: 5,
    status: 'published',
    description:
      'Public revenue and taxation principles, public expenditure and fiscal deficits, public debt management, budgeting and fiscal federalism including GST, and the Indian direct and indirect tax system.',
  },
  {
    id: 'ba-karnataka-intl-trade',
    name: 'International Trade & Finance',
    stream: 'economics',
    programs: ['ba', 'bcom', 'bba'],
    degreeLevel: 'undergraduate',
    yearGroup: '2nd-year',
    semester: 3,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(3),
    icon: 'Globe2',
    order: 6,
    topicCount: 5,
    status: 'published',
    description:
      'Classical and modern trade theories, tariffs quotas and policy instruments, the balance of payments, exchange rate determination and forex markets, and the WTO with regional blocs and India\u2019s trade position.',
  },

  // ══════════════════════════════════════════════════════════════════════
  // SEMESTER 4 (DEVELOPMENT & THE INDIAN ECONOMY)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'ba-karnataka-development-econ',
    name: 'Development Economics',
    stream: 'economics',
    programs: ['ba'],
    degreeLevel: 'undergraduate',
    yearGroup: '2nd-year',
    semester: 4,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(4),
    icon: 'Sprout',
    order: 7,
    topicCount: 5,
    status: 'published',
    description:
      'Concepts and measurement of development including HDI, poverty and inequality measurement, population and human capital, agriculture industry and structural transformation, and sustainable development with the SDGs.',
  },
  {
    id: 'ba-karnataka-indian-economy',
    name: 'Indian Economy: NEP, Liberalisation & Structural Change',
    stream: 'economics',
    programs: ['ba', 'bcom'],
    degreeLevel: 'undergraduate',
    yearGroup: '2nd-year',
    semester: 4,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(4),
    icon: 'Building2',
    order: 8,
    topicCount: 5,
    status: 'published',
    description:
      'The economy at independence and the planning era, the 1991 liberalisation and LPG reforms, NEP 2020 in education and the skill economy, banking and Digital India, and contemporary issues of GST, inflation and employment.',
  },
]

export const SEEDED_BA_TOPICS: Record<string, PrepTopic[]> = {
  // ── 1. Microeconomics (Sem 1) ──
  'ba-karnataka-microeconomics': [
    {
      id: 'micro-mod1-demand-elasticity',
      subjectId: 'ba-karnataka-microeconomics',
      title: 'Demand, Supply, Equilibrium & Elasticity',
      moduleNumber: 1,
      moduleName: 'Module 1: Demand and Supply Analysis',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-micro-mod1-01', 'q-micro-mod1-02'],
      subtopics: [
        'Law of demand, the demand schedule and the demand curve',
        'Determinants of demand and the distinction between movement along and shift of the curve',
        'Law of supply and market equilibrium with excess demand and supply',
        'Types of elasticity: price, income and cross elasticity',
        'Measurement of price elasticity and its relationship to total revenue',
      ],
      explanationMd: `# Demand, Supply & Elasticity

### Demand and Supply
The **law of demand** states that, other things equal, quantity demanded falls as price rises — the demand curve slopes downward because of the income effect, the substitution effect and diminishing marginal utility. The **law of supply** gives an upward-sloping curve. Equilibrium occurs where the two intersect; any deviation creates excess demand or excess supply that pushes price back.

A crucial distinction: a **change in price** causes movement *along* the demand curve, while a change in income, tastes, prices of related goods or expectations **shifts** the entire curve.

### Elasticity
**Price elasticity of demand** measures responsiveness:

e = (% change in quantity demanded) / (% change in price)

Measurement methods include the percentage (or proportionate) method, the total outlay method and the point and arc methods.

### Elasticity and Revenue
- e > 1 (elastic): a price cut **raises** total revenue.
- e < 1 (inelastic): a price cut **lowers** total revenue.
- e = 1 (unitary): revenue is unchanged and at its maximum.

This relationship is why firms with inelastic demand (medicines, fuel) raise prices confidently, while firms facing elastic demand compete on price.

**Income elasticity** classifies goods as normal (positive) or inferior (negative); **cross elasticity** classifies them as substitutes (positive) or complements (negative).`,
      formulas: [
        {
          id: 'formula-micro-1',
          label: 'Price Elasticity of Demand',
          formula: 'e = (delta Q / Q) / (delta P / P) = (delta Q / delta P) x (P / Q)',
          exampleQ:
            'Price rises from Rs 10 to Rs 12 and quantity demanded falls from 100 to 80 units. Compute the elasticity.',
          exampleA:
            'delta Q / Q = -20/100 = -0.20. delta P / P = 2/10 = 0.20. e = -0.20 / 0.20 = -1, i.e. unitary elastic. Total revenue is unchanged at Rs 1,000 before and Rs 960 after — the small fall reflects the mid-point convention.',
        },
      ],
      tricks: [
        {
          id: 'trick-micro-1',
          title: 'Shift vs Movement',
          trick:
            'Price change = MOVEMENT along the curve. Anything else (income, tastes, related prices, expectations) = SHIFT of the curve. Examiners test this wording specifically, and it is worth stating explicitly.',
          whenToUse: 'All demand and supply diagram questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-micro-1',
          step: 'Step 1: Identify Which Variable Changed',
          detail:
            'Determine whether the change is in the good\u2019s own price (movement) or in a determinant (shift), because this decides how the diagram is drawn.',
          questionType: 'Demand and Supply Analysis',
        },
        {
          id: 'solve-micro-2',
          step: 'Step 2: Compute Elasticity and Interpret for Revenue',
          detail:
            'Apply the elasticity formula, classify as elastic, inelastic or unitary, and state the implication for total revenue.',
          questionType: 'Elasticity Numerical',
        },
      ],
    },
    {
      id: 'micro-mod2-consumer-behaviour',
      subjectId: 'ba-karnataka-microeconomics',
      title: 'Consumer Behaviour: Utility & Indifference Analysis',
      moduleNumber: 2,
      moduleName: 'Module 2: Consumer Behaviour',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-micro-mod2-01', 'q-micro-mod2-02'],
      subtopics: [
        'Cardinal utility, total and marginal utility and the law of diminishing marginal utility',
        "Marshall's consumer surplus and its measurement",
        'Ordinal utility and indifference curve properties',
        'The budget line and consumer equilibrium',
        'Income and substitution effects, and derivation of the demand curve',
      ],
      explanationMd: `# Consumer Behaviour

### Cardinal Utility (Marshall)
Utility is measurable in utils. **Total utility** rises with consumption but at a diminishing rate; **marginal utility** falls, reaching zero at the point of satiety and then becoming negative. The **law of diminishing marginal utility** is the basis of the downward-sloping demand curve.

For one commodity, equilibrium requires MU = price. For two commodities, the consumer equalises the marginal utility per rupee:

MU_x / P_x = MU_y / P_y

**Consumer surplus** is the excess of what a consumer was willing to pay over what they actually paid — the area between the demand curve and the price line.

### Ordinal Utility (Hicks and Allen)
Indifference curves rank bundles without measuring utility. Their properties:
1. Downward sloping (more of one good requires less of the other for equal satisfaction).
2. Convex to the origin (diminishing marginal rate of substitution).
3. Non-intersecting (transitivity of preferences).
4. Higher curves represent greater satisfaction.

### Consumer Equilibrium
The **budget line** shows affordable combinations given income and prices. Equilibrium occurs where the budget line is tangent to the highest attainable indifference curve, so that:

MRS_xy = P_x / P_y

### Decomposition
A price fall can be split into a **substitution effect** (always positive — the good becomes relatively cheaper) and an **income effect** (positive for normal goods, negative for inferior goods). For a **Giffen good** the negative income effect outweighs the substitution effect, producing an upward-sloping demand curve.`,
      formulas: [
        {
          id: 'formula-micro-2',
          label: 'Consumer Equilibrium (Two Goods)',
          formula: 'MU_x / P_x = MU_y / P_y, equivalently MRS_xy = P_x / P_y',
          exampleQ:
            'MU_x = 20, P_x = Rs 4; MU_y = 30, P_y = Rs 5. Is the consumer in equilibrium?',
          exampleA:
            'MU_x / P_x = 5 and MU_y / P_y = 6. Since they differ, the consumer should shift expenditure toward y, which yields more utility per rupee, until the two ratios equalise.',
        },
      ],
      tricks: [
        {
          id: 'trick-micro-2',
          title: 'Compare Utility PER RUPEE, Not Total Utility',
          trick:
            'Equilibrium equalises marginal utility per rupee spent, not marginal utility itself. Students who compare MU_x with MU_y directly get the wrong answer whenever prices differ.',
          whenToUse: 'Consumer equilibrium problems.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-micro-3',
          step: 'Step 1: Compute Marginal Utility Per Rupee for Each Good',
          detail:
            'Divide each marginal utility by the corresponding price and compare the ratios to determine whether reallocation would increase satisfaction.',
          questionType: 'Consumer Equilibrium Problem',
        },
        {
          id: 'solve-micro-4',
          step: 'Step 2: Draw the Budget Line and Indifference Map',
          detail:
            'Plot the budget line from income and prices, draw the indifference curves, and identify the tangency point as the equilibrium bundle.',
          questionType: 'Indifference Curve Diagram',
        },
      ],
    },
    {
      id: 'micro-mod3-production-cost',
      subjectId: 'ba-karnataka-microeconomics',
      title: 'Production, Returns to Scale & Cost Curves',
      moduleNumber: 3,
      moduleName: 'Module 3: Production and Cost',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-micro-mod3-01', 'q-micro-mod3-02'],
      subtopics: [
        'Production function, total, average and marginal product',
        'Law of variable proportions and the three stages of production',
        'Returns to scale: increasing, constant and decreasing',
        'Short-run cost curves: fixed, variable, average and marginal',
        'Long-run average cost, economies of scale and the envelope curve',
      ],
      explanationMd: `# Production & Cost

### The Production Function
Output depends on inputs. In the **short run** at least one input (usually capital) is fixed; in the **long run** all inputs vary.

**Total product (TP)** rises, reaches a maximum, then falls. **Marginal product (MP)** is the addition to TP from one more unit of the variable input; **average product (AP)** is TP divided by input. Key relationships:
- MP cuts AP at AP's maximum.
- TP is at its maximum where MP = 0.
- TP's point of inflection is where MP peaks.

### Law of Variable Proportions
As more of a variable input is added to a fixed input, MP first rises (increasing returns), then falls but stays positive (diminishing returns), then becomes negative (negative returns). Rational firms operate only in **stage II**, where MP is positive but falling and AP exceeds MP.

### Returns to Scale
In the long run, doubling all inputs produces increasing, constant or decreasing returns to scale. Economies of scale arise from specialisation, bulk purchasing and financing advantages; diseconomies from coordination failures and bureaucracy.

### Cost Curves
- **Fixed cost** is independent of output; **variable cost** rises with it.
- **MC** cuts both **AVC** and **AC** at their minimum points.
- **AC** is U-shaped in the short run, reflecting first increasing then diminishing returns.

### Long-Run Average Cost
The **LRAC** is the **envelope** of all possible short-run average cost curves and is typically U-shaped or L-shaped. Its downward slope reflects economies of scale and its upward slope diseconomies.`,
      formulas: [
        {
          id: 'formula-micro-3',
          label: 'Marginal and Average Product',
          formula: 'MP = delta TP / delta L; AP = TP / L',
          exampleQ:
            'Total product rises from 100 to 118 units when labour increases from 10 to 12 workers. Compute the marginal product of labour.',
          exampleA: 'MP = (118 - 100) / (12 - 10) = 18 / 2 = 9 units per worker.',
        },
      ],
      tricks: [
        {
          id: 'trick-micro-3',
          title: 'MC Crosses AC and AVC at Their Minimums',
          trick:
            'Draw MC first: it intersects AVC and AC exactly at their lowest points. Getting this crossing wrong distorts the entire cost diagram, which carries most of the marks.',
          whenToUse: 'All cost curve diagram questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-micro-5',
          step: 'Step 1: Build the Product Schedule',
          detail:
            'Tabulate labour, TP, MP and AP, then identify the stages by locating where MP peaks, where MP equals AP and where MP reaches zero.',
          questionType: 'Production Schedule Problem',
        },
        {
          id: 'solve-micro-6',
          step: 'Step 2: Derive the Cost Curves and Explain Their Shapes',
          detail:
            'Convert the product schedule into costs, draw MC, AVC and AC, and explain the U shape by reference to increasing and diminishing returns.',
          questionType: 'Cost Curve Derivation',
        },
      ],
    },
    {
      id: 'micro-mod4-market-structures',
      subjectId: 'ba-karnataka-microeconomics',
      title: 'Market Structures: Perfect Competition, Monopoly & Imperfect Markets',
      moduleNumber: 4,
      moduleName: 'Module 4: Market Structures and Pricing',
      order: 4,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-micro-mod4-01', 'q-micro-mod4-02'],
      subtopics: [
        'Features of perfect competition and the price-taking assumption',
        'Short-run and long-run equilibrium of a competitive firm',
        'Monopoly: sources, price discrimination and welfare loss',
        'Monopolistic competition and product differentiation',
        'Oligopoly, the kinked demand curve and price rigidity',
      ],
      explanationMd: `# Market Structures

### Perfect Competition
Characterised by many buyers and sellers, a homogeneous product, free entry and exit, perfect information and no single agent able to influence price. The firm is a **price taker**, so its demand curve is horizontal and:

Price = Average Revenue = Marginal Revenue

Profit maximisation requires **MR = MC** with MC rising. In the short run the firm may earn supernormal profit, break even or make a loss; it continues producing while price covers average variable cost. In the long run, free entry and exit drive economic profit to zero — firms earn only normal profit.

### Monopoly
A single seller with no close substitutes and barriers to entry (legal, technical, or economies of scale). The monopolist faces the downward-sloping market demand curve, so MR lies below AR. Setting MR = MC and charging the corresponding price yields supernormal profit even in the long run, and creates a **deadweight loss** relative to the competitive outcome.

**Price discrimination** — charging different prices to different buyers — requires market segmentation and no resale. First-degree discrimination captures the entire consumer surplus; third-degree is the common practice of different pricing for students, seniors and businesses.

### Monopolistic Competition
Many sellers of **differentiated** products with free entry. Short-run supernormal profits attract entry, shifting each firm's demand curve left until it is tangent to AC — so firms earn normal profit in the long run but operate with **excess capacity**.

### Oligopoly
A few interdependent firms. The **kinked demand curve** model explains price rigidity: rivals match price cuts but not price rises, giving a kinked demand curve and a discontinuous marginal revenue curve, so costs can change without altering price.`,
      formulas: [
        {
          id: 'formula-micro-4',
          label: 'Profit Maximisation Condition',
          formula: 'MR = MC, with the MC curve rising at the point of intersection',
          exampleQ:
            'A monopolist faces MR = 100 - 4Q and MC = 20 + 2Q. Find the profit-maximising output.',
          exampleA:
            'Setting 100 - 4Q = 20 + 2Q gives 6Q = 80, so Q = 13.33 units. Since the MC slope (2) exceeds the MR slope in absolute terms, MC is rising and the second-order condition is satisfied.',
        },
      ],
      tricks: [
        {
          id: 'trick-micro-4',
          title: 'Shut Down Only Below AVC',
          trick:
            'A competitive firm keeps producing at a loss in the short run as long as price covers average VARIABLE cost, because it still contributes to fixed costs. Comparing price with AC instead of AVC is the classic error.',
          whenToUse: 'Short-run competitive equilibrium questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-micro-7',
          step: 'Step 1: Identify the Market Structure From Its Features',
          detail:
            'Check the number of sellers, product homogeneity and entry conditions, because these determine the shape of the demand and marginal revenue curves.',
          questionType: 'Market Structure Analysis',
        },
        {
          id: 'solve-micro-8',
          step: 'Step 2: Apply MR = MC and Determine Profit',
          detail:
            'Solve for output, read the price from the demand curve, and compute profit as (P - AC) x Q, commenting on whether it persists in the long run.',
          questionType: 'Market Structure Analysis',
        },
      ],
    },
    {
      id: 'micro-mod5-factor-pricing',
      subjectId: 'ba-karnataka-microeconomics',
      title: 'Factor Pricing, Rent, Wages, Interest & Welfare Economics',
      moduleNumber: 5,
      moduleName: 'Module 5: Distribution and Welfare',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-micro-mod5-01', 'q-micro-mod5-02'],
      subtopics: [
        'Marginal productivity theory of distribution',
        "Ricardian theory of rent and quasi-rent",
        'Modern theory of wages and collective bargaining',
        'Theories of interest and profit',
        "Pareto optimality, the first and second welfare theorems and market failure",
      ],
      explanationMd: `# Factor Pricing & Welfare Economics

### Marginal Productivity Theory
Each factor is paid the value of its marginal product. A profit-maximising firm hires labour until the **value of marginal product (VMP = MP x P)** equals the wage. The theory explains functional distribution but is criticised for assuming perfect competition and for treating factors as homogeneous.

### Rent
**Ricardian rent** is the payment to land arising from differences in fertility and location — the surplus of superior land over the marginal (no-rent) land. Rent is price-determined, not price-determining. **Quasi-rent** is the short-run return to fixed factors such as machinery, which disappears in the long run when supply can adjust.

### Wages
Wages are determined by the intersection of labour demand (derived from the demand for the product) and labour supply. Modern analysis emphasises **collective bargaining**, minimum wage legislation and efficiency wage considerations.

### Interest and Profit
Interest is the reward for postponing consumption (time preference), for bearing risk and for the productivity of capital. Profit is variously explained as the reward for innovation (Schumpeter), for risk bearing (Knight) or as a temporary monopoly return.

### Welfare Economics
**Pareto optimality** is a state where no one can be made better off without making someone worse off. The **first welfare theorem** states that competitive equilibrium is Pareto efficient; the **second** states that any Pareto-efficient allocation can be achieved by a competitive equilibrium with suitable lump-sum transfers.

**Market failure** — where these results break down — arises from public goods, externalities, monopoly power and asymmetric information, and justifies government intervention.`,
      formulas: [
        {
          id: 'formula-micro-5',
          label: 'Optimal Factor Hiring Condition',
          formula: 'VMP = MP x Product Price = Factor Price (wage)',
          exampleQ:
            'The marginal product of labour is 8 units and the product sells for Rs 15. What is the maximum wage a firm should pay?',
          exampleA:
            'VMP = 8 x 15 = Rs 120. The firm should hire labour up to the point where the wage equals Rs 120; beyond that the worker adds less to revenue than to cost.',
        },
      ],
      tricks: [
        {
          id: 'trick-micro-5',
          title: 'Rent Is Price-Determined',
          trick:
            'Ricardian rent is a consequence of price, not a cause of it — corn is not expensive because rent is high; rent is high because corn is expensive. This reversed causality is the standard examination point.',
          whenToUse: 'Rent and distribution theory questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-micro-9',
          step: 'Step 1: Compute the Value of Marginal Product',
          detail:
            'Multiply the marginal product by the product price to obtain the revenue contribution of the last unit of the factor.',
          questionType: 'Factor Pricing Numerical',
        },
        {
          id: 'solve-micro-10',
          step: 'Step 2: Compare With the Factor Price and Conclude',
          detail:
            'If VMP exceeds the factor price, hire more; if it is less, hire fewer. State the equilibrium condition and the resulting employment level.',
          questionType: 'Factor Pricing Numerical',
        },
      ],
    },
  ],

  // ── 2. Business Communication (Sem 1) ──
  'ba-karnataka-business-communication': [
    {
      id: 'bc-mod1-process-barriers',
      subjectId: 'ba-karnataka-business-communication',
      title: 'The Communication Process, Models & Barriers',
      moduleNumber: 1,
      moduleName: 'Module 1: Foundations of Communication',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-bc-mod1-01', 'q-bc-mod1-02'],
      subtopics: [
        'Definition, importance and the seven Cs of effective communication',
        'The communication process: sender, encoding, channel, decoding, receiver and feedback',
        'Shannon-Weaver and Berlo\u2019s SMCR models',
        'Types: verbal, non-verbal, formal, informal and the grapevine',
        'Barriers: semantic, psychological, organisational, physical and cross-cultural',
      ],
      explanationMd: `# The Communication Process

### The Seven Cs
Effective business communication should be **Clear** (unambiguous purpose), **Concise** (no padding), **Concrete** (specific facts and figures), **Correct** (accurate and grammatical), **Coherent** (logically ordered), **Complete** (all necessary information) and **Courteous** (respectful in tone).

### The Process
Communication is a cycle, not a one-way transmission:
1. The **sender** conceives an idea.
2. **Encoding** converts it into words, symbols or gestures.
3. The **channel** carries the message — and its choice matters, since a complex negotiation fails over a text message.
4. The **receiver decodes** it, filtered through their own experience and expectations.
5. **Feedback** completes the loop, confirming whether the intended meaning was received.

**Noise** — anything distorting the message — can enter at any stage.

### Models
The **Shannon-Weaver model** treats communication as information transmission with a noise source, originally for telecommunications. **Berlo's SMCR model** adds the human dimension: Source, Message, Channel and Receiver, each with skills, attitudes, knowledge and culture affecting the outcome.

### The Grapevine
Informal communication is faster than formal channels and often more believed, but is prone to distortion. Managers should monitor rather than suppress it, correcting misinformation at source.

### Barriers
- **Semantic**: jargon, ambiguity, poor translation.
- **Psychological**: premature evaluation, defensiveness, selective perception.
- **Organisational**: rigid hierarchy, excessive levels, poor information policy.
- **Physical**: distance, noise, poor equipment.
- **Cross-cultural**: differing norms around directness, silence and hierarchy.`,
      formulas: [
        {
          id: 'formula-bc-1',
          label: 'The Seven Cs of Effective Communication',
          formula: 'Clear + Concise + Concrete + Correct + Coherent + Complete + Courteous',
          exampleQ:
            'A manager emails "Pls do the needful ASAP re the thing we discussed." Which of the seven Cs are violated?',
          exampleA:
            'Clear (no specific action identified), Concrete (no figures, dates or references) and Complete (no deadline, context or recipient of the follow-up). The message also fails Correct if the register is inappropriate.',
        },
      ],
      tricks: [
        {
          id: 'trick-bc-1',
          title: 'No Feedback Means No Communication',
          trick:
            'Communication is only complete when feedback confirms understanding. In any case question, if the scenario lacks feedback, name it as the primary defect — examiners look for this specifically.',
          whenToUse: 'Communication case analysis.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-bc-1',
          step: 'Step 1: Map the Scenario Onto the Process Stages',
          detail:
            'Identify the sender, the encoding choices, the channel used, the decoding assumptions and whether feedback occurred.',
          questionType: 'Communication Case Study',
        },
        {
          id: 'solve-bc-2',
          step: 'Step 2: Diagnose the Barrier and Prescribe the Fix',
          detail:
            'Classify the barrier by type, then recommend a specific remedy such as a richer channel, plain language, or a structured feedback mechanism.',
          questionType: 'Communication Case Study',
        },
      ],
    },
    {
      id: 'bc-mod2-written-correspondence',
      subjectId: 'ba-karnataka-business-communication',
      title: 'Written Correspondence: Letters, Emails & Memoranda',
      moduleNumber: 2,
      moduleName: 'Module 2: Written Business Communication',
      order: 2,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-bc-mod2-01', 'q-bc-mod2-02'],
      subtopics: [
        'Parts of a business letter and the block, semi-block and indented layouts',
        'Sales, collection, adjustment and claim letters',
        'Email etiquette, subject lines and professional tone',
        'Memoranda, circulars and notices',
        'Positive, negative and persuasive message strategies',
      ],
      explanationMd: `# Written Correspondence

### Structure of a Business Letter
A formal letter comprises: letterhead, date, inside address, salutation, subject line, body, complimentary close, signature block and any enclosures. The three standard layouts are:
- **Block**: everything left-aligned — the modern default.
- **Semi-block**: body paragraphs indented, everything else left-aligned.
- **Indented**: date, close and signature progressively indented.

### Message Strategies
- **Positive (good news) messages** use a **direct** approach: state the good news first, give details, then close warmly.
- **Negative (bad news) messages** use an **indirect** approach: buffer, then reasons, then the refusal stated positively, then a constructive alternative. This preserves the relationship.
- **Persuasive messages** follow the **AIDA** structure — Attention, Interest, Desire, Action.

### Sales and Collection Letters
A sales letter must open with a reader-centred appeal rather than a company introduction. **Collection letters** escalate through a sequence: reminder, enquiry, appeal, and finally an ultimatum — the tone hardens progressively while remaining professional.

### Email Etiquette
The subject line should be specific and searchable. Keep the message short, use paragraphs and bullets, avoid ALL CAPS (read as shouting), reply-all only when everyone needs the response, and never send in anger. Attachments should be named descriptively and referenced in the body.

### Memoranda and Circulars
A **memorandum** is internal, omitting the salutation and complimentary close. A **circular** broadcasts the same information to many recipients. A **notice** is a formal announcement displayed publicly.`,
      formulas: [
        {
          id: 'formula-bc-2',
          label: 'AIDA Structure for Persuasive Messages',
          formula: 'Attention → Interest → Desire → Action',
          exampleQ:
            'Identify the AIDA stage in this opening: "Every month your team loses 40 hours to manual invoicing."',
          exampleA:
            'This is the ATTENTION stage: it opens with a specific, quantified problem the reader recognises, rather than with a company introduction, which is the classic mistake in sales letters.',
        },
      ],
      tricks: [
        {
          id: 'trick-bc-2',
          title: 'Bad News Needs a Buffer First',
          trick:
            'Never open a negative message with the refusal. Open with a neutral or positive buffer, explain the reasons, THEN state the refusal, and close with an alternative. Reversing this order costs marks and damages relationships.',
          whenToUse: 'Writing negative or refusal letters.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-bc-3',
          step: 'Step 1: Classify the Message Type and Choose the Approach',
          detail:
            'Decide whether the message is positive, negative or persuasive, and select the direct or indirect approach accordingly.',
          questionType: 'Business Letter Drafting',
        },
        {
          id: 'solve-bc-4',
          step: 'Step 2: Draft in the Correct Format With All Parts',
          detail:
            'Include every structural element — date, addresses, salutation, subject, body, close, signature — and apply the reader-centred tone appropriate to the situation.',
          questionType: 'Business Letter Drafting',
        },
      ],
    },
    {
      id: 'bc-mod3-report-writing',
      subjectId: 'ba-karnataka-business-communication',
      title: 'Report & Proposal Writing',
      moduleNumber: 3,
      moduleName: 'Module 3: Reports and Proposals',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-bc-mod3-01', 'q-bc-mod3-02'],
      subtopics: [
        'Purpose and classification of reports: informational, analytical and recommendation',
        'Formal report structure: front matter, body and back matter',
        'The executive summary versus the introduction',
        'Proposal structure, problem statement and cost-benefit justification',
        'Presentation of data: tables, charts and citation practice',
      ],
      explanationMd: `# Report & Proposal Writing

### Classification
- **Informational reports** present facts without analysis (sales figures, attendance).
- **Analytical reports** interpret data to reach conclusions (market analysis).
- **Recommendation reports** go further and propose action, requiring a clear cost-benefit case.

### Structure of a Formal Report
**Front matter**: title page, transmittal letter, table of contents, list of illustrations, and the executive summary.
**Body**: introduction (problem, scope, methodology), findings, analysis, conclusions and recommendations.
**Back matter**: appendices, glossary, references and index.

### Executive Summary
The executive summary is a standalone document — a busy decision maker may read nothing else. It must state the purpose, the key findings, the conclusions and the recommendations in one to two pages. It is **not** an introduction, which merely previews the report's structure.

### Proposal Writing
A persuasive proposal requires: a precise **problem statement** (quantified wherever possible), the proposed **solution** and methodology, **qualifications** establishing credibility, a realistic **timeline**, a transparent **budget**, and the **benefits** expressed in the reader's terms. The strongest proposals quantify the return on the requested investment.

### Presenting Data
Tables should be numbered, titled and sourced; charts should be chosen to match the data type — line charts for trends over time, bar charts for comparison, pie charts for parts of a whole (and only with few categories). Every exhibit must be referenced and interpreted in the text, never left to speak for itself.`,
      formulas: [
        {
          id: 'formula-bc-3',
          label: 'Formal Report Structure',
          formula: 'Front matter (title, transmittal, contents, summary) → Body (intro, findings, analysis, conclusions, recommendations) → Back matter (appendices, references)',
          exampleQ:
            'A report opens with a section summarising the problem, the method, the three key findings and the recommended course of action in one page. What is this section called?',
          exampleA:
            'The executive summary. Unlike an introduction, which previews structure, it condenses the entire report including findings and recommendations so a reader can act on it alone.',
        },
      ],
      tricks: [
        {
          id: 'trick-bc-3',
          title: 'Every Chart Needs a Sentence of Interpretation',
          trick:
            'An exhibit with no accompanying interpretation earns no marks. Always write one sentence stating what the reader should conclude from the table or chart.',
          whenToUse: 'Report writing and data presentation questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-bc-5',
          step: 'Step 1: Determine the Report Type and Its Required Sections',
          detail:
            'Establish whether the report is informational, analytical or a recommendation report, since this determines whether conclusions and recommendations are required.',
          questionType: 'Report Writing Task',
        },
        {
          id: 'solve-bc-6',
          step: 'Step 2: Structure, Draft and Support Every Claim',
          detail:
            'Organise in the standard sequence, keep findings separate from analysis, and support every conclusion with cited evidence before stating the recommendation.',
          questionType: 'Report Writing Task',
        },
      ],
    },
    {
      id: 'bc-mod4-oral-communication',
      subjectId: 'ba-karnataka-business-communication',
      title: 'Oral Communication, Presentations & Meetings',
      moduleNumber: 4,
      moduleName: 'Module 4: Oral Communication',
      order: 4,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-bc-mod4-01', 'q-bc-mod4-02'],
      subtopics: [
        'Advantages and limitations of oral versus written communication',
        'Presentation planning: audience analysis, objective and structure',
        'Delivery skills: voice modulation, eye contact, body language and visual aids',
        'Handling questions, objections and hostile audiences',
        'Conducting meetings: agenda, minutes, chairing skills and group discussion',
      ],
      explanationMd: `# Oral Communication

### Oral versus Written
Oral communication is faster, allows immediate feedback, and conveys tone and emotion — ideal for negotiation, persuasion and sensitive conversations. Its limitations are the absence of a permanent record, greater risk of distortion and no time for considered revision. Written communication is precise, verifiable and permanent but slower and feedback-delayed.

### Planning a Presentation
1. **Analyse the audience**: their knowledge level, expectations and decision authority.
2. **Define one clear objective** — what should the audience do or believe afterwards?
3. **Structure**: introduction (hook and roadmap), body (three key points with evidence), conclusion (summary and call to action).

Research consistently shows audiences retain most from the beginning and end of a talk, so the strongest material belongs there.

### Delivery
- **Voice**: vary pace, pitch and volume; use pauses deliberately.
- **Eye contact**: hold individuals for a full thought, sweeping the whole room.
- **Body language**: open posture, purposeful movement, no crossed arms or pacing.
- **Visual aids**: one idea per slide, minimal text, large legible type, and never read from the slide.

### Handling Questions
Listen fully, repeat or paraphrase the question for the room, answer concisely, and check that the asker is satisfied. If you do not know, say so and commit to following up. Hostile questions should be answered calmly and redirected to the substance.

### Meetings
A meeting requires a circulated **agenda** with timed items, a chair who keeps to it, and **minutes** recording decisions, actions, owners and deadlines — not a transcript. Group discussion assesses reasoning, listening, leadership and the ability to build on others' contributions.`,
      formulas: [
        {
          id: 'formula-bc-4',
          label: 'Presentation Structure',
          formula: 'Introduction (hook + roadmap) → Body (3 key points with evidence) → Conclusion (summary + call to action)',
          exampleQ:
            'A presenter spends 15 of 20 minutes on background before reaching the recommendation. What structural principle is violated?',
          exampleA:
            'The call to action must be delivered while attention is high, not exhausted. Since retention peaks at the start and end, the recommendation belongs early or must be restated firmly in the conclusion.',
        },
      ],
      tricks: [
        {
          id: 'trick-bc-4',
          title: 'One Idea Per Slide, Never Read It',
          trick:
            'Slides are visual support, not a script. If the audience can read your slide faster than you speak it, the slide is redundant. Put the detail in the handout.',
          whenToUse: 'Presentation design questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-bc-7',
          step: 'Step 1: Analyse the Audience and Fix the Objective',
          detail:
            'Establish who the listeners are, what they already know, and the single behavioural or belief change the presentation should produce.',
          questionType: 'Presentation Planning Task',
        },
        {
          id: 'solve-bc-8',
          step: 'Step 2: Structure the Content and Plan the Delivery',
          detail:
            'Sequence the three key points, allocate time with the strongest material at the start and end, and specify the delivery and visual aid choices.',
          questionType: 'Presentation Planning Task',
        },
      ],
    },
    {
      id: 'bc-mod5-cross-cultural',
      subjectId: 'ba-karnataka-business-communication',
      title: 'Cross-Cultural, Non-Verbal & Digital Communication',
      moduleNumber: 5,
      moduleName: 'Module 5: Contemporary Communication Contexts',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-bc-mod5-01', 'q-bc-mod5-02'],
      subtopics: [
        "Hofstede's cultural dimensions and their communication implications",
        'High-context versus low-context cultures (Hall)',
        'Non-verbal communication: kinesics, proxemics, paralanguage and haptics',
        'Digital and virtual communication: netiquette, video calls and asynchronous channels',
        'Inclusive, gender-sensitive and accessible communication in Indian workplaces',
      ],
      explanationMd: `# Cross-Cultural, Non-Verbal & Digital Communication

### Hofstede's Dimensions
1. **Power distance**: acceptance of unequal power. High power distance cultures (India, much of Asia) expect formal address and hierarchical deference; low power distance cultures (Scandinavia) favour informality.
2. **Individualism versus collectivism**: the priority given to personal versus group goals — central to negotiation and incentive design.
3. **Masculinity versus femininity**: competitiveness versus consensus and quality of life.
4. **Uncertainty avoidance**: tolerance for ambiguity; high uncertainty avoidance cultures prefer detailed written rules.
5. **Long-term orientation**: persistence and thrift versus respect for tradition.
6. **Indulgence versus restraint**.

### High-Context versus Low-Context (Hall)
In **high-context** cultures (Japan, India, Arab states) meaning is carried by relationships, setting and what is left unsaid; directness can seem rude. In **low-context** cultures (Germany, the United States) meaning is carried explicitly in the words; indirectness can seem evasive. Most cross-cultural misunderstanding arises here.

### Non-Verbal Communication
- **Kinesics**: body movement, gestures, facial expression. Gestures are not universal — a nod does not mean yes everywhere.
- **Proxemics**: use of space. Comfortable conversational distance varies substantially across cultures.
- **Paralanguage**: tone, pitch, pace, pause — often conveying more than the words.
- **Haptics**: touch, governed by strong cultural norms.

Studies consistently attribute the majority of emotional meaning to non-verbal channels, though exact percentages are frequently overstated in popular accounts.

### Digital Communication
**Netiquette** governs tone in text, where the absence of facial and vocal cues raises misinterpretation risk. Video calls require attention to framing, mute discipline and time zones. Asynchronous channels (email, shared documents) suit complex or global teams; synchronous channels suit relationship-building and conflict resolution.

### Inclusive Communication
Effective Indian workplace communication is multilingual and gender-sensitive: avoiding idioms that exclude non-native speakers, using person-first language, providing accessible formats, and ensuring meeting practices give equal voice across hierarchy.`,
      formulas: [
        {
          id: 'formula-bc-5',
          label: "Hofstede's Six Cultural Dimensions",
          formula: 'Power Distance + Individualism + Masculinity + Uncertainty Avoidance + Long-Term Orientation + Indulgence',
          exampleQ:
            'A German manager sends a blunt written list of faults to a Japanese team and receives silence. Which cultural dimensions explain the reaction?',
          exampleA:
            'Low-context versus high-context communication (direct written criticism reads as harsh in a high-context culture) combined with high uncertainty avoidance and collectivist concern for group face, which suppresses open disagreement.',
        },
      ],
      tricks: [
        {
          id: 'trick-bc-5',
          title: 'Context Level Explains Most Misunderstanding',
          trick:
            'When a cross-cultural case goes wrong, check the high-context/low-context gap first. It explains more real business friction than any other single dimension.',
          whenToUse: 'Cross-cultural communication case studies.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-bc-9',
          step: 'Step 1: Identify the Cultural Variables at Play',
          detail:
            'Diagnose the power distance, context level and individualism of each party before judging the interaction.',
          questionType: 'Cross-Cultural Case Study',
        },
        {
          id: 'solve-bc-10',
          step: 'Step 2: Recommend Adapted Communication Practices',
          detail:
            'Propose specific adjustments to channel, formality and directness, and explain how each addresses the identified cultural gap.',
          questionType: 'Cross-Cultural Case Study',
        },
      ],
    },
  ],

  // ── 3. Macroeconomics (Sem 2) ──
  'ba-karnataka-macroeconomics': [
    {
      id: 'macro-mod1-national-income',
      subjectId: 'ba-karnataka-macroeconomics',
      title: 'National Income: Concepts, Measurement & Circular Flow',
      moduleNumber: 1,
      moduleName: 'Module 1: National Income Accounting',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-macro-mod1-01', 'q-macro-mod1-02'],
      subtopics: [
        'GDP, GNP, NDP, NNP at market and factor cost',
        'Personal income, disposable income and per capita income',
        'Real versus nominal income and the GDP deflator',
        'The three methods of measurement: product, income and expenditure',
        'Circular flow of income in two, three and four sector economies',
      ],
      explanationMd: `# National Income Accounting

### The Key Aggregates
- **GDP**: market value of all final goods and services produced within a country's borders in a year, regardless of who owns the factors.
- **GNP**: GDP plus net factor income from abroad — the output of a nation's residents wherever located.
- **NDP / NNP**: net of depreciation.
- **Market price versus factor cost**: GNP at factor cost = GNP at market price - net indirect taxes (indirect taxes less subsidies).

**Personal income** is national income less undistributed profits, corporate tax and social security contributions, plus transfer payments. **Disposable income** is personal income less direct taxes — the amount households can actually spend or save.

### Real versus Nominal
**Nominal GDP** uses current prices and therefore rises with inflation. **Real GDP** uses base-year prices and measures genuine output growth. The relationship is:

GDP deflator = (Nominal GDP / Real GDP) x 100

### The Three Methods
1. **Product (value added) method**: sum of value added at each stage, avoiding double counting.
2. **Income method**: sum of wages, rent, interest and profit.
3. **Expenditure method**: C + I + G + (X - M).

All three must give the same total, which is the fundamental identity of national income accounting.

### Circular Flow
In a **two-sector** economy, households supply factors and receive income, which they spend on firms' output; leakages (saving) equal injections (investment) in equilibrium. Adding government introduces taxes and spending; adding the foreign sector introduces imports and exports.`,
      formulas: [
        {
          id: 'formula-macro-1',
          label: 'Expenditure Method',
          formula: 'GDP = C + I + G + (X - M)',
          exampleQ:
            'C = 5,000, I = 2,000, G = 1,500, exports 800 and imports 1,000 (all in Rs crore). Compute GDP.',
          exampleA: 'GDP = 5,000 + 2,000 + 1,500 + (800 - 1,000) = 8,500 - 200 = Rs 8,300 crore.',
        },
        {
          id: 'formula-macro-2',
          label: 'GDP Deflator',
          formula: 'GDP deflator = (Nominal GDP / Real GDP) x 100',
          exampleQ: 'Nominal GDP is Rs 12,000 crore and real GDP Rs 10,000 crore. Find the deflator.',
          exampleA: 'Deflator = (12,000 / 10,000) x 100 = 120, indicating a 20% rise in the price level relative to the base year.',
        },
      ],
      tricks: [
        {
          id: 'trick-macro-1',
          title: 'GNP Is About People, GDP Is About Place',
          trick:
            'GDP counts production within the territory; GNP counts production by nationals. Income earned by an Indian firm in Dubai adds to GNP but not GDP. This single sentence answers most conceptual questions.',
          whenToUse: 'National income concept questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-macro-1',
          step: 'Step 1: Classify Every Given Item Into the Correct Aggregate',
          detail:
            'Separate factor incomes, indirect taxes, subsidies, depreciation and transfer payments before any calculation — misclassification is the main source of error.',
          questionType: 'National Income Numerical',
        },
        {
          id: 'solve-macro-2',
          step: 'Step 2: Apply the Chosen Method Systematically',
          detail:
            'Work through the formula in order, state the aggregate computed, and verify by an alternative method where the data permit.',
          questionType: 'National Income Numerical',
        },
      ],
    },
    {
      id: 'macro-mod2-multiplier',
      subjectId: 'ba-karnataka-macroeconomics',
      title: 'Consumption, Saving, Investment & the Multiplier',
      moduleNumber: 2,
      moduleName: 'Module 2: Income Determination',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-macro-mod2-01', 'q-macro-mod2-02'],
      subtopics: [
        "Keynes' consumption function, APC and MPC",
        'Saving function, APS and MPS, and the consumption puzzle',
        'The investment multiplier and its derivation',
        'Leakages and injections, and the paradox of thrift',
        'Deflationary and inflationary gaps and their correction',
      ],
      explanationMd: `# Consumption, Saving & the Multiplier

### The Consumption Function
C = a + bY, where a is autonomous consumption (spent even at zero income, financed by dissaving) and b is the **marginal propensity to consume (MPC)**.

- **APC** = C / Y, which exceeds 1 at low incomes and falls as income rises.
- **MPC** = delta C / delta Y, which Keynes assumed to lie between 0 and 1 and to fall as income rises.

The **saving function** is S = -a + (1 - b)Y, and **MPS = 1 - MPC**, so MPC + MPS = 1 always.

### The Multiplier
An initial increase in investment generates a larger increase in income, because each round of spending becomes someone else's income:

k = 1 / (1 - MPC) = 1 / MPS

With MPC = 0.8, k = 5, so Rs 100 crore of investment raises income by Rs 500 crore. The multiplier is larger the higher the MPC — which is why fiscal stimulus in a high-MPC economy has a bigger effect.

### Leakages and Injections
Equilibrium income occurs where leakages equal injections:

S + T + M = I + G + X

Any leakage (saving, taxation, imports) reduces the multiplier; any injection raises income.

### The Paradox of Thrift
If all households decide to save more, aggregate demand falls, income falls, and total saving may be unchanged or even lower. Individually rational behaviour produces a collectively harmful outcome — the central Keynesian insight.

### Output Gaps
A **deflationary gap** exists when aggregate demand is insufficient for full employment, causing unemployment; an **inflationary gap** arises when demand exceeds full-employment output, causing inflation.`,
      formulas: [
        {
          id: 'formula-macro-3',
          label: 'Investment Multiplier',
          formula: 'k = 1 / (1 - MPC) = 1 / MPS',
          exampleQ:
            'Autonomous investment increases by Rs 200 crore and the MPC is 0.75. Find the increase in national income.',
          exampleA:
            'k = 1 / (1 - 0.75) = 4. Increase in income = 4 x 200 = Rs 800 crore.',
        },
      ],
      tricks: [
        {
          id: 'trick-macro-2',
          title: 'MPC + MPS = 1, Always',
          trick:
            'Any question giving MPC lets you state MPS immediately, and vice versa. If your numbers do not sum to 1, you have confused the average and marginal propensities.',
          whenToUse: 'All multiplier and consumption problems.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-macro-3',
          step: 'Step 1: Extract MPC From the Consumption Function',
          detail:
            'Identify the coefficient of Y as the MPC and the constant as autonomous consumption, then derive MPS = 1 - MPC.',
          questionType: 'Income Determination Numerical',
        },
        {
          id: 'solve-macro-4',
          step: 'Step 2: Compute the Multiplier and the Change in Income',
          detail:
            'Apply k = 1/(1 - MPC), multiply by the change in autonomous spending, and state the new equilibrium income.',
          questionType: 'Income Determination Numerical',
        },
      ],
    },
    {
      id: 'macro-mod3-money-banking',
      subjectId: 'ba-karnataka-macroeconomics',
      title: 'Money, Banking & Monetary Policy',
      moduleNumber: 3,
      moduleName: 'Module 3: Money and Banking',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-macro-mod3-01', 'q-macro-mod3-02'],
      subtopics: [
        'Functions and types of money, and the money supply measures M1 to M4',
        'Commercial bank credit creation and the deposit multiplier',
        'Central banking: functions of the RBI and the lender of last resort',
        'Quantitative and qualitative instruments of monetary control',
        'Monetary transmission, credit policy stance and its limits',
      ],
      explanationMd: `# Money, Banking & Monetary Policy

### Money Supply
- **M1** = currency with the public + demand deposits + other deposits with the RBI (the narrow, most liquid measure).
- **M2** = M1 + post office savings deposits.
- **M3** = M1 + time deposits with banks (broad money).
- **M4** = M3 + all post office deposits.

### Credit Creation
A bank receiving a deposit retains the required reserve and lends the rest; the loan is redeposited elsewhere and lent again. With reserve ratio r, total deposits created equal the initial deposit times 1/r. The process is truncated in practice by cash withdrawals, excess reserves and shifts into time deposits.

### Functions of the Central Bank
Currency issue, banker to the government, banker to banks, custodian of foreign exchange reserves, controller of credit, and **lender of last resort** — providing liquidity to solvent but illiquid banks to prevent systemic panic.

### Instruments of Monetary Control
**Quantitative (general)**: bank rate, repo and reverse repo rates, CRR, SLR, and open market operations. These change the volume of credit.

**Qualitative (selective)**: margin requirements, credit rationing, moral suasion and direct action. These direct credit toward or away from particular sectors.

### Transmission and Limits
A repo rate cut lowers banks' cost of funds, which should feed into lending rates, credit growth, investment and aggregate demand. Transmission is imperfect because of sticky deposit rates, risk aversion, high NPAs and government borrowing that absorbs bank funds. Monetary policy also cannot easily cure cost-push inflation or address supply-side bottlenecks.`,
      formulas: [
        {
          id: 'formula-macro-4',
          label: 'Deposit Multiplier',
          formula: 'Total deposits = Initial deposit x (1 / reserve ratio)',
          exampleQ:
            'An initial deposit of Rs 250 crore enters the banking system with a legal reserve ratio of 10%. How much credit can be created?',
          exampleA:
            'Total deposits = 250 x 10 = Rs 2,500 crore. Credit created = 2,500 - 250 = Rs 2,250 crore.',
        },
      ],
      tricks: [
        {
          id: 'trick-macro-3',
          title: 'M1 Narrow, M3 Broad',
          trick:
            'If the question says "narrow money" or "transaction money" answer M1; if it says "broad money" answer M3. The RBI targets and reports M3 most often.',
          whenToUse: 'Money supply questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-macro-5',
          step: 'Step 1: Identify the Reserve Ratio and the Initial Deposit',
          detail:
            'Convert the reserve ratio to a decimal and note whether the question asks for total deposits or only the credit created.',
          questionType: 'Credit Creation Numerical',
        },
        {
          id: 'solve-macro-6',
          step: 'Step 2: Apply the Multiplier and Distinguish Deposits From Credit',
          detail:
            'Compute total deposits, then subtract the initial deposit to obtain credit created — the distinction is explicitly examined.',
          questionType: 'Credit Creation Numerical',
        },
      ],
    },
    {
      id: 'macro-mod4-is-lm',
      subjectId: 'ba-karnataka-macroeconomics',
      title: 'IS-LM Model & Aggregate Demand-Supply Analysis',
      moduleNumber: 4,
      moduleName: 'Module 4: General Equilibrium',
      order: 4,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-macro-mod4-01', 'q-macro-mod4-02'],
      subtopics: [
        'Derivation and slope of the IS curve from the goods market',
        'Derivation and slope of the LM curve from the money market',
        'Simultaneous equilibrium and the effects of fiscal and monetary policy',
        'Crowding out, the liquidity trap and policy effectiveness',
        'Aggregate demand and supply, and short-run versus long-run equilibrium',
      ],
      explanationMd: `# The IS-LM Model

### The IS Curve
The **IS curve** shows combinations of income and interest rate at which the goods market is in equilibrium (investment equals saving). It slopes **downward**: a lower interest rate stimulates investment, which through the multiplier raises income.

Government spending or a tax cut shifts IS to the **right**; higher taxes or lower spending shift it left.

### The LM Curve
The **LM curve** shows combinations at which the money market is in equilibrium (money demand equals money supply). It slopes **upward**: higher income raises transactions demand for money, which at a fixed money supply pushes the interest rate up.

An increase in the money supply shifts LM to the **right**, lowering the interest rate.

### Simultaneous Equilibrium
Equilibrium is at the intersection, where both markets clear.

- **Expansionary fiscal policy** (IS shifts right): income rises but so does the interest rate, which partially offsets the expansion — the **crowding out** of private investment.
- **Expansionary monetary policy** (LM shifts right): the interest rate falls and income rises.

### Effectiveness Depends on Slopes
- In the **liquidity trap** the LM curve is horizontal; monetary policy is powerless and fiscal policy fully effective.
- When investment is interest-insensitive the IS curve is steep, crowding out is large and fiscal policy is less effective.

### Aggregate Demand and Supply
Aggregate demand slopes downward due to the wealth, interest rate and exchange rate effects. The short-run aggregate supply curve slopes upward because of nominal wage rigidity; the long-run curve is **vertical at full-employment output**, so demand expansion in the long run raises only prices.`,
      formulas: [
        {
          id: 'formula-macro-5',
          label: 'Goods Market Equilibrium (IS)',
          formula: 'Y = C + I + G, with I = I_0 - b r',
          exampleQ:
            'C = 100 + 0.8Y, I = 200 - 10r and G = 150. Derive the IS equation.',
          exampleA:
            'Y = 100 + 0.8Y + 200 - 10r + 150, so 0.2Y = 450 - 10r, giving Y = 2,250 - 50r. The negative coefficient on r confirms the downward slope of the IS curve.',
        },
      ],
      tricks: [
        {
          id: 'trick-macro-4',
          title: 'IS Is Goods, LM Is Money',
          trick:
            'IS comes from Investment = Saving (goods market) and slopes down; LM comes from Liquidity preference = Money supply (money market) and slopes up. Fiscal policy moves IS; monetary policy moves LM.',
          whenToUse: 'All IS-LM policy analysis.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-macro-7',
          step: 'Step 1: Derive the IS and LM Equations',
          detail:
            'Set the goods market and money market clearing conditions and solve each for Y in terms of r.',
          questionType: 'IS-LM Numerical',
        },
        {
          id: 'solve-macro-8',
          step: 'Step 2: Solve Simultaneously and Analyse the Policy Shift',
          detail:
            'Find the equilibrium r and Y, then shift the relevant curve for the policy change and explain the change in both income and the interest rate.',
          questionType: 'IS-LM Numerical',
        },
      ],
    },
    {
      id: 'macro-mod5-inflation-unemployment',
      subjectId: 'ba-karnataka-macroeconomics',
      title: 'Inflation, Unemployment & Business Cycles',
      moduleNumber: 5,
      moduleName: 'Module 5: Inflation, Unemployment and Growth',
      order: 5,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-macro-mod5-01', 'q-macro-mod5-02'],
      subtopics: [
        'Types of inflation: demand-pull, cost-push, structural and hyperinflation',
        'Measuring inflation: WPI, CPI and the GDP deflator',
        'Types of unemployment and measurement in India',
        'The Phillips curve, NAIRU and stagflation',
        'Business cycle phases and anti-cyclical policy',
      ],
      explanationMd: `# Inflation, Unemployment & Business Cycles

### Types of Inflation
- **Demand-pull**: aggregate demand outruns supply at full employment.
- **Cost-push**: rising input costs — crude oil, wages, imported components — reduce supply at every price level.
- **Structural**: supply bottlenecks in infrastructure, agriculture or distribution.
- **Hyperinflation**: an extreme case, typically from fiscal deficits financed by money creation, which destroys the currency's function as a store of value.

### Measurement
**WPI** tracks wholesale prices; **CPI** tracks the retail basket and is the RBI's inflation target variable; the **GDP deflator** covers all domestically produced goods and services. The three can diverge because of different baskets and weights.

### Unemployment
- **Frictional**: workers between jobs.
- **Structural**: skills mismatch or technological change.
- **Cyclical**: caused by deficient aggregate demand.
- **Seasonal**: predictable, as in agriculture.
- **Disguised**: more workers than a task requires, common in Indian agriculture, where marginal productivity is near zero.

India measures employment through the Labour Force Survey using the **usual status**, **current weekly status** and **current daily status** approaches, which give different unemployment rates for the same period.

### The Phillips Curve
The original curve showed an inverse relation between unemployment and wage inflation. With expectations incorporated, the **short-run** curve slopes down but the **long-run** curve is vertical at the **NAIRU** — the natural rate — so there is no permanent trade-off.

**Stagflation** — simultaneous high inflation and high unemployment, as in the 1970s oil shocks — contradicted the original curve and motivated the expectations-augmented version.

### Business Cycles
Phases are expansion, peak, contraction and trough. **Anti-cyclical policy** uses fiscal and monetary expansion in downturns and restraint in booms, though implementation lags and political constraints limit effectiveness.`,
      formulas: [
        {
          id: 'formula-macro-6',
          label: 'Unemployment Rate',
          formula: 'Unemployment rate = (Unemployed / Labour Force) x 100',
          exampleQ:
            'The labour force is 500 million and 45 million are unemployed. Compute the unemployment rate.',
          exampleA:
            'Unemployment rate = (45 / 500) x 100 = 9%. Note that the denominator is the labour force, not the total population.',
        },
      ],
      tricks: [
        {
          id: 'trick-macro-5',
          title: 'Denominator Is the Labour Force',
          trick:
            'Unemployment is measured against the LABOUR FORCE (those employed plus those seeking work), not the population. Using population understates the rate badly.',
          whenToUse: 'Unemployment rate calculations.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-macro-9',
          step: 'Step 1: Diagnose the Type of Inflation or Unemployment',
          detail:
            'Identify whether the shock is demand-side or supply-side, or which unemployment category applies, because the policy response differs.',
          questionType: 'Macro Diagnostic Question',
        },
        {
          id: 'solve-macro-10',
          step: 'Step 2: Recommend and Evaluate the Policy Response',
          detail:
            'Propose the appropriate fiscal or monetary action, then assess its effectiveness and side effects, including any supply-side measures required.',
          questionType: 'Macro Diagnostic Question',
        },
      ],
    },
  ],

  // ── 4. Media Studies & Mass Communication (Sem 2) ──
  'ba-karnataka-media-studies': [
    {
      id: 'media-mod1-theories',
      subjectId: 'ba-karnataka-media-studies',
      title: 'Mass Communication Theories & Models',
      moduleNumber: 1,
      moduleName: 'Module 1: Foundations of Mass Communication',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-media-mod1-01', 'q-media-mod1-02'],
      subtopics: [
        'Definitions, functions and the Lasswell model of communication',
        'Hypodermic needle / magic bullet theory and its limitations',
        'Two-step flow, opinion leadership and the uses and gratifications approach',
        'Agenda setting, framing and cultivation theory',
        'Gatekeeping, spiral of silence and the political economy of media',
      ],
      explanationMd: `# Mass Communication Theories

### Lasswell's Model
Harold Lasswell framed communication as: **Who says what, in which channel, to whom, with what effect?** This identifies the five components of analysis — communicator, message, medium, receiver and effect — and remains the starting point of media research.

### Early Effects Theories
The **hypodermic needle** or **magic bullet** theory assumed media messages were injected uniformly into a passive audience with immediate and powerful effects. It was shaped by wartime propaganda studies but was abandoned because audiences proved selective and socially embedded.

### Limited Effects
The **two-step flow** theory (Lazarsfeld) found that media influence flows first to **opinion leaders** and then to the wider public through interpersonal contact — so personal influence often outweighs direct media exposure.

**Uses and gratifications** reversed the question: instead of asking what media do to people, it asks what people do with media, treating audiences as active selectors seeking information, identity, integration and entertainment.

### Powerful Effects Revival
- **Agenda setting** (McCombs and Shaw): media may not tell people *what to think* but are remarkably successful at telling them *what to think about*.
- **Framing**: how an issue is presented — as a crime story or a public health issue — shapes interpretation.
- **Cultivation theory** (Gerbner): heavy television viewing cultivates a perception of the world as more dangerous than it is — the "mean world syndrome".
- **Spiral of silence** (Noelle-Neumann): people withhold opinions they believe to be minority views, amplifying the apparent dominance of the majority position.

### Gatekeeping and Political Economy
**Gatekeeping** is the selection process by which editors and algorithms decide which stories reach the audience. The **political economy** approach examines how ownership, advertising dependence and corporate interests shape content systematically.`,
      formulas: [
        {
          id: 'formula-media-1',
          label: "Lasswell's Model of Communication",
          formula: 'Who → Says What → In Which Channel → To Whom → With What Effect',
          exampleQ:
            'A researcher studies which newspaper stories receive front-page placement and how that affects readers\u2019 issue priorities. Which two theories are engaged?',
          exampleA:
            'Gatekeeping (the editorial selection determining front-page placement) and agenda setting (the resulting effect on which issues readers consider important).',
        },
      ],
      tricks: [
        {
          id: 'trick-media-1',
          title: 'Agenda Setting Is About Salience, Not Opinion',
          trick:
            'Agenda setting does not claim media change WHAT people think, only what they think ABOUT. Stating this distinction precisely is what earns the mark in theory questions.',
          whenToUse: 'Media effects theory questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-media-1',
          step: 'Step 1: Identify the Communication Components in the Scenario',
          detail:
            'Map the case onto communicator, message, channel, receiver and effect to establish which part of the process is at issue.',
          questionType: 'Media Theory Application',
        },
        {
          id: 'solve-media-2',
          step: 'Step 2: Select and Justify the Appropriate Theory',
          detail:
            'Name the theory, state its core claim and its originator, then apply it explicitly to the case facts rather than merely describing it.',
          questionType: 'Media Theory Application',
        },
      ],
    },
    {
      id: 'media-mod2-media-in-india',
      subjectId: 'ba-karnataka-media-studies',
      title: 'Print, Broadcast & Digital Media in India',
      moduleNumber: 2,
      moduleName: 'Module 2: Media Systems in India',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-media-mod2-01', 'q-media-mod2-02'],
      subtopics: [
        'History of the Indian press from Hicky\u2019s Bengal Gazette to independence',
        'The role of the press in the freedom movement and the Press Acts',
        'All India Radio, Doordarshan and the arrival of private satellite television',
        'The Press Council of India, the News Broadcasters Association and self-regulation',
        'Digital news, vernacular media growth and the Karnataka media landscape',
      ],
      explanationMd: `# Media Systems in India

### The Indian Press
The press in India began with **Hicky's Bengal Gazette** in 1780. Under British rule, restrictive legislation — the Vernacular Press Act 1878, the Press Acts and wartime censorship — repeatedly curtailed it. Newspapers nevertheless became instruments of the freedom movement: **Kesari** and **Mahratta** under Tilak, **Young India** and **Harijan** under Gandhi, and **Amrita Bazar Patrika**, which famously converted to English overnight to escape the Vernacular Press Act.

Post-independence, the **First Press Commission (1952-54)** recommended the creation of the **Press Council of India** to safeguard press freedom while maintaining standards. The **Emergency (1975-77)** imposed severe censorship and remains the defining test of Indian press independence.

### Broadcast
**All India Radio** (1936) and **Doordarshan** (1959) held a state monopoly until the 1990s. The Supreme Court's **Cricket Association of Bengal judgment (1995)** declared airwaves public property, opening the sector. Private satellite television then transformed Indian viewing, particularly through the proliferation of news channels in regional languages.

### Regulation
Broadcast content is governed by the **Cable Television Networks (Regulation) Act 1995** and the Programme and Advertising Codes. Print relies substantially on self-regulation through the Press Council. Digital news came under the **Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021**.

### Karnataka and Vernacular Media
Karnataka has a strong Kannada print and television tradition — Prajavani, Vijayavani, Udayavani, and television networks such as Udaya TV, TV9 Kannada and Suvarna News. Vernacular media has grown faster than English media nationally, driven by rising literacy and affordable mobile data.`,
      formulas: [
        {
          id: 'formula-media-2',
          label: 'Regulatory Framework Map',
          formula: 'Print → Press Council of India (self-regulation) | Broadcast → Cable TV Networks Act 1995 + Programme Code | Digital → IT Rules 2021',
          exampleQ:
            'Which framework governs a private Kannada television news channel\u2019s compliance with content standards?',
          exampleA:
            'The Cable Television Networks (Regulation) Act 1995 together with the Programme and Advertising Codes, supplemented by industry self-regulatory bodies. The Press Council covers print, not broadcast.',
        },
      ],
      tricks: [
        {
          id: 'trick-media-2',
          title: 'Press Council Covers Print Only',
          trick:
            'A common error is applying the Press Council of India to television. It has jurisdiction over print; broadcast is governed by the Cable TV Networks Act and its Programme Code.',
          whenToUse: 'Media regulation questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-media-3',
          step: 'Step 1: Identify the Medium and Its Regulator',
          detail:
            'Establish whether the subject is print, broadcast or digital, since each has a distinct regulatory framework in India.',
          questionType: 'Media Systems Question',
        },
        {
          id: 'solve-media-4',
          step: 'Step 2: Trace the Historical and Legal Development',
          detail:
            'Support the answer with specific Acts, commissions, judgments and publications with dates, which is what distinguishes a strong answer.',
          questionType: 'Media Systems Question',
        },
      ],
    },
    {
      id: 'media-mod3-media-law',
      subjectId: 'ba-karnataka-media-studies',
      title: 'Media Law, Ethics & Regulatory Bodies',
      moduleNumber: 3,
      moduleName: 'Module 3: Media Law and Ethics',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-media-mod3-01', 'q-media-mod3-02'],
      subtopics: [
        'Freedom of speech under Article 19(1)(a) and the reasonable restrictions in 19(2)',
        'Defamation: civil and criminal, truth, fair comment and privilege as defences',
        'Contempt of court, privacy and the right to be forgotten',
        'Obscenity, hate speech and restrictions under the IT Act 2000',
        'Journalistic ethics: accuracy, fairness, source protection and paid news',
      ],
      explanationMd: `# Media Law & Ethics

### Constitutional Framework
**Article 19(1)(a)** guarantees freedom of speech and expression, which the Supreme Court has held includes freedom of the press. However it is not absolute: **Article 19(2)** permits reasonable restrictions in the interests of sovereignty and integrity, security of the state, friendly relations with foreign states, public order, decency or morality, contempt of court, defamation, and incitement to an offence.

### Defamation
Defamation is an injury to reputation. In India it is both a **civil wrong** (damages) and a **criminal offence** under Sections 499-500 of the Indian Penal Code, the criminalisation of which was upheld in *Subramanian Swamy v. Union of India* (2016). Defences include **truth** published for the public good, **fair comment** on matters of public interest, **privilege** (parliamentary and judicial proceedings) and **innocent dissemination**.

### Contempt of Court
The Contempt of Courts Act 1971 covers civil contempt (wilful disobedience) and criminal contempt (scandalising the court or interfering with judicial proceedings). Fair and accurate reporting of proceedings is protected.

### Privacy
Although not an express constitutional right, privacy was recognised as a fundamental right in **Justice K.S. Puttaswamy v. Union of India (2017)**, derived from Article 21. This has significant implications for media reporting on individuals.

### Digital Regulation
The **Information Technology Act 2000**, particularly Section 66A (struck down in *Shreya Singhal v. Union of India*, 2015 for being unconstitutional), and the 2021 Intermediary Guidelines govern online speech.

### Ethics
Journalistic codes require verification before publication, separation of news from opinion, correction of errors promptly, protection of confidential sources, and refusal of **paid news** — content published for payment but presented as independent reporting.`,
      formulas: [
        {
          id: 'formula-media-3',
          label: 'Article 19(1)(a) and Its Restrictions',
          formula: 'Freedom of speech (19(1)(a)) is subject to reasonable restrictions under 19(2): sovereignty, security, foreign relations, public order, decency, morality, contempt, defamation, incitement',
          exampleQ:
            'A publication is sued for a report alleging misconduct by a public official that it can substantiate with documents. Which defence applies?',
          exampleA:
            'Truth published for the public good, and fair comment on a matter of public interest involving a public official. Verification evidence is essential to sustain the defence.',
        },
      ],
      tricks: [
        {
          id: 'trick-media-3',
          title: 'Defamation in India Is BOTH Civil and Criminal',
          trick:
            'Unlike many jurisdictions, Indian defamation carries criminal liability under IPC Sections 499-500. Mentioning the criminal dimension and the 2016 Supreme Court upholding distinguishes a strong answer.',
          whenToUse: 'Media law questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-media-5',
          step: 'Step 1: Identify the Right and the Restriction Engaged',
          detail:
            'State the protection under Article 19(1)(a) and the specific head of restriction under 19(2) that the state would rely upon.',
          questionType: 'Media Law Case Analysis',
        },
        {
          id: 'solve-media-6',
          step: 'Step 2: Apply the Relevant Statute and Case Law',
          detail:
            'Cite the governing Act and the leading judgment, then balance the competing interests to reach a reasoned conclusion.',
          questionType: 'Media Law Case Analysis',
        },
      ],
    },
    {
      id: 'media-mod4-advertising-pr',
      subjectId: 'ba-karnataka-media-studies',
      title: 'Advertising, Public Relations & Media Planning',
      moduleNumber: 4,
      moduleName: 'Module 4: Advertising and Public Relations',
      order: 4,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-media-mod4-01', 'q-media-mod4-02'],
      subtopics: [
        'Advertising: functions, types and the advertising agency structure',
        'The AIDA and hierarchy-of-effects models of advertising response',
        'Media planning: reach, frequency, GRPs and media selection',
        'Public relations: tools, the press release and crisis communication',
        'Advertising regulation: ASCI, the Advertising Code and misleading claims',
      ],
      explanationMd: `# Advertising & Public Relations

### Advertising
Advertising is paid, non-personal communication by an identified sponsor. Its functions are to inform, persuade, remind and add value through brand building. Types include product, institutional, comparative, reminder and public service advertising.

An **advertising agency** typically comprises account management (client liaison), creative (copy and art), media planning and buying, and research.

### Response Models
- **AIDA**: Attention, Interest, Desire, Action.
- **Hierarchy of effects**: awareness, knowledge, liking, preference, conviction, purchase — the sequence a campaign must move the consumer through.
- **DAGMAR**: defines advertising goals as specific, measurable communication tasks rather than sales targets, since sales depend on many factors beyond advertising.

### Media Planning
- **Reach**: the percentage of the target audience exposed at least once.
- **Frequency**: the average number of exposures per person reached.
- **Gross Rating Points (GRP) = Reach x Frequency**, the standard measure of campaign weight.

Media selection weighs cost per thousand (CPT), audience fit, clutter, credibility and the product's need for demonstration or visual appeal.

### Public Relations
PR builds mutual understanding rather than selling directly. Tools include press releases, media briefings, press conferences, events, sponsorships, publications and social media engagement. **Crisis communication** requires speed, a single authoritative spokesperson, factual accuracy, acknowledgment of harm where due, and clear corrective action — the sequence established by well-known industrial disasters.

### Regulation
The **Advertising Standards Council of India (ASCI)** is a self-regulatory body whose code prohibits misleading, indecent or unfair advertising. Statutory controls also apply, notably for specific product categories, and the Consumer Protection Act 2019 addresses misleading advertisements and endorsements.`,
      formulas: [
        {
          id: 'formula-media-4',
          label: 'Gross Rating Points',
          formula: 'GRP = Reach (%) x Average Frequency',
          exampleQ:
            'A campaign reaches 60% of the target audience an average of 4 times. Compute the GRPs.',
          exampleA: 'GRP = 60 x 4 = 240 GRPs, indicating the total weight of the campaign across the target audience.',
        },
      ],
      tricks: [
        {
          id: 'trick-media-4',
          title: 'DAGMAR Sets Communication Goals, Not Sales Goals',
          trick:
            'The point of DAGMAR is that advertising objectives must be measurable COMMUNICATION outcomes (awareness, preference), because sales are affected by price, distribution and competition too.',
          whenToUse: 'Advertising objective questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-media-7',
          step: 'Step 1: Define the Communication Objective',
          detail:
            'State the specific target audience, the desired communication effect and how it will be measured.',
          questionType: 'Media Planning Problem',
        },
        {
          id: 'solve-media-8',
          step: 'Step 2: Select Media and Compute Reach, Frequency and GRPs',
          detail:
            'Justify the media mix against the product characteristics and budget, then quantify reach, frequency and GRPs to demonstrate campaign weight.',
          questionType: 'Media Planning Problem',
        },
      ],
    },
    {
      id: 'media-mod5-new-media',
      subjectId: 'ba-karnataka-media-studies',
      title: 'New Media, Platform Analytics & Misinformation',
      moduleNumber: 5,
      moduleName: 'Module 5: Digital and New Media',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-media-mod5-01', 'q-media-mod5-02'],
      subtopics: [
        'Convergence, interactivity and the shift from audience to user',
        'Social media platforms, algorithms and the attention economy',
        'Digital metrics: impressions, engagement rate, CTR and conversion',
        'Misinformation, disinformation, deepfakes and fact-checking',
        'User-generated content, citizen journalism and digital ethics',
      ],
      explanationMd: `# New Media & Misinformation

### Convergence and Interactivity
New media merges previously separate technologies — text, audio, video and computing — into networked digital form. The defining shift is from a passive **audience** to an active **user** who produces, comments and shares. Media is no longer one-to-many but many-to-many.

### The Attention Economy and Algorithms
Platforms compete for scarce attention and monetise it through advertising. **Recommendation algorithms** rank content by predicted engagement, which tends to favour emotionally arousing material — creating **filter bubbles** (personalised information environments) and **echo chambers** (networks reinforcing existing views).

### Digital Metrics
- **Impressions**: the number of times content is displayed.
- **Reach**: the number of unique users who saw it.
- **Engagement rate**: interactions divided by reach or impressions.
- **Click-through rate (CTR)**: clicks divided by impressions.
- **Conversion rate**: desired actions divided by clicks.

Vanity metrics (impressions, follower counts) matter less than conversion and retention metrics that indicate actual behaviour change.

### Misinformation and Disinformation
- **Misinformation**: false information shared without intent to deceive.
- **Disinformation**: false information created and spread deliberately to mislead.
- **Malinformation**: true information used out of context to cause harm.

**Deepfakes** — synthetic media generated by machine learning — make fabricated video and audio difficult to distinguish from authentic recordings. Counter-measures include **fact-checking organisations**, provenance standards such as content credentials, platform labelling, digital literacy education and statutory obligations on intermediaries.

### Ethics of User-Generated Content
Citizen journalism expands coverage but raises verification, consent and privacy concerns. Publishing unverified user content without corroboration is a leading cause of defamation and privacy harm in Indian digital media.`,
      formulas: [
        {
          id: 'formula-media-5',
          label: 'Click-Through and Conversion Rates',
          formula: 'CTR = (Clicks / Impressions) x 100; Conversion rate = (Conversions / Clicks) x 100',
          exampleQ:
            'A campaign receives 200,000 impressions, 4,000 clicks and 200 conversions. Compute the CTR and conversion rate.',
          exampleA:
            'CTR = (4,000 / 200,000) x 100 = 2%. Conversion rate = (200 / 4,000) x 100 = 5%. The overall conversion from impression to action is 0.1%.',
        },
      ],
      tricks: [
        {
          id: 'trick-media-5',
          title: 'Disinformation Is Deliberate, Misinformation Is Not',
          trick:
            'The distinction turns entirely on INTENT. Misinformation is shared in good faith; disinformation is created to deceive. Examiners test this definition directly.',
          whenToUse: 'Digital media and misinformation questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-media-9',
          step: 'Step 1: Classify the Phenomenon by Intent and Truth',
          detail:
            'Determine whether the content is false and whether the sharing was deliberate, to classify it as misinformation, disinformation or malinformation.',
          questionType: 'Digital Media Case Analysis',
        },
        {
          id: 'solve-media-10',
          step: 'Step 2: Evaluate Metrics and Propose Counter-Measures',
          detail:
            'Compute the relevant digital metrics, then recommend verification, labelling, media literacy or regulatory responses appropriate to the case.',
          questionType: 'Digital Media Case Analysis',
        },
      ],
    },
  ],

  // ── 5. Public Finance & Indian Fiscal System (Sem 3) ──
  'ba-karnataka-public-finance': [
    {
      id: 'pf-mod1-public-revenue',
      subjectId: 'ba-karnataka-public-finance',
      title: 'Public Revenue: Tax & Non-Tax Sources',
      moduleNumber: 1,
      moduleName: 'Module 1: Public Revenue',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-pf-mod1-01', 'q-pf-mod1-02'],
      subtopics: [
        'Classification of public revenue: tax, non-tax, receipts versus revenue',
        'Direct and indirect taxes, and their incidence',
        'Canons of taxation: equity, certainty, convenience and economy',
        'Ad valorem and specific duties, and the GST structure',
        'Non-tax revenue: fees, fines, escheat, special assessments and public enterprises',
      ],
      explanationMd: `# Public Revenue

### Classification
- **Tax revenue**: compulsory contributions without a direct quid pro quo.
- **Non-tax revenue**: fees (partly compensatory), fines, licences, escheat, special assessments, interest and dividends from public enterprises.
- **Capital receipts** (borrowings, disinvestment, recovery of loans) create liabilities or reduce assets, whereas **revenue receipts** (taxes, non-tax revenue) do neither. This distinction matters because borrowing cannot finance recurrent expenditure indefinitely.

### Direct versus Indirect Taxes
- **Direct tax**: liability and burden fall on the same person; the burden cannot be shifted — income tax, corporation tax, wealth tax.
- **Indirect tax**: liability and burden differ; the burden is shifted forward to consumers — GST, customs duty, excise.

**Incidence** is where the burden finally rests; **impact** is where it first falls.

### Adam Smith's Canons of Taxation
1. **Equity**: taxes in proportion to ability to pay.
2. **Certainty**: the amount, time and manner of payment must be clear and not arbitrary.
3. **Convenience**: levied at a time and manner convenient for the taxpayer.
4. **Economy**: collection cost must be small relative to revenue.

Later economists added canons of productivity, elasticity, simplicity and diversity.

### GST
The **Goods and Services Tax**, implemented on 1 July 2017 through the 101st Constitutional Amendment, subsumed multiple central and state levies into a single destination-based tax with four slabs — 5%, 12%, 18% and 28% — plus special rates for gold and rough diamonds. It comprises CGST, SGST and IGST, administered by the **GST Council** under Article 279A.

### Tax versus Fee
A **fee** is a payment for a specific service rendered, with a direct element of benefit, whereas a **tax** is compulsory with no direct return. This distinction determines the legal character of the levy.`,
      formulas: [
        {
          id: 'formula-pf-1',
          label: 'Effective Tax Rate and Tax Buoyancy',
          formula: 'Effective rate = (Tax paid / Tax base) x 100; Buoyancy = (% change in tax revenue) / (% change in GDP)',
          exampleQ:
            'Tax revenue rises from Rs 1,00,000 crore to Rs 1,15,000 crore while GDP rises 10%. Compute the buoyancy.',
          exampleA:
            'Revenue growth = 15%. Buoyancy = 15 / 10 = 1.5, greater than unity, meaning revenue is growing faster than GDP — the desirable outcome.',
        },
      ],
      tricks: [
        {
          id: 'trick-pf-1',
          title: 'Borrowing Is a Capital Receipt, Not Revenue',
          trick:
            'Loans and disinvestment proceeds create liabilities or reduce assets, so they are capital receipts and cannot be treated as revenue. This distinction is repeatedly examined in budget-analysis questions.',
          whenToUse: 'Public revenue classification questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-pf-1',
          step: 'Step 1: Classify the Levy or Receipt',
          detail:
            'Determine whether the item is a direct tax, indirect tax, non-tax revenue or capital receipt, and identify whether the burden is shiftable.',
          questionType: 'Public Finance Classification',
        },
        {
          id: 'solve-pf-2',
          step: 'Step 2: Evaluate Against the Canons and Incidence',
          detail:
            'Assess the levy against equity, certainty, convenience and economy, then state the impact and final incidence of the burden.',
          questionType: 'Public Finance Classification',
        },
      ],
    },
    {
      id: 'pf-mod2-public-expenditure',
      subjectId: 'ba-karnataka-public-finance',
      title: 'Public Expenditure: Growth, Effects & Control',
      moduleNumber: 2,
      moduleName: 'Module 2: Public Expenditure',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-pf-mod2-01', 'q-pf-mod2-02'],
      subtopics: [
        'Classification: plan and non-plan, revenue and capital, developmental and non-developmental',
        "Wagner's law of increasing state activity",
        'Peacock-Wiseman displacement effect and the ratchet principle',
        'Musgrave\u2019s three functions of public finance',
        'Effects of public expenditure on production and distribution, and expenditure control',
      ],
      explanationMd: `# Public Expenditure

### Classification
- **Revenue expenditure**: recurrent, creating no assets — salaries, interest payments, subsidies.
- **Capital expenditure**: creates assets or reduces liabilities — infrastructure investment, loan repayment.
- **Developmental** expenditure promotes growth; **non-developmental** expenditure covers defence, administration and interest.
- The former plan / non-plan distinction was replaced in 2017 by a **revenue / capital** classification to improve transparency.

### Theories of Growth in Public Expenditure
**Wagner's law of increasing state activity**: as an economy industrialises, public expenditure grows faster than national income, because the state must supply law and order, infrastructure, and welfare services whose income elasticity of demand exceeds one.

**Peacock and Wiseman's displacement effect**: public spending rises in a step-like ratchet fashion. A crisis — war, pandemic, recession — displaces the previous level of spending upward, and expenditure does not fall back afterwards. This explains the observed staircase pattern better than Wagner's smooth growth.

**Colin Clark's critical limit hypothesis** warns that beyond roughly 25% of national income, further growth in public expenditure may trigger inflation.

### Musgrave's Three Functions
1. **Allocation**: correcting market failure by providing public goods and addressing externalities.
2. **Distribution**: reducing inequality through progressive taxation and transfer payments.
3. **Stabilisation**: smoothing the business cycle through fiscal policy.

### Effects
On **production**: infrastructure and education spending raise productivity, though excessive non-developmental spending crowds out private investment. On **distribution**: transfers and progressive taxation reduce inequality, while regressive subsidies can widen it.

### Control
Mechanisms include legislative sanction (budget approval), the **Comptroller and Auditor General** audit, the **Public Accounts Committee**, departmental standing committees, and performance or outcome budgeting.`,
      formulas: [
        {
          id: 'formula-pf-2',
          label: 'Expenditure Composition Indicators',
          formula: 'Capital expenditure ratio = Capital expenditure / Total expenditure; Interest burden = Interest payments / Revenue receipts',
          exampleQ:
            'A state budget shows total expenditure of Rs 2,00,000 crore, of which capital expenditure is Rs 30,000 crore and interest payments Rs 40,000 crore against revenue receipts of Rs 1,30,000 crore. Comment.',
          exampleA:
            'Capital ratio = 15%, which is low for a developing state, and the interest burden is about 31% of revenue receipts — well above the recommended 20%, leaving limited fiscal space for development spending.',
        },
      ],
      tricks: [
        {
          id: 'trick-pf-2',
          title: 'Displacement Effect Explains Steps, Wagner Explains Trend',
          trick:
            'Wagner describes smooth long-run growth; Peacock-Wiseman explains why spending rises in jumps during crises and never returns. Using the right theory for the right pattern earns the mark.',
          whenToUse: 'Public expenditure theory questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-pf-3',
          step: 'Step 1: Compute the Composition Ratios',
          detail:
            'Calculate the capital expenditure share and the interest burden as a percentage of revenue receipts to assess fiscal quality.',
          questionType: 'Budget Analysis',
        },
        {
          id: 'solve-pf-4',
          step: 'Step 2: Interpret Against Benchmarks and Recommend',
          detail:
            'Compare against norms such as the FRBM targets and the 20% interest-burden benchmark, then recommend expenditure restructuring.',
          questionType: 'Budget Analysis',
        },
      ],
    },
    {
      id: 'pf-mod3-budget-india',
      subjectId: 'ba-karnataka-public-finance',
      title: 'The Union Budget & the Indian Fiscal Framework',
      moduleNumber: 3,
      moduleName: 'Module 3: Budgeting in India',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-pf-mod3-01', 'q-pf-mod3-02'],
      subtopics: [
        'Constitutional provisions: Articles 112, 265, 266, 267 and 268',
        'The Consolidated Fund, Contingency Fund and Public Account',
        'Stages of budget preparation, enactment and execution',
        'Deficits: fiscal, revenue and primary, and the FRBM Act 2003',
        'The Finance Commission and vertical and horizontal devolution',
      ],
      explanationMd: `# The Union Budget & Indian Fiscal Framework

### Constitutional Basis
- **Article 112**: the Annual Financial Statement — the budget — showing estimated receipts and expenditure.
- **Article 265**: no tax shall be levied or collected except by authority of law.
- **Article 266**: the **Consolidated Fund of India**, into which all revenues and loans flow, and from which no money may be withdrawn without parliamentary authorisation.
- **Article 267**: the **Contingency Fund**, an imprest for urgent unforeseen expenditure, subject to later parliamentary approval.
- **Article 268**: duties levied by the Union but collected and retained by the States.
- The **Public Account** holds money the government holds as banker or trustee — provident funds, small savings — and does not require parliamentary appropriation.

### Budget Stages
1. **Preparation**: ministries submit estimates to the Finance Ministry.
2. **Enactment**: presentation, general discussion, scrutiny by departmental standing committees, voting on demands for grants, the **Appropriation Bill** and the **Finance Bill**.
3. **Execution**: collection of receipts and disbursement of grants.
4. **Audit and review**: by the CAG, whose reports go to the **Public Accounts Committee**.

Since 2017 the **Railway Budget** has been merged into the General Budget, and the budget is presented on 1 February.

### Deficits
- **Fiscal deficit** = Total expenditure - (Revenue receipts + Non-debt capital receipts). It measures total borrowing requirement.
- **Revenue deficit** = Revenue expenditure - Revenue receipts. A positive revenue deficit means the government is borrowing to fund current consumption.
- **Primary deficit** = Fiscal deficit - Interest payments, showing the borrowing need excluding the cost of past debt.

The **FRBM Act 2003** set targets — originally 3% fiscal deficit and zero revenue deficit for the Centre — and created the framework of medium-term fiscal policy statements. The **N.K. Singh Committee** recommended a debt-to-GDP target of 60% (Centre 40%, States 20%) by 2023-24.

### The Finance Commission
Constituted under **Article 280** every five years, it recommends the distribution of net tax proceeds between the Centre and States (**vertical**) and among the States (**horizontal**), using criteria including income distance, population, area, forest cover and tax effort.`,
      formulas: [
        {
          id: 'formula-pf-3',
          label: 'Deficit Measures',
          formula: 'Fiscal deficit = Total expenditure - (Revenue receipts + Non-debt capital receipts); Primary deficit = Fiscal deficit - Interest payments',
          exampleQ:
            'Total expenditure is Rs 45 lakh crore, revenue receipts Rs 27 lakh crore, non-debt capital receipts Rs 2 lakh crore and interest payments Rs 10 lakh crore. Compute the fiscal and primary deficits.',
          exampleA:
            'Fiscal deficit = 45 - (27 + 2) = Rs 16 lakh crore. Primary deficit = 16 - 10 = Rs 6 lakh crore.',
        },
      ],
      tricks: [
        {
          id: 'trick-pf-3',
          title: 'The Public Account Is Not the Consolidated Fund',
          trick:
            'Only the Consolidated Fund requires parliamentary appropriation. The Public Account holds trust money such as provident fund contributions and can be operated without it. Confusing these is a very common exam error.',
          whenToUse: 'Constitutional fiscal provisions questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-pf-5',
          step: 'Step 1: Separate Revenue and Capital Items',
          detail:
            'Sort the budget data into revenue receipts, non-debt capital receipts, revenue expenditure and capital expenditure before computing any deficit.',
          questionType: 'Budget Deficit Numerical',
        },
        {
          id: 'solve-pf-6',
          step: 'Step 2: Compute All Three Deficits and Comment',
          detail:
            'Calculate the fiscal, revenue and primary deficits, then interpret what the pattern reveals about the quality of fiscal consolidation.',
          questionType: 'Budget Deficit Numerical',
        },
      ],
    },
    {
      id: 'pf-mod4-fiscal-federalism',
      subjectId: 'ba-karnataka-public-finance',
      title: 'Fiscal Federalism & Centre-State Financial Relations',
      moduleNumber: 4,
      moduleName: 'Module 4: Fiscal Federalism',
      order: 4,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-pf-mod4-01', 'q-pf-mod4-02'],
      subtopics: [
        'Concept and rationale of fiscal federalism and the assignment problem',
        'Articles 268 to 281: distribution of revenues between Union and States',
        'The GST Council, cesses and surcharges, and the devolution debate',
        'The Fifteenth Finance Commission recommendations and Karnataka\u2019s share',
        'Vertical and horizontal imbalances, fiscal transfers and borrowing limits',
      ],
      explanationMd: `# Fiscal Federalism

### Concept
Fiscal federalism concerns the division of governmental functions and financial relations among levels of government. The **assignment problem** asks which level should provide which service: local public goods are best supplied locally because preferences differ, while national public goods and redistribution belong to the Centre.

### Constitutional Distribution
- **Article 268**: duties levied by the Union but collected and retained by States.
- **Article 269**: taxes levied and collected by the Union but assigned to States (inter-state trade).
- **Article 270**: taxes levied and collected by the Union and distributed between Union and States — the divisible pool.
- **Article 275**: grants-in-aid to States in need.
- **Article 280**: the Finance Commission.
- **Article 293**: borrowing by States, requiring central consent where a Union loan is outstanding.

The Seventh Schedule's three lists determine legislative competence, with the residuary power resting with the Union under Article 248.

### GST and the Devolution Debate
The GST Council, created by **Article 279A**, decides rates and exemptions, with the Centre holding one-third of the votes and States two-thirds, requiring a three-fourths majority for decisions — a federal design protecting State interests.

The **Fourteenth Finance Commission** raised States' share of the divisible pool from 32% to **42%**, a landmark devolution. The **Fifteenth Finance Commission (2020-21 to 2025-26)** recommended **41%**, adjusted for the changed status of Jammu and Kashmir, using income distance (45%), population (15%, on the 2011 census), area (15%), forest and ecology (10%), tax and fiscal effort (2.5%) and demographic performance (12.5%).

### The Cess and Surcharge Issue
**Cesses and surcharges are excluded from the divisible pool**, so as their share of gross tax revenue grows, the effective devolution to States falls even when the nominal share is unchanged. States have consistently argued for this to be corrected.

### Karnataka
Karnataka has historically received a smaller per capita share than poorer States because **income distance** is a criterion weighted heavily against relatively prosperous States. Karnataka's claim for a larger share based on its contribution to national tax revenue has been a persistent feature of Centre-State finance debates.

### Imbalances
**Vertical imbalance** arises because the Centre has greater revenue-raising capacity while States bear greater expenditure responsibility. **Horizontal imbalance** reflects differing resource endowments among States. Both are corrected through transfers, grants-in-aid and borrowing arrangements.`,
      formulas: [
        {
          id: 'formula-pf-4',
          label: 'Effective Devolution',
          formula: 'Effective devolution = Divisible pool / Gross tax revenue; Divisible pool = Gross tax revenue - cesses and surcharges - cost of collection',
          exampleQ:
            'Gross tax revenue is Rs 30 lakh crore, cesses and surcharges Rs 3 lakh crore and cost of collection Rs 1 lakh crore. If the States\u2019 share is 41%, what do they receive?',
          exampleA:
            'Divisible pool = 30 - 3 - 1 = Rs 26 lakh crore. States\u2019 share = 41% x 26 = Rs 10.66 lakh crore, which is only 35.5% of gross tax revenue — illustrating the erosion caused by cesses.',
        },
      ],
      tricks: [
        {
          id: 'trick-pf-4',
          title: 'Cesses Never Enter the Divisible Pool',
          trick:
            'The States\u2019 41% applies only to the divisible pool, which EXCLUDES cesses and surcharges. Forgetting this makes the effective share appear much larger than it is.',
          whenToUse: 'Fiscal federalism numericals.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-pf-7',
          step: 'Step 1: Compute the Divisible Pool',
          detail:
            'Deduct cesses, surcharges and cost of collection from gross tax revenue before applying the States\u2019 share.',
          questionType: 'Fiscal Devolution Numerical',
        },
        {
          id: 'solve-pf-8',
          step: 'Step 2: Analyse the Imbalance and the Transfer Design',
          detail:
            'Identify whether the imbalance is vertical or horizontal and explain how the Finance Commission criteria and grants-in-aid address it.',
          questionType: 'Fiscal Devolution Numerical',
        },
      ],
    },
    {
      id: 'pf-mod5-public-debt',
      subjectId: 'ba-karnataka-public-finance',
      title: 'Public Debt, Deficit Financing & Fiscal Sustainability',
      moduleNumber: 5,
      moduleName: 'Module 5: Public Debt',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-pf-mod5-01', 'q-pf-mod5-02'],
      subtopics: [
        'Internal and external debt, and the distinction between debt and deficit',
        'Sources of public debt and the concept of debt servicing',
        'The debt-to-GDP ratio, sustainability and the crowding-out debate',
        'Deficit financing, monetisation of deficit and the RBI-Way and Means Advances',
        'The FRBM framework, the NK Singh Committee and fiscal responsibility',
      ],
      explanationMd: `# Public Debt & Fiscal Sustainability

### Debt versus Deficit
A **deficit** is a flow — the excess of expenditure over receipts in one year. **Debt** is a stock — the accumulated liability from all past deficits plus other borrowings. Deficits add to debt.

### Classification
- **Internal debt**: owed to residents — market loans, treasury bills, small savings, provident funds.
- **External debt**: owed to foreign lenders — multilateral and bilateral loans, commercial borrowings, NRI deposits.

### Debt Servicing and Sustainability
**Debt servicing** is the payment of interest and repayment of principal. Sustainability depends on whether the **growth rate of the economy exceeds the effective interest rate on debt**. If g > r, the debt-to-GDP ratio can stabilise even with a primary deficit; if r > g, a primary surplus is required.

The dynamic of the debt ratio is captured by the change in the debt-to-GDP ratio as the primary deficit plus the differential between the interest rate and the growth rate applied to the existing ratio.

### Crowding Out
Government borrowing raises the demand for loanable funds, pushing up interest rates and displacing private investment. The extent depends on whether the economy is at full employment, the openness of the capital account and the extent of monetisation.

### Deficit Financing
Historically, deficit financing meant drawing down government cash balances or borrowing from the central bank. Since the **RBI Act 1934 was amended in 2006** and the **FRBM Act** came into force, direct monetisation of the central government deficit is prohibited except through **Ways and Means Advances (WMA)** — temporary overdrafts to meet mismatches in receipts and payments, with limits set periodically.

**Automatic monetisation of the deficit** was formally ended by the 1997 agreement between the Government and the RBI, replaced by the WMA scheme.

### The FRBM Framework
The **Fiscal Responsibility and Budget Management Act 2003** mandated a 3% fiscal deficit target and the elimination of the revenue deficit, along with the Medium Term Fiscal Policy Statement and the Fiscal Policy Strategy Statement. The **N.K. Singh Committee (2017)** recommended a debt-to-GDP target of 60% — 40% for the Centre and 20% for the States — by 2023-24, with a fiscal deficit glide path and a debt ceiling as the primary anchor.`,
      formulas: [
        {
          id: 'formula-pf-5',
          label: 'Debt Sustainability Condition',
          formula: 'Debt stabilises when the primary balance offsets (r - g) x debt-to-GDP ratio; sustainable if g > r',
          exampleQ:
            'The debt-to-GDP ratio is 60%, the effective interest rate 8% and nominal GDP growth 10%. What primary balance is needed to stabilise debt?',
          exampleA:
            'Since g exceeds r by 2 percentage points, the required adjustment is (0.08 - 0.10) x 60 = -1.2, i.e. a primary DEFICIT of 1.2% of GDP can be run while still stabilising debt.',
        },
      ],
      tricks: [
        {
          id: 'trick-pf-5',
          title: 'Deficit Is a Flow, Debt Is a Stock',
          trick:
            'Confusing the two is the most common error. A deficit of Rs 16 lakh crore in one year is a flow; the accumulated Rs 150 lakh crore of outstanding liabilities is the stock.',
          whenToUse: 'All public debt questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-pf-9',
          step: 'Step 1: Separate the Flow From the Stock',
          detail:
            'Identify which figures are annual deficits and which are outstanding debt, then compute the debt-to-GDP ratio and the effective interest rate.',
          questionType: 'Debt Sustainability Numerical',
        },
        {
          id: 'solve-pf-10',
          step: 'Step 2: Test Sustainability Against the r Versus g Condition',
          detail:
            'Compare the interest rate with the growth rate, derive the required primary balance and comment on the implications of crowding out and monetisation.',
          questionType: 'Debt Sustainability Numerical',
        },
      ],
    },
  ],

  // ── 6. International Trade & Economics (Sem 3) ──
  'ba-karnataka-intl-trade': [
    {
      id: 'it-mod1-trade-theories',
      subjectId: 'ba-karnataka-intl-trade',
      title: 'Classical & Modern Theories of International Trade',
      moduleNumber: 1,
      moduleName: 'Module 1: Trade Theory',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-it-mod1-01', 'q-it-mod1-02'],
      subtopics: [
        'Mercantilism and the doctrine of the favourable balance of trade',
        "Adam Smith's absolute advantage and David Ricardo's comparative advantage",
        'Opportunity cost, terms of trade and the gains from trade',
        'The Heckscher-Ohlin factor endowment theory and factor price equalisation',
        'The Leontief paradox and new trade theory: economies of scale and product differentiation',
      ],
      explanationMd: `# Theories of International Trade

### Mercantilism
The dominant doctrine from the sixteenth to eighteenth centuries, holding that national wealth consists of precious metals and that a country should export more than it imports. It is a **zero-sum** view: one country's gain is another's loss. Its policy prescription was export promotion with import restriction.

### Absolute Advantage (Adam Smith, 1776)
A country should specialise in producing goods it can make with fewer inputs than others, and trade for the rest. Trade is therefore **positive-sum** — both countries gain. But the theory cannot explain trade when one country is more efficient in every good.

### Comparative Advantage (David Ricardo, 1817)
Even if a country is less efficient in producing everything, it should specialise in the good where its disadvantage is smallest — that is, where its **opportunity cost** is lowest. Both countries then gain from trade. This is the cornerstone result of trade theory: **absolute advantage is irrelevant; only relative opportunity cost matters**.

**Terms of trade** is the ratio of export prices to import prices, and gains from trade are shared depending on where the actual terms settle between the two countries' autarky price ratios.

### Heckscher-Ohlin (Factor Endowment)
A country exports the good that uses its abundant factor intensively. A labour-abundant country exports labour-intensive goods; a capital-abundant country exports capital-intensive goods. The **factor price equalisation theorem** extends this: free trade in goods equalises factor prices across countries even without factor mobility.

### The Leontief Paradox
Wassily Leontief (1953) tested the H-O theory on US data and found that the United States, the most capital-abundant country, exported **labour-intensive** goods. Explanations include the higher skill content of American labour (human capital), technological superiority, and the reversal of factor intensities.

### New Trade Theory
Paul Krugman and others showed that **increasing returns to scale** and **product differentiation** generate trade even between identical countries — explaining intra-industry trade in similar goods, such as automobiles exchanged between Germany and Japan. It also provides a rationale for **strategic trade policy**, though its practical application remains controversial.`,
      formulas: [
        {
          id: 'formula-it-1',
          label: 'Comparative Advantage via Opportunity Cost',
          formula: 'Opportunity cost of X = Units of Y forgone per unit of X; specialise where this ratio is lower',
          exampleQ:
            'In India 10 labour-hours produce either 20 metres of cloth or 10 kg of wheat; in the US the same hours produce 30 metres of cloth or 20 kg of wheat. Who should export what?',
          exampleA:
            'The US has an absolute advantage in both. Opportunity cost of wheat in India is 20/10 = 2 metres of cloth; in the US it is 30/20 = 1.5 metres. The US has the lower opportunity cost in wheat, so the US should export wheat and India cloth, even though the US is more efficient at both.',
        },
      ],
      tricks: [
        {
          id: 'trick-it-1',
          title: 'Compute Opportunity Cost, Not Output',
          trick:
            'Comparative advantage is never determined by who produces more, only by who gives up less. Always convert outputs into the ratio of what is forgone.',
          whenToUse: 'All comparative advantage numericals.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-it-1',
          step: 'Step 1: Tabulate Output Per Unit of Input for Both Countries',
          detail:
            'Set out what each country can produce with the same input, then compute the opportunity cost of each good in terms of the other.',
          questionType: 'Comparative Advantage Numerical',
        },
        {
          id: 'solve-it-2',
          step: 'Step 2: Determine Specialisation and Verify Mutual Gain',
          detail:
            'Assign exports to the lower opportunity cost producer, then confirm both countries consume beyond their autarky production possibility frontier.',
          questionType: 'Comparative Advantage Numerical',
        },
      ],
    },
    {
      id: 'it-mod2-commercial-policy',
      subjectId: 'ba-karnataka-intl-trade',
      title: 'Commercial Policy: Tariffs, Quotas & Protection',
      moduleNumber: 2,
      moduleName: 'Module 2: Trade Policy Instruments',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-it-mod2-01', 'q-it-mod2-02'],
      subtopics: [
        'Tariffs: specific, ad valorem and compound, and their price effects',
        'The consumption, production, revenue and protective effects of a tariff',
        'Non-tariff barriers: quotas, VERs, licensing and technical standards',
        'Arguments for and against protection, including infant industry',
        'Effective rate of protection and the terms-of-trade argument',
      ],
      explanationMd: `# Commercial Policy

### Tariffs
- **Specific duty**: a fixed amount per physical unit.
- **Ad valorem duty**: a percentage of value.
- **Compound duty**: both combined.

A tariff raises the domestic price, so domestic producers gain, domestic consumers lose, the government collects revenue, and society suffers a **deadweight loss** from inefficient domestic production and foregone consumption.

The four effects are:
1. **Production effect**: domestic output expands as high-cost producers enter.
2. **Consumption effect**: consumption contracts as price rises.
3. **Revenue effect**: government tariff receipts.
4. **Protective effect**: the gain to domestic producers from reduced import competition.

### Non-Tariff Barriers
**Quotas** limit quantity directly; unlike tariffs, the revenue accrues to licence holders as **quota rents** rather than to the government. **Voluntary export restraints** are quotas administered by the exporting country, again generating quota rents abroad. Other NTBs include import licensing, technical and sanitary standards, local content requirements and administrative delays.

### Arguments for Protection
- **Infant industry** (Hamilton, List): new industries need temporary shelter to achieve scale and learning effects. The difficulty is knowing when to withdraw protection.
- **Terms-of-trade argument**: a large country can improve its terms of trade by restricting imports, since its reduced demand lowers world prices. This is a beggar-thy-neighbour policy.
- **Employment, defence, diversification and anti-dumping** arguments.

### Arguments Against
Retaliation, higher consumer prices, protection of inefficiency, resource misallocation, rent-seeking, and the risk that "temporary" protection becomes permanent because incumbent industries resist removal.

### Effective Rate of Protection
The **nominal rate** applies to the final product's price, but the **effective rate of protection (ERP)** measures the protection given to the *value added* in domestic production, accounting for tariffs on imported inputs:

ERP = (V' - V) / V, where V is value added at world prices and V' is value added after tariffs.

A tariff on inputs can make the ERP far higher than the nominal rate — and can even be negative.`,
      formulas: [
        {
          id: 'formula-it-2',
          label: 'Effective Rate of Protection',
          formula: 'ERP = (V\u2019 - V) / V, where V = world price - cost of imported inputs; V\u2019 = tariff-inclusive price - tariff-inclusive input cost',
          exampleQ:
            'A car sells at Rs 10 lakh with imported inputs costing Rs 6 lakh at world prices. A 20% tariff applies to cars and 10% to inputs. Compute the ERP.',
          exampleA:
            'V = 10 - 6 = Rs 4 lakh. With tariffs the car price is 12 lakh and inputs cost 6.6 lakh, so V\u2019 = 5.4 lakh. ERP = (5.4 - 4) / 4 = 35%, well above the 20% nominal rate.',
        },
      ],
      tricks: [
        {
          id: 'trick-it-2',
          title: 'Quota Rents Go Abroad, Tariff Revenue Stays Home',
          trick:
            'Under a tariff the government keeps the revenue; under a quota or VER the rent is captured by licence holders or foreign exporters. This is the decisive welfare difference between the two instruments.',
          whenToUse: 'Tariff versus quota comparisons.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-it-3',
          step: 'Step 1: Compute the Pre-Tariff and Post-Tariff Prices and Value Added',
          detail:
            'Establish world prices, apply the tariff rates to the final good and to imported inputs separately.',
          questionType: 'Trade Policy Numerical',
        },
        {
          id: 'solve-it-4',
          step: 'Step 2: Derive the Effective Rate of Protection and Interpret',
          detail:
            'Compare the ERP with the nominal rate and explain how the input tariff structure amplifies or erodes protection for domestic value added.',
          questionType: 'Trade Policy Numerical',
        },
      ],
    },
    {
      id: 'it-mod3-bop',
      subjectId: 'ba-karnataka-intl-trade',
      title: 'Balance of Payments & Exchange Rate Systems',
      moduleNumber: 3,
      moduleName: 'Module 3: Balance of Payments',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-it-mod3-01', 'q-it-mod3-02'],
      subtopics: [
        'Components of the balance of payments: current, capital and financial accounts',
        'The J-curve effect and the Marshall-Lerner condition',
        'Balance of payments disequilibrium and adjustment mechanisms',
        'Exchange rate systems: fixed, floating and the managed float',
        "India's BoP crisis of 1991 and the shift to a market-determined rupee",
      ],
      explanationMd: `# Balance of Payments

### Structure
The BoP is a systematic record of all economic transactions between residents of a country and the rest of the world over a period.

- **Current account**: trade in goods (visible), trade in services (invisible), primary income (investment income, compensation) and secondary income (remittances, transfers).
- **Capital account**: capital transfers and acquisition or disposal of non-produced, non-financial assets.
- **Financial account**: FDI, portfolio investment, other investment and reserve assets.

By construction the BoP **balances** — the current account deficit is financed by financial account inflows or by drawing down reserves. Analysts therefore focus on specific sub-balances: the **trade balance**, the **current account balance** and the **basic balance**.

India's current account is typically in deficit because of oil imports, financed by software service exports and remittances — India is the world's largest recipient of remittances.

### The J-Curve and Marshall-Lerner
After a devaluation, the current account often **worsens before it improves**, tracing a J shape. This is because quantities are slow to adjust while prices change immediately — existing import contracts must be paid at the new, higher rupee price.

The **Marshall-Lerner condition** states that devaluation improves the trade balance only if the sum of the export and import demand elasticities exceeds one in absolute value.

### Disequilibrium and Adjustment
Causes include inflation, cyclical fluctuations, structural change, and large capital flows. Adjustment may occur through **expenditure-reducing** measures (deflationary fiscal and monetary policy) or **expenditure-switching** measures (devaluation, tariffs) that shift demand toward domestic goods.

### Exchange Rate Systems
- **Fixed (pegged)**: the rate is set by the authority, requiring reserves to defend and sacrificing monetary autonomy.
- **Floating**: the market determines the rate; the BoP adjusts automatically but volatility is imported.
- **Managed float**: the market sets the rate with intervention to smooth excessive volatility — the Indian system.

### India's 1991 Crisis
By mid-1991 foreign exchange reserves had fallen to roughly two weeks of imports. India pledged gold as collateral, sought an IMF standby arrangement, and adopted the **New Economic Policy** — liberalisation, privatisation and globalisation. The rupee was devalued in two steps in July 1991 and moved to a **market-determined exchange rate** from March 1993 under the Liberalised Exchange Rate Management System.`,
      formulas: [
        {
          id: 'formula-it-3',
          label: 'Current Account Balance',
          formula: 'Current account = Trade balance + Net services + Net primary income + Net secondary income',
          exampleQ:
            'Trade deficit Rs 1,50,000 crore, net services surplus Rs 1,20,000 crore, net primary income deficit Rs 30,000 crore and net secondary income surplus Rs 60,000 crore. Compute the current account balance.',
          exampleA:
            'Current account = -150,000 + 120,000 - 30,000 + 60,000 = 0. The current account is in balance, with services and remittances fully offsetting the merchandise deficit.',
        },
      ],
      tricks: [
        {
          id: 'trick-it-3',
          title: 'The BoP Always Balances by Construction',
          trick:
            'A current account deficit is not an accounting error — it is financed by financial inflows or reserve drawdown. When a question asks about a "BoP deficit", it means a specific sub-balance, so state which one you are computing.',
          whenToUse: 'All BoP questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-it-5',
          step: 'Step 1: Classify Each Transaction Into the Correct Account',
          detail:
            'Assign every item to the current, capital or financial account, remembering that remittances are secondary income and software exports are services.',
          questionType: 'BoP Numerical',
        },
        {
          id: 'solve-it-6',
          step: 'Step 2: Compute the Required Sub-Balance and Diagnose',
          detail:
            'Compute the trade, current or basic balance, then identify the financing source and recommend an appropriate adjustment policy.',
          questionType: 'BoP Numerical',
        },
      ],
    },
    {
      id: 'it-mod4-wto-regional',
      subjectId: 'ba-karnataka-intl-trade',
      title: 'WTO, Regional Trading Blocs & India\u2019s Trade Policy',
      moduleNumber: 4,
      moduleName: 'Module 4: International Trade Institutions',
      order: 4,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-it-mod4-01', 'q-it-mod4-02'],
      subtopics: [
        'GATT 1947 to WTO 1995: principles, structure and the dispute settlement mechanism',
        'Key agreements: GATT, GATS, TRIPS, TRIMS and the Agreement on Agriculture',
        'The Doha Development Round, and issues of special and differential treatment',
        'Regional blocs: EU, ASEAN, SAARC, RCEP and India\u2019s FTAs',
        "India's Foreign Trade Policy and export promotion instruments",
      ],
      explanationMd: `# The WTO & Regional Trading Blocs

### From GATT to WTO
The **General Agreement on Tariffs and Trade (1947)** was a provisional multilateral agreement operating on non-discrimination through the **most-favoured-nation (MFN)** principle and **national treatment**. Its weaknesses were the absence of an institutional base, the exclusion of services and intellectual property, and a dispute system that a losing party could block.

The **World Trade Organization** was established on **1 January 1995** following the Uruguay Round, with a permanent institutional structure, a binding **dispute settlement mechanism** with an Appellate Body, and a wider scope.

### Core Principles
1. **Most-favoured-nation**: any concession to one member must extend to all (with exceptions for FTAs and preferential schemes).
2. **National treatment**: imported goods must not be taxed or regulated more heavily than domestic ones once they enter the market.
3. **Tariff binding and progressive reduction**.
4. **Prohibition of quantitative restrictions** in general.
5. **Fair competition**, addressing dumping and subsidies.

### Major Agreements
- **GATT 1994**: trade in goods.
- **GATS**: trade in services across four modes — cross-border supply, consumption abroad, commercial presence and presence of natural persons.
- **TRIPS**: minimum standards for intellectual property, controversial for access to medicines.
- **TRIMS**: prohibits investment measures inconsistent with national treatment, such as local content requirements.
- **Agreement on Agriculture**: market access, domestic support in Amber, Blue and Green boxes, and export subsidies.

The **Doha Development Round** (2001) has remained largely stalled over agriculture and industrial tariffs.

### Regional Blocs
Preferential trade areas, free trade areas, customs unions, common markets and economic unions represent increasing integration. Major blocs include the **European Union**, **ASEAN**, **SAARC** and **RCEP** — from which India withdrew in 2019 over concerns about market access and rules of origin. India has bilateral FTAs with Japan, Korea, ASEAN, the UAE (CEPA 2022) and Australia (ECTA 2022).

### India's Foreign Trade Policy
Successive policies — currently **FTP 2023** — pursue export promotion through schemes such as the **Remission of Duties and Taxes on Exported Products (RoDTEP)**, duty-free import authorisations, the **Export Promotion Capital Goods** scheme and **Special Economic Zones**. The stated objective of FTP 2023 is to reach USD 2 trillion in exports by 2030.`,
      formulas: [
        {
          id: 'formula-it-4',
          label: 'GATS Modes of Supply',
          formula: 'Mode 1 Cross-border supply | Mode 2 Consumption abroad | Mode 3 Commercial presence | Mode 4 Presence of natural persons',
          exampleQ:
            'An Indian IT firm delivers software services to a US client from Bengaluru, and separately opens an office in Singapore. Which GATS modes apply?',
          exampleA:
            'The remote delivery from Bengaluru is Mode 1 (cross-border supply). Establishing an office in Singapore is Mode 3 (commercial presence).',
        },
      ],
      tricks: [
        {
          id: 'trick-it-4',
          title: 'MFN Has an FTA Exception',
          trick:
            'The MFN principle would otherwise make FTAs illegal. Article XXIV of GATT permits FTAs and customs unions provided they cover substantially all trade and do not raise barriers against outsiders.',
          whenToUse: 'WTO principle questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-it-7',
          step: 'Step 1: Identify the Agreement and the Principle Breached',
          detail:
            'Determine whether the issue concerns goods, services, intellectual property or investment, then name the specific WTO obligation at stake.',
          questionType: 'Trade Policy Case Analysis',
        },
        {
          id: 'solve-it-8',
          step: 'Step 2: Assess the Exception and India\u2019s Position',
          detail:
            'Test whether an exception applies — Article XXIV, special and differential treatment, safeguards — and evaluate India\u2019s policy response in the Doha context.',
          questionType: 'Trade Policy Case Analysis',
        },
      ],
    },
    {
      id: 'it-mod5-forex-fdi',
      subjectId: 'ba-karnataka-intl-trade',
      title: 'Foreign Exchange, FDI & International Finance',
      moduleNumber: 5,
      moduleName: 'Module 5: International Finance',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-it-mod5-01', 'q-it-mod5-02'],
      subtopics: [
        'Foreign exchange markets, spot and forward rates, and exchange rate quotation',
        'Purchasing power parity, interest rate parity and the real effective exchange rate',
        'FEMA 1999, FDI policy, the automatic and government routes, and sectors',
        'The IMF, World Bank Group and the role of the RBI in forex management',
        'India\u2019s forex reserves composition and the trilemma of open economy macroeconomics',
      ],
      explanationMd: `# Foreign Exchange, FDI & International Finance

### Exchange Rate Quotation
- **Direct quote**: units of domestic currency per unit of foreign currency (Rs 83 per USD).
- **Indirect quote**: units of foreign currency per unit of domestic currency.
- **Spot** transactions settle within two business days; **forward** contracts fix a rate for future settlement and are used to hedge transaction exposure.

A rise in the rupee price of the dollar is **depreciation** under a floating system and **devaluation** under a fixed system.

### Parity Conditions
- **Purchasing power parity (PPP)**: exchange rates adjust so that identical baskets cost the same in both countries. Absolute PPP holds that the exchange rate equals the ratio of price levels; relative PPP that the change in the rate equals the inflation differential.
- **Interest rate parity**: the forward premium or discount on a currency equals the interest rate differential, so covered arbitrage yields no riskless profit.
- The **real effective exchange rate (REER)** is a trade-weighted index of the rupee against a basket of currencies, adjusted for relative prices — the RBI's preferred measure of competitiveness.

### FEMA and FDI
The **Foreign Exchange Management Act 1999** replaced the restrictive FERA 1973, treating exchange violations as civil rather than criminal and facilitating external trade and payments.

**FDI** enters India through:
- the **automatic route** — no prior approval for most sectors, subject to caps and conditions; or
- the **government route** — approval required for sensitive sectors, and for investment from countries sharing a land border with India under **Press Note 3 (2020)**.

Instruments include equity, fully and optionally convertible debentures and preference shares. FPI is governed separately under SEBI regulations.

### Institutions
The **IMF** provides balance of payments support and surveillance; the **World Bank Group** — IBRD, IDA, IFC, MIGA and ICSID — finances development. The RBI manages India's foreign exchange reserves under the **RBI Act 1934** and administers FEMA.

### Reserve Composition
India's reserves comprise **foreign currency assets**, **gold**, **Special Drawing Rights** and the **reserve position in the IMF**.

### The Impossible Trinity
A country cannot simultaneously maintain a **fixed exchange rate**, **free capital mobility** and an **independent monetary policy** — it must forgo one. India's managed float with capital controls reflects a middle solution, preserving some monetary autonomy while smoothing exchange rate volatility.`,
      formulas: [
        {
          id: 'formula-it-5',
          label: 'Covered Interest Rate Parity',
          formula: 'Forward rate = Spot rate x (1 + domestic interest rate) / (1 + foreign interest rate)',
          exampleQ:
            'The spot rate is Rs 83 per USD, the Indian interest rate 7% and the US rate 3%. Compute the one-year forward rate.',
          exampleA:
            'Forward = 83 x (1.07 / 1.03) = 83 x 1.0388 = Rs 86.22 per USD. The rupee trades at a forward discount because Indian interest rates are higher.',
        },
      ],
      tricks: [
        {
          id: 'trick-it-5',
          title: 'Higher Interest Rate Currency Trades at a Forward Discount',
          trick:
            'Under covered interest parity the currency with the HIGHER interest rate is expected to depreciate — that is exactly what prevents riskless arbitrage. Many students reverse this.',
          whenToUse: 'Forward rate and interest parity problems.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-it-9',
          step: 'Step 1: Identify the Parity Condition and the Given Variables',
          detail:
            'Establish whether the question concerns PPP, interest parity or the REER, and list the spot rate, interest rates or price levels supplied.',
          questionType: 'International Finance Numerical',
        },
        {
          id: 'solve-it-10',
          step: 'Step 2: Compute and Interpret in Terms of Premium or Discount',
          detail:
            'Apply the parity formula, state whether the currency is at a forward premium or discount, and explain the arbitrage logic that enforces the condition.',
          questionType: 'International Finance Numerical',
        },
      ],
    },
  ],

  // ── 7. Development Economics (Sem 4) ──
  'ba-karnataka-development-econ': [
    {
      id: 'dev-mod1-growth-development',
      subjectId: 'ba-karnataka-development-econ',
      title: 'Economic Growth vs Development & Human Development',
      moduleNumber: 1,
      moduleName: 'Module 1: Concept and Measurement of Development',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-dev-mod1-01', 'q-dev-mod1-02'],
      subtopics: [
        'Meaning of economic growth, economic development and sustainable development',
        'Growth versus development: quantity versus quality of output',
        'The Human Development Index: dimensions, indicators and calculation',
        'Alternative indices: GDI, GEM, MPI, PQLI and the Gender Development Index',
        'The capability approach of Amartya Sen and the Sustainable Development Goals',
      ],
      explanationMd: `# Growth, Development & Human Development

### Growth versus Development
**Economic growth** is a quantitative, single-dimensional increase in real output per head. **Economic development** is a multi-dimensional transformation involving rising per capita income together with structural change, poverty reduction, improved health and education, greater equality and institutional change. Development therefore encompasses growth but is not reducible to it — a country can grow rapidly while poverty and inequality persist.

**Sustainable development**, as defined by the Brundtland Commission (1987), is development that meets the needs of the present without compromising the ability of future generations to meet theirs.

### The Human Development Index
Introduced by Mahbub ul Haq in 1990, the HDI measures achievement in three dimensions:
1. **Long and healthy life** — life expectancy at birth.
2. **Knowledge** — mean years of schooling and expected years of schooling.
3. **A decent standard of living** — GNI per capita in PPP terms.

The HDI is the **geometric mean** of the three normalised dimension indices, each scaled between a minimum and maximum value. The geometric mean penalises imbalance between dimensions, unlike the earlier arithmetic mean.

HDI values range from 0 to 1; countries above 0.800 are classified as **very high human development**.

### Alternative Indices
- **GDI**: the HDI computed separately for women and men.
- **GEM / GII**: women's participation in economic and political life.
- **MPI (Multidimensional Poverty Index)**: deprivations across health, education and living standards, replacing income with direct measures.
- **PQLI**: life expectancy, infant mortality and literacy — the earliest attempt to look beyond income.

### Sen's Capability Approach
Amartya Sen argued that development should be assessed as the **expansion of human capabilities** — the real freedoms people have to lead lives they value — rather than as the accumulation of commodities or utility. Functionings are what people actually do and are; capabilities are the sets of functionings available to them. Income matters only instrumentally, and conversion rates from income to capability differ across individuals.

### The SDGs
The **2030 Agenda** adopted in 2015 sets out 17 Sustainable Development Goals covering poverty, hunger, health, education, gender equality, clean water, energy, work, inequality, cities, consumption, climate, oceans, land, institutions and partnerships.`,
      formulas: [
        {
          id: 'formula-dev-1',
          label: 'Human Development Index',
          formula: 'HDI = (Health index x Education index x Income index)^(1/3); each index = (Actual - Min) / (Max - Min)',
          exampleQ:
            'A country has normalised indices of 0.800 for health, 0.625 for education and 0.729 for income. Compute the HDI.',
          exampleA:
            'HDI = (0.800 x 0.625 x 0.729)^(1/3) = (0.3645)^(1/3) = 0.714, placing the country in the high human development band.',
        },
      ],
      tricks: [
        {
          id: 'trick-dev-1',
          title: 'The HDI Uses the GEOMETRIC Mean',
          trick:
            'Since 2010 the HDI is the cube root of the product of the three dimension indices, not their arithmetic average. Using the arithmetic mean gives a higher and wrong answer.',
          whenToUse: 'All HDI calculations.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-dev-1',
          step: 'Step 1: Normalise Each Dimension Index',
          detail:
            'Apply (Actual - Min) / (Max - Min) to each of the health, education and income indicators using the published bounds.',
          questionType: 'HDI Numerical',
        },
        {
          id: 'solve-dev-2',
          step: 'Step 2: Take the Cube Root of the Product and Classify',
          detail:
            'Multiply the three indices, take the cube root, and classify the result against the UNDP bands (very high above 0.800, high 0.700-0.799, medium 0.550-0.699, low below 0.550).',
          questionType: 'HDI Numerical',
        },
      ],
    },
    {
      id: 'dev-mod2-poverty',
      subjectId: 'ba-karnataka-development-econ',
      title: 'Poverty, Unemployment & Inequality',
      moduleNumber: 2,
      moduleName: 'Module 2: Poverty and Inequality',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-dev-mod2-01', 'q-dev-mod2-02'],
      subtopics: [
        'Absolute, relative and multidimensional poverty, and poverty lines in India',
        'Measurement: headcount ratio, poverty gap, Sen index and the MPI',
        'Lorenz curve, Gini coefficient and the Palma ratio',
        'Types and measurement of unemployment in India',
        'The vicious circle of poverty and strategies for poverty alleviation',
      ],
      explanationMd: `# Poverty, Unemployment & Inequality

### Concepts of Poverty
- **Absolute poverty**: consumption below a fixed subsistence threshold, invariant to others' incomes.
- **Relative poverty**: income below some fraction of the median, so it persists even in rich societies.
- **Multidimensional poverty**: simultaneous deprivation across health, education and living standards.

### India's Poverty Lines
The **Alagh Committee (1979)** set calorie norms of 2,400 kcal rural and 2,100 kcal urban. The **Lakdawala Committee (1993)** recommended state-specific poverty lines deflated by CPI-AL and CPI-IW. The **Tendulkar Committee (2009)** shifted from calorie anchoring to a cost-of-basic-needs approach and applied a uniform reference period, giving a 2004-05 poverty rate of 37.2%. The **Rangarajan Committee (2014)** restored calorie norms with additional non-food items.

The World Bank's **international poverty line** is now USD 2.15 per day in 2017 PPP terms.

### Measurement
- **Headcount ratio (H)**: the proportion of the population below the line.
- **Poverty gap**: the average shortfall below the line, measuring depth.
- **Sen index**: combines incidence, depth and inequality among the poor.
- **MPI**: a person is poor if deprived in a third or more of the weighted indicators; the MPI is incidence multiplied by average intensity.

### Inequality
The **Lorenz curve** plots the cumulative share of income against the cumulative share of the population; the **Gini coefficient** is the ratio of the area between the curve and the line of equality to the total area under that line, ranging from 0 (perfect equality) to 1 (perfect inequality). The **Palma ratio** is the income share of the top 10% divided by that of the bottom 40%.

### Unemployment in India
Measured by the **Periodic Labour Force Survey** using usual status (a year reference), current weekly status and current daily status. **Disguised unemployment** prevails in agriculture, where marginal productivity of labour approaches zero. **Educated unemployment** reflects a mismatch between qualifications and available jobs.

### The Vicious Circle of Poverty
Nurske described it as low income leading to low saving, low investment, low productivity and back to low income. **Rosenstein-Rodan's big push** argued that a large, coordinated investment programme across complementary industries is required to break out, since incremental investment cannot overcome indivisibilities.`,
      formulas: [
        {
          id: 'formula-dev-2',
          label: 'Gini Coefficient and Headcount Ratio',
          formula: 'Gini = A / (A + B), where A is the area between the equality line and the Lorenz curve; Headcount ratio = Poor / Total population',
          exampleQ:
            'In a population of 400 million, 88 million are below the poverty line. Compute the headcount ratio and interpret a Gini of 0.35.',
          exampleA:
            'Headcount ratio = 88 / 400 = 0.22, or 22%. A Gini of 0.35 indicates moderate inequality — better than many Latin American economies but above East Asian peers.',
        },
      ],
      tricks: [
        {
          id: 'trick-dev-2',
          title: 'A Higher Calorie Norm Raises the Poverty Line and the Count',
          trick:
            'Switching from the Tendulkar to the Rangarajan line raised the measured poverty rate purely because the norm became stricter, not because people became poorer. Always state which line you are using.',
          whenToUse: 'Indian poverty measurement questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-dev-3',
          step: 'Step 1: Identify the Poverty Concept and Line in Use',
          detail:
            "Establish whether the measure is absolute, relative or multidimensional, and which Indian committee's line or World Bank threshold applies.",
          questionType: 'Poverty Measurement Numerical',
        },
        {
          id: 'solve-dev-4',
          step: 'Step 2: Compute the Index and Interpret With Caution',
          detail:
            'Calculate the headcount ratio, poverty gap or Gini, then comment on what the measure captures and what it omits.',
          questionType: 'Poverty Measurement Numerical',
        },
      ],
    },
    {
      id: 'dev-mod3-agriculture',
      subjectId: 'ba-karnataka-development-econ',
      title: 'Agricultural Development & Rural Economy',
      moduleNumber: 3,
      moduleName: 'Module 3: Agriculture and Rural Development',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-dev-mod3-01', 'q-dev-mod3-02'],
      subtopics: [
        'Role of agriculture in the Indian economy and its declining share',
        'Land reforms: abolition of intermediaries, tenancy reform and ceilings',
        'The Green Revolution and the White Revolution (Operation Flood)',
        'MSP, APMC markets, e-NAM and agricultural marketing',
        'Rural credit: NABARD, cooperative banks, SHGs and microfinance',
      ],
      explanationMd: `# Agricultural Development & the Rural Economy

### The Structural Shift
Agriculture's share of Indian GDP has fallen to around 18%, yet it still employs roughly 45% of the workforce. This gap between output and employment share is the defining feature of India's structural transformation and the source of low agricultural labour productivity.

**Lewis's dual economy model** explains this: surplus labour in the traditional sector can be transferred to the modern sector at a constant wage until the surplus is exhausted, at which point wages rise — the **Lewis turning point**.

### Land Reforms
Post-independence land reform had four components: abolition of intermediaries (zamindari, jagirdari), tenancy regulation with security of tenure and fair rents, land ceiling legislation, and consolidation of fragmented holdings. Success was uneven: intermediaries were largely abolished but ceilings were widely evaded through benami transfers. **Karnataka's Land Reforms Act 1961** was among the more effective, particularly the 1974 amendment granting ownership to tenants.

### The Green Revolution
From the mid-1960s, high-yielding variety seeds, irrigation, fertiliser and assured procurement raised foodgrain output substantially, making India self-sufficient. **M.S. Swaminathan** is regarded as its architect in India and **Norman Borlaug** internationally. The costs were regional concentration in Punjab, Haryana and western UP, falling water tables, soil degradation and widened inequality between large and small farmers.

**Operation Flood (1970-1996)**, led by **Verghese Kurien**, made India the world's largest milk producer through the cooperative model of Amul and the National Dairy Development Board — the **White Revolution**.

### Marketing and MSP
The **Minimum Support Price** is announced by the Government on the recommendation of the **Commission for Agricultural Costs and Prices (CACP)**, using A2, A2+FL and C2 cost formulas. Procurement at MSP operates mainly for wheat and rice, which critics argue distorts cropping patterns. **APMC Acts** govern wholesale markets; **e-NAM** integrates mandis electronically to improve price discovery.

### Rural Credit
**NABARD** (1982) refinances agricultural credit. The structure comprises cooperative banks, regional rural banks and commercial banks. The **Self-Help Group-Bank Linkage Programme** (1992) and microfinance institutions such as **SKS** and **Bandhan** expanded small credit, though the **Andhra Pradesh microfinance crisis of 2010** exposed problems of over-indebtedness and coercive recovery.`,
      formulas: [
        {
          id: 'formula-dev-3',
          label: 'CACP Cost Formulas',
          formula: 'A2 = paid-out costs; A2+FL = A2 + imputed family labour; C2 = A2+FL + imputed rent on owned land + interest on owned capital',
          exampleQ:
            'Paid-out costs are Rs 800 per quintal, family labour Rs 300, imputed rent Rs 150 and interest on owned capital Rs 100. Compute A2, A2+FL and C2.',
          exampleA:
            'A2 = Rs 800. A2+FL = Rs 1,100. C2 = 1,100 + 150 + 100 = Rs 1,350. Farmer organisations demand MSP at 1.5 times C2, which would be Rs 2,025.',
        },
      ],
      tricks: [
        {
          id: 'trick-dev-3',
          title: 'C2 Is the Broadest Cost, and the 1.5x Demand Is on C2',
          trick:
            'The Swaminathan Commission formula is 1.5 times C2 — not A2 or A2+FL. Getting the base right is the whole answer.',
          whenToUse: 'MSP and agricultural cost questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-dev-5',
          step: 'Step 1: Identify the Cost Formula Required',
          detail:
            'Determine whether the question uses A2, A2+FL or C2, and add only the components that formula includes.',
          questionType: 'Agricultural Economics Numerical',
        },
        {
          id: 'solve-dev-6',
          step: 'Step 2: Compute the MSP and Evaluate the Policy',
          detail:
            'Apply the multiplier to the correct cost base, then assess the incentive, fiscal and environmental implications of the resulting MSP.',
          questionType: 'Agricultural Economics Numerical',
        },
      ],
    },
    {
      id: 'dev-mod4-industrialisation',
      subjectId: 'ba-karnataka-development-econ',
      title: 'Industrialisation, MSMEs & the Service Sector',
      moduleNumber: 4,
      moduleName: 'Module 4: Industry and Services',
      order: 4,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-dev-mod4-01', 'q-dev-mod4-02'],
      subtopics: [
        'Industrial policy: 1948, 1956, 1991 and the New Industrial Policy',
        'The MSME sector: classification, contribution and the Udyam registration',
        'Cluster development, industrial corridors and the PLI scheme',
        'The service sector-led growth model and its employment limits',
        'Make in India, ease of doing business and skill development',
      ],
      explanationMd: `# Industrialisation, MSMEs & Services

### Industrial Policy
- **1948 Policy**: a mixed economy with the State reserving key industries.
- **1956 Policy**: the "economic constitution", classifying industries into three schedules by the extent of State control.
- **1991 Policy**: the landmark liberalisation — abolition of industrial licensing for all but a few sectors, reduction of public sector reservations from 17 to 3 (now 2), disinvestment, opening to FDI and the removal of MRTP thresholds.
- **Draft National Industrial Policy 2019** and sectoral policies such as the **Production Linked Incentive (PLI)** scheme, introduced in 2020 across 14 sectors, subsidise incremental sales to build scale.

### The MSME Sector
Micro, small and medium enterprises contribute around 30% of GDP, over 45% of exports and more than 110 million jobs. Since **July 2020** classification is composite — based on **investment in plant and machinery plus annual turnover** — with micro units up to Rs 1 crore investment and Rs 5 crore turnover, small up to Rs 10 crore and Rs 50 crore, and medium up to Rs 50 crore and Rs 250 crore.

The **Udyam** portal replaced Udyog Aadhaar for registration. The **45-day payment rule** under the MSMED Act 2006 requires buyers to pay MSME suppliers within 45 days, with compound interest for default.

### Clusters and Corridors
**Industrial clusters** concentrate related firms geographically, generating external economies of scale and shared infrastructure — Bengaluru's electronics and software cluster, Tiruppur's knitwear, Surat's textiles. **Industrial corridors** such as Delhi-Mumbai (DMIC), Chennai-Bengaluru and Bengaluru-Mumbai integrate infrastructure with manufacturing nodes.

### Service-Led Growth
India skipped the classic manufacturing-led transition: services rose to over 50% of GDP while manufacturing remained near 15-17%. This limits employment absorption because modern services are skill-intensive rather than labour-intensive — a central concern in the development debate.

### Policy Initiatives
**Make in India (2014)** targets manufacturing-led job creation. **Ease of doing business** reforms improved India's World Bank ranking from 142 (2014) to 63 (2019). **Skill India** and the **Pradhan Mantri Kaushal Vikas Yojana** address the employability gap; **Startup India** supports entrepreneurship with tax exemptions and a fund of funds.`,
      formulas: [
        {
          id: 'formula-dev-4',
          label: 'MSME Classification Thresholds (July 2020)',
          formula: 'Micro: investment ≤ Rs 1 crore, turnover ≤ Rs 5 crore | Small: ≤ Rs 10 crore, ≤ Rs 50 crore | Medium: ≤ Rs 50 crore, ≤ Rs 250 crore',
          exampleQ:
            'A firm has plant and machinery investment of Rs 8 crore and annual turnover of Rs 40 crore. Classify it.',
          exampleA:
            'Investment is within the small-enterprise limit of Rs 10 crore and turnover within Rs 50 crore, so it is a SMALL enterprise. Both criteria must be satisfied.',
        },
      ],
      tricks: [
        {
          id: 'trick-dev-4',
          title: 'Both Criteria Must Be Met, and the Higher Class Wins',
          trick:
            'MSME classification is composite: if either investment OR turnover exceeds a threshold, the firm moves to the next class. Testing only investment is the common error.',
          whenToUse: 'MSME classification questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-dev-7',
          step: 'Step 1: Test Investment and Turnover Separately',
          detail:
            'Compare each figure with the micro, small and medium limits and take the higher of the two classifications.',
          questionType: 'MSME Classification Problem',
        },
        {
          id: 'solve-dev-8',
          step: 'Step 2: State the Classification and Its Consequences',
          detail:
            'Name the class and identify the benefits that follow — priority sector lending, the 45-day payment protection and eligibility for cluster schemes.',
          questionType: 'MSME Classification Problem',
        },
      ],
    },
    {
      id: 'dev-mod5-planning-sdg',
      subjectId: 'ba-karnataka-development-econ',
      title: 'Planning, NITI Aayog & Sustainable Development',
      moduleNumber: 5,
      moduleName: 'Module 5: Planning and Sustainable Development',
      order: 5,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-dev-mod5-01', 'q-dev-mod5-02'],
      subtopics: [
        'Objectives and types of planning, and the Planning Commission era',
        'The Five Year Plans: highlights from the First to the Twelfth',
        'NITI Aayog: structure, functions and the shift from centralised planning',
        'The Sustainable Development Goals and India\u2019s SDG Index',
        'Environmental economics: externalities, the polluter pays principle and green accounting',
      ],
      explanationMd: `# Planning & Sustainable Development

### Planning in India
The **Planning Commission** was established by a Cabinet resolution on **15 March 1950**, with the Prime Minister as chairperson. India adopted **indicative and democratic planning** within a mixed economy rather than Soviet-style command planning.

The **First Plan (1951-56)** applied the **Harrod-Domar** model and prioritised agriculture and irrigation. The **Second Plan (1956-61)** applied the **Feldman-Mahalanobis** model, emphasising heavy industry and capital goods — a decisive and contested choice. The **Third Plan (1961-66)** introduced the concept of a self-reliant and self-generating economy but was disrupted by war and drought, leading to three **Plan Holidays (1966-69)**. The **Fifth Plan (1974-79)** emphasised "garibi hatao" and growth with justice, and was terminated a year early. The **Eighth Plan (1992-97)** coincided with liberalisation. The **Twelfth Plan (2012-17)** was the last, themed "Faster, Sustainable and More Inclusive Growth".

### NITI Aayog
The **National Institution for Transforming India** replaced the Planning Commission on **1 January 2015**. The differences are fundamental:
- It is a **think tank** providing policy inputs, not an allocating body with plan funds.
- It operates on **cooperative and competitive federalism**, with State chief ministers on its Governing Council.
- It does not allocate resources — that rests with the Finance Ministry.
- It emphasises **bottom-up** formulation rather than top-down targets.

Its outputs include the **Three-Year Action Agenda**, the **Seven-Year Strategy** and the **Fifteen-Year Vision Document**, along with indices such as the **SDG India Index**, the **Composite Water Management Index** and the **Health Index**.

### Sustainable Development
The **SDGs** comprise 17 goals and 169 targets for 2030, adopted in September 2015. India's performance is tracked by NITI Aayog's **SDG India Index**, which scores States and Union Territories.

### Environmental Economics
**Externalities** arise when a transaction imposes costs or benefits on third parties. **Pigouvian taxes** internalise negative externalities by taxing the polluter at the marginal social damage. The **polluter pays principle**, endorsed at Rio 1992, allocates abatement costs to the polluter. The **Coase theorem** holds that with well-defined property rights and zero transaction costs, private bargaining achieves efficiency without intervention — rarely satisfied in practice.

**Green accounting** adjusts national income for resource depletion and environmental degradation, producing a **Net National Product after environmental adjustment**. India's **Green India Mission** and the **Compensatory Afforestation Fund** are practical instruments.`,
      formulas: [
        {
          id: 'formula-dev-5',
          label: 'Harrod-Domar Growth Model',
          formula: 'Growth rate (g) = Savings rate (s) / Capital-output ratio (k)',
          exampleQ:
            'The savings rate is 24% and the incremental capital-output ratio is 4. Compute the achievable growth rate.',
          exampleA:
            'g = 0.24 / 4 = 0.06, or 6% per annum. Raising the savings rate or lowering the capital-output ratio is the only way to raise this growth rate within the model.',
        },
      ],
      tricks: [
        {
          id: 'trick-dev-5',
          title: 'NITI Aayog Does NOT Allocate Funds',
          trick:
            'The single most important distinction from the Planning Commission is that NITI Aayog has no power to allocate plan resources — that function moved to the Finance Ministry. It advises; it does not sanction.',
          whenToUse: 'Planning institution questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-dev-9',
          step: 'Step 1: Identify the Plan, Model and Objective',
          detail:
            'Match the period with the plan number, the growth model applied and its stated objective, and note the outcomes achieved.',
          questionType: 'Planning and Development Question',
        },
        {
          id: 'solve-dev-10',
          step: 'Step 2: Evaluate Outcomes and the Contemporary Framework',
          detail:
            'Assess whether the objective was met, then relate the historical experience to the NITI Aayog framework and the SDGs.',
          questionType: 'Planning and Development Question',
        },
      ],
    },
  ],

  // ── 8. Indian Economy & NEP (Sem 4) ──
  'ba-karnataka-indian-economy': [
    {
      id: 'ind-mod1-economic-reforms',
      subjectId: 'ba-karnataka-indian-economy',
      title: 'Economic Reforms, LPG & Structural Transformation',
      moduleNumber: 1,
      moduleName: 'Module 1: Liberalisation and Reform',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-ind-mod1-01', 'q-ind-mod1-02'],
      subtopics: [
        'The pre-1991 licence-permit raj and its consequences',
        'The 1991 balance of payments crisis and the IMF conditionality',
        'Liberalisation, privatisation and globalisation: the reform package',
        'Sectoral reforms: industrial, financial, trade, tax and labour',
        'Assessment of reforms: growth, inequality and structural change',
      ],
      explanationMd: `# Economic Reforms in India

### The Pre-Reform Regime
From the 1950s to 1991 India operated a controlled economy characterised by the **licence-permit raj**: industrial licensing under the Industries (Development and Regulation) Act 1951, import licensing, high tariff walls, MRTP restrictions on firm size, and extensive public sector reservation. The consequences were low growth — the "**Hindu rate of growth**" of about 3.5% per year, a term coined by **K.N. Raj** — rent-seeking, and technological stagnation.

### The 1991 Crisis
By June 1991 foreign exchange reserves had fallen to about USD 1.2 billion, enough for roughly **two weeks of imports**. The Gulf War had raised the oil bill, remittances had collapsed and the fiscal deficit had widened. India pledged gold to the Union Bank of Switzerland and obtained an IMF **Standby Arrangement** and a World Bank **Structural Adjustment Loan**, both conditional on reform.

### The Reform Package
Announced through the **New Economic Policy of July 1991** under Prime Minister P.V. Narasimha Rao and Finance Minister **Dr Manmohan Singh**:

**Liberalisation**: abolition of industrial licensing except in a few sectors, reduction of public sector reservations from 17 to 3, freedom to decide scale of activity, removal of MRTP thresholds, and interest rate deregulation.

**Privatisation**: disinvestment in public sector enterprises, reduction of reserved industries and greater autonomy through the Maharatna, Navratna and Miniratna classifications.

**Globalisation**: reduction of peak customs duty from over 200% to a peak of 10-15%, rupee devaluation in two steps in July 1991, the move to a market-determined exchange rate from 1993, current account convertibility in 1993-94 under **Article VIII of the IMF Articles of Agreement**, and progressive opening to FDI.

### Subsequent Reforms
The **Narasimham Committee** reports (1991, 1998) reformed banking through prudential norms, capital adequacy and reduced statutory pre-emptions. The **Kelkar Committee** informed tax reform, culminating in **GST in 2017**. The **IBC 2016** created a time-bound insolvency resolution framework. The **FEMA 1999** replaced FERA.

### Assessment
Growth accelerated from about 3.5% to an average near 6-7%, with peaks above 8% in the mid-2000s, and services became the largest sector. Poverty fell substantially. However, jobless growth in manufacturing, rising inequality, agrarian distress and regional divergence remain unresolved. The critique from the left emphasises the erosion of employment security and public provision; from the right, that reforms stopped short of land, labour and agricultural markets.`,
      formulas: [
        {
          id: 'formula-ind-1',
          label: 'Import Cover of Foreign Exchange Reserves',
          formula: 'Import cover (months) = Foreign exchange reserves / (Annual imports / 12)',
          exampleQ:
            'In June 1991 reserves were USD 1.2 billion and annual imports USD 72 billion. Compute the import cover.',
          exampleA:
            'Monthly imports = 72 / 12 = USD 6 billion. Import cover = 1.2 / 6 = 0.2 months, or roughly 6 days — against the prudential norm of three months. This is the arithmetic of the crisis.',
        },
      ],
      tricks: [
        {
          id: 'trick-ind-1',
          title: 'Hindu Rate of Growth Is 3.5%, Coined by K.N. Raj',
          trick:
            'The phrase refers to the pre-1991 per capita growth of about 3.5% and was coined by the economist K.N. Raj — not by a religious reference. Attributing it correctly is often examined.',
          whenToUse: 'Reform history questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ind-1',
          step: 'Step 1: Establish the Pre-Reform Baseline and the Trigger',
          detail:
            'Describe the licence regime and quantify the 1991 reserve and fiscal position that forced reform.',
          questionType: 'Economic Reform Analysis',
        },
        {
          id: 'solve-ind-2',
          step: 'Step 2: Set Out the Reform Package and Balance the Assessment',
          detail:
            'Present the L, P and G measures with specific policy changes, then weigh the growth gains against the persistent structural weaknesses.',
          questionType: 'Economic Reform Analysis',
        },
      ],
    },
    {
      id: 'ind-mod2-money-inflation',
      subjectId: 'ba-karnataka-indian-economy',
      title: 'Money, Banking, RBI & Inflation Targeting',
      moduleNumber: 2,
      moduleName: 'Module 2: Monetary Sector',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-ind-mod2-01', 'q-ind-mod2-02'],
      subtopics: [
        'RBI: history, functions, autonomy and the monetary policy framework',
        'Money supply M1 to M4, and monetary aggregates in India',
        'Policy instruments: repo, reverse repo, SDF, MSF, CRR and SLR',
        'Flexible inflation targeting under the RBI Act amendment 2016',
        'NPAs, the IBC 2016, and financial inclusion under Jan Dhan Yojana',
      ],
      explanationMd: `# Money, Banking & the RBI

### The Reserve Bank of India
Established on **1 April 1935** under the RBI Act 1934 on the recommendations of the **Hilton Young Commission**, and nationalised in 1949. Its functions are currency issue, banker to the government, banker to banks, custodian of foreign exchange, regulator and supervisor of the financial system, and controller of credit. The **Banking Regulation Act 1949** governs commercial banks; **NABARD (1982)**, **SIDBI (1990)**, **EXIM Bank (1982)** and **NHB (1988)** are the apex development institutions.

### Monetary Aggregates
- **M1** = currency with the public + demand deposits + other deposits with the RBI.
- **M2** = M1 + post office savings deposits.
- **M3** = M1 + time deposits with banks (the RBI's working definition of broad money).
- **M4** = M3 + total post office deposits.

M1 is **narrow money**; M3 is **broad money**. The RBI transitioned to a **multiple indicator approach** in 1999 before adopting inflation targeting.

### Policy Instruments
- **Repo rate**: the rate at which the RBI lends short-term against government securities — the primary policy signal.
- **Reverse repo rate**: the rate at which the RBI absorbs liquidity.
- **Standing Deposit Facility (SDF)**: introduced in 2022, absorbs liquidity without collateral; forms the **floor** of the LAF corridor.
- **Marginal Standing Facility (MSF)**: banks can borrow overnight against SLR securities at a penal rate; forms the **ceiling**.
- **CRR**: the cash share of deposits held with the RBI, earning no interest.
- **SLR**: the share of deposits held in cash, gold or approved securities, currently 18%.

The **LAF corridor** is bounded by the SDF and MSF rates around the repo rate.

### Inflation Targeting
The **RBI Act was amended in 2016** to introduce **flexible inflation targeting**, based on the **Urjit Patel Committee** recommendations. The target is **CPI inflation of 4% with a tolerance band of 2-6%**, set jointly by the Government and the RBI for five-year periods. The **Monetary Policy Committee (MPC)**, comprising six members — three from the RBI and three external — decides the policy rate by majority, with the Governor holding a casting vote.

### NPAs and Resolution
Non-performing assets are classified as **sub-standard, doubtful and loss** assets. Provisions follow IRAC norms. The **Insolvency and Bankruptcy Code 2016** created a creditor-in-control, time-bound resolution process, superseding earlier mechanisms such as CDR, SDR and S4A. The **Asset Quality Review of 2015** ended forbearance and revealed the true extent of stress.

### Financial Inclusion
The **Pradhan Mantri Jan Dhan Yojana (2014)** opened over 500 million bank accounts. Together with **Aadhaar** and **mobile connectivity** — the **JAM trinity** — and the **UPI** payment system launched in 2016, it enabled direct benefit transfers that reduced leakage in subsidy delivery.`,
      formulas: [
        {
          id: 'formula-ind-2',
          label: 'Money Multiplier and LAF Corridor',
          formula: 'Money multiplier = 1 / CRR (simple form); LAF corridor = SDF (floor) to MSF (ceiling) around the repo rate',
          exampleQ:
            'The CRR is 4.5% and an initial deposit of Rs 1,000 crore enters the system. Estimate the simple deposit expansion.',
          exampleA:
            'Multiplier = 1 / 0.045 = 22.2. Maximum expansion = 1,000 x 22.2 = Rs 22,222 crore. The actual expansion is lower because of cash leakage and excess reserves held by banks.',
        },
      ],
      tricks: [
        {
          id: 'trick-ind-2',
          title: 'The Inflation Target Is CPI, Not WPI',
          trick:
            'Since 2016 the RBI targets CPI inflation at 4% (band 2-6%). Before that it targeted WPI. If a question gives WPI data, say the target framework does not apply to it.',
          whenToUse: 'Monetary policy questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ind-3',
          step: 'Step 1: Identify the Instrument and Its Position in the Corridor',
          detail:
            'Establish whether the change concerns the repo rate, the SDF, the MSF, the CRR or the SLR, and how it shifts liquidity conditions.',
          questionType: 'Monetary Policy Analysis',
        },
        {
          id: 'solve-ind-4',
          step: 'Step 2: Trace the Transmission to Inflation and Output',
          detail:
            'Follow the chain from the policy rate through bank lending rates to credit growth, demand and CPI inflation, and note transmission frictions.',
          questionType: 'Monetary Policy Analysis',
        },
      ],
    },
    {
      id: 'ind-mod3-indian-agriculture',
      subjectId: 'ba-karnataka-indian-economy',
      title: 'Indian Agriculture: Issues, Policy & Karnataka',
      moduleNumber: 3,
      moduleName: 'Module 3: Agrarian Economy',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-ind-mod3-01', 'q-ind-mod3-02'],
      subtopics: [
        'Cropping pattern, irrigation and the monsoon dependence of Indian agriculture',
        'Food security: the PDS, NFSA 2013 and the buffer stock',
        'Agricultural credit, crop insurance under PMFBY and the KCC',
        'Agrarian distress, farmer suicides and the farm laws debate',
        "Karnataka agriculture: crops, irrigation projects and the Krishi Honnu scheme",
      ],
      explanationMd: `# Indian Agriculture

### Structural Features
Agriculture contributes around 18% of GDP but employs about 45% of the workforce. Holdings are small and fragmented — the average operational holding is roughly 1.08 hectares — and about half the net sown area remains rainfed, making output highly sensitive to the monsoon.

### Cropping Pattern
**Kharif** crops are sown with the onset of the south-west monsoon (June-July) and harvested in autumn — rice, maize, cotton, groundnut. **Rabi** crops are sown in winter (October-December) and harvested in spring — wheat, barley, mustard, gram. The Green Revolution concentrated gains in irrigated wheat and rice regions, distorting cropping patterns away from nutri-cereals and pulses.

### Irrigation
Net irrigated area covers roughly half the net sown area. Major projects include the Bhakra Nangal, Nagarjuna Sagar and the Sardar Sarovar. In Karnataka, the **Krishna Raja Sagara**, **Tungabhadra**, **Almatti** and **Bhadra** projects are significant, along with lift irrigation schemes in the drought-prone north.

### Food Security
The **National Food Security Act 2013** provides legal entitlement to subsidised foodgrains for up to 75% of the rural and 50% of the urban population, with 5 kg per person per month, and priority household rates of Rs 3, Rs 2 and Rs 1 per kg for rice, wheat and coarse grains. The **Food Corporation of India (1965)** manages procurement and buffer stocks.

### Credit and Insurance
The **Kisan Credit Card (1998)** provides short-term credit. **Interest subvention** of 2% and a further 3% for prompt repayment make effective short-term crop loan rates 4%. The **Pradhan Mantri Fasal Bima Yojana (2016)** replaced earlier schemes with lower farmer premiums — 2% for kharif, 1.5% for rabi and 5% for commercial and horticultural crops — and technology-based yield assessment.

### Agrarian Distress
Falling farm incomes, indebtedness to informal lenders, price volatility and climate stress have produced agrarian distress. The **National Commission on Farmers (Swaminathan Commission, 2006)** recommended MSP at 1.5 times C2 cost. The **three farm laws of 2020** — on farm trade, price assurance and essential commodities — were repealed in 2021 after sustained protest, illustrating the political constraints on agricultural market reform.

### Karnataka
Karnataka's principal crops are rice, ragi, maize, jowar, sugarcane, cotton and areca nut, with **coffee from Kodagu and Chikkamagaluru** and **silk from Ramanagara** as distinctive specialisations. The state pioneered **Krishi Honnu**, a per-acre cash incentive for farmers, and the **Krishi Kranti** and **Raitha Siri** schemes. Cauvery water sharing with Tamil Nadu remains a recurrent interstate issue.`,
      formulas: [
        {
          id: 'formula-ind-3',
          label: 'PMFBY Farmer Premium Shares',
          formula: 'Farmer premium: 2% of actuarial rate for kharif food and oilseed crops, 1.5% for rabi, 5% for commercial and horticultural crops; the balance is shared equally by the Centre and the State',
          exampleQ:
            'The actuarial premium rate for a kharif paddy crop is 12% of the sum insured. What does the farmer pay and who pays the rest?',
          exampleA:
            'The farmer pays 2%. The remaining 10 percentage points are shared equally, so 5% is met by the Centre and 5% by the State.',
        },
      ],
      tricks: [
        {
          id: 'trick-ind-3',
          title: 'Kharif Is 2%, Rabi Is 1.5%',
          trick:
            'The farmer premium is LOWER for rabi crops because the risk is lower. Reversing these two figures is the most common error in crop insurance questions.',
          whenToUse: 'PMFBY and crop insurance questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ind-5',
          step: 'Step 1: Identify the Season, Crop and Applicable Rate',
          detail:
            'Determine whether the crop is kharif, rabi or commercial, then select the corresponding farmer premium share.',
          questionType: 'Agricultural Policy Numerical',
        },
        {
          id: 'solve-ind-6',
          step: 'Step 2: Allocate the Remaining Premium and Evaluate the Scheme',
          detail:
            'Split the residual equally between Centre and State, then comment on coverage, claim settlement and the scheme\u2019s effectiveness in reducing agrarian distress.',
          questionType: 'Agricultural Policy Numerical',
        },
      ],
    },
    {
      id: 'ind-mod4-industry-infrastructure',
      subjectId: 'ba-karnataka-indian-economy',
      title: 'Industry, Infrastructure & Investment Climate',
      moduleNumber: 4,
      moduleName: 'Module 4: Industry and Infrastructure',
      order: 4,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-ind-mod4-01', 'q-ind-mod4-02'],
      subtopics: [
        'Public sector enterprises: classification, disinvestment and the DIPAM',
        'Infrastructure: PPP models, the National Infrastructure Pipeline and financing',
        'The infrastructure gap, logistic costs and the National Monetisation Pipeline',
        'Special Economic Zones, industrial corridors and Ease of Doing Business',
        'Karnataka industry: IT-BT, aerospace, biotech and the Bengaluru cluster',
      ],
      explanationMd: `# Industry & Infrastructure

### Public Sector Enterprises
PSEs are classified by financial size and autonomy as **Maharatna**, **Navratna** and **Miniratna Category I and II**, which confer progressively greater delegation of financial and operational powers. **Disinvestment** — the sale of government equity — is administered by the **Department of Investment and Public Asset Management (DIPAM)**. Strategic disinvestment transfers management control, whereas minor disinvestment retains it.

### PPP Models
- **BOT (Build-Operate-Transfer)**: the private party builds, operates for a concession period and transfers the asset.
- **BOOT** and **BOO**: variations on ownership during and after the concession.
- **HAM (Hybrid Annuity Model)**: the government funds 40% of the project cost during construction and the balance is recovered through annuity payments — introduced for highways to share construction risk.
- **EPC (Engineering-Procurement-Construction)**: fully government funded, with the private party acting as contractor.
- **Swiss challenge**: a bidding method where a third party may better an unsolicited proposal — used sparingly after controversy.

### Infrastructure Financing and Planning
The **National Infrastructure Pipeline (2019)** identified about Rs 111 lakh crore of investment across 2020-25. The **National Monetisation Pipeline (2021)** targets leasing brownfield assets worth around Rs 6 lakh crore over 2022-25. Financing comes from banks, **Infrastructure Investment Trusts (InvITs)**, **Real Estate Investment Trusts (REITs)**, the **National Investment and Infrastructure Fund (NIIF)**, and multilateral and bilateral lenders. **Infrastructure debt funds** and tax-free bonds have also been used.

### The Infrastructure Gap
India's logistics cost is estimated at 13-14% of GDP against 8-10% in developed economies. The **Gati Shakti National Master Plan (2021)** integrates planning across 16 ministries to reduce this through multi-modal connectivity. **PM Gati Shakti**, the **National Logistics Policy (2022)** and dedicated freight corridors target this gap.

### Zones and Corridors
**Special Economic Zones** under the SEZ Act 2005 offer duty-free imports and tax holidays, but have faced criticism over land acquisition and foregone revenue. **Industrial corridors** — Delhi-Mumbai, Chennai-Bengaluru, Bengaluru-Mumbai, Amritsar-Kolkata, Visakhapatnam-Chennai and the East Coast — combine high-speed connectivity with manufacturing nodes.

### Karnataka
Karnataka is India's leading IT-BT state, with Bengaluru contributing the largest share of national software exports. The **Karnataka Industrial Policy** has successively targeted electronics, aerospace and defence, biotechnology, renewable energy and textiles. **Biocon** and the biotech cluster, the aerospace ecosystem around HAL, and the toy cluster in Koppal illustrate sectoral diversification. The state's strengths are skilled labour, research institutions and power availability; its constraints are urban congestion, water scarcity and land costs in Bengaluru.`,
      formulas: [
        {
          id: 'formula-ind-4',
          label: 'Hybrid Annuity Model Cost Sharing',
          formula: 'HAM: Authority funds 40% of project cost during construction; the concessionaire recovers the remaining 60% through annuity payments plus O&M, with traffic risk retained by the Authority',
          exampleQ:
            'A highway project costs Rs 1,000 crore under HAM. What does the government fund during construction and how is the rest recovered?',
          exampleA:
            'The Authority funds Rs 400 crore during construction in milestone-linked tranches. The concessionaire recovers the remaining Rs 600 crore through semi-annual annuity payments over the concession period plus O&M costs, with inflation indexation. Traffic risk stays with the Authority.',
        },
      ],
      tricks: [
        {
          id: 'trick-ind-4',
          title: 'HAM Shifts Traffic Risk to the Government, BOT Keeps It With the Private Party',
          trick:
            'This single distinction explains why HAM revived stalled highway projects after BOT-Toll projects failed on traffic risk. It is the standard comparison in infrastructure questions.',
          whenToUse: 'PPP model comparison questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ind-7',
          step: 'Step 1: Classify the PPP Model and the Risk Allocation',
          detail:
            'Identify who finances, builds, operates and bears construction and traffic risk under the model in question.',
          questionType: 'Infrastructure Policy Analysis',
        },
        {
          id: 'solve-ind-8',
          step: 'Step 2: Evaluate Financing and the Suitability of the Model',
          detail:
            'Assess the funding sources available — budget, InvITs, NIIF, HAM annuities — and justify why the model suits the asset and the state of the market.',
          questionType: 'Infrastructure Policy Analysis',
        },
      ],
    },
    {
      id: 'ind-mod5-contemporary-india',
      subjectId: 'ba-karnataka-indian-economy',
      title: 'Contemporary Issues: Digital India, GST & the NEP Vision',
      moduleNumber: 5,
      moduleName: 'Module 5: Contemporary Issues and the NEP',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-ind-mod5-01', 'q-ind-mod5-02'],
      subtopics: [
        'Digital India, the India Stack, UPI and the digital economy',
        'GST: structure, implementation, revenue trends and the compensation debate',
        'Demonetisation 2016: objectives, impact and evaluation',
        'The National Education Policy 2020 and human capital formation',
        'Viksit Bharat 2047, the middle-income trap and inclusive growth',
      ],
      explanationMd: `# Contemporary Issues in the Indian Economy

### Digital India and the India Stack
**Digital India (2015)** aims to transform India into a digitally empowered society. Its foundation is the **India Stack** — a set of open APIs comprising:
1. **Presence-less layer**: Aadhaar identity and e-KYC.
2. **Paper-less layer**: DigiLocker and e-Sign.
3. **Cash-less layer**: UPI, IMPS and Aadhaar-Enabled Payment System.
4. **Consent layer**: the Account Aggregator framework and the Data Protection Act 2023.

**UPI**, launched in 2016 by the **National Payments Corporation of India (NPCI)**, processes well over 14 billion transactions a month and has become a global reference model for public digital infrastructure. India is the world's largest recipient of remittances at over USD 125 billion annually.

### GST
Implemented on **1 July 2017** under the **101st Constitutional Amendment**, GST subsumed excise duty, service tax, VAT, entertainment tax, octroi and others. It comprises **CGST**, **SGST** and **IGST**, with four main slabs — 5%, 12%, 18% and 28% — administered by the **GST Council** under Article 279A.

States were guaranteed compensation for revenue shortfall for **five years** at 14% annual growth, funded by a cess. Compensation ended in **June 2022**, after which States bear their own revenue risk. Persistent issues include rate rationalisation, the exclusion of petroleum, alcohol and electricity, inverted duty structures and compliance burden on small taxpayers.

### Demonetisation
On **8 November 2016**, Rs 500 and Rs 1,000 notes — about 86% of currency in circulation by value — were withdrawn. The stated objectives were curbing black money, counterfeit currency and terror financing. Nearly **99.3%** of the value was returned to the banking system, so the black-money objective largely failed; the lasting effects were the acceleration of digital payments and the formalisation of some transactions. The RBI's annual report confirmed the return rate, which is the key empirical finding.

### National Education Policy 2020
The NEP 2020 replaces the 1986 policy with a **5+3+3+4** school structure, foundational literacy and numeracy as a priority under the **NIPUN Bharat** mission, mother-tongue or regional language instruction in early years, multidisciplinary higher education with multiple entry and exit, a **National Credit Framework**, and a target of **6% of GDP on education** and a **gross enrolment ratio of 50% in higher education by 2035**. The **Higher Education Commission of India** is to replace the UGC and AICTE as regulator.

### Viksit Bharat 2047
The vision targets developed-country status by the centenary of independence, requiring sustained growth of 7-8% and avoiding the **middle-income trap** — the stagnation that follows the exhaustion of low-cost factor accumulation, requiring a shift to productivity and innovation-led growth. India's advantages are its demographic dividend, digital public infrastructure and energy transition; its risks are skill deficits, female labour force participation and climate vulnerability.`,
      formulas: [
        {
          id: 'formula-ind-5',
          label: 'India Stack Layers',
          formula: 'Presence-less (Aadhaar, e-KYC) → Paper-less (DigiLocker, e-Sign) → Cash-less (UPI, AEPS) → Consent (Account Aggregator)',
          exampleQ:
            'A student authenticates identity using Aadhaar e-KYC, stores a degree certificate digitally and receives a scholarship directly into a bank account. Which India Stack layers are used?',
          exampleA:
            'The presence-less layer for Aadhaar e-KYC authentication, the paper-less layer for DigiLocker storage of the certificate, and the cash-less layer for the direct benefit transfer of the scholarship.',
        },
      ],
      tricks: [
        {
          id: 'trick-ind-5',
          title: 'GST Compensation Ended in June 2022',
          trick:
            'The five-year guaranteed compensation at 14% growth has ended, so States now bear their own GST revenue risk. Answers that still describe compensation as current are factually wrong.',
          whenToUse: 'GST and federalism questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ind-9',
          step: 'Step 1: State the Policy Objective and the Mechanism',
          detail:
            'Identify what the policy intended to achieve and the specific instruments used, with dates and statutory basis where relevant.',
          questionType: 'Contemporary Economy Analysis',
        },
        {
          id: 'solve-ind-10',
          step: 'Step 2: Evaluate With Empirical Evidence and a Balanced Conclusion',
          detail:
            'Cite the measurable outcomes — such as the 99.3% return of demonetised currency or UPI transaction volumes — then weigh achievements against the costs and unresolved issues.',
          questionType: 'Contemporary Economy Analysis',
        },
      ],
    },
  ],
}


export const SEEDED_BA_QUESTIONS: UniversalQuestion[] = [
  // ── Microeconomics ──
  {
    id: 'q-micro-mod1-01',
    questionText: 'If the price of tea rises and the quantity demanded of coffee increases, tea and coffee are:',
    options: ['Complementary goods', 'Substitute goods', 'Inferior goods', 'Giffen goods'],
    correctIndex: 1,
    explanation:
      'A rise in the price of one good raising the demand for another is the definition of substitutes. The cross elasticity of demand is positive, which is the formal test.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-microeconomics', topicIds: ['micro-mod1-demand-elasticity'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-micro-mod1-02',
    questionText: 'Price falls from Rs 10 to Rs 8 and quantity demanded rises from 100 to 130 units. The price elasticity of demand is:',
    options: ['0.5', '1.0', '1.5', '3.0'],
    correctIndex: 2,
    explanation:
      'Percentage change in quantity = 30/100 = 30%. Percentage change in price = -2/10 = -20%. Elasticity = 30/20 = 1.5, so demand is elastic.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-microeconomics', topicIds: ['micro-mod1-demand-elasticity'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-micro-mod2-01',
    questionText: 'The marginal rate of substitution is measured by:',
    options: [
      'The slope of the indifference curve',
      'The slope of the budget line',
      'The ratio of the two prices',
      'The slope of the income consumption curve',
    ],
    correctIndex: 0,
    explanation:
      'The MRS is the rate at which a consumer will exchange one good for another at constant satisfaction, which is the slope of the indifference curve at that point. At equilibrium this equals the price ratio, the slope of the budget line.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-microeconomics', topicIds: ['micro-mod2-consumer-behaviour'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-micro-mod2-02',
    questionText: 'With a budget of Rs 200, price of X at Rs 20 and price of Y at Rs 10, the slope of the budget line is:',
    options: ['-2', '-0.5', '2', '10'],
    correctIndex: 0,
    explanation:
      'The budget line slope is -Px/Py = -20/10 = -2. The intercepts are 10 units of X and 20 units of Y.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2022, marks: 5, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-microeconomics', topicIds: ['micro-mod2-consumer-behaviour'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-micro-mod3-01',
    questionText: 'The law of diminishing returns operates in:',
    options: ['The long run only', 'The short run only', 'Both runs', 'Neither run'],
    correctIndex: 1,
    explanation:
      'The law requires at least one fixed factor, which exists only in the short run. In the long run all factors are variable and returns to scale apply instead.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 2, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-microeconomics', topicIds: ['micro-mod3-production-cost'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-micro-mod3-02',
    questionText: 'Total cost is Rs 500 at 10 units and Rs 620 at 15 units. The marginal cost of the last five units per unit of output is:',
    options: ['Rs 24', 'Rs 50', 'Rs 62', 'Rs 120'],
    correctIndex: 0,
    explanation:
      'Change in total cost = 620 - 500 = Rs 120 for a change in output of 5 units. Marginal cost = 120/5 = Rs 24 per unit.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-microeconomics', topicIds: ['micro-mod3-production-cost'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-micro-mod4-01',
    questionText: 'In perfect competition the firm is a price taker because:',
    options: [
      'The product is differentiated',
      'Its output is negligible relative to market supply',
      'There are barriers to entry',
      'It advertises heavily',
    ],
    correctIndex: 1,
    explanation:
      'Each firm produces so small a share of total market output that it cannot influence the price, which is set by industry demand and supply. Hence AR = MR = price.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-microeconomics', topicIds: ['micro-mod4-market-structures'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-micro-mod4-02',
    questionText: 'A monopolist faces demand P = 100 - 2Q and has constant marginal cost of Rs 20. The profit-maximising output is:',
    options: ['10 units', '20 units', '40 units', '50 units'],
    correctIndex: 1,
    explanation:
      'TR = 100Q - 2Q squared, so MR = 100 - 4Q. Setting MR = MC = 20 gives 4Q = 80 and Q = 20 units, at a price of Rs 60.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 10, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-microeconomics', topicIds: ['micro-mod4-market-structures'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-micro-mod5-01',
    questionText: 'Under perfect competition the wage rate equals:',
    options: [
      'Average revenue product of labour',
      'Marginal revenue product of labour',
      'Total product of labour',
      'The marginal cost of the product',
    ],
    correctIndex: 1,
    explanation:
      'A profit-maximising firm hires labour until the marginal revenue product equals the wage. Under perfect competition MR equals price, so MRP equals the value of marginal product.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2022, marks: 5, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-microeconomics', topicIds: ['micro-mod5-factor-pricing'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-micro-mod5-02',
    questionText: 'Economic rent arises when the supply of a factor is:',
    options: ['Perfectly elastic', 'Perfectly inelastic', 'Unitary elastic', 'Backward bending'],
    correctIndex: 1,
    explanation:
      'When supply is perfectly inelastic the whole payment is a transfer earning, that is, pure economic rent, since none of it is needed to bring the factor into use.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-microeconomics', topicIds: ['micro-mod5-factor-pricing'], stream: 'economics', program: 'ba' },
  },

  // ── Business Communication ──
  {
    id: 'q-bc-mod1-01',
    questionText: 'Which of the following is a semantic barrier to communication?',
    options: ['Poor lighting in the room', 'Use of jargon unfamiliar to the receiver', 'A noisy factory floor', 'A defective telephone line'],
    correctIndex: 1,
    explanation:
      'Semantic barriers arise from the language itself: jargon, ambiguity, poor vocabulary and untranslatable words. Noise and poor lighting are physical barriers; a defective line is a mechanical barrier.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-business-communication', topicIds: ['bc-mod1-process-barriers'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-bc-mod1-02',
    questionText: 'In the communication process, decoding is performed by:',
    options: ['The sender', 'The receiver', 'The channel', 'The feedback loop'],
    correctIndex: 1,
    explanation:
      'The sender encodes the idea into a message; the receiver decodes it back into meaning. Errors in decoding are a principal source of misunderstanding.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 2, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-business-communication', topicIds: ['bc-mod1-process-barriers'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-bc-mod2-01',
    questionText: 'The AIDA principle in a sales letter stands for:',
    options: [
      'Attention, Interest, Desire, Action',
      'Awareness, Information, Decision, Agreement',
      'Attention, Intention, Demand, Approval',
      'Approach, Interest, Demand, Action',
    ],
    correctIndex: 0,
    explanation:
      'AIDA is the classic structure for persuasive sales letters: secure Attention, build Interest, create Desire and prompt Action.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-business-communication', topicIds: ['bc-mod2-written-correspondence'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-bc-mod2-02',
    questionText: 'A letter acknowledging receipt of goods and raising a quality complaint should be classified as:',
    options: ['A routine letter', 'A claim or complaint letter', 'A goodwill letter', 'A circular'],
    correctIndex: 1,
    explanation:
      'A letter seeking redress for defective supply is a claim letter. It should state the facts, reference the order number, specify the remedy sought and avoid an accusatory tone.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 10, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-business-communication', topicIds: ['bc-mod2-written-correspondence'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-bc-mod3-01',
    questionText: 'The executive summary of a business report should be:',
    options: [
      'A complete reproduction of the report',
      'A concise statement of purpose, findings and recommendations',
      'A list of the sources consulted',
      'A letter of transmittal',
    ],
    correctIndex: 1,
    explanation:
      'The executive summary condenses the purpose, method, key findings and recommendations so a busy reader can act without reading the full report. It is written last but placed first.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-business-communication', topicIds: ['bc-mod3-report-writing'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-bc-mod3-02',
    questionText: 'Which is an essential quality of a good business report?',
    options: ['Use of technical jargon throughout', 'Objectivity supported by evidence', 'Length exceeding twenty pages', 'Absence of headings and subheadings'],
    correctIndex: 1,
    explanation:
      'A good report is accurate, objective, evidence-based, clearly organised with headings, and concise. Jargon and unnecessary length reduce its usefulness.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2022, marks: 5, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-business-communication', topicIds: ['bc-mod3-report-writing'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-bc-mod4-01',
    questionText: 'The most effective way to manage nervousness before an oral presentation is to:',
    options: [
      'Read the entire script word for word',
      'Prepare thoroughly and rehearse with the actual slides',
      'Avoid eye contact with the audience',
      'Speak as rapidly as possible to finish sooner',
    ],
    correctIndex: 1,
    explanation:
      'Rehearsal with the actual visual aids builds familiarity and reduces anxiety. Reading verbatim and avoiding eye contact destroy engagement; speed reduces clarity.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-business-communication', topicIds: ['bc-mod4-oral-communication'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-bc-mod4-02',
    questionText: 'In a group discussion, the participant who summarises the points raised and moves the group toward consensus is playing the role of:',
    options: ['The initiator', 'The harmoniser or synthesiser', 'The blocker', 'The gatekeeper'],
    correctIndex: 1,
    explanation:
      'The synthesiser reconciles differing views and consolidates the discussion. The initiator opens a line of thought, the gatekeeper encourages participation, and the blocker obstructs progress.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-business-communication', topicIds: ['bc-mod4-oral-communication'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-bc-mod5-01',
    questionText: 'Edward Hall\u2019s distinction between high-context and low-context cultures means that in high-context cultures:',
    options: [
      'Messages are explicit and rely on the words themselves',
      'Meaning depends heavily on situation, relationship and non-verbal cues',
      'Written contracts are the only reliable communication',
      'Communication is always formal and hierarchical',
    ],
    correctIndex: 1,
    explanation:
      'In high-context cultures such as Japan, China and India, much of the meaning is carried by context, relationship and non-verbal signals rather than by explicit words. Low-context cultures such as Germany and the United States rely on explicit verbal messages.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-business-communication', topicIds: ['bc-mod5-cross-cultural'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-bc-mod5-02',
    questionText: 'An Indian manager working with a German client sends a proposal with no direct statement of the price, expecting further discussion. The likely German reaction is:',
    options: [
      'Appreciation of the indirect approach',
      'Confusion or a perception of evasiveness, since explicit pricing is expected',
      'Immediate agreement to whatever price is proposed later',
      'No reaction, since both cultures communicate identically',
    ],
    correctIndex: 1,
    explanation:
      'German business communication is low-context and expects explicit, complete information up front. Omitting the price reads as evasive rather than as polite deference.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 10, semester: 1 },
    prepTags: { subjectId: 'ba-karnataka-business-communication', topicIds: ['bc-mod5-cross-cultural'], stream: 'communication', program: 'ba' },
  },

  // ── Macroeconomics ──
  {
    id: 'q-macro-mod1-01',
    questionText: 'GNP at factor cost is obtained from GNP at market price by:',
    options: [
      'Adding net indirect taxes',
      'Subtracting net indirect taxes',
      'Adding depreciation',
      'Subtracting net factor income from abroad',
    ],
    correctIndex: 1,
    explanation:
      'Factor cost = market price - net indirect taxes, where net indirect taxes are indirect taxes less subsidies. Adding net factor income from abroad converts GDP into GNP, which is a separate adjustment.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-macroeconomics', topicIds: ['macro-mod1-national-income'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-macro-mod1-02',
    questionText: 'With C = 5,000, I = 2,000, G = 1,500, exports 800 and imports 1,000 (all in Rs crore), GDP by the expenditure method is:',
    options: ['Rs 8,300 crore', 'Rs 8,700 crore', 'Rs 9,300 crore', 'Rs 8,500 crore'],
    correctIndex: 0,
    explanation:
      'GDP = C + I + G + (X - M) = 5,000 + 2,000 + 1,500 + (800 - 1,000) = 8,500 - 200 = Rs 8,300 crore.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-macroeconomics', topicIds: ['macro-mod1-national-income'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-macro-mod2-01',
    questionText: 'If the MPC is 0.8, the investment multiplier is:',
    options: ['1.25', '4', '5', '8'],
    correctIndex: 2,
    explanation:
      'k = 1 / (1 - MPC) = 1 / 0.2 = 5. An autonomous investment of Rs 100 crore therefore raises income by Rs 500 crore.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-macroeconomics', topicIds: ['macro-mod2-multiplier'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-macro-mod2-02',
    questionText: 'The paradox of thrift states that when all households try to save more:',
    options: [
      'Aggregate saving necessarily rises',
      'Aggregate demand falls and total saving may not increase',
      'Investment rises automatically',
      'The interest rate falls sharply',
    ],
    correctIndex: 1,
    explanation:
      'Higher saving reduces consumption, which reduces income through the multiplier, which in turn reduces the capacity to save. Total saving may end up unchanged or lower.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2022, marks: 10, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-macroeconomics', topicIds: ['macro-mod2-multiplier'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-macro-mod3-01',
    questionText: 'Narrow money (M1) in India comprises:',
    options: [
      'Currency with the public plus demand deposits plus other deposits with the RBI',
      'M1 plus time deposits with banks',
      'M1 plus post office savings deposits',
      'Currency plus all bank deposits of every kind',
    ],
    correctIndex: 0,
    explanation:
      'M1 = currency with the public + demand deposits + other deposits with the RBI. M3, the broad measure, is M1 plus time deposits with banks.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-macroeconomics', topicIds: ['macro-mod3-money-banking'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-macro-mod3-02',
    questionText: 'With a legal reserve ratio of 10%, an initial deposit of Rs 250 crore can support total deposits of:',
    options: ['Rs 250 crore', 'Rs 2,250 crore', 'Rs 2,500 crore', 'Rs 25 crore'],
    correctIndex: 2,
    explanation:
      'Total deposits = initial deposit x (1/r) = 250 x 10 = Rs 2,500 crore. Credit created is Rs 2,250 crore, being total deposits less the initial deposit.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-macroeconomics', topicIds: ['macro-mod3-money-banking'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-macro-mod4-01',
    questionText: 'An increase in government expenditure shifts:',
    options: ['The LM curve to the left', 'The IS curve to the right', 'The IS curve to the left', 'The LM curve to the right'],
    correctIndex: 1,
    explanation:
      'Government spending is an injection into the goods market, raising equilibrium income at every interest rate and shifting the IS curve rightward. The resulting higher interest rate partly crowds out private investment.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-macroeconomics', topicIds: ['macro-mod4-is-lm'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-macro-mod4-02',
    questionText: 'In a liquidity trap, monetary policy is ineffective because:',
    options: [
      'The IS curve is horizontal',
      'The LM curve is horizontal, so extra money is held entirely as idle balances',
      'The IS curve is vertical',
      'Investment is perfectly interest elastic',
    ],
    correctIndex: 1,
    explanation:
      'At very low interest rates the LM curve becomes horizontal: any additional money supply is absorbed by speculative balances without lowering the rate. Fiscal policy is fully effective in this range.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2022, marks: 10, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-macroeconomics', topicIds: ['macro-mod4-is-lm'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-macro-mod5-01',
    questionText: 'Simultaneous high inflation and high unemployment is known as:',
    options: ['Deflation', 'Stagflation', 'Disinflation', 'Reflation'],
    correctIndex: 1,
    explanation:
      'Stagflation combines stagnant output with rising prices, typically from an adverse supply shock such as the oil shocks of the 1970s. It contradicted the original Phillips curve.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-macroeconomics', topicIds: ['macro-mod5-inflation-unemployment'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-macro-mod5-02',
    questionText: 'If the labour force is 500 million and 45 million are unemployed, the unemployment rate is:',
    options: ['9%', '8%', '45%', '11.1%'],
    correctIndex: 0,
    explanation:
      'Unemployment rate = (Unemployed / Labour force) x 100 = (45/500) x 100 = 9%. The denominator is the labour force, not the total population.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-macroeconomics', topicIds: ['macro-mod5-inflation-unemployment'], stream: 'economics', program: 'ba' },
  },

  // ── Media Studies ──
  {
    id: 'q-media-mod1-01',
    questionText: 'The proposition that media do not tell people what to think but what to think about is the:',
    options: ['Cultivation theory', 'Agenda setting theory', 'Spiral of silence', 'Two-step flow theory'],
    correctIndex: 1,
    explanation:
      'Agenda setting, formulated by McCombs and Shaw, holds that media influence the salience of issues rather than opinions directly. Cultivation theory concerns the perception of social reality; the two-step flow concerns opinion leaders.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-media-studies', topicIds: ['media-mod1-theories'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-media-mod1-02',
    questionText: 'The two-step flow of communication model was propounded by:',
    options: ['Harold Lasswell', 'Paul Lazarsfeld', 'George Gerbner', 'Elisabeth Noelle-Neumann'],
    correctIndex: 1,
    explanation:
      'Lazarsfeld and colleagues found that media influence flows first to opinion leaders and then onward through interpersonal contact, challenging the hypodermic needle model.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-media-studies', topicIds: ['media-mod1-theories'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-media-mod2-01',
    questionText: 'The first newspaper published in India was:',
    options: ['The Hindu', "Hicky's Bengal Gazette", 'Amrita Bazar Patrika', 'Kesari'],
    correctIndex: 1,
    explanation:
      "Hicky's Bengal Gazette was started in 1780 by James Augustus Hicky and is regarded as the first newspaper printed in India.",
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-media-studies', topicIds: ['media-mod2-media-in-india'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-media-mod2-02',
    questionText: 'Television broadcasting content in India is primarily governed by:',
    options: [
      'The Press Council of India',
      'The Cable Television Networks (Regulation) Act 1995 and its Programme Code',
      'The Press Act 1910',
      'The Vernacular Press Act 1878',
    ],
    correctIndex: 1,
    explanation:
      'Broadcast content falls under the Cable Television Networks (Regulation) Act 1995 and the Programme and Advertising Codes. The Press Council of India has jurisdiction over print only.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-media-studies', topicIds: ['media-mod2-media-in-india'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-media-mod3-01',
    questionText: 'Under Article 19 of the Indian Constitution, freedom of the press is subject to reasonable restrictions on the ground of:',
    options: [
      'Commercial interest of the publisher',
      'Defamation, contempt of court and public order',
      'Editorial convenience',
      'Political affiliation of the government',
    ],
    correctIndex: 1,
    explanation:
      'Article 19(2) permits reasonable restrictions on grounds including sovereignty and integrity, security of the state, public order, decency or morality, contempt of court, defamation and incitement to an offence.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-media-studies', topicIds: ['media-mod3-media-law'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-media-mod3-02',
    questionText: 'The Supreme Court recognised privacy as a fundamental right in:',
    options: [
      'Kesavananda Bharati v State of Kerala',
      'Justice K S Puttaswamy v Union of India',
      'Shreya Singhal v Union of India',
      'Subramanian Swamy v Union of India',
    ],
    correctIndex: 1,
    explanation:
      'The Puttaswamy judgment (2017) held privacy to be a fundamental right derived from Article 21. Shreya Singhal struck down Section 66A of the IT Act, and Subramanian Swamy upheld criminal defamation.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-media-studies', topicIds: ['media-mod3-media-law'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-media-mod4-01',
    questionText: 'If a campaign reaches 60% of the target audience an average of four times, the Gross Rating Points are:',
    options: ['100', '240', '640', '24'],
    correctIndex: 1,
    explanation:
      'GRP = Reach x Frequency = 60 x 4 = 240 GRPs, the standard measure of campaign weight.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-media-studies', topicIds: ['media-mod4-advertising-pr'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-media-mod4-02',
    questionText: 'The DAGMAR approach requires advertising objectives to be:',
    options: [
      'Expressed as specific sales targets',
      'Defined as measurable communication tasks',
      'Left to the creative department',
      'Set only after the campaign ends',
    ],
    correctIndex: 1,
    explanation:
      'DAGMAR (Defining Advertising Goals for Measured Advertising Results) insists on specific, measurable communication outcomes such as awareness or preference, because sales depend on many factors beyond advertising.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2022, marks: 5, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-media-studies', topicIds: ['media-mod4-advertising-pr'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-media-mod5-01',
    questionText: 'False information deliberately created and spread to deceive is termed:',
    options: ['Misinformation', 'Disinformation', 'Malinformation', 'Satire'],
    correctIndex: 1,
    explanation:
      'The distinction turns on intent. Misinformation is false information shared without intent to deceive; disinformation is deliberately deceptive; malinformation is true information used out of context to harm.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-media-studies', topicIds: ['media-mod5-new-media'], stream: 'communication', program: 'ba' },
  },
  {
    id: 'q-media-mod5-02',
    questionText: 'A campaign receives 200,000 impressions and 4,000 clicks. The click-through rate is:',
    options: ['2%', '0.2%', '20%', '5%'],
    correctIndex: 0,
    explanation:
      'CTR = (Clicks / Impressions) x 100 = (4,000 / 200,000) x 100 = 2%.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 2 },
    prepTags: { subjectId: 'ba-karnataka-media-studies', topicIds: ['media-mod5-new-media'], stream: 'communication', program: 'ba' },
  },

  // ── Public Finance ──
  {
    id: 'q-pf-mod1-01',
    questionText: 'A payment made to the government in return for a specific service rendered is a:',
    options: ['Tax', 'Fee', 'Fine', 'Special assessment'],
    correctIndex: 1,
    explanation:
      'A fee has a direct element of benefit and quid pro quo, unlike a tax which is compulsory with no direct return. A fine is a penalty for violation.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-public-finance', topicIds: ['pf-mod1-public-revenue'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-pf-mod1-02',
    questionText: 'Tax revenue rises from Rs 1,00,000 crore to Rs 1,15,000 crore while GDP grows 10%. The tax buoyancy is:',
    options: ['0.67', '1.0', '1.5', '2.0'],
    correctIndex: 2,
    explanation:
      'Buoyancy = percentage change in tax revenue / percentage change in GDP = 15 / 10 = 1.5. A buoyancy above unity means revenue grows faster than GDP.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-public-finance', topicIds: ['pf-mod1-public-revenue'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-pf-mod2-01',
    questionText: 'The displacement effect explaining step-like growth in public expenditure was propounded by:',
    options: ['Adolph Wagner', 'Peacock and Wiseman', 'Richard Musgrave', 'Colin Clark'],
    correctIndex: 1,
    explanation:
      'Peacock and Wiseman argued that crises displace expenditure upward in a ratchet fashion and it does not fall back afterwards. Wagner described smooth long-run growth in state activity.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-public-finance', topicIds: ['pf-mod2-public-expenditure'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-pf-mod2-02',
    questionText: 'Which of the following is capital expenditure?',
    options: ['Payment of salaries', 'Interest payments on loans', 'Construction of a new highway', 'Payment of subsidies'],
    correctIndex: 2,
    explanation:
      'Capital expenditure creates an asset or reduces a liability. Highway construction creates an asset, whereas salaries, interest and subsidies are recurrent revenue expenditure.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2022, marks: 2, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-public-finance', topicIds: ['pf-mod2-public-expenditure'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-pf-mod3-01',
    questionText: 'Money withdrawn from the Consolidated Fund of India requires authorisation through:',
    options: [
      'An order of the President alone',
      'The Appropriation Act passed by Parliament',
      'A resolution of the Finance Commission',
      'An executive order of the Finance Minister',
    ],
    correctIndex: 1,
    explanation:
      'Article 266 provides that no money may be withdrawn from the Consolidated Fund except under appropriation made by law. Parliament does this through the Appropriation Bill. The Contingency Fund and Public Account operate differently.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-public-finance', topicIds: ['pf-mod3-budget-india'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-pf-mod3-02',
    questionText: 'Total expenditure is Rs 45 lakh crore, revenue receipts Rs 27 lakh crore, non-debt capital receipts Rs 2 lakh crore and interest payments Rs 10 lakh crore. The primary deficit is:',
    options: ['Rs 6 lakh crore', 'Rs 16 lakh crore', 'Rs 10 lakh crore', 'Rs 26 lakh crore'],
    correctIndex: 0,
    explanation:
      'Fiscal deficit = 45 - (27 + 2) = Rs 16 lakh crore. Primary deficit = fiscal deficit - interest payments = 16 - 10 = Rs 6 lakh crore.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 10, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-public-finance', topicIds: ['pf-mod3-budget-india'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-pf-mod4-01',
    questionText: 'The Finance Commission of India is constituted under:',
    options: ['Article 280', 'Article 279A', 'Article 265', 'Article 293'],
    correctIndex: 0,
    explanation:
      'Article 280 provides for the Finance Commission every five years. Article 279A created the GST Council and Article 265 provides that no tax shall be levied except by authority of law.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-public-finance', topicIds: ['pf-mod4-fiscal-federalism'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-pf-mod4-02',
    questionText: 'Gross tax revenue is Rs 30 lakh crore, cesses and surcharges Rs 3 lakh crore, cost of collection Rs 1 lakh crore, and the States share is 41%. The States receive:',
    options: ['Rs 12.30 lakh crore', 'Rs 10.66 lakh crore', 'Rs 10.25 lakh crore', 'Rs 11.89 lakh crore'],
    correctIndex: 1,
    explanation:
      'The divisible pool is 30 - 3 - 1 = Rs 26 lakh crore, since cesses and surcharges are excluded. 41% of 26 = Rs 10.66 lakh crore, only about 35.5% of gross tax revenue.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 10, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-public-finance', topicIds: ['pf-mod4-fiscal-federalism'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-pf-mod5-01',
    questionText: 'Public debt is sustainable in the long run when:',
    options: [
      'The interest rate on debt exceeds the growth rate',
      'The growth rate of the economy exceeds the interest rate on debt',
      'The primary deficit is always positive',
      'The debt is entirely external',
    ],
    correctIndex: 1,
    explanation:
      'When growth exceeds the effective interest rate, the debt-to-GDP ratio can stabilise or fall even with a modest primary deficit. When the interest rate is higher, a primary surplus is required.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-public-finance', topicIds: ['pf-mod5-public-debt'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-pf-mod5-02',
    questionText: 'The N K Singh Committee recommended a combined Centre-State debt-to-GDP target of:',
    options: ['40% by 2023-24', '50% by 2025-26', '60% by 2023-24', '70% by 2030'],
    correctIndex: 2,
    explanation:
      'The FRBM Review Committee chaired by N K Singh recommended a combined debt-to-GDP ratio of 60%, comprising 40% for the Centre and 20% for the States, by 2023-24, with debt as the primary fiscal anchor.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2022, marks: 5, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-public-finance', topicIds: ['pf-mod5-public-debt'], stream: 'economics', program: 'ba' },
  },

  // ── International Trade ──
  {
    id: 'q-it-mod1-01',
    questionText: 'Comparative advantage is determined by:',
    options: [
      'Absolute productivity in the good',
      'The lower opportunity cost of producing the good',
      'The size of the country',
      'The level of technology alone',
    ],
    correctIndex: 1,
    explanation:
      'Ricardo showed that a country should specialise where its opportunity cost is lowest, even if it is absolutely less efficient in every good. Absolute advantage is irrelevant to the gains from trade.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-intl-trade', topicIds: ['it-mod1-trade-theories'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-it-mod1-02',
    questionText: 'The finding that the capital-abundant United States exported labour-intensive goods is known as:',
    options: ['The Rybczynski theorem', 'The Leontief paradox', 'The Stolper-Samuelson theorem', 'The Heckscher-Ohlin theorem'],
    correctIndex: 1,
    explanation:
      'Leontief (1953) found results contrary to the Heckscher-Ohlin prediction. Explanations include the higher human capital content of American labour and technological superiority.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-intl-trade', topicIds: ['it-mod1-trade-theories'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-it-mod2-01',
    questionText: 'The key welfare difference between a tariff and a quota is that under a quota:',
    options: [
      'The government receives the revenue',
      'The quota rent accrues to licence holders or foreign exporters',
      'There is no effect on domestic producers',
      'Consumers are unaffected',
    ],
    correctIndex: 1,
    explanation:
      'A tariff generates government revenue, whereas the scarcity rent under a quota is captured by whoever holds the import licences or by foreign exporters under a voluntary export restraint.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-intl-trade', topicIds: ['it-mod2-commercial-policy'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-it-mod2-02',
    questionText: 'A car sells at Rs 10 lakh with imported inputs costing Rs 6 lakh at world prices. Tariffs are 20% on cars and 10% on inputs. The effective rate of protection is:',
    options: ['20%', '26%', '35%', '40%'],
    correctIndex: 2,
    explanation:
      'Value added at world prices V = 10 - 6 = Rs 4 lakh. With tariffs the price is Rs 12 lakh and inputs cost Rs 6.6 lakh, so V is Rs 5.4 lakh. ERP = (5.4 - 4) / 4 = 35%, well above the 20% nominal rate.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 10, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-intl-trade', topicIds: ['it-mod2-commercial-policy'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-it-mod3-01',
    questionText: 'Remittances received from abroad are recorded in the:',
    options: [
      'Current account as secondary income',
      'Capital account',
      'Financial account',
      'Official reserves account',
    ],
    correctIndex: 0,
    explanation:
      'Personal remittances are unilateral transfers recorded as secondary income in the current account. They are a major item for India, which is the largest remittance recipient in the world.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-intl-trade', topicIds: ['it-mod3-bop'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-it-mod3-02',
    questionText: 'According to the Marshall-Lerner condition, devaluation improves the trade balance only if:',
    options: [
      'The sum of export and import demand elasticities exceeds one in absolute value',
      'The sum of the elasticities is less than one',
      'Both elasticities are zero',
      'Import demand is perfectly inelastic',
    ],
    correctIndex: 0,
    explanation:
      'Only when the combined elasticity exceeds unity does the volume response outweigh the adverse price effect, so the trade balance improves. In the short run the J-curve effect may dominate.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-intl-trade', topicIds: ['it-mod3-bop'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-it-mod4-01',
    questionText: 'The World Trade Organization came into existence on:',
    options: ['1 January 1995', '1 July 2017', '15 August 1947', '1 April 1991'],
    correctIndex: 0,
    explanation:
      'The WTO was established on 1 January 1995 following the Uruguay Round, replacing GATT 1947 and adding services, intellectual property and a binding dispute settlement mechanism.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-intl-trade', topicIds: ['it-mod4-wto-regional'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-it-mod4-02',
    questionText: 'An Indian IT firm delivering software services remotely to a US client is operating under which GATS mode?',
    options: ['Mode 1, cross-border supply', 'Mode 2, consumption abroad', 'Mode 3, commercial presence', 'Mode 4, presence of natural persons'],
    correctIndex: 0,
    explanation:
      'Mode 1 covers services supplied from one country to another without movement of supplier or consumer. Opening an overseas office would be Mode 3, and sending staff abroad would be Mode 4.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-intl-trade', topicIds: ['it-mod4-wto-regional'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-it-mod5-01',
    questionText: 'Under covered interest rate parity, a currency with the higher interest rate trades at a:',
    options: ['Forward premium', 'Forward discount', 'Spot premium', 'Par value'],
    correctIndex: 1,
    explanation:
      'The forward rate equals the spot rate multiplied by the ratio of one plus the domestic interest rate to one plus the foreign rate. The higher-yielding currency must depreciate, otherwise riskless arbitrage would be possible.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-intl-trade', topicIds: ['it-mod5-forex-fdi'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-it-mod5-02',
    questionText: 'The spot rate is Rs 83 per USD, the Indian interest rate 7% and the US rate 3%. The one-year forward rate is approximately:',
    options: ['Rs 80.10', 'Rs 83.00', 'Rs 86.22', 'Rs 89.64'],
    correctIndex: 2,
    explanation:
      'Forward = 83 x (1.07 / 1.03) = 83 x 1.0388 = Rs 86.22 per USD, a forward discount on the rupee consistent with the higher Indian interest rate.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2022, marks: 10, semester: 3 },
    prepTags: { subjectId: 'ba-karnataka-intl-trade', topicIds: ['it-mod5-forex-fdi'], stream: 'economics', program: 'ba' },
  },

  // ── Development Economics ──
  {
    id: 'q-dev-mod1-01',
    questionText: 'The Human Development Index is computed as the:',
    options: [
      'Arithmetic mean of the three dimension indices',
      'Geometric mean of the three dimension indices',
      'Harmonic mean of the three dimension indices',
      'Weighted sum with income given double weight',
    ],
    correctIndex: 1,
    explanation:
      'Since 2010 the HDI is the cube root of the product of the health, education and income indices. The geometric mean penalises imbalance between dimensions.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-development-econ', topicIds: ['dev-mod1-growth-development'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-dev-mod1-02',
    questionText: 'Normalised indices of 0.800 for health, 0.625 for education and 0.729 for income give an HDI of approximately:',
    options: ['0.718', '0.714', '0.653', '0.790'],
    correctIndex: 1,
    explanation:
      'HDI = (0.800 x 0.625 x 0.729) raised to the power one-third = (0.3645) raised to the power one-third = 0.714. The arithmetic mean would have given 0.718, which is the wrong method.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-development-econ', topicIds: ['dev-mod1-growth-development'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-dev-mod2-01',
    questionText: 'The Gini coefficient measures:',
    options: ['Poverty incidence', 'Income inequality', 'Economic growth', 'Human development'],
    correctIndex: 1,
    explanation:
      'The Gini coefficient, derived from the Lorenz curve, ranges from zero for perfect equality to one for perfect inequality. Poverty incidence is measured by the headcount ratio.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-development-econ', topicIds: ['dev-mod2-poverty'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-dev-mod2-02',
    questionText: 'The Tendulkar Committee poverty line departed from earlier practice by:',
    options: [
      'Shifting from a calorie anchor to a cost-of-basic-needs approach',
      'Abolishing the poverty line altogether',
      'Adopting only the World Bank dollar threshold',
      'Restricting measurement to rural areas',
    ],
    correctIndex: 0,
    explanation:
      'The Tendulkar Committee (2009) moved away from calorie anchoring to a broader basket including health and education, and applied a uniform reference period, estimating poverty at 37.2% in 2004-05.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 10, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-development-econ', topicIds: ['dev-mod2-poverty'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-dev-mod3-01',
    questionText: 'The Swaminathan Commission recommended that MSP be set at:',
    options: ['A2 cost', 'A2 plus family labour', '1.5 times C2 cost', 'Twice the A2 cost'],
    correctIndex: 2,
    explanation:
      'The National Commission on Farmers (2006) recommended MSP at 1.5 times the comprehensive C2 cost, which includes imputed rent on owned land and interest on owned capital.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-development-econ', topicIds: ['dev-mod3-agriculture'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-dev-mod3-02',
    questionText: 'Operation Flood, which made India the largest milk producer, was led by:',
    options: ['M S Swaminathan', 'Verghese Kurien', 'Norman Borlaug', 'C Rangarajan'],
    correctIndex: 1,
    explanation:
      'Verghese Kurien led Operation Flood (1970-1996) through the National Dairy Development Board and the Amul cooperative model, producing the White Revolution.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2022, marks: 2, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-development-econ', topicIds: ['dev-mod3-agriculture'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-dev-mod4-01',
    questionText: 'A firm with plant and machinery investment of Rs 8 crore and annual turnover of Rs 40 crore is classified as:',
    options: ['Micro', 'Small', 'Medium', 'Large'],
    correctIndex: 1,
    explanation:
      'Under the July 2020 composite criteria, investment up to Rs 10 crore and turnover up to Rs 50 crore define a small enterprise. Both figures fall within those limits.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-development-econ', topicIds: ['dev-mod4-industrialisation'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-dev-mod4-02',
    questionText: 'Under the MSMED Act 2006 a buyer must pay an MSME supplier within:',
    options: ['15 days', '30 days', '45 days', '90 days'],
    correctIndex: 2,
    explanation:
      'The 45-day payment rule requires buyers to pay within 45 days of acceptance, failing which compound interest at three times the bank rate is payable on the outstanding amount.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 2, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-development-econ', topicIds: ['dev-mod4-industrialisation'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-dev-mod5-01',
    questionText: 'NITI Aayog differs from the Planning Commission principally in that it:',
    options: [
      'Allocates plan funds to the States',
      'Functions as a think tank without power to allocate resources',
      'Prepares the annual budget',
      'Imposes targets binding on the States',
    ],
    correctIndex: 1,
    explanation:
      'Constituted on 1 January 2015, NITI Aayog provides policy advice and promotes cooperative and competitive federalism, but resource allocation rests with the Finance Ministry.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-development-econ', topicIds: ['dev-mod5-planning-sdg'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-dev-mod5-02',
    questionText: 'In the Harrod-Domar model, with a savings rate of 24% and a capital-output ratio of 4, the growth rate is:',
    options: ['2%', '4%', '6%', '24%'],
    correctIndex: 2,
    explanation:
      'g = s / k = 0.24 / 4 = 0.06, or 6% per annum. Growth can be raised only by increasing the savings rate or reducing the capital-output ratio.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-development-econ', topicIds: ['dev-mod5-planning-sdg'], stream: 'economics', program: 'ba' },
  },

  // ── Indian Economy ──
  {
    id: 'q-ind-mod1-01',
    questionText: 'The New Economic Policy of 1991 was announced by Finance Minister:',
    options: ['Yashwant Sinha', 'Manmohan Singh', 'P Chidambaram', 'Pranab Mukherjee'],
    correctIndex: 1,
    explanation:
      'Dr Manmohan Singh, Finance Minister in the P V Narasimha Rao government, announced the liberalisation package in July 1991 following the balance of payments crisis.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-indian-economy', topicIds: ['ind-mod1-economic-reforms'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-ind-mod1-02',
    questionText: 'The term Hindu rate of growth, referring to the pre-1991 growth rate of about 3.5%, was coined by:',
    options: ['K N Raj', 'Amartya Sen', 'Jagdish Bhagwati', 'P C Mahalanobis'],
    correctIndex: 0,
    explanation:
      'The economist K N Raj coined the phrase to describe the low per capita growth of the pre-liberalisation period, and it carries no religious connotation.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 2, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-indian-economy', topicIds: ['ind-mod1-economic-reforms'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-ind-mod2-01',
    questionText: 'Under the flexible inflation targeting framework, the RBI targets:',
    options: [
      'WPI inflation of 4% with a band of 2 to 6%',
      'CPI inflation of 4% with a band of 2 to 6%',
      'CPI inflation of 6% with a band of 4 to 8%',
      'Core inflation of 5% with no band',
    ],
    correctIndex: 1,
    explanation:
      'The RBI Act amendment of 2016, following the Urjit Patel Committee, set a CPI inflation target of 4% with a tolerance band of 2 to 6%, decided by the six-member Monetary Policy Committee.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-indian-economy', topicIds: ['ind-mod2-money-inflation'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-ind-mod2-02',
    questionText: 'The floor of the LAF corridor is formed by:',
    options: ['The repo rate', 'The reverse repo rate', 'The Standing Deposit Facility rate', 'The Marginal Standing Facility rate'],
    correctIndex: 2,
    explanation:
      'The Standing Deposit Facility, introduced in 2022, absorbs liquidity without collateral and forms the floor. The Marginal Standing Facility forms the ceiling, with the repo rate in between.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-indian-economy', topicIds: ['ind-mod2-money-inflation'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-ind-mod3-01',
    questionText: 'Under PMFBY the farmer premium for kharif food and oilseed crops is:',
    options: ['1.5% of the actuarial rate', '2% of the actuarial rate', '5% of the actuarial rate', '10% of the actuarial rate'],
    correctIndex: 1,
    explanation:
      'The farmer share is 2% for kharif food and oilseed crops, 1.5% for rabi crops and 5% for commercial and horticultural crops. The balance premium is shared equally by the Centre and the State.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-indian-economy', topicIds: ['ind-mod3-indian-agriculture'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-ind-mod3-02',
    questionText: 'The National Food Security Act 2013 provides priority households with subsidised foodgrains at:',
    options: [
      'Rs 3, Rs 2 and Rs 1 per kg for rice, wheat and coarse grains',
      'Rs 5 per kg for all cereals',
      'Free distribution to all households',
      'Rs 10, Rs 8 and Rs 5 per kg respectively',
    ],
    correctIndex: 0,
    explanation:
      'The Act entitles up to 75% of the rural and 50% of the urban population to 5 kg per person per month at central issue prices of Rs 3, Rs 2 and Rs 1 per kg for rice, wheat and coarse grains.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2022, marks: 5, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-indian-economy', topicIds: ['ind-mod3-indian-agriculture'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-ind-mod4-01',
    questionText: 'Under the Hybrid Annuity Model for highways, the government funds during construction:',
    options: ['20% of the project cost', '40% of the project cost', '60% of the project cost', 'The entire project cost'],
    correctIndex: 1,
    explanation:
      'Under HAM the Authority funds 40% of the project cost in milestone-linked tranches; the concessionaire recovers the remaining 60% through annuity payments. Traffic risk is retained by the Authority, unlike BOT-Toll.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-indian-economy', topicIds: ['ind-mod4-industry-infrastructure'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-ind-mod4-02',
    questionText: 'Disinvestment policy in central public sector enterprises is administered by:',
    options: ['NITI Aayog', 'DIPAM', 'SEBI', 'The Comptroller and Auditor General'],
    correctIndex: 1,
    explanation:
      'The Department of Investment and Public Asset Management under the Ministry of Finance handles disinvestment. Strategic disinvestment transfers management control; minor disinvestment does not.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-indian-economy', topicIds: ['ind-mod4-industry-infrastructure'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-ind-mod5-01',
    questionText: 'The Unified Payments Interface (UPI) was launched in 2016 by:',
    options: ['The Reserve Bank of India', 'The National Payments Corporation of India', 'The State Bank of India', 'The Securities and Exchange Board of India'],
    correctIndex: 1,
    explanation:
      'UPI was launched by the NPCI in 2016 and has become the backbone of retail digital payments in India, processing well over 14 billion transactions a month.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-indian-economy', topicIds: ['ind-mod5-contemporary-india'], stream: 'economics', program: 'ba' },
  },
  {
    id: 'q-ind-mod5-02',
    questionText: 'Of the value of currency withdrawn in the November 2016 demonetisation, approximately what proportion returned to the banking system?',
    options: ['About 60%', 'About 80%', 'About 99.3%', 'About 45%'],
    correctIndex: 2,
    explanation:
      'The RBI reported that about 99.3% of the value of the demonetised notes was returned, which substantially undermined the objective of extinguishing unaccounted cash, though digital payments accelerated markedly.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 10, semester: 4 },
    prepTags: { subjectId: 'ba-karnataka-indian-economy', topicIds: ['ind-mod5-contemporary-india'], stream: 'economics', program: 'ba' },
  },
]
