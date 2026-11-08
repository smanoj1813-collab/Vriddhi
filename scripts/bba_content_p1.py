# -*- coding: utf-8 -*-
"""Content batch 1: the Semester 3-6 topics listed by the user (35 topics)."""

CONTENT = {

'cost-mod3-material-labour-overheads': ('''# Material, Labour & Overheads Costing

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

![Material Labour Overheads Diagram](material-labour-overheads.png)''',
 [('Re-order level', 'ROL = Minimum stock + (Normal usage x Lead time)', 'Min stock 200 units, usage 50/day, lead 6 days. Find ROL.', 'ROL = 200 + (50 x 6) = 500 units.'),
  ('Halsey premium', 'Earnings = (Time taken x Rate) + (50% x Time saved x Rate)', 'Job allows 10 hrs at Rs 20/hr; done in 8 hrs.', 'Earnings = (8 x 20) + (0.5 x 2 x 20) = Rs 180.')],
 [('Stock level shortcut', 'Min = ROL minus lead-time usage; Max = Min + Re-order quantity.', 'Quick stock-level problems.'),
  ('Overhead absorption', 'Machine Hour Rate = (Standing charges + Running charges) / Machine hours.', 'When machine-intensive departments dominate.')],
 '''Step 1: compute material cost using the given issue-price method. Step 2: compute wages (time or piece rate; add Halsey/Rowan premium if asked). Step 3: allocate overheads: primary to departments on fair bases (area, headcount, machine hours), then secondary redistribution. Step 4: absorb into products via machine hour rate or labour percentage. Present a cost sheet showing prime cost, works cost, cost of production.'''),

'cost-mod5-variance-analysis-budgetary-control': ('''# Variance Analysis & Budgetary Control

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

![Variance Analysis Diagram](variance-analysis.png)''',
 [('Material cost variance', 'MCV = (SQ x SP) minus (AQ x AP)', 'SQ 100 kg @ Rs 10; used 110 kg @ Rs 9.', 'Std cost Rs 1,000 minus Actual Rs 990 = Rs 10 (F).'),
  ('Labour efficiency variance', 'LEV = (Standard hours minus Actual hours) x Std rate', 'Std 500 hrs, actual 520 hrs, rate Rs 20/hr.', 'LEV = (500 minus 520) x 20 = Rs 400 (A).')],
 [('Sign convention', 'Compute always as Standard minus Actual; positive is favourable.', 'Avoids sign confusion in exams.'),
  ('Mix vs Yield', 'Mix variance = total actual qty x (Revised std mix minus Actual mix) prices; Yield = (Std output minus Actual output) x Std cost/unit.', 'Multi-material problems.')],
 '''Step 1: write Std and Actual quantities and prices in two columns. Step 2: compute the total (cost/rate) variance first. Step 3: split into price and usage/efficiency variances using the standard formulas. Step 4: where materials are mixed, compute revised standard mix, then Mix and Yield. Step 5: check that sub-variances reconcile to the total. Label every answer F or A.'''),

'stats-mod1-collection-classification-presentation': ('''# Collection, Classification & Presentation of Data

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

![Data Presentation Diagram](data-presentation.png)''',
 [('Pie chart angle', 'Angle = (Component value / Total value) x 360 degrees', 'Component Rs 6,000 of total Rs 24,000.', 'Angle = (6000/24000) x 360 = 90 degrees.'),
  ('Class mid-point', 'Mid-point = (Lower limit + Upper limit) / 2', 'Class 20-30.', 'Mid-point = (20 + 30) / 2 = 25.')],
 [('Ogive reads median', 'Median = x-value where the cumulative curve crosses N/2.', 'Quick median from a graph.'),
  ('Exclusive classes', '20-30, 30-40: upper limit belongs to the next class; use continuity before drawing histograms.', 'Converting inclusive to exclusive classes.')],
 '''Step 1: identify data type (primary/secondary, discrete/continuous). Step 2: decide class width and form a frequency distribution (exclusive classes). Step 3: compute mid-points and cumulative frequencies. Step 4: choose the diagram: histogram for distribution shape, ogive for percentiles, pie for composition. Step 5: read values from the diagram as asked (median from ogive, mode from histogram peak).'''),

'stats-mod4-time-series-analysis': ('''# Time Series Analysis

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

![Time Series Diagram](time-series.png)''',
 [('Least squares trend', 'Y = A + B X, with Sum(Y) = nA + B Sum(X) and Sum(XY) = A Sum(X) + B Sum(X squared)', 'Years 2021-2025 with odd number of years, coded X = -2,-1,0,1,2.', 'Sum(X) = 0 gives A = Sum(Y)/n and B = Sum(XY)/Sum(X squared) directly.'),
  ('Simple moving average', 'MA of 3 years = (Y1 + Y2 + Y3) / 3', 'Sales 100, 120, 140.', 'MA = 120.')],
 [('Shift the origin', 'With coded years Sum(X) = 0, the normal equations collapse to one-line answers.', 'Saves 5 minutes in exams.'),
  ('Odd period MA', 'Centre the moving average on the middle period; even periods need a second centring step.', 'Quarterly data (4-period MA).')],
 '''Step 1: code years (X = -2,-1,0,1,2 for 5 years). Step 2: compute Sum(Y), Sum(XY), Sum(X squared). Step 3: write the trend line Y = A + B X and estimate for the required year. For seasonal indices: step 4: compute link relatives (current / previous x 100), average by period, then scale so the mean index = 100.'''),

'stats-mod5-index-numbers': ('''# Index Numbers

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

![Index Numbers Diagram](index-numbers.png)''',
 [('Laspeyres index', 'L = Sum(P1 x Q0) / Sum(P0 x Q0) x 100', 'P0: Rs 10, Q0: 5; P1: Rs 12.', 'L = (12 x 5) / (10 x 5) x 100 = 120.'),
  ('Fisher ideal index', 'F = Square root of (Laspeyres x Paasche)', 'L = 120, P = 115.', 'F = Square root of (120 x 115) = 117.5.')],
 [('Price relative shortcut', 'Index = Sum of (P1/P0 x 100) divided by n when weights are absent.', 'Unweighted questions are one-liners.'),
  ('Real income', 'Real wage index = Money wage index / Price index x 100.', 'Cost-of-living adjustment problems.')],
 '''Step 1: tabulate P0, P1, Q0, Q1. Step 2: choose the formula: unweighted (relatives), Laspeyres (base weights), Paasche (current weights), Fisher (both). Step 3: compute the numerator and denominator totals separately, divide, multiply by 100. Step 4: check the result against the tests if asked (time reversal: swap 0 and 1; the product of the two indices should be 10000).'''),

'fm-mod1-indian-financial-system': ('''# Indian Financial System: Structure & Components

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

![Indian Financial System Diagram](financial-system.png)''',
 [('Financial intermediation', 'Net funds mobilised = Deposits/borrowings minus Idle cash and reserves', 'Bank deposits Rs 500 cr, reserves Rs 50 cr.', 'Deployable funds = Rs 450 cr.'),
  ('Savings rate', 'Gross savings rate = Gross savings / GDP x 100', 'Savings Rs 80 cr, GDP Rs 400 cr.', 'Rate = 20%.')],
 [('Regulator map', 'RBI banks, SEBI securities, IRDAI insurance, PFRDA pensions: one line each.', 'MCQ-heavy section.'),
  ('Direct vs indirect', 'Direct: securities sold to savers (IPO). Indirect: bank sits in between (FD).', 'Short-answer distinction.')],
 '''Step 1: classify the item asked as institution, market, instrument or service. Step 2: name the regulator and its instrument (repo rate, CRR for RBI; margin rules for SEBI). Step 3: for flow-of-funds problems, draw the saver-intermediary-borrower chain and compute net mobilisation. Step 4: write a short reform/current-context note (UPI, IBC) for full marks.'''),

'fm-mod3-capital-market-instruments': ('''# Capital Market: Instruments & Functioning

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

![Capital Market Diagram](capital-market.png)''',
 [('Rights issue value', 'Theoretical ex-rights price = (Old shares x Market price + New shares x Issue price) / Total shares', '1,000 shares at Rs 120; 200 new at Rs 100.', 'TERP = (120000 + 20000) / 1200 = Rs 116.67.'),
  ('Bond price', 'Price = Interest x PV annuity factor + Redemption x PV factor', 'Rs 100 bond, 10% coupon, 2 yrs, 12% discount rate.', 'Price = 10 x 1.690 + 100 x 0.797 = Rs 96.6.')],
 [('Book building band', 'Floor price = minimum, cap price = maximum; discovered by demand at each price band.', 'IPO pricing MCQs.'),
  ('Demat basics', 'Shares held electronically via depository participants; settlement T+1.', 'One-line current-context answers.')],
 '''Step 1: identify primary vs secondary market in the question. Step 2: for pricing problems, draw the cash flows (interest/dividend/redemption). Step 3: discount at the required rate using the given PV factors. Step 4: for rights issues, compute the ex-rights price and the value of a right (TERP minus issue price).'''),

'fm-mod4-sebi-regulations': ('''# SEBI Regulations & Investor Protection

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

![SEBI Investor Protection Diagram](sebi-investor.png)''',
 [('Takeover trigger', 'Open offer required at 25% acquisition; creeping acquisition limit 5% per financial year (25-75% band).', 'Promoter holds 30%, buys 4% more in a year.', 'Within the 5% creeping limit: no open offer.'),
  ('Disgorgement', 'Amount to disgorge = Illegal gains made from the unfair trade practice.', 'Gain Rs 5 cr from manipulation.', 'SEBI orders refund of Rs 5 cr plus interest.')],
 [('SCORES first', 'Any investor grievance question: complain on SCORES before litigation.', 'Practical answer for case studies.'),
  ('Regulation mnemonics', 'LODR listing, PFUTP fraud, ICDR issues, SAST takeovers, PIT insider trading.', 'Match-the-following questions.')],
 '''Step 1: identify the market segment (issue, trading, takeover, grievance). Step 2: name the exact SEBI regulation and the prohibited conduct. Step 3: state the investor protection mechanism (SCORES, IPEF, disgorgement). Step 4: conclude with the penalty SEBI can impose (fine, ban, disgorgement, suspension).'''),

'fm-mod5-money-market-instruments': ('''# Money Market: Instruments & Participants

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

![Money Market Diagram](money-market.png)''',
 [('T-bill price', 'Price = Face value x (1 minus Discount rate x Days / 360)', 'Rs 1,00,000 T-bill, 91 days, 6% discount.', 'Price = 100000 x (1 minus 0.06 x 91/360) = Rs 98,483.'),
  ('Repo rate effect', 'Cost of funds rises when repo rate rises; money market yields track the repo rate.', 'RBI raises repo by 0.5%.', 'Short-term rates rise by roughly 0.5%.')],
 [('Discount math', 'Discount instruments quote yield on a 360-day base: Price = FV minus (FV x r x d/360).', 'All T-bill/CP pricing questions.'),
  ('Liquidity absorption', 'Reverse repo and MSF mop up liquidity; repo and OMO injections add it.', 'Monetary policy MCQs.')],
 '''Step 1: note the instrument, its issuer and maturity bucket. Step 2: for discount instruments compute Price = FV minus discount for the day-count. Step 3: compute the annualised yield = (FV minus Price)/Price x 360/days. Step 4: link to policy: repo rate, reverse repo, MSF, OMO in a short concluding line.'''),

'colaw-mod2-indian-contract-act': ('''# Indian Contract Act 1872: Essentials & Performance

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

![Contract Act Diagram](contract-act.png)''',
 [('Contract = f(essentials)', 'Contract = Valid offer + Acceptance + Consideration + Capacity + Free consent + Lawful object', 'A promises to sell his car to B for Rs 1 lakh; B accepts and pays.', 'All essentials present: valid contract; B can sue for delivery.'),
  ('Damages ceiling', 'Compensation = Loss that arose naturally or was in the contemplation of both parties', 'Seller breaches delivery of a machine needed for a special order disclosed.', 'Loss of disclosed special profit is recoverable.')],
 [('Voidable vs void', 'Voidable: at the option of one party (coerced consent). Void: no legal effect at all (minor agreement).', 'MCQ favourite.'),
  ('Offer vs invitation', 'A price list/advertisement display is an invitation to offer; the customer offers at the counter.', 'Carlill-style problems.')],
 '''Step 1: list the facts as offer, acceptance, consideration, consent, capacity, object. Step 2: test each essential and flag the defect (minor, coercion, public policy). Step 3: conclude: valid, voidable or void agreement. Step 4: if breach is asked, state the remedy and quantify damages under the remoteness rule.'''),

'colaw-mod3-sale-of-goods-act': ('''# Sale of Goods Act 1930

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

![Sale of Goods Diagram](sale-of-goods.png)''',
 [('Price determination', 'Price may be fixed by the contract, determined by a third party, or a reasonable price implied (Section 9)', 'Contract silent on price for goods delivered.', 'Buyer must pay a reasonable price.'),
  ('Unpaid seller lien', 'Lien exists while goods are in possession and the price is unpaid, unless credit was given.', 'Seller holds goods after non-payment.', 'Seller may retain goods until payment.')],
 [('Caveat emptor exceptions', 'Fraud, latent defect not discoverable, fitness-for-purpose reliance on seller.', 'Any consumer-goods problem.'),
  ('Sale vs agreement to sell', 'Sale: property passes now. Agreement to sell: passes on a future condition.', 'Ownership/risk questions.')],
 '''Step 1: classify the goods (specific, unascertained, future) and the contract (sale vs agreement to sell). Step 2: apply the property-passing rules to decide who owns them and bears risk. Step 3: identify the breached term as condition or warranty. Step 4: state the buyer remedy (repudiate + damages, or damages only) and any unpaid seller rights (lien, stoppage, resale).'''),

'colaw-mod4-negotiable-instruments-act': ('''# Negotiable Instruments Act 1881

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

![Negotiable Instruments Diagram](negotiable-instruments.png)''',
 [('Cheque validity', 'Cheque valid for 3 months from the date of issue (RBI rule).', 'Cheque dated 1 Jan.', 'Present by 31 Mar or it becomes stale.'),
  ('Section 138 timeline', 'Demand within 30 days of return; 15 days for payment; complaint within 1 month after.', 'Cheque returned 1 Apr, notice 10 Apr.', 'Drawer must pay by 25 Apr; complaint by 25 May.')],
 [('Maturity computation', 'Bill maturity = sight date + 3 grace days; no grace on demand instruments.', 'Date arithmetic questions.'),
  ('Sans recourse', 'Qualified endorsement excludes the endorser liability on dishonour.', 'Endorsement MCQs.')],
 '''Step 1: identify the instrument and its parties (drawer, drawee, payee, endorser). Step 2: check negotiation requirements: delivery, endorsement, maturity. Step 3: for dishonour, map the Section 138 timeline (30/15/1 month). Step 4: state the remedy: summary prosecution plus a suit for the amount.'''),

'colaw-mod5-consumer-protection-act': ('''# Consumer Protection Act 2019

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

![Consumer Protection Diagram](consumer-protection.png)''',
 [('Pecuniary test', 'District forum: claim up to Rs 50 lakh; State: up to Rs 2 crore; National: above Rs 2 crore', 'Claim of Rs 60 lakh.', 'File before the State Commission.'),
  ('Limitation period', 'Complaint within 2 years from the cause of action (condonable on sufficient cause).', 'Deficiency noticed 1 Jun 2024.', 'Complaint by 1 Jun 2026.')],
 [('CCPA powers', 'CCPA can order recall, refund, and ban misleading advertisements; class complaints on behalf of consumers.', 'Product-safety case studies.'),
  ('E-commerce clause', 'Marketplace must disclose seller details, return policy and grievance officer.', 'Online-shopping questions.')],
 '''Step 1: confirm consumer status (consideration paid, purpose personal use). Step 2: classify the grievance (defect, deficiency, unfair practice, overcharge). Step 3: compute the claim value to fix jurisdiction (District/State/National). Step 4: note limitation (2 years) and relief sought (refund, compensation, removal of defect, punitive damages).'''),

'fm-mngt-mod1-time-value-of-money': ('''# Time Value of Money

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

![Time Value of Money Diagram](break-even-analysis.png)''',
 [('PV of single sum', 'PV = FV / (1 + r)^n', 'FV Rs 10,000 due in 3 years at 10%.', 'PV = 10000 / 1.331 = Rs 7,513.'),
  ('Annuity FV', 'FV = A x ((1 + r)^n minus 1) / r', 'Rs 5,000 saved yearly, 5 years, 8%.', 'FV = 5000 x 5.8666 = Rs 29,333.')],
 [('Rule of 72', 'Doubling years approx 72 / (interest rate in percent).', 'Quick MCQ checks: 8% doubles in about 9 years.'),
  ('Annuity due bump', 'Multiply ordinary annuity result by (1 + r) when payments start at the beginning.', 'Rent/advance-payment problems.')],
 '''Step 1: draw a timeline and mark cash flows with their years. Step 2: identify the pattern: single sum, annuity, perpetuity. Step 3: choose formula (FV for compounding forward, PV for discounting) and select the correct rate per period. Step 4: for mixed streams, value each part and add; for annuity due multiply by (1 + r).'''),

'fm-mngt-mod4-dividend-decision': ('''# Dividend Decision & Working Capital

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

![Dividend and Working Capital Diagram](dividend-working-capital.png)''',
 [('Gordon value', 'P0 = D1 / (k minus g) where g = retention ratio x return on equity', 'D1 = Rs 5, k = 12%, g = 4%.', 'P0 = 5 / 0.08 = Rs 62.5.'),
  ('Working capital need', 'Gross WC = Current assets; Net WC = Current assets minus Current liabilities', 'CA Rs 8 lakh, CL Rs 3 lakh.', 'Net WC = Rs 5 lakh.')],
 [('Operating cycle', 'Cycle days = RM days + WIP days + FG days + Receivable days minus Payable days.', 'Convert to a rupee estimate for the answer.'),
  ('Dividend dates', 'Declaration, record, ex-dividend, payment: value falls on the ex-dividend date.', 'Timeline MCQs.')],
 '''Step 1: for dividend theory questions state the assumptions of each theory before applying. Step 2: compute Gordon value with g = b x r. Step 3: for working capital, draw the operating cycle and convert days to rupees using annual cost/365. Step 4: recommend the policy (conservative/aggressive/moderate) with the liquidity-profitability trade-off.'''),

'fm-mngt-mod5-capital-budgeting': ('''# Capital Budgeting: NPV, IRR & Payback

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

![Capital Budgeting Diagram](break-even-analysis.png)''',
 [('NPV', 'NPV = Sum of [CFt / (1 + r)^t] minus Initial investment', 'Outlay Rs 50,000; inflows Rs 20,000 for 3 yrs at 10%.', 'PV = 20000 x 2.4869 = Rs 49,738; NPV = minus Rs 262.'),
  ('IRR interpolation', 'IRR = r1 + (NPV1 / (NPV1 minus NPV2)) x (r2 minus r1)', 'NPV 10% = +2,000; NPV 12% = minus 500.', 'IRR = 10 + (2000/2500) x 2 = 11.6%.')],
 [('NPV sign check', 'If NPV at the lower rate is positive and at the higher rate is negative, the true IRR lies between them.', 'Interpolation validity check.'),
  ('Depreciation shield', 'Use after-tax cash flows: add back depreciation after taxing profit.', 'Tax-adjusted problems.')],
 '''Step 1: list cash flows year by year (include outlay as negative at year 0). Step 2: compute NPV with the given discount rate using PV factors. Step 3: for IRR pick two rates that bracket zero NPV and interpolate. Step 4: compute payback cumulatively (discounted version: discount each inflow first). Step 5: rank projects; for mutually exclusive choices prefer NPV.'''),

'hrm-mod1-introduction-hrm-functions': ('''# Introduction to HRM & HR Functions

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

![HRM Functions Diagram](hrm-functions.png)''',
 [('HR gap', 'Gap = Forecasted demand minus Projected supply', 'Need 120 staff, supply 90.', 'Gap = 30; recruit or redeploy 30.'),
  ('Cost per hire', 'Cost per hire = Total recruitment cost / Number of hires', 'Spend Rs 2 lakh, 20 hires.', 'Rs 10,000 per hire.')],
 [('Job analysis twin', 'Job description = duties of the job; job specification = qualities of the person.', 'Classic 2-mark distinction.'),
  ('HR planning order', 'Forecast demand, forecast supply, compare gap, plan action, monitor.', 'Process questions earn steps marks.')],
 '''Step 1: define HRM and contrast it with personnel management. Step 2: list the five functional areas with one-line examples. Step 3: for scenario questions, apply the correct concept (recruitment vs selection, description vs specification). Step 4: quantify any planning problem (demand minus supply gap) and close with the strategic HRM angle.'''),

'hrm-mod3-training-development': ('''# Training & Development

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

![Training and Development Diagram](training-development.png)''',
 [('Training ROI', 'ROI = (Monetary benefit minus Training cost) / Training cost x 100', 'Benefit Rs 5 lakh, cost Rs 2 lakh.', 'ROI = (5L minus 2L)/2L x 100 = 150%.'),
  ('Kirkpatrick order', '4 levels: Reaction, Learning, Behaviour, Results (RLBR)', 'Evaluate a program that cost Rs 1 lakh.', 'Check satisfaction first, then skill gain, then workplace behaviour, then output/ROI.')],
 [('Vestibule = replica', 'Vestibule training uses a replica of the work station off the floor.', 'Method-matching MCQs.'),
  ('ADDIE', 'Analysis, Design, Development, Implementation, Evaluation: the training design cycle.', 'Process questions.')],
 '''Step 1: diagnose the training need at three levels (organisation/task/individual). Step 2: choose method: on-the-job for procedural skills, off-the-job for conceptual/managerial skills. Step 3: design objectives and content. Step 4: evaluate with Kirkpatrick levels and compute ROI if numbers are given.'''),

'hrm-mod4-compensation-benefits': ('''# Compensation & Benefits

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

![Compensation and Benefits Diagram](compensation-benefits.png)''',
 [('Gratuity', 'Gratuity = (Last basic + DA) / 26 x 15 x Years of service', 'Basic+DA Rs 26,000/month, 10 years.', 'Gratuity = 1000 x 15 x 10 = Rs 1,50,000.'),
  ('Dearness allowance', 'DA = Basic x DA percentage / 100', 'Basic Rs 20,000, DA 42%.', 'DA = Rs 8,400; total = Rs 28,400.')],
 [('Point method winner', 'Point-rating is the most widely used job evaluation method (quantitative, comparable).', 'Method MCQs.'),
  ('Bonus floor', 'Statutory bonus: minimum 8.33%, maximum 20% of wages (Payment of Bonus Act).', 'Compliance questions.')],
 '''Step 1: break the pay package into direct and indirect components. Step 2: compute statutory items: PF on basic+DA, gratuity formula, bonus range. Step 3: for job evaluation, name the method and one merit/demerit. Step 4: end with equity: internal (same job, same pay) and external (market benchmark).'''),

'hrm-mod5-employee-relations-retention': ('''# Employee Relations & Retention

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

![Employee Relations Diagram](employee-relations.png)''',
 [('Turnover cost', 'Cost of turnover = Replacement + Training + Lost productivity cost', 'Replacement Rs 50k, training Rs 30k, productivity loss Rs 20k.', 'Total = Rs 1 lakh per exit.'),
  ('Retrenchment condition', 'Retrenchment needs 1 month notice plus 15 days wages per year of service (Section 25F).', 'Worker on Rs 30,000, 8 years.', 'Notice + gratuity-style compensation = 15/30 x 30,000 x 8 = Rs 1,20,000.')],
 [('Participation ladder', 'Works committee (grievances) to JMC (policy) to worker director (board): rising involvement.', 'Match the level to the body.'),
  ('eNPS', 'eNPS = % promoters minus % detractors from engagement surveys.', 'Retention metric questions.')],
 '''Step 1: classify the issue: grievance, dispute, or turnover problem. Step 2: for disputes, walk the legal route (conciliation, arbitration, adjudication) with the correct body. Step 3: for retention, compute the cost of losing an employee and recommend two evidence-based interventions. Step 4: close with the participative mechanism that fits the scenario.'''),

'mgmt-mod1-financial-statement-analysis': ('''# Financial Statement Analysis

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

![Ratio Analysis Diagram](ratio-analysis.png)''',
 [('Current ratio', 'CR = Current assets / Current liabilities', 'CA Rs 6 lakh, CL Rs 3 lakh.', 'CR = 2:1.'),
  ('ROE', 'ROE = PAT / Shareholders equity x 100', 'PAT Rs 2 lakh, equity Rs 10 lakh.', 'ROE = 20%.')],
 [('DuPont view', 'ROE = Net margin x Asset turnover x Equity multiplier.', 'Decomposition questions.'),
  ('Window dressing', 'Year-end CA/CL shifts can flatter ratios; read 2 years together.', 'Analytical answers earn marks.')],
 '''Step 1: pick the ratio family asked (liquidity/solvency/profitability/activity). Step 2: pull the figures from the statements (use averages for turnover ratios). Step 3: compute and compare with the ideal (2:1, 1:1) or industry benchmark. Step 4: write a one-line interpretation: what it says about the firm and one caution.'''),

'mgmt-mod2-fund-flow-cash-flow': ('''# Fund Flow & Cash Flow Statement

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

![Fund Flow and Cash Flow Diagram](fund-flow-cash-flow.png)''',
 [('Cash flow indirect', 'Net operating cash = PAT + Non-cash charges + Losses minus Gains plus Decrease in CA plus Increase in CL', 'PAT Rs 50k, depreciation Rs 10k, debtors up Rs 5k.', 'Operating cash = 50k + 10k minus 5k = Rs 55k.'),
  ('Change in funds', 'Change in working capital = Change in current assets minus change in current liabilities', 'CA +Rs 20k, CL +Rs 8k.', 'WC increases by Rs 12k (funds applied).')],
 [('Debtors rule', 'Increase in debtors means sales booked but cash not received: subtract it.', 'Adjustment traps.'),
  ('Preliminary expenses', 'Writing off intangibles is a non-cash add-back in the operating section.', 'Adjustment questions.')],
 '''Step 1: for fund flow, prepare a change-in-working-capital schedule from two balance sheets. Step 2: classify each change into source or application. Step 3: for cash flow, start PAT, add non-cash items, reverse asset-sale gains/losses. Step 4: adjust working capital movements, then list investing and financing flows; reconcile the opening and closing cash.'''),

'mgmt-mod4-budgetary-control': ('''# Budgetary Control

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

![Budgetary Control Diagram](budgetary-control.png)''',
 [('Flexible budget', 'Total cost = Fixed cost + (Variable cost per unit x Actual output)', 'Fixed Rs 50,000; variable Rs 20/unit; actual 3,000 units.', 'Budget = 50,000 + 60,000 = Rs 1,10,000.'),
  ('Cash budget', 'Closing cash = Opening cash + Receipts minus Payments', 'Open Rs 40k; receipts Rs 1.2L; payments Rs 1.1L.', 'Closing cash = Rs 50k.')],
 [('Master order', 'Sales budget is the cornerstone; everything else derives from it.', 'Process sequence questions.'),
  ('Budget padding', 'Managers inflate estimates to create slack: a known limitation.', 'Discussion answers.')],
 '''Step 1: start from the sales budget and derive production, then material/labour/overheads. Step 2: build the cash budget month by month (receipts, payments, opening/closing). Step 3: for flexible budget problems, separate fixed and variable elements and restate for actual output. Step 4: compute variances (budget minus actual) and recommend corrective action.'''),

'mgmt-mod5-marginal-costing-decision-making': ('''# Marginal Costing & Decision Making

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

![Marginal Costing Diagram](break-even-analysis.png)''',
 [('BEP units', 'BEP = Fixed cost / (Selling price minus Variable cost per unit)', 'FC Rs 60,000; SP Rs 50; VC Rs 30.', 'BEP = 60,000 / 20 = 3,000 units.'),
  ('P/V ratio', 'P/V ratio = Contribution / Sales x 100', 'Sales Rs 2L, VC Rs 1.2L.', 'P/V = 80,000/2,00,000 x 100 = 40%.')],
 [('C/S quick', 'P/V ratio = (Sales minus Variable cost)/Sales; also = Contribution per unit / SP per unit.', 'All BEP value questions.'),
  ('Key factor ranking', 'Rank products by contribution per unit of the scarce resource, not by contribution per unit.', 'Limiting-factor decisions.')],
 '''Step 1: split costs into fixed and variable; compute contribution per unit. Step 2: compute P/V ratio and BEP (units and value). Step 3: build the profit statement: Contribution minus Fixed cost = Profit. Step 4: for decisions (special order, make-or-buy, product mix), compare incremental contribution and state the recommendation.'''),

'tax1-mod1-basic-concepts-residential-status': ('''# Basic Concepts & Residential Status

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

![Residential Status Diagram](residential-status.png)''',
 [('Day count', 'Resident if stay in India >= 182 days in the PY, or >= 60 days in PY plus >= 365 days in preceding 4 years', 'Stay 200 days in the PY.', 'Resident; then test RNOR conditions.'),
  ('Scope of income', 'ROR: global income taxable; NR: only Indian income; RNOR: Indian income plus foreign business income controlled from India', 'RNOR with UK rental income.', 'UK rent is not taxable in India; Indian salary is.')],
 [('182 first', 'Test the 182-day condition first; only if it fails, apply the 60/365 rule.', 'Saves exam time.'),
  ('PY vs AY', 'PY 2025-26 income is assessed in AY 2026-27; never mix the two years.', 'Common error trap.')],
 '''Step 1: compute days of stay in India in the previous year. Step 2: apply Section 6(1)(a) or (b) to fix Resident/Non-Resident. Step 3: if Resident, test RNOR conditions (9/10 years rule and 730-day rule). Step 4: map each income item to its scope (global vs Indian-source) and conclude what is taxable.'''),

'tax1-mod4-computation-total-income': ('''# Computation of Total Income & Tax Liability

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

![Total Income Diagram](total-income.png)''',
 [('Total income', 'Total income = Gross total income minus Chapter VI-A deductions', 'GTI Rs 9L; 80C Rs 1.5L, 80D Rs 25k.', 'Total income = 9L minus 1.75L = Rs 7.25L.'),
  ('Tax liability', 'Tax = Slab tax + Surcharge minus Rebate, then add 4% cess', 'Tax Rs 50,000 after rebate.', 'Payable = 50,000 x 1.04 = Rs 52,000.')],
 [('House property cap', 'Loss from house property set off against other heads is capped at Rs 2 lakh a year.', 'Loss-set-off questions.'),
  ('80C ceiling', '80C plus 80CCD(1B) combined planning: Rs 1.5L + Rs 50k NPS.', 'Deduction planning answers.')],
 '''Step 1: compute income under each of the five heads with prescribed rules (standard deduction for salary, 30% net value for house property). Step 2: club incomes and set off losses: inter-head then intra-head, respecting the Rs 2 lakh house-property cap. Step 3: apply Chapter VI-A deductions to get total income. Step 4: apply slab rates, rebate 87A, surcharge and 4% cess.'''),

'tax1-mod5-tax-planning-avoidance-evasion': ('''# Tax Planning, Avoidance & Evasion

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

![Tax Planning Diagram](tax-planning.png)''',
 [('Savings example', 'Tax saved = Deduction amount x Marginal tax rate', 'Invest Rs 1.5L under 80C at 30% slab.', 'Tax saved = Rs 45,000.'),
  ('Penalty for concealment', 'Penalty = 50% to 200% of tax sought to be evaded (Section 270A)', 'Tax evaded Rs 1L.', 'Penalty Rs 50,000 to Rs 2L plus tax and interest.')],
 [('GAAR test', 'GAAR applies only to impermissible avoidance arrangements (tax benefit main purpose + lacking commercial substance).', 'Case-study framing.'),
  ('Holding period', 'Listed equity: 12 months for long-term; unlisted/property: 24 months (pre-budget rates).', 'Capital gains planning.')],
 '''Step 1: classify the action as planning, avoidance or evasion with the defining test (lawful, loophole, illegal). Step 2: for planning problems, quantify the tax saved (deduction x marginal rate). Step 3: for avoidance, explain GAAR and the recharacterisation power. Step 4: for evasion, list consequences: tax, interest, penalty, prosecution.'''),

'ops-mod1-production-operations-intro': ('''# Introduction to Production & Operations Management

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

![POM Introduction Diagram](pom-intro.png)''',
 [('Productivity', 'Productivity = Output / Input', 'Output 500 units using 250 labour hours.', 'Labour productivity = 2 units/hour.'),
  ('Break-even volume for capacity', 'BEP units = Fixed cost / (Price minus Variable cost per unit)', 'FC Rs 2L, price Rs 100, VC Rs 60.', 'BEP = 2,00,000/40 = 5,000 units.')],
 [('Transformation shorthand', 'POM = Input to Transformation to Output with feedback; every operations question maps to a stage.', 'Framework answers.'),
  ('Process match', 'Job (custom), batch (small runs), mass (standard), continuous (flow: chemicals/power).', 'Matching MCQs.')],
 '''Step 1: frame the system: inputs, transformation, outputs. Step 2: classify the process type and note its trade-offs (flexibility vs cost). Step 3: address the decision area asked (capacity, layout, quality, scheduling) with the right tool. Step 4: quantify productivity or BEP where numbers appear and link to competitiveness.'''),

'ops-mod3-inventory-management': ('''# Inventory Management

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

![Inventory Management Diagram](org-structure.png)''',
 [('EOQ', 'EOQ = Square root of (2 D O / C)', 'D = 10,000 units, O = Rs 50/order, C = Rs 2/unit/year.', 'EOQ = Square root of (2 x 10000 x 50 / 2) = 707 units.'),
  ('Total inventory cost', 'TC = (D/Q) x O + (Q/2) x C + D x Unit price', 'Q = 707, D = 10,000, O = 50, C = 2.', 'Ordering Rs 707 + Carrying Rs 707 = Rs 1,414 + purchase cost.')],
 [('EOQ equality', 'At EOQ, annual ordering cost equals annual carrying cost: use it to verify answers.', 'Self-check trick.'),
  ('ABC by value', 'A: 70% value/10% items; B: 20/30; C: 10/60: control intensity follows value.', 'Classification questions.')],
 '''Step 1: list demand, ordering cost and carrying cost per unit per year. Step 2: compute EOQ. Step 3: compute total cost at the given/EOQ quantity (ordering + carrying + purchase). Step 4: compute reorder level with lead-time usage and recommend the stock policy (Q system or P system).'''),

'ops-mod4-quality-management': ('''# Quality Management & TQM

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

![Quality and TQM Diagram](quality-tqm.png)''',
 [('Six Sigma level', 'DPMO = (Defects / Opportunities) x 1,000,000', '12 defects in 40,000 opportunities.', 'DPMO = (12/40000) x 10^6 = 300.'),
  ('Pareto rule', 'Roughly 80% of problems come from 20% of causes: fix the tall bars first.', 'A defect list with 5 causes; top 2 cause 80% of defects.', 'Attack the top 2 causes first.')],
 [('DMAIC order', 'Define, Measure, Analyse, Improve, Control: the Six Sigma project cycle.', 'Sequence questions.'),
  ('Fishbone categories', '6 Ms: Man, Machine, Material, Method, Measurement, Mother-nature (environment).', 'Root-cause exercises.')],
 '''Step 1: define the quality problem and its cost-of-quality category (prevention/appraisal/failure). Step 2: pick the tool: fishbone for root cause, Pareto for vital few, histogram for distribution, control chart for stability. Step 3: apply TQM or Six Sigma steps (DMAIC) as the improvement route. Step 4: measure effect (DPMO, defect rate) and standardise via control plans.'''),

'ops-mod5-supply-chain-logistics': ('''# Supply Chain & Logistics Management

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

![Supply Chain Diagram](supply-chain.png)''',
 [('Bullwhip measure', 'Bullwhip ratio = Variance of orders / Variance of demand (greater than 1 means amplification)', 'Order variance 450, demand variance 100.', 'Ratio = 4.5: significant distortion.'),
  ('Logistics cost share', 'Logistics cost % = Total logistics cost / Sales x 100', 'Cost Rs 12L, sales Rs 1 crore.', '12%.')],
 [('EDI/VMI cure', 'Information sharing (EDI), vendor-managed inventory and stable pricing tame the bullwhip effect.', 'Case-study cures.'),
  ('Cross-docking', 'Goods move inbound to outbound with little storage: cuts warehousing and lead time.', 'Distribution design questions.')],
 '''Step 1: map the chain: suppliers to customers with the three flows. Step 2: identify the pain point (bullwhip, stock-outs, high logistics cost). Step 3: apply the fix: information sharing, network redesign, postponement or cross-docking. Step 4: measure with service and cost KPIs (fill rate, turns, total cost %) and justify the design choice.'''),

'strat-mod1-introduction-strategic-management': ('''# Introduction to Strategic Management

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

![Strategic Management Process Diagram](strategic-process.png)''',
 [('Ansoff growth', 'Growth vector = Existing/New product x Existing/New market (4 strategies)', 'Existing product in a new market.', 'Market development.'),
  ('ROI check', 'ROI = Net profit / Investment x 100', 'Profit Rs 5 cr on Rs 50 cr investment.', 'ROI = 10%.')],
 [('5 Ps', 'Plan, Ploy, Pattern, Position, Perspective: Mintzberg view of strategy.', 'Definitions in MCQs.'),
  ('Hierarchy order', 'Corporate strategy defines scope; business strategy defines advantage; functional strategy executes.', 'Structure questions.')],
 '''Step 1: state vision/mission and objectives. Step 2: scan the environment (external: PESTLE/forces; internal: value chain/resources). Step 3: formulate at all three levels and pick the growth route (Ansoff/BCG). Step 4: outline implementation (structure, culture, controls) and evaluation (balanced scorecard, budgets).'''),

'strat-mod3-swot-pestle-analysis': ('''# SWOT & PESTLE Analysis

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

![SWOT PESTLE Diagram](swot-analysis.png)''',
 [('TOWS matrix', 'Strategies = SO, WO, ST, WT pairings of internal and external factors', 'Strength: distribution; Opportunity: export demand.', 'SO strategy: push exports via existing distribution.'),
  ('PESTLE coverage', '6 lenses: Political, Economic, Social, Technological, Legal, Environmental', 'Audit a policy change (e.g. GST rate cut).', 'Economic (tax) and Political (policy) lenses apply first.')],
 [('Internal vs external', 'Strengths/Weaknesses are internal; Opportunities/Threats are external: misclassification loses marks.', 'Classification trap.'),
  ('Quantify lists', 'Rate each factor by impact and likelihood before matching.', 'Turns a list into a decision tool.')],
 '''Step 1: list internal strengths and weaknesses (resources, capabilities). Step 2: list external opportunities and threats (scan PESTLE for macro items). Step 3: build the TOWS matrix and write one strategy per quadrant (SO/WO/ST/WT). Step 4: prioritise strategies by impact and feasibility, and state one monitoring metric.'''),

'strat-mod4-strategy-implementation': ('''# Strategy Implementation & Control

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

![Strategy Implementation Diagram](strategy-implementation.png)''',
 [('BSC perspectives', '4 perspectives: Financial, Customer, Internal Process, Learning and Growth', 'A firm wants customer retention up.', 'Customer perspective objective with retention % as the measure.'),
  ('ROI control', 'ROI = Net profit / Investment x 100; compare with target ROI for drift', 'Actual 12% vs target 15%.', 'Negative variance of 3 points: corrective action needed.')],
 [('7-S alignment', 'If shared values and systems disagree with strategy, execution fails: check the soft S first.', 'Case diagnosis.'),
  ('Chandler', 'Structure follows strategy: reorganise after strategic change.', 'One-line theory question.')],
 '''Step 1: translate the chosen strategy into objectives and a balanced scorecard. Step 2: align the 7-S elements: restructure, retrain, redesign systems. Step 3: build functional plans with budgets and timelines. Step 4: set controls: leading and lagging KPIs, review cadence, and corrective actions on variance.'''),

'strat-mod5-corporate-level-strategies': ('''# Corporate Level Strategies

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

![Corporate Level Strategies Diagram](bcg-matrix.png)''',
 [('BCG placement', 'Market share relative to largest competitor; market growth above 10% counts as high', 'Business: share 0.6, growth 14%.', 'Question Mark: high growth, low relative share.'),
  ('Ansoff cell', 'Growth = Product (existing/new) x Market (existing/new)', 'New product in an existing market.', 'Product development.')],
 [('Dogs decision', 'Dogs: liquidate or divest unless they support another business (linkage).', 'Portfolio cleanup questions.'),
  ('Cash cow role', 'Harvest cash cows to fund stars and promising question marks.', 'Portfolio allocation logic.')],
 '''Step 1: classify each business on growth rate and relative market share for the BCG matrix. Step 2: label each SBU (Star/Cow/Question/Dog) and state the resource policy. Step 3: choose the corporate route for the firm: growth (integration/diversification), stability or retrenchment, justified with the synergy test. Step 4: conclude with implementation and control notes.'''),

}
