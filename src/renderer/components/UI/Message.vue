<template>
  <div class="message">
    <Aura v-if="message.aura" :aura="message.aura"></Aura>
    <span v-else>
      <v-button
        :type="message.type"
        :title="message.time"
        size="mini"
        v-html="message.type"
      >
      </v-button>
      <a
        v-if="message.url"
        :href="message.url"
        :title="message.url"
        target="_blank"
        class="url"
        v-html="message.text"
      ></a>
      <span v-else v-html="message.text"></span>
    </span>
  </div>
</template>

<script>
import Button from "./Button.vue";
import Aura from "./Aura.vue";

export default {
  name: "message",
  props: ["message"],
  components: { "v-button": Button, Aura }
};
</script>

<style scoped>
.message {
  text-align: left;
  font-family: "Courier New", Courier, monospace;
  font-size: small;
}
</style>
