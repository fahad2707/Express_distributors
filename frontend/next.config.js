const explicitPublicApi = (process.env.NEXT_PUBLIC_API_URL || '').trim();
// Vercel Services: Express lives at /express (see root vercel.json). If the dashboard env
// was never set, builds still embed a working browser API base for admin/store.
const vercelServicesApiDefault =
  process.env.VERCEL === '1' && !explicitPublicApi ? '/express/api' : undefined;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(vercelServicesApiDefault
    ? { env: { NEXT_PUBLIC_API_URL: vercelServicesApiDefault } }
    : {}),
  // /api and /uploads are proxied at request time by app/api/[[...path]] and
  // app/uploads/[[...path]] using BACKEND_URL (see lib/backend-proxy-base.ts).
  // Prefer config redirect so `/` does not depend on the App Router server handler
  // (avoids rare Vercel FUNCTION_INVOCATION_FAILED on `/` when only a redirect runs).
  async redirects() {
    return [{ source: '/', destination: '/site', permanent: false }];
  },
  async rewrites() {
    return [
      { source: '/site', destination: '/site/index.html' },
      { source: '/site/', destination: '/site/index.html' },
      { source: '/site/category/:slug', destination: '/site/index.html' },
    ];
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig




