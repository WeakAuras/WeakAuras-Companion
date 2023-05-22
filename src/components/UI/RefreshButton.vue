<template>
  <div id="sync" :class="{ top: aurasShown > 0 }">
    <UIButton
      v-if="isSettingsOk && isSvOk && isAddonsOk && this.aurasShown > 0"
      :class="{ spin: fetching }"
      type="refresh"
      @click="refresh"
    >
      <i class="material-icons sync">sync</i>
      <span>{{ $t("app.refreshbutton.label" /* Fetch Updates */) }}</span>
    </UIButton>
    <UIButton v-else-if="!isSettingsOk" type="issue" @click="gotoconfig">
      <i class="material-icons error">error_outline</i>
      <span>{{ $t("app.refreshbutton.finishsetup" /* Finish Setup */) }}</span>
    </UIButton>
    <label v-else-if="!isVersionSelected" class="label-issue">
      <i class="material-icons error">error_outline</i>
      <span>{{
        $t(
          "app.refreshbutton.selectversion" /* Please select your WoW Version! */
        )
      }}</span>
    </label>
    <label v-else-if="!isAccountSelected" class="label-issue">
      <i class="material-icons error">error_outline</i>
      <span>{{
        $t(
          "app.refreshbutton.selectaccount" /* Please select your Account Name! */
        )
      }}</span>
    </label>
    <label v-else-if="!isSvOk" class="label-issue">
      <i class="material-icons error">error_outline</i>
      <span>{{
        $t(
          "app.refreshbutton.incorrectsv" /* No AddOn data found for this account */
        )
      }}</span>
    </label>
    <label v-if="isSettingsOk && isSvOk && isAddonsOk && isVersionSelected && isAccountSelected && this.aurasShown === 0" class="label-issue">
      <i class="material-icons error">error_outline</i>
      <span>{{
        $t(
          "app.refreshbutton.noAurasInstalled" /* No updateable auras installed on this account */
        )
      }}</span>
    </label>
    <label v-if="isSettingsOk && !isAddonsOk && isVersionSelected && isAccountSelected" class="label-issue">
      <i class="material-icons error">error_outline</i>
      <span>{{
        $t(
          "app.refreshbutton.addonNotFound" /* No supported AddOn installed */
        )
      }}</span>
    </label>
    <label v-if="!isAddonsOk && isAccountSelected" class="label-issue">
      <span>
        <a class="download" href="https://www.curseforge.com/wow/addons/weakauras-2" target="_blank">
          <img src="/social-icons/curse.svg" class="logo" title="CurseForge" />
          {{ $t("app.footer.getweakauras" /* Get WeakAuras! */) }}
        </a>
      </span>
    </label>
    <div v-if="lastUpdate && isAddonsOk && isSvOk && olderThan30s()" id="lastupdate">
      {{ $t("app.refreshbutton.lastupdate" /* last update: */) }}
      <b>{{ fromNow }}</b>
    </div>
  </div>
</template>

<script>
import { DateTime } from "luxon";
import { defineComponent } from "vue";
import UIButton from "./UIButton.vue";

export default defineComponent({
  name: "RefreshButton",
  components: { UIButton },
  filters: {},
  props: [
    "usable",
    "fetching",
    "lastUpdate",
    "aurasShown",
    "isSettingsOk",
    "isVersionSelected",
    "isAccountSelected",
    "isSvOk",
    "isAddonsOk"
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
  beforeUnmount() {
    clearInterval(this.lastUpdateTimer);
  },
  methods: {
    olderThan30s() {
      return (
        DateTime.local().diff(DateTime.fromJSDate(this.lastUpdate)).valueOf() >
        30000
      );
    },
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
  computed: {
    fromNow() {
      if (!this.lastUpdate) return "n/a";
      return DateTime.fromJSDate(this.lastUpdate).toRelative({ locale: this.$i18n.locale });
    }
  },
  mount() {
    this.scheduleTimer();
  },
});
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

.download {
  clear: both;
  display: block;
  margin-top: 10px;
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
