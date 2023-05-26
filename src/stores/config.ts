import { defineStore } from "pinia";
import userDataPath from "@/libs/user-data-folder";
import path from "path";

export const useConfigStore = defineStore("configStore", {
  state: () => {
    return {
      wowpath: {
        value: "",
        versions: [],
        version: "",
        validated: false,
      },
      wagoUsername: null,
      wagoApiKey: null,
      ignoreOwnAuras: true,
      autostart: true,
      startminimize: false,
      notify: false,
      lang: "en",
      autoupdate: true,
      beta: false,
      backup: {
        active: true,
        path: path.join(userDataPath, "WeakAurasData-Backup"),
        maxsize: 100,
        defaultBackupPath: path.join(userDataPath, "WeakAurasData-Backup"),
      },
    };
  },
});
