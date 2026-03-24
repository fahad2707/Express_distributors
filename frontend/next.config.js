/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy /api to backend (so CSV import works when frontend uses relative /api)
  async rewrites() {
    const target = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const base = target.startsWith('http') ? target.replace(/\/api\/?$/, '') : 'http://localhost:5001';
    return [
      { source: '/api/:path*', destination: `${base}/api/:path*` },
      // Product/category images stored as /uploads/... on the API server
      { source: '/uploads/:path*', destination: `${base}/uploads/:path*` },
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




