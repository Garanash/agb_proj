/** @type {import('next').NextConfig} */
const nextConfig = {
  // Включаем standalone режим для Docker
  output: 'standalone',
  
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
}

module.exports = nextConfig
