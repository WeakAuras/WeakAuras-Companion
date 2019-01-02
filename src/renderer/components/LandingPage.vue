<template>
  <div id="wrapper">
    <div class="main-container" v-bind:class="{ blurred: reportIsShown }">
      <TitleBar></TitleBar>
      <svg
        class="wa-logo-background"
        width="917"
        height="365"
        viewBox="0 0 917 365"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 0H121.909L339.456 365H212.74L0 0Z" fill="#191919" />
        <path
          d="M600.936 277.243L549.121 365H916.525L702.164 0H584.503L678.24 174.619L735.646 277.243H600.936Z"
          fill="#191919"
        />
        <path
          d="M584.503 0L422.237 266.623L378.639 197.368L325.817 113.469H226.993H203.908L356.895 365H486.015L702.164 0H584.503Z"
          fill="#191919"
        />
      </svg>
      <div class="app-logo">
        <img :src="require(`@/assets/weakauras.png`)" class="logo-img" />
        <span>{{ $t("app.main.companion" /* Companion */) }}</span>
      </div>
      <header>
        <v-button
          type="menu"
          @click="configStep = 0"
          v-bind:class="{ active: configStep === 0 }"
          >{{ $t("app.menu.main" /* Main */) }}</v-button
        >
        <v-button
          type="menu"
          @click="configStep = 1"
          v-bind:class="{ active: configStep === 1 }"
          >{{ $t("app.menu.settings" /* Settings */) }}</v-button
        >
        <v-button
          type="menu"
          @click="configStep = 2"
          v-bind:class="{ active: configStep === 2 }"
          >{{ $t("app.menu.help" /* Help */) }}</v-button
        >
        <v-button
          type="menu"
          @click="configStep = 3"
          v-bind:class="{ active: configStep === 3 }"
          >{{ $t("app.menu.about" /* About */) }}</v-button
        >
      </header>
      <main>
        <div v-if="configStep === 0" id="dashboard">
          <refreshButton
            :usable="config.wowpath.valided && config.account.valided"
            :fetching="fetching"
            :lastUpdate="schedule.lastUpdate"
            :aurasShown="aurasWithUpdateSorted.length"
          ></refreshButton>
          <br />
          <div id="aura-list" v-if="aurasWithUpdateSorted.length > 0">
            <Aura
              v-for="aura in aurasWithUpdateSorted"
              :aura="aura"
              :key="aura.slug"
            ></Aura>
          </div>
        </div>
        <Config v-if="configStep === 1" :config="config"></Config>
        <help v-if="configStep === 2"></help>
        <about v-if="configStep === 3"></about>
      </main>
      <footer>
        <a
          v-for="media in footerMedias"
          v-bind:key="media.name"
          :href="media.url"
          target="_blank"
        >
          <img
            :src="require(`@/assets/${media.name}.png`)"
            class="logo"
            :title="media.name"
          />
        </a>
        <a class="reportbug" @click="toggleReport">
          {{ $t("app.footer.reportbug" /* Found a bug? */) }}
        </a>
      </footer>
    </div>
    <Report v-if="reportIsShown"></Report>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import path from "path";
import moment from "moment";
import {
  isOpen as isWOWOpen,
  afterReload as afterWOWReload,
  afterRestart as afterWOWRestart
} from "./libs/wowstat";
import Button from "./UI/Button.vue";
import RefreshButton from "./UI/RefreshButton.vue";
import Aura from "./UI/Aura.vue";
import Config from "./UI/Config.vue";
import About from "./UI/About.vue";
import Help from "./UI/Help.vue";
import TitleBar from "./UI/TitleBar.vue";
import Report from "./UI/Report.vue";

const fs = require("fs");
const luaparse = require("luaparse");
const Store = require("electron-store");
const hash = require("./libs/hash.js");
const localserver = require("./libs/localserver.js");
const medias = require("./libs/contacts.js");
const sanitize = require("./libs/sanitize.js");

const store = new Store();
luaparse.defaultOptions.comments = false;
luaparse.defaultOptions.scope = true;

const internalVersion = 1;

const defaultValues = {
  configStep: 0,
  reportIsShown: false,
  fetching: false, // use for avoid spamming refresh button and show spinner
  config: {
    // everything in this object will be auto-save and restore
    wowpath: {
      value: null,
      valided: false
    },
    account: {
      value: null, // name of the account selected
      valided: false,
      choices: []
    },
    wagoUsername: null, // ignore your own auras
    ignoreOwnAuras: true,
    autostart: false,
    startminimize: false,
    notify: false,
    lang: "en",
    internalVersion
  },
  schedule: {
    id: null, // 1h setTimeout id
    lastUpdate: null
  },
  medias
};

export default Vue.extend({
  name: "landing-page",
  components: {
    RefreshButton,
    Aura,
    Config,
    About,
    Help,
    TitleBar,
    Report,
    "v-button": Button
  },
  data() {
    return JSON.parse(JSON.stringify(defaultValues));
  },
  watch: {
    config: {
      handler() {
        store.set("config", this.config);
      },
      deep: true
    }
  },
  mounted() {
    // refresh on event (tray icon)
    this.$electron.ipcRenderer.on("refreshWago", () => {
      this.compareSVwithWago();
    });
    this.restore();
    if (!this.config.wowpath.valided || !this.config.account.valided) {
      this.configStep = 1;
    } else {
      this.configStep = 0;
      this.compareSVwithWago();
    }
    localserver.start();
  },
  destroyed() {
    localserver.stop();
  },
  computed: {
    accountHash() {
      return hash.hashFnv32a(this.config.account.value, true);
    },
    aurasWithUpdateSorted() {
      return this.aurasWithUpdate
        .slice(0)
        .sort((a, b) => moment.utc(b.modified).diff(moment.utc(a.modified)));
    },
    footerMedias() {
      if (this.medias && this.medias.weakauras) {
        return this.medias.weakauras.filter(media => media.footer);
      }
      return [];
    },
    aurasWithUpdate() {
      return this.auras.filter(
        aura =>
          !!aura.encoded &&
          aura.wagoVersion > aura.version &&
          !aura.privateOrDeleted &&
          !(
            this.config.ignoreOwnAuras &&
            aura.author === this.config.wagoUsername
          )
      );
    },
    auras: {
      get() {
        if (this.config.account.value) {
          const index = this.config.account.choices.findIndex(
            account => account.name === this.config.account.value
          );
          if (index !== -1)
            return this.config.account.choices[index].auras || [];
        }
        return [];
      },
      set(newValue) {
        if (this.config.account.value) {
          const index = this.config.account.choices.findIndex(
            account => account.name === this.config.account.value
          );
          if (index !== -1) {
            this.config.account.choices[index].auras = newValue;
            this.$set(
              this.config.account.choices,
              index,
              this.config.account.choices[index]
            );
          }
        }
      }
    }
  },
  methods: {
    reset() {
      store.clear();
      this.config = JSON.parse(JSON.stringify(defaultValues.config));
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
        if (this.config.internalVersion < internalVersion) {
          /* migration */
          if (previousVersion < 1) {
            // this.auras moved to this.config.account.choices[index].auras
            // this.auras is now a computed property
            this.auras = store.get("auras");
            store.clear();
            store.set("config", this.config);
          }

          this.config.internalVersion = internalVersion;
        }
      }
    },
    message(text, type) {
      const options = {
        theme: "toasted-primary",
        position: "bottom-right",
        duration: 8000,
        action: {
          text: this.$t("app.main.close" /* Close */),
          onClick: (e, toastObject) => {
            toastObject.goAway(0);
          }
        }
      };
      if (type === "success") return this.$toasted.success(text, options);
      if (type === "error") return this.$toasted.error(text, options);
      if (type === "blue") {
        options.duration = null;
        options.action = null;
        return this.$toasted.info(text, options);
      }
      return this.$toasted.show(text, options);
    },
    compareSVwithWago() {
      if (!this.config.wowpath.valided || !this.config.account.valided) {
        return;
      }
      if (this.fetching) return; // prevent spamming button
      this.fetching = true; // show animation
      if (this.schedule.id) clearTimeout(this.schedule.id); // cancel next 1h schedule
      const WeakAurasSavedVariable = path.join(
        this.config.wowpath.value,
        "_retail_",
        "WTF",
        "Account",
        this.config.account.value,
        "SavedVariables",
        "WeakAuras.lua"
      );

      // Read WeakAuras.lua
      fs.readFile(WeakAurasSavedVariable, "utf-8", (err, data) => {
        if (err) {
          this.message(
            `An error ocurred reading file: ${err.message}`,
            "error"
          );
          this.fetching = false;
          return;
        }
        // Parse WeakAuras.lua
        const WeakAurasSavedData = luaparse.parse(data);
        if (WeakAurasSavedData.body[0].variables[0].name !== "WeakAurasSaved") {
          this.message(
            this.$t(
              "app.main.errorSavedvariable" /* Error while reading WeakAuras.lua */
            ),
            "error"
          );
          this.fetching = false;
          return;
        }

        const pattern = /(https:\/\/wago.io\/)([^/]+)/;
        WeakAurasSavedData.body[0].init[0].fields.forEach(obj => {
          if (obj.key.value === "displays") {
            obj.value.fields.forEach(obj2 => {
              let slug;
              let url;
              let version = 1;
              let semver;
              let ignoreWagoUpdate;
              let id;
              let uid = null;

              obj2.value.fields.forEach(obj3 => {
                if (obj3.key.value === "id") {
                  id = obj3.value.value;
                }
                if (obj3.key.value === "uid") {
                  uid = obj3.value.value;
                }
                if (obj3.key.value === "version") {
                  version = obj3.value.value;
                }
                if (obj3.key.value === "semver") {
                  semver = obj3.value.value;
                }
                if (obj3.key.value === "ignoreWagoUpdate") {
                  ignoreWagoUpdate = obj3.value.value;
                }
                if (obj3.key.value === "url") {
                  url = obj3.value.value;
                  const result = url.match(pattern);
                  if (result) ({ 2: slug } = url.match(pattern));
                }
              });

              if (slug) {
                const { length } = this.auras.filter(
                  aura => aura.slug === slug
                );
                if (length === 0) {
                  // new "slug" found, add it to the list of auras
                  this.auras.push({
                    slug,
                    version,
                    semver,
                    ignoreWagoUpdate,
                    wagoVersion: null,
                    wagoSemver: null,
                    changelog: null,
                    created: null,
                    modified: null,
                    author: null,
                    encoded: null,
                    privateOrDeleted: false,
                    ids: [id],
                    uids: uid ? [uid] : []
                  });
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
                      // add aura id to "ids" if necessary
                      if (aura.ids.indexOf(id) === -1) {
                        this.auras[index].ids.push(id);
                      }
                      // add aura uid to "uids" if necessary
                      if (uid && aura.uids.indexOf(uid) === -1) {
                        this.auras[index].uids.push(uid);
                      }
                      // check if version field needs to be updated
                      if (aura.version < version) {
                        this.auras[index].version = version;
                        this.auras[index].semver = semver;
                      }
                    }
                  });
                }
              }
            });
          }
        });

        // Make a list of uniq auras to fetch
        const fetchAuras = this.auras
          .filter(
            aura =>
              !aura.privateOrDeleted &&
              !aura.ignoreWagoUpdate &&
              !(
                this.config.ignoreOwnAuras &&
                !!aura.author &&
                aura.author === this.config.wagoUsername
              )
          )
          .map(aura => aura.slug);

        // Test if list is empty
        if (fetchAuras.length === 0) {
          this.message(
            this.$t("app.main.nothingToFetch" /* No updates available */),
            "info"
          );
          this.fetching = false;
          this.schedule.lastUpdate = new Date();
          this.schedule.id = setTimeout(this.compareSVwithWago, 1000 * 60 * 60);
          return;
        }

        // Get data from Wago api
        this.$http
          .get("https://data.wago.io/api/check/weakauras", {
            params: {
              // !! size of request is not checked, can lead to too long urls
              ids: fetchAuras.join()
            },
            headers: {
              Identifier: this.accountHash,
              "Content-Security-Policy": [
                "script-src",
                "self",
                "https://data.wago.io"
              ]
            },
            crossdomain: true
          })
          .then(response => {
            // metadata received from Wago API
            const promises = [];
            response.data.forEach(wagoData => {
              this.auras.forEach((aura, index) => {
                if (aura.slug === wagoData.slug) {
                  this.auras[index].name = wagoData.name;
                  this.auras[index].author = wagoData.username;
                  this.auras[index].created = new Date(wagoData.created);
                  this.auras[index].wagoSemver = wagoData.versionString;
                  this.auras[index].changelog = wagoData.changelog;
                  // Check if encoded string needs to be fetched
                  if (
                    wagoData.version > aura.version &&
                    (aura.encoded === null ||
                      (!!aura.wagoVersion &&
                        wagoData.version > aura.wagoVersion)) &&
                    !(
                      this.config.ignoreOwnAuras &&
                      wagoData.username === this.config.wagoUsername
                    )
                  ) {
                    this.auras[index].modified = new Date(wagoData.modified);
                    this.auras[index].wagoVersion = wagoData.version;
                    promises.push(
                      this.$http.get("https://data.wago.io/api/raw/encoded", {
                        params: {
                          id: aura.slug
                        },
                        headers: {
                          Identifier: this.accountHash,
                          "Content-Security-Policy": [
                            "script-src",
                            "self",
                            "https://data.wago.io"
                          ]
                        },
                        crossdomain: true
                      })
                    );
                  }
                }
              });
            });

            // catch response error
            const promisesResolved = promises.map(promise =>
              promise.catch(err2 => ({
                config: { params: { id: err2.config.params.id } },
                status: err2.response.status
              }))
            );

            // Get each encoded string
            const news = [];
            const fails = [];
            this.$http
              .all(promisesResolved)
              .then(
                this.$http.spread((...args) => {
                  args.forEach(arg => {
                    const { id } = arg.config.params;
                    if (arg.status === 200) {
                      this.auras.forEach((aura, index) => {
                        if (aura.slug === id) {
                          news.push(aura.name);
                          this.auras[index].encoded = arg.data;
                        }
                      });
                    } else if (arg.status === 404) {
                      // private or deleted aura
                      this.auras.forEach((aura, index) => {
                        if (aura.slug === id) {
                          this.message(
                            this.$t(
                              "app.main.errorApiString404",
                              {
                                aura: aura.name
                              } /* Could not receive string for {aura}, aura is private or was removed, ignoring this aura for next checks */
                            ),
                            "error"
                          );
                          fails.push(aura.name);
                          this.auras[index].privateOrDeleted = true;
                        }
                      });
                    } else {
                      this.auras.forEach(aura => {
                        if (aura.slug === id) {
                          this.message(
                            `Error receiving encoded string for "${
                              aura.name
                            }" http code: ${arg.status}`,
                            "error"
                          );
                          fails.push(aura.name);
                        }
                      });
                    }
                  });
                })
              )
              .catch(error => {
                this.message(
                  this.$t(
                    "app.main.errorWagoAnswer",
                    { error } /* Can't read Wago answer\n{error} */
                  ),
                  "error"
                );
                this.fetching = false;
                // schedule in 30mn on error
                this.schedule.id = setTimeout(
                  this.compareSVwithWago,
                  1000 * 60 * 30
                );
              })
              .then(() => {
                // we are done with wago API, update data.lua
                try {
                  this.writeAddonData(news.length, fails.length);
                } finally {
                  this.fetching = false;
                  this.schedule.lastUpdate = new Date();
                  // schedule in 1 hour
                  this.schedule.id = setTimeout(
                    this.compareSVwithWago,
                    1000 * 60 * 60
                  );
                }
              });
          })
          .catch(error => {
            this.message(
              this.$t(
                "app.main.errorWagoAnswer",
                { error } /* Can't read Wago answer\n{error} */
              ),
              "error"
            );
            this.fetching = false;
            // schedule in 30mn on error
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
    writeAddonData(news, fails) {
      let newInstall = false;
      if (this.config.wowpath.valided) {
        const AddonFolder = path.join(
          this.config.wowpath.value,
          "_retail_",
          "Interface",
          "Addons",
          "WeakAurasCompanion"
        );
        // Make folder
        fs.mkdir(AddonFolder, err => {
          if (err && err.code !== "EEXIST") {
            this.message(
              this.$t(
                "app.main.errorCantCreateAddon" /* Can't create addon directory */
              ),
              "error"
            );
            throw new Error("errorCantCreateAddon");
          }
          if (!err) {
            if (isWOWOpen(this.config.wowpath.value)) {
              newInstall = true;
              const toast = this.message(
                this.$t(
                  "app.main.needrestart" /* Restart World of Warcraft to see new updates in WeakAuras's options */
                ),
                "blue"
              );
              afterWOWRestart(this.config.wowpath.value, () => {
                toast.goAway(0);
              });
            }
          }
          // Make data.lua
          let LuaOutput = "-- file generated automatically\n";
          let LuaUids = "  uids = {\n";
          let LuaIds = "  ids = {\n";
          LuaOutput += "WeakAurasCompanion = {\n";
          const fields = [
            "name",
            "author",
            "encoded",
            "wagoVersion",
            "wagoSemver"
          ];
          LuaOutput += "  slugs = {\n";
          this.aurasWithUpdateSorted.forEach(aura => {
            LuaOutput += `    ['${aura.slug}'] = {\n`;
            fields.forEach(field => {
              LuaOutput += `      ${field} = "${aura[field]}",\n`;
            });
            if (typeof aura.changelog !== "undefined") {
              if (typeof aura.changelog.text !== "undefined") {
                let sanitized;
                if (aura.changelog.format === "bbcode") {
                  sanitized = sanitize.bbcode(aura.changelog.text);
                } else if (aura.changelog.format === "markdown") {
                  sanitized = sanitize.markdown(aura.changelog.text);
                }
                LuaOutput += `      versionNote = "${sanitized}",\n`;
              }
            }
            if (aura.uids) {
              aura.uids.forEach(uid => {
                LuaUids += `    ["${uid}"] = "${aura.slug}",\n`;
              });
              aura.ids.forEach(id => {
                LuaIds += `    ["${id}"] = "${aura.slug}",\n`;
              });
            }
            LuaOutput += "    },\n";
          });
          LuaOutput += "  },\n";
          LuaOutput += LuaUids;
          LuaOutput += "  },\n";
          LuaOutput += LuaIds;
          LuaOutput += "  }\n";
          LuaOutput += "}";

          const files = [
            {
              name: "WeakAurasCompanion.toc",
              data: `## Interface: 80100
## Title: WeakAuras Companion
## Author: The WeakAuras Team
## Version: 1.0.0
## Notes: Keep your WeakAuras updated!
## X-Category: Interface Enhancements
## DefaultState: Enabled
## Dependencies: WeakAuras, WeakAurasOptions

data.lua
init.lua`
            },
            {
              name: "init.lua",
              data: `-- file generated automatically
local L = WeakAuras.L
local count = WeakAuras.CountWagoUpdates()

if count > 0 then
C_Timer.After(1, function() WeakAuras.prettyPrint((L["There are %i updates to your auras ready to be installed!"]):format(count)) end)
end`
            },
            {
              name: "data.lua",
              data: LuaOutput
            }
          ];

          files.forEach(file => {
            fs.writeFile(path.join(AddonFolder, file.name), file.data, err2 => {
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
          this.afterUpdateNotification(newInstall, news, fails);
        });
      }
    },
    afterUpdateNotification(newInstall, news, fails) {
      const total = this.aurasWithUpdate.length;
      if (news > 0 && fails > 0) {
        this.message(
          `${this.$tc(
            "app.main.installTotal",
            total /* No update available | 1 update ready for in-game installation | {n} updates ready for in-game installation */
          )} (${this.$tc(
            "app.main.installNew",
            news /* No new updates | 1 new | {n} new */
          )}, ${this.$tc(
            "app.main.installFail",
            fails /* No fail | 1 failed | {n} failed */
          )})`,
          "info"
        );
      } else if (news > 0) {
        this.message(
          `${this.$tc(
            "app.main.installTotal",
            total /* No update available | 1 update ready for in-game installation | {n} updates ready for in-game installation */
          )} (${this.$tc(
            "app.main.installNew",
            news /* No new updates | 1 new | {n} new */
          )})`,
          "info"
        );
        if (!newInstall && isWOWOpen(this.config.wowpath.value)) {
          const toast = this.message(
            this.$t(
              "app.main.needreload" /* Reload World of Warcraft's UI to see new updates in WeakAuras's options */
            ),
            "blue"
          );
          afterWOWReload(this.config.wowpath.value, () => {
            toast.goAway(0);
          });
        }
      } else if (fails > 0) {
        this.message(
          `${this.$tc("app.main.installTotal", total)} (${this.$tc(
            "app.main.installFail",
            fails
          )})`,
          "error"
        );
      } else {
        this.message(this.$tc("app.main.installTotal", total), "info");
      }

      // system notification
      if (this.config.notify && news.length > 0) {
        const myNotification = new Notification("WeakAuras Update", {
          body: news.join("\n")
        });
        myNotification.onclick = () => {
          this.$electron.ipcRenderer.send("open");
        };
      }
    }
  }
});
</script>

<style>
@import "../assets/fonts/fonts.css";

/* General (All Pages) */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  cursor: default;
}
body {
  font-family: "Noto Sans SC", sans-serif;
  font-weight: 400;
  background-color: #131313;
  color: white;
  overflow-y: hidden;
  user-select: none;
}
a:not([draggable="true"]),
img:not([draggable="true"]) {
  -webkit-user-drag: none;
}
#wrapper {
  height: 100vh;
  position: relative;
}
.main-container {
  height: 100%;
  width: 100%;
  display: flex;
  position: absolute;
  background-size: cover;
  flex-direction: column;
  transition: filter ease-in-out 0.2s;
}
header {
  text-align: right;
  height: 76px;
  font-size: 0;
  padding-right: 2.35vw;
  background-color: #101010;
  -webkit-app-region: drag;
  transition: all 0.2s ease-in-out;
}
main {
  flex: 1;
  overflow-y: hidden;
}
footer {
  padding: 14px 2.35vw;
  /* height: 40px; */
  text-align: left;
  background: #101010;
  transition: all 0.2s ease-in-out;
}

.title {
  font-size: 25px;
  font-weight: 600;
  padding: 4px 10px 4px;
  margin-bottom: 10px;
  border-left: 2px solid rgb(255, 209, 0);
  background-color: rgba(0, 0, 0, 0.1);
}

a {
  color: white;
  text-decoration: none;
  cursor: pointer;
}

.logo {
  position: relative;
  top: 5px;
  display: inline-block;
  line-height: 1;
  width: auto;
  height: 1.4em;
  opacity: 0.4;
  margin-right: 3px;
}
.logo:hover {
  opacity: 1;
}

/* Companion logo */
.app-logo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 18px;
  left: 18px;
}
.logo-img {
  height: 40px;
  transition: all 0.2s ease-in-out;
}
.app-logo span {
  font-weight: 300;
  font-size: 22px;
  margin-left: 5px;
  color: #e4e4e4;
  transition: all 0.2s ease-in-out;
}

/* Menu */
.btn.btn-menu {
  background: transparent;
  color: #e6e6e6;
  padding: 0 18px;
  text-align: center;
  width: auto;
  height: 100%;
  border: none;
  border-radius: 0;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 3px solid transparent;
  transition: background-color 0.2s ease-in-out, border-bottom 0.2s ease-in-out,
    font-size 0.2s ease-in-out;
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

/* Aura list */
#aura-list {
  overflow: auto;
  height: 65%;
  text-align: center;
  margin: 0 2.35vw 15px;
  background-color: rgba(0, 0, 0, 0.25);
  border: 1px solid #212121;
  border-radius: 8px;
  padding: 5px;
}

/* Background WA logo */
.wa-logo-background {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: -99;
  padding: 20% 12%;
  fill: #191919;
}

/* Scrollbar */
::-webkit-scrollbar {
  position: absolute;
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
  background: #555;
}

/* Toasts */
.toasted-container.bottom-right {
  right: 15px;
  bottom: 50px;
}

.toasted-container.bottom-right .action {
  color: #101010;
}

.toasted-container.bottom-right .error .action {
  color: #e6e6e6;
}

.toasted-container .default {
  background-color: #e6e6e6;
  color: #101010;
  font-weight: 400;
}

/* Report Page */
.reportbug {
  font-size: 12px;
  color: #777;
  position: absolute;
  right: 2.35vw;
  bottom: 17px;
  text-shadow: #000 1px 0;
}
.reportbug:hover {
  color: #aaa;
}

/* 800px+ only */
@media screen and (min-width: 800px) {
  /* Header */
  .btn.btn-menu {
    font-size: 22px;
    padding: 0 15px;
  }
  .app-logo {
    top: 28px;
    left: 28px;
  }
  .app-logo .logo-img {
    height: 68px;
  }
  .app-logo span {
    font-size: 36px;
  }
  header {
    height: 125px;
  }

  /* Footer */
  footer {
    padding: 20px 2.35vw;
  }
  .logo {
    height: 30px;
  }
  .reportbug {
    font-size: 16px;
    bottom: 26px;
  }
}
</style>
