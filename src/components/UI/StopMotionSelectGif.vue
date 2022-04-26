<template>
    <div id="StopMotionWelcome">
        <div class="stuff">
            <file-select
              :create-directory="false"
              :openFile="true"
              :dragndrop="true"
              :filters="[{ name: 'Animation', extensions: ['gif'] }]"
              class="fileinput"
              @update:path="update"
            >{{ $t('app.stopmotion.selectgiffile' /* Select GIF File */) }}</file-select>
        </div>
    </div>
</template>

<script>
import { defineComponent } from "vue";
import FileSelect from "./FileSelect.vue";
import gif2tga from "@/libs/gif2tga";
import path from "path";
import fs from "fs";
import { useStopMotionStore } from "@/stores/stopmotion";

export default defineComponent({
  name: "StopMotionWelcome",
  components: {
    FileSelect,
  },
  setup() {
    const { gif } = useStopMotionStore();
    return {
      gif
    };
  },
  methods: {
    async update(filepath) {
      if (filepath !== ""
        && fs.existsSync(filepath)
        && path.parse(filepath).ext.toLowerCase() === ".gif"
      ) {
        try {
            // check for error loading metadata
            const meta = await gif2tga.getMetaData(filepath);
            this.gif.meta.width = meta.width
            this.gif.meta.height = meta.pageHeight
            this.gif.meta.frames = meta.pages
            this.gif.meta.name = path.basename(filepath);
            this.gif.path = filepath
            this.$emit("next")
        } catch (e) {
            console.log(JSON.stringify(e));
        }
      }
    }
  }
});
</script>

<style scoped lang="scss">
.stuff {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-top: 80px;
    margin-bottom: 100px;
}
</style>
