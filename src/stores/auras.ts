import { defineStore } from "pinia";
import type { AuraType } from "./config";

export interface StashState {
  auras: AuraType[];
}

export interface StashActions {
  add(aura: AuraType): void;
  tohtml(): string;
}

export type StashStore = ReturnType<typeof useStashStore>;

export const useStashStore = defineStore({
  id: "stashStore",
  state: (): StashState => ({
    auras: [],
  }),

  actions: {
    add(aura: AuraType) {
      if (!aura) {
        return;
      }
      this.auras.push(aura);
    },
    tohtml() {
      return this.auras
        .map((aura) => {
          return `<br>${aura.name}`;
        })
        .join("");
    },
  },

  persistedState: {
    persist: false,
  },
});
