#!/usr/bin/env python3
"""Build docs/Vriddhi_Costing_Sheet.xlsx — an editable costing, pricing and P&L workbook.

Every assumption is a yellow input cell; everything else is a live Excel formula, so
changing students, salaries, prices or usage recalculates cloud cost, AI cost, team cost,
break-even and the 3-year P&L. Mirrors scripts/firebase-yearly-cost-plan.mjs.

    python3 scripts/build-costing-sheet.py
"""
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

OUT = "docs/Vriddhi_Costing_Sheet.xlsx"

# ── styles ───────────────────────────────────────────────────────────────────
INPUT_FILL = PatternFill("solid", fgColor="FFF2CC")
CALC_FILL = PatternFill("solid", fgColor="F2F2F2")
KEY_FILL = PatternFill("solid", fgColor="E2EFDA")
HEAD_FILL = PatternFill("solid", fgColor="1F3864")
SUB_FILL = PatternFill("solid", fgColor="D9E1F2")
HEAD_FONT = Font(bold=True, color="FFFFFF")
BOLD = Font(bold=True)
TITLE = Font(bold=True, size=14)
NOTE = Font(italic=True, color="595959", size=9)
THIN = Side(style="thin", color="BFBFBF")
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

INR = '"₹"#,##0;[Red]-"₹"#,##0'
INR2 = '"₹"#,##0.00;[Red]-"₹"#,##0.00'
USD = '"$"#,##0.00;[Red]-"$"#,##0.00'
USD0 = '"$"#,##0;[Red]-"$"#,##0'
PCT = '0.0%'
NUM = '#,##0'
NUM1 = '#,##0.0'
NUM2 = '#,##0.00'
LAKH = '0.00" L"'

wb = Workbook()
R = {}  # key -> absolute reference "Sheet!$C$5"


def ref(sheet, col, row):
    name = f"'{sheet}'" if " " in sheet or "&" in sheet else sheet
    return f"{name}!${col}${row}"


def style_range(ws, cell_range, fill=None, font=None, fmt=None, border=True, align=None):
    for row in ws[cell_range]:
        for c in row:
            if fill:
                c.fill = fill
            if font:
                c.font = font
            if fmt:
                c.number_format = fmt
            if border:
                c.border = BOX
            if align:
                c.alignment = align


def header(ws, row, labels, col=1, widths=None):
    for i, lab in enumerate(labels):
        c = ws.cell(row=row, column=col + i, value=lab)
        c.fill = HEAD_FILL
        c.font = HEAD_FONT
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = BOX
    if widths:
        for i, w in enumerate(widths):
            ws.column_dimensions[get_column_letter(col + i)].width = w


def title(ws, text, sub=None):
    ws["A1"] = text
    ws["A1"].font = TITLE
    if sub:
        ws["A2"] = sub
        ws["A2"].font = NOTE


def section(ws, row, text, span=4, col=2):
    c = ws.cell(row=row, column=col, value=text)
    c.font = BOLD
    for cc in range(col, col + span):
        ws.cell(row=row, column=cc).fill = SUB_FILL


# ═════════════════════════════════════════════════════════════════════════════
# README
# ═════════════════════════════════════════════════════════════════════════════
ws = wb.active
ws.title = "README"
title(ws, "Vriddhi — Costing, Pricing & P&L Workbook", "Built 25 Sep 2026 from the Vriddhi codebase. All figures are estimates until validated against a real Firebase invoice.")
readme = [
    ("How to use", ""),
    ("1", "Fill the yellow cells on the Inputs sheet (college size, unit prices, per-role usage, events). Grey cells are formulas — do not overwrite."),
    ("2", "Adjust the academic Calendar (days per month by type, fee/admission timing, AI weights)."),
    ("3", "Enter your team on 'Team & Overheads' (5 × ₹30,000 is pre-filled), overheads, onboarding out-of-pocket, and how many colleges share the team."),
    ("4", "Review 'AI Costing' — change models (dropdown), calls per year, tokens per call and the safety buffer."),
    ("5", "'Usage Model' shows reads/writes per role per day type and the monthly grid with the Blaze free quota applied PER DAY."),
    ("6", "'Monthly Plan' and 'Annual Summary' give the 12-month cash plan and per-student / per-user cost."),
    ("7", "Set your price on 'Pricing & P&L' to see revenue, gross profit, margin, break-even and a 3-year P&L. 'Sensitivity' shows margin by price × colleges."),
    ("8", "'Build Cost' estimates what it costs to build a product like this (for investor / 'why not build it ourselves' conversations)."),
    ("9", "'Resume Add-on' costs the Resume Builder add-on (5 ATS-safe templates × 3 PDF versions per student per year): cloud cost per download, three usage scenarios, build effort, cap sensitivity and the add-on price for a target margin."),
    ("", ""),
    ("Colour legend", ""),
    ("Yellow", "Input — edit freely"),
    ("Grey", "Formula — recalculates automatically"),
    ("Green", "Key output"),
    ("", ""),
    ("Blaze plan reminder", "Firestore gives 50,000 reads and 20,000 writes free PER DAY (resets daily, no roll-over), then $0.06 / 100K reads and $0.18 / 100K writes. A 5,000-student college uses ~3.4M reads on a teaching day, so the quota covers ~1.5% — you pay from day one, but the unit prices are tiny."),
    ("GST", "Cloud prices are ex-GST. Google Cloud India adds 18% GST; set 'GST recoverable' = 1 on Inputs if you claim input credit, else 0 to treat it as a cost. Your invoice to the college carries 18% GST on top of the prices here."),
    ("Reconciliation", "With the default inputs the sheet reproduces docs/COSTING_PLAN_1YEAR_5000_STUDENTS.md: cloud ₹52,266, AI ₹1,16,020, team ₹18,00,000. The only difference is overheads: the report used a flat ₹15,000 'tools' line; the sheet itemises ₹39,660 (Workspace, domain, ₹30,000 travel), so break-even is ₹402 instead of ₹397 per student."),
    ("Source", "scripts/firebase-yearly-cost-plan.mjs and docs/COSTING_PLAN_1YEAR_5000_STUDENTS.md in the Vriddhi repository. Regenerate this workbook with: python3 scripts/build-costing-sheet.py"),
]
for i, (a, b) in enumerate(readme, start=4):
    ws.cell(row=i, column=1, value=a).font = BOLD if b == "" or a in ("Yellow", "Grey", "Green") else Font()
    ws.cell(row=i, column=2, value=b).alignment = Alignment(wrap_text=True, vertical="top")
for i, (a, _b) in enumerate(readme, start=4):
    if a == "Yellow":
        ws.cell(row=i, column=1).fill = INPUT_FILL
    elif a == "Grey":
        ws.cell(row=i, column=1).fill = CALC_FILL
    elif a == "Green":
        ws.cell(row=i, column=1).fill = KEY_FILL
ws.column_dimensions["A"].width = 22
ws.column_dimensions["B"].width = 120

# ═════════════════════════════════════════════════════════════════════════════
# INPUTS
# ═════════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet("Inputs")
title(ws, "Inputs — every assumption in one place", "Yellow = edit. Grey = derived. Units in column D, source/notes in column E.")
ws.column_dimensions["A"].width = 2
ws.column_dimensions["B"].width = 58
ws.column_dimensions["C"].width = 16
ws.column_dimensions["D"].width = 18
ws.column_dimensions["E"].width = 90
row = 4


def inp(key, label, value, fmt=NUM, unit="", note="", formula=False):
    global row
    ws.cell(row=row, column=2, value=label).border = BOX
    c = ws.cell(row=row, column=3, value=value)
    c.number_format = fmt
    c.border = BOX
    c.fill = CALC_FILL if formula else INPUT_FILL
    ws.cell(row=row, column=4, value=unit).border = BOX
    ws.cell(row=row, column=5, value=note).font = NOTE
    R[key] = ref("Inputs", "C", row)
    row += 1


def sec(text):
    global row
    row += 1
    section(ws, row, text)
    row += 1


sec("1. College & users")
inp("students", "Students", 5000, unit="people", note="the billing unit")
inp("faculty", "Faculty (teaching staff, incl. HODs & mentors)", "=ROUND(" + R["students"] + "/25,0)", unit="people", note="default 1:25; overwrite with the real number", formula=True)
inp("hod", "HODs (extra department pages on top of faculty)", 15, unit="people")
inp("mentor", "Mentors (extra mentee pages on top of faculty)", 40, unit="people")
inp("admin", "Principal / college admin / exam cell users", 5, unit="people")
inp("accounts", "Accounts team users", 5, unit="people", note="fee management, challans, collections, finance reports, vendor bills")
inp("operations", "Operations team users (office, library, inventory, procurement, admissions)", 8, unit="people")
inp("superadmin", "Superadmin users (your team)", 2, unit="people")
inp("users", "Total accounts (students + college staff)", f"={R['students']}+{R['faculty']}+{R['admin']}+{R['accounts']}+{R['operations']}", unit="people", formula=True)
inp("sectionSize", "Students per section", 60, unit="people")
inp("sections", "Sections", f"=ROUNDUP({R['students']}/{R['sectionSize']},0)", formula=True)
inp("periods", "Periods per day with attendance", 5)
inp("sessionsPerDay", "Attendance sessions per teaching day", f"={R['sections']}*{R['periods']}", formula=True, note="each session = 1 write per student + 3 docs")
inp("finalYear", "Final-year students (placement prep, no-dues)", f"=ROUND({R['students']}/3,0)", formula=True)
inp("admissions", "New admissions per year", f"=ROUND({R['students']}*0.3,0)", formula=True)

sec("2. Currency & Firebase Blaze unit prices (Sept 2026 list prices, asia-south1)")
inp("fx", "Exchange rate", 96, fmt=NUM2, unit="₹ per USD")
inp("readPrice", "Firestore document reads", 0.06, fmt=USD, unit="$ per 100,000", note="free 50,000 per day on Blaze (default database only)")
inp("writePrice", "Firestore document writes", 0.18, fmt=USD, unit="$ per 100,000", note="free 20,000 per day")
inp("freeReads", "Free reads per day", 50000, note="resets at midnight US-Pacific; unused quota does not roll over")
inp("freeWrites", "Free writes per day", 20000)
inp("fsStorPrice", "Firestore stored data", 0.18, fmt=USD, unit="$ per GiB-month")
inp("fsStorFree", "Firestore free storage", 1, unit="GiB")
inp("csStorPrice", "Cloud Storage (files) stored", 0.026, fmt=USD, unit="$ per GB-month")
inp("csStorFree", "Cloud Storage free storage", 5, unit="GB")
inp("dlPrice", "Cloud Storage downloads", 0.12, fmt=USD, unit="$ per GB")
inp("dlFree", "Cloud Storage free downloads", 30, unit="GB per month", note="1 GB per day")
inp("hostPrice", "Firebase Hosting transfer", 0.15, fmt=USD, unit="$ per GB")
inp("hostFree", "Hosting free transfer", 10.8, unit="GB per month", note="360 MB per day")
inp("funcUsd", "Cloud Functions", 0, fmt=USD, unit="$ per month", note="2.3M invocations/yr and all compute sit inside the free tier (2M invocations, 180K vCPU-s, 360K GiB-s per month); set >0 if you add minInstances")
inp("fixedUsd", "Fixed monthly items (Artifact Registry, Secret Manager, Realtime DB)", 1.7, fmt=USD, unit="$ per month")
inp("gst", "GST on Google Cloud bill", 0.18, fmt=PCT)
inp("gstRec", "GST recoverable as input credit? (1 = yes, 0 = treat as cost)", 1)

sec("3. Student usage (per ACTIVE student per day) — from src/modules/student")
inp("dauTeach", "Active share on teaching days", 0.6, fmt=PCT)
inp("dauIA", "Active share on internal-assessment (online test) days", 0.9, fmt=PCT)
inp("dauUni", "Active share on university exam days", 0.4, fmt=PCT)
inp("dauResult", "Active share on result days", 0.8, fmt=PCT)
inp("dauOff", "Active share on weekends / holidays / office-only days", 0.12, fmt=PCT)
inp("loadsTeach", "Dashboard loads per active day — teaching & IA days", 1.5, fmt=NUM1)
inp("loadsOther", "Dashboard loads per active day — other days", 1, fmt=NUM1)
inp("dashBase", "Dashboard reads per load EXCLUDING attendance", 100, note="profile 2 + assignments 15 + fees 8 + timetable 35 + notifications 20 + tests callable 15 (useStudentData.ts)")
inp("attReads", "attendanceRecords read per dashboard load (steady state)", 500, note="fetchAttendance limit(500), no semester filter, no cache. Set to 1 after moving to a per-student aggregate doc")
inp("otherTeach", "Other page reads per active day — teaching & IA days", 120, note="timetable / materials / fees / assignments pages")
inp("otherUni", "Other page reads — university exam days", 60)
inp("otherOff", "Other page reads — result / office-only / off days", 20)
inp("wTeach", "Writes per active day — teaching & IA days", 3)
inp("wOff", "Writes per active day — other days", 1)
inp("callsPerLoad", "Cloud Function calls per dashboard load", 1, note="getMyStudentTests callable")

sec("4. Staff usage (per ACTIVE user per day) — from src/modules/faculty, admin, office")
inp("fDauTeach", "Faculty active share — teaching & IA days", 0.85, fmt=PCT)
inp("fDauUni", "Faculty active share — university exam days", 0.3, fmt=PCT)
inp("fDauOff", "Faculty active share — other days", 0.25, fmt=PCT)
inp("fReadsTeach", "Faculty reads — teaching day (dashboard 230 + QB/papers/assignments 150)", 380)
inp("fWritesTeach", "Faculty writes — teaching day (excluding attendance marking)", 15)
inp("fReadsIAx", "Faculty extra reads on IA days (grading / review)", 100)
inp("fWritesIAx", "Faculty extra writes on IA days", 20)
inp("fReadsUni", "Faculty reads — university exam day", 150)
inp("fWritesUni", "Faculty writes — university exam day", 5)
inp("fReadsOff", "Faculty reads — other days", 100)
inp("fWritesOff", "Faculty writes — other days", 3)
inp("hodR", "HOD extra reads per day (department analytics, 500-cap queries)", 600)
inp("hodW", "HOD extra writes per day", 10)
inp("menR", "Mentor extra reads per day", 80)
inp("menW", "Mentor extra writes per day", 2)
inp("attR", "Attendance marking — reads per session (roster 60 + session + prior)", 70)
inp("attW", "Attendance marking — writes per session (60 attendanceRecords + attendance + summary + session)", 63, note="facultyApi.ts saveAttendance")
inp("attIAf", "Share of periods held on IA days", 0.6, fmt=PCT)
inp("admR", "Admin / principal / exam cell reads per day", 6000, note="dashboardApi.ts: 4 × limit(500) per dashboard load + analytics")
inp("admW", "Admin writes per day", 100)
inp("accR", "Accounts reads per day", 4000, note="feeApi.ts fee page = feeStructures 500 + students 500 + feePayments 500 per load; AccountsDesk ≈ 1,200")
inp("accW", "Accounts writes per day (excluding collections & challan bursts)", 40)
inp("opsR", "Operations reads per day", 8000, note="OperationsDesk lists ≤ 2,000 each, libraryTitles ≤ 20,000, libraryVisits ≤ 50,000, assets ≤ 50,000")
inp("opsW", "Operations writes per day (excluding library loans/visits, admissions, no-dues)", 150)
inp("saR", "Superadmin reads per day per open dashboard tab", 81000, note="useSuperAdmin.ts polls 7 queries every 60–120 s ≈ 225 reads/min × 6 h; ~8,000 after fix")
inp("saW", "Superadmin writes per day per user", 20)
inp("saTabs", "Average superadmin tabs open during working hours", 1, fmt=NUM1)
inp("staffOffFactor", "Staff activity on weekends/holidays (share of a working day)", 0.05, fmt=PCT)

sec("5. Events (per year unless stated) — assessments, fees, library, admissions, documents")
inp("tests", "Online tests per student per year", 20)
inp("tstR", "Reads per test attempt (post-optimisation, incl. grading & publish)", 155, note="docs/HANDOFF_exam_autosave_cost.md")
inp("tstW", "Writes per test attempt", 24)
inp("tstInv", "Function invocations per test attempt", 12)
inp("asg", "Assignments per student per year", 8)
inp("asgR", "Reads per submission (incl. faculty grading)", 35)
inp("asgW", "Writes per submission", 7)
inp("asgInv", "Function invocations per submission", 3)
inp("asgMB", "Average submission file size", 1.5, fmt=NUM1, unit="MB")
inp("feeColl", "Fee collections per year", f"={R['students']}*4", formula=True, note="4 instalments per student")
inp("feeR", "Reads per collection", 2)
inp("feeW", "Writes per collection (payment + transaction + receipt/challan)", 3)
inp("chW", "Writes per challan generated (challan + feePayment + link)", 3)
inp("libLoans", "Library loans per student per year", 10)
inp("loanR", "Reads per loan cycle (issue + return)", 6)
inp("loanW", "Writes per loan cycle", 4)
inp("libVisits", "Library gate visits per student per year (1 write each)", 40)
inp("syncs", "Library member syncs per year (reads = students each)", 52)
inp("reports", "Library visit reports per year", 24)
inp("reportR", "Reads per visit report", f"=MIN(50000,{R['students']}*4)", formula=True)
inp("admisR", "Reads per admission", 10)
inp("admisW", "Writes per admission (plus 1 provisioning write)", 6)
inp("noDuesSign", "No-dues sign-offs per final-year student", 6)
inp("noDuesR", "Reads for no-dues processing (May)", 100000)
inp("ttWrites", "Writes per timetable generation", f"={R['sections']}*30", formula=True)
inp("matPerFac", "Study-material files uploaded per faculty per year", 20)
inp("matMB", "Average material file size", 5, fmt=NUM1, unit="MB")
inp("matDl", "Material downloads per student per year", 30)
inp("pdfKB", "Challan / hall-ticket PDF size", 150, unit="KB")
inp("attDocKB", "attendanceRecords document size incl. indexes", 1.2, fmt=NUM1, unit="KB")
inp("attemptKB", "Test attempt document size", 15, unit="KB")
inp("bundleMB", "Web app bundle size", 3, fmt=NUM1, unit="MB")
inp("deploys", "Deploys per month (cache-busting)", 2)
inp("deltaKB", "Daily hosting delta per active user", 50, unit="KB")
inp("hostDau", "Average daily-active share of students for hosting traffic (whole year incl. holidays)", 0.4, fmt=PCT)
inp("fs0", "Firestore data at start of year", 0.5, fmt=NUM2, unit="GiB")
inp("cs0", "Files in Cloud Storage at start of year", 2, fmt=NUM2, unit="GB")
inp("matGB", "Materials uploaded (GB, front-loaded)", f"={R['faculty']}*{R['matPerFac']}*{R['matMB']}/1024", fmt=NUM2, unit="GB", formula=True)

sec("6. Pricing & margin targets")
inp("m1", "Target gross margin — low", 0.30, fmt=PCT)
inp("m2", "Target gross margin — mid", 0.35, fmt=PCT)
inp("m3", "Target gross margin — high", 0.40, fmt=PCT)
inp("cont", "Contingency added to costs before pricing", 0.10, fmt=PCT, note="covers AI overrun, GST slippage, extra travel")
ws.freeze_panes = "A4"

# ═════════════════════════════════════════════════════════════════════════════
# CALENDAR
# ═════════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet("Calendar")
title(ws, "Academic calendar — days per month by type (Aug → Jul, Karnataka degree college)", "Teach = classes with attendance · IA = internal-assessment / online-test days (classes continue) · Uni = university exam days · Result = result publication · Office = office working days with no classes (admissions, vacation) · Off = weekends & holidays. Shares: fee collections / admissions per month must each total 100%. AI weight distributes the annual AI budget.")
cal_head = ["Month", "Teach", "IA", "Uni", "Result", "Office", "Off", "Working days", "Total days", "Attendance ramp", "Fee share", "Admission share", "Challan burst", "Semester rollover", "Timetable gen", "Hall tickets", "No-dues", "AI weight"]
header(ws, 3, cal_head, widths=[11, 8, 8, 8, 8, 8, 8, 12, 10, 12, 10, 12, 10, 12, 10, 10, 9, 10])
cal_rows = [
    ("Aug 2026", 20, 0, 0, 0, 2, 9, 0.10, 0.30, 0.15, 1, 1, 1, 0, 0, 0.04),
    ("Sep 2026", 22, 0, 0, 0, 0, 8, 0.35, 0.15, 0.05, 0, 0, 0, 0, 0, 0.08),
    ("Oct 2026", 15, 6, 0, 0, 0, 10, 0.60, 0.05, 0.00, 1, 0, 0, 0, 0, 0.12),
    ("Nov 2026", 16, 6, 0, 0, 0, 8, 0.85, 0.02, 0.00, 0, 0, 0, 0, 0, 0.14),
    ("Dec 2026", 10, 0, 8, 0, 4, 9, 1.00, 0.02, 0.00, 0, 0, 0, 1, 0, 0.10),
    ("Jan 2027", 8, 0, 9, 0, 3, 11, 1.00, 0.25, 0.00, 1, 1, 1, 0, 0, 0.05),
    ("Feb 2027", 21, 0, 0, 1, 0, 6, 1.00, 0.15, 0.00, 0, 0, 0, 0, 0, 0.07),
    ("Mar 2027", 15, 6, 0, 0, 0, 10, 1.00, 0.04, 0.00, 1, 0, 0, 0, 0, 0.12),
    ("Apr 2027", 16, 6, 0, 0, 0, 8, 1.00, 0.01, 0.00, 0, 0, 0, 0, 0, 0.14),
    ("May 2027", 8, 0, 10, 0, 4, 9, 1.00, 0.01, 0.00, 0, 0, 0, 1, 1, 0.09),
    ("Jun 2027", 0, 0, 5, 1, 16, 8, 1.00, 0.00, 0.40, 0, 0, 0, 0, 0, 0.03),
    ("Jul 2027", 0, 0, 0, 0, 23, 8, 1.00, 0.00, 0.40, 0, 0, 0, 0, 0, 0.02),
]
CAL0 = 4
for i, r_ in enumerate(cal_rows):
    r = CAL0 + i
    m, teach, ia, uni, res, off_, off, ramp, fee, adm, ch, ro, tt, ht, nd, ai = r_
    vals = [m, teach, ia, uni, res, off_, off]
    for j, v in enumerate(vals):
        c = ws.cell(row=r, column=1 + j, value=v)
        c.border = BOX
        if j > 0:
            c.fill = INPUT_FILL
    ws.cell(row=r, column=8, value=f"=B{r}+C{r}+D{r}+E{r}+F{r}").fill = CALC_FILL
    ws.cell(row=r, column=9, value=f"=H{r}+G{r}").fill = CALC_FILL
    for j, v in enumerate([ramp, fee, adm, ch, ro, tt, ht, nd, ai]):
        c = ws.cell(row=r, column=10 + j, value=v)
        c.fill = INPUT_FILL
        c.border = BOX
    for col in (8, 9):
        ws.cell(row=r, column=col).border = BOX
    for col in (10, 11, 12, 18):
        ws.cell(row=r, column=col).number_format = PCT if col != 10 else NUM2
CALT = CAL0 + 12  # totals row 16
ws.cell(row=CALT, column=1, value="TOTAL").font = BOLD
for col in range(2, 10):
    L = get_column_letter(col)
    c = ws.cell(row=CALT, column=col, value=f"=SUM({L}{CAL0}:{L}{CALT-1})")
    c.font = BOLD
    c.fill = CALC_FILL
    c.border = BOX
for col in (11, 12, 18):
    L = get_column_letter(col)
    c = ws.cell(row=CALT, column=col, value=f"=SUM({L}{CAL0}:{L}{CALT-1})")
    c.number_format = PCT
    c.font = BOLD
    c.fill = CALC_FILL
    c.border = BOX
ws.cell(row=CALT + 1, column=11, value="← must be 100%").font = NOTE
ws.cell(row=CALT + 1, column=12, value="← must be 100%").font = NOTE
ws.cell(row=CALT + 1, column=18, value="← must be 100%").font = NOTE
ws.cell(row=CALT + 1, column=9, value="← 365").font = NOTE
R["calTeach"] = ref("Calendar", "B", CALT)
R["calIA"] = ref("Calendar", "C", CALT)
ws.freeze_panes = "B4"

# ═════════════════════════════════════════════════════════════════════════════
# TEAM & OVERHEADS
# ═════════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet("Team & Overheads")
TS = "Team & Overheads"
title(ws, "Internal team, overheads and onboarding", "Gross salaries per month. Labour for onboarding/training is inside these salaries; only out-of-pocket onboarding costs are listed separately.")
header(ws, 3, ["Role", "Count", "Gross ₹ / month", "Months / year", "Annual ₹"], widths=[44, 8, 16, 12, 16])
team_rows = [
    ("Full-stack developer", 1, 30000, 12),
    ("Full-stack developer", 1, 30000, 12),
    ("Support & training executive", 1, 30000, 12),
    ("Support & training executive", 1, 30000, 12),
    ("Project / customer-success lead", 1, 30000, 12),
    ("", 0, 0, 12), ("", 0, 0, 12), ("", 0, 0, 12), ("", 0, 0, 12), ("", 0, 0, 12),
]
T0 = 4
for i, (role, cnt, gross, months) in enumerate(team_rows):
    r = T0 + i
    for j, v in enumerate([role, cnt, gross, months]):
        c = ws.cell(row=r, column=1 + j, value=v)
        c.fill = INPUT_FILL
        c.border = BOX
    ws.cell(row=r, column=3).number_format = INR
    c = ws.cell(row=r, column=5, value=f"=B{r}*C{r}*D{r}")
    c.number_format = INR
    c.fill = CALC_FILL
    c.border = BOX
TT = T0 + len(team_rows)  # 14
ws.cell(row=TT, column=1, value="Total team cost per year").font = BOLD
c = ws.cell(row=TT, column=5, value=f"=SUM(E{T0}:E{TT-1})"); c.number_format = INR; c.font = BOLD; c.fill = KEY_FILL; c.border = BOX
ws.cell(row=TT + 1, column=1, value="Total team cost per month")
c = ws.cell(row=TT + 1, column=5, value=f"=E{TT}/12"); c.number_format = INR; c.fill = CALC_FILL; c.border = BOX
ws.cell(row=TT + 3, column=1, value="Colleges sharing this team (allocation divisor)").font = BOLD
c = ws.cell(row=TT + 3, column=5, value=1); c.fill = INPUT_FILL; c.border = BOX
ws.cell(row=TT + 4, column=1, value="Team cost allocated to THIS college per year")
c = ws.cell(row=TT + 4, column=5, value=f"=E{TT}/E{TT+3}"); c.number_format = INR; c.fill = KEY_FILL; c.border = BOX
R["teamTotal"] = ref(TS, "E", TT)
R["colleges"] = ref(TS, "E", TT + 3)
R["teamAlloc"] = ref(TS, "E", TT + 4)

OH0 = TT + 7  # 21 header
header(ws, OH0, ["Overhead item (per year)", "Annual ₹", "Shared across colleges? (1 = yes, 0 = this college only)", "Allocated to this college ₹"], widths=None)
ws.column_dimensions["C"].width = 24
ws.column_dimensions["D"].width = 22
oh_rows = [
    ("Google Workspace (5 seats)", 8160, 1), ("Domain + DNS", 1500, 1), ("Error monitoring (Sentry) — optional", 0, 1),
    ("AI coding tools for developers — optional", 0, 1), ("Travel / site visits to the college", 30000, 0),
    ("Laptops, internet, phones (amortised)", 0, 1), ("Google Cloud Standard support — optional", 0, 1),
    ("WhatsApp / SMS gateway — optional add-on", 0, 0), ("", 0, 1), ("", 0, 1),
]
for i, (item, amt, shared) in enumerate(oh_rows):
    r = OH0 + 1 + i
    for j, v in enumerate([item, amt, shared]):
        c = ws.cell(row=r, column=1 + j, value=v); c.fill = INPUT_FILL; c.border = BOX
    ws.cell(row=r, column=2).number_format = INR
    c = ws.cell(row=r, column=4, value=f"=IF(C{r}=1,B{r}/{R['colleges']},B{r})"); c.number_format = INR; c.fill = CALC_FILL; c.border = BOX
OHT = OH0 + 1 + len(oh_rows)  # 32
ws.cell(row=OHT, column=1, value="Total overheads allocated to this college per year").font = BOLD
c = ws.cell(row=OHT, column=4, value=f"=SUM(D{OH0+1}:D{OHT-1})"); c.number_format = INR; c.font = BOLD; c.fill = KEY_FILL; c.border = BOX
ws.cell(row=OHT + 1, column=1, value="Shared overheads (total, before allocation)")
c = ws.cell(row=OHT + 1, column=4, value=f"=SUMIF(C{OH0+1}:C{OHT-1},1,B{OH0+1}:B{OHT-1})"); c.number_format = INR; c.fill = CALC_FILL; c.border = BOX
ws.cell(row=OHT + 2, column=1, value="Per-college overheads (this college only)")
c = ws.cell(row=OHT + 2, column=4, value=f"=SUMIF(C{OH0+1}:C{OHT-1},0,B{OH0+1}:B{OHT-1})"); c.number_format = INR; c.fill = CALC_FILL; c.border = BOX
R["ohAlloc"] = ref(TS, "D", OHT)
R["ohShared"] = ref(TS, "D", OHT + 1)
R["ohPerCollege"] = ref(TS, "D", OHT + 2)

OB0 = OHT + 5  # 37 header
header(ws, OB0, ["Onboarding out-of-pocket (year 1, this college)", "₹"], widths=None)
ob_rows = [("Travel & stay during go-live weeks", 20000), ("Training material & printing", 10000), ("Data-migration contractor / data entry — optional", 0), ("", 0), ("", 0)]
for i, (item, amt) in enumerate(ob_rows):
    r = OB0 + 1 + i
    for j, v in enumerate([item, amt]):
        c = ws.cell(row=r, column=1 + j, value=v); c.fill = INPUT_FILL; c.border = BOX
    ws.cell(row=r, column=2).number_format = INR
OBT = OB0 + 1 + len(ob_rows)
ws.cell(row=OBT, column=1, value="Total onboarding out-of-pocket").font = BOLD
c = ws.cell(row=OBT, column=2, value=f"=SUM(B{OB0+1}:B{OBT-1})"); c.number_format = INR; c.font = BOLD; c.fill = KEY_FILL; c.border = BOX
R["onboardCost"] = ref(TS, "B", OBT)

# ═════════════════════════════════════════════════════════════════════════════
# AI COSTING
# ═════════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet("AI Costing")
AS = "AI Costing"
title(ws, "AI / LLM costing by feature", "Prices per 1M tokens (Sept 2026). gemini-1.5-flash was shut down 29 Sep 2025 — chat / prep / study packs must move to gemini-2.5-flash-lite (cheaper) or gemini-2.5-flash. Pick the model per feature from the dropdown.")
header(ws, 3, ["Model", "$ per 1M input tokens", "$ per 1M output tokens"], widths=[40, 18, 18])
models = [("gemini-2.5-flash", 0.30, 2.50), ("gemini-2.5-flash-lite", 0.10, 0.40), ("gpt-4o-mini", 0.15, 0.60), ("deepseek-chat", 0.28, 0.42), ("custom-model-1", 0, 0), ("custom-model-2", 0, 0)]
M0 = 4
for i, (m, pi, po) in enumerate(models):
    r = M0 + i
    for j, v in enumerate([m, pi, po]):
        c = ws.cell(row=r, column=1 + j, value=v); c.fill = INPUT_FILL; c.border = BOX
        if j > 0:
            c.number_format = USD
MT = M0 + len(models) - 1  # 9
F0 = 12
header(ws, F0, ["Feature", "Model", "Calls per year", "Tokens in / call", "Tokens out / call", "$ per call", "₹ per call", "$ per year", "₹ per year", "Code path & cost guard"], widths=[40, 24, 14, 14, 14, 12, 12, 12, 14, 70])
features = [
    ("AI question generation (faculty)", "gemini-2.5-flash", f"={R['faculty']}*30", 2500, 4000, "routes/ai-questions.ts — TIER_CONFIG 100/500/1000 questions per day"),
    ("AI paper parsing (Gemini fallback)", "gemini-2.5-flash", f"={R['faculty']}*6*0.4", 10000, 5000, "paperParsing.ts — deterministic parser first"),
    ("AI grading suggestions (descriptive answers)", "gemini-2.5-flash", f"={R['students']}*{R['tests']}*0.3", 8000, 2000, "studentAssessments.ts — cached per attempt, ≤ 50 questions"),
    ("AI study-material packs (cached, shared)", "gemini-2.5-flash", 12000, 3000, 5000, "routes/ai-chat.ts /study-material — cache + 5/day/student + 400/day/college"),
    ("AI study assistant chat (students)", "gemini-2.5-flash", f"={R['students']}*0.3*150", 3000, 500, "routes/ai-chat.ts /chat — NO per-student daily cap yet; add 20/day"),
    ("Placement prep generation (final years)", "gemini-2.5-flash", f"={R['finalYear']}*20", 2000, 3000, "routes/prep.ts — rate limiter only"),
    ("", "gemini-2.5-flash-lite", 0, 0, 0, ""),
    ("", "gemini-2.5-flash-lite", 0, 0, 0, ""),
]
for i, (feat, model, calls, tin, tout, note) in enumerate(features):
    r = F0 + 1 + i
    for j, v in enumerate([feat, model, calls, tin, tout]):
        c = ws.cell(row=r, column=1 + j, value=v); c.fill = INPUT_FILL; c.border = BOX
    ws.cell(row=r, column=3).number_format = NUM
    ws.cell(row=r, column=3).fill = CALC_FILL if isinstance(calls, str) else INPUT_FILL
    lookup = f"$A${M0}:$C${MT}"
    c = ws.cell(row=r, column=6, value=f"=(D{r}*VLOOKUP(B{r},{lookup},2,FALSE)+E{r}*VLOOKUP(B{r},{lookup},3,FALSE))/1000000"); c.number_format = '"$"0.00000'; c.fill = CALC_FILL; c.border = BOX
    c = ws.cell(row=r, column=7, value=f"=F{r}*{R['fx']}"); c.number_format = INR2; c.fill = CALC_FILL; c.border = BOX
    c = ws.cell(row=r, column=8, value=f"=C{r}*F{r}"); c.number_format = USD; c.fill = CALC_FILL; c.border = BOX
    c = ws.cell(row=r, column=9, value=f"=H{r}*{R['fx']}"); c.number_format = INR; c.fill = CALC_FILL; c.border = BOX
    ws.cell(row=r, column=10, value=note).font = NOTE
FT = F0 + 1 + len(features)  # 21
dv = DataValidation(type="list", formula1=f"=$A${M0}:$A${MT}", allow_blank=True)
ws.add_data_validation(dv)
dv.add(f"B{F0+1}:B{FT-1}")
ws.cell(row=FT, column=1, value="AI cost per year — base estimate").font = BOLD
c = ws.cell(row=FT, column=9, value=f"=SUM(I{F0+1}:I{FT-1})"); c.number_format = INR; c.font = BOLD; c.fill = CALC_FILL; c.border = BOX
ws.cell(row=FT + 1, column=1, value="Safety buffer on AI (1.0 = none; raise to 1.5–2.0 if you do not add the per-student chat cap). P&L adds its own contingency.")
c = ws.cell(row=FT + 1, column=9, value=1.0); c.number_format = NUM2; c.fill = INPUT_FILL; c.border = BOX
ws.cell(row=FT + 2, column=1, value="AI BUDGET per year used in the plan").font = BOLD
c = ws.cell(row=FT + 2, column=9, value=f"=I{FT}*I{FT+1}"); c.number_format = INR; c.font = BOLD; c.fill = KEY_FILL; c.border = BOX
ws.cell(row=FT + 3, column=1, value="AI budget per student per year")
c = ws.cell(row=FT + 3, column=9, value=f"=I{FT+2}/{R['students']}"); c.number_format = INR2; c.fill = CALC_FILL; c.border = BOX
R["aiBase"] = ref(AS, "I", FT)
R["aiBudget"] = ref(AS, "I", FT + 2)

# ═════════════════════════════════════════════════════════════════════════════
# USAGE MODEL
# ═════════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet("Usage Model")
US = "Usage Model"
title(ws, "Usage model — Firestore reads & writes per role per day type, then month by month", "Part A is the steady-state daily profile (attendance ramp = 1). Part B applies the calendar, the per-month attendance ramp, fee/admission timing and one-off bursts, and charges only the reads/writes above the daily free quota.")
ws.cell(row=3, column=1, value="A. Daily reads & writes by day type (steady state)").font = BOLD
header(ws, 4, ["Component", "Teach", "IA", "Uni", "Result", "Office", "Off", "", "Teach", "IA", "Uni", "Result", "Office", "Off"], widths=[34, 12, 12, 12, 12, 12, 12, 2, 12, 12, 12, 12, 12, 12])
ws.cell(row=3, column=2, value="READS per day").font = BOLD
ws.cell(row=3, column=9, value="WRITES per day").font = BOLD

# event rates
ER = 23
ws.cell(row=ER - 1, column=1, value="Event rates").font = BOLD
rates = [
    ("attemptsIA", "Test attempts per IA day", f"={R['students']}*{R['tests']}/{R['calIA']}"),
    ("subsTeach", "Assignment submissions per teaching day", f"={R['students']}*{R['asg']}/{R['calTeach']}"),
    ("loansClass", "Library loan cycles per class day", f"={R['students']}*{R['libLoans']}/({R['calTeach']}+{R['calIA']})"),
    ("visitsClass", "Library visits per class day", f"={R['students']}*{R['libVisits']}/({R['calTeach']}+{R['calIA']})"),
]
for i, (k, lab, f) in enumerate(rates):
    r = ER + i
    ws.cell(row=r, column=1, value=lab).border = BOX
    c = ws.cell(row=r, column=2, value=f); c.number_format = NUM1; c.fill = CALC_FILL; c.border = BOX
    R[k] = ref(US, "B", r)

S = R  # shorthand
stu = lambda dau, loads, other: f"{S['students']}*{S[dau]}*({S[loads]}*({S['dashBase']}+{S['attReads']})+{S[other]})"
stuW = lambda dau, w: f"{S['students']}*{S[dau]}*{S[w]}"
partA = [
    ("Students", [stu('dauTeach', 'loadsTeach', 'otherTeach'), stu('dauIA', 'loadsTeach', 'otherTeach'), stu('dauUni', 'loadsOther', 'otherUni'), stu('dauResult', 'loadsOther', 'otherOff'), stu('dauOff', 'loadsOther', 'otherOff'), stu('dauOff', 'loadsOther', 'otherOff')],
     [stuW('dauTeach', 'wTeach'), stuW('dauIA', 'wTeach'), stuW('dauUni', 'wOff'), stuW('dauResult', 'wOff'), stuW('dauOff', 'wOff'), stuW('dauOff', 'wOff')]),
    ("Faculty", [f"{S['faculty']}*{S['fDauTeach']}*{S['fReadsTeach']}", f"{S['faculty']}*{S['fDauTeach']}*({S['fReadsTeach']}+{S['fReadsIAx']})", f"{S['faculty']}*{S['fDauUni']}*{S['fReadsUni']}", f"{S['faculty']}*{S['fDauOff']}*{S['fReadsOff']}", f"{S['faculty']}*{S['fDauOff']}*{S['fReadsOff']}", f"{S['faculty']}*{S['fDauOff']}*{S['fReadsOff']}"],
     [f"{S['faculty']}*{S['fDauTeach']}*{S['fWritesTeach']}", f"{S['faculty']}*{S['fDauTeach']}*({S['fWritesTeach']}+{S['fWritesIAx']})", f"{S['faculty']}*{S['fDauUni']}*{S['fWritesUni']}", f"{S['faculty']}*{S['fDauOff']}*{S['fWritesOff']}", f"{S['faculty']}*{S['fDauOff']}*{S['fWritesOff']}", f"{S['faculty']}*{S['fDauOff']}*{S['fWritesOff']}"]),
    ("HOD extra", [f"{S['hod']}*{S['hodR']}", f"{S['hod']}*{S['hodR']}", "0", "0", "0", "0"], [f"{S['hod']}*{S['hodW']}", f"{S['hod']}*{S['hodW']}", "0", "0", "0", "0"]),
    ("Mentor extra", [f"{S['mentor']}*{S['menR']}", f"{S['mentor']}*{S['menR']}", "0", "0", "0", "0"], [f"{S['mentor']}*{S['menW']}", f"{S['mentor']}*{S['menW']}", "0", "0", "0", "0"]),
    ("Attendance marking (sessions)", [f"{S['sessionsPerDay']}*{S['attR']}", f"{S['sessionsPerDay']}*{S['attIAf']}*{S['attR']}", "0", "0", "0", "0"], [f"{S['sessionsPerDay']}*{S['attW']}", f"{S['sessionsPerDay']}*{S['attIAf']}*{S['attW']}", "0", "0", "0", "0"]),
    ("Principal / admin / exam cell", [f"{S['admin']}*{S['admR']}"] * 5 + [f"{S['admin']}*{S['admR']}*{S['staffOffFactor']}"], [f"{S['admin']}*{S['admW']}"] * 5 + [f"{S['admin']}*{S['admW']}*{S['staffOffFactor']}"]),
    ("Accounts team", [f"{S['accounts']}*{S['accR']}"] * 5 + [f"{S['accounts']}*{S['accR']}*{S['staffOffFactor']}"], [f"{S['accounts']}*{S['accW']}"] * 5 + [f"{S['accounts']}*{S['accW']}*{S['staffOffFactor']}"]),
    ("Operations team", [f"{S['operations']}*{S['opsR']}"] * 5 + [f"{S['operations']}*{S['opsR']}*{S['staffOffFactor']}"], [f"{S['operations']}*{S['opsW']}"] * 5 + [f"{S['operations']}*{S['opsW']}*{S['staffOffFactor']}"]),
    ("Superadmin (vendor)", [f"{S['saTabs']}*{S['saR']}"] * 5 + ["0"], [f"{S['superadmin']}*{S['saW']}"] * 5 + ["0"]),
    ("STAFF SUBTOTAL", None, None),
    ("Assessments (online tests)", ["0", f"{S['attemptsIA']}*{S['tstR']}", "0", "0", "0", "0"], ["0", f"{S['attemptsIA']}*{S['tstW']}", "0", "0", "0", "0"]),
    ("Assignments", [f"{S['subsTeach']}*{S['asgR']}", "0", "0", "0", "0", "0"], [f"{S['subsTeach']}*{S['asgW']}", "0", "0", "0", "0", "0"]),
    ("Library loans + visits", [f"{S['loansClass']}*{S['loanR']}", f"{S['loansClass']}*{S['loanR']}", "0", "0", "0", "0"], [f"{S['loansClass']}*{S['loanW']}+{S['visitsClass']}", f"{S['loansClass']}*{S['loanW']}+{S['visitsClass']}", "0", "0", "0", "0"]),
    ("EVENTS SUBTOTAL", None, None),
    ("TOTAL per day", None, None),
    ("Free quota covers", None, None),
]
A0 = 5
for i, (lab, reads, writes) in enumerate(partA):
    r = A0 + i
    ws.cell(row=r, column=1, value=lab).border = BOX
    if lab in ("STAFF SUBTOTAL", "EVENTS SUBTOTAL", "TOTAL per day", "Free quota covers"):
        ws.cell(row=r, column=1).font = BOLD
    for blk, col0 in ((reads, 2), (writes, 9)):
        for j in range(6):
            col = col0 + j
            L = get_column_letter(col)
            if lab == "STAFF SUBTOTAL":
                f = f"=SUM({L}{A0+1}:{L}{A0+8})"
            elif lab == "EVENTS SUBTOTAL":
                f = f"=SUM({L}{A0+10}:{L}{A0+12})"
            elif lab == "TOTAL per day":
                f = f"={L}{A0}+{L}{A0+9}+{L}{A0+13}"
            elif lab == "Free quota covers":
                free = S['freeReads'] if col0 == 2 else S['freeWrites']
                f = f"=IF({L}{A0+14}>0,MIN(1,{free}/{L}{A0+14}),1)"
            else:
                f = "=" + blk[j]
            c = ws.cell(row=r, column=col, value=f)
            c.number_format = PCT if lab == "Free quota covers" else NUM
            c.fill = KEY_FILL if lab in ("TOTAL per day",) else CALC_FILL
            c.border = BOX
            if lab in ("STAFF SUBTOTAL", "EVENTS SUBTOTAL", "TOTAL per day"):
                c.font = BOLD
STAFF_ROW, EVENT_ROW, TOTAL_ROW = A0 + 9, A0 + 13, A0 + 14
R["dayTeachReads"] = ref(US, "B", TOTAL_ROW)
R["dayIAReads"] = ref(US, "C", TOTAL_ROW)
R["dayOffReads"] = ref(US, "G", TOTAL_ROW)
R["dayTeachWrites"] = ref(US, "I", TOTAL_ROW)
R["dayIAWrites"] = ref(US, "J", TOTAL_ROW)

# Part B — monthly grid
B0 = 30
ws.cell(row=B0 - 2, column=1, value="B. Month-by-month grid (free quota applied per day; bursts are fully billable because they land on days already over quota)").font = BOLD
gcols = ["Month", "Teach", "IA", "Uni", "Result", "Office", "Off", "Working days", "Ramp", "Att. reads / load", "Fee collections", "Admissions", "Spread reads / working day", "Spread writes / working day",
         "Reads/day Teach", "Reads/day IA", "Reads/day Uni", "Reads/day Result", "Reads/day Office", "Reads/day Off",
         "Writes/day Teach", "Writes/day IA", "Writes/day Uni", "Writes/day Result", "Writes/day Office", "Writes/day Off",
         "Burst reads", "Burst writes", "TOTAL reads", "TOTAL writes", "BILLABLE reads", "BILLABLE writes", "Function invocations",
         "Attendance docs added", "Firestore GiB (cum.)", "Files GB added", "Files GB (cum.)", "Downloads GB", "Hosting GB", "Peak reads / day"]
header(ws, B0 - 1, gcols)
for i in range(len(gcols)):
    ws.column_dimensions[get_column_letter(1 + i)].width = 13 if i else 11
ws.column_dimensions["A"].width = 34
ws.row_dimensions[B0 - 1].height = 42
G0 = B0
for i in range(12):
    r = G0 + i
    cr = CAL0 + i
    f = {}
    f["A"] = f"=Calendar!A{cr}"
    for L, cl in zip("BCDEFG", "BCDEFG"):
        f[L] = f"=Calendar!{cl}{cr}"
    f["H"] = f"=Calendar!H{cr}"
    f["I"] = f"=Calendar!J{cr}"
    f["J"] = f"={S['attReads']}*I{r}"
    f["K"] = f"={S['feeColl']}*Calendar!K{cr}"
    f["L"] = f"={S['admissions']}*Calendar!L{cr}"
    f["M"] = f"=IF(H{r}>0,(K{r}*{S['feeR']}+L{r}*{S['admisR']})/H{r},0)"
    f["N"] = f"=IF(H{r}>0,(K{r}*{S['feeW']}+L{r}*{S['admisW']})/H{r},0)"
    def sread(dau, loads, other):
        return f"{S['students']}*{S[dau]}*({S[loads]}*({S['dashBase']}+J{r})+{S[other]})"
    f["O"] = f"={sread('dauTeach','loadsTeach','otherTeach')}+B${STAFF_ROW}+B${EVENT_ROW}+M{r}"
    f["P"] = f"={sread('dauIA','loadsTeach','otherTeach')}+C${STAFF_ROW}+C${EVENT_ROW}+M{r}"
    f["Q"] = f"={sread('dauUni','loadsOther','otherUni')}+D${STAFF_ROW}+D${EVENT_ROW}+M{r}"
    f["R"] = f"={sread('dauResult','loadsOther','otherOff')}+E${STAFF_ROW}+E${EVENT_ROW}+M{r}"
    f["S"] = f"={sread('dauOff','loadsOther','otherOff')}+F${STAFF_ROW}+F${EVENT_ROW}+M{r}"
    f["T"] = f"={sread('dauOff','loadsOther','otherOff')}+G${STAFF_ROW}+G${EVENT_ROW}"
    f["U"] = f"={S['students']}*{S['dauTeach']}*{S['wTeach']}+I${STAFF_ROW}+I${EVENT_ROW}+N{r}"
    f["V"] = f"={S['students']}*{S['dauIA']}*{S['wTeach']}+J${STAFF_ROW}+J${EVENT_ROW}+N{r}"
    f["W"] = f"={S['students']}*{S['dauUni']}*{S['wOff']}+K${STAFF_ROW}+K${EVENT_ROW}+N{r}"
    f["X"] = f"={S['students']}*{S['dauResult']}*{S['wOff']}+L${STAFF_ROW}+L${EVENT_ROW}+N{r}"
    f["Y"] = f"={S['students']}*{S['dauOff']}*{S['wOff']}+M${STAFF_ROW}+M${EVENT_ROW}+N{r}"
    f["Z"] = f"={S['students']}*{S['dauOff']}*{S['wOff']}+N${STAFF_ROW}+N${EVENT_ROW}"
    f["AA"] = f"=Calendar!M{cr}*{S['students']}+Calendar!E{cr}*{S['students']}+Calendar!Q{cr}*{S['noDuesR']}+{S['students']}*{S['syncs']}/12+{S['reportR']}*{S['reports']}/12"
    f["AB"] = f"=Calendar!M{cr}*{S['students']}*{S['chW']}+Calendar!N{cr}*{S['students']}+Calendar!O{cr}*{S['ttWrites']}+Calendar!E{cr}*{S['students']}+Calendar!Q{cr}*{S['finalYear']}*{S['noDuesSign']}+L{r}"
    f["AC"] = f"=B{r}*O{r}+C{r}*P{r}+D{r}*Q{r}+E{r}*R{r}+F{r}*S{r}+G{r}*T{r}+AA{r}"
    f["AD"] = f"=B{r}*U{r}+C{r}*V{r}+D{r}*W{r}+E{r}*X{r}+F{r}*Y{r}+G{r}*Z{r}+AB{r}"
    fr = S['freeReads']; fw = S['freeWrites']
    f["AE"] = f"=B{r}*MAX(0,O{r}-{fr})+C{r}*MAX(0,P{r}-{fr})+D{r}*MAX(0,Q{r}-{fr})+E{r}*MAX(0,R{r}-{fr})+F{r}*MAX(0,S{r}-{fr})+G{r}*MAX(0,T{r}-{fr})+AA{r}"
    f["AF"] = f"=B{r}*MAX(0,U{r}-{fw})+C{r}*MAX(0,V{r}-{fw})+D{r}*MAX(0,W{r}-{fw})+E{r}*MAX(0,X{r}-{fw})+F{r}*MAX(0,Y{r}-{fw})+G{r}*MAX(0,Z{r}-{fw})+AB{r}"
    st = S['students']; cpl = S['callsPerLoad']
    f["AG"] = (f"={st}*{S['dauTeach']}*{S['loadsTeach']}*{cpl}*B{r}+({st}*{S['dauIA']}*{S['loadsTeach']}*{cpl}+{S['attemptsIA']}*{S['tstInv']})*C{r}"
               f"+{st}*{S['dauUni']}*{S['loadsOther']}*{cpl}*D{r}+{st}*{S['dauResult']}*{S['loadsOther']}*{cpl}*E{r}+{st}*{S['dauOff']}*{S['loadsOther']}*{cpl}*(F{r}+G{r})+{S['subsTeach']}*{S['asgInv']}*B{r}")
    f["AH"] = f"={S['sessionsPerDay']}*{S['sectionSize']}*(B{r}+C{r}*{S['attIAf']})"
    prev_fs = f"AI{r-1}" if i else S['fs0']
    f["AI"] = f"={prev_fs}+AH{r}*{S['attDocKB']}/1048576+({S['visitsClass']}*(B{r}+C{r})*0.5+{S['loansClass']}*(B{r}+C{r}))/1048576+{S['attemptsIA']}*C{r}*{S['attemptKB']}/1048576+0.05"
    f["AJ"] = f"={S['subsTeach']}*B{r}*{S['asgMB']}/1024+(Calendar!M{cr}+Calendar!P{cr})*{st}*{S['pdfKB']}/1048576+L{r}*3/1024" + (f"+{S['cs0']}+{S['matGB']}" if i == 0 else "")
    prev_cs = f"AK{r-1}" if i else "0"
    f["AK"] = f"={prev_cs}+AJ{r}"
    f["AL"] = f"=({st}*{S['matDl']}*{S['matMB']}/1024)*(B{r}+C{r})/({S['calTeach']}+{S['calIA']})+{S['subsTeach']}*B{r}*{S['asgMB']}/1024+(Calendar!M{cr}+Calendar!P{cr})*{st}*{S['pdfKB']}/1048576*2"
    f["AM"] = f"={S['users']}*{S['bundleMB']}*{S['deploys']}/1024+({st}*{S['hostDau']}+{S['faculty']})*{S['deltaKB']}*30/1048576"
    f["AN"] = f"=MAX(O{r}:T{r})"
    for L, formula in f.items():
        c = ws[f"{L}{r}"]
        c.value = formula
        c.fill = CALC_FILL
        c.border = BOX
        c.number_format = NUM2 if L in ("I", "AI", "AJ", "AK", "AL", "AM") else NUM
        if L in ("AC", "AD", "AE", "AF"):
            c.fill = KEY_FILL
GT = G0 + 12  # totals row
ws.cell(row=GT, column=1, value="YEAR TOTAL").font = BOLD
for L in ["B", "C", "D", "E", "F", "G", "H", "AA", "AB", "AC", "AD", "AE", "AF", "AG", "AH"]:
    c = ws[f"{L}{GT}"]; c.value = f"=SUM({L}{G0}:{L}{GT-1})"; c.number_format = NUM; c.font = BOLD; c.fill = KEY_FILL; c.border = BOX
c = ws[f"AN{GT}"]; c.value = f"=MAX(AN{G0}:AN{GT-1})"; c.number_format = NUM; c.font = BOLD; c.fill = KEY_FILL; c.border = BOX
c = ws[f"AI{GT}"]; c.value = f"=AI{GT-1}"; c.number_format = NUM2; c.font = BOLD; c.fill = KEY_FILL; c.border = BOX
c = ws[f"AK{GT}"]; c.value = f"=AK{GT-1}"; c.number_format = NUM2; c.font = BOLD; c.fill = KEY_FILL; c.border = BOX
R["yrReads"] = ref(US, "AC", GT); R["yrWrites"] = ref(US, "AD", GT); R["yrBillReads"] = ref(US, "AE", GT); R["yrBillWrites"] = ref(US, "AF", GT)
R["yrInvocations"] = ref(US, "AG", GT); R["peakReads"] = ref(US, "AN", GT); R["fsEnd"] = ref(US, "AI", GT); R["csEnd"] = ref(US, "AK", GT)
ws.freeze_panes = ws[f"B{B0}"]

# ═════════════════════════════════════════════════════════════════════════════
# MONTHLY PLAN
# ═════════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet("Monthly Plan")
MS = "Monthly Plan"
title(ws, "Monthly cost plan — cloud (Firebase), AI, overheads and team", "Cloud in USD then INR (ex-GST). AI budget distributed by the Calendar AI weights. Overheads and team are the per-college allocations from 'Team & Overheads' ÷ 12.")
mcols = ["Month", "Reads", "Writes", "Billable reads", "Billable writes", "Reads $", "Writes $", "Firestore storage $", "Files storage $", "Downloads $", "Hosting $", "Functions $", "Fixed $", "CLOUD $", "CLOUD ₹ (ex-GST)", "GST on cloud ₹", "AI ₹", "Overheads ₹", "Team ₹", "MONTH TOTAL ₹", "Cumulative ₹", "Peak reads / day"]
header(ws, 3, mcols, widths=[11, 14, 12, 14, 13, 10, 10, 11, 11, 11, 10, 10, 9, 11, 14, 12, 12, 12, 13, 15, 15, 14])
ws.row_dimensions[3].height = 40
P0 = 4
for i in range(12):
    r = P0 + i
    g = G0 + i
    f = {
        "A": f"='{US}'!A{g}", "B": f"='{US}'!AC{g}", "C": f"='{US}'!AD{g}", "D": f"='{US}'!AE{g}", "E": f"='{US}'!AF{g}",
        "F": f"=D{r}/100000*{S['readPrice']}", "G": f"=E{r}/100000*{S['writePrice']}",
        "H": f"=MAX(0,'{US}'!AI{g}-{S['fsStorFree']})*{S['fsStorPrice']}",
        "I": f"=MAX(0,'{US}'!AK{g}-{S['csStorFree']})*{S['csStorPrice']}",
        "J": f"=MAX(0,'{US}'!AL{g}-{S['dlFree']})*{S['dlPrice']}",
        "K": f"=MAX(0,'{US}'!AM{g}-{S['hostFree']})*{S['hostPrice']}",
        "L": f"={S['funcUsd']}", "M": f"={S['fixedUsd']}",
        "N": f"=SUM(F{r}:M{r})", "O": f"=N{r}*{S['fx']}", "P": f"=O{r}*{S['gst']}",
        "Q": f"={S['aiBudget']}*Calendar!R{CAL0+i}", "R": f"={S['ohAlloc']}/12", "S": f"={S['teamAlloc']}/12",
        "T": f"=O{r}+P{r}*(1-{S['gstRec']})+Q{r}+R{r}+S{r}", "U": f"=T{r}" if i == 0 else f"=U{r-1}+T{r}",
        "V": f"='{US}'!AN{g}",
    }
    for L, formula in f.items():
        c = ws[f"{L}{r}"]; c.value = formula; c.fill = CALC_FILL; c.border = BOX
        c.number_format = USD if L in "FGHIJKLMN" else INR if L in "OPQRSTU" else NUM
        if L in ("N", "O", "T", "U"):
            c.fill = KEY_FILL; c.font = BOLD
PT = P0 + 12
ws.cell(row=PT, column=1, value="YEAR").font = BOLD
for L in "BCDEFGHIJKLMNOPQRST":
    c = ws[f"{L}{PT}"]; c.value = f"=SUM({L}{P0}:{L}{PT-1})"; c.font = BOLD; c.fill = KEY_FILL; c.border = BOX
    c.number_format = USD if L in "FGHIJKLMN" else INR if L in "OPQRST" else NUM
c = ws[f"V{PT}"]; c.value = f"=MAX(V{P0}:V{PT-1})"; c.number_format = NUM; c.font = BOLD; c.fill = KEY_FILL; c.border = BOX
for k, L in {"yrReadsUsd": "F", "yrWritesUsd": "G", "yrFsStorUsd": "H", "yrCsStorUsd": "I", "yrDlUsd": "J", "yrHostUsd": "K", "yrFuncUsd": "L", "yrFixedUsd": "M", "yrCloudUsd": "N", "yrCloudInr": "O", "yrGstInr": "P", "yrAiInr": "Q", "yrOhInr": "R", "yrTeamInr": "S", "yrTotalInr": "T"}.items():
    R[k] = ref(MS, L, PT)
ws.freeze_panes = "B4"

# ═════════════════════════════════════════════════════════════════════════════
# ANNUAL SUMMARY
# ═════════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet("Annual Summary")
ANS = "Annual Summary"
title(ws, "Annual cost summary, usage statistics and break-even", "Per student = ÷ students · per user = ÷ (students + college staff).")
header(ws, 3, ["Cost line", "₹ per year", "₹ lakh", "Per student / yr", "Per user / yr", "% of recurring"], widths=[56, 16, 10, 16, 14, 14])
lines = [
    ("Firestore reads", f"={S['yrReadsUsd']}*{S['fx']}"),
    ("Firestore writes", f"={S['yrWritesUsd']}*{S['fx']}"),
    ("Firestore storage", f"={S['yrFsStorUsd']}*{S['fx']}"),
    ("Cloud Storage — files stored", f"={S['yrCsStorUsd']}*{S['fx']}"),
    ("Cloud Storage — downloads", f"={S['yrDlUsd']}*{S['fx']}"),
    ("Firebase Hosting", f"={S['yrHostUsd']}*{S['fx']}"),
    ("Cloud Functions", f"={S['yrFuncUsd']}*{S['fx']}"),
    ("Fixed items (Artifact Registry, Secret Manager, RTDB)", f"={S['yrFixedUsd']}*{S['fx']}"),
    ("CLOUD SUBTOTAL (ex-GST)", "=SUM(B4:B11)"),
    ("GST on cloud treated as cost (0 if recoverable)", f"={S['yrGstInr']}*(1-{S['gstRec']})"),
    ("AI / LLM budget", f"={S['yrAiInr']}"),
    ("Overheads allocated", f"={S['yrOhInr']}"),
    ("Team allocated", f"={S['yrTeamInr']}"),
    ("RECURRING TOTAL per year", "=B12+B13+B14+B15+B16"),
    ("Onboarding out-of-pocket (year 1 only)", f"={S['onboardCost']}"),
    ("YEAR-1 TOTAL", "=B17+B18"),
]
for i, (lab, f) in enumerate(lines):
    r = 4 + i
    bold = lab.isupper() or lab.startswith("CLOUD") or lab.startswith("RECURRING") or lab.startswith("YEAR")
    ws.cell(row=r, column=1, value=lab).border = BOX
    if bold:
        ws.cell(row=r, column=1).font = BOLD
    c = ws.cell(row=r, column=2, value=f); c.number_format = INR; c.border = BOX; c.fill = KEY_FILL if bold else CALC_FILL
    c = ws.cell(row=r, column=3, value=f"=B{r}/100000"); c.number_format = LAKH; c.border = BOX; c.fill = CALC_FILL
    c = ws.cell(row=r, column=4, value=f"=B{r}/{S['students']}"); c.number_format = INR2; c.border = BOX; c.fill = CALC_FILL
    c = ws.cell(row=r, column=5, value=f"=B{r}/{S['users']}"); c.number_format = INR2; c.border = BOX; c.fill = CALC_FILL
    c = ws.cell(row=r, column=6, value=f"=IF($B$17>0,B{r}/$B$17,0)"); c.number_format = PCT; c.border = BOX; c.fill = CALC_FILL
    if bold:
        for col in range(2, 7):
            ws.cell(row=r, column=col).font = BOLD
R["cloudInr"] = ref(ANS, "B", 12); R["gstCostInr"] = ref(ANS, "B", 13); R["recurring"] = ref(ANS, "B", 17); R["year1"] = ref(ANS, "B", 19)

header(ws, 22, ["Usage statistic", "Value", "", "", "", ""])
stats = [
    ("Firestore reads per year", f"={S['yrReads']}", NUM),
    ("  covered by the daily free quota", f"={S['yrReads']}-{S['yrBillReads']}", NUM),
    ("  share covered by free quota", f"=IF({S['yrReads']}>0,({S['yrReads']}-{S['yrBillReads']})/{S['yrReads']},0)", PCT),
    ("  billable reads", f"={S['yrBillReads']}", NUM),
    ("Firestore writes per year", f"={S['yrWrites']}", NUM),
    ("  covered by the daily free quota", f"={S['yrWrites']}-{S['yrBillWrites']}", NUM),
    ("  share covered by free quota", f"=IF({S['yrWrites']}>0,({S['yrWrites']}-{S['yrBillWrites']})/{S['yrWrites']},0)", PCT),
    ("  billable writes", f"={S['yrBillWrites']}", NUM),
    ("Peak reads in a single day", f"={S['peakReads']}", NUM),
    ("Teaching-day reads (steady state)", f"={S['dayTeachReads']}", NUM),
    ("Teaching-day writes (steady state)", f"={S['dayTeachWrites']}", NUM),
    ("IA-day reads / writes", f"={S['dayIAReads']}", NUM),
    ("Function invocations per year (free tier 24M)", f"={S['yrInvocations']}", NUM),
    ("Firestore data at year end (GiB)", f"={S['fsEnd']}", NUM2),
    ("Files in Cloud Storage at year end (GB)", f"={S['csEnd']}", NUM2),
    ("Cloud cost per month (average, ex-GST)", f"={S['cloudInr']}/12", INR),
]
for i, (lab, f, fmt) in enumerate(stats):
    r = 23 + i
    ws.cell(row=r, column=1, value=lab).border = BOX
    c = ws.cell(row=r, column=2, value=f); c.number_format = fmt; c.border = BOX; c.fill = CALC_FILL
ws.cell(row=34, column=3, value=f"={S['dayIAWrites']}").number_format = NUM

BE = 41
header(ws, BE, ["Break-even (no profit, no loss)", "₹ per year", "₹ lakh", "Per student / yr", "Per user / yr", "Per student / month"])
be_lines = [
    ("Cash floor — cloud + AI + overheads only (team treated as already paid)", "=B12+B13+B14+B15"),
    ("TRUE BREAK-EVEN — recurring cost including the team", "=B17"),
    ("Break-even + contingency (Inputs)", f"=B17*(1+{S['cont']})"),
    ("Price for target margin — low", f"=B17*(1+{S['cont']})/(1-{S['m1']})"),
    ("Price for target margin — mid", f"=B17*(1+{S['cont']})/(1-{S['m2']})"),
    ("Price for target margin — high", f"=B17*(1+{S['cont']})/(1-{S['m3']})"),
]
for i, (lab, f) in enumerate(be_lines):
    r = BE + 1 + i
    ws.cell(row=r, column=1, value=lab).border = BOX
    if "TRUE" in lab:
        ws.cell(row=r, column=1).font = BOLD
    c = ws.cell(row=r, column=2, value=f); c.number_format = INR; c.border = BOX; c.fill = KEY_FILL if "TRUE" in lab else CALC_FILL
    c = ws.cell(row=r, column=3, value=f"=B{r}/100000"); c.number_format = LAKH; c.border = BOX; c.fill = CALC_FILL
    c = ws.cell(row=r, column=4, value=f"=B{r}/{S['students']}"); c.number_format = INR; c.border = BOX; c.fill = KEY_FILL; c.font = BOLD
    c = ws.cell(row=r, column=5, value=f"=B{r}/{S['users']}"); c.number_format = INR; c.border = BOX; c.fill = CALC_FILL
    c = ws.cell(row=r, column=6, value=f"=D{r}/12"); c.number_format = INR; c.border = BOX; c.fill = CALC_FILL
R["bePerStudent"] = ref(ANS, "D", BE + 2)
ws.freeze_panes = "A4"

# ═════════════════════════════════════════════════════════════════════════════
# PRICING & P&L
# ═════════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet("Pricing & P&L")
PS = "Pricing & P&L"
title(ws, "Pricing & P&L — set your price, read the margin", "Revenue and costs ex-GST. Costs come from Annual Summary; team & overheads from 'Team & Overheads' (allocation divisor = colleges sharing the team).")
ws.column_dimensions["A"].width = 54
for L in "BCDEFGHIJKLMN":
    ws.column_dimensions[L].width = 15
section(ws, 3, "Pricing inputs", span=2, col=1)
pin = [
    ("price", "Price per student per year (₹)", 599, INR),
    ("disc", "Discount offered", 0.0, PCT),
    ("onbFee", "Onboarding fee charged in year 1 (₹)", 250000, INR),
    ("esc", "Annual price escalation from year 2", 0.05, PCT),
    ("growth", "Student growth per year", 0.0, PCT),
    ("infl", "Cost inflation per year (team & overheads)", 0.10, PCT),
    ("years", "Contract length (years, for information)", 3, NUM),
]
for i, (k, lab, v, fmt) in enumerate(pin):
    r = 4 + i
    ws.cell(row=r, column=1, value=lab).border = BOX
    c = ws.cell(row=r, column=2, value=v); c.number_format = fmt; c.fill = INPUT_FILL; c.border = BOX
    R[k] = ref(PS, "B", r)
ws.cell(row=11, column=1, value="Colleges sharing the team (change on 'Team & Overheads')").border = BOX
c = ws.cell(row=11, column=2, value=f"={S['colleges']}"); c.fill = CALC_FILL; c.border = BOX
ws.cell(row=12, column=1, value="Contingency on costs (change on Inputs)").border = BOX
c = ws.cell(row=12, column=2, value=f"={S['cont']}"); c.number_format = PCT; c.fill = CALC_FILL; c.border = BOX

section(ws, 14, "Year-1 P&L for this college", span=3, col=1)
header(ws, 15, ["Line", "₹", "₹ lakh"])
pl = [
    ("Students billed", f"={S['students']}", NUM, False),
    ("Subscription revenue = students × price × (1 − discount)", f"=B16*{S['price']}*(1-{S['disc']})", INR, False),
    ("Onboarding fee revenue", f"={S['onbFee']}", INR, False),
    ("TOTAL REVENUE (ex-GST)", "=B17+B18", INR, True),
    ("GST you will add on the invoice (information)", f"=B19*{S['gst']}", INR, False),
    ("Cloud — Firebase / Google Cloud (ex-GST)", f"={S['cloudInr']}", INR, False),
    ("GST on cloud treated as cost", f"={S['gstCostInr']}", INR, False),
    ("AI / LLM budget", f"={S['yrAiInr']}", INR, False),
    ("Overheads allocated", f"={S['yrOhInr']}", INR, False),
    ("Team allocated", f"={S['yrTeamInr']}", INR, False),
    ("Onboarding out-of-pocket", f"={S['onboardCost']}", INR, False),
    ("Contingency", f"=SUM(B21:B26)*{S['cont']}", INR, False),
    ("TOTAL COST", "=SUM(B21:B27)", INR, True),
    ("GROSS PROFIT", "=B19-B28", INR, True),
    ("GROSS MARGIN", "=IF(B19>0,B29/B19,0)", PCT, True),
    ("Profit per student", f"=B29/{S['students']}", INR, False),
    ("Profit per user", f"=B29/{S['users']}", INR, False),
    ("Recurring gross margin (years 2+, no onboarding on either side)", f"=IF(B17>0,(B17-(B21+B22+B23+B24+B25)*(1+{S['cont']}))/B17,0)", PCT, True),
]
for i, (lab, f, fmt, bold) in enumerate(pl):
    r = 16 + i
    ws.cell(row=r, column=1, value=lab).border = BOX
    c = ws.cell(row=r, column=2, value=f); c.number_format = fmt; c.border = BOX; c.fill = KEY_FILL if bold else CALC_FILL
    if bold:
        ws.cell(row=r, column=1).font = BOLD; c.font = BOLD
    if fmt == INR:
        c2 = ws.cell(row=r, column=3, value=f"=B{r}/100000"); c2.number_format = LAKH; c2.border = BOX; c2.fill = CALC_FILL

section(ws, 36, "Minimum bid and target prices (recurring basis, per student per year)", span=4, col=1)
header(ws, 37, ["Basis", "Annual ₹", "Per student / yr", "Per user / yr"])
bids = [
    ("Break-even — zero margin, zero buffer", f"={S['recurring']}"),
    ("MINIMUM BID — break-even + contingency", f"={S['recurring']}*(1+{S['cont']})"),
    ("Price for target margin — low", f"={S['recurring']}*(1+{S['cont']})/(1-{S['m1']})"),
    ("Price for target margin — mid", f"={S['recurring']}*(1+{S['cont']})/(1-{S['m2']})"),
    ("Price for target margin — high", f"={S['recurring']}*(1+{S['cont']})/(1-{S['m3']})"),
    ("YOUR PRICE (from inputs above)", f"={S['price']}*(1-{S['disc']})*{S['students']}"),
]
for i, (lab, f) in enumerate(bids):
    r = 38 + i
    bold = lab.isupper() or lab.startswith("MINIMUM") or lab.startswith("YOUR")
    ws.cell(row=r, column=1, value=lab).border = BOX
    c = ws.cell(row=r, column=2, value=f); c.number_format = INR; c.border = BOX; c.fill = CALC_FILL
    c = ws.cell(row=r, column=3, value=f"=B{r}/{S['students']}"); c.number_format = INR; c.border = BOX; c.fill = KEY_FILL if bold else CALC_FILL
    c = ws.cell(row=r, column=4, value=f"=B{r}/{S['users']}"); c.number_format = INR; c.border = BOX; c.fill = CALC_FILL
    if bold:
        for col in range(1, 5):
            ws.cell(row=r, column=col).font = BOLD

section(ws, 46, "3-year P&L (students grow, price escalates, team & overheads inflate; cloud & AI scale with students)", span=14, col=1)
header(ws, 47, ["Year", "Students", "Price / student", "Subscription revenue", "Onboarding revenue", "TOTAL REVENUE", "Cloud + GST cost", "AI", "Overheads", "Team", "Onboarding cost", "Contingency", "TOTAL COST", "GROSS PROFIT", "MARGIN", "Cumulative profit"])
for L in "OP":
    ws.column_dimensions[L].width = 14
for y in range(3):
    r = 48 + y
    ws.cell(row=r, column=1, value=f"Year {y+1}").border = BOX
    f = {
        "B": f"=ROUND({S['students']}*(1+{S['growth']})^{y},0)",
        "C": f"={S['price']}*(1-{S['disc']})*(1+{S['esc']})^{y}",
        "D": f"=B{r}*C{r}",
        "E": f"={S['onbFee']}" if y == 0 else "=0",
        "F": f"=D{r}+E{r}",
        "G": f"=({S['cloudInr']}+{S['gstCostInr']})*B{r}/{S['students']}",
        "H": f"={S['yrAiInr']}*B{r}/{S['students']}",
        "I": f"={S['yrOhInr']}*(1+{S['infl']})^{y}",
        "J": f"={S['yrTeamInr']}*(1+{S['infl']})^{y}",
        "K": f"={S['onboardCost']}" if y == 0 else "=0",
        "L": f"=SUM(G{r}:K{r})*{S['cont']}",
        "M": f"=SUM(G{r}:L{r})",
        "N": f"=F{r}-M{r}",
        "O": f"=IF(F{r}>0,N{r}/F{r},0)",
        "P": f"=N{r}" if y == 0 else f"=P{r-1}+N{r}",
    }
    for L, formula in f.items():
        c = ws[f"{L}{r}"]; c.value = formula; c.border = BOX; c.fill = CALC_FILL
        c.number_format = NUM if L == "B" else PCT if L == "O" else INR
        if L in ("F", "M", "N", "O", "P"):
            c.fill = KEY_FILL; c.font = BOLD
ws.cell(row=51, column=1, value="3-YEAR TOTAL").font = BOLD
for L in "DEFGHIJKLMN":
    c = ws[f"{L}51"]; c.value = f"=SUM({L}48:{L}50)"; c.number_format = INR; c.font = BOLD; c.fill = KEY_FILL; c.border = BOX
c = ws["O51"]; c.value = "=IF(F51>0,N51/F51,0)"; c.number_format = PCT; c.font = BOLD; c.fill = KEY_FILL; c.border = BOX
ws.freeze_panes = "A4"

# ═════════════════════════════════════════════════════════════════════════════
# SENSITIVITY
# ═════════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet("Sensitivity")
title(ws, "Sensitivity — gross margin by price × colleges sharing the team; break-even by college size", "Recurring basis (no onboarding on either side), contingency applied. Edit the yellow row/column headers.")
ws.column_dimensions["A"].width = 30
for L in "BCDEFG":
    ws.column_dimensions[L].width = 14
ws.cell(row=3, column=1, value="Gross margin %  (rows: price per student per year · columns: colleges sharing the team)").font = BOLD
ws.cell(row=4, column=1, value="Price ₹ / student / yr  ↓   Colleges →").border = BOX
cols_c = [1, 2, 3, 5, 8]
for j, cnum in enumerate(cols_c):
    c = ws.cell(row=4, column=2 + j, value=cnum); c.fill = INPUT_FILL; c.border = BOX; c.font = BOLD
prices = [349, 399, 449, 499, 549, 599, 649, 699]
per_college_cost = f"({S['cloudInr']}+{S['gstCostInr']}+{S['yrAiInr']}+{S['ohPerCollege']})"
shared_pool = f"({S['teamTotal']}+{S['ohShared']})"
for i, p in enumerate(prices):
    r = 5 + i
    c = ws.cell(row=r, column=1, value=p); c.fill = INPUT_FILL; c.border = BOX; c.number_format = INR
    for j in range(len(cols_c)):
        L = get_column_letter(2 + j)
        f = f"=IF($A{r}*{S['students']}>0,1-({per_college_cost}+{shared_pool}/{L}$4)*(1+{S['cont']})/($A{r}*{S['students']}),0)"
        c = ws.cell(row=r, column=2 + j, value=f); c.number_format = PCT; c.fill = CALC_FILL; c.border = BOX
ws.cell(row=14, column=1, value="Green ≥ 30% · amber 15–30% · red < 15%").font = NOTE
from openpyxl.formatting.rule import CellIsRule
rng = f"B5:{get_column_letter(1+len(cols_c))}12"
ws.conditional_formatting.add(rng, CellIsRule(operator="greaterThanOrEqual", formula=["0.3"], fill=PatternFill("solid", fgColor="C6EFCE")))
ws.conditional_formatting.add(rng, CellIsRule(operator="between", formula=["0.15", "0.2999"], fill=PatternFill("solid", fgColor="FFEB9C")))
ws.conditional_formatting.add(rng, CellIsRule(operator="lessThan", formula=["0.15"], fill=PatternFill("solid", fgColor="FFC7CE")))

ws.cell(row=16, column=1, value="Break-even price ₹ / student / yr  (rows: students in the college · columns: colleges sharing the team)").font = BOLD
ws.cell(row=17, column=1, value="Students ↓   Colleges →").border = BOX
for j, cnum in enumerate(cols_c):
    c = ws.cell(row=17, column=2 + j, value=f"={get_column_letter(2+j)}4"); c.fill = CALC_FILL; c.border = BOX; c.font = BOLD
sizes = [2000, 3000, 4000, 5000, 6000, 8000, 10000]
var_per_student = f"(({S['cloudInr']}+{S['gstCostInr']}+{S['yrAiInr']})/{S['students']})"
for i, s_ in enumerate(sizes):
    r = 18 + i
    c = ws.cell(row=r, column=1, value=s_); c.fill = INPUT_FILL; c.border = BOX; c.number_format = NUM
    for j in range(len(cols_c)):
        L = get_column_letter(2 + j)
        f = f"=({var_per_student}*$A{r}+{S['ohPerCollege']}+{shared_pool}/{L}$17)*(1+{S['cont']})/$A{r}"
        c = ws.cell(row=r, column=2 + j, value=f); c.number_format = INR; c.fill = CALC_FILL; c.border = BOX
ws.cell(row=26, column=1, value="Cloud + AI scale with students (≈ ₹10 + ₹35 per student); team & shared overheads are divided by the number of colleges.").font = NOTE

# ═════════════════════════════════════════════════════════════════════════════
# BUILD COST
# ═════════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet("Build Cost")
title(ws, "What it costs to build a product like Vriddhi (216K lines of TypeScript, 121 pages, ~100 Cloud Functions)", "Lean = experienced 3–4 person team with AI-assisted development. Traditional = conventional team. Agency = fixed-bid at market hourly rates.")
ws.column_dimensions["A"].width = 70
for L in "BCDE":
    ws.column_dimensions[L].width = 18
section(ws, 3, "Rates", span=2, col=1)
rates_in = [("leanRate", "Blended loaded cost per person-month — lean team (₹)", 110000, INR), ("tradRate", "Blended loaded cost per person-month — traditional team (₹)", 120000, INR), ("agencyRate", "Agency rate per hour (₹; ₹1,500–3,000 typical)", 1500, INR), ("hoursPM", "Hours per person-month", 160, NUM), ("pmOverhead", "PM / QA / rework overhead", 0.20, PCT)]
for i, (k, lab, v, fmt) in enumerate(rates_in):
    r = 4 + i
    ws.cell(row=r, column=1, value=lab).border = BOX
    c = ws.cell(row=r, column=2, value=v); c.number_format = fmt; c.fill = INPUT_FILL; c.border = BOX
    R[k] = f"$B${r}"
header(ws, 10, ["Module", "Lean person-weeks", "Traditional person-weeks"])
mods = [("Auth, RBAC (10 roles), multi-tenant claims, provisioning, 1,800 lines of security rules + tests", 6, 14), ("Student portal — dashboard, attendance, timetable, tests, results, fees, materials, assignments, PWA", 10, 24), ("Faculty portal — attendance, schedule, question bank, paper authoring/review, assignments, grading, mentoring", 10, 24), ("College admin & office — analytics, curriculum + auto-mapping, timetable + auto-generator, scheme packs, fees + challans + Razorpay, admissions, accounts desk, operations desk, library, inventory, procurement", 20, 48), ("Superadmin — colleges, universities, imports, billing, health, question-bank seeding, access control", 6, 14), ("Assessment engine — scheduling, secure test flow, autosave, proctor events, grading, result import, grade records", 10, 24), ("AI layer — multi-provider, question generation, paper parsing, AI grading, study packs with cost guards, chat, prep, 6 languages", 8, 18), ("PDF & document pipeline — Puppeteer renderer with fallback, DOCX/PDF parsing, CSV/XLSX import/export", 4, 9), ("Domain content — curated question banks, syllabus JSON, BCU/KUD/NEP scheme presets", 5, 8), ("Quality — tests, rules tests, CI, audits, docs", 6, 14), ("Brand, design system, UI/UX, i18n", 3, 7)]
for i, (m, lean, trad) in enumerate(mods):
    r = 11 + i
    ws.cell(row=r, column=1, value=m).border = BOX
    for j, v in enumerate([lean, trad]):
        c = ws.cell(row=r, column=2 + j, value=v); c.fill = INPUT_FILL; c.border = BOX
MT2 = 11 + len(mods)
ws.cell(row=MT2, column=1, value="Subtotal person-weeks").font = BOLD
for L in "BC":
    c = ws[f"{L}{MT2}"]; c.value = f"=SUM({L}11:{L}{MT2-1})"; c.font = BOLD; c.fill = CALC_FILL; c.border = BOX
ws.cell(row=MT2 + 1, column=1, value="With PM / QA / rework overhead — person-weeks")
for L in "BC":
    c = ws[f"{L}{MT2+1}"]; c.value = f"={L}{MT2}*(1+{R['pmOverhead']})"; c.fill = CALC_FILL; c.border = BOX; c.number_format = NUM1
ws.cell(row=MT2 + 2, column=1, value="Person-months (÷ 4.33)")
for L in "BC":
    c = ws[f"{L}{MT2+2}"]; c.value = f"={L}{MT2+1}/4.33"; c.fill = CALC_FILL; c.border = BOX; c.number_format = NUM1
section(ws, MT2 + 4, "Other build costs (₹)", span=2, col=1)
others = [("AI development tools", 300000), ("Design / brand", 200000), ("Subject-matter experts (content)", 200000), ("Dev infrastructure during build", 50000)]
for i, (lab, v) in enumerate(others):
    r = MT2 + 5 + i
    ws.cell(row=r, column=1, value=lab).border = BOX
    c = ws.cell(row=r, column=2, value=v); c.number_format = INR; c.fill = INPUT_FILL; c.border = BOX
OT = MT2 + 5 + len(others)
ws.cell(row=OT, column=1, value="Other build costs total").font = BOLD
c = ws[f"B{OT}"]; c.value = f"=SUM(B{MT2+5}:B{OT-1})"; c.number_format = INR; c.font = BOLD; c.fill = CALC_FILL; c.border = BOX
header(ws, OT + 2, ["Delivery model", "People cost ₹", "Total ₹", "₹ crore"])
res = [("A. Lean in-house, AI-assisted", f"=B{MT2+2}*{R['leanRate']}"), ("B. Traditional in-house team", f"=C{MT2+2}*{R['tradRate']}"), ("C. Indian software agency (fixed bid at hourly rate)", f"=C{MT2+2}*{R['hoursPM']}*{R['agencyRate']}")]
for i, (lab, f) in enumerate(res):
    r = OT + 3 + i
    ws.cell(row=r, column=1, value=lab).border = BOX
    c = ws.cell(row=r, column=2, value=f); c.number_format = INR; c.fill = CALC_FILL; c.border = BOX
    c = ws.cell(row=r, column=3, value=f"=B{r}+$B${OT}"); c.number_format = INR; c.fill = KEY_FILL; c.border = BOX; c.font = BOLD
    c = ws.cell(row=r, column=4, value=f"=C{r}/10000000"); c.number_format = '0.00" Cr"'; c.fill = CALC_FILL; c.border = BOX

# ═════════════════════════════════════════════════════════════════════════════
# RESUME BUILDER ADD-ON
# ═════════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet("Resume Add-on")
RS = "Resume Add-on"
title(ws, "Resume Builder add-on — 5 ATS-safe templates, 3 PDF versions per template per student per year",
      "Yellow = edit. A 'download' = one server-rendered PDF version (headless Chrome on Cloud Functions, 2 GiB). Re-downloading an already generated PDF is free and does not consume a credit. Prices: Cloud Run Tier 2 (asia-south1) list prices; Firestore / Storage / Hosting prices come from the Inputs sheet.")
ws.column_dimensions["A"].width = 2
ws.column_dimensions["B"].width = 66
for L in "CDE":
    ws.column_dimensions[L].width = 19
ws.column_dimensions["F"].width = 95
X = {}
rrow = 4


def rin(key, label, value, fmt=NUM, unit="", note="", formula=False):
    global rrow
    ws.cell(row=rrow, column=2, value=label).border = BOX
    c = ws.cell(row=rrow, column=3, value=value)
    c.number_format = fmt
    c.border = BOX
    c.fill = CALC_FILL if formula else INPUT_FILL
    ws.cell(row=rrow, column=4, value=unit).border = BOX
    ws.cell(row=rrow, column=6, value=note).font = NOTE
    X[key] = f"$C${rrow}"
    rrow += 1


def rsec(text):
    global rrow
    rrow += 1
    section(ws, rrow, text, span=5)
    rrow += 1


rsec("1. Product rules")
rin("templates", "ATS-safe templates offered", 5, unit="templates")
rin("perTemplate", "PDF versions (downloads) allowed per template per student per year", 3, unit="per template")
rin("maxPerStudent", "Maximum PDF renders per student per year", f"={X['templates']}*{X['perTemplate']}", unit="per student", formula=True)
rin("addonPrice", "Add-on price charged to the college per student per year (₹)", 79, fmt=INR, unit="₹ / student / yr", note="what-if for the P&L rows below; the market-facing anchor is retail resume builders at ₹1,000–2,000 per MONTH per individual")

rsec("2. Unit costs per PDF render (server-side, enforceable credit)")
rin("secs", "Billable seconds per render (Chrome launch + render, incl. cold start share)", 8, unit="seconds", note="functions/src/utils/pdfRenderer.ts pattern: launch → setContent → pdf; warm ≈ 3–4 s, cold ≈ 8–10 s")
rin("memGiB", "Function memory", 2, unit="GiB", note="the existing api function already runs at 2 GiB for Puppeteer; 512 MiB was OOM-killed")
rin("vcpu", "vCPU per instance", 1, unit="vCPU")
rin("vcpuPrice", "Cloud Run Tier 2 vCPU price (request-based billing)", 0.0000336, fmt='"$"0.0000000', unit="$ per vCPU-second", note="asia-south1 is a Tier 2 region; Tier 1 (us-central1) is $0.000024")
rin("memPrice", "Cloud Run Tier 2 memory price", 0.0000035, fmt='"$"0.0000000', unit="$ per GiB-second", note="Tier 1 is $0.0000025")
rin("reqPrice", "Requests beyond 2 M free per month", 0.40, fmt=USD, unit="$ per million")
rin("freeShare", "Share of render compute absorbed by the Cloud Functions free tier", 0.5, fmt=PCT, note="free tier = 128,571 vCPU-s and 257,142 GiB-s per month in Tier 2; the base app uses ~33K vCPU-s a month, so most months the renders fit entirely. 0 = pay full list price (worst case)")
rin("pdfMB", "Size of one generated PDF", 0.25, fmt=NUM2, unit="MB", note="text PDF with 1–2 embedded font subsets; a rasterised (image) PDF would be 5–10× larger AND unreadable by ATS — never ship that")
rin("monthsStored", "Average months a generated PDF is kept in Cloud Storage during the year", 6, unit="months", note="keep every version for 12 months (or until 6 months after graduation); average age over the year ≈ 6 months")
rin("redl", "Free re-downloads of an already generated PDF (per version)", 1, unit="per version", note="egress multiplier = 1 + this")
rin("sessPerDl", "Editing sessions per PDF version", 1.2, fmt=NUM1, unit="sessions", note="students open the editor, tweak, preview — not every session ends in a download")
rin("writesPerSess", "Firestore writes per editing session (debounced autosave)", 40, unit="writes", note="autosave every ~10 s of typing; one resume document per student per template")
rin("readsPerSess", "Firestore reads per editing session", 8, unit="reads", note="resume doc + credit ledger + template meta + profile prefill")
rin("writesPerDl", "Firestore writes per download (credit transaction + ledger row + audit log)", 3, unit="writes")
rin("hostMB", "Hosting transfer per session (builder bundle + fonts, cached after the first visit)", 0.8, fmt=NUM2, unit="MB")

rsec("3. Optional AI assist (bullet rewrite, summary, JD keyword suggestions)")
rin("aiOn", "AI assist enabled? (1 = yes, 0 = no)", 1)
rin("aiCap", "Hard cap on AI-assist calls per student per year", 20, unit="calls", note="cost guard — same pattern as the study-pack limiter in routes/ai-chat.ts")
rin("aiIn", "Tokens in per call", 1500, unit="tokens")
rin("aiOut", "Tokens out per call", 500, unit="tokens")
rin("aiPIn", "Model price — input ($ per 1M tokens)", f"='{AS}'!$B$4", fmt=USD, formula=True, note="gemini-2.5-flash from the AI Costing sheet; switch to $B$5/$C$5 for flash-lite (≈ 4× cheaper)")
rin("aiPOut", "Model price — output ($ per 1M tokens)", f"='{AS}'!$C$4", fmt=USD, formula=True)

rsec("4. Build & run effort (in-house team — already salaried in 'Team & Overheads')")
rin("dayCost", "Loaded cost per person-day (₹)", "=30000/22", fmt=INR, unit="₹ / person-day", formula=True, note="₹30,000 gross per month ÷ 22 working days. This time is ALREADY paid for in the base plan — it is an allocation, not new cash")
rin("agencyDay", "Agency cost per person-day (₹) — if outsourced instead", f"='Build Cost'!{R['agencyRate']}*8", fmt=INR, unit="₹ / person-day", formula=True, note="from the Build Cost sheet's hourly rate × 8 h")
rin("buildCont", "Build contingency", 0.2, fmt=PCT)
rin("maintDays", "Maintenance & support per year (template tweaks, credit resets, parser regressions)", 12, unit="person-days")
rin("amortYears", "Years over which to spread the build cost", 3, unit="years")

# Build effort table
rrow += 1
section(ws, rrow, "5. Build effort — person-days (lean in-house, AI-assisted development)", span=5)
rrow += 1
header(ws, rrow, ["Work item", "Person-days"], col=2)
rrow += 1
tasks = [
    ("Resume data model, per-student documents, security rules, autosave, profile prefill from the student record", 5),
    ("Editor UI — sections (contact, summary, education, internships/experience, projects, skills, certifications, achievements, languages), reorder, live preview, mobile layout", 12),
    ("5 ATS-safe templates — single column, standard headings, real text, A4 + Letter, page-break rules, open-licence fonts (2 days each)", 10),
    ("Server-side PDF — dedicated 2 GiB function, credit transaction (render + decrement + ledger in one write), Cloud Storage, signed re-download URLs, watermarked unlimited preview", 6),
    ("ATS checker — rule-based score: sections present, contact block, heading names, no tables/images/columns, length, keyword match against a pasted job description, fix-it hints", 4),
    ("AI assist (optional) — bullet rewrite, summary draft, JD keyword suggestions, with the per-student cap and cost guard", 3),
    ("Admin & superadmin — enable the add-on per college, template on/off, credits view/reset, usage & download dashboard, per-college export", 5),
    ("QA — run every template through 2–3 open-source resume parsers, device matrix, print fidelity, load test at 20 renders/min", 5),
]
T0 = rrow
for lab, d in tasks:
    ws.cell(row=rrow, column=2, value=lab).border = BOX
    ws.cell(row=rrow, column=2).alignment = Alignment(wrap_text=True, vertical="top")
    c = ws.cell(row=rrow, column=3, value=d); c.fill = INPUT_FILL; c.border = BOX
    rrow += 1
T1 = rrow - 1
ws.cell(row=rrow, column=2, value="Total person-days").font = BOLD
c = ws.cell(row=rrow, column=3, value=f"=SUM(C{T0}:C{T1})"); c.font = BOLD; c.fill = CALC_FILL; c.border = BOX
X["buildDays"] = f"$C${rrow}"
rrow += 1
ws.cell(row=rrow, column=2, value="With contingency — person-days")
c = ws.cell(row=rrow, column=3, value=f"={X['buildDays']}*(1+{X['buildCont']})"); c.fill = CALC_FILL; c.border = BOX; c.number_format = NUM1
X["buildDaysC"] = f"$C${rrow}"
rrow += 1
ws.cell(row=rrow, column=2, value="Person-months (÷ 22) — e.g. one developer for this many months, or two for half")
c = ws.cell(row=rrow, column=3, value=f"={X['buildDaysC']}/22"); c.fill = CALC_FILL; c.border = BOX; c.number_format = NUM1
rrow += 1
ws.cell(row=rrow, column=2, value="Build cost — in-house team time (₹, allocation of salaries already in the plan)")
c = ws.cell(row=rrow, column=3, value=f"={X['buildDaysC']}*{X['dayCost']}"); c.fill = KEY_FILL; c.border = BOX; c.number_format = INR; c.font = BOLD
X["buildInhouse"] = f"$C${rrow}"
rrow += 1
ws.cell(row=rrow, column=2, value="Build cost — if given to an agency instead (₹)")
c = ws.cell(row=rrow, column=3, value=f"={X['buildDaysC']}*{X['agencyDay']}"); c.fill = CALC_FILL; c.border = BOX; c.number_format = INR
rrow += 1

# Scenarios
rrow += 1
section(ws, rrow, "6. Yearly cost — three usage scenarios (edit the yellow adoption / usage rows)", span=5)
rrow += 1
header(ws, rrow, ["Line", "MAX — every student uses all credits", "EXPECTED", "LOW", "How it is computed"], col=2)
rrow += 1
SC0 = rrow
COLS = ["C", "D", "E"]


def srow(label, values, fmt=INR, fill=CALC_FILL, note="", bold=False):
    global rrow
    ws.cell(row=rrow, column=2, value=label).border = BOX
    if bold:
        ws.cell(row=rrow, column=2).font = BOLD
    for L, v in zip(COLS, values):
        c = ws[f"{L}{rrow}"]; c.value = v; c.number_format = fmt; c.fill = fill; c.border = BOX
        if bold:
            c.font = BOLD
    ws.cell(row=rrow, column=6, value=note).font = NOTE
    r = rrow
    rrow += 1
    return r


r_adopt = srow("Share of students who use the builder at all", [1, 0.7, 0.4], fmt=PCT, fill=INPUT_FILL)
r_dls = srow("PDF versions per active student per year", [f"={X['maxPerStudent']}", 6, 3], fmt=NUM1, fill=INPUT_FILL, note="MAX is locked to templates × credits; the other two are your estimate of real behaviour")
r_ai = srow("AI-assist calls per active student per year", [f"={X['aiCap']}", 8, 4], fmt=NUM1, fill=INPUT_FILL, note="MAX = the hard cap")
r_active = srow("Active students", [f"={R['students']}*{L}{r_adopt}" for L in COLS], fmt=NUM, note="Inputs!students × adoption")
r_renders = srow("PDF renders per year", [f"={L}{r_active}*{L}{r_dls}" for L in COLS], fmt=NUM, bold=True)
r_comp = srow("Render compute ($)", [f"={L}{r_renders}*{X['secs']}*({X['vcpu']}*{X['vcpuPrice']}+{X['memGiB']}*{X['memPrice']})*(1-{X['freeShare']})+{L}{r_renders}/1000000*{X['reqPrice']}" for L in COLS], fmt=USD, note="renders × seconds × (vCPU price + GiB × memory price) × (1 − free-tier share) + requests")
r_stor = srow("Cloud Storage — PDFs kept ($)", [f"={L}{r_renders}*{X['pdfMB']}/1024*{X['monthsStored']}*{R['csStorPrice']}" for L in COLS], fmt=USD, note="renders × MB ÷ 1024 × months stored × $/GB-month")
r_egr = srow("Cloud Storage — downloads / re-downloads ($)", [f"={L}{r_renders}*(1+{X['redl']})*{X['pdfMB']}/1024*{R['dlPrice']}" for L in COLS], fmt=USD, note="renders × (1 + free re-downloads) × MB ÷ 1024 × $/GB")
r_fs = srow("Firestore reads + writes ($)", [f"=({L}{r_renders}*{X['sessPerDl']}*{X['writesPerSess']}+{L}{r_renders}*{X['writesPerDl']})/100000*{R['writePrice']}+{L}{r_renders}*{X['sessPerDl']}*{X['readsPerSess']}/100000*{R['readPrice']}" for L in COLS], fmt=USD, note="autosave writes + credit writes at $0.18/100K; reads at $0.06/100K (the daily free quota is ignored — conservative)")
r_host = srow("Hosting transfer — builder bundle & fonts ($)", [f"={L}{r_renders}*{X['sessPerDl']}*{X['hostMB']}/1024*{R['hostPrice']}" for L in COLS], fmt=USD)
r_cloudUsd = srow("Cloud total ($)", [f"=SUM({L}{r_comp}:{L}{r_host})" for L in COLS], fmt=USD, bold=True)
r_cloud = srow("Cloud total (₹)", [f"={L}{r_cloudUsd}*{R['fx']}" for L in COLS], fmt=INR, fill=KEY_FILL, bold=True, note="× Inputs!fx. Ex-GST")
r_perDl = srow("Cloud cost per PDF download (₹)", [f"=IF({L}{r_renders}=0,0,{L}{r_cloud}/{L}{r_renders})" for L in COLS], fmt=INR2, fill=KEY_FILL, note="the number that answers 'what does one download cost us'")
r_perStuCloud = srow("Cloud cost per student (₹, all students)", [f"={L}{r_cloud}/{R['students']}" for L in COLS], fmt=INR2)
r_aiCost = srow("AI assist (₹)", [f"={X['aiOn']}*{L}{r_active}*{L}{r_ai}*({X['aiIn']}/1000000*{X['aiPIn']}+{X['aiOut']}/1000000*{X['aiPOut']})*{R['fx']}" for L in COLS], fmt=INR, note="active × calls × ($ per call) × fx")
r_maint = srow("Maintenance & support — team time (₹ per year)", [f"={X['maintDays']}*{X['dayCost']}" for _ in COLS], fmt=INR)
r_build = srow("Build — team time (₹, one-time, year 1)", [f"={X['buildInhouse']}" for _ in COLS], fmt=INR)
r_y1 = srow("YEAR-1 total (cloud + AI + maintenance + full build) (₹)", [f"={L}{r_cloud}+{L}{r_aiCost}+{L}{r_maint}+{L}{r_build}" for L in COLS], fmt=INR, fill=KEY_FILL, bold=True)
r_y1ps = srow("Year-1 cost per student (₹)", [f"={L}{r_y1}/{R['students']}" for L in COLS], fmt=INR2, fill=KEY_FILL, bold=True)
r_run = srow("Steady-state year (cloud + AI + maintenance, build spread over the amortisation years) (₹)", [f"={L}{r_cloud}+{L}{r_aiCost}+{L}{r_maint}+{L}{r_build}/{X['amortYears']}" for L in COLS], fmt=INR, bold=True)
r_runps = srow("Steady-state cost per student (₹)", [f"={L}{r_run}/{R['students']}" for L in COLS], fmt=INR2, fill=KEY_FILL, bold=True)
r_cash = srow("Of which NEW cash beyond the base plan (cloud + AI only) (₹)", [f"={L}{r_cloud}+{L}{r_aiCost}" for L in COLS], fmt=INR, note="team time is already in 'Team & Overheads'; this is the only line that changes the Google/AI invoice")
rrow += 1
section(ws, rrow, "7. Pricing the add-on (uses margin targets & contingency from Inputs)", span=5)
rrow += 1
r_p30 = srow(f"Price per student for the LOW margin target (year-1 cost basis, + contingency) (₹)", [f"={L}{r_y1ps}*(1+{R['cont']})/(1-{R['m1']})" for L in COLS], fmt=INR2, fill=KEY_FILL, note="Inputs!m1 / cont")
r_p40 = srow(f"Price per student for the HIGH margin target (year-1 cost basis, + contingency) (₹)", [f"={L}{r_y1ps}*(1+{R['cont']})/(1-{R['m3']})" for L in COLS], fmt=INR2, fill=KEY_FILL, note="Inputs!m3 / cont")
r_rev = srow("Revenue at the add-on price above (₹)", [f"={R['students']}*{X['addonPrice']}" for _ in COLS], fmt=INR)
r_gp = srow("Year-1 gross profit at that price (₹)", [f"={L}{r_rev}-{L}{r_y1}" for L in COLS], fmt=INR, fill=KEY_FILL, bold=True)
r_gm = srow("Year-1 gross margin at that price", [f"=IF({L}{r_rev}=0,0,{L}{r_gp}/{L}{r_rev})" for L in COLS], fmt=PCT, fill=KEY_FILL, bold=True)
r_bund = srow("If bundled free into the base price: gross-margin points it costs on the base price", [f"={L}{r_y1ps}/{R['price']}" for L in COLS], fmt=PCT, note="year-1 cost per student ÷ the price on 'Pricing & P&L'")

# Cap sensitivity
rrow += 1
section(ws, rrow, "8. What the cap actually changes — cloud cost per year if every EXPECTED-adoption student used every credit", span=5)
rrow += 1
header(ws, rrow, ["Credits per template", "Renders per year", "Cloud cost per year (₹)", "Cloud cost per student (₹)", "Reading"], col=2)
rrow += 1
caps = [(1, "one final version per template"), (2, ""), (3, "the proposed rule"), (5, ""), (10, "≈ unlimited in practice")]
for capv, reading in caps:
    ws.cell(row=rrow, column=2, value=capv).border = BOX
    ws.cell(row=rrow, column=2).fill = INPUT_FILL
    c = ws.cell(row=rrow, column=3, value=f"={R['students']}*$D${r_adopt}*{X['templates']}*B{rrow}"); c.number_format = NUM; c.fill = CALC_FILL; c.border = BOX
    c = ws.cell(row=rrow, column=4, value=f"=C{rrow}*$D${r_perDl}"); c.number_format = INR; c.fill = KEY_FILL; c.border = BOX
    c = ws.cell(row=rrow, column=5, value=f"=D{rrow}/{R['students']}"); c.number_format = INR2; c.fill = CALC_FILL; c.border = BOX
    ws.cell(row=rrow, column=6, value=reading).font = NOTE
    rrow += 1
ws.cell(row=rrow, column=2, value="The cap is a product and pricing lever (scarcity, top-up revenue, abuse control) — not a cost lever. Even ten credits per template cost a few thousand rupees a year across 5,000 students.").font = NOTE
rrow += 1

# ── sheet order & save ───────────────────────────────────────────────────────
wb.save(OUT)
print("wrote", OUT)
