<template>
  <div class="message">
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
  </div>
</template>

<script>
import Button from "./Button.vue";

export default {
  name: "message",
  props: ["message"],
  components: { "v-button": Button }
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css?family=Roboto+Mono");
.message {
  text-align: left;
  font-family: "Roboto Mono", monospace;
  font-size: 11px;
  margin: auto;
  margin-top: 2px;
  width: 70%;
}
</style>
