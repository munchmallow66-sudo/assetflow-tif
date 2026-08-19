import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy.
 *
 * 'unsafe-inline' is still required for scripts: the App Router emits inline
 * bootstrap and flight-data scripts, and replacing it with a per-request nonce
 * needs middleware, which this project does not have yet. The policy therefore
 * does not stop inline injection, but it does stop an injected script from
 * loading or exfiltrating to any origin not listed below.
 *
 * Origins in use:
 *   fonts.googleapis.com  stylesheet imported at the top of globals.css
 *   fonts.gstatic.com     the font files that stylesheet references
 *   res.cloudinary.com    asset and return photos
 *   api.qrserver.com      rendered QR code images
 *   data: / blob:         signature canvas (toDataURL) and camera preview
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://res.cloudinary.com https://api.qrserver.com",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
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
