import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'server',
  compress: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self' blob: data: https: *.vercel.app www.google-analytics.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https: *.vercel.app www.google-analytics.com; style-src 'self' 'unsafe-inline' https: *.vercel.app; img-src 'self' data: https: *.vercel.app; font-src 'self' data: https: *.vercel.app; connect-src 'self' blob: data: https: *.vercel.app www.google-analytics.com;",
        },
      ],
    },
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pic1.imgdb.cn',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
