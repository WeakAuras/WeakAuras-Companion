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
      <span>
        <slot />
      </span>
    </label>
  </div>
  <label
    v-else
    class="file-select"
    @click="handleInputClick"
  >
    <span class="select-button">
      <p class="configlabel text-brand-grey-lightest">
        <slot />
      </p>
      <div class="fakeinput pointer">
        <span class="wow-path">{{ path }}</span>
      </div>
      <i class="text-2xl cursor-pointer i-mdi-settings mt-0.5 ml-1">settings</i>
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
:root {
  --button-color-bg: #101010;
  --highlight-color: #1a1a1a;
  --highlight-color-text: #ffffff;
  --text-color: #e6e6e6;
  --border-color: #2c2c2c;
  --border-color-expand: #2c2c2c;
  --border-color-separate: #0d0d0d;
}

/* Don't forget to hide the original file input! */
.file-select > input[type="file"] {
  display: none;
}

.fakeinput {
  background-color: var(--border-color-separate);
  width: 270px;
  height: 30px;
  font-size: 14px;
  white-space: nowrap;
  display: inline-table;
  table-layout: fixed;
  color: var(--text-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  margin-right: 2px;
  margin-left: 5px;
  padding: 5px 30px 5px 10px;
}

.fakeinput:hover {
  background-color: var(--highlight-color);
  border-color: var(--border-color-expand);
  color: var(--highlight-color-text);
  transition: all 0.1s ease-in-out;
}

.btn {
  display: inline-block;
  cursor: pointer;
}

.configlabel {
  margin-top: 5px;
  font-size: 15px;
  font-weight: 500;
}

.wow-path {
  display: table-cell;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wow-path:empty::before {
  content: "\00a0";
}
</style>
