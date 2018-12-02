<template>
  <div id="wrapper">
      <img :src="require(`@/assets/weakauras.png`)" class="walogo" />
      <div class="logos">

          <img :src="require(`@/assets/wago.png`)" class="wagologo" />
          <span>Updater</span>

      </div>

    <header>
      <v-button type="menu" @click="configStep = 0">Main</v-button>
       <span class="seperator">|</span>
      <v-button type="menu" @click="configStep = 1">Settings</v-button>
      <span class="seperator">|</span>
      <v-button type="menu" @click="configStep = 2">About</v-button>
    </header>
    <main>
      <div v-if="configStep === 0" id="dashboard">
        <refreshButton
          :usable="config.wowpath.valided && config.account.valided"
          :fetching="fetching"
          :lastUpdate="schedule.lastUpdate"
        ></refreshButton>
        <div id="messages" ref="messages">
          <div class="updates">
          <span>Updates</span>
          </div>
          <message
            v-for="message in messages"
            :key="message.id"
            :message="message"
          ></message>
        </div>
      </div>
      <Config v-if="configStep === 1" :config="config"></Config>
      <about v-if="configStep === 2"></about>
    </main>
    <footer>
      <a href="https://discord.gg/wa2" target="_blank">
        <img
          :src="require(`@/assets/discord.png`)"
          class="logo"
          title="discord"
        />
      </a>
      <a href="https://twitter.com/WeakAuras" target="_blank">
        <img
          :src="require(`@/assets/twitter.png`)"
          class="logo"
          title="twitter"
        />
      </a>
      <a href="https://facebook.com/WeakAuras" target="_blank">
        <img
          :src="require(`@/assets/facebook.png`)"
          class="logo"
          title="facebook"
        />
      </a>
      <a
        href="https://www.youtube.com/channel/UCEuzJlrsz27wUWlWn_HSEeg"
        target="_blank"
      >
        <img
          :src="require(`@/assets/youtube.png`)"
          class="logo"
          title="youtube"
        />
      </a>
      <a href="https://github.com/WeakAuras/WeakAuras2" target="_blank">
        <img
          :src="require(`@/assets/github.png`)"
          class="logo"
          title="github"
        />
      </a>
      <a href="https://www.patreon.com/WeakAuras" target="_blank">
        <img
          :src="require(`@/assets/patreon.png`)"
          class="logo"
          title="patreon"
        />
      </a>
      <a href="https://mods.curse.com/addons/wow/weakauras-2" target="_blank">
        <img :src="require(`@/assets/curse.png`)" class="logo" title="curse" />
      </a>
    </footer>
  </div>
</template>

<script>
import path from "path";
import moment from "moment";
import Button from "./UI/Button.vue";
import RefreshButton from "./UI/RefreshButton.vue";
import Message from "./UI/Message.vue";
import Config from "./UI/Config.vue";
import About from "./UI/About.vue";

const fs = require("fs");
const luaparse = require("luaparse");
const Store = require("electron-store");
const hash = require("./libs/hash.js");

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
    autostart: false,
    startminimize: false,
    notify: true
  },
  schedule: {
    id: null, // 1h setTimeout id
    lastUpdate: null
  }
};

export default {
  name: "landing-page",
  components: {
    RefreshButton,
    Message,
    Config,
    About,
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
    },
    message(text, type, aura, version) {
      const date = moment().format("hh:mm:ss");
      this.messages.push({
        id: this.messages.length,
        time: date,
        text,
        type,
        aura,
        version
      });
      // sort by latest at top
      this.messages.sort(function(a,b){return a.id < b.id});
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
      if (!this.config.wowpath.valided || !this.config.account.valided) {
        this.message("Configuration is not finished", "error");
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
            `An error ocurred reading file :${err.message}`,
            "error"
          );
          return;
        }
        // Parse WeakAuras.lua
        const WeakAurasSavedData = luaparse.parse(data);
        if (WeakAurasSavedData.body[0].variables[0].name !== "WeakAurasSaved") {
          this.messageit("Error while reading WeakAuras.lua", "error");
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

              obj2.value.fields.forEach(obj3 => {
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
                    privateOrDeleted: false
                  });
                } else {
                  // there is already an aura with same "slug"
                  // check if version field needs to be updated
                  this.auras.forEach((aura, index) => {
                    if (aura.slug === slug && aura.version < version) {
                      this.auras[index].version = version;
                    }
                  });
                }
              }
            });
          }
        });
        // get data from wago api
        this.$http
          .get("https://data.wago.io/lookup/weakauras", {
            params: {
              // !! size of request is not checked, can lead to too long urls
              ids: this.auras
                .filter(
                  aura => !aura.privateOrDeleted && !aura.ignoreWagoUpdate
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
                  // fetch aura data if :
                  // latest version on wago is newer than what is in WeakAurasSavedVariable
                  // and there isn't already an encoded string saved for latest version
                  // and you are not the author
                  if (
                    wagoData.version > aura.version &&
                    (aura.encoded === null ||
                      (!!aura.wagoVersion &&
                        wagoData.version > aura.wagoVersion)) &&
                    wagoData.username !== this.config.wagoUsername
                  ) {
                    this.auras[index].created = wagoData.created;
                    this.auras[index].modified = wagoData.modified;
                    this.auras[index].author = wagoData.username;
                    this.auras[index].wagoVersion = wagoData.version;
                    this.auras[index].name = wagoData.name;
                    promises.push(
                      this.$http.get("https://data.wago.io/wago/raw/encoded", {
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
                          const msg = `New update for "${aura.name}"`;
                          this.message(msg, "ok", aura, aura.wagoVersion);
                          newStrings.push(aura.name);
                          this.auras[index].encoded = arg.data;
                        }
                      });
                    } else if (arg.status === 404) {
                      // private or deleted aura
                      this.auras.forEach((aura, index) => {
                        if (aura.slug === id) {
                          this.message(
                            `Could not receive string for "${
                              aura.name
                            }", aura is private or was removed, ignoring this aura for next checks`,
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
                this.message(`Can't read wago answer\n${error}`, "error");
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
            this.message(`Can't read wago answer\n${error}`, "error");
            this.fetching = false;
            this.schedule.lastUpdate = new Date();
          });
      });
    },
    writeAddonData(newStrings, failStrings) {
      if (this.config.wowpath.valided) {
        const AddonFolder = path.join(
          this.config.wowpath.value,
          "Interface",
          "Addons",
          "WeakAurasWagoUpdate"
        );
        // Make folder
        fs.mkdir(AddonFolder, err => {
          if (err && err.code !== "EEXIST") {
            this.message("Can't create Addon directory", "error");
          } else {
            // Make data.lua
            let LuaOutput = "-- file generated automatically\n";
            LuaOutput += "WeakAurasWagoUpdate = {\n";
            const fields = [
              "name",
              "created",
              "modified",
              "author",
              "encoded",
              "wagoVersion"
            ];
            const countStrings = this.auras.filter(aura => !!aura.encoded)
              .length;
            this.auras
              .filter(aura => !!aura.encoded)
              .forEach(aura => {
                LuaOutput += `  ['${aura.slug}'] = {\n`;
                fields.forEach(field => {
                  LuaOutput += `    ${field} = "${aura[field]}",\n`;
                });
                LuaOutput += "  },\n";
              });
            LuaOutput += "}";

            // write message if new aura or failed getting infos for at least one
            if (newStrings.length > 0 || failStrings.length > 0) {
              let msg = `${countStrings} update${
                countStrings > 1 ? "s" : ""
              } ready for installation (${newStrings.length} new`;
              if (failStrings.length > 0) {
                msg += `, ${failStrings.length} error`;
              }
              msg += ")";
              this.message(msg, "ok");
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
                name: "WeakAurasWagoUpdate.toc",
                data: `## Interface: 80000
## Title: WeakAuras Wago Update
## Author: WeakAuras Team
## Version: 1.0.0
## Notes: Keep your WeakAuras updated
## X-Category: Interface Enhancements
## DefaultState: Enabled
## Dependencies: WeakAuras, WeakAurasOptions

data.lua
init.lua`
              },
              {
                name: "init.lua",
                data: `-- file generated automatically
local count = WeakAuras.CountWagoUpdates()
if count > 0 then
  WeakAuras.prettyPrint((L["%i updates from Wago ready for installation"]):format(count))
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
                    this.message(`${file.name} could not be saved`, "error");
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
    @import url("https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900&amp;subset=cyrilli");

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: "Roboto", sans-serif;
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
      text-align: center;
      height: 50px;
      margin: 20px 0 0px 0;
    }
    main {
      flex: 1;
      overflow-y: auto;
    }
    footer {
      padding: 5px 0;
      /* height: 40px; */
      text-align: center;
    }
    .mid {
      margin: 0;
      position: absolute;
      top: 50%;
      width: 100%;
      text-align: center;
    }
    #dashboard {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    #messages {
      overflow: auto;
      height: 65%;
      text-align: center;
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
    .logos {
        padding: 15px;
        position: fixed;
    }
    .walogo {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit:contain;
      z-index: -99;
      opacity: 0.02;
      margin-right: 10px;
    }
    .logos {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .wagologo {
      height: 45px;
      top: 10px;
      right: 10px;
    }
    .logos span {
      font-weight: 300;
      font-size: 24px;
      margin-left: 10px;
      color: rgb(226, 226, 226);
    }
    .green {
      color: green;
    }
    .red {
      color: red;
    }
    a {
      color: white;
      text-decoration: none;
      cursor: pointer;
    }

    .btn.btn-menu {
        background: transparent;
        color: #F2F2F2;
        padding: 5px 10px;
        text-align: center;
        text-shadow: 0 0 1em black;
        width: auto;
        border: none;
        border-radius: 2px;
        font-family: 'Roboto';
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
      font-family: 'Roboto Mono', monospace;
      text-align: center;
      margin-left: 5px;
      margin-bottom: 10px;
      text-transform: uppercase;
      padding-bottom: 5px;
    }
    .updates span {
      text-shadow: #000 0 0 8px;
      padding: 3px 20px;
      border-bottom: rgba(255, 208, 0, 0.247) 2px solid;
      border-radius: 15px;
      text-shadow: rgba(219, 185, 50, 0.267) 0 0 10px;
    }
</style>
