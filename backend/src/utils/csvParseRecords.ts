import { parse } from 'csv-parse';
import type { Options } from 'csv-parse';

/**
 * Parse a full CSV string into records (uses callback API).
 * Avoids `csv-parse/sync`, which Vercel's dependency tracer often omits from the bundle.
 */
export function parseCsvRecords<T = Record<string, string>>(
  input: string,
  options: Options
): Promise<T[]> {
  const trimmed = input.trim();
  if (!trimmed) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    parse(trimmed, options, (err, records) => {
      if (err) reject(err);
      else resolve((records as T[]) ?? []);
    });
  });
}
