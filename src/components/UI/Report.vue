<template>
  <div
    id="report"
    @click="close"
  >
    <div class="container">
      <h1>{{ $t("app.report.title" /* Report a bug */) }}</h1>
      <div class="links">
        <UIButton type="link">
          <a
            href="https://github.com/WeakAuras/WeakAuras-Companion/issues/new?template=bug_report.md"
            target="_blank"
          >
            {{ $t("app.report.companion" /* Companion */) }}
          </a>
        </UIButton>
        <UIButton type="link">
          <a
            href="https://github.com/WeakAuras/WeakAuras2/issues/new"
            target="_blank"
          >
            {{ $t("app.report.addon" /* AddOn */) }}
          </a>
        </UIButton>
      </div>
    </div>
  </div>
</template>

<script lang="js">
import { defineComponent } from "vue";
import UIButton from "./UIButton.vue";

export default defineComponent({
  components: { UIButton },
  methods: {
    close() {
      this.$parent.toggleReport();
    },
  },
});
</script>

<style lang="scss">
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
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  width: 400px;
  padding: 15px 15px 25px;
  margin: auto;
}

.btn.btn-link {
  min-width: 200px;
  min-height: 40px;
  display: block;
  margin: 5px auto;
  transition: background-color ease-in-out 0.2s;
  padding: 0;
}

.btn-link a {
  font-size: 16px;
  width: 100%;
  height: 100%;
  display: block;
  line-height: 34px;
  color: #e6e6e6;
  background-size: cover;
  text-shadow: 0 0 1px #000000;
}

h1 {
  margin-bottom: 30px;
  color: #e6e6e6;
}
</style>
