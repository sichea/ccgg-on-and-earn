/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        request: false,
        http: false,
        https: false,
        'node-telegram-bot-api': false,
        child_process: false,
        'forever-agent': false,
        'tunnel-agent': false,
      };
    }
    return config;
  },
  // Node.js 모듈 사용을 위한 설정
  experimental: {
    serverComponentsExternalPackages: ['node-telegram-bot-api']
  }
}

module.exports = nextConfig