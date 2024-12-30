/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Optimize the bundle size
    config.optimization = {
      ...config.optimization,
      minimize: true,
    }
    
    return config
  },
}

module.exports = nextConfig
