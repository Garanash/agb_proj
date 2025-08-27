/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['almazgeobur.kz'],
  },
  // Минимальная конфигурация для стабильности
  reactStrictMode: false,
  poweredByHeader: false,
}

module.exports = nextConfig
