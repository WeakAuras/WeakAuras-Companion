<template>
  <div id="config">
    <div class="title">
      {{ $t("app.config.gameSettings" /* Game Settings */) }}
    </div>
    <div class="block">
      <file-select
        :path.sync="config.wowpath.value"
        :defaultPath="defaultWOWPath"
      >
        {{ $t("app.fileselect.wowfolder" /* World of Warcraft Folder */) }}
      </file-select>
      <i v-if="config.wowpath.valided" class="material-icons green folder">
        check_circle_outline
      </i>
      <i v-else class="material-icons red folder">error_outline</i>
      <span v-if="config.wowpath.valided">
        <p class="label">
          {{ $t("app.config.selectAccount" /* Select WoW Account */) }}
        </p>
        <select v-model="config.account.value" class="form-control">
          <option v-for="item in config.account.choices" :key="item.name">
            {{ item.name }}
          </option>
        </select>
        <i v-if="config.account.valided" class="material-icons green">
          check_circle_outline
        </i>
        <i
          v-else-if="!config.account.value"
          class="material-icons red"
          v-tooltip="{
            content: $t(
              'app.config.account.selectaccounttooltip' /* Select an account */
            ),
            html: false
          }"
        >
          error_outline
        </i>
        <i
          v-else
          class="material-icons red"
          v-tooltip="{
            content: $t(
              'app.config.account.notvalidtooltip' /* We can’t find any data from WeakAuras in this account. Do you have the addon installed? */
            ),
            html: false
          }"
        >
          error_outline
        </i>
      </span>
    </div>
    <div class="title">
      {{ $t("app.config.wagoSettings" /* Wago Settings */) }}
    </div>
    <div class="block">
      <p class="label">
        {{ $t("app.config.wagoAccount" /* Set Wago Account (optional) */) }}
      </p>
      <input type="text" v-model="wagoUsername" size="11" />
      <v-button @click="config.wagoUsername = wagoUsername">{{
        $t("app.config.ok" /* OK */)
      }}</v-button>
      <i v-if="config.wagoUsername" class="material-icons green">
        check_circle_outline
      </i>
      <br /><br />
      <checkbox v-model="config.ignoreOwnAuras">
        {{
          $t("app.config.ignoreOwnAuras" /* Ignore auras from your account */)
        }}
      </checkbox>
    </div>
    <div class="title">
      {{ $t("app.config.clientSettings" /* Client Settings */) }}
    </div>
    <div class="block">
      <checkbox v-model="config.showAllAuras">
        {{ $t("app.config.showallauras" /* Show auras without updates */) }}
      </checkbox>
      <p class="label">{{ $t("app.config.lang" /* Language */) }}</p>
      <select v-model="config.lang" class="form-control language">
        <option
          v-for="lang in langs"
          :value="lang.value"
          v-html="lang.text"
          :key="lang.value"
        ></option> </select
      ><br /><br />
      <checkbox v-model="config.notify">
        {{
          $t(
            "app.config.notification" /* System notification when new updates are ready for in-game installation */
          )
        }}
      </checkbox>

      <p class="label subtitle">{{ $t("app.config.startup" /* Startup */) }}</p>
      <div class="option">
        <checkbox v-model="config.autostart">
          {{
            $t("app.config.autoStart" /* Launch client with your computer */)
          }}
        </checkbox>
      </div>
      <div class="option">
        <checkbox v-model="config.startminimize">
          {{ $t("app.config.minimized" /* Start client minimized */) }}
        </checkbox>
      </div>
    </div>
    <div
      class="backup"
      v-if="
        config.account.choices[choiceIndex] &&
          config.account.choices[choiceIndex].backup
      "
    >
      <div class="title">
        {{ $t("app.config.backup.title" /* WeakAuras Backup */) }}
      </div>
      <div class="block">
        <p class="label">
          <checkbox v-model="config.account.choices[choiceIndex].backup.active">
            {{ $t("app.config.backup.activate" /* Activate */) }}
          </checkbox>
        </p>
        <div
          v-if="config.account.choices[choiceIndex].backup.active"
          style="display: inline;"
        >
          <file-select
            :path.sync="config.account.choices[choiceIndex].backup.path"
            :createDirectory="true"
            :defaultPath="defaultBackupPath"
          >
            {{ $t("app.config.backup.backupfolder" /* Backup Folder */) }}
          </file-select>
          <span class="explorer" @click="openBackupDir()">
            {{ $t("app.config.backup.openfolder" /* Open in Explorer */) }}
          </span>
          <p class="label">
            {{ $t("app.config.backup.dedicatedsize" /* Dedicated size */) }}
          </p>
          <select v-model="config.account.choices[choiceIndex].backup.maxsize">
            <option value="50">50mb</option>
            <option value="100">100mb</option>
            <option value="500">500mb</option>
          </select>
        </div>
      </div>
    </div>
    <br /><br />
    <div class="block">
      <v-button @click="reset" type="reset">{{
        $t("app.config.reset" /* Reset Settings and Data */)
      }}</v-button>
    </div>
    <br /><br />
  </div>
</template>

<script>
import fs from "fs";
import path from "path";
import Vue from "vue";
import VTooltip from "v-tooltip";
import AutoLaunch from "auto-launch";
import { shell } from "electron";
import Button from "./Button.vue";
import Checkbox from "./Checkbox.vue";
import FileSelect from "./FileSelect.vue";

Vue.use(VTooltip);
const regedit = require("regedit");

let wowDefaultPath = "";
if (process.platform === "win32") {
  const key =
    "HKLM\\SOFTWARE\\WOW6432Node\\Blizzard Entertainment\\World of Warcraft";

  regedit.list(key, (err, result) => {
    if (err) throw err;
    else {
      // eslint-disable-next-line no-console
      wowDefaultPath = path.join(result[key].values.InstallPath.value, "..");
    }
  });
}

const userDataPath = require("electron").remote.app.getPath("userData");

const AutoLauncher = new AutoLaunch({
  name: "WeakAuras Companion"
});
export default Vue.extend({
  props: ["config"],
  data() {
    return {
      langs: [
        { value: "zh-cn", text: "中文 (简体) (zh-cn)" },
        { value: "de", text: "Deutsch (de)" },
        { value: "en", text: "English (en)" },
        { value: "fr", text: "Français (fr)" },
        { value: "ru", text: "Русский (ru)" }
      ],
      wagoUsername: this.config.wagoUsername,
      choiceIndex: this.config.account.choices.findIndex(
        account => account.name === this.config.account.value
      ),
      defaultWOWPath: wowDefaultPath,
      defaultBackupPath: path.join(userDataPath, "WeakAurasData-Backup")
    };
  },
  components: {
    Checkbox,
    FileSelect,
    "v-button": Button
  },
  methods: {
    reset() {
      this.$parent.reset();
      this.wagoUsername = null;
    },
    openBackupDir() {
      shell.openItem(this.config.account.choices[this.choiceIndex].backup.path);
    }
  },
  watch: {
    // eslint-disable-next-line func-names
    "config.autostart": function() {
      if (this.config.autostart) {
        AutoLauncher.enable();
      } else {
        AutoLauncher.disable();
      }
    },
    // eslint-disable-next-line func-names
    "config.wowpath.value": function() {
      this.config.wowpath.valided = false;
      if (this.config.wowpath.value) {
        // clean Accounts options
        while (this.config.account.choices.length > 0) {
          this.config.account.choices.pop();
        }
        // test if ${wowpath}\WTF\Account exists
        const accountFolder = path.join(
          this.config.wowpath.value,
          "_retail_",
          "WTF",
          "Account"
        );
        fs.access(accountFolder, fs.constants.F_OK, err => {
          if (!err) {
            // add option for each account found
            fs.readdirSync(accountFolder)
              .filter(
                file =>
                  file !== "SavedVariables" &&
                  fs.statSync(path.join(accountFolder, file)).isDirectory()
              )
              .forEach(file => {
                this.config.account.choices.push({
                  name: file,
                  auras: [],
                  backup: {
                    active: null,
                    path: path.join(userDataPath, "WeakAurasData-Backup"),
                    maxsize: 100,
                    fileSize: null
                  }
                });
                this.config.wowpath.valided = true;
              });
          }
        });
      }
    },
    // eslint-disable-next-line func-names
    "config.account.value": function() {
      this.config.account.valided = false;
      if (this.config.wowpath.valided && !!this.config.account.value) {
        const WeakAurasSavedVariable = path.join(
          this.config.wowpath.value,
          "_retail_",
          "WTF",
          "Account",
          this.config.account.value,
          "SavedVariables",
          "WeakAuras.lua"
        );
        fs.access(WeakAurasSavedVariable, fs.constants.F_OK, err => {
          if (!err) {
            this.config.account.valided = true;
            this.choiceIndex = this.config.account.choices.findIndex(
              account => account.name === this.config.account.value
            );
            if (
              this.config.account.choices[this.choiceIndex].backup.active ===
              null
            )
              this.config.account.choices[
                this.choiceIndex
              ].backup.active = true;
          }
        });
      }
    },
    // eslint-disable-next-line func-names
    "config.lang": function() {
      this.$i18n.locale = this.config.lang;
    }
  }
});
</script>

<style scoped lang="scss">
#config {
  padding: 5px 0 5px 2.35vw;
  text-align: left;
  overflow: auto;
  height: 100%;
  width: 100%;

  .backup {
    margin-top: 15px;
  }
}
label,
.label {
  color: #eee;
  margin: 10px 0 5px;
  font-size: 14px;
}
.red {
  color: #f44336;
}
.green {
  color: #51ae42;
}
.red,
.green {
  border-radius: 2px;
  vertical-align: middle;
}
.material-icons.folder {
  vertical-align: top;
  position: relative;
  top: 3px;
}
input,
select,
.fakeinput {
  padding: 5px;
  font-size: small;
  border-radius: 2px;
  border: none;
  background-color: #e6e6e6;
  color: #010101;
}
.title {
  margin: 20px 0 10px;
}
#config .title:first-child {
  margin-top: 5px;
}
.block {
  margin-left: 15px;
  font-size: 15px;
}
.option {
  margin-bottom: 5px;
}
.subtitle {
  font-size: 18px;
  margin-bottom: 5px;
  font-weight: 600;
  color: white;
}
.form-control.language {
  width: 110px;
}
.explorer {
  cursor: pointer;
}
</style>
