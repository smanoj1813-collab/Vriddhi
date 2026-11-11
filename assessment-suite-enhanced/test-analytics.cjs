/**
 * Tests for the leaderboard-driven analytics + drill-down layer (Section 10).
 * Uses the same Apps Script mocks as test-college.cjs, plus a leaderboard
 * fixture shaped exactly like writeLeaderboardFast output.
 * Run: node test-analytics.cjs
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

/* ----------------------------- mocks ----------------------------- */

class Range {
  constructor(sheet, row, col, numRows, numCols) {
    this.sheet = sheet; this.row = row; this.col = col;
    this.numRows = numRows || 1; this.numCols = numCols || 1;
  }
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
  setValues(v) {
    this.sheet._writes++;
    v.forEach((line, r) => {
      const t = this.sheet._row(this.row - 1 + r);
      line.forEach((val, c) => { t[this.col - 1 + c] = val; });
    });
    return this;
  }
  setValue(v) { return this.setValues([[v]]); }
  setFontWeight() { return this; } setBackground() { return this; }
  setFontColor() { return this; } setFontFamily() { return this; }
  setVerticalAlignment() { return this; } setFontSize() { return this; }
  setHorizontalAlignment() { return this; } setHorizontalAlignments() { return this; }
  setWrap() { return this; } setNumberFormat() { return this; }
  setBorder() { return this; } setBackgrounds() { return this; }
  setFontColors() { return this; } setFontWeights() { return this; }
  merge() { return this; } clearContent() { return this; }
  setFontStyle() { return this; } setFontLine() { return this; }
  getRow() { return this.row; } getColumn() { return this.col; }
}

class Sheet {
  constructor(name, data) {
    this.name = name;
    this.data = data ? data.map(r => r.slice()) : [];
    this._writes = 0;
  }
  getName() { return this.name; }
  _row(i) { while (this.data.length <= i) this.data.push([]); return this.data[i]; }
  getLastRow() {
    let last = 0;
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i].some(v => v !== '' && v !== null && v !== undefined)) last = i + 1;
    }
    return last;
  }
  getLastColumn() {
    let last = 0;
    this.data.forEach(row => {
      for (let c = row.length - 1; c >= 0; c--) {
        if (row[c] !== '' && row[c] !== null && row[c] !== undefined) { last = Math.max(last, c + 1); break; }
      }
    });
    return last;
  }
  getMaxRows() { return Math.max(this.getLastRow(), 1); }
  getMaxColumns() { return Math.max(this.getLastColumn(), 1); }
  getRange(r, c, nr, nc) { return new Range(this, r, c, nr === undefined ? 1 : nr, nc === undefined ? 1 : nc); }
  getDataRange() { return this.getRange(1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1)); }
  appendRow(v) { this.data.push(v.slice()); return this; }
  getSheetId() { return 1; }
  setFrozenRows() { return this; } autoResizeColumn() { return this; }
}

class Spreadsheet {
  constructor(name, sheets) {
    this.name = name; this.id = 'ss-id';
    this.sheets = (sheets || []).map(d => new Sheet(d[0], d[1]));
  }
  getSheetByName(n) { return this.sheets.find(s => s.getName() === n) || null; }
  insertSheet(n) { const s = new Sheet(n, []); this.sheets.push(s); return s; }
  getName() { return this.name; } getId() { return this.id; }
  toast() {} getUrl() { return 'https://x'; }
  getOwner() { return { getEmail: () => 'o@x.edu' }; }
  getSheets() { return this.sheets; }
  setActiveSheet() {} getActiveSheet() { return this.sheets[0]; }
  getActiveRange() { return null; }
}

function makeEnv(ss, props) {
  const store = props || {};
  const scriptProps = {
    getProperty: k => (k in store ? store[k] : null),
    setProperty: (k, v) => { store[k] = String(v); },
    deleteProperty: k => { delete store[k]; },
    getProperties: () => Object.assign({}, store)
  };
  const cacheStore = {};
  const sandbox = {
    console: { log: () => {}, warn: () => {}, error: () => {} },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ss,
      getUi: () => ({
        alert: () => {}, prompt: () => ({ getSelectedButton: () => 'CANCEL', getResponseText: () => '' }),
        ButtonSet: { OK: 'OK', OK_CANCEL: 'OK_CANCEL' }, Button: { OK: 'OK' },
        createMenu: () => ({ addItem() { return this; }, addSeparator() { return this; }, addSubMenu() { return this; }, addToUi() {} }),
        showModalDialog: () => {}
      }),
      flush: () => {},
      newConditionalFormatRule: () => {
        const b = { setRanges() { return b; }, whenNumberGreaterThanOrEqualTo() { return b; },
          whenNumberLessThan() { return b; }, setBackground() { return b; },
          setFontColor() { return b; }, build: () => ({}) };
        return b;
      },
      BorderStyle: { SOLID: 'SOLID' }
    },
    PropertiesService: { getScriptProperties: () => scriptProps },
    CacheService: { getScriptCache: () => ({ get: k => cacheStore[k] || null, put: (k, v) => { cacheStore[k] = v; }, remove: k => { delete cacheStore[k]; } }) },
    Session: { getScriptTimeZone: () => 'Asia/Kolkata', getActiveUser: () => ({ getEmail: () => 'o@x.edu' }) },
    Utilities: {
      formatDate: (d, tz, fmt) => {
        const dt = d instanceof Date ? d : new Date(d);
        const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const p = n => String(n).padStart(2, '0');
        if (fmt === 'dd-MMM-yyyy HH:mm') return `${p(dt.getDate())}-${M[dt.getMonth()]}-${dt.getFullYear()} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
        if (fmt === 'dd-MMM-yyyy') return `${p(dt.getDate())}-${M[dt.getMonth()]}-${dt.getFullYear()}`;
        return dt.toISOString();
      }
    },
    Logger: { log: () => {} },
    MailApp: { sendEmail: () => {} },
    DriveApp: { getFolderById: () => ({ createFile: () => ({ getId: () => 'x', getUrl: () => 'u' }) }) },
    HtmlService: {
      createHtmlOutputFromFile: () => ({ setWidth() { return this; }, setHeight() { return this; }, setTitle() { return this; } }),
      createHtmlOutput: () => ({ setWidth() { return this; }, setHeight() { return this; } }),
      createTemplateFromFile: () => ({ evaluate: () => ({ setWidth() { return this; }, setHeight() { return this; }, setTitle() { return this; } }) })
    },
    ContentService: { createTextOutput: () => ({ setMimeType() { return this; } }), MimeType: { JSON: 'json' } },
    __props: store
  };
  sandbox.global = sandbox;
  const code = fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8');
  const ctx = vm.createContext(sandbox);
  vm.runInContext(code, ctx, { filename: 'Code.gs' });
  return sandbox;
}

/* ----------------------------- fixture ----------------------------- */

// Mirrors writeLeaderboardFast: row1 banner, row2 headers, data from row 3.
const LB_HEADERS = [
  'Name', 'Email', 'Reg No', 'Branch',
  'Quantitative Aptitude (15)', 'Logical Reasoning (15)', 'Verbal (15)',
  'Technical MCQ (15)', 'Coding Challenge (200)',
  'Total Score 260', 'Rank', 'Percentage', 'Status Classification', 'Insight Interpretation'
];

const LB_ROWS = [
  ['KOSHREE V', 'k@x.edu', 'E0123021', 'B.Tech CSEAIML', 15, 15, 14, 15, 200, 259, 1, 99.62, 'BEST', 'Excellent Performer'],
  ['SAKTHI R', 's@x.edu', 'E0123009', 'B.Tech CSEAIML', 14, 15, 15, 14, 180, 238, 2, 91.54, 'BEST', 'Excellent Performer'],
  ['SEJONE THOMAS FRANK', 'se@x.edu', 'E0323019', 'B.Tech CSE AIDS', 10, 6, 14, 15, 200, 245, 3, 94.23, 'BEST', 'Excellent Performer'],
  ['SHARMILA S', 'sh@x.edu', 'E0323014', 'B.Tech CSE AIDS', 3, 13, 10, 12, 200, 238, 4, 91.54, 'BEST', 'Excellent Performer'],
  ['G. THARANYA', 'g@x.edu', 'E0123030', 'B.Tech CSEAIML', 2, 1, 0, 1, 20, 24, 5, 9.23, 'POOR', 'Need Immediate Attention'],
  ['DARSHAAN V', 'd@x.edu', 'E0233040', 'B.Tech CSE-AIDA', 8, 9, 10, 10, 128, 128, 6, 49.23, 'AVERAGE', 'Moderate Performer'],
  ['MOHAMMAD TAMEEM', 'm@x.edu', 'E0233008', 'B.Tech CSE-AIDA', '', '', '', '', '', 0, 7, 0, 'POOR', 'Need Immediate Attention'],
  ['PRIYANKA K', 'p@x.edu', 'E0423015', 'B.Tech CSE-AIDA', 1, 2, 3, 4, 9, 19, 8, 7.31, 'POOR', 'Need Immediate Attention']
];

function buildLeaderboard(typeSheetName) {
  const banner = ['🏛️ Test College — ' + typeSheetName];
  const data = [banner, LB_HEADERS.slice()];
  LB_ROWS.forEach(r => data.push(r.slice()));
  return data;
}

const SHEETS = () => [
  ['Report_View', [['Test College']]],
  ['Master Data', [
    ['Name', 'Email', 'Reg No', 'Branch', 'Batch'],
    ['KOSHREE V', 'k@x.edu', 'E0123021', 'B.Tech CSEAIML', '2027'],
    ['SEJONE THOMAS FRANK', 'se@x.edu', 'E0323019', 'B.Tech CSE AIDS', '2027'],
    ['G. THARANYA', 'g@x.edu', 'E0123030', 'B.Tech CSEAIML', '2028']
  ]],
  ['📊 Class Test Leaderboard', buildLeaderboard('Class Test Leaderboard')],
  ['📋 Class Test Analysis', []],
  ['Email Registry', [
    ['Assessment Name', 'Batch', 'Date', 'Report Link', 'Answer Key', 'Email', 'CC', 'Status', 'Date Sent', 'Remarks', 'College']
  ]]
];

/* ----------------------------- assertions ----------------------------- */

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  ✅ ' + label); }
  else { fail++; console.log('  ❌ ' + label + (detail ? '\n     → ' + detail : '')); }
}
function eq(label, actual, expected) {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  check(label, same, 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
}
function near(label, actual, expected, tol) {
  const ok = Math.abs(Number(actual) - expected) <= (tol === undefined ? 0.02 : tol);
  check(label, ok, 'expected ~' + expected + ', got ' + actual);
}

console.log('\n=== 1. Reads the leaderboard sheet, not raw assessment sheets ===');
{
  const ss = new Spreadsheet('Test College', SHEETS());
  const env = makeEnv(ss);
  const a = vm.runInContext('getLeaderboardAnalytics()', env);
  check('ok', a.ok, a.message);
  eq('source is leaderboard', a.source, 'leaderboard');
  eq('sheet name', a.sheetName, '📊 Class Test Leaderboard');
  eq('leaderboard type', a.leaderboardType, 'Class Test');
  eq('max total parsed from header', a.maxTotal, 260);
  eq('score columns found', a.assessments.map(x => x.header), [
    'Quantitative Aptitude (15)', 'Logical Reasoning (15)', 'Verbal (15)',
    'Technical MCQ (15)', 'Coding Challenge (200)'
  ]);
  check('metadata columns excluded from scores',
    !a.assessments.some(x => /rank|percentage|status|insight|total/i.test(x.header)));
}

console.log('\n=== 2. Appeared / absent are reported next to existing numbers ===');
{
  const ss = new Spreadsheet('Test College', SHEETS());
  const env = makeEnv(ss);
  const a = vm.runInContext('getLeaderboardAnalytics()', env);
  eq('total students', a.kpi.students, 8);
  eq('appeared', a.kpi.appeared, 7);
  eq('absent', a.kpi.absent, 1);
  near('completion %', a.kpi.completionPct, 87.5);
  eq('existing number kept: avg over ALL students', a.kpi.avgPctAll, 55.34, 0.05);
  check('new number added: avg over appeared', a.kpi.avgPctAppeared > a.kpi.avgPctAll,
    'appeared avg should ignore the 0% absentee');
  eq('pass line unchanged', a.decisions.passLine, 50);
}

console.log('\n=== 3. Branch rollup carries both averages ===');
{
  const ss = new Spreadsheet('Test College', SHEETS());
  const env = makeEnv(ss);
  const a = vm.runInContext('getLeaderboardAnalytics()', env);
  const aiml = a.branches.find(b => b.branch === 'B.Tech CSEAIML');
  check('AIML branch present', !!aiml);
  eq('AIML students', aiml.students, 3);
  eq('AIML appeared', aiml.appeared, 3);
  eq('AIML absent', aiml.absent, 0);
  check('AIML has avgAll', typeof aiml.avgAll === 'number');
  check('AIML has avgAppeared', typeof aiml.avgAppeared === 'number');
  eq('AIML min uses appeared only', aiml.min, 24);

  const aida = a.branches.find(b => b.branch === 'B.Tech CSE-AIDA');
  eq('AIDA students', aida.students, 3);
  eq('AIDA absent counted', aida.absent, 1);
  eq('AIDA min excludes the absentee', aida.min, 19);
  check('AIDA avgAppeared > avgAll', aida.avgAppeared > aida.avgAll - 0.001);
  check('branches ranked by appeared average',
    a.branches[0].avgPctAppeared >= a.branches[a.branches.length - 1].avgPctAppeared);
}

console.log('\n=== 4. Assessment difficulty uses each column\'s own max ===');
{
  const ss = new Spreadsheet('Test College', SHEETS());
  const env = makeEnv(ss);
  const a = vm.runInContext('getLeaderboardAnalytics()', env);
  const coding = a.assessments.find(x => x.header === 'Coding Challenge (200)');
  const verbal = a.assessments.find(x => x.header === 'Verbal (15)');
  eq('coding max from header', coding.max, 200);
  eq('verbal max from header', verbal.max, 15);
  check('coding mean % differs from raw mean', coding.meanPct !== coding.mean);
  eq('absentees counted per assessment', coding.absent, 1);
  check('difficulty band assigned', ['Very hard', 'Hard', 'Balanced', 'Easy'].indexOf(coding.difficulty) !== -1);
}

console.log('\n=== 5. Bands, top and at-risk lists ===');
{
  const ss = new Spreadsheet('Test College', SHEETS());
  const env = makeEnv(ss);
  const a = vm.runInContext('getLeaderboardAnalytics()', env);
  eq('band count', a.bands.length, 5);
  eq('bands total = appeared', a.bands.reduce((s, b) => s + b.count, 0), a.kpi.appeared);
  eq('top list capped at 10', a.top.length <= 10, true);
  eq('top[0] is the highest scorer', a.top[0].name, 'KOSHREE V');
  eq('atRisk[0] is the lowest scorer', a.atRisk[0].name, 'PRIYANKA K');
  check('absentee is not in top list', !a.top.some(t => t.name === 'MOHAMMAD TAMEEM'));
}

console.log('\n=== 6. Branch aliases reconcile name variants ===');
{
  const ss = new Spreadsheet('Test College', SHEETS());
  const env = makeEnv(ss);
  const before = vm.runInContext('getLeaderboardAnalytics()', env);
  eq('before aliasing: 3 branch groups', before.branches.length, 3);
  eq('audit lists variants', vm.runInContext('getBranchNameAudit().variants.length', env), 3);

  vm.runInContext(`saveBranchAliasesFromDialog([
    {variant: 'B.Tech CSE AIDS', canonical: 'B.Tech CSE-AIDS'},
    {variant: 'B.Tech CSEAIML', canonical: 'B.Tech CSE-AIML'}
  ])`, env);

  eq('resolve maps variant', vm.runInContext("resolveBranchName('B.Tech CSE AIDS')", env), 'B.Tech CSE-AIDS');
  eq('resolve is punctuation-insensitive',
    vm.runInContext("resolveBranchName('b.tech  cse aids')", env), 'B.Tech CSE-AIDS');
  eq('unmapped passes through unchanged',
    vm.runInContext("resolveBranchName('B.Tech CSE-AIDA')", env), 'B.Tech CSE-AIDA');

  const after = vm.runInContext('getLeaderboardAnalytics()', env);
  eq('still 3 groups (no accidental merge)', after.branches.length, 3);
  check('AIDS students merged under canonical name',
    after.branches.find(b => b.branch === 'B.Tech CSE-AIDS').students === 2);
  eq('mapped variants flagged in audit', vm.runInContext('getBranchNameAudit().unmappedVariants.length', env), 1);
}

console.log('\n=== 7. Drill-down: student ===');
{
  const ss = new Spreadsheet('Test College', SHEETS());
  const env = makeEnv(ss);
  const d = vm.runInContext("getStudentDrilldown('E0123021')", env);
  check('ok', d.ok, d.message);
  eq('name', d.student.name, 'KOSHREE V');
  eq('reg no', d.student.regNo, 'E0123021');
  eq('batch joined from Master Data', d.student.batch, '2027');
  eq('branch', d.student.branch, 'B.Tech CSEAIML');
  eq('one row per assessment', d.assessments.length, 5);
  eq('rank in coding (200/200)', d.assessments.find(a => a.header === 'Coding Challenge (200)').position, 1);
  check('delta vs class mean present', typeof d.assessments[0].deltaPct === 'number');
  check('positive delta for a topper', d.assessments[0].deltaPct > 0);

  const absentCase = vm.runInContext("getStudentDrilldown('E0233008')", env);
  check('absentee found', absentCase.ok, absentCase.message);
  eq('absentee scores flagged absent', absentCase.assessments.every(a => a.absent), true);
  eq('absentee pct is null, not 0', absentCase.assessments[0].pct, null);
  eq('absentee appeared count', absentCase.student.appeared, 0);

  const missing = vm.runInContext("getStudentDrilldown('NOPE')", env);
  eq('unknown student reports cleanly', missing.ok, false);
  check('message names the sheet', /not found/i.test(missing.message), missing.message);
}

console.log('\n=== 8. Drill-down: branch ===');
{
  const ss = new Spreadsheet('Test College', SHEETS());
  const env = makeEnv(ss);
  const d = vm.runInContext("getBranchDrilldown('B.Tech CSEAIML')", env);
  check('ok', d.ok, d.message);
  eq('students listed', d.students.length, 3);
  eq('sorted by percentage desc', d.students[0].name, 'KOSHREE V');
  eq('summary students', d.summary.students, 3);
  eq('summary appeared', d.summary.appeared, 3);
  eq('per-assessment profile length', d.assessments.length, 5);
  check('profile has class comparison', typeof d.assessments[0].classMeanPct === 'number');
  // NOTE: shipped BRANCH_GROUPS are one college's programme names, so a label
  // like "B.Tech CSEAIML" correctly lands in "Other" until programme groups are
  // set for this college. Verify the wiring, then verify it after configuration.
  eq('unmapped programme falls back to Other', d.summary.group, 'Other');
  vm.runInContext(`saveBranchGroupsFromDialog(
    'B.Tech CSEAIML, B.Tech CSE-AIML, B.Tech CSE-AIDA, B.Tech CSE-AIDS',
    'B.Com'
  )`, env);
  eq('group resolved once programmes are configured',
    vm.runInContext("getBranchDrilldown('B.Tech CSEAIML').summary.group", env), 'CS');
  eq('analytics group rollup now populated',
    vm.runInContext("getLeaderboardAnalytics().groups.some(g => g.group === 'CS')", env), true);
  check('at-risk flagged on student rows', d.students.some(s => s.atRisk === true));

  const byRaw = vm.runInContext("getBranchDrilldown('B.Tech CSE AIDS')", env);
  eq('raw label also resolves', byRaw.students.length, 2);
  eq('unknown branch reports cleanly', vm.runInContext("getBranchDrilldown('Nope')", env).ok, false);
}

console.log('\n=== 9. Drill-down: assessment ===');
{
  const ss = new Spreadsheet('Test College', SHEETS());
  const env = makeEnv(ss);
  const d = vm.runInContext("getAssessmentDrilldown('Coding Challenge (200)')", env);
  check('ok', d.ok, d.message);
  eq('max', d.max, 200);
  eq('appeared', d.stats.appeared, 7);
  eq('absentees listed with names', d.absentees.length, 1);
  eq('absentee name', d.absentees[0].name, 'MOHAMMAD TAMEEM');
  eq('five buckets', d.buckets.length, 5);
  eq('bucket counts sum to appeared', d.buckets.reduce((s, b) => s + b.count, 0), 7);
  check('median computed', typeof d.stats.median === 'number');
  check('per-branch means sorted desc',
    d.byBranch[0].meanPct >= d.byBranch[d.byBranch.length - 1].meanPct);
  const bad = vm.runInContext("getAssessmentDrilldown('Nope (10)')", env);
  eq('unknown column reports cleanly', bad.ok, false);
  check('and lists what is available', Array.isArray(bad.available) && bad.available.length === 5);
}

console.log('\n=== 10. Deleted / missing leaderboard degrades gracefully ===');
{
  const ss = new Spreadsheet('Test College', [
    ['Report_View', [['Test College']]],
    ['Master Data', [['Name', 'Reg No'], ['A', 'R1']]]
  ]);
  const env = makeEnv(ss);
  const a = vm.runInContext('getLeaderboardAnalytics()', env);
  eq('not ok', a.ok, false);
  check('actionable message', /leaderboard/i.test(a.message), a.message);
  eq('student drilldown also fails cleanly', vm.runInContext("getStudentDrilldown('R1')", env).ok, false);
}

console.log('\n=== 11. Header without "(max)" still works ===');
{
  const headers = ['Name', 'Email', 'Reg No', 'Branch', 'Quiz', 'Total Score', 'Rank', 'Percentage', 'Status Classification', 'Insight Interpretation'];
  const rows = [
    ['A', 'a@x', 'R1', 'CSE', 8, 8, 1, 80, 'BEST', 'Excellent Performer'],
    ['B', 'b@x', 'R2', 'CSE', 4, 4, 2, 40, 'AVERAGE', 'Moderate Performer']
  ];
  const ss = new Spreadsheet('Test College', [
    ['Report_View', [['Test College']]],
    ['📊 Leaderboard', [['banner'], headers, ...rows]]
  ]);
  const env = makeEnv(ss);
  const a = vm.runInContext('getLeaderboardAnalytics()', env);
  check('ok', a.ok, a.message);
  eq('quiz column found', a.assessments.length, 1);
  eq('max inferred from data', a.assessments[0].max, 8);
  eq('maxInferred flagged', a.assessments[0].maxInferred, true);
  eq('maxTotal inferred', a.maxTotal, 8);
  eq('percent read from sheet column', a.kpi.avgPctAppeared, 60);
}

console.log(`\n${'='.repeat(52)}`);
console.log(`RESULT: ${pass} passed, ${fail} failed`);
console.log('='.repeat(52));
process.exit(fail === 0 ? 0 : 1);
