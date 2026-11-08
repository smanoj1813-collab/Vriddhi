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

### Core Concept
**Organizing** converts plans into an operating structure: grouping activities, assigning duties, delegating authority and fixing responsibility. KSHEC Module 3 covers structure types, departmentation, and the authority-responsibility-delegation triangle. Karnataka example: delivery organisations such as Infosys or Wipro organise by function and by client account to keep command chains clear.

---

### Key Framework
1. **Structure types**: Line (simple chain of command), Functional (specialist bosses), Line and Staff (line decides, staff advises), Matrix (dual reporting).
2. **Departmentation**: Functional, Product, Geographic, Customer, Process.
3. **Authority, responsibility, accountability**: authority is the right to command; responsibility is the duty to perform; accountability cannot be delegated.
4. **Delegation vs decentralisation**: delegation is person-to-person; decentralisation is organisation-wide policy. Span of management: narrow (tall) versus wide (flat).

---

### Exam Focus
**Line vs Matrix**: line has single command; matrix has dual command (functional plus project), faster but conflict-prone.

![Organizing Structure Diagram](org-structure.png)`,
            formulas: [
              { id: 'formula-mpa-mod3-organizing-1', label: 'Delegation formula', formula: 'Authority delegated = Total authority minus Authority retained', exampleQ: 'Manager holds Rs 1 lakh sanction power, retains Rs 20k.', exampleA: 'Delegates Rs 80k.' },
              { id: 'formula-mpa-mod3-organizing-2', label: 'Span of management', formula: 'Number of direct reports a manager supervises', exampleQ: 'Manager A has 6 subordinates.', exampleA: 'Span = 6; wide spans make flat structures.' },
            ],
            tricks: [
              { id: 'trick-mpa-mod3-organizing-1', title: 'Scalar chain', trick: 'Scalar chain is the ladder of authority; Fayol gang plank allows direct contact across levels in emergencies.', whenToUse: 'Unity of command questions.' },
              { id: 'trick-mpa-mod3-organizing-2', title: 'Decentralisation test', trick: 'If top management keeps routine decisions too, it is centralised; pushing them down is decentralisation.', whenToUse: 'Case-study classification.' },
            ],
            howToSolve: [
              { id: 'solve-mpa-mod3-organizing-1', step: 'Step 1: state the purpose of organising (structure for plans)', detail: 'state the purpose of organising (structure for plans).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mpa-mod3-organizing-2', step: 'Step 2: identify the structure type in the case and its span of management', detail: 'identify the structure type in the case and its span of management.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mpa-mod3-organizing-3', step: 'Step 3: map authority, responsibility and accountability of the persons involved', detail: 'map authority, responsibility and accountability of the persons involved.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mpa-mod3-organizing-4', step: 'Step 4: conclude whether delegation/decentralisation is proper and name the d...', detail: 'conclude whether delegation/decentralisation is proper and name the departmentation basis.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'mpa-mod4-staffing-leadership-motivation', subjectId: 'bba-karnataka-mpa', title: 'Staffing, Leadership & Motivation', moduleNumber: 4, moduleName: 'Module 4: Staffing, Leadership & Motivation', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mpa-04', 'q-mpa-04b'], subtopics: [
        'Staffing: Meaning, Process & Importance',
        'Leadership: Styles (Autocratic, Democratic, Laissez-faire)',
        'Motivation: Maslow’s Hierarchy, Herzberg’s Two-Factor'
      ], explanationMd: `# Staffing, Leadership & Motivation

### Core Concept
**Staffing** fills positions with competent people: manpower planning, recruitment, selection, placement, training and appraisal. **Leadership** influences people toward goals; styles: Autocratic (decide alone), Democratic (participative), Laissez-faire (free rein). **Motivation** energises effort: Maslow hierarchy and Herzberg two-factor theory dominate the syllabus. Karnataka IT and manufacturing firms compete on retention, so motivation theory is practical, not academic.

---

### Key Framework
1. **Staffing process**: manpower planning, recruitment (internal/external), selection (tests, interviews, medical), placement and induction, training, performance appraisal, promotion/transfer.
2. **Leadership styles**: Autocratic: fast, low creativity; Democratic: high morale, slower; Laissez-faire: suits expert teams only.
3. **Maslow**: five needs in order: Physiological, Safety, Social, Esteem, Self-actualisation; a satisfied need stops motivating.
4. **Herzberg**: Hygiene factors (salary, conditions) prevent dissatisfaction; Motivators (achievement, recognition) create satisfaction.

---

### Exam Focus
**Maslow vs Herzberg**: Maslow is a need hierarchy; Herzberg splits the same needs into hygiene versus motivator factors.

![Leadership Motivation Diagram](leadership-motivation.png)`,
            formulas: [
              { id: 'formula-mpa-mod4-staffing-leadership-motivation-1', label: 'Staffing gap', formula: 'Manpower gap = Required manpower minus Available manpower', exampleQ: 'Need 150 staff, available 120.', exampleA: 'Gap = 30: recruit or train 30.' },
              { id: 'formula-mpa-mod4-staffing-leadership-motivation-2', label: 'Motivation fit', formula: 'Match the leadership style to team maturity: high maturity suits laissez-faire; new teams need direction.', exampleQ: 'Scenario: expert R&D team.', exampleA: 'Use laissez-faire or democratic style.' },
            ],
            tricks: [
              { id: 'trick-mpa-mod4-staffing-leadership-motivation-1', title: 'Two-factor split', trick: 'Hygiene = context (pay, policy, conditions); Motivator = content (growth, recognition).', whenToUse: 'Essay structuring trick.' },
              { id: 'trick-mpa-mod4-staffing-leadership-motivation-2', title: 'Style pick', trick: 'Autocratic for crisis/routine; democratic for skilled committed teams; laissez-faire for experts.', whenToUse: 'Case-study one-liners.' },
            ],
            howToSolve: [
              { id: 'solve-mpa-mod4-staffing-leadership-motivation-1', step: 'Step 1: diagnose the staffing stage asked (planning/recruitment/selection/app...', detail: 'diagnose the staffing stage asked (planning/recruitment/selection/appraisal).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mpa-mod4-staffing-leadership-motivation-2', step: 'Step 2: match leadership style to the team and task in the scenario', detail: 'match leadership style to the team and task in the scenario.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mpa-mod4-staffing-leadership-motivation-3', step: 'Step 3: apply Maslow to identify the unmet need level, or Herzberg to classif...', detail: 'apply Maslow to identify the unmet need level, or Herzberg to classify factors as hygiene or motivator.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mpa-mod4-staffing-leadership-motivation-4', step: 'Step 4: recommend one action (job enrichment, recognition, participation) wit...', detail: 'recommend one action (job enrichment, recognition, participation) with the theory behind it.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'mpa-mod5-directing-coordination-control', subjectId: 'bba-karnataka-mpa', title: 'Directing, Coordination & Control', moduleNumber: 5, moduleName: 'Module 5: Directing, Coordination & Control', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mpa-05', 'q-mpa-05b'], subtopics: [
        'Directing: Meaning, Principles & Importance',
        'Control: Meaning, Process & Types',
        'Control Techniques: Budgetary, Non-Budgetary, PERT/CPM'
      ], explanationMd: `# Directing, Coordination & Control

### Core Concept
**Directing** initiates action: communication, motivation, supervision and leadership. **Coordination** harmonises efforts across units. **Control** ensures results match plans: set standards, measure, compare, correct. Fayol called directing the bridge between planning and doing; without control, plans drift. Every Karnataka plant runs daily production boards: that is operational control in practice.

---

### Key Framework
1. **Elements of directing**: communication (formal/informal channels, barriers), motivation, supervision, leadership.
2. **Coordination**: continuous process; techniques: liaison officers, committees, integrators; Balancing of pooled interdependence.
3. **Control process**: (1) Set standards, (2) Measure performance, (3) Compare with standards, (4) Take corrective action.
4. **Control techniques**: budgetary control, ratio analysis, break-even analysis, PERT/CPM, internal audit, management by exception.

---

### Exam Focus
**Planning vs controlling**: planning is forward-looking (sets goals); controlling is backward-looking (measures and corrects), yet both feed each other.

![Directing Control Diagram](directing-control.png)`,
            formulas: [
              { id: 'formula-mpa-mod5-directing-coordination-control-1', label: 'Control deviation', formula: 'Deviation = Actual performance minus Standard performance', exampleQ: 'Standard 1,000 units, actual 920.', exampleA: 'Deviation = minus 80 units: corrective action needed.' },
              { id: 'formula-mpa-mod5-directing-coordination-control-2', label: 'Break-even point', formula: 'BEP units = Fixed cost / (Selling price minus Variable cost per unit)', exampleQ: 'FC Rs 40,000; SP Rs 100; VC Rs 60.', exampleA: 'BEP = 40,000 / 40 = 1,000 units.' },
            ],
            tricks: [
              { id: 'trick-mpa-mod5-directing-coordination-control-1', title: 'Communication span', trick: 'Effective downward communication falls sharply as levels grow; keep channels short.', whenToUse: 'Design question on barriers.' },
              { id: 'trick-mpa-mod5-directing-coordination-control-2', title: 'Control order', trick: 'Standard, measure, compare, correct: never skip the comparison step.', whenToUse: 'Process sequence answers.' },
            ],
            howToSolve: [
              { id: 'solve-mpa-mod5-directing-coordination-control-1', step: 'Step 1: state the directing elements relevant to the scenario (communication...', detail: 'state the directing elements relevant to the scenario (communication barrier, supervision gap).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mpa-mod5-directing-coordination-control-2', step: 'Step 2: identify the coordination mechanism missing (committee, liaison)', detail: 'identify the coordination mechanism missing (committee, liaison).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mpa-mod5-directing-coordination-control-3', step: 'Step 3: walk the control process with the given numbers: standard, actual, de...', detail: 'walk the control process with the given numbers: standard, actual, deviation.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mpa-mod5-directing-coordination-control-4', step: 'Step 4: recommend the corrective action and the control technique (budget, ra...', detail: 'recommend the corrective action and the control technique (budget, ratio, exception reporting).', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'acc-mod2-journal-ledger-trial-balance', subjectId: 'bba-karnataka-accounting', title: 'Journal, Ledger & Trial Balance', moduleNumber: 2, moduleName: 'Module 2: Journal, Ledger & Trial Balance', order: 2, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-acc-02', 'q-acc-02b'], subtopics: [
        'Journal: Meaning, Format & Rules of Debit/Credit',
        'Ledger: Posting from Journal, Balancing Accounts',
        'Trial Balance: Preparation, Objectives & Limitations',
        'Errors Disclosed & Not Disclosed by Trial Balance',
        'Suspense Account: Meaning & Rectification'
      ], explanationMd: `# Journal, Ledger & Trial Balance

### Core Concept
Accounting records flow **Journal (book of original entry) to Ledger (classified accounts) to Trial Balance (arithmetical check)**. The golden rules: personal accounts (debit the receiver, credit the giver), real accounts (debit what comes in, credit what goes out), nominal accounts (debit expenses/losses, credit incomes/gains). KSHEC tests journalising, posting and trial-balance preparation with suspense accounts.

---

### Key Framework
1. **Journal**: chronological record: date, particulars (with narration), LF, debit, credit; every transaction has two equal effects (double entry).
2. **Ledger**: posting from journal to T-accounts; balancing: debit side total versus credit side total.
3. **Trial balance**: extract of ledger balances; methods: balance method (net) and total method (gross); totals must agree.
4. **Errors**: errors of omission, commission, principle, compensating; one-sided errors go to the suspense account.

---

### Exam Focus
**Error of principle vs commission**: principle: wrong account head (capital treated as revenue); commission: right head, wrong person/amount.

![Journal Ledger Trial Balance Diagram](financial-statements.png)`,
            formulas: [
              { id: 'formula-acc-mod2-journal-ledger-trial-balance-1', label: 'Journal entry', formula: 'Debit the receiver and credit the giver for personal accounts', exampleQ: 'Purchased goods Rs 10,000 from Ram on credit.', exampleA: 'Debit Purchases A/c Rs 10,000; Credit Ram A/c Rs 10,000.' },
              { id: 'formula-acc-mod2-journal-ledger-trial-balance-2', label: 'Trial balance check', formula: 'Sum of debit balances must equal Sum of credit balances', exampleQ: 'Debit total Rs 5,20,000; credit total Rs 5,15,000.', exampleA: 'Difference Rs 5,000 goes to Suspense A/c until located.' },
            ],
            tricks: [
              { id: 'trick-acc-mod2-journal-ledger-trial-balance-1', title: 'Golden rules', trick: 'Personal: receiver/giver; Real: comes in/goes out; Nominal: expense-loss/income-gain.', whenToUse: 'Speeds up journalising.' },
              { id: 'trick-acc-mod2-journal-ledger-trial-balance-2', title: 'Suspense rule', trick: 'Only one-sided errors land in suspense; two-sided errors self-cancel or need rectification entries.', whenToUse: 'Rectification questions.' },
            ],
            howToSolve: [
              { id: 'solve-acc-mod2-journal-ledger-trial-balance-1', step: 'Step 1: identify the account heads affected and classify them (personal/real/...', detail: 'identify the account heads affected and classify them (personal/real/nominal).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-acc-mod2-journal-ledger-trial-balance-2', step: 'Step 2: apply the golden rules and write the journal entry with narration', detail: 'apply the golden rules and write the journal entry with narration.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-acc-mod2-journal-ledger-trial-balance-3', step: 'Step 3: post to ledger T-accounts and compute balances', detail: 'post to ledger T-accounts and compute balances.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-acc-mod2-journal-ledger-trial-balance-4', step: 'Step 4: prepare the trial balance; if totals differ, open a suspense account...', detail: 'prepare the trial balance; if totals differ, open a suspense account and note the error type.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'acc-mod5-final-accounts-adjustments', subjectId: 'bba-karnataka-accounting', title: 'Final Accounts & Adjustments', moduleNumber: 5, moduleName: 'Module 5: Final Accounts & Adjustments', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'very_high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-acc-05', 'q-acc-05b'], subtopics: [
        'Trading Account: Gross Profit/Loss Determination',
        'Profit & Loss Account: Net Profit/Loss Determination',
        'Balance Sheet: Assets & Liabilities Classification',
        'Adjustments: Closing Stock, Outstanding/Prepaid Expenses, Accrued/Unearned Income',
        'Depreciation, Bad Debts & Provision for Doubtful Debts'
      ], explanationMd: `# Final Accounts & Adjustments

### Core Concept
Final accounts of a trading concern: **Trading Account** (gross profit), **Profit and Loss Account** (net profit), **Balance Sheet** (financial position). Adjustments (closing stock, outstanding and prepaid expenses, depreciation, bad debts and provisions, drawings) must appear twice: in the P&L/trading figures and in the balance sheet. This dual-entry rule is the highest-frequency exam trap.

---

### Key Framework
1. **Trading account**: Net sales minus Cost of goods sold (Opening stock + Purchases + Direct expenses minus Closing stock) = Gross profit.
2. **P&L account**: Gross profit plus other incomes minus indirect expenses (office, selling, financial) = Net profit.
3. **Adjustments**: closing stock (credit trading, asset side); outstanding expenses (add to expense, liability side); prepaid (minus expense, asset side); depreciation (add to expense, minus from asset).
4. **Balance sheet**: assets (fixed, current, fictitious) versus liabilities (capital minus drawings plus profit, long-term, current).

---

### Exam Focus
**Every adjustment passes two effects**: one in the nominal account (trading/P&L) and one in the balance sheet. Forgetting the second loses marks.

![Final Accounts Diagram](financial-statements.png)`,
            formulas: [
              { id: 'formula-acc-mod5-final-accounts-adjustments-1', label: 'Gross profit', formula: 'GP = Net sales minus (Opening stock + Purchases + Direct expenses minus Closing stock)', exampleQ: 'Opening stock Rs 20k, purchases Rs 80k, direct expenses Rs 5k, closing stock Rs 15k.', exampleA: 'COGS = 90k; GP = Sales minus Rs 90k.' },
              { id: 'formula-acc-mod5-final-accounts-adjustments-2', label: 'Net profit', formula: 'NP = Gross profit plus other incomes minus indirect expenses', exampleQ: 'GP Rs 1,20,000; indirect Rs 70,000; other income Rs 10,000.', exampleA: 'NP = Rs 60,000.' },
            ],
            tricks: [
              { id: 'trick-acc-mod5-final-accounts-adjustments-1', title: 'Closing stock twice', trick: 'Credit trading account; show as current asset. Never adjust purchases directly.', whenToUse: 'Most common error trap.' },
              { id: 'trick-acc-mod5-final-accounts-adjustments-2', title: 'Outstanding vs prepaid', trick: 'Outstanding: add expense and show liability. Prepaid: minus expense and show asset.', whenToUse: 'Adjustment pair memorisation.' },
            ],
            howToSolve: [
              { id: 'solve-acc-mod5-final-accounts-adjustments-1', step: 'Step 1: prepare the Trading account with opening stock, purchases and direct...', detail: 'prepare the Trading account with opening stock, purchases and direct expenses; deduct closing stock to get gross profit.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-acc-mod5-final-accounts-adjustments-2', step: 'Step 2: prepare P&L: deduct indirect expenses, add other incomes', detail: 'prepare P&L: deduct indirect expenses, add other incomes.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-acc-mod5-final-accounts-adjustments-3', step: 'Step 3: apply each adjustment twice: once in the relevant account, once in th...', detail: 'apply each adjustment twice: once in the relevant account, once in the balance sheet.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-acc-mod5-final-accounts-adjustments-4', step: 'Step 4: draft the balance sheet: capital adjusted for drawings and net profit...', detail: 'draft the balance sheet: capital adjusted for drawings and net profit; list liabilities and assets in order of permanence.', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'mkt-mod1-marketing-concepts-4ps', subjectId: 'bba-karnataka-marketing', title: 'Marketing Concepts & 4Ps Marketing Mix', moduleNumber: 1, moduleName: 'Module 1: Marketing Foundations', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mkt-01b', 'q-mkt-01c'], subtopics: [
        'Marketing: Meaning, Nature, Scope & Importance',
        'Marketing Concepts: Production, Product, Selling, Marketing & Societal Concepts',
        'Marketing Mix: 4Ps (Product, Price, Place, Promotion)',
        'Needs, Wants & Demands; Customer Value & Satisfaction',
        'Marketing vs Selling: Key Differences'
      ], explanationMd: `# Marketing Concepts & 4Ps Marketing Mix

### Core Concept
Marketing is the activity that creates, communicates and delivers value to customers. The evolution: production concept (availability), selling concept (push), marketing concept (customer satisfaction first), societal concept (welfare too). The **marketing mix 4Ps**: Product, Price, Place, Promotion: the controllable toolkit applied to a target market reached through STP. Karnataka examples: Nandini (KMF) dairy and Mysore Sandal Soap build value with local brand trust.

---

### Key Framework
1. **Concepts**: production, product, selling, marketing, societal; marketing myopia (Levitt): focusing on product, not customer need.
2. **4Ps**: Product (features, quality, branding, packaging, life cycle), Price (skimming, penetration, discounts), Place (channels, coverage, logistics), Promotion (advertising, personal selling, sales promotion, PR).
3. **STP link**: Segmentation (bases: geographic, demographic, psychographic, behavioural), Targeting, Positioning.
4. **Customer value**: value = benefits minus cost; satisfaction = expectation versus perception.

---

### Exam Focus
**Selling vs marketing concept**: selling starts with the factory and pushes what is made; marketing starts with the market and makes what is wanted.

![Marketing Mix 4Ps Diagram](marketing-mix-4ps.png)`,
            formulas: [
              { id: 'formula-mkt-mod1-marketing-concepts-4ps-1', label: 'Marketing mix', formula: 'Marketing programme = Product + Price + Place + Promotion aligned to target market', exampleQ: 'Launch of a new health drink for students.', exampleA: 'Product: small pack; Price: penetration; Place: campus retail; Promotion: social media.' },
              { id: 'formula-mkt-mod1-marketing-concepts-4ps-2', label: 'Customer value', formula: 'Perceived value = Total benefits minus Total cost (monetary plus time plus effort)', exampleQ: 'Benefits Rs 500, cost Rs 400.', exampleA: 'Value = Rs 100; positive value drives repeat purchase.' },
            ],
            tricks: [
              { id: 'trick-mkt-mod1-marketing-concepts-4ps-1', title: '4Ps recall', trick: 'Product, Price, Place, Promotion: any marketing case maps to these four levers.', whenToUse: 'Essay structuring.' },
              { id: 'trick-mkt-mod1-marketing-concepts-4ps-2', title: 'Myopia trap', trick: 'Railways defined themselves as railroads, not transport: the classic marketing myopia example.', whenToUse: 'Case-study opener.' },
            ],
            howToSolve: [
              { id: 'solve-mkt-mod1-marketing-concepts-4ps-1', step: 'Step 1: identify the marketing concept at play in the case (selling vs market...', detail: 'identify the marketing concept at play in the case (selling vs marketing vs societal).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mkt-mod1-marketing-concepts-4ps-2', step: 'Step 2: segment the market and name the target segment', detail: 'segment the market and name the target segment.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mkt-mod1-marketing-concepts-4ps-3', step: 'Step 3: design the 4Ps for that segment: product features, pricing method, di...', detail: 'design the 4Ps for that segment: product features, pricing method, distribution intensity, promotion blend.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mkt-mod1-marketing-concepts-4ps-4', step: 'Step 4: close with customer value and satisfaction measurement (feedback, rep...', detail: 'close with customer value and satisfaction measurement (feedback, repeat purchase).', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'mkt-mod4-distribution-channels-retailing', subjectId: 'bba-karnataka-marketing', title: 'Distribution Channels & Retailing', moduleNumber: 4, moduleName: 'Module 4: Distribution & Retailing', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mkt-04', 'q-mkt-04b'], subtopics: [
        'Distribution Channels: Meaning, Types & Functions',
        'Zero, One, Two, Three-Level Channels',
        'Channel Selection Factors',
        'Retailing: Meaning, Types, Functions',
        'Organized vs Unorganized Retailing in India'
      ], explanationMd: `# Distribution Channels & Retailing

### Core Concept
**Place** decisions select channels that move goods from producer to consumer. Channel levels: zero (direct), one (retailer), two (wholesaler plus retailer), three (agent plus wholesaler plus retailer). Intermediaries add value: sorting, bulk-breaking, financing, risk-bearing, information. Retailing covers store types (departmental, supermarket, specialty, convenience) and non-store (e-tail, direct selling). Karnataka example: Nandini outlets and FMCG distributors run multi-level chains.

---

### Key Framework
1. **Channel levels**: direct sales, one-level, two-level, three-level; intensive vs selective vs exclusive distribution.
2. **Intermediary functions**: transactional (buying/selling), logistical (transport, storage), facilitating (finance, grading, information).
3. **Retail types**: departmental store (wide assortment), supermarket (self-service food), specialty store (narrow deep line), convenience store (near, limited), discount store, e-commerce.
4. **Channel management**: conflict (vertical/horizontal), cooperation, power sources; franchising as a modern hybrid.

---

### Exam Focus
**Intensive vs exclusive distribution**: intensive: every outlet (FMCG); exclusive: single outlet per area (luxury/specialty).

![Distribution Channels Diagram](distribution-channels.png)`,
            formulas: [
              { id: 'formula-mkt-mod4-distribution-channels-retailing-1', label: 'Channel margin', formula: 'Margin percent = (Selling price minus Cost price) / Selling price x 100', exampleQ: 'Retailer buys at Rs 80, sells at Rs 100.', exampleA: 'Margin = 20%.' },
              { id: 'formula-mkt-mod4-distribution-channels-retailing-2', label: 'Channel levels', formula: 'Count the intermediaries between producer and consumer: 0 to 3 levels', exampleQ: 'Manufacturer to wholesaler to retailer to consumer.', exampleA: 'Two-level channel (two intermediaries).' },
            ],
            tricks: [
              { id: 'trick-mkt-mod4-distribution-channels-retailing-1', title: 'Power map', trick: 'Channel power sits with whoever controls scarce assets: brand, shelf space, or customer data.', whenToUse: 'Conflict case questions.' },
              { id: 'trick-mkt-mod4-distribution-channels-retailing-2', title: 'Bulk breaking', trick: 'Wholesalers buy bulk and break into retailer-sized lots: one of their core utilities.', whenToUse: 'Function-matching MCQs.' },
            ],
            howToSolve: [
              { id: 'solve-mkt-mod4-distribution-channels-retailing-1', step: 'Step 1: identify the product type and the distribution intensity required (in...', detail: 'identify the product type and the distribution intensity required (intensive/selective/exclusive).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mkt-mod4-distribution-channels-retailing-2', step: 'Step 2: draw the channel chain and count levels; justify each intermediary fu...', detail: 'draw the channel chain and count levels; justify each intermediary function.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mkt-mod4-distribution-channels-retailing-3', step: 'Step 3: choose retail formats for the target customers', detail: 'choose retail formats for the target customers.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mkt-mod4-distribution-channels-retailing-4', step: 'Step 4: address channel management: margins, conflict and control in the reco...', detail: 'address channel management: margins, conflict and control in the recommendation.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'mkt-mod5-promotion-mix-advertising', subjectId: 'bba-karnataka-marketing', title: 'Promotion Mix & Advertising', moduleNumber: 5, moduleName: 'Module 5: Promotion & Advertising', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mkt-05', 'q-mkt-05b'], subtopics: [
        'Promotion Mix: Advertising, Personal Selling, Sales Promotion, Public Relations',
        'Advertising: Meaning, Objectives, Types, Media',
        'Sales Promotion: Tools, Techniques, Consumer vs Trade'
      ], explanationMd: `# Promotion Mix & Advertising

### Core Concept
**Promotion** communicates value: the blend of advertising (paid, mass, impersonal), personal selling (face-to-face, relationship), sales promotion (short-term incentives), public relations (credibility) and direct marketing (targeted). The AIDA model (Attention, Interest, Desire, Action) frames message design. Push strategy (trade channel focus) versus pull strategy (consumer advertising) decides where the rupee goes.

---

### Key Framework
1. **Promotion mix elements**: advertising, personal selling, sales promotion, publicity/PR, direct/digital marketing.
2. **AIDA**: Attention, Interest, Desire, Action: stages a buyer passes through.
3. **Advertising decisions**: objectives (inform, persuade, remind), media choice (TV, print, digital, outdoor), message strategy, budget methods (percentage of sales, competitive parity, objective-task).
4. **Push vs pull**: push pushes stock through channel incentives; pull creates consumer demand that drags product through.

---

### Exam Focus
**Advertising vs personal selling**: advertising is mass, one-way, low cost per contact; personal selling is individual, two-way, high cost but closes sales.

![Promotion Mix Diagram](promotion-mix.png)`,
            formulas: [
              { id: 'formula-mkt-mod5-promotion-mix-advertising-1', label: 'Promotion budget', formula: 'Objective-task budget = Sum of costs of all activities needed to meet the objective', exampleQ: 'Campaign needs Rs 5 lakh media plus Rs 3 lakh events.', exampleA: 'Budget = Rs 8 lakh.' },
              { id: 'formula-mkt-mod5-promotion-mix-advertising-2', label: 'Cost per contact', formula: 'Cost per contact = Total media cost / Number of contacts reached', exampleQ: 'TV Rs 20 lakh reaching 40 lakh viewers.', exampleA: 'Cost per contact = Rs 0.50.' },
            ],
            tricks: [
              { id: 'trick-mkt-mod5-promotion-mix-advertising-1', title: 'AIDA ladder', trick: 'Move the buyer: Attention, Interest, Desire, Action: tag each ad element to a stage.', whenToUse: 'Message-design questions.' },
              { id: 'trick-mkt-mod5-promotion-mix-advertising-2', title: 'Push-pull pick', trick: 'Push for industrial/low-awareness goods via channel; pull for branded consumer goods.', whenToUse: 'Strategy selection one-liners.' },
            ],
            howToSolve: [
              { id: 'solve-mkt-mod5-promotion-mix-advertising-1', step: 'Step 1: set the promotion objective (inform/persuade/remind)', detail: 'set the promotion objective (inform/persuade/remind).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mkt-mod5-promotion-mix-advertising-2', step: 'Step 2: choose the mix: mass advertising for awareness, personal selling for...', detail: 'choose the mix: mass advertising for awareness, personal selling for industrial sales, sales promotion for short bursts, PR for credibility.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mkt-mod5-promotion-mix-advertising-3', step: 'Step 3: design the message using AIDA and pick media with cost-per-contact logic', detail: 'design the message using AIDA and pick media with cost-per-contact logic.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mkt-mod5-promotion-mix-advertising-4', step: 'Step 4: decide push versus pull and justify with the budget method used', detail: 'decide push versus pull and justify with the budget method used.', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'ob-mod1-individual-behaviour-personality', subjectId: 'bba-karnataka-ob', title: 'Individual Behaviour & Personality: Big Five & Perception', moduleNumber: 1, moduleName: 'Module 1: Individual Behaviour & Personality', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ob-01b', 'q-ob-02'], subtopics: [
        'Meaning, Nature & Determinants of Individual Behaviour',
        'Big Five Personality Traits (OCEAN Model)',
        'Perception: Process, Factors & Perceptual Errors',
        'Attitudes: Components, Formation & Job Satisfaction',
        'Values, Emotions & Emotional Intelligence at Work'
      ], explanationMd: `# Individual Behaviour & Personality: Big Five & Perception

### Core Concept
Organisational behaviour studies how people act in organisations. Individual behaviour is driven by **perception, personality, learning, attitudes and values**. The Big Five (OCEAN): Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism: the accepted personality taxonomy. Personality is relatively stable; situations still moderate behaviour (interactionist view). Karnataka corporate example: team fit at product companies like Freshworks depends on conscientiousness and agreeableness.

---

### Key Framework
1. **Determinants of behaviour**: personal (biography, personality), environmental (organisation, culture), interaction of both.
2. **Big Five**: Openness (creative), Conscientiousness (disciplined), Extraversion (sociable), Agreeableness (cooperative), Neuroticism (emotional instability).
3. **Personality determinants**: heredity, environment, situation; self-concept and locus of control (internal vs external).
4. **Myers-Briggs**: introvert/extrovert, sensing/intuition, thinking/feeling, judging/perceiving (a popular alternative).

---

### Exam Focus
**Personality vs perception**: personality is the enduring disposition; perception is the process of interpreting stimuli (detailed in Module 2).

![Big Five Personality Diagram](big-five-personality.png)`,
            formulas: [
              { id: 'formula-ob-mod1-individual-behaviour-personality-1', label: 'Big Five recall', formula: 'OCEAN: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism', exampleQ: 'Which trait predicts job performance best?', exampleA: 'Conscientiousness is the strongest predictor.' },
              { id: 'formula-ob-mod1-individual-behaviour-personality-2', label: 'Locus of control', formula: 'Internal: outcomes from own effort; External: outcomes from luck/powerful others', exampleQ: 'Employee blames market for missed targets.', exampleA: 'External locus of control.' },
            ],
            tricks: [
              { id: 'trick-ob-mod1-individual-behaviour-personality-1', title: 'OCEAN mnemonic', trick: 'O-C-E-A-N spells the five traits in order.', whenToUse: 'MCQ speed-up.' },
              { id: 'trick-ob-mod1-individual-behaviour-personality-2', title: 'Interactionist view', trick: 'Behaviour = f(Personality, Situation): neither alone explains it.', whenToUse: 'Balanced essay answers.' },
            ],
            howToSolve: [
              { id: 'solve-ob-mod1-individual-behaviour-personality-1', step: 'Step 1: identify the level of analysis (individual, group, organisation)', detail: 'identify the level of analysis (individual, group, organisation).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ob-mod1-individual-behaviour-personality-2', step: 'Step 2: name the individual determinants involved (personality, perception, l...', detail: 'name the individual determinants involved (personality, perception, learning, attitude).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ob-mod1-individual-behaviour-personality-3', step: 'Step 3: apply the Big Five to describe the person and predict work behaviour', detail: 'apply the Big Five to describe the person and predict work behaviour.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ob-mod1-individual-behaviour-personality-4', step: 'Step 4: conclude with the interactionist caveat: the situation moderates pers...', detail: 'conclude with the interactionist caveat: the situation moderates personality effects.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'ob-mod2-perception-learning-attitudes', subjectId: 'bba-karnataka-ob', title: 'Perception, Learning Theories & Attitude Formation', moduleNumber: 2, moduleName: 'Module 2: Perception & Learning', order: 2, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ob-03', 'q-ob-03b'], subtopics: [
        'Perception: Process & Factors',
        'Classical & Operant Conditioning',
        'Cognitive & Social Learning',
        'Attitudes: Components & Formation',
        'Job Satisfaction & Organizational Commitment'
      ], explanationMd: `# Perception, Learning Theories & Attitude Formation

### Core Concept
**Perception** is the process by which people select, organise and interpret stimuli. It distorts reality via selective perception, stereotyping, halo and horn effects. **Learning** changes behaviour through experience: classical conditioning (Pavlov), operant conditioning (Skinner reinforcement), social learning (Bandura modelling). **Attitude** has three components: affect (feeling), cognition (belief), behaviour (action); cognitive dissonance (Festinger) drives attitude change.

---

### Key Framework
1. **Perceptual process**: environment, stimuli, selection, organisation, interpretation, perception, behaviour.
2. **Distortions**: stereotyping, halo effect (one trait colours all), projection, contrast, self-fulfilling prophecy (Pygmalion).
3. **Learning theories**: classical (stimulus pairing), operant (consequence reinforcement: positive/negative, punishment/extinction), social (observation and imitation).
4. **Attitudes**: ABC components; job satisfaction, organisational commitment; cognitive dissonance reduction.

---

### Exam Focus
**Halo vs horn**: halo: one good trait inflates the whole rating; horn: one bad trait deflates everything.

![Perception Learning Diagram](perception-learning.png)`,
            formulas: [
              { id: 'formula-ob-mod2-perception-learning-attitudes-1', label: 'Dissonance ratio', formula: 'Dissonance rises with (importance x number of conflicting cognitions) / (adjustable cognitions)', exampleQ: 'Important decision with few alternatives.', exampleA: 'High dissonance: person changes attitude to match behaviour.' },
              { id: 'formula-ob-mod2-perception-learning-attitudes-2', label: 'Reinforcement map', formula: 'Positive adds a reward; negative removes discomfort; punishment suppresses; extinction withdraws reinforcement.', exampleQ: 'Employee praised for punctuality.', exampleA: 'Positive reinforcement increases punctuality.' },
            ],
            tricks: [
              { id: 'trick-ob-mod2-perception-learning-attitudes-1', title: 'Perception shortcuts', trick: 'Stereotype, halo, horn, projection, contrast: one-line definitions each.', whenToUse: 'Definitions earn easy marks.' },
              { id: 'trick-ob-mod2-perception-learning-attitudes-2', title: 'Social learning', trick: 'Modelling plus vicarious reinforcement: people copy observed rewarded behaviour.', whenToUse: 'Training design relevance.' },
            ],
            howToSolve: [
              { id: 'solve-ob-mod2-perception-learning-attitudes-1', step: 'Step 1: trace the perceptual process for the scenario and identify the distor...', detail: 'trace the perceptual process for the scenario and identify the distortion (stereotype/halo/horn).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ob-mod2-perception-learning-attitudes-2', step: 'Step 2: name the learning mechanism: classical pairing, operant consequence o...', detail: 'name the learning mechanism: classical pairing, operant consequence or social model.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ob-mod2-perception-learning-attitudes-3', step: 'Step 3: analyse the attitude using the ABC components', detail: 'analyse the attitude using the ABC components.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ob-mod2-perception-learning-attitudes-4', step: 'Step 4: if behaviour and attitude clash, explain cognitive dissonance and the...', detail: 'if behaviour and attitude clash, explain cognitive dissonance and the likely adjustment.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'ob-mod4-groups-teams-conflict', subjectId: 'bba-karnataka-ob', title: 'Groups, Teams & Conflict Management', moduleNumber: 4, moduleName: 'Module 4: Groups & Conflict', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ob-04', 'q-ob-05'], subtopics: [
        'Groups: Types, Stages, Group Decision Making',
        'Teams: Types, Characteristics, Effective Teams',
        'Conflict: Types, Sources, Levels',
        'Conflict Resolution: Styles & Strategies',
        'Tuckman\'s Stages of Group Development'
      ], explanationMd: `# Groups, Teams & Conflict Management

### Core Concept
A **group** shares goals and interaction; a **team** adds collective accountability and complementary skills. Tuckman stages: Forming, Storming, Norming, Performing, Adjourning. Group dynamics: roles, norms, cohesiveness, social loafing. **Conflict** is natural: task, relationship or process conflict; resolution styles range from avoiding to collaborating (Thomas-Kilmann grid). Indian family businesses and IT delivery teams show both cohesion and role conflict.

---

### Key Framework
1. **Group formation**: forming, storming, norming, performing, adjourning; formal vs informal groups.
2. **Group dynamics**: role perception, norms, cohesiveness (high cohesion boosts satisfaction; effect on performance depends on norms), groupthink.
3. **Teams**: problem-solving, self-managed, cross-functional, virtual; team effectiveness: clear goals, right skills, trust, accountability.
4. **Conflict**: causes (scarce resources, goal divergence, ambiguity); styles: avoiding, competing, compromising, accommodating, collaborating.

---

### Exam Focus
**Group vs team**: a group shares information; a team shares collective performance goals and mutual accountability.

![Teams Conflict Diagram](teams-conflict.png)`,
            formulas: [
              { id: 'formula-ob-mod4-groups-teams-conflict-1', label: 'Team balance', formula: 'Team performance = f(Ability x Motivation x Opportunity)', exampleQ: 'Skilled team, low morale, poor tools.', exampleA: 'Fix motivation and tools first: they are the constraints.' },
              { id: 'formula-ob-mod4-groups-teams-conflict-2', label: 'Conflict cost', formula: 'Conflict cost = Lost output + Delay cost + Relationship damage', exampleQ: 'Deadlock loses 3 days at Rs 20k per day.', exampleA: 'Cost = Rs 60k plus morale damage.' },
            ],
            tricks: [
              { id: 'trick-ob-mod4-groups-teams-conflict-1', title: 'Cohesion trade-off', trick: 'High cohesion with pro-performance norms raises output; with anti-performance norms it lowers it.', whenToUse: 'Case analysis shortcut.' },
              { id: 'trick-ob-mod4-groups-teams-conflict-2', title: 'Tuckman order', trick: 'Forming, Storming, Norming, Performing, Adjourning: the 5-stage lifecycle.', whenToUse: 'Sequence questions.' },
              { id: 'trick-ob-mod4-groups-teams-conflict-3', title: 'Collaborate conditions', trick: 'Collaborating works when both concerns matter and time permits; compromising splits the difference.', whenToUse: 'Style-selection logic.' },
            ],
            howToSolve: [
              { id: 'solve-ob-mod4-groups-teams-conflict-1', step: 'Step 1: classify the group: formal/informal and the Tuckman stage it sits in', detail: 'classify the group: formal/informal and the Tuckman stage it sits in.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ob-mod4-groups-teams-conflict-2', step: 'Step 2: diagnose group dynamics (norms, cohesion, role conflict, social loafing)', detail: 'diagnose group dynamics (norms, cohesion, role conflict, social loafing).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ob-mod4-groups-teams-conflict-3', step: 'Step 3: identify the conflict type (task/relationship/process) and its cause', detail: 'identify the conflict type (task/relationship/process) and its cause.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ob-mod4-groups-teams-conflict-4', step: 'Step 4: select the resolution style from the grid and justify; outline team-b...', detail: 'select the resolution style from the grid and justify; outline team-building steps.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'ob-mod5-organisational-culture-change', subjectId: 'bba-karnataka-ob', title: 'Organisational Culture, Climate & Change Management', moduleNumber: 5, moduleName: 'Module 5: Culture & Change', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ob-05b', 'q-ob-05c'], subtopics: [
        'Organisational Culture: Levels, Characteristics',
        'Organisational Climate: Factors & Dimensions',
        'Change Management: Models & Process',
        'Lewin\'s & Kotter\'s Change Models',
        'Resistance to Change: Causes & Overcoming'
      ], explanationMd: `# Organisational Culture, Climate & Change Management

### Core Concept
**Culture** is the shared assumptions, values and artefacts that shape behaviour (Schein: three layers). Types (Competing Values): clan, adhocracy, market, hierarchy. **Climate** is the perceived atmosphere (openness, trust). **Change management**: Lewin (unfreeze-change-refreeze), force field analysis (driving vs restraining forces), resistance sources and overcoming tactics; OD interventions: process consultation, team building, survey feedback.

---

### Key Framework
1. **Culture layers**: artefacts (visible symbols), espoused values (stated beliefs), basic assumptions (deep, unconscious).
2. **Culture types**: clan (collaborate), adhocracy (create), market (compete), hierarchy (control).
3. **Lewin**: Unfreeze (create readiness), Change (move), Refreeze (stabilise); force field analysis maps drivers and resistors.
4. **Resistance**: individual (fear, habit, security), organisational (structure, culture); overcome: communication, participation, facilitation, negotiation, coercion (last resort).

---

### Exam Focus
**Culture vs climate**: culture is deep and enduring; climate is the surface perception that can change quickly.

![Culture Change Diagram](culture-change.png)`,
            formulas: [
              { id: 'formula-ob-mod5-organisational-culture-change-1', label: 'Force field', formula: 'Net change readiness = Sum of driving forces minus Sum of restraining forces', exampleQ: 'Drives total 8, restraints 5.', exampleA: 'Net = 3: change feasible; weaken restraints to raise it.' },
              { id: 'formula-ob-mod5-organisational-culture-change-2', label: 'Cost of resistance', formula: 'Lost productivity = Resistance hours x Output value per hour', exampleQ: '200 lost hours at Rs 500 per hour.', exampleA: 'Cost = Rs 1,00,000.' },
            ],
            tricks: [
              { id: 'trick-ob-mod5-organisational-culture-change-1', title: 'Lewin order', trick: 'Unfreeze, Change, Refreeze: skipping refreeze causes relapse.', whenToUse: 'Change programme sequence.' },
              { id: 'trick-ob-mod5-organisational-culture-change-2', title: 'Schein layers', trick: 'Artefacts, values, assumptions: dig deepest for the real culture.', whenToUse: 'Culture audit questions.' },
              { id: 'trick-ob-mod5-organisational-culture-change-3', title: 'Resistance first', trick: 'Participation and communication beat coercion; coercion only in crisis.', whenToUse: 'Managerial judgement answers.' },
            ],
            howToSolve: [
              { id: 'solve-ob-mod5-organisational-culture-change-1', step: 'Step 1: describe the culture using Schein layers and the Competing Values type', detail: 'describe the culture using Schein layers and the Competing Values type.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ob-mod5-organisational-culture-change-2', step: 'Step 2: diagnose the climate (trust, openness)', detail: 'diagnose the climate (trust, openness).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ob-mod5-organisational-culture-change-3', step: 'Step 3: apply force field analysis: list drivers and restraints for the propo...', detail: 'apply force field analysis: list drivers and restraints for the proposed change.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ob-mod5-organisational-culture-change-4', step: 'Step 4: run Lewin: unfreeze with communication/participation, implement chang...', detail: 'run Lewin: unfreeze with communication/participation, implement change, refreeze via policy and reinforcement.', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'math-mod2-commercial-arithmetic', subjectId: 'bba-karnataka-math', title: 'Commercial Arithmetic: Profit, Loss, Discount & Partnership', moduleNumber: 2, moduleName: 'Module 2: Commercial Arithmetic', order: 2, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-math-01b', 'q-math-02b'], subtopics: [
        'Profit & Loss: Concepts, Formulas & Computation',
        'Discount: Trade & Cash Discount',
        'Partnership: Profit Sharing Ratio',
        'Ratio & Proportion',
        'Percentage & Its Applications'
      ], explanationMd: `# Commercial Arithmetic: Profit, Loss, Discount & Partnership

### Core Concept
Commercial arithmetic computes **profit and loss percentages, successive discounts and partnership profit shares**. Base relations: Profit = SP minus CP; Loss = CP minus SP; percentages are computed on cost unless stated otherwise. Partnership shares profit in the ratio of capital multiplied by time when capitals are invested for different periods. These are the highest-scoring, formula-direct questions in the paper.

---

### Key Framework
1. **Profit/loss**: Profit percent = Profit / CP x 100; Loss percent = Loss / CP x 100.
2. **Discount**: Net price after discount = MP x (1 minus d/100); two successive discounts d1 and d2: single equivalent = d1 + d2 minus (d1 x d2 / 100).
3. **Partnership**: profit-sharing ratio = (Capital x Time) for each partner; guarantee clauses adjust shortfalls first.
4. **Cost-price forms**: SP = CP x (1 + profit/100); CP = SP x 100 / (100 + profit).

---

### Exam Focus
**Profit percent is on cost price; discount percent is on marked price.** Mixing the bases is the classic error.

![Profit Loss Partnership Diagram](profit-loss-partnership.png)`,
            formulas: [
              { id: 'formula-math-mod2-commercial-arithmetic-1', label: 'Profit percent', formula: 'Profit % = (SP minus CP) / CP x 100', exampleQ: 'CP Rs 250, SP Rs 300.', exampleA: 'Profit % = 50/250 x 100 = 20%.' },
              { id: 'formula-math-mod2-commercial-arithmetic-2', label: 'Successive discount', formula: 'Equivalent single discount = d1 + d2 minus (d1 x d2 / 100)', exampleQ: 'Discounts 20% and 10%.', exampleA: 'Equivalent = 20 + 10 minus 2 = 28%.' },
              { id: 'formula-math-mod2-commercial-arithmetic-3', label: 'CP from SP', formula: 'CP = SP x 100 / (100 + profit%)', exampleQ: 'SP Rs 330 at 10% profit.', exampleA: 'CP = 330 x 100 / 110 = Rs 300.' },
              { id: 'formula-math-mod2-commercial-arithmetic-4', label: 'Partnership ratio', formula: 'Share ratio = (Capital x Time) for each partner', exampleQ: 'A Rs 60k x 12 months vs B Rs 40k x 6 months.', exampleA: 'Ratio = 720 : 240 = 3 : 1.' },
            ],
            tricks: [
              { id: 'trick-math-mod2-commercial-arithmetic-1', title: 'Base trap', trick: 'Discount percent is on marked price; profit percent is on cost price.', whenToUse: 'Classic error trap.' },
              { id: 'trick-math-mod2-commercial-arithmetic-2', title: 'Guarantee first', trick: 'Adjust profit guarantees before applying the final ratio.', whenToUse: 'Partnership guarantee problems.' },
            ],
            howToSolve: [
              { id: 'solve-math-mod2-commercial-arithmetic-1', step: 'Step 1: fix the base (CP for profit/loss; MP for discount) and convert everyt...', detail: 'fix the base (CP for profit/loss; MP for discount) and convert everything to one currency level.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-math-mod2-commercial-arithmetic-2', step: 'Step 2: apply the percentage formulas step by step; for successive discounts...', detail: 'apply the percentage formulas step by step; for successive discounts collapse to one equivalent discount.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-math-mod2-commercial-arithmetic-3', step: 'Step 3: for partnership, compute capital x time for each partner and simplify...', detail: 'for partnership, compute capital x time for each partner and simplify the ratio.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-math-mod2-commercial-arithmetic-4', step: 'Step 4: distribute the profit, adjusting guarantees first, and verify the sha...', detail: 'distribute the profit, adjusting guarantees first, and verify the shares sum to total profit.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'math-mod3-interest-annuities', subjectId: 'bba-karnataka-math', title: 'Simple & Compound Interest, Annuities', moduleNumber: 3, moduleName: 'Module 3: Interest & Annuities', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-math-03', 'q-math-04'], subtopics: [
        'Simple Interest: Formula & Computation',
        'Compound Interest: Formula & Computation',
        'Difference between SI & CI',
        'Annuities: Types & Computation',
        'Present Value & Future Value'
      ], explanationMd: `# Simple & Compound Interest, Annuities

### Core Concept
**Simple interest** grows linearly: interest on the original principal only. **Compound interest** grows exponentially: interest earns interest each period. **Annuities** are equal cash flows at fixed intervals: future value (accumulation) and present value (discounting). Applications: loans, sinking funds, insurance premia. KSHEC questions combine formulas with log/table values.

---

### Key Framework
1. **Simple interest**: SI = P x n x r / 100; Amount = P + SI.
2. **Compound interest**: Amount = P x (1 + r/100)^n; CI = Amount minus P; for half-yearly compounding use r/2 and 2n periods.
3. **Annuity FV**: FV = A x ((1 + r)^n minus 1) / r (payments at period end); annuity due multiplies by (1 + r).
4. **Annuity PV**: PV = A x (1 minus (1 + r)^(-n)) / r. Perpetuity PV = A / r.

---

### Exam Focus
**SI vs CI difference for 2 years**: Difference = P x (r/100)^2; for 3 years: P x (r/100)^2 x (3 + r/100).

![Interest Annuities Diagram](interest-annuities.png)`,
            formulas: [
              { id: 'formula-math-mod3-interest-annuities-1', label: 'Compound amount', formula: 'Amount = P x (1 + r/100)^n', exampleQ: 'Rs 20,000 at 10% for 3 years.', exampleA: 'Amount = 20000 x 1.331 = Rs 26,620; CI = Rs 6,620.' },
              { id: 'formula-math-mod3-interest-annuities-2', label: 'Annuity FV', formula: 'FV = A x ((1 + r)^n minus 1) / r', exampleQ: 'Rs 10,000 yearly for 4 years at 8%.', exampleA: 'FV = 10000 x 4.5061 = Rs 45,061.' },
            ],
            tricks: [
              { id: 'trick-math-mod3-interest-annuities-1', title: 'Two-year trick', trick: 'CI minus SI for 2 years = P(r/100)^2: instant answer.', whenToUse: 'Difference questions.' },
              { id: 'trick-math-mod3-interest-annuities-2', title: 'Half-yearly flip', trick: 'Halve the rate and double the periods: r/2 and 2n.', whenToUse: 'Compounding-frequency traps.' },
            ],
            howToSolve: [
              { id: 'solve-math-mod3-interest-annuities-1', step: 'Step 1: write P, r, n with the compounding period consistent (yearly/half-yea...', detail: 'write P, r, n with the compounding period consistent (yearly/half-yearly).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-math-mod3-interest-annuities-2', step: 'Step 2: simple interest: direct formula; compound interest: amount formula mi...', detail: 'simple interest: direct formula; compound interest: amount formula minus principal.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-math-mod3-interest-annuities-3', step: 'Step 3: annuities: identify ordinary or due, then apply FV or PV formula', detail: 'annuities: identify ordinary or due, then apply FV or PV formula.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-math-mod3-interest-annuities-4', step: 'Step 4: mixed problems: compute SI/CI separately and subtract; verify with th...', detail: 'mixed problems: compute SI/CI separately and subtract; verify with the 2-year difference shortcut.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'math-mod4-calculus-optimization', subjectId: 'bba-karnataka-math', title: 'Calculus: Differentiation & Optimization', moduleNumber: 4, moduleName: 'Module 4: Calculus & Optimization', order: 4, difficulty: 'advanced', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-math-05', 'q-math-06'], subtopics: [
        'Derivatives: Rules & Applications',
        'Maxima & Minima: Second Order Condition',
        'Optimization: Profit Maximization & Cost Minimization',
        'Partial Derivatives: Basic Concepts',
        'Integration: Basic Concepts'
      ], explanationMd: `# Calculus: Differentiation & Optimization

### Core Concept
**Differentiation** measures rate of change; managers use it to optimise: marginal cost is the derivative of total cost, elasticity uses derivatives, and profit maximisation solves where the derivative of profit is zero. Core rules: power, product, quotient, chain. Optimization: find critical points (first derivative zero), classify with the second derivative (positive = minimum, negative = maximum).

---

### Key Framework
1. **Rules**: d/dx (x^n) = n x^(n-1); product rule (uv); quotient rule (u/v); chain rule for composites.
2. **Marginals**: MC = d(TC)/dQ; MR = d(TR)/dQ; profit max where MC = MR.
3. **Elasticity**: E = (dQ/dP) x (P/Q); E greater than 1 means elastic demand.
4. **Optimization steps**: form the function, differentiate, solve f'(x) = 0, test f''(x) for max/min, answer in context.

---

### Exam Focus
**First derivative zero gives the stationary point; the second derivative tells whether it is a peak or a valley.**

![Calculus Optimization Diagram](calculus-optimization.png)`,
            formulas: [
              { id: 'formula-math-mod4-calculus-optimization-1', label: 'Power rule', formula: 'd/dx (x^n) = n x^(n-1)', exampleQ: 'Differentiate y = 4x^3.', exampleA: 'dy/dx = 12x^2.' },
              { id: 'formula-math-mod4-calculus-optimization-2', label: 'Profit max', formula: 'Set MR = MC: solve d(TR)/dQ = d(TC)/dQ for Q', exampleQ: 'TR = 120Q minus 2Q^2; TC = 20Q + 100.', exampleA: 'MR = 120 minus 4Q = MC 20: Q = 25 units.' },
            ],
            tricks: [
              { id: 'trick-math-mod4-calculus-optimization-1', title: 'Second derivative', trick: 'f(x) greater than 0 = minimum; f(x) less than 0 = maximum.', whenToUse: 'Classification without graphing.' },
              { id: 'trick-math-mod4-calculus-optimization-2', title: 'Elasticity shortcut', trick: 'E = slope x (P/Q): always compute at the given price point.', whenToUse: 'Demand elasticity problems.' },
            ],
            howToSolve: [
              { id: 'solve-math-mod4-calculus-optimization-1', step: 'Step 1: write the objective function (profit, cost, revenue) in one variable', detail: 'write the objective function (profit, cost, revenue) in one variable.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-math-mod4-calculus-optimization-2', step: 'Step 2: differentiate using power/product/quotient/chain rules', detail: 'differentiate using power/product/quotient/chain rules.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-math-mod4-calculus-optimization-3', step: 'Step 3: set the first derivative to zero and solve for the critical value', detail: 'set the first derivative to zero and solve for the critical value.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-math-mod4-calculus-optimization-4', step: 'Step 4: classify with the second derivative and interpret: optimal quantity,...', detail: 'classify with the second derivative and interpret: optimal quantity, maximum profit, or minimum cost.', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'eco-mod2-production-functions', subjectId: 'bba-karnataka-economics', title: 'Production Functions & Cost Analysis', moduleNumber: 2, moduleName: 'Module 2: Production & Cost', order: 2, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-eco-01b', 'q-eco-02'], subtopics: [
        'Production Function: Meaning & Types',
        'Total, Average & Marginal Product',
        'Law of Variable Proportions',
        'Returns to Scale',
        'Cost Concepts: TC, AC, MC, AFC, AVC'
      ], explanationMd: `# Production Functions & Cost Analysis

### Core Concept
The **production function** Q = f(L, K) shows output from inputs in a given technology. Short run: law of variable proportions (TP, MP, AP); MP first rises, then falls, then turns negative. Long run: returns to scale (increasing, constant, decreasing) and isoquant-isocost analysis. Cost analysis follows: costs derive from the production function. Karnataka example: garment units near Bengaluru optimise labour shifts against machine capacity.

---

### Key Framework
1. **Law of variable proportions**: Stage I (MP rising to AP max), Stage II (MP falling but positive: rational zone), Stage III (MP negative).
2. **TP/MP/AP**: MP = change in TP / change in input; AP = TP / input.
3. **Returns to scale**: increasing (output grows faster), constant (proportional), decreasing (slower); isoquants slope = MRTS.
4. **Economies of scale**: internal (technical, managerial, purchasing) and external (industry growth); diseconomies beyond optimum size.

---

### Exam Focus
**MP vs AP**: when MP is above AP, AP rises; when MP falls below AP, AP falls; MP cuts AP at its maximum.

![Production Functions Diagram](supply-demand-curve.png)`,
            formulas: [
              { id: 'formula-eco-mod2-production-functions-1', label: 'MP and AP', formula: 'MP = Change in TP / Change in input; AP = TP / Total input', exampleQ: 'TP rises from 80 to 110 as labour goes 4 to 5.', exampleA: 'MP = 30; AP at 5 units = 22.' },
              { id: 'formula-eco-mod2-production-functions-2', label: 'Stage detection', formula: 'Stage II runs from AP maximum (MP = AP) to MP = 0', exampleQ: 'MP = AP at 5 units, MP = 0 at 9 units.', exampleA: 'Rational production zone: 5 to 9 units.' },
            ],
            tricks: [
              { id: 'trick-eco-mod2-production-functions-1', title: 'Returns to scale', trick: 'Doubling inputs: output more than doubles (IRS), doubles (CRS), less (DRS).', whenToUse: 'Quick classification.' },
              { id: 'trick-eco-mod2-production-functions-2', title: 'MRTS', trick: 'MRTS = MP(L) / MP(K): the slope of the isoquant at a point.', whenToUse: 'Isoquant tangency questions.' },
            ],
            howToSolve: [
              { id: 'solve-eco-mod2-production-functions-1', step: 'Step 1: compute TP/MP/AP schedules from the given data', detail: 'compute TP/MP/AP schedules from the given data.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-eco-mod2-production-functions-2', step: 'Step 2: identify the production stage and the zone of rational operation', detail: 'identify the production stage and the zone of rational operation.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-eco-mod2-production-functions-3', step: 'Step 3: classify returns to scale from an input-output doubling test', detail: 'classify returns to scale from an input-output doubling test.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-eco-mod2-production-functions-4', step: 'Step 4: link to costs: derive cost behaviour and locate economies/diseconomie...', detail: 'link to costs: derive cost behaviour and locate economies/diseconomies of scale.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'eco-mod3-cost-curves', subjectId: 'bba-karnataka-economics', title: 'Cost Curves & Revenue Concepts', moduleNumber: 3, moduleName: 'Module 3: Cost Curves', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-eco-03', 'q-eco-04'], subtopics: [
        'Short Run & Long Run Cost Curves',
        'AC, MC Relationship',
        'Revenue: TR, AR, MR',
        'Break-Even Analysis',
        'Equilibrium of Firm'
      ], explanationMd: `# Cost Curves & Revenue Concepts

### Core Concept
Costs split **fixed (TFC, constant) and variable (TVC, output-linked)**: TC = TFC + TVC. Average and marginal curves have characteristic shapes: AC and MC are U-shaped; MC cuts AC and AVC at their minimum points. Revenue: TR = P x Q; AR = TR/Q equals price; MR is the change in TR. Profit maximisation: MR = MC (with MC rising). The diagram of interlocking cost curves is a standard exam figure.

---

### Key Framework
1. **Cost curves**: TFC horizontal; TVC rises with output; TC = TFC + TVC (parallel to TVC).
2. **Averages**: AC = TC/Q; AVC = TVC/Q; AFC = TFC/Q (falls continuously); MC = change in TC / change in Q.
3. **Revenue**: TR = P x Q; AR = P; MR = change in TR / change in Q. Under perfect competition AR = MR = P; under monopoly MR lies below AR.
4. **Profit max**: MR = MC and MC rising; shut-down point: P below minimum AVC.

---

### Exam Focus
**MC cuts AC at the minimum of AC**: to the left AC falls, to the right AC rises. This intersection is the most-tested diagram point.

![Cost Curves Diagram](cost-curves.png)`,
            formulas: [
              { id: 'formula-eco-mod3-cost-curves-1', label: 'Cost identity', formula: 'TC = TFC + TVC; AC = AFC + AVC', exampleQ: 'TFC Rs 500, TVC Rs 1,200 at 60 units.', exampleA: 'TC = Rs 1,700; AC = Rs 28.3.' },
              { id: 'formula-eco-mod3-cost-curves-2', label: 'Profit max rule', formula: 'Set MR = MC and check MC is rising', exampleQ: 'MR = 100 minus 2Q; MC = 20.', exampleA: '100 minus 2Q = 20: Q = 40 units.' },
            ],
            tricks: [
              { id: 'trick-eco-mod3-cost-curves-1', title: 'AFC shape', trick: 'AFC falls continuously as output rises (rectangular hyperbola).', whenToUse: 'Diagram question anchor.' },
              { id: 'trick-eco-mod3-cost-curves-2', title: 'Shut-down point', trick: 'In the short run produce only if price covers AVC; below min AVC, shut down.', whenToUse: 'Decision-rule MCQs.' },
            ],
            howToSolve: [
              { id: 'solve-eco-mod3-cost-curves-1', step: 'Step 1: build the cost schedule: TFC, TVC, TC, AFC, AVC, AC, MC from the data', detail: 'build the cost schedule: TFC, TVC, TC, AFC, AVC, AC, MC from the data.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-eco-mod3-cost-curves-2', step: 'Step 2: plot the curves: TFC flat, TVC rising, TC parallel; U-shaped AC/MC', detail: 'plot the curves: TFC flat, TVC rising, TC parallel; U-shaped AC/MC.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-eco-mod3-cost-curves-3', step: 'Step 3: mark the intersections (MC through AC min and AVC min)', detail: 'mark the intersections (MC through AC min and AVC min).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-eco-mod3-cost-curves-4', step: 'Step 4: for revenue, compute TR/AR/MR and locate the MR = MC output; state th...', detail: 'for revenue, compute TR/AR/MR and locate the MR = MC output; state the shut-down condition.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'eco-mod4-market-structures', subjectId: 'bba-karnataka-economics', title: 'Market Structures: Perfect Competition & Monopoly', moduleNumber: 4, moduleName: 'Module 4: Market Structures', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-eco-05', 'q-eco-06'], subtopics: [
        'Perfect Competition: Features & Equilibrium',
        'Monopoly: Features & Price Determination',
        'Monopolistic Competition: Features',
        'Oligopoly: Features & Kinked Demand Curve',
        'Price Discrimination: Types & Conditions'
      ], explanationMd: `# Market Structures: Perfect Competition & Monopoly

### Core Concept
Market structure is set by number of firms, product differentiation, entry barriers and information. **Perfect competition**: many firms, identical products, price takers, free entry; demand perfectly elastic (AR = MR). **Monopoly**: single seller, unique product, blocked entry, price maker; demand slopes down (MR below AR). Long-run equilibrium and price discrimination extend the analysis. Indian context: agricultural mandis approximate perfect competition; railways are a natural monopoly.

---

### Key Framework
1. **Perfect competition**: firm demand is horizontal at market price; equilibrium where P = MC = minimum AC in long run; only normal profit survives.
2. **Monopoly**: equilibrate at MR = MC with price from the demand curve; profits can persist long run due to barriers.
3. **Price discrimination**: degrees (first, second, third); conditions: market power, segmentation, no resale.
4. **Comparative**: allocative efficiency (P = MC) in competition; monopoly restricts output and raises price (deadweight loss).

---

### Exam Focus
**Perfect competition vs monopoly demand**: competition: firm faces a horizontal demand curve; monopoly: downward-sloping market demand with MR below AR.

![Market Structures Diagram](market-structures.png)`,
            formulas: [
              { id: 'formula-eco-mod4-market-structures-1', label: 'Monopoly price', formula: 'Set MR = MC, then read price from the demand curve', exampleQ: 'Demand P = 200 minus 2Q; MC = 40.', exampleA: 'MR = 200 minus 4Q = 40: Q = 40; P = Rs 120.' },
              { id: 'formula-eco-mod4-market-structures-2', label: 'Lerner index', formula: 'L = (P minus MC) / P: measures monopoly power', exampleQ: 'P Rs 120, MC Rs 40.', exampleA: 'L = 80/120 = 0.67.' },
            ],
            tricks: [
              { id: 'trick-eco-mod4-market-structures-1', title: 'Long-run rule', trick: 'Perfect competition: P = min AC (normal profit only); monopoly can earn supernormal profit indefinitely.', whenToUse: 'Comparison essays.' },
              { id: 'trick-eco-mod4-market-structures-2', title: 'Deadweight loss', trick: 'Monopoly output below competitive level creates deadweight loss to society.', whenToUse: 'Welfare analysis one-liner.' },
            ],
            howToSolve: [
              { id: 'solve-eco-mod4-market-structures-1', step: 'Step 1: identify the structure from the features (number of firms, entry, pro...', detail: 'identify the structure from the features (number of firms, entry, product).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-eco-mod4-market-structures-2', step: 'Step 2: draw demand/MR/AR curves appropriate to the structure', detail: 'draw demand/MR/AR curves appropriate to the structure.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-eco-mod4-market-structures-3', step: 'Step 3: equate MR = MC for output; set price from the demand curve (perfect c...', detail: 'equate MR = MC for output; set price from the demand curve (perfect competition: price is given).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-eco-mod4-market-structures-4', step: 'Step 4: analyse profit in short and long run and comment on efficiency (P ver...', detail: 'analyse profit in short and long run and comment on efficiency (P versus MC, deadweight loss).', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'eco-mod5-managerial-pricing', subjectId: 'bba-karnataka-economics', title: 'Managerial Pricing Methods', moduleNumber: 5, moduleName: 'Module 5: Pricing Methods', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-eco-07', 'q-eco-08'], subtopics: [
        'Pricing Objectives & Factors',
        'Cost-Plus Pricing',
        'Penetration & Skimming Pricing',
        'Discount Pricing',
        'Differential Pricing'
      ], explanationMd: `# Managerial Pricing Methods

### Core Concept
Firms set prices using **cost-based, competition-based and value-based (demand-based) methods**. Cost-plus: add markup to average cost. Competition: going-rate or sealed-bid. Demand: price skimming (high then lower), penetration (low to gain share), price discrimination, psychological pricing. Pricing objectives: survival, profit max, market share, product-quality leadership. Karnataka IT services firms price per seat or outcome; FMCG uses penetration and bundle pricing.

---

### Key Framework
1. **Cost-based**: cost-plus/full-cost markup, marginal-cost pricing, target-return pricing (price = AC + target ROI x investment / output).
2. **Competition-based**: going-rate pricing, bid pricing (lowest qualified wins).
3. **Demand-based**: skimming, penetration, value pricing, psychological pricing (Rs 99), bundle pricing.
4. **Product-mix pricing**: product line, optional-product, captive, by-product, product-bundle pricing.

---

### Exam Focus
**Skimming vs penetration**: skimming starts high (recover R&D, premium segment); penetration starts low (fast share, price-sensitive market).

![Managerial Pricing Diagram](supply-demand-curve.png)`,
            formulas: [
              { id: 'formula-eco-mod5-managerial-pricing-1', label: 'Markup price', formula: 'Price = Unit cost / (1 minus desired markup on selling price)', exampleQ: 'Unit cost Rs 60, markup 25% on selling price.', exampleA: 'Price = 60 / 0.75 = Rs 80.' },
              { id: 'formula-eco-mod5-managerial-pricing-2', label: 'Target return', formula: 'Price = AC + (Target ROI x Investment) / Unit sales', exampleQ: 'AC Rs 50, investment Rs 10L, target 20%, sales 10,000 units.', exampleA: 'Price = 50 + (200000 / 10000) = Rs 70.' },
            ],
            tricks: [
              { id: 'trick-eco-mod5-managerial-pricing-1', title: 'Skim signals', trick: 'Use skimming when: innovation, prestige, capacity limits, little competition.', whenToUse: 'Method selection logic.' },
              { id: 'trick-eco-mod5-managerial-pricing-2', title: 'Penetration signals', trick: 'Use penetration when: price-sensitive mass market, economies of scale, easy entry to block.', whenToUse: 'Method selection logic.' },
            ],
            howToSolve: [
              { id: 'solve-eco-mod5-managerial-pricing-1', step: 'Step 1: identify the pricing objective (survival/profit/share/quality)', detail: 'identify the pricing objective (survival/profit/share/quality).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-eco-mod5-managerial-pricing-2', step: 'Step 2: compute cost-based price (cost-plus markup or target return)', detail: 'compute cost-based price (cost-plus markup or target return).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-eco-mod5-managerial-pricing-3', step: 'Step 3: adjust for competition and demand: skimming/penetration/psychological...', detail: 'adjust for competition and demand: skimming/penetration/psychological cues.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-eco-mod5-managerial-pricing-4', step: 'Step 4: check product-mix effects (bundles, captive items) and state the fina...', detail: 'check product-mix effects (bundles, captive items) and state the final price with justification.', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'cost-mod3-material-labour-overheads', subjectId: 'bba-karnataka-cost-accounting', title: 'Material, Labour & Overheads Costing', moduleNumber: 3, moduleName: 'Module 3: Material Labour Overheads', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-cost-01b', 'q-cost-02b'], subtopics: [
        'Material Costing: EOQ, Stock Levels',
        'Labour Costing: Time Rate, Piece Rate',
        'Overheads: Allocation, Apportionment, Absorption',
        'Idle Time & Overtime',
        'Labour Turnover'
      ], explanationMd: `# Material, Labour & Overheads Costing

### Core Concept
This module covers the three cost elements of production. **Material** (stock valuation, issue pricing), **Labour** (wage computation, incentive schemes) and **Overheads** (collection, allocation, apportionment and absorption). KSHEC expects full working of a cost sheet with all three elements; a Bengaluru manufacturing unit such as a Hosur/Bengaluru auto-component plant gives realistic numbers.

---

### Key Framework
1. **Material**: stock levels: Minimum = Re-order level minus Normal consumption during lead time; Re-order level = Minimum stock + Lead-time usage.
2. **Issue pricing**: FIFO, LIFO, Weighted Average, Simple Average.
3. **Labour**: time-rate vs piece-rate; Halsey premium = Time taken x Rate + 50% of time saved x Rate; Rowan premium = Time taken x Rate + (Time saved/Time allowed) x Time taken x Rate.
4. **Overheads**: primary distribution then secondary (repeated, continuous, trial-and-error); absorption via Machine Hour Rate or Direct Labour percentage.

---

### Exam Focus
**Halsey vs Rowan**: Rowan gives a smaller bonus when time saved is large; Halsey gives a fixed 50% share.

![Material Labour Overheads Diagram](material-labour-overheads.png)`,
            formulas: [
              { id: 'formula-cost-mod3-material-labour-overheads-1', label: 'Re-order level', formula: 'ROL = Minimum stock + (Normal usage x Lead time)', exampleQ: 'Min stock 200 units, usage 50/day, lead 6 days. Find ROL.', exampleA: 'ROL = 200 + (50 x 6) = 500 units.' },
              { id: 'formula-cost-mod3-material-labour-overheads-2', label: 'Halsey premium', formula: 'Earnings = (Time taken x Rate) + (50% x Time saved x Rate)', exampleQ: 'Job allows 10 hrs at Rs 20/hr; done in 8 hrs.', exampleA: 'Earnings = (8 x 20) + (0.5 x 2 x 20) = Rs 180.' },
            ],
            tricks: [
              { id: 'trick-cost-mod3-material-labour-overheads-1', title: 'Stock level shortcut', trick: 'Min = ROL minus lead-time usage; Max = Min + Re-order quantity.', whenToUse: 'Quick stock-level problems.' },
              { id: 'trick-cost-mod3-material-labour-overheads-2', title: 'Overhead absorption', trick: 'Machine Hour Rate = (Standing charges + Running charges) / Machine hours.', whenToUse: 'When machine-intensive departments dominate.' },
            ],
            howToSolve: [
              { id: 'solve-cost-mod3-material-labour-overheads-1', step: 'Step 1: compute material cost using the given issue-price method', detail: 'compute material cost using the given issue-price method.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-cost-mod3-material-labour-overheads-2', step: 'Step 2: compute wages (time or piece rate; add Halsey/Rowan premium if asked)', detail: 'compute wages (time or piece rate; add Halsey/Rowan premium if asked).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-cost-mod3-material-labour-overheads-3', step: 'Step 3: allocate overheads: primary to departments on fair bases (area, headc...', detail: 'allocate overheads: primary to departments on fair bases (area, headcount, machine hours), then secondary redistribution.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-cost-mod3-material-labour-overheads-4', step: 'Step 4: absorb into products via machine hour rate or labour percentage', detail: 'absorb into products via machine hour rate or labour percentage. Present a cost sheet showing prime cost, works cost, cost of production.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'cost-mod5-variance-analysis-budgetary-control', subjectId: 'bba-karnataka-cost-accounting', title: 'Variance Analysis & Budgetary Control', moduleNumber: 5, moduleName: 'Module 5: Variance Analysis & Budgetary Control', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-cost-03b', 'q-cost-04'], subtopics: [
        'Budgetary Control: Types & Process',
        'Material Variances: Price & Usage',
        'Labour Variances: Rate & Efficiency',
        'Overhead Variances',
        'Sales Variances'
      ], explanationMd: `# Variance Analysis & Budgetary Control

### Core Concept
**Variance analysis** compares standard (budgeted) cost with actual cost and explains the gap element by element. **Budgetary control** is the system of setting budgets, comparing with actuals and acting on variances. Together they are the control arm of cost accounting; every textile or steel plant in Karnataka runs monthly variance reviews.

---

### Key Framework
1. **Material variances**: Cost variance = (Std qty x Std price) minus (Actual qty x Actual price); split into Price and Usage (Mix + Yield when several materials combine).
2. **Labour variances**: Rate variance = (Std rate minus Actual rate) x Actual hours; Efficiency variance = (Std hours minus Actual hours) x Std rate.
3. **Overhead variances**: Variable expenditure/efficiency; Fixed expenditure, volume (capacity + efficiency).
4. **Budgets**: fixed vs flexible; zero-based budgeting builds from scratch each period.

---

### Exam Focus
**Favourable (F) vs Adverse (A)**: actual cost below standard is F; always state F or A with each variance.

![Variance Analysis Diagram](variance-analysis.png)`,
            formulas: [
              { id: 'formula-cost-mod5-variance-analysis-budgetary-control-1', label: 'Material cost variance', formula: 'MCV = (SQ x SP) minus (AQ x AP)', exampleQ: 'SQ 100 kg @ Rs 10; used 110 kg @ Rs 9.', exampleA: 'Std cost Rs 1,000 minus Actual Rs 990 = Rs 10 (F).' },
              { id: 'formula-cost-mod5-variance-analysis-budgetary-control-2', label: 'Labour efficiency variance', formula: 'LEV = (Standard hours minus Actual hours) x Std rate', exampleQ: 'Std 500 hrs, actual 520 hrs, rate Rs 20/hr.', exampleA: 'LEV = (500 minus 520) x 20 = Rs 400 (A).' },
            ],
            tricks: [
              { id: 'trick-cost-mod5-variance-analysis-budgetary-control-1', title: 'Sign convention', trick: 'Compute always as Standard minus Actual; positive is favourable.', whenToUse: 'Avoids sign confusion in exams.' },
              { id: 'trick-cost-mod5-variance-analysis-budgetary-control-2', title: 'Mix vs Yield', trick: 'Mix variance = total actual qty x (Revised std mix minus Actual mix) prices; Yield = (Std output minus Actual output) x Std cost/unit.', whenToUse: 'Multi-material problems.' },
            ],
            howToSolve: [
              { id: 'solve-cost-mod5-variance-analysis-budgetary-control-1', step: 'Step 1: write Std and Actual quantities and prices in two columns', detail: 'write Std and Actual quantities and prices in two columns.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-cost-mod5-variance-analysis-budgetary-control-2', step: 'Step 2: compute the total (cost/rate) variance first', detail: 'compute the total (cost/rate) variance first.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-cost-mod5-variance-analysis-budgetary-control-3', step: 'Step 3: split into price and usage/efficiency variances using the standard fo...', detail: 'split into price and usage/efficiency variances using the standard formulas.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-cost-mod5-variance-analysis-budgetary-control-4', step: 'Step 4: where materials are mixed, compute revised standard mix, then Mix and...', detail: 'where materials are mixed, compute revised standard mix, then Mix and Yield.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-cost-mod5-variance-analysis-budgetary-control-5', step: 'Step 5: check that sub-variances reconcile to the total', detail: 'check that sub-variances reconcile to the total. Label every answer F or A.', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'stats-mod1-collection-classification-presentation', subjectId: 'bba-karnataka-statistics', title: 'Collection, Classification & Presentation of Data', moduleNumber: 1, moduleName: 'Module 1: Data Collection & Presentation', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-stats-01', 'q-stats-02'], subtopics: [
        'Primary vs Secondary Data',
        'Methods of Data Collection',
        'Classification: Types & Objectives',
        'Tabulation: Parts of Table',
        'Diagrammatic & Graphic Presentation'
      ], explanationMd: `# Collection, Classification & Presentation of Data

### Core Concept
Statistics begins with **data**: primary (collected firsthand, e.g. a survey of Mysuru retailers) or secondary (Census, RBI bulletins). Classification condenses raw data into frequency distributions; presentation makes it visual: tables, histograms, ogives, pie charts. KSHEC questions mix tabulation with diagram reading.

---

### Key Framework
1. **Collection**: primary methods: questionnaire, interview, observation; secondary sources: published/unpublished.
2. **Classification**: chronological, geographical, qualitative, quantitative (exclusive/inclusive classes).
3. **Frequency density** = Frequency / Class width (use when class widths differ).
4. **Diagrams**: histogram (continuous), bar chart (discrete), ogive (cumulative, gives median), pie chart (component share, angle = share x 360 degrees).

---

### Exam Focus
**Histogram vs Bar chart**: bars touch in a histogram (continuous classes) but stand apart in a bar chart.

![Data Presentation Diagram](data-presentation.png)`,
            formulas: [
              { id: 'formula-stats-mod1-collection-classification-presentation-1', label: 'Pie chart angle', formula: 'Angle = (Component value / Total value) x 360 degrees', exampleQ: 'Component Rs 6,000 of total Rs 24,000.', exampleA: 'Angle = (6000/24000) x 360 = 90 degrees.' },
              { id: 'formula-stats-mod1-collection-classification-presentation-2', label: 'Class mid-point', formula: 'Mid-point = (Lower limit + Upper limit) / 2', exampleQ: 'Class 20-30.', exampleA: 'Mid-point = (20 + 30) / 2 = 25.' },
            ],
            tricks: [
              { id: 'trick-stats-mod1-collection-classification-presentation-1', title: 'Ogive reads median', trick: 'Median = x-value where the cumulative curve crosses N/2.', whenToUse: 'Quick median from a graph.' },
              { id: 'trick-stats-mod1-collection-classification-presentation-2', title: 'Exclusive classes', trick: '20-30, 30-40: upper limit belongs to the next class; use continuity before drawing histograms.', whenToUse: 'Converting inclusive to exclusive classes.' },
            ],
            howToSolve: [
              { id: 'solve-stats-mod1-collection-classification-presentation-1', step: 'Step 1: identify data type (primary/secondary, discrete/continuous)', detail: 'identify data type (primary/secondary, discrete/continuous).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-stats-mod1-collection-classification-presentation-2', step: 'Step 2: decide class width and form a frequency distribution (exclusive classes)', detail: 'decide class width and form a frequency distribution (exclusive classes).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-stats-mod1-collection-classification-presentation-3', step: 'Step 3: compute mid-points and cumulative frequencies', detail: 'compute mid-points and cumulative frequencies.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-stats-mod1-collection-classification-presentation-4', step: 'Step 4: choose the diagram: histogram for distribution shape, ogive for perce...', detail: 'choose the diagram: histogram for distribution shape, ogive for percentiles, pie for composition.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-stats-mod1-collection-classification-presentation-5', step: 'Step 5: read values from the diagram as asked (median from ogive, mode from h...', detail: 'read values from the diagram as asked (median from ogive, mode from histogram peak).', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'stats-mod4-time-series-analysis', subjectId: 'bba-karnataka-statistics', title: 'Time Series Analysis', moduleNumber: 4, moduleName: 'Module 4: Time Series', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-stats-03', 'q-stats-04'], subtopics: [
        'Time Series: Components & Models',
        'Trend: Secular & Seasonal',
        'Moving Average Method',
        'Least Squares Method',
        'Seasonal Variations'
      ], explanationMd: `# Time Series Analysis

### Core Concept
A **time series** records a variable over successive periods (monthly Nandini sales, quarterly IT exports from Bengaluru). Analysis separates four components: **Trend (T)**, **Seasonal (S)**, **Cyclical (C)** and **Irregular (I)**. Models: additive (Y = T + S + C + I) when seasonal swings stay constant; multiplicative (Y = T x S x C x I) when they grow with the series.

---

### Key Framework
1. **Measurement of trend**: freehand curve, semi-averages, moving averages, method of least squares (Y = a + bX).
2. **Least squares**: normal equations: Sum(Y) = nA + B Sum(X); Sum(XY) = A Sum(X) + B Sum(X squared). Shift origin so Sum(X) = 0.
3. **Link relatives method** for seasonal indices: seasonal index = average of link relatives; adjust so the four (or twelve) indices average 100.
4. **Uses**: forecasting, isolating cyclical behaviour, planning capacity.

---

### Exam Focus
**Additive vs Multiplicative**: use multiplicative when seasonal variation rises and falls with the trend level.

![Time Series Diagram](time-series.png)`,
            formulas: [
              { id: 'formula-stats-mod4-time-series-analysis-1', label: 'Least squares trend', formula: 'Y = A + B X, with Sum(Y) = nA + B Sum(X) and Sum(XY) = A Sum(X) + B Sum(X squared)', exampleQ: 'Years 2021-2025 with odd number of years, coded X = -2,-1,0,1,2.', exampleA: 'Sum(X) = 0 gives A = Sum(Y)/n and B = Sum(XY)/Sum(X squared) directly.' },
              { id: 'formula-stats-mod4-time-series-analysis-2', label: 'Simple moving average', formula: 'MA of 3 years = (Y1 + Y2 + Y3) / 3', exampleQ: 'Sales 100, 120, 140.', exampleA: 'MA = 120.' },
            ],
            tricks: [
              { id: 'trick-stats-mod4-time-series-analysis-1', title: 'Shift the origin', trick: 'With coded years Sum(X) = 0, the normal equations collapse to one-line answers.', whenToUse: 'Saves 5 minutes in exams.' },
              { id: 'trick-stats-mod4-time-series-analysis-2', title: 'Odd period MA', trick: 'Centre the moving average on the middle period; even periods need a second centring step.', whenToUse: 'Quarterly data (4-period MA).' },
            ],
            howToSolve: [
              { id: 'solve-stats-mod4-time-series-analysis-1', step: 'Step 1: code years (X = -2,-1,0,1,2 for 5 years)', detail: 'code years (X = -2,-1,0,1,2 for 5 years).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-stats-mod4-time-series-analysis-2', step: 'Step 2: compute Sum(Y), Sum(XY), Sum(X squared)', detail: 'compute Sum(Y), Sum(XY), Sum(X squared).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-stats-mod4-time-series-analysis-3', step: 'Step 3: write the trend line Y = A + B X and estimate for the required year', detail: 'write the trend line Y = A + B X and estimate for the required year. For seasonal indices: step 4: compute link relatives (current / previous x 100), average by period, then scale so the mean index = 100.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'stats-mod5-index-numbers', subjectId: 'bba-karnataka-statistics', title: 'Index Numbers', moduleNumber: 5, moduleName: 'Module 5: Index Numbers', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-stats-05', 'q-stats-06'], subtopics: [
        'Index Numbers: Meaning & Types',
        'Laspeyres Index',
        'Paasche Index',
        'Fisher’s Ideal Index',
        'Chain Base Index'
      ], explanationMd: `# Index Numbers

### Core Concept
An **index number** measures the relative change in a variable (price, quantity, value) between periods. **CPI** (inflation feel), **WPI**, **BSE Sensex** (market) and cost-of-living indices are everyday examples; RBI policy reacts to CPI numbers every quarter. Aggregates: unweighted vs weighted.

---

### Key Framework
1. **Unweighted**: simple average of price relatives: Index = Sum(P1/P0 x 100) / n.
2. **Weighted**: Laspeyres uses base-year weights (fixed basket), Paasche uses current-year weights, Fisher is their geometric mean (ideal).
3. **Tests of adequacy**: Time Reversal and Factor Reversal; Fisher satisfies both; Laspeyres/Paasche fail one each.
4. **CPI construction**: Family Budget Method vs Aggregate Expenditure Method.

---

### Exam Focus
**Laspeyres vs Paasche**: Laspeyres overstates inflation when consumers substitute cheaper goods; Paasche understates it.

![Index Numbers Diagram](index-numbers.png)`,
            formulas: [
              { id: 'formula-stats-mod5-index-numbers-1', label: 'Laspeyres index', formula: 'L = Sum(P1 x Q0) / Sum(P0 x Q0) x 100', exampleQ: 'P0: Rs 10, Q0: 5; P1: Rs 12.', exampleA: 'L = (12 x 5) / (10 x 5) x 100 = 120.' },
              { id: 'formula-stats-mod5-index-numbers-2', label: 'Fisher ideal index', formula: 'F = Square root of (Laspeyres x Paasche)', exampleQ: 'L = 120, P = 115.', exampleA: 'F = Square root of (120 x 115) = 117.5.' },
            ],
            tricks: [
              { id: 'trick-stats-mod5-index-numbers-1', title: 'Price relative shortcut', trick: 'Index = Sum of (P1/P0 x 100) divided by n when weights are absent.', whenToUse: 'Unweighted questions are one-liners.' },
              { id: 'trick-stats-mod5-index-numbers-2', title: 'Real income', trick: 'Real wage index = Money wage index / Price index x 100.', whenToUse: 'Cost-of-living adjustment problems.' },
            ],
            howToSolve: [
              { id: 'solve-stats-mod5-index-numbers-1', step: 'Step 1: tabulate P0, P1, Q0, Q1', detail: 'tabulate P0, P1, Q0, Q1.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-stats-mod5-index-numbers-2', step: 'Step 2: choose the formula: unweighted (relatives), Laspeyres (base weights),...', detail: 'choose the formula: unweighted (relatives), Laspeyres (base weights), Paasche (current weights), Fisher (both).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-stats-mod5-index-numbers-3', step: 'Step 3: compute the numerator and denominator totals separately, divide, mult...', detail: 'compute the numerator and denominator totals separately, divide, multiply by 100.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-stats-mod5-index-numbers-4', step: 'Step 4: check the result against the tests if asked (time reversal: swap 0 an...', detail: 'check the result against the tests if asked (time reversal: swap 0 and 1; the product of the two indices should be 10000).', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'fm-mod1-indian-financial-system', subjectId: 'bba-karnataka-fin-markets', title: 'Indian Financial System: Structure & Components', moduleNumber: 1, moduleName: 'Module 1: Indian Financial System', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-fm-01b', 'q-fm-02'], subtopics: [
        'Financial System: Meaning & Components',
        'Money Market vs Capital Market',
        'Primary vs Secondary Market',
        'Role of RBI & SEBI',
        'Financial Intermediaries'
      ], explanationMd: `# Indian Financial System: Structure & Components

### Core Concept
The financial system channels savings into investment through **financial institutions, markets, instruments and services**. In India it splits into organised (RBI-regulated) and unorganised sectors, and into money market (short term) versus capital market (long term). Bodies: RBI (monetary authority), SEBI (securities), IRDAI (insurance), PFRDA (pensions).

---

### Key Framework
1. **Components**: financial assets (money, bonds, equity), institutions (banks, NBFCs, mutual funds), markets (money/capital/forex/derivatives), services (leasing, factoring, credit rating).
2. **Regulators**: RBI: banks & money supply; SEBI: capital markets; IRDAI: insurance; PFRDA: NPS/pensions.
3. **Flow of funds**: savers (households) to borrowers (firms/government) via direct (disintermediated, e.g. IPO) or indirect (bank deposits) channels.
4. **Recent reforms**: UPI/digital payments, inflation targeting, IBC resolution.

---

### Exam Focus
**Money market vs Capital market**: money market deals in near-money (T-bills, CPs) with maturity under a year; capital market deals in equity and long-term debt.

![Indian Financial System Diagram](financial-system.png)`,
            formulas: [
              { id: 'formula-fm-mod1-indian-financial-system-1', label: 'Financial intermediation', formula: 'Net funds mobilised = Deposits/borrowings minus Idle cash and reserves', exampleQ: 'Bank deposits Rs 500 cr, reserves Rs 50 cr.', exampleA: 'Deployable funds = Rs 450 cr.' },
              { id: 'formula-fm-mod1-indian-financial-system-2', label: 'Savings rate', formula: 'Gross savings rate = Gross savings / GDP x 100', exampleQ: 'Savings Rs 80 cr, GDP Rs 400 cr.', exampleA: 'Rate = 20%.' },
            ],
            tricks: [
              { id: 'trick-fm-mod1-indian-financial-system-1', title: 'Regulator map', trick: 'RBI banks, SEBI securities, IRDAI insurance, PFRDA pensions: one line each.', whenToUse: 'MCQ-heavy section.' },
              { id: 'trick-fm-mod1-indian-financial-system-2', title: 'Direct vs indirect', trick: 'Direct: securities sold to savers (IPO). Indirect: bank sits in between (FD).', whenToUse: 'Short-answer distinction.' },
            ],
            howToSolve: [
              { id: 'solve-fm-mod1-indian-financial-system-1', step: 'Step 1: classify the item asked as institution, market, instrument or service', detail: 'classify the item asked as institution, market, instrument or service.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mod1-indian-financial-system-2', step: 'Step 2: name the regulator and its instrument (repo rate, CRR for RBI; margin...', detail: 'name the regulator and its instrument (repo rate, CRR for RBI; margin rules for SEBI).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mod1-indian-financial-system-3', step: 'Step 3: for flow-of-funds problems, draw the saver-intermediary-borrower chai...', detail: 'for flow-of-funds problems, draw the saver-intermediary-borrower chain and compute net mobilisation.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mod1-indian-financial-system-4', step: 'Step 4: write a short reform/current-context note (UPI, IBC) for full marks', detail: 'write a short reform/current-context note (UPI, IBC) for full marks.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'fm-mod3-capital-market-instruments', subjectId: 'bba-karnataka-fin-markets', title: 'Capital Market: Instruments & Functioning', moduleNumber: 3, moduleName: 'Module 3: Capital Market Instruments', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-fm-03', 'q-fm-04'], subtopics: [
        'Equity Shares: Features & Types',
        'Preference Shares & Debentures',
        'Mutual Funds',
        'Derivatives: Futures & Options',
        'Bonds & Government Securities'
      ], explanationMd: `# Capital Market: Instruments & Functioning

### Core Concept
The **capital market** mobilises long-term funds through equity and debt instruments traded on BSE/NSE, governed by SEBI. Primary market: new issues (IPO, FPO, rights, private placement). Secondary market: trading of existing securities through stock exchanges with T+1 settlement.

---

### Key Framework
1. **Instruments**: equity shares, preference shares, debentures/bonds, convertible bonds, ADR/GDR, mutual fund units, derivatives (futures/options).
2. **Primary methods**: offer for sale, book building (price band discovery), rights issue (existing shareholders), private placement.
3. **Secondary market**: trading members, clearing corporation, depositories (NSDL/CDSL), demat settlement.
4. **SEBI framework**: listing obligations, insider trading prohibition, takeover code.

---

### Exam Focus
**Equity vs Debenture**: equity carries voting rights and variable dividend; debentures carry fixed interest and a charge on assets.

![Capital Market Diagram](capital-market.png)`,
            formulas: [
              { id: 'formula-fm-mod3-capital-market-instruments-1', label: 'Rights issue value', formula: 'Theoretical ex-rights price = (Old shares x Market price + New shares x Issue price) / Total shares', exampleQ: '1,000 shares at Rs 120; 200 new at Rs 100.', exampleA: 'TERP = (120000 + 20000) / 1200 = Rs 116.67.' },
              { id: 'formula-fm-mod3-capital-market-instruments-2', label: 'Bond price', formula: 'Price = Interest x PV annuity factor + Redemption x PV factor', exampleQ: 'Rs 100 bond, 10% coupon, 2 yrs, 12% discount rate.', exampleA: 'Price = 10 x 1.690 + 100 x 0.797 = Rs 96.6.' },
            ],
            tricks: [
              { id: 'trick-fm-mod3-capital-market-instruments-1', title: 'Book building band', trick: 'Floor price = minimum, cap price = maximum; discovered by demand at each price band.', whenToUse: 'IPO pricing MCQs.' },
              { id: 'trick-fm-mod3-capital-market-instruments-2', title: 'Demat basics', trick: 'Shares held electronically via depository participants; settlement T+1.', whenToUse: 'One-line current-context answers.' },
            ],
            howToSolve: [
              { id: 'solve-fm-mod3-capital-market-instruments-1', step: 'Step 1: identify primary vs secondary market in the question', detail: 'identify primary vs secondary market in the question.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mod3-capital-market-instruments-2', step: 'Step 2: for pricing problems, draw the cash flows (interest/dividend/redemption)', detail: 'for pricing problems, draw the cash flows (interest/dividend/redemption).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mod3-capital-market-instruments-3', step: 'Step 3: discount at the required rate using the given PV factors', detail: 'discount at the required rate using the given PV factors.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mod3-capital-market-instruments-4', step: 'Step 4: for rights issues, compute the ex-rights price and the value of a rig...', detail: 'for rights issues, compute the ex-rights price and the value of a right (TERP minus issue price).', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'fm-mod4-sebi-regulations', subjectId: 'bba-karnataka-fin-markets', title: 'SEBI Regulations & Investor Protection', moduleNumber: 4, moduleName: 'Module 4: SEBI & Investor Protection', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-fm-05', 'q-fm-06'], subtopics: [
        'SEBI: Powers & Functions',
        'Insider Trading: Prohibition & Penalties',
        'Takeover Code',
        'Investor Protection: Grievance Redressal',
        'Prohibition of Fraudulent & Unfair Trade Practices'
      ], explanationMd: `# SEBI Regulations & Investor Protection

### Core Concept
**SEBI** (Securities and Exchange Board of India, statutory since 1992) protects investors, regulates securities markets and promotes development. It has quasi-legislative, quasi-judicial and quasi-executive powers. Recent measures: T+1 settlement, ASBA, SCORES grievance portal, margin trading framework.

---

### Key Framework
1. **Objectives**: protect investors; regulate the market; promote development; reduce malpractices.
2. **Key regulations**: SEBI (LODR) 2015: listing norms; SEBI (PFUTP) 2003: fraudulent/unfair trade practices; SEBI (ICDR) 2018: issue regulations; SEBI (SAST) 2011: takeovers; SEBI (PIT) 1992: insider trading.
3. **Investor protection**: SCORES complaint system, Investor Protection and Education Fund, investor seminars, demat safety, two-factor authentication.
4. **Enforcement**: search and seizure, disgorgement of profits, monetary penalties, market bans.

---

### Exam Focus
**Insider trading vs fraudulent practice**: insider trading uses unpublished price-sensitive information; fraud includes misleading statements and market manipulation.

![SEBI Investor Protection Diagram](sebi-investor.png)`,
            formulas: [
              { id: 'formula-fm-mod4-sebi-regulations-1', label: 'Takeover trigger', formula: 'Open offer required at 25% acquisition; creeping acquisition limit 5% per financial year (25-75% band).', exampleQ: 'Promoter holds 30%, buys 4% more in a year.', exampleA: 'Within the 5% creeping limit: no open offer.' },
              { id: 'formula-fm-mod4-sebi-regulations-2', label: 'Disgorgement', formula: 'Amount to disgorge = Illegal gains made from the unfair trade practice.', exampleQ: 'Gain Rs 5 cr from manipulation.', exampleA: 'SEBI orders refund of Rs 5 cr plus interest.' },
            ],
            tricks: [
              { id: 'trick-fm-mod4-sebi-regulations-1', title: 'SCORES first', trick: 'Any investor grievance question: complain on SCORES before litigation.', whenToUse: 'Practical answer for case studies.' },
              { id: 'trick-fm-mod4-sebi-regulations-2', title: 'Regulation mnemonics', trick: 'LODR listing, PFUTP fraud, ICDR issues, SAST takeovers, PIT insider trading.', whenToUse: 'Match-the-following questions.' },
            ],
            howToSolve: [
              { id: 'solve-fm-mod4-sebi-regulations-1', step: 'Step 1: identify the market segment (issue, trading, takeover, grievance)', detail: 'identify the market segment (issue, trading, takeover, grievance).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mod4-sebi-regulations-2', step: 'Step 2: name the exact SEBI regulation and the prohibited conduct', detail: 'name the exact SEBI regulation and the prohibited conduct.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mod4-sebi-regulations-3', step: 'Step 3: state the investor protection mechanism (SCORES, IPEF, disgorgement)', detail: 'state the investor protection mechanism (SCORES, IPEF, disgorgement).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mod4-sebi-regulations-4', step: 'Step 4: conclude with the penalty SEBI can impose (fine, ban, disgorgement, s...', detail: 'conclude with the penalty SEBI can impose (fine, ban, disgorgement, suspension).', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'fm-mod5-money-market-instruments', subjectId: 'bba-karnataka-fin-markets', title: 'Money Market: Instruments & Participants', moduleNumber: 5, moduleName: 'Module 5: Money Market', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-fm-07', 'q-fm-08'], subtopics: [
        'Call Money Market',
        'Treasury Bills',
        'Commercial Paper',
        'Certificate of Deposit',
        'Commercial Bills'
      ], explanationMd: `# Money Market: Instruments & Participants

### Core Concept
The **money market** deals in short-term funds (maturity up to one year) in near-money instruments, wholesale in size and traded over the counter. RBI conducts monetary policy here via repo and reverse repo. Instruments: Treasury Bills, Commercial Paper, Certificate of Deposit, Call/Notice money, CBLO, Tri-party Repo.

---

### Key Framework
1. **T-bills**: issued by RBI on behalf of the government at a discount (91, 182, 364 days); no coupon.
2. **CP/CD**: CP: short-term unsecured corporate paper (min Rs 5 lakh); CD: negotiable bank deposit receipt.
3. **Call money**: 1-day borrowing/lending between banks; notice money: 2-14 days.
4. **Repo**: RBI lends to banks against securities; reverse repo: RBI absorbs liquidity. MSF and Bank Rate are the corridor edges.

---

### Exam Focus
**T-bill vs CD**: T-bill is sovereign and discount-issued; CD is a bank liability with a stated yield.

![Money Market Diagram](money-market.png)`,
            formulas: [
              { id: 'formula-fm-mod5-money-market-instruments-1', label: 'T-bill price', formula: 'Price = Face value x (1 minus Discount rate x Days / 360)', exampleQ: 'Rs 1,00,000 T-bill, 91 days, 6% discount.', exampleA: 'Price = 100000 x (1 minus 0.06 x 91/360) = Rs 98,483.' },
              { id: 'formula-fm-mod5-money-market-instruments-2', label: 'Repo rate effect', formula: 'Cost of funds rises when repo rate rises; money market yields track the repo rate.', exampleQ: 'RBI raises repo by 0.5%.', exampleA: 'Short-term rates rise by roughly 0.5%.' },
            ],
            tricks: [
              { id: 'trick-fm-mod5-money-market-instruments-1', title: 'Discount math', trick: 'Discount instruments quote yield on a 360-day base: Price = FV minus (FV x r x d/360).', whenToUse: 'All T-bill/CP pricing questions.' },
              { id: 'trick-fm-mod5-money-market-instruments-2', title: 'Liquidity absorption', trick: 'Reverse repo and MSF mop up liquidity; repo and OMO injections add it.', whenToUse: 'Monetary policy MCQs.' },
            ],
            howToSolve: [
              { id: 'solve-fm-mod5-money-market-instruments-1', step: 'Step 1: note the instrument, its issuer and maturity bucket', detail: 'note the instrument, its issuer and maturity bucket.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mod5-money-market-instruments-2', step: 'Step 2: for discount instruments compute Price = FV minus discount for the da...', detail: 'for discount instruments compute Price = FV minus discount for the day-count.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mod5-money-market-instruments-3', step: 'Step 3: compute the annualised yield = (FV minus Price)/Price x 360/days', detail: 'compute the annualised yield = (FV minus Price)/Price x 360/days.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mod5-money-market-instruments-4', step: 'Step 4: link to policy: repo rate, reverse repo, MSF, OMO in a short concludi...', detail: 'link to policy: repo rate, reverse repo, MSF, OMO in a short concluding line.', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'colaw-mod2-indian-contract-act', subjectId: 'bba-karnataka-business-law', title: 'Indian Contract Act 1872: Essentials & Performance', moduleNumber: 2, moduleName: 'Module 2: Indian Contract Act', order: 2, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-colaw-01b', 'q-colaw-02'], subtopics: [
        'Contract: Meaning & Essentials',
        'Offer, Acceptance & Consideration',
        'Capacity & Free Consent',
        'Legality of Object',
        'Performance & Discharge of Contract'
      ], explanationMd: `# Indian Contract Act 1872: Essentials & Performance

### Core Concept
A **contract** is an agreement enforceable by law (Section 2(h)). Essentials: offer and acceptance, lawful consideration, capacity, free consent, lawful object, certainty, and not expressly void. The Act governs formation, performance, breach and indemnity/penalty. Case illustrations from Indian courts (Carlill v Carbolic Smoke Ball, Mohori Bibee v Dharmodas Ghose) are standard exam content.

---

### Key Framework
1. **Offer**: must be definite and communicated; ends on revocation, lapse of time, death, conditional failure.
2. **Consent**: free consent is absent under coercion, undue influence, fraud, misrepresentation, mistake.
3. **Consideration**: something in return; need not be adequate but must be real and lawful.
4. **Performance**: tender of performance; joint promises; time is essential only when stipulated. Breach remedies: damages (remoteness rule in Hadley v Baxendale), specific performance, injunction.

---

### Exam Focus
**Agreement vs Contract**: every contract is an agreement, but an agreement without enforceability (e.g. a social promise) is not a contract.

![Contract Act Diagram](contract-act.png)`,
            formulas: [
              { id: 'formula-colaw-mod2-indian-contract-act-1', label: 'Contract = f(essentials)', formula: 'Contract = Valid offer + Acceptance + Consideration + Capacity + Free consent + Lawful object', exampleQ: 'A promises to sell his car to B for Rs 1 lakh; B accepts and pays.', exampleA: 'All essentials present: valid contract; B can sue for delivery.' },
              { id: 'formula-colaw-mod2-indian-contract-act-2', label: 'Damages ceiling', formula: 'Compensation = Loss that arose naturally or was in the contemplation of both parties', exampleQ: 'Seller breaches delivery of a machine needed for a special order disclosed.', exampleA: 'Loss of disclosed special profit is recoverable.' },
            ],
            tricks: [
              { id: 'trick-colaw-mod2-indian-contract-act-1', title: 'Voidable vs void', trick: 'Voidable: at the option of one party (coerced consent). Void: no legal effect at all (minor agreement).', whenToUse: 'MCQ favourite.' },
              { id: 'trick-colaw-mod2-indian-contract-act-2', title: 'Offer vs invitation', trick: 'A price list/advertisement display is an invitation to offer; the customer offers at the counter.', whenToUse: 'Carlill-style problems.' },
            ],
            howToSolve: [
              { id: 'solve-colaw-mod2-indian-contract-act-1', step: 'Step 1: list the facts as offer, acceptance, consideration, consent, capacity...', detail: 'list the facts as offer, acceptance, consideration, consent, capacity, object.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod2-indian-contract-act-2', step: 'Step 2: test each essential and flag the defect (minor, coercion, public policy)', detail: 'test each essential and flag the defect (minor, coercion, public policy).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod2-indian-contract-act-3', step: 'Step 3: conclude: valid, voidable or void agreement', detail: 'conclude: valid, voidable or void agreement.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod2-indian-contract-act-4', step: 'Step 4: if breach is asked, state the remedy and quantify damages under the r...', detail: 'if breach is asked, state the remedy and quantify damages under the remoteness rule.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'colaw-mod3-sale-of-goods-act', subjectId: 'bba-karnataka-business-law', title: 'Sale of Goods Act 1930', moduleNumber: 3, moduleName: 'Module 3: Sale of Goods Act', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-colaw-03', 'q-colaw-04'], subtopics: [
        'Contract of Sale: Essentials',
        'Conditions vs Warranties',
        'Transfer of Property',
        'Rights of Unpaid Seller',
        'Auction Sale'
      ], explanationMd: `# Sale of Goods Act 1930

### Core Concept
A **contract of sale of goods** transfers property in goods from seller to buyer for a price (Section 4). Conditions and warranties decide the buyer's remedies: breach of a condition lets the buyer repudiate; breach of a warranty limits the buyer to damages. Concepts of goods, price, property (ownership) passing, and delivery are exam staples.

---

### Key Framework
1. **Conditions vs warranties**: condition goes to the root; warranty is collateral. The buyer may treat a breach of condition as a breach of warranty (Section 13).
2. **Property passing**: ascertained and unconditional goods: passes when the parties intend; rules in Sections 18-24 (specific goods, unascertained, approval/sale-or-return).
3. **Rights of unpaid seller**: lien, stoppage in transit, resale, suit for price/damages.
4. **Caveat emptor** (let the buyer beware) with exceptions: fraud, latent defect, fitness for purpose.

---

### Exam Focus
**Condition vs warranty**: a breach of condition gives repudiation plus damages; a breach of warranty gives damages only.

![Sale of Goods Diagram](sale-of-goods.png)`,
            formulas: [
              { id: 'formula-colaw-mod3-sale-of-goods-act-1', label: 'Price determination', formula: 'Price may be fixed by the contract, determined by a third party, or a reasonable price implied (Section 9)', exampleQ: 'Contract silent on price for goods delivered.', exampleA: 'Buyer must pay a reasonable price.' },
              { id: 'formula-colaw-mod3-sale-of-goods-act-2', label: 'Unpaid seller lien', formula: 'Lien exists while goods are in possession and the price is unpaid, unless credit was given.', exampleQ: 'Seller holds goods after non-payment.', exampleA: 'Seller may retain goods until payment.' },
            ],
            tricks: [
              { id: 'trick-colaw-mod3-sale-of-goods-act-1', title: 'Caveat emptor exceptions', trick: 'Fraud, latent defect not discoverable, fitness-for-purpose reliance on seller.', whenToUse: 'Any consumer-goods problem.' },
              { id: 'trick-colaw-mod3-sale-of-goods-act-2', title: 'Sale vs agreement to sell', trick: 'Sale: property passes now. Agreement to sell: passes on a future condition.', whenToUse: 'Ownership/risk questions.' },
            ],
            howToSolve: [
              { id: 'solve-colaw-mod3-sale-of-goods-act-1', step: 'Step 1: classify the goods (specific, unascertained, future) and the contract...', detail: 'classify the goods (specific, unascertained, future) and the contract (sale vs agreement to sell).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod3-sale-of-goods-act-2', step: 'Step 2: apply the property-passing rules to decide who owns them and bears risk', detail: 'apply the property-passing rules to decide who owns them and bears risk.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod3-sale-of-goods-act-3', step: 'Step 3: identify the breached term as condition or warranty', detail: 'identify the breached term as condition or warranty.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod3-sale-of-goods-act-4', step: 'Step 4: state the buyer remedy (repudiate + damages, or damages only) and any...', detail: 'state the buyer remedy (repudiate + damages, or damages only) and any unpaid seller rights (lien, stoppage, resale).', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'colaw-mod4-negotiable-instruments-act', subjectId: 'bba-karnataka-business-law', title: 'Negotiable Instruments Act 1881', moduleNumber: 4, moduleName: 'Module 4: Negotiable Instruments', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-colaw-05', 'q-colaw-06'], subtopics: [
        'Negotiable Instruments: Meaning & Features',
        'Promissory Note, Bill of Exchange, Cheque',
        'Parties to Negotiable Instruments',
        'Holder & Holder in Due Course',
        'Dishonour of Cheque'
      ], explanationMd: `# Negotiable Instruments Act 1881

### Core Concept
A **negotiable instrument** (Section 13) is a promissory note, bill of exchange or cheque payable to order or bearer, transferring freely with good title. The Act covers holder/holder-in-due-course, endorsement, presentment, dishonour and the special summary remedy for cheque dishonour (Section 138, NI Act, made punishable).

---

### Key Framework
1. **Three instruments**: Promissory note (promise to pay); Bill of exchange (order to pay); Cheque (bill drawn on a banker, always payable on demand).
2. **Holder in due course (HDC)**: takes for value, in good faith, before maturity, without defect; gets a better title than the transferor.
3. **Endorsement**: blank (only signature), special (named), restrictive (no further negotiation), qualified (without recourse).
4. **Dishonour (Section 138)**: cheque returned for insufficient funds; payee must demand in 30 days; drawer gets 15 days to pay; complaint within 1 month; punishment up to 2 years or fine up to twice the amount.

---

### Exam Focus
**Holder vs HDC**: an HDC acquires a good title even if the transferor had a defective one.

![Negotiable Instruments Diagram](negotiable-instruments.png)`,
            formulas: [
              { id: 'formula-colaw-mod4-negotiable-instruments-act-1', label: 'Cheque validity', formula: 'Cheque valid for 3 months from the date of issue (RBI rule).', exampleQ: 'Cheque dated 1 Jan.', exampleA: 'Present by 31 Mar or it becomes stale.' },
              { id: 'formula-colaw-mod4-negotiable-instruments-act-2', label: 'Section 138 timeline', formula: 'Demand within 30 days of return; 15 days for payment; complaint within 1 month after.', exampleQ: 'Cheque returned 1 Apr, notice 10 Apr.', exampleA: 'Drawer must pay by 25 Apr; complaint by 25 May.' },
            ],
            tricks: [
              { id: 'trick-colaw-mod4-negotiable-instruments-act-1', title: 'Maturity computation', trick: 'Bill maturity = sight date + 3 grace days; no grace on demand instruments.', whenToUse: 'Date arithmetic questions.' },
              { id: 'trick-colaw-mod4-negotiable-instruments-act-2', title: 'Sans recourse', trick: 'Qualified endorsement excludes the endorser liability on dishonour.', whenToUse: 'Endorsement MCQs.' },
            ],
            howToSolve: [
              { id: 'solve-colaw-mod4-negotiable-instruments-act-1', step: 'Step 1: identify the instrument and its parties (drawer, drawee, payee, endor...', detail: 'identify the instrument and its parties (drawer, drawee, payee, endorser).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod4-negotiable-instruments-act-2', step: 'Step 2: check negotiation requirements: delivery, endorsement, maturity', detail: 'check negotiation requirements: delivery, endorsement, maturity.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod4-negotiable-instruments-act-3', step: 'Step 3: for dishonour, map the Section 138 timeline (30/15/1 month)', detail: 'for dishonour, map the Section 138 timeline (30/15/1 month).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod4-negotiable-instruments-act-4', step: 'Step 4: state the remedy: summary prosecution plus a suit for the amount', detail: 'state the remedy: summary prosecution plus a suit for the amount.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'colaw-mod5-consumer-protection-act', subjectId: 'bba-karnataka-business-law', title: 'Consumer Protection Act 2019', moduleNumber: 5, moduleName: 'Module 5: Consumer Protection', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-colaw-07', 'q-colaw-08'], subtopics: [
        'Consumer Rights: Six Rights',
        'Consumer Disputes Redressal Agencies',
        'Product Liability',
        'Unfair Trade Practices',
        'E-commerce Consumer Protection'
      ], explanationMd: `# Consumer Protection Act 2019

### Core Concept
The 2019 Act replaces the 1986 law and covers **e-commerce and product liability** too. A consumer is anyone buying goods or services for consideration (not for resale). Six consumer rights are recognised. The Act establishes a three-tier quasi-judicial structure: District, State and National Commissions, plus CCPA (Central Consumer Protection Authority) for class actions and misleading ads.

---

### Key Framework
1. **Consumer rights**: safety, information, choice, be heard, redressal, consumer education.
2. **Complaint grounds**: unfair trade practice, restrictive trade practice, defective goods, deficiency in services, overcharging, hazardous goods.
3. **Jurisdiction**: District: up to Rs 50 lakh; State: Rs 50 lakh to Rs 2 crore; National: above Rs 2 crore.
4. **Product liability**: manufacturer, seller and service provider all liable for defective goods or deficient services; e-commerce entities have disclosure duties. Mediation cells speed settlement.

---

### Exam Focus
**Consumer vs customer**: a consumer includes any user of goods/services with the approval of the buyer; not just the person who paid.

![Consumer Protection Diagram](consumer-protection.png)`,
            formulas: [
              { id: 'formula-colaw-mod5-consumer-protection-act-1', label: 'Pecuniary test', formula: 'District forum: claim up to Rs 50 lakh; State: up to Rs 2 crore; National: above Rs 2 crore', exampleQ: 'Claim of Rs 60 lakh.', exampleA: 'File before the State Commission.' },
              { id: 'formula-colaw-mod5-consumer-protection-act-2', label: 'Limitation period', formula: 'Complaint within 2 years from the cause of action (condonable on sufficient cause).', exampleQ: 'Deficiency noticed 1 Jun 2024.', exampleA: 'Complaint by 1 Jun 2026.' },
            ],
            tricks: [
              { id: 'trick-colaw-mod5-consumer-protection-act-1', title: 'CCPA powers', trick: 'CCPA can order recall, refund, and ban misleading advertisements; class complaints on behalf of consumers.', whenToUse: 'Product-safety case studies.' },
              { id: 'trick-colaw-mod5-consumer-protection-act-2', title: 'E-commerce clause', trick: 'Marketplace must disclose seller details, return policy and grievance officer.', whenToUse: 'Online-shopping questions.' },
            ],
            howToSolve: [
              { id: 'solve-colaw-mod5-consumer-protection-act-1', step: 'Step 1: confirm consumer status (consideration paid, purpose personal use)', detail: 'confirm consumer status (consideration paid, purpose personal use).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod5-consumer-protection-act-2', step: 'Step 2: classify the grievance (defect, deficiency, unfair practice, overcharge)', detail: 'classify the grievance (defect, deficiency, unfair practice, overcharge).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod5-consumer-protection-act-3', step: 'Step 3: compute the claim value to fix jurisdiction (District/State/National)', detail: 'compute the claim value to fix jurisdiction (District/State/National).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod5-consumer-protection-act-4', step: 'Step 4: note limitation (2 years) and relief sought (refund, compensation, re...', detail: 'note limitation (2 years) and relief sought (refund, compensation, removal of defect, punitive damages).', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'fm-mngt-mod1-time-value-of-money', subjectId: 'bba-karnataka-fin-mgmt', title: 'Time Value of Money', moduleNumber: 1, moduleName: 'Module 1: Time Value of Money', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-fmngt-01', 'q-fmngt-02'], subtopics: [
        'Time Value of Money: Concept',
        'Present Value & Future Value',
        'Compounding & Discounting',
        'Annuities',
        'Perpetuity'
      ], explanationMd: `# Time Value of Money

### Core Concept
A rupee today is worth more than a rupee tomorrow because it can earn interest. **Compounding** moves present money forward; **discounting** brings future money back. This module builds FV/PV of single cash flows, annuities and perpetuities: the base for capital budgeting, valuation and loan maths.

---

### Key Framework
1. **Single amount**: FV = PV x (1 + r)^n; PV = FV / (1 + r)^n.
2. **Annuity (ordinary)**: FV = A x [((1 + r)^n minus 1) / r]; PV = A x [(1 minus (1 + r)^(-n)) / r]. Annuity due = ordinary x (1 + r).
3. **Perpetuity**: PV = A / r.
4. **Effective rate**: EAR = (1 + r/m)^m minus 1 for m compounding periods a year.

---

### Exam Focus
**Annuity vs perpetuity**: annuity runs for a fixed n; perpetuity runs forever (PV = A/r).

![Time Value of Money Diagram](break-even-analysis.png)`,
            formulas: [
              { id: 'formula-fm-mngt-mod1-time-value-of-money-1', label: 'PV of single sum', formula: 'PV = FV / (1 + r)^n', exampleQ: 'FV Rs 10,000 due in 3 years at 10%.', exampleA: 'PV = 10000 / 1.331 = Rs 7,513.' },
              { id: 'formula-fm-mngt-mod1-time-value-of-money-2', label: 'Annuity FV', formula: 'FV = A x ((1 + r)^n minus 1) / r', exampleQ: 'Rs 5,000 saved yearly, 5 years, 8%.', exampleA: 'FV = 5000 x 5.8666 = Rs 29,333.' },
            ],
            tricks: [
              { id: 'trick-fm-mngt-mod1-time-value-of-money-1', title: 'Rule of 72', trick: 'Doubling years approx 72 / (interest rate in percent).', whenToUse: 'Quick MCQ checks: 8% doubles in about 9 years.' },
              { id: 'trick-fm-mngt-mod1-time-value-of-money-2', title: 'Annuity due bump', trick: 'Multiply ordinary annuity result by (1 + r) when payments start at the beginning.', whenToUse: 'Rent/advance-payment problems.' },
            ],
            howToSolve: [
              { id: 'solve-fm-mngt-mod1-time-value-of-money-1', step: 'Step 1: draw a timeline and mark cash flows with their years', detail: 'draw a timeline and mark cash flows with their years.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mngt-mod1-time-value-of-money-2', step: 'Step 2: identify the pattern: single sum, annuity, perpetuity', detail: 'identify the pattern: single sum, annuity, perpetuity.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mngt-mod1-time-value-of-money-3', step: 'Step 3: choose formula (FV for compounding forward, PV for discounting) and s...', detail: 'choose formula (FV for compounding forward, PV for discounting) and select the correct rate per period.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mngt-mod1-time-value-of-money-4', step: 'Step 4: for mixed streams, value each part and add; for annuity due multiply...', detail: 'for mixed streams, value each part and add; for annuity due multiply by (1 + r).', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'fm-mngt-mod4-dividend-decision', subjectId: 'bba-karnataka-fin-mgmt', title: 'Dividend Decision & Working Capital', moduleNumber: 4, moduleName: 'Module 4: Dividend Decision & Working Capital', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-fmngt-03', 'q-fmngt-04'], subtopics: [
        'Dividend Policy: Types',
        'Walter’s Model',
        'Gordon’s Model',
        'MM Hypothesis',
        'Working Capital Management'
      ], explanationMd: `# Dividend Decision & Working Capital

### Core Concept
**Dividend decision** balances distributing profit versus reinvesting; theories: Walter, Gordon (bird-in-hand), Modigliani-Miller (dividend irrelevance with perfect markets). **Working capital management** ensures day-to-day liquidity: current assets versus current liabilities, cash, receivables and inventory cycles.

---

### Key Framework
1. **Dividend theories**: MM: value depends on earnings, not payout; Gordon: value rises with payout when growth is low; Walter: optimal payout depends on return versus cost of capital.
2. **Working capital cycle**: Cash to raw material to WIP to finished goods to receivables to cash; shorter cycle, better liquidity.
3. **Estimation methods**: operating cycle method; percentage of sales; regression.
4. **Receivables/inventory control**: credit policy (5 Cs), EOQ, safety stock; cash budgeting.

---

### Exam Focus
**Gordon vs MM**: Gordon says higher payout raises value (risk aversion); MM says payout is irrelevant in perfect markets.

![Dividend and Working Capital Diagram](dividend-working-capital.png)`,
            formulas: [
              { id: 'formula-fm-mngt-mod4-dividend-decision-1', label: 'Gordon value', formula: 'P0 = D1 / (k minus g) where g = retention ratio x return on equity', exampleQ: 'D1 = Rs 5, k = 12%, g = 4%.', exampleA: 'P0 = 5 / 0.08 = Rs 62.5.' },
              { id: 'formula-fm-mngt-mod4-dividend-decision-2', label: 'Working capital need', formula: 'Gross WC = Current assets; Net WC = Current assets minus Current liabilities', exampleQ: 'CA Rs 8 lakh, CL Rs 3 lakh.', exampleA: 'Net WC = Rs 5 lakh.' },
            ],
            tricks: [
              { id: 'trick-fm-mngt-mod4-dividend-decision-1', title: 'Operating cycle', trick: 'Cycle days = RM days + WIP days + FG days + Receivable days minus Payable days.', whenToUse: 'Convert to a rupee estimate for the answer.' },
              { id: 'trick-fm-mngt-mod4-dividend-decision-2', title: 'Dividend dates', trick: 'Declaration, record, ex-dividend, payment: value falls on the ex-dividend date.', whenToUse: 'Timeline MCQs.' },
            ],
            howToSolve: [
              { id: 'solve-fm-mngt-mod4-dividend-decision-1', step: 'Step 1: for dividend theory questions state the assumptions of each theory be...', detail: 'for dividend theory questions state the assumptions of each theory before applying.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mngt-mod4-dividend-decision-2', step: 'Step 2: compute Gordon value with g = b x r', detail: 'compute Gordon value with g = b x r.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mngt-mod4-dividend-decision-3', step: 'Step 3: for working capital, draw the operating cycle and convert days to rup...', detail: 'for working capital, draw the operating cycle and convert days to rupees using annual cost/365.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mngt-mod4-dividend-decision-4', step: 'Step 4: recommend the policy (conservative/aggressive/moderate) with the liqu...', detail: 'recommend the policy (conservative/aggressive/moderate) with the liquidity-profitability trade-off.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'fm-mngt-mod5-capital-budgeting', subjectId: 'bba-karnataka-fin-mgmt', title: 'Capital Budgeting: NPV, IRR & Payback', moduleNumber: 5, moduleName: 'Module 5: Capital Budgeting', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-fmngt-05', 'q-fmngt-06'], subtopics: [
        'Capital Budgeting: Meaning & Importance',
        'Payback Period',
        'Net Present Value (NPV)',
        'Internal Rate of Return (IRR)',
        'Profitability Index'
      ], explanationMd: `# Capital Budgeting: NPV, IRR & Payback

### Core Concept
**Capital budgeting** appraises long-term investment proposals. Methods: Payback (speed of recovery), Accounting Rate of Return (accounting profit), **NPV** (value added, the theoretically correct rule) and **IRR** (the break-even discount rate). Mutually exclusive projects: prefer NPV; conflicts with IRR arise from scale or timing differences.

---

### Key Framework
1. **NPV**: Sum of discounted cash flows minus initial outlay; accept if NPV > 0.
2. **IRR**: the rate where NPV = 0; interpolate between two trial rates: IRR = r1 + [NPV1 / (NPV1 minus NPV2)] x (r2 minus r1).
3. **Payback**: years to recover outlay; discounted payback discounts each inflow first.
4. **Profitability Index** = PV of inflows / outlay; PI > 1 acceptable (useful under capital rationing).

---

### Exam Focus
**NPV vs IRR**: NPV measures wealth created; IRR is a percentage break-even. At conflicts, trust NPV.

![Capital Budgeting Diagram](break-even-analysis.png)`,
            formulas: [
              { id: 'formula-fm-mngt-mod5-capital-budgeting-1', label: 'NPV', formula: 'NPV = Sum of [CFt / (1 + r)^t] minus Initial investment', exampleQ: 'Outlay Rs 50,000; inflows Rs 20,000 for 3 yrs at 10%.', exampleA: 'PV = 20000 x 2.4869 = Rs 49,738; NPV = minus Rs 262.' },
              { id: 'formula-fm-mngt-mod5-capital-budgeting-2', label: 'IRR interpolation', formula: 'IRR = r1 + (NPV1 / (NPV1 minus NPV2)) x (r2 minus r1)', exampleQ: 'NPV 10% = +2,000; NPV 12% = minus 500.', exampleA: 'IRR = 10 + (2000/2500) x 2 = 11.6%.' },
            ],
            tricks: [
              { id: 'trick-fm-mngt-mod5-capital-budgeting-1', title: 'NPV sign check', trick: 'If NPV at the lower rate is positive and at the higher rate is negative, the true IRR lies between them.', whenToUse: 'Interpolation validity check.' },
              { id: 'trick-fm-mngt-mod5-capital-budgeting-2', title: 'Depreciation shield', trick: 'Use after-tax cash flows: add back depreciation after taxing profit.', whenToUse: 'Tax-adjusted problems.' },
            ],
            howToSolve: [
              { id: 'solve-fm-mngt-mod5-capital-budgeting-1', step: 'Step 1: list cash flows year by year (include outlay as negative at year 0)', detail: 'list cash flows year by year (include outlay as negative at year 0).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mngt-mod5-capital-budgeting-2', step: 'Step 2: compute NPV with the given discount rate using PV factors', detail: 'compute NPV with the given discount rate using PV factors.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mngt-mod5-capital-budgeting-3', step: 'Step 3: for IRR pick two rates that bracket zero NPV and interpolate', detail: 'for IRR pick two rates that bracket zero NPV and interpolate.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mngt-mod5-capital-budgeting-4', step: 'Step 4: compute payback cumulatively (discounted version: discount each inflo...', detail: 'compute payback cumulatively (discounted version: discount each inflow first).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-fm-mngt-mod5-capital-budgeting-5', step: 'Step 5: rank projects; for mutually exclusive choices prefer NPV', detail: 'rank projects; for mutually exclusive choices prefer NPV.', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'hrm-mod1-introduction-hrm-functions', subjectId: 'bba-karnataka-hrm', title: 'Introduction to HRM & HR Functions', moduleNumber: 1, moduleName: 'Module 1: HRM Foundations', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-hrm-01b', 'q-hrm-02'], subtopics: [
        'HRM: Meaning, Objectives & Functions',
        'HRM vs HRM',
        'Human Resource Planning',
        'Job Analysis & Job Design',
        'Recruitment & Selection'
      ], explanationMd: `# Introduction to HRM & HR Functions

### Core Concept
**Human Resource Management** plans, acquires, develops, motivates and retains employees to achieve organisational goals. It evolved from welfare/industrial relations to strategic HRM (people as capital). HR functions: job analysis, recruitment, selection, training, appraisal, compensation, employee relations, and compliance with labour law.

---

### Key Framework
1. **HRM vs personnel management**: HRM is strategic and people-development oriented; personnel administration is routine and rule-driven.
2. **Functions**: procurement (job analysis, recruitment, selection), development (training, career), compensation (wage, benefits), integration (motivation, communication), maintenance (health, welfare).
3. **HR planning**: demand forecasting (trend, workload ratio), supply forecasting (Markov/succession); gap analysis.
4. **Strategic link**: HR scorecard, competency mapping, employer branding; Karnataka IT firms compete on retention and culture.

---

### Exam Focus
**Recruitment vs selection**: recruitment is a positive process of generating applicants; selection is a negative process of rejecting mismatches.

![HRM Functions Diagram](hrm-functions.png)`,
            formulas: [
              { id: 'formula-hrm-mod1-introduction-hrm-functions-1', label: 'HR gap', formula: 'Gap = Forecasted demand minus Projected supply', exampleQ: 'Need 120 staff, supply 90.', exampleA: 'Gap = 30; recruit or redeploy 30.' },
              { id: 'formula-hrm-mod1-introduction-hrm-functions-2', label: 'Cost per hire', formula: 'Cost per hire = Total recruitment cost / Number of hires', exampleQ: 'Spend Rs 2 lakh, 20 hires.', exampleA: 'Rs 10,000 per hire.' },
            ],
            tricks: [
              { id: 'trick-hrm-mod1-introduction-hrm-functions-1', title: 'Job analysis twin', trick: 'Job description = duties of the job; job specification = qualities of the person.', whenToUse: 'Classic 2-mark distinction.' },
              { id: 'trick-hrm-mod1-introduction-hrm-functions-2', title: 'HR planning order', trick: 'Forecast demand, forecast supply, compare gap, plan action, monitor.', whenToUse: 'Process questions earn steps marks.' },
            ],
            howToSolve: [
              { id: 'solve-hrm-mod1-introduction-hrm-functions-1', step: 'Step 1: define HRM and contrast it with personnel management', detail: 'define HRM and contrast it with personnel management.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-hrm-mod1-introduction-hrm-functions-2', step: 'Step 2: list the five functional areas with one-line examples', detail: 'list the five functional areas with one-line examples.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-hrm-mod1-introduction-hrm-functions-3', step: 'Step 3: for scenario questions, apply the correct concept (recruitment vs sel...', detail: 'for scenario questions, apply the correct concept (recruitment vs selection, description vs specification).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-hrm-mod1-introduction-hrm-functions-4', step: 'Step 4: quantify any planning problem (demand minus supply gap) and close wit...', detail: 'quantify any planning problem (demand minus supply gap) and close with the strategic HRM angle.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'hrm-mod3-training-development', subjectId: 'bba-karnataka-hrm', title: 'Training & Development', moduleNumber: 3, moduleName: 'Module 3: Training & Development', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-hrm-03', 'q-hrm-04'], subtopics: [
        'Training: Meaning & Need',
        'Training Methods: On-the-job & Off-the-job',
        'Management Development',
        'Performance Appraisal',
        'Career Development'
      ], explanationMd: `# Training & Development

### Core Concept
**Training** builds current-job skills (short term); **development** builds future capabilities (long term, managerial). The cycle: needs assessment (organisation, task, person), design, delivery, evaluation. On-the-job: apprenticeship, job rotation, coaching; off-the-job: lectures, case study, role play, vestibule, sensitivity training.

---

### Key Framework
1. **Needs analysis**: organisational (strategy gaps), task (skill matrix), individual (appraisal gaps).
2. **Methods**: on-the-job (job rotation, coaching, apprenticeship) vs off-the-job (conference, case, simulation, e-learning).
3. **Evaluation (Kirkpatrick)**: Reaction, Learning, Behaviour, Results; ROI = (Benefit minus Cost) / Cost x 100.
4. **Management development**: MDPs, job rotation, action learning, assessment centres, mentoring.

---

### Exam Focus
**Training vs development**: training is for present jobs and non-managers mainly; development is career-long and manager-focused.

![Training and Development Diagram](training-development.png)`,
            formulas: [
              { id: 'formula-hrm-mod3-training-development-1', label: 'Training ROI', formula: 'ROI = (Monetary benefit minus Training cost) / Training cost x 100', exampleQ: 'Benefit Rs 5 lakh, cost Rs 2 lakh.', exampleA: 'ROI = (5L minus 2L)/2L x 100 = 150%.' },
              { id: 'formula-hrm-mod3-training-development-2', label: 'Kirkpatrick order', formula: '4 levels: Reaction, Learning, Behaviour, Results (RLBR)', exampleQ: 'Evaluate a program that cost Rs 1 lakh.', exampleA: 'Check satisfaction first, then skill gain, then workplace behaviour, then output/ROI.' },
            ],
            tricks: [
              { id: 'trick-hrm-mod3-training-development-1', title: 'Vestibule = replica', trick: 'Vestibule training uses a replica of the work station off the floor.', whenToUse: 'Method-matching MCQs.' },
              { id: 'trick-hrm-mod3-training-development-2', title: 'ADDIE', trick: 'Analysis, Design, Development, Implementation, Evaluation: the training design cycle.', whenToUse: 'Process questions.' },
            ],
            howToSolve: [
              { id: 'solve-hrm-mod3-training-development-1', step: 'Step 1: diagnose the training need at three levels (organisation/task/individ...', detail: 'diagnose the training need at three levels (organisation/task/individual).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-hrm-mod3-training-development-2', step: 'Step 2: choose method: on-the-job for procedural skills, off-the-job for conc...', detail: 'choose method: on-the-job for procedural skills, off-the-job for conceptual/managerial skills.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-hrm-mod3-training-development-3', step: 'Step 3: design objectives and content', detail: 'design objectives and content.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-hrm-mod3-training-development-4', step: 'Step 4: evaluate with Kirkpatrick levels and compute ROI if numbers are given', detail: 'evaluate with Kirkpatrick levels and compute ROI if numbers are given.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'hrm-mod4-compensation-benefits', subjectId: 'bba-karnataka-hrm', title: 'Compensation & Benefits', moduleNumber: 4, moduleName: 'Module 4: Compensation & Benefits', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-hrm-05', 'q-hrm-06'], subtopics: [
        'Compensation: Meaning & Components',
        'Wage & Salary Administration',
        'Incentive Plans',
        'Employee Benefits',
        'Pay Structure'
      ], explanationMd: `# Compensation & Benefits

### Core Concept
**Compensation** is everything an employee receives: direct pay (basic, DA, incentives, bonuses) and indirect benefits (PF, ESI, gratuity, leave, insurance). Design balances equity (internal/external), incentive and compliance with the Payment of Wages Act, Minimum Wages Act, Payment of Bonus Act and EPF Act.

---

### Key Framework
1. **Components**: basic salary, dearness allowance, house rent allowance, incentives (individual/team), profit sharing, ESOPs.
2. **Wage theories**: subsistence (Ricardo), residual claimant (Walker), bargaining (Dunlop), productivity.
3. **Job evaluation methods**: ranking, job classification, point method, factor comparison.
4. **Statutory benefits**: PF (12% employee + 12% employer), ESI, gratuity (15 days wages per year after 5 years), bonus (8.33%-20%).

---

### Exam Focus
**Compensation vs benefits**: compensation is direct monetary payment; benefits are indirect, often non-wage and tax-advantaged.

![Compensation and Benefits Diagram](compensation-benefits.png)`,
            formulas: [
              { id: 'formula-hrm-mod4-compensation-benefits-1', label: 'Gratuity', formula: 'Gratuity = (Last basic + DA) / 26 x 15 x Years of service', exampleQ: 'Basic+DA Rs 26,000/month, 10 years.', exampleA: 'Gratuity = 1000 x 15 x 10 = Rs 1,50,000.' },
              { id: 'formula-hrm-mod4-compensation-benefits-2', label: 'Dearness allowance', formula: 'DA = Basic x DA percentage / 100', exampleQ: 'Basic Rs 20,000, DA 42%.', exampleA: 'DA = Rs 8,400; total = Rs 28,400.' },
            ],
            tricks: [
              { id: 'trick-hrm-mod4-compensation-benefits-1', title: 'Point method winner', trick: 'Point-rating is the most widely used job evaluation method (quantitative, comparable).', whenToUse: 'Method MCQs.' },
              { id: 'trick-hrm-mod4-compensation-benefits-2', title: 'Bonus floor', trick: 'Statutory bonus: minimum 8.33%, maximum 20% of wages (Payment of Bonus Act).', whenToUse: 'Compliance questions.' },
            ],
            howToSolve: [
              { id: 'solve-hrm-mod4-compensation-benefits-1', step: 'Step 1: break the pay package into direct and indirect components', detail: 'break the pay package into direct and indirect components.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-hrm-mod4-compensation-benefits-2', step: 'Step 2: compute statutory items: PF on basic+DA, gratuity formula, bonus range', detail: 'compute statutory items: PF on basic+DA, gratuity formula, bonus range.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-hrm-mod4-compensation-benefits-3', step: 'Step 3: for job evaluation, name the method and one merit/demerit', detail: 'for job evaluation, name the method and one merit/demerit.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-hrm-mod4-compensation-benefits-4', step: 'Step 4: end with equity: internal (same job, same pay) and external (market b...', detail: 'end with equity: internal (same job, same pay) and external (market benchmark).', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'hrm-mod5-employee-relations-retention', subjectId: 'bba-karnataka-hrm', title: 'Employee Relations & Retention', moduleNumber: 5, moduleName: 'Module 5: Employee Relations & Retention', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-hrm-07', 'q-hrm-08'], subtopics: [
        'Employee Relations: Meaning',
        'Grievance Handling',
        'Discipline & Disciplinary Action',
        'Employee Retention Strategies',
        'Trade Unions & Collective Bargaining'
      ], explanationMd: `# Employee Relations & Retention

### Core Concept
**Employee relations** covers union-management dynamics, dispute resolution and participation; **retention** keeps valuable employees through engagement, career paths and culture. Industrial Disputes Act 1947 governs strikes, lockouts, layoff, retrenchment and adjudication (works committee, conciliation, arbitration, labour court).

---

### Key Framework
1. **Participation**: works committees, joint management councils, quality circles, worker directors.
2. **Dispute machinery**: conciliation, arbitration (voluntary), adjudication (labourt tribunal/court), collective bargaining.
3. **Retention drivers**: competitive pay, growth, recognition, work-life balance, leadership quality; costs of turnover: replacement, training, lost productivity.
4. **Exit management**: exit interviews, notice period, full-and-final settlement; engagement surveys (eNPS).

---

### Exam Focus
**Conciliation vs adjudication**: conciliation is a mediation attempt by a government officer; adjudication is binding decision by a labour court/tribunal.

![Employee Relations Diagram](employee-relations.png)`,
            formulas: [
              { id: 'formula-hrm-mod5-employee-relations-retention-1', label: 'Turnover cost', formula: 'Cost of turnover = Replacement + Training + Lost productivity cost', exampleQ: 'Replacement Rs 50k, training Rs 30k, productivity loss Rs 20k.', exampleA: 'Total = Rs 1 lakh per exit.' },
              { id: 'formula-hrm-mod5-employee-relations-retention-2', label: 'Retrenchment condition', formula: 'Retrenchment needs 1 month notice plus 15 days wages per year of service (Section 25F).', exampleQ: 'Worker on Rs 30,000, 8 years.', exampleA: 'Notice + gratuity-style compensation = 15/30 x 30,000 x 8 = Rs 1,20,000.' },
            ],
            tricks: [
              { id: 'trick-hrm-mod5-employee-relations-retention-1', title: 'Participation ladder', trick: 'Works committee (grievances) to JMC (policy) to worker director (board): rising involvement.', whenToUse: 'Match the level to the body.' },
              { id: 'trick-hrm-mod5-employee-relations-retention-2', title: 'eNPS', trick: 'eNPS = % promoters minus % detractors from engagement surveys.', whenToUse: 'Retention metric questions.' },
            ],
            howToSolve: [
              { id: 'solve-hrm-mod5-employee-relations-retention-1', step: 'Step 1: classify the issue: grievance, dispute, or turnover problem', detail: 'classify the issue: grievance, dispute, or turnover problem.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-hrm-mod5-employee-relations-retention-2', step: 'Step 2: for disputes, walk the legal route (conciliation, arbitration, adjudi...', detail: 'for disputes, walk the legal route (conciliation, arbitration, adjudication) with the correct body.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-hrm-mod5-employee-relations-retention-3', step: 'Step 3: for retention, compute the cost of losing an employee and recommend t...', detail: 'for retention, compute the cost of losing an employee and recommend two evidence-based interventions.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-hrm-mod5-employee-relations-retention-4', step: 'Step 4: close with the participative mechanism that fits the scenario', detail: 'close with the participative mechanism that fits the scenario.', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'mgmt-mod1-financial-statement-analysis', subjectId: 'bba-karnataka-mgmt-accounting', title: 'Financial Statement Analysis', moduleNumber: 1, moduleName: 'Module 1: Financial Statement Analysis', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mgmt-01', 'q-mgmt-02'], subtopics: [
        'Financial Statements: Meaning & Types',
        'Comparative & Common Size Statements',
        'Trend Analysis',
        'Ratio Analysis: Liquidity, Solvency, Profitability',
        'DuPont Analysis'
      ], explanationMd: `# Financial Statement Analysis

### Core Concept
Analysis of the **balance sheet and P&L** to judge profitability, liquidity, solvency and efficiency. Tools: ratio analysis, comparative statements, common-size statements and trend analysis. Users: investors (returns), creditors (liquidity), management (control), regulators.

---

### Key Framework
1. **Liquidity**: Current ratio = CA/CL (ideal 2:1); Quick ratio = (CA minus Inventory)/CL (ideal 1:1).
2. **Leverage**: Debt-equity = Total debt/Equity; Interest coverage = EBIT/Interest.
3. **Profitability**: Net profit margin = Net profit/Sales x 100; ROE = PAT/Equity; EPS = PAT minus Preference dividend / Equity shares.
4. **Activity/efficiency**: Stock turnover = COGS/Average stock; Debtors turnover = Credit sales/Average debtors.

---

### Exam Focus
**Current vs quick ratio**: quick ratio strips inventory because it is the least liquid current asset.

![Ratio Analysis Diagram](ratio-analysis.png)`,
            formulas: [
              { id: 'formula-mgmt-mod1-financial-statement-analysis-1', label: 'Current ratio', formula: 'CR = Current assets / Current liabilities', exampleQ: 'CA Rs 6 lakh, CL Rs 3 lakh.', exampleA: 'CR = 2:1.' },
              { id: 'formula-mgmt-mod1-financial-statement-analysis-2', label: 'ROE', formula: 'ROE = PAT / Shareholders equity x 100', exampleQ: 'PAT Rs 2 lakh, equity Rs 10 lakh.', exampleA: 'ROE = 20%.' },
            ],
            tricks: [
              { id: 'trick-mgmt-mod1-financial-statement-analysis-1', title: 'DuPont view', trick: 'ROE = Net margin x Asset turnover x Equity multiplier.', whenToUse: 'Decomposition questions.' },
              { id: 'trick-mgmt-mod1-financial-statement-analysis-2', title: 'Window dressing', trick: 'Year-end CA/CL shifts can flatter ratios; read 2 years together.', whenToUse: 'Analytical answers earn marks.' },
            ],
            howToSolve: [
              { id: 'solve-mgmt-mod1-financial-statement-analysis-1', step: 'Step 1: pick the ratio family asked (liquidity/solvency/profitability/activity)', detail: 'pick the ratio family asked (liquidity/solvency/profitability/activity).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mgmt-mod1-financial-statement-analysis-2', step: 'Step 2: pull the figures from the statements (use averages for turnover ratios)', detail: 'pull the figures from the statements (use averages for turnover ratios).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mgmt-mod1-financial-statement-analysis-3', step: 'Step 3: compute and compare with the ideal (2:1, 1:1) or industry benchmark', detail: 'compute and compare with the ideal (2:1, 1:1) or industry benchmark.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mgmt-mod1-financial-statement-analysis-4', step: 'Step 4: write a one-line interpretation: what it says about the firm and one...', detail: 'write a one-line interpretation: what it says about the firm and one caution.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'mgmt-mod2-fund-flow-cash-flow', subjectId: 'bba-karnataka-mgmt-accounting', title: 'Fund Flow & Cash Flow Statement', moduleNumber: 2, moduleName: 'Module 2: Fund Flow & Cash Flow', order: 2, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mgmt-03', 'q-mgmt-04'], subtopics: [
        'Fund Flow Statement: Meaning & Preparation',
        'Cash Flow Statement: AS-3',
        'Operating, Investing, Financing Activities',
        'Direct vs Indirect Method',
        'Fund Flow vs Cash Flow'
      ], explanationMd: `# Fund Flow & Cash Flow Statement

### Core Concept
**Fund flow** tracks changes in working capital between two balance sheet dates (sources vs applications). **Cash flow (AS-3)** tracks actual cash movement in three activities: operating, investing, financing. Funds flow uses accrual data; cash flow is strictly cash-based, and the direct and indirect methods reconcile to the same closing cash.

---

### Key Framework
1. **Fund flow**: Sources: issue of shares/debentures, sale of fixed assets, profit from operations. Applications: redemption, asset purchase, dividend, tax.
2. **Cash flow operating (indirect)**: Start with PAT, add back non-cash items (depreciation, goodwill amortisation), add losses/minus gains on asset sale, adjust working capital changes (increase in CA = outflow).
3. **Investing**: purchase/sale of assets, investments, interest/dividend received. **Financing**: shares/debentures issued/redeemed, dividend paid, tax.
4. **AS-3 scope**: excludes cash equivalents like marketable securities.

---

### Exam Focus
**Increase in current asset = cash outflow; increase in current liability = cash inflow** in the operating section.

![Fund Flow and Cash Flow Diagram](fund-flow-cash-flow.png)`,
            formulas: [
              { id: 'formula-mgmt-mod2-fund-flow-cash-flow-1', label: 'Cash flow indirect', formula: 'Net operating cash = PAT + Non-cash charges + Losses minus Gains plus Decrease in CA plus Increase in CL', exampleQ: 'PAT Rs 50k, depreciation Rs 10k, debtors up Rs 5k.', exampleA: 'Operating cash = 50k + 10k minus 5k = Rs 55k.' },
              { id: 'formula-mgmt-mod2-fund-flow-cash-flow-2', label: 'Change in funds', formula: 'Change in working capital = Change in current assets minus change in current liabilities', exampleQ: 'CA +Rs 20k, CL +Rs 8k.', exampleA: 'WC increases by Rs 12k (funds applied).' },
            ],
            tricks: [
              { id: 'trick-mgmt-mod2-fund-flow-cash-flow-1', title: 'Debtors rule', trick: 'Increase in debtors means sales booked but cash not received: subtract it.', whenToUse: 'Adjustment traps.' },
              { id: 'trick-mgmt-mod2-fund-flow-cash-flow-2', title: 'Preliminary expenses', trick: 'Writing off intangibles is a non-cash add-back in the operating section.', whenToUse: 'Adjustment questions.' },
            ],
            howToSolve: [
              { id: 'solve-mgmt-mod2-fund-flow-cash-flow-1', step: 'Step 1: for fund flow, prepare a change-in-working-capital schedule from two...', detail: 'for fund flow, prepare a change-in-working-capital schedule from two balance sheets.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mgmt-mod2-fund-flow-cash-flow-2', step: 'Step 2: classify each change into source or application', detail: 'classify each change into source or application.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mgmt-mod2-fund-flow-cash-flow-3', step: 'Step 3: for cash flow, start PAT, add non-cash items, reverse asset-sale gain...', detail: 'for cash flow, start PAT, add non-cash items, reverse asset-sale gains/losses.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mgmt-mod2-fund-flow-cash-flow-4', step: 'Step 4: adjust working capital movements, then list investing and financing f...', detail: 'adjust working capital movements, then list investing and financing flows; reconcile the opening and closing cash.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'mgmt-mod4-budgetary-control', subjectId: 'bba-karnataka-mgmt-accounting', title: 'Budgetary Control', moduleNumber: 4, moduleName: 'Module 4: Budgetary Control', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mgmt-05', 'q-mgmt-06'], subtopics: [
        'Budget: Meaning & Types',
        'Fixed vs Flexible Budget',
        'Zero-Based Budgeting',
        'Cash Budget',
        'Production Budget'
      ], explanationMd: `# Budgetary Control

### Core Concept
A **budget** is a quantitative plan for a period; **budgetary control** is setting budgets, comparing with actuals, computing variances and correcting action. Types: sales (starting point), production, material, labour, cash, flexible budgets. Zero-based budgeting justifies every rupee from zero each year.

---

### Key Framework
1. **Preparation flow**: sales budget to production budget to material/labour/overhead budgets to master budget to cash budget.
2. **Flexible budget**: adjusts for activity level: variable costs scale per unit; fixed costs stay total. Formula: Budgeted cost = Fixed cost + (Variable rate x Actual units).
3. **ZBB**: every activity justified from scratch; useful for discretionary costs.
4. **Advantages**: coordination, cost consciousness, delegation; limitations: rigidity, gaming (budget padding), time cost.

---

### Exam Focus
**Fixed vs flexible budget**: fixed is one activity level; flexible restates costs for the actual level, isolating true efficiency.

![Budgetary Control Diagram](budgetary-control.png)`,
            formulas: [
              { id: 'formula-mgmt-mod4-budgetary-control-1', label: 'Flexible budget', formula: 'Total cost = Fixed cost + (Variable cost per unit x Actual output)', exampleQ: 'Fixed Rs 50,000; variable Rs 20/unit; actual 3,000 units.', exampleA: 'Budget = 50,000 + 60,000 = Rs 1,10,000.' },
              { id: 'formula-mgmt-mod4-budgetary-control-2', label: 'Cash budget', formula: 'Closing cash = Opening cash + Receipts minus Payments', exampleQ: 'Open Rs 40k; receipts Rs 1.2L; payments Rs 1.1L.', exampleA: 'Closing cash = Rs 50k.' },
            ],
            tricks: [
              { id: 'trick-mgmt-mod4-budgetary-control-1', title: 'Master order', trick: 'Sales budget is the cornerstone; everything else derives from it.', whenToUse: 'Process sequence questions.' },
              { id: 'trick-mgmt-mod4-budgetary-control-2', title: 'Budget padding', trick: 'Managers inflate estimates to create slack: a known limitation.', whenToUse: 'Discussion answers.' },
            ],
            howToSolve: [
              { id: 'solve-mgmt-mod4-budgetary-control-1', step: 'Step 1: start from the sales budget and derive production, then material/labo...', detail: 'start from the sales budget and derive production, then material/labour/overheads.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mgmt-mod4-budgetary-control-2', step: 'Step 2: build the cash budget month by month (receipts, payments, opening/clo...', detail: 'build the cash budget month by month (receipts, payments, opening/closing).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mgmt-mod4-budgetary-control-3', step: 'Step 3: for flexible budget problems, separate fixed and variable elements an...', detail: 'for flexible budget problems, separate fixed and variable elements and restate for actual output.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mgmt-mod4-budgetary-control-4', step: 'Step 4: compute variances (budget minus actual) and recommend corrective action', detail: 'compute variances (budget minus actual) and recommend corrective action.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'mgmt-mod5-marginal-costing-decision-making', subjectId: 'bba-karnataka-mgmt-accounting', title: 'Marginal Costing & Decision Making', moduleNumber: 5, moduleName: 'Module 5: Marginal Costing', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-mgmt-07', 'q-mgmt-08'], subtopics: [
        'Marginal Costing: Concept',
        'Contribution & P/V Ratio',
        'Break-Even Point',
        'Margin of Safety',
        'Cost-Volume-Profit Analysis'
      ], explanationMd: `# Marginal Costing & Decision Making

### Core Concept
**Marginal costing** treats only variable costs as product costs; fixed costs are period costs. Contribution = Sales minus Variable cost. **Break-even point** is where contribution equals fixed cost. Managers use it for make-or-buy, key factor, pricing and shut-down decisions.

---

### Key Framework
1. **Contribution**: C = S minus V per unit; P/V ratio = C/S x 100.
2. **BEP**: BEP (units) = Fixed cost / C per unit; BEP (value) = Fixed cost / P/V ratio.
3. **Margin of safety** = Actual sales minus BEP sales; MOS% = MOS/Actual sales x 100.
4. **Decision rules**: accept an order if contribution is positive and capacity is idle; make-or-buy: compare variable cost with purchase price; key factor: rank by contribution per limiting factor.

---

### Exam Focus
**Absorption vs marginal costing**: profit differs when production differs from sales because absorption defers fixed overheads into closing stock.

![Marginal Costing Diagram](break-even-analysis.png)`,
            formulas: [
              { id: 'formula-mgmt-mod5-marginal-costing-decision-making-1', label: 'BEP units', formula: 'BEP = Fixed cost / (Selling price minus Variable cost per unit)', exampleQ: 'FC Rs 60,000; SP Rs 50; VC Rs 30.', exampleA: 'BEP = 60,000 / 20 = 3,000 units.' },
              { id: 'formula-mgmt-mod5-marginal-costing-decision-making-2', label: 'P/V ratio', formula: 'P/V ratio = Contribution / Sales x 100', exampleQ: 'Sales Rs 2L, VC Rs 1.2L.', exampleA: 'P/V = 80,000/2,00,000 x 100 = 40%.' },
            ],
            tricks: [
              { id: 'trick-mgmt-mod5-marginal-costing-decision-making-1', title: 'C/S quick', trick: 'P/V ratio = (Sales minus Variable cost)/Sales; also = Contribution per unit / SP per unit.', whenToUse: 'All BEP value questions.' },
              { id: 'trick-mgmt-mod5-marginal-costing-decision-making-2', title: 'Key factor ranking', trick: 'Rank products by contribution per unit of the scarce resource, not by contribution per unit.', whenToUse: 'Limiting-factor decisions.' },
            ],
            howToSolve: [
              { id: 'solve-mgmt-mod5-marginal-costing-decision-making-1', step: 'Step 1: split costs into fixed and variable; compute contribution per unit', detail: 'split costs into fixed and variable; compute contribution per unit.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mgmt-mod5-marginal-costing-decision-making-2', step: 'Step 2: compute P/V ratio and BEP (units and value)', detail: 'compute P/V ratio and BEP (units and value).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mgmt-mod5-marginal-costing-decision-making-3', step: 'Step 3: build the profit statement: Contribution minus Fixed cost = Profit', detail: 'build the profit statement: Contribution minus Fixed cost = Profit.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-mgmt-mod5-marginal-costing-decision-making-4', step: 'Step 4: for decisions (special order, make-or-buy, product mix), compare incr...', detail: 'for decisions (special order, make-or-buy, product mix), compare incremental contribution and state the recommendation.', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'tax1-mod1-basic-concepts-residential-status', subjectId: 'bba-karnataka-income-tax-1', title: 'Basic Concepts & Residential Status', moduleNumber: 1, moduleName: 'Module 1: Basic Concepts', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-tax1-01', 'q-tax1-02'], subtopics: [
        'Income Tax: Meaning & Features',
        'Assessment Year vs Previous Year',
        'Residential Status: Individual',
        'Residential Status: HUF & Company',
        'Tax Incidence'
      ], explanationMd: `# Basic Concepts & Residential Status

### Core Concept
Income tax is charged on the **total income** of every person whose status is Resident and Ordinarily Resident (ROR), Resident but Not Ordinarily Resident (RNOR), or Non-Resident (NR). Residential status, not citizenship, decides the scope of taxable income. The Finance Act rules use the number of days of stay in India.

---

### Key Framework
1. **Section 6 conditions**: Resident if in India 182+ days in the previous year, OR 60+ days this year plus 365+ days in the preceding 4 years (exceptions for citizens/OCI on leave or crew).
2. **RNOR**: additionally: non-resident in 9 of the preceding 10 years, OR stay under 730 days in the preceding 7 years.
3. **Scope**: ROR: global income; RNOR: Indian income plus income from business/foreign sources controlled from India; NR: Indian-source income only.
4. **Assessment year vs previous year**: income earned in the PY (1 Apr to 31 Mar) is assessed in the AY.

---

### Exam Focus
**Deemed resident (Section 6(1A))**: Indian citizens with total income over Rs 15 lakh (other than foreign-source) are deemed RNOR if not liable to tax elsewhere.

![Residential Status Diagram](residential-status.png)`,
            formulas: [
              { id: 'formula-tax1-mod1-basic-concepts-residential-status-1', label: 'Day count', formula: 'Resident if stay in India >= 182 days in the PY, or >= 60 days in PY plus >= 365 days in preceding 4 years', exampleQ: 'Stay 200 days in the PY.', exampleA: 'Resident; then test RNOR conditions.' },
              { id: 'formula-tax1-mod1-basic-concepts-residential-status-2', label: 'Scope of income', formula: 'ROR: global income taxable; NR: only Indian income; RNOR: Indian income plus foreign business income controlled from India', exampleQ: 'RNOR with UK rental income.', exampleA: 'UK rent is not taxable in India; Indian salary is.' },
            ],
            tricks: [
              { id: 'trick-tax1-mod1-basic-concepts-residential-status-1', title: '182 first', trick: 'Test the 182-day condition first; only if it fails, apply the 60/365 rule.', whenToUse: 'Saves exam time.' },
              { id: 'trick-tax1-mod1-basic-concepts-residential-status-2', title: 'PY vs AY', trick: 'PY 2025-26 income is assessed in AY 2026-27; never mix the two years.', whenToUse: 'Common error trap.' },
            ],
            howToSolve: [
              { id: 'solve-tax1-mod1-basic-concepts-residential-status-1', step: 'Step 1: compute days of stay in India in the previous year', detail: 'compute days of stay in India in the previous year.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax1-mod1-basic-concepts-residential-status-2', step: 'Step 2: apply Section 6(1)(a) or (b) to fix Resident/Non-Resident', detail: 'apply Section 6(1)(a) or (b) to fix Resident/Non-Resident.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax1-mod1-basic-concepts-residential-status-3', step: 'Step 3: if Resident, test RNOR conditions (9/10 years rule and 730-day rule)', detail: 'if Resident, test RNOR conditions (9/10 years rule and 730-day rule).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax1-mod1-basic-concepts-residential-status-4', step: 'Step 4: map each income item to its scope (global vs Indian-source) and concl...', detail: 'map each income item to its scope (global vs Indian-source) and conclude what is taxable.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'tax1-mod4-computation-total-income', subjectId: 'bba-karnataka-income-tax-1', title: 'Computation of Total Income & Tax Liability', moduleNumber: 4, moduleName: 'Module 4: Computation of Total Income', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-tax1-03', 'q-tax1-04'], subtopics: [
        'Gross Total Income',
        'Deductions under Chapter VI-A',
        'Total Income',
        'Tax Liability & Rebates',
        'Advance Tax & TDS'
      ], explanationMd: `# Computation of Total Income & Tax Liability

### Core Concept
Total income is computed under five heads: **Salaries, House Property, Business or Profession, Capital Gains, Other Sources**, after clubbing, set-off and carry-forward of losses, and Chapter VI-A deductions (Sections 80C to 80U). Tax is then charged at slab rates with cess and rebate.

---

### Key Framework
1. **Order of set-off**: inter-head set-off first (e.g. house property loss up to Rs 2 lakh against other heads), then intra-head; carry forward unabsorbed losses for 8 years (business loss).
2. **Deductions**: 80C (Rs 1.5 lakh: PPF, LIC, ELSS, tuition fees), 80CCD(1B) NPS Rs 50,000, 80D health insurance, 80TTA/TTB interest deduction.
3. **Rebate (new regime)**: Section 87A: taxable income up to Rs 7 lakh gets full rebate; marginal relief near the limit.
4. **Cess**: 4% health and education cess on tax; surcharge on income above Rs 50 lakh.

---

### Exam Focus
**Gross total income vs total income**: deductions under Chapter VI-A are subtracted from GTI to get total income.

![Total Income Diagram](total-income.png)`,
            formulas: [
              { id: 'formula-tax1-mod4-computation-total-income-1', label: 'Total income', formula: 'Total income = Gross total income minus Chapter VI-A deductions', exampleQ: 'GTI Rs 9L; 80C Rs 1.5L, 80D Rs 25k.', exampleA: 'Total income = 9L minus 1.75L = Rs 7.25L.' },
              { id: 'formula-tax1-mod4-computation-total-income-2', label: 'Tax liability', formula: 'Tax = Slab tax + Surcharge minus Rebate, then add 4% cess', exampleQ: 'Tax Rs 50,000 after rebate.', exampleA: 'Payable = 50,000 x 1.04 = Rs 52,000.' },
            ],
            tricks: [
              { id: 'trick-tax1-mod4-computation-total-income-1', title: 'House property cap', trick: 'Loss from house property set off against other heads is capped at Rs 2 lakh a year.', whenToUse: 'Loss-set-off questions.' },
              { id: 'trick-tax1-mod4-computation-total-income-2', title: '80C ceiling', trick: '80C plus 80CCD(1B) combined planning: Rs 1.5L + Rs 50k NPS.', whenToUse: 'Deduction planning answers.' },
            ],
            howToSolve: [
              { id: 'solve-tax1-mod4-computation-total-income-1', step: 'Step 1: compute income under each of the five heads with prescribed rules (st...', detail: 'compute income under each of the five heads with prescribed rules (standard deduction for salary, 30% net value for house property).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax1-mod4-computation-total-income-2', step: 'Step 2: club incomes and set off losses: inter-head then intra-head, respecti...', detail: 'club incomes and set off losses: inter-head then intra-head, respecting the Rs 2 lakh house-property cap.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax1-mod4-computation-total-income-3', step: 'Step 3: apply Chapter VI-A deductions to get total income', detail: 'apply Chapter VI-A deductions to get total income.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax1-mod4-computation-total-income-4', step: 'Step 4: apply slab rates, rebate 87A, surcharge and 4% cess', detail: 'apply slab rates, rebate 87A, surcharge and 4% cess.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'tax1-mod5-tax-planning-avoidance-evasion', subjectId: 'bba-karnataka-income-tax-1', title: 'Tax Planning, Avoidance & Evasion', moduleNumber: 5, moduleName: 'Module 5: Tax Planning', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-tax1-05', 'q-tax1-06'], subtopics: [
        'Tax Planning: Meaning & Objectives',
        'Tax Avoidance vs Tax Evasion',
        'Legitimate Tax Planning Tools',
        'Tax Holiday & Exemptions',
        'Penalties for Tax Evasion'
      ], explanationMd: `# Tax Planning, Avoidance & Evasion

### Core Concept
**Tax planning** uses lawful provisions to minimise tax (investing under 80C, choosing the right regime, timing income). **Tax avoidance** exploits loopholes within the letter but against the spirit (aggressive structuring; GAAR can strike it down). **Tax evasion** is illegal concealment (suppressing income, fake claims): punishable with penalty and prosecution.

---

### Key Framework
1. **Planning areas**: investment planning (80C/80D/80CCD), retirement planning (NPS, pension), remuneration planning (HRA, LTA), timing of income and capital gains (indexation, holding period).
2. **Avoidance**: treaty shopping, shell structures, misuse of exemptions; anti-avoidance: GAAR (Sections 95-102), transfer pricing, POEM.
3. **Evasion**: concealment, falsification, non-filing; consequences: penalty up to 200% of tax, prosecution, interest under 234A/B/C.
4. **Ethics**: legitimate planning versus evasion boundary: the taxpayer may choose the least-taxed lawful path (accepted in CIT v A Raman).

---

### Exam Focus
**Avoidance vs evasion**: avoidance is legal-but-aggressive (taxed via GAAR recharacterisation); evasion is a criminal offence.

![Tax Planning Diagram](tax-planning.png)`,
            formulas: [
              { id: 'formula-tax1-mod5-tax-planning-avoidance-evasion-1', label: 'Savings example', formula: 'Tax saved = Deduction amount x Marginal tax rate', exampleQ: 'Invest Rs 1.5L under 80C at 30% slab.', exampleA: 'Tax saved = Rs 45,000.' },
              { id: 'formula-tax1-mod5-tax-planning-avoidance-evasion-2', label: 'Penalty for concealment', formula: 'Penalty = 50% to 200% of tax sought to be evaded (Section 270A)', exampleQ: 'Tax evaded Rs 1L.', exampleA: 'Penalty Rs 50,000 to Rs 2L plus tax and interest.' },
            ],
            tricks: [
              { id: 'trick-tax1-mod5-tax-planning-avoidance-evasion-1', title: 'GAAR test', trick: 'GAAR applies only to impermissible avoidance arrangements (tax benefit main purpose + lacking commercial substance).', whenToUse: 'Case-study framing.' },
              { id: 'trick-tax1-mod5-tax-planning-avoidance-evasion-2', title: 'Holding period', trick: 'Listed equity: 12 months for long-term; unlisted/property: 24 months (pre-budget rates).', whenToUse: 'Capital gains planning.' },
            ],
            howToSolve: [
              { id: 'solve-tax1-mod5-tax-planning-avoidance-evasion-1', step: 'Step 1: classify the action as planning, avoidance or evasion with the defini...', detail: 'classify the action as planning, avoidance or evasion with the defining test (lawful, loophole, illegal).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax1-mod5-tax-planning-avoidance-evasion-2', step: 'Step 2: for planning problems, quantify the tax saved (deduction x marginal r...', detail: 'for planning problems, quantify the tax saved (deduction x marginal rate).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax1-mod5-tax-planning-avoidance-evasion-3', step: 'Step 3: for avoidance, explain GAAR and the recharacterisation power', detail: 'for avoidance, explain GAAR and the recharacterisation power.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax1-mod5-tax-planning-avoidance-evasion-4', step: 'Step 4: for evasion, list consequences: tax, interest, penalty, prosecution', detail: 'for evasion, list consequences: tax, interest, penalty, prosecution.', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'ops-mod1-production-operations-intro', subjectId: 'bba-karnataka-operations-mgmt', title: 'Introduction to Production & Operations Management', moduleNumber: 1, moduleName: 'Module 1: Operations Foundations', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ops-01b', 'q-ops-02'], subtopics: [
        'Operations Management: Meaning & Scope',
        'Production vs Operations Management',
        'Types of Production Systems',
        'Plant Location & Layout',
        'Operations Strategy'
      ], explanationMd: `# Introduction to Production & Operations Management

### Core Concept
**POM** designs and controls the process that transforms inputs (men, material, machine, money, method) into outputs (goods/services). Decisions span product design, process choice, capacity, layout, location, quality and scheduling. The operations strategy must align with corporate strategy; Karnataka clusters (Bengaluru IT, Hubballi foundries) illustrate location and process choices.

---

### Key Framework
1. **Systems view**: Input to Transformation to Output, with feedback control loops.
2. **Process types**: job, batch, mass, continuous; service processes differ (intangibility, simultaneity).
3. **Operations decisions**: product, process, capacity, inventory, quality, scheduling (the structural and infrastructural layers).
4. **Productivity**: Output / Input; partial (labour) versus total factor productivity. Competitiveness: cost, quality, delivery speed/reliability, flexibility.

---

### Exam Focus
**Goods vs services**: services are intangible, inseparable, perishable and heterogeneous: operations design changes accordingly.

![POM Introduction Diagram](pom-intro.png)`,
            formulas: [
              { id: 'formula-ops-mod1-production-operations-intro-1', label: 'Productivity', formula: 'Productivity = Output / Input', exampleQ: 'Output 500 units using 250 labour hours.', exampleA: 'Labour productivity = 2 units/hour.' },
              { id: 'formula-ops-mod1-production-operations-intro-2', label: 'Break-even volume for capacity', formula: 'BEP units = Fixed cost / (Price minus Variable cost per unit)', exampleQ: 'FC Rs 2L, price Rs 100, VC Rs 60.', exampleA: 'BEP = 2,00,000/40 = 5,000 units.' },
            ],
            tricks: [
              { id: 'trick-ops-mod1-production-operations-intro-1', title: 'Transformation shorthand', trick: 'POM = Input to Transformation to Output with feedback; every operations question maps to a stage.', whenToUse: 'Framework answers.' },
              { id: 'trick-ops-mod1-production-operations-intro-2', title: 'Process match', trick: 'Job (custom), batch (small runs), mass (standard), continuous (flow: chemicals/power).', whenToUse: 'Matching MCQs.' },
            ],
            howToSolve: [
              { id: 'solve-ops-mod1-production-operations-intro-1', step: 'Step 1: frame the system: inputs, transformation, outputs', detail: 'frame the system: inputs, transformation, outputs.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ops-mod1-production-operations-intro-2', step: 'Step 2: classify the process type and note its trade-offs (flexibility vs cost)', detail: 'classify the process type and note its trade-offs (flexibility vs cost).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ops-mod1-production-operations-intro-3', step: 'Step 3: address the decision area asked (capacity, layout, quality, schedulin...', detail: 'address the decision area asked (capacity, layout, quality, scheduling) with the right tool.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ops-mod1-production-operations-intro-4', step: 'Step 4: quantify productivity or BEP where numbers appear and link to competi...', detail: 'quantify productivity or BEP where numbers appear and link to competitiveness.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'ops-mod3-inventory-management', subjectId: 'bba-karnataka-operations-mgmt', title: 'Inventory Management', moduleNumber: 3, moduleName: 'Module 3: Inventory Management', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ops-03', 'q-ops-04'], subtopics: [
        'Inventory: Meaning & Types',
        'EOQ Model',
        'ABC Analysis',
        'JIT & Lean Inventory',
        'Safety Stock & Reorder Level'
      ], explanationMd: `# Inventory Management

### Core Concept
**Inventory** buffers supply and demand: raw material, WIP, finished goods, spares. Costs: ordering, carrying and shortage. The aim: minimise total cost while avoiding stock-outs. Tools: EOQ, reorder levels, ABC/FSN/VED analysis, just-in-time. Karnataka agri-supply chains (Nandini milk distribution) show why cycle and safety stock matter.

---

### Key Framework
1. **EOQ**: economic order quantity minimises ordering plus carrying cost: EOQ = Square root of (2 x Annual demand x Ordering cost / Carrying cost per unit).
2. **Total cost at EOQ**: TC = Purchase + Ordering + Carrying; at EOQ, ordering cost = carrying cost.
3. **Stock levels**: Minimum = safety stock; Maximum = Minimum + Re-order quantity; Re-order level = Minimum + lead-time usage.
4. **ABC analysis**: A items (10% items, 70% value) get tight control; JIT reduces inventory to need-based flow.

---

### Exam Focus
**Ordering vs carrying cost**: as order size rises, ordering cost falls but carrying cost rises; EOQ is the balance point.

![Inventory Management Diagram](org-structure.png)`,
            formulas: [
              { id: 'formula-ops-mod3-inventory-management-1', label: 'EOQ', formula: 'EOQ = Square root of (2 D O / C)', exampleQ: 'D = 10,000 units, O = Rs 50/order, C = Rs 2/unit/year.', exampleA: 'EOQ = Square root of (2 x 10000 x 50 / 2) = 707 units.' },
              { id: 'formula-ops-mod3-inventory-management-2', label: 'Total inventory cost', formula: 'TC = (D/Q) x O + (Q/2) x C + D x Unit price', exampleQ: 'Q = 707, D = 10,000, O = 50, C = 2.', exampleA: 'Ordering Rs 707 + Carrying Rs 707 = Rs 1,414 + purchase cost.' },
            ],
            tricks: [
              { id: 'trick-ops-mod3-inventory-management-1', title: 'EOQ equality', trick: 'At EOQ, annual ordering cost equals annual carrying cost: use it to verify answers.', whenToUse: 'Self-check trick.' },
              { id: 'trick-ops-mod3-inventory-management-2', title: 'ABC by value', trick: 'A: 70% value/10% items; B: 20/30; C: 10/60: control intensity follows value.', whenToUse: 'Classification questions.' },
            ],
            howToSolve: [
              { id: 'solve-ops-mod3-inventory-management-1', step: 'Step 1: list demand, ordering cost and carrying cost per unit per year', detail: 'list demand, ordering cost and carrying cost per unit per year.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ops-mod3-inventory-management-2', step: 'Step 2: compute EOQ', detail: 'compute EOQ.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ops-mod3-inventory-management-3', step: 'Step 3: compute total cost at the given/EOQ quantity (ordering + carrying + p...', detail: 'compute total cost at the given/EOQ quantity (ordering + carrying + purchase).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ops-mod3-inventory-management-4', step: 'Step 4: compute reorder level with lead-time usage and recommend the stock po...', detail: 'compute reorder level with lead-time usage and recommend the stock policy (Q system or P system).', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'ops-mod4-quality-management', subjectId: 'bba-karnataka-operations-mgmt', title: 'Quality Management & TQM', moduleNumber: 4, moduleName: 'Module 4: Quality Management', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ops-05', 'q-ops-06'], subtopics: [
        'Quality: Meaning & Dimensions',
        'TQM: Principles & Elements',
        'ISO 9000 Series',
        'Quality Control Tools',
        'Six Sigma'
      ], explanationMd: `# Quality Management & TQM

### Core Concept
**Quality** is fitness for use (Juran), conformance to requirements (Crosby). **TQM** is organisation-wide continuous improvement with customer focus, involving every employee. Tools: quality circles, Six Sigma (3.4 defects per million), ISO 9001, Kaizen, 5S, poka-yoke. Quality gurus: Deming (14 points, PDCA), Juran (trilogy), Crosby (zero defects), Ishikawa (fishbone).

---

### Key Framework
1. **TQM pillars**: customer focus, total participation, process approach, continuous improvement, fact-based decisions.
2. **Seven tools**: cause-and-effect (fishbone) diagram, check sheet, histogram, Pareto chart, scatter, control chart, stratification.
3. **Six Sigma DMAIC**: Define, Measure, Analyse, Improve, Control; sigma level measures process capability.
4. **Cost of quality**: prevention, appraisal, internal failure, external failure: prevention and appraisal reduce the failure costs.

---

### Exam Focus
**Inspection vs quality assurance**: inspection detects defects after making; QA builds quality into the process.

![Quality and TQM Diagram](quality-tqm.png)`,
            formulas: [
              { id: 'formula-ops-mod4-quality-management-1', label: 'Six Sigma level', formula: 'DPMO = (Defects / Opportunities) x 1,000,000', exampleQ: '12 defects in 40,000 opportunities.', exampleA: 'DPMO = (12/40000) x 10^6 = 300.' },
              { id: 'formula-ops-mod4-quality-management-2', label: 'Pareto rule', formula: 'Roughly 80% of problems come from 20% of causes: fix the tall bars first.', exampleQ: 'A defect list with 5 causes; top 2 cause 80% of defects.', exampleA: 'Attack the top 2 causes first.' },
            ],
            tricks: [
              { id: 'trick-ops-mod4-quality-management-1', title: 'DMAIC order', trick: 'Define, Measure, Analyse, Improve, Control: the Six Sigma project cycle.', whenToUse: 'Sequence questions.' },
              { id: 'trick-ops-mod4-quality-management-2', title: 'Fishbone categories', trick: '6 Ms: Man, Machine, Material, Method, Measurement, Mother-nature (environment).', whenToUse: 'Root-cause exercises.' },
            ],
            howToSolve: [
              { id: 'solve-ops-mod4-quality-management-1', step: 'Step 1: define the quality problem and its cost-of-quality category (preventi...', detail: 'define the quality problem and its cost-of-quality category (prevention/appraisal/failure).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ops-mod4-quality-management-2', step: 'Step 2: pick the tool: fishbone for root cause, Pareto for vital few, histogr...', detail: 'pick the tool: fishbone for root cause, Pareto for vital few, histogram for distribution, control chart for stability.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ops-mod4-quality-management-3', step: 'Step 3: apply TQM or Six Sigma steps (DMAIC) as the improvement route', detail: 'apply TQM or Six Sigma steps (DMAIC) as the improvement route.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ops-mod4-quality-management-4', step: 'Step 4: measure effect (DPMO, defect rate) and standardise via control plans', detail: 'measure effect (DPMO, defect rate) and standardise via control plans.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'ops-mod5-supply-chain-logistics', subjectId: 'bba-karnataka-operations-mgmt', title: 'Supply Chain & Logistics Management', moduleNumber: 5, moduleName: 'Module 5: Supply Chain & Logistics', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ops-07', 'q-ops-08'], subtopics: [
        'Supply Chain: Meaning & Components',
        'Logistics: Meaning & Functions',
        'Procurement & Vendor Management',
        'Warehousing & Distribution',
        'Reverse Logistics'
      ], explanationMd: `# Supply Chain & Logistics Management

### Core Concept
A **supply chain** links suppliers, manufacturers, distributors, retailers and customers with flows of material, information and money. Logistics covers transportation, warehousing, inventory and order fulfilment. Objectives: minimise cost while maximising service level; the bullwhip effect shows how demand distortion amplifies upstream.

---

### Key Framework
1. **Flows**: product (upstream to downstream), information (both ways), cash (downstream to upstream).
2. **Bullwhip effect**: small demand swings at retail grow into large swings at raw-material level; cures: shared POS data, EDI, VMI, everyday-low-pricing.
3. **Design decisions**: network design, facility location, sourcing (single vs multiple), distribution strategy (direct, cross-docking, milk runs).
4. **Performance**: inventory turns, order fill rate, lead time, total logistics cost; models: QR, ECR, postponement, cross-docking.

---

### Exam Focus
**Push vs pull supply chain**: push produces to forecast (make-to-stock); pull produces to confirmed demand (make-to-order); hybrids use decoupling points.

![Supply Chain Diagram](supply-chain.png)`,
            formulas: [
              { id: 'formula-ops-mod5-supply-chain-logistics-1', label: 'Bullwhip measure', formula: 'Bullwhip ratio = Variance of orders / Variance of demand (greater than 1 means amplification)', exampleQ: 'Order variance 450, demand variance 100.', exampleA: 'Ratio = 4.5: significant distortion.' },
              { id: 'formula-ops-mod5-supply-chain-logistics-2', label: 'Logistics cost share', formula: 'Logistics cost % = Total logistics cost / Sales x 100', exampleQ: 'Cost Rs 12L, sales Rs 1 crore.', exampleA: '12%.' },
            ],
            tricks: [
              { id: 'trick-ops-mod5-supply-chain-logistics-1', title: 'EDI/VMI cure', trick: 'Information sharing (EDI), vendor-managed inventory and stable pricing tame the bullwhip effect.', whenToUse: 'Case-study cures.' },
              { id: 'trick-ops-mod5-supply-chain-logistics-2', title: 'Cross-docking', trick: 'Goods move inbound to outbound with little storage: cuts warehousing and lead time.', whenToUse: 'Distribution design questions.' },
            ],
            howToSolve: [
              { id: 'solve-ops-mod5-supply-chain-logistics-1', step: 'Step 1: map the chain: suppliers to customers with the three flows', detail: 'map the chain: suppliers to customers with the three flows.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ops-mod5-supply-chain-logistics-2', step: 'Step 2: identify the pain point (bullwhip, stock-outs, high logistics cost)', detail: 'identify the pain point (bullwhip, stock-outs, high logistics cost).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ops-mod5-supply-chain-logistics-3', step: 'Step 3: apply the fix: information sharing, network redesign, postponement or...', detail: 'apply the fix: information sharing, network redesign, postponement or cross-docking.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ops-mod5-supply-chain-logistics-4', step: 'Step 4: measure with service and cost KPIs (fill rate, turns, total cost %) a...', detail: 'measure with service and cost KPIs (fill rate, turns, total cost %) and justify the design choice.', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'strat-mod1-introduction-strategic-management', subjectId: 'bba-karnataka-strategic-mgmt', title: 'Introduction to Strategic Management', moduleNumber: 1, moduleName: 'Module 1: Strategic Foundations', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-strat-01b', 'q-strat-02'], subtopics: [
        'Strategic Management: Meaning & Process',
        'Vision, Mission & Objectives',
        'Stakeholders & Corporate Governance',
        'Strategic Decision Making',
        'Levels of Strategy'
      ], explanationMd: `# Introduction to Strategic Management

### Core Concept
**Strategy** is the pattern of decisions defining an organisation goals and resource allocation over time (Andrews, Chandler, Mintzberg). Strategic management: environmental scanning (external/internal), strategy formulation, implementation and control. Levels: corporate, business (competitive), functional. Vision and mission set direction; objectives convert it into measurable targets.

---

### Key Framework
1. **Process**: Vision/mission, environmental analysis, strategy formulation, implementation, evaluation/control.
2. **Levels**: corporate (what businesses), business (how to compete), functional (how to support).
3. **Frameworks preview**: SWOT, PESTLE, Porter five forces, BCG, Ansoff, value chain.
4. **Strategic decisions**: long-term, resource-committing, cross-functional, externally driven (Mintzberg: 5 Ps: Plan, Ploy, Pattern, Position, Perspective).

---

### Exam Focus
**Strategy vs tactic**: strategy is long-term and directional; tactics are short-term moves that execute it.

![Strategic Management Process Diagram](strategic-process.png)`,
            formulas: [
              { id: 'formula-strat-mod1-introduction-strategic-management-1', label: 'Ansoff growth', formula: 'Growth vector = Existing/New product x Existing/New market (4 strategies)', exampleQ: 'Existing product in a new market.', exampleA: 'Market development.' },
              { id: 'formula-strat-mod1-introduction-strategic-management-2', label: 'ROI check', formula: 'ROI = Net profit / Investment x 100', exampleQ: 'Profit Rs 5 cr on Rs 50 cr investment.', exampleA: 'ROI = 10%.' },
            ],
            tricks: [
              { id: 'trick-strat-mod1-introduction-strategic-management-1', title: '5 Ps', trick: 'Plan, Ploy, Pattern, Position, Perspective: Mintzberg view of strategy.', whenToUse: 'Definitions in MCQs.' },
              { id: 'trick-strat-mod1-introduction-strategic-management-2', title: 'Hierarchy order', trick: 'Corporate strategy defines scope; business strategy defines advantage; functional strategy executes.', whenToUse: 'Structure questions.' },
            ],
            howToSolve: [
              { id: 'solve-strat-mod1-introduction-strategic-management-1', step: 'Step 1: state vision/mission and objectives', detail: 'state vision/mission and objectives.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-strat-mod1-introduction-strategic-management-2', step: 'Step 2: scan the environment (external: PESTLE/forces; internal: value chain/...', detail: 'scan the environment (external: PESTLE/forces; internal: value chain/resources).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-strat-mod1-introduction-strategic-management-3', step: 'Step 3: formulate at all three levels and pick the growth route (Ansoff/BCG)', detail: 'formulate at all three levels and pick the growth route (Ansoff/BCG).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-strat-mod1-introduction-strategic-management-4', step: 'Step 4: outline implementation (structure, culture, controls) and evaluation...', detail: 'outline implementation (structure, culture, controls) and evaluation (balanced scorecard, budgets).', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'strat-mod3-swot-pestle-analysis', subjectId: 'bba-karnataka-strategic-mgmt', title: 'SWOT & PESTLE Analysis', moduleNumber: 3, moduleName: 'Module 3: Environmental Analysis', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-strat-03', 'q-strat-04'], subtopics: [
        'Environmental Scanning',
        'SWOT Analysis: Strengths, Weaknesses, Opportunities, Threats',
        'PESTLE Analysis: Political, Economic, Social, Technological, Legal, Environmental',
        'Porter’s Five Forces',
        'Competitor Analysis'
      ], explanationMd: `# SWOT & PESTLE Analysis

### Core Concept
**SWOT** pairs internal Strengths and Weaknesses with external Opportunities and Threats: the base for strategy generation. **PESTLE** scans the macro-environment: Political, Economic, Social, Technological, Legal, Environmental. Sound analysis converts lists into matched strategies: SO (use strengths to capture opportunities), WO, ST, WT.

---

### Key Framework
1. **SWOT**: internal: resources, capabilities, brand, cost position; external: market growth, competitor moves, regulation.
2. **PESTLE**: P: policy/taxation; E: inflation/rates; S: demographics/trends; T: automation/digital; L: labour/consumer law; E: sustainability norms.
3. **Matching**: SO: aggressive growth; WO: fix weakness to grab opportunity; ST: defend using strengths; WT: retreat/diversify/risk mitigation.
4. **Use**: launch decisions, entry strategies, turnaround diagnosis; Karnataka example: EV policy boost for auto clusters (opportunity) vs chip shortage (threat).

---

### Exam Focus
**SWOT vs PESTLE**: SWOT covers both internal and external factors; PESTLE only scans the external macro-environment.

![SWOT PESTLE Diagram](swot-analysis.png)`,
            formulas: [
              { id: 'formula-strat-mod3-swot-pestle-analysis-1', label: 'TOWS matrix', formula: 'Strategies = SO, WO, ST, WT pairings of internal and external factors', exampleQ: 'Strength: distribution; Opportunity: export demand.', exampleA: 'SO strategy: push exports via existing distribution.' },
              { id: 'formula-strat-mod3-swot-pestle-analysis-2', label: 'PESTLE coverage', formula: '6 lenses: Political, Economic, Social, Technological, Legal, Environmental', exampleQ: 'Audit a policy change (e.g. GST rate cut).', exampleA: 'Economic (tax) and Political (policy) lenses apply first.' },
            ],
            tricks: [
              { id: 'trick-strat-mod3-swot-pestle-analysis-1', title: 'Internal vs external', trick: 'Strengths/Weaknesses are internal; Opportunities/Threats are external: misclassification loses marks.', whenToUse: 'Classification trap.' },
              { id: 'trick-strat-mod3-swot-pestle-analysis-2', title: 'Quantify lists', trick: 'Rate each factor by impact and likelihood before matching.', whenToUse: 'Turns a list into a decision tool.' },
            ],
            howToSolve: [
              { id: 'solve-strat-mod3-swot-pestle-analysis-1', step: 'Step 1: list internal strengths and weaknesses (resources, capabilities)', detail: 'list internal strengths and weaknesses (resources, capabilities).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-strat-mod3-swot-pestle-analysis-2', step: 'Step 2: list external opportunities and threats (scan PESTLE for macro items)', detail: 'list external opportunities and threats (scan PESTLE for macro items).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-strat-mod3-swot-pestle-analysis-3', step: 'Step 3: build the TOWS matrix and write one strategy per quadrant (SO/WO/ST/WT)', detail: 'build the TOWS matrix and write one strategy per quadrant (SO/WO/ST/WT).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-strat-mod3-swot-pestle-analysis-4', step: 'Step 4: prioritise strategies by impact and feasibility, and state one monito...', detail: 'prioritise strategies by impact and feasibility, and state one monitoring metric.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'strat-mod4-strategy-implementation', subjectId: 'bba-karnataka-strategic-mgmt', title: 'Strategy Implementation & Control', moduleNumber: 4, moduleName: 'Module 4: Strategy Implementation', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-strat-05', 'q-strat-06'], subtopics: [
        'Strategy Implementation: Steps',
        'Resource Allocation',
        'Organisational Structure & Strategy',
        'Strategic Control & Balanced Scorecard',
        'Corrective Action'
      ], explanationMd: `# Strategy Implementation & Control

### Core Concept
A brilliant strategy fails without execution. **Implementation** aligns structure, systems, culture, people and resources; **control** monitors performance and corrects drift. McKinsey 7-S, balanced scorecard and functional plans are standard tools. Barriers: wrong structure, culture mismatch, unclear communication, poor resourcing.

---

### Key Framework
1. **7-S model**: Strategy, Structure, Systems, Style, Staff, Skills, Shared values (the hard three and soft four must align).
2. **Balanced scorecard (Kaplan & Norton)**: Financial, Customer, Internal process, Learning and growth perspectives with objectives, measures and targets.
3. **Control types**: strategic (BSC), operational (budgets, standards), tactical (milestones); feedback and concurrent control.
4. **Structure choices**: functional, divisional, matrix, network: strategy follows structure or vice versa (Chandler: structure follows strategy).

---

### Exam Focus
**Formulation vs implementation**: formulation decides what to do; implementation makes it happen through people, structure and controls.

![Strategy Implementation Diagram](strategy-implementation.png)`,
            formulas: [
              { id: 'formula-strat-mod4-strategy-implementation-1', label: 'BSC perspectives', formula: '4 perspectives: Financial, Customer, Internal Process, Learning and Growth', exampleQ: 'A firm wants customer retention up.', exampleA: 'Customer perspective objective with retention % as the measure.' },
              { id: 'formula-strat-mod4-strategy-implementation-2', label: 'ROI control', formula: 'ROI = Net profit / Investment x 100; compare with target ROI for drift', exampleQ: 'Actual 12% vs target 15%.', exampleA: 'Negative variance of 3 points: corrective action needed.' },
            ],
            tricks: [
              { id: 'trick-strat-mod4-strategy-implementation-1', title: '7-S alignment', trick: 'If shared values and systems disagree with strategy, execution fails: check the soft S first.', whenToUse: 'Case diagnosis.' },
              { id: 'trick-strat-mod4-strategy-implementation-2', title: 'Chandler', trick: 'Structure follows strategy: reorganise after strategic change.', whenToUse: 'One-line theory question.' },
            ],
            howToSolve: [
              { id: 'solve-strat-mod4-strategy-implementation-1', step: 'Step 1: translate the chosen strategy into objectives and a balanced scorecard', detail: 'translate the chosen strategy into objectives and a balanced scorecard.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-strat-mod4-strategy-implementation-2', step: 'Step 2: align the 7-S elements: restructure, retrain, redesign systems', detail: 'align the 7-S elements: restructure, retrain, redesign systems.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-strat-mod4-strategy-implementation-3', step: 'Step 3: build functional plans with budgets and timelines', detail: 'build functional plans with budgets and timelines.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-strat-mod4-strategy-implementation-4', step: 'Step 4: set controls: leading and lagging KPIs, review cadence, and correctiv...', detail: 'set controls: leading and lagging KPIs, review cadence, and corrective actions on variance.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'strat-mod5-corporate-level-strategies', subjectId: 'bba-karnataka-strategic-mgmt', title: 'Corporate Level Strategies', moduleNumber: 5, moduleName: 'Module 5: Corporate Strategies', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-strat-07', 'q-strat-08'], subtopics: [
        'Growth Strategies: Concentration, Integration, Diversification',
        'Stability Strategies',
        'Retrenchment Strategies: Turnaround, Divestment, Liquidation',
        'Portfolio Analysis: BCG Matrix',
        'Mergers & Acquisitions'
      ], explanationMd: `# Corporate Level Strategies

### Core Concept
Corporate strategy answers **which businesses to be in** and how to allocate capital across them. Options: growth (expansion, diversification, integration), stability, retrenchment, and combination. Tools: BCG growth-share matrix (cash cows fund stars/question marks; dogs exit), Ansoff matrix, GE nine-cell, and parenting advantage.

---

### Key Framework
1. **Growth**: intensive (market penetration, development, product development), integrative (forward/backward/horizontal), diversification (concentric/conglomerate).
2. **BCG matrix**: Stars (high growth/high share: invest), Cash Cows (low growth/high share: harvest), Question Marks (high growth/low share: selective), Dogs (low/low: divest).
3. **Retrenchment**: turnaround, divestment, liquidation; stability: pause/profit strategies.
4. **Bases for diversification**: economies of scope, risk reduction, market power; the parenting advantage test decides the corporate centre value.

---

### Exam Focus
**Star vs Cash Cow**: stars need cash to grow; cash cows generate the cash that funds stars and question marks.

![Corporate Level Strategies Diagram](bcg-matrix.png)`,
            formulas: [
              { id: 'formula-strat-mod5-corporate-level-strategies-1', label: 'BCG placement', formula: 'Market share relative to largest competitor; market growth above 10% counts as high', exampleQ: 'Business: share 0.6, growth 14%.', exampleA: 'Question Mark: high growth, low relative share.' },
              { id: 'formula-strat-mod5-corporate-level-strategies-2', label: 'Ansoff cell', formula: 'Growth = Product (existing/new) x Market (existing/new)', exampleQ: 'New product in an existing market.', exampleA: 'Product development.' },
            ],
            tricks: [
              { id: 'trick-strat-mod5-corporate-level-strategies-1', title: 'Dogs decision', trick: 'Dogs: liquidate or divest unless they support another business (linkage).', whenToUse: 'Portfolio cleanup questions.' },
              { id: 'trick-strat-mod5-corporate-level-strategies-2', title: 'Cash cow role', trick: 'Harvest cash cows to fund stars and promising question marks.', whenToUse: 'Portfolio allocation logic.' },
            ],
            howToSolve: [
              { id: 'solve-strat-mod5-corporate-level-strategies-1', step: 'Step 1: classify each business on growth rate and relative market share for t...', detail: 'classify each business on growth rate and relative market share for the BCG matrix.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-strat-mod5-corporate-level-strategies-2', step: 'Step 2: label each SBU (Star/Cow/Question/Dog) and state the resource policy', detail: 'label each SBU (Star/Cow/Question/Dog) and state the resource policy.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-strat-mod5-corporate-level-strategies-3', step: 'Step 3: choose the corporate route for the firm: growth (integration/diversif...', detail: 'choose the corporate route for the firm: growth (integration/diversification), stability or retrenchment, justified with the synergy test.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-strat-mod5-corporate-level-strategies-4', step: 'Step 4: conclude with implementation and control notes', detail: 'conclude with implementation and control notes.', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'gst-mod2-gst-registration-compliance', subjectId: 'bba-karnataka-gst', title: 'GST Registration & Compliance', moduleNumber: 2, moduleName: 'Module 2: GST Registration & Compliance', order: 2, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-gst-01b', 'q-gst-02b'], subtopics: [
        'GST: Meaning & Features',
        'CGST, SGST, IGST, UTGST',
        'Registration: Threshold & Procedure',
        'GST Returns: Types & Due Dates',
        'Input Tax Credit: Eligibility & Conditions'
      ], explanationMd: `# GST Registration & Compliance

### Core Concept
**GST registration** is mandatory for businesses above the turnover threshold (Rs 40 lakh goods / Rs 20 lakh services in most states; Rs 10 lakh in special-category states including parts of the North-East and hill states). Registration is PAN-based, state-wise and GSTIN-coded (15 digits). Compliance includes invoices, e-way bills, returns and record keeping. Karnataka businesses register on the GST portal; GSTIN format: 2-digit state code + PAN + entity + check codes.

---

### Key Framework
1. **Who registers**: suppliers above threshold, e-commerce sellers, interstate suppliers, casual taxable persons, agents; voluntary registration available for input credit.
2. **GSTIN**: 15 characters: 2-digit state code (29 = Karnataka) + 10-digit PAN + entity number + 'Z' + check digit.
3. **Compliance calendar**: invoices within 30 days, e-way bills for goods over Rs 50,000, books kept for 72 months.
4. **Deemed registration**: if the officer does not act within 3 working days of application (REG-06), registration is deemed granted.

---

### Exam Focus
**Casual taxable person**: registers for a limited period (max 90 days) for occasional supplies in a state where there is no fixed place.

![GST Registration Diagram](gst-registration.png)`,
            formulas: [
              { id: 'formula-gst-mod2-gst-registration-compliance-1', label: 'Threshold', formula: 'Registration required when aggregate turnover exceeds Rs 40 lakh (goods) / Rs 20 lakh (services); Rs 10 lakh in special-category states', exampleQ: 'Bengaluru trader with Rs 45 lakh turnover of goods.', exampleA: 'Registration mandatory (Karnataka: Rs 40 lakh goods threshold).' },
              { id: 'formula-gst-mod2-gst-registration-compliance-2', label: 'GSTIN check', formula: 'GSTIN = 2-digit state code + PAN + entity + Z + check digit (15 chars)', exampleQ: 'Karnataka entity of PAN ABCDE1234F.', exampleA: 'Starts with 29ABCDE1234F...' },
            ],
            tricks: [
              { id: 'trick-gst-mod2-gst-registration-compliance-1', title: 'Deemed grant', trick: 'No officer action within 3 working days of REG-06: registration deemed granted.', whenToUse: 'Timeline MCQs.' },
              { id: 'trick-gst-mod2-gst-registration-compliance-2', title: 'E-way bill', trick: 'E-way bill needed for goods movement above Rs 50,000 in value.', whenToUse: 'Logistics compliance questions.' },
            ],
            howToSolve: [
              { id: 'solve-gst-mod2-gst-registration-compliance-1', step: 'Step 1: compute aggregate turnover (taxable + exempt + export, excluding GST)...', detail: 'compute aggregate turnover (taxable + exempt + export, excluding GST) and compare with the state threshold.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-gst-mod2-gst-registration-compliance-2', step: 'Step 2: determine registration type (regular, casual, non-resident, composition)', detail: 'determine registration type (regular, casual, non-resident, composition).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-gst-mod2-gst-registration-compliance-3', step: 'Step 3: list the compliance duties: invoice, e-way bill, returns, records ret...', detail: 'list the compliance duties: invoice, e-way bill, returns, records retention.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-gst-mod2-gst-registration-compliance-4', step: 'Step 4: state consequences of non-registration: no input credit, penalties un...', detail: 'state consequences of non-registration: no input credit, penalties under Section 122.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'gst-mod4-gst-returns-assessment', subjectId: 'bba-karnataka-gst', title: 'GST Returns, Assessment & Audit', moduleNumber: 4, moduleName: 'Module 4: GST Returns & Assessment', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-gst-03', 'q-gst-04'], subtopics: [
        'GSTR-1, GSTR-3B, GSTR-9',
        'Assessment: Self, Provisional, Summary, Best Judgement',
        'Audit under GST',
        'Demand & Recovery',
        'Refund under GST'
      ], explanationMd: `# GST Returns & Assessment

### Core Concept
GST runs on a **self-assessed return chain**: GSTR-1 (outward supplies), GSTR-3B (summary with payment), GSTR-9 (annual). The input tax credit flows only when the supplier files: invoice matching is the backbone. Assessment types: self-assessment, provisional, summary (Section 63), scrutiny, best judgement (Section 64). The GST Council periodically revises return filing frequency (QRMP for small taxpayers).

---

### Key Framework
1. **Returns**: GSTR-1: outward supplies (monthly/QRMP); GSTR-3B: summary return with tax payment; GSTR-9: annual return; GSTR-9C: reconciliation statement (audit for turnover above Rs 5 crore).
2. **ITC matching**: credit appears in GSTR-2B from supplier filings; mismatch blocks credit until corrected.
3. **Assessment**: self (Section 59), provisional (Section 60), scrutiny (Section 61), best judgement (Section 64), summary when non-filers (Section 63).
4. **Interest/late fee**: 18% per annum interest on delayed tax; late fee Rs 50/day (Rs 20/day for nil return), capped.

---

### Exam Focus
**GSTR-1 vs GSTR-3B**: GSTR-1 reports invoices (who you sold to); GSTR-3B is the summary return where tax is actually paid.

![GST Returns Diagram](gst-returns.png)`,
            formulas: [
              { id: 'formula-gst-mod4-gst-returns-assessment-1', label: 'Late fee', formula: 'Late fee = Rs 50 per day of delay (Rs 20 for nil returns), subject to the statutory cap', exampleQ: '10-day delay on a nil GSTR-3B.', exampleA: 'Late fee = 10 x 20 = Rs 200.' },
              { id: 'formula-gst-mod4-gst-returns-assessment-2', label: 'Interest on delay', formula: 'Interest = Tax x 18% x (Days of delay / 365)', exampleQ: 'Tax Rs 30,000 delayed by 30 days.', exampleA: 'Interest = 30000 x 0.18 x 30/365 = Rs 444.' },
            ],
            tricks: [
              { id: 'trick-gst-mod4-gst-returns-assessment-1', title: 'ITC gate', trick: 'Credit flows only when the supplier files: GSTR-2B shows matched credit.', whenToUse: 'ITC questions.' },
              { id: 'trick-gst-mod4-gst-returns-assessment-2', title: 'QRMP', trick: 'Quarterly return with monthly payment for turnover up to Rs 5 crore.', whenToUse: 'Small-taxpayer compliance.' },
            ],
            howToSolve: [
              { id: 'solve-gst-mod4-gst-returns-assessment-1', step: 'Step 1: identify the return due (outward, summary, annual) and the frequency...', detail: 'identify the return due (outward, summary, annual) and the frequency (monthly or QRMP).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-gst-mod4-gst-returns-assessment-2', step: 'Step 2: compute the tax payable with ITC set-off order: IGST, then CGST/SGST...', detail: 'compute the tax payable with ITC set-off order: IGST, then CGST/SGST cross-utilisation rules.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-gst-mod4-gst-returns-assessment-3', step: 'Step 3: apply late fee and interest for any delay', detail: 'apply late fee and interest for any delay.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-gst-mod4-gst-returns-assessment-4', step: 'Step 4: name the assessment route if the return is missing (scrutiny for mism...', detail: 'name the assessment route if the return is missing (scrutiny for mismatch, best judgement for non-filing).', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'gst-mod5-customs-law-basics', subjectId: 'bba-karnataka-gst', title: 'Customs Law: Basics & Procedures', moduleNumber: 5, moduleName: 'Module 5: Customs Law', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-gst-05', 'q-gst-06'], subtopics: [
        'Customs Act: Meaning & Scope',
        'Types of Customs Duty',
        'Valuation under Customs',
        'Import & Export Procedures',
        'Warehousing under Customs'
      ], explanationMd: `# Customs Law Basics

### Core Concept
**Customs duty** governs import and export of goods: levied under the Customs Act 1962, collected at the port/airport. Core ideas: taxable value (CIF + landing charges), duty heads (Basic Customs Duty, IGST, compensation cess, social welfare surcharge), exemptions, and baggage rules. Export duty is rare (refund mechanisms dominate). Bengaluru airport and Mangaluru port handle Karnataka trade.

---

### Key Framework
1. **Duty structure**: BCD (on assessable value), Social Welfare Surcharge (10% on BCD), IGST (on assessable value + BCD + cess), Compensation cess (on notified goods).
2. **Assessable value**: transaction value (CIF: cost, insurance, freight) plus loading/landing charges.
3. **Types of duty**: basic, countervailing (subsumed), anti-dumping, safeguard; exemptions via notifications.
4. **Procedures**: bill of entry (import), shipping bill (export), warehousing, drawback, baggage rules (duty-free allowance).

---

### Exam Focus
**CIF vs FOB**: CIF includes cost, insurance and freight (the customs valuation base); FOB excludes freight and insurance.

![Customs Diagram](customs-basics.png)`,
            formulas: [
              { id: 'formula-gst-mod5-customs-law-basics-1', label: 'Landed value', formula: 'Assessable value = CIF value + Landing charges', exampleQ: 'CIF Rs 1,00,000; landing charges Rs 5,000.', exampleA: 'Assessable value = Rs 1,05,000.' },
              { id: 'formula-gst-mod5-customs-law-basics-2', label: 'Duty stack', formula: 'Total duty = BCD + SWS (10% of BCD) + IGST on (AV + BCD + cess) + cess', exampleQ: 'AV Rs 1,05,000, BCD 20%, IGST 18%.', exampleA: 'BCD = 21,000; SWS = 2,100; IGST on 1,28,100 = 23,058; total = Rs 46,158.' },
            ],
            tricks: [
              { id: 'trick-gst-mod5-customs-law-basics-1', title: 'Bill of entry', trick: 'Import: bill of entry; Export: shipping bill.', whenToUse: 'Document-matching MCQs.' },
              { id: 'trick-gst-mod5-customs-law-basics-2', title: 'Drawback', trick: 'Duty drawback refunds duties paid on inputs when goods are exported.', whenToUse: 'Export relief questions.' },
            ],
            howToSolve: [
              { id: 'solve-gst-mod5-customs-law-basics-1', step: 'Step 1: fix the assessable value (CIF plus landing charges)', detail: 'fix the assessable value (CIF plus landing charges).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-gst-mod5-customs-law-basics-2', step: 'Step 2: compute BCD on assessable value; add social welfare surcharge at 10%...', detail: 'compute BCD on assessable value; add social welfare surcharge at 10% of BCD.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-gst-mod5-customs-law-basics-3', step: 'Step 3: compute IGST on assessable value plus BCD plus cess', detail: 'compute IGST on assessable value plus BCD plus cess.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-gst-mod5-customs-law-basics-4', step: 'Step 4: total the duties and note any exemption notification or drawback reli...', detail: 'total the duties and note any exemption notification or drawback relief applicable.', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'ent-mod1-introduction-entrepreneurship', subjectId: 'bba-karnataka-entrepreneurship', title: 'Introduction to Entrepreneurship', moduleNumber: 1, moduleName: 'Module 1: Entrepreneurship Foundations', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ent-01b', 'q-ent-02'], subtopics: [
        'Entrepreneur: Meaning & Types',
        'Entrepreneurship: Concept & Importance',
        'Entrepreneur vs Manager',
        'Qualities of Successful Entrepreneur',
        'Role of Entrepreneurship in Economic Development'
      ], explanationMd: `# Introduction to Entrepreneurship

### Core Concept
An **entrepreneur** innovates, organises resources and bears risk to create value. Theories: Schumpeter (innovation and creative destruction), Knight (risk-bearing), Kirzner (alertness to opportunity). Types: lifestyle, growth, social, intrapreneur, serial. Traits: achievement need, risk tolerance, internal locus, self-confidence. India context: MUDRA, Startup India and Karnataka's startup policy (Bengaluru ecosystem) support new ventures.

---

### Key Framework
1. **Definitions**: entrepreneur (risk-bearing organiser), entrepreneurship (process), enterprise (venture).
2. **Theories**: Schumpeter: innovation; Knight: uncertainty; Kirzner: arbitrage alertness; McClelland: achievement motivation.
3. **Intrapreneurship**: entrepreneurship within a corporate structure; skunkworks teams.
4. **Economic roles**: capital formation, employment, innovation, balanced regional development; MSME contribution to GDP and exports.

---

### Exam Focus
**Entrepreneur vs manager**: the entrepreneur owns and bears risk for opportunity; the manager executes within delegation and draws a salary.

![Entrepreneurship Intro Diagram](entrepreneurship-intro.png)`,
            formulas: [
              { id: 'formula-ent-mod1-introduction-entrepreneurship-1', label: 'Entrepreneurial opportunity', formula: 'Opportunity = Market gap + Resource availability + Founder capability', exampleQ: 'Gap in organic food supply; founder has retail experience.', exampleA: 'Opportunity score high: venture is viable.' },
              { id: 'formula-ent-mod1-introduction-entrepreneurship-2', label: 'MSME share', formula: 'MSME share of GDP / exports: compute contribution percentage', exampleQ: 'MSME output Rs 30 cr of state output Rs 150 cr.', exampleA: 'Share = 20%.' },
            ],
            tricks: [
              { id: 'trick-ent-mod1-introduction-entrepreneurship-1', title: 'Schumpeter tag', trick: 'Creative destruction: innovation disrupts existing markets and firms.', whenToUse: 'Theory matching MCQs.' },
              { id: 'trick-ent-mod1-introduction-entrepreneurship-2', title: 'Traits recall', trick: 'Achievement motivation, risk tolerance, internal locus, self-confidence, leadership.', whenToUse: 'Short-answer lists.' },
            ],
            howToSolve: [
              { id: 'solve-ent-mod1-introduction-entrepreneurship-1', step: 'Step 1: define the entrepreneur and contrast with the manager and the adminis...', detail: 'define the entrepreneur and contrast with the manager and the administrator.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ent-mod1-introduction-entrepreneurship-2', step: 'Step 2: apply the theory asked (Schumpeter innovation, Knight risk, McClellan...', detail: 'apply the theory asked (Schumpeter innovation, Knight risk, McClelland achievement).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ent-mod1-introduction-entrepreneurship-3', step: 'Step 3: classify the venture type (lifestyle/growth/social/intrapreneur)', detail: 'classify the venture type (lifestyle/growth/social/intrapreneur).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ent-mod1-introduction-entrepreneurship-4', step: 'Step 4: link to the support ecosystem (MUDRA, Startup India, state policy) an...', detail: 'link to the support ecosystem (MUDRA, Startup India, state policy) and economic role.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'ent-mod3-business-plan-preparation', subjectId: 'bba-karnataka-entrepreneurship', title: 'Business Plan Preparation', moduleNumber: 3, moduleName: 'Module 3: Business Plan', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ent-03', 'q-ent-04'], subtopics: [
        'Business Plan: Meaning & Components',
        'Market Analysis in Business Plan',
        'Financial Plan & Projections',
        'Operations Plan',
        'Risk Analysis'
      ], explanationMd: `# Business Plan Preparation

### Core Concept
A **business plan** is the venture written out: opportunity, product, market, operations, team, financials and funding ask. Sections: executive summary, company description, market analysis, marketing plan, operations, management, financial projections (P&L, cash flow, break-even), funding request, appendices. It serves as roadmap, pitch document and loan proposal. Investors scan team-size-market first.

---

### Key Framework
1. **Structure**: executive summary (write last, read first), opportunity/problem, solution/product, market size (TAM-SAM-SOM), competition, business model, go-to-market.
2. **Financials**: startup costs, sales forecast, P&L for 3-5 years, cash flow, break-even analysis, funding requirement and use of funds.
3. **Market sizing**: TAM (total), SAM (serviceable), SOM (obtainable).
4. **Presentation**: pitch deck (10-12 slides), elevator pitch (60-90 seconds); feasibility study precedes the plan (go/no-go).

---

### Exam Focus
**Feasibility study vs business plan**: feasibility decides whether to proceed (go/no-go); the business plan guides how to execute.

![Business Plan Diagram](business-plan.png)`,
            formulas: [
              { id: 'formula-ent-mod3-business-plan-preparation-1', label: 'TAM-SAM-SOM', formula: 'SOM = SAM x Expected market share percentage', exampleQ: 'SAM Rs 200 crore, expected share 2%.', exampleA: 'SOM = Rs 4 crore.' },
              { id: 'formula-ent-mod3-business-plan-preparation-2', label: 'Break-even in plan', formula: 'BEP units = Fixed costs / (Price minus Variable cost per unit)', exampleQ: 'FC Rs 12 lakh; price Rs 300; VC Rs 180.', exampleA: 'BEP = 12,00,000 / 120 = 10,000 units.' },
            ],
            tricks: [
              { id: 'trick-ent-mod3-business-plan-preparation-1', title: 'Summary last', trick: 'Write the executive summary after the plan is complete: it is the investor first impression.', whenToUse: 'Plan-quality tip.' },
              { id: 'trick-ent-mod3-business-plan-preparation-2', title: 'TAM drill-down', trick: 'Top-down plus bottom-up sizing: show both to build credibility.', whenToUse: 'Market sizing questions.' },
            ],
            howToSolve: [
              { id: 'solve-ent-mod3-business-plan-preparation-1', step: 'Step 1: run the feasibility check (product, market, technical, financial viab...', detail: 'run the feasibility check (product, market, technical, financial viability).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ent-mod3-business-plan-preparation-2', step: 'Step 2: draft the plan sections in order, ending with financial projections', detail: 'draft the plan sections in order, ending with financial projections.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ent-mod3-business-plan-preparation-3', step: 'Step 3: size the market (TAM-SAM-SOM) and show break-even', detail: 'size the market (TAM-SAM-SOM) and show break-even.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ent-mod3-business-plan-preparation-4', step: 'Step 4: state the funding requirement, use of funds and repayment/return logi...', detail: 'state the funding requirement, use of funds and repayment/return logic; polish the executive summary.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'ent-mod4-finance-sources-startup', subjectId: 'bba-karnataka-entrepreneurship', title: 'Sources of Finance for Startups', moduleNumber: 4, moduleName: 'Module 4: Startup Finance', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ent-05', 'q-ent-06'], subtopics: [
        'Bootstrapping & Own Funds',
        'Angel Investors',
        'Venture Capital',
        'Bank Loans & Mudra',
        'Crowdfunding'
      ], explanationMd: `# Finance Sources for Startups

### Core Concept
Startups fund themselves through a ladder: **bootstrapping, friends and family, angel investors, venture capital, government schemes, debt**. Each stage has instruments: equity, convertible notes, SAFE, venture debt. Government: MUDRA (Shishu/Kishore/Tarun), Startup India seed fund, CGTMSE (credit guarantee for collateral-free loans), SIDBI schemes. Karnataka startups also tap state IT/BT policies.

---

### Key Framework
1. **Funding ladder**: bootstrapping to F&F to angel (seed) to VC (Series A/B) to private equity/IPO.
2. **Instruments**: equity shares, convertible promissory notes, SAFEs, venture debt, working capital loans.
3. **Government support**: MUDRA loans (up to Rs 10 lakh: Shishu 50k, Kishore 5 lakh, Tarun 10 lakh), CGTMSE guarantee cover, Stand-Up India (SC/ST/women), PMEGP.
4. **Valuation basics**: pre-money vs post-money; dilution = investment / post-money.

---

### Exam Focus
**Angel vs VC**: angels invest smaller personal funds at seed stage; VCs invest institutional funds at later stages with formal due diligence.

![Startup Finance Diagram](startup-finance.png)`,
            formulas: [
              { id: 'formula-ent-mod4-finance-sources-startup-1', label: 'Post-money', formula: 'Post-money valuation = Pre-money valuation + New investment', exampleQ: 'Pre-money Rs 8 crore; investment Rs 2 crore.', exampleA: 'Post-money = Rs 10 crore; dilution = 20%.' },
              { id: 'formula-ent-mod4-finance-sources-startup-2', label: 'MUDRA tier', formula: 'Shishu up to Rs 50,000; Kishore Rs 50k to Rs 5 lakh; Tarun Rs 5 lakh to Rs 10 lakh', exampleQ: 'Loan needed Rs 6 lakh.', exampleA: 'Tarun category (Rs 5-10 lakh).' },
            ],
            tricks: [
              { id: 'trick-ent-mod4-finance-sources-startup-1', title: 'Dilution math', trick: 'Dilution % = Investment / Post-money valuation', whenToUse: 'Instant ownership calculations.' },
              { id: 'trick-ent-mod4-finance-sources-startup-2', title: 'CGTMSE', trick: 'Credit guarantee enables collateral-free bank lending to micro/small units.', whenToUse: 'Scheme-selection MCQs.' },
            ],
            howToSolve: [
              { id: 'solve-ent-mod4-finance-sources-startup-1', step: 'Step 1: identify the venture stage (idea/seed/growth) and the matching invest...', detail: 'identify the venture stage (idea/seed/growth) and the matching investor type.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ent-mod4-finance-sources-startup-2', step: 'Step 2: choose the instrument (equity, convertible note, debt) and compute di...', detail: 'choose the instrument (equity, convertible note, debt) and compute dilution or interest cost.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ent-mod4-finance-sources-startup-3', step: 'Step 3: map government schemes (MUDRA tier, CGTMSE, Stand-Up India) to the need', detail: 'map government schemes (MUDRA tier, CGTMSE, Stand-Up India) to the need.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ent-mod4-finance-sources-startup-4', step: 'Step 4: build a funding ask with use-of-funds and milestone linkage', detail: 'build a funding ask with use-of-funds and milestone linkage.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'ent-mod5-startup-ecosystem-india', subjectId: 'bba-karnataka-entrepreneurship', title: 'Startup Ecosystem in India', moduleNumber: 5, moduleName: 'Module 5: Startup Ecosystem', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-ent-07', 'q-ent-08'], subtopics: [
        'Startup India Scheme',
        'Incubators & Accelerators',
        'MSME Registration',
        'Legal Registration: Proprietorship, Partnership, LLP, Company',
        'Exit Strategies'
      ], explanationMd: `# Startup Ecosystem in India

### Core Concept
India has the world third-largest startup ecosystem: **Startup India (2016)** offers recognition, tax benefits (3-year holiday under 80-IAC), self-certification, seed fund and faster exits (Section 54GB, insolvency windows). DPIIT recognition, Atal Innovation Mission, and state policies (Karnataka, Telangana, Gujarat) build incubators and clusters. Bengaluru is the top hub for IT, biotech and deep-tech ventures.

---

### Key Framework
1. **Startup India pillars**: simplification (self-certify 9 labour laws), funding support (Fund of Funds, seed fund), tax benefits (80-IAC holiday, capital gains exemption).
2. **DPIIT recognition**: 10-year window from incorporation, turnover under Rs 100 crore, entity not formed by splitting.
3. **Ecosystem elements**: incubators (IIMB NSRCEL, T-Hub, Atal Tinkering Labs), accelerators, angel networks, VC funds, mentors.
4. **Challenges**: funding winter, regulatory compliance, talent retention, market access; sector trends: fintech, edtech, SaaS, cleantech, healthtech.

---

### Exam Focus
**80-IAC tax holiday**: eligible startups can claim 100% deduction on profits for 3 consecutive years out of the first 10 years.

![Startup Ecosystem Diagram](startup-ecosystem.png)`,
            formulas: [
              { id: 'formula-ent-mod5-startup-ecosystem-india-1', label: 'Eligibility', formula: 'DPIIT recognition requires: incorporated within 10 years, turnover under Rs 100 crore, innovative product/process', exampleQ: 'Firm incorporated 6 years ago, turnover Rs 40 crore.', exampleA: 'Eligible for DPIIT recognition.' },
              { id: 'formula-ent-mod5-startup-ecosystem-india-2', label: 'Tax holiday', formula: '80-IAC: 100% profit deduction for 3 consecutive years chosen from the first 10 years', exampleQ: 'Startup earns Rs 30 lakh profit in year 5.', exampleA: 'Can claim 100% deduction and pay zero tax on it.' },
            ],
            tricks: [
              { id: 'trick-ent-mod5-startup-ecosystem-india-1', title: 'Self-certification', trick: 'Recognised startups self-certify 9 labour and environmental laws for 3-5 years.', whenToUse: 'Compliance-simplification questions.' },
              { id: 'trick-ent-mod5-startup-ecosystem-india-2', title: 'Fund of Funds', trick: 'Government contributes to SEBI-registered AIFs that invest in startups: indirect funding route.', whenToUse: 'Policy-instrument MCQs.' },
            ],
            howToSolve: [
              { id: 'solve-ent-mod5-startup-ecosystem-india-1', step: 'Step 1: check DPIIT eligibility (age, turnover, innovation)', detail: 'check DPIIT eligibility (age, turnover, innovation).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ent-mod5-startup-ecosystem-india-2', step: 'Step 2: list the benefits unlocked: tax holiday, self-certification, seed fun...', detail: 'list the benefits unlocked: tax holiday, self-certification, seed fund access, IPR support.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ent-mod5-startup-ecosystem-india-3', step: 'Step 3: identify ecosystem supports in the scenario (incubator, accelerator,...', detail: 'identify ecosystem supports in the scenario (incubator, accelerator, angel network).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-ent-mod5-startup-ecosystem-india-4', step: 'Step 4: conclude with challenges and the policy measure that addresses each', detail: 'conclude with challenges and the policy measure that addresses each.', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'colaw-mod2-companies-act-incorporation', subjectId: 'bba-karnataka-company-law', title: 'Companies Act 2013: Incorporation & Types', moduleNumber: 2, moduleName: 'Module 2: Incorporation & Types', order: 2, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-claw-01', 'q-claw-02'], subtopics: [
        'Company: Meaning & Features',
        'Types of Companies: Private, Public, OPC',
        'Incorporation Process',
        'MOA & AOA',
        'Certificate of Incorporation'
      ], explanationMd: `# Companies Act: Incorporation & Formation

### Core Concept
A **company** is an artificial legal person separate from its members (Salomon v Salomon). Types: private (min 2 members, max 200, no public deposit/invitation), public (min 7 members), OPC, small company, Section 8 (not-for-profit). Incorporation under the Companies Act 2013: name reservation (RUN/SPICe), MOA (objects, capital, association) and AOA (internal rules), certificate of incorporation (conclusive evidence), and the corporate veil doctrine.

---

### Key Framework
1. **Incorporation steps**: DSC and DIN of directors, name reservation, drafting MOA/AOA, filing SPICe+ with declarations, certificate of incorporation (Section 7).
2. **MOA clauses**: name, registered office, objects, liability, capital, subscription; doctrines: ultra vires, constructive notice, indoor management (Turquand).
3. **Corporate veil**: separate legal personality; lifted in fraud, agency, enemy character, or single-person abuse (Section 248/35 exceptions).
4. **Private vs public**: minimum members 2 vs 7; maximum 200 vs unlimited; private restricts transfer and public invitation.

---

### Exam Focus
**MOA vs AOA**: MOA is the charter binding the company with outsiders; AOA governs internal management and can be altered by special resolution.

![Company Incorporation Diagram](company-incorporation.png)`,
            formulas: [
              { id: 'formula-colaw-mod2-companies-act-incorporation-1', label: 'Minimum members', formula: 'Private: 2 members and 2 directors; Public: 7 members and 3 directors', exampleQ: 'Group of 3 friends plus 2 investors forming a company.', exampleA: 'Private company is possible (2 to 200 members).' },
              { id: 'formula-colaw-mod2-companies-act-incorporation-2', label: 'One Person Company', formula: 'OPC: one member, one nominee; max paid-up capital Rs 50 lakh and turnover Rs 2 crore (else convert)', exampleQ: 'Solo founder with turnover Rs 1 crore.', exampleA: 'OPC structure fits.' },
            ],
            tricks: [
              { id: 'trick-colaw-mod2-companies-act-incorporation-1', title: 'Ultra vires', trick: 'Acts beyond MOA objects are void (ultra vires); outsiders can still use indoor management.', whenToUse: 'Doctrine questions.' },
              { id: 'trick-colaw-mod2-companies-act-incorporation-2', title: 'Turquand rule', trick: 'Indoor management: outsider may assume internal procedures were followed.', whenToUse: 'Bargraph of MOA vs AOA table.' },
            ],
            howToSolve: [
              { id: 'solve-colaw-mod2-companies-act-incorporation-1', step: 'Step 1: classify the company type from membership and activity', detail: 'classify the company type from membership and activity.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod2-companies-act-incorporation-2', step: 'Step 2: walk incorporation: DSC/DIN, name, MOA/AOA, SPICe+ filing, certificate', detail: 'walk incorporation: DSC/DIN, name, MOA/AOA, SPICe+ filing, certificate.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod2-companies-act-incorporation-3', step: 'Step 3: test the act in question against MOA (ultra vires) and AOA; apply the...', detail: 'test the act in question against MOA (ultra vires) and AOA; apply the veil-lifting doctrine if abuse is alleged.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod2-companies-act-incorporation-4', step: 'Step 4: state the consequences: void act, liability of directors, or personal...', detail: 'state the consequences: void act, liability of directors, or personal liability.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'colaw-mod3-shares-debentures', subjectId: 'bba-karnataka-company-law', title: 'Shares, Debentures & Share Capital', moduleNumber: 3, moduleName: 'Module 3: Share Capital', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-claw-03', 'q-claw-04'], subtopics: [
        'Share Capital: Meaning & Types',
        'Equity vs Preference Shares',
        'Issue of Shares: At Par, Premium, Discount',
        'Debentures: Types & Features',
        'Transfer & Transmission of Shares'
      ], explanationMd: `# Shares & Debentures

### Core Concept
**Share capital** is ownership funding (equity with voting, preference with fixed dividend priority); **debentures** are loan funding with fixed interest and a charge on assets. The Companies Act 2013 governs issue, transfer and redemption: private placement, rights issue, bonus issue, ESOPs; deposits rules for public borrowing. Key distinctions: dividend versus interest, floating versus fixed charge, convertible versus non-convertible debentures.

---

### Key Framework
1. **Share types**: equity (voting, variable dividend, residual claim), preference (fixed dividend, priority in winding up; can be cumulative, participating, convertible).
2. **Debentures**: secured/unsecured, redeemable/irredeemable, convertible/non-convertible; trust deed for secured issues; charge registration (CHG-1 within 30 days).
3. **Issue mechanics**: prospectus (public), private placement (PAS-3), rights (Section 62), bonus (Section 63 from reserves), buy-back (Section 68 limits: 25% of paid-up).
4. **Deposits**: Section 73-76: public companies need RBI-bonded rules; acceptance limits and deposit repayment reserve (20% maturing within a year).

---

### Exam Focus
**Share vs debenture**: a share is ownership with variable dividend; a debenture is debt with fixed interest and priority over shareholders.

![Shares and Debentures Diagram](shares-debentures.png)`,
            formulas: [
              { id: 'formula-colaw-mod3-shares-debentures-1', label: 'Bonus issue', formula: 'Bonus shares are issued free from reserves; bonus = Reserves available / Face value of new shares', exampleQ: 'Free reserves Rs 50 lakh, face value Rs 10.', exampleA: 'Bonus shares = 5,00,000 shares.' },
              { id: 'formula-colaw-mod3-shares-debentures-2', label: 'Buy-back limit', formula: 'Buy-back limited to 25% of total paid-up capital plus free reserves; 1-year gap between buy-backs', exampleQ: 'Paid-up plus reserves Rs 20 crore.', exampleA: 'Max buy-back = Rs 5 crore.' },
            ],
            tricks: [
              { id: 'trick-colaw-mod3-shares-debentures-1', title: 'Charge registration', trick: 'Register charge (CHG-1) within 30 days of creation; delay attracts penalty and lender loses priority.', whenToUse: 'Timeline MCQs.' },
              { id: 'trick-colaw-mod3-shares-debentures-2', title: 'Preference dividend', trick: 'Cumulative preference dividend accumulates if skipped; equity gets nothing until preference is paid.', whenToUse: 'Dividend-order questions.' },
            ],
            howToSolve: [
              { id: 'solve-colaw-mod3-shares-debentures-1', step: 'Step 1: classify the instrument (equity/preference share or debenture type)', detail: 'classify the instrument (equity/preference share or debenture type).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod3-shares-debentures-2', step: 'Step 2: check the issue route and compliance (prospectus, PAS-3, Section 62/63)', detail: 'check the issue route and compliance (prospectus, PAS-3, Section 62/63).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod3-shares-debentures-3', step: 'Step 3: for debentures, verify charge creation and trust deed', detail: 'for debentures, verify charge creation and trust deed.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod3-shares-debentures-4', step: 'Step 4: compute dividend/interest obligations and priority in payment or wind...', detail: 'compute dividend/interest obligations and priority in payment or winding up.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'colaw-mod4-company-management-directors', subjectId: 'bba-karnataka-company-law', title: 'Company Management: Directors & Meetings', moduleNumber: 4, moduleName: 'Module 4: Directors & Meetings', order: 4, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-claw-05', 'q-claw-06'], subtopics: [
        'Directors: Appointment & Removal',
        'Duties & Liabilities of Directors',
        'Board Meetings & Resolutions',
        'Annual General Meeting',
        'Extraordinary General Meeting'
      ], explanationMd: `# Company Management & Directors

### Core Concept
**Directors** manage the company as agents and fiduciaries of the members. The Act 2013 fixes board composition (independent directors, woman director for listed/large companies), DIN requirement, appointment (Section 160-169), duties (Section 166: fiduciary duty, care, no conflict), disqualifications (Section 164), removal (Section 169), and key managerial personnel (CEO, CFO, CS). Board meetings, committees (audit, nomination/remuneration, CSR under Section 135) complete the governance map.

---

### Key Framework
1. **Appointment**: DIN mandatory; general meeting appoints (Section 160 right to stand); additional directors (Section 161) hold only till the next AGM.
2. **Duties (Section 166)**: act in good faith, care and diligence, avoid conflict of interest, not achieve undue gain; breach: personal liability and disgorgement.
3. **Composition**: independent directors (1/3 of board for listed), woman director (listed + paid-up above Rs 100 crore), small shareholder director.
4. **Disqualification (Section 164)**: unsound mind, undischarged insolvent, convicted (5-year bar), unpaid shares, disqualified under 167. Rotation: 2/3 of directors retire by rotation in public companies.

---

### Exam Focus
**Additional vs alternate director**: additional (Section 161) is appointed between AGMs; alternate director acts in the original director absence for 3 months or more.

![Company Directors Diagram](company-directors.png)`,
            formulas: [
              { id: 'formula-colaw-mod4-company-management-directors-1', label: 'Board quorum', formula: 'Quorum: 1/3 of board strength or 2 directors, whichever is higher (minimum 2)', exampleQ: 'Board of 9 directors.', exampleA: 'Quorum = 3.' },
              { id: 'formula-colaw-mod4-company-management-directors-2', label: 'Woman director', formula: 'Required for listed companies and public companies with paid-up capital above Rs 100 crore or turnover above Rs 300 crore', exampleQ: 'Public company, paid-up Rs 120 crore.', exampleA: 'Woman director mandatory.' },
            ],
            tricks: [
              { id: 'trick-colaw-mod4-company-management-directors-1', title: 'Duty breach', trick: 'Section 166 breach: director holds gains in trust for the company (disgorgement).', whenToUse: 'Fiduciary-duty scenarios.' },
              { id: 'trick-colaw-mod4-company-management-directors-2', title: 'Rotation', trick: 'Public company: 2/3 of directors retire by rotation every AGM; one-third eligible for reappointment.', whenToUse: 'Appointment-process questions.' },
            ],
            howToSolve: [
              { id: 'solve-colaw-mod4-company-management-directors-1', step: 'Step 1: identify the director category (executive, independent, additional, a...', detail: 'identify the director category (executive, independent, additional, alternate) and the appointment route.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod4-company-management-directors-2', step: 'Step 2: test composition rules (quorum, woman director, independent ratio)', detail: 'test composition rules (quorum, woman director, independent ratio).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod4-company-management-directors-3', step: 'Step 3: analyse the act against Section 166 duties and Section 164 disqualifi...', detail: 'analyse the act against Section 166 duties and Section 164 disqualifications.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod4-company-management-directors-4', step: 'Step 4: state consequences: removal, personal liability, disgorgement, or vac...', detail: 'state consequences: removal, personal liability, disgorgement, or vacation of office (Section 167).', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'colaw-mod5-winding-up-insolvency', subjectId: 'bba-karnataka-company-law', title: 'Winding Up & Insolvency', moduleNumber: 5, moduleName: 'Module 5: Winding Up & Insolvency', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-claw-07', 'q-claw-08'], subtopics: [
        'Winding Up: Meaning & Modes',
        'Voluntary vs Compulsory Winding Up',
        'Liquidator: Powers & Duties',
        'Insolvency & Bankruptcy Code 2016',
        'Corporate Insolvency Resolution Process'
      ], explanationMd: `# Winding Up & Insolvency

### Core Concept
**Winding up** dissolves the company: by the tribunal (Section 271-273: inability to pay debts, oppression, public interest) or voluntary (members/creditors). The **Insolvency and Bankruptcy Code 2015** now governs resolution: CIRP (corporate insolvency resolution process, 180+90 days), liquidation waterfall (Section 53: secured creditors, workmen dues, employees, government dues, unsecured, preference, equity). Fast-track and pre-packaged schemes support MSMEs.

---

### Key Framework
1. **Winding up grounds**: tribunal: unpaid debt (statutory demand/decree), special resolution plus tribunal opinion, public interest, inability to pay; voluntary: members (solvent), creditors (insolvent).
2. **IBC process**: default of Rs 1 crore or more triggers CIRP; NCLT appoints IRP; committee of creditors decides resolution vs liquidation (66% voting share).
3. **Liquidation waterfall (Section 53)**: insolvency resolution cost, workmen 24 months dues, secured creditors, employees, government, unsecured, preference shares, members.
4. **Voluntary winding**: statement of affairs, liquidator appointment, final meeting, dissolution (Section 301).

---

### Exam Focus
**Winding up vs liquidation vs dissolution**: winding up is the process; liquidation realises assets and pays creditors; dissolution ends the legal existence.

![Winding Up Diagram](winding-up.png)`,
            formulas: [
              { id: 'formula-colaw-mod5-winding-up-insolvency-1', label: 'Trigger threshold', formula: 'CIRP triggers on default of Rs 1 crore or more (Rs 10 lakh for MSME class via pre-pack)', exampleQ: 'Default of Rs 2 crore to a bank.', exampleA: 'Bank can file CIRP application at NCLT.' },
              { id: 'formula-colaw-mod5-winding-up-insolvency-2', label: 'Section 53 priority', formula: 'Waterfall: cost, workmen (24 months), secured, employees (12 months), government (1 year), unsecured, preference, equity', exampleQ: 'Rs 50 lakh available; workmen dues Rs 10 lakh, secured Rs 60 lakh.', exampleA: 'Cost and workmen paid first; secured gets balance; equity nothing.' },
            ],
            tricks: [
              { id: 'trick-colaw-mod5-winding-up-insolvency-1', title: '180+90', trick: 'CIRP: 180 days plus one 90-day extension; beyond that liquidation.', whenToUse: 'Timeline questions.' },
              { id: 'trick-colaw-mod5-winding-up-insolvency-2', title: 'Voluntary trigger', trick: 'Members voluntary when solvent; creditors voluntary when insolvent.', whenToUse: 'Route-selection MCQs.' },
            ],
            howToSolve: [
              { id: 'solve-colaw-mod5-winding-up-insolvency-1', step: 'Step 1: identify the route: tribunal winding up, voluntary, or IBC CIRP', detail: 'identify the route: tribunal winding up, voluntary, or IBC CIRP.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod5-winding-up-insolvency-2', step: 'Step 2: test the trigger (inability to pay, default amount, special resolution)', detail: 'test the trigger (inability to pay, default amount, special resolution).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod5-winding-up-insolvency-3', step: 'Step 3: run the process timeline (IRP appointment, committee of creditors, re...', detail: 'run the process timeline (IRP appointment, committee of creditors, resolution plan).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-colaw-mod5-winding-up-insolvency-4', step: 'Step 4: if liquidating, apply the Section 53 waterfall to distribute the assets', detail: 'if liquidating, apply the Section 53 waterfall to distribute the assets.', questionType: 'Problem Solving / 5 to 10 Marks' },
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
      { id: 'tax2-mod1-heads-of-income-salary', subjectId: 'bba-karnataka-income-tax-2', title: 'Income from Salary', moduleNumber: 1, moduleName: 'Module 1: Salary Income', order: 1, difficulty: 'basic', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-tax2-01b', 'q-tax2-02'], subtopics: [
        'Salary: Meaning & Components',
        'Allowances: Taxable & Exempt',
        'Perquisites: Types & Valuation',
        'Deduction under Section 16',
        'Computation of Salary Income'
      ], explanationMd: `# Heads of Income: Salary

### Core Concept
**Salary income** covers wages, allowances, perquisites, profits in lieu of salary (Section 17). Computation: gross salary minus exemptions (HRA, gratuity, leave encashment, pension) minus standard deduction gives income under the head. The Finance Act updates rates yearly; key exam items: HRA exemption (Section 10(13A) old regime), perquisite valuation (rent-free accommodation, car), and standard deduction (Rs 75,000 new regime).

---

### Key Framework
1. **Components**: basic, DA, commission, bonus; allowances: fully taxable (DA), partly exempt (HRA, LTA), fully exempt (special duty).
2. **HRA exemption**: least of (HRA received; rent minus 10% of salary; 50%/40% of salary for metro/non-metro).
3. **Perquisites**: rent-free house (valuation by rules), car, sweeper/gardener, education; some exempt (medical up to Rs 15,000).
4. **Standard deduction**: Rs 75,000 (new regime) / Rs 50,000 (old regime); pensioners get the same standard deduction.

---

### Exam Focus
**Salary definition**: includes wages, annuity, pension, gratuity, fees, commission, perquisites and profits in lieu (Section 17(1),(2)).

![Salary Income Diagram](salary-income.png)`,
            formulas: [
              { id: 'formula-tax2-mod1-heads-of-income-salary-1', label: 'HRA exemption', formula: 'Exempt HRA = Least of (HRA received; Rent paid minus 10% of salary; 50% metro / 40% non-metro salary)', exampleQ: 'HRA Rs 2.4 lakh; rent Rs 2.4 lakh; salary Rs 6 lakh (metro).', exampleA: 'Least of (2.4L; 2.4-0.6=1.8L; 3L) = Rs 1.8 lakh exempt.' },
              { id: 'formula-tax2-mod1-heads-of-income-salary-2', label: 'Standard deduction', formula: 'Salary head deduction = Rs 75,000 (new regime) or Rs 50,000 (old regime)', exampleQ: 'Gross salary Rs 8 lakh (new regime).', exampleA: 'Net salary income = Rs 7.25 lakh before other exemptions.' },
            ],
            tricks: [
              { id: 'trick-tax2-mod1-heads-of-income-salary-1', title: 'Salary base', trick: 'For HRA, salary = basic plus DA (forming part) plus commission on fixed percentage of turnover.', whenToUse: 'Exemption computation basis.' },
              { id: 'trick-tax2-mod1-heads-of-income-salary-2', title: 'Gratuity exempt', trick: 'Gratuity exemption: least of (15/26 x last salary x years; actual; Rs 20 lakh cap for private).', whenToUse: 'Retirement planning questions.' },
            ],
            howToSolve: [
              { id: 'solve-tax2-mod1-heads-of-income-salary-1', step: 'Step 1: compute gross salary (basic + DA + allowances + perquisites + bonus)', detail: 'compute gross salary (basic + DA + allowances + perquisites + bonus).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax2-mod1-heads-of-income-salary-2', step: 'Step 2: apply exemptions: HRA (least-of-three), LTA, gratuity, leave encashment', detail: 'apply exemptions: HRA (least-of-three), LTA, gratuity, leave encashment.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax2-mod1-heads-of-income-salary-3', step: 'Step 3: subtract standard deduction', detail: 'subtract standard deduction.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax2-mod1-heads-of-income-salary-4', step: 'Step 4: add the balance to total income; for perquisites, apply the valuation...', detail: 'add the balance to total income; for perquisites, apply the valuation rules (rent-free accommodation at prescribed rates).', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'tax2-mod2-income-from-house-property', subjectId: 'bba-karnataka-income-tax-2', title: 'Income from House Property', moduleNumber: 2, moduleName: 'Module 2: House Property Income', order: 2, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-tax2-03', 'q-tax2-04'], subtopics: [
        'House Property: Meaning',
        'Annual Value: Gross & Net',
        'Municipal Taxes',
        'Standard Deduction under Section 24',
        'Interest on Housing Loan'
      ], explanationMd: `# Income from House Property

### Core Concept
**House property income** is computed on annual value: the higher of fair rent, municipal value and standard rent (expected rent), then adjusted for unrealised rent and municipal taxes paid by owner. Deductions: 30% standard deduction (Section 24(a)) plus interest on borrowed capital (Section 24(b): Rs 2 lakh self-occupied limit). Two self-occupied houses can be treated as self-occupied (since AY 2020-21). Loss from house property set-off against other heads is capped at Rs 2 lakh.

---

### Key Framework
1. **Annual value**: gross annual value = expected rent (higher of fair/municipal, capped by standard rent) or actual rent if higher; deduct unrealised rent (conditions).
2. **NAV**: GAV minus municipal taxes (owner-paid) = Net Annual Value.
3. **Deductions**: 30% of NAV (no proof needed); interest on loan: fully deductible for let-out; Rs 2 lakh cap for self-occupied (construction completed within 5 years).
4. **Loss set-off**: house property loss against other heads limited to Rs 2 lakh per year; balance carried forward 8 years.

---

### Exam Focus
**Let-out vs self-occupied**: let-out: actual rent basis with 30% plus full interest deduction; self-occupied: NAV deemed nil, only interest deduction (capped Rs 2 lakh).

![House Property Diagram](house-property.png)`,
            formulas: [
              { id: 'formula-tax2-mod2-income-from-house-property-1', label: 'Income computation', formula: 'Income = NAV minus 30% of NAV minus Interest (subject to limits)', exampleQ: 'GAV Rs 2.4 lakh; municipal tax Rs 20k; interest Rs 1.5 lakh.', exampleA: 'NAV = 2.2L; income = 2.2 - 0.66 - 1.5 = Rs 4,000.' },
              { id: 'formula-tax2-mod2-income-from-house-property-2', label: 'Expected rent', formula: 'Expected rent = Higher of fair rent and municipal value, restricted to standard rent; compare with actual rent', exampleQ: 'Fair 1.8L, municipal 1.6L, standard 1.7L, actual 2L.', exampleA: 'Expected = 1.7L; GAV = 2L (actual higher).' },
            ],
            tricks: [
              { id: 'trick-tax2-mod2-income-from-house-property-1', title: '30% flat', trick: 'Standard deduction is always 30% of NAV regardless of actual expenses.', whenToUse: 'Fixed deduction trick.' },
              { id: 'trick-tax2-mod2-income-from-house-property-2', title: '2L interest cap', trick: 'Self-occupied interest capped at Rs 2 lakh; let-out interest fully deductible against that property income.', whenToUse: 'Set-off questions.' },
            ],
            howToSolve: [
              { id: 'solve-tax2-mod2-income-from-house-property-1', step: 'Step 1: determine occupancy status (self-occupied, let-out, deemed let-out)', detail: 'determine occupancy status (self-occupied, let-out, deemed let-out).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax2-mod2-income-from-house-property-2', step: 'Step 2: compute GAV: expected rent versus actual rent rules; deduct municipal...', detail: 'compute GAV: expected rent versus actual rent rules; deduct municipal taxes.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax2-mod2-income-from-house-property-3', step: 'Step 3: apply 30% standard deduction and interest deduction with the applicab...', detail: 'apply 30% standard deduction and interest deduction with the applicable cap.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax2-mod2-income-from-house-property-4', step: 'Step 4: set off any loss (within Rs 2 lakh) and carry forward the balance', detail: 'set off any loss (within Rs 2 lakh) and carry forward the balance.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'tax2-mod3-profit-gains-business-profession', subjectId: 'bba-karnataka-income-tax-2', title: 'Profit & Gains from Business or Profession', moduleNumber: 3, moduleName: 'Module 3: Business Income', order: 3, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'high', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-tax2-05', 'q-tax2-06'], subtopics: [
        'Business Income: Meaning',
        'Allowable Expenses',
        'Depreciation under Section 32',
        'Presumptive Taxation: Section 44AD',
        'Computation of Business Income'
      ], explanationMd: `# Profits & Gains of Business or Profession

### Core Concept
This head taxes business profit: revenue receipts minus allowable expenses (Sections 30-44). Key allowances: depreciation (Section 32, block of assets), additional depreciation (20% for new plant in specified areas), bad debts (Section 36), preliminary expenses amortisation (Section 35D), and specific disallowances (Section 14A, 40(a)(i): TDS compliance, 43B: payments made before filing). Presumptive taxation (44AD/44ADA/44AE) simplifies small businesses.

---

### Key Framework
1. **Allowable deductions**: rent (30), rates/taxes, repairs, insurance, depreciation (WDV method, blocks), bad debts written off (36(1)(vii)), employee PF/ESI, interest on business loans.
2. **Depreciation**: block of assets concept; rates (15% buildings, 30% machinery, 40% computers); additional depreciation 20% for new plant used 180+ days.
3. **Disallowed**: personal expenses, capital expenditure, illegal payments, payments above Rs 10,000 in cash (35AD specifics), provision for doubtful debts (only actual write-off allowed).
4. **Presumptive**: 44AD: 8% (6% digital) of turnover for small businesses (turnover up to Rs 3 crore); 44ADA: 50% receipts for professionals (up to Rs 75 lakh); no further deductions claimed.

---

### Exam Focus
**Depreciation is mandatory** under Section 32: even if not claimed in accounts, the WDV carry-forward requires computation.

![Business Profession Diagram](business-profession.png)`,
            formulas: [
              { id: 'formula-tax2-mod3-profit-gains-business-profession-1', label: 'WDV depreciation', formula: 'Depreciation = WDV of block x Rate x (Days used / 365); WDV = Opening WDV + additions minus sales', exampleQ: 'Block WDV Rs 10 lakh (machinery 30%), used full year.', exampleA: 'Depreciation = Rs 3 lakh; closing WDV = Rs 7 lakh.' },
              { id: 'formula-tax2-mod3-profit-gains-business-profession-2', label: 'Presumptive income', formula: '44AD income = 8% of turnover (6% for digital receipts); 44ADA = 50% of gross receipts', exampleQ: 'Turnover Rs 60 lakh, 100% digital.', exampleA: 'Presumptive income = 60L x 6% = Rs 3.6 lakh.' },
            ],
            tricks: [
              { id: 'trick-tax2-mod3-profit-gains-business-profession-1', title: 'Block rule', trick: 'Depreciation runs on blocks of assets; sale proceeds reduce the block WDV (capped at block value).', whenToUse: 'Computation questions.' },
              { id: 'trick-tax2-mod3-profit-gains-business-profession-2', title: '43B rule', trick: 'Deduction for taxes/PF/gratuity only when actually paid before the filing due date.', whenToUse: 'Timing disallowance traps.' },
            ],
            howToSolve: [
              { id: 'solve-tax2-mod3-profit-gains-business-profession-1', step: 'Step 1: compute gross profit from business accounts (Section 28 income)', detail: 'compute gross profit from business accounts (Section 28 income).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax2-mod3-profit-gains-business-profession-2', step: 'Step 2: add disallowed expenses back (personal, capital, provision, cash viol...', detail: 'add disallowed expenses back (personal, capital, provision, cash violations).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax2-mod3-profit-gains-business-profession-3', step: 'Step 3: claim deductions: rent, interest, depreciation on block WDV (with 180...', detail: 'claim deductions: rent, interest, depreciation on block WDV (with 180-day rule for additions), bad debts.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax2-mod3-profit-gains-business-profession-4', step: 'Step 4: compare with presumptive computation (44AD/44ADA) where eligible and...', detail: 'compare with presumptive computation (44AD/44ADA) where eligible and choose the lower-tax option.', questionType: 'Problem Solving / 5 to 10 Marks' },
            ],
    },
    { id: 'tax2-mod5-capital-gains-income-other-sources', subjectId: 'bba-karnataka-income-tax-2', title: 'Capital Gains & Income from Other Sources', moduleNumber: 5, moduleName: 'Module 5: Capital Gains & Other Sources', order: 5, difficulty: 'core', tier: 'free', status: 'published', examFrequency: 'moderate', generatedBy: 'curator', contentVersion: 1, publishedAt: '2026-09-16T12:00:00.000Z', featuredQuestionIds: ['q-tax2-07', 'q-tax2-08'], subtopics: [
        'Capital Gains: Short-term & Long-term',
        'Cost Inflation Index',
        'Exemptions: Sections 54, 54EC',
        'Income from Other Sources',
        'Deductions under Section 57'
      ], explanationMd: `# Capital Gains & Income from Other Sources

### Core Concept
**Capital gains** tax profits on transfer of a capital asset: short-term (held <= 12/24 months) versus long-term, with indexation benefits for long-term (except listed equity where LTCG above Rs 1.25 lakh is taxed at 12.5% without indexation post-July 2024). Exemptions: Sections 54, 54B, 54EC, 54F (reinvestment in residential house/bonds). **Income from other sources (IOS)** is the residual head: dividends, interest, gifts (Section 56(2)(x) above Rs 50,000), winnings from lottery (Section 115BB at 30%).

---

### Key Framework
1. **Capital asset**: property of any kind; excludes stock-in-trade, personal effects (except jewellery); transfer includes sale, exchange, extinguishment.
2. **STCG/LTCG**: listed equity: 12 months (STCG 20% post-budget; LTCG 12.5% above Rs 1.25 lakh); other assets: 24 months; indexation with CII for long-term (unlisted/property).
3. **Exemptions**: 54 (residential house reinvestment; 2 houses max for gains up to Rs 10 crore), 54EC (NHAI/REC bonds up to Rs 50 lakh within 6 months), 54F (net consideration reinvested in a house).
4. **IOS**: dividends at slab rates; interest (savings 80TTA/TTB exempt); gifts: money above Rs 50,000 taxable (exceptions: relatives, marriage, inheritance); lottery at 30% flat.

---

### Exam Focus
**Indexation vs straight 12.5%**: post-July-2024, listed equity LTCG is 12.5% without indexation; property/unlisted gains retain indexation.

![Capital Gains Other Sources Diagram](capital-gains.png)`,
            formulas: [
              { id: 'formula-tax2-mod5-capital-gains-income-other-sources-1', label: 'Indexed cost', formula: 'Indexed cost = Cost x CII of year of transfer / CII of year of acquisition', exampleQ: 'Cost Rs 20 lakh (2015-16, CII 254); transfer 2024-25 (CII 363).', exampleA: 'Indexed cost = 20L x 363/254 = Rs 28.6 lakh.' },
              { id: 'formula-tax2-mod5-capital-gains-income-other-sources-2', label: 'Section 54F', formula: 'Exemption = Long-term gain x (Net consideration reinvested in new house / Net consideration)', exampleQ: 'Gain Rs 30 lakh; net consideration Rs 60 lakh; reinvested Rs 45 lakh.', exampleA: 'Exempt = 30 x 45/60 = Rs 22.5 lakh.' },
            ],
            tricks: [
              { id: 'trick-tax2-mod5-capital-gains-income-other-sources-1', title: 'Holding test', trick: 'Listed equity: 12 months divides ST/LT; house/unlisted: 24 months.', whenToUse: 'Classification speed.' },
              { id: 'trick-tax2-mod5-capital-gains-income-other-sources-2', title: 'Gift rule', trick: 'Money above Rs 50,000 from non-relatives is IOS income (Section 56(2)(x)); marriage/inheritance gifts exempt.', whenToUse: 'Gift MCQs.' },
            ],
            howToSolve: [
              { id: 'solve-tax2-mod5-capital-gains-income-other-sources-1', step: 'Step 1: classify the asset and holding period; compute full and indexed cost...', detail: 'classify the asset and holding period; compute full and indexed cost of acquisition (plus improvement).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax2-mod5-capital-gains-income-other-sources-2', step: 'Step 2: compute STCG or LTCG; apply the right tax rate (slab for STCG non-equ...', detail: 'compute STCG or LTCG; apply the right tax rate (slab for STCG non-equity; 20% STCG equity; 12.5% LTCG equity; 12.5% indexed for others).', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax2-mod5-capital-gains-income-other-sources-3', step: 'Step 3: apply exemptions (54/54B/54EC/54F) with time and amount limits', detail: 'apply exemptions (54/54B/54EC/54F) with time and amount limits.', questionType: 'Problem Solving / 5 to 10 Marks' },
              { id: 'solve-tax2-mod5-capital-gains-income-other-sources-4', step: 'Step 4: compute IOS items separately (dividends at slab, lottery at 30%, gift...', detail: 'compute IOS items separately (dividends at slab, lottery at 30%, gifts above the threshold).', questionType: 'Problem Solving / 5 to 10 Marks' },
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
