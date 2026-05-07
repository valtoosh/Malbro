import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@marlbro/ui', '@marlbro/shared', '@marlbro/db'],
};

export default nextConfig;
