/**
 * Tiny static server for the brand preview.
 *
 * Serves the repository so that `brand/preview.html` can reference the SVG
 * masters, the concept sheets and `public/icons/*` with relative paths, and
 * maps "/" to the preview page so the live preview opens straight onto it.
 *
 *   node brand/tools/serve-preview.mjs [port]
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const PORT = Number(process.argv[2] || process.env.PORT || 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/' || urlPath === '') urlPath = '/brand/preview.html';

  const abs = path.join(REPO, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ''));
  if (!abs.startsWith(REPO) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not found: ' + urlPath);
  }

  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(abs)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(abs).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Vriddhi brand preview → http://0.0.0.0:${PORT}/  (repo root: ${REPO})`);
});
