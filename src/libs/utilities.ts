import path from "path";
import fs from "fs";
import regedit from "regedit";

export function formatBytes(a, b) {
  if (a === 0) return "0 Bytes";
  const c = 1024;
  const d = b || 2;
  const e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const f = Math.floor(Math.log(a) / Math.log(c));
  return `${parseFloat((a / c ** f).toFixed(d))} ${e[f]}`;
}

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
  try {
    const items = fs.readdirSync(folder);

    for (const i in items) {
      const item = items[i];

      if (name.toLowerCase() === item.toLowerCase()) return item;
    }

    if (!!create) {
      fs.mkdirSync(path.join(folder, name));
      return name;
    }
    console.log(`${name} not found at ${folder}`);
    return false;
  } catch (err) {
    console.log(`Error: ${err}`);
  }
}
