/**
 * Flatten axios/API errors to a string for toasts. Passing objects to
 * react-hot-toast triggers React error #31 ("Objects are not valid as a React child").
 */
export function formatApiError(error: unknown, fallback = 'Something went wrong'): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const ax = error as { response?: { data?: unknown }; message?: string };
    const text = formatResponseBody(ax.response?.data);
    if (text) return text;
    if (typeof ax.message === 'string' && ax.message) return ax.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function formatResponseBody(data: unknown): string {
  if (data == null) return '';
  if (typeof data === 'string') return data;
  if (typeof data !== 'object') return String(data);
  const d = data as Record<string, unknown>;
  const nested = d.error ?? d.message;
  const fromNested = stringifyLeaf(nested);
  if (fromNested) return fromNested;
  if (typeof d.message === 'string') return d.message;
  return '';
}

function stringifyLeaf(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    if (typeof o.msg === 'string') return o.msg;
    if (typeof o.error === 'string') return o.error;
  }
  return '';
}

/** Safe one-line text for KPIs/cards; never return a plain object for React children. */
export function toDisplayText(value: unknown, empty = '—'): string {
  if (value == null || value === '') return empty;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (typeof o.name === 'string') return o.name;
    if (typeof o.message === 'string') return o.message;
    if (typeof o.label === 'string') return o.label;
  }
  return empty;
}
