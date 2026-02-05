import { ref } from "vue";
import { defineStore } from "pinia";

export interface GifMeta {
  name: string;
  width: number;
  height: number;
  frames: number;
}

export interface GifSettings {
  scaling: number;
  coalesce: boolean;
  skips: boolean;
  skips_value: number;
  wowVersion: string;
}

export interface GifState {
  meta: GifMeta;
  settings: GifSettings;
  path: string;
  tenor: boolean;
  tenorID: string;
  buffer: Buffer | null;
}

export interface ResultState {
  rows: number;
  cols: number;
  width: number;
  height: number;
  frames: number;
  size: number;
  destination: string;
  preview: string;
  computing: boolean;
}

export interface StopMotionState {
  gif: GifState;
  result: ResultState;
  step: number;
}

export const useStopMotionStore = defineStore(
  "StopMotionStore",
  () => {
    const gif = ref<GifState>({
      meta: {
        name: "",
        width: 0,
        height: 0,
        frames: 0,
      },
      settings: {
        scaling: 1,
        coalesce: false,
        skips: false,
        skips_value: 2,
        wowVersion: "",
      },
      path: "",
      tenor: false,
      tenorID: "",
      buffer: null,
    });

    const result = ref<ResultState>({
      rows: 0,
      cols: 0,
      width: 0,
      height: 0,
      frames: 0,
      size: 0,
      destination: "",
      preview: "",
      computing: false,
    });

    const step = ref(1);

    return { gif, result, step };
  },
  {
    persistedState: {
      persist: false,
    },
  },
);
