<script setup lang="ts">
import path from "node:path";
import { shell } from "electron";
import { computed, onMounted } from "vue";
import {
  deflate,
  encode,
  generateUniqueID,
  serialize,
  StopMotionTemplate,
} from "@/libs/stopmotion";
import { storeToRefs } from "pinia";

import { useStashStore } from "../../stores/auras";
import { useStopMotionStore } from "../../stores/stopmotion";

const stopMotionStore = useStopMotionStore();
const { result, gif } = storeToRefs(stopMotionStore);
const stash = useStashStore();

const stopMotionInput = computed(() => {
  return path.join(
    "Interface",
    "AddOns",
    "WeakAurasCompanion",
    "animations",
    path.parse(result.value.destination).base,
  );
});

const weakauras_string = computed(() => {
  const SMtemplate = Object.assign({}, StopMotionTemplate);
  SMtemplate.d.id = `StopMotion ${gif.value.meta.name}`;
  SMtemplate.d.foregroundTexture = stopMotionInput.value;
  SMtemplate.d.backgroundTexture = stopMotionInput.value;
  SMtemplate.d.uid = generateUniqueID();

  if (gif.value.tenor === true) {
    SMtemplate.d.tenorID = gif.value.tenorID;
  } else {
    delete SMtemplate.d.tenorID;
  }
  const serialized = serialize(SMtemplate);
  const compressed = deflate(serialized);
  const encoded = encode(compressed);
  return `!WA:1!${encoded}`;
});

const resultFolder = computed(() => {
  return (
    path.join("Interface", "AddOns", "WeakAurasCompanion", "animations") +
    path.sep
  );
});

const resultFile = computed(() => {
  return path.parse(result.value.destination).base;
});

const preview = computed(() => {
  return `data:image/png;base64, ${result.value.preview}`;
});

function openDestDir() {
  shell.openPath(path.parse(result.value.destination).dir);
}

function openDestFile() {
  shell.openPath(result.value.destination);
}

onMounted(() => {
  const slug = `StopMotion ${gif.value.meta.name}`;
  const alreadyAdded = stash.auras.some((a) => a.slug === slug);

  if (!alreadyAdded) {
    stash.add({
      slug,
      name: slug,
      author: "WeakAuras Companion",
      wagoVersion: 1,
      wagoSemver: "1.0.0",
      auraType: "WeakAuras",
      source: "WeakAuras Companion",
      encoded: weakauras_string.value,
      logo: "Interface\\AddOns\\WeakAuras\\Media\\Textures\\logo_64_nobg.tga",
    });
    console.log(`added aura to stash: "${gif.value.meta.name}"`);
  }
});
</script>

<template>
  <div id="StopMotionResult">
    <div class="flex flex-col justify-center gap-2 text-center align-middle">
      <img
        :src="preview"
        class="h-xs w-full object-contain"
      />
      <div class="text-center">
        {{
          $t("app.stopmotion.auraready" /*  WeakAuras is Ready For Install */)
        }}
        <i
          v-tooltip="{
            content:
              '<img width=&quot;300px=&quot; src=&quot;src/assets/ready-for-install-example.png&quot; />',
            html: true,
            strategy: 'fixed',
            theme: 'info-tooltip',
          }"
          class="i-mdi-help-circle"
        />
        <div class="glow my-4">
          {{
            $t("app.stopmotion.restartwow2" /*  Restart World of Warcraft */)
          }}
        </div>
      </div>
      <div class="filename">
        <a
          class="mt-5 cursor-pointer font-size-3 text-brand-accent font-semibold hover:underline"
          :title="$t('app.config.backup.openfolder' /* Open Folder */)"
          @click="openDestDir()"
          >{{ resultFolder }}</a
        >
        <a
          class="mt-5 cursor-pointer font-size-3 text-brand-accent font-semibold hover:underline"
          :title="$t('app.config.backup.openfile' /* Open File */)"
          @click="openDestFile()"
          >{{ resultFile }}</a
        >
      </div>
    </div>
  </div>
</template>
