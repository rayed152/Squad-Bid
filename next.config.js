// Vercel sets VERCEL_URL automatically on every build (production and every
// preview deploy alike), but doesn't set NEXTAUTH_URL. next-auth needs an
// absolute NEXTAUTH_URL to compute base URLs — without it, `SessionProvider`
// (mounted in the root layout, so every page pulls it in) throws "Invalid
// URL" during static prerendering, since there's no `window.location` to
// fall back to on the server. Only fills the gap when NEXTAUTH_URL isn't
// already set, so an explicit value (e.g. for a custom domain) still wins.
if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

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
