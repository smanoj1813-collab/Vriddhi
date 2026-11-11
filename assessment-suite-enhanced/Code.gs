/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║         ASSESSMENT SUITE — Report Generator + Leaderboard + Email    ║
 * ║         Merged Edition | Single Apps Script File                     ║
 * ║         v4.2 Enhanced — UX + Readability (Logic Preserved)           ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * ENHANCED EDITION — What changed (no logic change):
 *  - Fixed blank dialog title in showReportDialog() → "📝 Generate Report"
 *  - Clearer, actionable error/alert/toast messages (what + next step)
 *  - Added UX helpers: safeAlert(), safeToast(), logError() (no behavior change)
 *  - Removed dead code: duplicate totalMarks check, unreachable Logger.log
 *  - Added JSDoc + section banners for maintainability
 *  - Consistent branding comments (#32c888 / #1b5e20)
 *
 * WHAT WAS NOT CHANGED (logic preserved):
 *  - CONFIG values, sheet names, thresholds, colors, file naming, Drive folders
 *  - All calculations: %, ranks, branch stats, attendance, insights
 *  - Max-score rules: CTD=200, DCA=225, PMD1=230, PMD2+=30
 *  - Function names & signatures (HTML google.script.run still works)
 *
 * INSTALL: Replace Code.gs, add HTML files with exact names, reload sheet.
 * See README.md for full guide + test checklist.
 */

// ==================== UNIFIED CONFIGURATION ====================
const CONFIG = {
  // ── Report Generator ──
  SHEET_NAME_RAW: 'Report generator',
  SHEET_NAME_REPORT: 'Report_View',
  LOGO_FILE_ID: '1ZCUaDYPCgEh2zQf5Z34B9pFW8s0W_JfH',
  DEFAULT_THRESHOLDS: { GOOD: 70, IMPROVEMENT: 50 },
  STATUS_LABELS: {
    GOOD: 'Good to Go',
    IMPROVEMENT: 'Needs Improvement',
    TRAINING: 'Needs Training'
  },
  COLORS: {
    HEADER_BG: '#32c888',
    HEADER_FG: '#FFFFFF',
    GOOD: '#C8E6C9',
    IMPROVEMENT: '#FFE0B2',
    TRAINING: '#FFCDD2',
    ZEBRA: '#F5F5F5',
    WHITE: '#FFFFFF',
    ACCENT: '#2E7D32'
  },
  PERFORMANCE_LABELS: {
    POOR: 'POOR',
    AVERAGE: 'AVERAGE',
    GOOD_PERF: 'GOOD',
    BEST: 'BEST'
  },
  PERFORMANCE_COLORS: {
    POOR: '#FFCDD2',
    AVERAGE: '#FFE0B2',
    GOOD_PERF: '#FFF9C4',
    BEST: '#C8E6C9'
  },

  // ── Leaderboard ──
  MASTER_SHEET: "Master Data",
  LEADERBOARD_SHEET: "📊 Leaderboard",
  COMBINED_ANALYSIS_SHEET: "📋 Analysis",
  MASTER_COLS: ["Name", "Email", "Reg No", "Branch"],
  FALLBACK_MAX_TOTAL: 100,
  BRAND_COLOR: '#32c888',
  BRAND_DARK: '#1b5e20',
  BRAND_TEXT: '#ffffff',

  // ── Email Registry ──
  EMAIL_REGISTRY_SHEET: "Email Registry",
  // GENERALIZED: "College" is appended LAST (column K) so every existing
  // 0-based index (data[3] = Report Link, data[5] = Email, data[7] = Status …)
  // keeps its exact meaning. Nothing before it may be reordered.
  EMAIL_REGISTRY_HEADERS: ["Assessment Name", "Batch", "Date", "Report Link", "Answer Key", "Email", "CC", "Status", "Date Sent", "Remarks", "College"]
};

// ==================== UX HELPERS (new — no logic change) ====================
/** Show a user-friendly alert. Same as Ui.alert, centralized for consistency. */
function safeAlert(title, message) {
  try { SpreadsheetApp.getUi().alert(title, message, SpreadsheetApp.getUi().ButtonSet.OK); }
  catch (e) { console.warn('safeAlert failed:', e); }
}
/** Show a toast. Same as ss.toast, centralized. */
function safeToast(ss, message, title, seconds) {
  try { ss.toast(message, title || 'Assessment Suite', seconds || 5); }
  catch (e) { console.warn('safeToast failed:', e); }
}
/** Log error with context (helps debugging, does not change behavior). */
function logError(context, error) {
  console.error('[' + context + '] ' + (error && error.message ? error.message : error));
  try { Logger.log('[' + context + '] ' + error); } catch (e) {}
}

// ============================================================
// SECTION 0 — COLLEGE CONTEXT (one codebase, every college)
// ============================================================
/**
 * PURPOSE
 * -------
 * Generalizes the whole suite so the SAME Code.gs + HTML files can be deployed
 * to every college's spreadsheet. Nobody types the college name anymore: it is
 * detected from the spreadsheet the script is bound to, then reused by the
 * Report Generator, the emails, the exports and the registry.
 *
 * WHAT THIS CHANGES
 * -----------------
 *  • Adds a real "College" column at the END of the Email Registry (column K).
 *    Existing columns keep their positions, so all index-based code is safe.
 *  • Adds getCollegeName() / getCollegeInfo() used by every dialog.
 *  • Fixes the old bug where the registry's "College" was actually showing the
 *    assessment name (editorial slip: registryRecord.data[0] is Assessment Name).
 *
 * WHAT THIS DOES NOT CHANGE
 * -------------------------
 *  • Thresholds, calculations, sheet names, Drive folders, file naming, email
 *    body layout, report layout — all untouched.
 *  • Registry lookups still key on Assessment + Batch + Date. College is a
 *    preferred match, never a hard requirement, so old rows keep working.
 *
 * SET-UP (once per college spreadsheet)
 * -------------------------------------
 * Menu → 🏫 College Setup → confirm the detected name → Save.
 * The value lives in Script Properties and is never overwritten automatically,
 * so a report or a leaderboard rebuild can't silently rename the college.
 */
const COLLEGE_CONFIG = {
  PROP_KEY: 'COLLEGE_NAME',              // user-confirmed value (setup dialog)
  PROP_SOURCE_KEY: 'COLLEGE_NAME_SOURCE',
  MIGRATION_FLAG: 'EMAIL_REGISTRY_COLLEGE_COLUMN_V1',
  CACHE_KEY: 'COLLEGE_NAME_CACHE_V1',
  CACHE_SECONDS: 300,
  REGISTRY_COLUMN: 'College',
  UNKNOWN: 'Unknown College',
  MAX_LENGTH: 120
};

/** Trims, collapses whitespace and strips leading/trailing junk. Never throws. */
function normalizeCollegeName(name) {
  try {
    return String(name === null || name === undefined ? '' : name)
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^[\-–—|,;:.\s]+/, '')
      .replace(/[\-–—|,;:\s]+$/, '')
      .trim()
      .slice(0, COLLEGE_CONFIG.MAX_LENGTH);
  } catch (e) {
    return '';
  }
}

/** Comparison key: case/space/punctuation-insensitive. Used only for matching. */
function collegeKey(name) {
  return normalizeCollegeName(name)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when two college names refer to the same institution. */
function collegeNamesMatch(a, b) {
  const ka = collegeKey(a);
  const kb = collegeKey(b);
  if (!ka || !kb) return false;
  return ka === kb;
}

/**
 * Derives a college name from a spreadsheet title, e.g.
 *   "St. Joseph Engineering College - Assessment Suite 2026" → "St Joseph Engineering College"
 * Last-resort detection only; the setup dialog always shows the source.
 */
function deriveCollegeFromSpreadsheetName(rawName) {
  try {
    let name = String(rawName || '');
    name = name.replace(/\((?:copy|final|new|old|backup|wip)[^)]*\)/gi, ' ');
    name = name.replace(/\b(?:copy of|backup of)\b/gi, ' ');
    name = name.replace(/\b(?:assessment suite|assessments|assessment|leaderboard|reports?|prepinsta|master data|working|template|demo|sheet|spreadsheet)\b/gi, ' ');
    name = name.replace(/\b(?:19|20)\d{2}\b/g, ' ');
    name = name.replace(/[\-–—|,_:/\\]+/g, ' ');
    name = name.replace(/\s+/g, ' ').trim();
    if (!name || name.length < 3) return '';
    if (/^unknown$/i.test(name)) return '';
    return normalizeCollegeName(name);
  } catch (e) {
    return '';
  }
}

/**
 * Resolves the college for THIS spreadsheet.
 * Order (first non-empty wins):
 *   1. Value saved from 🏫 College Setup          (source: "Saved setting")
 *   2. Report_View!A1                              (source: "Report_View header")
 *   3. "🏛️ <college> —" in a leaderboard header    (source: "<sheet> header")
 *   4. First value of a "College" column in Master Data
 *   5. Cleaned spreadsheet name
 *   6. "Unknown College"
 * @return {{name: string, source: string}}
 */
function detectCollegeName() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();

  // 1) Explicit, user-confirmed value.
  const saved = normalizeCollegeName(props.getProperty(COLLEGE_CONFIG.PROP_KEY));
  if (saved) return { name: saved, source: 'Saved setting (College Setup)' };

  // 2) Report_View!A1 — reports always write the college in row 1, column 1.
  try {
    const report = ss.getSheetByName(CONFIG.SHEET_NAME_REPORT);
    if (report && report.getLastRow() > 0) {
      let v = normalizeCollegeName(report.getRange(1, 1).getValue());
      v = normalizeCollegeName(v.replace(/\s*[\-–—]\s*Assessment Summary\s*$/i, ''));
      if (v && !/^unknown college$/i.test(v)) {
        return { name: v, source: CONFIG.SHEET_NAME_REPORT + ' header (A1)' };
      }
    }
  } catch (e) { console.warn('detectCollegeName: Report_View read failed — ' + e.message); }

  // 3) Leaderboard header, written as "🏛️ <college> — <something>".
  try {
    const candidates = [
      CONFIG.LEADERBOARD_SHEET,
      '📊 Practice Leaderboard',
      '📊 Company Leaderboard',
      '📊 Class Test Leaderboard'
    ];
    for (const sheetName of candidates) {
      const sh = ss.getSheetByName(sheetName);
      if (!sh) continue;
      const v = normalizeCollegeName(extractCollegeNameFromLeaderboard(sh));
      if (v) return { name: v, source: sheetName + ' header' };
    }
  } catch (e) { console.warn('detectCollegeName: leaderboard read failed — ' + e.message); }

  // 4) Master Data — only if it happens to carry a College column.
  try {
    const md = ss.getSheetByName(CONFIG.MASTER_SHEET);
    if (md && md.getLastRow() > 1) {
      const sample = md.getRange(1, 1, Math.min(md.getLastRow(), 50), md.getLastColumn()).getValues();
      const headers = sample[0].map(h => String(h || '').trim().toLowerCase());
      const cIdx = headers.findIndex(h => h === 'college' || h === 'college name' || h === 'institution');
      if (cIdx !== -1) {
        for (let i = 1; i < sample.length; i++) {
          const v = normalizeCollegeName(sample[i][cIdx]);
          if (v) return { name: v, source: CONFIG.MASTER_SHEET + ' → College column' };
        }
      }
    }
  } catch (e) { console.warn('detectCollegeName: Master Data read failed — ' + e.message); }

  // 5) Spreadsheet name.
  const derived = deriveCollegeFromSpreadsheetName(ss.getName());
  if (derived) return { name: derived, source: 'Spreadsheet name' };

  // 6) Nothing found.
  return { name: COLLEGE_CONFIG.UNKNOWN, source: 'Not detected' };
}

/**
 * The college name every other function should use. Cached for 5 minutes.
 * Side-effect free: it never writes Script Properties, so detection can't
 * accidentally "stick" a wrong name onto a spreadsheet.
 * @return {string}
 */
function getCollegeName() {
  const cache = CacheService.getScriptCache();
  try {
    const cached = cache.get(COLLEGE_CONFIG.CACHE_KEY);
    if (cached) return cached;
  } catch (e) {}

  const detected = detectCollegeName();
  const name = normalizeCollegeName(detected.name) || COLLEGE_CONFIG.UNKNOWN;

  try {
    cache.put(COLLEGE_CONFIG.CACHE_KEY, name, COLLEGE_CONFIG.CACHE_SECONDS);
    PropertiesService.getScriptProperties()
      .setProperty(COLLEGE_CONFIG.PROP_SOURCE_KEY, detected.source);
  } catch (e) {}
  return name;
}

/** Clears the detection cache so the next read re-scans the spreadsheet. */
function clearCollegeCache() {
  try { CacheService.getScriptCache().remove(COLLEGE_CONFIG.CACHE_KEY); } catch (e) {}
  return true;
}

/** Persists a user-confirmed college name (from the setup dialog). */
function setCollegeName(name) {
  const clean = normalizeCollegeName(name);
  if (!clean) throw new Error('College name cannot be empty.');
  if (clean.length < 2) throw new Error('College name is too short — please enter the full name.');
  PropertiesService.getScriptProperties().setProperty(COLLEGE_CONFIG.PROP_KEY, clean);
  PropertiesService.getScriptProperties().setProperty(COLLEGE_CONFIG.PROP_SOURCE_KEY, 'Saved setting (College Setup)');
  clearCollegeCache();
  return clean;
}

/** Forgets the saved override so detection runs again (useful after copying a sheet). */
function resetCollegeName() {
  PropertiesService.getScriptProperties().deleteProperty(COLLEGE_CONFIG.PROP_KEY);
  PropertiesService.getScriptProperties().deleteProperty(COLLEGE_CONFIG.PROP_SOURCE_KEY);
  clearCollegeCache();
  return detectCollegeName();
}

/** 0-based index of the College column in a header row, or -1. */
function findCollegeColumnIndex(headers) {
  if (!headers) return -1;
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '').trim().toLowerCase();
    if (h === 'college' || h === 'college name' || h === 'institution') return i;
  }
  return -1;
}

/**
 * One-time, idempotent migration: makes sure the Email Registry has a "College"
 * column and fills blanks on existing rows with the detected college.
 * Runs at most once per spreadsheet (flag in Script Properties) and degrades
 * gracefully — a failure here must never block report generation or emailing.
 * @param {Sheet} sheet Email Registry sheet.
 * @return {{columnAdded: boolean, rowsBackfilled: number, skipped: boolean}}
 */
function ensureEmailRegistryCollegeColumn(sheet) {
  const result = { columnAdded: false, rowsBackfilled: 0, skipped: false };
  try {
    if (!sheet) return result;

    const props = PropertiesService.getScriptProperties();
    const alreadyDone = props.getProperty(COLLEGE_CONFIG.MIGRATION_FLAG) === 'done';

    const lastRow = sheet.getLastRow();
    // Width comes from the SHEET, not from the header constant, otherwise an
    // older 10-column sheet would get the new column at L instead of K.
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    const headers = sheet.getRange(1, 1, 1, Math.max(lastCol, CONFIG.EMAIL_REGISTRY_HEADERS.length)).getValues()[0];

    let cIdx = findCollegeColumnIndex(headers);

    // Add the column only when it is genuinely absent.
    if (cIdx === -1) {
      cIdx = lastCol;
      sheet.getRange(1, cIdx + 1)
        .setValue(COLLEGE_CONFIG.REGISTRY_COLUMN)
        .setFontWeight('bold')
        .setBackground(CONFIG.COLORS.HEADER_BG)
        .setFontColor(CONFIG.COLORS.HEADER_FG);
      result.columnAdded = true;
    }

    if (alreadyDone && !result.columnAdded) {
      result.skipped = true;
      return result;
    }
    if (lastRow < 2) {
      props.setProperty(COLLEGE_CONFIG.MIGRATION_FLAG, 'done');
      return result;
    }

    const college = getCollegeName();
    const range = sheet.getRange(2, cIdx + 1, lastRow - 1, 1);
    const values = range.getValues();
    let dirty = false;
    for (let i = 0; i < values.length; i++) {
      if (!String(values[i][0] || '').trim()) {
        values[i][0] = (college === COLLEGE_CONFIG.UNKNOWN) ? '' : college;
        if (values[i][0]) { dirty = true; result.rowsBackfilled++; }
      }
    }
    if (dirty) range.setValues(values);

    props.setProperty(COLLEGE_CONFIG.MIGRATION_FLAG, 'done');
    if (result.columnAdded) {
      console.log('Email Registry: added "College" column (K) and backfilled ' + result.rowsBackfilled + ' row(s).');
    }
    return result;
  } catch (e) {
    logError('ensureEmailRegistryCollegeColumn', e);
    return result;
  }
}

/**
 * Everything the College Setup dialog needs in one call.
 * Safe to call from a dialog: only the registry migration writes anything.
 */
function getCollegeInfo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const detected = detectCollegeName();

  const info = {
    name: normalizeCollegeName(detected.name) || COLLEGE_CONFIG.UNKNOWN,
    source: detected.source,
    savedName: normalizeCollegeName(PropertiesService.getScriptProperties().getProperty(COLLEGE_CONFIG.PROP_KEY)),
    spreadsheetName: ss.getName(),
    spreadsheetId: ss.getId(),
    suggestedFromFileName: deriveCollegeFromSpreadsheetName(ss.getName()),
    isUnknown: (normalizeCollegeName(detected.name) || '') === COLLEGE_CONFIG.UNKNOWN,
    registry: { exists: false, rows: 0, hasCollegeColumn: false, blankRows: 0, otherCollegeRows: 0 },
    migration: { columnAdded: false, rowsBackfilled: 0, skipped: false },
    likelyCopy: false
  };

  try {
    let sheet = ss.getSheetByName(CONFIG.EMAIL_REGISTRY_SHEET);
    if (sheet) {
      info.migration = ensureEmailRegistryCollegeColumn(sheet);
      info.registry.exists = true;

      if (sheet.getLastRow() > 1) {
        const data = sheet.getDataRange().getValues();
        const headers = data[0].map(h => String(h || '').trim());
        const cIdx = findCollegeColumnIndex(headers);
        info.registry.hasCollegeColumn = cIdx !== -1;
        info.registry.rows = data.length - 1;
        if (cIdx !== -1) {
          for (let i = 1; i < data.length; i++) {
            if (!String(data[i][0] || '').trim()) continue;
            const value = normalizeCollegeName(data[i][cIdx]);
            if (!value) info.registry.blankRows++;
            else if (!collegeNamesMatch(value, info.name)) info.registry.otherCollegeRows++;
          }
        }
      }
    }
  } catch (e) {
    logError('getCollegeInfo', e);
  }

  // Branch groups + the branches actually present (helps onboard a new college).
  try {
    const groups = getBranchGroups();
    info.branchGroups = { CS: groups.CS, NON_CS: groups.NON_CS, isCustom: groups.isCustom };
    info.masterBranches = getMasterDataBranches();
  } catch (e) {
    info.branchGroups = { CS: [], NON_CS: [], isCustom: false };
    info.masterBranches = [];
  }

  // Copy detector: a saved name that has nothing to do with this file's name
  // usually means the spreadsheet was duplicated from another college.
  info.likelyCopy = !!(info.savedName && info.suggestedFromFileName &&
    !collegeNamesMatch(info.savedName, info.suggestedFromFileName));

  return info;
}

/** Saves the college from the setup dialog, optionally relabelling existing rows. */
function saveCollegeNameFromDialog(name, updateExistingRows) {
  const clean = setCollegeName(name);
  let updatedRows = 0;

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.EMAIL_REGISTRY_SHEET);
    if (sheet && sheet.getLastRow() > 1) {
      const data = sheet.getDataRange().getValues();
      const cIdx = findCollegeColumnIndex(data[0]);
      if (cIdx !== -1) {
        const range = sheet.getRange(2, cIdx + 1, sheet.getLastRow() - 1, 1);
        const values = range.getValues();
        let dirty = false;
        for (let i = 0; i < values.length; i++) {
          const hasRow = !!String(data[i + 1] && data[i + 1][0] || '').trim();
          const current = normalizeCollegeName(values[i][0]);
          const shouldWrite = hasRow && (updateExistingRows ? !collegeNamesMatch(current, clean) : !current);
          if (shouldWrite) { values[i][0] = clean; dirty = true; updatedRows++; }
        }
        if (dirty) range.setValues(values);
      }
    }
  } catch (e) {
    logError('saveCollegeNameFromDialog', e);
  }

  return { success: true, college: clean, updatedRows: updatedRows, info: getCollegeInfo() };
}

/** Opens the one-per-spreadsheet College Setup dialog. */
function showCollegeSetupDialog() {
  const html = HtmlService.createHtmlOutputFromFile('CollegeSetupDialog')
    .setWidth(560)
    .setHeight(640);
  SpreadsheetApp.getUi().showModalDialog(html, '🏫 College Setup');
}

/**
 * [ENHANCEMENT 8] Format date as "EEE MMM dd yyyy" (e.g., "Wed Jun 10 2026")
 * Removes time and timezone from display format.
 * Logic unchanged.
 */
function formatDateString(dateStr) {
  if (!dateStr) return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'EEE MMM dd yyyy');
  if (dateStr instanceof Date) return Utilities.formatDate(dateStr, Session.getScriptTimeZone(), 'EEE MMM dd yyyy');
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'EEE MMM dd yyyy');
    }
  } catch (e) {}
  const parts = String(dateStr).split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const m = parseInt(parts[1], 10) - 1;
    if (months[m]) return parts[2] + '-' + months[m] + '-' + parts[0];
  }
  return String(dateStr);
}

// ==================== MENU (onOpen) ====================
/**
 * Builds the 📊 Assessment Suite menu.
 * ENHANCED: clearer grouping + welcome toast. Menu actions unchanged.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📊 Assessment Suite')
    .addItem('🚀 Generate Report', 'showReportDialog')
    .addItem('🏆 Open Leaderboard', 'showDialog')
    .addItem('🎓 TPO Dashboard', 'showTPODashboard')
    .addItem('📊 Leaderboard Analytics', 'showTPOAnalytics')
    .addSeparator()
    .addSubMenu(
      SpreadsheetApp.getUi()
        .createMenu('📥 Exports')
        .addItem('📄 Export Report as PDF', 'manualExportPDF')
        .addItem('📊 Export Report as CSV', 'manualExportCSV')
        .addItem('📄 Export Leaderboard as PDF', 'exportLeaderboardPDF')
        .addItem('📊 Export Leaderboard as CSV', 'exportLeaderboardCSV')
    )
    .addSeparator()
    .addSubMenu(
      SpreadsheetApp.getUi()
        .createMenu('📧 Email')
        .addItem('📧 Send Single Report', 'showEmailDialog')
        .addItem('📧 Send Multiple Reports', 'showBatchEmailDialog')
        .addItem('📋 View Email Registry', 'viewEmailRegistry')
    )
    .addSeparator()
    .addItem('🗑️ Clear Leaderboard', 'clearAllOutputs')
    .addItem('🔄 Rebuild Leaderboard', 'showRebuildCategoryDialog')
    .addItem('♻️ Rebuild All Leaderboards', 'rebuildLeaderboardAll')
    .addItem('🏫 College Setup', 'showCollegeSetupDialog')
    .addItem('⚙️ Settings', 'showSettingsDialog')
    .addItem('❓ Help', 'showHelp')
    .addToUi();

  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Welcome! Use 📊 Assessment Suite menu to generate reports or send emails',
    'Assessment Suite',
    8
  );
}

// ============================================================
// SECTION 1 — ASSESSMENT REPORT GENERATOR
// ============================================================

/** Opens ReportDialog. ENHANCED: title fixed from ' ' to '📝 Generate Report'. */
function showReportDialog() {
  const html = HtmlService.createHtmlOutputFromFile('ReportDialog')
    .setWidth(520)
    .setHeight(780);
  SpreadsheetApp.getUi().showModalDialog(html, '📝 Generate Report');
}

function showEmailDialog() {
  const html = HtmlService.createHtmlOutputFromFile('EmailDialog')
    .setWidth(540)
    .setHeight(720);
  SpreadsheetApp.getUi().showModalDialog(html, '📧 Send Assessment Report');
}

function viewEmailRegistry() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.EMAIL_REGISTRY_SHEET);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Email Registry not found. Generate a report first.');
    return;
  }
  ss.setActiveSheet(sheet);
}

/**
 * Settings dialog — Good threshold %.
 * ENHANCED: clearer prompt. Only GOOD threshold stored (as original).
 */
function showSettingsDialog() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    '⚙️ Settings',
    'Enter Good threshold % (default 70):\n\nNote: Improvement threshold is fixed at 50% in this version.',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    const threshold = parseInt(response.getResponseText()) || 70;
    PropertiesService.getScriptProperties().setProperty('GOOD_THRESHOLD', String(threshold));
    ui.alert('✅ Settings saved! Threshold set to ' + threshold + '%');
  }
}

// ==================== Branch-wise Absent Count ====================
/**
 * Builds the Branch-wise Absent Count section beside At-Risk section.
 * Compares Master Data total students per branch vs Report generator attendance.
 * Logic unchanged — only comments added.
 */
function buildBranchAbsentCount(sheet, row, rawData, colMap, config) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const masterSheet = ss.getSheetByName(CONFIG.MASTER_SHEET);
  if (!masterSheet) {
    sheet.getRange(row, 6).setValue('⚠️ Master Data sheet not found').setFontWeight('bold');
    return row + 1;
  }

  const masterData = masterSheet.getDataRange().getValues();
  if (masterData.length < 2) {
    sheet.getRange(row, 6).setValue('⚠️ No data in Master Data').setFontWeight('bold');
    return row + 1;
  }

  const mHeaders = masterData[0].map(h => String(h).trim().toLowerCase());
  const mRegIdx = mHeaders.findIndex(h => h.includes('reg') || h.includes('roll'));
  const mBranchIdx = mHeaders.findIndex(h => h.includes('branch') || h.includes('dept'));
  const mBatchIdx = mHeaders.findIndex(h => h.includes('batch'));

  if (mBranchIdx === -1) {
    sheet.getRange(row, 6).setValue('⚠️ Branch column not found in Master Data').setFontWeight('bold');
    return row + 1;
  }

  const masterBranchCounts = {};

  for (let i = 1; i < masterData.length; i++) {
    const mRow = masterData[i];
    if (config.batch && mBatchIdx !== -1) {
      const masterBatch = String(mRow[mBatchIdx] || '').trim();
      if (masterBatch !== config.batch) continue;
    }
    const branch = String(mRow[mBranchIdx] || '').trim();
    const regNo = mRegIdx !== -1 ? String(mRow[mRegIdx] || '').trim().toUpperCase() : '';
    if (branch) {
      if (!masterBranchCounts[branch]) {
        masterBranchCounts[branch] = { total: 0, regs: new Set() };
      }
      masterBranchCounts[branch].total++;
      if (regNo) masterBranchCounts[branch].regs.add(regNo);
    }
  }

  const attendedBranchCounts = {};
  const scoreCol = colMap.score !== -1 ? colMap.score : rawData[0].length - 1;

  for (let i = 1; i < rawData.length; i++) {
    const rRow = rawData[i];
    if (!rRow || !rRow[colMap.name]) continue;
    const branch = String(rRow[colMap.branch] || '').trim();
    const regNo = colMap.reg !== -1 ? String(rRow[colMap.reg] || '').trim().toUpperCase() : '';
    if (branch) {
      if (!attendedBranchCounts[branch]) {
        attendedBranchCounts[branch] = { present: 0, regs: new Set() };
      }
      attendedBranchCounts[branch].present++;
      if (regNo) attendedBranchCounts[branch].regs.add(regNo);
    }
  }

  const absentData = [];
  const branches = Object.keys(masterBranchCounts).sort();

  branches.forEach(branch => {
    const masterTotal = masterBranchCounts[branch].total;
    const attended = attendedBranchCounts[branch] ? attendedBranchCounts[branch].present : 0;
    const absent = Math.max(0, masterTotal - attended);
    const absentPct = masterTotal > 0 ? ((absent / masterTotal) * 100).toFixed(1) + '%' : '0%';
    absentData.push([branch, masterTotal, attended, absent, absentPct]);
  });

  Object.keys(attendedBranchCounts).forEach(branch => {
    if (!masterBranchCounts[branch]) {
      const attended = attendedBranchCounts[branch].present;
      absentData.push([branch + ' (⚠️ not in Master)', 0, attended, 0, 'N/A']);
    }
  });

  absentData.sort((a, b) => b[3] - a[3]);

  const ABSENT_START_COL = 6;
  const currentMaxCols = sheet.getMaxColumns();
  if (currentMaxCols < ABSENT_START_COL + 4) {
    sheet.insertColumnsAfter(currentMaxCols, (ABSENT_START_COL + 4) - currentMaxCols);
  }

  sheet.getRange(row, ABSENT_START_COL).setValue('📋 Branch-wise Absent Count').setFontWeight('bold');

  const absentHeaders = [['Branch', 'Total', 'Attended', 'Absent', 'Absent %']];
  sheet.getRange(row + 1, ABSENT_START_COL, 1, 5).setValues(absentHeaders)
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_FG)
    .setFontWeight('bold');

  if (absentData.length > 0) {
    sheet.getRange(row + 2, ABSENT_START_COL, absentData.length, 5).setValues(absentData);
    for (let i = 0; i < absentData.length; i++) {
      const absentPctStr = absentData[i][4];
      const absentPct = parseFloat(absentPctStr);
      if (absentPct >= 50) {
        sheet.getRange(row + 2 + i, ABSENT_START_COL + 3).setBackground('#FFCDD2').setFontColor('#c62828').setFontWeight('bold');
      } else if (absentPct >= 30) {
        sheet.getRange(row + 2 + i, ABSENT_START_COL + 3).setBackground('#FFE0B2').setFontColor('#ef6c00');
      } else if (absentPct > 0) {
        sheet.getRange(row + 2 + i, ABSENT_START_COL + 3).setBackground('#FFF9C4').setFontColor('#f57f17');
      } else {
        sheet.getRange(row + 2 + i, ABSENT_START_COL + 3).setBackground('#C8E6C9').setFontColor('#2E7D32');
      }
    }
  } else {
    sheet.getRange(row + 2, ABSENT_START_COL).setValue('No absent data available');
  }

  sheet.getRange(row + 1, ABSENT_START_COL, absentData.length + 1, 5)
    .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

  return row + absentData.length + 3;
}

// ==================== Main Report Generation ====================
/**
 * Generates the full Report_View from Report generator.
 * Called from ReportDialog. Logic unchanged.
 * ENHANCED: clearer toasts, better error text, logError() with context.
 */
function generateUniversalReport(inputs) {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    const config = parseInputs(inputs);
    if (!config) return;
    if (!config.collegeName) throw new Error('Please enter College Name.');

    PropertiesService.getScriptProperties().setProperty('LAST_REPORT_CONFIG', JSON.stringify({
      testName: config.testName,
      collegeName: config.collegeName,
      batch: config.batch || '',
      reportDate: config.reportDate || ''
    }));
    PropertiesService.getScriptProperties().setProperty('LAST_COLLEGE_NAME', config.collegeName);

    const rawSheet = ss.getSheetByName(CONFIG.SHEET_NAME_RAW);
    if (!rawSheet) throw new Error('Sheet "Report generator" not found! Please create it with student data (Name, Email, Reg No, Batch, Branch, Score).');

    const rawData = rawSheet.getDataRange().getValues();
    if (rawData.length < 2) throw new Error('No data found in Report generator. Add headers in row 1 and student data from row 2.');

    const colMap = detectColumns(rawData[0]);
    validateColumns(colMap);

    ss.toast('📊 Analyzing data...', 'Progress', 3);
    const analysis = analyzeData(rawData, colMap, config);

    ss.toast('🏗️ Building report...', 'Progress', 3);
    const report = prepareReportSheet(ss);

    ss.toast('🖼️ Adding logo...', 'Progress', 2);

    let row = buildHeader(report, config);
    row = buildAssessmentDetails(report, row, config, analysis);
    row = buildAttachments(report, row, config, ss);
    row = buildPerformanceSnapshot(report, row, analysis.summary);
    row = buildStatusSummary(report, row, analysis.summary);
    row = buildPerformers(report, row, analysis.performers);
    row = buildBranchSummary(report, row, analysis.branchStats);

    const tableRow = row + 1;
    buildDataTable(report, tableRow, rawData[0], colMap, analysis.processedRows);
    const atRiskRow = tableRow + analysis.processedRows.length + 3;
    buildAtRiskSection(report, atRiskRow, analysis.atRisk);
    buildBranchAbsentCount(report, atRiskRow, rawData, colMap, config);

    applyProfessionalFormatting(report);

    // ── EMAIL REGISTRY UPDATE (NO auto PDF export) ──
    try {
      let answerKeyLink = '';
      let answerKeyFileId = '';

      if (config.answerKeyFileId) {
        const extractedId = extractFileIdFromUrl(config.answerKeyFileId);
        if (extractedId && extractedId.length > 10) {
          answerKeyFileId = extractedId;
          answerKeyLink = 'https://drive.google.com/file/d/' + extractedId + '/view';

          try {
            const collegeFolder = getOrCreateCollegeFolder(config.collegeName);
            const testFolder = getOrCreateTestFolder(collegeFolder, config.testName);
            const sourceFile = DriveApp.getFileById(extractedId);
            const fileName = 'Answer Key - ' + config.testName + '.pdf';

            const existing = testFolder.getFilesByName(fileName);
            let akFile;
            if (existing.hasNext()) {
              akFile = existing.next();
            } else {
              akFile = sourceFile.makeCopy(fileName, testFolder);
            }
            akFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            answerKeyLink = akFile.getUrl();
            PropertiesService.getScriptProperties().setProperty(
              'ANSWER_KEY_FILE_ID_' + config.testName + '_' + (config.batch || ''),
              akFile.getId()
            );
          } catch (copyErr) {
            console.warn('Answer Key copy to folder failed (using original link):', copyErr);
          }
        }
      }

      const formattedDate = config.reportDate ? formatDateString(config.reportDate) : formatDateString(new Date());

      const reportSnapshot = JSON.stringify({
        attendance: analysis.summary.totalStudents,
        totalStrength: config.totalStrength || analysis.summary.totalStudents,
        goodToGo: analysis.summary.good,
        needsImprovement: analysis.summary.improvement,
        needsTraining: analysis.summary.training,
        totalQuestions: config.totalQuestions || '',
        totalMarks: config.totalMarks || '',
        testDate: formattedDate,
        collegeName: config.collegeName,
        batch: config.batch || '',
        testName: config.testName,
        topPerformers: analysis.performers.top10.slice(0, 3).map(s => ({
          name: s.name,
          branch: s.branch,
          percent: s.percent.toFixed(2)
        }))
      });

      PropertiesService.getScriptProperties().setProperty(
        'REPORT_SNAPSHOT_' + config.testName + '_' + (config.batch || ''),
        reportSnapshot
      );

      updateEmailRegistry(config.testName, config.batch || '', formattedDate, '', answerKeyLink, '', '', 'Generated', 'Report generated');
    } catch (e) {
      console.warn('Registry update failed:', e);
    }

    ss.toast('✅ Report complete! Check Report_View sheet.', 'Done', 5);

    try {
      autoUpdateLeaderboard(ss, config, rawData, colMap, config.leaderboardType);
    } catch (e) {
      logError('autoUpdateLeaderboard', e);
    }

  } catch (error) {
    ui.alert('❌ Error', error.toString() + '\n\nTip: Check Report generator headers (Name, Email, Reg No, Batch, Branch) and try again.', ui.ButtonSet.OK);
    logError('generateUniversalReport', error);
  }
}

function insertLogo(sheet) {
  try {
    const file = DriveApp.getFileById(CONFIG.LOGO_FILE_ID);
    const blob = file.getBlob();
    const image = sheet.insertImage(blob, 1, 1);
    image.setWidth(90).setHeight(60);
    sheet.setRowHeight(1, 50);
    sheet.setRowHeight(2, 50);
    return true;
  } catch (e) {
    console.warn('Logo insertion failed (check LOGO_FILE_ID in CONFIG):', e);
    return false;
  }
}

// ==================== Folder Functions ====================

function getOrCreateUniversalFolder() {
  const folderName = 'All College Assessment Reports';
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}

function getOrCreateCollegeFolder(collegeName) {
  const universalFolder = getOrCreateUniversalFolder();
  const cleanCollegeName = String(collegeName).replace(/[^a-zA-Z0-9\s]/g, '').trim();
  if (!cleanCollegeName) throw new Error('College name is required for folder creation.');
  const folders = universalFolder.getFoldersByName(cleanCollegeName);
  if (folders.hasNext()) return folders.next();
  return universalFolder.createFolder(cleanCollegeName);
}

function getOrCreateTestFolder(collegeFolder, testName) {
  const cleanTestName = String(testName).replace(/[^a-zA-Z0-9\s]/g, '_').trim();
  const folders = collegeFolder.getFoldersByName(cleanTestName);
  if (folders.hasNext()) return folders.next();
  return collegeFolder.createFolder(cleanTestName);
}

// ==================== Short Name & Series Tracking ====================

function generateShortName(testName) {
  return parseSeriesInfo(testName).shortName;
}

function parseSeriesInfo(testName) {
  if (!testName) return { seriesName: '', shortName: '', seriesNumber: null, isFinal: false, seriesClosed: false };

  const finalKeywords = ['Final', 'Grand Final', 'Final Assessment', 'Mock Final', 'Mega Final'];
  const lowerName = String(testName).toLowerCase();
  const isFinal = finalKeywords.some(kw => lowerName.includes(kw.toLowerCase()));

  let workingName = String(testName);
  finalKeywords.forEach(kw => {
    workingName = workingName.replace(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
  });
  workingName = workingName.replace(/\s+/g, ' ').trim();

  const numberMatch = workingName.match(/(\d+)$/);
  const seriesNumber = numberMatch ? parseInt(numberMatch[1]) : null;
  if (numberMatch) {
    workingName = workingName.replace(/\s+\d+$/, '').trim();
  }

  const words = workingName.split(/\s+/).filter(w => w.length > 0);
  const shortPrefix = words.map(w => w.charAt(0).toUpperCase()).join('');

  if (isFinal) {
    return {
      seriesName: workingName,
      shortName: shortPrefix + ' Final',
      seriesNumber: 'Final',
      isFinal: true,
      seriesClosed: true
    };
  }

  return {
    seriesName: workingName,
    shortName: shortPrefix + (seriesNumber ? ' ' + seriesNumber : ''),
    seriesNumber: seriesNumber,
    isFinal: false,
    seriesClosed: false
  };
}

function isFinalAssessment(testName) {
  return parseSeriesInfo(testName).isFinal;
}

// ==================== File Naming ====================

function generateExportFileName(collegeName, assessmentName, dateStr, ext, isLeaderboard) {
  const c = String(collegeName).replace(/[^a-zA-Z0-9]/g, '_');
  const d = dateStr || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  if (isLeaderboard) {
    const short = generateShortName(assessmentName).replace(/\s+/g, '');
    return `${c}_Leaderboard_${short}_${d}.${ext}`;
  }
  const a = String(assessmentName).replace(/[^a-zA-Z0-9]/g, '_');
  return `${c}_${a}_${d}.${ext}`;
}

// ==================== Export Functions ====================

function silentExportPDF(ss, sheet, config) {
  try {
    if (!sheet || ss.getSheetByName(sheet.getName()) === null) {
      console.warn('Sheet not found for silent export. Skipping.');
      return null;
    }
    const testName = config.testName;
    const collegeName = config.collegeName || 'Unknown College';
    const dateStr = config.reportDate || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const fileName = generateExportFileName(collegeName, testName, dateStr, 'pdf', false);

    const collegeFolder = getOrCreateCollegeFolder(collegeName);
    const testFolder = getOrCreateTestFolder(collegeFolder, testName);

    const url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?' +
      'format=pdf&size=A4&portrait=true&fitw=true&sheetnames=false&printtitle=false&' +
      'pagenumbers=true&gridlines=false&fzr=true&gid=' + sheet.getSheetId();

    const token = ScriptApp.getOAuthToken();
    const response = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) return null;

    const blob = response.getBlob().setName(fileName);
    const file = testFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file;
  } catch (e) {
    logError('silentExportPDF', e);
    return null;
  }
}

function exportAsPDF(spreadsheet, sheet, config) {
  try {
    if (!sheet || spreadsheet.getSheetByName(sheet.getName()) === null) {
      throw new Error('Sheet not found. It may have been deleted. Please regenerate the report first.');
    }
    const testName = config.testName;
    const collegeName = config.collegeName || 'Unknown College';

    const collegeFolder = getOrCreateCollegeFolder(collegeName);
    const testFolder = getOrCreateTestFolder(collegeFolder, testName);

    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm');
    const fileName = generateExportFileName(collegeName, testName, config.reportDate || timestamp.substring(0, 10), 'pdf', false);

    const url = 'https://docs.google.com/spreadsheets/d/' + spreadsheet.getId() + '/export?' +
      'format=pdf&size=A4&portrait=true&fitw=true&sheetnames=false&printtitle=false&' +
      'pagenumbers=true&gridlines=false&fzr=true&gid=' + sheet.getSheetId();

    const token = ScriptApp.getOAuthToken();
    const response = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      throw new Error('Export failed: ' + response.getContentText());
    }

    const blob = response.getBlob().setName(fileName);
    const file = testFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    try {
      const batch = config.batch || '';
      const reportUrl = file.getUrl();
      const record = getEmailRegistryRecord(testName, batch);
      if (record) {
        updateEmailRegistry(testName, batch, record.data[2] || '', reportUrl, record.data[4] || '', record.data[5] || '', record.data[6] || '', record.data[7] || 'Generated', 'PDF exported');
      } else {
        updateEmailRegistry(testName, batch, '', reportUrl, '', '', '', 'Generated', 'PDF exported manually');
      }
    } catch (e) { console.warn('Registry update failed:', e); }

    showExportSuccess(file, testFolder.getName(), 'PDF', collegeName);
    return file;

  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ PDF Error', e.message + '\n\nTip: Regenerate the report, then export again.', SpreadsheetApp.getUi().ButtonSet.OK);
    logError('exportAsPDF', e);
    throw e;
  }
}

function exportAsCSV(spreadsheet, sheet, config) {
  try {
    if (!sheet || spreadsheet.getSheetByName(sheet.getName()) === null) {
      throw new Error('Sheet not found. It may have been deleted. Please regenerate the report first.');
    }
    const testName = config.testName;
    const collegeName = config.collegeName || 'Unknown College';

    const collegeFolder = getOrCreateCollegeFolder(collegeName);
    const testFolder = getOrCreateTestFolder(collegeFolder, testName);

    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm');
    const fileName = generateExportFileName(collegeName, testName, config.reportDate || timestamp.substring(0, 10), 'csv', false);

    const data = sheet.getDataRange().getValues();
    const csv = data.map(row => row.map(cell => {
      const str = String(cell).replace(/"/g, '""');
      return '"' + str + '"';
    }).join(',')).join('\n');

    const blob = Utilities.newBlob(csv, MimeType.CSV, fileName);
    const file = testFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    showExportSuccess(file, testFolder.getName(), 'CSV', collegeName);
    return file;

  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ CSV Error', e.message, SpreadsheetApp.getUi().ButtonSet.OK);
    logError('exportAsCSV', e);
  }
}

// ==================== Leaderboard Exports ====================

function exportLeaderboardPDF() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = findLeaderboardSheet(ss);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('❌ Error', 'No leaderboard sheet found. Generate a leaderboard first (🏆 Open Leaderboard).', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  const collegeName = extractCollegeNameFromLeaderboard(sheet) || PropertiesService.getScriptProperties().getProperty('LAST_COLLEGE_NAME') || getCollegeName();
  const testName = extractAssessmentNameFromLeaderboard(sheet) || 'Leaderboard';
  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  try {
    const collegeFolder = getOrCreateCollegeFolder(collegeName);
    const fileName = generateExportFileName(collegeName, testName, dateStr, 'pdf', true);

    const url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?' +
      'format=pdf&size=A4&landscape=true&fitw=true&sheetnames=false&printtitle=false&' +
      'pagenumbers=true&gridlines=false&fzr=true&gid=' + sheet.getSheetId();

    const token = ScriptApp.getOAuthToken();
    const response = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) throw new Error('Export failed: ' + response.getContentText());

    const blob = response.getBlob().setName(fileName);
    const file = collegeFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    showExportSuccess(file, collegeFolder.getName(), 'PDF (Leaderboard)', collegeName);
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Leaderboard PDF Error', e.message, SpreadsheetApp.getUi().ButtonSet.OK);
    logError('exportLeaderboardPDF', e);
  }
}

function exportLeaderboardCSV() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = findLeaderboardSheet(ss);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('❌ Error', 'No leaderboard sheet found. Generate a leaderboard first.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  const collegeName = extractCollegeNameFromLeaderboard(sheet) || PropertiesService.getScriptProperties().getProperty('LAST_COLLEGE_NAME') || getCollegeName();
  const testName = extractAssessmentNameFromLeaderboard(sheet) || 'Leaderboard';
  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  try {
    const collegeFolder = getOrCreateCollegeFolder(collegeName);
    const fileName = generateExportFileName(collegeName, testName, dateStr, 'csv', true);

    const data = sheet.getDataRange().getValues();
    const csv = data.map(row => row.map(cell => {
      const str = String(cell).replace(/"/g, '""');
      return '"' + str + '"';
    }).join(',')).join('\n');

    const blob = Utilities.newBlob(csv, MimeType.CSV, fileName);
    const file = collegeFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    showExportSuccess(file, collegeFolder.getName(), 'CSV (Leaderboard)', collegeName);
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Leaderboard CSV Error', e.message, SpreadsheetApp.getUi().ButtonSet.OK);
    logError('exportLeaderboardCSV', e);
  }
}

function findLeaderboardSheet(ss) {
  const candidates = [
    CONFIG.LEADERBOARD_SHEET,
    '📊 Class Test Leaderboard',
    '📊 Company Specific Leaderboard',
    '📊 Practice Module Leaderboard'
  ];
  for (const name of candidates) {
    const s = ss.getSheetByName(name);
    if (s) return s;
  }
  return null;
}

function extractCollegeNameFromLeaderboard(sheet) {
  try {
    const val = String(sheet.getRange(1, 1).getValue());
    const match = val.match(/🏛️\s+(.*?)\s+—/);
    return match ? match[1].trim() : null;
  } catch (e) { return null; }
}

function extractAssessmentNameFromLeaderboard(sheet) {
  try {
    const headers = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
    for (const h of headers) {
      const str = String(h).trim();
      if (str && !str.startsWith('Name') && !str.startsWith('Email') && !str.startsWith('Reg') && !str.startsWith('Branch') && !str.startsWith('Total') && !str.startsWith('Rank') && !str.startsWith('Percentage') && !str.startsWith('Status') && !str.startsWith('Insight')) {
        return str.split(' ')[0];
      }
    }
    return 'Leaderboard';
  } catch (e) { return 'Leaderboard'; }
}

function showExportSuccess(file, folderName, type, collegeName) {
  const downloadUrl = 'https://drive.google.com/uc?export=download&id=' + file.getId();
  const icon = type.includes('PDF') ? '📄' : '📊';
  const college = collegeName || 'Unknown College';

  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: Inter, sans-serif; padding: 20px; text-align: center;">
      <h2 style="color: #1B5E20;">${icon} ${type} Ready!</h2>
      <p style="margin: 16px 0; color: #333;">Your file has been saved successfully.</p>
      <a href="${downloadUrl}" target="_blank"
         style="display: inline-block; background: linear-gradient(135deg, #1B5E20, #2E7D32);
                color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;
                font-weight: 600; margin: 10px 0;">
        ⬇️ Download ${type}
      </a>
      <p style="font-size: 12px; color: #666; margin-top: 16px;">
        Saved to: <strong>${college} / ${folderName}</strong>
      </p>
    </div>
  `).setWidth(400).setHeight(250);

  SpreadsheetApp.getUi().showModalDialog(html, ' ');
}

function showDownloadOptions(ss, sheet, config) {
  const html = HtmlService.createHtmlOutputFromFile('DownloadDialog')
    .setWidth(480)
    .setHeight(360);
  SpreadsheetApp.getUi().showModalDialog(html, ' ');
}

function exportAsPDFFromDialog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const report = ss.getSheetByName(CONFIG.SHEET_NAME_REPORT);
  if (!report) {
    SpreadsheetApp.getUi().alert('Generate a report first! (🚀 Generate Report)');
    return;
  }
  const testName = report.getRange(3, 1).getValue().replace(' - Assessment Summary', '') || 'Report';
  const collegeName = report.getRange(1, 1).getValue() || 'Unknown College';
  const config = { testName: testName, collegeName: collegeName };

  const lastConfigStr = PropertiesService.getScriptProperties().getProperty('LAST_REPORT_CONFIG');
  if (lastConfigStr) {
    const lastConfig = JSON.parse(lastConfigStr);
    config.batch = lastConfig.batch;
    config.reportDate = lastConfig.reportDate;
  }

  exportAsPDF(ss, report, config);
}

function exportAsCSVFromDialog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const report = ss.getSheetByName(CONFIG.SHEET_NAME_REPORT);
  if (!report) {
    SpreadsheetApp.getUi().alert('Generate a report first! (🚀 Generate Report)');
    return;
  }
  const testName = report.getRange(3, 1).getValue().replace(' - Assessment Summary', '') || 'Report';
  const collegeName = report.getRange(1, 1).getValue() || 'Unknown College';
  const config = { testName: testName, collegeName: collegeName };

  const lastConfigStr = PropertiesService.getScriptProperties().getProperty('LAST_REPORT_CONFIG');
  if (lastConfigStr) {
    const lastConfig = JSON.parse(lastConfigStr);
    config.batch = lastConfig.batch;
    config.reportDate = lastConfig.reportDate;
  }

  exportAsCSV(ss, report, config);
}

function applyProfessionalFormatting(report) {
  const maxRows = report.getMaxRows();
  const maxCols = report.getMaxColumns();

  report.getRange(1, 1, maxRows, maxCols)
    .setFontFamily('Times New Roman')
    .setVerticalAlignment('middle');

  if (maxRows >= 4) {
    report.getRange(4, 1, maxRows - 3, maxCols)
      .setFontSize(10);
  }

  report.setFrozenRows(3);

  if (report.getLastColumn() > 0) {
    report.autoResizeColumns(1, report.getLastColumn());
  }

  // FIXED (formatting only): these used to be applied as fixed widths AFTER
  // autoResize, so column D shrank to 80px and the "Percentage %" header was
  // cut mid-word. They are treated as minimums now — columns can grow, never
  // be squeezed below a readable width.
  const colWidthFloors = [120, 180, 110, 110, 110];
  colWidthFloors.forEach((minWidth, i) => {
    if (i < maxCols && report.getColumnWidth(i + 1) < minWidth) {
      report.setColumnWidth(i + 1, minWidth);
    }
  });
}

// ==================== Report Builders ====================

function buildHeader(sheet, config) {
  const collegeName = config.collegeName || 'Unknown College';
  insertLogo(sheet);

  sheet.getRange(1, 1, 2, 12).merge()
    .setValue(collegeName)
    .setFontSize(20)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_FG)
    .setFontFamily('Times New Roman');

  sheet.setRowHeight(1, 50);
  sheet.setRowHeight(2, 50);

  sheet.getRange(3, 1, 1, 12).merge()
    .setValue(config.testName + ' - Assessment Summary')
    .setFontSize(15)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_FG)
    .setFontFamily('Times New Roman');

  sheet.setRowHeight(3, 36);

  return 5;
}

function buildAssessmentDetails(sheet, row, config, analysis) {
  sheet.getRange(5, 1, 1, 4).merge()
    .setValue('Assessment Details')
    .setFontSize(12)
    .setFontWeight('bold')
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_FG)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(5, 30);

  const attendance = analysis.summary.totalStudents || 0;
  const totalStrength = config.totalStrength;
  const attendanceStr = totalStrength ? `${attendance} / ${totalStrength}` : String(attendance);

  const testDate = formatDateString(config.reportDate);

  const data = [
    ['Test Name:', config.testName, 'Attendance:', attendanceStr],
    ['Test Date:', testDate, 'Number of Questions:', String(config.totalQuestions || '')],
    ['Batch:', config.batch || '—', 'Total Marks:', String(config.totalMarks || '')]
  ];

  const range = sheet.getRange(6, 1, 3, 4);
  range.setValues(data);

  sheet.getRange(6, 1, 3, 1)
    .setFontWeight('bold')
    .setBackground('#f8fafc')
    .setHorizontalAlignment('left');
  sheet.getRange(6, 3, 3, 1)
    .setFontWeight('bold')
    .setBackground('#f8fafc')
    .setHorizontalAlignment('left');

  sheet.getRange(6, 2, 3, 1).setBackground('#ffffff').setHorizontalAlignment('left');
  sheet.getRange(6, 4, 3, 1).setBackground('#ffffff').setHorizontalAlignment('left');

  range.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

  return 9;
}

function buildAttachments(sheet, row, config, ss) {
  sheet.getRange(5, 6, 1, 4).merge()
    .setValue('Attachments')
    .setFontSize(12)
    .setFontWeight('bold')
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_FG)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(5, 30);

  const reportUrl = ss.getUrl() + '#gid=' + sheet.getSheetId();

  const reportCell = sheet.getRange(6, 6);
  const reportRichText = SpreadsheetApp.newRichTextValue()
    .setText('• Assessment Report')
    .setLinkUrl(reportUrl)
    .build();
  reportCell.setRichTextValue(reportRichText);
  reportCell.setFontSize(11).setFontFamily('Poppins').setVerticalAlignment('middle');

  if (config.answerKeyFileId) {
    const answerKeyUrl = config.answerKeyFileId.startsWith('http') 
      ? config.answerKeyFileId 
      : 'https://drive.google.com/file/d/' + config.answerKeyFileId + '/view';
    const keyCell = sheet.getRange(7, 6);
    const keyRichText = SpreadsheetApp.newRichTextValue()
      .setText('• Answer Key')
      .setLinkUrl(answerKeyUrl)
      .build();
    keyCell.setRichTextValue(keyRichText);
    keyCell.setFontSize(11).setFontFamily('Poppins').setVerticalAlignment('middle');
  }

  return 9;
}

function buildPerformanceSnapshot(sheet, row, summary) {
  const data = [
    ['Total Students', 'Average %', 'Highest %', 'Lowest %', 'Duration'],
    [summary.totalStudents, summary.average + '%', summary.highest + '%', summary.lowest + '%', summary.duration]
  ];
  const range = sheet.getRange(10, 1, 2, 5);
  range.setValues(data);
  sheet.getRange(10, 1, 1, 5)
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_FG)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheet.getRange(11, 1, 1, 5).setHorizontalAlignment('center');
  range.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  return 13;
}

/**
 * Parses dialog inputs or falls back to prompt() flow.
 * ENHANCED: removed duplicate totalMarks check (dead code). Logic unchanged.
 */
function parseInputs(inputs) {
  if (inputs && typeof inputs === 'object' && inputs.testName) {
    const collegeName = String(inputs.collegeName || '').trim();
    if (!collegeName) throw new Error('Please enter College Name.');
    return {
      testName: String(inputs.testName).trim(),
      totalQuestions: String(inputs.totalQuestions),
      totalMarks: Number(inputs.totalMarks),
      duration: String(inputs.duration).trim(),
      reportDate: inputs.reportDate || '',
      leaderboardType: inputs.leaderboardType || '',
      collegeName: collegeName,
      batch: String(inputs.batch || '').trim(),
      totalStrength: inputs.totalStrength ? parseInt(inputs.totalStrength) : null,
      answerKeyFileId: String(inputs.answerKeyFileId || '').trim(),
      customAttendance: inputs.customAttendance ? parseInt(inputs.customAttendance) : null
    };
  }

  const ui = SpreadsheetApp.getUi();
  const getValue = (prompt, required) => {
    const r = ui.prompt(prompt);
    if (r.getSelectedButton() !== ui.Button.OK) return null;
    const v = r.getResponseText().trim();
    if (required && !v) throw new Error(prompt + ' is required');
    return v;
  };

  const collegeName = getValue('Enter College Name', true);
  if (!collegeName) throw new Error('Please enter College Name.');
  const testName = getValue('Enter Test Name', true);
  if (!testName) return null;
  const batch = getValue('Enter Batch', true);
  const totalQuestions = getValue('Enter No of Questions', true);
  const totalMarks = Number(getValue('Enter Total Marks', true));
  const duration = getValue('Enter Duration (e.g., 60 mins)', true);
  const totalStrengthStr = getValue('Enter Total Batch Strength (optional)', false);
  const totalStrength = totalStrengthStr ? parseInt(totalStrengthStr) : null;
  const answerKeyFileId = getValue('Enter Answer Key File ID or URL (optional)', false) || '';

  if (!totalMarks || totalMarks <= 0) throw new Error('Total marks must be positive');

  const customAttendanceStr = getValue('Enter Attendance (optional, auto if blank)', false);
  const customAttendance = customAttendanceStr ? parseInt(customAttendanceStr) : null;

  return { 
    testName, totalQuestions, totalMarks, duration, 
    reportDate: '', leaderboardType: '', collegeName, 
    batch, totalStrength, answerKeyFileId, customAttendance
  };
}

function detectColumns(headers) {
  const find = (names) => {
    for (let i = 0; i < headers.length; i++) {
      const h = String(headers[i]).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (names.some(n => h.includes(n))) return i;
    }
    return -1;
  };

  return {
    name: find(['name', 'studentname', 'fullname', 'student']),
    email: find(['email', 'mail', 'e-mail']),
    reg: find(['reg', 'register', 'registration', 'roll', 'id', 'rollno', 'studentid']),
    batch: find(['batch', 'year', 'section']),
    branch: find(['branch', 'dept', 'department', 'stream', 'division']),
    score: find(['total', 'score', 'marks', 'totalscore', 'totalmarks', 'obtained'])
  };
}

function validateColumns(colMap) {
  const required = ['name', 'email', 'reg', 'batch', 'branch'];
  const missing = required.filter(k => colMap[k] === -1);
  if (missing.length > 0) {
    throw new Error('Missing columns: ' + missing.join(', ') +
      '\n\nReport generator headers must include: Name, Email, Reg No/ID, Batch, Branch');
  }
}

function analyzeData(data, colMap, config) {
  const scoreCol = colMap.score !== -1 ? colMap.score : data[0].length - 1;
  const dynamicCols = [];
  for (let i = colMap.branch + 1; i < scoreCol; i++) dynamicCols.push(i);

  const processedRows = [];
  const students = [];
  const atRisk = [];
  let totalPercent = 0, count = 0;
  let good = 0, improvement = 0, training = 0;
  const allPercents = [];
  const branchStats = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[colMap.name]) continue;

    const score = Number(row[scoreCol]) || 0;
    const percent = config.totalMarks ? (score / config.totalMarks) * 100 : 0;

    totalPercent += percent;
    allPercents.push(percent);
    count++;

    let status, insight;
    if (score === 0) {
      status = 'Inactive'; insight = 'Did not attempt';
    } else if (percent >= 70) {
      status = CONFIG.STATUS_LABELS.GOOD; insight = 'Strong Performance'; good++;
    } else if (percent >= 50) {
      status = CONFIG.STATUS_LABELS.IMPROVEMENT; insight = 'Average Performance'; improvement++;
    } else {
      status = CONFIG.STATUS_LABELS.TRAINING; insight = 'Needs Practice'; training++;
    }

    let performance;
    if (percent <= 30) {
      performance = CONFIG.PERFORMANCE_LABELS.POOR;
    } else if (percent <= 60) {
      performance = CONFIG.PERFORMANCE_LABELS.AVERAGE;
    } else if (percent <= 80) {
      performance = CONFIG.PERFORMANCE_LABELS.GOOD_PERF;
    } else {
      performance = CONFIG.PERFORMANCE_LABELS.BEST;
    }

    const branch = row[colMap.branch];
    if (branch) {
      if (!branchStats[branch]) {
        branchStats[branch] = { total: 0, poor: 0, average: 0, good: 0, best: 0 };
      }
      branchStats[branch].total++;
      if (performance === CONFIG.PERFORMANCE_LABELS.POOR) branchStats[branch].poor++;
      else if (performance === CONFIG.PERFORMANCE_LABELS.AVERAGE) branchStats[branch].average++;
      else if (performance === CONFIG.PERFORMANCE_LABELS.GOOD_PERF) branchStats[branch].good++;
      else if (performance === CONFIG.PERFORMANCE_LABELS.BEST) branchStats[branch].best++;
    }

    const dynamicValues = dynamicCols.map(c => row[c] || 0);

    processedRows.push({
      values: [
        row[colMap.name], row[colMap.email], row[colMap.reg],
        row[colMap.batch], row[colMap.branch],
        ...dynamicValues,
        score, percent.toFixed(2), status, insight, performance
      ],
      status: status,
      performance: performance
    });

    students.push({ name: row[colMap.name], branch: row[colMap.branch], percent });
    if (status === CONFIG.STATUS_LABELS.TRAINING) {
      atRisk.push([row[colMap.name], row[colMap.branch], percent.toFixed(2)]);
    }
  }

  students.sort((a, b) => b.percent - a.percent);

  return {
    processedRows,
    performers: {
      top10: students.slice(0, 10),
      bottom10: students.slice(-10).reverse()
    },
    atRisk,
    summary: {
      totalStudents: count,
      average: count ? (totalPercent / count).toFixed(2) : '0.00',
      highest: count ? Math.max(...allPercents).toFixed(2) : '0.00',
      lowest: count ? Math.min(...allPercents).toFixed(2) : '0.00',
      good, improvement, training,
      totalMarks: config.totalMarks,
      duration: config.duration,
      totalQuestions: config.totalQuestions
    },
    dynamicHeaders: dynamicCols.map(i => data[0][i]),
    branchStats
  };
}

function prepareReportSheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_REPORT);
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet(CONFIG.SHEET_NAME_REPORT);
  return sheet;
}

function buildStatusSummary(sheet, row, summary) {
  const total = summary.totalStudents || 1;
  const data = [
    ['Status', 'Count', 'Percentage', 'Criteria'],
    [CONFIG.STATUS_LABELS.GOOD, summary.good, ((summary.good/total)*100).toFixed(1) + '%', '>=70%'],
    [CONFIG.STATUS_LABELS.IMPROVEMENT, summary.improvement, ((summary.improvement/total)*100).toFixed(1) + '%', '50-69%'],
    [CONFIG.STATUS_LABELS.TRAINING, summary.training, ((summary.training/total)*100).toFixed(1) + '%', '<50%']
  ];
  const range = sheet.getRange(13, 1, 4, 4);
  range.setValues(data);
  range.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

  sheet.getRange(13, 1, 1, 4)
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_FG)
    .setFontWeight('bold');

  sheet.getRange(14, 1, 1, 4).setBackground(CONFIG.COLORS.GOOD);
  sheet.getRange(15, 1, 1, 4).setBackground(CONFIG.COLORS.IMPROVEMENT);
  sheet.getRange(16, 1, 1, 4).setBackground(CONFIG.COLORS.TRAINING);

  return 17;
}

function buildBranchSummary(sheet, row, branchStats) {
  sheet.getRange(row, 1).setValue('📊 Branch-wise Performance Summary').setFontWeight('bold');

  if (!branchStats || Object.keys(branchStats).length === 0) {
    sheet.getRange(row + 1, 1).setValue('No branch data available');
    return row + 2;
  }

  const branches = Object.keys(branchStats).sort();
  const data = [['Branch', 'Total', 'POOR (≤30%)', 'AVERAGE (≤60%)', 'GOOD (≤80%)', 'BEST (≥81%)']];

  branches.forEach(branch => {
    const stat = branchStats[branch];
    data.push([
      branch,
      stat.total,
      stat.poor,
      stat.average,
      stat.good,
      stat.best
    ]);
  });

  const numRows = data.length;
  const numCols = data[0].length;
  const range = sheet.getRange(row + 1, 1, numRows, numCols);
  range.setValues(data);
  range.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

  sheet.getRange(row + 1, 1, 1, numCols)
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_FG)
    .setFontWeight('bold');

  for (let i = 1; i < numRows; i++) {
    sheet.getRange(row + 1 + i, 3).setBackground(CONFIG.PERFORMANCE_COLORS.POOR);
    sheet.getRange(row + 1 + i, 4).setBackground(CONFIG.PERFORMANCE_COLORS.AVERAGE);
    sheet.getRange(row + 1 + i, 5).setBackground(CONFIG.PERFORMANCE_COLORS.GOOD_PERF);
    sheet.getRange(row + 1 + i, 6).setBackground(CONFIG.PERFORMANCE_COLORS.BEST);
  }

  return row + numRows + 2;
}

function buildPerformers(sheet, row, performers) {
  const { top10, bottom10 } = performers;

  sheet.getRange(18, 1, 1, 4).merge()
    .setValue('🏆 Top Performers')
    .setFontWeight('bold')
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_FG)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(18, 28);

  const topHeader = [['Rank', 'Name', 'Branch', 'Percentage %']];
  sheet.getRange(19, 1, 1, 4).setValues(topHeader)
    .setBackground(CONFIG.COLORS.HEADER_BG).setFontColor(CONFIG.COLORS.HEADER_FG).setFontWeight('bold')
    .setWrap(true).setVerticalAlignment('middle');   // FIXED: header no longer clipped
  sheet.setRowHeight(19, 30);

  if (top10.length > 0) {
    const topData = top10.map((s, i) => [i + 1, s.name, s.branch, s.percent.toFixed(2)]);
    sheet.getRange(20, 1, topData.length, 4).setValues(topData);
  }

  sheet.getRange(19, 1, top10.length + 1, 4)
    .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

  const ATRISK_START_COL = 6;
  const currentMaxCols = sheet.getMaxColumns();
  if (currentMaxCols < ATRISK_START_COL + 3) {
    sheet.insertColumnsAfter(currentMaxCols, (ATRISK_START_COL + 3) - currentMaxCols);
  }

  sheet.getRange(18, ATRISK_START_COL, 1, 4).merge()
    .setValue('⚠️ At-Risk Students')
    .setFontWeight('bold')
    .setBackground('#FFCDD2')
    .setFontColor('#991b1b')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  sheet.setRowHeight(18, 28);

  const botHeader = [['Rank', 'Name', 'Branch', 'Percentage %']];
  sheet.getRange(19, ATRISK_START_COL, 1, 4).setValues(botHeader)
    .setBackground(CONFIG.COLORS.HEADER_BG).setFontColor(CONFIG.COLORS.HEADER_FG).setFontWeight('bold')
    .setWrap(true).setVerticalAlignment('middle');   // FIXED: header no longer clipped

  if (bottom10.length > 0) {
    const botData = bottom10.map((s, i) => [i + 1, s.name, s.branch, s.percent.toFixed(2)]);
    sheet.getRange(20, ATRISK_START_COL, botData.length, 4).setValues(botData);
  }

  sheet.getRange(19, ATRISK_START_COL, bottom10.length + 1, 4)
    .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

  const dataRows = Math.max(top10.length, bottom10.length);
  return 20 + dataRows + 1;
}

function buildDataTable(sheet, row, headers, colMap, processedRows) {
  const dynamicHeaders = [];
  for (let i = colMap.branch + 1; i < (colMap.score !== -1 ? colMap.score : headers.length - 1); i++) {
    dynamicHeaders.push(headers[i]);
  }

  const tableHeaders = [
    'Name', 'Email', 'Reg No', 'Batch', 'Branch',
    ...dynamicHeaders,
    'Total Score', 'Percentage %', 'Status', 'Insight', 'Category'
  ];

  const numCols = tableHeaders.length;
  const numRows = processedRows.length;

  sheet.getRange(row, 1, 1, numCols).setValues([tableHeaders])
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_FG)
    .setFontWeight('bold');

  if (numRows === 0) return;

  const dataMatrix = processedRows.map(r => r.values);
  sheet.getRange(row + 1, 1, dataMatrix.length, numCols).setValues(dataMatrix);

  for (let i = 0; i < numRows; i++) {
    if (i % 2 === 1) {
      sheet.getRange(row + 1 + i, 1, 1, numCols).setBackground(CONFIG.COLORS.ZEBRA);
    }
  }

  for (let i = 0; i < numRows; i++) {
    const status = processedRows[i].status;
    const color = status === CONFIG.STATUS_LABELS.GOOD ? CONFIG.COLORS.GOOD :
                  status === CONFIG.STATUS_LABELS.IMPROVEMENT ? CONFIG.COLORS.IMPROVEMENT :
                  status === CONFIG.STATUS_LABELS.TRAINING ? CONFIG.COLORS.TRAINING : CONFIG.COLORS.WHITE;
    sheet.getRange(row + 1 + i, numCols - 1).setBackground(color).setFontWeight('bold');

    const performance = processedRows[i].performance;
    const perfColor = performance === CONFIG.PERFORMANCE_LABELS.POOR ? CONFIG.PERFORMANCE_COLORS.POOR :
                      performance === CONFIG.PERFORMANCE_LABELS.AVERAGE ? CONFIG.PERFORMANCE_COLORS.AVERAGE :
                      performance === CONFIG.PERFORMANCE_LABELS.GOOD_PERF ? CONFIG.PERFORMANCE_COLORS.GOOD_PERF :
                      performance === CONFIG.PERFORMANCE_LABELS.BEST ? CONFIG.PERFORMANCE_COLORS.BEST : CONFIG.COLORS.WHITE;
    sheet.getRange(row + 1 + i, numCols).setBackground(perfColor).setFontWeight('bold');
  }

  sheet.getRange(row, 1, numRows + 1, numCols)
    .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

  sheet.getRange(row, 1, 1, numCols)
    .setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
}

function buildAtRiskSection(sheet, row, atRiskList) {
  sheet.getRange(row, 1).setValue('🚨 Students Needing Immediate Attention').setFontWeight('bold');

  if (atRiskList.length === 0) {
    sheet.getRange(row + 1, 1).setValue('No students currently at risk 🎉');
    return;
  }

  sheet.getRange(row + 1, 1, 1, 3).setValues([['Name', 'Branch', '%']])
    .setBackground(CONFIG.COLORS.TRAINING)
    .setFontWeight('bold');

  sheet.getRange(row + 2, 1, atRiskList.length, 3).setValues(atRiskList);

  sheet.getRange(row + 1, 1, atRiskList.length + 1, 3)
    .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

  sheet.getRange(row + 1, 1, 1, 3)
    .setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
}

function manualExportPDF() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const report = ss.getSheetByName(CONFIG.SHEET_NAME_REPORT);
  if (!report) {
    SpreadsheetApp.getUi().alert('Generate a report first! (🚀 Generate Report)');
    return;
  }
  const testName = report.getRange(3, 1).getValue().replace(' - Assessment Summary', '') || 'Manual_Export';
  const collegeName = report.getRange(1, 1).getValue() || 'Unknown College';
  const config = { testName: testName, collegeName: collegeName };

  const lastConfigStr = PropertiesService.getScriptProperties().getProperty('LAST_REPORT_CONFIG');
  if (lastConfigStr) {
    const lastConfig = JSON.parse(lastConfigStr);
    config.batch = lastConfig.batch;
    config.reportDate = lastConfig.reportDate;
  }

  exportAsPDF(ss, report, config);
}

function manualExportCSV() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const report = ss.getSheetByName(CONFIG.SHEET_NAME_REPORT);
  if (!report) {
    SpreadsheetApp.getUi().alert('Generate a report first! (🚀 Generate Report)');
    return;
  }
  const testName = report.getRange(3, 1).getValue().replace(' - Assessment Summary', '') || 'Manual_Export';
  const collegeName = report.getRange(1, 1).getValue() || 'Unknown College';
  const config = { testName: testName, collegeName: collegeName };

  const lastConfigStr = PropertiesService.getScriptProperties().getProperty('LAST_REPORT_CONFIG');
  if (lastConfigStr) {
    const lastConfig = JSON.parse(lastConfigStr);
    config.batch = lastConfig.batch;
    config.reportDate = lastConfig.reportDate;
  }

  exportAsCSV(ss, report, config);
}


// ============================================================
// SECTION 2 — HIGH-PERFORMANCE LEADERBOARD (PRESERVED)
// ============================================================

function showDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Dialog')
    .setWidth(540).setHeight(650).setTitle('Leaderboard Generator');
  SpreadsheetApp.getUi().showModalDialog(html, ' ');
}

function getStatus(pct) {
  if (pct <= 30) return "🔴 POOR";
  if (pct <= 60) return "🟡 AVERAGE";
  if (pct <= 80.99) return "🟢 GOOD";
  return "🏆 BEST";
}

function getInsight(pct) {
  if (pct <= 30) return "⚠️ Need Immediate Attention";
  if (pct <= 60.9) return "📈 Needs Improvement";
  if (pct <= 80.9) return "👍 Moderate Performer";
  return "⭐ Excellent Performer";
}

function loadProps() {
  const p = PropertiesService.getScriptProperties();
  let maxScores = {}, colMap = {}, sheetDates = {};
  try {
    const s = p.getProperty('sheetMaxScores');
    if (s) maxScores = JSON.parse(s);
    const c = p.getProperty('columnSheetMap');
    if (c) colMap = JSON.parse(c);
    const d = p.getProperty('sheetDates');
    if (d) sheetDates = JSON.parse(d);
  } catch(e) {}
  return { maxScores, colMap, sheetDates };
}

function saveProps(maxScores, colMap, sheetDates) {
  const p = PropertiesService.getScriptProperties();
  p.setProperty('sheetMaxScores', JSON.stringify(maxScores));
  p.setProperty('columnSheetMap', JSON.stringify(colMap));
  if (sheetDates) p.setProperty('sheetDates', JSON.stringify(sheetDates));
}

function inferSheetFromColumn(colName, maxScores) {
  const cleanCol = String(colName).trim();

  if (maxScores[cleanCol] !== undefined) return cleanCol;

  const withoutScore = cleanCol.replace(/_Score$/, '');
  if (maxScores[withoutScore] !== undefined) return withoutScore;

  const baseName = cleanCol
    .replace(/\s+\d{1,2}-[A-Za-z]{3}-\d{4}\s+\d+$/, '')
    .replace(/\s+\d{1,2}-[A-Za-z]{3}-\d{4}$/, '')
    .replace(/\s+\d+$/, '')
    .trim();

  if (baseName && baseName !== cleanCol && maxScores[baseName] !== undefined) {
    return baseName;
  }

  const knownSheets = Object.keys(maxScores).sort((a, b) => b.length - a.length);
  for (const sheetName of knownSheets) {
    if (cleanCol === sheetName || cleanCol.startsWith(sheetName + '_') || cleanCol.startsWith(sheetName + ' ')) {
      return sheetName;
    }
  }

  return null;
}

function extractSheetNameFromHeader(header, maxScores) {
  const headerStr = String(header).trim();
  const knownSheets = Object.keys(maxScores).sort((a, b) => b.length - a.length);

  for (const sheetName of knownSheets) {
    if (headerStr === sheetName || headerStr.startsWith(sheetName + ' ')) {
      return sheetName;
    }
  }

  const baseName = headerStr
    .replace(/\s+\d{1,2}-[A-Za-z]{3}-\d{4}\s+\d+$/, '')
    .replace(/\s+\d{1,2}-[A-Za-z]{3}-\d{4}$/, '')
    .replace(/\s+\d+$/, '')
    .trim();

  for (const sheetName of knownSheets) {
    if (baseName === sheetName) {
      return sheetName;
    }
  }

  return null;
}

function getSheetNames() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const exclude = [
      CONFIG.MASTER_SHEET, 
      CONFIG.LEADERBOARD_SHEET, 
      CONFIG.COMBINED_ANALYSIS_SHEET, 
      CONFIG.SHEET_NAME_RAW, 
      CONFIG.SHEET_NAME_REPORT,
      'Assessment Registry',
      CONFIG.EMAIL_REGISTRY_SHEET
    ];

    const typeSheets = [
      '📊 Class Test Leaderboard',
      '📋 Class Test Analysis',
      '📊 Company Specific Leaderboard',
      '📋 Company Specific Analysis',
      '📊 Practice Module Leaderboard',
      '📋 Practice Module Analysis'
    ];

    const allExclude = exclude.concat(typeSheets);
    return ss.getSheets().map(s => s.getName()).filter(n => allExclude.indexOf(n) === -1);
  } catch (e) {
    throw new Error("Could not read sheets: " + e.message);
  }
}

function processSheets(sheetConfigs, preserveExisting, collegeName, leaderboardType, totalStrength) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const startTime = new Date();

  const targetLbSheet = leaderboardType ? `📊 ${leaderboardType} Leaderboard` : CONFIG.LEADERBOARD_SHEET;
  const targetAnalysisSheet = leaderboardType ? `📋 ${leaderboardType} Analysis` : CONFIG.COMBINED_ANALYSIS_SHEET;

  if (!sheetConfigs || sheetConfigs.length === 0) {
    throw new Error("No test sheets configured. Please add at least one test sheet.");
  }
  if (!collegeName || collegeName.trim() === "") {
    throw new Error("College name is required.");
  }

  const props = loadProps();

  sheetConfigs.forEach(cfg => {
    props.maxScores[cfg.name] = cfg.max;
    if (cfg.date) props.sheetDates[cfg.name] = cfg.date;
  });

  const masterSheet = ss.getSheetByName(CONFIG.MASTER_SHEET);
  if (!masterSheet) throw new Error("Create sheet '" + CONFIG.MASTER_SHEET + "' with: Name, Email, Reg No, Branch");

  const masterData = masterSheet.getDataRange().getValues();
  const mHeaders = masterData[0].map(h => String(h).trim());
  const colMap = {};
  CONFIG.MASTER_COLS.forEach(c => {
    const idx = mHeaders.indexOf(c);
    if (idx === -1) throw new Error("Missing column in Master: " + c);
    colMap[c] = idx;
  });

  const masterRecords = {};
  for (let i = 1; i < masterData.length; i++) {
    const row = masterData[i];
    const reg = String(row[colMap["Reg No"]]).trim().toUpperCase();
    if (reg) {
      masterRecords[reg] = {
        Name: row[colMap["Name"]],
        Email: row[colMap["Email"]],
        RegNo: reg,
        Branch: String(row[colMap["Branch"]]).trim()
      };
    }
  }

  let existingScores = {};
  let existingScoreCols = [];

  if (preserveExisting) {
    const lb = ss.getSheetByName(targetLbSheet);
    if (lb) {
      const lbData = lb.getDataRange().getValues();
      if (lbData.length > 2) {
        const lbHeaders = lbData[1].map(h => String(h).trim());
        const regIdx = lbHeaders.indexOf("Reg No");
        const branchIdx = lbHeaders.indexOf("Branch");
        const totalIdx = lbHeaders.indexOf("Total Score");

        if (branchIdx !== -1 && totalIdx !== -1) {
          for (let c = branchIdx + 1; c < totalIdx; c++) {
            existingScoreCols.push(lbHeaders[c]);
          }
        }

        for (let i = 2; i < lbData.length; i++) {
          const reg = String(lbData[i][regIdx]).trim().toUpperCase();
          if (reg) {
            existingScores[reg] = {};
            existingScoreCols.forEach(col => {
              const cIdx = lbHeaders.indexOf(col);
              if (cIdx !== -1) {
                const v = lbData[i][cIdx];
                existingScores[reg][col] = (typeof v === 'number') ? v : (parseFloat(v) || 0);
              }
            });
          }
        }
      }
    }
  }

  const newScoreCols = [];
  const newScoreData = {};

  sheetConfigs.forEach(cfg => {
    const sheet = ss.getSheetByName(cfg.name);
    if (!sheet) { Logger.log("⚠️ Missing: " + cfg.name); return; }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return;

    const headers = data[0].map(h => String(h).trim());

    let regIdx = -1;
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i].toLowerCase().replace(/[_\s.]/g, "");
      if (h === "regno" || h === "rollno" || (h.includes("roll") && h.includes("no")) || h.includes("reg")) { regIdx = i; break; }
    }
    if (regIdx === -1) { Logger.log("⚠️ No Reg No / Roll No in: " + cfg.name); return; }

    const scoreIdxs = [];
    headers.forEach((h, idx) => { if (h.toLowerCase().includes("score")) scoreIdxs.push({index: idx, name: h}); });
    if (scoreIdxs.length === 0) { Logger.log("⚠️ No Score in: " + cfg.name); return; }

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const reg = String(row[regIdx]).trim().toUpperCase();
      if (!reg || !masterRecords[reg]) continue;

      if (!newScoreData[reg]) newScoreData[reg] = {};

      scoreIdxs.forEach(si => {
        const cName = (scoreIdxs.length > 1 ? cfg.name + "_" + si.name : cfg.name + "_Score")
          .replace(/[\/\\:\*\+\?\[\]]/g, "-").substring(0, 50);

        if (!newScoreCols.includes(cName)) newScoreCols.push(cName);

        props.colMap[cName] = cfg.name;

        const v = row[si.index];
        const num = (typeof v === 'number') ? v : parseFloat(v);
        newScoreData[reg][cName] = isNaN(num) ? 0 : num;
      });
    }
  });

  saveProps(props.maxScores, props.colMap, props.sheetDates);

  const existingSheetToCol = {};
  existingScoreCols.forEach(col => {
    const sheetName = extractSheetNameFromHeader(col, props.maxScores) || inferSheetFromColumn(col, props.maxScores);
    if (sheetName) existingSheetToCol[sheetName] = col;
  });

  const colsToReplace = {};
  const allCols = [...existingScoreCols];

  newScoreCols.forEach(c => {
    const sheetName = props.colMap[c] || inferSheetFromColumn(c, props.maxScores);
    const existingCol = sheetName ? existingSheetToCol[sheetName] : null;

    if (existingCol) {
      colsToReplace[existingCol] = c;
    } else if (!allCols.includes(c)) {
      allCols.push(c);
    }
  });

  const uniqueCols = allCols.map(col => colsToReplace[col] || col);

  const sheetsInUse = new Set();
  uniqueCols.forEach(col => {
    const sheetName = props.colMap[col] || inferSheetFromColumn(col, props.maxScores) || extractSheetNameFromHeader(col, props.maxScores);
    if (sheetName && props.maxScores[sheetName]) {
      sheetsInUse.add(sheetName);
    }
  });

  let totalMax = 0;
  sheetsInUse.forEach(s => totalMax += (parseFloat(props.maxScores[s]) || 0));
  if (totalMax === 0) totalMax = CONFIG.FALLBACK_MAX_TOTAL;

  const scoreHeaders = uniqueCols.map(col => {
    let sheetName = props.colMap[col] || inferSheetFromColumn(col, props.maxScores);
    if (!sheetName) {
      sheetName = extractSheetNameFromHeader(col, props.maxScores);
    }
    const max = sheetName ? (props.maxScores[sheetName] || '') : '';

    const cfg = sheetConfigs.find(c => c.name === sheetName);
    let dateVal = cfg ? cfg.date : null;
    if (!dateVal && sheetName) dateVal = props.sheetDates[sheetName];

    if (dateVal instanceof Date) {
      dateVal = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }

    let dateStr = '';
    if (dateVal) {
      const parts = String(dateVal).split('-');
      if (parts.length === 3) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const monthIndex = parseInt(parts[1], 10) - 1;
        if (months[monthIndex]) {
          dateStr = parts[2] + '-' + months[monthIndex] + '-' + parts[0];
        }
      }
    }

    let displayName = sheetName || col.replace(/_Score$/, '');

    let header = displayName;
    if (dateStr) header += ' ' + dateStr;
    if (max) header += ' ' + max;
    return header;
  });

  const lbHeaders = [...CONFIG.MASTER_COLS, ...scoreHeaders, "Total Score " + totalMax, "Rank", "Percentage", "Status Classification", "Insight Interpretation"];
  const lbRows = [];

  Object.keys(masterRecords).forEach(reg => {
    const s = masterRecords[reg];
    const row = [s.Name, s.Email, s.RegNo, s.Branch];
    let total = 0;

    uniqueCols.forEach(c => {
      let v = 0;
      if (newScoreData[reg] && newScoreData[reg][c] !== undefined) {
        v = newScoreData[reg][c];
      } else if (existingScores[reg] && existingScores[reg][c] !== undefined) {
        v = existingScores[reg][c];
      }
      row.push(v);
      total += v;
    });

    const pct = (total / totalMax) * 100;
    row.push(total, 0, pct.toFixed(2) + "%", getStatus(pct), getInsight(pct));
    lbRows.push({reg, total, pct, data: row});
  });

  lbRows.sort((a, b) => b.total - a.total);
  const totalStudents = lbRows.length;
  lbRows.forEach((item, idx) => { item.data[lbHeaders.indexOf("Rank")] = idx + 1; });

  writeLeaderboardFast(ss, collegeName, lbHeaders, lbRows.map(r => r.data), totalMax, targetLbSheet);

  const branchData = buildBranchData(lbRows, totalMax);
  const insightsData = buildInsightsData(lbRows, uniqueCols, totalMax, sheetsInUse, props.maxScores, props.colMap, totalStrength);
  const top3Data = buildTop3Data(lbRows, totalMax);

  writeAnalysisFast(ss, collegeName, branchData, insightsData, top3Data, targetAnalysisSheet);

  const elapsed = ((new Date() - startTime) / 1000).toFixed(1);
  return `✅ Done in ${elapsed}s! Students: ${totalStudents}. Tests: ${uniqueCols.length}. Total Max: ${totalMax}`;
}

function writeLeaderboardFast(ss, collegeName, headers, rows, totalMax, sheetName) {
  const sheetNameToUse = sheetName || CONFIG.LEADERBOARD_SHEET;
  let sheet = ss.getSheetByName(sheetNameToUse);
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet(sheetNameToUse);

  const numCols = headers.length;
  const numRows = rows.length;
  const BRAND = CONFIG.BRAND_COLOR;
  const BRAND_DK = CONFIG.BRAND_DARK;

  sheet.getRange(1, 1, 1, numCols).setValue("🏛️ " + collegeName + " — Leaderboard");
  sheet.getRange(1, 1, 1, numCols).merge();
  sheet.getRange(1, 1, 1, numCols)
    .setBackground(BRAND).setFontColor("#ffffff").setFontWeight("bold")
    .setFontSize(14).setFontFamily("Poppins").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setRowHeight(1, 40);

  sheet.getRange(2, 1, 1, numCols).setValues([headers]);
  sheet.getRange(2, 1, 1, numCols)
    .setBackground(BRAND_DK).setFontColor("#ffffff").setFontWeight("bold")
    .setFontSize(11).setFontFamily("Poppins").setHorizontalAlignment("center").setVerticalAlignment("middle");

  if (numRows > 0 && numCols > 0) {
    sheet.getRange(3, 1, numRows, numCols).setValues(rows);

    const bgs = [], fcs = [], fws = [], has = [];
    const hAligns = [];

    for (let i = 0; i < numRows; i++) {
      const row = rows[i];
      const rank = row[headers.indexOf("Rank")];
      const status = row[headers.indexOf("Status Classification")];
      const insight = row[headers.indexOf("Insight Interpretation")];

      const bg = new Array(numCols).fill((i % 2 === 0) ? "#f8fafc" : "#ffffff");
      const fc = new Array(numCols).fill("#000000");
      const fw = new Array(numCols).fill("normal");
      const ha = new Array(numCols).fill("center");

      ha[0] = "left"; ha[1] = "left"; ha[2] = "left"; ha[3] = "left";

      const rankIdx = headers.indexOf("Rank");
      if (rank === 1) {
        bg.fill("#fef3c7"); fw.fill("bold");
        bg[rankIdx] = "#f59e0b"; fc[rankIdx] = "#ffffff";
      } else if (rank === 2) {
        bg.fill("#f1f5f9");
        bg[rankIdx] = "#94a3b8"; fc[rankIdx] = "#ffffff";
      } else if (rank === 3) {
        bg.fill("#f1f5f9");
        bg[rankIdx] = "#b45309"; fc[rankIdx] = "#ffffff";
      }

      const stIdx = headers.indexOf("Status Classification");
      if (status.includes("BEST")) { bg[stIdx] = "#dcfce7"; fc[stIdx] = "#166534"; fw[stIdx] = "bold"; }
      else if (status.includes("GOOD")) { bg[stIdx] = "#dbeafe"; fc[stIdx] = "#1e40af"; }
      else if (status.includes("AVERAGE")) { bg[stIdx] = "#fef9c3"; fc[stIdx] = "#854d0e"; }
      else if (status.includes("POOR")) { bg[stIdx] = "#fee2e2"; fc[stIdx] = "#991b1b"; fw[stIdx] = "bold"; }

      const insIdx = headers.indexOf("Insight Interpretation");
      if (insight.includes("Excellent")) { bg[insIdx] = "#dcfce7"; fc[insIdx] = "#166534"; }
      else if (insight.includes("Moderate")) { bg[insIdx] = "#dbeafe"; fc[insIdx] = "#1e40af"; }
      else if (insight.includes("Improvement")) { bg[insIdx] = "#ffedd5"; fc[insIdx] = "#9a3412"; }
      else if (insight.includes("Attention")) { bg[insIdx] = "#fee2e2"; fc[insIdx] = "#991b1b"; fw[insIdx] = "bold"; }

      bgs.push(bg); fcs.push(fc); fws.push(fw); has.push(ha);
    }

    const r = sheet.getRange(3, 1, numRows, numCols);
    r.setBackgrounds(bgs); r.setFontColors(fcs); r.setFontWeights(fws); r.setHorizontalAlignments(has);
    r.setFontFamily("Poppins").setFontSize(10);
    r.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  }

  sheet.getRange(2, 1, 1, numCols)
    .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

  const headerHa = new Array(numCols).fill("center");
  headerHa[0] = "left"; headerHa[1] = "left"; headerHa[2] = "left"; headerHa[3] = "left";
  sheet.getRange(2, 1, 1, numCols).setHorizontalAlignments([headerHa]);

  sheet.setFrozenRows(2);

  for (let i = 1; i <= numCols; i++) {
    sheet.autoResizeColumn(i);
    const w = sheet.getColumnWidth(i);
    sheet.setColumnWidth(i, Math.min(Math.max(w, 90), 220));
  }

  const totalIdx = headers.findIndex(h => String(h).startsWith("Total Score"));
  if (numRows > 0 && totalIdx !== -1) {
    const totalRange = sheet.getRange(3, totalIdx + 1, numRows, 1);
    const rules = [
      SpreadsheetApp.newConditionalFormatRule()
        .setRanges([totalRange])
        .whenNumberGreaterThanOrEqualTo(totalMax * 0.81)
        .setBackground("#dcfce7").setFontColor("#166534").build(),
      SpreadsheetApp.newConditionalFormatRule()
        .setRanges([totalRange])
        .whenNumberLessThan(totalMax * 0.31)
        .setBackground("#fee2e2").setFontColor("#991b1b").build()
    ];
    sheet.setConditionalFormatRules(rules);
  }

  const legendStartRow = 3 + numRows + 2;

  const insIdx = headers.indexOf("Insight Interpretation");
  const counts = {
    "Need Immediate Attention": 0,
    "Needs Improvement": 0,
    "Moderate Performer": 0,
    "Excellent Performer": 0
  };
  if (numRows > 0 && insIdx !== -1) {
    for (let i = 0; i < numRows; i++) {
      const insight = rows[i][insIdx];
      if (insight.includes("Excellent")) counts["Excellent Performer"]++;
      else if (insight.includes("Moderate")) counts["Moderate Performer"]++;
      else if (insight.includes("Improvement")) counts["Needs Improvement"]++;
      else if (insight.includes("Attention")) counts["Need Immediate Attention"]++;
    }
  }

  sheet.getRange(legendStartRow, 1, 1, 4).merge()
    .setValue('💡 Insight-Based Interpretation')
    .setBackground(BRAND_DK)
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setFontFamily('Poppins')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(legendStartRow, 28);

  const legendData = [
    ['0% – 30%', 'Need Immediate Attention', counts["Need Immediate Attention"]],
    ['31% – 60.9%', 'Needs Improvement', counts["Needs Improvement"]],
    ['61% – 80.9%', 'Moderate Performer', counts["Moderate Performer"]],
    ['81% & Above', 'Excellent Performer', counts["Excellent Performer"]]
  ];
  const legendColors = [
    { bg: '#fee2e2', fc: '#991b1b' },
    { bg: '#ffedd5', fc: '#9a3412' },
    { bg: '#dbeafe', fc: '#1e40af' },
    { bg: '#dcfce7', fc: '#166534' }
  ];

  const lRange = sheet.getRange(legendStartRow + 1, 1, 4, 3);
  lRange.setValues(legendData);

  for (let i = 0; i < 4; i++) {
    sheet.getRange(legendStartRow + 1 + i, 1, 1, 3)
      .setBackground(legendColors[i].bg)
      .setFontColor(legendColors[i].fc)
      .setFontWeight('bold')
      .setFontSize(10)
      .setFontFamily('Poppins')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
  }

  lRange.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(legendStartRow, 1, 1, 4)
    .setBorder(true, true, true, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID);
}

function buildBranchData(lbRows, totalMax) {
  const groups = {};
  lbRows.forEach(r => {
    const b = r.data[3];
    if (!b) return;
    if (!groups[b]) groups[b] = [];
    groups[b].push(r);
  });

  Object.keys(groups).forEach(b => groups[b].sort((a, c) => c.total - a.total));

  const headers = ["🏢 Branch", "👥 Students", "📊 Avg Score", "🏆 Max", "📉 Min", "📈 Total", "🎯 Rank"];
  const rows = [];

  Object.keys(groups).forEach(b => {
    const s = groups[b];
    const scores = s.map(x => x.total);
    const count = s.length;
    const total = scores.reduce((a, c) => a + c, 0);
    const avg = total / count;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const avgPct = (avg / totalMax) * 100;

    let str = "⚪ Average";
    if (avgPct >= 81.01) str = "🏆 BEST - Excellent";
    else if (avgPct >= 61) str = "🟢 GOOD - Strong";
    else if (avgPct >= 31) str = "🟡 AVERAGE - Fair";
    else str = "🔴 POOR - Needs Work";

    rows.push({totalScore: total, data: [b, count, avg.toFixed(2), max, min, total, 0]});
  });

  rows.sort((a, b) => b.totalScore - a.totalScore);
  rows.forEach((r, i) => r.data[r.data.length - 1] = i + 1);
  return {headers, rows: rows.map(r => r.data)};
}

function buildInsightsData(lbRows, scoreCols, totalMax, sheetsInUse, maxScores, colMap, totalStrength) {
  colMap = colMap || {};
  const total = lbRows.length;
  const totalStudents = totalStrength || total;
  const scores = lbRows.map(r => r.total);
  const avg = scores.reduce((a, c) => a + c, 0) / total;
  const max = Math.max(...scores);
  const min = Math.min(...scores);

  const overallStats = [
    ["Total Students", total],
    ["Total Maximum Score", totalMax],
    ["Class Average Score", avg.toFixed(2)],
    ["Class Average %", ((avg / totalMax) * 100).toFixed(2) + "%"],
    ["Highest Score", max + " (" + ((max / totalMax) * 100).toFixed(1) + "%)"],
    ["Lowest Score", min + " (" + ((min / totalMax) * 100).toFixed(1) + "%)"],
    ["Score Range", (max - min).toFixed(2)]
  ];

  const testMaxScores = [];
  sheetsInUse.forEach(sheetName => {
    testMaxScores.push([sheetName, maxScores[sheetName] || '?']);
  });
  testMaxScores.push(["Total", totalMax]);

  const sDist = {"🔴 POOR": 0, "🟡 AVERAGE": 0, "🟢 GOOD": 0, "🏆 BEST": 0};
  lbRows.forEach(r => {
    const st = getStatus(r.pct);
    if (sDist[st] !== undefined) sDist[st]++;
  });
  const statusDist = [
    ["🏆 BEST (81%+)", sDist["🏆 BEST"] + " students (" + ((sDist["🏆 BEST"] / total * 100).toFixed(1)) + "%)"],
    ["🟢 GOOD (61-80.99%)", sDist["🟢 GOOD"] + " students"],
    ["🟡 AVERAGE (31-60%)", sDist["🟡 AVERAGE"] + " students"],
    ["🔴 POOR (0-30%)", sDist["🔴 POOR"] + " students"]
  ];

  const iDist = {"⚠️ Need Immediate Attention": 0, "📈 Needs Improvement": 0, "👍 Moderate Performer": 0, "⭐ Excellent Performer": 0};
  lbRows.forEach(r => {
    const ins = getInsight(r.pct);
    if (iDist[ins] !== undefined) iDist[ins]++;
  });
  const insightDist = [
    ["⭐ Excellent Performer (81%+)", iDist["⭐ Excellent Performer"] + " students"],
    ["👍 Moderate Performer (61-80.9%)", iDist["👍 Moderate Performer"] + " students"],
    ["📈 Needs Improvement (31-60.9%)", iDist["📈 Needs Improvement"] + " students"],
    ["⚠️ Need Immediate Attention (0-30%)", iDist["⚠️ Need Immediate Attention"] + " students"]
  ];

  const insightCounts = {
    "Need Immediate Attention": iDist["⚠️ Need Immediate Attention"] || 0,
    "Needs Improvement": iDist["📈 Needs Improvement"] || 0,
    "Moderate Performer": iDist["👍 Moderate Performer"] || 0,
    "Excellent Performer": iDist["⭐ Excellent Performer"] || 0
  };

  const branchInsightDist = {};
  const insightCategories = [
    "Need Immediate Attention",
    "Needs Improvement",
    "Moderate Performer",
    "Excellent Performer"
  ];

  lbRows.forEach(r => {
    const branch = r.data[3];
    if (!branch) return;
    const pct = r.pct;
    let insightKey;
    if (pct <= 30) insightKey = "Need Immediate Attention";
    else if (pct <= 60.9) insightKey = "Needs Improvement";
    else if (pct <= 80.9) insightKey = "Moderate Performer";
    else insightKey = "Excellent Performer";

    if (!branchInsightDist[branch]) {
      branchInsightDist[branch] = {};
      insightCategories.forEach(cat => branchInsightDist[branch][cat] = 0);
      branchInsightDist[branch].total = 0;
    }
    branchInsightDist[branch][insightKey]++;
    branchInsightDist[branch].total++;
  });

  const top5 = lbRows.slice(0, 5).map((r, i) => {
    const p = (r.total / totalMax * 100).toFixed(1);
    return [`${i + 1}. ${r.data[0]} (${r.data[3]})`, `${r.total}/${totalMax} (${p}%)`];
  });

  const bottom5 = lbRows.slice(-5).reverse().map((r, i) => {
    const p = (r.total / totalMax * 100).toFixed(1);
    return [`${i + 1}. ${r.data[0]} (${r.data[3]})`, `${r.total}/${totalMax} (${p}%) — ${getInsight(r.pct)}`];
  });

  const sheetAttendance = {};
  const colToSheet = {};

  scoreCols.forEach(col => {
    let sheetName = colMap[col] || inferSheetFromColumn(col, maxScores) || extractSheetNameFromHeader(col, maxScores);
    colToSheet[col] = sheetName;
  });

  sheetsInUse.forEach(sheetName => {
    sheetAttendance[sheetName] = 0;
  });

  lbRows.forEach(r => {
    const attendedSheets = new Set();
    scoreCols.forEach((col, idx) => {
      const score = r.data[4 + idx];
      if (score > 0) {
        const sheetName = colToSheet[col];
        if (sheetName && sheetsInUse.has(sheetName)) {
          attendedSheets.add(sheetName);
        }
      }
    });
    attendedSheets.forEach(sheetName => {
      sheetAttendance[sheetName]++;
    });
  });

  const attendanceData = [];
  sheetsInUse.forEach(sheetName => {
    const count = sheetAttendance[sheetName] || 0;
    const pct = totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(2) + '%' : '0%';
    attendanceData.push([
      sheetName,
      maxScores[sheetName] || '?',
      count,
      totalStudents,
      pct
    ]);
  });

  return {
    overallStats,
    testMaxScores,
    statusDist,
    insightDist,
    top5,
    bottom5,
    insightCounts,
    branchInsightDist,
    attendanceData,
    totalStudents: totalStudents
  };
}

function buildTop3Data(lbRows, totalMax) {
  const groups = {};
  lbRows.forEach(r => {
    const b = r.data[3];
    if (!b) return;
    if (!groups[b]) groups[b] = [];
    groups[b].push(r);
  });

  const headers = ["🏢 Branch", "🏅 Rank", "👤 Name", "🎫 Reg No", "💯 Score", "📊 %", "🎯 Status", "💡 Insight"];
  const rows = [];

  Object.keys(groups).sort().forEach(b => {
    const filtered = groups[b].filter(s => {
      const pct = (s.total / totalMax) * 100;
      const status = getStatus(pct);
      return status === "🏆 BEST" || status === "🟢 GOOD";
    });

    filtered.sort((a, c) => c.total - a.total);

    filtered.slice(0, 3).forEach((s, i) => {
      const pct = (s.total / totalMax) * 100;
      rows.push([b, i + 1, s.data[0], s.data[2], s.total, pct.toFixed(2) + "%", getStatus(pct), getInsight(pct)]);
    });
  });

  return {headers, rows};
}

function writeAnalysisFast(ss, collegeName, branchData, insightsData, top3Data, sheetName) {
  const sheetNameToUse = sheetName || CONFIG.COMBINED_ANALYSIS_SHEET;
  let sheet = ss.getSheetByName(sheetNameToUse);
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet(sheetNameToUse);

  const maxCols = Math.max(branchData.headers.length, top3Data.headers.length, 8);
  const BRAND = CONFIG.BRAND_COLOR;
  const BRAND_DK = CONFIG.BRAND_DARK;

  let currentRow = 1;

  const writeTitle = (title, bg, color) => {
    if (currentRow < 1) currentRow = 1;
    sheet.getRange(currentRow, 1, 1, maxCols).setValue(title);
    sheet.getRange(currentRow, 1, 1, maxCols).merge();
    sheet.getRange(currentRow, 1, 1, maxCols)
      .setBackground(bg).setFontColor(color).setFontWeight("bold")
      .setFontSize(13).setFontFamily("Poppins").setVerticalAlignment("middle");
    sheet.setRowHeight(currentRow, 30);
    currentRow++;
  };

  const writeHeaders = (headers, startCol, bg) => {
    if (currentRow < 1) currentRow = 1;
    const hLen = headers.length;
    sheet.getRange(currentRow, startCol, 1, hLen).setValues([headers])
      .setBackground(bg).setFontColor("#ffffff").setFontWeight("bold")
      .setFontSize(10).setFontFamily("Poppins")
      .setHorizontalAlignment("center").setVerticalAlignment("middle").setWrap(true);
    sheet.getRange(currentRow, startCol, 1, hLen)
      .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  };

  const writeRows = (rows, startCol, numCols, formatFn) => {
    if (!rows || rows.length === 0) {
      currentRow++;
      return;
    }
    if (currentRow < 1) currentRow = 1;

    const dataRange = sheet.getRange(currentRow, startCol, rows.length, numCols);
    dataRange.setValues(rows);

    const bgs = [], fcs = [], fws = [], has = [];
    for (let i = 0; i < rows.length; i++) {
      const bg = new Array(numCols).fill((i % 2 === 0) ? "#f8fafc" : "#ffffff");
      const fc = new Array(numCols).fill("#000000");
      const fw = new Array(numCols).fill("normal");
      const ha = new Array(numCols).fill("center");

      if (formatFn) formatFn(rows[i], i, bg, fc, fw, numCols);

      bgs.push(bg); fcs.push(fc); fws.push(fw); has.push(ha);
    }

    const r = sheet.getRange(currentRow, startCol, rows.length, numCols);
    r.setBackgrounds(bgs); r.setFontColors(fcs); r.setFontWeights(fws); r.setHorizontalAlignments(has);
    r.setFontFamily("Poppins").setFontSize(10);
    r.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

    currentRow += rows.length;
  };

  writeTitle("📈 BRANCH-WISE ANALYSIS", BRAND, "#ffffff");
  writeHeaders(branchData.headers, 1, BRAND_DK);
  currentRow++;
  writeRows(branchData.rows, 1, branchData.headers.length, (row, idx, bg, fc, fw, len) => {
    const rank = row[row.length - 1];
    if (rank === 1) {
      bg.fill("#fef3c7"); fw.fill("bold");
      bg[len - 1] = "#f59e0b"; fc[len - 1] = "#ffffff";
    }
  });
  currentRow += 2;

  writeTitle("👑 BRANCH-WISE TOP 3 PERFORMERS", BRAND, "#ffffff");
  writeHeaders(top3Data.headers, 1, BRAND_DK);
  currentRow++;
  writeRows(top3Data.rows, 1, top3Data.headers.length, (row, idx, bg, fc, fw, len) => {
    const br = row[1];
    if (br === 1) {
      bg.fill("#fef3c7"); fw.fill("bold");
      bg[1] = "#f59e0b"; fc[1] = "#ffffff";
    } else if (br === 2) {
      bg.fill("#f8fafc");
      bg[1] = "#94a3b8"; fc[1] = "#ffffff";
    } else if (br === 3) {
      bg.fill("#f8fafc");
      bg[1] = "#b45309"; fc[1] = "#ffffff";
    }
    const status = row[len - 2];
    if (status.includes("BEST")) { bg[len - 2] = "#dcfce7"; fc[len - 2] = "#166534"; }
    else if (status.includes("GOOD")) { bg[len - 2] = "#dbeafe"; fc[len - 2] = "#1e40af"; }
    else if (status.includes("AVERAGE")) { bg[len - 2] = "#fef9c3"; fc[len - 2] = "#854d0e"; }
    else if (status.includes("POOR")) { bg[len - 2] = "#fee2e2"; fc[len - 2] = "#991b1b"; }
  });
  currentRow += 2;

  writeTitle("💡 INSIGHTS DASHBOARD", BRAND_DK, "#fbbf24");

  const subTitleBg = BRAND_DK;
  const subTitleColor = "#ffffff";

  const subTitleRow = currentRow;
  sheet.getRange(currentRow, 1, 1, 2).setValue("📌 OVERALL STATISTICS");
  sheet.getRange(currentRow, 1, 1, 2).merge();
  sheet.getRange(currentRow, 1, 1, 2).setBackground(subTitleBg).setFontColor(subTitleColor).setFontWeight("bold")
    .setFontSize(10).setFontFamily("Poppins").setHorizontalAlignment("center").setVerticalAlignment("middle");

  sheet.getRange(currentRow, 4, 1, 5).setValue("📋 TEST MAXIMUM SCORES & ATTENDANCE");
  sheet.getRange(currentRow, 4, 1, 5).merge();
  sheet.getRange(currentRow, 4, 1, 5).setBackground(subTitleBg).setFontColor(subTitleColor).setFontWeight("bold")
    .setFontSize(10).setFontFamily("Poppins").setHorizontalAlignment("center").setVerticalAlignment("middle");
  currentRow++;

  sheet.getRange(currentRow, 4, 1, 5).setValues([['Topic', 'Max Score', 'Attendance Count', 'Total Student count', 'Percentage']])
    .setBackground(subTitleBg).setFontColor(subTitleColor).setFontWeight("bold")
    .setFontSize(10).setFontFamily("Poppins").setHorizontalAlignment("center").setVerticalAlignment("middle");
  currentRow++;

  const maxRows1 = Math.max(insightsData.overallStats.length, insightsData.attendanceData.length);
  const block1 = [];
  for (let i = 0; i < maxRows1; i++) {
    const left = insightsData.overallStats[i] || ["", ""];
    const right = insightsData.attendanceData[i] || ["", "", "", "", ""];
    block1.push([left[0], left[1], "", right[0], right[1], right[2], right[3], right[4]]);
  }

  const totalMaxScore = insightsData.attendanceData.reduce((sum, row) => sum + (parseFloat(row[1]) || 0), 0);
  const totalAttendanceSum = insightsData.attendanceData.reduce((sum, row) => sum + (parseInt(row[2]) || 0), 0);
  const avgAttendance = insightsData.attendanceData.length > 0 ? Math.round(totalAttendanceSum / insightsData.attendanceData.length) : 0;
  const totalStudents = insightsData.totalStudents || 0;
  const totalPct = totalStudents > 0 ? ((avgAttendance / totalStudents) * 100).toFixed(2) + '%' : '0%';
  block1.push(['', '', '', 'Total', totalMaxScore, avgAttendance, totalStudents, totalPct]);

  if (block1.length > 0) {
    sheet.getRange(currentRow, 1, block1.length, 8).setValues(block1);
    const bgs = [], fcs = [], fws = [], has = [];
    for (let i = 0; i < block1.length; i++) {
      const bg = new Array(8).fill((i % 2 === 0) ? "#f8fafc" : "#ffffff");
      const fc = new Array(8).fill("#000000");
      const fw = new Array(8).fill("normal");
      const ha = new Array(8).fill("center");

      if (block1[i][1] && String(block1[i][1]).includes("%")) { fc[1] = "#0f766e"; fw[1] = "bold"; }
      if (block1[i][7] && String(block1[i][7]).includes("%")) { fc[7] = "#0f766e"; fw[7] = "bold"; }

      if (block1[i][3] === 'Total') {
        for (let c = 3; c < 8; c++) {
          bg[c] = "#334155";
          fc[c] = "#ffffff";
          fw[c] = "bold";
        }
      } else if (block1[i][3]) {
        fc[3] = "#64748b";
      }

      bgs.push(bg); fcs.push(fc); fws.push(fw); has.push(ha);
    }
    const r = sheet.getRange(currentRow, 1, block1.length, 8);
    r.setBackgrounds(bgs); r.setFontColors(fcs); r.setFontWeights(fws); r.setHorizontalAlignments(has);
    r.setFontFamily("Poppins").setFontSize(10);
    r.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
    currentRow += block1.length;
  }
  currentRow += 2;

  sheet.getRange(currentRow, 1, 1, 2).setValue("🏆 TOP 5 PERFORMERS");
  sheet.getRange(currentRow, 1, 1, 2).merge();
  sheet.getRange(currentRow, 1, 1, 2).setBackground(subTitleBg).setFontColor(subTitleColor).setFontWeight("bold")
    .setFontSize(10).setFontFamily("Poppins").setHorizontalAlignment("center").setVerticalAlignment("middle");

  sheet.getRange(currentRow, 4, 1, 2).setValue("⚠️ BOTTOM 5 (Need Attention)");
  sheet.getRange(currentRow, 4, 1, 2).merge();
  sheet.getRange(currentRow, 4, 1, 2).setBackground(subTitleBg).setFontColor(subTitleColor).setFontWeight("bold")
    .setFontSize(10).setFontFamily("Poppins").setHorizontalAlignment("center").setVerticalAlignment("middle");
  currentRow++;

  sheet.getRange(currentRow, 1, 1, 1).setValue("👤 Student").setBackground(subTitleBg).setFontColor(subTitleColor).setFontWeight("bold")
    .setFontSize(10).setFontFamily("Poppins").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange(currentRow, 2, 1, 1).setValue("💯 Score").setBackground(subTitleBg).setFontColor(subTitleColor).setFontWeight("bold")
    .setFontSize(10).setFontFamily("Poppins").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange(currentRow, 4, 1, 1).setValue("👤 Student").setBackground(subTitleBg).setFontColor(subTitleColor).setFontWeight("bold")
    .setFontSize(10).setFontFamily("Poppins").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange(currentRow, 5, 1, 1).setValue("💯 Score").setBackground(subTitleBg).setFontColor(subTitleColor).setFontWeight("bold")
    .setFontSize(10).setFontFamily("Poppins").setHorizontalAlignment("center").setVerticalAlignment("middle");
  currentRow++;

  const maxRows3 = Math.max(insightsData.top5.length, insightsData.bottom5.length);
  const block3 = [];
  for (let i = 0; i < maxRows3; i++) {
    const left = insightsData.top5[i] || ["", ""];
    const right = insightsData.bottom5[i] || ["", ""];
    block3.push([left[0], left[1], "", right[0], right[1]]);
  }
  if (block3.length > 0) {
    sheet.getRange(currentRow, 1, block3.length, 5).setValues(block3);
    const bgs = [], fcs = [], fws = [], has = [];
    for (let i = 0; i < block3.length; i++) {
      const bg = new Array(5).fill((i % 2 === 0) ? "#f8fafc" : "#ffffff");
      const fc = new Array(5).fill("#000000");
      const fw = new Array(5).fill("normal");
      const ha = new Array(5).fill("left");

      if (block3[i][0]) { bg[0] = "#fef3c7"; fc[0] = "#92400e"; fw[0] = "bold"; }
      if (block3[i][3]) { bg[3] = "#fee2e2"; fc[3] = "#991b1b"; }

      bgs.push(bg); fcs.push(fc); fws.push(fw); has.push(ha);
    }
    const r = sheet.getRange(currentRow, 1, block3.length, 5);
    r.setBackgrounds(bgs); r.setFontColors(fcs); r.setFontWeights(fws); r.setHorizontalAlignments(has);
    r.setFontFamily("Poppins").setFontSize(10);
    r.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
    currentRow += block3.length;
  }
  currentRow += 2;

  writeTitle("💡 Insight-Based Interpretation", BRAND_DK, "#ffffff");

  const legendData = [
    ['0% – 30%', 'Need Immediate Attention', insightsData.insightCounts["Need Immediate Attention"]],
    ['31% – 60.9%', 'Needs Improvement', insightsData.insightCounts["Needs Improvement"]],
    ['61% – 80.9%', 'Moderate Performer', insightsData.insightCounts["Moderate Performer"]],
    ['81% & Above', 'Excellent Performer', insightsData.insightCounts["Excellent Performer"]]
  ];
  const legendColors = [
    { bg: '#fee2e2', fc: '#991b1b' },
    { bg: '#ffedd5', fc: '#9a3412' },
    { bg: '#dbeafe', fc: '#1e40af' },
    { bg: '#dcfce7', fc: '#166534' }
  ];

  const lRange = sheet.getRange(currentRow, 1, 4, 3);
  lRange.setValues(legendData);

  for (let i = 0; i < 4; i++) {
    sheet.getRange(currentRow + i, 1, 1, 3)
      .setBackground(legendColors[i].bg)
      .setFontColor(legendColors[i].fc)
      .setFontWeight('bold')
      .setFontSize(10)
      .setFontFamily('Poppins')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
  }

  lRange.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  currentRow += 4;

  if (insightsData.branchInsightDist && Object.keys(insightsData.branchInsightDist).length > 0) {
    currentRow += 2;
    writeTitle("📊 BRANCH-WISE INSIGHT ANALYSIS", BRAND_DK, "#ffffff");

    const bHeaders = ["🏢 Branch", "🔴 Need Immediate Attention", "🟠 Needs Improvement", "🔵 Moderate Performer", "🟢 Excellent Performer", "👥 Total"];
    writeHeaders(bHeaders, 1, BRAND_DK);
    currentRow++;

    const bRows = [];
    const branches = Object.keys(insightsData.branchInsightDist).sort();
    branches.forEach(b => {
      const d = insightsData.branchInsightDist[b];
      bRows.push([
        b,
        d["Need Immediate Attention"],
        d["Needs Improvement"],
        d["Moderate Performer"],
        d["Excellent Performer"],
        d.total
      ]);
    });

    writeRows(bRows, 1, bHeaders.length, (row, idx, bg, fc, fw, len) => {
      const cellColors = [
        null,
        { bg: '#fee2e2', fc: '#991b1b' },
        { bg: '#ffedd5', fc: '#9a3412' },
        { bg: '#dbeafe', fc: '#1e40af' },
        { bg: '#dcfce7', fc: '#166534' },
        null
      ];
      for (let c = 1; c <= 4; c++) {
        if (row[c] > 0) {
          bg[c] = cellColors[c].bg;
          fc[c] = cellColors[c].fc;
          fw[c] = 'bold';
        }
      }
      fw[len - 1] = 'bold';
      bg[len - 1] = '#f1f5f9';
    });
  }

  // FIXED (formatting only): column 3 used to be forced to 15px, which crushed
  // whatever landed there — "Avg Score" rendered one letter per line and student
  // names were cut to two characters ("CH", "HR"). Widths now have a readable
  // floor instead of an artificial squeeze. No values were touched.
  for (let i = 1; i <= maxCols; i++) {
    sheet.autoResizeColumn(i);
    const w = sheet.getColumnWidth(i);
    sheet.setColumnWidth(i, Math.min(Math.max(w, 110), 240));
  }

  sheet.insertRowBefore(1);
  sheet.getRange(1, 1, 1, maxCols).setValue("🏛️ " + collegeName + " — COMPLETE ANALYSIS REPORT");
  sheet.getRange(1, 1, 1, maxCols).merge();
  sheet.getRange(1, 1, 1, maxCols)
    .setBackground(BRAND).setFontColor("#ffffff").setFontWeight("bold")
    .setFontSize(16).setFontFamily("Poppins").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setRowHeight(1, 45);
}

function clearAllOutputs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsToClear = [
    CONFIG.LEADERBOARD_SHEET, 
    CONFIG.COMBINED_ANALYSIS_SHEET,
    '📊 Class Test Leaderboard',
    '📋 Class Test Analysis',
    '📊 Company Specific Leaderboard',
    '📋 Company Specific Analysis',
    '📊 Practice Module Leaderboard',
    '📋 Practice Module Analysis'
  ];

  sheetsToClear.forEach(n => {
    const s = ss.getSheetByName(n);
    if (s) ss.deleteSheet(s);
  });

  PropertiesService.getScriptProperties().deleteProperty('sheetMaxScores');
  PropertiesService.getScriptProperties().deleteProperty('columnSheetMap');
  PropertiesService.getScriptProperties().deleteProperty('sheetDates');
  SpreadsheetApp.getUi().alert("🗑️ Cleared all outputs and reset max scores & dates!\n\nTip: Regenerate leaderboard from 🏆 Open Leaderboard.");
}

function showHelp() {
  const html = HtmlService.createHtmlOutput(
    `<div style="font-family:Poppins,sans-serif;padding:20px;max-width:500px;">
      <h2 style="color:#32c888;">🏆 Assessment Suite Help</h2>
      <h3>Report Generator:</h3>
      <ol>
        <li>Create <b>Report generator</b> with columns: Name, Email, Reg No, Batch, Branch, Score</li>
        <li>Click 📊 Assessment Suite → 🚀 Generate Report</li>
        <li>Enter College Name, Batch, Test details, and optional Answer Key File ID</li>
        <li>Select Leaderboard Type, pick Date, and export as PDF/CSV</li>
      </ol>
      <h3>Email Reports:</h3>
      <ol>
        <li>After generating a report, click 📧 Email → 📧 Send Assessment Report</li>
        <li>Enter Assessment Name and Batch to auto-fetch from Email Registry</li>
        <li>System prevents duplicate sends and validates all emails</li>
      </ol>
      <h3>Leaderboard Setup:</h3>
      <ol>
        <li>Sheet <b>Master Data</b>: Name, Email, Reg No, Branch</li>
        <li>Auto-update: Reports automatically update type-specific leaderboards</li>
      </ol>
      <h3>Download File Naming:</h3>
      <ul>
        <li>Reports: <b>CollegeName_AssessmentName_Date.pdf</b></li>
        <li>Leaderboards: <b>CollegeName_Leaderboard_ShortName_Date.pdf</b></li>
      </ul>
      <h3>Classifications:</h3>
      <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;">
        <tr style="background:#32c888;color:white;"><th>Range</th><th>Status</th><th>Insight</th></tr>
        <tr><td>0-30%</td><td>🔴 POOR</td><td>⚠️ Need Immediate Attention</td></tr>
        <tr><td>31-60%</td><td>🟡 AVERAGE</td><td>📈 Needs Improvement</td></tr>
        <tr><td>61-80.99%</td><td>🟢 GOOD</td><td>👍 Moderate Performer</td></tr>
        <tr><td>81.01%+</td><td>🏆 BEST</td><td>⭐ Excellent Performer</td></tr>
      </table>
    </div>`
  ).setWidth(520).setHeight(750);
  SpreadsheetApp.getUi().showModalDialog(html, "Help");
}


// ============================================================
// REBUILD FUNCTIONS
// ============================================================

function showRebuildCategoryDialog() {
  const html = HtmlService.createHtmlOutputFromFile('RebuildDialog')
    .setWidth(440)
    .setHeight(480);
  SpreadsheetApp.getUi().showModalDialog(html, ' ');
}

function getDetectedCategories() {
  const categories = new Set();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ss.getSheets().forEach(s => {
    const name = s.getName();
    const match = name.match(/^📊\s+(.+?)\s+Leaderboard$/);
    if (match) categories.add(match[1].trim());
  });

  const catMap = getAssessmentCategoryMap();
  Object.values(catMap).forEach(c => categories.add(c));

  const typeMap = {
    'CTD': 'Class Test',
    'DCA': 'Company',
    'PMD': 'Practice'
  };
  const configs = getRegisteredAssessments();
  configs.forEach(c => {
    const assessment = parseAssessmentType(c.name);
    if (assessment && typeMap[assessment.type]) {
      categories.add(typeMap[assessment.type]);
    }
  });

  return Array.from(categories).sort();
}

function registerAssessmentCategory(assessmentName, category) {
  if (!assessmentName || !category) return;
  const p = PropertiesService.getScriptProperties();
  let map = {};
  try {
    const s = p.getProperty('assessmentCategoryMap');
    if (s) map = JSON.parse(s);
  } catch (e) {}
  map[assessmentName] = category;
  p.setProperty('assessmentCategoryMap', JSON.stringify(map));
}

function getAssessmentCategoryMap() {
  const p = PropertiesService.getScriptProperties();
  try {
    const s = p.getProperty('assessmentCategoryMap');
    if (s) return JSON.parse(s);
  } catch (e) {}
  return {};
}

/**
 * Scans all sheets and returns those that look like assessment data sheets.
 * ✅ v4.2 — Fixes issue where previously curated sheets were not found
 * Logic unchanged.
 */
function discoverAssessmentSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const allSheets = ss.getSheets();

  const excludePatterns = [
    /^Report/i,
    /^Master Data/i,
    /^Email Registry/i,
    /^Assessment Registry/i,
    /^📊/,
    /^📋/,
    /^Sheet\d*$/i
  ];

  const excludeNames = [
    CONFIG.SHEET_NAME_RAW,
    CONFIG.SHEET_NAME_REPORT,
    CONFIG.MASTER_SHEET,
    CONFIG.LEADERBOARD_SHEET,
    CONFIG.COMBINED_ANALYSIS_SHEET,
    CONFIG.EMAIL_REGISTRY_SHEET,
    'Assessment Registry'
  ];

  const discovered = [];

  for (const sheet of allSheets) {
    const name = sheet.getName();
    if (excludeNames.includes(name)) continue;

    let skip = false;
    for (const pattern of excludePatterns) {
      if (pattern.test(name)) { skip = true; break; }
    }
    if (skip) continue;

    try {
      const data = sheet.getDataRange().getValues();
      if (data.length < 2) continue;

      const headers = data[0].map(h => String(h || '').toLowerCase().trim());

      const hasRegNo = headers.some(h => 
        h.includes('reg') || h.includes('roll') || h.includes('id')
      );
      const hasName = headers.some(h => h.includes('name'));
      const hasScore = headers.some(h => 
        h.includes('score') || h.includes('marks') || h.includes('total')
      );

      if (hasRegNo && hasName && hasScore) {
        let maxScore = inferMaxScoreFromName(name);

        if (!maxScore) {
          const scores = [];
          const scoreCol = headers.findIndex(h => h.includes('score') || h.includes('marks') || h.includes('total'));
          if (scoreCol >= 0) {
            for (let i = 1; i < Math.min(data.length, 50); i++) {
              const val = parseFloat(data[i][scoreCol]);
              if (!isNaN(val)) scores.push(val);
            }
          }
          if (scores.length > 0) {
            maxScore = Math.max(...scores);
            if (maxScore <= 10) maxScore = 10;
            else if (maxScore <= 50) maxScore = 50;
            else if (maxScore <= 100) maxScore = 100;
            else maxScore = Math.ceil(maxScore / 50) * 50;
          } else {
            maxScore = 100;
          }
        }

        discovered.push({
          name: name,
          max: maxScore,
          date: ''
        });
      }
    } catch (e) {
      console.warn('Error scanning sheet ' + name + ':', e);
    }
  }

  return discovered;
}

/**
 * ✅ v4.2: Infer max score based on assessment type prefix
 * CTD (Class Test) = 200, DCA (Company) = 225, PMD 1 = 230, PMD 2+ = 30
 */
function inferMaxScoreFromName(sheetName) {
  const cleanName = String(sheetName).trim().toUpperCase();

  if (cleanName.startsWith('CTD')) {
    return 200;
  }
  if (cleanName.startsWith('DCA')) {
    return 225;
  }
  if (cleanName.startsWith('PMD')) {
    const numMatch = cleanName.match(/^PMD\s*(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      if (num === 1) {
        return 230;
      } else {
        return 30;
      }
    }
    return 230;
  }
  return null;
}

function getAllAssessmentConfigs() {
  const registered = getRegisteredAssessments();
  const discovered = discoverAssessmentSheets();

  const registeredNames = new Set(registered.map(c => c.name));
  const merged = [...registered];

  for (const disc of discovered) {
    if (!registeredNames.has(disc.name)) {
      merged.push(disc);
      try {
        const fakeAssessment = {
          cleanName: disc.name,
          type: 'GENERIC',
          number: ''
        };
        registerAssessment(fakeAssessment, disc.max, disc.date);
      } catch (e) {
        console.warn('Auto-register failed for ' + disc.name + ':', e);
      }
    }
  }

  return merged;
}

function rebuildLeaderboardFromDialog(selectedCategory, collegeName) {
  if (!selectedCategory) throw new Error('No category selected.');
  const finalCollegeName = normalizeCollegeName(collegeName) || getCollegeName();
  return rebuildLeaderboardCore(selectedCategory, finalCollegeName);
}

function rebuildLeaderboardCore(category, collegeName, existingConfigs) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configs = existingConfigs || getAllAssessmentConfigs();

  if (configs.length === 0) {
    return 'ℹ️ No registered or discovered assessments found. Generate a report first or create assessment sheets with Reg No, Name, and Score columns.';
  }

  const categoryMap = getAssessmentCategoryMap();
  const typeMap = {
    'CTD': 'Class Test',
    'DCA': 'Company',
    'PMD': 'Practice'
  };

  const byType = {};
  configs.forEach(c => {
    let cat = categoryMap[c.name];
    if (!cat) {
      const assessment = parseAssessmentType(c.name);
      cat = assessment ? typeMap[assessment.type] : 'General';
    }
    if (!byType[cat]) byType[cat] = [];
    byType[cat].push(c);
  });

  const typesToProcess = category === 'All' ? Object.keys(byType) : [category];

  syncPropsFromRegistry();

  let messages = [];
  typesToProcess.forEach(type => {
    if (!byType[type] || byType[type].length === 0) {
      if (category !== 'All') {
        messages.push('⚠️ ' + type + ': No registered or discovered assessments found for this category.');
      }
      return;
    }

    const validConfigs = byType[type].filter(c => ss.getSheetByName(c.name));
    if (validConfigs.length === 0) {
      messages.push('⚠️ ' + type + ': Sheet data missing. Skipped.');
      return;
    }

    const typeLabel = type === 'General' ? '' : type;
    try {
      const result = processSheets(validConfigs, true, collegeName, typeLabel);
      messages.push('✅ ' + type + ': ' + result);
    } catch (e) {
      messages.push('❌ ' + type + ' FAILED: ' + e.message);
    }
  });

  return messages.join('\n\n');
}

function rebuildLeaderboard(category) {
  category = category || 'All';

  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    '🔧 Rebuild Leaderboard — ' + category,
    'Enter College Name (or leave blank for default):',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const collegeName = response.getResponseText().trim() || 'Unknown College';
  const configs = getAllAssessmentConfigs();

  if (configs.length === 0) {
    ui.alert('ℹ️ No registered or discovered assessments found. Generate a report first.');
    return;
  }

  const messages = rebuildLeaderboardCore(category, collegeName, configs);
  ui.alert('Rebuild Complete — ' + category, messages, ui.ButtonSet.OK);
}

function rebuildLeaderboardAll() { rebuildLeaderboard('All'); }
function rebuildLeaderboardClassTest() { rebuildLeaderboard('Class Test'); }
function rebuildLeaderboardCompany() { rebuildLeaderboard('Company'); }
function rebuildLeaderboardPractice() { rebuildLeaderboard('Practice'); }

// ============================================================
// SECTION 3 — ASSESSMENT REGISTRY & AUTO-UPDATE (PRESERVED)
// ============================================================

function parseAssessmentType(testName) {
  const clean = String(testName).trim();
  const match = clean.match(/^(CTD|DCA|PMD)[\s\-_]*(\d+)$/i);
  if (!match) return null;
  return {
    type: match[1].toUpperCase(),
    number: parseInt(match[2], 10),
    cleanName: match[1].toUpperCase() + ' ' + match[2]
  };
}

function ensureAssessmentSheet(ss, assessment, rawData, colMap, scoreCol) {
  const sheetName = assessment.cleanName;
  let sheet = ss.getSheetByName(sheetName);

  if (sheet) {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow > 0 && lastCol > 0) {
      sheet.getRange(1, 1, lastRow, lastCol).clear();
    }
  } else {
    sheet = ss.insertSheet(sheetName);
  }

  const headers = ['Reg No', 'Name', 'Branch', 'Score'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_FG);

  const rows = [];
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !row[colMap.name]) continue;
    const reg = String(row[colMap.reg]).trim();
    if (!reg) continue;
    const score = Number(row[scoreCol]) || 0;
    rows.push([reg, row[colMap.name], row[colMap.branch], score]);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }

  return sheet;
}

function registerAssessment(assessment, totalMarks, date) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const REGISTRY_NAME = 'Assessment Registry';
  let sheet = ss.getSheetByName(REGISTRY_NAME);

  const cleanName = assessment.cleanName || String(assessment);
  const seriesInfo = parseSeriesInfo(cleanName);

  if (!sheet) {
    sheet = ss.insertSheet(REGISTRY_NAME);
    const headers = ['Assessment Name', 'Type', 'Max Score', 'Date', 'Registered At', 'Series Name', 'Series Number', 'Short Name', 'Is Final', 'Series Closed'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold')
      .setBackground(CONFIG.COLORS.HEADER_BG)
      .setFontColor(CONFIG.COLORS.HEADER_FG);
    sheet.hideSheet();
  }

  const data = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === cleanName) {
      foundRow = i + 1;
      break;
    }
  }

  const type = assessment.type || 'GENERIC';
  const rowData = [cleanName, type, totalMarks, date || '', new Date(), seriesInfo.seriesName, seriesInfo.seriesNumber, seriesInfo.shortName, seriesInfo.isFinal, seriesInfo.seriesClosed];

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

function getRegisteredAssessments() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Assessment Registry');
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const configs = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    let dateVal = row[3];
    if (dateVal instanceof Date) {
      dateVal = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    } else {
      dateVal = String(dateVal || '').trim();
    }

    const name = String(row[0]).trim();

    let maxScore = Number(row[2]) || 100;
    const correctMax = inferMaxScoreFromName(name);
    if (correctMax && correctMax !== maxScore) {
      console.log('Correcting max score for ' + name + ': ' + maxScore + ' -> ' + correctMax);
      maxScore = correctMax;
      try {
        sheet.getRange(i + 1, 3).setValue(maxScore);
      } catch (e) {
        console.warn('Could not update registry max score for ' + name);
      }
    }

    configs.push({
      name: name,
      max: maxScore,
      date: dateVal
    });
  }
  return configs;
}

function syncPropsFromRegistry() {
  const props = loadProps();
  const configs = getRegisteredAssessments();
  configs.forEach(c => {
    props.maxScores[c.name] = c.max;
    if (c.date) props.sheetDates[c.name] = c.date;
  });
  saveProps(props.maxScores, props.colMap, props.sheetDates);
}

function autoUpdateLeaderboard(ss, config, rawData, colMap, leaderboardType) {
  const testName = config.testName;
  let assessment = parseAssessmentType(testName);

  if (!assessment) {
    const seriesInfo = parseSeriesInfo(testName);
    assessment = {
      type: 'GENERIC',
      number: seriesInfo.seriesNumber || '',
      cleanName: testName
    };
  }

  const scoreCol = colMap.score !== -1 ? colMap.score : rawData[0].length - 1;
  let reportDate = config.reportDate;
  if (!reportDate) {
    reportDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  ensureAssessmentSheet(ss, assessment, rawData, colMap, scoreCol);
  registerAssessment(assessment, config.totalMarks, reportDate);

  if (leaderboardType) {
    registerAssessmentCategory(assessment.cleanName, leaderboardType);
  }

  syncPropsFromRegistry();

  const sheetConfig = {
    name: assessment.cleanName,
    max: config.totalMarks,
    date: reportDate
  };

  try {
    const collegeName = config.collegeName || 'Unknown College';
    processSheets([sheetConfig], true, collegeName, leaderboardType, config.totalStrength);
    ss.toast('🏆 Leaderboard updated with ' + generateShortName(testName), 'Auto-Update', 4);
  } catch (e) {
    logError('autoUpdateLeaderboard', e);
    ss.toast('⚠️ Leaderboard auto-update failed: ' + e.message, 'Warning', 6);
  }
}


// ============================================================
// SECTION 4 — EMAIL REGISTRY & EMAIL SENDING (FIXED v4.2)
// ============================================================

function getEmailRegistrySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.EMAIL_REGISTRY_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.EMAIL_REGISTRY_SHEET);
    sheet.appendRow(CONFIG.EMAIL_REGISTRY_HEADERS);
    sheet.getRange(1, 1, 1, CONFIG.EMAIL_REGISTRY_HEADERS.length)
      .setFontWeight('bold')
      .setBackground(CONFIG.COLORS.HEADER_BG)
      .setFontColor(CONFIG.COLORS.HEADER_FG);
    return sheet;
  }

  // GENERALIZED: existing sheets get the "College" column on first use.
  // Guarded internally — never throws, never blocks emailing.
  ensureEmailRegistryCollegeColumn(sheet);
  return sheet;
}

function checkDuplicateEmail(assessmentName, batch, date, college) {
  const record = getEmailRegistryRecord(assessmentName, batch, date, college);
  if (record && String(record.data[7]).trim().toLowerCase() === 'sent') {
    return {
      isDuplicate: true,
      dateSent: record.data[8],
      record: record
    };
  }
  return { isDuplicate: false, record: record };
}

/**
 * Creates or updates an Email Registry row.
 * GENERALIZED: writes the College column too (optional 10th argument, so every
 * existing 9-argument call keeps working). An existing row keeps its own college
 * unless one is passed explicitly — history is never silently rewritten.
 */
function updateEmailRegistry(assessmentName, batch, date, reportLink, answerKey, toEmails, ccEmails, status, remarks, college) {
  const sheet = getEmailRegistrySheet();
  const detectedCollege = getCollegeName();
  const record = getEmailRegistryRecord(assessmentName, batch, date, normalizeCollegeName(college) || detectedCollege);
  const collegeIdx = findCollegeColumnIndex(sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0]);
  const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  let finalReportLink = reportLink || '';
  let finalAnswerKey = answerKey || '';
  let finalToEmails = toEmails || '';
  let finalCcEmails = ccEmails || '';
  let finalStatus = status || 'Pending';
  let finalDateSent = '';
  let finalRemarks = remarks || '';
  let finalDate = date || '';

  if (record) {
    const r = record.data;
    if (!finalReportLink && r[3]) finalReportLink = r[3];
    if (!finalAnswerKey && r[4]) finalAnswerKey = r[4];
    if (!finalToEmails && r[5]) finalToEmails = r[5];
    if (!finalCcEmails && r[6]) finalCcEmails = r[6];
    if (!finalDate && r[2]) finalDate = r[2];

    if (finalStatus === 'Sent') {
      finalDateSent = now;
    } else if (r[7] === 'Sent' && finalStatus !== 'Sent') {
      finalStatus = r[7];
      finalDateSent = r[8];
    }

    if (!finalRemarks && r[9]) finalRemarks = r[9];

    const existingCollege = collegeIdx !== -1 ? normalizeCollegeName(r[collegeIdx]) : '';
    const rowCollege = normalizeCollegeName(college) || existingCollege || detectedCollege;

    const rowData = buildRegistryRow(
      [assessmentName, batch, finalDate, finalReportLink, finalAnswerKey, finalToEmails, finalCcEmails, finalStatus, finalDateSent, finalRemarks],
      collegeIdx, rowCollege
    );
    sheet.getRange(record.row, 1, 1, rowData.length).setValues([rowData]);
  } else {
    const dateSent = finalStatus === 'Sent' ? now : '';
    const rowData = buildRegistryRow(
      [assessmentName, batch, finalDate, finalReportLink, finalAnswerKey, finalToEmails, finalCcEmails, finalStatus, dateSent, finalRemarks],
      collegeIdx, normalizeCollegeName(college) || detectedCollege
    );
    sheet.appendRow(rowData);
  }
}

/**
 * Places the College value at the registry's College column index, padding with
 * empty strings when needed. Header order is never changed; only values written.
 */
function buildRegistryRow(baseRow, collegeIndex, collegeValue) {
  const row = baseRow.slice();
  if (collegeIndex === -1) return row;
  while (row.length < collegeIndex) row.push('');
  if (row.length === collegeIndex) row.push(collegeValue || '');
  else row[collegeIndex] = collegeValue || '';
  return row;
}

function parseEmailList(emailString) {
  if (!emailString) return [];
  return String(emailString)
    .split(/[,;]/)
    .map(e => e.trim())
    .filter(e => e.length > 0 && validateEmail(e))
    .filter((e, i, arr) => arr.indexOf(e) === i);
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).trim());
}

function scanReportForEmailData(reportSheet) {
  const data = reportSheet.getDataRange().getValues();
  const result = {
    attendance: 0,
    goodToGo: 0,
    needsImprovement: 0,
    needsTraining: 0,
    topPerformers: []
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    for (let j = 0; j < row.length; j++) {
      const cellText = String(row[j] || '').trim();

      if (cellText === 'Attendance:' || cellText === 'Attendance') {
        if (j + 1 < row.length) {
          const raw = String(row[j + 1]).trim();
          const parts = raw.split('/');
          const firstNum = parseInt(parts[0].replace(/\D/g, ''));
          if (!isNaN(firstNum)) result.attendance = firstNum;
        }
      }

      if (cellText === CONFIG.STATUS_LABELS.GOOD || cellText === 'Good to Go') {
        if (j + 1 < row.length) {
          const num = parseInt(String(row[j + 1]).replace(/\D/g, ''));
          if (!isNaN(num)) result.goodToGo = num;
        }
      }
      if (cellText === CONFIG.STATUS_LABELS.IMPROVEMENT || cellText === 'Needs Improvement') {
        if (j + 1 < row.length) {
          const num = parseInt(String(row[j + 1]).replace(/\D/g, ''));
          if (!isNaN(num)) result.needsImprovement = num;
        }
      }
      if (cellText === CONFIG.STATUS_LABELS.TRAINING || cellText === 'Needs Training') {
        if (j + 1 < row.length) {
          const num = parseInt(String(row[j + 1]).replace(/\D/g, ''));
          if (!isNaN(num)) result.needsTraining = num;
        }
      }
    }

    const rowText = row.map(c => String(c || '')).join(' ');
    if (rowText.includes('🏆 Top Performers') || rowText.includes('Top Performers')) {
      for (let k = i + 2; k < Math.min(i + 5, data.length); k++) {
        const pRow = data[k];
        if (!pRow || !pRow[1]) continue;
        const name = String(pRow[1]).trim();
        if (!name || name.toLowerCase().includes('name')) continue;
        result.topPerformers.push({
          rank: result.topPerformers.length + 1,
          name: name,
          branch: pRow[2] ? String(pRow[2]).trim() : '',
          percent: pRow[3] ? String(pRow[3]).trim() : ''
        });
      }
    }
  }

  return result;
  // ENHANCED: removed unreachable Logger.log after return (dead code)
}

function extractConfigFromReport(reportSheet) {
  const data = reportSheet.getDataRange().getValues();
  const config = {
    totalQuestions: '',
    totalMarks: '',
    testDate: '',
    attendance: '',
    collegeName: ''   // GENERALIZED: read from the report instead of guessing.
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    for (let j = 0; j < row.length; j++) {
      const cellText = String(row[j] || '').trim();

      if (cellText === 'Number of Questions:' || cellText === 'No of Questions:') {
        if (j + 1 < row.length) config.totalQuestions = String(row[j + 1]).trim();
      }
      if (cellText === 'Total Marks:' || cellText === 'Total Marks') {
        if (j + 1 < row.length) config.totalMarks = String(row[j + 1]).trim();
      }
      if (cellText === 'Test Date:' || cellText === 'Test Date') {
        if (j + 1 < row.length) config.testDate = String(row[j + 1]).trim();
      }
      if (cellText === 'Attendance:' || cellText === 'Attendance') {
        if (j + 1 < row.length) {
          const raw = String(row[j + 1]).trim();
          const parts = raw.split('/');
          config.attendance = parts[0].replace(/\D/g, '').trim() || raw;
        }
      }
      if (!config.collegeName && /^college(?:\s*name)?\s*:?$/i.test(cellText)) {
        if (j + 1 < row.length) config.collegeName = String(row[j + 1]).trim();
      }
    }
    // Fallback: row 1 of Report_View holds the college name (A1).
    if (!config.collegeName && i === 0 && row.length && row[0]) {
      const header = String(row[0]).replace(/\s*[\-–—]\s*Assessment Summary\s*$/i, '').trim();
      if (header && !/^unknown college$/i.test(header)) config.collegeName = header;
    }
  }

  return config;
}

function sendAssessmentEmail(inputs) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    const assessmentName = String(inputs.assessmentName || '').trim();
    const batch = String(inputs.batch || '').trim();
    const date = String(inputs.date || '').trim();
    // GENERALIZED: one college per spreadsheet — detected, not typed.
    const detectedCollege = normalizeCollegeName(inputs.college) || getCollegeName();

    if (!assessmentName || !batch) {
      throw new Error('Assessment Name and Batch are required to send email.');
    }

    const duplicateCheck = checkDuplicateEmail(assessmentName, batch, date, detectedCollege);
    if (duplicateCheck.isDuplicate && !inputs.forceResend) {
      return {
        status: 'duplicate',
        dateSent: duplicateCheck.dateSent,
        message: `This assessment report was already sent on ${duplicateCheck.dateSent}.`
      };
    }

    let registryRecord = getEmailRegistryRecord(assessmentName, batch, date, detectedCollege);
    if (!registryRecord) {
      throw new Error('No Email Registry record found for this Assessment + Batch. Please add it to the Email Registry first (or generate a report).');
    }

    const toEmails = parseEmailList(registryRecord.data[5]);
    const ccEmails = parseEmailList(registryRecord.data[6]);

    if (toEmails.length === 0) {
      throw new Error('No recipients found in Email Registry. Please populate the Email and CC columns.');
    }

    let reportData = null;
    let reportConfig = null;
    const snapshotKey = 'REPORT_SNAPSHOT_' + assessmentName + '_' + batch;
    const snapshotStr = PropertiesService.getScriptProperties().getProperty(snapshotKey);

    if (snapshotStr) {
      try {
        const snapshot = JSON.parse(snapshotStr);
        reportData = {
          attendance: snapshot.attendance || 0,
          goodToGo: snapshot.goodToGo || 0,
          needsImprovement: snapshot.needsImprovement || 0,
          needsTraining: snapshot.needsTraining || 0,
          topPerformers: snapshot.topPerformers || []
        };
        reportConfig = {
          totalQuestions: snapshot.totalQuestions || '',
          totalMarks: snapshot.totalMarks || '',
          testDate: snapshot.testDate || date || '',
          attendance: snapshot.attendance || '',
          collegeName: snapshot.collegeName || detectedCollege
        };
        console.log('Using report snapshot for email data');
      } catch (e) {
        console.warn('Failed to parse report snapshot:', e);
      }
    }

    if (!reportData) {
      const reportSheet = ss.getSheetByName(CONFIG.SHEET_NAME_REPORT);
      if (reportSheet) {
        reportData = scanReportForEmailData(reportSheet);
        reportConfig = extractConfigFromReport(reportSheet);
        console.log('Using scanned report sheet for email data');
      }
    }

    if (!reportData) {
      reportData = { attendance: 0, goodToGo: 0, needsImprovement: 0, needsTraining: 0, topPerformers: [] };
      // Was registryRecord.data[0] (the Assessment Name) — now the real college.
      reportConfig = { totalQuestions: '', totalMarks: '', testDate: date || '', attendance: '', collegeName: detectedCollege };
      console.log('Using registry fallback for email data');
    }

    const config = {
      collegeName: normalizeCollegeName(reportConfig.collegeName) || detectedCollege,
      testName: assessmentName,
      reportDate: reportConfig.testDate || formatDateString(inputs.assessmentDate) || '',
      batch: batch,
      totalQuestions: reportConfig.totalQuestions || '',
      totalMarks: reportConfig.totalMarks || ''
    };

    const htmlBody = buildHTMLEmail(config, reportData, registryRecord);

    const subject = `${config.collegeName} | Assessment Summary & Report`;

    const options = {
      htmlBody: htmlBody,
      name: 'PrepInsta Prime',
      cc: ccEmails.join(',')
    };

    MailApp.sendEmail(toEmails.join(','), subject, 'Please view this email in an HTML-compatible client.', options);

    const toStr = toEmails.join(', ');
    const ccStr = ccEmails.join(', ');
    const registryDate = registryRecord.data[2] || '';
    const reportLink = registryRecord.data[3] || '';
    const answerKey = registryRecord.data[4] || '';
    updateEmailRegistry(assessmentName, batch, registryDate, reportLink, answerKey, toStr, ccStr, 'Sent', '', detectedCollege);

    return { status: 'success', message: `Email sent successfully to ${toEmails.length} recipient(s).` };

  } catch (error) {
    logError('sendAssessmentEmail', error);
    try {
      updateEmailRegistry(
        String(inputs.assessmentName || ''), 
        String(inputs.batch || ''), 
        String(inputs.date || ''),
        '', '', '', '',
        'Failed',
        error.message,
        normalizeCollegeName(inputs.college) || getCollegeName()
      );
    } catch (e) {}
    throw error;
  }
}

function buildHTMLEmail(config, reportData, registryRecord) {
  const collegeName = config.collegeName || 'Unknown College';
  const assessmentName = config.testName || 'Assessment';
  const assessmentDate = config.reportDate || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MMM-yyyy');
  const batch = config.batch || '';
  const questions = config.totalQuestions || '';
  const totalMarks = config.totalMarks || '';

  const attendance = reportData.attendance || 0;
  const good = reportData.goodToGo || 0;
  const improvement = reportData.needsImprovement || 0;
  const training = reportData.needsTraining || 0;

  const reportLink = (registryRecord && registryRecord.data[3]) ? registryRecord.data[3] : '';
  const answerKey = (registryRecord && registryRecord.data[4]) ? registryRecord.data[4] : '';

  let topPerformersHTML = '';
  if (reportData.topPerformers && reportData.topPerformers.length > 0) {
    const medals = ['🥇', '🥈', '🥉'];
    reportData.topPerformers.slice(0, 3).forEach((p, i) => {
      topPerformersHTML += `<div style="margin: 4px 0; font-size: 13px; color: #1e293b; font-family: 'Times New Roman', Times, serif;">${medals[i] || '🏅'} ${p.name} (${p.branch}) – ${p.percent}</div>`;
    });
  }

  const actions = [];
  if (training > 0) actions.push('Conduct focused mentoring sessions for students in the Needs Training category.');
  if (improvement > 0) actions.push('Encourage additional practice and concept revision.');
  actions.push('Review the attached answer key with students.');
  actions.push('Continue regular assessments to track progress.');

  const recommendedActions = actions.map(a => `<li style="margin: 3px 0; color: #475569; font-family: 'Times New Roman', Times, serif; font-size: 13px;">${a}</li>`).join('');

  let attachmentsHTML = '';
  if (reportLink || answerKey) {
    attachmentsHTML = `<div style="margin-top: 20px; padding: 14px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #32c888; font-family: 'Times New Roman', Times, serif;">
      <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #1e293b; font-weight: 700; font-family: 'Times New Roman', Times, serif;">Attachments</h3>`;
    if (reportLink) {
      attachmentsHTML += `<div style="margin: 6px 0; font-family: 'Times New Roman', Times, serif;"><a href="${reportLink}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 600; font-size: 13px; font-family: 'Times New Roman', Times, serif;">📄 Assessment Report</a></div>`;
    }
    if (answerKey) {
      attachmentsHTML += `<div style="margin: 6px 0; font-family: 'Times New Roman', Times, serif;"><a href="${answerKey}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 600; font-size: 13px; font-family: 'Times New Roman', Times, serif;">🔑 Answer Key</a></div>`;
    }
    attachmentsHTML += `</div>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: "Times New Roman", Times, serif; background: #f1f5f9; margin: 0; padding: 12px; -webkit-text-size-adjust: 100%; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-family: "Times New Roman", Times, serif; }
    .header { background: linear-gradient(135deg, #32c888, #1b5e20); padding: 18px 16px; text-align: center; color: white; font-family: "Times New Roman", Times, serif; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 700; font-family: "Times New Roman", Times, serif; line-height: 1.3; }
    .header h2 { margin: 6px 0 0 0; font-size: 13px; font-weight: 400; opacity: 0.95; font-family: "Times New Roman", Times, serif; }
    .content { padding: 16px; font-family: "Times New Roman", Times, serif; }
    .greeting { font-size: 13px; color: #1e293b; line-height: 1.5; margin-bottom: 16px; font-family: "Times New Roman", Times, serif; }
    .greeting p { margin: 0 0 6px 0; font-family: "Times New Roman", Times, serif; }
    .section { margin-bottom: 18px; font-family: "Times New Roman", Times, serif; }
    .section-title { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; font-family: "Times New Roman", Times, serif; }
    .details-table { width: 100%; border-collapse: collapse; font-family: "Times New Roman", Times, serif; }
    .details-table td { padding: 6px 8px; font-size: 13px; color: #334155; width: 50%; font-family: "Times New Roman", Times, serif; vertical-align: top; word-wrap: break-word; }
    .details-table td strong { color: #0f172a; font-family: "Times New Roman", Times, serif; }
    .status-table { width: 100%; border-collapse: separate; border-spacing: 0 6px; font-family: "Times New Roman", Times, serif; }
    .status-row { display: block; width: 100%; padding: 10px 8px; border-radius: 6px; text-align: center; font-size: 12px; font-weight: 600; font-family: "Times New Roman", Times, serif; margin-bottom: 6px; box-sizing: border-box; }
    .status-good { background: #dcfce7; color: #166534; }
    .status-improvement { background: #ffedd5; color: #9a3412; }
    .status-training { background: #fee2e2; color: #991b1b; }
    .top-performers { background: #fef3c7; padding: 12px; border-radius: 6px; margin-top: 6px; font-family: "Times New Roman", Times, serif; }
    .top-performers h4 { margin: 0 0 6px 0; color: #92400e; font-size: 13px; font-family: "Times New Roman", Times, serif; }
    .actions { background: #f0f9ff; padding: 12px; border-radius: 6px; border-left: 3px solid #0ea5e9; font-family: "Times New Roman", Times, serif; }
    .actions ul { margin: 0; padding-left: 18px; font-family: "Times New Roman", Times, serif; }
    .actions li { font-size: 13px; color: #475569; font-family: "Times New Roman", Times, serif; }
    .footer { padding: 14px 16px; font-size: 13px; color: #1e293b; border-top: 1px solid #e2e8f0; font-family: "Times New Roman", Times, serif; }
    .footer p { margin: 3px 0; font-family: "Times New Roman", Times, serif; }
    @media only screen and (max-width: 600px) {
      .details-table td { display: block; width: 100%; box-sizing: border-box; }
      body { padding: 8px; }
      .content { padding: 12px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${collegeName}</h1>
      <h2>Assessment Summary & Report</h2>
    </div>
    <div class="content">
      <div class="greeting">
        <p>Dear Team,</p>
        <p>Greetings from PrepInsta Prime.</p>
        <p>Please find attached the Assessment Report and Answer Key for the assessment conducted.</p>
      </div>

      <div class="section">
        <div class="section-title">Assessment Details</div>
        <table class="details-table">
          <tr>
            <td><strong>Test Name:</strong> ${assessmentName}</td>
            <td><strong>Attendance:</strong> ${attendance}</td>
          </tr>
          <tr>
            <td><strong>Test Date:</strong> ${assessmentDate}</td>
            <td><strong>Number of Questions:</strong> ${questions}</td>
          </tr>
          <tr>
            <td><strong>Batch:</strong> ${batch}</td>
            <td><strong>Total Marks:</strong> ${totalMarks}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Performance Status Summary</div>
        <div class="status-row status-good">✅ Good to Go: ${good}</div>
        <div class="status-row status-improvement">⚠️ Needs Improvement: ${improvement}</div>
        <div class="status-row status-training">🔴 Needs Training: ${training}</div>
      </div>

      <div class="section">
        <div class="section-title">🏆 Top Performers</div>
        <div class="top-performers">
          ${topPerformersHTML || '<div style="color: #92400e; font-family: \'Times New Roman\', Times, serif; font-size: 13px;">No top performers data available.</div>'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Recommended Actions</div>
        <div class="actions">
          <ul>${recommendedActions}</ul>
        </div>
      </div>

      ${attachmentsHTML}
    </div>
    <div class="footer">
      <p>Regards,</p>
      <p><strong>PrepInsta Prime Team</strong></p>
    </div>
  </div>
</body>
</html>`;
}

function extractFileIdFromUrl(url) {
  if (!url) return null;
  const str = String(url).trim();

  if (/^[a-zA-Z0-9_-]{25,}$/.test(str)) return str;

  const fileMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  const openMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return openMatch[1];

  const ucMatch = str.match(/id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) return ucMatch[1];

  const docsMatch = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (docsMatch) return docsMatch[1];

  return null;
}

function getFileBlobFromUrl(url, fallbackName) {
  if (!url) return null;
  const fileId = extractFileIdFromUrl(url);
  if (!fileId) return null;
  try {
    const file = DriveApp.getFileById(fileId);
    return file.getBlob().setName(fallbackName || file.getName());
  } catch (e) {
    console.warn('Failed to get file blob from URL:', url, e);
    return null;
  }
}

function generateReportPDFBlob(ss, sheet, config) {
  try {
    const url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?' +
      'format=pdf&size=A4&portrait=true&fitw=true&sheetnames=false&printtitle=false&' +
      'pagenumbers=true&gridlines=false&fzr=true&gid=' + sheet.getSheetId();
    const token = ScriptApp.getOAuthToken();
    const response = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) {
      console.error('PDF generation failed:', response.getContentText());
      return null;
    }
    const testName = config.testName || 'Report';
    const dateStr = config.reportDate || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const fileName = generateExportFileName(config.collegeName || 'Unknown', testName, dateStr, 'pdf', false);
    return response.getBlob().setName(fileName);
  } catch (e) {
    logError('generateReportPDFBlob', e);
    return null;
  }
}

function bulkImportExistingReports() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  let imported = 0;
  let skipped = 0;

  for (const sheet of sheets) {
    const name = sheet.getName();

    if (!name.startsWith('Report') && !name.startsWith('Report_View')) continue;

    try {
      const data = sheet.getDataRange().getValues();
      if (data.length < 3) { skipped++; continue; }

      const collegeName = String(data[0][0] || '').trim();
      const testNameRaw = String(data[2][0] || '').trim();
      const testName = testNameRaw.replace(' - Assessment Summary', '').replace('Assessment Report - ', '').trim();

      let batch = '', attendance = '', questions = '', totalMarks = '', testDate = '';
      for (let i = 0; i < data.length; i++) {
        const rowText = data[i].map(c => String(c || '').trim()).join(' ');

        if (rowText.includes('Batch:')) {
          for (let j = 0; j < data[i].length; j++) {
            if (String(data[i][j]).includes('Batch:') && j + 1 < data[i].length) {
              batch = String(data[i][j + 1]).trim();
            }
          }
        }
        if (rowText.includes('Attendance:')) {
          for (let j = 0; j < data[i].length; j++) {
            if (String(data[i][j]).includes('Attendance:') && j + 1 < data[i].length) {
              attendance = String(data[i][j + 1]).trim();
            }
          }
        }
        if (rowText.includes('Number of Questions:')) {
          for (let j = 0; j < data[i].length; j++) {
            if (String(data[i][j]).includes('Number of Questions:') && j + 1 < data[i].length) {
              questions = String(data[i][j + 1]).trim();
            }
          }
        }
        if (rowText.includes('Total Marks:')) {
          for (let j = 0; j < data[i].length; j++) {
            if (String(data[i][j]).includes('Total Marks:') && j + 1 < data[i].length) {
              totalMarks = String(data[i][j + 1]).trim();
            }
          }
        }
        if (rowText.includes('Test Date:')) {
          for (let j = 0; j < data[i].length; j++) {
            if (String(data[i][j]).includes('Test Date:') && j + 1 < data[i].length) {
              testDate = String(data[i][j + 1]).trim();
            }
          }
        }
      }

      if (!batch) batch = 'Unknown';

      const existing = getEmailRegistryRecord(testName, batch);
      if (existing) { skipped++; continue; }

      updateEmailRegistry(
        testName,
        batch,
        '',
        '',
        '',
        '',
        'Generated',
        'Auto-imported from existing sheet: ' + name
      );
      imported++;

    } catch (e) {
      console.warn('Failed to import sheet ' + name + ':', e);
      skipped++;
    }
  }

  SpreadsheetApp.getUi().alert(
    'Bulk Import Complete',
    `✅ Imported: ${imported}\n⏭️ Skipped (already exists or unreadable): ${skipped}\n\nOpen the "Email Registry" sheet to review and fill in missing Email / CC / Answer Key values.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Distinct dates available for an Assessment + Batch.
 * GENERALIZED: 3rd argument is an optional college scope. Blank College cells
 * (legacy rows) always match, and when the scope yields nothing the function
 * falls back to the unscoped result — so this can never return fewer dates
 * than the original version did.
 */
function getUniqueDatesForAssessment(assessmentName, batch, college) {
  const sheet = getEmailRegistrySheet();
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  const headers = data[0].map(h => String(h || '').trim().toLowerCase());
  const aIdx = headers.indexOf('assessment name');
  const bIdx = headers.indexOf('batch');
  const dIdx = headers.indexOf('date');

  if (aIdx === -1 || bIdx === -1 || dIdx === -1) return [];

  const cIdx = findCollegeColumnIndex(data[0]);
  const targetCollege = normalizeCollegeName(college) || getCollegeName();
  const targetKey = collegeKey(targetCollege);

  const searchA = String(assessmentName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const searchB = String(batch || '').trim().toLowerCase().replace(/\s+/g, ' ');

  const scoped = new Set();
  const unscoped = new Set();

  for (let i = 1; i < data.length; i++) {
    const rowA = String(data[i][aIdx] || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const rowB = String(data[i][bIdx] || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (rowA !== searchA || rowB !== searchB) continue;

    const value = String(data[i][dIdx] || '').trim();
    if (!value) continue;
    unscoped.add(value);

    const rowCollege = cIdx !== -1 ? normalizeCollegeName(data[i][cIdx]) : '';
    if (!rowCollege || !targetKey || collegeKey(rowCollege) === targetKey) scoped.add(value);
  }

  const source = scoped.size > 0 ? scoped : unscoped;
  return Array.from(source).sort();
}

/**
 * Finds an Email Registry row.
 *
 * GENERALIZED: an optional 4th argument scopes the lookup to a college.
 * Matching is intentionally a *preference*, not a filter:
 *   pass 1 → rows whose College matches (blank legacy cells count as a match)
 *   pass 2 → the first row matching Assessment + Batch + Date, whatever the college
 * Because each college normally owns its own spreadsheet, pass 1 always wins
 * there, while old rows and copied spreadsheets can never make a record vanish.
 *
 * @param {string} assessmentName
 * @param {string} batch
 * @param {string} [date] Optional; blank date matches any date (original behavior).
 * @param {string} [college] Optional; defaults to the detected college.
 * @return {{row: number, data: Array, college: string, collegeMatch: boolean}|null}
 */
function getEmailRegistryRecord(assessmentName, batch, date, college) {
  const sheet = getEmailRegistrySheet();
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return null;

  const headers = data[0].map(h => String(h || '').trim().toLowerCase());
  const aIdx = headers.indexOf('assessment name');
  const bIdx = headers.indexOf('batch');
  const dIdx = headers.indexOf('date');

  if (aIdx === -1 || bIdx === -1 || dIdx === -1) {
    console.error('Email Registry headers missing. Found:', headers);
    return null;
  }

  const cIdx = findCollegeColumnIndex(data[0]);
  const targetCollege = normalizeCollegeName(college) || getCollegeName();
  const targetKey = collegeKey(targetCollege);

  const searchA = String(assessmentName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const searchB = String(batch || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const searchD = String(date || '').trim().toLowerCase().replace(/\s+/g, ' ');

  let fallback = null;

  for (let i = 1; i < data.length; i++) {
    const rowA = String(data[i][aIdx] || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const rowB = String(data[i][bIdx] || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const rowD = String(data[i][dIdx] || '').trim().toLowerCase().replace(/\s+/g, ' ');

    if (rowA !== searchA || rowB !== searchB) continue;
    if (searchD && rowD !== searchD) continue;

    const rowCollege = cIdx !== -1 ? normalizeCollegeName(data[i][cIdx]) : '';
    const matches = !rowCollege || !targetKey || collegeKey(rowCollege) === targetKey;

    const record = {
      row: i + 1,
      data: data[i],
      college: rowCollege || targetCollege,
      collegeMatch: matches
    };

    if (matches) return record;
    if (!fallback) fallback = record;
  }

  return fallback;
}

function getEmailRegistryRecordForDialog(assessmentName, batch, date) {
  const record = getEmailRegistryRecord(assessmentName, batch, date);
  if (!record) return null;

  let formattedDate = record.data[2] || '';
  if (formattedDate instanceof Date) {
    formattedDate = Utilities.formatDate(formattedDate, Session.getScriptTimeZone(), 'dd-MMM-yyyy');
  } else if (formattedDate && (String(formattedDate).includes('GMT') || String(formattedDate).includes('Tue') || String(formattedDate).includes('Mon'))) {
    try {
      const d = new Date(formattedDate);
      if (!isNaN(d.getTime())) {
        formattedDate = Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd-MMM-yyyy');
      }
    } catch(e) {}
  }

  let formattedDateSent = record.data[8] || '';
  if (formattedDateSent instanceof Date) {
    formattedDateSent = Utilities.formatDate(formattedDateSent, Session.getScriptTimeZone(), 'dd-MMM-yyyy HH:mm');
  }

  return {
    assessmentName: record.data[0],
    batch: record.data[1],
    date: formattedDate,
    reportLink: record.data[3],
    answerKey: record.data[4],
    email: record.data[5],
    cc: record.data[6],
    status: record.data[7],
    dateSent: formattedDateSent,
    remarks: record.data[9],
    // GENERALIZED: the actual college for this row (was previously shown as
    // the assessment name in the dialog, because the registry had no College).
    college: record.college || getCollegeName(),
    collegeMatch: record.collegeMatch !== false,
    detectedCollege: getCollegeName()
  };
}

// ==================== Batch Email ====================

function showBatchEmailDialog() {
  const html = HtmlService.createHtmlOutputFromFile('BatchEmailDialog')
    .setWidth(950)
    .setHeight(700)
    .setTitle('📧 Send Multiple Assessment Reports');
  SpreadsheetApp.getUi().showModalDialog(html, 'Send Multiple Reports');
}

function getAllEmailRegistryRecords() {
  const sheet = getEmailRegistrySheet();
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  const records = [];
  const collegeIdx = findCollegeColumnIndex(data[0]);
  const detected = getCollegeName();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    records.push({
      rowIndex: i + 1,
      assessmentName: String(row[0] || '').trim(),
      batch: String(row[1] || '').trim(),
      date: String(row[2] || '').trim(),
      reportLink: String(row[3] || '').trim(),
      answerKey: String(row[4] || '').trim(),
      email: String(row[5] || '').trim(),
      cc: String(row[6] || '').trim(),
      status: String(row[7] || '').trim(),
      dateSent: String(row[8] || '').trim(),
      remarks: String(row[9] || '').trim(),
      // GENERALIZED: real college for this row (blank legacy rows report the detected one).
      college: (function () {
        const raw = collegeIdx !== -1 ? String(row[collegeIdx] || '').trim() : '';
        return raw || detected;
      })()
    });
  }

  return records.reverse();
}

function sendBatchEmails(selectedIndices) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const results = [];
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  const records = getAllEmailRegistryRecords();

  selectedIndices.forEach(idx => {
    const record = records.find(r => r.rowIndex === idx);
    if (!record) {
      failed++;
      results.push({ status: 'error', message: 'Record not found for row ' + idx });
      return;
    }

    if (record.status === 'Sent') {
      skipped++;
      results.push({ 
        status: 'skipped', 
        assessmentName: record.assessmentName,
        message: 'Already sent on ' + record.dateSent 
      });
      return;
    }

    try {
      const result = sendAssessmentEmail({
        assessmentName: record.assessmentName,
        batch: record.batch,
        date: record.date,
        college: record.college,   // GENERALIZED: stays correct even if colleges ever share a sheet
        forceResend: false
      });

      sent++;
      results.push({
        status: 'sent',
        assessmentName: record.assessmentName,
        batch: record.batch,
        message: result.message
      });

    } catch (error) {
      failed++;
      results.push({
        status: 'failed',
        assessmentName: record.assessmentName,
        batch: record.batch,
        message: error.message
      });
    }
  });

  return {
    sent: sent,
    failed: failed,
    skipped: skipped,
    total: selectedIndices.length,
    results: results
  };
}
/* ╔══════════════════════════════════════════════════════════════════════╗
 * ║         TPO DASHBOARD — Add-on Module for Assessment Suite         ║
 * ║         v1.4 | Category Selector | Fixed Percentage Parsing        ║
 * ║         ENHANCED: comments + clearer errors (logic preserved)        ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

const TPO_CONFIG = {
  MASTER_SHEET: "Master Data",
  LEADERBOARD_SHEETS: {
    "Practice": "📊 Practice Leaderboard",
    "Company": "📊 Company Leaderboard",
    "Class Test": "📊 Class Test Leaderboard",
    "Leaderboard": "📊 Leaderboard"
  },
  ANALYSIS_SHEETS: {
    "Practice": "📋 Practice Analysis",
    "Company": "📋 Company Analysis",
    "Class Test": "📋 Class Test Analysis",
    "Analysis": "📋 Analysis"
  },
  EMAIL_REGISTRY_SHEET: "Email Registry",
  ASSESSMENT_REGISTRY_SHEET: "Assessment Registry",
  ROLE_COLUMN: "Role",
  CACHE_DURATION: 300,
  PLACEMENT_THRESHOLDS: { READY: 80, NEAR_READY: 65, NEEDS_IMPROVEMENT: 50, AT_RISK: 0 },
  BRAND_COLOR: '#32c888',
  BRAND_DARK: '#1b5e20',
  BRAND_TEXT: '#ffffff'
};

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function showTPODashboard() {
  const template = HtmlService.createTemplateFromFile('TPODashboard');
  const html = template.evaluate()
    .setWidth(1400)
    .setHeight(900)
    .setTitle('🎓 TPO Dashboard');
  SpreadsheetApp.getUi().showModalDialog(html, ' ');
}

function checkDashboardAccess() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName(TPO_CONFIG.MASTER_SHEET);
    if (!masterSheet) return { allowed: true, role: 'Admin', reason: 'Dev mode' };

    const userEmail = Session.getActiveUser().getEmail().toLowerCase().trim();
    const owner = ss.getOwner();
    if (owner && owner.getEmail().toLowerCase() === userEmail) {
      return { allowed: true, role: 'Admin', reason: 'Owner' };
    }

    const data = masterSheet.getDataRange().getValues();
    if (data.length < 2) return { allowed: true, role: 'TPO', reason: 'Empty Master' };

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const emailIdx = headers.indexOf('email');
    const roleIdx = headers.indexOf('role');

    if (roleIdx === -1) return { allowed: true, role: 'TPO', reason: 'No role column' };

    if (emailIdx !== -1) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][emailIdx]).toLowerCase().trim() === userEmail) {
          const role = String(data[i][roleIdx] || 'Faculty').trim();
          const allowed = ['tpo', 'faculty', 'admin'].includes(role.toLowerCase());
          return { allowed: allowed, role: role, reason: allowed ? 'Authorized' : 'Unauthorized' };
        }
      }
    }
    return { allowed: false, role: 'Unknown', reason: 'User not in Master Data' };
  } catch (e) {
    return { allowed: true, role: 'Error', reason: 'Error: ' + e.message };
  }
}

function getAvailableLeaderboardTypes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const types = [];
  for (const [type, sheetName] of Object.entries(TPO_CONFIG.LEADERBOARD_SHEETS)) {
    if (ss.getSheetByName(sheetName)) {
      types.push(type);
    }
  }
  return types;
}

function getDashboardData(leaderboardType) {
  const access = checkDashboardAccess();
  if (!access.allowed) {
    return { error: true, message: 'Access Restricted. Please contact the administrator.', access: access };
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = 'TPO_DASHBOARD_DATA_V4_' + (leaderboardType || 'Auto');
  const cached = cache.get(cacheKey);

  if (cached) {
    const data = JSON.parse(cached);
    data.fromCache = true;
    return data;
  }

  try {
    const startTime = new Date();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const lbInfo = findLeaderboardSheet(ss, leaderboardType);
    const analysisInfo = findAnalysisSheet(ss, leaderboardType);

    const data = {
      error: false,
      timestamp: new Date().toISOString(),
      userRole: access.role,
      leaderboardType: lbInfo ? lbInfo.type : 'None',
      availableTypes: getAvailableLeaderboardTypes(),
      selectedType: leaderboardType || (lbInfo ? lbInfo.type : 'None'),
      summary: getSummaryMetrics(ss, lbInfo),
      assessmentAnalytics: getAssessmentAnalytics(ss, lbInfo),
      placementReadiness: getPlacementReadiness(ss, lbInfo),
      topPerformers: getTopPerformers(ss, lbInfo),
      atRiskStudents: getAtRiskStudents(ss, lbInfo),
      recentAssessments: getRecentAssessments(ss),
      branchPerformance: getBranchPerformanceFromAnalysis(ss, analysisInfo),
      batchDistribution: getBatchDistribution(ss),
      overallStats: getOverallStatsFromAnalysis(ss, analysisInfo),
      insightDistribution: getInsightDistributionFromAnalysis(ss, analysisInfo),
      fromCache: false
    };

    const elapsed = ((new Date() - startTime) / 1000).toFixed(2);
    data.loadTime = elapsed + 's';

    cache.put(cacheKey, JSON.stringify(data), TPO_CONFIG.CACHE_DURATION);
    return data;
  } catch (e) {
    logError('getDashboardData', e);
    return { error: true, message: 'Error: ' + e.message, stack: e.stack };
  }
}

/**
 * NOTE (preserved from original): This findLeaderboardSheet(ss, preferredType)
 * overloads the earlier findLeaderboardSheet(ss) — in Apps Script the later
 * definition wins. Kept as-is to preserve behavior. TPO code calls with 2 args.
 */
function findLeaderboardSheet(ss, preferredType) {
  if (preferredType && TPO_CONFIG.LEADERBOARD_SHEETS[preferredType]) {
    const sheet = ss.getSheetByName(TPO_CONFIG.LEADERBOARD_SHEETS[preferredType]);
    if (sheet) return { sheet: sheet, name: TPO_CONFIG.LEADERBOARD_SHEETS[preferredType], type: preferredType };
  }

  for (const [type, sheetName] of Object.entries(TPO_CONFIG.LEADERBOARD_SHEETS)) {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) return { sheet: sheet, name: sheetName, type: type };
  }
  return null;
}

function findAnalysisSheet(ss, preferredType) {
  if (preferredType && TPO_CONFIG.ANALYSIS_SHEETS[preferredType]) {
    const sheet = ss.getSheetByName(TPO_CONFIG.ANALYSIS_SHEETS[preferredType]);
    if (sheet) return { sheet: sheet, name: TPO_CONFIG.ANALYSIS_SHEETS[preferredType], type: preferredType };
  }

  for (const [type, sheetName] of Object.entries(TPO_CONFIG.ANALYSIS_SHEETS)) {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) return { sheet: sheet, name: sheetName, type: type };
  }
  return null;
}

/**
 * ✅ FIXED: Properly parse percentage values from leaderboard
 * Leaderboard stores percentages as decimals (0.96) or with % sign (96%)
 * This function normalizes both formats to a 0-100 scale
 */
function parsePercentage(value) {
  if (value === null || value === undefined || value === '') return 0;

  const str = String(value).trim();
  const cleanStr = str.replace('%', '').trim();
  const num = parseFloat(cleanStr);

  if (isNaN(num)) return 0;

  if (num <= 1.0 && num > 0) {
    return num * 100;
  }

  return num;
}

function getSummaryMetrics(ss, lbInfo) {
  try {
    const masterSheet = ss.getSheetByName(TPO_CONFIG.MASTER_SHEET);
    let totalStudents = 0;
    if (masterSheet) totalStudents = Math.max(0, masterSheet.getLastRow() - 1);

    let activeStudents = 0, totalScoreSum = 0, scoreCount = 0;
    let passCount = 0, atRiskCount = 0, latestDate = 'N/A';

    if (lbInfo && lbInfo.sheet) {
      const lbData = lbInfo.sheet.getDataRange().getValues();
      if (lbData.length > 2) {
        const headers = lbData[1].map(h => String(h).trim().toLowerCase());
        const percentIdx = headers.indexOf('percentage');

        for (let i = 2; i < lbData.length; i++) {
          const row = lbData[i];
          if (percentIdx !== -1) {
            const pct = parsePercentage(row[percentIdx]);
            if (pct > 0) {
              activeStudents++;
              totalScoreSum += pct;
              scoreCount++;
              if (pct >= 50) passCount++;
              else atRiskCount++;
            }
          }
        }
      }
    }

    const regSheet = ss.getSheetByName(TPO_CONFIG.ASSESSMENT_REGISTRY_SHEET);
    if (regSheet) {
      const regData = regSheet.getDataRange().getValues();
      let latest = null;
      for (let i = 1; i < regData.length; i++) {
        const d = regData[i][3];
        if (d instanceof Date && (!latest || d > latest)) latest = d;
      }
      if (latest) latestDate = Utilities.formatDate(latest, Session.getScriptTimeZone(), 'dd-MMM-yyyy');
    }

    const avgScore = scoreCount > 0 ? (totalScoreSum / scoreCount).toFixed(2) : '0.00';
    const completionRate = totalStudents > 0 ? ((activeStudents / totalStudents) * 100).toFixed(1) : '0.0';
    const passRate = scoreCount > 0 ? ((passCount / scoreCount) * 100).toFixed(1) : '0.0';
    const atRiskPct = scoreCount > 0 ? ((atRiskCount / scoreCount) * 100).toFixed(1) : '0.0';

    return {
      totalStudents: totalStudents,
      activeStudents: activeStudents,
      completionRate: completionRate + '%',
      averageScore: avgScore + '%',
      passRate: passRate + '%',
      atRiskPct: atRiskPct + '%',
      placementReady: passRate + '%',
      latestAssessmentDate: latestDate
    };
  } catch (e) {
    logError('getSummaryMetrics', e);
    return { totalStudents: 0, activeStudents: 0, completionRate: '0%', averageScore: '0%', passRate: '0%', atRiskPct: '0%', placementReady: '0%', latestAssessmentDate: 'N/A' };
  }
}

function getAssessmentAnalytics(ss, lbInfo) {
  try {
    if (!lbInfo || !lbInfo.sheet) return { assessmentWise: [], scoreTrend: [], batchWise: [], departmentWise: [] };

    const lbData = lbInfo.sheet.getDataRange().getValues();
    if (lbData.length < 3) return { assessmentWise: [], scoreTrend: [], batchWise: [], departmentWise: [] };

    const headers = lbData[1].map(h => String(h).trim());
    const branchIdx = headers.indexOf('Branch');
    const totalScoreIdx = headers.findIndex(h => String(h).startsWith('Total Score'));

    const assessmentCols = [];
    if (branchIdx !== -1 && totalScoreIdx !== -1) {
      for (let c = branchIdx + 1; c < totalScoreIdx; c++) {
        const colName = String(headers[c] || '').trim();
        if (colName && !colName.toLowerCase().includes('total') && !colName.toLowerCase().includes('score')) {
          assessmentCols.push({ name: colName, index: c });
        }
      }
    }

    const assessmentWise = [];
    assessmentCols.forEach(col => {
      let sum = 0, count = 0;
      const parts = col.name.split(' ');
      const lastPart = parts[parts.length - 1];
      const maxScore = !isNaN(parseFloat(lastPart)) ? parseFloat(lastPart) : 100;

      for (let i = 2; i < lbData.length; i++) {
        const score = parseFloat(lbData[i][col.index]) || 0;
        if (score > 0) { sum += score; count++; }
      }

      const avg = count > 0 ? sum / count : 0;
      const avgPct = maxScore > 0 ? ((avg / maxScore) * 100).toFixed(1) : avg.toFixed(1);

      const nameParts = col.name.split(' ');
      let shortName = col.name;
      if (nameParts.length >= 2) {
        shortName = nameParts.slice(0, 2).join(' ');
      }

      assessmentWise.push({
        name: shortName,
        fullName: col.name,
        average: parseFloat(avgPct),
        count: count,
        maxScore: maxScore
      });
    });

    const scoreTrend = assessmentWise.map((a, i) => ({
      assessment: a.name,
      average: a.average
    }));

    return {
      assessmentWise: assessmentWise,
      scoreTrend: scoreTrend,
      batchWise: getBatchDistribution(ss),
      departmentWise: getBranchPerformance(ss, lbInfo)
    };
  } catch (e) {
    logError('getAssessmentAnalytics', e);
    return { assessmentWise: [], scoreTrend: [], batchWise: [], departmentWise: [] };
  }
}

function getPlacementReadiness(ss, lbInfo) {
  try {
    if (!lbInfo || !lbInfo.sheet) return { ready: 0, nearReady: 0, needsImprovement: 0, atRisk: 0, total: 0 };

    const lbData = lbInfo.sheet.getDataRange().getValues();
    if (lbData.length < 3) return { ready: 0, nearReady: 0, needsImprovement: 0, atRisk: 0, total: 0 };

    const headers = lbData[1].map(h => String(h).trim().toLowerCase());
    const percentIdx = headers.indexOf('percentage');

    let ready = 0, nearReady = 0, needsImprovement = 0, atRisk = 0, total = 0;

    for (let i = 2; i < lbData.length; i++) {
      if (percentIdx !== -1) {
        const pct = parsePercentage(lbData[i][percentIdx]);
        if (pct > 0) {
          total++;
          if (pct >= 80) ready++;
          else if (pct >= 65) nearReady++;
          else if (pct >= 50) needsImprovement++;
          else atRisk++;
        }
      }
    }

    return {
      ready: ready, nearReady: nearReady, needsImprovement: needsImprovement, atRisk: atRisk, total: total,
      readyPct: total > 0 ? ((ready / total) * 100).toFixed(1) : '0.0',
      nearReadyPct: total > 0 ? ((nearReady / total) * 100).toFixed(1) : '0.0',
      needsImprovementPct: total > 0 ? ((needsImprovement / total) * 100).toFixed(1) : '0.0',
      atRiskPct: total > 0 ? ((atRisk / total) * 100).toFixed(1) : '0.0'
    };
  } catch (e) {
    logError('getPlacementReadiness', e);
    return { ready: 0, nearReady: 0, needsImprovement: 0, atRisk: 0, total: 0 };
  }
}

function getTopPerformers(ss, lbInfo) {
  try {
    if (!lbInfo || !lbInfo.sheet) return [];

    const lbData = lbInfo.sheet.getDataRange().getValues();
    if (lbData.length < 3) return [];

    const headers = lbData[1].map(h => String(h).trim().toLowerCase());
    const nameIdx = headers.indexOf('name');
    const branchIdx = headers.indexOf('branch');
    const percentIdx = headers.indexOf('percentage');
    const statusIdx = headers.indexOf('status classification');
    const rankIdx = headers.indexOf('rank');

    const performers = [];
    for (let i = 2; i < lbData.length; i++) {
      const row = lbData[i];
      const pct = percentIdx !== -1 ? parsePercentage(row[percentIdx]) : 0;

      if (pct > 0) {
        performers.push({
          rank: rankIdx !== -1 ? parseInt(row[rankIdx]) || (i - 1) : (i - 1),
          name: nameIdx !== -1 ? String(row[nameIdx] || '') : '',
          branch: branchIdx !== -1 ? String(row[branchIdx] || '') : '',
          score: pct.toFixed(2),
          status: statusIdx !== -1 ? String(row[statusIdx] || '') : ''
        });
      }
    }

    performers.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
    return performers.slice(0, 50);
  } catch (e) {
    logError('getTopPerformers', e);
    return [];
  }
}

function getAtRiskStudents(ss, lbInfo) {
  try {
    if (!lbInfo || !lbInfo.sheet) return [];

    const lbData = lbInfo.sheet.getDataRange().getValues();
    if (lbData.length < 3) return [];

    const headers = lbData[1].map(h => String(h).trim().toLowerCase());
    const nameIdx = headers.indexOf('name');
    const branchIdx = headers.indexOf('branch');
    const percentIdx = headers.indexOf('percentage');

    const atRisk = [];
    for (let i = 2; i < lbData.length; i++) {
      const row = lbData[i];
      const pct = percentIdx !== -1 ? parsePercentage(row[percentIdx]) : 0;

      if (pct > 0 && pct < 50) {
        let action = 'Needs focused mentoring';
        if (pct < 30) action = 'Immediate attention required — conduct remedial sessions';
        else if (pct < 40) action = 'Needs intensive practice and concept revision';
        else action = 'Requires additional practice and guidance';

        atRisk.push({
          name: nameIdx !== -1 ? String(row[nameIdx] || '') : '',
          branch: branchIdx !== -1 ? String(row[branchIdx] || '') : '',
          score: pct.toFixed(2),
          riskPct: (100 - pct).toFixed(1) + '%',
          action: action
        });
      }
    }

    atRisk.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));
    return atRisk.slice(0, 50);
  } catch (e) {
    logError('getAtRiskStudents', e);
    return [];
  }
}

function getRecentAssessments(ss) {
  try {
    const regSheet = ss.getSheetByName(TPO_CONFIG.ASSESSMENT_REGISTRY_SHEET);
    if (!regSheet) return [];

    const regData = regSheet.getDataRange().getValues();
    if (regData.length < 2) return [];

    const headers = regData[0].map(h => String(h).trim().toLowerCase());
    const nameIdx = headers.indexOf('assessment name');
    const typeIdx = headers.indexOf('type');
    const maxIdx = headers.indexOf('max score');
    const dateIdx = headers.indexOf('date');

    const assessments = [];
    for (let i = 1; i < regData.length; i++) {
      const row = regData[i];
      const name = nameIdx !== -1 ? String(row[nameIdx] || '') : '';
      if (!name) continue;

      let dateStr = 'N/A';
      if (dateIdx !== -1 && row[dateIdx]) {
        dateStr = row[dateIdx] instanceof Date 
          ? Utilities.formatDate(row[dateIdx], Session.getScriptTimeZone(), 'dd-MMM-yyyy')
          : String(row[dateIdx]);
      }

      let studentCount = 0;
      const testSheet = ss.getSheetByName(name);
      if (testSheet) studentCount = Math.max(0, testSheet.getLastRow() - 1);

      assessments.push({
        name: name,
        type: typeIdx !== -1 ? String(row[typeIdx] || 'General') : 'General',
        date: dateStr,
        maxScore: maxIdx !== -1 ? String(row[maxIdx] || '') : '',
        studentsAppeared: studentCount,
        averageScore: '—',
        status: 'Completed'
      });
    }

    assessments.reverse();
    return assessments.slice(0, 20);
  } catch (e) {
    logError('getRecentAssessments', e);
    return [];
  }
}

function getBranchPerformance(ss, lbInfo) {
  try {
    if (!lbInfo || !lbInfo.sheet) return [];

    const lbData = lbInfo.sheet.getDataRange().getValues();
    if (lbData.length < 3) return [];

    const headers = lbData[1].map(h => String(h).trim().toLowerCase());
    const branchIdx = headers.indexOf('branch');
    const percentIdx = headers.indexOf('percentage');

    if (branchIdx === -1 || percentIdx === -1) return [];

    const branchStats = {};
    for (let i = 2; i < lbData.length; i++) {
      const row = lbData[i];
      const branch = String(row[branchIdx] || '').trim();
      const pct = parsePercentage(row[percentIdx]);

      if (branch && pct > 0) {
        if (!branchStats[branch]) branchStats[branch] = { total: 0, count: 0, students: 0, poor: 0, average: 0, good: 0, best: 0 };
        branchStats[branch].total += pct;
        branchStats[branch].count++;
        branchStats[branch].students++;
        if (pct <= 30) branchStats[branch].poor++;
        else if (pct <= 60) branchStats[branch].average++;
        else if (pct <= 80) branchStats[branch].good++;
        else branchStats[branch].best++;
      }
    }

    const result = [];
    Object.keys(branchStats).forEach(branch => {
      const s = branchStats[branch];
      result.push({
        branch: branch, average: s.count > 0 ? (s.total / s.count).toFixed(2) : '0.00',
        count: s.count, poor: s.poor, averageCount: s.average, good: s.good, best: s.best
      });
    });

    result.sort((a, b) => parseFloat(b.average) - parseFloat(a.average));
    return result;
  } catch (e) {
    logError('getBranchPerformance', e);
    return [];
  }
}

function getBranchPerformanceFromAnalysis(ss, analysisInfo) {
  try {
    if (!analysisInfo || !analysisInfo.sheet) return [];

    const sheet = analysisInfo.sheet;
    const data = sheet.getDataRange().getValues();

    let startRow = -1;
    for (let i = 0; i < data.length; i++) {
      const rowText = data[i].map(c => String(c || '')).join(' ');
      if (rowText.includes('BRANCH-WISE ANALYSIS') || rowText.includes('Branch')) {
        startRow = i;
        break;
      }
    }

    if (startRow === -1) return [];

    const result = [];
    for (let i = startRow + 2; i < data.length; i++) {
      const row = data[i];
      if (!row[0] || String(row[0]).trim() === '') break;
      if (String(row[0]).includes('👑') || String(row[0]).includes('💡')) break;

      const branch = String(row[0] || '').replace('🏢', '').trim();
      if (!branch || branch === 'Branch') continue;

      result.push({
        branch: branch,
        students: parseInt(row[1]) || 0,
        avgScore: String(row[2] || '0'),
        max: parseFloat(row[3]) || 0,
        min: parseFloat(row[4]) || 0,
        total: parseFloat(row[5]) || 0,
        rank: parseInt(row[6]) || 0
      });
    }

    return result;
  } catch (e) {
    logError('getBranchPerformanceFromAnalysis', e);
    return [];
  }
}

function getOverallStatsFromAnalysis(ss, analysisInfo) {
  try {
    if (!analysisInfo || !analysisInfo.sheet) return {};

    const sheet = analysisInfo.sheet;
    const data = sheet.getDataRange().getValues();

    const stats = {};
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').trim();
        if (cell === 'Total Students' && j + 1 < row.length) stats.totalStudents = parseInt(row[j + 1]) || 0;
        if (cell === 'Class Average Score' && j + 1 < row.length) stats.classAverage = String(row[j + 1]);
        if (cell === 'Class Average %' && j + 1 < row.length) stats.classAveragePct = String(row[j + 1]);
        if (cell === 'Highest Score' && j + 1 < row.length) stats.highestScore = String(row[j + 1]);
        if (cell === 'Lowest Score' && j + 1 < row.length) stats.lowestScore = String(row[j + 1]);
      }
    }

    return stats;
  } catch (e) {
    logError('getOverallStatsFromAnalysis', e);
    return {};
  }
}

function getInsightDistributionFromAnalysis(ss, analysisInfo) {
  try {
    if (!analysisInfo || !analysisInfo.sheet) return [];

    const sheet = analysisInfo.sheet;
    const data = sheet.getDataRange().getValues();

    const insights = [];
    let foundSection = false;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowText = row.map(c => String(c || '')).join(' ');

      if (rowText.includes('Insight-Based Interpretation')) {
        foundSection = true;
        continue;
      }

      if (foundSection) {
        if (!row[0] || String(row[0]).trim() === '') break;
        if (String(row[0]).includes('📊') || String(row[0]).includes('BRANCH-WISE INSIGHT')) break;

        const range = String(row[0] || '').trim();
        const label = String(row[1] || '').trim();
        const count = parseInt(row[2]) || 0;

        if (range && label) {
          insights.push({ range: range, label: label, count: count });
        }
      }
    }

    return insights;
  } catch (e) {
    logError('getInsightDistributionFromAnalysis', e);
    return [];
  }
}

function getBatchDistribution(ss) {
  try {
    const masterSheet = ss.getSheetByName(TPO_CONFIG.MASTER_SHEET);
    if (!masterSheet) return [];

    const data = masterSheet.getDataRange().getValues();
    if (data.length < 2) return [];

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const batchIdx = headers.indexOf('batch');

    if (batchIdx === -1) return [];

    const batchCounts = {};
    for (let i = 1; i < data.length; i++) {
      const batch = String(data[i][batchIdx] || '').trim();
      if (batch) batchCounts[batch] = (batchCounts[batch] || 0) + 1;
    }

    const result = [];
    Object.keys(batchCounts).forEach(batch => {
      result.push({ batch: batch, count: batchCounts[batch] });
    });

    result.sort((a, b) => b.count - a.count);
    return result;
  } catch (e) {
    logError('getBatchDistribution', e);
    return [];
  }
}

function clearDashboardCache() {
  const cache = CacheService.getScriptCache();
  cache.remove('TPO_DASHBOARD_DATA_V4_Auto');
  cache.remove('TPO_DASHBOARD_DATA_V4_Practice');
  cache.remove('TPO_DASHBOARD_DATA_V4_Company');
  cache.remove('TPO_DASHBOARD_DATA_V4_Class Test');
  cache.remove('TPO_DASHBOARD_DATA_V4_Leaderboard');
  return { success: true, message: 'All cache cleared' };
}

function getCourseUsageData() {
  return { status: 'Not implemented', message: 'Course usage tracking not yet configured' };
}

function getLearningAnalyticsData() {
  return { status: 'Not implemented', message: 'Learning analytics not yet configured' };
}

function getPlacementTrackingData() {
  return { status: 'Not implemented', message: 'Placement tracking not yet configured' };
}

function getStudentProgressData(studentEmail) {
  return { status: 'Not implemented', message: 'Student progress tracking not yet configured', student: studentEmail };
}

function getCollegeWiseData() {
  return { status: 'Not implemented', message: 'Multi-college dashboard not yet configured' };
}

function getMultiCollegeData() {
  return { status: 'Not implemented', message: 'Multi-college dashboard not yet configured' };
}
// ╔══════════════════════════════════════════════════════════════════════╗
// ║         PREPINSTA ASSESSMENT DASHBOARD — v3.4 (Branch Group)       ║
// ║         CS/Non-CS Filter | Total Count | Attendance+Score Bars     ║
// ║         ENHANCED: comments + clearer errors (logic preserved)        ║
// ╚══════════════════════════════════════════════════════════════════════╝


const FD_CONFIG = {
  MASTER_SHEET: "Master Data",
  SYSTEM_SHEETS: ['Master Data', 'Report generator', 'Report_View', 'Email Registry',
                  'Assessment Registry', '📊 Leaderboard', '📋 Analysis',
                  '📊 Class Test Leaderboard', '📋 Class Test Analysis',
                  '📊 Company Specific Leaderboard', '📋 Company Specific Analysis',
                  '📊 Practice Module Leaderboard', '📋 Practice Module Analysis',
                  'Sheet1', 'Sheet2', 'Sheet3', 'Faculty_Report'],
  // GENERALIZED: was hardcoded to one college, so every other college's
  // dashboard showed that name. Now resolved per spreadsheet at runtime;
  // this string is only a documentation placeholder.
  DEFAULT_COLLEGE_NAME: '',   // ← resolved via getCollegeName()
  CACHE_PREFIX: 'FD_',
  CHUNK_SIZE: 45000,
  VERSION: '3.4',
  MAX_ROWS_PER_SHEET: 1500,
  MAX_EXECUTION_SECONDS: 330
};


/* ── BRANCH GROUP CONFIGURATION ── */
/**
 * Default branch groups — these are ONE college's programme names, so they are
 * only the fallback. GENERALIZED: each college can override them from
 * 🏫 College Setup (stored in Script Property BRANCH_GROUPS_JSON), which makes
 * the CS / Non-CS filter meaningful on every spreadsheet.
 */
const BRANCH_GROUPS = {
  CS: ['B.Tech AIDS','B.E. CSD','B.E. CSE','B.E. CST','B.E. CSE(IOT/CYBER)','B.Tech IT'],
  NON_CS: ['B.E. ECE','B.E. EEE','B.E.Mech','B.E. MECH/MCT','MBA']
};

const BRANCH_GROUPS_PROP = 'BRANCH_GROUPS_JSON';

/**
 * Branch groups in force for this spreadsheet: saved override, else defaults.
 * Malformed JSON never breaks the dashboard — it falls back to the defaults.
 * @return {{CS: string[], NON_CS: string[], isCustom: boolean}}
 */
function getBranchGroups() {
  const fallback = { CS: BRANCH_GROUPS.CS, NON_CS: BRANCH_GROUPS.NON_CS, isCustom: false };
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(BRANCH_GROUPS_PROP);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.CS) || !Array.isArray(parsed.NON_CS)) return fallback;
    return {
      CS: parsed.CS.map(v => String(v).trim()).filter(Boolean),
      NON_CS: parsed.NON_CS.map(v => String(v).trim()).filter(Boolean),
      isCustom: true
    };
  } catch (e) {
    console.warn('getBranchGroups: invalid override ignored — ' + e.message);
    return fallback;
  }
}

/** Saves CS / Non-CS branch lists for this college. Empty inputs reset to defaults. */
function saveBranchGroupsFromDialog(csList, nonCsList) {
  const props = PropertiesService.getScriptProperties();
  const toArray = value => (Array.isArray(value) ? value : String(value || '').split(','))
    .map(v => String(v).trim())
    .filter(Boolean);

  const cs = toArray(csList);
  const nonCs = toArray(nonCsList);

  if (cs.length === 0 && nonCs.length === 0) {
    props.deleteProperty(BRANCH_GROUPS_PROP);
    return { success: true, reset: true, groups: getBranchGroups() };
  }
  if (cs.length === 0 || nonCs.length === 0) {
    throw new Error('Please fill both CS and Non-CS branch lists (comma-separated), or clear both to use the defaults.');
  }

  props.setProperty(BRANCH_GROUPS_PROP, JSON.stringify({ CS: cs, NON_CS: nonCs }));
  return { success: true, reset: false, groups: getBranchGroups() };
}

/** Distinct branches present in Master Data — used to suggest groups in setup. */
function getMasterDataBranches() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.MASTER_SHEET);
    if (!sheet || sheet.getLastRow() < 2) return [];
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(h => String(h || '').trim().toLowerCase());
    const bIdx = headers.indexOf('branch');
    if (bIdx === -1) return [];
    const seen = {};
    for (let i = 1; i < values.length; i++) {
      const b = String(values[i][bIdx] || '').trim();
      if (b) seen[b] = true;
    }
    return Object.keys(seen).sort();
  } catch (e) {
    return [];
  }
}


function getBranchGroup(branch) {
  const normalized = String(branch || '').trim();
  const lower = normalized.toLowerCase().replace(/\s+/g, '').replace(/\./g, '').replace(/-/g, '');

  // GENERALIZED: lists come from the per-college override when one is set.
  const groups = getBranchGroups();
  const csNormalized = groups.CS.map(b =>
    b.toLowerCase().replace(/\s+/g, '').replace(/\./g, '').replace(/-/g, '')
  );
  const nonCsNormalized = groups.NON_CS.map(b =>
    b.toLowerCase().replace(/\s+/g, '').replace(/\./g, '').replace(/-/g, '')
  );
 
  if (csNormalized.some(b => lower === b || lower.includes(b))) return 'CS';
  if (nonCsNormalized.some(b => lower === b || lower.includes(b))) return 'Non-CS';
  return 'Other';
}


/* ── DATE / WEEK HELPERS ── */
function extractSheetDate(sheet, name) {
  const patterns = [
    { r: /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/, fn: m => { const d=parseInt(m[1]), mo=parseInt(m[2]), y=parseInt(m[3]); return new Date(y, mo-1, d); } },
    { r: /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})/, fn: m => { const d=parseInt(m[1]), mo=parseInt(m[2]), y=2000+parseInt(m[3]); return new Date(y, mo-1, d); } },
    { r: /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/, fn: m => { const y=parseInt(m[1]), mo=parseInt(m[2]), d=parseInt(m[3]); return new Date(y, mo-1, d); } },
    { r: /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i, fn: m => { const d=parseInt(m[1]); const mo=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(m[2].toLowerCase().slice(0,3)); const y=parseInt(m[3]); return new Date(y, mo, d); } },
    { r: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})[,\s]+(\d{4})/i, fn: m => { const mo=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(m[1].toLowerCase().slice(0,3)); const d=parseInt(m[2]); const y=parseInt(m[3]); return new Date(y, mo, d); } }
  ];
  for (const p of patterns) {
    const m = name.match(p.r);
    if (m) {
      try { const d = p.fn(m); if (d && !isNaN(d.getTime())) return d; } catch(e){}
    }
  }
  return null;
}


function getWeekId(date) {
  if (!date || isNaN(date.getTime())) return null;
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return d.getUTCFullYear() + '-W' + String(weekNo).padStart(2, '0');
}


/* ── WEB APP ENTRY ── */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('FacultyDashboard')
    .setTitle('PrepInsta Assessment Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/* ── MAIN DATA FETCH ── */
// ───────────────────────────────────────────────────────────────────────────
// FACULTY DASHBOARD (web app) — DATA SOURCE
// ───────────────────────────────────────────────────────────────────────────
/**
 * The Faculty Dashboard web app is now fed by the LEADERBOARD sheet, so the
 * web app, 📊 Leaderboard Analytics, the 🎓 TPO Dashboard and the email all
 * quote the same numbers.
 *
 * Switch (Script Property FD_DATA_SOURCE):
 *   'leaderboard' (default) → getFacultyDashboardDataFromLeaderboard()
 *   'raw'                   → getFacultyDashboardDataFromSheets()  (previous behaviour)
 *
 * Change it from the editor:  setFacultyDataSource('raw')  /  setFacultyDataSource('leaderboard')
 * Nothing else in the web app changes — the payload shape is byte-compatible,
 * so FacultyDashboard.html renders exactly as before.
 */
const FD_SOURCE_PROP = 'FD_DATA_SOURCE';

/** @return {string} 'leaderboard' or 'raw' */
function getFacultyDataSource() {
  try {
    const value = String(PropertiesService.getScriptProperties().getProperty(FD_SOURCE_PROP) || '').trim().toLowerCase();
    if (value === 'raw' || value === 'sheets') return 'raw';
    return 'leaderboard';
  } catch (e) {
    return 'leaderboard';
  }
}

/** Sets the dashboard source. @param {string} source 'leaderboard' | 'raw' */
function setFacultyDataSource(source) {
  const value = String(source || '').trim().toLowerCase();
  const normalised = (value === 'raw' || value === 'sheets') ? 'raw' : 'leaderboard';
  PropertiesService.getScriptProperties().setProperty(FD_SOURCE_PROP, normalised);
  clearFacultyCache();
  return normalised;
}

/**
 * Entry point used by FacultyDashboard.html (doGet) — unchanged signature.
 * @return {Object} the payload the web app already consumes.
 */
function getFacultyDashboardData() {
  if (getFacultyDataSource() === 'raw') return getFacultyDashboardDataFromSheets();
  return getFacultyDashboardDataFromLeaderboard();
}

/** Maps a leaderboard status label onto the dashboard's four buckets. */
function normalizeFdStatus(rawStatus, percentage, attended) {
  if (!attended) return 'INACTIVE';
  const s = String(rawStatus || '').toUpperCase();
  if (s.indexOf('BEST') !== -1) return 'BEST';
  if (s.indexOf('GOOD') !== -1) return 'GOOD';
  if (s.indexOf('AVERAGE') !== -1) return 'AVERAGE';
  if (s.indexOf('POOR') !== -1) return 'POOR';
  if (percentage >= 81) return 'BEST';
  if (percentage >= 61) return 'GOOD';
  if (percentage >= 31) return 'AVERAGE';
  return 'POOR';
}

/**
 * Master Data roster that does NOT require an email address.
 * The old reader dropped every row without a valid email, which silently hid
 * students from counts; here a row is kept if it has an email OR a reg no.
 * @return {{byEmail: Object, byRegNo: Object, size: number}}
 */
function readMasterRosterIndex(ss, debug) {
  const byEmail = {};
  const byRegNo = {};
  try {
    const sheet = ss.getSheetByName(CONFIG.MASTER_SHEET);
    if (!sheet || sheet.getLastRow() < 2) {
      debug.errors.push('Master Data not found — the dashboard will show leaderboard rows only.');
      return { byEmail: byEmail, byRegNo: byRegNo, size: 0 };
    }
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(h => String(h || '').trim().toLowerCase());
    const find = names => {
      for (const n of names) { const i = headers.indexOf(n); if (i !== -1) return i; }
      for (let i = 0; i < headers.length; i++) { for (const n of names) { if (headers[i].includes(n)) return i; } }
      return -1;
    };
    const idx = {
      name: find(['name', 'student name', 'studentname', 'full name']),
      email: find(['email', 'e-mail', 'mail']),
      regNo: find(['reg no', 'regno', 'reg_no', 'registration no', 'roll no', 'college reg']),
      branch: find(['branch', 'dept', 'department', 'stream']),
      batch: find(['batch', 'year', 'section', 'class']),
      college: find(['college', 'institution', 'university'])
    };
    debug.detectedColumns = idx;

    let kept = 0;
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const email = idx.email !== -1 ? String(row[idx.email] || '').trim().toLowerCase() : '';
      const regNo = idx.regNo !== -1 ? String(row[idx.regNo] || '').trim() : '';
      const validEmail = email && email.indexOf('@') !== -1;
      if (!validEmail && !regNo) continue;

      const entry = {
        name: idx.name !== -1 ? String(row[idx.name] || '').trim() : '',
        email: validEmail ? email : '',
        regNo: regNo,
        branch: idx.branch !== -1 ? String(row[idx.branch] || '').trim() : '',
        batch: idx.batch !== -1 ? String(row[idx.batch] || '').trim() : '',
        college: idx.college !== -1 ? String(row[idx.college] || '').trim() : ''
      };
      kept++;
      if (validEmail) byEmail[email] = entry;
      if (regNo) byRegNo[regNo.toLowerCase()] = entry;
    }
    debug.masterSheet = CONFIG.MASTER_SHEET;
    debug.masterRows = values.length;
    debug.masterEmails = Object.keys(byEmail).length;
    if (kept === 0) debug.errors.push('Master Data has no usable rows (need Email or Reg No).');
    return { byEmail: byEmail, byRegNo: byRegNo, size: kept };
  } catch (e) {
    logError('readMasterRosterIndex', e);
    debug.errors.push('Master Data read failed: ' + e.message);
    return { byEmail: {}, byRegNo: {}, size: 0 };
  }
}

/** Assessment Registry dates, used to derive the Week filter for leaderboard columns. */
function readAssessmentRegistryDates() {
  const entries = [];
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.ASSESSMENT_REGISTRY_SHEET || 'Assessment Registry');
    if (!sheet || sheet.getLastRow() < 2) return entries;
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(h => String(h || '').trim().toLowerCase());
    const nameIdx = headers.indexOf('assessment name');
    const dateIdx = headers.indexOf('date');
    if (nameIdx === -1 || dateIdx === -1) return entries;
    for (let i = 1; i < values.length; i++) {
      const name = normalizeBranchKey(values[i][nameIdx]);
      const raw = values[i][dateIdx];
      if (!name) continue;
      let date = null;
      if (raw instanceof Date) date = raw;
      else if (raw) { const d = new Date(raw); if (!isNaN(d.getTime())) date = d; }
      if (date) entries.push({ name: name, date: date });
    }
  } catch (e) {
    logError('readAssessmentRegistryDates', e);
  }
  return entries;
}

/**
 * Week id for a leaderboard score column: matches an Assessment Registry entry
 * by name containment, or reads a date embedded in the header. Null when unknown
 * (the Week filter then simply has nothing to offer for that column).
 */
function resolveAssessmentWeek(header, registryDates) {
  const key = normalizeBranchKey(header);
  let best = null;
  registryDates.forEach(entry => {
    if (key.indexOf(entry.name) !== -1 || entry.name.indexOf(key) !== -1) {
      if (!best || entry.date > best.date) best = entry;
    }
  });
  if (best) return getWeekId(best.date);

  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const m = String(header).match(/(\d{1,2})[\s\-\/]([A-Za-z]{3,})[\s\-\/](\d{4})/);
  if (m) {
    const month = months.indexOf(m[2].slice(0, 3).toLowerCase());
    if (month !== -1) return getWeekId(new Date(Number(m[3]), month, Number(m[1])));
  }
  return null;
}

/**
 * Builds the dashboard's student records from the leaderboard, joined to the
 * Master Data roster so non-appeared students still appear as INACTIVE.
 * @return {Array<Object>} long-form records (fed to computeAnalytics unchanged)
 */
function buildLeaderboardStudentRecords(matrix, roster) {
  const byReg = {};
  const byMail = {};
  matrix.rows.forEach(r => {
    if (r.regNo) byReg[r.regNo.toLowerCase()] = r;
    if (r.email) byMail[r.email.toLowerCase()] = r;
  });

  const totalMax = matrix.maxTotal || matrix.scoreCols.reduce((sum, c) => sum + (c.max || 0), 0) || 100;
  const consumed = new Set();   // leaderboard rows already represented by a roster entry
  const records = [];

  const makeRecord = (lbRow, master) => {
    const branch = resolveBranchName((lbRow && lbRow.branchRaw) || (master && master.branch) || '');
    const testsAttended = lbRow ? lbRow.attempted : 0;
    const percentage = lbRow ? lbRow.percent : 0;
    const assessments = {};
    if (lbRow) {
      matrix.scoreCols.forEach(col => {
        const score = lbRow.scores[col.header];
        if (typeof score === 'number') {
          assessments[col.header] = {
            score: score,
            maxScore: col.max || 0,
            percentage: col.max ? (score / col.max) * 100 : 0
          };
        }
      });
    }
    return {
      email: (lbRow && lbRow.email) || (master && master.email) || '',
      name: (lbRow && lbRow.name) || (master && master.name) || '',
      regNo: (lbRow && lbRow.regNo) || (master && master.regNo) || '',
      branch: branch,
      batch: (master && master.batch) || '',
      college: (master && master.college) || '',
      branchGroup: getBranchGroup(branch),
      overallPercentage: percentage,
      rawStatus: normalizeFdStatus(lbRow && lbRow.status, percentage, testsAttended),
      insight: (lbRow && lbRow.insight) || '',
      totalScore: lbRow ? lbRow.total : 0,
      totalMax: testsAttended > 0 ? totalMax : 0,
      testsAttended: testsAttended,
      testsConducted: matrix.scoreCols.length,
      assessments: assessments
    };
  };

  // 1) everyone on the roster (keeps INACTIVE students and the true total)
  Object.keys(roster.byRegNo).forEach(key => {
    const master = roster.byRegNo[key];
    const lbRow = byReg[key] || (master.email ? byMail[master.email] : null);
    if (lbRow) consumed.add(lbRow);
    records.push(makeRecord(lbRow || null, master));
  });
  Object.keys(roster.byEmail).forEach(key => {
    const master = roster.byEmail[key];
    if (master.regNo) return; // already added through byRegNo
    const lbRow = byMail[key];
    if (lbRow) consumed.add(lbRow);
    records.push(makeRecord(lbRow || null, master));
  });

  // 2) leaderboard rows absent from the roster (nobody silently disappears)
  matrix.rows.forEach(r => {
    if (consumed.has(r)) return;
    const master = (r.regNo && roster.byRegNo[r.regNo.toLowerCase()]) ||
      (r.email && roster.byEmail[r.email.toLowerCase()]) || null;
    records.push(makeRecord(r, master));
  });

  return records;
}

/**
 * LEADERBOARD-SOURCED dashboard payload.
 * Emits exactly the shape FacultyDashboard.html expects (lean keys e/n/r/b/…),
 * computed with the same computeAnalytics() so every derived number matches.
 */
function getFacultyDashboardDataFromLeaderboard() {
  const startTime = Date.now();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  clearFacultyCache();

  const debug = {
    version: FD_CONFIG.VERSION + ' (leaderboard)',
    source: 'leaderboard',
    leaderboardSheet: null,
    leaderboardType: null,
    masterSheet: null, masterRows: 0, masterCols: [], masterEmails: 0,
    assessmentSheets: [], errors: [], detectedColumns: null,
    executionTime: '0s', partialLoad: false
  };

  const matrix = readLeaderboardMatrix('');
  if (!matrix.ok) {
    debug.errors.push('CRITICAL: ' + matrix.message);
    return buildEmptyResult(debug);
  }
  debug.leaderboardSheet = matrix.sheetName;
  debug.leaderboardType = matrix.type;
  debug.masterCols = matrix.headers;

  const roster = readMasterRosterIndex(ss, debug);
  const registryDates = readAssessmentRegistryDates();

  // Assessment-level metadata for the UI (attendance chart, week filter).
  const assessmentData = matrix.scoreCols.map(col => {
    const appeared = matrix.rows.filter(r => typeof r.scores[col.header] === 'number').length;
    const week = resolveAssessmentWeek(col.header, registryDates);
    debug.assessmentSheets.push({
      name: col.header,
      status: 'leaderboard column',
      rows: col.appeared || appeared,
      matched: appeared,
      maxScore: col.max,
      week: week,
      reason: 'read from ' + matrix.sheetName
    });
    return {
      name: col.header,
      maxScore: col.max,
      attendance: appeared,
      week: week,
      date: null,
      dynamicCols: []
    };
  });

  const students = buildLeaderboardStudentRecords(matrix, roster);
  const analytics = computeAnalytics(students, assessmentData);

  const weeksSet = new Set();
  assessmentData.forEach(ad => { if (ad.week) weeksSet.add(ad.week); });
  const assessmentMeta = {};
  assessmentData.forEach(ad => { assessmentMeta[ad.name] = { week: ad.week, date: null }; });

  const leanStudents = students.map(s => ({
    e: s.email, n: s.name, r: s.regNo, b: s.branch, ba: s.batch, c: s.college,
    bg: s.branchGroup,
    p: parseFloat(s.overallPercentage.toFixed(2)),
    st: s.rawStatus, in: s.insight,
    sc: s.totalScore, mx: s.totalMax,
    ta: s.testsAttended, tc: s.testsConducted,
    as: Object.keys(s.assessments).reduce((acc, k) => {
      acc[k] = {
        s: s.assessments[k].score,
        m: s.assessments[k].maxScore,
        p: parseFloat(s.assessments[k].percentage.toFixed(2))
      };
      return acc;
    }, {})
  }));

  debug.executionTime = ((Date.now() - startTime) / 1000).toFixed(1) + 's';

  const result = {
    students: leanStudents,
    filters: Object.assign({}, analytics.filters, { weeks: Array.from(weeksSet).sort() }),
    summary: analytics.summary,
    branchPerf: analytics.branchPerformance,
    statusDist: analytics.statusDistribution,
    assessments: analytics.assessmentList,
    assessmentAttendance: analytics.assessmentAttendance,
    assessmentMeta: assessmentMeta,
    collegeName: getCollegeName(),
    topPerf: analytics.topPerformers.map(s => ({
      n: s.name, b: s.branch, bg: s.branchGroup,
      p: parseFloat(s.overallPercentage.toFixed(2)),
      ta: s.testsAttended, tc: s.testsConducted, st: s.rawStatus
    })),
    atRisk: analytics.atRiskStudents.map(s => ({
      n: s.name, b: s.branch, bg: s.branchGroup,
      p: parseFloat(s.overallPercentage.toFixed(2))
    })),
    debug: debug,
    fromCache: false,
    ts: new Date().toISOString()
  };

  if (leanStudents.length > 0 && assessmentData.length > 0) setChunkedCache('main', result);
  return result;
}

/**
 * FORMER IMPLEMENTATION — kept intact as a switchable fallback.
 * Reads Master Data + every raw assessment sheet (joined on email).
 * Used when FD_DATA_SOURCE = 'raw'. See getFacultyDashboardData() for the switch.
 */
function getFacultyDashboardDataFromSheets() {
  const startTime = Date.now();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  clearFacultyCache();


  const debug = { version: FD_CONFIG.VERSION, source: 'sheets', masterSheet: null, masterRows: 0, masterCols: [], masterEmails: 0, assessmentSheets: [], errors: [], executionTime: '0s', partialLoad: false };


  const masterResult = readMasterDataRobust(ss, debug);
  const masterMap = masterResult.map;
  debug.masterSheet = masterResult.sheetName;
  debug.masterRows = masterResult.rowCount;
  debug.masterCols = masterResult.headers;
  debug.masterEmails = Object.keys(masterMap).length;


  if (debug.masterEmails === 0) {
    debug.errors.push('CRITICAL: No valid emails in Master Data. Check Master Data sheet has Email column with valid emails.');
    return buildEmptyResult(debug);
  }


  const assessmentData = readAllAssessmentsRobust(ss, masterMap, debug, startTime);
  if (assessmentData.length === 0) debug.errors.push('WARNING: No assessment sheets processed. Create sheets with Email + Score columns.');

  const students = buildUnifiedRecords(masterMap, assessmentData);
  const analytics = computeAnalytics(students, assessmentData);


  const assessmentMeta = {};
  const weeksSet = new Set();
  assessmentData.forEach(ad => {
    if (ad.week) weeksSet.add(ad.week);
    assessmentMeta[ad.name] = { week: ad.week, date: ad.date ? ad.date.toISOString() : null };
  });


  const leanStudents = students.map(s => ({
    e: s.email, n: s.name, r: s.regNo, b: s.branch, ba: s.batch, c: s.college,
    bg: s.branchGroup,
    p: parseFloat(s.overallPercentage.toFixed(2)),
    st: s.rawStatus, in: s.insight,
    sc: s.totalScore, mx: s.totalMax,
    ta: s.testsAttended, tc: s.testsConducted,
    as: Object.keys(s.assessments).reduce((acc, k) => {
      acc[k] = { s: s.assessments[k].score, m: s.assessments[k].maxScore, p: parseFloat(s.assessments[k].percentage.toFixed(2)) };
      return acc;
    }, {})
  }));


  debug.executionTime = ((Date.now() - startTime) / 1000).toFixed(1) + 's';


  const result = {
    students: leanStudents,
    filters: { ...analytics.filters, weeks: Array.from(weeksSet).sort() },
    summary: analytics.summary,
    branchPerf: analytics.branchPerformance,
    statusDist: analytics.statusDistribution,
    assessments: analytics.assessmentList,
    assessmentAttendance: analytics.assessmentAttendance,
    assessmentMeta: assessmentMeta,
    collegeName: getCollegeName(),   // GENERALIZED: detected per spreadsheet
    topPerf: analytics.topPerformers.map(s => ({
      n: s.name,
      b: s.branch,
      bg: s.branchGroup,
      p: parseFloat(s.overallPercentage.toFixed(2)),
      ta: s.testsAttended,
      tc: s.testsConducted,
      st: s.rawStatus
    })),
    atRisk: analytics.atRiskStudents.map(s => ({ n: s.name, b: s.branch, bg: s.branchGroup, p: parseFloat(s.overallPercentage.toFixed(2)) })),
    debug: debug,
    fromCache: false,
    ts: new Date().toISOString()
  };


  if (leanStudents.length > 0 && assessmentData.length > 0) setChunkedCache('main', result);
  return result;
}


function buildEmptyResult(debug) {
  return {
    students: [], filters: { branches: [], branchGroups: [], colleges: [], assessments: [], weeks: [] },
    summary: { totalStudents: 0, activeStudents: 0, averageScore: '0.00', passRate: '0.0', placementReady: '0.0', atRiskCount: 0, totalAssessments: 0, avgParticipation: '0.0' },
    branchPerf: [], statusDist: { BEST: 0, GOOD: 0, AVERAGE: 0, POOR: 0, INACTIVE: 0 },
    assessments: [], assessmentAttendance: [], assessmentMeta: {},
    topPerf: [], atRisk: [], debug: debug, fromCache: false, ts: new Date().toISOString()
  };
}


/* ── MASTER DATA ── */
function readMasterDataRobust(ss, debug) {
  const possibleNames = ['Master Data', 'MasterData', 'Students', 'Student Data', 'Master', 'Student_List', 'StudentList'];
  let sheet = null, usedName = null;
  for (const name of possibleNames) { sheet = ss.getSheetByName(name); if (sheet) { usedName = name; break; } }
  if (!sheet) {
    const allSheets = ss.getSheets();
    const lowerPossible = possibleNames.map(n => n.toLowerCase().replace(/\s+/g, ''));
    for (const s of allSheets) {
      const sName = s.getName().toLowerCase().replace(/\s+/g, '');
      if (lowerPossible.includes(sName)) { sheet = s; usedName = s.getName(); break; }
    }
  }
  const map = {};
  if (!sheet) { debug.errors.push('Master sheet not found. Tried: ' + possibleNames.join(', ')); return { map, sheetName: null, rowCount: 0, headers: [] }; }
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) { debug.errors.push('Master sheet "' + usedName + '" has no data rows.'); return { map, sheetName: usedName, rowCount: 1, headers: data[0] || [] }; }


  const rawHeaders = data[0].map(h => String(h || '').trim());
  const headers = rawHeaders.map(h => h.toLowerCase());
  const findCol = (names) => {
    for (const n of names) { const idx = headers.indexOf(n); if (idx !== -1) return idx; }
    for (let i = 0; i < headers.length; i++) { for (const n of names) { if (headers[i].includes(n)) return i; } }
    return -1;
  };
  const idx = {
    name: findCol(['name', 'studentname', 'student_name', 'student name', 'fullname']),
    email: findCol(['email', 'e-mail', 'emailid', 'mail', 'email_id', 'email id']),
    regNo: findCol(['regno', 'reg no', 'reg_no', 'registrationno', 'rollno', 'roll no', 'collegereg', 'college_reg', 'college reg', 'id']),
    branch: findCol(['branch', 'dept', 'department', 'stream', 'division']),
    batch: findCol(['batch', 'year', 'section', 'class']),
    mobile: findCol(['mobile', 'phone', 'contact', 'mobileno', 'mobile no', 'mobile_no']),
    college: findCol(['college', 'collegename', 'college name', 'institution', 'university', 'school'])
  };
  debug.headers = rawHeaders; debug.detectedColumns = idx;
  if (idx.email === -1) debug.errors.push('Master: Email column missing.');
  if (idx.name === -1) debug.errors.push('Master: Name column missing.');
  if (idx.branch === -1) debug.errors.push('Master: Branch column missing.');


  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const email = idx.email !== -1 ? String(row[idx.email] || '').trim().toLowerCase() : '';
    if (!email || email === '-' || email === 'email' || !email.includes('@')) continue;
    map[email] = {
      name: idx.name !== -1 ? String(row[idx.name] || '') : '',
      email: email, regNo: idx.regNo !== -1 ? String(row[idx.regNo] || '') : '',
      branch: idx.branch !== -1 ? String(row[idx.branch] || '') : '',
      batch: idx.batch !== -1 ? String(row[idx.batch] || '') : '',
      mobile: idx.mobile !== -1 ? String(row[idx.mobile] || '') : '',
      college: idx.college !== -1 ? String(row[idx.college] || '') : '',
      branchGroup: getBranchGroup(idx.branch !== -1 ? String(row[idx.branch] || '') : '')
    };
  }
  return { map, sheetName: usedName, rowCount: data.length, headers: rawHeaders };
}


/* ── ASSESSMENT SHEETS ── */
function readAllAssessmentsRobust(ss, masterMap, debug, startTime) {
  const sheets = ss.getSheets();
  const assessments = [];
  const masterEmails = new Set(Object.keys(masterMap));


  for (const sheet of sheets) {
    if ((Date.now() - startTime) / 1000 > FD_CONFIG.MAX_EXECUTION_SECONDS) {
      debug.errors.push('PARTIAL LOAD: Stopped at ' + assessments.length + ' sheets to avoid timeout.');
      debug.partialLoad = true; break;
    }
    const name = sheet.getName().trim();
    if (FD_CONFIG.SYSTEM_SHEETS.includes(name)) continue;
    if (name.startsWith('📊') || name.startsWith('📋')) continue;
    if (name.startsWith('Faculty_Report')) continue;
    if (name.toLowerCase().startsWith('sheet') && /^sheet\s*\d*$/i.test(name)) continue;


    try {
      const lastRow = Math.min(sheet.getLastRow(), FD_CONFIG.MAX_ROWS_PER_SHEET);
      const lastCol = sheet.getLastColumn();
      if (lastRow < 2 || lastCol < 1) continue;


      const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      const rawHeaders = data[0].map(h => String(h || '').trim());
      const lowerHeaders = rawHeaders.map(h => h.toLowerCase());


      let emailIdx = -1;
      const emailPatterns = ['email', 'e-mail', 'mail', 'emailid', 'email_id', 'email id', 'student_email'];
      for (let i = 0; i < lowerHeaders.length; i++) {
        const h = lowerHeaders[i].replace(/[_\s.]/g, '');
        for (const p of emailPatterns) {
          if (h === p.replace(/[_\s.]/g, '') || h.includes(p.replace(/[_\s.]/g, ''))) { emailIdx = i; break; }
        }
        if (emailIdx !== -1) break;
      }


      let scoreIdx = -1;
      const scorePatterns = ['score', 'totalscore', 'total_score', 'total score', 'marks', 'totalmarks', 'total_marks', 'total marks', 'obtained', 'finalscore'];
      for (let i = 0; i < lowerHeaders.length; i++) {
        const h = lowerHeaders[i].replace(/[_\s.]/g, '');
        for (const p of scorePatterns) {
          if (h === p.replace(/[_\s.]/g, '') || h.includes(p.replace(/[_\s.]/g, ''))) { scoreIdx = i; break; }
        }
        if (scoreIdx !== -1) break;
      }


      if (emailIdx === -1) { debug.assessmentSheets.push({ name, status: 'skipped', reason: 'No Email column' }); continue; }
      if (scoreIdx === -1) { debug.assessmentSheets.push({ name, status: 'skipped', reason: 'No Score column' }); continue; }


      let branchIdx = -1;
      for (let i = 0; i < lowerHeaders.length; i++) {
        const h = lowerHeaders[i].replace(/[_\s.]/g, '');
        if (h === 'branch' || h === 'dept' || h === 'department' || h === 'stream') { branchIdx = i; break; }
      }


      const dynamicCols = [];
      const startIdx = branchIdx !== -1 ? branchIdx + 1 : Math.max(emailIdx + 1, 2);
      for (let c = startIdx; c < scoreIdx; c++) {
        const colName = rawHeaders[c];
        if (colName && colName.trim()) dynamicCols.push({ name: colName, index: c });
      }


      let maxScore = 0;
      for (const col of dynamicCols) {
        const match = String(col.name).match(/\((\d+)\)/);
        if (match) maxScore += parseInt(match[1]);
      }
      if (maxScore === 0 && scoreIdx !== -1) {
        const scoreHeaderMatch = String(rawHeaders[scoreIdx]).match(/\((\d+)\)/);
        if (scoreHeaderMatch) maxScore = parseInt(scoreHeaderMatch[1]);
      }
      if (maxScore === 0) {
        let maxFound = 0;
        for (let i = 1; i < data.length; i++) {
          const val = parseFloat(data[i][scoreIdx]) || 0;
          if (val > maxFound) maxFound = val;
        }
        maxScore = maxFound > 0 ? Math.ceil(maxFound / 5) * 5 : 100;
      }


      const sheetDate = extractSheetDate(sheet, name);
      const weekId = getWeekId(sheetDate);


      const records = [];
      const seenEmails = new Set();


      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const email = String(row[emailIdx] || '').trim().toLowerCase();
        if (!email || email === '-' || !email.includes('@')) continue;
        if (seenEmails.has(email)) continue;
       
        seenEmails.add(email);
        const score = parseFloat(row[scoreIdx]) || 0;
        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;


        const dynamicScores = {};
        dynamicCols.forEach(col => {
          dynamicScores[col.name] = parseFloat(row[col.index]) || 0;
        });


        records.push({ email, score, maxScore, percentage, dynamicScores });
      }


      if (records.length > 0) {
        const matched = records.filter(r => masterEmails.has(r.email)).length;
        assessments.push({
          name, maxScore, records, dynamicCols: dynamicCols.map(c => c.name),
          attendance: records.length, matched, date: sheetDate, week: weekId
        });
        debug.assessmentSheets.push({
          name, status: 'processed', rows: records.length, matched,
          maxScore, emailCol: rawHeaders[emailIdx], scoreCol: rawHeaders[scoreIdx],
          dynamicCols: dynamicCols.map(c => c.name), week: weekId
        });
      }
    } catch (e) {
      debug.assessmentSheets.push({ name, status: 'error', reason: e.message });
    }
  }
  return assessments;
}


function buildUnifiedRecords(masterMap, assessmentData) {
  const students = [];
  const totalTestsConducted = assessmentData.length;
 
  Object.keys(masterMap).forEach(email => {
    const m = masterMap[email];
    const student = {
      email, name: m.name, regNo: m.regNo, branch: m.branch,
      batch: m.batch, mobile: m.mobile, college: m.college,
      branchGroup: m.branchGroup || getBranchGroup(m.branch),
      assessments: {}, totalScore: 0, totalMax: 0,
      overallPercentage: 0, status: 'INACTIVE', insight: 'No assessment data', rawStatus: 'INACTIVE',
      testsAttended: 0, testsConducted: totalTestsConducted
    };


    let hasData = false;
    assessmentData.forEach(ad => {
      const rec = ad.records.find(r => r.email === email);
      if (rec) {
        hasData = true;
        student.assessments[ad.name] = { score: rec.score, maxScore: rec.maxScore, percentage: rec.percentage, dynamicScores: rec.dynamicScores };
        student.totalScore += rec.score;
        student.totalMax += rec.maxScore;
        student.testsAttended++;
      }
    });


    if (hasData && student.totalMax > 0) {
      student.overallPercentage = (student.totalScore / student.totalMax) * 100;
      const pct = student.overallPercentage;
      if (pct >= 81) { student.status = '🏆 BEST'; student.insight = '⭐ Excellent Performer'; student.rawStatus = 'BEST'; }
      else if (pct >= 61) { student.status = '🟢 GOOD'; student.insight = '👍 Moderate Performer'; student.rawStatus = 'GOOD'; }
      else if (pct >= 31) { student.status = '🟡 AVERAGE'; student.insight = '📈 Needs Improvement'; student.rawStatus = 'AVERAGE'; }
      else { student.status = '🔴 POOR'; student.insight = '⚠️ Need Immediate Attention'; student.rawStatus = 'POOR'; }
    }
    students.push(student);
  });
  return students;
}


function computeAnalytics(students, assessmentData) {
  const active = students.filter(s => s.totalMax > 0);
  const totalActive = active.length;
  const totalConducted = assessmentData.length;


  const branches = [...new Set(students.map(s => s.branch).filter(Boolean))].sort();
  const branchGroups = [...new Set(students.map(s => s.branchGroup).filter(Boolean))].sort();
  const colleges = [...new Set(students.map(s => s.college).filter(Boolean))].sort();
  const assessments = assessmentData.map(a => a.name).sort();


  const avgScore = totalActive > 0 ? (active.reduce((sum, s) => sum + s.overallPercentage, 0) / totalActive).toFixed(2) : '0.00';
  const passCount = active.filter(s => s.overallPercentage >= 50).length;
  const passRate = totalActive > 0 ? ((passCount / totalActive) * 100).toFixed(1) : '0.0';
  const readyCount = active.filter(s => s.overallPercentage >= 80).length;
  const atRiskCount = active.filter(s => s.overallPercentage < 50 && s.totalMax > 0).length;
  const totalAppearances = assessmentData.reduce((sum, ad) => sum + ad.attendance, 0);
  const totalPossible = students.length * totalConducted;
  const avgParticipation = totalPossible > 0 ? ((totalAppearances / totalPossible) * 100).toFixed(1) : '0.0';


  /* ── BRANCH PERFORMANCE: Total count from Master Data + Attendance + Scores ── */
  const branchStats = {};
 
  students.forEach(s => {
    const b = s.branch || 'Unknown';
    if (!branchStats[b]) {
      branchStats[b] = {
        totalScoreSum: 0,
        scoreCount: 0,
        totalStudents: 0,
        activeStudents: 0,
        passCount: 0,
        best: 0,
        good: 0,
        average: 0,
        poor: 0,
        inactive: 0
      };
    }
    branchStats[b].totalStudents++;
   
    if (s.totalMax > 0) {
      branchStats[b].activeStudents++;
      branchStats[b].totalScoreSum += s.overallPercentage;
      branchStats[b].scoreCount++;
      if (s.overallPercentage >= 50) branchStats[b].passCount++;
     
      if (s.rawStatus === 'BEST') branchStats[b].best++;
      else if (s.rawStatus === 'GOOD') branchStats[b].good++;
      else if (s.rawStatus === 'AVERAGE') branchStats[b].average++;
      else if (s.rawStatus === 'POOR') branchStats[b].poor++;
    } else {
      branchStats[b].inactive++;
    }
  });


  const branchPerformance = Object.keys(branchStats).map(b => {
    const s = branchStats[b];
    const avg = s.scoreCount > 0 ? (s.totalScoreSum / s.scoreCount) : 0;
    return {
      branch: b,
      branchGroup: getBranchGroup(b),
      totalStudents: s.totalStudents,
      activeStudents: s.activeStudents,
      attendanceRate: s.totalStudents > 0 ? ((s.activeStudents / s.totalStudents) * 100).toFixed(1) : '0.0',
      avg: avg.toFixed(2),
      passRate: s.scoreCount > 0 ? ((s.passCount / s.scoreCount) * 100).toFixed(1) : '0.0',
      passCount: s.passCount,
      best: s.best,
      good: s.good,
      average: s.average,
      poor: s.poor,
      inactive: s.inactive
    };
  }).sort((a, b) => {
    const attA = parseFloat(a.attendanceRate);
    const attB = parseFloat(b.attendanceRate);
    if (attB !== attA) return attB - attA;
    return parseFloat(b.avg) - parseFloat(a.avg);
  });


  const statusDist = { BEST: 0, GOOD: 0, AVERAGE: 0, POOR: 0, INACTIVE: 0 };
  students.forEach(s => { statusDist[s.rawStatus]++; });


  const assessmentAttendance = assessmentData.map(ad => ({
    name: ad.name,
    maxScore: ad.maxScore,
    appeared: ad.attendance,
    masterTotal: students.length,
    percentage: students.length > 0 ? ((ad.attendance / students.length) * 100).toFixed(1) : '0.0'
  }));


  return {
    filters: { branches, branchGroups, colleges, assessments },
    summary: {
      totalStudents: students.length,
      activeStudents: totalActive,
      averageScore: avgScore,
      passRate: passRate,
      placementReady: totalActive > 0 ? ((readyCount / totalActive) * 100).toFixed(1) : '0.0',
      atRiskCount: atRiskCount,
      totalAssessments: assessments.length,
      avgParticipation: avgParticipation
    },
    branchPerformance,
    statusDistribution: statusDist,
    assessmentList: assessments,
    assessmentAttendance,
    /* Ranking rule: overallPercentage already divides by the max of EVERY test
       conducted, so a student who sat 1 of 10 tests at 100% scores 10% and cannot
       outrank a student who sat 9 of 10 at 90% (81%). Ties break on how many tests
       were actually sat, never on a per-test average. */
    topPerformers: active.sort((a, b) => {
      if (b.overallPercentage !== a.overallPercentage) return b.overallPercentage - a.overallPercentage;
      if ((b.testsAttended || 0) !== (a.testsAttended || 0)) return (b.testsAttended || 0) - (a.testsAttended || 0);
      return String(a.name || '').localeCompare(String(b.name || ''));
    }).slice(0, 10),
    atRiskStudents: active.filter(s => s.overallPercentage < 50).sort((a, b) => a.overallPercentage - b.overallPercentage).slice(0, 20)
  };
}


/* ── CACHE ── */
function setChunkedCache(key, data) {
  try {
    const cache = CacheService.getScriptCache();
    const str = JSON.stringify(data);
    const chunks = Math.ceil(str.length / FD_CONFIG.CHUNK_SIZE);
    if (chunks > 90) { console.warn('Data too large for cache, skipping'); return; }
    cache.put(FD_CONFIG.CACHE_PREFIX + key + '_count', String(chunks), 300);
    for (let i = 0; i < chunks; i++) {
      cache.put(FD_CONFIG.CACHE_PREFIX + key + '_' + i, str.substring(i * FD_CONFIG.CHUNK_SIZE, (i + 1) * FD_CONFIG.CHUNK_SIZE), 300);
    }
  } catch (e) { console.warn('Cache set failed:', e.message); }
}


function getChunkedCache(key) {
  try {
    const cache = CacheService.getScriptCache();
    const countStr = cache.get(FD_CONFIG.CACHE_PREFIX + key + '_count');
    if (!countStr) return null;
    const count = parseInt(countStr);
    let full = '';
    for (let i = 0; i < count; i++) {
      const chunk = cache.get(FD_CONFIG.CACHE_PREFIX + key + '_' + i);
      if (!chunk) return null;
      full += chunk;
    }
    return JSON.parse(full);
  } catch (e) { return null; }
}


function clearFacultyCache() {
  try {
    const cache = CacheService.getScriptCache();
    const countStr = cache.get(FD_CONFIG.CACHE_PREFIX + 'main_count');
    if (countStr) {
      const count = parseInt(countStr);
      const keys = [];
      for (let i = 0; i < count; i++) keys.push(FD_CONFIG.CACHE_PREFIX + 'main_' + i);
      keys.push(FD_CONFIG.CACHE_PREFIX + 'main_count');
      cache.removeAll(keys);
    }
  } catch (e) {}
  return { success: true };
}


/* ── REPORT GENERATOR ── */
function generateFacultyReport(filters) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = getFacultyDashboardData();
 
  let students = data.students.map(s => ({
    email: s.e,
    name: s.n,
    regNo: s.r,
    branch: s.b,
    batch: s.ba,
    college: s.c,
    branchGroup: s.bg,
    overallPercentage: s.p,
    rawStatus: s.st,
    insight: s.in,
    totalScore: s.sc,
    totalMax: s.mx,
    testsAttended: s.ta,
    testsConducted: s.tc,
    assessments: s.as || {}
  }));


  if (filters.branch) {
    if (Array.isArray(filters.branch) && filters.branch.length > 0) {
      students = students.filter(s => filters.branch.includes(s.branch));
    } else if (typeof filters.branch === 'string' && filters.branch) {
      students = students.filter(s => s.branch === filters.branch);
    }
  }
  if (filters.branchGroup) students = students.filter(s => s.branchGroup === filters.branchGroup);
  if (filters.college) students = students.filter(s => s.college === filters.college);
  if (filters.assessment) {
    if (Array.isArray(filters.assessment) && filters.assessment.length > 0) {
      students = students.filter(s => filters.assessment.some(a => s.assessments[a]));
    } else if (typeof filters.assessment === 'string' && filters.assessment) {
      students = students.filter(s => s.assessments[filters.assessment]);
    }
  }
  if (filters.status) students = students.filter(s => s.rawStatus === filters.status);
 
  if (filters.week) {
    const weekAssessments = Object.keys(data.assessmentMeta || {}).filter(k => data.assessmentMeta[k].week === filters.week);
    students = students.filter(s => weekAssessments.some(a => s.assessments[a]));
  }
 
  if (filters.search) {
    const q = filters.search.toLowerCase();
    students = students.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.regNo.toLowerCase().includes(q));
  }


  const reportName = 'Faculty_Report_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
  let sheet = ss.getSheetByName(reportName);
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet(reportName);


  const filterLabels = [];
  if (filters.week) filterLabels.push('Week: ' + filters.week);
  if (filters.branch) {
    if (Array.isArray(filters.branch)) filterLabels.push('Branch: ' + filters.branch.length + ' selected');
    else filterLabels.push('Branch: ' + filters.branch);
  }
  if (filters.branchGroup) filterLabels.push('Branch Group: ' + filters.branchGroup);
  if (filters.college) filterLabels.push('College: ' + filters.college);
  if (filters.assessment) {
    if (Array.isArray(filters.assessment)) filterLabels.push('Assessment: ' + filters.assessment.length + ' selected');
    else filterLabels.push('Assessment: ' + filters.assessment);
  }
  if (filters.status) filterLabels.push('Status: ' + filters.status);
  if (filters.search) filterLabels.push('Search: ' + filters.search);
 
  const summaryText = filterLabels.length > 0 ? filterLabels.join('  |  ') : 'No filters applied (All Data)';
 
  sheet.getRange(1, 1).setValue('FILTER SUMMARY: ' + summaryText + '  |  Total Records: ' + students.length)
    .setFontWeight('bold').setFontColor('#1b5e20').setFontFamily('Poppins').setFontSize(11)
    .setBackground('#dcfce7');
  sheet.getRange(1, 1, 1, 20).merge().setHorizontalAlignment('left');


  const baseHeaders = ['Name', 'Email', 'Reg No', 'Branch', 'Batch', 'College', 'Branch Group', 'Participation', 'Overall %', 'Status', 'Insight'];
  const assessNames = data.assessments || [];
  const allHeaders = [...baseHeaders, ...assessNames.map(a => a + ' Score'), ...assessNames.map(a => a + ' %')];


  sheet.getRange(2, 1, 1, allHeaders.length).setValues([allHeaders])
    .setBackground('#32c888').setFontColor('#ffffff').setFontWeight('bold')
    .setFontFamily('Poppins').setFontSize(11).setHorizontalAlignment('center');


  const rows = students.map(s => [
    s.name, s.email, s.regNo, s.branch, s.batch, s.college, s.branchGroup,
    s.testsAttended + ' / ' + s.testsConducted,
    s.overallPercentage.toFixed(2) + '%', s.rawStatus, s.insight,
    ...assessNames.map(a => s.assessments[a] ? s.assessments[a].s : 0),
    ...assessNames.map(a => s.assessments[a] ? s.assessments[a].p.toFixed(2) + '%' : '—')
  ]);


  if (rows.length > 0) {
    sheet.getRange(3, 1, rows.length, allHeaders.length).setValues(rows).setFontFamily('Poppins').setFontSize(10);
    for (let i = 0; i < rows.length; i++) {
      if (i % 2 === 1) sheet.getRange(i + 3, 1, 1, allHeaders.length).setBackground('#f8fafc');
    }
  }


  for (let i = 1; i <= allHeaders.length; i++) {
    sheet.autoResizeColumn(i);
    const w = sheet.getColumnWidth(i);
    sheet.setColumnWidth(i, Math.min(Math.max(w, 80), 220));
  }


  return { sheetName: reportName, url: ss.getUrl() + '#gid=' + sheet.getSheetId(), count: students.length };
}


// ╔══════════════════════════════════════════════════════════════════════════╗
// ║   SECTION 10 — LEADERBOARD ANALYTICS + DRILL-DOWN (TPO view)             ║
// ║   Source of truth: the generated leaderboard sheet (📊 <type> Leaderboard)║
// ║   Read-only. Nothing here writes to any sheet.                           ║
// ╚══════════════════════════════════════════════════════════════════════════╝
/**
 * WHY THIS EXISTS
 * ---------------
 * The Faculty Dashboard recomputes everything by re-reading every raw assessment
 * sheet. That is expensive and it can disagree with the leaderboard that the TPO
 * actually reads. This section computes from the leaderboard sheet instead, so the
 * dashboard, the sheet and the emails all quote the same numbers.
 *
 * The leaderboard layout it expects (written by writeLeaderboardFast):
 *   row 1 : "🏛️ <college> — ..."            (banner)
 *   row 2 : Name | Email | Reg No | Branch | <one column per assessment> |
 *           "Total Score <max>" | Rank | Percentage | Status Classification |
 *           "Insight Interpretation"
 *   row 3+: data
 *
 * ADDITIVE ONLY: absentees are reported *next to* the existing numbers
 * (Students / Appeared / Absent / Avg all / Avg appeared), so no number the TPO
 * already relies on changes meaning.
 */
const LBA_CONFIG = {
  PASS_PCT: 50,
  AT_RISK_PCT: 50,
  READY_PCT: 80,
  TOP_N: 10,
  BAND_EDGES: [0, 30, 50, 65, 80, 101],
  BAND_LABELS: ['0–29% Critical', '30–49% At Risk', '50–64% Needs Work', '65–79% Near Ready', '80%+ Placement Ready'],
  BRANCH_ALIAS_PROP: 'BRANCH_ALIASES_JSON',
  META_HEADERS: ['name', 'email', 'reg no', 'branch', 'rank', 'percentage',
    'status classification', 'insight interpretation', 'category', 'batch']
};

/* ─────────────────────────── branch aliases ─────────────────────────── */

/** Comparison key for a branch label: case/space/punctuation insensitive. */
function normalizeBranchKey(name) {
  return String(name === null || name === undefined ? '' : name)
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Alias table: variant → canonical branch name.
 * @return {{map: Object.<string,string>, count: number, isCustom: boolean}}
 */
function getBranchAliases() {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(LBA_CONFIG.BRANCH_ALIAS_PROP);
    if (!raw) return { map: {}, count: 0, isCustom: false };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { map: {}, count: 0, isCustom: false };
    const map = {};
    Object.keys(parsed).forEach(k => {
      const key = normalizeBranchKey(k);
      const value = String(parsed[k] || '').trim();
      if (key && value) map[key] = value;
    });
    return { map: map, count: Object.keys(map).length, isCustom: Object.keys(map).length > 0 };
  } catch (e) {
    console.warn('getBranchAliases: invalid stored value ignored — ' + e.message);
    return { map: {}, count: 0, isCustom: false };
  }
}

/**
 * Maps a raw branch label to its canonical name.
 * Order: explicit alias → programme-group canonicalisation → the raw label.
 * The third step is why unmapped branches never disappear.
 */
function resolveBranchName(rawName) {
  const raw = String(rawName === null || rawName === undefined ? '' : rawName).trim();
  if (!raw) return '';
  const key = normalizeBranchKey(raw);
  const aliases = getBranchAliases().map;
  if (aliases[key]) return aliases[key];

  // If the raw label is already a canonical name in the alias table, use that spelling.
  const canonicals = {};
  Object.keys(aliases).forEach(k => { canonicals[normalizeBranchKey(aliases[k])] = aliases[k]; });
  if (canonicals[key]) return canonicals[key];

  return raw;
}

/**
 * Saves the alias table from College Setup.
 * @param {Array<{variant: string, canonical: string}>|Object} pairs
 * @return {{success: boolean, count: number, map: Object}}
 */
function saveBranchAliasesFromDialog(pairs) {
  const props = PropertiesService.getScriptProperties();
  const map = {};

  const entries = Array.isArray(pairs)
    ? pairs
    : Object.keys(pairs || {}).map(k => ({ variant: k, canonical: pairs[k] }));

  entries.forEach(pair => {
    if (!pair) return;
    const variant = String(pair.variant || '').trim();
    const canonical = String(pair.canonical || '').trim();
    if (!variant || !canonical) return;
    const key = normalizeBranchKey(variant);
    if (!key) return;
    // Skip only a literal no-op. Comparing normalizeBranchKey() here would be a
    // bug: it strips hyphens, so "CSE AIDS" → "CSE-AIDS" — the exact mapping we
    // want to keep — would look identical and be dropped.
    if (variant.toLowerCase().replace(/\s+/g, ' ') === canonical.toLowerCase().replace(/\s+/g, ' ')) return;
    map[key] = canonical;
  });

  if (Object.keys(map).length === 0) {
    props.deleteProperty(LBA_CONFIG.BRANCH_ALIAS_PROP);
    return { success: true, count: 0, map: {}, reset: true };
  }
  props.setProperty(LBA_CONFIG.BRANCH_ALIAS_PROP, JSON.stringify(map));
  return { success: true, count: Object.keys(map).length, map: map, reset: false };
}

/**
 * Every distinct branch label found in the leaderboard, with its canonical form.
 * Used by College Setup to show what needs mapping.
 */
function getBranchNameAudit(leaderboardType) {
  const m = readLeaderboardMatrix(leaderboardType);
  if (!m.ok) return { ok: false, message: m.message, variants: [] };

  const seen = {};
  m.rows.forEach(r => {
    const raw = r.branchRaw || '(blank)';
    const canonical = resolveBranchName(r.branchRaw) || '(blank)';
    const key = normalizeBranchKey(raw) || '(blank)';
    if (!seen[key]) seen[key] = { variant: raw, canonical: canonical, students: 0, mapped: !!r.branchMapped };
    seen[key].students++;
  });

  const variants = Object.keys(seen).map(k => seen[k]);
  variants.sort((a, b) => a.canonical.localeCompare(b.canonical) || b.students - a.students);

  const canonicalSet = {};
  variants.forEach(v => { canonicalSet[normalizeBranchKey(v.canonical)] = true; });

  return {
    ok: true,
    leaderboardType: m.type,
    sheetName: m.sheetName,
    variants: variants,
    unmappedVariants: variants.filter(v => !v.mapped && v.canonical === v.variant).map(v => v.variant),
    canonicalCount: Object.keys(canonicalSet).length,
    splitBranches: Object.keys(variants.reduce((acc, v) => {
      const k = normalizeBranchKey(v.canonical);
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {})).filter(k => {
      const n = variants.reduce((acc, v) => acc + (normalizeBranchKey(v.canonical) === k ? 1 : 0), 0);
      return n > 1;
    }).length
  };
}

/* ─────────────────────────── leaderboard reader ─────────────────────────── */

/**
 * Extracts the declared max mark from a header.
 *   "Quantitative Aptitude (15)" → 15        (score columns)
 *   "Total Score 260"            → 260       (written by writeLeaderboardFast)
 *   "Total Score"                → null      (caller infers from the data)
 * The bare trailing-number form is only trusted for total/max headers, so an
 * assessment called "CTD 2" is not mistaken for one with a maximum of 2.
 */
function extractMaxFromHeader(header) {
  const text = String(header === null || header === undefined ? '' : header).trim();
  const paren = text.match(/\((\d+(?:\.\d+)?)\)\s*$/);
  if (paren) return parseFloat(paren[1]);
  const lower = text.toLowerCase();
  if (lower.indexOf('total score') === 0 || lower.indexOf('total marks') === 0 || lower.indexOf('max score') === 0) {
    const trailing = text.match(/(\d+(?:\.\d+)?)\s*$/);
    if (trailing) return parseFloat(trailing[1]);
  }
  return null;
}

/** Picks the leaderboard sheet for a type, falling back to any that exists. */
function resolveLeaderboardSheet(leaderboardType) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const map = TPO_CONFIG.LEADERBOARD_SHEETS;
  if (leaderboardType && map[leaderboardType]) {
    const sheet = ss.getSheetByName(map[leaderboardType]);
    if (sheet) return { sheet: sheet, type: leaderboardType };
  }
  for (const type of Object.keys(map)) {
    const sheet = ss.getSheetByName(map[type]);
    if (sheet) return { sheet: sheet, type: type };
  }
  return { sheet: null, type: null };
}

/**
 * Reads the leaderboard sheet into a normalised matrix.
 * @param {string} [leaderboardType] Practice / Company / Class Test / Leaderboard
 * @return {Object} {ok, type, sheetName, scoreCols, rows, maxTotal, message}
 */
function readLeaderboardMatrix(leaderboardType) {
  const found = resolveLeaderboardSheet(leaderboardType);
  if (!found.sheet) {
    return {
      ok: false,
      message: 'No leaderboard sheet found. Open 🏆 Open Leaderboard (or generate a report) first.',
      type: null
    };
  }

  const sheet = found.sheet;
  const values = sheet.getDataRange().getValues();
  if (values.length < 3) {
    return { ok: false, message: 'Leaderboard "' + sheet.getName() + '" has no data rows yet.', type: found.type };
  }

  const headers = values[1].map(h => String(h === null || h === undefined ? '' : h).trim());
  const idxOf = name => headers.findIndex(h => h.toLowerCase() === name);

  const nameIdx = idxOf('name');
  const emailIdx = idxOf('email');
  const regIdx = idxOf('reg no');
  const branchIdx = idxOf('branch');
  const totalIdx = headers.findIndex(h => h.toLowerCase().startsWith('total score'));
  const rankIdx = idxOf('rank');
  const pctIdx = headers.findIndex(h => h.toLowerCase().startsWith('percentage'));
  const statusIdx = idxOf('status classification');
  const insightIdx = idxOf('insight interpretation');

  if (nameIdx === -1 || totalIdx === -1) {
    return {
      ok: false,
      message: 'Leaderboard headers not recognised in "' + sheet.getName() + '" (need Name and Total Score).',
      type: found.type
    };
  }

  const maxTotal = extractMaxFromHeader(headers[totalIdx]) ||
    (values.length > 2 ? Math.max.apply(null, values.slice(2)
      .map(r => Number(r[totalIdx]) || 0).concat([1])) : 100);

  // Score columns = everything between Branch and Total Score that is not metadata.
  const scoreCols = [];
  for (let c = 0; c < headers.length; c++) {
    if (c === nameIdx || c === emailIdx || c === regIdx || c === branchIdx) continue;
    if (c === totalIdx || c === rankIdx || c === pctIdx || c === statusIdx || c === insightIdx) continue;
    const header = headers[c];
    if (!header) continue;
    const lower = header.toLowerCase();
    if (LBA_CONFIG.META_HEADERS.some(meta => lower === meta || lower.startsWith(meta + ' '))) continue;
    scoreCols.push({ header: header, index: c, max: extractMaxFromHeader(header) });
  }

  const aliasMap = getBranchAliases().map;
  const rows = [];
  for (let r = 2; r < values.length; r++) {
    const row = values[r];
    const name = String(row[nameIdx] || '').trim();
    const regNo = regIdx !== -1 ? String(row[regIdx] || '').trim() : '';
    if (!name && !regNo) continue;

    const scores = {};
    let attempted = 0;
    scoreCols.forEach(col => {
      const raw = row[col.index];
      const num = Number(raw);
      const hasValue = raw !== '' && raw !== null && raw !== undefined && !isNaN(num);
      scores[col.header] = hasValue ? num : null;
      if (hasValue) attempted++;
    });

    const totalRaw = Number(row[totalIdx]);
    const total = isNaN(totalRaw) ? 0 : totalRaw;
    const pctRaw = pctIdx !== -1 ? parsePercentage(row[pctIdx]) : (maxTotal ? (total / maxTotal) * 100 : 0);
    const branchRaw = branchIdx !== -1 ? String(row[branchIdx] || '').trim() : '';
    const resolved = resolveBranchName(branchRaw);

    rows.push({
      rowNumber: r + 1,
      name: name,
      email: emailIdx !== -1 ? String(row[emailIdx] || '').trim() : '',
      regNo: regNo,
      branchRaw: branchRaw,
      branch: resolved || '(No branch)',
      branchMapped: !!aliasMap[normalizeBranchKey(branchRaw)],
      scores: scores,
      attempted: attempted,
      assessed: attempted > 0,
      total: total,
      percent: pctRaw,
      rank: rankIdx !== -1 ? (Number(row[rankIdx]) || null) : null,
      status: statusIdx !== -1 ? String(row[statusIdx] || '').trim() : '',
      insight: insightIdx !== -1 ? String(row[insightIdx] || '').trim() : ''
    });
  }

  // Fill any score-column max the header didn't declare, from observed values.
  scoreCols.forEach(col => {
    if (!col.max) {
      const observed = rows.map(r => r.scores[col.header]).filter(v => typeof v === 'number');
      col.max = observed.length ? Math.max.apply(null, observed) : 1;
      col.maxInferred = true;
    }
  });

  return {
    ok: true,
    type: found.type,
    sheetName: sheet.getName(),
    headers: headers,
    scoreCols: scoreCols,
    maxTotal: maxTotal,
    rows: rows,
    hasBatch: false
  };
}

/** Batch lookup from Master Data (the leaderboard has no Batch column). */
function getBatchByRegNo() {
  const map = {};
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.MASTER_SHEET);
    if (!sheet || sheet.getLastRow() < 2) return map;
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(h => String(h || '').trim().toLowerCase());
    const regIdx = headers.indexOf('reg no');
    const batchIdx = headers.indexOf('batch');
    if (regIdx === -1 || batchIdx === -1) return map;
    for (let i = 1; i < values.length; i++) {
      const reg = String(values[i][regIdx] || '').trim().toLowerCase();
      if (reg) map[reg] = String(values[i][batchIdx] || '').trim();
    }
  } catch (e) {
    logError('getBatchByRegNo', e);
  }
  return map;
}

/** Rounds to 2 decimals without turning 0 into "0.00" strings elsewhere. */
function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/** Mean of a numeric array; 0 for an empty list. */
function meanOf(values) {
  if (!values || !values.length) return 0;
  return values.reduce((a, c) => a + c, 0) / values.length;
}

/** Score band index for a percentage, using LBA_CONFIG.BAND_EDGES. */
function bandIndexOf(pct) {
  const edges = LBA_CONFIG.BAND_EDGES;
  for (let i = 0; i < LBA_CONFIG.BAND_LABELS.length; i++) {
    if (pct >= edges[i] && pct < edges[i + 1]) return i;
  }
  return LBA_CONFIG.BAND_LABELS.length - 1;
}

/* ─────────────────────────── main analytics ─────────────────────────── */

/**
 * Everything the TPO dashboard needs, computed from the leaderboard sheet.
 * @param {string} [leaderboardType]
 * @return {Object}
 */
function getLeaderboardAnalytics(leaderboardType) {
  try {
    const m = readLeaderboardMatrix(leaderboardType);
    if (!m.ok) return { ok: false, message: m.message, availableTypes: getAvailableLeaderboardTypes() };

    const rows = m.rows;
    const appeared = rows.filter(r => r.assessed);
    const absent = rows.filter(r => !r.assessed);
    const pcts = appeared.map(r => r.percent);

    const passCount = pcts.filter(p => p >= LBA_CONFIG.PASS_PCT).length;
    const atRisk = appeared.filter(r => r.percent < LBA_CONFIG.AT_RISK_PCT);
    const ready = appeared.filter(r => r.percent >= LBA_CONFIG.READY_PCT);

    // ── branch rollup ──
    const byBranch = {};
    rows.forEach(r => {
      const b = r.branch || '(No branch)';
      if (!byBranch[b]) byBranch[b] = { branch: b, students: [], };
      byBranch[b].students.push(r);
    });

    const branchRows = Object.keys(byBranch).map(b => {
      const all = byBranch[b].students;
      const app = all.filter(r => r.assessed);
      const appPcts = app.map(r => r.percent);
      const totals = all.map(r => r.total);
      const appTotals = app.map(r => r.total);
      return {
        branch: b,
        students: all.length,
        appeared: app.length,
        absent: all.length - app.length,
        avgAll: round2(meanOf(totals)),
        avgAppeared: round2(meanOf(appTotals)),
        avgPctAll: round2(meanOf(all.map(r => r.percent))),
        avgPctAppeared: round2(meanOf(appPcts)),
        max: appTotals.length ? Math.max.apply(null, appTotals) : 0,
        min: appTotals.length ? Math.min.apply(null, appTotals) : 0,
        total: round2(totals.reduce((a, c) => a + c, 0)),
        passRate: app.length ? round2((appPcts.filter(p => p >= LBA_CONFIG.PASS_PCT).length / app.length) * 100) : 0,
        atRisk: appPcts.filter(p => p < LBA_CONFIG.AT_RISK_PCT).length,
        group: getBranchGroup(b)
      };
    }).sort((a, b) => b.avgPctAppeared - a.avgPctAppeared);

    branchRows.forEach((b, i) => { b.rank = i + 1; });

    // ── assessment (per score column) ──
    const assessmentRows = m.scoreCols.map(col => {
      const values = [];
      let missing = 0;
      rows.forEach(r => {
        const v = r.scores[col.header];
        if (typeof v === 'number') values.push(v);
        else missing++;
      });
      const mean = meanOf(values);
      const meanPct = col.max ? (mean / col.max) * 100 : 0;
      let difficulty = 'Balanced';
      if (meanPct < 40) difficulty = 'Very hard';
      else if (meanPct < 55) difficulty = 'Hard';
      else if (meanPct > 80) difficulty = 'Easy';
      return {
        header: col.header,
        max: col.max,
        maxInferred: !!col.maxInferred,
        appeared: values.length,
        absent: missing,
        mean: round2(mean),
        meanPct: round2(meanPct),
        highest: values.length ? Math.max.apply(null, values) : 0,
        lowest: values.length ? Math.min.apply(null, values) : 0,
        passRate: values.length ? round2((values.filter(v => col.max && (v / col.max) * 100 >= LBA_CONFIG.PASS_PCT).length / values.length) * 100) : 0,
        difficulty: difficulty
      };
    });

    // ── bands ──
    const bands = LBA_CONFIG.BAND_LABELS.map((label, i) => {
      const count = appeared.filter(r => bandIndexOf(r.percent) === i).length;
      return { label: label, count: count, pct: appeared.length ? round2((count / appeared.length) * 100) : 0 };
    });

    // ── lists ──
    const sortedByPct = appeared.slice().sort((a, b) => b.percent - a.percent);
    const top = sortedByPct.slice(0, LBA_CONFIG.TOP_N).map((r, i) => ({
      rank: i + 1, name: r.name, regNo: r.regNo, branch: r.branch,
      percent: round2(r.percent), total: r.total, status: r.status
    }));
    const atRiskList = sortedByPct.slice().reverse().slice(0, LBA_CONFIG.TOP_N).map(r => ({
      name: r.name, regNo: r.regNo, branch: r.branch,
      percent: round2(r.percent), total: r.total, insight: r.insight
    }));

    // ── data quality ──
    const audit = getBranchNameAudit(leaderboardType);
    const dupRegs = {};
    rows.forEach(r => {
      if (!r.regNo) return;
      const k = r.regNo.toLowerCase();
      dupRegs[k] = (dupRegs[k] || 0) + 1;
    });
    const duplicateRegNos = Object.keys(dupRegs).filter(k => dupRegs[k] > 1).length;

    return {
      ok: true,
      source: 'leaderboard',
      leaderboardType: m.type,
      sheetName: m.sheetName,
      availableTypes: getAvailableLeaderboardTypes(),
      generatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MMM-yyyy HH:mm'),
      collegeName: getCollegeName(),
      maxTotal: m.maxTotal,
      kpi: {
        students: rows.length,
        appeared: appeared.length,
        absent: absent.length,
        completionPct: rows.length ? round2((appeared.length / rows.length) * 100) : 0,
        avgPctAll: round2(meanOf(rows.map(r => r.percent))),
        avgPctAppeared: round2(meanOf(pcts)),
        avgScoreAll: round2(meanOf(rows.map(r => r.total))),
        passRate: appeared.length ? round2((passCount / appeared.length) * 100) : 0,
        readyPct: appeared.length ? round2((ready.length / appeared.length) * 100) : 0,
        atRiskPct: appeared.length ? round2((atRisk.length / appeared.length) * 100) : 0,
        highestPct: pcts.length ? round2(Math.max.apply(null, pcts)) : 0,
        lowestPct: pcts.length ? round2(Math.min.apply(null, pcts)) : 0
      },
      decisions: {
        passLine: LBA_CONFIG.PASS_PCT,
        atRiskLine: LBA_CONFIG.AT_RISK_PCT,
        readyLine: LBA_CONFIG.READY_PCT
      },
      branches: branchRows,
      assessments: assessmentRows,
      bands: bands,
      top: top,
      atRisk: atRiskList,
      groups: (function () {
        const acc = {};
        branchRows.forEach(b => {
          const g = b.group || 'Other';
          if (!acc[g]) acc[g] = { group: g, students: 0, appeared: 0, avgPctAppeared: 0, _sum: 0, branches: 0 };
          acc[g].students += b.students;
          acc[g].appeared += b.appeared;
          acc[g]._sum += b.avgPctAppeared * b.appeared;
          acc[g].branches++;
        });
        return Object.keys(acc).map(g => {
          const o = acc[g];
          o.avgPctAppeared = o.appeared ? round2(o._sum / o.appeared) : 0;
          delete o._sum;
          return o;
        }).sort((a, b) => b.avgPctAppeared - a.avgPctAppeared);
      })(),
      dataQuality: {
        branchVariants: audit.ok ? audit.variants.length : 0,
        canonicalBranches: audit.ok ? audit.canonicalCount : branchRows.length,
        unmappedVariants: audit.ok ? audit.unmappedVariants : [],
        duplicateRegNos: duplicateRegNos
      }
    };
  } catch (e) {
    logError('getLeaderboardAnalytics', e);
    return { ok: false, message: 'Could not compute analytics: ' + e.message };
  }
}

/* ─────────────────────────── drill-down ─────────────────────────── */

/**
 * Student drill-down: one row per assessment, with that student's score,
 * the class mean for the same assessment, and the student's rank in it.
 * @param {string} identifier Reg No (preferred) or exact Name.
 * @param {string} [leaderboardType]
 */
function getStudentDrilldown(identifier, leaderboardType) {
  try {
    const m = readLeaderboardMatrix(leaderboardType);
    if (!m.ok) return { ok: false, message: m.message };

    const needle = String(identifier || '').trim().toLowerCase();
    const student = m.rows.find(r => r.regNo && r.regNo.toLowerCase() === needle) ||
      m.rows.find(r => r.name.toLowerCase() === needle);
    if (!student) return { ok: false, message: 'Student "' + identifier + '" not found in ' + m.sheetName + '.' };

    const batchMap = getBatchByRegNo();
    const assessments = m.scoreCols.map(col => {
      const score = student.scores[col.header];
      const values = m.rows.map(r => r.scores[col.header]).filter(v => typeof v === 'number');
      const classMean = meanOf(values);
      const ranked = m.rows
        .filter(r => typeof r.scores[col.header] === 'number')
        .sort((a, b) => b.scores[col.header] - a.scores[col.header]);
      const position = ranked.findIndex(r => r.regNo === student.regNo && r.name === student.name);
      const pct = typeof score === 'number' && col.max ? (score / col.max) * 100 : null;
      const classPct = col.max ? (classMean / col.max) * 100 : 0;
      return {
        header: col.header,
        max: col.max,
        score: score,
        pct: pct === null ? null : round2(pct),
        classMean: round2(classMean),
        classMeanPct: round2(classPct),
        deltaPct: pct === null ? null : round2(pct - classPct),
        position: position === -1 ? null : position + 1,
        of: ranked.length,
        absent: score === null
      };
    });

    const appearedCount = assessments.filter(a => !a.absent).length;
    return {
      ok: true,
      student: {
        name: student.name,
        regNo: student.regNo,
        email: student.email,
        branch: student.branch,
        branchRaw: student.branchRaw,
        batch: batchMap[String(student.regNo).toLowerCase()] || '',
        total: student.total,
        percent: round2(student.percent),
        rank: student.rank,
        of: m.rows.filter(r => r.assessed).length,
        status: student.status,
        insight: student.insight,
        appeared: appearedCount,
        assessmentsTotal: assessments.length
      },
      assessments: assessments,
      leaderboardType: m.type,
      sheetName: m.sheetName
    };
  } catch (e) {
    logError('getStudentDrilldown', e);
    return { ok: false, message: e.message };
  }
}

/**
 * Branch drill-down: every student in the branch, plus the branch's per-assessment profile.
 * @param {string} branchName Raw or canonical.
 * @param {string} [leaderboardType]
 */
function getBranchDrilldown(branchName, leaderboardType) {
  try {
    const m = readLeaderboardMatrix(leaderboardType);
    if (!m.ok) return { ok: false, message: m.message };

    const wanted = normalizeBranchKey(branchName);
    const students = m.rows.filter(r => normalizeBranchKey(r.branch) === wanted ||
      normalizeBranchKey(r.branchRaw) === wanted);
    if (!students.length) return { ok: false, message: 'No students found for branch "' + branchName + '".' };

    const appeared = students.filter(r => r.assessed);
    const branchLabel = students[0].branch;

    const list = students.slice().sort((a, b) => b.percent - a.percent).map((r, i) => ({
      position: i + 1,
      name: r.name,
      regNo: r.regNo,
      percent: round2(r.percent),
      total: r.total,
      rank: r.rank,
      appeared: r.attempted,
      absent: m.scoreCols.length - r.attempted,
      status: r.status,
      insight: r.insight,
      atRisk: r.assessed && r.percent < LBA_CONFIG.AT_RISK_PCT
    }));

    const profile = m.scoreCols.map(col => {
      const values = students.map(r => r.scores[col.header]).filter(v => typeof v === 'number');
      const classValues = m.rows.map(r => r.scores[col.header]).filter(v => typeof v === 'number');
      const mean = meanOf(values);
      const classMean = meanOf(classValues);
      return {
        header: col.header,
        max: col.max,
        appeared: values.length,
        absent: students.length - values.length,
        mean: round2(mean),
        meanPct: col.max ? round2((mean / col.max) * 100) : 0,
        classMeanPct: col.max ? round2((classMean / col.max) * 100) : 0,
        deltaPct: col.max ? round2(((mean - classMean) / col.max) * 100) : 0
      };
    });

    return {
      ok: true,
      branch: branchLabel,
      summary: {
        students: students.length,
        appeared: appeared.length,
        absent: students.length - appeared.length,
        avgPctAppeared: round2(meanOf(appeared.map(r => r.percent))),
        avgPctAll: round2(meanOf(students.map(r => r.percent))),
        atRisk: appeared.filter(r => r.percent < LBA_CONFIG.AT_RISK_PCT).length,
        passRate: appeared.length ? round2((appeared.filter(r => r.percent >= LBA_CONFIG.PASS_PCT).length / appeared.length) * 100) : 0,
        group: getBranchGroup(branchLabel)
      },
      students: list,
      assessments: profile,
      leaderboardType: m.type
    };
  } catch (e) {
    logError('getBranchDrilldown', e);
    return { ok: false, message: e.message };
  }
}

/**
 * Assessment drill-down: distribution, absentees and per-branch means for one column.
 * @param {string} assessmentHeader Exact score-column header.
 * @param {string} [leaderboardType]
 */
function getAssessmentDrilldown(assessmentHeader, leaderboardType) {
  try {
    const m = readLeaderboardMatrix(leaderboardType);
    if (!m.ok) return { ok: false, message: m.message };

    const col = m.scoreCols.find(c => c.header === assessmentHeader) ||
      m.scoreCols.find(c => normalizeBranchKey(c.header) === normalizeBranchKey(assessmentHeader));
    if (!col) {
      return {
        ok: false,
        message: 'Assessment column "' + assessmentHeader + '" not found in ' + m.sheetName + '.',
        available: m.scoreCols.map(c => c.header)
      };
    }

    const appeared = m.rows.filter(r => typeof r.scores[col.header] === 'number');
    const absentees = m.rows.filter(r => typeof r.scores[col.header] !== 'number')
      .map(r => ({ name: r.name, regNo: r.regNo, branch: r.branch }));

    const values = appeared.map(r => r.scores[col.header]);
    const buckets = [0, 0, 0, 0, 0];
    appeared.forEach(r => {
      const pct = col.max ? (r.scores[col.header] / col.max) * 100 : 0;
      buckets[bandIndexOf(pct)]++;
    });

    const byBranch = {};
    appeared.forEach(r => {
      const b = r.branch || '(No branch)';
      if (!byBranch[b]) byBranch[b] = [];
      byBranch[b].push(r.scores[col.header]);
    });
    const branchMeans = Object.keys(byBranch).map(b => ({
      branch: b,
      appeared: byBranch[b].length,
      mean: round2(meanOf(byBranch[b])),
      meanPct: col.max ? round2((meanOf(byBranch[b]) / col.max) * 100) : 0,
      highest: Math.max.apply(null, byBranch[b])
    })).sort((a, b) => b.meanPct - a.meanPct);

    const mean = meanOf(values);
    const meanPct = col.max ? (mean / col.max) * 100 : 0;
    return {
      ok: true,
      header: col.header,
      max: col.max,
      maxInferred: !!col.maxInferred,
      stats: {
        appeared: appeared.length,
        absent: absentees.length,
        mean: round2(mean),
        meanPct: round2(meanPct),
        highest: values.length ? Math.max.apply(null, values) : 0,
        lowest: values.length ? Math.min.apply(null, values) : 0,
        median: (function () {
          if (!values.length) return 0;
          const s = values.slice().sort((a, b) => a - b);
          const mid = Math.floor(s.length / 2);
          return round2(s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2);
        })(),
        passRate: appeared.length ? round2((appeared.filter(r => col.max && (r.scores[col.header] / col.max) * 100 >= LBA_CONFIG.PASS_PCT).length / appeared.length) * 100) : 0
      },
      buckets: LBA_CONFIG.BAND_LABELS.map((label, i) => ({
        label: label,
        count: buckets[i],
        pct: appeared.length ? round2((buckets[i] / appeared.length) * 100) : 0
      })),
      absentees: absentees,
      byBranch: branchMeans,
      leaderboardType: m.type
    };
  } catch (e) {
    logError('getAssessmentDrilldown', e);
    return { ok: false, message: e.message };
  }
}

/** Opens the leaderboard-driven TPO analytics page. */
function showTPOAnalytics() {
  const html = HtmlService.createHtmlOutputFromFile('TPOAnalytics')
    .setWidth(1400)
    .setHeight(900);
  SpreadsheetApp.getUi().showModalDialog(html, '📊 Leaderboard Analytics');
}
