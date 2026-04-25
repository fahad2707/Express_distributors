/**
 * Run the workspace-installed TypeScript compiler explicitly (avoids a different `tsc`
 * on PATH e.g. TypeScript 6+ on some CI / Render images when the repo pins 5.6.x).
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendDir = __dirname;
const candidates = [
  path.join(backendDir, 'node_modules', 'typescript', 'lib', 'tsc.js'),
  path.join(backendDir, '..', 'node_modules', 'typescript', 'lib', 'tsc.js'),
];

let tscPath;
for (const p of candidates) {
  if (fs.existsSync(p)) {
    tscPath = p;
    break;
  }
}

if (!tscPath) {
  console.error('run-tsc.cjs: Could not find typescript/lib/tsc.js. Run `npm install` at the monorepo root.');
  process.exit(1);
}

const tsconfig = path.join(backendDir, 'tsconfig.json');
const r = spawnSync(process.execPath, [tscPath, '-p', tsconfig], {
  stdio: 'inherit',
  cwd: backendDir,
});
const code = r.status;
process.exit(typeof code === 'number' ? code : 1);
