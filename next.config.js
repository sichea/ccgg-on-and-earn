/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        request: false
      };
    }
    return config;
  },
  // experimental 옵션 수정
  serverExternalPackages: ['node-telegram-bot-api']
}

module.exports = nextConfig