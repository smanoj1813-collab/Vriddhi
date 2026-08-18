// fix-student-imports.mjs
import fs from 'fs';
import path from 'path';

const studentDir = 'src/modules/student';
const files = [];

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.ts') || p.endsWith('.tsx')) files.push(p);
  }
}
walk(studentDir);

const replacements = [
  // from student/components/*.tsx  (depth: src/modules/student/components/)
  { regex: /from ['"]\.\.\/\.\.\/hooks\/useAuth['"]/g, to: `from '../../../../shared/hooks/useAuth'` },
  { regex: /from ['"]\.\.\/\.\.\/hooks\/useAssessment['"]/g, to: `from '../../../../shared/hooks/useAssessment'` },
  { regex: /from ['"]\.\.\/\.\.\/types\/assessment['"]/g, to: `from '../../../../shared/types/assessment'` },
  { regex: /from ['"]\.\.\/\.\.\/types\/student['"]/g, to: `from '../../../../shared/types/student'` },

  // from student/hooks/*.ts  (depth: src/modules/student/hooks/)
  { regex: /from ['"]\.\.\/Firebase\/config['"]/g, to: `from '../../../../Firebase/config'` },
  // If studentApi/scheduleApi were moved to shared:
  // { regex: /from ['"]\.\.\/api\/studentApi['"]/g, to: `from '../../../shared/api/studentApi'` },
  // { regex: /from ['"]\.\.\/api\/scheduleApi['"]/g, to: `from '../../../shared/api/scheduleApi'` },
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  for (const r of replacements) {
    if (r.regex.test(content)) {
      content = content.replace(r.regex, r.to);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Fixed:', f);
  }
}