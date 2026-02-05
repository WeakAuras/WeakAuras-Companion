<script setup lang="ts">
import { ipcRenderer, shell } from "electron";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useConfigStore } from "../../stores/config";
import Checkbox from "./Checkbox.vue";
import Dropdown from "./Dropdown.vue";
import FileSelect from "./FileSelect.vue";
import UIButton from "./UIButton.vue";

const props = defineProps<{
  defaultWOWPath?: string;
}>();

const emit = defineEmits<{
  reset: [];
  checkCompanionUpdates: [];
  validateWowPath: [];
}>();

const config = useConfigStore();
const { locale } = useI18n();

const wagoUsername = ref(config.wagoUsername);
const wagoApiKey = ref(config.wagoApiKey);

// Sync store changes back to local refs
watch(
  () => config.wagoUsername,
  (newVal) => {
    wagoUsername.value = newVal;
  },
);
watch(
  () => config.wagoApiKey,
  (newVal) => {
    wagoApiKey.value = newVal;
  },
);

const langs = [
  { value: "zh-cn", text: "中文 (简体) (zh-cn)" },
  { value: "de", text: "Deutsch (de)" },
  { value: "en", text: "English (en)" },
  { value: "es", text: "Español (es)" },
  { value: "fr", text: "Français (fr)" },
  { value: "ru", text: "Русский (ru)" },
  { value: "tr", text: "Türkçe (tr)" },
];

const backupsize = [
  { value: 50, text: "50mb" },
  { value: 100, text: "100mb" },
  { value: 500, text: "500mb" },
];

watch(
  () => config.autostart,
  () => {
    ipcRenderer.invoke("autoStart", config.autostart === true);
  },
);

watch(
  () => config.lang,
  () => {
    console.log(`change locale to ${config.lang}`);
    locale.value = config.lang;
  },
);

watch(
  () => config.beta,
  () => {
    emit("checkCompanionUpdates");
  },
);

function reset() {
  emit("reset");
  wagoUsername.value = null;
}

function openBackupDir() {
  shell.openPath(config.backup.path);
}

const isApiKeyValid = computed(() => {
  return config.wagoApiKey?.match(/^[\w\d]{64}$/);
});
</script>

<template>
  <div
    id="config"
    class="h-full w-full overflow-auto py-1.5 pl-[2.35vw] text-left"
  >
    <div class="w-full flex flex-row justify-between">
      <div class="flex-1">
        <!-- Game Settings Section -->
        <div class="title mb-2 mt-1 text-lg">
          {{ $t("app.config.gameSettings" /* Game Settings */) }}
        </div>
        <div>
          <FileSelect
            v-model:path="config.wowpath.value"
            :default-path="props.defaultWOWPath"
            :open-directory="true"
            :create-directory="true"
            @update:path="emit('validateWowPath')"
          >
            {{ $t("app.fileselect.wowfolder" /* World of Warcraft Folder */) }}
          </FileSelect>
          <i
            v-if="config.wowpath.validated"
            class="i-mdi-check-circle-outline mt-3 align-top text-2xl text-status-ok"
          />
          <i
            v-else
            class="i-mdi-error-outline mt-3 align-top text-2xl text-status-failure"
          />
        </div>
        <!-- Companion Settings Section -->
        <div class="title mb-2 mt-4 text-lg">
          {{ $t("app.config.clientSettings" /* Companion Settings */) }}
        </div>
        <div>
          <Dropdown
            v-model:value="config.lang"
            :options="langs"
            :label="$t('app.config.lang' /* Language */)"
          />
          <Checkbox v-model="config.notify">
            {{
              $t(
                "app.config.notification" /* Show notifications for new updates */,
              )
            }}
          </Checkbox>
          <p
            class="label mb-2 mt-4 text-base text-brand-grey-lightest font-semibold"
          >
            {{ $t("app.config.startup" /* Startup */) }}
          </p>
          <div class="mb-2">
            <Checkbox v-model="config.autostart">
              {{
                $t(
                  "app.config.autoStart" /* Launch client with your computer */,
                )
              }}
            </Checkbox>
          </div>
          <div class="mb-2">
            <Checkbox v-model="config.startminimize">
              {{ $t("app.config.minimized" /* Start minimised */) }}
            </Checkbox>
          </div>
          <p
            class="label mb-2 mt-4 text-base text-brand-grey-lightest font-semibold"
          >
            {{ $t("app.config.autoupdater" /* Updates */) }}
          </p>
          <div class="mb-2">
            <Checkbox v-model="config.beta">
              {{
                $t(
                  "app.config.autoupdater.beta" /* Use Companion Beta channel */,
                )
              }}
            </Checkbox>
          </div>
          <!--
          <div class="mb-2">
            <checkbox v-model="config.autoupdate">
              {{
                $t(
                  "app.config.autoupdater.autoupdate" /* Install Companion updates automatically */
                )
              }}
            </checkbox>
          </div>
          -->
        </div>
      </div>
      <div class="flex-1">
        <!-- Wago Settings -->
        <div class="title mb-2 mt-1 text-lg">
          {{ $t("app.config.wagoSettings" /* Wago Settings */) }}
        </div>
        <div>
          <p class="my-2">
            {{ $t("app.config.wagoAccount" /* Set Wago Account (optional) */) }}
          </p>
          <input
            v-model="wagoUsername"
            type="text"
            size="11"
            class="ml-1.5 mr-0.5 h-7.5 cursor-pointer whitespace-nowrap border-brand-grey-dark rounded-md border-solid bg-brand-grey-darkest px-7.5 py-1.5 pl-2.5 text-sm text-brand-grey-lightest hover:bg-brand-grey-darker hover:text-brand-grey-lightest focus:outline-none focus:ring-1 focus:ring-brand-accent"
            @keyup.enter="config.wagoUsername = wagoUsername"
          />
          <UIButton
            v-if="wagoUsername !== config.wagoUsername"
            class="btn-ok"
            @click="config.wagoUsername = wagoUsername"
          >
            {{ $t("app.config.ok" /* OK */) }}
          </UIButton>
          <i
            v-if="config.wagoUsername"
            class="i-mdi-check-circle-outline ml-1 mt-0.25 align-top text-2xl text-status-ok"
          />
          <p class="my-2">
            {{ $t("app.config.wagoApiKey" /* Set Wago API Key (optional) */) }}
          </p>
          <input
            v-model="wagoApiKey"
            type="password"
            size="11"
            class="ml-1.5 mr-0.5 h-7.5 cursor-pointer whitespace-nowrap border-brand-grey-dark rounded-md border-solid bg-brand-grey-darkest px-7.5 py-1.5 pl-2.5 text-sm text-brand-grey-lightest hover:bg-brand-grey-darker hover:text-brand-grey-lightest focus:outline-none focus:ring-1 focus:ring-brand-accent"
            @keyup.enter="config.wagoApiKey = wagoApiKey"
          />
          <UIButton
            v-if="wagoApiKey !== config.wagoApiKey"
            class="btn-ok"
            @click="config.wagoApiKey = wagoApiKey"
          >
            {{ $t("app.config.ok" /* OK */) }}
          </UIButton>
          <i
            v-if="config.wagoApiKey && isApiKeyValid"
            class="i-mdi-check-circle-outline ml-1 mt-0.25 align-top text-2xl text-status-ok"
          />
          <i
            v-else-if="config.wagoApiKey && !isApiKeyValid"
            class="i-mdi-error-outline ml-1 mt-0.25 align-top text-2xl text-status-issue"
          />
          <p
            v-if="config.wagoApiKey && !isApiKeyValid"
            class="mt-2 text-status-issue"
          >
            {{
              $t(
                "app.config.badapikey" /* Wago API Key should be 64 characters */,
              )
            }}
          </p>
          <p class="mt-2">
            <a
              href="https://wago.io/account"
              class="cursor-pointer text-xs text-brand-accent font-semibold"
              target="_blank"
            >
              {{ $t("app.config.getYours" /* Get yours */) }}
            </a>
          </p>
          <Checkbox v-model="config.ignoreOwnAuras">
            {{
              $t(
                "app.config.ignoreOwnAuras" /* Ignore auras from your account */,
              )
            }}
          </Checkbox>
        </div>
        <!-- WeakAuras Backup Section -->
        <div class="title mb-2 mt-4 text-lg">
          {{ $t("app.config.backup.title" /* WeakAuras Backup */) }}
        </div>
        <div>
          <p class="my-2">
            <Checkbox v-model="config.backup.active">
              {{ $t("app.config.backup.activate" /* Activate */) }}
            </Checkbox>
          </p>
          <div
            v-if="config.backup.active"
            class="inline"
          >
            <FileSelect
              v-model:path="config.backup.path"
              :default-path="config.backup.defaultBackupPath"
              :open-directory="true"
              :create-directory="true"
            >
              {{ $t("app.config.backup.backupfolder" /* Backup Folder */) }}
            </FileSelect>
            <p
              class="mt-2 cursor-pointer text-xs text-brand-accent font-semibold"
              @click="openBackupDir()"
            >
              {{ $t("app.config.backup.openfolder" /* Open Folder */) }}
            </p>
            <Dropdown
              v-model:value="config.backup.maxSize"
              :options="backupsize"
              :label="
                $t('app.config.backup.dedicatedsize' /* Dedicated size */)
              "
            />
          </div>
        </div>
      </div>
    </div>
    <UIButton
      type="reset"
      class="mt-4"
      @click="reset"
    >
      {{ $t("app.config.reset" /* Reset Settings and Data */) }}
    </UIButton>
  </div>
</template>
