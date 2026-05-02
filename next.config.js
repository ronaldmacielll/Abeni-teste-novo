/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['attachments.clickup.com'],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  poweredByHeader: false,
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    };
    return config;
  },
}

module.exports = nextConfig
