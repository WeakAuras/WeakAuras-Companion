<!-- eslint-disable @typescript-eslint/unbound-method -->
<!-- eslint-disable @typescript-eslint/no-misused-promises -->
<script setup lang="ts">
import fs from "node:fs";
import path from "node:path";
import { ipcRenderer } from "electron";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from "vue";
import { buildAccountList } from "@/libs/build-account-list";
import { compareSVwithWago } from "@/libs/compare-sv-with-wago";
import { PlaterSaved, WeakAurasSaved } from "@/libs/grab-sv-files";
import { isAddonInstalled } from "@/libs/is-addon-installed";
import { parsePlaterSVdata, parseWeakAurasSVdata } from "@/libs/parse-sv-data";
import {
  createSortByAuthor,
  createSortByString,
  createSortByTime,
  createSortByType,
  createSortByUpdate,
} from "@/libs/sort";
import userDataPath from "@/libs/user-data-folder";
import { wowDefaultPath } from "@/libs/utilities";
import { validateWowPath as validateWowPathFn } from "@/libs/validate-wow-path";
import { wagoPushHandler } from "@/libs/wago-push-handler";
import { writeAddonData } from "@/libs/write-addon-data";
import type {
  ProgressInfo,
  UpdateDownloadedEvent,
  UpdateInfo,
} from "electron-updater";

import { useStashStore } from "../stores/auras";
import type { Account, AddonConfig, AuraType, Version } from "../stores/config";
import { useConfigStore } from "../stores/config";
import About from "./UI/About.vue";
import AppFooter from "./UI/AppFooter.vue";
import Aura from "./UI/Aura.vue";
import AuraHeaders from "./UI/AuraHeaders.vue";
import Config from "./UI/Config.vue";
import Dropdown from "./UI/Dropdown.vue";
import Help from "./UI/Help.vue";
import RefreshButton from "./UI/RefreshButton.vue";
import Report from "./UI/Report.vue";
import StopMotion from "./UI/StopMotion.vue";
import TitleBar from "./UI/TitleBar.vue";
import UIButton from "./UI/UIButton.vue";
import UpdatedAuraList from "./UI/UpdatedAuraList.vue";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type UpdaterEventArg =
  | { status: "error"; error: Error; message?: string }
  | { status: "download-progress"; progressInfo: ProgressInfo }
  | { status: "update-downloaded"; event: UpdateDownloadedEvent }
  | { status: "update-not-available"; updateInfo: UpdateInfo }
  | { status: "checking-for-update" }
  | { status: "update-available"; updateInfo: UpdateInfo };

export interface Updater {
  status: string | null;
  progress: number | null;
  scheduleId: NodeJS.Timeout | null;
  version: string | null;
  path: string | null;
  releaseNotes: string | null;
}

// Stores
const config = useConfigStore();
const stash = useStashStore();

// Reactive state
const updateAuraIsShown = ref(false);
const reportIsShown = ref(false);
const configStep = ref(0);
const addonSelected = ref("WeakAuras");
const fetching = ref(false);
const sortedColumn = ref("modified");
const sortDescending = ref(false);
const updater = reactive<Updater>({
  status: null,
  progress: null,
  scheduleId: null,
  version: null,
  path: null,
  releaseNotes: null,
});
const accountOptions = shallowRef<Array<{ text: string; value: string }>>([]);
const versionOptions = shallowRef<Array<{ text: string; value: string }>>([]);
const defaultWOWPath = ref("");

// Toggle functions
function toggleUpdatedAuraList() {
  updateAuraIsShown.value = !updateAuraIsShown.value;
}

function toggleReport() {
  reportIsShown.value = !reportIsShown.value;
}

// Computed properties
function getIsAddonInstalled(addon: string) {
  return isAddonInstalled(
    config,
    addon,
    versionSelected.value,
    accountSelected.value,
  );
}

const allAddonConfigs = computed((): AddonConfig[] => [
  {
    addonName: "WeakAuras",
    wagoAPI: "https://data.wago.io/api/check/",
    addonDependency: "WeakAuras",
    svPathFunction: WeakAurasSaved,
    isInstalled: getIsAddonInstalled("WeakAuras"),
    parseFunction: parseWeakAurasSVdata,
    hasTypeColumn: false,
  },
  {
    addonName: "Plater",
    wagoAPI: "https://data.wago.io/api/check/",
    addonDependency: "Plater",
    svPathFunction: PlaterSaved,
    isInstalled: getIsAddonInstalled("Plater"),
    parseFunction: parsePlaterSVdata,
    hasTypeColumn: true,
  },
]);

const addonsInstalled = computed(() =>
  allAddonConfigs.value.filter((addonConfig) => addonConfig.isInstalled),
);

const addonSelectedConfig = computed((): AddonConfig | null => {
  if (!addonSelected.value) return null;
  return (
    allAddonConfigs.value.find(
      (addonConfig) =>
        addonConfig.addonName.toLowerCase() ===
        addonSelected.value.toLowerCase(),
    ) || null
  );
});

const versionSelected = computed((): Version | undefined => {
  if (!config.wowpath.version || !config.wowpath.versions) {
    return undefined;
  }
  const selectedVersion = config.wowpath.versions.find(
    (version) => version.name === config.wowpath.version,
  );
  return selectedVersion || undefined;
});

const accountSelected = computed((): Account | null => {
  const version = versionSelected.value;
  if (typeof version === "object" && version.accounts) {
    return (
      version.accounts.find((account) => account.name === version.account) ||
      null
    );
  }
  return null;
});

const auras = computed((): AuraType[] => {
  return (
    (config.wowpath.validated &&
      config.wowpath.version &&
      accountSelected.value &&
      accountSelected.value.auras) ||
    []
  );
});

const aurasWithData = computed(() =>
  auras.value.filter(
    (aura) =>
      !!aura.encoded &&
      !(config.ignoreOwnAuras && aura.author === config.wagoUsername),
  ),
);

const sortFunction = computed(() => {
  const dir = sortDescending.value ? -1 : 1;
  const hasTypeColumn =
    addonSelectedConfig.value && addonSelectedConfig.value.hasTypeColumn;

  if (!sortedColumn.value || sortedColumn.value === "modified")
    return createSortByTime(dir);
  else if (sortedColumn.value === "auraTypeDisplay") {
    return createSortByType(dir);
  } else if (sortedColumn.value === "update") {
    return createSortByUpdate(dir, hasTypeColumn);
  } else if (sortedColumn.value === "author") {
    return createSortByAuthor(dir, hasTypeColumn);
  }

  return createSortByString(dir, sortedColumn.value);
});

const aurasSortedForView = computed(() =>
  [...auras.value]
    .filter(
      (aura) => !(config.ignoreOwnAuras && aura.author === config.wagoUsername),
    )
    .filter((aura) => aura.author !== null)
    .filter((aura) => aura.auraType === addonSelected.value)
    .sort(sortFunction.value),
);

// Watchers
watch(
  () => stash.auras.length,
  () => {
    writeAddonData(config, addonsInstalled.value, aurasWithData.value, stash);
  },
);

watch(
  () => config.wowpath.value,
  () => {
    validateWowPath();
  },
);

watch(
  () => config.wowpath.version,
  () => {
    buildAccountList(
      config,
      accountOptions.value,
      versionSelected.value,
      auras.value,
    );
  },
);

// Methods
async function checkCompanionUpdates() {
  try {
    await ipcRenderer.invoke("checkUpdates", config.beta);
  } catch (error) {
    console.error("Error checking updates:", error);
  }

  // check for app updates in 2 hours
  if (updater.scheduleId) clearTimeout(updater.scheduleId);

  updater.scheduleId = setTimeout(
    () => {
      checkCompanionUpdates().catch((error) =>
        console.error("Error checking updates:", error),
      );
    },
    1000 * 3600 * 2,
  );
}

function getWeakAurasSaved() {
  return WeakAurasSaved(config, versionSelected.value, accountSelected.value);
}

function getPlaterSaved() {
  return PlaterSaved(config, versionSelected.value, accountSelected.value);
}

function reset() {
  config.$reset();
}

function validateWowPath() {
  validateWowPathFn(
    config,
    versionOptions.value,
    accountOptions.value,
    versionSelected.value,
    auras.value,
  );
}

function doWriteAddonData() {
  return writeAddonData(
    config,
    addonsInstalled.value,
    aurasWithData.value,
    stash,
  );
}

async function doCompareSVwithWago() {
  return compareSVwithWago(
    config,
    versionSelected.value,
    accountSelected.value,
    fetching.value,
    addonsInstalled.value,
    addonSelected.value,
    auras.value,
    updateFetchingState,
    doWriteAddonData,
  );
}

function installUpdates() {
  ipcRenderer.invoke("installUpdates").catch(console.error);
}

function sortBy(columnName: string) {
  if (sortedColumn.value === columnName) {
    if (sortDescending.value) {
      sortDescending.value = false;
      sortedColumn.value = "modified";
    } else {
      sortDescending.value = true;
    }
  } else {
    sortDescending.value = false;
    sortedColumn.value = columnName;
  }
}

function updateFetchingState(newFetching: boolean) {
  fetching.value = newFetching;
}

// Lifecycle
const ipcListeners: Array<{
  channel: string;
  handler: (...args: any[]) => void;
}> = [];

function addIpcListener(channel: string, handler: (...args: any[]) => void) {
  ipcRenderer.on(channel, handler);
  ipcListeners.push({ channel, handler });
}

onMounted(async () => {
  addIpcListener("setAllowPrerelease", (_event, allowPrerelease: boolean) => {
    config.beta = allowPrerelease;
  });

  // refresh on event (tray icon)
  addIpcListener("refreshWago", () => {
    doCompareSVwithWago();
  });

  addIpcListener("linkHandler", async (_event, link: string) => {
    const pattern = /weakauras-companion:\/\/wago\/push\/([^/]+)/;

    if (link) {
      const result = link.match(pattern);
      let slug: string | undefined;

      if (result) {
        ({ 1: slug } = result);
      }

      if (slug) {
        await wagoPushHandler(config, slug, stash, versionSelected.value);
      }
    }
  });

  addIpcListener("updaterHandler", (_event, status: string, arg) => {
    console.log(`updaterHandler: ${status}`);

    if (status === "checking-for-update") {
      // No additional data for this status
      return;
    }

    updater.status = status;

    if (status === "download-progress" && "progressInfo" in arg) {
      updater.progress = Math.floor(arg.progressInfo.percent);
    }

    if (status === "update-available") {
      updater.path = `https://github.com/WeakAuras/WeakAuras-Companion/releases/download/v${arg.version}/${arg.path}`;
      updater.version = arg.version;
      updater.releaseNotes = arg.releaseNotes || "";
    }

    if (
      (status === "update-not-available" || status === "update-downloaded") &&
      "updateInfo" in arg
    ) {
      updater.path = `https://github.com/WeakAuras/WeakAuras-Companion/releases/download/v${arg.updateInfo.version}/${arg.updateInfo.path}`;
      updater.version = arg.updateInfo.version;

      // List if `updater.fullChangelog` is set to `true`, `string` otherwise.
      if (typeof arg.updateInfo.releaseNotes === "string") {
        updater.releaseNotes = arg.updateInfo.releaseNotes;
      } else if (Array.isArray(arg.updateInfo.releaseNotes)) {
        // Convert the array of ReleaseNoteInfo to a string
        updater.releaseNotes = arg.updateInfo.releaseNotes
          .map((note: { note: string }) => note.note)
          .join("\n");
      } else {
        updater.releaseNotes = "";
      }

      console.log(JSON.stringify(arg));
    }

    if (status === "error" && "error" in arg) {
      console.error(arg.error);
    }
  });

  // set default wow path
  if (!config.wowpath.validated) {
    try {
      const wowpath = await wowDefaultPath();
      defaultWOWPath.value = wowpath;

      if (!config.wowpath.validated) {
        config.wowpath.value = wowpath;

        validateWowPath();
      }
    } catch (e) {
      console.log(JSON.stringify(e));
    }
  }

  // create default backup folder
  fs.mkdir(path.join(userDataPath, "WeakAurasData-Backup"), () => {
    console.log("Creating default directory");
  });

  // check updates
  setTimeout(doCompareSVwithWago, 300);

  // check for app updates in 2 hours
  setTimeout(checkCompanionUpdates, 1000 * 3600 * 2);

  // default sorting
  sortDescending.value = false;
  sortedColumn.value = "update";
});

onBeforeUnmount(() => {
  for (const { channel, handler } of ipcListeners) {
    ipcRenderer.removeListener(channel, handler);
  }
  ipcListeners.length = 0;
});
</script>

<template>
  <div id="wrapper">
    <div
      class="main-container"
      :class="{ 'filter-blur': reportIsShown || updateAuraIsShown }"
    >
      <TitleBar />
      <header>
        <div class="app-logo">
          <img
            src="../../src/assets/weakauras.png"
            class="logo-img"
          />
          <span>{{ $t("app.main.companion" /* Companion */) }}</span>
        </div>
        <div class="menu-btns">
          <UIButton
            type="menu"
            :class="{ active: configStep === 0 }"
            :title="$t('app.menu.main')"
            @click="configStep = 0"
          >
            <span class="i-mdi-sync text-2xl color-white"></span>
          </UIButton>
          <UIButton
            type="menu"
            :class="{ active: configStep === 4 }"
            :title="$t('app.footer.stopmotion')"
            @click="configStep = 4"
          >
            <span class="i-mdi-movie text-2xl color-white"></span>
          </UIButton>
          <UIButton
            type="menu"
            :class="{ active: configStep === 1 }"
            :title="$t('app.menu.settings')"
            @click="configStep = 1"
          >
            <span class="i-mdi-settings text-2xl color-white"></span>
          </UIButton>
          <UIButton
            type="menu"
            :class="{ active: configStep === 2 }"
            :title="$t('app.menu.help')"
            @click="configStep = 2"
          >
            <span class="i-mdi-help-circle text-2xl color-white"></span>
          </UIButton>
          <UIButton
            type="menu"
            :class="{ active: configStep === 3 }"
            :title="$t('app.menu.about')"
            @click="configStep = 3"
          >
            <span class="i-mdi-info-circle text-2xl color-white"></span>
          </UIButton>
        </div>
      </header>
      <main>
        <template v-if="configStep === 0">
          <div id="selectors">
            <div
              v-if="config.wowpath.validated && config.wowpath.versions"
              id="version-selector"
            >
              <Dropdown
                v-model:value="config.wowpath.version"
                :options="versionOptions"
                :label="$t('app.wowpath.version' /* Version */)"
                @change="doCompareSVwithWago()"
              />
            </div>
            <div
              v-if="config.wowpath.validated && versionSelected"
              id="account-selector"
            >
              <Dropdown
                v-model:value="versionSelected.account"
                :options="accountOptions"
                :label="$t('app.wowpath.account' /* Account */)"
                @change="doCompareSVwithWago()"
              />
            </div>
          </div>
          <div
            v-if="allAddonConfigs.length > 1"
            id="addonbttns"
          >
            <label
              :key="addonSelected"
              class="btn-label text-brand-grey-lightest"
            >
              {{ $t("app.main.addons" /* Addons */) }}
            </label>
            <span style="margin-left: 5px" />
            <UIButton
              v-for="(addon, index) in allAddonConfigs"
              :key="index"
              type="addon"
              :class="{ active: addonSelected === addon.addonName }"
              :disabled="!addon.isInstalled"
              @click="addonSelected = addon.addonName"
            >
              {{ addon.addonName }}
            </UIButton>
          </div>
          <div id="dashboard">
            <RefreshButton
              :is-settings-ok="config.wowpath.validated"
              :is-version-selected="versionSelected"
              :is-account-selected="accountSelected"
              :is-sv-ok="!!getWeakAurasSaved() || !!getPlaterSaved()"
              :fetching="fetching"
              :last-update="
                accountSelected && new Date(accountSelected.lastWagoUpdate)
              "
              :auras-shown="aurasSortedForView.length"
              :is-addons-ok="
                getIsAddonInstalled('WeakAuras') ||
                getIsAddonInstalled('Plater')
              "
              @refresh="doCompareSVwithWago()"
              @gotoconfig="configStep = 1"
            />
            <br />
            <template v-if="aurasSortedForView.length > 0 && !fetching">
              <AuraHeaders
                :sorted-column="sortedColumn"
                :sort-descending="sortDescending"
                :addon-selected-config="addonSelectedConfig"
                @sort-by="sortBy"
              />
              <div id="aura-list">
                <Aura
                  v-for="aura in aurasSortedForView"
                  :key="aura.slug"
                  :aura="aura"
                />
              </div>
            </template>
          </div>
        </template>
        <Config
          v-else-if="configStep === 1"
          :default-w-o-w-path="defaultWOWPath"
          @reset="reset"
          @check-companion-updates="checkCompanionUpdates"
          @validate-wow-path="validateWowPath"
        />
        <Help v-else-if="configStep === 2" />
        <About v-else-if="configStep === 3" />
        <StopMotion
          v-else-if="configStep === 4"
          :wow-versions="versionOptions"
        />
      </main>
      <AppFooter
        :updater="updater"
        @toggle-report="toggleReport"
        @toggle-updated-aura-list="toggleUpdatedAuraList"
        @install-updates="installUpdates"
      />
    </div>
    <Report
      v-if="reportIsShown"
      @close="toggleReport"
    />
    <UpdatedAuraList
      v-if="updateAuraIsShown"
      @close="toggleUpdatedAuraList"
    />
  </div>
</template>

<style lang="css">
@import "../assets/css/tooltip.css";
@import "../assets/css/common.css";

/* Companion logo */
.app-logo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 25px;
  left: 2.35vw;
  -webkit-app-region: drag;
}

.logo-img {
  height: 50px;
  transition: all 0.2s ease-in-out;
}

.app-logo span {
  font-weight: 300;
  font-size: 22px;
  margin-left: 5px;
  color: #e4e4e4;
  transition: all 0.2s ease-in-out;
}

.main-container {
  -webkit-app-region: drag;
  background-color: #101010;
  border-radius: 8px;
}

/* Menu */
.btn.btn-menu {
  background: transparent;
  -webkit-app-region: no-drag;
  color: #e6e6e6;
  padding: 0 18px;
  text-align: center;
  width: auto;
  height: 100%;
  border: none;
  border-radius: 0;
  font-weight: 600;
  font-size: 16px;
  border-bottom: 3px solid transparent;
  transition:
    background-color 0.2s ease-in-out,
    border-bottom 0.2s ease-in-out,
    font-size 0.2s ease-in-out;
}

.btn.btn-menu span {
  position: relative;
  top: 3px;
}

.btn.btn-menu:hover {
  background-color: #1f1f1f;
}

.btn-menu.active {
  background-color: #171717;
  border-bottom: 3px solid #c4c4c4;
}

/* Main page container */
#dashboard {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* WoW addon selection */
#addonbttns {
  position: absolute;
  left: 30px;
  top: 30px;
  z-index: 50;
  text-align: left;
  height: 65px;
}

.btn-label {
  display: block;
  margin-bottom: 5px;
  margin-left: 1px;
  cursor: default;
  font-size: 15px;
  font-weight: 500;
}

/* WoW Version & Account selection */
#selectors {
  position: absolute;
  top: 20px;
  right: 20px;
}

#selectors option,
#selectors select {
  background: #191919;
  color: #e6e6e6;
  margin: 0 5px;
  border-radius: 6px;
  width: 120px;
}

#selectors option:focus,
#selectors select:focus {
  outline: none;
}

#version-selector {
  position: absolute;
  top: 0px;
  right: 10px;
  z-index: 5;
}

#account-selector {
  position: absolute;
  top: 55px;
  right: 10px;
}

/* Aura list */
#aura-list {
  overflow-y: auto;
  overflow-x: hidden;
  height: 65%;
  text-align: center;
  margin: 0 2.35vw 15px;
  border-radius: 8px;
  transition: height 0.4s ease-in-out;
}

/* Scrollbar */
::-webkit-scrollbar {
  position: relative;
  width: 10px;
  background: #212121;
  border-radius: 35px;
}

/* Track */
::-webkit-scrollbar-track {
  border: 1px solid #292828;
  border-radius: 35px;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #c4c4c4;
  border: 2px solid #212121;
  border-radius: 5px;
  width: 8px;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555555;
}

/* Report Page */
.reportbug {
  font-size: 12px;
  color: #e6e6e6;
  vertical-align: bottom;
  line-height: 25px;
  float: right;
  text-shadow: #000000 1px 0;
  font-weight: 600;
  opacity: 0.5;
}

.reportbug:hover {
  opacity: 1;
}

.ready-to-install {
  font-size: 12px;
  color: #e6e6e6;
  vertical-align: bottom;
  line-height: 25px;
  float: right;
  text-shadow: #000000 1px 0;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  padding-right: 15px;
}

.ready-to-install span {
  cursor: pointer;
  opacity: 0.8;
  margin-right: 5px;
}

.ready-to-install:hover span {
  opacity: 1;
}

.invert {
  filter: invert(100%);
}

/* Get WeakAuras */
.getweakauras {
  font-size: 12px;
  color: #e6e6e6;
  vertical-align: bottom;
  line-height: 25px;
  float: left;
  text-shadow: #000000 1px 0;
  font-weight: 600;
  opacity: 0.5;
}

.getweakauras:hover {
  opacity: 1;
}

/* Browse Wago & Stopmotion */
.browsewago,
.stopmotion {
  font-size: 12px;
  color: #e6e6e6;
  vertical-align: bottom;
  line-height: 25px;
  float: left;
  text-shadow: #000000 1px 0;
  font-weight: 600;
  opacity: 0.5;
  margin-left: 10px;
}

.browsewago:hover,
.stopmotion:hover {
  opacity: 1;
}

.exclamationmark {
  color: #fcff3d;
}

/* WoW Version & Account selection */
main {
  position: relative;
}

select {
  padding: 5px;
  font-size: small;
  border-radius: 2px;
  border: none;
  background-color: #e6e6e6;
  color: #010101;
}
</style>
