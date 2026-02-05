import path from "node:path";
import { ref } from "vue";
import userDataPath from "@/libs/user-data-folder";
import { defineStore } from "pinia";

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
  savedvariableSizeForAddon: {
    fileSize: number;
    addonName: string;
  }[];
}

export interface AccountOptions {
  text: string;
  value: string;
}

export interface AddonConfig {
  addonName: string;
  wagoAPI: string;
  addonDependency: string;
  isInstalled: boolean;
  hasTypeColumn: boolean;
  svPathFunction: (
    config: ConfigState,
    version: Version,
    account: Account,
  ) => string | false;
  parseFunction: (WeakAurasSavedData: any, config: AddonConfig) => any[];
  ignoreOwnAuras?: boolean;
  wagoUsername?: string | null;
}

export interface AuraType {
  addonConfig?: AddonConfig;
  auraType: string | undefined;
  auraTypeDisplay?: string | undefined; // dead?
  auraTypeDisplayName?: string | undefined;
  author: string;
  changelog?: {
    format: string;
    text: string;
  };
  code?: string;
  created?: Date | null;
  description?: string;
  encoded: string;
  id?: string;
  ids?: string[];
  ignoreWagoUpdate?: boolean;
  logo?: string;
  modified?: Date | null;
  name: string;
  regionType?: string | undefined; // dead?
  semver?: string;
  slug: string;
  source: string;
  uid?: string;
  uids?: string[];
  version?: number;
  versionNote?: string;
  wagoid?: string;
  wagoSemver: string;
  wagoVersion: number;
}

export interface Version {
  account?: string;
  accounts?: Account[];
  name?: string;
}

export interface VersionOptions {
  text: string;
  value: string;
}

export interface Versions {
  account: string;
  accounts: Account[];
  name: string;
}

export interface Backup {
  active: boolean;
  defaultBackupPath: string;
  maxSize: number;
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

export const useConfigStore = defineStore("configStore", () => {
  const wowpath = ref<WowPath>({
    value: "",
    versions: [],
    version: "",
    validated: false,
  });
  const wagoUsername = ref<string | null>(null);
  const wagoApiKey = ref<string | null>(null);
  const ignoreOwnAuras = ref(true);
  const autostart = ref(true);
  const startminimize = ref(false);
  const notify = ref(false);
  const lang = ref("en");
  const autoupdate = ref(true);
  const beta = ref(false);
  const backup = ref<Backup>({
    active: true,
    path: path.join(userDataPath, "WeakAurasData-Backup"),
    maxSize: 100,
    defaultBackupPath: path.join(userDataPath, "WeakAurasData-Backup"),
  });

  function $reset() {
    wowpath.value = {
      value: "",
      versions: [],
      version: "",
      validated: false,
    };
    wagoUsername.value = null;
    wagoApiKey.value = null;
    ignoreOwnAuras.value = true;
    autostart.value = true;
    startminimize.value = false;
    notify.value = false;
    lang.value = "en";
    autoupdate.value = true;
    beta.value = false;
    backup.value = {
      active: true,
      path: path.join(userDataPath, "WeakAurasData-Backup"),
      maxSize: 100,
      defaultBackupPath: path.join(userDataPath, "WeakAurasData-Backup"),
    };
  }

  return {
    wowpath,
    wagoUsername,
    wagoApiKey,
    ignoreOwnAuras,
    autostart,
    startminimize,
    notify,
    lang,
    autoupdate,
    beta,
    backup,
    $reset,
  };
});
