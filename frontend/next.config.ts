import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone, which the Dockerfile runner stage copies and starts
  // with `node server.js`. Without this the image build has nothing to copy.
  output: "standalone",
};

export default nextConfig;
