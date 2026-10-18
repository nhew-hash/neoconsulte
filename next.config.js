/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // O lint continua disponível via `npm run lint`; não bloqueia o deploy.
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
