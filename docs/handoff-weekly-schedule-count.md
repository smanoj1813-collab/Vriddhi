# `weeklySchedules`: the "35 → 0" count — what it actually measures

Date: 2026-09-30 · Status: **not confirmed either way** (no credentials in this
sandbox). This is the read-only check to run before anything else, written down
so the next person does not have to re-derive it.

## What produced the two numbers

`src/modules/admin/api/scheduleApi.ts` → `fetchWeeklySchedules()`:

```ts
const q = query(collection(db, WEEKLY_COLLECTION), where('collegeId', '==', cid), limit(300))
const snap = await getDocs(q)
console.log('[ScheduleApi] fetchWeeklySchedules — docs found:', snap.size)   // ← the RAW number
const results = snap.docs.filter(s => s.isActive)                            // ← filtered AFTER
```

So:

* **"docs found" is the raw query result**, before the `isActive` filter. A raw
  `0` therefore means *the query matched nothing* — it is not the active count.
* The query is scoped by `collegeId == cid`, where `cid` is the argument the
  caller passed (`user.collegeId`, from the auth claim) or
  `localStorage.getItem('vriddhi_college_id')` when no argument is given.

## Ranked explanations for 35 → 0

1. **Tenant mismatch, nothing deleted.** The documents are stamped with a
   different `collegeId` than the caller's claim (legacy id, a college the
   profile was previously linked to, or a slot written while
   `vriddhi_college_id` held an older value — `createWeeklySchedule` takes the
   id from localStorage, the scheduler callables take it from the claim, so the
   two paths can stamp different values for the same building). Such documents
   are perfectly fine and completely invisible to a claim-scoped query. This is
   the single most likely cause and it is non-destructive.
2. **Legacy documents with no `collegeId` field at all.** Any slot written
   before the field was stamped never matches `where('collegeId','==',…)`.
   Same symptom, same non-destructive cause.
3. **Cancelled, not deleted.** `cancelWeeklySchedule` sets `isActive: false`.
   The grid hides inactive rows and the page count drops — but the raw
   `snap.size` would *not* drop, so this alone does not explain a raw 0. It does
   explain "the slots I had are gone" reports.
4. **A real delete.** Only two code paths remove `weeklySchedules` documents:
   `deleteWeeklySchedule()` (the per-row Delete button in AdminClassSchedule)
   and `functions/src/collegeCleanup.ts:39` (a super-admin collection wipe for
   one college). If (1)–(3) are ruled out, check whether either ran, for which
   college, and when.

## The checks to run (read-only)

From the Firebase console (or any admin SDK session) against the project that
serves `PZIg0HN9vG2kMo4Sb0YM`:

```
1. total docs in weeklySchedules
     count(collection(db, 'weeklySchedules'))

2. docs for the college in question
     count(query(collection(db,'weeklySchedules'), where('collegeId','==','PZIg0HN9vG2kMo4Sb0YM')))

3. every distinct stamp in the collection — this is the one that explains (1)
     getDocs(query(collection(db,'weeklySchedules'), limit(500)))
       → tally d.data().collegeId (count how many are undefined/empty)

4. how many of them are switched off
     tally d.data().isActive !== false

5. duplicates / orphans: docs whose collegeId is undefined are legacy rows,
   not deletions.
```

If (1) >> (2), the data is intact and the fix is a *re-stamp* migration
(`updateDoc` setting `collegeId` to the correct value for rows that belong to
that college), not a restore. Get that list reviewed before writing anything:
a wrong stamp moves another college's timetable into the first one's grid.

Also worth checking in the same pass: Firestore PITR / scheduled backups, which
settle the question definitively if enabled.

## What not to do

* Do not re-create the 35 slots from memory to "fix" the grid: if (1) is the
  cause you will end up with two timetables, one invisible and one duplicate,
  and `generateClassSessions` will materialise both.
* Do not run `collegeCleanup` as a diagnostic — it deletes.
* Do not treat the faculty app's list as proof: `fetchFacultyWeeklySchedule`
  resolves by `facultyId` (uid → profile fallback) and will happily show rows
  the admin grid cannot see, and vice versa.
