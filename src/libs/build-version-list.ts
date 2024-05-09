import fs from "node:fs";
import path from "node:path";
import { i18n } from "./i18n";
import type {
  AccountOptions,
  ConfigState,
  Version,
  VersionOptions,
} from "@/stores/config";

export function buildVersionList(
  config: ConfigState | null, // Added null check for config parameter
  versionOptions: VersionOptions[],
  accountOptions: AccountOptions[],
) {
  if (!config) return; // Added null check for config

  const addVersion = (versionDir: string) => {
    const newVersion: Version = {
      name: versionDir,
      accounts: [],
      account: "",
    };
    config.wowpath.versions.push(newVersion);
  };
  console.log("buildVersionList");
  // reset version & account lists
  versionOptions.splice(0, versionOptions.length);
  accountOptions.splice(0, accountOptions.length);
  const versionLabels = [
    {
      value: "_retail_",
      text: i18n.global.t("app.version.retail" /* Dragonflight */),
    },
    {
      value: "_ptr_",
      text: i18n.global.t("app.version.retail_ptr" /* Dragonflight PTR */),
    },
    {
      value: "_xptr_",
      text: i18n.global.t("app.version.retail_ptr2" /* Dragonflight PTR 2 */),
    },
    {
      value: "_beta_",
      text: i18n.global.t("app.version.retail_beta" /* The War Within Beta */),
    },
    {
      value: "_classic_",
      text: i18n.global.t("app.version.classic" /* Cataclysm Classic */),
    },
    {
      value: "_classic_ptr_",
      text: i18n.global.t(
        "app.version.classic_ptr" /* Cataclysm Classic PTR */,
      ),
    },
    {
      value: "_classic_beta_",
      text: i18n.global.t(
        "app.version.classic_beta" /* Cataclysm  Classic Beta */,
      ),
    },
    {
      value: "_classic_era_",
      text: i18n.global.t("app.version.classic_era" /* Classic Era */),
    },
    {
      value: "_classic_era_ptr_",
      text: i18n.global.t("app.version.classic_era_ptr" /* Classic Era PTR */),
    },
  ];

  if (config && config.wowpath.validated) { // Added null check for config
    const wowpath = config.wowpath.value;

    try {
      const files = fs.readdirSync(wowpath);

      files
        .filter(
          (versionDir) =>
            versionDir.match(/^_.*_$/) &&
            fs.statSync(path.join(wowpath, versionDir)).isDirectory(),
        )
        .forEach((versionDir) => {
          const accountFolder = path.join(
            wowpath,
            versionDir,
            "WTF",
            "Account",
          );

          if (fs.existsSync(accountFolder)) {
            const versionFound = config.wowpath.versions.find(
              (version: Version) => version.name === versionDir,
            );

            if (!versionFound) {
              // make version if not found in data
              addVersion(versionDir);
            }

            const label = versionLabels.find(
              (versionLabel) => versionLabel.value === versionDir,
            );

            versionOptions.push({
              value: versionDir,
              text: label?.text || versionDir,
            });
          }
        });
    } catch (err) {
      console.log(`Error: ${err}`);
    }
  }
}
