import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const types = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json' };
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!path.startsWith(root + sep)) throw new Error('Invalid path');
    const data = await readFile(path);
    res.writeHead(200, { 'Content-Type': `${types[path.split('.').pop()] || 'application/octet-stream'}; charset=utf-8`, 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Course running at http://127.0.0.1:${port}`));
