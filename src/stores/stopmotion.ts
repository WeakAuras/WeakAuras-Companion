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

export type GifSource =
  | { kind: "local"; path: string }
  | { kind: "tenor"; tenorID: string; buffer: Buffer };

export interface GifState {
  meta: GifMeta;
  settings: GifSettings;
  source: GifSource;
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
      source: { kind: "local", path: "" },
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

    function selectLocalSource(path: string) {
      gif.value.source = { kind: "local", path };
    }

    function selectTenorSource(tenorID: string, buffer: Buffer) {
      gif.value.source = { kind: "tenor", tenorID, buffer };
    }

    return { gif, result, step, selectLocalSource, selectTenorSource };
  },
  {
    persistedState: {
      persist: false,
    },
  },
);
