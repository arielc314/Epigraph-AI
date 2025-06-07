/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? `${process.env.NEXT_PUBLIC_API_BASE}/api/:path*`
            : '/api/',
      },
    ]
  },
}

module.exports = nextConfig
