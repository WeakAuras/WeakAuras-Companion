<template>
  <div
    v-if="dragndrop"
    class="border-2 border-dotted rounded-md p-5 pl-50 pr-50 cursor-pointer text-center border-brand-accent"
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
      <p class="text-brand-grey-lightest">
        <slot />
      </p>
      <div
        class="fakeinput w-67.5 h-7.5 text-sm whitespace-nowrap inline-table table-fixed mt-2 mr-0.5 ml-1.5 py-1.5 px-7.5 pl-2.5 rounded-md bg-brand-grey-darkest text-brand-grey-lightest border-solid border-brand-grey-dark hover:bg-brand-grey-darker hover:text-brand-grey-lightest cursor-pointer"
      >
        <span
          class="wow-path table-cell text-ellipsis overflow-hidden align-middle"
          >{{ path }}</span
        >
      </div>
      <i class="text-2xl cursor-pointer i-mdi-settings mt-3 ml-1">settings</i>
    </span>
  </label>
</template>

<script lang="ts">
import { ipcRenderer } from "electron";
import { defineComponent } from "vue";

export default defineComponent({
  name: "FileSelect",
  props: [
    "path",
    "createDirectory",
    "defaultPath",
    "openDirectory",
    "openFile",
    "filters",
    "dragndrop",
  ],
  emits: ["update:path"],
  data() {
    return {
      dialogOpen: false,
    };
  },
  methods: {
    async handleInputClick() {
      if (!this.dialogOpen) {
        this.dialogOpen = true;

        const dialogOptions = {
          properties: [],
          defaultPath: this.path || this.defaultPath,
          filters: [],
        };

        if (this.openDirectory) {
          dialogOptions.properties.push("openDirectory");
        }

        if (this.openFile) {
          dialogOptions.properties.push("openFile");
        }

        if (this.createDirectory) {
          dialogOptions.properties.push("createDirectory");
        }

        if (this.filters) {
          dialogOptions.filters = this.filters;
        }

        ipcRenderer
          .invoke("openDialog", dialogOptions)
          .then((result) => {
            if (result.filePaths && result.filePaths.length) {
              this.$emit("update:path", result.filePaths[0]);
            }
          })
          .catch((error) => {
            console.error(error);
          });
        this.dialogOpen = false;
      }
    },
    drop(event) {
      if (this.dragndrop === true) {
        event.preventDefault();

        this.$emit("update:path", event.dataTransfer.files[0].path);
      }
    },
  },
});
</script>

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
