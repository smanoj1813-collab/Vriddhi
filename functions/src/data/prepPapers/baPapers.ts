// functions/src/data/prepPapers/baPapers.ts
//
// BA previous-year question papers (compact PrepPaperSeed records).
// See ./index.ts for conventions.

import type { PrepPaperSeed } from '../../prepPapers'

export const BA_PAPERS: PrepPaperSeed[] = [
  // ── BCU · I Semester All UG (Open Elective, Economics) · February/March 2024 ─
  {
    id: 'bcu-ba-1-indian-economy-prior-to-reforms-2024-02',
    program: 'ba',
    university: 'bcu',
    scheme: 'NEP 2021-22 onwards (F+R)',
    semester: 1,
    subject: 'Indian Economy Prior to Economic Reforms (Open Elective)',
    subjectArea: 'Economics',
    paperCode: 'OEEC112',
    paperNumber: 'OEC-1',
    examMonth: 'February/March',
    examYear: 2024,
    durationMinutes: 150,
    maxMarks: 60,
    instructions: [
      'Answers should be written in English or in Kannada.',
      'Answers of Part A should be continuous.',
      'Answers should be precise.',
    ],
    sections: [
      {
        id: 'A', instruction: 'Answer any TEN of the following questions. Each question carries 1 mark.', answer: 10, marksEach: 1, subLabels: true,
        questions: [
          'What is density of population?',
          'Define sex ratio.',
          'Expand HDI.',
          'Define poverty line.',
          'Define Green Revolution.',
          'Mention two defects of the agriculture market.',
          'What is Industrial Policy?',
          'State any two international airports in India.',
          'Expand PIN.',
          'What are the types of water transport?',
          'What is health?',
          'Give the meaning of mixed economy.',
          'What is black money?',
        ],
      },
      {
        id: 'B', instruction: 'Answer any SIX of the following questions. Each question carries 5 marks.', answer: 6, marksEach: 5,
        questions: [
          'Explain the demographic features of India.',
          'Briefly explain the causes of unemployment.',
          'Write a short note on the benefits of the Green Revolution.',
          'What are the defects of the agriculture market in India?',
          'Discuss the 1991 Industrial Policy.',
          'Briefly explain the importance of the service sector in India.',
          'Explain the causes for the increase in public expenditure.',
          'What are the objectives of NITI Aayog?',
        ],
      },
      {
        id: 'C', instruction: 'Answer any TWO of the following questions. Each question carries 10 marks.', answer: 2, marksEach: 10,
        questions: [
          'Explain the features of the Indian economy.',
          'Explain the importance of micro, small and medium enterprises in India.',
          'Explain the causes of black money and its effects in India.',
        ],
      },
    ],
    prepSubjectId: 'ba-karnataka-indian-economy',
    source: { title: 'I Semester BBA question papers, February/March 2024 (bundle PDF)', url: 'https://www.cicms.in/uploads/quastion-papers/bba/1st-semester/2024-1st-Sem-BBA.pdf', publisher: 'CIMS B-School, Bengaluru (BCU-affiliated college)', retrievedOn: '2026-09-25', note: 'Open elective offered to all UG programmes; core reading for BA Economics.' },
  },
]
