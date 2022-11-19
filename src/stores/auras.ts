import { defineStore } from "pinia";

export const useStashStore = defineStore({
  id: "stashStore",
  state: () => ({
    auras: [],
  }),

  actions: {
    add(aura) {
      if (!aura) {
        return;
      }
      this.auras.push(aura);
    },
    tohtml(): string {
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
