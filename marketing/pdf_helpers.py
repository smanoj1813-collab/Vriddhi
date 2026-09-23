#!/usr/bin/env python3
"""Shared fpdf2 helpers for Vriddhi print collateral (booklet + brochure)."""
import os
from fpdf import FPDF
from fpdf.enums import RenderStyle

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # repo root
BRAND = os.path.join(ROOT, "brand")
HERO = os.path.join(BRAND, "hero", "vriddhi-mark-hero-light.png")
LOGO_LIGHT = os.path.join(BRAND, "logo", "png", "vriddhi-logo-horizontal-transparent@1600.png")
LOGO_REVERSE = os.path.join(BRAND, "logo", "png", "vriddhi-logo-horizontal-reverse@1600.png")
FONTS = os.path.join(BRAND, "tools", "fonts")

TEAL = (20, 184, 166)
TEAL_D = (15, 118, 110)
TEAL_3 = (94, 234, 212)
TEAL_4 = (45, 212, 191)
TEAL_50 = (240, 253, 250)
TEAL_100 = (204, 251, 241)
SLATE = (15, 23, 42)
SLATE_2 = (30, 41, 59)
SLATE_5 = (100, 116, 139)
SLATE_4 = (148, 163, 184)
SLATE_3 = (203, 213, 225)
BORDER = (226, 232, 240)
BG = (248, 250, 252)
WHITE = (255, 255, 255)
DARK_BG = (11, 18, 32)


def register_fonts(pdf):
    pdf.add_font("Inter", "", os.path.join(FONTS, "Inter-Regular.ttf"))
    pdf.add_font("Inter", "B", os.path.join(FONTS, "Inter-Bold.ttf"))
    pdf.add_font("InterM", "", os.path.join(FONTS, "Inter-Medium.ttf"))
    pdf.add_font("InterSB", "", os.path.join(FONTS, "Inter-SemiBold.ttf"))
    return pdf


class Doc(FPDF):
    def __init__(self, orientation="P", unit="mm", format="A4"):
        super().__init__(orientation, unit, format)
        register_fonts(self)
        self.set_auto_page_break(auto=False)

    # ---- drawing ----------------------------------------------------------
    def rrect(self, x, y, w, h, r, fill=None, border=None, bw=0.3):
        if fill is not None and border is not None:
            style = RenderStyle.DF
        elif fill is not None:
            style = RenderStyle.F
        else:
            style = RenderStyle.D
        if fill is not None:
            self.set_fill_color(*fill)
        if border is not None:
            self.set_draw_color(*border)
            self.set_line_width(bw)
        self._draw_rounded_rect(x, y, w, h, style, True, r)

    def dot(self, x, y, d=1.6, color=TEAL):
        self.set_fill_color(*color)
        self.ellipse(x, y, d, d, style="F")

    def hline(self, x, y, w, color=TEAL, h=0.7):
        self.set_fill_color(*color)
        self.rect(x, y, w, h, style="F")

    # ---- text -------------------------------------------------------------
    def set_font2(self, family, bold=False, size=10):
        if family == "Inter" and bold:
            self.set_font("Inter", "B", size)
        elif family == "Inter":
            self.set_font("Inter", "", size)
        else:
            self.set_font(family, "", size)

    def para(self, x, y, w, t, size=10, color=SLATE_5, font="Inter", line_h=None,
             bold=False, align="L"):
        self.set_font2(font, bold, size)
        self.set_text_color(*color)
        self.set_xy(x, y)
        self.multi_cell(w, line_h or size * 0.52, t, align=align)
        return self.get_y()

    def kicker(self, x, y, t, color=TEAL_D, size=8.5):
        self.set_font("InterSB", "", size)
        self.set_text_color(*color)
        self.set_xy(x, y)
        self.cell(0, size * 0.5, t.upper(), new_x="LMARGIN", new_y="NEXT")
        return self.get_y()

    def footer(self, page_label=True, dark=False):
        n = self.page_no()
        c1 = SLATE_4 if not dark else (100, 116, 139)
        self.set_font("Inter", "", 7.5)
        self.set_text_color(*c1)
        self.set_y(self.h - 9)
        self.set_x(18)
        self.cell(140, 5, "Vriddhi — the academic operating system for Indian colleges", align="L")
        self.set_x(192)
        if page_label:
            self.cell(0, 5, str(n), align="R")

    def page_header(self, kicker_t, title, x=18, y=16, w=174, dark=False):
        kc = TEAL_3 if dark else TEAL_D
        tc = WHITE if dark else SLATE
        self.kicker(x, y, kicker_t, color=kc, size=9)
        self.hline(x, y + 4.2, 8, color=TEAL, h=0.8)
        self.set_font("InterSB", "", 19)
        self.set_text_color(*tc)
        self.set_xy(x, y + 8)
        self.multi_cell(w, 7.2, title, align="L")
        return self.get_y() + 4
