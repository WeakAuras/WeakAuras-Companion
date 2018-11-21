<template>
  <label class="file-select">
    <!-- We can't use a normal button element here, as it would become the target of the label. -->
    <div class="select-button">
      <!-- Display the filename if a file has been selected. -->
      <span v-if="path" class="btn btn-large btn-default">{{path}}</span>
      <span v-else class="btn btn-large btn-default">Select World Of Warcraft Directory</span>
    </div>
    <!-- Now, the file input that we hide. -->
    <input type="file" webkitdirectory @change="handleFileChange"/>
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
</style>
