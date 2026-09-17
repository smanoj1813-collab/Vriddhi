// functions/src/data/bscSeedData.ts
//
// Complete B.Sc Curriculum (Undergraduate — Semesters 1 to 4, Karnataka Region)
// Streams covered: Mathematics, Statistics, Physics and Computer Science majors
// under the Karnataka State Higher Education Council (KSHEC) NEP 2020 / CBCS
// four-year honours model adopted by Bangalore University (BU), Bengaluru City
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
const SYLLABUS = (sem: number) => `KSHEC NEP B.Sc Sem-${sem} / BU, BCU, BNU, UOM, Mangalore, KUD`

export const BSC_SUBJECTS: PrepSubject[] = [
  // ══════════════════════════════════════════════════════════════════════
  // SEMESTER 1 (FOUNDATIONS — CALCULUS & COMPUTING)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'bsc-karnataka-calculus',
    name: 'Calculus & Differential Equations',
    stream: 'mathematics',
    programs: ['bsc', 'bca', 'mca'],
    degreeLevel: 'undergraduate',
    yearGroup: '1st-year',
    semester: 1,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(1),
    icon: 'Calculator',
    order: 1,
    topicCount: 5,
    status: 'published',
    description:
      'Successive differentiation and Leibniz theorem, partial differentiation and Jacobians, multiple integrals with change of order, first order and first degree differential equations, and higher order linear equations with constant coefficients.',
  },
  {
    id: 'bsc-karnataka-programming',
    name: 'Programming & Data Structures',
    stream: 'computing',
    programs: ['bsc', 'bca'],
    degreeLevel: 'undergraduate',
    yearGroup: '1st-year',
    semester: 1,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(1),
    icon: 'Code',
    order: 2,
    topicCount: 5,
    status: 'published',
    description:
      'Problem solving and algorithm design, C programming fundamentals and control structures, arrays strings and pointers, stacks queues and linked lists, and algorithm complexity analysis with Big-O notation.',
  },

  // ══════════════════════════════════════════════════════════════════════
  // SEMESTER 2 (RIGOUR — ANALYSIS & PROBABILITY)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'bsc-karnataka-real-analysis',
    name: 'Real Analysis',
    stream: 'mathematics',
    programs: ['bsc'],
    degreeLevel: 'undergraduate',
    yearGroup: '1st-year',
    semester: 2,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(2),
    icon: 'Sigma',
    order: 3,
    topicCount: 5,
    status: 'published',
    description:
      'Real number system, supremum and the completeness axiom, sequences and convergence tests, limits and continuity with the epsilon-delta definition, differentiability and the mean value theorems, and Riemann integration.',
  },
  {
    id: 'bsc-karnataka-probability',
    name: 'Probability & Statistical Distributions',
    stream: 'statistics',
    programs: ['bsc', 'bcom', 'bba'],
    degreeLevel: 'undergraduate',
    yearGroup: '1st-year',
    semester: 2,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(2),
    icon: 'Dice5',
    order: 4,
    topicCount: 5,
    status: 'published',
    description:
      'Axiomatic probability, conditional probability and Bayes theorem, discrete distributions (binomial, Poisson, geometric), continuous distributions (uniform, exponential, normal), and the central limit theorem.',
  },

  // ══════════════════════════════════════════════════════════════════════
  // SEMESTER 3 (CORE MAJOR — ALGEBRA & NUMERICAL METHODS)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'bsc-karnataka-linear-algebra',
    name: 'Linear Algebra',
    stream: 'mathematics',
    programs: ['bsc', 'bca', 'mca'],
    degreeLevel: 'undergraduate',
    yearGroup: '2nd-year',
    semester: 3,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(3),
    icon: 'Grid3x3',
    order: 5,
    topicCount: 5,
    status: 'published',
    description:
      'Determinants and matrices, rank and solution of linear systems, vector spaces and subspaces, linear transformations and change of basis, and eigenvalues, eigenvectors and diagonalisation.',
  },
  {
    id: 'bsc-karnataka-numerical-methods',
    name: 'Numerical Methods',
    stream: 'computing',
    programs: ['bsc', 'bca'],
    degreeLevel: 'undergraduate',
    yearGroup: '2nd-year',
    semester: 3,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(3),
    icon: 'FunctionSquare',
    order: 6,
    topicCount: 5,
    status: 'published',
    description:
      'Errors and floating point arithmetic, algebraic and transcendental equation solvers, interpolation and numerical differentiation, numerical integration (trapezoidal and Simpson rules), and numerical solution of ordinary differential equations.',
  },

  // ══════════════════════════════════════════════════════════════════════
  // SEMESTER 4 (SPECIALISATION — PHYSICS & INFERENCE)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'bsc-karnataka-mechanics',
    name: 'Classical & Quantum Mechanics',
    stream: 'science',
    programs: ['bsc'],
    degreeLevel: 'undergraduate',
    yearGroup: '2nd-year',
    semester: 4,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(4),
    icon: 'Atom',
    order: 7,
    topicCount: 5,
    status: 'published',
    description:
      "Newtonian mechanics and conservation laws, Lagrangian and Hamiltonian formulation, wave-particle duality and de Broglie hypothesis, the Schrodinger equation with particle in a box, and the uncertainty principle with quantum tunnelling.",
  },
  {
    id: 'bsc-karnataka-applied-stats',
    name: 'Applied Statistics & Statistical Inference',
    stream: 'statistics',
    programs: ['bsc', 'bcom'],
    degreeLevel: 'undergraduate',
    yearGroup: '2nd-year',
    semester: 4,
    universityRegion: 'karnataka',
    syllabusRef: SYLLABUS(4),
    icon: 'BarChart2',
    order: 8,
    topicCount: 5,
    status: 'published',
    description:
      'Sampling distributions and the central limit theorem, point and interval estimation, hypothesis testing with t, chi-square and F tests, correlation and regression analysis, and design of experiments with ANOVA.',
  },
]

export const SEEDED_BSC_TOPICS: Record<string, PrepTopic[]> = {
  // ── 1. Calculus & Differential Equations (Sem 1) ──
  'bsc-karnataka-calculus': [
    {
      id: 'cal-mod1-successive-diff',
      subjectId: 'bsc-karnataka-calculus',
      title: 'Successive Differentiation, Leibniz Theorem & Curvature',
      moduleNumber: 1,
      moduleName: 'Module 1: Differential Calculus of One Variable',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-cal-mod1-01', 'q-cal-mod1-02'],
      subtopics: [
        'nth derivatives of standard functions: e^ax, sin(ax+b), x^m, logarithmic',
        "Leibniz theorem for the nth derivative of a product",
        'Curvature, radius of curvature and evolutes',
        "Taylor's and Maclaurin's series expansions",
        'Indeterminate forms and L\u2019Hospital\u2019s rule',
      ],
      explanationMd: `# Successive Differentiation & Leibniz Theorem

### nth Derivatives of Standard Functions
Repeated differentiation of common functions follows closed patterns that must be memorised, because deriving them in an examination wastes time:
- y = e^(ax) gives y_n = a^n e^(ax)
- y = sin(ax + b) gives y_n = a^n sin(ax + b + n*pi/2)
- y = 1/(ax + b) gives y_n = (-1)^n n! a^n / (ax + b)^(n+1)
- y = log(ax + b) gives y_n = (-1)^(n-1) (n-1)! a^n / (ax + b)^n

### Leibniz Theorem
For the nth derivative of a product uv:

(uv)_n = sum over r = 0 to n of nCr * u_(n-r) * v_r

The strategy is to choose as **v** the factor whose higher derivatives vanish quickly — typically a polynomial — so that most terms of the sum are zero.

### Taylor and Maclaurin Series
Taylor's theorem expands a function about x = a; Maclaurin's is the special case a = 0. Standard expansions for e^x, sin x, cos x, log(1+x) and (1+x)^n are used repeatedly, both for approximation and for evaluating limits.

### Indeterminate Forms
Forms such as 0/0 and infinity/infinity are resolved by L'Hospital's rule — differentiating numerator and denominator until the limit resolves — or by series expansion, which is often faster when the expressions involve trigonometric or exponential terms.

### Curvature
The radius of curvature R = [1 + (dy/dx)^2]^(3/2) / |d^2y/dx^2| measures how sharply a curve bends at a point, and is central to problems on osculating circles and evolutes.`,
      formulas: [
        {
          id: 'formula-cal-1',
          label: 'Leibniz Theorem',
          formula: '(uv)_n = nCr * u_(n-r) * v_r summed over r = 0 to n',
          exampleQ: 'Find the second derivative of y = x^2 e^(3x) using Leibniz theorem.',
          exampleA:
            'Take u = e^(3x), v = x^2. y_2 = u_2 v + 2 u_1 v_1 + u v_2 = 9e^(3x) x^2 + 2(3e^(3x))(2x) + e^(3x)(2) = e^(3x)(9x^2 + 12x + 2).',
        },
        {
          id: 'formula-cal-2',
          label: 'Radius of Curvature (Cartesian Form)',
          formula: 'R = [1 + (y1)^2]^(3/2) / |y2|',
          exampleQ: 'Find the radius of curvature of y = x^2 at the point (1, 1).',
          exampleA: 'y1 = 2x = 2 at x = 1; y2 = 2. R = (1 + 4)^(3/2) / 2 = 11.180 / 2 = 5.590.',
        },
      ],
      tricks: [
        {
          id: 'trick-cal-1',
          title: 'Let the Polynomial Be v',
          trick:
            'In Leibniz problems always assign the polynomial factor to v. Its (k+1)th derivative is zero for a degree-k polynomial, so a quadratic collapses the sum to three terms instead of n+1.',
          whenToUse: 'Every Leibniz theorem problem.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-cal-1',
          step: 'Step 1: Identify u and v and Write Their Derivatives',
          detail:
            'Choose u as the function with a simple repeated-derivative pattern and v as the polynomial; tabulate derivatives of both up to order n.',
          questionType: 'Differentiation Numerical',
        },
        {
          id: 'solve-cal-2',
          step: 'Step 2: Substitute Into Leibniz and Simplify',
          detail:
            'Insert the binomial coefficients, drop vanishing terms, and factor the common exponential or trigonometric factor from the result.',
          questionType: 'Differentiation Numerical',
        },
      ],
    },
    {
      id: 'cal-mod2-partial-diff',
      subjectId: 'bsc-karnataka-calculus',
      title: 'Partial Differentiation, Jacobians & Extrema of Two Variables',
      moduleNumber: 2,
      moduleName: 'Module 2: Multivariable Differential Calculus',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-cal-mod2-01', 'q-cal-mod2-02'],
      subtopics: [
        'Partial derivatives, total differential and the chain rule',
        "Euler's theorem for homogeneous functions",
        'Jacobians and their properties, including functional dependence',
        'Taylor expansion for two variables',
        'Maxima, minima and saddle points using the second derivative test',
      ],
      explanationMd: `# Partial Differentiation & Jacobians

### Partial Derivatives and the Total Differential
A partial derivative differentiates with respect to one variable holding the others constant. The **total differential** dz = (dz/dx)dx + (dz/dy)dy approximates the change in z, and the **chain rule** extends it to composed functions.

### Euler's Theorem
If f(x, y) is homogeneous of degree n, then:

x (df/dx) + y (df/dy) = n f

This gives a fast verification test for homogeneity and appears frequently as a proof question.

### Jacobians
The Jacobian of the transformation u = u(x, y), v = v(x, y) is:

J = |du/dx  du/dy; dv/dx  dv/dy|

Key properties: the Jacobian of the inverse transformation is 1/J; the Jacobian of a composite transformation is the product of the Jacobians; and if the Jacobian vanishes identically the functions are **functionally dependent**, which is the standard test for dependence.

### Extrema of Two Variables
For a stationary point where f_x = f_y = 0, compute r = f_xx, s = f_xy, t = f_yy and evaluate D = rt - s^2:
- D > 0 and r < 0 → local maximum
- D > 0 and r > 0 → local minimum
- D < 0 → saddle point
- D = 0 → the test is inconclusive

### Lagrange Multipliers
Constrained optimisation introduces a multiplier lambda through the auxiliary function F = f + lambda g, converting the constraint into an additional stationary condition — the standard method for optimising a function on a curve or surface.`,
      formulas: [
        {
          id: 'formula-cal-3',
          label: "Euler's Theorem for Homogeneous Functions",
          formula: 'x f_x + y f_y = n f, where f is homogeneous of degree n',
          exampleQ: 'Verify Euler\u2019s theorem for f(x, y) = x^3 + 3x^2 y + y^3.',
          exampleA:
            'f_x = 3x^2 + 6xy, f_y = 3x^2 + 3y^2. x f_x + y f_y = 3x^3 + 6x^2 y + 3x^2 y + 3y^3 = 3(x^3 + 3x^2 y + y^3) = 3f. Degree n = 3, confirmed.',
        },
        {
          id: 'formula-cal-4',
          label: 'Second Derivative Test for Two Variables',
          formula: 'D = f_xx f_yy - (f_xy)^2; max if D > 0 and f_xx < 0, min if D > 0 and f_xx > 0, saddle if D < 0',
          exampleQ: 'Classify the stationary point of f(x, y) = x^3 + y^3 - 3xy.',
          exampleA:
            'f_x = 3x^2 - 3y = 0 and f_y = 3y^2 - 3x = 0 give (1, 1). f_xx = 6x = 6, f_yy = 6y = 6, f_xy = -3. D = 36 - 9 = 27 > 0 and f_xx > 0, so (1, 1) is a local minimum with f = -1.',
        },
      ],
      tricks: [
        {
          id: 'trick-cal-2',
          title: 'D = rt - s^2 Sign Decides Everything',
          trick:
            'Compute D first. If D is negative the point is a saddle and you can stop — no need to examine the sign of r. This saves a step in every extremum problem.',
          whenToUse: 'Maxima and minima of functions of two variables.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-cal-3',
          step: 'Step 1: Solve the Simultaneous Stationary Conditions',
          detail:
            'Set both first partial derivatives to zero and solve the resulting system for all candidate points, including the origin where applicable.',
          questionType: 'Extrema Problem',
        },
        {
          id: 'solve-cal-4',
          step: 'Step 2: Evaluate the Second Order Partial Derivatives and D',
          detail:
            'Compute r, s and t at each candidate, form D = rt - s^2 and classify, stating the function value at any extremum.',
          questionType: 'Extrema Problem',
        },
      ],
    },
    {
      id: 'cal-mod3-multiple-integrals',
      subjectId: 'bsc-karnataka-calculus',
      title: 'Multiple Integrals, Change of Order & Beta-Gamma Functions',
      moduleNumber: 3,
      moduleName: 'Module 3: Multiple Integration',
      order: 3,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-cal-mod3-01', 'q-cal-mod3-02'],
      subtopics: [
        'Double integrals over rectangular and general regions',
        'Change of order of integration and its evaluation advantage',
        'Transformation of variables and the Jacobian factor',
        'Triple integrals, volume computation and cylindrical / spherical coordinates',
        'Beta and Gamma functions and their interrelation',
      ],
      explanationMd: `# Multiple Integrals

### Double Integrals
A double integral over a region R is evaluated as an iterated integral. For a **rectangular region** the limits are constants and the order is irrelevant. For a **general region** the inner limits are functions of the outer variable, so the order matters and must be chosen to match the region's geometry.

### Change of Order
Changing the order of integration is necessary when the inner integral cannot be evaluated in closed form — the classic case is the integral of e^(-y^2) with respect to y, which has no elementary antiderivative but becomes tractable if x is integrated first. The procedure is:
1. Sketch the region from the given limits.
2. Re-express the boundary curves to make the other variable the inner one.
3. Rewrite the limits and evaluate.

### Change of Variables
Under a transformation x = x(u, v), y = y(u, v):

integral f(x,y) dx dy = integral f(x(u,v), y(u,v)) |J| du dv

where J is the Jacobian. Polar coordinates (J = r), cylindrical (J = r) and spherical (J = rho^2 sin phi) are the standard cases.

### Beta and Gamma Functions
The Gamma function Gamma(n) = integral from 0 to infinity of e^(-t) t^(n-1) dt satisfies Gamma(n+1) = n Gamma(n) and Gamma(n) = (n-1)! for positive integers. The Beta function B(m, n) relates through:

B(m, n) = Gamma(m) Gamma(n) / Gamma(m + n)

Together they evaluate a large family of definite integrals that are otherwise intractable, which is why Karnataka papers set them every year.`,
      formulas: [
        {
          id: 'formula-cal-5',
          label: 'Beta-Gamma Relation',
          formula: 'B(m, n) = Gamma(m) Gamma(n) / Gamma(m + n)',
          exampleQ: 'Evaluate the integral from 0 to 1 of x^2 (1-x)^4 dx.',
          exampleA:
            'This is B(3, 5) = Gamma(3) Gamma(5) / Gamma(8) = (2! x 4!) / 7! = (2 x 24) / 5040 = 48 / 5040 = 1/105.',
        },
        {
          id: 'formula-cal-6',
          label: 'Jacobian in Polar Coordinates',
          formula: 'dx dy = r dr dtheta',
          exampleQ: 'Evaluate the double integral of (x^2 + y^2) over the circle x^2 + y^2 = a^2.',
          exampleA:
            'In polar form: integral over theta 0 to 2pi and r 0 to a of r^2 * r dr dtheta = 2pi x [r^4/4] from 0 to a = 2pi a^4 / 4 = pi a^4 / 2.',
        },
      ],
      tricks: [
        {
          id: 'trick-cal-3',
          title: 'Always Sketch Before Changing Order',
          trick:
            'Draw the region from the original limits before rewriting them. Attempting to swap limits algebraically without the sketch is the single most common source of wrong bounds in double integrals.',
          whenToUse: 'Every change-of-order problem.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-cal-5',
          step: 'Step 1: Sketch the Region and Read Off the Boundaries',
          detail:
            'Plot each bounding curve, shade the region of integration, and identify which variable has functional limits.',
          questionType: 'Multiple Integral Problem',
        },
        {
          id: 'solve-cal-6',
          step: 'Step 2: Rewrite the Limits in the New Order and Evaluate',
          detail:
            'Express the boundaries with the roles of the variables interchanged, insert the Jacobian if a transformation is used, and integrate the inner integral first.',
          questionType: 'Multiple Integral Problem',
        },
      ],
    },
    {
      id: 'cal-mod4-first-order-de',
      subjectId: 'bsc-karnataka-calculus',
      title: 'First Order First Degree Differential Equations',
      moduleNumber: 4,
      moduleName: 'Module 4: Ordinary Differential Equations I',
      order: 4,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-cal-mod4-01', 'q-cal-mod4-02'],
      subtopics: [
        'Formation of differential equations from families of curves',
        'Variables separable and equations reducible to separable form',
        'Homogeneous equations and the substitution y = vx',
        'Exact equations, integrating factors and the four standard rules',
        'Linear equations of the form dy/dx + Py = Q and applications',
      ],
      explanationMd: `# First Order First Degree Differential Equations

### Classification and Solution Strategy
The first step in any problem is to **classify** the equation, because each type has a fixed solution method:
- **Separable**: dy/dx = f(x) g(y) — separate and integrate directly.
- **Homogeneous**: every term is of the same degree — substitute y = vx so that dy/dx = v + x dv/dx, which reduces it to separable form.
- **Exact**: M dx + N dN = 0 where dM/dy = dN/dx — the solution is the integral of M with respect to x (treating y constant) plus the y-terms of N free of x, equated to a constant.
- **Non-exact**: multiply by an **integrating factor** to make it exact. Four standard rules cover the common cases: IF = e^integral P dx when (My - Nx)/N is a function of x alone; IF = 1/x^m y^n type rules; and IF = x^m y^n for homogeneous M and N.
- **Linear**: dy/dx + P(x) y = Q(x) — multiply by IF = e^integral P dx and integrate both sides.

### Applications
First order equations model radioactive decay, Newton's law of cooling, RC circuit charging, population growth and orthogonal trajectories. In each the physical law translates directly into a separable or linear equation.

### Orthogonal Trajectories
To find curves cutting a given family at right angles, form the differential equation of the family, replace dy/dx with -dx/dy, and solve the resulting equation. This is a standard ten-mark question in Karnataka papers.`,
      formulas: [
        {
          id: 'formula-cal-7',
          label: 'Linear Differential Equation Solution',
          formula: 'y x IF = integral (Q x IF) dx + C, where IF = e^(integral P dx)',
          exampleQ: 'Solve dy/dx + 2y = e^(-x).',
          exampleA:
            'P = 2, Q = e^(-x). IF = e^(2x). y e^(2x) = integral e^(-x) e^(2x) dx = integral e^x dx = e^x + C. Hence y = e^(-x) + C e^(-2x).',
        },
      ],
      tricks: [
        {
          id: 'trick-cal-4',
          title: 'Test Exactness First, Before Any Substitution',
          trick:
            'Compute dM/dy and dN/dx immediately. If they are equal the equation is exact and solvable in two lines. Attempting a substitution on an already exact equation wastes time and usually fails.',
          whenToUse: 'Every first order equation.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-cal-7',
          step: 'Step 1: Classify the Equation',
          detail:
            'Write it in standard form and test in order: separable, homogeneous, exact, then linear. State the classification explicitly — it carries marks.',
          questionType: 'ODE Solution Problem',
        },
        {
          id: 'solve-cal-8',
          step: 'Step 2: Apply the Matching Method and Verify',
          detail:
            'Execute the method for the identified type, obtain the general solution with the arbitrary constant, and verify by differentiating back into the original equation.',
          questionType: 'ODE Solution Problem',
        },
      ],
    },
    {
      id: 'cal-mod5-higher-order-de',
      subjectId: 'bsc-karnataka-calculus',
      title: 'Higher Order Linear Equations & Applications',
      moduleNumber: 5,
      moduleName: 'Module 5: Ordinary Differential Equations II',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-cal-mod5-01', 'q-cal-mod5-02'],
      subtopics: [
        'Linear equations with constant coefficients and the auxiliary equation',
        'Complementary function for real, repeated and complex roots',
        'Particular integral using the inverse operator method',
        'Method of variation of parameters',
        'Applications: simple harmonic motion, LCR circuits and beam deflection',
      ],
      explanationMd: `# Higher Order Linear Differential Equations

### Structure of the Solution
The general solution of a linear non-homogeneous equation is:

y = Complementary Function (CF) + Particular Integral (PI)

The CF solves the homogeneous part and contains as many arbitrary constants as the order of the equation; the PI is any one solution of the full equation.

### Complementary Function
Writing D for d/dx, the auxiliary equation replaces D with m. For a second order equation with roots m1 and m2:
- **Real and distinct**: CF = C1 e^(m1 x) + C2 e^(m2 x)
- **Real and repeated** (m, m): CF = (C1 + C2 x) e^(m x)
- **Complex** (alpha +/- i beta): CF = e^(alpha x) (C1 cos beta x + C2 sin beta x)

### Particular Integral
PI = (1 / f(D)) X. Standard results:
- X = e^(ax): PI = e^(ax) / f(a), provided f(a) is not zero.
- X = sin(ax) or cos(ax): replace D^2 with -a^2.
- X = x^n: expand 1/f(D) as a binomial series in ascending powers of D and operate term by term.

When f(a) = 0 the standard formula fails; multiply by x and re-evaluate, or use the general rule PI = x^r e^(ax) / f^(r)(a) where r is the multiplicity of the root.

### Variation of Parameters
For equations where the operator method is awkward, assume y = u1 y1 + u2 y2 with y1, y2 from the CF, and determine u1, u2 from the standard Wronskian formulas.

### Applications
Second order equations govern simple harmonic motion (mass-spring systems), LCR circuit oscillations and the deflection of beams under load — all standard examination contexts.`,
      formulas: [
        {
          id: 'formula-cal-8',
          label: 'Particular Integral for Exponential Forcing',
          formula: 'PI = (1 / f(D)) e^(ax) = e^(ax) / f(a), when f(a) is not zero',
          exampleQ: 'Find the PI of (D^2 - 3D + 2) y = e^(4x).',
          exampleA:
            'f(D) = D^2 - 3D + 2, so f(4) = 16 - 12 + 2 = 6. PI = e^(4x) / 6.',
        },
      ],
      tricks: [
        {
          id: 'trick-cal-5',
          title: 'Check f(a) Before Using the Exponential PI Formula',
          trick:
            'If f(a) = 0 the formula divides by zero. In that case multiply by x and use f\'(a), or multiply by x^r for a root of multiplicity r. Testing f(a) first prevents the most common PI error.',
          whenToUse: 'All PI computations with exponential forcing.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-cal-9',
          step: 'Step 1: Solve the Auxiliary Equation for the CF',
          detail:
            'Form the auxiliary equation, find its roots and write the CF in the correct form for real distinct, repeated or complex roots.',
          questionType: 'Higher Order ODE Problem',
        },
        {
          id: 'solve-cal-10',
          step: 'Step 2: Compute the PI and Combine',
          detail:
            'Apply the operator rule matching the forcing function, verify that no division by zero occurs, and add the PI to the CF to give the general solution.',
          questionType: 'Higher Order ODE Problem',
        },
      ],
    },
  ],

  // ── 2. Programming & Data Structures (Sem 1) ──
  'bsc-karnataka-programming': [
    {
      id: 'prog-mod1-algorithms',
      subjectId: 'bsc-karnataka-programming',
      title: 'Problem Solving, Algorithms & Flowcharting',
      moduleNumber: 1,
      moduleName: 'Module 1: Foundations of Problem Solving',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-prog-mod1-01', 'q-prog-mod1-02'],
      subtopics: [
        'Problem definition, decomposition and abstraction',
        'Algorithm characteristics: finiteness, definiteness, input, output and effectiveness',
        'Flowchart symbols and structured programming constructs',
        'Pseudocode conventions and top-down design',
        'Debugging, testing and the compile-link-execute cycle',
      ],
      explanationMd: `# Problem Solving & Algorithms

### What Makes an Algorithm
An algorithm must satisfy five properties:
1. **Finiteness** — it must terminate after a finite number of steps.
2. **Definiteness** — every step must be unambiguous.
3. **Input** — zero or more inputs.
4. **Output** — at least one output.
5. **Effectiveness** — every operation must be basic enough to be carried out exactly in finite time.

### Flowchart Symbols
- **Oval (terminal)**: start or stop.
- **Parallelogram**: input or output.
- **Rectangle**: processing or computation.
- **Diamond**: decision, with two outgoing branches.
- **Arrow (flowline)**: direction of control.

### Structured Constructs
Any algorithm can be expressed using only three constructs: **sequence**, **selection** (if-then-else) and **iteration** (loops). This is the content of the structured program theorem, and it is why goto statements are avoided.

### The Program Development Cycle
Write source code, preprocess, compile to object code, link with libraries to form an executable, then execute. Errors are classified as **syntax** (caught by the compiler), **runtime** (such as division by zero) and **logical** (the program runs but produces the wrong answer — the hardest to find).

### Top-Down Design
Complex problems are decomposed into modules, each refined until every step is directly implementable. This modular approach supports testing in isolation and code reuse.`,
      formulas: [
        {
          id: 'formula-prog-1',
          label: 'Algorithm Correctness Criteria',
          formula: 'Valid Algorithm = Finiteness + Definiteness + Input + Output + Effectiveness',
          exampleQ:
            'A procedure repeatedly divides a number by 0.5 without any terminating condition. Which algorithm property does it violate?',
          exampleA:
            'Finiteness. The procedure never terminates, so it is not an algorithm despite being definite and effective in each individual step.',
        },
      ],
      tricks: [
        {
          id: 'trick-prog-1',
          title: 'Trace With a Table',
          trick:
            'For dry-run questions, draw a table with one column per variable and one row per iteration. Manual tracing errors nearly always come from updating the loop variable mentally instead of on paper.',
          whenToUse: 'Output prediction and dry-run questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-prog-1',
          step: 'Step 1: Identify Inputs, Outputs and Constraints',
          detail:
            'State precisely what the program receives, what it must produce, and any boundary conditions such as empty input or zero values.',
          questionType: 'Algorithm Design Question',
        },
        {
          id: 'solve-prog-2',
          step: 'Step 2: Write the Algorithm and Trace It',
          detail:
            'Express the steps in pseudocode, then verify correctness by dry-running with a concrete test case including a boundary value.',
          questionType: 'Algorithm Design Question',
        },
      ],
    },
    {
      id: 'prog-mod2-c-fundamentals',
      subjectId: 'bsc-karnataka-programming',
      title: 'C Programming: Operators, Control Structures & Functions',
      moduleNumber: 2,
      moduleName: 'Module 2: C Programming Fundamentals',
      order: 2,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-prog-mod2-01', 'q-prog-mod2-02'],
      subtopics: [
        'Data types, storage classes and type conversion rules',
        'Operator precedence, associativity and short-circuit evaluation',
        'Selection (if-else, switch) and iteration (for, while, do-while) constructs',
        'Functions, parameter passing, scope, recursion and the call stack',
        'Preprocessor directives and the compilation model',
      ],
      explanationMd: `# C Programming Fundamentals

### Data Types and Storage Classes
Basic types are char, int, float and double, with signed/unsigned and size modifiers. **Storage classes** determine scope, lifetime and initial value:
- **auto**: block scope, garbage initial value.
- **static**: block or file scope, lifetime of the program, zero-initialised.
- **extern**: declares a variable defined elsewhere.
- **register**: hints at CPU register allocation.

### Operators
Precedence determines grouping; **associativity** resolves operators of equal precedence, left-to-right for most and right-to-left for assignment and the conditional operator. **Short-circuit evaluation** means in 'a && b' the second operand is not evaluated if the first is false — this behaviour is frequently tested with increment operators.

### Control Structures
'switch' requires an integral or character expression; without 'break' execution falls through to the next case, which is a deliberate feature but a common source of bugs.

### Functions
C passes arguments **by value** — the function receives a copy. To modify the caller's variable, pass its address. **Recursion** requires a base case and a progression toward it; each call pushes a frame onto the call stack, so unbounded recursion causes a stack overflow.

### Storage of Variables
Global variables live in the data segment and are zero-initialised; locals live on the stack; string literals live in read-only memory, which is why modifying a string literal through a pointer is undefined behaviour.`,
      formulas: [
        {
          id: 'formula-prog-2',
          label: 'Call by Reference via Pointers',
          formula: 'void swap(int *a, int *b) { int t = *a; *a = *b; *b = t; }',
          exampleQ:
            'Why does swapping two integers fail when the function is declared as void swap(int a, int b)?',
          exampleA:
            'Because C passes by value, the function modifies only local copies. Passing pointers and dereferencing them with *a and *b allows the function to modify the caller\u2019s actual variables.',
        },
      ],
      tricks: [
        {
          id: 'trick-prog-2',
          title: 'Post-Increment Returns the Old Value',
          trick:
            'In i++ the expression yields the OLD value and i is incremented afterwards; in ++i it yields the NEW value. In output-prediction questions, evaluate the expression value first and update the variable second.',
          whenToUse: 'Every output prediction question involving increment operators.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-prog-3',
          step: 'Step 1: Identify Types and Apply Conversion Rules',
          detail:
            'In mixed expressions the narrower type is promoted to the wider one before the operation, which determines the result type and any truncation.',
          questionType: 'C Output Prediction',
        },
        {
          id: 'solve-prog-4',
          step: 'Step 2: Evaluate Using Precedence, Then Associativity',
          detail:
            'Group by precedence, resolve ties by associativity, apply short-circuit rules, and then trace any loop iteration by iteration.',
          questionType: 'C Output Prediction',
        },
      ],
    },
    {
      id: 'prog-mod3-arrays-pointers',
      subjectId: 'bsc-karnataka-programming',
      title: 'Arrays, Strings & Pointer Arithmetic',
      moduleNumber: 3,
      moduleName: 'Module 3: Arrays and Pointers',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-prog-mod3-01', 'q-prog-mod3-02'],
      subtopics: [
        'One and two dimensional arrays, row-major storage and address calculation',
        'Character arrays, string literals and the null terminator',
        'Pointer arithmetic, pointer to pointer and arrays of pointers',
        'Dynamic memory allocation with malloc, calloc, realloc and free',
        'Standard string library functions and their safe alternatives',
      ],
      explanationMd: `# Arrays, Strings & Pointers

### Array Storage and Addressing
C stores two-dimensional arrays in **row-major order**. For an array A with L lower bound and U upper bound per row, the address of element A[i][j] is:

Address(A[i][j]) = Base + [(i - L1) x N + (j - L2)] x size

where N is the number of columns. This formula is a standard examination question.

### Strings
A C string is a character array terminated by the null character '\\0'. Its **length** (from strlen) excludes the terminator but the **array size** must include it, so a string of n characters needs n + 1 bytes. Forgetting the terminator is the classic cause of buffer overruns.

### Pointer Arithmetic
Adding 1 to a pointer advances it by the size of the pointed-to type, not by one byte. For an int pointer on a 32-bit int, p + 1 advances 4 bytes. Array indexing is defined as pointer arithmetic: a[i] is exactly *(a + i).

### Dynamic Memory
- **malloc(n)** allocates n bytes, uninitialised.
- **calloc(n, size)** allocates n blocks of the given size, zero-initialised.
- **realloc** resizes an existing block, possibly relocating it.
- **free** releases the block; failing to free causes a **memory leak**, and using a pointer after free causes undefined behaviour.

### Common Pitfalls
Returning the address of a local variable, off-by-one errors in loops, and dereferencing an uninitialised pointer are the three errors most often examined.`,
      formulas: [
        {
          id: 'formula-prog-3',
          label: 'Two-Dimensional Array Address (Row Major)',
          formula: 'Address(A[i][j]) = Base + [(i - L1) x N + (j - L2)] x w',
          exampleQ:
            'A[5][6] is stored row-major with base address 1000 and each element occupying 2 bytes, lower bounds 0. Find the address of A[3][4].',
          exampleA:
            'Address = 1000 + [(3 - 0) x 6 + (4 - 0)] x 2 = 1000 + [18 + 4] x 2 = 1000 + 44 = 1044.',
        },
      ],
      tricks: [
        {
          id: 'trick-prog-3',
          title: 'Array Size = Length + 1',
          trick:
            'A string of n visible characters requires an array of n + 1 bytes for the null terminator. When a question gives a string and asks for the array size, always add one.',
          whenToUse: 'String and array declaration questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-prog-5',
          step: 'Step 1: Identify Base Address, Element Size and Row Length',
          detail:
            'Extract the base address, the width of each element in bytes and the number of columns before substituting into the addressing formula.',
          questionType: 'Address Calculation Numerical',
        },
        {
          id: 'solve-prog-6',
          step: 'Step 2: Substitute and Verify With a Known Element',
          detail:
            'Compute the address, then sanity-check by computing the address of A[0][0], which must equal the base address.',
          questionType: 'Address Calculation Numerical',
        },
      ],
    },
    {
      id: 'prog-mod4-stacks-queues',
      subjectId: 'bsc-karnataka-programming',
      title: 'Stacks, Queues & Linked Lists',
      moduleNumber: 4,
      moduleName: 'Module 4: Linear Data Structures',
      order: 4,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-prog-mod4-01', 'q-prog-mod4-02'],
      subtopics: [
        'Stack ADT, push / pop, overflow and underflow conditions',
        'Infix to postfix conversion and postfix evaluation',
        'Queue ADT, circular queue and the full / empty ambiguity',
        'Singly, doubly and circular linked lists with insertion and deletion',
        'Applications: recursion simulation, expression parsing and scheduling',
      ],
      explanationMd: `# Stacks, Queues & Linked Lists

### Stacks
A stack is a LIFO structure supporting push and pop at a single end. **Overflow** occurs on pushing to a full stack; **underflow** on popping from an empty one. Applications include function call management, expression evaluation, backtracking and undo operations.

### Expression Conversion
Infix to postfix uses an operator stack with precedence comparison:
1. Operands go directly to the output.
2. Operators are pushed after popping any stack operator of equal or higher precedence.
3. A left parenthesis is pushed; a right parenthesis pops until the matching left parenthesis.

Postfix evaluation is simpler still: scan left to right, push operands, and on an operator pop two operands, apply and push the result.

### Queues
A queue is FIFO with insertion at the rear and deletion at the front. In a linear array implementation, space is wasted as elements are dequeued, so the **circular queue** treats the array as a ring using modulo arithmetic. The full/empty ambiguity is resolved either by keeping one slot unused or by maintaining a separate count.

### Linked Lists
A linked list stores nodes of data plus a pointer to the next node.
- **Singly linked**: one pointer, forward traversal only.
- **Doubly linked**: next and previous pointers, bidirectional traversal, more memory per node.
- **Circular**: the last node points back to the first, useful for round-robin scheduling.

Insertion at the head is O(1); searching is O(n). Linked lists avoid the fixed-size limitation of arrays at the cost of losing random access.`,
      formulas: [
        {
          id: 'formula-prog-4',
          label: 'Circular Queue Full and Empty Conditions',
          formula: 'Empty: front == rear; Full: (rear + 1) mod n == front',
          exampleQ:
            'A circular queue of size 5 has front = 3 and rear = 2. Is it empty or full?',
          exampleA:
            'Since (rear + 1) mod 5 = 3 = front, the queue is full. It holds 4 elements, not 5, because one slot is sacrificed to disambiguate full from empty.',
        },
      ],
      tricks: [
        {
          id: 'trick-prog-4',
          title: 'Postfix Evaluation: Pop the Right Operand First',
          trick:
            'When evaluating postfix, the FIRST value popped is the RIGHT operand. For "6 2 -" you pop 2 then 6 and compute 6 - 2 = 4, not 2 - 6. Reversing this is the most common evaluation error.',
          whenToUse: 'Postfix and prefix evaluation questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-prog-7',
          step: 'Step 1: Build the Trace Table',
          detail:
            'For stack or queue problems, draw the structure after every operation and note the top, front and rear pointers at each stage.',
          questionType: 'Data Structure Trace Question',
        },
        {
          id: 'solve-prog-8',
          step: 'Step 2: Check Boundary Conditions Explicitly',
          detail:
            'Verify overflow and underflow conditions at each step, and state the final contents of the structure in order.',
          questionType: 'Data Structure Trace Question',
        },
      ],
    },
    {
      id: 'prog-mod5-complexity',
      subjectId: 'bsc-karnataka-programming',
      title: 'Algorithm Complexity, Searching & Sorting',
      moduleNumber: 5,
      moduleName: 'Module 5: Complexity Analysis and Algorithms',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-prog-mod5-01', 'q-prog-mod5-02'],
      subtopics: [
        'Time and space complexity, Big-O, Omega and Theta notation',
        'Linear and binary search with complexity comparison',
        'Bubble, selection, insertion, merge and quick sort',
        'Best, average and worst case analysis',
        'Stability of sorting algorithms and their practical trade-offs',
      ],
      explanationMd: `# Complexity, Searching & Sorting

### Asymptotic Notation
- **Big-O**: an upper bound — the algorithm is no worse than this.
- **Omega**: a lower bound — the algorithm is at least this.
- **Theta**: a tight bound — both simultaneously.

Complexity is expressed as a function of input size n, discarding constants and lower-order terms, because these dominate only for small n.

### Searching
- **Linear search**: O(n), works on unsorted data.
- **Binary search**: O(log n) but requires a sorted array. Each comparison halves the search space; for n = 1024 at most 10 comparisons are needed.

### Sorting Complexity
| Algorithm | Best | Average | Worst | Space | Stable |
|---|---|---|---|---|---|
| Bubble | O(n) | O(n^2) | O(n^2) | O(1) | Yes |
| Selection | O(n^2) | O(n^2) | O(n^2) | O(1) | No |
| Insertion | O(n) | O(n^2) | O(n^2) | O(1) | Yes |
| Merge | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick | O(n log n) | O(n log n) | O(n^2) | O(log n) | No |

**Insertion sort** is efficient on nearly sorted data (approaching O(n)) and is therefore used for small partitions inside quicksort implementations. **Quicksort** degrades to O(n^2) when the pivot choice is poor — for example choosing the first element of an already sorted array.

### Stability
A sort is **stable** if equal elements retain their original relative order. Stability matters when sorting on multiple keys sequentially — sorting by name then by roll number preserves the roll-number ordering within each name only if the sort is stable.`,
      formulas: [
        {
          id: 'formula-prog-5',
          label: 'Binary Search Maximum Comparisons',
          formula: 'Max comparisons = floor(log2 n) + 1',
          exampleQ: 'How many comparisons at most does binary search need for 1,000 elements?',
          exampleA: 'floor(log2 1000) + 1 = 9 + 1 = 10 comparisons, since 2^9 = 512 < 1000 <= 1024 = 2^10.',
        },
      ],
      tricks: [
        {
          id: 'trick-prog-5',
          title: 'Quicksort Worst Case Is Sorted Input',
          trick:
            'Quicksort\u2019s worst case O(n^2) occurs on already sorted (or reverse sorted) input when the first or last element is the pivot. Stating the CAUSE, not just the bound, is what earns the mark.',
          whenToUse: 'Sorting complexity comparison questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-prog-9',
          step: 'Step 1: Count the Dominant Operation',
          detail:
            'Identify the basic operation (usually a comparison) and express how many times it executes as a function of n.',
          questionType: 'Complexity Analysis Question',
        },
        {
          id: 'solve-prog-10',
          step: 'Step 2: Simplify to the Dominant Term and Compare',
          detail:
            'Discard constants and lower-order terms, state the Big-O class, and compare with the alternative algorithm on the same input size.',
          questionType: 'Complexity Analysis Question',
        },
      ],
    },
  ],

  // ── 3. Real Analysis (Sem 2) ──
  'bsc-karnataka-real-analysis': [
    {
      id: 'ra-mod1-real-numbers',
      subjectId: 'bsc-karnataka-real-analysis',
      title: 'The Real Number System, Supremum & Completeness',
      moduleNumber: 1,
      moduleName: 'Module 1: The Real Number System',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-ra-mod1-01', 'q-ra-mod1-02'],
      subtopics: [
        'Field and order axioms of the real numbers',
        'Upper and lower bounds, supremum and infimum',
        'The completeness axiom and the least upper bound property',
        'Archimedean property and density of rationals',
        'Countable and uncountable sets, and Cantor\u2019s diagonal argument',
      ],
      explanationMd: `# The Real Number System

### Supremum versus Maximum
This distinction is the foundation of analysis. A set S is **bounded above** if some number M satisfies s <= M for all s in S. The **supremum** (least upper bound) is the smallest such M. Crucially, the supremum need not belong to S:
- For S = (0, 1), sup S = 1 but 1 is not in S, so S has no maximum.
- For S = [0, 1], sup S = max S = 1.

A number u is the supremum of S if and only if (i) u is an upper bound, and (ii) for every epsilon > 0 there exists s in S with u - epsilon < s. Condition (ii) is what distinguishes the *least* upper bound and is the form used in every proof.

### The Completeness Axiom
Every non-empty set of real numbers that is bounded above has a least upper bound in R. This is what the rational numbers lack: the set {q in Q : q^2 < 2} is bounded above but has no supremum in Q. Completeness is the property that makes calculus rigorous.

### Consequences
From completeness follow the **Archimedean property** (for any positive x there is a natural number n with n > x), the **density of the rationals** (between any two reals lies a rational), and the **nested interval property**.

### Cardinality
A set is **countable** if its elements can be placed in one-to-one correspondence with the natural numbers; the rationals are countable. Cantor's diagonal argument proves the reals are **uncountable**, so "most" real numbers are irrational.`,
      formulas: [
        {
          id: 'formula-ra-1',
          label: 'Characterisation of the Supremum',
          formula: 'u = sup S if and only if (i) s <= u for all s in S, and (ii) for every epsilon > 0 there exists s in S with u - epsilon < s',
          exampleQ: 'Prove that sup S = 1 for S = {n / (n + 1) : n is a natural number}.',
          exampleA:
            '(i) n/(n+1) < 1 for every n, so 1 is an upper bound. (ii) Given epsilon > 0, choose n > (1 - epsilon)/epsilon; then n/(n+1) > 1 - epsilon. Both conditions hold, so sup S = 1. Note S has no maximum since n/(n+1) never equals 1.',
        },
      ],
      tricks: [
        {
          id: 'trick-ra-1',
          title: 'Sup Need Not Be a Maximum',
          trick:
            'Always check whether the supremum belongs to the set. Open intervals and sets defined by strict inequalities have a supremum but no maximum — stating this explicitly earns a mark in almost every such question.',
          whenToUse: 'Supremum and infimum problems.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ra-1',
          step: 'Step 1: Verify the Candidate Is an Upper Bound',
          detail:
            'Show algebraically that the proposed value is greater than or equal to every element of the set.',
          questionType: 'Supremum Proof',
        },
        {
          id: 'solve-ra-2',
          step: 'Step 2: Verify the Leastness Condition',
          detail:
            'For an arbitrary epsilon > 0, construct an explicit element of the set exceeding sup minus epsilon. This second step is where most marks are lost.',
          questionType: 'Supremum Proof',
        },
      ],
    },
    {
      id: 'ra-mod2-sequences',
      subjectId: 'bsc-karnataka-real-analysis',
      title: 'Sequences, Convergence & Convergence Tests',
      moduleNumber: 2,
      moduleName: 'Module 2: Sequences and Series',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-ra-mod2-01', 'q-ra-mod2-02'],
      subtopics: [
        'Definition of convergence using the epsilon-N criterion',
        'Uniqueness of the limit and boundedness of convergent sequences',
        'Monotone sequences and the monotone convergence theorem',
        'Cauchy sequences and the Cauchy criterion',
        'Bolzano-Weierstrass theorem and limit points',
      ],
      explanationMd: `# Sequences & Convergence

### The Epsilon-N Definition
A sequence (a_n) converges to L if for every epsilon > 0 there exists a natural number N such that |a_n - L| < epsilon for all n > N. The order of quantifiers matters: epsilon is given first, then N is chosen in response.

A proof therefore always proceeds: "Let epsilon > 0 be given. Choose N = ... . Then for n > N we have |a_n - L| = ... < epsilon."

### Fundamental Results
- The limit of a convergent sequence is **unique**.
- Every convergent sequence is **bounded** (the converse is false: (-1)^n is bounded but divergent).
- Convergent sequences preserve algebraic operations: limits of sums, products and quotients combine as expected.

### The Squeeze Theorem
If a_n <= b_n <= c_n for all sufficiently large n, and both a_n and c_n converge to L, then b_n also converges to L. This is the standard tool for sequences involving oscillating factors.

### Monotone Convergence Theorem
Every bounded monotone sequence converges. This is a direct consequence of completeness and is often easier to apply than the definition, since it avoids constructing N explicitly.

### Cauchy Sequences
A sequence is **Cauchy** if its terms eventually become arbitrarily close to each other, without reference to a limit. In the real numbers, a sequence converges if and only if it is Cauchy — completeness again.

### Bolzano-Weierstrass
Every bounded sequence of real numbers has a convergent subsequence. This underpins many existence proofs in analysis and optimisation.`,
      formulas: [
        {
          id: 'formula-ra-2',
          label: 'Epsilon-N Convergence Criterion',
          formula: 'a_n → L if and only if: for every epsilon > 0 there exists N such that n > N implies |a_n - L| < epsilon',
          exampleQ: 'Prove from the definition that the sequence a_n = n / (n + 1) converges to 1.',
          exampleA:
            'Let epsilon > 0. Then |a_n - 1| = |n/(n+1) - 1| = 1/(n+1) < 1/n. Choose N = ceil(1/epsilon). For n > N we have 1/n < epsilon, hence |a_n - 1| < epsilon. Therefore a_n converges to 1.',
        },
      ],
      tricks: [
        {
          id: 'trick-ra-2',
          title: 'Bounded Does Not Imply Convergent',
          trick:
            'The standard counterexample is (-1)^n: bounded between -1 and 1 but oscillating, so divergent. Quoting this single example settles most true/false questions on the relationship.',
          whenToUse: 'True/false and counterexample questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ra-3',
          step: 'Step 1: Conjecture the Limit',
          detail:
            'Divide numerator and denominator by the dominant power of n, or inspect the first few terms, to identify the candidate limit L.',
          questionType: 'Convergence Proof',
        },
        {
          id: 'solve-ra-4',
          step: 'Step 2: Bound |a_n - L| and Solve for N',
          detail:
            'Simplify |a_n - L|, overestimate it by a simpler expression in n, then choose N so that this bound is below epsilon for all n > N.',
          questionType: 'Convergence Proof',
        },
      ],
    },
    {
      id: 'ra-mod3-limits-continuity',
      subjectId: 'bsc-karnataka-real-analysis',
      title: 'Limits, Continuity & the Intermediate Value Theorem',
      moduleNumber: 3,
      moduleName: 'Module 3: Continuity',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-ra-mod3-01', 'q-ra-mod3-02'],
      subtopics: [
        'Epsilon-delta definition of the limit of a function',
        'Left and right hand limits and existence of the limit',
        'Continuity at a point, on an interval and types of discontinuity',
        'Intermediate Value Theorem and its applications',
        'Extreme Value Theorem and continuity on closed bounded intervals',
      ],
      explanationMd: `# Limits & Continuity

### The Epsilon-Delta Definition
lim as x approaches a of f(x) = L means: for every epsilon > 0 there exists delta > 0 such that 0 < |x - a| < delta implies |f(x) - L| < epsilon.

Note the condition 0 < |x - a|: the limit concerns the behaviour *near* a, not the value *at* a. A function may have a limit at a point where it is undefined or takes a different value.

### Continuity
f is continuous at a if three conditions hold simultaneously:
1. f(a) is defined,
2. the limit of f as x approaches a exists,
3. the limit equals f(a).

Failure of any one produces a discontinuity:
- **Removable**: the limit exists but differs from f(a) or f(a) is undefined — fixable by redefinition.
- **Jump**: left and right limits both exist but differ.
- **Infinite**: the function diverges to infinity, as 1/x at 0.
- **Oscillatory**: the limit fails to exist, as sin(1/x) at 0.

### Intermediate Value Theorem
If f is continuous on [a, b] and k lies between f(a) and f(b), there exists c in (a, b) with f(c) = k. A key application is proving the existence of roots: if f(a) and f(b) have opposite signs, a root lies between them.

### Extreme Value Theorem
A function continuous on a **closed and bounded** interval attains both a maximum and a minimum. The interval must be closed and bounded — f(x) = 1/x on (0, 1) is continuous but unbounded, showing that the hypotheses cannot be weakened.

### Uniform Continuity
A function is uniformly continuous if a single delta works for the whole domain, independent of the point. Every continuous function on a closed bounded interval is uniformly continuous.`,
      formulas: [
        {
          id: 'formula-ra-3',
          label: 'Epsilon-Delta Limit Definition',
          formula: 'lim x→a f(x) = L if and only if: for every epsilon > 0 there exists delta > 0 with 0 < |x - a| < delta implying |f(x) - L| < epsilon',
          exampleQ: 'Prove that the limit as x approaches 2 of (3x + 1) is 7.',
          exampleA:
            'Let epsilon > 0. |(3x + 1) - 7| = |3x - 6| = 3|x - 2|. Choose delta = epsilon / 3. Then 0 < |x - 2| < delta gives |f(x) - 7| = 3|x - 2| < 3 delta = epsilon.',
        },
      ],
      tricks: [
        {
          id: 'trick-ra-3',
          title: 'Work Backwards From |f(x) - L| < epsilon',
          trick:
            'Start with the target inequality, manipulate it algebraically until |x - a| appears alone, and read off delta from the coefficient. Never guess delta first.',
          whenToUse: 'Every epsilon-delta proof.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ra-5',
          step: 'Step 1: Test the Three Continuity Conditions',
          detail:
            'Check that f(a) exists, that the limit exists (comparing left and right limits), and that the two agree.',
          questionType: 'Continuity Classification',
        },
        {
          id: 'solve-ra-6',
          step: 'Step 2: Classify the Discontinuity Precisely',
          detail:
            'If a condition fails, name the type — removable, jump, infinite or oscillatory — and state whether redefinition at the point could remove it.',
          questionType: 'Continuity Classification',
        },
      ],
    },
    {
      id: 'ra-mod4-differentiability',
      subjectId: 'bsc-karnataka-real-analysis',
      title: 'Differentiability & the Mean Value Theorems',
      moduleNumber: 4,
      moduleName: 'Module 4: Differentiation',
      order: 4,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-ra-mod4-01', 'q-ra-mod4-02'],
      subtopics: [
        'Derivative from first principles and the difference quotient',
        'Differentiability implies continuity but not conversely',
        "Rolle's theorem and its geometric interpretation",
        "Lagrange's and Cauchy's mean value theorems",
        "Taylor's theorem with remainder and higher order derivatives",
      ],
      explanationMd: `# Differentiability & Mean Value Theorems

### Differentiability and Continuity
A function differentiable at a point is necessarily continuous there, but the converse fails. The canonical counterexample is f(x) = |x| at 0: continuous, but the left derivative is -1 and the right derivative is +1, so no derivative exists. Conversely, a discontinuous function can never be differentiable at that point.

### Rolle's Theorem
If f is continuous on [a, b], differentiable on (a, b), and f(a) = f(b), then there exists c in (a, b) with f'(c) = 0. Geometrically: a smooth curve returning to its starting height must have a horizontal tangent somewhere.

### Lagrange's Mean Value Theorem
Under the same continuity and differentiability hypotheses (without requiring f(a) = f(b)), there exists c in (a, b) with:

f'(c) = [f(b) - f(a)] / (b - a)

The derivative at some interior point equals the slope of the chord joining the endpoints. Rolle's theorem is the special case where that chord is horizontal.

### Cauchy's Mean Value Theorem
For two functions f and g satisfying the hypotheses, with g'(x) never zero:

[f(b) - f(a)] / [g(b) - g(a)] = f'(c) / g'(c)

This generalises Lagrange and is the engine behind the proof of L'Hospital's rule.

### Consequences
The mean value theorem yields: a function with zero derivative throughout an interval is constant; a positive derivative implies strictly increasing; and it provides the error term in Taylor's theorem, which underpins numerical approximation.`,
      formulas: [
        {
          id: 'formula-ra-4',
          label: "Lagrange's Mean Value Theorem",
          formula: "f'(c) = [f(b) - f(a)] / (b - a) for some c in (a, b)",
          exampleQ: 'Find c for f(x) = x^2 on [1, 3] as guaranteed by the mean value theorem.',
          exampleA:
            "[f(3) - f(1)] / (3 - 1) = (9 - 1)/2 = 4. Setting f'(c) = 2c = 4 gives c = 2, which lies in (1, 3).",
        },
      ],
      tricks: [
        {
          id: 'trick-ra-4',
          title: "Rolle Is Lagrange With a Flat Chord",
          trick:
            "Always verify Lagrange by first computing the chord slope, then solving f'(c) = that slope, and finally CHECK that the resulting c lies strictly inside (a, b). A c outside the interval means the theorem's hypotheses fail.",
          whenToUse: 'All mean value theorem problems.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ra-7',
          step: 'Step 1: Verify the Hypotheses',
          detail:
            'Confirm continuity on the closed interval and differentiability on the open interval, noting any point where either fails.',
          questionType: 'Mean Value Theorem Problem',
        },
        {
          id: 'solve-ra-8',
          step: 'Step 2: Compute the Chord Slope and Solve for c',
          detail:
            'Evaluate [f(b) - f(a)]/(b - a), equate to the derivative and solve, then verify that the value of c lies strictly between a and b.',
          questionType: 'Mean Value Theorem Problem',
        },
      ],
    },
    {
      id: 'ra-mod5-riemann-integration',
      subjectId: 'bsc-karnataka-real-analysis',
      title: 'Riemann Integration & the Fundamental Theorem of Calculus',
      moduleNumber: 5,
      moduleName: 'Module 5: Riemann Integration',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-ra-mod5-01', 'q-ra-mod5-02'],
      subtopics: [
        'Partitions, upper and lower Darboux sums',
        'Riemann integrability and the Darboux criterion',
        'Properties of the definite integral and the mean value theorem for integrals',
        'The Fundamental Theorem of Calculus, both parts',
        'Riemann integrable versus Lebesgue integrable functions',
      ],
      explanationMd: `# Riemann Integration

### Darboux Sums
A **partition** P divides [a, b] into subintervals. For each subinterval take the supremum M_k and infimum m_k of f. Then:
- **Upper sum** U(P, f) = sum of M_k (x_k - x_(k-1))
- **Lower sum** L(P, f) = sum of m_k (x_k - x_(k-1))

Refining a partition can only decrease the upper sum and increase the lower sum, so L(P, f) <= U(P, f) always.

### Integrability Criterion
f is Riemann integrable on [a, b] if and only if for every epsilon > 0 there exists a partition P with U(P, f) - L(P, f) < epsilon. Equivalently, the supremum of all lower sums equals the infimum of all upper sums.

A useful sufficient condition: every bounded function with only finitely many discontinuities on [a, b] is Riemann integrable. The **Dirichlet function** — 1 on rationals, 0 on irrationals — is the classic non-integrable example, because every subinterval contains both rationals and irrationals, so U = b - a and L = 0 for every partition.

### Fundamental Theorem of Calculus
**Part 1**: if f is continuous on [a, b] and F(x) = integral from a to x of f(t) dt, then F'(x) = f(x). Integration and differentiation are inverse operations.

**Part 2**: if f is continuous on [a, b] and F is any antiderivative of f, then the integral from a to b of f(x) dx = F(b) - F(a).

### Mean Value Theorem for Integrals
If f is continuous on [a, b], there exists c in [a, b] with:

integral from a to b of f(x) dx = f(c) (b - a)

The value f(c) is the **average value** of f on the interval.`,
      formulas: [
        {
          id: 'formula-ra-5',
          label: 'Darboux Integrability Criterion',
          formula: 'f is Riemann integrable if and only if sup L(P, f) = inf U(P, f)',
          exampleQ:
            'Show that the Dirichlet function on [0, 1] is not Riemann integrable.',
          exampleA:
            'Every subinterval contains both rational and irrational points, so M_k = 1 and m_k = 0 for every subinterval of every partition. Hence U(P, f) = 1 and L(P, f) = 0 for all P. Since 0 is not equal to 1, the function is not Riemann integrable.',
        },
        {
          id: 'formula-ra-6',
          label: 'Average Value of a Function',
          formula: 'Average value = (1 / (b - a)) x integral from a to b of f(x) dx',
          exampleQ: 'Find the average value of f(x) = x^2 on [0, 3].',
          exampleA: 'Average = (1/3) x integral 0 to 3 of x^2 dx = (1/3) x [x^3/3] from 0 to 3 = (1/3) x 9 = 3.',
        },
      ],
      tricks: [
        {
          id: 'trick-ra-5',
          title: 'Compare U and L Directly',
          trick:
            'To prove non-integrability, exhibit that U(P, f) and L(P, f) are constant across all partitions and unequal. That single observation is a complete proof — no epsilon argument needed.',
          whenToUse: 'Integrability proof questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-ra-9',
          step: 'Step 1: Construct the Partition and Compute M_k and m_k',
          detail:
            'Divide the interval, and for each subinterval find the supremum and infimum of f using its monotonicity on that subinterval.',
          questionType: 'Riemann Integration Proof',
        },
        {
          id: 'solve-ra-10',
          step: 'Step 2: Form the Difference and Take the Limit',
          detail:
            'Compute U - L, show it can be made smaller than any epsilon by refining the partition, and conclude integrability with the value of the integral.',
          questionType: 'Riemann Integration Proof',
        },
      ],
    },
  ],

  // ── 4. Probability & Statistical Distributions (Sem 2) ──
  'bsc-karnataka-probability': [
    {
      id: 'prob-mod1-axioms',
      subjectId: 'bsc-karnataka-probability',
      title: 'Axiomatic Probability, Conditional Probability & Bayes Theorem',
      moduleNumber: 1,
      moduleName: 'Module 1: Probability Theory',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-prob-mod1-01', 'q-prob-mod1-02'],
      subtopics: [
        'Sample space, events, and the classical, relative frequency and axiomatic approaches',
        "Kolmogorov's three axioms and their immediate consequences",
        'Addition and multiplication theorems of probability',
        'Conditional probability and the concept of independence',
        "Bayes' theorem, prior and posterior probabilities, and base rate neglect",
      ],
      explanationMd: `# Axiomatic Probability & Bayes Theorem

### Kolmogorov's Axioms
For a sample space S and events defined on it:
1. P(A) >= 0 for every event A.
2. P(S) = 1.
3. For mutually exclusive events A1, A2, ..., P(union) = sum of P(Ai).

Everything else follows: P(empty set) = 0, P(A') = 1 - P(A), and 0 <= P(A) <= 1.

### Addition and Multiplication
- **Addition**: P(A or B) = P(A) + P(B) - P(A and B). The subtraction removes the double-counted intersection.
- **Multiplication**: P(A and B) = P(A) x P(B | A).

### Independence
A and B are independent if P(A and B) = P(A) P(B), equivalently P(A | B) = P(A). Independence must not be confused with mutual exclusivity: mutually exclusive events with positive probability are *maximally dependent*, since the occurrence of one guarantees the other does not occur.

### Bayes' Theorem
Given a partition B1, ..., Bn of S and an observed event A:

P(Bi | A) = P(A | Bi) P(Bi) / sum over j of P(A | Bj) P(Bj)

This converts a **prior** probability into a **posterior** one using observed evidence, and is the foundation of Bayesian inference.

### Base Rate Neglect
A medical test 99% accurate for a disease affecting 1 in 10,000 people yields a positive predictive value of only about 1%, because false positives from the far larger healthy population overwhelm true positives. Ignoring the prior (base rate) is the most common probabilistic error in reasoning and a favourite examination question.`,
      formulas: [
        {
          id: 'formula-prob-1',
          label: "Bayes' Theorem",
          formula: 'P(Bi | A) = P(A | Bi) P(Bi) / sum over j of [P(A | Bj) P(Bj)]',
          exampleQ:
            'A disease affects 1% of a population. A test is 95% sensitive and 90% specific. What is the probability that a person with a positive result actually has the disease?',
          exampleA:
            'P(D) = 0.01, P(+|D) = 0.95, P(+|no D) = 0.10. P(D|+) = (0.95 x 0.01) / [(0.95 x 0.01) + (0.10 x 0.99)] = 0.0095 / 0.1085 = 0.0876, about 8.8%. Despite the test being 95% sensitive, fewer than one in eleven positives are true positives.',
        },
      ],
      tricks: [
        {
          id: 'trick-prob-1',
          title: 'Build a Two-Way Table',
          trick:
            'For Bayes problems, draw a table of disease/no-disease against positive/negative using a notional population of 10,000. Counting people is far less error-prone than manipulating fractions.',
          whenToUse: 'Every conditional probability and Bayes problem.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-prob-1',
          step: 'Step 1: Identify the Prior, the Likelihood and the Evidence',
          detail:
            'Write down P(Bi), P(A | Bi) and the complementary false positive rate before substituting anything.',
          questionType: 'Bayes Theorem Numerical',
        },
        {
          id: 'solve-prob-2',
          step: 'Step 2: Compute the Total Probability and Then the Posterior',
          detail:
            'Find P(A) by summing over all partitions, divide the relevant product by it, and interpret the posterior in plain language.',
          questionType: 'Bayes Theorem Numerical',
        },
      ],
    },
    {
      id: 'prob-mod2-random-variables',
      subjectId: 'bsc-karnataka-probability',
      title: 'Random Variables, Expectation & Moment Generating Functions',
      moduleNumber: 2,
      moduleName: 'Module 2: Random Variables',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-prob-mod2-01', 'q-prob-mod2-02'],
      subtopics: [
        'Discrete and continuous random variables, pmf, pdf and cdf',
        'Properties of probability mass and density functions',
        'Mathematical expectation, variance and standard deviation',
        'Moments about the origin and the mean, skewness and kurtosis',
        'Moment generating functions and the uniqueness theorem',
      ],
      explanationMd: `# Random Variables & Expectation

### Random Variables
A random variable maps outcomes of a random experiment to real numbers. It is **discrete** if it takes countably many values, described by a probability mass function p(x); **continuous** if described by a probability density function f(x).

The pmf must satisfy p(x) >= 0 and sum of p(x) = 1. The pdf must satisfy f(x) >= 0 and the integral over the support equals 1. Note that for a continuous variable P(X = a) = 0; probability is only meaningful over intervals.

### The Cumulative Distribution Function
F(x) = P(X <= x). It is non-decreasing, right-continuous, approaches 0 at negative infinity and 1 at positive infinity. For a continuous variable, f(x) = dF/dx.

### Expectation and Variance
For a discrete variable, E(X) = sum of x p(x); for a continuous one, E(X) = integral of x f(x) dx.
- E(aX + b) = a E(X) + b (linearity)
- E(X + Y) = E(X) + E(Y) always, whether or not X and Y are independent
- Var(X) = E(X^2) - [E(X)]^2
- Var(aX + b) = a^2 Var(X)
- Var(X + Y) = Var(X) + Var(Y) only when X and Y are uncorrelated

### Moments
The r-th moment about the origin is mu'_r = E(X^r); about the mean it is mu_r = E[(X - mu)^r]. Then:
- **Skewness** = mu_3 / sigma^3 measures asymmetry.
- **Kurtosis** = mu_4 / sigma^4 measures tail weight; the normal distribution has kurtosis 3.

### Moment Generating Functions
M(t) = E(e^(tX)). Expanding as a power series, the coefficient of t^r / r! is the r-th moment. The **uniqueness theorem** states that if the MGF exists it uniquely determines the distribution, which makes MGFs the standard tool for proving that sums of independent variables follow a particular distribution.`,
      formulas: [
        {
          id: 'formula-prob-2',
          label: 'Variance Computational Formula',
          formula: 'Var(X) = E(X^2) - [E(X)]^2',
          exampleQ:
            'A discrete random variable takes values 1, 2 and 3 with probabilities 0.2, 0.5 and 0.3. Compute E(X) and Var(X).',
          exampleA:
            'E(X) = 1(0.2) + 2(0.5) + 3(0.3) = 0.2 + 1.0 + 0.9 = 2.1. E(X^2) = 1(0.2) + 4(0.5) + 9(0.3) = 0.2 + 2.0 + 2.7 = 4.9. Var(X) = 4.9 - 4.41 = 0.49, so the standard deviation is 0.7.',
        },
      ],
      tricks: [
        {
          id: 'trick-prob-2',
          title: 'Verify Probabilities Sum to 1 First',
          trick:
            'Before computing any expectation, confirm the given probabilities sum to exactly 1. Many exam questions include a missing probability to be found first — skipping this step invalidates everything that follows.',
          whenToUse: 'Every discrete random variable problem.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-prob-3',
          step: 'Step 1: Confirm the Distribution Is Valid',
          detail:
            'Check non-negativity and that the probabilities sum (or integrate) to 1, solving for any unknown constant if present.',
          questionType: 'Random Variable Numerical',
        },
        {
          id: 'solve-prob-4',
          step: 'Step 2: Compute E(X) and E(X^2) in a Table',
          detail:
            'Tabulate x, p(x), x p(x) and x^2 p(x), sum the columns, then apply Var(X) = E(X^2) - [E(X)]^2.',
          questionType: 'Random Variable Numerical',
        },
      ],
    },
    {
      id: 'prob-mod3-discrete-dist',
      subjectId: 'bsc-karnataka-probability',
      title: 'Discrete Distributions: Binomial, Poisson & Geometric',
      moduleNumber: 3,
      moduleName: 'Module 3: Discrete Probability Distributions',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-prob-mod3-01', 'q-prob-mod3-02'],
      subtopics: [
        'Bernoulli trials and the binomial distribution with mean and variance',
        'Fitting a binomial distribution to observed data',
        'The Poisson distribution as a limit of the binomial',
        'Poisson process assumptions and the additive property',
        'Geometric and negative binomial distributions',
      ],
      explanationMd: `# Discrete Distributions

### Binomial Distribution
Applies when there are n independent Bernoulli trials, each with constant success probability p.

P(X = x) = nCx p^x q^(n-x), where q = 1 - p, for x = 0, 1, ..., n

- Mean = np
- Variance = npq
- The distribution is symmetric when p = 0.5, positively skewed when p < 0.5 and negatively skewed when p > 0.5.

The four conditions — fixed number of trials, two outcomes only, constant probability, independence — must all be verified before applying the model.

### Poisson Distribution
Models the number of events in a fixed interval of time or space:

P(X = x) = e^(-lambda) lambda^x / x!

Mean = variance = lambda. It arises as the limit of the binomial when n is large, p is small and np = lambda remains finite — the standard rule of thumb is n >= 50 and p <= 0.05.

The Poisson **process** assumes events occur independently, at a constant average rate, and never simultaneously. The **additive property** states that the sum of independent Poisson variables with parameters lambda1 and lambda2 is Poisson with parameter lambda1 + lambda2 — useful for combining arrival streams.

### Geometric and Negative Binomial
The **geometric** distribution gives the number of trials until the first success: P(X = x) = q^(x-1) p, with mean 1/p. The **negative binomial** generalises this to the number of trials until the r-th success. Both are **memoryless** in the sense that past failures do not change the probability of future success.`,
      formulas: [
        {
          id: 'formula-prob-3',
          label: 'Binomial Probability',
          formula: 'P(X = x) = nCx p^x (1 - p)^(n - x); Mean = np, Variance = np(1 - p)',
          exampleQ:
            'A fair die is rolled 6 times. What is the probability of obtaining exactly 2 sixes?',
          exampleA:
            'n = 6, p = 1/6, x = 2. P = 6C2 (1/6)^2 (5/6)^4 = 15 x 0.02778 x 0.4823 = 0.2009.',
        },
        {
          id: 'formula-prob-4',
          label: 'Poisson Probability',
          formula: 'P(X = x) = e^(-lambda) lambda^x / x!',
          exampleQ:
            'A call centre receives an average of 3 calls per minute. What is the probability of exactly 5 calls in a minute?',
          exampleA:
            'lambda = 3, x = 5. P = e^(-3) 3^5 / 5! = 0.049787 x 243 / 120 = 12.098 / 120 = 0.1008.',
        },
      ],
      tricks: [
        {
          id: 'trick-prob-3',
          title: 'Poisson When Mean Equals Variance',
          trick:
            'If a fitting question gives sample mean approximately equal to sample variance, fit a Poisson distribution. If the variance is less than the mean, fit binomial. This single diagnostic identifies the distribution immediately.',
          whenToUse: 'Distribution fitting problems.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-prob-5',
          step: 'Step 1: Identify the Distribution From the Problem Conditions',
          detail:
            'Check for fixed trials with two outcomes (binomial) or events counted over an interval (Poisson), and extract n, p or lambda accordingly.',
          questionType: 'Distribution Application Problem',
        },
        {
          id: 'solve-prob-6',
          step: 'Step 2: Compute and Report Mean and Variance',
          detail:
            'Substitute into the probability formula, then state the mean and variance, commenting on skewness where relevant.',
          questionType: 'Distribution Application Problem',
        },
      ],
    },
    {
      id: 'prob-mod4-continuous-dist',
      subjectId: 'bsc-karnataka-probability',
      title: 'Continuous Distributions: Uniform, Exponential & Normal',
      moduleNumber: 4,
      moduleName: 'Module 4: Continuous Probability Distributions',
      order: 4,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-prob-mod4-01', 'q-prob-mod4-02'],
      subtopics: [
        'Continuous uniform distribution and its properties',
        'Exponential distribution, memoryless property and reliability applications',
        'Normal distribution: shape, symmetry and the empirical rule',
        'Standardisation and use of the standard normal table',
        'Normal approximation to the binomial and Poisson distributions',
      ],
      explanationMd: `# Continuous Distributions

### Uniform Distribution
On [a, b] the density is constant: f(x) = 1/(b - a). Mean = (a + b)/2 and variance = (b - a)^2 / 12. The probability of any subinterval depends only on its length, not its position.

### Exponential Distribution
f(x) = lambda e^(-lambda x) for x >= 0, with mean 1/lambda and variance 1/lambda^2. It models waiting times between events in a Poisson process. Its defining feature is the **memoryless property**:

P(X > s + t | X > s) = P(X > t)

Already having waited s units does not change the distribution of the remaining wait. This makes it the natural model for component lifetimes in reliability engineering.

### Normal Distribution
f(x) = (1 / (sigma sqrt(2 pi))) e^(-(x - mu)^2 / (2 sigma^2))

The curve is symmetric about mu, bell-shaped, with mean = median = mode = mu. Points of inflection occur at mu +/- sigma. The **empirical rule** states that approximately 68.27% of values lie within one standard deviation, 95.45% within two, and 99.73% within three.

### Standardisation
Z = (X - mu) / sigma converts any normal variable to the standard normal with mean 0 and variance 1, allowing a single table to serve all normal problems.

### Normal Approximations
- To the **binomial**: valid when np >= 5 and nq >= 5; apply a continuity correction of 0.5.
- To the **Poisson**: valid when lambda >= 10 approximately.

The continuity correction matters because a continuous distribution is approximating a discrete one, and omitting it introduces noticeable error in the tails.`,
      formulas: [
        {
          id: 'formula-prob-5',
          label: 'Standardisation',
          formula: 'Z = (X - mu) / sigma',
          exampleQ:
            'Exam marks are normally distributed with mean 65 and standard deviation 10. What proportion of students score above 80?',
          exampleA:
            'Z = (80 - 65)/10 = 1.5. From the standard normal table P(Z > 1.5) = 1 - 0.9332 = 0.0668, so about 6.68% of students score above 80.',
        },
      ],
      tricks: [
        {
          id: 'trick-prob-4',
          title: 'Always Apply the Continuity Correction',
          trick:
            'When approximating a discrete distribution by the normal, use 0.5 corrections: P(X = k) becomes P(k - 0.5 < X < k + 0.5). Forgetting it is the most frequent source of error in approximation problems.',
          whenToUse: 'Normal approximation problems.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-prob-7',
          step: 'Step 1: Standardise the Given Value',
          detail:
            'Convert X to Z using the mean and standard deviation, keeping track of the direction of the inequality.',
          questionType: 'Normal Distribution Problem',
        },
        {
          id: 'solve-prob-8',
          step: 'Step 2: Read the Table and Convert Back to the Required Form',
          detail:
            'Tables typically give P(0 < Z < z) or P(Z < z); convert to the required tail or interval probability and express it as a percentage or count.',
          questionType: 'Normal Distribution Problem',
        },
      ],
    },
    {
      id: 'prob-mod5-clt',
      subjectId: 'bsc-karnataka-probability',
      title: 'Joint Distributions, Law of Large Numbers & the CLT',
      moduleNumber: 5,
      moduleName: 'Module 5: Joint Distributions and Limit Theorems',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-prob-mod5-01', 'q-prob-mod5-02'],
      subtopics: [
        'Joint, marginal and conditional distributions of two random variables',
        'Independence, covariance and the correlation coefficient',
        'Chebyshev\u2019s inequality and the weak law of large numbers',
        'The central limit theorem and its conditions',
        'Applications of the CLT to sampling and quality control',
      ],
      explanationMd: `# Joint Distributions & Limit Theorems

### Joint and Marginal Distributions
The joint distribution f(x, y) gives the probability of two variables taking specified values simultaneously. The **marginal** distribution of X is obtained by summing (or integrating) the joint over all values of Y.

X and Y are independent if and only if f(x, y) = f_X(x) f_Y(y) for all x, y.

### Covariance and Correlation
- Cov(X, Y) = E[(X - mu_X)(Y - mu_Y)] = E(XY) - E(X)E(Y)
- Correlation rho = Cov(X, Y) / (sigma_X sigma_Y), bounded between -1 and 1

Zero covariance implies **uncorrelated**, which is weaker than independence: two variables can be uncorrelated yet functionally dependent (for example Y = X^2 with X symmetric about zero). For jointly normal variables, however, uncorrelated does imply independent.

### Chebyshev's Inequality
For any distribution with finite mean and variance:

P(|X - mu| >= k sigma) <= 1 / k^2

It requires no distributional assumption, which makes it powerful but conservative — for k = 2 it guarantees at least 75% of values within two standard deviations, where the normal distribution actually gives about 95%.

### Law of Large Numbers
The sample mean converges in probability to the population mean as n increases. This justifies using long-run relative frequency as an estimate of probability.

### Central Limit Theorem
If X1, ..., Xn are independent and identically distributed with mean mu and variance sigma^2, then for large n the sample mean is approximately normal:

X-bar ~ N(mu, sigma^2 / n)

Critically, this holds **regardless of the shape of the parent distribution** — which is why normal-based methods are so widely applicable. A common rule of thumb is n >= 30, though fewer observations suffice for symmetric parent distributions.`,
      formulas: [
        {
          id: 'formula-prob-6',
          label: 'Standard Error of the Mean (from the CLT)',
          formula: 'SE = sigma / sqrt(n)',
          exampleQ:
            'A population has standard deviation 20. What is the standard error of the mean for samples of size 64?',
          exampleA: 'SE = 20 / sqrt(64) = 20 / 8 = 2.5. Quadrupling the sample size halves the standard error.',
        },
        {
          id: 'formula-prob-7',
          label: "Chebyshev's Inequality",
          formula: 'P(|X - mu| >= k sigma) <= 1 / k^2',
          exampleQ:
            'Using Chebyshev\u2019s inequality, what is the minimum proportion of observations within 4 standard deviations of the mean?',
          exampleA:
            'P(|X - mu| < 4 sigma) >= 1 - 1/16 = 0.9375, so at least 93.75% of observations lie within four standard deviations, for ANY distribution with finite variance.',
        },
      ],
      tricks: [
        {
          id: 'trick-prob-5',
          title: 'Standard Error Shrinks With sqrt(n), Not n',
          trick:
            'To halve the standard error you must quadruple the sample size. This is why precision gains become expensive, and it is the standard trap in sample size questions.',
          whenToUse: 'Sampling and standard error problems.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-prob-9',
          step: 'Step 1: Identify the Sampling Distribution of the Mean',
          detail:
            'State the mean (mu) and standard error (sigma / sqrt n) of the sample mean, invoking the CLT to justify normality for large n.',
          questionType: 'CLT Application Problem',
        },
        {
          id: 'solve-prob-10',
          step: 'Step 2: Standardise and Read the Probability',
          detail:
            'Convert the sample mean to a Z score using the standard error (not the population standard deviation) and read the required probability.',
          questionType: 'CLT Application Problem',
        },
      ],
    },
  ],

  // ── 5. Linear Algebra (Sem 3) ──
  'bsc-karnataka-linear-algebra': [
    {
      id: 'la-mod1-determinants',
      subjectId: 'bsc-karnataka-linear-algebra',
      title: 'Determinants, Matrices & Their Properties',
      moduleNumber: 1,
      moduleName: 'Module 1: Determinants and Matrices',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-la-mod1-01', 'q-la-mod1-02'],
      subtopics: [
        'Types of matrices, matrix operations and the transpose',
        'Determinant evaluation by expansion and by row reduction',
        'Properties of determinants under row and column operations',
        'Minors, cofactors, adjoint and inverse of a matrix',
        'Singular and non-singular matrices and their determinant test',
      ],
      explanationMd: `# Determinants & Matrices

### Matrix Operations
Addition requires identical dimensions; multiplication of A (m x n) by B (n x p) yields an m x p matrix. Matrix multiplication is **associative and distributive but not commutative** — AB and BA are generally different and may not even both be defined.

The **transpose** (A') interchanges rows and columns, with (AB)' = B'A' — note the reversal of order.

### Determinant Properties
Key properties used to simplify evaluation:
1. The determinant of a matrix equals that of its transpose.
2. Interchanging two rows changes the sign.
3. Multiplying a row by k multiplies the determinant by k.
4. Adding a multiple of one row to another leaves the determinant unchanged.
5. A determinant with two identical rows or a row of zeros is zero.
6. det(AB) = det(A) det(B).
7. det(A^-1) = 1 / det(A).

Property 4 is the workhorse for reducing a matrix to triangular form, after which the determinant is the product of the diagonal entries.

### Adjoint and Inverse
The **adjoint** of A is the transpose of the cofactor matrix. The inverse is:

A^-1 = adj(A) / det(A), valid only when det(A) is not zero.

A matrix with zero determinant is **singular** and has no inverse. The identity A adj(A) = det(A) I is the standard starting point for many proofs.

### Special Matrices
Symmetric (A' = A), skew-symmetric (A' = -A, with zero diagonal), orthogonal (A' A = I, so A^-1 = A' and det = +/- 1), and idempotent (A^2 = A) matrices each have characteristic determinant and eigenvalue properties that recur in examinations.`,
      formulas: [
        {
          id: 'formula-la-1',
          label: 'Inverse via the Adjoint',
          formula: 'A^-1 = adj(A) / det(A), provided det(A) is not zero',
          exampleQ:
            'Find the inverse of A = [[2, 1], [1, 1]].',
          exampleA:
            'det(A) = 2(1) - 1(1) = 1. Cofactor matrix = [[1, -1], [-1, 2]], so adj(A) = [[1, -1], [-1, 2]]. A^-1 = [[1, -1], [-1, 2]] / 1 = [[1, -1], [-1, 2]].',
        },
      ],
      tricks: [
        {
          id: 'trick-la-1',
          title: 'Reduce to Triangular Form Before Expanding',
          trick:
            'For determinants of order 3 or more, use row operations (property 4, which is free) to create zeros before expanding. Direct expansion of a 4x4 determinant involves 24 terms and is very error-prone.',
          whenToUse: 'Determinant evaluation of order 3 and above.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-la-1',
          step: 'Step 1: Create Zeros Using Row Operations',
          detail:
            'Add suitable multiples of one row to others to introduce zeros in a chosen column, keeping track of any sign changes from row swaps.',
          questionType: 'Determinant / Matrix Problem',
        },
        {
          id: 'solve-la-2',
          step: 'Step 2: Expand Along the Row or Column With Most Zeros',
          detail:
            'Expand by cofactors along the sparsest line, apply the correct alternating signs, and multiply by any scalar factors extracted earlier.',
          questionType: 'Determinant / Matrix Problem',
        },
      ],
    },
    {
      id: 'la-mod2-linear-systems',
      subjectId: 'bsc-karnataka-linear-algebra',
      title: 'Rank, Consistency & Solution of Linear Systems',
      moduleNumber: 2,
      moduleName: 'Module 2: Systems of Linear Equations',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-la-mod2-01', 'q-la-mod2-02'],
      subtopics: [
        'Elementary row operations and echelon / reduced row echelon forms',
        'Rank of a matrix and the Rouché-Capelli consistency theorem',
        'Unique, infinite and no solution conditions',
        'Gauss elimination and Gauss-Jordan methods',
        'Homogeneous systems and the trivial solution',
      ],
      explanationMd: `# Rank & Solution of Linear Systems

### Row Echelon Form
Elementary row operations — row interchange, scaling a row, and adding a multiple of one row to another — do not change the solution set. Reducing the augmented matrix [A | B] to **row echelon form** gives leading entries in a staircase pattern; **reduced row echelon form** additionally makes each leading entry 1 with zeros above and below.

### Rank
The **rank** of a matrix is the number of non-zero rows in its echelon form, equivalently the order of the largest non-vanishing minor. Row rank always equals column rank.

### The Consistency Theorem (Rouché-Capelli)
The system AX = B is consistent if and only if:

rank(A) = rank([A | B])

Given consistency:
- If rank(A) = number of unknowns → a **unique** solution.
- If rank(A) < number of unknowns → **infinitely many** solutions, with (n - rank) free parameters.
- If rank(A) is not equal to rank([A | B]) → **no** solution (inconsistent).

### Homogeneous Systems
For AX = 0 the system is always consistent, since X = 0 (the trivial solution) always satisfies it. Non-trivial solutions exist if and only if rank(A) < n, equivalently det(A) = 0 for a square system.

### Gauss versus Gauss-Jordan
**Gauss elimination** reduces to echelon form and solves by back substitution. **Gauss-Jordan** continues to reduced echelon form, giving the solution directly and, as a by-product, the inverse of A when applied to [A | I].`,
      formulas: [
        {
          id: 'formula-la-2',
          label: 'Rouché-Capelli Consistency Condition',
          formula: 'AX = B is consistent if and only if rank(A) = rank([A | B])',
          exampleQ:
            'For a system of 3 equations in 3 unknowns, rank(A) = 2 and rank([A | B]) = 3. Classify the system.',
          exampleA:
            'Since rank(A) is not equal to rank([A | B]), the system is inconsistent and has no solution — the planes represented by the equations do not share a common point.',
        },
      ],
      tricks: [
        {
          id: 'trick-la-2',
          title: 'Compare Ranks Before Solving',
          trick:
            'Always compute rank(A) and rank([A|B]) first. This tells you immediately whether a solution exists and how many free parameters there will be, preventing wasted effort on an inconsistent system.',
          whenToUse: 'Every linear system problem.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-la-3',
          step: 'Step 1: Form the Augmented Matrix and Reduce',
          detail:
            'Write [A | B], apply elementary row operations to reach echelon form, and read off both ranks.',
          questionType: 'Linear System Solution',
        },
        {
          id: 'solve-la-4',
          step: 'Step 2: Classify and Solve by Back Substitution',
          detail:
            'State the consistency conclusion, identify the free parameters if any, and express the general solution in parametric form.',
          questionType: 'Linear System Solution',
        },
      ],
    },
    {
      id: 'la-mod3-vector-spaces',
      subjectId: 'bsc-karnataka-linear-algebra',
      title: 'Vector Spaces, Subspaces, Basis & Dimension',
      moduleNumber: 3,
      moduleName: 'Module 3: Vector Spaces',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-la-mod3-01', 'q-la-mod3-02'],
      subtopics: [
        'Definition and axioms of a vector space over a field',
        'Subspaces and the two-step subspace test',
        'Linear dependence, independence and spanning sets',
        'Basis, dimension and the replacement theorem',
        'Row space, column space, null space and the rank-nullity theorem',
      ],
      explanationMd: `# Vector Spaces

### Axioms
A vector space V over a field F is a set with vector addition and scalar multiplication satisfying eight axioms: closure under both operations, commutativity and associativity of addition, existence of a zero vector and additive inverses, distributivity of scalars over vectors and over field addition, and compatibility of scalar multiplication with field multiplication.

Common examples: R^n, the space of polynomials of degree at most n, and the space of m x n matrices. A standard counterexample is the set of vectors with non-negative components, which fails closure under scalar multiplication by negative scalars.

### Subspace Test
A non-empty subset W of V is a subspace if and only if for all u, v in W and scalar c:
1. u + v is in W (closure under addition), and
2. c u is in W (closure under scalar multiplication).

These two conditions automatically give the zero vector and additive inverses.

### Linear Independence and Spanning
Vectors v1, ..., vk are **linearly independent** if c1 v1 + ... + ck vk = 0 implies all ci = 0. They **span** V if every vector in V is a linear combination of them. A set that is both is a **basis**, and all bases of a finite-dimensional space have the same number of elements — the **dimension**.

A useful test: arrange the vectors as rows of a matrix and reduce to echelon form. The number of non-zero rows gives the rank, which is the size of a maximal independent subset.

### Rank-Nullity Theorem
For a linear transformation T: V → W,

rank(T) + nullity(T) = dim(V)

This links the dimension of the image to that of the kernel and is one of the most frequently proved results in the syllabus.`,
      formulas: [
        {
          id: 'formula-la-3',
          label: 'Rank-Nullity Theorem',
          formula: 'rank(T) + nullity(T) = dim(V)',
          exampleQ:
            'A linear map T: R^4 → R^3 has a null space of dimension 2. What is the rank of T?',
          exampleA:
            'rank(T) = dim(V) - nullity(T) = 4 - 2 = 2. Since the rank is at most 3, the map is neither injective (nullity > 0) nor surjective onto all of R^3.',
        },
      ],
      tricks: [
        {
          id: 'trick-la-3',
          title: 'Test Closure Under NEGATIVE Scalars',
          trick:
            'When checking whether a subset is a subspace, test scalar multiplication by -1 first. Most failing examples (positive orthant, first quadrant) fail immediately on this single test.',
          whenToUse: 'Subspace verification questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-la-5',
          step: 'Step 1: Apply the Two-Step Subspace Test',
          detail:
            'Take general elements u and v of the subset and a general scalar c, then verify both closure conditions explicitly.',
          questionType: 'Vector Space Proof',
        },
        {
          id: 'solve-la-6',
          step: 'Step 2: Determine a Basis and the Dimension',
          detail:
            'Reduce the spanning set to echelon form, identify the independent vectors as a basis, and count them to state the dimension.',
          questionType: 'Vector Space Proof',
        },
      ],
    },
    {
      id: 'la-mod4-linear-transformations',
      subjectId: 'bsc-karnataka-linear-algebra',
      title: 'Linear Transformations & Change of Basis',
      moduleNumber: 4,
      moduleName: 'Module 4: Linear Transformations',
      order: 4,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-la-mod4-01', 'q-la-mod4-02'],
      subtopics: [
        'Definition, kernel and range of a linear transformation',
        'Matrix representation of a transformation relative to given bases',
        'Composition of transformations and matrix multiplication',
        'Similar matrices and invariance of the characteristic polynomial',
        'Geometric transformations: rotation, reflection and scaling',
      ],
      explanationMd: `# Linear Transformations

### Definition
A map T: V → W is linear if for all u, v in V and scalar c:
- T(u + v) = T(u) + T(v)
- T(c u) = c T(u)

These combine into T(c1 u + c2 v) = c1 T(u) + c2 T(v). Note that T(0) = 0 necessarily, which is a quick disqualification test for maps such as T(x) = x + 1.

### Kernel and Range
- The **kernel** (null space) is {v in V : T(v) = 0}. It is a subspace of V.
- The **range** (image) is {T(v) : v in V}. It is a subspace of W.

T is **injective** (one-to-one) if and only if the kernel contains only the zero vector. T is **surjective** (onto) if the range equals W. A bijective linear map is an isomorphism, and then dim(V) = dim(W).

### Matrix Representation
Given bases {v1, ..., vn} of V and {w1, ..., wm} of W, the matrix of T has as its j-th column the coordinates of T(vj) expressed in the w basis. Changing the basis changes the matrix but not the underlying transformation: if P is the change-of-basis matrix, then the new representation is P^-1 A P.

### Similarity
Matrices A and B are **similar** if B = P^-1 A P for some invertible P. Similar matrices represent the same transformation in different bases and therefore share determinant, trace, rank, eigenvalues and characteristic polynomial — though not necessarily eigenvectors.

### Geometric Transformations
In R^2, rotation by theta is [[cos, -sin], [sin, cos]] with determinant 1; reflection in the x-axis is [[1, 0], [0, -1]] with determinant -1; scaling by factors a and b is [[a, 0], [0, b]]. The determinant gives the signed area scaling factor.`,
      formulas: [
        {
          id: 'formula-la-4',
          label: 'Change of Basis (Similarity)',
          formula: "B = P^-1 A P, where P is the change-of-basis matrix",
          exampleQ:
            'Why do similar matrices have the same eigenvalues?',
          exampleA:
            'det(B - lambda I) = det(P^-1 A P - lambda P^-1 P) = det(P^-1 (A - lambda I) P) = det(P^-1) det(A - lambda I) det(P) = det(A - lambda I). The characteristic polynomials coincide, so the eigenvalues are identical.',
        },
      ],
      tricks: [
        {
          id: 'trick-la-4',
          title: 'Check T(0) = 0 First',
          trick:
            'Every linear transformation maps the zero vector to zero. If a candidate map gives T(0) other than 0 — for example T(x) = 2x + 3 — it is not linear and you can stop immediately.',
          whenToUse: 'Linearity verification questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-la-7',
          step: 'Step 1: Verify Linearity With General Vectors',
          detail:
            'Test additivity and homogeneity on arbitrary vectors and scalars, not on numerical examples.',
          questionType: 'Linear Transformation Problem',
        },
        {
          id: 'solve-la-8',
          step: 'Step 2: Find the Kernel and Range, Then the Matrix',
          detail:
            'Solve T(v) = 0 for the kernel, describe the image for the range, and construct the matrix column by column from the images of the basis vectors.',
          questionType: 'Linear Transformation Problem',
        },
      ],
    },
    {
      id: 'la-mod5-eigenvalues',
      subjectId: 'bsc-karnataka-linear-algebra',
      title: 'Eigenvalues, Eigenvectors & Diagonalisation',
      moduleNumber: 5,
      moduleName: 'Module 5: Eigenvalues and Diagonalisation',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-la-mod5-01', 'q-la-mod5-02'],
      subtopics: [
        'Eigenvalue equation, characteristic equation and the Cayley-Hamilton theorem',
        'Computing eigenvectors from the null space of (A - lambda I)',
        'Algebraic and geometric multiplicity',
        'Diagonalisation and the modal matrix',
        'Orthogonal diagonalisation of symmetric matrices and quadratic forms',
      ],
      explanationMd: `# Eigenvalues & Diagonalisation

### The Eigenvalue Equation
A scalar lambda is an eigenvalue of A with eigenvector v (non-zero) if:

A v = lambda v, equivalently (A - lambda I) v = 0

For a non-trivial solution the matrix (A - lambda I) must be singular, so:

det(A - lambda I) = 0

This is the **characteristic equation**, a polynomial of degree n whose roots are the eigenvalues.

### Useful Properties
- The sum of the eigenvalues equals the trace of A.
- The product of the eigenvalues equals det(A).
- A is singular if and only if 0 is an eigenvalue.
- A and A^T have the same eigenvalues.
- If A is invertible, the eigenvalues of A^-1 are the reciprocals.
- The eigenvalues of A^k are the k-th powers of those of A.

### Cayley-Hamilton Theorem
Every square matrix satisfies its own characteristic equation. If p(lambda) = det(A - lambda I), then p(A) = 0. This allows high powers of A to be reduced to low-degree polynomials in A and provides a route to computing A^-1.

### Eigenvectors and Multiplicity
For each eigenvalue, solve (A - lambda I) v = 0 to obtain the eigenspace. Its dimension is the **geometric multiplicity**; the number of times lambda appears as a root of the characteristic polynomial is the **algebraic multiplicity**. Geometric multiplicity never exceeds algebraic multiplicity.

### Diagonalisation
A is diagonalisable if and only if it has n linearly independent eigenvectors — guaranteed when all eigenvalues are distinct, but possible with repeated eigenvalues if the geometric multiplicities suffice. Then:

D = P^-1 A P

where P is the **modal matrix** whose columns are the eigenvectors and D is diagonal with the eigenvalues. A real symmetric matrix is always orthogonally diagonalisable, which is the basis of principal component analysis and the classification of quadratic forms.`,
      formulas: [
        {
          id: 'formula-la-5',
          label: 'Characteristic Equation',
          formula: 'det(A - lambda I) = 0',
          exampleQ: 'Find the eigenvalues of A = [[4, 1], [2, 3]].',
          exampleA:
            'det(A - lambda I) = (4 - lambda)(3 - lambda) - 2 = lambda^2 - 7lambda + 10 = (lambda - 5)(lambda - 2). Eigenvalues are 5 and 2. Check: trace = 7 = 5 + 2 and det = 10 = 5 x 2.',
        },
      ],
      tricks: [
        {
          id: 'trick-la-5',
          title: 'Verify With Trace and Determinant',
          trick:
            'Always check that the eigenvalues sum to the trace and multiply to the determinant. This catches sign errors in the characteristic polynomial instantly and is worth doing on every problem.',
          whenToUse: 'Every eigenvalue computation.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-la-9',
          step: 'Step 1: Form and Solve the Characteristic Equation',
          detail:
            'Compute det(A - lambda I), expand and factorise to find all eigenvalues, then verify against the trace and determinant.',
          questionType: 'Eigenvalue Problem',
        },
        {
          id: 'solve-la-10',
          step: 'Step 2: Solve (A - lambda I) v = 0 for Each Eigenvalue',
          detail:
            'Row reduce (A - lambda I), express the solution in parametric form to obtain the eigenvectors, then assemble the modal matrix P if diagonalisation is required.',
          questionType: 'Eigenvalue Problem',
        },
      ],
    },
  ],

  // ── 6. Numerical Methods (Sem 3) ──
  'bsc-karnataka-numerical-methods': [
    {
      id: 'nm-mod1-errors',
      subjectId: 'bsc-karnataka-numerical-methods',
      title: 'Errors, Floating Point Arithmetic & Iterative Convergence',
      moduleNumber: 1,
      moduleName: 'Module 1: Errors and Convergence',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-nm-mod1-01', 'q-nm-mod1-02'],
      subtopics: [
        'Absolute, relative and percentage errors',
        'Inherent, rounding and truncation errors and their sources',
        'Significant digits and the propagation of errors',
        'Order of convergence: linear, quadratic and superlinear',
        'Floating point representation, machine epsilon and catastrophic cancellation',
      ],
      explanationMd: `# Errors & Convergence

### Error Measures
- **Absolute error** = |true value - approximate value|
- **Relative error** = absolute error / |true value|
- **Percentage error** = relative error x 100

If an approximation is correct to n significant digits, the relative error is at most 0.5 x 10^(-n+1). This link between significant figures and relative error is a standard question.

### Sources of Error
- **Inherent error**: present in the input data itself, such as measurement uncertainty.
- **Rounding error**: caused by representing numbers with finitely many digits.
- **Truncation error**: caused by replacing an infinite process with a finite one — cutting off a Taylor series after a few terms, for example.

**Catastrophic cancellation** occurs when two nearly equal numbers are subtracted: the leading digits cancel and the remaining significant digits are dominated by rounding error. The remedy is algebraic reformulation, such as rationalising a difference of square roots.

### Order of Convergence
An iterative scheme x_(n+1) = g(x_n) has order p if:

|x_(n+1) - alpha| <= C |x_n - alpha|^p

for a constant C. **Linear** convergence (p = 1) reduces the error by a constant factor; **quadratic** convergence (p = 2) roughly doubles the number of correct digits each iteration — which is why Newton-Raphson is so much faster than bisection, at the cost of needing a derivative and a good starting value.

### Machine Epsilon
Machine epsilon is the smallest number that, added to 1, produces a value different from 1. It sets the floor on achievable relative precision and determines when an iterative process should be stopped.`,
      formulas: [
        {
          id: 'formula-nm-1',
          label: 'Relative and Percentage Error',
          formula: 'Relative error = |true - approximate| / |true|; Percentage error = relative error x 100',
          exampleQ:
            'The true value of a quantity is 25.00 and it is measured as 24.85. Compute the absolute, relative and percentage errors.',
          exampleA:
            'Absolute error = |25.00 - 24.85| = 0.15. Relative error = 0.15 / 25.00 = 0.006. Percentage error = 0.6%.',
        },
      ],
      tricks: [
        {
          id: 'trick-nm-1',
          title: 'Count Correct Digits From the Relative Error',
          trick:
            'If the relative error is at most 0.5 x 10^(-n+1), the approximation is correct to n significant digits. Convert the given error to this form and read n directly.',
          whenToUse: 'Significant digit and error analysis questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-nm-1',
          step: 'Step 1: Identify the True and Approximate Values',
          detail:
            'State both values explicitly with their units or precision, noting which is exact and which is rounded.',
          questionType: 'Error Analysis Problem',
        },
        {
          id: 'solve-nm-2',
          step: 'Step 2: Compute the Error Measures and Interpret',
          detail:
            'Calculate absolute, relative and percentage errors, then state the number of correct significant digits implied by the relative error.',
          questionType: 'Error Analysis Problem',
        },
      ],
    },
    {
      id: 'nm-mod2-root-finding',
      subjectId: 'bsc-karnataka-numerical-methods',
      title: 'Solution of Algebraic & Transcendental Equations',
      moduleNumber: 2,
      moduleName: 'Module 2: Root Finding Methods',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-nm-mod2-01', 'q-nm-mod2-02'],
      subtopics: [
        'Bisection method, its algorithm and error bound',
        'Regula falsi (false position) and its rate of convergence',
        'Newton-Raphson method, geometric interpretation and convergence condition',
        'Fixed point iteration and the contraction condition |g\u2019(x)| < 1',
        'Comparison of methods on convergence rate and computational cost',
      ],
      explanationMd: `# Root Finding Methods

### Bisection
Requires an interval [a, b] with f(a) and f(b) of opposite signs. Repeatedly halve the interval, retaining the subinterval with a sign change. After n iterations the error is at most (b - a) / 2^n, so the number of iterations to achieve accuracy epsilon is:

n >= log2((b - a) / epsilon)

Bisection is **guaranteed** to converge but is slow — only linear, gaining roughly one binary digit per iteration.

### Regula Falsi
Replaces the midpoint with the point where the secant line through (a, f(a)) and (b, f(b)) crosses the axis:

x = (a f(b) - b f(a)) / (f(b) - f(a))

Convergence is still linear and one endpoint can become "stuck", making it slower than bisection in practice for some functions.

### Newton-Raphson
x_(n+1) = x_n - f(x_n) / f'(x_n)

Geometrically, it follows the tangent at the current point to its x-intercept. Convergence is **quadratic** near a simple root, but the method can fail if f'(x) is near zero, if the starting value is poor, or if the root is repeated (where convergence drops to linear).

### Fixed Point Iteration
Rewrite f(x) = 0 as x = g(x) and iterate x_(n+1) = g(x_n). Convergence is guaranteed in an interval where |g'(x)| < 1; the smaller |g'| is, the faster the convergence. Choosing the right rearrangement is therefore crucial — x^3 + x - 1 = 0 can be written as x = 1 - x^3 (divergent) or x = (1 - x)^(1/3) (convergent).

### Comparison
| Method | Convergence | Needs derivative | Bracketing required |
|---|---|---|---|
| Bisection | Linear | No | Yes |
| Regula Falsi | Linear | No | Yes |
| Newton-Raphson | Quadratic | Yes | No |
| Fixed point | Linear | No | No |`,
      formulas: [
        {
          id: 'formula-nm-2',
          label: 'Newton-Raphson Iteration',
          formula: 'x_(n+1) = x_n - f(x_n) / f\u2019(x_n)',
          exampleQ:
            'Perform one Newton-Raphson iteration for f(x) = x^3 - 2x - 5 starting from x0 = 2.',
          exampleA:
            "f(2) = 8 - 4 - 5 = -1. f'(x) = 3x^2 - 2, so f'(2) = 10. x1 = 2 - (-1)/10 = 2.1.",
        },
        {
          id: 'formula-nm-3',
          label: 'Bisection Error Bound',
          formula: 'Error after n iterations <= (b - a) / 2^n',
          exampleQ: 'How many bisection iterations are needed on [1, 2] to achieve an accuracy of 10^-4?',
          exampleA:
            'Need (1)/2^n <= 10^-4, so 2^n >= 10^4. Since 2^13 = 8192 and 2^14 = 16384, n = 14 iterations are required.',
        },
      ],
      tricks: [
        {
          id: 'trick-nm-2',
          title: 'Test |g\u2019(x)| < 1 Before Iterating',
          trick:
            'For fixed point iteration, compute g\u2019(x) on the interval first. If |g\u2019| exceeds 1 the scheme diverges no matter how many iterations you perform — rearrange the equation instead.',
          whenToUse: 'Fixed point iteration problems.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-nm-3',
          step: 'Step 1: Bracket the Root and Verify the Sign Change',
          detail:
            'Evaluate f at the interval endpoints and confirm the signs differ, which by the intermediate value theorem guarantees a root inside.',
          questionType: 'Numerical Root Finding',
        },
        {
          id: 'solve-nm-4',
          step: 'Step 2: Iterate in a Table Until the Required Accuracy',
          detail:
            'Tabulate each iteration with the current value, f(x) and the correction, stopping when successive values agree to the required number of decimal places.',
          questionType: 'Numerical Root Finding',
        },
      ],
    },
    {
      id: 'nm-mod3-interpolation',
      subjectId: 'bsc-karnataka-numerical-methods',
      title: 'Interpolation & Numerical Differentiation',
      moduleNumber: 3,
      moduleName: 'Module 3: Interpolation and Differentiation',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-nm-mod3-01', 'q-nm-mod3-02'],
      subtopics: [
        "Newton's forward and backward difference interpolation formulae",
        "Choosing the correct formula from the position of the interpolating point",
        "Lagrange's and Newton's divided difference interpolation for unequal intervals",
        'Construction of forward, backward and central difference tables',
        'Numerical differentiation using difference operators',
      ],
      explanationMd: `# Interpolation

### The Difference Operators
For equally spaced data with interval h:
- **Forward difference**: delta y_i = y_(i+1) - y_i, denoted by the operator capital delta.
- **Backward difference**: nabla y_i = y_i - y_(i-1).
- **Central difference**: delta y_(i+1/2) = y_(i+1) - y_i.

The difference table is constructed by repeatedly differencing; for a polynomial of degree n the (n+1)-th differences are zero, which provides a check on arithmetic and reveals the degree of the underlying polynomial.

### Newton's Forward Formula
y = y_0 + u (delta y_0) + u(u-1)/2! (delta^2 y_0) + ... where u = (x - x_0)/h

Use it when x lies **near the beginning** of the table.

### Newton's Backward Formula
y = y_n + u (nabla y_n) + u(u+1)/2! (nabla^2 y_n) + ... where u = (x - x_n)/h

Use it when x lies **near the end** of the table — typically for extrapolation.

### Unequal Intervals
**Lagrange's formula** works for any spacing:

y(x) = sum over i of [ y_i x product over j not equal to i of (x - x_j)/(x_i - x_j) ]

**Newton's divided difference** formula is algebraically equivalent but more efficient when adding data points, since previously computed divided differences remain valid.

### Numerical Differentiation
Differentiating the interpolating polynomial gives derivative estimates, for example at the tabular point:

y'_0 = (1/h) [delta y_0 - (1/2) delta^2 y_0 + (1/3) delta^3 y_0 - ...]

Accuracy improves with more terms but is limited by round-off amplification, since differencing magnifies small data errors.`,
      formulas: [
        {
          id: 'formula-nm-4',
          label: "Newton's Forward Difference Formula",
          formula: 'y = y_0 + u delta y_0 + u(u-1)/2! delta^2 y_0 + ... with u = (x - x_0)/h',
          exampleQ:
            'Given y(0) = 1, y(1) = 4, y(2) = 11, y(3) = 22 with h = 1, estimate y(0.5) using the forward formula.',
          exampleA:
            'Differences: delta y_0 = 3, delta^2 y_0 = 4, delta^3 y_0 = 0. With u = 0.5: y = 1 + 0.5(3) + (0.5)(-0.5)/2 (4) = 1 + 1.5 - 0.5 = 2.0.',
        },
      ],
      tricks: [
        {
          id: 'trick-nm-3',
          title: 'Near the Start Use Forward, Near the End Use Backward',
          trick:
            'Choose the formula from the position of x, not from convenience. Interpolating near the end of a table with the forward formula requires high-order differences from the far end, amplifying error.',
          whenToUse: 'All interpolation formula selection.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-nm-5',
          step: 'Step 1: Build the Difference Table',
          detail:
            'Lay out x and y, then compute successive difference columns, checking that the highest differences trend toward zero as expected.',
          questionType: 'Interpolation Problem',
        },
        {
          id: 'solve-nm-6',
          step: 'Step 2: Select the Formula, Compute u and Substitute',
          detail:
            'Choose forward or backward according to the position of x, compute u = (x - reference)/h with the correct sign, and evaluate the series term by term.',
          questionType: 'Interpolation Problem',
        },
      ],
    },
    {
      id: 'nm-mod4-numerical-integration',
      subjectId: 'bsc-karnataka-numerical-methods',
      title: 'Numerical Integration: Trapezoidal, Simpson & Romberg',
      moduleNumber: 4,
      moduleName: 'Module 4: Numerical Integration',
      order: 4,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-nm-mod4-01', 'q-nm-mod4-02'],
      subtopics: [
        'Trapezoidal rule, its derivation and error term',
        "Simpson's one-third rule and the requirement of an even number of intervals",
        "Simpson's three-eighth rule for multiples of three intervals",
        'Composite rules, Romberg integration and Richardson extrapolation',
        'Comparison of accuracy and the choice of step size',
      ],
      explanationMd: `# Numerical Integration

### Trapezoidal Rule
Approximates the area under f(x) on [a, b] by a trapezium:

Integral ≈ (h/2) [y_0 + 2y_1 + 2y_2 + ... + 2y_(n-1) + y_n]

The error is O(h^2) — halving h reduces the error by a factor of four. It is exact only for linear functions.

### Simpson's One-Third Rule
Fits a parabola through each pair of subintervals, requiring an **even** number of intervals:

Integral ≈ (h/3) [(y_0 + y_n) + 4(y_1 + y_3 + ...) + 2(y_2 + y_4 + ...)]

The pattern is: first and last with weight 1, odd-indexed ordinates with weight 4, even-indexed with weight 2. The error is O(h^4), so it is exact for polynomials up to degree three — a degree higher than the quadratic it fits, because the error term's cubic contribution cancels by symmetry.

### Simpson's Three-Eighth Rule
Uses a cubic through each group of three intervals (n a multiple of 3):

Integral ≈ (3h/8) [(y_0 + y_n) + 3(y_1 + y_2 + y_4 + y_5 + ...) + 2(y_3 + y_6 + ...)]

### Romberg Integration
Applies **Richardson extrapolation** to a sequence of trapezoidal estimates with successively halved step sizes, cancelling the leading error terms to produce a much more accurate result from cheap computations. The resulting triangular array converges rapidly.

### Choosing the Step Size
Accuracy improves as h decreases, but round-off error grows as more function evaluations are summed. There is therefore an optimal step size below which the result actually deteriorates — a key practical insight.`,
      formulas: [
        {
          id: 'formula-nm-5',
          label: "Simpson's One-Third Rule",
          formula: 'Integral ≈ (h/3) [(y_0 + y_n) + 4(sum of odd ordinates) + 2(sum of even ordinates)]',
          exampleQ:
            'Estimate the integral from 0 to 4 of x^2 dx using Simpson\u2019s one-third rule with h = 1.',
          exampleA:
            'Ordinates: y = 0, 1, 4, 9, 16. Integral = (1/3)[(0 + 16) + 4(1 + 9) + 2(4)] = (1/3)[16 + 40 + 8] = 64/3 = 21.333, which equals the exact value 64/3 — Simpson\u2019s rule is exact for cubics.',
        },
      ],
      tricks: [
        {
          id: 'trick-nm-4',
          title: 'Odd Ordinates Get 4, Even Get 2',
          trick:
            "In Simpson's one-third rule the weight-4 terms are the ODD-numbered ordinates (y1, y3, y5...) and weight-2 the EVEN ones. Endpoints always get weight 1. Mixing these up is the classic error.",
          whenToUse: "All Simpson's rule computations.",
        },
      ],
      howToSolve: [
        {
          id: 'solve-nm-7',
          step: 'Step 1: Tabulate the Ordinates and Confirm the Interval Count',
          detail:
            'Compute h = (b - a)/n, tabulate all ordinates, and verify n is even for the one-third rule or a multiple of three for the three-eighth rule.',
          questionType: 'Numerical Integration Problem',
        },
        {
          id: 'solve-nm-8',
          step: 'Step 2: Apply the Weighted Sum and Comment on Accuracy',
          detail:
            'Insert the ordinates with their correct weights, compute the result and compare with the exact integral where available, stating the order of the error.',
          questionType: 'Numerical Integration Problem',
        },
      ],
    },
    {
      id: 'nm-mod5-ode-numerical',
      subjectId: 'bsc-karnataka-numerical-methods',
      title: 'Numerical Solution of Ordinary Differential Equations',
      moduleNumber: 5,
      moduleName: 'Module 5: Numerical ODE Methods',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-nm-mod5-01', 'q-nm-mod5-02'],
      subtopics: [
        'Taylor series method and its order of accuracy',
        'Euler\u2019s method, its geometric interpretation and error behaviour',
        'Modified Euler (Heun) method as a predictor-corrector scheme',
        'Runge-Kutta fourth order method and its weighting of slopes',
        'Stability, step size selection and comparison of methods',
      ],
      explanationMd: `# Numerical Solution of ODEs

### The Problem
Given dy/dx = f(x, y) with y(x_0) = y_0, find y at successive points. Analytical solution is often impossible, so numerical marching is used.

### Taylor Series Method
Expand y about x_n:

y_(n+1) = y_n + h y'_n + h^2/2! y''_n + h^3/3! y'''_n + ...

Higher derivatives are obtained by repeated differentiation of f(x, y) using the chain rule. Accuracy is high but the algebra becomes unwieldy beyond the third or fourth derivative.

### Euler's Method
y_(n+1) = y_n + h f(x_n, y_n)

Geometrically, it follows the tangent at the current point for one step. The **local truncation error** is O(h^2) and the **global error** O(h), so it is first-order accurate. Errors accumulate in the direction of the curvature, making Euler visibly drift for stiff or rapidly curving solutions.

### Modified Euler (Heun)
A predictor-corrector scheme:
1. Predict: y* = y_n + h f(x_n, y_n)
2. Correct: y_(n+1) = y_n + (h/2) [f(x_n, y_n) + f(x_(n+1), y*)]

Averaging the slopes at both ends raises the global error to O(h^2).

### Runge-Kutta Fourth Order
The standard workhorse, requiring four slope evaluations per step:

k1 = h f(x_n, y_n)
k2 = h f(x_n + h/2, y_n + k1/2)
k3 = h f(x_n + h/2, y_n + k2/2)
k4 = h f(x_n + h, y_n + k3)
y_(n+1) = y_n + (k1 + 2k2 + 2k3 + k4)/6

The global error is O(h^4) — doubling accuracy requires only a modest reduction in h — and no derivatives beyond f are needed, which is why it dominates practice.

### Step Size and Stability
Smaller h improves accuracy but increases computation and round-off accumulation. For stiff equations, explicit methods require impractically small h for **stability**, motivating implicit methods in scientific computing.`,
      formulas: [
        {
          id: 'formula-nm-6',
          label: "Euler's Method",
          formula: 'y_(n+1) = y_n + h f(x_n, y_n)',
          exampleQ:
            "Solve dy/dx = x + y with y(0) = 1 using Euler's method with h = 0.1 for two steps.",
          exampleA:
            'Step 1: f(0, 1) = 0 + 1 = 1, so y1 = 1 + 0.1(1) = 1.1 at x = 0.1. Step 2: f(0.1, 1.1) = 1.2, so y2 = 1.1 + 0.1(1.2) = 1.22 at x = 0.2.',
        },
        {
          id: 'formula-nm-7',
          label: 'Runge-Kutta Fourth Order Update',
          formula: 'y_(n+1) = y_n + (k1 + 2k2 + 2k3 + k4) / 6',
          exampleQ: 'What weights are applied to the four slopes in the classical RK4 method?',
          exampleA:
            'k1 and k4 receive weight 1 each, while k2 and k3 receive weight 2 each, all divided by 6. The doubled weight on the midpoint slopes is what delivers fourth-order accuracy.',
        },
      ],
      tricks: [
        {
          id: 'trick-nm-5',
          title: 'k2 and k3 Both Use the Midpoint',
          trick:
            'In RK4, k2 and k3 are both evaluated at x + h/2 — k2 using y + k1/2 and k3 using y + k2/2. Confusing the increment used in k3 is the most common transcription error in RK4 tables.',
          whenToUse: 'Runge-Kutta computations.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-nm-9',
          step: 'Step 1: Set Up the Iteration Table',
          detail:
            'Create columns for x, y, f(x, y) and (for RK4) k1 to k4, and confirm the step size and number of steps required.',
          questionType: 'Numerical ODE Problem',
        },
        {
          id: 'solve-nm-10',
          step: 'Step 2: March Forward and Compare With the Exact Solution',
          detail:
            'Compute each step carefully retaining full precision, then compare the final value with the analytical solution to quantify the error.',
          questionType: 'Numerical ODE Problem',
        },
      ],
    },
  ],

  // ── 7. Classical & Quantum Mechanics (Sem 4) ──
  'bsc-karnataka-mechanics': [
    {
      id: 'mech-mod1-newtonian',
      subjectId: 'bsc-karnataka-mechanics',
      title: 'Newtonian Mechanics, Conservation Laws & Central Forces',
      moduleNumber: 1,
      moduleName: 'Module 1: Classical Mechanics',
      order: 1,
      difficulty: 'basic',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-mech-mod1-01', 'q-mech-mod1-02'],
      subtopics: [
        "Newton's laws, inertial frames and the concept of pseudo force",
        'Conservation of linear momentum and collisions',
        'Work-energy theorem, conservative forces and potential energy',
        'Angular momentum, torque and central force motion',
        'Simple harmonic motion and the simple pendulum',
      ],
      explanationMd: `# Newtonian Mechanics

### Newton's Laws and Reference Frames
Newton's laws hold only in **inertial frames** — frames not accelerating. In an accelerating frame, **pseudo forces** such as the centrifugal and Coriolis forces must be introduced to preserve the form of the second law. The Coriolis force explains the deflection of winds and ocean currents on the rotating Earth.

### Conservation Laws
- **Linear momentum** is conserved when the net external force is zero. In collisions, momentum is always conserved; kinetic energy is conserved only in **elastic** collisions.
- **Energy** is conserved for conservative forces, where the work done is path independent and equals the negative change in potential energy.
- **Angular momentum** is conserved when the net external torque is zero — the basis of a spinning skater pulling in her arms to spin faster.

### Central Force Motion
A central force acts along the line joining two bodies and depends only on their separation. Under such a force, angular momentum is conserved, so motion is confined to a plane, and Kepler's second law (equal areas in equal times) follows directly.

### Simple Harmonic Motion
Any system with a restoring force proportional to displacement executes SHM:

x = A sin(omega t + phi), with omega = sqrt(k/m)

The period of a simple pendulum for small amplitudes is T = 2 pi sqrt(l/g), independent of mass and amplitude. Energy alternates between kinetic (maximum at the mean position) and potential (maximum at the extremes), while the total remains constant.`,
      formulas: [
        {
          id: 'formula-mech-1',
          label: 'Period of a Simple Pendulum',
          formula: 'T = 2 pi sqrt(l / g)',
          exampleQ: 'Find the period of a simple pendulum of length 1 m where g = 9.8 m/s^2.',
          exampleA: 'T = 2 pi sqrt(1 / 9.8) = 6.2832 x 0.3194 = 2.007 seconds.',
        },
      ],
      tricks: [
        {
          id: 'trick-mech-1',
          title: 'Momentum Always, Energy Only If Elastic',
          trick:
            'In every collision problem momentum is conserved. Kinetic energy is conserved only if the collision is stated to be elastic. Writing both conservation equations for an inelastic collision is a guaranteed error.',
          whenToUse: 'All collision problems.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-mech-1',
          step: 'Step 1: Draw the Free Body Diagram and Choose the Frame',
          detail:
            'Identify all forces, state whether the frame is inertial, and add pseudo forces if it is not.',
          questionType: 'Mechanics Numerical',
        },
        {
          id: 'solve-mech-2',
          step: 'Step 2: Apply the Appropriate Conservation Law',
          detail:
            'Select momentum, energy or angular momentum conservation based on which external action is absent, then solve and verify units.',
          questionType: 'Mechanics Numerical',
        },
      ],
    },
    {
      id: 'mech-mod2-lagrangian',
      subjectId: 'bsc-karnataka-mechanics',
      title: "Lagrangian & Hamiltonian Formulation of Mechanics",
      moduleNumber: 2,
      moduleName: 'Module 2: Analytical Mechanics',
      order: 2,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-mech-mod2-01', 'q-mech-mod2-02'],
      subtopics: [
        'Generalised coordinates and degrees of freedom',
        "D'Alembert's principle and the principle of virtual work",
        "Hamilton's principle and the Lagrangian L = T - V",
        "Hamiltonian formulation, canonical equations and phase space",
        'Advantages of analytical over Newtonian mechanics',
      ],
      explanationMd: `# Analytical Mechanics

### Generalised Coordinates
A system with n particles in three dimensions has 3n coordinates, but constraints reduce these. The number of independent coordinates needed is the number of **degrees of freedom**. Generalised coordinates q1, ..., qn are any independent set that fully specifies the configuration — angles for a pendulum, rather than x and y.

### D'Alembert's Principle
The total virtual work of the applied forces plus the inertial forces is zero for any virtual displacement consistent with the constraints:

sum over i of (F_i - m_i a_i) . delta r_i = 0

Virtual displacements are instantaneous and constraint-respecting; the principle eliminates constraint forces from the equations.

### Hamilton's Principle and the Lagrangian
The actual path taken by a system between two configurations makes the **action** S = integral L dt stationary, where L = T - V. Applying the calculus of variations yields the **Euler-Lagrange equations**:

d/dt (dL/dq_dot_i) - dL/dq_i = 0

These reproduce Newton's laws but automatically handle constraints and work in any coordinate system.

### Hamiltonian Formulation
Defining generalised momenta p_i = dL/dq_dot_i and performing a Legendre transform gives H = sum p_i q_dot_i - L, which for many systems equals the total energy. **Hamilton's canonical equations** are:

q_dot_i = dH/dp_i and p_dot_i = -dH/dq_i

This first-order symmetric form in **phase space** is the natural framework for statistical mechanics and the direct precursor of quantum mechanics through canonical quantisation.

### Why Analytical Mechanics Matters
It is coordinate-independent, avoids constraint forces entirely, and exposes conservation laws through symmetries — the content of Noether's theorem, which links time translation symmetry to energy conservation and spatial symmetry to momentum conservation.`,
      formulas: [
        {
          id: 'formula-mech-2',
          label: 'Euler-Lagrange Equation',
          formula: 'd/dt (dL/dq_dot) - dL/dq = 0, where L = T - V',
          exampleQ: 'Derive the equation of motion for a simple pendulum of length l using the Lagrangian method.',
          exampleA:
            'With theta as the generalised coordinate, T = (1/2) m l^2 theta_dot^2 and V = -m g l cos theta. L = (1/2) m l^2 theta_dot^2 + m g l cos theta. Then dL/dtheta_dot = m l^2 theta_dot and dL/dtheta = -m g l sin theta, giving m l^2 theta_ddot + m g l sin theta = 0, i.e. theta_ddot + (g/l) sin theta = 0.',
        },
      ],
      tricks: [
        {
          id: 'trick-mech-2',
          title: 'L = T - V, Not T + V',
          trick:
            'The Lagrangian is kinetic MINUS potential energy. Using T + V (the Hamiltonian) in the Euler-Lagrange equation gives the wrong sign on every term.',
          whenToUse: 'All Lagrangian derivations.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-mech-3',
          step: 'Step 1: Choose Generalised Coordinates and Express T and V',
          detail:
            'Count the degrees of freedom, select convenient generalised coordinates, and write kinetic and potential energy entirely in terms of them.',
          questionType: 'Analytical Mechanics Derivation',
        },
        {
          id: 'solve-mech-4',
          step: 'Step 2: Form L and Apply Euler-Lagrange',
          detail:
            'Compute L = T - V, take the required partial derivatives, and simplify to obtain the equation of motion, comparing with the small-angle limit where applicable.',
          questionType: 'Analytical Mechanics Derivation',
        },
      ],
    },
    {
      id: 'mech-mod3-wave-particle',
      subjectId: 'bsc-karnataka-mechanics',
      title: 'Wave-Particle Duality, de Broglie Hypothesis & Blackbody Radiation',
      moduleNumber: 3,
      moduleName: 'Module 3: Origins of Quantum Theory',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-mech-mod3-01', 'q-mech-mod3-02'],
      subtopics: [
        'Failure of classical physics: blackbody radiation and the ultraviolet catastrophe',
        "Planck's quantum hypothesis and the photoelectric effect",
        "Compton effect and the particle nature of light",
        "de Broglie's matter wave hypothesis and its experimental confirmation",
        'Davisson-Germer experiment and the wave nature of electrons',
      ],
      explanationMd: `# Origins of Quantum Theory

### The Ultraviolet Catastrophe
Classical physics (Rayleigh-Jeans law) predicted that blackbody radiation intensity would grow without bound at short wavelengths, contradicting experiment. **Planck** resolved this in 1900 by assuming energy is exchanged in discrete quanta E = h nu, which reproduces the observed spectrum exactly and introduces Planck's constant h.

### The Photoelectric Effect
Einstein extended the quantum idea: light itself consists of quanta (photons) of energy h nu. Emission occurs only when h nu exceeds the **work function** phi of the metal, giving:

K_max = h nu - phi

This explains why emission depends on frequency, not intensity, and why there is a threshold frequency below which no emission occurs however bright the light — inexplicable classically.

### The Compton Effect
X-rays scattered by electrons show a wavelength increase:

delta lambda = (h / m_e c) (1 - cos theta)

The shift depends only on the scattering angle, exactly as expected if photons carry momentum p = h/lambda and collide like particles. This was decisive evidence for the particle nature of light.

### de Broglie's Hypothesis
De Broglie proposed that matter has wave properties, with wavelength:

lambda = h / p = h / (m v)

For an electron accelerated through a potential V this becomes lambda = 12.27 / sqrt(V) angstrom. The hypothesis was confirmed by the **Davisson-Germer experiment**, in which electrons diffracted from a nickel crystal produced interference maxima matching the predicted wavelength — establishing wave-particle duality for matter.`,
      formulas: [
        {
          id: 'formula-mech-3',
          label: "de Broglie Wavelength",
          formula: 'lambda = h / p = h / (m v)',
          exampleQ:
            'Find the de Broglie wavelength of an electron (mass 9.11 x 10^-31 kg) moving at 10^6 m/s.',
          exampleA:
            'p = 9.11 x 10^-31 x 10^6 = 9.11 x 10^-25 kg m/s. lambda = 6.626 x 10^-34 / 9.11 x 10^-25 = 7.27 x 10^-10 m = 7.27 angstrom, comparable to atomic spacings — which is why electron diffraction is observable.',
        },
        {
          id: 'formula-mech-4',
          label: 'Photoelectric Equation',
          formula: 'K_max = h nu - phi',
          exampleQ:
            'Light of frequency 1.0 x 10^15 Hz falls on a metal with work function 2.0 eV. Find the maximum kinetic energy of emitted electrons.',
          exampleA:
            'h nu = 6.626 x 10^-34 x 10^15 = 6.626 x 10^-19 J = 4.14 eV. K_max = 4.14 - 2.0 = 2.14 eV.',
        },
      ],
      tricks: [
        {
          id: 'trick-mech-3',
          title: 'Frequency Not Intensity',
          trick:
            'In the photoelectric effect, increasing intensity increases the NUMBER of electrons but not their maximum kinetic energy — only frequency does that. This single distinction answers most conceptual questions.',
          whenToUse: 'Photoelectric effect questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-mech-5',
          step: 'Step 1: Convert All Quantities to SI Units',
          detail:
            'Convert electron volts to joules, angstroms to metres and electron mass correctly before substituting; unit errors dominate this topic.',
          questionType: 'Quantum Physics Numerical',
        },
        {
          id: 'solve-mech-6',
          step: 'Step 2: Apply the Relevant Quantum Relation and Interpret',
          detail:
            'Substitute into the appropriate formula, then comment on whether the result is physically meaningful — for instance whether the wavelength is small enough for diffraction to be observed.',
          questionType: 'Quantum Physics Numerical',
        },
      ],
    },
    {
      id: 'mech-mod4-schrodinger',
      subjectId: 'bsc-karnataka-mechanics',
      title: 'The Schrodinger Equation & Particle in a Box',
      moduleNumber: 4,
      moduleName: 'Module 4: Wave Mechanics',
      order: 4,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-mech-mod4-01', 'q-mech-mod4-02'],
      subtopics: [
        'Wave function, its statistical interpretation and normalisation',
        'Time-dependent and time-independent Schrodinger equations',
        'Requirements on the wave function: continuity, single-valuedness and finiteness',
        'Particle in a one-dimensional infinite potential well: energy quantisation',
        'Zero point energy, nodes and the correspondence principle',
      ],
      explanationMd: `# The Schrodinger Equation

### The Wave Function
The state of a quantum system is described by a wave function psi(x, t). **Born's interpretation** is that |psi|^2 dx gives the probability of finding the particle between x and x + dx. Since the particle must be somewhere:

integral over all space of |psi|^2 dx = 1

This is **normalisation**. The wave function must be single-valued, continuous, finite and (where the potential is finite) have a continuous first derivative.

### The Equations
The **time-dependent** Schrodinger equation is:

i h_bar (d psi / dt) = -(h_bar^2 / 2m) (d^2 psi / dx^2) + V psi

For time-independent potentials, separation of variables gives the **time-independent** form:

-(h_bar^2 / 2m) (d^2 psi / dx^2) + V psi = E psi

### Particle in a Box
For an infinite potential well of width L (V = 0 inside, infinite outside), the boundary conditions psi(0) = psi(L) = 0 force:

psi_n(x) = sqrt(2/L) sin(n pi x / L)

E_n = (n^2 pi^2 h_bar^2) / (2 m L^2) = n^2 h^2 / (8 m L^2)

Three consequences follow directly:
1. **Energy is quantised** — only discrete values are allowed, because the boundary conditions admit only certain wavelengths.
2. **Zero point energy** — the lowest energy E_1 is non-zero, so a confined particle can never be at rest. This is a direct consequence of the uncertainty principle.
3. **Nodes** — psi_n has (n - 1) interior nodes where the probability density vanishes.

### Correspondence Principle
For large n the probability distribution approaches the classical uniform distribution, showing that quantum mechanics reproduces classical physics in the macroscopic limit.`,
      formulas: [
        {
          id: 'formula-mech-5',
          label: 'Energy Levels in a One-Dimensional Box',
          formula: 'E_n = n^2 h^2 / (8 m L^2)',
          exampleQ:
            'An electron is confined in a box of width 1 angstrom. Find the ground state energy.',
          exampleA:
            'E_1 = (6.626 x 10^-34)^2 / (8 x 9.11 x 10^-31 x (10^-10)^2) = 4.39 x 10^-67 / 7.29 x 10^-49 = 6.02 x 10^-19 J = 3.76 eV.',
        },
      ],
      tricks: [
        {
          id: 'trick-mech-4',
          title: 'Energy Scales With n Squared and 1/L Squared',
          trick:
            'In a box, E_n is proportional to n^2 and inversely proportional to L^2. So halving the box width quadruples every energy level. Stating this scaling answers most qualitative questions without calculation.',
          whenToUse: 'Particle in a box conceptual and numerical questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-mech-7',
          step: 'Step 1: Write the Schrodinger Equation for the Given Potential',
          detail:
            'Specify V(x) in each region, write the equation, and state the boundary conditions the wave function must satisfy.',
          questionType: 'Wave Mechanics Problem',
        },
        {
          id: 'solve-mech-8',
          step: 'Step 2: Solve, Apply Boundary Conditions and Normalise',
          detail:
            'Obtain the general solution, impose the boundary conditions to quantise the energy, and determine the normalisation constant from the probability condition.',
          questionType: 'Wave Mechanics Problem',
        },
      ],
    },
    {
      id: 'mech-mod5-uncertainty',
      subjectId: 'bsc-karnataka-mechanics',
      title: 'Heisenberg Uncertainty Principle & Quantum Tunnelling',
      moduleNumber: 5,
      moduleName: 'Module 5: Quantum Phenomena',
      order: 5,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-mech-mod5-01', 'q-mech-mod5-02'],
      subtopics: [
        'Statement, derivation from wave packets and physical significance',
        'Conjugate variable pairs and the energy-time uncertainty relation',
        'Estimation of zero point energy and atomic ground state energy',
        'Quantum tunnelling and the transmission coefficient',
        'Applications: alpha decay, scanning tunnelling microscope and tunnel diodes',
      ],
      explanationMd: `# Uncertainty Principle & Tunnelling

### The Principle
Heisenberg's uncertainty principle states that certain pairs of physical quantities cannot both be known with arbitrary precision:

delta x delta p >= h_bar / 2

The limitation is not experimental clumsiness but a fundamental property of wave-like systems: a sharply localised wave packet requires a broad spread of momenta, since position and momentum are Fourier conjugates.

Other conjugate pairs include energy and time (delta E delta t >= h_bar / 2) and angular position and angular momentum.

### Consequences
- **No stationary electron in the nucleus**: confining an electron to nuclear dimensions would give it a momentum uncertainty implying kinetic energy far exceeding nuclear binding.
- **Zero point energy**: a particle in a potential well cannot have zero energy, since that would fix both position and momentum exactly.
- **Estimating atomic size**: minimising the total energy of a hydrogen atom subject to the uncertainty relation reproduces the Bohr radius and ground state energy to within a factor.

### Quantum Tunnelling
Classically a particle with energy E cannot pass a barrier of height V0 greater than E. Quantum mechanically the wave function decays exponentially inside the barrier but does not vanish, so there is a non-zero probability of transmission:

T ≈ e^(-2 k a), where k = sqrt(2m(V0 - E)) / h_bar

The probability falls exponentially with barrier width a and with the square root of the barrier height — which is why tunnelling is significant only over atomic distances.

### Applications
- **Alpha decay**: Gamow explained how alpha particles escape the nucleus despite insufficient energy, using tunnelling; the exponential dependence accounts for the enormous range of observed half-lives.
- **Scanning tunnelling microscope**: tunnelling current varies exponentially with tip-sample separation, giving atomic resolution.
- **Tunnel diodes** and **flash memory** both rely on electron tunnelling through thin insulating layers.`,
      formulas: [
        {
          id: 'formula-mech-6',
          label: 'Heisenberg Uncertainty Principle',
          formula: 'delta x delta p >= h_bar / 2',
          exampleQ:
            'The position of an electron is measured with an uncertainty of 0.1 angstrom. Estimate the minimum uncertainty in its momentum.',
          exampleA:
            'delta p >= h_bar / (2 delta x) = 1.055 x 10^-34 / (2 x 10^-11) = 5.27 x 10^-24 kg m/s. The corresponding velocity uncertainty is 5.27 x 10^-24 / 9.11 x 10^-31 = 5.79 x 10^6 m/s, a substantial fraction of the speed of light.',
        },
      ],
      tricks: [
        {
          id: 'trick-mech-5',
          title: 'Use h_bar/2 for the Minimum, h for Estimates',
          trick:
            'The rigorous bound is h_bar/2, but many textbook estimation problems use the order-of-magnitude form delta x delta p ≈ h. Check which convention the question expects — using the wrong one gives an answer out by about 6.28.',
          whenToUse: 'Uncertainty principle numerical problems.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-mech-9',
          step: 'Step 1: Identify the Conjugate Pair and the Given Uncertainty',
          detail:
            'Determine whether the problem concerns position-momentum or energy-time, and note which uncertainty is specified.',
          questionType: 'Uncertainty Principle Problem',
        },
        {
          id: 'solve-mech-10',
          step: 'Step 2: Compute the Minimum Uncertainty and Interpret',
          detail:
            'Apply the inequality, convert to a velocity or energy uncertainty, and comment on whether the result is physically significant for the system in question.',
          questionType: 'Uncertainty Principle Problem',
        },
      ],
    },
  ],

  // ── 8. Applied Statistics & Statistical Inference (Sem 4) ──
  'bsc-karnataka-applied-stats': [
    {
      id: 'stat-mod1-sampling-dist',
      subjectId: 'bsc-karnataka-applied-stats',
      title: 'Sampling Distributions & Estimation Theory',
      moduleNumber: 1,
      moduleName: 'Module 1: Sampling Distributions and Estimation',
      order: 1,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-stat-mod1-01', 'q-stat-mod1-02'],
      subtopics: [
        'Sampling distribution of the mean, proportion and variance',
        'Standard error and the finite population correction factor',
        'Properties of estimators: unbiasedness, efficiency, consistency and sufficiency',
        'Point estimation methods: method of moments and maximum likelihood',
        'Confidence intervals for the mean and proportion',
      ],
      explanationMd: `# Sampling Distributions & Estimation

### Sampling Distribution
A **sampling distribution** is the distribution of a statistic over all possible samples of a given size. For the sample mean from a population with mean mu and standard deviation sigma:

- Mean of X-bar = mu
- Standard error = sigma / sqrt(n)

By the central limit theorem, X-bar is approximately normal for large n regardless of the parent distribution.

For a sample proportion p, the standard error is sqrt(p(1-p)/n).

### Finite Population Correction
When sampling without replacement from a finite population of size N and the sampling fraction n/N exceeds 0.05, the standard error is multiplied by sqrt((N - n)/(N - 1)).

### Properties of Good Estimators
- **Unbiasedness**: E(estimator) = parameter.
- **Efficiency**: minimum variance among unbiased estimators.
- **Consistency**: the estimator converges to the parameter as n increases.
- **Sufficiency**: the estimator uses all the information in the sample about the parameter.

Note that the sample variance with denominator (n - 1) is unbiased, while the version with denominator n is biased but consistent — the **degrees of freedom** correction compensates for estimating the mean from the same data.

### Interval Estimation
A 100(1 - alpha)% confidence interval for the mean (sigma known) is:

X-bar +/- Z_(alpha/2) x (sigma / sqrt(n))

Interpretation matters: the interval either contains the parameter or it does not; the confidence level describes the long-run proportion of such intervals that would contain the parameter over repeated sampling.

### Maximum Likelihood
The maximum likelihood estimator chooses the parameter value that makes the observed sample most probable. MLEs are consistent, asymptotically normal and asymptotically efficient, which is why the method dominates modern statistics.`,
      formulas: [
        {
          id: 'formula-stat-1',
          label: 'Confidence Interval for the Mean (sigma known)',
          formula: 'X-bar +/- Z_(alpha/2) x (sigma / sqrt(n))',
          exampleQ:
            'A sample of 100 items has mean 50 and the population standard deviation is 8. Construct a 95% confidence interval for the mean.',
          exampleA:
            'Z = 1.96. Standard error = 8/10 = 0.8. Margin of error = 1.96 x 0.8 = 1.568. Interval = 50 +/- 1.568, i.e. (48.43, 51.57).',
        },
      ],
      tricks: [
        {
          id: 'trick-stat-1',
          title: 'Use n - 1 for the Sample Variance',
          trick:
            'The unbiased sample variance divides by n - 1, not n. Using n underestimates the population variance — and if a question asks specifically for an unbiased estimator, the denominator is the entire mark.',
          whenToUse: 'Estimation and variance computation questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-stat-1',
          step: 'Step 1: Identify the Statistic and Its Standard Error',
          detail:
            'Determine whether the problem concerns a mean or a proportion, whether sigma is known, and whether the finite population correction applies.',
          questionType: 'Estimation Problem',
        },
        {
          id: 'solve-stat-2',
          step: 'Step 2: Find the Critical Value and Construct the Interval',
          detail:
            'Select the appropriate Z or t value for the stated confidence level, compute the margin of error, and state the interval with a correct interpretation.',
          questionType: 'Estimation Problem',
        },
      ],
    },
    {
      id: 'stat-mod2-hypothesis-testing',
      subjectId: 'bsc-karnataka-applied-stats',
      title: 'Hypothesis Testing: Z, t, Chi-Square & F Tests',
      moduleNumber: 2,
      moduleName: 'Module 2: Tests of Hypothesis',
      order: 2,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-stat-mod2-01', 'q-stat-mod2-02'],
      subtopics: [
        'Null and alternative hypotheses, and one-tailed versus two-tailed tests',
        'Type I and Type II errors, significance level and power',
        'Z and t tests for means, and tests for proportions',
        'Chi-square tests of goodness of fit and independence',
        'F test for equality of variances and the choice between Z and t',
      ],
      explanationMd: `# Hypothesis Testing

### The Procedure
1. State H0 and H1.
2. Choose the significance level alpha (usually 0.05).
3. Select the test statistic and its sampling distribution.
4. Compute the statistic from the data.
5. Compare with the critical value, or compare the p-value with alpha.
6. Conclude in the context of the problem.

### Errors
- **Type I (alpha)**: rejecting a true H0 — a false positive.
- **Type II (beta)**: not rejecting a false H0 — a false negative.

The two are inversely related for fixed n; only increasing the sample size reduces both. **Power = 1 - beta**.

### Choice Between Z and t
Use the **Z test** when the population standard deviation is known or the sample is large (n >= 30), invoking the central limit theorem. Use the **t test** when sigma is unknown and estimated from a small sample; the t distribution has heavier tails, and its shape depends on n - 1 degrees of freedom, approaching the normal as n grows.

### Chi-Square Tests
- **Goodness of fit**: compares observed frequencies with expected frequencies under a hypothesised distribution, with degrees of freedom (k - 1 - number of estimated parameters).
- **Independence**: tests association in an r x c contingency table with degrees of freedom (r - 1)(c - 1).

chi-square = sum of (O - E)^2 / E

Expected frequencies should ideally be at least 5; otherwise categories are combined.

### F Test
The F statistic is the ratio of two independent variance estimates and is used to test equality of variances and in analysis of variance. It is always non-negative and its distribution is skewed right, so critical values are read from the upper tail.`,
      formulas: [
        {
          id: 'formula-stat-2',
          label: 'One-Sample t Statistic',
          formula: 't = (X-bar - mu) / (s / sqrt(n)), with n - 1 degrees of freedom',
          exampleQ:
            'A sample of 16 observations has mean 45 and standard deviation 6. Test whether the population mean differs from 50 at the 5% level.',
          exampleA:
            't = (45 - 50) / (6 / sqrt(16)) = -5 / 1.5 = -3.333 with 15 degrees of freedom. The two-tailed critical value is 2.131. Since |t| = 3.333 > 2.131, we reject H0: the mean differs significantly from 50.',
        },
      ],
      tricks: [
        {
          id: 'trick-stat-2',
          title: 'Small Sample + Unknown Sigma Means t',
          trick:
            'The deciding question is whether the population standard deviation is KNOWN. If it is, use Z regardless of sample size. If it is estimated from a small sample, use t. Many students choose based on sample size alone and get it wrong.',
          whenToUse: 'Test selection questions.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-stat-3',
          step: 'Step 1: State the Hypotheses and the Tail of the Test',
          detail:
            'Write H0 and H1 formally and identify whether the test is one- or two-tailed from the wording of the alternative.',
          questionType: 'Hypothesis Testing Problem',
        },
        {
          id: 'solve-stat-4',
          step: 'Step 2: Compute the Statistic, Compare and Conclude',
          detail:
            'Calculate the test statistic with the correct degrees of freedom, compare with the tabulated critical value, and express the conclusion in the context of the problem.',
          questionType: 'Hypothesis Testing Problem',
        },
      ],
    },
    {
      id: 'stat-mod3-correlation-regression',
      subjectId: 'bsc-karnataka-applied-stats',
      title: 'Correlation & Regression Analysis',
      moduleNumber: 3,
      moduleName: 'Module 3: Correlation and Regression',
      order: 3,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-stat-mod3-01', 'q-stat-mod3-02'],
      subtopics: [
        'Scatter diagrams and Karl Pearson\u2019s coefficient of correlation',
        "Spearman's rank correlation and the treatment of tied ranks",
        'Properties and interpretation of the correlation coefficient',
        'Regression lines of y on x and x on y, and their intersection',
        'Coefficient of determination and the standard error of estimate',
      ],
      explanationMd: `# Correlation & Regression

### Correlation
Karl Pearson's coefficient measures the strength and direction of **linear** association:

r = Cov(x, y) / (sigma_x sigma_y) = [n sum(xy) - sum(x) sum(y)] / sqrt{[n sum(x^2) - (sum x)^2][n sum(y^2) - (sum y)^2]}

Properties: -1 <= r <= 1; r is unit free and unaffected by change of origin or scale; r = 0 means no *linear* relationship (a perfect quadratic relation can still give r = 0).

**Spearman's rank correlation** uses ranks rather than values:

rho = 1 - (6 sum d^2) / (n(n^2 - 1))

It suits ordinal data or data with outliers. With tied ranks, assign the average rank and add the correction term.

### Regression
The **regression line of y on x** predicts y from x and is fitted by minimising vertical residuals:

y - y_bar = b_yx (x - x_bar), where b_yx = r (sigma_y / sigma_x)

The **line of x on y** minimises horizontal residuals. The two lines coincide only when r = +/- 1 and always intersect at (x_bar, y_bar). Importantly:

b_yx x b_xy = r^2

so r is the geometric mean of the two regression coefficients — a frequently examined result.

### Coefficient of Determination
r^2 gives the proportion of variation in y explained by x. If r = 0.8, then 64% of the variation is explained and 36% is unexplained. The **standard error of estimate** measures the average scatter of points about the regression line.

### Correlation Is Not Causation
A significant correlation establishes association only. Confounding variables, reverse causation and coincidence must all be ruled out before any causal claim.`,
      formulas: [
        {
          id: 'formula-stat-3',
          label: "Spearman's Rank Correlation",
          formula: 'rho = 1 - (6 sum d^2) / (n (n^2 - 1))',
          exampleQ:
            'For n = 8 paired ranks, sum d^2 = 20. Compute Spearman\u2019s rank correlation coefficient.',
          exampleA:
            'rho = 1 - (6 x 20) / (8 x 63) = 1 - 120 / 504 = 1 - 0.2381 = 0.7619, indicating strong positive rank association.',
        },
        {
          id: 'formula-stat-4',
          label: 'Relation Between Regression Coefficients and r',
          formula: 'r^2 = b_yx x b_xy, hence r = +/- sqrt(b_yx x b_xy)',
          exampleQ:
            'The regression coefficient of y on x is 1.6 and of x on y is 0.4. Find r.',
          exampleA:
            'r^2 = 1.6 x 0.4 = 0.64, so r = 0.8 (positive because both regression coefficients are positive).',
        },
      ],
      tricks: [
        {
          id: 'trick-stat-3',
          title: 'Both Regression Coefficients Must Have the Same Sign as r',
          trick:
            'If the two regression coefficients have opposite signs, an error has been made — r would be imaginary. Checking sign agreement catches most computational mistakes immediately.',
          whenToUse: 'Regression coefficient problems.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-stat-5',
          step: 'Step 1: Build the Computation Table',
          detail:
            'Tabulate x, y, x^2, y^2 and xy with their sums — this single table serves both the correlation coefficient and both regression equations.',
          questionType: 'Correlation and Regression Problem',
        },
        {
          id: 'solve-stat-6',
          step: 'Step 2: Compute r, Then the Regression Lines',
          detail:
            'Substitute into the correlation formula, verify that r lies within the valid range, then form each regression line and state the coefficient of determination.',
          questionType: 'Correlation and Regression Problem',
        },
      ],
    },
    {
      id: 'stat-mod4-doe-anova',
      subjectId: 'bsc-karnataka-applied-stats',
      title: 'Design of Experiments & Analysis of Variance',
      moduleNumber: 4,
      moduleName: 'Module 4: Design of Experiments',
      order: 4,
      difficulty: 'advanced',
      tier: 'premium',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-stat-mod4-01', 'q-stat-mod4-02'],
      subtopics: [
        'Principles of experimental design: replication, randomisation and local control',
        'Completely randomised design and its analysis',
        'Randomised block design and the removal of nuisance variation',
        'Latin square design for controlling two sources of variation',
        'One-way and two-way ANOVA tables and the F test',
      ],
      explanationMd: `# Design of Experiments & ANOVA

### Fisher's Three Principles
1. **Replication**: repeating an experiment on multiple experimental units to estimate experimental error and improve precision.
2. **Randomisation**: assigning treatments at random so that uncontrolled factors affect all treatments equally, making the error estimate unbiased.
3. **Local control**: grouping similar units into blocks so that known nuisance variation is separated from experimental error.

### Completely Randomised Design (CRD)
Treatments are assigned completely at random to homogeneous units. Simple and flexible, with maximum degrees of freedom for error, but inefficient when the material is heterogeneous.

### Randomised Block Design (RBD)
Units are grouped into homogeneous **blocks**, and every treatment appears once in each block. Block-to-block variation is removed from the error term, increasing sensitivity. The cost is fewer error degrees of freedom.

### Latin Square Design
Controls **two** sources of nuisance variation by arranging treatments so each appears exactly once in each row and each column. It requires the number of treatments, rows and columns to be equal, which limits its use.

### ANOVA
ANOVA partitions total variation into components attributable to treatments, blocks and error:

Total SS = Treatment SS + Block SS + Error SS

The F statistic is the ratio of the treatment mean square to the error mean square. A significant F indicates that not all treatment means are equal.

| Source | SS | df | MS | F |
|---|---|---|---|---|
| Treatments | SST | k - 1 | SST/(k-1) | MST/MSE |
| Blocks | SSB | b - 1 | SSB/(b-1) | — |
| Error | SSE | (k-1)(b-1) | SSE/df | — |
| Total | TSS | kb - 1 | — | — |

The additive decomposition of degrees of freedom provides a built-in arithmetic check on the whole table.`,
      formulas: [
        {
          id: 'formula-stat-5',
          label: 'One-Way ANOVA F Statistic',
          formula: 'F = Mean Square Between / Mean Square Within = MSB / MSW',
          exampleQ:
            'In a one-way ANOVA, the treatment sum of squares is 120 with 3 degrees of freedom and the error sum of squares is 80 with 20 degrees of freedom. Compute F.',
          exampleA:
            'MSB = 120/3 = 40. MSW = 80/20 = 4. F = 40/4 = 10 with (3, 20) degrees of freedom, which exceeds the 5% critical value of about 3.10, so the treatment means differ significantly.',
        },
      ],
      tricks: [
        {
          id: 'trick-stat-4',
          title: 'Degrees of Freedom Must Add Up',
          trick:
            'Always verify that the treatment, block and error degrees of freedom sum to the total. If they do not, a sum of squares has been miscomputed — check this before interpreting any F value.',
          whenToUse: 'All ANOVA table construction.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-stat-7',
          step: 'Step 1: Compute the Correction Factor and All Sums of Squares',
          detail:
            'Find the correction factor (grand total)^2 / N, then compute total, treatment, block and error sums of squares, checking that they add correctly.',
          questionType: 'ANOVA Problem',
        },
        {
          id: 'solve-stat-8',
          step: 'Step 2: Assemble the Table, Compute F and Conclude',
          detail:
            'Divide each sum of squares by its degrees of freedom, form the F ratio, compare with the tabulated value and state the conclusion about the treatment means.',
          questionType: 'ANOVA Problem',
        },
      ],
    },
    {
      id: 'stat-mod5-index-time-series',
      subjectId: 'bsc-karnataka-applied-stats',
      title: 'Index Numbers, Time Series & Statistical Quality Control',
      moduleNumber: 5,
      moduleName: 'Module 5: Applied Statistical Techniques',
      order: 5,
      difficulty: 'core',
      tier: 'free',
      status: 'published',
      generatedBy: 'curator',
      contentVersion: 1,
      publishedAt: PUBLISHED_AT,
      featuredQuestionIds: ['q-stat-mod5-01', 'q-stat-mod5-02'],
      subtopics: [
        'Construction of index numbers: Laspeyres, Paasche and Fisher ideals',
        'Tests of adequacy: time reversal and factor reversal',
        'Components of a time series and the method of least squares trend fitting',
        'Seasonal variation measurement by the ratio-to-trend method',
        'Control charts for variables (X-bar and R) and for attributes (p and c charts)',
      ],
      explanationMd: `# Index Numbers, Time Series & Quality Control

### Index Numbers
An index measures the relative change in a variable or group of variables over time.
- **Laspeyres**: uses base year quantities as weights — P01 = [sum(p1 q0) / sum(p0 q0)] x 100. It tends to overstate inflation because it ignores substitution away from goods whose prices rise.
- **Paasche**: uses current year quantities — P01 = [sum(p1 q1) / sum(p0 q1)] x 100. It tends to understate inflation.
- **Fisher's ideal index**: the geometric mean of the two — P01 = sqrt(Laspeyres x Paasche) x 100.

### Tests of Adequacy
- **Time reversal test**: P01 x P10 = 10000 (in index units). Fisher's index satisfies it.
- **Factor reversal test**: P01 x Q01 = [sum(p1 q1) / sum(p0 q0)] x 10000. Only Fisher's index satisfies both, which is why it is called ideal.

### Time Series Components
A time series is decomposed into:
- **Trend (T)**: the long-term direction.
- **Seasonal (S)**: regular within-year patterns.
- **Cyclical (C)**: longer economic fluctuations.
- **Irregular (I)**: random noise.

The **least squares trend** fits Y = a + bt with:

a = sum(Y)/n and b = sum(tY) / sum(t^2)

when time periods are coded so that sum(t) = 0, which greatly simplifies the arithmetic.

### Statistical Quality Control
Control charts distinguish **assignable** from **chance** causes of variation.
- **X-bar chart** monitors the process mean; **R chart** monitors variability. Limits are typically set at +/- 3 sigma.
- **p chart** monitors the proportion defective; **c chart** the number of defects per unit.

Points outside the control limits, or systematic patterns within them, indicate an assignable cause requiring investigation. Note that control limits are computed from process data and are *not* the same as specification limits set by design.`,
      formulas: [
        {
          id: 'formula-stat-6',
          label: "Fisher's Ideal Index",
          formula: 'P01 = sqrt(Laspeyres index x Paasche index)',
          exampleQ:
            "The Laspeyres index is 125 and the Paasche index is 120. Compute Fisher's ideal index.",
          exampleA:
            'P01 = sqrt(125 x 120) = sqrt(15,000) = 122.47, indicating a 22.47% increase in the price level relative to the base period.',
        },
        {
          id: 'formula-stat-7',
          label: 'Least Squares Trend Coefficients',
          formula: 'a = sum(Y)/n; b = sum(tY)/sum(t^2), with sum(t) = 0',
          exampleQ:
            'For 5 years of data coded t = -2, -1, 0, 1, 2, sum(Y) = 500 and sum(tY) = 60. Find the trend equation.',
          exampleA:
            'a = 500/5 = 100. sum(t^2) = 4 + 1 + 0 + 1 + 4 = 10, so b = 60/10 = 6. The trend line is Y = 100 + 6t.',
        },
      ],
      tricks: [
        {
          id: 'trick-stat-5',
          title: 'Code Time So sum(t) = 0',
          trick:
            'For an odd number of periods code t as ..., -2, -1, 0, 1, 2, ...; for an even number use ..., -3, -1, 1, 3, ... Making sum(t) zero eliminates the cross-product term and halves the arithmetic.',
          whenToUse: 'All least squares trend fitting problems.',
        },
      ],
      howToSolve: [
        {
          id: 'solve-stat-9',
          step: 'Step 1: Tabulate Data With Coded Time Periods',
          detail:
            'Assign time codes so that they sum to zero, then compute the columns tY and t^2 with their totals.',
          questionType: 'Time Series / Index Problem',
        },
        {
          id: 'solve-stat-10',
          step: 'Step 2: Compute the Coefficients and Interpret',
          detail:
            'Find a and b, write the trend equation, use it for forecasting if required, and comment on the direction and rate of the trend.',
          questionType: 'Time Series / Index Problem',
        },
      ],
    },
  ],
}

export const SEEDED_BSC_QUESTIONS: UniversalQuestion[] = [
  // ── Calculus & Differential Equations ──
  {
    id: 'q-cal-mod1-01',
    questionText: 'The nth derivative of sin(ax + b) is:',
    options: [
      'a^n sin(ax + b)',
      'a^n sin(ax + b + n pi/2)',
      'a^n cos(ax + b)',
      'n a^(n-1) sin(ax + b)',
    ],
    correctIndex: 1,
    explanation:
      'Each differentiation multiplies by a and advances the phase by pi/2, giving y_n = a^n sin(ax + b + n pi/2).',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 1 },
    prepTags: { subjectId: 'bsc-karnataka-calculus', topicIds: ['cal-mod1-successive-diff'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-cal-mod1-02',
    questionText: 'The radius of curvature of y = x^2 at the point (1, 1) is:',
    options: ['5.59', '2.50', '11.18', '1.00'],
    correctIndex: 0,
    explanation:
      'y1 = 2, y2 = 2 at x = 1. R = (1 + 4)^(3/2) / 2 = 11.180 / 2 = 5.590.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-calculus', topicIds: ['cal-mod1-successive-diff'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-cal-mod2-01',
    questionText: "If f(x, y) is homogeneous of degree 3, then x f_x + y f_y equals:",
    options: ['f', '2f', '3f', 'f/3'],
    correctIndex: 2,
    explanation: "Euler's theorem for homogeneous functions states x f_x + y f_y = n f, where n is the degree of homogeneity.",
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 5, semester: 1 },
    prepTags: { subjectId: 'bsc-karnataka-calculus', topicIds: ['cal-mod2-partial-diff'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-cal-mod2-02',
    questionText:
      'For f(x, y) with f_xx = 4, f_yy = 9 and f_xy = 6 at a stationary point, the point is:',
    options: ['A local maximum', 'A local minimum', 'A saddle point', 'The test is inconclusive'],
    correctIndex: 3,
    explanation:
      'D = f_xx f_yy - f_xy^2 = 36 - 36 = 0. Since D = 0 the second derivative test is inconclusive and higher order analysis is required.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-calculus', topicIds: ['cal-mod2-partial-diff'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-cal-mod3-01',
    questionText: 'The value of the Beta function B(2, 3) is:',
    options: ['1/12', '1/6', '1/4', '1/60'],
    correctIndex: 0,
    explanation:
      'B(2, 3) = Gamma(2) Gamma(3) / Gamma(5) = (1! x 2!) / 4! = 2 / 24 = 1/12.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mangalore University', year: 2024, marks: 5, semester: 1 },
    prepTags: { subjectId: 'bsc-karnataka-calculus', topicIds: ['cal-mod3-multiple-integrals'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-cal-mod3-02',
    questionText: 'When changing from Cartesian to polar coordinates in a double integral, dx dy is replaced by:',
    options: ['dr dtheta', 'r dr dtheta', 'r^2 dr dtheta', 'sin theta dr dtheta'],
    correctIndex: 1,
    explanation: 'The Jacobian of the polar transformation is r, so the area element becomes r dr dtheta.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-calculus', topicIds: ['cal-mod3-multiple-integrals'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-cal-mod4-01',
    questionText: 'The integrating factor of the linear differential equation dy/dx + y cot x = sin x is:',
    options: ['sin x', 'cos x', 'cosec x', 'tan x'],
    correctIndex: 0,
    explanation:
      'IF = e^(integral cot x dx) = e^(log sin x) = sin x.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Karnatak University (KUD)', year: 2023, marks: 10, semester: 1 },
    prepTags: { subjectId: 'bsc-karnataka-calculus', topicIds: ['cal-mod4-first-order-de'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-cal-mod4-02',
    questionText:
      'The differential equation M dx + N dy = 0 is exact if and only if:',
    options: ['dM/dx = dN/dy', 'dM/dy = dN/dx', 'M = N', 'dM/dy = -dN/dx'],
    correctIndex: 1,
    explanation:
      'Exactness requires the mixed partial derivatives to agree: dM/dy = dN/dx. This is the standard test applied before choosing a solution method.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-calculus', topicIds: ['cal-mod4-first-order-de'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-cal-mod5-01',
    questionText:
      'The complementary function of (D^2 + 4) y = 0 is:',
    options: [
      'C1 e^(2x) + C2 e^(-2x)',
      '(C1 + C2 x) e^(2x)',
      'C1 cos 2x + C2 sin 2x',
      'e^(2x) (C1 cos 2x + C2 sin 2x)',
    ],
    correctIndex: 2,
    explanation:
      'The auxiliary equation m^2 + 4 = 0 gives m = +/- 2i, which are complex roots alpha +/- i beta with alpha = 0 and beta = 2, so CF = C1 cos 2x + C2 sin 2x.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bengaluru City University (BCU)', year: 2024, marks: 10, semester: 1 },
    prepTags: { subjectId: 'bsc-karnataka-calculus', topicIds: ['cal-mod5-higher-order-de'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-cal-mod5-02',
    questionText: 'The particular integral of (D^2 - 5D + 6) y = e^(2x) is:',
    options: ['e^(2x)', 'x e^(2x)', '-x e^(2x)', '2x e^(2x)'],
    correctIndex: 2,
    explanation:
      "f(2) = 4 - 10 + 6 = 0, so the direct formula fails. Since m = 2 is a simple root, PI = x e^(2x) / f'(2) = x e^(2x) / (2 x 2 - 5) = -x e^(2x).",
    difficulty: 'advanced',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-calculus', topicIds: ['cal-mod5-higher-order-de'], stream: 'mathematics', program: 'bsc' },
  },

  // ── Programming & Data Structures ──
  {
    id: 'q-prog-mod1-01',
    questionText:
      'Which property requires that an algorithm terminate after a finite number of steps?',
    options: ['Definiteness', 'Finiteness', 'Effectiveness', 'Determinism'],
    correctIndex: 1,
    explanation:
      'Finiteness requires termination in a finite number of steps. Definiteness requires each step to be unambiguous, and effectiveness requires each operation to be executable exactly.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 2, semester: 1 },
    prepTags: { subjectId: 'bsc-karnataka-programming', topicIds: ['prog-mod1-algorithms'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-prog-mod1-02',
    questionText: 'In a flowchart, a diamond symbol represents:',
    options: ['Input or output', 'A processing step', 'A decision point', 'The start or stop of the program'],
    correctIndex: 2,
    explanation:
      'The diamond denotes a decision with two or more outgoing branches. The parallelogram denotes input/output and the rectangle a processing step.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-programming', topicIds: ['prog-mod1-algorithms'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-prog-mod2-01',
    questionText:
      'In C, which storage class gives a variable block scope but a lifetime extending through the whole program?',
    options: ['auto', 'register', 'static', 'extern'],
    correctIndex: 2,
    explanation:
      'A static local variable retains its value between function calls because it is allocated for the program lifetime, while remaining invisible outside its block. It is zero-initialised by default.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mysore University (UOM)', year: 2024, marks: 5, semester: 1 },
    prepTags: { subjectId: 'bsc-karnataka-programming', topicIds: ['prog-mod2-c-fundamentals'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-prog-mod2-02',
    questionText: 'C passes function arguments:',
    options: ['By reference only', 'By value only', 'By value result', 'By name'],
    correctIndex: 1,
    explanation:
      'C always passes by value. To allow a function to modify the caller\u2019s variable, the address of the variable is passed and dereferenced inside the function, simulating call by reference.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-programming', topicIds: ['prog-mod2-c-fundamentals'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-prog-mod3-01',
    questionText:
      'A two-dimensional array A[10][8] is stored row-major with base address 2000 and 4 bytes per element. The address of A[4][5] is:',
    options: ['2148', '2140', '2160', '2132'],
    correctIndex: 0,
    explanation:
      'Address = 2000 + (4 x 8 + 5) x 4 = 2000 + 37 x 4 = 2000 + 148 = 2148.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mangalore University', year: 2023, marks: 10, semester: 1 },
    prepTags: { subjectId: 'bsc-karnataka-programming', topicIds: ['prog-mod3-arrays-pointers'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-prog-mod3-02',
    questionText:
      'How many bytes must an array hold to store the string "KARNATAKA" as a C string?',
    options: ['9', '10', '18', '8'],
    correctIndex: 1,
    explanation:
      'The string has 9 visible characters and requires one additional byte for the terminating null character, so the array must be at least 10 bytes.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-programming', topicIds: ['prog-mod3-arrays-pointers'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-prog-mod4-01',
    questionText: 'A stack operates on which principle?',
    options: ['First In First Out', 'Last In First Out', 'Priority based', 'Random access'],
    correctIndex: 1,
    explanation:
      'A stack is a LIFO structure: the most recently pushed element is the first to be popped. Queues, by contrast, are FIFO.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Tumkur University', year: 2024, marks: 2, semester: 1 },
    prepTags: { subjectId: 'bsc-karnataka-programming', topicIds: ['prog-mod4-stacks-queues'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-prog-mod4-02',
    questionText:
      'A circular queue of size n distinguishes full from empty by:',
    options: [
      'Keeping one slot unused',
      'Setting front equal to rear when full',
      'Using only even indices',
      'Sorting the elements',
    ],
    correctIndex: 0,
    explanation:
      'Since front == rear would otherwise mean both empty and full, one slot is sacrificed so that the queue holds at most n - 1 elements and the two conditions remain distinguishable.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-programming', topicIds: ['prog-mod4-stacks-queues'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-prog-mod5-01',
    questionText: 'The worst-case time complexity of quicksort is:',
    options: ['O(n log n)', 'O(n^2)', 'O(log n)', 'O(n)'],
    correctIndex: 1,
    explanation:
      'Quicksort degrades to O(n^2) when the pivot is consistently the smallest or largest element, as happens with already sorted input and a naive pivot choice. Its average case remains O(n log n).',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Kuvempu University', year: 2024, marks: 5, semester: 1 },
    prepTags: { subjectId: 'bsc-karnataka-programming', topicIds: ['prog-mod5-complexity'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-prog-mod5-02',
    questionText: 'Binary search on 512 sorted elements requires at most how many comparisons?',
    options: ['9', '10', '512', '256'],
    correctIndex: 1,
    explanation:
      'Since 2^9 = 512, the maximum number of comparisons is log2(512) + 1 = 9 + 1 = 10, accounting for the final comparison that confirms the element.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-programming', topicIds: ['prog-mod5-complexity'], stream: 'computing', program: 'bsc' },
  },

  // ── Real Analysis ──
  {
    id: 'q-ra-mod1-01',
    questionText: 'The supremum of the set S = {x in R : 0 < x < 1} is:',
    options: ['0', '1', 'Does not exist', '1/2'],
    correctIndex: 1,
    explanation:
      'sup S = 1 because 1 is an upper bound and no smaller number is. Note that 1 is not an element of S, so S has no maximum.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 2 },
    prepTags: { subjectId: 'bsc-karnataka-real-analysis', topicIds: ['ra-mod1-real-numbers'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-ra-mod1-02',
    questionText:
      'The completeness property of the real numbers is best expressed by which statement?',
    options: [
      'Every bounded set is finite',
      'Every non-empty set bounded above has a least upper bound in R',
      'Every sequence converges',
      'Every continuous function is differentiable',
    ],
    correctIndex: 1,
    explanation:
      'The least upper bound property is the completeness axiom. The rationals lack it: {q : q^2 < 2} has no supremum in Q.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-real-analysis', topicIds: ['ra-mod1-real-numbers'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-ra-mod2-01',
    questionText: 'The sequence a_n = (-1)^n is:',
    options: ['Convergent to 1', 'Convergent to -1', 'Convergent to 0', 'Divergent but bounded'],
    correctIndex: 3,
    explanation:
      'The sequence oscillates between -1 and 1 and is therefore bounded but divergent. This is the standard counterexample showing boundedness does not imply convergence.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 5, semester: 2 },
    prepTags: { subjectId: 'bsc-karnataka-real-analysis', topicIds: ['ra-mod2-sequences'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-ra-mod2-02',
    questionText:
      'The Bolzano-Weierstrass theorem states that every bounded sequence of real numbers has:',
    options: ['A limit', 'A convergent subsequence', 'A monotone term', 'An upper bound equal to its supremum'],
    correctIndex: 1,
    explanation:
      'Every bounded sequence possesses at least one convergent subsequence, though the sequence itself may diverge, as with (-1)^n.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-real-analysis', topicIds: ['ra-mod2-sequences'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-ra-mod3-01',
    questionText: 'The function f(x) = |x| at x = 0 has which type of discontinuity in its derivative?',
    options: ['Removable', 'Jump', 'Infinite', 'The function itself is discontinuous'],
    correctIndex: 1,
    explanation:
      'f itself is continuous at 0, but the left derivative is -1 and the right derivative is +1. The derivative therefore has a jump discontinuity, so f is not differentiable at 0.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mangalore University', year: 2024, marks: 5, semester: 2 },
    prepTags: { subjectId: 'bsc-karnataka-real-analysis', topicIds: ['ra-mod3-limits-continuity'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-ra-mod3-02',
    questionText:
      'The Intermediate Value Theorem requires the function to be:',
    options: [
      'Differentiable on an open interval',
      'Continuous on a closed interval',
      'Bounded on an open interval',
      'Monotone on a closed interval',
    ],
    correctIndex: 1,
    explanation:
      'Continuity on the closed interval [a, b] is the essential hypothesis; differentiability is not required. The theorem then guarantees every intermediate value is attained.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-real-analysis', topicIds: ['ra-mod3-limits-continuity'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-ra-mod4-01',
    questionText: "For f(x) = x^3 on [0, 3], the value c guaranteed by Lagrange's mean value theorem is:",
    options: ['1', 'sqrt(3)', '3', 'sqrt(2)'],
    correctIndex: 1,
    explanation:
      "Chord slope = (27 - 0)/3 = 9. Setting f'(c) = 3c^2 = 9 gives c^2 = 3, so c = sqrt(3), which lies in (0, 3).",
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Karnatak University (KUD)', year: 2024, marks: 10, semester: 2 },
    prepTags: { subjectId: 'bsc-karnataka-real-analysis', topicIds: ['ra-mod4-differentiability'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-ra-mod4-02',
    questionText: "Rolle's theorem is a special case of Lagrange's mean value theorem in which:",
    options: [
      'The function is constant',
      'f(a) = f(b), so the chord slope is zero',
      'The derivative is continuous',
      'The interval is infinite',
    ],
    correctIndex: 1,
    explanation:
      "When f(a) = f(b) the chord slope is zero, and Lagrange's theorem reduces to the existence of a point where f'(c) = 0 — precisely Rolle's theorem.",
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-real-analysis', topicIds: ['ra-mod4-differentiability'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-ra-mod5-01',
    questionText:
      'The Dirichlet function on [0, 1] is not Riemann integrable because:',
    options: [
      'It is unbounded',
      'The upper and lower sums are 1 and 0 for every partition',
      'It is discontinuous at only one point',
      'Its integral diverges',
    ],
    correctIndex: 1,
    explanation:
      'Every subinterval contains both rational and irrational points, so sup f = 1 and inf f = 0 on every subinterval of every partition. Hence U = 1 and L = 0 for all partitions and no Riemann integral exists.',
    difficulty: 'advanced',
    status: 'approved',
    pyqTag: { university: 'Bengaluru City University (BCU)', year: 2023, marks: 10, semester: 2 },
    prepTags: { subjectId: 'bsc-karnataka-real-analysis', topicIds: ['ra-mod5-riemann-integration'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-ra-mod5-02',
    questionText: 'The average value of f(x) = 3x^2 on [0, 2] is:',
    options: ['4', '6', '8', '12'],
    correctIndex: 0,
    explanation:
      'Average = (1/2) x integral 0 to 2 of 3x^2 dx = (1/2) x [x^3] from 0 to 2 = (1/2) x 8 = 4.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-real-analysis', topicIds: ['ra-mod5-riemann-integration'], stream: 'mathematics', program: 'bsc' },
  },

  // ── Probability & Statistical Distributions ──
  {
    id: 'q-prob-mod1-01',
    questionText:
      'Two events A and B are mutually exclusive with positive probability. They are necessarily:',
    options: ['Independent', 'Dependent', 'Exhaustive', 'Equally likely'],
    correctIndex: 1,
    explanation:
      'If A occurs then B cannot, so P(B | A) = 0 which differs from P(B). Mutual exclusivity therefore implies dependence, the opposite of the common intuition.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 2 },
    prepTags: { subjectId: 'bsc-karnataka-probability', topicIds: ['prob-mod1-axioms'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-prob-mod1-02',
    questionText:
      'A disease affects 2% of a population. A test is 90% sensitive with a 5% false positive rate. The probability that a positive result indicates actual disease is approximately:',
    options: ['90%', '27%', '52%', '5%'],
    correctIndex: 1,
    explanation:
      'P(D|+) = (0.90 x 0.02) / [(0.90 x 0.02) + (0.05 x 0.98)] = 0.018 / (0.018 + 0.049) = 0.018 / 0.067 = 0.269, about 27%. The low base rate dominates.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-probability', topicIds: ['prob-mod1-axioms'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-prob-mod2-01',
    questionText: 'For a random variable X with E(X) = 5 and E(X^2) = 29, the variance is:',
    options: ['4', '24', '5.39', '29'],
    correctIndex: 0,
    explanation: 'Var(X) = E(X^2) - [E(X)]^2 = 29 - 25 = 4, so the standard deviation is 2.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 5, semester: 2 },
    prepTags: { subjectId: 'bsc-karnataka-probability', topicIds: ['prob-mod2-random-variables'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-prob-mod2-02',
    questionText: 'Var(aX + b) equals:',
    options: ['a^2 Var(X) + b', 'a^2 Var(X)', 'a Var(X) + b', 'Var(X) + b'],
    correctIndex: 1,
    explanation:
      'Adding a constant shifts the distribution without changing its spread, so b drops out; scaling by a multiplies the standard deviation by |a| and the variance by a^2.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-probability', topicIds: ['prob-mod2-random-variables'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-prob-mod3-01',
    questionText: 'For a binomial distribution with n = 20 and p = 0.3, the mean and variance are:',
    options: ['6 and 4.2', '6 and 6', '4.2 and 6', '14 and 4.2'],
    correctIndex: 0,
    explanation: 'Mean = np = 20 x 0.3 = 6. Variance = npq = 20 x 0.3 x 0.7 = 4.2.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mangalore University', year: 2024, marks: 5, semester: 2 },
    prepTags: { subjectId: 'bsc-karnataka-probability', topicIds: ['prob-mod3-discrete-dist'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-prob-mod3-02',
    questionText: 'For a Poisson distribution with mean 4, the variance is:',
    options: ['2', '4', '8', '16'],
    correctIndex: 1,
    explanation:
      'The defining property of the Poisson distribution is that its mean equals its variance, both equal to lambda. Observing mean approximately equal to variance in data suggests a Poisson fit.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-probability', topicIds: ['prob-mod3-discrete-dist'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-prob-mod4-01',
    questionText:
      'Marks are normally distributed with mean 70 and standard deviation 8. The proportion of students scoring between 62 and 78 is approximately:',
    options: ['68.27%', '95.45%', '99.73%', '50%'],
    correctIndex: 0,
    explanation:
      'The interval 62 to 78 is exactly one standard deviation either side of the mean, which by the empirical rule contains approximately 68.27% of observations.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Kuvempu University', year: 2023, marks: 5, semester: 2 },
    prepTags: { subjectId: 'bsc-karnataka-probability', topicIds: ['prob-mod4-continuous-dist'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-prob-mod4-02',
    questionText: 'The exponential distribution is characterised by which property?',
    options: ['Symmetry about the mean', 'Memorylessness', 'Finite support', 'Zero variance'],
    correctIndex: 1,
    explanation:
      'The memoryless property P(X > s + t | X > s) = P(X > t) means the elapsed waiting time does not affect the remaining wait, making it the natural model for lifetimes and inter-arrival times.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-probability', topicIds: ['prob-mod4-continuous-dist'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-prob-mod5-01',
    questionText:
      'A population has standard deviation 12. The standard error of the mean for samples of size 36 is:',
    options: ['12', '6', '2', '0.33'],
    correctIndex: 2,
    explanation: 'SE = sigma / sqrt(n) = 12 / 6 = 2.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Tumkur University', year: 2024, marks: 5, semester: 2 },
    prepTags: { subjectId: 'bsc-karnataka-probability', topicIds: ['prob-mod5-clt'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-prob-mod5-02',
    questionText: 'Two random variables are uncorrelated. This implies they are:',
    options: [
      'Necessarily independent',
      'Not necessarily independent',
      'Necessarily dependent',
      'Identically distributed',
    ],
    correctIndex: 1,
    explanation:
      'Zero correlation rules out only linear association. For example Y = X^2 with X symmetric about zero gives zero covariance yet perfect functional dependence. Independence is the stronger condition.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-probability', topicIds: ['prob-mod5-clt'], stream: 'statistics', program: 'bsc' },
  },

  // ── Linear Algebra ──
  {
    id: 'q-la-mod1-01',
    questionText: 'If det(A) = 3 for a 3x3 matrix A, then det(2A) is:',
    options: ['6', '12', '24', '3'],
    correctIndex: 2,
    explanation:
      'Multiplying every element of an n x n matrix by k multiplies the determinant by k^n. Here k = 2 and n = 3, so det(2A) = 8 x 3 = 24.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 2, semester: 3 },
    prepTags: { subjectId: 'bsc-karnataka-linear-algebra', topicIds: ['la-mod1-determinants'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-la-mod1-02',
    questionText: 'A square matrix A is singular if and only if:',
    options: ['det(A) = 1', 'det(A) = 0', 'A is symmetric', 'A has distinct eigenvalues'],
    correctIndex: 1,
    explanation:
      'A zero determinant means no inverse exists, so the matrix is singular and the homogeneous system AX = 0 has non-trivial solutions.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-linear-algebra', topicIds: ['la-mod1-determinants'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-la-mod2-01',
    questionText:
      'A system of 4 equations in 4 unknowns has rank(A) = 3 and rank([A|B]) = 3. The system has:',
    options: ['A unique solution', 'No solution', 'Infinitely many solutions', 'Exactly two solutions'],
    correctIndex: 2,
    explanation:
      'The ranks are equal, so the system is consistent, but the rank (3) is less than the number of unknowns (4), leaving one free parameter and hence infinitely many solutions.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mysore University (UOM)', year: 2024, marks: 10, semester: 3 },
    prepTags: { subjectId: 'bsc-karnataka-linear-algebra', topicIds: ['la-mod2-linear-systems'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-la-mod2-02',
    questionText: 'A homogeneous system AX = 0 always has:',
    options: ['Only the trivial solution', 'At least the trivial solution', 'No solution', 'Infinitely many solutions'],
    correctIndex: 1,
    explanation:
      'X = 0 always satisfies AX = 0, so the system is always consistent. Non-trivial solutions exist additionally only when rank(A) is less than the number of unknowns.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-linear-algebra', topicIds: ['la-mod2-linear-systems'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-la-mod3-01',
    questionText: 'The rank-nullity theorem states that rank(T) + nullity(T) equals:',
    options: ['The rank of the matrix', 'dim(V)', 'dim(W)', 'Zero'],
    correctIndex: 1,
    explanation:
      'For a linear transformation T: V → W, the dimension of the domain equals the sum of the dimensions of the image and the kernel.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mangalore University', year: 2023, marks: 5, semester: 3 },
    prepTags: { subjectId: 'bsc-karnataka-linear-algebra', topicIds: ['la-mod3-vector-spaces'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-la-mod3-02',
    questionText: 'Which of the following is NOT a subspace of R^2?',
    options: ['The set containing only the zero vector', 'Any line through the origin', 'The first quadrant including the axes', 'R^2 itself'],
    correctIndex: 2,
    explanation:
      'The first quadrant is not closed under scalar multiplication: multiplying a vector in it by -1 leaves the quadrant. Every other option satisfies both closure conditions.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-linear-algebra', topicIds: ['la-mod3-vector-spaces'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-la-mod4-01',
    questionText: 'A linear transformation T is injective (one-to-one) if and only if:',
    options: [
      'Its range equals the codomain',
      'Its kernel contains only the zero vector',
      'It is represented by a square matrix',
      'Its determinant is positive',
    ],
    correctIndex: 1,
    explanation:
      'A trivial kernel guarantees injectivity: if T(u) = T(v) then T(u - v) = 0 so u = v. Surjectivity, by contrast, requires the range to equal the codomain.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Karnatak University (KUD)', year: 2024, marks: 5, semester: 3 },
    prepTags: { subjectId: 'bsc-karnataka-linear-algebra', topicIds: ['la-mod4-linear-transformations'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-la-mod4-02',
    questionText: 'Similar matrices necessarily share the same:',
    options: ['Eigenvectors', 'Eigenvalues', 'Rows', 'Entries'],
    correctIndex: 1,
    explanation:
      'If B = P^-1 A P then det(B - lambda I) = det(A - lambda I), so the characteristic polynomials and hence the eigenvalues, trace and determinant coincide. Eigenvectors generally differ.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-linear-algebra', topicIds: ['la-mod4-linear-transformations'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-la-mod5-01',
    questionText: 'The eigenvalues of the matrix [[3, 0], [0, 5]] are:',
    options: ['0 and 8', '3 and 5', '8 and 15', '1 and 15'],
    correctIndex: 1,
    explanation:
      'For a diagonal matrix the eigenvalues are the diagonal entries. Verification: trace = 8 = 3 + 5 and determinant = 15 = 3 x 5.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bengaluru City University (BCU)', year: 2024, marks: 5, semester: 3 },
    prepTags: { subjectId: 'bsc-karnataka-linear-algebra', topicIds: ['la-mod5-eigenvalues'], stream: 'mathematics', program: 'bsc' },
  },
  {
    id: 'q-la-mod5-02',
    questionText: 'An n x n matrix is diagonalisable if and only if it has:',
    options: [
      'n distinct eigenvalues',
      'n linearly independent eigenvectors',
      'A non-zero determinant',
      'Real eigenvalues only',
    ],
    correctIndex: 1,
    explanation:
      'The modal matrix must be invertible, which requires n linearly independent eigenvectors. Distinct eigenvalues guarantee this but are not necessary — repeated eigenvalues suffice when the geometric multiplicity equals the algebraic multiplicity.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-linear-algebra', topicIds: ['la-mod5-eigenvalues'], stream: 'mathematics', program: 'bsc' },
  },

  // ── Numerical Methods ──
  {
    id: 'q-nm-mod1-01',
    questionText: 'The relative error when the true value is 20 and the approximate value is 19.5 is:',
    options: ['0.5', '0.025', '2.5%', '0.25'],
    correctIndex: 1,
    explanation:
      'Absolute error = 0.5. Relative error = 0.5 / 20 = 0.025, which is a percentage error of 2.5%.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 5, semester: 3 },
    prepTags: { subjectId: 'bsc-karnataka-numerical-methods', topicIds: ['nm-mod1-errors'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-nm-mod1-02',
    questionText:
      'Catastrophic cancellation occurs when:',
    options: [
      'A number is divided by zero',
      'Two nearly equal numbers are subtracted',
      'A series is truncated early',
      'The step size is too large',
    ],
    correctIndex: 1,
    explanation:
      'Subtracting nearly equal quantities cancels the leading significant digits, leaving a result dominated by rounding error. The remedy is algebraic reformulation rather than higher precision.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-numerical-methods', topicIds: ['nm-mod1-errors'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-nm-mod2-01',
    questionText: "One Newton-Raphson iteration for f(x) = x^2 - 3 starting from x0 = 2 gives:",
    options: ['1.75', '1.5', '1.8', '1.7'],
    correctIndex: 0,
    explanation:
      "f(2) = 1 and f'(2) = 4, so x1 = 2 - 1/4 = 1.75. Newton's method converges quadratically, so one more iteration gives 1.7321, correct to four decimal places.",
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 10, semester: 3 },
    prepTags: { subjectId: 'bsc-karnataka-numerical-methods', topicIds: ['nm-mod2-root-finding'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-nm-mod2-02',
    questionText: 'The rate of convergence of the bisection method is:',
    options: ['Linear', 'Quadratic', 'Cubic', 'Superlinear'],
    correctIndex: 0,
    explanation:
      'Bisection halves the interval each iteration, so the error reduces by a constant factor of one half — linear convergence. It is guaranteed to converge but slower than Newton-Raphson.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-numerical-methods', topicIds: ['nm-mod2-root-finding'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-nm-mod3-01',
    questionText:
      "Newton's forward difference interpolation formula is preferred when the interpolating point lies:",
    options: ['Near the end of the table', 'Near the beginning of the table', 'At the centre', 'Anywhere equally'],
    correctIndex: 1,
    explanation:
      'The forward formula uses differences taken from the first entry, so it is most accurate when x is near the start. The backward formula should be used near the end of the table.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mangalore University', year: 2024, marks: 5, semester: 3 },
    prepTags: { subjectId: 'bsc-karnataka-numerical-methods', topicIds: ['nm-mod3-interpolation'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-nm-mod3-02',
    questionText: "Lagrange's interpolation formula is used when:",
    options: [
      'The intervals are equal',
      'The intervals are unequal',
      'The data are equally spaced and central differences are needed',
      'Only two data points exist',
    ],
    correctIndex: 1,
    explanation:
      "Lagrange's formula involves no difference operators and is therefore valid for arbitrarily spaced data, unlike Newton's forward and backward formulae which require equal intervals.",
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-numerical-methods', topicIds: ['nm-mod3-interpolation'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-nm-mod4-01',
    questionText: "Simpson's one-third rule requires the number of subintervals to be:",
    options: ['Odd', 'Even', 'A multiple of three', 'Any integer'],
    correctIndex: 1,
    explanation:
      'The rule fits a parabola across each PAIR of subintervals, so the total number of subintervals must be even. For a multiple of three subintervals the three-eighth rule is used.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Tumkur University', year: 2024, marks: 5, semester: 3 },
    prepTags: { subjectId: 'bsc-karnataka-numerical-methods', topicIds: ['nm-mod4-numerical-integration'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-nm-mod4-02',
    questionText: 'The error in the trapezoidal rule is of order:',
    options: ['O(h)', 'O(h^2)', 'O(h^3)', 'O(h^4)'],
    correctIndex: 1,
    explanation:
      'The trapezoidal rule has error O(h^2), so halving the step size reduces the error by a factor of four. Simpson\u2019s one-third rule achieves the better O(h^4).',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-numerical-methods', topicIds: ['nm-mod4-numerical-integration'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-nm-mod5-01',
    questionText: "The global error of Euler's method for solving ordinary differential equations is:",
    options: ['O(h)', 'O(h^2)', 'O(h^3)', 'O(h^4)'],
    correctIndex: 0,
    explanation:
      "The local truncation error is O(h^2) but errors accumulate over 1/h steps, giving a global error of O(h). Runge-Kutta fourth order achieves O(h^4).",
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Kuvempu University', year: 2024, marks: 5, semester: 3 },
    prepTags: { subjectId: 'bsc-karnataka-numerical-methods', topicIds: ['nm-mod5-ode-numerical'], stream: 'computing', program: 'bsc' },
  },
  {
    id: 'q-nm-mod5-02',
    questionText: 'In the classical fourth order Runge-Kutta method, the weights applied to k1, k2, k3, k4 are:',
    options: ['1, 1, 1, 1', '1, 2, 2, 1', '1, 4, 1, 0', '2, 1, 1, 2'],
    correctIndex: 1,
    explanation:
      'The update is y_(n+1) = y_n + (k1 + 2k2 + 2k3 + k4)/6. The doubled weights on the two midpoint slopes are what deliver fourth-order accuracy.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-numerical-methods', topicIds: ['nm-mod5-ode-numerical'], stream: 'computing', program: 'bsc' },
  },

  // ── Classical & Quantum Mechanics ──
  {
    id: 'q-mech-mod1-01',
    questionText: 'In an inelastic collision, which quantity is always conserved?',
    options: ['Kinetic energy', 'Linear momentum', 'Both', 'Neither'],
    correctIndex: 1,
    explanation:
      'Momentum is conserved in all collisions provided no external force acts. Kinetic energy is conserved only in elastic collisions; in inelastic collisions part of it is converted to heat or deformation.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2023, marks: 2, semester: 4 },
    prepTags: { subjectId: 'bsc-karnataka-mechanics', topicIds: ['mech-mod1-newtonian'], stream: 'science', program: 'bsc' },
  },
  {
    id: 'q-mech-mod1-02',
    questionText: 'The period of a simple pendulum of length 4l compared with one of length l is:',
    options: ['Twice as long', 'Four times as long', 'The same', 'Half as long'],
    correctIndex: 0,
    explanation:
      'Since T = 2 pi sqrt(l/g) is proportional to the square root of length, quadrupling the length doubles the period.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-mechanics', topicIds: ['mech-mod1-newtonian'], stream: 'science', program: 'bsc' },
  },
  {
    id: 'q-mech-mod2-01',
    questionText: 'The Lagrangian of a system is defined as:',
    options: ['T + V', 'T - V', 'T x V', 'V - T'],
    correctIndex: 1,
    explanation:
      'L = T - V, the difference between kinetic and potential energy. Substituting it into the Euler-Lagrange equation yields the equations of motion.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Mysore University (UOM)', year: 2024, marks: 5, semester: 4 },
    prepTags: { subjectId: 'bsc-karnataka-mechanics', topicIds: ['mech-mod2-lagrangian'], stream: 'science', program: 'bsc' },
  },
  {
    id: 'q-mech-mod2-02',
    questionText: "Hamilton's canonical equations are:",
    options: [
      'q_dot = dH/dp and p_dot = -dH/dq',
      'q_dot = -dH/dp and p_dot = dH/dq',
      'q_dot = dH/dq and p_dot = dH/dp',
      'q_dot = dL/dp and p_dot = dL/dq',
    ],
    correctIndex: 0,
    explanation:
      'The canonical equations are q_dot = dH/dp_i and p_dot = -dH/dq_i. Note the minus sign on the momentum equation, which is essential to the symplectic structure of phase space.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-mechanics', topicIds: ['mech-mod2-lagrangian'], stream: 'science', program: 'bsc' },
  },
  {
    id: 'q-mech-mod3-01',
    questionText:
      'In the photoelectric effect, increasing the intensity of incident light (above the threshold frequency) increases:',
    options: [
      'The maximum kinetic energy of the emitted electrons',
      'The number of electrons emitted',
      'The work function of the metal',
      'The threshold frequency',
    ],
    correctIndex: 1,
    explanation:
      'Intensity determines the number of incident photons and hence the number of emitted electrons. Maximum kinetic energy depends only on frequency, as K_max = h nu - phi.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mangalore University', year: 2023, marks: 5, semester: 4 },
    prepTags: { subjectId: 'bsc-karnataka-mechanics', topicIds: ['mech-mod3-wave-particle'], stream: 'science', program: 'bsc' },
  },
  {
    id: 'q-mech-mod3-02',
    questionText:
      'The de Broglie wavelength of a particle is inversely proportional to its:',
    options: ['Mass only', 'Velocity only', 'Momentum', 'Charge'],
    correctIndex: 2,
    explanation:
      'lambda = h / p, so the wavelength is inversely proportional to momentum, which combines both mass and velocity.',
    difficulty: 'basic',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-mechanics', topicIds: ['mech-mod3-wave-particle'], stream: 'science', program: 'bsc' },
  },
  {
    id: 'q-mech-mod4-01',
    questionText: 'For a particle in a one-dimensional box of width L, the ground state energy is proportional to:',
    options: ['L', 'L^2', '1/L', '1/L^2'],
    correctIndex: 3,
    explanation:
      'E_n = n^2 h^2 / (8 m L^2), so the energy varies inversely with the square of the box width. Halving the width quadruples every energy level.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Karnatak University (KUD)', year: 2024, marks: 10, semester: 4 },
    prepTags: { subjectId: 'bsc-karnataka-mechanics', topicIds: ['mech-mod4-schrodinger'], stream: 'science', program: 'bsc' },
  },
  {
    id: 'q-mech-mod4-02',
    questionText: 'The zero point energy of a particle in a box exists because:',
    options: [
      'The box has finite mass',
      'A zero energy state would violate the uncertainty principle',
      'The temperature is non-zero',
      'The wave function is not normalised',
    ],
    correctIndex: 1,
    explanation:
      'Zero energy would imply a stationary particle at a definite position, giving delta x = 0 and delta p = 0 simultaneously, which violates the uncertainty principle. Confinement therefore forces a minimum energy.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-mechanics', topicIds: ['mech-mod4-schrodinger'], stream: 'science', program: 'bsc' },
  },
  {
    id: 'q-mech-mod5-01',
    questionText: 'The Heisenberg uncertainty principle arises fundamentally from:',
    options: [
      'Imperfect measuring instruments',
      'The wave nature of particles',
      'Thermal fluctuations',
      'Relativistic effects',
    ],
    correctIndex: 1,
    explanation:
      'Position and momentum are Fourier conjugates: localising a wave packet requires superposing many momenta. The limitation is intrinsic to wave-like systems, not a defect of measurement.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Bengaluru City University (BCU)', year: 2024, marks: 5, semester: 4 },
    prepTags: { subjectId: 'bsc-karnataka-mechanics', topicIds: ['mech-mod5-uncertainty'], stream: 'science', program: 'bsc' },
  },
  {
    id: 'q-mech-mod5-02',
    questionText: 'The probability of quantum tunnelling through a barrier decreases:',
    options: [
      'Linearly with barrier width',
      'Exponentially with barrier width',
      'Quadratically with barrier height',
      'Not at all with barrier width',
    ],
    correctIndex: 1,
    explanation:
      'The transmission coefficient is approximately e^(-2ka), so it falls exponentially with barrier width a and with the square root of the barrier excess (V0 - E). This is why tunnelling matters only over atomic distances.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-mechanics', topicIds: ['mech-mod5-uncertainty'], stream: 'science', program: 'bsc' },
  },

  // ── Applied Statistics & Statistical Inference ──
  {
    id: 'q-stat-mod1-01',
    questionText: 'The unbiased estimator of the population variance divides the sum of squared deviations by:',
    options: ['n', 'n - 1', 'n + 1', '2n'],
    correctIndex: 1,
    explanation:
      'Dividing by n - 1 (the degrees of freedom) corrects the downward bias that arises because the sample mean, estimated from the same data, is closer to the observations than the population mean.',
    difficulty: 'basic',
    status: 'approved',
    pyqTag: { university: 'Bangalore University (BU)', year: 2024, marks: 2, semester: 4 },
    prepTags: { subjectId: 'bsc-karnataka-applied-stats', topicIds: ['stat-mod1-sampling-dist'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-stat-mod1-02',
    questionText:
      'A 95% confidence interval for the mean is computed as 48 to 52. The correct interpretation is:',
    options: [
      'There is a 95% probability that the sample mean lies in this interval',
      'In repeated sampling, 95% of such intervals would contain the population mean',
      'The population mean is 50',
      '95% of the observations lie in this interval',
    ],
    correctIndex: 1,
    explanation:
      'The confidence level refers to the long-run performance of the method across repeated samples, not to the probability that this particular interval contains the parameter — which is either certain or impossible.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-applied-stats', topicIds: ['stat-mod1-sampling-dist'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-stat-mod2-01',
    questionText:
      'A test statistic of t = -2.8 with 10 degrees of freedom against a two-tailed critical value of 2.228 leads to:',
    options: [
      'Accepting the null hypothesis',
      'Rejecting the null hypothesis',
      'An inconclusive result',
      'A Type II error',
    ],
    correctIndex: 1,
    explanation:
      'Since |t| = 2.8 exceeds the critical value 2.228, the null hypothesis is rejected at the chosen significance level. Only the magnitude of t matters in a two-tailed test.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mysore University (UOM)', year: 2023, marks: 10, semester: 4 },
    prepTags: { subjectId: 'bsc-karnataka-applied-stats', topicIds: ['stat-mod2-hypothesis-testing'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-stat-mod2-02',
    questionText:
      'In a 3 x 4 contingency table, the degrees of freedom for the chi-square test of independence are:',
    options: ['12', '6', '11', '7'],
    correctIndex: 1,
    explanation: 'Degrees of freedom = (r - 1)(c - 1) = (3 - 1)(4 - 1) = 2 x 3 = 6.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-applied-stats', topicIds: ['stat-mod2-hypothesis-testing'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-stat-mod3-01',
    questionText: 'If the coefficient of correlation r = 0.6, the coefficient of determination is:',
    options: ['0.6', '0.36', '0.775', '1.2'],
    correctIndex: 1,
    explanation:
      'The coefficient of determination is r^2 = 0.36, meaning 36% of the variation in the dependent variable is explained by the independent variable.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Mangalore University', year: 2024, marks: 5, semester: 4 },
    prepTags: { subjectId: 'bsc-karnataka-applied-stats', topicIds: ['stat-mod3-correlation-regression'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-stat-mod3-02',
    questionText:
      'The two regression lines of y on x and x on y coincide when:',
    options: ['r = 0', 'r = +/- 1', 'The means are equal', 'The variances are equal'],
    correctIndex: 1,
    explanation:
      'Perfect correlation means every point lies exactly on a straight line, so minimising vertical and horizontal residuals gives the same line. As r decreases the two lines diverge.',
    difficulty: 'advanced',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-applied-stats', topicIds: ['stat-mod3-correlation-regression'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-stat-mod4-01',
    questionText:
      'Which design principle involves grouping experimental units into homogeneous groups to control a known source of variation?',
    options: ['Replication', 'Randomisation', 'Local control', 'Blocking by chance'],
    correctIndex: 2,
    explanation:
      'Local control groups similar units into blocks so that block-to-block variation is removed from the experimental error, increasing the sensitivity of the test. Replication estimates error; randomisation removes bias.',
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Kuvempu University', year: 2023, marks: 5, semester: 4 },
    prepTags: { subjectId: 'bsc-karnataka-applied-stats', topicIds: ['stat-mod4-doe-anova'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-stat-mod4-02',
    questionText:
      'In a randomised block design with 5 treatments and 4 blocks, the error degrees of freedom are:',
    options: ['12', '19', '4', '20'],
    correctIndex: 0,
    explanation:
      'Error df = (k - 1)(b - 1) = (5 - 1)(4 - 1) = 4 x 3 = 12. Total df = kb - 1 = 19, and treatment df = 4, block df = 3.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-applied-stats', topicIds: ['stat-mod4-doe-anova'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-stat-mod5-01',
    questionText: "Which index number satisfies both the time reversal and factor reversal tests?",
    options: ['Laspeyres', 'Paasche', "Fisher's ideal", 'Marshall-Edgeworth'],
    correctIndex: 2,
    explanation:
      "Fisher's ideal index, being the geometric mean of the Laspeyres and Paasche indices, is the only common index satisfying both tests, which is the basis of its designation as ideal.",
    difficulty: 'core',
    status: 'approved',
    pyqTag: { university: 'Tumkur University', year: 2024, marks: 5, semester: 4 },
    prepTags: { subjectId: 'bsc-karnataka-applied-stats', topicIds: ['stat-mod5-index-time-series'], stream: 'statistics', program: 'bsc' },
  },
  {
    id: 'q-stat-mod5-02',
    questionText: 'Control limits on an X-bar chart are conventionally set at:',
    options: ['+/- 1 sigma', '+/- 2 sigma', '+/- 3 sigma', '+/- 4 sigma'],
    correctIndex: 2,
    explanation:
      'Three-sigma limits balance the risk of false alarms against the need to detect genuine shifts. Control limits are derived from process data and must not be confused with design specification limits.',
    difficulty: 'core',
    status: 'approved',
    prepTags: { subjectId: 'bsc-karnataka-applied-stats', topicIds: ['stat-mod5-index-time-series'], stream: 'statistics', program: 'bsc' },
  },
]
