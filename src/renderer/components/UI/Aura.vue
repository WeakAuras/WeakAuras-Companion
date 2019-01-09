<template>
  <div class="aura">
    <a
      class="wago_icon"
      target="_blank"
      :href="wagoURL(aura.slug)"
      v-tooltip="{
        content: wagoURL(aura.slug),
        html: false
      }"
    />
    <div class="aura_name_container">
      <span
        class="aura_name"
        v-tooltip="{
          content: childs,
          html: false
        }"
        >{{ aura.name }}
      </span>
    </div>
    <a
      class="author"
      target="_blank"
      :href="wagoAuthorURL(aura.author)"
      v-tooltip="{
        content: wagoAuthorURL(aura.author),
        classes: ['small'],
        html: false
      }"
    >
      {{ aura.author }}
    </a>
    <div class="upgrade-text">
      <div class="current-version">
        <!-- {{ $t("app.aura.currentversion" /* Current: */) }}-->
        v<span v-if="aura.semver">{{ aura.semver }}</span>
        <span v-else>{{ aura.version }}</span>
      </div>
      <div
        class="wago-version"
        v-tooltip="{
          content: fromNow(currentTime, $i18n.locale),
          classes: ['small']
        }"
        @mouseover="updateCurrentTime()"
      >
        v<span v-if="aura.wagoSemver">{{ aura.wagoSemver }}</span>
        <span v-else>{{ aura.wagoVersion }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import moment from "moment";
import Vue from "vue";
import VTooltip from "v-tooltip";

const sanitize = require("../libs/sanitize.js");

Vue.use(VTooltip);
export default Vue.extend({
  props: ["aura"],
  data() {
    return {
      currentTime: null
    };
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
        const { ids } = this.aura;
        output += ids.sort().join("\n");
      }
      return output;
    }
  },
  methods: {
    updateCurrentTime() {
      this.currentTime = null;
      this.currentTime = this.aura.modified;
    },
    wagoURL(value) {
      if (!value) return "";
      return `https://wago.io/${value}`;
    },
    wagoAuthorURL(author) {
      if (!author) return "";
      return `https://wago.io/p/${author}`;
    },
    fromNow(value, locale) {
      if (!value) return "n/a";
      return moment(value)
        .locale(locale)
        .fromNow();
    }
  }
});
</script>

<style scoped lang="scss">
.aura {
  background-color: #101010c9;
  border: 1px solid #101010;
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
  transition: background-color ease-in-out 0.2s;
  &:hover {
    background-color: #161616c9;
  }
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
