<template>
  <div id="sync" v-bind:class="{ top: aurasShown > 0 }">
    <v-button v-if="usable" @click="refresh" type="refresh">
      <i v-bind:class="{ spin: fetching }" class="material-icons sync">sync</i>
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
  bottom: 8px;
  line-height: 50px;
  cursor: pointer;
}
.material-icons {
  font-size: 34px;
  vertical-align: top;
  cursor: pointer;
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
  padding: 12px 15px;
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
