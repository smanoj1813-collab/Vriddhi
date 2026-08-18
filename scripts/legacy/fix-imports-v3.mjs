import fs from 'fs';
import path from 'path';

const files = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (f === 'node_modules' || f === '.git') continue;
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.ts') || p.endsWith('.tsx')) files.push(p);
  }
}
walk('src');

// replacements: { regex, to, paths }  (paths = file prefixes/suffixes to match)
const replacements = [
  // === SUPERADMIN SELF-REFERENCES ===
  { regex: /from ['"]\.\.\/modules\/superadmin\//g, to: `from '../`, paths: ['src/modules/superadmin/api/', 'src/modules/superadmin/hooks/'] },
  { regex: /from ['"]\.\.\/\.\.\/modules\/superadmin\//g, to: `from '../`, paths: ['src/modules/superadmin/components/', 'src/modules/superadmin/pages/', 'src/modules/superadmin/services/'] },

  // === SUPERADMIN → SHARED DEPTH ===
  { regex: /from ['"]\.\.\/\.\.\/shared\//g, to: `from '../../../shared/`, paths: ['src/modules/superadmin/pages/', 'src/modules/superadmin/components/'] },
  { regex: /from ['"]\.\.\/\.\.\/providers\/NotificationProvider['"]/g, to: `from '../../../shared/providers/NotificationProvider'`, paths: ['src/modules/superadmin/pages/'] },
  { regex: /from ['"]\.\.\/Firebase\/config['"]/g, to: `from '../../../../Firebase/config'`, paths: ['src/modules/superadmin/api/', 'src/modules/superadmin/hooks/'] },
  { regex: /from ['"]\.\.\/\.\.\/Firebase\/config['"]/g, to: `from '../../../../Firebase/config'`, paths: ['src/modules/superadmin/components/'] },

  // === SHARED → MODULES ===
  { regex: /from ['"]\.\.\/\.\.\/admin\//g, to: `from '../../`, paths: ['src/shared/api/', 'src/shared/components/', 'src/shared/services/', 'src/shared/utils/'] },
  { regex: /from ['"]\.\.\/\.\.\/auth\//g, to: `from '../../modules/auth/`, paths: ['src/shared/components/', 'src/shared/services/'] },
  { regex: /from ['"]\.\.\/\.\.\/faculty\//g, to: `from '../../modules/faculty/`, paths: ['src/shared/components/'] },
  { regex: /from ['"]\.\.\/contexts\/AuthContext['"]/g, to: `from '../../modules/auth/context/AuthContext'`, paths: ['src/shared/components/Layout.tsx'] },

  // === STUDENT MODULE ===
  { regex: /from ['"]\.\.\/\.\.\/components\/MathRenderer['"]/g, to: `from '../components/MathRenderer'`, paths: ['src/modules/student/pages/'] },
  { regex: /from ['"]\.\.\/\.\.\/hooks\/useStudentSchedule['"]/g, to: `from '../hooks/useStudentSchedule'`, paths: ['src/modules/student/pages/'] },
  { regex: /from ['"]\.\.\/\.\.\/types\/schedule['"]/g, to: `from '../types/schedule'`, paths: ['src/modules/student/pages/'] },

  // === SUPERADMIN CROSS-MODULE ===
  { regex: /from ['"]\.\.\/\.\.\/hooks\/useUniversities['"]/g, to: `from '../../admin/hooks/useUniversities'`, paths: ['src/modules/superadmin/pages/'] },
  { regex: /from ['"]\.\.\/\.\.\/types\/university['"]/g, to: `from '../../../shared/types/university'`, paths: ['src/modules/superadmin/pages/'] },
  { regex: /from ['"]\.\.\/\.\.\/data\/karnatakaUniversities['"]/g, to: `from '../../../shared/data/karnatakaUniversities'`, paths: ['src/modules/superadmin/pages/'] },
  { regex: /from ['"]\.\.\/data\/karnatakaUniversities['"]/g, to: `from '../../shared/data/karnatakaUniversities'`, paths: ['src/modules/superadmin/api/'] },
  { regex: /from ['"]\.\.\/\.\.\/api\/universityApi['"]/g, to: `from '../api/universityApi'`, paths: ['src/modules/superadmin/services/seedUniversities.ts'] },

  // === SUPERADMIN COMPONENTS → SHARED UTILS/SERVICES ===
  { regex: /from ['"]\.\.\/\.\.\/shared\/utils\/parseCSV['"]/g, to: `from '../../../shared/utils/parseCSV'`, paths: ['src/modules/superadmin/components/', 'src/modules/superadmin/pages/'] },
  { regex: /from ['"]\.\.\/\.\.\/services\/collegeService['"]/g, to: `from '../../../shared/services/collegeService'`, paths: ['src/modules/superadmin/components/StudentImport.tsx'] },
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  for (const r of replacements) {
    const match = r.paths.some(p => f.replace(/\\/g, '/').startsWith(p) || f.replace(/\\/g, '/') === p);
    if (!match) continue;
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
console.log('Done.');