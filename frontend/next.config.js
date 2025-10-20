/** @type {import('next').NextConfig} */
const nextConfig = {
  // Включаем standalone режим для Docker
  output: 'standalone',
  
  images: {
    domains: ['almazgeobur.ru'],
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
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
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
