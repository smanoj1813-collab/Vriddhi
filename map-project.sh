// map-project.js — Run: node map-project.js
// Works on Windows, macOS, Linux

const fs = require('fs');
const path = require('path');

const results = {
  allFiles: [],
  types: [],
  apis: [],
  hooks: [],
  components: [],
  utils: [],
  scripts: [],
  contexts: [],
  pages: [],
  styles: [],
  configs: [],
};

function walk(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(base, entry.name).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      walk(fullPath, relPath);
    } else {
      const ext = path.extname(entry.name);
      if (!['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss'].includes(ext)) continue;

      results.allFiles.push(relPath);

      if (relPath.includes('/types/') || relPath.startsWith('types/')) results.types.push(relPath);
      if (relPath.includes('api') && ext === '.ts') results.apis.push(relPath);
      if (entry.name.startsWith('use') && (ext === '.ts' || ext === '.tsx')) results.hooks.push(relPath);
      if (ext === '.tsx') results.components.push(relPath);
      if (relPath.includes('/utils/') || relPath.includes('/helpers/') || relPath.includes('/lib/')) results.utils.push(relPath);
      if (relPath.includes('/scripts/') || relPath.includes('/services/')) results.scripts.push(relPath);
      if (relPath.includes('/context/') || relPath.includes('/providers/')) results.contexts.push(relPath);
      if (relPath.includes('/pages/') || relPath.includes('/routes/') || relPath.includes('/screens/')) results.pages.push(relPath);
      if (ext === '.css' || ext === '.scss' || relPath.includes('/theme/')) results.styles.push(relPath);
      if (['vite.config.ts', 'tsconfig.json', 'tsconfig.node.json', 'package.json'].includes(entry.name)) results.configs.push(relPath);
    }
  }
}

console.log('Scanning src/ directory...\n');
walk('src');

console.log('════════════════════════════════════════════════════════════');
console.log('  ALL SOURCE FILES');
console.log('════════════════════════════════════════════════════════════');
results.allFiles.forEach(f => console.log('  ' + f));

console.log('\n════════════════════════════════════════════════════════════');
console.log('  GROUPED BY CATEGORY');
console.log('════════════════════════════════════════════════════════════');

const printSection = (title, files) => {
  console.log(`\n📂 ${title} (${files.length} files):`);
  files.forEach(f => console.log('    → ' + f));
};

printSection('TYPES', results.types);
printSection('API', results.apis);
printSection('HOOKS', results.hooks);
printSection('COMPONENTS', results.components);
printSection('UTILS / HELPERS', results.utils);
printSection('SCRIPTS / SERVICES', results.scripts);
printSection('CONTEXTS', results.contexts);
printSection('PAGES / ROUTES', results.pages);
printSection('STYLES / THEME', results.styles);
printSection('CONFIG FILES', results.configs);

// Also print tsconfig paths
console.log('\n════════════════════════════════════════════════════════════');
console.log('  TSCONFIG PATHS');
console.log('════════════════════════════════════════════════════════════');
try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  if (tsconfig.compilerOptions?.paths) {
    Object.entries(tsconfig.compilerOptions.paths).forEach(([alias, targets]) => {
      console.log(`  "${alias}" → ${JSON.stringify(targets)}`);
    });
  } else {
    console.log('  (no path aliases configured)');
  }
} catch (e) {
  console.log('  ⚠️ Could not read tsconfig.json');
}

// Print vite aliases
console.log('\n════════════════════════════════════════════════════════════');
console.log('  VITE CONFIG ALIASES');
console.log('════════════════════════════════════════════════════════════');
try {
  const viteContent = fs.readFileSync('vite.config.ts', 'utf8');
  const aliasMatches = viteContent.match(/alias:[\s\S]*?\]/);
  if (aliasMatches) {
    console.log('  Found resolve.alias config in vite.config.ts');
    console.log('  (see vite.config.ts for details)');
  } else {
    console.log('  (no aliases found in vite.config.ts)');
  }
} catch (e) {
  console.log('  ⚠️ Could not read vite.config.ts');
}

console.log('\n════════════════════════════════════════════════════════════');
console.log('  COPY EVERYTHING ABOVE AND PASTE BACK');
console.log('════════════════════════════════════════════════════════════');