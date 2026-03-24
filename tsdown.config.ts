import { defineConfig } from "tsdown";

export default defineConfig({
  exports: {
    customExports: {
      "./links/*": {
        types: "./dist/links/*/index.d.mts",
        default: "./dist/links/*/index.mjs",
      },
    },
  },
  entry: {
    index: "./src/index.ts",
    template: "./src/template/index.ts",
    rpc: "./src/rpc/index.ts",
    "links/*": "./src/links/*/index.ts",
  },
});
