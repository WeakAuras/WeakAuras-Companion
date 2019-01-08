<template>
  <button
    class="btn"
    v-bind:class="[
      { 'btn-default': type == 'info' },
      { 'btn-positive': type == 'ok' },
      { 'btn-negative': type == 'error' },
      { 'btn-mini': size == 'mini' },
      { 'btn-menu': type == 'menu' },
      { 'btn-refresh': type == 'refresh' },
      { 'btn-issue': type == 'issue' },
      { 'btn-reset': type == 'reset' },
      { 'btn-link': type == 'link' }
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

<style lang="scss">
.btn {
  font-family: inherit;
  display: inline-block;
  padding: 3px 8px;
  font-size: 12px;
  height: 25px;
  line-height: 1.4;
  text-align: center;
  white-space: nowrap;
  vertical-align: top;
  cursor: pointer;
  background-image: none;
  border: 1px solid transparent;
  border-radius: 2px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.06);
  -webkit-app-region: no-drag;
  background-color: #e6e6e6;
  color: #101010;
}
.btn:focus {
  outline: none;
  box-shadow: none;
}
.btn-large {
  padding: 6px 12px;
}
.btn-issue,
.btn-refresh {
  background-color: rgba(18, 18, 18, 0.95);
  border: 1px solid #fff;
  padding: 15px;
  height: 60px;
  font-size: 16px;
  color: #fff;
  font-weight: 600;
  border-radius: 4px;
  vertical-align: top;
  transition: all 0.1s ease-in-out;
  cursor: pointer;
}
.btn-refresh:hover {
  background-color: #fff;
  color: #2d2c2c;
}
.btn-menu {
  width: 60px;
  height: auto;
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
  background-image: url("~@/assets/ok-icon.png");
  background-size: contain;
}
.btn-positive:active {
  background-color: #34c84a;
}
.btn-negative {
  border-color: #b61b15;
  border-bottom-color: #fb1710;
  background-image: url("~@/assets/error-icon.png");
  background-size: contain;
}
.btn-negative:active {
  background-color: #ff5b56;
}

.btn-issue {
  color: #ff3333;
  border-color: #ff3333;
}
.btn-issue:hover {
  background-color: #ffffff;
}
.btn-reset {
  background-color: #a80000;
  color: white;
  height: 30px;
}
.btn-reset:hover {
  background-color: #f30707;
}
.btn-link {
  background: #171717;
}
.btn-link:hover {
  background: #101010;
}
</style>
