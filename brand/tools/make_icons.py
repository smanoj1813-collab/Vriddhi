#!/usr/bin/env python3
"""Generates the Vriddhi PWA / favicon icon set into public/icons/.

Variants:
  vi   — "VI" monogram (Vriddhi Institutions) on the brand teal gradient tile
  cap  — graduation cap + "VI" wordmark on the brand teal gradient tile

The "VI" glyphs come from Inter-Bold outlines (uharfbuzz shaping + fontTools
pens), so the SVG and every PNG size match exactly.

Usage:
  python brand/tools/make_icons.py --variant vi [--install]   # preview, or write files
  python brand/tools/make_icons.py --variant cap [--install]
"""
import argparse
import os

import numpy as np
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.qu2cuPen import Qu2CuPen
from PIL import Image, ImageDraw
import matplotlib

matplotlib.use("Agg")
from matplotlib.backends.backend_agg import FigureCanvasAgg
from matplotlib.figure import Figure
from matplotlib.patches import PathPatch
from matplotlib.path import Path

HERE = os.path.dirname(os.path.abspath(__file__))          # brand/tools
REPO = os.path.dirname(os.path.dirname(HERE))              # repo root
INTER_BOLD = os.path.join(HERE, "fonts", "Inter-Bold.ttf")
OUT_DIR = os.path.join(REPO, "public", "icons")
PREVIEW_DIR = "/tmp"

S = 512                    # design size
SS = 4                     # supersampling factor
RAD = 112                  # rounded-corner radius (matches existing icon.svg)

TEAL_A = np.array([0x14, 0xB8, 0xA6], dtype=float)
TEAL_B = np.array([0x0F, 0x76, 0x6E], dtype=float)

# MUI "school" icon (24x24), straight lines only
CAP_BAND = "M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"
CAP_BOARD = "M12 3 1 9l11 6 9-4.91V17h2V9L12 3z"


# ---------------------------------------------------------------------------
# SVG path parsing (M/m, L/l, H/h, V/v, z) — enough for the cap paths
# ---------------------------------------------------------------------------
import re as _re
_TOKEN = _re.compile(r"[MmLlHhVvZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?")


def parse_svg_path(d):
    """Parse an M/L/H/V/z-only SVG path into subpaths of (x, y) points."""
    toks = _TOKEN.findall(d)
    subs, pts = [], []
    x = y = 0.0
    sx = sy = 0.0
    cmd = None
    i = 0

    def take_nums(n):
        nonlocal i
        nums = []
        while i < len(toks) and not toks[i].isalpha() and len(nums) < n:
            nums.append(float(toks[i]))
            i += 1
        return nums

    while i < len(toks):
        t = toks[i]
        if not t.isalpha():
            raise ValueError(f"unexpected number at start of {d!r}")
        cmd = t
        i += 1
        if cmd in "Mm":
            nx, ny = take_nums(2)
            x, y = (x + nx, y + ny) if cmd == "m" else (nx, ny)
            if pts:
                subs.append(pts)
            pts = [(x, y)]
            sx, sy = x, y
            # remaining pairs after M/m are implicit linetos
            while i < len(toks) and not toks[i].isalpha():
                nums = take_nums(2)
                if len(nums) < 2:
                    break
                nx, ny = nums
                x, y = (x + nx, y + ny) if cmd == "m" else (nx, ny)
                pts.append((x, y))
        elif cmd in "Ll":
            while i < len(toks) and not toks[i].isalpha():
                nums = take_nums(2)
                if len(nums) < 2:
                    break
                nx, ny = nums
                x, y = (x + nx, y + ny) if cmd == "l" else (nx, ny)
                pts.append((x, y))
        elif cmd in "Hh":
            while i < len(toks) and not toks[i].isalpha():
                (nx,) = take_nums(1)
                x = x + nx if cmd == "h" else nx
                pts.append((x, y))
        elif cmd in "Vv":
            while i < len(toks) and not toks[i].isalpha():
                (ny,) = take_nums(1)
                y = y + ny if cmd == "v" else ny
                pts.append((x, y))
        elif cmd in "zZ":
            if pts:
                subs.append(pts)
                pts = []
            x, y = sx, sy
    if pts:
        subs.append(pts)
    return subs


def transform_points(subs, scale, dx, dy):
    return [ [(x * scale + dx, y * scale + dy) for (x, y) in s] for s in subs ]


def subs_to_svg(subs, prec=2):
    out = []
    for s in subs:
        if not s:
            continue
        d = f"M {s[0][0]:.{prec}f} {s[0][1]:.{prec}f}"
        for x, y in s[1:]:
            d += f" L {x:.{prec}f} {y:.{prec}f}"
        d += " Z"
        out.append(d)
    return " ".join(out)


# ---------------------------------------------------------------------------
# Glyph outlines (Inter Bold), via uharfbuzz shaping + fontTools pens
# ---------------------------------------------------------------------------
def shape_glyphs(text, size_px):
    """Shape `text` at size_px. Returns (items, total_advance_px, k).
    items: list of (x_pen_px, y_off_px, subpaths). Coordinates are y-down,
    baseline at y=0, in pixels."""
    blob = open(INTER_BOLD, "rb").read()
    tt = TTFont(INTER_BOLD)
    hf = hb.Font(hb.Face(hb.Blob(blob)))
    hf.scale = (size_px, size_px)          # advances/offsets in px
    k = size_px / tt["head"].unitsPerEm    # font units -> px (outlines)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hf, buf)
    gs = tt.getGlyphSet()

    def px(p):
        return (p[0] * k, -p[1] * k)       # font y-up -> y-down

    items, pen = [], 0.0
    for gi, gp in zip(buf.glyph_infos, buf.glyph_positions):
        name = tt.getGlyphName(gi.codepoint)
        rp = RecordingPen()
        gs[name].draw(rp)
        final = RecordingPen()
        cp = Qu2CuPen(final, max_err=1)
        for op, args in rp.value:
            getattr(cp, op)(*args)
        subs, cur = [], None
        for op, args in final.value:
            if op == "moveTo":
                if cur is not None:
                    subs.append(cur)
                cur = [px(args[0])]
            elif op == "lineTo":
                cur.append(("L", px(args[0])))
            elif op == "curveTo":
                cur.append(("C",) + tuple(px(a) for a in args))
            elif op == "closePath":
                subs.append(cur)
                cur = None
        if cur is not None:
            subs.append(cur)
        items.append((pen + gp.x_offset, gp.y_offset, subs))
        pen += gp.x_advance
    return items, pen, k


def sub_to_verts(curv):
    """curv: [start_pt, ("L", p) | ("C", p1, p2, p3), ...] -> (verts, codes)"""
    verts, codes = [], []
    verts.append(curv[0])
    codes.append(Path.MOVETO)
    for el in curv[1:]:
        if el[0] == "L":
            verts.append(el[1])
            codes.append(Path.LINETO)
        else:
            for q in el[1:]:
                verts.append(q)
                codes.append(Path.CURVE4)
    return verts, codes


def sub_to_svg_d(curv, prec=2):
    def fmt(p):
        return f"{p[0]:.{prec}f} {p[1]:.{prec}f}"
    first = curv[0]
    d = f"M {fmt(first)}"
    for el in curv[1:]:
        if el[0] == "L":
            d += f" L {fmt(el[1])}"
        else:
            d += f" C {fmt(el[1])} {fmt(el[2])} {fmt(el[3])}"
    d += " Z"
    return d


# ---------------------------------------------------------------------------
# Tile painting
# ---------------------------------------------------------------------------
def tile_base(rounded=True):
    """512x512 RGBA: teal diagonal gradient, rounded corners if requested."""
    xs = np.linspace(0, 1, S)
    ys = np.linspace(0, 1, S)
    X, Y = np.meshgrid(xs, ys)
    t = (X + Y) / 2
    arr = TEAL_A[None, None, :] * (1 - t[:, :, None]) + TEAL_B[None, None, :] * t[:, :, None]
    rgba = np.dstack([arr, np.full((S, S), 255.0)])
    img = Image.fromarray(rgba.astype(np.uint8), "RGBA")
    if rounded:
        mask = Image.new("L", (S, S), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=RAD, fill=255)
        img.putalpha(mask)
    return img


def draw_content(img, variant, content_scale=1.0):
    """Draw white mark (VI monogram, or cap+VI) centered; y-down, 512 design units."""
    fig = Figure(figsize=(S * content_scale / 100, S * content_scale / 100), dpi=100)
    fig.patch.set_alpha(0.0)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_facecolor("none")
    ax.set_xlim(0, S * content_scale)
    ax.set_ylim(S * content_scale, 0)   # y-down
    ax.axis("off")
    W = S * content_scale

    if variant == "vi":
        em = 292 * content_scale
        items, adv, _ = shape_glyphs("VI", em)
        x0 = (W - adv) / 2
        base = W / 2 + 0.364 * em  # Inter capHeight ≈ 0.727em -> half
        for xp, yo, subs in items:
            for curv in subs:
                verts, codes = sub_to_verts(curv)
                verts = [(x + x0 + xp, y + base + yo) for x, y in verts]
                ax.add_patch(PathPatch(Path(verts, codes), facecolor="white", edgecolor="none"))
    else:  # cap + VI
        cap_w = 246 * content_scale
        sc = cap_w / 24
        band = transform_points(parse_svg_path(CAP_BAND), sc, (W - cap_w) / 2, 66 * content_scale)
        board = transform_points(parse_svg_path(CAP_BOARD), sc, (W - cap_w) / 2, 66 * content_scale)
        for s in band + board:
            ax.add_patch(PathPatch(Path([(x, y) for x, y in s] + [(s[0][0], s[0][1])],
                                        [Path.MOVETO] + [Path.LINETO] * (len(s) - 1) + [Path.CLOSEPOLY]),
                                   facecolor="white", edgecolor="none"))
        em = 168 * content_scale
        items, adv, _ = shape_glyphs("VI", em)
        x0 = (W - adv) / 2
        base = 66 * content_scale + 19.5 * sc + 26 * content_scale + 0.727 * em  # under cap
        for xp, yo, subs in items:
            for curv in subs:
                verts, codes = sub_to_verts(curv)
                verts = [(x + x0 + xp, y + base + yo) for x, y in verts]
                ax.add_patch(PathPatch(Path(verts, codes), facecolor="white", edgecolor="none"))

    canvas = FigureCanvasAgg(fig)
    canvas.draw()
    rgba = np.asarray(canvas.buffer_rgba())  # top-first RGBA, transparent bg
    fig.clf()
    return Image.fromarray(rgba.astype(np.uint8), "RGBA")


def build_variant(variant):
    """Return dict of name -> PIL image (RGBA) for all required icon sizes."""
    big = SS * S
    tile = tile_base(rounded=True).resize((big, big), Image.LANCZOS)
    content = draw_content(None, variant, content_scale=SS).resize((big, big), Image.LANCZOS)
    tile.paste(content, (0, 0), content)

    # maskable: full-bleed square, content shrunk to the safe zone
    tile_sq = tile_base(rounded=False).resize((big, big), Image.LANCZOS)
    content_m = draw_content(None, variant, content_scale=SS * 0.70)
    target = int(SS * S * 0.70)
    off = (big - target) // 2
    content_m = content_m.resize((target, target), Image.LANCZOS)
    tile_sq.paste(content_m, (off, off), content_m)

    # apple touch: full-bleed square, full-scale content (iOS masks it itself)
    tile_apple = tile_base(rounded=False).resize((big, big), Image.LANCZOS)
    tile_apple.paste(content, (0, 0), content)

    def down(img, px, rounded=True):
        out = img.resize((px, px), Image.LANCZOS)
        if not rounded:
            return out
        return out

    return {
        "icon-512": down(tile, 512),
        "icon-192": down(tile, 192),
        "favicon-48": down(tile, 48),
        "favicon-32": down(tile, 32),
        "apple-touch-icon": down(tile_apple, 180, rounded=False),
        "maskable-512": down(tile_sq, 512, rounded=False),
    }


def build_svg(variant):
    """Self-contained SVG with real Inter glyph outlines."""
    grad = ('<defs><linearGradient id="tile" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="512" y2="512">'
            '<stop offset="0" stop-color="#14b8a6"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs>')
    rect = (f'<rect width="{S}" height="{S}" rx="{RAD}" fill="url(#tile)"/>'
            if variant == "vi" or True else "")
    parts = []
    if variant == "vi":
        em = 292
        items, adv, _ = shape_glyphs("VI", em)
        x0 = (S - adv) / 2
        base = S / 2 + 0.364 * em
        for xp, yo, subs in items:
            for curv in subs:
                parts.append(f'<path d="{shift_d(curv, x0 + xp, base + yo)}" fill="#ffffff"/>')
    else:
        cap_w = 246
        sc = cap_w / 24
        for d in (CAP_BAND, CAP_BOARD):
            subs = transform_points(parse_svg_path(d), sc, (S - cap_w) / 2, 66)
            parts.append(f'<path d="{subs_to_svg(subs)}" fill="#ffffff"/>')
        em = 168
        items, adv, _ = shape_glyphs("VI", em)
        x0 = (S - adv) / 2
        base = 66 + 19.5 * sc + 26 + 0.727 * em
        for xp, yo, subs in items:
            for curv in subs:
                parts.append(f'<path d="{shift_d(curv, x0 + xp, base + yo)}" fill="#ffffff"/>')
    body = "\n  ".join(parts)
    head = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" width="{S}" height="{S}" '
            f'role="img" aria-label="Vriddhi Institutions"><title>Vriddhi Institutions</title>\n  {grad}\n  ')
    return head + rect + "\n  " + body + "\n</svg>\n"


def shift_d(curv, dx, dy):
    def m(p):
        return (p[0] + dx, p[1] + dy)
    first = m(curv[0])
    d = f"M {first[0]:.1f} {first[1]:.1f}"
    for el in curv[1:]:
        if el[0] == "L":
            p = m(el[1])
            d += f" L {p[0]:.1f} {p[1]:.1f}"
        else:
            p1, p2, p3 = (m(el[1]), m(el[2]), m(el[3]))
            d += f" C {p1[0]:.1f} {p1[1]:.1f} {p2[0]:.1f} {p2[1]:.1f} {p3[0]:.1f} {p3[1]:.1f}"
    return d + " Z"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--variant", required=True, choices=["vi", "cap"])
    ap.add_argument("--install", action="store_true", help="write files into public/icons/")
    args = ap.parse_args()

    pngs = build_variant(args.variant)
    svg = build_svg(args.variant)

    if args.install:
        os.makedirs(OUT_DIR, exist_ok=True)
        for name, img in pngs.items():
            img.save(os.path.join(OUT_DIR, f"{name}.png"))
            print("wrote", f"public/icons/{name}.png")
        open(os.path.join(OUT_DIR, "icon.svg"), "w").write(svg)
        open(os.path.join(OUT_DIR, "maskable.svg"), "w").write(svg.replace(f' rx="{RAD}"', ""))
        print("wrote icon.svg / maskable.svg")
    else:
        p = os.path.join(PREVIEW_DIR, f"icon_preview_{args.variant}.png")
        pngs["icon-512"].save(p)
        print("preview:", p)


if __name__ == "__main__":
    main()
