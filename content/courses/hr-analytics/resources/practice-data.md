# Synthetic practice data — VHR-101

Every record in this guide is fictional. IDs do not correspond to real employees or candidates. No name, contact detail, salary or sensitive demographic attribute is needed. Copy fixtures into separate raw tabs, preserve them and label every derivative as synthetic. The fixtures are independent examples, not linked tables describing a real organisation.

## 1. Mature application cohort

Grain: one application. Key: application_id. Both sources refer to the same fictional Support role and a fully observed teaching cohort. Stage flags use 1 for reached and 0 for not reached; they are nested in sequence. The fixture intentionally simplifies reasons and timing, so it cannot establish source quality or causality.

```csv
application_id,source,role,screen_passed,interviewed,offered,accepted,joined
A01,A,Support,1,1,1,1,1
A02,A,Support,1,1,1,1,1
A03,A,Support,1,1,1,1,1
A04,A,Support,1,1,1,1,1
A05,A,Support,1,1,1,1,0
A06,A,Support,1,1,1,0,0
A07,A,Support,1,1,0,0,0
A08,A,Support,1,1,0,0,0
A09,A,Support,1,0,0,0,0
A10,A,Support,0,0,0,0,0
A11,A,Support,0,0,0,0,0
A12,A,Support,0,0,0,0,0
B01,B,Support,1,1,1,1,1
B02,B,Support,1,1,1,1,1
B03,B,Support,1,1,1,1,1
B04,B,Support,1,1,1,1,0
B05,B,Support,1,1,1,0,0
B06,B,Support,1,1,1,0,0
B07,B,Support,1,1,0,0,0
B08,B,Support,1,1,0,0,0
B09,B,Support,1,0,0,0,0
B10,B,Support,0,0,0,0,0
B11,B,Support,0,0,0,0,0
B12,B,Support,0,0,0,0,0
```

**Checks:** 24 applications, 18 screen passes, 16 interviews, 12 offers, 9 acceptances, 7 joins. Source A: 12 applications, 6 offers, 5 acceptances, 4 joins. Source B: 12 applications, 6 offers, 4 acceptances, 3 joins. Overall acceptance 75%; application-to-join yield about 29.17%. Source acceptance rates are about 83.33% and 66.67%.

Allocated recruitment costs for this exercise: Source A ₹40,000 and Source B ₹36,000. With joined hires as denominator, cost per hire is ₹10,000 and ₹12,000; overall ₹76,000/7 ≈ ₹10,857.14. These are hypothetical allocated costs, not market benchmarks. The cohort is too small and simplified to justify a sourcing policy change on its own.

## 2. Recruitment event dates

This separate three-requisition fixture supports duration calculations. Dates use ISO format. Under the course convention, fill time starts at requisition approval and hire time starts at candidate application; both end at accepted offer. Use elapsed calendar days excluding the start day.

```csv
requisition_id,approved_date,application_date,accepted_date,status
REQ-01,2026-06-01,2026-06-11,2026-06-21,filled
REQ-02,2026-06-05,2026-06-15,2026-06-30,filled
REQ-03,2026-06-20,,,open
```

**Checks:** REQ-01 fill 20 days and hire 10; REQ-02 fill 25 and hire 15. As of 2026-06-30, REQ-03 has open age 10 days. Do not assign it a zero-day completed duration. Add an explicitly labelled invalid copy only for the cleaning exercise; do not replace the original dates.

## 3. Contracted workforce snapshot

Grain: one fictional active employee at a single snapshot. All thirty are included; no contractors or leave adjustments are modelled. The full-time standard is 40 contracted weekly hours. IDs are synthetic, but public portfolio charts should still practise aggregate sharing rather than individual listings.

```csv
employee_id,department,contracted_weekly_hours
SYN-001,Support,40
SYN-002,Support,40
SYN-003,Support,40
SYN-004,Support,40
SYN-005,Support,20
SYN-006,Support,40
SYN-007,Support,40
SYN-008,Support,40
SYN-009,Support,40
SYN-010,Support,20
SYN-011,Operations,40
SYN-012,Operations,40
SYN-013,Operations,40
SYN-014,Operations,40
SYN-015,Operations,20
SYN-016,Operations,40
SYN-017,Operations,40
SYN-018,Operations,40
SYN-019,Operations,40
SYN-020,Operations,20
SYN-021,Administration,40
SYN-022,Administration,40
SYN-023,Administration,40
SYN-024,Administration,40
SYN-025,Administration,20
SYN-026,Administration,40
SYN-027,Administration,40
SYN-028,Administration,40
SYN-029,Administration,40
SYN-030,Administration,20
```

**Checks:** headcount 30, contracted weekly hours 1,080, FTE 27. Each department has ten people and nine FTE. There are twenty-four 40-hour and six 20-hour contracts. This snapshot is not the population used in the following period examples.

## 4. Independent workforce and survey scenarios

| Scenario | Inputs | Expected check |
| --- | --- | --- |
| Period turnover | Opening 100; closing 120; exits 11 | Average 110; turnover 10% |
| Opening-cohort retention | 92 of the original 100 remain | 92%, not one minus the turnover rate |
| Absence | 80 included absent scheduled hours / 2,000 scheduled hours | 4%; inclusion of leave must be defined |
| Capacity demand | 9,600 cases / 800 cases per productive FTE | 12 FTE demand |
| Capacity supply | Current 10 FTE + 2 confirmed additions − 1 departure | 11 FTE supply; gap 1 |
| Survey | 80 invited, 48 replies, 30 favourable replies | Response 60%; favourable among respondents 62.5% |
| Ninety-day cohort | 40 fully observed joiners, 34 remain | 85% retention |

For a lower-demand capacity scenario use 8,800 cases (11 FTE demand); for a higher-demand scenario use 10,400 cases (13 FTE). Keep supply assumptions unchanged initially, then test a separate joining-delay scenario. Do not count accepted offers as guaranteed productive capacity.

## 5. Aggregate model and selection-audit examples

A classifier example has TP=4, FP=4, FN=6 and TN=86 for the positive class “exit”. Precision is 50%, recall 40% and accuracy 90%. An all-stay baseline also has 90% accuracy but zero exit recall. These are synthetic aggregate counts for model literacy; do not build an individual employee-risk deployment from them.

A separate selection example has Group A selected 20/50 (40%) and Group B 12/40 (30%). The B/A selection-rate ratio is 0.75. Groups are fictional labels, not inferred demographic categories. The ratio is a signal to investigate, not proof of cause or a legal finding. The four-fifths heuristic is not a universal fairness or Indian legal compliance test.

## 6. Safe extension and audit practice

Create a working copy with a deliberate exact duplicate, missing category, zero-denominator group or impossible date. Record the original and changed counts and show how QA detects the issue. Never fix a gap by inventing a sensitive attribute or unobserved outcome. For public reporting, practise suppressing groups below five and checking complementary inference; that teaching threshold does not guarantee anonymity or legal compliance.
