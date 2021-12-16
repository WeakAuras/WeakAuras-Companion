import { createApp } from "vue";
// import { configureCompat } from '@vue/compat';
import axios from "axios";
import { createI18n } from "vue-i18n";
// import VueElectron from 'vue-electron';
// import Toasted from 'vue-toasted';
import { VTooltip } from "v-tooltip";
import App from "@/App.vue";

import en from "../i18n/en.json";
import es from "../i18n/es.json";
import fr from "../i18n/fr.json";
import de from "../i18n/de.json";
import ru from "../i18n/ru.json";
import tr from "../i18n/tr.json";
import zhcn from "../i18n/zh-cn.json";

const app = createApp(App);

// app.use(VueElectron);
// app.use(Toasted);
//@ts-expect-error sssss
app.directive("tooltip", VTooltip);

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

app.config.globalProperties.$http = axios;
// Vue.http = Vue.prototype.$http;

const i18n = createI18n({
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

// Vue.config.productionTip = false;

// new Vue({
//   components: { App },
//   render: (h) => h(App),
//   i18n,
//   template: '<App/>',
// }).$mount('#app');

// app.use(router);
// app.use(store);
// Initiate other plugins here

// configureCompat({
//   // default everything to Vue 2 behavior
//   MODE: 2,
// });

app.mount("#app");
