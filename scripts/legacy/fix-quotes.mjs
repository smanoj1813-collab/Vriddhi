import fs from 'fs';
import path from 'path';

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      let content = fs.readFileSync(p, 'utf8');
      // Fix: from '../...';  where opening quote is ' and closing quote is "
      const fixed = content.replace(/(from '\.\.\/[^"\r\n]+)";/g, "$1';");
      if (fixed !== content) {
        fs.writeFileSync(p, fixed);
        console.log('Fixed:', p);
      }
    }
  }
}

walk('src/modules/superadmin');
console.log('Quote fix complete.');