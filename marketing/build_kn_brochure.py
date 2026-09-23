#!/usr/bin/env python3
"""Builds Vriddhi_Brochure_KN.pdf — A4 landscape tri-fold brochure in Kannada.

Print on both sides of one A4 sheet, fold into thirds:
  Page 1 (front side):  [ front cover | inside left  | inside right ]
  Page 2 (back side):   [ inside flap | back cover   | inside centre]
"""
import io
import os
from pdf_helpers import (
    Doc, HERO, LOGO_REVERSE,
    TEAL, TEAL_D, TEAL_3, TEAL_4, TEAL_50, TEAL_100, SLATE, SLATE_2,
    SLATE_5, SLATE_4, SLATE_3, BORDER, BG, WHITE, DARK_BG,
)
from kn_text import TextCanvas, hbf_pdf, KN_REG, KN_SB, KN_BOLD

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Vriddhi_Brochure_KN.pdf")
PW, PH = 297, 210
P1, P2, P3 = 0, 99, 198
PM = 9
MPU = 72 / 25.4


class Page:
    def __init__(self, pdf):
        self.pdf = pdf
        self.canvas = TextCanvas(PW * MPU, PH * MPU)

    def t(self, x, y, w, text, size, color, font=KN_REG, align="L", line_h=None):
        lh = line_h * MPU if line_h else None
        h = self.canvas.text(x * MPU, y * MPU, w * MPU, text, size, hbf_pdf(color),
                             ttf=font, align=align, line_h=lh)
        return h / MPU

    def nlines(self, w, text, size, font=KN_REG):
        return len(self.canvas.wrap(font, size, text, w * MPU))

    def finish(self):
        buf = io.BytesIO()
        self.canvas.render().save(buf, "PNG")
        buf.seek(0)
        self.pdf.image(buf, x=0, y=0, w=PW)


def panel_bg(pdf, x, color):
    pdf.set_fill_color(*color)
    pdf.rect(x, 0, 99, PH, style="F")


pdf = Doc("L", "mm", "A4")
pdf.footer = lambda: None  # disable auto English footer; KN footer drawn per page

# ===========================================================================
# PAGE 1 — front side
# ===========================================================================
pdf.add_page()
panel_bg(pdf, P1, DARK_BG)
panel_bg(pdf, P2, WHITE)
panel_bg(pdf, P3, TEAL_50)
p = Page(pdf)

# ---- front cover ----------------------------------------------------------
pdf.set_fill_color(*TEAL)
pdf.rect(P1, 0, 99, 1.2, style="F")
pdf.rrect(P1 + 10, 16, 79, 60, 3.5, fill=WHITE)
hero_w = 66
hero_h = hero_w / (899 / 693)
pdf.image(HERO, x=P1 + 10 + (79 - hero_w) / 2, y=16 + (60 - hero_h) / 2 - 2.5, w=hero_w)
pdf.image(LOGO_REVERSE, x=P1 + 10, y=84, w=62)
pdf.set_fill_color(*TEAL)
pdf.rect(P1 + 10, 110, 12, 0.7, style="F")
h = p.t(P1 + 10, 116, 80, "ಭಾರತದ ಕಾಲೇಜುಗಳ ಶೈಕ್ಷಣಿಕ ಆಪರೇಟಿಂಗ್ ಸಿಸ್ಟಮ್.", 9.5, SLATE_3, KN_SB, line_h=4.8)
p.t(P1 + 10, 116 + h + 4, 80,
    "AI ಪುಸ್ತಕಿಗಳು · ಆನ್‌ಲೈನ್ ಪರೀಕ್ಷೆಗಳು · ನಿರ್ವಹಣೆ — ಭಾರತದ ಮಾತು ಭಾಷೆಗಳಲ್ಲೇ.",
    7.5, SLATE_4, line_h=4.2)
p.t(P1 + 10, 192, 80, "www.vriddhi.in", 7.5, SLATE_5)

# ---- inside left: what is vriddhi ----------------------------------------
x = P2 + PM
p.t(x, 14, 81, "ವೃದ್ಧಿ ಎಂದರೇನು", 8.5, TEAL_D, KN_SB)
pdf.set_fill_color(*TEAL)
pdf.rect(x, 18.2, 8, 0.7, style="F")
p.t(x, 22, 81, "ಕಾಲೇಜುಗಳ ಶೈಕ್ಷಣಿಕ OS", 13, SLATE, KN_SB)
p.t(x, 33, 81,
    "ಪೂರ್ಣ ಶೈಕ್ಷಣಿಕ ಜೀವನ ಚಕ್ರಕ್ಕೆ ಒಂದೇ ಪಾತ್ರ-ಆಧಾರಿತ ವೇದಿಕೆ — ಹಾಜರಿ ಫಲಿತಾಂಶವರೆಗೆ, "
    "ಭಾರೀ ಏಕೆ AI ನಡೆಸುತ್ತದೆ.",
    8.2, SLATE_5, line_h=4.2)
mods = [
    "ಹಾಜರಿ",
    "ಆನ್‌ಲೈನ್ ಪರೀಕ್ಷೆಗಳು",
    "ಪ್ರಶ್ನೆ ಬ್ಯಾಂಕ್",
    "AI ಪುಸ್ತಕಿ ತಯಾರಕ",
    "ಶಿಕ್ಷಣಕ್ರಮ ಮತ್ತು ಪಠ್ಯವಿಷಯ",
    "ಶುಲ್ಕ ನಿರ್ವಹಣೆ",
    "ಸಮಯ ಕೋಷ್ಟಕ",
    "ಫಲಿತಾಂಶಗಳು ಮತ್ತು ಪಟ್ಟಿ",
    "ವಿಶ್ಲೇಷಣೆ ಮತ್ತು 360 ನೋಟ",
    "ಗ್ರಂಥಾಲಯ",
    "ಹವಾಲೆಗಳು ಮತ್ತು ಸಾಮಗ್ರಿಗಳು",
    "ಭೇಟಿಗಳು ಮತ್ತು ಕಾರ್ಯಕ್ರಮಗಳು",
]
p.t(x, 49, 81, "ಮಾಡ್ಯೂಲ್‌ಗಳು", 8.5, TEAL_D, KN_SB)
col_w = 39.5
for i, m in enumerate(mods):
    cx = x + (i % 2) * col_w
    cy = 57 + (i // 2) * 12.5
    pdf.dot(cx + 1, cy + 2.2, d=1.6)
    p.t(cx + 4.5, cy, col_w - 5, m, 8, SLATE_2, KN_SB)
pdf.rrect(x, 136, 81, 16, 3, fill=DARK_BG)
p.t(x + 5, 139.5, 71, "ಡೇಟಾ ಹಾಜರಿಯಿಂದ ವಿಶ್ಲೇಷಣೆಗೆ ಹರಿಯುತ್ತದೆ — ಮರು-ಪ್ರವೇಶವಿಲ್ಲ.", 8.5, TEAL_3, KN_SB, line_h=4.4)
p.t(x, 168, 81, "ವಿದ್ಯಾರ್ಥಿ · ಅಧ್ಯಾಪಕ · HOD · ಪ್ರಿನ್ಸಿಪಲ್ · ಆಡಳಿತ · ಸೂಪರ್ ಆಡ್ಮಿನ್", 6.8, SLATE_4)

# ---- inside right: AI engine & languages ----------------------------------
x = P3 + PM
p.t(x, 14, 81, "AI ಯಂತ್ರ", 8.5, TEAL_D, KN_SB)
pdf.set_fill_color(*TEAL)
pdf.rect(x, 18.2, 8, 0.7, style="F")
p.t(x, 22, 81, "AI ಕರೆಯುತ್ತದೆ. ಅಧ್ಯಾಪಕರು ನಿರ್ಧರಿಸುತ್ತಾರೆ.", 12, SLATE, KN_SB, line_h=6)
blocks = [
    ("ಪ್ರಶ್ನೆಗಳು", "ಆಯ್ಕೆಗಳು, ಅಂಕಗಳು ಮತ್ತು ಹಂತ-ಹಂತವಾದ ವಿವರಣೆಗಳು — ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ."),
    ("ಪುಸ್ತಕಿಗಳು", "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಬ್ಯಾಂಕ್‌ನಿಂದ; ಮುದ್ರಣ, ಆನ್‌ಲೈನ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ರೀತಿಗಳು; PDF ಉಳಿಕೆ."),
    ("ಪರಿಶೀಲನೆ", "ವಿಶ್ವಾಸದೊಂದಿಗೆ ಮೌಲ್ಯಮಾಪನ ಅಂಕಗಳು — ಮಾನವ ನಿದರ್ಶನ, ನಂತರ ಪ್ರಕಟ."),
]
by = 40
for name, desc in blocks:
    pdf.rrect(x, by, 81, 18, 2.5, fill=WHITE, border=TEAL_100)
    p.t(x + 5, by + 3, 71, name, 9, TEAL_D, KN_SB)
    p.t(x + 5, by + 8.5, 71, desc, 7.7, SLATE_5, line_h=4)
    by += 21
pdf.rrect(x, by + 1, 81, 11, 3, fill=DARK_BG)
p.t(x + 5, by + 4.6, 71, "Gemini · OpenAI · DeepSeek — ಬದಲಿಗಳು ಒಳಗೊಂಡಿವೆ", 8, TEAL_3, KN_SB, align="C")
ly = by + 20
p.t(x, ly, 81, "ಆರು ಭಾಷೆಗಳು", 8.5, TEAL_D, KN_SB)
langs = ["ಕನ್ನಡ", "ತಮಿಳು", "ತೆಲುಗು", "ಮಲಯಾಳಂ", "ಹಿಂದಿ", "ಇಂಗ್ಲಿಷ್"]
lw = 39.5
for i, L in enumerate(langs):
    lx = x + (i % 2) * lw
    lyy = ly + 7 + (i // 2) * 11.5
    pdf.rrect(lx, lyy, lw - 4, 9, 4.5, fill=WHITE, border=TEAL_100)
    pdf.dot(lx + 4.5, lyy + 3.6, d=1.4, color=TEAL_D)
    p.t(lx + 8.5, lyy + 2.9, lw - 14, L, 8.2, TEAL_D, KN_SB)

p.finish()

# ===========================================================================
# PAGE 2 — back side
# ===========================================================================
pdf.add_page()
panel_bg(pdf, P1, WHITE)
panel_bg(pdf, P2, DARK_BG)
panel_bg(pdf, P3, WHITE)
p = Page(pdf)

# ---- inside flap: why vriddhi ---------------------------------------------
x = P1 + PM
p.t(x, 14, 81, "ವೃದ್ಧಿ ಏಕೆ", 8.5, TEAL_D, KN_SB)
pdf.set_fill_color(*TEAL)
pdf.rect(x, 18.2, 8, 0.7, style="F")
p.t(x, 22, 81, "ಕಾಲೇಜುಗಳು ಬದಲಿಸುವುದು ಏಕೆ", 13, SLATE, KN_SB)
whys = [
    ("AI ಪರೀಕ್ಷಾ ಚಕ್ರ ಉಳಿಸುತ್ತದೆ", "ನಿಮಿಷಗಳಲ್ಲಿ ಪುಸ್ತಕಿ; ವಿಶ್ವಾಸದ ಅಂಕಗಳೊಂದಿಗೆ ಪುಸ್ತಕ ಅಂಕೀಕರಣ; ಪ್ರತಿ ಹಂತವನ್ನು ಅಧ್ಯಾಪಕರು ದೃಢೀಕರಿಸುತ್ತಾರೆ."),
    ("ಮಾತೃಭಾಷೆ ಮಾತನಾಡುವ ಸಾಫ್ಟ್‌ವೇರ್", "ಕನ್ನಡ, ತಮಿಳು, ತೆಲುಗು, ಮಲಯಾಳಂ, ಹಿಂದಿ ಮತ್ತು ಇಂಗ್ಲಿಷ್ — UI ಮತ್ತು AI ಉತ್ಪಾದನೆಯಲ್ಲಿ."),
    ("ರಾಜ್ಯ ವ್ಯವಸ್ಥೆಗಳು, ಆಳದಿಂದ", "UUCMS ವಿದ್ಯಾರ್ಥಿ ಆಮದು ಮತ್ತು ಸಿಂಕ್; BCU ಉತ್ತೀರ್ಣತಾ ನಿಯಮಗಳು; NEP-ಸಿದ್ಧ ಶಿಕ್ಷಣಕ್ರಮ ಮ್ಯಾಪ್."),
    ("ಸ್ವಾಧೀನತೆ ಸರಳ", "ಕಾಲೇಜ್-ವಾರು ಸಮತಟ್ಟಾದ ಸಬ್‌ಸ್ಕ್ರಿಪ್ಷನ್. ವಿದ್ಯಾರ್ಥಿ-ವಾರು ಲೈಸೆನ್ಸ್ ಇಲ್ಲ, ಭಾರೀ ಆನ್‌ಬೋರ್ಡಿಂಗ್ ಇಲ್ಲ."),
]
wy = 40
for name, desc in whys:
    pdf.dot(x + 1.2, wy + 2.4, d=1.8)
    p.t(x + 5.5, wy, 75.5, name, 9, SLATE, KN_SB)
    n = p.nlines(75.5, desc, 7.7)
    p.t(x + 5.5, wy + 5.2, 75.5, desc, 7.7, SLATE_5, line_h=4)
    wy += 5.2 + n * 4 + 13
pdf.rrect(x, min(wy + 2, 168), 81, 16, 3, fill=TEAL_50, border=TEAL_100)
p.t(x + 5, min(wy + 2, 168) + 4.5, 71, "ಕರ್ನಾಟಕದ ಕಾಲೇಜುಗಳಿಗೆ ಪ್ರಯೋಗಾತ್ಮಕ ಆನ್‌ಬೋರ್ಡಿಂಗ್ 2026 ರಲ್ಲಿ ಪ್ರಾರಂಭ.", 8, TEAL_D, KN_SB, line_h=4.2)

# ---- back cover -------------------------------------------------------------
x = P2 + PM
pdf.image(LOGO_REVERSE, x=x + 1, y=14, w=38)
p.t(x, 78, 81, "ಒಟ್ಟಾಗಿ ಬೆಳೆಯೋಣ.", 16, WHITE, KN_SB)
pdf.set_fill_color(*TEAL)
pdf.rect(x, 92, 12, 0.7, style="F")
p.t(x, 99, 81, "ಭಾರತದ ಕಾಲೇಜುಗಳ ಶೈಕ್ಷಣಿಕ ಆಪರೇಟಿಂಗ್ ಸಿಸ್ಟಮ್.", 9, TEAL_3, KN_SB)
p.t(x, 112, 81, "hello@vriddhi.in   ·   www.vriddhi.in", 9, SLATE_3)
p.t(x, 186, 81, "ಕರ್ನಾಟಕದಲ್ಲಿ ತಯಾರಾಗಿದೆ · ಭಾರತಕ್ಕಾಗಿ ನಿರ್ಮಿತ", 7.5, SLATE_5)

# ---- inside centre: built for India + get started --------------------------
x = P3 + PM
p.t(x, 14, 81, "ಭಾರತಕ್ಕಾಗಿ ನಿರ್ಮಿತ", 8.5, TEAL_D, KN_SB)
pdf.set_fill_color(*TEAL)
pdf.rect(x, 18.2, 8, 0.7, style="F")
p.t(x, 22, 81, "ಕರ್ನಾಟಕ-ಸಿದ್ಧ, ಭಾರತ-ವಿಸ್ತಾರ್ಯ", 12.5, SLATE, KN_SB, line_h=6)
rows = [
    "UUCMS ಆಮದು, ಸ್ವಯಂ-ಸಂಪರ್ಕ ಮತ್ತು ಸಿಂಕ್ ಸ್ಥಿತಿ",
    "ಫಲಿತಾಂಶ ಆಮದಿನಲ್ಲಿ BCU ಉತ್ತೀರ್ಣತಾ ನಿಯಮಗಳು",
    "NEP ಮತ್ತು ಕ್ರೆಡಿಟ್-ಸ್ಕೀಮ್ ಶಿಕ್ಷಣಕ್ರಮ ಮ್ಯಾಪ್",
    "ಕರಡಿನಿಂದ ಪ್ರಕಟವರಿಗಿನ ಫಲಿತಾಂಶ ಪಟ್ಟಿ ಪೈಪ್‌ಲೈನ್",
]
ry = 40
for r in rows:
    pdf.dot(x + 1, ry + 2.2, d=1.6)
    p.t(x + 5, ry, 76, r, 8.2, SLATE_2, KN_SB)
    ry += 11
p.t(x, ry + 6, 81, "ಪ್ರಾರಂಭಿಸಿ", 8.5, TEAL_D, KN_SB)
steps = [
    "ವಾಕ‌ತ್‌ರೂ ಬುಕ್ ಮಾಡಿ",
    "ನಿಮ್ಮ ಕಾಲೇಜನ್ನು ಆನ್‌ಬೋರ್ಡ್ ಮಾಡಿ — ಗುಂಪು ಆಮದು ಒಳಗೊಂಡಿವೆ",
    "ಲೈವ್ ಆಗಿ: ಮೊದಲ AI ಪುಸ್ತಕಿ ಒಂದು ವಾರದ ಒಳಗೆ",
]
sty = ry + 15
for i, st in enumerate(steps, 1):
    pdf.set_fill_color(*TEAL)
    pdf.ellipse(x, sty, 7, 7, style="F")
    p.t(x, sty + 1.7, 7, str(i), 8.5, WHITE, KN_SB, align="C")
    p.t(x + 10.5, sty + 1.2, 70, st, 8.2, SLATE_2, KN_SB)
    sty += 12
pdf.rrect(x, sty + 3, 81, 15, 3, fill=DARK_BG)
p.t(x + 5, sty + 7.2, 71, "hello@vriddhi.in", 9, TEAL_3, KN_SB, align="C")

p.finish()
pdf.output(OUT)
print("saved", OUT, "pages:", pdf.page_no())
