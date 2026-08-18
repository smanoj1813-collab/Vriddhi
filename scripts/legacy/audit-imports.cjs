// audit-imports.js — detects illegal cross-module imports
const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src');
const modules = ['auth', 'student', 'faculty', 'admin', 'hod', 'superadmin'];

const violations = [];

function scanDir(dir, currentModule) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      scanDir(fullPath, currentModule);
    } else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, idx) => {
        // Check for relative cross-module imports: ../../modules/otherModule
        const relativeMatch = line.match(/from\s+['"]\.\.\/\.\.\/modules\/([^'"]+)['"]/);
        if (relativeMatch) {
          const importedModule = relativeMatch[1].split('/')[0];
          if (importedModule !== currentModule) {
            violations.push({
              file: fullPath.replace(srcPath, 'src'),
              line: idx + 1,
              type: 'RELATIVE',
              from: currentModule,
              to: importedModule,
              code: line.trim()
            });
          }
        }
        
        // Check for @/modules/ cross-imports
        const aliasMatch = line.match(/from\s+['"]@\/modules\/([^'"]+)['"]/);
        if (aliasMatch) {
          const importedModule = aliasMatch[1].split('/')[0];
          if (importedModule !== currentModule) {
            violations.push({
              file: fullPath.replace(srcPath, 'src'),
              line: idx + 1,
              type: 'ALIAS',
              from: currentModule,
              to: importedModule,
              code: line.trim()
            });
          }
        }
      });
    }
  }
}

modules.forEach(mod => {
  const modPath = path.join(srcPath, 'modules', mod);
  if (fs.existsSync(modPath)) {
    scanDir(modPath, mod);
  }
});

console.log('\n=== Import Boundary Audit ===\n');

if (violations.length === 0) {
  console.log('✅ No cross-module import violations found. Clean architecture!');
} else {
  console.log(`❌ Found ${violations.length} violation(s):\n`);
  violations.forEach((v, i) => {
    console.log(`${i + 1}. ${v.file}:${v.line}`);
    console.log(`   ${v.from} → ${v.to} (${v.type})`);
    console.log(`   ${v.code}`);
    console.log('');
  });
  console.log('💡 Fix: Move shared code to src/shared/ and import from there.');
}