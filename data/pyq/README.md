# Prepared original-PDF PYQ seed

153 paper links are ready; 22 other-language entries were excluded.

## Included

| Group | Papers |
|---|---:|
| bba | 27 |
| languages | 10 |
| bsw | 26 |
| ug-open-elective | 26 |
| open-electives | 64 |

Languages: **4 English + 6 Kannada**.

## Content policy

- Original public Google Drive PDF links only, labelled PYQ.
- No university assigned or displayed.
- No generated questions, answer keys or OCR transcriptions.
- Unknown exam year, scheme, marks and duration are not inferred.
- Other-language subjects are excluded from this seed, not deleted from Drive.
- Existing Firestore rows are preserved when re-seeding.

## Coverage

175 public PDF entries inventoried from BBA, BSW, LANGUAGES and both elective groups. All 46 eligible MA semester folders were checked and exposed no public PDF listings. Three other-language MA programme folders are excluded by the English/Kannada selection. No empty directories or unavailable papers are seeded.

All 46 eligible MA semester folders were checked; the returned empty-state pages exposed no public PDFs. This does not certify private/unlisted folder contents. Empty directories are audit entries only, never question-paper records. ZIP archives were not seeded alongside their individual PDFs. Identical filenames with different Drive IDs are retained; byte-level duplicate checks need the originals.

## How to seed

After merging and deploying these changes, open **Superadmin → Prep Content Studio**. Deselect the other bundles, select **Shared PYQ PDFs (English / Kannada languages)**, and confirm **Seed Selected**. This writes only missing entries into `prep_papers`. No cloud data is written by `npm run pyq:prepare`.

Full instructions: `docs/PYQ_DRIVE_SEEDING.md`.
