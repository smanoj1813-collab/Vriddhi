// discover-pages.cjs
const fs = require('fs');
const path = require('path');

function scan(dir, base = '') {
  const results = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    const rel = path.join(base, item.name);
    if (item.isDirectory() && !['node_modules','.git','dist'].includes(item.name)) {
      results.push(...scan(full, rel));
    } else if (item.name.endsWith('.tsx') && !item.name.endsWith('.d.tsx')) {
      results.push(rel);
    }
  }
  return results;
}

const files = scan(path.join(__dirname, 'src'));
const byFolder = {};

files.forEach(f => {
  const top = f.split(path.sep)[0];
  byFolder[top] = (byFolder[top] || 0) + 1;
});

console.log('\n=== Vriddhi Page Discovery ===\n');
console.log(`Total .tsx files: ${files.length}\n`);

Object.entries(byFolder)
  .sort((a, b) => b[1] - a[1])
  .forEach(([folder, count]) => {
    console.log(`📁 ${folder}/ — ${count} files`);
    files.filter(f => f.startsWith(folder + path.sep))
      .slice(0, 15)
      .forEach(f => console.log(`   ${f}`));
    const remaining = files.filter(f => f.startsWith(folder + path.sep)).length - 15;
    if (remaining > 0) console.log(`   ... and ${remaining} more`);
    console.log('');
  });

// Detect likely page files
const pages = files.filter(f => 
  /[Pp]age|Dashboard|List|Detail|Create|Edit|View|Form|Login|Register/.test(f)
);
console.log(`\n🔍 Likely page components (${pages.length}):`);
pages.forEach(p => console.log(`   ${p}`));