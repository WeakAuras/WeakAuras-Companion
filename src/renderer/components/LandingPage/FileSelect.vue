<template>
  <label class="file-select">
    <!-- We can't use a normal button element here, as it would become the target of the label. -->
    <div class="select-button">
      <!-- Display the filename if a file has been selected. -->
      <span v-if="path">{{path}}</span>
      <span v-else>Select WoW Folder</span>
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
      this.$emit("update:path", e.target.files[0].path);
    }
  }
};
</script>

<style scoped>
/*:-moz-only-whitespace
.file-select > .select-button {
  padding: 1rem;

  color: white;
  background-color: #2ea169;

  border-radius: 0.3rem;

  text-align: center;
  font-weight: bold;
}
*/

/* Don't forget to hide the original file input! */
.file-select > input[type="file"] {
  display: none;
}
</style>
