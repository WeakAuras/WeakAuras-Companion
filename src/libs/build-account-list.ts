import fs from "node:fs";
import path from "node:path";
import type { ConfigState } from "@/stores/config";

export function buildAccountList(
  config: ConfigState,
  accountOptions,
  versionSelected,
  auras,
) {
  const addAccount = function (accountFile: string) {
    const newAccount = {
      name: accountFile,
      lastWagoUpdate: null,
      auras: [],
      numAuras: auras.length,
      savedvariableSizeForAddon: [],
    };
    versionSelected.accounts.push(newAccount);
  };

  console.log("buildAccountList");
  accountOptions.splice(0, accountOptions.length);

  if (config.wowpath.validated && versionSelected) {
    const versionName = versionSelected.name;
    const accountFolder = path.join(
      config.wowpath.value,
      versionName,
      "WTF",
      "Account",
    );

    if (fs.existsSync(accountFolder)) {
      try {
        const files = fs.readdirSync(accountFolder);

        files
          .filter(
            (accountFile) =>
              accountFile !== "SavedVariables" &&
              fs.statSync(path.join(accountFolder, accountFile)).isDirectory(),
          )
          .forEach((accountFile) => {
            const accountFound = versionSelected.accounts.find(
              (account) => account.name === accountFile,
            );

            if (!accountFound) {
              // make account if not found in data
              addAccount(accountFile);
            } else if (
              typeof accountFound.savedvariableSizeForAddon === "undefined"
            ) {
              accountFound.savedvariableSizeForAddon = [];
            }
            accountFound.numAuras = auras.length;

            accountOptions.push({
              value: accountFile,
              text: accountFile,
            });
          });
      } catch (err) {
        console.log(`Error: ${err}`);
      }
    }
  }
}
