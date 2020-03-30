/* eslint-disable no-console */
const path = require("path");
const fs = require("fs");
const { Tail } = require("tail");

let watching = false;
let tail = {};

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

export function afterReload(wowpath, version, callback) {
  const logfile = path.join(wowpath, version, "Logs", "Client.log");

  if (!tail[version]) {
    tail[version] = new Tail(logfile);
  } else {
    tail[version].watch();
  }

  tail[version].on("line", (data) => {
    const event = data.split(/ {2}/)[1];

    if (event === "Client Destroy") {
      tail[version].unwatch();
      callback();
    }

    if (event === "Loading Screen Disable") {
      tail[version].unwatch();
      callback();
    }
  });
}

export function afterRestart(wowpath, version, callback) {
  const logfile = path.join(wowpath, version, "Logs", "Client.log");

  if (!tail[version]) {
    tail[version] = new Tail(logfile);
  } else {
    tail[version].watch();
  }

  tail[version].on("line", (data) => {
    const event = data.split(/ {2}/)[1];

    if (event === "Client Destroy") {
      tail[version].unwatch();
      callback();
    }
  });
}
