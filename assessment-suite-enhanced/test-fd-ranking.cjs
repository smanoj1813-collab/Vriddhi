/**
 * Regression test for the reported ranking error:
 *
 *   "Student A sat 9 of 10 tests and scored 90%. Student B sat 1 of 10 and
 *    scored 100%. B was showing up on top."
 *
 * Rule that must hold everywhere:
 *   Overall % = score / (max of ALL tests in scope)      → absent counts as 0
 *   Avg (appeared) = score / (max of tests actually sat) → kept as its own column
 *   Ranking never uses a bare per-test average.
 *
 * Runs the real functions: the pure score math is extracted straight out of
 * FacultyDashboard.html (no copy-paste drift), and computeAnalytics() comes out
 * of Code.gs through the same vm harness the other suites use.
 *
 * Run: node test-fd-ranking.cjs
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

/* ══════════════════════════ 1. HTML score math ══════════════════════════ */

const html = fs.readFileSync(path.join(__dirname, 'FacultyDashboard.html'), 'utf8');
const scriptBlock = html.match(/<script>([\s\S]*?)<\/script>/)[1];

/** Pull a top-level `function name(...) { ... }` out of the HTML by brace matching. */
function extractFn(src, name) {
  const start = src.indexOf('function ' + name + '(');
  if (start === -1) throw new Error('function ' + name + ' not found in FacultyDashboard.html');
  let i = src.indexOf('{', start);
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error('unbalanced braces in ' + name);
}

const PURE = ['computeTotals', 'statusFromPercentage', 'rankCompare', 'recalcStudent', 'toStudent', 'studentMatchesFilters'];
const pureSrc = PURE.map(n => extractFn(scriptBlock, n)).join('\n\n');
const htmlMath = vm.createContext({});
vm.runInContext(pureSrc, htmlMath, { filename: 'FacultyDashboard.html#score-math' });
const call = (name, ...args) => vm.runInContext(name, htmlMath)(...args);

const computeTotals = (...a) => call('computeTotals', ...a);
const statusFromPercentage = (...a) => call('statusFromPercentage', ...a);
const rankCompare = (...a) => call('rankCompare', ...a);
const recalcStudent = (...a) => call('recalcStudent', ...a);

/* ══════════════════════════ 2. Code.gs harness ══════════════════════════ */

class Range {
  constructor(sheet, row, col, nr, nc) { this.sheet = sheet; this.row = row; this.col = col; this.numRows = nr || 1; this.numCols = nc || 1; }
  getValues() {
    const out = [];
    for (let r = 0; r < this.numRows; r++) {
      const line = [];
      for (let c = 0; c < this.numCols; c++) {
        const rr = this.sheet._row(this.row - 1 + r);
        line.push(rr[this.col - 1 + c] === undefined ? '' : rr[this.col - 1 + c]);
      }
      out.push(line);
    }
    return out;
  }
  getValue() { return this.getValues()[0][0]; }
  setValues(v) { v.forEach((l, r) => { const t = this.sheet._row(this.row - 1 + r); l.forEach((x, c) => { t[this.col - 1 + c] = x; }); }); return this; }
  setValue(v) { return this.setValues([[v]]); }
  setFontWeight() { return this; } setBackground() { return this; } setFontColor() { return this; }
  setFontFamily() { return this; } setVerticalAlignment() { return this; } setFontSize() { return this; }
  setHorizontalAlignment() { return this; } setHorizontalAlignments() { return this; } setWrap() { return this; }
  setNumberFormat() { return this; } setBorder() { return this; } setBackgrounds() { return this; }
  setFontColors() { return this; } setFontWeights() { return this; } merge() { return this; }
  clearContent() { return this; } setFontStyle() { return this; } setFontLine() { return this; }
  getRow() { return this.row; } getColumn() { return this.col; }
}
class Sheet {
  constructor(name, data) { this.name = name; this.data = data ? data.map(r => r.slice()) : []; }
  getName() { return this.name; }
  _row(i) { while (this.data.length <= i) this.data.push([]); return this.data[i]; }
  getLastRow() { let last = 0; for (let i = 0; i < this.data.length; i++) if (this.data[i].some(v => v !== '' && v != null)) last = i + 1; return last; }
  getLastColumn() { let last = 0; this.data.forEach(r => { for (let c = r.length - 1; c >= 0; c--) if (r[c] !== '' && r[c] != null) { last = Math.max(last, c + 1); break; } }); return last; }
  getMaxRows() { return Math.max(this.getLastRow(), 1); }
  getMaxColumns() { return Math.max(this.getLastColumn(), 1); }
  getRange(r, c, nr, nc) { return new Range(this, r, c, nr === undefined ? 1 : nr, nc === undefined ? 1 : nc); }
  getDataRange() { return this.getRange(1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1)); }
  appendRow(v) { this.data.push(v.slice()); return this; }
  getSheetId() { return 1; }
  setFrozenRows() { return this; } autoResizeColumn() { return this; }
}
class Spreadsheet {
  constructor(name, sheets) { this.name = name; this.id = 'id'; this.sheets = (sheets || []).map(d => new Sheet(d[0], d[1])); }
  getSheetByName(n) { return this.sheets.find(s => s.getName() === n) || null; }
  insertSheet(n) { const s = new Sheet(n, []); this.sheets.push(s); return s; }
  getName() { return this.name; } getId() { return this.id; } toast() {}
  getUrl() { return 'u'; } getOwner() { return { getEmail: () => 'o@x' }; }
  getSheets() { return this.sheets; } setActiveSheet() {} getActiveSheet() { return this.sheets[0]; }
}
function makeEnv(ss) {
  const store = {};
  const propsApi = {
    getProperty: k => (k in store ? store[k] : null),
    setProperty: (k, v) => { store[k] = String(v); },
    deleteProperty: k => { delete store[k]; },
    getProperties: () => Object.assign({}, store)
  };
  const cache = {};
  const sandbox = {
    console: { log: () => {}, warn: () => {}, error: () => {} },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ss,
      getUi: () => ({ alert: () => {}, prompt: () => ({ getSelectedButton: () => 'CANCEL', getResponseText: () => '' }),
        ButtonSet: { OK: 'OK', OK_CANCEL: 'OK_CANCEL' }, Button: { OK: 'OK' },
        createMenu: () => ({ addItem() { return this; }, addSeparator() { return this; }, addSubMenu() { return this; }, addToUi() {} }),
        showModalDialog: () => {} }),
      flush: () => {},
      newConditionalFormatRule: () => { const b = { setRanges() { return b; }, whenNumberGreaterThanOrEqualTo() { return b; }, whenNumberLessThan() { return b; }, setBackground() { return b; }, setFontColor() { return b; }, build: () => ({}) }; return b; },
      BorderStyle: { SOLID: 'SOLID' }
    },
    PropertiesService: { getScriptProperties: () => propsApi },
    CacheService: { getScriptCache: () => ({ get: k => cache[k] || null, put: (k, v) => { cache[k] = v; }, remove: k => { delete cache[k]; } }) },
    Session: { getScriptTimeZone: () => 'Asia/Kolkata', getActiveUser: () => ({ getEmail: () => 'o@x' }) },
    Utilities: { formatDate: () => '01-Jan-2026' },
    Logger: { log: () => {} },
    MailApp: { sendEmail: () => {} },
    DriveApp: { getFolderById: () => ({ createFile: () => ({ getId: () => 'x', getUrl: () => 'u' }) }) },
    HtmlService: { createHtmlOutputFromFile: () => ({ setWidth() { return this; }, setHeight() { return this; }, setTitle() { return this; } }),
      createHtmlOutput: () => ({ setWidth() { return this; }, setHeight() { return this; } }),
      createTemplateFromFile: () => ({ evaluate: () => ({ setWidth() { return this; }, setHeight() { return this; }, setTitle() { return this; } }) }) },
    ContentService: { createTextOutput: () => ({ setMimeType() { return this; } }), MimeType: { JSON: 'json' } }
  };
  sandbox.global = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
  return sandbox;
}

/* ══════════════════════════ 3. Fixture ══════════════════════════ */

const TESTS = {};
for (let i = 1; i <= 10; i++) TESTS['Test ' + i] = 100;         // ten tests, 100 marks each
const TESTS_WITH_CODING = Object.assign({}, TESTS, { 'Coding (200)': 200 });

/** Student record exactly the shape the payload/`toStudent` produce. */
function student(name, scores /* { 'Test n': score } */, maxMap) {
  const as = {};
  const maxOf = k => Number((maxMap || {})[k]) || 100;
  Object.keys(scores).forEach(k => {
    if (scores[k] === null || scores[k] === undefined) return;   // blank = absent, no record
    as[k] = { s: scores[k], m: maxOf(k), p: scores[k] };
  });
  return {
    email: name.toLowerCase().replace(/\s+/g, '.') + '@x.edu', name: name,
    regNo: name.slice(0, 3).toUpperCase(), branch: 'B.Tech CSE', batch: '2027',
    college: 'Test College', branchGroup: 'CS',
    overallPercentage: 0, rawStatus: 'INACTIVE', insight: '',
    totalScore: 0, totalMax: 0, testsAttended: 0, testsConducted: 0,
    assessments: as
  };
}

const NAMES = Object.keys(TESTS);

// A: sat 9 of 10, ninety in each → 810 / 1000
const A = student('AARAV NINE TESTS', Object.fromEntries(NAMES.slice(0, 9).map(n => [n, 90])));
// B: sat 1 of 10, hundred in it → 100 / 1000
const B = student('BHARAT ONE TEST', { 'Test 1': 100 });
// C: never sat anything
const C = student('CHETAN NEVER TESTED', {});

/* ══════════════════════════ 4. Asserts ══════════════════════════ */

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log('  ✅ ' + l); } else { fail++; console.log('  ❌ ' + l + (d ? '\n     → ' + d : '')); } };
const eq = (l, a, e) => check(l, JSON.stringify(a) === JSON.stringify(e), 'expected ' + JSON.stringify(e) + ', got ' + JSON.stringify(a));
const near = (l, a, e, tol) => check(l, Math.abs(a - e) <= (tol || 0.01), 'expected ≈' + e + ', got ' + a);

console.log('\n=== 1. The reported case: 1 big test must not beat 9 good ones ===');
{
  const ta = computeTotals(A, NAMES, TESTS);
  const tb = computeTotals(B, NAMES, TESTS);

  eq('A sat 9 tests', ta.testsAttended, 9);
  eq('B sat 1 test', tb.testsAttended, 1);
  eq('A score / conducted max', [ta.totalScore, ta.conductedMax], [810, 1000]);
  eq('B score / conducted max', [tb.totalScore, tb.conductedMax], [100, 1000]);

  near('A overall % = 81 (not 90)', ta.overallPercentage, 81);
  near('B overall % = 10 (not 100)', tb.overallPercentage, 10);
  check('A ranks above B', ta.overallPercentage > tb.overallPercentage, 'A=' + ta.overallPercentage + ' B=' + tb.overallPercentage);

  near('A "Avg (appeared)" still 90', ta.appearedPercentage, 90);
  near('B "Avg (appeared)" still 100', tb.appearedPercentage, 100);
}

console.log('\n=== 2. Ranking is driven by Overall %, ties by attendance ===');
{
  const ra = recalcStudent(A, NAMES, TESTS);
  const rb = recalcStudent(B, NAMES, TESTS);
  const sorted = [rb, ra].sort(rankCompare);
  eq('top performer is A (9 tests @90%)', sorted[0].name, 'AARAV NINE TESTS');
  eq('B is last', sorted[1].name, 'BHARAT ONE TEST');

  // Perfect score on one test must still lose to a solid full season.
  const perfectOne = recalcStudent(student('PERFECT ONE', { 'Test 1': 100 }), NAMES, TESTS);
  const solidNine = recalcStudent(student('SOLID NINE', Object.fromEntries(NAMES.slice(1, 10).map(n => [n, 91]))), NAMES, TESTS);
  check('one perfect test (10%) loses to nine at 91% (81.9%)',
    rankCompare(perfectOne, solidNine) > 0,
    perfectOne.overallPercentage + ' vs ' + solidNine.overallPercentage);

  // Equal overall % → more tests sat wins.
  const fewHigh = recalcStudent(student('FEW HIGH', { 'Test 1': 50 }), NAMES, TESTS);          // 50/1000 = 5%
  const manyLow = recalcStudent(student('MANY LOW', Object.fromEntries(NAMES.map(n => [n, 5]))), NAMES, TESTS); // 50/1000 = 5%
  check('same %, more tests sat wins', rankCompare(fewHigh, manyLow) > 0,
    fewHigh.overallPercentage + '%/' + fewHigh.testsAttended + ' sat vs ' + manyLow.overallPercentage + '%/' + manyLow.testsAttended + ' sat');
}

console.log('\n=== 3. Status comes from the same number ===');
{
  eq('81% → BEST', statusFromPercentage(81).rawStatus, 'BEST');
  eq('80.9% → GOOD', statusFromPercentage(80.9).rawStatus, 'GOOD');
  eq('61% → GOOD', statusFromPercentage(61).rawStatus, 'GOOD');
  eq('60.9% → AVERAGE', statusFromPercentage(60.9).rawStatus, 'AVERAGE');
  eq('31% → AVERAGE', statusFromPercentage(31).rawStatus, 'AVERAGE');
  eq('30.9% → POOR', statusFromPercentage(30.9).rawStatus, 'POOR');

  eq('A (81%) is BEST', recalcStudent(A, NAMES, TESTS).rawStatus, 'BEST');
  eq('B (10%) is POOR', recalcStudent(B, NAMES, TESTS).rawStatus, 'POOR');
}

console.log('\n=== 4. Absent handled identically whether blank or explicit 0 ===');
{
  const blanks = computeTotals(A, NAMES, TESTS);
  const zeros = Object.assign({}, A, {
    assessments: Object.assign({}, A.assessments, { 'Test 10': { s: 0, m: 100, p: 0 } })
  });
  const zeroTotals = computeTotals(zeros, NAMES, TESTS);
  near('a stored 0 gives the same Overall % as a blank', zeroTotals.overallPercentage, blanks.overallPercentage);
  eq('…but a stored 0 counts as an attempt', [zeroTotals.testsAttended, blanks.testsAttended], [10, 9]);
}

console.log('\n=== 5. Students who never sat a test are INACTIVE, never 0% active ===');
{
  const rc = recalcStudent(C, NAMES, TESTS);
  eq('status INACTIVE', rc.rawStatus, 'INACTIVE');
  eq('overall % 0', rc.overallPercentage, 0);
  eq('appeared % 0', rc.appearedPercentage, 0);
  eq('attended 0 of 10', [rc.testsAttended, rc.testsConducted], [0, 10]);
}

console.log('\n=== 6. Different max scores per test are honoured ===');
{
  const D = student('DIYA MIXED MAX', { 'Test 1': 100, 'Coding (200)': 200 }, TESTS_WITH_CODING);   // 300 / 1200
  const t = computeTotals(D, Object.keys(TESTS_WITH_CODING), TESTS_WITH_CODING);
  eq('conducted max sums every test', t.conductedMax, 1200);
  eq('attended max sums only the tests sat', t.totalMax, 300);
  near('overall % = 25', t.overallPercentage, 25);
  near('appeared % = 100', t.appearedPercentage, 100);
}

console.log('\n=== 7. No NaN when a max is unknown or scope is empty ===');
{
  const E = student('ESHA UNKNOWN', { 'Mystery Test': 40 });
  const t = computeTotals(E, ['Mystery Test'], {});                    // max unknown
  check('overall % is a finite number', Number.isFinite(t.overallPercentage), String(t.overallPercentage));
  check('appeared % is a finite number', Number.isFinite(t.appearedPercentage), String(t.appearedPercentage));

  const empty = computeTotals(A, [], TESTS);
  eq('empty scope → 0%', [empty.overallPercentage, empty.appearedPercentage, empty.testsConducted], [0, 0, 0]);
}

console.log('\n=== 8. Backend computeAnalytics() uses the same rule ===');
{
  const env = makeEnv(new Spreadsheet('Test College', [['Master Data', [['Name']]]]));
  const mkStudent = (name, pct, attended, conducted) => ({
    name, branch: 'B.Tech CSE', branchGroup: 'CS', college: 'Test College',
    overallPercentage: pct, rawStatus: pct >= 81 ? 'BEST' : (pct >= 31 ? 'AVERAGE' : 'POOR'),
    insight: '', totalScore: 0, totalMax: 1000, testsAttended: attended, testsConducted: conducted, assessments: {}
  });
  const students = [mkStudent('BHARAT ONE TEST', 10, 1, 10), mkStudent('AARAV NINE TESTS', 81, 9, 10)];
  const assessmentData = NAMES.map(n => ({ name: n, maxScore: 100, attendance: 2 }));

  const a = vm.runInContext('computeAnalytics', env)(students, assessmentData);
  eq('topPerformers[0] is the 9-test student', a.topPerformers[0].name, 'AARAV NINE TESTS');
  check('the 1-test 100%-scorer is not on top', a.topPerformers[0].name !== 'BHARAT ONE TEST');
  eq('1-test scorer is flagged at risk (10% < 50%)',
    a.atRiskStudents.map(s => s.name), ['BHARAT ONE TEST']);
}

console.log('\n=== 9. The dashboard no longer uses a bare per-test average ===');
{
  check('recalcForWeek (attended-only denominator) is gone',
    !/function\s+recalcForWeek\s*\(/.test(scriptBlock));
  check('a single computeTotals() owns the arithmetic',
    (scriptBlock.match(/function\s+computeTotals\s*\(/g) || []).length === 1);
  check('ranking goes through rankCompare()',
    /\.sort\(rankCompare\)/.test(scriptBlock));
  check('"Avg (appeared)" column exists in All Students',
    /sortTable\('ap'\)/.test(html) && /Avg \(appeared\)/i.test(html));
  check('stats card for Avg (Appeared) exists',
    /label: 'Avg \(Appeared\)'/.test(scriptBlock));
  check('no zero-vs-empty bug: sortData does not coerce 0 to a string',
    !/a\[key\] \|\| ''/.test(scriptBlock));
}

console.log('\n──────────────────────────────────────────────');
console.log('RESULT: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail === 0 ? 0 : 1);
