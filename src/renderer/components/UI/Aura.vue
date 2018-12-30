<template>
  <div class="aura">
    <a
      class="wago_icon"
      target="_blank"
      :href="aura.slug | wago"
      :title="aura.slug | wago"
    />
    <div class="aura_name_container">
      <span class="aura_name" :title="childs" v-html="aura.name" />
    </div>
    <a
      class="author"
      target="_blank"
      :href="aura.author | wagoAuthor"
      :title="aura.author | wagoAuthor"
      v-html="aura.author"
    />
    <div class="upgrade-text">
      <div class="current-version">
        <!-- {{ $t("app.aura.currentversion" /* Current: */) }}-->
        v<span v-if="aura.semver" v-html="aura.semver" /><span
          v-else
          v-html="aura.version"
        />
      </div>
      <div
        class="wago-version"
        :title="currentTime | fromNow($i18n.locale)"
        @mouseover="updateCurrentTime()"
      >
        v<span v-if="aura.wagoSemver" v-html="aura.wagoSemver" /><span
          v-else
          v-html="aura.wagoVersion"
        />
      </div>
    </div>
  </div>
</template>

<script>
import moment from "moment";
import Vue from "vue";

const sanitize = require("../libs/sanitize.js");

export default Vue.extend({
  props: ["aura"],
  data() {
    return {
      currentTime: null
    };
  },
  filters: {
    wago: value => {
      if (!value) return "";
      return `https://wago.io/${value}`;
    },
    wagoAuthor: value => {
      if (!value) return "";
      return `https://wago.io/p/${value}`;
    },
    fromNow: (value, locale) => {
      if (!value) return "n/a";
      return moment(value)
        .locale(locale)
        .fromNow();
    }
  },
  computed: {
    childs() {
      let output = "";
      if (typeof this.aura.ids !== "undefined") {
        if (typeof this.aura.changelog !== "undefined") {
          if (typeof this.aura.changelog.text !== "undefined") {
            if (this.aura.changelog.format === "bbcode") {
              output += sanitize.bbcode(this.aura.changelog.text);
            } else if (this.aura.changelog.format === "markdown") {
              output += sanitize.markdown(this.aura.changelog.text);
            }
            output += "\n\n";
          }
        }
        output += this.aura.ids.join("\n");
      }
      return output;
    }
  },
  methods: {
    updateCurrentTime() {
      this.currentTime = null;
      this.currentTime = this.aura.modified;
    }
  }
});
</script>

<style scoped>
.aura {
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: rgb(255, 209, 0);
  margin: 1px;
  height: 36px;
  padding: 2px 10px;
  vertical-align: middle;
  white-space: nowrap;
  display: flex;
  overflow: hidden;
  font-size: 11px;
  flex-direction: row;
  border-radius: 4px;
}
.aura_name_container {
  text-align: left;
  flex: 1;
  overflow: hidden;
}
.aura_name {
  width: 95%;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 10px;
  display: inline-block;
  font-weight: 600;
  font-size: 12px;
  text-shadow: #000000 0 1px 0;
  text-align: left;
  line-height: 32px;
}
.wago_icon {
  height: 90%;
  margin: auto;
  vertical-align: bottom;
  display: inline-block;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  content: url("~@/assets/wago_plain.png");
}
.author {
  width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 10px;
  font-size: 12px;
  text-align: left;
  line-height: 32px;
}
.author:before {
  content: "@";
}
.upgrade-text {
  font-weight: 600;
  text-shadow: #000000 0 1px 0;
  display: flex;
}
.current-version {
  font-size: 9px;
  color: #777;
  width: 55px;
  line-height: 32px;
  text-align: left;
  padding-top: 1px;
}
.wago-version {
  text-shadow: rgba(219, 185, 50, 0.267) 0 0 5px;
  text-align: right;
  width: 55px;
  line-height: 32px;
}
</style>
