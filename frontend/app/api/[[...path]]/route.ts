/**
 * Runtime API proxy: forwards /api and /api/* to the backend using BACKEND_URL.
 * Optional catch-all [[...path]] so /api alone is handled (required [...path] 404s on /api).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getBackendBaseForProxy } from '@/lib/backend-proxy-base';

export async function GET(request: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxy(request, params.path);
}

export async function POST(request: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxy(request, params.path);
}

export async function PUT(request: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxy(request, params.path);
}

export async function PATCH(request: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxy(request, params.path);
}

export async function DELETE(request: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxy(request, params.path);
}

async function proxy(request: NextRequest, pathSegments: string[] | undefined) {
  const segs = pathSegments ?? [];
  const backendBase = getBackendBaseForProxy();
  const path = segs.length ? segs.join('/') : '';
  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  const target = `${backendBase}/api/${path}${qs ? `?${qs}` : ''}`;

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      lower === 'host' ||
      lower === 'connection' ||
      lower === 'content-length' ||
      lower === 'transfer-encoding'
    ) {
      return;
    }
    headers[key] = value;
  });
  // Next/Vercel can omit Authorization from the iterable in some cases; the backend
  // needs the Bearer token for all admin routes.
  const auth = request.headers.get('authorization') || request.headers.get('Authorization');
  if (auth) {
    headers['Authorization'] = auth;
  }

  const method = request.method.toUpperCase();
  let body: ArrayBuffer | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      const buf = await request.arrayBuffer();
      body = buf.byteLength ? buf : undefined;
    } catch {
      body = undefined;
    }
  }

  try {
    const res = await fetch(target, {
      method: request.method,
      headers,
      body: body !== undefined ? body : undefined,
    });

    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === 'transfer-encoding' || lower === 'content-encoding') return;
      responseHeaders.set(key, value);
    });

    const responseBody = await res.arrayBuffer();
    return new NextResponse(responseBody, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('API proxy error:', (err as Error).message, target);
    const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    const hasBackend = !!process.env.BACKEND_URL?.trim() || !!process.env.NEXT_PUBLIC_API_URL?.trim();
    const msg = isProd && !hasBackend
      ? 'Server misconfiguration: set BACKEND_URL (Render API origin, no /api) on Vercel, or set NEXT_PUBLIC_API_URL to https://<your-api>.onrender.com/api and redeploy. See inject-site-api.cjs in the repo.'
      : 'Backend unreachable. Set BACKEND_URL (or NEXT_PUBLIC_API_URL) on Vercel to your Render service URL.';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
