const alias = require("esbuild-plugin-at-src-alias");
const vuePlugin = require("esbuild-vue");

/** @var {Partial<import('esbuild').BuildOptions>} */
export default {
  entryPoints: ["src/main.js"],
  bundle: true,
  minify: true,
  platform: "node",
  plugins: [alias(), vuePlugin()],
  loader: {
    ".png": "binary",
    ".svg": "binary",
  },
  target: "node14.16.0",
};
