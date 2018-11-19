<template>
  <div>
    <div v-if="!WOWFolderIsGood">
      <p><file-select v-model="WOWFolder"></file-select></p>
    </div>
    <div v-if="Accounts.render">
      <select v-model="Account">
        <option v-for="option in Accounts.options" v-bind:key="option">
          {{ option }}
        </option>
      </select>
      <span>Selected: {{ Account }}</span>
    </div>
    <pre id="message">{{ msg }}</pre>
  </div>
</template>

<script>
import FileSelect from "./LandingPage/FileSelect";

export default {
  name: "landing-page",
  components: { FileSelect },
  data() {
    return {
      msg: "",
      WOWFolder: null, // path to wow
      WOWFolderIsGood: false,
      Accounts: {
        options: [], // list accounts
        render: false
      },
      Account: null, // name of the account used
      hash: null, // hash of Account
      WeakAurasSavedVariable: null, // path to weakauras.lua in sv
      auras: [], // array of auras, slug field must be uniq
      wagoUsername: null // ignore your own auras
    };
  },
  watch: {
    WOWFolder() {
      var fs = require("fs");
      this.message("wow folder selected: " + this.WOWFolder.path, "info");
      var accountFolder = this.WOWFolder.path + "\\WTF\\Account";
      fs.access(accountFolder, fs.constants.F_OK, err => {
        this.message(
          `${accountFolder} ${err ? "does not exist" : "exists"}`,
          `${err ? "error" : "ok"}`
        );
        if (!err) {
          var regex = /.*#[0-9]/;
          fs.readdirSync(accountFolder).forEach(file => {
            var found = file.match(regex);
            if (found) {
              this.message("Found account: " + file, "ok");
              this.Accounts.options.push(file);
            }
          });
          this.Accounts.render = true;
        }
      });
    },
    Account() {
      var fs = require("fs");
      this.message("Account selected: " + this.Account, "info");
      const WeakAurasSavedVariable =
        this.WOWFolder.path +
        "\\WTF\\Account\\" +
        this.Account +
        "\\SavedVariables\\WeakAuras.lua";
      fs.access(WeakAurasSavedVariable, fs.constants.F_OK, err => {
        this.message(
          "Test if WeakAuras.lua is in SavedVariable:" +
            `${err ? "does not exist" : "exists"}`,
          `${err ? "error" : "ok"}`
        );
        if (!err) {
          this.hash = this.hashFnv32a(this.Account, true);
          this.WeakAurasSavedVariable = WeakAurasSavedVariable;
        }
      });
    },
    WeakAurasSavedVariable() {
      const fs = require("fs");
      const luaparse = require("luaparse");
      luaparse.defaultOptions.comments = false;
      luaparse.defaultOptions.scope = true;
      let luaData;
      // Read WeakAuras.lua
      fs.readFile(
        this.WeakAurasSavedVariable,
        "utf-8",
        (err, data, luaData) => {
          if (err) {
            this.message(
              "An error ocurred reading the file :" + err.message,
              "error"
            );
            return;
          }
          // Parse WeakAuras.lua
          let WeakAurasSavedData = luaparse.parse(data);
          if (
            WeakAurasSavedData.body[0].variables[0].name != "WeakAurasSaved"
          ) {
            this.messageit("File selected is not WeakAuras's SV", "error");
            return;
          } else {
            this.message("WeakAuras.lua looks good", "ok");
          }

          let pattern = /(https:\/\/wago.io\/)([^\/]+)\/?(\d*)/;
          WeakAurasSavedData.body[0].init[0].fields.forEach(obj => {
            if (obj.key.value == "displays") {
              obj.value.fields.forEach(obj2 => {
                let id = obj2.key.value;
                let slug, url, version;

                obj2.value.fields.forEach(obj3 => {
                  if (obj3.key.value == "url") {
                    url = obj3.value.value;
                    let pattern_result = url.match(pattern);
                    version = pattern_result[3];
                    slug = pattern_result[2];

                    if (slug) {
                      let length = this.auras.filter(aura => aura.slug === slug)
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
                              "Received encoded string for aura " + aura.name,
                              "ok"
                            );
                            aura.encoded = arg.data;
                          });
                      } else if (arg.status == 404) {
                        // private or deleted aura
                        this.auras
                          .filter(aura => aura.slug == id)
                          .forEach(aura => {
                            this.message(
                              "Could not receive encoded string for aura " +
                                aura.name +
                                ", aura is private or was removed, ignoring this aura for next checks",
                              "error"
                            );
                            aura.ignore = true;
                          });
                      } else {
                        this.auras
                          .filter(aura => aura.slug == id)
                          .forEach(aura => {
                            this.message(
                              "Error receiving encoded string for aura " +
                                aura.name +
                                " http code: " +
                                arg.status,
                              "error"
                            );
                          });
                      }
                    });
                  })
                )
                .catch(error => {
                  this.message(
                    "Can't read wago answer for string\n" + error,
                    "error"
                  );
                })
                .then(() => {
                  // we are done with wago API, update data.lua
                  this.writeData();
                });
            })
            .catch(error => {
              this.message("Can't read wago answer\n" + error, "error");
            });
        }
      );
    }
  },
  methods: {
    open(link) {
      this.$electron.shell.openExternal(link);
    },
    message(msg, err) {
      console.log(msg);
      this.msg += err + " : " + msg + "\n";
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
    writeData() {
      const fs = require("fs");
      var AddonFolder =
        this.WOWFolder.path + "\\Interface\\Addons\\WeakAurasWagoUpdate";
      this.message(
        "Finished reading info from Wago, writing data file " + AddonFolder,
        "info"
      );
      // Make folder
      fs.mkdir(AddonFolder, err => {
        if (err && err.code != "EEXIST") {
          throw "up";
        } else {
          this.message("Directory exists", "ok");

          // Make data.lua
          var LuaOutput = "-- file generated automatically\n";
          LuaOutput += "WeakAurasWagoUpdate = {\n";
          var fields = [
            "name",
            "created",
            "modified",
            "author",
            "encoded",
            "wagoVersion"
          ];
          this.auras.filter(aura => !!aura.encoded).forEach(aura => {
            LuaOutput += "  ['" + aura.slug + "'] = {\n";
            fields.forEach(field => {
              LuaOutput += "    " + field + ' = "' + aura[field] + '",\n';
            });
            LuaOutput += "  },\n";
          });
          LuaOutput += "}";
          fs.writeFile(AddonFolder + "\\data.lua", LuaOutput, err => {
            if (err) this.message("Data.lua could not be saved", "error");
            else this.message("Data.lua saved", "ok");
          });

          // Make WeakAurasWagoUpdate.toc
          let tocFile = `## Interface: 80000
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
              else this.message("WeakAurasWagoUpdate.toc saved", "ok");
            }
          );
        }
      });
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
}
</style>