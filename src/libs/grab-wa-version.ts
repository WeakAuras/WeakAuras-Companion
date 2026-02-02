import fs from "node:fs";
import path from "node:path";

const WOWDIR_TO_WA_TOC: Record<string, string> = {
  // Retail family (Midnight / TWW, PTR/Beta inclus)
  _retail_: "WeakAuras.toc",
  _ptr_: "WeakAuras.toc",
  _xptr_: "WeakAuras.toc",
  _beta_: "WeakAuras.toc",

  // MoP Classic family
  _classic_: "WeakAuras_Mists.toc",
  _classic_ptr_: "WeakAuras_Mists.toc",
  _classic_beta_: "WeakAuras_Mists.toc",

  // Titan Reforged
  _classic_titan_: "WeakAuras_Wrath.toc",

  // Anniversary Edition (BC Classic Anniversary)
  _anniversary_: "WeakAuras_TBC.toc",
  _classic_era_ptr_: "WeakAuras_TBC.toc",

  // Classic Era
  _classic_era_: "WeakAuras_Vanilla.toc",
};

function normalizeDirValue(dirValue: string): string {
  return dirValue.trim().toLowerCase();
}

function pickExistingWeakAurasToc(resolvedFolderPath: string): string | null {
  const candidates = [
    "WeakAuras.toc",
    "WeakAuras_Mists.toc",
    "WeakAuras_TBC.toc",
    "WeakAuras_Wrath.toc",
    "WeakAuras_Vanilla.toc",
    "WeakAuras_Cata.toc",
  ];

  for (const f of candidates) {
    const p = path.join(resolvedFolderPath, f);
    if (fs.existsSync(p)) return p;
  }

  // fallback ultra-robuste: n'importe quel WeakAuras*.toc
  try {
    const any = fs
      .readdirSync(resolvedFolderPath)
      .find((n) => /^WeakAuras.*\.toc$/i.test(n));
    return any ? path.join(resolvedFolderPath, any) : null;
  } catch {
    return null;
  }
}

export function grabVersionFromToc(
  wowPath: string,
  version: string,
): string | number {
  const dirValue = normalizeDirValue(version);

  const waFolderPath = path.join(
    wowPath,
    version, // on garde la casse originale dans le path
    "Interface",
    "AddOns",
    "WeakAuras",
  );

  const isSymlink = (filePath: string): boolean => {
    try {
      return fs.lstatSync(filePath).isSymbolicLink();
    } catch (err) {
      console.log(err);
      return false;
    }
  };

  const getRealPath = (filePath: string): string => {
    try {
      return fs.realpathSync(filePath);
    } catch (err) {
      console.log(err);
      return filePath;
    }
  };

  const resolvedFolderPath = getRealPath(waFolderPath);

  // 1) Choix "normal" via mapping strict
  const mappedTocName = WOWDIR_TO_WA_TOC[dirValue];
  let resolvedTocFile: string | null = mappedTocName
    ? path.join(resolvedFolderPath, mappedTocName)
    : null;

  // 2) Si le mapping est absent ou que le fichier n'existe pas -> fallback
  if (!resolvedTocFile || !fs.existsSync(resolvedTocFile)) {
    resolvedTocFile = pickExistingWeakAurasToc(resolvedFolderPath);
  }

  if (!resolvedTocFile) {
    return 120000;
  }

  let tocContent: string;
  if (isSymlink(resolvedTocFile)) {
    const symlinkTarget = fs.readlinkSync(resolvedTocFile);
    const symlinkTargetPath = path.resolve(resolvedFolderPath, symlinkTarget);
    tocContent = fs.readFileSync(symlinkTargetPath, "utf8");
  } else {
    tocContent = fs.readFileSync(resolvedTocFile, "utf8");
  }

  const match = tocContent.match(/^##\s*Interface:\s*(\d+)/m);
  if (match?.[1]) return match[1];

  return 120000;
}
