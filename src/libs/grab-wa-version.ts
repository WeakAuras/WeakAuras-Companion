import fs from "node:fs";
import path from "node:path";

export function grabVersionFromToc(
  wowPath: string | null, // Added null check for wowPath parameter
  version: string | null, // Added null check for version parameter
): string | number {
  if (!wowPath || !version) return ""; // Added null check for wowPath and version

  const waFolderPath = path.join(
    wowPath,
    version,
    "Interface",
    "AddOns",
    "WeakAuras",
  );
  let waTocFile;
  if (version.includes("classic_era")) {
    waTocFile = path.join(waFolderPath, "WeakAuras_Vanilla.toc");
  } else if (version.includes("classic_beta")) {
    waTocFile = path.join(waFolderPath, "WeakAuras_Cata.toc");
  } else if (version.includes("classic")) {
    waTocFile = path.join(waFolderPath, "WeakAuras_Cata.toc");
  } else {
    waTocFile = path.join(waFolderPath, "WeakAuras.toc");
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

  const resolvedFolderPath = getRealPath(waFolderPath);
  const resolvedTocFile = path.join(
    resolvedFolderPath,
    path.basename(waTocFile),
  );

  let tocContent: string;

  if (isSymlink(resolvedTocFile)) {
    const symlinkTarget = fs.readlinkSync(resolvedTocFile);
    const symlinkTargetPath = path.resolve(resolvedFolderPath, symlinkTarget);
    tocContent = fs.readFileSync(symlinkTargetPath, "utf8");
  } else {
    tocContent = fs.readFileSync(resolvedTocFile, "utf8");
  }

  const lines: string[] = tocContent.split("\n");
  let waTocVersion = "";

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("## Interface: ")) {
      const parts: string[] = lines[i].split(" ");
      waTocVersion = parts[2];
      break;
    }
  }

  return waTocVersion || 100207; // Return the version if found, otherwise fallback to 100207
}
