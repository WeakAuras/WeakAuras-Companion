<template>
  <div class="aura">
    <span class="aura_name">{{ aura.name }}</span>
    <div
      v-if="aura.wagoVersion && aura.version < aura.wagoVersion"
      :title="'upgrade from v' + aura.version + ' to v' + aura.wagoVersion"
      class="wagoUpgrade"
    ></div>
    <div
      v-if="aura.wagoVersion && aura.version == aura.wagoVersion"
      title="you have last version"
      class="wagoOk"
    ></div>
    <div
      v-if="aura.wagoVersion && aura.version > aura.wagoVersion"
      :title="'your version ('+ aura.version + ') is newer that wago version (' + aura.wagoVersion +')'"
      class="wagoWarning"
    ></div>
    <div v-if="aura.wagoError" class="wagoError" title="error"></div>
    <a :href="aura.slug | wago" :title="aura.slug | wago" class="wago_icon" target="_blank"></a>
  </div>
</template>

<script>
export default {
  props: ["aura"],
  filters: {
    wago: value => {
      if (!value) return;
      return "https://wago.io/" + value;
    }
  },
};
</script>

<style scoped>
.aura{
  background-color: #444;
  color: rgb(255, 209, 0);
  margin: 1px;
  height: 32px;
  font-size: 14px;
  padding: 2px;
  vertical-align: middle;
  white-space: nowrap;
  display: flex;
  overflow: hidden;
}
.aura_name {
  width: 510px;
}
.wago_icon, .wagoError, .wagoUpgrade, .wagoOk, .wagoWarning {
  width: 25px;
  height: 25px;
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
</style>
