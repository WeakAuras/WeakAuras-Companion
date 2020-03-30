<template>
  <div
    class="aura"
    :class="{
      notAnUpdate: showAllAuras && aura.version == aura.wagoVersion,
    }"
  >
    <a
      v-tooltip="{
        content: wagoURL(aura.slug),
        html: false,
      }"
      class="wago_icon"
      target="_blank"
      :href="wagoURL(aura.slug)"
    />
    <div class="aura_name_container">
      <span
        v-tooltip="{
          content: childs,
          html: false,
        }"
        class="aura_name"
        >{{ aura.name }}
      </span>
    </div>
    <div v-if="showAllAuras && aura.ignoreWagoUpdate" class="ignored">
      {{ $t("app.aura.updatedisabled" /* updates disabled */) }}
    </div>
    <div
      v-else-if="aura.skipWagoUpdate && aura.skipWagoUpdate >= aura.wagoVersion"
      class="ignored"
    >
      {{ $t("app.aura.versionskip" /* version skipped */) }}
    </div>
    <div
      v-else-if="showAllAuras && aura.version < aura.wagoVersion"
      class="update-ready"
    >
      {{ $t("app.aura.updateready" /* update ready */) }}
    </div>
    <a
      v-tooltip="{
        content: wagoAuthorURL(aura.author),
        classes: ['small'],
        html: false,
      }"
      class="author"
      target="_blank"
      :href="wagoAuthorURL(aura.author)"
    >
      {{ aura.author }}
    </a>
    <div class="upgrade-text">
      <div class="current-version">
        v<span v-if="aura.semver">{{ aura.semver }}</span>
        <span v-else>{{ aura.version }}</span>
      </div>
      <div
        v-tooltip="{
          content: fromNow(currentTime, $i18n.locale),
          classes: ['small'],
        }"
        class="wago-version"
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
  props: ["aura", "showAllAuras"],
  data() {
    return {
      currentTime: null,
    };
  },
  computed: {
    childs() {
      let output = "";

      if (this.aura.ids) {
        if (this.aura.changelog && this.aura.changelog.text) {
          if (this.aura.changelog.format === "bbcode") {
            output += sanitize.bbcode(this.aura.changelog.text);
          } else if (this.aura.changelog.format === "markdown") {
            output += sanitize.markdown(this.aura.changelog.text);
          }
          output += "\n\n";
        }
        const { ids } = this.aura;
        output += ids.sort().join("\n");
      }
      return output;
    },
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
      return moment(value).locale(locale).fromNow();
    },
  },
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
.update-ready {
  float: right;
  line-height: 32px;
}
.ignored {
  float: right;
  line-height: 32px;
  color: grey;
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
