# Dependency security fixes (2026-09-21)

Clears every **high/critical** vulnerability in the production dependency
trees of both the frontend and the Cloud Functions, and adds CI audit gates
so they stay cleared. Follows `PROJECT_AUDIT_2026-09-21.md` (P0).

## What was fixed

### Frontend (`package.json`)
| Was | Now | Why |
| --- | --- | --- |
| `xlsx@0.18.5` | `@e965/xlsx@0.20.3` (pinned) | 2 HIGH advisories on 0.18.5 (prototype pollution, ReDoS) with **no fix on the npm registry** — SheetJS publishes the fixed 0.20.x line only to its CDN, which is not reachable from all networks. `@e965/xlsx` is the npm-published build of the same SheetJS 0.20.3 code. Pinned exactly (no `^`) so a future SheetJS republish can't silently move us. |
| `@xmldom/xmldom@0.8.13` (via mammoth) | `0.8.15` (lockfile, via `npm audit fix`) | ~10 HIGH advisories (injection/ReDoS/quadratic-complexity in the XML parser used for .docx syllabus imports). 0.8.15 is the fixed 0.8.x; mammoth's `^0.8.6` range accepts it. |

Three import lines updated to `@e965/xlsx`
(`attendanceExport.ts`, `AssessmentTestReports.tsx`,
`standardizedTemplate.ts`). The API surface used (`XLSX.utils.*`,
`XLSX.write`) is unchanged.

**Result: `npm audit --omit=dev` → 0 vulnerabilities.**
(The 2 remaining dev-only findings are esbuild/vite — build-time tooling
that never ships; the fix is a breaking Vite 5→8 upgrade, tracked as
separate work.)

### Cloud Functions (`functions/package.json`)
| Was | Now | Why |
| --- | --- | --- |
| `pdfjs-dist@3.11.174` | `^6.3.289` | HIGH: arbitrary JavaScript execution when parsing a malicious PDF (GHSA-wgrm-67xf-hhpq, GHSA-hq66-cqwq-w95j). Paper parsing takes faculty/admin-uploaded PDFs, so this was the most dangerous server-side sink. |
| `firebase-functions@5.x` | `^7.4.0` | Clear the functions 5/6 moderate advisory; peer-compatible with admin 12. |
| `firebase-admin@12.7.0` | `^12.7.0` (floor raised) | Kept deliberately — see below. |

pdfjs 6 code changes (both in `functions/src/paperParsing.ts`):
- Legacy build is now ESM: `pdfjs-dist/legacy/build/pdf.js` → `.mjs`
  (dynamic import + type import).
- `destroy()` moved from the document proxy to the loading task:
  `doc.destroy()` → `task.destroy()`.
- pdfjs 6 requires **Node ≥ 22.13**: production already runs Node 22
  (`functions/package.json engines`), and the CI functions job was bumped
  Node 20 → 22 to match (this also closes the audit's Node-mismatch
  finding).

**Result: `npm audit --omit=dev` → 0 high / 0 critical** (was 1 critical +
5 high). The critical `tar` finding and the `canvas`/`fast-xml-parser`
findings were cleared by the pdfjs upgrade and the fresh lockfile
resolution (`fast-xml-parser` now 5.11.1).

### Why NOT firebase-admin 14 (yet)
Admin 14 **removed the legacy namespace API** (`admin.firestore()`,
`admin.auth()`, …) in favor of the modular API. A full migration touches
~30 function files and is a real project, not a bump — doing it alongside a
security release would make a bad incident much harder to diagnose. The
11 remaining **moderate** findings are all in the admin-12 →
`@google-cloud/*` chain (uuid, teeny-request, google-gax, …). When the
admin-14 migration happens, they clear in one step.

## CI changes (`.github/workflows/ci.yml`)
- Frontend job: `npm audit --omit=dev --audit-level=high` — fails the build
  on any high/critical production vulnerability.
- Functions job: same gate (prod deps only), plus Node 20 → 22.

## Verification
- Functions: `tsc` clean, **661/661 unit tests pass** — including
  `paperParsing.test.ts`, which parses real PDFs through pdfjs 6 on Node 22.
- Frontend: `tsc` clean, **197/197 unit tests pass**, production build
  clean.
- Audits: frontend prod 0 vulns; functions prod 0 high/critical.

## Backlog (from this work)
1. **firebase-admin 14 modular migration** — clears the 11 moderate
   `@google-cloud/*` findings + lets us drop the admin 12 floor.
2. **Vite 5 → 8** (frontend) — clears esbuild/vite dev-only advisories;
   expect plugin/config churn.
3. The remaining moderate express/qs/body-parser findings in the functions
   prod tree clear partially with the admin migration, partially with an
   express 4.22.x bump — revisit then.
