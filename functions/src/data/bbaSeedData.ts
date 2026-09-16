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
      id: 'acc-mod3-consignment',
      subjectId: 'bba-karnataka-accounting',
      title: 'Consignment Accounts: Valuation of Unsold Stock & Abnormal Loss',
      moduleNumber: 3,
      moduleName: 'Module 3: Consignment & Special Accounts',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      examFrequency: 'very_high',
      pyqHighlights: ['Bangalore Univ (BU) 2024 · 10 Marks', 'Mysore Univ (UOM) 2023 · 10 Marks'],
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-acc-03'],
      subtopics: [
        'Consignment vs. Sale Differences (Ownership, Risk & Pro-Forma Invoice)',
        'Ordinary, Del Credere, and Over-Riding Commission',
        'Valuation of Unsold Consignment Stock (Cost + Proportionate Non-Recurring Expenses)',
        'Accounting for Normal Loss vs Abnormal Loss in Transit & Insurance Claims',
        'Consignment Account & Consignee Account Ledgers in Consignor Books',
      ],
      explanationMd: `# Consignment Accounts: Valuation of Unsold Stock & Losses

### Core Concept & University Framework
In a consignment transaction, the principal (**Consignor**) sends goods to an agent (**Consignee**) for sale on a commission basis. Ownership of goods remains with the consignor until sold to the final customer.

Under Karnataka university examinations (BU/BCU/BNU/UOM), calculating the **Value of Unsold Consignment Stock** and handling **Abnormal Loss in Transit** is a standard 10-mark problem.

---

### Valuation of Unsold Consignment Stock
$$\\text{Value of Consignment Stock} = \\text{Proportionate Cost of Unsold Units} + \\text{Proportionate Non-Recurring Expenses}$$
- **Non-Recurring Expenses of Consignor**: Freight, carriage inward, loading, transit insurance, railway freight.
- **Non-Recurring Expenses of Consignee**: Custom duty, dock dues, clearing charges, carriage from station to godown.
- *(Note: Recurring expenses like godown rent, godown insurance, advertisement, and salesman salary are strictly excluded from stock valuation).*

---

### Normal Loss vs. Abnormal Loss
1. **Normal Loss (Inherent/Evaporation/Leakage)**:
   - Inflates cost per unit; no separate accounting entry is made.
   $$\\text{Cost Per Good Unit} = \\frac{\\text{Total Cost} + \\text{Non-Recurring Expenses}}{\\text{Total Units} - \\text{Normal Loss Units}}$$
2. **Abnormal Loss (Accident/Fire/Theft)**:
   - Treated as an independent business loss credited to Consignment A/c and debited to Abnormal Loss A/c.
   $$\\text{Net Abnormal Loss to P\\&L} = \\text{Total Cost of Lost Units} - \\text{Insurance Claim Received}$$`,
      formulas: [
        {
          id: 'formula-cons-1',
          label: 'Unsold Consignment Stock Valuation Formula',
          formula: 'Closing Stock Value = (Cost Price of Unsold Units) + (Consignor Expenses * Unsold / Total) + (Consignee Non-Recurring * Unsold / Good Units Received)',
          exampleQ: '1,000 units sent at ₹100 each. Consignor paid freight ₹5,000. 100 units lost in transit (abnormal). Consignee received 900 units, paid clearing charges ₹1,800, godown rent ₹2,000, and sold 700 units. Value the unsold stock (200 units).',
          exampleA: 'Proportionate Cost = 200 * ₹100 = ₹20,000. Consignor Freight = 5,000 * (200 / 1,000) = ₹1,000. Consignee Clearing = 1,800 * (200 / 900) = ₹400. (Godown rent is recurring, excluded). Total Stock Value = 20,000 + 1,000 + 400 = ₹21,400.',
        },
      ],
      tricks: [
        {
          id: 'trick-cons-1',
          title: 'Consignee Godown Rent Exclusion Trap',
          trick: 'NEVER include Consignee godown rent or selling expenses in closing stock! Only expenses incurred up to reaching the godown door (freight, customs, clearing) are included.',
          whenToUse: 'Deducted in 90% of consignment numerical mistakes.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-cons-1',
          step: 'Step 1: Compute Abnormal Loss in Transit Before Stock Valuation',
          detail: 'Abnormal loss takes only Consignor proportionate expenses because goods were lost before reaching the consignee.',
          questionType: 'Practical Consignment Problem / 10-Marker',
        },
      ],
    },
    {
      id: 'acc-mod4-depreciation-slm-wdv',
      subjectId: 'bba-karnataka-accounting',
      title: 'Depreciation Accounting: SLM vs. WDV Methods',
      moduleNumber: 4,
      moduleName: 'Module 4: Depreciation Accounting & Bank Reconciliation',
      order: 3,
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

  // ── 3. Principles of Marketing (Sem 1) ──
  'bba-karnataka-marketing': [
    {
      id: 'mkt-mod2-stp',
      subjectId: 'bba-karnataka-marketing',
      title: 'Market Segmentation, Targeting & Positioning (STP)',
      moduleNumber: 2,
      moduleName: 'Module 2: Consumer Behaviour & STP Framework',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-mkt-01'],
      subtopics: [
        'Concept of Heterogeneous Markets & Need for Segmentation',
        'Bases for Consumer Market Segmentation (Geographic, Demographic, Psychographic, Behavioural)',
        'Target Market Strategies (Undifferentiated, Differentiated, Concentrated / Niche)',
        'Positioning Strategies, Perceptual Mapping & Unique Selling Proposition (USP)',
        'Repositioning Case Studies in Karnataka (Nandini Milk, Fastrack, Tanishq)',
      ],
      explanationMd: `# Market Segmentation, Targeting & Positioning (STP Framework)

### Core Concept & University Framework
The STP framework is the cornerstone of modern strategic marketing. Instead of treating the marketplace as a homogeneous mass, businesses divide aggregate demand into distinct sub-groups of consumers sharing identifiable needs, characteristics, or buying behaviours.

In Karnataka, consider how the **Karnataka Milk Federation (Nandini)** segments consumers: everyday household milk buyers (demographic / volume), health-conscious fitness enthusiasts with Nandini Pro-Milk and curd (psychographic / lifestyle), and sweet consumers during festive seasons (behavioural / occasion-based).

---

### 1. Market Segmentation Bases
- **Geographic**: Region (Tier-1 Bengaluru vs. Tier-2 Hubballi/Mysuru), urban vs. rural, climate.
- **Demographic**: Age, gender, income tier, occupation, education, family life cycle.
- **Psychographic**: Social class, lifestyle (aspirational vs. conservative), personality traits.
- **Behavioural**: Occasions, benefit sought (quality, economy, convenience), user status, loyalty rate.

---

### 2. Targeting Strategies
1. **Undifferentiated (Mass) Marketing**: Single offer for the whole market (e.g. basic table salt).
2. **Differentiated (Segmented) Marketing**: Different products for distinct segments (e.g. Maruti Suzuki: Alto, Swift, Nexa Grand Vitara).
3. **Concentrated (Niche) Marketing**: Substantial share of one or few narrow sub-markets (e.g. luxury wristwatches).
4. **Micromarketing**: Local or individual customer customization.

---

### 3. Product Positioning
Positioning is the act of designing the company's offering and brand image to occupy a distinct and valued place in the target customer's mind relative to competitors.
- **Perceptual Mapping**: Visual 2x2 diagram mapping customer perception of price vs. quality.
- **USP (Unique Selling Proposition)**: The single compelling benefit no competitor matches.`,
      formulas: [
        {
          id: 'formula-mkt-1',
          label: 'Customer Value Proposition Equation',
          formula: 'Customer Perceived Value = Total Customer Benefit - Total Customer Cost',
          exampleQ: 'A Bengaluru quick-commerce startup charges ₹20 delivery fee for 10-minute grocery delivery compared to free 2-day delivery from supermarkets. How is perceived value created?',
          exampleA: 'Customer Perceived Value increases because the time and effort savings (benefit) outweigh the nominal delivery fee (cost).',
        },
      ],
      tricks: [
        {
          id: 'trick-mkt-1',
          title: 'STP Sequential Hierarchy',
          trick: 'Remember the strict order: S -> T -> P. You CANNOT target before segmenting, and you CANNOT position before choosing the target segment!',
          whenToUse: 'Avoids structure errors in 5-mark and 10-mark marketing theory questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-mkt-1',
          step: 'Step 1: Identify the 4 Segmentation Criteria for the Given Case',
          detail: 'Systematically tabulate Geographic, Demographic, Psychographic, and Behavioural traits of the target group.',
          questionType: 'Marketing Case Study Question',
        },
      ],
    },
    {
      id: 'mkt-mod3-plc-pricing',
      subjectId: 'bba-karnataka-marketing',
      title: 'Product Life Cycle (PLC) & Pricing Strategies',
      moduleNumber: 3,
      moduleName: 'Module 3: Product Mix & Pricing Decisions',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-mkt-02'],
      subtopics: [
        'Concept of Product Levels (Core, Actual, Augmented)',
        'Four Stages of Product Life Cycle (Introduction, Growth, Maturity, Decline)',
        'Marketing Mix Strategies across each PLC Stage',
        'New Product Pricing: Price Skimming vs. Penetration Pricing',
        'Cost-Plus, Value-Based, and Psychological Pricing Tactics',
      ],
      explanationMd: `# Product Life Cycle (PLC) & Strategic Pricing Methods

### Core Concept & University Framework
The **Product Life Cycle (PLC)** describes the sales and profit trajectory of a product over time from initial commercialization to eventual obsolescence. University examinations test candidates on matching pricing, advertising, and distribution strategies to each phase.

---

### The Four Stages of the PLC
1. **Introduction**: Low sales, high promotional costs, negative or negligible profits, heavy informative advertising.
2. **Growth**: Rapid sales acceleration, entry of competitors, profit peak, expanding distribution channels.
3. **Maturity**: Peak sales volume, intense price competition, saturation, defensive advertising, brand extension.
4. **Decline**: Falling sales, technological substitution, minimal promotion, product harvesting or discontinuation.

---

### New Product Pricing Strategies
- **Price Skimming**: Setting a high introductory price to recover R&D costs from early adopters before lowering prices (e.g. Apple iPhone launches).
- **Market Penetration**: Setting an aggressively low introductory price to rapidly capture dominant market share and build volume scale (e.g. Reliance Jio 4G launch in India).`,
      formulas: [
        {
          id: 'formula-plc-1',
          label: 'Cost-Plus Markup Price Formula',
          formula: 'Selling Price = Total Unit Cost / (1 - Desired Markup on Sales)',
          exampleQ: 'Unit cost is ₹80 and the firm targets a 20% profit margin on selling price. What is the selling price?',
          exampleA: 'Selling Price = 80 / (1 - 0.20) = 80 / 0.80 = ₹100.',
        },
      ],
      tricks: [
        {
          id: 'trick-plc-1',
          title: 'Skimming vs Penetration Trigger',
          trick: 'Use Skimming when demand is inelastic and entry barriers are high. Use Penetration when demand is highly elastic and scale economies are steep!',
          whenToUse: 'Key distinction required in university pricing strategy questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-plc-1',
          step: 'Step 1: Draw the Classic S-Curve Diagram for Sales and Profits',
          detail: 'Label Introduction, Growth, Maturity, Decline on the X-axis and Sales/Profits on the Y-axis. Note that profit peaks during the Growth stage!',
          questionType: 'Diagram-Driven University Question',
        },
      ],
    },
  ],

  // ── 4. Organizational Behaviour (Sem 2) ──
  'bba-karnataka-ob': [
    {
      id: 'ob-mod3-motivation-theories',
      subjectId: 'bba-karnataka-ob',
      title: 'Motivation Models: Maslow, Herzberg Two-Factor & Vroom',
      moduleNumber: 3,
      moduleName: 'Module 3: Motivation, Morale & Work Design',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-ob-01'],
      subtopics: [
        'Concept of Motivation and the Motivation Cycle',
        "Maslow's Hierarchy of Needs (Physiological to Self-Actualization)",
        "Herzberg's Two-Factor (Motivation-Hygiene) Theory",
        "McGregor's Theory X and Theory Y Assumptions",
        "Vroom's Expectancy Theory (Expectancy x Instrumentality x Valence)",
      ],
      explanationMd: `# Motivation Theories: Maslow Hierarchy, Herzberg Two-Factor & Vroom

### Core Concept & University Framework
Organizational Behaviour (KSHEC NEP BBA Semester 2) investigates what drives human productivity in enterprises. Motivation is the psychological force that determines the direction, intensity, and persistence of employee effort.

---

### 1. Maslow's Need Hierarchy
1. **Physiological Needs**: Basic survival (adequate salary, canteen, basic work environment).
2. **Safety/Security Needs**: Job tenure security, provident fund, medical insurance.
3. **Social / Belongingness Needs**: Team camaraderie, supportive peer relationships.
4. **Esteem Needs**: Job titles, recognition, awards, promotion.
5. **Self-Actualization Needs**: Creative challenge, achieving full personal potential.

*Core Premise*: A substantially satisfied need ceases to motivate; higher-level needs emerge sequentially.

---

### 2. Herzberg's Two-Factor Theory (Motivation-Hygiene)
Herzberg proposed that job satisfaction and job dissatisfaction are **not** opposite ends of the same continuum:
- **Hygiene Factors (Extrinsic)**: Working conditions, salary, company policies, supervision, interpersonal relations. If absent, they cause dissatisfaction; if present, they produce neutral feelings (*no dissatisfaction*), not high motivation.
- **Motivator Factors (Intrinsic)**: Achievement, recognition, challenging work, responsibility, advancement. These directly cause genuine motivation and superior performance.

---

### 3. Vroom's Expectancy Theory
$$\\text{Motivation} = \\text{Expectancy} \\times \\text{Instrumentality} \\times \\text{Valence}$$
If any single component is zero, total motivational drive collapses to zero!`,
      formulas: [
        {
          id: 'formula-ob-1',
          label: "Vroom's Expectancy Motivation Formulation",
          formula: 'Motivational Force = Expectancy (E -> P) * Instrumentality (P -> R) * Valence (Value of Reward)',
          exampleQ: 'An employee believes studying hard for an exam will yield high marks (Expectancy = 0.9), but knows the university grading system assigns random grades regardless of performance (Instrumentality = 0.05). Will the student be motivated?',
          exampleA: 'Motivational force = 0.9 * 0.05 * Valence ≈ negligible. Low instrumentality collapses motivation.',
        },
      ],
      tricks: [
        {
          id: 'trick-ob-1',
          title: 'Herzberg Hygiene Trap',
          trick: 'Salary is a HYGIENE factor in Herzberg theory, NOT a motivator! Higher salary only removes dissatisfaction; it does not intrinsically motivate long-term peak performance.',
          whenToUse: 'Universal trap in multiple-choice and 2-mark university questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ob-1',
          step: 'Step 1: Differentiate Content vs. Process Theories of Motivation',
          detail: 'Categorize Maslow, Herzberg, and McClelland as Content theories (WHAT motivates); categorize Vroom, Adam Equity, and Locke Goal-setting as Process theories (HOW motivation occurs).',
          questionType: 'Comparative Theory Essay Question',
        },
      ],
    },
  ],

  // ── 5. Business Mathematics & Quantitative Techniques (Sem 2) ──
  'bba-karnataka-math': [
    {
      id: 'math-mod1-matrices-cramer',
      subjectId: 'bba-karnataka-math',
      title: "Matrices, Determinants & Cramer's Rule",
      moduleNumber: 1,
      moduleName: 'Module 1: Matrix Algebra & Business Applications',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      examFrequency: 'very_high',
      pyqHighlights: ['VTU Belagavi 2024 · 2 Marks', 'Bangalore Univ (BU) 2023 · 10 Marks'],
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-math-01'],
      subtopics: [
        'Matrix Types (Row, Column, Square, Identity, Transpose)',
        'Matrix Addition, Subtraction & Scalar/Matrix Multiplication',
        'Determinant of 2x2 and 3x3 Matrices & Properties',
        'Adjoint and Inverse of a Square Matrix ($A^{-1} = \\text{adj}(A) / |A|$)',
        "Solving Linear Equations using Cramer's Rule and Matrix Inversion Method",
      ],
      explanationMd: `# Matrices, Determinants & Cramer's Rule for Business Systems

### Core Concept & University Framework
Matrix algebra is essential in commercial analytics for solving multi-variable cost, production, and pricing systems simultaneously. In Semester 2 BBA under KSHEC, solving a 3-variable simultaneous equation system using **Cramer's Rule** is an almost guaranteed 10-mark examination problem.

---

### Solving Linear Equations via Cramer's Rule
Consider the system:
$$a_1 x + b_1 y + c_1 z = d_1$$
$$a_2 x + b_2 y + c_2 z = d_2$$
$$a_3 x + b_3 y + c_3 z = d_3$$

1. **Calculate the Coefficient Determinant ($\\Delta$)**:
   $$\\Delta = \\begin{vmatrix} a_1 & b_1 & c_1 \\\\ a_2 & b_2 & c_2 \\\\ a_3 & b_3 & c_3 \\end{vmatrix}$$
   *(Note: The system has a unique solution if and only if $\\Delta \\neq 0$)*.

2. **Calculate Column-Substituted Determinants ($\\Delta_x, \\Delta_y, \\Delta_z$)**:
   Replace column 1 with constant vector $(d_1, d_2, d_3)^T$ for $\\Delta_x$, column 2 for $\\Delta_y$, and column 3 for $\\Delta_z$.

3. **Compute Unknowns**:
   $$x = \\frac{\\Delta_x}{\\Delta}, \\quad y = \\frac{\\Delta_y}{\\Delta}, \\quad z = \\frac{\\Delta_z}{\\Delta}$$`,
      formulas: [
        {
          id: 'formula-cramer-1',
          label: "Cramer's Rule Solution Formula",
          formula: 'x = Det(Ax) / Det(A), y = Det(Ay) / Det(A), z = Det(Az) / Det(A)',
          exampleQ: 'Solve: 2x + y = 7, 3x - y = 8 using Cramer\'s Rule.',
          exampleA: 'Det(A) = (2)(-1) - (1)(3) = -2 - 3 = -5. Det(Ax) = (7)(-1) - (1)(8) = -15. Det(Ay) = (2)(8) - (7)(3) = 16 - 21 = -5. x = -15 / -5 = 3, y = -5 / -5 = 1.',
        },
      ],
      tricks: [
        {
          id: 'trick-cramer-1',
          title: 'Singular Matrix Condition',
          trick: 'If Det(A) = 0, STOP immediately! The matrix is singular. In university questions, state: "Determinant is 0, Cramer\'s rule cannot yield a unique solution."',
          whenToUse: 'High-frequency exam verification trick.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-cramer-1',
          step: 'Step 1: Always Write Equations in Standard Form',
          detail: 'Ensure variables appear in the identical order (ax + by + cz = d) on the left and constants on the right.',
          questionType: '10-Mark Practical Math Problem',
        },
      ],
    },
    {
      id: 'math-mod5-lpp',
      subjectId: 'bba-karnataka-math',
      title: 'Linear Programming Problems (LPP): Graphical Optimization',
      moduleNumber: 5,
      moduleName: 'Module 5: Linear Programming & Optimization',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      examFrequency: 'very_high',
      pyqHighlights: ['VTU Belagavi 2024 · 10 Marks', 'Bangalore Univ (BU) 2023 · 10 Marks'],
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-math-02'],
      subtopics: [
        'Formulation of Linear Programming Problems (Objective Function & Constraints)',
        'Feasible Region Identification using Boundary Intercept Lines',
        'Corner Point (Extreme Point) Method for Optimal Solution',
        'Special Cases: Unbounded Solutions, Infeasibility & Multiple Optima',
        'Managerial Applications in Product Mix and Transport Cost Minimization',
      ],
      explanationMd: `# Linear Programming Problems (LPP): Graphical Optimization

### Core Concept & University Framework
Linear Programming is an operations research optimization tool used to allocate limited resources (labor hours, machine capacity, raw materials) to achieve an objective (maximizing profit or minimizing cost).

---

### Step-by-Step Graphical Solution Method
1. **Formulate the LPP**:
   - Objective: Maximize $Z = c_1 x_1 + c_2 x_2$
   - Subject to: $a_{11} x_1 + a_{12} x_2 \\le b_1$, $x_1, x_2 \\ge 0$
2. **Convert Inequalities to Equalities**: Plot intercept points $(0, b_1/a_{12})$ and $(b_1/a_{11}, 0)$ on graph axes.
3. **Determine the Feasible Region**: Test origin $(0, 0)$ to establish the feasible side of each boundary line.
4. **Identify Corner Points**: Calculate coordinates $(x_1, x_2)$ of all vertices of the bounded convex polygon.
5. **Evaluate Objective Function ($Z$)**: Substitute each corner point into $Z$ to find the optimal maximum or minimum value.`,
      formulas: [
        {
          id: 'formula-lpp-1',
          label: 'LPP Standard Formulation',
          formula: 'Maximize / Minimize Z = c1*x1 + c2*x2 subject to Ax <= b and x1, x2 >= 0',
          exampleQ: 'Maximize Z = 3x + 5y subject to x + 2y <= 10, x <= 6, x, y >= 0. Find optimal solution.',
          exampleA: 'Corner points: (0, 0) -> Z=0; (6, 0) -> Z=18; (6, 2) -> Z=28; (0, 5) -> Z=25. Maximum Z = 28 at x = 6, y = 2.',
        },
      ],
      tricks: [
        {
          id: 'trick-lpp-1',
          title: 'Non-Negativity Constraint Trap',
          trick: 'Always include x, y >= 0! Feasible region is STRICTLY restricted to the First Quadrant of the Cartesian plane.',
          whenToUse: 'Deducted in 100% of LPP formulation questions if omitted.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-lpp-1',
          step: 'Step 1: Set Up an Intercepts Table for Each Constraint Line',
          detail: 'When x=0 find y; when y=0 find x. Connect both points with a straight line.',
          questionType: 'Practical LPP Graphical 10-Marker',
        },
      ],
    },
  ],

  // ── 6. Managerial Economics (Sem 2) ──
  'bba-karnataka-economics': [
    {
      id: 'eco-mod1-elasticity-demand',
      subjectId: 'bba-karnataka-economics',
      title: 'Elasticity of Demand & Revenue Implications',
      moduleNumber: 1,
      moduleName: 'Module 1: Demand Analysis & Elasticity',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-eco-01'],
      subtopics: [
        'Law of Demand and Demand Schedules',
        'Price Elasticity of Demand (Degrees: Perfectly Inelastic to Perfectly Elastic)',
        'Income Elasticity of Demand (Normal, Inferior & Giffen Goods)',
        'Cross Elasticity of Demand (Substitutes vs. Complementary Goods)',
        'Relationship between Price Elasticity, Marginal Revenue (MR), and Total Revenue (TR)',
      ],
      explanationMd: `# Elasticity of Demand & Managerial Revenue Strategy

### Core Concept & University Framework
Managerial economics bridges economic theory and business decision-making. **Price Elasticity of Demand ($E_p$)** measures the responsiveness of quantity demanded to a percentage change in the product's price.

$$\\text{Price Elasticity} (E_p) = \\frac{\\% \\Delta Q}{\\% \\Delta P} = \\frac{\\Delta Q / Q}{\\Delta P / P} = \\frac{\\Delta Q}{\\Delta P} \\times \\frac{P}{Q}$$

---

### Degrees of Price Elasticity
1. **$E_p = 0$ (Perfectely Inelastic)**: Vertical demand curve (life-saving medicines).
2. **$E_p < 1$ (Inelastic)**: Quantity changes proportionally less than price (electricity, petrol).
3. **$E_p = 1$ (Unitary Elastic)**: Percentage change in quantity exactly equals percentage change in price.
4. **$E_p > 1$ (Elastic)**: Quantity changes proportionally more than price (consumer electronics, restaurant meals).
5. **$E_p = \\infty$ (Perfectely Elastic)**: Horizontal demand curve under pure competition.

---

### Elasticity & Total Revenue (TR) Managerial Rule
- When demand is **Elastic ($E_p > 1$)**: Lowering price **increases** Total Revenue; raising price decreases TR.
- When demand is **Inelastic ($E_p < 1$)**: Raising price **increases** Total Revenue; lowering price decreases TR.
- When demand is **Unitary ($E_p = 1$)**: Total Revenue is maximized; price changes do not alter TR.`,
      formulas: [
        {
          id: 'formula-eco-1',
          label: 'Total Revenue & Elasticity Relation (Amoroso-Robinson)',
          formula: 'Marginal Revenue (MR) = Price * (1 - 1 / Ep)',
          exampleQ: 'Price is ₹50 and price elasticity is 2. What is Marginal Revenue?',
          exampleA: 'MR = 50 * (1 - 1/2) = 50 * 0.5 = ₹25.',
        },
      ],
      tricks: [
        {
          id: 'trick-eco-1',
          title: 'Cross Elasticity Sign Rule',
          trick: 'Cross Elasticity is POSITIVE (+) for Substitutes (Tea and Coffee); NEGATIVE (-) for Complements (Car and Petrol); ZERO for unrelated goods.',
          whenToUse: 'Quick identification in exam MCQs and 2-mark definitions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-eco-1',
          step: 'Step 1: Compute Percentage Changes Using Base Values',
          detail: 'Apply (% change in Q) / (% change in P). Disregard the negative sign when stating magnitude of price elasticity.',
          questionType: 'Practical Numerical Problem',
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
    {
      id: 'cost-mod4-mhr-overheads',
      subjectId: 'bba-karnataka-cost-accounting',
      title: 'Overhead Allocation & Machine Hour Rate (MHR)',
      moduleNumber: 4,
      moduleName: 'Module 4: Overhead Accounting & Machine Hour Rate',
      order: 3,
      difficulty: 'advanced',
      tier: 'free',
      status: 'published',
      examFrequency: 'very_high',
      pyqHighlights: ['Bangalore Univ (BU) 2024 · 10 Marks', 'Mysore Univ (UOM) 2023 · 10 Marks', 'BCU 2022 · 10 Marks'],
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-cost-03'],
      subtopics: [
        'Overhead Classification: Production, Administration, Selling & Distribution',
        'Primary and Secondary Overhead Distribution (Repeated Distribution & Simultaneous Equations)',
        'Concept of Machine Hour Rate (MHR): Comprehensive vs Simple Rate',
        'Standing (Fixed) Charges vs Machine (Variable) Expenses',
        'Treatment of Setting-Up Time, Power, Depreciation and Repairs',
      ],
      explanationMd: `# Overhead Allocation & Machine Hour Rate (MHR) Computation

### Core Concept & University Framework
In mechanized industrial settings (e.g. Peenya and Bommasandra industrial zones in Bengaluru), production overheads are predominantly absorbed on the basis of **Machine Hour Rate (MHR)**—the cost of running a machine for one operating hour.

Under Karnataka State Higher Education Council (KSHEC) NEP Sem-3 examinations, calculating **Machine Hour Rate** is a recurring 10-mark practical problem.

---

### Classification of Machine Expenses
1. **Standing (Fixed) Charges**:
   - Rent & Rates (allocated on floor area occupied by machine).
   - Heating and Lighting (allocated on light points or floor area).
   - Insurance of machine and supervision salaries.
   - Lubricating oil, consumable stores, and attendant wages.
   $$\\text{Standing Charges Per Hour} = \\frac{\\text{Total Standing Charges}}{\\text{Total Productive Machine Hours}}$$

2. **Machine (Variable) Expenses**:
   - **Depreciation Per Hour**:
     $$\\text{Depreciation} = \\frac{\\text{Cost of Machine} - \\text{Scrap Value}}{\\text{Total Working Life in Hours}}$$
   - **Repairs & Maintenance Per Hour**:
     $$\\text{Repairs} = \\frac{\\text{Total Estimated Life Repairs}}{\\text{Total Working Life in Hours}}$$
   - **Power Charges Per Hour**:
     $$\\text{Power} = \\text{Units Consumed per Hour} \\times \\text{Rate per Power Unit}$$`,
      formulas: [
        {
          id: 'formula-mhr-1',
          label: 'Machine Hour Rate (MHR) Composite Formula',
          formula: 'MHR = (Total Standing Charges / Effective Hours) + Depreciation/Hr + Repairs/Hr + Power/Hr',
          exampleQ: 'Machine cost ₹1,00,000, scrap value ₹10,000, working life 18,000 hours. Effective hours per year = 2,000. Annual standing charges = ₹4,000. Power = 5 units/hr at ₹2/unit. Repairs = ₹1,800/yr. Compute MHR.',
          exampleA: 'Standing = 4,000 / 2,000 = ₹2.00/hr. Depreciation = (1,00,000 - 10,000) / 18,000 = ₹5.00/hr. Repairs = 1,800 / 2,000 = ₹0.90/hr. Power = 5 * 2 = ₹10.00/hr. Total MHR = 2.00 + 5.00 + 0.90 + 10.00 = ₹17.90 per hour.',
        },
      ],
      tricks: [
        {
          id: 'trick-mhr-1',
          title: 'Effective Productive Hours Trap',
          trick: 'Always subtract Non-Productive Setting-Up Time from total hours! If setting-up time is productive, divide by total hours. If unproductive, divide by Net Operating Hours.',
          whenToUse: 'Tested in 95% of 10-mark university numericals.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-mhr-1',
          step: 'Step 1: Calculate Effective Machine Operating Hours First',
          detail: 'Total Annual Hours minus Unproductive Idle Time and Routine Maintenance Time.',
          questionType: 'Practical Overhead Numerical 10-Marker',
        },
        {
          id: 'solve-mhr-2',
          step: 'Step 2: Group Expenses into Standing Charges vs Machine Expenses',
          detail: 'Total all annual standing charges and divide by effective hours; compute variable items directly per hour.',
          questionType: 'Practical Overhead Numerical 10-Marker',
        },
      ],
    },
  ],

  // ── 8. Business Statistics (Sem 3) ──
  'bba-karnataka-statistics': [
    {
      id: 'stat-mod2-dispersion',
      subjectId: 'bba-karnataka-statistics',
      title: 'Measures of Dispersion: Standard Deviation & Coefficient of Variation (CV)',
      moduleNumber: 2,
      moduleName: 'Module 2: Measures of Dispersion & Skewness',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      examFrequency: 'very_high',
      pyqHighlights: ['Bangalore Univ (BU) 2024 · 10 Marks', 'Mysore Univ (UOM) 2023 · 10 Marks'],
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-stat-02'],
      subtopics: [
        'Absolute vs. Relative Measures of Dispersion',
        'Standard Deviation ($\\sigma$) for Discrete & Continuous Series',
        'Variance ($\\sigma^2$) and Mathematical Properties',
        'Coefficient of Variation (CV) for Consistency & Stability Comparisons',
        'Combined Standard Deviation of Two Groups',
      ],
      explanationMd: `# Measures of Dispersion: Standard Deviation & Coefficient of Variation (CV)

### Core Concept & University Framework
While central tendency (mean, median) indicates the central location of data, dispersion measures the extent of scatter or variation around the average. In university exams, **Coefficient of Variation (CV)** is used to compare the stability and consistency of two business entities (e.g. comparing share price stability or sales consistency).

---

### Standard Deviation ($\\sigma$)
For grouped frequency distributions:
$$\\sigma = \\sqrt{\\frac{\\sum f d^2}{N} - \\left( \\frac{\\sum f d}{N} \\right)^2} \\times c$$

---

### Coefficient of Variation (CV)
$$\\text{CV (\\%)} = \\frac{\\sigma}{\\bar{X}} \\times 100$$
- **Managerial Decision Rule**:
  - The series with the **LOWER CV** is more **consistent, uniform, and stable**.
  - The series with the **HIGHER CV** is more **variable, erratic, or risky**.`,
      formulas: [
        {
          id: 'formula-disp-1',
          label: 'Coefficient of Variation (CV)',
          formula: 'CV (%) = (Standard Deviation / Mean) * 100',
          exampleQ: 'Factory A: Mean wage ₹500, SD = ₹25. Factory B: Mean wage ₹600, SD = ₹36. Which factory has greater uniformity in wages?',
          exampleA: 'CV(A) = (25 / 500) * 100 = 5%. CV(B) = (36 / 600) * 100 = 6%. Factory A has lower CV, hence greater uniformity.',
        },
      ],
      tricks: [
        {
          id: 'trick-disp-1',
          title: 'Consistency vs Variability Decision Trap',
          trick: 'Lower CV = More Consistent / Stable. Higher CV = More Variable / Risky. Double check what the exam asks: "more consistent" or "more variable"!',
          whenToUse: 'High-frequency exam mistake in comparative analysis.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-disp-1',
          step: 'Step 1: Compute Mean and SD for Both Series Separately',
          detail: 'Construct calculation tables for Series A and Series B, calculate CV for each, and state the concluding interpretation.',
          questionType: 'Practical Statistics 10-Marker',
        },
      ],
    },
    {
      id: 'stat-mod3-correlation-regression',
      subjectId: 'bba-karnataka-statistics',
      title: 'Correlation & Linear Regression Equations',
      moduleNumber: 3,
      moduleName: 'Module 3: Correlation & Regression Analysis',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      examFrequency: 'very_high',
      pyqHighlights: ['Bangalore Univ (BU) 2024 · 10 Marks', 'Mysore Univ (UOM) 2023 · 5 Marks'],
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-stat-01'],
      subtopics: [
        'Types of Correlation (Positive, Negative, Linear, Non-Linear)',
        'Karl Pearson Coefficient of Correlation ($r$) Computation',
        'Spearman Rank Correlation (With & Without Ties)',
        'Regression Equations ($Y$ on $X$ and $X$ on $Y$)',
        'Properties of Regression Coefficients ($b_{yx} \\times b_{xy} = r^2$)',
      ],
      explanationMd: `# Karl Pearson Correlation & Linear Regression Analysis

### Core Concept & University Framework
Business Statistics in Karnataka BBA evaluates quantitative associations between commercial variables (e.g. Advertising Expenditure vs. Sales Revenue).

---

### Karl Pearson Correlation Coefficient ($r$)
$$r = \\frac{N \\sum XY - (\\sum X)(\\sum Y)}{\\sqrt{[N \\sum X^2 - (\\sum X)^2][N \\sum Y^2 - (\\sum Y)^2]}}$$
- Ranges strictly between $-1 \\le r \\le +1$.
- $+1$: Perfect positive linear correlation; $-1$: Perfect negative correlation; $0$: No linear relationship.

---

### Regression Lines & Coefficients
1. **Regression Line of $Y$ on $X$**:
   $$Y - \\bar{Y} = b_{yx} (X - \\bar{X})$$
   *Where $b_{yx} = r \\frac{\\sigma_y}{\\sigma_x}$*

2. **Regression Line of $X$ on $Y$**:
   $$X - \\bar{X} = b_{xy} (Y - \\bar{Y})$$
   *Where $b_{xy} = r \\frac{\\sigma_x}{\\sigma_y}$*

3. **Key Property**:
   $$r = \\pm \\sqrt{b_{yx} \\times b_{xy}}$$
   *(Both regression coefficients and $r$ must always share the identical algebraic sign!)*`,
      formulas: [
        {
          id: 'formula-stat-1',
          label: 'Correlation Coefficient via Regression Slopes',
          formula: 'r = sqrt(byx * bxy)',
          exampleQ: 'If byx = 0.8 and bxy = 0.45, find correlation coefficient r.',
          exampleA: 'r = sqrt(0.8 * 0.45) = sqrt(0.36) = 0.60. (Positive because both slopes are positive).',
        },
      ],
      tricks: [
        {
          id: 'trick-stat-1',
          title: 'Sign Consistency Trap',
          trick: 'If byx is negative and bxy is negative, r is ALSO NEGATIVE! Never output a positive correlation when both slopes are negative.',
          whenToUse: 'Common exam trap in 2-mark viva and MCQ questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-stat-1',
          step: 'Step 1: Set Up 5 Summary Columns in Tabular Format',
          detail: 'Columns: X, Y, X^2, Y^2, XY. Sum each column before substituting into Karl Pearson formula.',
          questionType: 'Practical Statistics 10-Marker',
        },
      ],
    },
  ],

  // ── 9. Financial Markets & Services (Sem 3) ──
  'bba-karnataka-fin-markets': [
    {
      id: 'fm-mod2-money-market',
      subjectId: 'bba-karnataka-fin-markets',
      title: 'Money Market Instruments: T-Bills, CPs & CDs',
      moduleNumber: 2,
      moduleName: 'Module 2: Indian Money Market & RBI Monetary Tools',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-fm-01'],
      subtopics: [
        'Structure and Functions of the Indian Money Market',
        'Treasury Bills (91-day, 182-day, 364-day T-Bills issued by RBI)',
        'Commercial Papers (CP) Eligibility, Tenor & Corporate Working Capital',
        'Certificates of Deposit (CD) Issued by Commercial Banks',
        'Call & Notice Money Market and Repo / Reverse Repo Operations',
      ],
      explanationMd: `# Indian Money Market Instruments: T-Bills, Commercial Paper & CDs

### Core Concept & University Framework
The **Money Market** deals in short-term debt instruments having a maturity period of up to one year. Regulated by the Reserve Bank of India (RBI), it enables corporations and financial institutions to manage liquidity deficits and surpluses efficiently.

---

### Major Money Market Instruments
1. **Treasury Bills (T-Bills)**:
   - Issued by the RBI on behalf of the Central Government to fund short-term fiscal deficits.
   - Zero-coupon securities issued at a discount and redeemed at par (face value).
   - Standard maturities: 91 days, 182 days, and 364 days.
   - Minimum denomination: ₹25,000 and multiples thereof.

2. **Commercial Paper (CP)**:
   - Unsecured promissory note issued by highly-rated corporations (credit rating A2 or higher).
   - Maturity: Minimum 7 days to maximum 1 year.
   - Denomination: ₹5 lakhs and multiples thereof.

3. **Certificates of Deposit (CD)**:
   - Negotiable money market receipt issued by commercial banks against term deposits.
   - Maturity for banks: 7 days to 1 year; for financial institutions: 1 to 3 years.`,
      formulas: [
        {
          id: 'formula-fm-1',
          label: 'T-Bill Yield / Discount Formulation',
          formula: 'Yield (%) = ((Face Value - Issue Price) / Issue Price) * (365 / Tenor) * 100',
          exampleQ: 'A 91-day T-Bill of face value ₹100 is issued at ₹98. Calculate the annualized yield.',
          exampleA: 'Yield = ((100 - 98) / 98) * (365 / 91) * 100 = (2 / 98) * 4.011 * 100 = 8.18% p.a.',
        },
      ],
      tricks: [
        {
          id: 'trick-fm-1',
          title: 'CP vs CD Issuer Rule',
          trick: 'Commercial Paper is issued by CORPORATIONS. Certificates of Deposit are issued by COMMERCIAL BANKS.',
          whenToUse: 'Enables instant accuracy in viva and 2-mark definitions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-fm-1',
          step: 'Step 1: Compare Instruments Across 4 Dimensions',
          detail: 'Tabulate Issuer, Minimum Denomination, Maturity Tenor, and Regulatory Guidelines for full marks.',
          questionType: 'Comparative Essay / 10-Marker',
        },
      ],
    },
  ],

  // ── 10. Business Law & Commercial Regulations (Sem 4) ──
  'bba-karnataka-business-law': [
    {
      id: 'law-mod1-contract-essentials',
      subjectId: 'bba-karnataka-business-law',
      title: 'Indian Contract Act 1872: Essentials of a Valid Contract',
      moduleNumber: 1,
      moduleName: 'Module 1: General Principles of Contract Law',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-law-01'],
      subtopics: [
        'Definition of Agreement vs. Contract (Section 2(h))',
        'Essentials of a Valid Contract under Section 10',
        'Offer & Acceptance Rules and Revocation Timelines',
        'Consideration ("Quid Pro Quo") & Exceptions to "No Consideration, No Contract"',
        'Flaws in Free Consent: Coercion, Undue Influence, Fraud, Misrepresentation, Mistake',
      ],
      explanationMd: `# Indian Contract Act 1872: Essentials of a Valid Contract

### Core Concept & University Framework
Section 2(h) of the Indian Contract Act 1872 defines a contract as:
$$\\text{Contract} = \\text{Agreement} + \\text{Enforceability by Law}$$

All contracts are agreements, but all agreements are not contracts (e.g. social or domestic agreements lack intention to create legal relations, as held in *Balfour v. Balfour*).

---

### Section 10: Mandatory Essentials of a Valid Contract
1. **Proper Offer and Acceptance**: Definite offer matched by unconditional acceptance.
2. **Intention to Create Legal Relations**: Commercial presumption of legal obligation.
3. **Lawful Consideration**: Price paid for the promise (*Quid Pro Quo*), whether in cash, goods, or forbearance.
4. **Capacity of Parties**: Competent age of majority (18+), sound mind, not disqualified by law. An agreement with a minor is **void ab initio** (*Mohori Bibee v. Dharmodas Ghose*).
5. **Free Consent (Section 14)**: Consent must not be induced by Coercion (Sec 15), Undue Influence (Sec 16), Fraud (Sec 17), Misrepresentation (Sec 18), or Bilateral Mistake of Fact (Sec 20).
6. **Lawful Object & Consideration**: Not prohibited by law, immoral, or opposed to public policy.
7. **Certainty and Possibility of Performance**: Terms must be clear, not vague or impossible.`,
      formulas: [
        {
          id: 'formula-law-1',
          label: 'Legal Enforceability Formulation',
          formula: 'Valid Contract = Offer + Acceptance + Lawful Consideration + Free Consent + Competence + Legal Object',
          exampleQ: 'A father promises to pay his daughter ₹10,000 monthly allowance for pocket expenses. Can the daughter sue her father in court if he stops paying?',
          exampleA: 'No. Domestic/family arrangements lack intention to create legal relations (Balfour v. Balfour doctrine); hence it is a mere agreement, not an enforceable contract.',
        },
      ],
      tricks: [
        {
          id: 'trick-law-1',
          title: 'Minor Contract Rule',
          trick: 'Agreements with minors are VOID AB INITIO (void from the very beginning). Doctrine of Estoppel and Ratification do not apply against minors!',
          whenToUse: 'Universal legal case study question in every Karnataka university exam.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-law-1',
          step: 'Step 1: Cite the Relevant Section and Landmark Case Precedent',
          detail: 'Start legal answers with: "Under Section X of the Indian Contract Act 1872, as affirmed in [Case Name]..."',
          questionType: 'Legal Case Study Analysis',
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
      examFrequency: 'very_high',
      pyqHighlights: ['Bangalore Univ (BU) 2024 · 5 Marks', 'Mysore Univ (UOM) 2023 · 10 Marks'],
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
    {
      id: 'fin-mod3-capital-budgeting',
      subjectId: 'bba-karnataka-fin-mgmt',
      title: 'Capital Budgeting: Net Present Value (NPV), Payback & Profitability Index (PI)',
      moduleNumber: 3,
      moduleName: 'Module 3: Investment Decisions & Capital Budgeting',
      order: 2,
      difficulty: 'advanced',
      tier: 'free',
      status: 'published',
      examFrequency: 'very_high',
      pyqHighlights: ['Bangalore Univ (BU) 2024 · 10 Marks', 'Mysore Univ (UOM) 2023 · 10 Marks', 'VTU 2022 · 10 Marks'],
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-fin-02'],
      subtopics: [
        'Nature and Significance of Capital Budgeting Evaluation',
        'Discounted Cash Flow (DCF) vs Non-Discounted Methods',
        'Payback Period (PBP) and Accounting Rate of Return (ARR)',
        'Net Present Value (NPV) Decision Rule and Discounting Mechanics',
        'Internal Rate of Return (IRR) & Profitability Index (PI / Benefit-Cost Ratio)',
      ],
      explanationMd: `# Capital Budgeting: Net Present Value (NPV), Payback & Profitability Index (PI)

### Core Concept & University Framework
Capital Budgeting involves planning and evaluating long-term capital investments whose returns extend beyond one fiscal year. In KSHEC NEP BBA Semester 4 examinations, calculating project feasibility using **NPV, IRR, and Payback Period** is a recurring 10-mark problem.

---

### Key Evaluation Techniques
1. **Net Present Value (NPV)**:
   $$\\text{NPV} = \\sum_{t=1}^{n} \\frac{C_t}{(1 + k)^t} - C_0$$
   - Decision Rule: Accept if $\\text{NPV} > 0$; Reject if $\\text{NPV} < 0$. If mutually exclusive, choose highest positive NPV.
2. **Profitability Index (PI / Benefit-Cost Ratio)**:
   $$\\text{PI} = \\frac{\\text{Present Value of Future Cash Inflows}}{\\text{Initial Cash Outlay } (C_0)}$$
   - Decision Rule: Accept if $\\text{PI} > 1.0$.
3. **Payback Period (PBP)**:
   Time required for cumulative cash inflows to equal the initial capital outlay:
   $$\\text{Payback Period} = \\frac{\\text{Initial Investment}}{\\text{Annual Constant Cash Inflow}}$$`,
      formulas: [
        {
          id: 'formula-capbud-1',
          label: 'Net Present Value (NPV) Formula',
          formula: 'NPV = (PV of Inflows) - (Initial Outlay)',
          exampleQ: 'Project costs ₹2,00,000 and generates net annual inflows of ₹70,000 for 4 years. Discount rate is 10% (PVIFA at 10% for 4 yrs = 3.1699). Calculate NPV and PI.',
          exampleA: 'PV of Inflows = 70,000 * 3.1699 = ₹2,21,893. NPV = 2,21,893 - 2,00,000 = +₹21,893 (Accept). PI = 2,21,893 / 2,00,000 = 1.109 (Accept).',
        },
      ],
      tricks: [
        {
          id: 'trick-capbud-1',
          title: 'Cash Flow vs Accounting Profit Trap',
          trick: 'In Capital Budgeting, ALWAYS use Cash Inflow after Tax before Depreciation (CFAT = Net Profit after Tax + Depreciation)! Never discount accounting profit.',
          whenToUse: 'Most frequent deduction trap in 10-mark university numericals.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-capbud-1',
          step: 'Step 1: Convert Net Profit to CFAT First',
          detail: 'Add back non-cash depreciation to Net Profit after Tax: CFAT = NPAT + Dep.',
          questionType: 'Practical Capital Budgeting 10-Marker',
        },
      ],
    },
  ],

  // ── 12. Human Resource Management (Sem 4) ──
  'bba-karnataka-hrm': [
    {
      id: 'hrm-mod2-job-analysis',
      subjectId: 'bba-karnataka-hrm',
      title: 'Job Analysis: Job Description (JD) & Job Specification (JS)',
      moduleNumber: 2,
      moduleName: 'Module 2: Human Resource Planning & Talent Acquisition',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-hrm-01'],
      subtopics: [
        'Concept, Process and Purpose of Job Analysis',
        'Job Description (JD: Duties, Tasks, Responsibilities & Working Conditions)',
        'Job Specification (JS: Human Qualifications, Skills, Experience & Traits)',
        'Job Design Approaches: Job Enlargement, Job Enrichment, Job Rotation',
        'Methods of Collecting Job Analysis Data (Observation, Interview, PAQ)',
      ],
      explanationMd: `# Job Analysis: Job Description (JD) vs. Job Specification (JS)

### Core Concept & University Framework
**Job Analysis** is the systematic procedure of collecting, analyzing, and recording comprehensive information about the operations, responsibilities, and required human qualifications of a specific job role.

---

### The Two Major Outputs of Job Analysis
1. **Job Description (JD — Role Centric)**:
   - A written statement of what the job holder actually does, how it is done, and under what conditions.
   - Includes: Job title, department, duties, responsibilities, reporting relationships, machine equipment used, working hazards.
2. **Job Specification (JS — Person Centric)**:
   - A statement of the minimum acceptable human qualities and credentials required to perform the job successfully.
   - Includes: Educational degrees, technical certifications, prior years of experience, cognitive abilities, emotional temperament.`,
      formulas: [
        {
          id: 'formula-hrm-1',
          label: 'Job Analysis Relationship Equation',
          formula: 'Job Analysis = Job Description (Role Focus) + Job Specification (Person Focus)',
          exampleQ: 'A recruitment ad specifies: "Must hold BBA with 2 years experience in Tally Prime." Is this JD or JS?',
          exampleA: 'Job Specification (JS) because it outlines candidate qualifications and credentials.',
        },
      ],
      tricks: [
        {
          id: 'trick-hrm-1',
          title: 'JD vs JS Distinction Mnemonic',
          trick: 'JD = What the Job DOES (duties, tasks). JS = What the Person SHOULD HAVE (skills, qualifications).',
          whenToUse: 'Differentiates the two components in 5-mark university answers.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-hrm-1',
          step: 'Step 1: Draft a Comparative Two-Column Table',
          detail: 'Compare Meaning, Focus, Contents, and Purpose side by side for maximum university credit.',
          questionType: 'Comparative Essay / 10-Marker',
        },
      ],
    },
  ],

  // ── 13. Management Accounting (Sem 5) ──
  'bba-karnataka-mgmt-accounting': [
    {
      id: 'mgmtacc-mod3-marginal-costing',
      subjectId: 'bba-karnataka-mgmt-accounting',
      title: 'Marginal Costing: P/V Ratio, BEP & Margin of Safety',
      moduleNumber: 3,
      moduleName: 'Module 3: Marginal Costing & Decision Models',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-mgmtacc-01'],
      subtopics: [
        'Concept of Marginal Cost and Marginal Cost Equation ($S - V = F + P$)',
        'Profit-Volume (P/V) Ratio Computation and Significance',
        'Break-Even Point (BEP in Units and Value)',
        'Margin of Safety (MOS in Units and Value)',
        'Managerial Decision Scenarios: Make or Buy, Product Mix Optimization',
      ],
      explanationMd: `# Marginal Costing: P/V Ratio, Break-Even Point (BEP) & Margin of Safety

### Core Concept & University Framework
Marginal Costing is a managerial technique that distinguishes between fixed costs and variable costs. Fixed costs are treated as period costs charged against contribution, making it indispensable for short-term pricing, volume planning, and make-or-buy decisions.

---

### Core Marginal Costing Formulations
1. **Marginal Cost Equation**:
   $$\\text{Sales} (S) - \\text{Variable Cost} (V) = \\text{Contribution} (C) = \\text{Fixed Cost} (F) + \\text{Profit} (P)$$

2. **Profit-Volume Ratio (P/V Ratio)**:
   $$\\text{P/V Ratio} = \\frac{\\text{Contribution}}{\\text{Sales}} \\times 100 = \\frac{\\Delta \\text{Profit}}{\\Delta \\text{Sales}} \\times 100$$

3. **Break-Even Point (BEP)**:
   $$\\text{BEP (Units)} = \\frac{\\text{Fixed Cost}}{\\text{Contribution per Unit}}$$
   $$\\text{BEP (Value ₹)} = \\frac{\\text{Fixed Cost}}{\\text{P/V Ratio}}$$

4. **Margin of Safety (MOS)**:
   $$\\text{MOS (Value ₹)} = \\text{Actual Sales} - \\text{Break-Even Sales} = \\frac{\\text{Profit}}{\\text{P/V Ratio}}$$`,
      formulas: [
        {
          id: 'formula-bep-1',
          label: 'P/V Ratio Two-Period Change Formula',
          formula: 'P/V Ratio = (Change in Profit / Change in Sales) * 100',
          exampleQ: 'Year 2024: Sales ₹3,00,000, Profit ₹30,000. Year 2025: Sales ₹4,00,000, Profit ₹50,000. Find P/V Ratio and Fixed Cost.',
          exampleA: 'P/V Ratio = (50,000 - 30,000) / (4,00,000 - 3,00,000) * 100 = 20,000 / 1,00,000 * 100 = 20%. Fixed Cost = (3,00,000 * 20%) - 30,000 = 60,000 - 30,000 = ₹30,000.',
        },
      ],
      tricks: [
        {
          id: 'trick-bep-1',
          title: 'Profit Formula via MOS',
          trick: 'Profit ALWAYS equals Margin of Safety x P/V Ratio! No need to calculate full contribution or fixed costs if MOS is known.',
          whenToUse: 'Enables 10-second solutions in university exams.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-bep-1',
          step: 'Step 1: Compute P/V Ratio as the First Calculation',
          detail: 'P/V Ratio unlocks BEP, Required Sales for Desired Profit, and MOS in seconds.',
          questionType: 'Practical Management Accounting 10-Marker',
        },
      ],
    },
  ],

  // ── 14. Income Tax - I (Sem 5) ──
  'bba-karnataka-income-tax-1': [
    {
      id: 'tax1-mod2-residential-status',
      subjectId: 'bba-karnataka-income-tax-1',
      title: 'Residential Status & Scope of Total Income (Section 6)',
      moduleNumber: 2,
      moduleName: 'Module 2: Residential Status & Tax Incidence',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-tax-01'],
      subtopics: [
        'Assessment Year (AY) vs. Previous Year (PY) Definitions',
        'Basic Conditions for Determining Resident Status (Sec 6(1))',
        'Additional Conditions for Resident & Ordinarily Resident (ROR vs. RNOR)',
        'Residential Status of Hindu Undivided Family (HUF) and Companies',
        'Incidence of Tax: Global vs. Indian Income Scope Matrix',
      ],
      explanationMd: `# Residential Status & Scope of Total Income (Section 6)

### Core Concept & University Framework
Under the Indian Income Tax Act 1961, tax incidence depends upon the **residential status** of an assessee during the relevant Previous Year, regardless of their nationality or citizenship.

---

### Step 1: Basic Conditions for an Individual (Sec 6(1))
An individual is a **Resident in India** if they satisfy ANY ONE of the following basic conditions:
- **Condition A**: Stay in India for **182 days or more** during the relevant Previous Year, OR
- **Condition B**: Stay in India for **60 days or more** in the relevant Previous Year AND **365 days or more** during the 4 preceding Previous Years.

*(Note: The 60-day threshold is expanded to 182 days for Indian citizens leaving India for employment abroad).*

---

### Step 2: Additional Conditions for ROR vs RNOR (Sec 6(6))
A resident individual is **Resident & Ordinarily Resident (ROR)** if they satisfy **BOTH**:
1. Resident in India in at least **2 out of 10** preceding Previous Years, AND
2. Present in India for at least **730 days** in the **7 preceding** Previous Years.

If either condition fails, the assessee is **Resident but Not Ordinarily Resident (RNOR)**.

---

### Tax Incidence Matrix
| Category of Income | ROR | RNOR | Non-Resident (NR) |
|---|---|---|---|
| Income received or accrued in India | Taxable | Taxable | Taxable |
| Income accruing abroad from a business controlled from India | Taxable | Taxable | Not Taxable |
| Income accruing abroad from business outside India | Taxable | Not Taxable | Not Taxable |`,
      formulas: [
        {
          id: 'formula-tax-1',
          label: '730-Day Rule Formulation',
          formula: 'ROR Status = Basic Condition (182 days or 60+365) AND Both Additional (2 of 10 yrs + 730 days in 7 yrs)',
          exampleQ: 'An individual was in India for 190 days in PY 2025-26, and 800 days during the preceding 7 years. Resident status?',
          exampleA: 'Resident (satisfies 182-day condition) and Ordinarily Resident (satisfies 730 days in 7 years).',
        },
      ],
      tricks: [
        {
          id: 'trick-tax-1',
          title: 'Citizenship vs Residence Distinction',
          trick: 'An Indian citizen can be a NON-RESIDENT for tax purposes; a foreign citizen can be an ORDINARILY RESIDENT in India!',
          whenToUse: 'Avoids conceptual confusion in direct tax viva questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-tax-1',
          step: 'Step 1: Test Basic Condition A (182 Days) First',
          detail: 'If stay >= 182 days, immediately conclude Resident, then proceed to test the two additional conditions.',
          questionType: 'Practical Tax Problem / 10-Marker',
        },
      ],
    },
    {
      id: 'tax1-mod3-salary-hra',
      subjectId: 'bba-karnataka-income-tax-1',
      title: 'Income from Salaries: HRA Exemption (Sec 10(13A)) & Standard Deduction',
      moduleNumber: 3,
      moduleName: 'Module 3: Income from Salaries & Allowances',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      examFrequency: 'very_high',
      pyqHighlights: ['Bangalore Univ (BU) 2024 · 10 Marks', 'BCU 2023 · 10 Marks', 'UOM 2023 · 10 Marks'],
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-tax-02'],
      subtopics: [
        'Definition of Salary and Employer-Employee Relationship',
        'House Rent Allowance (HRA) Exemption Formula under Section 10(13A) & Rule 2A',
        'Salary Definition for HRA (Basic Salary + DA forming part + Fixed % Turnover Commission)',
        'Standard Deduction under Section 16(ia) & Professional Tax u/s 16(iii)',
        'Computation of Net Taxable Income from Salaries (Old vs New Regime)',
      ],
      explanationMd: `# Income from Salaries: House Rent Allowance (HRA) Exemption

### Core Concept & University Framework
Under Section 10(13A) of the Income Tax Act 1961 read with Rule 2A, House Rent Allowance (HRA) granted to an employee to meet rent expenditure for residential accommodation is exempt up to a statutory ceiling limit.

---

### Section 10(13A) Three-Tier Exemption Rule
The amount of HRA exempt from income tax is the **LEAST** of the following three amounts:
1. **Actual HRA received** from employer during the financial year.
2. **Rent paid minus 10% of Salary** for the relevant accommodation period:
   $$\\text{Rent Paid} - (0.10 \\times \\text{Salary})$$
3. **Statutory Location Percentage**:
   - **50% of Salary** if accommodation is situated in the 4 Metro Cities: **Mumbai, Kolkata, Delhi, Chennai**.
   - **40% of Salary** in any other city (including **Bengaluru, Mysuru, Mangaluru, Hubballi**).

---

### Salary for HRA Purposes
$$\\text{Salary for HRA} = \\text{Basic Pay} + \\text{Dearness Allowance (Enter into Retirement Benefits)} + \\text{Commission on Turnover (Fixed \\%)}$$

---

### Deductions from Gross Salary under Section 16
1. **Standard Deduction (Sec 16(ia))**: Flat **₹50,000** (or actual salary, whichever is less).
2. **Entertainment Allowance (Sec 16(ii))**: Available to government employees only.
3. **Professional Tax (Sec 16(iii))**: Actual amount paid under Karnataka Tax on Professions Act (max ₹2,400/yr).`,
      formulas: [
        {
          id: 'formula-hra-1',
          label: 'HRA Exemption Formula (Sec 10(13A))',
          formula: 'Exempt HRA = Min(Actual HRA, Rent Paid - 10% Salary, 40% or 50% Salary)',
          exampleQ: 'Employee in Bengaluru receives Basic ₹40,000/month, HRA ₹12,000/month, and pays rent of ₹15,000/month in Koramangala. DA is ₹10,000/month (not forming part of retirement). Calculate taxable HRA.',
          exampleA: 'Salary for HRA = Basic ₹4,80,000 (DA excluded because not forming part). 1) Actual HRA = ₹1,44,000; 2) Rent paid - 10% salary = (15,000 * 12) - 48,000 = 1,80,000 - 48,000 = ₹1,32,000; 3) 40% of salary (Bengaluru is non-metro for tax) = ₹1,92,000. Least amount = ₹1,32,000 exempt. Taxable HRA = 1,44,000 - 1,32,000 = ₹12,000.',
        },
      ],
      tricks: [
        {
          id: 'trick-hra-1',
          title: 'Bengaluru Metro Classification Trap',
          trick: 'For HRA Section 10(13A), Bengaluru is 40% (NON-METRO)! Only Mumbai, Delhi, Kolkata, and Chennai qualify for 50%.',
          whenToUse: 'Tested in every single Karnataka university direct tax paper.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-hra-1',
          step: 'Step 1: Check DA Terms Before Calculating Salary for HRA',
          detail: 'Only add DA if the question explicitly states "forming part of salary for retirement benefits" or "considered for PF".',
          questionType: 'Practical Direct Tax Numerical / 10-Marker',
        },
      ],
    },
  ],

  // ── 15. Production & Operations Management (Sem 5) ──
  'bba-karnataka-operations-mgmt': [
    {
      id: 'ops-mod2-plant-layout',
      subjectId: 'bba-karnataka-operations-mgmt',
      title: 'Plant Layout Types & Line Balancing',
      moduleNumber: 2,
      moduleName: 'Module 2: Plant Location & Facility Layout',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-ops-01'],
      subtopics: [
        'Factors Influencing Facility / Plant Location Selection',
        'Product (Line) Layout Characteristics, Pros & Cons',
        'Process (Functional) Layout Characteristics, Pros & Cons',
        'Fixed Position Layout & Cellular (Group Technology) Layout',
        'Line Balancing: Cycle Time, Theoretical Minimum Workstations & Efficiency',
      ],
      explanationMd: `# Plant Layout Types & Assembly Line Balancing

### Core Concept & University Framework
Plant layout involves configuring departments, workstations, machines, and material handling pathways within a facility to maximize operational throughput while minimizing total handling costs.

---

### Classification of Plant Layouts
1. **Product (Line) Layout**: Machines arranged in sequential order of manufacturing operations. Ideal for standardized mass production (e.g. automotive assembly lines at Toyota Kirloskar Bidadi).
2. **Process (Functional) Layout**: Similar machines and specialist operations grouped into dedicated departments (e.g. lathe section, drilling section). Ideal for high-variety, low-volume job production.
3. **Fixed Position Layout**: The product remains stationary while workers, tools, and heavy machinery travel to the site (e.g. aircraft building at HAL Bengaluru, ship building).
4. **Cellular Layout**: Workstations organized into self-sufficient U-shaped manufacturing cells based on group technology.`,
      formulas: [
        {
          id: 'formula-ops-1',
          label: 'Line Balancing Efficiency Formulation',
          formula: 'Efficiency (%) = (Sum of Task Times / (Number of Workstations * Cycle Time)) * 100',
          exampleQ: 'Total task time is 60 minutes. An assembly line uses 5 workstations with a cycle time of 15 minutes. What is the line balancing efficiency?',
          exampleA: 'Efficiency = (60 / (5 * 15)) * 100 = (60 / 75) * 100 = 80%. Balance delay = 100% - 80% = 20%.',
        },
      ],
      tricks: [
        {
          id: 'trick-ops-1',
          title: 'Balance Delay Rule',
          trick: 'Balance Delay = 100% - Line Efficiency! It represents idle operator time on the assembly line.',
          whenToUse: 'Quick calculation in operations quantitative numericals.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ops-1',
          step: 'Step 1: Calculate Cycle Time from Operating Time and Output Demand',
          detail: 'Cycle Time = Available Operating Time per day / Desired Output Units per day.',
          questionType: 'Practical Operations Numerical',
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

  // ── 17. Goods and Services Tax (GST) & Customs Duty (Sem 6) ──
  'bba-karnataka-gst': [
    {
      id: 'gst-mod1-framework-supply',
      subjectId: 'bba-karnataka-gst',
      title: 'Dual GST Model & Concept of Supply (Section 7)',
      moduleNumber: 1,
      moduleName: 'Module 1: Introduction to Indirect Tax & Constitutional Framework',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-gst-01'],
      subtopics: [
        '101st Constitutional Amendment Act 2016 & Article 246A',
        'Structure of Dual GST: CGST, SGST/UTGST, and IGST',
        'Taxable Event: Meaning and Scope of Supply under Section 7',
        'Composite Supply vs. Mixed Supply Distinctions (Sec 8)',
        'Reverse Charge Mechanism (RCM) under Section 9(3) and 9(4)',
      ],
      explanationMd: `# Dual GST Architecture & The Concept of Supply (Section 7)

### Core Concept & University Framework
Introduced on 1st July 2017 via the 101st Constitutional Amendment, the Goods and Services Tax subsumed multiple cascading central and state indirect levies (Excise, VAT, Service Tax, Octroi) into a unified destination-based consumption tax.

---

### Dual GST Structure in India
- **Intra-State Supply (Within Karnataka)**:
  $$\\text{Total GST} = \\text{CGST (Central GST)} + \\text{SGST (State GST)}$$
  *(Apportioned equally: e.g. 18% GST = 9% CGST + 9% SGST)*.
- **Inter-State Supply (Between Karnataka and another State/UT)**:
  $$\\text{Total GST} = \\text{IGST (Integrated GST)}$$
  *(Collected by the Centre and apportioned to the destination consumer state)*.

---

### The Concept of Supply (Section 7 of CGST Act)
Under GST, the taxable event is **Supply**, replacing manufacture, sale, or provision of service:
- All forms of supply of goods or services (sale, transfer, barter, exchange, license, rental, lease).
- Made or agreed to be made for a **consideration** by a person.
- In the course or furtherance of **business**.
- Schedule I exceptions: Specified transactions without consideration (e.g. supplies between related persons or distinct persons in course of business).`,
      formulas: [
        {
          id: 'formula-gst-1',
          label: 'Composite vs Mixed Supply Tax Rate Rule',
          formula: 'Composite Supply = Taxed at Principal Supply Rate | Mixed Supply = Taxed at Highest Applicable Rate',
          exampleQ: 'A hotel offers an executive room with complimentary breakfast (Composite Supply). Room rate is 18%, breakfast is 5%. What rate applies?',
          exampleA: '18% applies to the entire bundled amount because lodging is the principal supply.',
        },
      ],
      tricks: [
        {
          id: 'trick-gst-1',
          title: 'Destination Principle Rule',
          trick: 'GST is a DESTINATION-BASED tax! The tax revenue always accrues to the state where goods are consumed, NOT where they are produced.',
          whenToUse: 'Fundamental concept tested in all university GST examinations.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-gst-1',
          step: 'Step 1: Determine Intra-State vs. Inter-State',
          detail: 'Compare Location of Supplier against Place of Supply. If same state -> CGST+SGST; if different states -> IGST.',
          questionType: 'Practical Tax Computation Problem',
        },
      ],
    },
    {
      id: 'gst-mod3-itc',
      subjectId: 'bba-karnataka-gst',
      title: 'Input Tax Credit (ITC) Mechanics & Blocked Credits (Sec 17(5))',
      moduleNumber: 3,
      moduleName: 'Module 3: Input Tax Credit & Tax Liability Determination',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      examFrequency: 'very_high',
      pyqHighlights: ['Bangalore Univ (BU) 2024 · 10 Marks', 'Mysore Univ (UOM) 2023 · 10 Marks'],
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-gst-02'],
      subtopics: [
        'Concept and Purpose of Input Tax Credit (ITC) in Eliminating Cascading Tax',
        'Four Mandatory Conditions for Claiming ITC under Section 16(2)',
        'Blocked / Ineligible Credits under Section 17(5) (Motor Vehicles, Food, Club Membership)',
        'Sequential Order of ITC Utilization (IGST, CGST, SGST Matching Rules)',
        'Computation of Net GST Payable to Government in Cash Ledger',
      ],
      explanationMd: `# Input Tax Credit (ITC) Mechanics & Blocked Credits (Section 17(5))

### Core Concept & University Framework
Input Tax Credit (ITC) is the backbone of the Goods and Services Tax (GST) system. It prevents the cascading effect ("tax on tax") by allowing a registered taxpayer to set off the GST paid on purchases (Input Tax) against the GST collected on sales (Output Tax).

---

### Four Mandatory Conditions to Claim ITC (Sec 16(2))
A registered person can claim ITC only if **ALL FOUR** conditions are satisfied:
1. Possession of a valid **Tax Invoice** or debit note issued by the supplier.
2. **Actual Receipt** of goods or services.
3. Tax charged on the supply has been **actually paid to the Government** by the supplier (in cash or through ITC).
4. Return under Section 39 (**GSTR-3B**) has been duly furnished.

---

### Blocked Credits under Section 17(5) (NO ITC Allowed)
Even if used in business, ITC is strictly **denied** on:
- **Motor Vehicles** for passenger transport having seating capacity $\\le 13$ persons (unless used for driving school or onward supply).
- **Food, beverages, outdoor catering, beauty treatment, and health services**.
- **Membership of a club, health, and fitness centre**.
- **Goods lost, stolen, destroyed, written off, or disposed of as gifts/free samples**.
- **Works contract services** for construction of immovable property on own account.

---

### Rule 88A: Order of ITC Set-Off
1. **IGST Credit** must be exhausted completely first against Output IGST, and the remainder against Output CGST and SGST in any proportion.
2. **CGST Credit** can be set off only against Output CGST and Output IGST (NEVER against SGST).
3. **SGST Credit** can be set off only against Output SGST and Output IGST (NEVER against CGST).`,
      formulas: [
        {
          id: 'formula-itc-1',
          label: 'Net GST Cash Payable Formula',
          formula: 'Net GST Payable = Output GST Liability - Eligible Input Tax Credit (ITC)',
          exampleQ: 'Dealer in Bengaluru has Output CGST ₹50,000, SGST ₹50,000. Input tax credits available: CGST ₹30,000, SGST ₹35,000, and GST on food catering for office party ₹10,000. Calculate Net GST payable in cash.',
          exampleA: 'Food catering is blocked u/s 17(5) (zero ITC). Eligible CGST ITC = ₹30,000; SGST ITC = ₹35,000. Net CGST payable = 50,000 - 30,000 = ₹20,000. Net SGST payable = 50,000 - 35,000 = ₹15,000. Total Cash Payment = ₹35,000.',
        },
      ],
      tricks: [
        {
          id: 'trick-itc-1',
          title: 'Cross-Utilization Prohibition',
          trick: 'CGST credit can NEVER be set off against SGST liability, and SGST credit can NEVER be set off against CGST liability! There is an impermeable firewall between Centre and State credits.',
          whenToUse: 'Fundamental exam rule tested in all GST numerical calculations.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-itc-1',
          step: 'Step 1: Filter Blocked Credits Under Section 17(5) First',
          detail: 'Strike out food, motor cars, gifts, and personal club fees before summing eligible input credits.',
          questionType: 'Practical GST Computation 10-Marker',
        },
      ],
    },
  ],

  // ── 18. Entrepreneurship Development (Sem 6) ──
  'bba-karnataka-entrepreneurship': [
    {
      id: 'ent-mod2-bmc',
      subjectId: 'bba-karnataka-entrepreneurship',
      title: 'Business Model Canvas (BMC) & Project Feasibility',
      moduleNumber: 2,
      moduleName: 'Module 2: Ideation, Business Planning & BMC',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-ent-01'],
      subtopics: [
        'Sources of New Business Ideas & Environmental Scanning',
        'Alexander Osterwalder 9-Building Blocks of Business Model Canvas',
        'Preparation of Detailed Project Report (DPR)',
        'Technical, Commercial, Financial, and Legal Feasibility Analysis',
        'Karnataka Startup Policy & Government Incubator Support (ELEVATE)',
      ],
      explanationMd: `# Business Model Canvas (BMC) & Feasibility Studies

### Core Concept & University Framework
Bengaluru is recognized as the startup capital of India. Under the NEP 2020 BBA curriculum, students learn venture creation frameworks including Alexander Osterwalder's **Business Model Canvas (BMC)**.

---

### The 9 Building Blocks of the Business Model Canvas
1. **Customer Segments**: Who are we creating value for?
2. **Value Propositions**: Which customer problems do we solve or needs do we satisfy?
3. **Channels**: Through which touchpoints do customer segments want to be reached?
4. **Customer Relationships**: What type of relationship does each segment expect?
5. **Revenue Streams**: For what value are customers really willing to pay?
6. **Key Resources**: What physical, intellectual, human, or financial assets are indispensable?
7. **Key Activities**: What critical operational actions must the venture execute?
8. **Key Partnerships**: Who are our key suppliers and strategic allies?
9. **Cost Structure**: What are the most significant costs inherent in our business model?`,
      formulas: [
        {
          id: 'formula-ent-1',
          label: 'Venture Viability Criterion',
          formula: 'Viable Model = Customer Lifetime Value (LTV) > 3 * Customer Acquisition Cost (CAC)',
          exampleQ: 'A SaaS startup acquires customers at ₹5,000 CAC and expects lifetime revenue of ₹20,000. Is this viable?',
          exampleA: 'Yes. LTV:CAC is 4:1, exceeding the sustainable venture benchmark of 3:1.',
        },
      ],
      tricks: [
        {
          id: 'trick-ent-1',
          title: 'DPR Key Sequence',
          trick: 'Technical Feasibility ALWAYS precedes Financial Feasibility. If the product cannot be manufactured or built, financial projections are meaningless.',
          whenToUse: 'Sequential logic in project report formulation.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ent-1',
          step: 'Step 1: Sketch the 9-Box Canvas Grid',
          detail: 'Draw the 9 blocks cleanly, grouping Right Side (Value & Customers) and Left Side (Efficiency & Costs).',
          questionType: 'Practical Model Presentation',
        },
      ],
    },
  ],

  // ── 19. Company Law & Secretarial Practice (Sem 6) ──
  'bba-karnataka-company-law': [
    {
      id: 'colaw-mod1-corporate-personality',
      subjectId: 'bba-karnataka-company-law',
      title: 'Corporate Personality & Lifting the Corporate Veil',
      moduleNumber: 1,
      moduleName: 'Module 1: Incorporation & Corporate Governance',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-colaw-01'],
      subtopics: [
        'Characteristics of a Company under Companies Act 2013',
        'Doctrine of Separate Legal Entity (*Salomon v. Salomon & Co. Ltd.*)',
        'Perpetual Succession, Common Seal, and Limited Liability',
        'Statutory Grounds for Lifting the Corporate Veil',
        'Judicial Grounds for Lifting the Veil (Fraud, Tax Evasion, Enemy Character)',
      ],
      explanationMd: `# Corporate Personality & Lifting the Corporate Veil

### Core Concept & University Framework
Section 2(20) of the Companies Act 2013 defines a company as a company incorporated under this Act or any previous company law. The hallmark of corporate jurisprudence is that upon incorporation, a company becomes an independent legal entity distinct from its shareholders (*Salomon v. Salomon & Co. Ltd. [1897]*).

---

### Characteristics of an Incorporated Company
- **Separate Legal Personality**: Can own property, sue and be sued in its own corporate name.
- **Limited Liability**: Liability of members is limited to the unpaid amount on shares held.
- **Perpetual Succession**: "Members may come and members may go, but the company goes on forever."
- **Artificial Legal Person**: Created by a legal process; acts through human agents (Directors).

---

### Lifting / Piercing the Corporate Veil
The "corporate veil" is the legal curtain separating the personality of the company from its controllers. Courts will disregard corporate personality and hold individuals personally liable under:
1. **Tax Evasion**: *Sir Dinshaw Maneckjee Petit case* (company created as an artificial device to evade income tax).
2. **Fraud or Sham**: *Gilford Motor Co. v. Horne* (company formed to evade a restrictive covenant).
3. **Determination of Enemy Character**: *Daimler Co. Ltd. v. Continental Tyre & Rubber Co.* during wartime.
4. **Statutory Grounds**: Misstatements in prospectus (Sec 35), fraudulent conduct of business (Sec 339).`,
      formulas: [
        {
          id: 'formula-colaw-1',
          label: 'Salomon Doctrine Formulation',
          formula: 'Company Legal Identity != Shareholders Personal Identity',
          exampleQ: 'A sole director and 99% shareholder of a timber company insures timber in his personal name. Timber burns down. Can he claim insurance?',
          exampleA: 'No (Macaura v. Northern Assurance Co. Ltd.). The timber belonged to the company, not to the shareholder personally; he had no insurable interest.',
        },
      ],
      tricks: [
        {
          id: 'trick-colaw-1',
          title: 'Case Precedent Memorization',
          trick: 'Remember: Salomon = Separate Entity | Dinshaw Petit = Tax Evasion | Gilford Motor = Sham/Fraud | Macaura = Insurable Interest.',
          whenToUse: 'Essential case citations for scoring 10/10 in company law.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-colaw-1',
          step: 'Step 1: State the General Rule First, then Explain Exceptions',
          detail: 'Start with the separate entity principle, then analyze why the veil should be lifted in the specific scenario.',
          questionType: 'Case Study / 10-Marker',
        },
      ],
    },
  ],

  // ── 20. Income Tax - II (Sem 6) ──
  'bba-karnataka-income-tax-2': [
    {
      id: 'tax2-mod4-deductions-80c',
      subjectId: 'bba-karnataka-income-tax-2',
      title: 'Chapter VI-A Deductions: 80C, 80D, 80G & 80TTA',
      moduleNumber: 4,
      moduleName: 'Module 4: Deductions from Gross Total Income',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: '2026-09-16T12:00:00.000Z',
      featuredQuestionIds: ['q-tax2-01'],
      subtopics: [
        'Difference between Exemption (Sec 10) and Deduction (Chapter VI-A)',
        'Section 80C Eligible Investments (PPF, EPF, ELSS, Life Insurance, Housing Principal)',
        'Section 80D Mediclaim Health Insurance Premiums (Individual, Family, Senior Citizens)',
        'Section 80G Donations to Approved Charitable Institutions & Relief Funds',
        'Computation of Total Taxable Income under Old vs. New Tax Regime',
      ],
      explanationMd: `# Deductions from Gross Total Income (Chapter VI-A)

### Core Concept & University Framework
In the final year Karnataka BBA direct taxation syllabus, students calculate Net Total Income by subtracting Chapter VI-A deductions from Gross Total Income (GTI).

$$\\text{Total Taxable Income} = \\text{Gross Total Income (GTI)} - \\text{Deductions u/s 80C to 80U}$$

*(Note: Deductions cannot exceed Gross Total Income; deductions cannot be claimed against Long-Term Capital Gains or lottery winnings).*

---

### Major Chapter VI-A Deductions
1. **Section 80C (Specified Savings & Investments)**:
   - Eligible: Employee Provident Fund (EPF), Public Provident Fund (PPF), ELSS mutual funds, Life Insurance Premiums, Sukanya Samriddhi Yojana, National Savings Certificates (NSC), Principal repayment of housing loan.
   - **Maximum Aggregate Limit**: **₹1,50,000 per financial year**.
2. **Section 80D (Health Insurance Premiums / Mediclaim)**:
   - Self, spouse, dependent children: Up to **₹25,000** (₹50,000 if senior citizen).
   - Parents: Additional **₹25,000** (₹50,000 if senior citizen).
   - Preventive health checkup included up to **₹5,000** within overall cap.
3. **Section 80G (Donations for Charity / National Relief)**:
   - 100% deduction without qualifying limit: PM National Relief Fund, National Defence Fund.
   - 50% deduction subject to 10% adjusted GTI limit: Approved local charitable trusts.`,
      formulas: [
        {
          id: 'formula-tax2-1',
          label: 'Total Income Formulation',
          formula: 'Total Taxable Income = Gross Total Income (GTI) - Deductions (Chapter VI-A)',
          exampleQ: 'Assessee has GTI ₹8,00,000, invests ₹1,80,000 in PPF and pays ₹20,000 health insurance. Compute Taxable Income.',
          exampleA: 'Deduction u/s 80C = ₹1,50,000 (capped at statutory ceiling). Deduction u/s 80D = ₹20,000. Total Taxable Income = 8,00,000 - 1,70,000 = ₹6,30,000.',
        },
      ],
      tricks: [
        {
          id: 'trick-tax2-1',
          title: '80C Statutory Ceiling Cap',
          trick: 'Even if an assessee invests ₹3,00,000 across PPF, ELSS, and insurance, 80C deduction is STRICTLY CAPPED at ₹1,50,000!',
          whenToUse: 'Primary reason students make numerical calculation errors in exam problems.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-tax2-1',
          step: 'Step 1: Calculate Gross Total Income Across All 5 Heads First',
          detail: 'Sum Salary + House Property + PGBP + Capital Gains + Other Sources before applying deductions.',
          questionType: 'Comprehensive Tax Assessment Problem',
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
    pyqTag: {
      university: 'Bangalore University (BU)',
      year: 2024,
      marks: 5,
      semester: 1,
    },
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
    pyqTag: {
      university: 'Mysore University (UOM)',
      year: 2023,
      marks: 2,
      semester: 1,
    },
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
    pyqTag: {
      university: 'Bengaluru City University (BCU)',
      year: 2024,
      marks: 5,
      semester: 1,
    },
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
    pyqTag: {
      university: 'Bangalore University (BU)',
      year: 2024,
      marks: 2,
      semester: 1,
    },
    prepTags: {
      subjectId: 'bba-karnataka-accounting',
      topicIds: ['acc-mod1-concepts-rules'],
      stream: 'commerce',
      program: 'bba',
    },
  },
  {
    id: 'q-mkt-01',
    questionText: 'Which of the following is considered a PSYCHOGRAPHIC basis of consumer market segmentation?',
    options: [
      'Age and monthly family income',
      'Metro city vs Tier-2 town residence',
      'Lifestyle, social values, and personality traits',
      'Usage rate and brand loyalty status',
    ],
    correctIndex: 2,
    explanation: 'Psychographic segmentation divides buyers into different groups based on social class, lifestyle, or personality characteristics.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'Mysore University (UOM)',
      year: 2024,
      marks: 5,
      semester: 1,
    },
    prepTags: {
      subjectId: 'bba-karnataka-marketing',
      topicIds: ['mkt-mod2-stp'],
      stream: 'management',
      program: 'bba',
    },
  },
  {
    id: 'q-mkt-02',
    questionText: 'When a company introduces an innovative product with a very high initial price to capture consumer surplus before lowering prices later, what pricing strategy is being used?',
    options: [
      'Market Penetration Pricing',
      'Price Skimming',
      'Predatory Pricing',
      'Psychological Pricing',
    ],
    correctIndex: 1,
    explanation: 'Price Skimming involves setting high introductory prices for technological or innovative products to skim maximum revenues layer-by-layer from early adopters.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'VTU Belagavi',
      year: 2023,
      marks: 10,
      semester: 1,
    },
    prepTags: {
      subjectId: 'bba-karnataka-marketing',
      topicIds: ['mkt-mod3-plc-pricing'],
      stream: 'management',
      program: 'bba',
    },
  },
  {
    id: 'q-ob-01',
    questionText: "According to Frederick Herzberg's Two-Factor Motivation-Hygiene theory, which of the following is a HYGIENE factor rather than an intrinsic motivator?",
    options: [
      'Challenging work responsibility',
      'Recognition for achievement',
      'Salary and company policies',
      'Opportunities for career advancement',
    ],
    correctIndex: 2,
    explanation: 'Salary, company policies, supervision, and working conditions are Hygiene factors. Their presence prevents dissatisfaction but does not intrinsically motivate peak effort.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'Bangalore University (BU)',
      year: 2024,
      marks: 5,
      semester: 2,
    },
    prepTags: {
      subjectId: 'bba-karnataka-ob',
      topicIds: ['ob-mod3-motivation-theories'],
      stream: 'management',
      program: 'bba',
    },
  },
  {
    id: 'q-math-01',
    questionText: "Under Cramer's Rule for solving linear equations, what condition indicates that the system DOES NOT have a unique solution?",
    options: [
      'The determinant of the coefficient matrix Det(A) equals 0',
      'The determinant Det(Ax) is negative',
      'The number of equations equals 3',
      'All constant terms are positive',
    ],
    correctIndex: 0,
    explanation: "If Det(A) = 0, division by zero occurs (x = Det(Ax) / 0), meaning Cramer's rule cannot yield a unique solution (the system has either infinite solutions or no solution).",
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'VTU Belagavi',
      year: 2024,
      marks: 2,
      semester: 2,
    },
    prepTags: {
      subjectId: 'bba-karnataka-math',
      topicIds: ['math-mod1-matrices-cramer'],
      stream: 'aptitude',
      program: 'bba',
    },
  },
  {
    id: 'q-eco-01',
    questionText: 'If the Price Elasticity of Demand for a brand is 2.5 (Elastic), what managerial action will INCREASE Total Sales Revenue?',
    options: [
      'Increasing the selling price',
      'Decreasing the selling price',
      'Keeping price unchanged while reducing production',
      'Increasing fixed costs',
    ],
    correctIndex: 1,
    explanation: 'When demand is price elastic (Ep > 1), a price reduction leads to a proportionally larger increase in quantity demanded, thereby increasing Total Revenue.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'Mysore University (UOM)',
      year: 2023,
      marks: 5,
      semester: 2,
    },
    prepTags: {
      subjectId: 'bba-karnataka-economics',
      topicIds: ['eco-mod1-elasticity-demand'],
      stream: 'economics',
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
    pyqTag: {
      university: 'Bangalore University (BU)',
      year: 2024,
      marks: 5,
      semester: 3,
    },
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
    pyqTag: {
      university: 'Bengaluru North University (BNU)',
      year: 2023,
      marks: 10,
      semester: 3,
    },
    prepTags: {
      subjectId: 'bba-karnataka-cost-accounting',
      topicIds: ['cost-mod2-eoq-stock-levels'],
      stream: 'commerce',
      program: 'bba',
    },
  },
  {
    id: 'q-stat-01',
    questionText: 'If the two linear regression coefficients are byx = -0.8 and bxy = -0.45, what is Karl Pearson correlation coefficient r?',
    options: [
      '+0.60',
      '-0.60',
      '+0.36',
      '-0.36',
    ],
    correctIndex: 1,
    explanation: 'r = -sqrt((-0.8) * (-0.45)) = -sqrt(0.36) = -0.60. Both regression coefficients and the correlation coefficient must always carry the same algebraic sign.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'Bangalore University (BU)',
      year: 2024,
      marks: 10,
      semester: 3,
    },
    prepTags: {
      subjectId: 'bba-karnataka-statistics',
      topicIds: ['stat-mod3-correlation-regression'],
      stream: 'aptitude',
      program: 'bba',
    },
  },
  {
    id: 'q-fm-01',
    questionText: 'What is the minimum maturity period for Commercial Paper (CP) issued in the Indian Money Market?',
    options: [
      '1 day',
      '7 days',
      '14 days',
      '30 days',
    ],
    correctIndex: 1,
    explanation: 'Under RBI guidelines, Commercial Papers can be issued for maturities ranging from a minimum of 7 days up to a maximum of 1 year.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'Mysore University (UOM)',
      year: 2024,
      marks: 2,
      semester: 3,
    },
    prepTags: {
      subjectId: 'bba-karnataka-fin-markets',
      topicIds: ['fm-mod2-money-market'],
      stream: 'finance',
      program: 'bba',
    },
  },
  {
    id: 'q-law-01',
    questionText: 'In Indian contract law, what is the legal effect of an agreement entered into with a minor (under Mohori Bibee v. Dharmodas Ghose)?',
    options: [
      'Voidable at the option of the minor',
      'Void ab initio (completely void from the beginning)',
      'Enforceable if ratified upon attaining majority',
      'Valid if consideration is paid in cash',
    ],
    correctIndex: 1,
    explanation: 'Under the landmark Privy Council ruling in Mohori Bibee v. Dharmodas Ghose (1903), a minor has no legal capacity to contract and any such agreement is void ab initio.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: {
      university: 'Bangalore University (BU)',
      year: 2023,
      marks: 10,
      semester: 4,
    },
    prepTags: {
      subjectId: 'bba-karnataka-business-law',
      topicIds: ['law-mod1-contract-essentials'],
      stream: 'law',
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
    pyqTag: {
      university: 'Bangalore University (BU)',
      year: 2024,
      marks: 5,
      semester: 4,
    },
    prepTags: {
      subjectId: 'bba-karnataka-fin-mgmt',
      topicIds: ['fin-mod2-wacc-cost-of-capital'],
      stream: 'finance',
      program: 'bba',
    },
  },
  {
    id: 'q-fin-02',
    questionText: 'A capital investment proposal costs ₹3,00,000 and has a Present Value of future cash inflows of ₹3,75,000. What is its Profitability Index (PI)?',
    options: [
      '0.80',
      '1.25',
      '1.75',
      '0.75',
    ],
    correctIndex: 1,
    explanation: 'Profitability Index (PI) = Present Value of Inflows / Initial Outlay = ₹3,75,000 / ₹3,00,000 = 1.25. Since PI > 1.0, the investment is financially acceptable.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'Bangalore University (BU)',
      year: 2024,
      marks: 10,
      semester: 4,
    },
    prepTags: {
      subjectId: 'bba-karnataka-fin-mgmt',
      topicIds: ['fin-mod3-capital-budgeting'],
      stream: 'finance',
      program: 'bba',
    },
  },
  {
    id: 'q-stat-02',
    questionText: 'When comparing two industrial firms, which statistical metric demonstrates greater stability and consistency in worker daily output?',
    options: [
      'Higher Standard Deviation',
      'Higher Mean output',
      'Lower Coefficient of Variation (CV)',
      'Higher Range of output',
    ],
    correctIndex: 2,
    explanation: 'The Coefficient of Variation (CV = (SD / Mean) * 100) measures relative dispersion. A lower CV indicates greater stability, consistency, and uniformity.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'Mysore University (UOM)',
      year: 2023,
      marks: 10,
      semester: 3,
    },
    prepTags: {
      subjectId: 'bba-karnataka-statistics',
      topicIds: ['stat-mod2-dispersion'],
      stream: 'aptitude',
      program: 'bba',
    },
  },
  {
    id: 'q-math-02',
    questionText: 'In Graphical Linear Programming (LPP), what geometric property ensures that the optimal value of the objective function occurs at a vertex?',
    options: [
      'The feasible region is always a non-convex curved area',
      'The objective function and constraints are both linear and form a convex polygon',
      'Variables can take negative coordinates in Quadrant IV',
      'The number of constraints must equal the number of decision variables',
    ],
    correctIndex: 1,
    explanation: 'Because both the objective function and linear inequalities form a convex polygonal feasible set, the Fundamental Theorem of Linear Programming guarantees that the maximum or minimum always occurs at an extreme corner point.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'VTU Belagavi',
      year: 2024,
      marks: 10,
      semester: 2,
    },
    prepTags: {
      subjectId: 'bba-karnataka-math',
      topicIds: ['math-mod5-lpp'],
      stream: 'aptitude',
      program: 'bba',
    },
  },
  {
    id: 'q-hrm-01',
    questionText: 'Which document derived from Job Analysis details the educational degrees, technical certifications, and prior work experience required of an applicant?',
    options: [
      'Job Description (JD)',
      'Job Specification (JS)',
      'Job Evaluation Matrix',
      'Key Performance Indicator (KPI)',
    ],
    correctIndex: 1,
    explanation: 'Job Specification (JS) defines the human qualities, qualifications, skills, and experience necessary for an individual to perform the role.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: {
      university: 'Bengaluru City University (BCU)',
      year: 2023,
      marks: 5,
      semester: 4,
    },
    prepTags: {
      subjectId: 'bba-karnataka-hrm',
      topicIds: ['hrm-mod2-job-analysis'],
      stream: 'management',
      program: 'bba',
    },
  },
  {
    id: 'q-mgmtacc-01',
    questionText: 'If a company has Actual Sales of ₹5,00,000 and Break-Even Sales of ₹3,50,000, what is its Margin of Safety (MOS)?',
    options: [
      '₹1,50,000',
      '₹8,50,000',
      '30%',
      '₹3,50,000',
    ],
    correctIndex: 0,
    explanation: 'Margin of Safety = Actual Sales - Break-Even Sales = ₹5,00,000 - ₹3,50,000 = ₹1,50,000.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'Bangalore University (BU)',
      year: 2024,
      marks: 10,
      semester: 5,
    },
    prepTags: {
      subjectId: 'bba-karnataka-mgmt-accounting',
      topicIds: ['mgmtacc-mod3-marginal-costing'],
      stream: 'commerce',
      program: 'bba',
    },
  },
  {
    id: 'q-tax-01',
    questionText: 'Under Section 6(1) of the Indian Income Tax Act 1961, an individual is treated as a Resident in India if their physical stay during the relevant Previous Year is at least:',
    options: [
      '60 days',
      '90 days',
      '182 days',
      '365 days',
    ],
    correctIndex: 2,
    explanation: 'The primary basic condition under Section 6(1)(a) requires physical presence in India for a minimum of 182 days in the relevant financial previous year.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'Bangalore University (BU)',
      year: 2024,
      marks: 10,
      semester: 5,
    },
    prepTags: {
      subjectId: 'bba-karnataka-income-tax-1',
      topicIds: ['tax1-mod2-residential-status'],
      stream: 'taxation',
      program: 'bba',
    },
  },
  {
    id: 'q-ops-01',
    questionText: 'In a manufacturing facility, which plant layout is most optimal when producing a single standardized product in very large mass volumes?',
    options: [
      'Process Layout (Functional Layout)',
      'Product Layout (Line Layout)',
      'Fixed Position Layout',
      'Hybrid Job-Shop Layout',
    ],
    correctIndex: 1,
    explanation: 'A Product (Line) Layout arranges machines in sequential production flow, which is ideal for high-volume, standardized continuous production.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'VTU Belagavi',
      year: 2023,
      marks: 5,
      semester: 5,
    },
    prepTags: {
      subjectId: 'bba-karnataka-operations-mgmt',
      topicIds: ['ops-mod2-plant-layout'],
      stream: 'operations',
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
    pyqTag: {
      university: 'Mysore University (UOM)',
      year: 2024,
      marks: 10,
      semester: 6,
    },
    prepTags: {
      subjectId: 'bba-karnataka-strategic-mgmt',
      topicIds: ['strat-mod2-pestle-porter'],
      stream: 'strategy',
      program: 'bba',
    },
  },
  {
    id: 'q-gst-01',
    questionText: 'When a transaction is an INTRA-STATE supply of goods within the State of Karnataka, how is the GST levy collected?',
    options: [
      'Only 100% IGST is collected by the Central Government',
      'Divided equally between CGST and SGST',
      'Only SGST is collected by the Karnataka Commercial Taxes Department',
      'UTGST applies exclusively',
    ],
    correctIndex: 1,
    explanation: 'For intra-state supplies, the dual GST framework mandates that tax is levied concurrently as CGST and SGST, divided equally (e.g. 18% GST = 9% CGST + 9% SGST).',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: {
      university: 'Bangalore University (BU)',
      year: 2024,
      marks: 10,
      semester: 6,
    },
    prepTags: {
      subjectId: 'bba-karnataka-gst',
      topicIds: ['gst-mod1-framework-supply'],
      stream: 'taxation',
      program: 'bba',
    },
  },
  {
    id: 'q-ent-01',
    questionText: 'In Alexander Osterwalder\'s 9-block Business Model Canvas (BMC), which component identifies the specific value delivered to solve customer pain points?',
    options: [
      'Key Partnerships',
      'Value Propositions',
      'Cost Structure',
      'Channels',
    ],
    correctIndex: 1,
    explanation: 'The Value Proposition describes the bundle of products and services that create value for a specific customer segment by solving a problem or fulfilling a need.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'Bengaluru City University (BCU)',
      year: 2024,
      marks: 5,
      semester: 6,
    },
    prepTags: {
      subjectId: 'bba-karnataka-entrepreneurship',
      topicIds: ['ent-mod2-bmc'],
      stream: 'management',
      program: 'bba',
    },
  },
  {
    id: 'q-colaw-01',
    questionText: 'Which landmark English judicial case established the fundamental doctrine that an incorporated company has a separate legal personality distinct from its members?',
    options: [
      'Balfour v. Balfour (1919)',
      'Salomon v. Salomon & Co. Ltd. (1897)',
      'Carlill v. Carbolic Smoke Ball Co. (1893)',
      'Donoghue v. Stevenson (1932)',
    ],
    correctIndex: 1,
    explanation: 'Salomon v. Salomon & Co. Ltd. (1897) is the foundational English company law ruling establishing that a legally incorporated company is an independent juristic person.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'Bangalore University (BU)',
      year: 2024,
      marks: 10,
      semester: 6,
    },
    prepTags: {
      subjectId: 'bba-karnataka-company-law',
      topicIds: ['colaw-mod1-corporate-personality'],
      stream: 'law',
      program: 'bba',
    },
  },
  {
    id: 'q-tax2-01',
    questionText: 'What is the maximum aggregate deduction limit permitted under Section 80C of Chapter VI-A in a financial year?',
    options: [
      '₹1,00,000',
      '₹1,50,000',
      '₹2,00,000',
      '₹2,50,000',
    ],
    correctIndex: 1,
    explanation: 'Under Section 80CCE, the maximum cumulative deduction permissible under Sections 80C, 80CCC, and 80CCD(1) is ₹1,50,000 per financial year.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'Bangalore University (BU)',
      year: 2024,
      marks: 10,
      semester: 6,
    },
    prepTags: {
      subjectId: 'bba-karnataka-income-tax-2',
      topicIds: ['tax2-mod4-deductions-80c'],
      stream: 'taxation',
      program: 'bba',
    },
  },
  {
    id: 'q-acc-03',
    questionText: 'When valuing unsold closing stock in Consignment Accounts, which of the following expenses of the Consignee should be STRICTLY EXCLUDED?',
    options: [
      'Customs duty paid at destination port',
      'Clearing charges paid at railway station',
      'Godown rent and showroom advertising',
      'Freight from port to godown',
    ],
    correctIndex: 2,
    explanation: 'Only non-recurring (direct) expenses incurred to bring goods up to the godown are included. Recurring post-arrival expenses such as godown rent, storage insurance, and advertising are strictly excluded from stock valuation.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'Bangalore University (BU)',
      year: 2024,
      marks: 10,
      semester: 1,
    },
    prepTags: {
      subjectId: 'bba-karnataka-accounting',
      topicIds: ['acc-mod3-consignment'],
      stream: 'commerce',
      program: 'bba',
    },
  },
  {
    id: 'q-cost-03',
    questionText: 'In calculating Machine Hour Rate (MHR), how should unproductive setting-up time be treated when determining effective machine hours?',
    options: [
      'Added to total operating hours',
      'Deducted from gross machine hours to arrive at net productive machine hours',
      'Ignored and treated as a direct administrative cost',
      'Multiplied by power charges per unit',
    ],
    correctIndex: 1,
    explanation: 'Unproductive setting-up time represents idle hours and must be deducted from gross machine hours so that overheads are absorbed over actual productive running time.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: {
      university: 'Bengaluru City University (BCU)',
      year: 2024,
      marks: 5,
      semester: 3,
    },
    prepTags: {
      subjectId: 'bba-karnataka-cost-accounting',
      topicIds: ['cost-mod4-mhr-overheads'],
      stream: 'commerce',
      program: 'bba',
    },
  },
  {
    id: 'q-tax-02',
    questionText: 'For an employee employed and residing in Bengaluru, what statutory percentage of salary applies when computing HRA exemption under Section 10(13A)?',
    options: [
      '50% of Salary',
      '40% of Salary',
      '30% of Salary',
      '60% of Salary',
    ],
    correctIndex: 1,
    explanation: 'Under Income Tax Rule 2A, the 50% limit applies exclusively to the four designated metro cities: Mumbai, Delhi, Kolkata, and Chennai. For all other cities in India, including Bengaluru, the statutory ceiling is 40% of Salary.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'Bangalore University (BU)',
      year: 2024,
      marks: 5,
      semester: 5,
    },
    prepTags: {
      subjectId: 'bba-karnataka-income-tax-1',
      topicIds: ['tax1-mod3-salary-hra'],
      stream: 'taxation',
      program: 'bba',
    },
  },
  {
    id: 'q-gst-02',
    questionText: 'Under Section 17(5) of the CGST Act, which of the following input taxes is considered a BLOCKED CREDIT (ineligible for ITC)?',
    options: [
      'GST paid on raw material inputs used in manufacturing',
      'GST paid on industrial plant machinery',
      'GST paid on food, beverages, and outdoor catering for employees',
      'GST paid on transport freight of commercial goods',
    ],
    correctIndex: 2,
    explanation: 'Under Section 17(5)(b)(i), Input Tax Credit is blocked and cannot be claimed on food and beverages, outdoor catering, beauty treatment, and health services unless used as an outward taxable composite supply.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: {
      university: 'Mysore University (UOM)',
      year: 2023,
      marks: 5,
      semester: 6,
    },
    prepTags: {
      subjectId: 'bba-karnataka-gst',
      topicIds: ['gst-mod3-itc'],
      stream: 'taxation',
      program: 'bba',
    },
  },
]
