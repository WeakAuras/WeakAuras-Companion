<template>
  <div>
    <!-- <p v-if="configStep > 0 && configStep < 4">Configuration</p> -->
    <div id="header">
      <br>
      <img src="../assets/weakauras.png" class="walogo">
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <img src="../assets/wago.png" class="wagologo">
    </div>
    <!-- <div>Updater</div> -->
    <div></div>
    <div id="body" ref="body">
      <div v-if="configStep == 0">
        <div class="mid">
          <div class="btn btn-large btn-default" @click="configStep = 1">Configuration</div>
        </div>
      </div>
      <div v-if="configStep == 1" class="mid">
        <file-select :path.sync="WOWPath"></file-select>
        <br>
        <div v-if="WOWFolderIsGood" class="btn btn-large btn-default" @click="configStep = 2">Next</div>
        <div v-if="!WOWFolderIsGood && WOWPath"><br>Wrong Directory</div>
      </div>
      <div v-if="configStep == 2" class="mid">
        <div>Select your account</div>
        <div>
          <select v-model="Account" class="form-control">
            <option v-for="item in Accounts" :key="item.name">
              {{ item.name }}
            </option>
          </select>
        </div>
        <div v-if="Account && !AccountIsGood"><br>Can't use this account</div>
        <div v-if="Account && AccountIsGood">
          <br>
          <div class="btn btn-large btn-default" @click="configStep = 3">Next</div>
        </div>
      </div>
      <div v-if="configStep == 3" class="mid">
        <div>Wago Account Name (Optional)</div>
        <div><input type="text" v-model="wagoUsername"></div>
        <br>
        <div class="btn btn-large btn-default" @click="configStep = 4">Next</div>
      </div>
      <div v-if="configStep == 4">
        <!-- <div>Configuration done thank you {{wagoUsername}}</div> -->
      </div>
      <div class="messages">
        <div v-for="message in messages" :key="message.id">
          <span class="btn btn-mini" v-bind:class="{ 'btn-default': message.type == 'info', 'btn-positive': message.type == 'ok', 'btn-negative': message.type == 'error' }" :title="message.time">{{ message.type }}</span>
          <span>{{ message.text}}</span>
        </div>
      </div>
    </div>
    <div id='footer'>
      <a href="https://discord.gg/wa2" target="_blank"><img src="../assets/discord.png" class="logo" title="discord"></a>
      <a href="https://twitter.com/WeakAuras" target="_blank"><img src="../assets/twitter.png" class="logo" title="twitter"></a>
      <a href="https://facebook.com/WeakAuras" target="_blank"><img src="../assets/facebook.png" class="logo" title="facebook"></a>
      <a href="https://www.youtube.com/channel/UCEuzJlrsz27wUWlWn_HSEeg" target="_blank"><img src="../assets/youtube.png" class="logo" title="youtube"></a>
      <a href="https://github.com/WeakAuras/WeakAuras2" target="_blank"><img src="../assets/github.png" class="logo" title="github"></a>
      <a href="https://www.patreon.com/bePatron?u=3216523" target="_blank"><img src="../assets/patreon.png" class="logo" title="patreon"></a>
      <a href="https://mods.curse.com/addons/wow/weakauras-2" target="_blank"><img src="../assets/curse.png" class="logo" title="curse"></a>
    </div>
    <div class="menu">
      <img v-if="configStep == 4" src="../assets/update.png" @click="compareSVwithWago" title="check for update" class="menu-icon clickable">
      <img src="../assets/config.png" @click="reset" title="reset configuration" class="menu-icon clickable">
    </div>
    
  </div>
</template>

<script>
import FileSelect from "./LandingPage/FileSelect";
//require("electron").ipcRenderer.on("refresh", (event, message) => {
//  console.log("COUCOU"); // Prints 'whoooooooh!'
//});

export default {
  name: "landing-page",
  components: { FileSelect },
  data() {
    return {
      configStep: 0,
      messages: [],
      WOWPath: null, // wow path
      WOWFolderIsGood: false,
      Accounts: [], // account list
      Account: null, // name of the account selected
      AccountIsGood: false,
      hash: null, // hash of Account
      auras: [], // array of auras, slug field must be unique
      wagoUsername: null // ignore your own auras
    };
  },
  watch: {
    configStep() {
      this.clearMessages();
      this.save(["configStep"]);
      if (this.configStep == 4) {
        this.compareSVwithWago();
      }
    },
    WOWPath() {
      if (this.WOWPath != null) {
        // clean Accounts options
        while (this.Accounts.length > 0) {
          this.Accounts.pop();
        }
        // test if ${WOWPath}\WTF\Account exists
        const fs = require("fs");
        // this.message("wow folder selected: " + this.WOWPath, "info");
        const accountFolder = this.WOWPath + "\\WTF\\Account";
        fs.access(accountFolder, fs.constants.F_OK, err => {
          if (!err) {
            // add option for each account found
            fs.readdirSync(accountFolder).forEach(file => {
              if (file != "SavedVariables") {
                // this.message("Found account: " + file, "info");
                this.Accounts.push({ name: file });
                this.WOWFolderIsGood = true;
              }
            });
            this.save(["WOWPath"]);
          } else {
            this.message("Can't find World of Warcraft files", "error");
            this.WOWFolderIsGood = false;
          }
        });
      }
    },
    Account() {
      if (!!this.WOWPath && !!this.Account) {
        const fs = require("fs");
        // this.message("Account selected: " + this.Account, "info");
        const WeakAurasSavedVariable =
          this.WOWPath +
          "\\WTF\\Account\\" +
          this.Account +
          "\\SavedVariables\\WeakAuras.lua";
        fs.access(WeakAurasSavedVariable, fs.constants.F_OK, err => {
          if (!err) {
            // this.message("WeakAuras.lua found in SavedVariable", "info");
            this.hash = this.hashFnv32a(this.Account, true);
            this.save(["hash", "Account"]);
            this.AccountIsGood = true;
          } else {
            this.message("WeakAuras.lua is not in SavedVariable", "error");
            this.AccountIsGood = false;
          }
        });
      }
    }
  },
  created() {
    this.restore();
  },
  mounted() {
    console.log("mounted");
    // refresh on event (tray icon)
    this.$electron.ipcRenderer.on("refreshWago", (event, data) => {
      console.log("received event refresh");
      this.message("Received event refresh", "info");
      this.compareSVwithWago();
    });

    // resfresh every hour
    setInterval(() => {
      this.compareSVwithWago();
    }, 1000 * 60 * 60);
  },
  methods: {
    reset() {
      this.configStep = 0;
      this.WOWPath = null;
      this.WOWFolderIsGood = false;
      this.Account = null;
      this.AccountIsGood = false;
      this.hash = null;
      this.wagoUsername = null;
      while (this.Accounts.length > 0) {
        this.Accounts.pop();
      }
      while (this.messages.length > 0) {
        this.messages.pop();
      }
      while (this.auras.length > 0) {
        this.auras.pop();
      }
      this.save([
        "WOWPath",
        "wagoUsername",
        "Account",
        "auras",
        "hash",
        "configStep"
      ]);
    },
    open(link) {
      this.$electron.shell.openExternal(link);
    },
    save(fields) {
      const Store = require("electron-store");
      const store = new Store();

      fields.forEach(field => {
        store.set(field, this[field]);
        //this.message("Saved data: " + field, "info");
      });
    },
    restore() {
      const Store = require("electron-store");
      const store = new Store();

      const data = store.store;
      for (var field in data) {
        this[field] = data[field];
      }
      // this.message("Data from previous session restored", "info");
    },
    message(text, type) {
      console.log(text);
      const date = new Date();
      this.messages.push({
        id: this.messages.length,
        time: date.getHours() + ":" + date.getMinutes(),
        text: text,
        type: type
      });
      this.$nextTick(() => {
        var body = this.$refs.body;
        body.scrollTop = body.scrollHeight;
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
      const fs = require("fs");
      const luaparse = require("luaparse");
      luaparse.defaultOptions.comments = false;
      luaparse.defaultOptions.scope = true;
      let luaData;
      const WeakAurasSavedVariable =
        this.WOWPath +
        "\\WTF\\Account\\" +
        this.Account +
        "\\SavedVariables\\WeakAuras.lua";
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
            }
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
                          Identifier: this.hash
                        }
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

            let countNewStrings = 0;
            let countFailStrings = 0;
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
                          this.message(
                            'Received new string for "' + aura.name + '"',
                            "ok"
                          );
                          countNewStrings++;
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
                          countFailStrings++;
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
                          countFailStrings++;
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
                this.writeAddonData(countNewStrings, countFailStrings);
              });
          })
          .catch(error => {
            this.message("Can't read wago answer\n" + error, "error");
          });
      });
    },
    writeAddonData(countNewStrings, countFailStrings) {
      if (this.WOWPath !== null) {
        const fs = require("fs");
        const AddonFolder =
          this.WOWPath + "\\Interface\\Addons\\WeakAurasWagoUpdate";
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
            fs.writeFile(AddonFolder + "\\data.lua", LuaOutput, err => {
              if (err) this.message("data.lua could not be saved", "error");
              else {
                let msg =
                  countStrings +
                  " updated auras saved (" +
                  countNewStrings +
                  " new";
                if (countFailStrings > 0)
                  msg += ", " + countFailStrings + " error";
                msg += ")";
                this.message(msg, "ok");
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
              AddonFolder + "\\WeakAurasWagoUpdate.toc",
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
  text-align: center;
}

#header {
  width: 100%;
  text-align: center;
  background-color: #252525;
}
#body {
  width: 100%;
  height: 299px;
  max-height: 135px;
  background-color: #252525;
  overflow-y: auto;
}
#footer {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  text-align: center;
  background-color: #252525;
}

.reset-icon {
  position: absolute;
  right: 2px;
  top: 2px;
  width: 1.5em;
  height: 1.5em;
}

.menu {
  position: absolute;
  right: 2px;
  top: 2px;
}

.menu-icon {
  width: 1.5em;
  height: 1.5em;
}

.mid {
  margin: 0;
  position: absolute;
  top: 50%;
  width: 100%;
  text-align: center;
}

.clickable {
  cursor: pointer;
}

.messages {
  text-align: left;
  overflow: auto;
  font-family: "Courier New", Courier, monospace;
  font-size: small;
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
  cursor: default;
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

.logo {
  position: relative;
  display: inline-block;
  line-height: 1;
  width: 1.5em;
  height: 1.5em;
}

.walogo {
  width: 200px;
  height: 75px;
}
.wagologo {
  width: 130px;
  height: 75px;
}
</style>