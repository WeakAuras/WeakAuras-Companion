import fs from "node:fs";
import path from "node:path";
import type { AddonConfig, Backup, ConfigState } from "@/stores/config";
import archiver from "archiver";
import { DateTime } from "luxon";

export function backup(config: ConfigState, addonsInstalled: AddonConfig[]) {
  config.wowpath.versions.forEach((version) => {
    version.accounts.forEach((account) => {
      addonsInstalled.forEach((addon) => {
        let lastSavedFileSize = null;

        if (typeof account.savedvariableSizeForAddon === "undefined")
          account.savedvariableSizeForAddon = [];

        const savedData = account.savedvariableSizeForAddon.find(
          (savedAddon) => savedAddon.addonName === addon.addonName,
        );

        if (savedData) {
          lastSavedFileSize = savedData.fileSize;
        }

        backupIfRequired(
          addon.svPathFunction(config, version, account),
          config.backup,
          lastSavedFileSize,
          `${version.name}#${account.name}`,
          (fileSize: number) => {
            if (savedData) {
              savedData.fileSize = fileSize;
            } else {
              account.savedvariableSizeForAddon.push({
                fileSize,
                addonName: addon.addonName,
              });
            }
          },
          addon.addonName,
        );
      });
    });
  });
}

function deleteOldFiles(
  dirPath: string,
  accountName: string,
  addonName: string,
  maxSize: number,
) {
  const regex = new RegExp(`^${addonName}-${accountName}-[0-9.]+.zip$`);
  const files = fs
    .readdirSync(dirPath)
    .filter((v) => v?.match(regex))
    .map((v) => ({
      name: v,
      stats: fs.statSync(path.join(dirPath, v)),
    }))
    .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

  const totalSize = files.reduce(
    (accumulator, currentValue) => accumulator + currentValue.stats.size,
    0,
  );

  if (totalSize > maxSize && maxSize >= 5 * 1024 * 1024) {
    console.log(
      `Backup size exceeded for account ${accountName} ${totalSize} > ${maxSize}`,
    );

    // delete 2 last files
    files.slice(-2).forEach((v) => {
      console.log(`Deleted backup files ${path.join(dirPath, v.name)}`);

      fs.unlink(path.join(dirPath, v.name), (err) => {
        if (err) throw err;
      });
    });
  }
}

function backupIfRequired(
  fileName: string | false,
  config: Backup,
  previousSize: number,
  accountName: string,
  callback: { (fileSize: number): void; (arg0: number): void },
  addonName: string,
) {
  if (config?.active && fileName) {
    const stats = fs.statSync(fileName);

    if (stats.size !== previousSize) {
      const date = DateTime.fromMillis(stats.mtimeMs).toFormat(
        "yLLddHHmmss", // "YYYYMMDDHHmmss"
      );
      const zipFile = `${addonName}-${accountName}-${date}.zip`;
      const fileContents = fs.createReadStream(fileName);
      const writeStream = fs.createWriteStream(path.join(config.path, zipFile));
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Sets the compression level.
      });

      writeStream
        .on("close", () => {
          console.log(`Backup: ${zipFile} saved`);

          deleteOldFiles(
            config.path,
            accountName,
            addonName,
            config.maxSize * 1024 * 1024,
          );
          callback(stats.size);
        })
        .on("warning", (err) => {
          if (err.code === "ENOENT") {
            // log warning
          } else {
            // throw error
            throw err;
          }
        })
        .on("error", (err) => {
          throw err;
        });
      archive.pipe(writeStream);
      archive.append(fileContents, { name: `${addonName}.lua` });

      archive.append(
        "If you want to restore this backup, close WoW first, then move the WeakAuras.lua file into your saved variables folder (World of Warcraft\\_retail_\\WTF\\Account\\ACCOUNTNAME\\SavedVariables).",
        { name: "README.txt" },
      );
      archive.finalize();
    }
  }
}
