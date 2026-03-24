import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Load backend/.env reliably:
 * - Try paths even when process.cwd() is the monorepo root or an IDE temp dir
 * - Use override: true so an empty JWT_SECRET in the parent environment does not block values from .env
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
  dotenv.config({ path: envPath, override: true });
  loadedFrom = envPath;
  break;
}

if (!process.env.JWT_SECRET?.trim()) {
  console.error(
    '[backend] JWT_SECRET missing after loading .env.',
    loadedFrom ? `Loaded: ${loadedFrom}` : `No file found. Tried:\n  ${candidates.join('\n  ')}`
  );
}
