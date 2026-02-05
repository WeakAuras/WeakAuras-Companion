<script setup lang="ts">
import { useStashStore } from "@/stores/auras";

import type { Updater } from "../LandingPage.vue";

defineProps<{
  updater: Updater;
}>();

const emit = defineEmits<{
  (e: "toggleReport"): void;
  (e: "toggleUpdatedAuraList"): void;
  (e: "installUpdates"): void;
}>();

const stash = useStashStore();

function handleReportClick() {
  emit("toggleReport");
}

function handleUpdatedAuraListClick() {
  emit("toggleUpdatedAuraList");
}

function handleInstallUpdates() {
  emit("installUpdates");
}
</script>

<template>
  <footer>
    <a
      class="getweakauras"
      href="https://www.curseforge.com/wow/addons/weakauras-2"
      target="_blank"
    >
      <i
        class="i-social-curse align-middle text-xl -mt-[2px]"
        title="CurseForge"
      />
      {{ $t("app.footer.getweakauras" /* Get WeakAuras! */) }}
    </a>
    <a
      class="browsewago"
      href="https://wago.io/weakauras"
      target="_blank"
    >
      <i
        class="i-social-wago align-middle text-xl -mt-[2px]"
        title="Wago"
      />
      {{ $t("app.footer.browsewago" /* Browse Wago for more auras! */) }}
    </a>
    <a
      class="reportbug"
      @click="handleReportClick"
    >
      {{ $t("app.footer.reportbug" /* Found a bug? */) }}
      <i
        class="i-mdi-bug align-middle text-xl -mt-[2px]"
        title="Bug"
      />
    </a>
    <div
      v-if="stash.auras.length > 0"
      class="ready-to-install"
      @click="handleUpdatedAuraListClick"
    >
      <span>
        {{ $t("app.footer.readytoinstall" /* Ready To Install */) }}
        ({{ stash.auras.length }})
      </span>
      <i
        v-tooltip="{
          strategy: 'fixed',
          theme: 'info-tooltip',
          html: true,
          content: `${$t(
            'app.main.readyForInstall' /* Ready for Install */,
          )}${stash.tohtml()}`,
        }"
        class="update-available update-auras i-mdi-download mt-[2px] align-middle text-2xl"
      />
    </div>
    <div class="app-update">
      <a
        v-if="updater.status === 'update-available'"
        :href="updater.path"
        target="_blank"
      >
        <i
          v-if="updater.status === 'update-available'"
          v-tooltip="{
            strategy: 'fixed',
            theme: 'info-tooltip',
            html: true,
            content: `${$t(
              'app.main.installUpdate' /* Install client update */,
            )}: v${updater.version} ${updater.releaseNotes}`,
          }"
          class="update-available i-mdi-download-box-outline mt-[2px] align-middle text-2xl"
        />
      </a>
      <i
        v-if="updater.status === 'update-downloaded'"
        v-tooltip="{
          strategy: 'fixed',
          theme: 'info-tooltip',
          content: `${$t(
            'app.main.installUpdate' /* Install client update */,
          )}: v${updater.version}`,
        }"
        class="update-available i-mdi-download-box-outline mt-[2px] align-middle text-2xl"
        @click="handleInstallUpdates"
      />
      <div
        v-if="updater.status === 'checking-for-update'"
        class="updating"
      >
        <span class="i-mdi-sync text-2xl"></span>
      </div>
      <div
        v-if="updater.status === 'download-progress'"
        class="updating"
      >
        <span class="progress">{{ updater.progress }}%</span>
        <i class="icon i-mdi-sync align-middle text-2xl" />
      </div>
    </div>
  </footer>
</template>

<style scoped>
.reportbug {
  font-size: 12px;
  color: #e6e6e6;
  vertical-align: bottom;
  line-height: 25px;
  float: right;
  text-shadow: #000000 1px 0;
  font-weight: 600;
  opacity: 0.5;
}

.reportbug:hover {
  opacity: 1;
}

.ready-to-install {
  font-size: 12px;
  color: #e6e6e6;
  vertical-align: bottom;
  line-height: 25px;
  float: right;
  text-shadow: #000000 1px 0;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  padding-right: 15px;
}

.ready-to-install span {
  cursor: pointer;
  opacity: 0.8;
  margin-right: 5px;
}

.ready-to-install:hover span {
  opacity: 1;
}

.getweakauras {
  font-size: 12px;
  color: #e6e6e6;
  vertical-align: bottom;
  line-height: 25px;
  float: left;
  text-shadow: #000000 1px 0;
  font-weight: 600;
  opacity: 0.5;
}

.getweakauras:hover {
  opacity: 1;
}

.browsewago {
  font-size: 12px;
  color: #e6e6e6;
  vertical-align: bottom;
  line-height: 25px;
  float: left;
  text-shadow: #000000 1px 0;
  font-weight: 600;
  opacity: 0.5;
  margin-left: 10px;
}

.browsewago:hover {
  opacity: 1;
}

.app-update {
  float: right;
  margin-right: 15px;
  height: 25px;
  position: relative;
  bottom: 2px;
}

.app-update .updating {
  display: inline;
}

.updating .icon {
  animation: spin;
  animation-duration: 3000ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

.updating .progress {
  font-size: 14px;
  font-weight: 500;
  margin: auto;
  vertical-align: middle;
  position: relative;
  bottom: 7px;
}

.update-available {
  animation: pulse 2s infinite;
  cursor: pointer;
  color: #51ae42 !important;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(-360deg);
  }
}

@keyframes pulse {
  0% {
    text-shadow:
      0 0 0 rgba(102, 255, 0, 1),
      0 0 0 rgba(255, 255, 255, 0.4);
  }

  70% {
    text-shadow:
      0 0 40px rgba(102, 255, 0, 1),
      0 0 40px rgba(238, 255, 4, 0);
  }

  100% {
    text-shadow:
      0 0 0 rgba(102, 255, 0, 1),
      0 0 0 rgba(255, 255, 255, 0);
  }
}
</style>
