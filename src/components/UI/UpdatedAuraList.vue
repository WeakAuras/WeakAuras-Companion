<script setup lang="ts">
import { useStashStore } from "../../stores/auras";
import Aura from "./Aura.vue";
import UIButton from "./UIButton.vue";

const emit = defineEmits<{
  close: [];
}>();

const stash = useStashStore();

function close() {
  emit("close");
}

function clearList(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  stash.$reset();
  emit("close");
}
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
