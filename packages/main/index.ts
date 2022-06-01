import { app, BrowserWindow, shell } from 'electron'
import { release } from 'os'
import { join } from 'path'
import { createApp } from "vue";
import axios from "axios";
import { createI18n } from "vue-i18n";
import FloatingVue from "floating-vue";
import App from "@/App.vue";
import { createPinia } from "pinia";
import { createPersistedStatePlugin } from "pinia-plugin-persistedstate-2";
import Store from "electron-store";

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (app.isPackaged) {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  } else {
    // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
    const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`

    win.loadURL(url)
    // win.webContents.openDevTools()
  }

  // Test active push message to Renderer-process
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

import en from "../../i18n/en.json";
import es from "../../i18n/es.json";
import fr from "../../i18n/fr.json";
import de from "../../i18n/de.json";
import ru from "../../i18n/ru.json";
import tr from "../../i18n/tr.json";
import zhcn from "../../i18n/zh-cn.json";

const app = createApp(App);
const pinia = createPinia();
const store = new Store();

pinia.use(
  createPersistedStatePlugin({
    storage: {
      getItem: async (key) => {
        return store.get(key)
      },
      setItem: async (key, value) => {
        return store.set(key, value)
      },
      removeItem: async (key) => {
        return store.delete(key)
      },
    },
  }),
);

axios.defaults.timeout = 15000;
app.config.globalProperties.$http = axios;
// Vue.http = Vue.prototype.$http;

app.use(pinia);

const configStoreSerialized = store.get("configStore");
let locale = "en"

if (typeof configStoreSerialized === "string") {
  locale = JSON.parse(configStoreSerialized).lang
}

const i18n = createI18n({
  locale: locale,
  fallbackLocale: "en",
  messages: {
    en,
    es,
    fr,
    de,
    ru,
    tr,
    "zh-cn": zhcn,
  },
  pluralizationRules: {
    ru: function (choice, choicesLength) {
      if (choicesLength < 4) {
        /* amount of available choices is incorrect (e.g. untranslated English phrase) */
        return choice === 0 ? 0 /* none */ : choice !== 1 ? 2 /* everything else */ : 1; /* is 1 */
      } else {
        /* amount of available choices is correct */
        return choice === 0
          ? 0 /* none */
          : choice % 10 === 1 && choice % 100 !== 11
            ? 1 /* ends in 1, excluding 11 */
            : choice % 10 >= 2 && choice % 10 <= 4 && (choice % 100 < 10 || choice % 100 >= 20)
              ? 2 /* ends in 2-4, excluding 12-14 */
              : 3; /* everything else */
      }
    },
  },
});

app.use(i18n);

app.use(FloatingVue, {
  themes: {
    "info-tooltip": {
      $extend: "tooltip"
    }
  }
});
app.mount("#app");
