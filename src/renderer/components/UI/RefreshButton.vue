<template>
  <div id="sync" v-bind:class="{ top: aurasShown > 0 }">
    <v-button v-if="usable" @click="refresh" type="refresh">
      <svg
        v-bind:class="{ spin: fetching }"
        width="32"
        height="44"
        viewBox="0 0 32 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 6V0L8 8L16 16V10C22.62 10 28 15.38 28 22C28 24.02 27.5 25.94 26.6 27.6L29.52 30.52C31.08 28.06 32 25.14 32 22C32 13.16 24.84 6 16 6ZM16 34C9.38 34 4 28.62 4 22C4 19.98 4.5 18.06 5.4 16.4L2.48 13.48C0.919999 15.94 0 18.86 0 22C0 30.84 7.16 38 16 38V44L24 36L16 28V34Z"
          fill="black"
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
}
.btn-refresh svg {
  height: 30px;
}
/* Spin Animation */
.spin {
  animation-name: spin;
  animation-duration: 800ms;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  animation-fill-mode: forwards;
}

.btn-refresh {
  padding-left: 13px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(-360deg);
  }
}
</style>
