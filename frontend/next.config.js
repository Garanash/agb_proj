/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['almazgeobur.kz'],
  },
  // Улучшения для Docker только в production
  ...(process.env.NODE_ENV === 'production' && {
    experimental: {
      esmExternals: false,
    },
  }),
  // Webpack конфигурация только для production
  ...(process.env.NODE_ENV === 'production' && {
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
  }),
  // Отключаем оптимизации, которые могут вызывать проблемы в Docker только в production
  ...(process.env.NODE_ENV === 'production' && { swcMinify: false }),
  // Включаем standalone output для Docker только в production
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
}

module.exports = nextConfig
