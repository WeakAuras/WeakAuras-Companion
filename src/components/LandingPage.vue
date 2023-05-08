<template>
  <div id="wrapper">
    <div class="main-container" :class="{ blurred: reportIsShown || updateAuraIsShown }">
      <TitleBar />
      <header>
        <div class="app-logo">
          <img src="../../src/assets/weakauras.png" class="logo-img" />
          <span>{{ $t("app.main.companion" /* Companion */) }}</span>
        </div>
        <div class="menu-btns">
          <UIButton type="menu" :class="{ active: configStep === 0 }" @click="configStep = 0"
            :title="$t('app.menu.main')">
            <span class="material-icons">sync</span>
          </UIButton>
          <UIButton type="menu" :class="{ active: configStep === 4 }" @click="configStep = 4"
            :title="$t('app.footer.stopmotion')">
            <span class="material-icons">movie</span>
          </UIButton>
          <UIButton type="menu" :class="{ active: configStep === 1 }" @click="configStep = 1"
            :title="$t('app.menu.settings')">
            <span class="material-icons">settings</span>
          </UIButton>
          <UIButton type="menu" :class="{ active: configStep === 2 }" @click="configStep = 2"
            :title="$t('app.menu.help')">
            <span class="material-icons">help</span>
          </UIButton>
          <UIButton type="menu" :class="{ active: configStep === 3 }" @click="configStep = 3"
            :title="$t('app.menu.about')">
            <span class="material-icons">info</span>
          </UIButton>
        </div>
      </header>
      <main>
        <template v-if="configStep === 0">
          <div id="selectors">
            <div v-if="config.wowpath.valided && config.wowpath.versions" id="version-selector">
              <Dropdown v-model:value="config.wowpath.version" :options="versionOptions"
                :label="$t('app.wowpath.version' /* Version */)" @change="compareSVwithWago()" />
            </div>
            <div v-if="config.wowpath.valided && versionSelected" id="account-selector">
              <Dropdown v-model:value="versionSelected.account" :options="accountOptions"
                :label="$t('app.wowpath.account' /* Account */)" @change="compareSVwithWago()" />
            </div>
          </div>
          <div v-if="allAddonConfigs.length > 1" id="addonbttns">
            <label :key="addonSelected" class="btn-label">
              {{ $t("app.main.addons" /* Addons */) }}
            </label>
            <span style="margin-left: 5px" />
            <UIButton v-for="(addon, index) in allAddonConfigs" :key="index" type="addon"
              :class="{ active: addonSelected === addon.addonName }" :disabled="!addon.isInstalled"
              @click="addonSelected = addon.addonName">
              {{ addon.addonName }}
            </UIButton>
          </div>
          <div id="dashboard">
            <RefreshButton :is-settings-ok="config.wowpath.valided" :is-version-selected="versionSelected"
              :is-account-selected="accountSelected" :is-sv-ok="WeakAurasSaved() || PlaterSaved()" :fetching="fetching"
              :last-update="accountSelected && accountSelected.lastWagoUpdate" :auras-shown="aurasSortedForView.length">
            </RefreshButton>
            <br />
            <template v-if="aurasSortedForView.length > 0 && !fetching">
              <AuraHeaders :sorted-column="sortedColumn" :sort-descending="sortDescending"
                :addon-selected-config="addonSelectedConfig" @sort-by="sortBy" />
              <div id="aura-list">
                <Aura v-for="aura in aurasSortedForView" :key="aura.slug" :aura="aura" />
              </div>
            </template>
          </div>
        </template>
        <Config v-else-if="configStep === 1" :default-w-o-w-path="defaultWOWPath" />
        <Help v-else-if="configStep === 2" />
        <About v-else-if="configStep === 3" />
        <StopMotion v-else-if="configStep === 4" :wowVersions="versionOptions" />
      </main>
      <footer>
        <a class="getweakauras" href="https://www.curseforge.com/wow/addons/weakauras-2" target="_blank">
          <img src="/social-icons/curse.svg" class="logo" title="CurseForge" />
          {{ $t("app.footer.getweakauras" /* Get WeakAuras! */) }}
        </a>
        <a class="browsewago" href="https://wago.io/weakauras" target="_blank">
          <img src="/social-icons/wago.svg" class="logo" title="Wago" />
          {{ $t("app.footer.browsewago" /* Browse Wago for more auras! */) }}
        </a>
        <a class="reportbug" @click="toggleReport">
          {{ $t("app.footer.reportbug" /* Found a bug? */) }}
          <img src="/social-icons/bug_report.svg" class="logo invert" title="Bug" />
        </a>
        <div class="ready-to-install" v-if="stash.auras.length > 0" @click="toggleUpdatedAuraList()">
          <span>
            {{ $t("app.footer.readytoinstall" /* Ready To Install */) }}
            ({{ stash.auras.length }})
          </span>
          <i v-tooltip="{
            strategy: 'fixed',
            theme: 'info-tooltip',
            html: true,
            content: `${this.$t('app.main.readyForInstall' /* Ready for Install */)}${readyForInstallTooltip}`,
          }" class="material-icons update-available update-auras">
            download
          </i>
        </div>
        <div class="app-update">
          <a :href="updater.path" target="_blank" v-if="updater.status === 'update-available'">
            <i v-if="updater.status === 'update-available'" v-tooltip="{
              strategy: 'fixed',
              theme: 'info-tooltip',
              html: true,
              content: `${this.$t('app.main.installUpdate' /* Install client update */)}: v${updater.version} ${updater.releaseNotes}`,
            }" class="material-icons update-available">
              system_update_alt
            </i>
          </a>
          <i v-if="updater.status === 'update-downloaded'" v-tooltip="{
            strategy: 'fixed',
            theme: 'info-tooltip',
            content: `${this.$t('app.main.installUpdate' /* Install client update */)}: v${updater.version}`,
          }" class="material-icons update-available" @click="installUpdates">
            system_update_alt
          </i>
          <div v-if="updater.status === 'checking-for-update'" class="updating">
            <i class="material-icons icon">sync</i>
          </div>
          <div v-if="updater.status === 'download-progress'" class="updating">
            <span class="progress">{{ updater.progress }}%</span>
            <i class="material-icons icon">sync</i>
          </div>
        </div>
      </footer>
    </div>
    <Report v-if="reportIsShown" />
    <UpdatedAuraList v-if="updateAuraIsShown" />
  </div>
</template>

<script lang="js">
import backupIfRequired from "@/libs/backup";
import * as medias from "@/libs/contacts";
import hash from "@/libs/hash";
import sanitize from "@/libs/sanitize";
import {
createSortByAuthor, createSortByString, createSortByTime, createSortByType, createSortByUpdate
} from "@/libs/sort";
import { toc } from "@/libs/toc";
import userDataPath from "@/libs/user-data-folder";
import { matchFolderNameInsensitive, wowDefaultPath } from "@/libs/utilities";
import { ipcRenderer } from "electron";
import luaparse from "luaparse";
import fs from "fs";
import path from "path";
import { defineComponent, reactive } from "vue";
import { useStashStore } from "../stores/auras";
import { useConfigStore } from "../stores/config";
import About from "./UI/About.vue";
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
  },
  data() {
    return {
      configStep: 0,
      addonSelected: "WeakAuras",
      reportIsShown: false,
      updateAuraIsShown: false,
      fetching: false, // use for avoid spamming refresh UIButton and show spinner
      sortedColumn: "modified",
      sortDescending: false,
      schedule: {
        id: null, // 1h setTimeout id
      },
      medias,
      updater: {
        status: null, // checking-for-update, update-available, update-not-available, error, download-progress, update-downloaded
        progress: null,
        scheduleId: null, // for 2h auto-updater
        version: null,
        path: null,
        releaseNotes: null,
      },
      isMac: process.platform === "darwin",
      accountOptions: [],
      versionOptions: [],
      defaultWOWPath: "",
    };
  },
  setup() {
    const config = useConfigStore();
    const stash = useStashStore();
    return {
      config,
      stash,
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
    footerMedias() {
      if (this.medias && this.medias.weakauras) {
        return this.medias.weakauras.filter((media) => media.footer);
      }
      return [];
    },
    allAddonConfigs() {
      const addonConfigs = [
        {
          addonName: "WeakAuras",
          wagoAPI: "https://data.wago.io/api/check/",
          addonDependency: "WeakAuras",
          svPathFunction: this.WeakAurasSaved,
          isInstalled: this.IsAddonInstalled("WeakAuras"),
          parseFunction: this.parseWeakAurasSVdata,
          hasTypeColumn: false,
        },
        {
          addonName: "Plater",
          wagoAPI: "https://data.wago.io/api/check/",
          addonDependency: "Plater",
          svPathFunction: this.PlaterSaved,
          isInstalled: this.IsAddonInstalled("Plater"),
          parseFunction: this.parsePlaterSVdata,
          hasTypeColumn: true,
        },
      ];
      return addonConfigs;
    },
    addonsInstalled() {
      return this.allAddonConfigs.filter(
        (addonConfig) => addonConfig.isInstalled
      );
    },
    addonSelectedConfig() {
      if (!this.addonSelected) return null;
      return this.allAddonConfigs.find(
        (addonConfig) =>
          addonConfig.addonName.toLowerCase() ===
          this.addonSelected.toLowerCase()
      );
    },
    versionSelected() {
      return (
        this.config.wowpath.version &&
        this.config.wowpath.versions &&
        this.config.wowpath.versions.find(
          (version) => version.name === this.config.wowpath.version
        )
      );
    },
    accountSelected() {
      return (
        this.versionSelected &&
        this.versionSelected.accounts.find(
          (account) => account.name === this.versionSelected.account
        )
      );
    },
    aurasWithData() {
      return this.auras.filter(
        (aura) =>
          !!aura.encoded &&
          !(
            this.config.ignoreOwnAuras &&
            aura.author === this.config.wagoUsername
          )
      );
    },
    aurasWithUpdate() {
      return this.aurasWithData.filter(
        (aura) => aura.wagoVersion > aura.version && !aura.ignoreWagoUpdate
      );
    },
    aurasSortedForView() {
      return this.auras
        .filter(
          (aura) => !(this.config.ignoreOwnAuras && aura.author === this.config.wagoUsername)
        )
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
      get() {
        return (
          (this.config.wowpath.valided &&
            this.config.wowpath.version &&
            this.accountSelected &&
            this.accountSelected.auras) ||
          []
        );
      },
      set(newValue) {
        this.accountSelected.auras = newValue;
      },
    },
  },
  watch: {
    "stash.auras": {
      handler() {
        this.writeAddonData();
      },
      deep: true,
    },
    // eslint-disable-next-line func-names
    "config.wowpath.value": function () {
      this.validateWowpath();
    },
    "config.wowpath.version": function () {
      this.buildAccountList();
    },
  },
  async mounted() {
    ipcRenderer.on("setAllowPrerelease", (_event, allowPrerelease) => {
      this.config.beta = allowPrerelease;
    });

    // refresh on event (tray icon)
    ipcRenderer.on("refreshWago", () => {
      this.compareSVwithWago();
    });

    ipcRenderer.on("linkHandler", (_event, link) => {
      const pattern = /weakauras-companion:\/\/wago\/push\/([^/]+)/;

      if (link) {
        const result = link.match(pattern);
        let slug;

        if (result) ({ 1: slug } = result);

        if (slug) {
          this.wagoPushHandler(slug);
        }
      }
    });

    ipcRenderer.on("updaterHandler", (_event, status, arg) => {
      console.log(`updaterHandler: ${status}`);

      if (status === "checkForUpdates") {
        this.updater.version = arg.updateInfo.version;
        return;
      }
      this.updater.status = status;

      if (status === "download-progress") {
        this.updater.progress = Math.floor(arg.percent);
      }

      if (status === "update-available") {
        this.updater.path = `https://github.com/WeakAuras/WeakAuras-Companion/releases/download/v${arg.version}/${arg.path}`;
        this.updater.releaseNotes = arg.releaseNotes || "";
        console.log(JSON.stringify(arg));
      }
    });

    // set default wow path
    if (!this.config.wowpath.valided) {
      try {
        let wowpath = await wowDefaultPath();
        this.defaultWOWPath = wowpath;

        if (!this.config.wowpath.valided) {
          this.config.wowpath.value = wowpath;
          this.validateWowpath();
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
    setTimeout(this.compareSVwithWago, 3);

    // check for app updates in 2 hours
    setTimeout(this.checkCompanionUpdates, 1000 * 3600 * 2);
  },
  methods: {
    readyForInstallFlush() {
      this.stash.$reset();
    },
    checkCompanionUpdates() {
      ipcRenderer.invoke("checkUpdates", this.config.beta);

      // check for app updates in 2 hours
      if (this.updater.scheduleId) clearTimeout(this.updater.scheduleId);

      this.updater.scheduleId = setTimeout(
        this.checkCompanionUpdates,
        1000 * 3600 * 2
      );
    },
    setFirstAddonInstalledSelected() {
      if (this.addonsInstalled.length === 0) {
        return this.addonSelected;
      }

      this.addonSelected = this.addonsInstalled[0].addonName;
      return this.addonSelected;
    },
    WeakAurasSaved(version, account) {
      let WeakAurasSavedVariable;

      if (version !== undefined && account !== undefined) {
        WeakAurasSavedVariable = path.join(
          this.config.wowpath.value,
          version,
          "WTF",
          "Account",
          account,
          "SavedVariables",
          "WeakAuras.lua"
        );
      } else if (this.versionSelected && this.accountSelected) {
        WeakAurasSavedVariable = path.join(
          this.config.wowpath.value,
          this.config.wowpath.version,
          "WTF",
          "Account",
          this.versionSelected.account,
          "SavedVariables",
          "WeakAuras.lua"
        );
      }

      if (WeakAurasSavedVariable) {
        try {
          fs.accessSync(WeakAurasSavedVariable, fs.constants.F_OK);
          return WeakAurasSavedVariable;
        } catch (e) {
          console.log(`Error testing WeakAuras SV access\n${JSON.stringify(e)}`);
          return false;
        }
      }
      return false;
    },
    PlaterSaved(version, account) {
      let PlaterSavedVariable;

      if (version && account) {
        PlaterSavedVariable = path.join(
          this.config.wowpath.value,
          version,
          "WTF",
          "Account",
          account,
          "SavedVariables",
          "Plater.lua"
        );
      } else if (this.versionSelected && this.accountSelected) {
        PlaterSavedVariable = path.join(
          this.config.wowpath.value,
          this.config.wowpath.version,
          "WTF",
          "Account",
          this.versionSelected.account,
          "SavedVariables",
          "Plater.lua"
        );
      }

      if (PlaterSavedVariable) {
        try {
          fs.accessSync(PlaterSavedVariable, fs.constants.F_OK);
          return PlaterSavedVariable;
        } catch (e) {
          console.log(`Error testing Plater SV access\n${JSON.stringify(e)}`);
          return false;
        }
      }
      return false;
    },
    IsAddonInstalled(addon, version, account) {
      const wowPath = this.config.wowpath.value;
      let addonFolder = "";

      if (version !== undefined && account !== undefined) {
        addonFolder = path.join(wowPath, version);
      } else if (this.versionSelected && this.accountSelected) {
        addonFolder = path.join(wowPath, this.config.wowpath.version);
      }

      if (addonFolder && addon) {
        const addonPath = ["Interface", "AddOns", addon];

        for (const check of addonPath) {
          const folder = matchFolderNameInsensitive(addonFolder, check, false);

          if (folder) {
            addonFolder = path.join(addonFolder, folder);
          } else {
            return false;
          }
        }
        return true;
      }

      return false;
    },
    getAddonConfig(addonName) {
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
    wagoPushHandler(slug) {
      if (this.stash.auras.findIndex((aura) => aura.slug === slug) === -1) {
        // Get data from Wago api
        this.$http
          .get("https://data.wago.io/api/check/", {
            params: {
              ids: slug,
            },
            headers: {
              Identifier: this.accountHash,
              "api-key": this.config.wagoApiKey || "",
            },
            crossdomain: true,
          })
          .then((response) => {
            // metadata received from Wago API
            response.data.forEach((wagoData) => {
              const aura = {
                slug: wagoData.slug,
                name: wagoData.name,
                author: wagoData.username,
                wagoVersion: wagoData.version,
                wagoSemver: wagoData.versionString,
                versionNote: wagoData.changelog,
                auraType:
                  wagoData.type === "WEAKAURA"
                    ? "WeakAuras"
                    : wagoData.type === "PLATER"
                    ? "Plater"
                    : undefined,
                wagoid: wagoData._id,
                source: "Wago",
              };

              this.$http
                .get("https://data.wago.io/api/raw/encoded", {
                  params: {
                    id: wagoData._id,
                  },
                  headers: {
                    Identifier: this.accountHash,
                    "api-key": this.config.wagoApiKey || "",
                  },
                  crossdomain: true,
                })
                .then((response2) => {
                  aura.encoded = response2.data;
                  this.stash.add(aura);
                })
                .catch((err2) => {
                  console.log(JSON.stringify(err2));
                });
            });
          })
          .catch((error) => {
            console.log(JSON.stringify(error));
          });
      }
    },
    parseWeakAurasSVdata(WeakAurasSavedData, config) {
      const aurasFromFile = [];

      if (WeakAurasSavedData.body[0].variables[0].name !== "WeakAurasSaved") {
        return [];
      }

      const pattern = /(https:\/\/wago.io\/)([^/]+)/;

      WeakAurasSavedData.body[0].init[0].fields.forEach((obj) => {
        if (obj.key.value === "displays") {
          obj.value.fields.forEach((obj2) => {
            let slug;
            let url;
            let version = 0;
            let semver;
            let ignoreWagoUpdate = false;
            let skipWagoUpdate = null;
            let id;
            let uid = null;

            obj2.value.fields.forEach((obj3) => {
              if (obj3.key === undefined) {
                return;
              }

              if (obj3.key.value === "id") {
                id = obj3.value.value;
              }

              if (obj3.key.value === "uid") {
                uid = obj3.value.value;
              }

              if (obj3.key.value === "version") {
                version = Number(obj3.value.value);
              }

              if (obj3.key.value === "semver") {
                semver = obj3.value.value;
              }

              if (obj3.key.value === "ignoreWagoUpdate") {
                ignoreWagoUpdate = obj3.value.value;
              }

              if (obj3.key.value === "skipWagoUpdate") {
                skipWagoUpdate = obj3.value.value;
              }

              if (obj3.key.value === "url") {
                url = obj3.value.value;
                const result = url.match(pattern);

                if (result) ({ 2: slug } = url.match(pattern));
              }
            });

            if (slug) {
              const foundAura = reactive({
                id,
                uid,
                slug,
                version,
                semver,
                ignoreWagoUpdate,
                skipWagoUpdate,
                wagoVersion: null,
                wagoSemver: null,
                changelog: null,
                created: null,
                modified: null,
                author: null,
                encoded: null,
                wagoid: null,
                ids: [id],
                uids: uid ? [uid] : [],
                regionType: null,
                auraType: config.addonName,
                auraTypeDisplay: null,
                addonConfig: config,
              });

              aurasFromFile.push(foundAura);
            }
          });
        }
      });

      return aurasFromFile;
    },
    parsePlaterSVdata(PlaterSavedData, config) {
      const aurasFromFile = [];

      if (PlaterSavedData.body[0].variables[0].name !== "PlaterDB") {
        return;
      }

      const pattern = /(https:\/\/wago.io\/)([^/]+)/;

      PlaterSavedData.body[0].init[0].fields.forEach((obj) => {
        if (obj.key.value === "profiles") {
          obj.value.fields.forEach((profile) => {
            let profslug;
            let profurl;
            let profversion = 0;
            let profsemver;
            let profignoreWagoUpdate = false;
            let profskipWagoUpdate = null;
            let profid;

            profile.value.fields.forEach((profData) => {
              if (profData.key === undefined) {
                return;
              }

              if (profData.key.value === "Name") {
                profid = profData.value.value;
              }

              if (profData.key.value === "version") {
                profversion = Number(profData.value.value);
              }

              if (profData.key.value === "semver") {
                profsemver = profData.value.value;
              }

              if (profData.key.value === "ignoreWagoUpdate") {
                profignoreWagoUpdate = profData.value.value;
              }

              if (profData.key.value === "skipWagoUpdate") {
                profskipWagoUpdate = profData.value.value;
              }

              if (profData.key.value === "url") {
                profurl = profData.value.value;
                const result = profurl.match(pattern);

                if (result) ({ 2: profslug } = profurl.match(pattern));
              }

              if (
                profData.key.value === "script_data" ||
                profData.key.value === "hook_data"
              ) {
                let typeSuffix =
                  (profData.key.value === "hook_data" && "-Mod") ||
                  (profData.key.value === "script_data" && "-Script") ||
                  "";

                profData.value.fields.forEach((obj2) => {
                  let slug;
                  let url;
                  let version = 0;
                  let semver;
                  let ignoreWagoUpdate = false;
                  let skipWagoUpdate = null;
                  let id;

                  obj2.value.fields.forEach((obj3) => {
                    if (obj3.key.value === "Name") {
                      id = obj3.value.value;
                    }

                    if (obj3.key.value === "version") {
                      version = Number(obj3.value.value);
                    }

                    if (obj3.key.value === "semver") {
                      semver = obj3.value.value;
                    }

                    if (obj3.key.value === "ignoreWagoUpdate") {
                      ignoreWagoUpdate = obj3.value.value;
                    }

                    if (obj3.key.value === "skipWagoUpdate") {
                      skipWagoUpdate = obj3.value.value;
                    }

                    if (obj3.key.value === "url") {
                      url = obj3.value.value;
                      const result = url.match(pattern);

                      if (result) ({ 2: slug } = url.match(pattern));
                    }
                  });

                  if (slug) {
                    const foundAura = reactive({
                      id,
                      slug,
                      version,
                      semver,
                      ignoreWagoUpdate,
                      skipWagoUpdate,
                      wagoVersion: null,
                      wagoSemver: null,
                      changelog: null,
                      created: null,
                      modified: null,
                      author: null,
                      encoded: null,
                      wagoid: null,
                      ids: [id],
                      uids: [],
                      regionType: null,
                      auraType: config.addonName,
                      auraTypeDisplay: config.addonName + typeSuffix,
                      addonConfig: config,
                    });

                    aurasFromFile.push(foundAura);
                  }
                });
              }
            });

            if (profslug) {
              const foundAura = reactive({
                id: profid,
                slug: profslug,
                version: profversion,
                semver: profsemver,
                ignoreWagoUpdate: profignoreWagoUpdate,
                skipWagoUpdate: profskipWagoUpdate,
                wagoVersion: null,
                wagoSemver: null,
                changelog: null,
                created: null,
                modified: null,
                author: null,
                encoded: null,
                wagoid: null,
                ids: [profid],
                uids: [],
                regionType: null,
                auraType: config.addonName,
                auraTypeDisplay: config.addonName + "-Profile",
                addonConfig: config,
              });

              aurasFromFile.push(foundAura);
            }
          });
        }
      });

      return aurasFromFile;
    },
    async compareSVwithWago() {
      if (!this.versionSelected || !this.accountSelected) return;

      const addonConfigs = this.addonsInstalled;

      if (this.fetching) return; // prevent spamming UIButton
      this.fetching = true; // show animation

      if (this.schedule.id) clearTimeout(this.schedule.id); // cancel next 1h schedule

      let fileAuraData = [];

      for (const conf of addonConfigs) {
        if (!conf.svPathFunction) continue;
        const svPath = conf.svPathFunction();

        if (typeof svPath !== "string") continue;

        try {
          const data = fs.readFileSync(svPath, "utf-8");
          // Parse saved data .lua
          const savedData = luaparse.parse(data, {
            comments: false,
            scope: true,
            locations: true,
            luaVersion: "5.1",
            encodingMode: "pseudo-latin1",
          });

          fileAuraData = [
            ...fileAuraData,
            ...conf.parseFunction(savedData, conf),
          ];
        } catch (err) {
          console.log(`Error reading file ${svPath}`);
          console.log(JSON.stringify(err));
          continue;
        }
      }

      // clean up auras
      const slugs = new Array(fileAuraData.length);

      for (const foundAura of fileAuraData) {
        const slug = foundAura.slug;

        const existingAura = this.auras.find((aura) => aura.slug === slug);

        if (!existingAura) {
          // new "slug" found, add it to the list of auras
          this.auras.push(foundAura);
        } else {
          const innerIndex = this.auras.findIndex((aura) => aura.slug === slug);

          if (innerIndex !== -1)
            // there is already an aura with the same "slug"
          if (typeof existingAura.ids === "undefined") {
            existingAura.ids = [];
          }

          if (typeof existingAura.uids === "undefined") {
            existingAura.uids = [];
          }

          if (typeof existingAura.regionType === "undefined") {
            existingAura.regionType = null;
          }

          // add aura id to "ids" if necessary
          if (existingAura.ids.indexOf(foundAura.id) === -1) {
            existingAura.ids.push(foundAura.id);
          }

          // add aura uid to "uids" if necessary
          if (foundAura.uid && existingAura.uids.indexOf(foundAura.uid) === -1) {
            existingAura.uids.push(foundAura.uid);
          }
          // update ignore flags
          existingAura.ignoreWagoUpdate = foundAura.ignoreWagoUpdate;
          existingAura.skipWagoUpdate = foundAura.skipWagoUpdate;

          // update version
          existingAura.version = foundAura.version;
          existingAura.semver = foundAura.semver;

          // wipe encoded if ignored (force re-fetching it on unignore)
          if (foundAura.ignoreWagoUpdate) existingAura.encoded = null;

          // ensure config
          existingAura.auraType = foundAura.auraType;
          existingAura.auraTypeDisplay = foundAura.auraTypeDisplay;
          existingAura.addonConfig = foundAura.addonConfig;
        }

        if (!slugs.includes(slug)) slugs.push(slug);
      }

      // remove orphans
      this.auras = this.auras.filter((aura) => slugs.includes(aura.slug));

      // Get each encoded string
      const promisesWagoCallsComplete = [];
      const promisesWagoDataCallsComplete = [];
      let allAurasFetched = [];
      const received = [];

      addonConfigs.forEach((config) => {
        // Make a list of unique auras to fetch
        const fetchAuras = this.auras
          .filter(
            (aura) =>
              !(
                this.config.ignoreOwnAuras &&
                !!aura.author &&
                aura.author === this.config.wagoUsername
              ) && aura.addonConfig.addonName === config.addonName
          )
          .map((aura) => aura.slug);

        // Test if list is empty
        if (fetchAuras.length === 0) {
          return;
        }

        allAurasFetched = [...allAurasFetched, ...fetchAuras];

        // Get data from Wago api
        promisesWagoCallsComplete.push(
          this.$http
            .get(config.wagoAPI, {
              params: {
                // !! size of request is not checked, can lead to too long urls
                ids: fetchAuras.join(),
              },
              headers: {
                Identifier: this.accountHash,
                "api-key": this.config.wagoApiKey || "",
              },
              crossdomain: true,
            })
            .then((response) => {
              // metadata received from Wago API
              response.data.forEach((wagoData) => {
                received.push(wagoData.slug);
                // eslint-disable-next-line no-underscore-dangle
                received.push(wagoData._id);

                this.auras.forEach((aura, index) => {
                  // eslint-disable-next-line no-underscore-dangle
                  if (
                    aura.slug === wagoData.slug ||
                    aura.slug === wagoData._id
                  ) {
                    this.auras[index].name = wagoData.name;
                    this.auras[index].author = wagoData.username;
                    this.auras[index].created = new Date(wagoData.created);
                    this.auras[index].wagoSemver = wagoData.versionString;
                    this.auras[index].changelog = wagoData.changelog;
                    this.auras[index].modified = new Date(wagoData.modified);
                    this.auras[index].regionType = wagoData.regionType;
                    // eslint-disable-next-line no-underscore-dangle
                    this.auras[index].wagoid = wagoData._id;
                    this.auras[index].source = "Wago";

                    //aura.encoded = null;

                    // Check if encoded string needs to be fetched
                    if (
                      !aura.ignoreWagoUpdate &&
                      wagoData.version > aura.version &&
                      (aura.wagoVersion === null ||
                        wagoData.version > aura.wagoVersion) &&
                      !(
                        this.config.ignoreOwnAuras &&
                        wagoData.username === this.config.wagoUsername
                      )
                    ) {
                      promisesWagoDataCallsComplete.push(
                        this.$http.get("https://data.wago.io/api/raw/encoded", {
                          params: {
                            // eslint-disable-next-line no-underscore-dangle
                            id: wagoData._id,
                          },
                          headers: {
                            Identifier: this.accountHash,
                            "api-key": this.config.wagoApiKey || "",
                          },
                          crossdomain: true,
                        })
                      );
                    }
                    this.auras[index].wagoVersion = wagoData.version;
                  }
                });
              });
            })
            .catch((error) => {
              console.log(JSON.stringify(error));
              this.fetching = false;

              // schedule in 30mn on error
              if (this.schedule.id) clearTimeout(this.schedule.id);

              this.schedule.id = setTimeout(
                this.compareSVwithWago,
                1000 * 60 * 30
              );
            })
        );
      });

      if (promisesWagoCallsComplete.length === 0) {
        //no data for any addon available. nothing to update.
        try {
          this.writeAddonData();
        } finally {
          this.fetching = false;

          this.setFirstAddonInstalledSelected();

          this.accountSelected.lastWagoUpdate = new Date();

          if (this.schedule.id) clearTimeout(this.schedule.id);

          this.schedule.id = setTimeout(this.compareSVwithWago, 1000 * 60 * 60);
        }
        return;
      }

      // those promises are already resolved in line 1395
      // they should not throw an error except maybe for external error like timeout
      Promise.all(promisesWagoCallsComplete)
        .then(() => {
          console.log("promisesWagoCallsComplete");

          // Test if list is empty after resolving wagoCalls
          if (allAurasFetched.length === 0) {
            this.accountSelected.lastWagoUpdate = new Date();

            if (this.schedule.id) clearTimeout(this.schedule.id);

            this.schedule.id = setTimeout(
              this.compareSVwithWago,
              1000 * 60 * 60
            );
            return;
          }

          // catch response error before resolving them with Promise.all
          // by catching them before rejection, we don't exit Promise.all
          // with the first error
          const promisesResolved = promisesWagoDataCallsComplete.map(
            (promise) =>
              promise.catch((err2) => ({
                config: { params: { id: err2.config.params.id } },
                status: err2.response.status,
              }))
          );

          // resolving all wago encoded strings answers simultaneously
          Promise.all(promisesResolved)
            .then((wagoEncodedStrings) => {
              console.log("promisesWagoDataCallsComplete");

              wagoEncodedStrings.forEach((wagoResp) => {
                const { id } = wagoResp.config.params;

                if (wagoResp.status === 200) {
                  this.auras.forEach((aura, index) => {
                    if (aura.wagoid === id) {
                      this.auras[index].encoded = wagoResp.data;
                    }
                  });
                } else {
                  this.auras.forEach((aura, index) => {
                    if (aura.wagoid === id) {
                      // setting the version back to the aura version
                      // wont show update available
                      // todo create status update-failed?
                      this.auras[index].wagoVersion = aura.version;
                      console.log(`error ${wagoResp.status}`);
                    }
                  });
                }
              });
            })
            .catch((error) => {
              console.log(JSON.stringify(error));

              // schedule in 30mn on error
              if (this.schedule.id) clearTimeout(this.schedule.id);

              this.schedule.id = setTimeout(
                this.compareSVwithWago,
                1000 * 60 * 30
              );
            })
            .then(() => {
              allAurasFetched.forEach((toFetch) => {
                if (received.indexOf(toFetch) === -1) {
                  // no data received for this aura => remove from list
                  this.auras.forEach((aura, index) => {
                    if (aura && aura.slug === toFetch) {
                      console.log(`no data received for ${aura.slug}`);
                      this.auras.splice(index, 1);
                    }
                  });
                }
              });

              // we are done with wago API, update data.lua

              try {
                this.writeAddonData();
              } finally {
                this.fetching = false;

                this.setFirstAddonInstalledSelected();

                this.accountSelected.lastWagoUpdate = new Date();

                if (this.schedule.id) clearTimeout(this.schedule.id);

                this.schedule.id = setTimeout(
                  this.compareSVwithWago,
                  1000 * 60 * 60
                );
              }
            });
        })
        .catch((error) => {
          console.log(JSON.stringify(error));

          // schedule in 30mn on error
          if (this.schedule.id) clearTimeout(this.schedule.id);

          this.schedule.id = setTimeout(this.compareSVwithWago, 1000 * 60 * 30);
        });
    },
    toggleReport() {
      this.reportIsShown = !this.reportIsShown;
    },
    toggleUpdatedAuraList() {
      this.updateAuraIsShown = !this.updateAuraIsShown;
    },
    async writeAddonData() {
      console.log("writeAddonData");

      const addonConfigs = this.addonsInstalled;

      if (this.config.wowpath.valided && this.version !== "") {
        var AddonPath = ["Interface", "AddOns", "WeakAurasCompanion"];
        var AddonFolder = path.join(
          this.config.wowpath.value,
          this.config.wowpath.version
        );

        while (AddonPath.length) {
          var check = AddonPath.shift();
          var folder = matchFolderNameInsensitive(
            AddonFolder,
            check,
            AddonPath.length === 0
          );

          if (folder) {
            AddonFolder = path.join(AddonFolder, folder);
          } else {
            throw new Error("errorCantCreateAddon");
          }
        }
        // Make data.lua
        let LuaOutput = "-- file generated automatically\n";
        LuaOutput += "WeakAurasCompanionData = {\n";
        let addonDepts = "";
        const fields = [
          "name",
          "author",
          "encoded",
          "wagoVersion",
          "wagoSemver",
          "source",
          // "logo" -- keep that for a future WeakAuras release
        ];

        addonConfigs.forEach((config) => {
          addonDepts += config.addonName + ",";

          let spacing = "";

          LuaOutput += `  ${config.addonName} = {\n`;
          spacing = "  ";

          let LuaSlugs = spacing + "  slugs = {\n";

          this.aurasWithData
            .filter((aura) => aura.auraType === config.addonName)
            .forEach((aura) => {
              LuaSlugs +=
                spacing + `    ["${aura.slug.replace(/"/g, '\\"')}"] = {\n`;

              fields.forEach((field) => {
                if (aura[field]) {
                  LuaSlugs +=
                    spacing + `      ${field} = [=[${aura[field]}]=],\n`;
                }
              });

              if (typeof aura.changelog !== "undefined") {
                if (typeof aura.changelog.text !== "undefined") {
                  let sanitized;

                  if (aura.changelog.format === "bbcode") {
                    sanitized = sanitize.bbcode(aura.changelog.text);
                  } else if (aura.changelog.format === "markdown") {
                    sanitized = sanitize.markdown(aura.changelog.text);
                  }

                  LuaSlugs +=
                    spacing + `      versionNote = [=[${sanitized}]=],\n`;
                }
              }

              LuaSlugs += spacing + "    },\n";
            });
          LuaOutput += LuaSlugs;
          LuaOutput += spacing + "  },\n";
          LuaOutput += spacing + "  stash = {\n";

          this.stash.auras
            .filter((aura) => aura.auraType === config.addonName)
            .forEach((aura) => {
              LuaOutput +=
                spacing + `    ["${aura.slug.replace(/"/g, '\\"')}"] = {\n`;

              fields.forEach((field) => {
                if (aura[field]) {
                  LuaOutput +=
                    spacing + `      ${field} = [=[${aura[field]}]=],\n`;
                }
              });

              if (typeof aura.changelog !== "undefined") {
                if (typeof aura.changelog.text !== "undefined") {
                  let sanitized;

                  if (aura.changelog.format === "bbcode") {
                    sanitized = sanitize.bbcode(aura.changelog.text);
                  } else if (aura.changelog.format === "markdown") {
                    sanitized = sanitize.markdown(aura.changelog.text);
                  }

                  LuaOutput +=
                    spacing + `      versionNote = [=[${sanitized}]=],\n`;
                }
              }

              LuaOutput += spacing + `      source = "${aura.source}",\n`;
              LuaOutput += spacing + "    },\n";
            });

          LuaOutput += spacing + "  },\n";

          if (config.addonName === "WeakAuras") {
            LuaOutput += spacing + "  stopmotionFiles = {\n";
            const stopmotionFilesPath = path.join(AddonFolder, "animations");

            if (fs.existsSync(stopmotionFilesPath)) {
              const regex = new RegExp(
                /^(.*?)(?: GIF)?\.x\d+y\d+f\d+w\d+h\d+W\d+H\d+\.tga$/
              );

              fs.readdirSync(stopmotionFilesPath)
                .filter((v) => v && v.match(regex))
                .map((v) => ({
                  filename: v,
                  title: v.match(regex)[1],
                }))
                .forEach((file) => {
                  LuaOutput +=
                    spacing +
                    `    [ [=[${file.filename}]=] ] = [=[${file.title}]=],\n`;
                });
            }

            LuaOutput += spacing + "  },\n";
          }
          LuaOutput += "  },\n";
        });

        LuaOutput += "}";

        /* if (this.stash.lenghth > 0) { LuaOutput += "" } */
        const tocVersion =
          AddonFolder.toLowerCase().search("classic") === -1
            ? toc.retail
            : AddonFolder.toLowerCase().search("era") === -1
            ? toc.wotlk
            : toc.som;
        const files = [
          {
            name: "WeakAurasCompanion.toc",
            data: `## Interface: ${tocVersion}
## Title: WeakAuras Companion
## Author: The WeakAuras Team
## Version: 4.1.0
## IconTexture: Interface\\AddOns\\WeakAuras\\Media\\Textures\\icon.blp
## Notes: Keep your WeakAuras updated!
## X-Category: Interface Enhancements
## DefaultState: Enabled
## LoadOnDemand: 0
## OptionalDeps: ${addonDepts}

data.lua
init.lua`,
          },
          {
            name: "WeakAurasCompanion-BCC.toc",
            data: `## Interface: ${tocVersion}
## Title: WeakAuras Companion
## Author: The WeakAuras Team
## Version: 4.1.0
## Notes: Keep your WeakAuras updated!
## X-Category: Interface Enhancements
## DefaultState: Enabled
## LoadOnDemand: 0
## OptionalDeps: ${addonDepts}

data.lua
init.lua`,
          },
          {
            name: "WeakAurasCompanion-Classic.toc",
            data: `## Interface: ${tocVersion}
## Title: WeakAuras Companion
## Author: The WeakAuras Team
## Version: 4.1.0
## Notes: Keep your WeakAuras updated!
## X-Category: Interface Enhancements
## DefaultState: Enabled
## LoadOnDemand: 0
## OptionalDeps: ${addonDepts}

data.lua
init.lua`,
          },
          {
            name: "WeakAurasCompanion-Mainline.toc",
            data: `## Interface: ${tocVersion}
## Title: WeakAuras Companion
## Author: The WeakAuras Team
## Version: 4.1.0
## IconTexture: Interface\\AddOns\\WeakAuras\\Media\\Textures\\icon.blp
## Notes: Keep your WeakAuras updated!
## X-Category: Interface Enhancements
## DefaultState: Enabled
## LoadOnDemand: 0
## OptionalDeps: ${addonDepts}

data.lua
init.lua`,
          },
          {
            name: "WeakAurasCompanion-Wrath.toc",
            data: `## Interface: ${tocVersion}
## Title: WeakAuras Companion
## Author: The WeakAuras Team
## Version: 4.1.0
## Notes: Keep your WeakAuras updated!
## X-Category: Interface Enhancements
## DefaultState: Enabled
## LoadOnDemand: 0
## OptionalDeps: ${addonDepts}

data.lua
init.lua`,
          },
          {
            name: "init.lua",
            data: `-- file generated automatically
local loadedFrame = CreateFrame("FRAME")
loadedFrame:RegisterEvent("ADDON_LOADED")
loadedFrame:SetScript("OnEvent", function(_, _, addonName)
  if addonName == "WeakAurasCompanion" then
    if WeakAuras and WeakAuras.AddCompanionData and WeakAurasCompanionData then
      local WeakAurasData = WeakAurasCompanionData.WeakAuras
      if WeakAurasData then
        WeakAuras.AddCompanionData(WeakAurasData)
        WeakAuras.StopMotion.texture_types["WeakAuras Companion"] = WeakAuras.StopMotion.texture_types["WeakAuras Companion"] or {}
        local CompanionTextures = WeakAuras.StopMotion.texture_types["WeakAuras Companion"]
        for fileName, name in pairs(WeakAurasData.stopmotionFiles) do
          CompanionTextures["Interface\\\\AddOns\\\\WeakAurasCompanion\\\\animations\\\\" .. fileName] = name
        end
      end
    end

    if Plater and Plater.AddCompanionData and WeakAurasCompanionData and WeakAurasCompanionData.Plater then
      Plater.AddCompanionData(WeakAurasCompanionData.Plater)
    end
  end
end)
`,
          },
          {
            name: "data.lua",
            data: LuaOutput,
          },
        ];

        files.forEach((file) => {
          let filepath = path.join(AddonFolder, file.name);

          fs.writeFile(filepath, file.data, (err2) => {
            if (err2) {
              throw new Error("errorFileSave");
            }
          });
        });
      }
      this.backup();
    },
    installUpdates() {
      ipcRenderer.invoke("installUpdates");
    },
    backup() {
      this.config.wowpath.versions.forEach((version) => {
        version.accounts.forEach((account) => {
          this.addonsInstalled.forEach((addon) => {
            let lastSavedFileSize = null;

            if (typeof account.savedvariableSizeForAddon === "undefined")
              this.account.savedvariableSizeForAddon = [];

            const savedData = account.savedvariableSizeForAddon.find(
              (savedAddon) => savedAddon.addonName === addon.addonName
            );

            if (savedData) {
              lastSavedFileSize = savedData.fileSize;
            }

            backupIfRequired(
              addon.svPathFunction(version.name, account.name),
              this.config.backup,
              lastSavedFileSize,
              `${version.name}#${account.name}`,
              (fileSize) => {
                if (savedData) {
                  savedData.fileSize = fileSize;
                } else {
                  account.savedvariableSizeForAddon.push({
                    fileSize: fileSize,
                    addonName: addon.addonName,
                  });
                }
              },
              addon.addonName
            );
          });
        });
      });
    },
    validateWowpath() {
      console.log("validateWowpath");
      this.config.wowpath.valided = false;

      if (this.config.wowpath.value) {
        const wowpath = this.config.wowpath.value;
        const DataFolder = path.join(wowpath, "Data");

        // test if ${wowpath}\Data exists
        try {
          fs.accessSync(DataFolder, fs.constants.F_OK);
          var files = fs.readdirSync(wowpath);
          let validated = false;

          files
            .filter(
              (versionDir) =>
                versionDir.match(/^_.*_$/) &&
                fs.statSync(path.join(wowpath, versionDir)).isDirectory()
            )
            .forEach((versionDir) => {
              if (!validated) {
                const accountFolder = path.join(
                  wowpath,
                  versionDir,
                  "WTF",
                  "Account"
                );

                if (fs.existsSync(accountFolder)) {
                  try {
                    fs.accessSync(accountFolder, fs.constants.F_OK);
                    validated = true;
                    this.config.wowpath.valided = true;
                    this.buildVersionList();
                    this.buildAccountList();
                  } catch (err) {
                    console.error("No Read access");
                  }
                }
              }
            });
        } catch (err) {
          console.log(`Error: ${err}`);
        }
      }
    },
    buildVersionList() {
      console.log("buildVersionList");
      // reset version & account lists
      this.versionOptions.splice(0, this.versionOptions.length);
      this.accountOptions.splice(0, this.accountOptions.length);
      const versionLabels = [
        {
          value: "_retail_",
          text: this.$t("app.version.df" /* Dragonflight */),
        },
        {
          value: "_ptr_",
          text: this.$t("app.version.dfptr" /* Dragonflight PTR */),
        },
        {
          value: "_beta_",
          text: this.$t("app.version.dfbeta" /* Dragonflight Beta */),
        },
        {
          value: "_classic_",
          text: this.$t("app.version.classicwotlk" /* WOTLK Classic */),
        },
        {
          value: "_classic_ptr_",
          text: this.$t("app.version.classicwotlkptr" /* WOTLK Classic PTR */),
        },
        {
          value: "_classic_beta_",
          text: this.$t("app.version.classicwotlkbeta" /* WOTLK Classic Beta */),
        },
        {
          value: "_classic_era_",
          text: this.$t("app.version.classicera" /* Classic Era */),
        },
        {
          value: "_classic_era_ptr_",
          text: this.$t("app.version.dfptr2" /* Dragonflight PTR 2 */),
        },
      ];

      if (this.config.wowpath.valided) {
        const wowpath = this.config.wowpath.value;

        try {
          const files = fs.readdirSync(wowpath);

          files
            .filter(
              (versionDir) =>
                versionDir.match(/^_.*_$/) &&
                fs.statSync(path.join(wowpath, versionDir)).isDirectory()
            )
            .forEach((versionDir) => {
              const accountFolder = path.join(
                wowpath,
                versionDir,
                "WTF",
                "Account"
              );

              if (fs.existsSync(accountFolder)) {
                const versionFound = this.config.wowpath.versions.find(
                  (version) => version.name === versionDir
                );

                if (!versionFound) {
                  // make version if not found in data
                  this.config.wowpath.versions.push({
                    name: versionDir,
                    accounts: [],
                    account: "",
                  });
                }

                const label = versionLabels.find(
                  (versionLabel) => versionLabel.value === versionDir
                );

                this.versionOptions.push({
                  value: versionDir,
                  text: (label && label.text) || versionDir,
                });
              }
            });
        } catch (err) {
          console.log(`Error: ${err}`);
        }
      }
    },
    buildAccountList() {
      console.log("buildAccountList");
      this.accountOptions.splice(0, this.accountOptions.length);

      if (this.config.wowpath.valided && this.versionSelected) {
        const versionName = this.versionSelected.name;
        const accountFolder = path.join(
          this.config.wowpath.value,
          versionName,
          "WTF",
          "Account"
        );

        if (fs.existsSync(accountFolder)) {
          try {
            const files = fs.readdirSync(accountFolder);

            files
              .filter(
                (accountFile) =>
                  accountFile !== "SavedVariables" &&
                  fs
                    .statSync(path.join(accountFolder, accountFile))
                    .isDirectory()
              )
              .forEach((accountFile) => {
                const accountFound = this.versionSelected.accounts.find(
                  (account) => account.name === accountFile
                );

                if (!accountFound) {
                  // make account if not found in data
                  this.versionSelected.accounts.push({
                    name: accountFile,
                    lastWagoUpdate: null,
                    auras: [],
                    savedvariableSizeForAddon: [],
                  });
                } else if (
                  typeof accountFound.savedvariableSizeForAddon === "undefined"
                )
                  this.accountFound.savedvariableSizeForAddon = [];

                this.accountOptions.push({
                  value: accountFile,
                  text: accountFile,
                });
              });
          } catch (err) {
            console.log(`Error: ${err}`);
          }
        }
      }
    },
    sortBy(columnName) {
      if (this.sortedColumn == columnName) {
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
  },
});
</script>

<style lang="scss">
@import "../assets/fonts/fonts.scss";
@import "../assets/css/tooltip.scss";
@import "../assets/css/globals.scss";
@import "../assets/css/common.scss";

$iconDefaultColor: #51ae42;

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
  transition: background-color 0.2s ease-in-out, border-bottom 0.2s ease-in-out, font-size 0.2s ease-in-out;
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
  z-index: 999;
  text-align: left;
  height: 65px;
}

.btn-label {
  display: block;
  margin-bottom: 5px;
  margin-left: 1px;
  cursor: default;
  color: #eeeeee;
  font-size: 15px;
  font-family: Montserrat, sans-serif;
  font-weight: 500;
}

/* WoW Version & Account selection */
#selectors {
  position: absolute;
  top: 20px;
  right: 20px;

  option,
  select {
    background: #191919;
    color: #e6e6e6;
    margin: 0 5px;
    border-radius: 6px;
    width: 120px;

    &:focus {
      outline: none;
    }
  }
}

#version-selector {
  position: absolute;
  top: 0px;
  right: 10px;
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

  & span {
    cursor: pointer;
    opacity: 0.8;
    margin-right: 5px;
  }
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

// Update Icon
.app-update {
  // color: #777;
  float: right;
  margin-right: 15px;
  height: 25px;
  position: relative;
  bottom: 2px;

  .updating {
    display: inline;

    .icon {
      animation: spin;
      animation-duration: 3000ms;
      animation-iteration-count: infinite;
      animation-timing-function: linear;
      animation-fill-mode: forwards;
    }

    .progress {
      font-size: 14px;
      font-weight: 500;
      margin: auto;
      vertical-align: middle;
      position: relative;
      bottom: 7px;
    }
  }
}

.update-available {
  animation: pulse 2s infinite;
  cursor: pointer;
  color: $iconDefaultColor;

  &.update-auras {
    --pulse-color: rgba(102, 255, 0, 1);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(-360deg);
  }
}

@keyframes pulse {
  0% {
    text-shadow: 0 0 0 var(--pulse-color, rgba(255, 255, 255, 0.4));
  }

  70% {
    text-shadow: 0 0 40px var(--pulse-color, rgba(238, 255, 4, 0));
  }

  100% {
    text-shadow: 0 0 0 var(--pulse-color, rgba(255, 255, 255, 0));
  }
}
</style>
