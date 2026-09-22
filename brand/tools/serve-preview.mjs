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
  if (urlPath === '/' || urlPath === '') {
    // A landing page rather than a redirect, so both sheets are one click away.
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Vriddhi brand — pick a view</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
      <style>body{font-family:Inter,system-ui,sans-serif;background:#f8fafc;color:#0f172a;margin:0;
        display:grid;place-items:center;min-height:100vh}
        .w{max-width:760px;padding:32px}
        h1{font-size:24px;font-weight:800;margin:0 0 8px}
        p{color:#475569;font-size:14px;line-height:1.6;margin:0 0 26px}
        a{display:block;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:22px 24px;
          text-decoration:none;color:inherit;margin-bottom:14px;transition:box-shadow .15s,border-color .15s}
        a:hover{border-color:#14b8a6;box-shadow:0 6px 20px rgba(13,148,136,.12)}
        b{display:block;font-size:16px;margin-bottom:4px}
        span{font-size:13px;color:#64748b}
      </style></head><body><div class="w">
      <h1>Vriddhi brand</h1>
      <p>Two views. Both serve the shipped assets directly — no build step.</p>
      <a href="/brand/dashboard-preview.html"><b>Logo in the dashboard →</b>
        <span>Sidebar (light + dark, expanded + collapsed), login, mobile icons</span></a>
      <a href="/brand/preview.html"><b>Brand &amp; logo sheet →</b>
        <span>The full system: lockups, mark, colour treatments, shadows, rules</span></a>
      </div></body></html>`);
  }

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
