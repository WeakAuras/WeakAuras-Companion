import Vue from "vue";
import axios from "axios";
import VueI18n from "vue-i18n";

import App from "./App.vue";
import router from "./router";

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))

Vue.prototype.$http = axios;
Vue.http = Vue.prototype.$http;
Vue.config.productionTip = false;

Vue.use(VueI18n);

const i18n = new VueI18n({
  locale: "en",
  messages: {
    en: require("../../i18n/en.json"),
    fr: require("../../i18n/fr.json"),
    de: require("../../i18n/de.json"),
    ru: require("../../i18n/ru.json"),
  }
});

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  i18n,
  template: "<App/>"
}).$mount("#app");
