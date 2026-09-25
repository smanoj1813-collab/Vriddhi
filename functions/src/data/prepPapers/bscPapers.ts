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
]
