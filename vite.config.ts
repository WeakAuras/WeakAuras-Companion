import { rmSync } from "node:fs";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import eslintPlugin from "vite-plugin-eslint";
import pkg from "./package.json";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";

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
          replacement: path.join(process.cwd(), "node_modules/$1"),
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
              sourcemap,
              minify: isBuild,
              outDir: "dist-electron/preload",
              rollupOptions: {
                external: Object.keys("dependencies" in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
      ]),
      // Use Node.js API in the Renderer-process
      renderer({
        // Enables use of Node.js API in the Renderer-process
        nodeIntegration: true,
        // Like Vite's pre bundling
        optimizeDeps: {
          include: ["sharp", "archiver", "regedit", "tga"],
        },
      }),
      eslintPlugin(),
      VueI18nPlugin({
        // you need to set i18n resource including paths!
        include: path.resolve(__dirname, "./src/components/**/*.vue"),
      }),
    ],
    build: {
      minify: false,
      rollupOptions: {
        external: Object.keys(pkg.dependencies),
      },
    },
    server:
      process.env.VSCODE_DEBUG &&
      (() => {
        const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
        return {
          host: url.hostname,
          port: +url.port,
        };
      })(),
  };
});
