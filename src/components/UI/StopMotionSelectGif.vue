<template>
  <div id="StopMotionWelcome">
    <div class="stuff">
      <FileSelect
        :create-directory="false"
        :open-file="true"
        :dragndrop="true"
        :filters="[{ name: 'Animation', extensions: ['gif'] }]"
        class="fileinput"
        @update:path="update"
      >
        {{ $t("stopmotion.select.dropagif" /* Drop a GIF */) }}<br /><br />
        <i>{{ $t("stopmotion.select.or" /* or */) }}</i
        ><br /><br />
        <UIButton class="btn-ok">
          {{
            $t("stopmotion.select.computer" /* Choose one on your Computer */)
          }} </UIButton
        ><br /><br /> </FileSelect
      ><br />
      <div class="tenorblock">
        <i>{{ $t("stopmotion.select.or" /* or */) }}</i
        ><br /><br />
        <DiscordPicker
          :api-key="apiKey"
          @gif="setTenor"
        >
          <UIButton class="btn-ok">
            {{ $t("stopmotion.select.tenor" /* Choose one from Tenor */) }}
          </UIButton>
        </DiscordPicker>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import fs from "node:fs";
import path from "node:path";
import { defineComponent } from "vue";
import { useStopMotionStore } from "../../stores/stopmotion";
import DiscordPicker from "./DiscordPicker.vue";
import FileSelect from "./FileSelect.vue";
import UIButton from "./UIButton.vue";
import gif2tga from "@/libs/gif2tga";

export default defineComponent({
  name: "StopMotionWelcome",
  components: {
    FileSelect,
    UIButton,
    DiscordPicker,
  },
  emits: ["next"],
  setup() {
    const { gif } = useStopMotionStore();
    return {
      gif,
    };
  },
  data() {
    return {
      apiKey: "NL8TDPRU0T4Y",
    };
  },
  methods: {
    async setTenor(url, title, tenorID) {
      console.log(url);

      try {
        title = title.replace(" GIF", "");
        const res = await fetch(url);
        const imageBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(imageBuffer);
        const meta = await gif2tga.getMetaData(buffer);
        this.gif.meta.width = meta.width;
        this.gif.meta.height = meta.pageHeight;
        this.gif.meta.frames = meta.pages;
        this.gif.meta.name = title;
        this.gif.path = title;
        this.gif.tenor = true;
        this.gif.tenorID = tenorID;
        this.gif.buffer = buffer;
        this.$emit("next");
      } catch (e) {
        console.log(JSON.stringify(e));
      }
    },
    async update(filepath) {
      if (
        filepath !== "" &&
        fs.existsSync(filepath) &&
        path.parse(filepath).ext.toLowerCase() === ".gif"
      ) {
        try {
          // check for error loading metadata
          const meta = await gif2tga.getMetaData(filepath);
          this.gif.meta.width = meta.width;
          this.gif.meta.height = meta.pageHeight;
          this.gif.meta.frames = meta.pages;
          this.gif.meta.name = path.basename(filepath);
          this.gif.path = filepath;
          this.gif.tenor = false;
          this.$emit("next");
        } catch (e) {
          console.log(JSON.stringify(e));
        }
      }
    },
  },
});
</script>

<style scoped lang="scss">
.stuff {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 40px;
}

.dropzone {
  border-color: #2c2c2c;
  border-style: dotted;
  border-width: 2px;
  border-radius: 20px;
  padding: 20px;
  padding-left: 200px;
  padding-right: 200px;
  cursor: pointer;
  text-align: center;
}

.tenorblock {
  display: inline-block;
  position: relative;
  text-align: center;
}
</style>
