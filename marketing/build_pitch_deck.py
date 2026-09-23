#!/usr/bin/env python3
"""Builds Vriddhi_Pitch_Deck.pptx — 12-slide 16:9 pitch deck."""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # repo root
BRAND = os.path.join(ROOT, "brand")
HERO = os.path.join(BRAND, "hero", "vriddhi-mark-hero-light.png")
LOGO_LIGHT = os.path.join(BRAND, "logo", "png", "vriddhi-logo-horizontal-transparent@1600.png")
LOGO_REVERSE = os.path.join(BRAND, "logo", "png", "vriddhi-logo-horizontal-reverse@1600.png")

# ---- brand tokens -----------------------------------------------------------
TEAL = "14B8A6"
TEAL_D = "0F766E"
TEAL_3 = "5EEAD4"
TEAL_4 = "2DD4BF"
TEAL_50 = "F0FDFA"
TEAL_100 = "CCFBF1"
SLATE = "0F172A"
SLATE_2 = "1E293B"
SLATE_6 = "475569"
SLATE_5 = "64748B"
SLATE_4 = "94A3B8"
SLATE_3 = "CBD5E1"
BORDER = "E2E8F0"
BG = "F8FAFC"
WHITE = "FFFFFF"
DARK_BG = "0B1220"   # matches the reverse-lockup backing
FONT = "Inter"

SW, SH = 13.333, 7.5
M = 0.62  # outer margin

prs = Presentation()
prs.slide_width = Inches(SW)
prs.slide_height = Inches(SH)
BLANK = prs.slide_layouts[6]


def C(hexc):
    return RGBColor.from_string(hexc)


def slide_bg(color):
    s = prs.slides.add_slide(BLANK)
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = C(color)
    return s


def box(slide, x, y, w, h, fill=None, line=None, lw=0.75, round_=None, adj=0.08):
    shape_type = MSO_SHAPE.ROUNDED_RECTANGLE if round_ is not None else MSO_SHAPE.RECTANGLE
    shp = slide.shapes.add_shape(shape_type, Inches(x), Inches(y), Inches(w), Inches(h))
    if round_ is not None:
        try:
            shp.adjustments[0] = adj
        except Exception:
            pass
    if fill:
        shp.fill.solid()
        shp.fill.fore_color.rgb = C(fill)
    else:
        shp.fill.background()
    if line:
        shp.line.color.rgb = C(line)
        shp.line.width = Pt(lw)
    else:
        shp.line.fill.background()
    shp.shadow.inherit = False
    return shp


def tb(slide, x, y, w, h, paras, anchor=MSO_ANCHOR.TOP, wrap=True):
    """paras: list of dicts {runs:[{t,s,b,i,c,font}], align, space_before, space_after, line}"""
    tbox = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tbox.text_frame
    tf.word_wrap = wrap
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    first = True
    for para in paras:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.alignment = para.get("align", PP_ALIGN.LEFT)
        if "space_before" in para:
            p.space_before = Pt(para["space_before"])
        if "space_after" in para:
            p.space_after = Pt(para["space_after"])
        p.line_spacing = para.get("line", 1.0)
        for r in para["runs"]:
            run = p.add_run()
            run.text = r["t"]
            f = run.font
            f.name = r.get("font", FONT)
            f.size = Pt(r.get("s", 14))
            f.bold = r.get("b", False)
            f.italic = r.get("i", False)
            f.color.rgb = C(r.get("c", SLATE))
    return tbox


def P(t, s=14, b=False, i=False, c=SLATE, **kw):
    d = {"t": t, "s": s, "b": b, "i": i, "c": c}
    d.update(kw)
    return d


def header(slide, kicker, title, sub=None, dark=False):
    kc = TEAL_3 if dark else TEAL_D
    tc = WHITE if dark else SLATE
    sc = SLATE_3 if dark else SLATE_5
    tb(slide, M, 0.52, 8, 0.3, [
        {"runs": [P(kicker, 11, True, False, kc)]}
    ])
    tb(slide, M, 0.82, SW - 2 * M, 0.85, [
        {"runs": [P(title, 30, True, False, tc)]}
    ])
    if sub:
        tb(slide, M, 1.52, SW - 2 * M, 0.4, [
            {"runs": [P(sub, 13.5, False, False, sc)]}
        ])
    box(slide, M, 0.44, 0.5, 0.055, fill=TEAL)


def chip(slide, x, y, w, h, label, fill=WHITE, line=BORDER, text_c=SLATE, dot=TEAL, s=12.5):
    box(slide, x, y, w, h, fill=fill, line=line, round_=True, adj=0.5)
    dotd = min(0.09, h * 0.16)
    box(slide, x + 0.24, y + h / 2 - dotd / 2, dotd, dotd, fill=dot, round_=True, adj=0.5)
    tb(slide, x + 0.44, y, w - 0.6, h, [
        {"runs": [P(label, s, True, False, text_c)]}
    ], anchor=MSO_ANCHOR.MIDDLE)


def bullet_list(slide, x, y, w, items, s=12.5, gap=7, color=SLATE_6, dot=TEAL):
    paras = []
    for it in items:
        paras.append({
            "runs": [P("●  ", 9, False, False, dot), P(it, s, False, False, color)],
            "space_after": gap,
            "line": 1.12,
        })
    tb(slide, x, y, w, 4.5, paras)


# ============================================================================
# S1 — Title
# ============================================================================
s = slide_bg(DARK_BG)
box(s, 0, 0, SW, 0.09, fill=TEAL)
tb(s, M, 1.1, 7, 0.4, [{"runs": [P("PITCH DECK · 2026", 12, True, False, TEAL_3)]}])
# real logo lockup (reverse, white on #0B1220 — matches this slide's background)
s.shapes.add_picture(LOGO_REVERSE, Inches(M), Inches(1.5), width=Inches(6.1))
box(s, M + 0.06, 3.72, 0.62, 0.06, fill=TEAL)
tb(s, M, 3.95, 7.2, 0.5, [
    {"runs": [P("The academic operating system for Indian colleges", 21, True, False, TEAL_3)]}
])
tb(s, M, 4.55, 6.9, 1.2, [
    {"runs": [P("AI-powered question papers, assessments and administration —", 13.5, False, False, SLATE_3)], "line": 1.35},
    {"runs": [P("in the languages India speaks.", 13.5, False, False, SLATE_3)], "line": 1.35},
])
# hero on white card
card = box(s, 8.35, 1.15, 4.35, 5.2, fill=WHITE, round_=True, adj=0.045)
hero_w, hero_h = 4.0, 3.08
s.shapes.add_picture(HERO, Inches(8.35 + (4.35 - hero_w) / 2), Inches(1.15 + (5.2 - hero_h) / 2 - 0.28), width=Inches(hero_w))
s.shapes.add_picture(LOGO_REVERSE, Inches(8.35 + (4.35 - 2.6) / 2), Inches(1.15 + 5.2 - 0.85), width=Inches(2.6))
tb(s, M, 6.85, 7, 0.4, [
    {"runs": [P("Growth through knowledge", 11, False, True, SLATE_4)]}
])

# ============================================================================
# S2 — Problem
# ============================================================================
s = slide_bg(BG)
header(s, "THE PROBLEM", "Colleges run on spreadsheets, legacy ERPs and guesswork")
cards = [
    ("Fragmented systems", "Attendance, fees, tests and timetables live in separate spreadsheets and legacy tools — no single source of truth, and end-of-semester re-entry for everything."),
    ("The exam-paper bottleneck", "Faculty hand-build a paper for every subject, every semester, then mark scripts over weekends. Paper-making, not teaching, eats the cycle."),
    ("Software that doesn't speak", "Global ERPs and LMSs ship in English alone. Kannada, Tamil, Telugu and Malayalam — the languages of the classroom — are an afterthought."),
    ("State compliance gaps", "Karnataka's UUCMS portal, BCU pass rules and NEP scheme structures are not built into mainstream products. Colleges adapt by hand."),
]
cw, ch, gx, gy = 5.93, 2.35, 0.32, 0.32
x0, y0 = M, 2.15
for i, (t, d) in enumerate(cards):
    cx = x0 + (i % 2) * (cw + gx)
    cy = y0 + (i // 2) * (ch + gy)
    box(s, cx, cy, cw, ch, fill=WHITE, line=BORDER, round_=True, adj=0.05)
    box(s, cx, cy, 0.07, ch, fill=TEAL, round_=False)
    tb(s, cx + 0.35, cy + 0.28, cw - 0.7, 0.5, [{"runs": [P(t, 16.5, True, False, SLATE)]}])
    tb(s, cx + 0.35, cy + 0.85, cw - 0.7, ch - 1.1, [
        {"runs": [P(d, 12.5, False, False, SLATE_6)], "line": 1.25}
    ])

# ============================================================================
# S3 — Solution
# ============================================================================
s = slide_bg(BG)
header(s, "THE SOLUTION", "One platform for the whole academic life-cycle")
tb(s, M, 2.1, 6.6, 1.1, [
    {"runs": [P("Vriddhi (वृद्धि — growth) ", 14, True, False, SLATE),
              P("brings every academic process into one role-based platform: from admission records to transcripts, attendance to analytics — with AI doing the heavy lifting.", 14, False, False, SLATE_6)],
     "line": 1.35}
])
pillars = [
    ("One platform", "Seven role dashboards — student, faculty, HOD, mentor, principal, college admin and superadmin — on one secure login."),
    ("AI at the core", "AI-generated questions and exam papers, AI auto-grading with confidence scores, and a human-in-the-loop review for every output."),
    ("Built for India", "Six languages with native Unicode AI output, UUCMS student integration and university pass rules configured — not coded."),
]
py = 3.35
for t, d in pillars:
    box(s, M, py, 6.6, 1.12, fill=WHITE, line=BORDER, round_=True, adj=0.09)
    box(s, M + 0.28, py + 0.31, 0.5, 0.5, fill=TEAL_50, line=TEAL, lw=1, round_=True, adj=0.22)
    tb(s, M + 0.28, py + 0.31, 0.5, 0.5, [{"runs": [P("✓", 15, True, False, TEAL_D)], "align": PP_ALIGN.CENTER}], anchor=MSO_ANCHOR.MIDDLE)
    tb(s, M + 1.0, py + 0.14, 5.4, 0.4, [{"runs": [P(t, 14.5, True, False, SLATE)]}])
    tb(s, M + 1.0, py + 0.52, 5.4, 0.55, [{"runs": [P(d, 11.5, False, False, SLATE_6)], "line": 1.15}])
    py += 1.28
card = box(s, 8.0, 2.05, 4.7, 5.0, fill=WHITE, round_=True, adj=0.045)
hero_w, hero_h = 4.2, 3.24
s.shapes.add_picture(HERO, Inches(8.0 + (4.7 - hero_w) / 2), Inches(2.05 + (5.0 - hero_h) / 2 - 0.4), width=Inches(hero_w))
s.shapes.add_picture(LOGO_REVERSE, Inches(8.0 + (4.7 - 2.7) / 2), Inches(2.05 + 5.0 - 1.0), width=Inches(2.7))

# ============================================================================
# S4 — Product overview
# ============================================================================
s = slide_bg(BG)
header(s, "THE PLATFORM", "Every academic module, one login")
mods = [
    ("Attendance",), ("Online tests & exams",), ("Question bank",), ("AI paper generator",),
    ("Curriculum & syllabus",), ("Fees management",), ("Timetables",), ("Results & transcripts",),
    ("Analytics & View 360",), ("Library",), ("Assignments & materials",), ("Appointments & events",),
]
cw, chh, gx, gy = 3.64, 0.92, 0.18, 0.22
x0, y0 = M, 2.2
for i, (name,) in enumerate(mods):
    cx = x0 + (i % 3) * (cw + gx)
    cy = y0 + (i // 3) * (chh + gy)
    chip(s, cx, cy, cw, chh, name, s=13)
note_y, note_h = 6.62, 0.72
box(s, M, note_y, SW - 2 * M, note_h, fill=TEAL_50, line=TEAL_100, round_=True, adj=0.18)
tb(s, M + 0.35, note_y, SW - 2 * M - 0.7, note_h, [
    {"runs": [P("Everything works together — data flows from attendance to analytics without re-keying.", 12.5, True, False, TEAL_D)]}
], anchor=MSO_ANCHOR.MIDDLE)

# ============================================================================
# S5 — AI engine
# ============================================================================
s = slide_bg(BG)
header(s, "AI ENGINE", "AI that drafts. Faculty that decide.")
cards = [
    ("AI question generation", "Aptitude and subject questions with options, marks and step-by-step explanations — generated in the language you choose, added straight to your question bank."),
    ("AI paper generator", "Exam papers assembled from your question bank in print, online and bank formats, with templates and topic rules. Export to print-ready PDF."),
    ("AI auto-grading", "Rubric-based scoring of descriptive answers with per-question confidence scores. Faculty review one pass instead of re-reading every script."),
]
cw, chh = 3.92, 3.0
x0, y0 = M, 2.2
for i, (t, d) in enumerate(cards):
    cx = x0 + i * (cw + 0.24)
    box(s, cx, y0, cw, chh, fill=WHITE, line=BORDER, round_=True, adj=0.05)
    box(s, cx + 0.3, y0 + 0.3, 0.56, 0.56, fill=TEAL_50, line=TEAL, lw=1, round_=True, adj=0.22)
    tb(s, cx + 0.3, y0 + 0.3, 0.56, 0.56, [{"runs": [P("✦", 15, True, False, TEAL_D)], "align": PP_ALIGN.CENTER}], anchor=MSO_ANCHOR.MIDDLE)
    tb(s, cx + 0.3, y0 + 1.05, cw - 0.6, 0.6, [{"runs": [P(t, 15.5, True, False, SLATE)]}])
    tb(s, cx + 0.3, y0 + 1.55, cw - 0.6, 1.3, [{"runs": [P(d, 12, False, False, SLATE_6)], "line": 1.25}])
box(s, M, 5.55, SW - 2 * M, 0.95, fill=DARK_BG, round_=True, adj=0.16)
tb(s, M + 0.4, 5.55, SW - 2 * M - 0.8, 0.95, [
    {"runs": [P("Multi-provider by design:  ", 12.5, True, False, TEAL_3),
              P("Gemini · OpenAI · DeepSeek — selectable at runtime, with automatic fallbacks and per-tier usage checks.", 12.5, False, False, SLATE_3)]}
], anchor=MSO_ANCHOR.MIDDLE)

# ============================================================================
# S6 — India first
# ============================================================================
s = slide_bg(BG)
header(s, "INDIA-FIRST", "Designed for Indian classrooms and state systems")
# left: languages
box(s, M, 2.2, 6.0, 4.5, fill=WHITE, line=BORDER, round_=True, adj=0.04)
tb(s, M + 0.4, 2.55, 5.2, 0.45, [{"runs": [P("Six languages, end to end", 17, True, False, SLATE)]}])
tb(s, M + 0.4, 3.05, 5.2, 0.6, [
    {"runs": [P("Interface and AI-generated questions in native Unicode scripts.", 12, False, False, SLATE_6)], "line": 1.2}
])
langs = ["Kannada", "Tamil", "Telugu", "Malayalam", "Hindi", "English"]
lw_ = 2.44
for i, L in enumerate(langs):
    lx = M + 0.4 + (i % 2) * (lw_ + 0.22)
    ly = 3.85 + (i // 2) * 0.78
    chip(s, lx, ly, lw_, 0.62, L, fill=TEAL_50, line=TEAL_100, text_c=TEAL_D, dot=TEAL, s=12.5)
tb(s, M + 0.4, 6.15, 5.3, 0.4, [
    {"runs": [P("A student reads the paper in their language; the faculty grades it in theirs.", 11, False, True, SLATE_5)]}
])
# right: state systems
box(s, 7.0, 2.2, SW - 7.0 - M, 4.5, fill=WHITE, line=BORDER, round_=True, adj=0.04)
tb(s, 7.4, 2.55, 5.0, 0.45, [{"runs": [P("Karnataka-ready out of the box", 17, True, False, SLATE)]}])
state_items = [
    ("UUCMS integration", "Import Candidate IDs and USNs from the state portal; auto-link by email; sync-status dashboard."),
    ("University pass rules", "BCU under-graduate pass logic (UE + aggregate) applied on result import."),
    ("NEP & scheme ready", "Curriculum upload, syllabus parsing and credit-structure mapping for modern schemes."),
    ("Exam workflows", "Hall-ticket-ready exam data, timetables with conflict detection, result publishing pipeline."),
]
yy = 3.15
for t, d in state_items:
    box(s, 7.4, yy, 0.14, 0.14, fill=TEAL, round_=True, adj=0.5)
    tb(s, 7.68, yy - 0.055, 4.75, 0.4, [{"runs": [P(t, 13, True, False, SLATE)]}])
    tb(s, 7.68, yy + 0.27, 4.75, 0.6, [{"runs": [P(d, 11, False, False, SLATE_6)], "line": 1.15}])
    yy += 0.88

# ============================================================================
# S7 — Roles
# ============================================================================
s = slide_bg(BG)
header(s, "EVERY ROLE", "A dashboard for everyone on campus")
roles = [
    ("Student", "Tests with autosave, fee portal, timetable, library, results and progress analytics."),
    ("Faculty", "Attendance marking, question bank, AI papers, auto-grading queue, appointments."),
    ("HOD & Mentor", "Department analytics, mentoring plans and faculty workloads."),
    ("Principal", "College-wide overview, approvals and performance signals."),
    ("College Admin", "Records, curriculum, fees, UUCMS mapping and result publishing."),
    ("Superadmin", "Multi-college & university operations, subscription billing, health monitor."),
]
cw, chh, gx, gy = 3.92, 1.85, 0.24, 0.3
x0, y0 = M, 2.2
for i, (t, d) in enumerate(roles):
    cx = x0 + (i % 3) * (cw + gx)
    cy = y0 + (i // 3) * (chh + gy)
    box(s, cx, cy, cw, chh, fill=WHITE, line=BORDER, round_=True, adj=0.07)
    tb(s, cx + 0.3, cy + 0.22, cw - 0.6, 0.4, [{"runs": [P(t, 14.5, True, False, TEAL_D)]}])
    box(s, cx + 0.3, cy + 0.62, 0.42, 0.045, fill=TEAL)
    tb(s, cx + 0.3, cy + 0.8, cw - 0.6, 0.95, [{"runs": [P(d, 11.5, False, False, SLATE_6)], "line": 1.2}])
tb(s, M, 6.75, SW - 2 * M, 0.4, [
    {"runs": [P("Multi-tenant SaaS — one platform for a single college or a whole university.", 12.5, True, False, SLATE_5)]}
])

# ============================================================================
# S8 — Business model
# ============================================================================
s = slide_bg(BG)
header(s, "BUSINESS MODEL", "Per-college subscriptions. No per-student licensing.")
cards = [
    ("College subscription", "A flat monthly plan per college covering the full platform — every module, every role. Simple to budget, simple to renew."),
    ("Superadmin at scale", "Universities and operators manage many colleges from one console: onboarding, subscription billing, cross-college comparison and a system health monitor."),
    ("AI included", "Multi-provider generation with fallbacks keeps AI costs predictable; usage is checked per subscription tier."),
]
cw, chh = 3.92, 3.2
x0, y0 = M, 2.2
for i, (t, d) in enumerate(cards):
    cx = x0 + i * (cw + 0.24)
    box(s, cx, y0, cw, chh, fill=WHITE, line=BORDER, round_=True, adj=0.05)
    box(s, cx, y0, cw, 0.12, fill=TEAL)
    tb(s, cx + 0.3, y0 + 0.45, cw - 0.6, 0.5, [{"runs": [P(t, 16, True, False, SLATE)]}])
    tb(s, cx + 0.3, y0 + 1.05, cw - 0.6, 1.9, [{"runs": [P(d, 12.5, False, False, SLATE_6)], "line": 1.3}])
box(s, M, 5.75, SW - 2 * M, 0.85, fill=TEAL_50, line=TEAL_100, round_=True, adj=0.18)
tb(s, M + 0.4, 5.75, SW - 2 * M - 0.8, 0.85, [
    {"runs": [P("Pilot colleges get launch pricing — final plans are tailored in the discussion.", 12.5, True, False, TEAL_D)]}
], anchor=MSO_ANCHOR.MIDDLE)

# ============================================================================
# S9 — Why Vriddhi
# ============================================================================
s = slide_bg(BG)
header(s, "WHY VRIDDHI", "The academic core, done properly")
# left: legacy
box(s, M, 2.2, 5.9, 4.4, fill=WHITE, line=BORDER, round_=True, adj=0.04)
tb(s, M + 0.4, 2.5, 5.1, 0.45, [{"runs": [P("Legacy college ERPs", 16, True, False, SLATE_5)]}])
legacy = [
    "“20+ modules” — but no AI exam workflow",
    "English-only interfaces",
    "Heavy, month-long onboarding",
    "Per-student pricing at scale",
    "State portals handled by hand",
]
yy = 3.15
for it in legacy:
    tb(s, M + 0.4, yy, 5.2, 0.6, [
        {"runs": [P("—  ", 12, True, False, SLATE_4), P(it, 12.5, False, False, SLATE_5)], "line": 1.15}
    ])
    yy += 0.62
# right: vriddhi
box(s, 6.8, 2.2, SW - 6.8 - M, 4.4, fill=DARK_BG, round_=True, adj=0.04)
tb(s, 7.2, 2.5, 5.0, 0.45, [{"runs": [P("Vriddhi", 16, True, False, TEAL_3)]}])
ours = [
    "AI exam papers with human-in-the-loop review",
    "Six Indic languages, AI output included",
    "UUCMS & BCU compliance built in",
    "Flat per-college pricing",
    "Modern React + Firebase stack, security-audited",
]
yy = 3.15
for it in ours:
    tb(s, 7.2, yy, 5.2, 0.6, [
        {"runs": [P("✓  ", 12, True, False, TEAL_4), P(it, 12.5, False, False, SLATE_3)], "line": 1.15}
    ])
    yy += 0.62

# ============================================================================
# S10 — Today / next
# ============================================================================
s = slide_bg(BG)
header(s, "TRACTION & ROADMAP", "Shipped, and shipping")
box(s, M, 2.2, 5.9, 4.5, fill=WHITE, line=BORDER, round_=True, adj=0.04)
tb(s, M + 0.4, 2.5, 5.1, 0.45, [{"runs": [P("Live today", 16, True, False, TEAL_D)]}])
live = [
    "Seven role-based dashboards, end to end",
    "Online test engine — autosave, expiry recovery, results",
    "AI question & paper generation, three providers",
    "UUCMS import, mapping and sync status",
    "Result import with BCU pass rules & SGPA",
    "Fees records and student fee portal",
    "Analytics View 360 + multi-college comparison",
    "Subscription billing & system health monitor",
]
yy = 3.1
for it in live:
    tb(s, M + 0.4, yy, 5.2, 0.5, [
        {"runs": [P("✓  ", 11.5, True, False, TEAL), P(it, 12, False, False, SLATE_6)], "line": 1.1}
    ])
    yy += 0.47
box(s, 6.8, 2.2, SW - 6.8 - M, 4.5, fill=WHITE, line=BORDER, round_=True, adj=0.04)
tb(s, 7.2, 2.5, 5.0, 0.45, [{"runs": [P("Next", 16, True, False, SLATE)]}])
nxt = [
    "Fee collection via payment gateway",
    "Hall tickets & marksheets",
    "NAAC / NBA / OBE attainment reporting",
    "PWA / mobile experience",
    "Parent portal",
    "SMS / WhatsApp notifications",
]
yy = 3.1
for it in nxt:
    tb(s, 7.2, yy, 5.2, 0.5, [
        {"runs": [P("→  ", 11.5, True, False, TEAL_4), P(it, 12, False, False, SLATE_6)], "line": 1.1}
    ])
    yy += 0.47

# ============================================================================
# S11 — The ask
# ============================================================================
s = slide_bg(BG)
header(s, "THE ASK", "Where we'd like your help")
cards = [
    ("Pilot colleges", "Three to five Karnataka colleges for a live pilot — UUCMS onboarding, question-bank seeding and a full exam cycle on Vriddhi."),
    ("University champions", "Partnerships to validate UUCMS alignment, pass-rule coverage and to co-seed standard question banks per university."),
    ("Seed partners", "Funding to close the revenue-critical gaps: fee collection, hall tickets & marksheets, and OBE reporting."),
]
cw, chh = 3.92, 3.1
x0, y0 = M, 2.2
for i, (t, d) in enumerate(cards):
    cx = x0 + i * (cw + 0.24)
    box(s, cx, y0, cw, chh, fill=WHITE, line=BORDER, round_=True, adj=0.05)
    box(s, cx + 0.3, y0 + 0.32, 0.52, 0.52, fill=TEAL, round_=True, adj=0.25)
    tb(s, cx + 0.3, y0 + 0.32, 0.52, 0.52, [{"runs": [P(str(i + 1), 15, True, False, WHITE)], "align": PP_ALIGN.CENTER}], anchor=MSO_ANCHOR.MIDDLE)
    tb(s, cx + 0.3, y0 + 1.05, cw - 0.6, 0.5, [{"runs": [P(t, 15.5, True, False, SLATE)]}])
    tb(s, cx + 0.3, y0 + 1.55, cw - 0.6, 1.4, [{"runs": [P(d, 12, False, False, SLATE_6)], "line": 1.25}])
box(s, M, 5.7, SW - 2 * M, 0.9, fill=DARK_BG, round_=True, adj=0.17)
tb(s, M + 0.4, 5.7, SW - 2 * M - 0.8, 0.9, [
    {"runs": [P("In exchange:  ", 12.5, True, False, TEAL_3),
              P("early access, launch pricing, and a product shaped with your college from day one.", 12.5, False, False, SLATE_3)]}
], anchor=MSO_ANCHOR.MIDDLE)

# ============================================================================
# S12 — Contact
# ============================================================================
s = slide_bg(DARK_BG)
box(s, 0, SH - 0.09, SW, 0.09, fill=TEAL)
s.shapes.add_picture(LOGO_REVERSE, Inches(M), Inches(0.75), width=Inches(2.6))
tb(s, M, 2.3, 7.3, 1.2, [{"runs": [P("Let's grow together.", 44, True, False, WHITE)]}])
box(s, M + 0.06, 3.62, 0.62, 0.06, fill=TEAL)
tb(s, M, 3.95, 7.0, 1.4, [
    {"runs": [P("The academic operating system for Indian colleges.", 15, True, False, TEAL_3)], "space_after": 10, "line": 1.3},
    {"runs": [P("hello@vriddhi.in   ·   www.vriddhi.in", 13, False, False, SLATE_3)], "space_after": 6},
    {"runs": [P("Pilot onboarding for Karnataka colleges starts 2026.", 11.5, False, True, SLATE_4)]},
])
card = box(s, 8.55, 1.6, 4.15, 4.9, fill=WHITE, round_=True, adj=0.045)
hero_w, hero_h = 3.75, 2.89
s.shapes.add_picture(HERO, Inches(8.55 + (4.15 - hero_w) / 2), Inches(1.6 + (4.9 - hero_h) / 2 - 0.35), width=Inches(hero_w))
tb(s, 8.55, 5.85, 4.15, 0.4, [
    {"runs": [P("Made in Karnataka · Built for India", 10.5, False, True, SLATE_5)], "align": PP_ALIGN.CENTER}
])

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Vriddhi_Pitch_Deck.pptx")
prs.save(OUT)
print("saved", OUT)
