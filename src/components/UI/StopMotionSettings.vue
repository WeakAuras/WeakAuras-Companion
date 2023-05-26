<template>
  <div id="StopMotionSettings">
    <div
      v-if="!gif.tenor"
      class="config-row"
    >
      <div class="config-row-item">
        <div class="title">
          {{ $t("app.stopmotion.fileinformation" /* File Information */) }}
        </div>
        <div class="block">
          {{ $t("app.stopmotion.name" /* Name */) }}: {{ gif.meta.name }}<br />
          {{ $t("app.stopmotion.size" /* Size */) }}: {{ gif.meta.width }}px x {{ gif.meta.height }}px<br />
          {{ $t("app.stopmotion.frames" /* Frames */) }}: {{ gif.meta.frames }}<br />
        </div>
      </div>
      <div class="config-row-item">
        <div class="title">
          {{ $t("app.stopmotion.destination" /* Destination */) }}
        </div>
        <div class="block">
          <div>
            <Dropdown
              v-model:value="gif.settings.wowVersion"
              :options="wowVersions"
              :label="$t('app.wowpath.version' /* Version */)"
            />
          </div>
        </div>
      </div>
      <div class="config-row-item">
        <div class="title">
          {{ $t("app.stopmotion.output.settings" /* Output Settings */) }}
        </div>
        <div class="block">
          <label for="scaling">{{ $t("app.stopmotion.scaling" /* Scaling */) }}</label>
          <input
            type="range"
            id="scaling"
            name="scaling"
            min="0.1"
            max="1"
            v-model="gif.settings.scaling"
            step="0.01"
          />
          {{ Math.round(gif.settings.scaling * 100) }}%
          <br />
          <checkbox v-model="gif.settings.coalesce">{{
            $t("app.stopmotion.coalesce" /* Coalesce (movie animation) */)
          }}</checkbox>
          <checkbox v-model="gif.settings.skips">{{ $t("app.stopmotion.skipframes" /* Skip Frames */) }}</checkbox>
          <span v-if="gif.settings.skips">
            <label for="skips_value">{{ $t("app.stopmotion.skipevery" /* Skip every */) }}</label>
            <input
              type="range"
              id="skips_value"
              name="skips_value"
              min="2"
              max="10"
              v-model="gif.settings.skips_value"
              step="1"
            />
            <label for="skips_value"
              >{{ gif.settings.skips_value }} {{ $t("app.stopmotion.frames" /* frames */) }}</label
            >
          </span>
        </div>
      </div>
      <div class="config-row-item">
        <div class="title">
          {{ $t("app.stopmotion.output.information" /* Output Information */) }}
        </div>
        <div class="block">
          <div>
            {{ $t("app.stopmotion.row.columns" /* Rows x Columns */) }}: {{ result.rows }} x {{ result.cols }}<br />
            {{ $t("app.stopmotion.frame.size" /* Frame Size */) }}:
            {{ Math.floor(gif.meta.width * gif.settings.scaling) }}px x
            {{ Math.floor(gif.meta.height * gif.settings.scaling) }}px<br />
            {{ $t("app.stopmotion.output.size" /* Output Size */) }}: {{ result.width }}px x {{ result.height }}px<br />
            {{ $t("app.stopmotion.Frames" /* Frames */) }}: {{ result.frames }}<br /><br />
            {{ $t("app.stopmotion.size" /* Size */) }}:
            <span
              :class="{
                oversize: result.size / 1024 > 16,
                goodsize: result.size / 1024 <= 8,
              }"
              >{{ result.size / 1024 }}</span
            >
            <span v:if="result.size > 0">MB</span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="gif.tenor"
      class="setting-destination-dropdown"
    >
      <Dropdown
        v-model:value="gif.settings.wowVersion"
        :options="wowVersions"
        :label="$t('app.wowpath.version' /* Version */)"
      />
    </div>
    <div id="mid">
      <UIButton
        v-if="result.size / 1024 <= 16"
        :class="{ spin: result.computing }"
        @click="generate()"
        type="refresh"
      >
        <i class="material-icons sync">sync</i>
        <span>{{ $t("app.stopmotion.generatestopMotionanimation" /* Generate StopMotion Animation */) }}</span>
      </UIButton>
      <UIButton
        v-if="result.size / 1024 > 16"
        :class="{ spin: result.computing }"
        @click="generate()"
        type="issue"
      >
        <i
          class="material-icons error"
          v-if="result.size / 1024 > 16"
          >error_outline</i
        >
        <span>{{ $t("app.stopmotion.generatestopMotionanimation" /* Generate StopMotion Animation */) }}</span>
      </UIButton>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import UIButton from "./UIButton.vue";
import Checkbox from "./Checkbox.vue";
import Dropdown from "./Dropdown.vue";
import gif2tga from "@/libs/gif2tga";
import path from "path";
import { useConfigStore } from "../../stores/config";
import { useStopMotionStore } from "../../stores/stopmotion";

export default defineComponent({
  name: "StopMotionSettings",
  props: ["wowVersions"],
  components: {
    UIButton,
    Checkbox,
    Dropdown,
  },
  setup() {
    const config = useConfigStore();
    const { gif, result } = useStopMotionStore();
    gif.settings.wowVersion = config.wowpath.version;
    return {
      config,
      gif,
      result,
    };
  },
  mounted() {
    if (this.gif.tenor) {
      this.gif.settings.coalesce = true;
    }

    this.auto_scaling();
    this.calc();
  },
  watch: {
    gif: {
      handler() {
        this.calc();
      },
      deep: true,
    },
    "gif.settings.wowVersion"() {
      this.config.wowpath.version = this.gif.settings.wowVersion;
    },
  },
  methods: {
    auto_scaling() {
      try {
        for (let scaling = 1; scaling > 0; scaling = scaling - 0.01) {
          const { size } = gif2tga.calculateFileSize(
            this.gif.meta.width,
            this.gif.meta.height,
            this.gif.meta.frames,
            scaling,
            this.gif.settings.skips,
            this.gif.settings.skips_value
          );

          if (size / 1024 <= 16) {
            this.gif.settings.scaling = scaling;
            break;
          }
        }
      } catch (e) {
        console.log(JSON.stringify(e));
      }
    },
    calc() {
      try {
        let info = gif2tga.calculateFileSize(
          this.gif.meta.width,
          this.gif.meta.height,
          this.gif.meta.frames,
          this.gif.settings.scaling,
          this.gif.settings.skips,
          this.gif.settings.skips_value
        );
        this.result.cols = info.cols;
        this.result.rows = info.rows;
        this.result.height = info.height;
        this.result.width = info.width;
        this.result.height = info.height;
        this.result.frames = info.frames;
        this.result.size = info.size;
        let frameWidth = Math.floor(this.gif.meta.width * this.gif.settings.scaling);
        let frameHeight = Math.floor(this.gif.meta.height * this.gif.settings.scaling);
        let prefix = path.parse(this.gif.meta.name).name;
        let filename = `${prefix}.x${info.rows}y${info.cols}f${info.frames}w${frameWidth}h${frameHeight}W${info.width}H${info.height}.tga`;

        this.result.destination = path.join(
          this.config.wowpath.value,
          this.gif.settings.wowVersion,
          "Interface",
          "AddOns",
          "WeakAurasCompanion",
          "animations",
          filename
        );

        this.result.computing = false;
      } catch (e) {
        console.log(JSON.stringify(e));
        alert("error");
      }
    },
    async generate() {
      if (this.result.size / 1024 > 16) {
        alert("File will be too big with this settings, reduce scaling and/or skip frames");
      } else {
        this.result.computing = true;

        try {
          const { destFile, preview } = await gif2tga.convert(
            this.gif.path,
            this.gif.settings.scaling,
            this.gif.settings.coalesce,
            this.gif.settings.skips,
            this.gif.settings.skips_value,
            path.join(
              this.config.wowpath.value,
              this.gif.settings.wowVersion,
              "Interface",
              "AddOns",
              "WeakAurasCompanion",
              "animations"
            ),
            this.gif.tenor ? this.gif.buffer : undefined
          );
          this.result.computing = false;
          this.result.destination = destFile;
          this.result.preview = preview;
          this.$emit("next");
        } catch (e) {
          console.log(JSON.stringify(e));
          this.result.computing = false;
          this.result.fileCreated = false;
          alert("error");
        }
      }
    },
  },
});
</script>

<style scoped lang="scss">
.setting-destination-dropdown {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 10%;
}

#mid {
  text-align: center;
  width: 100%;
  margin: auto;
  transition: all 0.4s ease-in-out;
  span {
    position: relative;
    bottom: 8px;
    line-height: 50px;
    cursor: pointer;
  }
}

.config-row {
  display: flex;
  flex-wrap: wrap;
}

.config-row-item {
  flex: 50%;
  margin-bottom: 30px;
}
/* Spin Animation */
.spin .sync {
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

.oversize {
  color: #f44336;
}
.goodsize {
  color: #51ae42;
}
</style>
