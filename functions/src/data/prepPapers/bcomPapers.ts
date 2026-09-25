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
  // ── BCU · VI Semester B.Com · May–July 2026 ────────────────────────────────
  {
    id: 'bcu-bcom-6-management-accounting-2026-05',
    program: 'bcom',
    university: 'bcu',
    scheme: 'NEP scheme (F+R)',
    semester: 6,
    subject: 'Management Accounting',
    subjectArea: 'Accounting',
    paperNumber: 'Com 6.1',
    examMonth: 'May/June',
    examYear: 2026,
    durationMinutes: 150,
    maxMarks: 60,
    instructions: ['Answers should be written in English.'],
    sections: [
      {
        id: 'A', instruction: 'Answer any Five sub-questions from the following. Each sub-question carries 2 marks.', answer: 5, marksEach: 2, subLabels: true,
        questions: [
          'What is Management Accounting?',
          'Write any two objectives of Management Accounting.',
          'Give the meaning of comparative statement.',
          'Name any four Profitability Ratios.',
          'Write any two limitations of Accounting Ratios.',
          'What do you mean by Cash Flow Statement?',
          'Give the meaning of Flexible Budget.',
        ],
      },
      {
        id: 'B', instruction: 'Answer any Four questions from the following. Each question carries 5 marks.', answer: 4, marksEach: 5,
        questions: [
          'Write any five differences between Financial Accounting and Management Accounting.',
          {
            text: 'From the following information prepare a Common-size Income Statement. (X Ltd. / Y Ltd., Rs.)',
            parts: [
              'Sales 10,00,000 / 8,00,000; Less: Cost of Goods Sold 6,00,000 / 4,00,000; Gross Profit 4,00,000 / 4,00,000',
              'Less: Operating Expenses 2,00,000 / 1,40,000; Operating Profit 2,00,000 / 2,60,000; Add: Non-operating Income 40,000 / 20,000 → 2,40,000 / 2,80,000',
              'Less: Tax (50% on profit) 1,20,000 / 1,40,000; Net Profit 1,20,000 / 1,40,000',
            ],
          },
          'The following information is available relating to a company: Bills payable on 1/4/25 Rs. 3,00,000; Creditors on 1/4/25 Rs. 2,50,000; Bills payable on 31/3/26 Rs. 3,50,000; Creditors on 31/3/26 Rs. 3,00,000; Credit purchases for the year Rs. 60,00,000. Calculate Creditors Turnover Ratio and Average Payment Period.',
          'ABC Ltd. gives the following information regarding the manufacture of a commodity. The actual production during the period was 60,000 units. Raw material Rs. 2.52 per unit; Direct labour Rs. 0.75 per unit; Direct expenses Rs. 0.10 per unit; Works overhead (60% fixed) Rs. 2.50 per unit; Administration overhead (80% fixed) Rs. 0.40 per unit; Selling overhead (50% fixed) Rs. 0.20 per unit. Prepare a Flexible Budget for production of 1,00,000 units.',
          {
            text: 'Prepare a cash flow statement on the basis of the information given in the Balance Sheet of CJ Ltd. as on 31/3/25 and 31/3/26. (Rs., 2025 / 2026.)',
            parts: [
              'Liabilities: Share capital 2,00,000 / 2,50,000; 12% Debentures 1,00,000 / 80,000; General Reserve 50,000 / 70,000; Creditors 40,000 / 60,000; Bills payable 20,000 / 1,00,000; Outstanding expenses 25,000 / 20,000. Total 4,35,000 / 5,80,000.',
              'Assets: Goodwill 10,000 / 2,000; Land & Building 2,00,000 / 2,80,000; Machinery 1,00,000 / 1,30,000; Debtors 40,000 / 60,000; Stock 70,000 / 90,000; Cash 15,000 / 18,000. Total 4,35,000 / 5,80,000.',
            ],
          },
        ],
      },
      {
        id: 'C', instruction: 'Answer any Two questions from the following. Each question carries 12 marks.', answer: 2, marksEach: 12,
        questions: [
          {
            text: 'The following is the Balance Sheet of M Ltd. as on 31-3-25 and 31-3-26. Prepare a comparative balance sheet and give your comments. (Rs., 2025 / 2026.)',
            parts: [
              'Liabilities: Equity capital 1,00,000 / 1,65,000; Preference share capital 50,000 / 75,000; General Reserve 17,500 / 25,000; Bank Overdraft 25,000 / 25,000; Creditors 20,000 / 25,000; Provision for Tax 17,500 / 25,000. Total 2,30,000 / 3,40,000.',
              'Assets: Fixed Assets 1,20,000 / 1,75,000; Inventory 20,000 / 25,000; Debtors 50,000 / 62,500; Bills Receivable 10,000 / 30,000; Cash 20,000 / 26,500; Bank 5,000 / 15,000; Prepaid expenses 5,000 / 6,000. Total 2,30,000 / 3,40,000.',
            ],
          },
          {
            text: 'The following are the summarised Balance Sheets of Jayanth Ltd. for the years ended 31st March 2025 and 2026. Prepare a Cash Flow Statement. (Rs., 2025 / 2026.)',
            parts: [
              'Liabilities: Share capital 3,00,000 / 4,00,000; Preference share capital 1,50,000 / 1,00,000; General Reserve 40,000 / 70,000; P & L A/c 30,000 / 48,000; Proposed dividend 42,000 / 50,000; Creditors 55,000 / 83,000; Bills payable 20,000 / 16,000; Provision for Tax 40,000 / 50,000. Total 6,77,000 / 8,17,000.',
              'Assets: Goodwill 1,15,000 / 90,000; Land & Building 2,00,000 / 1,70,000; Plant 80,000 / 2,00,000; Debtors 1,60,000 / 2,00,000; Stock 77,000 / 1,09,000; Bills receivable 20,000 / 30,000; Cash 15,000 / 10,000; Bank 10,000 / 8,000. Total 6,77,000 / 8,17,000.',
              'Additional information: (a) Depreciation on land and building Rs. 20,000 and on plant Rs. 10,000 was charged during the year. (b) Dividend paid during the year Rs. 20,000. (c) Income tax paid during the year Rs. 35,000.',
            ],
          },
          {
            text: 'A company has an opening cash balance of Rs. 37,500 on 1st April 2026. From the following information prepare a Cash Budget for the three months April–June 2026. (Rs.: Sales; Purchases; Wages; Overheads.)',
            parts: [
              'February — 75,000; 45,000; 9,000; 18,000',
              'March — 84,000; 48,000; 9,750; 18,750',
              'April — 90,000; 52,500; 10,500; 20,250',
              'May — 1,20,000; 60,000; 13,500; 23,820',
              'June — 1,35,000; 60,000; 14,250; 28,000',
              'Other information: (a) Period of credit allowed by suppliers — 2 months. (b) 20% of the sales are for cash; the period of credit allowed to customers for credit sales is 1 month. (c) Delay in payment of all expenses is 1 month. (d) Income tax of Rs. 57,500 is due in June 2026. (e) The company is to pay a dividend to shareholders and a bonus to workers of Rs. 15,000 and Rs. 22,500 respectively in the month of April.',
            ],
          },
        ],
      },
      {
        id: 'D', instruction: 'Answer any One question from the following. The question carries 6 marks.', answer: 1, marksEach: 6,
        questions: [
          'Prepare a trend analysis statement for three years with imaginary figures.',
          'Prepare a flexible budget with imaginary figures.',
        ],
      },
    ],
    prepSubjectId: 'bba-karnataka-mgmt-accounting',
    source: { title: 'VI Semester B.Com question papers, May–July 2026 (bundle)', url: 'https://www.cicms.in/uploads/quastion-papers/bcom/6th-semester/2026-6th-sem-BCOM.pdf', publisher: 'CIMS B-School, Bengaluru (BCU-affiliated college)', retrievedOn: '2026-09-25' },
  },
  {
    id: 'bcu-bcom-6-income-tax-law-and-practice-ii-2026-06',
    program: 'bcom',
    university: 'bcu',
    scheme: 'NEP scheme (Freshers and Repeaters)',
    semester: 6,
    subject: 'Income Tax Law and Practice II',
    subjectArea: 'Taxation',
    paperNumber: '6.2',
    examMonth: 'June/July',
    examYear: 2026,
    durationMinutes: 150,
    maxMarks: 60,
    instructions: ['Answers should be written in English only.'],
    sections: [
      {
        id: 'A', instruction: 'Answer any Five of the following sub-questions. Each sub-question carries Two marks.', answer: 5, marksEach: 2, subLabels: true,
        questions: [
          'Define profession.',
          'Mention any two donations that are exempted at 100% of contribution u/s 80G.',
          'What is short-term capital gain?',
          'State any two casual incomes.',
          'Give the meaning of intra-head set off.',
          'Write the meaning of set off and carry forward of losses.',
          'List any two personal assets.',
        ],
      },
      {
        id: 'B', instruction: 'Answer any Four of the following questions. Each question carries Five marks.', answer: 4, marksEach: 5,
        questions: [
          {
            text: 'Sri Nani furnishes the following particulars of income for the previous year 2024-25. Compute income from other sources.',
            parts: ['(a) Received a gift of Rs. 51,000 from his father', '(b) Received a gift of Rs. 61,000 from his friend', '(c) Investment of Rs. 50,000 in 12% tax-free Karnataka Government Securities', '(d) Income from undisclosed sources Rs. 10,000', '(e) Dividends on preference shares Rs. 3,200'],
          },
          {
            text: 'Smt. Sharada sells the following assets during the financial year 2024-25. Compute her taxable Capital Gain for the AY 2025-26.',
            parts: [
              '(a) A gold ornament acquired on 10-05-2023 for Rs. 2,00,000, on which she spent Rs. 20,000 for improvement. On 01-02-2025, due to a family emergency, she sold the ornament for Rs. 3,10,000.',
              '(b) Land purchased on 10-05-2023 for Rs. 50,50,000 and sold on 01-02-2025 for Rs. 70,00,000. She paid a commission of 1% on the sale price.',
            ],
          },
          { text: 'Write short notes on the following:', parts: ['(a) Set off and carry forward of Business Loss', '(b) Set off and carry forward of Loss from House Property'] },
          {
            text: 'Sri Ranga provides you with the following information. Calculate total income for AY 2025-26.',
            parts: [
              '(a) Income from Salary (computed) Rs. 6,00,000',
              '(b) Income from Profession (computed) Rs. 6,00,000',
              '(c) Contribution to RPF Rs. 24,000 and tuition fee Rs. 12,000',
              '(d) Payment of life insurance premium Rs. 30,000 and medical insurance premium on the entire family (self, spouse and children) Rs. 20,000',
              "(e) Donation to the Swachh Bharat Kosh Rs. 10,000 and to the Prime Minister's National Relief Fund Rs. 20,000",
            ],
          },
          {
            text: 'From the following details, identify the total amount of admissible and inadmissible expenses. (Two amounts are not legible in the scanned copy and are marked accordingly.)',
            parts: [
              'Salaries Rs. 50,000; Donation to the temple Rs. 5,000; Provision for bad debts (amount not legible); Patents purchased Rs. 10,000; Excess depreciation (amount not legible); Payment of house rent Rs. 50,000; Computer purchased Rs. 20,000; Audit fees Rs. 20,000; Provision for taxation Rs. 10,000; Interest on capital Rs. 10,000.',
            ],
          },
        ],
      },
      {
        id: 'C', instruction: 'Answer any Two of the following questions. Each question carries Twelve marks.', answer: 2, marksEach: 12,
        questions: [
          {
            text: 'Sri Ram, a trader, furnishes the following information for the year ending 31-03-2025 (ignore the new tax regime). Compute taxable income from business for the AY 2025-26.',
            parts: [
              'Debits (Rs.): General expenses 4,80,000; Salary of staff 2,40,000; Salary to Ram 1,20,000; Interest on capital 60,000; Interest on overdraft 40,000; Extension of building 1,50,000; Interest on loan 40,000; Depreciation 1,20,000; Travelling expenses 80,000; Audit fees 72,000; Fire insurance 78,000; Bonus to staff 1,00,000; Contribution to RPF of employees 1,22,000; Advertisement 2,00,000; Reserve for bad debts 60,000; Bad debts written off 90,000; Net Profit 3,48,000. Total 24,00,000.',
              'Credits (Rs.): Gross Profit 22,00,000; Commission 40,000; Bad debts recovered (earlier allowed) 60,000; Interest on listed debentures 1,00,000. Total 24,00,000.',
              'Additional information: (a) Depreciation allowable as per IT rules Rs. 1,40,000. (b) Income of Rs. 60,000 accrued in the previous year was not entered in the P&L Account. (c) The loan was borrowed for business purposes. (d) General expenses include the salary of Rs. 40,000 paid to a domestic servant.',
            ],
          },
          {
            text: 'Sri Naik is a Chartered Accountant and provides you with the following Receipts and Payments for the year ending 31-03-2025 (ignore the new tax regime). Compute his income from profession.',
            parts: [
              'Receipts (Rs.): Balance b/d 20,000; Audit fees 3,00,000; Financial consultancy service 60,000; Interest on bank deposits 22,000; Dividends on units of UTI 6,000; Accountancy works 32,000. Total 4,40,000.',
              'Payments (Rs.): Office rent 1,33,000; Salary to staff 75,000; Telephone expenses 10,000; Electricity & water 28,000; Charities 15,000; Gifts to relatives 6,000; Subscription to journals 10,400; Computer purchased 70,000; Car expenses 24,000; Office expenses 20,000; Household expenses 8,600; Balance c/d 40,000. Total 4,40,000.',
              "Additional information: (a) The car is used equally for official and personal purposes. (b) Depreciation on the car for official work is Rs. 500, and on the computer it is 40%. (c) Rs. 1,000 is paid towards the domestic servant's salary and is included in the staff salary.",
            ],
          },
          {
            text: 'Smt. Srikala provides the following income. You are required to compute income from other sources for the PY 2024-25 (ignore the new regime).',
            parts: [
              '(a) Interest on FD in a bank Rs. 14,000',
              '(b) University remuneration for working as an examiner Rs. 6,000',
              '(c) Royalty earned from writing books Rs. 22,000; she claims to have spent Rs. 2,000 on writing the books',
              '(d) Dividends received (gross) Rs. 6,000',
              '(e) Winnings received from horse race (net) Rs. 2,10,000',
              '(f) Investment in 12% Rs. 50,000 debentures (listed) of Gennext Coffee Company',
              '(g) Interest on National Development Bonds Rs. 5,000',
              '(h) Family pension received Rs. 36,000',
            ],
          },
        ],
      },
      {
        id: 'D', instruction: 'Answer any One of the following questions. This question carries Six marks.', answer: 1, marksEach: 6,
        questions: [
          'Mention the procedure involved in the computation of income from a profession.',
          'List any six deductions available under section 80 for individual assessees.',
        ],
      },
    ],
    prepSubjectId: 'bba-karnataka-income-tax-2',
    source: { title: 'VI Semester B.Com question papers, May–July 2026 (bundle)', url: 'https://www.cicms.in/uploads/quastion-papers/bcom/6th-semester/2026-6th-sem-BCOM.pdf', publisher: 'CIMS B-School, Bengaluru (BCU-affiliated college)', retrievedOn: '2026-09-25' },
  },
  {
    id: 'bcu-bcom-6-advanced-financial-management-2026-05',
    program: 'bcom',
    university: 'bcu',
    scheme: 'NEP scheme (F+R)',
    semester: 6,
    subject: 'Advanced Financial Management',
    subjectArea: 'Finance',
    paperCode: 'DCBC603',
    paperNumber: 'Com 6.3',
    examMonth: 'May/June',
    examYear: 2026,
    durationMinutes: 150,
    maxMarks: 60,
    instructions: ['All answers should be written in English only.'],
    sections: [
      {
        id: 'A', instruction: 'Answer any Five of the following sub-questions. Each sub-question carries 2 marks.', answer: 5, marksEach: 2, subLabels: true,
        questions: [
          'Give the meaning of cost of capital.',
          'What is sensitivity analysis?',
          'What is financial risk?',
          'If EBIT (operating profit) is Rs. 1,50,000, cost of debt (Kd) is 8%, cost of equity (Ke) is 12% and overall cost of capital (Ko) is 10%, calculate the value of the firm under the NOI approach.',
          'Name the elements of inventory.',
          "State any four assumptions of Gordon's approach.",
          'What do you mean by Dividend decision?',
        ],
      },
      {
        id: 'B', instruction: 'Answer any Four of the following questions. Each question carries 5 marks.', answer: 4, marksEach: 5,
        questions: [
          'Explain the irrelevance concept of capital structure as per the MM approach.',
          'Explain the various techniques of measuring risk.',
          'Given the following information — ABC Co. Ltd.: EBIT Rs. 2,50,000; 14% Debentures Rs. 7,00,000; Tax rate 40%; Cost of equity capital (Ke) 18%. XYZ Co. Ltd.: EBIT Rs. 2,50,000; no debentures; Tax rate 40%; Ke 18%. Compute the value of ABC Co. Ltd. and XYZ Co. Ltd. using the Net Income (NI) approach.',
          'ABC and Co. is considering a project which costs Rs. 70,000. The cash inflows are: Year 1 Rs. 50,000; Year 2 Rs. 40,000; Year 3 Rs. 30,000; Year 4 Rs. 20,000. The risk-free discount rate is 10%; calculate the NPV. Discount factors at 10%: year 1 — 0.9091, year 2 — 0.8264, year 3 — 0.7513, year 4 — 0.6830.',
          'Prestige Ltd. provides the following information: Opening receivables Rs. 5,00,000; Ending receivables Rs. 1,00,000; Credit sales Rs. 50,00,000; Sales returns Rs. 10,00,000; Period analysed 365 days. Determine the Debtors Turnover Ratio (DTR) and Average Collection Period (ACP).',
        ],
      },
      {
        id: 'C', instruction: 'Answer any Two of the following questions. Each question carries 12 marks.', answer: 2, marksEach: 12,
        questions: [
          {
            text: 'The capital structure of Sharath Co. Ltd. comprises the following securities. Calculate the WACC using (a) book value weights and (b) market value weights. (Book value / Market value / Specific cost.)',
            parts: [
              'Preference share capital — Rs. 2,50,000 / Rs. 2,75,000 / 8%',
              'Equity share capital — Rs. 15,00,000 / Rs. 22,50,000 / 15%',
              'Retained earnings — Rs. 5,00,000 / Rs. 6,25,000 / 13%',
              'Debentures — Rs. 10,00,000 / Rs. 8,50,000 / 5%',
            ],
          },
          "The earnings per share of a company is Rs. 8 and the rate of capitalisation applicable to the company is 10%. The company has the option of adopting a dividend payout ratio of (a) 25% or (b) 50% or (c) 75%. Using Walter's formula of dividend payout, compute the market value of the company's share if the internal rate of return is (a) 15% and (b) 10%.",
          'What are Accounts Receivable? Explain the factors influencing the size of receivables.',
        ],
      },
      {
        id: 'D', instruction: 'Answer any One of the following questions. This question carries 6 marks.', answer: 1, marksEach: 6,
        questions: [
          'List any six inventory techniques.',
          'Calculate the different ratios under receivables management using imaginary figures.',
        ],
      },
    ],
    prepSubjectId: 'bba-karnataka-fin-mgmt',
    source: { title: 'VI Semester B.Com question papers, May–July 2026 (bundle)', url: 'https://www.cicms.in/uploads/quastion-papers/bcom/6th-semester/2026-6th-sem-BCOM.pdf', publisher: 'CIMS B-School, Bengaluru (BCU-affiliated college)', retrievedOn: '2026-09-25' },
  },
  {
    id: 'bcu-bcom-6-assessment-of-persons-other-than-individuals-2026-06',
    program: 'bcom',
    university: 'bcu',
    scheme: 'NEP scheme (Freshers and Repeaters)',
    semester: 6,
    subject: 'Assessment of Persons Other Than Individuals and Filing of ITRs (Vocational)',
    subjectArea: 'Taxation',
    paperCode: 'DVBC609',
    paperNumber: 'COM 6.6(a)',
    examMonth: 'June/July',
    examYear: 2026,
    durationMinutes: 150,
    maxMarks: 60,
    instructions: ['Answers should be written completely in English only.'],
    sections: [
      {
        id: 'A', instruction: 'Answer any Five questions. Each question carries 2 marks.', answer: 5, marksEach: 2, subLabels: true,
        questions: [
          'What is meant by Block of Assets?',
          'Write the meaning of closely held company.',
          'What is E-Filing?',
          'Mention any four types of Assessments.',
          'What is a Partnership Deed?',
          'Mention any two advantages of TDS.',
          'What is a defective return?',
        ],
      },
      {
        id: 'B', instruction: 'Answer any Four questions. Each question carries 5 marks.', answer: 4, marksEach: 5,
        questions: [
          'Briefly explain the benefits of filing Income Tax Returns.',
          'A Block of Assets consisting of 3 machines had a total WDV of Rs. 4,00,000 on 1/4/2024. On 2/6/2024 one of the 3 units, having a WDV of Rs. 40,000 on 1/4/2024, was sold for Rs. 52,000. On 1/11/2024 a new machine was purchased at a cost of Rs. 90,000. All the machines fall under the 15% p.a. depreciation block. Calculate the normal and additional depreciation for the previous year 2024-25.',
          "An employee gets a gross salary of Rs. 32,00,000 and the eligible deduction u/s 80C is Rs. 1,00,000. Calculate the TDS to be made per month by the employer from the employee's salary for the PY 2024-25 under the old tax regime.",
          'The net profit of a partnership firm for the previous year ended 31/3/2025 was Rs. 16,40,000 after charging the following: (a) Salary of partners Rs. 3,60,000; (b) Interest on capital Rs. 1,50,000 @ 15% p.a.; (c) Commission to partners Rs. 50,000. Calculate the eligible remuneration to partners.',
          {
            text: 'State whether the following are allowable or not allowable while computing taxable business income:',
            parts: ['(a) Drawings of partners Rs. 20,000', '(b) Renovation expenses of building', '(c) Advance income tax paid', '(d) Holiday home maintenance expenses', '(e) Contribution to the URPF of employees by the employer'],
          },
        ],
      },
      {
        id: 'C', instruction: 'Answer any TWO questions. Each question carries 12 marks.', answer: 2, marksEach: 12,
        questions: [
          {
            text: 'Calculate the TDS to be made in respect of the following transactions:',
            parts: [
              '(a) Rs. 45,000 paid to Mr. Muni Reddy, a building contractor',
              '(b) Rs. 80,00,000 paid for the purchase of goods',
              '(c) Rs. 20,00,000 paid by LIC on the maturity of a policy on 1/1/2025',
              '(d) An urban property was given for joint development and Rs. 15,00,000 was received as consideration',
              '(e) Consultation fee paid to a doctor Rs. 12,000',
              '(f) Dividend received Rs. 4,500',
              '(g) Interest on fixed deposits with a bank received by a senior citizen Rs. 45,000 for the PY 2024-25',
              '(h) Commission on lottery tickets of Rs. 10,000',
            ],
          },
          {
            text: 'P, Q and R are partners in a firm sharing profits and losses equally. Their Profit and Loss Account for the year ended 31/3/2025 was as follows. Calculate the tax liability of the firm for the PY 2024-25 (ignore the new regime).',
            parts: [
              'Debits (Rs.): Office expenses 14,00,000; Depreciation 2,50,000; Rent and rates 2,50,000; Income tax 1,00,000; Provision for bad debts 50,000; Salary to partners (P 1,20,000, Q 1,20,000, R 1,20,000) 3,60,000; Interest on capital (P 18,000 @ 18%, Q 15,000 @ 15%, R 20,000 @ 10%) 53,000; Other expenses 37,000; Net profit 15,00,000. Total 40,00,000.',
              'Credits (Rs.): Gross profit 35,00,000; Interest (gross) 1,00,000; Refund of GST 2,00,000; Lottery earnings (gross) 2,00,000. Total 40,00,000.',
              'Other information: (a) Depreciation as per I.T. provisions Rs. 2,00,000. (b) Office expenses include Rs. 1,20,000 which are disallowable. (c) Other expenses include Rs. 5,000 donations to institutions recognised under section 80G of the I.T. Act.',
            ],
          },
          {
            text: 'The following is the Profit and Loss Account of BX Ltd. for the year ended 31/3/2025. Calculate (a) Normal tax, (b) MAT u/s 115JB, (c) Ultimate tax liability (ignore the new tax regime).',
            parts: [
              'Debits (Rs.): Salaries and allowances 9,00,000; Office expenses 2,00,000; Audit fee 75,000; I.T. paid 1,25,000; Depreciation 1,00,000; General reserve 50,000; Dividends 80,000; Losses of subsidiary 70,000; Net profit 12,00,000. Total 28,00,000.',
              'Credits (Rs.): Gross profit 28,00,000.',
              'Other information: (i) Depreciation as per I.T. provisions Rs. 1,50,000. (ii) Brought-forward losses: as per I.T. Rs. 1,00,000, as per books Rs. 1,50,000; Unabsorbed depreciation: as per I.T. Rs. 50,000, as per books Rs. 75,000.',
            ],
          },
        ],
      },
      {
        id: 'D', instruction: 'Answer any One question, which carries Six marks.', answer: 1, marksEach: 6,
        questions: [
          'Prepare a chart showing the depreciation rates of different assets.',
          'Narrate the procedure for calculating the book profit of a company.',
        ],
      },
    ],
    prepSubjectId: 'bba-karnataka-income-tax-2',
    source: { title: 'VI Semester B.Com question papers, May–July 2026 (bundle)', url: 'https://www.cicms.in/uploads/quastion-papers/bcom/6th-semester/2026-6th-sem-BCOM.pdf', publisher: 'CIMS B-School, Bengaluru (BCU-affiliated college)', retrievedOn: '2026-09-25', note: 'Two-column scan; tables re-flowed into rows and totals cross-checked arithmetically.' },
  },
]
