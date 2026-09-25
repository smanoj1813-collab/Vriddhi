// functions/src/data/prepPapers/bbmPapers.ts
//
// BBM previous-year question papers (compact PrepPaperSeed records).
// See ./index.ts for conventions.

import type { PrepPaperSeed } from '../../prepPapers'

export const BBM_PAPERS: PrepPaperSeed[] = [
  // ── Bangalore University · B.B.M. (pre-rename) · 2014 ─────────────────────
  {
    id: 'bu-bbm-6-strategic-management-2014-05',
    program: 'bba',
    legacyProgram: 'bbm',
    university: 'bu',
    scheme: 'Semester scheme, B.B.M. (2013-14 batch, fresh)',
    semester: 6,
    subject: 'Strategic Management',
    subjectArea: 'Business Management',
    paperCode: 'MS-452',
    examMonth: 'May/June',
    examYear: 2014,
    durationMinutes: 180,
    maxMarks: 100,
    instructions: ['Answers should be written only in English.'],
    sections: [
      {
        id: 'A', instruction: 'Answer any eight sub-questions. Each sub-question carries two marks.', answer: 8, marksEach: 2, subLabels: true,
        questions: [
          'Define strategic management.',
          'Mention any two objectives of Business Policy.',
          'What is ETOP?',
          'What is social audit?',
          'What is a strategic plan?',
          'What is corporate politics?',
          'What is strategic control?',
          'What is a retrenchment strategy?',
          'What do you mean by "leadership style"?',
          'What is strategic evaluation?',
        ],
      },
      {
        id: 'B', instruction: 'Answer any three questions. Each question carries eight marks.', answer: 3, marksEach: 8,
        questions: [
          'Briefly explain the nature and importance of strategic evaluation.',
          'Differentiate between a vision and a mission statement.',
          'Explain the impact of the international environment on domestic business.',
          'Explain the advantages and disadvantages of matrix structure.',
          '"Business policies are the very base of management process." Explain.',
        ],
      },
      {
        id: 'C', instruction: 'Answer any four questions. Each question carries fifteen marks.', answer: 4, marksEach: 15,
        questions: [
          'Explain the process of strategic management.',
          'Explain retrenchment strategy and its types.',
          'Explain the issues associated with strategy implementation in an organisation.',
          'Explain the environmental factors influencing a company in formulating strategies.',
          'Define social responsibility. Discuss its significance for business and economic growth of a country.',
        ],
      },
    ],
    prepSubjectId: 'bba-karnataka-strategic-mgmt',
    source: { title: 'VI Semester B.B.M. Examination, May/June 2014 — Strategic Management', url: 'https://www.spmcollege.ac.in/questionpapers/bba2014/6sem/stratgc-mgmt.pdf', publisher: 'Seshadripuram College, Bengaluru (Bangalore University-affiliated college) question-paper bank', retrievedOn: '2026-09-25', note: 'University-set paper hosted by an affiliated college. BBM was renamed BBA; filed under BBA.' },
  },
  {
    id: 'bu-bbm-5-management-accounting-2014-11',
    program: 'bba',
    legacyProgram: 'bbm',
    university: 'bu',
    scheme: 'Semester scheme, B.B.M. (2014-15 and onwards, fresh)',
    semester: 5,
    subject: 'Management Accounting',
    subjectArea: 'Accounting',
    paperNumber: '5.5',
    examMonth: 'November/December',
    examYear: 2014,
    durationMinutes: 180,
    maxMarks: 100,
    instructions: ['Answers should be written in English.', 'Working notes should be given wherever necessary.'],
    sections: [
      {
        id: 'A', instruction: 'Answer any eight of the following sub-questions. Each sub-question carries 2 marks.', answer: 8, marksEach: 2, subLabels: true,
        questions: [
          'Name any four tools of management accounting.',
          'Give the meaning of comparative statement.',
          'State any four objectives of management reporting.',
          'What are the profitability ratios? Name any two.',
          'State any two uses of fund flow analysis.',
          'Mention any two differences between fund flow statement and cash flow statement.',
          'What is contribution?',
          'What are the objectives of budgetary control?',
          'If the fixed asset ratio is 1 : 1.5 and the value of goods sold is Rs. 5,00,000, calculate the value of fixed assets.',
          'State any four functions of management accounting.',
        ],
      },
      {
        id: 'B', instruction: 'Answer any three of the following. Each question carries eight marks.', answer: 3, marksEach: 8,
        questions: [
          'Explain the role of the management accountant.',
          'Enumerate the steps involved in drafting a report.',
          {
            text: 'Calculate the trend percentages from the following figures of X Ltd., taking 2009 as the base, and interpret them. (Rs. in lakhs; the PBT column is reproduced as best read from the scanned copy.)',
            parts: [
              'Year 2009 — Sales 1,880; Stock 710; PBT 320',
              'Year 2010 — Sales 2,340; Stock 780; PBT 435',
              'Year 2011 — Sales 2,670; Stock 820; PBT 460',
              'Year 2012 — Sales 3,020; Stock 950; PBT 530',
              'Year 2013 — Sales 3,770; Stock 1,150; PBT 670',
            ],
          },
          {
            text: 'The sales turnover and profit during two years were as follows: 2012 — Sales Rs. 1,40,000, Profit Rs. 15,000; 2013 — Sales Rs. 1,60,000, Profit Rs. 20,000. Calculate:',
            parts: ['(a) P/V Ratio', '(b) BEP', '(c) Sales required to earn a profit of Rs. 40,000', '(d) Fixed expenses'],
          },
        ],
      },
      {
        id: 'C', instruction: 'Answer Q. No. 10 and any three of the remaining. Each question carries 15 marks.', answer: 4, marksEach: 15,
        questions: [
          {
            text: "Following are the Balance Sheets of 'S' Ltd. for the years ending December 31, 2012 and 2013. Analyse the financial position of the company with the help of a common-size Balance Sheet. (Figures in Rs., 2012 / 2013.)",
            parts: [
              'Liabilities: Equity share capital 40,000 / 60,000; Reserves and surplus 31,200 / 35,400; Debentures 5,000 / 10,000; Mortgage 15,000 / 25,500; Sundry creditors 25,500 / 11,700; Other current liabilities 700 / 1,000.',
              'Assets: Land and Building 27,000 / 17,000; Plant and Machinery 31,000 / 78,600; Furniture and Fixtures 900 / 1,800; Other fixed assets 2,000 / 3,000; Long-term loan (asset) 4,600 / 5,900; Cash in hand 11,800 / 1,000; Sundry debtors 20,900 / 19,000; Inventory 16,000 / 13,000; Prepaid expenses 300 / 300; Other current assets 2,900 / 4,000.',
            ],
          },
          "The gross profit of X Ltd. for the year 2013 is Rs. 80,000. This is 1/4th of the year's sales. Out of the total sales, 3/4th is on credit. The stock turnover is 10 times and the average collection period is 15 days (assume 360 days). Total assets turnover is 4 times and long-term debt to equity is 50%. Shareholders' equity is Rs. 40,000. The current ratio is 2 : 1. Find out (1) Credit sales (2) Long-term debt (3) Cash in hand (4) Debtors (5) Closing stock (6) Fixed assets, and also prepare the Balance Sheet of X Ltd. for the year 2013.",
          {
            text: 'Following are the summarised Balance Sheets of Sahana Ltd. as on 31st December 2012 and 2013. Prepare a statement showing the sources and application of funds for the year ended 31st December 2013. (Figures in Rs., 2012 / 2013.)',
            parts: [
              'Liabilities: Share capital 4,50,000 / 4,50,000; General reserve 3,00,000 / 3,10,000; Profit and loss a/c 56,000 / 68,000; Creditors 1,68,000 / 1,34,000; Provision for taxation 75,000 / 10,000; Mortgage loan — / 2,70,000. Total 10,49,000 / 12,42,000.',
              'Assets: Fixed assets 4,00,000 / 3,20,000; Investments (non-current) 50,000 / 60,000; Stock 2,40,000 / 2,10,000; Debtors 2,10,000 / 4,55,000; Bank 1,49,000 / 1,97,000. Total 10,49,000 / 12,42,000.',
              'Additional information: (1) Investments costing Rs. 8,000 were sold during the year 2013 for Rs. 8,500. (2) Provision for taxation made during the year was Rs. 90,000. (3) During the year a part of the fixed assets costing Rs. 10,000 was sold for Rs. 12,000; the profit was included in the profit and loss account. (4) Dividend paid during the year amounted to Rs. 40,000.',
            ],
          },
          {
            text: 'Balance Sheets of X and Y as on 1-1-2013 and 31-12-2013 were as follows. During the year a machine costing Rs. 10,000 (accumulated depreciation Rs. 3,000) was sold for Rs. 5,000. The provision for depreciation against machinery as on 1st January 2013 and 31st December 2013 was Rs. 25,000 and Rs. 40,000 respectively. Net profit for the year 2013 amounted to Rs. 45,000. You are required to prepare a cash flow statement. (Figures in Rs., 1-1-13 / 31-12-13.)',
            parts: [
              'Liabilities: Creditors 40,000 / 44,000; Mr. X loan 25,000 / —; Loan from bank 40,000 / 50,000; Capital 1,25,000 / 1,53,000. Total 2,30,000 / 2,47,000.',
              'Assets: Cash 10,000 / 7,000; Debtors 30,000 / 50,000; Stock 35,000 / 25,000; Land 40,000 / 50,000; Building 35,000 / 60,000; Machinery 80,000 / 55,000. Total 2,30,000 / 2,47,000.',
            ],
          },
          {
            text: 'From the following details prepare a cash budget for the three months commencing from 1st June 2014, when the bank balance was Rs. 1,00,000. There is a two-month credit period allowed to customers and received from suppliers. Wages, production expenses and administrative expenses are payable in the following month. (Rs.: Sales; Purchases; Wages; Production expenses; Administration expenses.)',
            parts: [
              'April — 80,000; 41,000; 5,600; 3,900; 10,000',
              'May — 76,500; 40,500; 5,400; 4,200; 14,000',
              'June — 78,500; 38,500; 5,400; 5,100; 15,000',
              'July — 90,000; 37,000; 4,800; 5,100; 17,000',
              'August — 95,000; 35,000; 4,700; 6,000; 13,000',
            ],
          },
        ],
      },
    ],
    prepSubjectId: 'bba-karnataka-mgmt-accounting',
    source: { title: 'V Semester B.B.M. Examination, Nov./Dec. 2014 — Paper 5.5 Management Accounting', url: 'https://www.spmcollege.ac.in/questionpapers/bba2014/5sem/mgmt-acc-f.pdf', publisher: 'Seshadripuram College, Bengaluru (Bangalore University-affiliated college) question-paper bank', retrievedOn: '2026-09-25', note: 'University-set paper hosted by an affiliated college. Two-column scan; tables re-flowed into rows. BBM was renamed BBA; filed under BBA.' },
  },
]
