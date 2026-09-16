// functions/src/data/bbaSeedData.ts
//
// Complete BBA Curriculum (1st Year to Final Year — Karnataka Region)
// Aligned with Karnataka State Higher Education Council (KSHEC) NEP 2020 / CBCS Model Curriculum
// Adopted by Bangalore University (BU), Bengaluru City University (BCU), Bengaluru North University (BNU),
// Mysore University (UOM), VTU, Mangalore University, Karnatak University Dharwad (KUD), Tumkur & Kuvempu Universities.
//
// Structure:
// 20 Core Subjects across Semesters 1 through 6
// Subject > Modules / Topics > Granular Subtopics

import { PrepSubject, PrepTopic, UniversalQuestion } from '../prepShared'

export const BBA_SUBJECTS: PrepSubject[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // YEAR 1: SEMESTER 1 & 2 (FOUNDATIONS & ESSENTIAL QUANTITATIVE SKILLS)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'bba-karnataka-mpa',
    name: 'Management Principles & Applications',
    stream: 'management',
    programs: ['bba'],
    yearGroup: '1st-year',
    semester: 1,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-1 / BU, BCU, BNU, UOM, VTU',
    icon: 'Briefcase',
    order: 1,
    topicCount: 5,
    status: 'published',
    description: 'Evolution of management thought, Fayol principles, Taylor scientific management, planning, MBO, organizing structures, leadership, and control techniques.',
  },
  {
    id: 'bba-karnataka-accounting',
    name: 'Fundamentals of Business Accounting',
    stream: 'commerce',
    programs: ['bba', 'bcom'],
    yearGroup: '1st-year',
    semester: 1,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-1 / BU, BCU, BNU, UOM, VTU',
    icon: 'BookOpen',
    order: 2,
    topicCount: 5,
    status: 'published',
    description: 'Accounting concepts, double-entry mechanics, trial balance, final accounts with adjustments, depreciation accounting (SLM/WDV), and consignment accounts.',
  },
  {
    id: 'bba-karnataka-marketing',
    name: 'Principles of Marketing',
    stream: 'management',
    programs: ['bba', 'mba'],
    yearGroup: '1st-year',
    semester: 1,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-1 / BU, BCU, BNU, UOM, VTU',
    icon: 'Megaphone',
    order: 3,
    topicCount: 5,
    status: 'published',
    description: 'Marketing concepts, STP framework (segmentation, targeting, positioning), product life cycle (PLC), pricing methods, and distribution/promotion channels.',
  },
  {
    id: 'bba-karnataka-ob',
    name: 'Organizational Behaviour',
    stream: 'management',
    programs: ['bba', 'mba'],
    yearGroup: '1st-year',
    semester: 2,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-2 / BU, BCU, BNU, UOM, VTU',
    icon: 'Users',
    order: 4,
    topicCount: 5,
    status: 'published',
    description: 'Individual behaviour, perception, Big Five personality, motivation models (Maslow, Herzberg, Vroom), team dynamics, conflict management, and organizational culture.',
  },
  {
    id: 'bba-karnataka-math',
    name: 'Business Mathematics & Quantitative Techniques',
    stream: 'aptitude',
    programs: ['bba'],
    yearGroup: '1st-year',
    semester: 2,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-2 / BU, BCU, BNU, UOM, VTU',
    icon: 'Calculator',
    order: 5,
    topicCount: 5,
    status: 'published',
    description: 'Commercial arithmetic, interest compounding, annuities, matrices and determinants, differential calculus optimization, and linear programming (LPP).',
  },
  {
    id: 'bba-karnataka-economics',
    name: 'Managerial Economics',
    stream: 'economics',
    programs: ['bba', 'bcom'],
    yearGroup: '1st-year',
    semester: 2,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-2 / BU, BCU, BNU, UOM, VTU',
    icon: 'TrendingUp',
    order: 6,
    topicCount: 5,
    status: 'published',
    description: 'Demand analysis, elasticity of demand, production functions, returns to scale, short/long-run cost curves, market structures, and managerial pricing.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // YEAR 2: SEMESTER 3 & 4 (CORE FUNCTIONAL & REGULATORY RIGOUR)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'bba-karnataka-cost-accounting',
    name: 'Cost Accounting',
    stream: 'commerce',
    programs: ['bba', 'bcom'],
    yearGroup: '2nd-year',
    semester: 3,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-3 / BU, BCU, BNU, UOM, VTU',
    icon: 'PieChart',
    order: 7,
    topicCount: 5,
    status: 'published',
    description: 'Cost sheets, material cost control (EOQ, stock levels, pricing issues), labour cost and incentive schemes (Halsey, Rowan), overhead allocation (MHR), and cost reconciliation.',
  },
  {
    id: 'bba-karnataka-statistics',
    name: 'Business Statistics',
    stream: 'aptitude',
    programs: ['bba'],
    yearGroup: '2nd-year',
    semester: 3,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-3 / BU, BCU, BNU, UOM, VTU',
    icon: 'BarChart2',
    order: 8,
    topicCount: 5,
    status: 'published',
    description: 'Measures of central tendency, dispersion, standard deviation, Karl Pearson correlation, Spearman rank, regression equations, and time series trend projection.',
  },
  {
    id: 'bba-karnataka-fin-markets',
    name: 'Financial Markets & Services',
    stream: 'finance',
    programs: ['bba', 'bcom', 'mba'],
    yearGroup: '2nd-year',
    semester: 3,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-3 / BU, BCU, BNU, UOM, VTU',
    icon: 'DollarSign',
    order: 9,
    topicCount: 5,
    status: 'published',
    description: 'Indian financial system, RBI monetary tools, money market instruments (T-Bills, CPs, CDs), primary market IPOs, secondary stock exchange trading, mutual funds, and venture capital.',
  },
  {
    id: 'bba-karnataka-business-law',
    name: 'Business Law & Commercial Regulations',
    stream: 'law',
    programs: ['bba', 'bcom'],
    yearGroup: '2nd-year',
    semester: 4,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-4 / BU, BCU, BNU, UOM, VTU',
    icon: 'Scale',
    order: 10,
    topicCount: 5,
    status: 'published',
    description: 'Indian Contract Act 1872 essentials, consideration, free consent, breach remedies, indemnity & guarantee, bailment & pledge, Sale of Goods Act, and Consumer Protection Act 2019.',
  },
  {
    id: 'bba-karnataka-fin-mgmt',
    name: 'Corporate Financial Management',
    stream: 'finance',
    programs: ['bba', 'bcom', 'mba'],
    yearGroup: '2nd-year',
    semester: 4,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-4 / BU, BCU, BNU, UOM, VTU',
    icon: 'TrendingUp',
    order: 11,
    topicCount: 5,
    status: 'published',
    description: 'Time value of money, specific & weighted average cost of capital (WACC), capital budgeting (NPV, IRR, PI), capital structure theories, leverage analysis, and working capital cycles.',
  },
  {
    id: 'bba-karnataka-hrm',
    name: 'Human Resource Management',
    stream: 'management',
    programs: ['bba', 'mba'],
    yearGroup: '2nd-year',
    semester: 4,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-4 / BU, BCU, BNU, UOM, VTU',
    icon: 'Users',
    order: 12,
    topicCount: 5,
    status: 'published',
    description: 'Strategic HRM, human resource planning, job analysis (JD/JS), recruitment & selection pipelines, training evaluation (Kirkpatrick), 360-degree appraisal, and industrial disputes resolution.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // YEAR 3: SEMESTER 5 & 6 (STRATEGIC DECISIONS, TAXATION & CAPSTONES)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'bba-karnataka-mgmt-accounting',
    name: 'Management Accounting',
    stream: 'commerce',
    programs: ['bba', 'bcom'],
    yearGroup: 'final-year',
    semester: 5,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-5 / BU, BCU, BNU, UOM, VTU',
    icon: 'PieChart',
    order: 13,
    topicCount: 5,
    status: 'published',
    description: 'Financial statement ratio analysis, cash flow statement (AS-3 direct/indirect), marginal costing, break-even point decision models, and cash/flexible budgeting.',
  },
  {
    id: 'bba-karnataka-income-tax-1',
    name: 'Income Tax - I (Direct Taxation)',
    stream: 'taxation',
    programs: ['bba', 'bcom'],
    yearGroup: 'final-year',
    semester: 5,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-5 / BU, BCU, BNU, UOM, VTU',
    icon: 'Receipt',
    order: 14,
    topicCount: 5,
    status: 'published',
    description: 'Income Tax Act 1961 fundamentals, residential status & tax incidence, exempted incomes (Sec 10), income from salaries (HRA, perquisites, deductions u/s 16), and income from house property.',
  },
  {
    id: 'bba-karnataka-operations-mgmt',
    name: 'Production & Operations Management',
    stream: 'operations',
    programs: ['bba', 'mba'],
    yearGroup: 'final-year',
    semester: 5,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-5 / BU, BCU, BNU, UOM, VTU',
    icon: 'Truck',
    order: 15,
    topicCount: 5,
    status: 'published',
    description: 'Production systems, facility location & plant layout types, line balancing, inventory control (EOQ, ABC, VED, JIT), Total Quality Management (TQM), Six Sigma, and work study.',
  },
  {
    id: 'bba-karnataka-strategic-mgmt',
    name: 'Strategic Management & Business Policy',
    stream: 'strategy',
    programs: ['bba', 'mba'],
    yearGroup: 'final-year',
    semester: 6,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-6 / BU, BCU, BNU, UOM, VTU',
    icon: 'Target',
    order: 16,
    topicCount: 5,
    status: 'published',
    description: 'Strategic management process, strategic intent, external PESTLE & Porter five forces, internal value chain, generic strategies, portfolio BCG/GE matrices, and McKinsey 7S framework.',
  },
  {
    id: 'bba-karnataka-gst',
    name: 'Goods and Services Tax (GST) & Customs Duty',
    stream: 'taxation',
    programs: ['bba', 'bcom'],
    yearGroup: 'final-year',
    semester: 6,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-6 / BU, BCU, BNU, UOM, VTU',
    icon: 'Receipt',
    order: 17,
    topicCount: 5,
    status: 'published',
    description: '101st Constitutional Amendment, dual GST model (CGST, SGST, IGST), concept of supply, reverse charge (RCM), input tax credit (ITC) conditions, e-way bills, returns, and customs valuation.',
  },
  {
    id: 'bba-karnataka-entrepreneurship',
    name: 'Entrepreneurship Development & Venture Creation',
    stream: 'management',
    programs: ['bba', 'mba'],
    yearGroup: 'final-year',
    semester: 6,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-6 / BU, BCU, BNU, UOM, VTU',
    icon: 'Zap',
    order: 18,
    topicCount: 5,
    status: 'published',
    description: 'Entrepreneurial traits, ideation techniques, Business Model Canvas (BMC), detailed project feasibility reports, startup financing (Angel, VC, Karnataka ELEVATE), and MSME institutional support (KSSIDC, TECSOK).',
  },
  {
    id: 'bba-karnataka-company-law',
    name: 'Company Law & Secretarial Practice',
    stream: 'law',
    programs: ['bba', 'bcom'],
    yearGroup: 'final-year',
    semester: 6,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-6 / BU, BCU, BNU, UOM, VTU',
    icon: 'Scale',
    order: 19,
    topicCount: 5,
    status: 'published',
    description: 'Companies Act 2013, corporate personality & veil piercing, incorporation under SPICe+, MOA & AOA clauses, doctrine of ultra vires, share capital, directors duties, CSR u/s 135, and AGM/EGM meetings.',
  },
  {
    id: 'bba-karnataka-income-tax-2',
    name: 'Income Tax - II (Profits, Capital Gains & Deductions)',
    stream: 'taxation',
    programs: ['bba', 'bcom'],
    yearGroup: 'final-year',
    semester: 6,
    universityRegion: 'karnataka',
    syllabusRef: 'KSHEC NEP BBA Sem-6 / BU, BCU, BNU, UOM, VTU',
    icon: 'Receipt',
    order: 20,
    topicCount: 5,
    status: 'published',
    description: 'Profits and Gains of Business/Profession (PGBP), capital gains (STCG/LTCG, Sec 54 exemptions), income from other sources, Chapter VI-A deductions (80C, 80D, 80G), and total taxable income assessment.',
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// TOPICS CATALOG WITH GRANULAR SUBTOPICS & COMPLETE STUDY MATERIAL
// ══════════════════════════════════════════════════════════════════════════════
export const SEEDED_BBA_TOPICS: Record<string, PrepTopic[]> = {
  // ── 1. Management Principles & Applications (Sem 1) ──
  'bba-karnataka-mpa': [
    {
      id: 'mpa-mod1-fayol-taylor',
      subjectId: 'bba-karnataka-mpa',
      title: 'Evolution of Management Thought: Fayol & Taylor',
      moduleNumber: 1,
      moduleName: 'Module 1: Introduction to Management & Schools of Thought',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-fayol-01', 'q-fayol-02'],
      subtopics: [
        'Concept, Nature and Operational Scope of Management',
        "Henri Fayol's 14 Administrative Principles",
        "F.W. Taylor's Scientific Management (Time, Motion & Fatigue Studies)",
        'Hawthorne Studies & Elton Mayo Human Relations Approach',
        'Contingency and Systems Approaches in Modern Indian Industry',
      ],
      explanationMd: `# Evolution of Management Thought: Fayol's Principles & Taylor's Scientific Management

### Core Concept & University Context
In the Karnataka State Higher Education Council (KSHEC) syllabus, Module 1 establishes the foundations of organizational theory. **Henri Fayol** analyzed management from the executive suite down (administrative management), whereas **Frederick Winslow Taylor** examined work from the factory shop floor up (scientific management).

Consider corporate leaders in Karnataka such as **Tata Consultancy Services (Bengaluru)** or **Titan Industries (Hosur)**: managing large workforces demands standard administrative protocols—unity of direction, division of work, and clear scalar chains—alongside scientific process standardization.

---

### Fayol's 14 Universal Principles (Administrative Theory)
1. **Division of Work**: Specialization enhances worker efficiency and output quality.
2. **Authority and Responsibility**: Authority is the official right to command; responsibility is its corresponding obligation.
3. **Discipline**: Respect for organizational agreements, obedience, and professional conduct.
4. **Unity of Command**: A subordinate must receive direct orders from **one and only one superior** to prevent role conflict.
5. **Unity of Direction**: One leader and one coordinated plan for activities sharing the same objective.
6. **Subordination of Individual Interest to General Interest**: Enterprise goals supersede personal employee agendas.
7. **Remuneration**: Fair and equitable compensation yielding satisfaction to both staff and employer.
8. **Centralization vs. Decentralization**: Striking an optimal balance between top-level authority and lower-level autonomy.
9. **Scalar Chain & The Gang Plank**: The formal hierarchy of authority from top executive to operative level. Fayol's **Gang Plank** permits direct horizontal cross-communication between colleagues of equal rank during urgent operational emergencies without violating protocol, provided immediate superiors are informed.
10. **Order**: "A place for everything (everyone) and everything (everyone) in its place" (Material and Social order).
11. **Equity**: Justice and kindliness exhibited by managers toward all subordinates.
12. **Stability of Tenure**: Avoiding excessive employee turnover through sensible retention policies.
13. **Initiative**: Inspiring staff to conceptualize and execute plans with enthusiasm.
14. **Esprit de Corps**: Cultivating harmony, team cohesion, and mutual trust across the organization.

---

### Taylor's Scientific Management Principles
- **Science, Not Rule of Thumb**: Scientific investigation replaces trial-and-error methods.
- **Harmony, Not Discord**: Mental revolution between workers and management.
- **Cooperation, Not Individualism**: Mutual accountability and shared responsibility.
- **Development of Each Worker**: Scientific selection, training, and placement according to individual capability.
- **Techniques**: Time study (stopwatch timing), Motion study (Therbligs), Fatigue study, and Differential Piece Rate System.`,
      formulas: [
        {
          id: 'formula-mpa-1',
          label: "Fayol's Administrative Functions Formulation (POCCC)",
          formula: 'Management Function = Planning + Organizing + Commanding (Directing) + Coordinating + Controlling',
          exampleQ: 'An operations manager at a Peenya manufacturing plant sets weekly production quotas, assigns shift tasks, and audits output defects. Which Fayol management functions are being exercised?',
          exampleA: 'Planning (setting weekly quotas), Organizing (assigning shift tasks), and Controlling (auditing output defects against benchmark standards).',
        },
      ],
      tricks: [
        {
          id: 'trick-mpa-1',
          title: '14 Principles Rapid Recall Mnemonic',
          trick: 'Use the phrase: DAD U SEE USSR OIC. D (Division of work), A (Authority), D (Discipline) | U (Unity of command), S (Scalar chain), E (Equity), E (Esprit de corps) | U (Unity of direction), S (Subordination), S (Stability), R (Remuneration) | O (Order), I (Initiative), C (Centralization).',
          whenToUse: 'Enables rapid listing of all 14 principles in 10-mark Karnataka university subjective questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-mpa-1',
          step: 'Step 1: Identify Principle Violations in Case Scenarios',
          detail: 'If an employee receives contradictory directives from two different team leads, identify a violation of Unity of Command. If multiple marketing departments run divergent campaigns, cite Unity of Direction.',
          questionType: 'Case Study / 10-Mark University Question',
        },
        {
          id: 'solve-mpa-2',
          step: 'Step 2: Contrast Fayol vs. Taylor Theorists',
          detail: 'State that Taylor focused on shop-floor mechanical efficiency and differential wages, whereas Fayol focused on top-down administrative governance and universal management functions.',
          questionType: 'Case Study / 10-Mark University Question',
        },
      ],
    },
    {
      id: 'mpa-mod2-planning-mbo',
      subjectId: 'bba-karnataka-mpa',
      title: 'Planning Process, MBO & Decision Making Models',
      moduleNumber: 2,
      moduleName: 'Module 2: Planning & Decision Making',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-mpa-02'],
      subtopics: [
        'Nature, Purpose and Hierarchy of Plans (Strategic, Tactical, Operational)',
        'Systematic Steps in the Planning Process',
        'Management by Objectives (MBO: Peter Drucker Framework & Process)',
        'Decision Making Under Certainty, Risk and Uncertainty',
        'Decision Tree Analysis and Group Decision-Making Techniques (Delphi, Brainstorming, NGT)',
      ],
      explanationMd: `# Planning Process, MBO & Managerial Decision Making

### Core Concept & University Context
Planning is the fundamental management function that bridges where an organization is today and where it wants to be tomorrow. Under the KSHEC syllabus, students are examined on the step-by-step planning sequence, Peter Drucker's **Management by Objectives (MBO)**, and rational decision-making models.

---

### Step-by-Step Planning Process
1. **Being Aware of Opportunities**: Analyzing external industry trends and internal resource strengths.
2. **Establishing Objectives**: Formulating clear, measurable targets for the entire enterprise and individual units.
3. **Developing Planning Premises**: Establishing forecasting assumptions regarding inflation, market demand, and policy changes.
4. **Identifying Alternative Courses of Action**: Brainstorming all feasible routes to attain targets.
5. **Evaluating Alternatives**: Assessing each option against costs, risks, capital outlay, and university benchmark standards.
6. **Selecting the Best Alternative**: Choosing the optimal strategic path.
7. **Formulating Derivative Plans**: Creating supporting sub-plans (procurement, hiring, IT integration).
8. **Budgeting & Implementation**: Translating plans into numerical budgets and monitoring execution.

---

### Management by Objectives (MBO — Peter Drucker)
MBO is a collaborative management system where superiors and subordinates jointly identify shared goals, define individual areas of responsibility in terms of measurable expected results, and use these measures as guides for operating the unit:
- **Joint Goal Setting**: Cascading corporate objectives into departmental and individual SMART goals.
- **Action Planning**: Subordinates formulate specific milestones.
- **Periodic Progress Reviews**: Regular check-ins to provide constructive feedback.
- **Performance Evaluation**: Year-end performance appraised against mutually agreed quantitative criteria.`,
      formulas: [
        {
          id: 'formula-mpa-2',
          label: 'SMART Objectives Criterion',
          formula: 'Valid Goal = Specific + Measurable + Achievable + Relevant + Time-Bound',
          exampleQ: 'A regional manager states: "We will increase sales substantially soon." Is this a SMART objective?',
          exampleA: 'No. To be SMART under MBO: "Increase South Karnataka BBA online course sales by 15% before December 31, 2026."',
        },
      ],
      tricks: [
        {
          id: 'trick-mpa-2',
          title: 'Planning Sequence Trap',
          trick: 'Planning Premises ALWAYS precedes Evaluating Alternatives! Without forecasting assumptions (premises), evaluating alternatives is impossible.',
          whenToUse: 'Very common 2-mark and MCQ trick in university exams.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-mpa-3',
          step: 'Step 1: Structure the 8 Planning Steps Chronologically',
          detail: 'Never mix up the order. Use a vertical flow-chart diagram to secure maximum marks in 10-marker theory questions.',
          questionType: 'Analytical University Question',
        },
      ],
    },
  ],

  // ── 2. Fundamentals of Business Accounting (Sem 1) ──
  'bba-karnataka-accounting': [
    {
      id: 'acc-mod1-concepts-rules',
      subjectId: 'bba-karnataka-accounting',
      title: 'Accounting Principles, Concepts & Double Entry System',
      moduleNumber: 1,
      moduleName: 'Module 1: Theoretical Framework & Accounting Foundations',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-acc-01'],
      subtopics: [
        'Meaning, Scope and Users of Accounting Information',
        'GAAP, Indian Accounting Standards (AS) vs. Ind AS Overview',
        'Double Entry Mechanics & Traditional Golden Rules of Accounting',
        'Modern Account Classification (DEALER: Assets, Liabilities, Capital, Expenses, Revenue)',
        'Key Conventions: Going Concern, Matching, Accrual & Conservatism (Prudence)',
      ],
      explanationMd: `# Accounting Principles, Concepts & Double Entry Rules

### Core Concept & University Framework
Financial accounting represents the structured language of commercial enterprise. In Karnataka universities (BU/BCU/BNU/UOM), candidates must demonstrate mastery over the **Accounting Equation**, the **Golden Rules of Accounting**, and standard accounting conventions.

---

### The Fundamental Accounting Equation
$$\\text{Total Assets} = \\text{Owner's Capital} + \\text{External Liabilities}$$

Every commercial transaction alters at least two accounts such that this balance sheet equilibrium is perpetually preserved.

---

### Traditional Golden Rules of Accounting
1. **Real Accounts (Tangible/Intangible Assets: Cash, Machinery, Land, Patents)**:
   - **Debit**: What comes in
   - **Credit**: What goes out
2. **Personal Accounts (Persons, Firms, Companies, Debtors, Creditors, Banks)**:
   - **Debit**: The receiver
   - **Credit**: The giver
3. **Nominal Accounts (Expenses, Losses, Incomes, Gains)**:
   - **Debit**: All expenses and losses
   - **Credit**: All incomes and gains

---

### Key Accounting Conventions
- **Business Entity Concept**: Business is treated as a separate legal entity distinct from its proprietor.
- **Going Concern Concept**: Financial statements assume the business will operate indefinitely.
- **Accrual Concept**: Revenue and expenses are recognized when earned or incurred, not when cash changes hands.
- **Matching Principle**: Period expenses must match against period revenues.
- **Prudence (Conservatism)**: Anticipate all foreseeable losses; never anticipate unrealized gains.`,
      formulas: [
        {
          id: 'formula-acc-k1',
          label: 'Accounting Equation Formula',
          formula: 'Assets = Capital + Liabilities',
          exampleQ: 'Sri Krishna Traders starts business with Cash ₹3,00,000, borrows ₹1,50,000 from Canara Bank, and purchases Goods worth ₹80,000 on credit. Compute total Assets.',
          exampleA: 'Total Assets = Cash ₹4,50,000 + Stock ₹80,000 = ₹5,30,000. Liabilities (Canara Bank ₹1,50,000 + Creditors ₹80,000) + Capital (₹3,00,000) = ₹5,30,000.',
        },
      ],
      tricks: [
        {
          id: 'trick-acc-k1',
          title: 'DEALER Modern Classification Rule',
          trick: 'DEA = Debit on Increase (Drawings, Expenses, Assets) | LER = Credit on Increase (Liabilities, Equity/Capital, Revenue).',
          whenToUse: 'Eliminates debit/credit mistakes during fast journal entries.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-acc-k1',
          step: 'Step 1: Identify Both Affected Accounts',
          detail: 'Ascertain the two accounts involved in the transaction (e.g. Bank Account and Sales Account).',
          questionType: 'Journal Entry Formulation',
        },
      ],
    },
    {
      id: 'acc-mod4-depreciation-slm-wdv',
      subjectId: 'bba-karnataka-accounting',
      title: 'Depreciation Accounting: SLM vs. WDV Methods',
      moduleNumber: 4,
      moduleName: 'Module 4: Depreciation Accounting & Bank Reconciliation',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-acc-02'],
      subtopics: [
        'Causes and Necessity of Providing Depreciation under AS-10',
        'Straight Line Method (Fixed Installment Method) Computation & Ledger Accounts',
        'Written Down Value (Diminishing Balance) Method Computation & Ledger Accounts',
        'Accounting for Sale and Disposal of Depreciable Assets',
        'Change in Method of Depreciation (Prospective Treatment)',
      ],
      explanationMd: `# Depreciation Accounting: Straight Line (SLM) vs. Written Down Value (WDV)

### Core Concept & University Framework
Depreciation is the gradual and permanent reduction in the economic book value of a fixed asset arising from wear and tear, obsolescence, or effluxion of time. Under AS-10 (Property, Plant and Equipment) and university exams, students frequently solve 10-mark problems on asset ledger accounts under SLM and WDV.

---

### Straight Line Method (SLM)
Depreciation remains uniform every fiscal year:
$$\\text{Annual Depreciation} = \\frac{\\text{Original Cost} - \\text{Estimated Scrap Value}}{\\text{Useful Life in Years}}$$
$$\\text{Rate of Depreciation} = \\left( \\frac{\\text{Annual Depreciation}}{\\text{Original Cost}} \\right) \\times 100$$

---

### Written Down Value Method (WDV)
Depreciation is calculated on the reducing book value at the beginning of each period:
- Depreciation amount decreases year after year.
- Asset book value never reduces to absolute zero.
- Accepted by the Indian Income Tax Act 1961 for tax computation.`,
      formulas: [
        {
          id: 'formula-dep-1',
          label: 'SLM Annual Depreciation Formula',
          formula: 'Depreciation (₹) = (Cost - Residual Value) / Useful Life',
          exampleQ: 'Machinery purchased on 1st April 2024 for ₹5,00,000 with installation cost of ₹20,000. Scrap value after 10 years is ₹40,000. Calculate annual depreciation under SLM.',
          exampleA: 'Total Cost = ₹5,20,000. Annual Depreciation = (5,20,000 - 40,000) / 10 = ₹48,000 per annum.',
        },
      ],
      tricks: [
        {
          id: 'trick-dep-1',
          title: 'Fractional Year Depreciation Rule',
          trick: 'Always inspect the purchase date! If asset purchased on 1st October, calculate depreciation for only 6 months (6/12) in that financial year.',
          whenToUse: 'Primary reason students lose marks in practical exam ledgers.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-dep-1',
          step: 'Step 1: Set Up the Machinery Account in Ledger Format',
          detail: 'Debit Bank Account on date of purchase. Credit Depreciation Account on 31st March, balancing to By Balance c/d.',
          questionType: 'Practical Ledger Problem / 10-Marker',
        },
      ],
    },
  ],

  // ── 7. Cost Accounting (Sem 3) ──
  'bba-karnataka-cost-accounting': [
    {
      id: 'cost-mod1-cost-sheet',
      subjectId: 'bba-karnataka-cost-accounting',
      title: 'Cost Sheet Preparation & Classification of Costs',
      moduleNumber: 1,
      moduleName: 'Module 1: Introduction to Cost Accounting & Cost Elements',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-cost-01'],
      subtopics: [
        'Costing, Cost Accounting & Cost Accountancy Scope',
        'Elements of Cost: Direct Material, Direct Labour, Direct Expenses, Overheads',
        'Classification of Costs (Fixed, Variable, Semi-Variable, Sunk, Opportunity)',
        'Structure and Preparation of a Manufacturing Cost Sheet',
        'Tender and Quotation Price Estimation',
      ],
      explanationMd: `# Cost Sheet Preparation & Classification of Cost Elements

### Core Concept & University Framework
A **Cost Sheet** is a statement prepared at regular intervals that presents the detailed breakdown of the total cost of production and shows prime cost, factory cost, cost of goods produced, total cost of sales, and resulting profit.

---

### Step-by-Step Cost Sheet Structure
1. **Raw Materials Consumed**:
   $$\\text{Opening Stock of RM} + \\text{Purchases of RM} + \\text{Carriage Inward} - \\text{Closing Stock of RM}$$
2. **Prime Cost**:
   $$\\text{Raw Materials Consumed} + \\text{Direct Wages} + \\text{Direct Chargeable Expenses}$$
3. **Works / Factory Cost**:
   $$\\text{Prime Cost} + \\text{Factory Overheads} + \\text{Opening WIP} - \\text{Closing WIP}$$
4. **Cost of Production (COP)**:
   $$\\text{Works Cost} + \\text{Office & Administrative Overheads}$$
5. **Cost of Goods Sold (COGS)**:
   $$\\text{Cost of Production} + \\text{Opening Finished Goods} - \\text{Closing Finished Goods}$$
6. **Total Cost of Sales**:
   $$\\text{COGS} + \\text{Selling and Distribution Overheads}$$
7. **Profit**:
   $$\\text{Sales Revenue} - \\text{Total Cost of Sales}$$`,
      formulas: [
        {
          id: 'formula-cost-sheet-1',
          label: 'Prime Cost Formula',
          formula: 'Prime Cost = Direct Materials Consumed + Direct Labour + Direct Expenses',
          exampleQ: 'Direct Material = ₹1,20,000, Direct Wages = ₹60,000, Factory Rent = ₹20,000. What is Prime Cost?',
          exampleA: 'Prime Cost = 1,20,000 + 60,000 = ₹1,80,000. (Factory rent is a factory overhead, not part of Prime Cost).',
        },
      ],
      tricks: [
        {
          id: 'trick-cost-sheet-1',
          title: 'Financial Items Exclusion Rule',
          trick: 'NEVER include purely financial items in a cost sheet: Income Tax, Dividend Paid, Goodwill Written Off, Interest on Debentures, Donation. They are financial entries only!',
          whenToUse: 'Guarantees 100% correct cost sheet calculations in university exams.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-cost-sheet-1',
          step: 'Step 1: Calculate Direct Materials Consumed First',
          detail: 'Opening Stock RM + Purchases + Carriage Inward - Closing Stock RM.',
          questionType: 'Practical Cost Sheet Problem',
        },
      ],
    },
    {
      id: 'cost-mod2-eoq-stock-levels',
      subjectId: 'bba-karnataka-cost-accounting',
      title: 'Material Cost Control: EOQ & Stock Levels',
      moduleNumber: 2,
      moduleName: 'Module 2: Material Cost Control',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-cost-02'],
      subtopics: [
        'Stores Ledger vs. Bin Card Differences',
        'Economic Order Quantity (EOQ) Formula & Graphical Model',
        'Stock Levels: Re-order Level (ROL), Minimum Level, Maximum Level, Danger Level',
        'Material Issue Pricing: FIFO, LIFO, Weighted Average Price Methods',
        'Accounting for Normal and Abnormal Material Wastage',
      ],
      explanationMd: `# Material Cost Control: EOQ & Stock Level Calculations

### Core Concept & University Framework
Materials constitute 50% to 70% of total manufacturing costs in Indian industry. Effective material inventory control prevents capital over-investment while safeguarding continuous production flow.

---

### Economic Order Quantity (EOQ)
The order size that minimizes total inventory costs (Carrying Costs + Ordering Costs):
$$\\text{EOQ} = \\sqrt{\\frac{2 \\times A \\times O}{C}}$$
Where:
- $A$ = Annual Consumption / Demand in units
- $O$ = Cost of placing one order
- $C$ = Carrying cost per unit per annum (often given as percentage of unit purchase price)

---

### Standard Inventory Stock Levels
1. **Re-Order Level (ROL)**:
   $$\\text{ROL} = \\text{Maximum Consumption} \\times \\text{Maximum Lead Time (Re-order Period)}$$
2. **Minimum Stock Level**:
   $$\\text{Min Level} = \\text{ROL} - (\\text{Normal Consumption} \\times \\text{Normal Lead Time})$$
3. **Maximum Stock Level**:
   $$\\text{Max Level} = \\text{ROL} + \\text{EOQ} - (\\text{Minimum Consumption} \\times \\text{Minimum Lead Time})$$
4. **Average Stock Level**:
   $$\\text{Average Level} = \\text{Minimum Level} + \\frac{1}{2} \\times \\text{EOQ}$$`,
      formulas: [
        {
          id: 'formula-eoq-1',
          label: 'Economic Order Quantity Formula',
          formula: 'EOQ = sqrt((2 * A * O) / C)',
          exampleQ: 'Annual demand = 10,000 units, Ordering cost = ₹50 per order, Carrying cost = ₹1 per unit/year. Calculate EOQ.',
          exampleA: 'EOQ = sqrt((2 * 10,000 * 50) / 1) = sqrt(1,000,000) = 1,000 units.',
        },
      ],
      tricks: [
        {
          id: 'trick-eoq-1',
          title: 'Carrying Cost Percentage Trap',
          trick: 'If Carrying Cost is given as 10% and unit price is ₹20, C = ₹2 per unit/year! Never plug 10 directly into the formula.',
          whenToUse: 'Appears in 90% of university quantitative inventory questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-eoq-1',
          step: 'Step 1: Compute ROL Before Any Other Stock Level',
          detail: 'Both Minimum and Maximum Stock Levels depend on ROL. Always calculate ROL first.',
          questionType: 'Practical Stock Level Problem',
        },
      ],
    },
  ],

  // ── 11. Corporate Financial Management (Sem 4) ──
  'bba-karnataka-fin-mgmt': [
    {
      id: 'fin-mod2-wacc-cost-of-capital',
      subjectId: 'bba-karnataka-fin-mgmt',
      title: 'Cost of Capital & WACC Computation',
      moduleNumber: 2,
      moduleName: 'Module 2: Cost of Capital & Financing Decisions',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-fin-01'],
      subtopics: [
        'Significance of Cost of Capital as Project Hurdle Rate',
        'Cost of Debt (Kd) - Irredeemable and Redeemable with Tax Shield',
        'Cost of Preference Shares (Kp) and Cost of Equity (Ke) via Dividend & CAPM Models',
        'Cost of Retained Earnings (Kr)',
        'Weighted Average Cost of Capital (WACC) using Book Value vs. Market Value Weights',
      ],
      explanationMd: `# Cost of Capital & Weighted Average Cost of Capital (WACC)

### Core Concept & University Framework
Cost of capital is the minimum required rate of return that a firm must earn on its investments to maintain its market valuation. It serves as the discount hurdle rate in capital budgeting decisions.

---

### Component Costs of Capital
1. **Cost of Debt ($K_d$) After Tax**:
   $$K_d = \\frac{I}{NP} \\times (1 - t)$$
   *Where $I$ = Annual interest, $NP$ = Net proceeds, $t$ = Corporate tax rate.*

2. **Cost of Preference Capital ($K_p$)**:
   $$K_p = \\frac{D_p}{NP}$$
   *Where $D_p$ = Annual preference dividend.*

3. **Cost of Equity ($K_e$) — Dividend Growth Model**:
   $$K_e = \\frac{D_1}{P_0} + g$$
   *Where $D_1$ = Expected dividend next year, $P_0$ = Current market price, $g$ = Constant growth rate.*

4. **Weighted Average Cost of Capital (WACC / $K_o$)**:
   $$K_o = \\sum (w_i \\times K_i) = w_d K_d + w_p K_p + w_e K_e + w_r K_r$$`,
      formulas: [
        {
          id: 'formula-wacc-1',
          label: 'WACC Composite Equation',
          formula: 'WACC = (Wd * Kd) + (Wp * Kp) + (We * Ke) + (Wr * Kr)',
          exampleQ: 'Firm has 40% Debt (Kd = 7% after-tax) and 60% Equity (Ke = 14%). Calculate WACC.',
          exampleA: 'WACC = (0.40 * 7%) + (0.60 * 14%) = 2.8% + 8.4% = 11.2%.',
        },
      ],
      tricks: [
        {
          id: 'trick-wacc-1',
          title: 'Tax Shield Difference',
          trick: 'Debt interest is tax-deductible (multiply by 1 - t). Preference and Equity dividends are NOT tax-deductible! Never apply (1 - t) to Ke or Kp.',
          whenToUse: 'High-frequency exam mistake in finance numericals.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-wacc-1',
          step: 'Step 1: Compute Specific Component Costs (Kd, Kp, Ke)',
          detail: 'Calculate each component percentage cost after tax.',
          questionType: 'Practical Financial Management Problem',
        },
      ],
    },
  ],

  // ── 16. Strategic Management & Business Policy (Sem 6) ──
  'bba-karnataka-strategic-mgmt': [
    {
      id: 'strat-mod2-pestle-porter',
      subjectId: 'bba-karnataka-strategic-mgmt',
      title: "Environmental Appraisal: PESTLE & Porter's 5 Forces",
      moduleNumber: 2,
      moduleName: 'Module 2: Environmental Appraisal & Industry Competitiveness',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-strat-01'],
      subtopics: [
        'Macro-Environment Appraisal using PESTLE Framework',
        "Porter's 5 Forces Model of Industry Attractiveness",
        'Strategic Group Mapping & Competitor Profiling',
        "Internal Resource Appraisal: VRIO Framework & Porter's Value Chain",
        'SWOT and TOWS Matrix Formulation for Corporate Strategy',
      ],
      explanationMd: `# Industry Environmental Appraisal: PESTLE & Porter's Five Forces

### Core Concept & University Framework
Module 2 in the 6th Semester Karnataka BBA syllabus tests analytical skills in macro-environmental forecasting and industry structural attractiveness.

---

### PESTLE Macro-Environmental Analysis
- **Political**: Stability of government, industrial incentives in Karnataka (Industrial Policy 2020-25).
- **Economic**: Inflation rates, interest rates, disposable income, GDP growth.
- **Socio-Cultural**: Demographics, changing urban lifestyles in Bengaluru, work-from-home trends.
- **Technological**: AI automation, e-commerce penetration, UPI digital payments.
- **Legal**: Labor laws, Karnataka Shops & Commercial Establishments Act, Companies Act 2013 compliance.
- **Environmental**: ESG mandates, carbon emission reductions, circular packaging norms.

---

### Michael Porter's Five Forces of Industry Competitiveness
1. **Threat of New Entrants**: Determined by entry barriers (economies of scale, capital requirements, switching costs, government licenses).
2. **Bargaining Power of Buyers**: High when buyer volume is large and switching costs are negligible.
3. **Bargaining Power of Suppliers**: High when supplier concentration is high and inputs have few substitutes.
4. **Threat of Substitute Products**: Products from outside the industry satisfying the identical consumer need.
5. **Rivalry Among Existing Competitors**: Driven by exit barriers, competitor parity, and industry growth rates.`,
      formulas: [
        {
          id: 'formula-strat-k1',
          label: 'Porter Competitive Advantage Matrix',
          formula: 'Strategic Position = Low Cost Advantage OR Differentiated Value Proposition',
          exampleQ: 'IndiGo Airlines vs. Vistara Airlines in Indian aviation.',
          exampleA: 'IndiGo executes Cost Leadership (low overhead, standardized fleet); Vistara executed Differentiation (full service, premium amenities).',
        },
      ],
      tricks: [
        {
          id: 'trick-strat-k1',
          title: 'Substitute vs Rival Distinction',
          trick: 'Competitors are within the SAME industry (Ola vs Uber). Substitutes come from OUTSIDE (Namma Metro substituting ride-hailing cabs).',
          whenToUse: 'Essential for scoring full marks in strategy case study questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-strat-k1',
          step: 'Step 1: Evaluate Each of the 5 Forces as Low, Moderate, or High',
          detail: 'Provide two empirical justifications for each force before concluding overall industry profitability.',
          questionType: 'Industry Analysis Case Study',
        },
      ],
    },
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// UNIVERSAL PRACTICE QUESTIONS LINKED VIA PREPTAGS
// ══════════════════════════════════════════════════════════════════════════════
export const SEEDED_UNIVERSAL_QUESTIONS: UniversalQuestion[] = [
  {
    id: 'q-fayol-01',
    questionText: "Under Henri Fayol's administrative management principles, what does the 'Gang Plank' signify?",
    options: [
      'A disciplinary sanction leading to employee dismissal',
      'An authorized direct horizontal communication bridge between colleagues of equal rank in an emergency',
      'The vertical reporting channel from General Manager to supervisor',
      'The board of directors voting hierarchy',
    ],
    correctIndex: 1,
    explanation: "The Gang Plank is Fayol's exception to the strict scalar chain, enabling authorized horizontal communication between peers during operational emergencies while keeping superiors informed.",
    difficulty: 'basic',
    status: 'approved',
    prepTags: {
      subjectId: 'bba-karnataka-mpa',
      topicIds: ['mpa-mod1-fayol-taylor'],
      stream: 'management',
      program: 'bba',
    },
  },
  {
    id: 'q-fayol-02',
    questionText: 'Which management principle establishes that an operative employee should receive directives from ONE and only one direct boss?',
    options: [
      'Unity of Direction',
      'Scalar Chain',
      'Unity of Command',
      'Division of Work',
    ],
    correctIndex: 2,
    explanation: 'Unity of Command mandates that each subordinate employee receives orders from only one superior to prevent conflicting priorities and split loyalty.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: {
      subjectId: 'bba-karnataka-mpa',
      topicIds: ['mpa-mod1-fayol-taylor'],
      stream: 'management',
      program: 'bba',
    },
  },
  {
    id: 'q-mpa-02',
    questionText: 'In the systematic managerial planning sequence, which step immediately follows "Developing Planning Premises"?',
    options: [
      'Selecting the best alternative',
      'Identifying alternative courses of action',
      'Formulating derivative budgets',
      'Evaluating alternatives against costs and risks',
    ],
    correctIndex: 1,
    explanation: 'Once planning premises (forecasting assumptions) are established, management identifies the various alternative courses of action before evaluating them.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'bba-karnataka-mpa',
      topicIds: ['mpa-mod2-planning-mbo'],
      stream: 'management',
      program: 'bba',
    },
  },
  {
    id: 'q-acc-01',
    questionText: 'Under the modern DEALER classification of accounts, which accounts increase with a DEBIT entry?',
    options: [
      'Drawings, Expenses, and Assets',
      'Liabilities, Equity, and Revenue',
      'Capital, Creditors, and Sales',
      'Reserves, Debentures, and Operating Income',
    ],
    correctIndex: 0,
    explanation: 'Under the DEALER mnemonic: D (Drawings), E (Expenses), and A (Assets) increase on the DEBIT side. L (Liabilities), E (Equity), and R (Revenue) increase on the CREDIT side.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: {
      subjectId: 'bba-karnataka-accounting',
      topicIds: ['acc-mod1-concepts-rules'],
      stream: 'commerce',
      program: 'bba',
    },
  },
  {
    id: 'q-cost-01',
    questionText: 'Which of the following items must be STRICTLY EXCLUDED when preparing a manufacturing Cost Sheet?',
    options: [
      'Direct factory electricity expenses',
      'Carriage inward on raw materials',
      'Income Tax and Proposed Dividend',
      'Primary packing material expenses',
    ],
    correctIndex: 2,
    explanation: 'Income Tax, dividends, debenture interest, and capital donations are purely financial charges and appropriation of profits; they are never included in cost sheets.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: {
      subjectId: 'bba-karnataka-cost-accounting',
      topicIds: ['cost-mod1-cost-sheet'],
      stream: 'commerce',
      program: 'bba',
    },
  },
  {
    id: 'q-cost-02',
    questionText: 'If annual consumption is 8,000 units, ordering cost is ₹100 per order, and carrying cost is ₹4 per unit/year, what is the Economic Order Quantity (EOQ)?',
    options: [
      '400 units',
      '632 units',
      '800 units',
      '1,200 units',
    ],
    correctIndex: 1,
    explanation: 'EOQ = sqrt((2 * 8,000 * 100) / 4) = sqrt(1,600,000 / 4) = sqrt(400,000) = 632.45 ≈ 632 units.',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'bba-karnataka-cost-accounting',
      topicIds: ['cost-mod2-eoq-stock-levels'],
      stream: 'commerce',
      program: 'bba',
    },
  },
  {
    id: 'q-fin-01',
    questionText: 'Why is the specific cost of debt (Kd) multiplied by (1 - t) when calculating WACC?',
    options: [
      'Because debt is riskier than equity capital',
      'Because debt interest is tax-deductible, creating an interest tax shield',
      'Because the Reserve Bank of India mandates it',
      'Because debenture holders receive fixed dividends',
    ],
    correctIndex: 1,
    explanation: 'Under corporate income tax laws, interest paid on debt capital is a tax-deductible expense. The effective net cost to the firm is Kd * (1 - tax rate).',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'bba-karnataka-fin-mgmt',
      topicIds: ['fin-mod2-wacc-cost-of-capital'],
      stream: 'finance',
      program: 'bba',
    },
  },
  {
    id: 'q-strat-01',
    questionText: "In Michael Porter's Five Forces framework, which of the following is considered an external SUBSTITUTE rather than a direct competitor?",
    options: [
      'Pepsi substituting Coca-Cola',
      'Namma Metro substituting an app-based auto rickshaw ride',
      'Indigo Airlines substituting Air India on the Bengaluru-Delhi route',
      'Infosys competing with Wipro for an IT services contract',
    ],
    correctIndex: 1,
    explanation: 'Substitutes originate from an entirely different industry but satisfy the same consumer need (Metro rail transportation substituting road automotive transit).',
    difficulty: 'core',
    status: 'approved',
    prepTags: {
      subjectId: 'bba-karnataka-strategic-mgmt',
      topicIds: ['strat-mod2-pestle-porter'],
      stream: 'strategy',
      program: 'bba',
    },
  },
]
