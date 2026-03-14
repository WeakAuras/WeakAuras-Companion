import { ipcRenderer } from "electron";
import messages from "@intlify/unplugin-vue-i18n/messages";
import { createI18n } from "vue-i18n";

function getLang() {
  return ipcRenderer.invoke("getLang");
}

const locale = await getLang();

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale,
  fallbackLocale: "en",
  messages,
  pluralRules: {
    ru(choice, choicesLength) {
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
