/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['almazgeobur.kz'],
    unoptimized: true,
  },
  // Минимальная конфигурация для стабильности
  reactStrictMode: false,
  poweredByHeader: false,
  trailingSlash: false,
}

module.exports = nextConfig
