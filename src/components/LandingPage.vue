<template>
  <div id="wrapper">
    <div class="main-container" :class="{ blurred: reportIsShown }">
      <TitleBar></TitleBar>
      <header>
        <div class="app-logo">
          <img :src="require(`@/assets/weakauras.png`)" class="logo-img" />
          <span>{{ $t("app.main.companion" /* Companion */) }}</span>
        </div>
        <div class="menu-btns">
          <Button
            type="menu"
            :class="{ active: configStep === 0 }"
            @click="configStep = 0"
            >{{ $t("app.menu.main" /* Main */) }}</Button
          >
          <Button
            type="menu"
            :class="{ active: configStep === 1 }"
            @click="configStep = 1"
            >{{ $t("app.menu.settings" /* Settings */) }}</Button
          >
          <Button
            type="menu"
            :class="{ active: configStep === 2 }"
            @click="configStep = 2"
            >{{ $t("app.menu.help" /* Help */) }}</Button
          >
          <Button
            type="menu"
            :class="{ active: configStep === 3 }"
            @click="configStep = 3"
            >{{ $t("app.menu.about" /* About */) }}</Button
          >
        </div>
      </header>
      <main>
        <template v-if="configStep === 0">
          <div id="selectors">
            <div
              v-if="config.wowpath.valided && config.wowpath.versions"
              id="version-selector"
            >
              <Dropdown
                v-model="config.wowpath.version"
                :options="versionOptions"
                :label="$t('app.wowpath.version' /* Version */)"
                @change="compareSVwithWago()"
              >
              </Dropdown>
            </div>
            <div
              v-if="config.wowpath.valided && versionSelected"
              id="account-selector"
            >
              <Dropdown
                v-model="versionSelected.account"
                :options="accountOptions"
                :label="$t('app.wowpath.account' /* Account */)"
                @change="compareSVwithWago()"
              >
              </Dropdown>
            </div>
          </div>
          <div v-if="allAddonConfigs.length > 1" id="addonbttns">
            <label :key="addonSelected" class="btn-label">
              {{ $t("app.main.addons" /* Addons */) }}
            </label>
            <span style="margin-left: 5px" />
            <Button
              v-for="(addon, index) in allAddonConfigs"
              :key="index"
              type="addon"
              :class="{ active: addonSelected === addon.addonName }"
              :disabled="!addon.isInstalled"
              @click="addonSelected = addon.addonName"
            >
              {{ addon.addonName }}
            </Button>
          </div>
          <div id="dashboard">
            <RefreshButton
              :is-settings-ok="config.wowpath.valided"
              :is-version-selected="versionSelected"
              :is-account-selected="accountSelected"
              :is-sv-ok="WeakAurasSaved() || PlaterSaved()"
              :fetching="fetching"
              :last-update="accountSelected && accountSelected.lastWagoUpdate"
              :auras-shown="aurasSortedForView.length"
            ></RefreshButton>
            <br />
            <template v-if="aurasSortedForView.length > 0">
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
                  :show-all-auras="config.showAllAuras"
                ></Aura>
              </div>
            </template>
          </div>
        </template>
        <Config
          v-else-if="configStep === 1"
          :config="config"
          :default-w-o-w-path="defaultWOWPath"
        ></Config>
        <Help v-else-if="configStep === 2"></Help>
        <About v-else-if="configStep === 3"></About>
      </main>
      <footer>
        <a
          class="getweakauras"
          href="https://www.curseforge.com/wow/addons/weakauras-2"
          target="_blank"
        >
          <img
            :src="require(`@/assets/social-icons/curse.svg`)"
            class="logo"
            title="CurseForge"
          />
          {{ $t("app.footer.getweakauras" /* Get WeakAuras! */) }}
        </a>
        <a class="browsewago" href="https://wago.io/weakauras" target="_blank">
          <img
            :src="require(`@/assets/social-icons/wago.svg`)"
            class="logo"
            title="Wago"
          />
          {{ $t("app.footer.browsewago" /* Browse Wago for more auras! */) }}
        </a>
        <a class="reportbug" @click="toggleReport">
          {{ $t("app.footer.reportbug" /* Found a bug? */) }}
          <img
            :src="require(`@/assets/social-icons/bug_report.svg`)"
            class="logo invert"
            title="Bug"
          />
        </a>
        <div class="app-update">
          <i
            v-if="updater.status === 'update-available'"
            v-tooltip="
              `${this.$t(
                'app.main.installUpdate' /* Install client update */
              )}: v${updater.version} ${updater.releaseNotes}`
            "
            class="material-icons update-available"
            @click="open(`${updater.path}`)"
            >system_update_alt
          </i>
          <i
            v-if="updater.status === 'update-downloaded'"
            v-tooltip="
              `${this.$t(
                'app.main.installUpdate' /* Install client update */
              )}: v${updater.version}`
            "
            class="material-icons update-available"
            @click="installUpdates"
            >system_update_alt
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
    <Report v-if="reportIsShown"></Report>
    <Stash v-if="stash.length > 0" :stash="stash"></Stash>
  </div>
</template>

<script>
import Vue from "vue";
import path from "path";
import VTooltip from "v-tooltip";
import backupIfRequired from "./libs/backup";
import {
  isOpen as isWOWOpen,
  afterReload as afterWOWReload,
  afterRestart as afterWOWRestart,
} from "./libs/wowstat";
import {
  createSortByTime,
  createSortByString,
  createSortByUpdate,
  createSortByAuthor,
  createSortByType,
} from "./libs/sort";
import { wowDefaultPath, matchFolderNameInsensitive } from "./libs/utilities";
import Button from "./UI/Button.vue";
import RefreshButton from "./UI/RefreshButton.vue";
import AuraHeaders from "./UI/AuraHeaders.vue";
import Aura from "./UI/Aura.vue";
import Config from "./UI/Config.vue";
import About from "./UI/About.vue";
import Help from "./UI/Help.vue";
import TitleBar from "./UI/TitleBar.vue";
import Report from "./UI/Report.vue";
import Stash from "./UI/Stash.vue";
import Dropdown from "./UI/Dropdown.vue";

const userDataPath = require("electron").remote.app.getPath("userData");
const fs = require("fs");
const luaparse = require("luaparse");
const Store = require("electron-store");
const hash = require("./libs/hash.js");
const medias = require("./libs/contacts.js");
const sanitize = require("./libs/sanitize.js");

Vue.use(VTooltip);
const store = new Store();
luaparse.defaultOptions.comments = false;
luaparse.defaultOptions.scope = true;

const internalVersion = 3;

const defaultValues = () => {
  return {
    configStep: 0,
    addonSelected: "WeakAuras",
    reportIsShown: false,
    fetching: false, // use for avoid spamming refresh button and show spinner
    sortedColumn: "modified",
    sortDescending: false,
    config: {
      // everything in this object will be auto-save and restore
      wowpath: {
        value: "",
        versions: [],
        version: "",
        valided: false,
      },
      wagoUsername: null, // ignore your own auras
      wagoApiKey: null,
      ignoreOwnAuras: true,
      autostart: false,
      startminimize: false,
      notify: false,
      lang: "en",
      showAllAuras: false,
      autoupdate: false,
      beta: null,
      internalVersion,
      backup: {
        active: true,
        path: path.join(userDataPath, "WeakAurasData-Backup"),
        maxsize: 100,
        defaultBackupPath: path.join(userDataPath, "WeakAurasData-Backup"),
      },
    },
    schedule: {
      id: null, // 1h setTimeout id
    },
    medias,
    stash: [], // list of auras pushed from wago to wow with "SEND TO WEAKAURAS COMPANION APP" button
    reloadToast: null,
    updateToast: null,
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
};

export default Vue.extend({
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
    Stash,
    Button,
    Dropdown,
  },
  data() {
    return defaultValues();
  },
  computed: {
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
          wagoAPI: "https://data.wago.io/api/check/weakauras",
          dataIndex: null,
          addonDependency: "WeakAuras",
          svPathFunction: this.WeakAurasSaved,
          isInstalled: this.IsWeakAurasInstalled(),
          parseFunction: this.parseWeakAurasSVdata,
          hasTypeColumn: false,
        },
        {
          addonName: "Plater",
          wagoAPI: "https://data.wago.io/api/check/plater",
          dataIndex: "Plater",
          addonDependency: "Plater",
          svPathFunction: this.PlaterSaved,
          isInstalled: this.IsPlaterInstalled(),
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
          (!!aura.topLevel || aura.regionType !== "group") &&
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
      const auras = this.config.showAllAuras
        ? this.aurasWithData
        : this.aurasWithUpdate;
      return auras
        .filter((aura) => aura.auraType === this.addonSelected)
        .sort(this.sortFunction);
    },
    sortFunction() {
      const dir = this.sortDescending ? -1 : 1;
      const showAllAuras = this.config.showAllAuras;
      const hasTypeColumn =
        this.addonSelectedConfig && this.addonSelectedConfig.hasTypeColumn;

      if (!this.sortedColumn || this.sortedColumn === "modified")
        return createSortByTime(dir);
      else if (this.sortedColumn === "auraTypeDisplay") {
        return createSortByType(dir);
      } else if (this.sortedColumn === "update") {
        return createSortByUpdate(dir, showAllAuras, hasTypeColumn);
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
        this.$set(this.accountSelected, "auras", newValue);
      },
    },
  },
  watch: {
    config: {
      handler() {
        store.set("config", this.config);
      },
      deep: true,
    },
    stash: {
      handler() {
        if (this.stash.length === 1) {
          if (!this.reloadToast) {
            this.reloadToast = this.message(
              this.$t(
                "app.main.needreloadstash" /* Reload World of Warcraft's UI to receive pushed auras */
              ),
              "info",
              {
                duration: null,
                onComplete: () => {
                  this.reloadToast = null;
                },
                action: [
                  {
                    text: this.$t("app.main.cancel" /* Cancel */),
                    onClick: () => {
                      while (this.stash.length > 0) {
                        this.stash.pop();
                      }
                    },
                  },
                ],
              }
            );

            afterWOWReload(
              this.config.wowpath.value,
              this.config.wowpath.version,
              () => {
                while (this.stash.length > 0) {
                  this.stash.pop();
                }
              }
            );
          }
        }

        if (this.stash.length === 0) {
          if (this.reloadToast) {
            this.reloadToast.goAway(0);
            this.reloadToast = null;
          }
        }
        this.writeAddonData(null, null, true);
      },
      deep: true,
    },
    // eslint-disable-next-line func-names
    "config.wowpath.version": function () {
      this.buildAccountList();
    },
  },
  mounted() {
    this.$electron.ipcRenderer.on(
      "setAllowPrerelease",
      (event, allowPrerelease) => {
        this.$set(this.config, "beta", allowPrerelease);
      }
    );

    // refresh on event (tray icon)
    this.$electron.ipcRenderer.on("refreshWago", () => {
      this.compareSVwithWago();
    });

    this.$electron.ipcRenderer.on("linkHandler", (event, link) => {
      const pattern = /weakauras-companion:\/\/wago\/push\/([^/]+)\/([^/]+)/;

      if (link) {
        const result = link.match(pattern);
        let slug;
        let addon;

        if (result) ({ 1: addon, 2: slug } = result);

        if (slug && addon) {
          this.wagoPushHandler(slug, addon);
        }
      }
    });

    this.$electron.ipcRenderer.on("updaterHandler", (event, status, arg) => {
      console.log(`updaterHandler: ${status}`);

      if (status === "checkForUpdates") {
        this.updater.version = arg.updateInfo.version;
        return;
      }
      this.updater.status = status;

      if (status === "download-progress") {
        this.updater.progress = Math.floor(arg.percent);
      }

      if (status === "update-available" && !this.updateToast) {
        this.updater.path = `https://github.com/WeakAuras/WeakAuras-Companion/releases/download/v${arg.version}/${arg.path}`;
        this.updater.releaseNotes = arg.releaseNotes || "";
        console.log(JSON.stringify(arg));

        // show download toast
        this.updateToast = this.message(
          this.$t("app.main.updatefound" /* Companion Update available */),
          null,
          {
            className: "update",
            duration: null,
            onComplete: () => {
              this.updateToast = null;
            },
          }
        );
      }

      if (status === "error") {
        this.message(
          [this.$t("app.main.updateerror" /* Error in updater */), arg.code],
          null,
          {
            className: "update update-error",
            duration: null,
          }
        );
      }

      if (status === "update-downloaded") {
        if (!this.updateToast) {
          this.updateToast = this.message(
            this.$t("app.main.updatedownload" /* Client update downloaded */),
            null,
            {
              className: "update",
              duration: null,
              onComplete: () => {
                this.updateToast = null;
              },
              action: [
                {
                  text: this.$t("app.main.install" /* Install */),
                  onClick: (e, toastObject) => {
                    this.$electron.ipcRenderer.send("installUpdates");
                    toastObject.goAway(0);
                  },
                },
                {
                  text: this.$t("app.main.later" /* Later */),
                  onClick: (e, toastObject) => {
                    toastObject.goAway(0);
                  },
                },
              ],
            }
          );
        }
      }
    });
    // load config
    this.restore();

    // set default wow path
    if (!this.config.wowpath.valided) {
      wowDefaultPath().then((value) => {
        this.defaultWOWPath = value;

        if (!this.config.wowpath.valided) {
          this.config.wowpath.value = value;
          this.validateWowpath();
        }
      });
    } else {
      this.validateWowpath();
    }
    // create default backup folder
    fs.mkdir(path.join(userDataPath, "WeakAurasData-Backup"), () => {});

    // check updates
    this.compareSVwithWago();

    // check for app updates in 2 hours
    setTimeout(this.checkCompanionUpdates, 1000 * 3600 * 2);
  },
  methods: {
    checkCompanionUpdates() {
      this.$electron.ipcRenderer.send("checkUpdates", this.config.beta);

      // check for app updates in 2 hours
      if (this.updater.scheduleId) clearTimeout(this.updater.scheduleId);

      this.updater.scheduleId = setTimeout(
        this.checkCompanionUpdates,
        1000 * 3600 * 2
      );
    },
    setFirstAddonInstalledSelected() {
      for (let i = 0; i < this.addonsInstalled.length; i++) {
        this.addonSelected = this.addonsInstalled[i].addonName;
        return this.addonSelected;
      }
      return this.addonSelected;
    },
    WeakAurasSaved(version, account) {
      let WeakAurasSavedVariable;

      if (version && account) {
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
          return false;
        }
      }
      return false;
    },
    async IsWeakAurasInstalled(version, account) {
      let AddonFolder;

      if (version && account) {
        AddonFolder = path.join(this.config.wowpath.value, version);
      } else if (this.versionSelected && this.accountSelected) {
        AddonFolder = path.join(
          this.config.wowpath.value,
          this.config.wowpath.version
        );
      }

      if (AddonFolder) {
        var AddonPath = ["Interface", "AddOns", "WeakAuras"];

        while (AddonPath.length) {
          var check = AddonPath.shift();
          var folder = await matchFolderNameInsensitive(
            AddonFolder,
            check,
            AddonPath.length === 0
          );

          if (folder) {
            AddonFolder = path.join(AddonFolder, folder);
          } else {
            return false;
          }
        }
        return true;
      }
      return false;
    },
    async IsPlaterInstalled(version, account) {
      let AddonFolder;

      if (version && account) {
        AddonFolder = path.join(this.config.wowpath.value, version);
      } else if (this.versionSelected && this.accountSelected) {
        AddonFolder = path.join(
          this.config.wowpath.value,
          this.config.wowpath.version
        );
      }

      if (AddonFolder) {
        var AddonPath = ["Interface", "AddOns", "Plater"];

        while (AddonPath.length) {
          var check = AddonPath.shift();
          var folder = await matchFolderNameInsensitive(
            AddonFolder,
            check,
            AddonPath.length === 0
          );

          if (folder) {
            AddonFolder = path.join(AddonFolder, folder);
          } else {
            return false;
          }
        }
        return true;
      }
      return false;
    },
    getAddonConfig(addonName) {
      for (let index = 0; index < this.allAddonConfigs.length; index++) {
        if (
          this.allAddonConfigs[index].addonName.toLowerCase() ===
          addonName.toLowerCase()
        ) {
          return this.allAddonConfigs[index];
        }
      }
      return null;
    },
    reset() {
      store.clear();
      const { beta } = this.config;
      const { config } = defaultValues();
      this.config = config;
      this.config.beta = beta;

      wowDefaultPath().then((value) => {
        this.config.wowpath.value = value;
        this.validateWowpath();
      });

      this.message(
        this.$t(
          "app.main.settingswiped" /* Companion's settings have been reset! */
        ),
        "info"
      );
    },
    open(link) {
      this.$electron.shell.openExternal(link);
    },
    restore() {
      const tmp = store.get("config");

      if (tmp) {
        this.config = tmp;
        this.$i18n.locale = this.config.lang;

        const previousVersion = store.get("config").internalVersion || 0;

        if (!this.config.backup) {
          console.log("add backup settings");
          const { config: backup } = defaultValues();
          this.$set(this.config, "backup", backup);
        }

        if (!this.config.wowpath.versions) {
          this.$set(this.config.wowpath, "versions", []);
        }

        if (this.config.internalVersion < internalVersion) {
          /* migration */
          if (previousVersion < 3) {
            console.log("migration < 3");
            this.config.wowpath.value = "";
            this.config.wowpath.valided = false;
            this.config.account = null;

            wowDefaultPath().then((value) => {
              this.config.wowpath.value = value;
            });
          }
          this.config.internalVersion = internalVersion;
        }
      }
    },
    message(text, type, overrideOptions = {}) {
      const options = {
        theme: "toasted-primary",
        position: "bottom-right",
        duration: 8000,
        action: {
          text: this.$t("app.main.close" /* Close */),
          onClick: (e, toastObject) => {
            toastObject.goAway(0);
          },
        },
      };

      Object.keys(overrideOptions).forEach((key) => {
        options[key] = overrideOptions[key];
      });
      let msg;

      if (typeof text === "object") {
        const div = document.createElement("div");
        div.className = "msg";
        div.innerHTML += text[0];

        for (let i = 1; i < text.length; i += 1) {
          const line = document.createElement("span");
          line.className = "small-text";
          line.innerHTML += text[i];
          div.appendChild(line);
        }

        options.className = options.className
          ? `${options.className} multiline`
          : "multiline";
        msg = div;
      } else {
        msg = text;
      }

      if (type === "info") return this.$toasted.info(msg, options);

      if (type === "error") return this.$toasted.error(msg, options);
      return this.$toasted.show(msg, options);
    },
    wagoPushHandler(slug, addon) {
      if (this.stash.findIndex((aura) => aura.slug === slug) === -1 && addon) {
        const addonConf = this.getAddonConfig(addon);

        if (addonConf) {
          // Get data from Wago api
          this.$http
            .get(addonConf.wagoAPI, {
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
                  auraType: addonConf.addonName,
                };

                this.$http
                  .get("https://data.wago.io/api/raw/encoded", {
                    params: {
                      id: slug,
                    },
                    headers: {
                      Identifier: this.accountHash,
                      "api-key": this.config.wagoApiKey || "",
                    },
                    crossdomain: true,
                  })
                  .then((response2) => {
                    aura.encoded = response2.data;
                    this.stash.push(aura);
                  })
                  .catch((err2) => {
                    this.message(
                      [
                        this.$t(
                          "app.main.stringReceiveError-1",
                          {
                            aura: aura.name,
                          } /* Error receiving encoded string for {aura} */
                        ),
                        this.$t(
                          "app.main.stringReceiveError-2",
                          {
                            status: err2.response.status,
                          } /* http code: {status} */
                        ),
                      ],
                      "error"
                    );
                    console.log(JSON.stringify(err2));
                  });
              });
            })
            .catch((error) => {
              this.message(
                [
                  this.$t(
                    "app.main.errorWagoAnswer" /* Can't read Wago answer */
                  ),
                  error,
                ],
                "error"
              );
              console.log(JSON.stringify(error));
            });
        }
      }
    },
    parseWeakAurasSVdata(WeakAurasSavedData, config) {
      const aurasFromFile = [];

      if (WeakAurasSavedData.body[0].variables[0].name !== "WeakAurasSaved") {
        this.message(
          this.$t(
            "app.main.errorSavedvariable" /* Error while reading WeakAuras.lua */
          ),
          "error"
        );
        //this.fetching = false;
        return [];
      }

      // Set all auras topLevel = null to avoid bugs after user move his auras
      this.auras
        .filter((aura) => aura.auraType === config.addonName)
        .forEach((aura, index) => {
          this.auras[index].topLevel = null;
        });

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
            let topLevel = true;

            obj2.value.fields.forEach((obj3) => {
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

              if (obj3.key.value === "parent") {
                topLevel = false;
              }
            });

            if (slug) {
              const foundAura = {
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
                topLevel: topLevel ? id : null,
                uids: uid ? [uid] : [],
                regionType: null,
                auraType: config.addonName,
                auraTypeDisplay: null,
                addonConfig: config,
              };

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
        this.message(
          this.$t(
            "app.main.errorSavedvariablePlater" /* Error while reading Plater.lua */
          ),
          "error"
        );
        //this.fetching = false;
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
                    const foundAura = {
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
                      topLevel: true,
                      uids: [],
                      regionType: null,
                      auraType: config.addonName,
                      auraTypeDisplay: config.addonName + typeSuffix,
                      addonConfig: config,
                    };

                    aurasFromFile.push(foundAura);
                  }
                });
              }
            });

            if (profslug) {
              const foundAura = {
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
                topLevel: true,
                uids: [],
                regionType: null,
                auraType: config.addonName,
                auraTypeDisplay: config.addonName + "-Profile",
                addonConfig: config,
              };

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

      if (this.fetching) return; // prevent spamming button
      this.fetching = true; // show animation

      if (this.schedule.id) clearTimeout(this.schedule.id); // cancel next 1h schedule

      let fileAuraData = [];

      for (let index = 0; index < addonConfigs.length; index++) {
        let conf = addonConfigs[index];

        if (!conf.svPathFunction) {
          continue;
        }
        const svPath = conf.svPathFunction();

        if (typeof svPath !== "string") {
          continue;
        }

        try {
          const data = fs.readFileSync(svPath, "utf-8");
          // Parse saved data .lua
          const savedData = luaparse.parse(data);

          fileAuraData = [
            ...fileAuraData,
            ...conf.parseFunction(savedData, conf),
          ];
        } catch (err) {
          this.message(
            `An error ocurred reading file: ${err.message}`,
            "error"
          );
          console.log(JSON.stringify(err));
          //console.log(err.message);
          continue;
        }
      }

      // clean up auras
      const slugs = [];

      for (let index = 0; index < fileAuraData.length; index++) {
        const foundAura = fileAuraData[index];
        const slug = fileAuraData[index].slug;

        const { length } = this.auras.filter((aura) => aura.slug === slug);

        if (length === 0) {
          // new "slug" found, add it to the list of auras
          this.auras.push(foundAura);
        } else {
          // there is already an aura with same "slug"
          this.auras.forEach((aura, index) => {
            if (aura.slug === slug) {
              if (typeof aura.ids === "undefined") {
                this.auras[index].ids = [];
              }

              if (typeof aura.uids === "undefined") {
                this.auras[index].uids = [];
              }

              if (typeof aura.regionType === "undefined") {
                this.auras[index].regionType = null;
              }

              if (foundAura.topLevel) this.auras[index].topLevel = foundAura.id;

              // add aura id to "ids" if necessary
              if (aura.ids.indexOf(foundAura.id) === -1) {
                this.auras[index].ids.push(foundAura.id);
              }

              // add aura uid to "uids" if necessary
              if (foundAura.uid && aura.uids.indexOf(foundAura.uid) === -1) {
                this.auras[index].uids.push(foundAura.uid);
              }
              // update ignore flags
              this.auras[index].ignoreWagoUpdate = foundAura.ignoreWagoUpdate;
              this.auras[index].skipWagoUpdate = foundAura.skipWagoUpdate;

              // update version
              this.auras[index].version = foundAura.version;
              this.auras[index].semver = foundAura.semver;

              // wipe encoded if ignored (force re-fetching it on unignore)
              if (foundAura.ignoreWagoUpdate) this.auras[index].encoded = null;

              //ensure config
              this.auras[index].auraType = foundAura.auraType;
              this.auras[index].auraTypeDisplay = foundAura.auraTypeDisplay;
              this.auras[index].addonConfig = foundAura.addonConfig;
            }
          });
        }

        if (slugs.indexOf(slug) === -1) slugs.push(slug);
      }

      // remove orphans
      for (let index = this.auras.length - 1; index > -1; index -= 1) {
        if (slugs.indexOf(this.auras[index].slug) === -1) {
          console.log(`remove orphan ${this.auras[index].slug}`);
          this.auras.splice(index, 1);
        }
      }

      // Get each encoded string
      const news = [];
      const fails = [];

      const promisesWagoCallsComplete = [];
      const promisesWagoDataCallsComplete = [];
      let allAurasFetched = [];
      const received = [];

      addonConfigs.forEach((config, index) => {
        // Make a list of uniqe auras to fetch
        const fetchAuras = this.auras
          .filter(
            (aura) =>
              !(
                this.config.ignoreOwnAuras &&
                !!aura.author &&
                aura.author === this.config.wagoUsername
              ) && aura.addonConfig === config
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

                    //aura.encoded = null;

                    // Check if encoded string needs to be fetched
                    if (
                      !aura.ignoreWagoUpdate &&
                      (aura.topLevel || aura.regionType !== "group") &&
                      (aura.encoded === null ||
                        (wagoData.version > aura.version &&
                          !!aura.wagoVersion &&
                          wagoData.version > aura.wagoVersion)) &&
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
              this.message(
                [
                  this.$t(
                    "app.main.errorWagoAnswer" /* Can't read Wago answer */
                  ),
                  error,
                ],
                "error"
              );
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
          this.writeAddonData(news, fails);
        } finally {
          this.fetching = false;

          this.setFirstAddonInstalledSelected();

          this.$set(this.accountSelected, "lastWagoUpdate", new Date());

          if (this.schedule.id) clearTimeout(this.schedule.id);

          this.schedule.id = setTimeout(this.compareSVwithWago, 1000 * 60 * 60);
        }
        return;
      }

      Promise.all(promisesWagoCallsComplete).then(() => {
        console.log("promisesWagoCallsComplete");

        Promise.all(promisesWagoDataCallsComplete)
          .then(() => {
            console.log("promisesWagoDataCallsComplete");

            // Test if list is empty
            if (allAurasFetched.length === 0) {
              this.message(
                this.$t("app.main.nothingToFetch" /* No updates available */)
              );

              this.$set(this.accountSelected, "lastWagoUpdate", new Date());

              if (this.schedule.id) clearTimeout(this.schedule.id);

              this.schedule.id = setTimeout(
                this.compareSVwithWago,
                1000 * 60 * 60
              );
              return;
            }

            // catch response error
            const promisesResolved = promisesWagoDataCallsComplete.map(
              (promise) =>
                promise.catch((err2) => ({
                  config: { params: { id: err2.config.params.id } },
                  status: err2.response.status,
                }))
            );

            this.$http
              .all(promisesResolved)
              .then(
                this.$http.spread((...args) => {
                  args.forEach((arg) => {
                    const { id } = arg.config.params;

                    if (arg.status === 200) {
                      this.auras.forEach((aura, index) => {
                        if (aura.wagoid === id) {
                          news.push(aura.name);
                          this.auras[index].encoded = arg.data;
                        }
                      });
                    } else {
                      this.auras.forEach((aura) => {
                        if (aura.wagoid === id) {
                          this.message(
                            [
                              this.$t(
                                "app.main.stringReceiveError-1",
                                {
                                  aura: aura.name,
                                } /* Error receiving encoded string for {aura} */
                              ),
                              this.$t(
                                "app.main.stringReceiveError-2",
                                {
                                  status: arg.status,
                                } /* http code: {status} */
                              ),
                            ],
                            "error"
                          );
                          fails.push(aura.name);
                        }
                      });
                    }
                  });
                })
              )
              .catch((error) => {
                this.message(
                  [
                    this.$t(
                      "app.main.errorWagoAnswer" /* Can't read Wago answer */
                    ),
                    error,
                  ],
                  "error"
                );
                console.log(JSON.stringify(error));

                // schedule in 30mn on error
                if (this.schedule.id) clearTimeout(this.schedule.id);

                this.schedule.id = setTimeout(
                  this.compareSVwithWago,
                  1000 * 60 * 30
                );
              })
              .then(() => {
                //console.log(allAurasFetched);
                //console.log(received);
                // console.log(`allAurasFetched: ${JSON.stringify(allAurasFetched)}`);
                // console.log(`received: ${JSON.stringify(received)}`);
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
                  this.writeAddonData(news, fails);
                } finally {
                  this.fetching = false;

                  this.setFirstAddonInstalledSelected();

                  this.$set(this.accountSelected, "lastWagoUpdate", new Date());

                  if (this.schedule.id) clearTimeout(this.schedule.id);

                  this.schedule.id = setTimeout(
                    this.compareSVwithWago,
                    1000 * 60 * 60
                  );
                }
              });
          })
          .catch((error) => {
            this.message(
              [
                this.$t(
                  "app.main.errorWagoAnswer" /* Can't read Wago answer */
                ),
                error,
              ],
              "error"
            );
            console.log(JSON.stringify(error));

            // schedule in 30mn on error
            if (this.schedule.id) clearTimeout(this.schedule.id);

            this.schedule.id = setTimeout(
              this.compareSVwithWago,
              1000 * 60 * 30
            );
          });
      });
    },
    toggleReport() {
      this.reportIsShown = !this.reportIsShown;
    },
    async writeAddonData(news, fails, noNotification) {
      let newInstall = false;

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
          var folder = await matchFolderNameInsensitive(
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
        LuaOutput += "WeakAurasCompanion = {\n";
        let addonDepts = "";
        const fields = [
          "name",
          "author",
          "encoded",
          "wagoVersion",
          "wagoSemver",
        ];

        addonConfigs.forEach((config) => {
          addonDepts += config.addonName + ",";

          let spacing = "";

          if (config.dataIndex) {
            LuaOutput += `  ${config.dataIndex} = {\n`;
            spacing = "  ";
          }

          let LuaSlugs = spacing + "  slugs = {\n";
          let LuaUids = spacing + "  uids = {\n";
          let LuaIds = spacing + "  ids = {\n";

          this.aurasWithData
            .filter((aura) => aura.auraType === config.addonName)
            .forEach((aura) => {
              LuaSlugs +=
                spacing + `    ["${aura.slug.replace(/"/g, '\\"')}"] = {\n`;

              fields.forEach((field) => {
                LuaSlugs +=
                  spacing + `      ${field} = [=[${aura[field]}]=],\n`;
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

              if (aura.uids && aura.ids) {
                aura.uids.forEach((uid) => {
                  if (uid) {
                    LuaUids +=
                      spacing +
                      `    ["${uid.replace(/"/g, '\\"')}"] = [=[${
                        aura.slug
                      }]=],\n`;
                  }
                });

                aura.ids.forEach((id) => {
                  if (id) {
                    LuaIds +=
                      spacing +
                      `    ["${id
                        .replace(/\\/g, "\\\\")
                        .replace(/"/g, '\\"')}"] = [=[${aura.slug}]=],\n`;
                  }
                });
              }
              LuaSlugs += spacing + "    },\n";
            });
          LuaOutput += LuaSlugs;
          LuaOutput += spacing + "  },\n";
          LuaOutput += LuaUids;
          LuaOutput += spacing + "  },\n";
          LuaOutput += LuaIds;
          LuaOutput += spacing + "  },\n";
          LuaOutput += spacing + "  stash = {\n";

          this.stash
            .filter((aura) => aura.auraType === config.addonName)
            .forEach((aura) => {
              LuaOutput +=
                spacing + `    ["${aura.slug.replace(/"/g, '\\"')}"] = {\n`;

              fields.forEach((field) => {
                LuaOutput +=
                  spacing + `      ${field} = [=[${aura[field]}]=],\n`;
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
              LuaOutput += spacing + "    },\n";
            });
          LuaOutput += spacing + "  },\n";

          if (config.dataIndex) {
            LuaOutput += "  },\n";
          }
        });
        LuaOutput += "}";

        /* if (this.stash.lenghth > 0) { LuaOutput += "" } */
        const toc =
          AddonFolder.toLowerCase().search("classic") === -1
            ? "90001"
            : "11305";
        const files = [
          {
            name: "WeakAurasCompanion.toc",
            data: `## Interface: ${toc}
## Title: WeakAuras Companion
## Author: The WeakAuras Team
## Version: 1.1.0
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
local buildTimeTarget = 20190123023201
local waBuildTime = tonumber(WeakAuras and WeakAuras.buildTime or 0)

if waBuildTime and waBuildTime > buildTimeTarget then
  local loadedFrame = CreateFrame("FRAME")
  loadedFrame:RegisterEvent("ADDON_LOADED")
  loadedFrame:SetScript("OnEvent", function(_, _, addonName)
    if addonName == "WeakAurasCompanion" then
      local count = WeakAuras.CountWagoUpdates()
      if count and count > 0 then
        WeakAuras.prettyPrint(WeakAuras.L["There are %i updates to your auras ready to be installed!"]:format(count))
      end
      if WeakAuras.ImportHistory then
        for id, data in pairs(WeakAurasSaved.displays) do
          if data.uid and not WeakAurasSaved.history[data.uid] then
            local slug = WeakAurasCompanion.uids[data.uid]
            if slug then
              local wagoData = WeakAurasCompanion.slugs[slug]
              if wagoData and wagoData.encoded then
                WeakAuras.ImportHistory(wagoData.encoded)
              end
            end
          end
        end
      end
      if WeakAurasCompanion.stash then
        local emptyStash = true
        for _ in pairs(WeakAurasCompanion.stash) do
          emptyStash = false
        end
        if not emptyStash and WeakAuras.StashShow then
          C_Timer.After(5, function() WeakAuras.StashShow() end)
        end
      end
    end
  end)
end

if Plater and Plater.CheckWagoUpdates then
    Plater.CheckWagoUpdates()
end`,
          },
          {
            name: "data.lua",
            data: LuaOutput,
          },
        ];

        files.forEach((file) => {
          let filepath = path.join(AddonFolder, file.name);

          if (!fs.existsSync(filepath)) {
            newInstall = true;
          }

          fs.writeFile(filepath, file.data, (err2) => {
            if (err2) {
              this.message(
                this.$t(
                  "app.main.errorFileSave",
                  { file: file.name } /* {file} could not be saved */
                ),
                "error"
              );
              throw new Error("errorFileSave");
            }
          });
        });

        if (!noNotification)
          this.afterUpdateNotification(newInstall, news, fails);

        if (
          newInstall &&
          isWOWOpen(this.config.wowpath.value, this.config.wowpath.version)
        ) {
          if (!this.reloadToast) {
            this.reloadToast = this.message(
              this.$t(
                "app.main.needrestart" /* Restart World of Warcraft to see new updates in WeakAuras's options */
              ),
              "info",
              {
                duration: null,
                onComplete: () => {
                  this.reloadToast = null;
                },
              }
            );

            afterWOWRestart(
              this.config.wowpath.value,
              this.config.wowpath.version,
              () => {
                if (this.reloadToast) this.reloadToast.goAway(0);
              }
            );
          }
        }
      }
      this.backup();
    },
    afterUpdateNotification(newInstall, news, fails) {
      const total = this.aurasWithUpdate.length;
      const newsCount = news.length;
      const failsCount = fails.length;
      const translatedTotal = this.$tc(
        "app.main.installTotal",
        total /* Everything is already up to date! | 1 update ready for in-game installation | {n} updates ready for in-game installation */
      );
      const translatedNew = this.$tc(
        "app.main.installNew",
        newsCount /* No new updates | 1 new | {n} new */
      );
      const translatedFail = this.$tc(
        "app.main.installFail",
        failsCount /* No fail | 1 failed | {n} failed */
      );

      if (newsCount > 0 && failsCount > 0) {
        this.message(
          `${translatedTotal} (${translatedNew}, ${translatedFail})`
        );
      } else if (newsCount > 0) {
        this.message(`${translatedTotal} (${translatedNew})`);

        if (
          !newInstall &&
          isWOWOpen(this.config.wowpath.value, this.config.wowpath.version)
        ) {
          if (!this.reloadToast) {
            this.reloadToast = this.message(
              this.$t(
                "app.main.needreload" /* Reload World of Warcraft's UI to see new updates in WeakAuras's options */
              ),
              "info",
              {
                duration: null,
                onComplete: () => {
                  this.reloadToast = null;
                },
              }
            );

            afterWOWReload(
              this.config.wowpath.value,
              this.config.wowpath.version,
              () => {
                if (this.reloadToast) {
                  this.reloadToast.goAway(0);
                  this.reloadToast = null;
                }
              }
            );
          }
        }
      } else if (failsCount > 0) {
        this.message(`${translatedTotal} (${translatedFail})`, "error");
      } else {
        this.message(this.$tc("app.main.installTotal", total));
      }

      // system notification
      if (!document.hasFocus() && this.config.notify && newsCount > 0) {
        const notification = new Notification(
          "A new update is ready to install",
          {
            body: news.join("\n"),
            icon: path.join(
              __static,
              process.platform === "win32" ? "bigicon.png" : "icon.png"
            ),
          }
        );

        notification.onclick = () => {
          this.$electron.ipcRenderer.send("open");
        };
        notification.show();
      }
    },
    installUpdates() {
      this.$electron.ipcRenderer.send("installUpdates");
    },
    backup() {
      this.config.wowpath.versions.forEach((version, versionindex) => {
        version.accounts.forEach((account, accountindex) => {
          this.addonsInstalled.forEach((addon) => {
            let lastSavedFileSize = null;

            if (typeof account.savedvariableSizeForAddon === "undefined")
              this.$set(account, "savedvariableSizeForAddon", []);

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
        fs.access(DataFolder, fs.constants.F_OK, (err) => {
          if (!err) {
            fs.readdir(wowpath, (err2, files) => {
              if (err2) {
                console.log(`Error: ${err2}`);
              } else {
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
                        fs.accessSync(accountFolder, fs.constants.F_OK);
                        validated = true;
                        this.config.wowpath.valided = true;
                        this.buildVersionList();
                        this.buildAccountList();
                      }
                    }
                  });
              }
            });
          } else {
            console.log(`Error: ${err}`);
          }
        });
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
          text: this.$t("app.version.retail" /* Retail */),
        },
        {
          value: "_ptr_",
          text: this.$t("app.version.ptr" /* PTR */),
        },
        {
          value: "_classic_beta_",
          text: this.$t("app.version.classicbeta" /* Classic Beta */),
        },
        {
          value: "_classic_ptr_",
          text: this.$t("app.version.classicptr" /* Classic PTR */),
        },
        {
          value: "_classic_",
          text: this.$t("app.version.classic" /* Classic */),
        },
        {
          value: "_beta_",
          text: this.$t("app.version.beta" /* Beta */),
        },
      ];

      if (this.config.wowpath.valided) {
        const wowpath = this.config.wowpath.value;

        fs.readdir(wowpath, (err, files) => {
          if (err) {
            console.log(`Error: ${err}`);
          } else {
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
          }
        });
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
          fs.readdir(accountFolder, (err, files) => {
            if (err) {
              console.log(`Error: ${err}`);
            } else {
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
                    typeof accountFound.savedvariableSizeForAddon ===
                    "undefined"
                  )
                    this.$set(accountFound, "savedvariableSizeForAddon", []);

                  this.accountOptions.push({
                    value: accountFile,
                    text: accountFile,
                  });
                });
            }
          });
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
@import "../assets/fonts/fonts.css";
@import "../assets/css/globals.scss";
@import "../assets/css/common.scss";

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
  transition: background-color 0.2s ease-in-out, border-bottom 0.2s ease-in-out,
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
  float: right;
}

#account-selector {
  float: right;
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

/* Toasts */
$toastbg: rgba(29, 29, 29, 0.97);
$toastfont: #e6e6e6;
$iconDefaultColor: #51ae42;
$errorColor: #f44336;
$infoColor: #0b96e6;
$iconSize: 26px;
.toasted-container.bottom-right {
  right: 2.35vw;
  margin-left: 2.35vw;
  bottom: 70px;
  .toasted-primary {
    padding: 0;
    font-weight: 500;
    text-align: left;
    justify-content: left;
    margin-left: auto;
    &:before {
      margin: 0 10px 0 10px;
      display: inline-block;
    }
    &.default {
      // Default Toast
      background-color: $toastbg;
      color: $toastfont;
      font-weight: 500;
      &:before {
        content: "";
        width: 22px;
        height: 22px;
        background: url("~@/assets/wow-logo.svg");
        background-size: contain;
        background-repeat: no-repeat;
      }
    }
    &.error {
      // Error Toast
      background-color: $toastbg;
      color: $toastfont;
      &:before {
        content: "\e001";
        font-family: "Material Icons";
        font-size: $iconSize;
        color: $errorColor;
        margin: 0 8px;
      }
    }
    &.update {
      // Update Toast
      background-color: $toastbg;
      color: $toastfont;
      &:before {
        content: "\e8d7";
        font-family: "Material Icons";
        font-size: $iconSize;
        background: none;
        width: auto;
        height: auto;
        color: $iconDefaultColor;
      }
      &.update-error:before {
        color: $errorColor;
      }
    }
    &.multiline {
      padding: 5px 0;
    }
    &.info {
      padding: 0 0px;
      background-color: $toastbg;
      &:before {
        content: "\e88f";
        font-family: "Material Icons";
        font-size: $iconSize;
        background: none;
        width: auto;
        height: auto;
        color: $infoColor;
        margin: 0 8px;
      }
    }
    .action {
      color: #e6e6e6;
      text-decoration: none;
      padding: 0 20px;
      line-height: 38px;
      // border-left: 1px solid #383838;
      border-radius: 0;
      margin: 0;
      margin-left: auto;
      justify-content: right;
      &:last-of-type:not(:only-of-type) {
        padding-right: 20px;
        border-left: none;
        font-weight: 500;
        padding-left: 0;
        margin-left: 0;
        &:before {
          content: unset;
        }
      }
      &:hover {
        text-shadow: 0 0 20px rgba(255, 255, 255, 0.7);
      }
      &:before {
        content: "";
        position: relative;
        top: 7px;
        font-size: 31px;
        line-height: 0;
        width: 15px;
        border-right: 1px solid #383838;
        height: 30px;
        margin-right: 20px;
      }
    }
    .small-text {
      font-size: 11px;
      width: 100%;
      display: block;
    }
  }
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

/* Browse Wago */
.browsewago {
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

.browsewago:hover {
  opacity: 1;
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
  .update-available {
    animation: pulse 2s infinite;
    cursor: pointer;
    color: $iconDefaultColor;
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
    text-shadow: 0 0 0 rgba(255, 255, 255, 0.4);
  }
  70% {
    text-shadow: 0 0 40px rgba(238, 255, 4, 0);
  }
  100% {
    text-shadow: 0 0 0 rgba(255, 255, 255, 0);
  }
}
</style>
