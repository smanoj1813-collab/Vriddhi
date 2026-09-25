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
  // ── St Agnes College (Autonomous), Mangaluru · I Semester B.A. · Nov/Dec 2023 ─
  {
    id: 'stagnes-mu-ba-1-journalism-introduction-to-journalism-2023-11',
    program: 'ba',
    university: 'stagnes-mu',
    scheme: 'CBCS semester scheme (NEP 2021 batch), autonomous end-semester examination',
    semester: 1,
    subject: 'Journalism: Introduction to Journalism',
    subjectArea: 'Journalism & Mass Communication',
    paperCode: '21JMCC101',
    examMonth: 'November/December',
    examYear: 2023,
    durationMinutes: 120,
    maxMarks: 60,
    sections: [
      {
        id: 'A', instruction: 'Answer any FOUR of the following. Each question carries 5 marks.', answer: 4, marksEach: 5,
        questions: [
          'What is Citizen Journalism?',
          'Define Journalism. What is its scope and importance?',
          'According to you, how should media present news in the best possible way?',
          'Do you think social media is an effective medium to transfer the message?',
          'Why is media literacy important?',
        ],
      },
      {
        id: 'B', instruction: 'Answer any TWO of the following. Each question carries 10 marks.', answer: 2, marksEach: 10,
        questions: [
          'What are the impacts of social media on society?',
          '"Instead of building walls, we can help build bridges." Evaluate in the context of media.',
          'What qualities make good journalists?',
        ],
      },
      {
        id: 'C', instruction: 'Answer any ONE of the following. The question carries 20 marks.', answer: 1, marksEach: 20,
        questions: [
          'An independent and free media is essential to ensure democracy. Explain.',
          'What are the impacts of globalisation on media? Explain your answer with supporting examples.',
        ],
      },
    ],
    prepSubjectId: 'ba-karnataka-media-studies',
    source: { title: 'B.A. I Semester — all papers, November/December 2023 (NEP)', url: 'https://library.stagnescollege.edu.in/wp-content/uploads/2024/02/ba-I-sem-all-paper-nov-dec-2023.pdf', publisher: 'St Agnes College (Autonomous) Library, Mangaluru', retrievedOn: '2026-09-25', note: 'Autonomous-college end-semester paper; degree awarded by Mangalore University.' },
  },
  {
    id: 'stagnes-mu-ba-1-political-science-basic-concepts-2023-11',
    program: 'ba',
    university: 'stagnes-mu',
    scheme: 'CBCS semester scheme (NEP 2021 batch), autonomous end-semester examination',
    semester: 1,
    subject: 'Political Science: Basic Concepts of Political Science',
    subjectArea: 'Political Science',
    paperCode: '21PSCC101',
    examMonth: 'November/December',
    examYear: 2023,
    durationMinutes: 120,
    maxMarks: 60,
    sections: [
      {
        id: 'A', instruction: 'Answer any THREE of the following. Each question carries 5 marks.', answer: 3, marksEach: 5,
        questions: [
          'Explain the Gandhian perspective of the state.',
          'Explain the importance of sovereignty.',
          'In the monarchical form of government, how is sovereignty exercised?',
          'Explain the importance of equality in our life.',
          'Every human being requires justice. Give examples from various spheres.',
        ],
      },
      {
        id: 'B', instruction: 'Answer any THREE of the following. Each question carries 15 marks.', answer: 3, marksEach: 15,
        questions: [
          'Explain the difference between state and society.',
          'Critically evaluate three approaches to political science.',
          "Describe the criticism of pluralistic theorists on Austin's theory.",
          'Elucidate the elements of the State.',
          'How does political equality stress the democratic principles of the state?',
          'Describe the meaning and kinds of liberty.',
        ],
      },
    ],
    instructions: [
      'The source bundle also carries a second version of this paper (same code and session). Its Section A asks: meaning of Political Science; monistic theory of sovereignty; a note on justice; meaning of negative liberty; nature of political obligations. Its Section B asks: state vs government; approaches to political science; theories of sovereignty; elements of state; dimensions of equality; meaning and kinds of liberty.',
    ],
    source: { title: 'B.A. I Semester — all papers, November/December 2023 (NEP)', url: 'https://library.stagnescollege.edu.in/wp-content/uploads/2024/02/ba-I-sem-all-paper-nov-dec-2023.pdf', publisher: 'St Agnes College (Autonomous) Library, Mangaluru', retrievedOn: '2026-09-25', note: 'Autonomous-college end-semester paper; degree awarded by Mangalore University.' },
  },
  {
    id: 'stagnes-mu-ba-1-history-political-history-of-karnataka-part-i-2023-11',
    program: 'ba',
    university: 'stagnes-mu',
    scheme: 'CBCS semester scheme (NEP 2021 batch), autonomous end-semester examination',
    semester: 1,
    subject: 'History: Political History of Karnataka Part I',
    subjectArea: 'History',
    paperCode: '21HISC101',
    examMonth: 'November/December',
    examYear: 2023,
    durationMinutes: 120,
    maxMarks: 60,
    sections: [
      {
        id: 'A', instruction: 'Answer any TWO of the following. Each question carries 5 marks.', answer: 2, marksEach: 5,
        questions: [
          'What is Pre-history? Who is the father of Indian Pre-history? Why?',
          'Why does Chavundaraya occupy a prominent place in the history of the Gangas?',
          'What are the seven limbs of the state according to the Saptanga theory?',
        ],
      },
      {
        id: 'B', instruction: 'Answer any TWO of the following. Each question carries 10 marks.', answer: 2, marksEach: 10,
        questions: [
          'Explain the archaeological sources available for the study of Karnataka history.',
          'Outline the achievements of the Ganga ruler Durvinitha.',
          'Explain in brief the features of provincial administration under the Mauryas.',
        ],
      },
      {
        id: 'C', instruction: 'Answer any TWO of the following (map question compulsory). Each question carries 15 marks.', answer: 2, marksEach: 15,
        questions: [
          'Analyse the conquests and achievements of Vikramaditya VI.',
          'Evaluate the role played by Amoghavarsha I in the history of the Rashtrakutas of Malkhed.',
          'Mark the extent of the Chalukyan Empire under Pulakeshi II and write an explanatory note on it. Locate the following places: (a) Vengi (b) Talakadu (c) Badami (d) Banavasi (e) Aihole.',
        ],
      },
    ],
    source: { title: 'B.A. I Semester — all papers, November/December 2023 (NEP)', url: 'https://library.stagnescollege.edu.in/wp-content/uploads/2024/02/ba-I-sem-all-paper-nov-dec-2023.pdf', publisher: 'St Agnes College (Autonomous) Library, Mangaluru', retrievedOn: '2026-09-25', note: 'Autonomous-college end-semester paper; degree awarded by Mangalore University.' },
  },
]
