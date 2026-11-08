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
      { id: 'mpa-mod3-organizing', subjectId: 'bba-karnataka-mpa', title: 'Organizing: Structure, Departmentation & Authority', moduleNumber: 3, moduleName: 'Module 3: Organizing', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mpa-03', 'q-mpa-03b'], subtopics: [
        'Organizing: Meaning, Process & Importance',
        'Organization Structure: Line, Functional, Line & Staff, Matrix',
        'Departmentation: Functional, Product, Geography, Customer',
        'Delegation vs Decentralization'
      ], explanationMd: `# Organizing: Structure, Departmentation & Authority

Organizing structures roles, responsibilities, and authority.

![Mpa Mod3 Organizing Diagram](org-structure.png)

`,
      formulas: [
        { id: 'formula-mpa-mod3-organizing-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-mpa-m3-1', title: 'Span of Control Rule', trick: 'Ideal span = 5–8 subordinates per manager.', whenToUse: 'Answer questions about optimal span of control.' },
      ],
      howToSolve: [
        { id: 'solve-mpa-m3-1', step: 'Step 1: Define organizing.', detail: 'Structuring roles and authority.', questionType: 'Organizing Structure Theory Question' },
      ]
    },
    { id: 'mpa-mod4-staffing-leadership-motivation', subjectId: 'bba-karnataka-mpa', title: 'Staffing, Leadership & Motivation', moduleNumber: 4, moduleName: 'Module 4: Staffing, Leadership & Motivation', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mpa-04', 'q-mpa-04b'], subtopics: [
        'Staffing: Meaning, Process & Importance',
        'Leadership: Styles (Autocratic, Democratic, Laissez-faire)',
        'Motivation: Maslow’s Hierarchy, Herzberg’s Two-Factor'
      ], explanationMd: `# Staffing, Leadership & Motivation

Staffing fills positions with competent people.`,
      formulas: [
        { id: 'formula-mpa-mod4-staffing-leadership-motivation-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-mpa-m4-1', title: 'Maslow Mnemonic', trick: 'Physiological → Safety → Social → Esteem → Self-actualization.', whenToUse: 'Recall Maslow’s five-level hierarchy.' },
      ],
      howToSolve: [
        { id: 'solve-mpa-m4-1', step: 'Step 1: Define staffing.', detail: 'Recruitment and selection process.', questionType: 'Staffing & Motivation Theory Question' },
      ]
    },
    { id: 'mpa-mod5-directing-coordination-control', subjectId: 'bba-karnataka-mpa', title: 'Directing, Coordination & Control', moduleNumber: 5, moduleName: 'Module 5: Directing, Coordination & Control', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mpa-05', 'q-mpa-05b'], subtopics: [
        'Directing: Meaning, Principles & Importance',
        'Control: Meaning, Process & Types',
        'Control Techniques: Budgetary, Non-Budgetary, PERT/CPM'
      ], explanationMd: `# Directing, Coordination & Control

Directing activates employees toward goals.`,
      formulas: [
        { id: 'formula-mpa-mod5-directing-coordination-control-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-mpa-m5-1', title: 'Control Process Steps', trick: 'Set standards → Measure → Compare → Corrective action.', whenToUse: 'Recall the control process sequence.' },
      ],
      howToSolve: [
        { id: 'solve-mpa-m5-1', step: 'Step 1: Define control process.', detail: 'Four steps of control.', questionType: 'Directing & Control Theory Question' },
      ]
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
      { id: 'acc-mod2-journal-ledger-trial-balance', subjectId: 'bba-karnataka-accounting', title: 'Journal, Ledger & Trial Balance', moduleNumber: 2, moduleName: 'Module 2: Journal, Ledger & Trial Balance', order: 2, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-acc-02', 'q-acc-02b'], subtopics: [
        'Journal: Meaning, Format & Rules of Debit/Credit',
        'Ledger: Posting from Journal, Balancing Accounts',
        'Trial Balance: Preparation, Objectives & Limitations',
        'Errors Disclosed & Not Disclosed by Trial Balance',
        'Suspense Account: Meaning & Rectification'
      ], explanationMd: `# Journal, Ledger & Trial Balance

The double-entry system records every transaction in a journal, posts to ledger accounts, and verifies arithmetical accuracy through a trial balance.

### Journal Entries
Every transaction affects at least two accounts — one debited, one credited.
- Personal: Debit the receiver, Credit the giver
- Real: Debit what comes in, Credit what goes out
- Nominal: Debit all expenses/losses, Credit all incomes/gains

### Ledger Posting
Transfer journal entries to individual ledger accounts.

### Trial Balance
A statement listing all ledger account balances.

![Acc Mod2 Journal Ledger Trial Balance Diagram](financial-statements.png)

`,
      formulas: [
        { id: 'formula-acc-m2-1', label: 'Accounting Equation', formula: 'Assets = Liabilities + Owner’s Equity', exampleQ: 'If capital is ₹2,00,000 and liabilities are ₹50,000, what are total assets?', exampleA: 'Assets = 2,00,000 + 50,000 = ₹2,50,000.' },
      ],
      tricks: [
        { id: 'trick-acc-m2-1', title: 'Debit/Credit Quick Reference', trick: 'Assets/Expenses ↑ = Debit; Liabilities/Capital/Income ↑ = Credit.', whenToUse: 'Apply instantly while passing journal entries in exams.' },
      ],
      howToSolve: [
        { id: 'solve-acc-m2-1', step: 'Step 1: Identify accounts affected.', detail: 'Classify each account (Personal/Real/Nominal).', questionType: 'Journal Entry & Trial Balance Problem' },
      ]
    },
    { id: 'acc-mod5-final-accounts-adjustments', subjectId: 'bba-karnataka-accounting', title: 'Final Accounts & Adjustments', moduleNumber: 5, moduleName: 'Module 5: Final Accounts & Adjustments', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'very_high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-acc-05', 'q-acc-05b'], subtopics: [
        'Trading Account: Gross Profit/Loss Determination',
        'Profit & Loss Account: Net Profit/Loss Determination',
        'Balance Sheet: Assets & Liabilities Classification',
        'Adjustments: Closing Stock, Outstanding/Prepaid Expenses, Accrued/Unearned Income',
        'Depreciation, Bad Debts & Provision for Doubtful Debts'
      ], explanationMd: `# Final Accounts & Adjustments

Final accounts are prepared from the trial balance after incorporating adjustments.

### Trading Account
Opens with opening stock, records purchases and direct expenses, closes with closing stock.

### Profit & Loss Account
Starts with gross profit, records indirect expenses and incomes.

### Balance Sheet
Statement of financial position.

![Acc Mod5 Final Accounts Adjustments Diagram](financial-statements.png)

`,
      formulas: [
        { id: 'formula-acc-m5-1', label: 'Gross Profit', formula: 'Gross Profit = Net Sales − Cost of Goods Sold', exampleQ: 'Sales ₹5,00,000, COGS ₹3,50,000. Gross Profit?', exampleA: 'Gross Profit = 5,00,000 − 3,50,000 = ₹1,50,000.' },
      ],
      tricks: [
        { id: 'trick-acc-m5-1', title: 'Adjustments Rule of Thumb', trick: 'Every adjustment affects TWO places: once in final account and once in Balance Sheet.', whenToUse: 'Never forget the Balance Sheet effect of any adjustment.' },
      ],
      howToSolve: [
        { id: 'solve-acc-m5-1', step: 'Step 1: Prepare Trading A/c.', detail: 'Include opening stock, purchases, direct expenses, closing stock.', questionType: 'Final Accounts with Adjustments Problem' },
      ]
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
      { id: 'mkt-mod1-marketing-concepts-4ps', subjectId: 'bba-karnataka-marketing', title: 'Marketing Concepts & 4Ps Marketing Mix', moduleNumber: 1, moduleName: 'Module 1: Marketing Foundations', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mkt-01b', 'q-mkt-01c'], subtopics: [
        'Marketing: Meaning, Nature, Scope & Importance',
        'Marketing Concepts: Production, Product, Selling, Marketing & Societal Concepts',
        'Marketing Mix: 4Ps (Product, Price, Place, Promotion)',
        'Needs, Wants & Demands; Customer Value & Satisfaction',
        'Marketing vs Selling: Key Differences'
      ], explanationMd: `# Marketing Concepts & 4Ps Marketing Mix

Marketing is the process of identifying customer needs and satisfying them profitably.`,
      formulas: [
        { id: 'formula-mkt-mod1-marketing-concepts-4ps-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-mkt-m1-1', title: '4Ps Mnemonic', trick: 'Product, Price, Place, Promotion.', whenToUse: 'Recall all four mix elements instantly.' },
      ],
      howToSolve: [
        { id: 'solve-mkt-m1-1', step: 'Step 1: Define marketing.', detail: 'Satisfying customer needs profitably.', questionType: 'Marketing Concepts Theory Question' },
      ]
    },
    { id: 'mkt-mod4-distribution-channels-retailing', subjectId: 'bba-karnataka-marketing', title: 'Distribution Channels & Retailing', moduleNumber: 4, moduleName: 'Module 4: Distribution & Retailing', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mkt-04', 'q-mkt-04b'], subtopics: [
        'Distribution Channels: Meaning, Types & Functions',
        'Zero, One, Two, Three-Level Channels',
        'Channel Selection Factors',
        'Retailing: Meaning, Types, Functions',
        'Organized vs Unorganized Retailing in India'
      ], explanationMd: `# Distribution Channels & Retailing

Distribution makes products available to customers through channels.`,
      formulas: [
        { id: 'formula-mkt-mod4-distribution-channels-retailing-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-mkt-m4-1', title: 'Channel Levels Mnemonic', trick: 'Count intermediaries between maker and buyer.', whenToUse: 'Identify channel level quickly.' },
      ],
      howToSolve: [
        { id: 'solve-mkt-m4-1', step: 'Step 1: Define distribution channel.', detail: 'Channels move products from manufacturer to customer.', questionType: 'Distribution Channel Theory Question' },
      ]
    },
    { id: 'mkt-mod5-promotion-mix-advertising', subjectId: 'bba-karnataka-marketing', title: 'Promotion Mix & Advertising', moduleNumber: 5, moduleName: 'Module 5: Promotion & Advertising', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mkt-05', 'q-mkt-05b'], subtopics: [
        'Promotion Mix: Advertising, Personal Selling, Sales Promotion, Public Relations',
        'Advertising: Meaning, Objectives, Types, Media',
        'Sales Promotion: Tools, Techniques, Consumer vs Trade'
      ], explanationMd: `# Promotion Mix & Advertising

Promotion communicates product value to customers.`,
      formulas: [
        { id: 'formula-mkt-mod5-promotion-mix-advertising-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-mkt-m5-1', title: 'Promotion Mix Mnemonic', trick: 'APP Sells — Advertising, Personal selling, Promotion, Public relations.', whenToUse: 'List all promotion mix elements instantly.' },
      ],
      howToSolve: [
        { id: 'solve-mkt-m5-1', step: 'Step 1: Define promotion mix.', detail: 'Advertising, personal selling, sales promotion, PR.', questionType: 'Promotion Mix Theory Question' },
      ]
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
      { id: 'ob-mod1-individual-behaviour-personality', subjectId: 'bba-karnataka-ob', title: 'Individual Behaviour & Personality: Big Five & Perception', moduleNumber: 1, moduleName: 'Module 1: Individual Behaviour & Personality', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ob-01b', 'q-ob-02'], subtopics: [
        'Meaning, Nature & Determinants of Individual Behaviour',
        'Big Five Personality Traits (OCEAN Model)',
        'Perception: Process, Factors & Perceptual Errors',
        'Attitudes: Components, Formation & Job Satisfaction',
        'Values, Emotions & Emotional Intelligence at Work'
      ], explanationMd: `# Individual Behaviour & Personality

Individual behaviour is the foundation of organizational behaviour.`,
      formulas: [
        { id: 'formula-ob-mod1-individual-behaviour-personality-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-ob-m1-1', title: 'OCEAN Mnemonic', trick: 'Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism.', whenToUse: 'Recall all five personality traits.' },
      ],
      howToSolve: [
        { id: 'solve-ob-m1-1', step: 'Step 1: Define individual behaviour.', detail: 'Explain Big Five and perception.', questionType: 'Individual Behaviour Theory Question' },
      ]
    },
    { id: 'ob-mod2-perception-learning-attitudes', subjectId: 'bba-karnataka-ob', title: 'Perception, Learning Theories & Attitude Formation', moduleNumber: 2, moduleName: 'Module 2: Perception & Learning', order: 2, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ob-03', 'q-ob-03b'], subtopics: [
        'Perception: Process & Factors',
        'Classical & Operant Conditioning',
        'Cognitive & Social Learning',
        'Attitudes: Components & Formation',
        'Job Satisfaction & Organizational Commitment'
      ], explanationMd: `# Perception, Learning Theories & Attitude Formation

Perception organizes and interprets sensory impressions.`,
      formulas: [
        { id: 'formula-ob-mod2-perception-learning-attitudes-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-ob-m2-1', title: 'Learning Types', trick: 'Classical = stimulus-response; Operant = behavior-consequence.', whenToUse: 'Distinguish learning theories.' },
      ],
      howToSolve: [
        { id: 'solve-ob-m2-1', step: 'Step 1: Define perception.', detail: 'Explain learning theories and attitude components.', questionType: 'Perception & Learning Theory Question' },
      ]
    },
    { id: 'ob-mod4-groups-teams-conflict', subjectId: 'bba-karnataka-ob', title: 'Groups, Teams & Conflict Management', moduleNumber: 4, moduleName: 'Module 4: Groups & Conflict', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ob-04', 'q-ob-05'], subtopics: [
        'Groups: Types, Stages, Group Decision Making',
        'Teams: Types, Characteristics, Effective Teams',
        'Conflict: Types, Sources, Levels',
        'Conflict Resolution: Styles & Strategies',
        'Tuckman\'s Stages of Group Development'
      ], explanationMd: `# Groups, Teams & Conflict Management

Groups and teams differ in structure and purpose.`,
      formulas: [
        { id: 'formula-ob-mod4-groups-teams-conflict-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-ob-m4-1', title: 'Tuckman\'s Stages', trick: 'Forming → Storming → Norming → Performing → Adjourning.', whenToUse: 'Recall group development stages.' },
      ],
      howToSolve: [
        { id: 'solve-ob-m4-1', step: 'Step 1: Define groups vs teams.', detail: 'Explain conflict types and resolution styles.', questionType: 'Groups & Conflict Theory Question' },
      ]
    },
    { id: 'ob-mod5-organisational-culture-change', subjectId: 'bba-karnataka-ob', title: 'Organisational Culture, Climate & Change Management', moduleNumber: 5, moduleName: 'Module 5: Culture & Change', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ob-05b', 'q-ob-05c'], subtopics: [
        'Organisational Culture: Levels, Characteristics',
        'Organisational Climate: Factors & Dimensions',
        'Change Management: Models & Process',
        'Lewin\'s & Kotter\'s Change Models',
        'Resistance to Change: Causes & Overcoming'
      ], explanationMd: `# Organisational Culture, Climate & Change Management

Culture is how we do things around here.`,
      formulas: [
        { id: 'formula-ob-mod5-organisational-culture-change-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-ob-m5-1', title: 'Kotter\'s 8 Steps', trick: 'Urgency → Coalition → Vision → Communicate → Empower → Wins → Consolidate → Anchor.', whenToUse: 'Recall change management steps.' },
      ],
      howToSolve: [
        { id: 'solve-ob-m5-1', step: 'Step 1: Define organisational culture.', detail: 'Explain Lewin\'s and Kotter\'s change models.', questionType: 'Culture & Change Theory Question' },
      ]
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
      { id: 'math-mod2-commercial-arithmetic', subjectId: 'bba-karnataka-math', title: 'Commercial Arithmetic: Profit, Loss, Discount & Partnership', moduleNumber: 2, moduleName: 'Module 2: Commercial Arithmetic', order: 2, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-math-01b', 'q-math-02b'], subtopics: [
        'Profit & Loss: Concepts, Formulas & Computation',
        'Discount: Trade & Cash Discount',
        'Partnership: Profit Sharing Ratio',
        'Ratio & Proportion',
        'Percentage & Its Applications'
      ], explanationMd: `# Commercial Arithmetic

Profit and loss percentages are always computed on Cost Price.`,
      formulas: [
        { id: 'formula-math-m2-1', label: 'Profit Percentage', formula: 'Profit % = (Selling Price − Cost Price) ÷ Cost Price × 100', exampleQ: 'Goods bought for ₹400 sold for ₹500. Profit %?', exampleA: 'Profit % = 100/400 × 100 = 25%.' },
      ],
      tricks: [
        { id: 'trick-math-m2-1', title: 'Profit/Loss Base', trick: 'Profit and loss percentages are ALWAYS computed on Cost Price.', whenToUse: 'Avoid common error in profit-loss MCQs.' },
      ],
      howToSolve: [
        { id: 'solve-math-m2-1', step: 'Step 1: Identify CP and SP.', detail: 'Apply profit/loss formula.', questionType: 'Commercial Arithmetic Problem' },
      ]
    },
    { id: 'math-mod3-interest-annuities', subjectId: 'bba-karnataka-math', title: 'Simple & Compound Interest, Annuities', moduleNumber: 3, moduleName: 'Module 3: Interest & Annuities', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-math-03', 'q-math-04'], subtopics: [
        'Simple Interest: Formula & Computation',
        'Compound Interest: Formula & Computation',
        'Difference between SI & CI',
        'Annuities: Types & Computation',
        'Present Value & Future Value'
      ], explanationMd: `# Simple & Compound Interest, Annuities

CI grows faster than SI due to compounding.`,
      formulas: [
        { id: 'formula-math-m3-1', label: 'Compound Interest', formula: 'A = P(1 + R/100)^n ; CI = A − P', exampleQ: '₹10,000 at 10% p.a. compounded annually for 2 years. Amount?', exampleA: 'A = 10,000(1.10)^2 = ₹12,100.' },
      ],
      tricks: [
        { id: 'trick-math-m3-1', title: 'CI − SI for 2 years', trick: 'CI − SI for 2 years = P × (R÷100)^2.', whenToUse: 'Quick shortcut for 2-year SI/CI difference.' },
      ],
      howToSolve: [
        { id: 'solve-math-m3-1', step: 'Step 1: Identify P, R, n.', detail: 'Apply SI or CI formula.', questionType: 'Interest Computation Problem' },
      ]
    },
    { id: 'math-mod4-calculus-optimization', subjectId: 'bba-karnataka-math', title: 'Calculus: Differentiation & Optimization', moduleNumber: 4, moduleName: 'Module 4: Calculus & Optimization', order: 4, difficulty: 'advanced', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-math-05', 'q-math-06'], subtopics: [
        'Derivatives: Rules & Applications',
        'Maxima & Minima: Second Order Condition',
        'Optimization: Profit Maximization & Cost Minimization',
        'Partial Derivatives: Basic Concepts',
        'Integration: Basic Concepts'
      ], explanationMd: `# Calculus: Differentiation & Optimization

f''(x) < 0 confirms maximum; f''(x) > 0 confirms minimum.`,
      formulas: [
        { id: 'formula-math-m4-1', label: 'Profit Maximization', formula: 'MR = MC', exampleQ: 'Profit maximisation occurs where?', exampleA: 'Where Marginal Revenue equals Marginal Cost.' },
      ],
      tricks: [
        { id: 'trick-math-m4-1', title: 'Second Order Condition', trick: 'f\'\'(x) < 0 for maximum; f\'\'(x) > 0 for minimum.', whenToUse: 'Confirm maxima vs minima.' },
      ],
      howToSolve: [
        { id: 'solve-math-m4-1', step: 'Step 1: Find first derivative.', detail: 'Set to zero, check second order condition.', questionType: 'Calculus Optimization Problem' },
      ]
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
      { id: 'eco-mod2-production-functions', subjectId: 'bba-karnataka-economics', title: 'Production Functions & Cost Analysis', moduleNumber: 2, moduleName: 'Module 2: Production & Cost', order: 2, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-eco-01b', 'q-eco-02'], subtopics: [
        'Production Function: Meaning & Types',
        'Total, Average & Marginal Product',
        'Law of Variable Proportions',
        'Returns to Scale',
        'Cost Concepts: TC, AC, MC, AFC, AVC'
      ], explanationMd: `# Production Functions & Cost Analysis

When MP > AP, AP is rising.

![Eco Mod2 Production Functions Diagram](supply-demand-curve.png)

`,
      formulas: [
        { id: 'formula-eco-m2-1', label: 'Marginal Product', formula: 'MP = ΔTP ÷ ΔL', exampleQ: 'TP with 3 workers = 30; TP with 4 workers = 38. MP of 4th worker?', exampleA: 'MP = (38 − 30) ÷ (4 − 3) = 8 units.' },
      ],
      tricks: [
        { id: 'trick-eco-m2-1', title: 'MP > AP Rule', trick: 'When MP > AP, AP is rising; when MP < AP, AP is falling.', whenToUse: 'Determine AP direction quickly.' },
      ],
      howToSolve: [
        { id: 'solve-eco-m2-1', step: 'Step 1: Compute TP at different labor levels.', detail: 'MP = ΔTP ÷ ΔL.', questionType: 'Production Function Problem' },
      ]
    },
    { id: 'eco-mod3-cost-curves', subjectId: 'bba-karnataka-economics', title: 'Cost Curves & Revenue Concepts', moduleNumber: 3, moduleName: 'Module 3: Cost Curves', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-eco-03', 'q-eco-04'], subtopics: [
        'Short Run & Long Run Cost Curves',
        'AC, MC Relationship',
        'Revenue: TR, AR, MR',
        'Break-Even Analysis',
        'Equilibrium of Firm'
      ], explanationMd: `# Cost Curves & Revenue Concepts

MC cuts AC at its minimum point.

![Eco Mod3 Cost Curves Diagram](cost-curves.png)

`,
      formulas: [
        { id: 'formula-eco-m3-1', label: 'Marginal Cost', formula: 'MC = ΔTC ÷ ΔQ', exampleQ: 'TC at 10 units = ₹500; TC at 11 units = ₹545. MC of 11th unit?', exampleA: 'MC = (545 − 500) ÷ (11 − 10) = ₹45.' },
      ],
      tricks: [
        { id: 'trick-eco-m3-1', title: 'MC-AC Intersection', trick: 'MC cuts AC at its minimum point.', whenToUse: 'Identify AC minimum quickly.' },
      ],
      howToSolve: [
        { id: 'solve-eco-m3-1', step: 'Step 1: Compute TC at different output levels.', detail: 'MC = ΔTC ÷ ΔQ.', questionType: 'Cost Curve Problem' },
      ]
    },
    { id: 'eco-mod4-market-structures', subjectId: 'bba-karnataka-economics', title: 'Market Structures: Perfect Competition & Monopoly', moduleNumber: 4, moduleName: 'Module 4: Market Structures', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-eco-05', 'q-eco-06'], subtopics: [
        'Perfect Competition: Features & Equilibrium',
        'Monopoly: Features & Price Determination',
        'Monopolistic Competition: Features',
        'Oligopoly: Features & Kinked Demand Curve',
        'Price Discrimination: Types & Conditions'
      ], explanationMd: `# Market Structures

A single seller with no close substitutes defines monopoly.

![Eco Mod4 Market Structures Diagram](market-structures.png)

`,
      formulas: [
        { id: 'formula-eco-mod4-market-structures-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-eco-m4-1', title: 'Market Structure Identification', trick: 'Single seller, unique product, high barriers = Monopoly.', whenToUse: 'Identify market structure quickly.' },
      ],
      howToSolve: [
        { id: 'solve-eco-m4-1', step: 'Step 1: Identify number of sellers.', detail: 'Check product differentiation and entry barriers.', questionType: 'Market Structure Theory Question' },
      ]
    },
    { id: 'eco-mod5-managerial-pricing', subjectId: 'bba-karnataka-economics', title: 'Managerial Pricing Methods', moduleNumber: 5, moduleName: 'Module 5: Pricing Methods', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-eco-07', 'q-eco-08'], subtopics: [
        'Pricing Objectives & Factors',
        'Cost-Plus Pricing',
        'Penetration & Skimming Pricing',
        'Discount Pricing',
        'Differential Pricing'
      ], explanationMd: `# Managerial Pricing Methods

Penetration pricing sets a low initial price to capture market share quickly.

![Eco Mod5 Managerial Pricing Diagram](supply-demand-curve.png)

`,
      formulas: [
        { id: 'formula-eco-mod5-managerial-pricing-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-eco-m5-1', title: 'Pricing Strategy Choice', trick: 'Penetration = low price for market share; Skimming = high price for innovative products.', whenToUse: 'Choose pricing strategy quickly.' },
      ],
      howToSolve: [
        { id: 'solve-eco-m5-1', step: 'Step 1: Identify pricing objective.', detail: 'Select appropriate pricing method.', questionType: 'Pricing Method Theory Question' },
      ]
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
      { id: 'cost-mod3-material-labour-overheads', subjectId: 'bba-karnataka-cost-accounting', title: 'Material, Labour & Overheads Costing', moduleNumber: 3, moduleName: 'Module 3: Material Labour Overheads', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-cost-01b', 'q-cost-02b'], subtopics: [
        'Material Costing: EOQ, Stock Levels',
        'Labour Costing: Time Rate, Piece Rate',
        'Overheads: Allocation, Apportionment, Absorption',
        'Idle Time & Overtime',
        'Labour Turnover'
      ], explanationMd: `# Material, Labour & Overheads Costing

EOQ minimises total inventory costs.`,
      formulas: [
        { id: 'formula-cost-m3-1', label: 'EOQ', formula: 'EOQ = √(2 × Annual Demand × Ordering Cost ÷ Carrying Cost)', exampleQ: 'Annual demand 10,000 units, ordering cost ₹50, carrying cost ₹2/unit. EOQ?', exampleA: 'EOQ = √(2 × 10,000 × 50 ÷ 2) = √500,000 ≈ 707 units.' },
      ],
      tricks: [
        { id: 'trick-cost-m3-1', title: 'EOQ shortcut', trick: 'EOQ = √(2DO/C) where D=demand, O=ordering cost, C=carrying cost per unit.', whenToUse: 'Quick EOQ calculation.' },
      ],
      howToSolve: [
        { id: 'solve-cost-m3-1', step: 'Step 1: Identify D, O, C values.', detail: 'Apply EOQ formula.', questionType: 'Inventory Costing Problem' },
      ]
    },
    { id: 'cost-mod5-variance-analysis-budgetary-control', subjectId: 'bba-karnataka-cost-accounting', title: 'Variance Analysis & Budgetary Control', moduleNumber: 5, moduleName: 'Module 5: Variance Analysis & Budgetary Control', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-cost-03b', 'q-cost-04'], subtopics: [
        'Budgetary Control: Types & Process',
        'Material Variances: Price & Usage',
        'Labour Variances: Rate & Efficiency',
        'Overhead Variances',
        'Sales Variances'
      ], explanationMd: `# Variance Analysis & Budgetary Control

Variance = Actual − Standard.`,
      formulas: [
        { id: 'formula-cost-m5-1', label: 'Material Price Variance', formula: 'MPV = (Standard Price − Actual Price) × Actual Quantity', exampleQ: 'SP ₹50, AP ₹55, AQ 1000 units. MPV?', exampleA: 'MPV = (50 − 55) × 1000 = −₹5,000 (Adverse).' },
      ],
      tricks: [
        { id: 'trick-cost-m5-1', title: 'Variance sign', trick: 'Actual > Standard price/rate = Adverse; Actual < Standard = Favourable.', whenToUse: 'Determine variance direction instantly.' },
      ],
      howToSolve: [
        { id: 'solve-cost-m5-1', step: 'Step 1: Compute Standard Cost and Actual Cost.', detail: 'Variance = Standard − Actual (or vice versa based on convention).', questionType: 'Variance Analysis Problem' },
      ]
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
      { id: 'stats-mod1-collection-classification-presentation', subjectId: 'bba-karnataka-statistics', title: 'Collection, Classification & Presentation of Data', moduleNumber: 1, moduleName: 'Module 1: Data Collection & Presentation', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-stats-01', 'q-stats-02'], subtopics: [
        'Primary vs Secondary Data',
        'Methods of Data Collection',
        'Classification: Types & Objectives',
        'Tabulation: Parts of Table',
        'Diagrammatic & Graphic Presentation'
      ], explanationMd: `# Collection, Classification & Presentation of Data

Primary data is collected first-hand; secondary data already exists.`,
      formulas: [
        { id: 'formula-stats-mod1-collection-classification-presentation-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-stats-m1-1', title: 'Primary vs Secondary', trick: 'Primary = collected for first time; Secondary = already published.', whenToUse: 'Classify data source quickly.' },
      ],
      howToSolve: [
        { id: 'solve-stats-m1-1', step: 'Step 1: Identify data type.', detail: 'Classify as primary or secondary data.', questionType: 'Statistics Theory Question' },
      ]
    },
    { id: 'stats-mod4-time-series-analysis', subjectId: 'bba-karnataka-statistics', title: 'Time Series Analysis', moduleNumber: 4, moduleName: 'Module 4: Time Series', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-stats-03', 'q-stats-04'], subtopics: [
        'Time Series: Components & Models',
        'Trend: Secular & Seasonal',
        'Moving Average Method',
        'Least Squares Method',
        'Seasonal Variations'
      ], explanationMd: `# Time Series Analysis

Time series = Secular trend + Seasonal + Cyclical + Irregular variations.`,
      formulas: [
        { id: 'formula-stats-m4-1', label: 'Moving Average', formula: '3-year MA = (Y1 + Y2 + Y3) ÷ 3', exampleQ: 'Sales: 100, 120, 110. 3-year moving average?', exampleA: '(100 + 120 + 110) ÷ 3 = 110.' },
      ],
      tricks: [
        { id: 'trick-stats-m4-1', title: 'Moving Average Centering', trick: 'For even-period MA, centre the averages by taking average of two successive MA values.', whenToUse: 'Centre moving averages for even periods.' },
      ],
      howToSolve: [
        { id: 'solve-stats-m4-1', step: 'Step 1: Compute successive averages.', detail: 'Centre if even period.', questionType: 'Time Series Problem' },
      ]
    },
    { id: 'stats-mod5-index-numbers', subjectId: 'bba-karnataka-statistics', title: 'Index Numbers', moduleNumber: 5, moduleName: 'Module 5: Index Numbers', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-stats-05', 'q-stats-06'], subtopics: [
        'Index Numbers: Meaning & Types',
        'Laspeyres Index',
        'Paasche Index',
        'Fisher’s Ideal Index',
        'Chain Base Index'
      ], explanationMd: `# Index Numbers

Fisher’s Ideal Index = √(Laspeyres × Paasche).`,
      formulas: [
        { id: 'formula-stats-m5-1', label: 'Fisher’s Ideal Index', formula: 'Fisher = √(L × P)', exampleQ: 'Laspeyres = 120, Paasche = 110. Fisher?', exampleA: 'Fisher = √(120 × 110) = √13200 ≈ 114.89.' },
      ],
      tricks: [
        { id: 'trick-stats-m5-1', title: 'Fisher’s Ideal', trick: 'Fisher’s Ideal Index is the geometric mean of Laspeyres and Paasche.', whenToUse: 'Compute Fisher quickly.' },
      ],
      howToSolve: [
        { id: 'solve-stats-m5-1', step: 'Step 1: Compute Laspeyres and Paasche.', detail: 'Take geometric mean.', questionType: 'Index Number Problem' },
      ]
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
      { id: 'fm-mod1-indian-financial-system', subjectId: 'bba-karnataka-fin-markets', title: 'Indian Financial System: Structure & Components', moduleNumber: 1, moduleName: 'Module 1: Indian Financial System', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-fm-01b', 'q-fm-02'], subtopics: [
        'Financial System: Meaning & Components',
        'Money Market vs Capital Market',
        'Primary vs Secondary Market',
        'Role of RBI & SEBI',
        'Financial Intermediaries'
      ], explanationMd: `# Indian Financial System

RBI regulates money market; SEBI regulates capital market.`,
      formulas: [
        { id: 'formula-fm-mod1-indian-financial-system-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-fm-m1-1', title: 'RBI vs SEBI', trick: 'RBI = money market & banking; SEBI = capital market & securities.', whenToUse: 'Identify regulator quickly.' },
      ],
      howToSolve: [
        { id: 'solve-fm-m1-1', step: 'Step 1: Identify market type.', detail: 'Determine regulator and market segment.', questionType: 'Financial System Theory Question' },
      ]
    },
    { id: 'fm-mod3-capital-market-instruments', subjectId: 'bba-karnataka-fin-markets', title: 'Capital Market: Instruments & Functioning', moduleNumber: 3, moduleName: 'Module 3: Capital Market Instruments', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-fm-03', 'q-fm-04'], subtopics: [
        'Equity Shares: Features & Types',
        'Preference Shares & Debentures',
        'Mutual Funds',
        'Derivatives: Futures & Options',
        'Bonds & Government Securities'
      ], explanationMd: `# Capital Market: Instruments & Functioning

Equity shares represent ownership; debentures represent debt.`,
      formulas: [
        { id: 'formula-fm-mod3-capital-market-instruments-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-fm-m3-1', title: 'Equity vs Debt', trick: 'Equity = ownership + voting rights; Debentures = creditor + fixed interest.', whenToUse: 'Distinguish instruments quickly.' },
      ],
      howToSolve: [
        { id: 'solve-fm-m3-1', step: 'Step 1: Identify instrument type.', detail: 'Classify as equity, debt or hybrid.', questionType: 'Capital Market Theory Question' },
      ]
    },
    { id: 'fm-mod4-sebi-regulations', subjectId: 'bba-karnataka-fin-markets', title: 'SEBI Regulations & Investor Protection', moduleNumber: 4, moduleName: 'Module 4: SEBI & Investor Protection', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-fm-05', 'q-fm-06'], subtopics: [
        'SEBI: Powers & Functions',
        'Insider Trading: Prohibition & Penalties',
        'Takeover Code',
        'Investor Protection: Grievance Redressal',
        'Prohibition of Fraudulent & Unfair Trade Practices'
      ], explanationMd: `# SEBI Regulations & Investor Protection

SEBI protects investor interests in securities market.`,
      formulas: [
        { id: 'formula-fm-mod4-sebi-regulations-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-fm-m4-1', title: 'SEBI Role', trick: 'SEBI = regulator, developer and protector of Indian securities market.', whenToUse: 'Recall SEBI’s triple role.' },
      ],
      howToSolve: [
        { id: 'solve-fm-m4-1', step: 'Step 1: Identify SEBI function.', detail: 'Categorise as regulatory, developmental or protective.', questionType: 'SEBI Theory Question' },
      ]
    },
    { id: 'fm-mod5-money-market-instruments', subjectId: 'bba-karnataka-fin-markets', title: 'Money Market: Instruments & Participants', moduleNumber: 5, moduleName: 'Module 5: Money Market', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-fm-07', 'q-fm-08'], subtopics: [
        'Call Money Market',
        'Treasury Bills',
        'Commercial Paper',
        'Certificate of Deposit',
        'Commercial Bills'
      ], explanationMd: `# Money Market: Instruments & Participants

Money market deals in short-term funds (up to 1 year).`,
      formulas: [
        { id: 'formula-fm-mod5-money-market-instruments-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-fm-m5-1', title: 'Money Market Tenor', trick: 'Money market instruments have maturity up to 1 year.', whenToUse: 'Identify money market instruments quickly.' },
      ],
      howToSolve: [
        { id: 'solve-fm-m5-1', step: 'Step 1: Identify instrument maturity.', detail: 'Classify as money market or capital market.', questionType: 'Money Market Theory Question' },
      ]
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
      { id: 'colaw-mod2-indian-contract-act', subjectId: 'bba-karnataka-business-law', title: 'Indian Contract Act 1872: Essentials & Performance', moduleNumber: 2, moduleName: 'Module 2: Indian Contract Act', order: 2, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-colaw-01b', 'q-colaw-02'], subtopics: [
        'Contract: Meaning & Essentials',
        'Offer, Acceptance & Consideration',
        'Capacity & Free Consent',
        'Legality of Object',
        'Performance & Discharge of Contract'
      ], explanationMd: `# Indian Contract Act 1872

A contract is an agreement enforceable by law.`,
      formulas: [
        { id: 'formula-colaw-mod2-indian-contract-act-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-colaw-m2-1', title: 'Valid Contract', trick: 'Offer + Acceptance + Consideration + Capacity + Free Consent + Legal Object = Valid Contract.', whenToUse: 'Check all six essentials.' },
      ],
      howToSolve: [
        { id: 'solve-colaw-m2-1', step: 'Step 1: Identify missing essential.', detail: 'Check offer, acceptance, consideration, capacity, consent, object.', questionType: 'Contract Law Theory Question' },
      ]
    },
    { id: 'colaw-mod3-sale-of-goods-act', subjectId: 'bba-karnataka-business-law', title: 'Sale of Goods Act 1930', moduleNumber: 3, moduleName: 'Module 3: Sale of Goods Act', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-colaw-03', 'q-colaw-04'], subtopics: [
        'Contract of Sale: Essentials',
        'Conditions vs Warranties',
        'Transfer of Property',
        'Rights of Unpaid Seller',
        'Auction Sale'
      ], explanationMd: `# Sale of Goods Act 1930

A condition is essential to the main purpose of the contract; a warranty is collateral.`,
      formulas: [
        { id: 'formula-colaw-mod3-sale-of-goods-act-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-colaw-m3-1', title: 'Condition vs Warranty', trick: 'Breach of condition → right to reject; breach of warranty → right to claim damages only.', whenToUse: 'Distinguish condition from warranty.' },
      ],
      howToSolve: [
        { id: 'solve-colaw-m3-1', step: 'Step 1: Classify stipulation.', detail: 'Determine if condition or warranty.', questionType: 'Sale of Goods Theory Question' },
      ]
    },
    { id: 'colaw-mod4-negotiable-instruments-act', subjectId: 'bba-karnataka-business-law', title: 'Negotiable Instruments Act 1881', moduleNumber: 4, moduleName: 'Module 4: Negotiable Instruments', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-colaw-05', 'q-colaw-06'], subtopics: [
        'Negotiable Instruments: Meaning & Features',
        'Promissory Note, Bill of Exchange, Cheque',
        'Parties to Negotiable Instruments',
        'Holder & Holder in Due Course',
        'Dishonour of Cheque'
      ], explanationMd: `# Negotiable Instruments Act 1881

A cheque is a bill of exchange drawn on a specified banker and payable on demand.`,
      formulas: [
        { id: 'formula-colaw-mod4-negotiable-instruments-act-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-colaw-m4-1', title: 'HDC Rights', trick: 'Holder in Due Course gets better title than the transferor.', whenToUse: 'Recall HDC privileges.' },
      ],
      howToSolve: [
        { id: 'solve-colaw-m4-1', step: 'Step 1: Identify instrument type.', detail: 'Classify as promissory note, bill or cheque.', questionType: 'Negotiable Instruments Theory Question' },
      ]
    },
    { id: 'colaw-mod5-consumer-protection-act', subjectId: 'bba-karnataka-business-law', title: 'Consumer Protection Act 2019', moduleNumber: 5, moduleName: 'Module 5: Consumer Protection', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-colaw-07', 'q-colaw-08'], subtopics: [
        'Consumer Rights: Six Rights',
        'Consumer Disputes Redressal Agencies',
        'Product Liability',
        'Unfair Trade Practices',
        'E-commerce Consumer Protection'
      ], explanationMd: `# Consumer Protection Act 2019

Consumer has right to safety, information, choice, hearing, redressal and consumer education.`,
      formulas: [
        { id: 'formula-colaw-mod5-consumer-protection-act-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-colaw-m5-1', title: 'Consumer Rights', trick: 'Safety, Information, Choice, Hearing, Redressal, Education.', whenToUse: 'List all six consumer rights.' },
      ],
      howToSolve: [
        { id: 'solve-colaw-m5-1', step: 'Step 1: Identify violated right.', detail: 'Determine which consumer right was infringed.', questionType: 'Consumer Protection Theory Question' },
      ]
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
      { id: 'fm-mngt-mod1-time-value-of-money', subjectId: 'bba-karnataka-fin-mgmt', title: 'Time Value of Money', moduleNumber: 1, moduleName: 'Module 1: Time Value of Money', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-fmngt-01', 'q-fmngt-02'], subtopics: [
        'Time Value of Money: Concept',
        'Present Value & Future Value',
        'Compounding & Discounting',
        'Annuities',
        'Perpetuity'
      ], explanationMd: `# Time Value of Money

Money today is worth more than the same amount in future.

![Fm Mngt Mod1 Time Value Of Money Diagram](break-even-analysis.png)

`,
      formulas: [
        { id: 'formula-fmngt-m1-1', label: 'Future Value', formula: 'FV = PV × (1 + r)^n', exampleQ: '₹10,000 at 10% for 2 years. FV?', exampleA: 'FV = 10,000 × 1.10² = ₹12,100.' },
      ],
      tricks: [
        { id: 'trick-fmngt-m1-1', title: 'TVM rule', trick: 'Money has time value — ₹100 today > ₹100 next year.', whenToUse: 'Apply discounting for future cash flows.' },
      ],
      howToSolve: [
        { id: 'solve-fmngt-m1-1', step: 'Step 1: Identify PV, r, n.', detail: 'Apply FV or PV formula.', questionType: 'TVM Problem' },
      ]
    },
    { id: 'fm-mngt-mod4-dividend-decision', subjectId: 'bba-karnataka-fin-mgmt', title: 'Dividend Decision & Working Capital', moduleNumber: 4, moduleName: 'Module 4: Dividend Decision & Working Capital', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-fmngt-03', 'q-fmngt-04'], subtopics: [
        'Dividend Policy: Types',
        'Walter’s Model',
        'Gordon’s Model',
        'MM Hypothesis',
        'Working Capital Management'
      ], explanationMd: `# Dividend Decision & Working Capital

Working capital = Current assets − Current liabilities.`,
      formulas: [
        { id: 'formula-fmngt-m4-1', label: 'Working Capital', formula: 'Working Capital = Current Assets − Current Liabilities', exampleQ: 'CA ₹5,00,000; CL ₹3,00,000. Working capital?', exampleA: '₹5,00,000 − ₹3,00,000 = ₹2,00,000.' },
      ],
      tricks: [
        { id: 'trick-fmngt-m4-1', title: 'Working Capital', trick: 'Working capital = Current assets − Current liabilities.', whenToUse: 'Quick working capital calculation.' },
      ],
      howToSolve: [
        { id: 'solve-fmngt-m4-1', step: 'Step 1: Identify current assets and liabilities.', detail: 'Subtract CL from CA.', questionType: 'Working Capital Problem' },
      ]
    },
    { id: 'fm-mngt-mod5-capital-budgeting', subjectId: 'bba-karnataka-fin-mgmt', title: 'Capital Budgeting: NPV, IRR & Payback', moduleNumber: 5, moduleName: 'Module 5: Capital Budgeting', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-fmngt-05', 'q-fmngt-06'], subtopics: [
        'Capital Budgeting: Meaning & Importance',
        'Payback Period',
        'Net Present Value (NPV)',
        'Internal Rate of Return (IRR)',
        'Profitability Index'
      ], explanationMd: `# Capital Budgeting

Accept project if NPV > 0.

![Fm Mngt Mod5 Capital Budgeting Diagram](break-even-analysis.png)

`,
      formulas: [
        { id: 'formula-fmngt-m5-1', label: 'NPV', formula: 'NPV = Σ (Cash flows ÷ (1+r)^t) − Initial Investment', exampleQ: 'Investment ₹1,00,000; cash inflow ₹30,000/yr for 5 years at 10%. NPV?', exampleA: 'NPV ≈ ₹13,723 (positive — accept).' },
      ],
      tricks: [
        { id: 'trick-fmngt-m5-1', title: 'NPV decision rule', trick: 'NPV > 0 accept; NPV < 0 reject; NPV = 0 indifferent.', whenToUse: 'Apply NPV decision rule instantly.' },
      ],
      howToSolve: [
        { id: 'solve-fmngt-m5-1', step: 'Step 1: Compute present value of cash flows.', detail: 'Subtract initial investment.', questionType: 'Capital Budgeting Problem' },
      ]
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
      { id: 'hrm-mod1-introduction-hrm-functions', subjectId: 'bba-karnataka-hrm', title: 'Introduction to HRM & HR Functions', moduleNumber: 1, moduleName: 'Module 1: HRM Foundations', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-hrm-01b', 'q-hrm-02'], subtopics: [
        'HRM: Meaning, Objectives & Functions',
        'HRM vs HRM',
        'Human Resource Planning',
        'Job Analysis & Job Design',
        'Recruitment & Selection'
      ], explanationMd: `# Introduction to HRM

HRM is the process of managing people in organizations.`,
      formulas: [
        { id: 'formula-hrm-mod1-introduction-hrm-functions-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-hrm-m1-1', title: 'HRM Functions', trick: 'Acquisition, Development, Compensation, Maintenance, Integration.', whenToUse: 'Recall core HRM functions.' },
      ],
      howToSolve: [
        { id: 'solve-hrm-m1-1', step: 'Step 1: Define HRM.', detail: 'Explain objectives and functions.', questionType: 'HRM Theory Question' },
      ]
    },
    { id: 'hrm-mod3-training-development', subjectId: 'bba-karnataka-hrm', title: 'Training & Development', moduleNumber: 3, moduleName: 'Module 3: Training & Development', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-hrm-03', 'q-hrm-04'], subtopics: [
        'Training: Meaning & Need',
        'Training Methods: On-the-job & Off-the-job',
        'Management Development',
        'Performance Appraisal',
        'Career Development'
      ], explanationMd: `# Training & Development

Training improves current job performance; development prepares for future roles.`,
      formulas: [
        { id: 'formula-hrm-mod3-training-development-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-hrm-m3-1', title: 'Training vs Development', trick: 'Training = current job; Development = future roles.', whenToUse: 'Distinguish training from development.' },
      ],
      howToSolve: [
        { id: 'solve-hrm-m3-1', step: 'Step 1: Identify training need.', detail: 'Select appropriate training method.', questionType: 'Training Theory Question' },
      ]
    },
    { id: 'hrm-mod4-compensation-benefits', subjectId: 'bba-karnataka-hrm', title: 'Compensation & Benefits', moduleNumber: 4, moduleName: 'Module 4: Compensation & Benefits', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-hrm-05', 'q-hrm-06'], subtopics: [
        'Compensation: Meaning & Components',
        'Wage & Salary Administration',
        'Incentive Plans',
        'Employee Benefits',
        'Pay Structure'
      ], explanationMd: `# Compensation & Benefits

Compensation includes direct (wages, salary) and indirect (benefits) components.`,
      formulas: [
        { id: 'formula-hrm-mod4-compensation-benefits-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-hrm-m4-1', title: 'Direct vs Indirect', trick: 'Direct = wages/salary; Indirect = benefits/perquisites.', whenToUse: 'Classify compensation components.' },
      ],
      howToSolve: [
        { id: 'solve-hrm-m4-1', step: 'Step 1: Identify compensation type.', detail: 'Classify as direct or indirect.', questionType: 'Compensation Theory Question' },
      ]
    },
    { id: 'hrm-mod5-employee-relations-retention', subjectId: 'bba-karnataka-hrm', title: 'Employee Relations & Retention', moduleNumber: 5, moduleName: 'Module 5: Employee Relations & Retention', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-hrm-07', 'q-hrm-08'], subtopics: [
        'Employee Relations: Meaning',
        'Grievance Handling',
        'Discipline & Disciplinary Action',
        'Employee Retention Strategies',
        'Trade Unions & Collective Bargaining'
      ], explanationMd: `# Employee Relations & Retention

Grievance handling resolves employee complaints systematically.`,
      formulas: [
        { id: 'formula-hrm-mod5-employee-relations-retention-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-hrm-m5-1', title: 'Retention Strategy', trick: 'Retention = compensation + growth + work-life balance + recognition.', whenToUse: 'Design retention programs.' },
      ],
      howToSolve: [
        { id: 'solve-hrm-m5-1', step: 'Step 1: Identify retention factor.', detail: 'Address employee concerns.', questionType: 'Employee Relations Theory Question' },
      ]
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
      { id: 'mgmt-mod1-financial-statement-analysis', subjectId: 'bba-karnataka-mgmt-accounting', title: 'Financial Statement Analysis', moduleNumber: 1, moduleName: 'Module 1: Financial Statement Analysis', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mgmt-01', 'q-mgmt-02'], subtopics: [
        'Financial Statements: Meaning & Types',
        'Comparative & Common Size Statements',
        'Trend Analysis',
        'Ratio Analysis: Liquidity, Solvency, Profitability',
        'DuPont Analysis'
      ], explanationMd: `# Financial Statement Analysis

Ratio analysis expresses relationships between financial statement items.`,
      formulas: [
        { id: 'formula-mgmt-m1-1', label: 'Current Ratio', formula: 'Current Ratio = Current Assets ÷ Current Liabilities', exampleQ: 'CA ₹4,00,000; CL ₹2,00,000. Current Ratio?', exampleA: 'Current Ratio = 4,00,000 ÷ 2,00,000 = 2:1.' },
      ],
      tricks: [
        { id: 'trick-mgmt-m1-1', title: 'Current Ratio benchmark', trick: 'Ideal current ratio is 2:1.', whenToUse: 'Assess short-term solvency quickly.' },
      ],
      howToSolve: [
        { id: 'solve-mgmt-m1-1', step: 'Step 1: Identify CA and CL.', detail: 'Compute ratio.', questionType: 'Ratio Analysis Problem' },
      ]
    },
    { id: 'mgmt-mod2-fund-flow-cash-flow', subjectId: 'bba-karnataka-mgmt-accounting', title: 'Fund Flow & Cash Flow Statement', moduleNumber: 2, moduleName: 'Module 2: Fund Flow & Cash Flow', order: 2, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mgmt-03', 'q-mgmt-04'], subtopics: [
        'Fund Flow Statement: Meaning & Preparation',
        'Cash Flow Statement: AS-3',
        'Operating, Investing, Financing Activities',
        'Direct vs Indirect Method',
        'Fund Flow vs Cash Flow'
      ], explanationMd: `# Fund Flow & Cash Flow Statement

Cash flow shows actual cash movements; fund flow shows working capital changes.`,
      formulas: [
        { id: 'formula-mgmt-mod2-fund-flow-cash-flow-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-mgmt-m2-1', title: 'Cash Flow Activities', trick: 'Operating = daily business; Investing = assets; Financing = capital structure.', whenToUse: 'Classify cash flows correctly.' },
      ],
      howToSolve: [
        { id: 'solve-mgmt-m2-1', step: 'Step 1: Classify each cash flow.', detail: 'Operating/investing/financing.', questionType: 'Cash Flow Problem' },
      ]
    },
    { id: 'mgmt-mod4-budgetary-control', subjectId: 'bba-karnataka-mgmt-accounting', title: 'Budgetary Control', moduleNumber: 4, moduleName: 'Module 4: Budgetary Control', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mgmt-05', 'q-mgmt-06'], subtopics: [
        'Budget: Meaning & Types',
        'Fixed vs Flexible Budget',
        'Zero-Based Budgeting',
        'Cash Budget',
        'Production Budget'
      ], explanationMd: `# Budgetary Control

A flexible budget adjusts for different levels of activity.`,
      formulas: [
        { id: 'formula-mgmt-mod4-budgetary-control-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-mgmt-m4-1', title: 'Fixed vs Flexible', trick: 'Fixed budget = one activity level; Flexible budget = multiple activity levels.', whenToUse: 'Choose budget type correctly.' },
      ],
      howToSolve: [
        { id: 'solve-mgmt-m4-1', step: 'Step 1: Identify budget type.', detail: 'Prepare budget for activity level.', questionType: 'Budgeting Problem' },
      ]
    },
    { id: 'mgmt-mod5-marginal-costing-decision-making', subjectId: 'bba-karnataka-mgmt-accounting', title: 'Marginal Costing & Decision Making', moduleNumber: 5, moduleName: 'Module 5: Marginal Costing', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mgmt-07', 'q-mgmt-08'], subtopics: [
        'Marginal Costing: Concept',
        'Contribution & P/V Ratio',
        'Break-Even Point',
        'Margin of Safety',
        'Cost-Volume-Profit Analysis'
      ], explanationMd: `# Marginal Costing & Decision Making

Contribution = Sales − Variable Cost.

![Mgmt Mod5 Marginal Costing Decision Making Diagram](break-even-analysis.png)

`,
      formulas: [
        { id: 'formula-mgmt-m5-1', label: 'P/V Ratio', formula: 'P/V Ratio = Contribution ÷ Sales × 100', exampleQ: 'Sales ₹1,00,000; Variable Cost ₹60,000. P/V Ratio?', exampleA: 'Contribution = 40,000; P/V Ratio = 40,000 ÷ 1,00,000 × 100 = 40%.' },
      ],
      tricks: [
        { id: 'trick-mgmt-m5-1', title: 'BEP formula', trick: 'BEP (units) = Fixed Cost ÷ Contribution per unit.', whenToUse: 'Quick break-even calculation.' },
      ],
      howToSolve: [
        { id: 'solve-mgmt-m5-1', step: 'Step 1: Compute contribution.', detail: 'BEP = Fixed Cost ÷ Contribution per unit.', questionType: 'Marginal Costing Problem' },
      ]
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
      { id: 'tax1-mod1-basic-concepts-residential-status', subjectId: 'bba-karnataka-income-tax-1', title: 'Basic Concepts & Residential Status', moduleNumber: 1, moduleName: 'Module 1: Basic Concepts', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-tax1-01', 'q-tax1-02'], subtopics: [
        'Income Tax: Meaning & Features',
        'Assessment Year vs Previous Year',
        'Residential Status: Individual',
        'Residential Status: HUF & Company',
        'Tax Incidence'
      ], explanationMd: `# Basic Concepts & Residential Status

Residential status determines tax incidence in India.`,
      formulas: [
        { id: 'formula-tax1-mod1-basic-concepts-residential-status-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-tax1-m1-1', title: 'Resident test', trick: '182 days in India in PY = Resident.', whenToUse: 'Determine residential status quickly.' },
      ],
      howToSolve: [
        { id: 'solve-tax1-m1-1', step: 'Step 1: Count days in India.', detail: 'Apply resident/non-resident test.', questionType: 'Income Tax Theory Question' },
      ]
    },
    { id: 'tax1-mod4-computation-total-income', subjectId: 'bba-karnataka-income-tax-1', title: 'Computation of Total Income & Tax Liability', moduleNumber: 4, moduleName: 'Module 4: Computation of Total Income', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-tax1-03', 'q-tax1-04'], subtopics: [
        'Gross Total Income',
        'Deductions under Chapter VI-A',
        'Total Income',
        'Tax Liability & Rebates',
        'Advance Tax & TDS'
      ], explanationMd: `# Computation of Total Income

Total Income = Gross Total Income − Deductions under Chapter VI-A.`,
      formulas: [
        { id: 'formula-tax1-m4-1', label: 'Total Income', formula: 'Total Income = Gross Total Income − Chapter VI-A Deductions', exampleQ: 'GTI ₹6,00,000; Section 80C deduction ₹1,50,000. Total Income?', exampleA: 'Total Income = 6,00,000 − 1,50,000 = ₹4,50,000.' },
      ],
      tricks: [
        { id: 'trick-tax1-m4-1', title: 'Section 80C limit', trick: 'Section 80C deduction limit is ₹1,50,000 per year.', whenToUse: 'Apply 80C limit quickly.' },
      ],
      howToSolve: [
        { id: 'solve-tax1-m4-1', step: 'Step 1: Compute GTI.', detail: 'Subtract Chapter VI-A deductions.', questionType: 'Tax Computation Problem' },
      ]
    },
    { id: 'tax1-mod5-tax-planning-avoidance-evasion', subjectId: 'bba-karnataka-income-tax-1', title: 'Tax Planning, Avoidance & Evasion', moduleNumber: 5, moduleName: 'Module 5: Tax Planning', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-tax1-05', 'q-tax1-06'], subtopics: [
        'Tax Planning: Meaning & Objectives',
        'Tax Avoidance vs Tax Evasion',
        'Legitimate Tax Planning Tools',
        'Tax Holiday & Exemptions',
        'Penalties for Tax Evasion'
      ], explanationMd: `# Tax Planning, Avoidance & Evasion

Tax planning is legal; tax evasion is illegal.`,
      formulas: [
        { id: 'formula-tax1-mod5-tax-planning-avoidance-evasion-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-tax1-m5-1', title: 'Planning vs Evasion', trick: 'Tax planning = legal; Tax evasion = illegal (concealment, fraud).', whenToUse: 'Distinguish planning from evasion.' },
      ],
      howToSolve: [
        { id: 'solve-tax1-m5-1', step: 'Step 1: Identify activity type.', detail: 'Classify as planning, avoidance or evasion.', questionType: 'Tax Planning Theory Question' },
      ]
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
      { id: 'ops-mod1-production-operations-intro', subjectId: 'bba-karnataka-operations-mgmt', title: 'Introduction to Production & Operations Management', moduleNumber: 1, moduleName: 'Module 1: Operations Foundations', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ops-01b', 'q-ops-02'], subtopics: [
        'Operations Management: Meaning & Scope',
        'Production vs Operations Management',
        'Types of Production Systems',
        'Plant Location & Layout',
        'Operations Strategy'
      ], explanationMd: `# Introduction to Production & Operations Management

OM transforms inputs into goods and services.`,
      formulas: [
        { id: 'formula-ops-mod1-production-operations-intro-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-ops-m1-1', title: 'OM Transformation', trick: 'Inputs → Transformation Process → Outputs (goods/services).', whenToUse: 'Recall OM transformation model.' },
      ],
      howToSolve: [
        { id: 'solve-ops-m1-1', step: 'Step 1: Define operations management.', detail: 'Explain transformation process.', questionType: 'Operations Theory Question' },
      ]
    },
    { id: 'ops-mod3-inventory-management', subjectId: 'bba-karnataka-operations-mgmt', title: 'Inventory Management', moduleNumber: 3, moduleName: 'Module 3: Inventory Management', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ops-03', 'q-ops-04'], subtopics: [
        'Inventory: Meaning & Types',
        'EOQ Model',
        'ABC Analysis',
        'JIT & Lean Inventory',
        'Safety Stock & Reorder Level'
      ], explanationMd: `# Inventory Management

ABC analysis classifies items by value: A (high value), B (medium), C (low value).

![Ops Mod3 Inventory Management Diagram](org-structure.png)

`,
      formulas: [
        { id: 'formula-ops-m3-1', label: 'EOQ', formula: 'EOQ = √(2 × Demand × Ordering Cost ÷ Holding Cost)', exampleQ: 'Annual demand 10,000, ordering cost ₹50, holding cost ₹2. EOQ?', exampleA: 'EOQ = √(2 × 10,000 × 50 ÷ 2) ≈ 707 units.' },
      ],
      tricks: [
        { id: 'trick-ops-m3-1', title: 'ABC Classification', trick: 'A-items: high value, low quantity (70-80% value, 10-20% items).', whenToUse: 'Prioritise A-items for tight control.' },
      ],
      howToSolve: [
        { id: 'solve-ops-m3-1', step: 'Step 1: Identify D, ordering cost, holding cost.', detail: 'Apply EOQ formula.', questionType: 'Inventory Problem' },
      ]
    },
    { id: 'ops-mod4-quality-management', subjectId: 'bba-karnataka-operations-mgmt', title: 'Quality Management & TQM', moduleNumber: 4, moduleName: 'Module 4: Quality Management', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ops-05', 'q-ops-06'], subtopics: [
        'Quality: Meaning & Dimensions',
        'TQM: Principles & Elements',
        'ISO 9000 Series',
        'Quality Control Tools',
        'Six Sigma'
      ], explanationMd: `# Quality Management & TQM

TQM is a management approach centred on quality, customer satisfaction and continuous improvement.`,
      formulas: [
        { id: 'formula-ops-mod4-quality-management-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-ops-m4-1', title: 'ISO 9000', trick: 'ISO 9000 is a family of quality management standards.', whenToUse: 'Recall ISO quality standards.' },
      ],
      howToSolve: [
        { id: 'solve-ops-m4-1', step: 'Step 1: Define TQM.', detail: 'Explain continuous improvement.', questionType: 'Quality Management Theory Question' },
      ]
    },
    { id: 'ops-mod5-supply-chain-logistics', subjectId: 'bba-karnataka-operations-mgmt', title: 'Supply Chain & Logistics Management', moduleNumber: 5, moduleName: 'Module 5: Supply Chain & Logistics', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ops-07', 'q-ops-08'], subtopics: [
        'Supply Chain: Meaning & Components',
        'Logistics: Meaning & Functions',
        'Procurement & Vendor Management',
        'Warehousing & Distribution',
        'Reverse Logistics'
      ], explanationMd: `# Supply Chain & Logistics Management

Supply chain covers the flow from raw materials to end customer.`,
      formulas: [
        { id: 'formula-ops-mod5-supply-chain-logistics-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-ops-m5-1', title: 'Supply Chain Flow', trick: 'Supplier → Manufacturer → Distributor → Retailer → Customer.', whenToUse: 'Trace supply chain flow.' },
      ],
      howToSolve: [
        { id: 'solve-ops-m5-1', step: 'Step 1: Identify supply chain stage.', detail: 'Map the flow of goods.', questionType: 'Supply Chain Theory Question' },
      ]
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
      { id: 'strat-mod1-introduction-strategic-management', subjectId: 'bba-karnataka-strategic-mgmt', title: 'Introduction to Strategic Management', moduleNumber: 1, moduleName: 'Module 1: Strategic Foundations', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-strat-01b', 'q-strat-02'], subtopics: [
        'Strategic Management: Meaning & Process',
        'Vision, Mission & Objectives',
        'Stakeholders & Corporate Governance',
        'Strategic Decision Making',
        'Levels of Strategy'
      ], explanationMd: `# Introduction to Strategic Management

Strategic management involves formulation and implementation of major goals.`,
      formulas: [
        { id: 'formula-strat-mod1-introduction-strategic-management-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-strat-m1-1', title: 'Strategy Levels', trick: 'Corporate → Business → Functional strategy levels.', whenToUse: 'Identify strategy level quickly.' },
      ],
      howToSolve: [
        { id: 'solve-strat-m1-1', step: 'Step 1: Define strategic management.', detail: 'Explain formulation and implementation.', questionType: 'Strategy Theory Question' },
      ]
    },
    { id: 'strat-mod3-swot-pestle-analysis', subjectId: 'bba-karnataka-strategic-mgmt', title: 'SWOT & PESTLE Analysis', moduleNumber: 3, moduleName: 'Module 3: Environmental Analysis', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-strat-03', 'q-strat-04'], subtopics: [
        'Environmental Scanning',
        'SWOT Analysis: Strengths, Weaknesses, Opportunities, Threats',
        'PESTLE Analysis: Political, Economic, Social, Technological, Legal, Environmental',
        'Porter’s Five Forces',
        'Competitor Analysis'
      ], explanationMd: `# SWOT & PESTLE Analysis

SWOT is internal (S, W) and external (O, T); PESTLE is macro-environmental.

![Strat Mod3 Swot Pestle Analysis Diagram](swot-analysis.png)

`,
      formulas: [
        { id: 'formula-strat-mod3-swot-pestle-analysis-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-strat-m3-1', title: 'SWOT vs PESTLE', trick: 'SWOT = internal + immediate external; PESTLE = macro environment only.', whenToUse: 'Choose analysis framework.' },
      ],
      howToSolve: [
        { id: 'solve-strat-m3-1', step: 'Step 1: Identify internal vs external factors.', detail: 'Classify as S/W/O/T or PESTLE.', questionType: 'Environmental Analysis Problem' },
      ]
    },
    { id: 'strat-mod4-strategy-implementation', subjectId: 'bba-karnataka-strategic-mgmt', title: 'Strategy Implementation & Control', moduleNumber: 4, moduleName: 'Module 4: Strategy Implementation', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-strat-05', 'q-strat-06'], subtopics: [
        'Strategy Implementation: Steps',
        'Resource Allocation',
        'Organisational Structure & Strategy',
        'Strategic Control & Balanced Scorecard',
        'Corrective Action'
      ], explanationMd: `# Strategy Implementation & Control

Implementation puts strategy into action through structure, resources and systems.`,
      formulas: [
        { id: 'formula-strat-mod4-strategy-implementation-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-strat-m4-1', title: 'Balanced Scorecard', trick: 'Financial, Customer, Internal Process, Learning & Growth.', whenToUse: 'Recall four BSC perspectives.' },
      ],
      howToSolve: [
        { id: 'solve-strat-m4-1', step: 'Step 1: Align structure with strategy.', detail: 'Implement through resource allocation.', questionType: 'Strategy Implementation Theory Question' },
      ]
    },
    { id: 'strat-mod5-corporate-level-strategies', subjectId: 'bba-karnataka-strategic-mgmt', title: 'Corporate Level Strategies', moduleNumber: 5, moduleName: 'Module 5: Corporate Strategies', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-strat-07', 'q-strat-08'], subtopics: [
        'Growth Strategies: Concentration, Integration, Diversification',
        'Stability Strategies',
        'Retrenchment Strategies: Turnaround, Divestment, Liquidation',
        'Portfolio Analysis: BCG Matrix',
        'Mergers & Acquisitions'
      ], explanationMd: `# Corporate Level Strategies

BCG Matrix classifies SBUs as Stars, Cash Cows, Question Marks, Dogs.

![Strat Mod5 Corporate Level Strategies Diagram](bcg-matrix.png)

`,
      formulas: [
        { id: 'formula-strat-mod5-corporate-level-strategies-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-strat-m5-1', title: 'BCG Matrix', trick: 'Stars = high growth, high share; Cash Cows = low growth, high share.', whenToUse: 'Classify SBUs in BCG Matrix.' },
      ],
      howToSolve: [
        { id: 'solve-strat-m5-1', step: 'Step 1: Identify growth rate and market share.', detail: 'Classify SBU in BCG matrix.', questionType: 'Corporate Strategy Problem' },
      ]
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
      { id: 'gst-mod2-gst-registration-compliance', subjectId: 'bba-karnataka-gst', title: 'GST Registration & Compliance', moduleNumber: 2, moduleName: 'Module 2: GST Registration & Compliance', order: 2, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-gst-01b', 'q-gst-02b'], subtopics: [
        'GST: Meaning & Features',
        'CGST, SGST, IGST, UTGST',
        'Registration: Threshold & Procedure',
        'GST Returns: Types & Due Dates',
        'Input Tax Credit: Eligibility & Conditions'
      ], explanationMd: `# GST Registration & Compliance

IGST is levied on inter-state supplies; CGST + SGST on intra-state supplies.`,
      formulas: [
        { id: 'formula-gst-mod2-gst-registration-compliance-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-gst-m2-1', title: 'CGST+SGST vs IGST', trick: 'Intra-state = CGST + SGST; Inter-state = IGST.', whenToUse: 'Apply correct GST type.' },
      ],
      howToSolve: [
        { id: 'solve-gst-m2-1', step: 'Step 1: Identify place of supply.', detail: 'Intra-state or inter-state.', questionType: 'GST Theory Question' },
      ]
    },
    { id: 'gst-mod4-gst-returns-assessment', subjectId: 'bba-karnataka-gst', title: 'GST Returns, Assessment & Audit', moduleNumber: 4, moduleName: 'Module 4: GST Returns & Assessment', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-gst-03', 'q-gst-04'], subtopics: [
        'GSTR-1, GSTR-3B, GSTR-9',
        'Assessment: Self, Provisional, Summary, Best Judgement',
        'Audit under GST',
        'Demand & Recovery',
        'Refund under GST'
      ], explanationMd: `# GST Returns, Assessment & Audit

GSTR-3B is a monthly summary return; GSTR-9 is annual return.`,
      formulas: [
        { id: 'formula-gst-mod4-gst-returns-assessment-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-gst-m4-1', title: 'GSTR Returns', trick: 'GSTR-1 = outward supplies; GSTR-3B = summary; GSTR-9 = annual.', whenToUse: 'Identify return type.' },
      ],
      howToSolve: [
        { id: 'solve-gst-m4-1', step: 'Step 1: Identify return period.', detail: 'File appropriate GSTR form.', questionType: 'GST Compliance Question' },
      ]
    },
    { id: 'gst-mod5-customs-law-basics', subjectId: 'bba-karnataka-gst', title: 'Customs Law: Basics & Procedures', moduleNumber: 5, moduleName: 'Module 5: Customs Law', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-gst-05', 'q-gst-06'], subtopics: [
        'Customs Act: Meaning & Scope',
        'Types of Customs Duty',
        'Valuation under Customs',
        'Import & Export Procedures',
        'Warehousing under Customs'
      ], explanationMd: `# Customs Law

Customs duty is levied on import and export of goods.`,
      formulas: [
        { id: 'formula-gst-mod5-customs-law-basics-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-gst-m5-1', title: 'Customs Duty', trick: 'Basic Customs Duty is the primary duty on imported goods.', whenToUse: 'Recall customs duty types.' },
      ],
      howToSolve: [
        { id: 'solve-gst-m5-1', step: 'Step 1: Identify import or export.', detail: 'Apply relevant customs provision.', questionType: 'Customs Law Theory Question' },
      ]
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
      { id: 'ent-mod1-introduction-entrepreneurship', subjectId: 'bba-karnataka-entrepreneurship', title: 'Introduction to Entrepreneurship', moduleNumber: 1, moduleName: 'Module 1: Entrepreneurship Foundations', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ent-01b', 'q-ent-02'], subtopics: [
        'Entrepreneur: Meaning & Types',
        'Entrepreneurship: Concept & Importance',
        'Entrepreneur vs Manager',
        'Qualities of Successful Entrepreneur',
        'Role of Entrepreneurship in Economic Development'
      ], explanationMd: `# Introduction to Entrepreneurship

An entrepreneur organises, manages and assumes risks of a business.`,
      formulas: [
        { id: 'formula-ent-mod1-introduction-entrepreneurship-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-ent-m1-1', title: 'Entrepreneur vs Manager', trick: 'Entrepreneur bears risk and owns the business; Manager is an employee.', whenToUse: 'Distinguish entrepreneur from manager.' },
      ],
      howToSolve: [
        { id: 'solve-ent-m1-1', step: 'Step 1: Define entrepreneur.', detail: 'Explain role in economic development.', questionType: 'Entrepreneurship Theory Question' },
      ]
    },
    { id: 'ent-mod3-business-plan-preparation', subjectId: 'bba-karnataka-entrepreneurship', title: 'Business Plan Preparation', moduleNumber: 3, moduleName: 'Module 3: Business Plan', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ent-03', 'q-ent-04'], subtopics: [
        'Business Plan: Meaning & Components',
        'Market Analysis in Business Plan',
        'Financial Plan & Projections',
        'Operations Plan',
        'Risk Analysis'
      ], explanationMd: `# Business Plan Preparation

A business plan is a roadmap for the venture.`,
      formulas: [
        { id: 'formula-ent-mod3-business-plan-preparation-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-ent-m3-1', title: 'Business Plan Components', trick: 'Executive summary, market analysis, operations, financials, risk.', whenToUse: 'Structure a business plan.' },
      ],
      howToSolve: [
        { id: 'solve-ent-m3-1', step: 'Step 1: Identify business plan section.', detail: 'Draft appropriate section.', questionType: 'Business Plan Theory Question' },
      ]
    },
    { id: 'ent-mod4-finance-sources-startup', subjectId: 'bba-karnataka-entrepreneurship', title: 'Sources of Finance for Startups', moduleNumber: 4, moduleName: 'Module 4: Startup Finance', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ent-05', 'q-ent-06'], subtopics: [
        'Bootstrapping & Own Funds',
        'Angel Investors',
        'Venture Capital',
        'Bank Loans & Mudra',
        'Crowdfunding'
      ], explanationMd: `# Sources of Finance for Startups

Bootstrapping means funding from personal savings and revenue.`,
      formulas: [
        { id: 'formula-ent-mod4-finance-sources-startup-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-ent-m4-1', title: 'Startup Funding Stages', trick: 'Bootstrap → Angel → VC → IPO.', whenToUse: 'Trace startup funding lifecycle.' },
      ],
      howToSolve: [
        { id: 'solve-ent-m4-1', step: 'Step 1: Identify funding stage.', detail: 'Select appropriate source.', questionType: 'Startup Finance Theory Question' },
      ]
    },
    { id: 'ent-mod5-startup-ecosystem-india', subjectId: 'bba-karnataka-entrepreneurship', title: 'Startup Ecosystem in India', moduleNumber: 5, moduleName: 'Module 5: Startup Ecosystem', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ent-07', 'q-ent-08'], subtopics: [
        'Startup India Scheme',
        'Incubators & Accelerators',
        'MSME Registration',
        'Legal Registration: Proprietorship, Partnership, LLP, Company',
        'Exit Strategies'
      ], explanationMd: `# Startup Ecosystem in India

Startup India provides tax benefits and compliance relaxations.`,
      formulas: [
        { id: 'formula-ent-mod5-startup-ecosystem-india-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-ent-m5-1', title: 'Startup India', trick: 'Startup India offers tax holiday for 3 years in first 7 years.', whenToUse: 'Recall Startup India benefits.' },
      ],
      howToSolve: [
        { id: 'solve-ent-m5-1', step: 'Step 1: Identify startup benefit.', detail: 'Explain registration options.', questionType: 'Startup Ecosystem Theory Question' },
      ]
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
      { id: 'colaw-mod2-companies-act-incorporation', subjectId: 'bba-karnataka-company-law', title: 'Companies Act 2013: Incorporation & Types', moduleNumber: 2, moduleName: 'Module 2: Incorporation & Types', order: 2, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-claw-01', 'q-claw-02'], subtopics: [
        'Company: Meaning & Features',
        'Types of Companies: Private, Public, OPC',
        'Incorporation Process',
        'MOA & AOA',
        'Certificate of Incorporation'
      ], explanationMd: `# Companies Act 2013

A company is an artificial person created by law with separate legal entity.`,
      formulas: [
        { id: 'formula-colaw-mod2-companies-act-incorporation-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-claw-m2-1', title: 'MOA vs AOA', trick: 'MOA = charter/objects; AOA = internal rules/regulations.', whenToUse: 'Distinguish MOA from AOA.' },
      ],
      howToSolve: [
        { id: 'solve-claw-m2-1', step: 'Step 1: Define company.', detail: 'Explain incorporation process.', questionType: 'Company Law Theory Question' },
      ]
    },
    { id: 'colaw-mod3-shares-debentures', subjectId: 'bba-karnataka-company-law', title: 'Shares, Debentures & Share Capital', moduleNumber: 3, moduleName: 'Module 3: Share Capital', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-claw-03', 'q-claw-04'], subtopics: [
        'Share Capital: Meaning & Types',
        'Equity vs Preference Shares',
        'Issue of Shares: At Par, Premium, Discount',
        'Debentures: Types & Features',
        'Transfer & Transmission of Shares'
      ], explanationMd: `# Shares, Debentures & Share Capital

Equity shareholders have voting rights; preference shareholders get fixed dividend.`,
      formulas: [
        { id: 'formula-colaw-mod3-shares-debentures-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-claw-m3-1', title: 'Equity vs Preference', trick: 'Equity = voting rights + variable dividend; Preference = fixed dividend + no vote.', whenToUse: 'Distinguish share types.' },
      ],
      howToSolve: [
        { id: 'solve-claw-m3-1', step: 'Step 1: Identify share type.', detail: 'Explain rights and features.', questionType: 'Share Capital Theory Question' },
      ]
    },
    { id: 'colaw-mod4-company-management-directors', subjectId: 'bba-karnataka-company-law', title: 'Company Management: Directors & Meetings', moduleNumber: 4, moduleName: 'Module 4: Directors & Meetings', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-claw-05', 'q-claw-06'], subtopics: [
        'Directors: Appointment & Removal',
        'Duties & Liabilities of Directors',
        'Board Meetings & Resolutions',
        'Annual General Meeting',
        'Extraordinary General Meeting'
      ], explanationMd: `# Company Management

Directors manage the company; shareholders own it.`,
      formulas: [
        { id: 'formula-colaw-mod4-company-management-directors-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-claw-m4-1', title: 'AGM frequency', trick: 'AGM must be held once every year, within 6 months of year-end.', whenToUse: 'Recall AGM timing.' },
      ],
      howToSolve: [
        { id: 'solve-claw-m4-1', step: 'Step 1: Identify meeting type.', detail: 'Explain meeting requirements.', questionType: 'Company Management Theory Question' },
      ]
    },
    { id: 'colaw-mod5-winding-up-insolvency', subjectId: 'bba-karnataka-company-law', title: 'Winding Up & Insolvency', moduleNumber: 5, moduleName: 'Module 5: Winding Up & Insolvency', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-claw-07', 'q-claw-08'], subtopics: [
        'Winding Up: Meaning & Modes',
        'Voluntary vs Compulsory Winding Up',
        'Liquidator: Powers & Duties',
        'Insolvency & Bankruptcy Code 2016',
        'Corporate Insolvency Resolution Process'
      ], explanationMd: `# Winding Up & Insolvency

IBC 2016 consolidated insolvency laws in India.`,
      formulas: [
        { id: 'formula-colaw-mod5-winding-up-insolvency-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-claw-m5-1', title: 'IBC objective', trick: 'IBC 2016 aims to resolve insolvency in a time-bound manner.', whenToUse: 'Recall IBC purpose.' },
      ],
      howToSolve: [
        { id: 'solve-claw-m5-1', step: 'Step 1: Identify winding up mode.', detail: 'Explain liquidator role.', questionType: 'Insolvency Theory Question' },
      ]
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
      { id: 'tax2-mod1-heads-of-income-salary', subjectId: 'bba-karnataka-income-tax-2', title: 'Income from Salary', moduleNumber: 1, moduleName: 'Module 1: Salary Income', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-tax2-01b', 'q-tax2-02'], subtopics: [
        'Salary: Meaning & Components',
        'Allowances: Taxable & Exempt',
        'Perquisites: Types & Valuation',
        'Deduction under Section 16',
        'Computation of Salary Income'
      ], explanationMd: `# Income from Salary

Salary includes basic wages, allowances, perquisites and profits in lieu of salary.`,
      formulas: [
        { id: 'formula-tax2-m1-1', label: 'Gross Salary', formula: 'Gross Salary = Basic + Allowances + Perquisites − Section 16 Deductions', exampleQ: 'Basic ₹40,000/month; HRA ₹10,000/month. Annual gross salary?', exampleA: 'Annual basic = 4,80,000; Annual HRA = 1,20,000; Gross = ₹6,00,000 (before deductions).' },
      ],
      tricks: [
        { id: 'trick-tax2-m1-1', title: 'Section 16 deductions', trick: 'Section 16: Standard deduction ₹50,000, entertainment allowance, professional tax.', whenToUse: 'Apply salary deductions.' },
      ],
      howToSolve: [
        { id: 'solve-tax2-m1-1', step: 'Step 1: Sum all salary components.', detail: 'Subtract Section 16 deductions.', questionType: 'Salary Income Problem' },
      ]
    },
    { id: 'tax2-mod2-income-from-house-property', subjectId: 'bba-karnataka-income-tax-2', title: 'Income from House Property', moduleNumber: 2, moduleName: 'Module 2: House Property Income', order: 2, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-tax2-03', 'q-tax2-04'], subtopics: [
        'House Property: Meaning',
        'Annual Value: Gross & Net',
        'Municipal Taxes',
        'Standard Deduction under Section 24',
        'Interest on Housing Loan'
      ], explanationMd: `# Income from House Property

Annual value is the inherent capacity of property to earn income.`,
      formulas: [
        { id: 'formula-tax2-m2-1', label: 'Net Annual Value', formula: 'NAV = GAV − Municipal Taxes', exampleQ: 'GAV ₹2,40,000; Municipal tax ₹20,000. NAV?', exampleA: 'NAV = 2,40,000 − 20,000 = ₹2,20,000.' },
      ],
      tricks: [
        { id: 'trick-tax2-m2-1', title: 'Standard deduction 24(a)', trick: 'Standard deduction = 30% of NAV (repairs, maintenance).', whenToUse: 'Apply 30% standard deduction.' },
      ],
      howToSolve: [
        { id: 'solve-tax2-m2-1', step: 'Step 1: Compute GAV and NAV.', detail: 'Apply standard deduction and interest.', questionType: 'House Property Problem' },
      ]
    },
    { id: 'tax2-mod3-profit-gains-business-profession', subjectId: 'bba-karnataka-income-tax-2', title: 'Profit & Gains from Business or Profession', moduleNumber: 3, moduleName: 'Module 3: Business Income', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-tax2-05', 'q-tax2-06'], subtopics: [
        'Business Income: Meaning',
        'Allowable Expenses',
        'Depreciation under Section 32',
        'Presumptive Taxation: Section 44AD',
        'Computation of Business Income'
      ], explanationMd: `# Profit & Gains from Business or Profession

Business income = Revenue − Allowable expenses − Depreciation.`,
      formulas: [
        { id: 'formula-tax2-mod3-profit-gains-business-profession-1', label: 'Key Formula', formula: 'Formula placeholder', exampleQ: 'Example question', exampleA: 'Example answer' },
      ],
      tricks: [
        { id: 'trick-tax2-m3-1', title: 'Section 44AD', trick: 'Section 44AD presumptive: 8% of turnover (6% digital) for small businesses.', whenToUse: 'Apply presumptive taxation.' },
      ],
      howToSolve: [
        { id: 'solve-tax2-m3-1', step: 'Step 1: Identify business receipts.', detail: 'Subtract allowable expenses and depreciation.', questionType: 'Business Income Problem' },
      ]
    },
    { id: 'tax2-mod5-capital-gains-income-other-sources', subjectId: 'bba-karnataka-income-tax-2', title: 'Capital Gains & Income from Other Sources', moduleNumber: 5, moduleName: 'Module 5: Capital Gains & Other Sources', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-tax2-07', 'q-tax2-08'], subtopics: [
        'Capital Gains: Short-term & Long-term',
        'Cost Inflation Index',
        'Exemptions: Sections 54, 54EC',
        'Income from Other Sources',
        'Deductions under Section 57'
      ], explanationMd: `# Capital Gains & Other Sources

LTCG on listed equity above ₹1 lakh is taxed at 10%.`,
      formulas: [
        { id: 'formula-tax2-m5-1', label: 'LTCG Tax', formula: 'LTCG on listed equity > ₹1 lakh = 10% without indexation', exampleQ: 'LTCG ₹1,50,000 on listed equity. Tax?', exampleA: 'Tax = 10% of (1,50,000 − 1,00,000) = ₹5,000.' },
      ],
      tricks: [
        { id: 'trick-tax2-m5-1', title: 'LTCG equity exemption', trick: 'LTCG up to ₹1 lakh per year on listed equity is exempt.', whenToUse: 'Apply ₹1 lakh LTCG exemption.' },
      ],
      howToSolve: [
        { id: 'solve-tax2-m5-1', step: 'Step 1: Classify STCG vs LTCG.', detail: 'Apply holding period rules.', questionType: 'Capital Gains Problem' },
      ]
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
  },  { id: 'q-acc-02', questionText: 'Which account is debited when goods are purchased for cash?', options: [
      'Purchases',
      'Cash',
      'Sales',
      'Capital'
    ], correctIndex: 0, explanation: 'Purchases account is debited; Cash is credited.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 1 }, prepTags: { subjectId: 'bba-karnataka-accounting', topicIds: ['acc-mod2-journal-ledger-trial-balance'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-acc-02b', questionText: 'Trial Balance is prepared to check:', options: [
      'Arithmetical accuracy',
      'Fraud detection',
      'All errors',
      'None'
    ], correctIndex: 0, explanation: 'Trial Balance checks arithmetical accuracy.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 1 }, prepTags: { subjectId: 'bba-karnataka-accounting', topicIds: ['acc-mod2-journal-ledger-trial-balance'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-acc-05', questionText: 'Closing stock is shown in:', options: [
      'Trading Account only',
      'Balance Sheet only',
      'Both Trading Account and Balance Sheet',
      'Profit & Loss Account'
    ], correctIndex: 2, explanation: 'Closing stock is credited to Trading A/c and shown as asset in Balance Sheet.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 1 }, prepTags: { subjectId: 'bba-karnataka-accounting', topicIds: ['acc-mod5-final-accounts-adjustments'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-acc-05b', questionText: 'Outstanding expenses are:', options: [
      'Assets',
      'Liabilities',
      'Incomes',
      'Expenses'
    ], correctIndex: 1, explanation: 'Outstanding expenses are unpaid expenses — a liability.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 1 }, prepTags: { subjectId: 'bba-karnataka-accounting', topicIds: ['acc-mod5-final-accounts-adjustments'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-mkt-01b', questionText: 'Which marketing concept focuses on customer needs and wants?', options: [
      'Production',
      'Product',
      'Selling',
      'Marketing'
    ], correctIndex: 3, explanation: 'Marketing concept focuses on customer needs.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 1 }, prepTags: { subjectId: 'bba-karnataka-marketing', topicIds: ['mkt-mod1-marketing-concepts-4ps'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-mkt-01c', questionText: 'Which of the following is NOT one of the 4Ps?', options: [
      'Product',
      'Price',
      'Place',
      'Profit'
    ], correctIndex: 3, explanation: 'The 4Ps are Product, Price, Place, Promotion — not Profit.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 1 }, prepTags: { subjectId: 'bba-karnataka-marketing', topicIds: ['mkt-mod1-marketing-concepts-4ps'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-mkt-04', questionText: 'Which channel has NO intermediary?', options: [
      'Zero-level',
      'One-level',
      'Two-level',
      'Three-level'
    ], correctIndex: 0, explanation: 'Zero-level channel is direct: manufacturer → customer.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 1 }, prepTags: { subjectId: 'bba-karnataka-marketing', topicIds: ['mkt-mod4-distribution-channels-retailing'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-mkt-04b', questionText: 'Kirana stores are examples of:', options: [
      'Organized retail',
      'Unorganized retail',
      'E-commerce',
      'Department stores'
    ], correctIndex: 1, explanation: 'Kirana stores are small, unorganized retail outlets.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 1 }, prepTags: { subjectId: 'bba-karnataka-marketing', topicIds: ['mkt-mod4-distribution-channels-retailing'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-mkt-05', questionText: 'Which is NOT an element of promotion mix?', options: [
      'Advertising',
      'Personal selling',
      'Sales promotion',
      'Production'
    ], correctIndex: 3, explanation: 'Production is not part of promotion mix.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 1 }, prepTags: { subjectId: 'bba-karnataka-marketing', topicIds: ['mkt-mod5-promotion-mix-advertising'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-mkt-05b', questionText: 'Sales promotion refers to:', options: [
      'Long-term brand building',
      'Short-term incentives',
      'Personal communication',
      'Mass media advertising'
    ], correctIndex: 1, explanation: 'Sales promotion uses short-term incentives.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 1 }, prepTags: { subjectId: 'bba-karnataka-marketing', topicIds: ['mkt-mod5-promotion-mix-advertising'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-mpa-03', questionText: 'Which structure has dual reporting relationships?', options: [
      'Line',
      'Functional',
      'Matrix',
      'Line & Staff'
    ], correctIndex: 2, explanation: 'Matrix structure combines functional and project reporting.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 1 }, prepTags: { subjectId: 'bba-karnataka-mpa', topicIds: ['mpa-mod3-organizing'], stream: 'management', program: 'bba' },
  },
  { id: 'q-mpa-03b', questionText: 'Delegation can be taken back; decentralization:', options: [
      'Can also be taken back',
      'Is wider dispersal of authority',
      'Is same as delegation',
      'None'
    ], correctIndex: 1, explanation: 'Decentralization is systematic dispersal of authority.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 1 }, prepTags: { subjectId: 'bba-karnataka-mpa', topicIds: ['mpa-mod3-organizing'], stream: 'management', program: 'bba' },
  },
  { id: 'q-mpa-04', questionText: 'Maslow’s highest level need is:', options: [
      'Safety',
      'Social',
      'Esteem',
      'Self-actualization'
    ], correctIndex: 3, explanation: 'Self-actualization is the top of Maslow’s hierarchy.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 1 }, prepTags: { subjectId: 'bba-karnataka-mpa', topicIds: ['mpa-mod4-staffing-leadership-motivation'], stream: 'management', program: 'bba' },
  },
  { id: 'q-mpa-04b', questionText: 'Herzberg’s motivators include:', options: [
      'Salary',
      'Company policy',
      'Recognition',
      'Working conditions'
    ], correctIndex: 2, explanation: 'Recognition is a motivator; salary and policy are hygiene factors.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 1 }, prepTags: { subjectId: 'bba-karnataka-mpa', topicIds: ['mpa-mod4-staffing-leadership-motivation'], stream: 'management', program: 'bba' },
  },
  { id: 'q-mpa-05', questionText: 'The control process starts with:', options: [
      'Taking corrective action',
      'Setting standards',
      'Measuring performance',
      'Comparing'
    ], correctIndex: 1, explanation: 'Control begins with setting performance standards.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 1 }, prepTags: { subjectId: 'bba-karnataka-mpa', topicIds: ['mpa-mod5-directing-coordination-control'], stream: 'management', program: 'bba' },
  },
  { id: 'q-mpa-05b', questionText: 'PERT/CPM is which type of control technique?', options: [
      'Budgetary',
      'Non-budgetary',
      'Traditional',
      'None'
    ], correctIndex: 1, explanation: 'PERT/CPM is a non-budgetary control technique.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 1 }, prepTags: { subjectId: 'bba-karnataka-mpa', topicIds: ['mpa-mod5-directing-coordination-control'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ob-01b', questionText: 'Which Big Five trait describes an employee who is dependable, organised and achievement-oriented?', options: [
      'Openness',
      'Conscientiousness',
      'Extraversion',
      'Neuroticism'
    ], correctIndex: 1, explanation: 'Conscientiousness reflects dependability, organisation and achievement orientation.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-ob', topicIds: ['ob-mod1-individual-behaviour-personality'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ob-02', questionText: 'Under classical conditioning, a neutral stimulus is paired with which type of stimulus?', options: [
      'Unconditioned stimulus',
      'Conditioned response',
      'Reinforcement',
      'Punishment'
    ], correctIndex: 0, explanation: 'Pavlov paired a neutral stimulus with an unconditioned stimulus to produce a conditioned response.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-ob', topicIds: ['ob-mod1-individual-behaviour-personality'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ob-03', questionText: 'In perception, which factor affects how we interpret sensory information?', options: [
      'Motivation',
      'Learning',
      'Personality',
      'All of the above'
    ], correctIndex: 3, explanation: 'Motivation, learning and personality all affect perception.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-ob', topicIds: ['ob-mod2-perception-learning-attitudes'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ob-03b', questionText: 'Which learning theory involves reinforcement after desired behaviour?', options: [
      'Classical conditioning',
      'Operant conditioning',
      'Cognitive learning',
      'Social learning'
    ], correctIndex: 1, explanation: 'Operant conditioning uses reinforcement after desired behaviour.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-ob', topicIds: ['ob-mod2-perception-learning-attitudes'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ob-04', questionText: 'In Tuckman\'s model, which stage is characterised by conflict over roles and leadership?', options: [
      'Forming',
      'Storming',
      'Norming',
      'Performing'
    ], correctIndex: 1, explanation: 'Storming is marked by conflict and resistance.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-ob', topicIds: ['ob-mod4-groups-teams-conflict'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ob-05', questionText: 'Which conflict style is both assertive and cooperative?', options: [
      'Competing',
      'Collaborating',
      'Avoiding',
      'Accommodating'
    ], correctIndex: 1, explanation: 'Collaborating is high assertiveness + high cooperation (win-win).', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bengaluru City University (BCU)', year: 2024, marks: 5, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-ob', topicIds: ['ob-mod4-groups-teams-conflict'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ob-05b', questionText: 'Which Kotter step comes immediately after forming a guiding coalition?', options: [
      'Create urgency',
      'Create a vision',
      'Communicate the vision',
      'Generate short-term wins'
    ], correctIndex: 1, explanation: 'After the coalition, the next step is to create the strategic vision.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-ob', topicIds: ['ob-mod5-organisational-culture-change'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ob-05c', questionText: 'In Lewin\'s model, which step stabilises the new state after change?', options: [
      'Unfreeze',
      'Change',
      'Refreeze',
      'Evaluate'
    ], correctIndex: 2, explanation: 'Refreeze locks in new behaviours.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-ob', topicIds: ['ob-mod5-organisational-culture-change'], stream: 'management', program: 'bba' },
  },
  { id: 'q-math-01b', questionText: 'Profit percentage is always computed on which base?', options: [
      'Selling Price',
      'Cost Price',
      'Marked Price',
      'Discount'
    ], correctIndex: 1, explanation: 'Profit% and Loss% are computed on Cost Price.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-math', topicIds: ['math-mod2-commercial-arithmetic'], stream: 'aptitude', program: 'bba' },
  },
  { id: 'q-math-02b', questionText: 'Goods bought for ₹400 sold for ₹500. Profit %?', options: [
      '20%',
      '25%',
      '30%',
      '200%'
    ], correctIndex: 1, explanation: 'Profit = ₹100; Profit % = 100/400 × 100 = 25%.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-math', topicIds: ['math-mod2-commercial-arithmetic'], stream: 'aptitude', program: 'bba' },
  },
  { id: 'q-math-03', questionText: '₹10,000 at 10% p.a. compounded annually for 2 years. Amount?', options: [
      '₹11,000',
      '₹12,000',
      '₹12,100',
      '₹13,310'
    ], correctIndex: 2, explanation: 'A = 10,000(1.10)^2 = ₹12,100.', difficulty: 'core', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-math', topicIds: ['math-mod3-interest-annuities'], stream: 'aptitude', program: 'bba' },
  },
  { id: 'q-math-04', questionText: 'CI − SI for 2 years = ?', options: [
      'P × R/100',
      'P × (R/100)^2',
      'P × R × 2',
      'P × (1+R/100)^2'
    ], correctIndex: 1, explanation: 'The difference for 2 years = Principal × (Rate/100)^2.', difficulty: 'core', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-math', topicIds: ['math-mod3-interest-annuities'], stream: 'aptitude', program: 'bba' },
  },
  { id: 'q-math-05', questionText: 'For maxima, the second order condition requires f\'\'(x) to be:', options: [
      'Positive',
      'Negative',
      'Zero',
      'Undefined'
    ], correctIndex: 1, explanation: 'f\'\'(x) < 0 confirms a maximum.', difficulty: 'advanced', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-math', topicIds: ['math-mod4-calculus-optimization'], stream: 'aptitude', program: 'bba' },
  },
  { id: 'q-math-06', questionText: 'Profit maximisation occurs where:', options: [
      'MR > MC',
      'MR < MC',
      'MR = MC',
      'AR = AC'
    ], correctIndex: 2, explanation: 'A firm maximises profit where Marginal Revenue equals Marginal Cost.', difficulty: 'advanced', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-math', topicIds: ['math-mod4-calculus-optimization'], stream: 'aptitude', program: 'bba' },
  },
  { id: 'q-eco-01b', questionText: 'TP with 3 workers = 30; TP with 4 workers = 38. MP of 4th worker?', options: [
      '6',
      '8',
      '10',
      '12'
    ], correctIndex: 1, explanation: 'MP = (38 − 30) ÷ (4 − 3) = 8 units.', difficulty: 'core', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-economics', topicIds: ['eco-mod2-production-functions'], stream: 'economics', program: 'bba' },
  },
  { id: 'q-eco-02', questionText: 'When MP > AP, AP is:', options: [
      'Rising',
      'Falling',
      'Constant',
      'Zero'
    ], correctIndex: 0, explanation: 'When marginal product exceeds average product, the average is pulled up.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-economics', topicIds: ['eco-mod2-production-functions'], stream: 'economics', program: 'bba' },
  },
  { id: 'q-eco-03', questionText: 'MC cuts AC at:', options: [
      'Maximum',
      'Minimum',
      'Never',
      'Always above'
    ], correctIndex: 1, explanation: 'The MC curve intersects AC at its minimum point.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-economics', topicIds: ['eco-mod3-cost-curves'], stream: 'economics', program: 'bba' },
  },
  { id: 'q-eco-04', questionText: 'TC at 10 units = ₹500; TC at 11 units = ₹545. MC of 11th unit?', options: [
      '₹35',
      '₹40',
      '₹45',
      '₹50'
    ], correctIndex: 2, explanation: 'MC = (545 − 500) ÷ (11 − 10) = ₹45.', difficulty: 'core', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 5, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-economics', topicIds: ['eco-mod3-cost-curves'], stream: 'economics', program: 'bba' },
  },
  { id: 'q-eco-05', questionText: 'Single seller, unique product, high entry barriers = ?', options: [
      'Perfect Competition',
      'Monopoly',
      'Monopolistic Competition',
      'Oligopoly'
    ], correctIndex: 1, explanation: 'A single seller with no close substitutes defines monopoly.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-economics', topicIds: ['eco-mod4-market-structures'], stream: 'economics', program: 'bba' },
  },
  { id: 'q-eco-06', questionText: 'Many sellers, differentiated products = ?', options: [
      'Monopoly',
      'Oligopoly',
      'Monopolistic Competition',
      'Perfect Competition'
    ], correctIndex: 2, explanation: 'Product differentiation with many sellers is monopolistic competition.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-economics', topicIds: ['eco-mod4-market-structures'], stream: 'economics', program: 'bba' },
  },
  { id: 'q-eco-07', questionText: 'Low initial price to gain market share = ?', options: [
      'Skimming',
      'Penetration',
      'Cost-plus',
      'Discrimination'
    ], correctIndex: 1, explanation: 'Penetration pricing sets a low initial price to capture market share quickly.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-economics', topicIds: ['eco-mod5-managerial-pricing'], stream: 'economics', program: 'bba' },
  },
  { id: 'q-eco-08', questionText: 'High initial price for innovative product = ?', options: [
      'Penetration',
      'Skimming',
      'Cost-plus',
      'Psychological'
    ], correctIndex: 1, explanation: 'Skimming sets a high initial price for innovative products.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 2 }, prepTags: { subjectId: 'bba-karnataka-economics', topicIds: ['eco-mod5-managerial-pricing'], stream: 'economics', program: 'bba' },
  },
  { id: 'q-cost-01b', questionText: 'EOQ formula = ?', options: [
      '√(2DS/H)',
      'D × S',
      'D/H',
      'S × H'
    ], correctIndex: 0, explanation: 'EOQ = √(2 × Demand × Setup/Order cost ÷ Holding cost per unit).', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-cost-accounting', topicIds: ['cost-mod3-material-labour-overheads'], stream: 'accounting', program: 'bba' },
  },
  { id: 'q-cost-02b', questionText: 'Idle time is treated as:', options: [
      'Direct labour cost',
      'Indirect labour cost',
      'Material cost',
      'Overhead'
    ], correctIndex: 1, explanation: 'Idle time is indirect labour — part of overheads.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-cost-accounting', topicIds: ['cost-mod3-material-labour-overheads'], stream: 'accounting', program: 'bba' },
  },
  { id: 'q-cost-03b', questionText: 'Material Price Variance = ?', options: [
      '(SP − AP) × AQ',
      '(SP − AP) × SQ',
      '(SQ − AQ) × SP',
      'SP × AQ'
    ], correctIndex: 0, explanation: 'MPV = (Standard Price − Actual Price) × Actual Quantity.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-cost-accounting', topicIds: ['cost-mod5-variance-analysis-budgetary-control'], stream: 'accounting', program: 'bba' },
  },
  { id: 'q-cost-04', questionText: 'SP ₹50, AP ₹55, AQ 1000 units. Material Price Variance?', options: [
      '₹5,000 Favourable',
      '₹5,000 Adverse',
      '₹55,000',
      '₹50,000'
    ], correctIndex: 1, explanation: 'MPV = (50 − 55) × 1000 = −₹5,000 (Adverse).', difficulty: 'core', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 5, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-cost-accounting', topicIds: ['cost-mod5-variance-analysis-budgetary-control'], stream: 'accounting', program: 'bba' },
  },
  { id: 'q-stats-01', questionText: 'Census method of data collection:', options: [
      'Covers every item',
      'Covers a sample',
      'Is less expensive',
      'Is quicker'
    ], correctIndex: 0, explanation: 'Census covers every item in the population.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-statistics', topicIds: ['stats-mod1-collection-classification-presentation'], stream: 'aptitude', program: 'bba' },
  },
  { id: 'q-stats-02', questionText: 'Secondary data is:', options: [
      'Collected first-hand',
      'Already published',
      'Always more accurate',
      'Primary in nature'
    ], correctIndex: 1, explanation: 'Secondary data has already been collected and published by others.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-statistics', topicIds: ['stats-mod1-collection-classification-presentation'], stream: 'aptitude', program: 'bba' },
  },
  { id: 'q-stats-03', questionText: 'Sales: 100, 120, 110. 3-year moving average?', options: [
      '100',
      '110',
      '120',
      '113'
    ], correctIndex: 1, explanation: '(100 + 120 + 110) ÷ 3 = 110.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-statistics', topicIds: ['stats-mod4-time-series-analysis'], stream: 'aptitude', program: 'bba' },
  },
  { id: 'q-stats-04', questionText: 'Which component shows long-term movement?', options: [
      'Seasonal',
      'Cyclical',
      'Secular trend',
      'Irregular'
    ], correctIndex: 2, explanation: 'Secular trend shows long-term movement.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-statistics', topicIds: ['stats-mod4-time-series-analysis'], stream: 'aptitude', program: 'bba' },
  },
  { id: 'q-stats-05', questionText: 'Fisher’s Ideal Index = ?', options: [
      'Laspeyres × Paasche',
      '√(Laspeyres × Paasche)',
      '(L + P) ÷ 2',
      'L − P'
    ], correctIndex: 1, explanation: 'Fisher’s Ideal Index is the geometric mean of Laspeyres and Paasche.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-statistics', topicIds: ['stats-mod5-index-numbers'], stream: 'aptitude', program: 'bba' },
  },
  { id: 'q-stats-06', questionText: 'Laspeyres = 120, Paasche = 110. Fisher’s Ideal Index?', options: [
      '110',
      '115',
      '114.89',
      '120'
    ], correctIndex: 2, explanation: 'Fisher = √(120 × 110) = √13200 ≈ 114.89.', difficulty: 'core', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 5, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-statistics', topicIds: ['stats-mod5-index-numbers'], stream: 'aptitude', program: 'bba' },
  },
  { id: 'q-fm-01b', questionText: 'RBI regulates which market?', options: [
      'Money market',
      'Capital market',
      'Both',
      'Neither'
    ], correctIndex: 0, explanation: 'RBI regulates money market and banking.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-fin-markets', topicIds: ['fm-mod1-indian-financial-system'], stream: 'economics', program: 'bba' },
  },
  { id: 'q-fm-02', questionText: 'SEBI regulates:', options: [
      'Money market',
      'Capital market',
      'Foreign exchange',
      'Banking'
    ], correctIndex: 1, explanation: 'SEBI regulates capital market and securities.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-fin-markets', topicIds: ['fm-mod1-indian-financial-system'], stream: 'economics', program: 'bba' },
  },
  { id: 'q-fm-03', questionText: 'Debenture holders are:', options: [
      'Owners',
      'Creditors',
      'Managers',
      'Employees'
    ], correctIndex: 1, explanation: 'Debenture holders are creditors of the company.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-fin-markets', topicIds: ['fm-mod3-capital-market-instruments'], stream: 'economics', program: 'bba' },
  },
  { id: 'q-fm-04', questionText: 'Equity shareholders have:', options: [
      'Fixed dividend',
      'Voting rights',
      'Guaranteed return',
      'Priority in repayment'
    ], correctIndex: 1, explanation: 'Equity shareholders have voting rights.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-fin-markets', topicIds: ['fm-mod3-capital-market-instruments'], stream: 'economics', program: 'bba' },
  },
  { id: 'q-fm-05', questionText: 'Insider trading is:', options: [
      'Legal',
      'Prohibited by SEBI',
      'Encouraged',
      'None'
    ], correctIndex: 1, explanation: 'SEBI prohibits insider trading.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-fin-markets', topicIds: ['fm-mod4-sebi-regulations'], stream: 'economics', program: 'bba' },
  },
  { id: 'q-fm-06', questionText: 'SEBI’s protective function includes:', options: [
      'Investor education',
      'Price fixing',
      'Company formation',
      'None'
    ], correctIndex: 0, explanation: 'Investor education and grievance redressal are protective functions.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-fin-markets', topicIds: ['fm-mod4-sebi-regulations'], stream: 'economics', program: 'bba' },
  },
  { id: 'q-fm-07', questionText: 'Money market instruments have maturity of:', options: [
      'Up to 1 year',
      'More than 1 year',
      '5–10 years',
      'Perpetual'
    ], correctIndex: 0, explanation: 'Money market deals in short-term funds up to 1 year.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-fin-markets', topicIds: ['fm-mod5-money-market-instruments'], stream: 'economics', program: 'bba' },
  },
  { id: 'q-fm-08', questionText: 'Treasury Bills are issued by:', options: [
      'RBI on behalf of Government',
      'Commercial banks',
      'SEBI',
      'Companies'
    ], correctIndex: 0, explanation: 'T-Bills are issued by RBI on behalf of the Government of India.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 3 }, prepTags: { subjectId: 'bba-karnataka-fin-markets', topicIds: ['fm-mod5-money-market-instruments'], stream: 'economics', program: 'bba' },
  },
  { id: 'q-colaw-01b', questionText: 'Which is NOT an essential of a valid contract?', options: [
      'Offer',
      'Acceptance',
      'Consideration',
      'Undue influence'
    ], correctIndex: 3, explanation: 'Undue influence vitiates free consent — it is not an essential element.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-business-law', topicIds: ['colaw-mod2-indian-contract-act'], stream: 'law', program: 'bba' },
  },
  { id: 'q-colaw-02', questionText: 'Consideration must be:', options: [
      'Adequate',
      'Real and lawful',
      'Monetary only',
      'Past'
    ], correctIndex: 1, explanation: 'Consideration must be real and lawful — not necessarily adequate.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-business-law', topicIds: ['colaw-mod2-indian-contract-act'], stream: 'law', program: 'bba' },
  },
  { id: 'q-colaw-03', questionText: 'Breach of condition gives the buyer right to:', options: [
      'Claim damages only',
      'Reject the goods',
      'Both',
      'None'
    ], correctIndex: 1, explanation: 'Breach of condition → right to reject goods.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-business-law', topicIds: ['colaw-mod3-sale-of-goods-act'], stream: 'law', program: 'bba' },
  },
  { id: 'q-colaw-04', questionText: 'Caveat emptor means:', options: [
      'Buyer beware',
      'Seller beware',
      'Buyer beware with exceptions',
      'None'
    ], correctIndex: 0, explanation: 'Caveat emptor = buyer beware, subject to exceptions.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-business-law', topicIds: ['colaw-mod3-sale-of-goods-act'], stream: 'law', program: 'bba' },
  },
  { id: 'q-colaw-05', questionText: 'A cheque is a:', options: [
      'Bill of exchange',
      'Promissory note',
      'Contract',
      'None'
    ], correctIndex: 0, explanation: 'A cheque is a bill of exchange drawn on a specified banker and payable on demand.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-business-law', topicIds: ['colaw-mod4-negotiable-instruments-act'], stream: 'law', program: 'bba' },
  },
  { id: 'q-colaw-06', questionText: 'Holder in Due Course must:', options: [
      'Be a holder',
      'Give consideration',
      'Take in good faith',
      'All of the above'
    ], correctIndex: 3, explanation: 'HDC must be a holder, for consideration, in good faith, before maturity.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-business-law', topicIds: ['colaw-mod4-negotiable-instruments-act'], stream: 'law', program: 'bba' },
  },
  { id: 'q-colaw-07', questionText: 'Which is NOT a consumer right under CPA 2019?', options: [
      'Right to safety',
      'Right to information',
      'Right to profit',
      'Right to redressal'
    ], correctIndex: 2, explanation: 'Right to profit is not a consumer right.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-business-law', topicIds: ['colaw-mod5-consumer-protection-act'], stream: 'law', program: 'bba' },
  },
  { id: 'q-colaw-08', questionText: 'District Consumer Disputes Redressal Commission handles complaints up to:', options: [
      '₹20 lakh',
      '₹1 crore',
      '₹10 crore',
      '₹50 lakh'
    ], correctIndex: 2, explanation: 'District Commission handles complaints up to ₹1 crore (under CPA 2019).', difficulty: 'core', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 5, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-business-law', topicIds: ['colaw-mod5-consumer-protection-act'], stream: 'law', program: 'bba' },
  },
  { id: 'q-fmngt-01', questionText: '₹10,000 at 10% for 2 years. FV = ?', options: [
      '₹11,000',
      '₹12,000',
      '₹12,100',
      '₹13,310'
    ], correctIndex: 2, explanation: 'FV = 10,000 × 1.10² = ₹12,100.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-fin-mgmt', topicIds: ['fm-mngt-mod1-time-value-of-money'], stream: 'finance', program: 'bba' },
  },
  { id: 'q-fmngt-02', questionText: 'PV of ₹12,100 due in 2 years at 10%?', options: [
      '₹10,000',
      '₹10,500',
      '₹11,000',
      '₹11,500'
    ], correctIndex: 0, explanation: 'PV = 12,100 ÷ 1.10² = ₹10,000.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-fin-mgmt', topicIds: ['fm-mngt-mod1-time-value-of-money'], stream: 'finance', program: 'bba' },
  },
  { id: 'q-fmngt-03', questionText: 'Working Capital = ?', options: [
      'CA − CL',
      'CA + CL',
      'CL − CA',
      'CA × CL'
    ], correctIndex: 0, explanation: 'Working capital = Current assets − Current liabilities.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-fin-mgmt', topicIds: ['fm-mngt-mod4-dividend-decision'], stream: 'finance', program: 'bba' },
  },
  { id: 'q-fmngt-04', questionText: 'CA ₹5,00,000; CL ₹3,00,000. Working capital?', options: [
      '₹2,00,000',
      '₹3,00,000',
      '₹5,00,000',
      '₹8,00,000'
    ], correctIndex: 0, explanation: '₹5,00,000 − ₹3,00,000 = ₹2,00,000.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-fin-mgmt', topicIds: ['fm-mngt-mod4-dividend-decision'], stream: 'finance', program: 'bba' },
  },
  { id: 'q-fmngt-05', questionText: 'NPV decision rule: accept if NPV is:', options: [
      'Positive',
      'Negative',
      'Zero',
      'None'
    ], correctIndex: 0, explanation: 'NPV > 0 means accept the project.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-fin-mgmt', topicIds: ['fm-mngt-mod5-capital-budgeting'], stream: 'finance', program: 'bba' },
  },
  { id: 'q-fmngt-06', questionText: 'Payback period measures:', options: [
      'Profitability',
      'Time to recover investment',
      'IRR',
      'NPV'
    ], correctIndex: 1, explanation: 'Payback period = time to recover initial investment.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-fin-mgmt', topicIds: ['fm-mngt-mod5-capital-budgeting'], stream: 'finance', program: 'bba' },
  },
  { id: 'q-hrm-01b', questionText: 'HRM stands for:', options: [
      'Human Resource Management',
      'Human Relations Management',
      'Human Resource Manufacturing',
      'None'
    ], correctIndex: 0, explanation: 'HRM = Human Resource Management.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-hrm', topicIds: ['hrm-mod1-introduction-hrm-functions'], stream: 'management', program: 'bba' },
  },
  { id: 'q-hrm-02', questionText: 'Job analysis includes:', options: [
      'Job description',
      'Job specification',
      'Both',
      'None'
    ], correctIndex: 2, explanation: 'Job analysis produces both job description and job specification.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-hrm', topicIds: ['hrm-mod1-introduction-hrm-functions'], stream: 'management', program: 'bba' },
  },
  { id: 'q-hrm-03', questionText: 'On-the-job training method:', options: [
      'Job rotation',
      'Lectures',
      'Case study',
      'Conference'
    ], correctIndex: 0, explanation: 'Job rotation is an on-the-job training method.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-hrm', topicIds: ['hrm-mod3-training-development'], stream: 'management', program: 'bba' },
  },
  { id: 'q-hrm-04', questionText: 'Performance appraisal evaluates:', options: [
      'Past performance',
      'Future potential',
      'Both',
      'None'
    ], correctIndex: 2, explanation: 'Performance appraisal evaluates past performance and future potential.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-hrm', topicIds: ['hrm-mod3-training-development'], stream: 'management', program: 'bba' },
  },
  { id: 'q-hrm-05', questionText: 'Direct compensation includes:', options: [
      'Wages',
      'Salary',
      'Both',
      'None'
    ], correctIndex: 2, explanation: 'Direct compensation includes wages and salary.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-hrm', topicIds: ['hrm-mod4-compensation-benefits'], stream: 'management', program: 'bba' },
  },
  { id: 'q-hrm-06', questionText: 'Employee benefits are:', options: [
      'Direct compensation',
      'Indirect compensation',
      'Both',
      'None'
    ], correctIndex: 1, explanation: 'Benefits are indirect compensation.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-hrm', topicIds: ['hrm-mod4-compensation-benefits'], stream: 'management', program: 'bba' },
  },
  { id: 'q-hrm-07', questionText: 'Collective bargaining is:', options: [
      'Negotiation between union and management',
      'Individual negotiation',
      'Legal dispute',
      'None'
    ], correctIndex: 0, explanation: 'Collective bargaining is negotiation between union and management.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-hrm', topicIds: ['hrm-mod5-employee-relations-retention'], stream: 'management', program: 'bba' },
  },
  { id: 'q-hrm-08', questionText: 'Grievance handling is part of:', options: [
      'Employee relations',
      'Recruitment',
      'Payroll',
      'None'
    ], correctIndex: 0, explanation: 'Grievance handling falls under employee relations.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 4 }, prepTags: { subjectId: 'bba-karnataka-hrm', topicIds: ['hrm-mod5-employee-relations-retention'], stream: 'management', program: 'bba' },
  },
  { id: 'q-mgmt-01', questionText: 'Current Ratio = ?', options: [
      'CA ÷ CL',
      'CL ÷ CA',
      'CA × CL',
      'CA + CL'
    ], correctIndex: 0, explanation: 'Current Ratio = Current Assets ÷ Current Liabilities.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-mgmt-accounting', topicIds: ['mgmt-mod1-financial-statement-analysis'], stream: 'accounting', program: 'bba' },
  },
  { id: 'q-mgmt-02', questionText: 'CA ₹4,00,000; CL ₹2,00,000. Current Ratio?', options: [
      '1:1',
      '2:1',
      '3:1',
      '0.5:1'
    ], correctIndex: 1, explanation: '4,00,000 ÷ 2,00,000 = 2:1.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-mgmt-accounting', topicIds: ['mgmt-mod1-financial-statement-analysis'], stream: 'accounting', program: 'bba' },
  },
  { id: 'q-mgmt-03', questionText: 'Cash flow from operating activities includes:', options: [
      'Cash receipts from customers',
      'Purchase of land',
      'Issue of shares',
      'Repayment of loan'
    ], correctIndex: 0, explanation: 'Cash receipts from customers is operating activity.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-mgmt-accounting', topicIds: ['mgmt-mod2-fund-flow-cash-flow'], stream: 'accounting', program: 'bba' },
  },
  { id: 'q-mgmt-04', questionText: 'Issue of shares is:', options: [
      'Operating activity',
      'Investing activity',
      'Financing activity',
      'None'
    ], correctIndex: 2, explanation: 'Issue of shares is a financing activity.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-mgmt-accounting', topicIds: ['mgmt-mod2-fund-flow-cash-flow'], stream: 'accounting', program: 'bba' },
  },
  { id: 'q-mgmt-05', questionText: 'Zero-based budgeting starts from:', options: [
      'Previous year budget',
      'Zero',
      'Last actuals',
      'None'
    ], correctIndex: 1, explanation: 'ZBB starts from zero — every expense must be justified.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-mgmt-accounting', topicIds: ['mgmt-mod4-budgetary-control'], stream: 'accounting', program: 'bba' },
  },
  { id: 'q-mgmt-06', questionText: 'Flexible budget changes with:', options: [
      'Activity level',
      'Time',
      'Inflation',
      'None'
    ], correctIndex: 0, explanation: 'Flexible budget adjusts for different activity levels.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-mgmt-accounting', topicIds: ['mgmt-mod4-budgetary-control'], stream: 'accounting', program: 'bba' },
  },
  { id: 'q-mgmt-07', questionText: 'Sales ₹1,00,000; Variable Cost ₹60,000. P/V Ratio?', options: [
      '40%',
      '60%',
      '50%',
      '30%'
    ], correctIndex: 0, explanation: 'Contribution = 40,000; P/V Ratio = 40,000 ÷ 1,00,000 × 100 = 40%.', difficulty: 'core', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-mgmt-accounting', topicIds: ['mgmt-mod5-marginal-costing-decision-making'], stream: 'accounting', program: 'bba' },
  },
  { id: 'q-mgmt-08', questionText: 'Contribution = ?', options: [
      'Sales − Variable Cost',
      'Sales − Fixed Cost',
      'Fixed Cost − Variable Cost',
      'None'
    ], correctIndex: 0, explanation: 'Contribution = Sales − Variable Cost.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-mgmt-accounting', topicIds: ['mgmt-mod5-marginal-costing-decision-making'], stream: 'accounting', program: 'bba' },
  },
  { id: 'q-tax1-01', questionText: 'Assessment Year follows:', options: [
      'Previous year',
      'Current year',
      'Next year',
      'None'
    ], correctIndex: 0, explanation: 'Assessment Year immediately follows Previous Year.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-income-tax-1', topicIds: ['tax1-mod1-basic-concepts-residential-status'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-tax1-02', questionText: 'Resident individual stays in India for:', options: [
      '182 days or more',
      'Less than 182 days',
      '60 days',
      '365 days'
    ], correctIndex: 0, explanation: '182 days or more in the previous year makes an individual resident.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-income-tax-1', topicIds: ['tax1-mod1-basic-concepts-residential-status'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-tax1-03', questionText: 'GTI ₹6,00,000; 80C deduction ₹1,50,000. Total Income?', options: [
      '₹4,50,000',
      '₹6,00,000',
      '₹7,50,000',
      '₹1,50,000'
    ], correctIndex: 0, explanation: 'Total Income = 6,00,000 − 1,50,000 = ₹4,50,000.', difficulty: 'core', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-income-tax-1', topicIds: ['tax1-mod4-computation-total-income'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-tax1-04', questionText: 'Section 80C deduction limit is:', options: [
      '₹1,00,000',
      '₹1,50,000',
      '₹2,00,000',
      '₹2,50,000'
    ], correctIndex: 1, explanation: 'Section 80C limit is ₹1,50,000.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-income-tax-1', topicIds: ['tax1-mod4-computation-total-income'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-tax1-05', questionText: 'Tax evasion is:', options: [
      'Legal',
      'Illegal',
      'Both',
      'None'
    ], correctIndex: 1, explanation: 'Tax evasion is illegal — it involves concealment and fraud.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-income-tax-1', topicIds: ['tax1-mod5-tax-planning-avoidance-evasion'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-tax1-06', questionText: 'Legitimate tax planning involves:', options: [
      'Arranging affairs to minimise tax',
      'Concealing income',
      'False deductions',
      'None'
    ], correctIndex: 0, explanation: 'Tax planning arranges affairs legally to minimise tax.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-income-tax-1', topicIds: ['tax1-mod5-tax-planning-avoidance-evasion'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-ops-01b', questionText: 'Operations management transforms:', options: [
      'Inputs into outputs',
      'Money into profit',
      'People into products',
      'None'
    ], correctIndex: 0, explanation: 'OM transforms inputs into goods and services.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-operations-mgmt', topicIds: ['ops-mod1-production-operations-intro'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ops-02', questionText: 'Which production system is for mass production?', options: [
      'Job shop',
      'Batch',
      'Mass/continuous',
      'Project'
    ], correctIndex: 2, explanation: 'Mass/continuous production is for high-volume standardised products.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-operations-mgmt', topicIds: ['ops-mod1-production-operations-intro'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ops-03', questionText: 'ABC analysis classifies items by:', options: [
      'Value',
      'Quantity',
      'Weight',
      'Size'
    ], correctIndex: 0, explanation: 'ABC analysis classifies by annual consumption value.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-operations-mgmt', topicIds: ['ops-mod3-inventory-management'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ops-04', questionText: 'EOQ minimizes:', options: [
      'Ordering cost only',
      'Holding cost only',
      'Total inventory cost',
      'None'
    ], correctIndex: 2, explanation: 'EOQ minimises total inventory cost (ordering + holding).', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-operations-mgmt', topicIds: ['ops-mod3-inventory-management'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ops-05', questionText: 'TQM stands for:', options: [
      'Total Quality Management',
      'Total Quantity Management',
      'Technical Quality Management',
      'None'
    ], correctIndex: 0, explanation: 'TQM = Total Quality Management.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-operations-mgmt', topicIds: ['ops-mod4-quality-management'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ops-06', questionText: 'ISO 9000 is related to:', options: [
      'Quality management',
      'Environmental management',
      'Safety management',
      'None'
    ], correctIndex: 0, explanation: 'ISO 9000 family relates to quality management.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-operations-mgmt', topicIds: ['ops-mod4-quality-management'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ops-07', questionText: 'Supply chain starts with:', options: [
      'Supplier',
      'Customer',
      'Manufacturer',
      'Retailer'
    ], correctIndex: 0, explanation: 'Supply chain starts with the supplier.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-operations-mgmt', topicIds: ['ops-mod5-supply-chain-logistics'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ops-08', questionText: 'Reverse logistics deals with:', options: [
      'Product returns',
      'Forward delivery',
      'Manufacturing',
      'None'
    ], correctIndex: 0, explanation: 'Reverse logistics handles product returns and recycling.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 5 }, prepTags: { subjectId: 'bba-karnataka-operations-mgmt', topicIds: ['ops-mod5-supply-chain-logistics'], stream: 'management', program: 'bba' },
  },
  { id: 'q-strat-01b', questionText: 'Strategy at the highest level is:', options: [
      'Corporate-level',
      'Business-level',
      'Functional-level',
      'Operational'
    ], correctIndex: 0, explanation: 'Corporate-level strategy is the highest level.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-strategic-mgmt', topicIds: ['strat-mod1-introduction-strategic-management'], stream: 'management', program: 'bba' },
  },
  { id: 'q-strat-02', questionText: 'Vision statement describes:', options: [
      'Desired future state',
      'Current operations',
      'Daily tasks',
      'None'
    ], correctIndex: 0, explanation: 'Vision describes the desired future state of the organisation.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-strategic-mgmt', topicIds: ['strat-mod1-introduction-strategic-management'], stream: 'management', program: 'bba' },
  },
  { id: 'q-strat-03', questionText: 'SWOT Strengths and Weaknesses are:', options: [
      'Internal',
      'External',
      'Both',
      'None'
    ], correctIndex: 0, explanation: 'Strengths and weaknesses are internal to the organisation.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-strategic-mgmt', topicIds: ['strat-mod3-swot-pestle-analysis'], stream: 'management', program: 'bba' },
  },
  { id: 'q-strat-04', questionText: 'PESTLE “P” stands for:', options: [
      'Political',
      'Product',
      'Price',
      'Promotion'
    ], correctIndex: 0, explanation: 'PESTLE P = Political.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-strategic-mgmt', topicIds: ['strat-mod3-swot-pestle-analysis'], stream: 'management', program: 'bba' },
  },
  { id: 'q-strat-05', questionText: 'Balanced Scorecard perspectives:', options: [
      'Financial, Customer, Process, Learning',
      'Financial only',
      'Customer only',
      'None'
    ], correctIndex: 0, explanation: 'BSC has four perspectives: Financial, Customer, Internal Process, Learning & Growth.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-strategic-mgmt', topicIds: ['strat-mod4-strategy-implementation'], stream: 'management', program: 'bba' },
  },
  { id: 'q-strat-06', questionText: 'Strategic control includes:', options: [
      'Performance measurement',
      'Corrective action',
      'Both',
      'None'
    ], correctIndex: 2, explanation: 'Strategic control includes monitoring and corrective action.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-strategic-mgmt', topicIds: ['strat-mod4-strategy-implementation'], stream: 'management', program: 'bba' },
  },
  { id: 'q-strat-07', questionText: 'BCG “Stars” are:', options: [
      'High growth, high share',
      'Low growth, high share',
      'High growth, low share',
      'Low growth, low share'
    ], correctIndex: 0, explanation: 'Stars = high market growth + high relative market share.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-strategic-mgmt', topicIds: ['strat-mod5-corporate-level-strategies'], stream: 'management', program: 'bba' },
  },
  { id: 'q-strat-08', questionText: 'Divestment is a:', options: [
      'Growth strategy',
      'Stability strategy',
      'Retrenchment strategy',
      'None'
    ], correctIndex: 2, explanation: 'Divestment is selling a business unit — retrenchment strategy.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-strategic-mgmt', topicIds: ['strat-mod5-corporate-level-strategies'], stream: 'management', program: 'bba' },
  },
  { id: 'q-gst-01b', questionText: 'Intra-state supply attracts:', options: [
      'CGST + SGST',
      'IGST only',
      'UTGST only',
      'None'
    ], correctIndex: 0, explanation: 'Intra-state supply attracts both CGST and SGST.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-gst', topicIds: ['gst-mod2-gst-registration-compliance'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-gst-02b', questionText: 'GST was implemented in India on:', options: [
      '1 July 2017',
      '1 April 2017',
      '1 January 2017',
      '1 October 2017'
    ], correctIndex: 0, explanation: 'GST was implemented on 1 July 2017.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-gst', topicIds: ['gst-mod2-gst-registration-compliance'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-gst-03', questionText: 'GSTR-9 is:', options: [
      'Monthly return',
      'Quarterly return',
      'Annual return',
      'None'
    ], correctIndex: 2, explanation: 'GSTR-9 is the annual GST return.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-gst', topicIds: ['gst-mod4-gst-returns-assessment'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-gst-04', questionText: 'Input Tax Credit can be claimed on:', options: [
      'Business use',
      'Personal use',
      'Both',
      'None'
    ], correctIndex: 0, explanation: 'ITC is available only for business purposes.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-gst', topicIds: ['gst-mod4-gst-returns-assessment'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-gst-05', questionText: 'Customs duty is levied on:', options: [
      'Import of goods',
      'Export of goods',
      'Both',
      'Domestic sale'
    ], correctIndex: 2, explanation: 'Customs duty applies to both import and export of goods.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-gst', topicIds: ['gst-mod5-customs-law-basics'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-gst-06', questionText: 'Basic Customs Duty is levied on:', options: [
      'Imported goods',
      'Exported goods',
      'Both',
      'Domestic goods'
    ], correctIndex: 0, explanation: 'BCD is primarily levied on imported goods.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-gst', topicIds: ['gst-mod5-customs-law-basics'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-ent-01b', questionText: 'An entrepreneur is:', options: [
      'Risk bearer',
      'Employee',
      'Government official',
      'None'
    ], correctIndex: 0, explanation: 'An entrepreneur organises and bears the risks of business.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-entrepreneurship', topicIds: ['ent-mod1-introduction-entrepreneurship'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ent-02', questionText: 'Entrepreneurship contributes to:', options: [
      'Economic development',
      'Employment generation',
      'Both',
      'None'
    ], correctIndex: 2, explanation: 'Entrepreneurship drives economic development and employment.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-entrepreneurship', topicIds: ['ent-mod1-introduction-entrepreneurship'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ent-03', questionText: 'Business plan includes:', options: [
      'Market analysis',
      'Financial projections',
      'Both',
      'None'
    ], correctIndex: 2, explanation: 'A business plan includes market analysis and financial projections.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-entrepreneurship', topicIds: ['ent-mod3-business-plan-preparation'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ent-04', questionText: 'Executive summary is:', options: [
      'First section of plan',
      'Last section',
      'Optional',
      'None'
    ], correctIndex: 0, explanation: 'Executive summary is typically the first section of a business plan.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-entrepreneurship', topicIds: ['ent-mod3-business-plan-preparation'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ent-05', questionText: 'Bootstrapping means:', options: [
      'Self-funding',
      'Bank loan',
      'VC funding',
      'IPO'
    ], correctIndex: 0, explanation: 'Bootstrapping = self-funding from personal savings and revenue.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-entrepreneurship', topicIds: ['ent-mod4-finance-sources-startup'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ent-06', questionText: 'Angel investors invest in:', options: [
      'Early-stage startups',
      'Public companies',
      'Government projects',
      'None'
    ], correctIndex: 0, explanation: 'Angel investors typically invest in early-stage startups.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-entrepreneurship', topicIds: ['ent-mod4-finance-sources-startup'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ent-07', questionText: 'Startup India tax holiday is for:', options: [
      '3 years',
      '5 years',
      '7 years',
      '10 years'
    ], correctIndex: 0, explanation: 'Startup India provides tax holiday for 3 years out of first 7 years.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-entrepreneurship', topicIds: ['ent-mod5-startup-ecosystem-india'], stream: 'management', program: 'bba' },
  },
  { id: 'q-ent-08', questionText: 'MSME stands for:', options: [
      'Micro, Small & Medium Enterprises',
      'Medium & Small Manufacturing Enterprises',
      'None',
      'All of the above'
    ], correctIndex: 0, explanation: 'MSME = Micro, Small & Medium Enterprises.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-entrepreneurship', topicIds: ['ent-mod5-startup-ecosystem-india'], stream: 'management', program: 'bba' },
  },
  { id: 'q-claw-01', questionText: 'MOA stands for:', options: [
      'Memorandum of Association',
      'Articles of Association',
      'Certificate of Incorporation',
      'None'
    ], correctIndex: 0, explanation: 'MOA = Memorandum of Association.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-company-law', topicIds: ['colaw-mod2-companies-act-incorporation'], stream: 'law', program: 'bba' },
  },
  { id: 'q-claw-02', questionText: 'OPC means:', options: [
      'One Person Company',
      'One Public Company',
      'One Private Company',
      'None'
    ], correctIndex: 0, explanation: 'OPC = One Person Company.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-company-law', topicIds: ['colaw-mod2-companies-act-incorporation'], stream: 'law', program: 'bba' },
  },
  { id: 'q-claw-03', questionText: 'Preference shareholders get:', options: [
      'Fixed dividend',
      'Voting rights',
      'Both',
      'None'
    ], correctIndex: 0, explanation: 'Preference shares carry fixed dividend but generally no voting rights.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-company-law', topicIds: ['colaw-mod3-shares-debentures'], stream: 'law', program: 'bba' },
  },
  { id: 'q-claw-04', questionText: 'Issue of shares at premium means:', options: [
      'Above face value',
      'Below face value',
      'At face value',
      'None'
    ], correctIndex: 0, explanation: 'Shares issued at premium are priced above face value.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-company-law', topicIds: ['colaw-mod3-shares-debentures'], stream: 'law', program: 'bba' },
  },
  { id: 'q-claw-05', questionText: 'AGM must be held within:', options: [
      '6 months of year-end',
      '3 months',
      '1 month',
      'None'
    ], correctIndex: 0, explanation: 'AGM within 6 months of financial year-end.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-company-law', topicIds: ['colaw-mod4-company-management-directors'], stream: 'law', program: 'bba' },
  },
  { id: 'q-claw-06', questionText: 'Directors are appointed by:', options: [
      'Shareholders',
      'Government',
      'SEBI',
      'RBI'
    ], correctIndex: 0, explanation: 'Shareholders appoint directors.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-company-law', topicIds: ['colaw-mod4-company-management-directors'], stream: 'law', program: 'bba' },
  },
  { id: 'q-claw-07', questionText: 'IBC stands for:', options: [
      'Insolvency and Bankruptcy Code',
      'Indian Business Code',
      'None',
      'All of the above'
    ], correctIndex: 0, explanation: 'IBC = Insolvency and Bankruptcy Code.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-company-law', topicIds: ['colaw-mod5-winding-up-insolvency'], stream: 'law', program: 'bba' },
  },
  { id: 'q-claw-08', questionText: 'Voluntary winding up is initiated by:', options: [
      'Shareholders',
      'Creditors',
      'Court',
      'None'
    ], correctIndex: 0, explanation: 'Voluntary winding up is initiated by shareholders.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-company-law', topicIds: ['colaw-mod5-winding-up-insolvency'], stream: 'law', program: 'bba' },
  },
  { id: 'q-tax2-01b', questionText: 'Standard deduction under Section 16 is:', options: [
      '₹50,000',
      '₹40,000',
      '₹30,000',
      '₹1,00,000'
    ], correctIndex: 0, explanation: 'Standard deduction under Section 16 is ₹50,000.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-income-tax-2', topicIds: ['tax2-mod1-heads-of-income-salary'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-tax2-02', questionText: 'HRA is:', options: [
      'Fully taxable',
      'Fully exempt',
      'Partially exempt',
      'None'
    ], correctIndex: 2, explanation: 'HRA is partially exempt under Section 10(13A).', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-income-tax-2', topicIds: ['tax2-mod1-heads-of-income-salary'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-tax2-03', questionText: 'Standard deduction under Section 24(a) is:', options: [
      '30% of NAV',
      '30% of GAV',
      '20% of NAV',
      'None'
    ], correctIndex: 0, explanation: 'Standard deduction = 30% of Net Annual Value.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-income-tax-2', topicIds: ['tax2-mod2-income-from-house-property'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-tax2-04', questionText: 'GAV ₹2,40,000; Municipal tax ₹20,000. NAV?', options: [
      '₹2,20,000',
      '₹2,40,000',
      '₹2,00,000',
      '₹2,60,000'
    ], correctIndex: 0, explanation: 'NAV = 2,40,000 − 20,000 = ₹2,20,000.', difficulty: 'core', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 5, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-income-tax-2', topicIds: ['tax2-mod2-income-from-house-property'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-tax2-05', questionText: 'Section 44AD presumptive rate is:', options: [
      '8% of turnover',
      '10% of turnover',
      '6% of turnover',
      'None'
    ], correctIndex: 0, explanation: 'Section 44AD: 8% (non-digital) or 6% (digital) of turnover.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-income-tax-2', topicIds: ['tax2-mod3-profit-gains-business-profession'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-tax2-06', questionText: 'Depreciation is claimed under:', options: [
      'Section 32',
      'Section 80C',
      'Section 24',
      'Section 16'
    ], correctIndex: 0, explanation: 'Depreciation is claimed under Section 32 of the Income Tax Act.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-income-tax-2', topicIds: ['tax2-mod3-profit-gains-business-profession'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-tax2-07', questionText: 'LTCG on listed equity above ₹1 lakh is taxed at:', options: [
      '10%',
      '15%',
      '20%',
      '30%'
    ], correctIndex: 0, explanation: 'LTCG above ₹1 lakh on listed equity is taxed at 10%.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-income-tax-2', topicIds: ['tax2-mod5-capital-gains-income-other-sources'], stream: 'commerce', program: 'bba' },
  },
  { id: 'q-tax2-08', questionText: 'Income from other sources includes:', options: [
      'Interest income',
      'Dividend income',
      'Both',
      'None'
    ], correctIndex: 2, explanation: 'Interest and dividend are both income from other sources.', difficulty: 'basic', status: 'approved', pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 2, semester: 6 }, prepTags: { subjectId: 'bba-karnataka-income-tax-2', topicIds: ['tax2-mod5-capital-gains-income-other-sources'], stream: 'commerce', program: 'bba' },
  },

]
