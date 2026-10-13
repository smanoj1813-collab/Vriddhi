#!/usr/bin/env python3
"""Builds Vriddhi_Investor_OnePager.pdf — a single A4 portrait leave-behind.

Self-contained: it has to work with no presenter in the room, attached to a cold
email or handed over after a meeting. Everything an angel needs to decide whether
to take a second meeting, on one page:
  what it is · the market · the wedge · what is built · unit economics ·
  how it differs · honest traction · the ₹50 L ask and what it buys.

Reuses the renderer from build_investor_deck_pdf.py (font-fallback levelling,
HarfBuzz Indic shaping, vector output) with a portrait page.

Regenerate:
    python3 -m venv /home/user/.venv
    /home/user/.venv/bin/pip install fpdf2 fonttools uharfbuzz
    /home/user/.venv/bin/python marketing/build_investor_onepager.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from build_investor_deck_pdf import (  # noqa: E402  — shared brand tokens + renderer
    BORDER,
    DARK_BG,
    HERE,
    LOGO_LIGHT,
    SLATE,
    SLATE_4,
    SLATE_5,
    SLATE_6,
    TEAL,
    TEAL_3,
    TEAL_D,
    TEAL_50,
    WHITE,
    Deck,
)

PW, PH = 210.0, 297.0          # A4 portrait
MARGIN = 12.0
COL = PW - 2 * MARGIN          # 186 mm of usable width
GUTTER = 8.0
HALF = (COL - GUTTER) / 2      # 89 mm per column

# ── the content ──────────────────────────────────────────────────────────────

HEADLINE = "The AI-native academic operating system for Indian colleges"
SUMMARY = (
    "Vriddhi writes a college's question papers, runs the exam, grades it and manages fees, "
    "attendance and results — one role-based platform, six Indian languages, ₹449 per student per year."
)

CHIPS = [
    ("48,246", "colleges in India — 4.50 Cr students"),
    ("7 + 160", "role portals · backend functions"),
    ("257K", "lines of code · ~1,540 tests green"),
    ("₹18,123", "a year to run a 5,000-student college"),
]

PROBLEM = [
    "A college runs on 8–10 disconnected tools. The exam cycle is where the pain concentrates: "
    "faculty hand-build a paper for every subject, then mark scripts over weekends.",
    "Compliance is archaeology — NAAC, the university and the state portal each demand evidence "
    "colleges rebuild from registers weeks later.",
    "Students get nothing back: no app, no placements, no visibility into their own data.",
]

WEDGE = [
    "**In through the exam paper** — the most repeated task in the college, and the only door that "
    "hands us their questions, results and learners at once.",
    "**Then the whole semester** — attendance, timetable, curriculum, fees, library, payroll.",
    "**Then the learning** — 4 certificate programmes already authored, delivered in the same app "
    "students open daily for results.",
]

BUILT = [
    "**Academics:** syllabus parsing, auto faculty-mapping, clash-safe auto-timetable, attendance.",
    "**Assessment:** question bank, AI papers with an approval trail, secure online exams, AI and "
    "manual grading, transcripts.",
    "**Operations:** fees, challans, online payments, library, inventory, procurement, payroll.",
    "**Learning:** 4 certificate programmes (32 modules, 984 quiz items), placement prep, coding lab.",
    "**India-first:** six languages with native-script AI output, UUCMS, BCU/KUD scheme packs.",
]

ECON_STRIP = (
    "**Unit economics, measured:**  ₹22.45 L revenue per 5,000-student college at ₹449/student/year  ·  "
    "₹18,123 a year of cloud for that whole college  ·  ₹23 of AI per student per year  ·  "
    "31–45 % gross margin, rising with every college added."
)

DIFF = [
    ("Legacy ERPs", "Compliance paperwork. No AI, English-only, ₹300–1,200 per student plus "
                    "implementation."),
    ("SIS + LMS", "AI bolted on later; the college supplies its own content."),
    ("AI paper tools", "A PDF for a teacher — no campus data, exams, grading or transcripts."),
    ("Vriddhi", "The assessment engine joined to the system of record — content included."),
]

TRACTION = (
    "**Stated plainly:** the product is complete and audited (clean type-check, ~1,540 tests, 1,827 "
    "lines of security rules, costing and health audits on file) and we are pre-revenue. The next 90 "
    "days convert interest into 3–5 paid pilots — that is what this round buys."
)

ASK_AMOUNT = "₹50 L"
ASK_TERMS = "indicative 8–10 %, CCPS or a convertible note with a 20 % discount and a valuation cap"

USE_OF_FUNDS = [
    ("Engineering — 1 full-stack", "₹18 L", "36 %"),
    ("Implementation & pilot support — 1 person", "₹9 L", "18 %"),
    ("Content & instructional design", "₹8 L", "16 %"),
    ("Sales, travel & demo setup", "₹5 L", "10 %"),
    ("Contingency", "₹4 L", "8 %"),
    ("Cloud, AI & tooling", "₹3 L", "6 %"),
    ("Legal, GST, DPDP & audit", "₹3 L", "6 %"),
]

# the panel is a "4 pillars" layout, so the spine gets 3 milestones of 3 lines each
MILESTONES = [
    ("Month 3", "5 paid pilots signed · fee gateway and alerts live"),
    ("Month 6", "10 colleges live · parent portal and NAAC pack shipped"),
    ("Month 9", "₹25–35 L ARR · 8 certificate programmes · seed-ready"),
]

NON_CASH = ("Non-cash asks: three warm introductions to college principals · one reference logo "
            "willing to be named · one university contact for a scheme-pack co-seed.")


# ── layout helpers ───────────────────────────────────────────────────────────

class OnePager(Deck):
    def __init__(self):
        super().__init__(orientation="P", page_format=(PW, PH))

    def section(self, x, y, w, title):
        """Small teal-ruled section heading."""
        self.rect_fill(x, y, 7, 1.0, TEAL)
        self.text_at(x, y + 2.4, title.upper(), 8.2, True, TEAL_D)
        return y + 6.6

    def rich(self, x, y, w, text, size=8.4, color=SLATE_6, lh=None):
        """A paragraph where **bold** marks emphasis; returns the next y."""
        lh = lh or size * 0.43
        cursor = x
        yy = y
        for token in text.split("**"):
            if not token:
                continue
            bold = token.startswith("*")  # placeholder, replaced below
            # split by our own marker convention
            pass
        # simple two-state renderer
        parts = []
        for i, chunk in enumerate(text.split("**")):
            if chunk:
                parts.append((i % 2 == 1, chunk))
        for bold, chunk in parts:
            words = chunk.split(" ")
            for j, word in enumerate(words):
                piece = word + (" " if j < len(words) - 1 else "")
                wpx = self.frag_width(piece, size, bold)
                if cursor + wpx > x + w and cursor > x:
                    yy += lh
                    cursor = x
                self.text_at(cursor, yy, piece, size, bold, color)
                cursor += wpx
        return yy + lh + 1.4

    def dark_chip(self, x, y, w, h, value, label):
        self.panel(x, y, w, h, fill=WHITE, border=BORDER, radius=2.2)
        self.rect_fill(x, y, 1.2, h, TEAL)
        self.text_at(x + 4, y + 3.4, value, 14.5, True, TEAL_D)
        self.block(x + 4, y + 11.4, w - 7, label, 7.0, SLATE_5, line_h=3.1)


def build(path):
    pdf = OnePager()
    pdf.set_title("Vriddhi — investor one-pager")
    pdf.set_author("Vriddhi")
    pdf.set_subject("The AI-native academic operating system for Indian colleges")
    pdf.add_page()
    pdf.rect_fill(0, 0, PW, PH, WHITE)
    pdf.rect_fill(0, 0, PW, 1.6, TEAL)

    # ── header ──────────────────────────────────────────────────────────────
    if os.path.exists(LOGO_LIGHT):
        pdf.image(LOGO_LIGHT, x=MARGIN, y=12.0, w=42)
    pdf.text_at(MARGIN, 12.6, "INVESTOR ONE-PAGER · 2026", 8.0, True, TEAL_D,
                align="R", w=COL)
    pdf.text_at(MARGIN, 18.0, "<your name>  ·  <email>  ·  <phone>", 7.6, False, SLATE_5,
                align="R", w=COL)
    pdf.text_at(MARGIN, 23.2, "www.vriddhi.in  ·  built in Karnataka", 7.6, False, SLATE_4,
                align="R", w=COL)
    pdf.set_draw_color(*BORDER)
    pdf.set_line_width(0.2)
    pdf.line(MARGIN, 30.0, PW - MARGIN, 30.0)

    # ── headline ────────────────────────────────────────────────────────────
    y = 35.0
    for line in pdf.wrap(HEADLINE, 17.5, COL, True):
        pdf.text_at(MARGIN, y, line, 17.5, True, SLATE)
        y += 7.8
    y = pdf.block(MARGIN, y + 0.6, COL, SUMMARY, 9.0, SLATE_6, line_h=4.3) + 2.6

    # ── market chips ────────────────────────────────────────────────────────
    chip_gap = 4.0
    cw = (COL - chip_gap * 3) / 4
    for i, (value, label) in enumerate(CHIPS):
        pdf.dark_chip(MARGIN + i * (cw + chip_gap), y, cw, 19.0, value, label)
    y += 19.0 + 6.4

    # ── two balanced columns ────────────────────────────────────────────────
    top = y
    lx, rx = MARGIN, MARGIN + HALF + GUTTER
    ly = pdf.section(lx, top, HALF, "The problem")
    for para in PROBLEM:
        ly = pdf.rich(lx + 3.0, ly, HALF - 3.0, para, 8.2) + 0.8
    ly += 1.4
    ly = pdf.section(lx, ly, HALF, "How we get in")
    for para in WEDGE:
        ly = pdf.rich(lx + 3.0, ly, HALF - 3.0, para, 8.2) + 0.8

    ry = pdf.section(rx, top, HALF, "What is built — today")
    for para in BUILT:
        ry = pdf.rich(rx + 3.0, ry, HALF - 3.0, para, 8.2) + 0.8
    ry += 1.4
    ry = pdf.section(rx, ry, HALF, "Why we differ")
    for name, detail in DIFF:
        pdf.text_at(rx + 3.0, ry, name, 8.2, True, TEAL_D)
        ry = pdf.block(rx + 25.0, ry - 0.2, HALF - 25.0, detail, 7.9, SLATE_6, line_h=3.5) + 1.0

    y = max(ly, ry) + 1.0

    # ── unit economics strip ────────────────────────────────────────────────
    y = pdf.rich(MARGIN, y, COL, ECON_STRIP, 8.4, SLATE_6) + 2.6

    # ── the ask ─────────────────────────────────────────────────────────────
    panel_y = y
    panel_h = 76.0
    pdf.panel(MARGIN, panel_y, COL, panel_h, fill=TEAL_50, border=TEAL, radius=2.4)
    inner = panel_y + 6.0
    pdf.text_at(MARGIN + 5.0, inner, f"THE ASK — {ASK_AMOUNT}", 8.8, True, TEAL_D)
    pdf.text_at(MARGIN + 5.0, inner + 5.2, ASK_TERMS, 7.6, False, SLATE_6)
    inner += 11.0

    ux, uw = MARGIN + 5.0, 104.0
    pdf.text_at(ux, inner, "USE OF FUNDS", 7.4, True, SLATE)
    row = inner + 4.6
    for name, amount, pct in USE_OF_FUNDS:
        pdf.text_at(ux, row, name, 7.6, False, SLATE_6)
        pdf.text_at(ux + uw - 24.0, row, amount, 7.6, True, SLATE)
        pdf.text_at(ux + uw - 10.0, row, pct, 7.6, False, SLATE_5)
        pdf.set_draw_color(214, 232, 228)
        pdf.set_line_width(0.1)
        pdf.line(ux, row + 4.0, ux + uw, row + 4.0)
        row += 5.0

    mx = MARGIN + COL - 5.0 - 60.0
    pdf.text_at(mx, inner, "WHAT IT BUYS", 7.4, True, SLATE)
    my = inner + 4.6
    for label, detail in MILESTONES:
        pdf.text_at(mx, my, label, 7.6, True, TEAL_D)
        my = pdf.block(mx, my + 3.7, 60.0, detail, 7.4, SLATE_6, line_h=3.3) + 2.0

    pdf.set_draw_color(178, 222, 214)
    pdf.set_line_width(0.2)
    pdf.line(MARGIN + 5.0, panel_y + panel_h - 10.4, PW - MARGIN - 5.0, panel_y + panel_h - 10.4)
    pdf.block(MARGIN + 5.0, panel_y + panel_h - 8.0, COL - 10.0, NON_CASH, 7.2, SLATE_6,
              line_h=3.3)
    y = panel_y + panel_h + 4.0

    # ── honest traction + footer ────────────────────────────────────────────
    y = pdf.rich(MARGIN, y, COL, TRACTION, 8.0, SLATE_5)
    body_bottom = max(m[0] for m in pdf._marks) if pdf._marks else 0   # before the footer
    pdf.set_draw_color(*BORDER)
    pdf.set_line_width(0.2)
    pdf.line(MARGIN, PH - 14.0, PW - MARGIN, PH - 14.0)
    pdf.text_at(MARGIN, PH - 11.0,
                "Vriddhi (वृद्धि) — growth through knowledge.  Every figure here is verifiable in "
                "the product repository or a cited public source.",
                7.0, False, SLATE_4)
    pdf.text_at(MARGIN, PH - 11.0, "1 / 1", 7.0, False, SLATE_4, align="R", w=COL)

    pdf.output(path)
    limit = PH - 17.0          # the footer rule sits at PH − 14
    flag = "  ⚠ OVERFLOWS" if body_bottom > limit else "  ✓ fits"
    print(f"saved {path} (A4 portrait, body ends at {body_bottom:.1f} mm, "
          f"footer rule at {limit:.0f}){flag}")


if __name__ == "__main__":
    build(os.path.join(HERE, "Vriddhi_Investor_OnePager.pdf"))
