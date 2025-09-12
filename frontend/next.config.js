/** @type {import('next').NextConfig} */
const nextConfig = {
  // Убираем standalone режим для корректной работы статических файлов
  // output: 'standalone',
  
  images: {
    domains: ['almazgeobur.kz'],
    unoptimized: true,
  },
  
  // Минимальная конфигурация для стабильности
  reactStrictMode: false,
  poweredByHeader: false,
  trailingSlash: false,
  
  // Исправляем пути для Docker
  experimental: {
    outputFileTracingRoot: undefined,
  },
  
  // Настройки для production
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api',
  },
  
  // Исправляем разрешение модулей для Docker
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
}

module.exports = nextConfig
