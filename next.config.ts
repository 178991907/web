import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
          value: "default-src 'self' blob: data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' blob: data:;",
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
