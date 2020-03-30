<template>
  <label class="file-select" @click="handleInputClick">
    <span class="select-button">
      <p class="configlabel"><slot></slot></p>
      <div class="fakeinput pointer">
        <span class="wow-path">{{ path }}&nbsp;</span>
      </div>
      <i class="material-icons folder">folder_open</i>
    </span>
  </label>
</template>

<script>
import { remote } from "electron";

export default {
  props: ["path", "createDirectory", "defaultPath"],
  data() {
    return {
      dialogOpen: false,
    };
  },
  methods: {
    async handleInputClick() {
      if (!this.dialogOpen) {
        this.dialogOpen = true;

        const result = await remote.dialog.showOpenDialog({
          properties: ["openDirectory"],
          createDirectory: this.createDirectory,
          defaultPath: this.path || this.defaultPath,
          openDirectory: true,
        });

        this.dialogOpen = false;

        if (result.filePaths && result.filePaths.length) {
          this.$emit("update:path", result.filePaths[0]);
        }
      }
    },
  },
};
</script>

<style scoped lang="scss">
$button-color-bg: #101010;

$highlight-color: #1a1a1a;
$highlight-color-text: #ffffff;

$text-color: #e6e6e6;

$border-color: #2c2c2c;
$border-color-expand: #2c2c2c;
$border-color-separate: #0d0d0d;

/* Don't forget to hide the original file input! */
.file-select > input[type="file"] {
  display: none;
}

.fakeinput {
  background-color: $border-color-separate;
  width: 270px;
  height: 30px;
  font-size: 14px;
  white-space: nowrap;
  display: inline-table;
  table-layout: fixed;
  color: $text-color;
  border-radius: 4px;
  border: 1px solid $border-color;
  margin-right: 2px;
  margin-left: 5px;
  padding: 5px 30px 5px 10px;
}

.fakeinput:hover {
  background-color: $highlight-color;
  border-color: $border-color-expand;
  color: $highlight-color-text;
  transition: all 0.1s ease-in-out;
}

.folder {
  position: relative;
  top: 5px;
  cursor: pointer;
}
.btn {
  display: inline-block;
  cursor: pointer;
}
.configlabel {
  color: #eee;
  margin-top: 5px;
  font-size: 15px;
  font-weight: 500;
}
.wow-path {
  display: table-cell;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
