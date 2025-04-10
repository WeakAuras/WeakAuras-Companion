<!-- eslint-disable @typescript-eslint/unbound-method -->
<!-- eslint-disable @typescript-eslint/no-misused-promises -->
<script lang="ts">
import fs from "node:fs";
import path from "node:path";
import { ipcRenderer } from "electron";
import { defineComponent, provide, ref } from "vue";
import { buildAccountList } from "@/libs/build-account-list";
import { compareSVwithWago } from "@/libs/compare-sv-with-wago";
import contacts from "@/libs/contacts";
import { PlaterSaved, WeakAurasSaved } from "@/libs/grab-sv-files";
import hash from "@/libs/hash";
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
import { validateWowPath } from "@/libs/validate-wow-path";
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

interface WeakAurasMetadata {
  name: string;
  url: string;
  displayName: string;
}

interface WagoMetadata {
  name: string;
  url: string;
  displayName: string;
}

const weakauras: WeakAurasMetadata[] = contacts.weakauras;
const wago: WagoMetadata[] = contacts.wago;

export default defineComponent({
  name: "LandingPage",
  components: {
    RefreshButton,
    Aura,
    AuraHeaders,
    Config,
    About,
    Help,
    TitleBar,
    Report,
    UpdatedAuraList,
    UIButton,
    Dropdown,
    StopMotion,
    AppFooter,
  },
  setup() {
    const config = useConfigStore();
    const stash = useStashStore();

    const updateAuraIsShown = ref(false);
    const toggleUpdatedAuraList = () => {
      updateAuraIsShown.value = !updateAuraIsShown.value;
    };

    const reportIsShown = ref(false);
    const toggleReport = () => {
      reportIsShown.value = !reportIsShown.value;
    };

    provide("toggleReport", toggleReport);
    provide("toggleUpdatedAuraList", toggleUpdatedAuraList);

    return {
      config,
      stash,
      updateAuraIsShown,
      reportIsShown,
      toggleUpdatedAuraList,
      toggleReport,
    };
  },
  data() {
    return {
      configStep: 0,
      addonSelected: "WeakAuras",
      fetching: false, // use for avoid spamming refresh UIButton and show spinner
      sortedColumn: "modified",
      sortDescending: false,
      schedule: {
        id: null, // 1h setTimeout id
      },
      medias: { weakauras, wago },
      updater: {
        status: null, // checking-for-update, update-available, update-not-available, error, download-progress, update-downloaded
        progress: null,
        scheduleId: null, // for 2h auto-updater
        version: null,
        path: null,
        releaseNotes: null,
      } as Updater,
      isMac: process.platform === "darwin",
      accountOptions: [],
      versionOptions: [],
      defaultWOWPath: "",
    };
  },
  computed: {
    readyForInstallTooltip() {
      return this.stash.tohtml();
    },
    accountHash() {
      if (this.versionSelected) {
        const { account } = this.versionSelected;
        return hash.hashFnv32a(account, true);
      }
      return null;
    },
    allAddonConfigs() {
      const addonConfigs: AddonConfig[] = [
        {
          addonName: "WeakAuras",
          wagoAPI: "https://data.wago.io/api/check/",
          addonDependency: "WeakAuras",
          svPathFunction: WeakAurasSaved,
          isInstalled: this.getIsAddonInstalled("WeakAuras"),
          parseFunction: parseWeakAurasSVdata,
          hasTypeColumn: false,
        },
        {
          addonName: "Plater",
          wagoAPI: "https://data.wago.io/api/check/",
          addonDependency: "Plater",
          svPathFunction: PlaterSaved,
          isInstalled: this.getIsAddonInstalled("Plater"),
          parseFunction: parsePlaterSVdata,
          hasTypeColumn: true,
        },
      ];
      return addonConfigs;
    },
    addonsInstalled() {
      return this.allAddonConfigs.filter(
        (addonConfig) => addonConfig.isInstalled,
      );
    },
    addonSelectedConfig(): AddonConfig | null {
      if (!this.addonSelected) return null;
      return (
        this.allAddonConfigs.find(
          (addonConfig) =>
            addonConfig.addonName.toLowerCase() ===
            this.addonSelected.toLowerCase(),
        ) || null
      );
    },
    versionSelected(): Version | undefined {
      if (!this.config.wowpath.version || !this.config.wowpath.versions) {
        return undefined;
      }

      const selectedVersion = this.config.wowpath.versions.find(
        (version) => version.name === this.config.wowpath.version,
      );

      return selectedVersion || undefined;
    },
    accountSelected(): Account {
      const versionSelected = this.versionSelected;

      if (typeof versionSelected === "object") {
        return versionSelected.accounts.find(
          (account) => account.name === versionSelected.account,
        );
      }
      return null;
    },
    aurasWithData() {
      return this.auras.filter(
        (aura) =>
          !!aura.encoded &&
          !(
            this.config.ignoreOwnAuras &&
            aura.author === this.config.wagoUsername
          ),
      );
    },
    aurasWithUpdate() {
      return this.aurasWithData.filter(
        (aura) => aura.wagoVersion > aura.version && !aura.ignoreWagoUpdate,
      );
    },
    aurasSortedForView() {
      return this.auras
        .filter(
          (aura) =>
            !(
              this.config.ignoreOwnAuras &&
              aura.author === this.config.wagoUsername
            ),
        )
        .filter((aura) => aura.author !== null)
        .filter((aura) => aura.auraType === this.addonSelected)
        .sort(this.sortFunction);
    },
    sortFunction() {
      const dir = this.sortDescending ? -1 : 1;
      const hasTypeColumn =
        this.addonSelectedConfig && this.addonSelectedConfig.hasTypeColumn;

      if (!this.sortedColumn || this.sortedColumn === "modified")
        return createSortByTime(dir);
      else if (this.sortedColumn === "auraTypeDisplay") {
        return createSortByType(dir);
      } else if (this.sortedColumn === "update") {
        return createSortByUpdate(dir, hasTypeColumn);
      } else if (this.sortedColumn === "author") {
        return createSortByAuthor(dir, hasTypeColumn);
      }

      return createSortByString(dir, this.sortedColumn);
    },
    auras: {
      get(): AuraType[] {
        return (
          (this.config.wowpath.validated &&
            this.config.wowpath.version &&
            this.accountSelected &&
            this.accountSelected.auras) ||
          []
        );
      },
      set(newValue: AuraType[]) {
        this.accountSelected.auras = newValue;
      },
    },
  },
  watch: {
    "stash.auras": {
      handler() {
        writeAddonData(
          this.config,
          this.addonsInstalled,
          this.aurasWithData,
          this.stash,
        );
      },
      deep: true,
    },
    "config.wowpath.value": function () {
      validateWowPath(
        this.config,
        this.versionOptions,
        this.accountOptions,
        this.versionSelected,
        this.auras,
      );
    },
    "config.wowpath.version": function () {
      buildAccountList(
        this.config,
        this.accountOptions,
        this.versionSelected,
        this.auras,
      );
    },
  },
  async mounted() {
    ipcRenderer.on("setAllowPrerelease", (_event, allowPrerelease: boolean) => {
      this.config.beta = allowPrerelease;
    });

    // refresh on event (tray icon)
    ipcRenderer.on("refreshWago", () => {
      this.doCompareSVwithWago();
    });

    ipcRenderer.on("linkHandler", async (_event, link: string) => {
      const pattern = /weakauras-companion:\/\/wago\/push\/([^/]+)/;

      if (link) {
        const result = link.match(pattern);
        let slug: string;

        if (result) {
          ({ 1: slug } = result);
        }

        if (slug) {
          await wagoPushHandler(
            this.config,
            slug,
            this.stash,
            this.versionSelected,
          );
        }
      }
    });

    ipcRenderer.on("updaterHandler", (_event, status: string, arg) => {
      console.log(`updaterHandler: ${status}`);

      if (status === "checking-for-update") {
        // No additional data for this status
        return;
      }

      this.updater.status = status;

      if (status === "download-progress" && "progressInfo" in arg) {
        this.updater.progress = Math.floor(arg.progressInfo.percent);
      }

      if (status === "update-available") {
        this.updater.path = `https://github.com/WeakAuras/WeakAuras-Companion/releases/download/v${arg.version}/${arg.path}`;
        this.updater.version = arg.version;
        this.updater.releaseNotes = arg.releaseNotes || "";
      }

      if (
        (status === "update-not-available" || status === "update-downloaded") &&
        "updateInfo" in arg
      ) {
        this.updater.path = `https://github.com/WeakAuras/WeakAuras-Companion/releases/download/v${arg.updateInfo.version}/${arg.updateInfo.path}`;
        this.updater.version = arg.updateInfo.version;

        // List if `updater.fullChangelog` is set to `true`, `string` otherwise.
        if (typeof arg.updateInfo.releaseNotes === "string") {
          this.updater.releaseNotes = arg.updateInfo.releaseNotes;
        } else if (Array.isArray(arg.updateInfo.releaseNotes)) {
          // Convert the array of ReleaseNoteInfo to a string
          this.updater.releaseNotes = arg.updateInfo.releaseNotes
            .map((note) => note.note)
            .join("\n");
        } else {
          this.updater.releaseNotes = "";
        }

        console.log(JSON.stringify(arg));
      }

      if (status === "error" && "error" in arg) {
        console.error(arg.error);
      }
    });

    // set default wow path
    if (!this.config.wowpath.validated) {
      try {
        const wowpath = await wowDefaultPath();
        this.defaultWOWPath = wowpath;

        if (!this.config.wowpath.validated) {
          this.config.wowpath.value = wowpath;

          validateWowPath(
            this.config,
            this.versionOptions,
            this.accountOptions,
            this.versionSelected,
            this.auras,
          );
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
    setTimeout(this.doCompareSVwithWago, 300);

    // check for app updates in 2 hours
    setTimeout(this.checkCompanionUpdates, 1000 * 3600 * 2);

    // default sorting
    this.sortDescending = false;
    this.sortedColumn = "update";
  },
  methods: {
    getGotOptions() {
      return {
        http2: true,
        headers: {
          "Identifier": this.accountHash,
          "api-key": this.config.wagoApiKey || "",
          "User-Agent": `WeakAuras Companion ${__APP_VERSION__}`,
        },
        timeout: {
          request: 30000,
        },
      };
    },
    readyForInstallFlush() {
      this.stash.$reset();
    },
    async checkCompanionUpdates() {
      try {
        await ipcRenderer.invoke("checkUpdates", this.config.beta);
      } catch (error) {
        console.error("Error checking updates:", error);
      }

      // check for app updates in 2 hours
      if (this.updater.scheduleId) clearTimeout(this.updater.scheduleId);

      this.updater.scheduleId = setTimeout(
        () => {
          this.checkCompanionUpdates().catch((error) =>
            console.error("Error checking updates:", error),
          );
        },
        1000 * 3600 * 2,
      );
    },
    getWeakAurasSaved() {
      return WeakAurasSaved(
        this.config,
        this.versionSelected,
        this.accountSelected,
      );
    },
    getPlaterSaved() {
      return PlaterSaved(
        this.config,
        this.versionSelected,
        this.accountSelected,
      );
    },
    getIsAddonInstalled(addon: string) {
      return isAddonInstalled(
        this.config,
        addon,
        this.versionSelected,
        this.accountSelected,
      );
    },
    getAddonConfig(addonName: string) {
      const lowerAddonName = addonName.toLowerCase();

      for (const addonConfig of this.allAddonConfigs) {
        if (addonConfig.addonName.toLowerCase() === lowerAddonName) {
          return addonConfig;
        }
      }
      return null;
    },
    reset() {
      this.config.$reset();
    },
    doWriteAddonData() {
      return writeAddonData(
        this.config,
        this.addonsInstalled,
        this.aurasWithData,
        this.stash,
      );
    },
    async doCompareSVwithWago() {
      return compareSVwithWago(
        this.config,
        this.versionSelected,
        this.accountSelected,
        this.fetching,
        this.addonsInstalled,
        this.addonSelected,
        this.auras,
        this.updateFetchingState,
        this.doWriteAddonData,
      );
    },
    installUpdates() {
      ipcRenderer.invoke("installUpdates");
    },
    sortBy(columnName: string) {
      if (this.sortedColumn === columnName) {
        if (this.sortDescending) {
          this.sortDescending = false;
          this.sortedColumn = "modified";
        } else {
          this.sortDescending = true;
        }
      } else {
        this.sortDescending = false;
        this.sortedColumn = columnName;
      }
    },
    updateFetchingState(fetching: boolean) {
      this.fetching = fetching;
    },
  },
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
    <Report v-if="reportIsShown" />
    <UpdatedAuraList v-if="updateAuraIsShown" />
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
