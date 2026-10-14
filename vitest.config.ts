import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Tests run server code in plain Node, where `server-only` throws by
      // design. Resolve it to its own no-op entry here only; the app keeps
      // the real guard.
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
    },
  },
  test: {
    environment: "node",
  },
});
