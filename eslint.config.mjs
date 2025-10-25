import eslint from "@eslint/js";
import unocss from "@unocss/eslint-config/flat";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tsEslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default defineConfig([
  eslint.configs.recommended,
  tsEslint.configs.recommendedTypeChecked,
  pluginVue.configs["flat/recommended"],
  unocss,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        NodeJS: "writable",
        __APP_VERSION__: "writable",
        __APP_LICENSE__: "writable",
      },
      parser: vueParser,
      parserOptions: {
        parser: tsEslint.parser,
        sourceType: "module",
        extraFileExtensions: [".vue"],
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: [
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
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-base-to-string": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/require-await": "off",
      "vue/multi-word-component-names": "off",
      "vue/block-order": [
        "error",
        {
          order: [["script", "template"], "style"],
        },
      ],
      "vue/html-self-closing": "off",
      "vue/html-indent": "off",
      "vue/html-closing-bracket-newline": "off",
      "vue/singleline-html-element-content-newline": "off",
    },
  },
]);
