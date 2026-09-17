// functions/src/data/mcomSeedData.ts
//
// Complete M.Com Curriculum (Postgraduate — Semesters 1 to 4, Karnataka Region)
// Aligned with the Karnataka State Higher Education Council (KSHEC) NEP 2020 / CBCS
// postgraduate model curriculum adopted by Bangalore University (BU), Bengaluru City
// University (BCU), Bengaluru North University (BNU), Mysore University (UOM),
// Mangalore University, Karnatak University Dharwad (KUD), Tumkur and Kuvempu Universities.
//
// Structure:
// 8 Core Subjects across Semesters 1 through 4 (2 subjects per semester)
// Subject > 5 Modules / Topics > Granular Subtopics
//
// Shares the exact PrepInsta content contract used by bbaSeedData.ts:
//   PrepSubject[]  +  Record<subjectId, PrepTopic[]>  +  UniversalQuestion[]

import { PrepSubject, PrepTopic, UniversalQuestion } from '../prepShared'

const PUBLISHED_AT = '2026-09-17T12:00:00.000Z'
const SYLLABUS = (sem: number) => `KSHEC NEP M.Com Sem-${sem} / BU, BCU, BNU, UOM, Mangalore, KUD`

export const MCOM_SUBJECTS: PrepSubject[] = [
  // ══════════════════════════════════════════════════════════════════════
  // SEMESTER 1 (PG FOUNDATIONS — ADVANCED FINANCE & MONETARY ECONOMICS)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'mcom-karnataka-adv-fin-mgmt',
    name: 'Advanced Financial Management',
    stream: 'finance',
    programs: ['mcom', 'mba'],
    degreeLevel: 'postgraduate',
    yearGroup: 'pg-first-year',
    semester: 1,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(1),
    icon: 'TrendingUp',
    order: 1,
    topicCount: 5,
    status: 'published',
    description:
      'Capital structure theories (NI, NOI, Traditional, Modigliani-Miller), WACC and leverage, dividend policy theories, capital budgeting under risk and rationing, working capital policy and corporate restructuring.',
  },
  {
    id: 'mcom-karnataka-monetary-system',
    name: 'Monetary System & Central Banking',
    stream: 'economics',
    programs: ['mcom'],
    degreeLevel: 'postgraduate',
    yearGroup: 'pg-first-year',
    semester: 1,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(1),
    icon: 'DollarSign',
    order: 2,
    topicCount: 5,
    status: 'published',
    description:
      'Functions and types of money, RBI monetary policy framework and LAF instruments, money supply measures M0 to M3 and the credit multiplier, inflation targeting and the Phillips curve, financial sector reform and digital payments.',
  },

  // ══════════════════════════════════════════════════════════════════════
  // SEMESTER 2 (GLOBAL BUSINESS & DIRECT TAX RIGOUR)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'mcom-karnataka-intl-business',
    name: 'International Business',
    stream: 'management',
    programs: ['mcom', 'mba'],
    degreeLevel: 'postgraduate',
    yearGroup: 'pg-first-year',
    semester: 2,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(2),
    icon: 'Globe2',
    order: 3,
    topicCount: 5,
    status: 'published',
    description:
      'Theories of international trade and FDI, balance of payments and exchange rate determination, entry modes and global value chains, WTO and regional integration, export documentation and cross-cultural management.',
  },
  {
    id: 'mcom-karnataka-tax-planning',
    name: 'Corporate Tax Planning',
    stream: 'taxation',
    programs: ['mcom'],
    degreeLevel: 'postgraduate',
    yearGroup: 'pg-first-year',
    semester: 2,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(2),
    icon: 'Receipt',
    order: 4,
    topicCount: 5,
    status: 'published',
    description:
      'Tax planning versus avoidance versus evasion and GAAR, corporate tax rates with MAT and AMT, deductions and loss set-off, capital gains and buyback planning, international taxation and transfer pricing.',
  },

  // ══════════════════════════════════════════════════════════════════════
  // SEMESTER 3 (SPECIALISATION — FORENSICS & DERIVATIVES)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'mcom-karnataka-forensic-accounting',
    name: 'Forensic Accounting & Fraud Analytics',
    stream: 'commerce',
    programs: ['mcom'],
    degreeLevel: 'postgraduate',
    yearGroup: 'pg-second-year',
    semester: 3,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(3),
    icon: 'Search',
    order: 5,
    topicCount: 5,
    status: 'published',
    description:
      'Fraud triangle and corporate fraud typologies, financial statement fraud and the Beneish M-Score, asset misappropriation schemes, digital forensics with Benford\u2019s Law, investigation practice under SFIO and PMLA.',
  },
  {
    id: 'mcom-karnataka-derivatives',
    name: 'Financial Derivatives & Risk Management',
    stream: 'finance',
    programs: ['mcom', 'mba'],
    degreeLevel: 'postgraduate',
    yearGroup: 'pg-second-year',
    semester: 3,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(3),
    icon: 'Zap',
    order: 6,
    topicCount: 5,
    status: 'published',
    description:
      'Forward and futures pricing under cost of carry, option payoffs and the Greeks, binomial and Black-Scholes-Merton valuation, interest rate and currency swaps, margining, CCP clearing and SEBI regulation.',
  },

  // ══════════════════════════════════════════════════════════════════════
  // SEMESTER 4 (CAPSTONE — STRATEGIC COSTING & RESEARCH)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'mcom-karnataka-adv-cost-accounting',
    name: 'Advanced Cost & Management Accounting',
    stream: 'commerce',
    programs: ['mcom'],
    degreeLevel: 'postgraduate',
    yearGroup: 'pg-second-year',
    semester: 4,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(4),
    icon: 'PieChart',
    order: 7,
    topicCount: 5,
    status: 'published',
    description:
      'Activity based costing and cost management, standard costing and variance analysis, divisional transfer pricing and responsibility accounting, marginal costing CVP decisions, life cycle and target costing with the balanced scorecard.',
  },
  {
    id: 'mcom-karnataka-research-methodology',
    name: 'Research Methodology & Statistical Analysis (SPSS)',
    stream: 'statistics',
    programs: ['mcom'],
    degreeLevel: 'postgraduate',
    yearGroup: 'pg-second-year',
    semester: 4,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(4),
    icon: 'BarChart2',
    order: 8,
    topicCount: 5,
    status: 'published',
    description:
      'Research design and problem formulation, sampling design and measurement scales, SPSS data preparation and descriptives, hypothesis testing with t-tests, ANOVA and chi-square, correlation, regression and factor analysis.',
  },
]

export const SEEDED_MCOM_TOPICS: Record<string, PrepTopic[]> = {
  // ── 1. Advanced Financial Management (Sem 1) ──
  'mcom-karnataka-adv-fin-mgmt': [
    {
      id: 'afm-mod1-capital-structure',
      subjectId: 'mcom-karnataka-adv-fin-mgmt',
      title: 'Capital Structure Theories: NI, NOI, Traditional & Modigliani-Miller',
      moduleNumber: 1,
      moduleName: 'Module 1: Capital Structure & Leverage Decisions',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-afm-mod1-01', 'q-afm-mod1-02'],
      subtopics: [
        'Meaning of capital structure, financial structure and trading on equity',
        'Net Income (NI) approach and its implicit assumption of constant Kd and Ke',
        'Net Operating Income (NOI) approach and constant overall Ko',
        'Traditional (intermediate) approach and the U-shaped average cost curve',
        'Modigliani-Miller irrelevance proposition with and without corporate tax',
      ],
      explanationMd: `# Capital Structure Theories

### Core Concept & University Context
Capital structure is the mix of debt and equity a firm uses to finance its assets. The central PG question is whether the mix affects **firm value** — that is, whether a manager can create value purely by choosing financing. Karnataka university papers repeatedly test the four competing schools.

### The Four Approaches
1. **Net Income (NI) approach** — Assumes Kd and Ke stay constant as gearing rises. Since debt is cheaper than equity, more debt lowers WACC continuously and value rises without limit. Implies an optimal structure of almost 100% debt, which ignores bankruptcy risk.
2. **Net Operating Income (NOI) approach** — Assumes the overall cost Ko is constant. Cheaper debt is exactly offset by a rising Ke as shareholders demand compensation for financial risk. Value is therefore independent of gearing.
3. **Traditional approach** — The practical middle ground. WACC falls initially with leverage, reaches a minimum at an *acceptable* debt level, then rises. This produces a U-shaped curve and a genuine optimum.
4. **Modigliani-Miller (MM)** — In a perfect market (no tax, no flotation cost, rational investors) MM Proposition I proves value is independent of capital structure through an arbitrage argument. With corporate tax, the interest tax shield makes levered firms worth more by **T x D**.

### Real-World Application
Indian IT majors such as Infosys and TCS run near-zero debt (NI approach irrelevant because Ke is low), while capital-intensive firms like Tata Power and JSW Energy carry high gearing to harvest the interest shield — closer to MM-with-tax behaviour.`,
      formulas: [
        {
          id: 'formula-afm-1',
          label: 'MM Proposition I with Corporate Tax (Levered Firm Value)',
          formula: 'VL = VU + (T x D)',
          exampleQ:
            'An unlevered firm is valued at Rs 400 crore. It takes on Rs 150 crore of debt at a 30% corporate tax rate. Compute the levered value under MM with tax.',
          exampleA:
            'VL = VU + (T x D) = 400 + (0.30 x 150) = 400 + 45 = Rs 445 crore. The Rs 45 crore is the present value of the interest tax shield.',
        },
        {
          id: 'formula-afm-2',
          label: 'MM Proposition II (Cost of Equity for a Levered Firm)',
          formula: 'Ke = Ko + (Ko - Kd) x (D/E) x (1 - T)',
          exampleQ:
            'Ko = 12%, Kd = 8%, D/E = 0.5, T = 30%. Find Ke.',
          exampleA: 'Ke = 12 + (12 - 8) x 0.5 x (1 - 0.30) = 12 + 4 x 0.5 x 0.7 = 12 + 1.4 = 13.4%.',
        },
      ],
      tricks: [
        {
          id: 'trick-afm-1',
          title: 'The "Constant" Keyword Test',
          trick:
            'Identify the theory from what it holds CONSTANT: NI holds Kd and Ke constant; NOI holds Ko constant; Traditional holds nothing constant (all three move); MM holds value constant in a perfect market.',
          whenToUse:
            'Instantly classifies a 2-mark "distinguish between" question and anchors the graph you must draw.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-afm-1',
          step: 'Step 1: Tabulate EBIT, Interest and Equity Capitalisation at Each Gearing Level',
          detail:
            'Build columns for Debt, Interest, EBT, Net Income, Ke, Equity value (S = NI / Ke), Debt value (D = Interest / Kd), V = S + D, and Ko = EBIT / V.',
          questionType: '10-Mark Numerical / Comparative Table',
        },
        {
          id: 'solve-afm-2',
          step: 'Step 2: Locate the Minimum Ko and State the Optimum',
          detail:
            'The gearing point where Ko is lowest and V is highest is the optimal capital structure. Always state it explicitly in a sentence — examiners award a mark for the conclusion.',
          questionType: '10-Mark Numerical / Comparative Table',
        },
      ],
    },
    {
      id: 'afm-mod2-wacc-leverage',
      subjectId: 'mcom-karnataka-adv-fin-mgmt',
      title: 'Cost of Capital, WACC & Leverage Analysis',
      moduleNumber: 2,
      moduleName: 'Module 2: Cost of Capital & Leverage',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-afm-mod2-01', 'q-afm-mod2-02'],
      subtopics: [
        'Concept of cost of capital as a hurdle rate and discounting rate',
        'Cost of debt (pre-tax and post-tax) and cost of preference capital',
        'Cost of equity: dividend growth model vs CAPM',
        'Weighted Average Cost of Capital and marginal cost of capital',
        'Operating, financial and combined leverage, and DOL / DFL / DCL',
      ],
      explanationMd: `# Cost of Capital, WACC & Leverage

### Core Concept
The cost of capital is the minimum return a firm must earn on its investments to leave shareholder wealth unchanged. It is simultaneously the **hurdle rate** for capital budgeting and the **discount rate** for valuation. Because a firm raises several kinds of capital, the relevant figure is the weighted average.

### Component Costs
- **Cost of debt** is the yield to maturity on new borrowing, reduced by the tax shield: Kd(after tax) = Kd x (1 - T).
- **Cost of equity** is estimated either by the dividend growth model, Ke = (D1 / P0) + g, or by CAPM, Ke = Rf + Beta x (Rm - Rf). CAPM is preferred for listed Indian firms because beta is observable.
- **Cost of preference capital** is the fixed dividend divided by net proceeds; it is not tax deductible.

### WACC and Marginal Cost
WACC weights each component by its **market value** proportion, not book value. The *marginal* cost of capital is the WACC of the next rupee raised and is the correct hurdle for new projects, since raising fresh debt pushes the firm into a higher risk band.

### Leverage
- **Operating leverage** arises from fixed operating costs: DOL = Contribution / EBIT.
- **Financial leverage** arises from fixed interest: DFL = EBIT / (EBIT - Interest).
- **Combined leverage**: DCL = DOL x DFL = Contribution / (EBIT - Interest).

High combined leverage means small sales swings produce large EPS swings — the textbook risk profile of Indian infrastructure and aviation companies.`,
      formulas: [
        {
          id: 'formula-afm-3',
          label: 'Weighted Average Cost of Capital',
          formula: 'WACC = (Wd x Kd x (1 - T)) + (Wp x Kp) + (We x Ke)',
          exampleQ:
            'A firm has Rs 400 crore debt at 10% pre-tax, Rs 100 crore preference at 12%, and Rs 500 crore equity at 16%. Tax rate 25%. Compute WACC.',
          exampleA:
            'Total capital = 1000. Wd = 0.40, Wp = 0.10, We = 0.50. WACC = (0.40 x 10 x 0.75) + (0.10 x 12) + (0.50 x 16) = 3.0 + 1.2 + 8.0 = 12.2%.',
        },
        {
          id: 'formula-afm-4',
          label: 'Degree of Combined Leverage',
          formula: 'DCL = DOL x DFL = Contribution / (EBIT - Interest)',
          exampleQ: 'Sales Rs 500 lakh, variable cost Rs 300 lakh, fixed cost Rs 120 lakh, interest Rs 20 lakh. Find DCL.',
          exampleA:
            'Contribution = 500 - 300 = 200. EBIT = 200 - 120 = 80. DOL = 200/80 = 2.5. DFL = 80/(80-20) = 1.333. DCL = 2.5 x 1.333 = 3.33. A 10% sales rise lifts EPS by about 33.3%.',
        },
      ],
      tricks: [
        {
          id: 'trick-afm-2',
          title: 'Always Tax-Adjust Debt First',
          trick:
            'Multiply the debt rate by (1 - T) before weighting it. The single most common exam error is weighting the pre-tax cost of debt, which inflates WACC by roughly 2-3 percentage points.',
          whenToUse: 'Every WACC and capital budgeting numerical.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-afm-3',
          step: 'Step 1: Build the Capital Structure Table in Market Values',
          detail:
            'List each source, its market value, its weight (value / total), its pre-tax cost and its after-tax cost. Convert book values to market values if both are supplied.',
          questionType: '10-Mark WACC Numerical',
        },
        {
          id: 'solve-afm-4',
          step: 'Step 2: Multiply and Sum, Then Compare with IRR',
          detail:
            'Sum the weighted after-tax costs. Accept a project only when its IRR exceeds this WACC; state the accept/reject decision explicitly.',
          questionType: '10-Mark WACC Numerical',
        },
      ],
    },
    {
      id: 'afm-mod3-dividend-policy',
      subjectId: 'mcom-karnataka-adv-fin-mgmt',
      title: 'Dividend Theories & Dividend Policy Decisions',
      moduleNumber: 3,
      moduleName: 'Module 3: Dividend Policy & Shareholder Returns',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-afm-mod3-01', 'q-afm-mod3-02'],
      subtopics: [
        'Dividend irrelevance: Modigliani-Miller and Walter models compared',
        "Walter's model and the P/E relationship when r > K, r = K, r < K",
        'Gordon growth model and the bird-in-the-hand argument',
        'Dividend relevance: signalling, clientele effect and information content',
        'Forms of dividend: cash, stock dividend, buyback and interim dividend',
      ],
      explanationMd: `# Dividend Theories & Policy

### The Central Debate
Does the dividend payout ratio affect the market value of the firm? Two camps answer differently.

### Irrelevance Theories
- **Modigliani-Miller** argue that in perfect markets value is driven only by earning power and investment policy. Any dividend paid must be replaced by external financing, diluting existing shareholders by exactly the amount distributed. Their pricing formula shows P0 depends on D1 and E1 but nets out.
- **Walter's model** is *partially* irrelevant: the payout decision matters only through reinvestment opportunity. If r > K the firm should retain everything (0% payout); if r < K it should distribute 100%; if r = K payout is irrelevant.

### Relevance Theories
- **Gordon's bird-in-the-hand** model holds that investors discount certain current dividends less heavily than uncertain future capital gains, so P0 = D1 / (Ke - g) and higher payouts raise value.
- **Signalling theory**: because managers have insider information, a dividend increase credibly signals confidence. Indian markets routinely react to dividend announcements — Infosys and ITC dividend hikes move share prices well beyond the cash amount.
- **Clientele effect**: tax-exempt institutions prefer dividends while high-bracket individuals prefer buybacks.

### Indian Practice
Since the abolition of Dividend Distribution Tax in 2020, dividends are taxed in shareholders' hands, which shifted many Indian promoters toward **buybacks** where the buyback tax is borne by the company and capital gains treatment favours resident individuals.`,
      formulas: [
        {
          id: 'formula-afm-5',
          label: "Walter's Model (Market Price per Share)",
          formula: 'P = [D + (E - D) x (r / Ke)] / Ke',
          exampleQ:
            'EPS = Rs 10, Ke = 10%, r = 15%. Compute the share price at 0%, 50% and 100% payout.',
          exampleA:
            'r > Ke so retain fully. At D=0: P = [0 + 10 x 1.5]/0.10 = Rs 150. At D=5: P = [5 + 5 x 1.5]/0.10 = Rs 125. At D=10: P = [10 + 0]/0.10 = Rs 100. Optimum payout is 0%.',
        },
        {
          id: 'formula-afm-6',
          label: "Gordon's Growth Model",
          formula: 'P0 = D1 / (Ke - g)',
          exampleQ: 'Expected dividend Rs 6, Ke = 14%, growth 6%. Find P0.',
          exampleA: 'P0 = 6 / (0.14 - 0.06) = 6 / 0.08 = Rs 75.',
        },
      ],
      tricks: [
        {
          id: 'trick-afm-3',
          title: 'Compare r with Ke Before Computing Anything',
          trick:
            "In Walter's model, decide the payout from the r vs Ke comparison FIRST (r>Ke retain all, r<Ke distribute all, r=Ke indifferent). Then plug in. Skipping this wastes time computing all three scenarios.",
          whenToUse: "Any 10-mark Walter's model numerical.",
        },
      ],
      howToSolve: [
        {
          id: 'solve-afm-5',
          step: 'Step 1: Classify the Reinvestment Relationship',
          detail: 'State whether r exceeds, equals or falls below Ke, and give the resulting optimum payout in one sentence.',
          questionType: "Walter's / Gordon's Numerical",
        },
        {
          id: 'solve-afm-6',
          step: 'Step 2: Compute Prices at Alternative Payouts and Conclude',
          detail:
            'Tabulate D, retained earnings, price per share. Conclude with the payout that maximises price and link it to the r vs Ke rule.',
          questionType: "Walter's / Gordon's Numerical",
        },
      ],
    },
    {
      id: 'afm-mod4-capital-budgeting-risk',
      subjectId: 'mcom-karnataka-adv-fin-mgmt',
      title: 'Capital Budgeting Under Risk, Uncertainty & Capital Rationing',
      moduleNumber: 4,
      moduleName: 'Module 4: Advanced Investment Appraisal',
      order: 4,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-afm-mod4-01', 'q-afm-mod4-02'],
      subtopics: [
        'Risk-adjusted discount rate and certainty equivalent approaches',
        'Sensitivity, scenario and simulation (Monte Carlo) analysis',
        'Decision trees and expected net present value',
        'Capital rationing: single period vs multi period, profitability index ranking',
        'Real options: expand, abandon, defer and switching options',
      ],
      explanationMd: `# Capital Budgeting Under Risk & Capital Rationing

### Why the Basic NPV Rule Fails
Standard NPV assumes a single known cash flow stream. Real projects face demand, price and technology uncertainty, and firms rarely have unlimited funds. PG papers test three adjustments.

### 1. Risk-Adjusted Techniques
- **Risk-Adjusted Discount Rate (RADR)** inflates the discount rate for risk: NPV = Sum of CFt / (1 + r + risk premium)^t. Simple but double counts risk if cash flows are already pessimistic.
- **Certainty Equivalent (CE)** deflates the risky cash flow instead and discounts at the risk-free rate: NPV = Sum of (alpha_t x CFt) / (1 + Rf)^t. Theoretically cleaner because it separates risk from time.

### 2. Statistical Techniques
Sensitivity analysis varies one input at a time to find the *switching value* — the point where NPV turns zero. Scenario analysis bundles inputs into coherent states. Monte Carlo simulation samples from probability distributions to build an NPV distribution.

### 3. Decision Trees & Real Options
A decision tree maps sequential choices with probability-weighted payoffs, rolled back from terminal nodes. **Real options** recognise that management can adapt: the option to expand a successful plant, abandon a failing one, defer until regulations clarify, or switch inputs. These options have positive value that plain NPV ignores.

### Capital Rationing
When funds are capped, projects are ranked by **Profitability Index (PI = PV of inflows / initial outlay)** and selected greedily until the budget is exhausted. In multi-period rationing this becomes a 0-1 integer programming problem solved by linear programming.`,
      formulas: [
        {
          id: 'formula-afm-7',
          label: 'Certainty Equivalent NPV',
          formula: 'NPV = Sum over t of [ (alpha_t x CF_t) / (1 + Rf)^t ] - Initial Outlay',
          exampleQ:
            'Outlay Rs 100 lakh; year 1 risky CF Rs 60 lakh with alpha 0.90; year 2 CF Rs 70 lakh with alpha 0.80; Rf = 10%. Find NPV.',
          exampleA:
            'CE1 = 54, CE2 = 56. NPV = 54/1.10 + 56/1.21 - 100 = 49.09 + 46.28 - 100 = -Rs 4.63 lakh. Reject.',
        },
        {
          id: 'formula-afm-8',
          label: 'Profitability Index for Capital Rationing',
          formula: 'PI = Present Value of Cash Inflows / Initial Investment',
          exampleQ:
            'Projects A (outlay 50, PV 70), B (outlay 30, PV 45), C (outlay 20, PV 26); budget Rs 50 lakh. Select the set.',
          exampleA:
            'PI: A = 1.40, B = 1.50, C = 1.30. Rank B then A. B(30) + A(50) = 80 exceeds budget, so take B(30) then C(20) = 50 exactly, total PV 71. That beats A alone (PV 70).',
        },
      ],
      tricks: [
        {
          id: 'trick-afm-4',
          title: 'PI Beats NPV Under Rationing',
          trick:
            'Under a capital constraint never rank by absolute NPV — rank by PI (value per rupee invested). A small high-PI project usually outperforms one large high-NPV project once the budget binds.',
          whenToUse: 'Any capital rationing problem with a stated budget ceiling.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-afm-7',
          step: 'Step 1: Convert Risky Cash Flows into Certainty Equivalents',
          detail:
            'Multiply each year\u2019s cash flow by its alpha coefficient. Do NOT also add a risk premium to the discount rate — that double counts risk.',
          questionType: 'Risk-Adjusted Investment Appraisal',
        },
        {
          id: 'solve-afm-8',
          step: 'Step 2: Rank, Pack to the Budget, and State Total NPV',
          detail:
            'Sort by PI descending, add projects until the budget is exhausted, then report the combined NPV of the selected portfolio rather than of any single project.',
          questionType: 'Capital Rationing Decision',
        },
      ],
    },
    {
      id: 'afm-mod5-working-capital-restructuring',
      subjectId: 'mcom-karnataka-adv-fin-mgmt',
      title: 'Working Capital Policy & Corporate Restructuring',
      moduleNumber: 5,
      moduleName: 'Module 5: Working Capital & Restructuring',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-afm-mod5-01', 'q-afm-mod5-02'],
      subtopics: [
        'Aggressive, conservative and matching (hedging) financing policies',
        'Operating cycle, cash conversion cycle and cash budgeting',
        'Receivables management: credit appraisal, terms and collection policy',
        'Inventory models: EOQ, safety stock and JIT in Indian manufacturing',
        'Corporate restructuring: mergers, demergers, buybacks and LBOs',
      ],
      explanationMd: `# Working Capital Policy & Corporate Restructuring

### Working Capital Policy Choices
The financing decision is about **maturity matching**:
- **Aggressive** policy funds part of permanent current assets with short-term borrowing. Cheaper but exposes the firm to rollover and rate risk.
- **Conservative** policy funds all permanent assets plus part of fluctuating assets with long-term funds. Safer but carries idle capital cost.
- **Matching (hedging)** aligns the maturity of each asset with its funding source — the textbook neutral position.

### The Cash Conversion Cycle
CCC = Inventory holding period + Receivables collection period - Payables deferral period. A shorter cycle means less external funding is needed. Indian FMCG firms such as Hindustan Unilever famously run **negative** working capital cycles because they collect from trade before paying suppliers, generating free float.

### Receivables and Inventory
Credit policy trades incremental profit on extra sales against the cost of blocked funds and bad debts. Inventory policy uses EOQ = sqrt(2DS / H) to balance ordering and carrying cost, with safety stock covering lead-time variability; JIT pushes carrying cost toward zero but raises stockout risk.

### Corporate Restructuring
Restructuring covers mergers and acquisitions (horizontal, vertical, conglomerate), demergers under Section 2(19AA) of the Income-tax Act, share buybacks under Section 68 of the Companies Act 2013, and leveraged buyouts financed largely by target debt. Valuation in M&A uses DCF, comparable multiples and the **synergy-adjusted** bid ceiling: maximum bid = standalone value + present value of synergies.`,
      formulas: [
        {
          id: 'formula-afm-9',
          label: 'Cash Conversion Cycle',
          formula: 'CCC = DIO + DSO - DPO',
          exampleQ:
            'Inventory days 45, receivables days 60, payables days 30. Compute CCC and interpret.',
          exampleA:
            'CCC = 45 + 60 - 30 = 75 days. The firm funds 75 days of operations from its own resources before cash returns.',
        },
        {
          id: 'formula-afm-10',
          label: 'Economic Order Quantity',
          formula: 'EOQ = sqrt( (2 x D x S) / H )',
          exampleQ: 'Annual demand 10,000 units, ordering cost Rs 200, carrying cost Rs 4/unit/year. Find EOQ.',
          exampleA: 'EOQ = sqrt((2 x 10000 x 200)/4) = sqrt(1,000,000) = 1,000 units.',
        },
      ],
      tricks: [
        {
          id: 'trick-afm-5',
          title: 'Negative CCC Is a Competitive Moat',
          trick:
            'If DPO exceeds DIO + DSO the cycle is negative: suppliers are financing the business. Flag it immediately in case analysis and treat it as a source of free working capital, not an error.',
          whenToUse: 'Working capital case studies and FMCG ratio analysis.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-afm-9',
          step: 'Step 1: Prepare the Operating Cycle Schedule',
          detail:
            'Convert raw material, WIP, finished goods, receivables and payables periods into days, then derive gross and net working capital requirements.',
          questionType: 'Working Capital Estimation (10 Marks)',
        },
        {
          id: 'solve-afm-10',
          step: 'Step 2: Compare Financing Alternatives by Cost',
          detail:
            'Cost short-term and long-term funding separately, add the interest on each tranche, and recommend the policy with the lower total cost that still meets the firm\u2019s risk tolerance.',
          questionType: 'Working Capital Estimation (10 Marks)',
        },
      ],
    },
  ],

  // ── 2. Monetary System & Central Banking (Sem 1) ──
  'mcom-karnataka-monetary-system': [
    {
      id: 'mon-mod1-money-functions',
      subjectId: 'mcom-karnataka-monetary-system',
      title: 'Money: Functions, Types & Monetary Standards',
      moduleNumber: 1,
      moduleName: 'Module 1: Foundations of Money & Monetary Standards',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-mon-mod1-01', 'q-mon-mod1-02'],
      subtopics: [
        'Definition and evolution of money: barter to commodity to fiat',
        'Primary, secondary and contingent functions of money',
        'Classification: full-bodied, token, credit, near money and plastic money',
        'Monetary standards: gold bullion, gold exchange and paper standards',
        'Quantity theory of money: Fisher equation and Cambridge cash-balance approach',
      ],
      explanationMd: `# Money: Functions, Types & Monetary Standards

### Why Money Exists
Barter fails on the **double coincidence of wants**, indivisibility and the absence of a store of value. Money solves all three, which is why every economy converges on it.

### Functions
- **Primary**: medium of exchange and measure of value (unit of account).
- **Secondary**: store of value and standard of deferred payment.
- **Contingent**: distribution of national income, maximisation of utility, and the basis of the credit system.

### Types
Full-bodied money has intrinsic value equal to face value (gold coins). Token money has less intrinsic value than face value (Indian coins). **Credit money** — bank deposits — dominates modern economies and is created by lending. Near money (term deposits, Treasury bills) is highly liquid but not directly spendable.

### Monetary Standards
Under the **gold standard**, currency was convertible into a fixed quantity of gold, imposing automatic balance-of-payments discipline through the price-specie-flow mechanism. The **gold exchange standard** pegged currency to a gold-convertible foreign currency. India today operates a **managed paper standard**: the rupee is inconvertible into gold and floats within a managed band.

### Quantity Theory
Fisher's equation MV = PT links money supply to the price level, assuming V and T are stable in the short run. The Cambridge school (Marshall, Pigou) reframed it as demand for cash balances, M = kPY, where k is the fraction of income people wish to hold as money.`,
      formulas: [
        {
          id: 'formula-mon-1',
          label: "Fisher's Equation of Exchange",
          formula: 'M x V = P x T',
          exampleQ:
            'Money supply Rs 2,00,000 crore, velocity 5, transactions volume 10,000 crore units. Find the price level.',
          exampleA: 'P = (M x V) / T = (2,00,000 x 5) / 10,000 = Rs 100 per unit.',
        },
        {
          id: 'formula-mon-2',
          label: 'Cambridge Cash-Balance Equation',
          formula: 'M = k x P x Y',
          exampleQ: 'Nominal income PY = Rs 1,00,000 crore and k = 0.20. Find money demand.',
          exampleA: 'M = 0.20 x 1,00,000 = Rs 20,000 crore.',
        },
      ],
      tricks: [
        {
          id: 'trick-mon-1',
          title: 'MSMDC for the Functions of Money',
          trick:
            'Recall Medium of exchange, Standard of value, Measure/store of value, Deferred payments, Contingent uses. Listing all five secures the full 5-mark allocation instantly.',
          whenToUse: 'Short-answer theory questions on money.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-mon-1',
          step: 'Step 1: Identify Which Variables Are Held Constant',
          detail:
            'Classical quantity theory assumes V and T are fixed in the short run, so a change in M translates proportionally into P. State this assumption explicitly before solving.',
          questionType: 'Theory / 5-Mark Question',
        },
        {
          id: 'solve-mon-2',
          step: 'Step 2: Solve for the Unknown and Interpret in Words',
          detail:
            'Rearrange MV = PT for the unknown, then express the result as an economic statement (for example, doubling M doubles P).',
          questionType: 'Theory / 5-Mark Question',
        },
      ],
    },
    {
      id: 'mon-mod2-rbi-policy',
      subjectId: 'mcom-karnataka-monetary-system',
      title: 'RBI Monetary Policy Framework & Policy Instruments',
      moduleNumber: 2,
      moduleName: 'Module 2: Central Banking & Monetary Policy',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-mon-mod2-01', 'q-mon-mod2-02'],
      subtopics: [
        'Objectives and functions of the Reserve Bank of India',
        'Monetary Policy Committee (MPC) constitution and the 4% +/- 2% inflation target',
        'Quantitative instruments: CRR, SLR, OMO, LAF repo and reverse repo, SDF and MSF',
        'Qualitative instruments: margin requirements, credit rationing, moral suasion',
        'Liquidity Adjustment Facility corridor and the transmission to lending rates',
      ],
      explanationMd: `# RBI Monetary Policy Framework & Instruments

### Institutional Framework
The RBI Act 1934 established the central bank; the Banking Regulation Act 1949 gives it supervisory power over commercial banks. Since the 2016 amendment, a six-member **Monetary Policy Committee** sets policy, with a statutory target of CPI inflation of **4% with a tolerance band of plus or minus 2%**.

### Quantitative (General) Instruments
- **CRR**: the cash banks must park with the RBI, earning no interest. A blunt instrument — it changes liquidity without signaling a rate view.
- **SLR**: the share of deposits held in gold, cash or approved securities.
- **Repo rate**: the rate at which banks borrow overnight against government securities. It is the primary policy signal.
- **Reverse repo / SDF**: absorb surplus liquidity. The **Standing Deposit Facility** now forms the floor of the corridor.
- **MSF**: the ceiling — banks borrow beyond repo eligibility at a penal spread (typically 25 bps above repo).
- **Open Market Operations**: outright purchase or sale of government securities to inject or drain durable liquidity.

### Qualitative (Selective) Instruments
Margin requirements on collateral, sectoral credit ceilings, moral suasion and direct action target *where* credit flows rather than how much.

### Transmission
A repo cut lowers banks' marginal cost of funds, which feeds the EBLR/MCLR-linked lending rates. Transmission is imperfect in India because of sticky small-savings rates, high NPAs and large government borrowing crowding out bank funds.`,
      formulas: [
        {
          id: 'formula-mon-3',
          label: 'Money Multiplier (Simple Reserve Model)',
          formula: 'm = (1 + c) / (c + r + e)',
          exampleQ:
            'Currency-deposit ratio c = 0.40, required reserve ratio r = 0.10, excess reserve ratio e = 0.05. Find the multiplier.',
          exampleA: 'm = (1 + 0.40) / (0.40 + 0.10 + 0.05) = 1.40 / 0.55 = 2.545. Every Rs 1 of high-powered money supports Rs 2.545 of broad money.',
        },
      ],
      tricks: [
        {
          id: 'trick-mon-2',
          title: 'SDF-Repo-MSF Corridor',
          trick:
            'Remember the corridor bottom-to-top: SDF (floor) -> Repo (policy rate) -> MSF (ceiling, repo + 25 bps). Drawing a one-line corridor diagram earns presentation marks in every monetary policy answer.',
          whenToUse: 'Any question on LAF or policy rate transmission.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-mon-3',
          step: 'Step 1: Classify the Instrument as Quantitative or Qualitative',
          detail:
            'Quantitative instruments change the volume of credit; qualitative instruments change its direction. Misclassifying costs a mark immediately.',
          questionType: 'Theory / 10-Mark Question',
        },
        {
          id: 'solve-mon-4',
          step: 'Step 2: Trace the Transmission Chain to the Real Economy',
          detail:
            'Move from the policy rate to bank funding cost, then to lending rates, credit growth, aggregate demand and finally inflation. Conclude with the constraint on transmission.',
          questionType: 'Theory / 10-Mark Question',
        },
      ],
    },
    {
      id: 'mon-mod3-money-supply',
      subjectId: 'mcom-karnataka-monetary-system',
      title: 'Money Supply Measures, H-Money & Credit Creation',
      moduleNumber: 3,
      moduleName: 'Module 3: Money Supply & Credit Creation',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-mon-mod3-01', 'q-mon-mod3-02'],
      subtopics: [
        'Aggregates M0, M1, M2, M3 and M4 in decreasing order of liquidity',
        'Reserve money (H) and its sources and uses in the RBI balance sheet',
        'Credit creation by commercial banks and the deposit multiplier',
        'Leakages: cash drain, excess reserves and time deposit shifts',
        'Money supply endogeneity and the RBI\u2019s sterilisation operations',
      ],
      explanationMd: `# Money Supply Measures & Credit Creation

### The Indian Aggregates
- **M0 (Reserve Money)** = currency in circulation + bankers' deposits with RBI + 'other' deposits with RBI. It is the liability side of the RBI balance sheet and the base from which all money is multiplied.
- **M1 (Narrow Money)** = currency with the public + demand deposits with banks + other deposits with RBI. The most liquid measure.
- **M2** = M1 + savings deposits with post office savings banks.
- **M3 (Broad Money)** = M1 + time deposits with banks + call/term funding from financial institutions. The aggregate the RBI targets and reports most often.
- **M4** = M3 + total deposits with post offices (excluding NSCs).

Liquidity falls from M1 to M4; magnitude rises in the same direction.

### Credit Creation
A bank receiving a Rs 100 deposit keeps the required reserve and lends the rest. The borrower spends it, it is redeposited elsewhere, and the process repeats. With a 10% reserve ratio the system creates Rs 1,000 of deposits — a multiplier of 1/r.

### Leakages
The textbook multiplier assumes zero leakages. In practice the process is truncated by the **cash drain** (public holds currency rather than redepositing), **excess reserves** held for prudence, and shifts into time deposits. The realistic Indian money multiplier is roughly 5 to 6 rather than 1/r.

### Endogeneity
Post-Keynesians argue money supply is *endogenous* — created by credit demand rather than controlled by the central bank. The RBI's sterilisation of foreign exchange inflows (selling securities to absorb the rupee created by dollar purchases) is the practical illustration.`,
      formulas: [
        {
          id: 'formula-mon-4',
          label: 'Deposit Expansion Multiplier',
          formula: 'Total Deposits = Initial Deposit x (1 / r)',
          exampleQ: 'An initial deposit of Rs 500 crore enters the system with a 20% reserve ratio. Find total deposits created.',
          exampleA: 'Total deposits = 500 x (1/0.20) = Rs 2,500 crore; credit created = 2,500 - 500 = Rs 2,000 crore.',
        },
      ],
      tricks: [
        {
          id: 'trick-mon-3',
          title: 'M1 is Narrow, M3 is Broad',
          trick:
            'M1 = Currency + Demand Deposits + Other RBI Deposits. M3 = M1 + Time Deposits. If a question says "broad money" answer M3; if it says "narrow" or "transaction money" answer M1.',
          whenToUse: 'Definitions and 2-mark objective questions on aggregates.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-mon-5',
          step: 'Step 1: Identify the Aggregate Being Asked For',
          detail:
            'Match the components listed in the question to M0, M1, M3 or M4 before attempting any arithmetic.',
          questionType: 'Numerical / Conceptual',
        },
        {
          id: 'solve-mon-6',
          step: 'Step 2: Apply the Multiplier and Then Adjust for Leakages',
          detail:
            'Compute the theoretical expansion, then state which leakages would reduce it and why the realised figure is lower.',
          questionType: 'Numerical / Conceptual',
        },
      ],
    },
    {
      id: 'mon-mod4-inflation-targeting',
      subjectId: 'mcom-karnataka-monetary-system',
      title: 'Inflation, Phillips Curve & Inflation Targeting',
      moduleNumber: 4,
      moduleName: 'Module 4: Inflation & Price Stability',
      order: 4,
      difficulty: 'core',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-mon-mod4-01', 'q-mon-mod4-02'],
      subtopics: [
        'Demand-pull, cost-push and structural inflation in the Indian context',
        'Measuring inflation: WPI, CPI and the GDP deflator',
        'The Phillips curve: short-run trade-off and the expectations-augmented long-run curve',
        'NAIRU and the sacrifice ratio in disinflation',
        'Flexible inflation targeting adopted by India in 2016',
      ],
      explanationMd: `# Inflation, Phillips Curve & Inflation Targeting

### Types of Inflation
- **Demand-pull**: aggregate demand outruns supply at full employment; "too much money chasing too few goods".
- **Cost-push**: rising input prices — crude oil, fertiliser, wages — shift aggregate supply leftward. India's imported-inflation episodes of 2008 and 2022 are classic examples.
- **Structural**: bottlenecks in supply chains, agrarian marketing and infrastructure that no monetary action can cure quickly.

### Measurement
**WPI** covers wholesale prices of 697 items and is published weekly-then-monthly; **CPI** covers retail prices of a household basket and is the RBI's target variable since 2014. The **GDP deflator** is the broadest measure, derived as the ratio of nominal to real GDP.

### The Phillips Curve
The original curve showed a stable inverse relation between unemployment and wage inflation. Friedman and Phelps demolished its long-run validity by adding **adaptive expectations**: once workers expect inflation, the trade-off vanishes and the long-run Phillips curve is vertical at the **NAIRU**. Only unanticipated inflation can temporarily reduce unemployment.

### Inflation Targeting
India formally adopted flexible inflation targeting in 2016: CPI 4% with a 2% band, set by a statutory MPC that must publish an explanation if it breaches the band for three consecutive quarters. "Flexible" means the RBI may weigh growth and financial stability alongside the target — visible in the accommodative stance of 2020-21.`,
      formulas: [
        {
          id: 'formula-mon-5',
          label: 'Real Interest Rate (Fisher Effect)',
          formula: 'Real Rate = Nominal Rate - Expected Inflation',
          exampleQ: 'Nominal repo rate 6.5%, expected CPI inflation 5.0%. Find the real policy rate.',
          exampleA: 'Real rate = 6.5 - 5.0 = 1.5% (ex ante). A positive real rate indicates a restrictive stance.',
        },
        {
          id: 'formula-mon-6',
          label: 'Sacrifice Ratio',
          formula: 'Sacrifice Ratio = Cumulative Loss of Output (%) / Reduction in Inflation (pp)',
          exampleQ: 'Disinflation of 3 percentage points costs 6% of GDP cumulatively. Find the sacrifice ratio.',
          exampleA: 'Sacrifice ratio = 6 / 3 = 2. Two percent of annual output is forgone per percentage point of inflation removed.',
        },
      ],
      tricks: [
        {
          id: 'trick-mon-4',
          title: 'Short-Run Slopes, Long-Run Is Vertical',
          trick:
            'Always draw two curves: a downward short-run Phillips curve and a vertical long-run one at NAIRU. Mentioning expectations and NAIRU by name is what separates a 6-mark answer from a 10-mark answer.',
          whenToUse: 'Any question on the inflation-unemployment trade-off.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-mon-7',
          step: 'Step 1: Diagnose the Source of Inflation',
          detail:
            'Decide whether the shock is demand-side or supply-side, because the policy prescription differs: tighten for demand-pull, but supply-side reform for cost-push.',
          questionType: 'Analytical / 10-Mark Question',
        },
        {
          id: 'solve-mon-8',
          step: 'Step 2: Evaluate the Policy Response and Its Cost',
          detail:
            'Assess the monetary action, then quantify the output cost using the sacrifice ratio and comment on credibility and anchoring of expectations.',
          questionType: 'Analytical / 10-Mark Question',
        },
      ],
    },
    {
      id: 'mon-mod5-financial-reforms',
      subjectId: 'mcom-karnataka-monetary-system',
      title: 'Financial Sector Reforms, NPAs & Digital Payments',
      moduleNumber: 5,
      moduleName: 'Module 5: Financial Sector Reform & Modernisation',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-mon-mod5-01', 'q-mon-mod5-02'],
      subtopics: [
        'Narasimham Committee recommendations (1991 and 1998) and their implementation',
        'Asset quality: NPA classification, provisioning norms and the twin balance sheet problem',
        'Resolution architecture: SARFAESI, IBC 2016, NCLT and the bad bank (NARCL)',
        'Payment systems: NEFT, RTGS, IMPS, UPI, AEPS and the CBDC (e-Rupee)',
        'Financial inclusion: PMJDY, JAM trinity and DBT',
      ],
      explanationMd: `# Financial Sector Reforms, NPAs & Digital Payments

### The Reform Arc
The **Narasimham Committee I (1991)** recommended cutting CRR and SLR, freeing interest rates, introducing prudential norms and reducing directed credit. **Committee II (1998)** focused on capital adequacy, income recognition and narrow banking. Together they transformed Indian banking from a controlled to a market-oriented system.

### Asset Quality and NPAs
An account becomes an NPA when interest or principal remains overdue beyond 90 days. Classification then moves through Sub-standard, Doubtful (D1-D3) and Loss, with provisioning rising from 15% to 100%. The **twin balance sheet problem** — stressed corporates and stressed banks simultaneously — dominated Indian credit cycles from 2013 to 2019.

### Resolution Architecture
- **SARFAESI 2002** lets secured lenders enforce security without court intervention.
- **IBC 2016** created a time-bound (330 day) corporate insolvency process run by the NCLT, shifting control from debtor to creditor — a structural change in Indian credit culture.
- **NARCL / IDRCL** ("bad bank") aggregates large stressed assets for resolution.

### Payments and Inclusion
**UPI** revolutionised retail payments, processing tens of billions of transactions monthly through a zero-fee interoperable rail. The **e-Rupee** CBDC pilots wholesale and retail digital currency. Financial inclusion runs through **PMJDY** accounts, the **JAM trinity** (Jan Dhan-Aadhaar-Mobile) and Direct Benefit Transfer, which removed leakage by paying beneficiaries directly.`,
      formulas: [
        {
          id: 'formula-mon-7',
          label: 'Gross NPA Ratio',
          formula: 'GNPA % = (Gross NPAs / Gross Advances) x 100',
          exampleQ: 'Gross advances Rs 8,00,000 crore and gross NPAs Rs 28,000 crore. Find the GNPA ratio.',
          exampleA: 'GNPA % = (28,000 / 8,00,000) x 100 = 3.5%.',
        },
      ],
      tricks: [
        {
          id: 'trick-mon-5',
          title: 'Gross vs Net NPA',
          trick:
            'Net NPA = Gross NPA - Provisions. Questions often give gross NPA and the provision coverage ratio; compute Net NPA before the ratio, or you will overstate asset quality problems.',
          whenToUse: 'Banking sector ratio questions and case analysis.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-mon-9',
          step: 'Step 1: Map the Problem to the Correct Reform Instrument',
          detail:
            'Distinguish recognition (IRACP norms), resolution (IBC, SARFAESI) and recapitalisation (government capital infusion). Answers that blur these three lose structure marks.',
          questionType: 'Essay / 10-Mark Question',
        },
        {
          id: 'solve-mon-10',
          step: 'Step 2: Evaluate Outcomes with Evidence',
          detail:
            'Cite measurable outcomes — declining GNPA ratios, IBC recovery rates versus liquidation value, UPI transaction volumes — and note remaining gaps such as haircuts in IBC resolutions.',
          questionType: 'Essay / 10-Mark Question',
        },
      ],
    },
  ],

  // ── 3. International Business (Sem 2) ──
  'mcom-karnataka-intl-business': [
    {
      id: 'ib-mod1-trade-theories',
      subjectId: 'mcom-karnataka-intl-business',
      title: 'Globalisation, Theories of International Trade & FDI',
      moduleNumber: 1,
      moduleName: 'Module 1: Foundations of International Business',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-ib-mod1-01', 'q-ib-mod1-02'],
      subtopics: [
        'Globalisation: drivers, dimensions and the India liberalisation context',
        'Absolute advantage (Smith) and comparative advantage (Ricardo)',
        'Heckscher-Ohlin factor endowment theory and the Leontief paradox',
        'Product life cycle theory (Vernon) and intra-industry trade',
        'FDI theories: OLI paradigm, and FDI versus FPI in India',
      ],
      explanationMd: `# Theories of International Trade & FDI

### Classical Foundations
**Adam Smith's absolute advantage** holds that countries should specialise where they are absolutely more efficient. **Ricardo's comparative advantage** is the stronger result: trade benefits both countries even if one is absolutely better at everything, provided they specialise by *relative* efficiency — because opportunity cost, not absolute cost, governs the gains from trade.

### Modern Theories
**Heckscher-Ohlin** explains comparative advantage through factor endowments: a capital-abundant country exports capital-intensive goods, a labour-abundant country exports labour-intensive goods. The **Leontief paradox** — that the capital-rich United States exported labour-intensive goods — motivated human capital and technology-gap refinements.

**Vernon's product life cycle** theory traces a product from innovation in an advanced economy, through export, foreign production and finally import back, explaining why manufacturing migrates to low-cost locations.

### Foreign Direct Investment
**Dunning's OLI (eclectic) paradigm** explains FDI through Ownership advantages (technology, brand), Location advantages (market, cost) and Internalisation advantages (keeping transactions inside the firm rather than licensing). India receives FDI under the automatic route for most sectors, with cap limits in defence, insurance and retail; FDI is distinguished from FPI by the 10% holding threshold that signals control.`,
      formulas: [
        {
          id: 'formula-ib-1',
          label: 'Comparative Advantage (Opportunity Cost Test)',
          formula: 'Country A has comparative advantage in X if (Cost of X / Cost of Y)_A < (Cost of X / Cost of Y)_B',
          exampleQ:
            'India needs 10 labour hours for 1 unit of textiles and 20 for 1 unit of software; the US needs 5 for textiles and 4 for software. Who has comparative advantage in textiles?',
          exampleA:
            'India: 10/20 = 0.5 software forgone per textile. US: 5/4 = 1.25 software forgone per textile. India forgoes less, so India has the comparative advantage in textiles despite the absolute disadvantage.',
        },
      ],
      tricks: [
        {
          id: 'trick-ib-1',
          title: 'Absolute = Productivity, Comparative = Opportunity Cost',
          trick:
            'Never answer a comparative advantage question using productivity alone. Always build the opportunity-cost ratio for both goods in both countries; the lower ratio wins.',
          whenToUse: 'Trade theory numericals and 5-mark questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ib-1',
          step: 'Step 1: Compute Opportunity Costs for Both Goods in Both Countries',
          detail: 'Build a 2x2 table of labour (or capital) requirements and convert to forgone-good ratios.',
          questionType: 'Trade Theory Numerical',
        },
        {
          id: 'solve-ib-2',
          step: 'Step 2: Identify Specialisation and Show Mutual Gain',
          detail:
            'State which country exports which good, then demonstrate that both consume beyond their own production possibility frontier after trade.',
          questionType: 'Trade Theory Numerical',
        },
      ],
    },
    {
      id: 'ib-mod2-bop-fx',
      subjectId: 'mcom-karnataka-intl-business',
      title: 'Balance of Payments & Exchange Rate Determination',
      moduleNumber: 2,
      moduleName: 'Module 2: External Sector Accounts & Foreign Exchange',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-ib-mod2-01', 'q-ib-mod2-02'],
      subtopics: [
        'BOP structure: current, capital and financial accounts',
        'Current account deficit financing and sustainability',
        'Exchange rate systems: fixed, floating and managed float',
        'Purchasing power parity and interest rate parity',
        'FEMA 1999, the rupee reference rate and RBI intervention',
      ],
      explanationMd: `# Balance of Payments & Exchange Rates

### BOP Structure
The BOP records all transactions between residents and the rest of the world.
- **Current account**: trade in goods and services, primary income (investment income) and secondary income (remittances). India runs a persistent goods deficit partly offset by services exports and remittances.
- **Capital account**: capital transfers and non-produced, non-financial assets.
- **Financial account**: FDI, FPI, external commercial borrowing and banking flows.

By double-entry construction the BOP must sum to zero; an official reserves transaction balances any residual. A **current account deficit** is sustainable when financed by long-term FDI rather than volatile short-term debt — the lesson of the 1991 crisis.

### Exchange Rate Systems
Under **fixed rates** the central bank commits reserves to defend a parity. Under **floating rates** the market sets the rate through supply and demand for foreign exchange. India operates a **managed float**: the RBI intervenes to smooth volatility without targeting a level.

### Parity Conditions
**Purchasing Power Parity**: S1/S0 = (1 + inflation_domestic) / (1 + inflation_foreign) — exchange rates adjust to offset inflation differentials. **Interest Rate Parity**: the forward premium or discount equals the interest rate differential, eliminating riskless arbitrage.

### Regulation
FEMA 1999 replaced the restrictive FERA with a facilitative framework for external transactions, and the RBI publishes daily reference rates for the USD, EUR, GBP and JPY against the rupee.`,
      formulas: [
        {
          id: 'formula-ib-2',
          label: 'Purchasing Power Parity (Relative Form)',
          formula: 'S1 = S0 x [(1 + i_d) / (1 + i_f)]',
          exampleQ:
            'The spot rate is Rs 83/USD. Indian inflation is 6% and US inflation 2%. Estimate the one-year forward rate under PPP.',
          exampleA: 'S1 = 83 x (1.06 / 1.02) = 83 x 1.0392 = Rs 86.25/USD. The rupee depreciates as domestic inflation exceeds foreign inflation.',
        },
      ],
      tricks: [
        {
          id: 'trick-ib-2',
          title: 'Higher Inflation = Currency Depreciation',
          trick:
            'The country with higher inflation must see its currency depreciate to preserve PPP. If your computed rate shows appreciation for the high-inflation country, you inverted the ratio.',
          whenToUse: 'All PPP and forward rate numericals.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ib-3',
          step: 'Step 1: Classify Every Transaction into the Correct Account',
          detail:
            'Goods, services, income and transfers go to the current account; investment and borrowing flows go to the financial account. Misclassification breaks the whole schedule.',
          questionType: 'BOP Schedule Numerical',
        },
        {
          id: 'solve-ib-4',
          step: 'Step 2: Compute the Balance and Identify the Financing Source',
          detail:
            'Derive the current and overall balances, then state whether the deficit is financed by reserves drawdown, FDI or short-term borrowing and comment on sustainability.',
          questionType: 'BOP Schedule Numerical',
        },
      ],
    },
    {
      id: 'ib-mod3-entry-modes',
      subjectId: 'mcom-karnataka-intl-business',
      title: 'Market Entry Modes, Global Strategy & Value Chains',
      moduleNumber: 3,
      moduleName: 'Module 3: Global Strategy & Market Entry',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-ib-mod3-01', 'q-ib-mod3-02'],
      subtopics: [
        'Exporting, licensing, franchising, joint ventures and wholly owned subsidiaries',
        'The risk-control-return trade-off across entry modes',
        'Bartlett and Ghoshal: international, multidomestic, global and transnational strategies',
        'Integration-responsiveness (IR) framework',
        'Global value chains, offshoring and India\u2019s GCC ecosystem',
      ],
      explanationMd: `# Market Entry Modes & Global Strategy

### The Entry Mode Ladder
Entry modes form a ladder of increasing commitment, risk and control:
1. **Indirect/direct exporting** — lowest risk and control; suits initial market testing.
2. **Licensing** — grants IP rights for a royalty; low capital but risks creating a competitor.
3. **Franchising** — licensing plus a controlled business system (McDonald's, Domino's in India).
4. **Joint venture** — shared equity and local knowledge; risk of partner conflict and technology leakage.
5. **Wholly owned subsidiary** — maximum control and profit retention, highest capital exposure and political risk.

### Strategic Postures (Bartlett & Ghoshal)
- **International**: exports home-country competencies; low local responsiveness.
- **Multidomestic**: decentralised subsidiaries tailored to each market; high responsiveness, low global integration.
- **Global**: standardised products produced at optimal scale; high integration, low responsiveness.
- **Transnational**: simultaneously pursues global efficiency and local responsiveness — the hardest to execute.

The **Integration-Responsiveness framework** maps the pressure for global integration against local responsiveness and dictates which posture fits.

### Global Value Chains
Production is fragmented across borders according to comparative advantage. India has become a global hub for **Global Capability Centres**, exporting IT and business services rather than goods — a distinctive pattern of participation in global value chains.`,
      formulas: [
        {
          id: 'formula-ib-3',
          label: 'Entry Mode Risk-Return Ordering',
          formula: 'Commitment (and Risk, Control) increases: Export < Licensing < Franchising < JV < Wholly Owned Subsidiary',
          exampleQ:
            'A Bengaluru software firm wants full protection of its proprietary algorithm in Germany. Which entry mode minimises IP leakage risk?',
          exampleA:
            'A wholly owned subsidiary. Licensing and joint ventures both require transferring the algorithm to a third party, creating appropriation risk that full ownership avoids.',
        },
      ],
      tricks: [
        {
          id: 'trick-ib-3',
          title: 'Control Moves With Commitment',
          trick:
            'Draw one arrow: as equity commitment rises, control rises and flexibility falls. Any "choose the entry mode" answer must state the specific trade-off it is accepting.',
          whenToUse: 'Entry mode case studies.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ib-5',
          step: 'Step 1: Diagnose the Integration-Responsiveness Pressures',
          detail:
            'Score the industry on cost pressure (global integration) versus local adaptation pressure to locate the firm in the IR framework.',
          questionType: 'Global Strategy Case Study',
        },
        {
          id: 'solve-ib-6',
          step: 'Step 2: Select and Justify the Posture and Entry Mode',
          detail:
            'Recommend a strategy and entry mode, then defend it against the main alternative by naming the risk being traded away.',
          questionType: 'Global Strategy Case Study',
        },
      ],
    },
    {
      id: 'ib-mod4-wto-integration',
      subjectId: 'mcom-karnataka-intl-business',
      title: 'WTO, Regional Integration & India\u2019s Trade Agreements',
      moduleNumber: 4,
      moduleName: 'Module 4: Multilateral & Regional Trade Architecture',
      order: 4,
      difficulty: 'core',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-ib-mod4-01', 'q-ib-mod4-02'],
      subtopics: [
        'GATT to WTO: principles of MFN and national treatment',
        'Dispute settlement mechanism and the Appellate Body impasse',
        'Levels of economic integration: PTA, FTA, customs union, common market, economic union',
        'SAFTA, ASEAN, RCEP and India\u2019s bilateral CEPA/FTA strategy',
        'Trade creation versus trade diversion',
      ],
      explanationMd: `# WTO, Regional Integration & India's Trade Agreements

### The Multilateral System
The **WTO** (1995) succeeded GATT with a permanent institution and binding dispute settlement. Two principles underpin it: **Most-Favoured-Nation** (any concession to one member extends to all) and **National Treatment** (imported goods treated no worse than domestic ones once inside the border). Agreements span goods (GATT), services (GATS) and intellectual property (TRIPS).

### Levels of Integration
Integration deepens in stages: **Preferential Trade Area** (partial tariff cuts) → **Free Trade Area** (no internal tariffs, independent external tariffs) → **Customs Union** (common external tariff) → **Common Market** (plus factor mobility) → **Economic Union** (harmonised policy and often a common currency).

### Trade Creation vs Trade Diversion
Viner's distinction is critical: an FTA creates welfare when it shifts production from a high-cost domestic producer to a lower-cost partner (**trade creation**), but harms welfare when it shifts imports from a more efficient non-member to a less efficient member simply because the tariff is removed (**trade diversion**).

### India's Position
India is party to SAFTA and ASEAN agreements and has signed CEPAs with the UAE and Australia. It withdrew from RCEP negotiations in 2019, citing insufficient safeguards against import surges and inadequate services mobility — a decision still debated in Karnataka's export-oriented IT and textile sectors.`,
      formulas: [
        {
          id: 'formula-ib-4',
          label: 'Trade Diversion Test',
          formula: 'Trade Diversion occurs when: Tariff-inclusive cost from efficient non-member < Tariff-free cost from FTA partner',
          exampleQ:
            'A non-member sells at $90 with a 10% tariff (total $99). An FTA partner sells tariff-free at $100. Does joining the FTA divert trade?',
          exampleA:
            'Yes. Before the FTA the importer bought from the non-member at $99; after, it buys from the partner at $100. Trade is diverted to a less efficient producer and welfare falls by $1 per unit.',
        },
      ],
      tricks: [
        {
          id: 'trick-ib-4',
          title: 'FTA vs Customs Union = Common External Tariff',
          trick:
            'The single distinguishing feature between an FTA and a customs union is the common external tariff. Mention it and the 2-mark distinction question is secured.',
          whenToUse: 'Integration levels and WTO theory questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ib-7',
          step: 'Step 1: Compute Landed Cost With and Without the Agreement',
          detail:
            'Apply tariffs to the non-member price and compare with the partner\u2019s tariff-free price to determine the actual sourcing change.',
          questionType: 'Trade Policy Numerical',
        },
        {
          id: 'solve-ib-8',
          step: 'Step 2: Classify as Creation or Diversion and Comment on Welfare',
          detail:
            'State the classification explicitly and quantify the welfare effect, noting any offsetting gains from increased competition or scale.',
          questionType: 'Trade Policy Numerical',
        },
      ],
    },
    {
      id: 'ib-mod5-export-docs',
      subjectId: 'mcom-karnataka-intl-business',
      title: 'Export Procedures, INCOTERMS & Cross-Cultural Management',
      moduleNumber: 5,
      moduleName: 'Module 5: Export Operations & International HRM',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-ib-mod5-01', 'q-ib-mod5-02'],
      subtopics: [
        'Export documentation chain: IEC, commercial invoice, packing list, bill of lading',
        'INCOTERMS 2020 and the allocation of cost and risk',
        'Payment mechanisms: advance, open account, documentary collection and letter of credit',
        'DGFT schemes: RoDTEP, EPCG, duty drawback and SEZ benefits',
        'Hofstede cultural dimensions and international HRM practices',
      ],
      explanationMd: `# Export Procedures, INCOTERMS & Cross-Cultural Management

### The Documentation Chain
An exporter must hold an **Importer-Exporter Code (IEC)** from the DGFT. For each shipment the core documents are the commercial invoice, packing list, certificate of origin, and the transport document — a **bill of lading** for sea freight or airway bill for air. Insurance certificates and inspection certificates complete the set required by the buyer's bank.

### INCOTERMS 2020
INCOTERMS allocate cost, risk and responsibility:
- **EXW** — buyer collects at seller's premises; minimum seller obligation.
- **FOB** — seller delivers on board the vessel; risk passes at that point.
- **CIF** — seller also pays freight and insurance to the destination port.
- **DDP** — seller bears everything to the buyer's premises; maximum seller obligation.

Note that risk and cost can transfer at *different* points — under CIF risk passes at shipment while cost runs to destination, a frequent exam trap.

### Payment Security
A **Letter of Credit** substitutes the bank's creditworthiness for the buyer's, provided documents conform exactly to the LC terms. Documentary collection (D/P or D/A) offers weaker protection; open account is safest only for trusted repeat buyers.

### Export Incentives
**RoDTEP** remits embedded central, state and local duties; **EPCG** allows duty-free import of capital goods against an export obligation; **duty drawback** refunds customs duty on inputs used in exported goods.

### Cross-Cultural Management
Hofstede's dimensions — power distance, individualism, masculinity, uncertainty avoidance, long-term orientation and indulgence — explain why incentive systems that work in Bengaluru may fail in Tokyo or Frankfurt.`,
      formulas: [
        {
          id: 'formula-ib-5',
          label: 'CIF Value Build-Up',
          formula: 'CIF = FOB Value + Freight + Insurance Premium',
          exampleQ:
            'FOB value USD 1,00,000, ocean freight USD 8,000 and insurance USD 1,200. Compute the CIF value.',
          exampleA: 'CIF = 1,00,000 + 8,000 + 1,200 = USD 1,09,200.',
        },
      ],
      tricks: [
        {
          id: 'trick-ib-5',
          title: 'CIF Splits Risk and Cost',
          trick:
            'Under CIF the seller pays to the destination port but risk passes at the port of shipment. If a question asks when risk transfers under CIF, the answer is shipment — not arrival.',
          whenToUse: 'INCOTERMS questions and export documentation cases.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ib-9',
          step: 'Step 1: Build the Cost Stack from the Quoted INCOTERM',
          detail:
            'Start from the quoted term and add or remove freight and insurance to reach the required basis, keeping the risk transfer point separate.',
          questionType: 'Export Costing Numerical',
        },
        {
          id: 'solve-ib-10',
          step: 'Step 2: Recommend the Payment Instrument and Justify It',
          detail:
            'Match the instrument to the buyer relationship and country risk, explaining why the chosen mechanism protects the exporter against non-payment or non-shipment.',
          questionType: 'Export Documentation Case',
        },
      ],
    },
  ],

  // ── 4. Corporate Tax Planning (Sem 2) ──
  'mcom-karnataka-tax-planning': [
    {
      id: 'tax-mod1-planning-vs-avoidance',
      subjectId: 'mcom-karnataka-tax-planning',
      title: 'Tax Planning, Avoidance & Evasion: GAAR Framework',
      moduleNumber: 1,
      moduleName: 'Module 1: Framework of Corporate Tax Planning',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-tax-mod1-01', 'q-tax-mod1-02'],
      subtopics: [
        'Distinction between tax planning, tax avoidance and tax evasion',
        'Legitimacy of tax planning: the McDowell and Azadi Bachao jurisprudence',
        'General Anti-Avoidance Rules (GAAR) under Chapter X-A',
        'Impermissible Avoidance Arrangement: the four statutory tests',
        'Specific Anti-Avoidance Rules (SAAR) and treaty shopping',
      ],
      explanationMd: `# Tax Planning vs Avoidance vs Evasion

### The Three Concepts
- **Tax planning** arranges affairs within the law to minimise liability, using deductions, exemptions and incentives Parliament deliberately provided. It is legitimate.
- **Tax avoidance** reduces liability through arrangements technically legal but contrary to legislative intent — using the letter of the law to defeat its purpose.
- **Tax evasion** conceals income or falsifies records. It is illegal and criminal.

### Judicial Evolution
Early Indian jurisprudence followed the Duke of Westminster principle that a taxpayer may order affairs to reduce tax. **McDowell & Co. v. CTO (1985)** shifted the doctrine, holding that tax planning is legitimate only when it falls within the framework of the law. **Union of India v. Azadi Bachao Andolan (2003)** partially restored certainty by upholding treaty benefits absent specific anti-avoidance provisions.

### GAAR (Chapter X-A)
GAAR empowers the tax authority to disregard an **Impermissible Avoidance Arrangement (IAA)** — one whose main purpose is to obtain a tax benefit and which satisfies any one of four tests:
1. creates rights or obligations not normally created between arm's-length parties;
2. results in misuse or abuse of the law;
3. lacks commercial substance; or
4. is entered into by means not normally employed for bona fide purposes.

Consequences include denial of the benefit, recharacterisation of the arrangement, and disregarding of treaty benefits. Safeguards include a Rs 3 crore tax benefit threshold, a monetary threshold, grandfathering of pre-2017 investments and approval requirements at the Commissioner level.

### SAAR
Specific rules target identified abuse patterns such as treaty shopping, thin capitalisation and transfer mispricing, applying independently of GAAR.`,
      formulas: [
        {
          id: 'formula-tax-1',
          label: 'GAAR Monetary Threshold',
          formula: 'GAAR applies where the tax benefit to a taxpayer exceeds Rs 3 crore in a relevant assessment year',
          exampleQ:
            'An arrangement yields a tax benefit of Rs 2.5 crore in AY 2026-27. Can GAAR be invoked?',
          exampleA:
            'No. The tax benefit is below the Rs 3 crore threshold, so GAAR does not apply, although specific anti-avoidance rules may still be relevant.',
        },
      ],
      tricks: [
        {
          id: 'trick-tax-1',
          title: 'Planning Uses the Law, Avoidance Abuses It, Evasion Breaks It',
          trick:
            'Use this three-line summary to open any essay answer, then support each term with one statute or case. It signals structure to the examiner immediately.',
          whenToUse: 'Opening any 10-mark question on tax planning legitimacy.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-tax-1',
          step: 'Step 1: Classify the Arrangement',
          detail:
            'Ask whether the arrangement uses an express statutory incentive (planning), exploits a gap against legislative intent (avoidance) or conceals facts (evasion).',
          questionType: 'Case Analysis / 10-Mark Question',
        },
        {
          id: 'solve-tax-2',
          step: 'Step 2: Apply the GAAR Tests and State the Consequence',
          detail:
            'Test the arrangement against the four IAA criteria, check the threshold, and conclude with the likely authority action.',
          questionType: 'Case Analysis / 10-Mark Question',
        },
      ],
    },
    {
      id: 'tax-mod2-rates-mat',
      subjectId: 'mcom-karnataka-tax-planning',
      title: 'Corporate Tax Rates, MAT & Section 115BAB Concessions',
      moduleNumber: 2,
      moduleName: 'Module 2: Corporate Tax Rates & Minimum Tax',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-tax-mod2-01', 'q-tax-mod2-02'],
      subtopics: [
        'Domestic company rates, surcharge slabs and health and education cess',
        'Section 115BAA: 22% concessional regime and the no-deduction condition',
        'Section 115BAB: 15% rate for new manufacturing companies',
        'Minimum Alternate Tax (MAT) under Section 115JB and MAT credit',
        'Alternate Minimum Tax (AMT) for non-corporate taxpayers',
      ],
      explanationMd: `# Corporate Tax Rates, MAT & Concessional Regimes

### Statutory Rate Structure
Domestic companies are taxed at a base rate of 30%, with surcharge that rises through slabs (7%, 12%, and 25% for income above Rs 10 crore) plus a 4% health and education cess on tax and surcharge. The effective rate therefore varies materially with income level.

### Concessional Regimes
- **Section 115BAA** offers a flat **22%** rate to domestic companies that forgo specified deductions and incentives (including Section 10AA SEZ benefits and additional depreciation). Effective rate with 10% surcharge and 4% cess is about **25.17%**.
- **Section 115BAB** offers **15%** to domestic companies incorporated after 1 October 2019 that commence manufacturing by 31 March 2024 (extended timelines apply). Effective rate is about **17.16%**.

Both regimes are elective and irrevocable once chosen — a decision that must be modelled over the full asset life, since opting out of additional depreciation can be costly for capital-intensive plants.

### Minimum Alternate Tax
**Section 115JB** imposes MAT at 15% of **book profit** on companies whose normal tax liability is lower. The purpose is to ensure profit-making companies that report book profits pay some tax. Tax paid under MAT generates a **MAT credit under Section 115JAA**, usable for 15 years against future normal tax liability in excess of MAT.

### AMT
Non-corporate taxpayers claiming specified deductions face **Alternate Minimum Tax** at 18.5% of adjusted total income, with a corresponding AMT credit.`,
      formulas: [
        {
          id: 'formula-tax-2',
          label: 'Effective Rate Under Section 115BAA',
          formula: 'Effective Rate = 22% x (1 + 10% surcharge) x (1 + 4% cess) = 25.168%',
          exampleQ: 'Book profit under normal provisions is Rs 100 crore and the company opts for Section 115BAA. Compute total tax.',
          exampleA:
            'Tax = 100 x 22% = Rs 22 crore; surcharge 10% = Rs 2.2 crore; cess 4% on 24.2 = Rs 0.968 crore. Total = Rs 25.168 crore.',
        },
        {
          id: 'formula-tax-3',
          label: 'MAT Liability and Credit',
          formula: 'MAT = 15% x Book Profit; MAT Credit = MAT Paid - Normal Tax Liability (when positive)',
          exampleQ:
            'Book profit Rs 50 crore, normal tax liability Rs 4 crore. Compute MAT payable and the credit generated.',
          exampleA:
            'MAT = 15% x 50 = Rs 7.5 crore. Since normal liability (4) is lower, MAT of Rs 7.5 crore is payable. MAT credit = 7.5 - 4 = Rs 3.5 crore, carried forward up to 15 years.',
        },
      ],
      tricks: [
        {
          id: 'trick-tax-2',
          title: 'Compute Normal Tax First, Then Compare With MAT',
          trick:
            'Always calculate the normal liability before applying MAT. MAT only bites when 15% of book profit exceeds normal tax; otherwise you are simply paying normal tax with no credit.',
          whenToUse: 'Every corporate tax computation question.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-tax-3',
          step: 'Step 1: Compute Normal Tax Liability After All Deductions',
          detail:
            'Apply deductions, additional depreciation and incentives permitted under the chosen regime, then add surcharge and cess.',
          questionType: 'Corporate Tax Computation (10 Marks)',
        },
        {
          id: 'solve-tax-4',
          step: 'Step 2: Compute MAT and Determine the Payable Amount',
          detail:
            'Calculate 15% of book profit, compare with the normal liability, pay the higher figure and record the MAT credit for future set-off.',
          questionType: 'Corporate Tax Computation (10 Marks)',
        },
      ],
    },
    {
      id: 'tax-mod3-deductions-setoff',
      subjectId: 'mcom-karnataka-tax-planning',
      title: 'Deductions, Depreciation Planning & Loss Set-Off',
      moduleNumber: 3,
      moduleName: 'Module 3: Deductions & Loss Management',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-tax-mod3-01', 'q-tax-mod3-02'],
      subtopics: [
        'Block system of depreciation and the written down value method',
        'Additional depreciation under Section 32(1)(iia)',
        'Section 80 series deductions available to companies',
        'Intra-head and inter-head set-off of losses',
        'Carry forward periods: 8 years for business loss, indefinite for unabsorbed depreciation',
      ],
      explanationMd: `# Deductions, Depreciation & Loss Set-Off

### Depreciation Planning
Indian tax depreciation uses the **block system**: all assets of the same class are pooled and depreciated on written down value at prescribed rates. Assets acquired and used for fewer than 180 days in the year attract only 50% of the normal rate — a timing consideration that makes the purchase date itself a tax planning variable.

**Additional depreciation** under Section 32(1)(iia) allows 20% of the cost of new plant and machinery acquired by a manufacturer (or 35% in notified backward areas of Karnataka such as parts of Kalaburagi and Bidar divisions). It is unavailable to companies opting into Section 115BAA.

### Loss Set-Off Rules
- **Intra-head set-off**: losses of one business may be set against income of another business in the same head.
- **Inter-head set-off**: business loss may be set against income from house property (capped at Rs 2 lakh) and other heads, but **not** against salary income.
- **Speculation losses** can only be set off against speculation profits.
- **Capital losses**: short-term capital loss against any capital gain; long-term capital loss only against long-term gains.

### Carry Forward
Business losses carry forward 8 assessment years, subject to continuity of business. **Unabsorbed depreciation carries forward indefinitely** — an important asymmetry that often makes it preferable to claim depreciation in a way that preserves the indefinite carry-forward rather than exhausting it against a low-rate year.

Section 79 restricts carry forward of losses where shareholding of a company changes, unless the change occurs under an approved insolvency resolution.`,
      formulas: [
        {
          id: 'formula-tax-4',
          label: 'Written Down Value Depreciation (Block System)',
          formula: 'WDV (closing) = Opening WDV + Additions - Sales; Depreciation = WDV x Prescribed Rate',
          exampleQ:
            'Opening WDV Rs 40 lakh, additions Rs 20 lakh used for the full year, disposal Rs 5 lakh, rate 15%. Compute depreciation and closing WDV.',
          exampleA:
            'WDV before depreciation = 40 + 20 - 5 = Rs 55 lakh. Depreciation = 55 x 15% = Rs 8.25 lakh. Closing WDV = 55 - 8.25 = Rs 46.75 lakh.',
        },
      ],
      tricks: [
        {
          id: 'trick-tax-3',
          title: '180-Day Rule Cuts Depreciation in Half',
          trick:
            'If an asset is acquired and put to use for less than 180 days in the year, only 50% of the normal depreciation is allowed. Delaying a purchase past the year end can double the first-year claim.',
          whenToUse: 'Depreciation planning and year-end capital budgeting decisions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-tax-5',
          step: 'Step 1: Build the Block Schedule Asset Class by Asset Class',
          detail:
            'For each block, add the opening WDV, additions and subtract disposals, then apply the rate. Note any asset failing the 180-day test.',
          questionType: 'Depreciation & Set-Off Computation',
        },
        {
          id: 'solve-tax-6',
          step: 'Step 2: Apply Set-Off in the Statutory Order',
          detail:
            'Set off intra-head first, then inter-head respecting the restrictions (no set-off against salary, capital loss restrictions), and carry forward the residue with the correct period.',
          questionType: 'Depreciation & Set-Off Computation',
        },
      ],
    },
    {
      id: 'tax-mod4-capital-gains',
      subjectId: 'mcom-karnataka-tax-planning',
      title: 'Capital Gains Planning, Buybacks & Restructuring Reliefs',
      moduleNumber: 4,
      moduleName: 'Module 4: Capital Gains & Corporate Restructuring',
      order: 4,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-tax-mod4-01', 'q-tax-mod4-02'],
      subtopics: [
        'Short-term versus long-term capital assets and holding periods',
        'Indexation of cost of acquisition and cost of improvement',
        'Exemptions under Sections 54, 54B, 54EC, 54F and 47 reliefs',
        'Taxation of buyback of shares and deemed dividends',
        'Amalgamation and demerger reliefs under Section 47(vi) and 47(vii)',
      ],
      explanationMd: `# Capital Gains Planning & Restructuring Reliefs

### Classification
A capital asset held for more than 24 months (36 months for immovable property in specified cases, reduced to 24 months for land and building transferred after 31 May 2017) is **long-term**. Listed equity and equity-oriented funds follow a 12-month threshold. Long-term gains attract concessional rates with indexation benefits on eligible assets.

### Indexation
Indexation scales the historical cost by the Cost Inflation Index:
Indexed cost = Cost x (CII of transfer year / CII of acquisition year).
It converts nominal gain into real gain, substantially reducing tax on assets held through inflationary periods.

### Exemptions and Reliefs
- **Section 54**: residential house reinvestment against gains on residential property.
- **Section 54EC**: investment in notified bonds (REC, NHAI) within six months, capped at Rs 50 lakh.
- **Section 54F**: reinvestment in a residential house against gains on any long-term asset other than a house.
- **Section 47**: transactions deemed *not* to be a transfer — including gifts to relatives, transfers to a wholly owned subsidiary, and transfers in an amalgamation or demerger meeting prescribed conditions.

### Buybacks and Restructuring
Buyback of shares by an unlisted company is taxed in the company's hands as income from other sources at a special rate, while listed company buybacks are taxed in shareholders' hands. Amalgamations and demergers satisfying Section 2(1B) and 2(19AA) enjoy roll-over relief so that reorganisation does not trigger an immediate tax charge.`,
      formulas: [
        {
          id: 'formula-tax-5',
          label: 'Indexed Cost of Acquisition',
          formula: 'Indexed Cost = Cost of Acquisition x (CII of year of transfer / CII of year of acquisition)',
          exampleQ:
            'A property bought for Rs 40 lakh in FY 2010-11 (CII 167) is sold in FY 2024-25 (CII 363). Compute the indexed cost.',
          exampleA:
            'Indexed cost = 40,00,000 x (363 / 167) = 40,00,000 x 2.1737 = Rs 86.95 lakh (approximately).',
        },
      ],
      tricks: [
        {
          id: 'trick-tax-4',
          title: 'Check Section 47 Before Computing Any Gain',
          trick:
            'In reorganisation questions, first test whether the transaction is a "transfer" at all under Section 47. If it is not, there is no capital gain to compute — a common trap in amalgamation problems.',
          whenToUse: 'Mergers, demergers and group restructuring questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-tax-7',
          step: 'Step 1: Classify the Asset and Determine the Holding Period',
          detail:
            'Establish whether the asset is short-term or long-term, since this determines both the rate and the availability of indexation and exemptions.',
          questionType: 'Capital Gains Computation',
        },
        {
          id: 'solve-tax-8',
          step: 'Step 2: Index the Cost, Apply Exemptions, Then Compute Tax',
          detail:
            'Index cost and improvement, deduct eligible exemption amounts subject to their caps and time limits, then apply the applicable rate to the residual gain.',
          questionType: 'Capital Gains Computation',
        },
      ],
    },
    {
      id: 'tax-mod5-transfer-pricing',
      subjectId: 'mcom-karnataka-tax-planning',
      title: 'International Taxation, Transfer Pricing & BEPS',
      moduleNumber: 5,
      moduleName: 'Module 5: Cross-Border Taxation & Compliance',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-tax-mod5-01', 'q-tax-mod5-02'],
      subtopics: [
        'Residence rules, POEM and the scope of total income',
        'DTAA relief: exemption and credit methods, and Form 67',
        'Arm\u2019s length price methods under Section 92C',
        'Documentation: master file, local file, country-by-country reporting and Form 3CEB',
        'BEPS Action Plans, Pillar Two global minimum tax and equalisation levy',
      ],
      explanationMd: `# International Taxation & Transfer Pricing

### Residence and Scope
An Indian company is resident in India. A foreign company is treated as resident if its **Place of Effective Management (POEM)** — where key management and commercial decisions are made — is in India during the year. Residents are taxed on worldwide income; non-residents only on income received, accrued or deemed to accrue in India.

### DTAA Relief
Double Taxation Avoidance Agreements allocate taxing rights. India applies two relief methods: the **exemption method** (foreign income excluded) and the **credit method** (foreign tax credited against Indian tax, limited to the Indian tax on that income). Claiming foreign tax credit requires **Form 67** filed before the return due date.

### Transfer Pricing
Associated enterprises must price international (and specified domestic) transactions at **arm's length**. Section 92C prescribes six methods:
1. Comparable Uncontrolled Price (CUP)
2. Resale Price Method
3. Cost Plus Method
4. Profit Split Method
5. Transactional Net Margin Method (TNMM) — most used in Indian IT services
6. Any other method prescribed

The most appropriate method is chosen by reference to the nature of the transaction, functions performed, assets employed and risks assumed. A **safe harbour** regime offers deemed arm's-length margins for eligible categories, reducing litigation.

### Compliance and BEPS
Taxpayers must file **Form 3CEB** with the return, maintain a **master file** and **local file** where thresholds are crossed, and report **country-by-country** information for large groups. India has implemented BEPS-aligned rules, an **equalisation levy** on specified digital services, and is moving toward the **Pillar Two** global minimum tax of 15% for large multinational groups.`,
      formulas: [
        {
          id: 'formula-tax-6',
          label: 'Foreign Tax Credit Limit',
          formula: 'FTC = Lower of (Foreign tax actually paid) and (Indian tax payable on that foreign income)',
          exampleQ:
            'Foreign income Rs 100 lakh, foreign tax paid Rs 30 lakh, Indian tax on that income Rs 25 lakh. Compute the allowable credit.',
          exampleA:
            'Allowable credit = lower of 30 and 25 = Rs 25 lakh. The excess Rs 5 lakh cannot be carried forward.',
        },
      ],
      tricks: [
        {
          id: 'trick-tax-5',
          title: 'TNMM for Services, CUP for Commodities',
          trick:
            'IT and business process services almost always use TNMM (operating margin benchmarking); standardised commodities use CUP because reliable comparables exist. Stating the reason earns method-selection marks.',
          whenToUse: 'Transfer pricing case analysis.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-tax-9',
          step: 'Step 1: Determine Residence and the Scope of Chargeable Income',
          detail:
            'Establish residence status first — it decides whether worldwide or India-source income is taxed, and which DTAA applies.',
          questionType: 'International Tax Case (10 Marks)',
        },
        {
          id: 'solve-tax-10',
          step: 'Step 2: Select the ALP Method and Compute the Adjustment',
          detail:
            'Justify the method by reference to functions, assets and risks, benchmark against comparables, and quantify the income adjustment arising from any deviation from arm\u2019s length pricing.',
          questionType: 'International Tax Case (10 Marks)',
        },
      ],
    },
  ],

  // ── 5. Forensic Accounting & Fraud Analytics (Sem 3) ──
  'mcom-karnataka-forensic-accounting': [
    {
      id: 'fa-mod1-fraud-triangle',
      subjectId: 'mcom-karnataka-forensic-accounting',
      title: 'The Fraud Triangle, Fraud Typologies & Red Flags',
      moduleNumber: 1,
      moduleName: 'Module 1: Foundations of Forensic Accounting',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-fa-mod1-01', 'q-fa-mod1-02'],
      subtopics: [
        'Forensic accounting versus auditing versus investigative accounting',
        "Cressey's fraud triangle: pressure, opportunity and rationalisation",
        'The fraud diamond and the addition of capability',
        'Occupational fraud categories: asset misappropriation, corruption, financial statement fraud',
        'Behavioural and documentary red flags and the whistleblower mechanism',
      ],
      explanationMd: `# The Fraud Triangle & Fraud Typologies

### What Forensic Accounting Is
Forensic accounting applies accounting, auditing and investigative skill to produce evidence usable in legal proceedings. Unlike statutory audit — which provides reasonable assurance and is sampling-based — a forensic engagement is **targeted, exhaustive in scope for the matter investigated, and litigation-aware** from the outset.

### Cressey's Fraud Triangle
Donald Cressey identified three conditions that must co-exist:
1. **Pressure (incentive)**: an unshareable financial need — personal debt, targets, margin pressure.
2. **Opportunity**: weak internal control, absence of segregation of duties, or override capability.
3. **Rationalisation**: a self-justifying narrative such as "I am only borrowing" or "the company owes me".

The **fraud diamond** adds a fourth element — **capability** — recognising that a person must also have the position, technical knowledge and ego to execute and conceal the scheme.

### Typologies (ACFE Framework)
- **Asset misappropriation**: the most frequent but least costly per case — cash skimming, larceny, fraudulent disbursements, payroll and expense schemes.
- **Corruption**: bribery, conflicts of interest, bid rigging, illegal gratuities.
- **Financial statement fraud**: the least frequent but most costly per case — overstated revenue, understated liabilities, improper disclosures.

### Red Flags
Behavioural indicators include lifestyle beyond means, refusal to take leave, and unusually close vendor relationships. Documentary indicators include missing source documents, duplicate payments, round-sum journal entries, and manual journal entries posted at period end by senior personnel.`,
      formulas: [
        {
          id: 'formula-fa-1',
          label: "Cressey's Fraud Triangle",
          formula: 'Fraud Risk = Pressure x Opportunity x Rationalisation (all three required simultaneously)',
          exampleQ:
            'A treasury officer carries heavy personal debt, is the sole signatory for vendor payments and believes he is underpaid. Which fraud triangle elements are present?',
          exampleA:
            'All three: pressure (personal debt), opportunity (sole signatory with no segregation of duties) and rationalisation (belief that he is underpaid). This is a high-risk configuration requiring immediate control remediation.',
        },
      ],
      tricks: [
        {
          id: 'trick-fa-1',
          title: 'Frequency Inverse to Cost',
          trick:
            'Asset misappropriation is the MOST COMMON but LOWEST median loss; financial statement fraud is the LEAST COMMON but HIGHEST median loss. Examiners test this inverse relationship constantly.',
          whenToUse: 'Fraud typology classification questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-fa-1',
          step: 'Step 1: Map the Facts onto the Triangle Elements',
          detail:
            'Identify the pressure, the specific control weakness creating opportunity, and the statement or behaviour evidencing rationalisation.',
          questionType: 'Forensic Case Analysis',
        },
        {
          id: 'solve-fa-2',
          step: 'Step 2: Prescribe the Control Remedy',
          detail:
            'Recommend the specific control — segregation of duties, mandatory leave rotation, dual authorisation, independent reconciliation — that removes the opportunity leg.',
          questionType: 'Forensic Case Analysis',
        },
      ],
    },
    {
      id: 'fa-mod2-financial-statement-fraud',
      subjectId: 'mcom-karnataka-forensic-accounting',
      title: 'Financial Statement Fraud, Earnings Management & M-Score',
      moduleNumber: 2,
      moduleName: 'Module 2: Financial Statement Fraud Detection',
      order: 2,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-fa-mod2-01', 'q-fa-mod2-02'],
      subtopics: [
        'Revenue recognition fraud: premature recognition, channel stuffing, round tripping',
        'Expense and liability understatement and capitalisation abuse',
        'Cookie jar reserves, big bath accounting and income smoothing',
        'The Beneish M-Score eight-variable model and its threshold',
        'Accounting standards angle: Ind AS 115 and Ind AS 116 red flags',
      ],
      explanationMd: `# Financial Statement Fraud & Earnings Management

### Common Schemes
- **Premature revenue recognition**: booking sales before performance obligations are satisfied, in breach of Ind AS 115.
- **Channel stuffing**: shipping excess inventory to distributors at period end, often with undisclosed return rights.
- **Round tripping**: selling an asset to a related party and buying it back, manufacturing revenue with no economic substance.
- **Capitalisation abuse**: expensing costs as assets to inflate current profit — the WorldCom pattern.
- **Cookie jar reserves**: over-provisioning in good years to release in bad years, smoothing earnings.
- **Big bath**: taking excessive write-offs in an already poor year so future years look better.

### The Beneish M-Score
Beneish's model combines eight ratios into a single statistic:

M = -4.84 + 0.920(DSR) + 0.528(GMI) + 0.404(AQI) + 0.892(SGI) + 0.115(DEPI) - 0.172(SGAI) + 4.679(TATA) - 0.327(LVGI)

where DSR is the Days Sales in Receivables Index, GMI the Gross Margin Index, AQI the Asset Quality Index, SGI the Sales Growth Index, DEPI the Depreciation Index, SGAI the SG&A Index, TATA Total Accruals to Total Assets and LVGI the Leverage Index. A value **greater than -1.78** signals a probability of manipulation.

### Indian Illustrations
The Satyam Computers restatement of 2009 — inflated cash and bank balances and fictitious interest income — is the canonical Indian case, and the reason the NFRA and the Serious Fraud Investigation Office gained expanded powers.`,
      formulas: [
        {
          id: 'formula-fa-2',
          label: 'Beneish M-Score',
          formula: 'M = -4.84 + 0.920 DSR + 0.528 GMI + 0.404 AQI + 0.892 SGI + 0.115 DEPI - 0.172 SGAI + 4.679 TATA - 0.327 LVGI',
          exampleQ:
            'A computed M-Score for a listed company is -1.45. Interpret the result.',
          exampleA:
            'Since -1.45 is greater than the -1.78 threshold, the model flags the company as a likely manipulator of earnings and the financial statements warrant forensic examination.',
        },
        {
          id: 'formula-fa-3',
          label: 'Days Sales in Receivables Index (DSRI)',
          formula: 'DSRI = (Receivables_t / Sales_t) / (Receivables_t-1 / Sales_t-1)',
          exampleQ:
            'Year t: receivables Rs 120 crore, sales Rs 600 crore. Year t-1: receivables Rs 80 crore, sales Rs 500 crore. Compute DSRI.',
          exampleA:
            'DSRI = (120/600) / (80/500) = 0.20 / 0.16 = 1.25. A DSRI materially above 1 suggests receivables are growing faster than sales, a classic revenue inflation signal.',
        },
      ],
      tricks: [
        {
          id: 'trick-fa-2',
          title: 'Accruals Are the Smoking Gun',
          trick:
            'TATA (total accruals to total assets) carries the largest positive coefficient in the M-Score. Persistent high accruals with weak operating cash flow is the single strongest analytical red flag — always compute CFO/Net Profit first.',
          whenToUse: 'Any earnings quality or forensic analysis question.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-fa-3',
          step: 'Step 1: Compute the Eight Component Ratios for Two Consecutive Years',
          detail:
            'Extract receivables, sales, gross margin, non-current assets, SG&A, depreciation, accruals and leverage for both years and form each index.',
          questionType: 'Forensic Analytics Numerical',
        },
        {
          id: 'solve-fa-4',
          step: 'Step 2: Weight, Sum and Compare With the -1.78 Threshold',
          detail:
            'Apply the Beneish coefficients, sum with the -4.84 intercept, and state the conclusion relative to the threshold along with the corroborating qualitative evidence.',
          questionType: 'Forensic Analytics Numerical',
        },
      ],
    },
    {
      id: 'fa-mod3-asset-misappropriation',
      subjectId: 'mcom-karnataka-forensic-accounting',
      title: 'Asset Misappropriation, Skimming & Payroll Schemes',
      moduleNumber: 3,
      moduleName: 'Module 3: Occupational Fraud Schemes',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-fa-mod3-01', 'q-fa-mod3-02'],
      subtopics: [
        'Cash skimming versus larceny and the off-book detection challenge',
        'Billing schemes: shell companies, pass-through and non-accomplice vendors',
        'Payroll fraud: ghost employees, falsified hours and commission abuse',
        'Expense reimbursement schemes and register disbursement fraud',
        'Inventory and fixed asset misappropriation, and physical controls',
      ],
      explanationMd: `# Asset Misappropriation Schemes

### Cash Schemes
- **Skimming** is the theft of cash *before* it enters the accounting records — an "off-book" scheme that leaves no direct audit trail. Detection relies on analytical procedures: declining margins, unexplained inventory shrinkage, and reconciling physical counts to book records.
- **Larceny** is theft of cash *after* it has been recorded. Because the books show the receipt, the thief must conceal the gap through lapping, false write-offs or altering bank reconciliations.

### Billing Schemes
The most common fraudulent disbursement. Variants include **shell companies** created by the perpetrator, **pass-through schemes** where a real vendor inflates invoices, and **non-accomplice vendor** schemes where the employee alters a legitimate vendor's payment details. Detection uses vendor master file analytics: matching vendor addresses or bank accounts to employee records.

### Payroll Fraud
**Ghost employees** remain on payroll after leaving, with cheques diverted to the perpetrator. Falsified hours, unauthorised overtime and commission inflation are related variants. Detection comes from reconciling the payroll register to HR master data and to biometric or attendance records.

### Inventory Schemes
Physical assets are stolen and records altered to conceal the loss. **Periodic physical counts**, perpetual inventory systems, segregation between custody and record-keeping, and surveillance of scrap and disposal are the primary controls.`,
      formulas: [
        {
          id: 'formula-fa-4',
          label: 'Inventory Shrinkage Rate',
          formula: 'Shrinkage % = [(Book Inventory - Physical Inventory) / Book Inventory] x 100',
          exampleQ:
            'Book inventory is Rs 2,00,00,000 and physical count Rs 1,94,00,000. Compute shrinkage and interpret.',
          exampleA:
            'Shrinkage = (6,00,000 / 2,00,00,000) x 100 = 3.0%. A rate above the industry norm of 1-2% warrants investigation into theft, unrecorded waste or recording errors.',
        },
      ],
      tricks: [
        {
          id: 'trick-fa-3',
          title: 'Skimming Leaves No Trail — Use Analytics',
          trick:
            'Skimming is undetectable from the ledger by definition. Never propose vouching as the detection method; propose analytical procedures, margin trend analysis and cash-to-sales reconciliation instead.',
          whenToUse: 'Detection method questions on cash schemes.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-fa-5',
          step: 'Step 1: Classify the Scheme as On-Book or Off-Book',
          detail:
            'Determine whether the theft occurred before or after recording, because this dictates whether documentary testing or analytical testing will detect it.',
          questionType: 'Occupational Fraud Case',
        },
        {
          id: 'solve-fa-6',
          step: 'Step 2: Design the Test and the Control Fix',
          detail:
            'Specify the exact substantive test (vendor master data match, payroll-to-HR reconciliation, surprise cash count) and the preventive control that closes the opportunity.',
          questionType: 'Occupational Fraud Case',
        },
      ],
    },
    {
      id: 'fa-mod4-digital-forensics',
      subjectId: 'mcom-karnataka-forensic-accounting',
      title: 'Digital Forensics, Data Analytics & Benford\u2019s Law',
      moduleNumber: 4,
      moduleName: 'Module 4: Forensic Data Analytics',
      order: 4,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-fa-mod4-01', 'q-fa-mod4-02'],
      subtopics: [
        'Digital evidence: acquisition, chain of custody and admissibility under the Evidence Act',
        'Computer forensics process: identification, preservation, analysis and reporting',
        'Benford\u2019s Law first-digit and second-digit tests with mean absolute deviation',
        'Data analytics routines: duplicate detection, round-sum and gap analysis',
        'Continuous auditing, CAATs and audit data extraction integrity',
      ],
      explanationMd: `# Digital Forensics & Data Analytics

### Digital Evidence Handling
Digital evidence is volatile and easily altered, so forensic practice requires a documented **chain of custody**, write-blocked imaging of source media, and hash verification (MD5 or SHA-256) to prove the copy is unaltered. Under the Indian Evidence Act and the Information Technology Act 2000, electronic records require a certificate under **Section 65B** to be admissible.

### The Forensic Process
1. **Identification**: locate relevant devices, accounts and data sources.
2. **Preservation**: image the media and isolate the original.
3. **Analysis**: search, decrypt, recover deleted artefacts and correlate timelines.
4. **Reporting**: present findings in a form a court can follow, distinguishing fact from inference.

### Benford's Law
In naturally occurring numeric data, the leading digit d appears with probability log10(1 + 1/d). The expected first-digit frequencies are approximately:
1 → 30.1%, 2 → 17.6%, 3 → 12.5%, 4 → 9.7%, 5 → 7.9%, 6 → 6.7%, 7 → 5.8%, 8 → 5.1%, 9 → 4.6%.

Fabricated numbers typically cluster around thresholds (just below approval limits) and violate this distribution. The **Mean Absolute Deviation (MAD)** between observed and expected frequencies is compared against critical values to flag non-conformity.

### Standard Analytics Routines
Duplicate payment detection, round-sum amount testing, gap and sequence analysis on document numbers, weekend and after-hours posting analysis, journal entries posted by unauthorised users, and vendor-employee master data matching.`,
      formulas: [
        {
          id: 'formula-fa-5',
          label: "Benford's First-Digit Probability",
          formula: 'P(d) = log10(1 + 1/d)',
          exampleQ: 'What is the expected proportion of transactions beginning with the digit 1 under Benford\u2019s Law?',
          exampleA: 'P(1) = log10(1 + 1/1) = log10(2) = 0.301, or 30.1%.',
        },
        {
          id: 'formula-fa-6',
          label: 'Mean Absolute Deviation for Benford Testing',
          formula: 'MAD = (1/9) x Sum over d=1 to 9 of |Observed % - Expected %|',
          exampleQ:
            'The sum of absolute deviations across the nine digits is 0.072. Compute MAD and interpret using the 0.015 conformity threshold.',
          exampleA:
            'MAD = 0.072 / 9 = 0.008, which is below 0.015, indicating close conformity. MAD between 0.012 and 0.015 would signal non-conformity requiring investigation.',
        },
      ],
      tricks: [
        {
          id: 'trick-fa-4',
          title: 'Hash First, Analyse Second',
          trick:
            'Always state that the original media is hashed and write-blocked before analysis. In an exam answer, mentioning hash verification and Section 65B certification signals professional competence immediately.',
          whenToUse: 'Digital forensics process questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-fa-7',
          step: 'Step 1: Tabulate Observed First-Digit Frequencies',
          detail:
            'Count transactions by leading digit, convert to percentages and place them beside the Benford expected frequencies.',
          questionType: 'Benford Analysis Numerical',
        },
        {
          id: 'solve-fa-8',
          step: 'Step 2: Compute MAD and Conclude',
          detail:
            'Average the absolute deviations, compare with the conformity thresholds, and identify the specific digits driving any non-conformity for targeted testing.',
          questionType: 'Benford Analysis Numerical',
        },
      ],
    },
    {
      id: 'fa-mod5-legal-framework',
      subjectId: 'mcom-karnataka-forensic-accounting',
      title: 'Investigation, Litigation Support & Indian Legal Framework',
      moduleNumber: 5,
      moduleName: 'Module 5: Legal Framework & Expert Testimony',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-fa-mod5-01', 'q-fa-mod5-02'],
      subtopics: [
        'Companies Act 2013: Sections 206 to 210 investigation and Section 211 SFIO',
        'Serious Fraud Investigation Office powers and the 147/149/212 procedure',
        'Prevention of Money Laundering Act 2002 and the three-stage laundering process',
        'Section 447 punishment for fraud and reporting duty under Section 143(12)',
        'Expert witness role, report drafting and standards of professional conduct',
      ],
      explanationMd: `# Investigation & the Indian Legal Framework

### Corporate Investigation Powers
Sections 206 to 210 of the Companies Act 2013 empower the Central Government to order an investigation on receipt of a report from the Registrar, a special resolution, or in the public interest. **Section 211** established the **Serious Fraud Investigation Office (SFIO)**, a multi-disciplinary body that investigates frauds with public interest implications, involving multiple departments, or substantially affecting the public at large.

### Reporting Duty on Auditors
**Section 143(12)** obliges an auditor who has reason to believe fraud is being committed against the company by its officers or employees to report to the Central Government within prescribed thresholds and timelines. Failure attracts penalty under Section 143(15).

### Punishment for Fraud
**Section 447** defines fraud broadly and prescribes imprisonment of six months to ten years along with a fine of not less than the amount involved and up to three times that amount. Fraud involving public interest attracts a minimum three-year term.

### Money Laundering
The **PMLA 2002** criminalises the proceeds of crime. Laundering proceeds in three stages: **placement** (introducing illicit cash into the financial system), **layering** (moving funds through complex transactions to obscure origin) and **integration** (returning apparently legitimate funds to the criminal). The Enforcement Directorate investigates, and the burden of proving that property is untainted rests on the accused — a significant reversal.

### Expert Testimony
A forensic accountant acts as an expert witness, presenting opinion evidence. Reports must be factual, clearly sourced, must separate observation from inference, and must withstand cross-examination.`,
      formulas: [
        {
          id: 'formula-fa-7',
          label: 'Three Stages of Money Laundering',
          formula: 'Placement → Layering → Integration',
          exampleQ:
            'Illegal cash is deposited in small amounts across several bank accounts, wired through three overseas shell entities, then used to purchase commercial property. Identify the stages.',
          exampleA:
            'Placement: structuring cash deposits below reporting thresholds. Layering: the multi-jurisdiction wire transfers through shell entities. Integration: acquiring commercial property, which returns the funds in apparently legitimate form.',
        },
      ],
      tricks: [
        {
          id: 'trick-fa-5',
          title: 'PLI: Placement, Layering, Integration',
          trick:
            'Remember PLI and always attach one concrete transaction to each stage in your answer. Examiners award marks for applying the stages to the given facts, not merely naming them.',
          whenToUse: 'Any money laundering or PMLA question.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-fa-9',
          step: 'Step 1: Identify the Appropriate Authority and Provision',
          detail:
            'Determine whether the matter falls to the SFIO, the Registrar, the Enforcement Directorate or the police, and cite the enabling section.',
          questionType: 'Legal Framework Case',
        },
        {
          id: 'solve-fa-10',
          step: 'Step 2: Outline the Investigative Steps and Deliverable',
          detail:
            'Sequence evidence collection, data analytics, interviews and quantification of loss, then describe the form and standards of the final expert report.',
          questionType: 'Legal Framework Case',
        },
      ],
    },
  ],

  // ── 6. Financial Derivatives & Risk Management (Sem 3) ──
  'mcom-karnataka-derivatives': [
    {
      id: 'drv-mod1-futures-pricing',
      subjectId: 'mcom-karnataka-derivatives',
      title: 'Forwards, Futures & Cost of Carry Pricing',
      moduleNumber: 1,
      moduleName: 'Module 1: Futures Markets & Pricing',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-drv-mod1-01', 'q-drv-mod1-02'],
      subtopics: [
        'Forward versus futures contracts: standardisation, clearing and credit risk',
        'Mechanics of margining, mark-to-market and daily settlement',
        'Cost of carry model and contango versus backwardation',
        'Index futures, stock futures and currency futures on Indian exchanges',
        'Hedging with futures: hedge ratio and basis risk',
      ],
      explanationMd: `# Forwards, Futures & Cost of Carry

### Forward versus Futures
A **forward** is a customised over-the-counter contract between two parties, carrying bilateral credit risk and settled at maturity. A **future** is exchange-traded, standardised in size and expiry, guaranteed by a clearing corporation, and marked to market daily — which eliminates most counterparty risk.

### Margining
Traders post **initial margin** based on the exchange's risk model (SPAN plus exposure margin). Daily **mark-to-market** settles gains and losses in cash, so losses are collected before they accumulate. Breaching the maintenance margin triggers a margin call.

### Cost of Carry Pricing
The theoretical futures price reflects the spot price plus the net cost of holding the asset to delivery:

F = S x (1 + r - y)^t

where r is the financing rate, y the convenience yield or dividend yield, and t the time to expiry in years. When carrying cost exceeds yield the market is in **contango** (futures above spot); when yield exceeds carrying cost it is in **backwardation**.

### Indian Market
NSE and BSE trade index futures (Nifty 50, Bank Nifty, Sensex), stock futures, currency futures on four pairs and interest rate futures on government securities. Currency derivatives are especially important for Karnataka's exporter base, which uses them to hedge receivables.

### Basis Risk
Basis = Spot - Futures. A hedge is imperfect because the basis at the time of closing rarely equals the basis anticipated. The **minimum variance hedge ratio** adjusts the number of contracts for the correlation between spot and futures returns.`,
      formulas: [
        {
          id: 'formula-drv-1',
          label: 'Cost of Carry Futures Price',
          formula: 'F = S x [1 + (r - y) x t]',
          exampleQ:
            'Spot index 22,000, risk-free rate 7% p.a., dividend yield 1.5% p.a., 3 months to expiry. Compute the theoretical futures price.',
          exampleA:
            'F = 22,000 x [1 + (0.07 - 0.015) x 0.25] = 22,000 x [1 + 0.01375] = 22,000 x 1.01375 = 22,302.5.',
        },
        {
          id: 'formula-drv-2',
          label: 'Minimum Variance Hedge Ratio',
          formula: 'h* = rho x (sigma_S / sigma_F)',
          exampleQ:
            'Correlation between spot and futures returns is 0.9, spot standard deviation 12% and futures standard deviation 15%. Find the optimal hedge ratio.',
          exampleA: 'h* = 0.9 x (12/15) = 0.9 x 0.8 = 0.72 futures contracts per unit of spot exposure.',
        },
      ],
      tricks: [
        {
          id: 'trick-drv-1',
          title: 'Contango = Futures Above Spot',
          trick:
            'Contango: F > S (normal for storable commodities with carrying cost). Backwardation: F < S (scarce near-term supply). If your computed futures price is below spot for an index with positive net carry, you dropped the dividend yield sign.',
          whenToUse: 'All futures pricing and market structure questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-drv-1',
          step: 'Step 1: Identify Spot, Rates, Yields and Time to Expiry',
          detail:
            'Convert all rates to the same period basis. Annual rates must be multiplied by the fraction of the year remaining to expiry.',
          questionType: 'Futures Pricing Numerical',
        },
        {
          id: 'solve-drv-2',
          step: 'Step 2: Apply Cost of Carry and Interpret the Market State',
          detail:
            'Compute the theoretical price, compare with the quoted market price to identify arbitrage opportunity, and label the market contango or backwardation.',
          questionType: 'Futures Pricing Numerical',
        },
      ],
    },
    {
      id: 'drv-mod2-options-payoffs',
      subjectId: 'mcom-karnataka-derivatives',
      title: 'Options: Payoffs, Strategies & the Greeks',
      moduleNumber: 2,
      moduleName: 'Module 2: Option Markets & Strategies',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-drv-mod2-01', 'q-drv-mod2-02'],
      subtopics: [
        'Call and put payoffs and profit diagrams, moneyness and intrinsic versus time value',
        'Covered call, protective put, bull and bear spreads, straddle and strangle',
        'The Greeks: delta, gamma, theta, vega and rho',
        'Put-call parity and conversion / reversal arbitrage',
        'American versus European exercise and Indian index option conventions',
      ],
      explanationMd: `# Options: Payoffs, Strategies & the Greeks

### Basic Payoffs
For a call option with strike K and premium p:
- Payoff at expiry = max(S - K, 0); Profit = max(S - K, 0) - p.
For a put option:
- Payoff at expiry = max(K - S, 0); Profit = max(K - S, 0) - p.

Loss for a buyer is capped at the premium; loss for a naked seller is potentially unlimited. **Moneyness** describes whether an option is in, at or out of the money. Option price = intrinsic value + time value, and time value decays as expiry approaches.

### Strategies
- **Covered call**: hold the stock, sell a call — generates income but caps upside.
- **Protective put**: hold the stock, buy a put — insurance against downside.
- **Bull call spread**: buy a lower-strike call, sell a higher-strike call — limited profit, limited loss.
- **Straddle**: buy a call and a put at the same strike — profits from volatility, loses if the market is flat.
- **Strangle**: same but at different strikes — cheaper, needs a larger move.

### Put-Call Parity
C + K/(1+r)^t = P + S

A deviation creates a riskless arbitrage: **conversion** (long stock, long put, short call) or **reversal** (short stock, long call, short put).

### The Greeks
- **Delta**: sensitivity of option price to the underlying (0 to 1 for calls).
- **Gamma**: rate of change of delta — highest for at-the-money options near expiry.
- **Theta**: daily time decay, negative for buyers.
- **Vega**: sensitivity to volatility.
- **Rho**: sensitivity to interest rates.

Indian exchanges trade European-style index options and American-style stock options, settled in cash for index contracts.`,
      formulas: [
        {
          id: 'formula-drv-3',
          label: 'Put-Call Parity',
          formula: 'C + K / (1 + r)^t = P + S',
          exampleQ:
            'Spot Rs 1,000, strike Rs 1,000, call Rs 60, put Rs 40, r = 8% p.a., 6 months to expiry. Is parity satisfied?',
          exampleA:
            'LHS = 60 + 1000/(1.08^0.5) = 60 + 963.0 = 1023.0. RHS = 40 + 1000 = 1040.0. LHS < RHS, so the call is underpriced (or the put overpriced); a conversion arbitrage exists.',
        },
        {
          id: 'formula-drv-4',
          label: 'Call Option Profit at Expiry',
          formula: 'Profit = max(S_T - K, 0) - Premium',
          exampleQ: 'A call with strike Rs 250 is bought at a premium of Rs 12. Spot at expiry is Rs 275. Find profit.',
          exampleA: 'Payoff = max(275 - 250, 0) = Rs 25. Profit = 25 - 12 = Rs 13 per share.',
        },
      ],
      tricks: [
        {
          id: 'trick-drv-2',
          title: 'Payoff Is Not Profit',
          trick:
            'Payoff ignores the premium; profit subtracts it. Many students answer the payoff when asked for profit. Always check whether the question says "payoff at expiry" or "net profit".',
          whenToUse: 'Every option numerical.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-drv-3',
          step: 'Step 1: Tabulate the Position Across a Range of Expiry Prices',
          detail:
            'Build a table of underlying prices around the strikes and compute the payoff of each leg, then the net position payoff.',
          questionType: 'Option Strategy Numerical',
        },
        {
          id: 'solve-drv-4',
          step: 'Step 2: Deduct Net Premium and Identify Breakeven, Max Profit and Max Loss',
          detail:
            'Subtract the net premium paid or received, then state the three key parameters explicitly — they are separately awarded in university marking schemes.',
          questionType: 'Option Strategy Numerical',
        },
      ],
    },
    {
      id: 'drv-mod3-bsm-valuation',
      subjectId: 'mcom-karnataka-derivatives',
      title: 'Binomial Model & Black-Scholes-Merton Valuation',
      moduleNumber: 3,
      moduleName: 'Module 3: Option Pricing Models',
      order: 3,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-drv-mod3-01', 'q-drv-mod3-02'],
      subtopics: [
        'One-period and multi-period binomial trees, up and down factors',
        'Risk-neutral valuation and the risk-neutral probability p',
        'Black-Scholes-Merton assumptions and the closed-form call formula',
        'd1 and d2 interpretation, and put valuation through parity',
        'Model limitations: volatility smile, fat tails and discrete dividends',
      ],
      explanationMd: `# Binomial & Black-Scholes-Merton Option Pricing

### The Binomial Model
The Cox-Ross-Rubinstein binomial model assumes the underlying moves up by factor u or down by factor d each period. With risk-free rate r per period, the **risk-neutral probability** is:

p = (1 + r - d) / (u - d)

The option value at expiry is known at each terminal node. Working backwards, each earlier node is the discounted expected value:

C = [p x Cu + (1 - p) x Cd] / (1 + r)

The model's power is that it requires no assumption about investor risk preferences — the risk-neutral measure prices all claims consistently.

### Black-Scholes-Merton
In continuous time, with constant volatility and no dividends, the European call price is:

C = S x N(d1) - K x e^(-rt) x N(d2)

where d1 = [ln(S/K) + (r + sigma^2/2) t] / (sigma sqrt(t)) and d2 = d1 - sigma sqrt(t).

**N(d1)** is the option's delta — the number of shares needed to hedge. **N(d2)** is the risk-neutral probability that the option finishes in the money. The put follows from parity: P = K e^(-rt) N(-d2) - S N(-d1).

### Limitations
BSM assumes constant volatility and log-normally distributed returns. Real markets display a **volatility smile** (implied volatility varies with strike), fat tails and jumps. Practitioners adjust with local volatility models, stochastic volatility (Heston) and Monte Carlo simulation. Discrete dividends also require adjustment to the spot input.`,
      formulas: [
        {
          id: 'formula-drv-5',
          label: 'Risk-Neutral Probability (Binomial)',
          formula: 'p = (1 + r - d) / (u - d)',
          exampleQ:
            'u = 1.20, d = 0.85, risk-free rate 10% per period. Compute the risk-neutral probability.',
          exampleA: 'p = (1.10 - 0.85) / (1.20 - 0.85) = 0.25 / 0.35 = 0.714.',
        },
        {
          id: 'formula-drv-6',
          label: 'Black-Scholes-Merton Call Price',
          formula: 'C = S N(d1) - K e^(-rt) N(d2)',
          exampleQ:
            'S = 100, K = 100, r = 8% p.a., sigma = 20% p.a., t = 1 year, N(d1) = 0.6368, N(d2) = 0.5596. Compute the call price.',
          exampleA:
            'C = 100 x 0.6368 - 100 x e^(-0.08) x 0.5596 = 63.68 - 100 x 0.9231 x 0.5596 = 63.68 - 51.66 = Rs 12.02.',
        },
      ],
      tricks: [
        {
          id: 'trick-drv-3',
          title: 'N(d2) Is the Probability of Finishing In the Money',
          trick:
            'N(d2) equals the risk-neutral probability of exercise and N(d1) equals the delta. Stating this interpretation converts a mechanical computation into a conceptual answer worth extra marks.',
          whenToUse: 'Black-Scholes numericals and theory.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-drv-5',
          step: 'Step 1: Build the Tree and Compute Terminal Payoffs',
          detail:
            'Calculate all possible underlying prices at expiry and the corresponding option payoffs at the terminal nodes.',
          questionType: 'Option Pricing Numerical',
        },
        {
          id: 'solve-drv-6',
          step: 'Step 2: Backward Induct with Risk-Neutral Probabilities',
          detail:
            'Discount the expected value at each node using p, step back to today, and note whether early exercise would be optimal for an American option.',
          questionType: 'Option Pricing Numerical',
        },
      ],
    },
    {
      id: 'drv-mod4-swaps',
      subjectId: 'mcom-karnataka-derivatives',
      title: 'Swaps: Interest Rate, Currency & Hedging Design',
      moduleNumber: 4,
      moduleName: 'Module 4: Swap Markets & Risk Hedging',
      order: 4,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-drv-mod4-01', 'q-drv-mod4-02'],
      subtopics: [
        'Plain vanilla interest rate swap mechanics and notional principal',
        'Comparative advantage and the quality spread differential',
        'Cross-currency swaps and basis swaps',
        'Credit default swaps and counterparty credit risk (CVA)',
        'Hedge design: matching exposure, tenor and reset frequency',
      ],
      explanationMd: `# Swaps and Hedging Design

### Interest Rate Swaps
In a plain vanilla **interest rate swap** two parties exchange interest cash flows on a **notional principal** that is never exchanged. Typically one party pays a fixed rate and receives floating (MIBOR or repo-linked in India), converting a floating-rate liability into a fixed one, or vice versa.

### Comparative Advantage
Swaps create value from the **Quality Spread Differential (QSD)**. Suppose a AAA firm can borrow at 8% fixed or LIBOR+0.3% floating, while a BBB firm faces 10% fixed or LIBOR+1.0% floating. The fixed spread is 2.0% but the floating spread is only 0.7%, giving a QSD of 1.3% — the total gain available to be split between the parties (and any intermediary bank).

Each party borrows in the market where it has the comparative advantage and swaps into its desired exposure.

### Cross-Currency and Basis Swaps
A **cross-currency swap** exchanges both principal and interest in different currencies — the natural hedge for an Indian exporter with USD receivables and INR costs. A **basis swap** exchanges one floating rate for another (for example MIBOR against repo), used by banks managing funding mismatches.

### Credit Default Swaps
A **CDS** transfers credit risk: the protection buyer pays a periodic premium and receives compensation on a credit event. CDS spreads are the market's real-time view of default probability and were central to the 2008 crisis through counterparty concentration.

### Hedge Design Principles
A hedge must match the exposure in **amount, tenor, currency and reset frequency**. Mismatch on any dimension leaves residual basis risk. Indian corporates follow RBI guidelines on permissible hedging of trade credits and external commercial borrowings.`,
      formulas: [
        {
          id: 'formula-drv-7',
          label: 'Quality Spread Differential (QSD)',
          formula: 'QSD = Difference in Fixed Rate Spreads - Difference in Floating Rate Spreads',
          exampleQ:
            'Firm A: 8% fixed or MIBOR+0.30%. Firm B: 10% fixed or MIBOR+1.00%. Compute the QSD.',
          exampleA:
            'Fixed spread = 10 - 8 = 2.00%. Floating spread = 1.00 - 0.30 = 0.70%. QSD = 2.00 - 0.70 = 1.30% — the total annual gain available from the swap.',
        },
      ],
      tricks: [
        {
          id: 'trick-drv-4',
          title: 'Borrow Where You Have the Edge, Then Swap',
          trick:
            'Always have each party borrow in the market where its relative disadvantage is smallest, then swap. If you assign borrowing the other way, the QSD turns negative and the question is answered incorrectly.',
          whenToUse: 'Swap design numericals.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-drv-7',
          step: 'Step 1: Build the 2x2 Borrowing Cost Grid and Compute QSD',
          detail:
            'Tabulate fixed and floating costs for both parties, compute the two spreads and their difference to confirm a positive QSD exists.',
          questionType: 'Swap Design Numerical',
        },
        {
          id: 'solve-drv-8',
          step: 'Step 2: Allocate the Gain and Show the Net Cost',
          detail:
            'Distribute the QSD between the parties and any intermediary, then verify each party\u2019s effective net cost is below what it could borrow directly.',
          questionType: 'Swap Design Numerical',
        },
      ],
    },
    {
      id: 'drv-mod5-regulation',
      subjectId: 'mcom-karnataka-derivatives',
      title: 'Margining, CCP Clearing, SEBI Regulation & Market Risks',
      moduleNumber: 5,
      moduleName: 'Module 5: Regulation, Risk & Market Structure',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-drv-mod5-01', 'q-drv-mod5-02'],
      subtopics: [
        'Clearing corporation as central counterparty and the novation principle',
        'SPAN risk-based margins, exposure margin and extreme loss margin',
        'SEBI framework: position limits, contract specifications and investor protection',
        'Market, credit, liquidity, operational and legal risk classification',
        'Value at Risk (VaR) and Expected Shortfall as risk measures',
      ],
      explanationMd: `# Regulation, Clearing & Risk Management

### Central Counterparty Clearing
On execution, the clearing corporation interposes itself between buyer and seller through **novation** — becoming buyer to every seller and seller to every buyer. This mutualises counterparty risk across members and is backed by a default waterfall: initial margin, member's contribution, the clearing fund, and the CCP's own capital.

### Margining
Indian exchanges use **SPAN** (Standard Portfolio Analysis of Risk) to compute risk-based initial margin from a portfolio's worst-case loss across simulated scenarios, plus an **extreme loss margin (ELM)** for tail events and an **exposure margin** for concentration. Positions are marked to market daily and settled in cash.

### SEBI Framework
SEBI prescribes contract size (with minimum notional values to curb speculation), position limits at client and member level, price bands and circuit filters, and settlement cycles. Deriv trading is restricted to recognised stock exchanges — over-the-counter retail derivatives are prohibited.

### Risk Classification
- **Market risk**: loss from adverse price movement — measured by VaR.
- **Credit risk**: counterparty default, addressed through margining and CCP guarantee.
- **Liquidity risk**: inability to exit at fair value, acute in far-month and illiquid contracts.
- **Operational risk**: system failure, settlement breaks and model error.
- **Legal risk**: unenforceability of contract or netting arrangements.

### VaR and Expected Shortfall
**Value at Risk** estimates the maximum loss over a horizon at a given confidence (for example 99% one-day VaR). Its weakness is that it says nothing about losses *beyond* the threshold, which **Expected Shortfall** (the average loss in the tail) corrects — the reason Basel III moved from VaR to ES for market risk capital.`,
      formulas: [
        {
          id: 'formula-drv-8',
          label: 'Parametric Value at Risk',
          formula: 'VaR = Portfolio Value x z x sigma x sqrt(t)',
          exampleQ:
            'A portfolio of Rs 50 crore has daily volatility 1.5%. Compute the one-day 99% VaR (z = 2.33).',
          exampleA: 'VaR = 50,00,00,000 x 2.33 x 0.015 x 1 = Rs 17.475 lakh. There is a 1% chance of losing more than this in one day.',
        },
      ],
      tricks: [
        {
          id: 'trick-drv-5',
          title: 'VaR Ignores the Tail — Say So',
          trick:
            'Whenever you compute VaR, add one sentence noting that it is silent about losses beyond the confidence level and that Expected Shortfall addresses this. That single observation distinguishes a PG answer from a UG one.',
          whenToUse: 'Any market risk measurement question.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-drv-9',
          step: 'Step 1: Classify Each Risk in the Scenario',
          detail:
            'Assign every stated exposure to market, credit, liquidity, operational or legal risk before proposing any mitigation.',
          questionType: 'Risk Management Case',
        },
        {
          id: 'solve-drv-10',
          step: 'Step 2: Quantify and Recommend the Instrument',
          detail:
            'Compute VaR or margin requirement, then recommend the specific hedging instrument and explain the residual risk that remains unhedged.',
          questionType: 'Risk Management Case',
        },
      ],
    },
  ],

  // ── 7. Advanced Cost & Management Accounting (Sem 4) ──
  'mcom-karnataka-adv-cost-accounting': [
    {
      id: 'acm-mod1-abc',
      subjectId: 'mcom-karnataka-adv-cost-accounting',
      title: 'Activity Based Costing & Strategic Cost Management',
      moduleNumber: 1,
      moduleName: 'Module 1: Activity Based Costing',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-acm-mod1-01', 'q-acm-mod1-02'],
      subtopics: [
        'Limitations of volume-based absorption costing in automated environments',
        'Cost pools, cost drivers and the resource-to-activity assignment',
        'Computing activity rates and assigning overheads to products',
        'Activity Based Management and process value analysis',
        'Unit-level, batch-level, product-level and facility-level activities',
      ],
      explanationMd: `# Activity Based Costing

### Why Traditional Costing Fails
Volume-based absorption spreads overhead using a single driver such as direct labour hours. In modern automated plants, overhead is driven by **transactions** — set-ups, inspections, purchase orders, machine changes — not by volume. A low-volume complex product therefore absorbs too little overhead and appears artificially profitable, while a high-volume simple product is over-costed. This distortion is called **cost cross-subsidisation**.

### The ABC Mechanism
1. Identify **activities** that consume resources (set-up, quality inspection, material handling, order processing).
2. Accumulate costs into **cost pools**, one per activity.
3. Choose a **cost driver** causally linked to each pool (number of set-ups, inspections, orders).
4. Compute the **activity rate** = pool cost / total driver quantity.
5. Assign costs to products by multiplying the rate by each product's driver consumption.

### Activity Hierarchy
- **Unit-level**: incurred for each unit (machine power).
- **Batch-level**: incurred per batch (set-up, first-article inspection).
- **Product-level**: incurred to support a product line (design, tooling).
- **Facility-level**: incurred regardless of output (plant security, depreciation of the building).

Only the first two vary predictably with production decisions, which matters for pricing and product mix choices.

### Activity Based Management
ABM uses ABC information operationally: **process value analysis** distinguishes value-adding from non-value-adding activities, enabling the elimination of waste rather than merely reporting cost more accurately.`,
      formulas: [
        {
          id: 'formula-acm-1',
          label: 'Activity Rate and Overhead Assignment',
          formula: 'Activity Rate = Cost Pool / Total Driver Quantity; Product Overhead = Rate x Product Driver Usage',
          exampleQ:
            'Set-up cost pool Rs 6,00,000 across 200 set-ups. Product A needs 150 set-ups and Product B 50. Allocate the cost.',
          exampleA:
            'Rate = 6,00,000 / 200 = Rs 3,000 per set-up. Product A = 150 x 3,000 = Rs 4,50,000. Product B = 50 x 3,000 = Rs 1,50,000.',
        },
      ],
      tricks: [
        {
          id: 'trick-acm-1',
          title: 'ABC Rewards Complexity, Traditional Rewards Volume',
          trick:
            'Under ABC, complex low-volume products absorb MORE overhead than under traditional costing. If your ABC result shows the simple product becoming more expensive, you have the answer right.',
          whenToUse: 'ABC versus traditional costing comparison questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-acm-1',
          step: 'Step 1: Build the Cost Pool and Driver Table',
          detail:
            'List each activity, its total cost, its driver and total driver quantity, then compute each activity rate.',
          questionType: 'ABC Numerical (10 Marks)',
        },
        {
          id: 'solve-acm-2',
          step: 'Step 2: Assign, Compute Unit Cost and Compare',
          detail:
            'Assign overheads to each product, add direct costs, derive unit cost, and compare with the traditional volume-based result to quantify the distortion.',
          questionType: 'ABC Numerical (10 Marks)',
        },
      ],
    },
    {
      id: 'acm-mod2-standard-costing',
      subjectId: 'mcom-karnataka-adv-cost-accounting',
      title: 'Standard Costing & Comprehensive Variance Analysis',
      moduleNumber: 2,
      moduleName: 'Module 2: Standard Costing & Variances',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-acm-mod2-01', 'q-acm-mod2-02'],
      subtopics: [
        'Types of standards: ideal, attainable, current and basic',
        'Material variances: cost, price, usage and mix / yield',
        'Labour variances: rate, efficiency and idle time',
        'Overhead variances: expenditure, efficiency, capacity and volume',
        'Variance interpretation, responsibility accounting and management by exception',
      ],
      explanationMd: `# Standard Costing & Variance Analysis

### Purpose and Standard Types
Standard costing sets predetermined costs and measures performance by the deviation — the **variance**. Standards may be **ideal** (perfect conditions, unattainable), **attainable** (efficient performance with normal allowances — the preferred basis), **current** (actual expected this period) or **basic** (fixed base for trend analysis).

### Material Variances
- Material Cost Variance = (Standard Price x Standard Quantity) - (Actual Price x Actual Quantity)
- Material Price Variance = Actual Quantity x (Standard Price - Actual Price)
- Material Usage Variance = Standard Price x (Standard Quantity - Actual Quantity)
- Mix and yield variances decompose usage variance when input proportions or output rates change.

### Labour Variances
- Labour Rate Variance = Actual Hours x (Standard Rate - Actual Rate)
- Labour Efficiency Variance = Standard Rate x (Standard Hours - Actual Hours)
- Idle Time Variance isolates paid hours in which no work occurred.

### Overhead Variances
Overhead variance analysis separates **expenditure** (spending difference), **efficiency** (activity difference), **capacity** (volume of activity relative to budget) and **volume** (fixed overhead absorption difference). The volume variance exists only for fixed overheads and arises because absorption costing spreads a fixed pool over units produced.

### Interpretation
Favourable variances are not automatically good: a favourable material price variance from a cheaper supplier may cause an adverse usage variance through rework. Variances must be investigated by **management by exception**, with responsibility assigned to the manager who controls the driver.`,
      formulas: [
        {
          id: 'formula-acm-2',
          label: 'Material Variances',
          formula: 'MCV = MPV + MUV; MPV = AQ(SP - AP); MUV = SP(SQ - AQ)',
          exampleQ:
            'Standard: 4 kg at Rs 10 per unit for 1,000 units. Actual: 4,200 kg costing Rs 46,200. Compute price and usage variances.',
          exampleA:
            'AP = 46,200/4,200 = Rs 11. SQ = 4 x 1,000 = 4,000 kg. MPV = 4,200 x (10 - 11) = Rs 4,200 Adverse. MUV = 10 x (4,000 - 4,200) = Rs 2,000 Adverse. MCV = Rs 6,200 Adverse.',
        },
      ],
      tricks: [
        {
          id: 'trick-acm-2',
          title: 'Price Uses Actual Quantity, Usage Uses Standard Price',
          trick:
            'Price variances always use ACTUAL quantity; usage and efficiency variances always use STANDARD price/rate. This prevents double counting and is the most common source of error.',
          whenToUse: 'Every variance analysis numerical.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-acm-3',
          step: 'Step 1: Compute Standard Cost of Actual Output First',
          detail:
            'Restate all standards for the ACTUAL output level before comparing with actuals — the classic mistake is comparing to the budgeted output standard.',
          questionType: 'Variance Analysis Numerical',
        },
        {
          id: 'solve-acm-4',
          step: 'Step 2: Decompose, Label F/A and Assign Responsibility',
          detail:
            'Compute each sub-variance, mark Favourable or Adverse, verify that the sub-variances sum to the total, and attribute each to a responsible function.',
          questionType: 'Variance Analysis Numerical',
        },
      ],
    },
    {
      id: 'acm-mod3-transfer-pricing',
      subjectId: 'mcom-karnataka-adv-cost-accounting',
      title: 'Divisional Transfer Pricing & Responsibility Accounting',
      moduleNumber: 3,
      moduleName: 'Module 3: Decentralisation & Performance Measurement',
      order: 3,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-acm-mod3-01', 'q-acm-mod3-02'],
      subtopics: [
        'Decentralisation: benefits, costs and the goal congruence problem',
        'Responsibility centres: cost, revenue, profit and investment centres',
        'Transfer pricing methods: market, cost-based, negotiated and dual pricing',
        'Return on Investment, Residual Income and Economic Value Added',
        'Behavioural effects and the investment decision distortion under ROI',
      ],
      explanationMd: `# Transfer Pricing & Responsibility Accounting

### Responsibility Centres
Decentralisation divides the organisation into centres classified by what their manager controls: **cost centres** (production), **revenue centres** (sales), **profit centres** (a division with both) and **investment centres** (with control over capital employed). Performance must be measured only on controllable items.

### Transfer Pricing Methods
- **Market-based**: uses the external market price. Optimal where a perfectly competitive external market exists, because it preserves divisional autonomy and goal congruence.
- **Cost-based**: full cost, variable cost, or cost plus a markup. Simple but transfers no profit incentive to the selling division and can pass inefficiency downstream.
- **Negotiated**: divisions bargain. Works when both have alternatives; can consume management time.
- **Dual pricing**: selling division records market price while buying division records cost, with the difference eliminated in consolidation. Preserves incentives but complicates reporting.

### The General Rule
The economically optimal transfer price is:
Transfer Price = Incremental (marginal) Cost of the Selling Division + Opportunity Cost of the Transferred Unit.
When the selling division has spare capacity the opportunity cost is zero; when it is at capacity the opportunity cost is the lost contribution from external sales.

### Investment Centre Measures
- **ROI = Profit / Capital Employed**. Simple and comparable, but causes **dysfunctional behaviour**: a division with ROI of 25% will reject a project earning 20% even when the company's cost of capital is only 12%.
- **Residual Income = Profit - (Capital Employed x Required Rate of Return)**. Avoids that distortion because any project above the required return adds positive RI.
- **EVA = NOPAT - (Capital Employed x WACC)**, with accounting adjustments for items such as R&D capitalisation.`,
      formulas: [
        {
          id: 'formula-acm-3',
          label: 'Optimal Transfer Price',
          formula: 'TP = Marginal Cost of Producing Division + Opportunity Cost of Transfer',
          exampleQ:
            'A division produces a component at marginal cost Rs 80. It can sell externally at Rs 120 and is operating at full capacity. What transfer price preserves goal congruence?',
          exampleA:
            'TP = 80 + (120 - 80) = Rs 120. At full capacity the opportunity cost is the Rs 40 contribution forgone on external sales, so the internal price must equal the market price.',
        },
        {
          id: 'formula-acm-4',
          label: 'Residual Income',
          formula: 'RI = Divisional Profit - (Capital Employed x Required Rate of Return)',
          exampleQ:
            'Division profit Rs 50 lakh, capital employed Rs 300 lakh, required return 12%. Compute RI and ROI.',
          exampleA:
            'RI = 50 - (300 x 0.12) = 50 - 36 = Rs 14 lakh. ROI = 50/300 = 16.67%. Both exceed the hurdle, so the division is creating value.',
        },
      ],
      tricks: [
        {
          id: 'trick-acm-3',
          title: 'Spare Capacity Means Zero Opportunity Cost',
          trick:
            'The whole transfer pricing question usually turns on one fact: is the selling division at capacity? Spare capacity → opportunity cost is zero → transfer at marginal cost. At capacity → transfer at market price.',
          whenToUse: 'All transfer pricing decisions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-acm-5',
          step: 'Step 1: Determine Capacity Utilisation of the Selling Division',
          detail:
            'Establish whether spare capacity exists, because this decides whether an opportunity cost arises at all.',
          questionType: 'Transfer Pricing Case',
        },
        {
          id: 'solve-acm-6',
          step: 'Step 2: Compute the Transfer Price and Test Goal Congruence',
          detail:
            'Compute marginal cost plus opportunity cost, then verify that both divisions\u2019 profit-maximising decisions also maximise total company profit.',
          questionType: 'Transfer Pricing Case',
        },
      ],
    },
    {
      id: 'acm-mod4-cvp-decisions',
      subjectId: 'mcom-karnataka-adv-cost-accounting',
      title: 'Marginal Costing, CVP Analysis & Decision Making',
      moduleNumber: 4,
      moduleName: 'Module 4: Cost-Volume-Profit & Short-Term Decisions',
      order: 4,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-acm-mod4-01', 'q-acm-mod4-02'],
      subtopics: [
        'Marginal versus absorption costing and profit reconciliation',
        'Contribution, P/V ratio, break-even point and margin of safety',
        'Multi-product break-even and sales mix analysis',
        'Limiting factor analysis and contribution per unit of scarce resource',
        'Short-term decisions: make or buy, special orders, dropping a segment',
      ],
      explanationMd: `# Marginal Costing, CVP & Short-Term Decisions

### Marginal versus Absorption Costing
Marginal costing treats fixed manufacturing overhead as a period cost; absorption costing attaches it to units produced. When production exceeds sales, absorption costing defers fixed overhead into closing stock and reports **higher profit**. The difference in profit is exactly:

(Fixed overhead per unit) x (Change in inventory units)

### CVP Fundamentals
- **Contribution** = Sales - Variable Cost
- **P/V Ratio** = Contribution / Sales
- **Break-Even Point (units)** = Fixed Cost / Contribution per unit
- **Break-Even Point (sales value)** = Fixed Cost / P-V Ratio
- **Margin of Safety** = Actual Sales - Break-Even Sales

### Limiting Factor Analysis
When a resource is scarce — machine hours, labour hours, raw material — products must be ranked by **contribution per unit of the limiting factor**, not by contribution per unit or by P/V ratio. This single reframing is the heart of most 10-mark PG problems.

### Short-Term Decision Rules
- **Special order**: accept if the price exceeds marginal cost and spare capacity exists, ignoring fixed costs that do not change.
- **Make or buy**: compare marginal cost of making with the purchase price, adjusting for any capacity released.
- **Drop a segment**: retain if the segment generates positive contribution after its avoidable fixed costs, since unavoidable fixed costs continue regardless.
- **Shutdown point**: continue operating in the short run while price exceeds average variable cost.`,
      formulas: [
        {
          id: 'formula-acm-5',
          label: 'Break-Even and Margin of Safety',
          formula: 'BEP (units) = Fixed Cost / Contribution per Unit; MOS = Actual Sales - BEP Sales',
          exampleQ:
            'Selling price Rs 50, variable cost Rs 30, fixed cost Rs 4,00,000, actual sales 30,000 units. Find BEP and margin of safety.',
          exampleA:
            'Contribution per unit = Rs 20. BEP = 4,00,000 / 20 = 20,000 units. MOS = 30,000 - 20,000 = 10,000 units (33.3% of sales).',
        },
        {
          id: 'formula-acm-6',
          label: 'Profit Reconciliation Between Costing Methods',
          formula: 'Absorption Profit - Marginal Profit = Fixed OH per Unit x (Closing Stock - Opening Stock)',
          exampleQ:
            'Fixed overhead Rs 6,00,000, production 10,000 units, sales 8,000 units, no opening stock. Find the profit difference.',
          exampleA:
            'Fixed OH per unit = Rs 60. Closing stock = 2,000 units. Absorption profit exceeds marginal profit by 60 x 2,000 = Rs 1,20,000, being the overhead deferred into stock.',
        },
      ],
      tricks: [
        {
          id: 'trick-acm-4',
          title: 'Production Exceeds Sales → Absorption Profit Is Higher',
          trick:
            'Remember the direction: stock builds up, absorption profit is higher. If your reconciliation shows the opposite sign, you have swapped the two methods.',
          whenToUse: 'Profit reconciliation questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-acm-7',
          step: 'Step 1: Prepare Statements Under Both Methods',
          detail:
            'Build the marginal costing statement (contribution less fixed cost) and the absorption statement (production cost per unit including fixed overhead) side by side.',
          questionType: 'CVP & Reconciliation Numerical',
        },
        {
          id: 'solve-acm-8',
          step: 'Step 2: Reconcile and Explain the Difference',
          detail:
            'Show that the profit difference equals fixed overhead per unit multiplied by the change in inventory, and explain the underlying deferral of overhead into stock.',
          questionType: 'CVP & Reconciliation Numerical',
        },
      ],
    },
    {
      id: 'acm-mod5-modern-techniques',
      subjectId: 'mcom-karnataka-adv-cost-accounting',
      title: 'Target Costing, Life Cycle Costing & the Balanced Scorecard',
      moduleNumber: 5,
      moduleName: 'Module 5: Strategic Cost Management Techniques',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-acm-mod5-01', 'q-acm-mod5-02'],
      subtopics: [
        'Target costing: price-led costing, target cost gap and value engineering',
        'Life cycle costing and cost commitment across design, production and post-sale',
        'Kaizen costing and continuous improvement in Indian manufacturing',
        'Throughput accounting and the theory of constraints',
        'The Balanced Scorecard: financial, customer, process and learning perspectives',
      ],
      explanationMd: `# Strategic Cost Management Techniques

### Target Costing
Traditional costing is **cost-plus**: compute cost, add a margin, set the price. Target costing inverts this because in competitive markets the price is *given*:

Target Cost = Expected Selling Price - Desired Profit Margin

If the currently achievable cost exceeds the target, the **target cost gap** must be closed through **value engineering** (redesigning to remove cost without removing function), supplier negotiation or process improvement — before production begins. Roughly 80% of a product's life cycle cost is committed at the design stage, which is why target costing operates pre-production.

### Life Cycle Costing
Life cycle costing accumulates all costs from research and design, through production, to post-sale support and eventual decommissioning, and matches them against revenue over the whole life. It reveals that products with low manufacturing cost can be unprofitable once warranty, service and disposal costs are included.

### Kaizen Costing
Where standard costing sets a fixed standard, **kaizen costing** sets progressively tighter cost reduction targets over time, embedding continuous improvement into the cost system. It is central to lean manufacturing practice in the automotive clusters around Bengaluru and Hosur.

### Throughput Accounting
Based on Goldratt's Theory of Constraints, throughput accounting maximises **throughput** (sales less truly variable costs) per unit of the bottleneck resource, treating all other operating expenses as period costs.

### The Balanced Scorecard
Kaplan and Norton's framework translates strategy into four linked perspectives: **financial** (shareholder outcomes), **customer** (value proposition), **internal process** (operational excellence) and **learning and growth** (capability building). Cause-and-effect links between perspectives prevent the myopia of purely financial measurement.`,
      formulas: [
        {
          id: 'formula-acm-7',
          label: 'Target Cost and Target Cost Gap',
          formula: 'Target Cost = Selling Price - Desired Profit; Gap = Currently Achievable Cost - Target Cost',
          exampleQ:
            'Expected selling price Rs 500, desired margin 20% of price, currently achievable cost Rs 425. Compute the target cost and the gap.',
          exampleA:
            'Desired profit = 20% x 500 = Rs 100. Target cost = 500 - 100 = Rs 400. Gap = 425 - 400 = Rs 25 per unit, which must be engineered out before launch.',
        },
      ],
      tricks: [
        {
          id: 'trick-acm-5',
          title: 'Check Whether Margin Is on Price or on Cost',
          trick:
            'A 20% margin on selling price differs from a 20% mark-up on cost. Target costing uses the PRICE base. Misreading this inflates the target cost and produces a wrong gap.',
          whenToUse: 'Target costing numericals.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-acm-9',
          step: 'Step 1: Derive the Target Cost from Market Price',
          detail:
            'Start from the price the market will bear, subtract the required margin on the correct base, and state the target cost.',
          questionType: 'Strategic Costing Case',
        },
        {
          id: 'solve-acm-10',
          step: 'Step 2: Quantify the Gap and Propose Closure Measures',
          detail:
            'Compare with achievable cost, quantify the gap per unit and in total, then recommend value engineering, supplier or process actions with an estimated saving for each.',
          questionType: 'Strategic Costing Case',
        },
      ],
    },
  ],

  // ── 8. Research Methodology & Statistical Analysis (Sem 4) ──
  'mcom-karnataka-research-methodology': [
    {
      id: 'rm-mod1-research-design',
      subjectId: 'mcom-karnataka-research-methodology',
      title: 'Research Design, Problem Formulation & Hypotheses',
      moduleNumber: 1,
      moduleName: 'Module 1: Foundations of Business Research',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-rm-mod1-01', 'q-rm-mod1-02'],
      subtopics: [
        'Meaning, objectives and motivation of business research',
        'Exploratory, descriptive and causal (experimental) research designs',
        'Formulating the research problem, objectives and research questions',
        'Null and alternative hypotheses, directional versus non-directional',
        'Type I and Type II errors, significance level and power of a test',
      ],
      explanationMd: `# Research Design & Hypothesis Formulation

### Purpose of Business Research
Research is a systematic enquiry that reduces uncertainty in managerial decision making. It may be motivated by the need to solve a problem, to obtain a degree, to gain intellectual satisfaction, or to inform policy.

### Design Types
- **Exploratory**: clarifies an ambiguous problem; uses literature review, expert interviews and focus groups. Findings are not generalisable.
- **Descriptive**: describes characteristics of a population or phenomenon; typically cross-sectional surveys. Answers who, what, where, when — not why.
- **Causal (experimental)**: establishes cause-and-effect by manipulating an independent variable and controlling extraneous variables. The only design that supports causal inference.

### Hypotheses
A hypothesis is a testable proposition. The **null hypothesis (H0)** states no effect and is the hypothesis actually tested; the **alternative (H1)** states the effect the researcher expects. Hypotheses may be **directional** (one-tailed, e.g. "incentives increase productivity") or **non-directional** (two-tailed, e.g. "incentives affect productivity").

### Errors and Power
- **Type I error (alpha)**: rejecting a true null — a false positive. Conventionally controlled at 5%.
- **Type II error (beta)**: failing to reject a false null — a false negative.
- **Power = 1 - beta**: the probability of detecting a real effect. Power rises with sample size, effect size and significance level.

A well-designed study states alpha, target power and the minimum detectable effect before data collection — pre-registration practice now expected in doctoral research.`,
      formulas: [
        {
          id: 'formula-rm-1',
          label: 'Power of a Test',
          formula: 'Power = 1 - beta (probability of correctly rejecting a false null hypothesis)',
          exampleQ:
            'A test has a 20% chance of failing to detect a real effect. State its power and interpret.',
          exampleA:
            'Power = 1 - 0.20 = 0.80, or 80%. The test will correctly detect a genuine effect in 80 out of 100 repetitions — the conventional minimum standard.',
        },
      ],
      tricks: [
        {
          id: 'trick-rm-1',
          title: 'You Never "Accept" H0',
          trick:
            'Correct language is "fail to reject H0". Failing to reject is not the same as proving no effect — it may simply reflect inadequate power. Using precise wording signals methodological literacy.',
          whenToUse: 'Hypothesis testing answers and report writing.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-rm-1',
          step: 'Step 1: Classify the Research Objective to Select the Design',
          detail:
            'Determine whether the study seeks to explore, describe or establish causation, since the objective dictates the design and the analysis that follows.',
          questionType: 'Research Design Question',
        },
        {
          id: 'solve-rm-2',
          step: 'Step 2: State H0 and H1 and Identify the Error Risk',
          detail:
            'Write both hypotheses formally, state whether the test is one- or two-tailed, and identify which error the researcher is controlling.',
          questionType: 'Research Design Question',
        },
      ],
    },
    {
      id: 'rm-mod2-sampling',
      subjectId: 'mcom-karnataka-research-methodology',
      title: 'Sampling Design, Sample Size & Measurement Scales',
      moduleNumber: 2,
      moduleName: 'Module 2: Sampling & Measurement',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-rm-mod2-01', 'q-rm-mod2-02'],
      subtopics: [
        'Population, sampling frame, sampling unit and the sampling process',
        'Probability sampling: simple random, stratified, systematic and cluster',
        'Non-probability sampling: convenience, judgement, quota and snowball',
        'Sample size determination using the normal approximation formula',
        'Measurement scales: nominal, ordinal, interval and ratio; reliability and validity',
      ],
      explanationMd: `# Sampling Design & Measurement

### Probability Sampling
- **Simple random sampling**: every unit has an equal, known chance of selection; the basis for classical inference.
- **Stratified sampling**: the population is divided into homogeneous strata and samples drawn from each. Increases precision when strata differ meaningfully — for example sampling separately across rural and urban branches.
- **Systematic sampling**: select every k-th unit after a random start. Efficient but vulnerable to periodicity in the frame.
- **Cluster sampling**: divide into heterogeneous clusters, select some clusters and sample all (or some) units within. Economical for geographically dispersed populations; less precise per unit than stratified sampling.

Stratified sampling samples *within every* stratum; cluster sampling samples *some* clusters entirely. Confusing the two is a standard exam error.

### Non-Probability Sampling
Convenience, judgement, quota and snowball sampling do not permit statistical generalisation, but are legitimate in exploratory and qualitative work.

### Sample Size
For estimating a proportion with margin of error e at confidence level z:

n = (z^2 x p x q) / e^2

Taking p = 0.5 maximises the product p x q and is the conservative default.

### Measurement Scales
- **Nominal**: categories with no order (gender, region). Only mode and chi-square apply.
- **Ordinal**: ordered categories with unequal intervals (satisfaction ratings). Median and non-parametric tests.
- **Interval**: equal intervals, no true zero (Celsius). Mean and parametric tests; ratios are meaningless.
- **Ratio**: true zero (income, weight). Full arithmetic permitted.

### Reliability and Validity
**Reliability** is consistency — measured by Cronbach's alpha, where 0.70 is the accepted threshold. **Validity** is whether the instrument measures what it claims: content validity, construct validity (convergent and discriminant) and criterion validity.`,
      formulas: [
        {
          id: 'formula-rm-2',
          label: 'Sample Size for Estimating a Proportion',
          formula: 'n = (z^2 x p x (1 - p)) / e^2',
          exampleQ:
            'Estimate the proportion of customers satisfied, with 95% confidence (z = 1.96) and a margin of error of 5%, assuming maximum variability.',
          exampleA:
            'n = (1.96^2 x 0.5 x 0.5) / 0.05^2 = (3.8416 x 0.25) / 0.0025 = 0.9604 / 0.0025 = 384.16, rounded up to 385 respondents.',
        },
      ],
      tricks: [
        {
          id: 'trick-rm-2',
          title: 'Stratify Every Stratum, Cluster Some Clusters',
          trick:
            'In stratified sampling you sample from EVERY stratum; in cluster sampling you select SOME clusters and take all units within. Say this sentence and the distinction question is complete.',
          whenToUse: 'Sampling design comparison questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-rm-3',
          step: 'Step 1: Define Population, Frame and Unit',
          detail:
            'Specify the target population, the accessible sampling frame and the sampling unit, noting any divergence between frame and population as a source of coverage error.',
          questionType: 'Sampling Design Question',
        },
        {
          id: 'solve-rm-4',
          step: 'Step 2: Compute Sample Size and Justify the Method',
          detail:
            'Apply the sample size formula with the stated confidence and precision, then justify the sampling method by reference to population structure and cost.',
          questionType: 'Sampling Design Question',
        },
      ],
    },
    {
      id: 'rm-mod3-spss-descriptives',
      subjectId: 'mcom-karnataka-research-methodology',
      title: 'SPSS Data Preparation, Descriptive Statistics & Assumption Testing',
      moduleNumber: 3,
      moduleName: 'Module 3: Data Handling & Descriptive Analysis in SPSS',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-rm-mod3-01', 'q-rm-mod3-02'],
      subtopics: [
        'SPSS interface: data view, variable view and variable attributes',
        'Data cleaning: missing values, outliers, coding and reverse-scored items',
        'Central tendency, dispersion, skewness and kurtosis',
        'Normality testing: Shapiro-Wilk, Kolmogorov-Smirnov and Q-Q plots',
        'Cross-tabulation and data transformation in SPSS',
      ],
      explanationMd: `# SPSS Data Preparation & Descriptives

### The Two Views
SPSS operates with a **Variable View** (define each variable's name, type, label, values, missing values and measure level) and a **Data View** (the case-by-variable matrix). Defining the measure level correctly — nominal, ordinal or scale — is essential because it determines which tests SPSS offers.

### Data Cleaning
Cleaning precedes analysis and typically consumes more time than the analysis itself:
- **Missing values**: choose listwise deletion, pairwise deletion or imputation (mean, median or regression), and document the choice because it affects generalisability.
- **Outliers**: detect with box plots and z-scores beyond plus or minus 3; investigate before deletion, as an outlier may be genuine.
- **Reverse-scored items**: must be recoded before combining into a scale, or the composite reliability collapses.

### Descriptive Statistics
Report mean, median and mode for central tendency; range, variance and standard deviation for dispersion. **Skewness** measures asymmetry and **kurtosis** measures tail heaviness; values between -1 and +1 are generally acceptable, and between -2 and +2 leniently so.

### Normality Testing
Parametric tests assume normality. The **Shapiro-Wilk** test is preferred for samples below 2,000 and **Kolmogorov-Smirnov** for larger ones; a non-significant result indicates the normality assumption is not violated. Because large samples reject normality on trivial deviations, always corroborate with a **Q-Q plot** and the skewness and kurtosis statistics.

### Cross-Tabulation
Crosstabs display the joint distribution of two categorical variables and are the precursor to chi-square testing. Requesting row and column percentages alongside counts is good reporting practice.`,
      formulas: [
        {
          id: 'formula-rm-3',
          label: 'Coefficient of Variation',
          formula: 'CV = (Standard Deviation / Mean) x 100',
          exampleQ:
            'Two portfolios have mean returns of 12% (SD 4%) and 8% (SD 3%). Which is relatively more variable?',
          exampleA:
            'CV_A = (4/12) x 100 = 33.3%. CV_B = (3/8) x 100 = 37.5%. Portfolio B is relatively more variable despite the lower absolute standard deviation.',
        },
      ],
      tricks: [
        {
          id: 'trick-rm-3',
          title: 'Shapiro-Wilk for Small Samples',
          trick:
            'Use Shapiro-Wilk below n = 2,000 and Kolmogorov-Smirnov above it. Also remember that a SIGNIFICANT p-value means normality is VIOLATED — the opposite of the intuition many students apply.',
          whenToUse: 'Assumption testing in any SPSS-based answer.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-rm-5',
          step: 'Step 1: Screen the Data Before Any Inferential Test',
          detail:
            'Check missing patterns, outliers, normality and reliability. Report each check with its statistic and the decision taken.',
          questionType: 'SPSS Analysis Interpretation',
        },
        {
          id: 'solve-rm-6',
          step: 'Step 2: Report Descriptives in Standard Form',
          detail:
            'Present mean, standard deviation, skewness and kurtosis for every scale variable, and frequencies with percentages for categorical variables.',
          questionType: 'SPSS Analysis Interpretation',
        },
      ],
    },
    {
      id: 'rm-mod4-hypothesis-testing',
      subjectId: 'mcom-karnataka-research-methodology',
      title: 'Hypothesis Testing: t-Tests, ANOVA & Chi-Square',
      moduleNumber: 4,
      moduleName: 'Module 4: Inferential Statistics',
      order: 4,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-rm-mod4-01', 'q-rm-mod4-02'],
      subtopics: [
        'The five-step hypothesis testing procedure and p-value interpretation',
        'One-sample, independent samples and paired samples t-tests',
        'One-way and two-way ANOVA, F statistic and post hoc comparisons',
        'Chi-square test of independence and goodness of fit',
        'Parametric versus non-parametric alternatives (Mann-Whitney, Kruskal-Wallis)',
      ],
      explanationMd: `# Hypothesis Testing

### The Five-Step Procedure
1. State the null and alternative hypotheses.
2. Choose the significance level (conventionally 0.05) and the appropriate test.
3. Compute the test statistic from the sample.
4. Compare with the critical value, or compare the p-value with alpha.
5. Draw the statistical conclusion and translate it into a managerial statement.

The **p-value** is the probability of obtaining a result at least as extreme as the observed one, assuming the null is true. If p < alpha, reject H0.

### t-Tests
- **One-sample t**: compares a sample mean with a known or hypothesised value.
- **Independent samples t**: compares means of two unrelated groups. Levene's test first checks equality of variance; if violated, read the "equal variances not assumed" row.
- **Paired samples t**: compares the same subjects measured twice (pre-post designs).

### ANOVA
One-way ANOVA tests whether three or more group means are equal using:

F = Between-group variance / Within-group variance

A significant F tells you *that* groups differ, not *which* differ — post hoc tests (Tukey, Bonferroni) identify the specific pairs. Two-way ANOVA additionally tests the interaction between two factors.

### Chi-Square
The chi-square test of independence examines whether two categorical variables are associated:

chi-square = Sum of (Observed - Expected)^2 / Expected

Expected frequencies should exceed 5 in at least 80% of cells; otherwise combine categories or use Fisher's exact test.

### Non-Parametric Alternatives
When assumptions fail — ordinal data or non-normal distributions — use **Mann-Whitney U** instead of the independent t-test, **Wilcoxon signed-rank** instead of the paired t-test, and **Kruskal-Wallis** instead of one-way ANOVA.`,
      formulas: [
        {
          id: 'formula-rm-4',
          label: 'Independent Samples t-Statistic',
          formula: 't = (X1 - X2) / sqrt[ s1^2/n1 + s2^2/n2 ]',
          exampleQ:
            'Group 1: mean 78, variance 25, n = 30. Group 2: mean 70, variance 36, n = 30. Compute t.',
          exampleA:
            'SE = sqrt(25/30 + 36/30) = sqrt(0.833 + 1.2) = sqrt(2.033) = 1.426. t = (78 - 70)/1.426 = 5.61, significant at the 1% level with 58 degrees of freedom.',
        },
        {
          id: 'formula-rm-5',
          label: 'Chi-Square Test Statistic',
          formula: 'chi-square = Sum over cells of (O - E)^2 / E',
          exampleQ:
            'A cell has an observed frequency of 42 and an expected frequency of 30. Compute its contribution to chi-square.',
          exampleA: 'Contribution = (42 - 30)^2 / 30 = 144 / 30 = 4.80.',
        },
      ],
      tricks: [
        {
          id: 'trick-rm-4',
          title: 'Match the Test to the Variable Types',
          trick:
            'Ask two questions: how many groups, and what scale is the dependent variable? Two groups with a scale DV → t-test. Three or more groups with a scale DV → ANOVA. Two categorical variables → chi-square. This decision tree resolves every "choose the test" question.',
          whenToUse: 'Test selection questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-rm-7',
          step: 'Step 1: Identify Variables, Levels and Assumptions',
          detail:
            'Classify the independent and dependent variables and confirm that normality, independence and homogeneity of variance hold before selecting a parametric test.',
          questionType: 'Hypothesis Testing Numerical',
        },
        {
          id: 'solve-rm-8',
          step: 'Step 2: Compute, Compare and Conclude in Managerial Terms',
          detail:
            'Compute the statistic and degrees of freedom, compare with the critical value at the stated alpha, and state the practical conclusion — not merely the statistical one.',
          questionType: 'Hypothesis Testing Numerical',
        },
      ],
    },
    {
      id: 'rm-mod5-regression-factor',
      subjectId: 'mcom-karnataka-research-methodology',
      title: 'Correlation, Regression, Factor Analysis & Report Writing',
      moduleNumber: 5,
      moduleName: 'Module 5: Multivariate Analysis & Research Reporting',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-rm-mod5-01', 'q-rm-mod5-02'],
      subtopics: [
        'Pearson and Spearman correlation, and correlation versus causation',
        'Simple and multiple regression: R square, adjusted R square, F and t tests',
        'Regression diagnostics: multicollinearity (VIF), autocorrelation and heteroscedasticity',
        'Factor analysis: KMO, Bartlett test, eigenvalues, varimax rotation and factor loadings',
        'Structuring a research report and thesis chapterisation',
      ],
      explanationMd: `# Multivariate Analysis & Research Reporting

### Correlation
**Pearson's r** measures linear association between two interval or ratio variables, ranging from -1 to +1. **Spearman's rho** uses ranks and suits ordinal data. The square of r gives the proportion of variance explained. Critically, correlation does not imply causation — a third variable or reverse causality may explain the association.

### Multiple Regression
Y = a + b1X1 + b2X2 + ... + bnXn + e

- **R square**: proportion of variance in Y explained by the model.
- **Adjusted R square**: penalises R square for adding predictors that contribute nothing; always report this in multiple regression.
- **F test**: whether the model as a whole is significant.
- **t tests**: whether each individual coefficient differs from zero.

### Diagnostics
- **Multicollinearity**: predictors correlated with each other, inflating standard errors. Diagnosed by **VIF**; values above 10 indicate a serious problem.
- **Autocorrelation**: residual correlation across observations, tested by Durbin-Watson (approximately 2 indicates no autocorrelation).
- **Heteroscedasticity**: non-constant residual variance, detected by residual plots or the Breusch-Pagan test.

### Factor Analysis
Factor analysis reduces many correlated variables to a few underlying constructs. Prerequisites: **KMO** measure of sampling adequacy above 0.60 (0.80 is good) and a significant **Bartlett's test of sphericity**. Factors with **eigenvalues above 1** are retained, **varimax rotation** simplifies interpretation, and **loadings above 0.50** are considered meaningful.

### Report Writing
A standard dissertation follows: introduction and problem, literature review and gap, research methodology, data analysis and interpretation, findings, and conclusions with implications and limitations. Every table must be numbered, titled, sourced and interpreted in the text — a table without interpretation earns no marks.`,
      formulas: [
        {
          id: 'formula-rm-6',
          label: 'Coefficient of Determination',
          formula: 'R^2 = Explained Variation / Total Variation = 1 - (SSE / SST)',
          exampleQ:
            'Total sum of squares is 1,200 and the sum of squared errors is 300. Compute R square and interpret.',
          exampleA:
            'R square = 1 - (300/1200) = 1 - 0.25 = 0.75. The model explains 75% of the variation in the dependent variable.',
        },
      ],
      tricks: [
        {
          id: 'trick-rm-5',
          title: 'Report Adjusted R Square, Not R Square',
          trick:
            'R square always rises when predictors are added, even useless ones. In multiple regression quote adjusted R square — mentioning why earns the methodology mark.',
          whenToUse: 'Regression interpretation questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-rm-9',
          step: 'Step 1: Check Model Prerequisites and Fit Statistics',
          detail:
            'Confirm KMO and Bartlett for factor analysis, or F, R square and VIF for regression, before interpreting any coefficient or loading.',
          questionType: 'Multivariate Analysis Interpretation',
        },
        {
          id: 'solve-rm-10',
          step: 'Step 2: Interpret and Translate Into Managerial Implications',
          detail:
            'State which variables or factors matter, their direction and magnitude, and the practical decision that follows — with the study\u2019s limitations acknowledged.',
          questionType: 'Multivariate Analysis Interpretation',
        },
      ],
    },
  ],
}

export const SEEDED_MCOM_QUESTIONS: UniversalQuestion[] = [
  // ── Advanced Financial Management ──
  {
    id: 'q-afm-mod1-01',
    questionText:
      'Under which capital structure theory does the overall cost of capital (Ko) remain constant regardless of the debt-equity mix?',
    options: [
      'Net Income (NI) approach',
      'Net Operating Income (NOI) approach',
      'Traditional approach',
      'Modigliani-Miller approach with corporate tax',
    ],
    correctIndex: 1,
    explanation:
      'The NOI approach assumes Ko is constant at every gearing level; any benefit from cheaper debt is exactly neutralised by a rising cost of equity, so firm value is independent of capital structure.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 1 },
    prepTags: {
      subjectId: 'mcom-karnataka-adv-fin-mgmt',
      topicIds: ['afm-mod1-capital-structure'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-afm-mod1-02',
    questionText:
      'An unlevered firm is valued at Rs 500 crore. It raises Rs 200 crore of debt. With a corporate tax rate of 30%, what is the levered firm value under the MM proposition with taxes?',
    options: ['Rs 500 crore', 'Rs 560 crore', 'Rs 640 crore', 'Rs 700 crore'],
    correctIndex: 1,
    explanation:
      'VL = VU + (T x D) = 500 + (0.30 x 200) = 500 + 60 = Rs 560 crore. The Rs 60 crore is the present value of the interest tax shield.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 5, semester: 1 },
    prepTags: {
      subjectId: 'mcom-karnataka-adv-fin-mgmt',
      topicIds: ['afm-mod1-capital-structure'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-afm-mod2-01',
    questionText:
      'Sales Rs 800 lakh, variable cost Rs 480 lakh, fixed cost Rs 200 lakh and interest Rs 40 lakh. What is the degree of combined leverage?',
    options: ['2.0', '2.67', '4.0', '1.33'],
    correctIndex: 2,
    explanation:
      'Contribution = 800 - 480 = 320. EBIT = 320 - 200 = 120. DOL = 320/120 = 2.67. DFL = 120/(120-40) = 1.5. DCL = 2.67 x 1.5 = 4.0.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Mangalore University', year: 2024, marks: 10, semester: 1 },
    prepTags: {
      subjectId: 'mcom-karnataka-adv-fin-mgmt',
      topicIds: ['afm-mod2-wacc-leverage'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-afm-mod2-02',
    questionText:
      'Why is the after-tax cost of debt used in the WACC calculation rather than the pre-tax cost?',
    options: [
      'Because debt is always cheaper than equity',
      'Because interest is deductible for tax, so the effective cost to the firm is lower',
      'Because the market value of debt always equals its book value',
      'Because debt holders bear no risk',
    ],
    correctIndex: 1,
    explanation:
      'Interest is a tax-deductible expense, so each rupee of interest saves T rupees of tax. The true economic cost is Kd x (1 - T), and WACC must reflect post-tax costs to be comparable with after-tax cash flows.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-adv-fin-mgmt',
      topicIds: ['afm-mod2-wacc-leverage'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-afm-mod3-01',
    questionText:
      "In Walter's model, if the firm's internal rate of return (r) exceeds its cost of capital (Ke), the optimal dividend payout ratio is:",
    options: ['100%', '50%', '0%', 'Indeterminate — payout is irrelevant'],
    correctIndex: 2,
    explanation:
      "When r > Ke the firm earns more than shareholders could earn elsewhere, so every rupee retained adds value. Walter's model therefore prescribes a 0% payout.",
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2022, marks: 5, semester: 1 },
    prepTags: {
      subjectId: 'mcom-karnataka-adv-fin-mgmt',
      topicIds: ['afm-mod3-dividend-policy'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-afm-mod3-02',
    questionText:
      "A share pays an expected dividend of Rs 8 next year, Ke is 16% and dividends grow at 8%. Using Gordon's model, the intrinsic price is:",
    options: ['Rs 50', 'Rs 80', 'Rs 100', 'Rs 128'],
    correctIndex: 2,
    explanation: "P0 = D1 / (Ke - g) = 8 / (0.16 - 0.08) = 8 / 0.08 = Rs 100.",
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-adv-fin-mgmt',
      topicIds: ['afm-mod3-dividend-policy'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-afm-mod4-01',
    questionText:
      'Under capital rationing, projects should be ranked by which measure?',
    options: [
      'Absolute net present value',
      'Internal rate of return',
      'Profitability index',
      'Payback period',
    ],
    correctIndex: 2,
    explanation:
      'The profitability index measures value created per rupee invested, which is the correct criterion when the budget binds. Ranking by absolute NPV can waste the constrained budget on one large project.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Karnatak University (KUD)', year: 2023, marks: 5, semester: 1 },
    prepTags: {
      subjectId: 'mcom-karnataka-adv-fin-mgmt',
      topicIds: ['afm-mod4-capital-budgeting-risk'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-afm-mod4-02',
    questionText:
      'The certainty equivalent approach adjusts for risk by:',
    options: [
      'Increasing the discount rate by a risk premium',
      'Multiplying risky cash flows by a coefficient between 0 and 1 and discounting at the risk-free rate',
      'Extending the project life',
      'Adding a terminal salvage value',
    ],
    correctIndex: 1,
    explanation:
      'Certainty equivalents deflate the numerator (cash flows) and discount at the risk-free rate. Adjusting both the cash flow and the discount rate would double count risk.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-adv-fin-mgmt',
      topicIds: ['afm-mod4-capital-budgeting-risk'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-afm-mod5-01',
    questionText:
      'A firm has inventory days of 50, receivables days of 70 and payables days of 130. Its cash conversion cycle is:',
    options: ['120 days', '20 days', '-10 days', '250 days'],
    correctIndex: 2,
    explanation:
      'CCC = DIO + DSO - DPO = 50 + 70 - 130 = -10 days. The negative cycle means suppliers finance operations, giving the firm free working capital.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Bengaluru City University (BCU)', year: 2024, marks: 10, semester: 1 },
    prepTags: {
      subjectId: 'mcom-karnataka-adv-fin-mgmt',
      topicIds: ['afm-mod5-working-capital-restructuring'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-afm-mod5-02',
    questionText:
      'Annual demand is 16,000 units, ordering cost Rs 50 per order and carrying cost Rs 4 per unit per year. The economic order quantity is:',
    options: ['400 units', '632 units', '800 units', '1,000 units'],
    correctIndex: 1,
    explanation: 'EOQ = sqrt((2 x 16,000 x 50) / 4) = sqrt(400,000) = 632.46 units.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-adv-fin-mgmt',
      topicIds: ['afm-mod5-working-capital-restructuring'],
      stream: 'finance',
      program: 'mcom',
    },
  },

  // ── Monetary System & Central Banking ──
  {
    id: 'q-mon-mod1-01',
    questionText:
      "In Fisher's equation of exchange MV = PT, classical economists assume that in the short run:",
    options: [
      'V and T are constant',
      'M and P are constant',
      'V and P are constant',
      'M and T are constant',
    ],
    correctIndex: 0,
    explanation:
      'Classical quantity theory treats velocity V (institutionally determined) and transactions T (at full employment) as stable, so changes in M translate proportionally into P.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Mysore University (UOM)', year: 2022, marks: 2, semester: 1 },
    prepTags: {
      subjectId: 'mcom-karnataka-monetary-system',
      topicIds: ['mon-mod1-money-functions'],
      stream: 'economics',
      program: 'mcom',
    },
  },
  {
    id: 'q-mon-mod1-02',
    questionText: 'Which of the following best describes token money?',
    options: [
      'Money whose intrinsic value exceeds its face value',
      'Money whose intrinsic value is less than its face value',
      'Money whose intrinsic value equals its face value',
      'Money convertible into gold on demand',
    ],
    correctIndex: 1,
    explanation:
      'Token money has intrinsic value below face value — Indian coins are the standard example. Full-bodied money has intrinsic value equal to face value.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-monetary-system',
      topicIds: ['mon-mod1-money-functions'],
      stream: 'economics',
      program: 'mcom',
    },
  },
  {
    id: 'q-mon-mod2-01',
    questionText:
      'Under the inflation targeting framework adopted by India in 2016, the CPI inflation target and tolerance band are:',
    options: ['3% with a band of +/- 1%', '4% with a band of +/- 2%', '5% with a band of +/- 3%', '6% with a band of +/- 2%'],
    correctIndex: 1,
    explanation:
      'The RBI Act as amended in 2016 sets a 4% CPI inflation target with a tolerance band of plus or minus 2%, administered by the six-member Monetary Policy Committee.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 1 },
    prepTags: {
      subjectId: 'mcom-karnataka-monetary-system',
      topicIds: ['mon-mod2-rbi-policy'],
      stream: 'economics',
      program: 'mcom',
    },
  },
  {
    id: 'q-mon-mod2-02',
    questionText:
      'With a currency-deposit ratio of 0.50, a required reserve ratio of 0.10 and an excess reserve ratio of 0.05, the money multiplier equals:',
    options: ['2.31', '2.50', '3.08', '1.54'],
    correctIndex: 0,
    explanation: 'm = (1 + c) / (c + r + e) = 1.50 / 0.65 = 2.308.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-monetary-system',
      topicIds: ['mon-mod2-rbi-policy'],
      stream: 'economics',
      program: 'mcom',
    },
  },
  {
    id: 'q-mon-mod3-01',
    questionText: 'Which money aggregate is described as "broad money" in India?',
    options: ['M0', 'M1', 'M2', 'M3'],
    correctIndex: 3,
    explanation:
      'M3 = M1 + time deposits with banks + call and term funding from financial institutions. It is the broad money aggregate the RBI monitors and targets.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Tumkur University', year: 2023, marks: 2, semester: 1 },
    prepTags: {
      subjectId: 'mcom-karnataka-monetary-system',
      topicIds: ['mon-mod3-money-supply'],
      stream: 'economics',
      program: 'mcom',
    },
  },
  {
    id: 'q-mon-mod3-02',
    questionText:
      'An initial deposit of Rs 800 crore enters the banking system with a legal reserve ratio of 25%. What is the maximum credit the system can create?',
    options: ['Rs 800 crore', 'Rs 2,400 crore', 'Rs 3,200 crore', 'Rs 1,600 crore'],
    correctIndex: 1,
    explanation:
      'Total deposits = 800 x (1/0.25) = Rs 3,200 crore. Credit created = total deposits - initial deposit = 3,200 - 800 = Rs 2,400 crore.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-monetary-system',
      topicIds: ['mon-mod3-money-supply'],
      stream: 'economics',
      program: 'mcom',
    },
  },
  {
    id: 'q-mon-mod4-01',
    questionText:
      'According to Friedman\u2019s expectations-augmented Phillips curve, the long-run Phillips curve is:',
    options: [
      'Downward sloping with a stable trade-off',
      'Vertical at the natural rate of unemployment',
      'Horizontal at the target inflation rate',
      'Upward sloping under stagflation only',
    ],
    correctIndex: 1,
    explanation:
      'Once inflation expectations adjust, the trade-off disappears and the long-run Phillips curve is vertical at the NAIRU. Only unanticipated inflation can lower unemployment temporarily.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mangalore University', year: 2023, marks: 5, semester: 1 },
    prepTags: {
      subjectId: 'mcom-karnataka-monetary-system',
      topicIds: ['mon-mod4-inflation-targeting'],
      stream: 'economics',
      program: 'mcom',
    },
  },
  {
    id: 'q-mon-mod4-02',
    questionText:
      'A disinflation of 4 percentage points costs the economy 10% of GDP cumulatively. The sacrifice ratio is:',
    options: ['0.4', '2.5', '4.0', '14'],
    correctIndex: 1,
    explanation: 'Sacrifice ratio = cumulative output loss / reduction in inflation = 10 / 4 = 2.5.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-monetary-system',
      topicIds: ['mon-mod4-inflation-targeting'],
      stream: 'economics',
      program: 'mcom',
    },
  },
  {
    id: 'q-mon-mod5-01',
    questionText:
      'Which legislation introduced a time-bound, creditor-in-control insolvency resolution process in India?',
    options: [
      'SARFAESI Act 2002',
      'Insolvency and Bankruptcy Code 2016',
      'Recovery of Debts Due to Banks Act 1993',
      'Companies Act 2013',
    ],
    correctIndex: 1,
    explanation:
      'The IBC 2016 created a 330-day resolution process administered by the NCLT and shifted control from debtor to creditor, fundamentally changing Indian credit discipline.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Kuvempu University', year: 2024, marks: 5, semester: 1 },
    prepTags: {
      subjectId: 'mcom-karnataka-monetary-system',
      topicIds: ['mon-mod5-financial-reforms'],
      stream: 'economics',
      program: 'mcom',
    },
  },
  {
    id: 'q-mon-mod5-02',
    questionText:
      'A bank has gross advances of Rs 6,00,000 crore, gross NPAs of Rs 24,000 crore and provisions of Rs 14,000 crore. Its net NPA ratio is:',
    options: ['4.00%', '1.67%', '2.33%', '3.50%'],
    correctIndex: 1,
    explanation:
      'Net NPA = 24,000 - 14,000 = Rs 10,000 crore. Net NPA ratio = (10,000 / 6,00,000) x 100 = 1.67%.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-monetary-system',
      topicIds: ['mon-mod5-financial-reforms'],
      stream: 'economics',
      program: 'mcom',
    },
  },

  // ── International Business ──
  {
    id: 'q-ib-mod1-01',
    questionText:
      'The Heckscher-Ohlin theorem predicts that a country will export goods that intensively use which factor?',
    options: [
      'The factor in which it is relatively scarce',
      'The factor in which it is relatively abundant',
      'Labour only, in all cases',
      'The factor with the highest wage rate',
    ],
    correctIndex: 1,
    explanation:
      'Heckscher-Ohlin states that a country exports goods that intensively use its relatively abundant factor and imports goods that intensively use its scarce factor, because abundant factors are relatively cheaper.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 5, semester: 2 },
    prepTags: {
      subjectId: 'mcom-karnataka-intl-business',
      topicIds: ['ib-mod1-trade-theories'],
      stream: 'management',
      program: 'mcom',
    },
  },
  {
    id: 'q-ib-mod1-02',
    questionText:
      "Dunning's OLI paradigm explains FDI through which three advantages?",
    options: [
      'Ownership, Location and Internalisation',
      'Output, Labour and Investment',
      'Openness, Leverage and Integration',
      'Opportunity, Liability and Information',
    ],
    correctIndex: 0,
    explanation:
      'The eclectic paradigm requires Ownership advantages (proprietary assets), Location advantages (host-country attractiveness) and Internalisation advantages (benefit of transacting within the firm) all to be present for FDI.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-intl-business',
      topicIds: ['ib-mod1-trade-theories'],
      stream: 'management',
      program: 'mcom',
    },
  },
  {
    id: 'q-ib-mod2-01',
    questionText: 'Remittances received by Indian residents from abroad are recorded in which BOP account?',
    options: [
      'Capital account',
      'Financial account',
      'Current account (secondary income)',
      'Official reserves account',
    ],
    correctIndex: 2,
    explanation:
      'Remittances are unilateral transfers and are recorded in the secondary income component of the current account, alongside trade in goods and services and primary income.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Mysore University (UOM)', year: 2024, marks: 2, semester: 2 },
    prepTags: {
      subjectId: 'mcom-karnataka-intl-business',
      topicIds: ['ib-mod2-bop-fx'],
      stream: 'management',
      program: 'mcom',
    },
  },
  {
    id: 'q-ib-mod2-02',
    questionText:
      'Spot rate is Rs 80/USD. Indian inflation is expected at 8% and US inflation at 3%. Under relative PPP, the expected spot rate in one year is closest to:',
    options: ['Rs 76.29/USD', 'Rs 83.88/USD', 'Rs 80.00/USD', 'Rs 85.00/USD'],
    correctIndex: 1,
    explanation:
      'S1 = 80 x (1.08 / 1.03) = 80 x 1.04854 = Rs 83.88/USD. The rupee depreciates because domestic inflation exceeds US inflation.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-intl-business',
      topicIds: ['ib-mod2-bop-fx'],
      stream: 'management',
      program: 'mcom',
    },
  },
  {
    id: 'q-ib-mod3-01',
    questionText:
      'Which entry mode gives the exporter the greatest control but also the highest capital commitment and risk?',
    options: ['Indirect exporting', 'Licensing', 'Joint venture', 'Wholly owned subsidiary'],
    correctIndex: 3,
    explanation:
      'A wholly owned subsidiary retains full ownership and control of operations, technology and profit, but requires the largest capital outlay and exposes the firm fully to political and commercial risk.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mangalore University', year: 2023, marks: 5, semester: 2 },
    prepTags: {
      subjectId: 'mcom-karnataka-intl-business',
      topicIds: ['ib-mod3-entry-modes'],
      stream: 'management',
      program: 'mcom',
    },
  },
  {
    id: 'q-ib-mod3-02',
    questionText:
      'A firm pursues global efficiency through standardisation while remaining responsive to local markets. Bartlett and Ghoshal classify this as a:',
    options: ['International strategy', 'Multidomestic strategy', 'Global strategy', 'Transnational strategy'],
    correctIndex: 3,
    explanation:
      'The transnational strategy simultaneously pursues high global integration and high local responsiveness — the most demanding posture in the integration-responsiveness framework.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-intl-business',
      topicIds: ['ib-mod3-entry-modes'],
      stream: 'management',
      program: 'mcom',
    },
  },
  {
    id: 'q-ib-mod4-01',
    questionText:
      'What distinguishes a customs union from a free trade area?',
    options: [
      'Removal of all internal tariffs',
      'Adoption of a common external tariff',
      'Free movement of labour and capital',
      'Harmonisation of fiscal and monetary policy',
    ],
    correctIndex: 1,
    explanation:
      'Both remove internal tariffs, but a customs union additionally adopts a common external tariff against non-members. Factor mobility defines a common market, and policy harmonisation an economic union.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Karnatak University (KUD)', year: 2024, marks: 2, semester: 2 },
    prepTags: {
      subjectId: 'mcom-karnataka-intl-business',
      topicIds: ['ib-mod4-wto-integration'],
      stream: 'management',
      program: 'mcom',
    },
  },
  {
    id: 'q-ib-mod4-02',
    questionText:
      'A non-member sells a good at USD 70 with a 20% tariff, while an FTA partner sells the same good tariff-free at USD 85. Joining the FTA results in:',
    options: [
      'Trade creation, welfare increases',
      'Trade diversion, welfare decreases',
      'No change in sourcing',
      'Both trade creation and trade diversion',
    ],
    correctIndex: 1,
    explanation:
      'Landed cost from the non-member is 70 x 1.20 = USD 84; the FTA partner sells at USD 85 but tariff-free. Since 84 < 85, sourcing shifts to the less efficient partner — classic trade diversion that reduces welfare.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-intl-business',
      topicIds: ['ib-mod4-wto-integration'],
      stream: 'management',
      program: 'mcom',
    },
  },
  {
    id: 'q-ib-mod5-01',
    questionText:
      'Under CIF terms, when does the risk of loss pass from seller to buyer?',
    options: [
      'At the port of destination',
      'When the goods are delivered on board the vessel at the port of shipment',
      'When the buyer makes payment',
      'When the bill of lading is endorsed',
    ],
    correctIndex: 1,
    explanation:
      'Under CIF the seller pays cost, insurance and freight to the destination port, but risk transfers at the port of shipment when goods are placed on board. Cost and risk therefore transfer at different points.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bengaluru City University (BCU)', year: 2024, marks: 5, semester: 2 },
    prepTags: {
      subjectId: 'mcom-karnataka-intl-business',
      topicIds: ['ib-mod5-export-docs'],
      stream: 'management',
      program: 'mcom',
    },
  },
  {
    id: 'q-ib-mod5-02',
    questionText:
      'Which payment instrument substitutes the issuing bank\u2019s creditworthiness for that of the buyer?',
    options: ['Open account', 'Documentary collection (D/P)', 'Irrevocable letter of credit', 'Advance payment'],
    correctIndex: 2,
    explanation:
      'An irrevocable letter of credit is an undertaking by the issuing bank to pay against conforming documents, so the exporter relies on the bank rather than the buyer for payment.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-intl-business',
      topicIds: ['ib-mod5-export-docs'],
      stream: 'management',
      program: 'mcom',
    },
  },

  // ── Corporate Tax Planning ──
  {
    id: 'q-tax-mod1-01',
    questionText:
      'Arranging financial affairs within the framework of the law to minimise tax liability is known as:',
    options: ['Tax evasion', 'Tax avoidance', 'Tax planning', 'Tax sheltering'],
    correctIndex: 2,
    explanation:
      'Tax planning uses the deductions, exemptions and incentives the statute deliberately provides. Tax avoidance exploits gaps against legislative intent; tax evasion conceals facts and is illegal.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 2, semester: 2 },
    prepTags: {
      subjectId: 'mcom-karnataka-tax-planning',
      topicIds: ['tax-mod1-planning-vs-avoidance'],
      stream: 'taxation',
      program: 'mcom',
    },
  },
  {
    id: 'q-tax-mod1-02',
    questionText:
      'Under GAAR, an arrangement is an Impermissible Avoidance Arrangement if its main purpose is to obtain a tax benefit and it satisfies at least one of how many statutory tests?',
    options: ['Two', 'Three', 'Four', 'Five'],
    correctIndex: 2,
    explanation:
      'Chapter X-A lists four tests: creating non-arm\u2019s-length rights or obligations, misuse or abuse of law, lack of commercial substance, and means not normally employed for bona fide purposes. Any one suffices.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-tax-planning',
      topicIds: ['tax-mod1-planning-vs-avoidance'],
      stream: 'taxation',
      program: 'mcom',
    },
  },
  {
    id: 'q-tax-mod2-01',
    questionText:
      'The effective tax rate for a domestic company opting into the Section 115BAA concessional regime is approximately:',
    options: ['22.00%', '25.17%', '26.00%', '17.16%'],
    correctIndex: 1,
    explanation:
      'Section 115BAA prescribes 22% plus a 10% surcharge and 4% health and education cess, giving an effective rate of 22 x 1.10 x 1.04 = 25.168%. The 17.16% figure applies to Section 115BAB.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mysore University (UOM)', year: 2024, marks: 5, semester: 2 },
    prepTags: {
      subjectId: 'mcom-karnataka-tax-planning',
      topicIds: ['tax-mod2-rates-mat'],
      stream: 'taxation',
      program: 'mcom',
    },
  },
  {
    id: 'q-tax-mod2-02',
    questionText:
      'A company has book profit of Rs 80 crore and a normal tax liability of Rs 9 crore. The MAT payable at 15% of book profit and the MAT credit generated are:',
    options: ['Rs 12 crore and Rs 3 crore', 'Rs 9 crore and nil', 'Rs 12 crore and Rs 12 crore', 'Rs 12 crore and Rs 9 crore'],
    correctIndex: 0,
    explanation:
      'MAT = 15% x 80 = Rs 12 crore. Since normal liability (Rs 9 crore) is lower, MAT of Rs 12 crore is payable. MAT credit = 12 - 9 = Rs 3 crore, carried forward up to 15 years under Section 115JAA.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-tax-planning',
      topicIds: ['tax-mod2-rates-mat'],
      stream: 'taxation',
      program: 'mcom',
    },
  },
  {
    id: 'q-tax-mod3-01',
    questionText: 'Business loss can be carried forward for how many assessment years?',
    options: ['4 years', '8 years', '10 years', 'Indefinitely'],
    correctIndex: 1,
    explanation:
      'Business loss carries forward for 8 assessment years subject to continuity of business. Unabsorbed depreciation, by contrast, carries forward indefinitely.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Tumkur University', year: 2023, marks: 2, semester: 2 },
    prepTags: {
      subjectId: 'mcom-karnataka-tax-planning',
      topicIds: ['tax-mod3-deductions-setoff'],
      stream: 'taxation',
      program: 'mcom',
    },
  },
  {
    id: 'q-tax-mod3-02',
    questionText:
      'A machine is purchased on 20 March and put to use the same day, in a financial year ending 31 March. The depreciation allowed for that year is:',
    options: ['Full depreciation at the block rate', '50% of the normal depreciation', 'Nil', '75% of the normal depreciation'],
    correctIndex: 1,
    explanation:
      'Where an asset is acquired and put to use for less than 180 days in the previous year, only 50% of the normal depreciation is allowed. Delaying the purchase past the year end would double the first-year claim.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-tax-planning',
      topicIds: ['tax-mod3-deductions-setoff'],
      stream: 'taxation',
      program: 'mcom',
    },
  },
  {
    id: 'q-tax-mod4-01',
    questionText:
      'An asset was acquired for Rs 25 lakh in FY 2009-10 (CII 148) and transferred in FY 2024-25 (CII 363). The indexed cost of acquisition is:',
    options: ['Rs 25.00 lakh', 'Rs 41.39 lakh', 'Rs 61.32 lakh', 'Rs 10.19 lakh'],
    correctIndex: 2,
    explanation:
      'Indexed cost = 25,00,000 x (363 / 148) = 25,00,000 x 2.4527 = Rs 61.32 lakh (approximately).',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mangalore University', year: 2024, marks: 10, semester: 2 },
    prepTags: {
      subjectId: 'mcom-karnataka-tax-planning',
      topicIds: ['tax-mod4-capital-gains'],
      stream: 'taxation',
      program: 'mcom',
    },
  },
  {
    id: 'q-tax-mod4-02',
    questionText:
      'A transfer of assets by a company to its amalgamated company, where the amalgamated company is an Indian company, is:',
    options: [
      'A transfer chargeable to capital gains in full',
      'Not treated as a transfer under Section 47, hence no capital gains',
      'Taxable as business income',
      'Taxable only if the amalgamated company is foreign',
    ],
    correctIndex: 1,
    explanation:
      'Section 47(vi) excludes such amalgamation transfers from the definition of transfer, provided the conditions are met. No capital gain therefore arises at the time of reorganisation.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-tax-planning',
      topicIds: ['tax-mod4-capital-gains'],
      stream: 'taxation',
      program: 'mcom',
    },
  },
  {
    id: 'q-tax-mod5-01',
    questionText:
      'Which transfer pricing method is most commonly applied to Indian IT and business process services exports?',
    options: [
      'Comparable Uncontrolled Price method',
      'Resale Price method',
      'Transactional Net Margin method',
      'Profit Split method',
    ],
    correctIndex: 2,
    explanation:
      'TNMM benchmarks the operating margin of the tested party against comparable companies. Because reliable uncontrolled price comparables rarely exist for customised services, TNMM is the standard choice in India.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Kuvempu University', year: 2023, marks: 5, semester: 2 },
    prepTags: {
      subjectId: 'mcom-karnataka-tax-planning',
      topicIds: ['tax-mod5-transfer-pricing'],
      stream: 'taxation',
      program: 'mcom',
    },
  },
  {
    id: 'q-tax-mod5-02',
    questionText:
      'Foreign income of Rs 200 lakh bears foreign tax of Rs 70 lakh. The Indian tax on that income is Rs 60 lakh. The allowable foreign tax credit is:',
    options: ['Rs 70 lakh', 'Rs 60 lakh', 'Rs 10 lakh', 'Rs 130 lakh'],
    correctIndex: 1,
    explanation:
      'The credit is limited to the lower of foreign tax paid (Rs 70 lakh) and Indian tax on that income (Rs 60 lakh), so Rs 60 lakh is allowable. The excess Rs 10 lakh cannot be carried forward.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-tax-planning',
      topicIds: ['tax-mod5-transfer-pricing'],
      stream: 'taxation',
      program: 'mcom',
    },
  },

  // ── Forensic Accounting & Fraud Analytics ──
  {
    id: 'q-fa-mod1-01',
    questionText:
      "Which element is added by the fraud diamond that is absent from Cressey's original fraud triangle?",
    options: ['Pressure', 'Opportunity', 'Rationalisation', 'Capability'],
    correctIndex: 3,
    explanation:
      'The fraud diamond adds capability — the technical skill, position and confidence needed to execute and conceal the scheme — to the triangle\u2019s pressure, opportunity and rationalisation.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 3 },
    prepTags: {
      subjectId: 'mcom-karnataka-forensic-accounting',
      topicIds: ['fa-mod1-fraud-triangle'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-fa-mod1-02',
    questionText:
      'Which category of occupational fraud is the most frequent but has the lowest median loss per case?',
    options: ['Financial statement fraud', 'Corruption', 'Asset misappropriation', 'Tax fraud'],
    correctIndex: 2,
    explanation:
      'Asset misappropriation accounts for the great majority of cases but the smallest median loss. Financial statement fraud is the least common yet the most costly per case.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-forensic-accounting',
      topicIds: ['fa-mod1-fraud-triangle'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-fa-mod2-01',
    questionText:
      'Under the Beneish M-Score model, a computed value greater than -1.78 indicates:',
    options: [
      'The company is unlikely to have manipulated earnings',
      'The company is flagged as a likely earnings manipulator',
      'The company is insolvent',
      'The audit opinion should be qualified',
    ],
    correctIndex: 1,
    explanation:
      'The M-Score threshold is -1.78. Values above it indicate a statistically elevated probability of earnings manipulation and justify forensic examination of the financial statements.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Mysore University (UOM)', year: 2024, marks: 5, semester: 3 },
    prepTags: {
      subjectId: 'mcom-karnataka-forensic-accounting',
      topicIds: ['fa-mod2-financial-statement-fraud'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-fa-mod2-02',
    questionText:
      'In the M-Score, which variable carries the largest positive coefficient and is therefore the strongest single indicator of manipulation?',
    options: ['Sales Growth Index (SGI)', 'Gross Margin Index (GMI)', 'Total Accruals to Total Assets (TATA)', 'Depreciation Index (DEPI)'],
    correctIndex: 2,
    explanation:
      'TATA carries a coefficient of 4.679, far larger than any other variable. Persistently high accruals relative to assets, especially with weak operating cash flow, is the classic earnings management signal.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-forensic-accounting',
      topicIds: ['fa-mod2-financial-statement-fraud'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-fa-mod3-01',
    questionText:
      'Cash theft occurring BEFORE the receipt is recorded in the accounting system is termed:',
    options: ['Larceny', 'Skimming', 'Lapping', 'Kiting'],
    correctIndex: 1,
    explanation:
      'Skimming is an off-book scheme: the cash never enters the records, so no documentary trail exists. Larceny is theft of cash already recorded, which requires subsequent concealment.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mangalore University', year: 2023, marks: 5, semester: 3 },
    prepTags: {
      subjectId: 'mcom-karnataka-forensic-accounting',
      topicIds: ['fa-mod3-asset-misappropriation'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-fa-mod3-02',
    questionText:
      'Book inventory is Rs 5,00,00,000 and physical count is Rs 4,85,00,000. The shrinkage rate is:',
    options: ['1.5%', '3.0%', '5.0%', '15.0%'],
    correctIndex: 1,
    explanation:
      'Shrinkage = (15,00,000 / 5,00,00,000) x 100 = 3.0%. A rate well above the typical retail norm of 1-2% warrants investigation into theft, unrecorded waste or recording errors.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-forensic-accounting',
      topicIds: ['fa-mod3-asset-misappropriation'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-fa-mod4-01',
    questionText:
      "According to Benford's Law, the expected frequency of the leading digit 5 in naturally occurring data is approximately:",
    options: ['12.5%', '9.7%', '7.9%', '5.8%'],
    correctIndex: 2,
    explanation:
      "P(d) = log10(1 + 1/d). For d = 5, P = log10(1.2) = 0.0792, or 7.9%. The frequency falls monotonically from 30.1% for the digit 1.",
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Bengaluru City University (BCU)', year: 2024, marks: 5, semester: 3 },
    prepTags: {
      subjectId: 'mcom-karnataka-forensic-accounting',
      topicIds: ['fa-mod4-digital-forensics'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-fa-mod4-02',
    questionText:
      'For electronic records to be admissible as evidence in Indian courts, a certificate is required under which provision?',
    options: [
      'Section 63 of the Evidence Act',
      'Section 65B of the Indian Evidence Act',
      'Section 43A of the IT Act',
      'Section 143(12) of the Companies Act',
    ],
    correctIndex: 1,
    explanation:
      'Section 65B of the Indian Evidence Act requires a certificate identifying the device, confirming its regular use and the integrity of the data, for electronic records to be admissible.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-forensic-accounting',
      topicIds: ['fa-mod4-digital-forensics'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-fa-mod5-01',
    questionText:
      'The Serious Fraud Investigation Office was constituted under which section of the Companies Act 2013?',
    options: ['Section 206', 'Section 210', 'Section 211', 'Section 447'],
    correctIndex: 2,
    explanation:
      'Section 211 established the SFIO as a multi-disciplinary organisation to investigate frauds having public interest implications. Sections 206 to 210 deal with the power to order investigations.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Karnatak University (KUD)', year: 2024, marks: 2, semester: 3 },
    prepTags: {
      subjectId: 'mcom-karnataka-forensic-accounting',
      topicIds: ['fa-mod5-legal-framework'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-fa-mod5-02',
    questionText:
      'Transferring illicit funds through multiple overseas shell entities to obscure their origin represents which stage of money laundering?',
    options: ['Placement', 'Layering', 'Integration', 'Structuring'],
    correctIndex: 1,
    explanation:
      'Layering involves complex, often cross-border transactions designed to sever the link between the funds and their criminal source. Integration follows, returning the funds in apparently legitimate form.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-forensic-accounting',
      topicIds: ['fa-mod5-legal-framework'],
      stream: 'commerce',
      program: 'mcom',
    },
  },

  // ── Financial Derivatives & Risk Management ──
  {
    id: 'q-drv-mod1-01',
    questionText:
      'Spot price of a stock is Rs 500, the risk-free rate is 9% p.a. and there are no dividends. The theoretical three-month futures price is:',
    options: ['Rs 500.00', 'Rs 511.25', 'Rs 545.00', 'Rs 488.75'],
    correctIndex: 1,
    explanation:
      'F = 500 x [1 + (0.09 - 0) x 0.25] = 500 x 1.0225 = Rs 511.25. Futures trade above spot, a contango market, because of the positive cost of carry.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 10, semester: 3 },
    prepTags: {
      subjectId: 'mcom-karnataka-derivatives',
      topicIds: ['drv-mod1-futures-pricing'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-drv-mod1-02',
    questionText:
      'A market in which the futures price is BELOW the spot price is said to be in:',
    options: ['Contango', 'Backwardation', 'Arbitrage equilibrium', 'Basis convergence'],
    correctIndex: 1,
    explanation:
      'Backwardation occurs when futures trade below spot, typically because of a high convenience yield or scarce near-term supply. Contango is the opposite condition.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-derivatives',
      topicIds: ['drv-mod1-futures-pricing'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-drv-mod2-01',
    questionText:
      'An investor buys a put option with strike Rs 300 at a premium of Rs 15. At expiry the underlying is Rs 270. The profit per share is:',
    options: ['Rs 15', 'Rs 30', 'Rs 45', 'Rs 0'],
    correctIndex: 0,
    explanation: 'Payoff = max(300 - 270, 0) = Rs 30. Profit = 30 - 15 = Rs 15 per share.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 5, semester: 3 },
    prepTags: {
      subjectId: 'mcom-karnataka-derivatives',
      topicIds: ['drv-mod2-options-payoffs'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-drv-mod2-02',
    questionText:
      'Buying a call and a put on the same underlying with the same strike and expiry, expecting large price movement in either direction, is a:',
    options: ['Covered call', 'Bull spread', 'Long straddle', 'Protective put'],
    correctIndex: 2,
    explanation:
      'A long straddle profits from volatility regardless of direction, but loses the combined premium if the underlying stays near the strike through expiry.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-derivatives',
      topicIds: ['drv-mod2-options-payoffs'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-drv-mod3-01',
    questionText:
      'In a one-period binomial model with u = 1.25, d = 0.80 and a risk-free rate of 5%, the risk-neutral probability of an up move is:',
    options: ['0.444', '0.556', '0.625', '0.375'],
    correctIndex: 1,
    explanation: 'p = (1 + r - d) / (u - d) = (1.05 - 0.80) / (1.25 - 0.80) = 0.25 / 0.45 = 0.5556.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Mangalore University', year: 2024, marks: 10, semester: 3 },
    prepTags: {
      subjectId: 'mcom-karnataka-derivatives',
      topicIds: ['drv-mod3-bsm-valuation'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-drv-mod3-02',
    questionText: 'In the Black-Scholes-Merton model, N(d2) represents:',
    options: [
      'The option delta',
      'The risk-neutral probability that the option expires in the money',
      'The volatility of the underlying',
      'The present value of the strike price',
    ],
    correctIndex: 1,
    explanation:
      'N(d2) is the risk-neutral probability of exercise, while N(d1) is the delta — the number of shares required to hedge one option.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-derivatives',
      topicIds: ['drv-mod3-bsm-valuation'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-drv-mod4-01',
    questionText:
      'Firm A can borrow at 7% fixed or MIBOR + 0.25%. Firm B can borrow at 9% fixed or MIBOR + 0.90%. The quality spread differential is:',
    options: ['0.65%', '1.35%', '2.00%', '2.65%'],
    correctIndex: 1,
    explanation:
      'Fixed spread = 9 - 7 = 2.00%. Floating spread = 0.90 - 0.25 = 0.65%. QSD = 2.00 - 0.65 = 1.35%, the total annual gain available to be shared between the parties.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Kuvempu University', year: 2024, marks: 10, semester: 3 },
    prepTags: {
      subjectId: 'mcom-karnataka-derivatives',
      topicIds: ['drv-mod4-swaps'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-drv-mod4-02',
    questionText:
      'In a plain vanilla interest rate swap, the notional principal is:',
    options: [
      'Exchanged at the start and returned at maturity',
      'Exchanged only at maturity',
      'Never exchanged — it is used only to compute interest payments',
      'Exchanged periodically along with interest',
    ],
    correctIndex: 2,
    explanation:
      'The notional principal is a reference amount used to calculate the exchanged interest flows; only the net interest differential is settled. Currency swaps, by contrast, do exchange principal.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-derivatives',
      topicIds: ['drv-mod4-swaps'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-drv-mod5-01',
    questionText:
      'The process by which a clearing corporation becomes the buyer to every seller and the seller to every buyer is called:',
    options: ['Netting', 'Novation', 'Margining', 'Settlement'],
    correctIndex: 1,
    explanation:
      'Novation substitutes the CCP as counterparty to both sides of the trade, mutualising counterparty risk across the member base and backing it with the default waterfall.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Tumkur University', year: 2023, marks: 2, semester: 3 },
    prepTags: {
      subjectId: 'mcom-karnataka-derivatives',
      topicIds: ['drv-mod5-regulation'],
      stream: 'finance',
      program: 'mcom',
    },
  },
  {
    id: 'q-drv-mod5-02',
    questionText:
      'A portfolio of Rs 100 crore has daily volatility of 2%. The one-day 99% Value at Risk (z = 2.33) is:',
    options: ['Rs 2.00 crore', 'Rs 4.66 crore', 'Rs 2.33 crore', 'Rs 6.99 crore'],
    correctIndex: 1,
    explanation:
      'VaR = 100 crore x 2.33 x 0.02 = Rs 4.66 crore. There is a 1% probability that the daily loss exceeds this amount, though VaR says nothing about losses beyond it.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-derivatives',
      topicIds: ['drv-mod5-regulation'],
      stream: 'finance',
      program: 'mcom',
    },
  },

  // ── Advanced Cost & Management Accounting ──
  {
    id: 'q-acm-mod1-01',
    questionText:
      'A quality inspection cost pool of Rs 3,00,000 covers 150 inspections. Product X required 40 inspections. The inspection cost assigned to Product X is:',
    options: ['Rs 20,000', 'Rs 80,000', 'Rs 1,20,000', 'Rs 45,00,000'],
    correctIndex: 1,
    explanation:
      'Activity rate = 3,00,000 / 150 = Rs 2,000 per inspection. Assigned cost = 40 x 2,000 = Rs 80,000.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 10, semester: 4 },
    prepTags: {
      subjectId: 'mcom-karnataka-adv-cost-accounting',
      topicIds: ['acm-mod1-abc'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-acm-mod1-02',
    questionText:
      'Machine set-up costs incurred once for each production run are classified as which level of activity?',
    options: ['Unit-level', 'Batch-level', 'Product-level', 'Facility-level'],
    correctIndex: 1,
    explanation:
      'Set-up is triggered by each batch rather than each unit, so it is a batch-level activity. Product-level costs support an entire product line; facility-level costs are independent of output.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-adv-cost-accounting',
      topicIds: ['acm-mod1-abc'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-acm-mod2-01',
    questionText:
      'Standard: 5 kg at Rs 8 per unit for 2,000 units. Actual: 10,500 kg at Rs 9. The material price variance is:',
    options: ['Rs 10,500 Adverse', 'Rs 5,000 Adverse', 'Rs 10,500 Favourable', 'Rs 20,000 Adverse'],
    correctIndex: 0,
    explanation:
      'MPV = Actual Quantity x (Standard Price - Actual Price) = 10,500 x (8 - 9) = Rs 10,500 Adverse. Price variances always use actual quantity.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mysore University (UOM)', year: 2024, marks: 10, semester: 4 },
    prepTags: {
      subjectId: 'mcom-karnataka-adv-cost-accounting',
      topicIds: ['acm-mod2-standard-costing'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-acm-mod2-02',
    questionText:
      'A favourable material price variance accompanied by an adverse material usage variance most likely indicates:',
    options: [
      'Improved production efficiency',
      'Purchase of lower-quality material at a lower price',
      'An increase in selling price',
      'Under-absorption of fixed overheads',
    ],
    correctIndex: 1,
    explanation:
      'Cheaper, lower-quality material reduces the price variance but increases waste, rework and spoilage, producing an adverse usage variance. Variances must never be read in isolation.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-adv-cost-accounting',
      topicIds: ['acm-mod2-standard-costing'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-acm-mod3-01',
    questionText:
      'When the selling division has spare capacity, the opportunity cost component of the optimal transfer price is:',
    options: ['Equal to the market price', 'Equal to the marginal cost', 'Zero', 'Equal to the full absorption cost'],
    correctIndex: 2,
    explanation:
      'With spare capacity no external contribution is forgone by transferring internally, so opportunity cost is zero and the optimal transfer price equals the selling division\u2019s marginal cost.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mangalore University', year: 2023, marks: 5, semester: 4 },
    prepTags: {
      subjectId: 'mcom-karnataka-adv-cost-accounting',
      topicIds: ['acm-mod3-transfer-pricing'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-acm-mod3-02',
    questionText:
      'A division with an ROI of 24% evaluates a project earning 18% when the company\u2019s cost of capital is 12%. Under ROI-based evaluation the division will:',
    options: [
      'Accept, because the project exceeds the cost of capital',
      'Reject, because the project would dilute its own ROI',
      'Be indifferent between the two measures',
      'Accept only if residual income is negative',
    ],
    correctIndex: 1,
    explanation:
      'This is the classic ROI dysfunction: the project adds value for the company (18% > 12%) but lowers the division\u2019s ROI, so a divisional manager rewarded on ROI rejects it. Residual income avoids the distortion.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-adv-cost-accounting',
      topicIds: ['acm-mod3-transfer-pricing'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-acm-mod4-01',
    questionText:
      'Selling price Rs 80, variable cost Rs 50, fixed cost Rs 9,00,000. The break-even point in units is:',
    options: ['11,250 units', '18,000 units', '30,000 units', '25,714 units'],
    correctIndex: 2,
    explanation: 'Contribution per unit = 80 - 50 = Rs 30. BEP = 9,00,000 / 30 = 30,000 units.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Karnatak University (KUD)', year: 2024, marks: 10, semester: 4 },
    prepTags: {
      subjectId: 'mcom-karnataka-adv-cost-accounting',
      topicIds: ['acm-mod4-cvp-decisions'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-acm-mod4-02',
    questionText:
      'When a limiting factor exists, products should be prioritised by:',
    options: [
      'Contribution per unit',
      'Profit per unit',
      'Contribution per unit of the limiting factor',
      'P/V ratio',
    ],
    correctIndex: 2,
    explanation:
      'Under scarcity the objective is to maximise total contribution, which requires ranking by contribution per unit of the scarce resource rather than by contribution or margin percentage.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-adv-cost-accounting',
      topicIds: ['acm-mod4-cvp-decisions'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-acm-mod5-01',
    questionText:
      'Expected selling price Rs 400, desired profit 25% of selling price, currently achievable cost Rs 320. The target cost gap is:',
    options: ['Rs 20', 'Rs 80', 'Rs 100', 'Nil'],
    correctIndex: 0,
    explanation:
      'Desired profit = 25% x 400 = Rs 100. Target cost = 400 - 100 = Rs 300. Gap = 320 - 300 = Rs 20 per unit, which must be engineered out through value engineering before launch.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Bengaluru City University (BCU)', year: 2024, marks: 10, semester: 4 },
    prepTags: {
      subjectId: 'mcom-karnataka-adv-cost-accounting',
      topicIds: ['acm-mod5-modern-techniques'],
      stream: 'commerce',
      program: 'mcom',
    },
  },
  {
    id: 'q-acm-mod5-02',
    questionText:
      'Which balanced scorecard perspective captures employee capability, systems and organisational culture?',
    options: ['Financial', 'Customer', 'Internal business process', 'Learning and growth'],
    correctIndex: 3,
    explanation:
      'The learning and growth perspective measures the intangible assets — people, information systems and organisational climate — that drive the internal process, customer and financial perspectives.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-adv-cost-accounting',
      topicIds: ['acm-mod5-modern-techniques'],
      stream: 'commerce',
      program: 'mcom',
    },
  },

  // ── Research Methodology & Statistical Analysis ──
  {
    id: 'q-rm-mod1-01',
    questionText:
      'Which research design is the only one that supports causal inference?',
    options: ['Exploratory', 'Descriptive', 'Causal (experimental)', 'Cross-sectional survey'],
    correctIndex: 2,
    explanation:
      'Only experimental designs manipulate the independent variable while controlling extraneous variables, which is necessary to establish cause and effect rather than mere association.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 2, semester: 4 },
    prepTags: {
      subjectId: 'mcom-karnataka-research-methodology',
      topicIds: ['rm-mod1-research-design'],
      stream: 'statistics',
      program: 'mcom',
    },
  },
  {
    id: 'q-rm-mod1-02',
    questionText:
      'Rejecting a true null hypothesis constitutes which type of error?',
    options: ['Type I error', 'Type II error', 'Sampling error', 'Measurement error'],
    correctIndex: 0,
    explanation:
      'A Type I error (alpha) is a false positive — rejecting a null hypothesis that is actually true. A Type II error (beta) is failing to reject a false null.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-research-methodology',
      topicIds: ['rm-mod1-research-design'],
      stream: 'statistics',
      program: 'mcom',
    },
  },
  {
    id: 'q-rm-mod2-01',
    questionText:
      'A researcher wishes to estimate a proportion with 99% confidence (z = 2.58) and a margin of error of 4%, assuming maximum variability. The required sample size is approximately:',
    options: ['385', '601', '1,040', '2,401'],
    correctIndex: 2,
    explanation:
      'n = (2.58^2 x 0.25) / 0.04^2 = (6.6564 x 0.25) / 0.0016 = 1.6641 / 0.0016 = 1,040.06, rounded up to 1,041 — approximately 1,040.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mysore University (UOM)', year: 2024, marks: 10, semester: 4 },
    prepTags: {
      subjectId: 'mcom-karnataka-research-methodology',
      topicIds: ['rm-mod2-sampling'],
      stream: 'statistics',
      program: 'mcom',
    },
  },
  {
    id: 'q-rm-mod2-02',
    questionText:
      'Which measurement scale permits calculation of a meaningful mean and full arithmetic ratios?',
    options: ['Nominal', 'Ordinal', 'Interval', 'Ratio'],
    correctIndex: 3,
    explanation:
      'Only the ratio scale has a true zero, making statements such as "twice as much" meaningful. Interval scales permit means but not ratios, since zero is arbitrary.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-research-methodology',
      topicIds: ['rm-mod2-sampling'],
      stream: 'statistics',
      program: 'mcom',
    },
  },
  {
    id: 'q-rm-mod3-01',
    questionText:
      'A significant p-value in the Shapiro-Wilk test indicates that:',
    options: [
      'The data are normally distributed',
      'The normality assumption is violated',
      'The sample size is too small',
      'The variables are correlated',
    ],
    correctIndex: 1,
    explanation:
      'The null hypothesis in the Shapiro-Wilk test is normality. A significant result rejects that null, meaning the distribution departs significantly from normal and parametric assumptions are in doubt.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mangalore University', year: 2023, marks: 5, semester: 4 },
    prepTags: {
      subjectId: 'mcom-karnataka-research-methodology',
      topicIds: ['rm-mod3-spss-descriptives'],
      stream: 'statistics',
      program: 'mcom',
    },
  },
  {
    id: 'q-rm-mod3-02',
    questionText:
      'A widely accepted minimum threshold for Cronbach\u2019s alpha indicating acceptable internal consistency is:',
    options: ['0.50', '0.60', '0.70', '0.95'],
    correctIndex: 2,
    explanation:
      'Cronbach\u2019s alpha of 0.70 or above is the conventional threshold for acceptable reliability; 0.80 and above is good, while values above 0.95 may suggest item redundancy.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-research-methodology',
      topicIds: ['rm-mod3-spss-descriptives'],
      stream: 'statistics',
      program: 'mcom',
    },
  },
  {
    id: 'q-rm-mod4-01',
    questionText:
      'To compare the mean satisfaction scores of three or more independent groups, the appropriate test is:',
    options: ['Paired t-test', 'Independent samples t-test', 'One-way ANOVA', 'Chi-square test'],
    correctIndex: 2,
    explanation:
      'One-way ANOVA tests equality of means across three or more independent groups using the F statistic. A t-test handles only two groups, and post hoc tests are then needed to locate the differences.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Kuvempu University', year: 2024, marks: 5, semester: 4 },
    prepTags: {
      subjectId: 'mcom-karnataka-research-methodology',
      topicIds: ['rm-mod4-hypothesis-testing'],
      stream: 'statistics',
      program: 'mcom',
    },
  },
  {
    id: 'q-rm-mod4-02',
    questionText:
      'In a chi-square test of independence, a cell has observed frequency 56 and expected frequency 40. Its contribution to the test statistic is:',
    options: ['6.40', '16.00', '4.00', '2.56'],
    correctIndex: 0,
    explanation: 'Contribution = (O - E)^2 / E = (56 - 40)^2 / 40 = 256 / 40 = 6.40.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-research-methodology',
      topicIds: ['rm-mod4-hypothesis-testing'],
      stream: 'statistics',
      program: 'mcom',
    },
  },
  {
    id: 'q-rm-mod5-01',
    questionText:
      'A Variance Inflation Factor above 10 in a multiple regression indicates:',
    options: [
      'Strong heteroscedasticity',
      'Severe multicollinearity among predictors',
      'Autocorrelation of residuals',
      'Violation of normality',
    ],
    correctIndex: 1,
    explanation:
      'VIF measures how much the variance of a coefficient is inflated by correlation with other predictors. Values above 10 signal serious multicollinearity that destabilises coefficient estimates.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Bengaluru City University (BCU)', year: 2024, marks: 5, semester: 4 },
    prepTags: {
      subjectId: 'mcom-karnataka-research-methodology',
      topicIds: ['rm-mod5-regression-factor'],
      stream: 'statistics',
      program: 'mcom',
    },
  },
  {
    id: 'q-rm-mod5-02',
    questionText:
      'Before performing factor analysis, the KMO measure of sampling adequacy should ideally exceed:',
    options: ['0.30', '0.50', '0.60', '0.90'],
    correctIndex: 2,
    explanation:
      'KMO above 0.60 is the minimum acceptable, 0.80 is meritorious. It must be read with a significant Bartlett\u2019s test of sphericity, which confirms the correlation matrix is not an identity matrix.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: {
      subjectId: 'mcom-karnataka-research-methodology',
      topicIds: ['rm-mod5-regression-factor'],
      stream: 'statistics',
      program: 'mcom',
    },
  },
]
