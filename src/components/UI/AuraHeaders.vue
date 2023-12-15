<template>
  <div class="aura-header">
    <div
      class="aura-column aura-column-name sortable"
      :class="{
        'sorted': sortedColumn === 'name',
        'sort-desc': sortDescending,
      }"
      @click="() => $emit('sortBy', 'name')"
    >
      {{ $t("app.aura.name" /* Name */) }}
      <span class="aura-header__sort-icon text-xl i-mdi-arrow-down"
        >arrow_downward</span
      >
    </div>
    <div
      class="aura-column aura-column-update sortable"
      :class="{
        'sorted': sortedColumn === 'update',
        'sort-desc': sortDescending,
      }"
      @click="() => $emit('sortBy', 'update')"
    >
      {{ $t("app.aura.update" /* Updates */) }}
      <span class="text-xl i-mdi-arrow-down aura-header__sort-icon"
        >arrow_downward</span
      >
    </div>
    <div
      v-if="addonSelectedConfig && addonSelectedConfig.hasTypeColumn"
      class="aura-column aura-column-aura-type sortable"
      :class="{
        'sorted': sortedColumn === 'auraTypeDisplay',
        'sort-desc': sortDescending,
      }"
      @click="() => $emit('sortBy', 'auraTypeDisplay')"
    >
      {{ $t("app.aura.auraType" /* Type */) }}
      <span class="text-xl i-mdi-arrow-down aura-header__sort-icon"
        >arrow_downward</span
      >
    </div>
    <div
      class="aura-column aura-column-author sortable"
      :class="{
        'sorted': sortedColumn === 'author',
        'sort-desc': sortDescending,
      }"
      @click="() => $emit('sortBy', 'author')"
    >
      {{ $t("app.aura.author" /* Author */) }}
      <span class="text-xl i-mdi-arrow-down aura-header__sort-icon"
        >arrow_downward</span
      >
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "AuraHeaders",
  props: ["sortedColumn", "sortDescending", "addonSelectedConfig"],
  emits: ["sortBy"],
});
</script>

<style scoped lang="css">
.aura-header {
  display: flex;
  flex-direction: row;
  text-align: left;
  font-size: 14px;
  margin: 0 calc(2.35vw + 10px) 0;
}

.aura-header .aura-column.sortable {
  cursor: pointer;
}

.aura-header .aura-column.sortable:hover .aura-header__sort-icon {
  opacity: 0.64;
}

.aura-header .aura-column.sorted .aura-header__sort-icon {
  opacity: 0.86 !important;
}

.aura-header .aura-column.sort-desc .aura-header__sort-icon {
  transform: rotate(180deg);
  padding-bottom: 0px;
  padding-top: 2px;
}

.aura-header .aura-column-name {
  flex: 1;
  padding-left: 48px;
}

.aura-header .aura-column-update {
  padding-right: 10px;
}

.aura-header .aura-column-aura-type {
  padding-right: 20px;
  padding-left: 10px;
}

.aura-header .aura-column-author {
  margin-right: 111px;
  padding-left: 10px;
  width: 100px;
}

.aura-header__sort-icon {
  opacity: 0;
  font-size: 14px;
  vertical-align: middle;
  padding-bottom: 2px;
}
</style>
