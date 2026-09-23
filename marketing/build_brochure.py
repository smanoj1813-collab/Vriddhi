#!/usr/bin/env python3
"""Builds Vriddhi_Brochure.pdf — A4 landscape tri-fold (2 pages, 6 panels).

Print on both sides of one A4 sheet, fold into thirds:
  Page 1 (front side):  [ front cover | inside left  | inside right ]
  Page 2 (back side):   [ inside flap | back cover   | inside centre]
"""
import os
from pdf_helpers import (
    Doc, HERO, LOGO_REVERSE,
    TEAL, TEAL_D, TEAL_3, TEAL_4, TEAL_50, TEAL_100, SLATE, SLATE_2,
    SLATE_5, SLATE_4, SLATE_3, BORDER, BG, WHITE, DARK_BG,
)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Vriddhi_Brochure.pdf")
PW, PH = 297, 210  # A4 landscape
P1, P2, P3 = 0, 99, 198  # panel x starts
PM = 9  # panel inner margin


def panel_bg(pdf, x, color):
    pdf.set_fill_color(*color)
    pdf.rect(x, 0, 99, PH, style="F")


pdf = Doc(orientation="L", format="A4")

# ===========================================================================
# PAGE 1 — front side
# ===========================================================================
pdf.add_page()
panel_bg(pdf, P1, DARK_BG)      # front cover
panel_bg(pdf, P2, WHITE)        # inside left
panel_bg(pdf, P3, TEAL_50)      # inside right

# ---- front cover ----------------------------------------------------------
pdf.set_fill_color(*TEAL)
pdf.rect(P1, 0, 99, 1.2, style="F")
card_x, card_y, card_w, card_h = P1 + 10, 16, 79, 60
pdf.rrect(card_x, card_y, card_w, card_h, 3.5, fill=WHITE)
hero_w = 66
hero_h = hero_w / (899 / 693)
pdf.image(HERO, x=card_x + (card_w - hero_w) / 2, y=card_y + (card_h - hero_h) / 2 - 2.5, w=hero_w)
# real logo lockup (reverse — backing #0B1220 matches the panel)
pdf.image(LOGO_REVERSE, x=P1 + 10, y=84, w=62)  # h ≈ 20.4mm
pdf.set_fill_color(*TEAL)
pdf.rect(P1 + 10, 110, 12, 0.7, style="F")
pdf.set_font("InterSB", "", 9.5)
pdf.set_text_color(*SLATE_3)
pdf.set_xy(P1 + 10, 116)
pdf.multi_cell(80, 4.6, "The academic operating system for Indian colleges.", align="L")
pdf.set_font("Inter", "", 7.5)
pdf.set_text_color(*SLATE_4)
pdf.set_xy(P1 + 10, 131)
pdf.multi_cell(80, 4.2, "AI question papers · online assessments · administration — in the languages India speaks.", align="L")
pdf.set_font("Inter", "", 7.5)
pdf.set_text_color(*SLATE_5)
pdf.set_xy(P1 + 10, 192)
pdf.cell(0, 4, "www.vriddhi.in")

# ---- inside left: what is vriddhi ----------------------------------------
x = P2 + PM
pdf.kicker(x, 14, "What is Vriddhi")
pdf.hline(x, 18.2, 8, color=TEAL, h=0.7)
pdf.set_font("InterSB", "", 13.5)
pdf.set_text_color(*SLATE)
pdf.set_xy(x, 22)
pdf.multi_cell(81, 5.6, "The academic OS for Indian colleges")
pdf.para(x, 40, 81,
         "One role-based platform for the whole academic life-cycle — attendance to "
         "transcripts, with AI doing the heavy lifting.",
         size=8.2, color=SLATE_5, line_h=4.2)
mods = [
    "Attendance",
    "Online tests & exams",
    "Question bank",
    "AI paper generator",
    "Curriculum & syllabus",
    "Fees management",
    "Timetables",
    "Results & transcripts",
    "Analytics & View 360",
    "Library",
    "Assignments & materials",
    "Appointments & events",
]
pdf.kicker(x, 62, "The modules")
col_w = 39.5
for i, m in enumerate(mods):
    cx = x + (i % 2) * col_w
    cy = 70 + (i // 2) * 12.5
    pdf.dot(cx + 1, cy + 2.2, d=1.6)
    pdf.set_font("InterM", "", 8.2)
    pdf.set_text_color(*SLATE_2)
    pdf.set_xy(cx + 4.5, cy)
    pdf.multi_cell(col_w - 5, 4.2, m, align="L")
pdf.rrect(x, 158, 81, 16, 3, fill=DARK_BG)
pdf.set_font("InterSB", "", 8.5)
pdf.set_text_color(*TEAL_3)
pdf.set_xy(x + 5, 162.2)
pdf.multi_cell(71, 4.4, "Data flows from attendance to analytics — no re-keying.", align="L")
pdf.set_font("Inter", "", 7)
pdf.set_text_color(*SLATE_4)
pdf.set_xy(x, 186)
pdf.cell(81, 4, "Student · Faculty · HOD · Principal · Admin · Superadmin")

# ---- inside right: AI engine & languages ----------------------------------
x = P3 + PM
pdf.kicker(x, 14, "AI engine")
pdf.hline(x, 18.2, 8, color=TEAL, h=0.7)
pdf.set_font("InterSB", "", 13.5)
pdf.set_text_color(*SLATE)
pdf.set_xy(x, 22)
pdf.multi_cell(81, 5.6, "AI that drafts. Faculty that decide.")
blocks = [
    ("Questions", "Options, marks and step-by-step explanations — in your language."),
    ("Papers", "From your question bank; print, online and bank formats; PDF export."),
    ("Grading", "Rubric scores with confidence — reviewed by a human, then published."),
]
by = 40
for name, desc in blocks:
    pdf.rrect(x, by, 81, 17, 2.5, fill=WHITE, border=TEAL_100)
    pdf.set_font("InterSB", "", 9)
    pdf.set_text_color(*TEAL_D)
    pdf.set_xy(x + 5, by + 3)
    pdf.cell(71, 4.4, name)
    pdf.para(x + 5, by + 8.2, 71, desc, size=7.8, color=SLATE_5, line_h=4)
    by += 20
pdf.rrect(x, by + 1, 81, 11, 3, fill=DARK_BG)
pdf.set_font("InterSB", "", 8)
pdf.set_text_color(*TEAL_3)
pdf.set_xy(x + 5, by + 4.6)
pdf.cell(71, 4.2, "Gemini · OpenAI · DeepSeek — fallbacks included", align="C")
ly = by + 20
pdf.kicker(x, ly, "Six languages")
langs = ["Kannada", "Tamil", "Telugu", "Malayalam", "Hindi", "English"]
lw = 39.5
for i, L in enumerate(langs):
    lx = x + (i % 2) * lw
    lyy = ly + 7 + (i // 2) * 11.5
    pdf.rrect(lx, lyy, lw - 4, 9, 4.5, fill=WHITE, border=TEAL_100)
    pdf.dot(lx + 4.5, lyy + 3.6, d=1.4, color=TEAL_D)
    pdf.set_font("InterM", "", 8.2)
    pdf.set_text_color(*TEAL_D)
    pdf.set_xy(lx + 8.5, lyy + 2.9)
    pdf.cell(0, 4, L)

# ===========================================================================
# PAGE 2 — back side
# ===========================================================================
pdf.add_page()
panel_bg(pdf, P1, WHITE)        # inside flap
panel_bg(pdf, P2, DARK_BG)      # back cover
panel_bg(pdf, P3, WHITE)        # inside centre

# ---- inside flap: why vriddhi ---------------------------------------------
x = P1 + PM
pdf.kicker(x, 14, "Why Vriddhi")
pdf.hline(x, 18.2, 8, color=TEAL, h=0.7)
pdf.set_font("InterSB", "", 13.5)
pdf.set_text_color(*SLATE)
pdf.set_xy(x, 22)
pdf.multi_cell(81, 5.6, "Why colleges switch")
whys = [
    ("AI that saves the exam cycle", "Papers drafted in minutes; scripts graded with confidence scores; faculty confirm every step."),
    ("Software that speaks", "Kannada, Tamil, Telugu, Malayalam, Hindi and English — in the UI and in AI output."),
    ("State systems, built in", "UUCMS student import and sync; BCU pass rules; NEP-ready curriculum mapping."),
    ("Simple to own", "Flat per-college subscription. No per-student licensing, no heavy onboarding."),
]
wy = 42
for name, desc in whys:
    pdf.dot(x + 1.2, wy + 2.4, d=1.8)
    pdf.para(x + 5.5, wy, 75.5, name, size=9, color=SLATE, font="InterSB")
    pdf.para(x + 5.5, wy + 5.2, 75.5, desc, size=7.8, color=SLATE_5, line_h=4)
    wy += 30
pdf.rrect(x, wy + 2, 81, 15, 3, fill=TEAL_50, border=TEAL_100)
pdf.set_font("InterM", "", 8)
pdf.set_text_color(*TEAL_D)
pdf.set_xy(x + 5, wy + 5)
pdf.multi_cell(71, 4.2, "Pilot onboarding for Karnataka colleges starts 2026.", align="L")

# ---- back cover -------------------------------------------------------------
x = P2 + PM
pdf.image(LOGO_REVERSE, x=x + 1, y=14, w=34)
pdf.set_font("InterSB", "", 17)
pdf.set_text_color(*WHITE)
pdf.set_xy(x, 78)
pdf.cell(0, 7, "Let's grow together.")
pdf.set_fill_color(*TEAL)
pdf.rect(x, 90, 12, 0.7, style="F")
pdf.set_font("InterSB", "", 9)
pdf.set_text_color(*TEAL_3)
pdf.set_xy(x, 97)
pdf.cell(0, 4.5, "The academic operating system for Indian colleges.")
pdf.set_font("Inter", "", 9)
pdf.set_text_color(*SLATE_3)
pdf.set_xy(x, 110)
pdf.cell(0, 4.5, "hello@vriddhi.in   ·   www.vriddhi.in")
pdf.set_font("Inter", "", 7.5)
pdf.set_text_color(*SLATE_5)
pdf.set_xy(x, 186)
pdf.cell(0, 4, "Made in Karnataka · Built for India")

# ---- inside centre: built for India + get started --------------------------
x = P3 + PM
pdf.kicker(x, 14, "Built for India")
pdf.hline(x, 18.2, 8, color=TEAL, h=0.7)
pdf.set_font("InterSB", "", 13.5)
pdf.set_text_color(*SLATE)
pdf.set_xy(x, 22)
pdf.multi_cell(81, 5.6, "Karnataka-ready, India-extensible")
rows = [
    "UUCMS import, auto-linking and sync status",
    "BCU pass rules applied on result import",
    "NEP & credit-scheme curriculum mapping",
    "Draft-to-publish transcript pipeline",
]
ry = 42
for r in rows:
    pdf.dot(x + 1, ry + 2.2, d=1.6)
    pdf.set_font("InterM", "", 8.4)
    pdf.set_text_color(*SLATE_2)
    pdf.set_xy(x + 5, ry)
    pdf.multi_cell(76, 4.4, r, align="L")
    ry += 11
pdf.kicker(x, ry + 6, "Get started")
steps = [
    "Book a walkthrough",
    "Onboard your college — bulk imports included",
    "Go live: first AI paper in under a week",
]
sty = ry + 15
for i, st in enumerate(steps, 1):
    pdf.set_fill_color(*TEAL)
    pdf.ellipse(x, sty, 7, 7, style="F")
    pdf.set_font("InterSB", "", 8.5)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(x, sty + 1.7)
    pdf.cell(7, 3.8, str(i), align="C")
    pdf.set_font("InterM", "", 8.4)
    pdf.set_text_color(*SLATE_2)
    pdf.set_xy(x + 10.5, sty + 1.2)
    pdf.multi_cell(70, 4.4, st, align="L")
    sty += 12
pdf.rrect(x, sty + 3, 81, 15, 3, fill=DARK_BG)
pdf.set_font("InterSB", "", 9)
pdf.set_text_color(*TEAL_3)
pdf.set_xy(x + 5, sty + 7.2)
pdf.cell(71, 4.4, "hello@vriddhi.in", align="C")

pdf.output(OUT)
print("saved", OUT, "pages:", pdf.page_no())
