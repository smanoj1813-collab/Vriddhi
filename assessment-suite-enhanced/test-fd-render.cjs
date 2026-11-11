/**
 * Headless render test for the Faculty Dashboard web app.
 * Runs the real <script> block of FacultyDashboard.html against a DOM stub with a
 * leaderboard-shaped payload, so every render path runs and the ranking can be
 * checked where the user actually sees it (Top Performers / All Students).
 *
 * Run: node test-fd-render.cjs
 */
const fs = require('fs'), vm = require('vm'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'FacultyDashboard.html'),'utf8');
const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function el(id){ return { id, innerHTML:'', textContent:'', value:'', disabled:false,
  style:{}, className:'', classList:{ add(){}, remove(){}, contains(){return false;} },
  appendChild(){}, querySelector(){return el('x');}, querySelectorAll(){return [];},
  setAttribute(){}, getAttribute(){return '';} }; }
const els = {};
const doc = {
  getElementById: id => (els[id] = els[id] || el(id)),
  querySelector: sel => (els[sel] = els[sel] || el(sel)),
  querySelectorAll: () => [],
  createElement: () => el('new'),
  addEventListener(){}
};
const PAYLOAD = {
  students: [
    { e:'a@x.edu', n:'AARAV NINE', r:'E01', b:'B.Tech CSE', ba:'2027', c:'Test College', bg:'CS',
      p:81, st:'BEST', in:'Excellent Performer', sc:810, mx:1000, ta:9, tc:10,
      as:{ 'Test 1':{s:90,m:100,p:90}, 'Test 2':{s:90,m:100,p:90}, 'Test 3':{s:90,m:100,p:90},
           'Test 4':{s:90,m:100,p:90}, 'Test 5':{s:90,m:100,p:90}, 'Test 6':{s:90,m:100,p:90},
           'Test 7':{s:90,m:100,p:90}, 'Test 8':{s:90,m:100,p:90}, 'Test 9':{s:90,m:100,p:90} } },
    { e:'b@x.edu', n:'BHARAT ONE', r:'E02', b:'B.Tech CSE', ba:'2027', c:'Test College', bg:'CS',
      p:10, st:'POOR', in:'Need Immediate Attention', sc:100, mx:1000, ta:1, tc:10,
      as:{ 'Test 1':{s:100,m:100,p:100} } },
    { e:'c@x.edu', n:'CHETAN NONE', r:'E03', b:'B.Sc Bio', ba:'2028', c:'Test College', bg:'Other',
      p:0, st:'INACTIVE', in:'No assessment data', sc:0, mx:0, ta:0, tc:10, as:{} }
  ],
  filters:{ branches:['B.Tech CSE','B.Sc Bio'], branchGroups:['CS','Other'], colleges:['Test College'],
            assessments:['Test 1','Test 2','Test 3','Test 4','Test 5','Test 6','Test 7','Test 8','Test 9','Test 10'],
            weeks:['CTD 1'] },
  summary:{ totalStudents:3, activeStudents:2, averageScore:'45.50', passRate:'50.0', placementReady:'50.0',
            atRiskCount:1, totalAssessments:9, avgParticipation:'55.6' },
  branchPerf:[], statusDist:{BEST:1,GOOD:0,AVERAGE:0,POOR:1,INACTIVE:1},
  assessments:[], assessmentAttendance:[], assessmentMeta:{}, collegeName:'Test College',
  topPerf:[], atRisk:[], debug:{ version:'t', errors:[], assessmentSheets:[] }, fromCache:false, ts:new Date().toISOString()
};
const names = PAYLOAD.filters.assessments;
PAYLOAD.assessmentAttendance = names.map(n => ({ name:n, maxScore:100, appeared:3, masterTotal:3, percentage:'100.0' }));
PAYLOAD.assessmentMeta = {}; names.forEach((n,i) => PAYLOAD.assessmentMeta[n] = { week: i < 5 ? 'CTD 1' : null, date:null });

let successCb = null;
const runner = {
  withSuccessHandler(cb){ successCb = cb; return runner; },
  withFailureHandler(){ return runner; },
  getFacultyDashboardData(){ return undefined; },
  clearFacultyCache(){ },
  generateFacultyReport(){ }
};
const sandbox = {
  console,
  document: doc,
  window: {},
  google: { script: { run: runner } },
  setTimeout: (f) => f && 0
};
sandbox.window = sandbox;
const ctx = vm.createContext(sandbox);
vm.runInContext(src, ctx, { filename:'FacultyDashboard.html' });

const step = (label, fn) => { try { fn(); console.log('  ✅ ' + label); } catch (e) { console.log('  ❌ ' + label + '\n     → ' + e.message); process.exitCode = 1; } };

console.log('\n=== render smoke (no filters) ===');
step('loadData() calls the backend', () => { vm.runInContext('loadData()', ctx); if (!successCb) throw new Error('no success handler'); });
step('success handler renders everything', () => successCb(PAYLOAD));
step('all 3 students in the table', () => {
  const h = els['#studentTable tbody'].innerHTML;
  if (!h.includes('BHARAT ONE')) throw new Error(h.slice(0,120));
});
step('0% student is not sorted to the top', () => {
  const h = els['#studentTable tbody'].innerHTML;
  const iAar = h.indexOf('AARAV NINE'), iBha = h.indexOf('BHARAT ONE'), iChe = h.indexOf('CHETAN NONE');
  if (!(iAar < iBha && iBha < iChe)) throw new Error('order A/B/C = ' + [iAar,iBha,iChe].join(','));
});
step('All Students shows Score 810 / 1000 and Overall 81.0%', () => {
  const h = els['#studentTable tbody'].innerHTML;
  if (!/810 \/ 1000/.test(h)) throw new Error('no 810 / 1000');
  if (!/81\.0%/.test(h)) throw new Error('no 81.0%');
  if (!/90\.0%/.test(h)) throw new Error('no appeared 90.0%');
});
step('Top Performers put AARAV first, BHARAT never above him', () => {
  const h = els['#topTable tbody'].innerHTML;
  if (!h.includes('AARAV NINE')) throw new Error('topper missing');
  if (h.indexOf('AARAV') > h.indexOf('BHARAT')) throw new Error(h.slice(0, 200));
});
step('8 uniform stat tiles render', () => {
  const h = els['statsGrid'].innerHTML;
  const n = (h.match(/class="stat-card/g) || []).length;
  if (n !== 8) throw new Error('found ' + n + ' tiles');
  if (!/Avg \(Appeared\)/.test(h)) throw new Error('missing Avg (Appeared) tile');
});
step('branch chart renders both branches', () => {
  const h = els['branchChart'].innerHTML;
  if (!h.includes('B.Tech CSE') || !h.includes('B.Sc Bio')) throw new Error(h.slice(0,150));
});
step('status donut renders', () => { if (!/conic-gradient/.test(els['statusChart'].innerHTML)) throw new Error('no donut'); });
step('attendance cards render', () => { const h = els['attendanceGrid'].innerHTML; if (!h.includes('Test 1')) throw new Error('none'); });

console.log('\n=== week filter (only the 5 week-1 tests) ===');
step('apply week filter', () => {
  els['filterWeek'].value = 'CTD 1';
  vm.runInContext('applyFilters(true)', ctx);
});
step('AARAV recalculated on 5 tests → 90.0%', () => {
  const h = els['#studentTable tbody'].innerHTML;
  if (!/450 \/ 500/.test(h)) throw new Error('expected 450 / 500, got ' + (h.match(/\d+ \/ \d+/g)||[]).join('|'));
});
step('BHARAT stays behind on 1 of 5 → 20.0%', () => {
  const h = els['#studentTable tbody'].innerHTML;
  if (!/20\.0%/.test(h)) throw new Error('no 20.0%');
  if (h.indexOf('AARAV') > h.indexOf('BHARAT')) throw new Error('B ranked first');
});

console.log('\n=== single-assessment filter ===');
step('select Test 1 only', () => {
  els['filterWeek'].value = '';
  vm.runInContext('getFilterValues = () => ({ week:"", branch:[], branchGroup:"", college:"", assessment:["Test 1"], status:"", search:"" })', ctx);
  vm.runInContext('applyFilters(true)', ctx);
});
step('Test 1 only → AARAV 90 / 100 = 90.0%', () => {
  const h = els['#studentTable tbody'].innerHTML;
  if (!/90 \/ 100/.test(h)) throw new Error((h.match(/\d+ \/ \d+/g)||[]).join('|'));
});
console.log('\n──────────────────────────────────────────────');
console.log(process.exitCode ? 'RESULT: render test FAILED' : 'RESULT: render test passed');
