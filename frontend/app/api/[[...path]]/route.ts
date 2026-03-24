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
    if (lower === 'host' || lower === 'connection') return;
    headers[key] = value;
  });

  let body: string | undefined;
  try {
    body = await request.text();
  } catch {
    body = undefined;
  }

  try {
    const res = await fetch(target, {
      method: request.method,
      headers,
      body: body || undefined,
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
    return NextResponse.json(
      { error: 'Backend unreachable. Set BACKEND_URL or NEXT_PUBLIC_API_URL.' },
      { status: 502 }
    );
  }
}
