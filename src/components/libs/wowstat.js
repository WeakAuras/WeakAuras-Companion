/* eslint-disable no-console */
const path = require("path");
const fs = require("fs");
const { Tail } = require("tail");

let clientlog = {};

export function isOpen(wowpath, version) {
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

export function afterReload(config, callback) {
  const wowpath = config.value;
  const version = config.version;
  let account;

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

  let { mtime } = fs.statSync(wacompanionsvfile);
  let fsWait = false;

  const watcher = fs.watch(wacompanionsvfile, (event, filename) => {
    if (filename) {
      if (fsWait) return;

      fsWait = setTimeout(() => {
        fsWait = false;
      }, 100);
      const stats = fs.statSync(wacompanionsvfile);

      if (stats.mtime.valueOf() !== mtime.valueOf()) {
        callback();
        watcher.close();
      }
    }
  });
}

export function afterRestart(wowpath, version, callback) {
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
