// next.config.js
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ allows deploy even if lint errors exist
  },
  typescript: {
    ignoreBuildErrors: true, // optional – also ignores TS type errors
  },
};

module.exports = nextConfig;
