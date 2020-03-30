<template>
  <div id="sync" :class="{ top: aurasShown > 0 }">
    <Button
      v-if="isSettingsOk && isSvOk"
      :class="{ spin: fetching }"
      type="refresh"
      @click="refresh"
    >
      <i class="material-icons sync">sync</i>
      <span>{{ $t("app.refreshbutton.label" /* Fetch Updates */) }}</span>
    </Button>
    <Button v-else-if="!isSettingsOk" type="issue" @click="gotoconfig">
      <i class="material-icons error">error_outline</i>
      <span>{{ $t("app.refreshbutton.finishsetup" /* Finish Setup */) }}</span>
    </Button>
    <Label v-else-if="!isVersionSelected" class="label-issue">
      <i class="material-icons error">error_outline</i>
      <span>{{
        $t(
          "app.refreshbutton.selectversion" /* Please select your WoW Version! */
        )
      }}</span>
    </Label>
    <Label v-else-if="!isAccountSelected" class="label-issue">
      <i class="material-icons error">error_outline</i>
      <span>{{
        $t(
          "app.refreshbutton.selectaccount" /* Please select your Account Name! */
        )
      }}</span>
    </Label>
    <Label v-else-if="!isSvOk" class="label-issue">
      <i class="material-icons error">error_outline</i>
      <span>{{
        $t(
          "app.refreshbutton.incorrectsv" /* No WeakAuras data found for this account */
        )
      }}</span>
    </Label>
    <div v-if="lastUpdate && isSvOk" id="lastupdate">
      {{ $t("app.refreshbutton.lastupdate" /* last update: */) }}
      <b>{{ lastUpdate | fromNow($i18n.locale) }}</b>
    </div>
  </div>
</template>

<script>
import moment from "moment";
import Button from "./Button.vue";

export default {
  name: "RefreshButton",
  components: { Button },
  filters: {
    fromNow: (value, locale) => {
      if (!value) return "n/a";
      return moment(value).locale(locale).fromNow();
    },
  },
  props: [
    "usable",
    "fetching",
    "lastUpdate",
    "aurasShown",
    "isSettingsOk",
    "isVersionSelected",
    "isAccountSelected",
    "isSvOk",
  ],
  data() {
    return {
      lastUpdateTimer: null,
    };
  },
  watch: {
    fetching() {
      this.scheduleTimer();
    },
  },
  beforeDestroy() {
    clearInterval(this.lastUpdateTimer);
  },
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
    },
  },
  mount() {
    this.scheduleTimer();
  },
};
</script>

<style scoped lang="scss">
#sync {
  text-align: center;
  width: 100%;
  margin: auto;
  transition: all 0.4s ease-in-out;
}
#sync.top {
  position: relative;
  top: 10px;
}
#lastupdate {
  margin-top: 10px;
  font-size: small;
  color: #e6e6e6;
}
.btn-issue span,
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
.btn-refresh.spin {
  background: #ababab;
  border-color: transparent;
  color: #313131;
}
/* Spin Animation */
.spin .sync {
  animation-name: spin;
  animation-duration: 800ms;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  animation-fill-mode: forwards;
}
.btn-issue,
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
