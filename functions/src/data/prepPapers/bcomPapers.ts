// functions/src/data/prepPapers/bcomPapers.ts
//
// BCOM previous-year question papers (compact PrepPaperSeed records).
// See ./index.ts for conventions.

import type { PrepPaperSeed } from '../../prepPapers'

export const BCOM_PAPERS: PrepPaperSeed[] = [
  // ── BCU · I Semester B.Sc./B.Com./BBA (Open Elective) · February/March 2024 ─
  {
    id: 'bcu-bcom-1-economics-of-business-environment-2024-02',
    program: 'bcom',
    university: 'bcu',
    scheme: 'NEP 2021-22 onwards (F+R)',
    semester: 1,
    subject: 'Economics of Business Environment (Open Elective)',
    subjectArea: 'Economics',
    paperCode: 'OESE111',
    examMonth: 'February/March',
    examYear: 2024,
    durationMinutes: 150,
    maxMarks: 60,
    instructions: [
      'Answers should be written completely either in English or in Kannada.',
      'Answers of Part A should be continuous.',
      'Answers should be precise.',
    ],
    sections: [
      {
        id: 'A', instruction: 'Answer any TEN of the following questions. Each question carries 1 mark.', answer: 10, marksEach: 1, subLabels: true,
        questions: [
          'What is business environment?',
          'Give the meaning of globalization.',
          'Write any two impacts of privatization.',
          'What is Fiscal Policy?',
          'Write any two objectives of monetary policy.',
          'What is EXIM Bank?',
          'Define liberalization.',
          'Give the meaning of FDI.',
          'What is business ethics?',
          'Give the meaning of industrialisation.',
          'Expand MSMEs.',
          'Expand WTO.',
        ],
      },
      {
        id: 'B', instruction: 'Analytical: Answer any SIX of the following. Each question carries 5 marks.', answer: 6, marksEach: 5,
        questions: [
          'Explain the objectives of Fiscal Policy.',
          'Write a note on EXIM Bank.',
          'Explain the features of the 1991 industrial policy.',
          'Write a note on Make in India.',
          'Explain the social objectives of business.',
          'Briefly explain the importance of business ethics.',
          'Explain the merits of FDI.',
          'Explain the features of MSMEs.',
        ],
      },
      {
        id: 'C', instruction: 'Descriptive: Answer any TWO of the following. Each question carries 10 marks.', answer: 2, marksEach: 10,
        questions: [
          'Explain the characteristics of the Indian economy.',
          'Discuss the impact of LPG on the Indian economy.',
          'Explain the objectives and functions of WTO.',
        ],
      },
    ],
    source: { title: 'I Semester BBA question papers, February/March 2024 (bundle PDF)', url: 'https://www.cicms.in/uploads/quastion-papers/bba/1st-semester/2024-1st-Sem-BBA.pdf', publisher: 'CIMS B-School, Bengaluru (BCU-affiliated college)', retrievedOn: '2026-09-25', note: 'Open elective offered to B.Sc., B.Com. and BBA students.' },
  },
  // ── St Agnes College (Autonomous), Mangaluru · II Semester B.A./B.Com./BBA/BCA · May 2024 ─
  {
    id: 'stagnes-mu-bcom-2-business-mathematics-ii-2024-05',
    program: 'bcom',
    university: 'stagnes-mu',
    scheme: 'CBCS semester scheme (NEP 2021 batch), autonomous end-semester examination',
    semester: 2,
    subject: 'Business Mathematics II (Open Elective)',
    subjectArea: 'Mathematics',
    paperCode: '21MATE22',
    examMonth: 'May',
    examYear: 2024,
    durationMinutes: 120,
    maxMarks: 60,
    sections: [
      {
        id: 'A', title: 'Part A', instruction: 'Answer any 8 questions. Each question carries 3 marks.', answer: 8, marksEach: 3, subLabels: true,
        questions: [
          'At what rate of simple interest will a certain sum be doubled in 15 years?',
          'Find the compound interest on Rs. 10,000 in two years at 4% per annum, the interest being compounded half-yearly.',
          'Check whether 246591 is divisible by 9.',
          'In a caravan, in addition to 50 hens there are 45 goats and 8 camels with some keepers. If the total number of feet is 224 more than the number of heads, find the number of keepers.',
          'Given that 268 × 74 = 19832, find the value of 2.68 × 0.74.',
          'Which of the following are prime numbers? (i) 571 (ii) 337 (iii) 391',
          'The average weight of 16 boys in a class is 50.25 kg and that of the remaining 8 boys is 45.15 kg. Find the average weight of all the boys in the class.',
          'A bus leaves at 12.25 noon and reaches its destination at 10.45 am. Find the duration of the journey.',
          'A takes twice as much time as B or thrice as much time as C to finish a piece of work. Working together, they can finish the work in 2 days. In how many days can B alone complete the work?',
          'A car covers a distance of 432 km at the speed of 48 km/hr. In how many hours will the car cover this distance?',
          'A train 132 m long passes a telegraph pole in 6 seconds. Find the speed of the train.',
          'Find the angle between the hour hand and the minute hand of a clock when the time is 3.25.',
        ],
      },
      {
        id: 'B', title: 'Part B', instruction: 'Answer any 2 questions. Each question carries 6 marks.', answer: 2, marksEach: 6, subLabels: true,
        questions: [
          'Find the simple interest on Rs. 700 at 8% for one year, one month (June) and six days.',
          'Find the sum of money which will amount to Rs. 26,010 in six months at the rate of 8% per annum when the interest is compounded quarterly.',
          'Find the sum of an immediate annuity consisting of six annual payments of Rs. 400, if the rate of interest is 5% compounded annually.',
          'Shwetha avails a loan of Rs. 1,00,000 at an interest rate of 8% per annum to be paid back in 3 years. As per the flat rate method Shwetha will pay interest on the total loan amount of Rs. 1,00,000. Calculate the EMI using the reducing balance method.',
        ],
      },
      {
        id: 'C', title: 'Part C', instruction: 'Answer any 2 questions. Each question carries 6 marks.', answer: 2, marksEach: 6, subLabels: true,
        questions: [
          "When a certain number is multiplied by 18, the product consists entirely of 2's. Find the smallest such number.",
          'The sum of seven consecutive natural numbers is 1617. How many of these numbers are prime?',
          "The ratio of the present ages of a mother and her daughter is 7 : 1. Four years ago, the ratio of their ages was 19 : 1. What will be the mother's age four years from now?",
          'A library has an average of 510 visitors on Sundays and 240 on other days. Find the average number of visitors per day in a month of 30 days beginning with a Sunday.',
        ],
      },
      {
        id: 'D', title: 'Part D', instruction: 'Answer any 2 questions. Each question carries 6 marks.', answer: 2, marksEach: 6, subLabels: true,
        questions: [
          'A can do a piece of work in 8 days and B can do the same piece of work in 12 days. A and B together complete the same piece of work and get Rs. 200 as the combined wages. Find the share of B.',
          'A man riding his bicycle covers 150 metres in 25 seconds. What is his speed in km per hour?',
          'It was Sunday on Jan 1, 2006. What was the day of the week on Jan 1, 2010?',
          'A man takes 3 hours 45 minutes to row a boat 15 km downstream of a river and 2 hours 30 minutes to cover a distance of 5 km upstream. Find the speed of the river current in km/hr.',
        ],
      },
    ],
    prepSubjectId: 'bba-karnataka-math',
    source: { title: 'B.Sc II Semester — all papers, May 2024 (NEP)', url: 'https://library.stagnescollege.edu.in/wp-content/uploads/2024/08/agnes-bsc-II-semester-all-paper-may-2024-nep.pdf', publisher: 'St Agnes College (Autonomous) Library, Mangaluru', retrievedOn: '2026-09-25', note: 'Open elective offered to B.A., B.Com., BBA and BCA students; autonomous-college end-semester paper under Mangalore University. Doubles as aptitude practice.' },
  },
]
