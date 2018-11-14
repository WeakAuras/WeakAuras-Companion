<template>
  <div>
    <div v-if="!fileIsOk">
      <p><file-select v-model="file"></file-select></p>
    </div>
    <div id="message">{{ message }}</div>
    <AuraList v-if="file" :file="file" @handleFile="handleFile"></AuraList>
  </div>
</template>

<script>
import AuraList from "./LandingPage/AuraList";
import FileSelect from "./LandingPage/FileSelect";

export default {
  name: "landing-page",
  components: { AuraList, FileSelect },
  data() {
    return {
      message: "",
      file: null,
      fileIsOk: false
    };
  },
  methods: {
    open(link) {
      this.$electron.shell.openExternal(link);
    },
    handleFile(msg, res) {
      this.message = msg;
      this.fileIsOk = res;
    }
  }
};
</script>

<style>
@import url("https://fonts.googleapis.com/css?family=Source+Sans+Pro");

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: "Source Sans Pro", sans-serif;
}
</style>