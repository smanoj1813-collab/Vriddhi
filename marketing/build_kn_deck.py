#!/usr/bin/env python3
"""Builds Vriddhi_Pitch_Deck_KN.pptx — 12-slide 16:9 pitch deck in Kannada.

All text runs use "Noto Sans Kannada" (covers basic Latin + all Kannada).
PowerPoint shapes text at render time, so no shaping pipeline is needed here.
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # repo root
BRAND = os.path.join(ROOT, "brand")
HERO = os.path.join(BRAND, "hero", "vriddhi-mark-hero-light.png")
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
DARK_BG = "0B1220"
FONT = "Noto Sans Kannada"

SW, SH = 13.333, 7.5
M = 0.62

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
    tb(slide, M, 0.52, 8, 0.3, [{"runs": [P(kicker, 11, True, False, kc)]}])
    tb(slide, M, 0.82, SW - 2 * M, 0.85, [{"runs": [P(title, 26, True, False, tc)]}])
    if sub:
        tb(slide, M, 1.52, SW - 2 * M, 0.4, [{"runs": [P(sub, 12.5, False, False, sc)]}])
    box(slide, M, 0.44, 0.5, 0.055, fill=TEAL)


def chip(slide, x, y, w, h, label, fill=WHITE, line=BORDER, text_c=SLATE, dot=TEAL, s=12):
    box(slide, x, y, w, h, fill=fill, line=line, round_=True, adj=0.5)
    dotd = min(0.09, h * 0.16)
    box(slide, x + 0.24, y + h / 2 - dotd / 2, dotd, dotd, fill=dot, round_=True, adj=0.5)
    tb(slide, x + 0.44, y, w - 0.6, h, [{"runs": [P(label, s, True, False, text_c)]}],
       anchor=MSO_ANCHOR.MIDDLE)


# ============================================================================
# S1 — Title
# ============================================================================
s = slide_bg(DARK_BG)
box(s, 0, 0, SW, 0.09, fill=TEAL)
tb(s, M, 1.1, 7, 0.4, [{"runs": [P("ಪಿಚ್ ಡೆಕ್ · 2026", 12, True, False, TEAL_3)]}])
s.shapes.add_picture(LOGO_REVERSE, Inches(M), Inches(1.5), width=Inches(6.1))
box(s, M + 0.06, 3.72, 0.62, 0.06, fill=TEAL)
tb(s, M, 3.95, 7.4, 0.5, [
    {"runs": [P("ಭಾರತದ ಕಾಲೇಜುಗಳ ಶೈಕ್ಷಣಿಕ ಆಪರೇಟಿಂಗ್ ಸಿಸ್ಟಮ್", 19, True, False, TEAL_3)]}
])
tb(s, M, 4.55, 6.9, 1.2, [
    {"runs": [P("AI-ಆಧಾರಿತ ಪ್ರಶ್ನಾ ಪತ್ರಿಕೆಗಳು, ಮೌಲ್ಯಮಾಪನ ಮತ್ತು ನಿರ್ವಹಣೆ —", 12.5, False, False, SLATE_3)], "line": 1.35},
    {"runs": [P("ಭಾರತದ ಮಾತು ಭಾಷೆಗಳಲ್ಲೇ.", 12.5, False, False, SLATE_3)], "line": 1.35},
])
card = box(s, 8.35, 1.15, 4.35, 5.2, fill=WHITE, round_=True, adj=0.045)
hero_w, hero_h = 4.0, 3.08
s.shapes.add_picture(HERO, Inches(8.35 + (4.35 - hero_w) / 2), Inches(1.15 + (5.2 - hero_h) / 2 - 0.28), width=Inches(hero_w))
s.shapes.add_picture(LOGO_REVERSE, Inches(8.35 + (4.35 - 2.6) / 2), Inches(1.15 + 5.2 - 0.85), width=Inches(2.6))
tb(s, M, 6.85, 7, 0.4, [{"runs": [P("ಜ್ಞಾನದ ಮೂಲಕ ಬೆಳವಣಿಗೆ", 11, False, True, SLATE_4)]}])

# ============================================================================
# S2 — Problem
# ============================================================================
s = slide_bg(BG)
header(s, "ಸಮಸ್ಯೆ", "ಕಾಲೇಜುಗಳು spreadsheet, legacy ERP ಗಳ ಮೇಲೆ ಓಡುತ್ತವೆ")
cards = [
    ("ಒಯ್ಪಾದ ವ್ಯವಸ್ಥೆಗಳು", "ಹಾಜರಿ, ಶುಲ್ಕ, ಪರೀಕ್ಷೆ ಮತ್ತು ಸಮಯ ಕೋಷ್ಟಕ ಪ್ರತ್ಯೇಕ spreadsheet ಗಳಲ್ಲಿ — ಏಕ ಸ್ವರೂಪದ ಮೂಲವಿಲ್ಲ, ಮತ್ತು ಅವಧಿ-ಅಂತ್ಯದಲ್ಲಿ ಎಲ್ಲವನ್ನೂ ಮರು-ಆಮದು."),
    ("ಪ್ರಶ್ನಾ ಪತ್ರಿಕೆ ತಯಾರಿಕೆ", "ಅಧ್ಯಾಪಕರು ಪ್ರತಿ ವಿಷಯಕ್ಕೆ, ಪ್ರತಿ ಅವಧಿಗೆ ಪತ್ರಿಕೆ ಸಿದ್ಧಪಡಿಸುತ್ತಾರೆ, ನಂತರ ವಾರಾಂತ್ಯಗಳಲ್ಲಿ ಅಂಕ ಕೊಡುತ್ತಾರೆ. ಪತ್ರಿಕೆ ತಯಾರಿಕೆಯೇ ಚಕ್ರವನ್ನು ಖಾಲಿ ಮಾಡುತ್ತದೆ."),
    ("ಮಾತನಾಡದ ಸಾಫ್ಟ್‌ವೇರ್", "ವೈಶ್ವಿಕ ERP ಮತ್ತು LMS ಗಳು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಮಾತ್ರ ಬರುತ್ತವೆ. ಕನ್ನಡ, ತಮಿಳು, ತೆಲುಗು, ಮಲಯಾಳಂ — ಪಾಠಶಾಲೆಯ ಭಾಷೆಗಳು — ಮುಖ್ಯವಲ್ಲ."),
    ("ರಾಜ್ಯ ನಿಯಮ ಅಂತರಗಳು", "ಕರ್ನಾಟಕದ UUCMS ಪೋರ್ಟಲ್, BCU ಉತ್ತೀರ್ಣತಾ ನಿಯಮಗಳು ಮತ್ತು NEP ಯೋಜನೆ ರಚನೆಗಳು ಪ್ರಮುಖ ಉತ್ಪನ್ನಗಳಲ್ಲಿ ಇಲ್ಲ. ಕಾಲೇಜುಗಳು ಕೈಯಿಂದ ಹೊಂದಿಸಿಕೊಳ್ಳುತ್ತವೆ."),
]
cw, ch, gx, gy = 5.93, 2.35, 0.32, 0.32
x0, y0 = M, 2.15
for i, (t, d) in enumerate(cards):
    cx = x0 + (i % 2) * (cw + gx)
    cy = y0 + (i // 2) * (ch + gy)
    box(s, cx, cy, cw, ch, fill=WHITE, line=BORDER, round_=True, adj=0.05)
    box(s, cx, cy, 0.07, ch, fill=TEAL, round_=False)
    tb(s, cx + 0.35, cy + 0.28, cw - 0.7, 0.5, [{"runs": [P(t, 15.5, True, False, SLATE)]}])
    tb(s, cx + 0.35, cy + 0.85, cw - 0.7, ch - 1.1, [
        {"runs": [P(d, 11.5, False, False, SLATE_6)], "line": 1.25}
    ])

# ============================================================================
# S3 — Solution
# ============================================================================
s = slide_bg(BG)
header(s, "ಪರಿಹಾರ", "ಪೂರ್ಣ ಶೈಕ್ಷಣಿಕ ಜೀವನ ಚಕ್ರಕ್ಕೆ ಒಂದೇ ವೇದಿಕೆ")
tb(s, M, 2.1, 6.6, 1.1, [
    {"runs": [P("ವೃದ್ಧಿ (ವೃದ್ಧಿ — ಬೆಳವಣಿಗೆ) ", 13, True, False, SLATE),
              P("ಪ್ರತಿ ಶೈಕ್ಷಣಿಕ ಪ್ರಕ್ರಿಯೆಯನ್ನು ಒಂದು ಪಾತ್ರ-ಆಧಾರಿತ ವೇದಿಕೆಗೆ ತಂದಿದೆ: ಪ್ರವೇಶ ದಾಖಲೆಗಳಿಂದ ಪಟ್ಟಿಗಳವರೆಗೆ, ಹಾಜರಿಯಿಂದ ವಿಶ್ಲೇಷಣೆಗಳವರೆಗೆ — ಭಾರೀ ಕೆಲಸ AI ಮಾಡುತ್ತದೆ.", 13, False, False, SLATE_6)],
     "line": 1.35}
])
pillars = [
    ("ಒಂದೇ ವೇದಿಕೆ", "ಮೂರು ಪಾತ್ರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗಳು — ವಿದ್ಯಾರ್ಥಿ, ಅಧ್ಯಾಪಕ, HOD, ಮೆಂಟರ್, ಪ್ರಿನ್ಸಿಪಲ್, ಕಾಲೇಜು ಆಡಳಿತ ಮತ್ತು ಸೂಪರ್ ಆಡ್ಮಿನ್ — ಒಂದು ಸುರಕ್ಷಿತ ಲಾಗಿನ್‌ನಲ್ಲಿ."),
    ("ಕೇಂದ್ರದಲ್ಲಿ AI", "AI-ಉತ್ಪಾದಿತ ಪ್ರಶ್ನೆಗಳು ಮತ್ತು ಪತ್ರಿಕೆಗಳು, ವಿಶ್ವಾಸದ ಅಂಕಗಳೊಂದಿಗೆ AI ಸ್ವಯಂ-ಅಂಕೀಕರಣ, ಮತ್ತು ಪ್ರತಿ ಉತ್ಪನ್ನಕ್ಕೆ ಮಾನವ-ಸಮೀಕ್ಷಕ."),
    ("ಭಾರತಕ್ಕಾಗಿ ನಿರ್ಮಿತ", "ಸ್ಥಳೀಯ Unicode ಲಿಪಿಗಳ AI ಉತ್ಪಾದನೆಯೊಂದಿಗೆ ಆರು ಭಾಷೆಗಳು, UUCMS ವಿದ್ಯಾರ್ಥಿ ಸಂವಹನ, ಮತ್ತು ವಿಶ್ವವಿದ್ಯಾಲಯ ಉತ್ತೀರ್ಣತಾ ನಿಯಮಗಳು — ಕೋಡ್ ಆದವು ಅಲ್ಲ, ಸಿದ್ಧ-ಸರ್ಟಿಫಿಕೇಶನ್."),
]
py = 3.35
for t, d in pillars:
    box(s, M, py, 6.6, 1.12, fill=WHITE, line=BORDER, round_=True, adj=0.09)
    box(s, M + 0.28, py + 0.31, 0.5, 0.5, fill=TEAL_50, line=TEAL, lw=1, round_=True, adj=0.22)
    tb(s, M + 0.28, py + 0.31, 0.5, 0.5, [{"runs": [P("✓", 15, True, False, TEAL_D)], "align": PP_ALIGN.CENTER}], anchor=MSO_ANCHOR.MIDDLE)
    tb(s, M + 1.0, py + 0.14, 5.4, 0.4, [{"runs": [P(t, 13.5, True, False, SLATE)]}])
    tb(s, M + 1.0, py + 0.52, 5.4, 0.55, [{"runs": [P(d, 10.5, False, False, SLATE_6)], "line": 1.15}])
    py += 1.28
card = box(s, 8.0, 2.05, 4.7, 5.0, fill=WHITE, round_=True, adj=0.045)
hero_w, hero_h = 4.2, 3.24
s.shapes.add_picture(HERO, Inches(8.0 + (4.7 - hero_w) / 2), Inches(2.05 + (5.0 - hero_h) / 2 - 0.4), width=Inches(hero_w))
s.shapes.add_picture(LOGO_REVERSE, Inches(8.0 + (4.7 - 2.7) / 2), Inches(2.05 + 5.0 - 1.0), width=Inches(2.7))

# ============================================================================
# S4 — Product overview
# ============================================================================
s = slide_bg(BG)
header(s, "ವೇದಿಕೆ", "ಪ್ರತಿ ಶೈಕ್ಷಣಿಕ ಮಾಡ್ಯೂಲ್, ಒಂದೇ ಲಾಗಿನ್")
mods = [
    "ಹಾಜರಿ",
    "ಆನ್‌ಲೈನ್ ಪರೀಕ್ಷೆಗಳು",
    "ಪ್ರಶ್ನೆ ಬ್ಯಾಂಕ್",
    "AI ಪುಸ್ತಕಿ ತಯಾರಕ",
    "ಶಿಕ್ಷಣಕ್ರಮ ಮತ್ತು ಪಠ್ಯವಿಷಯ",
    "ಶುಲ್ಕ ನಿರ್ವಹಣೆ",
    "ಸಮಯ ಕೋಷ್ಟಕ",
    "ಫಲಿತಾಂಶಗಳು ಮತ್ತು ಪಟ್ಟಿಗಳು",
    "ವಿಶ್ಲೇಷಣೆ ಮತ್ತು 360 ನೋಟ",
    "ಗ್ರಂಥಾಲಯ",
    "ಹವಾಲೆಗಳು ಮತ್ತು ಸಾಮಗ್ರಿಗಳು",
    "ಭೇಟಿಗಳು ಮತ್ತು ಕಾರ್ಯಕ್ರಮಗಳು",
]
cw, chh, gx, gy = 3.64, 0.92, 0.18, 0.22
x0, y0 = M, 2.2
for i, name in enumerate(mods):
    cx = x0 + (i % 3) * (cw + gx)
    cy = y0 + (i // 3) * (chh + gy)
    chip(s, cx, cy, cw, chh, name, s=12)
note_y, note_h = 6.62, 0.72
box(s, M, note_y, SW - 2 * M, note_h, fill=TEAL_50, line=TEAL_100, round_=True, adj=0.18)
tb(s, M + 0.35, note_y, SW - 2 * M - 0.7, note_h, [
    {"runs": [P("ಎಲ್ಲವೂ ಒಟ್ಟಿಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ — ಹಾಜರಿಯಿಂದ ವಿಶ್ಲೇಷಣೆಗೆ ದಾಖಲೆ ಹರಿಯುತ್ತದೆ, ಮರು-ಆಮದಿಲ್ಲ.", 11.5, True, False, TEAL_D)]}
], anchor=MSO_ANCHOR.MIDDLE)

# ============================================================================
# S5 — AI engine
# ============================================================================
s = slide_bg(BG)
header(s, "AI ಯಂತ್ರ", "AI ರೂಪಿಸುತ್ತದೆ. ಅಧ್ಯಾಪಕರು ನಿರ್ಧರಿಸುತ್ತಾರೆ.")
cards = [
    ("AI ಪ್ರಶ್ನೆ ಉತ್ಪಾದನೆ", "ಸಾಮರ್ಥ್ಯ ಮತ್ತು ವಿಷಯ ಪ್ರಶ್ನೆಗಳು — ಆಯ್ಕೆಗಳು, ಅಂಕಗಳು ಮತ್ತು ಹಂತ-ಹಂತವಾದ ವಿವರಣೆಗಳೊಂದಿಗೆ; ನೀವು ಆಯ್ಕೆ ಮಾಡಿದ ಭಾಷೆಯಲ್ಲಿ, ನೇರವಾಗಿ ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಬ್ಯಾಂಕ್‌ಗೆ ಸೇರ್ಪಡೆ."),
    ("AI ಪತ್ರಿಕಾ ತಯಾರಕ", "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಬ್ಯಾಂಕ್‌ನಿಂದ ಪತ್ರಿಕೆಗಳು — ಮುದ್ರಣ, ಆನ್‌ಲೈನ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ರೀತಿಗಳು; ಟೆಂಪ್ಲೇಟ್‌ಗಳು ಮತ್ತು ವಿಷಯ ನಿಯಮಗಳೊಂದಿಗೆ. PDF-ಕ್ಕೆ ರಫ್."),
    ("AI ಸ್ವಯಂ-ಅಂಕೀಕರಣ", "ವಿವರಣಾತ್ಮಕ ಉತ್ತರಗಳಿಗೆ ಮೌಲ್ಯಮಾಪನ-ಆಧಾರಿತ ಅಂಕ, ಪ್ರತಿ-ಪ್ರಶ್ನೆಯ ವಿಶ್ವಾಸದ ಅಂಕಗಳೊಂದಿಗೆ. ಅಧ್ಯಾಪಕರು ಪ್ರತಿ ಸ್ಕ್ರಿಪ್ಟ್ ಮರುಪಠನದ ಬದಲು ಒಂದೇ ಹಾದಿ ಸಮೀಕ್ಷೆ."),
]
cw, chh = 3.92, 3.0
x0, y0 = M, 2.2
for i, (t, d) in enumerate(cards):
    cx = x0 + i * (cw + 0.24)
    box(s, cx, y0, cw, chh, fill=WHITE, line=BORDER, round_=True, adj=0.05)
    box(s, cx + 0.3, y0 + 0.3, 0.56, 0.56, fill=TEAL_50, line=TEAL, lw=1, round_=True, adj=0.22)
    tb(s, cx + 0.3, y0 + 0.3, 0.56, 0.56, [{"runs": [P("✦", 15, True, False, TEAL_D)], "align": PP_ALIGN.CENTER}], anchor=MSO_ANCHOR.MIDDLE)
    tb(s, cx + 0.3, y0 + 1.05, cw - 0.6, 0.6, [{"runs": [P(t, 14.5, True, False, SLATE)]}])
    tb(s, cx + 0.3, y0 + 1.55, cw - 0.6, 1.3, [{"runs": [P(d, 11, False, False, SLATE_6)], "line": 1.25}])
box(s, M, 5.55, SW - 2 * M, 0.95, fill=DARK_BG, round_=True, adj=0.16)
tb(s, M + 0.4, 5.55, SW - 2 * M - 0.8, 0.95, [
    {"runs": [P("ಬಹು-ಪ್ರೊವೈಡರ್ ವಿನ್ಯಾಸ:  ", 11.5, True, False, TEAL_3),
              P("Gemini · OpenAI · DeepSeek — runtime-ದಲ್ಲಿ ಆಯ್ಕೆ, ಸ್ವಯಂ fallback ಮತ್ತು tier-ವಾರು ಬಳಕೆ ಪರಿಶೀಲನೆ.", 11.5, False, False, SLATE_3)]}
], anchor=MSO_ANCHOR.MIDDLE)

# ============================================================================
# S6 — India first
# ============================================================================
s = slide_bg(BG)
header(s, "ಭಾರತ-ಮೊದಲು", "ಭಾರತೀಯ ಪಾಠಶಾಲೆಗಳ ಮತ್ತು ರಾಜ್ಯ ವ್ಯವಸ್ಥೆಗಳಿಗೆ ವಿನ್ಯಾಸ")
box(s, M, 2.2, 6.0, 4.5, fill=WHITE, line=BORDER, round_=True, adj=0.04)
tb(s, M + 0.4, 2.55, 5.2, 0.45, [{"runs": [P("ಆರು ಭಾಷೆಗಳು, ಒಂದು ಅಂಚಿನಿಂದ ಇನ್ನೊಂದಕ್ಕೆ", 16, True, False, SLATE)]}])
tb(s, M + 0.4, 3.05, 5.2, 0.6, [
    {"runs": [P("ಸ್ಥಳೀಯ Unicode ಲಿಪಿಗಳ interface ಮತ್ತು AI-ಉತ್ಪಾದಿತ ಪ್ರಶ್ನೆಗಳು.", 11, False, False, SLATE_6)], "line": 1.2}
])
langs = ["ಕನ್ನಡ", "ತಮಿಳು", "ತೆಲುಗು", "ಮಲಯಾಳಂ", "ಹಿಂದಿ", "ಇಂಗ್ಲಿಷ್"]
lw_ = 2.44
for i, L in enumerate(langs):
    lx = M + 0.4 + (i % 2) * (lw_ + 0.22)
    ly = 3.85 + (i // 2) * 0.78
    chip(s, lx, ly, lw_, 0.62, L, fill=TEAL_50, line=TEAL_100, text_c=TEAL_D, dot=TEAL, s=12)
tb(s, M + 0.4, 6.15, 5.3, 0.4, [
    {"runs": [P("ವಿದ್ಯಾರ್ಥಿಯು ತನ್ನ ಭಾಷೆಯಲ್ಲಿ ಪತ್ರಿಕೆ ಓದುತ್ತಾನೆ; ಅಧ್ಯಾಪಕರು ತಮ್ಮದರಲ್ಲಿ ಅಂಕ ಕೊಡುತ್ತಾರೆ.", 10, False, True, SLATE_5)]}
])
box(s, 7.0, 2.2, SW - 7.0 - M, 4.5, fill=WHITE, line=BORDER, round_=True, adj=0.04)
tb(s, 7.4, 2.55, 5.0, 0.45, [{"runs": [P("ಕರ್ನಾಟಕಕ್ಕೆ pre-ready", 16, True, False, SLATE)]}])
state_items = [
    ("UUCMS ಸಂವಹನ", "ರಾಜ್ಯ ಪೋರ್ಟಲ್‌ನಿಂದ Candidate ID ಮತ್ತು USN import; email ಮೂಲಕ ಸ್ವಯಂ-ಸಂಪರ್ಕ; sync-ಸ್ಥಿತಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್."),
    ("ವಿಶ್ವವಿದ್ಯಾಲಯ ಉತ್ತೀರ್ಣತಾ ನಿಯಮಗಳು", "BCU undergraduate ಉತ್ತೀರ್ಣತಾ ತರ್ಕ (UE + ಸರಾಸರಿ) ಫಲಿತಾಂಶ import-ನಲ್ಲಿ ಅನ್ವಯ."),
    ("NEP ಮತ್ತು ಯೋಜನೆ ಸಿದ್ಧ", "ಆಧುನಿಕ ಯೋಜನೆಗಳಿಗೆ ಶಿಕ್ಷಣಕ್ರಮ ಉಪಯೋಗ, ಪಠ್ಯವಿಷಯ ಪಾರ್ಸಿಂಗ್ ಮತ್ತು ಕ್ರೆಡಿಟ್ ರಚನೆ mapping."),
    ("ಪರೀಕ್ಷಾ ಕೆಲಸ ಹರಿವು", "hall-ticket-ಸಿದ್ಧ ಪರೀಕ್ಷಾ ದಾಖಲೆಗಳು, ಸ್ಪಂದ-ನಿರ್ಣಯದ ಸಮಯ ಕೋಷ್ಟಕಗಳು, ಫಲಿತಾಂಶ ಪ್ರಕಟಣೆ ಪೈಪ್‌ಲೈನ್."),
]
yy = 3.15
for t, d in state_items:
    box(s, 7.4, yy, 0.14, 0.14, fill=TEAL, round_=True, adj=0.5)
    tb(s, 7.68, yy - 0.055, 4.75, 0.4, [{"runs": [P(t, 12, True, False, SLATE)]}])
    tb(s, 7.68, yy + 0.27, 4.75, 0.6, [{"runs": [P(d, 10, False, False, SLATE_6)], "line": 1.15}])
    yy += 0.88

# ============================================================================
# S7 — Roles
# ============================================================================
s = slide_bg(BG)
header(s, "ಪ್ರತಿ ಪಾತ್ರ", "ಕ್ಯಾಂಪಸ್‌ನಲ್ಲಿ ಪ್ರತಿಯೊಬ್ಬರಿಗೂ ಒಂದು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್")
roles = [
    ("ವಿದ್ಯಾರ್ಥಿ", "auto-save ಪರೀಕ್ಷೆಗಳು, ಶುಲ್ಕ ಪೋರ್ಟಲ್, ಸಮಯ ಕೋಷ್ಟಕ, ಗ್ರಂಥಾಲಯ, ಫಲಿತಾಂಶಗಳು ಮತ್ತು ಪ್ರಗತಿ ವಿಶ್ಲೇಷಣೆ."),
    ("ಅಧ್ಯಾಪಕ", "ಹಾಜರಿ ಸೂಚನೆ, ಪ್ರಶ್ನೆ ಬ್ಯಾಂಕ್, AI ಪತ್ರಿಕೆಗಳು, ಅಂಕೀಕರಣ ಪಾಲು, ಭೇಟಿಗಳು."),
    ("HOD ಮತ್ತು ಮೆಂಟರ್", "ವಿಭಾಗ ವಿಶ್ಲೇಷಣೆ, ಮೆಂಟರಿಂಗ್ ಯೋಜನೆಗಳು ಮತ್ತು ಅಧ್ಯಾಪಕ ಕೆಲಸ ಭಾರ."),
    ("ಪ್ರಿನ್ಸಿಪಲ್", "ಕಾಲೇಜ್-ಮಟ್ಟದ ಸ್ಪಂದ, ಅನುಮೋದನೆಗಳು ಮತ್ತು ಸಾಧನೆ ಸಂಕೇತಗಳು."),
    ("ಕಾಲೇಜು ಆಡಳಿತ", "ದಾಖಲೆಗಳು, ಶಿಕ್ಷಣಕ್ರಮ, ಶುಲ್ಕ, UUCMS mapping ಮತ್ತು ಫಲಿತಾಂಶ ಪ್ರಕಟಣೆ."),
    ("ಸೂಪರ್ ಆಡ್ಮಿನ್", "ಬಹು-ಕಾಲೇಜು ಮತ್ತು ವಿಶ್ವವಿದ್ಯಾಲಯ ಕಾರ್ಯಗಳು, ಸಬ್‌ಸ್ಕ್ರಿಪ್ಷನ್ ಬಿಲ್ಲಿಂಗ್, ಆರೋಗ್ಯ ಮ್ಯಾನಿಟರ್."),
]
cw, chh, gx, gy = 3.92, 1.85, 0.24, 0.3
x0, y0 = M, 2.2
for i, (t, d) in enumerate(roles):
    cx = x0 + (i % 3) * (cw + gx)
    cy = y0 + (i // 3) * (chh + gy)
    box(s, cx, cy, cw, chh, fill=WHITE, line=BORDER, round_=True, adj=0.07)
    tb(s, cx + 0.3, cy + 0.22, cw - 0.6, 0.4, [{"runs": [P(t, 13.5, True, False, TEAL_D)]}])
    box(s, cx + 0.3, cy + 0.62, 0.42, 0.045, fill=TEAL)
    tb(s, cx + 0.3, cy + 0.8, cw - 0.6, 0.95, [{"runs": [P(d, 10.5, False, False, SLATE_6)], "line": 1.2}])
tb(s, M, 6.75, SW - 2 * M, 0.4, [
    {"runs": [P("ಮಹತ್ವವಾದ SaaS — ಒಂದು ಕಾಲೇಜಿಗೋ, ಸಂಪೂರ್ಣ ವಿಶ್ವವಿದ್ಯಾಲಯಕ್ಕೋ ಒಂದೇ ವೇದಿಕೆ.", 11.5, True, False, SLATE_5)]}
])

# ============================================================================
# S8 — Business model
# ============================================================================
s = slide_bg(BG)
header(s, "ವ್ಯಾಪಾರ ಮಾದರಿ", "ಕಾಲೇಜ್-ವಾರು ಸಬ್‌ಸ್ಕ್ರಿಪ್ಷನ್. ವಿದ್ಯಾರ್ಥಿ-ವಾರು ಲೈಸೆನ್ಸ್ ಇಲ್ಲ.")
cards = [
    ("ಕಾಲೇಜ್ ಸಬ್‌ಸ್ಕ್ರಿಪ್ಷನ್", "ಪೂರ್ಣ ವೇದಿಕೆಯನ್ನು ಹೊಂದಿರುವ ಕಾಲೇಜ್‌ವಾರು flat ಮಾಸಿಕ ಯೋಜನೆ — ಪ್ರತಿ ಮಾಡ್ಯೂಲ್, ಪ್ರತಿ ಪಾತ್ರ. ಹಣಕಾಸು ಸುಲಭ, ನವೀಕರಣ ಸುಲಭ."),
    ("ಪ್ರಮಾಣದಲ್ಲಿ Superadmin", "ವಿಶ್ವವಿದ್ಯಾಲಯಗಳು ಮತ್ತು operators ಒಂದೇ ಕನ್‌ಸೋಲ್‌ನಿಂದ ಅನೇಕ ಕಾಲೇಜುಗಳನ್ನು ನಿರ್ವಹಿಸುತ್ತವೆ: onboarding, ಸಬ್‌ಸ್ಕ್ರಿಪ್ಷನ್ ಬಿಲ್ಲಿಂಗ್, ಕಾಲೇಜ್-ತಲೆ-ಸಮಯ ಹೋಲಿಕೆ ಮತ್ತು ವ್ಯವಸ್ಥೆ ಆರೋಗ್ಯ ಮ್ಯಾನಿಟರ್."),
    ("AI ಒಳಗೊಂಡಿದೆ", "fallback-ಗಳೊಂದಿಗೆ ಬಹು-ಪ್ರೊವೈಡರ್ ಉತ್ಪಾದನೆ AI ವೆಚ್ಚವನ್ನು ಊಹಿಸಬಹುದಾಗಿಸುತ್ತದೆ; ಬಳಕೆಯು ಸಬ್‌ಸ್ಕ್ರಿಪ್ಷನ್ tier ಪ್ರಕಾರ ಪರಿಶೀಲಿಸಲ್ಪಡುತ್ತದೆ."),
]
cw, chh = 3.92, 3.2
x0, y0 = M, 2.2
for i, (t, d) in enumerate(cards):
    cx = x0 + i * (cw + 0.24)
    box(s, cx, y0, cw, chh, fill=WHITE, line=BORDER, round_=True, adj=0.05)
    box(s, cx, y0, cw, 0.12, fill=TEAL)
    tb(s, cx + 0.3, y0 + 0.45, cw - 0.6, 0.5, [{"runs": [P(t, 15, True, False, SLATE)]}])
    tb(s, cx + 0.3, y0 + 1.05, cw - 0.6, 1.9, [{"runs": [P(d, 11.5, False, False, SLATE_6)], "line": 1.3}])
box(s, M, 5.75, SW - 2 * M, 0.85, fill=TEAL_50, line=TEAL_100, round_=True, adj=0.18)
tb(s, M + 0.4, 5.75, SW - 2 * M - 0.8, 0.85, [
    {"runs": [P("ಪರೀಕ್ಷಾ ಕಾಲೇಜುಗಳಿಗೆ launch ಬೆಲೆ — ಅಂತಿಮ ಯೋಜನೆಗಳು ಚರ್ಚೆಯಲ್ಲಿ ಹೊಂದಿಕೊಳ್ಳುತ್ತವೆ.", 11.5, True, False, TEAL_D)]}
], anchor=MSO_ANCHOR.MIDDLE)

# ============================================================================
# S9 — Why Vriddhi
# ============================================================================
s = slide_bg(BG)
header(s, "ವೃದ್ಧಿ ಏಕೆ", "ಶೈಕ್ಷಣಿಕ ಮುಖ್ಯಾಂಶ, ಸರಿಯಾಗಿ ಮಾಡಲಾಗಿದೆ")
box(s, M, 2.2, 5.9, 4.4, fill=WHITE, line=BORDER, round_=True, adj=0.04)
tb(s, M + 0.4, 2.5, 5.1, 0.45, [{"runs": [P("ಪರಂಪರಾ ಕಾಲೇಜು ERP ಗಳು", 15, True, False, SLATE_5)]}])
legacy = [
    "“20+ ಮಾಡ್ಯೂಲ್‌ಗಳು” — ಆದರೆ AI ಪರೀಕ್ಷಾ ಕೆಲಸ ಹರಿವಿಲ್ಲ",
    "ಇಂಗ್ಲಿಷ್-ಮಾತ್ರ interface",
    "ಭಾರೀ, ತಿಂಗಳ-ದೀರ್ಘ onboarding",
    "ಪ್ರಮಾಣದಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿ-ವಾರು ಬೆಲೆ",
    "ರಾಜ್ಯ ಪೋರ್ಟಲ್‌ಗಳನ್ನು ಕೈಯಿಂದ ನಿರ್ವಹಿಸಲಾಗಿದೆ",
]
yy = 3.15
for it in legacy:
    tb(s, M + 0.4, yy, 5.2, 0.6, [
        {"runs": [P("—  ", 11, True, False, SLATE_4), P(it, 11.5, False, False, SLATE_5)], "line": 1.15}
    ])
    yy += 0.62
box(s, 6.8, 2.2, SW - 6.8 - M, 4.4, fill=DARK_BG, round_=True, adj=0.04)
tb(s, 7.2, 2.5, 5.0, 0.45, [{"runs": [P("ವೃದ್ಧಿ", 15, True, False, TEAL_3)]}])
ours = [
    "ಮಾನವ-ಸಮೀಕ್ಷಕ-ಲೂಪ್‌ನೊಂದಿಗೆ AI ಪರೀಕ್ಷಾ ಪತ್ರಿಕೆಗಳು",
    "ಆರು ಭಾರತೀಯ ಭಾಷೆಗಳು, AI ಉತ್ಪಾದನೆ ಒಳಗೊಂಡಿದೆ",
    "UUCMS ಮತ್ತು BCU ನಿಯಮ ಅನುಕೂಲ pre-ನಿರ್ಮಿತ",
    "ಕಾಲೇಜ್-ವಾರು flat ಬೆಲೆ",
    "ಆಧುನಿಕ React + Firebase stack, ಸುರಕ್ಷತೆ ಪರೀಕ್ಷಿತ",
]
yy = 3.15
for it in ours:
    tb(s, 7.2, yy, 5.2, 0.6, [
        {"runs": [P("✓  ", 11, True, False, TEAL_4), P(it, 11.5, False, False, SLATE_3)], "line": 1.15}
    ])
    yy += 0.62

# ============================================================================
# S10 — Today / next
# ============================================================================
s = slide_bg(BG)
header(s, "ದೃಢೀಕರಣ ಮತ್ತು road map", "ಸಾಗಿಸಲಾಗಿದೆ, ಮತ್ತು ಸಾಗಿಸಲಾಗುತ್ತಿದೆ")
box(s, M, 2.2, 5.9, 4.5, fill=WHITE, line=BORDER, round_=True, adj=0.04)
tb(s, M + 0.4, 2.5, 5.1, 0.45, [{"runs": [P("ಇಂದು ಸ್ಥಳದಲ್ಲಿ", 15, True, False, TEAL_D)]}])
live = [
    "ಮೂರು ಪಾತ್ರ ಆಧಾರಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗಳು, ಒಂದು ಅಂಚಿನಿಂದ ಇನ್ನೊಂದಕ್ಕೆ",
    "ಆನ್‌ಲೈನ್ ಪರೀಕ್ಷಾ ಯಂತ್ರ — autosave, expiry recovery, ಫಲಿತಾಂಶಗಳು",
    "AI ಪ್ರಶ್ನೆ ಮತ್ತು ಪತ್ರಿಕೆ ಉತ್ಪಾದನೆ, ಮೂರು providers",
    "UUCMS import, mapping ಮತ್ತು sync ಸ್ಥಿತಿ",
    "BCU ಉತ್ತೀರ್ಣತಾ ನಿಯಮಗಳು ಮತ್ತು SGPA ಒಳಗೊಂಡ ಫಲಿತಾಂಶ import",
    "ಶುಲ್ಕ ದಾಖಲೆಗಳು ಮತ್ತು ವಿದ್ಯಾರ್ಥಿ ಶುಲ್ಕ ಪೋರ್ಟಲ್",
    "ವಿಶ್ಲೇಷಣೆ 360 ನೋಟ + ಬಹು-ಕಾಲೇಜು ಹೋಲಿಕೆ",
    "ಸಬ್‌ಸ್ಕ್ರಿಪ್ಷನ್ ಬಿಲ್ಲಿಂಗ್ ಮತ್ತು ವ್ಯವಸ್ಥೆ ಆರೋಗ್ಯ ಮ್ಯಾನಿಟರ್",
]
yy = 3.1
for it in live:
    tb(s, M + 0.4, yy, 5.2, 0.5, [
        {"runs": [P("✓  ", 10.5, True, False, TEAL), P(it, 11, False, False, SLATE_6)], "line": 1.1}
    ])
    yy += 0.47
box(s, 6.8, 2.2, SW - 6.8 - M, 4.5, fill=WHITE, line=BORDER, round_=True, adj=0.04)
tb(s, 7.2, 2.5, 5.0, 0.45, [{"runs": [P("ಮುಂದೆ", 15, True, False, SLATE)]}])
nxt = [
    "payment gateway ಮೂಲಕ ಶುಲ್ಕ ಸಂಗ್ರಹ",
    "hall tickets ಮತ್ತು marksheets",
    "NAAC / NBA / OBE ಸಾಧನೆ ವರದಿ",
    "PWA / mobile ಅನುಭವ",
    "ವಾಲ್ಪಾಪರ ಪೋರ್ಟಲ್",
    "SMS / WhatsApp ಘೋಷಣೆಗಳು",
]
yy = 3.1
for it in nxt:
    tb(s, 7.2, yy, 5.2, 0.5, [
        {"runs": [P("→  ", 10.5, True, False, TEAL_4), P(it, 11, False, False, SLATE_6)], "line": 1.1}
    ])
    yy += 0.47

# ============================================================================
# S11 — The ask
# ============================================================================
s = slide_bg(BG)
header(s, "ಬೇಡಿಕೆ", "ನಿಮ್ಮ ಸಹಾಯ ಬೇಕಾದ ಕಡೆ")
cards = [
    ("ಪರೀಕ್ಷಾ ಕಾಲೇಜುಗಳು", "ನೇರ pilot-ಗೆ ಮೂರು-ಐದು ಕರ್ನಾಟಕ ಕಾಲೇಜುಗಳು — UUCMS onboarding, ಪ್ರಶ್ನೆ-ಬ್ಯಾಂಕ್ seed, ಮತ್ತು ವೃದ್ಧಿಯಲ್ಲಿ ಸಂಪೂರ್ಣ ಪರೀಕ್ಷಾ ಚಕ್ರ."),
    ("ವಿಶ್ವವಿದ್ಯಾಲಯ ಚಾಂಪಿಯನ್‌ಗಳು", "UUCMS alignment ಮತ್ತು ಉತ್ತೀರ್ಣತಾ-ನಿಯಮ ಒದಗುಗಳನ್ನು ದೃಢೀಕರಿಸಲು, ಮತ್ತು ಪ್ರತಿ ವಿಶ್ವವಿದ್ಯಾಲಯಕ್ಕೆ ಪ್ರಮಾಣಿತ ಪ್ರಶ್ನೆ ಬ್ಯಾಂಕ್‌ಗಳನ್ನು ಸಹ-seed ಮಾಡಲು ಸಹಕಾರ."),
    ("seed partners", "ಮುಂದಿನ ಅಂತರಗಳನ್ನು ಮುಚ್ಚಲು ಹೂಡಿಕೆ: ಶುಲ್ಕ ಸಂಗ್ರಹ, hall tickets ಮತ್ತು marksheets, ಮತ್ತು OBE ವರದಿ."),
]
cw, chh = 3.92, 3.1
x0, y0 = M, 2.2
for i, (t, d) in enumerate(cards):
    cx = x0 + i * (cw + 0.24)
    box(s, cx, y0, cw, chh, fill=WHITE, line=BORDER, round_=True, adj=0.05)
    box(s, cx + 0.3, y0 + 0.32, 0.52, 0.52, fill=TEAL, round_=True, adj=0.25)
    tb(s, cx + 0.3, y0 + 0.32, 0.52, 0.52, [{"runs": [P(str(i + 1), 15, True, False, WHITE)], "align": PP_ALIGN.CENTER}], anchor=MSO_ANCHOR.MIDDLE)
    tb(s, cx + 0.3, y0 + 1.05, cw - 0.6, 0.5, [{"runs": [P(t, 14.5, True, False, SLATE)]}])
    tb(s, cx + 0.3, y0 + 1.55, cw - 0.6, 1.4, [{"runs": [P(d, 11, False, False, SLATE_6)], "line": 1.25}])
box(s, M, 5.7, SW - 2 * M, 0.9, fill=DARK_BG, round_=True, adj=0.17)
tb(s, M + 0.4, 5.7, SW - 2 * M - 0.8, 0.9, [
    {"runs": [P("ಬದಲಿ:  ", 11.5, True, False, TEAL_3),
              P("ಆದ್ಯ ಪ್ರವೇಶ, launch ಬೆಲೆ, ಮತ್ತು ನಿಮ್ಮ ಕಾಲೇಜೊಂದಿಗೆ ದಿನ ಒಂದಿನಿಂದ ಅದರಿಸುವ ಉತ್ಪನ್ನ.", 11.5, False, False, SLATE_3)]}
], anchor=MSO_ANCHOR.MIDDLE)

# ============================================================================
# S12 — Contact
# ============================================================================
s = slide_bg(DARK_BG)
box(s, 0, SH - 0.09, SW, 0.09, fill=TEAL)
s.shapes.add_picture(LOGO_REVERSE, Inches(M), Inches(0.75), width=Inches(2.6))
tb(s, M, 2.3, 7.3, 1.2, [{"runs": [P("ಒಟ್ಟಾಗಿ ಬೆಳೆಯೋಣ.", 40, True, False, WHITE)]}])
box(s, M + 0.06, 3.62, 0.62, 0.06, fill=TEAL)
tb(s, M, 3.95, 7.0, 1.4, [
    {"runs": [P("ಭಾರತದ ಕಾಲೇಜುಗಳ ಶೈಕ್ಷಣಿಕ ಆಪರೇಟಿಂಗ್ ಸಿಸ್ಟಮ್.", 14, True, False, TEAL_3)], "space_after": 10, "line": 1.3},
    {"runs": [P("hello@vriddhi.in   ·   www.vriddhi.in", 12, False, False, SLATE_3)], "space_after": 6},
    {"runs": [P("ಕರ್ನಾಟಕದ ಕಾಲೇಜುಗಳಿಗೆ pilot onboarding 2026 ರಲ್ಲಿ ಪ್ರಾರಂಭ.", 10.5, False, True, SLATE_4)]},
])
card = box(s, 8.55, 1.6, 4.15, 4.9, fill=WHITE, round_=True, adj=0.045)
hero_w, hero_h = 3.75, 2.89
s.shapes.add_picture(HERO, Inches(8.55 + (4.15 - hero_w) / 2), Inches(1.6 + (4.9 - hero_h) / 2 - 0.35), width=Inches(hero_w))
tb(s, 8.55, 5.85, 4.15, 0.4, [
    {"runs": [P("ಕರ್ನಾಟಕದಲ್ಲಿ ತಯಾರಾಗಿದೆ · ಭಾರತಕ್ಕಾಗಿ ನಿರ್ಮಿತ", 10, False, True, SLATE_5)], "align": PP_ALIGN.CENTER}
])

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Vriddhi_Pitch_Deck_KN.pptx")
prs.save(OUT)
print("saved", OUT)
