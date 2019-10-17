import path from "path";

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
  return new Promise(resolve => {
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
