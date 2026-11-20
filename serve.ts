// Vice Cover Lab — a tiny static server for trying the app locally.
// Serves this repository's app/ on http://localhost:8080. Standard library
// only, no dependencies. Run it with `node serve.ts`, then open the URL in
// desktop Chrome. Nothing is uploaded anywhere; the app runs offline.

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('app/', import.meta.url));
const port = Number(process.env.PORT ?? 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = createServer((req, res) => {
  const rawPath = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const relPath = rawPath === '/' ? 'index.html' : rawPath.replace(/^\/+/, '');
  const filePath = join(appDir, relPath);
  if (!filePath.startsWith(appDir)) {
    res.writeHead(403, { 'content-type': 'text/plain' });
    res.end('forbidden');
    return;
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream' });
  createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  console.log(`vice-cover-lab: serving app/ at http://localhost:${port}`);
});
