# Vriddhi Institutions — brand & logo

The complete logo system: vector masters, raster exports, app icons and the
React component the app actually renders.

---

## 1. The idea

The mark is a **monogram of the two initials**, and each letter carries one half
of the meaning:

| Letter | Drawn as | Reads as |
| --- | --- | --- |
| **V** | a geometric V whose right stroke is cut square and rises into an arrowhead | **vriddhi** (वृद्धि) — growth, increase, prosperity |
| **I** | a torch: tapered handle, flared cup, collar rim — with a **brain** where the flame would be | knowledge, intellect, enlightenment |

Together: **growing through knowledge.** The arrow doubles as the point of a
stylus and the brain sits exactly where a flame burns, so the mark says
"learning" without ever needing a graduation cap.

### The two-tone V

The V is built as two paths that meet on the letter's centre line, so each
stroke carries its own colour — a deep-teal left stroke against the bright
gradient — and the letter reads as one folded form instead of a solid wedge.
Above the counter's apex the two halves are already separate arms, so the split
is geometrically exact and the union is identical to a single V path. That is
also why one-colour print stays seamless: both halves simply paint the same ink
(verified by scanning the rendered raster for seams — zero pixels of gap).

`brand/concepts/v-colour-treatments.png` renders four treatments on the real
mark. **A (folded ribbon)** is shipped; the others are kept so the decision is
easy to revisit.

| Treatment | Left stroke | Right stroke |
| --- | --- | --- |
| **A · folded ribbon** *(shipped)* | teal-700 | gradient teal-400 → teal-700 |
| B · high contrast | teal-900 | gradient |
| C · bright stem | teal-400 | teal-800 |
| D · subtle two-tone | teal-600 | gradient |

The rest of the mark follows the same dark-to-light rhythm — the torch runs
teal-700 → teal-900, the rim sits at teal-600, and the brain is teal-300 →
teal-500 — so the five shapes alternate in a deliberate beat.

Everything is **flat geometry**. There is no gradient baked into the artwork, no
glow, no 3D render — those are presentation layers (see §6). That is what lets
the logo work as a single-colour rubber stamp, an embroidered crest, a favicon
and a 10-metre banner from the same file.

---

## 2. Files

```
brand/
├── logo/
│   ├── svg/                ← vector masters (use these wherever possible)
│   └── png/                ← ready-made raster exports (white + transparent)
├── hero/                   ← the concept render, extracted for hero moments
├── concepts/               ← decision sheets: arrow, colour, shadow, system
├── tools/
│   ├── build-brand.mjs     ← parametric generator; source of truth for the logo
│   └── extract-hero.mjs    ← pulls the mark out of the concept render
└── README.md
```

### Logo vs. hero artwork

There are two registers of the brand, and they are deliberately different tools:

| | **Logo** (flat vector) | **Hero artwork** (render) |
| --- | --- | --- |
| Looks like | flat geometry, two-tone V, solid brain | dimensional V, soft shading, glowing brain |
| Lives in | app chrome, favicons, documents, print, embroidery | login screens, splash, decks, campaign |
| Works at | 16px to 10m, one colour to full colour | 200px and up, on a light surface |
| Files | `logo/svg/*`, `logo/png/*` | `hero/vriddhi-mark-hero-light.png` |

The render is the concept image that the logo was built from. It was kept rather
than discarded because a dimensional, glowing mark is exactly right for a hero
moment, and a flat mark is exactly right everywhere else.

`brand/tools/extract-hero.mjs` crops the mark out of the concept render (it finds
the gap between the mark and the wordmark automatically), then bakes the render's
noisy off-white background to the app's white card so the glow composites without
a halo. Only the light bake is shipped: the brain's glow is near-white, so keying
it against a dark surface would either keep the render's background noise or eat
the glow. In dark mode the artwork is mounted on a white card instead — which
reads as intentional artwork and keeps the glow exactly as designed.

### Vector masters — `brand/logo/svg/`

| File | Use |
| --- | --- |
| `vriddhi-logo-horizontal.svg` | **Primary lockup.** Websites, letterheads, email signatures |
| `vriddhi-logo-horizontal-reverse.svg` | Same, for dark backgrounds |
| `vriddhi-logo-stacked.svg` | Square-ish spaces: social avatars, certificates, merchandise |
| `vriddhi-logo-horizontal-mono-black.svg` | Faxes, forms, engraving, single-colour print |
| `vriddhi-logo-stacked-mono-black.svg` | Same, stacked |
| `vriddhi-mark.svg` | The monogram on its own — app bars, watermarks |
| `vriddhi-mark-mono-black.svg` / `-mono-white.svg` | One-colour mark |
| `vriddhi-mark-badge.svg` | Teal tile — the installed app icon |
| `vriddhi-logo-horizontal-lift.svg` | Same logo with the soft presentation shadow (§6) |
| `vriddhi-mark-lift.svg` | Mark with the soft shadow |
| `vriddhi-store-icon.svg` | Inset tile with a real drop shadow — store listings, hero art |
| `vriddhi-store-icon-simple.svg` | Same, with the brain folds simplified for small sizes |

### Raster exports — `brand/logo/png/`

1600px wide lockups (on white and transparent), 1200px stacked, 1024px marks in
colour / black / white, and 1024px presentation icons.

### In the app

- `public/icons/` — `icon.svg` plus the generated `icon-192`, `icon-512`,
  `apple-touch-icon`, `favicon-32`, `favicon-48` and `maskable-512` PNGs, all
  wired up in `index.html` and `vite.config.ts`.
- `src/shared/components/VriddhiLogo.tsx` — the React component, used by the
  sidebar (`Layout.tsx`) and both login pages.

---

## 3. Colours

| Token | Hex | Where |
| --- | --- | --- |
| Teal 300 | `#5eead4` | Reverse lockup ink, brain gradient start |
| Teal 400 | `#2dd4bf` | Gradient start (top of the ink) |
| Teal 500 | `#14b8a6` | Gradient mid, icon tile, `brand.primary` |
| Teal 600 | `#0d9488` | "INSTITUTIONS" line, rim bar, `theme-color` |
| Teal 700 | `#0f766e` | Gradient end (bottom of the ink) |
| Teal 800 | `#115e59` | Dark end of the torch gradient |
| Teal 900 | `#134e4a` | Dark end of the torch gradient, alt left-stroke |
| Slate 900 | `#0f172a` | "VRIDDHI" wordmark |
| White | `#ffffff` | Reverse wordmark, icon glyph |

The palette is the one the app already used (`tailwind.config.js`,
`ThemeProvider.tsx`), so adopting the logo needed **no re-theming**.

---

## 4. Typography

The wordmark is **Inter SemiBold**, converted to outlines — so it needs no font
installed and never reflows. "VRIDDHI" is set at a slight negative tracking;
"INSTITUTIONS" sits underneath in Inter Medium, letterspaced and optically
justified to about 95% of the wordmark's width. The app itself uses Inter +
Noto Sans, so the logo sits naturally next to UI text.

---

## 5. Rules

**Clear space** — keep a margin equal to the height of the "V" on every side.
The exported files already include it.

**Minimum sizes**

| Version | Minimum |
| --- | --- |
| Horizontal lockup | 120px wide (30mm in print) |
| Mark | 16px, but below 32px use `vriddhi-store-icon-simple` |
| Badge / favicon | 16px — the shipped app icons already use the simplified brain |

The **simplified brain** is the same silhouette with the fold strokes dropped.
In the React component it is one prop, and the `badge` variant applies it
automatically:

```tsx
<VriddhiLogo variant="mark" height={20} simple />   // icon-sized
<VriddhiLogo variant="badge" />                     // already simplified
<VriddhiLogo variant="horizontal" height={34} />    // full detail
<VriddhiLogo variant="mark" mono="#0f172a" />       // one colour
```

**Do**

- Use the teal version on white, slate-50 or a light photo with a scrim.
- Use the reverse version on slate-900, `#0b1220` or darker.
- Use the mono version for anything with a restricted palette.

**Don't**

- Don't recolour the mark outside the palette above (the two-tone V is the one
  place two colours meet — keep that split, the letter needs it to read).
- Don't stretch, skew, rotate or add a stroke to the outlines.
- Don't put the wordmark on a busy photo — use the stacked lockup instead.
- Don't add a hard black **drop shadow, glow or bevel to the flat logo** — see
  below for why, and what to use instead.

---

## 6. On shadows — the honest answer

A drop shadow is not part of the logo, but it is a legitimate part of
*presentation*. The rule:

| Context | Shadow? | Asset |
| --- | --- | --- |
| Primary logo, letterhead, print, documents | **No** — flat | `vriddhi-logo-horizontal.svg` |
| App icon on a home screen | **No** — the OS adds its own | `icon-512.png` / `vriddhi-mark-badge.svg` |
| Hero banners, splash screens, slide decks, app-store listing | **Yes** — soft only | `vriddhi-store-icon.svg`, `*-lift.svg` |
| Small sizes (favicon, sidebar, badge < 48px) | **Never** — it turns to mud | flat assets |

`brand/concepts/shadow-comparison.png` renders the identical artwork flat, with
a soft shadow and with a heavy shadow, side by side with a 96 / 48 / 28px strip.
At 28px the shadowed versions visibly degrade while the flat mark stays crisp —
that sheet is the evidence for the table above.

The `depth` theme in the generator uses a single `feDropShadow` (0/6/6, 20%
slate-900). The store icon uses a two-layer shadow (a tight contact shadow plus
a soft ambient one) because a single flat shadow reads cheap at icon scale.

---

## 7. Regenerating

The committed assets are the deliverable — you only need the toolchain when the
geometry itself changes.

```bash
npm i -D sharp opentype.js                     # rasteriser + font outlining
# place Inter-SemiBold.ttf / Inter-Medium.ttf / Inter-Bold.ttf in brand/tools/

npm run brand:build          # SVG masters, PNG exports, app icons, React component
npm run brand:variants       # + the arrow and shadow decision sheets
```

Point the script at an existing dependency tree instead with
`BRAND_NODE_MODULES` / `BRAND_FONT_DIR`.

`build-brand.mjs` is fully parametric: cap height, stroke weights, arrow
direction, barb width, torch dimensions and the brain's lobe count are all
inputs, and the React component is generated from the same geometry as the
files — so the app and the print assets can never drift apart.

The brain deserves a note: it is an implicit surface (a union of lobes minus the
fold strokes and the midline split) traced with marching squares, so the folds
are **true negative space** rather than white lines drawn on top. That is what
keeps the mark legible when it is printed in one flat colour.
