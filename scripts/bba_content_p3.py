# -*- coding: utf-8 -*-
"""Content batch 3: remaining Semester 6 stub topics (15 topics)."""

CONTENT = {

'gst-mod2-gst-registration-compliance': ('''# GST Registration & Compliance

### Core Concept
**GST registration** is mandatory for businesses above the turnover threshold (Rs 40 lakh goods / Rs 20 lakh services in most states; Rs 10 lakh in special-category states including parts of the North-East and hill states). Registration is PAN-based, state-wise and GSTIN-coded (15 digits). Compliance includes invoices, e-way bills, returns and record keeping. Karnataka businesses register on the GST portal; GSTIN format: 2-digit state code + PAN + entity + check codes.

---

### Key Framework
1. **Who registers**: suppliers above threshold, e-commerce sellers, interstate suppliers, casual taxable persons, agents; voluntary registration available for input credit.
2. **GSTIN**: 15 characters: 2-digit state code (29 = Karnataka) + 10-digit PAN + entity number + 'Z' + check digit.
3. **Compliance calendar**: invoices within 30 days, e-way bills for goods over Rs 50,000, books kept for 72 months.
4. **Deemed registration**: if the officer does not act within 3 working days of application (REG-06), registration is deemed granted.

---

### Exam Focus
**Casual taxable person**: registers for a limited period (max 90 days) for occasional supplies in a state where there is no fixed place.

![GST Registration Diagram](gst-registration.png)''',
 [('Threshold', 'Registration required when aggregate turnover exceeds Rs 40 lakh (goods) / Rs 20 lakh (services); Rs 10 lakh in special-category states', 'Bengaluru trader with Rs 45 lakh turnover of goods.', 'Registration mandatory (Karnataka: Rs 40 lakh goods threshold).'),
  ('GSTIN check', 'GSTIN = 2-digit state code + PAN + entity + Z + check digit (15 chars)', 'Karnataka entity of PAN ABCDE1234F.', 'Starts with 29ABCDE1234F...')],
 [('Deemed grant', 'No officer action within 3 working days of REG-06: registration deemed granted.', 'Timeline MCQs.'),
  ('E-way bill', 'E-way bill needed for goods movement above Rs 50,000 in value.', 'Logistics compliance questions.')],
 '''Step 1: compute aggregate turnover (taxable + exempt + export, excluding GST) and compare with the state threshold. Step 2: determine registration type (regular, casual, non-resident, composition). Step 3: list the compliance duties: invoice, e-way bill, returns, records retention. Step 4: state consequences of non-registration: no input credit, penalties under Section 122.'''),

'gst-mod4-gst-returns-assessment': ('''# GST Returns & Assessment

### Core Concept
GST runs on a **self-assessed return chain**: GSTR-1 (outward supplies), GSTR-3B (summary with payment), GSTR-9 (annual). The input tax credit flows only when the supplier files: invoice matching is the backbone. Assessment types: self-assessment, provisional, summary (Section 63), scrutiny, best judgement (Section 64). The GST Council periodically revises return filing frequency (QRMP for small taxpayers).

---

### Key Framework
1. **Returns**: GSTR-1: outward supplies (monthly/QRMP); GSTR-3B: summary return with tax payment; GSTR-9: annual return; GSTR-9C: reconciliation statement (audit for turnover above Rs 5 crore).
2. **ITC matching**: credit appears in GSTR-2B from supplier filings; mismatch blocks credit until corrected.
3. **Assessment**: self (Section 59), provisional (Section 60), scrutiny (Section 61), best judgement (Section 64), summary when non-filers (Section 63).
4. **Interest/late fee**: 18% per annum interest on delayed tax; late fee Rs 50/day (Rs 20/day for nil return), capped.

---

### Exam Focus
**GSTR-1 vs GSTR-3B**: GSTR-1 reports invoices (who you sold to); GSTR-3B is the summary return where tax is actually paid.

![GST Returns Diagram](gst-returns.png)''',
 [('Late fee', 'Late fee = Rs 50 per day of delay (Rs 20 for nil returns), subject to the statutory cap', '10-day delay on a nil GSTR-3B.', 'Late fee = 10 x 20 = Rs 200.'),
  ('Interest on delay', 'Interest = Tax x 18% x (Days of delay / 365)', 'Tax Rs 30,000 delayed by 30 days.', 'Interest = 30000 x 0.18 x 30/365 = Rs 444.')],
 [('ITC gate', 'Credit flows only when the supplier files: GSTR-2B shows matched credit.', 'ITC questions.'),
  ('QRMP', 'Quarterly return with monthly payment for turnover up to Rs 5 crore.', 'Small-taxpayer compliance.')],
 '''Step 1: identify the return due (outward, summary, annual) and the frequency (monthly or QRMP). Step 2: compute the tax payable with ITC set-off order: IGST, then CGST/SGST cross-utilisation rules. Step 3: apply late fee and interest for any delay. Step 4: name the assessment route if the return is missing (scrutiny for mismatch, best judgement for non-filing).'''),

'gst-mod5-customs-law-basics': ('''# Customs Law Basics

### Core Concept
**Customs duty** governs import and export of goods: levied under the Customs Act 1962, collected at the port/airport. Core ideas: taxable value (CIF + landing charges), duty heads (Basic Customs Duty, IGST, compensation cess, social welfare surcharge), exemptions, and baggage rules. Export duty is rare (refund mechanisms dominate). Bengaluru airport and Mangaluru port handle Karnataka trade.

---

### Key Framework
1. **Duty structure**: BCD (on assessable value), Social Welfare Surcharge (10% on BCD), IGST (on assessable value + BCD + cess), Compensation cess (on notified goods).
2. **Assessable value**: transaction value (CIF: cost, insurance, freight) plus loading/landing charges.
3. **Types of duty**: basic, countervailing (subsumed), anti-dumping, safeguard; exemptions via notifications.
4. **Procedures**: bill of entry (import), shipping bill (export), warehousing, drawback, baggage rules (duty-free allowance).

---

### Exam Focus
**CIF vs FOB**: CIF includes cost, insurance and freight (the customs valuation base); FOB excludes freight and insurance.

![Customs Diagram](customs-basics.png)''',
 [('Landed value', 'Assessable value = CIF value + Landing charges', 'CIF Rs 1,00,000; landing charges Rs 5,000.', 'Assessable value = Rs 1,05,000.'),
  ('Duty stack', 'Total duty = BCD + SWS (10% of BCD) + IGST on (AV + BCD + cess) + cess', 'AV Rs 1,05,000, BCD 20%, IGST 18%.', 'BCD = 21,000; SWS = 2,100; IGST on 1,28,100 = 23,058; total = Rs 46,158.')],
 [('Bill of entry', 'Import: bill of entry; Export: shipping bill.', 'Document-matching MCQs.'),
  ('Drawback', 'Duty drawback refunds duties paid on inputs when goods are exported.', 'Export relief questions.')],
 '''Step 1: fix the assessable value (CIF plus landing charges). Step 2: compute BCD on assessable value; add social welfare surcharge at 10% of BCD. Step 3: compute IGST on assessable value plus BCD plus cess. Step 4: total the duties and note any exemption notification or drawback relief applicable.'''),

'ent-mod1-introduction-entrepreneurship': ('''# Introduction to Entrepreneurship

### Core Concept
An **entrepreneur** innovates, organises resources and bears risk to create value. Theories: Schumpeter (innovation and creative destruction), Knight (risk-bearing), Kirzner (alertness to opportunity). Types: lifestyle, growth, social, intrapreneur, serial. Traits: achievement need, risk tolerance, internal locus, self-confidence. India context: MUDRA, Startup India and Karnataka's startup policy (Bengaluru ecosystem) support new ventures.

---

### Key Framework
1. **Definitions**: entrepreneur (risk-bearing organiser), entrepreneurship (process), enterprise (venture).
2. **Theories**: Schumpeter: innovation; Knight: uncertainty; Kirzner: arbitrage alertness; McClelland: achievement motivation.
3. **Intrapreneurship**: entrepreneurship within a corporate structure; skunkworks teams.
4. **Economic roles**: capital formation, employment, innovation, balanced regional development; MSME contribution to GDP and exports.

---

### Exam Focus
**Entrepreneur vs manager**: the entrepreneur owns and bears risk for opportunity; the manager executes within delegation and draws a salary.

![Entrepreneurship Intro Diagram](entrepreneurship-intro.png)''',
 [('Entrepreneurial opportunity', 'Opportunity = Market gap + Resource availability + Founder capability', 'Gap in organic food supply; founder has retail experience.', 'Opportunity score high: venture is viable.'),
  ('MSME share', 'MSME share of GDP / exports: compute contribution percentage', 'MSME output Rs 30 cr of state output Rs 150 cr.', 'Share = 20%.')],
 [('Schumpeter tag', 'Creative destruction: innovation disrupts existing markets and firms.', 'Theory matching MCQs.'),
  ('Traits recall', 'Achievement motivation, risk tolerance, internal locus, self-confidence, leadership.', 'Short-answer lists.')],
 '''Step 1: define the entrepreneur and contrast with the manager and the administrator. Step 2: apply the theory asked (Schumpeter innovation, Knight risk, McClelland achievement). Step 3: classify the venture type (lifestyle/growth/social/intrapreneur). Step 4: link to the support ecosystem (MUDRA, Startup India, state policy) and economic role.'''),

'ent-mod3-business-plan-preparation': ('''# Business Plan Preparation

### Core Concept
A **business plan** is the venture written out: opportunity, product, market, operations, team, financials and funding ask. Sections: executive summary, company description, market analysis, marketing plan, operations, management, financial projections (P&L, cash flow, break-even), funding request, appendices. It serves as roadmap, pitch document and loan proposal. Investors scan team-size-market first.

---

### Key Framework
1. **Structure**: executive summary (write last, read first), opportunity/problem, solution/product, market size (TAM-SAM-SOM), competition, business model, go-to-market.
2. **Financials**: startup costs, sales forecast, P&L for 3-5 years, cash flow, break-even analysis, funding requirement and use of funds.
3. **Market sizing**: TAM (total), SAM (serviceable), SOM (obtainable).
4. **Presentation**: pitch deck (10-12 slides), elevator pitch (60-90 seconds); feasibility study precedes the plan (go/no-go).

---

### Exam Focus
**Feasibility study vs business plan**: feasibility decides whether to proceed (go/no-go); the business plan guides how to execute.

![Business Plan Diagram](business-plan.png)''',
 [('TAM-SAM-SOM', 'SOM = SAM x Expected market share percentage', 'SAM Rs 200 crore, expected share 2%.', 'SOM = Rs 4 crore.'),
  ('Break-even in plan', 'BEP units = Fixed costs / (Price minus Variable cost per unit)', 'FC Rs 12 lakh; price Rs 300; VC Rs 180.', 'BEP = 12,00,000 / 120 = 10,000 units.')],
 [('Summary last', 'Write the executive summary after the plan is complete: it is the investor first impression.', 'Plan-quality tip.'),
  ('TAM drill-down', 'Top-down plus bottom-up sizing: show both to build credibility.', 'Market sizing questions.')],
 '''Step 1: run the feasibility check (product, market, technical, financial viability). Step 2: draft the plan sections in order, ending with financial projections. Step 3: size the market (TAM-SAM-SOM) and show break-even. Step 4: state the funding requirement, use of funds and repayment/return logic; polish the executive summary.'''),

'ent-mod4-finance-sources-startup': ('''# Finance Sources for Startups

### Core Concept
Startups fund themselves through a ladder: **bootstrapping, friends and family, angel investors, venture capital, government schemes, debt**. Each stage has instruments: equity, convertible notes, SAFE, venture debt. Government: MUDRA (Shishu/Kishore/Tarun), Startup India seed fund, CGTMSE (credit guarantee for collateral-free loans), SIDBI schemes. Karnataka startups also tap state IT/BT policies.

---

### Key Framework
1. **Funding ladder**: bootstrapping to F&F to angel (seed) to VC (Series A/B) to private equity/IPO.
2. **Instruments**: equity shares, convertible promissory notes, SAFEs, venture debt, working capital loans.
3. **Government support**: MUDRA loans (up to Rs 10 lakh: Shishu 50k, Kishore 5 lakh, Tarun 10 lakh), CGTMSE guarantee cover, Stand-Up India (SC/ST/women), PMEGP.
4. **Valuation basics**: pre-money vs post-money; dilution = investment / post-money.

---

### Exam Focus
**Angel vs VC**: angels invest smaller personal funds at seed stage; VCs invest institutional funds at later stages with formal due diligence.

![Startup Finance Diagram](startup-finance.png)''',
 [('Post-money', 'Post-money valuation = Pre-money valuation + New investment', 'Pre-money Rs 8 crore; investment Rs 2 crore.', 'Post-money = Rs 10 crore; dilution = 20%.'),
  ('MUDRA tier', 'Shishu up to Rs 50,000; Kishore Rs 50k to Rs 5 lakh; Tarun Rs 5 lakh to Rs 10 lakh', 'Loan needed Rs 6 lakh.', 'Tarun category (Rs 5-10 lakh).')],
 [('Dilution math', 'Dilution % = Investment / Post-money valuation', 'Instant ownership calculations.'),
  ('CGTMSE', 'Credit guarantee enables collateral-free bank lending to micro/small units.', 'Scheme-selection MCQs.')],
 '''Step 1: identify the venture stage (idea/seed/growth) and the matching investor type. Step 2: choose the instrument (equity, convertible note, debt) and compute dilution or interest cost. Step 3: map government schemes (MUDRA tier, CGTMSE, Stand-Up India) to the need. Step 4: build a funding ask with use-of-funds and milestone linkage.'''),

'ent-mod5-startup-ecosystem-india': ('''# Startup Ecosystem in India

### Core Concept
India has the world third-largest startup ecosystem: **Startup India (2016)** offers recognition, tax benefits (3-year holiday under 80-IAC), self-certification, seed fund and faster exits (Section 54GB, insolvency windows). DPIIT recognition, Atal Innovation Mission, and state policies (Karnataka, Telangana, Gujarat) build incubators and clusters. Bengaluru is the top hub for IT, biotech and deep-tech ventures.

---

### Key Framework
1. **Startup India pillars**: simplification (self-certify 9 labour laws), funding support (Fund of Funds, seed fund), tax benefits (80-IAC holiday, capital gains exemption).
2. **DPIIT recognition**: 10-year window from incorporation, turnover under Rs 100 crore, entity not formed by splitting.
3. **Ecosystem elements**: incubators (IIMB NSRCEL, T-Hub, Atal Tinkering Labs), accelerators, angel networks, VC funds, mentors.
4. **Challenges**: funding winter, regulatory compliance, talent retention, market access; sector trends: fintech, edtech, SaaS, cleantech, healthtech.

---

### Exam Focus
**80-IAC tax holiday**: eligible startups can claim 100% deduction on profits for 3 consecutive years out of the first 10 years.

![Startup Ecosystem Diagram](startup-ecosystem.png)''',
 [('Eligibility', 'DPIIT recognition requires: incorporated within 10 years, turnover under Rs 100 crore, innovative product/process', 'Firm incorporated 6 years ago, turnover Rs 40 crore.', 'Eligible for DPIIT recognition.'),
  ('Tax holiday', '80-IAC: 100% profit deduction for 3 consecutive years chosen from the first 10 years', 'Startup earns Rs 30 lakh profit in year 5.', 'Can claim 100% deduction and pay zero tax on it.')],
 [('Self-certification', 'Recognised startups self-certify 9 labour and environmental laws for 3-5 years.', 'Compliance-simplification questions.'),
  ('Fund of Funds', 'Government contributes to SEBI-registered AIFs that invest in startups: indirect funding route.', 'Policy-instrument MCQs.')],
 '''Step 1: check DPIIT eligibility (age, turnover, innovation). Step 2: list the benefits unlocked: tax holiday, self-certification, seed fund access, IPR support. Step 3: identify ecosystem supports in the scenario (incubator, accelerator, angel network). Step 4: conclude with challenges and the policy measure that addresses each.'''),

'colaw-mod2-companies-act-incorporation': ('''# Companies Act: Incorporation & Formation

### Core Concept
A **company** is an artificial legal person separate from its members (Salomon v Salomon). Types: private (min 2 members, max 200, no public deposit/invitation), public (min 7 members), OPC, small company, Section 8 (not-for-profit). Incorporation under the Companies Act 2013: name reservation (RUN/SPICe), MOA (objects, capital, association) and AOA (internal rules), certificate of incorporation (conclusive evidence), and the corporate veil doctrine.

---

### Key Framework
1. **Incorporation steps**: DSC and DIN of directors, name reservation, drafting MOA/AOA, filing SPICe+ with declarations, certificate of incorporation (Section 7).
2. **MOA clauses**: name, registered office, objects, liability, capital, subscription; doctrines: ultra vires, constructive notice, indoor management (Turquand).
3. **Corporate veil**: separate legal personality; lifted in fraud, agency, enemy character, or single-person abuse (Section 248/35 exceptions).
4. **Private vs public**: minimum members 2 vs 7; maximum 200 vs unlimited; private restricts transfer and public invitation.

---

### Exam Focus
**MOA vs AOA**: MOA is the charter binding the company with outsiders; AOA governs internal management and can be altered by special resolution.

![Company Incorporation Diagram](company-incorporation.png)''',
 [('Minimum members', 'Private: 2 members and 2 directors; Public: 7 members and 3 directors', 'Group of 3 friends plus 2 investors forming a company.', 'Private company is possible (2 to 200 members).'),
  ('One Person Company', 'OPC: one member, one nominee; max paid-up capital Rs 50 lakh and turnover Rs 2 crore (else convert)', 'Solo founder with turnover Rs 1 crore.', 'OPC structure fits.')],
 [('Ultra vires', 'Acts beyond MOA objects are void (ultra vires); outsiders can still use indoor management.', 'Doctrine questions.'),
  ('Turquand rule', 'Indoor management: outsider may assume internal procedures were followed.', 'Bargraph of MOA vs AOA table.')],
 '''Step 1: classify the company type from membership and activity. Step 2: walk incorporation: DSC/DIN, name, MOA/AOA, SPICe+ filing, certificate. Step 3: test the act in question against MOA (ultra vires) and AOA; apply the veil-lifting doctrine if abuse is alleged. Step 4: state the consequences: void act, liability of directors, or personal liability.'''),

'colaw-mod3-shares-debentures': ('''# Shares & Debentures

### Core Concept
**Share capital** is ownership funding (equity with voting, preference with fixed dividend priority); **debentures** are loan funding with fixed interest and a charge on assets. The Companies Act 2013 governs issue, transfer and redemption: private placement, rights issue, bonus issue, ESOPs; deposits rules for public borrowing. Key distinctions: dividend versus interest, floating versus fixed charge, convertible versus non-convertible debentures.

---

### Key Framework
1. **Share types**: equity (voting, variable dividend, residual claim), preference (fixed dividend, priority in winding up; can be cumulative, participating, convertible).
2. **Debentures**: secured/unsecured, redeemable/irredeemable, convertible/non-convertible; trust deed for secured issues; charge registration (CHG-1 within 30 days).
3. **Issue mechanics**: prospectus (public), private placement (PAS-3), rights (Section 62), bonus (Section 63 from reserves), buy-back (Section 68 limits: 25% of paid-up).
4. **Deposits**: Section 73-76: public companies need RBI-bonded rules; acceptance limits and deposit repayment reserve (20% maturing within a year).

---

### Exam Focus
**Share vs debenture**: a share is ownership with variable dividend; a debenture is debt with fixed interest and priority over shareholders.

![Shares and Debentures Diagram](shares-debentures.png)''',
 [('Bonus issue', 'Bonus shares are issued free from reserves; bonus = Reserves available / Face value of new shares', 'Free reserves Rs 50 lakh, face value Rs 10.', 'Bonus shares = 5,00,000 shares.'),
  ('Buy-back limit', 'Buy-back limited to 25% of total paid-up capital plus free reserves; 1-year gap between buy-backs', 'Paid-up plus reserves Rs 20 crore.', 'Max buy-back = Rs 5 crore.')],
 [('Charge registration', 'Register charge (CHG-1) within 30 days of creation; delay attracts penalty and lender loses priority.', 'Timeline MCQs.'),
  ('Preference dividend', 'Cumulative preference dividend accumulates if skipped; equity gets nothing until preference is paid.', 'Dividend-order questions.')],
 '''Step 1: classify the instrument (equity/preference share or debenture type). Step 2: check the issue route and compliance (prospectus, PAS-3, Section 62/63). Step 3: for debentures, verify charge creation and trust deed. Step 4: compute dividend/interest obligations and priority in payment or winding up.'''),

'colaw-mod4-company-management-directors': ('''# Company Management & Directors

### Core Concept
**Directors** manage the company as agents and fiduciaries of the members. The Act 2013 fixes board composition (independent directors, woman director for listed/large companies), DIN requirement, appointment (Section 160-169), duties (Section 166: fiduciary duty, care, no conflict), disqualifications (Section 164), removal (Section 169), and key managerial personnel (CEO, CFO, CS). Board meetings, committees (audit, nomination/remuneration, CSR under Section 135) complete the governance map.

---

### Key Framework
1. **Appointment**: DIN mandatory; general meeting appoints (Section 160 right to stand); additional directors (Section 161) hold only till the next AGM.
2. **Duties (Section 166)**: act in good faith, care and diligence, avoid conflict of interest, not achieve undue gain; breach: personal liability and disgorgement.
3. **Composition**: independent directors (1/3 of board for listed), woman director (listed + paid-up above Rs 100 crore), small shareholder director.
4. **Disqualification (Section 164)**: unsound mind, undischarged insolvent, convicted (5-year bar), unpaid shares, disqualified under 167. Rotation: 2/3 of directors retire by rotation in public companies.

---

### Exam Focus
**Additional vs alternate director**: additional (Section 161) is appointed between AGMs; alternate director acts in the original director absence for 3 months or more.

![Company Directors Diagram](company-directors.png)''',
 [('Board quorum', 'Quorum: 1/3 of board strength or 2 directors, whichever is higher (minimum 2)', 'Board of 9 directors.', 'Quorum = 3.'),
  ('Woman director', 'Required for listed companies and public companies with paid-up capital above Rs 100 crore or turnover above Rs 300 crore', 'Public company, paid-up Rs 120 crore.', 'Woman director mandatory.')],
 [('Duty breach', 'Section 166 breach: director holds gains in trust for the company (disgorgement).', 'Fiduciary-duty scenarios.'),
  ('Rotation', 'Public company: 2/3 of directors retire by rotation every AGM; one-third eligible for reappointment.', 'Appointment-process questions.')],
 '''Step 1: identify the director category (executive, independent, additional, alternate) and the appointment route. Step 2: test composition rules (quorum, woman director, independent ratio). Step 3: analyse the act against Section 166 duties and Section 164 disqualifications. Step 4: state consequences: removal, personal liability, disgorgement, or vacation of office (Section 167).'''),

'colaw-mod5-winding-up-insolvency': ('''# Winding Up & Insolvency

### Core Concept
**Winding up** dissolves the company: by the tribunal (Section 271-273: inability to pay debts, oppression, public interest) or voluntary (members/creditors). The **Insolvency and Bankruptcy Code 2015** now governs resolution: CIRP (corporate insolvency resolution process, 180+90 days), liquidation waterfall (Section 53: secured creditors, workmen dues, employees, government dues, unsecured, preference, equity). Fast-track and pre-packaged schemes support MSMEs.

---

### Key Framework
1. **Winding up grounds**: tribunal: unpaid debt (statutory demand/decree), special resolution plus tribunal opinion, public interest, inability to pay; voluntary: members (solvent), creditors (insolvent).
2. **IBC process**: default of Rs 1 crore or more triggers CIRP; NCLT appoints IRP; committee of creditors decides resolution vs liquidation (66% voting share).
3. **Liquidation waterfall (Section 53)**: insolvency resolution cost, workmen 24 months dues, secured creditors, employees, government, unsecured, preference shares, members.
4. **Voluntary winding**: statement of affairs, liquidator appointment, final meeting, dissolution (Section 301).

---

### Exam Focus
**Winding up vs liquidation vs dissolution**: winding up is the process; liquidation realises assets and pays creditors; dissolution ends the legal existence.

![Winding Up Diagram](winding-up.png)''',
 [('Trigger threshold', 'CIRP triggers on default of Rs 1 crore or more (Rs 10 lakh for MSME class via pre-pack)', 'Default of Rs 2 crore to a bank.', 'Bank can file CIRP application at NCLT.'),
  ('Section 53 priority', 'Waterfall: cost, workmen (24 months), secured, employees (12 months), government (1 year), unsecured, preference, equity', 'Rs 50 lakh available; workmen dues Rs 10 lakh, secured Rs 60 lakh.', 'Cost and workmen paid first; secured gets balance; equity nothing.')],
 [('180+90', 'CIRP: 180 days plus one 90-day extension; beyond that liquidation.', 'Timeline questions.'),
  ('Voluntary trigger', 'Members voluntary when solvent; creditors voluntary when insolvent.', 'Route-selection MCQs.')],
 '''Step 1: identify the route: tribunal winding up, voluntary, or IBC CIRP. Step 2: test the trigger (inability to pay, default amount, special resolution). Step 3: run the process timeline (IRP appointment, committee of creditors, resolution plan). Step 4: if liquidating, apply the Section 53 waterfall to distribute the assets.'''),

'tax2-mod1-heads-of-income-salary': ('''# Heads of Income: Salary

### Core Concept
**Salary income** covers wages, allowances, perquisites, profits in lieu of salary (Section 17). Computation: gross salary minus exemptions (HRA, gratuity, leave encashment, pension) minus standard deduction gives income under the head. The Finance Act updates rates yearly; key exam items: HRA exemption (Section 10(13A) old regime), perquisite valuation (rent-free accommodation, car), and standard deduction (Rs 75,000 new regime).

---

### Key Framework
1. **Components**: basic, DA, commission, bonus; allowances: fully taxable (DA), partly exempt (HRA, LTA), fully exempt (special duty).
2. **HRA exemption**: least of (HRA received; rent minus 10% of salary; 50%/40% of salary for metro/non-metro).
3. **Perquisites**: rent-free house (valuation by rules), car, sweeper/gardener, education; some exempt (medical up to Rs 15,000).
4. **Standard deduction**: Rs 75,000 (new regime) / Rs 50,000 (old regime); pensioners get the same standard deduction.

---

### Exam Focus
**Salary definition**: includes wages, annuity, pension, gratuity, fees, commission, perquisites and profits in lieu (Section 17(1),(2)).

![Salary Income Diagram](salary-income.png)''',
 [('HRA exemption', 'Exempt HRA = Least of (HRA received; Rent paid minus 10% of salary; 50% metro / 40% non-metro salary)', 'HRA Rs 2.4 lakh; rent Rs 2.4 lakh; salary Rs 6 lakh (metro).', 'Least of (2.4L; 2.4-0.6=1.8L; 3L) = Rs 1.8 lakh exempt.'),
  ('Standard deduction', 'Salary head deduction = Rs 75,000 (new regime) or Rs 50,000 (old regime)', 'Gross salary Rs 8 lakh (new regime).', 'Net salary income = Rs 7.25 lakh before other exemptions.')],
 [('Salary base', 'For HRA, salary = basic plus DA (forming part) plus commission on fixed percentage of turnover.', 'Exemption computation basis.'),
  ('Gratuity exempt', 'Gratuity exemption: least of (15/26 x last salary x years; actual; Rs 20 lakh cap for private).', 'Retirement planning questions.')],
 '''Step 1: compute gross salary (basic + DA + allowances + perquisites + bonus). Step 2: apply exemptions: HRA (least-of-three), LTA, gratuity, leave encashment. Step 3: subtract standard deduction. Step 4: add the balance to total income; for perquisites, apply the valuation rules (rent-free accommodation at prescribed rates).'''),

'tax2-mod2-income-from-house-property': ('''# Income from House Property

### Core Concept
**House property income** is computed on annual value: the higher of fair rent, municipal value and standard rent (expected rent), then adjusted for unrealised rent and municipal taxes paid by owner. Deductions: 30% standard deduction (Section 24(a)) plus interest on borrowed capital (Section 24(b): Rs 2 lakh self-occupied limit). Two self-occupied houses can be treated as self-occupied (since AY 2020-21). Loss from house property set-off against other heads is capped at Rs 2 lakh.

---

### Key Framework
1. **Annual value**: gross annual value = expected rent (higher of fair/municipal, capped by standard rent) or actual rent if higher; deduct unrealised rent (conditions).
2. **NAV**: GAV minus municipal taxes (owner-paid) = Net Annual Value.
3. **Deductions**: 30% of NAV (no proof needed); interest on loan: fully deductible for let-out; Rs 2 lakh cap for self-occupied (construction completed within 5 years).
4. **Loss set-off**: house property loss against other heads limited to Rs 2 lakh per year; balance carried forward 8 years.

---

### Exam Focus
**Let-out vs self-occupied**: let-out: actual rent basis with 30% plus full interest deduction; self-occupied: NAV deemed nil, only interest deduction (capped Rs 2 lakh).

![House Property Diagram](house-property.png)''',
 [('Income computation', 'Income = NAV minus 30% of NAV minus Interest (subject to limits)', 'GAV Rs 2.4 lakh; municipal tax Rs 20k; interest Rs 1.5 lakh.', 'NAV = 2.2L; income = 2.2 - 0.66 - 1.5 = Rs 4,000.'),
  ('Expected rent', 'Expected rent = Higher of fair rent and municipal value, restricted to standard rent; compare with actual rent', 'Fair 1.8L, municipal 1.6L, standard 1.7L, actual 2L.', 'Expected = 1.7L; GAV = 2L (actual higher).')],
 [('30% flat', 'Standard deduction is always 30% of NAV regardless of actual expenses.', 'Fixed deduction trick.'),
  ('2L interest cap', 'Self-occupied interest capped at Rs 2 lakh; let-out interest fully deductible against that property income.', 'Set-off questions.')],
 '''Step 1: determine occupancy status (self-occupied, let-out, deemed let-out). Step 2: compute GAV: expected rent versus actual rent rules; deduct municipal taxes. Step 3: apply 30% standard deduction and interest deduction with the applicable cap. Step 4: set off any loss (within Rs 2 lakh) and carry forward the balance.'''),

'tax2-mod3-profit-gains-business-profession': ('''# Profits & Gains of Business or Profession

### Core Concept
This head taxes business profit: revenue receipts minus allowable expenses (Sections 30-44). Key allowances: depreciation (Section 32, block of assets), additional depreciation (20% for new plant in specified areas), bad debts (Section 36), preliminary expenses amortisation (Section 35D), and specific disallowances (Section 14A, 40(a)(i): TDS compliance, 43B: payments made before filing). Presumptive taxation (44AD/44ADA/44AE) simplifies small businesses.

---

### Key Framework
1. **Allowable deductions**: rent (30), rates/taxes, repairs, insurance, depreciation (WDV method, blocks), bad debts written off (36(1)(vii)), employee PF/ESI, interest on business loans.
2. **Depreciation**: block of assets concept; rates (15% buildings, 30% machinery, 40% computers); additional depreciation 20% for new plant used 180+ days.
3. **Disallowed**: personal expenses, capital expenditure, illegal payments, payments above Rs 10,000 in cash (35AD specifics), provision for doubtful debts (only actual write-off allowed).
4. **Presumptive**: 44AD: 8% (6% digital) of turnover for small businesses (turnover up to Rs 3 crore); 44ADA: 50% receipts for professionals (up to Rs 75 lakh); no further deductions claimed.

---

### Exam Focus
**Depreciation is mandatory** under Section 32: even if not claimed in accounts, the WDV carry-forward requires computation.

![Business Profession Diagram](business-profession.png)''',
 [('WDV depreciation', 'Depreciation = WDV of block x Rate x (Days used / 365); WDV = Opening WDV + additions minus sales', 'Block WDV Rs 10 lakh (machinery 30%), used full year.', 'Depreciation = Rs 3 lakh; closing WDV = Rs 7 lakh.'),
  ('Presumptive income', '44AD income = 8% of turnover (6% for digital receipts); 44ADA = 50% of gross receipts', 'Turnover Rs 60 lakh, 100% digital.', 'Presumptive income = 60L x 6% = Rs 3.6 lakh.')],
 [('Block rule', 'Depreciation runs on blocks of assets; sale proceeds reduce the block WDV (capped at block value).', 'Computation questions.'),
  ('43B rule', 'Deduction for taxes/PF/gratuity only when actually paid before the filing due date.', 'Timing disallowance traps.')],
 '''Step 1: compute gross profit from business accounts (Section 28 income). Step 2: add disallowed expenses back (personal, capital, provision, cash violations). Step 3: claim deductions: rent, interest, depreciation on block WDV (with 180-day rule for additions), bad debts. Step 4: compare with presumptive computation (44AD/44ADA) where eligible and choose the lower-tax option.'''),

'tax2-mod5-capital-gains-income-other-sources': ('''# Capital Gains & Income from Other Sources

### Core Concept
**Capital gains** tax profits on transfer of a capital asset: short-term (held <= 12/24 months) versus long-term, with indexation benefits for long-term (except listed equity where LTCG above Rs 1.25 lakh is taxed at 12.5% without indexation post-July 2024). Exemptions: Sections 54, 54B, 54EC, 54F (reinvestment in residential house/bonds). **Income from other sources (IOS)** is the residual head: dividends, interest, gifts (Section 56(2)(x) above Rs 50,000), winnings from lottery (Section 115BB at 30%).

---

### Key Framework
1. **Capital asset**: property of any kind; excludes stock-in-trade, personal effects (except jewellery); transfer includes sale, exchange, extinguishment.
2. **STCG/LTCG**: listed equity: 12 months (STCG 20% post-budget; LTCG 12.5% above Rs 1.25 lakh); other assets: 24 months; indexation with CII for long-term (unlisted/property).
3. **Exemptions**: 54 (residential house reinvestment; 2 houses max for gains up to Rs 10 crore), 54EC (NHAI/REC bonds up to Rs 50 lakh within 6 months), 54F (net consideration reinvested in a house).
4. **IOS**: dividends at slab rates; interest (savings 80TTA/TTB exempt); gifts: money above Rs 50,000 taxable (exceptions: relatives, marriage, inheritance); lottery at 30% flat.

---

### Exam Focus
**Indexation vs straight 12.5%**: post-July-2024, listed equity LTCG is 12.5% without indexation; property/unlisted gains retain indexation.

![Capital Gains Other Sources Diagram](capital-gains.png)''',
 [('Indexed cost', 'Indexed cost = Cost x CII of year of transfer / CII of year of acquisition', 'Cost Rs 20 lakh (2015-16, CII 254); transfer 2024-25 (CII 363).', 'Indexed cost = 20L x 363/254 = Rs 28.6 lakh.'),
  ('Section 54F', 'Exemption = Long-term gain x (Net consideration reinvested in new house / Net consideration)', 'Gain Rs 30 lakh; net consideration Rs 60 lakh; reinvested Rs 45 lakh.', 'Exempt = 30 x 45/60 = Rs 22.5 lakh.')],
 [('Holding test', 'Listed equity: 12 months divides ST/LT; house/unlisted: 24 months.', 'Classification speed.'),
  ('Gift rule', 'Money above Rs 50,000 from non-relatives is IOS income (Section 56(2)(x)); marriage/inheritance gifts exempt.', 'Gift MCQs.')],
 '''Step 1: classify the asset and holding period; compute full and indexed cost of acquisition (plus improvement). Step 2: compute STCG or LTCG; apply the right tax rate (slab for STCG non-equity; 20% STCG equity; 12.5% LTCG equity; 12.5% indexed for others). Step 3: apply exemptions (54/54B/54EC/54F) with time and amount limits. Step 4: compute IOS items separately (dividends at slab, lottery at 30%, gifts above the threshold).'''),

}
