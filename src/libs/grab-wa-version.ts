import fs from "node:fs";
import path from "node:path";

export function grabVersionFromToc(
  wowPath: string,
  version: string,
  addonName: string = "WeakAuras",
): string | number {
  const addonFolderPath = path.join(
    wowPath,
    version,
    "Interface",
    "AddOns",
    addonName,
  );
  let tocFile;
  if (addonName === "WeakAuras") {
    if (version.includes("classic_era")) {
      tocFile = path.join(addonFolderPath, "WeakAuras_Vanilla.toc");
    } else if (version.includes("classic_beta")) {
      tocFile = path.join(addonFolderPath, "WeakAuras_Mists.toc");
    } else if (version.includes("classic")) {
      tocFile = path.join(addonFolderPath, "WeakAuras_Cata.toc");
    } else {
      tocFile = path.join(addonFolderPath, "WeakAuras.toc");
    }
  } else {
    // For other addons like Plater, use the standard naming convention
    tocFile = path.join(addonFolderPath, `${addonName}.toc`);
  }

  const isSymlink = (filePath: string): boolean => {
    try {
      return fs.lstatSync(filePath).isSymbolicLink();
    } catch (err) {
      console.log(err);
    }
    return false;
  };

  const getRealPath = (filePath: string): string => {
    try {
      return fs.realpathSync(filePath);
    } catch (err) {
      console.log(err);
    }
    return filePath;
  };

  const resolvedFolderPath = getRealPath(addonFolderPath);
  const resolvedTocFile = path.join(resolvedFolderPath, path.basename(tocFile));

  let tocContent: string;

  if (isSymlink(resolvedTocFile)) {
    const symlinkTarget = fs.readlinkSync(resolvedTocFile);
    const symlinkTargetPath = path.resolve(resolvedFolderPath, symlinkTarget);
    tocContent = fs.readFileSync(symlinkTargetPath, "utf8");
  } else {
    tocContent = fs.readFileSync(resolvedTocFile, "utf8");
  }

  const lines: string[] = tocContent.split("\n");
  let tocVersion = "";

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("## Interface: ")) {
      const parts: string[] = lines[i].split(" ");
      tocVersion = parts[2];
      break;
    }
  }

  return tocVersion || 100207; // Return the version if found, otherwise fallback to 100207
}
