<template>
  <div id="wrapper">
    <img src="../assets/weakauras.png" class="walogo">
    <img src="../assets/wago.png" class="wagologo">
    <header>
      <v-button type="menu" @click="configStep = 0">Main</v-button>
      <v-button type="menu" @click="configStep = 1">Settings</v-button>
      <v-button type="menu" @click="configStep = 2">About</v-button>
    </header>
    <main>
      <div v-if="configStep === 0" id="dashboard">
        <refreshButton
          :usable="config.wowpath.valided && config.account.valided"
          :fetching="fetching"
        ></refreshButton>
        <div id="messages" ref="messages">
          <message v-for="message in messages" :key="message.id" :message="message"></message>
        </div>
      </div>
      <Config v-if="configStep === 1" :config="config"></Config>
      <about v-if="configStep === 2"></about>
    </main>
    <footer>
      <a href="https://discord.gg/wa2" target="_blank">
        <img src="../assets/discord.png" class="logo" title="discord">
      </a>
      <a href="https://twitter.com/WeakAuras" target="_blank">
        <img src="../assets/twitter.png" class="logo" title="twitter">
      </a>
      <a href="https://facebook.com/WeakAuras" target="_blank">
        <img src="../assets/facebook.png" class="logo" title="facebook">
      </a>
      <a href="https://www.youtube.com/channel/UCEuzJlrsz27wUWlWn_HSEeg" target="_blank">
        <img src="../assets/youtube.png" class="logo" title="youtube">
      </a>
      <a href="https://github.com/WeakAuras/WeakAuras2" target="_blank">
        <img src="../assets/github.png" class="logo" title="github">
      </a>
      <a href="https://www.patreon.com/WeakAuras" target="_blank">
        <img src="../assets/patreon.png" class="logo" title="patreon">
      </a>
      <a href="https://mods.curse.com/addons/wow/weakauras-2" target="_blank">
        <img src="../assets/curse.png" class="logo" title="curse">
      </a>
    </footer>
  </div>
</template>

<script>
import Button from './UI/Button'
import RefreshButton from "./UI/RefreshButton";
import Message from "./UI/Message";

import Config from "./UI/Config";
import About from "./UI/About";

import path from "path";
import moment from "moment";

const hash = require("./libs/hash.js")
const Store = require("electron-store");
const store = new Store();

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
  schedule: null // 1h setTimeout id
}

export default {
  name: "landing-page",
  components: { 
    RefreshButton,
    Message,
    Config,
    About,
    'v-button': Button,
  },
  data() {
    return JSON.parse(JSON.stringify(defaultValues));
  },
  watch: {
    configStep() {
      if (this.configStep == 0) {
        //scroll down
        this.$nextTick(() => {
          var messages = this.$refs.messages;
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
  created() {
    this.restore();
    if (!this.config.wowpath.valided || !this.config.account.valided) {
      this.configStep = 1;
    } else {
      this.compareSVwithWago();
    }
  },
  mounted() {
    // refresh on event (tray icon)
    this.$electron.ipcRenderer.on("refreshWago", (event, data) => {
      this.compareSVwithWago();
    });
  },
  computed: {
    accountHash()  {
      return hash.hashFnv32a(this.config.account.value, true);
    }
  },
  methods: {
    reset() {
      this.config = JSON.parse(JSON.stringify(defaultValues.config))
      while (this.messages.length > 0) {
        this.messages.pop();
      }
      while (this.auras.length > 0) {
        this.auras.pop();
      }
      this.save(["config", "auras"]);
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
      const data = store.store;
      for (var field in data) {
        this[field] = data[field];
      }
    },
    message(text, type, aura) {
      const date = moment().format("hh:mm:ss");
      this.messages.push({
        id: this.messages.length,
        time: date,
        text: text,
        type: type,
        aura: aura
      });
      //scroll down
      this.$nextTick(() => {
        var messages = this.$refs.messages;
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
      if (this.schedule) clearTimeout(this.schedule); // cancel next 1h schedule
      const fs = require("fs");
      const luaparse = require("luaparse");
      luaparse.defaultOptions.comments = false;
      luaparse.defaultOptions.scope = true;
      let luaData;
      const WeakAurasSavedVariable = path.join(
        this.config.wowpath.value,
        "WTF",
        "Account",
        this.config.account.value,
        "SavedVariables",
        "WeakAuras.lua"
      );
      this.message("Looking for updates on wago", "info");
      // Read WeakAuras.lua
      fs.readFile(WeakAurasSavedVariable, "utf-8", (err, data, luaData) => {
        if (err) {
          this.message(
            "An error ocurred reading file :" + err.message,
            "error"
          );
          return;
        }
        // Parse WeakAuras.lua
        const WeakAurasSavedData = luaparse.parse(data);
        if (WeakAurasSavedData.body[0].variables[0].name != "WeakAurasSaved") {
          this.messageit("Error while reading WeakAuras.lua", "error");
          return;
        }

        const pattern = /(https:\/\/wago.io\/)([^\/]+)\/?(\d*)/;
        WeakAurasSavedData.body[0].init[0].fields.forEach(obj => {
          if (obj.key.value == "displays") {
            obj.value.fields.forEach(obj2 => {
              var id = obj2.key.value;
              var slug, url, version;

              obj2.value.fields.forEach(obj3 => {
                if (obj3.key.value == "url") {
                  url = obj3.value.value;
                  const pattern_result = url.match(pattern);
                  version = pattern_result[3];
                  slug = pattern_result[2];

                  if (slug) {
                    const length = this.auras.filter(aura => aura.slug === slug)
                      .length;
                    if (length == 0) {
                      // new "slug" found, add it to the list of auras
                      this.auras.push({
                        slug: slug,
                        version: version,
                        wagoVersion: null,
                        created: null,
                        modified: null,
                        author: null,
                        encoded: null,
                        ignore: false
                      });
                    } else {
                      // there is already an aura with same "slug", check if version field needs to be updated
                      this.auras
                        .filter(
                          aura => aura.slug === slug && aura.version < version
                        )
                        .forEach(aura => (aura.version = version));
                    }
                  }
                }
              });
            });
          }
        });
        // get data from wago api
        const axios = require("axios");
        axios
          .get("https://data.wago.io/lookup/weakauras", {
            params: {
              ids: this.auras.map(aura => aura.slug).join() // !! size of request is not checked, can lead to too long urls
            },
            headers: {
              Identifier: this.accountHash
            },
            crossdomain: true
          })
          .then(response => {
            this.message("Auras's metadata received from Wago API", "ok");
            var promises = [];
            response.data.forEach(wagoData => {
              this.auras
                .filter(aura => aura.slug === wagoData.slug && !aura.ignore)
                .forEach(aura => {
                  // fetch aura data if :
                  // latest version on wago is newer than what is in WeakAurasSavedVariable
                  // and there isn't already an encoded string saved for latest version
                  // and you are not the author
                  if (
                    wagoData.version > aura.version &&
                    (aura.encoded === null ||
                      (!!aura.wagoVersion &&
                        wagoData.version > aura.wagoVersion)) &&
                    wagoData.username != this.wagoUsername
                  ) {
                    /*
                      this.message(
                        "Queue data request for aura " + aura.slug,
                        "info"
                      );
                      */
                    aura.created = wagoData.created;
                    aura.modified = wagoData.modified;
                    aura.author = wagoData.username;
                    aura.wagoVersion = wagoData.version;
                    aura.name = wagoData.name;
                    promises.push(
                      axios.get("https://data.wago.io/wago/raw/encoded", {
                        params: {
                          id: aura.slug
                        },
                        headers: {
                          Identifier: this.accountHash
                        },
                        crossdomain: true
                      })
                    );
                  }
                });
            });

            const promisesResolved = promises.map(promise =>
              promise.catch(err => {
                return {
                  config: { params: { id: err.config.params.id } },
                  status: err.response.status
                };
              })
            );

            let newStrings = [];
            let failStrings = [];
            axios
              .all(promisesResolved)
              .then(
                axios.spread((...args) => {
                  args.forEach(arg => {
                    const id = arg.config.params.id;
                    if (arg.status == 200) {
                      this.auras
                        .filter(aura => aura.slug == id)
                        .forEach(aura => {
                          const msg = 'New update for "' + aura.name + '"';
                          this.message(msg, "ok", aura);
                          newStrings.push(aura.name);
                          aura.encoded = arg.data;
                        });
                    } else if (arg.status == 404) {
                      // private or deleted aura
                      this.auras
                        .filter(aura => aura.slug == id)
                        .forEach(aura => {
                          this.message(
                            'Could not receive string for "' +
                              aura.name +
                              '", aura is private or was removed, ignoring this aura for next checks',
                            "error"
                          );
                          failStrings.push(aura.name);
                          aura.ignore = true;
                        });
                    } else {
                      this.auras
                        .filter(aura => aura.slug == id)
                        .forEach(aura => {
                          this.message(
                            'Error receiving encoded string for "' +
                              aura.name +
                              '" http code: ' +
                              arg.status,
                            "error"
                          );
                          failStrings.push(aura.name);
                        });
                    }
                  });
                })
              )
              .catch(error => {
                this.message("Can't read wago answer\n" + error, "error");
              })
              .then(() => {
                // we are done with wago API, update data.lua
                this.save(["auras"]);
                this.writeAddonData(newStrings, failStrings);
                this.fetching = false;
              });
          })
          .catch(error => {
            this.message("Can't read wago answer\n" + error, "error");
            this.fetching = false;
          });
      });
    },
    writeAddonData(newStrings, failStrings) {
      if (this.config.wowpath.valided) {
        const fs = require("fs");
        const AddonFolder = path.join(
          this.config.wowpath.value,
          "Interface",
          "Addons",
          "WeakAurasWagoUpdate"
        );
        // Make folder
        fs.mkdir(AddonFolder, err => {
          if (err && err.code != "EEXIST") {
            this.message("Can't create Addon directory", "error");
          } else {
            // Make data.lua
            var LuaOutput = "-- file generated automatically\n";
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
            this.auras.filter(aura => !!aura.encoded).forEach(aura => {
              LuaOutput += "  ['" + aura.slug + "'] = {\n";
              fields.forEach(field => {
                LuaOutput += "    " + field + ' = "' + aura[field] + '",\n';
              });
              LuaOutput += "  },\n";
            });
            LuaOutput += "}";
            fs.writeFile(path.join(AddonFolder, "data.lua"), LuaOutput, err => {
              if (err) this.message("data.lua could not be saved", "error");
              else {
                let msg =
                  countStrings +
                  " auras ready for update (" +
                  newStrings.length +
                  " new";
                if (failStrings.length > 0)
                  msg += ", " + failStrings.length + " error";
                msg += ")";
                this.message(msg, "ok");

                if (this.config.notify && newStrings.length > 0) {
                  let myNotification = new Notification("WeakAuras Update", {
                    body: newStrings.join("\n")
                  });
                  myNotification.onclick = () => {
                    this.$electron.ipcRenderer.send("open");
                  };
                }
              }
            });

            // Make WeakAurasWagoUpdate.toc
            const tocFile = `## Interface: 80000
## Title: WeakAuras Wago Update
## Author: WeakAuras Team
## Version: 1.0.0
## Notes: Keep your WeakAuras updated
## X-Category: Interface Enhancements
## DefaultState: Enabled
## Dependencies: WeakAuras, WeakAurasOptions

data.lua`;

            fs.writeFile(
              path.join(AddonFolder, "WeakAurasWagoUpdate.toc"),
              tocFile,
              err => {
                if (err)
                  this.message(
                    "WeakAurasWagoUpdate.toc could not be saved",
                    "error"
                  );
                //else this.message("WeakAurasWagoUpdate.toc saved", "ok");
              }
            );
            // schedule in 1 hour
            this.schedule = setTimeout(
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
@import url("https://fonts.googleapis.com/css?family=Source+Sans+Pro");

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: "Source Sans Pro", sans-serif;
  background-color: #252525;
  color: white;
}

#wrapper {
  height: 100vh;
  display: flex;
  background-color: #252525;
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
  height: 120px;
}

.logo {
  position: relative;
  display: inline-block;
  line-height: 1;
  width: 1.5em;
  height: 1.5em;
}

.walogo {
  width: 120px;
  height: 45px;
  top: 10px;
  left: 10px;
  position: fixed
}
.wagologo {
  width: 78px;
  height: 45px;
  position: fixed;
  top: 10px;
  right: 10px;
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

</style>