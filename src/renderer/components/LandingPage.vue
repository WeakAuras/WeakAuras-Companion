<template>
  <div id="wrapper">
    <TitleBar></TitleBar>
    <img :src="require(`@/assets/weakauras.png`)" class="wa-logo-background" />
    <div class="logos">
      <img :src="require(`@/assets/weakauras.png`)" class="wa-logo-top" />
      <span>{{ $t("app.main.companion" /* Companion */) }}</span>
    </div>
    <header>
      <v-button type="menu" @click="configStep = 0">{{
        $t("app.menu.main" /* Main */)
      }}</v-button>
      <span class="seperator">|</span>
      <v-button type="menu" @click="configStep = 1">{{
        $t("app.menu.settings" /* Settings */)
      }}</v-button>
      <span class="seperator">|</span>
      <v-button type="menu" @click="configStep = 2">{{
        $t("app.menu.about" /* About */)
      }}</v-button>
    </header>
    <main>
      <div v-if="configStep === 0" id="dashboard">
        <refreshButton
          :usable="config.wowpath.valided && config.account.valided"
          :fetching="fetching"
          :lastUpdate="schedule.lastUpdate"
        ></refreshButton>
        <br />
        <div class="updates">
          <span v-if="showNewUpdate" class="showNewUpdate">{{
            $t(
              "app.main.newUpdates" /* We found the following updates for you, they can now be applied in-game: */
            )
          }}</span>
          <span v-else>{{ $t("app.main.updates" /* Updates */) }}</span>
        </div>
        <div id="aura-list">
          <Aura
            v-for="aura in aurasFilteredAndSorted"
            :aura="aura"
            :key="aura.id"
          ></Aura>
        </div>
      </div>
      <Config v-if="configStep === 1" :config="config"></Config>
      <about v-if="configStep === 2"></about>
    </main>
    <footer>
      <a
        v-for="media in medias.weakauras"
        v-if="media.footer"
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
      <div id="messages" ref="messages">
        <message
          v-for="message in messages"
          :key="message.id"
          :message="message"
        ></message>
      </div>
    </footer>
  </div>
</template>

<script>
import path from "path";
import moment from "moment";
import Button from "./UI/Button.vue";
import RefreshButton from "./UI/RefreshButton.vue";
import Message from "./UI/Message.vue";
import Aura from "./UI/Aura.vue";
import Config from "./UI/Config.vue";
import About from "./UI/About.vue";
import TitleBar from "./UI/TitleBar.vue";

const fs = require("fs");
const luaparse = require("luaparse");
const Store = require("electron-store");
const hash = require("./libs/hash.js");
const medias = require("./libs/contacts.js");

const store = new Store();
luaparse.defaultOptions.comments = false;
luaparse.defaultOptions.scope = true;

const defaultValues = {
  configStep: 0,
  auras: [], // array of auras, slug field must be unique
  messages: [],
  fetching: false, // use for avoid spamming refresh button and show spinner
  config: {
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
    notify: true,
    lang: "en"
  },
  schedule: {
    id: null, // 1h setTimeout id
    lastUpdate: null
  },
  medias,
  showNewUpdate: false
};

export default {
  name: "landing-page",
  components: {
    RefreshButton,
    Message,
    Aura,
    Config,
    About,
    TitleBar,
    "v-button": Button
  },
  data() {
    return JSON.parse(JSON.stringify(defaultValues));
  },
  watch: {
    configStep() {
      if (this.configStep === 0) {
        // scroll down
        this.$nextTick(() => {
          const { messages } = this.$refs;
          messages.scrollTop = messages.scrollHeight;
        });
      }
    },
    config: {
      handler() {
        this.save(["config"]);
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
  },
  computed: {
    accountHash() {
      return hash.hashFnv32a(this.config.account.value, true);
    },
    aurasFilteredAndSorted() {
      function compare(a, b) {
        if (a.modified > b.modified) return -1;
        if (a.modified < b.modified) return 1;
        return 0;
      }
      return this.auras
        .filter(
          aura =>
            !!aura.encoded &&
            aura.wagoVersion > aura.version &&
            !this.privateOrDeleted &&
            !(
              this.config.ignoreOwnAuras &&
              aura.author === this.config.wagoUsername
            )
        )
        .sort(compare);
    }
  },
  methods: {
    reset() {
      this.config = JSON.parse(JSON.stringify(defaultValues.config));
      while (this.messages.length > 0) {
        this.messages.pop();
      }
      while (this.auras.length > 0) {
        this.auras.pop();
      }
      store.clear();
    },
    open(link) {
      this.$electron.shell.openExternal(link);
    },
    save(fields) {
      fields.forEach(field => {
        store.set(field, this[field]);
      });
    },
    restore() {
      Object.entries(store.store).forEach(data => {
        const { 0: key, 1: value } = data;
        this[key] = value;
      });
      this.$i18n.locale = this.config.lang;
    },
    message(text, type) {
      const date = moment().format("hh:mm:ss");
      this.messages.push({
        id: this.messages.length,
        time: date,
        text,
        type
      });
      // scroll down
      this.$nextTick(() => {
        const { messages } = this.$refs;
        messages.scrollTop = messages.scrollHeight;
      });
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

        const pattern = /(https:\/\/wago.io\/)([^/]+)\/?(\d*)/;
        WeakAurasSavedData.body[0].init[0].fields.forEach(obj => {
          if (obj.key.value === "displays") {
            obj.value.fields.forEach(obj2 => {
              let slug;
              let url;
              let version;
              let ignoreWagoUpdate;
              let id;

              obj2.value.fields.forEach(obj3 => {
                if (obj3.key.value === "id") {
                  id = obj3.value.value;
                }
                if (obj3.key.value === "ignoreWagoUpdate") {
                  ignoreWagoUpdate = obj3.value.value;
                }
                if (obj3.key.value === "url") {
                  url = obj3.value.value;
                  ({ 2: slug, 3: version } = url.match(pattern));
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
                    ignoreWagoUpdate,
                    wagoVersion: null,
                    created: null,
                    modified: null,
                    author: null,
                    encoded: null,
                    privateOrDeleted: false,
                    ids: [id]
                  });
                } else {
                  // there is already an aura with same "slug"
                  this.auras.forEach((aura, index) => {
                    if (aura.slug === slug) {
                      // add aura id to the "ids" if necessary
                      if (aura.ids.indexOf(id) === -1) {
                        this.auras[index].ids.push(id);
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
        // get data from wago api
        this.$http
          .get("https://data.wago.io/api/check/weakauras", {
            params: {
              // !! size of request is not checked, can lead to too long urls
              ids: this.auras
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
                .map(aura => aura.slug)
                .join()
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
                    { error } /* Can't read wago answer\n{error} */
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
                this.save(["auras"]);
                this.writeAddonData(newStrings, failStrings);
                this.fetching = false;
                this.schedule.lastUpdate = new Date();
              });
          })
          .catch(error => {
            this.message(
              this.$t(
                "app.main.errorWagoAnswer",
                { error } /* Can't read wago answer\n{error} */
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
    writeAddonData(newStrings, failStrings) {
      if (this.config.wowpath.valided) {
        const AddonFolder = path.join(
          this.config.wowpath.value,
          "Interface",
          "Addons",
          "WeakAurasCompanion"
        );
        // Make folder
        fs.mkdir(AddonFolder, err => {
          if (err && err.code !== "EEXIST") {
            this.message(
              this.$t(
                "app.main.errorCantCreateAddon" /* Can't create Addon directory */
              ),
              "error"
            );
          } else {
            // Make data.lua
            let LuaOutput = "-- file generated automatically\n";
            LuaOutput += "WeakAurasCompanion = {\n";
            const fields = [
              "name",
              "created",
              "modified",
              "author",
              "encoded",
              "wagoVersion"
            ];
            const countStrings = this.aurasFilteredAndSorted.length;
            this.aurasFilteredAndSorted.forEach(aura => {
              LuaOutput += `  ['${aura.slug}'] = {\n`;
              fields.forEach(field => {
                LuaOutput += `    ${field} = "${aura[field]}",\n`;
              });
              LuaOutput += "  },\n";
            });
            LuaOutput += "}";

            // write message if new aura or failed getting infos for at least one
            if (newStrings.length > 0 || failStrings.length > 0) {
              let msg;
              if (failStrings.length > 0) {
                msg = this.$t(
                  "app.main.updateDoneFail",
                  {
                    total: countStrings,
                    new: newStrings.length,
                    fail: failStrings.length
                  } /* {total} update ready for installation ({new} new, {fail} fail) */
                );
              } else {
                msg = this.$t(
                  "app.main.updateDone",
                  {
                    total: countStrings,
                    new: newStrings.length
                  } /* {total} update ready for installation ({new} new) */
                );
                this.showNewUpdate = true;
              }
              this.message(msg, "ok");
            } else {
              this.showNewUpdate = false;
            }

            // notify if there are new auras ready for update
            if (this.config.notify && newStrings.length > 0) {
              const myNotification = new Notification("WeakAuras Update", {
                body: newStrings.join("\n")
              });
              myNotification.onclick = () => {
                this.$electron.ipcRenderer.send("open");
              };
            }

            const files = [
              {
                name: "WeakAurasCompanion.toc",
                data: `## Interface: 80000
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
              fs.writeFile(
                path.join(AddonFolder, file.name),
                file.data,
                err2 => {
                  if (err2) {
                    this.message(
                      this.$t(
                        "app.main.errorFileSave",
                        { file: file.name } /* {file} could not be saved */
                      ),
                      "error"
                    );
                  }
                }
              );
            });

            // schedule in 1 hour
            this.schedule.id = setTimeout(
              this.compareSVwithWago,
              1000 * 60 * 60
            );
          }
        });
      }
    }
  }
};
</script>

<style>
@import url("https://fonts.googleapis.com/css?family=Noto+Sans+SC:300,400,700&amp;subset=chinese-simplified,cyrillic,japanese,vietnamese");

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  cursor: default;
}
body {
  font-family: 'Noto Sans SC', sans-serif;
  font-weight: 400;
  background-color: #171717;
  color: white;
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
  background-color: rgba(0,0,0,.1);
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
  border-radius: 2px;
  font-weight: 600;
  font-size: 14px;
  margin: 2px;
}
.btn.btn-menu:hover {
  background-color: #444;
}
.seperator {
  text-shadow: 0 0 1em black;
}
.updates {
  color: rgb(255, 209, 0);
  text-align: left;
  border-bottom: 1px solid rgba(255, 208, 0, 0.1);
  padding: 5px 15px;
  background-color: rgba(0,0,0,.1);
}

.updates span {
  text-shadow: #000 0 0 8px;
  font-size: 14px;
  margin: auto;
}

.showNewUpdate {
  color: rgb(40, 158, 40);
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
