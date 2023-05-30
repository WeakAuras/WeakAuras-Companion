import path from "node:path";

import { matchFolderNameInsensitive } from "./utilities";
import type { Account, ConfigState, Version } from "@/stores/config";

export function isAddonInstalled(config: ConfigState, addon: string, version?: Version, account?: Account) {
  const wowPath = config.wowpath.value;

  if (version && account) {
    let addonFolder = path.join(wowPath, version.name);
    const addonPath = ["Interface", "AddOns", addon];

    for (const check of addonPath) {
      const folder = matchFolderNameInsensitive(addonFolder, check, false);

      if (!folder) {
        return false;
      }

      addonFolder = path.join(addonFolder, folder);
    }

    return true;
  }

  return false;
}
