/**
 * Rewrites public/site/index.html so `const API_BASE=...` points at the public API.
 *
 * - If NEXT_PUBLIC_API_URL is set (Vercel / production build), the browser will call
 *   your Render API directly (e.g. https://your-api.onrender.com/api). CORS on the
 *   backend must allow your Vercel origin (.vercel.app is already in server.ts).
 * - If unset, uses "/api" (Next.js /api proxy — requires BACKEND_URL on the Vercel server).
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../public/site/index.html');
const raw = (process.env.NEXT_PUBLIC_API_URL || '').trim();

let resolved;
if (!raw) {
  resolved = '/api';
} else {
  let u = raw.replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(u)) u = u.includes('localhost') || u.includes('127.0.0.1') ? `http://${u}` : `https://${u}`;
  if (!/\/api\/?$/i.test(u)) u = `${u}/api`;
  resolved = u;
}

const line = `const API_BASE=${JSON.stringify(resolved)};`;
const html = fs.readFileSync(file, 'utf8');
const re = /const API_BASE=(?:'[^']*'|"[^"]*");/;
if (!re.test(html)) {
  console.warn('inject-site-api: no `const API_BASE=...` line was found. Check public/site/index.html');
  process.exit(1);
}
const newHtml = html.replace(re, line);
// OK when the value is already correct (e.g. unset → "/api" matches on-disk)
fs.writeFileSync(file, newHtml, 'utf8');
console.log('inject-site-api: API_BASE =', resolved);
