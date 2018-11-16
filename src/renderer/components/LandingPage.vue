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
    <!--
    <div v-for="slug in slugs" :key="slug.slug">
      <div>
        slug: {{slug.slug}} by: {{slug.user}} version: {{slug.version}}
      </div>
    </div>
    -->
    <pre id="message">{{ msg }}</pre>
    <!-- <AuraList v-if="WeakAurasSavedVariable" :file="WeakAurasSavedVariable" @handleFile="handleFile"></AuraList> -->
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
      WeakAurasSavedVariable: null, // path to weakauras.lua in sv
      dataFile: null,
      slugs: [] // list all wago id used in local SV
      // slug fields: slug, created, modified, user, string, version, uid
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
          var slugs = [];
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
                  }
                });
                if (slug && !this.slugs[slug]) {
                  slugs.push(slug);
                }
              });
            }
          });

          // Make list of uniq "slugs" and get data from wago api
          const axios = require("axios");
          var itemsProcessed = 0;
          Array.from(new Set(slugs)).forEach((slug, index, array) => {
            axios
              .get("https://data.wago.io/lookup/wago?id=" + slug)
              .then(response => {
                let version = response.data.versions.total;
                this.slugs.push({
                  slug: response.data.slug,
                  created: response.data.date.created,
                  modified: response.data.date.modified,
                  user: response.data.user.name,
                  string: response.data.code.encoded,
                  version: response.data.versions.total,
                  uid: response.data.UID
                });
                this.message("Read info for " + slug, "ok");
              })
              .catch(error => {
                this.message("Can't read wago for " + slug, "error");
              })
              .then(() => {
                itemsProcessed++;
                if (itemsProcessed === array.length) {
                  // When finished collecting data from wago, save it to data.lua
                  this.writeData();
                }
              });
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
    writeData() {
      const fs = require("fs");
      var AddonFolder =
        this.WOWFolder.path + "\\Interface\\Addons\\WeakAurasWagoUpdate";
      this.message(
        "Finished reading info from Wago, writing data file " + AddonFolder,
        "info"
      );
      fs.mkdir(AddonFolder, err => {
        if (err && err.code != "EEXIST") {
          throw "up";
        } else {
          this.message("directory exists", "info");

          var LuaOutput = "-- file generated automatically\n";
          LuaOutput += "WeakAurasWagoUpdate = {\n";
          var fields = [
            "created",
            "modified",
            "user",
            "string",
            "version",
            "uid"
          ];
          for (let i = 0; i < this.slugs.length; i++) {
            var slug = this.slugs[i];
            LuaOutput += "  ['" + slug.slug + "'] = {\n";
            for (let j = 0; j < fields.length; j++) {
              LuaOutput +=
                "    " + fields[j] + ' = "' + slug[fields[j]] + '",\n';
            }
            LuaOutput += "  },\n";
          }
          LuaOutput += "}\n";
          fs.writeFile(AddonFolder + "\\data.lua", LuaOutput, err => {
            // throws an error, you could also catch it here
            if (err) this.message("Data.lua could not be saved", "error");
            else this.message("Data.lua saved", "ok");
          });
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