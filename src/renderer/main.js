import Vue from "vue";
import axios from "axios";
import VueI18n from "vue-i18n";
import VueElectron from "vue-electron";

import App from "./App.vue";
import router from "./router";

const en = require("../../i18n/en.json");
const fr = require("../../i18n/fr.json");
const de = require("../../i18n/de.json");
const ru = require("../../i18n/ru.json");

if (!process.env.IS_WEB) {
  Vue.use(VueElectron);
}

Vue.prototype.$http = axios;
Vue.http = Vue.prototype.$http;
Vue.config.productionTip = false;

Vue.use(VueI18n);

const i18n = new VueI18n({
  locale: "en",
  fallbackLocale: "en",
  messages: {
    en,
    fr,
    de,
    ru
  }
});

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  i18n,
  template: "<App/>"
}).$mount("#app");
