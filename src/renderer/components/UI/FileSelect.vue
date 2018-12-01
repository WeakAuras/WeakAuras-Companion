<template>
  <label class="file-select">
    <span class="select-button">
      <p class="configlabel">World of Warcraft folder</p>
      <div class="fakeinput pointer">{{ path }}&nbsp;</div>
      &nbsp; <span class="pointer">🗁</span>
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
.pointer {
  cursor: pointer;
}
.fakeinput {
  background-color: white;
  width: 270px;
  display: inline-block;
  color: black;
}
.btn {
  display: inline-block;
  cursor: pointer;
}
.configlabel {
  color: gray;
}
</style>
