import { defineConfig } from "tsdown";

export default defineConfig({
  exports: true,
  entry: {
    index: "./src/index.ts",
    rpc: "./src/rpc/index.ts",
    template: "./src/template/index.ts",
    "http-link": "./src/links/http-link/index.ts",
    "log-link": "./src/links/log-link/index.ts",
    "mock-link": "./src/links/mock-link/index.ts",
    "validate-link": "./src/links/validate-link/index.ts",
  },
});
