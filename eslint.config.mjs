import pluginVue from "eslint-plugin-vue";
import unocss from "@unocss/eslint-config/flat";
import eslint from "@eslint/js";
import tsEslint from "typescript-eslint";
import tsParser from "@typescript-eslint/parser";
import vueParser from "vue-eslint-parser";
import globals from "globals";

export default [
  eslint.configs.recommended,
  ...tsEslint.configs.recommendedTypeChecked,
  ...pluginVue.configs["flat/recommended"],
  unocss,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        NodeJS: "writable",
        __APP_VERSION__: "writable",
        __APP_LICENSE__: "writable",
      },
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        sourceType: "module",
        extraFileExtensions: [".vue"],
        project: true,
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
      "vue/component-tags-order": [
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
];
