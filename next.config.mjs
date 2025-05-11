/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['woocommerce-backend.local', 'japanbangla.com', 'www.japanbangla.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'japanbangla.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'www.japanbangla.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'woocommerce-backend.local',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
};

export default nextConfig;
