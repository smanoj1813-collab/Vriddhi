#!/usr/bin/env python3
"""Shaped Indic text rendering for fpdf2 PDFs.

fpdf2 cannot shape complex scripts (Kannada), so text is shaped with
HarfBuzz (uharfbuzz), each glyph outline is pulled from fontTools and
drawn into a per-page transparent PNG with matplotlib, which fpdf2
then places on the page. All coordinates are PDF points (1/72 inch),
y measured from the top of the page.
"""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.path import Path
from matplotlib.patches import PathPatch
from PIL import Image
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.qu2cuPen import Qu2CuPen
from fontTools.misc.transform import Transform

_IDENTITY = Transform(1, 0, 0, 1, 0, 0)


def _apply_tf(ops, tf):
    out = []
    for op, args in ops:
        if op == "moveTo":
            out.append(("moveTo", (tf.transformPoint(args[0]),)))
        elif op == "lineTo":
            out.append(("lineTo", (tf.transformPoint(args[0]),)))
        elif op in ("qCurveTo", "curveTo"):
            out.append((op, tuple(tf.transformPoint(p) for p in args)))
        else:
            out.append((op, args))
    return out


def _expand_glyph(gset, name, ctf, chain=()):
    """Return (op, args) contour ops for a glyph with composites expanded and
    `ctf` applied. Pure recording — no matplotlib involved."""
    if name in chain:
        return []  # defensive: composite loop
    g = gset[name]
    rp = RecordingPen()
    g.draw(rp)
    out = []
    for op, args in rp.value:
        if op == "addComponent":
            comp, ctf_c = args
            if not isinstance(ctf_c, Transform):
                ctf_c = Transform(*ctf_c)
            out.extend(_expand_glyph(gset, comp, ctf_c, chain + (name,)))
        else:
            out.append((op, args))
    if ctf != _IDENTITY:
        out = _apply_tf(out, ctf)
    return out

FONTDIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
KN_REG = os.path.join(FONTDIR, "NotoSansKannada-Regular.ttf")
KN_SB = os.path.join(FONTDIR, "NotoSansKannada-SemiBold.ttf")
KN_BOLD = os.path.join(FONTDIR, "NotoSansKannada-Bold.ttf")

SCALE = 4  # supersampling factor


def hbf_pdf(color_rgb):
    """fpdf (r,g,b) 0-255 tuple -> matplotlib 0-1 rgb tuple."""
    return tuple(c / 255.0 for c in color_rgb)


class TextCanvas:
    """Collects shaped text for one PDF page; render() returns a PNG."""

    def __init__(self, w_pt, h_pt):
        self.w_pt, self.h_pt = w_pt, h_pt
        self.W, self.H = w_pt * SCALE, h_pt * SCALE
        self.fig, self.ax = plt.subplots(figsize=(w_pt / 72, h_pt / 72), dpi=72 * SCALE)
        self.fig.patch.set_alpha(0.0)  # transparent page; fpdf2 composites the PNG
        self.ax.set_facecolor("none")
        self.ax.set_xlim(0, self.W)
        self.ax.set_ylim(0, self.H)
        self.ax.axis("off")
        self.fig.subplots_adjust(0, 0, 1, 1)
        self._fonts = {}
        self._ops_cache = {}

    # ------------------------------------------------------------------
    def _font(self, ttf, size_pt):
        key = (ttf, round(size_pt, 3))
        if key in self._fonts:
            return self._fonts[key]
        tt = TTFont(ttf)
        upem = tt["head"].unitsPerEm
        blob = open(ttf, "rb").read()
        hf = hb.Font(hb.Face(hb.Blob(blob)))
        hf.scale = (size_pt * SCALE, size_pt * SCALE)
        self._fonts[key] = (tt, upem, hf)
        return self._fonts[key]

    def _line_width(self, ttf, size_pt, text):
        if not text:
            return 0.0
        _, upem, hf = self._font(ttf, size_pt)
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(hf, buf)
        return sum(g.x_advance for g in buf.glyph_positions) / SCALE

    def _space_w(self, ttf, size_pt):
        return self._line_width(ttf, size_pt, " ")

    def wrap(self, ttf, size_pt, text, max_w_pt):
        """Greedy word wrap. Returns list of lines."""
        words = [w for w in text.split(" ") if w]
        if not words:
            return [""]
        widths = [self._line_width(ttf, size_pt, w) for w in words]
        space_w = self._space_w(ttf, size_pt)
        lines, cur, cur_w = [], [], 0.0
        for w, ww in zip(words, widths):
            add = ww if not cur else cur_w + space_w + ww
            if cur and add > max_w_pt:
                lines.append(" ".join(cur))
                cur, cur_w = [w], ww
            else:
                cur.append(w)
                cur_w = add
        if cur:
            lines.append(" ".join(cur))
        return lines

    def _glyph_ops(self, tt, gname):
        """Expanded (composites resolved) + quadratic->cubic contour ops, cached."""
        key = (id(tt), gname)
        if key in self._ops_cache:
            return self._ops_cache[key]
        expanded = _expand_glyph(tt.getGlyphSet(), gname, _IDENTITY)
        final = RecordingPen()
        cp = Qu2CuPen(final, max_err=1)
        for op, args in expanded:
            if op == "moveTo":
                cp.moveTo(args[0])
            elif op == "lineTo":
                cp.lineTo(args[0])
            elif op == "qCurveTo":
                cp.qCurveTo(*args)
            elif op == "curveTo":
                cp.curveTo(*args)
            elif op == "closePath":
                cp.closePath()
        self._ops_cache[key] = final.value
        return final.value

    def _draw_line(self, ttf, size_pt, text, x_pt, y_base_pt, color):
        """Draw one shaped string; baseline at (x_pt, y_base_pt)."""
        tt, upem, hf = self._font(ttf, size_pt)
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(hf, buf)
        k = size_pt * SCALE / upem
        base_y = (self.h_pt - y_base_pt) * SCALE
        pen_x = 0.0
        for gi, gp in zip(buf.glyph_infos, buf.glyph_positions):
            gid = gi.codepoint
            gx = x_pt * SCALE + pen_x + gp.x_offset
            gy = gp.y_offset
            pen_x += gp.x_advance
            if gid == 0:
                continue
            gname = tt.getGlyphName(gid)
            if gname == ".notdef":
                continue
            ops = self._glyph_ops(tt, gname)
            verts, codes = [], []
            for op, args in ops:
                if op == "moveTo":
                    (fx, fy), = args
                    verts.append((gx + fx * k, base_y + fy * k - gy))
                    codes.append(Path.MOVETO)
                elif op == "lineTo":
                    (fx, fy), = args
                    verts.append((gx + fx * k, base_y + fy * k - gy))
                    codes.append(Path.LINETO)
                elif op == "curveTo":
                    for (fx, fy) in args:
                        verts.append((gx + fx * k, base_y + fy * k - gy))
                        codes.append(Path.CURVE4)
                elif op == "closePath":
                    codes.append(Path.CLOSEPOLY)
                    verts.append((0.0, 0.0))
            if not verts:
                continue
            path = Path(verts, codes)
            self.ax.add_patch(PathPatch(
                path, facecolor=color, edgecolor="none",
                lw=0, antialiased=True,
            ))

    def text(self, x_pt, y_top_pt, width_pt, text, size_pt, color, ttf=KN_REG,
             align="L", line_h=None):
        """Place (possibly wrapped) text. y_top_pt is the top of the first line.
        Baseline of line i ≈ y_top + ascent + i*line_h (ascent ≈ 1.07*size for Noto).
        Returns total height consumed."""
        line_h = line_h or size_pt * 1.55
        lines = self.wrap(ttf, size_pt, text, width_pt)
        ascent = 1.07 * size_pt
        for i, line in enumerate(lines):
            line_w = self._line_width(ttf, size_pt, line)
            if align == "C":
                x = x_pt + (width_pt - line_w) / 2
            elif align == "R":
                x = x_pt + width_pt - line_w
            else:
                x = x_pt
            self._draw_line(ttf, size_pt, line, x, y_top_pt + ascent + i * line_h, color)
        return len(lines) * line_h

    # ------------------------------------------------------------------
    def render(self):
        self.fig.canvas.draw()
        w, h = self.fig.canvas.get_width_height()
        buf = self.fig.canvas.buffer_rgba()
        img = Image.frombuffer("RGBA", (w, h), bytes(buf), "raw", "RGBA", 0, 1)
        plt.close(self.fig)
        return img
