<template>
  <label class="file-select">
    <span class="select-button">
      <p class="configlabel">
        {{ $t("app.fileselect.wowfolder" /* World of Warcraft folder */) }}
      </p>
      <div class="fakeinput pointer"><span class="wow-path">{{ path }}&nbsp;</span></div>
      <div class="pointer-icon" />
    </span>
    <input type="file" webkitdirectory @change="handleFileChange" />
  </label>
</template>

<script>
export default {
  props: {
    path: null
  },
  methods: {
    handleFileChange(e) {
      if (e) {
        this.$emit("update:path", e.target.files[0].path);
      }
    }
  }
};
</script>

<style scoped>
/* Don't forget to hide the original file input! */
.file-select > input[type="file"] {
  display: none;
}
.pointer-icon {
  display: inline-block;
  border-radius: 2px;
  cursor: pointer;
  vertical-align: top;
  background-image: url("~@/assets/folder-icon.png");
  background-size: contain;
  height: 27px;
  width: 27px;
}
.pointer-icon:hover {
  background-image: url("~@/assets/folder-icon-active.png");
}

.fakeinput {
  background-color: #eee;
  width: 270px;
  height: 27px;
  font-size: 13px;
  white-space: nowrap;
  display: inline-table;
  table-layout: fixed;
  color: black;
  border-radius: 2px;
  padding: 0 5px;
}
.btn {
  display: inline-block;
  cursor: pointer;
}
.configlabel {
  color: #eee;
  margin: 3px 0 3px;
  font-size: 15px;
}
.wow-path {
  display: table-cell;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
