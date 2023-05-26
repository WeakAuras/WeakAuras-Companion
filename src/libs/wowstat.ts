import fs from "fs";
import path from "path";
import { Tail } from "tail";

const clientlog = {};

export function isOpen(wowpath: string, version: string) {
  const logfile = path.join(wowpath, version, "Logs", "Client.log");
  const renametest = path.join(wowpath, version, "Logs", "Client.log.test");

  try {
    fs.renameSync(logfile, renametest);
  } catch (err) {
    return true;
  }
  fs.renameSync(renametest, logfile);
  return false;
}

export function afterReload(config: { value: any; version: any; versions: any[] }, callback: () => void) {
  const wowpath = config.value;
  const version = config.version;
  let account: string;

  config.versions.forEach((version) => {
    if (version.name === config.version) {
      account = version.account;
    }
  });

  const wacompanionsvfile = path.join(
    wowpath,
    version,
    "WTF",
    "Account",
    account,
    "SavedVariables",
    "WeakAurasCompanion.lua"
  );

  const { mtime } = fs.statSync(wacompanionsvfile);
  let fsWait: NodeJS.Timeout | null = null;

  const watcher = fs.watch(wacompanionsvfile, (event, filename) => {
    if (filename) {
      if (fsWait != null) {
        return;
      }

      fsWait = setTimeout(() => {
        fsWait = null;
      }, 100);
      const stats = fs.statSync(wacompanionsvfile);

      if (stats.mtime.valueOf() !== mtime.valueOf()) {
        callback();
        watcher.close();
      }
    }
  });
}

export function afterRestart(wowpath: string, version: string, callback: () => void) {
  const logfile = path.join(wowpath, version, "Logs", "Client.log");

  if (!clientlog[version]) {
    clientlog[version] = new Tail(logfile);
  } else {
    clientlog[version].watch();
  }

  clientlog[version].on("line", (data) => {
    const event = data.split(/ {2}/)[1];

    if (event === "Client Destroy") {
      clientlog[version].unwatch();
      callback();
    }
  });
}
