// functions/src/data/prepPapers/bscPapers.ts
//
// BSC previous-year question papers (compact PrepPaperSeed records).
// See ./index.ts for conventions.

import type { PrepPaperSeed } from '../../prepPapers'

export const BSC_PAPERS: PrepPaperSeed[] = [
  // ── St Agnes College (Autonomous), Mangaluru · I Semester B.Sc. · Nov/Dec 2023 ─
  {
    id: 'stagnes-mu-bsc-1-mathematics-number-theory-algebra-calculus-2023-11',
    program: 'bsc',
    university: 'stagnes-mu',
    scheme: 'CBCS semester scheme (NEP 2021 batch), autonomous end-semester examination',
    semester: 1,
    subject: 'Mathematics: Number Theory I, Algebra I and Calculus I',
    subjectArea: 'Mathematics',
    paperCode: '21MATC101',
    examMonth: 'November/December',
    examYear: 2023,
    durationMinutes: 120,
    maxMarks: 60,
    instructions: ['Answer the required number of questions from each Part; every question carries the marks shown against its Part.'],
    sections: [
      {
        id: 'A', title: 'Part A', instruction: 'Answer any 6 questions. Each question carries 2 marks.', answer: 6, marksEach: 2, subLabels: true,
        questions: [
          'Show that the square of any odd integer is of the form 8k + 1.',
          "State and prove Euclid's lemma.",
          'Define a skew-symmetric matrix. Give an example.',
          'Find the rank of the matrix A = [[1, 2, 3, 4], [2, 4, 6, 8], [3, 6, 9, 12]] by using elementary transformations.',
          'Find the cartesian co-ordinates of the point whose polar co-ordinates are (2, π/3).',
          'Find the radius of curvature at any point of the curves (i) s = c tan ψ (ii) s = 4a sin(ψ/3).',
          "Find 'c' of Rolle's theorem for f(x) = x² + 1 in [−1, 1].",
          "Find 'c' of Lagrange's mean value theorem for f(x) = log x in [1, e].",
        ],
      },
      {
        id: 'B', title: 'Part B', instruction: 'Answer any 2 questions. Each question carries 6 marks.', answer: 2, marksEach: 6, subLabels: true,
        questions: [
          'Use the Euclidean algorithm to obtain integers x and y satisfying gcd(24, 138) = 24x + 138y.',
          'If ca ≡ cb (mod n) then prove that a ≡ b (mod n/d), where d = gcd(c, n).',
          'Solve the linear congruence 18x ≡ 30 (mod 42).',
          'Solve the system of congruences x ≡ 2 (mod 3), x ≡ 3 (mod 5), x ≡ 2 (mod 7) using the Chinese remainder theorem.',
        ],
      },
      {
        id: 'C', title: 'Part C', instruction: 'Answer any 2 questions. Each question carries 6 marks.', answer: 2, marksEach: 6, subLabels: true,
        questions: [
          'Find the inverse of the matrix A = [[1, 2, 1], [2, −1, 1], [0, 1, 2]] using elementary transformations.',
          'Show that the equations x₁ − x₂ + x₃ = 2, 3x₁ − x₂ + 2x₃ = −6, 3x₁ + x₂ + x₃ = −18 are consistent and find the solution.',
          'By using elementary row operations, find the solution or solutions, if they exist, for the system: x + y + 3z = 0, x − y + z = 0, x − 2y = 0, x − y + z = 0.',
          'Using the characteristic equation −x³ + 5x² − 8x + 4 = 0 of A = [[1, 0, −2], [2, 2, 4], [0, 0, 2]], find A⁻¹.',
        ],
      },
      {
        id: 'D', title: 'Part D', instruction: 'Answer any 2 questions. Each question carries 6 marks.', answer: 2, marksEach: 6, subLabels: true,
        questions: [
          'Find the angle of intersection of the cardioids r = a(1 + cos θ) and r = b(1 − cos θ).',
          'Show that the curvature at the point (3a/2, 3a/2) on the Folium x³ + y³ = 3axy is −8√2 / (3a).',
          'Find the radius of curvature at any point on the curve x = (a cos t)/t, y = (a sin t)/t.',
          'Trace the curve r = a(1 − cos θ).',
        ],
      },
      {
        id: 'E', title: 'Part E', instruction: 'Answer any 2 questions. Each question carries 6 marks.', answer: 2, marksEach: 6, subLabels: true,
        questions: [
          "Prove that if a function f is continuous in [a, b] and derivable in (a, b), then there exists at least one value c in (a, b) such that f'(c) = (f(b) − f(a)) / (b − a).",
          'Determine the limit of 1/x − 1/(eˣ − 1) as x → 0.',
          'Determine the limit of (x − 2)^(x − 2) as x → 2.',
          'Show that for all x ∈ R, eˣ = 1 + x + x²/2! + x³/3! + … + xⁿ/n! + …',
        ],
      },
    ],
    prepSubjectId: 'bsc-karnataka-calculus',
    source: { title: 'B.Sc I Semester — all papers, November/December 2023 (NEP)', url: 'https://library.stagnescollege.edu.in/wp-content/uploads/2024/02/bsc-I-sem-all-paper-nov-dec-2023.pdf', publisher: 'St Agnes College (Autonomous) Library, Mangaluru', retrievedOn: '2026-09-25', note: 'Autonomous-college end-semester paper; degree awarded by Mangalore University.' },
  },
  {
    id: 'stagnes-mu-bsc-1-statistics-descriptive-statistics-2023-11',
    program: 'bsc',
    university: 'stagnes-mu',
    scheme: 'CBCS semester scheme (NEP 2021 batch), autonomous end-semester examination',
    semester: 1,
    subject: 'Statistics: Descriptive Statistics',
    subjectArea: 'Statistics',
    paperCode: '21STAC101',
    examMonth: 'November/December',
    examYear: 2023,
    durationMinutes: 120,
    maxMarks: 60,
    sections: [
      {
        id: 'A', instruction: 'Answer any THREE of the following. Each question carries 2 marks.', answer: 3, marksEach: 2,
        questions: [
          'List any two methods of collecting primary data.',
          'Write any two limitations of Statistics.',
          'List all the measures of central tendency.',
          'Distinguish between correlation and regression.',
          'Define equally likely events. Give one example.',
        ],
      },
      {
        id: 'B', instruction: 'Answer any FOUR of the following in not more than a page each. Each question carries 6 marks.', answer: 4, marksEach: 6,
        questions: [
          'Describe the construction of a frequency polygon and ogives. How is the median located from ogives?',
          'Find the mean and variance of the first n natural numbers.',
          'Show that SD is not less than MD from their mean.',
          "Derive an expression for Spearman's rank correlation coefficient when there are no ties.",
          'In case of bivariate data, how do you fit a curve of the type Y = ax²?',
          'Define mathematical expectation. State and prove the addition theorem of expectation.',
        ],
      },
      {
        id: 'C', instruction: 'Answer any THREE of the following in not more than two pages each. Each question carries 10 marks.', answer: 3, marksEach: 10,
        questions: [
          'Obtain an expression for the combined geometric mean.',
          'If X and Y are two independent variables with mean 0 and variance 1, find the value of l so that the correlation coefficient between X − lY and X + Y is maximum.',
          'Derive the regression equation of Y on X.',
          { text: 'Probability:', parts: ['(a) State and prove Bayes theorem of probability. (6)', '(b) Give the classical definition of probability. What are its limitations? (4)'] },
          { text: 'Probability theorems:', parts: ['(a) State and prove the addition theorem of probability for any 2 events. (5)', '(b) Prove that conditional probability satisfies the axioms of probability. (5)'] },
        ],
      },
    ],
    prepSubjectId: 'bsc-karnataka-probability',
    source: { title: 'B.Sc I Semester — all papers, November/December 2023 (NEP)', url: 'https://library.stagnescollege.edu.in/wp-content/uploads/2024/02/bsc-I-sem-all-paper-nov-dec-2023.pdf', publisher: 'St Agnes College (Autonomous) Library, Mangaluru', retrievedOn: '2026-09-25', note: 'Autonomous-college end-semester paper; degree awarded by Mangalore University.' },
  },
  // ── St Agnes College (Autonomous), Mangaluru · II Semester B.Sc. · May 2024 ─
  {
    id: 'stagnes-mu-bsc-2-mathematics-number-theory-algebra-calculus-ii-2024-05',
    program: 'bsc',
    university: 'stagnes-mu',
    scheme: 'CBCS semester scheme (NEP 2021 batch), autonomous end-semester examination',
    semester: 2,
    subject: 'Mathematics: Number Theory, Algebra, Calculus II',
    subjectArea: 'Mathematics',
    paperCode: '21MATC201',
    examMonth: 'May',
    examYear: 2024,
    durationMinutes: 120,
    maxMarks: 60,
    sections: [
      {
        id: 'A', title: 'Part A', instruction: 'Answer any 6 questions. Each question carries 2 marks.', answer: 6, marksEach: 2, subLabels: true,
        questions: [
          'Find the sum of positive integers less than 190 and relatively prime to 190.',
          'Find the value of φ(100).',
          'Let G = Z. Define * by a * b = a + b − ab. Check whether * is commutative and associative.',
          'Prove that if G is a group such that a² = e for all a ∈ G, then G is abelian.',
          'Find the domain of definition of the function: (i) z = f(x, y) = 1 / (√(x² + y²) − 16) (ii) z = f(x, y) = log(x + y).',
          'Find f_y(x, y) if f(x, y) = e^(ax) sin by.',
          'Evaluate ∫ from π/2 to π ∫ from 0 to x sin(4x − y) dy dx.',
          'Evaluate the line integral ∫_C F · dR, where F(x, y) = y i + x j, R(t) = t i + t² j, 0 ≤ t ≤ 1.',
        ],
      },
      {
        id: 'B', title: 'Part B', instruction: 'Answer any 2 questions. Each question carries 6 marks.', answer: 2, marksEach: 6, subLabels: true,
        questions: [
          "State and prove Wilson's theorem.",
          "Is the converse of Fermat's theorem true? Justify your answer.",
          'Find the last two digits in the decimal representation of 3²⁵⁶.',
          'Represent 71/55 as a simple continued fraction.',
        ],
      },
      {
        id: 'C', title: 'Part C', instruction: 'Answer any 2 questions. Each question carries 6 marks.', answer: 2, marksEach: 6, subLabels: true,
        questions: [
          'Show that for any subset A of G, the normalizer N(A) of A is a subgroup of G.',
          'Prove that G is an abelian group if and only if (a · b)² = a² · b² for all a, b ∈ G.',
          'Let H and K be any two subgroups of a group G. Prove that HK is a subgroup of G if and only if KH = HK.',
          'Prove that any subgroup of a cyclic group is cyclic.',
        ],
      },
      {
        id: 'D', title: 'Part D', instruction: 'Answer any 2 questions. Each question carries 6 marks.', answer: 2, marksEach: 6, subLabels: true,
        questions: [
          'If u = eˣ(x cos y − y sin y), show that ∂²u/∂x² + ∂²u/∂y² = 0.',
          "If u = sin⁻¹((x² + y²)/(x + y)), then show by Euler's theorem that x ∂u/∂x + y ∂u/∂y = tan u.",
          'Find dw/dt as a function of t, both by using the chain rule and by expressing w in terms of t and differentiating directly with respect to t. Also find dw/dt at the given point: w = x/z + y/z, x = cos² t, y = sin² t, z = 1/t, t = 3.',
          'Determine the relative extrema of f(x, y) = x² − 4xy + y³ + 4y, if there are any.',
        ],
      },
      {
        id: 'E', title: 'Part E', instruction: 'Answer any 2 questions. Each question carries 6 marks.', answer: 2, marksEach: 6, subLabels: true,
        questions: [
          'Find the volume of the solid in the first octant bounded by the cone z = r and the cylinder r = 3 sin θ.',
          'Find the surface area of the top half of the sphere x² + y² + z² = a².',
          'Find the volume of the solid in the first octant bounded below by the xy-plane, above by the plane z = y and laterally by the cylinder y² = x and the plane x = 1.',
          'Evaluate ∫_C (x² + xy) dx + (y² − xy) dy where C is the line y = x from the origin to the point (2, 2).',
        ],
      },
    ],
    prepSubjectId: 'bsc-karnataka-linear-algebra',
    source: { title: 'B.Sc II Semester — all papers, May 2024 (NEP)', url: 'https://library.stagnescollege.edu.in/wp-content/uploads/2024/08/agnes-bsc-II-semester-all-paper-may-2024-nep.pdf', publisher: 'St Agnes College (Autonomous) Library, Mangaluru', retrievedOn: '2026-09-25', note: 'Autonomous-college end-semester paper; degree awarded by Mangalore University.' },
  },
  {
    id: 'stagnes-mu-bsc-2-statistics-probability-and-distributions-1-2024-05',
    program: 'bsc',
    university: 'stagnes-mu',
    scheme: 'CBCS semester scheme (NEP 2021 batch), autonomous end-semester examination',
    semester: 2,
    subject: 'Statistics: Probability and Distributions I',
    subjectArea: 'Statistics',
    examMonth: 'May',
    examYear: 2024,
    durationMinutes: 120,
    maxMarks: 60,
    sections: [
      {
        id: 'A', instruction: 'Answer any THREE of the following. Each question carries 2 marks.', answer: 3, marksEach: 2,
        questions: [
          'Define Bernoulli distribution and give an example for it.',
          'If X has Uniform distribution over the range (0, 1), find the mean and the variance.',
          'What is the difference between positive and negative frequencies?',
          'Explain ultimate classes.',
          'Write the function for the p.m.f. of Poisson distribution in R.',
        ],
      },
      {
        id: 'B', instruction: 'Answer any FOUR of the following in not more than a page each. Each question carries 6 marks.', answer: 4, marksEach: 6,
        questions: [
          'Find the mode of Poisson distribution.',
          'Define Binomial distribution. Find the variance assuming the mean.',
          'Obtain the mean and variance of Negative Binomial distribution.',
          'Obtain an expression for Mean Deviation from Mean for a Normal variate.',
          'Derive an expression for r₁₂.₃.',
          'Write a programme to obtain the mode from the following data:\nSize: 0-10, 10-20, 20-30, 30-40, 40-50, 50-60, 60-70\nFrequency: 5, 7, 12, 18, 14, 10, 5',
        ],
      },
      {
        id: 'C', instruction: 'Answer any THREE of the following in not more than two pages each. Each question carries 10 marks.', answer: 3, marksEach: 10,
        questions: [
          'Obtain the mean and variance of Hypergeometric distribution.',
          'Derive the mean and variance of Beta distribution of the first kind.',
          'Define Gamma distribution with parameter n and obtain the first four central moments of this distribution; comment on the skewness and kurtosis.',
          'Define multiple correlation coefficient and obtain the expression for R₁.₂₃.',
          'If the three regression planes coincide and are given by ax + by + cz = 0 for all a, b, c ≥ 0, then show that all the three partial correlation coefficients are equal to −1.',
        ],
      },
    ],
    prepSubjectId: 'bsc-karnataka-probability',
    source: { title: 'B.Sc II Semester — all papers, May 2024 (NEP)', url: 'https://library.stagnescollege.edu.in/wp-content/uploads/2024/08/agnes-bsc-II-semester-all-paper-may-2024-nep.pdf', publisher: 'St Agnes College (Autonomous) Library, Mangaluru', retrievedOn: '2026-09-25', note: 'Autonomous-college end-semester paper; degree awarded by Mangalore University.' },
  },
  // ── St Agnes College (Autonomous), Mangaluru · V Semester B.Sc. · October 2025 ─
  {
    id: 'stagnes-mu-bsc-5-physics-classical-and-quantum-mechanics-2025-10',
    program: 'bsc',
    university: 'stagnes-mu',
    scheme: 'CBCS semester scheme (NEP 2021 batch), autonomous end-semester examination',
    semester: 5,
    subject: 'Physics: Classical Mechanics and Quantum Mechanics',
    subjectArea: 'Physics',
    paperCode: '21PHYC501',
    examMonth: 'October',
    examYear: 2025,
    durationMinutes: 120,
    maxMarks: 60,
    sections: [
      {
        id: 'A', title: 'Part A', instruction: 'Answer any five questions, selecting a minimum of one question from every unit. Each question carries 9 marks (2 + 7).', answer: 5, marksEach: 9,
        questions: [
          { text: 'Unit I — answer both parts.', parts: ['(a) State the principle of virtual work.', "(b) Derive the equation of motion for a simple pendulum using Lagrange's equation of motion."] },
          { text: 'Unit I — answer both parts.', parts: ["(a) Define Newton's second law of motion.", '(b) What is a constraint? Explain the types of constraints in detail.'] },
          { text: 'Unit II — answer both parts.', parts: ['(a) Define variational principle.', "(b) Derive Lagrange's equation from Hamilton's principle."] },
          { text: 'Unit II — answer both parts.', parts: ["(a) Write the mathematical form of Hamilton's principle.", "(b) Prove that Poisson's bracket obeys the commutative and distributive laws."] },
          { text: 'Unit III — answer both parts.', parts: ['(a) Derive the relation between uncertainties in angular displacement and angular momentum.', "(b) State Heisenberg's uncertainty principle and explain in detail the gamma-ray microscope."] },
          { text: 'Unit III — answer both parts.', parts: ['(a) Distinguish between matter waves and electromagnetic waves.', '(b) Describe, with the necessary theory, the Davisson and Germer experiment for establishing the wave nature of the electron.'] },
          { text: 'Unit IV — answer both parts.', parts: ['(a) Show that the de Broglie wavelength of a particle in a one-dimensional box in the first excited state is equal to the length of the box.', '(b) What is a wave function? Why should it be in complex form?'] },
          { text: 'Unit IV — answer both parts.', parts: ['(a) Show that the probability curves for a linear harmonic oscillator for higher quantum numbers approximate the classical values.', '(b) What are expectation value, eigenvalue and eigenfunction? Explain their significance.'] },
        ],
      },
      {
        id: 'B', title: 'Part B', instruction: 'Answer any three questions. Each question carries 5 marks.', answer: 3, marksEach: 5,
        questions: [
          'A block is pulled 5 m along a horizontal surface by a 10 N force acting at 30° to the horizontal. Calculate the work done by the force.',
          'F = x²p, G = x, where x and p are canonical coordinates and momenta. Find the Poisson bracket [F, G].',
          'A marble of mass 1 × 10⁻³ kg is constrained to roll inside a tube of length L = 10⁻² m. The tube is capped at both ends. Modelling this as a one-dimensional infinite square well, determine the value of the quantum number n if the marble is initially given an energy of 1 × 10⁻³ J. Calculate the excitation energy required to promote the marble to the next available energy state.',
          'Think of the nucleus as a box with a size of 10⁻¹⁴ m across. Compute the energy of a neutron confined to the nucleus for the ground state and the first, second and third excited states. Comment on the results. Mass of the neutron is 1.67 × 10⁻²⁷ kg.',
        ],
      },
    ],
    prepSubjectId: 'bsc-karnataka-mechanics',
    source: { title: 'B.Sc V Semester — all papers, October 2025 (NEP)', url: 'https://library.stagnescollege.edu.in/wp-content/uploads/2026/01/agnes-bsc-v-sem-all-papers-oct-2025-nep.pdf', publisher: 'St Agnes College (Autonomous) Library, Mangaluru', retrievedOn: '2026-09-25', note: 'Autonomous-college end-semester paper; degree awarded by Mangalore University.' },
  },
  // ── St Agnes College (Autonomous), Mangaluru · IV Semester B.Sc. · May 2025 ─
  {
    id: 'stagnes-mu-bsc-4-mathematics-pde-and-integral-transforms-2025-05',
    program: 'bsc',
    university: 'stagnes-mu',
    scheme: 'CBCS semester scheme (NEP 2021 batch), autonomous end-semester examination',
    semester: 4,
    subject: 'Mathematics: Partial Differential Equations and Integral Transforms',
    subjectArea: 'Mathematics',
    paperCode: '21MATC401',
    examMonth: 'May',
    examYear: 2025,
    durationMinutes: 120,
    maxMarks: 60,
    sections: [
      {
        id: 'A', title: 'Part A', instruction: 'Answer any 6 questions. Each question carries 2 marks.', answer: 6, marksEach: 2, subLabels: true,
        questions: [
          'Eliminate a and b from the following relation to form a partial differential equation: z = ax + by + a.',
          'Solve: z = px + qy + p² + q².',
          'Solve: ∂²z/∂x² − ∂²z/∂y² = 0.',
          "Solve: (4D² + 12DD' + 9D'²) z = 0.",
          'Find L{e⁻⁴ᵗ + 3e⁻²ᵗ}.',
          'Find L{sin kt cos kt}.',
          'Find L⁻¹{4/s²}.',
          'Find L⁻¹{(3s + 1)/(s + 1)²}.',
        ],
      },
      {
        id: 'B', title: 'Part B', instruction: 'Answer any 2 questions. Each question carries 6 marks.', answer: 2, marksEach: 6, subLabels: true,
        questions: [
          'Find the complete integral of q = (z + px)².',
          'Solve: √p + √q = x.',
          'Solve: py + qx = pq.',
          'Solve: px(y² + z) − qy(x² + z) = z(x² − y²).',
        ],
      },
      {
        id: 'C', title: 'Part C', instruction: 'Answer any 2 questions. Each question carries 6 marks.', answer: 2, marksEach: 6, subLabels: true,
        questions: [
          'Reduce ∂²z/∂x² = (1 + y²) ∂²z/∂y² to canonical form. (The right-hand side is faint in the scanned copy and is reproduced as best read.)',
          'Reduce ∂²z/∂x² + 2 ∂²z/∂x∂y + ∂²z/∂y² = 0 to canonical form.',
          'Reduce ∂²z/∂x² + y² ∂²z/∂y² = y to canonical form.',
          'Solve: u_xx − u = 0.',
        ],
      },
      {
        id: 'D', title: 'Part D', instruction: 'Answer any 2 questions. Each question carries 6 marks.', answer: 2, marksEach: 6, subLabels: true,
        questions: [
          'Derive the formula for L{cos kt}.',
          'Find L{F(t)} where F(t) = t for 0 < t < 4, and F(t) = 5 for t > 4.',
          '(a) Define the Gamma function and find L{t^(5/2)}. (b) Write the value of Γ(6).',
          'Find the Laplace transform of the function Ψ(t, c) = 1 for 0 < t < c, Ψ(t, c) = 0 for c < t < 2c, with Ψ(t + 2c, c) = Ψ(t, c).',
        ],
      },
      {
        id: 'E', title: 'Part E', instruction: 'Answer any 2 questions. Each question carries 6 marks.', answer: 2, marksEach: 6, subLabels: true,
        questions: [
          '(i) Find L⁻¹{k / (s(s² + k²))} using the convolution theorem. (ii) Find L{(t − 4)² α(t − 4)}.',
          'Find and sketch F(t) = L⁻¹{(1 − e⁻²ˢ)(1 − 3e⁻²ˢ) / s²}. Also find F(1), F(3), F(5). (Exponents reproduced as best read from the scan.)',
          "Solve: y''(x) + y(x) = 4eˣ with y(0) = 0, y'(0) = 0 using Laplace transforms.",
          'Find the Fourier series of the function f(t) = 0 for −2 < t < −1, f(t) = k for −1 < t < 1, f(t) = 0 for 1 < t < 2, with period T = 4.',
        ],
      },
    ],
    prepSubjectId: 'bsc-karnataka-numerical-methods',
    source: { title: 'B.Sc IV Semester — all papers, May 2025 (NEP)', url: 'https://library.stagnescollege.edu.in/wp-content/uploads/2025/07/agnes-bsc-iv-sem-all-papers-may-2025-nep.pdf', publisher: 'St Agnes College (Autonomous) Library, Mangaluru', retrievedOn: '2026-09-25', note: 'Autonomous-college end-semester paper; degree awarded by Mangalore University.' },
  },
]
