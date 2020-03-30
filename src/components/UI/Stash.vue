<template>
  <div id="stash">
    <div class="container">
      <h1>{{ $t("app.stash.title" /* Import from Wago */) }}</h1>
      <div v-for="aura in stash" :key="aura.slug">
        <div>{{ aura.name }}</div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: ["stash"],
};
</script>
<style scoped lang="scss">
#stash {
  width: 100%;
  height: 100%;
  position: absolute;
  background: rgba(0, 0, 0, 0.7);
  text-align: center;
}
.blurred {
  filter: blur(5px);
}
.container {
  position: relative;
  top: 35%;
}
h1 {
  margin-bottom: 30px;
}
</style>
