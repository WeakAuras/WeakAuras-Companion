<template>
    <div id="StopMotionResult">
      <img :src="preview" class="preview">
      <br />
      <p class="filename">
        {{ $t('app.stopmotion.file.created' /* File created */) }}: "{{ stopMotionInput }}"
      </p>
      <p class="stuff">
        <Button class="btn-ok" @click="copyStopMotionInput">
          <i class="material-icons">content_copy</i>
          <span>{{ $t('app.stopmotion.copy.path.for.stopmotion' /* Copy Path for StopMotion */) }}</span>
        </Button>
        <Button class="btn-ok" @click="copyExportStringInput">
          <i class="material-icons">content_copy</i>
          <span>{{ $t('app.stopmotion.export.weakauras.string' /* Export WeakAuras String */) }}</span>
        </Button>
        <input type="hidden" id="copyString" />
        <Button class="btn-ok" @click="openDestDir()">
          <i class="material-icons">folder_open</i>
          <span>{{ $t("app.config.backup.openfolder" /* Open Folder */) }}</span>
        </Button>
        <Button class="btn-ok" @click="openDestFile()">
          <i class="material-icons">folder_open</i>
          <span>{{ $t("app.config.backup.openfile" /* Open File */) }}</span>
        </Button>
      </p>
    </div>
</template>

<script>
import { defineComponent } from "vue";
import { useStopMotionStore } from "@/stores/stopmotion";
import Button from "./Button.vue";
import path from "path";
import { shell } from "electron";

/*
const StopMotionTemplate = {
    xOffset: 0,
    yOffset: 0,
    foregroundColor: [
        1,
        1,
        1,
        1,
    ],
    desaturateBackground: false,
    animationType: "loop",
    sameTexture: true,
    startPercent: 0,
    actions: {
        start: {
        },
        init: {
        },
        finish: {
        },
    },
    customForegroundRows: 16,
    frameRate: 15,
    internalVersion: 51,
    animation: {
        start: {
            type: "none",
            easeStrength: 3,
            duration_type: "seconds",
            easeType: "none",
        },
        main: {
            type: "none",
            easeStrength: 3,
            duration_type: "seconds",
            easeType: "none",
        },
        finish: {
            type: "none",
            easeStrength: 3,
            duration_type: "seconds",
            easeType: "none",
        },
    },
    customForegroundFileHeight: 0,
    customBackgroundRows: 16,
    customForegroundFileWidth: 0,
    rotation: 0,
    subRegions: [
        {
            type: "subbackground",
        },
    ],
    height: 128,
    rotate: true,
    load: {
        size: {
            multi: {},
        },
        spec: {
            multi: {},
        },
        class: {
            multi: {},
        },
        talent: {
            multi: {},
        },
    },
    endPercent: 1,
    backgroundTexture: "Interface\\\\AddOns\\\\WeakAuras\\\\Media\\\\Textures\\\\stopmotion",
    customBackgroundColumns: 16,
    foregroundTexture: "Interface\\\\animations\\\\kekround.x5y5f21w96h96W512H512.tga",
    backgroundPercent: 1,
    selfPoint: "CENTER",
    mirror: false,
    backgroundColor: [
        0.5,
        0.5,
        0.5,
        0.5,
    ],
    regionType: "stopmotion",
    discrete_rotation: 0,
    blendMode: "BLEND",
    anchorPoint: "CENTER",
    anchorFrameType: "SCREEN",
    customForegroundColumns: 16,
    config: {
    },
    customForegroundFrames: 0,
    customForegroundFrameWidth: 0,
    hideBackground: true,
    customBackgroundFrames: 0,
    id: "WeakAuras Companion - Kek",
    customForegroundFrameHeight: 0,
    frameStrata: 1,
    width: 128,
    authorOptions: {
    },
    uid: "L2pw6WPLjxa",
    inverse: false,
    desaturateForeground: false,
    conditions: {
    },
    information: {
    },
    triggers: {
        "1": {
            trigger: {
                type: "unit",
                use_absorbHealMode: true,
                subeventSuffix: "_CAST_START",
                use_absorbMode: true,
                event: "Conditions",
                subeventPrefix: "SPELL",
                spellIds: {},
                use_alwaystrue: true,
                use_unit: true,
                names: {},
                unit: "player",
                debuffType: "HELPFUL",
            },
            untrigger: {},
        },
        activeTriggerMode: -10,
    },
}
*/

export default defineComponent({
  name: "StopMotionResult",
  setup() {
    const { result } = useStopMotionStore();
    return {
      result
    };
  },
  components: {
    Button,
  },
  computed: {
    stopMotionInput() {
      return path.join(
        "Interface",
        "animations",
        path.parse(this.result.destination).base
      )
    },
    preview() {
      return "data:image/png;base64, " + this.result.preview
    },
  },
  methods: {
    openDestDir() {
      shell.openPath(path.parse(this.result.destination).dir);
    },
    openDestFile() {
      shell.openPath(this.result.destination);
    },
    copyStopMotionInput() {
      let copy = document.querySelector("#copyString")
      copy.value = this.stopMotionInput
      copy.setAttribute("type", "text")
      copy.select()

      try {
        var successful = document.execCommand("copy");
        var msg = successful ? "successful" : "unsuccessful";
        console.log("copy " + msg);
      } catch (err) {
        console.log("unable to copy");
      }

      /* unselect the range */
      copy.setAttribute("type", "hidden")
      window.getSelection().removeAllRanges()
    },
    async copyExportStringInput() {
      // make string
      alert("work in progress");
      // copy to clipboard
      let copy = document.querySelector("#copyString")
      copy.value = "!WA:2!"  //encoded;
      copy.setAttribute("type", "text")
      copy.select()

      try {
        var successful = document.execCommand("copy");
        var msg = successful ? "successful" : "unsuccessful";
        console.log("copy " + msg);
      } catch (err) {
        console.log("unable to copy");
      }
      copy.setAttribute("type", "hidden")
      window.getSelection().removeAllRanges()
    }
  }
});
</script>

<style scoped lang="scss">
.btn-ok {
  height: 35px;
  span {
    position: relative;
    bottom: 8px;
    line-height: 50px;
  }
}

.btn-ok > * {
    cursor: pointer;
}

.preview {
  object-fit: contain;
  width: 100%;
  height: 300px;
}

.stuff {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
}

.filename {
  width: 100%;
  text-align: center;
  margin-bottom: 20px;
}
</style>
