<template>
  <div class="message">
    <a
      v-if="message.url"
      :href="message.url"
      :title="message.url"
      target="_blank"
      class="url"
      v-html="message.text"
    />
    <span
      v-else
      v-html="message.text"
    />
    <UIButton
      :type="message.type"
      :title="message.time"
      size="mini"
      v-html="message.type"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import UIButton from "./UIButton.vue";

export default defineComponent({
  name: "Message",
  components: { UIButton },
  props: ["message"],
});
</script>

<style lang="scss">
.message {
  text-align: center;
  font-size: 11px;
  margin-top: 2px;
}

.message span {
  margin: 0 5px;
}
</style>
