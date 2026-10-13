const fs = require('node:fs');
const path = require('node:path');
const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');

function envFromFile() {
  const file = path.join(ROOT, '.env.local');
  const values = {};
  if (!fs.existsSync(file)) return values;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index >= 0) values[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  }
  return values;
}
const local = envFromFile();
const cfg = {
  retellPublicKey: process.env.RETELL_PUBLIC_KEY || local.RETELL_PUBLIC_KEY || '',
  retellAgentId: process.env.RETELL_AGENT_ID || local.RETELL_AGENT_ID || '',
  phone: process.env.TRADECALL_PHONE || local.TRADECALL_PHONE || '',
};
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const vercelUrl = process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL.replace(/^https?:\/\//, '') : '';
const siteUrl = (process.env.SITE_URL || vercelUrl || 'http://localhost:3000').replace(/\/$/, '');
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace('<meta property="og:url" content="/">', `<meta property="og:url" content="${siteUrl}/">`);
html = html.replace('<meta property="og:image" content="/images/trades-hero.png">', `<meta property="og:image" content="${siteUrl}/images/trades-hero.png">`);
html = html.replace('<meta name="twitter:image" content="/images/trades-hero.png">', `<meta name="twitter:image" content="${siteUrl}/images/trades-hero.png">`);
fs.writeFileSync(path.join(OUT, 'index.html'), html, 'utf8');
fs.cpSync(path.join(ROOT, 'public'), OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'runtime-config.js'), `window.TRADECALL_CONFIG = ${JSON.stringify(cfg)};\n`, 'utf8');
if (!cfg.retellPublicKey || !cfg.retellAgentId) {
  console.warn('Build completed, but live voice widget settings are missing: set RETELL_PUBLIC_KEY and RETELL_AGENT_ID.');
}
console.log('Static website built to ./dist');
