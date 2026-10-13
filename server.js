const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function readEnvFile() {
  const file = path.join(ROOT, '.env.local');
  const values = {};
  if (!fs.existsSync(file)) return values;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index < 0) continue;
    values[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  }
  return values;
}
function config() {
  const local = readEnvFile();
  return {
    retellPublicKey: process.env.RETELL_PUBLIC_KEY || local.RETELL_PUBLIC_KEY || '',
    retellAgentId: process.env.RETELL_AGENT_ID || local.RETELL_AGENT_ID || '',
    phone: process.env.TRADECALL_PHONE || local.TRADECALL_PHONE || '',
  };
}
function sendFile(res, filePath) {
  fs.readFile(filePath, (error, contents) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(contents);
  });
}

const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); return res.end('Bad request'); }

  if (pathname === '/runtime-config.js') {
    const js = `window.TRADECALL_CONFIG = ${JSON.stringify(config())};`;
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(js);
  }
  if (pathname === '/' || pathname === '/index.html') return sendFile(res, path.join(ROOT, 'index.html'));
  const requested = path.resolve(PUBLIC, '.' + pathname);
  if (!requested.startsWith(PUBLIC + path.sep) && requested !== PUBLIC) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }
  return sendFile(res, requested);
});

const port = Number(process.env.PORT || 3000);
server.listen(port, '0.0.0.0', () => console.log(`TradeCall Agency preview running at http://localhost:${port}`));
