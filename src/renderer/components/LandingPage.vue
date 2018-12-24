<template>
  <div id="wrapper">
    <TitleBar></TitleBar>
    <img :src="require(`@/assets/weakauras.png`)" class="wa-logo-background" />
    <div class="logos">
      <img :src="require(`@/assets/weakauras.png`)" class="wa-logo-top" />
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
    </footer>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import path from "path";
import moment from "moment";
import Button from "./UI/Button.vue";
import RefreshButton from "./UI/RefreshButton.vue";
import Aura from "./UI/Aura.vue";
import Config from "./UI/Config.vue";
import About from "./UI/About.vue";
import Help from "./UI/Help.vue";
import TitleBar from "./UI/TitleBar.vue";

const fs = require("fs");
const luaparse = require("luaparse");
const Store = require("electron-store");
const hash = require("./libs/hash.js");
const localserver = require("./libs/localserver.js");
const medias = require("./libs/contacts.js");

const store = new Store();
luaparse.defaultOptions.comments = false;
luaparse.defaultOptions.scope = true;

const internalVersion = 1;

const defaultValues = {
  configStep: 0,
  messages: [],
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
      while (this.messages.length > 0) {
        this.messages.pop();
      }
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
      const date = moment().format("hh:mm:ss");
      this.messages.push({
        id: this.messages.length,
        time: date,
        text,
        type
      });
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
      if (type === "success") this.$toasted.success(text, options);
      else if (type === "error") this.$toasted.error(text, options);
      else this.$toasted.show(text, options);
    },
    clearMessages() {
      while (this.messages.length > 0) {
        this.messages.pop();
      }
    },
    compareSVwithWago() {
      this.clearMessages();
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
      // this.message("Looking for updates on wago", "info");
      // Read WeakAuras.lua
      fs.readFile(WeakAurasSavedVariable, "utf-8", (err, data) => {
        if (err) {
          this.message(
            `An error ocurred reading file: ${err.message}`,
            "error"
          );
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
                      }
                    }
                  });
                }
              }
            });
          }
        });
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
        if (fetchAuras.length === 0) {
          this.message(
            this.$t("app.main.nothingToFetch" /* no updates available */),
            "info"
          );
          this.fetching = false;
          this.schedule.lastUpdate = new Date();
          this.schedule.id = setTimeout(this.compareSVwithWago, 1000 * 60 * 60);
          return;
        }
        // get data from wago api
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
            // this.message("Auras's metadata received from Wago API", "ok");
            const promises = [];
            response.data.forEach(wagoData => {
              this.auras.forEach((aura, index) => {
                if (aura.slug === wagoData.slug) {
                  this.auras[index].name = wagoData.name;
                  this.auras[index].author = wagoData.username;
                  this.auras[index].created = new Date(wagoData.created);
                  this.auras[index].wagoSemver = wagoData.versionString;
                  this.auras[index].changelog = wagoData.changelog;
                  if (
                    // get string if no string or current version is older than wago's
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

            const promisesResolved = promises.map(promise =>
              promise.catch(err2 => ({
                config: { params: { id: err2.config.params.id } },
                status: err2.response.status
              }))
            );

            const newStrings = [];
            const failStrings = [];
            this.$http
              .all(promisesResolved)
              .then(
                this.$http.spread((...args) => {
                  args.forEach(arg => {
                    const { id } = arg.config.params;
                    if (arg.status === 200) {
                      this.auras.forEach((aura, index) => {
                        if (aura.slug === id) {
                          newStrings.push(aura.name);
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
                          failStrings.push(aura.name);
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
                          failStrings.push(aura.name);
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
                  this.writeAddonData();
                  // refresh page
                  this.$nextTick(() => {
                    const countStrings = this.aurasWithUpdateSorted.length;
                    if (newStrings.length > 0 && failStrings.length > 0) {
                      this.message(
                        `${this.$tc(
                          "app.main.installTotal",
                          countStrings /* no update available | 1 update ready for in-game installation | {n} updates ready for in-game installation */
                        )} (${this.$tc(
                          "app.main.installNew",
                          newStrings.length /* no new updates | 1 new | {n} new updates */
                        )}, ${this.$tc(
                          "app.main.installFail",
                          failStrings.length /* no fail | 1 fail | {n} fails */
                        )})`,
                        "info"
                      );
                    } else if (newStrings.length > 0) {
                      this.message(
                        `${this.$tc(
                          "app.main.installTotal",
                          countStrings
                        )} (${this.$tc(
                          "app.main.installNew",
                          newStrings.length
                        )})`,
                        "info"
                      );
                    } else if (failStrings.length > 0) {
                      this.message(
                        `${this.$tc(
                          "app.main.installTotal",
                          countStrings
                        )} (${this.$tc(
                          "app.main.installFail",
                          failStrings.length
                        )})`,
                        "error"
                      );
                    } else {
                      this.message(
                        this.$tc("app.main.installTotal", countStrings),
                        "info"
                      );
                    }

                    // notify if there are new auras ready for update
                    if (this.config.notify && newStrings.length > 0) {
                      const myNotification = new Notification(
                        "WeakAuras Update",
                        {
                          body: newStrings.join("\n")
                        }
                      );
                      myNotification.onclick = () => {
                        this.$electron.ipcRenderer.send("open");
                      };
                    }
                  });
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
    writeAddonData() {
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
          // Make data.lua
          let LuaOutput = "-- file generated automatically\n";
          let LuaUids = "  uids = {\n";
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
            if (aura.changelog.text) {
              const sanitize = aura.changelog.text; // TODO !!
              LuaOutput += `      versionNote = "${sanitize}",\n`;
            }
            if (aura.uids) {
              aura.uids.forEach(uid => {
                LuaUids += `    ['${uid}'] = '${aura.slug}',\n`;
              });
            }
            LuaOutput += "    },\n";
          });
          LuaOutput += "  },\n";
          LuaOutput += LuaUids;
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
        });
      }
    }
  }
});
</script>

<style>
@import "../assets/fonts/fonts.css";

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  cursor: default;
}
body {
  font-family: "Noto Sans SC", sans-serif;
  font-weight: 400;
  background-color: #171717;
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
  display: flex;
  background-size: cover;
  flex-direction: column;
}
header {
  text-align: right;
  height: 50px;
  margin: 15px 15px 0 0;
  font-size: 0;
}
main {
  flex: 1;
  overflow-y: hidden;
}
footer {
  padding: 10px 15px;
  /* height: 40px; */
  text-align: left;
}
#dashboard {
  height: 100%;
  display: flex;
  flex-direction: column;
}
#aura-list {
  overflow: auto;
  height: 65%;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.1);
}
.logo {
  position: relative;
  display: inline-block;
  line-height: 1;
  width: 1.2em;
  height: auto;
  opacity: 0.7;
}
.logo:hover {
  opacity: 1;
}
.wa-logo-background {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: -99;
  opacity: 0.02;
  margin-right: 10px;
}
.logos {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  padding: 15px;
  top: 24px;
}
.wa-logo-top {
  height: 45px;
}
.logos span {
  font-weight: 300;
  font-size: 24px;
  margin-left: 5px;
  color: rgb(226, 226, 226);
}
a {
  color: white;
  text-decoration: none;
  cursor: pointer;
}
.btn.btn-menu {
  background: transparent;
  color: #f2f2f2;
  padding: 5px 10px;
  text-align: center;
  text-shadow: 0 0 1em black;
  width: auto;
  border: none;
  border-radius: 0;
  font-weight: 600;
  font-size: 14px;
  min-width: 70px;
  border-right: 1px solid rgba(255, 255, 255, 0.226);
  transition: background-color 0.2s ease-in;
}
header .btn-menu:last-child {
  border-right: none;
}
.btn.btn-menu:hover {
  background-color: rgba(255, 255, 255, 0.11);
}

.btn-menu.active {
  background-color: #87817f77 !important;
}

.seperator {
  text-shadow: 0 0 1em black;
}
.updates {
  color: rgb(255, 209, 0);
  text-align: left;
  border-bottom: 1px solid rgba(255, 208, 0, 0.1);
  padding: 5px 15px;
  background-color: rgba(0, 0, 0, 0.1);
}

.updates span {
  text-shadow: #000 0 0 8px;
  font-size: 14px;
  margin: auto;
}

/* width */
::-webkit-scrollbar {
  width: 5px;
}

/* Track */
::-webkit-scrollbar-track {
  background: #3a3a3a;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: rgb(172, 172, 172);
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}

#messages {
  float: right;
  vertical-align: bottom;
}
</style>
