<script setup lang="ts">
import { ref } from "vue";
import clickOutside from "@/libs/click-outside";

import GifPicker from "./GifPicker.vue";

const vClickOutside = clickOutside;

defineProps<{
  value?: string | number | null;
  apiKey?: string | null;
}>();

const emit = defineEmits<{
  gif: [url: string, title: string, tenorID: string];
}>();

const opened = ref(false);

function close() {
  if (opened.value) {
    opened.value = false;
  }
}

function send(url: string, title: string, tenorID: string) {
  emit("gif", url, title, tenorID);
}

function open() {
  opened.value = !opened.value;
}
</script>

<template>
  <div v-click-outside="close">
    <div>
      <div
        :class="{ 'opacity-0': !opened }"
        class="discord-picker"
      >
        <GifPicker
          v-if="opened"
          :api-key="apiKey"
          @send="({ url, title, tenorID }) => send(url, title, tenorID)"
        />
      </div>
      <div class="mt4">
        <div>
          <span @click="open">
            <slot />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="css">
.discord-picker {
  max-width: max-content;
  height: 500px;
  width: 600px;
  overflow: hidden;
  position: absolute;
  left: -150px;
  bottom: -150px;
  transition-property:
    background-color, border-color, color, fill, stroke, opacity, box-shadow,
    transform;
  transition-duration: 200ms;
  transform: translate-y(200px);
  border-radius: 0.75rem;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .discord-picker {
    width: 400px;
    height: 400px;
  }
}
</style>
