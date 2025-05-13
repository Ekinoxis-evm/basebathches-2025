/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure image domains
  images: {
    domains: ['images.unsplash.com'],
  },
  
  // Silence warnings
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;