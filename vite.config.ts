import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import VueDevTools from "vite-plugin-vue-devtools";
import webfontDownload from "vite-plugin-webfont-dl";
import { defineConfig } from "vite-plus";
import type { UserConfig } from "vite-plus";

import pkg from "./package.json";

// import { browserslistToTargets } from "lightningcss";
// import browserslist from "browserslist";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  rmSync("dist-electron", { recursive: true, force: true });

  const isServe = command === "serve";
  const isBuild = command === "build";
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

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
      UnoCSS(),
      VueDevTools(),
      vue(),
      electron([
        {
          // Main-Process entry file of the Electron App.
          entry: "electron/main/index.ts",
          onstart(options) {
            if (process.env.VSCODE_DEBUG) {
              console.log(
                /* For `.vscode/.debug.script.mjs` */ "[startup] Electron App",
              );
            } else {
              void options.startup();
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: "dist-electron/main",
              rollupOptions: {
                output: {
                  format: "esm",
                  entryFileNames: "[name].mjs",
                },
                external: Object.keys(
                  "dependencies" in pkg ? pkg.dependencies : {},
                ),
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
                external: Object.keys(
                  "dependencies" in pkg ? pkg.dependencies : {},
                ),
                output: {
                  format: "esm",
                  entryFileNames: "[name].mjs",
                },
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
      VueI18nPlugin({
        // you need to set i18n resource including paths!
        include: path.resolve(__dirname, "./i18n/**"),
      }),
      webfontDownload(),
    ],
    // css: {
    //   transformer: "lightningcss",
    //   lightningcss: {
    //     targets: browserslistToTargets(browserslist(">= 0.25%")),
    //   },
    // },
    build: {
      sourcemap,
      target: "esnext",
      rollupOptions: {
        output: {
          assetFileNames: "assets/[name].[ext]",
        },
      },
    },
    test: {
      globals: true,
      environment: "happy-dom",
      setupFiles: [],
      include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
      exclude: ["node_modules", "dist", "dist-electron", ".git", ".cache"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json"],
        exclude: [
          "node_modules/",
          "dist/",
          "dist-electron/",
          "**/*.d.ts",
          "**/*.config.*",
          "**/mockData",
        ],
      },
    },
    lint: {
      plugins: ["oxc", "typescript", "unicorn", "react", "vue"],
      jsPlugins: [
        {
          name: "vite-plus",
          specifier: "vite-plus/oxlint-plugin",
        },
      ],
      categories: {
        correctness: "warn",
      },
      options: {
        typeAware: true,
        typeCheck: true,
      },
      env: {
        builtin: true,
        commonjs: true,
        node: true,
        browser: true,
      },
      globals: {
        NodeJS: "writable",
        __APP_VERSION__: "writable",
        __APP_LICENSE__: "writable",
        defineProps: "readonly",
        defineEmits: "readonly",
        defineExpose: "readonly",
        defineModel: "readonly",
        defineOptions: "readonly",
        defineSlots: "readonly",
        withDefaults: "readonly",
      },
      ignorePatterns: [
        "dist",
        "node_modules",
        "dist_electron",
        "dist-electron",
        "release",
        "index.html",
        "tools/**/*.js",
        "uno.config.ts",
        "vite.config.ts",
        "*.d.ts",
      ],
      rules: {
        "constructor-super": "error",
        "for-direction": "error",
        "getter-return": "error",
        "no-async-promise-executor": "error",
        "no-case-declarations": "error",
        "no-class-assign": "error",
        "no-compare-neg-zero": "error",
        "no-cond-assign": "error",
        "no-const-assign": "error",
        "no-constant-binary-expression": "error",
        "no-constant-condition": "error",
        "no-control-regex": "error",
        "no-debugger": "error",
        "no-delete-var": "error",
        "no-dupe-class-members": "error",
        "no-dupe-else-if": "error",
        "no-dupe-keys": "error",
        "no-duplicate-case": "error",
        "no-empty": "error",
        "no-empty-character-class": "error",
        "no-empty-pattern": "error",
        "no-empty-static-block": "error",
        "no-ex-assign": "error",
        "no-extra-boolean-cast": "error",
        "no-fallthrough": "error",
        "no-func-assign": "error",
        "no-global-assign": "error",
        "no-import-assign": "error",
        "no-invalid-regexp": "error",
        "no-irregular-whitespace": "error",
        "no-loss-of-precision": "error",
        "no-misleading-character-class": "error",
        "no-new-native-nonconstructor": "error",
        "no-nonoctal-decimal-escape": "error",
        "no-obj-calls": "error",
        "no-prototype-builtins": "error",
        "no-redeclare": "error",
        "no-regex-spaces": "error",
        "no-self-assign": "error",
        "no-setter-return": "error",
        "no-shadow-restricted-names": "error",
        "no-sparse-arrays": "error",
        "no-this-before-super": "error",
        "no-undef": "error",
        "no-unexpected-multiline": "error",
        "no-unreachable": "error",
        "no-unsafe-finally": "error",
        "no-unsafe-negation": "error",
        "no-unsafe-optional-chaining": "error",
        "no-unused-labels": "error",
        "no-unused-private-class-members": "error",
        "no-unused-vars": "error",
        "no-useless-backreference": "error",
        "no-useless-catch": "error",
        "no-useless-escape": "error",
        "no-with": "error",
        "require-yield": "error",
        "use-isnan": "error",
        "valid-typeof": "error",
        "no-array-constructor": "error",
        "no-unused-expressions": "error",
        "vue/no-arrow-functions-in-watch": "error",
        "vue/no-async-in-computed-properties": "error",
        "vue/no-computed-properties-in-data": "error",
        "vue/no-deprecated-data-object-declaration": "error",
        "vue/no-deprecated-delete-set": "error",
        "vue/no-deprecated-destroyed-lifecycle": "error",
        "vue/no-deprecated-events-api": "error",
        "vue/no-deprecated-model-definition": "error",
        "vue/no-deprecated-props-default-this": "error",
        "vue/no-deprecated-vue-config-keycodes": "error",
        "vue/no-dupe-keys": "error",
        "vue/no-export-in-script-setup": "error",
        "vue/no-expose-after-await": "error",
        "vue/no-lifecycle-after-await": "error",
        "vue/no-reserved-component-names": "error",
        "vue/no-reserved-keys": "error",
        "vue/no-reserved-props": "error",
        "vue/no-shared-component-data": "error",
        "vue/no-side-effects-in-computed-properties": "error",
        "vue/no-watch-after-await": "error",
        "vue/prefer-import-from-vue": "error",
        "vue/require-prop-type-constructor": "error",
        "vue/require-render-return": "error",
        "vue/require-slots-as-functions": "error",
        "vue/return-in-computed-property": "error",
        "vue/return-in-emits-validator": "error",
        "vue/valid-define-emits": "error",
        "vue/valid-define-options": "error",
        "vue/valid-define-props": "error",
        "vue/valid-next-tick": "error",
        "vue/component-definition-name-casing": "warn",
        "vue/prop-name-casing": "warn",
        "vue/require-default-prop": "warn",
        "vue/require-prop-types": "warn",
        "vue/no-multiple-slot-args": "warn",
        "vue/no-required-prop-with-default": "warn",
        "typescript/await-thenable": "error",
        "typescript/ban-ts-comment": "error",
        "typescript/no-array-delete": "error",
        "typescript/no-base-to-string": "off",
        "typescript/no-duplicate-enum-values": "error",
        "typescript/no-duplicate-type-constituents": "error",
        "typescript/no-empty-object-type": "error",
        "typescript/no-explicit-any": "off",
        "typescript/no-extra-non-null-assertion": "error",
        "typescript/no-floating-promises": "off",
        "typescript/no-for-in-array": "error",
        "typescript/no-implied-eval": "error",
        "typescript/no-misused-new": "error",
        "typescript/no-misused-promises": "error",
        "typescript/no-namespace": "error",
        "typescript/no-non-null-asserted-optional-chain": "error",
        "typescript/no-redundant-type-constituents": "error",
        "typescript/no-require-imports": "error",
        "typescript/no-this-alias": "error",
        "typescript/no-unnecessary-type-assertion": "off",
        "typescript/no-unnecessary-type-constraint": "error",
        "typescript/no-unsafe-argument": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-call": "off",
        "typescript/no-unsafe-declaration-merging": "error",
        "typescript/no-unsafe-enum-comparison": "error",
        "typescript/no-unsafe-function-type": "error",
        "typescript/no-unsafe-member-access": "off",
        "typescript/no-unsafe-return": "off",
        "typescript/no-unsafe-unary-minus": "error",
        "typescript/no-useless-default-assignment": "off",
        "typescript/no-wrapper-object-types": "error",
        "typescript/only-throw-error": "error",
        "typescript/prefer-as-const": "error",
        "typescript/prefer-namespace-keyword": "error",
        "typescript/prefer-promise-reject-errors": "error",
        "typescript/require-await": "off",
        "typescript/restrict-plus-operands": "error",
        "typescript/restrict-template-expressions": "off",
        "typescript/triple-slash-reference": "error",
        "typescript/unbound-method": "error",
        "vite-plus/prefer-vite-plus-imports": "error",
      },
      overrides: [
        {
          files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
          rules: {
            "constructor-super": "off",
            "getter-return": "off",
            "no-class-assign": "off",
            "no-const-assign": "off",
            "no-dupe-class-members": "off",
            "no-dupe-keys": "off",
            "no-func-assign": "off",
            "no-import-assign": "off",
            "no-new-native-nonconstructor": "off",
            "no-obj-calls": "off",
            "no-redeclare": "off",
            "no-setter-return": "off",
            "no-this-before-super": "off",
            "no-undef": "off",
            "no-unreachable": "off",
            "no-unsafe-negation": "off",
            "no-var": "error",
            "no-with": "off",
            "prefer-const": "error",
            "prefer-rest-params": "error",
            "prefer-spread": "error",
          },
        },
      ],
    },
    fmt: {
      tabWidth: 2,
      arrowParens: "always",
      singleAttributePerLine: true,
      bracketSameLine: false,
      trailingComma: "all",
      quoteProps: "consistent",
      printWidth: 80,
      sortPackageJson: true,
      sortImports: {
        newlinesBetween: true,
        customGroups: [
          {
            groupName: "electron",
            elementNamePattern: ["electron", "electron/**"],
          },
          { groupName: "vue", elementNamePattern: ["vue", "vue/**"] },
        ],
        groups: [
          "builtin",
          "electron",
          "vue",
          "external",
          { newlinesBetween: true },
          "internal",
          "parent",
          "sibling",
          "index",
        ],
      },
      ignorePatterns: [
        ".github",
        ".vscode",
        "i18n",
        "*.yaml",
        "*.md",
        "*.json",
        "!package.json",
      ],
    },
    staged: {
      "*.{js,mjs,ts,vue}": "vp check --fix",
    },
    server: process.env.VSCODE_DEBUG
      ? (() => {
          const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
          return {
            host: url.hostname,
            port: +url.port,
            hrm: true,
          };
        })()
      : { hmr: true },
    clearScreen: false,
  } satisfies UserConfig;
});
