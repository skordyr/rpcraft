import { defineConfig } from "tsdown";

export default defineConfig({
  exports: true,
  entry: {
    index: "./src/index.ts",
    template: "./src/template/index.ts",
    iterator: "./src/iterator/index.ts",
    rpc: "./src/rpc/index.ts",
    "links/*": ["./src/links/**/index.ts"],
  },
});
