/* eslint-disable @typescript-eslint/no-var-requires */
import vue from "@vitejs/plugin-vue";
import path from "path";
import { defineConfig } from "vite";
import renderer from "vite-plugin-electron-renderer";
import eslintPlugin from "vite-plugin-eslint";
import resolve from "vite-plugin-resolve";
// import libEsm from 'lib-esm'
import { pinia, vue as vueExteral } from "vite-plugin-resolve/presets";
import pkg from "../../package.json";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";

// https://vitejs.dev/config/
export default defineConfig({
  mode: process.env.NODE_ENV,
  root: __dirname,
  resolve: {
    alias: [
      {
        find: /~(.+)/,
        replacement: path.join(process.cwd(), "node_modules/$1"),
      },

      {
        find: /@\//,
        replacement: path.join(process.cwd(), "./packages/renderer/src") + "/",
      },
    ],
  },
  plugins: [
    vue(),
    renderer(),
    resolve(
      /**
       * Here you can specify other modules
       * 🚧 You have to make sure that your module is in `dependencies` and not in the` devDependencies`,
       *    which will ensure that the electron-builder can package it correctly
       */
      {
        // If you use the following modules, the following configuration will work
        // // What they have in common is that they will return - ESM format code snippets
        // sharp:    lib2esm("sharp",    Object.keys(require("sharp")),    { format: "cjs" }),
        // archiver: lib2esm("archiver", Object.keys(require("archiver")), { format: "cjs" }),
        // regedit:  lib2esm("regedit",  Object.keys(require("regedit")),  { format: "cjs" }),
        // tga:      lib2esm("tga",      Object.keys(require("tga")),      { format: "cjs" }),

        pinia: pinia.v2,
        vue: vueExteral.v3,
      },
    ),
    eslintPlugin(),
    VueI18nPlugin({
      // if you want to use Vue I18n Legacy API, you need to set `compositionOnly: false`
      compositionOnly: false,

      // you need to set i18n resource including paths!
      include: path.resolve(__dirname, "./src/components/**/*.vue"),
    }),
  ],
  base: "./",
  build: {
    outDir: "../../dist/renderer",
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: "src/main.ts",
      name: "FloatingVue",
    },
    rollupOptions: {
      external: [
        "vue",
        "@floating-ui/dom",
      ],
      output: {
        globals: {
          vue: "Vue",
          "@floating-ui/dom": "FloatingUIDOM",
        },
      },
    },
  },
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT,
  },
});
