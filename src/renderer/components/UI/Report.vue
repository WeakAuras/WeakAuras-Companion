<template>
  <div id="report" ref="report" @click="close">
    <div class="container">
      <h1>{{ $t("app.report.title" /* Report a bug */) }}</h1>
      <div class="links">
        <v-button type="link">
          <a
            href="https://github.com/WeakAuras/WeakAuras-Companion/issues/new"
            target="_blank"
          >
            {{ $t("app.report.companion" /* Companion */) }}
          </a>
        </v-button>
        <v-button type="link">
          <a
            href="https://github.com/WeakAuras/WeakAuras2/issues/new"
            target="_blank"
          >
            {{ $t("app.report.addon" /* AddOn */) }}
          </a>
        </v-button>
      </div>
    </div>
  </div>
</template>
<script>
import Button from "./Button.vue";

export default {
  components: {
    "v-button": Button
  },
  methods: {
    close() {
      this.$parent.toggleReport();
    }
  }
};
</script>
<style>
#report {
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
.btn.btn-link {
  min-width: 200px;
  min-height: 40px;
  display: block;
  margin: 5px auto;
  transition: background-color ease-in-out 0.2s;
}
.btn-link a {
  font-size: 16px;
}
h1 {
  margin-bottom: 30px;
}
</style>
