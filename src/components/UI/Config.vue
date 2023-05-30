<template>
  <div id="config">
    <div class="config-row">
      <div class="config-row-item">
        <!-- Game Settings Section -->
        <div class="title">
          {{ $t("app.config.gameSettings" /* Game Settings */) }}
        </div>
        <div class="block">
          <FileSelect
            v-model:path="config.wowpath.value"
            :default-path="defaultWOWPath"
            open-directory="true"
            create-directory="true"
            @update:path="$parent.validateWowpath"
          >
            {{ $t("app.fileselect.wowfolder" /* World of Warcraft Folder */) }}
          </FileSelect>
          <i
            v-if="config.wowpath.validated"
            class="material-icons green settings"
          >check_circle_outline</i>
          <i
            v-else
            class="material-icons red settings"
          >error_outline</i>
        </div>
        <!-- Companion Settings Section -->
        <div class="title">
          {{ $t("app.config.clientSettings" /* Companion Settings */) }}
        </div>
        <div class="block">
          <Dropdown
            v-model:value="config.lang"
            :options="langs"
            :label="$t('app.config.lang' /* Language */)"
          />
          <Checkbox v-model="config.notify">
            {{ $t("app.config.notification" /* Show notifications for new updates */) }}
          </Checkbox>
          <p class="label subtitle">
            {{ $t("app.config.startup" /* Startup */) }}
          </p>
          <div class="option">
            <Checkbox v-model="config.autostart">
              {{ $t("app.config.autoStart" /* Launch client with your computer */) }}
            </Checkbox>
          </div>
          <div class="option">
            <Checkbox v-model="config.startminimize">
              {{ $t("app.config.minimized" /* Start minimised */) }}
            </Checkbox>
          </div>
          <p class="label subtitle">
            {{ $t("app.config.autoupdater" /* Updates */) }}
          </p>
          <div class="option">
            <Checkbox v-model="config.beta">
              {{ $t("app.config.autoupdater.beta" /* Use Companion Beta channel */) }}
            </Checkbox>
          </div>
          <!--
          <div class="option">
            <checkbox v-model="config.autoupdate">
              {{
                $t(
                  "app.config.autoupdater.autoupdate" /* Install Companion updates automatically */
                )
              }}
            </checkbox>
          </div>
          -->
        </div>
      </div>
      <div class="config-row-item">
        <!-- Wago Settings -->
        <div class="title">
          {{ $t("app.config.wagoSettings" /* Wago Settings */) }}
        </div>
        <div class="block">
          <p class="label">
            {{ $t("app.config.wagoAccount" /* Set Wago Account (optional) */) }}
          </p>
          <input
            v-model="wagoUsername"
            type="text"
            size="11"
            @keyup.enter="config.wagoUsername = wagoUsername"
          >
          <UIButton
            class="btn-ok"
            @click="config.wagoUsername = wagoUsername"
          >
            {{ $t("app.config.ok" /* OK */) }}
          </UIButton>
          <i
            v-if="config.wagoUsername"
            class="material-icons green"
          >check_circle_outline</i>
          <p class="label">
            {{ $t("app.config.wagoApiKey" /* Set Wago API Key (optional) */) }}
          </p>
          <input
            v-model="wagoApiKey"
            type="password"
            size="11"
            @keyup.enter="config.wagoApiKey = wagoApiKey"
          >
          <UIButton
            class="btn-ok"
            @click="config.wagoApiKey = wagoApiKey"
          >
            {{ $t("app.config.ok" /* OK */) }}
          </UIButton>
          <i
            v-if="config.wagoApiKey && checkApiKey()"
            class="material-icons green"
          >check_circle_outline</i>
          <i
            v-else-if="config.wagoApiKey && !checkApiKey()"
            class="material-icons red"
          >error_outline</i>
          <p
            v-if="config.wagoApiKey && !checkApiKey()"
            class="red"
          >
            {{ $t("app.config.badapikey" /* Wago API Key should be 64 characters */) }}
          </p>
          <p>
            <a
              href="https://wago.io/account"
              class="explorer"
              target="_blank"
            >
              {{ $t("app.config.getYours" /* Get yours */) }}
            </a>
          </p>
          <Checkbox v-model="config.ignoreOwnAuras">
            {{ $t("app.config.ignoreOwnAuras" /* Ignore auras from your account */) }}
          </Checkbox>
        </div>
        <!-- WeakAuras Backup Section -->
        <div class="title">
          {{ $t("app.config.backup.title" /* WeakAuras Backup */) }}
        </div>
        <div class="block">
          <p class="label">
            <Checkbox v-model="config.backup.active">
              {{ $t("app.config.backup.activate" /* Activate */) }}
            </Checkbox>
          </p>
          <div
            v-if="config.backup.active"
            style="display: inline"
          >
            <FileSelect
              v-model:path="config.backup.path"
              :default-path="config.backup.defaultBackupPath"
              open-directory="true"
              create-directory="true"
            >
              {{ $t("app.config.backup.backupfolder" /* Backup Folder */) }}
            </FileSelect>
            <p
              class="explorer"
              @click="openBackupDir()"
            >
              {{ $t("app.config.backup.openfolder" /* Open Folder */) }}
            </p>
            <Dropdown
              v-model:value="config.backup.maxsize"
              :options="backupsize"
              :label="$t('app.config.backup.dedicatedsize' /* Dedicated size */)"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="block resetbutton">
      <UIButton
        type="reset"
        @click="reset"
      >
        {{ $t("app.config.reset" /* Reset Settings and Data */) }}
      </UIButton>
    </div>
  </div>
</template>

<script lang="js">
import { ipcRenderer, shell } from "electron";
import { defineComponent, ref } from "vue";
import { useConfigStore } from "../../stores/config";
import UIButton from "./UIButton.vue";
import Checkbox from "./Checkbox.vue";
import Dropdown from "./Dropdown.vue";
import FileSelect from "./FileSelect.vue";

export default defineComponent({
  components: {
    Checkbox,
    Dropdown,
    FileSelect,
    UIButton,
  },
  props: ["defaultWOWPath"],
  setup() {
    const config = useConfigStore();
    return {
      config,
      wagoUsername: ref(config.wagoUsername),
      wagoApiKey: ref(config.wagoApiKey),
    };
  },
  data() {
    return {
      langs: [
        { value: "zh-cn", text: "中文 (简体) (zh-cn)" },
        { value: "de", text: "Deutsch (de)" },
        { value: "en", text: "English (en)" },
        { value: "es", text: "Español (es)" },
        { value: "fr", text: "Français (fr)" },
        { value: "ru", text: "Русский (ru)" },
        { value: "tr", text: "Türkçe (tr)" },
      ],
      backupsize: [
        { value: 50, text: "50mb" },
        { value: 100, text: "100mb" },
        { value: 500, text: "500mb" },
      ],
    };
  },
  watch: {

    "config.autostart": function () {
      ipcRenderer.invoke("autoStart", this.config.autostart === true);
    },

    "config.lang": function () {
      console.log(`change locale to ${this.config.lang}`);
      this.$i18n.locale = this.config.lang;
    },

    "config.beta": function () {
      this.$parent.checkCompanionUpdates();
    },
  },
  methods: {
    reset() {
      this.$parent.reset();
      this.wagoUsername = null;
    },
    openBackupDir() {
      shell.openPath(this.config.backup.path);
    },
    checkApiKey() {
      return this.config.wagoApiKey.match(/^[\w\d]{64}$/);
    },
  },
});
</script>

<style scoped lang="scss">
#config {
  padding: 5px 0 5px 2.35vw;
  text-align: left;
  overflow: auto;
  height: 100%;
  width: 100%;
}

.config-row {
  display: flex;
  flex-direction: row;
}

.config-row-item {
  flex: 50%;
}

label,
.label {
  color: #eeeeee;
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
  margin-left: 4px;
}

p.red {
  margin-top: 8px;
  margin-bottom: 8px;
}

.material-icons.settings {
  vertical-align: top;
  position: relative;
  top: 5px;
}

input,
select,
.fakeinput {
  padding: 5px;
  font-size: small;
  border-radius: 4px;
  border: 1px solid #2c2c2c;
  background-color: #0d0d0d;
  color: #e6e6e6;
  margin-left: 5px;
}

input:hover {
  color: #ffffff;
  background-color: #1a1a1a;
  border: 1px solid #2c2c2c;
  transition: all 0.1s ease-in-out;
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

.resetbutton {
  margin-top: 20px;
}

.option {
  margin-bottom: 5px;
}

.subtitle {
  font-size: 18px;
  margin-bottom: 8px;
  margin-top: 16px;
  font-weight: 600;
  color: #ffffff;
}

.form-control.language {
  width: 150px;
}

.explorer {
  cursor: pointer;
  font-size: 12px;
  margin-top: 5px;
  color: rgb(255, 209, 0);
  font-weight: 500;
}

@font-face {
  font-family: pass;
  font-style: normal;
  font-weight: 400;
  src: url("data:application/font-woff;charset=utf-8;base64,d09GRgABAAAAAATsAA8AAAAAB2QAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABGRlRNAAABWAAAABwAAAAcg9+z70dERUYAAAF0AAAAHAAAAB4AJwANT1MvMgAAAZAAAAA/AAAAYH7AkBhjbWFwAAAB0AAAAFkAAAFqZowMx2N2dCAAAAIsAAAABAAAAAQAIgKIZ2FzcAAAAjAAAAAIAAAACAAAABBnbHlmAAACOAAAALkAAAE0MwNYJ2hlYWQAAAL0AAAAMAAAADYPA2KgaGhlYQAAAyQAAAAeAAAAJAU+ATJobXR4AAADRAAAABwAAAAcCPoA6mxvY2EAAANgAAAAEAAAABAA5gFMbWF4cAAAA3AAAAAaAAAAIAAKAE9uYW1lAAADjAAAARYAAAIgB4hZ03Bvc3QAAASkAAAAPgAAAE5Ojr8ld2ViZgAABOQAAAAGAAAABuK7WtIAAAABAAAAANXulPUAAAAA1viLwQAAAADW+JM4eNpjYGRgYOABYjEgZmJgBEI2IGYB8xgAA+AANXjaY2BifMg4gYGVgYVBAwOeYEAFjMgcp8yiFAYHBl7VP8wx/94wpDDHMIoo2DP8B8kx2TLHACkFBkYA8/IL3QB42mNgYGBmgGAZBkYGEEgB8hjBfBYGDyDNx8DBwMTABmTxMigoKKmeV/3z/z9YJTKf8f/X/4/vP7pldosLag4SYATqhgkyMgEJJnQFECcMOGChndEAfOwRuAAAAAAiAogAAQAB//8AD3jaY2BiUGJgYDRiWsXAzMDOoLeRkUHfZhM7C8Nbo41srHdsNjEzAZkMG5lBwqwg4U3sbIx/bDYxgsSNBRUF1Y0FlZUYBd6dOcO06m+YElMa0DiGJIZUxjuM9xjkGRhU2djZlJXU1UDQ1MTcDASNjcTFQFBUBGjYEkkVMJCU4gcCKRTeHCk+fn4+KSllsJiUJEhMUgrMUQbZk8bgz/iA8SRR9qzAY087FjEYD2QPDDAzMFgyAwC39TCRAAAAeNpjYGRgYADid/fqneL5bb4yyLMwgMC1H90HIfRkCxDN+IBpFZDiYGAC8QBbSwuceNpjYGRgYI7594aBgcmOAQgYHzAwMqACdgBbWQN0AAABdgAiAAAAAAAAAAABFAAAAj4AYgI+AGYB9AAAAAAAKgAqACoAKgBeAJIAmnjaY2BkYGBgZ1BgYGIAAUYGBNADEQAFQQBaAAB42o2PwUrDQBCGvzVV9GAQDx485exBY1CU3PQgVgIFI9prlVqDwcZNC/oSPoKP4HNUfQLfxYN/NytCe5GwO9/88+/MBAh5I8C0VoAtnYYNa8oaXpAn9RxIP/XcIqLreZENnjwvyfPieVVdXj2H7DHxPJH/2/M7sVn3/MGyOfb8SWjOGv4K2DRdctpkmtqhos+D6ISh4kiUUXDj1Fr3Bc/Oc0vPqec6A8aUyu1cdTaPZvyXyqz6Fm5axC7bxHOv/r/dnbSRXCk7+mpVrOqVtFqdp3NKxaHUgeod9cm40rtrzfrt2OyQa8fppCO9tk7d1x0rpiQcuDuRkjjtkHt16ctbuf/radZY52/PnEcphXpZOcofiEZNcQAAeNpjYGIAg///GBgZsAF2BgZGJkZmBmaGdkYWRla29JzKggxD9tK8TAMDAxc2D0MLU2NjENfI1M0ZACUXCrsAAAABWtLiugAA")
    format("woff");
}

input[type="password"] {
  font-family: pass;
}
</style>
