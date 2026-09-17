import { ref } from "vue";

import { defineStore } from "pinia";

import type { AuraType } from "./config";

export interface StashState {
  auras: AuraType[];
}

export interface StashActions {
  add(aura: AuraType): void;
  clear(): void;
  tohtml(): string;
}

export type StashStore = ReturnType<typeof useStashStore>;

export const useStashStore = defineStore(
  "stashStore",
  () => {
    const auras = ref<AuraType[]>([]);

    function add(aura: AuraType) {
      if (!aura || auras.value.some((item) => item.slug === aura.slug)) {
        return;
      }
      auras.value.push(aura);
    }

    function clear() {
      auras.value = [];
    }

    function tohtml() {
      return auras.value
        .map((aura) => {
          return `<br>${aura.name}`;
        })
        .join("");
    }

    return { auras, add, clear, tohtml };
  },
  {
    persistedState: {
      persist: false,
    },
  },
);
