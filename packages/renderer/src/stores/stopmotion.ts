import { defineStore } from "pinia";

export const useStopMotionStore = defineStore({
    id: "StopMotionStore",
    state: () => ({
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
            path: "",
            tenor: false,
            tenorID: "",
            buffer: null
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
        step: 1
    }),
    
    persistedState: {
        persist: false
    }
});