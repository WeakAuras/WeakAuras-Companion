<script lang="ts">
import StopMotionSelectGif from "./StopMotionSelectGif.vue";
import StopMotionSettings from "./StopMotionSettings.vue";
import StopMotionResult from "./StopMotionResult.vue";
import UIButton from "./UIButton.vue";

// import { useStopMotionStore } from "../../stores/stopmotion";

export default {
  name: "StopMotion",
  components: {
    StopMotionSelectGif,
    StopMotionSettings,
    StopMotionResult,
    UIButton,
  },
  props: {
    wowVersions: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      step: 1,
    };
  },
  methods: {
    setStep(value) {
      this.step = value;
    },
    next() {
      this.step++;
    },
    prev() {
      this.step--;
    },
  },
};
</script>

<template>
  <div id="StopMotion">
    <div>
      <div class="title">
        {{
          $t("app.stopmotion.selectgifconverter" /* StopMotion GIF Converter */)
        }}
      </div>
      <br />
      <div class="bts-top-right">
        <UIButton
          v-if="step === 3"
          class="btn-ok btn-title"
          @click="setStep(1)"
        >
          <span class="i-mdi-first-page align-middle text-3xl">first_page</span>
        </UIButton>
        <UIButton
          v-if="step > 1"
          class="btn-title btn-ok"
          @click="prev()"
        >
          <span class="i-mdi-keyboard-backspace align-middle text-3xl"
            >keyboard_backspace</span
          >
        </UIButton>
      </div>
    </div>
    <StopMotionSelectGif
      v-if="step === 1"
      @next="next()"
    />
    <StopMotionSettings
      v-if="step === 2"
      :wow-versions="wowVersions"
      @next="next()"
    />
    <StopMotionResult v-if="step === 3" />
  </div>
</template>

<style scoped lang="css">
#StopMotion {
  padding: 5px 0 5px 2.35vw;
  text-align: left;
  overflow: auto;
  height: 100%;
  width: 100%;
}

.config-row {
  display: flex;
  flex-wrap: wrap;
}

.config-row-item {
  flex: 50%;
}

.title {
  margin: 20px 0 10px;
}

.block {
  margin-left: 15px;
  font-size: 15px;
}

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

.btn-issue span,
.btn-refresh span {
  position: relative;
  bottom: 8px;
  line-height: 50px;
  cursor: pointer;
}

.btn-title {
  height: 40px;
}

.btn-refresh.spin {
  background: #ababab;
  border-color: transparent;
  color: #313131;
}

.btn-issue,
.btn-refresh {
  padding: 12px 15px;
  padding-left: 13px;
}

.center {
  position: relative;
  left: 50%;
  transform: translate(-50%, 0);
  margin: 20px 0 0;
  max-width: 100%;
}

.bts-top-right {
  position: absolute;
  right: 40px;
  top: 30px;
}
</style>
