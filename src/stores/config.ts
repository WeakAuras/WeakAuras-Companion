import path from "path";

import { defineStore } from "pinia";

import userDataPath from "@/libs/user-data-folder";

export interface WowPath {
  validated: boolean;
  value: string;
  version: string;
  versions: Version[];
}

export interface Account {
  auras: AuraType[];
  lastWagoUpdate: Date | null;
  name: string;
  numAuras: number;
  savedvariableSizeForAddon: string[];
}

export interface AuraType {
  addonConfig: {
    addonDependency: string;
    addonName: string;
    hasTypeColumn: boolean;
    isInstalled: boolean;
    wagoAPI: string;
  };
  auraType: string | undefined;
  auraTypeDisplay: string | undefined; // deadge?
  auraTypeDisplayName: string | undefined;
  author: string;
  changelog: {
    format: string;
    text: string;
  };
  code: string;
  created: Date | null;
  description: string;
  encoded: boolean;
  id: string;
  ids: string[];
  ignoreWagoUpdate: boolean;
  modified: Date | null;
  name: string;
  regionType: string | undefined; // deadge?
  semver: string;
  slug: string;
  source: string;
  uid: string;
  uids: string[];
  version: number;
  versionNote: string;
  wagoid: string;
  wagoSemver: string;
  wagoVersion: number;
}

export interface Version {
  account?: string;
  accounts?: Account[];
  name?: string;
}

export interface Versions {
  account: string;
  accounts: Account[];
  name: string;
}

export interface Backup {
  active: boolean;
  defaultBackupPath: string;
  maxsize: number;
  path: string;
}

export interface ConfigState {
  autostart: boolean;
  autoupdate: boolean;
  backup: Backup;
  beta: boolean;
  ignoreOwnAuras: boolean;
  lang: string;
  notify: boolean;
  startminimize: boolean;
  wagoApiKey: string | null;
  wagoUsername: string | null;
  wowpath: WowPath;
}

export const useConfigStore = defineStore("configStore", {
  state: (): ConfigState => {
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
