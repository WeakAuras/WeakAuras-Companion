import fs from "fs";
import path from "path";

export function grabVersionFromToc(wowPath: string, version: string) {
  const waTocFile = version.includes("classic")
    ? path.join(wowPath, version, "Interface", "AddOns", "WeakAuras", "WeakAuras_Wrath.toc")
    : version.includes("era")
    ? path.join(wowPath, version, "Interface", "AddOns", "WeakAuras", "WeakAuras_Vanilla.toc")
    : path.join(wowPath, version, "Interface", "AddOns", "WeakAuras", "WeakAuras.toc");

  const tocContent = fs.readFileSync(waTocFile, "utf8");
  const lines = tocContent.split("\n");

  let waTocVersion = "";

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("## Interface: ")) {
      const parts = lines[i].split(" ");
      waTocVersion = parts[2];
      break;
    }
  }

  return waTocVersion;
}
