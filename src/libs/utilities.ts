import path from "node:path";
import fs from "node:fs";
import regedit, { promisified as regedit_promisified } from "regedit";

export function formatBytes(a, b) {
  if (a === 0)
    return "0 Bytes";
  const c = 1024;
  const d = b || 2;
  const e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const f = Math.floor(Math.log(a) / Math.log(c));
  return `${Number.parseFloat((a / c ** f).toFixed(d))} ${e[f]}`;
}

regedit.setExternalVBSLocation("resources/node_modules/regedit/vbs");

export async function wowDefaultPath() {
  if (process.platform === "win32") {
    const key = "HKLM\\SOFTWARE\\WOW6432Node\\Blizzard Entertainment\\World of Warcraft";

    try {
      const results = await regedit_promisified.list([key]);
      const value = results[key].values.InstallPath.value;

      if (typeof value === "string") {
        return path.join(value, "..");
      } else {
        return "";
      }
    } catch (e) {
      console.log(JSON.stringify(e));
      return "";
    }
  }
  return "";
}

export function matchFolderNameInsensitive(folder, name, create) {
  try {
    const items = fs.readdirSync(folder);

    for (const i in items) {
      const item = items[i];

      if (name.toLowerCase() === item.toLowerCase())
        return item;
    }

    if (create) {
      fs.mkdirSync(path.join(folder, name));
      return name;
    }
    console.log(`${name} not found at ${folder}`);
    return false;
  } catch (err) {
    console.log(`Error: ${err}`);
  }
}
