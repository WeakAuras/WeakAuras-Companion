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
  padding: 8px 8px;
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
  width: 50px;
}
.btn-default {
  color: #333;
  border-top-color: #c2c0c2;
  border-right-color: #c2c0c2;
  border-bottom-color: #a19fa1;
  border-left-color: #c2c0c2;
  background-color: #fcfcfc;
  background-image: -webkit-gradient(
    linear,
    left top,
    left bottom,
    color-stop(0%, #fcfcfc),
    color-stop(100%, #f1f1f1)
  );
  background-image: -webkit-linear-gradient(top, #fcfcfc 0%, #f1f1f1 100%);
  background-image: linear-gradient(to bottom, #fcfcfc 0%, #f1f1f1 100%);
}
.btn-default:active {
  background-color: #ddd;
  background-image: none;
}
.btn-primary {
  border-color: #388df8;
  border-bottom-color: #0866dc;
  background-color: #6eb4f7;
  background-image: -webkit-gradient(
    linear,
    left top,
    left bottom,
    color-stop(0%, #6eb4f7),
    color-stop(100%, #1a82fb)
  );
  background-image: -webkit-linear-gradient(top, #6eb4f7 0%, #1a82fb 100%);
  background-image: linear-gradient(to bottom, #6eb4f7 0%, #1a82fb 100%);
}
.btn-primary:active {
  background-color: #3e9bf4;
  background-image: -webkit-gradient(
    linear,
    left top,
    left bottom,
    color-stop(0%, #3e9bf4),
    color-stop(100%, #0469de)
  );
  background-image: -webkit-linear-gradient(top, #3e9bf4 0%, #0469de 100%);
  background-image: linear-gradient(to bottom, #3e9bf4 0%, #0469de 100%);
}
.btn-positive {
  border-color: #29a03b;
  border-bottom-color: #248b34;
  background-color: #5bd46d;
  background-image: -webkit-gradient(
    linear,
    left top,
    left bottom,
    color-stop(0%, #5bd46d),
    color-stop(100%, #29a03b)
  );
  background-image: -webkit-linear-gradient(top, #5bd46d 0%, #29a03b 100%);
  background-image: linear-gradient(to bottom, #5bd46d 0%, #29a03b 100%);
}
.btn-positive:active {
  background-color: #34c84a;
  background-image: -webkit-gradient(
    linear,
    left top,
    left bottom,
    color-stop(0%, #34c84a),
    color-stop(100%, #248b34)
  );
  background-image: -webkit-linear-gradient(top, #34c84a 0%, #248b34 100%);
  background-image: linear-gradient(to bottom, #34c84a 0%, #248b34 100%);
}
.btn-negative {
  border-color: #fb2f29;
  border-bottom-color: #fb1710;
  background-color: #fd918d;
  background-image: -webkit-gradient(
    linear,
    left top,
    left bottom,
    color-stop(0%, #fd918d),
    color-stop(100%, #fb2f29)
  );
  background-image: -webkit-linear-gradient(top, #fd918d 0%, #fb2f29 100%);
  background-image: linear-gradient(to bottom, #fd918d 0%, #fb2f29 100%);
}
.btn-negative:active {
  background-color: #fc605b;
  background-image: -webkit-gradient(
    linear,
    left top,
    left bottom,
    color-stop(0%, #fc605b),
    color-stop(100%, #fb1710)
  );
  background-image: -webkit-linear-gradient(top, #fc605b 0%, #fb1710 100%);
  background-image: linear-gradient(to bottom, #fc605b 0%, #fb1710 100%);
}
</style>
