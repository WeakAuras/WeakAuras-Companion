<script setup lang="ts">
import fs from "node:fs";
import path from "node:path";
import gif2tga from "@/libs/gif2tga";
import { storeToRefs } from "pinia";

import { useStopMotionStore } from "../../stores/stopmotion";
import DiscordPicker from "./DiscordPicker.vue";
import FileSelect from "./FileSelect.vue";
import UIButton from "./UIButton.vue";

const emit = defineEmits<{
  (e: "next"): void;
}>();

const TENOR_API_KEY = "NL8TDPRU0T4Y";

const stopMotionStore = useStopMotionStore();
const { gif } = storeToRefs(stopMotionStore);

async function setTenor(url: string, title: string, tenorID: string) {
  console.log(url);

  try {
    title = title.replace(" GIF", "");
    const res = await fetch(url);
    const imageBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);
    const meta = await gif2tga.getMetaData(buffer);
    gif.value.meta.width = meta.width;
    gif.value.meta.height = meta.pageHeight;
    gif.value.meta.frames = meta.pages;
    gif.value.meta.name = title;
    gif.value.path = title;
    gif.value.tenor = true;
    gif.value.tenorID = tenorID;
    gif.value.buffer = buffer;
    emit("next");
  } catch (e) {
    console.log(JSON.stringify(e));
  }
}

async function update(filepath: string) {
  if (
    filepath !== "" &&
    fs.existsSync(filepath) &&
    path.parse(filepath).ext.toLowerCase() === ".gif"
  ) {
    try {
      // check for error loading metadata
      const meta = await gif2tga.getMetaData(filepath);
      gif.value.meta.width = meta.width;
      gif.value.meta.height = meta.pageHeight;
      gif.value.meta.frames = meta.pages;
      gif.value.meta.name = path.basename(filepath);
      gif.value.path = filepath;
      gif.value.tenor = false;
      emit("next");
    } catch (e) {
      console.log(JSON.stringify(e));
    }
  }
}
</script>

<template>
  <div id="StopMotionWelcome">
    <div class="mt-10 flex flex-col items-center justify-center gap-5">
      <FileSelect
        :create-directory="false"
        :open-file="true"
        :dragndrop="true"
        :filters="[{ name: 'Animation', extensions: ['gif'] }]"
        @update:path="update"
      >
        {{ $t("stopmotion.select.dropagif" /* Drop a GIF */) }}

        <i>{{ $t("stopmotion.select.or" /* or */) }}</i>

        <UIButton class="btn-ok">
          {{
            $t("stopmotion.select.computer" /* Choose one on your Computer */)
          }}
        </UIButton>
      </FileSelect>
      <div class="relative inline-block text-center">
        <i>{{ $t("stopmotion.select.or" /* or */) }}</i>
        <DiscordPicker
          :api-key="TENOR_API_KEY"
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
