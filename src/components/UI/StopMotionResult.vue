<template>
  <div id="StopMotionResult">
    <img
      :src="preview"
      class="preview"
    />
    <br />
    <p class="center-text">
      {{ $t("app.stopmotion.auraready" /*  WeakAuras is Ready For Install */) }}
      <span
        class="material-icons minihelp"
        v-tooltip="{
          content: rfiTooltip,
          html: true,
          strategy: 'fixed',
          theme: 'info-tooltip',
        }"
        >help</span
      >
      <br /><br />
      <span class="glow">{{ $t("app.stopmotion.restartwow2" /*  Restart World of Warcraft */) }}</span>
    </p>
    <br />
    <p class="filename">
      <a
        class="explorer"
        @click="openDestDir()"
        :title="$t('app.config.backup.openfolder' /* Open Folder */)"
        >{{ resultFolder }}</a
      >
      <a
        class="explorer"
        @click="openDestFile()"
        :title="$t('app.config.backup.openfile' /* Open File */)"
        >{{ resultFile }}</a
      >
    </p>
  </div>
</template>

<script lang="ts">
import { StopMotionTemplate, deflate, encode, generateUniqueID, serialize } from "@/libs/stopmotion";
import { shell } from "electron";
import path from "path";
import { defineComponent } from "vue";
import { useStashStore } from "../../stores/auras";
import { useStopMotionStore } from "../../stores/stopmotion";

export default defineComponent({
  name: "StopMotionResult",
  setup() {
    const { result, gif } = useStopMotionStore();
    const stash = useStashStore();
    return {
      gif,
      result,
      stash,
    };
  },
  mounted() {
    this.stash.add({
      slug: "StopMotion " + this.gif.meta.name,
      name: "StopMotion " + this.gif.meta.name,
      author: "WeakAuras Companion",
      wagoVersion: 1,
      wagoSemver: "1.0.0",
      auraType: "WeakAuras",
      source: "WeakAuras Companion",
      encoded: this.weakauras_string,
      logo: "Interface\\AddOns\\WeakAuras\\Media\\Textures\\logo_64_nobg.tga",
    });
    console.log(`added to stash ${this.gif.meta.name}`);
  },
  computed: {
    weakauras_string() {
      const SMtemplate = Object.assign({}, StopMotionTemplate);
      SMtemplate.d.id = "StopMotion " + this.gif.meta.name;
      SMtemplate.d.foregroundTexture = this.stopMotionInput;
      SMtemplate.d.backgroundTexture = this.stopMotionInput;
      SMtemplate.d.uid = generateUniqueID();

      if (this.gif.tenor === true) {
        SMtemplate.d.tenorID = this.gif.tenorID;
      } else {
        delete SMtemplate.d.tenorID;
      }
      const serialized = serialize(SMtemplate);
      const compressed = deflate(serialized);
      const encoded = encode(compressed);
      return "!WA:1!" + encoded;
    },
    stopMotionInput() {
      return path.join(
        "Interface",
        "AddOns",
        "WeakAurasCompanion",
        "animations",
        path.parse(this.result.destination).base
      );
    },
    resultFolder() {
      return path.join("Interface", "AddOns", "WeakAurasCompanion", "animations") + path.sep;
    },
    resultFile() {
      return path.parse(this.result.destination).base;
    },
    preview() {
      return "data:image/png;base64, " + this.result.preview;
    },
  },
  methods: {
    openDestDir() {
      shell.openPath(path.parse(this.result.destination).dir);
    },
    openDestFile() {
      shell.openPath(this.result.destination);
    },
    rfiTooltip() {
      // eslint-disable-next-line quotes
      return `<img width="300px" src="../../assets/ready-for-install-example.png" />`;
    },
  },
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

.minihelp {
  font-size: 90%;
}

.btn-ok > * {
  cursor: pointer;
}

.preview {
  object-fit: contain;
  width: 100%;
  height: 300px;
}

.center-text {
  text-align: center;
}

.glow {
  -webkit-animation: glow 1s ease-in-out infinite alternate;
  -moz-animation: glow 1s ease-in-out infinite alternate;
  animation: glow 1s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    text-shadow: 0px 0px 5px #fff, 0px 0px 5px #614ad3;
  }
  to {
    text-shadow: 0px 0px 20px #fff, 0px 0px 20px #614ad3;
  }
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
