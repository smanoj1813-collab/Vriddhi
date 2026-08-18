const fs = require('fs');
const path = require('path');

const files = [
  'src/modules/auth/routes.tsx',
  'src/modules/student/routes.tsx',
  'src/modules/faculty/routes.tsx',
  'src/modules/admin/routes.tsx',
  'src/modules/superadmin/routes.tsx',
];

files.forEach(f => {
  const fp = path.join(__dirname, f);
  let content = fs.readFileSync(fp, 'utf8');
  content = content.replace(
    "import { RoleRoute } from '@/modules/auth/guards/RoleRoute';",
    "import { RoleRoute } from '@/routes/components/RoleRoute';"
  );
  fs.writeFileSync(fp, content);
  console.log(`✅ Fixed ${f}`);
});

console.log('\n🎉 All RoleRoute imports fixed.');