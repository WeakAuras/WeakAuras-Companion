<template>
  <div id="StopMotionSettings">
    <div class="config-row">
      <div class="config-row-item">
        <div class="title">
          File Information
        </div>
        <div class="block">
          Name: {{gif.meta.name}}<br />
          Size: {{gif.meta.width}}px x {{gif.meta.height}}px<br />
          Frames: {{gif.meta.frames}}<br />
        </div>
      </div>
      <div class="config-row-item">
        <div class="title">
          Destination
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
          Output Settings
        </div>
        <div class="block">
          <label for="scaling">Scaling</label> <input type="range" id="scaling" name="scaling" min="0.1" max="1" v-model="gif.settings.scaling" step="0.01" /> {{ Math.round(gif.settings.scaling * 100) }}%
          <br />
          <checkbox v-model="gif.settings.coalesce">Coalesce (movie animation)</checkbox>
          <checkbox v-model="gif.settings.skips">Skip Frames</checkbox>
          <span v-if="gif.settings.skips">
            <label for="skips_value">Skip every</label>
            <input type="range" id="skips_value" name="skips_value" min="2" max="10" v-model="gif.settings.skips_value" step="1" />
            <label for="skips_value">{{ gif.settings.skips_value }} frames</label>
          </span>
        </div>
      </div>
      <div class="config-row-item">
        <div class="title">
          Output Information
        </div>
        <div class="block">
          <div>
            Rows / Columns: {{ result.rows }} x {{ result.cols }}<br />
            Frame Size: {{Math.floor(gif.meta.width * gif.settings.scaling)}}px x {{Math.floor(gif.meta.height * gif.settings.scaling)}}px<br />
            Output Size: {{ result.width }}px x {{ result.height }}px<br />
            Frames: {{ result.frames }}<br /><br />
            Size: 
            <span :class="{oversize: result.size / 1024 > 16, goodsize: result.size / 1024 <= 8}">{{ result.size / 1024 }}</span> 
            <span v:if="result.size > 0">MB</span>
          </div>
        </div>
      </div>
    </div>
    <div id="mid">
      <Button v-if="result.size / 1024 <= 16" :class="{ spin: result.computing }" @click="generate()" type="refresh">
        <i class="material-icons sync">sync</i>
        <span>Generate StopMotion Animation</span>
      </Button>
      <Button v-if="result.size / 1024 > 16" :class="{ spin: result.computing }" @click="generate()" type="issue">
        <i class="material-icons error" v-if="result.size / 1024 > 16">error_outline</i>
        <span>Generate StopMotion Animation</span>
      </Button>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import Button from "./Button.vue";
import Checkbox from "./Checkbox.vue";
import Dropdown from "./Dropdown.vue";
import gif2tga from "@/libs/gif2tga";
import path from "path";
import { useConfigStore } from "@/stores/config";
import { useStopMotionStore } from "@/stores/stopmotion";

export default defineComponent({
  name: "StopMotionSettings",
  props: ["wowVersions"],
  components: {
    Button,
    Checkbox,
    Dropdown
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
    this.calc()
  },
  watch: {
    gif: {
      handler() {
        this.calc()
      },
      deep: true,
    },
  },
  methods: {
    calc() {
      try {
        let info = gif2tga.calculateFileSize(
          this.gif.meta.width,
          this.gif.meta.height,
          this.gif.meta.frames,
          this.gif.settings.scaling,
          this.gif.settings.skips,
          this.gif.settings.skips_value
        )
        this.result.cols = info.cols
        this.result.rows = info.rows
        this.result.height = info.height
        this.result.width = info.width
        this.result.height = info.height
        this.result.frames = info.frames
        this.result.size = info.size
        let frameWidth = Math.floor(this.gif.meta.width * this.gif.settings.scaling)
        let frameHeigth = Math.floor(this.gif.meta.height * this.gif.settings.scaling)
        let prefix = path.parse(this.gif.meta.name).name;
        let filename = `${prefix}.x${info.rows}y${info.cols}f${info.frames}w${frameWidth}h${frameHeigth}W${info.width}H${info.height}.tga`;

        this.result.destination = path.join(
          this.config.wowpath.value,
          this.gif.settings.wowVersion,
          "Interface",
          "animations",
          filename
        )

        this.result.fileCreated = false
        this.result.computing = false
      } catch(e) {
        console.log(JSON.stringify(e))
        alert("error");
      }
    },
    async generate() {
      if (this.result.size / 1024 > 16) {
        alert("File will be too big with this settings, reduce scaling and/or skip frames");
      } else {
        this.result.computing = true

        try {
          const {destFile, preview } = await gif2tga.convert(
            this.gif.path,
            this.gif.settings.scaling,
            this.gif.settings.coalesce,
            this.gif.settings.skips,
            this.gif.settings.skips_value,
            path.join(
              this.config.wowpath.value,
              this.gif.settings.wowVersion,
              "Interface",
              "animations"
            )
          )
          this.result.computing = false;
          this.result.fileCreated = true;
          this.result.destination = destFile;
          this.result.preview = preview;
          this.$emit("next")
        } catch (e) {
          console.log(JSON.stringify(e))
          this.result.computing = false;
          this.result.fileCreated = false;
          alert("error");
        }
      }
    }
  }
});
</script>

<style scoped lang="scss">

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
