#!/usr/bin/env python3
"""Builds Vriddhi_Investor_Deck.pdf — the investor deck as a vector PDF.

Reads the same `investor_deck_content.SLIDES` list that builds the PPTX and the HTML
deck, so all three stay in sync. Landscape A4 (297 × 167.06 mm, a true 16:9 page),
real selectable text, every figure a vector so it prints crisply and stays clickable
for links and email.

Fonts — Inter carries the design. It has no ₹, →, ●, ≤ or ✓ glyph, so those runs are
rendered with DejaVu Sans, which does; a font-run splitter wraps `cell()`/`multi_cell()`
to switch fonts only for the characters Inter lacks. Kannada (वृद्धि) is drawn as
vector outlines with Noto Sans Kannada + matplotlib, the same technique as
`build_kn_booklet.py`, because fpdf2 cannot shape Indic scripts.

Regenerate:
    python3 -m venv /home/user/.venv
    /home/user/.venv/bin/pip install fpdf2 fonttools matplotlib
    /home/user/.venv/bin/python marketing/build_investor_deck_pdf.py
"""
import io
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fpdf import FPDF

from investor_deck_content import SLIDES

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BRAND = os.path.join(ROOT, "brand")
FONT_DIR = os.path.join(BRAND, "tools", "fonts")
HERO = os.path.join(BRAND, "hero", "vriddhi-mark-hero-light.png")
LOGO_LIGHT = os.path.join(BRAND, "logo", "png", "vriddhi-logo-horizontal-transparent@1600.png")
LOGO_REVERSE = os.path.join(BRAND, "logo", "png", "vriddhi-logo-horizontal-reverse@1600.png")
DEJAVU = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
DEJAVU_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
DEVA_VF = os.path.join(HERE, "fonts", "NotoSansDevanagari-VF.ttf")
KN_VF = os.path.join(HERE, "fonts", "NotoSansKannada-VF.ttf")

# ── brand tokens (RGB) ───────────────────────────────────────────────────────
TEAL = (20, 184, 166)
TEAL_D = (15, 118, 110)
TEAL_3 = (94, 234, 212)
TEAL_4 = (45, 212, 191)
TEAL_50 = (240, 253, 250)
SLATE = (15, 23, 42)
SLATE_2 = (30, 41, 59)
SLATE_6 = (71, 85, 105)
SLATE_5 = (100, 116, 139)
SLATE_4 = (148, 163, 184)
SLATE_3 = (203, 213, 225)
BORDER = (226, 232, 240)
BG = (248, 250, 252)
WHITE = (255, 255, 255)
DARK_BG = (11, 18, 32)

SW, SH = 297.0, 297.0 * 9 / 16     # 167.0625 mm
M = 14.0                            # outer margin
BODY_W = SW - 2 * M
CONTENT_TOP = 40.0                  # content never starts higher than this
CONTENT_BOTTOM = SH - 15.0          # and never runs into the footer
MAX_DROP = 30.0                     # furthest we will push a block down

# ── characters Inter cannot draw; DejaVu can ────────────────────────────────
FALLBACK = "₹→●≤≈✓"
# Complex scripts are drawn as shaped vector outlines, never passed to a text font
DEVA = (0x0900, 0x097F)
KN = (0x0C80, 0x0CFF)


class ComplexShaper:
    """Shapes Devanagari/Kannada with HarfBuzz and returns flattened outlines.

    fpdf2 cannot shape Indic scripts (no GSUB/GPOS, no pre-base matra reordering), so
    the glyph run is shaped with uharfbuzz, outlined with fontTools and drawn as filled
    polygons. Variable fonts are instanced in memory at the requested weight so the
    advances HarfBuzz returns match the outlines that get drawn.
    """

    def __init__(self, path, weight=400):
        from fontTools.ttLib import TTFont
        from fontTools.varLib.instancer import instantiateVariableFont
        import uharfbuzz as hb

        font = TTFont(path)
        if "fvar" in font:
            axes = {a.axisTag: a.defaultValue for a in font["fvar"].axes}
            if "wght" in axes:
                axes["wght"] = weight
            instantiateVariableFont(font, axes, inplace=True)
        buf = io.BytesIO()
        font.save(buf)
        data = buf.getvalue()
        self.tt = TTFont(io.BytesIO(data))
        self.glyph_set = self.tt.getGlyphSet()
        self.glyph_order = self.tt.getGlyphOrder()
        self.upem = self.tt["head"].unitsPerEm
        face = hb.Face(data)
        self.hb_font = hb.Font(face)

    def _outline(self, glyph_name, scale, dx, dy, steps=6):
        """One glyph → list of closed contours in PDF points (y down)."""
        from fontTools.pens.basePen import BasePen

        outer = self

        class Pen(BasePen):
            def __init__(self):
                super().__init__(outer.glyph_set)
                self.contours, self.cur = [], []

            def _pt(self, p):
                return (dx + p[0] * scale, dy - p[1] * scale)

            def _moveTo(self, p):
                if len(self.cur) > 2:
                    self.contours.append(self.cur)
                self.cur = [self._pt(p)]

            def _lineTo(self, p):
                self.cur.append(self._pt(p))

            def _curveToOne(self, c1, c2, p):
                x0, y0 = self.cur[-1]
                x1, y1 = self._pt(c1)
                x2, y2 = self._pt(c2)
                x3, y3 = self._pt(p)
                for i in range(1, steps + 1):
                    t = i / steps
                    u = 1 - t
                    self.cur.append((
                        u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
                        u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
                    ))

            def _closePath(self):
                if len(self.cur) > 2:
                    self.contours.append(self.cur)
                self.cur = []

            def _endPath(self):
                self._closePath()

        pen = Pen()
        self.glyph_set[glyph_name].draw(pen)
        pen._closePath()
        return pen.contours

    def shape(self, text, size_pt):
        """→ (contours, advance_mm). Contours are absolute-free; caller translates."""
        import uharfbuzz as hb

        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hb_font, buf)
        # mm per font unit: 1 pt = 25.4/72 mm, and outlines/advances are in font units
        scale = (size_pt * 25.4 / 72.0) / self.upem
        x = 0.0
        contours = []
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            name = self.glyph_order[info.codepoint]
            contours.extend(self._outline(name, scale, x + pos.x_offset * scale,
                                          -pos.y_offset * scale))
            x += pos.x_advance * scale
        return contours, x

    def height(self, text, size_pt):
        contours, _ = self.shape(text, size_pt)
        if not contours:
            return 0.0
        ys = [p[1] for c in contours for p in c]
        return max(ys) - min(ys)


_SHAPERS = {}


def shaper(path, weight=400):
    key = (path, weight)
    if key not in _SHAPERS:
        try:
            _SHAPERS[key] = ComplexShaper(path, weight)
        except Exception:
            _SHAPERS[key] = None
    return _SHAPERS[key]


def script_of(ch):
    cp = ord(ch)
    if DEVA[0] <= cp <= DEVA[1]:
        return "deva"
    if KN[0] <= cp <= KN[1]:
        return "kn"
    return None


def complex_advance(text, size_pt, bold):
    """Advance width of a complex-script run, in mm."""
    kind = script_of(text[0])
    path = DEVA_VF if kind == "deva" else KN_VF
    sh = shaper(path, 600 if bold else 400)
    if sh is None:
        return 0.0
    _, adv = sh.shape(text, size_pt)
    return adv


def draw_complex(pdf, text, size_pt, bold, color, x, y_baseline):
    kind = script_of(text[0])
    path = DEVA_VF if kind == "deva" else KN_VF
    sh = shaper(path, 600 if bold else 400)
    if sh is None:
        return 0.0
    contours, adv = sh.shape(text, size_pt)
    pdf.set_fill_color(*color)
    for contour in contours:
        pts = [(x + px, y_baseline + py) for px, py in contour]
        if len(pts) < 3:
            continue
        pdf.set_xy(*pts[0])
        pdf.polygon(pts, style="F")
    return adv


class Deck(FPDF):
    """fpdf2 with the helpers this deck needs, plus the font-fallback splitter."""

    def __init__(self):
        super().__init__(orientation="L", unit="mm", format=(SH, SW))
        self.set_auto_page_break(False)
        self.set_margins(0, 0, 0)
        self.add_font("Inter", "", os.path.join(FONT_DIR, "Inter-Regular.ttf"))
        self.add_font("Inter", "B", os.path.join(FONT_DIR, "Inter-Bold.ttf"))
        self.add_font("InterM", "", os.path.join(FONT_DIR, "Inter-Medium.ttf"))
        self.add_font("InterSB", "", os.path.join(FONT_DIR, "Inter-SemiBold.ttf"))
        self.add_font("DJ", "", DEJAVU)
        self.add_font("DJB", "B", DEJAVU_B)
        self.set_font("Inter", "", 12)
        self._marks = []     # (bottom_mm, what) for the overflow check
        self._extents = []   # (top_mm, bottom_mm) for vertical centring
        self.warnings = []

    # ---- primitives -------------------------------------------------------
    def rect_fill(self, x, y, w, h, color, radius=0.0):
        self.set_fill_color(*color)
        self.set_draw_color(*color)
        if radius > 0:
            self.rect(x, y, w, h, style="F", round_corners=True, corner_radius=radius)
        else:
            self.rect(x, y, w, h, style="F")

    def panel(self, x, y, w, h, fill=WHITE, border=BORDER, radius=2.4):
        self._extents.append((y, y + h))
        self.set_fill_color(*fill)
        self.set_draw_color(*border)
        self.set_line_width(0.22)
        self.rect(x, y, w, h, style="DF", round_corners=True, corner_radius=radius)

    def _font_for(self, bold, size):
        if bold and size >= 20:
            self.set_font("Inter", "B", size)
        elif bold:
            self.set_font("Inter", "B", size)
        else:
            self.set_font("Inter", "", size)

    def _fragments(self, text, bold, size):
        """Split text into runs of (kind, text): 'complex' | 'dejavu' | 'inter'."""
        runs, cur, kind = [], "", "inter"
        for ch in text:
            k = "complex" if script_of(ch) else ("dejavu" if ch in FALLBACK else "inter")
            if k != kind and cur:
                runs.append((kind, cur))
                cur = ""
            kind = k
            cur += ch
        if cur:
            runs.append((kind, cur))
        return runs

    def _set_font_kind(self, kind, bold, size):
        if kind == "dejavu":
            self.set_font("DJB" if bold else "DJ", "B" if bold else "", size)
        else:
            self._font_for(bold, size)

    def _set_text_color(self, color):
        self.set_text_color(*color)

    def frag_width(self, text, size, bold=False):
        total = 0.0
        for kind, chunk in self._fragments(text, bold, size):
            if kind == "complex":
                total += complex_advance(chunk, size, bold)
            else:
                self._set_font_kind(kind, bold, size)
                total += self.get_string_width(chunk)
        return total

    # ---- text ------------------------------------------------------------
    def text_at(self, x, y, t, size=10, bold=False, color=SLATE, align=None, w=None):
        """One line; optional right/centre alignment when w is given."""
        if align and w:
            tx = x + w - self.frag_width(t, size, bold) if align == "R" else \
                x + (w - self.frag_width(t, size, bold)) / 2
        else:
            tx = x
        self._set_text_color(color)
        self._marks.append((y + size * 0.44, t[:44]))
        self._extents.append((y - size * 0.78, y + size * 0.44))
        cx = tx
        for kind, chunk in self._fragments(t, bold, size):
            if kind == "complex":
                cx += draw_complex(self, chunk, size, bold, color, cx, y)
                continue
            self._set_font_kind(kind, bold, size)
            self.set_xy(cx, y)
            self.cell(self.get_string_width(chunk) + 0.02, size * 0.36, chunk)
            cx += self.get_string_width(chunk)
        return cx

    def wrap(self, t, size, w, bold=False):
        """Greedy word wrap in mm-aware widths. Returns a list of lines."""
        words, lines, cur = t.split(), [], ""
        for word in words:
            cand = (cur + " " + word).strip()
            if self.frag_width(cand, size, bold) <= w or not cur:
                cur = cand
            else:
                lines.append(cur)
                cur = word
        if cur:
            lines.append(cur)
        return lines

    def block(self, x, y, w, t, size=9, color=SLATE_6, bold=False, line_h=None,
              gap=1.6, max_lines=None):
        lh = line_h or size * 0.42
        lines = self.wrap(t, size, w, bold)
        if max_lines and len(lines) > max_lines:
            lines = lines[:max_lines]
            lines[-1] = lines[-1].rstrip() + "…"
        for i, ln in enumerate(lines):
            self.text_at(x, y + i * lh, ln, size, bold, color)
        bottom = y + len(lines) * lh + gap
        self._marks.append((bottom, t[:44]))
        return bottom

    # ---- composite blocks -------------------------------------------------
    def kicker(self, x, y, t, color=TEAL_D, size=9):
        self.rect_fill(x, y, 9, 1.1, TEAL)
        self.text_at(x, y + 2.6, t.upper(), size, True, color)

    def h1(self, x, y, t, size=19, color=SLATE, w=None, line_h=None):
        w = w or BODY_W
        lh = line_h or size * 0.45
        lines = self.wrap(t, size, w, True)
        for i, ln in enumerate(lines):
            self.text_at(x, y + i * lh, ln, size, True, color)
        return y + len(lines) * lh

    def bullets(self, x, y, w, items, size=9, color=SLATE_6, gap=2.0, dot=TEAL, indent=4.6):
        for it in items:
            self.set_fill_color(*dot)
            self.ellipse(x + 0.6, y + size * 0.13, 1.5, 1.5, style="F")
            y = self.block(x + indent, y, w - indent, it, size, color, gap=gap)
        return y

    def stat_cards(self, y, stats, h=26.5, gap=3.4):
        n = len(stats)
        w = (BODY_W - gap * (n - 1)) / n
        for i, (value, label) in enumerate(stats):
            x = M + i * (w + gap)
            self.panel(x, y, w, h)
            self.rect_fill(x, y, 1.3, h, TEAL)
            size = 17 if len(value) <= 12 else (14 if len(value) <= 18 else 12)
            lh = size * 0.44
            vlines = self.wrap(value, size, w - 10, True)
            for j, ln in enumerate(vlines):
                self.text_at(x + 5, y + 4.2 + j * lh, ln, size, True, TEAL_D)
            self.block(x + 5, y + 4.2 + len(vlines) * lh + 0.8, w - 10, label, 7.6, SLATE_6,
                       line_h=3.4)
        return y + h

    def card_grid(self, cards, y0, cols, card_h, gap=3.6, title_s=10.5, body_s=8.6,
                  break_after=None):
        rows = (len(cards) + cols - 1) // cols
        w = (BODY_W - gap * (cols - 1)) / cols
        for i, (t, d) in enumerate(cards):
            x = M + (i % cols) * (w + gap)
            y = y0 + (i // cols) * (card_h + gap)
            self.panel(x, y, w, card_h)
            self.rect_fill(x + 4.5, y + 4.2, 6, 1.0, TEAL)
            ty = y + 6.6
            ty = self.block(x + 4.5, ty, w - 9, t, title_s, SLATE, True, line_h=title_s * 0.44, gap=1.4)
            if break_after and t.startswith(break_after):
                ty += 1.2
            end = self.block(x + 4.5, ty, w - 9, d, body_s, SLATE_6, line_h=body_s * 0.45)
            if end > y + card_h - 1.5:
                self.warnings.append(
                    f"card overflow by {end - (y + card_h):.1f}mm :: {t} — {d[:46]}")
        return y0 + rows * card_h + (rows - 1) * gap

    def bullets_height(self, w, items, size=9, gap=2.0, indent=4.6):
        total = 0.0
        for it in items:
            total += len(self.wrap(it, size, w - indent)) * size * 0.42 + gap
        return total

    def pairs_height(self, w, items, term_s=9.0, body_s=8.0, gap=3.4):
        total = 0.0
        for term, detail in items:
            total += len(self.wrap(term, term_s, w, True)) * term_s * 0.45 + 0.6
            total += len(self.wrap(detail, body_s, w)) * body_s * 0.44 + gap
        return total

    def labelled_pairs(self, x, y, w, items, term_s=9.4, body_s=8.6, gap=2.6,
                       term_c=SLATE, body_c=SLATE_6):
        for term, detail in items:
            y = self.block(x, y, w, term, term_s, term_c, True, line_h=term_s * 0.45, gap=0.6)
            y = self.block(x, y, w, detail, body_s, body_c, line_h=body_s * 0.44, gap=gap)
        return y

    def table(self, y, headers, rows, widths_in, row_h=7.4, head_h=8.0):
        # widths travel with the pptx slide (inches of 13.333); scale them to this page
        widths = [w / 13.333 * BODY_W for w in widths_in]
        x0 = M
        # header
        self.rect_fill(x0, y, SW - 2 * M, head_h, SLATE)
        self.rect_fill(x0 + sum(widths[:-1]), y, widths[-1], head_h, DARK_BG)
        cx = x0
        for i, h in enumerate(headers):
            if i == 0:
                self.text_at(cx + 3.4, y + 2.6, h, 8.6, True, WHITE)
            else:
                self.text_at(cx, y + 2.6, h, 8.6, True, WHITE, align="C", w=widths[i])
            cx += widths[i]
        yy = y + head_h
        for r, row in enumerate(rows):
            if r % 2 == 0:
                self.rect_fill(x0, yy, SW - 2 * M, row_h, TEAL_50)
            self.set_draw_color(*BORDER)
            self.set_line_width(0.15)
            self.line(x0, yy + row_h, x0 + sum(widths), yy + row_h)
            cx = x0
            for i, val in enumerate(row):
                last = i == len(headers) - 1
                color = TEAL_D if last else SLATE_6
                bold = last
                if i == 0:
                    self.text_at(cx + 3.4, yy + (row_h - 3.4) / 2, val, 8.0, bold, color)
                else:
                    self.text_at(cx, yy + (row_h - 3.4) / 2, val, 8.0, bold, color,
                                 align="C", w=widths[i])
                cx += widths[i]
            yy += row_h
        return yy

    # ---- chrome -----------------------------------------------------------
    def deck_footer(self, page_no, dark=False):
        c = SLATE_5 if dark else SLATE_4
        self.text_at(M, SH - 8.5, "Vriddhi — the academic operating system for Indian colleges",
                     6.8, False, c)
        self.text_at(M, SH - 8.5, f"{page_no}", 6.8, False, c, align="R", w=BODY_W)

    def content_top(self, header_y, dy=0.0):
        """First content row, pushed below the header and dropped by the centring pass."""
        return max(header_y + 4.0, CONTENT_TOP) + dy

    def slide_header(self, kicker, title, sub=None):
        self.kicker(M, 9.5, kicker)
        y = self.h1(M, 15.0, title, 19)
        if sub:
            y = self.block(M, y + 1.2, BODY_W - 6, sub, 9.2, SLATE_5, line_h=3.9)
        return y


# ═════════════════════════════════════════════════════════════════════════════
# Slide renderers
# ═════════════════════════════════════════════════════════════════════════════

def render_title(pdf, sl, page_no, dy=0.0):
    pdf.rect_fill(0, 0, SW, 1.5, TEAL)
    pdf.text_at(M, 22, sl["kicker"], 9, True, TEAL_3)
    if os.path.exists(LOGO_REVERSE):
        pdf.image(LOGO_REVERSE, x=M, y=31, w=62)
    pdf.rect_fill(M + 0.6, 68, 14, 1.4, TEAL)
    pdf.h1(M, 74, sl["sub"], 17, TEAL_3, w=140, line_h=8.0)
    pdf.block(M, 96, 136,
              "AI question papers · secure online exams · auto-grading · fees · attendance · "
              "results · six Indian languages · UUCMS-ready",
              9.5, SLATE_3, line_h=4.6)
    cx, cy, cw, ch = 196, 22, 86, 118
    pdf.panel(cx, cy, cw, ch, fill=WHITE, border=WHITE, radius=3.0)
    if os.path.exists(HERO):
        pdf.image(HERO, x=cx + 12, y=cy + 20, w=62)
    if os.path.exists(LOGO_LIGHT):
        pdf.image(LOGO_LIGHT, x=cx + 18, y=cy + ch - 28, w=50)
    pdf.block(M, SH - 20, 150, sl["foot"], 7.6, SLATE_4, line_h=3.4)


def render_stats(pdf, sl, page_no, dy=0.0):
    header_y = pdf.slide_header(sl["kicker"], sl["title"], sl.get("sub"))
    pdf._extents = []          # centring measures the content block, not the header
    top = pdf.content_top(header_y, dy)
    bottom = pdf.stat_cards(top, sl["stats"])
    pdf.bullets(M, bottom + 7.0, BODY_W - 4, sl["bullets"], 9, SLATE_6, gap=2.6)


def render_cards(pdf, sl, page_no, dy=0.0):
    header_y = pdf.slide_header(sl["kicker"], sl["title"], sl.get("sub"))
    pdf._extents = []          # centring measures the content block, not the header
    cards = sl["cards"]
    n = len(cards)
    top = pdf.content_top(header_y, dy)

    # three cards: two columns then one full-width card, so no half-empty row
    if n == 3:
        half = (BODY_W - 3.6) / 2
        card_h = 34.0
        pdf.card_grid(cards[:2], top, 2, card_h, title_s=10.5, body_s=8.6)
        wide_h = 20.0
        y = top + card_h + 3.6
        pdf.panel(M, y, BODY_W, wide_h)
        pdf.rect_fill(M + 4.5, y + 4.2, 6, 1.0, TEAL)
        ty = pdf.block(M + 4.5, y + 6.6, BODY_W - 9, cards[2][0], 10.5, SLATE, True,
                       line_h=4.6, gap=1.4)
        end = pdf.block(M + 4.5, ty, BODY_W - 9, cards[2][1], 8.6, SLATE_6, line_h=3.9)
        if sl.get("bullets"):
            pdf.bullets(M, end + 4.0, BODY_W - 4, sl["bullets"], 8.6, SLATE_6, gap=2.0)
        return

    cols = 2 if n <= 4 else 3
    card_h = 34.0 if n <= 4 else 33.0
    end = pdf.card_grid(cards, top, cols, card_h,
                        title_s=10.5 if n <= 4 else 10.0,
                        body_s=8.6 if n <= 4 else 8.2)
    if sl.get("bullets"):
        pdf.bullets(M, end + 5.0, BODY_W - 4, sl["bullets"], 8.6, SLATE_6, gap=2.0)


def render_flow(pdf, sl, page_no, dy=0.0):
    header_y = pdf.slide_header(sl["kicker"], sl["title"], sl.get("sub"))
    pdf._extents = []          # centring measures the content block, not the header
    steps = sl["steps"]
    n = len(steps)
    gap = 2.8
    w = (BODY_W - gap * (n - 1)) / n
    top = pdf.content_top(header_y, dy)
    h = 39.0
    for i, (t, d) in enumerate(steps):
        x = M + i * (w + gap)
        pdf.panel(x, top, w, h)
        pdf.rect_fill(x, top, w, 1.3, TEAL)
        yy = pdf.block(x + 3.6, top + 4.4, w - 7.2, t, 10, TEAL_D, True, line_h=4.4, gap=1.4)
        pdf.block(x + 3.6, yy + 1.0, w - 7.2, d, 7.8, SLATE_6, line_h=3.5)
    pdf.bullets(M, top + h + 6, BODY_W - 4, sl["bullets"], 9, SLATE_6, gap=2.6)


def render_split(pdf, sl, page_no, dy=0.0):
    header_y = pdf.slide_header(sl["kicker"], sl["title"], sl.get("sub"))
    pdf._extents = []          # centring measures the content block, not the header
    lw = 166.0
    rw = BODY_W - lw - 5.0
    rx = M + lw + 5.0
    left_h = 5.0 + pdf.bullets_height(lw, sl["left"], 8.8, 2.6)
    right_h = 6.0 + pdf.pairs_height(rw - 10, sl["right"], 9.0, 8.0, 3.4)
    panel_h = max(left_h, right_h) + 4.0
    top = pdf.content_top(header_y, dy)
    pdf.text_at(M, top, sl["left_title"], 9.6, True, TEAL_D)
    pdf.bullets(M, top + 5.0, lw, sl["left"], 8.8, SLATE_6, gap=2.6)
    pdf.panel(rx, top - 3.4, rw, panel_h)
    pdf.text_at(rx + 5, top, sl["right_title"], 9.6, True, TEAL_D)
    pdf.labelled_pairs(rx + 5, top + 6.0, rw - 10, sl["right"], term_s=9.0, body_s=8.0, gap=3.4)


def render_split2(pdf, sl, page_no, dy=0.0):
    header_y = pdf.slide_header(sl["kicker"], sl["title"], sl.get("sub"))
    pdf._extents = []          # centring measures the content block, not the header
    lw = (BODY_W - 4.0) / 2
    rx = M + lw + 4.0
    left_h = 6.0 + pdf.bullets_height(lw - 10, sl["left"], 8.4, 2.8)
    right_h = 6.0 + pdf.pairs_height(lw - 10, sl["right"], 9.0, 8.0, 3.4)
    panel_h = max(left_h, right_h) + 5.0
    top = pdf.content_top(header_y, dy)
    pdf.panel(M, top - 3.4, lw, panel_h)
    pdf.rect_fill(M, top - 3.4, 1.3, panel_h, TEAL)
    pdf.text_at(M + 5, top, sl["left_title"], 9.6, True, TEAL_D)
    pdf.bullets(M + 5, top + 6.0, lw - 10, sl["left"], 8.4, SLATE_6, gap=2.8)
    pdf.panel(rx, top - 3.4, lw, panel_h, fill=DARK_BG, border=DARK_BG)
    pdf.text_at(rx + 5, top, sl["right_title"], 9.6, True, TEAL_3)
    pdf.labelled_pairs(rx + 5, top + 6.0, lw - 10, sl["right"], term_s=9.0, body_s=8.0,
                       gap=3.4, term_c=TEAL_3, body_c=SLATE_3)


def render_table(pdf, sl, page_no, dy=0.0):
    header_y = pdf.slide_header(sl["kicker"], sl["title"], sl.get("sub"))
    pdf._extents = []          # centring measures the content block, not the header
    pdf.table(pdf.content_top(header_y, dy), sl["headers"], sl["rows"], sl["widths"])


def render_closing(pdf, sl, page_no, dy=0.0):
    pdf.rect_fill(0, 0, SW, 1.5, TEAL)
    pdf.rect_fill(0, SH - 1.5, SW, 1.5, TEAL)
    if os.path.exists(LOGO_REVERSE):
        pdf.image(LOGO_REVERSE, x=M, y=18, w=56)
    pdf.text_at(M, 62, sl["title"], 34, True, WHITE)
    pdf.rect_fill(M + 0.6, 74, 14, 1.4, TEAL)
    pdf.text_at(M, 80, sl["sub"], 13.5, True, TEAL_3)
    pdf.block(M, 92, 150, sl["lines"][0], 9.5, SLATE_3, line_h=4.4, gap=3)
    pdf.block(M, 101, 150, sl["lines"][1], 9.5, SLATE_4, line_h=4.4)
    if os.path.exists(HERO):
        pdf.image(HERO, x=SW - M - 74, y=38, w=74)


RENDERERS = {
    "title": render_title,
    "stats": render_stats,
    "cards": render_cards,
    "flow": render_flow,
    "split": render_split,
    "split2": render_split2,
    "table": render_table,
    "closing": render_closing,
}


def measure(pdf, sl):
    """Render a slide once on a scratch page and return its content extents."""
    pdf._extents = []
    pdf._marks = []
    pdf.add_page()
    pdf.rect_fill(0, 0, SW, SH, WHITE)
    RENDERERS[sl["kind"]](pdf, sl, 0, dy=0.0)
    if not pdf._extents:
        return None
    return min(t for t, _ in pdf._extents), max(b for _, b in pdf._extents)


def centring_dy(sl, extent):
    """How far to drop this slide's content so the block sits in its band."""
    if not extent or sl["kind"] in ("title", "closing"):
        return 0.0
    top, bottom = extent
    band_centre = (CONTENT_TOP + CONTENT_BOTTOM) / 2
    block_centre = (top + bottom) / 2
    dy = band_centre - block_centre
    dy = min(dy, MAX_DROP, CONTENT_BOTTOM - bottom)      # never spill into the footer
    return max(0.0, dy)


def build_pdf(path):
    # pass 1 — measure every slide on a scratch document so nothing is drawn twice
    probe = Deck()
    plan = []
    for sl in SLIDES:
        plan.append(measure(probe, sl))

    pdf = Deck()
    pdf.set_title("Vriddhi — Investor Deck 2026")
    pdf.set_author("Vriddhi")
    pdf.set_subject("The AI-native academic operating system for Indian colleges")
    pdf.set_keywords("Vriddhi, college ERP, AI assessment, eLearning, Karnataka, investors")
    for i, (sl, extent) in enumerate(zip(SLIDES, plan), start=1):
        dark = sl["kind"] in ("title", "closing")
        dy = centring_dy(sl, extent)
        pdf._marks = []
        pdf._extents = []
        pdf.add_page()
        pdf.rect_fill(0, 0, SW, SH, DARK_BG if dark else BG)
        RENDERERS[sl["kind"]](pdf, sl, i, dy=dy)
        bottom, what = max(pdf._marks) if pdf._marks else (0, "")
        if bottom > CONTENT_BOTTOM:
            print(f"  ⚠ slide {i}: text reaches y={bottom:.1f}mm "
                  f"(limit {CONTENT_BOTTOM:.1f}) :: {what}")
        pdf.deck_footer(i, dark=dark)
    pdf.output(path)
    for w in pdf.warnings:
        print("  ⚠ " + w)
    print("saved", path, f"({len(SLIDES)} pages, landscape A4 16:9)")


if __name__ == "__main__":
    build_pdf(os.path.join(HERE, "Vriddhi_Investor_Deck.pdf"))
