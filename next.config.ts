import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloud Run: a self-contained server.js with only the traced dependencies,
  // so the image ships no full node_modules. See the Dockerfile.
  output: "standalone",
  experimental: {
    serverActions: {
      // Uploads are capped at 15MB in uploadDocument; the framework limit sits
      // just above so the action's own friendly error is reachable instead of
      // the request dying at the transport layer.
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
