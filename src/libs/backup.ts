import fs from "node:fs";
import path from "node:path";

import { ZipArchive } from "archiver";
import { DateTime } from "luxon";

import type { AddonConfig, Backup, ConfigState } from "@/stores/config";

const backupQueues = new Map<string, Promise<void>>();

export function backup(config: ConfigState, addonsInstalled: AddonConfig[]) {
  const backupConfig = { ...config.backup };
  const jobs: Promise<void>[] = [];

  config.wowpath.versions.forEach((version) => {
    version.accounts.forEach((account) => {
      addonsInstalled.forEach((addon) => {
        if (typeof account.savedvariableSizeForAddon === "undefined") {
          account.savedvariableSizeForAddon = [];
        }

        const fileName = addon.svPathFunction(config, version, account);

        if (!backupConfig.active || !fileName) {
          return;
        }

        jobs.push(
          backupIfRequired(
            fileName,
            backupConfig,
            () =>
              account.savedvariableSizeForAddon.find(
                (savedAddon) => savedAddon.addonName === addon.addonName,
              )?.fileSize,
            (fileSize) => {
              const savedData = account.savedvariableSizeForAddon.find(
                (savedAddon) => savedAddon.addonName === addon.addonName,
              );

              if (savedData) {
                savedData.fileSize = fileSize;
              } else {
                account.savedvariableSizeForAddon.push({
                  fileSize,
                  addonName: addon.addonName,
                });
              }
            },
            `${version.name}#${account.name}`,
            addon.addonName,
          ),
        );
      });
    });
  });

  return Promise.all(jobs).then(() => undefined);
}

async function deleteOldFiles(
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
    await Promise.all(
      files.slice(-2).map(async (v) => {
        console.log(`Deleted backup files ${path.join(dirPath, v.name)}`);
        await fs.promises.unlink(path.join(dirPath, v.name));
      }),
    );
  }
}

function backupIfRequired(
  fileName: string,
  config: Backup,
  getPreviousSize: () => number | undefined,
  saveFileSize: (fileSize: number) => void,
  accountName: string,
  addonName: string,
) {
  const previousJob = backupQueues.get(fileName) ?? Promise.resolve();
  const job = previousJob
    .catch(() => undefined)
    .then(() => createBackupIfRequired());
  backupQueues.set(fileName, job);

  const removeCompletedJob = () => {
    if (backupQueues.get(fileName) === job) {
      backupQueues.delete(fileName);
    }
  };
  void job.then(removeCompletedJob, removeCompletedJob);

  return job;

  async function createBackupIfRequired() {
    const stats = fs.statSync(fileName);

    if (stats.size === getPreviousSize()) {
      return;
    }

    const date = DateTime.fromMillis(stats.mtimeMs).toFormat("yLLddHHmmss");
    const zipFile = `${addonName}-${accountName}-${date}.zip`;
    await createArchive(fileName, path.join(config.path, zipFile), addonName);

    console.log(`Backup: ${zipFile} saved`);
    await deleteOldFiles(
      config.path,
      accountName,
      addonName,
      config.maxSize * 1024 * 1024,
    );
    saveFileSize(stats.size);
  }
}

function createArchive(fileName: string, zipPath: string, addonName: string) {
  return new Promise<void>((resolve, reject) => {
    const fileContents = fs.createReadStream(fileName);
    const writeStream = fs.createWriteStream(zipPath);
    const archive = new ZipArchive({
      zlib: { level: 9 },
    });
    let settled = false;

    const fail = (error: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      fileContents.destroy();
      archive.destroy();
      writeStream.destroy();
      reject(error);
    };

    writeStream.on("close", () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    });
    writeStream.on("error", fail);
    fileContents.on("error", fail);
    archive.on("error", fail);
    archive.on("warning", fail);

    archive.pipe(writeStream);
    archive.append(fileContents, { name: `${addonName}.lua` });
    archive.append(
      "If you want to restore this backup, close WoW first, then move the WeakAuras.lua file into your saved variables folder (World of Warcraft\\_retail_\\WTF\\Account\\ACCOUNTNAME\\SavedVariables).",
      { name: "README.txt" },
    );
    void archive.finalize().catch(fail);
  });
}
