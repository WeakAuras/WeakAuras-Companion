<template>
  <div id="sync">
    <br>
    <br>
    <spinner :spin="fetching"></spinner>
    <v-button @click="refresh" :type="!usable ? 'error' : 'refresh'">Search updates on Wago</v-button>
    <div id="lastupdate">Last update {{ lastUpdate | fromNow }}</div>
  </div>
</template>

<script>
import Spinner from "./Spinner";
import moment from "moment";
import Button from './Button'

export default {
  name: 'refreshButton',
  props: ['usable', 'fetching'],
  data() {
    return {
      lastUpdateTimer: null,
      lastUpdate: null
    }
  },
  components: { Spinner, 'v-button': Button },
  methods: {
    refresh() {
      this.$parent.compareSVwithWago()
    }
  },
  filters: {
    fromNow: value => {
      if (!value) return "n/a";
      return moment(value).fromNow();
    }
  },
  watch: {
    fetching() {
      if (!this.fetching) {
        this.lastUpdate = new Date ()

        if (this.lastUpdateTimer) clearInterval(this.lastUpdateTimer);
        // repeat every minutes
        this.lastUpdateTimer = setInterval(() => {
          const tmp = this.lastUpdate;
          this.lastUpdate = null;
          this.lastUpdate = tmp;
        }, 1000 * 60);
      }
    }
  },
  beforeDestroy() {
    clearInterval(this.lastUpdateTimer)
  }
};
</script>

<style scoped>
#sync {
  flex: 1;
  text-align: center;
}
#lastupdate {
  font-size: small;
}
</style>
