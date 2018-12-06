<template>
  <div id="ui-titlebar">
    <div id="ui-titletext">&nbsp;</div>
    <div id="ui-titlecontrols">
      <button class="ui-btn minimize" @click="minBtn">
        <svg x="0px" y="0px" viewBox="0 0 10.2 1">
          <rect x="0" y="50%" width="10.2" height="1" />
        </svg>
      </button>
      <button class="ui-btn close" @click="closeBtn">
        <svg viewBox="0 0 10 10">
          <polygon
            points="10.2,0.7 9.5,0 5.1,4.4 0.7,0 0,0.7 4.4,5.1 0,9.5 0.7,10.2 5.1,5.8 9.5,10.2 10.2,9.5 5.8,5.1"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    minBtn() {
      this.$electron.ipcRenderer.send("minimize");
    },
    closeBtn() {
      this.$electron.ipcRenderer.send("close");
    }
  }
};
</script>

<style scoped>
#ui-titlebar {
  display: flex;
  width: 100%;
  height: 32px;
  background: #171717;
  user-select: none;
  cursor: default;
  -webkit-app-region: drag;
}
#ui-titletext {
  max-height: 32px;
  flex: auto;
  font: 12px/32px "Segoe UI", Arial, sans-serif;
  color: #fff;
  text-indent: 10px;
}
#ui-titlecontrols {
  -webkit-app-region: no-drag;
  max-width: 144px;
  max-height: 32px;
  text-align: right;
}
.ui-btn {
  margin: 0;
  width: 48px;
  height: 32px;
  border: 0;
  outline: 0;
  background: transparent;
}
.ui-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
.ui-btn.close:hover {
  background: #e81123;
}
.ui-btn svg path,
.ui-btn svg rect,
.ui-btn svg polygon {
  fill: #fff;
}
.ui-btn svg {
  width: 10px;
  height: 10px;
}
</style>
