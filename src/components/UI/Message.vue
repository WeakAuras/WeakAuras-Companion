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
    <Button
      :type="message.type"
      :title="message.time"
      size="mini"
      v-html="message.type"
    >
    </Button>
  </div>
</template>

<script>
import Button from "./Button.vue";

export default {
  name: "Message",
  components: { Button },
  props: ["message"],
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
