# Karnataka scheme preparation: all 23 seeded universities

**Research review:** 13 November 2026
**Scope:** Karnataka seed inventory only; programme/admission-cohort coverage is partial.
**Important:** these are **23 preparation drafts, not 23 certified assignable schemes**. No production university was renamed, scheme assigned, data migrated or deployment performed.

## Delivered

1. **Evidence catalogue:** `functions/src/academic/research/karnataka-scheme-drafts.json` — 23 university-scoped preparation records, 43 extracted course rows, source URLs/access/read scope, clause/matrix locators, observed values, identity notes and blockers.
2. **Separate research contract:** `functions/src/academic/schemeResearch.ts`. Every record has `status: "draft"`, `assignable: false`, and format `vriddhi-karnataka-research-pack/v1`. It is deliberately not an executable `UniversitySchemePack`.
3. **In-app catalogue:** Scheme Packs → **University sources & preparation drafts (23 seeds)**; also available in Create/Edit College, filtered by selected university **code**, not assumed Firestore document ID. Search by university/programme, filter evidence status and download an individual `ka_<code>_research.json` preparation file. There is no research activation button.
4. **College flexibility:** the same multi-selector supports one, two or more independently pinned packs, an explicit primary and programme/batch/semester routes during college creation/editing and in Scheme Packs. Official assessment uses the server-linked student context; credit/GPA history retains its published evidence. See [implementation, migration and rollout guide](karnataka-academic-engine.md).

The existing BCU/KUD/generic presets remain **legacy authoring templates**, not newly certified results of this investigation. Neither affiliation nor a research-draft download selects academic policy. A live pack's `active` flag is an authorized staff declaration; structural validation and a source-reference string do not independently certify a university regulation.

## Evidence coverage and queue

| Classification | Records | Meaning |
| --- | ---: | --- |
| Partial evidence | 8 | Some regulations/matrices read; missing rules or verification still block use |
| Conflict / unapproved | 6 | Contradictory clauses, draft approval or inconsistent governing text |
| Source required | 8 | Index/portal, access failure or transition information only; no complete rules |
| Identity review | 1 | Seed identity itself must be established before preparing regulations |
| **Newly certified assignable packs** | **0** | No guessed pass rules, GP conversion or parent-university inheritance |

“Reviewed” means the evidence/access attempt was recorded, **not** that the whole university's regulations were read. PDF extraction was partial and limited to the accessible sections (at most the parser's first 30 pages); source records name the read scope. A syllabus cover, home page, search result or linked-but-unread destination is not numeric-policy evidence.

### Every seed accounted for

| Seed | University | Programme / framework investigated | Status | Leading blocker | Reference / access |
| --- | --- | --- | --- | --- | --- |
| `BU` | Bangalore University | Regular B.Com · SEP 2024 | Partial evidence | Obtain/cross-check the notified university-hosted regulations and amendments, not only this college mirror. | [BU S1](https://www.dscasc.edu.in/images/BCom/syllabus/BcSEP.pdf) · college-mirror · read-partial |
| `UOM` | University of Mysore | BBA · SEP 2024 (not B.Com) | Partial evidence | Cross-check the university-hosted original and all subsequent amendments. | [UOM S1](https://sdmmmkmysore.in/docs/syllabus_sep_y1/B.B.A.%20UG%202024-25%20I%20YEAR.pdf) · college-mirror · read-partial |
| `KU` | Karnatak University | B.Com / separate BCA evidence · revised NEP 2024 | Conflict / unapproved | Obtain the final notified/Chancellor-approved regulations and any corrigenda; draft regulations cannot authorize official grading. | [KU S1](https://www.kud.ac.in/file_upload/neprev24/draft/Draft-Regulations-for-UG%20Programmes%202024-25.pdf) · university · read-partial |
| `MANG` | Mangalore University | UG · NEP 2021, not SEP 2024 | Conflict / unapproved | Obtain clarification/corrigendum for35% versus40% external pass clauses. | [MANG S1](https://www.mangaloreuniversity.ac.in/sites/default/files/2022/NEP_Regulations_2021.pdf) · university · read-partial |
| `GU` | Gulbarga University | UG framework/cohort not yet verified | Source required | Retrieve the actual notified regulations/PDFs behind the index and all programme appendices. | [GU S1](https://gug.ac.in/page/regulations) · university · index-only |
| `KUV` | Kuvempu University | B.Com · SEP 2024 | Partial evidence | Verify notified pass rules, course GP formula/rounding and amendments; the syllabus matrix alone is insufficient. | [KUV S1](http://www.kuvempu.ac.in/eng/SEP/Syllabus/B.Com.pdf) · university · read-partial |
| `TUM` | Tumkur University | Regular B.Com · SEP 2024 | Conflict / unapproved | Obtain clarification of35% versus40% SEE requirements before course grading. | [TUM S1](http://14.139.159.41/SEPS/BCOM.PDF) · university-linked · read-partial |
| `DAV` | Davangere University | B.Com · SEP 2024 | Partial evidence | Obtain the governing attendance, pass, IA and course-GP/rounding regulations. | [DAV S1](https://davangereuniversity.ac.in/wp-content/uploads/2024/07/UG-SEP-Commerce.pdf) · university · read-partial |
| `RCU` | Rani Channamma University | B.Com · 2024 cover / older body | Conflict / unapproved | Resolve legacy2012-13 body versus2024-25 cover with the notified regulations/corrigendum. | [RCU S1](https://rcub.ac.in/uploads/pdf/Syllabus/UG_SEP_Syllabus_1_to_6/BCOM.pdf) · university · read-partial |
| `VSKU` | Vijayanagara Sri Krishnadevaraya University | BCA · SEP 2024 | Partial evidence | Obtain governing programme/cohort regulations for attendance, pass, IA, grade points and rounding. | [VSKU S1](https://vskub.ac.in/wp-content/uploads/2024/08/BCA-I-II-Sem-Syllabus.pdf) · university · read-partial |
| `KAN` | Kannada University | Specialised UG; programme unverified | Source required | Identify the actual supported UG programme and obtain its notified syllabus, regulations and cohort applicability. | [KAN S1](https://kannadauniversity.org/english/) · university · index-only |
| `KSOU` | Karnataka State Open University | BSW · ODL · Jan 2025–26 prospectus | Conflict / unapproved | Obtain a corrected/current BSW cycle-specific prospectus and confirm ODL examination pattern. | [KSOU S1](https://app.ksoumysuru.ac.in/Website_Documents/PROSPECTUS/2025-26%20JAN/BSW%202025-26%20January.pdf) · university · read-partial |
| `KSWU` | Karnataka State Women's University | B.Com · revised UG 2024; adoption order unverified | Partial evidence | Read/cross-check the final notified attendance, pass, GP conversion, rounding and IA rules. | [KSWU S1](https://drive.google.com/file/d/1toYgJxKegQVPLrbSnoBOS2lu6s4ztm_L/view) · university-linked · read-partial |
| `BCU` | Bengaluru City University | Regular B.Com · SEP 2024 | Conflict / unapproved | Obtain the corrigendum/authoritative clarification for35% versus40% SEE pass thresholds. | [BCU S1](https://bcu.ac.in/uploads/syllabus/ug_sep/I_and_II_Sem_SEP_Syllabus/Commerce%20Syllabus/B.Com%20-%20Regular%20UG%20Syllabus%20SEP.pdf) · university · read-partial |
| `BNU` | Bengaluru North University | Regular B.Com · SEP 2024 | Partial evidence | Verify official-hosted/notified source and amendments rather than relying only on this college mirror. | [BNU S1](https://newhorizoncollege.co.in/wp-content/uploads/2024/08/BNU-B.com-SEP-Syllabus-2-25-onwards.pdf) · college-mirror · read-partial |
| `MAN` | Mandya University | Programme/cohort unverified | Source required | Obtain the university’s notified programme-specific scheme, examination regulations and cohort/adoption order. | [MAN S1](https://mandyauniversity.karnataka.gov.in/en) · candidate · unavailable |
| `HAS` | Hassan University | UG programme/cohort unverified | Source required | Retrieve UG programme regulations/curriculum and cohort-specific notified adoption/corrigenda. | [HAS S1](https://hassanuniversity.ac.in/Syllabus.aspx) · university · index-only |
| `KOD` | Kodagu University | Programme/cohort unverified | Source required | Retrieve Kodagu University’s notified scheme and any transitional adoption order for each programme/cohort. | [KOD S1](https://kodaguuniversity.ac.in/) · seed · unavailable |
| `CHAM` | Chamarajanagara University | Programme/cohort unverified | Source required | Confirm the current official portal and obtain notified programme/cohort examination regulations and curriculum. | [CHAM S1](https://cuc.karnataka.gov.in/) · candidate · unavailable |
| `RAI` | Raichur University | Programme/cohort/transition unverified | Source required | Retrieve the current notified programme/cohort scheme, transition/adoption orders and amendments from the migrated portal. | [RAI S1](https://raichuruniversity.ac.in/) · university · index-only |
| `BID` | Bidar University | Programme/cohort unverified | Source required | Retrieve the actual official programme syllabus and notified examination regulations behind UG syllabus menu. | [BID S1](https://bidaruniversity.karnataka.gov.in/en) · university · unavailable |
| `KOP` | Koppal University | BCA · proposed 2026–27 structure | Partial evidence | Obtain governing attendance, pass, IA and GP/rounding regulations, current amendments and final notified programme structure. | [KOP S1](https://koppaluniversity.ac.in/api/media/file/KUK%20BCA%20SYLLABUS%20AND%20STRUCTURE%202026-27%20(1).pdf) · university · read-partial |
| `VIJ` | Vijayanagara University | Independent identity unverified | Identity review | Confirm legal/notified institutional identity, current official portal and distinction from VSKU. | [VIJ S1](https://vijayanagarauniversity.ac.in/) · seed · unavailable |

The JSON includes **all** blockers and sources, not just the leading blocker above. Preparation IDs are `KA_<SEED>_RESEARCH`; these are not Firestore policy IDs and must not be submitted as scheme assignments.

## Differences that prohibit a generic Karnataka clone

- **Course GP formulas differ.** The Bangalore University B.Com college mirror explicitly uses actual percentage ÷ 10 (77% → 7.7). The BCU/Tumkur material and Karnatak draft show different fractional ladders. Semester alpha classifications are not substitute course GP conversion tables. [BU S1](https://www.dscasc.edu.in/images/BCom/syllabus/BcSEP.pdf), [BCU S1](https://bcu.ac.in/uploads/syllabus/ug_sep/I_and_II_Sem_SEP_Syllabus/Commerce%20Syllabus/B.Com%20-%20Regular%20UG%20Syllabus%20SEP.pdf), [TUM S1](http://14.139.159.41/SEPS/BCOM.PDF), [KU S1](https://www.kud.ac.in/file_upload/neprev24/draft/Draft-Regulations-for-UG%20Programmes%202024-25.pdf)
- **Pass clauses conflict.** The reviewed BCU/Tumkur material contains 35% versus 40% SEE requirements; Mangalore's 2021 clauses also conflict on 35%/40%. No threshold was selected arbitrarily. BCU's printed award minimum and allocated matrix total also disagree. [BCU S1](https://bcu.ac.in/uploads/syllabus/ug_sep/I_and_II_Sem_SEP_Syllabus/Commerce%20Syllabus/B.Com%20-%20Regular%20UG%20Syllabus%20SEP.pdf), [TUM S1](http://14.139.159.41/SEPS/BCOM.PDF), [MANG S1](https://www.mangaloreuniversity.ac.in/sites/default/files/2022/NEP_Regulations_2021.pdf)
- **A draft is not an approval.** Karnatak's revised regulations are explicitly DRAFT/pending Chancellor approval. Its BCA document also contains inconsistent editorial/template text. The existing KUD 40/60 authoring preset was not silently changed into these 20/80 revised-2024 rules. [KU S1](https://www.kud.ac.in/file_upload/neprev24/draft/Draft-Regulations-for-UG%20Programmes%202024-25.pdf), [KU S3](https://www.kud.ac.in/file_upload/neprev24/BCA/BCA%201%20to%206th%20Sem%20Syllabus%202024-25.pdf)
- **Course credits and maxima vary.** RCU/KSWU extracts include five-credit majors, while the UOM BBA first-year matrix includes a three-credit major. KSWU's constitutional-values paper is two credits with 100 marks: below-three-credits does not universally mean a 50-mark paper. No universal four-credit default or proportional marks scaling was used. [RCU S1](https://rcub.ac.in/uploads/pdf/Syllabus/UG_SEP_Syllabus_1_to_6/BCOM.pdf), [KSWU S1](https://drive.google.com/file/d/1toYgJxKegQVPLrbSnoBOS2lu6s4ztm_L/view), [UOM S1](https://sdmmmkmysore.in/docs/syllabus_sep_y1/B.B.A.%20UG%202024-25%20I%20YEAR.pdf)
- **Distance-mode rules are distinct and internally inconsistent in this source.** KSOU BSW's ODL prospectus has conflicting 20/80 and 30/70 assessment information and annual/semester wording; it cannot supply regular affiliated-college rules. [KSOU S1](https://app.ksoumysuru.ac.in/Website_Documents/PROSPECTUS/2025-26%20JAN/BSW%202025-26%20January.pdf)
- **Admission years matter.** Mangalore's retrieved regulations are effective 2021–22, not a 2024 SEP policy. Koppal's BCA document concerns 2026–27 and prints proposed/tentative structure wording despite a BOS date. It also has an attendance-only, zero-mark bridge requirement; the current marks-profile schema requires a positive total and must not fabricate marks for that activity. [MANG S1](https://www.mangaloreuniversity.ac.in/sites/default/files/2022/NEP_Regulations_2021.pdf), [KOP S1](https://koppaluniversity.ac.in/api/media/file/KUK%20BCA%20SYLLABUS%20AND%20STRUCTURE%202026-27%20(1).pdf)
- **Publication vintage needs checking.** RCU's 2024 cover coexists with older body text; Davangere's index also lists later amendments. Programme matrices alone cannot establish the latest pass/GP/award policy. [RCU S1](https://rcub.ac.in/uploads/pdf/Syllabus/UG_SEP_Syllabus_1_to_6/BCOM.pdf), [DAV S2](https://davangereuniversity.ac.in/sep-ug-syllabus/)

The runtime now supports explicit fixed/fractional GP bands, percentage÷10 and nearest-integer **GP-only** percentage lookup, with profile overrides and retained provenance. This enables the verified method to be modeled later; it does not resolve conflicting source rules. Pass floors still use raw marks. Other rounding, completion-only and award/attempt rules need separately approved modelling.

## University identity is not policy inheritance

- The authoritative seed inventory is `src/shared/data/karnatakaUniversities.ts`; its 23 codes are covered exactly once by tests. VTU is not in this inventory and was not silently added.
- Seed `KU` denotes Karnatak University, Dharwad; the older template uses `KUD` branding. Neither university IDs nor codes were automatically merged/renamed.
- University documents use generated Firestore IDs. College affiliation stores the actual selected document ID; research lookup uses that document's seed code.
- `VIJ` has not been established as a separate legal university identity from `VSKU`. Keep the records distinct and unresolved; do not copy VSKU rules into VIJ.

- The Raichur portal announces migrated branding/domain for Adikavi Sri Maharshi Valmiki University. The new destination is marked **linked-not-read**, not claimed as a fetched regulation. No automatic seed migration or programme-rule inheritance was performed. [RAI S1](https://raichuruniversity.ac.in/), [RAI S2](https://asmvur.karnataka.gov.in/)

Other legacy domains/establishment metadata and institution-specific identity cautions are preserved in each JSON record's `identityNotes`. A failed portal or similarly named search result is never permission to apply the predecessor/nearby university's rules.

## Turning a preparation draft into a reviewed executable pack

For each **programme + admission batch + scheme version**, obtain and review:

- Final notified regulations/approval order, commencement year, applicable amendments and any conflicting-clause clarification. Preserve URL/document version and page/section references.
- Course codes, titles, credits, GPA inclusion, compulsory/optional choices and actual assessment maxima. Theory, practical, project, internship, viva and completion-only requirements need their own explicit treatment.
- IA methods, test counts/weights, attendance calculation/bounds, independent component pass minima and aggregate pass floors.
- The **course** GP formula/table, letter labels, rounding stage and failure/absence/withheld treatment — not a semester alpha classification copied into course rules.
- Approved full-programme/category/mandatory-course credit requirements. Do not turn allocated semester totals into an unverified award minimum.
- Exact student programme/batch identifiers, mode, entry/exit and transition applicability. No guessed aliases or auto-adoption from an affiliation name.
- Institution-approved worked marks cards including boundary pass/fail, fractional GP, practical/project, absence, zero/non-GPA credits and mixed cohorts.

Keep missing/conflicting values in the research contract. Once complete, an authorized academic author creates a college-owned executable revision; an authorized approver reviews and explicitly assigns it, chooses the primary and routes, then checks browser/server outputs against approved samples. Saving or downloading research is not approval. A new college may be created **explicitly unconfigured**, then have its custom policy prepared. Selecting a legacy template is not a substitute for approved mappings; official grading remains blocked until a valid mapped policy is assigned.

Semester routes are supported for individual results, but a whole-award audit will not guess a hybrid credit plan across semester-specific packs. An approved cross-pack award-plan workflow is follow-up work. This credit audit remains advisory, not graduation or regulatory compliance certification.

## Validation and remaining gates

- Tests assert exact 23-seed coverage, unique source/record IDs, traceable observations/course rows, read-document support for extracted numeric evidence and rejection of all research records by live pack/assignment validation.
- Configured full suites: **763 frontend/shared**, **1,367 Functions**; targeted academic subset **28 + 116**; existing render checks **391**, academic UI/parser/transport checks **52**; both builds pass.
- In-memory callable and stubbed-I/O render tests are **not** production or security-rule emulator verification. Java is absent, so the rules emulator has not run; real-browser E2E and real-college academic acceptance remain release gates.
- No source is represented as university-wide certification. Obtain the listed clarifications and academic approval before official use; no mass activation or production data changes were performed.
