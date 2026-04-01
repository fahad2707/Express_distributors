/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // /api and /uploads are proxied at request time by app/api/[[...path]] and
  // app/uploads/[[...path]] using BACKEND_URL (see lib/backend-proxy-base.ts).
  async rewrites() {
    return [
      { source: '/site', destination: '/site/index.html' },
      { source: '/site/', destination: '/site/index.html' },
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




