<template>
  <div id="sync">
    <br /><br />
    <spinner :spin="fetching"></spinner>
    <v-button @click="refresh" :type="!usable ? 'error' : 'refresh'">
      Check for updates on Wago
    </v-button>
    <div id="lastupdate">Last update: {{ lastUpdate | fromNow }}</div>
  </div>
</template>

<script>
import moment from "moment";
import Spinner from "./Spinner.vue";
import Button from "./Button.vue";

export default {
  name: "refreshButton",
  props: ["usable", "fetching", "lastUpdate"],
  data() {
    return {
      lastUpdateTimer: null
    };
  },
  components: { Spinner, "v-button": Button },
  methods: {
    refresh() {
      this.$parent.compareSVwithWago();
    },
    scheduleTimer() {
      if (this.lastUpdateTimer) clearInterval(this.lastUpdateTimer);
      this.lastUpdateTimer = setInterval(() => {
        this.$forceUpdate();
      }, 1000 * 60);
    }
  },
  filters: {
    fromNow: value => {
      if (!value) return "n/a";
      return moment(value).fromNow();
    }
  },
  mount() {
    this.scheduleTimer();
  },
  watch: {
    fetching() {
      this.scheduleTimer();
    }
  },
  beforeDestroy() {
    clearInterval(this.lastUpdateTimer);
  }
};
</script>

<style scoped>
#sync {
  flex: 1;
  text-align: center;
}
#lastupdate {
  margin-top: 5px;
  font-size: small;
}
</style>
