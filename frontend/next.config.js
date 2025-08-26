/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['almazgeobur.kz'],
  },
  // Улучшения для Docker
  experimental: {
    esmExternals: false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Отключаем оптимизации, которые могут вызывать проблемы в Docker
  swcMinify: false,
  // Включаем standalone output для Docker
  output: 'standalone',
}

module.exports = nextConfig
