const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/modules/student/pages/StudentFeePortal.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add useAuth import if missing
if (!content.includes('useAuth')) {
  const firstImport = content.indexOf('import');
  content = content.slice(0, firstImport) + 
    "import { useAuth } from '@/modules/auth/contexts/AuthContext';\n" + 
    content.slice(firstImport);
}

// Make studentId optional with auth fallback
content = content.replace(
  'export default function StudentFeePortal({ studentId }: { studentId: string }) {',
  `export default function StudentFeePortal({ studentId: studentIdProp }: { studentId?: string }) {
  const { user } = useAuth();
  const studentId = studentIdProp || user?.id || '';`
);

fs.writeFileSync(file, content);
console.log('✅ StudentFeePortal.tsx — studentId is now optional with auth fallback');