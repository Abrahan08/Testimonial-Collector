import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    // Embed routes: framable from any site, CORS open, cached ~60s. Only public data is served.
    const embedHeaders = [
      { key: "Access-Control-Allow-Origin", value: "*" },
      { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
      { key: "Cache-Control", value: "public, max-age=60, s-maxage=60" },
    ];
    return [
      { source: "/embed/:path*", headers: embedHeaders },
      { source: "/embed.js", headers: embedHeaders },
      {
        // Everything else may never be framed.
        source: "/((?!embed/|embed\\.js$).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
    ];
  },
};

export default nextConfig;
