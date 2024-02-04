<script lang="ts">
import { defineComponent, inject } from "vue";
import { useStashStore, type StashStore } from "../../stores/auras.js";
import UIButton from "./UIButton.vue";
import Aura from "./Aura.vue";

export default defineComponent({
  components: { UIButton, Aura },
  setup() {
    const stash: StashStore = useStashStore();
    const toggleUpdatedAuraList = inject("toggleUpdatedAuraList") as () => void;

    return {
      stash,
      toggleUpdatedAuraList,
    };
  },
  methods: {
    close() {
      this.toggleUpdatedAuraList();
    },
    clearList(event) {
      event.preventDefault();
      event.stopPropagation();
      this.stash.$reset();
      this.toggleUpdatedAuraList();
    },
  },
});
</script>

<template>
  <div
    id="updatedAuraList"
    class="absolute h-full w-full bg-black bg-opacity-70 text-center"
    @click="close"
  >
    <div
      class="relative top-1/3 mx-auto w-9/10 rounded-md bg-black bg-opacity-30 p-4 pb-6"
    >
      <h1 class="mb-8 text-gray-200">
        {{ $t("app.updatedAuraList.title" /* Ready to install */) }}
      </h1>
      <div class="w-full">
        <Aura
          v-for="aura in stash.auras"
          :key="aura.slug"
          :aura="aura"
        />
      </div>
      <div class="mt-4">
        <UIButton
          type="reset"
          @click="clearList"
        >
          Clear list
        </UIButton>
      </div>
    </div>
  </div>
</template>
