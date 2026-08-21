/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Let Node's own `require` resolve these instead of webpack bundling them
  // into the server components chunk — webpack replaces `ws`'s optional
  // native `bufferutil`/`utf-8-validate` lookups with empty stubs, which
  // breaks the Neon serverless driver's WebSocket connection at runtime.
  experimental: {
    serverComponentsExternalPackages: ["@neondatabase/serverless", "ws"],
  },
};

module.exports = nextConfig;
