<template>
  <div id="config">
    <div class="title">
      {{ $t("app.config.gameSettings" /* Game Settings */) }}
    </div>
    <div class="block">
      <file-select :path.sync="config.wowpath.value"></file-select>
      <span v-if="config.wowpath.valided" class="green">✔</span>
      <span v-else class="red">✘</span>
      <span v-if="config.wowpath.valided">
        <p class="label">
          {{ $t("app.config.selectAccount" /* Select Account */) }}
        </p>
        <select v-model="config.account.value" class="form-control">
          <option v-for="item in config.account.choices" :key="item.name">{{
            item.name
          }}</option>
        </select>
        <span v-if="config.account.valided" class="green">✔</span>
        <span v-else class="red">✘</span>
      </span>
    </div>
    <div class="title">
      {{ $t("app.config.wagoSettings" /* Wago Settings */) }}
    </div>
    <div class="block">
      <p class="label">
        {{ $t("app.config.wagoAccount" /* Wago Account (optional) */) }}
      </p>
      <input
        type="text"
        v-model="config.wagoUsername"
        size="11"
        :title="
          $t(
            'app.config.wagoAccountTitle' /* Auras uploaded with your
      account will be ignored */
          )
        "
      />
    </div>
    <div class="title">
      {{ $t("app.config.clientSettings" /* Client Settings */) }}
    </div>
    <div class="block">
      <input type="checkbox" v-model="config.notify" />
      {{
        $t(
          "app.config.notification" /* Receive a notification when auras get updated */
        )
      }}
      <br /><br />
      <p class="label">{{ $t("app.config.startup" /* Startup */) }}</p>
      <input type="checkbox" v-model="config.autostart" />
      {{ $t("app.config.autoStart" /* Launch client with your computer */)
      }}<br />
      <input type="checkbox" v-model="config.startminimize" />
      {{ $t("app.config.minimized" /* Start client minimized */) }}
    </div>
    <br /><br />
    <v-button @click="reset" type="info">{{
      $t("app.config.reset" /* Reset Settings and Data */)
    }}</v-button>
    <br /><br />
  </div>
</template>

<script>
import path from "path";
import FileSelect from "./FileSelect.vue";
import Button from "./Button.vue";

const fs = require("fs");
const AutoLaunch = require("auto-launch");

const AutoLauncher = new AutoLaunch({
  name: "WeakAuras Companion"
});

export default {
  props: ["config"],
  components: { FileSelect, "v-button": Button },
  methods: {
    reset() {
      this.$parent.reset();
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
      if (this.config.wowpath.value) {
        // clean Accounts options
        while (this.config.account.choices.length > 0) {
          this.config.account.choices.pop();
        }
        // test if ${wowpath}\WTF\Account exists
        const accountFolder = path.join(
          this.config.wowpath.value,
          "WTF",
          "Account"
        );
        fs.access(accountFolder, fs.constants.F_OK, err => {
          if (!err) {
            // add option for each account found
            fs.readdirSync(accountFolder).forEach(file => {
              if (file !== "SavedVariables") {
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
    // eslint-disable-next-line func-names
    "config.account.value": function() {
      if (this.config.wowpath.valided && !!this.config.account.value) {
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
            this.config.account.valided = true;
          } else {
            this.config.account.valided = false;
          }
        });
      }
    }
  }
};
</script>

<style scoped>
#config {
  margin: 5px 50px;
  text-align: left;
  overflow: auto;
  height: 100%;
  width: 535px;
}
.label {
  color: white;
  margin: 3px 0;
  font-size: 15px;
}
.red {
  color: red;
}
.green {
  color: green;
}
input,
select,
.fakeinput {
  padding: 5px;
  font-size: small;
  border-radius: 2px;
  border: none;
}
.title {
  font-size: 20px;
  margin: 10px 0 15px;
  font-weight: 600;
  padding: 5px 0;
  border-bottom: 1px solid #555;
}
.block {
  margin-left: 30px;
  font-size: 15px;
}
</style>
