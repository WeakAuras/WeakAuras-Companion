import vue from '@vitejs/plugin-vue'
import path from "path"
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/renderer'
import eslintPlugin from "vite-plugin-eslint"
import resolve, { lib2esm } from 'vite-plugin-resolve'
import pkg from '../../package.json'
import vueI18n from '@intlify/vite-plugin-vue-i18n'
import { viteCommonjs, esbuildCommonjs } from '@originjs/vite-plugin-commonjs';


// https://vitejs.dev/config/
export default defineConfig({
  mode: process.env.NODE_ENV,
  root: __dirname,
  resolve: {
    alias: [
      {
        find: /~(.+)/,
        replacement: path.join(process.cwd(), 'node_modules/$1'),
      },

      {
        find: /@\//,
        replacement: path.join(process.cwd(), './packages/renderer/src') + '/',
      },
    ]
  },
  plugins: [
    viteCommonjs(),
    vue(),
    electron(),
    resolve(
      /**
       * Here you can specify other modules
       * 🚧 You have to make sure that your module is in `dependencies` and not in the` devDependencies`,
       *    which will ensure that the electron-builder can package it correctly
       */
      {
        // If you use the following modules, the following configuration will work
        // What they have in common is that they will return - ESM format code snippets

        // ESM format string
        'electron-store': 'export default require("electron-store");',
        // Use lib2esm() to easy to convert ESM
        // Equivalent to
        /**
         * sqlite3: () => `
         * const _M_ = require('sqlite3');
         * const _D_ = _M_.default || _M_;
         * export { _D_ as default }
         * `
         */
        sqlite3: lib2esm('sqlite3', { format: 'cjs' }),
        serialport: lib2esm(
          // CJS lib name
          'serialport',
          // export memebers
          [
            'SerialPort',
            'SerialPortMock',
          ],
          { format: 'cjs' },
        ),
      }
    ),
    eslintPlugin(),
    vueI18n({
      // if you want to use Vue I18n Legacy API, you need to set `compositionOnly: false`
      compositionOnly: false,

      // you need to set i18n resource including paths!
      include: path.resolve(__dirname, './src/components/**/*.vue')
    })
  ],
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    sourcemap: true
  },
  optimizeDeps: {
    exclude: ["sharp"],
    esbuildOptions: {
      plugins: [
        esbuildCommonjs(['sharp'])
      ]
    }
  },
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT,
  },
})
