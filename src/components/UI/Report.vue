<template>
  <div
    id="report"
    @click="close"
    class="w-full h-full absolute bg-black bg-opacity-70 text-center z-75"
  >
    <div
      class="relative top-1/3 bg-black bg-opacity-30 rounded-lg w-96 p-4 pb-6 mx-auto"
    >
      <h1 class="mb-8 text-gray-200">
        {{ $t("app.report.title" /* Report a bug */) }}
      </h1>
      <div class="links">
        <UIButton
          type="link"
          class="w-48 h-10 block mx-auto transition-colors duration-200 ease-in-out p-0 mt-2"
        >
          <a
            href="https://github.com/WeakAuras/WeakAuras-Companion/issues/new?template=bug_report.md"
            target="_blank"
            class="text-lg w-full h-full block leading-9 text-gray-200 bg-cover"
          >
            {{ $t("app.report.companion" /* Companion */) }}
          </a>
        </UIButton>
        <UIButton
          type="link"
          class="w-48 h-10 block mx-auto transition-colors duration-200 ease-in-out p-0 mt-2"
        >
          <a
            href="https://github.com/WeakAuras/WeakAuras2/issues/new"
            target="_blank"
            class="text-lg w-full h-full block leading-9 text-gray-200 bg-cover"
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
