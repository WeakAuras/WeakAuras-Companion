<script setup lang="ts">
import { ipcRenderer } from "electron";
import { ref } from "vue";

const props = defineProps<{
  createDirectory?: boolean;
  defaultPath?: string;
  openDirectory?: boolean;
  openFile?: boolean;
  filters?: Array<any>;
  dragndrop?: boolean;
}>();

const path = defineModel<string>("path");

const dialogOpen = ref(false);

async function handleInputClick() {
  if (!dialogOpen.value) {
    dialogOpen.value = true;

    const dialogOptions = {
      properties: [] as string[],
      defaultPath: path.value || props.defaultPath || "",
      filters: [] as any[],
    };

    if (props.openDirectory) {
      dialogOptions.properties.push("openDirectory");
    }

    if (props.openFile) {
      dialogOptions.properties.push("openFile");
    }

    if (props.createDirectory) {
      dialogOptions.properties.push("createDirectory");
    }

    if (props.filters) {
      dialogOptions.filters = props.filters;
    }

    try {
      const result = await ipcRenderer.invoke("openDialog", dialogOptions);
      if (result.filePaths && result.filePaths.length) {
        path.value = result.filePaths[0];
      }
    } catch (error) {
      console.error(error);
    }
    dialogOpen.value = false;
  }
}

function drop(event: DragEvent) {
  if (props.dragndrop === true && event.dataTransfer?.files[0]) {
    event.preventDefault();
    // Electron adds a 'path' property to File objects
    const file = event.dataTransfer.files[0] as File & { path: string };
    path.value = file.path;
  }
}
</script>

<template>
  <div
    v-if="props.dragndrop"
    class="cursor-pointer border-2 border-brand-accent rounded-md border-dotted p-5 pl-50 pr-50 text-center"
    @dragenter.prevent
    @dragover.prevent
    @drop="drop"
    @click="handleInputClick"
  >
    <label class="file-select">
      <span class="flex flex-col items-center justify-center gap-5">
        <slot />
      </span>
    </label>
  </div>
  <label
    v-else
    class="file-select"
    @click="handleInputClick"
  >
    <span>
      <div class="text-brand-grey-lightest">
        <slot />
      </div>
      <div
        class="fakeinput ml-1.5 mr-0.5 mt-2 h-7.5 w-67.5 inline-table table-fixed cursor-pointer whitespace-nowrap border border-brand-grey-dark rounded-md border-solid bg-brand-grey-darkest px-7.5 py-1.5 pl-2.5 text-sm text-brand-grey-lightest hover:bg-brand-grey-darker hover:text-brand-grey-lightest"
      >
        <span
          class="wow-path table-cell overflow-hidden text-ellipsis align-middle"
          >{{ path }}</span
        >
      </div>
      <i class="i-mdi-settings ml-1 mt-3 cursor-pointer text-2xl" />
    </span>
  </label>
</template>

<style scoped lang="css">
/* Don't forget to hide the original file input! */
.file-select > input[type="file"] {
  display: none;
}

.fakeinput:hover {
  transition: all 0.1s ease-in-out;
}

.wow-path:empty::before {
  content: "\00a0";
}
</style>
