import { createServer } from 'node:http';
import { access, readFile } from 'node:fs/promises';
import { courseAsset, pageAssets, sourceAsset } from './site.js';

const development = process.argv.includes('--dev');
const root = new URL(development ? '../' : '../dist/', import.meta.url);
const compileCourse = development ? (await import('./compile.js')).compileCourse : null;
const port = Number(process.env.PORT || 4173);
const types = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json', woff2: 'font/woff2' };
const assets = new Set([...pageAssets, courseAsset]);

if (!development) {
  try {
    await access(new URL(courseAsset, root));
  } catch {
    console.error('Run npm run build before starting the static preview.');
    process.exit(1);
  }
}

function send(res, code, type, data) {
  res.writeHead(code, {
    'Content-Type': type.startsWith('font/') ? type : `${type}; charset=utf-8`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  });
  res.end(data);
}

createServer(async (req, res) => {
  try {
    const asset = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
    if (!assets.has(asset)) return send(res, 404, 'text/plain', 'Not found');
    if (development && asset === courseAsset) {
      try {
        const course = await compileCourse();
        return send(res, 200, types.json, JSON.stringify(course));
      } catch (error) {
        return send(res, 500, 'text/plain', error.message);
      }
    }
    const data = await readFile(new URL(development ? sourceAsset(asset) : asset, root));
    send(res, 200, types[asset.split('.').pop()] ?? 'text/plain', data);
  } catch {
    send(res, 404, 'text/plain', 'Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Course running at http://127.0.0.1:${port}`));
