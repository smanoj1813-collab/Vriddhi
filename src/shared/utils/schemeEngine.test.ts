// src/shared/utils/schemeEngine.test.ts
// G1 scheme-pack engine tests. The parity block pins the BCU facade
// (bcuCompliance.ts) to its pre-G1 outputs so the hall-ticket, compliance
// dashboard and result-import surfaces cannot drift while everything moves
// onto packs.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateSchemeAttendanceMarks,
  calculateSchemeInternalMarks,
  checkSchemePassCriteria,
  getSchemeGradeFromMarks,
  calculateSchemeSGPA,
  isSchemeExamEligible,
  getSchemeAttendanceEligibilityMessage,
  normalizeSchemePack,
  getBuiltInSchemePack,
} from './schemeEngine';
import {
  calculateBCUAttendanceMarks,
  calculateBCUIAMarks,
  checkBCUPassCriteria,
  getGradeFromMarks,
  calculateSGPA,
  isEligibleForExam,
  getAttendanceEligibilityMessage,
} from './bcuCompliance';
import {
  BCU_SEP_2024,
  KUD_NEP_CBAE,
  GENERIC_NEP_2020,
} from '../types/schemePack';

describe('engine — attendance slabs', () => {
  it('walks BCU slabs from the top', () => {
    assert.equal(calculateSchemeAttendanceMarks(95, BCU_SEP_2024).marks, 5);
    assert.equal(calculateSchemeAttendanceMarks(91, BCU_SEP_2024).marks, 5);
    assert.equal(calculateSchemeAttendanceMarks(88, BCU_SEP_2024).marks, 4);
    assert.equal(calculateSchemeAttendanceMarks(83, BCU_SEP_2024).marks, 3);
    assert.equal(calculateSchemeAttendanceMarks(78, BCU_SEP_2024).marks, 2);
    assert.equal(calculateSchemeAttendanceMarks(76, BCU_SEP_2024).marks, 2);
  });

  it('blocks below the pack minimum only when the pack blocks', () => {
    const blocked = calculateSchemeAttendanceMarks(74.9, BCU_SEP_2024);
    assert.equal(blocked.isEligible, false);
    assert.equal(blocked.marks, 0);
    const lenient = {
      ...BCU_SEP_2024,
      attendance: { ...BCU_SEP_2024.attendance, blocksExamEligibility: false },
    };
    assert.equal(calculateSchemeAttendanceMarks(50, lenient).isEligible, true);
    assert.equal(isSchemeExamEligible(50, lenient), true);
    assert.equal(isSchemeExamEligible(74.9, BCU_SEP_2024), false);
  });

  it('respects different slab tables across packs', () => {
    // KUD: 86+ → 3 marks; BCU: 86+ → 4 marks
    assert.equal(calculateSchemeAttendanceMarks(88, KUD_NEP_CBAE).marks, 3);
    assert.equal(calculateSchemeAttendanceMarks(80, KUD_NEP_CBAE).marks, 2);
  });
});

describe('engine — internal assessment', () => {
  it('BCU: best 2 of 3 tests scaled to 10, attendance + assignment on top', () => {
    const r = calculateSchemeInternalMarks(
      { testMarks: [16, 18, 12], assignmentMarks: 5, attendancePercentage: 95 },
      BCU_SEP_2024,
    );
    assert.equal(r.testAverage, 8.5); // avg(18,16)=17 → 17/20*10
    assert.equal(r.attendanceMarks, 5);
    assert.equal(r.assignmentMarks, 5);
    assert.equal(r.totalIA, 18.5);
    assert.equal(r.totalPossible, 20);
  });

  it('KUD 4-credit course: IA out of 40 with 20-mark test weight', () => {
    const r = calculateSchemeInternalMarks(
      { testMarks: [32, 36, 30], assignmentMarks: 15, attendancePercentage: 90 },
      KUD_NEP_CBAE,
    );
    // avg(36,32)=34 → 34/40*20 = 17
    assert.equal(r.testAverage, 17);
    assert.equal(r.attendanceMarks, 3); // 90% in KUD slabs => 3 marks (cap 5)
    assert.equal(r.assignmentMarks, 15);
    assert.equal(r.totalIA, 35);
    assert.equal(r.totalPossible, 40);
  });

  it('assignment marks are capped at the pack maximum', () => {
    const r = calculateSchemeInternalMarks(
      { testMarks: [20, 20], assignmentMarks: 99, attendancePercentage: 100 },
      BCU_SEP_2024,
    );
    assert.equal(r.assignmentMarks, 5);
  });
});

describe('engine — pass criteria', () => {
  it('BCU 80+20: 35% SEE + 40% aggregate, both required', () => {
    const pass = checkSchemePassCriteria({ semesterEndMarks: 40, internalMarks: 15 }, BCU_SEP_2024);
    assert.equal(pass.isPass, true); // 50% SEE, 55 agg
    const failSee = checkSchemePassCriteria({ semesterEndMarks: 27, internalMarks: 20 }, BCU_SEP_2024);
    assert.equal(failSee.isPassInSemesterEnd, false); // 33.75% < 35
    assert.equal(failSee.isPassInAggregate, true); // 47% agg
    assert.equal(failSee.isPass, false);
    const failAgg = checkSchemePassCriteria({ semesterEndMarks: 30, internalMarks: 8 }, BCU_SEP_2024);
    assert.equal(failAgg.isPass, false); // 37.5% SEE ok, 38 agg < 40
  });

  it('KUD 60+40 defaults change the denominators', () => {
    const r = checkSchemePassCriteria({ semesterEndMarks: 24, internalMarks: 20 }, KUD_NEP_CBAE);
    assert.equal(r.maxTotal, 100);
    assert.equal(r.semesterEndPercentage, 40);
    assert.equal(r.isPass, true);
  });

  it('per-course overrides handle 50-mark sub-3-credit courses', () => {
    const r = checkSchemePassCriteria(
      { semesterEndMarks: 15, internalMarks: 10, maxSemesterEndMarks: 30, maxInternalMarks: 20 },
      KUD_NEP_CBAE,
    );
    assert.equal(r.maxTotal, 50);
    assert.equal(r.semesterEndPercentage, 50);
    assert.equal(r.isPass, true);
  });

  it('a pack without an SEE-pass requirement passes on aggregate alone', () => {
    const lenient = {
      ...KUD_NEP_CBAE,
      passCriteria: { ...KUD_NEP_CBAE.passCriteria, requireSemesterEndPass: false },
    };
    const r = checkSchemePassCriteria({ semesterEndMarks: 10, internalMarks: 40 }, lenient);
    assert.equal(r.isPassInSemesterEnd, false);
    assert.equal(r.isPass, true); // 50% aggregate
  });
});

describe('engine — grades & sgpa', () => {
  it('grade ladder probes descending', () => {
    assert.deepEqual(getSchemeGradeFromMarks(95, 100, BCU_SEP_2024).grade, 'O');
    assert.equal(getSchemeGradeFromMarks(72, 100, BCU_SEP_2024).gradePoint, 8);
    assert.equal(getSchemeGradeFromMarks(35, 100, BCU_SEP_2024).grade, 'P');
    assert.equal(getSchemeGradeFromMarks(34.9, 100, BCU_SEP_2024).grade, 'F');
    // scaled denominators
    assert.equal(getSchemeGradeFromMarks(45, 50, BCU_SEP_2024).grade, 'O');
  });

  it('sgpa is credit-weighted', () => {
    const sgpa = calculateSchemeSGPA([
      { credits: 4, gradePoint: 9 },
      { credits: 2, gradePoint: 6 },
    ]);
    assert.equal(sgpa, 8);
    assert.equal(calculateSchemeSGPA([]), 0);
  });
});

describe('engine — pack hygiene', () => {
  it('normalizeSchemePack fills gaps in a half-authored custom pack', () => {
    const partial = normalizeSchemePack({ code: 'CUSTOM', name: 'Custom U', gradeTable: [] });
    assert.equal(partial.semesterEndExam.defaultMaxMarks, 80);
    assert.equal(partial.gradeTable.length, BCU_SEP_2024.gradeTable.length);
    assert.ok(partial.attendance.marksSlabs.length > 0);
  });

  it('presets resolve by code', () => {
    assert.equal(getBuiltInSchemePack('KUD_NEP_CBAE')?.universityName, 'Karnatak University, Dharwad');
    assert.equal(getBuiltInSchemePack('NOPE'), null);
  });

  it('generic NEP computes 60+40 with 40% aggregate', () => {
    const r = checkSchemePassCriteria({ semesterEndMarks: 24, internalMarks: 16 }, GENERIC_NEP_2020);
    assert.equal(r.isPass, true); // 40% agg, 40% SEE
  });
});

describe('BCU facade parity (pre-G1 behaviour)', () => {
  it('attendance marks + colours', () => {
    const c75 = calculateBCUAttendanceMarks(74);
    assert.equal(c75.isEligible, false);
    assert.equal(c75.marks, 0);
    assert.match(c75.remarks, /below 75% \(BCU Ordinance\)/);
    assert.equal(calculateBCUAttendanceMarks(95).color, 'emerald');
    assert.equal(calculateBCUAttendanceMarks(88).color, 'teal');
    assert.equal(calculateBCUAttendanceMarks(83).color, 'blue');
    assert.equal(calculateBCUAttendanceMarks(78).color, 'amber');
  });

  it('IA calculation incl. breakdown wording', () => {
    const r = calculateBCUIAMarks({
      test1Marks: 16, test2Marks: 18, test3Marks: 12,
      assignmentMarks: 5, attendancePercentage: 95,
    });
    assert.equal(r.testAverage, 8.5);
    assert.equal(r.totalIA, 18.5);
    assert.match(r.breakdown, /Best 2 avg: 17\.0\/20/);
    assert.match(r.breakdown, /= 18\.5\/20/);
  });

  it('pass criteria incl. legacy remarks', () => {
    const ok = checkBCUPassCriteria({ universityMarks: 40, internalMarks: 15 });
    assert.equal(ok.isPass, true);
    assert.match(ok.remarks, /^Pass - 50\.0% in university, 55\.0% aggregate$/);
    const failSee = checkBCUPassCriteria({ universityMarks: 27, internalMarks: 20 });
    assert.equal(failSee.isPass, false);
    assert.match(failSee.remarks, /Need 35% in university exam \(28\/80\)/);
    const failBoth = checkBCUPassCriteria({ universityMarks: 20, internalMarks: 5 });
    assert.match(failBoth.remarks, /and 40% aggregate/);
  });

  it('grades, sgpa and eligibility messages', () => {
    assert.equal(getGradeFromMarks(85).grade, 'A+');
    assert.equal(getGradeFromMarks(38).grade, 'P');
    assert.equal(calculateSGPA([{ credits: 3, gradePoint: 10 }]), 10);
    assert.equal(isEligibleForExam(75), true);
    assert.equal(isEligibleForExam(74.99), false);
    assert.match(getAttendanceEligibilityMessage(70), /below 75% minimum/);
    assert.match(getAttendanceEligibilityMessage(78), /2 marks in IA/);
    assert.match(getAttendanceEligibilityMessage(90), /^Eligible - 90\.0%/);
  });
});
