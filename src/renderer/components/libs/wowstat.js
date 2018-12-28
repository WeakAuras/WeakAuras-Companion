/* eslint-disable no-console */
const path = require("path");
const fs = require("fs");
const { Tail } = require("tail");

let watching = false;

export function isOpen(wowpath) {
  const logfile = path.join(wowpath, "_retail_", "Logs", "Client.log");
  const renametest = path.join(wowpath, "_retail_", "Logs", "Client.log.test");
  try {
    fs.renameSync(logfile, renametest);
  } catch (err) {
    return true;
  }
  fs.renameSync(renametest, logfile);
  return false;
}

export function afterReload(wowpath, callback) {
  const logfile = path.join(wowpath, "_retail_", "Logs", "Client.log");
  let tail;
  if (!watching) {
    tail = new Tail(logfile);
  }
  watching = true;

  tail.on("line", data => {
    const event = data.split(/ {2}/)[1];
    if (event === "Client Destroy") {
      tail.unwatch();
      watching = false;
      callback();
    }
    if (event === "Loading Screen Disable") {
      tail.unwatch();
      watching = false;
      callback();
    }
  });
}

export function afterRestart(wowpath, callback) {
  const logfile = path.join(wowpath, "_retail_", "Logs", "Client.log");
  let tail;
  if (!watching) {
    tail = new Tail(logfile);
  }
  watching = true;

  tail.on("line", data => {
    const event = data.split(/ {2}/)[1];
    if (event === "Client Destroy") {
      tail.unwatch();
      watching = false;
      callback();
    }
  });
}
