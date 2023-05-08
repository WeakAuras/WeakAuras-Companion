import axios from "axios";
import FloatingVue from "floating-vue";
import { createPinia } from "pinia";
import { createPersistedStatePlugin } from "pinia-plugin-persistedstate-2";
import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import App from "./App.vue";
import { ipcRenderer } from "electron";

import de from "../i18n/de.json";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import fr from "../i18n/fr.json";
import ru from "../i18n/ru.json";
import tr from "../i18n/tr.json";
import zhcn from "../i18n/zh-cn.json";

async function getStore(key) {
  return await ipcRenderer.invoke("getStore", key);
}

async function setStore(key, value) {
  return await ipcRenderer.invoke("setStore", key, value);
}

async function deleteStore(key) {
  return await ipcRenderer.invoke("deleteStore", key);
}

function getLang() {
  return ipcRenderer.invoke("getLang");
}

(async () => {
  const app = createApp(App);
  const pinia = createPinia();

  pinia.use(
    createPersistedStatePlugin({
      storage: {
        getItem: async (key) => {
          return getStore(key);
        },
        setItem: async (key, value) => {
          return setStore(key, value);
        },
        removeItem: async (key) => {
          return deleteStore(key);
        },
      },
    })
  );

  axios.defaults.timeout = 30000;
  app.config.globalProperties.$http = axios;

  app.use(pinia);

  const locale = await getLang();

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
        $extend: "tooltip",
      },
    },
  });

  app.mount("#app").$nextTick(() => {
    postMessage({ payload: "removeLoading" }, "*");
  });
})();
