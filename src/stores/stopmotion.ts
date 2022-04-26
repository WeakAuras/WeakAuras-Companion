import { defineStore } from "pinia";

export const useStopMotionStore = defineStore(
    "StopMotionStore",
    {
        state: () => {
            return {
                gif: {
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
                    path: ""
                },
                result: {
                    rows: 0,
                    cols: 0,
                    width: 0,
                    height: 0,
                    frames: 0,
                    size: 0,
                    destination: "",
                    preview: "",
                    computing: false,
                },
                tenor: false,
                buffer: null,
                step: 1
            }
        }
    }
);