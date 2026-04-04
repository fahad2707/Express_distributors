import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Load backend/.env reliably:
 * - Try paths even when process.cwd() is the monorepo root or an IDE temp dir
 * - Use override: false so shell / Railway env wins over .env (critical: `export MONGODB_URI=…`
 *   for Atlas imports was previously overwritten by local .env and data went to the wrong DB).
 */
const candidates = [
  path.resolve(__dirname, '..', '.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
  path.resolve(process.cwd(), '.env'),
];

const seen = new Set<string>();
let loadedFrom: string | null = null;
for (const envPath of candidates) {
  const key = path.normalize(envPath);
  if (seen.has(key)) continue;
  seen.add(key);
  if (!fs.existsSync(envPath)) continue;
  dotenv.config({ path: envPath, override: false });
  loadedFrom = envPath;
  break;
}

// If the parent process set JWT_SECRET to an empty string, dotenv would not override it.
// Pull a non-empty JWT from the same .env file so local dev still works.
if (!process.env.JWT_SECRET?.trim() && loadedFrom) {
  try {
    const parsed = dotenv.parse(fs.readFileSync(loadedFrom, 'utf8'));
    const fromFile = parsed.JWT_SECRET?.trim();
    if (fromFile) process.env.JWT_SECRET = fromFile;
  } catch {
    /* ignore */
  }
}

if (!process.env.JWT_SECRET?.trim()) {
  console.error(
    '[backend] JWT_SECRET missing after loading .env.',
    loadedFrom ? `Loaded: ${loadedFrom}` : `No file found. Tried:\n  ${candidates.join('\n  ')}`
  );
}
