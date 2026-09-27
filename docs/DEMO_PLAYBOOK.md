# Vriddhi — Demo Playbook for an Institute Head

Audience: Principal / Chairman / Secretary of a college. They buy **outcomes**
(control, compliance, money, reputation), not features. Every screen you show
should answer one of their five questions:

1. *Do I know what is happening in my college right now?* (visibility)
2. *Will this pass NAAC / university inspection?* (compliance)
3. *Will fees come in faster and leak less?* (money)
4. *Will parents and students see us as modern?* (reputation / admissions)
5. *Will my staff actually use it, and who supports us?* (adoption / risk)

---

## 1. Before the demo (do this 2–3 days ahead)

**Load their college, not "Demo College".**
- Set their **college name, logo and campus photo** (Settings → General — new).
  When the principal sees their own logo in the header and on a student ID card,
  it stops being "software" and becomes "our system".
- Set the **accent colour** to their brand colour (Settings → Appearance).
- Import 1 real programme (e.g. BCom Sem 3): curriculum, 30–60 students
  (bulk upload), 4–5 faculty, one week of timetable, a few fee heads.
- Put 50–100 books in the library catalogue (CSV import) and ~20 assets.
- Create 1 past assessment with results so dashboards have numbers.

**Prepare devices.**
- Laptop (principal view) + a phone logged in as a **student** + a phone as
  **faculty**. Install the PWA on the phones ("Install App") — it looks native.
- Print one **student ID card PDF** (Student → My ID Card) and scan its barcode
  at the library desk live. This is your "wow" moment.
- Have mobile hotspot as backup. Clear notifications/test data that look broken.

**Rehearse the 25-minute script below twice.** Don't click anything unrehearsed.

---

## 2. The 25-minute demo script

| Min | Show | Say (outcome, not feature) |
|---|---|---|
| 0–2 | Principal dashboard with **their logo** | "This is your college on one screen — attendance, fees, results, today." |
| 2–6 | **Attendance**: faculty marks on phone → principal sees it live; low-attendance list | "You know by 10 AM which classes happened and which students are below 75% — before the university does." |
| 6–10 | **Curriculum progress + Class schedule** (download timetable PDF) | "Syllabus coverage per faculty, per subject. No more surprises at semester end." |
| 10–14 | **Exam paper generator**: pick topics/units, set marks pattern, auto-generate → HOD approval | "Question papers in 5 minutes, balanced by unit and difficulty, with approval trail. Paper-leak risk goes down." |
| 14–17 | **Fees**: fee structure → challan → student pays → receipt with their letterhead; dues report | "Every rupee traced. Defaulter list in one click." |
| 17–20 | **Student phone**: dashboard, timetable, results, **digital ID card** → scan at library | "Students get an app with your name on it. The ID card works at the library and gate." |
| 20–22 | **Operations**: library issue/return, asset register, stock, no-dues | "The back office — library, assets, stores — runs in the same system, so no-dues is automatic." |
| 22–25 | **Reports / compliance** (BCU compliance, analytics) + close | "These are the numbers NAAC and the university ask for — already collected." |

**Close with a concrete proposal**, not "any questions?":
> "Let's run a 30-day pilot with one programme — BCom — attendance, timetable,
> fees and exams. We set it up; your staff only use it. At day 30 you decide."

---

## 3. Handling the questions they *will* ask

| Question | Honest, confident answer |
|---|---|
| Is our data safe? | Hosted on Google Cloud (Firebase, Mumbai region for functions), every college isolated by security rules, role-based access, audit trails on papers and fees. |
| Can it work with the university (UUCMS / BCU)? | Yes — there's a UUCMS integration screen, BCU scheme packs and a result importer for university result files. |
| What if staff are not tech-savvy? | Mobile-first, available in Kannada / Hindi / Tamil / Telugu / Malayalam, bulk uploads for everything, scanning or manual entry at every desk. |
| How long to go live? | Pilot programme in 1–2 weeks; full college in one semester. |
| What does it cost? | Per-student per-year pricing (have your number ready — do not improvise). |
| Can parents see attendance/fees? | **Be careful** — see gaps below. Say "on the roadmap for next quarter; today students and staff are live." |

---

## 4. Management perspective — where we are lagging

Ranked by how much it hurts a sale to an institute head. Be ready for these;
fix the top 3 before signing large colleges.

### Critical (heads will ask in the first meeting)
1. **No parent portal / parent app.** Principals sell the college to parents.
   Attendance, fee dues and results reaching parents is the #1 request.
2. **No SMS / WhatsApp / email delivery.** Notification settings exist, but no
   provider is connected, so absence alerts, fee reminders and results are not
   actually sent. WhatsApp alerts are the norm in Indian colleges now.
3. **No online payment gateway.** Fees are recorded via challan / proof upload;
   there's no Razorpay / PayU / Cashfree integration with auto-reconciliation.
   "Pay fees from the phone" is expected.

### High (lose deals against established ERPs)
4. **Admissions CRM is thin.** There is an Admission Center, but no enquiry →
   follow-up → application → counselling pipeline, lead sources or conversion
   reports. Heads care about admissions more than anything else.
5. **NAAC / NIRF report pack.** BCU compliance exists, but not criterion-wise
   NAAC SSR data (student progression, faculty profiles, research, extension
   activities) or NIRF data export. This is a big purchase driver.
6. **Biometric / RFID attendance integration.** Many colleges already own
   biometric devices for staff attendance and want them connected.
7. **Hostel and transport modules** — missing; common in larger colleges.

### Medium (nice-to-have, strengthens the story)
8. **Alumni, grievance/feedback (IQAC) and visitor management.**
9. **Real push notifications** — browser permission now works, but there is no
   server-side push (FCM) yet.
10. **Bulk ID-card printing** from the admin side (students can already
    download their own card; offices want to print a whole batch on PVC sheets).
11. **Management summary**: a single monthly PDF for the chairman
    (attendance %, fee collection vs target, results, syllabus coverage).

### Positioning strengths (lean into these)
- One platform for academics **and** back office (library, assets, stores,
  procurement, payroll, no-dues) — most competitors sell these separately.
- AI-assisted paper generation, question bank with PYQs, auto-grading.
- Multi-language UI in 5 Indian languages.
- Mobile-first PWA — no app-store dependency, works on low-end phones.
- University-specific (BCU scheme packs, UUCMS) — local fit beats generic ERPs.

---

## 5. Suggested 6-week roadmap to close the gaps

| Week | Deliver | Why |
|---|---|---|
| 1–2 | WhatsApp/SMS provider (e.g. MSG91 / Gupshup) → absence alerts, fee reminders, result alerts | Makes every other module visible to parents |
| 2–3 | Razorpay payment link on challans + webhook auto-reconcile | Direct revenue impact for the college |
| 3–4 | Parent login (read-only: attendance, fees, results, timetable, ID card) | Top ask from principals |
| 4–5 | Admissions enquiry pipeline + conversion dashboard | Heads buy for admissions |
| 5–6 | NAAC criterion-wise export + monthly chairman PDF | Compliance + management reporting |

---

## 6. Demo-day checklist

- [ ] Their logo, name, colour set · [ ] real-looking data for one programme
- [ ] Student & faculty phones logged in, PWA installed · [ ] ID card printed
- [ ] Library desk ready to scan the ID card · [ ] timetable PDF downloaded
- [ ] One paper generated & sitting in HOD approval · [ ] fee receipt ready
- [ ] Pricing sheet + pilot proposal (1 page) printed
- [ ] Backup hotspot · [ ] browser zoom 100%, notifications off, tabs closed
