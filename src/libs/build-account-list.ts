import fs from "node:fs";
import path from "node:path";
import type {
  Account,
  AccountOptions,
  AuraType,
  ConfigState,
  Version,
} from "@/stores/config";

export function buildAccountList(
  config: ConfigState,
  accountOptions: AccountOptions[],
  versionSelected: Version,
  auras: AuraType[],
) {
  const addAccount = (accountFile: string) => {
    const newAccount: Account = {
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
              (account: Account) => account.name === accountFile,
            );

            if (!accountFound) {
              // make account if not found in data
              addAccount(accountFile);
            } else if (
              typeof accountFound.savedvariableSizeForAddon === "undefined"
            ) {
              accountFound.savedvariableSizeForAddon = [];
              accountFound.numAuras = auras.length;
            }

            accountOptions.push({
              value: accountFile,
              text: accountFile,
            });
          });
      } catch (err) {
        if (err) {
          if (err instanceof Error) {
            console.error(err.message);
          } else {
            console.error(JSON.stringify(err, null, 2));
          }
        }
      }
    }
  }
}
