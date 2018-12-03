<template>
  <button
    class="btn"
    v-bind:class="[
      { 'btn-default': type == 'info' },
      { 'btn-positive': type == 'ok' },
      { 'btn-negative': type == 'error' },
      { 'btn-mini': size == 'mini' },
      { 'btn-menu': type == 'menu' },
      { 'btn-refresh': type == 'refresh' }
    ]"
    :title="title"
    @click="callback($event)"
  >
    <slot></slot>
  </button>
</template>

<script>
export default {
  props: ["type", "title", "size"],
  methods: {
    callback(e) {
      this.$emit("click", e);
    }
  }
};
</script>

<style scoped>
.btn {
  display: inline-block;
  padding: 3px 8px;
  margin-bottom: 0;
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  background-image: none;
  border: 1px solid transparent;
  border-radius: 4px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.06);
  -webkit-app-region: no-drag;
}
.btn:focus {
  outline: none;
  box-shadow: none;
}
.btn-large {
  padding: 6px 12px;
}
.btn-refresh {
  background-color: #333;
  padding: 10px;
  font-family: "Roboto", sans-serif;
  font-size: large;
  color: white;
}
.btn-refresh:hover {
  background-color: rgb(71, 71, 71);
}
.btn-menu {
  width: 60px;
  color: #333;
  border-top-color: #c2c0c2;
  border-right-color: #c2c0c2;
  border-bottom-color: #a19fa1;
  border-left-color: #c2c0c2;
  background-color: #757474;
}
.btn-menu:hover {
  background-color: #ddd;
}
.btn-mini {
  padding: 2px 6px;
  width: 18px;
  height: 18px;
  color: transparent;
}
.btn-default {
  color: #333;
  border-top-color: #c2c0c2;
  border-right-color: #c2c0c2;
  border-bottom-color: #a19fa1;
  border-left-color: #c2c0c2;
  background-color: #fcfcfc;
}
.btn-default:active {
  background-color: #ddd;
  background-image: none;
}
.btn-primary {
  border-color: #388df8;
  border-bottom-color: #0866dc;
  background-color: #6eb4f7;
}
.btn-primary:active {
  background-color: #3e9bf4;
}
.btn-positive {
  border-color: #023008;
  border-radius: 2px;
  margin-left: 10px;
  background-color: #2c9b00;
}
.btn-positive:active {
  background-color: #34c84a;
}
.btn-negative {
  border-color: #fb2f29;
  border-bottom-color: #fb1710;
  background-color: #f0443e;
}
.btn-negative:active {
  background-color: #ff5b56;
}
</style>
