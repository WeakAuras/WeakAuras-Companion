import fs from "fs";
import path from "path";

export const grabVersionFromToc = (wowPath: string, version: string): string | number => {
  const waFolderPath = path.join(wowPath, version, "Interface", "AddOns", "WeakAuras");
  const waTocFile = version.includes("classic")
    ? path.join(waFolderPath, "WeakAuras_Wrath.toc")
    : version.includes("era")
    ? path.join(waFolderPath, "WeakAuras_Vanilla.toc")
    : path.join(waFolderPath, "WeakAuras.toc");

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
  const resolvedTocFile = path.join(resolvedFolderPath, path.basename(waTocFile));

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

  return waTocVersion || 100100; // Return the version if found, otherwise fallback to 100100
};
