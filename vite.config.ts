import { rmSync } from "node:fs";
import path from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// eslint-disable-next-line import/default
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import eslintPlugin from "vite-plugin-eslint";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import VueDevTools from "vite-plugin-vue-devtools";
import pkg from "./package.json";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  rmSync("dist-electron", { recursive: true, force: true });

  const isServe = command === "serve";
  const isBuild = command === "build";
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  return {
    root: __dirname,
    resolve: {
      alias: [
        {
          find: /~(.+)/,
          replacement: path.join(process.cwd(), "./node_modules/$1"),
        },
        {
          find: /@\//,
          replacement: `${path.join(process.cwd(), "./src")}/`,
        },
      ],
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __APP_LICENSE__: JSON.stringify(pkg.license),
    },
    plugins: [
      VueDevTools(),
      vue(),
      electron([
        {
          // Main-Process entry file of the Electron App.
          entry: "electron/main/index.ts",
          onstart(options) {
            if (process.env.VSCODE_DEBUG) {
              console.log(/* For `.vscode/.debug.script.mjs` */ "[startup] Electron App");
            } else {
              options.startup();
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: "dist-electron/main",
              rollupOptions: {
                external: Object.keys("dependencies" in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
        {
          entry: "electron/preload/index.ts",
          onstart(options) {
            // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
            // instead of restarting the entire Electron App.
            options.reload();
          },
          vite: {
            build: {
              sourcemap: sourcemap ? "inline" : undefined,
              minify: isBuild,
              outDir: "dist-electron/preload",
              rollupOptions: {
                external: Object.keys("dependencies" in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
      ]),
      renderer({
        resolve: {
          archiver: { type: "cjs" },
          regedit: { type: "cjs" },
          sharp: { type: "cjs" },
          tga: { type: "cjs" },
          got: { type: "esm" },
        },
      }),
      eslintPlugin(),
      VueI18nPlugin({
        // you need to set i18n resource including paths!
        include: path.resolve(__dirname, "./i18n/**"),
      }),
    ],
    build: {
      sourcemap,
      target: "esnext",
    },
    server:
      process.env.VSCODE_DEBUG
      && (() => {
        const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
        return {
          host: url.hostname,
          port: +url.port,
        };
      })(),
    clearScreen: false,
  };
});
