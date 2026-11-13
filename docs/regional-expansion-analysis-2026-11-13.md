# Vriddhi regional expansion analysis
## Karnataka → Tamil Nadu, Andhra Pradesh and Kerala

**Research date:** 13 November 2026

**Repository baseline:** `da7d1e8dd56f54aad5448e5bddb1d98eed972688`

**Scope:** Product, academic-regulation, curriculum/content, localization, admissions/reporting and implementation-readiness analysis. No application implementation or deployment was performed.

> **Decision:** Expand the existing platform; do not build three separate applications. However, do not market a new state as fully supported merely because its universities and language have been added. Official academic support must be approved for a specific institution, programme, regulation version and admission cohort.

## Executive summary

Vriddhi is **Karnataka-first, not structurally restricted to Karnataka**. Its college tenancy, university records, curriculum mapping, elective-registration baskets, assessment infrastructure and language framework provide a substantial reusable foundation.

The main expansion problem is **academic correctness and content provenance**, not the ability to store another state name. The repository currently combines configurable academic features with Karnataka defaults and some legacy paths. Adding a “Tamil Nadu scheme”, “AP scheme” and “Kerala scheme” would conceal differences between universities, autonomous colleges, programmes, course types and admission years.

The most important findings are:

1. **Existing functionality should be extended, not recreated.** Six language configurations already include Tamil, Telugu and Malayalam. Course-registration baskets and configurable programme length also already exist.
2. **BCU fallback is the highest-risk regional default.** Missing or unreadable scheme assignments can resolve to BCU. Incomplete custom packs also inherit BCU fields. That preserves historical behaviour but is inappropriate for an unconfigured new-region tenant.
3. **One college-wide examination pack is insufficient.** A college can run UG and PG, multiple admission-year regulations and different assessment formats simultaneously.
4. **Even one programme can have several assessment formats.** Bharathiar University's published B.Com curriculum for the 2026–27 intake contains 100-, 75-, 50- and 25-mark courses; it also distinguishes internal-only, external-only and industry-assessed components. This is not representable safely by changing just a default IA/ESE ratio. [1](https://b-u.ac.in/node/1133)
5. **AP's 2023–24 framework must not be presented as the only current framework.** The older APSCHE document and university-hosted material for the revised 2025–26 curriculum differ materially. Both need cohort-specific treatment; an older framework cannot be assigned automatically to a new intake. [8](https://kru.ac.in/wp-content/uploads/2025/12/BBA-General-syllabus-of-IIIIIIIVVVIVIIVIII-semesters-for-the-AY-2025-26-min.pdf)
6. **Kerala requires pathway and degree-audit work.** University of Kerala's 2026–27 prospectus specifies 133 credits for the three-year exit and 177 for four-year honours/research. These are not generic national totals to be substituted from a NEP preset. [1](https://admissions.keralauniversity.ac.in/fyugp2026/pdfs/FYUGP_Prospectus_2026.pdf)
7. **Learning support can launch before official-record automation.** Concept learning, skills courses and faculty-reviewed study material can be offered with honest coverage labels. Exam eligibility, transcripts, award eligibility and portal submissions need a separate certification gate.

**Default rollout recommendation:** one Tamil Nadu university cluster first, one AP university cluster second, and one Kerala university cluster third, while researching all three in parallel. This is an engineering-risk recommendation, not a market-size ranking. A committed pilot institution with better access to approved documents can justify changing that order.

---

## 1. Research method, evidence and boundaries

### What was checked

- The actual TypeScript/Firebase repository: scheme-pack schema and resolution, exam/result consumers, managed grade publication, curriculum and cohort models, elective registration, promotion, admissions, university catalogue, localization, APAAR exports, scholarships and Prep content/routing.
- Official university regulations, curriculum documents, current admission portals and relevant national/state sources.
- Effective admission year and institutional scope wherever available, rather than relying on the document's URL or upload date.

### Evidence distinctions

- **Code-confirmed:** directly visible in the checked-out source. This does not establish what data or configuration is currently deployed.
- **Primary document/page read:** the relevant retrieved sections were inspected. Large PDFs were read selectively, not necessarily in full.
- **Official indexed only:** search text was available, but full retrieval did not succeed.
- **Recommendation/estimate:** proposed design or planning assumption, not an existing feature, adopted university rule or commercial quote.

This is a representative, source-grounded expansion study, **not a certification of every university or programme in three states**. The strongest coverage is regular arts, commerce, science, management and computer-applications UG. PG requires its own regulation review. Engineering, medicine, law, distance education, private registration and university-department rules must not be substituted for affiliated regular-college rules.

Academic regulations, state admissions and scholarship eligibility are separate policy domains. Similar category names or a shared 75% attendance headline do not make them interchangeable.

---

## 2. What Vriddhi can reuse

| Capability already present | Repository evidence | Implication for expansion |
|---|---|---|
| College/university records and state metadata | `src/shared/types/university.ts`, `src/modules/superadmin/types/superAdmin.ts` | Extend the catalogue and onboarding, not the entire tenancy model. Keep management type and autonomy distinct. |
| Configurable examination packs | `src/shared/types/schemePack.ts`, `src/shared/utils/schemeEngine.ts`, `functions/src/schemePacks.ts` | Reuse validation and calculation infrastructure, but add version/cohort binding and course-level policies. |
| Per-course credits and IA/ESE maxima in parsed curricula | `src/shared/types/curriculum.ts`, `src/modules/superadmin/types/curriculum.ts` | Useful starting point for mixed-mark programmes; not all consumers currently use those maxima correctly. |
| Branch/batch/semester/division curriculum mapping | `functions/src/studentCurriculum.ts`, `functions/src/autoCurriculumMapping.ts`, `functions/src/cohortBatch.ts` | Cohort mapping already exists. The missing layer is an explicit approved regulation/pathway relationship. |
| Elective baskets with categories, programme restrictions and seat-capacity checks | `functions/src/registrationCore.ts`, `functions/src/registration.ts` | Reuse for DSE/OE/SEC/VAC/AEC choices. Add prerequisites, pathway persistence, cross-semester choices and credit rules. |
| Longer programme support in parts of the system | `functions/src/promotionCore.ts`, `functions/src/registrationCore.ts`, `functions/src/gradeRecords.ts` | Promotion and registration accept more than six semesters; grade validation accepts up to 20. Six-semester defaults are not proof of a universal hard limit. |
| Merged teaching groups and timetable/load planning | `docs/teaching-groups-and-load-planning.md`, `functions/src/autoSchedule.ts` | Useful for shared courses. Merged divisions do not by themselves prove arbitrary cross-department elective enrolment is propagated to every roster. |
| Server-backed admissions stage machine and adjustable merit weights | `functions/src/admissions.ts`, `src/modules/admin/api/admissionApi.ts` | Reuse enquiry/application/offer/enrolment flows. Do not equate its weighted score with an official CAP/index/reservation formula. |
| Six-language UI/AI catalogue | `src/shared/i18n/languages.ts`, `src/shared/i18n/translations.ts`, `functions/src/services/languages.ts` | Tamil, Telugu and Malayalam are already supported configurations. Remaining work is reach, documents, terminology and quality review. |
| Draft/publish grade workflow, role checks and audits | `functions/src/gradeRecords.ts`, `firestore.rules` | Preserve this foundation and make scheme validation authoritative at publication. Reconcile older result-import paths. |
| APAAR mapping and NAD/ABC-shaped exports | `functions/src/apaar.ts`, `functions/src/apaarCore.ts` | Reuse national identity/export tools independently of Karnataka's UUCMS screen. Do not claim official verification or direct upload from local format validation. |
| University-neutral learning/skills content | `docs/PREP_UNIVERSAL_SUPPLEMENT.md`, `functions/src/data/universalAcademicSupplement.ts` | Offer across regions with a concept/skills label; retain separate verified syllabus mappings. |

**No evidence-based “percentage reusable” can be calculated from this audit.** Reuse is strong at platform level, while official academic rules and verified exam-preparation coverage require more work.

---

## 3. Regional academic and operational findings

### 3.1 Tamil Nadu

#### Current evidence: Bharathiar B.Com, 2026–27 intake

The official affiliated-college commerce catalogue explicitly lists separate 2026–27, 2025–26 and earlier curriculum versions. The linked 2026–27 B.Com curriculum was retrieved and identifies its own admission-year applicability. [1](https://b-u.ac.in/node/1133)

Its programme table contains six semesters and 140 credits, but the assessment structure is not one uniform 25/75 rule:

| Example from the published 2026–27 B.Com table | IA/CIA | ESE | Total |
|---|---:|---:|---:|
| Principles of Accountancy | 25 | 75 | 100 |
| Allied Agricultural Economy of India | 20 | 55 | 75 |
| English II | 25 | 25 | 50 |
| Environmental Studies | None | 50 | 50 |
| Disaster Management | 25 | None | 25 |

The document also states that external assessment of the listed Naan Mudhalvan skill courses is by industry, while internal assessment is by the course teacher. Those are rules for this published programme/cohort, **not every Tamil Nadu course**. Source: [2026–27 curriculum linked from the official catalogue](https://syllabus.b-u.ac.in/syl_college/2026_27/bcom_2026_27.docx).

**Product consequence:** course-level assessment profiles must support different maxima, genuinely absent components, separate evaluators and category-specific aggregation. A zero IA/ESE maximum cannot mean “inherit a default”.

#### Variation within Tamil Nadu

- The University of Madras affiliated-UG handbook inspected describes 25 IA / 75 ESE for theory and 40 / 60 for practicals, with separate attendance/condonation provisions. The handbook's effective intake year was not established, so it is comparison evidence rather than a ready-to-use 2026 pack. [1](https://www.unom.ac.in/webportal/uploads/academics/regulations/ug-common-regulations.pdf)
- Annamalai's affiliated UG document explicitly scoped to the 2023–24 intake uses 25 / 75 for both theory and practical courses, but with different internal components. It requires 75% course attendance; its 60% to below 75% condonation provision requires medical evidence and a fee. It also addresses Part-wise classification and internships. [1](https://mail.annamalaiuniversity.ac.in/affcl/download/syllabus_ug_2023-24/UG_Regulations_23-24.pdf)
- Alagappa's 2023–24 B.Com document illustrates a three-year programme with Core, Allied, SEC and foundation components, including five-credit core papers. This is another reason not to default imported courses to four credits. [3](https://www.alagappauniversity.ac.in/links/docs/aff-23-24/UG_Core/B.Com.pdf)
- Bharathiar's catalogue also lists amendments and skill-course scheme versions for older cohorts. Annamalai's official programme page lists cohort-specific skill-training incorporations. Existing cohorts need their applicable amendments, not just the newest intake's syllabus. [1](https://b-u.ac.in/node/1133) [1](https://annamalaiuniversity.ac.in/affcl/affcl_ug_programmes_23-24.php)

These examples disprove “one Tamil Nadu 25/75 pack”, but do not constitute a current regulation survey of every TN university.

#### Admissions and reporting

- TNGASA's 2026 portal states that it serves **181 government arts and science colleges**. It is not a portal for every Tamil Nadu institution. [1](https://www.tngasa.in/)
- UMIS describes centralized student information, Aadhaar/EMIS interfaces and TNSSP linkage. This establishes the reporting ecosystem, **not public third-party API entitlement**. [1](https://umis.tn.gov.in/homepage)

**Recommended TN work:** university/college register-number mappings; UMIS/EMIS identifiers where required; adaptable community/quota/document fields; imported allotment/merit provenance; approved skill-course credit/evaluation records; Tamil/English documents. Import official outcomes before attempting to reproduce centralized selection algorithms.

### 3.2 Andhra Pradesh

#### Keep at least two curriculum generations distinct

The APSCHE **2023–24 single-major and one-minor guidelines** were retrieved from a government degree-college-hosted copy. The relevant credit and internship sections state:

- Four-year UG honours framework with exit options.
- 160 academic credits **plus 20 internship credits**: CSP 4, short-term internship 4, semester internship 12.
- Major 84 credits and minor 24 credits within that structure.
- Three mandatory internship stages, including a full-semester placement in V or VI.
- Multidisciplinary-course restrictions and audit/pass-fail IKS components.

Source: [APSCHE 2023–24 guideline copy hosted by PRR & VS Government College](https://gdcvidavaluru.ac.in/admin/uploads/news/7577Guidelines%20for%204-Year%20UG%20Honours%20Program%20with%20Single%20Major.pdf), relevant sections 3 and 4.

**Important correction:** these are not automatically the rules for the 2025 or 2026 intake. Andhra University's official indexed UG catalogue lists revised 2025–26 curriculum frameworks. Full retrieval of that catalogue and the direct APSCHE framework PDFs did not succeed. [4](https://www.andhrauniversity.edu.in/student-corner/ug_syllabus.html)

A Krishna University-hosted BBA General document explicitly discusses the **revised single-major framework from 2025–26**. Its published BoS recommendations include:

- 30 marks CIA / 70 SEE.
- A curriculum table showing 126 credits at three years and 170 at four years.
- CSP of at least 80 hours / 1 credit and internship/apprenticeship/OJT of at least 180 hours / 3 credits in that table.
- Paired domain electives that continue across semesters V and VI.

The file has inconsistent meeting-date text and is framed as BoS recommendations. It is strong evidence that a newer programme/cohort structure must be researched, **not sufficient on its own to certify a final statewide 126/170 rule**. Obtain the final adoption order and selected pathway from the pilot university before activating calculations. [8](https://kru.ac.in/wp-content/uploads/2025/12/BBA-General-syllabus-of-IIIIIIIVVVIVIIVIII-semesters-for-the-AY-2025-26-min.pdf)

Adikavi Nannaya University's June 2026 examination timetable separately identifies the **2023 and 2024 admitted batches**. It shows 70-mark major papers and 50-mark skill papers. A document issued in 2026 can therefore govern older cohorts; the publication year is not the regulation's intake year. [5](https://api.aknu.edu.in/api/info/exam_timetable/file/view/69f42f1dca6cc959115c99f0)

**Product consequence:** AP support needs versioned major/minor curricula, elective continuity, internship stages and evidence, credit/exit rules, and per-course exam profiles. Do not relabel one generic NEP preset as “APSCHE compliant”.

#### Admissions and scholarships

The working current Common Admissions Portal is `cap.apcfss.in`. Its OAMDC section advertises 1,184 colleges, 266 courses and 380,860 seats when inspected. These are portal inventory figures, **not enrolment, addressable paying customers or a whole-state institution census**. [1](https://cap.apcfss.in/)

Jnanabhumi's official indexed information describes post-matric scholarship workflows, categories, attendance conditions and government-order changes. Full page retrieval was unsuccessful; current eligibility and disbursement rules need a separate approved scheme review. [1](https://jnanabhumi.ap.gov.in/)

**Recommended AP work:** separate OAMDC/allotment and university-registration identifiers; local-area, category and quota evidence where required by the institution; authorized reporting imports/exports; CSP/OJT supervisor, hours, logbook, evaluation and certificate workflow; Telugu/English documents. Do not conflate scholarship attendance with exam eligibility.

### 3.3 Kerala

#### Current University of Kerala evidence

The **2026–27 affiliated-college FYUGP prospectus** was retrieved. It explicitly applies to that admission cycle and specifies:

- Three-year exit after six semesters with **133 credits**.
- Four-year honours or honours-with-research after eight semesters with **177 credits**.
- DSC, DSE, MDC, AEC, VAC and SEC categories and student pathways.

This is evidence for the University of Kerala's stated scope, not a universal national template or the rules for every autonomous college in Kerala. [1](https://admissions.keralauniversity.ac.in/fyugp2026/pdfs/FYUGP_Prospectus_2026.pdf)

#### Course-type and university differences

Calicut's amended June 2024 regulations apply from the 2024 admission. Its Physics honours syllabus illustrates **30 IA / 70 ESE for four-credit major/minor courses**, **25 / 50 for three-credit general-foundation courses**, internally assessed practical components, and an internally assessed internship. English and Malayalam examination options appear in that programme document. [6](https://admission.uoc.ac.in/downloads/10062-2024-Admn.pdf) [1](https://docs.uoc.ac.in/website/syllabus/2024-08-29%2010:46:39_syl2006.pdf)

Kannur's modified FYUGP order was approved on **27 December 2025** but is effective for the **2024 admission**. It also addresses readmission/scheme migration and programme pathways. A regulation year alone does not identify the applicable amended version. [1](https://www.kannuruniversity.ac.in/media/documents/FYUGP-2024-25_Modified_Rgulation.pdf)

The March 2026 KSHEC internship guidelines discuss approval, supervisors, mentors, hours, reporting and evaluation. They describe the state internship portal as voluntary. Their introductory and credit-calculation sections use different hour ranges; the adopted university rule must settle operational configuration. Do not replace a university's existing internship rule automatically with a state guidance PDF. [1](https://www.kshec.kerala.gov.in/images/pdf/Internship-under-FYUGP-in-Kerala-guidlines.pdf)

**Product consequence:** prioritize approved pathway selection, major/minor credits, elective eligibility, course-level assessment, research/internship evidence, exit/readmission/credit-transfer handling and completion audits. Existing older-cohort regulations must coexist with FYUGP where applicable.

#### Admissions and scholarships

Kerala admissions are not one statewide counterpart of UUCMS. For example, University of Kerala has its own FYUGP admission process, while Calicut's current 2026–27 admissions page links its own student login, prospectus and minor-group information. [1](https://admissions.keralauniversity.ac.in/fyugp2026/pdfs/FYUGP_Prospectus_2026.pdf) [Calicut admissions page](https://admission.uoc.ac.in/admission?pages=ug)

e-Grantz describes centralized educational-assistance workflows for the relevant SC/ST/OBC schemes. It is not all Kerala scholarships; the state higher-education scholarship list also distinguishes KSHEC and DCE channels. [1](https://egrantz.kerala.gov.in/) [Official state scholarship directory](https://highereducation.kerala.gov.in/index.php/academic/scholarships)

**Recommended Kerala work:** university-specific CAP/allotment adapters; explicit quota/category evidence; approved minor baskets and cross-department rosters; Malayalam/English documents; e-Grantz and other relevant scholarship profiles, maintained separately from exam rules.

### Comparative conclusion

| Dimension | Tamil Nadu examples | Andhra Pradesh examples | Kerala examples |
|---|---|---|---|
| Programme structure | Current Bharathiar B.Com: 6 semesters / 140 credits; other universities/cohorts must be checked | 2023–24 and revised 2025–26 structures must coexist | FYUGP 3-year exit / 4-year honours/research; institution/cohort-specific |
| Assessment | 25/75 is common in examples, but 20/55, 25/25, internal-only and external-only also occur | Programme/category/cohort-specific; AKNU timetable mixes 70- and 50-mark ESE | Calicut example mixes 30/70 and 25/50, plus internally evaluated components |
| Choices and progression | Parts, Core/Allied/electives/skills; approved amendments | Major/minor, continuing elective domains, CSP/internship/OJT, exit rules | Major/minor/pathways, foundation categories, research/exit requirements |
| State/university workflows | TNGASA for its participating government colleges; UMIS/TNSSP ecosystem | Current CAP/OAMDC; Jnanabhumi ecosystem | University-specific CAP processes; e-Grantz and other schemes |
| Main engineering emphasis | Mixed assessment profiles, Part-wise aggregation, IDs and skill-course evidence | Cohort versioning, internship/exit accounting and elective continuity | Pathway-aware registration and rigorous degree audit |

The table summarizes the cited examples above, not statewide uniform regulations.

---

## 4. Repository-grounded gaps and priorities

**P0** means required before enabling the affected official or university-aligned feature for a new region. It does not prevent a clearly limited concept-learning pilot. **P1** means required for a useful, supportable regional pilot; priorities can overlap by workstream.

### 4.1 Academic correctness and official records

| Priority | Confirmed finding | Evidence | Required change / acceptance condition |
|---|---|---|---|
| P0 | Unset/unreadable/dangling college scheme bindings resolve to BCU; partial packs inherit BCU fields | `schemePackApi.ts:59–94`; `schemeEngine.ts:22–49` | Preserve explicit legacy Karnataka bindings, but new-region official operations must block on missing/unapproved rules. Display the resolved version and source. |
| P0 | One active pack is selected through `colleges/{id}.schemePackId`; programme applicability is display-only | `schemePackApi.ts`; `schemePack.ts:90–116` | Resolve by institution/autonomy + programme + admission cohort + approved version; then course/category policy. Support UG/PG and old/new cohorts together. |
| P0 | IA model is best-N tests + attendance + assignment/record bucket | `schemePack.ts:46–63`; `schemeEngine.ts` | Configurable named components and rubrics: seminar, viva, practical, open-ended module, project review, internship and external evaluator. Preserve itemized evidence. |
| P0 | Zero per-course maxima are not respected as genuine overrides | `schemeEngine.ts:199–208` uses positive-only override checks | Represent absent IA/ESE explicitly. Internal-only, external-only and audit/pass-fail courses must not inherit a phantom component or fail a nonexistent exam. |
| P0 | Result parser still warns against fixed 20/80 ranges, supplies default credits 4 / marks 100 / semester 1, and checks pass using pack-wide maxima | `resultImportApi.ts:118–153` | Require authoritative course metadata or an explicit reviewed mapping. Validate 75-/50-/25-mark courses correctly and never silently invent credit/semester values for official import. |
| P0 | Legacy importer writes already-published grades into `colleges/{id}/gradeRecords`; managed grades, student journey and APAAR use top-level `gradeRecords` | `resultImportApi.ts:414–465`; `gradeRecords.ts`; `studentJourney.ts`; `apaar.ts:123–141` | Reconcile collection paths and field contracts. Prove import → draft/review → publish → student transcript → promotion → export, with one authoritative record. No production bridge was verified in this research. |
| P0 | Managed publication checks role, tenant and draft status but does not recompute/validate a regulation-bound academic outcome | `gradeRecords.ts:95–131,260–302` | At publication, validate course maxima, official/calc provenance, grade/pass consistency and frozen policy version. Trusted university results can be imported as authoritative with source/reconciliation, not silently replaced by local grades. |
| P0 | Attendance eligibility in hall-ticket generation uses a limited, student-level record query and overall percentage; no records becomes 100%. Per-subject values are reported but the overall verdict is decisive | `examManagementApi.ts:194–253` | Scope by semester/course/date, paginate, treat missing data as unknown, apply actual course/overall rule and approved condonation. Require logged reasons/evidence for exceptions. |
| P0 | Existing promotion uses backlog count and final-semester completion, not a full curriculum/credit audit | `promotionCore.ts:evaluatePromotion` | Prevent graduation when required courses, major/minor/category credits, internships or research work are missing—even if the recorded backlog count is zero. |
| P1 | Fixed grade-band point model does not express every possible grading/classification policy | `schemePack.ts:82–88`; `schemeEngine.ts:262–286` | Support prescribed formulas, rounding, credit exclusions, Part-wise classification and attempt-sensitive distinctions where required. Verify the adopted formula rather than inferring from a table. |
| P1 | Supplementary/revaluation labels exist, but grade identities/history differ across paths | `resultImport.ts`; `resultImportApi.ts:345,414–465`; `gradeRecords.ts:134–137,225–226` | Explicit course attempts, authoritative corrections, retained old outcomes and university-specific repeat/classification policy. Do not claim that no supplementary support exists. |

Two additional integration checks deserve attention: promotion's loader reads `subjectCode`/`subjectName`, whereas managed records use `code`/`subject`; and an input-selected programme length is not a substitute for resolving an approved cohort policy. These are pre-existing academic-path consistency risks that benefit Karnataka as well as expansion.

### 4.2 Catalogue, registration, regional workflows and content

| Priority | Confirmed finding | Required change |
|---|---|---|
| P0 for syllabus-aligned Prep | `PrepSubject.universityRegion` accepts only `karnataka` or `national`; the Prep AI prompt defaults to Karnataka | Replace region as the alignment key with approved curriculum/course mappings. Keep national/concept content explicitly neutral. Use the selected mapping in the AI prompt and cache key. |
| P0 for syllabus-aligned Prep | `GET /subjects` filters programme/stream/year/level/track but not university/regulation/cohort; subject CRUD omits alignment fields | Add complete authoring, query, API and student-context handling. Adding UI selectors without server filtering is insufficient. |
| P1 | Existing university seed and parts of superadmin copy are Karnataka-specific | Add verified regional institution catalogues, scoped aliases and state filters. Use canonical IDs; “BU” can mean different universities and must not be a global identity key. |
| P1 | Six-semester/three-year defaults remain in academic and Prep models | Make duration/year labels programme/cohort-driven. Audit semester selectors, scheduling, imports, reports, access products and year-four content; do not rewrite working longer-semester validators unnecessarily. |
| P1 | Elective baskets support categories and capacities, but do not encode approved major/minor pathways, cross-semester domain continuity or prior-study restrictions | Extend the existing registration model. Validate prerequisites, exclusions, credit caps and continuing choices, and connect confirmed choices to curriculum visibility, attendance and exam rosters. |
| P1 | UUCMS identifiers, board/category/quota assumptions remain in onboarding/integration models | General external identifiers, regional vocabularies, authority-specific document checks and versioned import/export mappings. Preserve UUCMS as the Karnataka adapter. |
| P1 | UUCMS overview's “sync” counts are local records with identifiers, not verified official acknowledgements | Use separate states such as locally linked, export prepared, submitted, accepted/rejected and reconciled. Apply the same honesty to new adapters. |
| P1 | Exam medium is typed as `en | kn | both` even though pack metadata can list other mediums | Separate UI locale, instruction medium, paper medium and response language; support approved Tamil/Telugu/Malayalam and other language courses without forcing language by state. |
| P1 | Scholarship defaults use SSP/NSP and Karnataka categories; portal union is narrow | Configurable regional scheme registry, eligibility-document evidence, effective year and scheme-specific status. Do not rename SSP and reuse its categories or amounts. |
| P1 | Translation dictionaries exist, but application-wide adoption is incomplete | Translate selected staff workflows, messages and documents; native-review fonts, terminology, names, PDFs and low-bandwidth/mobile behaviour. |
| P1 | Some examined list/attendance paths use limits such as 500 students or 200 attendance records | Test pagination and bulk processing at actual college scale. Do not extrapolate a local query cap into a claim that the whole application has that capacity limit. |

---

## 5. Recommended product architecture

### 5.1 Separate four layers

1. **Platform core:** tenancy, roles, timetable, attendance capture, assessment delivery, fees, communications, content delivery and audits.
2. **Academic policy registry:** institution/university regulations, adopted amendments, programme/cohort bindings, course assessment and completion rules.
3. **Curriculum/content registry:** official courses and outcomes mapped to reusable concepts, study material, practice and genuine papers.
4. **Reporting adapters:** Karnataka UUCMS, TN institution/UMIS workflows, AP CAP/university workflows, Kerala university CAP workflows and national award exports.

A state is a useful catalogue/filter/localization dimension, **not the final authority for marks or degree awards**.

### 5.2 Proposed academic resolution contract

The following names describe a target design, not fields implemented during this task:

```text
Institution
  stateCode, affiliatingUniversityId, autonomyStatus, approvedProgrammes

RegulationVersion
  issuingAuthorityId, programmeScope, admissionCohortScope
  orderNumber, issuedOn, effectiveFrom, amendmentOf
  sourceDocuments, reviewedBy, approvedAt, immutableVersion

CohortProgrammeBinding
  collegeId + programmeId + admissionCohort
  regulationVersionId + curriculumVersionId + permittedPathways

CourseOffering
  courseCode, category, credits, learningOutcomes
  assessmentProfileId, attendancePolicyId, mediumOptions

StudentAcademicPlan
  selectedMajor, selectedMinor, pathway, approvedExceptions
  courseEnrolments, transferEquivalences, exitOrReadmissionState

CourseAttempt / CreditAward
  examSession, attemptType, authoritativeSource
  componentMarks, result, gradePoint, earnedCredits
  regulationSnapshot, approvalHistory, correctionLink
```

Resolution should follow the **approved binding**, with an autonomous institution's adopted rules or a formally approved student migration taking precedence where applicable. Ambiguity should produce a visible setup/review requirement—not a chain that ends at BCU or generic NEP.

### 5.3 Extend scheme packs, do not just add presets

Retain the current engine's tested abstractions and add:

- Independent named assessment components, weights, aggregation and evaluator role.
- Category/course overrides, including genuinely zero/absent components.
- Course/semester attendance scope, exemptions and documented condonation decisions.
- Explicit pass/grade/rounding functions and classification inclusion rules.
- Credit/category/pathway completion predicates and allowed entry/exit routes.
- Immutable, approved versions with effective cohorts and source references.
- A shared server-side validation contract used by imports, managed grade publication, transcripts, promotion and exports.

A regulation amendment may apply to an existing cohort, as the Kannur evidence shows. Therefore retain both the original and amended versions, record adoption/effectivity, and apply changes through an audited process. **Do not silently recalculate published results whenever an administrator edits a pack.**

### 5.4 Preserve national tools independently

Move the national-identity/export experience out of a Karnataka-only conceptual home. Local 12-digit APAAR checks are format checks; they do not establish that an ID was issued or belongs to the student.

NAD's published academic-institution workflow includes registration, preparing/uploading standard CSV data, selecting templates and publishing. Vriddhi's exporter is useful preparation, but official issuer authorization and current template acceptance remain external requirements. [1](https://nad.digilocker.gov.in/academia)

Start new state/university reporting work with validated, auditable imports/exports. Only promise a live connector when the authority has provided authorization, an actual supported interface and an acceptance/reconciliation process. Do not base product commitments on scraping login portals or storing staff portal passwords.

---

## 6. Academic content and AI expansion

### Reuse concepts, not unsupported alignment labels

The BBA, BA, B.Sc and M.Com seed bundles contain Karnataka-labelled subjects and syllabus references. The B.Com bundle is **derived from existing BBA/BA/B.Sc subjects**, not a separately authored complete university-specific B.Com syllabus (`functions/src/data/bcomSeedData.ts`). These materials can still be valuable across regions, but their usefulness is not proof of full local syllabus coverage.

There are three distinct products:

| Layer | Can be reused across states? | Required label / review |
|---|---|---|
| Concept/skills learning, worked examples, aptitude and universal toolkit | Often, after normal academic review | “Concept learning” / “skills”; no university alignment claim |
| Programme/university/cohort study plan | Concepts can be mapped, not blindly copied | Exact course code, units/outcomes, regulation, coverage gaps and faculty approval |
| Previous-year-paper preparation | Only with genuine, correctly attributed sources | University, programme, course, scheme, exam/session, source and provenance |

For example, current Karnataka seed metadata places management principles in BBA semester I. AKNU's 2026 timetable for the 2023/2024 cohorts places Principles of Management in semester II, whereas Krishna's revised 2025–26 BBA table places Principles of Management in semester I. The concept can be shared; the student's semester/course mapping cannot be assumed. [5](https://api.aknu.edu.in/api/info/exam_timetable/file/view/69f42f1dca6cc959115c99f0) [8](https://kru.ac.in/wp-content/uploads/2025/12/BBA-General-syllabus-of-IIIIIIIVVVIVIIVIII-semesters-for-the-AY-2025-26-min.pdf)

### Required editorial pipeline

1. Acquire the official syllabus, applicable regulation and amendments for the selected institution/programme/cohort.
2. Parse to draft, retaining document/section evidence; human-review extraction rather than treating OCR or AI confidence as approval.
3. Map official learning outcomes/units to reusable concepts; record complete/partial/missing coverage.
4. Author only the actual gaps. Version tax/legal material by the relevant assessment year and syllabus expectation.
5. Review with a subject expert; review translated academic terms with a native-language reviewer.
6. Add genuine PYQs only where source/provenance and reuse permissions are established. Do not represent model papers or generated questions as PYQs.
7. Publish explicit coverage and review dates, with a route to report syllabus changes or errors.

The existing paper API already has university/semester/scheme filters. That is a useful base, but filtering infrastructure is not evidence that TN/AP/Kerala papers have been sourced and reviewed. No production content inventory was queried in this research.

### AI changes

- Pass the selected curriculum version, course, unit, question-paper pattern and language as explicit context.
- Include regulation/curriculum and language in cache/deduplication keys to prevent cross-cohort leakage.
- In the absence of verified mapping, produce a clearly neutral explanation or ask for the course syllabus; never silently generate Karnataka-aligned notes for a Kerala student.
- Mark AI-generated practice as practice, with human approval before adding it to a university-aligned catalogue.
- Do not use an LLM to decide marks, official eligibility, reservation or degree award. Those require deterministic approved rules and evidence.
- Keep student identity, scholarship evidence and other personal records out of generic academic prompts unless a separately reviewed purpose and data-control design justifies it.

---

## 7. Regional onboarding and integrations

### Separate internal admissions from official allotment

Vriddhi's CRM-style admissions workflow is reusable. Its adjustable qualifying/entrance/interview score should remain an **institutional workflow**, not be presented as the official state/university rank or index score.

For the first release, store the official application's source, reference, programme, category/quota, allotment round, eligibility verification and accepted outcome. Reconcile transfers, withdrawals and seat changes. Add automated merit/reservation calculations only after the exact prospectus, rounding, tie-breaks, category conversions and approval responsibilities have been modelled and tested.

### A practical adapter maturity model

| Stage | Supported claim |
|---|---|
| 1. Manual linkage | Store external IDs and staff-verified status |
| 2. Validated file workflow | Import/export the approved template with row-level validation and reconciliation |
| 3. Authorized submission | Submit via an authority-approved interface with acknowledgements and audit |
| 4. Operational synchronization | Scheduled changes, retry/idempotency, rejected-row handling, monitoring and support ownership |

The present UUCMS “sync” overview does not establish stage 3 or 4. New-region marketing should not repeat that ambiguity.

### Privacy, security and records

Regional expansion increases the number of identity, category, financial and academic-record flows. Maintain data minimization, purpose-specific notices, tenant/department access, masked identifiers, evidence retention/deletion rules, export audits, secure temporary files and explicit college/processor responsibilities.

The notified DPDP Rules 2025 contain phased commencement provisions. A launch review must confirm applicable provisions, effective dates, amendments and any relevant exceptions; this repository study is not a legal opinion or a privacy-compliance certification. [1](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf)

---

## 8. Recommended pilot strategy and scope

### Default order and rationale

1. **Tamil Nadu:** a non-autonomous affiliated arts/science college with B.Com and BBA is a reasonable default first pilot. The inspected current Bharathiar B.Com curriculum provides a concrete test of mixed assessment and language/skill components without making a four-year pathway the first operational dependency. Select Bharathiar or Madras based on an actual partner, not on a generic statewide assumption.
2. **Andhra Pradesh:** choose one university and explicitly distinguish the 2023/2024 cohorts from the revised intake. Pilot the internship/credit and continuing-elective workflow, not just university names. Andhra, AKNU or Krishna are candidate research clusters; none is a confirmed customer.
3. **Kerala:** choose **one** of University of Kerala, Calicut, MG or Kannur according to partner readiness. Certify the applicable pathways and regulation versions before replicating to a second Kerala university.

A ready Kerala partner with authoritative documents and academic reviewers can be a better first pilot than an uncommitted TN lead. The deciding factor is **time to verified usefulness**, not geographic ordering alone.

### Start narrow

- One university cluster per region and a small number of affiliated pilot colleges.
- Two closely related programmes initially; B.Com/BBA offers reuse in concepts and operational workflows, but still needs separate programme mappings.
- Current-semester verified learning coverage first; expand the content catalogue in approved batches.
- Official records only for the regulations/course categories that have passed sign-off and parallel reconciliation.
- Add B.Sc practical-heavy programmes, BCA and PG as separately reviewed workstreams. BBA/BCA and professional programmes also need their applicable programme-specific approval requirements checked; engineering rules are not a substitute.
- Autonomous colleges receive institution-specific bindings and a separately scoped pilot. Do not assume their affiliation means identical rules.

### Three honest readiness levels

**Learning-ready:** neutral concepts/skills and verified selected course materials; coverage limits visible; official exam/award automation disabled where unapproved.

**College-workflow-ready:** approved roster/admissions/attendance/fees/document workflows and validated exports for that institution; clear distinction from the external authority's accepted record.

**Academic-record-ready:** approved scheme/curriculum versions, course-level policies, authoritative result pipeline, degree audit, institutional sign-off and export acceptance.

Public coverage should name the institution/programme/cohort and readiness level, not simply “Tamil Nadu supported”.

---

## 9. Implementation roadmap and planning estimates

These are **initial planning ranges, not measured delivery commitments or a cost quotation**. They assume two full-stack engineers, one QA engineer, a product/academic owner, access to a registrar/exam-cell reviewer in each pilot, and subject/native-language reviewers working in parallel. Scope is a small number of pilot institutions, approximately two programmes per cluster, not every university in three states.

| Phase | Indicative duration | Main outputs and gate |
|---|---|---|
| 0. Partner and regulation discovery | 2–3 weeks | Signed-off cohort/programme inventory, source register, sample admissions/results/attendance files, explicit exclusions and pilot success criteria |
| 1. Shared academic hardening | 5–7 weeks | Versioned bindings, no silent new-region fallback, course assessment profiles, canonical grade pipeline, safe attendance/degree-audit foundations, content alignment model |
| 2. First TN university pilot | 4–6 weeks | Approved packs/mappings for selected programmes, Tamil/English documents, validated institutional imports, current-semester content coverage and parallel result checks |
| 3. First AP university pilot | 4–6 weeks | Correct cohort generations, internship/CSP evidence and credits, continuing elective rules, Telugu review and approved regional file workflows |
| 4. First Kerala university pilot | 4–6 weeks | Approved FYUGP pathways/degree audit, course-level assessment, Malayalam review, CAP/reporting reconciliation |

**Sequential planning envelope: approximately 19–28 weeks**, with some research/content/QA overlap possible. Official API access, full-history migration, unresolved academic orders and broad content authoring can extend this substantially. A smaller learner-only release can be scoped earlier, but it must not be sold as official-record readiness.

Engineering work, academic verification, translation, content authoring and external integration authorization should be budgeted separately. A useful cost model is:

```text
Total expansion cost = shared engineering + pilot-specific configuration/testing
                     + course-mapping/review + gap authoring + native-language QA
                     + data migration/training + approved integration/support costs
```

Do not estimate the content workload from the number of states. Estimate it from **distinct university × programme × cohort curricula, courses/units needing mapping and genuinely new content**. Shared concepts reduce authoring but do not eliminate alignment/review.

### Migration safeguards

1. Export/back up existing bindings and record counts; identify the real canonical collection and deployed rules before migration.
2. Give current Karnataka cohorts explicit versions preserving their existing behaviour; do not globally replace BCU defaults first and discover regressions later.
3. Add new fields through a compatibility layer and dry-run mapping reports. Never derive a student's regulation from current state/university alone.
4. Run old/new calculations against approved historical samples; reconcile every discrepancy with the exam cell.
5. Freeze published outcomes; amendments/corrections require an auditable approved transition.
6. Enable modules per tenant/programme/cohort, with staged rollout and rollback of bindings/feature flags.
7. Retain genuine content IDs and learning progress. Add curriculum mappings instead of destructively renaming Karnataka content or papers.

---

## 10. Release acceptance tests

The following are proposed tests, **not tests executed during this research**.

1. **Legacy regression:** existing Karnataka fixtures produce unchanged approved outcomes after explicit legacy bindings are introduced.
2. **No accidental BCU:** an unconfigured TN/AP/Kerala cohort cannot publish official results, generate a definitive eligibility decision or export awards under BCU.
3. **Coexisting cohorts:** one college can run old/new UG and PG regulations without using the most recently assigned college pack for all students.
4. **Mixed marks:** 25/75, 20/55, 25/25, internal-only and external-only courses use their own totals; a real zero maximum remains zero. A 75-mark course is not normalized as a 100-mark paper accidentally.
5. **Component evidence:** a seminar, practical/viva or internship component remains separately visible, correctly weighted and assigned to the authorized evaluator.
6. **Attendance:** semester/course/date filters and pagination are correct; one failed course-attendance condition cannot be hidden by high overall attendance; missing records are unknown rather than 100%; approved condonation has evidence and scope.
7. **Registration:** category counts, prerequisites/exclusions, paired elective continuity, credit limits and capacity are enforced, including concurrent selections. A cross-department selection appears in the correct timetable, faculty roster, attendance and exam registration.
8. **Complete degree audit:** zero recorded backlogs does not allow graduation with missing courses/credits, minor/category requirements, internships or research. Old AP 160+20 logic cannot be applied to a revised cohort without approval.
9. **One result pipeline:** import → reviewed draft/authoritative source → publish → student transcript → promotion → NAD/ABC export reconciles to the same records and policy snapshot.
10. **Attempts and corrections:** supplementary, revaluation, absence and withheld outcomes retain history; a corrected result does not duplicate credits or erase the original attempt's provenance.
11. **Amendment safety:** a newly adopted regulation version changes only the intended cohort/scope and never silently changes previously published outcomes.
12. **Content isolation:** wrong-university PYQs and Karnataka-only syllabus mappings are not presented as aligned local content; unsupported coverage is explicit; AI context/cache follows the selected curriculum and language.
13. **Localization/documents:** Tamil, Telugu and Malayalam names and text render correctly in mobile, print and PDF; UI locale does not force an unauthorized exam medium.
14. **Authority reconciliation:** identifiers and imports preserve leading zeros, external reference/source and rejected-row explanations; “accepted” requires an actual authority acknowledgement or documented manual verification.
15. **Tenant/privacy/scale:** no cross-college exposure, sensitive export access is audited, temporary files follow policy, and actual pilot-sized imports/rosters do not truncate at local query caps.

The repository already contains unit and rules tests that should be extended. One CI hygiene issue observed is that `functions/package.json`'s `test:unit` command ends with `|| true`; a regional release gate must use a test invocation that fails on failing tests, rather than accepting that shell exit status alone.

---

## 11. Commercial and research caveats

- The recommended rollout order is based on implementation complexity and available evidence, not verified customer demand, procurement timelines or willingness to pay.
- Do not use TNGASA's government-college count or CAP's seat inventory as a revenue forecast. A serviceable-market analysis requires unique institutions, programme fit, autonomy/management, existing systems, buying authority and realistic sales access.
- AISHE's official report page now lists 2023–24 as well as 2022–23. Use the appropriate current tables and institutional categories if a separate market-sizing study is commissioned; no statewide TAM is asserted here. [Official AISHE final-report index](https://aishe.gov.in/aishe-final-report/)
- Obtain the latest adopted TN examination regulations and all applicable skill-course amendments for the actual pilot, even where a current syllabus was retrieved.
- Obtain the final AP 2025–26/2026 intake adoption documents and chosen pathway. Direct APSCHE framework retrieval failed; the Krishna file's date inconsistency and recommendation wording must be resolved with the institution.
- Check later Kerala amendments, university adoption of internship guidance, programme-specific rules and autonomous exceptions before activation.
- No official UMIS/OAMDC/CAP/Jnanabhumi/e-Grantz live API entitlement was established. No API credentials, integration agreement or sandbox acceptance was requested or tested.
- No production Firestore inventory, deployed rules, production migration bridge, real student records or current customer contracts were inspected.

### Evidence register

The register below records the principal sources and what was actually established. Source date, effective intake and retrieval date are different concepts.

| Source | Scope / verification status |
|---|---|
| [Bharathiar official commerce catalogue](https://b-u.ac.in/node/1133) and [2026–27 B.Com DOCX](https://syllabus.b-u.ac.in/syl_college/2026_27/bcom_2026_27.docx) | Catalogue read; programme/assessment table and initial course material read from DOCX. Explicit 2026–27 admitted cohort, affiliated colleges. |
| [Madras affiliated UG common handbook](https://www.unom.ac.in/webportal/uploads/academics/regulations/ug-common-regulations.pdf) | Relevant examination/attendance/grading sections read. Effective intake year unresolved; comparison, not a 2026 certification. |
| [Annamalai affiliated UG 2023–24 regulations](https://mail.annamalaiuniversity.ac.in/affcl/download/syllabus_ug_2023-24/UG_Regulations_23-24.pdf) | Relevant structure, assessment, attendance and classification sections read; explicit intake scope. Later amendments not exhaustively checked. |
| [Annamalai programme/amendment index](https://annamalaiuniversity.ac.in/affcl/affcl_ug_programmes_23-24.php) | Official indexed titles; full page retrieval unsuccessful. Used only to flag cohort-specific amendments. |
| [Alagappa B.Com 2023–24](https://www.alagappauniversity.ac.in/links/docs/aff-23-24/UG_Core/B.Com.pdf) | Relevant programme structure and assessment table read. Not extrapolated to all TN universities. |
| [TNGASA](https://www.tngasa.in/) | Official 2026 indexed portal statement; government-college scope. No admissions deadlines relied upon. |
| [UMIS](https://umis.tn.gov.in/) | Homepage read; identifiers/reporting ecosystem, not API availability. |
| [APSCHE 2023–24 guidelines, government-college copy](https://gdcvidavaluru.ac.in/admin/uploads/news/7577Guidelines%20for%204-Year%20UG%20Honours%20Program%20with%20Single%20Major.pdf) | Relevant structure, credit, internship and exit sections read. Original Andhra University PDF retrieval failed; working government-college copy used. |
| [Andhra University UG catalogue](https://www.andhrauniversity.edu.in/student-corner/ug_syllabus.html) | Official indexed references to revised 2025–26 frameworks; full retrieval unsuccessful. |
| [Krishna revised BBA General framework](https://kru.ac.in/wp-content/uploads/2025/12/BBA-General-syllabus-of-IIIIIIIVVVIVIIVIII-semesters-for-the-AY-2025-26-min.pdf) | BoS recommendations, curriculum table and assessment recommendations read; explicit 2025–26 scope. Conflicting meeting-date text and final adoption require institutional confirmation. |
| [AKNU June 2026 II-semester timetable](https://api.aknu.edu.in/api/info/exam_timetable/file/view/69f42f1dca6cc959115c99f0) | Relevant timetable read; explicit 2023/2024 cohort label and course/ESE examples. Not a complete academic regulation. |
| [AP CAP/OAMDC](https://cap.apcfss.in/) | Current 2026 portal page read; inventory only. |
| [Jnanabhumi](https://jnanabhumi.ap.gov.in/) | Official indexed scholarship content; full retrieval unsuccessful. Current eligibility/configuration not certified. |
| [University of Kerala 2026–27 prospectus](https://admissions.keralauniversity.ac.in/fyugp2026/pdfs/FYUGP_Prospectus_2026.pdf) | Relevant scope, structure and credit/exit section read. Not the full prospectus or every programme regulation. |
| [University of Kerala 2024 regulation](https://www.keralauniversity.ac.in/downloads/REGULATION1717658802.pdf) | Selected structure/pathway sections read; later adoption/amendments must be tracked. |
| [Calicut amended 26 June 2024 regulation](https://admission.uoc.ac.in/downloads/10062-2024-Admn.pdf) and [Physics syllabus](https://docs.uoc.ac.in/website/syllabus/2024-08-29%2010:46:39_syl2006.pdf) | Order/scope and relevant curriculum/assessment sections read. Programme-specific examples, not a universal 30/70 rule. |
| [Kannur modified FYUGP regulation](https://www.kannuruniversity.ac.in/media/documents/FYUGP-2024-25_Modified_Rgulation.pdf) | Order and selected framework sections read; 27 December 2025 approval applying to 2024 intake. |
| [KSHEC March 2026 internship guidance](https://www.kshec.kerala.gov.in/images/pdf/Internship-under-FYUGP-in-Kerala-guidlines.pdf) | Relevant introduction, hours/credits, roles, supervision and evaluation sections read. University adoption not established for every institution. |
| [Calicut admissions](https://admission.uoc.ac.in/admission?pages=ug), [e-Grantz](https://egrantz.kerala.gov.in/), [Kerala scholarship directory](https://highereducation.kerala.gov.in/index.php/academic/scholarships) | Calicut current page read; e-Grantz official indexed description; scholarship directory used to distinguish authorities, not certify current awards. |
| [UGC final CCFUP, December 2022](https://www.ugc.gov.in/pdfnews/7193743_FYUGP.pdf) | Selected final-framework sections read. Guidance not substituted for adopted university rules; draft document excluded. |
| [NAD academia workflow](https://nad.digilocker.gov.in/academia) | Official indexed registration/CSV/template/publication workflow. No direct integration tested. |
| [MeitY final DPDP Rules 2025](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf) | Final Gazette commencement text retrieved; not a complete legal/compliance audit. |
| [AISHE final reports](https://aishe.gov.in/aishe-final-report/) | Official index read; no state-level numeric market estimate extracted. |

## Final recommendation

**Proceed with expansion, but fund it as a university/cohort academic-platform programme—not a translation project.**

The next concrete deliverable should be a pilot implementation plan for one named college/university cluster, with its programmes, cohorts, signed-off regulations, sample files and coverage limits. First harden policy resolution and the official-result path, then configure the selected academic schemes and map reusable content. Keep Karnataka stable and keep unverified official features disabled until institution-level acceptance.
