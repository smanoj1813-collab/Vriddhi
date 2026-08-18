// fix-violations.cjs
const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/modules/admin/api/curriculumMappingApi.ts',
  'src/modules/admin/hooks/useAssessment.ts',
  'src/modules/admin/hooks/useCurriculumMapping.ts'
];

// Create shared types directory
const sharedTypesDir = path.join(__dirname, 'src/shared/types');
if (!fs.existsSync(sharedTypesDir)) {
  fs.mkdirSync(sharedTypesDir, { recursive: true });
}

// Copy curriculum types from superadmin to shared
const srcFile = path.join(__dirname, 'src/modules/superadmin/types/curriculum.ts');
const destFile = path.join(sharedTypesDir, 'curriculum.ts');

if (fs.existsSync(srcFile)) {
  fs.copyFileSync(srcFile, destFile);
  console.log('✅ Created src/shared/types/curriculum.ts');
} else {
  console.log('⚠️  src/modules/superadmin/types/curriculum.ts not found');
}

// Fix imports in the 3 violation files
filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    content = content.replace(
      /from\s+['"]@\/modules\/superadmin\/types\/curriculum['"]/g,
      "from '@/shared/types/curriculum'"
    );
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed imports in ${file}`);
    } else {
      console.log(`⏭️  No import to fix in ${file}`);
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('\n🎉 Violations fixed. Run audit-imports.cjs again to verify.');