import fs from "fs";
import path from "path";

export function grabVersionFromToc(wowPath: string, version: string) {
  const waFolderPath = path.join(wowPath, version, "Interface", "AddOns", "WeakAuras");
  const waTocFile = version.includes("classic")
    ? path.join(waFolderPath, "WeakAuras_Wrath.toc")
    : version.includes("era")
    ? path.join(waFolderPath, "WeakAuras_Vanilla.toc")
    : path.join(waFolderPath, "WeakAuras.toc");

  // TODO: Symlink handling
  // const isSymlink = function(waFolderPath) {
  //   try {
  //     return fs.lstatSync(waFolderPath).isSymbolicLink();
  //   } catch (err) {
  //     console.log(err);
  //   }
  //   return null;
  // };

  // if (isSymlink) {
  //   fs.readlink(path.join(waFolderPath), (err, linkString) => {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       console.log("Path of the symlink:", linkString);
  //     }
  //   });
  // }

  if (fs.existsSync(waTocFile)) {
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
  return 100100; // Fallback
}
