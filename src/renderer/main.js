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
axios.defaults.timeout = 5000;

Vue.prototype.$http = axios;
Vue.http = Vue.prototype.$http;
Vue.config.productionTip = false;

Vue.use(VueI18n);

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
