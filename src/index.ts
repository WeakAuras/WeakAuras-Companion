import { ipcRenderer } from "electron";
import FloatingVue from "floating-vue";
import { createPinia } from "pinia";
import { createPersistedStatePlugin } from "pinia-plugin-persistedstate-2";
import { createApp } from "vue";
import App from "./App.vue";
import { i18n } from "./libs/i18n";

async function getStore(key) {
  return await ipcRenderer.invoke("getStore", key);
}

async function setStore(key, value) {
  return await ipcRenderer.invoke("setStore", key, value);
}

async function deleteStore(key) {
  return await ipcRenderer.invoke("deleteStore", key);
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
    }),
  );

  app.use(pinia);
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
