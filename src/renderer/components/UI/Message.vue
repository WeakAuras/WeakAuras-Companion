<template>
  <div class="message">
    <a
      v-if="message.url"
      :href="message.url"
      :title="message.url"
      target="_blank"
      class="url"
      v-html="message.text"
    ></a>
    <span v-else v-html="message.text"></span>
    <v-button
      :type="message.type"
      :title="message.time"
      size="mini"
      v-html="message.type"
    >
    </v-button>
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
