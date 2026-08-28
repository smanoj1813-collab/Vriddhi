#!/usr/bin/env node
// scripts/generate-firestore-indexes.cjs
// Generates firestore.indexes.json by scanning codebase for Firestore queries
// and including known required composite indexes for Vriddhi

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INDEX_FILE = path.join(ROOT, 'firestore.indexes.json');

// ─── Known required indexes for Vriddhi ───
// These are derived from actual queries in the codebase
const KNOWN_INDEXES = [
  // ─── Questions collection — core academic queries ───
  { collectionGroup: 'questions', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  { collectionGroup: 'questions', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'subject', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  { collectionGroup: 'questions', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'difficulty', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  { collectionGroup: 'questions', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'type', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  { collectionGroup: 'questions', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  { collectionGroup: 'questions', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'batch', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  { collectionGroup: 'questions', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'branch', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  { collectionGroup: 'questions', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'createdBy', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  { collectionGroup: 'questions', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'subject', order: 'ASCENDING' }, { fieldPath: 'difficulty', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  { collectionGroup: 'questions', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'isPYQ', order: 'ASCENDING' }, { fieldPath: 'examYear', order: 'DESCENDING' }] },
  { collectionGroup: 'questions', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'isPYQ', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },

  // ─── Papers collection ───
  { collectionGroup: 'papers', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  { collectionGroup: 'papers', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  { collectionGroup: 'papers', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'createdBy', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },

  // ─── Students ───
  { collectionGroup: 'students', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }] },
  { collectionGroup: 'students', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'batch', order: 'ASCENDING' }] },
  { collectionGroup: 'students', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'department', order: 'ASCENDING' }] },
  { collectionGroup: 'students', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },

  // ─── Faculty ───
  { collectionGroup: 'faculty', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'department', order: 'ASCENDING' }] },
  { collectionGroup: 'faculty', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }] },
  { collectionGroup: 'faculty', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },

  // ─── AI Generation Logs ───
  { collectionGroup: 'ai_generation_logs', fields: [{ fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  { collectionGroup: 'ai_generation_logs', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  { collectionGroup: 'ai_generation_logs', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },

  // ─── AI Usage ───
  { collectionGroup: 'ai_usage', fields: [{ fieldPath: 'date', order: 'ASCENDING' }] },

  // ─── Syllabus Extracts ───
  { collectionGroup: 'syllabusExtracts', fields: [{ fieldPath: 'status', order: 'ASCENDING' }, { fieldPath: 'extractedAt', order: 'DESCENDING' }] },
  { collectionGroup: 'syllabusExtracts', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'extractedAt', order: 'DESCENDING' }] },

  // ─── Curriculum ───
  { collectionGroup: 'curriculum', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  { collectionGroup: 'curriculum', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }] },

  // ─── Student Assessments ───
  { collectionGroup: 'studentAssessments', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'studentId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  { collectionGroup: 'studentAssessments', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'studentId', order: 'ASCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }] },
  { collectionGroup: 'studentAssessments', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'testId', order: 'ASCENDING' }, { fieldPath: 'studentId', order: 'ASCENDING' }] },
  { collectionGroup: 'studentAssessments', fields: [{ fieldPath: 'testId', order: 'ASCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }, { fieldPath: 'marksObtained', order: 'DESCENDING' }] },

  // ─── Attendance ───
  { collectionGroup: 'attendance', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'date', order: 'DESCENDING' }] },
  { collectionGroup: 'attendance', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'studentId', order: 'ASCENDING' }, { fieldPath: 'date', order: 'DESCENDING' }] },
  { collectionGroup: 'attendanceRecords', fields: [{ fieldPath: 'collegeId', order: 'ASCENDING' }, { fieldPath: 'date', order: 'DESCENDING' }] },

  // ─── Papers Universal ───
  { collectionGroup: 'papers_universal', fields: [{ fieldPath: 'createdAt', order: 'DESCENDING' }] },

  // ─── QuestionBank Meta ───
  { collectionGroup: 'questionBank_meta', fields: [{ fieldPath: 'status', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
  { collectionGroup: 'questionBank_meta', fields: [{ fieldPath: 'subjectId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
];

function dedupeIndexes(indexes) {
  const seen = new Set();
  const result = [];
  for (const idx of indexes) {
    const key = `${idx.collectionGroup}|${idx.fields.map(f => `${f.fieldPath}:${f.order}`).join(',')}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({
        collectionGroup: idx.collectionGroup,
        queryScope: 'COLLECTION',
        fields: idx.fields,
      });
    }
  }
  return result;
}

function main() {
  console.log('🔍 Generating Firestore indexes for Vriddhi...\n');

  // Read existing file to preserve any manual additions
  let existing = { indexes: [], fieldOverrides: [] };
  if (fs.existsSync(INDEX_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
      console.log(`📖 Found existing ${INDEX_FILE} with ${existing.indexes?.length || 0} indexes`);
    } catch (e) {
      console.warn('⚠️  Could not parse existing indexes file, starting fresh');
    }
  }

  // Merge known + existing
  const allIndexes = [...KNOWN_INDEXES, ...(existing.indexes || [])];
  const deduped = dedupeIndexes(allIndexes);

  // Sort for readability
  deduped.sort((a, b) => {
    if (a.collectionGroup !== b.collectionGroup) return a.collectionGroup.localeCompare(b.collectionGroup);
    return a.fields[0].fieldPath.localeCompare(b.fields[0].fieldPath);
  });

  const output = {
    indexes: deduped,
    fieldOverrides: existing.fieldOverrides || [],
  };

  fs.writeFileSync(INDEX_FILE, JSON.stringify(output, null, 2) + '\n');
  console.log(`\n✅ Generated ${deduped.length} composite indexes → ${INDEX_FILE}`);
  console.log('\n📋 Breakdown by collection:');
  const byCollection = {};
  deduped.forEach(idx => {
    byCollection[idx.collectionGroup] = (byCollection[idx.collectionGroup] || 0) + 1;
  });
  Object.entries(byCollection).sort().forEach(([coll, count]) => {
    console.log(`   - ${coll}: ${count} indexes`);
  });
  console.log('\n🚀 Next steps:');
  console.log('   1. Review firestore.indexes.json');
  console.log('   2. Deploy: firebase deploy --only firestore:indexes');
  console.log('   3. Check Firebase Console > Firestore > Indexes for status');
}

if (require.main === module) {
  main();
}

module.exports = { KNOWN_INDEXES, dedupeIndexes };
