/**
 * Test harness for the generalized College layer in Code.gs.
 * Mocks the Apps Script globals, then exercises the real functions.
 * Run: node test-college.js
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
  setValues(values) {
    this.sheet._writes++;
    values.forEach((line, r) => {
      const target = this.sheet._row(this.row - 1 + r);
      line.forEach((v, c) => { target[this.col - 1 + c] = v; });
    });
    return this;
  }
  setValue(v) { return this.setValues([[v]]); }
  // formatting no-ops (chainable)
  setFontWeight() { return this; } setBackground() { return this; }
  setFontColor() { return this; } setFontFamily() { return this; }
  setVerticalAlignment() { return this; } setFontSize() { return this; }
  setHorizontalAlignment() { return this; } setWrap() { return this; }
  setNumberFormat() { return this; } setBorder() { return this; }
  merge() { return this; } clearContent() { return this; }
  setFontStyle() { return this; } setFontLine() { return this; }
  setBackgrounds() { return this; }
  getRow() { return this.row; } getColumn() { return this.col; }
}

class Sheet {
  constructor(name, data) {
    this.name = name;
    this.data = data ? data.map(r => r.slice()) : [];
    this._writes = 0;
    this.maxRows = Math.max(this.data.length, 1000);
  }
  getName() { return this.name; }
  _row(i) {
    while (this.data.length <= i) this.data.push([]);
    return this.data[i];
  }
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
  getRange(row, col, numRows, numCols) {
    return new Range(this, row, col, numRows === undefined ? 1 : numRows, numCols === undefined ? 1 : numCols);
  }
  getDataRange() { return this.getRange(1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1)); }
  appendRow(values) {
    this._writes++;
    this.data.push(values.slice());
    return this;
  }
  clear() { this.data = []; return this; }
  getSheetValues() { return this.data; }
  setFrozenRows() { return this; }
  autoResizeColumn() { return this; }
  autoResizeColumns() { return this; }
  setColumnWidth() { return this; }
}

class Spreadsheet {
  constructor(name, sheetDefs) {
    this.name = name;
    this.id = 'fake-ss-id';
    this.sheets = (sheetDefs || []).map(d => new Sheet(d[0], d[1]));
  }
  getSheetByName(n) { return this.sheets.find(s => s.getName() === n) || null; }
  insertSheet(n) { const s = new Sheet(n, []); this.sheets.push(s); return s; }
  getName() { return this.name; }
  getId() { return this.id; }
  toast() {}
  getOwner() { return { getEmail: () => 'owner@college.edu' }; }
  getUrl() { return 'https://docs.google.com/spreadsheets/d/fake'; }
  getSheets() { return this.sheets; }
  setActiveSheet() {}
  getActiveSheet() { return this.sheets[0]; }
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
  const cache = {
    get: k => (k in cacheStore ? cacheStore[k] : null),
    put: (k, v) => { cacheStore[k] = v; },
    remove: k => { delete cacheStore[k]; }
  };
  const logs = [];
  const sandbox = {
    console: {
      log: (...a) => logs.push(['log', a.join(' ')]),
      warn: (...a) => logs.push(['warn', a.join(' ')]),
      error: (...a) => logs.push(['error', a.join(' ')])
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ss,
      getUi: () => ({
        alert: () => {}, prompt: () => ({ getSelectedButton: () => 'CANCEL', getResponseText: () => '' }),
        ButtonSet: { OK: 'OK', OK_CANCEL: 'OK_CANCEL' }, Button: { OK: 'OK' },
        createMenu: () => ({ addItem() { return this; }, addSeparator() { return this; },
          addSubMenu() { return this; }, addToUi() {} }),
        showModalDialog: () => {}
      }),
      flush: () => {}
    },
    PropertiesService: { getScriptProperties: () => scriptProps, getDocumentProperties: () => scriptProps },
    CacheService: { getScriptCache: () => cache },
    Session: { getScriptTimeZone: () => 'Asia/Kolkata', getActiveUser: () => ({ getEmail: () => 'owner@college.edu' }) },
    Utilities: {
      formatDate: (d, tz, fmt) => {
        const dt = d instanceof Date ? d : new Date(d);
        const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const p2 = n => String(n).padStart(2, '0');
        if (fmt === 'dd-MMM-yyyy') return `${p2(dt.getDate())}-${M[dt.getMonth()]}-${dt.getFullYear()}`;
        if (fmt === 'dd-MMM-yyyy HH:mm') return `${p2(dt.getDate())}-${M[dt.getMonth()]}-${dt.getFullYear()} ${p2(dt.getHours())}:${p2(dt.getMinutes())}`;
        if (fmt === 'yyyy-MM-dd HH:mm:ss') return `${dt.getFullYear()}-${p2(dt.getMonth() + 1)}-${p2(dt.getDate())} ${p2(dt.getHours())}:${p2(dt.getMinutes())}:${p2(dt.getSeconds())}`;
        return dt.toISOString();
      },
      base64Decode: s => s, newBlob: () => ({})
    },
    Logger: { log: () => {} },
    MailApp: { sendEmail: (...args) => { sandbox.__mail.push(args); } },
    DriveApp: { getFolderById: () => ({ createFile() { return { getId: () => 'x', getUrl: () => 'u' }; } }),
      getFileById: () => ({ getBlob: () => ({}), getName: () => 'f' }),
      createFolder: () => ({ createFile() { return { getId: () => 'x', getUrl: () => 'u' }; }, getId: () => 'f' }) },
    HtmlService: {
      createHtmlOutputFromFile: () => ({ setWidth() { return this; }, setHeight() { return this; },
        setTitle() { return this; }, getContent: () => '' }),
      createHtmlOutput: () => ({ setWidth() { return this; }, setHeight() { return this; }, setTitle() { return this; } }),
      createTemplateFromFile: () => ({ evaluate: () => ({ setWidth() { return this; }, setHeight() { return this; }, setTitle() { return this; } }) })
    },
    ContentService: { createTextOutput: () => ({ setMimeType() { return this; } }), MimeType: { JSON: 'json' } },
    __mail: [],
    __logs: logs,
    __props: store
  };
  sandbox.global = sandbox;

  const code = fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8');
  const ctx = vm.createContext(sandbox);
  vm.runInContext(code, ctx, { filename: 'Code.gs' });
  return sandbox;
}

/* ----------------------------- assertions ----------------------------- */

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  ✅ ' + label); }
  else { fail++; console.log('  ❌ ' + label + (detail ? '\n     → ' + detail : '')); }
}
function eq(label, actual, expected) {
  check(label, JSON.stringify(actual) === JSON.stringify(expected),
    'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
}

const REPORTS = 'Report_View';
const REGISTRY = 'Email Registry';

const LEGACY_ROWS = [
  ['Assessment Name', 'Batch', 'Date', 'Report Link', 'Answer Key', 'Email', 'CC', 'Status', 'Date Sent', 'Remarks'],
  ['Weekly Test 1', '2027', '10-Jun-2026', 'https://r/1', 'https://k/1', 'a@x.com', 'cc@x.com', 'Sent', '10-Jun-2026 10:00', 'ok'],
  ['Weekly Test 2', '2027', '12-Jun-2026', 'https://r/2', '', 'b@x.com', '', 'Pending', '', ''],
  ['Weekly Test 1', '2027', '15-Jun-2026', 'https://r/3', '', '', '', 'Pending', '', '']
];

console.log('\n=== 1. Legacy 10-column registry gets a College column ===');
{
  const ss = new Spreadsheet('St. Joseph Engineering College', [
    [REPORTS, [['St. Joseph Engineering College', '', ''], [], ['Weekly Test 1 - Assessment Summary']]],
    [REGISTRY, LEGACY_ROWS]
  ]);
  const env = makeEnv(ss);
  const sheet = vm.runInContext('getEmailRegistrySheet()', env);
  const data = sheet.getDataRange().getValues();

  eq('header row has 11 columns', data[0].length === 11, true);
  eq('column K header is "College"', data[0][10], 'College');
  eq('existing Email column unchanged (index 5)', data[1][5], 'a@x.com');
  eq('existing Status column unchanged (index 7)', data[1][7], 'Sent');
  eq('older rows backfilled with detected college', data[1][10], 'St. Joseph Engineering College');
  check('all 3 data rows backfilled', data[1][10] && data[2][10] && data[3][10]);
  check('detected college is not the assessment name',
    vm.runInContext('getCollegeName()', env) !== 'Weekly Test 1');
}

console.log('\n=== 2. Detection order ===');
{
  // No Report_View, but a leaderboard header
  const ss = new Spreadsheet('random file', [
    ['📊 Leaderboard', [['🏛️ KGiSL Institute of Technology — Leaderboard']]]
  ]);
  const env = makeEnv(ss);
  eq('leaderboard header detected', vm.runInContext('getCollegeName()', env), 'KGiSL Institute of Technology');
  eq('source reported', vm.runInContext('detectCollegeName().source', env), '📊 Leaderboard header');
}
{
  // Saved setting wins over everything else
  const ss = new Spreadsheet('Some Copy', [
    [REPORTS, [['Old College Name']]]
  ]);
  const env = makeEnv(ss, { COLLEGE_NAME: 'PSG College of Technology' });
  eq('saved setting wins', vm.runInContext('getCollegeName()', env), 'PSG College of Technology');
}
{
  // Spreadsheet-name fallback, junk stripped
  const ss = new Spreadsheet('St. Joseph Engineering College - Assessment Suite 2026 (Copy)', []);
  const env = makeEnv(ss);
  const name = vm.runInContext('getCollegeName()', env);
  check('derived from file name, junk removed', /^St\.? ?Joseph Engineering College/.test(name), 'got: ' + name);
  check('year stripped', !/2026/.test(name), 'got: ' + name);
  check('copy marker stripped', !/copy/i.test(name), 'got: ' + name);
}
{
  // Nothing at all
  const ss = new Spreadsheet('Assessment Suite', []);
  const env = makeEnv(ss);
  eq('falls back to Unknown College', vm.runInContext('getCollegeName()', env), 'Unknown College');
  eq('isUnknown flag set', vm.runInContext('getCollegeInfo().isUnknown', env), true);
}

console.log('\n=== 3. Lookups are college-aware but never lose a row ===');
{
  const rows = LEGACY_ROWS.map(r => r.slice());
  const ss = new Spreadsheet('A College', [[REPORTS, [['A College']]], [REGISTRY, rows]]);
  const env = makeEnv(ss);
  vm.runInContext('getEmailRegistrySheet()', env); // triggers migration

  const rec = vm.runInContext("getEmailRegistryRecord('Weekly Test 1','2027','10-Jun-2026')", env);
  check('record found', !!rec, 'null');
  eq('collegeMatch true for same college', rec.collegeMatch, true);
  eq('college reported', rec.college, 'A College');
  eq('email field still at data[5]', rec.data[5], 'a@x.com');

  // Simulate a spreadsheet copied from another college: rows keep the old name.
  const sheet = vm.runInContext("SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Email Registry')", env);
  sheet.getRange(2, 11).setValue('Some Other College');
  const rec2 = vm.runInContext("getEmailRegistryRecord('Weekly Test 1','2027','10-Jun-2026')", env);
  check('mismatched row is still returned (graceful fallback)', !!rec2, 'null');
  eq('and flagged as a mismatch', rec2.collegeMatch, false);
  eq('mismatch shows the row\'s own college', rec2.college, 'Some Other College');

  eq('collegeKey normalizes case/punctuation',
    vm.runInContext("collegeNamesMatch('St. Joseph Engineering College','st joseph engineering college')", env), true);
  eq('different colleges do not match',
    vm.runInContext("collegeNamesMatch('A College','B College')", env), false);
}

console.log('\n=== 4. Dates: scoped, with unscoped fallback ===');
{
  const ss = new Spreadsheet('A College', [[REPORTS, [['A College']]], [REGISTRY, LEGACY_ROWS]]);
  const env = makeEnv(ss);
  eq('three dates for Weekly Test 1',
    vm.runInContext("getUniqueDatesForAssessment('Weekly Test 1','2027').sort()", env),
    ['10-Jun-2026', '15-Jun-2026']);
  // Force every row to another college → scoped result empty → fallback must still return dates
  const sheet = vm.runInContext("SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Email Registry')", env);
  for (let i = 2; i <= 4; i++) sheet.getRange(i, 11).setValue('Different College');
  vm.runInContext('clearCollegeCache()', env);
  const dates = vm.runInContext("getUniqueDatesForAssessment('Weekly Test 1','2027')", env);
  eq('fallback returns unscoped dates', dates.sort(), ['10-Jun-2026', '15-Jun-2026']);
}

console.log('\n=== 5. updateEmailRegistry writes College, preserves the first 10 columns ===');
{
  const ss = new Spreadsheet('A College', [[REPORTS, [['A College']]], [REGISTRY, LEGACY_ROWS]]);
  const env = makeEnv(ss);
  vm.runInContext("updateEmailRegistry('Weekly Test 2','2027','12-Jun-2026','https://r/2','','b@x.com','','Sent','')", env);

  const sheet = vm.runInContext("SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Email Registry')", env);
  const row = sheet.getRange(3, 1, 1, 11).getValues()[0];
  eq('status written at index 7', row[7], 'Sent');
  eq('college written at index 10', row[10], 'A College');
  check('date sent stamped', !!row[8], 'empty');

  // Brand-new row appends with the college
  vm.runInContext("updateEmailRegistry('Weekly Test 9','2028','01-Jul-2026','','','z@x.com','','Pending','')", env);
  const last = sheet.getRange(sheet.getLastRow(), 1, 1, 11).getValues()[0];
  eq('new row keeps 11 columns', last.length, 11);
  eq('new row college filled', last[10], 'A College');
  eq('new row email at index 5', last[5], 'z@x.com');
}

console.log('\n=== 6. Email subject/body use the real college, not the assessment name ===');
{
  const ss = new Spreadsheet('A College', [
    [REPORTS, [['A College']]],
    [REGISTRY, LEGACY_ROWS.map(r => r.slice())],
    ['Report generator', [
      ['Name', 'Email', 'Reg No', 'Batch', 'Branch', 'Score'],
      ['Asha', 'asha@x.com', 'R1', '2027', 'CSE', 80]
    ]]
  ]);
  const env = makeEnv(ss);
  vm.runInContext("sendAssessmentEmail({assessmentName:'Weekly Test 1',batch:'2027',date:'10-Jun-2026',forceResend:true})", env);
  const mail = env.__mail[0];
  check('email was sent', !!mail, 'no MailApp call');
  const subject = mail[1];
  eq('subject starts with the college', subject.split(' |')[0], 'A College');
  check('subject does not contain the assessment name as the college',
    subject.indexOf('Weekly Test 1 |') === -1, 'subject: ' + subject);
  check('body carries the college', String(mail[3].htmlBody).indexOf('A College') !== -1);
}

console.log('\n=== 7. getCollegeInfo / setup dialog contract ===');
{
  const ss = new Spreadsheet('B College', [[REPORTS, [['B College']]], [REGISTRY, LEGACY_ROWS]]);
  const env = makeEnv(ss);
  const info = vm.runInContext('getCollegeInfo()', env);
  eq('name', info.name, 'B College');
  check('has source', !!info.source);
  eq('registry detected', info.registry.exists, true);
  eq('registry row count', info.registry.rows, 3);
  check('college column reported', info.registry.hasCollegeColumn === true);

  const res = vm.runInContext("saveCollegeNameFromDialog('B College of Engineering', false)", env);
  eq('save returns the cleaned name', res.college, 'B College of Engineering');
  eq('detection now uses the saved value', vm.runInContext('getCollegeName()', env), 'B College of Engineering');
  eq('blank rows filled, differing rows untouched', res.updatedRows, 0);
  eq('rows relabelled when asked', vm.runInContext("saveCollegeNameFromDialog('B College of Engineering', true).updatedRows", env), 3);

  const reset = vm.runInContext('resetCollegeName()', env);
  eq('reset falls back to detection', reset.name, 'B College');
}

console.log('\n=== 8. Idempotency (migration runs once, no repeated writes) ===');
{
  const ss = new Spreadsheet('A College', [[REPORTS, [['A College']]], [REGISTRY, LEGACY_ROWS.map(r => r.slice())]]);
  const env = makeEnv(ss);
  vm.runInContext('getEmailRegistrySheet()', env);
  const sheet = vm.runInContext("SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Email Registry')", env);
  const writesAfterFirst = sheet._writes;
  for (let i = 0; i < 5; i++) vm.runInContext('getEmailRegistrySheet()', env);
  eq('no further writes on repeat calls', sheet._writes, writesAfterFirst);
  eq('still 11 columns', sheet.getLastColumn(), 11);
}

console.log('\n=== 9. Branch groups are per-college ===');
{
  const ss = new Spreadsheet('A College', [
    [REPORTS, [['A College']]],
    ['Master Data', [
      ['Name', 'Email', 'Reg No', 'Branch'],
      ['Asha', 'a@x.com', 'R1', 'B.E. CSE'],
      ['Ravi', 'r@x.com', 'R2', 'B.Com'],
      ['Meera', 'm@x.com', 'R3', 'B.Sc Nursing']
    ]]
  ]);
  const env = makeEnv(ss);

  eq('defaults classify CSE as CS', vm.runInContext("getBranchGroup('B.E. CSE')", env), 'CS');
  eq('unknown programme falls back to Other', vm.runInContext("getBranchGroup('B.Sc Nursing')", env), 'Other');
  eq('master branches detected', vm.runInContext('getMasterDataBranches()', env).sort(),
    ['B.Com', 'B.E. CSE', 'B.Sc Nursing']);

  vm.runInContext("saveBranchGroupsFromDialog('B.E. CSE, B.Com', 'B.Sc Nursing')", env);
  eq('override: CSE → CS', vm.runInContext("getBranchGroup('B.E. CSE')", env), 'CS');
  eq('override: B.Com → CS', vm.runInContext("getBranchGroup('B.Com')", env), 'CS');
  eq('override: Nursing → Non-CS', vm.runInContext("getBranchGroup('B.Sc Nursing')", env), 'Non-CS');
  eq('groups reported as custom', vm.runInContext('getBranchGroups().isCustom', env), true);

  // one-sided input must be rejected, not silently half-applied
  let threw = false;
  try { vm.runInContext("saveBranchGroupsFromDialog('B.E. CSE', '')", env); }
  catch (e) { threw = true; }
  eq('rejects a one-sided list', threw, true);

  // clearing both restores defaults
  vm.runInContext("saveBranchGroupsFromDialog('', '')", env);
  eq('reset to defaults', vm.runInContext('getBranchGroups().isCustom', env), false);
  eq('default restored for B.Com', vm.runInContext("getBranchGroup('B.Com')", env), 'Other');

  // corrupt stored JSON must not break dashboards
  env.__props['BRANCH_GROUPS_JSON'] = '{not json';
  eq('corrupt override ignored', vm.runInContext("getBranchGroup('B.E. CSE')", env), 'CS');
}

console.log(`\n${'='.repeat(52)}`);
console.log(`RESULT: ${pass} passed, ${fail} failed`);
console.log('='.repeat(52));
process.exit(fail === 0 ? 0 : 1);
