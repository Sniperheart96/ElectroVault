import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Transpile workspace packages
  transpilePackages: ['@electrovault/schemas'],

  // Environment variables available on client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  },

  // Allow images from MinIO and API proxy
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '192.168.178.80',
        port: '9000',
        pathname: '/electrovault-files/**',
      },
      {
        protocol: 'https',
        hostname: '192.168.178.80',
        port: '9000',
        pathname: '/electrovault-files/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/api/v1/manufacturers/*/logo',
      },
      {
        protocol: 'http',
        hostname: '192.168.178.80',
        port: '3001',
        pathname: '/api/v1/manufacturers/*/logo',
      },
    ],
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default withNextIntl(nextConfig);
