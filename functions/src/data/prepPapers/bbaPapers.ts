// functions/src/data/prepPapers/bbaPapers.ts
//
// BBA previous-year question papers (compact PrepPaperSeed records).
// See ./index.ts for conventions.

import type { PrepPaperSeed } from '../../prepPapers'

export const BBA_PAPERS: PrepPaperSeed[] = [
  // ── BCU · I Semester BBA · February/March 2024 ─────────────────────────────
  {
    id: 'bcu-bba-1-marketing-management-2024-02',
    program: 'bba',
    university: 'bcu',
    scheme: 'NEP 2021-22 onwards (F+R)',
    semester: 1,
    subject: 'Marketing Management',
    subjectArea: 'Business Administration',
    paperCode: 'DCBB103',
    paperNumber: '1.3',
    examMonth: 'February/March',
    examYear: 2024,
    durationMinutes: 150,
    maxMarks: 60,
    instructions: ['Answers should be written in English only.'],
    sections: [
      {
        id: 'A', instruction: 'Answer any FIVE of the following questions. Each question carries 2 marks.', answer: 5, marksEach: 2, subLabels: true,
        questions: [
          'Define marketing.',
          'What is demographic environment?',
          'What do you mean by market segmentation?',
          'Give the meaning of marketing mix.',
          'What is service marketing?',
          'What is channel of distribution?',
          'Give the meaning of Service Blue Print.',
        ],
      },
      {
        id: 'B', instruction: 'Answer any FOUR of the following questions. Each question carries 5 marks.', answer: 4, marksEach: 5,
        questions: [
          'Briefly explain the characteristics of green marketing.',
          'What are the steps in environmental scanning?',
          'Explain the bases of market segmentation.',
          'What are the steps in New Product Development?',
          'Briefly explain the features of services.',
        ],
      },
      {
        id: 'C', instruction: 'Answer any TWO of the following questions. Each question carries 12 marks.', answer: 2, marksEach: 12,
        questions: [
          'Briefly explain the functions of marketing.',
          'What is consumer behaviour? Explain the factors influencing consumer behaviour.',
          'Briefly explain the components of marketing mix of services.',
        ],
      },
      {
        id: 'D', instruction: 'Answer any ONE of the following questions. Each question carries 6 marks.', answer: 1, marksEach: 6,
        questions: [
          'Which channel of distribution do you select for your product? Give reasons.',
          'Write a marketing mix for your product.',
        ],
      },
    ],
    prepSubjectId: 'bba-karnataka-marketing',
    source: { title: 'I Semester BBA question papers, February/March 2024 (bundle PDF)', url: 'https://www.cicms.in/uploads/quastion-papers/bba/1st-semester/2024-1st-Sem-BBA.pdf', publisher: 'CIMS B-School, Bengaluru (BCU-affiliated college)', retrievedOn: '2026-09-25' },
  },
  {
    id: 'bcu-bba-1-fundamentals-of-accounting-2024-02',
    program: 'bba',
    university: 'bcu',
    scheme: 'NEP 2021-22 onwards (F+R)',
    semester: 1,
    subject: 'Fundamentals of Accounting',
    subjectArea: 'Business Administration / Aviation',
    paperNumber: '1.2',
    examMonth: 'February/March',
    examYear: 2024,
    durationMinutes: 150,
    maxMarks: 60,
    instructions: ['Answers should be written in English only.'],
    sections: [
      {
        id: 'A', instruction: 'Answer any FIVE of the following questions. Each question carries 2 marks.', answer: 5, marksEach: 2, subLabels: true,
        questions: [
          'Define Accounting.',
          'What is a ledger?',
          'Mention any four types of subsidiary books.',
          'What do you mean by single entry system of book keeping?',
          'What is an accounting software?',
          'What is a trading account?',
          'Give the meaning of computerized accounting.',
        ],
      },
      {
        id: 'B', instruction: 'Answer any FOUR of the following questions. Each question carries 5 marks.', answer: 4, marksEach: 5,
        questions: [
          'Briefly explain the advantages of computerized accounting.',
          'From the following ledger balances ascertain gross profit:\nStock (1.4.2021) Rs. 4,60,000; Sales Rs. 2,80,000; Sales returns Rs. 50,000; Purchases Rs. 2,40,000; Purchases returns Rs. 28,000; Carriage inwards Rs. 10,000; Stock (31.3.2022) Rs. 5,00,000; Wages Rs. 5,000.',
          'Enter the following transactions in a simple cash book for the month ending 31st May 2022:\nMay 01 Commenced business with cash Rs. 5,00,000\nMay 02 Bought goods for cash Rs. 2,80,000\nMay 05 Received cash from Mohith Rs. 20,000\nMay 07 Paid cash to Umesh Rs. 29,000\nMay 10 Paid salaries Rs. 5,000\nMay 14 Received cash from Shiva Rs. 9,500\nMay 16 Paid into bank Rs. 1,00,000\nMay 18 Cash sales Rs. 44,000\nMay 25 Purchased stationery Rs. 250\nMay 26 Paid to Priya Rs. 39,000',
          'Prepare a Trial Balance from the following details for the year ending 31.3.2023:\nPurchases Rs. 88,000; Purchase returns Rs. 5,000; Sales Rs. 1,00,000; Sales returns Rs. 10,000; Discount allowed Rs. 5,000; Discount received Rs. 15,000; Carriage inward Rs. 5,000; Carriage outward Rs. 5,000; Wages Rs. 10,000; Depreciation Rs. 10,000; Outstanding rent Rs. 15,000; Prepaid expenses Rs. 2,000.',
          'Prepare purchases and purchases returns book from the following transactions (September 2023):\n01 Purchased goods on credit from M/s Ratan Traders as per invoice No. 714 — 25 shirts @ Rs. 300 per shirt, 20 pants @ Rs. 700 per pant, less 10% trade discount.\n08 Purchased the following goods on credit from M/s Bombay Fashion House as per invoice No. 327 — 10 fancy trousers @ Rs. 500 per trouser, 20 fancy hats @ Rs. 100 per hat, less 5% trade discount.\n10 Goods returned to M/s Ratan Traders as per debit note No. 102 — 3 shirts @ Rs. 300 per shirt, 1 pant @ Rs. 700 per pant, less 10% trade discount.\n24 Goods returned to M/s Bombay Fashion House as per debit note No. 103 — 2 fancy trousers @ Rs. 500 per trouser, 4 fancy hats @ Rs. 100 per hat, less 5% trade discount.\n25 Purchased goods worth Rs. 1,000 for cash from M/s Bridge Palace as per invoice No. 1076.',
        ],
      },
      {
        id: 'C', instruction: 'Answer any TWO of the following questions. Each question carries 12 marks.', answer: 2, marksEach: 12,
        questions: [
          'Prepare a two column cash book from the following transactions for the month of May 2023:\n01 Cash in hand Rs. 17,500; Cash at bank Rs. 5,000\n03 Purchased goods for cash Rs. 3,000\n05 Received cheque from Vijay Rs. 10,000\n08 Sold goods for cash Rs. 7,000\n10 Vijay\'s cheque deposited into bank\n12 Purchased goods and paid by cheque Rs. 20,000\n15 Paid establishment expenses through bank Rs. 1,000\n18 Cash sales Rs. 7,000\n(two entries between 18 and 29 May are not legible in the source scan — see the linked PDF)\n29 Cash withdrawn for personal use Rs. 1,200\n31 Ajay paid us Rs. 5,900 in full settlement of his account of Rs. 6,000',
          'Journalize the following transactions in the books of Mr. Bhuvan (August 2023):\n01 Commenced business with cash Rs. 1,00,000\n04 Deposited into bank Rs. 25,000\n08 Purchased goods for cash Rs. 15,000\n10 Sold goods for cash Rs. 25,000\n12 Purchased goods from Mr. X on credit Rs. 10,000\n15 Sold goods to Mr. Y on credit Rs. 20,000\n16 Withdrew from bank Rs. 5,000\n18 Paid to Mohan on account Rs. 6,000\n20 Received from Harish on account Rs. 25,000\n23 Paid salaries Rs. 5,000\n25 Paid rent Rs. 1,000\n28 Received commission Rs. 500\n30 Paid wages Rs. 700\n31 Cash withdrawn from business for personal use Rs. 1,500',
          'The following Trial Balance was extracted from the books of Mr. Deepak as on 31.3.2023. Prepare the final accounts.\nDebit balances: Opening stock 25,000; Bills receivable 5,000; Returns inward 2,500; Wages 9,600; Purchases 1,03,500; Rent 3,500; Electricity expenses 1,500; Salaries 11,000; Insurance 1,300; Machinery 30,000; Furniture 5,000; Debtors 16,200; Cash in hand 9,900; Drawings 10,000 (total 2,34,000).\nCredit balances: Bills payable 6,000; Returns outward 3,500; Sales 1,62,500; Creditors 12,000; Capital 50,000 (total 2,34,000).\nAdjustments: (a) Outstanding wages Rs. 400, salaries Rs. 1,000 and rent Rs. 500. (b) Prepaid insurance Rs. 300. (c) Write off Rs. 200 bad debts. (d) Depreciate machinery at 5% and furniture at 10%. (e) Closing stock on 31.3.2023 Rs. 18,000.',
        ],
      },
      {
        id: 'D', instruction: 'Answer any ONE of the following questions. Each question carries 6 marks.', answer: 1, marksEach: 6,
        questions: [
          'List out the various accounting concepts and conventions.',
          'Prepare a bank reconciliation statement with imaginary figures.',
        ],
      },
    ],
    prepSubjectId: 'bba-karnataka-accounting',
    source: { title: 'I Semester BBA question papers, February/March 2024 (bundle PDF)', url: 'https://www.cicms.in/uploads/quastion-papers/bba/1st-semester/2024-1st-Sem-BBA.pdf', publisher: 'CIMS B-School, Bengaluru (BCU-affiliated college)', retrievedOn: '2026-09-25' },
  },
  {
    id: 'bcu-bba-1-business-organisation-2024-02',
    program: 'bba',
    university: 'bcu',
    scheme: 'NEP 2021-22 onwards (F+R)',
    semester: 1,
    subject: 'Business Organisation (Open Elective)',
    subjectArea: 'Business Administration / Aviation',
    paperCode: 'OEBB111',
    paperNumber: '1.5 (OEC)',
    examMonth: 'February/March',
    examYear: 2024,
    durationMinutes: 150,
    maxMarks: 60,
    instructions: ['Answers should be either completely in English or in Kannada.'],
    sections: [
      {
        id: 'A', instruction: 'Answer any FIVE of the following questions. Each question carries 2 marks.', answer: 5, marksEach: 2, subLabels: true,
        questions: [
          'Define business.',
          'What do you mean by Co-operative Society?',
          'What is \'Diagonal Combination\'?',
          'Explain the meaning of \'Pools and Cartels\'.',
          'Mention any four characteristics of planning.',
          'Mention any four types of business structure.',
          'Define Public Enterprise.',
        ],
      },
      {
        id: 'B', instruction: 'Answer any FOUR of the following questions. Each question carries 5 marks.', answer: 4, marksEach: 5,
        questions: [
          'Explain any five rights of a partner.',
          'Explain the features of departmental undertaking.',
          'Write a note on levels of management.',
          'Briefly explain the objectives of business combinations.',
          'Discuss the scope of business.',
        ],
      },
      {
        id: 'C', instruction: 'Answer any TWO of the following questions. Each question carries 12 marks.', answer: 2, marksEach: 12,
        questions: [
          'Explain the principles of management.',
          'Define Co-operative Societies. Explain the advantages and disadvantages of Co-operative Societies.',
          'Explain the social responsibility of business towards the society.',
        ],
      },
      {
        id: 'D', instruction: 'Answer any ONE of the following questions. Each question carries 6 marks.', answer: 1, marksEach: 6,
        questions: [
          'List any six contents of a partnership deed.',
          'Mention any six features of a joint stock company.',
        ],
      },
    ],
    prepSubjectId: 'bba-karnataka-mpa',
    source: { title: 'I Semester BBA question papers, February/March 2024 (bundle PDF)', url: 'https://www.cicms.in/uploads/quastion-papers/bba/1st-semester/2024-1st-Sem-BBA.pdf', publisher: 'CIMS B-School, Bengaluru (BCU-affiliated college)', retrievedOn: '2026-09-25' },
  },
]
