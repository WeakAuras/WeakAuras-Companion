import path from "node:path";
import type { ConfigState, Version, Account } from "@/stores/config"; // Added explicit type annotations

export function isAddonInstalled(
  config: ConfigState | null, // Added null check for config parameter
  addonName: string,
  version?: Version | null, // Added null check for version parameter
  account?: Account | null, // Added null check for account parameter
): boolean {
  if (!config || !version || !account) return false; // Added null check for config, version, and account

  const wowPath = config.wowpath.value;

  let addonFolder = path.join(wowPath, version.name);
  const addonPath = ["Interface", "AddOns", addonName];

  for (const check of addonPath) {
    const folder = matchFolderNameInsensitive(addonFolder, check, false);

    if (!folder) {
      return false;
    }

    addonFolder = path.join(addonFolder, folder);
  }

  return true;
}
