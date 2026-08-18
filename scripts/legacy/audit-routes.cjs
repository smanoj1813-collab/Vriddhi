// audit-routes.js — place this in C:\Users\Manoj s\OneDrive\Desktop\vriddhi-react (1)\
const fs = require('fs');
const path = require('path');

const modules = ['auth', 'student', 'faculty', 'admin', 'hod', 'superadmin'];
const srcPath = path.join(__dirname, 'src');

const report = {};

modules.forEach(mod => {
  const routesFile = path.join(srcPath, 'modules', mod, 'routes.tsx');
  
  if (!fs.existsSync(routesFile)) {
    report[mod] = { status: 'MISSING routes.tsx', routes: 0, lazyImports: 0, paths: '—', orphaned: '—' };
    return;
  }
  
  const content = fs.readFileSync(routesFile, 'utf8');
  const paths = [...content.matchAll(/path:\s*['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
  const imports = [...content.matchAll(/import\(['"`]([^'"`]+)['"`]\)/g)].map(m => m[1]);
  
  report[mod] = {
    status: 'OK',
    routes: paths.length,
    lazyImports: imports.length,
    paths: paths.join(', ') || '—',
    orphaned: paths.length !== imports.length ? `MISMATCH (${paths.length} paths vs ${imports.length} imports)` : 'OK'
  };
});

console.log('\n=== Vriddhi Route Audit ===\n');
Object.entries(report).forEach(([mod, data]) => {
  console.log(`📦 ${mod.toUpperCase()}`);
  console.log(`   Status:     ${data.status}`);
  console.log(`   Routes:     ${data.routes}`);
  console.log(`   Lazy:       ${data.lazyImports}`);
  console.log(`   Paths:      ${data.paths}`);
  console.log(`   Orphaned:   ${data.orphaned}`);
  console.log('');
});

const totalRoutes = Object.values(report).reduce((sum, r) => sum + (r.routes || 0), 0);
console.log(`📊 Total routes found: ${totalRoutes}`);