<template>
    <div id="StopMotionResult">
      <img :src="preview" class="preview">
      <br />
      <p class="stuff">
        {{ $t("app.stopmotion.restartwow" /* StopMotion aura created, restart World of Warcraft */) }}
      </p>
      <br />
      <p class="filename">
        <a class="explorer" @click="openDestDir()" :title="$t('app.config.backup.openfolder' /* Open Folder */)">{{ resultFolder }}</a> 
        <a class="explorer" @click="openDestFile()" :title="$t('app.config.backup.openfile' /* Open File */)">{{ resultFile }}</a>
      </p>
      <p class="stuff">
        <Button class="btn-ok" @click="copyStopMotionInput">
          <i class="material-icons">content_copy</i>
          <span>{{ $t("app.stopmotion.copy.path" /* Copy Path */) }}</span>
        </Button>
        <Button class="btn-ok" @click="copyExportStringInput">
          <i class="material-icons">content_copy</i>
          <span>{{ $t('app.stopmotion.copy.weakauras.string' /* Copy WeakAuras String */) }}</span>
        </Button>
        <input type="hidden" id="copyString" />
      </p>
    </div>
</template>

<script>
import { defineComponent } from "vue";
import { useStopMotionStore } from "@/stores/stopmotion";
import { useStashStore } from "@/stores/auras";
import Button from "./Button.vue";
import path from "path";
import { shell } from "electron";
import { StopMotionTemplate, serialize, deflate, encode, GenerateUniqueID } from "@/libs/stopmotion";

export default defineComponent({
  name: "StopMotionResult",
  setup() {
    const { result, gif } = useStopMotionStore();
    const stash = useStashStore()
    return {
      gif,
      result,
      stash
    };
  },
  components: {
    Button,
  },
  mounted() {
    this.stash.add({
      slug: "StopMotion " + this.gif.meta.name,
      name: "StopMotion " + this.gif.meta.name,
      author: "WeakAuras Companion",
      wagoVersion: "1",
      wagoSemver: "1.0.0",
      auraType: "WeakAuras",
      addon: "WeakAuras",
      stopmotion: true,
      encoded: this.weakauras_string,
    })
    console.log(`added to stash ${this.gif.meta.name}`)
  },
  computed: {
    weakauras_string() {
      const SMtemplate = Object.assign({}, StopMotionTemplate);
      SMtemplate.d.id = "StopMotion " + this.gif.meta.name
      SMtemplate.d.foregroundTexture = this.stopMotionInput
      SMtemplate.d.backgroundTexture = this.stopMotionInput
      SMtemplate.d.uid = GenerateUniqueID()
      const serialized = serialize(SMtemplate)
      const compressed = deflate(serialized)
      const encoded = encode(compressed);
      return "!WA:1!" + encoded;
    },
    stopMotionInput() {
      return path.join(
        "Interface",
        "animations",
        path.parse(this.result.destination).base
      )
    },
    resultFolder() {
      return path.join(
        "Interface",
        "animations"
      ) + path.sep;
    },
    resultFile() {
      return path.parse(this.result.destination).base
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
      // copy to clipboard
      let copy = document.querySelector("#copyString")
      copy.value = this.weakauras_string;
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

.explorer {
  cursor: pointer;
  font-size: 12px;
  margin-top: 5px;
  color: rgb(255, 209, 0);
  font-weight: 500;
  &:hover {
    text-decoration-line: underline;
  }
}
</style>
