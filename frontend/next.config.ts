import type { NextConfig } from "next";

// Content-Security-Policy is NOT here: it carries a per-request nonce and is
// set in proxy.ts. These four are request-independent, so keeping them in the
// config applies them to static assets too, which the proxy does not match.
const securityHeaders = [
  // Browsers ignore HSTS over plain http, so this is inert in local development.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  // Emits .next/standalone, which the Dockerfile runner stage copies and starts
  // with `node server.js`. Without this the image build has nothing to copy.
  output: "standalone",

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
