import axios from "axios";
import { VTooltip } from "v-tooltip";
import Vue from "vue";
import VueElectron from "vue-electron";
import VueI18n from "vue-i18n";
import Toasted from "vue-toasted";
import App from "./App.vue";

const en = require("../i18n/en.json");
const es = require("../i18n/es.json");
const fr = require("../i18n/fr.json");
const de = require("../i18n/de.json");
const ru = require("../i18n/ru.json");
const tr = require("../i18n/tr.json");
const zhcn = require("../i18n/zh-cn.json");

Vue.use(VueElectron);
Vue.use(Toasted);
Vue.use(VueI18n);
Vue.directive("tooltip", VTooltip);

axios.defaults.timeout = 15000;

/* uncomment to debug api requests
axios.interceptors.request.use(request => {
  console.log("Starting Request", request);
  return request;
});

axios.interceptors.response.use(response => {
  console.log("Response:", response);
  return response;
});
*/

Vue.prototype.$http = axios;
Vue.http = Vue.prototype.$http;
Vue.config.productionTip = false;

const i18n = new VueI18n({
  locale: "en",
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
        return choice === 0
          ? 0 /* none */
          : choice !== 1
          ? 2 /* everything else */
          : 1; /* is 1 */
      } else {
        /* amount of available choices is correct */
        return choice === 0
          ? 0 /* none */
          : choice % 10 === 1 && choice % 100 !== 11
          ? 1 /* ends in 1, excluding 11 */
          : choice % 10 >= 2 &&
            choice % 10 <= 4 &&
            (choice % 100 < 10 || choice % 100 >= 20)
          ? 2 /* ends in 2-4, excluding 12-14 */
          : 3; /* everything else */
      }
    },
  },
});

Vue.config.productionTip = false;

new Vue({
  components: { App },
  render: (h) => h(App),
  i18n,
  template: "<App/>",
}).$mount("#app");
