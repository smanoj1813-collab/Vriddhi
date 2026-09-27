# Synthetic practice data — VPM-101

All records are fictional. Dates, rates and capacities are classroom assumptions, not quotations or real college records. Copy each block into a separate sheet and preserve an unchanged raw tab. The fixtures below support different exercises; label which one a calculation uses.

## 1. Placement pilot work packages

Durations are working days. Dependencies are finish-to-start with no lag. Day zero is the start; ignore holidays for the basic exercise. Resource capacity is initially unconstrained, then apply the specialist conflict as an extension. Rates and effort are not inferred from duration.

```csv
id,deliverable,duration_days,predecessors,owner_role
A,Charter and access approval,2,,Coordinator
B,Booking workflow,4,A,Specialist
C,Test cases and staff guide,3,A,Specialist
D,Integrated test,2,B;C,Reviewer
E,Staff training,2,D,Coordinator
F,Pilot run,1,E,Operations lead
G,Corrections and acceptance,2,F,Reviewer
H,Handover and closure,1,G,Operations lead
```

**Checks:** eight unique work packages. Longest unconstrained path A–B–D–E–F–G–H = 14 days; the C path is 13 days. If the single specialist must do B and C sequentially and no other overlap change is possible, the finish becomes 17 days. Show the network and resource assumption rather than copying only the answer.

## 2. Cost reporting snapshot

This is a separate control example, not a cost estimate derived from the duration table.

```csv
measure,rupees
Approved baseline,35000
Planned value at cutoff,20000
Earned value at cutoff,15000
Actual cost at cutoff,18000
Current bottom-up estimate to complete,22000
```

**Checks:** EAC = 40,000; baseline overrun forecast = 5,000; CV = −3,000; SV = −5,000 in budgeted-work rupees; CPI ≈ 0.833. The reminder enhancement adds 18 effort-hours at a hypothetical ₹500/hour (₹9,000 before provider charges) only if it is not already included in the current ETC. State that assumption to avoid double counting.

## 3. Board fixture

Cut-off: 2026-09-28. Blank owner/date values are intentionally missing, not zero. Status names are conceptual and can be implemented in Jira or a spreadsheet.

```csv
id,title,status,owner_role,due_date,blocked
PILOT-1,Confirm acceptance criteria,Done,Coordinator,2026-09-20,no
PILOT-2,Test last-slot booking,Review,Reviewer,2026-09-25,yes
PILOT-3,Prepare staff guide,In progress,,2026-09-26,no
PILOT-4,Resolve access question,To do,IT reviewer,,yes
PILOT-5,Review cancellation flow,Review,Reviewer,2026-09-30,no
PILOT-6,Plan support rota,To do,Operations lead,2026-10-02,no
```

**Checks:** two active overdue records (2 and 3), one unassigned record (3), one undated record (4). A query for overdue records alone does not detect record 4. There are two blocked records, which need owners and next actions rather than being hidden from WIP.

## 4. Operations capacity and improvement

Demand is 180 requests in three hours; each request takes three minutes of desk time. Theoretical capacity is 20 requests per desk-hour. Three desks meet average theoretical demand with no buffer; discuss breaks, variability, peak arrivals and quality before committing a service target.

In a separate improvement trial, rework is 30/100 before and 18/90 after. Rates are 30% and 20%, a ten-percentage-point absolute reduction and approximately 33.3% relative reduction. Different case mix, staffing or measurement can explain some change; do not claim causation from arithmetic alone.

## 5. Extension protocol

Create scenarios by copying a fixture and changing one labelled assumption: a task duration, specialist availability, vendor rate, arrival pattern or acceptance condition. Keep original and changed results side by side in your working file. Record which decision changes and which does not. Do not modify the public baseline silently, and do not fabricate real approvals or business savings.
