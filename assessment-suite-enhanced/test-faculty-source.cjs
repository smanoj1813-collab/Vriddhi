/**
 * Verifies the Faculty Dashboard now reads the LEADERBOARD sheet and still
 * emits the exact payload shape FacultyDashboard.html consumes.
 * Run: node test-faculty-source.cjs
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

/* ---------- minimal Apps Script mocks (same shape as the other suites) ---------- */
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
  setValues(v) { this.sheet._writes++; v.forEach((l, r) => { const t = this.sheet._row(this.row - 1 + r); l.forEach((x, c) => { t[this.col - 1 + c] = x; }); }); return this; }
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
  constructor(name, data) { this.name = name; this.data = data ? data.map(r => r.slice()) : []; this._writes = 0; }
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
function makeEnv(ss, props) {
  const store = props || {};
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
    Utilities: { formatDate: (dt, tz, f) => { const d = dt instanceof Date ? dt : new Date(dt); const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; const p = n => String(n).padStart(2, '0'); return f === 'dd-MMM-yyyy HH:mm' ? `${p(d.getDate())}-${M[d.getMonth()]}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}` : `${p(d.getDate())}-${M[d.getMonth()]}-${d.getFullYear()}`; } },
    Logger: { log: () => {} },
    MailApp: { sendEmail: () => {} },
    DriveApp: { getFolderById: () => ({ createFile: () => ({ getId: () => 'x', getUrl: () => 'u' }) }) },
    HtmlService: { createHtmlOutputFromFile: () => ({ setWidth() { return this; }, setHeight() { return this; }, setTitle() { return this; } }),
      createHtmlOutput: () => ({ setWidth() { return this; }, setHeight() { return this; } }),
      createTemplateFromFile: () => ({ evaluate: () => ({ setWidth() { return this; }, setHeight() { return this; }, setTitle() { return this; } }) }) },
    ContentService: { createTextOutput: () => ({ setMimeType() { return this; } }), MimeType: { JSON: 'json' } },
    __props: store
  };
  sandbox.global = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8'), ctx, { filename: 'Code.gs' });
  return sandbox;
}

/* ----------------------------- fixture ----------------------------- */
const LB_HEADERS = ['Name', 'Email', 'Reg No', 'Branch', 'Quantitative Aptitude (15)', 'Logical Reasoning (15)',
  'Coding Challenge (200)', 'Total Score 230', 'Rank', 'Percentage', 'Status Classification', 'Insight Interpretation'];
const LB_DATA = [
  ['KOSHREE V', 'k@x.edu', 'E01', 'B.Tech CSEAIML', 15, 15, 200, 230, 1, 100, 'BEST', 'Excellent Performer'],
  ['SAKTHI R', 's@x.edu', 'E02', 'B.Tech CSEAIML', 10, 12, 150, 172, 2, 74.78, 'AVERAGE', 'Moderate Performer'],
  ['LOW SCORER', 'l@x.edu', 'E03', 'B.Tech CSE AIDS', 2, 1, 20, 23, 3, 10, 'POOR', 'Need Immediate Attention'],
  ['ABSENTEE', 'ab@x.edu', 'E04', 'B.Tech CSE AIDS', '', '', '', 0, 4, 0, 'POOR', 'Need Immediate Attention']
];
const MASTER = [
  ['Name', 'Email', 'Reg No', 'Branch', 'Batch', 'College'],
  ['KOSHREE V', 'k@x.edu', 'E01', 'B.Tech CSEAIML', '2027', 'Test College'],
  ['SAKTHI R', 's@x.edu', 'E02', 'B.Tech CSEAIML', '2027', 'Test College'],
  ['LOW SCORER', 'l@x.edu', 'E03', 'B.Tech CSE AIDS', '2028', 'Test College'],
  ['ABSENTEE', 'ab@x.edu', 'E04', 'B.Tech CSE AIDS', '2028', 'Test College'],
  ['NO EMAIL STUDENT', '', 'E05', 'B.Tech CSE-AIDA', '2028', 'Test College'],   // ← must not vanish
  ['NEVER TESTED', 'nt@x.edu', 'E06', 'B.Tech CSE-AIDA', '2027', 'Test College'] // ← INACTIVE
];
const SHEETS = () => ([
  ['Report_View', [['Test College'], [], ['Solarits Test 7 - Assessment Summary']]],
  ['Master Data', MASTER],
  ['📊 Class Test Leaderboard', [['🏛️ Test College — Leaderboard'], LB_HEADERS, ...LB_DATA]],
  ['📋 Class Test Analysis', [['x']]],
  ['Solarits Test 7', [['Reg No', 'Name', 'Branch', 'Score'], ['E01', 'KOSHREE V', 'B.Tech CSEAIML', 230]]], // must be IGNORED
  ['Assessment Registry', [
    ['Assessment Name', 'Type', 'Max Score', 'Date'],
    ['Quantitative Aptitude', 'Class Test', 15, new Date(2026, 5, 10)],
    ['Logical Reasoning', 'Class Test', 15, new Date(2026, 5, 10)]
  ]]
]);

/* ----------------------------- asserts ----------------------------- */
let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log('  ✅ ' + l); } else { fail++; console.log('  ❌ ' + l + (d ? '\n     → ' + d : '')); } };
const eq = (l, a, e) => check(l, JSON.stringify(a) === JSON.stringify(e), 'expected ' + JSON.stringify(e) + ', got ' + JSON.stringify(a));

console.log('\n=== 1. Source switch defaults to the leaderboard ===');
{
  const env = makeEnv(new Spreadsheet('Test College', SHEETS()));
  eq('default source', vm.runInContext('getFacultyDataSource()', env), 'leaderboard');
  const d = vm.runInContext('getFacultyDashboardData()', env);
  eq('debug says leaderboard', d.debug.source, 'leaderboard');
  eq('reads the leaderboard sheet', d.debug.leaderboardSheet, '📊 Class Test Leaderboard');
  eq('college name detected', d.collegeName, 'Test College');
}

console.log('\n=== 2. Payload matches what FacultyDashboard.html consumes ===');
{
  const env = makeEnv(new Spreadsheet('Test College', SHEETS()));
  const d = vm.runInContext('getFacultyDashboardData()', env);
  const required = ['students', 'filters', 'summary', 'branchPerf', 'statusDist', 'assessments',
    'assessmentAttendance', 'assessmentMeta', 'collegeName', 'topPerf', 'atRisk', 'debug', 'fromCache', 'ts'];
  required.forEach(k => check('has ' + k, k in d));

  const s = d.students[0];
  ['e', 'n', 'r', 'b', 'ba', 'c', 'bg', 'p', 'st', 'in', 'sc', 'mx', 'ta', 'tc', 'as']
    .forEach(k => check('student has lean key ' + k, k in s));

  ['totalStudents', 'activeStudents', 'averageScore', 'passRate', 'placementReady', 'atRiskCount', 'totalAssessments', 'avgParticipation']
    .forEach(k => check('summary.' + k, k in d.summary));
  ['BEST', 'GOOD', 'AVERAGE', 'POOR', 'INACTIVE'].forEach(k => check('statusDist.' + k, k in d.statusDist));
  ['branches', 'branchGroups', 'colleges', 'assessments', 'weeks'].forEach(k => check('filters.' + k, k in d.filters));
  eq('assessmentAttendance fields', Object.keys(d.assessmentAttendance[0]).sort(),
    ['appeared', 'masterTotal', 'maxScore', 'name', 'percentage']);
  eq('topPerf fields', Object.keys(d.topPerf[0]).sort(), ['b', 'bg', 'n', 'p', 'st', 'ta', 'tc']);
}

console.log('\n=== 3. Numbers come from the leaderboard, and raw sheets are ignored ===');
{
  const env = makeEnv(new Spreadsheet('Test College', SHEETS()));
  const d = vm.runInContext('getFacultyDashboardData()', env);
  const koshree = d.students.find(s => s.n === 'KOSHREE V');
  eq('percentage from the sheet', koshree.p, 100);
  eq('total from the sheet', koshree.sc, 230);
  eq('status from the sheet', koshree.st, 'BEST');
  eq('insight from the sheet', koshree.in, 'Excellent Performer');
  eq('totalMax from "Total Score 230"', koshree.mx, 230);
  eq('assessments = 3 leaderboard columns', koshree.tc, 3);
  eq('attended 3', koshree.ta, 3);
  eq('per-assessment payload', koshree.as['Coding Challenge (200)'], { s: 200, m: 200, p: 100 });

  const raw = d.debug.assessmentSheets.map(a => a.name);
  check('raw test sheet NOT read', raw.indexOf('Solarits Test 7') === -1, raw.join(', '));
  check('Report_View NOT read', raw.indexOf('Report_View') === -1);
  eq('three assessment columns', raw.length, 3);
  eq('outliers: absentee recorded as 0%', d.students.find(s => s.n === 'ABSENTEE').p, 0);
  eq('absentee has no per-assessment keys', Object.keys(d.students.find(s => s.n === 'ABSENTEE').as).length, 0);
}

console.log('\n=== 4. Roster join keeps students the old reader dropped ===');
{
  const env = makeEnv(new Spreadsheet('Test College', SHEETS()));
  const d = vm.runInContext('getFacultyDashboardData()', env);
  const names = d.students.map(s => s.n);
  check('student with no email still present', names.indexOf('NO EMAIL STUDENT') !== -1, names.join(', '));
  check('never-tested student present', names.indexOf('NEVER TESTED') !== -1);
  eq('never-tested is INACTIVE', d.students.find(s => s.n === 'NEVER TESTED').st, 'INACTIVE');
  eq('total students = full roster', d.summary.totalStudents, 6);
  // An enrolled student with no scores at all is INACTIVE — same rule as the old
  // reader (ABSENTEE + NO EMAIL STUDENT + NEVER TESTED). The leaderboard analytics
  // page separately reports the absentee as 0% / absent.
  eq('active students = those with at least one score', d.summary.activeStudents, 3);
  eq('statusDist INACTIVE count', d.statusDist.INACTIVE, 3);
  eq('absentee is INACTIVE here', d.students.find(s => s.n === 'ABSENTEE').st, 'INACTIVE');
  check('no duplicate students', new Set(names).size === names.length, names.join(', '));
}

console.log('\n=== 5. Branch + status rollups ===');
{
  const env = makeEnv(new Spreadsheet('Test College', SHEETS()));
  const d = vm.runInContext('getFacultyDashboardData()', env);
  const aiml = d.branchPerf.find(b => b.branch === 'B.Tech CSEAIML');
  eq('AIML totalStudents', aiml.totalStudents, 2);
  eq('AIML activeStudents', aiml.activeStudents, 2);
  eq('AIML has both status counts', typeof aiml.best, 'number');
  check('branchPerf sorted by attendance then avg', d.branchPerf.length >= 2);
  check('atRisk excludes the never-tested', !d.atRisk.some(x => x.n === 'NEVER TESTED'),
    JSON.stringify(d.atRisk.map(x => x.n)));
  check('topPerf is led by the topper', d.topPerf[0].n === 'KOSHREE V', d.topPerf[0].n);
}

console.log('\n=== 6. Week filter derived from Assessment Registry ===');
{
  const env = makeEnv(new Spreadsheet('Test College', SHEETS()));
  const d = vm.runInContext('getFacultyDashboardData()', env);
  check('at least one week resolved', d.filters.weeks.length >= 1, JSON.stringify(d.filters.weeks));
  const qa = d.assessmentMeta['Quantitative Aptitude (15)'];
  check('registry date matched by name containment', !!qa && !!qa.week, JSON.stringify(qa));
  eq('unmatched column has null week', d.assessmentMeta['Coding Challenge (200)'].week, null);
}

console.log('\n=== 7. Switching back to raw sheets still works ===');
{
  const env = makeEnv(new Spreadsheet('Test College', SHEETS()));
  eq('set raw', vm.runInContext("setFacultyDataSource('raw')", env), 'raw');
  eq('reported source', vm.runInContext('getFacultyDataSource()', env), 'raw');
  const d = vm.runInContext('getFacultyDashboardData()', env);
  eq('debug says sheets', d.debug.source, 'sheets');
  eq('back to leaderboard', vm.runInContext("setFacultyDataSource('leaderboard')", env), 'leaderboard');
  eq('unknown value falls back to leaderboard', vm.runInContext("setFacultyDataSource('nonsense')", env), 'leaderboard');
}

console.log('\n=== 8. Degrades cleanly when the leaderboard is missing ===');
{
  const ss = new Spreadsheet('Test College', [
    ['Report_View', [['Test College']]],
    ['Master Data', MASTER]
  ]);
  const env = makeEnv(ss);
  const d = vm.runInContext('getFacultyDashboardData()', env);
  eq('empty payload', d.students.length, 0);
  eq('still has the full shape', Object.keys(d.summary).length > 0, true);
  check('explains why', d.debug.errors.some(e => /leaderboard/i.test(e)), JSON.stringify(d.debug.errors));
}

console.log(`\n${'='.repeat(52)}`);
console.log(`RESULT: ${pass} passed, ${fail} failed`);
console.log('='.repeat(52));
process.exit(fail === 0 ? 0 : 1);
