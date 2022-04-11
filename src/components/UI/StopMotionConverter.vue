<template>
  <div id="StopMotionConverter">
    <div class="config-row">
      <div class="config-row-item">
        <div class="title">
          Gif File
        </div>
        <div class="block">
          <file-select 
            v-model:path="fileSelectedPath"
            :create-directory="false"
            class="fileinput"
          >Select Gif File</file-select>
        </div>
        <div v-if="fileSelectedPath !== ''">
          <div class="title">
            Output Settings
          </div>
          <div class="block">
            <label for="scaling">Scaling</label> <input type="range" id="scaling" name="scaling" min="0.1" max="2" v-model="gif.settings.scaling" step="0.01" /> {{ gif.settings.scaling }}
            <br />
            <checkbox v-model="gif.settings.coalesce">Coalesce</checkbox>
            <checkbox v-model="gif.settings.skips">Skips</checkbox>
            <span v-if="gif.settings.skips">
              <label for="skips_value">Skip every</label>
              <input type="range" id="skips_value" name="skips_value" min="2" max="10" v-model="gif.settings.skips_value" step="1" />
              <label for="skips_value">{{ gif.settings.skips_value }} frames</label>
            </span>
          </div>
        </div>
      </div>
      <div class="config-row-item">
        <div v-if="fileSelectedPath !== ''">
          <div class="title">
            File Information
          </div>
          <div class="block">
            Name: {{gif.meta.name}}<br />
            Size: {{gif.meta.width}}px x {{gif.meta.height}}px<br />
            Frames: {{gif.meta.frames}}<br />
          </div>
          <div class="title">
            Output Information
          </div>
          <div class="block">
            <div>
              Rows / Columns: {{ result.rows }} x {{ result.cols }}<br />
              Frame Size: {{Math.floor(gif.meta.width * gif.settings.scaling)}}px x {{Math.floor(gif.meta.height * gif.settings.scaling)}}px<br />
              Output Size: {{ result.width }}px x {{ result.height }}px<br />
              Frames: {{ result.frames }}
            </div>
            <div>
              Calculated Size: 
              <span :class="{oversize: result.size / 1024 > 16, goodsize: result.size / 1024 <= 8}">{{ result.size / 1024 }}</span> 
              <span v:if="result.size > 0">MB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="title" v-if="fileSelectedPath !== ''">
      Destination
    </div>
    <div class="block" v-if="fileSelectedPath !== ''">
      <div>
        {{ result.destination }}
      </div>
      <br />
      <Button class="btn-ok" @click="generate()">
        Generate StopMotion Animation
      </Button>
    </div>
  </div>
</template>

<script>
import FileSelect from "./FileSelect.vue";
import gif2tga from "@/libs/gif2tga";
import path from "path";
import Button from "./Button.vue";
import Checkbox from "./Checkbox.vue";
import { useConfigStore } from "@/stores/config";

export default {
  name: "StopMotionConverter",
  components: {
    FileSelect,
    Checkbox,
    Button
  },
  setup() {
    const config = useConfigStore();
    return {
      config
    };
  },
  data() {
    return {
      fileSelectedPath: "",
      gif: {
        meta: {
          name: "",
          width: 0,
          height: 0,
          frames: 0,
        },
        settings: {
          scaling: 1,
          coalesce: true,
          skips: false,
          skips_value: 2,
        }
      },
      result: {
        rows: 0,
        cols: 0,
        width: 0,
        height: 0,
        frames: 0,
        size: 0,
        destination: ""
      }
    };
  },
  watch: {
    fileSelectedPath: function() {
      gif2tga.getMetaData(this.fileSelectedPath).then((metadata) => {
        this.gif.meta.width = metadata.width;
        this.gif.meta.height = metadata.pageHeight;
        this.gif.meta.frames = metadata.pages;
        this.gif.meta.name = path.basename(this.fileSelectedPath);
      });
    },
    gif: {
      handler() {
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
          this.config.wowpath.version,
          "Interface",
          "animations",
          filename
        )
      },
      deep: true,
    },
  },
  methods: {
    generate() {
      if (this.result.size / 1024 > 16) {
        alert("File will be too big with this settings, reduce scaling or skip frames");
      } else {
        gif2tga.convert(
          this.fileSelectedPath,
          this.gif.settings.scaling,
          this.gif.settings.coalesce,
          this.gif.settings.skips,
          this.gif.settings.skips_value,
          path.join(
            this.config.wowpath.value,
            this.config.wowpath.version,
            "Interface",
            "animations"
          )
        ).then(() => {
          alert("file created");
        });
      }
    }
  }
};
</script>

<style scoped lang="scss">
#StopMotionConverter {
  padding: 5px 0 5px 2.35vw;
  text-align: left;
  overflow: auto;
  height: 100%;
  width: 100%;
}

.config-row {
  display: flex;
  flex-direction: row;
}

.config-row-item {
  flex: 50%;
}

#links a {
  align-items: center;
  vertical-align: middle;
}

#main {
  font-weight: 100;
  text-align: center;
  width: 100%;
  margin: auto;
}

.fileinput {
  width: 600px;
};

.oversize {
  color: #f44336;
}
.goodsize {
  color: #51ae42;
}

label,
.label {
  color: #eeeeee;
  margin: 10px 0 5px;
  font-size: 14px;
}

.title {
  margin: 20px 0 10px;
}

.block {
  margin-left: 15px;
  font-size: 15px;
}

@font-face {
  font-family: pass;
  font-style: normal;
  font-weight: 400;
  src: url("data:application/font-woff;charset=utf-8;base64,d09GRgABAAAAAATsAA8AAAAAB2QAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABGRlRNAAABWAAAABwAAAAcg9+z70dERUYAAAF0AAAAHAAAAB4AJwANT1MvMgAAAZAAAAA/AAAAYH7AkBhjbWFwAAAB0AAAAFkAAAFqZowMx2N2dCAAAAIsAAAABAAAAAQAIgKIZ2FzcAAAAjAAAAAIAAAACAAAABBnbHlmAAACOAAAALkAAAE0MwNYJ2hlYWQAAAL0AAAAMAAAADYPA2KgaGhlYQAAAyQAAAAeAAAAJAU+ATJobXR4AAADRAAAABwAAAAcCPoA6mxvY2EAAANgAAAAEAAAABAA5gFMbWF4cAAAA3AAAAAaAAAAIAAKAE9uYW1lAAADjAAAARYAAAIgB4hZ03Bvc3QAAASkAAAAPgAAAE5Ojr8ld2ViZgAABOQAAAAGAAAABuK7WtIAAAABAAAAANXulPUAAAAA1viLwQAAAADW+JM4eNpjYGRgYOABYjEgZmJgBEI2IGYB8xgAA+AANXjaY2BifMg4gYGVgYVBAwOeYEAFjMgcp8yiFAYHBl7VP8wx/94wpDDHMIoo2DP8B8kx2TLHACkFBkYA8/IL3QB42mNgYGBmgGAZBkYGEEgB8hjBfBYGDyDNx8DBwMTABmTxMigoKKmeV/3z/z9YJTKf8f/X/4/vP7pldosLag4SYATqhgkyMgEJJnQFECcMOGChndEAfOwRuAAAAAAiAogAAQAB//8AD3jaY2BiUGJgYDRiWsXAzMDOoLeRkUHfZhM7C8Nbo41srHdsNjEzAZkMG5lBwqwg4U3sbIx/bDYxgsSNBRUF1Y0FlZUYBd6dOcO06m+YElMa0DiGJIZUxjuM9xjkGRhU2djZlJXU1UDQ1MTcDASNjcTFQFBUBGjYEkkVMJCU4gcCKRTeHCk+fn4+KSllsJiUJEhMUgrMUQbZk8bgz/iA8SRR9qzAY087FjEYD2QPDDAzMFgyAwC39TCRAAAAeNpjYGRgYADid/fqneL5bb4yyLMwgMC1H90HIfRkCxDN+IBpFZDiYGAC8QBbSwuceNpjYGRgYI7594aBgcmOAQgYHzAwMqACdgBbWQN0AAABdgAiAAAAAAAAAAABFAAAAj4AYgI+AGYB9AAAAAAAKgAqACoAKgBeAJIAmnjaY2BkYGBgZ1BgYGIAAUYGBNADEQAFQQBaAAB42o2PwUrDQBCGvzVV9GAQDx485exBY1CU3PQgVgIFI9prlVqDwcZNC/oSPoKP4HNUfQLfxYN/NytCe5GwO9/88+/MBAh5I8C0VoAtnYYNa8oaXpAn9RxIP/XcIqLreZENnjwvyfPieVVdXj2H7DHxPJH/2/M7sVn3/MGyOfb8SWjOGv4K2DRdctpkmtqhos+D6ISh4kiUUXDj1Fr3Bc/Oc0vPqec6A8aUyu1cdTaPZvyXyqz6Fm5axC7bxHOv/r/dnbSRXCk7+mpVrOqVtFqdp3NKxaHUgeod9cm40rtrzfrt2OyQa8fppCO9tk7d1x0rpiQcuDuRkjjtkHt16ctbuf/radZY52/PnEcphXpZOcofiEZNcQAAeNpjYGIAg///GBgZsAF2BgZGJkZmBmaGdkYWRla29JzKggxD9tK8TAMDAxc2D0MLU2NjENfI1M0ZACUXCrsAAAABWtLiugAA")
    format("woff");
}

</style>
