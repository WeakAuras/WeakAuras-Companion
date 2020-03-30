import path from "path";
const fs = require("fs");

export function formatBytes(a, b) {
  if (a === 0) return "0 Bytes";
  const c = 1024;
  const d = b || 2;
  const e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const f = Math.floor(Math.log(a) / Math.log(c));
  return `${parseFloat((a / c ** f).toFixed(d))} ${e[f]}`;
}

const regedit = require("regedit");

regedit.setExternalVBSLocation("resources/node_modules/regedit/vbs");

export function wowDefaultPath() {
  return new Promise((resolve) => {
    if (process.platform === "win32") {
      const key =
        "HKLM\\SOFTWARE\\WOW6432Node\\Blizzard Entertainment\\World of Warcraft";

      regedit.list(key, (err, result) => {
        if (err) throw err;
        else {
          resolve(path.join(result[key].values.InstallPath.value, ".."));
        }
      });
    } else {
      resolve("");
    }
  });
}

export function matchFolderNameInsensitive(folder, name, create) {
  return new Promise((done, err) => {
    var dir = fs.readdir(folder, (err, items) => {
      for (let i = 0; i < items.length; i++) {
        if (name.toLowerCase() === items[i].toLowerCase()) {
          return done(items[i]);
        }
      }

      if (!!create) {
        fs.mkdir(path.join(folder, name), (err) => {
          if (err && err.code !== "EEXIST") {
            this.message(
              this.$t(
                "app.main.errorCantCreateAddon" /* Can't create addon directory */
              ),
              "error"
            );
            console.log(JSON.stringify(err));
            throw new Error("errorCantCreateAddon");
          }
        });
        return name;
      }
      err({ message: `${name} not found at ${folder}` });
    });
  });
}
