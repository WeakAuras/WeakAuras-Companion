import fs from "fs";
import path from "path";
import { ConfigState } from "@/stores/config";

export function WeakAurasSaved(config?: ConfigState, version?, account?) {
  let WeakAurasSavedVariable: fs.PathLike;

  if (config?.wowpath?.version) {
    const { version } = config.wowpath;

    WeakAurasSavedVariable = path.join(
      config.wowpath.value,
      version,
      "WTF",
      "Account",
      account.name,
      "SavedVariables",
      "WeakAuras.lua"
    );
  } else if (config && version && account) {
    const accountSelected = account.name;

    WeakAurasSavedVariable = path.join(
      config.wowpath.value,
      config.wowpath.version,
      "WTF",
      "Account",
      accountSelected,
      "SavedVariables",
      "WeakAuras.lua"
    );
  }

  if (WeakAurasSavedVariable) {
    try {
      fs.accessSync(WeakAurasSavedVariable, fs.constants.F_OK);
      return WeakAurasSavedVariable;
    } catch (e) {
      console.log(`Error testing WeakAuras SV access\n${JSON.stringify(e)}`);
      return false;
    }
  }
  return false;
}

export function PlaterSaved(config?: ConfigState, version?, account?) {
  let PlaterSavedVariable: fs.PathLike;

  if (config?.wowpath?.version) {
    const { version } = config.wowpath;

    PlaterSavedVariable = path.join(
      config.wowpath.value,
      version,
      "WTF",
      "Account",
      account.name,
      "SavedVariables",
      "Plater.lua"
    );
  } else if (config && version && account) {
    const accountSelected = account.name;

    PlaterSavedVariable = path.join(
      config.wowpath.value,
      config.wowpath.version,
      "WTF",
      "Account",
      accountSelected,
      "SavedVariables",
      "Plater.lua"
    );
  }

  if (PlaterSavedVariable) {
    try {
      fs.accessSync(PlaterSavedVariable, fs.constants.F_OK);
      return PlaterSavedVariable;
    } catch (e) {
      console.log(`Error testing Plater SV access\n${JSON.stringify(e)}`);
      return false;
    }
  }
  return false;
}
