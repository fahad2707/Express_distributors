/**
 * Proxy /uploads/* to the backend so product images work on Vercel without
 * build-time NEXT_PUBLIC_API_URL in next.config rewrites.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getBackendBaseForProxy } from '@/lib/backend-proxy-base';

export async function GET(request: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxyUploads(request, params.path);
}

export async function HEAD(request: NextRequest, { params }: { params: { path?: string[] } }) {
  return proxyUploads(request, params.path);
}

async function proxyUploads(request: NextRequest, pathSegments: string[] | undefined) {
  const segs = pathSegments ?? [];
  if (!segs.length) {
    return new NextResponse(null, { status: 404 });
  }
  const backendBase = getBackendBaseForProxy();
  const path = segs.map((s) => encodeURIComponent(s)).join('/');
  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  const target = `${backendBase}/uploads/${path}${qs ? `?${qs}` : ''}`;

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'host' || lower === 'connection' || lower === 'content-length') return;
    headers[key] = value;
  });

  try {
    const res = await fetch(target, { method: request.method, headers });
    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === 'transfer-encoding' || lower === 'content-encoding') return;
      responseHeaders.set(key, value);
    });
    if (request.method === 'HEAD') {
      return new NextResponse(null, {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
      });
    }
    const responseBody = await res.arrayBuffer();
    return new NextResponse(responseBody, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('Uploads proxy error:', (err as Error).message, target);
    return new NextResponse(null, { status: 502 });
  }
}
