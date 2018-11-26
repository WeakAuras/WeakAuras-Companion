<template>
  <div id="wrapper">
    <!-- <p v-if="configStep > 0 && configStep < 4">Configuration</p> -->
    <header>
      <img src="../assets/weakauras.png" class="walogo">
      <div class="btn btn-large btn-default" @click="configStep = 0">Main</div>
      <div class="btn btn-large btn-default" @click="configStep = 1">Settings</div>
      <div class="btn btn-large btn-default" @click="configStep = 2">About</div>
      <img src="../assets/wago.png" class="wagologo">
    </header>
    <main>
      <div v-if="configStep === 0" id="dashboard">
        <div id="sync">
          <br><br><br><br>
          <div v-if="fetching" class="sk-fading-circle">
            <div class="sk-circle1 sk-circle"></div>
            <div class="sk-circle2 sk-circle"></div>
            <div class="sk-circle3 sk-circle"></div>
            <div class="sk-circle4 sk-circle"></div>
            <div class="sk-circle5 sk-circle"></div>
            <div class="sk-circle6 sk-circle"></div>
            <div class="sk-circle7 sk-circle"></div>
            <div class="sk-circle8 sk-circle"></div>
            <div class="sk-circle9 sk-circle"></div>
            <div class="sk-circle10 sk-circle"></div>
            <div class="sk-circle11 sk-circle"></div>
            <div class="sk-circle12 sk-circle"></div>
          </div>
          <div class="btn btn-refresh" @click="compareSVwithWago" v-bind:class="{ 'btn-negative': !config.wowpath.valided || !config.account.valided }">
            Search updates on Wago
          </div>
          <div id="lastupdate">Last update {{schedule.last | fromNow}}</div>
        </div>
        <div id="messages" ref="messages">
          <div v-for="message in messages" :key="message.id">
            <span class="btn btn-mini" v-bind:class="{ 'btn-default': message.type == 'info', 'btn-positive': message.type == 'ok', 'btn-negative': message.type == 'error' }" :title="message.time">{{ message.type }}</span>
            <a :href="message.url" target="_blank" v-if="message.url" :title="message.url" class="url">{{ message.text }}</a>
            <span v-else>{{ message.text}}</span>
          </div>
        </div>
      </div>
      <div v-if="configStep === 1" id="config">
        <div class="configtitle">Game Settings</div>
        <div class="configblock">
          <file-select :path.sync="config.wowpath.value"></file-select>
          <span v-if="config.wowpath.value">
            <span v-if="config.wowpath.valided" class="green">✔</span>
            <span v-else class="red">✘</span>
          </span>
          <span v-if="config.wowpath.valided">
            <p class="configlabel">Select account</p>
            <select v-model="config.account.value" class="form-control">
              <option v-for="item in config.account.choices" :key="item.name">
                {{ item.name }}
              </option>
            </select>
            <span v-if="config.account.value">
              <span v-if="config.account.valided" class="green">✔</span>
              <span v-else class="red">✘</span>
            </span>
          </span>
        </div>
        <div class="configtitle">Wago Settings</div>
        <div class="configblock">
          <p class="configlabel">Wago account (optional)</p>
          <input type="text" v-model="config.wagoUsername" size="11">
        </div>
        <div class="configtitle">Addon Settings</div>
        <div class="configblock">
          <input type="checkbox" v-model="config.notify"> Receive a notification when an aura is updated<br><br>
          <p class="configlabel">Startup</p>
          <input type="checkbox" v-model="config.autostart"> Launch client with your computer<br>
          <input type="checkbox" v-model="config.startminimize"> Start client minimized
        </div>
        <br><br>
        <div class="btn btn-default" @click="reset">Reset Settings and Data</div><br><br>
      </div>
      <div v-if="configStep === 2" id="about" style="display: flex">
        <div style="flex: 50%">
          <h2>WeakAuras Team</h2><br>
          <p>
            <a href="https://discord.gg/wa2" target="_blank"><img src="../assets/discord.png" class="logo" title="discord"> Discord</a><br>
            <a href="https://twitter.com/WeakAuras" target="_blank"><img src="../assets/twitter.png" class="logo" title="twitter"> Twitter</a><br>
            <a href="https://facebook.com/WeakAuras" target="_blank"><img src="../assets/facebook.png" class="logo" title="facebook"> Facebook</a><br>
            <a href="https://www.youtube.com/channel/UCEuzJlrsz27wUWlWn_HSEeg" target="_blank"><img src="../assets/youtube.png" class="logo" title="youtube"> Youtube</a><br>
            <a href="https://github.com/WeakAuras/WeakAuras2" target="_blank"><img src="../assets/github.png" class="logo" title="github"> Github</a><br>
            <a href="https://www.patreon.com/WeakAuras" target="_blank"><img src="../assets/patreon.png" class="logo" title="patreon"> Patreon</a><br>
            <a href="https://mods.curse.com/addons/wow/weakauras-2" target="_blank"><img src="../assets/curse.png" class="logo" title="curse"> Curse</a><br>
          </p>
        </div>
        <div style="flex: 50%">
          <h2>Wago</h2><br>
          <p>          
            <a href="https://wago.io/" target="_blank"><img src="../assets/wago.png" class="logo" title="wago"> Wago</a><br>
            <a href="https://github.com/oratory/wago.io" target="_blank"><img src="../assets/github.png" class="logo" title="github"> Github</a><br>
            <a href="https://www.patreon.com/wago" target="_blank"><img src="../assets/patreon.png" class="logo" title="patreon"> Patreon</a><br>
          </p>
        </div>
      </div>
    </main>
    <footer>
      <a href="https://discord.gg/wa2" target="_blank"><img src="../assets/discord.png" class="logo" title="discord"></a>
      <a href="https://twitter.com/WeakAuras" target="_blank"><img src="../assets/twitter.png" class="logo" title="twitter"></a>
      <a href="https://facebook.com/WeakAuras" target="_blank"><img src="../assets/facebook.png" class="logo" title="facebook"></a>
      <a href="https://www.youtube.com/channel/UCEuzJlrsz27wUWlWn_HSEeg" target="_blank"><img src="../assets/youtube.png" class="logo" title="youtube"></a>
      <a href="https://github.com/WeakAuras/WeakAuras2" target="_blank"><img src="../assets/github.png" class="logo" title="github"></a>
      <a href="https://www.patreon.com/WeakAuras" target="_blank"><img src="../assets/patreon.png" class="logo" title="patreon"></a>
      <a href="https://mods.curse.com/addons/wow/weakauras-2" target="_blank"><img src="../assets/curse.png" class="logo" title="curse"></a>
    </footer>
  </div>
</template>

<script>
import FileSelect from "./LandingPage/FileSelect";

import path from "path";
import moment from "moment";

const Store = require("electron-store");
const store = new Store();

const AutoLaunch = require("auto-launch");
var AutoLauncher = new AutoLaunch({
  name: "WeakAuras Wago Updater"
});

export default {
  name: "landing-page",
  components: { FileSelect },
  data() {
    return {
      configStep: 0,
      auras: [], // array of auras, slug field must be unique
      messages: [],
      fetching: false,
      config: {
        wowpath: {
          val: null, // wow path
          valided: false
        },
        account: {
          val: null, // name of the account selected
          valided: false,
          hash: null,
          choices: []
        },
        wagoUsername: null, // ignore your own auras
        autostart: false,
        startminimize: false,
        notify: true
      },
      schedule: {
        id: null, // 1h setTimeout id
        everymin: null, // 1mn setInterval() id
        last: null // last compareSVwithWago()
      }
    };
  },
  filters: {
    fromNow: value => {
      if (!value) return "n/a";
      return moment(value).fromNow();
    }
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
    "schedule.last"() {
      this.save(["save"]);
    },
    config: {
      handler() {
        this.save(["config"]);
      },
      deep: true
    },
    "config.autostart"() {
      if (this.autostart) {
        AutoLauncher.enable();
      } else {
        AutoLauncher.disable();
      }
    },
    "config.wowpath.value"() {
      if (!!this.config.wowpath.value) {
        // clean Accounts options
        while (this.config.account.choices.length > 0) {
          this.config.account.choices.pop();
        }
        // test if ${wowpath}\WTF\Account exists
        const fs = require("fs");
        const accountFolder = path.join(
          this.config.wowpath.value,
          "WTF",
          "Account"
        );
        fs.access(accountFolder, fs.constants.F_OK, err => {
          if (!err) {
            // add option for each account found
            fs.readdirSync(accountFolder).forEach(file => {
              if (file != "SavedVariables") {
                this.config.account.choices.push({ name: file });
                this.config.wowpath.valided = true;
              }
            });
          } else {
            this.config.wowpath.valided = false;
          }
        });
      }
    },
    "config.account.value"() {
      if (this.config.wowpath.valided && !!this.config.account.value) {
        const fs = require("fs");
        const WeakAurasSavedVariable = path.join(
          this.config.wowpath.value,
          "WTF",
          "Account",
          this.config.account.value,
          "SavedVariables",
          "WeakAuras.lua"
        );
        fs.access(WeakAurasSavedVariable, fs.constants.F_OK, err => {
          if (!err) {
            this.config.account.hash = this.hashFnv32a(
              this.config.account.value,
              true
            );
            this.config.account.valided = true;
          } else {
            this.config.account.valided = false;
          }
        });
      }
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
  methods: {
    reset() {
      this.config = {
        wowpath: {
          value: null, // wow path
          valided: false
        },
        account: {
          value: null, // name of the account selected
          valided: false,
          hash: null,
          choices: []
        },
        wagoUsername: null, // ignore your own auras
        autostart: false,
        startminimize: false
      };
      this.schedule.last = null;
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
      this.schedule.id = null;
    },
    message(text, type, url) {
      //console.log(text);
      const date = moment().format("hh:mm:ss");
      this.messages.push({
        id: this.messages.length,
        time: date,
        text: text,
        type: type,
        url: url
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
    hashFnv32a(str, asString, seed) {
      // Calculate a 32 bit FNV-1a hash
      var i,
        l,
        hval = seed === undefined ? 0x811c9dc5 : seed;

      for (i = 0, l = str.length; i < l; i++) {
        hval ^= str.charCodeAt(i);
        hval +=
          (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
      }
      if (asString) {
        // Convert to 8 digit hex string
        return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
      }
      return hval >>> 0;
    },
    compareSVwithWago() {
      if (!this.config.wowpath.valided || !this.config.account.valided) {
        this.message("Configuration is not finished", "error");
        return;
      }
      if (this.fetching) return; // prevent spamming button
      this.fetching = true; // show animation
      if (this.schedule.id) clearTimeout(this.schedule.id); // cancel next 1h schedule
      if (this.schedule.everymin) clearInterval(this.schedule.everymin); // cancel 1mn repetition schedule
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
              Identifier: this.hash
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
                          Identifier: this.config.account.hash
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
                          const url = "https://wago.io/" + aura.slug;
                          this.message(msg, "ok", url);
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
                  let myNotification = new Notification("WeakAuras Updated", {
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
            this.schedule.id = setTimeout(
              this.compareSVwithWago,
              1000 * 60 * 60
            );
            this.schedule.last = new Date();
            // repeat every minutes
            this.schedule.everymin = setInterval(() => {
              const tmp = this.schedule.last;
              this.schedule.last = null;
              this.schedule.last = tmp;
            }, 1000 * 60);
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
  padding: 5px 0;
  text-align: center;
  padding-top: 5px;
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

.reset-icon {
  position: absolute;
  right: 2px;
  top: 2px;
  width: 1.5em;
  height: 1.5em;
}

#dashboard {
  height: 100%;
  display: flex;
  flex-direction: column;
}
#sync {
  flex: 1;
  text-align: center;
}
#messages {
  text-align: left;
  overflow: auto;
  font-family: "Courier New", Courier, monospace;
  font-size: small;
  height: 120px;
}
#about a {
  display: flex;
  align-items: center;
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
  float: left;
  margin-left: 50px;
}
.wagologo {
  width: 78px;
  height: 45px;
  float: right;
  margin-right: 50px;
}

#config,
#about {
  margin-left: 50px;
  text-align: left;
}
.configlabel {
  color: gray;
}
input,
select,
.fakeinput {
  padding: 2px;
  font-size: small;
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
.configtitle {
  font-size: 20px;
  margin: 10px 0px;
}
.configblock {
  margin-left: 30px;
}
#lastupdate {
  font-size: small;
}
#about > .valign {
  flex: 50%;
  align-items: center;
}
.sk-fading-circle {
  width: 40px;
  height: 40px;
  position: fixed;
  top: 50%;
  left: 50%;
  margin-top: -130px;
  margin-left: -20px;
}

.sk-fading-circle .sk-circle {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
}

.sk-fading-circle .sk-circle:before {
  content: "";
  display: block;
  margin: 0 auto;
  width: 15%;
  height: 15%;
  background-color: rgb(209, 202, 202);
  border-radius: 100%;
  -webkit-animation: sk-circleFadeDelay 1.2s infinite ease-in-out both;
  animation: sk-circleFadeDelay 1.2s infinite ease-in-out both;
}
.sk-fading-circle .sk-circle2 {
  -webkit-transform: rotate(30deg);
  -ms-transform: rotate(30deg);
  transform: rotate(30deg);
}
.sk-fading-circle .sk-circle3 {
  -webkit-transform: rotate(60deg);
  -ms-transform: rotate(60deg);
  transform: rotate(60deg);
}
.sk-fading-circle .sk-circle4 {
  -webkit-transform: rotate(90deg);
  -ms-transform: rotate(90deg);
  transform: rotate(90deg);
}
.sk-fading-circle .sk-circle5 {
  -webkit-transform: rotate(120deg);
  -ms-transform: rotate(120deg);
  transform: rotate(120deg);
}
.sk-fading-circle .sk-circle6 {
  -webkit-transform: rotate(150deg);
  -ms-transform: rotate(150deg);
  transform: rotate(150deg);
}
.sk-fading-circle .sk-circle7 {
  -webkit-transform: rotate(180deg);
  -ms-transform: rotate(180deg);
  transform: rotate(180deg);
}
.sk-fading-circle .sk-circle8 {
  -webkit-transform: rotate(210deg);
  -ms-transform: rotate(210deg);
  transform: rotate(210deg);
}
.sk-fading-circle .sk-circle9 {
  -webkit-transform: rotate(240deg);
  -ms-transform: rotate(240deg);
  transform: rotate(240deg);
}
.sk-fading-circle .sk-circle10 {
  -webkit-transform: rotate(270deg);
  -ms-transform: rotate(270deg);
  transform: rotate(270deg);
}
.sk-fading-circle .sk-circle11 {
  -webkit-transform: rotate(300deg);
  -ms-transform: rotate(300deg);
  transform: rotate(300deg);
}
.sk-fading-circle .sk-circle12 {
  -webkit-transform: rotate(330deg);
  -ms-transform: rotate(330deg);
  transform: rotate(330deg);
}
.sk-fading-circle .sk-circle2:before {
  -webkit-animation-delay: -1.1s;
  animation-delay: -1.1s;
}
.sk-fading-circle .sk-circle3:before {
  -webkit-animation-delay: -1s;
  animation-delay: -1s;
}
.sk-fading-circle .sk-circle4:before {
  -webkit-animation-delay: -0.9s;
  animation-delay: -0.9s;
}
.sk-fading-circle .sk-circle5:before {
  -webkit-animation-delay: -0.8s;
  animation-delay: -0.8s;
}
.sk-fading-circle .sk-circle6:before {
  -webkit-animation-delay: -0.7s;
  animation-delay: -0.7s;
}
.sk-fading-circle .sk-circle7:before {
  -webkit-animation-delay: -0.6s;
  animation-delay: -0.6s;
}
.sk-fading-circle .sk-circle8:before {
  -webkit-animation-delay: -0.5s;
  animation-delay: -0.5s;
}
.sk-fading-circle .sk-circle9:before {
  -webkit-animation-delay: -0.4s;
  animation-delay: -0.4s;
}
.sk-fading-circle .sk-circle10:before {
  -webkit-animation-delay: -0.3s;
  animation-delay: -0.3s;
}
.sk-fading-circle .sk-circle11:before {
  -webkit-animation-delay: -0.2s;
  animation-delay: -0.2s;
}
.sk-fading-circle .sk-circle12:before {
  -webkit-animation-delay: -0.1s;
  animation-delay: -0.1s;
}

@-webkit-keyframes sk-circleFadeDelay {
  0%,
  39%,
  100% {
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
}

@keyframes sk-circleFadeDelay {
  0%,
  39%,
  100% {
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
}

.btn {
  display: inline-block;
  padding: 3px 8px;
  margin-bottom: 0;
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  background-image: none;
  border: 1px solid transparent;
  border-radius: 4px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.06);
  -webkit-app-region: no-drag;
}
.btn:focus {
  outline: none;
  box-shadow: none;
}

.btn-large {
  padding: 6px 12px;
}
.btn-mini {
  padding: 2px 6px;
  width: 50px;
}
.btn-refresh {
  background-color: #333;
  padding: 8px 8px;
  font-size: large;
}
.btn-refresh:hover {
  background-color: rgb(71, 71, 71);
}
.btn-default {
  color: #333;
  border-top-color: #c2c0c2;
  border-right-color: #c2c0c2;
  border-bottom-color: #a19fa1;
  border-left-color: #c2c0c2;
  background-color: #fcfcfc;
  background-image: -webkit-gradient(
    linear,
    left top,
    left bottom,
    color-stop(0%, #fcfcfc),
    color-stop(100%, #f1f1f1)
  );
  background-image: -webkit-linear-gradient(top, #fcfcfc 0%, #f1f1f1 100%);
  background-image: linear-gradient(to bottom, #fcfcfc 0%, #f1f1f1 100%);
}
.btn-default:active {
  background-color: #ddd;
  background-image: none;
}
.btn-primary {
  border-color: #388df8;
  border-bottom-color: #0866dc;
  background-color: #6eb4f7;
  background-image: -webkit-gradient(
    linear,
    left top,
    left bottom,
    color-stop(0%, #6eb4f7),
    color-stop(100%, #1a82fb)
  );
  background-image: -webkit-linear-gradient(top, #6eb4f7 0%, #1a82fb 100%);
  background-image: linear-gradient(to bottom, #6eb4f7 0%, #1a82fb 100%);
}
.btn-primary:active {
  background-color: #3e9bf4;
  background-image: -webkit-gradient(
    linear,
    left top,
    left bottom,
    color-stop(0%, #3e9bf4),
    color-stop(100%, #0469de)
  );
  background-image: -webkit-linear-gradient(top, #3e9bf4 0%, #0469de 100%);
  background-image: linear-gradient(to bottom, #3e9bf4 0%, #0469de 100%);
}

.btn-positive {
  border-color: #29a03b;
  border-bottom-color: #248b34;
  background-color: #5bd46d;
  background-image: -webkit-gradient(
    linear,
    left top,
    left bottom,
    color-stop(0%, #5bd46d),
    color-stop(100%, #29a03b)
  );
  background-image: -webkit-linear-gradient(top, #5bd46d 0%, #29a03b 100%);
  background-image: linear-gradient(to bottom, #5bd46d 0%, #29a03b 100%);
}
.btn-positive:active {
  background-color: #34c84a;
  background-image: -webkit-gradient(
    linear,
    left top,
    left bottom,
    color-stop(0%, #34c84a),
    color-stop(100%, #248b34)
  );
  background-image: -webkit-linear-gradient(top, #34c84a 0%, #248b34 100%);
  background-image: linear-gradient(to bottom, #34c84a 0%, #248b34 100%);
}

.btn-negative {
  border-color: #fb2f29;
  border-bottom-color: #fb1710;
  background-color: #fd918d;
  background-image: -webkit-gradient(
    linear,
    left top,
    left bottom,
    color-stop(0%, #fd918d),
    color-stop(100%, #fb2f29)
  );
  background-image: -webkit-linear-gradient(top, #fd918d 0%, #fb2f29 100%);
  background-image: linear-gradient(to bottom, #fd918d 0%, #fb2f29 100%);
}
.btn-negative:active {
  background-color: #fc605b;
  background-image: -webkit-gradient(
    linear,
    left top,
    left bottom,
    color-stop(0%, #fc605b),
    color-stop(100%, #fb1710)
  );
  background-image: -webkit-linear-gradient(top, #fc605b 0%, #fb1710 100%);
  background-image: linear-gradient(to bottom, #fc605b 0%, #fb1710 100%);
}
</style>