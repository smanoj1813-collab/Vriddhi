const fs = require('fs');
const path = require('path');

function findFile(dir, target) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory() && !['node_modules','.git','dist'].includes(item.name)) {
      const found = findFile(full, target);
      if (found) return found;
    } else if (item.name === target) {
      return full;
    }
  }
  return null;
}

const authContext = findFile(path.join(__dirname, 'src'), 'AuthContext.tsx');
const useAuthHook = findFile(path.join(__dirname, 'src'), 'useAuth.ts');

console.log('AuthContext found at:', authContext ? authContext.replace(__dirname + '\\', '') : 'NOT FOUND');
console.log('useAuth found at:', useAuthHook ? useAuthHook.replace(__dirname + '\\', '') : 'NOT FOUND');

function grepUseAuth(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory() && !['node_modules','.git','dist'].includes(item.name)) {
      grepUseAuth(full);
    } else if ((item.name.endsWith('.ts') || item.name.endsWith('.tsx')) && !item.name.endsWith('.d.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('export const useAuth') || content.includes('export function useAuth')) {
        console.log('useAuth defined in:', full.replace(__dirname + '\\', ''));
      }
    }
  }
}

grepUseAuth(path.join(__dirname, 'src'));