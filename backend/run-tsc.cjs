/**
 * Run the workspace-installed TypeScript compiler explicitly (avoids a different `tsc`
 * on PATH e.g. TypeScript 6+ on some CI / Render images when the repo pins 5.6.x).
 * Also works when the monorepo root is in `src/` (Render) or `typescript` is hoisted to parent.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const backendDir = __dirname;
const searchBases = [
  backendDir,
  path.join(backendDir, '..'),
  path.join(backendDir, '..', '..'),
];

let tscPath;
for (const base of searchBases) {
  try {
    tscPath = require.resolve('typescript/lib/tsc.js', { paths: [base] });
    break;
  } catch {
    /* try next */
  }
}

if (!tscPath) {
  console.error(
    'run-tsc.cjs: Could not find typescript. Ensure `typescript` is installed (e.g. `npm install --include=dev` or see root .npmrc / backend dependencies).'
  );
  process.exit(1);
}

const tsconfig = path.join(backendDir, 'tsconfig.json');
const r = spawnSync(process.execPath, [tscPath, '-p', tsconfig], {
  stdio: 'inherit',
  cwd: backendDir,
});
const code = r.status;
process.exit(typeof code === 'number' ? code : 1);
