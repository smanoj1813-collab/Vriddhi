#!/usr/bin/env python3
"""Builds Vriddhi_Booklet.pdf — a 10-page A4 product booklet."""
import os
from pdf_helpers import (
    Doc, HERO, LOGO_REVERSE,
    TEAL, TEAL_D, TEAL_3, TEAL_4, TEAL_50, TEAL_100, SLATE, SLATE_2,
    SLATE_5, SLATE_4, SLATE_3, BORDER, BG, WHITE, DARK_BG,
)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Vriddhi_Booklet.pdf")
M = 18          # page margin
W, H = 210, 297  # A4 portrait
CW = W - 2 * M   # 174 content width


def checklist(doc, x, y, w, items, lead_color=SLATE, body_color=SLATE_5):
    """items: list of (lead, desc). Returns y after last item."""
    for lead, desc in items:
        doc.dot(x + 1.1, y + 1.5, d=1.7)
        yy = doc.para(x + 5, y, w - 5, lead, size=11, color=lead_color, font="InterSB")
        yy = doc.para(x + 5, yy + 1.2, w - 5, desc, size=9.8, color=body_color, line_h=4.6)
        y = yy + 5.2
    return y


def stat_bar(doc, y, text, w=CW, x=M):
    h = 12
    doc.rrect(x, y, w, h, 3, fill=DARK_BG)
    doc.set_font("InterSB", "", 10.5)
    doc.set_text_color(*TEAL_3)
    doc.set_xy(x + 5, y + 3.6)
    doc.cell(w - 10, 4.5, text, align="C")
    return y + h


pdf = Doc()

# ===========================================================================
# P1 — Cover
# ===========================================================================
pdf.add_page()
pdf.set_fill_color(*DARK_BG)
pdf.rect(0, 0, W, H, style="F")
pdf.set_fill_color(*TEAL)
pdf.rect(0, 0, W, 1.2, style="F")
# hero card
card_x, card_y, card_w, card_h = 24, 26, 162, 126
pdf.rrect(card_x, card_y, card_w, card_h, 4, fill=WHITE)
hero_w = 138
hero_h = hero_w / (899 / 693)
pdf.image(HERO, x=card_x + (card_w - hero_w) / 2, y=card_y + (card_h - hero_h) / 2 - 4, w=hero_w)
# real logo lockup (reverse — its backing #0B1220 matches the cover exactly)
pdf.image(LOGO_REVERSE, x=18, y=163, w=118)  # h = 118*529/1600 ≈ 38.8mm
pdf.set_fill_color(*TEAL)
pdf.rect(18, 209.5, 14, 0.9, style="F")
pdf.para(18, 216, 174, "The academic operating system for Indian colleges",
         size=14, color=SLATE_3, font="InterSB")
pdf.para(18, 227, 174, "AI-powered question papers, online assessments and administration — in the languages India speaks.",
         size=10.5, color=SLATE_4, line_h=5.4)
pdf.set_font("Inter", "", 8.5)
pdf.set_text_color(*SLATE_5)
pdf.set_xy(18, 272)
pdf.cell(0, 4, "Product booklet · 2026")
pdf.set_xy(192, 272)
pdf.cell(0, 4, "www.vriddhi.in", align="R")

# ===========================================================================
# P2 — Welcome / about + contents
# ===========================================================================
pdf.add_page()
pdf.set_fill_color(*WHITE)
pdf.rect(0, 0, W, H, style="F")
y = pdf.page_header("Welcome", "Growing through knowledge")
pdf.para(18, y, CW,
         "Vriddhi — Sanskrit for growth — is a full-featured, role-based academic management "
         "platform for colleges. Students, faculty, college administration and platform operators "
         "share one system covering attendance, assessments and tests, curriculum, question banks, "
         "AI-assisted paper generation, fees, timetables and analytics.",
         size=11, color=SLATE_2, line_h=5.8)
pdf.para(18, y + 32, CW,
         "It is built on a modern React and Firebase stack, and designed for the realities of Indian "
         "higher education: six languages with native-script AI output, Karnataka's UUCMS portal, and "
         "university pass rules — out of the box.",
         size=11, color=SLATE_2, line_h=5.8)
# contents box
by = 128
pdf.rrect(18, by, CW, 132, 4, fill=TEAL_50, border=TEAL_100)
pdf.kicker(26, by + 8, "In this booklet")
toc = [
    ("03", "Why colleges need Vriddhi"),
    ("04", "The platform, at a glance"),
    ("05", "For faculty"),
    ("06", "For students"),
    ("07", "The AI engine & languages"),
    ("08", "Built for Indian universities"),
    ("09", "Platform, security & getting started"),
    ("10", "Contact"),
]
ty = by + 20
for num, label in toc:
    pdf.set_font("InterSB", "", 10.5)
    pdf.set_text_color(*TEAL_D)
    pdf.set_xy(26, ty)
    pdf.cell(12, 5, num)
    pdf.set_font("InterM", "", 10.5)
    pdf.set_text_color(*SLATE)
    pdf.cell(0, 5, label)
    ty += 12.4
pdf.footer()

# ===========================================================================
# P3 — Why
# ===========================================================================
pdf.add_page()
pdf.set_fill_color(*WHITE)
pdf.rect(0, 0, W, H, style="F")
y = pdf.page_header("Why Vriddhi", "The problem with running a college")
rows = [
    ("Fragmented records",
     "Attendance in one spreadsheet, fees in another, exams in registers. End-of-semester re-entry — "
     "and no single source of truth for anyone."),
    ("The exam bottleneck",
     "A paper hand-built for every subject, every semester. Scripts marked over weekends. Paper-making, "
     "not teaching, eats the academic cycle."),
    ("English-only software",
     "Mainstream ERPs and LMSs don't speak the language of the classroom — Kannada, Tamil, Telugu or "
     "Malayalam are an afterthought at best."),
    ("Compliance gaps",
     "Karnataka's UUCMS portal, BCU pass rules and NEP scheme structures are handled by hand, not "
     "built in."),
]
ry = y + 4
for lead, desc in rows:
    pdf.rrect(18, ry, CW, 34, 3, fill=BG, border=BORDER)
    pdf.set_fill_color(*TEAL)
    pdf.rect(18, ry, 1.2, 34, style="F")
    pdf.para(26, ry + 5.5, CW - 14, lead, size=11.5, color=SLATE, font="InterSB")
    pdf.para(26, ry + 12.5, CW - 14, desc, size=10, color=SLATE_5, line_h=5)
    ry += 39
# vision
vy = ry + 4
pdf.rrect(18, vy, CW, 40, 3.5, fill=DARK_BG)
pdf.kicker(26, vy + 7, "Our vision", color=TEAL_3)
pdf.para(26, vy + 15, CW - 16,
         "Every Indian college — from a 300-student institution to a full university — runs its "
         "academics on one AI-powered platform, in the language of its classroom.",
         size=11, color=SLATE_3, line_h=5.6)
pdf.footer()

# ===========================================================================
# P4 — Platform grid
# ===========================================================================
pdf.add_page()
pdf.set_fill_color(*WHITE)
pdf.rect(0, 0, W, H, style="F")
y = pdf.page_header("The platform", "Everything academic, in one place")
mods = [
    ("Attendance", "Marking and viewing, per subject and semester"),
    ("Online tests & exams", "Schedule, publish, autosave, results"),
    ("Question bank", "Manual, bulk import and AI-generated"),
    ("AI paper generator", "Print, online and bank formats · PDF export"),
    ("Curriculum & syllabus", "Upload, parse and topic mapping"),
    ("Fees management", "Fee heads, records and the student portal"),
    ("Timetables", "Generation, rescheduling, conflict detection"),
    ("Results & transcripts", "Draft-to-publish pipeline"),
    ("Analytics & View 360", "Student insights and college comparison"),
    ("Library", "Catalogue and issue tracking"),
    ("Assignments & materials", "Create, submit, grade, download"),
    ("Appointments & events", "Student–faculty meetups, calendar"),
]
cw2 = (CW - 6) / 2
ch2 = 24.5
gx, gy = 6, 5
x0 = 18
y0 = y + 4
for i, (name, desc) in enumerate(mods):
    cx = x0 + (i % 2) * (cw2 + gx)
    cy = y0 + (i // 2) * (ch2 + gy)
    pdf.rrect(cx, cy, cw2, ch2, 2.6, fill=WHITE, border=BORDER)
    pdf.dot(cx + 5.5, cy + 7.2, d=1.7)
    pdf.para(cx + 10, cy + 4.2, cw2 - 15, name, size=10.8, color=SLATE, font="InterSB")
    pdf.para(cx + 10, cy + 11.5, cw2 - 15, desc, size=9, color=SLATE_5, line_h=4.6)
ny = y0 + 6 * (ch2 + gy) + 2
pdf.rrect(18, ny, CW, 12, 3, fill=TEAL_50, border=TEAL_100)
pdf.set_font("InterSB", "", 10)
pdf.set_text_color(*TEAL_D)
pdf.set_xy(24, ny + 3.8)
pdf.cell(CW - 12, 4.4, "Everything works together — data flows from attendance to analytics without re-keying.", align="C")
pdf.footer()

# ===========================================================================
# P5 — For faculty
# ===========================================================================
pdf.add_page()
pdf.set_fill_color(*WHITE)
pdf.rect(0, 0, W, H, style="F")
y = pdf.page_header("For faculty", "Teach, test and grade — with hours returned")
items = [
    ("Mark attendance", "Per subject and class, with student and department views for follow-up."),
    ("Build the question bank", "Manually, by CSV / Excel bulk import, or with AI-generated questions."),
    ("Generate exam papers", "From your bank, in print, online and bank formats — exported to print-ready PDF."),
    ("Auto-grade with confidence", "Rubric-based scoring of descriptive answers, with confidence scores. Review one pass, publish marks."),
    ("Run the timetable", "Reschedule classes and tests; conflict detection protects the plan before it breaks."),
    ("Stay connected", "Appointments, assignments, materials and announcements in one place."),
]
y = checklist(pdf, 18, y + 3, CW, items)
stat_bar(pdf, min(y + 6, 246), "Less paper-making.  Less script-marking.  More teaching.")
pdf.footer()

# ===========================================================================
# P6 — For students
# ===========================================================================
pdf.add_page()
pdf.set_fill_color(*WHITE)
pdf.rect(0, 0, W, H, style="F")
y = pdf.page_header("For students", "One dashboard for the whole semester")
items = [
    ("See your semester", "Attendance, timetable, announcements and progress on a single screen."),
    ("Take tests, safely", "Online exams with clear instructions, autosave and expiry recovery."),
    ("Track fees", "The student fee portal shows dues and payment records — no queues, no paper."),
    ("Study support", "Library, course materials, question banks and step-by-step solutions."),
    ("Results when they land", "Grades, SGPA and transcripts the moment they are published."),
    ("Your language", "Switch the interface to Kannada, Tamil, Telugu, Malayalam, Hindi or English."),
]
y = checklist(pdf, 18, y + 3, CW, items)
pdf.rrect(18, min(y + 4, 240), CW, 14, 3, fill=TEAL_50, border=TEAL_100)
pdf.set_font("InterM", "", 9.5)
pdf.set_text_color(*TEAL_D)
pdf.set_xy(24, min(y + 4, 240) + 4.6)
pdf.cell(CW - 12, 4.4, "Parents are next — the parent role is on the roadmap.", align="C")
pdf.footer()

# ===========================================================================
# P7 — AI engine & languages
# ===========================================================================
pdf.add_page()
pdf.set_fill_color(*WHITE)
pdf.rect(0, 0, W, H, style="F")
y = pdf.page_header("AI & languages", "AI that drafts, faculty that decide")
cards = [
    ("AI questions", "Options, marks and step-by-step explanations — generated in the language you choose."),
    ("AI papers", "Assembled from your question bank with templates and topic rules. Export to PDF."),
    ("AI grading", "Rubric scores with confidence levels. A human review before anything is published."),
]
cw3 = (CW - 8) / 3
y0 = y + 2
for i, (name, desc) in enumerate(cards):
    cx = 18 + i * (cw3 + 4)
    pdf.rrect(cx, y0, cw3, 46, 3, fill=WHITE, border=BORDER)
    pdf.rrect(cx, y0, cw3, 1.6, 1, fill=TEAL)
    pdf.para(cx + 5, y0 + 7, cw3 - 10, name, size=11, color=SLATE, font="InterSB")
    pdf.para(cx + 5, y0 + 14.5, cw3 - 10, desc, size=9.3, color=SLATE_5, line_h=4.8)
py = y0 + 54
pdf.rrect(18, py, CW, 13, 3, fill=DARK_BG)
pdf.set_font("InterSB", "", 10)
pdf.set_text_color(*TEAL_3)
pdf.set_xy(24, py + 4.2)
pdf.cell(CW - 12, 4.4, "Runs on Gemini · OpenAI · DeepSeek — selectable at runtime, with automatic fallbacks.", align="C")
ly = py + 23
pdf.kicker(18, ly, "Six languages")
langs = ["Kannada", "Tamil", "Telugu", "Malayalam", "Hindi", "English"]
lw = (CW - 12) / 2
for i, L in enumerate(langs):
    lx = 18 + (i % 2) * (lw + 6)
    lyy = ly + 7 + (i // 2) * 13
    pdf.rrect(lx, lyy, lw, 10, 5, fill=TEAL_50, border=TEAL_100)
    pdf.dot(lx + 5.5, lyy + 4.3, d=1.5, color=TEAL_D)
    pdf.set_font("InterM", "", 9.8)
    pdf.set_text_color(*TEAL_D)
    pdf.set_xy(lx + 9.5, lyy + 3.1)
    pdf.cell(0, 4, L)
pdf.para(18, ly + 50, CW,
         "Questions, options and explanations are generated in native Unicode scripts — the AI writes "
         "in the language you pick, and the interface follows suit.",
         size=10, color=SLATE_5, line_h=5.2)
pdf.footer()

# ===========================================================================
# P8 — India-first / universities
# ===========================================================================
pdf.add_page()
pdf.set_fill_color(*WHITE)
pdf.rect(0, 0, W, H, style="F")
y = pdf.page_header("India-first", "Built for Karnataka, ready for Indian universities")
rows = [
    ("UUCMS integration",
     "Import Candidate IDs and USNs from the state portal. Students are auto-linked by email, and "
     "admins track sync status on a dedicated dashboard."),
    ("University pass rules",
     "BCU under-graduate pass logic — UE threshold plus aggregate — is applied automatically when "
     "results are imported."),
    ("NEP & scheme ready",
     "Curriculum upload, syllabus parsing and credit-structure mapping for modern schemes keep "
     "records audit-ready."),
    ("Results pipeline",
     "CSV / Excel imports land as grades and SGPA, then move through the draft-to-publish flow "
     "for official transcripts."),
]
ry = y + 4
for lead, desc in rows:
    pdf.dot(19.5, ry + 5.5, d=2.2)
    pdf.para(26, ry + 1, CW - 10, lead, size=11.5, color=SLATE, font="InterSB")
    pdf.para(26, ry + 8.5, CW - 10, desc, size=10, color=SLATE_5, line_h=5)
    ry += 33
pdf.rrect(18, min(ry + 4, 232), CW, 16, 3, fill=TEAL_50, border=TEAL_100)
pdf.set_font("InterM", "", 10)
pdf.set_text_color(*TEAL_D)
pdf.set_xy(26, min(ry + 4, 232) + 5.2)
pdf.cell(CW - 16, 5, "Extendable to any university — schemes, pass rules and portals are configured, not coded.")
pdf.footer()

# ===========================================================================
# P9 — Platform, security & getting started
# ===========================================================================
pdf.add_page()
pdf.set_fill_color(*WHITE)
pdf.rect(0, 0, W, H, style="F")
y = pdf.page_header("Platform & security", "Serious infrastructure, simple to use")
cards = [
    ("Multi-tenant SaaS", "Per-college data isolation, superadmin operations, subscription billing and a system health monitor."),
    ("Modern stack", "React 18 + TypeScript, Firebase Auth & Firestore, Express Cloud Functions, Zod validation, rate limiting."),
    ("Security first", "Role-based access, hardened Firestore rules, auth audits, audit trails and optimistic-concurrency writes."),
    ("Built for campus", "Responsive web that works on college Wi-Fi or mobile data — a PWA experience is next."),
]
cw4 = (CW - 6) / 2
ch4 = 40
for i, (name, desc) in enumerate(cards):
    cx = 18 + (i % 2) * (cw4 + 6)
    cy = y + 2 + (i // 2) * (ch4 + 6)
    pdf.rrect(cx, cy, cw4, ch4, 3, fill=BG, border=BORDER)
    pdf.para(cx + 6, cy + 6, cw4 - 12, name, size=11, color=SLATE, font="InterSB")
    pdf.para(cx + 6, cy + 13.5, cw4 - 12, desc, size=9.5, color=SLATE_5, line_h=4.9)
sy = y + 2 + 2 * (ch4 + 6) + 12
pdf.kicker(18, sy, "Getting started")
steps = [
    "Book a walkthrough of your role's dashboard.",
    "Onboard your college — bulk import of students and faculty.",
    "Seed the question bank — CSV, Excel or AI generation.",
    "Go live — your first AI-generated paper in under a week.",
]
sty = sy + 9
for i, st in enumerate(steps, 1):
    pdf.set_fill_color(*TEAL)
    pdf.ellipse(18, sty, 8, 8, style="F")
    pdf.set_font("InterSB", "", 10.5)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(18, sty + 1.9)
    pdf.cell(8, 4.2, str(i), align="C")
    pdf.para(30, sty + 1.2, CW - 14, st, size=10.3, color=SLATE_2, font="InterM")
    sty += 12.5
pdf.footer()

# ===========================================================================
# P10 — Back cover
# ===========================================================================
pdf.add_page()
pdf.set_fill_color(*DARK_BG)
pdf.rect(0, 0, W, H, style="F")
pdf.set_fill_color(*TEAL)
pdf.rect(0, H - 1.2, W, 1.2, style="F")
pdf.image(LOGO_REVERSE, x=18, y=18, w=46)
card_x, card_y, card_w, card_h = 42, 62, 126, 97
pdf.rrect(card_x, card_y, card_w, card_h, 4, fill=WHITE)
hero_w = 108
hero_h = hero_w / (899 / 693)
pdf.image(HERO, x=card_x + (card_w - hero_w) / 2, y=card_y + (card_h - hero_h) / 2 - 3, w=hero_w)
pdf.set_font("InterSB", "", 25)
pdf.set_text_color(*WHITE)
pdf.set_xy(18, 172)
pdf.cell(0, 10, "Let's grow together.")
pdf.set_fill_color(*TEAL)
pdf.rect(18.5, 186, 14, 0.8, style="F")
pdf.para(18, 193, 174, "The academic operating system for Indian colleges.", size=12, color=TEAL_3, font="InterSB")
pdf.para(18, 204, 174, "hello@vriddhi.in   ·   www.vriddhi.in", size=11, color=SLATE_3)
pdf.para(18, 213, 174, "Pilot onboarding for Karnataka colleges starts 2026.", size=9.5, color=SLATE_4)
pdf.set_font("Inter", "", 9)
pdf.set_text_color(*SLATE_5)
pdf.set_xy(18, 272)
pdf.cell(0, 4, "Made in Karnataka · Built for India")

pdf.output(OUT)
print("saved", OUT, "pages:", pdf.page_no())
