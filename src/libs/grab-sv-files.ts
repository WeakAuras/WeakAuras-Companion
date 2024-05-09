import fs from "node:fs";
import path from "node:path";

import type { Account, ConfigState, Version } from "@/stores/config";

function getSavedVariable(
  config: ConfigState | null, // Added null check for config parameter
  version: string,
  accountName: string,
  addonName: string,
): string | false {
  if (!config) return false; // Added null check for config

  const savedVariable = path.join(
    config.wowpath.value,
    version,
    "WTF",
    "Account",
    accountName,
    "SavedVariables",
    `${addonName}.lua`,
  );

  try {
    fs.accessSync(savedVariable, fs.constants.F_OK);
    return savedVariable;
  } catch (e) {
    // console.log(`Error testing ${addonName} SV access\n${JSON.stringify(e)}`);
    return false;
  }
}

export function WeakAurasSaved(
  config: ConfigState | null, // Added null check for config parameter
  version: Version | null, // Added null check for version parameter
  account: Account | null, // Added null check for account parameter
): string | false {
  if (!config || !version || !account) return false; // Added null check for config, version, and account

  return getSavedVariable(config, version.name, account.name, "WeakAuras");
}

export function PlaterSaved(
  config: ConfigState | null, // Added null check for config parameter
  version: Version | null, // Added null check for version parameter
  account: Account | null, // Added null check for account parameter
): string | false {
  if (!config || !version || !account) return false; // Added null check for config, version, and account

  return getSavedVariable(config, version.name, account.name, "Plater");
}
