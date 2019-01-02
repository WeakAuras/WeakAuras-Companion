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
          d="M19.9632 0C13.291 0 7.47074 3.74271 4.35545 9.28213C3.80929 10.2533 2.64152 10.745 1.60881 10.3267C1.1683 10.1477 0.664972 10.2553 0.334365 10.5983C0.00288538 10.9421 -0.0921968 11.4526 0.0944783 11.8925L3.05162 18.8769C3.17462 19.1652 3.40404 19.3944 3.69364 19.5108C3.98238 19.6289 4.30514 19.6254 4.59038 19.5002L11.5009 16.5114C11.9361 16.3237 12.2162 15.8881 12.2109 15.4085C12.2048 14.9298 11.9143 14.5013 11.4747 14.3232C10.1936 13.8045 9.58022 12.308 10.384 11.1835C12.5548 8.14679 16.035 6.17152 19.9623 6.17152C26.5413 6.17152 31.8938 11.7012 31.8938 18.4996C31.8938 25.2979 26.5395 30.8285 19.9623 30.8285C17.0409 30.8285 14.3681 29.7352 12.2955 27.9243C11.0856 26.8681 9.2843 26.9184 8.15815 28.0663C8.14332 28.0822 8.12936 28.0954 8.11453 28.1113C6.87323 29.3738 6.96308 31.4315 8.2951 32.5935C11.4415 35.339 15.5152 37 19.9623 37C29.9075 37 38 28.702 38 18.4996C38.0017 8.29893 29.9093 0 19.9632 0Z"
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
  padding-right: 1.1px;
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
    transform: rotate(-360deg);
  }
}
</style>
