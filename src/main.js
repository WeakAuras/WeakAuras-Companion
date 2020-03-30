import Vue from "vue";
import axios from "axios";
import VueI18n from "vue-i18n";
import VueElectron from "vue-electron";
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

const defaultPluralRules = VueI18n.prototype.getChoiceIndex;

/**
 * @param choice {number} a choice index given by the input to $tc: `$tc('path.to.rule', choiceIndex)`
 * @param choicesLength {number} an overall amount of available choices
 * @returns a final choice index to select plural word by
 */
VueI18n.prototype.getChoiceIndex = function extendedPluralRules(
  choice,
  choicesLength
) {
  // this === VueI18n instance, so the locale property also exists here
  if (this.locale !== "ru") {
    // proceed to the default implementation
    return defaultPluralRules.apply(this, [choice, choicesLength]);
  }
  const aChoice = Math.abs(choice);

  if (aChoice === 0) {
    return 0;
  }

  const withoutHundreds = aChoice % 100;
  const teen = withoutHundreds > 10 && withoutHundreds < 20;
  const endsWithOne = withoutHundreds % 10 === 1;

  if (!teen && endsWithOne) {
    return 1;
  }

  if (!teen && withoutHundreds % 10 >= 2 && withoutHundreds % 10 <= 4) {
    return 2;
  }

  return choicesLength < 4 ? 2 : 3;
};

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
});

Vue.config.productionTip = false;

new Vue({
  components: { App },
  render: (h) => h(App),
  i18n,
  template: "<App/>",
}).$mount("#app");
