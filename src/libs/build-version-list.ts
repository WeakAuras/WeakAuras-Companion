import fs from "node:fs";
import path from "node:path";
import { i18n } from "./i18n";
import type { ConfigState, Version } from "@/stores/config";

export function buildVersionList(
  config: ConfigState,
  versionOptions,
  accountOptions,
) {
  const addVersion = function (versionDir: string) {
    const newVersion = {
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
      text: i18n.global.t("app.version.df" /* Dragonflight */),
    },
    {
      value: "_ptr_",
      text: i18n.global.t("app.version.dfptr" /* Dragonflight PTR */),
    },
    {
      value: "_xptr_",
      text: i18n.global.t("app.version.dfptr" /* Dragonflight PTR 2 */),
    },
    {
      value: "_beta_",
      text: i18n.global.t("app.version.dfbeta" /* Dragonflight Beta */),
    },
    {
      value: "_classic_",
      text: i18n.global.t("app.version.classicwotlk" /* WoTLK Classic */),
    },
    {
      value: "_classic_ptr_",
      text: i18n.global.t(
        "app.version.classicwotlkptr" /* WoTLK Classic PTR */,
      ),
    },
    {
      value: "_classic_beta_",
      text: i18n.global.t(
        "app.version.classicwotlkbeta" /* WoTLK Classic Beta */,
      ),
    },
    {
      value: "_classic_era_",
      text: i18n.global.t("app.version.classicera" /* Classic Era */),
    },
    {
      value: "_ptr2_",
      text: i18n.global.t("app.version.classiceraptr" /* Classic Era PTR */),
    },
  ];

  if (config.wowpath.validated) {
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
