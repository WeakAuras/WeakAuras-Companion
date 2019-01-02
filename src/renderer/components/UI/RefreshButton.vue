<template>
  <div id="sync" v-bind:class="{ top: aurasShown > 0 }">
    <v-button v-if="usable" @click="refresh" type="refresh">
      <svg
        v-bind:class="{ spin: fetching }"
        width="38"
        height="37"
        viewBox="0 0 38 37"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 18.5C0 28.7 8.1 37 18 37C22.4 37 26.5 35.3 29.7 32.6C31 31.4 31.1 29.4 29.9 28.1C28.8 27 27 26.9 25.8 28C23.7 29.8 21.1 30.9 18.1 30.9C11.5 30.9 6.20001 25.4 6.20001 18.6C6.20001 11.8 11.6 6.3 18.1 6.3C22 6.3 25.5 8.3 27.7 11.3C28.5 12.4 27.9 13.9 26.6 14.4C26.2 14.6 25.9 15 25.9 15.5C25.9 16 26.2 16.4 26.6 16.6L33.5 19.6C33.8 19.7 34.1 19.7 34.4 19.6C34.7 19.5 34.9 19.3 35 19L38 12C38.2 11.6 38.1 11 37.8 10.7C37.5 10.4 37 10.2 36.5 10.4C35.5 10.8 34.3 10.3 33.8 9.4C30.7 3.9 24.9 0.100015 18.2 0.100015C8.10001 1.53257e-05 0 8.30001 0 18.5Z"
          fill="#101010"
        />
      </svg>
      <span>{{ $t("app.refreshbutton.label" /* Fetch Updates */) }}</span>
    </v-button>
    <v-button v-else @click="gotoconfig" type="issue">
      {{ $t("app.refreshbutton.finishsetup" /* Finish Setup */) }}
    </v-button>
    <div id="lastupdate">
      {{ $t("app.refreshbutton.lastupdate" /* last update: */) }}
      <b>{{ lastUpdate | fromNow($i18n.locale) }}</b>
    </div>
  </div>
</template>

<script>
import moment from "moment";
import Button from "./Button.vue";

export default {
  name: "refreshButton",
  props: ["usable", "fetching", "lastUpdate", "aurasShown"],
  data() {
    return {
      lastUpdateTimer: null
    };
  },
  components: { "v-button": Button },
  methods: {
    refresh() {
      this.$parent.compareSVwithWago();
    },
    gotoconfig() {
      this.$parent.configStep = 1;
    },
    scheduleTimer() {
      if (this.lastUpdateTimer) clearInterval(this.lastUpdateTimer);
      this.lastUpdateTimer = setInterval(() => {
        this.$forceUpdate();
      }, 1000 * 60);
    }
  },
  filters: {
    fromNow: (value, locale) => {
      if (!value) return "n/a";
      return moment(value)
        .locale(locale)
        .fromNow();
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
  text-align: center;
  width: 100%;
  margin: auto;
  transition: all 0.2s ease-in-out;
}
#sync.top {
  margin-top: 40px;
}
#lastupdate {
  margin-top: 5px;
  font-size: small;
  color: #e6e6e6;
}
.btn-refresh span {
  position: relative;
  bottom: 9px;
  margin-left: 5px;
}
.btn-refresh svg {
  height: 30px;
  padding-left: 1.1px;
}
/* Spin Animation */
.spin {
  animation-name: spin;
  animation-duration: 800ms;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  animation-fill-mode: forwards;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
