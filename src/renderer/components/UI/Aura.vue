<template>
  <div class="aura">
    <a
      :href="aura.slug | wago"
      :title="aura.slug | wago"
      class="wago_icon"
      target="_blank"
    ></a>
    <span class="aura_name" :title="childs">{{ aura.name | maxLength }}</span>
    <div class="upgrade-text">
      <div class="current-version">Current: v{{ aura.version }}</div>
      <div class="wago-version">v{{ aura.wagoVersion }}</div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["aura"],
  filters: {
    wago: value => {
      if (!value) return "";
      return `https://wago.io/${value}`;
    },
    maxLength: text => {
      const count = 50;
      return text.slice(0, count) + (text.length > count ? "..." : "");
    }
  },
  computed: {
    childs() {
      return this.aura.ids.join("\n");
    }
  }
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css?family=Roboto+Mono");

.aura {
  background-color: #1d1d1d;
  color: rgb(255, 209, 0);
  margin: 1px;
  height: 32px;
  padding: 2px 10px;
  vertical-align: middle;
  white-space: nowrap;
  display: flex;
  overflow: hidden;
  font-family: "Roboto Mono", monospace;
  font-size: 11px;
}
.aura_name {
  width: 450px;
  padding-left: 10px;
  display: inline-block;
  font-weight: 600;
  margin: auto 0;
  font-size: 12px;
  text-shadow: #000000 0 1px 0;
  text-align: left;
}
.wago_icon {
  height: 100%;
  vertical-align: middle;
  display: inline-block;
}
.wago_icon {
  content: url("~@/assets/wago_plain.png");
}
.upgrade-text {
  font-family: "Roboto Mono", monospace;
  font-weight: 600;
  text-shadow: #000000 0 1px 0;
  width: 120px;
  display: flex;
}
.current-version {
  font-size: 9px;
  color: #777;
  width: 70px;
  padding-top: 13px;
  text-align: left;
}
.wago-version {
  text-shadow: rgba(219, 185, 50, 0.267) 0 0 5px;
  text-align: right;
  width: 30px;
  padding-top: 8px;
}
</style>
