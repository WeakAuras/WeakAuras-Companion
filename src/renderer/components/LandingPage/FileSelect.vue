<template>
  <label class="file-select">
    <!-- We can't use a normal button element here, as it would become the target of the label. -->
    <div class="select-button">
      <!-- Display the filename if a file has been selected. -->
      <span v-if="value">Selected WoW Folder: {{value.path}}</span>
      <span v-else>Select File</span>
    </div>
    <!-- Now, the file input that we hide. -->
    <input type="file" webkitdirectory @change="handleFileChange"/>
  </label>
</template>

<script>
export default {
  props: {
    // Using value here allows us to be v-model compatible.
    value: File
  },

  methods: {
    handleFileChange(e) {
      // Whenever the file changes, emit the 'input' event with the file data.
      this.$emit("input", e.target.files[0]);
    }
  }
};
</script>

<style scoped>
.file-select > .select-button {
  padding: 1rem;

  color: white;
  background-color: #2ea169;

  border-radius: 0.3rem;

  text-align: center;
  font-weight: bold;
}

/* Don't forget to hide the original file input! */
.file-select > input[type="file"] {
  display: none;
}
</style>
