<template>
  <div class="aura">
    <a
      :href="aura.slug | wago"
      :title="aura.slug | wago"
      class="wago_icon"
      target="_blank"
    ></a>
    <span class="aura_name">{{ aura.name }}</span>
    <div class="upgrade-text">
      <span class="current-version">Current: v{{ aura.version }}</span>
      <span class="wago-version">v{{ aura.wagoVersion }}</span>
    </div>
    <div v-if="aura.wagoError" class="wagoError" title="error"></div>
  </div>
</template>

<script>
export default {
  props: ["aura"],
  filters: {
    wago: value => {
      if (!value) return "";
      return `https://wago.io/${value}`;
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
  width: 100%;
  padding-left: 10px;
  font-family: "Roboto Mono", monospace;
  vertical-align: middle;
  display: inline-block;
  font-weight: 600;
  margin: auto 0;
  font-size: 12px;
  text-shadow: #000000 0 1px 0;
  text-align: left;
}
.wago_icon,
.wagoError,
.wagoUpgrade,
.wagoOk,
.wagoWarning {
  height: 100%;
  vertical-align: middle;
  display: inline-block;
}
.wago_icon {
  content: url("~@/assets/wago_plain.png");
}
.wagoError {
  content: url("~@/assets/error.png");
}
.wagoUpgrade {
  content: url("~@/assets/rotating-minimapcorpsearrow.png");
}
.wagoOk {
  content: url("~@/assets/ok.png");
}
.wagoWarning {
  content: url("~@/assets/warning.png");
}
.upgrade-text {
  height: 100%;
  font-family: "Roboto Mono", monospace;
  font-weight: 600;
  padding-right: 10px;
  text-shadow: #000000 0 1px 0;
}
.current-version {
  vertical-align: bottom;
  position: relative;
  top: 5px;
  font-size: 9px;
  color: #777;
  margin-right: 10px;
  vertical-align: bottom;
}
.wago-version {
  margin: auto;
  position: relative;
  top: 3px;
  text-shadow: rgba(219, 185, 50, 0.267) 0 0 5px;
}
</style>
